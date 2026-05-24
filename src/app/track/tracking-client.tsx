"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CheckCircle2, Loader2 } from "lucide-react";
import { trackOrder, TrackingResult } from "./actions";
import { getStatusColor } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function TrackingClient() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);

  const handleTrack = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const r = await trackOrder(code);
      setResult(r);
    } catch {
      setResult({ found: false, error: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Masukkan kode transaksi (contoh: TRX-202605-0001 atau PRJ001-0001)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                className="pl-9 text-lg"
              />
            </div>
            <Button onClick={handleTrack} disabled={loading} size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lacak"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {result && !result.found && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{result.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result?.found && result.transaction && (
        <div className="space-y-4">
          {/* Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {result.transaction.transactionCode}
                </span>
                <Badge className={getStatusColor(result.transaction.statusColor)}>
                  {result.transaction.statusName}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{result.transaction.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Order</p>
                  <p className="font-medium">{result.transaction.transactionDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">Rp {result.transaction.totalAmount.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pembayaran</p>
                  <Badge variant="outline">
                    {result.transaction.paymentStatusLabel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Status */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Item ({result.transaction.items.length} pakaian)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.transaction.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.itemName}</span>
                    <Badge className={getStatusColor(item.statusColor)}>{item.statusName}</Badge>
                  </div>

                  {/* Show only actual completed steps from production log */}
                  {item.completedSteps.length > 0 ? (
                    <div className="space-y-2">
                      {item.completedSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="font-medium">{step.statusName}</span>
                          <span className="text-muted-foreground text-xs ml-auto">
                            {format(new Date(step.date), "dd MMM yyyy, HH:mm", { locale: localeId })}
                          </span>
                        </div>
                      ))}
                      {/* Current status indicator */}
                      <div className="flex items-center gap-3 text-sm border-t pt-2 mt-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary animate-pulse shrink-0" />
                        <span className="font-bold text-primary">{item.statusName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Saat ini</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-4 w-4 rounded-full border-2 border-primary animate-pulse shrink-0" />
                      <span className="font-bold text-primary">{item.statusName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">Dalam proses</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      {!result && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p>Masukkan kode transaksi yang Anda terima saat pemesanan untuk melacak status pesanan Anda.</p>
            <p className="mt-2">Hanya pesanan yang masih dalam proses yang akan ditampilkan.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
