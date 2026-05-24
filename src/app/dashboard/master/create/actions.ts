"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type MasterDataType = "item" | "statusItem" | "paymentType" | "employeeType";

export async function createMasterData(type: MasterDataType, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    switch (type) {
      case "item":
        await prisma.item.create({
          data: {
            code: data.code,
            name: data.name,
            category: data.category,
            genderTarget: data.genderTarget,
            customerPrice: data.customerPrice,
            employeePrice: data.employeePrice,
            rowStatus: true,
          },
        });
        break;

      case "statusItem":
        await prisma.statusItem.create({
          data: {
            code: data.code,
            name: data.name,
            description: data.description || null,
            sequence: data.sequence,
            colorSlug: data.colorSlug || null,
            rowStatus: true,
          },
        });
        break;

      case "paymentType":
        await prisma.paymentType.create({
          data: {
            code: data.code,
            name: data.name,
            rowStatus: true,
          },
        });
        break;

      case "employeeType":
        await prisma.employeeType.create({
          data: {
            name: data.name,
            description: data.description || null,
            rowStatus: true,
          },
        });
        break;

      default:
        return { success: false, error: "Invalid master data type" };
    }

    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    console.error("Error creating master data:", error);
    return { success: false, error: "Gagal menambahkan data" };
  }
}

export async function updateMasterData(type: MasterDataType, id: number, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    switch (type) {
      case "item":
        await prisma.item.update({
          where: { id },
          data: {
            code: data.code,
            name: data.name,
            category: data.category,
            genderTarget: data.genderTarget,
            customerPrice: data.customerPrice,
            employeePrice: data.employeePrice,
          },
        });
        break;
      case "statusItem":
        await prisma.statusItem.update({
          where: { id },
          data: {
            code: data.code,
            name: data.name,
            description: data.description || null,
            sequence: data.sequence,
            colorSlug: data.colorSlug || null,
          },
        });
        break;
      case "paymentType":
        await prisma.paymentType.update({
          where: { id },
          data: { code: data.code, name: data.name },
        });
        break;
      case "employeeType":
        await prisma.employeeType.update({
          where: { id },
          data: { name: data.name, description: data.description || null },
        });
        break;
    }

    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    console.error("Error updating master data:", error);
    return { success: false, error: "Gagal mengupdate data" };
  }
}

export async function deleteMasterData(type: MasterDataType, id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    switch (type) {
      case "item": {
        const count = await prisma.transactionItem.count({ where: { itemId: id } });
        if (count > 0) return { success: false, error: `Item digunakan di ${count} transaksi. Tidak bisa dihapus.` };
        await prisma.item.update({ where: { id }, data: { rowStatus: false } });
        break;
      }
      case "statusItem": {
        const count = await prisma.transactionItem.count({ where: { statusItemId: id } });
        if (count > 0) return { success: false, error: `Status digunakan di ${count} item. Tidak bisa dihapus.` };
        await prisma.statusItem.update({ where: { id }, data: { rowStatus: false } });
        break;
      }
      case "paymentType": {
        const count = await prisma.payment.count({ where: { paymentTypeId: id } });
        if (count > 0) return { success: false, error: `Metode bayar digunakan di ${count} pembayaran. Tidak bisa dihapus.` };
        await prisma.paymentType.update({ where: { id }, data: { rowStatus: false } });
        break;
      }
      case "employeeType": {
        const count = await prisma.employee.count({ where: { employeeTypeId: id } });
        if (count > 0) return { success: false, error: `Tipe karyawan digunakan oleh ${count} karyawan. Tidak bisa dihapus.` };
        await prisma.employeeType.update({ where: { id }, data: { rowStatus: false } });
        break;
      }
    }

    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    console.error("Error deleting master data:", error);
    return { success: false, error: "Gagal menghapus data" };
  }
}

// Item Size management
export async function getItemSizes(itemId: number) {
  return prisma.itemSize.findMany({
    where: { itemId, rowStatus: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createItemSize(data: { itemId: number; name: string; isMandatory: boolean; sortOrder: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.itemSize.create({
      data: { itemId: data.itemId, name: data.name, isMandatory: data.isMandatory, isStandard: false, sortOrder: data.sortOrder },
    });

    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menambahkan ukuran" };
  }
}

export async function updateItemSize(id: number, data: { name: string; isMandatory: boolean; sortOrder: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.itemSize.update({ where: { id }, data: { name: data.name, isMandatory: data.isMandatory, sortOrder: data.sortOrder } });
    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengupdate ukuran" };
  }
}

export async function deleteItemSize(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const count = await prisma.itemSizeCustomer.count({ where: { itemSizeId: id } });
    if (count > 0) return { success: false, error: `Ukuran digunakan oleh ${count} pelanggan. Tidak bisa dihapus.` };

    await prisma.itemSize.update({ where: { id }, data: { rowStatus: false } });
    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus ukuran" };
  }
}
