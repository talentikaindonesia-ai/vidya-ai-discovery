/**
 * RoadmapsCMS — roadmap dari praktisi/mentor (MVP 2026-10-26).
 *
 * Admin mengunggah atas nama mentor (tabel mentors) atau penulis tamu.
 * Alur status: draf → tinjau → terbit; hanya "terbit" yang terlihat siswa.
 * Label karier / RIASEC / jenjang dipakai roadmap_untukku() untuk menyorot
 * roadmap yang cocok di detail karier, Beranda, dan tab Belajar aplikasi.
 * Free melihat 2 langkah pertama, Plus semua langkah + PDF (ditegakkan server).
 *
 * Langkah di-UPSERT per id (bukan hapus-lalu-buat-ulang) supaya progres
 * siswa yang sudah mencentang tidak ikut terhapus saat roadmap diedit.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, FileUp, Loader2, Map as MapIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Modal, Field, Confirm, Pill } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

const db = supabase as any;

type Status = "draf" | "tinjau" | "terbit";
interface Langkah { id?: string; judul: string; isi: string | null; perkiraan: string | null; tautan_tipe: string | null; tautan_id: string | null }
interface Roadmap {
  id?: string; slug: string; judul: string; ringkasan: string | null;
  mentor_id: string | null; penulis_nama: string | null; penulis_peran: string | null; penulis_foto: string | null;
  career_id: string | null; riasec: string | null; jenjang_target: string[]; topik: string | null; durasi: string | null;
  cover_url: string | null; pdf_path: string | null; status: Status; sort: number;
}

const STATUS: Record<Status, [string, string, string]> = {
  draf: ["Draf", "#F1F5F9", "#475569"], tinjau: ["Ditinjau", "#FEF3C7", "#92400E"], terbit: ["Terbit", "#DCFCE7", "#166534"],
};
const TOPIK = ["Karier", "Kuliah & beasiswa", "Portofolio", "Kompetisi", "CV & wawancara", "Skill", "Lainnya"];
const JENJANG: [string, string][] = [["smp", "SMP"], ["sma_smk", "SMA/SMK"], ["kuliah", "Kuliah"], ["lulusan", "Lulusan"]];
const RIASEC: [string, string][] = [["R", "Realistis"], ["I", "Investigatif"], ["A", "Artistik"], ["S", "Sosial"], ["E", "Enterprising"], ["C", "Konvensional"]];
const TAUTAN: [string, string][] = [["", "Tanpa tautan"], ["materi", "Materi Talentika"], ["peluang", "Peluang"], ["karier", "Karier"], ["url", "Tautan luar (URL)"]];
const KOSONG: Roadmap = {
  slug: "", judul: "", ringkasan: "", mentor_id: null, penulis_nama: "", penulis_peran: "", penulis_foto: null,
  career_id: null, riasec: null, jenjang_target: [], topik: "Karier", durasi: "", cover_url: null, pdf_path: null, status: "draf", sort: 0,
};
const chip = (on: boolean): React.CSSProperties => ({
  padding: "6px 12px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  border: `1.5px solid ${on ? "#2563EB" : "#E2E8F0"}`, background: on ? "#EFF6FF" : "#fff", color: on ? "#1D4ED8" : "#334155",
});
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function RoadmapsCMS() {
  type Funnel = { dilihat: number; dimulai: number; separuh: number; selesai: number; relevan: number; tidak_relevan: number };
  const [rows, setRows] = useState<(Roadmap & { n: number; pengikut: number; penulis: string; f?: Funnel })[]>([]);
  const [filter, setFilter] = useState<"semua" | Status>("semua");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Roadmap | null>(null);
  const [langkah, setLangkah] = useState<Langkah[]>([]);
  const [hapusIds, setHapusIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hapus, setHapus] = useState<Roadmap | null>(null);
  const [ref, setRef] = useState<{ mentors: any[]; careers: any[]; materi: any[]; peluang: any[] }>({ mentors: [], careers: [], materi: [], peluang: [] });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: ls }, { data: pg }, { data: fn }] = await Promise.all([
      db.from("roadmaps").select("*, mentors(name)").order("sort").order("diperbarui_pada", { ascending: false }),
      db.from("roadmap_langkah").select("id, roadmap_id"),
      db.from("roadmap_progres").select("user_id, langkah_id"),
      db.rpc("admin_funnel_roadmap"),
    ]);
    const fOf = new Map<string, Funnel>(((fn ?? []) as any[]).map(x => [x.roadmap_id, x]));
    if (error) toast.error(error.message);
    const rmOf = new Map<string, string>(((ls ?? []) as any[]).map(l => [l.id, l.roadmap_id]));
    const nOf = new Map<string, number>(); ((ls ?? []) as any[]).forEach(l => nOf.set(l.roadmap_id, (nOf.get(l.roadmap_id) ?? 0) + 1));
    const ikut = new Map<string, Set<string>>();
    ((pg ?? []) as any[]).forEach(p => { const r = rmOf.get(p.langkah_id); if (!r) return; if (!ikut.has(r)) ikut.set(r, new Set()); ikut.get(r)!.add(p.user_id); });
    setRows(((data ?? []) as any[]).map(r => ({ ...r, n: nOf.get(r.id) ?? 0, pengikut: ikut.get(r.id)?.size ?? 0, penulis: r.mentors?.name ?? r.penulis_nama ?? "—", f: fOf.get(r.id) })));
    setLoading(false);
  };
  useEffect(() => {
    load();
    Promise.all([
      db.from("mentors").select("id, name, title, company").order("name"),
      db.from("careers").select("id, name").eq("is_active", true).order("sort"),
      db.from("learning_content").select("id, title").eq("is_active", true).order("title"),
      db.from("scraped_content").select("id, title").eq("is_active", true).order("title"),
    ]).then(([m, c, l, p]) => setRef({ mentors: m.data ?? [], careers: c.data ?? [], materi: l.data ?? [], peluang: p.data ?? [] }));
  }, []);

  const buka = async (r?: Roadmap) => {
    setHapusIds([]);
    if (!r) { setForm({ ...KOSONG }); setLangkah([{ judul: "", isi: "", perkiraan: "", tautan_tipe: null, tautan_id: null }]); return; }
    setForm({ ...KOSONG, ...r, jenjang_target: r.jenjang_target ?? [] });
    const { data } = await db.from("roadmap_langkah").select("*").eq("roadmap_id", r.id).order("urut");
    setLangkah((data ?? []) as Langkah[]);
  };

  const uploadPdf = async (f: File) => {
    if (!form) return;
    if (f.type !== "application/pdf") { toast.error("File harus PDF"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("Maksimal 50 MB"); return; }
    setUploading(true);
    const path = `${slugify(form.slug || form.judul) || "roadmap"}/${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("roadmap").upload(path, f, { contentType: "application/pdf" });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setForm({ ...form, pdf_path: path });
    toast.success("PDF terunggah — simpan untuk menerapkan");
  };

  const simpan = async () => {
    if (!form) return;
    if (!form.judul.trim()) { toast.error("Judul wajib diisi"); return; }
    if (!form.mentor_id && !form.penulis_nama?.trim()) { toast.error("Pilih mentor atau isi nama penulis"); return; }
    const isi = langkah.filter(l => l.judul.trim());
    if (form.status === "terbit" && isi.length < 2) { toast.error("Roadmap terbit minimal punya 2 langkah"); return; }
    setSaving(true);
    const payload = {
      slug: form.slug.trim() || slugify(form.judul),
      judul: form.judul.trim(), ringkasan: form.ringkasan?.trim() || null,
      mentor_id: form.mentor_id || null,
      penulis_nama: form.mentor_id ? null : form.penulis_nama?.trim() || null,
      penulis_peran: form.mentor_id ? null : form.penulis_peran?.trim() || null,
      penulis_foto: form.mentor_id ? null : form.penulis_foto || null,
      career_id: form.career_id || null, riasec: (form.riasec || "").toUpperCase().slice(0, 3) || null,
      jenjang_target: form.jenjang_target ?? [], topik: form.topik || null, durasi: form.durasi?.trim() || null,
      cover_url: form.cover_url || null, pdf_path: form.pdf_path || null, status: form.status, sort: form.sort ?? 0,
      diperbarui_pada: new Date().toISOString(),
    };
    const q = form.id ? db.from("roadmaps").update(payload).eq("id", form.id).select("id").single() : db.from("roadmaps").insert(payload).select("id").single();
    const { data: rm, error } = await q;
    if (error) { setSaving(false); toast.error(error.message.includes("duplicate") ? "Slug sudah dipakai roadmap lain" : error.message); return; }
    const rid = rm.id as string;
    if (hapusIds.length) await db.from("roadmap_langkah").delete().in("id", hapusIds);
    for (let i = 0; i < isi.length; i++) {
      const l = isi[i];
      const row = { roadmap_id: rid, urut: i + 1, judul: l.judul.trim(), isi: l.isi?.trim() || null, perkiraan: l.perkiraan?.trim() || null, tautan_tipe: l.tautan_tipe || null, tautan_id: l.tautan_tipe ? (l.tautan_id?.trim() || null) : null };
      const { error: e2 } = l.id ? await db.from("roadmap_langkah").update(row).eq("id", l.id) : await db.from("roadmap_langkah").insert(row);
      if (e2) { setSaving(false); toast.error("Gagal menyimpan langkah: " + e2.message); return; }
    }
    setSaving(false);
    toast.success(form.status === "terbit" ? "Roadmap terbit — tampil di aplikasi" : "Roadmap disimpan");
    setForm(null); load();
  };

  const hapusRoadmap = async () => {
    if (!hapus?.id) return;
    if (hapus.pdf_path) await supabase.storage.from("roadmap").remove([hapus.pdf_path]);
    const { error } = await db.from("roadmaps").delete().eq("id", hapus.id);
    if (error) toast.error(error.message); else toast.success("Roadmap dihapus");
    setHapus(null); load();
  };

  const ubahLangkah = (i: number, patch: Partial<Langkah>) => setLangkah(ls => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const pindah = (i: number, d: number) => setLangkah(ls => { const j = i + d; if (j < 0 || j >= ls.length) return ls; const c = [...ls]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const buangLangkah = (i: number) => { const l = langkah[i]; if (l.id) setHapusIds(h => [...h, l.id!]); setLangkah(ls => ls.filter((_, k) => k !== i)); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13.5, color: "#64748B", maxWidth: 620, lineHeight: 1.55 }}>
          Roadmap terstruktur dari praktisi. Disorot otomatis ke siswa yang cocok (karier, tipe RIASEC, jenjang) di detail karier, Beranda, dan tab Belajar aplikasi.
          Siswa Free melihat 2 langkah pertama; Plus melihat semua langkah dan PDF.
        </p>
        <button onClick={() => buka()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Roadmap
        </button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={22} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} /></div>
        : !rows.length ? (
          <div style={{ background: "#fff", border: "1px dashed #CBD5E1", borderRadius: 16, padding: 32, textAlign: "center", color: "#64748B" }}>
            <MapIcon size={28} style={{ margin: "0 auto 8px" }} />
            Belum ada roadmap. Mulai dengan roadmap dari praktisi untuk karier yang paling banyak dipilih siswa.
          </div>
        ) : (
          <>
          {rows.some(r => r.status === "tinjau") && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#92400E", marginBottom: 12 }}>
              <b>{rows.filter(r => r.status === "tinjau").length} roadmap menunggu tinjauan</b> — buka, periksa isinya (tanpa kontak pribadi/tautan pembayaran), lalu ubah status ke Terbit.
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {(["semua", "tinjau", "draf", "terbit"] as const).map(k => (
              <button key={k} onClick={() => setFilter(k)} style={chip(filter === k)}>
                {k === "semua" ? "Semua" : STATUS[k][0]} ({k === "semua" ? rows.length : rows.filter(r => r.status === k).length})
              </button>
            ))}
          </div>
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden" }}>
            {rows.filter(r => filter === "semua" || r.status === filter).map((r, i) => {
              const [l, bg, c] = STATUS[r.status];
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: i ? "1px solid #F1F5F9" : "none" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{r.judul}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {r.penulis} · {r.n} langkah{r.career_id ? ` · karier ${r.career_id}` : ""}{r.riasec ? ` · ${r.riasec}` : ""}{r.jenjang_target?.length ? ` · ${r.jenjang_target.join(", ")}` : ""}
                    </div>
                    {r.f && r.status === "terbit" && (
                      <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                        Funnel: <b>{r.f.dilihat}</b> dilihat → <b>{r.f.dimulai}</b> mulai → <b>{r.f.separuh}</b> ≥50% → <b>{r.f.selesai}</b> selesai · 👍 {r.f.relevan} / 👎 {r.f.tidak_relevan}
                      </div>
                    )}
                  </div>
                  <Pill bg={bg} color={c}>{l}</Pill>
                  <button onClick={() => buka(r)} title="Ubah" style={{ border: "none", background: "none", cursor: "pointer", color: "#2563EB" }}><Pencil size={16} /></button>
                  <button onClick={() => setHapus(r)} title="Hapus" style={{ border: "none", background: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
          </>
        )}

      {form && (
        <Modal title={form.id ? `Ubah ${form.judul}` : "Tambah Roadmap"} onClose={() => setForm(null)} wide>
          <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Judul"><input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} placeholder="Roadmap jadi Data Analyst dari SMA" style={inputStyle} /></Field>
            <Field label="Ringkasan (1–2 kalimat)"><textarea value={form.ringkasan ?? ""} onChange={e => setForm({ ...form, ringkasan: e.target.value })} rows={2} style={textareaStyle} /></Field>
            <Field label="Mentor (dari menu Mentor)" half>
              <select value={form.mentor_id ?? ""} onChange={e => setForm({ ...form, mentor_id: e.target.value || null })} style={selectStyle}>
                <option value="">— Penulis tamu (isi di bawah) —</option>
                {ref.mentors.map(m => <option key={m.id} value={m.id}>{m.name}{m.title ? ` · ${m.title}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })} style={selectStyle}>
                <option value="draf">Draf (belum terlihat siswa)</option>
                <option value="tinjau">Ditinjau (belum terlihat siswa)</option>
                <option value="terbit">Terbit (tampil di aplikasi)</option>
              </select>
            </Field>
            {!form.mentor_id && <>
              <Field label="Nama penulis" half><input value={form.penulis_nama ?? ""} onChange={e => setForm({ ...form, penulis_nama: e.target.value })} placeholder="Nama praktisi" style={inputStyle} /></Field>
              <Field label="Jabatan · tempat kerja" half><input value={form.penulis_peran ?? ""} onChange={e => setForm({ ...form, penulis_peran: e.target.value })} placeholder="Data Analyst · Bank X" style={inputStyle} /></Field>
              <Field label="Foto penulis (opsional)" half><UnggahGambar value={form.penulis_foto} onChange={url => setForm({ ...form, penulis_foto: url })} folder="roadmap" rasio="1 / 1" saran="400 × 400 px" bulat /></Field>
            </>}
            <Field label="Karier terkait" half>
              <select value={form.career_id ?? ""} onChange={e => setForm({ ...form, career_id: e.target.value || null })} style={selectStyle}>
                <option value="">— Umum —</option>
                {ref.careers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Topik" half>
              <select value={form.topik ?? ""} onChange={e => setForm({ ...form, topik: e.target.value || null })} style={selectStyle}>
                {TOPIK.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Kode RIASEC — klik berurutan (maks. 3; kosong = umum)">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {RIASEC.map(([h, l]) => {
                  const kode = (form.riasec ?? "").toUpperCase(); const pos = kode.indexOf(h);
                  return <button type="button" key={h} style={chip(pos >= 0)} onClick={() => { const baru = kode.includes(h) ? kode.replace(h, "") : (kode + h).slice(0, 3); setForm({ ...form, riasec: baru || null }); }}>{pos >= 0 ? `${pos + 1}. ` : ""}{h} · {l}</button>;
                })}
              </div>
            </Field>
            <Field label="Jenjang sasaran (kosong = semua)">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {JENJANG.map(([v, l]) => { const on = form.jenjang_target.includes(v); return <button type="button" key={v} style={chip(on)} onClick={() => setForm({ ...form, jenjang_target: on ? form.jenjang_target.filter(x => x !== v) : [...form.jenjang_target, v] })}>{l}</button>; })}
              </div>
            </Field>
            <Field label="Perkiraan durasi" half><input value={form.durasi ?? ""} onChange={e => setForm({ ...form, durasi: e.target.value })} placeholder="3 bulan" style={inputStyle} /></Field>
            <Field label="Urutan tampil" half><input type="number" value={form.sort} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} style={inputStyle} /></Field>
            <Field label="Sampul (opsional)" half><UnggahGambar value={form.cover_url} onChange={url => setForm({ ...form, cover_url: url })} folder="roadmap" rasio="16 / 9" saran="1200 × 675 px" /></Field>
            <Field label="Lampiran PDF (opsional, khusus Plus)" half>
              <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: "1px dashed #94A3B8", background: "#fff", cursor: "pointer", fontSize: 13 }}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} {form.pdf_path ? "Ganti PDF" : "Unggah PDF"}
                </button>
                {form.pdf_path && <button type="button" onClick={() => setForm({ ...form, pdf_path: null })} style={{ border: "none", background: "none", color: "#DC2626", fontSize: 12.5, cursor: "pointer" }}>Lepas PDF</button>}
              </div>
            </Field>

            <div style={{ gridColumn: "span 2", marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Langkah-langkah (2 pertama terlihat oleh akun Free)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {langkah.map((l, i) => (
                  <div key={l.id ?? `baru-${i}`} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 12, background: i < 2 ? "#F8FAFC" : "#fff" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#2563EB", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</span>
                      <input value={l.judul} onChange={e => ubahLangkah(i, { judul: e.target.value })} placeholder="Judul langkah" style={{ ...inputStyle, flex: 1 }} />
                      <input value={l.perkiraan ?? ""} onChange={e => ubahLangkah(i, { perkiraan: e.target.value })} placeholder="2 minggu" style={{ ...inputStyle, width: 120 }} />
                      <button type="button" onClick={() => pindah(i, -1)} title="Naik" style={{ border: "none", background: "none", cursor: "pointer" }}><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => pindah(i, 1)} title="Turun" style={{ border: "none", background: "none", cursor: "pointer" }}><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => buangLangkah(i)} title="Hapus langkah" style={{ border: "none", background: "none", cursor: "pointer", color: "#DC2626" }}><Trash2 size={15} /></button>
                    </div>
                    <textarea value={l.isi ?? ""} onChange={e => ubahLangkah(i, { isi: e.target.value })} placeholder="Apa yang dikerjakan siswa di langkah ini, dan kenapa penting" rows={2} style={{ ...textareaStyle, marginTop: 8, minHeight: 56 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <select value={l.tautan_tipe ?? ""} onChange={e => ubahLangkah(i, { tautan_tipe: e.target.value || null, tautan_id: null })} style={{ ...selectStyle, width: 200 }}>
                        {TAUTAN.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                      </select>
                      {l.tautan_tipe === "materi" && <select value={l.tautan_id ?? ""} onChange={e => ubahLangkah(i, { tautan_id: e.target.value })} style={{ ...selectStyle, flex: 1 }}><option value="">Pilih materi…</option>{ref.materi.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>}
                      {l.tautan_tipe === "peluang" && <select value={l.tautan_id ?? ""} onChange={e => ubahLangkah(i, { tautan_id: e.target.value })} style={{ ...selectStyle, flex: 1 }}><option value="">Pilih peluang…</option>{ref.peluang.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>}
                      {l.tautan_tipe === "karier" && <select value={l.tautan_id ?? ""} onChange={e => ubahLangkah(i, { tautan_id: e.target.value })} style={{ ...selectStyle, flex: 1 }}><option value="">Pilih karier…</option>{ref.careers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}
                      {l.tautan_tipe === "url" && <input value={l.tautan_id ?? ""} onChange={e => ubahLangkah(i, { tautan_id: e.target.value })} placeholder="https://situs-resmi…" style={{ ...inputStyle, flex: 1 }} />}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setLangkah(ls => [...ls, { judul: "", isi: "", perkiraan: "", tautan_tipe: null, tautan_id: null }])}
                style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px dashed #94A3B8", background: "#fff", cursor: "pointer", fontSize: 13 }}>
                <Plus size={14} /> Tambah langkah
              </button>
            </div>

            <div style={{ gridColumn: "span 2", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#92400E", lineHeight: 1.5 }}>
              Sebelum terbit: pastikan tidak ada nomor HP, akun pribadi, atau tautan pembayaran di luar Talentika — sebagian besar pembaca berusia di bawah 18 tahun.
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 28px", borderTop: "1px solid #E2E8F0" }}>
            <button onClick={() => setForm(null)} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", fontSize: 13.5 }}>Batal</button>
            <button onClick={simpan} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              {saving && <Loader2 size={14} className="animate-spin" />} Simpan
            </button>
          </div>
        </Modal>
      )}

      {hapus && <Confirm message={`Hapus "${hapus.judul}"? Progres siswa pada roadmap ini ikut terhapus.`} onConfirm={hapusRoadmap} onCancel={() => setHapus(null)} />}
    </div>
  );
}
