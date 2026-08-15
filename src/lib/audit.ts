import { prisma } from "@/lib/prisma";

type AuditPayload = {
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
};

export async function writeAuditLog(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: payload.userId,
        action: payload.action,
        tableName: payload.tableName,
        recordId: payload.recordId,
        oldValues: payload.oldValues as any,
        newValues: payload.newValues as any,
        ipAddress: payload.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
