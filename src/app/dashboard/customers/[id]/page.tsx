import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil, ShoppingCart } from "lucide-react";
import { CustomerSizeManager } from "./customer-size-manager";

async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: {
      transactions: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          transactionCode: true,
          totalAmount: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
      sizeHeaders: {
        include: {
          itemSizeCustomers: {
            include: {
              itemSize: true,
            },
          },
          item: true,
        },
      },
    },
  });

  if (!customer) notFound();
  return customer;
}

async function getActiveItems() {
  return prisma.item.findMany({
    where: { rowStatus: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, items] = await Promise.all([getCustomer(id), getActiveItems()]);

  const sizeHeaders = customer.sizeHeaders.map((header) => ({
    id: header.id,
    itemId: header.itemId,
    note: header.note,
    createdAt: header.createdAt.toISOString(),
    item: {
      id: header.item.id,
      name: header.item.name,
    },
    itemSizeCustomers: header.itemSizeCustomers.map((detail) => ({
      id: detail.id,
      itemSizeId: detail.itemSizeId,
      size: Number(detail.size),
      itemSize: {
        id: detail.itemSize.id,
        name: detail.itemSize.name,
        isMandatory: detail.itemSize.isMandatory,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">Detail informasi pelanggan</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>  
          <Link href="/dashboard/transactions/create">
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Baru
            </Button>
          </Link>
        </div> 
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No. Telepon</p>
              <p className="font-medium">{customer.phoneNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
              <Badge variant="outline">{customer.gender || "-"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold">{customer.transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Ukuran</p>
              <p className="text-2xl font-bold">{customer.sizeHeaders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {customer.transactions.map((t) => (
                <Link key={t.id} href={`/dashboard/transactions/${t.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{t.transactionCode}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {Number(t.totalAmount).toLocaleString("id-ID")}</p>
                      <Badge variant={t.paymentStatus === "Paid" ? "default" : "secondary"}>
                        {t.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Ukuran</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerSizeManager customerId={customer.id} items={items} sizeHeaders={sizeHeaders} />
        </CardContent>
      </Card>
    </div>
  );
}
