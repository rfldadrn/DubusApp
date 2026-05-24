"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, RefreshCw, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getProductionLogs, reassignWorker } from "@/app/dashboard/production/actions";
import { toast } from "sonner";
import { LoadingOverlay } from "./loading-overlay";

interface ProductionHistoryDialogProps {
  transactionItemId: number;
  itemName: string;
  employees: { id: number; name: string; typeName: string }[];
}

type LogData = Awaited<ReturnType<typeof getProductionLogs>>;

export function ProductionHistoryDialog({ transactionItemId, itemName, employees }: ProductionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [data, setData] = useState<LogData | null>(null);
  const [editingWorkerLogId, setEditingWorkerLogId] = useState<number | null>(null);
  const [newEmployeeId, setNewEmployeeId] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await getProductionLogs(transactionItemId);
      setData(result);
    } catch {
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadLogs();
  };

  const handleReassign = async (workerLogId: number) => {
    if (!newEmployeeId) {
      toast.error("Pilih karyawan pengganti");
      return;
    }
    setReassigning(true);
    try {
      const result = await reassignWorker(workerLogId, Number(newEmployeeId), transactionItemId);
      if (result.success) {
        toast.success("Berhasil dipindah tangankan");
        setEditingWorkerLogId(null);
        setNewEmployeeId("");
        await loadLogs();
      } else {
        toast.error(result.error || "Gagal");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setReassigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Riwayat Produksi">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Produksi - {itemName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Memuat data...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Worker Assignments */}
            {data.workerLogs.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Penugasan Karyawan</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Upah</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.workerLogs.map((wl) => (
                      <TableRow key={wl.id}>
                        <TableCell className="font-medium">
                          {editingWorkerLogId === wl.id ? (
                            <div className="flex gap-2 items-center">
                              <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Pilih pengganti" />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees.filter(e => e.id !== wl.employeeId).map((emp) => (
                                    <SelectItem key={emp.id} value={String(emp.id)}>
                                      {emp.name} ({emp.typeName})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleReassign(wl.id)} disabled={reassigning}>
                                OK
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingWorkerLogId(null)}>
                                ✕
                              </Button>
                            </div>
                          ) : (
                            wl.employeeName
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {wl.role === "Cutter" ? "Potong" : wl.role === "Tailor" ? "Jahit" : wl.role}
                          </Badge>
                        </TableCell>
                        <TableCell>Rp {wl.upah.toLocaleString("id-ID")}</TableCell>
                        <TableCell>{format(new Date(wl.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}</TableCell>
                        <TableCell>
                          <Badge variant={wl.isPaid ? "default" : "secondary"}>
                            {wl.isPaid ? "Sudah Dibayar" : "Belum Dibayar"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingWorkerLogId !== wl.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Pindah tangankan"
                              onClick={() => {
                                setEditingWorkerLogId(wl.id);
                                setNewEmployeeId("");
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Ironing Log */}
            {data.ironingLog && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Log Gosok</h4>
                <div className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipe:</span>
                    <span className="font-medium">{data.ironingLog.ironingType === "Internal" ? "Internal (di toko)" : "External (luar)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dikirim:</span>
                    <span>{format(new Date(data.ironingLog.sentAt), "dd MMM yyyy, HH:mm", { locale: localeId })}</span>
                  </div>
                  {data.ironingLog.returnedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kembali:</span>
                      <span>{format(new Date(data.ironingLog.returnedAt), "dd MMM yyyy, HH:mm", { locale: localeId })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ditangani:</span>
                    <span>{data.ironingLog.handledBy}</span>
                  </div>
                  {data.ironingLog.notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catatan:</span>
                      <span>{data.ironingLog.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Production Status Logs */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">Riwayat Perubahan Status</h4>
              {data.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada riwayat</p>
              ) : (
                <div className="space-y-2">
                  {data.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 border rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 flex-1">
                        <Badge variant="outline" className="text-xs">{log.fromStatus}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge className="text-xs">{log.toStatus}</Badge>
                      </div>
                      <div className="flex-1 space-y-1">
                        {log.workerName && (
                          <div className="text-xs font-medium text-blue-600">
                            👤 Tukang: {log.workerName}
                          </div>
                        )}
                        {log.notes && <span className="text-muted-foreground text-xs">{log.notes}</span>}
                      </div>
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <div>{log.updatedBy}</div>
                        <div>{format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: localeId })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <LoadingOverlay visible={reassigning} message="Memproses..." />
      </DialogContent>
    </Dialog>
  );
}
