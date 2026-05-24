import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CustomerTable } from "./customer-table";
import { CustomersImportDialog } from "./customers-import-dialog";
import { unstable_cache } from "next/cache";

const getCustomers = unstable_cache(async () => {
  const customers = await prisma.customer.findMany({
    where: { rowStatus: true },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      gender: true,
      createdAt: true,
      agency: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          transactions: {
            where: { rowStatus: true },
          },
          sizeHeaders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phoneNumber: c.phoneNumber || "",
    gender: c.gender || "N/A",
    agencyName: c.agency?.name || "",
    transactionCount: c._count.transactions,
    sizeCount: c._count.sizeHeaders,
    createdAt: c.createdAt.toISOString(),
  }));
}, ["customers-page-data"], { revalidate: 30, tags: ["customers-page-data"] });

export default async function CustomersPage() {
  const customers = await getCustomers();

  const activeCount = customers.filter((c) => c.transactionCount > 0).length;
  const withSizeCount = customers.filter((c) => c.sizeCount > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pelanggan</h1>
          <p className="text-muted-foreground">Kelola data pelanggan dan ukuran</p>
        </div>
        <div className="flex items-center gap-2">
          <CustomersImportDialog />
          <Link href="/dashboard/customers/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Pelanggan Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Punya Ukuran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withSizeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTable data={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
