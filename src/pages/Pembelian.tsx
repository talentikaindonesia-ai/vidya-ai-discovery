import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { bacaPembelian, cekPembayaran, LABEL_SUMBER, STATUS_ORDER, type DataPembelian } from "@/lib/pembayaran";
import { invalidateSubscriptionCache } from "@/hooks/useSubscription";

/** Pembelian saya: yang dimiliki sekarang + riwayat order. Data dari RPC pembelian_saya. */
export default function Pembelian() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const [data, setData] = useState<DataPembelian | null>(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        if (ref) {
          await cekPembayaran(ref);
          invalidateSubscriptionCache();
        }
        const hasil = await bacaPembelian();
        if (aktif) setData(hasil);
      } catch {
        if (aktif) setGagal(true);
      }
    })();
    return () => { aktif = false; };
  }, [ref]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/subscription")} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Langganan
        </Button>
        <h1 className="text-2xl font-bold">Pembelian saya</h1>

        {gagal && <p className="text-sm text-destructive">Gagal memuat pembelian. Muat ulang halaman ini.</p>}
        {!data && !gagal && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}

        {data && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-lg">Yang kamu miliki</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.hak.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pembelian aktif.</p>}
                {data.hak.map((h, i) => (
                  <div key={`${h.kode}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">{h.nama}</div>
                      <div className="text-xs text-muted-foreground">{LABEL_SUMBER[h.sumber] ?? h.sumber}</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {h.berakhir ? `Sampai ${formatDate(h.berakhir)}` : "Permanen"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Riwayat pembelian</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {data.orders.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat pembelian.</p>}
                {data.orders.map(o => {
                  const status = STATUS_ORDER[o.status] ?? { label: o.status, warna: "secondary" as const };
                  return (
                    <div key={o.id} className="border-b last:border-0 pb-4 last:pb-0 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{o.item.join(", ") || "Pembelian"}</div>
                        <Badge variant={status.warna}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{o.nomor} · {formatDate(o.dibuat)}</span>
                        <span className="font-semibold text-foreground">{formatCurrency(o.total)}</span>
                      </div>
                      {o.lanjut_url && (
                        <Button size="sm" className="mt-2" onClick={() => { window.location.href = o.lanjut_url!; }}>
                          Lanjutkan pembayaran
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
