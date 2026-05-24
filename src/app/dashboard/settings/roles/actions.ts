"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/authorization";

export async function updateRolePermissions(roleId: number, menuIds: number[]) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    // Delete existing permissions
    await prisma.roleMenuMapping.deleteMany({
      where: { roleId },
    });

    // Create new permissions
    if (menuIds.length > 0) {
      await prisma.roleMenuMapping.createMany({
        data: menuIds.map((menuId) => ({
          roleId,
          menuId,
        })),
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating role permissions:", error);
    return { success: false, error: "Gagal mengupdate permissions" };
  }
}

export async function getRolePermissions(roleId: number) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    const permissions = await prisma.roleMenuMapping.findMany({
      where: { roleId },
      include: {
        menu: true,
      },
    });

    return { success: true, data: permissions };
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return { success: false, error: "Gagal mengambil permissions" };
  }
}

export async function getMenus() {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    const menus = await prisma.menu.findMany({
      where: { rowStatus: true },
      orderBy: { orderNo: "asc" },
    });

    return { success: true, data: menus };
  } catch (error) {
    console.error("Error fetching menus:", error);
    return { success: false, error: "Gagal mengambil menu" };
  }
}
