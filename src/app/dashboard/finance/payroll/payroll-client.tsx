"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, History, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { getEmployeesWithUnpaid, createPayroll, getPayrollHistory, createEmployeeLoan, getEmployeeLoans } from "./actions";
import { getWallets } from "../cashbook/actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type UnpaidLog = {
  id: number;
  transactionCode: string;
  customerName: string;
  itemName: string;
  role: string;
  upah: number;
  createdAt: string;
};

type EmployeeData = {
  id: number;
  name: string;
  phoneNumber: string | null;
  employeeType: string;
  unpaidLogs: UnpaidLog[];
  totalUnpaid: number;
  totalItems: number;
};

export function PayrollClient() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Payroll dialog
  const [payDialog, setPayDialog] = useState<EmployeeData | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [deductions, setDeductions] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payWallet, setPayWallet] = useState("");

  // Loan dialog
  const [loanDialog, setLoanDialog] = useState<{ id: number; name: string } | null>(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDesc, setLoanDesc] = useState("");
  const [loanWallet, setLoanWallet] = useState("");
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, walletsData, historyData] = await Promise.all([
        getEmployeesWithUnpaid(),
        getWallets(),
        getPayrollHistory(),
      ]);
      setEmployees(empData);
      setWallets(walletsData as any);
      setHistory(historyData);
    } catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  const openPayDialog = (emp: EmployeeData) => {
    setPayDialog(emp);
    setSelectedLogs(emp.unpaidLogs.map((l) => l.id));
    setDeductions("");
    setPayNotes("");
    setPayWallet("");
  };

  const openLoanDialog = async (emp: { id: number; name: string }) => {
    setLoanDialog(emp);
    setLoanAmount("");
    setLoanDesc("");
    setLoanWallet("");
    const l = await getEmployeeLoans(emp.id);
    setLoans(l);
  };

  const handlePay = async () => {
    if (!payDialog || selectedLogs.length === 0 || !payWallet) {
      toast.error("Pilih item dan dompet");
      return;
    }
    setLoading(true);
    try {
      const result = await createPayroll({
        employeeId: payDialog.id,
        workerLogIds: selectedLogs,
        deductions: parseFloat(deductions) || 0,
        notes: payNotes,
        walletId: parseInt(payWallet),
      });
      if (result.success) {
        toast.success("Gaji berhasil dibayarkan");
        setPayDialog(null);
        loadData();
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleLoan = async () => {
    if (!loanDialog || !loanAmount || !loanWallet) {
      toast.error("Lengkapi data pinjaman");
      return;
    }
    setLoading(true);
    try {
      const result = await createEmployeeLoan({
        employeeId: loanDialog.id,
        amount: parseFloat(loanAmount),
        description: loanDesc || "Pinjaman",
        walletId: parseInt(loanWallet),
      });
      if (result.success) {
        toast.success("Pinjaman dicatat");
        setLoanDialog(null);
        loadData();
      } else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const toggleLog = (id: number) => {
    setSelectedLogs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedTotal = payDialog
    ? payDialog.unpaidLogs.filter((l) => selectedLogs.includes(l.id)).reduce((sum, l) => sum + l.upah, 0)
    : 0;
  const netPay = selectedTotal - (parseFloat(deductions) || 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid"><Users className="h-4 w-4 mr-2" />Belum Dibayar</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Riwayat Gaji</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="space-y-4 mt-4">
          {employees.filter((e) => e.totalItems > 0).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Semua karyawan sudah dibayar</CardContent></Card>
          ) : (
            employees.filter((e) => e.totalItems > 0).map((emp) => (
              <Card key={emp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{emp.name}</CardTitle>
                      <CardDescription>{emp.employeeType} • {emp.totalItems} item belum dibayar</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openLoanDialog(emp)}>
                        <HandCoins className="h-4 w-4 mr-1" />Pinjaman
                      </Button>
                      <Button size="sm" onClick={() => openPayDialog(emp)}>
                        <DollarSign className="h-4 w-4 mr-1" />Bayar Rp {emp.totalUnpaid.toLocaleString("id-ID")}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaksi</TableHead>
                          <TableHead>Pelanggan</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Upah</TableHead>
                          <TableHead>Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emp.unpaidLogs.slice(0, 5).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">{log.transactionCode}</TableCell>
                            <TableCell className="text-sm">{log.customerName}</TableCell>
                            <TableCell className="text-sm">{log.itemName}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{log.role}</Badge></TableCell>
                            <TableCell className="text-right">Rp {log.upah.toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "dd/MM/yy")}</TableCell>
                          </TableRow>
                        ))}
                        {emp.unpaidLogs.length > 5 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">+{emp.unpaidLogs.length - 5} item lainnya</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Dibayar</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
                    ) : (
                      history.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.employeeName}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(p.periodStart), "dd/MM")} - {format(new Date(p.periodEnd), "dd/MM/yy")}
                          </TableCell>
                          <TableCell>{p.totalItems}</TableCell>
                          <TableCell className="text-right font-medium">Rp {p.totalAmount.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-sm">{format(new Date(p.paidAt), "dd MMM yy", { locale: localeId })}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.notes || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pay Dialog */}
      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bayar Gaji - {payDialog?.name}</DialogTitle>
          </DialogHeader>
          {payDialog && (
            <div className="space-y-4 py-4">
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input type="checkbox" checked={selectedLogs.length === payDialog.unpaidLogs.length}
                          onChange={(e) => setSelectedLogs(e.target.checked ? payDialog.unpaidLogs.map((l) => l.id) : [])} />
                      </TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Upah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payDialog.unpaidLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <input type="checkbox" checked={selectedLogs.includes(log.id)} onChange={() => toggleLog(log.id)} />
                        </TableCell>
                        <TableCell className="text-sm">{log.itemName} <span className="text-xs text-muted-foreground">({log.transactionCode})</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{log.role}</Badge></TableCell>
                        <TableCell className="text-right">Rp {log.upah.toLocaleString("id-ID")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Potongan (Kasbon/Pinjaman)</Label>
                  <Input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Dompet Pembayaran</Label>
                  <Select value={payWallet} onValueChange={setPayWallet}>
                    <SelectTrigger><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Catatan opsional..." />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-1">
                <div className="flex justify-between text-sm"><span>Total Upah ({selectedLogs.length} item)</span><span>Rp {selectedTotal.toLocaleString("id-ID")}</span></div>
                {parseFloat(deductions) > 0 && <div className="flex justify-between text-sm text-red-600"><span>Potongan</span><span>-Rp {parseFloat(deductions).toLocaleString("id-ID")}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Dibayarkan</span><span>Rp {netPay.toLocaleString("id-ID")}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Batal</Button>
            <Button onClick={handlePay} disabled={loading || selectedLogs.length === 0 || netPay <= 0}>
              {loading ? "Memproses..." : "Bayar Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={!!loanDialog} onOpenChange={(v) => !v && setLoanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pinjaman - {loanDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loans.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Riwayat Pinjaman</Label>
                <div className="mt-2 max-h-[150px] overflow-y-auto space-y-1">
                  {loans.map((l) => (
                    <div key={l.id} className="flex justify-between text-sm p-2 border rounded">
                      <span>{l.description} <span className="text-xs text-muted-foreground">({format(new Date(l.entryDate), "dd/MM/yy")})</span></span>
                      <span className="font-medium">Rp {l.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right text-sm font-medium mt-2">
                  Total: Rp {loans.reduce((s, l) => s + l.amount, 0).toLocaleString("id-ID")}
                </div>
              </div>
            )}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Catat Pinjaman Baru</p>
              <div>
                <Label>Jumlah</Label>
                <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Keterangan</Label>
                <Input value={loanDesc} onChange={(e) => setLoanDesc(e.target.value)} placeholder="Kasbon / pinjaman..." />
              </div>
              <div>
                <Label>Dompet</Label>
                <Select value={loanWallet} onValueChange={setLoanWallet}>
                  <SelectTrigger><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoanDialog(null)}>Tutup</Button>
            <Button onClick={handleLoan} disabled={loading || !loanAmount || !loanWallet}>
              {loading ? "Menyimpan..." : "Catat Pinjaman"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay visible={loading} />
    </div>
  );
}
