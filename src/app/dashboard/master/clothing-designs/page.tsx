import { prisma } from "@/lib/prisma";
import { ClothingDesignsClient } from "./clothing-designs-client";

export const dynamic = "force-dynamic";

export default async function ClothingDesignsPage() {
  const [designsRaw, items] = await Promise.all([
    prisma.clothing_designs.findMany({
      where: { rowStatus: true },
      include: {
        items_clothing_designs_itemIdToitems: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ isBuiltin: "desc" }, { name: "asc" }],
    }),
    prisma.item.findMany({
      where: { rowStatus: true },
      select: { id: true, code: true, name: true, defaultDesignId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const designs = designsRaw.map((design) => ({
    ...design,
    item: design.items_clothing_designs_itemIdToitems,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Design Pakaian</h1>
        <p className="text-muted-foreground">
          Sketsa SVG yang ditempel di bon produksi. Gunakan design bawaan atau buat sendiri.
        </p>
      </div>
      <ClothingDesignsClient designs={designs} items={items} />
    </div>
  );
}
