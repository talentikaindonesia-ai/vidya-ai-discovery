/**
 * ReviewQueueCMS — antrean tinjauan manusia untuk aplikasi mobile.
 *
 *  • Prestasi (PRJ-05): siswa mencatat prestasi sebagai "self-reported";
 *    hanya admin yang bisa menandai "verified" (dikunci trigger
 *    kunci_verifikasi_prestasi). Prestasi terverifikasi berbobot 2× di
 *    Career Readiness dan tampil dengan badge ✓ di profil publik.
 *  • Laporan komunitas (COM-04): laporan dari tombol 🚩 di feed. Hapus
 *    postingan atau abaikan laporan; keduanya tercatat di content_reports.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Medal, Flag, ExternalLink } from "lucide-react";
import { fmtDate } from "../adminShared";

const db = supabase as any;

export default function ReviewQueueCMS() {
  const [tab, setTab] = useState<"ach" | "reports">("ach");
  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, background: tab === id ? "#2563EB" : "transparent", color: tab === id ? "#fff" : "#64748B" }}>{label}</button>
  );
  return (
    <div>
      <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <TabBtn id="ach" label="🏅 Verifikasi Prestasi" />
        <TabBtn id="reports" label="🚩 Laporan Komunitas" />
      </div>
      {tab === "ach" ? <Achievements /> : <Reports />}
    </div>
  );
}

async function namaPengguna(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const { data } = await db.from("profiles").select("user_id, full_name, school_name").in("user_id", Array.from(new Set(ids)));
  return new Map<string, string>((data ?? []).map((p: any) => [p.user_id, `${p.full_name ?? "Tanpa nama"}${p.school_name ? " · " + p.school_name : ""}`]));
}

function Achievements() {
  const [filter, setFilter] = useState<"pending" | "verified">("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db.from("user_achievements").select("*").eq("verified", filter === "verified").order("created_at", { ascending: false }).limit(200);
    if (error) toast.error(error.message);
    setRows(data ?? []); setNames(await namaPengguna((data ?? []).map((r: any) => r.user_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line

  const setVerified = async (a: any, v: boolean) => {
    setBusy(a.id);
    const { error } = await db.from("user_achievements").update({ verified: v }).eq("id", a.id);
    if (!error && v) {
      await db.from("notifications").insert({ user_id: a.user_id, title: "Prestasimu terverifikasi ✓", message: `${a.title} · ${a.event} kini tampil dengan badge Verified.`, type: "achievement", priority: "normal", is_read: false, action_url: "/app/achievements" });
    }
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(v ? "Prestasi diverifikasi — siswa diberi tahu" : "Verifikasi dicabut");
    setRows(rows.filter(r => r.id !== a.id));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["pending", "verified"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 99, border: "1px solid #E2E8F0", background: filter === f ? "#0F172A" : "#fff", color: filter === f ? "#fff" : "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
            {f === "pending" ? "Menunggu verifikasi" : "Sudah terverifikasi"}
          </button>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : !rows.length ? <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}><Medal size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />{filter === "pending" ? "Tidak ada prestasi yang menunggu" : "Belum ada prestasi terverifikasi"}</div>
          : rows.map((a, i) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none" }}>
              <div style={{ fontSize: 26, flexShrink: 0 }}>{a.medal}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{a.title} · {a.event} <span style={{ color: "#94A3B8", fontWeight: 500 }}>({a.year})</span></div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{names.get(a.user_id) ?? a.user_id} · dicatat {fmtDate(a.created_at)}{a.skills?.length ? ` · ${a.skills.join(", ")}` : ""}</div>
                {a.evidence_url ? <a href={a.evidence_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#2563EB", marginTop: 4 }}>Bukti <ExternalLink size={11} /></a>
                  : <div style={{ fontSize: 11.5, color: "#B45309", marginTop: 4 }}>Tanpa link bukti — minta sertifikat/pengumuman resmi sebelum verifikasi</div>}
              </div>
              {filter === "pending" ? (
                <button disabled={busy === a.id} onClick={() => setVerified(a, true)} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{busy === a.id ? "…" : "Verifikasi"}</button>
              ) : (
                <button disabled={busy === a.id} onClick={() => setVerified(a, false)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid #FECACA", background: "#fff", color: "#DC2626", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Cabut</button>
              )}
            </div>
          ))}
      </div>
      <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>Verifikasi hanya bila ada bukti dari penyelenggara (sertifikat, pengumuman resmi). Prestasi tanpa verifikasi tetap tampil sebagai "Self-reported".</p>
    </div>
  );
}

function Reports() {
  const [status, setStatus] = useState<"open" | "done">("open");
  const [rows, setRows] = useState<any[]>([]);
  const [posts, setPosts] = useState<Map<string, any>>(new Map());
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = db.from("content_reports").select("*").order("created_at", { ascending: false }).limit(200);
    q = status === "open" ? q.eq("status", "open") : q.neq("status", "open");
    const { data, error } = await q;
    if (error) toast.error(error.message);
    const r = data ?? [];
    const postIds = r.filter((x: any) => x.target_type === "post").map((x: any) => x.target_id);
    const { data: p } = postIds.length ? await db.from("forum_posts").select("id, user_id, content, category, created_at").in("id", postIds) : { data: [] };
    const pm = new Map<string, any>((p ?? []).map((x: any) => [x.id, x]));
    setRows(r); setPosts(pm);
    setNames(await namaPengguna([...r.map((x: any) => x.reporter_id), ...(p ?? []).map((x: any) => x.user_id)]));
    setLoading(false);
  };
  useEffect(() => { load(); }, [status]); // eslint-disable-line

  // satu postingan bisa dilaporkan berkali-kali — tampilkan dikelompokkan
  const grouped = Array.from(rows.reduce((m, r) => { const k = `${r.target_type}:${r.target_id}`; m.set(k, [...(m.get(k) ?? []), r]); return m; }, new Map<string, any[]>()).values()) as any[][];

  const resolve = async (group: any[], action: "actioned" | "dismissed") => {
    const first = group[0];
    setBusy(first.target_id);
    if (action === "actioned" && first.target_type === "post") {
      const { error } = await db.from("forum_posts").delete().eq("id", first.target_id);
      if (error) { setBusy(null); toast.error(error.message); return; }
    }
    const { error } = await db.from("content_reports").update({ status: action }).in("id", group.map(g => g.id));
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "actioned" ? "Postingan dihapus" : "Laporan diabaikan");
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["open", "done"] as const).map(f => (
          <button key={f} onClick={() => setStatus(f)} style={{ padding: "7px 14px", borderRadius: 99, border: "1px solid #E2E8F0", background: status === f ? "#0F172A" : "#fff", color: status === f ? "#fff" : "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
            {f === "open" ? "Perlu ditinjau" : "Riwayat"}
          </button>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : !grouped.length ? <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}><Flag size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />{status === "open" ? "Tidak ada laporan baru" : "Belum ada riwayat"}</div>
          : grouped.map((g, i) => {
            const r = g[0]; const post = posts.get(r.target_id);
            return (
              <div key={r.id} style={{ padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748B" }}>
                  <span style={{ fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 99 }}>{g.length}× dilaporkan</span>
                  <span>{r.target_type} · terakhir {fmtDate(r.created_at)} · oleh {g.map(x => names.get(x.reporter_id) ?? "?").slice(0, 2).join(", ")}</span>
                  {status === "done" && <span style={{ marginLeft: "auto", fontWeight: 700 }}>{r.status === "actioned" ? "Dihapus" : r.status === "dismissed" ? "Diabaikan" : r.status}</span>}
                </div>
                <div style={{ marginTop: 8, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, color: "#0F172A", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {post ? <><b>{names.get(post.user_id) ?? "Penulis"}</b> · {post.category}<br />{post.content}</> : <i style={{ color: "#94A3B8" }}>Konten sudah tidak ada</i>}
                </div>
                {status === "open" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button disabled={busy === r.target_id} onClick={() => resolve(g, "actioned")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>{post ? "Hapus postingan" : "Tandai selesai"}</button>
                    <button disabled={busy === r.target_id} onClick={() => resolve(g, "dismissed")} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Abaikan</button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
