import { prisma } from "@/lib/prisma";
import { MasterDataClient } from "./master-data-client";

async function getMasterData() {
  const items = await (async () => {
    try {
      return await prisma.$queryRawUnsafe<Array<{
        id: number;
        code: string;
        name: string;
        category: string | null;
        customerPrice: number;
        employeePrice: number;
        cutterPrice: number | null;
        genderTarget: string;
        rowStatus: boolean;
      }>>(
        `SELECT id, code, name, category, "customerPrice", "employeePrice", COALESCE("cutterPrice", "employeePrice") AS "cutterPrice", "genderTarget", "rowStatus"
         FROM "items"
         WHERE "rowStatus" = true
         ORDER BY name ASC`
      );
    } catch {
      const fallbackItems = await prisma.item.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } });
      return fallbackItems.map((item) => ({
        ...item,
        cutterPrice: Number(item.employeePrice),
      })) as any[];
    }
  })();

  const [statusItems, statusTransactions, paymentTypes, employeeTypes] = await Promise.all([
    prisma.statusItem.findMany({ where: { rowStatus: true }, orderBy: { sequence: "asc" } }),
    prisma.statusTransaction.findMany({ where: { rowStatus: true }, orderBy: { sequence: "asc" } }),
    prisma.paymentType.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } }),
    prisma.employeeType.findMany({ where: { rowStatus: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      customerPrice: Number(item.customerPrice),
      employeePrice: Number(item.employeePrice),
      cutterPrice: Number(item.cutterPrice ?? item.employeePrice),
    })),
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
