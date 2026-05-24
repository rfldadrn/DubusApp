import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { PaymentCreateForm } from "./payment-create-form";

async function getFormData() {
  const [transactionsRaw, paymentTypes, wallets] = await Promise.all([
    prisma.transaction.findMany({
      where: { rowStatus: true, paymentStatus: { not: "Paid" } },
      include: { 
        customer: true,
        payments: true 
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentType.findMany({ where: { rowStatus: true } }),
    prisma.wallet.findMany({ where: { isActive: true } }),
  ]);

  // Convert Decimal to number for client components
  const transactions = transactionsRaw.map(t => ({
    ...t,
    totalAmount: Number(t.totalAmount),
    payments: t.payments.map(p => ({
      ...p,
      amount: Number(p.amount),
      balanceAfter: Number(p.balanceAfter),
    }))
  }));

  return { transactions, paymentTypes, wallets };
}

export default async function FinanceCreatePage() {
  const formData = await getFormData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Pembayaran</h1>
        <p className="text-muted-foreground">Formulir pencatatan pembayaran baru</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentCreateForm formData={formData} />
        </CardContent>
      </Card>
    </div>
  );
}
