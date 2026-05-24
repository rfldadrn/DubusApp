"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCustomer } from "./actions";
import { useToast } from "@/components/ui/use-toast";

type Customer = {
  id: number;
  name: string;
  phoneNumber: string | null;
  gender: string | null;
  agencyId: number | null;
  agency?: { id: number; name: string } | null;
};

type Agency = {
  id: number;
  agencyCode: string;
  name: string;
};

export function CustomerEditForm({ customer, agencies }: { customer: Customer; agencies: Agency[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: customer.name,
    phoneNumber: customer.phoneNumber || "",
    gender: customer.gender || "Laki_laki" as "Laki_laki" | "Perempuan",
    agencyId: customer.agencyId?.toString() || "none",
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
      const result = await updateCustomer(customer.id, {
        name: formData.name,
        phoneNumber: formData.phoneNumber || "",
        gender: formData.gender as "Laki_laki" | "Perempuan",
        agencyId: formData.agencyId === "none" ? null : Number(formData.agencyId),
      });

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Data pelanggan berhasil diperbarui",
        });
        router.push(`/dashboard/customers/${customer.id}`);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memperbarui pelanggan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nama Pelanggan *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masukkan nama pelanggan"
            required
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber">No. Telepon</Label>
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
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laki_laki">Laki-laki</SelectItem>
              <SelectItem value="Perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="agency">Instansi / Agency</Label>
          <Select
            value={formData.agencyId}
            onValueChange={(value) => setFormData({ ...formData, agencyId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih instansi (opsional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Pelanggan Reguler (Tanpa Instansi)</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id.toString()}>
                  {agency.name} ({agency.agencyCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Hubungkan pelanggan reguler dengan instansi jika diperlukan
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
