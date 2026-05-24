"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/lib/authorization";

type UserInput = {
  fullName: string;
  username: string;
  password: string;
  roleId: number;
};

export async function createUser(data: UserInput) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return { success: false, error: "Username sudah digunakan" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        password: hashedPassword,
        roleId: data.roleId,
        rowStatus: true,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        roleId: true,
        rowStatus: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            roleName: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: newUser };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Gagal membuat user" };
  }
}

export async function updateUser(userId: number, data: Partial<UserInput>) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    const updateData: any = {
      fullName: data.fullName,
      roleId: data.roleId,
    };

    // Only update password if provided
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Check username uniqueness if updating
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return { success: false, error: "Username sudah digunakan" };
      }
      updateData.username = data.username;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        roleId: true,
        rowStatus: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            roleName: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Gagal mengupdate user" };
  }
}

export async function deleteUser(userId: number) {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { rowStatus: false },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Gagal menghapus user" };
  }
}

export async function getRoles() {
  try {
    const authResult = await requireAdminSession();
    if (!authResult.ok) {
      return { success: false, error: authResult.error };
    }

    const roles = await prisma.role.findMany({
      where: { rowStatus: true },
      orderBy: { roleName: "asc" },
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error("Error fetching roles:", error);
    return { success: false, error: "Gagal mengambil data role" };
  }
}
