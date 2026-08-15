"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, transactionDetailTag } from "@/lib/cache-tags";
import { writeAuditLog } from "@/lib/audit";

/**
 * Pickup items - mark selected items as "DIAMBIL" (picked up)
 * Supports partial pickup (some items) and full pickup (all items)
 */
export async function pickupItems(data: {
  transactionId: number;
  itemIds: number[];
  pickerName?: string;
  notes?: string;
  payment?: {
    amount: number;
    paymentTypeId: number;
    walletId: number;
    note?: string;
  };
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const userId = Number(session.user.id);

    if (data.itemIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 item untuk diambil" };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: {
        payments: true,
        statusTransaction: true,
      },
    });

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" };
    }

    const totalPaidBefore = transaction.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(transaction.totalAmount);
    const remainingBefore = Math.max(0, totalAmount - totalPaidBefore);

    const paymentAmount = Number(data.payment?.amount || 0);
    const shouldCreatePayment = paymentAmount > 0;

    if (shouldCreatePayment) {
      if (!data.payment?.paymentTypeId || !data.payment?.walletId) {
        return { success: false, error: "Metode pembayaran dan wallet wajib diisi" };
      }

      if (paymentAmount <= 0) {
        return { success: false, error: "Jumlah pembayaran harus lebih dari 0" };
      }

      if (paymentAmount > remainingBefore) {
        return {
          success: false,
          error: `Jumlah melebihi sisa tagihan (sisa Rp ${remainingBefore.toLocaleString("id-ID")})`,
        };
      }
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

    if (shouldCreatePayment && data.payment) {
      const newTotalPaid = totalPaidBefore + paymentAmount;
      const balanceAfter = Math.max(0, totalAmount - newTotalPaid);

      const createdPayment = await prisma.payment.create({
        data: {
          transactionId: data.transactionId,
          amount: paymentAmount,
          balanceAfter,
          paymentTypeId: data.payment.paymentTypeId,
          walletId: data.payment.walletId,
          receivedBy: userId,
          note: data.payment.note || "Pembayaran saat pengambilan pakaian",
        },
      });

      await prisma.cashLedger.create({
        data: {
          entryDate: transaction.transactionDate,
          type: "Debit",
          category: "Pembayaran Pelanggan",
          description: `[TRX:${transaction.id}] Pembayaran ${transaction.transactionCode}`,
          amount: paymentAmount,
          walletId: data.payment.walletId,
          paymentId: createdPayment.id,
          createdBy: userId,
        },
      });

      await writeAuditLog({
        userId,
        action: "CREATE_PICKUP_PAYMENT",
        tableName: "payments",
        recordId: createdPayment.id,
        newValues: {
          transactionId: data.transactionId,
          amount: paymentAmount,
          walletId: data.payment.walletId,
          paymentTypeId: data.payment.paymentTypeId,
        },
      });
    }

    // Check if ALL items in transaction are now DIAMBIL
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId: data.transactionId, rowStatus: true },
      include: { statusItem: true },
    });

    const allPickedUp = allItems.every((item) => item.statusItem.code === "DIAMBIL");
    const totalPaidAfter = totalPaidBefore + (shouldCreatePayment ? paymentAmount : 0);
    const isPaidAfter = totalPaidAfter >= totalAmount;
    const paymentStatus = isPaidAfter ? "Paid" : totalPaidAfter > 0 ? "Partial" : "Unpaid";

    const updateTransactionData: {
      paymentStatus: "Paid" | "Partial" | "Unpaid";
      statusTransactionId?: number;
      completionDate?: Date | null;
    } = {
      paymentStatus,
    };

    if (allPickedUp) {
      // SELESAI if paid, BB (Belum Bayar) if not
      const statusCode = isPaidAfter ? "SELESAI" : "BB";
      const transactionStatus = await prisma.statusTransaction.findFirst({
        where: { code: statusCode },
      });

      if (transactionStatus) {
        updateTransactionData.statusTransactionId = transactionStatus.id;
        updateTransactionData.completionDate = new Date();
      }
    }

    await prisma.transaction.update({
      where: { id: data.transactionId },
      data: updateTransactionData,
    });

    revalidatePath(`/dashboard/transactions/${data.transactionId}`);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/finance/create");
    revalidatePath("/dashboard/finance/cashbook");
    revalidateTag(transactionDetailTag(data.transactionId));
    revalidateTag(CACHE_TAGS.transactions);
    revalidateTag(CACHE_TAGS.production);
    revalidateTag(CACHE_TAGS.dashboard);
    return {
      success: true,
      allPickedUp,
      message: allPickedUp
        ? isPaidAfter
          ? "Semua item diambil dan transaksi lunas"
          : "Semua item diambil, transaksi belum lunas"
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
    const userId = Number(session.user.id);

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

    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: {
          statusTransactionId: btlStatus.id,
          paymentStatus: "Unpaid",
          note: `${transaction.note ? transaction.note + " | " : ""}DIBATALKAN: ${data.reason}`,
          completionDate: null,
        },
      });

      // Soft-delete all items
      await tx.transactionItem.updateMany({
        where: { transactionId: data.transactionId },
        data: { rowStatus: false },
      });

      const paidPayments = transaction.payments.filter((payment) => Number(payment.amount) > 0);
      const paidPerWallet = new Map<number, number>();
      for (const payment of paidPayments) {
        const existingAmount = paidPerWallet.get(payment.walletId) || 0;
        paidPerWallet.set(payment.walletId, existingAmount + Number(payment.amount));
      }

      for (const [walletId, amount] of paidPerWallet.entries()) {
        await tx.cashLedger.create({
          data: {
            entryDate: new Date(),
            type: "Credit",
            category: "Pembatalan Transaksi",
            description: `[TRX:${transaction.id}] Reversal pembayaran ${transaction.transactionCode}`,
            amount,
            walletId,
            createdBy: userId,
          },
        });
      }
    });

    // If there are payments, note it (refund is manual)
    const totalPaid = transaction.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    await writeAuditLog({
      userId,
      action: "CANCEL_TRANSACTION",
      tableName: "transactions",
      recordId: data.transactionId,
      oldValues: {
        statusTransactionId: transaction.statusTransactionId,
        paymentStatus: transaction.paymentStatus,
        totalPaid,
      },
      newValues: {
        statusTransactionId: btlStatus.id,
        paymentStatus: "Unpaid",
        reason: data.reason,
      },
    });

    revalidatePath(`/dashboard/transactions/${data.transactionId}`);
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/production");
    revalidateTag(transactionDetailTag(data.transactionId));
    revalidateTag(CACHE_TAGS.transactions);
    revalidateTag(CACHE_TAGS.production);
    revalidateTag(CACHE_TAGS.dashboard);
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
