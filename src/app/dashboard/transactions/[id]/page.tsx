import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TransactionDetailClient } from "./transaction-detail-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transactionRaw = await prisma.transaction.findUnique({
    where: { id: Number(id) },
    include: {
      customer: true,
      statusTransaction: true,
      items: {
        include: {
          item: true,
          statusItem: true,
          fabric: true,
          headerSizeCustomer: true,
          charges: true,
        },
      },
      payments: {
        include: {
          paymentType: true,
          wallet: true,
        },
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!transactionRaw) return notFound();

  // Convert Decimal to number for all relevant fields
  const transaction = {
    ...transactionRaw,
    totalAmount: Number(transactionRaw.totalAmount),
    items: transactionRaw.items.map(item => ({
      ...item,
      sewingPrice: Number(item.sewingPrice),
      fabricPrice: item.fabricPrice ? Number(item.fabricPrice) : null,
      fabricMeters: item.fabricMeters ? Number(item.fabricMeters) : null,
      charges: item.charges.map(charge => ({
        ...charge,
        amount: Number(charge.amount),
      })),
    })),
    payments: transactionRaw.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      balanceAfter: Number(payment.balanceAfter),
    })),
  };

  // Calculate totals
  const totalSewing = transaction.items.reduce((sum: number, item: any) => sum + item.sewingPrice, 0);
  const totalFabric = transaction.items.reduce((sum: number, item: any) => sum + (item.fabricPrice || 0), 0);
  const totalCharges = transaction.items.reduce((sum: number, item: any) => {
    const itemCharges = item.charges.reduce((s: number, c: any) => s + c.amount, 0);
    return sum + itemCharges;
  }, 0);
  const grandTotal = totalSewing + totalFabric + totalCharges;
  const totalPaid = transaction.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const remaining = grandTotal - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Transaksi</h1>
          <p className="text-muted-foreground">Informasi lengkap transaksi</p>
        </div>
        <div className="flex gap-2">
          <TransactionDetailClient transaction={transaction} />
          <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
            <Button variant="outline">Edit Transaksi</Button>
          </Link>
        </div>
      </div>

      {/* Transaction Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">Kode Transaksi</span>
            <p className="font-mono font-semibold">{transaction.transactionCode}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tanggal</span>
            <p className="font-medium">{format(new Date(transaction.transactionDate), "dd MMMM yyyy", { locale: localeId })}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Pelanggan</span>
            <p className="font-medium">{transaction.customer.name}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Status</span>
            <div>
              <Badge>{transaction.statusTransaction?.name || "N/A"}</Badge>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tanggal Selesai</span>
            <p className="font-medium">
              {transaction.completionDate 
                ? format(new Date(transaction.completionDate), "dd MMMM yyyy", { locale: localeId })
                : "-"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Dibuat Oleh</span>
            <p className="font-medium">-</p>
          </div>
          {transaction.note && (
            <div className="md:col-span-2">
              <span className="text-sm text-muted-foreground">Catatan</span>
              <p className="font-medium">{transaction.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Item Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Sumber Kain</TableHead>
                <TableHead>Harga Jahit</TableHead>
                <TableHead>Harga Kain</TableHead>
                <TableHead>Biaya Tambahan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.items.map((item: any) => {
                const itemCharges = item.charges.reduce((sum: number, c: any) => sum + Number(c.amount), 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item.name}</TableCell>
                    <TableCell>{item.fabricSource}</TableCell>
                    <TableCell>Rp {Number(item.sewingPrice).toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {Number(item.fabricPrice || 0).toLocaleString("id-ID")}</TableCell>
                    <TableCell>Rp {itemCharges.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: item.statusItem?.colorSlug || "#gray", color: "white" }}>
                        {item.statusItem?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.targetDate 
                        ? format(new Date(item.targetDate), "dd MMM yyyy", { locale: localeId })
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Jahit</span>
            <span className="font-medium">Rp {totalSewing.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Kain</span>
            <span className="font-medium">Rp {totalFabric.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Biaya Tambahan</span>
            <span className="font-medium">Rp {totalCharges.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Grand Total</span>
            <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Total Dibayar</span>
            <span className="font-medium">Rp {totalPaid.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Sisa Pembayaran</span>
            <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
              Rp {remaining.toLocaleString("id-ID")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
