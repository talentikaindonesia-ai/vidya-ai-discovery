/**
 * MobileAppCMS — pengaturan aplikasi mobile Talentika.
 *
 *  • Soal Talent DNA: bank soal 8 modul (talent_dna_items). Bobot sumbu
 *    menentukan skor radar (Analitis, Kreatif, Kepemimpinan, Teknologi,
 *    Komunikasi) yang dihitung server oleh selesaikan_modul_dna().
 *  • Konfigurasi: bobot Career Readiness (§8), model & batas harian AI —
 *    dibaca langsung oleh database & edge function, tanpa rilis aplikasi.
 *  • Analitik: event PRD §14 dari app_events (tanpa teks bebas).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { inputStyle, selectStyle } from "../adminShared";

const db = supabase as any;
const MODULES: [string, string, boolean][] = [
  ["interest", "01 · Interest Discovery", true], ["strength", "02 · Strength Discovery", true], ["aptitude", "03 · Aptitude", false], ["personality", "04 · Personality", true],
  ["learning_style", "05 · Learning Style", false], ["career_interest", "06 · Career Interest", false], ["future_skills", "07 · Future Skills", false], ["values", "08 · Values", false],
];
const AXES: [string, string][] = [["analytical", "Analitis"], ["creative", "Kreatif"], ["leadership", "Kepemimpinan"], ["technology", "Teknologi"], ["communication", "Komunikasi"]];

export default function MobileAppCMS() {
  const [tab, setTab] = useState<"dna" | "config" | "analytics">("dna");
  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, background: tab === id ? "#2563EB" : "transparent", color: tab === id ? "#fff" : "#64748B" }}>{label}</button>
  );
  return (
    <div>
      <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <TabBtn id="dna" label="🧬 Soal Talent DNA" />
        <TabBtn id="config" label="⚙️ Konfigurasi" />
        <TabBtn id="analytics" label="📈 Analitik App" />
      </div>
      {tab === "dna" ? <DnaItems /> : tab === "config" ? <Config /> : <Analytics />}
    </div>
  );
}

interface Item { module_key: string; idx: number; text_id: string; text_en: string; axes: Record<string, number>; riasec: string | null; _dirty?: boolean; _new?: boolean }

function DnaItems() {
  const [mod, setMod] = useState("interest");
  const [items, setItems] = useState<Item[]>([]);
  const [done, setDone] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: d }] = await Promise.all([
      db.from("talent_dna_items").select("*").eq("module_key", mod).order("idx"),
      db.from("talent_dna_modules_done").select("module_key"),
    ]);
    if (error) toast.error(error.message);
    setItems(data ?? []);
    const c: Record<string, number> = {};
    (d ?? []).forEach((r: any) => { c[r.module_key] = (c[r.module_key] ?? 0) + 1; });
    setDone(c); setLoading(false);
  };
  useEffect(() => { load(); }, [mod]); // eslint-disable-line

  const upd = (i: number, patch: Partial<Item>) => setItems(items.map((it, k) => k === i ? { ...it, ...patch, _dirty: true } : it));
  const add = () => setItems([...items, { module_key: mod, idx: items.length ? Math.max(...items.map(x => x.idx)) + 1 : 0, text_id: "", text_en: "", axes: {}, riasec: null, _dirty: true, _new: true }]);
  const remove = async (it: Item) => {
    if (it._new) { setItems(items.filter(x => x !== it)); return; }
    if (!confirm("Hapus soal ini? Jawaban lama untuk soal ini tidak lagi dihitung dalam skor.")) return;
    const { error } = await db.from("talent_dna_items").delete().eq("module_key", it.module_key).eq("idx", it.idx);
    if (error) { toast.error(error.message); return; }
    toast.success("Soal dihapus"); load();
  };
  const save = async () => {
    const dirty = items.filter(x => x._dirty);
    for (const it of dirty) {
      if (it.text_id.trim().length < 8 || it.text_en.trim().length < 8) { toast.error(`Soal #${it.idx + 1}: teks ID & EN wajib diisi`); return; }
      if (!Object.values(it.axes).some(v => Number(v) > 0)) { toast.error(`Soal #${it.idx + 1}: isi minimal satu bobot sumbu`); return; }
    }
    setSaving(true);
    const rows = dirty.map(({ _dirty, _new, ...r }) => ({ ...r, text_id: r.text_id.trim(), text_en: r.text_en.trim(), riasec: r.riasec?.trim().toUpperCase().slice(0, 1) || null,
      axes: Object.fromEntries(Object.entries(r.axes).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])) }));
    const { error } = await db.from("talent_dna_items").upsert(rows, { onConflict: "module_key,idx" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} soal disimpan`); load();
  };
  const isFree = MODULES.find(m => m[0] === mod)?.[2];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <select value={mod} onChange={e => setMod(e.target.value)} style={{ ...selectStyle, width: 260, background: "#fff" }}>
          {MODULES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <span style={{ fontSize: 12.5, color: "#64748B" }}>{isFree ? "Gratis" : "Pro (soal pertama gratis sebagai pratinjau)"} · {items.length} soal · diselesaikan {done[mod] ?? 0} siswa</span>
        <span style={{ flex: 1 }} />
        <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontWeight: 600, fontSize: 13, cursor: "pointer" }}><Plus size={14} /> Soal</button>
        <button onClick={save} disabled={saving || !items.some(x => x._dirty)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: items.some(x => x._dirty) ? "#2563EB" : "#CBD5E1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan perubahan</button>
      </div>
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#92400E", marginBottom: 14, lineHeight: 1.55 }}>
        Menambah soal membuat siswa yang sedang mengerjakan modul ini perlu menjawab soal baru sebelum selesai. Skor dihitung ulang hanya saat siswa menyelesaikan modul lagi. Instrumen ini self-report — sebaiknya ditinjau psikolog (PRD §16).
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : items.map((it, i) => (
            <div key={`${it.idx}-${i}`} style={{ padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none", background: it._dirty ? "#F8FAFF" : "#fff" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "#EFF6FF", color: "#2563EB", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{it.idx + 1}</span>
                <div style={{ flex: 1, display: "grid", gap: 6 }}>
                  <input value={it.text_id} onChange={e => upd(i, { text_id: e.target.value })} placeholder="Pernyataan (Bahasa Indonesia) — mis. Aku senang…" style={inputStyle} />
                  <input value={it.text_en} onChange={e => upd(i, { text_en: e.target.value })} placeholder="Statement (English)" style={inputStyle} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {AXES.map(([k, l]) => (
                      <label key={k} style={{ fontSize: 11.5, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>{l}
                        <input type="number" min={0} max={1} step={0.1} value={it.axes?.[k] ?? ""} onChange={e => upd(i, { axes: { ...it.axes, [k]: e.target.value === "" ? 0 : Number(e.target.value) } })} style={{ ...inputStyle, width: 64, padding: "5px 7px" }} />
                      </label>
                    ))}
                    <label style={{ fontSize: 11.5, color: "#475569", display: "flex", alignItems: "center", gap: 4 }}>RIASEC
                      <input value={it.riasec ?? ""} maxLength={1} onChange={e => upd(i, { riasec: e.target.value })} style={{ ...inputStyle, width: 44, padding: "5px 7px" }} />
                    </label>
                  </div>
                </div>
                <button onClick={() => remove(it)} title="Hapus soal" style={{ padding: "8px 10px", borderRadius: 9, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

const W_LABEL: [string, string][] = [["talent", "Talent Clarity"], ["skill", "Skill Readiness"], ["experience", "Experience"], ["portfolio", "Portfolio"], ["achievement", "Achievement"], ["opportunity", "Opportunity Readiness"]];

function Config() {
  const [w, setW] = useState<Record<string, number>>({});
  const [model, setModel] = useState("");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    db.from("app_config").select("key, value").then(({ data }: any) => {
      const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
      setW(m.readiness_weights ?? { talent: 20, skill: 25, experience: 20, portfolio: 15, achievement: 10, opportunity: 10 });
      setModel(typeof m.ai_model === "string" ? m.ai_model : "claude-opus-5-5");
      setLimit(Number(m.ai_free_daily_limit ?? 20));
      setLoading(false);
    });
  }, []);
  const total = W_LABEL.reduce((a, [k]) => a + (Number(w[k]) || 0), 0);
  const save = async () => {
    if (total !== 100) { toast.error(`Total bobot harus 100 (sekarang ${total})`); return; }
    if (!/^claude-[a-z0-9-]+$/.test(model.trim())) { toast.error("ID model tidak valid"); return; }
    if (!(limit >= 1 && limit <= 500)) { toast.error("Batas harian 1–500"); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await db.from("app_config").upsert([
      { key: "readiness_weights", value: Object.fromEntries(W_LABEL.map(([k]) => [k, Number(w[k]) || 0])), updated_at: now },
      { key: "ai_model", value: model.trim(), updated_at: now },
      { key: "ai_free_daily_limit", value: limit, updated_at: now },
    ]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Konfigurasi disimpan — berlaku langsung");
  };
  if (loading) return <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>;
  const card: React.CSSProperties = { background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 22px", marginBottom: 16 };
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={card}>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Bobot Career Readiness</div>
        <div style={{ fontSize: 12.5, color: "#64748B", margin: "4px 0 14px" }}>Dipakai readiness_for() untuk semua siswa, orang tua, dan dashboard sekolah. Total harus 100.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {W_LABEL.map(([k, l]) => (
            <label key={k} style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{l}
              <input type="number" min={0} max={100} value={w[k] ?? 0} onChange={e => setW({ ...w, [k]: Number(e.target.value) })} style={{ ...inputStyle, marginTop: 5 }} />
            </label>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: total === 100 ? "#059669" : "#DC2626" }}>Total: {total} / 100</div>
      </div>
      <div style={card}>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Talentika AI</div>
        <div style={{ fontSize: 12.5, color: "#64748B", margin: "4px 0 14px" }}>Dibaca edge function talentika-ai per permintaan. Kunci API disimpan sebagai secret ANTHROPIC_API_KEY di Supabase, bukan di sini.</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Model
            <input value={model} onChange={e => setModel(e.target.value)} style={{ ...inputStyle, marginTop: 5 }} />
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Batas pesan/hari (gratis)
            <input type="number" min={1} max={500} value={limit} onChange={e => setLimit(Number(e.target.value))} style={{ ...inputStyle, marginTop: 5 }} />
          </label>
        </div>
      </div>
      <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan konfigurasi</button>
    </div>
  );
}

const EVENTS: [string, string][] = [
  ["onboarding_completed", "Onboarding selesai"], ["dna_module_completed", "Modul Talent DNA selesai"], ["recommendation_viewed", "Rekomendasi dilihat"],
  ["recommendation_clicked", "Rekomendasi diklik"], ["course_stage_completed", "Tahap course selesai"], ["evidence_added", "Evidence ditambahkan"],
  ["opportunity_saved", "Peluang disimpan"], ["opportunity_applied", "Peluang didaftar"], ["mentor_session_booked", "Sesi mentor dipesan"],
  ["mentor_session_completed", "Refleksi sesi mentor"], ["readiness_changed", "Readiness naik"], ["ai_message_sent", "Pesan AI"],
  ["paywall_viewed", "Paywall dilihat"], ["purchase_started", "Checkout dimulai"], ["purchase_completed", "Pembelian selesai"],
];

function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Record<string, { n: number; users: number }>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const { data: rows, error } = await db.from("app_events").select("event, user_id").gte("created_at", since).limit(50000);
      if (error) toast.error(error.message);
      const agg: Record<string, { n: number; u: Set<string> }> = {};
      (rows ?? []).forEach((r: any) => { (agg[r.event] ??= { n: 0, u: new Set() }).n++; if (r.user_id) agg[r.event].u.add(r.user_id); });
      setData(Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, { n: v.n, users: v.u.size }])));
      setLoading(false);
    })();
  }, [days]);
  const u = (k: string) => data[k]?.users ?? 0;
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  const funnel: [string, number][] = [["Onboarding", u("onboarding_completed")], ["Talent DNA", u("dna_module_completed")], ["Simpan peluang", u("opportunity_saved")], ["Daftar peluang", u("opportunity_applied")], ["Lihat paywall", u("paywall_viewed")], ["Bayar", u("purchase_completed")]];
  const max = Math.max(1, ...funnel.map(f => f[1]));
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[7, 30, 90].map(d => <button key={d} onClick={() => setDays(d)} style={{ padding: "7px 14px", borderRadius: 99, border: "1px solid #E2E8F0", background: days === d ? "#0F172A" : "#fff", color: days === d ? "#fff" : "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>{d} hari</button>)}
      </div>
      {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 22px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 12 }}>Funnel (pengguna unik)</div>
            {funnel.map(([l, n], i) => (
              <div key={l} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#334155" }}><span>{l}</span><span><b>{n}</b>{i > 0 && <span style={{ color: "#94A3B8" }}> · {pct(n, funnel[i - 1][1])}</span>}</span></div>
                <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, marginTop: 4 }}><div style={{ width: `${(n / max) * 100}%`, height: "100%", background: "#2563EB", borderRadius: 4 }} /></div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 22px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 12 }}>Semua event</div>
            <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: "#64748B", textAlign: "left" }}><th style={{ padding: "4px 0" }}>Event</th><th style={{ textAlign: "right" }}>Jumlah</th><th style={{ textAlign: "right" }}>Pengguna</th></tr></thead>
              <tbody>{EVENTS.map(([k, l]) => (
                <tr key={k} style={{ borderTop: "1px solid #F1F5F9" }}><td style={{ padding: "6px 0", color: "#0F172A" }}>{l}</td><td style={{ textAlign: "right" }}>{data[k]?.n ?? 0}</td><td style={{ textAlign: "right" }}>{data[k]?.users ?? 0}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
