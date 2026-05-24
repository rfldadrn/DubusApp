"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { importCustomers, importEmployees, importItems } from "./actions";
import { toast } from "sonner";

function generateTemplate(type: string) {
  const templates: Record<string, { headers: string[]; sampleRows: string[][] }> = {
    customers: {
      headers: ["Nama", "Nomor Telepon", "Jenis Kelamin (L/P)", "Kode Agency (opsional)"],
      sampleRows: [
        ["Ahmad Fauzi", "081234567890", "L", ""],
        ["Siti Aminah", "081234567891", "P", ""],
        ["Budi Santoso", "081234567892", "L", "BKD"],
      ],
    },
    employees: {
      headers: ["name", "phoneNumber", "gender", "address", "employeeType"],
      sampleRows: [
        ["Pak Budi", "081234567892", "Laki-laki", "Jl. Merpati No. 10", "Tukang Jahit"],
        ["Bu Siti", "081234567893", "Perempuan", "Jl. Kenanga No. 5", "Tukang Potong"],
      ],
    },
    items: {
      headers: ["code", "name", "category", "genderTarget", "customerPrice", "employeePrice"],
      sampleRows: [
        ["KMJ", "Kemeja", "Atasan", "Pria", "150000", "50000"],
        ["CLN", "Celana", "Bawahan", "Unisex", "120000", "40000"],
      ],
    },
  };

  return templates[type];
}

async function downloadTemplate(type: string) {
  const XLSX = (await import("xlsx")).default;
  const template = generateTemplate(type);
  if (!template) return;

  const data = [template.headers, ...template.sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `template-${type}.xlsx`);
}

async function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  const XLSX = (await import("xlsx")).default;
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws);
}

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ 
    imported: number; 
    duplicates: Array<{ row: number; name: string; phone?: string; reason: string }>;
    errors: string[] 
  } | null>(null);

  const handleImport = async (type: string, file: File) => {
    setLoading(true);
    setResults(null);

    try {
      const data = await parseExcelFile(file);

      if (data.length === 0) {
        toast.error("File kosong");
        setLoading(false);
        return;
      }

      let result;
      switch (type) {
        case "customers":
          result = await importCustomers(data as any);
          break;
        case "employees":
          result = await importEmployees(data as any);
          break;
        case "items":
          result = await importItems(data as any);
          break;
        default:
          toast.error("Tipe import tidak valid");
          setLoading(false);
          return;
      }

      setResults({ 
        imported: result.imported, 
        duplicates: result.duplicates || [],
        errors: result.errors 
      });
      if (result.success) {
        toast.success(`${result.imported} data berhasil diimport`);
        if ((result.duplicates || []).length > 0) {
          toast.warning(`${result.duplicates?.length} data duplikat dilewati`);
        }
      } else {
        toast.error("Tidak ada data yang berhasil diimport");
      }
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ImportSection = ({ type, title, description }: { type: string; title: string; description: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadTemplate(type)}>
            <Download className="h-4 w-4 mr-1" /> Download Template
          </Button>
        </div>

        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Pilih file Excel (.xlsx) untuk di-import</p>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="text-sm"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(type, file);
              e.target.value = "";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground">Import data dari file Excel. Download template terlebih dahulu.</p>
      </div>

      {results && (
        <Card className={results.imported > 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-3">
              {results.imported > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{results.imported} data berhasil diimport</p>
              </div>
            </div>

            {results.duplicates.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  ⚠ {results.duplicates.length} data duplikat dilewati:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.duplicates.slice(0, 10).map((dup, idx) => (
                    <div key={idx} className="text-xs text-yellow-800">
                      <span className="font-medium">Baris {dup.row}:</span> {dup.name} 
                      {dup.phone && ` (${dup.phone})`} - {dup.reason}
                    </div>
                  ))}
                  {results.duplicates.length > 10 && (
                    <p className="text-xs text-yellow-700">... dan {results.duplicates.length - 10} duplikat lainnya</p>
                  )}
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 mb-2">{results.errors.length} error:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {results.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-xs text-red-700">- {err}</p>
                  ))}
                  {results.errors.length > 10 && (
                    <p className="text-xs text-red-700">... dan {results.errors.length - 10} error lainnya</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Pelanggan</TabsTrigger>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="items">Item Jahitan</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <ImportSection
            type="customers"
            title="Import Pelanggan Reguler"
            description="Import data pelanggan reguler (tidak terkait agency). Format: Nama, Nomor Telepon, Jenis Kelamin (L/P). Jika ingin langsung terkait agency, isi kolom Kode Agency."
          />
        </TabsContent>

        <TabsContent value="employees">
          <ImportSection
            type="employees"
            title="Import Karyawan"
            description="Import data karyawan. Kolom: name (wajib), phoneNumber, gender, address, employeeType"
          />
        </TabsContent>

        <TabsContent value="items">
          <ImportSection
            type="items"
            title="Import Item Jahitan"
            description="Import data item. Kolom: code (wajib), name (wajib), category, genderTarget, customerPrice, employeePrice"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
