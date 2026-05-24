"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2, Clock } from "lucide-react";
import { getEmployeeTasks, getEmployeeList } from "./actions";
import { format } from "date-fns";

type TaskRow = {
  id: number;
  employeeId: number;
  employeeName: string;
  transactionCode: string;
  customerName: string;
  itemName: string;
  role: string;
  upah: number;
  isPaid: boolean;
  payrollId: number | null;
  createdAt: string;
};

export function TasksClient() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getEmployeeList().then(setEmployees);
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = { search };
      if (filterEmployee !== "all") filters.employeeId = parseInt(filterEmployee);
      if (filterPaid !== "all") filters.isPaid = filterPaid === "paid";
      const data = await getEmployeeTasks(filters);
      setTasks(data);
    } catch {}
    finally { setLoading(false); }
  }, [filterEmployee, filterPaid, search]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Summary
  const totalTasks = tasks.length;
  const paidTasks = tasks.filter((t) => t.isPaid).length;
  const unpaidTasks = totalTasks - paidTasks;
  const totalUnpaidAmount = tasks.filter((t) => !t.isPaid).reduce((s, t) => s + t.upah, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{paidTasks}</div>
            <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{unpaidTasks}</div>
            <p className="text-sm text-muted-foreground">Belum Dibayar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">Rp {totalUnpaidAmount.toLocaleString("id-ID")}</div>
            <p className="text-sm text-muted-foreground">Total Belum Dibayar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Karyawan</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Karyawan</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status Bayar</Label>
              <Select value={filterPaid} onValueChange={setFilterPaid}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="paid">Sudah Dibayar</SelectItem>
                  <SelectItem value="unpaid">Belum Dibayar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Cari transaksi, pelanggan, item..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
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
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Transaksi</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Upah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{loading ? "Memuat..." : "Tidak ada data"}</TableCell></TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.employeeName}</TableCell>
                      <TableCell className="font-mono text-xs">{task.transactionCode}</TableCell>
                      <TableCell className="text-sm">{task.customerName}</TableCell>
                      <TableCell className="text-sm">{task.itemName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{task.role}</Badge></TableCell>
                      <TableCell className="text-right">Rp {task.upah.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        {task.isPaid ? (
                          <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Dibayar</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(task.createdAt), "dd/MM/yy")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
