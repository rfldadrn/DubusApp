"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

interface StatusUpdateExtra {
  notes?: string;
  employeeId?: number;
  assignDate?: string;
  ironingType?: string;
  pickerName?: string;
}

const EMPLOYEE_REQUIRED_CODES = ["POTONG", "JAHIT", "PERMAK"] as const;

export async function updateItemStatus(
  transactionItemId: number,
  statusItemId: number,
  extra: StatusUpdateExtra = {}
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = Number(session.user.id);

    // Get current status and status info
    const currentItem = await prisma.transactionItem.findUnique({
      where: { id: transactionItemId },
      select: {
        statusItemId: true,
        transactionId: true,
        statusItem: {
          select: {
            id: true,
            code: true,
            sequence: true,
          },
        },
      },
    });

    if (!currentItem) {
      return { success: false, error: "Item not found" };
    }

    const newStatus = await prisma.statusItem.findUnique({
      where: { id: statusItemId },
    });

    if (!newStatus) {
      return { success: false, error: "Status not found" };
    }

    if (!currentItem.statusItem) {
      return { success: false, error: "Status saat ini tidak ditemukan" };
    }

    const isSameStatus = currentItem.statusItem.id === newStatus.id;
    const requiresEmployee = EMPLOYEE_REQUIRED_CODES.includes(newStatus.code as any);

    if (requiresEmployee && !extra.employeeId) {
      return { success: false, error: `Status ${newStatus.name} wajib pilih karyawan` };
    }

    if (newStatus.sequence < currentItem.statusItem.sequence) {
      return { success: false, error: "Tidak bisa mundur ke status sebelumnya" };
    }

    if (newStatus.code === "DIAMBIL" && currentItem.statusItem.code !== "OK") {
      return { success: false, error: "Status Sudah Diambil hanya bisa dari status Selesai" };
    }

    if (isSameStatus && !extra.employeeId) {
      return { success: false, error: "Status item sudah sama" };
    }

    if (extra.employeeId) {
      const employeeExists = await prisma.employee.findFirst({
        where: { id: extra.employeeId, rowStatus: true },
        select: { id: true },
      });

      if (!employeeExists) {
        return { success: false, error: "Karyawan tidak ditemukan atau tidak aktif" };
      }
    }

    // Update transaction item status
    const updateData: any = { statusItemId };

    // If assigning tailor for POTONG/JAHIT/PERMAK
    if (extra.employeeId && EMPLOYEE_REQUIRED_CODES.includes(newStatus.code as any)) {
      updateData.assignedTailorId = extra.employeeId;
    }

    await prisma.transactionItem.update({
      where: { id: transactionItemId },
      data: updateData,
    });

    // Create production log
    await prisma.productionLog.create({
      data: {
        transactionItemId,
        fromStatusId: currentItem.statusItemId,
        toStatusId: statusItemId,
        notes: extra.notes || `Status updated to ${newStatus.name}`,
        updatedBy: userId,
      },
    });

    // Create or update worker log for employee assignments
    if (extra.employeeId && EMPLOYEE_REQUIRED_CODES.includes(newStatus.code as any)) {
      const employee = await prisma.employee.findUnique({
        where: { id: extra.employeeId },
        include: { employeeType: true },
      });

      if (employee) {
        // Get item price to determine upah
        const transactionItem = await prisma.transactionItem.findUnique({
          where: { id: transactionItemId },
          include: { item: true },
        });

        const upah = transactionItem ? Number(transactionItem.item.employeePrice) : 0;
        const role = newStatus.code === "POTONG" ? "Cutter" : "Tailor";

        // Check if workerLog already exists for this item and role
        const existingLog = await prisma.workerLog.findFirst({
          where: {
            transactionItemId,
            role: role as any,
          },
        });

        if (existingLog) {
          // Update existing log if employee changed
          if (existingLog.employeeId !== extra.employeeId) {
            await prisma.workerLog.update({
              where: { id: existingLog.id },
              data: { employeeId: extra.employeeId },
            });
          }
        } else {
          // Create new log
          await prisma.workerLog.create({
            data: {
              transactionItemId,
              employeeId: extra.employeeId,
              role: role as any,
              upah,
            },
          });
        }
      }
    }

    // Handle ironing log for GOSOK status
    if (newStatus.code === "GOSOK" && extra.ironingType) {
      const existingIroningLog = await prisma.ironingLog.findUnique({
        where: { transactionItemId },
      });

      if (!existingIroningLog) {
        await prisma.ironingLog.create({
          data: {
            transactionItemId,
            ironingType: extra.ironingType as any,
            handledBy: userId,
            notes: extra.notes,
            sentAt: extra.assignDate ? new Date(extra.assignDate) : new Date(),
          },
        });
      }
    }

    // Update ironing log returnedAt when moving past GOSOK
    if (newStatus.code !== "GOSOK") {
      const ironingLog = await prisma.ironingLog.findUnique({
        where: { transactionItemId },
      });
      if (ironingLog && !ironingLog.returnedAt && newStatus.sequence > 6) {
        await prisma.ironingLog.update({
          where: { transactionItemId },
          data: { returnedAt: new Date() },
        });
      }
    }

    // Check if all items in transaction are completed, update transaction status
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId: currentItem.transactionId, rowStatus: true },
      include: { statusItem: true },
    });

    const allCompleted = allItems.every((item) => item.statusItem.code === "OK" || item.statusItem.code === "DIAMBIL");
    if (allCompleted) {
      const okStatus = await prisma.statusTransaction.findFirst({ where: { code: "OK" } });
      if (okStatus) {
        await prisma.transaction.update({
          where: { id: currentItem.transactionId },
          data: { statusTransactionId: okStatus.id, completionDate: new Date() },
        });
      }
    }

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/transactions");
    revalidateTag("production-page-data");
    revalidateTag("transactions-page-data");
    return { success: true };
  } catch (error) {
    console.error("Error updating item status:", error);
    return { success: false, error: "Gagal mengupdate status" };
  }
}

export async function bulkUpdateItemStatus(
  transactionItemIds: number[],
  statusItemId: number,
  extra: StatusUpdateExtra = {}
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const uniqueIds = Array.from(new Set(transactionItemIds)).filter((id) => Number.isFinite(id));
    if (uniqueIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 item" };
    }

    const targetStatus = await prisma.statusItem.findUnique({
      where: { id: statusItemId },
      select: { id: true, code: true, name: true, sequence: true },
    });

    if (!targetStatus) {
      return { success: false, error: "Status tujuan tidak ditemukan" };
    }

    const selectedItems = await prisma.transactionItem.findMany({
      where: { id: { in: uniqueIds }, rowStatus: true },
      select: {
        id: true,
        statusItem: {
          select: { id: true, code: true, name: true, sequence: true },
        },
      },
    });

    if (selectedItems.length !== uniqueIds.length) {
      return { success: false, error: "Sebagian item tidak ditemukan atau nonaktif" };
    }

    const currentStatusId = selectedItems[0]?.statusItem?.id;
    const allSameCurrentStatus = selectedItems.every((item) => item.statusItem?.id === currentStatusId);

    if (!allSameCurrentStatus) {
      return { success: false, error: "Bulk update hanya untuk item dengan status saat ini yang sama" };
    }

    const currentStatus = selectedItems[0]?.statusItem;
    if (!currentStatus) {
      return { success: false, error: "Status item saat ini tidak valid" };
    }

    if (targetStatus.sequence < currentStatus.sequence) {
      return { success: false, error: "Tidak bisa bulk update ke status yang lebih mundur" };
    }

    if (targetStatus.code === "DIAMBIL" && currentStatus.code !== "OK") {
      return { success: false, error: "Status Sudah Diambil hanya bisa dari status Selesai" };
    }

    const requiresEmployee = EMPLOYEE_REQUIRED_CODES.includes(targetStatus.code as any);
    if (requiresEmployee && !extra.employeeId) {
      return { success: false, error: `Status ${targetStatus.name} wajib pilih karyawan` };
    }

    if (targetStatus.id === currentStatus.id && !extra.employeeId) {
      return { success: false, error: "Status tujuan sama dengan status saat ini" };
    }

    let updated = 0;
    const failed: number[] = [];

    for (const id of uniqueIds) {
      const result = await updateItemStatus(id, statusItemId, extra);
      if (result.success) {
        updated += 1;
      } else {
        failed.push(id);
      }
    }

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/transactions");
    revalidateTag("production-page-data");
    revalidateTag("transactions-page-data");

    if (updated === 0) {
      return { success: false, error: "Tidak ada item yang berhasil diupdate" };
    }

    return {
      success: true,
      updated,
      failed,
      message:
        failed.length > 0
          ? `${updated} item berhasil diupdate, ${failed.length} item gagal`
          : `${updated} item berhasil diupdate`,
    };
  } catch (error) {
    console.error("Error bulk updating item status:", error);
    return { success: false, error: "Gagal bulk update status" };
  }
}

export async function bulkAssignWorkerByCurrentStatus(
  transactionItemIds: number[],
  employeeId: number,
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = Number(session.user.id);
    const uniqueIds = Array.from(new Set(transactionItemIds)).filter((id) => Number.isFinite(id));

    if (uniqueIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 item" };
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, rowStatus: true },
      select: { id: true, name: true },
    });

    if (!employee) {
      return { success: false, error: "Karyawan tidak ditemukan atau tidak aktif" };
    }

    const selectedItems = await prisma.transactionItem.findMany({
      where: { id: { in: uniqueIds }, rowStatus: true },
      include: {
        item: { select: { employeePrice: true } },
        statusItem: { select: { id: true, code: true, name: true } },
      },
    });

    if (selectedItems.length !== uniqueIds.length) {
      return { success: false, error: "Sebagian item tidak ditemukan atau nonaktif" };
    }

    const statusCode = selectedItems[0]?.statusItem?.code;
    if (!statusCode) {
      return { success: false, error: "Status item tidak valid" };
    }

    if (!selectedItems.every((item) => item.statusItem?.code === statusCode)) {
      return { success: false, error: "Bulk assign hanya boleh untuk item dengan status yang sama" };
    }

    if (!EMPLOYEE_REQUIRED_CODES.includes(statusCode as any)) {
      return {
        success: false,
        error: `Status ${selectedItems[0].statusItem?.name} tidak membutuhkan assignment tukang`,
      };
    }

    const role = statusCode === "POTONG" ? "Cutter" : "Tailor";

    for (const item of selectedItems) {
      await prisma.transactionItem.update({
        where: { id: item.id },
        data: { assignedTailorId: employee.id },
      });

      const existingLog = await prisma.workerLog.findFirst({
        where: {
          transactionItemId: item.id,
          role: role as any,
        },
      });

      if (existingLog) {
        await prisma.workerLog.update({
          where: { id: existingLog.id },
          data: { employeeId: employee.id },
        });
      } else {
        await prisma.workerLog.create({
          data: {
            transactionItemId: item.id,
            employeeId: employee.id,
            role: role as any,
            upah: Number(item.item.employeePrice),
          },
        });
      }

      await prisma.productionLog.create({
        data: {
          transactionItemId: item.id,
          fromStatusId: item.statusItem.id,
          toStatusId: item.statusItem.id,
          notes:
            notes?.trim() ||
            `Bulk assign ${item.statusItem.name} ke ${employee.name}`,
          updatedBy: userId,
        },
      });
    }

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/transactions");

    return {
      success: true,
      updated: selectedItems.length,
      message: `${selectedItems.length} item berhasil di-assign ke ${employee.name}`,
    };
  } catch (error) {
    console.error("Error bulk assigning worker:", error);
    return { success: false, error: "Gagal bulk assign pekerja" };
  }
}

export async function getEmployees() {
  const employees = await prisma.employee.findMany({
    where: { rowStatus: true },
    include: { employeeType: true },
    orderBy: { name: "asc" },
  });
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    typeName: e.employeeType?.name || "Umum",
  }));
}

export async function getProductionLogs(transactionItemId: number) {
  const logs = await prisma.productionLog.findMany({
    where: { transactionItemId },
    include: {
      updatedByUser: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const allStatuses = await prisma.statusItem.findMany({ where: { rowStatus: true } });
  const statusMap = Object.fromEntries(allStatuses.map((s) => [s.id, s.name]));
  const statusCodeMap = Object.fromEntries(allStatuses.map((s) => [s.id, s.code]));

  const workerLogs = await prisma.workerLog.findMany({
    where: { transactionItemId },
    include: { employee: true },
    orderBy: { createdAt: "asc" },
  });

  const ironingLog = await prisma.ironingLog.findUnique({
    where: { transactionItemId },
    include: { handledByUser: true },
  });

  return {
    logs: logs.map((l) => {
      const toStatusCode = statusCodeMap[l.toStatusId];
      let workerName: string | null = null;
      
      // Find the worker assigned for this status
      if (toStatusCode === "POTONG") {
        const cutterLog = workerLogs.find((w) => w.role === "Cutter");
        workerName = cutterLog?.employee.name || null;
      } else if (toStatusCode === "JAHIT" || toStatusCode === "PERMAK") {
        const tailorLog = workerLogs.find((w) => w.role === "Tailor");
        workerName = tailorLog?.employee.name || null;
      }

      return {
        id: l.id,
        fromStatus: statusMap[l.fromStatusId] || "-",
        toStatus: statusMap[l.toStatusId] || "-",
        notes: l.notes,
        updatedBy: l.updatedByUser.fullName,
        workerName,
        createdAt: l.createdAt.toISOString(),
      };
    }),
    workerLogs: workerLogs.map((w) => ({
      id: w.id,
      employeeId: w.employeeId,
      employeeName: w.employee.name,
      role: w.role,
      upah: Number(w.upah),
      isPaid: w.isPaid,
      createdAt: w.createdAt.toISOString(),
    })),
    ironingLog: ironingLog ? {
      id: ironingLog.id,
      ironingType: ironingLog.ironingType,
      sentAt: ironingLog.sentAt.toISOString(),
      returnedAt: ironingLog.returnedAt?.toISOString() || null,
      handledBy: ironingLog.handledByUser.fullName,
      notes: ironingLog.notes,
    } : null,
  };
}

export async function reassignWorker(
  workerLogId: number,
  newEmployeeId: number,
  transactionItemId: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Update worker log with new employee
    await prisma.workerLog.update({
      where: { id: workerLogId },
      data: { employeeId: newEmployeeId },
    });

    // Also update the assignedTailor on the transaction item
    await prisma.transactionItem.update({
      where: { id: transactionItemId },
      data: { assignedTailorId: newEmployeeId },
    });

    // Create production log entry for reassignment
    const employee = await prisma.employee.findUnique({ where: { id: newEmployeeId } });
    const currentItem = await prisma.transactionItem.findUnique({
      where: { id: transactionItemId },
      select: { statusItemId: true },
    });

    if (currentItem) {
      await prisma.productionLog.create({
        data: {
          transactionItemId,
          fromStatusId: currentItem.statusItemId,
          toStatusId: currentItem.statusItemId,
          notes: `Dipindah tangankan ke ${employee?.name || "karyawan lain"}`,
          updatedBy: Number(session.user.id),
        },
      });
    }

    revalidatePath("/dashboard/production");
    return { success: true };
  } catch (error) {
    console.error("Error reassigning worker:", error);
    return { success: false, error: "Gagal memindahkan pekerja" };
  }
}

export async function getBonData(transactionItemId: number) {
  const transactionItem = await prisma.transactionItem.findUnique({
    where: { id: transactionItemId },
    include: {
      transaction: {
        include: {
          customer: true,
          agencyProject: { include: { agency: true } },
        },
      },
      item: {
        include: {
          itemSizes: {
            where: { rowStatus: true },
            orderBy: { sortOrder: "asc" },
            select: { name: true },
          },
        },
      },
      fabric: true,
      charges: {
        where: { rowStatus: true },
      },
      headerSizeCustomer: {
        include: {
          itemSizeCustomers: {
            include: { itemSize: true },
            where: { rowStatus: true },
          },
        },
      },
    },
  });

  if (!transactionItem) return null;

  const measuredSizes = transactionItem.headerSizeCustomer?.itemSizeCustomers?.map((isc) => ({
    name: isc.itemSize.name,
    value: isc.size == null ? "" : String(isc.size),
  })) || [];

  const fallbackSizes = transactionItem.item.itemSizes.map((size) => ({
    name: size.name,
    value: "",
  }));

  const sizes = measuredSizes.length > 0 ? measuredSizes : fallbackSizes;

  return {
    transactionCode: transactionItem.transaction.transactionCode,
    customerName: transactionItem.transaction.customer.name,
    agencyName: transactionItem.transaction.agencyProject?.agency?.name || undefined,
    itemName: transactionItem.item.name,
    modelDescription: transactionItem.modelDescription || undefined,
    modelImageUrl: transactionItem.modelImageUrl || undefined,
    fabricSource: transactionItem.fabricSource,
    fabricName: transactionItem.fabric?.name || transactionItem.fabricName || undefined,
    fabricMeters: transactionItem.fabricMeters ? Number(transactionItem.fabricMeters).toString() : undefined,
    transactionNote: transactionItem.transaction.note || undefined,
    additionalCharges: transactionItem.charges.map((charge) => ({
      label: charge.label,
      amount: Number(charge.amount),
      note: charge.note || undefined,
    })),
    sizes,
  };
}
