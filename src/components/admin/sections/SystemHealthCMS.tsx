import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Kesehatan Sistem — memantau hal-hal yang TERBUKTI pernah gagal diam-diam
 * berbulan-bulan di platform ini: email tak pernah terkirim (RESEND_API_KEY
 * tak dipasang), feed peluang dibajak jadi spam judi, banjir notifikasi yang
 * tak dibaca, baris XP duplikat, durasi materi placeholder.
 *
 * Semua angka dibaca langsung dari database lewat RPC admin_system_health().
 * Tidak ada data contoh di halaman ini — kalau kosong, artinya memang kosong.
 */

interface Check {
  grup: string;
  label: string;
  nilai: string;
  status: "ok" | "warn" | "crit";
  detail: string;
}

const STATUS_CFG: Record<string, { bg: string; border: string; color: string; label: string; Icon: React.ElementType }> = {
  ok:   { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", label: "Sehat",     Icon: CheckCircle2 },
  warn: { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309", label: "Perhatian", Icon: AlertCircle },
  crit: { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C", label: "Bermasalah",Icon: AlertTriangle },
};

export default function SystemHealthCMS() {
  const [checks, setChecks]   = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [funnel, setFunnel] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data, error }, { data: f }] = await Promise.all([
      (supabase.rpc as any)("admin_system_health"),
      (supabase.rpc as any)("opportunity_funnel_metrics", { p_days: 30 }),
    ]);
    if (error) {
      setError(error.message);
      setChecks([]);
    } else {
      setChecks((data?.pemeriksaan ?? []) as Check[]);
      setUpdatedAt(data?.dibuat_pada ?? null);
    }
    setFunnel(f ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const crit = checks.filter(c => c.status === "crit").length;
  const warn = checks.filter(c => c.status === "warn").length;
  const ok   = checks.filter(c => c.status === "ok").length;

  // urutkan: bermasalah dulu, lalu perhatian, lalu sehat
  const rank: Record<string, number> = { crit: 0, warn: 1, ok: 2 };
  const grups = Array.from(new Set(checks.map(c => c.grup)))
    .sort((a, b) => {
      const wa = Math.min(...checks.filter(c => c.grup === a).map(c => rank[c.status] ?? 3));
      const wb = Math.min(...checks.filter(c => c.grup === b).map(c => rank[c.status] ?? 3));
      return wa - wb;
    });

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} />
        <div style={{ marginTop: 12, color: "#64748B", fontSize: 14 }}>Memeriksa kesehatan sistem…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "18px 20px", color: "#B91C1C", fontSize: 14 }}>
        ⚠ Gagal memuat: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Ringkasan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Bermasalah", value: crit, ...STATUS_CFG.crit },
          { label: "Perlu Perhatian", value: warn, ...STATUS_CFG.warn },
          { label: "Sehat", value: ok, ...STATUS_CFG.ok },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 30, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>
          {updatedAt ? `Diperiksa ${new Date(updatedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
        </span>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <RefreshCw size={14} /> Periksa Ulang
        </button>
      </div>

      {/* North Star §26 — corong peluang: Lihat → Klik → Simpan → Lamar → Diterima */}
      {funnel && (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
            🎯 North Star — Corong Peluang <span style={{ fontWeight: 500, color: "#94A3B8", fontSize: 12 }}>· {funnel.periode_hari} hari terakhir</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", margin: "3px 0 14px" }}>
            Ukuran sebenarnya bukan berapa peluang terdaftar, tapi berapa yang berujung tindakan nyata.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[
              { l: "Dilihat",  v: funnel.dilihat },
              { l: "Diklik",   v: funnel.diklik },
              { l: "Disimpan", v: funnel.disimpan },
              { l: "Dilamar",  v: funnel.dilamar },
              { l: "Diterima", v: funnel.diterima },
            ].map((s, i) => (
              <div key={s.l} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 11, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: i === 4 ? "#047857" : "#0F172A", lineHeight: 1 }}>{s.v ?? 0}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {[
              { l: "Opportunity-to-Save", v: funnel.opportunity_to_save_pct, note: "dari pengguna yang melihat" },
              { l: "Save-to-Apply",       v: funnel.save_to_apply_pct,       note: "dari yang disimpan" },
              { l: "Success Rate",        v: funnel.success_rate_pct,        note: "dari yang dilamar" },
            ].map(m => (
              <div key={m.l} style={{ background: "#EEF3FF", border: "1px solid #DBEAFE", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 19, color: "#1D4ED8" }}>
                  {m.v === null || m.v === undefined ? "—" : `${m.v}%`}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#334155", marginTop: 2 }}>{m.l}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{m.note}</div>
              </div>
            ))}
          </div>

          {(funnel.dilihat ?? 0) === 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "9px 12px" }}>
              Pelacakan baru dipasang — angka akan terisi setelah siswa membuka halaman Peluang.
            </div>
          )}
        </div>
      )}

      {/* Kelompok pemeriksaan */}
      {grups.map(grup => (
        <div key={grup} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
            {grup}
          </div>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            {checks.filter(c => c.grup === grup)
              .sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3))
              .map((c, i, arr) => {
                const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.warn;
                const Icon = cfg.Icon;
                return (
                  <div key={c.label}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, color: cfg.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={16} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A" }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{c.detail}</div>
                    </div>
                    <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: cfg.color, whiteSpace: "nowrap" }}>
                      {c.nilai}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 18px", fontSize: 12.5, color: "#64748B", lineHeight: 1.7 }}>
        💡 Halaman ini memeriksa hal-hal yang pernah gagal diam-diam berbulan-bulan.
        Cron yang “sukses” hanya berarti permintaan terkirim — bukan berarti isinya berhasil.
        Biasakan menengok halaman ini seminggu sekali.
      </div>
    </div>
  );
}
