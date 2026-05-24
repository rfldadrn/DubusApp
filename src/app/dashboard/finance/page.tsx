import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FinanceTable } from "./finance-table";

async function getFinanceData() {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({
      include: {
        transaction: { include: { customer: true } },
        paymentType: true,
        wallet: true,
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.transaction.findMany({ where: { rowStatus: true } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOutstanding = transactions
    .filter((t) => t.paymentStatus !== "Paid")
    .reduce((sum, t) => sum + Number(t.totalAmount), 0);
  const paidTransactions = transactions.filter((t) => t.paymentStatus === "Paid").length;

  const paymentRows = payments.map((p) => ({
    id: p.id,
    paidAt: p.paidAt.toISOString(),
    transactionCode: p.transaction.transactionCode,
    customerName: p.transaction.customer.name,
    paymentTypeName: p.paymentType.name,
    walletName: p.wallet?.name || "-",
    amount: Number(p.amount),
  }));

  return {
    paymentRows,
    totalRevenue,
    totalOutstanding,
    paidTransactions,
    totalTransactions: transactions.length,
  };
}

export default async function FinancePage() {
  const data = await getFinanceData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Keuangan</h1>
        <p className="text-muted-foreground">Kelola pembayaran dan cashflow</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {data.totalRevenue.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">Dari {data.paymentRows.length} pembayaran</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Piutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {data.totalOutstanding.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">Sisa yang belum dibayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Transaksi Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paidTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">Dari {data.totalTransactions} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Payment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totalTransactions > 0 ? Math.round((data.paidTransactions / data.totalTransactions) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tingkat pembayaran</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceTable data={data.paymentRows} />
        </CardContent>
      </Card>
    </div>
  );
}
