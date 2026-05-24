"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEmployeesWithUnpaid() {
  const employees = await prisma.employee.findMany({
    where: { rowStatus: true },
    include: {
      employeeType: true,
      workerLogs: {
        where: { isPaid: false },
        include: {
          transactionItem: {
            include: { item: true, transaction: { include: { customer: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    phoneNumber: emp.phoneNumber,
    employeeType: emp.employeeType?.name || "-",
    unpaidLogs: emp.workerLogs.map((log) => ({
      id: log.id,
      transactionCode: log.transactionItem.transaction.transactionCode,
      customerName: log.transactionItem.transaction.customer.name,
      itemName: log.transactionItem.item.name,
      role: log.role,
      upah: Number(log.upah),
      createdAt: log.createdAt.toISOString(),
    })),
    totalUnpaid: emp.workerLogs.reduce((sum, log) => sum + Number(log.upah), 0),
    totalItems: emp.workerLogs.length,
  }));
}

export async function getEmployeeLoans(employeeId: number) {
  // Loans are CashLedger entries with category "Pinjaman Karyawan" linked to employee
  const loans = await prisma.cashLedger.findMany({
    where: {
      category: "Pinjaman Karyawan",
      description: { contains: `[EMP:${employeeId}` },
    },
    orderBy: { entryDate: "desc" },
  });

  return loans.map((l) => ({
    id: l.id,
    entryDate: l.entryDate.toISOString(),
    amount: Number(l.amount),
    description: l.description
      .replace(new RegExp(`^\\[EMP:${employeeId}(?:\\|[^\\]]+)?\\]\\s*`), "")
      .trim(),
  }));
}

export async function createPayroll(data: {
  employeeId: number;
  workerLogIds: number[];
  deductions: number;
  notes: string;
  walletId: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const logs = await prisma.workerLog.findMany({
      where: { id: { in: data.workerLogIds }, isPaid: false, employeeId: data.employeeId },
    });

    if (logs.length === 0) return { success: false, error: "Tidak ada item yang dipilih" };

    const totalAmount = logs.reduce((sum, log) => sum + Number(log.upah), 0);
    const netAmount = totalAmount - data.deductions;

    if (netAmount < 0) return { success: false, error: "Potongan melebihi total upah" };

    // Find date range
    const dates = logs.map((l) => l.createdAt);
    const periodStart = new Date(Math.min(...dates.map((d) => d.getTime())));
    const periodEnd = new Date(Math.max(...dates.map((d) => d.getTime())));

    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        periodStart,
        periodEnd,
        totalItems: logs.length,
        totalAmount: netAmount,
        paidBy: parseInt(session.user.id),
        notes: data.notes || null,
      },
    });

    // Mark worker logs as paid
    await prisma.workerLog.updateMany({
      where: { id: { in: data.workerLogIds } },
      data: { isPaid: true, payrollId: payroll.id },
    });

    // Create cash ledger entry
    await prisma.cashLedger.create({
      data: {
        entryDate: new Date(),
        type: "Credit",
        category: "Gaji Karyawan",
        description: `Pembayaran gaji - ${logs.length} item`,
        amount: netAmount,
        walletId: data.walletId,
        payrollId: payroll.id,
        createdBy: parseInt(session.user.id),
      },
    });

    revalidatePath("/dashboard/finance/payroll");
    revalidatePath("/dashboard/finance/cashbook");
    return { success: true };
  } catch (error) {
    console.error("Error creating payroll:", error);
    return { success: false, error: "Gagal memproses gaji" };
  }
}

export async function getPayrollHistory(employeeId?: number) {
  const where: any = {};
  if (employeeId) where.employeeId = employeeId;

  const payrolls = await prisma.payroll.findMany({
    where,
    include: {
      employee: true,
      paidByUser: true,
      _count: { select: { workerLogs: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  return payrolls.map((p) => ({
    id: p.id,
    employeeName: p.employee.name,
    employeeId: p.employeeId,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    totalItems: p.totalItems,
    totalAmount: Number(p.totalAmount),
    paidAt: p.paidAt.toISOString(),
    paidBy: p.paidByUser.fullName,
    notes: p.notes,
    logCount: p._count.workerLogs,
  }));
}

export async function createEmployeeLoan(data: {
  employeeId: number;
  amount: number;
  description: string;
  walletId: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      select: { name: true },
    });

    if (!employee) {
      return { success: false, error: "Karyawan tidak ditemukan" };
    }

    await prisma.cashLedger.create({
      data: {
        entryDate: new Date(),
        type: "Credit",
        category: "Pinjaman Karyawan",
        description: `[EMP:${data.employeeId}|${employee.name}] ${data.description}`,
        amount: data.amount,
        walletId: data.walletId,
        createdBy: parseInt(session.user.id),
      },
    });

    revalidatePath("/dashboard/finance/payroll");
    revalidatePath("/dashboard/finance/cashbook");
    return { success: true };
  } catch (error) {
    console.error("Error creating loan:", error);
    return { success: false, error: "Gagal mencatat pinjaman" };
  }
}
