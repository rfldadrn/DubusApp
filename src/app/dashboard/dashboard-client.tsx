"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart, Users, DollarSign, Factory, TrendingUp,
  AlertTriangle, ArrowRight, Bell, Package, ChevronRight, Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

type DashboardData = {
  totalTransactions: number;
  totalCustomers: number;
  pendingTransactions: number;
  inProductionItems: number;
  totalRevenue: number;
  totalExpenses: number;
  recentTransactions: {
    id: number;
    transactionCode: string;
    customerName: string;
    totalAmount: number;
    paymentStatus: string;
    statusName: string;
    statusColor: string;
    transactionDate: string;
  }[];
  urgentItems: {
    id: number;
    transactionId: number;
    transactionCode: string;
    customerName: string;
    itemName: string;
    targetDate: string;
    daysLeft: number;
    statusName: string;
    statusColor: string;
  }[];
  productionByStatus: { name: string; count: number; color: string }[];
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  userName: string;
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const [reminderDays, setReminderDays] = useState("3");
  const profit = data.totalRevenue - data.totalExpenses;

  const filteredUrgent = data.urgentItems.filter(
    (item) => item.daysLeft <= parseInt(reminderDays)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {data.userName}!
          </p>
        </div>
        <Link href="/dashboard/transactions/create">
          <Button>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order Baru
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Lunas</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.pendingTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Produksi</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inProductionItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Bulan Ini</CardTitle>
            <TrendingUp className={`h-4 w-4 ${profit >= 0 ? "text-green-500" : "text-red-500"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rp {profit.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pendapatan & Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                  <Tooltip
                    formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, ""]}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar dataKey="revenue" name="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Production Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.productionByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {data.productionByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminder + Recent Transactions Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reminder - Urgent Orders */}
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                Reminder Pesanan Jatuh Tempo
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Dalam</Label>
                <Select value={reminderDays} onValueChange={setReminderDays}>
                  <SelectTrigger className="w-[80px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hari</SelectItem>
                    <SelectItem value="3">3 hari</SelectItem>
                    <SelectItem value="5">5 hari</SelectItem>
                    <SelectItem value="7">7 hari</SelectItem>
                    <SelectItem value="14">14 hari</SelectItem>
                    <SelectItem value="30">30 hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUrgent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada pesanan mendekati deadline
              </p>
            ) : (
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                {filteredUrgent.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/transactions/${item.transactionId}`}
                    className="block"
                  >
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50 cursor-pointer ${
                        item.daysLeft <= 0
                          ? "border-red-300 bg-red-50"
                          : item.daysLeft <= 1
                          ? "border-orange-300 bg-orange-50"
                          : "border-yellow-200 bg-yellow-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AlertTriangle
                          className={`h-4 w-4 flex-shrink-0 ${
                            item.daysLeft <= 0 ? "text-red-500" : "text-orange-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.customerName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.transactionCode} • {item.itemName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <Badge
                          variant={item.daysLeft <= 0 ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {item.daysLeft <= 0 ? "LEWAT" : `${item.daysLeft} hari`}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(item.targetDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {filteredUrgent.length > 0 && (
              <div className="mt-3 text-center">
                <Link href="/dashboard/production">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua Produksi <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions - Minimalist */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Pesanan Terbaru
              </CardTitle>
              <Link href="/dashboard/transactions">
                <Button variant="ghost" size="sm" className="text-xs">
                  Lihat Semua <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada transaksi
              </p>
            ) : (
              <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                {data.recentTransactions.map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {tx.transactionCode}
                          </span>
                          <Badge
                            variant={
                              tx.paymentStatus === "Paid"
                                ? "default"
                                : tx.paymentStatus === "Partial"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {tx.paymentStatus === "Paid"
                              ? "Lunas"
                              : tx.paymentStatus === "Partial"
                              ? "Cicilan"
                              : "Belum"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate mt-0.5">
                          {tx.customerName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold">
                          Rp {tx.totalAmount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.transactionDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-5">
        <Link href="/dashboard/transactions/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Order Baru</p>
                <p className="text-xs text-muted-foreground">Buat pesanan jahitan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/production">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <Factory className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Produksi</p>
                <p className="text-xs text-muted-foreground">Update status produksi</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/finance/cashbook">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-sm">Buku Kas</p>
                <p className="text-xs text-muted-foreground">Catat pemasukan & pengeluaran</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/finance/payroll">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Penggajian</p>
                <p className="text-xs text-muted-foreground">Bayar gaji karyawan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/delivery">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-3 p-4">
              <Truck className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="font-medium text-sm">Pengantaran</p>
                <p className="text-xs text-muted-foreground">Kirim batch agency</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
