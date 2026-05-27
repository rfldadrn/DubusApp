"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { createTransaction } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { AddSizeDialog } from "@/components/shared/add-size-dialog";
import { InvoiceDialog } from "@/components/shared/invoice-dialog";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

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
  label: string;
  amount: number;
  note?: string;
};

type TransactionItem = {
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

export function TransactionCreateForm({ formData }: { formData: FormDataType }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetDate, setTargetDate] = useState("");
  const [statusTransactionId, setStatusTransactionId] = useState(formData.statusTransactions[0]?.id.toString() || "");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<TransactionItem[]>([
    { itemId: 0, fabricSource: "Customer", sewingPrice: 0, charges: [] },
  ]);

  // Payment states
  const [downPayment, setDownPayment] = useState("0");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Size management states
  const [availableSizes, setAvailableSizes] = useState<Record<number, Array<{ value: string; label: string }>>>({});
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [currentSizeItem, setCurrentSizeItem] = useState<{ index: number; itemId: number; itemName: string } | null>(null);
  const [itemSizes, setItemSizes] = useState<Array<{ id: number; name: string; isMandatory: boolean }>>([]);

  // Invoice dialog state
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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

    const dpAmount = Number(downPayment) || 0;
    const totalAmount = calculateGrandTotal();
    
    if (dpAmount > totalAmount) {
      toast({
        title: "Error",
        description: "Uang muka tidak boleh lebih besar dari total harga",
        variant: "destructive",
      });
      return;
    }

    // Validate payment info if DP > 0
    if (dpAmount > 0) {
      if (!paymentTypeId || !walletId) {
        toast({
          title: "Error",
          description: "Metode pembayaran dan dompet/kas harus dipilih jika ada uang muka",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const result = await createTransaction({
        customerId: Number(customerId),
        transactionDate: new Date(transactionDate),
        completionDate: targetDate ? new Date(targetDate) : undefined,
        statusTransactionId: Number(statusTransactionId),
        note,
        items: items.map((item) => ({
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
            label: charge.label,
            amount: charge.amount,
            note: charge.note || "",
          })),
        })),
        payment: dpAmount > 0 ? {
          amount: dpAmount,
          paymentTypeId: Number(paymentTypeId),
          walletId: Number(walletId),
          note: paymentNote || "Uang muka / DP",
        } : undefined,
      });

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Transaksi berhasil dibuat",
        });
        // Show invoice dialog
        setInvoiceData(result.data);
        setInvoiceDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal membuat transaksi",
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
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Jenis Item *</Label>
                <SearchableSelect
                  value={item.itemId > 0 ? item.itemId.toString() : ""}
                  onValueChange={(value) => {
                    updateItem(index, "itemId", Number(value));
                  }}
                  options={formData.items.map(itemOption => ({
                    value: itemOption.id.toString(),
                    label: `${itemOption.name} - Rp ${itemOption.customerPrice.toLocaleString("id-ID")}`
                  }))}
                  placeholder="Pilih Item"
                  searchPlaceholder="Cari item..."
                />
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
                {item.itemId > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Harga dasar: Rp {formData.items.find(i => i.id === item.itemId)?.customerPrice.toLocaleString("id-ID")}
                  </p>
                )}
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
                    <SearchableSelect
                      value={item.fabricId?.toString() || ""}
                      onValueChange={(value) => updateItem(index, "fabricId", Number(value))}
                      options={formData.fabrics.map(fabric => ({
                        value: fabric.id.toString(),
                        label: `${fabric.name} - Rp ${fabric.pricePerMeter.toLocaleString("id-ID")}/m`
                      }))}
                      placeholder="Pilih Kain"
                      searchPlaceholder="Cari kain..."
                    />
                  </div>

                  <div>
                    <Label>Harga Kain per Meter (Rp) *</Label>
                    <Input
                      type="text"
                      value={item.fabricPrice ? item.fabricPrice.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        updateItem(index, "fabricPrice", value === "" ? 0 : Number(value));
                      }}
                      placeholder="Harga bisa berbeda per pelanggan"
                      required
                    />
                    {item.fabricId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Harga master: Rp {formData.fabrics.find(f => f.id === item.fabricId)?.pricePerMeter.toLocaleString("id-ID")}/m
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Jumlah Meter Kain *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.fabricMeters || ""}
                      onChange={(e) => updateItem(index, "fabricMeters", Number(e.target.value))}
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <Label>Total Biaya Kain</Label>
                    <Input
                      type="text"
                      value={`Rp ${((item.fabricPrice || 0) * (item.fabricMeters || 0)).toLocaleString("id-ID")}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </>
              )}

              {item.itemId > 0 && customerId && (
                <div>
                  <Label>Ukuran Pelanggan</Label>
                  <div className="flex gap-2">
                    <SearchableSelect
                      value={item.headerSizeCustomerId?.toString() || ""}
                      onValueChange={(value) => updateItem(index, "headerSizeCustomerId", Number(value))}
                      options={availableSizes[item.itemId] || []}
                      placeholder="Pilih Ukuran (Opsional)"
                      searchPlaceholder="Cari ukuran..."
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSizeDialog(index)}
                      disabled={!customerId || !item.itemId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <Label>Deskripsi Model</Label>
                <Textarea
                  value={item.modelDescription || ""}
                  onChange={(e) => updateItem(index, "modelDescription", e.target.value)}
                  placeholder="Deskripsi model jahitan (opsional)"
                  rows={2}
                />
              </div>

              {/* Biaya Tambahan Section */}
              <div className="md:col-span-2 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Biaya Tambahan (Bordir, Lambang, dll)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addCharge(index)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Biaya
                  </Button>
                </div>

                {item.charges.length > 0 && (
                  <div className="space-y-3">
                    {item.charges.map((charge, chargeIndex) => (
                      <div key={chargeIndex} className="grid grid-cols-12 gap-2 items-start bg-muted/50 p-3 rounded">
                        <div className="col-span-4">
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
                        <div className="col-span-4">
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
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold">Informasi Pembayaran (Opsional)</h4>
        <p className="text-sm text-muted-foreground">
          Jika pelanggan membayar uang muka / DP, isi detail pembayaran di bawah
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="downPayment">Jumlah Uang Muka / DP (Rp)</Label>
            <Input
              type="text"
              id="downPayment"
              value={Number(downPayment) === 0 ? "" : Number(downPayment).toLocaleString("id-ID")}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setDownPayment(value === "" ? "0" : value);
              }}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kosongkan jika belum ada pembayaran
            </p>
          </div>

          {Number(downPayment) > 0 && (
            <>
              <div>
                <Label htmlFor="paymentTypeId">Metode Pembayaran *</Label>
                <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Metode" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.paymentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="walletId">Dompet / Kas *</Label>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Dompet/Kas" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>
                        {wallet.name} ({wallet.walletType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih &quot;Kas Tunai&quot; untuk pembayaran tunai
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="paymentNote">Catatan Pembayaran</Label>
                <Textarea
                  id="paymentNote"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan untuk pembayaran ini (opsional)"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <h4 className="font-semibold mb-3">Ringkasan Transaksi</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Jumlah Item:</span>
            <span className="font-medium">{items.length} item</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Harga:</span>
            <span className="font-medium">
              Rp {calculateGrandTotal().toLocaleString("id-ID")}
            </span>
          </div>
          {Number(downPayment) > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uang Muka / DP:</span>
                <span className="font-medium text-green-600">
                  Rp {Number(downPayment).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Sisa Pembayaran:</span>
                <span className="font-bold text-lg">
                  Rp {(calculateGrandTotal() - Number(downPayment)).toLocaleString("id-ID")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRedirecting(true);
            router.replace("/dashboard/transactions");
          }}
          disabled={loading || redirecting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading || redirecting}>
          {loading ? "Menyimpan..." : "Simpan Transaksi"}
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

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={(open) => {
          setInvoiceDialogOpen(open);
          if (!open) {
            setRedirecting(true);
            router.replace("/dashboard/transactions");
            router.refresh();
          }
        }}
        invoiceData={invoiceData}
      />

      <LoadingOverlay
        visible={loading || redirecting}
        message={redirecting ? "Mengarahkan ke daftar transaksi..." : "Menyimpan transaksi..."}
      />
    </>
  );
}
