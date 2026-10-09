/**
 * AiKuratorCMS — agent AI yang menyiapkan isi database peluang & jalur belajar.
 *
 *  • Agent (edge function `ai-kurator`) hanya membuat DRAF di `ai_drafts`.
 *  • Admin meninjau, mengedit, lalu "Terbitkan" → RPC `terbitkan_draf_ai`
 *    menulis ke scraped_content / learning_paths + learning_content + quizzes.
 *    Begitu terbit, data tampil di web talentika.id dan aplikasi mobile.
 *  • Cron harian `ai-kurator-pantau-sumber` mengecek 3 sumber resmi per hari
 *    (tiap sumber maks 1×/6 hari) dan menaruh temuannya di antrean ini.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Link2, Wand2, Route, RefreshCw, X, ExternalLink, AlertTriangle, Quote, Trash2 } from "lucide-react";
import { fmtDate } from "../adminShared";

const db = supabase as any;

const JENIS = ["beasiswa", "beasiswa_s1", "beasiswa_s2", "beasiswa_s3", "magang", "fellowship", "lowongan_kerja", "kompetisi", "hackathon", "konferensi", "workshop", "pertukaran", "volunteer", "grant", "lainnya"];
const JENJANG: [string, string][] = [["smp", "SMP"], ["sma_smk", "SMA/SMK"], ["kuliah", "Kuliah"], ["lulusan", "Lulusan"]];
const STATUS: Record<string, [string, string, string]> = {
  running: ["Sedang dikerjakan", "#EFF6FF", "#1D4ED8"],
  pending: ["Menunggu tinjauan", "#FFF7ED", "#C2410C"],
  approved: ["Terbit", "#F0FDF4", "#15803D"],
  rejected: ["Ditolak", "#F1F5F9", "#64748B"],
  empty: ["Tidak ada hasil", "#F8FAFC", "#64748B"],
  failed: ["Gagal", "#FEF2F2", "#B91C1C"],
};
const KIND: Record<string, string> = { opportunity: "Peluang baru", opportunity_update: "Lengkapi peluang", learning_path: "Jalur belajar" };
const ORIGIN: Record<string, string> = { manual: "Admin", enrich: "Lengkapi", monitor: "Pantau sumber" };

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", boxSizing: "border-box" };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#475569", margin: "10px 0 4px", display: "block" };
const btn = (bg = "#2563EB", fg = "#fff"): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: bg, color: fg, fontWeight: 700, fontSize: 13, cursor: "pointer" });

async function panggil(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ai-kurator", { body });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context?.json())?.error ?? msg; } catch { /* */ }
    throw new Error(msg);
  }
  return data;
}

export default function AiKuratorCMS() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("aktif");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    let q = db.from("ai_drafts").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter === "aktif") q = q.in("status", ["running", "pending"]);
    else if (filter !== "semua") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setDrafts(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [filter]); // eslint-disable-line
  // pantau draf yang masih dikerjakan agent
  const adaJalan = drafts.some(d => d.status === "running");
  useEffect(() => {
    if (!adaJalan) return;
    const t = setInterval(() => load(true), 6000);
    return () => clearInterval(t);
  }, [adaJalan, filter]); // eslint-disable-line

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ ...card, background: "linear-gradient(135deg,#EFF6FF,#FFF7ED)", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Sparkles size={22} style={{ color: "#1D4ED8", flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.55 }}>
          <b>AI Kurator</b> membaca halaman resmi lalu menyiapkan <b>draf</b> peluang dan jalur belajar. Tidak ada yang tampil ke siswa sebelum Anda menekan <b>Terbitkan</b>.
          Setelah terbit, data langsung muncul di <b>talentika.id</b> dan <b>aplikasi mobile</b>. Setiap hari agent juga memantau 3 sumber resmi secara bergiliran.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <PanelPeluang onDone={() => { setFilter("aktif"); load(true); }} />
        <PanelLengkapi onDone={() => { setFilter("aktif"); load(true); }} />
        <PanelJalur onDone={() => { setFilter("aktif"); load(true); }} />
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A", marginRight: 8 }}>Antrean draf</h3>
          {[["aktif", "Perlu tindakan"], ["approved", "Terbit"], ["rejected", "Ditolak"], ["empty", "Tidak ada hasil"], ["failed", "Gagal"], ["semua", "Semua"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: "6px 13px", borderRadius: 99, border: "1px solid #E2E8F0", background: filter === k ? "#0F172A" : "#fff", color: filter === k ? "#fff" : "#475569", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>{l}</button>
          ))}
          <button onClick={() => load()} style={{ ...btn("#fff", "#475569"), border: "1px solid #E2E8F0", marginLeft: "auto" }}><RefreshCw size={14} /> Muat ulang</button>
        </div>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
            : !drafts.length ? <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Belum ada draf di sini.</div>
            : drafts.map(d => {
              const [sl, sbg, sfg] = STATUS[d.status] ?? [d.status, "#F1F5F9", "#475569"];
              const judul = d.payload?.title ?? d.payload?.name ?? d.input?.title ?? d.input?.topic ?? d.input?.url ?? d.source_url ?? "(tanpa judul)";
              return (
                <div key={d.id} onClick={() => (d.status === "pending" || d.payload) && setOpen(d)}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: "1px solid #F1F5F9", cursor: d.status === "pending" || d.payload ? "pointer" : "default" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: sbg, color: sfg, whiteSpace: "nowrap", display: "inline-flex", gap: 5, alignItems: "center" }}>
                    {d.status === "running" && <Loader2 size={11} className="animate-spin" />}{sl}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(judul).slice(0, 140)}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {KIND[d.kind]} · {ORIGIN[d.origin]}{d.input?.sumber ? ` (${d.input.sumber})` : ""} · {fmtDate(d.created_at)}
                      {d.payload?.confidence && ` · keyakinan ${d.payload.confidence}`}
                      {d.error && <span style={{ color: d.status === "failed" ? "#B91C1C" : "#64748B" }}> · {d.error}</span>}
                    </div>
                  </div>
                  {d.status === "pending" && <span style={{ ...btn(), padding: "7px 12px" }}>Tinjau</span>}
                </div>
              );
            })}
        </div>
      </div>

      {open && <Tinjau draft={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); load(true); }} />}
    </div>
  );
}

/* ── panel pemicu ──────────────────────────────────────────────────── */
function Judul({ icon: Icon, t, s }: { icon: any; t: string; s: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={17} style={{ color: "#1D4ED8" }} /></div>
      <div><div style={{ fontWeight: 800, fontSize: 14.5, color: "#0F172A" }}>{t}</div><div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>{s}</div></div>
    </div>
  );
}

function PanelPeluang({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState(""); const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const kirim = async () => {
    setBusy(true);
    try { await panggil({ action: "opportunity", url: url.trim() || undefined, text: text.trim() || undefined }); toast.success("Agent mulai membaca — draf muncul di antrean ±1 menit lagi"); setUrl(""); setText(""); onDone(); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  return (
    <div style={card}>
      <Judul icon={Link2} t="Peluang dari link / teks" s="Tempel URL resmi. Bila situs memblokir server (sering .go.id), tempel teks pengumumannya." />
      <label style={label}>URL halaman resmi</label>
      <input style={input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
      <label style={label}>Atau teks pengumuman (opsional)</label>
      <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={text} onChange={e => setText(e.target.value)} placeholder="Salin isi poster/pengumuman di sini…" />
      <button style={{ ...btn(), marginTop: 12, opacity: busy ? .6 : 1 }} disabled={busy || (!url.trim() && text.trim().length < 80)} onClick={kirim}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Buat draf
      </button>
    </div>
  );
}

function PanelLengkapi({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3); const [busy, setBusy] = useState(false); const [kosong, setKosong] = useState<number | null>(null);
  useEffect(() => {
    db.from("scraped_content").select("id", { count: "exact", head: true }).eq("is_active", true).or("eligibility.is.null,requirements.eq.{}")
      .then(({ count }: any) => setKosong(count ?? null));
  }, []);
  const kirim = async () => {
    setBusy(true);
    try {
      const r = await panggil({ action: "enrich", limit: n });
      if (!r?.count) toast.info("Semua peluang aktif sudah lengkap atau baru dicek (≤14 hari)");
      else { toast.success(`${r.count} peluang sedang dilengkapi`); onDone(); }
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  return (
    <div style={card}>
      <Judul icon={Wand2} t="Lengkapi peluang lama" s="Agent membuka URL resmi peluang aktif yang syarat/eligibilitasnya kosong, lalu mengusulkan isian." />
      <div style={{ fontSize: 13, color: "#334155", margin: "12px 0" }}>
        {kosong === null ? "Menghitung…" : <><b>{kosong}</b> peluang aktif belum lengkap.</>}
      </div>
      <label style={label}>Jumlah per putaran</label>
      <select style={input} value={n} onChange={e => setN(Number(e.target.value))}>{[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i} peluang</option>)}</select>
      <button style={{ ...btn(), marginTop: 12, opacity: busy ? .6 : 1 }} disabled={busy} onClick={kirim}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Lengkapi sekarang
      </button>
    </div>
  );
}

function PanelJalur({ onDone }: { onDone: () => void }) {
  const [topic, setTopic] = useState(""); const [career, setCareer] = useState(""); const [jenjang, setJenjang] = useState("sma_smk"); const [steps, setSteps] = useState(6);
  const [careers, setCareers] = useState<any[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { db.from("careers").select("id,name").eq("is_active", true).order("sort").then(({ data }: any) => setCareers(data ?? [])); }, []);
  const kirim = async () => {
    setBusy(true);
    try { await panggil({ action: "learning_path", topic, career_id: career || undefined, jenjang, steps }); toast.success("Agent menyusun jalur — biasanya 2–4 menit"); setTopic(""); onDone(); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };
  return (
    <div style={card}>
      <Judul icon={Route} t="Jalur belajar dari topik" s="Agent memakai materi yang sudah ada, mencari materi gratis yang tautannya terverifikasi, dan menulis kuis." />
      <label style={label}>Topik / tujuan</label>
      <input style={input} value={topic} onChange={e => setTopic(e.target.value)} placeholder="mis. Dasar analisis data dengan spreadsheet" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><label style={label}>Karier (opsional)</label>
          <select style={input} value={career} onChange={e => setCareer(e.target.value)}><option value="">— umum —</option>{careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label style={label}>Jenjang</label>
          <select style={input} value={jenjang} onChange={e => setJenjang(e.target.value)}>{JENJANG.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      <label style={label}>Jumlah langkah</label>
      <select style={input} value={steps} onChange={e => setSteps(Number(e.target.value))}>{[3, 4, 5, 6, 7, 8, 10].map(i => <option key={i} value={i}>{i} langkah</option>)}</select>
      <button style={{ ...btn(), marginTop: 12, opacity: busy ? .6 : 1 }} disabled={busy || topic.trim().length < 4} onClick={kirim}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Route size={14} />} Susun jalur
      </button>
    </div>
  );
}

/* ── modal tinjau ──────────────────────────────────────────────────── */
const lines = (a?: string[] | null) => (a ?? []).join("\n");
const unlines = (s: string) => s.split("\n").map(x => x.trim()).filter(Boolean);

function Tinjau({ draft, onClose, onDone }: { draft: any; onClose: () => void; onDone: () => void }) {
  const [p, setP] = useState<any>(() => JSON.parse(JSON.stringify(draft.payload ?? {})));
  const [asal, setAsal] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const bisaTerbit = draft.status === "pending";
  const set = (k: string, v: any) => setP((o: any) => ({ ...o, [k]: v }));

  useEffect(() => {
    if (draft.kind === "opportunity_update" && draft.target_id)
      db.from("scraped_content").select("title,description,deadline,eligibility,requirements,benefits,cost,mode,location,prize_info").eq("id", draft.target_id).maybeSingle().then(({ data }: any) => setAsal(data));
  }, [draft]);

  const terbit = async () => {
    setBusy(true);
    const { error } = await db.rpc("terbitkan_draf_ai", { p_draft: draft.id, p_payload: p });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(draft.kind === "learning_path" ? "Jalur belajar terbit di web & aplikasi" : "Peluang terbit di web & aplikasi");
    onDone();
  };
  const tolak = async () => {
    setBusy(true);
    const { error } = await db.from("ai_drafts").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", draft.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast("Draf ditolak"); onDone();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 60, display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, width: "min(920px,100%)", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={18} style={{ color: "#1D4ED8" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{KIND[draft.kind]}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{ORIGIN[draft.origin]}{draft.input?.sumber ? ` · ${draft.input.sumber}` : ""} · {fmtDate(draft.created_at)}</div>
          </div>
          {draft.source_url && <a href={draft.source_url} target="_blank" rel="noreferrer" style={{ ...btn("#F1F5F9", "#334155"), textDecoration: "none" }}><ExternalLink size={14} /> Sumber</a>}
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B" }}><X size={20} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 20 }}>
          {draft.kind === "learning_path" ? <FormJalur p={p} set={set} setP={setP} /> : <FormPeluang p={p} set={set} asal={asal} />}
        </div>

        {bisaTerbit && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748B", marginRight: "auto" }}>Periksa fakta dengan sumber sebelum menerbitkan.</span>
            <button style={btn("#F1F5F9", "#B91C1C")} disabled={busy} onClick={tolak}>Tolak</button>
            <button style={{ ...btn("#16A34A"), opacity: busy ? .6 : 1 }} disabled={busy} onClick={terbit}>{busy && <Loader2 size={14} className="animate-spin" />} Terbitkan</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Peringatan({ p }: { p: any }) {
  if (!p.missing_fields?.length && !p.notes && p.confidence !== "rendah") return null;
  return (
    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 13, color: "#78350F", display: "flex", gap: 8 }}>
      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {p.confidence && <div><b>Keyakinan agent:</b> {p.confidence}</div>}
        {!!p.missing_fields?.length && <div><b>Tidak ditemukan di sumber:</b> {p.missing_fields.join(", ")}</div>}
        {p.notes && <div><b>Catatan:</b> {p.notes}</div>}
      </div>
    </div>
  );
}

function FormPeluang({ p, set, asal }: { p: any; set: (k: string, v: any) => void; asal: any }) {
  const F = (k: string, l: string, type = "text") => (
    <div key={k}><label style={label}>{l}{asal && asal[k] != null && asal[k] !== "" && <span style={{ fontWeight: 500, color: "#94A3B8" }}> · sekarang: {String(Array.isArray(asal[k]) ? asal[k].join("; ") : k === "deadline" ? String(asal[k]).slice(0, 10) : asal[k]).slice(0, 60)}</span>}</label>
      <input type={type} style={input} value={p[k] ?? ""} onChange={e => set(k, e.target.value || null)} /></div>
  );
  return (
    <div>
      <Peringatan p={p} />
      {asal && <div style={{ fontSize: 12.5, color: "#475569", marginBottom: 10 }}>Memperbarui: <b>{asal.title}</b>. Hanya kolom yang terisi yang akan menimpa data lama; kolom kosong dibiarkan.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0 14px" }}>
        {F("title", "Judul")}
        {F("organizer", "Penyelenggara")}
        <div><label style={label}>Jenis</label><select style={input} value={p.opportunity_type ?? "lainnya"} onChange={e => set("opportunity_type", e.target.value)}>{JENIS.map(j => <option key={j}>{j}</option>)}</select></div>
        {F("url", "URL resmi")}
        {F("deadline", "Deadline", "date")}
        {F("registration_start_date", "Pendaftaran dibuka", "date")}
        {F("registration_end_date", "Pendaftaran ditutup", "date")}
        {F("location", "Lokasi")}
        <div><label style={label}>Mode</label><select style={input} value={p.mode ?? ""} onChange={e => set("mode", e.target.value || null)}><option value="">—</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></div>
        <div><label style={label}>Biaya</label><select style={input} value={p.cost ?? ""} onChange={e => set("cost", e.target.value || null)}><option value="">—</option><option value="gratis">Gratis</option><option value="berbayar">Berbayar</option><option value="pendanaan_penuh">Pendanaan penuh</option><option value="pendanaan_sebagian">Pendanaan sebagian</option></select></div>
        {F("prize_info", "Hadiah / pendanaan")}
        {F("contact", "Kontak")}
      </div>
      <label style={label}>Jenjang sasaran</label>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {JENJANG.map(([k, l]) => (
          <label key={k} style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={(p.jenjang_target ?? []).includes(k)} onChange={e => set("jenjang_target", e.target.checked ? [...(p.jenjang_target ?? []), k] : (p.jenjang_target ?? []).filter((x: string) => x !== k))} />{l}
          </label>
        ))}
      </div>
      <label style={label}>Deskripsi</label>
      <textarea style={{ ...input, minHeight: 80 }} value={p.description ?? ""} onChange={e => set("description", e.target.value)} />
      <label style={label}>Eligibilitas</label>
      <textarea style={{ ...input, minHeight: 56 }} value={p.eligibility ?? ""} onChange={e => set("eligibility", e.target.value || null)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0 14px" }}>
        <div><label style={label}>Persyaratan (satu per baris)</label><textarea style={{ ...input, minHeight: 100 }} value={lines(p.requirements)} onChange={e => set("requirements", unlines(e.target.value))} /></div>
        <div><label style={label}>Manfaat (satu per baris)</label><textarea style={{ ...input, minHeight: 100 }} value={lines(p.benefits)} onChange={e => set("benefits", unlines(e.target.value))} /></div>
      </div>
      <label style={label}>Tag (pisahkan koma)</label>
      <input style={input} value={(p.tags ?? []).join(", ")} onChange={e => set("tags", e.target.value.split(",").map(x => x.trim()).filter(Boolean))} />
      {!!p.evidence?.length && (
        <div style={{ marginTop: 16 }}>
          <div style={{ ...label, display: "flex", gap: 6, alignItems: "center" }}><Quote size={13} /> Bukti dari sumber</div>
          {p.evidence.map((e: any, i: number) => (
            <div key={i} style={{ fontSize: 12.5, padding: "8px 12px", background: "#F8FAFC", borderLeft: "3px solid #2563EB", borderRadius: 6, marginBottom: 6 }}>
              <b style={{ color: "#1D4ED8" }}>{e.field}:</b> <span style={{ color: "#334155" }}>"{e.quote}"</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormJalur({ p, set, setP }: { p: any; set: (k: string, v: any) => void; setP: (f: (o: any) => any) => void }) {
  const items: any[] = p.items ?? [];
  const setItem = (i: number, k: string, v: any) => setP(o => ({ ...o, items: o.items.map((it: any, j: number) => j === i ? { ...it, [k]: v } : it) }));
  const hapusItem = (i: number) => setP(o => ({ ...o, items: o.items.filter((_: any, j: number) => j !== i) }));
  const hapusSoal = (i: number, q: number) => setItem(i, "quiz", items[i].quiz.filter((_: any, j: number) => j !== q));
  const baru = useMemo(() => items.filter(it => !it.existing_content_id).length, [items]);
  return (
    <div>
      <Peringatan p={p} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0 14px" }}>
        <div><label style={label}>Nama jalur</label><input style={input} value={p.name ?? ""} onChange={e => set("name", e.target.value)} /></div>
        <div><label style={label}>Tingkat</label><select style={input} value={p.difficulty_level ?? "beginner"} onChange={e => set("difficulty_level", e.target.value)}><option value="beginner">Pemula</option><option value="intermediate">Menengah</option><option value="advanced">Lanjut</option></select></div>
        <div><label style={label}>Estimasi jam</label><input type="number" style={input} value={p.estimated_duration_hours ?? ""} onChange={e => set("estimated_duration_hours", Number(e.target.value) || null)} /></div>
      </div>
      <label style={label}>Deskripsi</label>
      <textarea style={{ ...input, minHeight: 60 }} value={p.description ?? ""} onChange={e => set("description", e.target.value)} />
      <label style={label}>Prospek karier</label>
      <input style={input} value={p.career_outlook ?? ""} onChange={e => set("career_outlook", e.target.value || null)} />
      <div style={{ fontSize: 12.5, color: "#64748B", margin: "14px 0 8px" }}>
        {items.length} langkah · {items.length - baru} memakai materi yang sudah ada · {baru} materi baru{p.career_id ? ` · tampil di app untuk target karier "${p.career_id}"` : ""}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 24, height: 24, borderRadius: 99, background: "#1D4ED8", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</span>
            <input style={{ ...input, fontWeight: 700 }} value={it.title} onChange={e => setItem(i, "title", e.target.value)} disabled={!!it.existing_content_id} />
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", background: it.existing_content_id ? "#F0FDF4" : "#FFF7ED", color: it.existing_content_id ? "#15803D" : "#C2410C" }}>{it.existing_content_id ? "materi lama" : it.content_type}</span>
            <button title="Hapus langkah" onClick={() => hapusItem(i)} style={{ border: "none", background: "none", cursor: "pointer", color: "#B91C1C" }}><Trash2 size={15} /></button>
          </div>
          {!it.existing_content_id && (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <input style={input} value={it.content_url ?? ""} onChange={e => setItem(i, "content_url", e.target.value)} placeholder="URL materi" />
                {it.content_url && <a href={it.content_url} target="_blank" rel="noreferrer" style={{ color: "#2563EB" }}><ExternalLink size={16} /></a>}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{it.external_source ?? ""}{it.duration_minutes ? ` · ${it.duration_minutes} menit` : ""} · {it.description}</div>
              {!!it.learning_objectives?.length && <ul style={{ fontSize: 12, color: "#334155", margin: "6px 0 0", paddingLeft: 18 }}>{it.learning_objectives.map((o: string, k: number) => <li key={k}>{o}</li>)}</ul>}
              {(it.quiz ?? []).map((q: any, k: number) => (
                <div key={k} style={{ marginTop: 8, padding: 10, background: "#F8FAFC", borderRadius: 8, fontSize: 12.5 }}>
                  <div style={{ display: "flex", gap: 6 }}><b style={{ flex: 1 }}>Kuis {k + 1}: {q.question}</b><button onClick={() => hapusSoal(i, k)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94A3B8" }}><X size={13} /></button></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {q.options.map((o: string, m: number) => <span key={m} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #E2E8F0", background: o === q.correct_answer ? "#DCFCE7" : "#fff", fontWeight: o === q.correct_answer ? 700 : 400 }}>{o}</span>)}
                  </div>
                  {q.explanation && <div style={{ color: "#64748B", marginTop: 4 }}>{q.explanation}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
