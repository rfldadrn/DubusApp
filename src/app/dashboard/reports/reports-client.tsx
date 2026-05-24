"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";

interface ReportTransaction {
  id: number;
  transactionCode: string;
  customerName: string;
  transactionDate: string;
  totalAmount: number;
  paymentStatus: string;
  statusName: string;
  type: string;
  itemCount: number;
}

interface TopCustomer {
  id: number;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

interface TopItem {
  name: string;
  count: number;
}

interface AgencyDeliveryItem {
  id: number;
  transactionCode: string;
  customerName: string;
  itemName: string;
  statusName: string;
  agencyName: string;
  projectName: string;
}

interface ReportsClientProps {
  transactions: ReportTransaction[];
  topCustomers: TopCustomer[];
  topItems: TopItem[];
  agencyItems: AgencyDeliveryItem[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    avgOrderValue: number;
  };
}

export function ReportsClient({ transactions, topCustomers, topItems, agencyItems, summary }: ReportsClientProps) {
  const [selectedAgency, setSelectedAgency] = useState<string>("__all__");

  const agencies = [...new Set(agencyItems.map((a) => a.agencyName))];

  const filteredAgencyItems = selectedAgency === "__all__"
    ? agencyItems
    : agencyItems.filter((a) => a.agencyName === selectedAgency);

  // Export to Excel
  const exportToExcel = async (dataRows: Record<string, any>[], fileName: string) => {
    const XLSX = (await import("xlsx")).default;
    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = (title: string, headers: string[], rows: string[][], fileName: string) => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

    let y = 38;
    const colWidths = headers.map(() => Math.floor(260 / headers.length));

    // Header
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    let x = 14;
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 8, "F");
      doc.text(h, x + 2, y + 6);
      x += colWidths[i];
    });
    y += 10;

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    rows.forEach((row) => {
      if (y > 180) {
        doc.addPage();
        y = 20;
      }
      x = 14;
      row.forEach((cell, i) => {
        doc.text(String(cell || ""), x + 2, y + 5);
        doc.rect(x, y, colWidths[i], 7);
        x += colWidths[i];
      });
      y += 7;
    });

    doc.save(`${fileName}.pdf`);
  };

  const handleExportTransactions = (format: "excel" | "pdf") => {
    const data = transactions.map((t) => ({
      "Kode Transaksi": t.transactionCode,
      "Pelanggan": t.customerName,
      "Tanggal": t.transactionDate,
      "Jumlah Item": t.itemCount,
      "Total": `Rp ${t.totalAmount.toLocaleString("id-ID")}`,
      "Pembayaran": t.paymentStatus,
      "Status": t.statusName,
      "Tipe": t.type,
    }));

    if (format === "excel") {
      exportToExcel(data, "laporan-transaksi");
    } else {
      const headers = Object.keys(data[0] || {});
      const rows = data.map((d) => Object.values(d).map(String));
      exportToPDF("Laporan Transaksi", headers, rows, "laporan-transaksi");
    }
  };

  const handleExportAgency = (format: "excel" | "pdf") => {
    const data = filteredAgencyItems.map((a) => ({
      "Kode Transaksi": a.transactionCode,
      "Pelanggan": a.customerName,
      "Item": a.itemName,
      "Status": a.statusName,
      "Instansi": a.agencyName,
      "Project": a.projectName,
    }));

    if (format === "excel") {
      exportToExcel(data, `laporan-agency-${selectedAgency || "all"}`);
    } else {
      const headers = Object.keys(data[0] || {});
      const rows = data.map((d) => Object.values(d).map(String));
      exportToPDF(
        `Laporan Setor Pakaian Agency${selectedAgency !== "__all__" ? ` - ${selectedAgency}` : ""}`,
        headers, rows,
        `laporan-agency-${selectedAgency || "all"}`
      );
    }
  };

  const transactionColumns: Column<ReportTransaction>[] = [
    { key: "transactionCode", label: "Kode", render: (r) => <span className="font-mono text-sm">{r.transactionCode}</span> },
    { key: "customerName", label: "Pelanggan" },
    { key: "transactionDate", label: "Tanggal" },
    { key: "itemCount", label: "Item", render: (r) => `${r.itemCount} item` },
    { key: "totalAmount", label: "Total", render: (r) => `Rp ${r.totalAmount.toLocaleString("id-ID")}` },
    { key: "paymentStatus", label: "Pembayaran" },
    { key: "statusName", label: "Status" },
    { key: "type", label: "Tipe" },
  ];

  const agencyColumns: Column<AgencyDeliveryItem>[] = [
    { key: "transactionCode", label: "Kode", render: (r) => <span className="font-mono text-sm">{r.transactionCode}</span> },
    { key: "customerName", label: "Pelanggan" },
    { key: "itemName", label: "Item" },
    { key: "statusName", label: "Status" },
    { key: "agencyName", label: "Instansi" },
    { key: "projectName", label: "Project" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {summary.totalRevenue.toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Math.round(summary.avgOrderValue).toLocaleString("id-ID")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="agency">Setor Agency</TabsTrigger>
          <TabsTrigger value="top-customers">Top Pelanggan</TabsTrigger>
          <TabsTrigger value="top-products">Top Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Laporan Transaksi</CardTitle>
                  <CardDescription>Seluruh transaksi terdaftar</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportTransactions("excel")}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportTransactions("pdf")}>
                    <FileText className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable data={transactions} columns={transactionColumns} rowKey={(r) => r.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agency">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Setor Pakaian Agency</CardTitle>
                  <CardDescription>Pilih agency dan item yang akan disetor per batch</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih Agency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Agency</SelectItem>
                      {agencies.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => handleExportAgency("excel")}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportAgency("pdf")}>
                    <FileText className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable data={filteredAgencyItems} columns={agencyColumns} rowKey={(r) => r.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-customers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Pelanggan</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  exportToExcel(topCustomers.map((c, i) => ({
                    "Peringkat": i + 1,
                    "Nama": c.name,
                    "Total Orders": c.totalOrders,
                    "Total Belanja": `Rp ${c.totalSpent.toLocaleString("id-ID")}`,
                  })), "top-pelanggan");
                }}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={topCustomers}
                columns={[
                  { key: "rank", label: "#", render: (_, ) => "", sortable: false },
                  { key: "name", label: "Nama" },
                  { key: "totalOrders", label: "Orders", render: (r) => `${r.totalOrders} transaksi` },
                  { key: "totalSpent", label: "Total Belanja", render: (r) => `Rp ${r.totalSpent.toLocaleString("id-ID")}` },
                ]}
                rowKey={(r) => r.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Produk</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  exportToExcel(topItems.map((item, i) => ({
                    "Peringkat": i + 1,
                    "Produk": item.name,
                    "Jumlah": item.count,
                  })), "top-produk");
                }}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={topItems.map((item, i) => ({ ...item, id: i }))}
                columns={[
                  { key: "name", label: "Produk" },
                  { key: "count", label: "Jumlah", render: (r) => `${r.count} item` },
                ]}
                rowKey={(r) => r.name}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
