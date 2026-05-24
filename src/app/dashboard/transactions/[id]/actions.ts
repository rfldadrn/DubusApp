"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Pickup items - mark selected items as "DIAMBIL" (picked up)
 * Supports partial pickup (some items) and full pickup (all items)
 */
export async function pickupItems(data: {
  transactionId: number;
  itemIds: number[];
  pickerName?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const userId = Number(session.user.id);

    if (data.itemIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 item untuk diambil" };
    }

    // Get DIAMBIL status
    const diambilStatus = await prisma.statusItem.findFirst({
      where: { code: "DIAMBIL", rowStatus: true },
    });
    if (!diambilStatus) {
      return { success: false, error: "Status DIAMBIL tidak ditemukan di sistem" };
    }

    // Verify all items belong to this transaction and are ready (status OK)
    const items = await prisma.transactionItem.findMany({
      where: {
        id: { in: data.itemIds },
        transactionId: data.transactionId,
        rowStatus: true,
      },
      include: { statusItem: true },
    });

    if (items.length !== data.itemIds.length) {
      return { success: false, error: "Beberapa item tidak valid" };
    }

    const notReadyItems = items.filter(
      (item) => item.statusItem.code !== "OK" && item.statusItem.code !== "DIAMBIL"
    );
    if (notReadyItems.length > 0) {
      return { success: false, error: "Beberapa item belum selesai produksi (status bukan OK)" };
    }

    // Update each item to DIAMBIL
    for (const item of items) {
      if (item.statusItem.code === "DIAMBIL") continue; // Already picked up

      await prisma.transactionItem.update({
        where: { id: item.id },
        data: { statusItemId: diambilStatus.id },
      });

      // Create production log
      await prisma.productionLog.create({
        data: {
          transactionItemId: item.id,
          fromStatusId: item.statusItemId,
          toStatusId: diambilStatus.id,
          notes: data.notes
            ? `Diambil oleh ${data.pickerName || "pelanggan"}: ${data.notes}`
            : `Diambil oleh ${data.pickerName || "pelanggan"}`,
          updatedBy: userId,
        },
      });
    }

    // Check if ALL items in transaction are now DIAMBIL
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId: data.transactionId, rowStatus: true },
      include: { statusItem: true },
    });

    const allPickedUp = allItems.every((item) => item.statusItem.code === "DIAMBIL");

    if (allPickedUp) {
      // Check payment status to determine transaction status
      const transaction = await prisma.transaction.findUnique({
        where: { id: data.transactionId },
        include: { payments: true },
      });

      if (transaction) {
        const totalPaid = transaction.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const isPaid = totalPaid >= Number(transaction.totalAmount);

        // SELESAI if paid, BB (Belum Bayar) if not
        const statusCode = isPaid ? "SELESAI" : "BB";
        const transactionStatus = await prisma.statusTransaction.findFirst({
          where: { code: statusCode },
        });

        if (transactionStatus) {
          await prisma.transaction.update({
            where: { id: data.transactionId },
            data: {
              statusTransactionId: transactionStatus.id,
              completionDate: new Date(),
            },
          });
        }
      }
    }

    revalidatePath(`/dashboard/transactions/${data.transactionId}`);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/production");
    return {
      success: true,
      allPickedUp,
      message: allPickedUp
        ? "Semua item sudah diambil, transaksi selesai"
        : `${data.itemIds.length} item berhasil ditandai diambil`,
    };
  } catch (error) {
    console.error("Error picking up items:", error);
    return { success: false, error: "Gagal memproses pengambilan" };
  }
}

/**
 * Cancel a transaction
 * Sets status to BTL (Batal)
 */
export async function cancelTransaction(data: {
  transactionId: number;
  reason: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.reason || data.reason.trim().length < 3) {
      return { success: false, error: "Alasan pembatalan harus diisi (min 3 karakter)" };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        statusTransaction: true,
        items: { include: { statusItem: true } },
        payments: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    // Already cancelled
    if (transaction.statusTransaction.code === "BTL") {
      return { success: false, error: "Transaksi sudah dibatalkan" };
    }

    // Already completed
    if (transaction.statusTransaction.code === "SELESAI") {
      return { success: false, error: "Transaksi yang sudah selesai tidak bisa dibatalkan" };
    }

    // Get BTL status
    const btlStatus = await prisma.statusTransaction.findFirst({
      where: { code: "BTL" },
    });
    if (!btlStatus) {
      return { success: false, error: "Status BTL tidak ditemukan" };
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        statusTransactionId: btlStatus.id,
        note: `${transaction.note ? transaction.note + " | " : ""}DIBATALKAN: ${data.reason}`,
      },
    });

    // Soft-delete all items
    await prisma.transactionItem.updateMany({
      where: { transactionId: data.transactionId },
      data: { rowStatus: false },
    });

    // If there are payments, note it (refund is manual)
    const totalPaid = transaction.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    revalidatePath(`/dashboard/transactions/${data.transactionId}`);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/production");
    return {
      success: true,
      hasPaidAmount: totalPaid > 0,
      paidAmount: totalPaid,
      message: totalPaid > 0
        ? `Transaksi dibatalkan. Pelanggan sudah membayar Rp ${totalPaid.toLocaleString("id-ID")} - perlu proses refund manual.`
        : "Transaksi berhasil dibatalkan",
    };
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return { success: false, error: "Gagal membatalkan transaksi" };
  }
}
