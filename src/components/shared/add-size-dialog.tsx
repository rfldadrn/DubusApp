"use client";

import { useState, useEffect } from "react";
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

type AddSizeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  itemId: number;
  itemName: string;
  itemSizes: ItemSize[];
  onSuccess: () => void;
};

export function AddSizeDialog({
  open,
  onOpenChange,
  customerId,
  itemId,
  itemName,
  itemSizes,
  onSuccess,
}: AddSizeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [sizeValues, setSizeValues] = useState<SizeValue[]>([]);

  useEffect(() => {
    if (open && itemSizes.length > 0) {
      setSizeValues(
        itemSizes.map((itemSize) => ({
          itemSizeId: itemSize.id,
          size: "",
        }))
      );
    }
  }, [open, itemSizes]);

  const updateSizeValue = (itemSizeId: number, value: string) => {
    setSizeValues((prev) =>
      prev.map((sv) => (sv.itemSizeId === itemSizeId ? { ...sv, size: value } : sv))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: mandatory sizes must be filled
    const mandatorySizes = itemSizes.filter((is) => is.isMandatory);
    const filledMandatorySizes = sizeValues.filter(
      (sv) => mandatorySizes.some((ms) => ms.id === sv.itemSizeId) && sv.size.trim() !== ""
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
      const response = await fetch("/api/sizes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          itemId,
          note,
          sizeValues: sizeValues
            .filter((sv) => sv.size.trim() !== "")
            .map((sv) => ({
              itemSizeId: sv.itemSizeId,
              size: parseFloat(sv.size),
            })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Ukuran berhasil ditambahkan",
        });
        onSuccess();
        onOpenChange(false);
        setNote("");
        setSizeValues([]);
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal menambahkan ukuran",
          variant: "destructive",
        });
      }
    } catch (error) {
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
          <DialogTitle>Tambah Ukuran Baru</DialogTitle>
          <DialogDescription>
            Tambahkan ukuran untuk item <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {itemSizes.map((itemSize) => (
            <div key={itemSize.id}>
              <Label htmlFor={`size-${itemSize.id}`}>
                {itemSize.name} {itemSize.isMandatory && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={`size-${itemSize.id}`}
                type="number"
                step="0.01"
                value={sizeValues.find((sv) => sv.itemSizeId === itemSize.id)?.size || ""}
                onChange={(e) => updateSizeValue(itemSize.id, e.target.value)}
                placeholder="cm"
                required={itemSize.isMandatory}
              />
            </div>
          ))}

          <div>
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
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
              {loading ? "Menyimpan..." : "Simpan Ukuran"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
