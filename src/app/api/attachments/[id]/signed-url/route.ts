import { requireApiAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createSignedStorageUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const signedUrl = await createSignedStorageUrl(attachment.bucket, attachment.path);
    return NextResponse.json({ success: true, data: { signedUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat signed URL";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}