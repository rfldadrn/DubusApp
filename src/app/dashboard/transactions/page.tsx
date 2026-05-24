import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TransactionTable } from "./transaction-table";
import { unstable_cache } from "next/cache";

const getTransactions = unstable_cache(async () => {
  const transactions = await prisma.transaction.findMany({
    where: { rowStatus: true },
    select: {
      id: true,
      transactionCode: true,
      transactionDate: true,
      totalAmount: true,
      paymentStatus: true,
      type: true,
      customer: {
        select: {
          name: true,
        },
      },
      statusTransaction: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return transactions.map((t) => ({
    id: t.id,
    transactionCode: t.transactionCode,
    customerName: t.customer.name,
    transactionDate: t.transactionDate.toISOString(),
    itemCount: t._count.items,
    totalAmount: Number(t.totalAmount),
    paymentStatus: t.paymentStatus,
    statusName: t.statusTransaction.name,
    type: t.type,
  }));
}, ["transactions-page-data"], { revalidate: 20, tags: ["transactions-page-data"] });

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaksi</h1>
          <p className="text-muted-foreground">Kelola order dan transaksi jahitan</p>
        </div>
        <Link href="/dashboard/transactions/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Transaksi Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable data={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
