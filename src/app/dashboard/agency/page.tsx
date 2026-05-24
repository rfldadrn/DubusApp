import { AgencyClient } from "./agency-client";

export default function AgencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency / Instansi</h1>
        <p className="text-muted-foreground">Kelola agency, project, dan import data pegawai</p>
      </div>
      <AgencyClient />
    </div>
  );
}
