"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

interface ImportResult {
  success: boolean;
  imported: number;
  duplicates: Array<{ row: number; name: string; phone?: string; reason: string }>;
  errors: string[];
}

export async function importCustomers(data: Array<{
  name: string;
  phoneNumber?: string;
  gender?: string;
  agencyCode?: string;
}>): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, imported: 0, duplicates: [], errors: ["Unauthorized"] };

  const errors: string[] = [];
  const duplicates: Array<{ row: number; name: string; phone?: string; reason: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.name?.trim()) {
      errors.push(`Baris ${i + 2}: Nama pelanggan wajib diisi`);
      continue;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(row.phoneNumber);

      // Check for duplicates
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            { name: { equals: row.name.trim(), mode: "insensitive" } },
            ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
          ],
        },
      });

      if (existing) {
        let reason = "";
        if (existing.name.toLowerCase() === row.name.trim().toLowerCase()) {
          reason = "Nama sama";
        }
        if (normalizedPhone && existing.phoneNumber === normalizedPhone) {
          reason += (reason ? " & " : "") + "Nomor telepon sama";
        }
        duplicates.push({
          row: i + 2,
          name: row.name.trim(),
          phone: normalizedPhone || undefined,
          reason,
        });
        continue;
      }

      let agencyId: number | null = null;
      if (row.agencyCode?.trim()) {
        const agency = await prisma.agency.findFirst({ where: { agencyCode: row.agencyCode.trim() } });
        if (agency) agencyId = agency.id;
        else errors.push(`Baris ${i + 2}: Agency "${row.agencyCode}" tidak ditemukan, pelanggan dibuat tanpa agency`);
      }

      const gender = row.gender === "Laki-laki" || row.gender === "L" ? "Laki_laki" : row.gender === "Perempuan" || row.gender === "P" ? "Perempuan" : null;

      await prisma.customer.create({
        data: {
          name: row.name.trim(),
          phoneNumber: normalizedPhone,
          gender: gender as any,
          agencyId,
        },
      });
      imported++;
    } catch (err: any) {
      errors.push(`Baris ${i + 2}: ${err.message}`);
    }
  }

  revalidatePath("/dashboard/customers");
  return { success: imported > 0, imported, duplicates, errors };
}

export async function importEmployees(data: Array<{
  name: string;
  phoneNumber?: string;
  gender?: string;
  address?: string;
  employeeType?: string;
}>): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, imported: 0, duplicates: [], errors: ["Unauthorized"] };

  const errors: string[] = [];
  const duplicates: Array<{ row: number; name: string; phone?: string; reason: string }> = [];
  let imported = 0;

  const empTypes: Array<{ id: number; name: string }> = await prisma.employeeType.findMany({
    where: { rowStatus: true },
    select: { id: true, name: true },
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.name?.trim()) {
      errors.push(`Baris ${i + 2}: Nama karyawan wajib diisi`);
      continue;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(row.phoneNumber);
      const empType = empTypes.find((t) => t.name.toLowerCase() === row.employeeType?.toLowerCase());
      const gender = row.gender === "Laki-laki" || row.gender === "L" ? "Laki_laki" : row.gender === "Perempuan" || row.gender === "P" ? "Perempuan" : null;

      await prisma.employee.create({
        data: {
          name: row.name.trim(),
          phoneNumber: normalizedPhone,
          gender: gender as any,
          address: row.address?.trim() || null,
          employeeTypeId: empType?.id || null,
          joinDate: new Date(),
        },
      });
      imported++;
    } catch (err: any) {
      errors.push(`Baris ${i + 2}: ${err.message}`);
    }
  }

  revalidatePath("/dashboard/master");
  return { success: imported > 0, imported, duplicates, errors };
}

export async function importItems(data: Array<{
  code: string;
  name: string;
  category?: string;
  genderTarget?: string;
  customerPrice: number;
  employeePrice: number;
}>): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, imported: 0, duplicates: [], errors: ["Unauthorized"] };

  const errors: string[] = [];
  const duplicates: Array<{ row: number; name: string; phone?: string; reason: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row.code?.trim() || !row.name?.trim()) {
      errors.push(`Baris ${i + 2}: Kode dan nama wajib diisi`);
      continue;
    }

    try {
      const existing = await prisma.item.findFirst({ where: { code: row.code.trim() } });
      if (existing) {
        duplicates.push({
          row: i + 2,
          name: row.name.trim(),
          reason: `Kode "${row.code}" sudah ada`,
        });
        continue;
      }

      const gt = row.genderTarget === "Pria" ? "Pria" : row.genderTarget === "Wanita" ? "Wanita" : "Unisex";

      await prisma.item.create({
        data: {
          code: row.code.trim().toUpperCase(),
          name: row.name.trim(),
          category: row.category?.trim() || null,
          genderTarget: gt as any,
          customerPrice: row.customerPrice || 0,
          employeePrice: row.employeePrice || 0,
        },
      });
      imported++;
    } catch (err: any) {
      errors.push(`Baris ${i + 2}: ${err.message}`);
    }
  }

  revalidatePath("/dashboard/master");
  return { success: imported > 0, imported, duplicates, errors };
}
