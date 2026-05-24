import { prisma } from "@/lib/prisma";
import { MasterDataClient } from "./master-data-client";

async function getMasterData() {
  const [items, statusItems, statusTransactions, paymentTypes, employeeTypes] = await Promise.all([
    prisma.item.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } }),
    prisma.statusItem.findMany({ where: { rowStatus: true }, orderBy: { sequence: "asc" } }),
    prisma.statusTransaction.findMany({ where: { rowStatus: true }, orderBy: { sequence: "asc" } }),
    prisma.paymentType.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } }),
    prisma.employeeType.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    items: items.map(i => ({ ...i, customerPrice: Number(i.customerPrice), employeePrice: Number(i.employeePrice) })),
    statusItems,
    statusTransactions,
    paymentTypes,
    employeeTypes,
  };
}

export default async function MasterPage() {
  const data = await getMasterData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
        <p className="text-muted-foreground">Kelola data master sistem</p>
      </div>
      <MasterDataClient {...data} />
    </div>
  );
}
