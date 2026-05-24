import { TrackingClient } from "./tracking-client";

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Toko Jahit</h1>
          <p className="text-lg text-muted-foreground">Lacak Pesanan Anda</p>
        </div>
        <TrackingClient />
      </div>
    </div>
  );
}
