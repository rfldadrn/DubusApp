import { StorageBucket } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const STORAGE_LIMITS = {
  [StorageBucket.TRANSACTIONS]: {
    maxSize: 10 * 1024 * 1024,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  },
  [StorageBucket.DOCUMENTS]: {
    maxSize: 20 * 1024 * 1024,
    mimeTypes: new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  },
  [StorageBucket.COMPANY_CATALOG]: {
    maxSize: 5 * 1024 * 1024,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]),
  },
} as const;

const BUCKET_NAMES: Record<StorageBucket, string> = {
  [StorageBucket.TRANSACTIONS]: "transactions",
  [StorageBucket.DOCUMENTS]: "documents",
  [StorageBucket.COMPANY_CATALOG]: "company_catalog",
};

export function getStorageBucketName(bucket: StorageBucket) {
  return BUCKET_NAMES[bucket];
}

export function parseStorageBucket(value: FormDataEntryValue | string | null): StorageBucket | null {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (normalized === "TRANSACTIONS" || normalized === "transactions") return StorageBucket.TRANSACTIONS;
  if (normalized === "DOCUMENTS" || normalized === "documents") return StorageBucket.DOCUMENTS;
  if (["COMPANY_CATALOG", "company_catalog", "company-catalog"].includes(String(value).trim())) {
    return StorageBucket.COMPANY_CATALOG;
  }
  return null;
}

export function validateStorageFile(file: File, bucket: StorageBucket) {
  const policy = STORAGE_LIMITS[bucket];
  if (!policy.mimeTypes.has(file.type)) {
    return { ok: false as const, error: `Tipe file ${file.type || "unknown"} tidak diizinkan` };
  }
  if (file.size > policy.maxSize) {
    const maxMb = Math.floor(policy.maxSize / 1024 / 1024);
    return { ok: false as const, error: `Ukuran file maksimal ${maxMb}MB` };
  }
  return { ok: true as const };
}

function sanitizeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned || `file-${randomUUID()}`;
}

export function createStorageObjectName(originalName: string) {
  return `${randomUUID()}-${sanitizeFileName(originalName)}`;
}

export function getYearSegment(date = new Date()) {
  return String(date.getFullYear());
}

export function formatTransactionStorageId(id: string | number) {
  const raw = String(id).trim();
  return /^\d+$/.test(raw) ? raw.padStart(6, "0") : raw;
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Storage is not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadStorageFile(bucket: StorageBucket, path: string, file: File) {
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(getStorageBucketName(bucket)).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);
}

export async function createSignedStorageUrl(bucket: StorageBucket, path: string, expiresInSeconds = 300) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(getStorageBucketName(bucket))
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removeStorageFile(bucket: StorageBucket, path: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(getStorageBucketName(bucket)).remove([path]);
  if (error) throw new Error(error.message);
}