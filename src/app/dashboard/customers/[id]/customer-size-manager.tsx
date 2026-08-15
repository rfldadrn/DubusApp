"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil } from "lucide-react";
import { AddSizeDialog } from "@/components/shared/add-size-dialog";
import { EditSizeDialog } from "@/components/shared/edit-size-dialog";

type ItemSizeField = { id: number; name: string; isMandatory: boolean };

type SizeHeaderData = {
  id: number;
  itemId: number;
  note: string | null;
  createdAt: string;
  item: {
    id: number;
    name: string;
  };
  itemSizeCustomers: Array<{
    id: number;
    itemSizeId: number;
    size: number;
    itemSize: {
      id: number;
      name: string;
      isMandatory: boolean;
    };
  }>;
};

type CustomerSizeManagerProps = {
  customerId: number;
  items: Array<{ id: number; name: string }>;
  sizeHeaders: SizeHeaderData[];
};

export function CustomerSizeManager({ customerId, items, sizeHeaders }: CustomerSizeManagerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addItemSizes, setAddItemSizes] = useState<ItemSizeField[]>([]);
  const [addItemName, setAddItemName] = useState("");

  const [editingHeader, setEditingHeader] = useState<SizeHeaderData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItemSizes, setEditItemSizes] = useState<ItemSizeField[]>([]);

  const itemOptions = items.map((item) => ({
    value: item.id.toString(),
    label: item.name,
  }));

  const fetchItemSizes = async (itemId: number) => {
    const response = await fetch(`/api/items/sizes?itemId=${itemId}`, { cache: "no-store" });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Gagal mengambil field ukuran");
    }
    return result.data as ItemSizeField[];
  };

  const openAddDialog = async () => {
    if (!selectedItemId) {
      toast({
        title: "Error",
        description: "Pilih item terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemId = Number(selectedItemId);
      const itemName = items.find((item) => item.id === itemId)?.name || "";
      const fields = await fetchItemSizes(itemId);
      setAddItemName(itemName);
      setAddItemSizes(fields);
      setAddDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengambil data ukuran item",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (header: SizeHeaderData) => {
    try {
      const fields = await fetchItemSizes(header.itemId);
      setEditItemSizes(fields);
      setEditingHeader(header);
      setEditDialogOpen(true);
    } catch {
      toast({
        title: "Error",
        description: "Gagal mengambil data ukuran item",
        variant: "destructive",
      });
    }
  };

  const handleMutationSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 bg-muted/20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <Label>Item untuk ukuran baru</Label>
            <SearchableSelect
              value={selectedItemId}
              onValueChange={setSelectedItemId}
              options={itemOptions}
              placeholder="Pilih item"
              searchPlaceholder="Cari item..."
            />
          </div>
          <Button type="button" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Ukuran
          </Button>
        </div>
      </div>

      {sizeHeaders.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">Belum ada data ukuran</p>
      ) : (
        <div className="space-y-4">
          {sizeHeaders.map((header) => (
            <div key={header.id} className="p-4 rounded-lg border">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-medium">{header.item.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Dibuat: {new Date(header.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(header)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Ukuran
                </Button>
              </div>

              {header.note && (
                <div className="mb-3">
                  <Badge variant="secondary">{header.note}</Badge>
                </div>
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

      {selectedItemId && addItemSizes.length > 0 && (
        <AddSizeDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          customerId={customerId}
          itemId={Number(selectedItemId)}
          itemName={addItemName}
          itemSizes={addItemSizes}
          onSuccess={() => handleMutationSuccess()}
        />
      )}

      {editingHeader && (
        <EditSizeDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          headerSizeCustomerId={editingHeader.id}
          itemName={editingHeader.item.name}
          itemSizes={editItemSizes}
          initialNote={editingHeader.note || ""}
          initialValues={editingHeader.itemSizeCustomers.map((detail) => ({
            itemSizeId: detail.itemSizeId,
            size: Number(detail.size),
          }))}
          onSuccess={handleMutationSuccess}
        />
      )}
    </div>
  );
}
