"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateRolePermissions(roleId: number, menuIds: number[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
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
