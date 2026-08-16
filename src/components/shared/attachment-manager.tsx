"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type AttachmentRow = {
  id: string;
  originalName: string;
  description: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
};

type AttachmentManagerProps = {
  title?: string;
  bucket: "DOCUMENTS" | "TRANSACTIONS";
  entityType: string;
  entityId: string;
  transactionId?: string;
  initialAttachments: AttachmentRow[];
  accept: string;
  maxSizeLabel: string;
};

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function AttachmentManager({
  title = "Attachment",
  bucket,
  entityType,
  entityId,
  transactionId,
  initialAttachments,
  accept,
  maxSizeLabel,
}: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);
      if (transactionId) formData.append("transactionId", transactionId);
      if (description.trim()) formData.append("description", description.trim());

      const response = await fetch("/api/attachments/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Upload gagal");

      setAttachments((current) => [
        {
          id: result.data.id,
          originalName: result.data.originalName,
          description: result.data.description,
          mimeType: result.data.mimeType,
          size: result.data.size,
          createdAt: result.data.createdAt,
        },
        ...current,
      ]);
      setFile(null);
      setDescription("");
      toast.success("File berhasil diupload");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  };

  const openAttachment = async (id: string) => {
    try {
      const response = await fetch(`/api/attachments/${id}/signed-url`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuka file");
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuka file");
    }
  };

  const deleteAttachment = async (id: string) => {
    if (!confirm("Hapus file ini?")) return;

    try {
      const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menghapus file");
      setAttachments((current) => current.filter((attachment) => attachment.id !== id));
      toast.success("File berhasil dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus file");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">Tipe file sesuai aturan bucket, maksimal {maxSizeLabel}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <div>
          <Label>File</Label>
          <Input type="file" accept={accept} onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </div>
        <div>
          <Label>Keterangan</Label>
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Kontrak, SIUP, daftar pegawai..." />
        </div>
        <Button type="button" onClick={upload} disabled={loading || !file}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Belum ada file
                </TableCell>
              </TableRow>
            ) : (
              attachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell>
                    <div className="font-medium">{attachment.originalName}</div>
                    <div className="text-xs text-muted-foreground">{attachment.mimeType}</div>
                  </TableCell>
                  <TableCell>{attachment.description || "-"}</TableCell>
                  <TableCell>{formatSize(attachment.size)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openAttachment(attachment.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => deleteAttachment(attachment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}