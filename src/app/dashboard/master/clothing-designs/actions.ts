"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const designSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi").max(50),
  name: z.string().trim().min(1, "Nama wajib diisi").max(150),
  description: z.string().trim().max(255).optional().nullable(),
  category: z.string().trim().max(100).optional().nullable(),
  genderTarget: z.enum(["Pria", "Wanita", "Unisex"]),
  svgContent: z.string().trim().min(20, "SVG wajib diisi").max(60_000),
  itemId: z.number().int().positive().optional().nullable(),
});

const ALLOWED_SVG_TAGS = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline",
  "polygon", "text", "tspan", "defs", "title", "desc", "linearGradient",
  "radialGradient", "stop",
]);

// Validasi ringan: pastikan input adalah SVG dan tidak mengandung tag berbahaya.
// Tolak <script>, event handler on*, javascript:, dan <foreignObject>/<iframe>.
function validateSvg(svg: string): { ok: true } | { ok: false; error: string } {
  const trimmed = svg.trim();
  if (!trimmed.startsWith("<svg")) {
    return { ok: false, error: "Konten harus diawali <svg>" };
  }
  if (/<\s*script/i.test(trimmed)) return { ok: false, error: "Tag <script> tidak diizinkan" };
  if (/<\s*(iframe|foreignObject|embed|object|video|audio)/i.test(trimmed)) {
    return { ok: false, error: "Tag terlarang ditemukan" };
  }
  if (/\son[a-z]+\s*=/i.test(trimmed)) return { ok: false, error: "Event handler tidak diizinkan" };
  if (/javascript:/i.test(trimmed)) return { ok: false, error: "URL javascript: tidak diizinkan" };

  const tagRegex = /<\s*([a-zA-Z][a-zA-Z0-9-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(trimmed)) !== null) {
    const tag = m[1].toLowerCase();
    if (!ALLOWED_SVG_TAGS.has(tag)) {
      return { ok: false, error: `Tag <${tag}> tidak diizinkan` };
    }
  }
  return { ok: true };
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function listClothingDesigns() {
  await requireAuth();
  const designs = await prisma.clothing_designs.findMany({
    where: { rowStatus: true },
    include: {
      items_clothing_designs_itemIdToitems: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: [{ isBuiltin: "desc" }, { name: "asc" }],
  });

  return designs.map((design) => ({
    ...design,
    item: design.items_clothing_designs_itemIdToitems,
  }));
}

export async function createClothingDesign(input: unknown) {
  await requireAuth();
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" };
  }
  const v = validateSvg(parsed.data.svgContent);
  if (!v.ok) return { success: false, error: v.error };

  try {
    const existing = await prisma.clothing_designs.findUnique({ where: { code: parsed.data.code } });
    if (existing) return { success: false, error: "Kode sudah dipakai" };

    await prisma.clothing_designs.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        genderTarget: parsed.data.genderTarget,
        svgContent: parsed.data.svgContent,
        itemId: parsed.data.itemId || null,
        isBuiltin: false,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/dashboard/master/clothing-designs");
    return { success: true };
  } catch (e) {
    console.error("createClothingDesign error", e);
    return { success: false, error: "Gagal menyimpan" };
  }
}

export async function updateClothingDesign(id: number, input: unknown) {
  await requireAuth();
  const parsed = designSchema.partial({ code: true }).safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" };
  }
  if (parsed.data.svgContent) {
    const v = validateSvg(parsed.data.svgContent);
    if (!v.ok) return { success: false, error: v.error };
  }

  try {
    const existing = await prisma.clothing_designs.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Data tidak ditemukan" };
    if (existing.isBuiltin && parsed.data.code && parsed.data.code !== existing.code) {
      return { success: false, error: "Kode design bawaan tidak boleh diubah" };
    }

    await prisma.clothing_designs.update({
      where: { id },
      data: {
        name: parsed.data.name ?? existing.name,
        description: parsed.data.description ?? existing.description,
        category: parsed.data.category ?? existing.category,
        genderTarget: parsed.data.genderTarget ?? existing.genderTarget,
        svgContent: parsed.data.svgContent ?? existing.svgContent,
        itemId: parsed.data.itemId === undefined ? existing.itemId : parsed.data.itemId,
      },
    });
    revalidatePath("/dashboard/master/clothing-designs");
    return { success: true };
  } catch (e) {
    console.error("updateClothingDesign error", e);
    return { success: false, error: "Gagal menyimpan" };
  }
}

export async function deleteClothingDesign(id: number) {
  await requireAuth();
  try {
    const existing = await prisma.clothing_designs.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Data tidak ditemukan" };
    if (existing.isBuiltin) return { success: false, error: "Design bawaan tidak bisa dihapus" };
    // Soft delete supaya tidak break transaksi lama yang mereferensikan design ini.
    await prisma.clothing_designs.update({ where: { id }, data: { rowStatus: false } });
    revalidatePath("/dashboard/master/clothing-designs");
    return { success: true };
  } catch (e) {
    console.error("deleteClothingDesign error", e);
    return { success: false, error: "Gagal menghapus" };
  }
}

export async function setItemDefaultDesign(itemId: number, designId: number | null) {
  await requireAuth();
  try {
    await prisma.item.update({ where: { id: itemId }, data: { defaultDesignId: designId } });
    revalidatePath("/dashboard/master/clothing-designs");
    revalidatePath("/dashboard/master");
    return { success: true };
  } catch (e) {
    console.error("setItemDefaultDesign error", e);
    return { success: false, error: "Gagal mengatur default" };
  }
}
