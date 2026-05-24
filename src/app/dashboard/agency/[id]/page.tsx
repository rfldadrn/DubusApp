import { notFound } from "next/navigation";
import { getAgencyDetail } from "./actions";
import { AgencyDetailClient } from "./agency-detail-client";

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agency = await getAgencyDetail(Number(id));

  if (!agency) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{agency.name}</h1>
        <p className="text-muted-foreground">
          {agency.agencyCode} • {agency.customers.length} Pegawai • {agency.projects.length} Project
        </p>
      </div>
      <AgencyDetailClient agency={agency} />
    </div>
  );
}
