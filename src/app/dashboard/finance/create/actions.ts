"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPayment(data: {
  transactionId: number;
  amount: number;
  paymentTypeId: number;
  walletId: number;
  note?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "Jumlah pembayaran harus lebih dari 0" };
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: { payments: true },
    });

    if (!transaction) return { success: false, error: "Transaction not found" };

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
          transactionId: data.transactionId,
          amount: data.amount,
          balanceAfter,
          paymentTypeId: data.paymentTypeId,
          walletId: data.walletId,
          receivedBy: Number(session.user.id),
          note: data.note,
        },
      });

      const newStatus = balanceAfter <= 0 ? "Paid" : paid + data.amount > 0 ? "Partial" : "Unpaid";
      await tx.transaction.update({
        where: { id: data.transactionId },
        data: { paymentStatus: newStatus },
      });

      await tx.cashLedger.create({
        data: {
          type: "Debit",
          category: "Pembayaran Pelanggan",
          description: `Pembayaran ${transaction.transactionCode}`,
          amount: data.amount,
          walletId: data.walletId,
          paymentId: createdPayment.id,
          createdBy: Number(session.user.id),
        },
      });

      return createdPayment;
    });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/finance/create");
    revalidatePath("/dashboard/finance/cashbook");
    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/transactions/${data.transactionId}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error("Create payment error:", error);
    return { success: false, error: "Failed to create payment" };
  }
}
