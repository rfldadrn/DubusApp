"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

export async function getAgencyDetail(agencyId: number) {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId, rowStatus: true },
    include: {
      projects: {
        where: { rowStatus: true },
        orderBy: { createdAt: "desc" },
        include: {
          transactions: {
            where: { rowStatus: true },
            select: {
              id: true,
              items: {
                where: { rowStatus: true },
                select: {
                  sewingPrice: true,
                  charges: {
                    where: { rowStatus: true },
                    select: { amount: true, label: true },
                  },
                },
              },
              payments: {
                select: { amount: true },
              },
            },
          },
        },
      },
      customers: {
        where: { rowStatus: true },
        orderBy: { name: "asc" },
        include: {
          transactions: {
            where: { rowStatus: true },
            select: { id: true },
          },
          sizeHeaders: {
            where: { rowStatus: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!agency) return null;

  return {
    id: agency.id,
    agencyCode: agency.agencyCode,
    name: agency.name,
    description: agency.description,
    projects: agency.projects.map((project) => ({
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      description: project.description,
      picName: project.picName,
      picPhone: project.picPhone,
      startDate: project.startDate?.toISOString() || null,
      targetDate: project.targetDate?.toISOString() || null,
      contractStatus: project.contractStatus,
      rowStatus: project.rowStatus,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })),
    projectSummaries: agency.projects.map((project) => {
      const totalBudget = project.transactions.reduce((sum, tx) => {
        const txBudget = tx.items.reduce((itemSum, item) => itemSum + Number(item.sewingPrice), 0);
        return sum + txBudget;
      }, 0);
      const totalPaid = project.transactions.reduce(
        (sum, tx) =>
          sum +
          tx.payments.reduce((paymentSum, payment) => paymentSum + Number(payment.amount), 0),
        0
      );

      return {
        id: project.id,
        projectCode: project.projectCode,
        name: project.name,
        transactionCount: project.transactions.length,
        totalBudget,
        totalPaid,
        remainingBudget: Math.max(0, totalBudget - totalPaid),
      };
    }),
    customers: agency.customers.map((c) => ({
      id: c.id,
      name: c.name,
      phoneNumber: normalizePhoneNumber(c.phoneNumber),
      gender: c.gender,
      transactionCount: c.transactions.length,
      sizeCount: c.sizeHeaders.length,
    })),
  };
}

export async function getItemsForMeasurement() {
  const items = await prisma.item.findMany({
    where: { rowStatus: true },
    include: {
      itemSizes: {
        where: { rowStatus: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    category: item.category,
    genderTarget: item.genderTarget,
    customerPrice: Number(item.customerPrice),
    employeePrice: Number(item.employeePrice),
    rowStatus: item.rowStatus,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    itemSizes: item.itemSizes.map((size) => ({
      id: size.id,
      itemId: size.itemId,
      name: size.name,
      isMandatory: size.isMandatory,
      isStandard: size.isStandard,
      sortOrder: size.sortOrder,
      rowStatus: size.rowStatus,
    })),
  }));
}

export async function getAgencyProjects(agencyId: number) {
  const projects = await prisma.agencyProject.findMany({
    where: { agencyId, rowStatus: true, contractStatus: "Active" },
    orderBy: { name: "asc" },
  });

  return projects.map((project) => ({
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    description: project.description,
    picName: project.picName,
    picPhone: project.picPhone,
    startDate: project.startDate?.toISOString() || null,
    targetDate: project.targetDate?.toISOString() || null,
    contractStatus: project.contractStatus,
  }));
}

interface MeasurementData {
  customerId: number;
  agencyId: number;
  projectId: number;
  items: Array<{
    itemId: number;
    quantity: number;
    sizes: Record<number, number>;
    modelDescription?: string;
    additionalCharge?: number;
  }>;
  downPayment?: number;
}

function getInitialPaymentStatus(totalAmount: number, paidAmount: number) {
  if (paidAmount <= 0) return "Unpaid" as const;
  if (paidAmount >= totalAmount) return "Paid" as const;
  return "Partial" as const;
}

export async function createMeasurementTransaction(data: MeasurementData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const userId = Number(session.user.id);

    const project = await prisma.agencyProject.findUnique({
      where: { id: data.projectId },
      select: { id: true, projectCode: true, agencyId: true },
    });

    if (!project || project.agencyId !== data.agencyId) {
      return { success: false, error: "Project agency tidak valid" };
    }

    let agencyBudgetAmount = 0;
    let personalExtraAmount = 0;
    for (const item of data.items) {
      const itemData = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (itemData) {
        agencyBudgetAmount += Number(itemData.customerPrice) * item.quantity;
      }

      const extra = Number(item.additionalCharge || 0);
      if (extra > 0) {
        personalExtraAmount += extra * item.quantity;
      }
    }

    const projectPrefix = project.projectCode.replace(/\s+/g, "").toUpperCase();
    const existingCount = await prisma.transaction.count({
      where: { agencyProjectId: data.projectId },
    });
    let codeCounter = existingCount + 1;
    let newCode = `${projectPrefix}-${String(codeCounter).padStart(4, "0")}`;
    while (await prisma.transaction.findFirst({ where: { transactionCode: newCode }, select: { id: true } })) {
      codeCounter += 1;
      newCode = `${projectPrefix}-${String(codeCounter).padStart(4, "0")}`;
    }

    const defaultStatus =
      (await prisma.statusItem.findFirst({
        where: { code: "UKUR", rowStatus: true },
      })) ||
      (await prisma.statusItem.findFirst({
        where: { rowStatus: true },
        orderBy: { sequence: "asc" },
      }));

    const defaultTransactionStatus =
      (await prisma.statusTransaction.findFirst({
        where: { code: { in: ["DIPROSES", "PROSES", "NEW"] }, rowStatus: true },
        orderBy: { sequence: "asc" },
      })) ||
      (await prisma.statusTransaction.findFirst({
        where: { rowStatus: true },
        orderBy: { sequence: "asc" },
      }));

    if (!defaultStatus || !defaultTransactionStatus) {
      return { success: false, error: "Status produksi/transaksi default belum tersedia di master data" };
    }

    const paidAmount = Number(data.downPayment || 0);
    if (paidAmount > personalExtraAmount) {
      return { success: false, error: "DP melebihi total tambahan pribadi" };
    }

    const initialPaymentStatus =
      personalExtraAmount <= 0
        ? ("Paid" as const)
        : getInitialPaymentStatus(personalExtraAmount, paidAmount);

    const transaction = await prisma.transaction.create({
      data: {
        transactionCode: newCode,
        customerId: data.customerId,
        type: "Agency",
        agencyProjectId: data.projectId,
        transactionDate: new Date(),
        totalAmount: personalExtraAmount,
        paymentStatus: initialPaymentStatus,
        statusTransactionId: defaultTransactionStatus.id,
        note:
          personalExtraAmount > 0
            ? `Agency budget: Rp ${agencyBudgetAmount.toLocaleString("id-ID")} | Tambahan pribadi: Rp ${personalExtraAmount.toLocaleString("id-ID")}`
            : `Agency budget: Rp ${agencyBudgetAmount.toLocaleString("id-ID")}`,
        createdBy: userId,
      },
    });

    for (const item of data.items) {
      const itemData = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!itemData) continue;

      for (let i = 0; i < item.quantity; i++) {
        const perItemAdditional = Number(item.additionalCharge || 0);
        const transactionItem = await prisma.transactionItem.create({
          data: {
            transactionId: transaction.id,
            itemId: item.itemId,
            fabricSource: "Customer",
            sewingPrice: Number(itemData.customerPrice),
            statusItemId: defaultStatus.id,
            modelDescription: item.modelDescription || null,
            charges:
              perItemAdditional > 0
                ? {
                    create: [
                      {
                        label: "Biaya Tambahan Pribadi",
                        amount: perItemAdditional,
                        note: "Diluar coverage agency",
                      },
                    ],
                  }
                : undefined,
          },
        });

        if (Object.keys(item.sizes).length > 0) {
          const header = await prisma.headerSizeCustomer.create({
            data: {
              customerId: data.customerId,
              itemId: item.itemId,
              note: `Ukuran ${newCode} - Item ${i + 1}`,
              createdBy: userId,
            },
          });

          await prisma.itemSizeCustomer.createMany({
            data: Object.entries(item.sizes).map(([sizeId, value]) => ({
              itemSizeId: Number(sizeId),
              headerSizeCustomerId: header.id,
              size: value,
            })),
          });

          await prisma.transactionItem.update({
            where: { id: transactionItem.id },
            data: { headerSizeCustomerId: header.id },
          });
        }
      }
    }

    if (personalExtraAmount > 0 && data.downPayment && data.downPayment > 0) {
      const downPaymentType = await prisma.paymentType.findFirst({
        where: { code: "DP" },
      });

      const defaultWallet = await prisma.wallet.findFirst({
        where: { walletType: "Cash", isActive: true },
      });

      if (downPaymentType && defaultWallet) {
        const payment = await prisma.payment.create({
          data: {
            transactionId: transaction.id,
            amount: data.downPayment,
            balanceAfter: personalExtraAmount - data.downPayment,
            paymentTypeId: downPaymentType.id,
            walletId: defaultWallet.id,
            receivedBy: userId,
            note: "DP tambahan pribadi agency",
          },
        });

        await prisma.cashLedger.create({
          data: {
            type: "Debit",
            category: "Pembayaran Pelanggan",
            description: `Tambahan pribadi agency ${transaction.transactionCode}`,
            amount: data.downPayment,
            walletId: defaultWallet.id,
            paymentId: payment.id,
            createdBy: userId,
          },
        });
      }
    }

    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/agency");
    revalidatePath(`/dashboard/agency/${data.agencyId}`);

    return {
      success: true,
      transactionId: transaction.id,
      transactionCode: newCode,
    };
  } catch (error) {
    console.error("Create measurement transaction error:", error);
    const message =
      error instanceof Error && error.message
        ? `Gagal membuat transaksi: ${error.message}`
        : "Gagal membuat transaksi";
    return { success: false, error: message };
  }
}

