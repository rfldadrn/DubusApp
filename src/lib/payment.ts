import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

/**
 * Get payment summary untuk sebuah transaksi
 */
export async function getPaymentSummary(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      totalAmount: true,
      paymentStatus: true,
      payments: {
        orderBy: { paidAt: "asc" },
        select: {
          id: true,
          amount: true,
          balanceAfter: true,
          note: true,
          paidAt: true,
          paymentType: { select: { name: true } },
          receivedByUser: { select: { fullName: true } },
        },
      },
    },
  });

  if (!transaction) return null;

  const totalPaid = transaction.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const balanceDue = Number(transaction.totalAmount) - totalPaid;

  return {
    totalAmount: Number(transaction.totalAmount),
    totalPaid,
    balanceDue,
    paymentStatus: transaction.paymentStatus,
    hasDebt: balanceDue > 0,
    paymentLogs: transaction.payments,
  };
}

/**
 * Add payment dan update payment status
 */
export async function addPayment({
  transactionId,
  amount,
  paymentTypeId,
  walletId,
  note,
  receivedBy,
}: {
  transactionId: number;
  amount: number;
  paymentTypeId: number;
  walletId: number;
  note?: string;
  receivedBy: number;
}) {
  const existing = await prisma.payment.aggregate({
    where: { transactionId },
    _sum: { amount: true },
  });

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { totalAmount: true },
  });

  if (!transaction) throw new Error("Transaksi tidak ditemukan");

  const previouslyPaid = Number(existing._sum.amount ?? 0);
  const newTotalPaid = previouslyPaid + amount;
  const balanceAfter = Number(transaction.totalAmount) - newTotalPaid;

  let paymentStatus: PaymentStatus;
  if (newTotalPaid <= 0) {
    paymentStatus = PaymentStatus.Unpaid;
  } else if (balanceAfter > 0) {
    paymentStatus = PaymentStatus.Partial;
  } else {
    paymentStatus = PaymentStatus.Paid;
  }

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        transactionId,
        amount,
        balanceAfter,
        paymentTypeId,
        walletId,
        note,
        receivedBy,
      },
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { paymentStatus },
    }),
    prisma.cashLedger.create({
      data: {
        type: "Debit",
        category: "Penjualan",
        description: `Pembayaran transaksi #${transactionId}`,
        amount,
        walletId,
        createdBy: receivedBy,
      },
    }),
  ]);

  return payment;
}

/**
 * Generate next transaction code
 */
export async function generateNextTransactionCode(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}${month}`;

  const result = await prisma.$transaction(async (tx) => {
    const sequence = await tx.sequence.findUnique({
      where: { key: "transaction" },
    });

    if (!sequence) {
      throw new Error("Sequence not found");
    }

    const nextNumber = sequence.lastNumber + 1;

    await tx.sequence.update({
      where: { key: "transaction" },
      data: { lastNumber: nextNumber },
    });

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  });

  return result;
}
