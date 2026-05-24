"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, FolderKanban, Pencil, Trash2, Upload, Download, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getAgencies, createAgency, updateAgency, deleteAgency, createProject, importAgencyCustomersFromExcel } from "./actions";
import { LoadingOverlay } from "@/components/shared/loading-overlay";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import Link from "next/link";

type AgencyData = {
  id: number;
  agencyCode: string;
  name: string;
  description: string | null;
  projectCount: number;
  customerCount: number;
  projects: any[];
};

export function AgencyClient() {
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [agencyDialog, setAgencyDialog] = useState<{ mode: "create" | "edit"; data?: any } | null>(null);
  const [projectDialog, setProjectDialog] = useState<{ agencyId: number; agencyName: string } | null>(null);
  const [importDialog, setImportDialog] = useState<{ agencyId: number; agencyName: string } | null>(null);

  // Forms
  const [agencyForm, setAgencyForm] = useState({ agencyCode: "", name: "", description: "" });
  const [projectForm, setProjectForm] = useState({ projectCode: "", name: "", description: "", picName: "", picPhone: "", startDate: "", targetDate: "" });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: Array<{ row: number; name: string; phone?: string; reason: string }>;
    total: number;
  } | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setAgencies(await getAgencies()); }
    catch { toast.error("Gagal memuat data"); }
    finally { setLoading(false); }
  };

  const openCreateAgency = () => {
    setAgencyForm({ agencyCode: "", name: "", description: "" });
    setAgencyDialog({ mode: "create" });
  };

  const openEditAgency = (agency: AgencyData) => {
    setAgencyForm({ agencyCode: agency.agencyCode, name: agency.name, description: agency.description || "" });
    setAgencyDialog({ mode: "edit", data: agency });
  };

  const handleSaveAgency = async () => {
    if (!agencyForm.agencyCode || !agencyForm.name) { toast.error("Kode dan nama wajib diisi"); return; }
    setLoading(true);
    try {
      const result = agencyDialog?.mode === "edit"
        ? await updateAgency(agencyDialog.data.id, agencyForm)
        : await createAgency(agencyForm);
      if (result.success) { toast.success("Berhasil"); setAgencyDialog(null); loadData(); }
      else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleDeleteAgency = async (id: number, name: string) => {
    if (!confirm(`Hapus agency "${name}"?`)) return;
    setLoading(true);
    try {
      const result = await deleteAgency(id);
      if (result.success) { toast.success("Agency dihapus"); loadData(); }
      else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const openProjectDialog = (agencyId: number, agencyName: string) => {
    setProjectForm({ projectCode: "", name: "", description: "", picName: "", picPhone: "", startDate: "", targetDate: "" });
    setProjectDialog({ agencyId, agencyName });
  };

  const handleCreateProject = async () => {
    if (!projectDialog || !projectForm.projectCode || !projectForm.name) { toast.error("Kode dan nama wajib diisi"); return; }
    setLoading(true);
    try {
      const result = await createProject({ agencyId: projectDialog.agencyId, ...projectForm });
      if (result.success) { toast.success("Project dibuat"); setProjectDialog(null); loadData(); }
      else { toast.error(result.error!); }
    } catch { toast.error("Gagal"); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    if (!importDialog || !importFile) { toast.error("Pilih file Excel"); return; }
    setLoading(true);
    setImportResult(null);
    
    try {
      // Read Excel file
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row, parse data
      const rows = jsonData.slice(1).map((row) => ({
        name: String(row[0] || "").trim(),
        phoneNumber: row[1] ? String(row[1]).trim() : undefined,
        gender: row[2] === "L" || row[2] === "Laki-laki" ? "Laki_laki" as const 
              : row[2] === "P" || row[2] === "Perempuan" ? "Perempuan" as const 
              : undefined,
      })).filter((r) => r.name);

      if (rows.length === 0) {
        toast.error("Tidak ada data valid di file Excel");
        setLoading(false);
        return;
      }

      const result = await importAgencyCustomersFromExcel(importDialog.agencyId, rows);
      if (result.success) {
        setImportResult({
          imported: result.imported || 0,
          duplicates: result.duplicates || [],
          total: result.total || 0,
        });
        toast.success(`${result.imported} data berhasil diimport`);
        if ((result.duplicates || []).length > 0) {
          toast.warning(`${result.duplicates?.length} data duplikat dilewati`);
        }
        loadData();
      } else {
        toast.error(result.error!);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Gagal memproses file Excel");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ["Nama", "Nomor Telepon", "Jenis Kelamin (L/P)"],
      ["Ahmad Fauzi", "081234567890", "L"],
      ["Siti Aisyah", "082345678901", "P"],
      ["Budi Santoso", "083456789012", "L"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Import Pegawai");
    
    // Set column widths
    ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }];
    
    XLSX.writeFile(wb, "Template_Import_Pegawai_Agency.xlsx");
    toast.success("Template berhasil diunduh");
  };

  const statusColor: Record<string, string> = {
    Active: "bg-green-100 text-green-800",
    Negotiation: "bg-yellow-100 text-yellow-800",
    Completed: "bg-blue-100 text-blue-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreateAgency}><Plus className="h-4 w-4 mr-2" />Agency Baru</Button>
      </div>

      {agencies.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada agency</CardContent></Card>
      ) : (
        agencies.map((agency) => (
          <Card key={agency.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {agency.name}
                    <Badge variant="outline">{agency.agencyCode}</Badge>
                  </CardTitle>
                  <CardDescription>{agency.description || "Tidak ada deskripsi"} • {agency.customerCount} pegawai • {agency.projectCount} project</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/agency/${agency.id}`}>
                    <Button size="sm" className="mr-1">
                      <ExternalLink className="h-4 w-4 mr-1" />Detail & Ukur
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setImportDialog({ agencyId: agency.id, agencyName: agency.name })}>
                    <Upload className="h-4 w-4 mr-1" />Import Pegawai
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openProjectDialog(agency.id, agency.name)}>
                    <FolderKanban className="h-4 w-4 mr-1" />Project Baru
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditAgency(agency)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteAgency(agency.id, agency.name)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            {agency.projects.length > 0 && (
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Project</TableHead>
                        <TableHead>PIC</TableHead>
                        <TableHead>Mulai</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agency.projects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.projectCode}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-sm">{p.picName || "-"}</TableCell>
                          <TableCell className="text-sm">{p.startDate ? format(new Date(p.startDate), "dd/MM/yy") : "-"}</TableCell>
                          <TableCell className="text-sm">{p.targetDate ? format(new Date(p.targetDate), "dd/MM/yy") : "-"}</TableCell>
                          <TableCell><Badge className={`text-xs ${statusColor[p.contractStatus] || ""}`}>{p.contractStatus}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))
      )}

      {/* Agency Dialog */}
      <Dialog open={!!agencyDialog} onOpenChange={(v) => !v && setAgencyDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{agencyDialog?.mode === "edit" ? "Edit" : "Tambah"} Agency</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kode Agency</Label><Input value={agencyForm.agencyCode} onChange={(e) => setAgencyForm({ ...agencyForm, agencyCode: e.target.value })} placeholder="AGC001" /></div>
              <div><Label>Nama</Label><Input value={agencyForm.name} onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })} placeholder="Nama instansi" /></div>
            </div>
            <div><Label>Deskripsi</Label><Input value={agencyForm.description} onChange={(e) => setAgencyForm({ ...agencyForm, description: e.target.value })} placeholder="Opsional" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgencyDialog(null)}>Batal</Button>
            <Button onClick={handleSaveAgency} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={!!projectDialog} onOpenChange={(v) => !v && setProjectDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Project Baru - {projectDialog?.agencyName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Kode Project</Label><Input value={projectForm.projectCode} onChange={(e) => setProjectForm({ ...projectForm, projectCode: e.target.value })} /></div>
              <div><Label>Nama Project</Label><Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></div>
            </div>
            <div><Label>Deskripsi</Label><Input value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama PIC</Label><Input value={projectForm.picName} onChange={(e) => setProjectForm({ ...projectForm, picName: e.target.value })} /></div>
              <div><Label>Telp PIC</Label><Input value={projectForm.picPhone} onChange={(e) => setProjectForm({ ...projectForm, picPhone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Tanggal Mulai</Label><Input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} /></div>
              <div><Label>Target Selesai</Label><Input type="date" value={projectForm.targetDate} onChange={(e) => setProjectForm({ ...projectForm, targetDate: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialog(null)}>Batal</Button>
            <Button onClick={handleCreateProject} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={!!importDialog} onOpenChange={(v) => {
        if (!v) {
          setImportDialog(null);
          setImportFile(null);
          setImportResult(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Import Pegawai - {importDialog?.agencyName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Unduh template Excel terlebih dahulu</p>
                <p className="text-xs text-blue-700 mt-1">Format: Nama, Nomor Telepon, Jenis Kelamin (L/P)</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Unduh Template
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <Label>Upload File Excel (.xlsx, .xls)</Label>
              <Input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-900">
                    ✓ {importResult.imported} dari {importResult.total} data berhasil diimport
                  </p>
                </div>

                {importResult.duplicates.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-900 mb-2">
                      ⚠ {importResult.duplicates.length} data duplikat dilewati:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.duplicates.map((dup, idx) => (
                        <div key={idx} className="text-xs text-yellow-800">
                          <span className="font-medium">Baris {dup.row}:</span> {dup.name} 
                          {dup.phone && ` (${dup.phone})`} - {dup.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialog(null);
              setImportFile(null);
              setImportResult(null);
            }}>
              {importResult ? "Tutup" : "Batal"}
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={loading || !importFile}>
                {loading ? "Mengimport..." : "Import"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay visible={loading} />
    </div>
  );
}
