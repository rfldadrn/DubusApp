"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { importRegularCustomersFromExcel } from "./actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CustomersImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: Array<{ row: number; name: string; phone?: string; reason: string }>;
    total: number;
  } | null>(null);

  const downloadTemplate = () => {
    const template = [
      ["Nama", "Nomor Telepon", "Jenis Kelamin (L/P)"],
      ["Andi Saputra", "081234567890", "L"],
      ["Siti Rahma", "082345678901", "P"],
      ["Budi Hartono", "083456789012", "L"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import Pelanggan");

    ws["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 22 }];

    XLSX.writeFile(wb, "Template_Import_Pelanggan_Reguler.xlsx");
    toast.success("Template berhasil diunduh");
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Pilih file Excel terlebih dahulu");
      return;
    }

    setLoading(true);
    setImportResult(null);

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const rows = jsonData
        .slice(1)
        .map((row) => ({
          name: String(row[0] || "").trim(),
          phoneNumber: row[1] ? String(row[1]).trim() : undefined,
          gender:
            row[2] === "L" || row[2] === "Laki-laki"
              ? ("Laki_laki" as const)
              : row[2] === "P" || row[2] === "Perempuan"
              ? ("Perempuan" as const)
              : undefined,
        }))
        .filter((r) => r.name);

      if (rows.length === 0) {
        toast.error("Tidak ada data valid di file Excel");
        return;
      }

      const result = await importRegularCustomersFromExcel(rows);
      if (result.success) {
        setImportResult({
          imported: result.imported || 0,
          duplicates: result.duplicates || [],
          total: result.total || 0,
        });

        toast.success(`${result.imported || 0} pelanggan berhasil diimport`);
        if ((result.duplicates || []).length > 0) {
          toast.warning(`${result.duplicates?.length || 0} data duplikat dilewati`);
        }
      } else {
        toast.error(result.error || "Gagal import pelanggan");
      }
    } catch (error) {
      console.error("Import regular customers error:", error);
      toast.error("Gagal memproses file Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import Pelanggan
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setImportFile(null);
            setImportResult(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Pelanggan Reguler</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Gunakan template Excel yang disediakan</p>
                <p className="text-xs text-blue-700 mt-1">Format: Nama, Nomor Telepon, Jenis Kelamin (L/P)</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Unduh Template
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">File Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="mt-1 block w-full text-sm"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            {importResult && (
              <div className="space-y-3 border rounded-md p-3">
                <div className="text-sm">
                  <p>
                    Total baris: <strong>{importResult.total}</strong>
                  </p>
                  <p className="text-green-700">
                    Berhasil diimport: <strong>{importResult.imported}</strong>
                  </p>
                  <p className="text-amber-700">
                    Duplikat dilewati: <strong>{importResult.duplicates.length}</strong>
                  </p>
                </div>

                {importResult.duplicates.length > 0 && (
                  <div className="max-h-52 overflow-auto rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Baris</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>No. Telepon</TableHead>
                          <TableHead>Alasan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.duplicates.map((d, idx) => (
                          <TableRow key={`${d.row}-${idx}`}>
                            <TableCell>{d.row}</TableCell>
                            <TableCell>{d.name}</TableCell>
                            <TableCell>{d.phone || "-"}</TableCell>
                            <TableCell>{d.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handleImport} disabled={loading || !importFile}>
              {loading ? "Mengimport..." : "Import Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
