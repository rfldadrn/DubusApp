"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";
import { Prisma } from "@prisma/client";

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

    const normalizedRows = rows
      .map((row, index) => {
        const name = row.name?.trim();
        if (!name) return null;

        return {
          rowIndex: index + 2,
          name,
          normalizedName: name.toLowerCase(),
          normalizedPhone: normalizePhoneNumber(row.phoneNumber) || "",
          gender: row.gender || null,
          originalPhone: row.phoneNumber,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const uniqueNames = Array.from(new Set(normalizedRows.map((row) => row.normalizedName)));
    const uniquePhones = Array.from(new Set(normalizedRows.map((row) => row.normalizedPhone).filter(Boolean)));

    const existingCustomers =
      uniqueNames.length > 0 || uniquePhones.length > 0
        ? await prisma.$queryRaw<Array<{ name: string; phoneNumber: string | null }>>(Prisma.sql`
            SELECT name, "phoneNumber"
            FROM customers
            WHERE "agencyId" IS NULL
              AND (
                LOWER(name) = ANY(${uniqueNames})
                OR (
                  "phoneNumber" IS NOT NULL
                  AND "phoneNumber" = ANY(${uniquePhones})
                )
              )
          `)
        : [];

    const existingNameSet = new Set(existingCustomers.map((customer) => customer.name.toLowerCase()));
    const existingPhoneSet = new Set(
      existingCustomers.map((customer) => customer.phoneNumber).filter((phone): phone is string => Boolean(phone))
    );

    for (const row of normalizedRows) {
      const normalizedName = row.normalizedName;
      const normalizedPhone = row.normalizedPhone;
      const fileKey = `${normalizedName}|${normalizedPhone}`;

      if (seenInFile.has(fileKey)) {
        duplicates.push({
          row: row.rowIndex,
          name: row.name,
          phone: row.originalPhone,
          reason: "Duplikat di file import",
        });
        continue;
      }
      seenInFile.add(fileKey);

      const nameExists = existingNameSet.has(normalizedName);
      const phoneExists = normalizedPhone ? existingPhoneSet.has(normalizedPhone) : false;

      if (nameExists || phoneExists) {
        let reason = "";
        if (nameExists) {
          reason = "Nama sama";
        }
        if (phoneExists) {
          reason += (reason ? " & " : "") + "Nomor telepon sama";
        }

        duplicates.push({
          row: row.rowIndex,
          name: row.name,
          phone: row.originalPhone,
          reason,
        });
      } else {
        toImport.push({
          name: row.name,
          phoneNumber: row.originalPhone,
          gender: row.gender as "Laki_laki" | "Perempuan" | undefined,
        });
        existingNameSet.add(normalizedName);
        if (normalizedPhone) existingPhoneSet.add(normalizedPhone);
      }
    }

    let importedCount = 0;
    if (toImport.length > 0) {
      await prisma.$executeRawUnsafe(
        "SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 0) + 1, false)"
      );

      const BATCH_SIZE = 200;
      for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
        const batch = toImport.slice(i, i + BATCH_SIZE);
        const created = await prisma.customer.createMany({
          data: batch.map((c) => ({
            name: c.name.trim(),
            phoneNumber: normalizePhoneNumber(c.phoneNumber),
            gender: c.gender || null,
            agencyId: null,
          })),
          skipDuplicates: true,
        });
        importedCount += created.count;
      }
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
