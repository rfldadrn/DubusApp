"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

function getTodayDeliveryCodePrefix() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `DLV${y}${m}${d}`;
}

async function generateDeliveryCode() {
  const prefix = getTodayDeliveryCodePrefix();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await prisma.delivery.count({
    where: {
      createdAt: { gte: start, lte: end },
    },
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function getDeliveryProjects() {
  const projects = await prisma.agencyProject.findMany({
    where: { rowStatus: true },
    include: {
      agency: true,
      _count: {
        select: {
          deliveries: true,
          transactions: true,
        },
      },
    },
    orderBy: [{ agency: { name: "asc" } }, { name: "asc" }],
  });

  return projects.map((project) => ({
    id: project.id,
    projectCode: project.projectCode,
    projectName: project.name,
    agencyName: project.agency.name,
    deliveryCount: project._count.deliveries,
    transactionCount: project._count.transactions,
  }));
}

export async function getReadyItemsByProject(projectId: number) {
  const items = await prisma.transactionItem.findMany({
    where: {
      rowStatus: true,
      transaction: {
        rowStatus: true,
        agencyProjectId: projectId,
      },
      statusItem: {
        code: "OK",
      },
      deliveryItems: {
        none: {},
      },
    },
    include: {
      item: true,
      transaction: {
        include: {
          customer: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    transactionId: item.transactionId,
    transactionCode: item.transaction.transactionCode,
    customerName: item.transaction.customer.name,
    itemName: item.item.name,
    modelDescription: item.modelDescription,
    targetDate: item.targetDate?.toISOString() || null,
  }));
}

export async function getDeliveryHistory() {
  const deliveries = await prisma.delivery.findMany({
    include: {
      agencyProject: {
        include: { agency: true },
      },
      handledByUser: true,
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return deliveries.map((delivery) => ({
    id: delivery.id,
    deliveryCode: delivery.deliveryCode,
    projectName: delivery.agencyProject.name,
    agencyName: delivery.agencyProject.agency.name,
    deliveryDate: delivery.deliveryDate.toISOString(),
    status: delivery.status,
    destination: delivery.destination,
    recipientName: delivery.recipientName,
    recipientPhone: delivery.recipientPhone,
    itemCount: delivery._count.items,
    handledBy: delivery.handledByUser.fullName,
  }));
}

async function updateTransactionCompletionIfPicked(transactionId: number) {
  const allItems = await prisma.transactionItem.findMany({
    where: { transactionId, rowStatus: true },
    include: { statusItem: true },
  });

  if (allItems.length === 0) return;

  const allPicked = allItems.every((item) => item.statusItem.code === "DIAMBIL");
  if (!allPicked) return;

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { payments: true },
  });

  if (!transaction) return;

  const totalPaid = transaction.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paid = totalPaid >= Number(transaction.totalAmount);
  const statusCode = paid ? "SELESAI" : "BB";

  const txStatus = await prisma.statusTransaction.findFirst({ where: { code: statusCode, rowStatus: true } });
  if (!txStatus) return;

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      statusTransactionId: txStatus.id,
      completionDate: new Date(),
    },
  });
}

export async function createDelivery(data: {
  projectId: number;
  itemIds: number[];
  destination: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.projectId) return { success: false, error: "Pilih project" };
    if (!data.destination?.trim()) return { success: false, error: "Tujuan pengantaran wajib diisi" };
    if (!data.itemIds || data.itemIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 item siap kirim" };
    }

    const availableItems = await prisma.transactionItem.findMany({
      where: {
        id: { in: data.itemIds },
        rowStatus: true,
        transaction: {
          rowStatus: true,
          agencyProjectId: data.projectId,
        },
        statusItem: {
          code: "OK",
        },
        deliveryItems: {
          none: {},
        },
      },
      include: {
        statusItem: true,
      },
    });

    if (availableItems.length !== data.itemIds.length) {
      return { success: false, error: "Ada item yang tidak valid / sudah terkirim / belum siap" };
    }

    const totalReadyCount = await prisma.transactionItem.count({
      where: {
        rowStatus: true,
        transaction: {
          rowStatus: true,
          agencyProjectId: data.projectId,
        },
        statusItem: {
          code: "OK",
        },
        deliveryItems: {
          none: {},
        },
      },
    });

    const deliveryCode = await generateDeliveryCode();
    const deliveryStatus = data.itemIds.length >= totalReadyCount ? "FullyDelivered" : "PartialDelivered";

    const diambilStatus = await prisma.statusItem.findFirst({ where: { code: "DIAMBIL", rowStatus: true } });
    const userId = Number(session.user.id);

    const delivery = await prisma.delivery.create({
      data: {
        deliveryCode,
        agencyProjectId: data.projectId,
        deliveryDate: new Date(),
        destination: data.destination.trim(),
        recipientName: data.recipientName?.trim() || null,
        recipientPhone: normalizePhoneNumber(data.recipientPhone),
        status: deliveryStatus,
        notes: data.notes?.trim() || null,
        handledBy: userId,
      },
    });

    await prisma.deliveryItem.createMany({
      data: data.itemIds.map((itemId) => ({
        deliveryId: delivery.id,
        transactionItemId: itemId,
      })),
    });

    if (diambilStatus) {
      for (const item of availableItems) {
        await prisma.transactionItem.update({
          where: { id: item.id },
          data: { statusItemId: diambilStatus.id },
        });

        await prisma.productionLog.create({
          data: {
            transactionItemId: item.id,
            fromStatusId: item.statusItemId,
            toStatusId: diambilStatus.id,
            notes: `Pengantaran batch (${deliveryCode})`,
            updatedBy: userId,
          },
        });
      }
    }

    const affectedTransactionIds = Array.from(new Set(availableItems.map((item) => item.transactionId)));
    for (const transactionId of affectedTransactionIds) {
      await updateTransactionCompletionIfPicked(transactionId);
    }

    revalidatePath("/dashboard/delivery");
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/reports");

    return {
      success: true,
      deliveryCode,
      itemCount: data.itemIds.length,
    };
  } catch (error) {
    console.error("Create delivery error:", error);
    return { success: false, error: "Gagal membuat pengantaran" };
  }
}
