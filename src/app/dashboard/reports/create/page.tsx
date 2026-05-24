import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReportCreatePage() {
  // TODO: Implement report creation form
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Laporan</h1>
        <p className="text-muted-foreground">Formulir pembuatan laporan baru</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: Add report form fields here */}
          <div className="text-center py-12 text-muted-foreground">
            <p>Form laporan akan diimplementasikan di sini.</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Link href="/dashboard/reports">
          <Button variant="outline">Kembali</Button>
        </Link>
        <Button className="ml-2" disabled>Simpan</Button>
      </div>
    </div>
  );
}
