"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCashLedgerEntries(filters?: {
  period?: "daily" | "weekly" | "monthly" | "yearly";
  date?: string;
  walletId?: number;
  type?: "Debit" | "Credit";
}) {
  const where: any = {};

  if (filters?.walletId) {
    where.walletId = filters.walletId;
  }
  if (filters?.type) {
    where.type = filters.type;
  }

  // Date filtering
  if (filters?.date) {
    const baseDate = new Date(filters.date);
    let startDate: Date;
    let endDate: Date;

    switch (filters?.period) {
      case "weekly": {
        const day = baseDate.getDay();
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      }
      case "monthly": {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        break;
      }
      case "yearly": {
        startDate = new Date(baseDate.getFullYear(), 0, 1);
        endDate = new Date(baseDate.getFullYear() + 1, 0, 1);
        break;
      }
      default: { // daily
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }

    where.entryDate = { gte: startDate, lt: endDate };
  }

  const entries = await prisma.cashLedger.findMany({
    where,
    include: {
      wallet: true,
      payment: { include: { transaction: { include: { customer: true } } } },
      payroll: { include: { employee: true } },
      createdByUser: true,
    },
    orderBy: { entryDate: "desc" },
  });

  const employeeIdsInDescription = Array.from(
    new Set(
      entries
        .map((e) => e.description.match(/^\[EMP:(\d+)(?:\|[^\]]+)?\]/)?.[1])
        .filter((v): v is string => Boolean(v))
        .map((v) => Number(v))
    )
  );

  const employees = employeeIdsInDescription.length
    ? await prisma.employee.findMany({
        where: { id: { in: employeeIdsInDescription } },
        select: { id: true, name: true },
      })
    : [];
  const employeeNameMap = new Map(employees.map((emp) => [emp.id, emp.name]));

  return entries.map((e) => {
    const markerMatch = e.description.match(/^\[EMP:(\d+)(?:\|([^\]]+))?\]\s*/);
    const markerEmployeeId = markerMatch ? Number(markerMatch[1]) : null;
    const markerEmployeeName = markerMatch?.[2] || (markerEmployeeId ? employeeNameMap.get(markerEmployeeId) : undefined);
    const normalizedDescription = markerMatch
      ? `${markerEmployeeName || "Karyawan"} - ${e.description.replace(markerMatch[0], "").trim()}`
      : e.description;

    return {
      id: e.id,
      entryDate: e.entryDate.toISOString(),
      type: e.type,
      category: e.category,
      description: normalizedDescription,
      amount: Number(e.amount),
      walletName: e.wallet.name,
      walletId: e.walletId,
      paymentId: e.paymentId,
      payrollId: e.payrollId,
      customerName: e.payment?.transaction?.customer?.name || null,
      employeeName: e.payroll?.employee?.name || null,
      createdBy: e.createdByUser.fullName,
    };
  });
}

export async function createCashLedgerEntry(data: {
  entryDate: string;
  type: "Debit" | "Credit";
  category: string;
  description: string;
  amount: number;
  walletId: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.cashLedger.create({
      data: {
        entryDate: new Date(data.entryDate),
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        walletId: data.walletId,
        createdBy: parseInt(session.user.id),
      },
    });

    revalidatePath("/dashboard/finance/cashbook");
    return { success: true };
  } catch (error) {
    console.error("Error creating cash ledger entry:", error);
    return { success: false, error: "Gagal menambahkan entri" };
  }
}

export async function deleteCashLedgerEntry(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const entry = await prisma.cashLedger.findUnique({ where: { id } });
    if (!entry) return { success: false, error: "Entri tidak ditemukan" };

    // Don't allow deleting auto-generated entries (from payments/payroll)
    if (entry.paymentId || entry.payrollId) {
      return { success: false, error: "Entri otomatis dari pembayaran/gaji tidak bisa dihapus manual" };
    }

    await prisma.cashLedger.delete({ where: { id } });

    revalidatePath("/dashboard/finance/cashbook");
    return { success: true };
  } catch (error) {
    console.error("Error deleting cash ledger entry:", error);
    return { success: false, error: "Gagal menghapus entri" };
  }
}

export async function updateCashLedgerEntry(id: number, data: {
  entryDate: string;
  type: "Debit" | "Credit";
  category: string;
  description: string;
  amount: number;
  walletId: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const entry = await prisma.cashLedger.findUnique({ where: { id } });
    if (!entry) return { success: false, error: "Entri tidak ditemukan" };

    if (entry.paymentId || entry.payrollId) {
      return { success: false, error: "Entri otomatis dari pembayaran/gaji tidak bisa diedit manual" };
    }

    await prisma.cashLedger.update({
      where: { id },
      data: {
        entryDate: new Date(data.entryDate),
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        walletId: data.walletId,
      },
    });

    revalidatePath("/dashboard/finance/cashbook");
    return { success: true };
  } catch (error) {
    console.error("Error updating cash ledger entry:", error);
    return { success: false, error: "Gagal mengupdate entri" };
  }
}

export async function getWallets() {
  const wallets = await prisma.wallet.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return wallets.map((w) => ({
    id: w.id,
    name: w.name,
    walletType: w.walletType,
    bankName: w.bankName,
    accountNumber: w.accountNumber,
    openingBalance: Number(w.openingBalance),
    openingDate: w.openingDate.toISOString(),
    isActive: w.isActive,
    notes: w.notes,
  }));
}

export async function getCashSummary(walletId?: number, date?: string, period?: string) {
  const where: any = {};
  if (walletId) where.walletId = walletId;

  if (date) {
    const baseDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "weekly": {
        const day = baseDate.getDay();
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      }
      case "monthly": {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        break;
      }
      case "yearly": {
        startDate = new Date(baseDate.getFullYear(), 0, 1);
        endDate = new Date(baseDate.getFullYear() + 1, 0, 1);
        break;
      }
      default: {
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }
    where.entryDate = { gte: startDate, lt: endDate };
  }

  const debitResult = await prisma.cashLedger.aggregate({
    where: { ...where, type: "Debit" },
    _sum: { amount: true },
  });
  const creditResult = await prisma.cashLedger.aggregate({
    where: { ...where, type: "Credit" },
    _sum: { amount: true },
  });

  return {
    totalDebit: Number(debitResult._sum.amount || 0),
    totalCredit: Number(creditResult._sum.amount || 0),
    balance: Number(debitResult._sum.amount || 0) - Number(creditResult._sum.amount || 0),
  };
}

function getDateRange(date: string, period: string) {
  const baseDate = new Date(date);
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "weekly": {
      const day = baseDate.getDay();
      startDate = new Date(baseDate);
      startDate.setDate(baseDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      break;
    }
    case "monthly": {
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
      break;
    }
    case "yearly": {
      startDate = new Date(baseDate.getFullYear(), 0, 1);
      endDate = new Date(baseDate.getFullYear() + 1, 0, 1);
      break;
    }
    default: {
      startDate = new Date(baseDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(baseDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
  }
  return { startDate, endDate };
}

export async function getTransactionRevenueForPeriod(date?: string, period?: string) {
  if (!date) return { transactionRevenue: 0, paymentCount: 0, payments: [] as any[] };

  const { startDate, endDate } = getDateRange(date, period || "daily");

  const payments = await prisma.payment.findMany({
    where: {
      paidAt: { gte: startDate, lt: endDate },
    },
    include: {
      transaction: { include: { customer: true } },
      paymentType: true,
      wallet: true,
    },
    orderBy: { paidAt: "desc" },
  });

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    transactionRevenue: totalRevenue,
    paymentCount: payments.length,
    payments: payments.map((p) => ({
      id: p.id,
      paidAt: p.paidAt.toISOString(),
      transactionCode: p.transaction.transactionCode,
      customerName: p.transaction.customer.name,
      paymentTypeName: p.paymentType.name,
      walletName: p.wallet?.name || "-",
      amount: Number(p.amount),
    })),
  };
}
