import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerCreateForm } from "./customer-create-form";

export default function CustomerCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Pelanggan Baru</h1>
        <p className="text-muted-foreground">Formulir pendaftaran pelanggan baru</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Form Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
