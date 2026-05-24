import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { CustomerEditForm } from "./customer-edit-form";

async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id), rowStatus: true },
    include: {
      agency: true,
    },
  });

  if (!customer) notFound();
  return customer;
}

async function getAgencies() {
  return await prisma.agency.findMany({
    where: { rowStatus: true },
    select: { id: true, agencyCode: true, name: true },
    orderBy: { name: "asc" },
  });
}

export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, agencies] = await Promise.all([
    getCustomer(id),
    getAgencies(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Pelanggan</h1>
        <p className="text-muted-foreground">Ubah informasi pelanggan dan hubungkan dengan instansi</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Edit Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerEditForm customer={customer} agencies={agencies} />
        </CardContent>
      </Card>
    </div>
  );
}
