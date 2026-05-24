"use client";

import { useMemo, useState } from "react";
import { DataTable, Column, FilterOption } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { WorkflowTrackerDialog } from "@/components/shared/workflow-tracker-dialog";
import { ProductionHistoryDialog } from "@/components/shared/production-history-dialog";
import { bulkAssignWorkerByCurrentStatus, bulkUpdateItemStatus } from "./actions";
import { toast } from "sonner";

interface ProductionRow {
  id: number;
  transactionCode: string;
  customerName: string;
  agencyName: string;
  transactionId: number;
  itemName: string;
  statusName: string;
  statusCode: string;
  statusSequence: number;
  statusColorSlug: string;
  targetDate: string | null;
  assignedTailorName: string | null;
  progress: number;
}

interface StatusInfo {
  id: number;
  code: string;
  name: string;
  sequence: number;
  colorSlug: string;
}

export function ProductionTable({ data, allStatuses, employees = [], agencies = [] }: { data: ProductionRow[]; allStatuses: StatusInfo[]; employees?: { id: number; name: string; typeName: string }[]; agencies?: string[] }) {
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStatusId, setBulkStatusId] = useState<string>("");
  const [bulkEmployeeId, setBulkEmployeeId] = useState<string>("");

  const selectedRows = useMemo(
    () => data.filter((row) => selectedItemIds.includes(row.id)),
    [data, selectedItemIds]
  );
  const selectedCurrentStatusCode = selectedRows[0]?.statusCode || null;
  const selectedCurrentStatusName = selectedRows[0]?.statusName || null;
  const isSameCurrentStatus =
    selectedRows.length > 0 &&
    selectedRows.every((row) => row.statusCode === selectedCurrentStatusCode);
  const canBulkAssignWorker =
    isSameCurrentStatus &&
    ["POTONG", "JAHIT", "PERMAK"].includes(selectedCurrentStatusCode || "");
  const selectedBulkStatus = allStatuses.find((s) => s.id === Number(bulkStatusId));

  const selectedCount = selectedItemIds.length;

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedItemIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((itemId) => itemId !== id);
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedItemIds(checked ? data.map((row) => row.id) : []);
  };

  const handleBulkStatus = async (statusId: number, statusLabel: string) => {
    if (selectedItemIds.length === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }

    if (!isSameCurrentStatus) {
      toast.error("Bulk status hanya bisa untuk item dengan status saat ini yang sama");
      return;
    }

    const targetStatus = allStatuses.find((s) => s.id === statusId);
    if (!targetStatus) {
      toast.error("Status tujuan tidak valid");
      return;
    }

    const needsEmployee = ["POTONG", "JAHIT", "PERMAK"].includes(targetStatus.code);
    if (needsEmployee && !bulkEmployeeId) {
      toast.error(`Status ${targetStatus.name} wajib pilih karyawan`);
      return;
    }

    setBulkLoading(true);
    try {
      const result = await bulkUpdateItemStatus(selectedItemIds, statusId, {
        notes: `Bulk update ke ${statusLabel}`,
        employeeId: needsEmployee ? Number(bulkEmployeeId) : undefined,
        ironingType: targetStatus.code === "GOSOK" ? "Internal" : undefined,
        pickerName: targetStatus.code === "DIAMBIL" ? "Bulk update" : undefined,
      });

      if (result.success) {
        toast.success(result.message || "Berhasil bulk update");
        setSelectedItemIds([]);
        setBulkStatusId("");
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal bulk update");
      }
    } catch {
      toast.error("Terjadi kesalahan saat bulk update");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAssignWorker = async () => {
    if (selectedItemIds.length === 0) {
      toast.error("Pilih minimal 1 item");
      return;
    }

    if (!isSameCurrentStatus) {
      toast.error("Bulk assign hanya bisa untuk item dengan status saat ini yang sama");
      return;
    }

    if (!canBulkAssignWorker) {
      toast.error("Bulk assign tukang hanya valid untuk status Potong/Jahit/Permak");
      return;
    }

    if (!bulkEmployeeId) {
      toast.error("Pilih karyawan terlebih dahulu");
      return;
    }

    setBulkLoading(true);
    try {
      const result = await bulkAssignWorkerByCurrentStatus(
        selectedItemIds,
        Number(bulkEmployeeId),
        `Bulk assign untuk status ${selectedCurrentStatusName}`
      );

      if (result.success) {
        toast.success(result.message || "Berhasil bulk assign tukang");
        setSelectedItemIds([]);
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal bulk assign tukang");
      }
    } catch {
      toast.error("Terjadi kesalahan saat bulk assign tukang");
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: Column<ProductionRow>[] = [
    {
      key: "select",
      label: "",
      sortable: false,
      searchable: false,
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedItemIds.includes(row.id)}
          onChange={(e) => toggleRow(row.id, e.target.checked)}
          className="h-4 w-4 rounded"
        />
      ),
    },
    {
      key: "transactionCode",
      label: "Kode",
      render: (row) => <span className="font-mono text-sm">{row.transactionCode}</span>,
    },
    {
      key: "customerName",
      label: "Pelanggan",
      render: (row) => <span className="font-medium">{row.customerName}</span>,
    },
    {
      key: "agencyName",
      label: "Agency",
      render: (row) => <span>{row.agencyName}</span>,
    },
    {
      key: "itemName",
      label: "Item",
    },
    {
      key: "statusName",
      label: "Status",
      render: (row) => (
        <Badge style={{ backgroundColor: row.statusColorSlug || "#gray", color: "white" }}>
          {row.statusName}
        </Badge>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${row.progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{row.progress}%</span>
        </div>
      ),
    },
    {
      key: "assignedTailorName",
      label: "Penjahit",
      render: (row) => row.assignedTailorName || <span className="text-muted-foreground">-</span>,
    },
    {
      key: "targetDate",
      label: "Deadline",
      render: (row) => {
        if (!row.targetDate) return "-";
        const isUrgent = differenceInDays(new Date(row.targetDate), new Date()) < 3 && row.statusName !== "Selesai";
        return (
          <span className={isUrgent ? "text-red-600 font-medium" : ""}>
            {format(new Date(row.targetDate), "dd MMM yyyy", { locale: id })}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Aksi",
      sortable: false,
      searchable: false,
      render: (row) => {
        const workflowDialogItem = {
          id: row.id,
          itemName: row.itemName,
          statusName: row.statusName,
          statusSequence: row.statusSequence,
        };
        const mappedStatuses = allStatuses.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          sequence: s.sequence,
          colorSlug: s.colorSlug || "#gray",
        }));
        return (
          <div className="flex items-center justify-end gap-1">
            <ProductionHistoryDialog transactionItemId={row.id} itemName={row.itemName} employees={employees} />
            <WorkflowTrackerDialog transactionItem={workflowDialogItem} allStatuses={mappedStatuses} employees={employees} />
            <Link href={`/dashboard/transactions/${row.transactionId}`}>
              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
            </Link>
          </div>
        );
      },
    },
  ];

  const filters: FilterOption[] = [
    {
      key: "statusName",
      label: "Status",
      options: allStatuses.map((s) => ({ value: s.name, label: s.name })),
    },
    {
      key: "agencyName",
      label: "Agency",
      options: agencies.map((agency) => ({ value: agency, label: agency })),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 pr-2 border-r">
          <input
            type="checkbox"
            checked={data.length > 0 && selectedCount === data.length}
            onChange={(e) => toggleAll(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <span className="text-sm text-muted-foreground">{selectedCount} dipilih</span>
        </div>

        <Select value={bulkStatusId} onValueChange={setBulkStatusId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Pilih status tujuan" />
          </SelectTrigger>
          <SelectContent>
            {allStatuses.map((status) => (
              <SelectItem key={status.id} value={String(status.id)}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bulkEmployeeId} onValueChange={setBulkEmployeeId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Pilih tukang (opsional/required)" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.name} ({emp.typeName})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          disabled={!bulkStatusId || selectedCount === 0 || bulkLoading}
          onClick={() => selectedBulkStatus && handleBulkStatus(selectedBulkStatus.id, selectedBulkStatus.name)}
        >
          Bulk Update Status
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={!canBulkAssignWorker || !bulkEmployeeId || selectedCount === 0 || bulkLoading}
          onClick={handleBulkAssignWorker}
        >
          Bulk Assign Tukang
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {selectedCount === 0 && "Pilih item dulu untuk bulk action."}
        {selectedCount > 0 && !isSameCurrentStatus && "Bulk action hanya valid jika semua item terpilih punya status saat ini yang sama."}
        {selectedCount > 0 && isSameCurrentStatus && `Status terpilih: ${selectedCurrentStatusName}.`}
      </div>

      <DataTable
        data={data}
        columns={columns}
        filters={filters}
        rowKey={(row) => row.id}
        emptyMessage="Belum ada item produksi."
      />
    </div>
  );
}
