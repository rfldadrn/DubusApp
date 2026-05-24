"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Wallet, Trash2, ArrowUpCircle, ArrowDownCircle, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";
import { getCashLedgerEntries, createCashLedgerEntry, deleteCashLedgerEntry, updateCashLedgerEntry, getWallets, getCashSummary, getTransactionRevenueForPeriod } from "./actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const CATEGORIES_DEBIT = [
  "Pembayaran Pelanggan",
  "Pembayaran Dinas/Agency",
  "Pelunasan Angsuran Agency",
  "Pembayaran Angsuran",
  "Permak",
  "Pengembalian Pinjaman",
  "Pendapatan Lain",
];

const CATEGORIES_CREDIT = [
  "Belanja Alat Jahit",
  "Belanja Bahan/Kain",
  "Belanja Benang & Perlengkapan",
  "Biaya Operasional",
  "Listrik",
  "Air",
  "Telepon/Internet",
  "Sewa Tempat",
  "Pinjaman Karyawan",
  "Gaji Karyawan",
  "Biaya Pengiriman",
  "Belanja Harian",
  "Pengeluaran Lain",
];

type CashEntry = {
  id: number;
  entryDate: string;
  type: "Debit" | "Credit";
  category: string;
  description: string;
  amount: number;
  walletName: string;
  walletId: number;
  paymentId: number | null;
  payrollId: number | null;
  customerName: string | null;
  employeeName: string | null;
  createdBy: string;
};

type WalletData = {
  id: number;
  name: string;
  walletType: string;
};

export function CashBookClient() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [summary, setSummary] = useState({ totalDebit: 0, totalCredit: 0, balance: 0 });
  const [txnRevenue, setTxnRevenue] = useState({ transactionRevenue: 0, paymentCount: 0, payments: [] as any[] });
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editEntry, setEditEntry] = useState<CashEntry | null>(null);

  // Filters
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Form state
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    type: "Debit" as "Debit" | "Credit",
    category: "",
    description: "",
    amount: "",
    walletId: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = { period, date: filterDate };
      if (filterWallet !== "all") filters.walletId = parseInt(filterWallet);
      if (filterType !== "all") filters.type = filterType;

      const [entriesData, summaryData, txnData] = await Promise.all([
        getCashLedgerEntries(filters),
        getCashSummary(
          filterWallet !== "all" ? parseInt(filterWallet) : undefined,
          filterDate,
          period
        ),
        getTransactionRevenueForPeriod(filterDate, period),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
      setTxnRevenue(txnData);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  }, [period, filterDate, filterWallet, filterType]);

  useEffect(() => {
    getWallets().then((w) => setWallets(w as any));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!form.category || !form.description || !form.amount || !form.walletId) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const result = await createCashLedgerEntry({
        entryDate: form.entryDate,
        type: form.type,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        walletId: parseInt(form.walletId),
      });
      if (result.success) {
        toast.success("Entri berhasil ditambahkan");
        setShowAddDialog(false);
        setForm({ entryDate: new Date().toISOString().split("T")[0], type: "Debit", category: "", description: "", amount: "", walletId: "" });
        loadData();
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus entri ini?")) return;
    setLoading(true);
    try {
      const result = await deleteCashLedgerEntry(id);
      if (result.success) {
        toast.success("Entri dihapus");
        loadData();
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const openEdit = (entry: CashEntry) => {
    setEditEntry(entry);
    setForm({
      entryDate: entry.entryDate.split("T")[0],
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: String(entry.amount),
      walletId: String(entry.walletId),
    });
  };

  const handleEdit = async () => {
    if (!editEntry) return;
    if (!form.category || !form.description || !form.amount || !form.walletId) {
      toast.error("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const result = await updateCashLedgerEntry(editEntry.id, {
        entryDate: form.entryDate,
        type: form.type,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        walletId: parseInt(form.walletId),
      });
      if (result.success) {
        toast.success("Entri berhasil diupdate");
        setEditEntry(null);
        setForm({ entryDate: new Date().toISOString().split("T")[0], type: "Debit", category: "", description: "", amount: "", walletId: "" });
        loadData();
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  // Compute combined totals: kas entries + transaction revenue (only debit side from payments already in kas)
  const combinedDebit = summary.totalDebit;
  const combinedCredit = summary.totalCredit;
  const combinedBalance = combinedDebit - combinedCredit;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {combinedDebit.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dari kas & transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {combinedCredit.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit / Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${combinedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              Rp {combinedBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {combinedBalance >= 0 ? "Untung" : "Rugi"} periode ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Transaksi</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              Rp {txnRevenue.transactionRevenue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {txnRevenue.paymentCount} pembayaran periode ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Periode</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tanggal</Label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">Dompet</Label>
              <Select value={filterWallet} onValueChange={setFilterWallet}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {wallets.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Jenis</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="Debit">Pemasukan</SelectItem>
                  <SelectItem value="Credit">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" />Tambah Entri</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Dompet</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {format(new Date(entry.entryDate), "dd MMM yyyy", { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.type === "Debit" ? "default" : "destructive"} className="text-xs">
                          {entry.type === "Debit" ? "Masuk" : "Keluar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.category}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {entry.description}
                        {entry.customerName && <span className="text-xs text-muted-foreground ml-1">({entry.customerName})</span>}
                        {entry.employeeName && <span className="text-xs text-muted-foreground ml-1">({entry.employeeName})</span>}
                      </TableCell>
                      <TableCell className="text-sm">{entry.walletName}</TableCell>
                      <TableCell className={`text-right font-medium ${entry.type === "Debit" ? "text-green-600" : "text-red-600"}`}>
                        {entry.type === "Debit" ? "+" : "-"} Rp {entry.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        {!entry.paymentId && !entry.payrollId ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Auto</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Entri Buku Kas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
              </div>
              <div>
                <Label>Jenis</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Debit">Pemasukan (Debit)</SelectItem>
                    <SelectItem value="Credit">Pengeluaran (Credit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {(form.type === "Debit" ? CATEGORIES_DEBIT : CATEGORIES_CREDIT).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan transaksi..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Dompet</Label>
                <Select value={form.walletId} onValueChange={(v) => setForm({ ...form, walletId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(v) => { if (!v) { setEditEntry(null); setForm({ entryDate: new Date().toISOString().split("T")[0], type: "Debit", category: "", description: "", amount: "", walletId: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entri Buku Kas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal</Label>
                <Input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
              </div>
              <div>
                <Label>Jenis</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, category: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Debit">Pemasukan (Debit)</SelectItem>
                    <SelectItem value="Credit">Pengeluaran (Credit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {(form.type === "Debit" ? CATEGORIES_DEBIT : CATEGORIES_CREDIT).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan transaksi..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jumlah (Rp)</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Dompet</Label>
                <Select value={form.walletId} onValueChange={(v) => setForm({ ...form, walletId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Batal</Button>
            <Button onClick={handleEdit} disabled={loading}>{loading ? "Menyimpan..." : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Revenue Detail */}
      {txnRevenue.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rincian Pendapatan Transaksi Periode Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kode Transaksi</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tipe Bayar</TableHead>
                    <TableHead>Dompet</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txnRevenue.payments.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{format(new Date(p.paidAt), "dd MMM yyyy", { locale: localeId })}</TableCell>
                      <TableCell className="font-mono text-xs">{p.transactionCode}</TableCell>
                      <TableCell className="text-sm">{p.customerName}</TableCell>
                      <TableCell className="text-sm">{p.paymentTypeName}</TableCell>
                      <TableCell className="text-sm">{p.walletName}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">+ Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <LoadingOverlay visible={loading} />
    </div>
  );
}
