"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Send } from "lucide-react";
import { generateInvoicePDF, generateWhatsAppMessage, downloadPDF, sendWhatsApp } from "@/lib/invoice";

type ItemCharge = {
  label: string;
  amount: number;
};

type TransactionItem = {
  itemName: string;
  sewingPrice: number;
  fabricPrice?: number;
  modelDescription?: string;
  fabricSource: string;
  fabricName?: string;
  charges?: ItemCharge[];
};

type InvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: {
    transactionCode: string;
    customerName: string;
    customerPhone?: string;
    transactionDate: string;
    completionDate?: string;
    items: TransactionItem[];
    totalAmount: number;
    downPayment?: number;
    remainingAmount: number;
    note?: string;
  } | null;
};

export function InvoiceDialog({ open, onOpenChange, invoiceData }: InvoiceDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!invoiceData) return null;

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = generateInvoicePDF(invoiceData);
      downloadPDF(doc, `Nota-${invoiceData.transactionCode}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!invoiceData.customerPhone) {
      alert("Nomor telepon pelanggan tidak tersedia");
      return;
    }
    const message = generateWhatsAppMessage(invoiceData);
    sendWhatsApp(invoiceData.customerPhone, message);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Transaksi Berhasil!</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Receipt-style preview */}
          <div className="border rounded-lg p-4 bg-muted/20 font-mono text-xs space-y-2">
            <div className="text-center font-bold text-sm">NOTA JAHITAN</div>
            <div className="text-center text-[10px] text-muted-foreground">{invoiceData.transactionCode}</div>
            <div className="border-t border-dashed my-2" />
            
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-semibold">{invoiceData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{invoiceData.transactionDate}</span>
            </div>

            <div className="border-t border-dashed my-2" />
            
            {invoiceData.items.map((item, i) => (
              <div key={i} className="space-y-0.5">
                <div className="font-semibold">{i + 1}. {item.itemName}</div>
                <div className="flex justify-between pl-3">
                  <span>Jahit</span>
                  <span>Rp {item.sewingPrice.toLocaleString("id-ID")}</span>
                </div>
                {item.fabricPrice && item.fabricPrice > 0 && (
                  <div className="flex justify-between pl-3">
                    <span>Kain</span>
                    <span>Rp {item.fabricPrice.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {item.charges?.map((c, ci) => (
                  <div key={ci} className="flex justify-between pl-3">
                    <span>+ {c.label}</span>
                    <span>Rp {c.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className="border-t border-dashed my-2" />
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL</span>
              <span>Rp {invoiceData.totalAmount.toLocaleString("id-ID")}</span>
            </div>
            {invoiceData.downPayment && invoiceData.downPayment > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Dibayar</span>
                  <span>Rp {invoiceData.downPayment.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>SISA</span>
                  <span>Rp {invoiceData.remainingAmount.toLocaleString("id-ID")}</span>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Unduh nota PDF atau kirim via WhatsApp
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Mengunduh..." : "Unduh PDF"}
          </Button>
          {invoiceData.customerPhone && (
            <Button onClick={handleSendWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex-1">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}