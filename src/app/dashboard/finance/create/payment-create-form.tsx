"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { createPayment } from "./actions";
import { useToast } from "@/components/ui/use-toast";
import { LoadingOverlay } from "@/components/shared/loading-overlay";

export function PaymentCreateForm({ formData }: { formData: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [withoutTransaction, setWithoutTransaction] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState(formData.paymentTypes[0]?.id.toString() || "");
  const [walletId, setWalletId] = useState(formData.wallets[0]?.id.toString() || "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (withoutTransaction) return;

    const txId = searchParams.get("transactionId");
    if (!txId) return;

    const exists = formData.transactions.some((t: any) => t.id === Number(txId));
    if (exists) {
      setTransactionId(txId);
    }
  }, [formData.transactions, searchParams, withoutTransaction]);

  useEffect(() => {
    if (withoutTransaction) {
      setAmount("");
      return;
    }

    if (transactionId) {
      const transaction = formData.transactions.find((t: any) => t.id === Number(transactionId));
      if (transaction) {
        // Calculate remaining amount
        const paid = transaction.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        const remaining = Number(transaction.totalAmount) - paid;
        setAmount(remaining.toString());
      }
    }
  }, [transactionId, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast({ title: "Error", description: "Jumlah wajib diisi", variant: "destructive" });
      return;
    }

    if (!withoutTransaction && !transactionId) {
      toast({ title: "Error", description: "Pilih transaksi atau centang pemasukan non-transaksi", variant: "destructive" });
      return;
    }

    if (withoutTransaction && !note.trim()) {
      toast({ title: "Error", description: "Catatan wajib diisi untuk pemasukan non-transaksi", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await createPayment({
        transactionId: withoutTransaction ? undefined : Number(transactionId),
        amount: Number(amount),
        paymentTypeId: Number(paymentTypeId),
        walletId: Number(walletId),
        note,
        entryDate: new Date().toISOString(),
      });

      if (result.success) {
        toast({
          title: "Berhasil",
          description: withoutTransaction ? "Pemasukan non-transaksi berhasil dicatat" : "Pembayaran berhasil dicatat",
        });
        router.push("/dashboard/finance");
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Gagal menyimpan pembayaran", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withoutTransaction}
              onChange={(e) => {
                const checked = e.target.checked;
                setWithoutTransaction(checked);
                if (checked) {
                  setTransactionId("");
                  setAmount("");
                }
              }}
            />
            Pemasukan tanpa transaksi
          </label>
        </div>

        {!withoutTransaction && (
          <div className="md:col-span-2">
            <Label>Transaksi *</Label>
            <SearchableSelect
              value={transactionId}
              onValueChange={setTransactionId}
              options={formData.transactions.map((t: any) => {
                const paid = t.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                const remaining = Math.max(0, Number(t.totalAmount) - paid);
                return {
                  value: t.id.toString(),
                  label: `${t.transactionCode} - ${t.customer.name} (Sisa Rp ${remaining.toLocaleString("id-ID")})`,
                };
              })}
              placeholder="Pilih Transaksi"
              searchPlaceholder="Cari transaksi..."
            />
          </div>
        )}

        <div>
          <Label>Jumlah Bayar (Rp) *</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" />
        </div>

        <div>
          <Label>Metode Pembayaran *</Label>
          <Select value={paymentTypeId} onValueChange={setPaymentTypeId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formData.paymentTypes.map((pt: any) => (
                <SelectItem key={pt.id} value={pt.id.toString()}>
                  {pt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Kas/Rekening *</Label>
          <Select value={walletId} onValueChange={setWalletId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formData.wallets.map((w: any) => (
                <SelectItem key={w.id} value={w.id.toString()}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={withoutTransaction ? "md:col-span-2" : ""}>
          <Label>Catatan</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={withoutTransaction ? "Wajib diisi untuk pemasukan non-transaksi" : "Catatan (opsional)"}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/finance")} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pembayaran"}
        </Button>
      </div>

      <LoadingOverlay visible={loading} message="Menyimpan pembayaran..." />
    </form>
  );
}
