import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { CompanyCatalogClient } from "./company-catalog-client";

export default async function CompanyCatalogPage() {
  const catalogs = await prisma.companyCatalog.findMany({
    orderBy: [{ rowStatus: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Catalog</h1>
        <p className="text-muted-foreground">Kelola katalog company profile dan gambar produk.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Katalog</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyCatalogClient
            initialCatalogs={catalogs.map((catalog) => ({
              id: catalog.id,
              name: catalog.name,
              description: catalog.description,
              price: catalog.price ? Number(catalog.price) : null,
              imagePath: catalog.imagePath,
              sortOrder: catalog.sortOrder,
              rowStatus: catalog.rowStatus,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}