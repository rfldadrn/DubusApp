import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";

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

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">Detail informasi pelanggan</p>
        </div>
        <Link href={`/dashboard/customers/${customer.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
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
          {customer.sizeHeaders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Belum ada data ukuran</p>
          ) : (
            <div className="space-y-4">
              {customer.sizeHeaders.map((header) => (
                <div key={header.id} className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">{header.item.name}</h4>
                  {header.note && (
                    <p className="text-sm text-muted-foreground mb-2">{header.note}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {header.itemSizeCustomers.map((detail) => (
                      <div key={detail.id}>
                        <span className="text-muted-foreground">{detail.itemSize.name}:</span>{" "}
                        <span className="font-medium">{Number(detail.size)} cm</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
