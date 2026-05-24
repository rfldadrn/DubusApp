import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./reports-client";

async function getReportsData() {
  const [transactions, customers, payments, items, agencyTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { rowStatus: true },
      include: {
        customer: true,
        statusTransaction: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { rowStatus: true },
      include: { transactions: { where: { rowStatus: true } } },
    }),
    prisma.payment.findMany({}),
    prisma.transactionItem.findMany({
      where: { rowStatus: true },
      include: { item: true },
    }),
    prisma.transaction.findMany({
      where: { rowStatus: true, type: "Agency", agencyProjectId: { not: null } },
      include: {
        customer: true,
        agencyProject: { include: { agency: true } },
        items: { include: { item: true, statusItem: true } },
      },
    }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalOrders = transactions.length;
  const totalItems = items.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const topCustomers = customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      totalSpent: c.transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0),
      totalOrders: c.transactions.length,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 20);

  const itemCounts = items.reduce((acc, item) => {
    const key = item.item.name;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const transactionRows = transactions.map((t) => ({
    id: t.id,
    transactionCode: t.transactionCode,
    customerName: t.customer.name,
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    totalAmount: Number(t.totalAmount),
    paymentStatus: t.paymentStatus,
    statusName: t.statusTransaction.name,
    type: t.type,
    itemCount: t.items.length,
  }));

  let agencyItemId = 1;
  const agencyItems = agencyTransactions.flatMap((t) =>
    t.items.map((item) => ({
      id: agencyItemId++,
      transactionCode: t.transactionCode,
      customerName: t.customer.name,
      itemName: item.item.name,
      statusName: item.statusItem?.name || "-",
      agencyName: t.agencyProject?.agency?.name || "-",
      projectName: t.agencyProject?.name || "-",
    }))
  );

  return {
    transactionRows,
    topCustomers,
    topItems,
    agencyItems,
    summary: { totalRevenue, totalOrders, totalItems, avgOrderValue },
  };
}

export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
        <p className="text-muted-foreground">Laporan dan analitik bisnis</p>
      </div>

      <ReportsClient
        transactions={data.transactionRows}
        topCustomers={data.topCustomers}
        topItems={data.topItems}
        agencyItems={data.agencyItems}
        summary={data.summary}
      />
    </div>
  );
}
