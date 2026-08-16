import { requireApiAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createStorageObjectName, getYearSegment, uploadStorageFile, validateStorageFile } from "@/lib/storage";
import { StorageBucket } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const catalogSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0),
  rowStatus: z.coerce.boolean().optional().default(true),
});

async function parseCatalogInput(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    return {
      values: Object.fromEntries(formData.entries()),
      file: formData.get("file") instanceof File ? (formData.get("file") as File) : null,
    };
  }

  return { values: await req.json(), file: null };
}

async function uploadCatalogImage(file: File | null) {
  if (!file) return null;

  const validation = validateStorageFile(file, StorageBucket.COMPANY_CATALOG);
  if (!validation.ok) throw new Error(validation.error);

  const path = `${getYearSegment()}/catalog/${createStorageObjectName(file.name)}`;
  await uploadStorageFile(StorageBucket.COMPANY_CATALOG, path, file);
  return path;
}

export async function GET(req: NextRequest) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const catalogs = await prisma.companyCatalog.findMany({
    where: includeInactive ? undefined : { rowStatus: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    success: true,
    data: catalogs.map((catalog) => ({ ...catalog, price: catalog.price ? Number(catalog.price) : null })),
  });
}

export async function POST(req: NextRequest) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const { values, file } = await parseCatalogInput(req);
    const parsed = catalogSchema.safeParse(values);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const imagePath = await uploadCatalogImage(file);
    const catalog = await prisma.companyCatalog.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price ?? null,
        sortOrder: parsed.data.sortOrder,
        rowStatus: parsed.data.rowStatus,
        imageBucket: StorageBucket.COMPANY_CATALOG,
        imagePath,
      },
    });

    revalidatePath("/dashboard/master/company-catalog");
    return NextResponse.json({ success: true, data: { ...catalog, price: catalog.price ? Number(catalog.price) : null } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan katalog";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}