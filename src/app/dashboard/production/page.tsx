import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";
import { ProductionTable } from "./production-table";
import { unstable_cache } from "next/cache";

const getProductionData = unstable_cache(async () => {
  const now = new Date();
  const urgentBefore = new Date();
  urgentBefore.setDate(urgentBefore.getDate() + 3);

  const [transactionItems, statusItems, employees, inProgressCount, completedCount, urgentCount] = await Promise.all([
    prisma.transactionItem.findMany({
    where: { rowStatus: true },
    select: {
      id: true,
      targetDate: true,
      transaction: {
        select: {
          id: true,
          transactionCode: true,
          customer: {
            select: {
              name: true,
            },
          },
          agencyProject: {
            select: {
              agency: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      item: {
        select: {
          name: true,
        },
      },
      statusItem: {
        select: {
          code: true,
          name: true,
          sequence: true,
          colorSlug: true,
        },
      },
      assignedTailor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }),

  prisma.statusItem.findMany({
    where: { rowStatus: true },
    orderBy: { sequence: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      sequence: true,
      colorSlug: true,
    },
  }),

  prisma.employee.findMany({
    where: { rowStatus: true },
    select: {
      id: true,
      name: true,
      employeeType: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  }),

  prisma.transactionItem.count({
    where: {
      rowStatus: true,
      statusItem: { code: { notIn: ["OK", "DIAMBIL"] } },
    },
  }),

  prisma.transactionItem.count({
    where: {
      rowStatus: true,
      statusItem: { code: { in: ["OK", "DIAMBIL"] } },
    },
  }),

  prisma.transactionItem.count({
    where: {
      rowStatus: true,
      targetDate: { not: null, lte: urgentBefore },
      statusItem: { code: { notIn: ["OK", "DIAMBIL"] } },
    },
  }),
  ]);

  const maxSequence = Math.max(...statusItems.map((s) => s.sequence), 1);

  const rows = transactionItems.map((ti) => ({
    id: ti.id,
    transactionCode: ti.transaction.transactionCode,
    customerName: ti.transaction.customer.name,
    agencyName: ti.transaction.agencyProject?.agency?.name || "Umum",
    transactionId: ti.transaction.id,
    itemName: ti.item.name,
    statusName: ti.statusItem?.name ?? "",
    statusCode: ti.statusItem?.code ?? "",
    statusSequence: ti.statusItem?.sequence ?? 0,
    statusColorSlug: ti.statusItem?.colorSlug ?? "gray",
    targetDate: ti.targetDate?.toISOString() ?? null,
    assignedTailorName: ti.assignedTailor?.name ?? null,
    progress: Math.round(((ti.statusItem?.sequence ?? 0) / maxSequence) * 100),
  }));

  const urgent = rows.filter(
    (r) => r.targetDate && differenceInDays(new Date(r.targetDate), now) < 3 && r.statusCode !== "OK" && r.statusCode !== "DIAMBIL"
  );

  return {
    rows,
    statusItems: statusItems.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      sequence: s.sequence,
      colorSlug: s.colorSlug || "gray",
    })),
    employees: employees.map((e) => ({
      id: e.id,
      name: e.name,
      typeName: e.employeeType?.name || "Umum",
    })),
    agencies: Array.from(new Set(rows.map((r) => r.agencyName))).sort((a, b) => a.localeCompare(b)),
    inProgressCount,
    completedCount,
    urgentCount: Math.max(urgentCount, urgent.length),
  };
}, ["production-page-data"], { revalidate: 20, tags: ["production-page-data"] });

export default async function ProductionPage() {
  const data = await getProductionData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Produksi</h1>
        <p className="text-muted-foreground">Monitor progress produksi jahitan</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Sedang Dikerjakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inProgressCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Item dalam produksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Item telah selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.urgentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Deadline kurang dari 3 hari</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionTable data={data.rows} allStatuses={data.statusItems} employees={data.employees} agencies={data.agencies} />
        </CardContent>
      </Card>
    </div>
  );
}
