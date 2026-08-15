"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type ItemSize = {
  id: number;
  name: string;
  isMandatory: boolean;
};

type SizeValue = {
  itemSizeId: number;
  size: string;
};

type EditSizeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headerSizeCustomerId: number;
  itemName: string;
  itemSizes: ItemSize[];
  initialNote?: string;
  initialValues: Array<{ itemSizeId: number; size: number }>;
  onSuccess: () => void;
};

export function EditSizeDialog({
  open,
  onOpenChange,
  headerSizeCustomerId,
  itemName,
  itemSizes,
  initialNote,
  initialValues,
  onSuccess,
}: EditSizeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(initialNote || "");
  const [sizeValues, setSizeValues] = useState<SizeValue[]>([]);

  const initialMap = useMemo(() => {
    return new Map<number, string>(
      initialValues.map((initialValue) => [initialValue.itemSizeId, String(initialValue.size)])
    );
  }, [initialValues]);

  useEffect(() => {
    if (!open) return;

    setNote(initialNote || "");
    setSizeValues(
      itemSizes.map((itemSize) => ({
        itemSizeId: itemSize.id,
        size: initialMap.get(itemSize.id) || "",
      }))
    );
  }, [open, itemSizes, initialMap, initialNote]);

  const updateSizeValue = (itemSizeId: number, value: string) => {
    setSizeValues((prev) =>
      prev.map((sizeValue) =>
        sizeValue.itemSizeId === itemSizeId ? { ...sizeValue, size: value } : sizeValue
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mandatorySizes = itemSizes.filter((itemSize) => itemSize.isMandatory);
    const filledMandatorySizes = sizeValues.filter(
      (sizeValue) =>
        mandatorySizes.some((mandatorySize) => mandatorySize.id === sizeValue.itemSizeId) &&
        sizeValue.size.trim() !== ""
    );

    if (filledMandatorySizes.length < mandatorySizes.length) {
      toast({
        title: "Error",
        description: "Semua ukuran wajib harus diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sizes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headerSizeCustomerId,
          note,
          sizeValues: sizeValues
            .filter((sizeValue) => sizeValue.size.trim() !== "")
            .map((sizeValue) => ({
              itemSizeId: sizeValue.itemSizeId,
              size: parseFloat(sizeValue.size),
            })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Ukuran berhasil diperbarui",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memperbarui ukuran",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan ukuran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ukuran</DialogTitle>
          <DialogDescription>
            Perbarui ukuran untuk item <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {itemSizes.map((itemSize) => (
            <div key={itemSize.id}>
              <Label htmlFor={`edit-size-${itemSize.id}`}>
                {itemSize.name} {itemSize.isMandatory && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={`edit-size-${itemSize.id}`}
                type="number"
                step="0.01"
                value={sizeValues.find((sizeValue) => sizeValue.itemSizeId === itemSize.id)?.size || ""}
                onChange={(e) => updateSizeValue(itemSize.id, e.target.value)}
                placeholder="cm"
                required={itemSize.isMandatory}
              />
            </div>
          ))}

          <div>
            <Label htmlFor="edit-note">Catatan (Opsional)</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan untuk ukuran ini"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
