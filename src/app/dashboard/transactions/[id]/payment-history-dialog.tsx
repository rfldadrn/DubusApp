"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

type Payment = {
  id: number;
  amount: number;
  note?: string | null;
  paidAt?: Date | string;
  createdAt?: Date | string;
  paymentType: {
    name: string;
  };
  wallet?: {
    name: string;
    walletType: string;
  } | null;
};

type PaymentHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: Payment[];
};

export function PaymentHistoryDialog({ open, onOpenChange, payments }: PaymentHistoryDialogProps) {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Pembayaran</DialogTitle>
        </DialogHeader>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada pembayaran
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Wallet/Akun</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paidAt ? format(new Date(payment.paidAt), "dd MMM yyyy, HH:mm", { locale: localeId }) : payment.createdAt ? format(new Date(payment.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId }) : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rp {Number(payment.amount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.paymentType.name}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.wallet ? (
                        <div>
                          <div className="font-medium">{payment.wallet.name}</div>
                          <div className="text-xs text-muted-foreground">{payment.wallet.walletType}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{payment.note || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">Total Dibayar</span>
              <span className="text-2xl font-bold text-green-600">
                Rp {totalPaid.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
