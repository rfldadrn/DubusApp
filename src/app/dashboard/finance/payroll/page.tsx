import { PayrollClient } from "./payroll-client";

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Penggajian</h1>
        <p className="text-muted-foreground">Kelola gaji karyawan berdasarkan tasks yang dikerjakan</p>
      </div>
      <PayrollClient />
    </div>
  );
}
