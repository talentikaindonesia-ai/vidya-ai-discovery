/**
 * OpportunityPipeline — "Peluang Saya": turns bookmarks into an application
 * pipeline (Tersimpan → Disiapkan → Dilamar → Hasil) with deadline countdown
 * & H-3 reminder highlight. Renders nothing if the user has no saved opportunities.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Judul dari feed bisa berisi entitas HTML (&amp;) — decode sebagai TEKS, jangan render sebagai HTML. */
const teksBersih = (s?: string | null) => {
  if (!s) return "";
  const t = document.createElement("textarea");
  t.innerHTML = s;
  return t.value;
};
const amanUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : undefined);
import { Briefcase, Clock, ExternalLink } from "lucide-react";

interface SavedOpp {
  id: string;
  opportunity_id: string | null;
  opportunity_title: string;
  opportunity_url: string;
  category: string;
  status: string;
  deadline?: string | null;
}

const STATUS_FLOW = ["saved", "preparing", "applied", "accepted", "rejected"] as const;
const STATUS_LABEL: Record<string, string> = {
  saved: "Tersimpan", preparing: "Disiapkan", applied: "Dilamar", accepted: "Diterima", rejected: "Ditolak",
};
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  saved:     { bg: "var(--tk-gray-100, #F1F5F9)", fg: "var(--tk-gray-600, #475569)" },
  preparing: { bg: "var(--tk-blue-50, #EFF6FF)",  fg: "var(--tk-blue-600, #2563EB)" },
  applied:   { bg: "#FFF7ED",                       fg: "#EA580C" },
  accepted:  { bg: "#ECFDF5",                       fg: "#059669" },
  rejected:  { bg: "#FEF2F2",                       fg: "#DC2626" },
};

const daysLeft = (d?: string | null) => d ? Math.floor((new Date(d).getTime() - Date.now()) / 86400000) : null;

export const OpportunityPipeline = () => {
  const [items, setItems] = useState<SavedOpp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: saved } = await supabase
      .from("saved_opportunities")
      .select("id, opportunity_id, opportunity_title, opportunity_url, category, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const rows = (saved || []) as SavedOpp[];
    const ids = rows.map(r => r.opportunity_id).filter(Boolean) as string[];
    if (ids.length) {
      const { data: deads } = await supabase.from("scraped_content").select("id, deadline").in("id", ids);
      const map = new Map((deads || []).map((d: { id: string; deadline: string | null }) => [d.id, d.deadline]));
      rows.forEach(r => { r.deadline = r.opportunity_id ? map.get(r.opportunity_id) ?? null : null; });
    }
    // Sort: nearest active deadline first, then the rest
    rows.sort((a, b) => {
      const da = daysLeft(a.deadline), db = daysLeft(b.deadline);
      const va = da !== null && da >= 0 ? da : 9999;
      const vb = db !== null && db >= 0 ? db : 9999;
      return va - vb;
    });
    setItems(rows);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    const patch: Record<string, unknown> = { status };
    if (status === "applied") patch.applied_at = new Date().toISOString();
    const { error } = await supabase.from("saved_opportunities").update(patch).eq("id", id);
    if (error) { toast.error("Gagal memperbarui status"); load(); }
  };

  if (loading || items.length === 0) return null;

  const applied = items.filter(i => ["applied", "accepted"].includes(i.status)).length;

  return (
    <div className="tk-card" style={{ padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "#FFF7ED", color: "#EA580C", display: "grid", placeItems: "center" }}>
            <Briefcase size={18} />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>Peluang Saya</h3>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)", marginTop: 1 }}>{items.length} tersimpan · {applied} dilamar</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.slice(0, 6).map(it => {
          const dl = daysLeft(it.deadline);
          const urgent = dl !== null && dl >= 0 && dl <= 3;
          const st = STATUS_STYLE[it.status] ?? STATUS_STYLE.saved;
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, border: `1px solid ${urgent ? "#FECACA" : "var(--tk-gray-100, #F1F5F9)"}`, background: urgent ? "#FEF2F2" : "transparent" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={amanUrl(it.opportunity_url)} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tk-ink)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span>{teksBersih(it.opportunity_title)}</span>
                  <ExternalLink size={11} style={{ flexShrink: 0, color: "var(--tk-gray-400)" }} />
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--tk-gray-400)", textTransform: "capitalize" }}>{(it.category || "").replace("_", " ")}</span>
                  {dl !== null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: dl < 0 ? "var(--tk-gray-400)" : urgent ? "#DC2626" : "var(--tk-gray-500)" }}>
                      <Clock size={11} /> {dl < 0 ? "Berakhir" : urgent ? `Segera! H-${dl}` : `H-${dl}`}
                    </span>
                  )}
                </div>
              </div>
              <select value={it.status} onChange={e => setStatus(it.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ flexShrink: 0, fontSize: 11.5, fontFamily: "var(--tk-font-display)", fontWeight: 700, color: st.fg, background: st.bg, border: "none", borderRadius: 99, padding: "5px 10px", cursor: "pointer", appearance: "none", textAlign: "center" }}>
                {STATUS_FLOW.map(s => <option key={s} value={s} style={{ background: "#fff", color: "#0F172A" }}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
