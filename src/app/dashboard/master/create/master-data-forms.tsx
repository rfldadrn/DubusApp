"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createMasterData } from "./actions";

export function MasterDataForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "items";
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);

  // Item form state
  const [itemForm, setItemForm] = useState({
    code: "",
    name: "",
    category: "",
    genderTarget: "Unisex",
    customerPrice: "",
    employeePrice: "",
  });

  // Status Item form state
  const [statusItemForm, setStatusItemForm] = useState({
    code: "",
    name: "",
    description: "",
    sequence: "",
    colorSlug: "#3b82f6",
  });

  // Payment Type form state
  const [paymentTypeForm, setPaymentTypeForm] = useState({
    code: "",
    name: "",
  });

  // Employee Type form state
  const [employeeTypeForm, setEmployeeTypeForm] = useState({
    name: "",
    description: "",
  });

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createMasterData("item", {
        ...itemForm,
        customerPrice: parseFloat(itemForm.customerPrice),
        employeePrice: parseFloat(itemForm.employeePrice),
      });

      if (result.success) {
        toast.success("Item berhasil ditambahkan");
        router.push("/dashboard/master");
      } else {
        toast.error(result.error || "Gagal menambahkan item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStatusItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createMasterData("statusItem", {
        ...statusItemForm,
        sequence: parseInt(statusItemForm.sequence),
      });

      if (result.success) {
        toast.success("Status item berhasil ditambahkan");
        router.push("/dashboard/master");
      } else {
        toast.error(result.error || "Gagal menambahkan status item");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createMasterData("paymentType", paymentTypeForm);

      if (result.success) {
        toast.success("Metode pembayaran berhasil ditambahkan");
        router.push("/dashboard/master");
      } else {
        toast.error(result.error || "Gagal menambahkan metode pembayaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmployeeType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createMasterData("employeeType", employeeTypeForm);

      if (result.success) {
        toast.success("Tipe karyawan berhasil ditambahkan");
        router.push("/dashboard/master");
      } else {
        toast.error(result.error || "Gagal menambahkan tipe karyawan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="items">Item</TabsTrigger>
        <TabsTrigger value="statusItems">Status Item</TabsTrigger>
        <TabsTrigger value="paymentTypes">Metode Bayar</TabsTrigger>
        <TabsTrigger value="employeeTypes">Tipe Karyawan</TabsTrigger>
      </TabsList>

      {/* Item Form */}
      <TabsContent value="items">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Item Jahitan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item-code">Kode</Label>
                  <Input
                    id="item-code"
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    placeholder="Misal: KEMEJA01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-name">Nama Item</Label>
                  <Input
                    id="item-name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Misal: Kemeja Lengan Panjang"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-category">Kategori</Label>
                  <Input
                    id="item-category"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    placeholder="Misal: Kemeja"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-gender">Target Gender</Label>
                  <Select
                    value={itemForm.genderTarget}
                    onValueChange={(value) => setItemForm({ ...itemForm, genderTarget: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pria">Pria</SelectItem>
                      <SelectItem value="Wanita">Wanita</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-customer-price">Harga Customer</Label>
                  <Input
                    id="item-customer-price"
                    type="number"
                    value={itemForm.customerPrice}
                    onChange={(e) => setItemForm({ ...itemForm, customerPrice: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-employee-price">Harga Employee</Label>
                  <Input
                    id="item-employee-price"
                    type="number"
                    value={itemForm.employeePrice}
                    onChange={(e) => setItemForm({ ...itemForm, employeePrice: e.target.value })}
                    placeholder="40000"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Status Item Form */}
      <TabsContent value="statusItems">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Status Item Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStatusItem} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status-code">Kode</Label>
                  <Input
                    id="status-code"
                    value={statusItemForm.code}
                    onChange={(e) => setStatusItemForm({ ...statusItemForm, code: e.target.value })}
                    placeholder="Misal: POTONG"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-name">Nama Status</Label>
                  <Input
                    id="status-name"
                    value={statusItemForm.name}
                    onChange={(e) => setStatusItemForm({ ...statusItemForm, name: e.target.value })}
                    placeholder="Misal: Potong Kain"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-sequence">Urutan</Label>
                  <Input
                    id="status-sequence"
                    type="number"
                    value={statusItemForm.sequence}
                    onChange={(e) => setStatusItemForm({ ...statusItemForm, sequence: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-color">Warna</Label>
                  <Input
                    id="status-color"
                    type="color"
                    value={statusItemForm.colorSlug}
                    onChange={(e) => setStatusItemForm({ ...statusItemForm, colorSlug: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="status-description">Deskripsi</Label>
                  <Input
                    id="status-description"
                    value={statusItemForm.description}
                    onChange={(e) => setStatusItemForm({ ...statusItemForm, description: e.target.value })}
                    placeholder="Deskripsi status"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Payment Type Form */}
      <TabsContent value="paymentTypes">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPaymentType} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment-code">Kode</Label>
                  <Input
                    id="payment-code"
                    value={paymentTypeForm.code}
                    onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, code: e.target.value })}
                    placeholder="Misal: CASH"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-name">Nama Metode</Label>
                  <Input
                    id="payment-name"
                    value={paymentTypeForm.name}
                    onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, name: e.target.value })}
                    placeholder="Misal: Cash/Tunai"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Employee Type Form */}
      <TabsContent value="employeeTypes">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Tipe Karyawan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEmployeeType} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-name">Nama Tipe</Label>
                  <Input
                    id="employee-name"
                    value={employeeTypeForm.name}
                    onChange={(e) => setEmployeeTypeForm({ ...employeeTypeForm, name: e.target.value })}
                    placeholder="Misal: Penjahit"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-description">Deskripsi</Label>
                  <Input
                    id="employee-description"
                    value={employeeTypeForm.description}
                    onChange={(e) => setEmployeeTypeForm({ ...employeeTypeForm, description: e.target.value })}
                    placeholder="Deskripsi tipe karyawan"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
