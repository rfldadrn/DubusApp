"use client";

import { DataTable, Column, FilterOption } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Phone } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CustomerRow {
  id: number;
  name: string;
  phoneNumber: string;
  gender: string;
  agencyName: string;
  transactionCount: number;
  sizeCount: number;
  createdAt: string;
}

const columns: Column<CustomerRow>[] = [
  {
    key: "name",
    label: "Nama",
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "phoneNumber",
    label: "Kontak",
    render: (row) => row.phoneNumber ? (
      <div className="flex items-center gap-1 text-sm">
        <Phone className="h-3 w-3" />
        {row.phoneNumber}
      </div>
    ) : <span className="text-muted-foreground">-</span>,
  },
  {
    key: "gender",
    label: "Gender",
    render: (row) => <Badge variant="outline">{row.gender}</Badge>,
  },
  {
    key: "agencyName",
    label: "Instansi",
    render: (row) => row.agencyName || <span className="text-muted-foreground">-</span>,
  },
  {
    key: "transactionCount",
    label: "Transaksi",
    render: (row) => `${row.transactionCount} transaksi`,
  },
  {
    key: "sizeCount",
    label: "Ukuran",
    render: (row) => `${row.sizeCount} ukuran`,
  },
  {
    key: "createdAt",
    label: "Bergabung",
    render: (row) => format(new Date(row.createdAt), "dd MMM yyyy", { locale: id }),
  },
  {
    key: "actions",
    label: "Aksi",
    sortable: false,
    searchable: false,
    render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/dashboard/customers/${row.id}`}>
          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
        </Link>
        <Link href={`/dashboard/customers/${row.id}/edit`}>
          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
        </Link>
      </div>
    ),
  },
];

const filters: FilterOption[] = [
  {
    key: "gender",
    label: "Gender",
    options: [
      { value: "Laki_laki", label: "Laki-laki" },
      { value: "Perempuan", label: "Perempuan" },
    ],
  },
];

export function CustomerTable({ data }: { data: CustomerRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      filters={filters}
      rowKey={(row) => row.id}
      emptyMessage='Belum ada pelanggan. Klik "Pelanggan Baru" untuk menambahkan.'
    />
  );
}
