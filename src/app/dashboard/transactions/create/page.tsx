import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { TransactionCreateForm } from "./transaction-create-form";

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
      take: 1,
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

export default async function TransactionCreatePage() {
  const formData = await getFormData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Transaksi Baru</h1>
        <p className="text-muted-foreground">Formulir pembuatan transaksi jahitan baru</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionCreateForm formData={formData} />
        </CardContent>
      </Card>
    </div>
  );
}
