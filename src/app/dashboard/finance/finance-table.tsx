"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PaymentRow {
  id: number;
  paidAt: string;
  transactionCode: string;
  customerName: string;
  paymentTypeName: string;
  walletName: string;
  amount: number;
}

const columns: Column<PaymentRow>[] = [
  {
    key: "paidAt",
    label: "Tanggal",
    render: (row) => format(new Date(row.paidAt), "dd MMM yyyy", { locale: id }),
  },
  {
    key: "transactionCode",
    label: "Transaksi",
    render: (row) => <span className="font-medium">{row.transactionCode}</span>,
  },
  {
    key: "customerName",
    label: "Pelanggan",
  },
  {
    key: "paymentTypeName",
    label: "Metode",
  },
  {
    key: "walletName",
    label: "Wallet",
  },
  {
    key: "amount",
    label: "Jumlah",
    render: (row) => <span className="font-medium text-right">Rp {row.amount.toLocaleString("id-ID")}</span>,
  },
  {
    key: "status",
    label: "Status",
    sortable: false,
    searchable: false,
    render: () => <Badge className="bg-green-100 text-green-800">Success</Badge>,
  },
];

export function FinanceTable({ data }: { data: PaymentRow[] }) {
  return (
    <DataTable
      data={data}
      columns={columns}
      filters={[{
        key: "paymentTypeName",
        label: "Metode",
        options: [...new Set(data.map((d) => d.paymentTypeName))].map((v) => ({ value: v, label: v })),
      }]}
      rowKey={(row) => row.id}
      emptyMessage="Belum ada pembayaran."
    />
  );
}
