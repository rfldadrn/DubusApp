import { requireApiAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  createStorageObjectName,
  formatTransactionStorageId,
  getYearSegment,
  parseStorageBucket,
  uploadStorageFile,
  validateStorageFile,
} from "@/lib/storage";
import { AttachmentEntityType, StorageBucket } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseEntityType(value: FormDataEntryValue | null) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return Object.values(AttachmentEntityType).includes(normalized as AttachmentEntityType)
    ? (normalized as AttachmentEntityType)
    : null;
}

function isAllowedAttachmentContext(bucket: StorageBucket, entityType: AttachmentEntityType) {
  if (bucket === StorageBucket.TRANSACTIONS) {
    return entityType === AttachmentEntityType.TRANSACTION || entityType === AttachmentEntityType.TRANSACTION_ITEM;
  }
  if (bucket === StorageBucket.DOCUMENTS) {
    const documentEntities: AttachmentEntityType[] = [
      AttachmentEntityType.AGENCY,
      AttachmentEntityType.AGENCY_PROJECT,
      AttachmentEntityType.COMPANY,
      AttachmentEntityType.CUSTOMER,
      AttachmentEntityType.DELIVERY,
      AttachmentEntityType.PRODUCTION,
    ];
    return documentEntities.includes(entityType);
  }
  return false;
}

function buildAttachmentPath(params: {
  bucket: StorageBucket;
  entityType: AttachmentEntityType;
  entityId: string;
  transactionId?: string;
  objectName: string;
}) {
  const year = getYearSegment();

  if (params.bucket === StorageBucket.TRANSACTIONS) {
    const transactionId = formatTransactionStorageId(params.transactionId || params.entityId);
    if (params.entityType === AttachmentEntityType.TRANSACTION_ITEM) {
      return `${year}/${transactionId}/items/${params.entityId}/model/${params.objectName}`;
    }
    return `${year}/${transactionId}/${params.objectName}`;
  }

  if (params.entityType === AttachmentEntityType.AGENCY) {
    return `${year}/agency/${params.entityId}/${params.objectName}`;
  }

  if (params.entityType === AttachmentEntityType.COMPANY) {
    return `${year}/company/${params.objectName}`;
  }

  return `${year}/${params.entityType.toLowerCase()}/${params.entityId}/${params.objectName}`;
}

export async function POST(req: NextRequest) {
  const access = await requireApiAccess(req);
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const bucket = parseStorageBucket(formData.get("bucket"));
    const entityType = parseEntityType(formData.get("entityType"));
    const entityId = String(formData.get("entityId") || "").trim();
    const description = String(formData.get("description") || "").trim() || null;
    const transactionId = String(formData.get("transactionId") || "").trim() || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "File wajib diisi" }, { status: 400 });
    }
    if (!bucket || !entityType || !entityId) {
      return NextResponse.json({ success: false, error: "bucket, entityType, dan entityId wajib diisi" }, { status: 400 });
    }
    if (!isAllowedAttachmentContext(bucket, entityType)) {
      return NextResponse.json({ success: false, error: "Kombinasi bucket dan entityType tidak valid" }, { status: 400 });
    }

    const validation = validateStorageFile(file, bucket);
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const objectName = createStorageObjectName(file.name);
    const path = buildAttachmentPath({ bucket, entityType, entityId, transactionId, objectName });

    await uploadStorageFile(bucket, path, file);

    const attachment = await prisma.attachment.create({
      data: {
        bucket,
        path,
        originalName: file.name,
        description,
        mimeType: file.type,
        size: file.size,
        entityType,
        entityId,
        uploadedBy: access.userId,
      },
    });

    revalidatePath("/dashboard/master/company-documents");
    revalidatePath("/dashboard/agency");
    revalidateTag("attachments");

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}