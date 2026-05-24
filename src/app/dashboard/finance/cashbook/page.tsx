import { CashBookClient } from "./cashbook-client";

export default function CashBookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buku Kas</h1>
        <p className="text-muted-foreground">Catatan pemasukan dan pengeluaran harian</p>
      </div>
      <CashBookClient />
    </div>
  );
}
