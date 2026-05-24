"use client";

import { DataTable, Column, FilterOption } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionRow {
  id: number;
  transactionCode: string;
  customerName: string;
  transactionDate: string;
  itemCount: number;
  totalAmount: number;
  paymentStatus: string;
  statusName: string;
  type: string;
}

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "Paid": return "bg-green-100 text-green-800";
    case "Partial": return "bg-yellow-100 text-yellow-800";
    case "Unpaid": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const columns: Column<TransactionRow>[] = [
  {
    key: "transactionCode",
    label: "Kode Transaksi",
    render: (row) => <span className="font-medium font-mono text-sm">{row.transactionCode}</span>,
  },
  {
    key: "customerName",
    label: "Pelanggan",
    render: (row) => row.customerName,
  },
  {
    key: "transactionDate",
    label: "Tanggal",
    render: (row) => format(new Date(row.transactionDate), "dd MMM yyyy", { locale: id }),
  },
  {
    key: "itemCount",
    label: "Item",
    render: (row) => `${row.itemCount} item`,
  },
  {
    key: "totalAmount",
    label: "Total",
    render: (row) => `Rp ${row.totalAmount.toLocaleString("id-ID")}`,
  },
  {
    key: "paymentStatus",
    label: "Pembayaran",
    render: (row) => (
      <Badge className={getPaymentStatusColor(row.paymentStatus)}>
        {row.paymentStatus === "Paid" ? "Lunas" : row.paymentStatus === "Partial" ? "Sebagian" : "Belum Bayar"}
      </Badge>
    ),
  },
  {
    key: "statusName",
    label: "Status",
    render: (row) => <Badge variant="outline">{row.statusName}</Badge>,
  },
  {
    key: "actions",
    label: "Aksi",
    sortable: false,
    searchable: false,
    render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/dashboard/transactions/${row.id}`}>
          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
        </Link>
        <Link href={`/dashboard/transactions/${row.id}/edit`}>
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        </Link>
      </div>
    ),
  },
];

const filters: FilterOption[] = [
  {
    key: "paymentStatus",
    label: "Pembayaran",
    options: [
      { value: "Unpaid", label: "Belum Bayar" },
      { value: "Partial", label: "Sebagian" },
      { value: "Paid", label: "Lunas" },
    ],
  },
  {
    key: "type",
    label: "Tipe",
    options: [
      { value: "Regular", label: "Regular" },
      { value: "Agency", label: "Agency" },
    ],
  },
];

export function TransactionTable({ data }: { data: TransactionRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      filters={filters}
      rowKey={(row) => row.id}
      emptyMessage='Belum ada transaksi. Klik "Transaksi Baru" untuk membuat order pertama.'
    />
  );
}
