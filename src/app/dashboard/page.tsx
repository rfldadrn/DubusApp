import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";
import { DashboardClient } from "./dashboard-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    totalTransactions,
    totalCustomers,
    pendingTransactions,
    inProductionItems,
    recentTransactions,
    urgentItemsRaw,
    productionItems,
    monthlyRevenue,
    monthlyExpenses,
    last6MonthsLedger,
  ] = await Promise.all([
    prisma.transaction.count({ where: { rowStatus: true } }),
    prisma.customer.count({ where: { rowStatus: true } }),
    prisma.transaction.count({
      where: { rowStatus: true, paymentStatus: { in: ["Unpaid", "Partial"] } },
    }),
    prisma.transactionItem.count({
      where: {
        rowStatus: true,
        statusItem: { code: { notIn: ["OK", "DIAMBIL"] } },
      },
    }),
    prisma.transaction.findMany({
      where: { rowStatus: true },
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        statusTransaction: true,
      },
    }),
    prisma.transactionItem.findMany({
      where: {
        rowStatus: true,
        targetDate: { not: null },
        statusItem: { code: { notIn: ["OK", "DIAMBIL"] } },
      },
      include: {
        transaction: { include: { customer: true } },
        item: true,
        statusItem: true,
      },
      orderBy: { targetDate: "asc" },
      take: 50,
    }),
    prisma.transactionItem.findMany({
      where: {
        rowStatus: true,
        statusItem: { code: { notIn: ["OK", "DIAMBIL"] } },
      },
      include: { statusItem: true },
    }),
    prisma.cashLedger.aggregate({
      where: { type: "Debit", entryDate: { gte: startOfMonth, lt: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.cashLedger.aggregate({
      where: { type: "Credit", entryDate: { gte: startOfMonth, lt: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.cashLedger.findMany({
      where: {
        entryDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          lt: endOfMonth,
        },
      },
      select: { entryDate: true, type: true, amount: true },
    }),
  ]);

  // Build production by status
  const statusCounts: Record<string, { name: string; count: number; color: string }> = {};
  for (const item of productionItems) {
    const key = item.statusItem?.code || "UNKNOWN";
    if (!statusCounts[key]) {
      statusCounts[key] = {
        name: item.statusItem?.name || key,
        count: 0,
        color: item.statusItem?.colorSlug || "gray",
      };
    }
    statusCounts[key].count++;
  }

  // Build revenue by month (last 6 months)
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const revenueByMonth: Record<string, { month: string; revenue: number; expenses: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth[key] = {
      month: months[d.getMonth()],
      revenue: 0,
      expenses: 0,
    };
  }
  for (const entry of last6MonthsLedger) {
    const d = new Date(entry.entryDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (revenueByMonth[key]) {
      if (entry.type === "Debit") {
        revenueByMonth[key].revenue += Number(entry.amount);
      } else {
        revenueByMonth[key].expenses += Number(entry.amount);
      }
    }
  }

  // Urgent items with days left
  const urgentItems = urgentItemsRaw
    .map((ti) => ({
      id: ti.id,
      transactionId: ti.transaction.id,
      transactionCode: ti.transaction.transactionCode,
      customerName: ti.transaction.customer.name,
      itemName: ti.item.name,
      targetDate: ti.targetDate!.toISOString(),
      daysLeft: differenceInDays(new Date(ti.targetDate!), now),
      statusName: ti.statusItem?.name || "",
      statusColor: ti.statusItem?.colorSlug || "gray",
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    totalTransactions,
    totalCustomers,
    pendingTransactions,
    inProductionItems,
    totalRevenue: Number(monthlyRevenue._sum.amount || 0),
    totalExpenses: Number(monthlyExpenses._sum.amount || 0),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      transactionCode: t.transactionCode,
      customerName: t.customer.name,
      totalAmount: Number(t.totalAmount),
      paymentStatus: t.paymentStatus,
      statusName: t.statusTransaction?.name || "",
      statusColor: t.statusTransaction?.colorSlug || "",
      transactionDate: t.transactionDate.toISOString(),
    })),
    urgentItems,
    productionByStatus: Object.values(statusCounts),
    revenueByMonth: Object.values(revenueByMonth),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  return (
    <DashboardClient
      data={{
        ...data,
        userName: (session?.user as any)?.name || "User",
      }}
    />
  );
}
