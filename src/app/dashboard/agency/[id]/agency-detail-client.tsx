"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Ruler, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getItemsForMeasurement, getAgencyProjects, createMeasurementTransaction } from "./actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

type Customer = {
  id: number;
  name: string;
  phoneNumber: string | null;
  gender: string | null;
  transactionCount: number;
  sizeCount: number;
};

type Agency = {
  id: number;
  name: string;
  agencyCode: string;
  customers: Customer[];
  projects: any[];
  projectSummaries?: Array<{
    id: number;
    projectCode: string;
    name: string;
    transactionCount: number;
    totalBudget: number;
    totalPaid: number;
    remainingBudget: number;
  }>;
};

type Item = {
  id: number;
  name: string;
  customerPrice: number;
  itemSizes: Array<{ id: number; name: string; sequence: number }>;
};

type Project = {
  id: number;
  name: string;
  projectCode: string;
};

export function AgencyDetailClient({ agency }: { agency: Agency }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [measureDialog, setMeasureDialog] = useState<{ customer: Customer } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [successDialog, setSuccessDialog] = useState<{ transactionCode: string; customerId: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{
    itemId: number;
    quantity: number;
    modelDescription: string;
    additionalCharge: number;
    sizes: Record<number, string>;
  }>>([]);
  const [downPayment, setDownPayment] = useState("");

  const filteredCustomers = agency.customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phoneNumber?.includes(searchQuery)
  );

  const openMeasureDialog = async (customer: Customer) => {
    setLoading(true);
    try {
      const [itemsList, projectsList] = await Promise.all([
        getItemsForMeasurement(),
        getAgencyProjects(agency.id),
      ]);
      setItems(itemsList as any);
      setProjects(projectsList as Project[]);
      setMeasureDialog({ customer });
      setSelectedProjectId(projectsList[0]?.id || null);
      setSelectedItems([]);
      setDownPayment("");
      setSubmitError(null);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateItem = (index: number) => {
    const source = selectedItems[index];
    if (!source) return;

    const duplicated = {
      itemId: source.itemId,
      quantity: source.quantity,
      modelDescription: source.modelDescription,
      additionalCharge: source.additionalCharge,
      // Keep one value per size key (no duplicated size fields)
      sizes: Object.fromEntries(Object.entries(source.sizes)),
    };

    setSelectedItems([...selectedItems, duplicated]);
  };

  const handleAddItem = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const initialSizes: Record<number, string> = {};
    item.itemSizes.forEach((size) => {
      initialSizes[size.id] = "";
    });

    setSelectedItems([
      ...selectedItems,
      {
        itemId,
        quantity: 1,
        modelDescription: "",
        additionalCharge: 0,
        sizes: initialSizes,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemSize = (itemIndex: number, sizeId: number, value: string) => {
    const updated = [...selectedItems];
    updated[itemIndex].sizes[sizeId] = value;
    setSelectedItems(updated);
  };

  const handleUpdateItemField = (itemIndex: number, field: string, value: any) => {
    const updated = [...selectedItems];
    (updated[itemIndex] as any)[field] = value;
    setSelectedItems(updated);
  };

  const handleSubmitMeasurement = async () => {
    setSubmitError(null);

    if (!measureDialog || !selectedProjectId) {
      const message = "Pilih project terlebih dahulu";
      toast.error(message);
      setSubmitError(message);
      return;
    }

    if (selectedItems.length === 0) {
      const message = "Pilih minimal 1 item";
      toast.error(message);
      setSubmitError(message);
      return;
    }

    // Validate sizes
    for (const item of selectedItems) {
      const itemData = items.find((i) => i.id === item.itemId);
      if (!itemData) continue;

      const filledSizes = Object.values(item.sizes).filter((v) => v.trim() !== "");
      if (filledSizes.length === 0) {
        const message = `Isi minimal 1 ukuran untuk ${itemData.name}`;
        toast.error(message);
        setSubmitError(message);
        return;
      }

      const invalidValue = Object.values(item.sizes).some((v) => v.trim() !== "" && !Number.isFinite(Number(v)));
      if (invalidValue) {
        const message = `Ada nilai ukuran tidak valid untuk ${itemData.name}`;
        toast.error(message);
        setSubmitError(message);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await createMeasurementTransaction({
        customerId: measureDialog.customer.id,
        agencyId: agency.id,
        projectId: selectedProjectId,
        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          sizes: Object.fromEntries(
            Object.entries(item.sizes)
              .filter(([_, value]) => value.trim() !== "")
              .map(([sizeId, value]) => [Number(sizeId), Number(value)])
          ),
          modelDescription: item.modelDescription || undefined,
          additionalCharge: Number(item.additionalCharge || 0),
        })),
        downPayment: downPayment ? Number(downPayment) : 0,
      });

      if (result.success) {
        toast.success(`Transaksi ${result.transactionCode} berhasil dibuat`);
        setMeasureDialog(null);
        router.refresh();
        setSuccessDialog({
          transactionCode: result.transactionCode!,
          customerId: measureDialog.customer.id,
        });
      } else {
        const message = result.error || "Gagal membuat transaksi agency";
        toast.error(message);
        setSubmitError(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat transaksi";
      toast.error(message);
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextEmployee = () => {
    if (!successDialog) return;
    
    const currentIndex = filteredCustomers.findIndex((c) => c.id === successDialog.customerId);
    const nextCustomer = filteredCustomers[currentIndex + 1];

    setSuccessDialog(null);
    if (nextCustomer) {
      openMeasureDialog(nextCustomer);
    } else {
      toast.info("Tidak ada pegawai selanjutnya");
    }
  };

  const getTotalPersonalExtra = () => {
    return selectedItems.reduce((total, item) => {
      return total + Number(item.additionalCharge || 0) * item.quantity;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {agency.projectSummaries && agency.projectSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekap Anggaran Per Batch/Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-center">Transaksi</TableHead>
                  <TableHead className="text-right">Tagihan</TableHead>
                  <TableHead className="text-right">Terbayar</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.projectSummaries.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.projectCode}</div>
                    </TableCell>
                    <TableCell className="text-center">{project.transactionCount}</TableCell>
                    <TableCell className="text-right">Rp {project.totalBudget.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right text-green-600">Rp {project.totalPaid.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-medium">Rp {project.remainingBudget.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pegawai berdasarkan nama atau nomor telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="px-3 py-2">
              <Users className="h-4 w-4 mr-2" />
              {filteredCustomers.length} Pegawai
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pegawai</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "Tidak ada pegawai yang cocok" : "Belum ada pegawai"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-center">Transaksi</TableHead>
                  <TableHead className="text-center">Ukuran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phoneNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.gender || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{customer.transactionCount}</TableCell>
                    <TableCell className="text-center">{customer.sizeCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => openMeasureDialog(customer)}
                      >
                        <Ruler className="h-4 w-4 mr-2" />
                        Ukur & Transaksi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Measurement Dialog */}
      <Dialog open={!!measureDialog} onOpenChange={(v) => !v && setMeasureDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ukur & Buat Transaksi - {measureDialog?.customer.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Selection */}
            <div>
              <Label>Project *</Label>
              <Select
                value={selectedProjectId?.toString() || ""}
                onValueChange={(v) => setSelectedProjectId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} ({p.projectCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-red-600 mt-1">Belum ada project aktif untuk agency ini. Tambah project dulu di halaman agency.</p>
              )}
            </div>

            {/* Item Selection */}
            <div>
              <Label>Pilih Item Jahitan</Label>
              <Select value="" onValueChange={(v) => handleAddItem(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="+ Tambah item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} - Rp {item.customerPrice.toLocaleString("id-ID")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Items with Sizes */}
            {selectedItems.map((selectedItem, itemIndex) => {
              const item = items.find((i) => i.id === selectedItem.itemId);
              if (!item) return null;

              return (
                <Card key={itemIndex}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateItem(itemIndex)}
                      >
                        Duplikat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(itemIndex)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Jumlah</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedItem.quantity}
                          onChange={(e) => handleUpdateItemField(itemIndex, "quantity", parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Model/Desain</Label>
                        <Input
                          value={selectedItem.modelDescription}
                          onChange={(e) => handleUpdateItemField(itemIndex, "modelDescription", e.target.value)}
                          placeholder="Opsional"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Tambahan Pribadi per Item (Opsional)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={selectedItem.additionalCharge === 0 ? "" : selectedItem.additionalCharge}
                          onChange={(e) => handleUpdateItemField(itemIndex, "additionalCharge", Number(e.target.value || 0))}
                          placeholder="0"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Isi jika ada biaya tambahan di luar coverage agency.
                        </p>
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <Label className="text-xs font-semibold">Ukuran (cm) *</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {item.itemSizes.map((size) => (
                          <div key={size.id}>
                            <Label className="text-xs text-muted-foreground">{size.name}</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={selectedItem.sizes[size.id] || ""}
                              onChange={(e) => handleUpdateItemSize(itemIndex, size.id, e.target.value)}
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Payment */}
            {selectedItems.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total Tambahan Pribadi:</span>
                  <span className="text-lg font-bold">
                    Rp {getTotalPersonalExtra().toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <Label className="text-xs">DP Tambahan Pribadi (Opsional)</Label>
                  <Input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                {submitError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMeasureDialog(null)}>
              Batal
            </Button>
            <Button onClick={handleSubmitMeasurement} disabled={loading || selectedItems.length === 0}>
              {loading ? "Menyimpan..." : "Buat Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog with Next Employee */}
      <Dialog open={!!successDialog} onOpenChange={(v) => !v && setSuccessDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Transaksi Berhasil Dibuat
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg font-medium">
              {successDialog?.transactionCode}
            </p>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Transaksi berhasil dibuat dan siap diproses produksi
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSuccessDialog(null)}>
              Selesai
            </Button>
            <Button onClick={handleNextEmployee} className="flex-1">
              <ArrowRight className="h-4 w-4 mr-2" />
              Pegawai Selanjutnya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay visible={loading} />
    </div>
  );
}
