/**
 * SchoolsCMS — platform-admin tool to verify registered schools (NPSN badge).
 * Calls list_all_schools + verify_school RPCs (both guarded by has_role admin).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, BadgeCheck, Building2 } from "lucide-react";

interface SchoolRow {
  school_code: string;
  school_name: string | null;
  school_npsn: string | null;
  school_city: string | null;
  pic_name: string | null;
  email: string | null;
  account_verified: boolean;
  members: number;
  created_at: string;
}

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

export default function SchoolsCMS() {
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await rpc("list_all_schools", {});
    if (error) toast.error(error.message);
    setRows((data as SchoolRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (s: SchoolRow) => {
    setBusy(s.school_code);
    const { error } = await rpc("verify_school", { p_code: s.school_code, p_verified: !s.account_verified });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!s.account_verified ? `${s.school_name} terverifikasi ✓` : `Verifikasi ${s.school_name} dicabut`);
    setRows(rows.map(r => r.school_code === s.school_code ? { ...r, account_verified: !s.account_verified } : r));
  };

  const filtered = rows.filter(s => {
    const t = q.toLowerCase();
    return !t || (s.school_name || "").toLowerCase().includes(t) || (s.school_npsn || "").includes(t) || s.school_code.toLowerCase().includes(t);
  });

  const verifiedCount = rows.filter(r => r.account_verified).length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Sekolah", value: rows.length, color: "#2563EB" },
          { label: "Terverifikasi", value: verifiedCount, color: "#10B981" },
          { label: "Menunggu Verifikasi", value: rows.length - verifiedCount, color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama, NPSN, atau kode..."
          style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 13.5, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}>
            <Building2 size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />
            <div>Belum ada sekolah terdaftar</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr", padding: "11px 20px", background: "#F8FAFC", fontSize: 11.5, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em" }}>
              <span>Sekolah</span><span>NPSN</span><span>Kode</span><span>Siswa</span><span style={{ textAlign: "right" }}>Status</span>
            </div>
            {filtered.map((s, i) => (
              <div key={s.school_code} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr", padding: "13px 20px", alignItems: "center", borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.school_name || "—"}</span>
                    {s.account_verified && <BadgeCheck size={14} style={{ color: "#2563EB", flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{s.school_city || ""} · {s.pic_name || s.email}</div>
                </div>
                <span style={{ fontSize: 13, color: "#475569" }}>{s.school_npsn || "—"}</span>
                <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#2563EB", fontWeight: 700 }}>{s.school_code}</span>
                <span style={{ fontSize: 13, color: "#475569" }}>{s.members}</span>
                <div style={{ textAlign: "right" }}>
                  <button onClick={() => toggle(s)} disabled={busy === s.school_code}
                    style={{
                      padding: "7px 14px", borderRadius: 9, border: "none", cursor: busy === s.school_code ? "wait" : "pointer",
                      fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12.5,
                      background: s.account_verified ? "#FEF2F2" : "#EFF6FF",
                      color: s.account_verified ? "#DC2626" : "#2563EB",
                    }}>
                    {busy === s.school_code ? "…" : s.account_verified ? "Cabut" : "Verifikasi"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
