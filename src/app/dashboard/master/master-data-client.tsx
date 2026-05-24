"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shirt, Tag, Banknote, Users2, Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { toast } from "sonner";
import { updateMasterData, deleteMasterData, getItemSizes, createItemSize, updateItemSize, deleteItemSize } from "./create/actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import Link from "next/link";

type MasterDataType = "item" | "statusItem" | "paymentType" | "employeeType";

interface MasterDataClientProps {
  items: any[];
  statusItems: any[];
  statusTransactions: any[];
  paymentTypes: any[];
  employeeTypes: any[];
}

export function MasterDataClient({ items, statusItems, statusTransactions, paymentTypes, employeeTypes }: MasterDataClientProps) {
  const [loading, setLoading] = useState(false);
  const [editDialog, setEditDialog] = useState<{ type: MasterDataType; data: any } | null>(null);
  const [sizeDialog, setSizeDialog] = useState<{ itemId: number; itemName: string } | null>(null);
  const [sizes, setSizes] = useState<any[]>([]);
  const [sizeForm, setSizeForm] = useState({ name: "", isMandatory: false, sortOrder: 0 });
  const [editingSizeId, setEditingSizeId] = useState<number | null>(null);

  // Edit form states
  const [editForm, setEditForm] = useState<any>({});

  const openEdit = (type: MasterDataType, data: any) => {
    setEditForm({ ...data, customerPrice: data.customerPrice ? Number(data.customerPrice) : "", employeePrice: data.employeePrice ? Number(data.employeePrice) : "" });
    setEditDialog({ type, data });
  };

  const handleUpdate = async () => {
    if (!editDialog) return;
    setLoading(true);
    try {
      const payload = { ...editForm };
      if (editDialog.type === "item") {
        payload.customerPrice = parseFloat(payload.customerPrice);
        payload.employeePrice = parseFloat(payload.employeePrice);
      }
      if (editDialog.type === "statusItem") {
        payload.sequence = parseInt(payload.sequence);
      }
      const result = await updateMasterData(editDialog.type, editDialog.data.id, payload);
      if (result.success) {
        toast.success("Data berhasil diupdate");
        setEditDialog(null);
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal mengupdate");
      }
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (type: MasterDataType, id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus "${name}"?`)) return;
    setLoading(true);
    try {
      const result = await deleteMasterData(type, id);
      if (result.success) {
        toast.success("Data berhasil dihapus");
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal menghapus");
      }
    } catch { toast.error("Terjadi kesalahan"); }
    finally { setLoading(false); }
  };

  // Item Sizes management
  const openSizeDialog = async (itemId: number, itemName: string) => {
    setSizeDialog({ itemId, itemName });
    const s = await getItemSizes(itemId);
    setSizes(s);
    setSizeForm({ name: "", isMandatory: false, sortOrder: s.length + 1 });
    setEditingSizeId(null);
  };

  const handleAddSize = async () => {
    if (!sizeDialog || !sizeForm.name.trim()) return;
    setLoading(true);
    try {
      const result = await createItemSize({ itemId: sizeDialog.itemId, ...sizeForm });
      if (result.success) {
        toast.success("Ukuran ditambahkan");
        const s = await getItemSizes(sizeDialog.itemId);
        setSizes(s);
        setSizeForm({ name: "", isMandatory: false, sortOrder: s.length + 1 });
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleUpdateSize = async () => {
    if (!editingSizeId) return;
    setLoading(true);
    try {
      const result = await updateItemSize(editingSizeId, sizeForm);
      if (result.success) {
        toast.success("Ukuran diupdate");
        const s = await getItemSizes(sizeDialog!.itemId);
        setSizes(s);
        setEditingSizeId(null);
        setSizeForm({ name: "", isMandatory: false, sortOrder: s.length + 1 });
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleDeleteSize = async (id: number) => {
    if (!confirm("Hapus ukuran ini?")) return;
    setLoading(true);
    try {
      const result = await deleteItemSize(id);
      if (result.success) {
        toast.success("Ukuran dihapus");
        const s = await getItemSizes(sizeDialog!.itemId);
        setSizes(s);
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Shirt className="h-5 w-5" />Item Jahitan</CardTitle>
              <CardDescription>{items.length} item tersedia</CardDescription>
            </div>
            <Link href="/dashboard/master/create?tab=items"><Button size="sm"><Plus className="h-4 w-4 mr-2" />Item Baru</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga Customer</TableHead>
                  <TableHead className="text-right">Harga Employee</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                    <TableCell className="text-right">Rp {Number(item.customerPrice).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">Rp {Number(item.employeePrice).toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openSizeDialog(item.id, item.name)} title="Kelola Ukuran">
                          <Ruler className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit("item", item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("item", item.id, item.name)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status Items & Status Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Status Item</CardTitle>
                <CardDescription>{statusItems.length} status workflow</CardDescription>
              </div>
              <Link href="/dashboard/master/create?tab=statusItems"><Button size="sm"><Plus className="h-4 w-4" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusItems.map((status) => (
                <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="w-3 h-3 rounded-full p-0" style={{ backgroundColor: status.colorSlug || "#gray" }} />
                    <span className="font-medium">{status.name}</span>
                    <span className="text-xs text-muted-foreground">({status.code})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground mr-2">Seq: {status.sequence}</span>
                    <Button variant="ghost" size="sm" onClick={() => openEdit("statusItem", status)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete("statusItem", status.id, status.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" />Status Transaksi</CardTitle>
            <CardDescription>{statusTransactions.length} status transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statusTransactions.map((status) => (
                <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="w-3 h-3 rounded-full p-0" style={{ backgroundColor: status.colorSlug || "#gray" }} />
                    <span className="font-medium">{status.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Seq: {status.sequence}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Types & Employee Types */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" />Metode Pembayaran</CardTitle>
                <CardDescription>{paymentTypes.length} metode tersedia</CardDescription>
              </div>
              <Link href="/dashboard/master/create?tab=paymentTypes"><Button size="sm"><Plus className="h-4 w-4" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.name}</span>
                    <Badge variant="outline">{type.code}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit("paymentType", type)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete("paymentType", type.id, type.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Users2 className="h-5 w-5" />Tipe Karyawan</CardTitle>
                <CardDescription>{employeeTypes.length} tipe karyawan</CardDescription>
              </div>
              <Link href="/dashboard/master/create?tab=employeeTypes"><Button size="sm"><Plus className="h-4 w-4" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employeeTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{type.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit("employeeType", type)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete("employeeType", type.id, type.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(v) => !v && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editDialog?.type === "item" ? "Item" : editDialog?.type === "statusItem" ? "Status Item" : editDialog?.type === "paymentType" ? "Metode Pembayaran" : "Tipe Karyawan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editDialog?.type === "item" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Kode</Label><Input value={editForm.code || ""} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></div>
                <div><Label>Nama</Label><Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><Label>Kategori</Label><Input value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></div>
                <div><Label>Target Gender</Label>
                  <Select value={editForm.genderTarget || "Unisex"} onValueChange={(v) => setEditForm({ ...editForm, genderTarget: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pria">Pria</SelectItem>
                      <SelectItem value="Wanita">Wanita</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Harga Customer</Label><Input type="number" value={editForm.customerPrice || ""} onChange={(e) => setEditForm({ ...editForm, customerPrice: e.target.value })} /></div>
                <div><Label>Harga Employee</Label><Input type="number" value={editForm.employeePrice || ""} onChange={(e) => setEditForm({ ...editForm, employeePrice: e.target.value })} /></div>
              </div>
            )}
            {editDialog?.type === "statusItem" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Kode</Label><Input value={editForm.code || ""} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></div>
                <div><Label>Nama</Label><Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><Label>Urutan</Label><Input type="number" value={editForm.sequence || ""} onChange={(e) => setEditForm({ ...editForm, sequence: e.target.value })} /></div>
                <div><Label>Warna</Label><Input type="color" value={editForm.colorSlug || "#3b82f6"} onChange={(e) => setEditForm({ ...editForm, colorSlug: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Deskripsi</Label><Input value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              </div>
            )}
            {editDialog?.type === "paymentType" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Kode</Label><Input value={editForm.code || ""} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></div>
                <div><Label>Nama</Label><Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              </div>
            )}
            {editDialog?.type === "employeeType" && (
              <div className="space-y-4">
                <div><Label>Nama</Label><Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><Label>Deskripsi</Label><Input value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Batal</Button>
            <Button onClick={handleUpdate} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Size Dialog */}
      <Dialog open={!!sizeDialog} onOpenChange={(v) => !v && setSizeDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kelola Ukuran - {sizeDialog?.itemName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing sizes */}
            {sizes.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sizes.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      {s.isMandatory && <Badge variant="secondary" className="text-xs">Wajib</Badge>}
                      <span className="text-xs text-muted-foreground">#{s.sortOrder}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingSizeId(s.id); setSizeForm({ name: s.name, isMandatory: s.isMandatory, sortOrder: s.sortOrder }); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!s.isStandard && (
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteSize(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit size form */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">{editingSizeId ? "Edit Ukuran" : "Tambah Ukuran Baru"}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input placeholder="Nama ukuran (misal: Panjang Badan)" value={sizeForm.name} onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })} />
                </div>
                <div>
                  <Input type="number" placeholder="Urutan" value={sizeForm.sortOrder} onChange={(e) => setSizeForm({ ...sizeForm, sortOrder: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sizeForm.isMandatory} onChange={(e) => setSizeForm({ ...sizeForm, isMandatory: e.target.checked })} />
                Wajib diisi
              </label>
              <div className="flex gap-2">
                {editingSizeId ? (
                  <>
                    <Button size="sm" onClick={handleUpdateSize} disabled={loading}>Update</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingSizeId(null); setSizeForm({ name: "", isMandatory: false, sortOrder: sizes.length + 1 }); }}>Batal</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleAddSize} disabled={loading || !sizeForm.name.trim()}>Tambah</Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay visible={loading} />
    </div>
  );
}
