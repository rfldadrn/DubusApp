"use server";

import { prisma } from "@/lib/prisma";

export async function getEmployeeTasks(filters?: {
  employeeId?: number;
  isPaid?: boolean;
  search?: string;
}) {
  const where: any = {};
  if (filters?.employeeId) where.employeeId = filters.employeeId;
  if (filters?.isPaid !== undefined) where.isPaid = filters.isPaid;

  const logs = await prisma.workerLog.findMany({
    where,
    include: {
      employee: true,
      transactionItem: {
        include: {
          item: true,
          transaction: { include: { customer: true } },
        },
      },
      payroll: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  let results = logs.map((log) => ({
    id: log.id,
    employeeId: log.employeeId,
    employeeName: log.employee.name,
    transactionCode: log.transactionItem.transaction.transactionCode,
    customerName: log.transactionItem.transaction.customer.name,
    itemName: log.transactionItem.item.name,
    role: log.role,
    upah: Number(log.upah),
    isPaid: log.isPaid,
    payrollId: log.payrollId,
    createdAt: log.createdAt.toISOString(),
  }));

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter((r) =>
      r.employeeName.toLowerCase().includes(s) ||
      r.transactionCode.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s) ||
      r.itemName.toLowerCase().includes(s)
    );
  }

  return results;
}

export async function getEmployeeList() {
  return prisma.employee.findMany({
    where: { rowStatus: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
