"use server";

import { prisma } from "@/lib/prisma";

export interface TrackingResult {
  found: boolean;
  transaction?: {
    transactionCode: string;
    customerName: string;
    transactionDate: string;
    statusName: string;
    statusColor: string;
    paymentStatus: string;
    paymentStatusLabel: string;
    totalAmount: number;
    items: {
      id: number;
      itemName: string;
      statusName: string;
      statusCode: string;
      statusColor: string;
      statusSequence: number;
      completedSteps: {
        statusName: string;
        statusCode: string;
        date: string;
      }[];
    }[];
  };
  error?: string;
}

export async function trackOrder(code: string): Promise<TrackingResult> {
  if (!code?.trim()) {
    return { found: false, error: "Masukkan kode transaksi" };
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      transactionCode: code.trim().toUpperCase(),
      rowStatus: true,
    },
    include: {
      customer: true,
      statusTransaction: true,
      items: {
        where: { rowStatus: true },
        include: {
          item: true,
          statusItem: true,
        },
      },
    },
  });

  if (!transaction) {
    return { found: false, error: "Pesanan tidak ditemukan. Periksa kode transaksi Anda." };
  }

  // Only show active orders (not completed/picked up)
  if (transaction.statusTransaction.code === "SELESAI" && 
      transaction.items.every((i) => i.statusItem.code === "DIAMBIL")) {
    return { found: false, error: "Pesanan ini sudah selesai dan telah diambil." };
  }

  // Get production logs for each item to show only actual steps
  const allStatuses = await prisma.statusItem.findMany({
    where: { rowStatus: true },
    orderBy: { sequence: "asc" },
  });
  const statusMap = Object.fromEntries(allStatuses.map((s) => [s.id, s]));

  const itemIds = transaction.items.map((i) => i.id);
  const productionLogs = await prisma.productionLog.findMany({
    where: { transactionItemId: { in: itemIds } },
    orderBy: { createdAt: "asc" },
  });

  // Group logs by item
  const logsByItem = new Map<number, typeof productionLogs>();
  for (const log of productionLogs) {
    const existing = logsByItem.get(log.transactionItemId) || [];
    existing.push(log);
    logsByItem.set(log.transactionItemId, existing);
  }

  return {
    found: true,
    transaction: {
      transactionCode: transaction.transactionCode,
      customerName: transaction.customer.name,
      transactionDate: transaction.transactionDate.toISOString().slice(0, 10),
      statusName: transaction.statusTransaction.name,
      statusColor: transaction.statusTransaction.colorSlug || "gray",
      paymentStatus: transaction.paymentStatus,
      paymentStatusLabel:
        transaction.type === "Agency" && Number(transaction.totalAmount) <= 0
          ? "Ditanggung Agency"
          : transaction.paymentStatus === "Paid"
          ? "Lunas"
          : transaction.paymentStatus === "Partial"
          ? "Sebagian"
          : "Belum Bayar",
      totalAmount: Number(transaction.totalAmount),
      items: transaction.items.map((i) => {
        const itemLogs = logsByItem.get(i.id) || [];
        // Build completed steps from production logs (unique toStatus)
        const seenStatuses = new Set<number>();
        const completedSteps: { statusName: string; statusCode: string; date: string }[] = [];
        
        for (const log of itemLogs) {
          if (!seenStatuses.has(log.toStatusId)) {
            seenStatuses.add(log.toStatusId);
            const status = statusMap[log.toStatusId];
            if (status) {
              completedSteps.push({
                statusName: status.name,
                statusCode: status.code,
                date: log.createdAt.toISOString(),
              });
            }
          }
        }

        return {
          id: i.id,
          itemName: i.item.name,
          statusName: i.statusItem.name,
          statusCode: i.statusItem.code,
          statusColor: i.statusItem.colorSlug || "gray",
          statusSequence: i.statusItem.sequence,
          completedSteps,
        };
      }),
    },
  };
}
