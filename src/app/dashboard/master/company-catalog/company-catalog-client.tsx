"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Catalog = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  imagePath: string | null;
  sortOrder: number;
  rowStatus: boolean;
};

type CatalogForm = {
  name: string;
  description: string;
  price: string;
  sortOrder: string;
  rowStatus: boolean;
  file: File | null;
};

const emptyForm: CatalogForm = {
  name: "",
  description: "",
  price: "",
  sortOrder: "0",
  rowStatus: true,
  file: null,
};

export function CompanyCatalogClient({ initialCatalogs }: { initialCatalogs: Catalog[] }) {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState(initialCatalogs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Catalog | null>(null);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (catalog: Catalog) => {
    setEditing(catalog);
    setForm({
      name: catalog.name,
      description: catalog.description || "",
      price: catalog.price ? String(catalog.price) : "",
      sortOrder: String(catalog.sortOrder),
      rowStatus: catalog.rowStatus,
      file: null,
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("price", form.price || "");
      formData.append("sortOrder", form.sortOrder || "0");
      formData.append("rowStatus", String(form.rowStatus));
      if (form.file) formData.append("file", form.file);

      const response = await fetch(editing ? `/api/v1/company-catalog/${editing.id}` : "/api/v1/company-catalog", {
        method: editing ? "PATCH" : "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menyimpan katalog");

      setDialogOpen(false);
      toast.success("Katalog berhasil disimpan");
      router.refresh();
      const fresh = await fetch("/api/v1/company-catalog?includeInactive=true", { cache: "no-store" }).then((res) => res.json());
      if (fresh.success) setCatalogs(fresh.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan katalog");
    } finally {
      setLoading(false);
    }
  };

  const openImage = async (catalog: Catalog) => {
    if (!catalog.imagePath) {
      toast.error("Katalog belum memiliki gambar");
      return;
    }

    try {
      const response = await fetch(`/api/v1/company-catalog/${catalog.id}?signedUrl=true`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuka gambar");
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuka gambar");
    }
  };

  const remove = async (catalog: Catalog) => {
    if (!confirm(`Nonaktifkan katalog ${catalog.name}?`)) return;

    try {
      const response = await fetch(`/api/v1/company-catalog/${catalog.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menghapus katalog");
      setCatalogs((current) => current.map((item) => (item.id === catalog.id ? { ...item, rowStatus: false } : item)));
      toast.success("Katalog dinonaktifkan");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus katalog");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Katalog
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Belum ada katalog
                </TableCell>
              </TableRow>
            ) : (
              catalogs.map((catalog) => (
                <TableRow key={catalog.id}>
                  <TableCell>
                    <div className="font-medium">{catalog.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{catalog.description || "-"}</div>
                  </TableCell>
                  <TableCell>{catalog.price ? `Rp ${catalog.price.toLocaleString("id-ID")}` : "-"}</TableCell>
                  <TableCell>{catalog.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={catalog.rowStatus ? "default" : "secondary"}>{catalog.rowStatus ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openImage(catalog)} disabled={!catalog.imagePath}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(catalog)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(catalog)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Katalog" : "Tambah Katalog"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama *</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Harga</Label>
                <Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value.replace(/[^0-9]/g, "") })} />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value.replace(/[^0-9]/g, "") })} />
              </div>
            </div>
            <div>
              <Label>Foto Katalog</Label>
              <Input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} />
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP, SVG. Maksimal 5MB.</p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.rowStatus} onChange={(event) => setForm({ ...form, rowStatus: event.target.checked })} />
              Aktif
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={submit} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}