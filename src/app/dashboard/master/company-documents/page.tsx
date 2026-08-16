import { AttachmentManager } from "@/components/shared/attachment-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function CompanyDocumentsPage() {
  const attachments = await prisma.attachment.findMany({
    where: { entityType: "COMPANY", entityId: "company", bucket: "DOCUMENTS" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dokumen Perusahaan</h1>
        <p className="text-muted-foreground">Kelola SIUP, SITU, surat perusahaan, kop surat, dan file internal penting.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Perusahaan</CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentManager
            title="File Perusahaan"
            bucket="DOCUMENTS"
            entityType="COMPANY"
            entityId="company"
            initialAttachments={attachments.map((attachment) => ({
              id: attachment.id,
              originalName: attachment.originalName,
              description: attachment.description,
              mimeType: attachment.mimeType,
              size: attachment.size,
              createdAt: attachment.createdAt.toISOString(),
            }))}
            accept="application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            maxSizeLabel="20MB"
          />
        </CardContent>
      </Card>
    </div>
  );
}