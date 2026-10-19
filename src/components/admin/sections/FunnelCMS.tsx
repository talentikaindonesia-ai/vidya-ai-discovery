/**
 * FunnelCMS — perjalanan siswa dari daftar sampai bayar Plus.
 *
 * Dihitung server oleh admin_funnel() langsung dari tabel yang dipakai web &
 * aplikasi (identitas_siswa, learning_progress, peluang_dibuka, projects,
 * payment_transactions…), jadi tidak bergantung pada event analitik.
 * Kohort = siswa yang MENDAFTAR dalam periode terpilih.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Tahap = { key: string; label: string; n: number };
type Funnel = {
  tahap: Tahap[];
  kpi: Record<string, number>;
  mingguan: { minggu: string; daftar: number }[];
};

const PERIODE: [number | null, string][] = [[null, "Semua"], [90, "90 hari"], [30, "30 hari"], [7, "7 hari"]];
const KPI: [string, string, string][] = [
  ["aktif_7", "Aktif 7 hari", "login dalam 7 hari"],
  ["aktif_30", "Aktif 30 hari", "login dalam 30 hari"],
  ["daftar_30", "Daftar 30 hari", "siswa baru"],
  ["plus_aktif", "Akses Plus", "berbayar, sekolah, atau admin"],
  ["transaksi_berhasil", "Transaksi berhasil", "pembayaran lunas"],
  ["notif_7", "Notifikasi 7 hari", "dibuat oleh sistem"],
];

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "16px 18px" };
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default function FunnelCMS() {
  const [hari, setHari] = useState<number | null>(null);
  const [data, setData] = useState<Funnel | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    setLoading(true); setErr(null);
    (supabase.rpc as any)("admin_funnel", { p_hari: hari }).then(({ data, error }: any) => {
      if (!aktif) return;
      if (error) setErr(error.message); else setData(data as Funnel);
      setLoading(false);
    });
    return () => { aktif = false; };
  }, [hari]);

  const tahap = data?.tahap ?? [];
  const awal = tahap[0]?.n ?? 0;
  // penurunan terbesar antar-tahap berurutan (abaikan tahap kecil di ujung)
  let terburuk = -1, turunMaks = 0;
  tahap.forEach((t, i) => {
    if (i === 0) return;
    const prev = tahap[i - 1].n;
    const turun = prev - t.n;
    if (prev >= 5 && turun > turunMaks) { turunMaks = turun; terburuk = i; }
  });
  const maksMinggu = Math.max(1, ...(data?.mingguan ?? []).map(m => m.daftar));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#64748B", marginRight: 4 }}>Kohort pendaftar:</span>
        {PERIODE.map(([v, l]) => (
          <button key={l} onClick={() => setHari(v)}
            style={{ padding: "7px 14px", borderRadius: 99, border: `1.5px solid ${hari === v ? "#2563EB" : "#E2E8F0"}`, background: hari === v ? "#EFF6FF" : "#fff", color: hari === v ? "#1D4ED8" : "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} /></div>}
      {err && <div style={{ ...card, color: "#B91C1C" }}>Gagal memuat funnel: {err}</div>}

      {!loading && data && <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {KPI.map(([k, l, s]) => (
            <div key={k} style={card}>
              <div style={{ fontSize: 12, color: "#64748B" }}>{l}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", lineHeight: 1.2, marginTop: 2 }}>{data.kpi[k] ?? 0}</div>
              <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{s}</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Funnel siswa</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Persen dihitung dari jumlah pendaftar kohort; angka kecil di kanan = konversi dari tahap sebelumnya.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {tahap.map((t, i) => {
              const dariAwal = pct(t.n, awal);
              const dariSebelum = i ? pct(t.n, tahap[i - 1].n) : 100;
              const jelek = i === terburuk;
              return (
                <div key={t.key} style={{ display: "grid", gridTemplateColumns: "minmax(140px,190px) 1fr 92px", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{t.label}</span>
                  <div style={{ height: 26, background: "#F1F5F9", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${Math.max(dariAwal, t.n > 0 ? 1.5 : 0)}%`, height: "100%", background: jelek ? "#F59E0B" : "#2563EB", borderRadius: 8 }} />
                    <span style={{ position: "absolute", left: 10, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 12.5, fontWeight: 700, color: dariAwal > 12 ? "#fff" : "#0F172A" }}>{t.n} · {dariAwal}%</span>
                  </div>
                  <span style={{ fontSize: 12, color: jelek ? "#B45309" : "#64748B", fontWeight: jelek ? 700 : 500, textAlign: "right" }}>{i ? `${dariSebelum}% lanjut` : "—"}</span>
                </div>
              );
            })}
          </div>
          {terburuk > 0 && (
            <div style={{ marginTop: 14, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#92400E" }}>
              Penurunan terbesar: <b>{tahap[terburuk - 1].label}</b> → <b>{tahap[terburuk].label}</b> ({turunMaks} siswa berhenti di sini).
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>Pendaftar per minggu</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>12 minggu terakhir · siswa</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginTop: 14 }}>
            {(data.mingguan ?? []).map(m => (
              <div key={m.minggu} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>{m.daftar}</span>
                <div style={{ width: "100%", height: `${(m.daftar / maksMinggu) * 80}px`, minHeight: 3, background: "#93C5FD", borderRadius: 6 }} />
                <span style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap" }}>{m.minggu}</span>
              </div>
            ))}
            {!(data.mingguan ?? []).length && <span style={{ fontSize: 13, color: "#94A3B8" }}>Belum ada pendaftar dalam 12 minggu terakhir.</span>}
          </div>
        </div>
      </>}
    </div>
  );
}
