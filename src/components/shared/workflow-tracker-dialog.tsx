"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowTracker, WorkflowStep } from "./workflow-tracker";
import { LoadingOverlay } from "./loading-overlay";
import { updateItemStatus, getBonData } from "@/app/dashboard/production/actions";
import { printBon } from "@/lib/bon";
import { toast } from "sonner";

interface WorkflowTrackerDialogProps {
  transactionItem: {
    id: number;
    itemName: string;
    statusName: string;
    statusSequence: number;
  };
  allStatuses: {
    id: number;
    code: string;
    name: string;
    sequence: number;
    colorSlug: string;
  }[];
  employees?: { id: number; name: string; typeName: string }[];
}

// Status codes that require employee assignment
const REQUIRES_EMPLOYEE = ["POTONG", "JAHIT", "PERMAK"];
// Status codes that require date tracking
const REQUIRES_DATE = ["POTONG", "JAHIT", "GOSOK", "PERMAK", "DIAMBIL", "OK"];
// Status codes that need ironing type selection
const IRONING_STATUS = ["GOSOK"];

export function WorkflowTrackerDialog({ transactionItem, allStatuses, employees = [] }: WorkflowTrackerDialogProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<typeof allStatuses[0] | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  
  // Form state
  const [employeeId, setEmployeeId] = useState<string>("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [ironingType, setIroningType] = useState<string>("Internal");
  const [pickerName, setPickerName] = useState("");

  const workflowSteps: WorkflowStep[] = allStatuses.map((status) => ({
    id: status.id,
    label: status.name,
    status: status.sequence < transactionItem.statusSequence
      ? "completed"
      : status.sequence === transactionItem.statusSequence
      ? "current"
      : "pending",
    colorSlug: status.colorSlug,
  }));

  const handleStatusClick = async (statusId: number) => {
    const status = allStatuses.find((s) => s.id === statusId);
    if (!status) return;

    const needsForm = REQUIRES_EMPLOYEE.includes(status.code) || 
                      REQUIRES_DATE.includes(status.code) || 
                      IRONING_STATUS.includes(status.code) ||
                      status.code === "DIAMBIL";

    if (needsForm) {
      setSelectedStatus(status);
      setShowAssignForm(true);
      setNotes("");
      setEmployeeId("");
      setAssignDate(new Date().toISOString().slice(0, 10));
      setPickerName("");
      return;
    }

    // Direct update for statuses that don't need extra info
    await doUpdate(statusId, {});
  };

  const doUpdate = async (statusId: number, extra: Record<string, any>) => {
    setUpdating(true);
    try {
      const result = await updateItemStatus(transactionItem.id, statusId, {
        notes: notes || extra.notes,
        employeeId: extra.employeeId ? Number(extra.employeeId) : undefined,
        assignDate: extra.assignDate,
        ironingType: extra.ironingType,
        pickerName: extra.pickerName,
      });
      if (result.success) {
        toast.success("Status berhasil diupdate");
        setOpen(false);
        setShowAssignForm(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal mengupdate status");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintBon = async () => {
    setUpdating(true);
    try {
      const bonData = await getBonData(transactionItem.id);
      if (bonData) {
        printBon(bonData);
        toast.success("Bon berhasil dicetak");
      } else {
        toast.error("Data bon tidak ditemukan");
      }
    } catch (error) {
      toast.error("Gagal mencetak bon");
    } finally {
      setUpdating(false);
    }
  };

  const handleFormSubmit = async () => {
    if (!selectedStatus) return;
    
    if (REQUIRES_EMPLOYEE.includes(selectedStatus.code) && !employeeId) {
      toast.error("Pilih karyawan yang mengerjakan");
      return;
    }

    await doUpdate(selectedStatus.id, {
      employeeId,
      assignDate,
      notes,
      ironingType: IRONING_STATUS.includes(selectedStatus.code) ? ironingType : undefined,
      pickerName: selectedStatus.code === "DIAMBIL" ? pickerName : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowAssignForm(false); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Update Status">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2M9 17V9m6 8V5" />
          </svg>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-none w-fit max-w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Status Produksi - {transactionItem.itemName}</DialogTitle>
        </DialogHeader>
        
        {!showAssignForm ? (
          <>
            <div className="mt-6 inline-block min-w-full">
              <WorkflowTracker 
                steps={workflowSteps} 
                title="Progress Produksi"
                onStepClick={handleStatusClick}
                updating={updating}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Klik pada status untuk mengupdate progress
            </p>
          </>
        ) : selectedStatus && (
          <div className="space-y-4 min-w-[400px]">
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm font-medium">Update ke: <span className="text-primary">{selectedStatus.name}</span></p>
            </div>

            {REQUIRES_EMPLOYEE.includes(selectedStatus.code) && (
              <div className="space-y-2">
                <Label>Karyawan yang Mengerjakan *</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name} ({emp.typeName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {REQUIRES_DATE.includes(selectedStatus.code) && (
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
              </div>
            )}

            {IRONING_STATUS.includes(selectedStatus.code) && (
              <div className="space-y-2">
                <Label>Tipe Gosok</Label>
                <Select value={ironingType} onValueChange={setIroningType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal (di toko)</SelectItem>
                    <SelectItem value="External">External (di pasar/luar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStatus.code === "DIAMBIL" && (
              <div className="space-y-2">
                <Label>Nama Pengambil</Label>
                <Input value={pickerName} onChange={(e) => setPickerName(e.target.value)} placeholder="Nama orang yang mengambil" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Keterangan {!REQUIRES_EMPLOYEE.includes(selectedStatus.code) ? "(opsional)" : ""}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan..." rows={3} />
            </div>

            {selectedStatus.code === "PERMAK" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="font-medium text-yellow-800">Info Permak:</p>
                <p className="text-yellow-700">Biaya permak bisa diatur di halaman detail transaksi via charge tambahan.</p>
              </div>
            )}

            {selectedStatus.code === "POTONG" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Cetak Bon Potong</p>
                <p className="text-xs text-blue-700 mb-3">Cetak bon untuk tukang potong dengan ukuran pelanggan.</p>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrintBon} 
                  disabled={updating}
                  className="w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Cetak Bon
                </Button>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAssignForm(false)}>Batal</Button>
              <Button onClick={handleFormSubmit} disabled={updating}>
                {updating ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        )}

        <LoadingOverlay visible={updating} message="Mengupdate status..." />
      </DialogContent>
    </Dialog>
  );
}