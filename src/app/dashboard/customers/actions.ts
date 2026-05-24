"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

interface ImportRow {
  name: string;
  phoneNumber?: string;
  gender?: "Laki_laki" | "Perempuan";
}

interface DuplicateInfo {
  row: number;
  name: string;
  phone?: string;
  reason: string;
}

export async function importRegularCustomersFromExcel(rows: ImportRow[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const duplicates: DuplicateInfo[] = [];
    const toImport: ImportRow[] = [];
    const seenInFile = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name?.trim()) continue;

      const normalizedName = row.name.trim().toLowerCase();
      const normalizedPhone = normalizePhoneNumber(row.phoneNumber) || "";
      const fileKey = `${normalizedName}|${normalizedPhone}`;

      if (seenInFile.has(fileKey)) {
        duplicates.push({
          row: i + 2,
          name: row.name,
          phone: row.phoneNumber,
          reason: "Duplikat di file import",
        });
        continue;
      }
      seenInFile.add(fileKey);

      const existing = await prisma.customer.findFirst({
        where: {
          agencyId: null,
          OR: [
            { name: { equals: row.name.trim(), mode: "insensitive" } },
            ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : []),
          ],
        },
      });

      if (existing) {
        let reason = "";
        if (existing.name.toLowerCase() === normalizedName) {
          reason = "Nama sama";
        }
        if (normalizedPhone && existing.phoneNumber === normalizedPhone) {
          reason += (reason ? " & " : "") + "Nomor telepon sama";
        }

        duplicates.push({
          row: i + 2,
          name: row.name,
          phone: row.phoneNumber,
          reason,
        });
      } else {
        toImport.push(row);
      }
    }

    let importedCount = 0;
    if (toImport.length > 0) {
      await prisma.$executeRawUnsafe(
        "SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 0) + 1, false)"
      );

      const created = await prisma.customer.createMany({
        data: toImport.map((c) => ({
          name: c.name.trim(),
          phoneNumber: normalizePhoneNumber(c.phoneNumber),
          gender: c.gender || null,
          agencyId: null,
        })),
        skipDuplicates: true,
      });

      importedCount = created.count;
    }

    revalidatePath("/dashboard/customers");

    return {
      success: true,
      imported: importedCount,
      duplicates,
      total: rows.length,
    };
  } catch (error) {
    console.error("Error importing regular customers from Excel:", error);
    return { success: false, error: "Gagal mengimport data pelanggan" };
  }
}
