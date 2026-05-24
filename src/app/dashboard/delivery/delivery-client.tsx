"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createDelivery, getDeliveryHistory, getReadyItemsByProject } from "./actions";
import { toast } from "sonner";

type Project = {
  id: number;
  projectCode: string;
  projectName: string;
  agencyName: string;
  deliveryCount: number;
  transactionCount: number;
};

type ReadyItem = {
  id: number;
  transactionId: number;
  transactionCode: string;
  customerName: string;
  itemName: string;
  modelDescription: string | null;
  targetDate: string | null;
};

type DeliveryHistory = {
  id: number;
  deliveryCode: string;
  projectName: string;
  agencyName: string;
  deliveryDate: string;
  status: "Pending" | "PartialDelivered" | "FullyDelivered";
  destination: string;
  recipientName: string | null;
  recipientPhone: string | null;
  itemCount: number;
  handledBy: string;
};

export function DeliveryClient({
  initialProjects,
  initialHistory,
}: {
  initialProjects: Project[];
  initialHistory: DeliveryHistory[];
}) {
  const [projects] = useState<Project[]>(initialProjects);
  const [history, setHistory] = useState<DeliveryHistory[]>(initialHistory);
  const [loading, setLoading] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [readyItems, setReadyItems] = useState<ReadyItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const [destination, setDestination] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === Number(selectedProjectId)),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProjectId) {
      setReadyItems([]);
      setSelectedItemIds([]);
      return;
    }

    setLoading(true);
    getReadyItemsByProject(Number(selectedProjectId))
      .then((items) => {
        setReadyItems(items);
        setSelectedItemIds(items.map((i) => i.id));
        if (selectedProject) {
          setDestination(`Kantor ${selectedProject.agencyName}`);
        }
      })
      .catch(() => {
        toast.error("Gagal memuat item siap kirim");
      })
      .finally(() => setLoading(false));
  }, [selectedProjectId, selectedProject]);

  const toggleAll = (checked: boolean) => {
    setSelectedItemIds(checked ? readyItems.map((item) => item.id) : []);
  };

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const refreshHistory = async () => {
    const rows = await getDeliveryHistory();
    setHistory(rows);
  };

  const handleCreateDelivery = async () => {
    if (!selectedProjectId) {
      toast.error("Pilih project terlebih dahulu");
      return;
    }
    if (!destination.trim()) {
      toast.error("Tujuan pengantaran wajib diisi");
      return;
    }
    if (selectedItemIds.length === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }

    setLoading(true);
    try {
      const result = await createDelivery({
        projectId: Number(selectedProjectId),
        itemIds: selectedItemIds,
        destination,
        recipientName,
        recipientPhone,
        notes,
      });

      if (!result.success) {
        toast.error(result.error || "Gagal membuat pengantaran");
        return;
      }

      toast.success(`Pengantaran ${result.deliveryCode} berhasil (${result.itemCount} item)`);

      const items = await getReadyItemsByProject(Number(selectedProjectId));
      setReadyItems(items);
      setSelectedItemIds(items.map((i) => i.id));

      setRecipientName("");
      setRecipientPhone("");
      setNotes("");
      await refreshHistory();
    } catch {
      toast.error("Gagal membuat pengantaran");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: DeliveryHistory["status"]) => {
    if (status === "FullyDelivered") return <Badge className="bg-green-100 text-green-800">Terkirim Penuh</Badge>;
    if (status === "PartialDelivered") return <Badge className="bg-yellow-100 text-yellow-800">Terkirim Sebagian</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Project / Batch Agency *</Label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.agencyName} - {project.projectName} ({project.projectCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tujuan Pengantaran *</Label>
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Alamat/Kantor tujuan" />
        </div>
        <div>
          <Label>Penerima (Opsional)</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Nama penerima" />
        </div>
        <div>
          <Label>No Telepon Penerima (Opsional)</Label>
          <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="08... / 62..." />
        </div>
      </div>

      <div>
        <Label>Catatan (Opsional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan pengantaran" rows={2} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Item Siap Kirim</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={readyItems.length > 0 && selectedItemIds.length === readyItems.length}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            <span className="text-xs text-muted-foreground">Pilih semua ({selectedItemIds.length}/{readyItems.length})</span>
          </div>
        </div>

        <div className="rounded-md border max-h-[320px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {selectedProjectId ? "Tidak ada item siap kirim untuk project ini" : "Pilih project untuk melihat item"}
                  </TableCell>
                </TableRow>
              ) : (
                readyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.transactionCode}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.modelDescription || "-"}</TableCell>
                    <TableCell>{item.targetDate ? new Date(item.targetDate).toLocaleDateString("id-ID") : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleCreateDelivery} disabled={loading || selectedItemIds.length === 0 || !selectedProjectId}>
          {loading ? "Memproses..." : `Buat Pengantaran (${selectedItemIds.length} item)`}
        </Button>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-semibold">Riwayat Pengantaran</h3>
        <div className="rounded-md border max-h-[360px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Agency / Project</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Penerima</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada riwayat pengantaran
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.deliveryCode}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.agencyName}</div>
                      <div className="text-xs text-muted-foreground">{row.projectName}</div>
                    </TableCell>
                    <TableCell>{new Date(row.deliveryDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>{row.itemCount} item</TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                    <TableCell>{row.destination}</TableCell>
                    <TableCell>{row.recipientName || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
