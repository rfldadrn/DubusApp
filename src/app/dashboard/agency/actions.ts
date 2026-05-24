"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

export async function getAgencies() {
  const agencies = await prisma.agency.findMany({
    where: { rowStatus: true },
    include: {
      _count: { select: { projects: true, customers: true } },
      projects: {
        where: { rowStatus: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return agencies.map((a) => ({
    id: a.id,
    agencyCode: a.agencyCode,
    name: a.name,
    description: a.description,
    projectCount: a._count.projects,
    customerCount: a._count.customers,
    projects: a.projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      name: p.name,
      picName: p.picName,
      picPhone: p.picPhone,
      startDate: p.startDate?.toISOString() || null,
      targetDate: p.targetDate?.toISOString() || null,
      contractStatus: p.contractStatus,
    })),
  }));
}

export async function createAgency(data: { agencyCode: string; name: string; description?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.agency.create({
      data: {
        agencyCode: data.agencyCode,
        name: data.name,
        description: data.description || null,
        createdBy: parseInt(session.user.id),
      },
    });

    revalidatePath("/dashboard/agency");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "Kode agency sudah digunakan" };
    return { success: false, error: "Gagal membuat agency" };
  }
}

export async function updateAgency(id: number, data: { agencyCode: string; name: string; description?: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.agency.update({
      where: { id },
      data: { agencyCode: data.agencyCode, name: data.name, description: data.description || null },
    });

    revalidatePath("/dashboard/agency");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") return { success: false, error: "Kode agency sudah digunakan" };
    return { success: false, error: "Gagal mengupdate agency" };
  }
}

export async function deleteAgency(id: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const count = await prisma.customer.count({ where: { agencyId: id } });
    if (count > 0) return { success: false, error: `Agency memiliki ${count} pelanggan. Tidak bisa dihapus.` };

    await prisma.agency.update({ where: { id }, data: { rowStatus: false } });
    revalidatePath("/dashboard/agency");
    return { success: true };
  } catch { return { success: false, error: "Gagal menghapus agency" }; }
}

export async function createProject(data: {
  agencyId: number;
  projectCode: string;
  name: string;
  description?: string;
  picName?: string;
  picPhone?: string;
  startDate?: string;
  targetDate?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Self-heal sequence drift (common after manual import/reset)
    await prisma.$executeRawUnsafe(
      "SELECT setval(pg_get_serial_sequence('agency_projects', 'id'), COALESCE((SELECT MAX(id) FROM agency_projects), 0) + 1, false)"
    );

    await prisma.agencyProject.create({
      data: {
        agencyId: data.agencyId,
        projectCode: data.projectCode,
        name: data.name,
        description: data.description || null,
        picName: data.picName || null,
        picPhone: normalizePhoneNumber(data.picPhone),
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        contractStatus: "Active",
      },
    });

    revalidatePath("/dashboard/agency");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(",") : String(error?.meta?.target || "");
      if (target.includes("projectCode")) {
        return { success: false, error: "Kode project sudah digunakan" };
      }
      if (target.includes("id")) {
        return { success: false, error: "ID project bentrok (sequence database tidak sinkron). Coba submit ulang." };
      }
      return { success: false, error: "Data project duplikat" };
    }
    return { success: false, error: "Gagal membuat project" };
  }
}

export async function importCustomersToAgency(agencyId: number, customers: { name: string; phoneNumber?: string; gender?: "Laki_laki" | "Perempuan" }[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.$executeRawUnsafe(
      "SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 0) + 1, false)"
    );

    const created = await prisma.customer.createMany({
      data: customers.map((c) => ({
        name: c.name,
        phoneNumber: normalizePhoneNumber(c.phoneNumber),
        gender: c.gender || null,
        agencyId,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/dashboard/agency");
    revalidatePath("/dashboard/customers");
    return { success: true, count: created.count };
  } catch (error) {
    console.error("Error importing customers:", error);
    return { success: false, error: "Gagal mengimport data" };
  }
}

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

export async function importAgencyCustomersFromExcel(
  agencyId: number,
  rows: ImportRow[]
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Check for duplicates in database and same-file duplicates
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

      // Check by name and phone in same agency
      const existing = await prisma.customer.findFirst({
        where: {
          agencyId,
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
          row: i + 2, // Excel row (header is row 1)
          name: row.name,
          phone: row.phoneNumber,
          reason,
        });
      } else {
        toImport.push(row);
      }
    }

    // Import non-duplicates
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
          agencyId,
        })),
        skipDuplicates: true,
      });
      importedCount = created.count;
    }

    revalidatePath("/dashboard/agency");
    revalidatePath("/dashboard/customers");
    return {
      success: true,
      imported: importedCount,
      duplicates,
      total: rows.length,
    };
  } catch (error) {
    console.error("Error importing from Excel:", error);
    return { success: false, error: "Gagal mengimport data" };
  }
}
