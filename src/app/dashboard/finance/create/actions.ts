"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";

export async function createPayment(data: {
  transactionId?: number;
  amount: number;
  paymentTypeId: number;
  walletId: number;
  note?: string;
  entryDate?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Jumlah pembayaran harus lebih dari 0" };
    }

    const userId = Number(session.user.id);
    const hasTransaction = Number.isFinite(Number(data.transactionId)) && Number(data.transactionId) > 0;

    if (!hasTransaction) {
      const note = (data.note || "").trim();
      if (!note) {
        return { success: false, error: "Catatan wajib diisi untuk pemasukan tanpa transaksi" };
      }

      const createdEntry = await prisma.cashLedger.create({
        data: {
          entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
          type: "Debit",
          category: "Pemasukan Non Transaksi",
          description: note,
          amount: data.amount,
          walletId: data.walletId,
          createdBy: userId,
        },
      });

      await writeAuditLog({
        userId,
        action: "CREATE_NON_TRANSACTION_INCOME",
        tableName: "cash_ledger",
        recordId: createdEntry.id,
        newValues: {
          amount: data.amount,
          walletId: data.walletId,
          description: note,
        },
      });

      revalidatePath("/dashboard/finance");
      revalidatePath("/dashboard/finance/create");
      revalidatePath("/dashboard/finance/cashbook");
      return { success: true, data: null };
    }

    const transactionId = Number(data.transactionId);
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { payments: true, statusTransaction: true },
    });

    if (!transaction) return { success: false, error: "Transaction not found" };
    if (transaction.statusTransaction.code === "BTL") {
      return { success: false, error: "Transaksi dibatalkan, tidak bisa menerima pembayaran" };
    }

    const paid = transaction.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBefore = Number(transaction.totalAmount) - paid;
    if (data.amount > remainingBefore) {
      return {
        success: false,
        error: `Jumlah melebihi sisa tagihan (sisa Rp ${remainingBefore.toLocaleString("id-ID")})`,
      };
    }

    const balanceAfter = Number(transaction.totalAmount) - (paid + data.amount);

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          transactionId,
          amount: data.amount,
          balanceAfter,
          paymentTypeId: data.paymentTypeId,
          walletId: data.walletId,
          receivedBy: userId,
          note: data.note,
        },
      });

      const newStatus = balanceAfter <= 0 ? "Paid" : paid + data.amount > 0 ? "Partial" : "Unpaid";
      await tx.transaction.update({
        where: { id: transactionId },
        data: { paymentStatus: newStatus },
      });

      await tx.cashLedger.create({
        data: {
          entryDate: transaction.transactionDate,
          type: "Debit",
          category: "Pembayaran Pelanggan",
          description: `[TRX:${transaction.id}] Pembayaran ${transaction.transactionCode}`,
          amount: data.amount,
          walletId: data.walletId,
          paymentId: createdPayment.id,
          createdBy: userId,
        },
      });

      return createdPayment;
    });

    await writeAuditLog({
      userId,
      action: "CREATE_PAYMENT",
      tableName: "payments",
      recordId: payment.id,
      newValues: {
        transactionId,
        amount: data.amount,
        balanceAfter,
        paymentTypeId: data.paymentTypeId,
        walletId: data.walletId,
      },
    });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/finance/create");
    revalidatePath("/dashboard/finance/cashbook");
    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/transactions/${transactionId}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error("Create payment error:", error);
    return { success: false, error: "Failed to create payment" };
  }
}
