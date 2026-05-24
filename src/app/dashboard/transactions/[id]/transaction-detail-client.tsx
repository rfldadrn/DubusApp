"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InvoiceDialog } from "@/components/shared/invoice-dialog";
import { PaymentHistoryDialog } from "./payment-history-dialog";
import { Printer, History, PackageCheck, XCircle, AlertTriangle, Wallet } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { pickupItems, cancelTransaction } from "./actions";
import { toast } from "sonner";

type Transaction = any;

type TransactionDetailClientProps = {
  transaction: Transaction;
};

export function TransactionDetailClient({ transaction }: TransactionDetailClientProps) {
  const router = useRouter();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pickup state
  const [selectedPickupItems, setSelectedPickupItems] = useState<number[]>([]);
  const [pickerName, setPickerName] = useState("");
  const [pickupNotes, setPickupNotes] = useState("");

  // Cancel state
  const [cancelReason, setCancelReason] = useState("");

  // Items ready for pickup (status OK)
  const readyItems = transaction.items.filter(
    (item: any) => item.statusItem?.code === "OK"
  );
  const pickedUpItems = transaction.items.filter(
    (item: any) => item.statusItem?.code === "DIAMBIL"
  );
  const isCancelled = transaction.statusTransaction?.code === "BTL";
  const isCompleted = transaction.statusTransaction?.code === "SELESAI";

  const openPickupDialog = () => {
    setSelectedPickupItems(readyItems.map((item: any) => item.id));
    setPickerName("");
    setPickupNotes("");
    setPickupOpen(true);
  };

  const handlePickup = async () => {
    if (selectedPickupItems.length === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }
    setLoading(true);
    try {
      const result = await pickupItems({
        transactionId: transaction.id,
        itemIds: selectedPickupItems,
        pickerName: pickerName || undefined,
        notes: pickupNotes || undefined,
      });
      if (result.success) {
        toast.success(result.message);
        setPickupOpen(false);
        router.refresh();
      } else {
        toast.error(result.error!);
      }
    } catch {
      toast.error("Gagal memproses");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 3) {
      toast.error("Alasan pembatalan harus diisi (min 3 karakter)");
      return;
    }
    setLoading(true);
    try {
      const result = await cancelTransaction({
        transactionId: transaction.id,
        reason: cancelReason,
      });
      if (result.success) {
        toast.success(result.message);
        if (result.hasPaidAmount) {
          toast.warning(`Pelanggan sudah bayar Rp ${result.paidAmount?.toLocaleString("id-ID")} - perlu refund manual`);
        }
        setCancelOpen(false);
        router.refresh();
      } else {
        toast.error(result.error!);
      }
    } catch {
      toast.error("Gagal membatalkan");
    } finally {
      setLoading(false);
    }
  };

  const togglePickupItem = (id: number) => {
    setSelectedPickupItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Prepare invoice data
  const invoiceData = useMemo(() => {
    if (!transaction) return null;

    const totalSewing = transaction.items.reduce((sum: number, item: any) => sum + Number(item.sewingPrice), 0);
    const totalFabric = transaction.items.reduce((sum: number, item: any) => sum + Number(item.fabricPrice || 0), 0);
    const totalCharges = transaction.items.reduce((sum: number, item: any) => {
      const itemCharges = item.charges.reduce((s: number, c: any) => s + Number(c.amount), 0);
      return sum + itemCharges;
    }, 0);
    const grandTotal = totalSewing + totalFabric + totalCharges;
    const totalPaid = transaction.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const remaining = grandTotal - totalPaid;

    return {
      transactionCode: transaction.transactionCode,
      customerName: transaction.customer.name,
      customerPhone: transaction.customer.phoneNumber || undefined,
      transactionDate: format(new Date(transaction.transactionDate), "dd MMMM yyyy", { locale: localeId }),
      completionDate: transaction.completionDate 
        ? format(new Date(transaction.completionDate), "dd MMMM yyyy", { locale: localeId })
        : undefined,
      items: transaction.items.map((item: any) => ({
        itemName: item.item.name,
        sewingPrice: Number(item.sewingPrice),
        fabricPrice: Number(item.fabricPrice || 0),
        modelDescription: item.modelDescription || undefined,
        fabricSource: item.fabricSource,
        fabricName: item.fabric?.name || undefined,
        charges: item.charges.map((c: any) => ({
          label: c.label,
          amount: Number(c.amount),
        })),
      })),
      totalAmount: grandTotal,
      downPayment: totalPaid > 0 ? totalPaid : undefined,
      remainingAmount: remaining,
      note: transaction.note || undefined,
    };
  }, [transaction]);

  return (
    <>
      {transaction.paymentStatus !== "Paid" && !isCancelled && (
        <Link href={`/dashboard/finance/create?transactionId=${transaction.id}`}>
          <Button variant="outline">
            <Wallet className="h-4 w-4 mr-2" />
            Isi DP / Pelunasan
          </Button>
        </Link>
      )}
      <Button variant="outline" onClick={() => setPaymentHistoryOpen(true)}>
        <History className="h-4 w-4 mr-2" />
        Riwayat Pembayaran
      </Button>
      <Button onClick={() => setInvoiceOpen(true)}>
        <Printer className="h-4 w-4 mr-2" />
        Cetak Struk
      </Button>

      {/* Pickup Button */}
      {readyItems.length > 0 && !isCancelled && (
        <Button onClick={openPickupDialog} className="bg-green-600 hover:bg-green-700">
          <PackageCheck className="h-4 w-4 mr-2" />
          Ambil Pakaian ({readyItems.length})
        </Button>
      )}

      {/* Cancel Button */}
      {!isCancelled && !isCompleted && (
        <Button variant="destructive" onClick={() => setCancelOpen(true)}>
          <XCircle className="h-4 w-4 mr-2" />
          Batalkan
        </Button>
      )}

      <InvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        invoiceData={invoiceData}
      />

      <PaymentHistoryDialog
        open={paymentHistoryOpen}
        onOpenChange={setPaymentHistoryOpen}
        payments={transaction.payments}
      />

      {/* Pickup Dialog */}
      <Dialog open={pickupOpen} onOpenChange={setPickupOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-600" />
              Pengambilan Pakaian
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Pilih item yang akan diambil oleh pelanggan. Bisa ambil sebagian atau semua sekaligus.
            </p>

            {/* Select All */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <input
                type="checkbox"
                checked={selectedPickupItems.length === readyItems.length}
                onChange={(e) =>
                  setSelectedPickupItems(
                    e.target.checked ? readyItems.map((item: any) => item.id) : []
                  )
                }
                className="rounded"
              />
              <Label className="text-sm font-medium">Pilih Semua ({readyItems.length} item siap)</Label>
            </div>

            {/* Item List */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {readyItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPickupItems.includes(item.id)}
                    onChange={() => togglePickupItem(item.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.item.name}</p>
                    {item.modelDescription && (
                      <p className="text-xs text-muted-foreground">{item.modelDescription}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">Siap</Badge>
                </div>
              ))}
            </div>

            {/* Already picked up items info */}
            {pickedUpItems.length > 0 && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                {pickedUpItems.length} item sudah diambil sebelumnya
              </div>
            )}

            <div>
              <Label className="text-sm">Nama Pengambil (opsional)</Label>
              <Input
                value={pickerName}
                onChange={(e) => setPickerName(e.target.value)}
                placeholder="Nama pelanggan / perwakilan"
              />
            </div>
            <div>
              <Label className="text-sm">Catatan (opsional)</Label>
              <Textarea
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder="Catatan pengambilan..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupOpen(false)}>Batal</Button>
            <Button
              onClick={handlePickup}
              disabled={loading || selectedPickupItems.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Memproses..." : `Konfirmasi Ambil (${selectedPickupItems.length} item)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Batalkan Transaksi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin membatalkan transaksi <strong>{transaction.transactionCode}</strong>?
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <div>
              <Label className="text-sm">Alasan Pembatalan *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Pelanggan batal, tidak jadi pesan, dll..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Kembali</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading || cancelReason.trim().length < 3}
            >
              {loading ? "Memproses..." : "Ya, Batalkan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
