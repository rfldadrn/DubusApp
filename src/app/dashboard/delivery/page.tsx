import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryClient } from "./delivery-client";
import { getDeliveryProjects, getDeliveryHistory } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  const [projects, history] = await Promise.all([getDeliveryProjects(), getDeliveryHistory()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengantaran Batch</h1>
        <p className="text-muted-foreground">Kirim pakaian agency per project/batch dan pantau riwayat pengiriman</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengantaran</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryClient initialProjects={projects} initialHistory={history} />
        </CardContent>
      </Card>
    </div>
  );
}
