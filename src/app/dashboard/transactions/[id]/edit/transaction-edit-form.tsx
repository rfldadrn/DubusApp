"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { updateTransaction } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { AddSizeDialog } from "@/components/shared/add-size-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import Link from "next/link";

type FormDataType = {
  customers: Array<{ id: number; name: string; phoneNumber: string | null }>;
  items: Array<{ id: number; name: string; customerPrice: number }>;
  fabrics: Array<{ id: number; name: string; pricePerMeter: number }>;
  statusTransactions: Array<{ id: number; name: string }>;
  statusItems: Array<{ id: number; name: string; sequence: number }>;
  paymentTypes: Array<{ id: number; name: string }>;
  wallets: Array<{ id: number; name: string; walletType: string }>;
};

type ItemCharge = {
  id?: number;
  label: string;
  amount: number;
  note?: string;
};

type TransactionItem = {
  id?: number;
  itemId: number;
  fabricSource: string;
  fabricId?: number;
  fabricPrice?: number;
  fabricMeters?: number;
  sewingPrice: number;
  modelDescription?: string;
  headerSizeCustomerId?: number;
  charges: ItemCharge[];
};

type TransactionData = {
  id: number;
  transactionCode: string;
  customerId: number;
  transactionDate: Date;
  completionDate: Date | null;
  statusTransactionId: number;
  note: string | null;
  items: Array<{
    id: number;
    itemId: number;
    item: { id: number; name: string };
    fabricSource: string;
    fabricId: number | null;
    fabric: { id: number; name: string } | null;
    fabricPrice: number | null;
    fabricMeters: number | null;
    sewingPrice: number;
    modelDescription: string | null;
    headerSizeCustomerId: number | null;
    headerSizeCustomer: { id: number; note: string | null } | null;
    charges: Array<{
      id: number;
      label: string;
      amount: number;
      note: string | null;
    }>;
  }>;
};

export function TransactionEditForm({ 
  formData, 
  transaction 
}: { 
  formData: FormDataType; 
  transaction: TransactionData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState(transaction.customerId.toString());
  const [transactionDate, setTransactionDate] = useState(
    new Date(transaction.transactionDate).toISOString().split("T")[0]
  );
  const [targetDate, setTargetDate] = useState(
    transaction.completionDate 
      ? new Date(transaction.completionDate).toISOString().split("T")[0] 
      : ""
  );
  const [statusTransactionId, setStatusTransactionId] = useState(
    transaction.statusTransactionId.toString()
  );
  const [note, setNote] = useState(transaction.note || "");
  const [items, setItems] = useState<TransactionItem[]>(
    transaction.items.map(item => ({
      id: item.id,
      itemId: item.itemId,
      fabricSource: item.fabricSource,
      fabricId: item.fabricId || undefined,
      fabricPrice: item.fabricPrice || undefined,
      fabricMeters: item.fabricMeters || undefined,
      sewingPrice: item.sewingPrice,
      modelDescription: item.modelDescription || undefined,
      headerSizeCustomerId: item.headerSizeCustomerId || undefined,
      charges: item.charges.map(charge => ({
        id: charge.id,
        label: charge.label,
        amount: charge.amount,
        note: charge.note || undefined,
      })),
    }))
  );

  // Size management states
  const [availableSizes, setAvailableSizes] = useState<Record<number, Array<{ value: string; label: string }>>>({});
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [currentSizeItem, setCurrentSizeItem] = useState<{ index: number; itemId: number; itemName: string } | null>(null);
  const [itemSizes, setItemSizes] = useState<Array<{ id: number; name: string; isMandatory: boolean }>>([]);

  const addItem = () => {
    setItems([...items, { itemId: 0, fabricSource: "Customer", sewingPrice: 0, charges: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof TransactionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate sewing price when item is selected
    if (field === "itemId") {
      const selectedItem = formData.items.find((item) => item.id === Number(value));
      if (selectedItem) {
        newItems[index].sewingPrice = Number(selectedItem.customerPrice);
      }
      // Reset size selection when item changes
      newItems[index].headerSizeCustomerId = undefined;
      // Fetch available sizes for this item and customer
      if (customerId && Number(value) > 0) {
        fetchAvailableSizes(Number(customerId), Number(value));
      }
    }

    // Auto-fill fabric price when fabric is selected
    if (field === "fabricId") {
      const selectedFabric = formData.fabrics.find((fabric) => fabric.id === Number(value));
      if (selectedFabric) {
        newItems[index].fabricPrice = Number(selectedFabric.pricePerMeter);
      }
    }

    setItems(newItems);
  };

  const addCharge = (itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].charges.push({ label: "", amount: 0, note: "" });
    setItems(newItems);
  };

  const removeCharge = (itemIndex: number, chargeIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].charges = newItems[itemIndex].charges.filter((_, i) => i !== chargeIndex);
    setItems(newItems);
  };

  const updateCharge = (itemIndex: number, chargeIndex: number, field: keyof ItemCharge, value: any) => {
    const newItems = [...items];
    newItems[itemIndex].charges[chargeIndex] = {
      ...newItems[itemIndex].charges[chargeIndex],
      [field]: value,
    };
    setItems(newItems);
  };

  const calculateItemTotal = (item: TransactionItem) => {
    const fabricCost = (item.fabricPrice || 0) * (item.fabricMeters || 0);
    const chargesTotal = item.charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return item.sewingPrice + fabricCost + chargesTotal;
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const fetchAvailableSizes = async (custId: number, itmId: number) => {
    try {
      const response = await fetch(`/api/sizes/list?customerId=${custId}&itemId=${itmId}`);
      const result = await response.json();
      if (result.success) {
        setAvailableSizes((prev) => ({ ...prev, [itmId]: result.data }));
      }
    } catch (error) {
      console.error("Failed to fetch sizes:", error);
    }
  };

  const handleOpenSizeDialog = async (index: number) => {
    const item = items[index];
    if (!customerId || !item.itemId) {
      toast({
        title: "Error",
        description: "Pilih pelanggan dan item terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const selectedItem = formData.items.find((i) => i.id === item.itemId);
    if (!selectedItem) return;

    // Fetch item sizes
    try {
      const response = await fetch(`/api/items/sizes?itemId=${item.itemId}`);
      const result = await response.json();
      if (result.success) {
        setItemSizes(result.data);
        setCurrentSizeItem({ index, itemId: item.itemId, itemName: selectedItem.name });
        setSizeDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data ukuran",
        variant: "destructive",
      });
    }
  };

  const handleSizeAdded = () => {
    if (currentSizeItem && customerId) {
      fetchAvailableSizes(Number(customerId), currentSizeItem.itemId);
    }
  };

  // Fetch sizes when customer changes
  useEffect(() => {
    if (customerId) {
      items.forEach((item) => {
        if (item.itemId > 0) {
          fetchAvailableSizes(Number(customerId), item.itemId);
        }
      });
    }
  }, [customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerId) {
      toast({
        title: "Error",
        description: "Pelanggan wajib dipilih",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => !item.itemId || item.sewingPrice <= 0)) {
      toast({
        title: "Error",
        description: "Semua item harus memiliki jenis dan harga jahit yang valid",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => item.fabricSource === "Store" && !item.fabricId)) {
      toast({
        title: "Error",
        description: "Jenis kain harus dipilih untuk sumber kain dari toko",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => item.fabricSource === "Store" && (!item.fabricPrice || !item.fabricMeters))) {
      toast({
        title: "Error",
        description: "Harga dan jumlah meter kain harus diisi untuk sumber kain dari toko",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => item.charges.some((charge) => !charge.label || charge.amount <= 0))) {
      toast({
        title: "Error",
        description: "Semua biaya tambahan harus memiliki label dan jumlah yang valid",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await updateTransaction({
        id: transaction.id,
        customerId: Number(customerId),
        transactionDate: new Date(transactionDate),
        completionDate: targetDate ? new Date(targetDate) : undefined,
        statusTransactionId: Number(statusTransactionId),
        note,
        items: items.map((item) => ({
          id: item.id,
          itemId: item.itemId,
          fabricSource: item.fabricSource as "Customer" | "Store",
          fabricId: item.fabricId,
          fabricPrice: item.fabricPrice,
          fabricMeters: item.fabricMeters,
          sewingPrice: item.sewingPrice,
          modelDescription: item.modelDescription,
          statusItemId: formData.statusItems[0]?.id || 1,
          headerSizeCustomerId: item.headerSizeCustomerId,
          charges: item.charges.map((charge) => ({
            id: charge.id,
            label: charge.label,
            amount: charge.amount,
            note: charge.note || "",
          })),
        })),
      });

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Transaksi berhasil diupdate",
        });
        router.push("/dashboard/transactions");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal mengupdate transaksi",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan transaksi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button type="button" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            Kode Transaksi: <strong>{transaction.transactionCode}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerId">Pelanggan *</Label>
            <SearchableSelect
              value={customerId}
              onValueChange={setCustomerId}
              options={formData.customers.map(c => ({ 
                value: c.id.toString(), 
                label: `${c.name}${c.phoneNumber ? ` - ${c.phoneNumber}` : ''}` 
              }))}
              placeholder="Pilih Pelanggan"
              searchPlaceholder="Cari pelanggan..."
            />
          </div>

          <div>
            <Label htmlFor="transactionDate">Tanggal Transaksi *</Label>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="targetDate">Tanggal Selesai</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={transactionDate}
            />
          </div>

          <div>
            <Label htmlFor="statusTransactionId">Status Transaksi *</Label>
            <Select value={statusTransactionId} onValueChange={setStatusTransactionId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                {formData.statusTransactions.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="note">Catatan</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan tambahan (opsional)"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Item Jahitan *</Label>
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item #{index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeItem(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Item
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Jenis Item *</Label>
                  <Select
                    value={item.itemId.toString()}
                    onValueChange={(value) => updateItem(index, "itemId", Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.items.map((i) => (
                        <SelectItem key={i.id} value={i.id.toString()}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Harga Jahit (Rp) *</Label>
                  <Input
                    type="text"
                    value={item.sewingPrice === 0 ? "" : item.sewingPrice.toLocaleString("id-ID")}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      updateItem(index, "sewingPrice", value === "" ? 0 : Number(value));
                    }}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label>Sumber Kain *</Label>
                  <Select
                    value={item.fabricSource}
                    onValueChange={(value) => updateItem(index, "fabricSource", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer">Kain Pelanggan</SelectItem>
                      <SelectItem value="Store">Kain Toko</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {item.fabricSource === "Store" && (
                  <>
                    <div>
                      <Label>Jenis Kain *</Label>
                      <Select
                        value={item.fabricId?.toString() || ""}
                        onValueChange={(value) => updateItem(index, "fabricId", Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kain" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.fabrics.map((fabric) => (
                            <SelectItem key={fabric.id} value={fabric.id.toString()}>
                              {fabric.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Harga Kain per Meter (Rp) *</Label>
                      <Input
                        type="text"
                        value={item.fabricPrice === 0 || !item.fabricPrice ? "" : item.fabricPrice.toLocaleString("id-ID")}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          updateItem(index, "fabricPrice", value === "" ? 0 : Number(value));
                        }}
                        placeholder="0"
                        required={item.fabricSource === "Store"}
                      />
                    </div>

                    <div>
                      <Label>Jumlah Meter *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.fabricMeters || ""}
                        onChange={(e) => updateItem(index, "fabricMeters", Number(e.target.value))}
                        placeholder="0"
                        required={item.fabricSource === "Store"}
                      />
                    </div>

                    {item.fabricPrice && item.fabricMeters && (
                      <div className="md:col-span-2 text-sm bg-muted p-2 rounded">
                        <strong>Total Biaya Kain:</strong> Rp{" "}
                        {((item.fabricPrice || 0) * (item.fabricMeters || 0)).toLocaleString("id-ID")}
                      </div>
                    )}
                  </>
                )}

                <div className="md:col-span-2">
                  <Label>Deskripsi Model</Label>
                  <Textarea
                    value={item.modelDescription || ""}
                    onChange={(e) => updateItem(index, "modelDescription", e.target.value)}
                    placeholder="Deskripsi detail model jahitan (opsional)"
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Ukuran Pelanggan</Label>
                    <div className="flex gap-2">
                      {customerId && item.itemId > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSizeDialog(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Ukuran Baru
                        </Button>
                      )}
                    </div>
                  </div>
                  {availableSizes[item.itemId]?.length > 0 ? (
                    <SearchableSelect
                      value={item.headerSizeCustomerId?.toString() || ""}
                      onValueChange={(value) => updateItem(index, "headerSizeCustomerId", Number(value))}
                      options={availableSizes[item.itemId] || []}
                      placeholder="Pilih ukuran..."
                      searchPlaceholder="Cari ukuran..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {customerId && item.itemId > 0
                        ? "Belum ada data ukuran untuk item ini. Klik tombol di atas untuk menambahkan."
                        : "Pilih pelanggan dan item terlebih dahulu"}
                    </p>
                  )}
                </div>
              </div>

              {/* Biaya Tambahan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Biaya Tambahan (Bordir, Lambang, dll)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCharge(index)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Biaya
                  </Button>
                </div>

                {item.charges.length > 0 && (
                  <div className="space-y-2">
                    {item.charges.map((charge, chargeIndex) => (
                      <div key={chargeIndex} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Input
                            type="text"
                            value={charge.label}
                            onChange={(e) => updateCharge(index, chargeIndex, "label", e.target.value)}
                            placeholder="Label (mis: Bordir nama)"
                            required
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="text"
                            value={charge.amount === 0 ? "" : charge.amount.toString()}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, "");
                              updateCharge(index, chargeIndex, "amount", value === "" ? 0 : Number(value));
                            }}
                            placeholder="Harga"
                            required
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            type="text"
                            value={charge.note || ""}
                            onChange={(e) => updateCharge(index, chargeIndex, "note", e.target.value)}
                            placeholder="Catatan (opsional)"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCharge(index, chargeIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-sm font-medium text-right">
                      Total Biaya Tambahan: Rp {item.charges.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Total */}
              <div className="md:col-span-2 border-t pt-3 bg-muted/30 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Item #{index + 1}:</span>
                  <span className="text-lg font-bold">
                    Rp {calculateItemTotal(item).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  <div className="flex justify-between">
                    <span>Jahit:</span>
                    <span>Rp {item.sewingPrice.toLocaleString("id-ID")}</span>
                  </div>
                  {item.fabricSource === "Store" && item.fabricPrice && item.fabricMeters && (
                    <div className="flex justify-between">
                      <span>Kain:</span>
                      <span>Rp {((item.fabricPrice || 0) * (item.fabricMeters || 0)).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {item.charges.length > 0 && (
                    <div className="flex justify-between">
                      <span>Tambahan:</span>
                      <span>Rp {item.charges.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Section */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-semibold mb-3">Ringkasan Transaksi</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Jumlah Item:</span>
              <span className="font-medium">{items.length} item</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Harga:</span>
              <span>Rp {calculateGrandTotal().toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard/transactions">
            <Button type="button" variant="outline" disabled={loading}>
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>

      {/* Add Size Dialog */}
      {currentSizeItem && (
        <AddSizeDialog
          open={sizeDialogOpen}
          onOpenChange={setSizeDialogOpen}
          customerId={Number(customerId)}
          itemId={currentSizeItem.itemId}
          itemName={currentSizeItem.itemName}
          itemSizes={itemSizes}
          onSuccess={handleSizeAdded}
        />
      )}

      <LoadingOverlay visible={loading} message="Menyimpan perubahan..." />
    </>
  );
}
