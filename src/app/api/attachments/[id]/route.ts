import { requireApiAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { removeStorageFile } from "@/lib/storage";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ success: false, error: "Attachment tidak ditemukan" }, { status: 404 });
  }

  try {
    await removeStorageFile(attachment.bucket, attachment.path);
  } catch (error) {
    console.error("removeStorageFile error", error);
  }

  await prisma.attachment.delete({ where: { id } });
  revalidatePath("/dashboard/master/company-documents");
  revalidatePath("/dashboard/agency");
  revalidateTag("attachments");

  return NextResponse.json({ success: true });
}