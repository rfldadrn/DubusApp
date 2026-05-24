"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomer } from "./actions";
import { useToast } from "@/components/ui/use-toast";

export function CustomerCreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    gender: "Laki_laki" as "Laki_laki" | "Perempuan",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama pelanggan wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await createCustomer(formData);

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Pelanggan berhasil ditambahkan",
        });
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal menambahkan pelanggan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan pelanggan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Nama Pelanggan *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nama lengkap pelanggan"
            required
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber">Nomor Telepon</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div>
          <Label htmlFor="gender">Jenis Kelamin</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value as "Laki_laki" | "Perempuan" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laki_laki">Laki-laki</SelectItem>
              <SelectItem value="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/customers")}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pelanggan"}
        </Button>
      </div>
    </form>
  );
}
