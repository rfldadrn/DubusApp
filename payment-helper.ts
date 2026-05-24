// ============================================================
// FILE: src/lib/payment.ts
// Helper untuk kalkulasi pembayaran & update paymentStatus
// ============================================================

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

// ============================================================
// Kalkulasi ringkasan pembayaran sebuah transaksi
// Dipakai di halaman detail transaksi & laporan piutang
// ============================================================
export async function getPaymentSummary(transactionId: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      totalAmount: true,
      paymentStatus: true,
      payments: {
        where: {},
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

// ============================================================
// Tambah pembayaran baru + update paymentStatus di transaksi
// Dipanggil setiap kali pelanggan bayar (DP, cicilan, lunas)
// ============================================================
export async function addPayment({
  transactionId,
  amount,
  paymentTypeId,
  note,
  receivedBy,
}: {
  transactionId: number;
  amount: number;
  paymentTypeId: number;
  note?: string;
  receivedBy: number;
}) {
  // Hitung total yang sudah dibayar sebelumnya
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

  // Tentukan status pembayaran baru
  let paymentStatus: PaymentStatus;
  if (newTotalPaid <= 0) {
    paymentStatus = PaymentStatus.Unpaid;
  } else if (balanceAfter > 0) {
    paymentStatus = PaymentStatus.Partial;
  } else {
    paymentStatus = PaymentStatus.Paid;
  }

  // Simpan payment + update status dalam 1 transaction (atomic)
  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        transactionId,
        amount,
        balanceAfter: balanceAfter < 0 ? 0 : balanceAfter, // tidak bisa minus
        paymentTypeId,
        note,
        receivedBy,
      },
    }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { paymentStatus },
    }),
  ]);

  return {
    payment,
    paymentStatus,
    totalPaid: newTotalPaid,
    balanceDue: balanceAfter < 0 ? 0 : balanceAfter,
  };
}

// ============================================================
// Ambil semua transaksi yang masih ada piutang (belum lunas)
// Dipakai di halaman laporan piutang
// ============================================================
export async function getOutstandingDebts(agencyId?: number) {
  const transactions = await prisma.transaction.findMany({
    where: {
      paymentStatus: { in: [PaymentStatus.Unpaid, PaymentStatus.Partial] },
      rowStatus: true,
      ...(agencyId ? { agencyId } : {}),
    },
    include: {
      customer: { select: { name: true, phoneNumber: true } },
      agency: { select: { name: true } },
      payments: {
        orderBy: { paidAt: "desc" },
        take: 1, // hanya ambil pembayaran terakhir
        select: { amount: true, balanceAfter: true, paidAt: true },
      },
      _count: { select: { payments: true } },
    },
    orderBy: { transactionDate: "asc" },
  });

  return transactions.map((t) => {
    const lastPayment = t.payments[0];
    return {
      id: t.id,
      transactionCode: t.transactionCode,
      customerName: t.customer.name,
      customerPhone: t.customer.phoneNumber,
      agencyName: t.agency?.name ?? null,
      transactionDate: t.transactionDate,
      totalAmount: Number(t.totalAmount),
      // balanceDue dari snapshot payment terakhir
      balanceDue: lastPayment ? Number(lastPayment.balanceAfter) : Number(t.totalAmount),
      lastPaymentDate: lastPayment?.paidAt ?? null,
      paymentCount: t._count.payments,
      paymentStatus: t.paymentStatus,
    };
  });
}
