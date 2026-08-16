import { requireApiAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl, createStorageObjectName, getYearSegment, removeStorageFile, uploadStorageFile, validateStorageFile } from "@/lib/storage";
import { StorageBucket } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateCatalogSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  rowStatus: z.coerce.boolean().optional(),
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const catalog = await prisma.companyCatalog.findUnique({ where: { id: Number(id) } });
  if (!catalog) {
    return NextResponse.json({ success: false, error: "Katalog tidak ditemukan" }, { status: 404 });
  }

  let signedUrl: string | null = null;
  if (req.nextUrl.searchParams.get("signedUrl") === "true" && catalog.imagePath) {
    signedUrl = await createSignedStorageUrl(catalog.imageBucket, catalog.imagePath);
  }

  return NextResponse.json({
    success: true,
    data: { ...catalog, price: catalog.price ? Number(catalog.price) : null, signedUrl },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const existing = await prisma.companyCatalog.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Katalog tidak ditemukan" }, { status: 404 });
  }

  try {
    const { values, file } = await parseCatalogInput(req);
    const parsed = updateCatalogSchema.safeParse(values);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const nextImagePath = await uploadCatalogImage(file);
    const updated = await prisma.companyCatalog.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name ?? existing.name,
        description: parsed.data.description === undefined ? existing.description : parsed.data.description || null,
        price: parsed.data.price === undefined ? existing.price : parsed.data.price,
        sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
        rowStatus: parsed.data.rowStatus ?? existing.rowStatus,
        imageBucket: StorageBucket.COMPANY_CATALOG,
        imagePath: nextImagePath ?? existing.imagePath,
      },
    });

    if (nextImagePath && existing.imagePath) {
      try {
        await removeStorageFile(existing.imageBucket, existing.imagePath);
      } catch (error) {
        console.error("remove old catalog image error", error);
      }
    }

    revalidatePath("/dashboard/master/company-catalog");
    return NextResponse.json({ success: true, data: { ...updated, price: updated.price ? Number(updated.price) : null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui katalog";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const existing = await prisma.companyCatalog.findUnique({ where: { id: Number(id) } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Katalog tidak ditemukan" }, { status: 404 });
  }

  await prisma.companyCatalog.update({ where: { id: existing.id }, data: { rowStatus: false } });
  revalidatePath("/dashboard/master/company-catalog");
  return NextResponse.json({ success: true });
}