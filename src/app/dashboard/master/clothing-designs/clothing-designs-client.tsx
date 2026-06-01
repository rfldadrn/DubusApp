"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import {
  createClothingDesign,
  updateClothingDesign,
  deleteClothingDesign,
  setItemDefaultDesign,
} from "./actions";

type DesignRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  genderTarget: "Pria" | "Wanita" | "Unisex";
  svgContent: string;
  isBuiltin: boolean;
  itemId: number | null;
  item: { id: number; name: string; code: string } | null;
};

type ItemRow = { id: number; code: string; name: string; defaultDesignId: number | null };

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  category: "",
  genderTarget: "Unisex" as "Pria" | "Wanita" | "Unisex",
  svgContent: "",
  itemId: "",
};

function normalizeSvgForPreview(rawSvg: string) {
  const svg = rawSvg.trim();
  if (!svg.startsWith("<svg")) return rawSvg;

  const widthMatch = svg.match(/\bwidth\s*=\s*"([0-9.]+)(px)?"/i);
  const heightMatch = svg.match(/\bheight\s*=\s*"([0-9.]+)(px)?"/i);
  const hasViewBox = /\bviewBox\s*=\s*"[^"]+"/i.test(svg);

  const viewBoxFallback =
    !hasViewBox && widthMatch && heightMatch
      ? ` viewBox="0 0 ${Number(widthMatch[1])} ${Number(heightMatch[1])}"`
      : "";

  // Paksa root <svg> mengikuti box preview agar tidak meluber/offside.
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs) => {
    const cleanedAttrs = String(attrs)
      .replace(/\swidth\s*=\s*"[^"]*"/gi, "")
      .replace(/\sheight\s*=\s*"[^"]*"/gi, "")
      .replace(/\spreserveAspectRatio\s*=\s*"[^"]*"/gi, "")
      .replace(/\sstyle\s*=\s*"[^"]*"/gi, "")
      .trim();

    return `<svg ${cleanedAttrs}${viewBoxFallback} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block;max-width:100%;max-height:100%;">`;
  });
}

export function ClothingDesignsClient({
  designs,
  items,
}: {
  designs: DesignRow[];
  items: ItemRow[];
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DesignRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterItem, setFilterItem] = useState<string>("all");

  const filtered =
    filterItem === "all"
      ? designs
      : designs.filter((d) => (filterItem === "none" ? !d.itemId : String(d.itemId) === filterItem));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (d: DesignRow) => {
    setEditing(d);
    setForm({
      code: d.code,
      name: d.name,
      description: d.description || "",
      category: d.category || "",
      genderTarget: d.genderTarget,
      svgContent: d.svgContent,
      itemId: d.itemId ? String(d.itemId) : "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        genderTarget: form.genderTarget,
        svgContent: form.svgContent.trim(),
        itemId: form.itemId ? Number(form.itemId) : null,
      };
      const res = editing
        ? await updateClothingDesign(editing.id, payload)
        : await createClothingDesign(payload);
      if (res.success) {
        toast.success(editing ? "Design diupdate" : "Design ditambahkan");
        setOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal menyimpan");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (d: DesignRow) => {
    if (d.isBuiltin) {
      toast.error("Design bawaan tidak bisa dihapus");
      return;
    }
    if (!confirm(`Hapus design "${d.name}"?`)) return;
    setLoading(true);
    try {
      const res = await deleteClothingDesign(d.id);
      if (res.success) {
        toast.success("Dihapus");
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal menghapus");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (itemId: number, designId: number | null) => {
    setLoading(true);
    try {
      const res = await setItemDefaultDesign(itemId, designId);
      if (res.success) {
        toast.success("Default diatur");
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 200_000) {
      toast.error("File terlalu besar (max 200 KB)");
      return;
    }
    const text = await file.text();
    const normalized = normalizeSvgForPreview(text);
    setForm((f) => ({ ...f, svgContent: normalized }));
  };

  return (
    <>
      <LoadingOverlay visible={loading} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Daftar Design</CardTitle>
            <p className="text-sm text-muted-foreground">
              {designs.length} design tersedia ({designs.filter((d) => d.isBuiltin).length} bawaan)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterItem} onValueChange={setFilterItem}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua design</SelectItem>
                <SelectItem value="none">Tidak terikat item</SelectItem>
                {items.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Design Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="border rounded-lg overflow-hidden bg-white">
                <div
                  className="bg-slate-50 h-40 p-2 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:object-contain [&_svg]:overflow-visible"
                  dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(d.svgContent) }}
                />
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{d.name}</p>
                    {d.isBuiltin && <Badge variant="secondary">Bawaan</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.code} · {d.genderTarget}
                    {d.category ? ` · ${d.category}` : ""}
                  </p>
                  {d.item && <p className="text-xs text-muted-foreground">Item: {d.item.name}</p>}
                  <div className="flex items-center gap-1 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(d)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {!d.isBuiltin && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(d)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                Tidak ada design.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Design per Item</CardTitle>
          <p className="text-sm text-muted-foreground">
            Design yang otomatis dipakai saat cetak bon untuk item ini (bisa di-override per transaksi).
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b pb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.name} <span className="text-muted-foreground text-xs">({item.code})</span>
                  </p>
                </div>
                <Select
                  value={item.defaultDesignId ? String(item.defaultDesignId) : "none"}
                  onValueChange={(v) =>
                    handleSetDefault(item.id, v === "none" ? null : Number(v))
                  }
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">- Tidak ada -</SelectItem>
                    {designs.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.defaultDesignId ? (
                  <Star className="h-4 w-4 text-yellow-500" />
                ) : (
                  <StarOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Design" : "Design Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Kode *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="CLN-CUSTOM-1"
                disabled={!!editing?.isBuiltin}
              />
            </div>
            <div className="space-y-1">
              <Label>Nama *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Kategori</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Celana / Kemeja / Jas"
              />
            </div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <Select
                value={form.genderTarget}
                onValueChange={(v) =>
                  setForm({ ...form, genderTarget: v as "Pria" | "Wanita" | "Unisex" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pria">Pria</SelectItem>
                  <SelectItem value="Wanita">Wanita</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Terikat ke Item (opsional)</Label>
              <Select
                value={form.itemId || "none"}
                onValueChange={(v) => setForm({ ...form, itemId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">- Semua item -</SelectItem>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Deskripsi</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Konten SVG *</Label>
              <Input
                type="file"
                accept=".svg,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Textarea
                rows={6}
                className="font-mono text-xs"
                value={form.svgContent}
                onChange={(e) => setForm({ ...form, svgContent: e.target.value })}
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320">...</svg>'
              />
              <p className="text-xs text-muted-foreground">
                Tips: gunakan viewBox di root SVG agar proporsi sketsa presisi di kartu dan bon.
              </p>
            </div>
            {form.svgContent && (
              <div className="col-span-2">
                <Label>Preview</Label>
                <div
                  className="border rounded bg-slate-50 h-48 p-2 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:object-contain [&_svg]:overflow-visible"
                  dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(form.svgContent) }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
