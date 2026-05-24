import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TransactionEditForm } from "./transaction-edit-form";

async function getFormData() {
  const [customersRaw, itemsRaw, fabricsRaw, statusTransactions, statusItems, paymentTypes, wallets] = await Promise.all([
    prisma.customer.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true, phoneNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true, customerPrice: true },
      orderBy: { name: "asc" },
    }),
    prisma.fabric.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true, pricePerMeter: true },
      orderBy: { name: "asc" },
    }),
    prisma.statusTransaction.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true },
      orderBy: { sequence: "asc" },
    }),
    prisma.statusItem.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true, sequence: true },
      orderBy: { sequence: "asc" },
    }),
    prisma.paymentType.findMany({
      where: { rowStatus: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.wallet.findMany({
      where: { isActive: true },
      select: { id: true, name: true, walletType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Convert Decimal to number for client components
  const customers = customersRaw;
  const items = itemsRaw.map(item => ({
    ...item,
    customerPrice: Number(item.customerPrice)
  }));
  const fabrics = fabricsRaw.map(fabric => ({
    ...fabric,
    pricePerMeter: Number(fabric.pricePerMeter)
  }));

  return { customers, items, fabrics, statusTransactions, statusItems, paymentTypes, wallets };
}

async function getTransaction(id: number) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, phoneNumber: true }
      },
      items: {
        include: {
          item: {
            select: { id: true, name: true }
          },
          fabric: {
            select: { id: true, name: true }
          },
          headerSizeCustomer: {
            select: { id: true, note: true }
          },
          charges: true,
        },
      },
      payments: {
        include: {
          paymentType: {
            select: { id: true, name: true }
          },
          wallet: {
            select: { id: true, name: true }
          }
        }
      }
    },
  });

  if (!transaction) {
    return null;
  }

  // Convert Decimal to number
  return {
    ...transaction,
    totalAmount: Number(transaction.totalAmount),
    items: transaction.items.map(item => ({
      ...item,
      fabricPrice: item.fabricPrice ? Number(item.fabricPrice) : null,
      fabricMeters: item.fabricMeters ? Number(item.fabricMeters) : null,
      sewingPrice: Number(item.sewingPrice),
      charges: item.charges.map(charge => ({
        ...charge,
        amount: Number(charge.amount),
      })),
    })),
    payments: transaction.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      balanceAfter: Number(payment.balanceAfter),
    })),
  };
}

export default async function TransactionEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const transactionId = parseInt(id);
  
  if (isNaN(transactionId)) {
    notFound();
  }

  const [formData, transaction] = await Promise.all([
    getFormData(),
    getTransaction(transactionId),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Transaksi</h1>
        <p className="text-muted-foreground">
          Edit transaksi <strong>{transaction.transactionCode}</strong>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Edit Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionEditForm formData={formData} transaction={transaction} />
        </CardContent>
      </Card>
    </div>
  );
}
