import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TransactionTable } from "./transaction-table";

async function getTransactions() {
  const transactions = await prisma.transaction.findMany({
    where: { rowStatus: true },
    include: {
      customer: true,
      statusTransaction: true,
      items: {
        include: {
          item: true,
          statusItem: true,
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
    itemCount: t.items.length,
    totalAmount: Number(t.totalAmount),
    paymentStatus: t.paymentStatus,
    statusName: t.statusTransaction.name,
    type: t.type,
  }));
}

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
