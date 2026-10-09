import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, Loader2, Save, ArrowLeft, ArrowUp, ArrowDown, ExternalLink,
  ImageIcon, Users, ListTree, HelpCircle, Eye,
} from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Toggle, Modal, Confirm, Field } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

/**
 * BootcampsCMS — program bootcamp berbayar/gratis yang tampil di halaman
 * Belajar dan punya halaman jualan sendiri (/bootcamp/:slug).
 *
 * Harga di sini adalah harga yang DITAGIH: create-mayar-payment membacanya
 * langsung dari tabel, bukan dari browser. Pembeli otomatis terdaftar
 * setelah mayar-webhook memverifikasi pembayaran ke API Mayar.
 */

interface Bootcamp {
  id: string; slug: string; title: string; category_label: string; subtitle: string | null;
  description: string | null; cover_url: string | null; lesson_type: string; level: string;
  has_certificate: boolean; has_consultation: boolean; price: number; original_price: number | null;
  price_label: string; price_description: string | null; benefits: string[];
  mentor_id: string | null; released_at: string | null; is_published: boolean; sort_order: number;
}
interface Section { id: string; bootcamp_id: string; title: string; sort_order: number }
interface Lesson {
  id: string; bootcamp_id: string; section_id: string; title: string; lesson_type: string;
  duration_minutes: number | null; content_url: string | null; is_preview: boolean; sort_order: number;
}
interface Faq { id: string; bootcamp_id: string | null; question: string; answer: string; sort_order: number }

const LEVELS = [
  { v: "beginner", label: "Pemula" }, { v: "intermediate", label: "Menengah" },
  { v: "advanced", label: "Lanjutan" }, { v: "all", label: "Semua Level" },
];
const LESSON_TYPES = [
  { v: "video", label: "Video" }, { v: "ebook", label: "Ebook" }, { v: "article", label: "Artikel" },
  { v: "quiz", label: "Kuis" }, { v: "live", label: "Live Session" },
];

const t = (name: string) => supabase.from(name as any) as any;
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const keSlug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const KOSONG: Partial<Bootcamp> = {
  title: "", slug: "", category_label: "Bootcamp", subtitle: "", description: "", cover_url: null,
  lesson_type: "Video", level: "beginner", has_certificate: false, has_consultation: false,
  price: 0, original_price: null, price_label: "Selamanya", price_description: "", benefits: [],
  mentor_id: null, released_at: null, is_published: false, sort_order: 0,
};

async function simpanUrutan(tabel: string, rows: { id: string }[]) {
  await Promise.all(rows.map((r, i) => t(tabel).update({ sort_order: i }).eq("id", r.id)));
}
function geser<T>(arr: T[], i: number, arah: -1 | 1): T[] {
  const j = i + arah;
  if (j < 0 || j >= arr.length) return arr;
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

export default function BootcampsCMS() {
  const [rows, setRows] = useState<Bootcamp[]>([]);
  const [stat, setStat] = useState<Record<string, { peserta: number; materi: number }>>({});
  const [mentors, setMentors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Bootcamp> | null>(null);
  const [benefitsText, setBenefitsText] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [hapus, setHapus] = useState<Bootcamp | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [kelola, setKelola] = useState<Bootcamp | null>(null);
  const [faqUmum, setFaqUmum] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, eRes, lRes, mRes] = await Promise.all([
      t("bootcamps").select("*").order("sort_order").order("created_at", { ascending: false }),
      t("bootcamp_enrollments").select("bootcamp_id"),
      t("bootcamp_lessons").select("bootcamp_id"),
      supabase.from("mentors").select("id, name").order("name"),
    ]);
    if (bRes.error) toast.error("Gagal memuat program: " + bRes.error.message);
    setRows((bRes.data ?? []) as Bootcamp[]);
    const s: Record<string, { peserta: number; materi: number }> = {};
    (eRes.data ?? []).forEach((r: { bootcamp_id: string }) => { (s[r.bootcamp_id] ??= { peserta: 0, materi: 0 }).peserta++; });
    (lRes.data ?? []).forEach((r: { bootcamp_id: string }) => { (s[r.bootcamp_id] ??= { peserta: 0, materi: 0 }).materi++; });
    setStat(s);
    setMentors(mRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bukaBaru = () => { setForm({ ...KOSONG }); setBenefitsText(""); setSlugTouched(false); };
  const bukaEdit = (b: Bootcamp) => { setForm({ ...b }); setBenefitsText((b.benefits ?? []).join("\n")); setSlugTouched(true); };

  async function simpan() {
    if (!form?.title?.trim()) { toast.error("Judul wajib diisi"); return; }
    const slug = keSlug(form.slug || form.title);
    if (!slug) { toast.error("Slug tidak valid"); return; }
    const price = Math.max(0, Math.round(Number(form.price) || 0));
    const original = form.original_price ? Math.round(Number(form.original_price)) : null;
    if (original !== null && original <= price) { toast.error("Harga coret harus lebih besar dari harga jual — atau kosongkan."); return; }
    if (price > 0 && price < 1000) { toast.error("Harga berbayar minimal Rp1.000 (batas Mayar)."); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(), slug,
      category_label: form.category_label?.trim() || "Bootcamp",
      subtitle: form.subtitle?.trim() || null,
      description: form.description?.trim() || null,
      cover_url: form.cover_url || null,
      lesson_type: form.lesson_type?.trim() || "Video",
      level: form.level || "beginner",
      has_certificate: !!form.has_certificate,
      has_consultation: !!form.has_consultation,
      price, original_price: original,
      price_label: form.price_label?.trim() || "Selamanya",
      price_description: form.price_description?.trim() || null,
      benefits: benefitsText.split("\n").map(s => s.trim()).filter(Boolean),
      mentor_id: form.mentor_id || null,
      released_at: form.released_at || null,
      is_published: !!form.is_published,
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error } = form.id
      ? await t("bootcamps").update(payload).eq("id", form.id)
      : await t("bootcamps").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(/duplicate key.*slug/i.test(error.message) ? "Slug sudah dipakai program lain." : "Gagal menyimpan: " + error.message);
      return;
    }
    toast.success(form.id ? "Program diperbarui" : "Program dibuat — lanjutkan isi kurikulumnya");
    setForm(null);
    load();
  }

  async function toggleTerbit(b: Bootcamp) {
    if (!b.is_published && !(stat[b.id]?.materi)) {
      toast.error("Tambahkan minimal satu materi di Kurikulum sebelum menerbitkan.");
      return;
    }
    setTogglingId(b.id);
    const { error } = await t("bootcamps").update({ is_published: !b.is_published, updated_at: new Date().toISOString() }).eq("id", b.id);
    setTogglingId(null);
    if (error) { toast.error(error.message); return; }
    setRows(prev => prev.map(r => r.id === b.id ? { ...r, is_published: !b.is_published } : r));
    toast.success(!b.is_published ? "Program tampil di halaman Belajar" : "Program disembunyikan");
  }

  async function hapusProgram() {
    if (!hapus) return;
    setMenghapus(true);
    const { error } = await t("bootcamps").delete().eq("id", hapus.id);
    setMenghapus(false);
    if (error) {
      toast.error(/foreign key|violates/i.test(error.message)
        ? "Program ini sudah punya peserta — sembunyikan saja, jangan dihapus."
        : "Gagal menghapus: " + error.message);
      return;
    }
    toast.success("Program dihapus");
    setHapus(null);
    load();
  }

  if (kelola) return <KelolaKurikulum bootcamp={kelola} onBack={() => { setKelola(null); load(); }} />;
  if (faqUmum) return <KelolaFaq bootcampId={null} judul="FAQ Umum (tampil di semua program)" onBack={() => setFaqUmum(false)} />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, flex: 1, minWidth: 260, lineHeight: 1.55 }}>
          Harga di sini adalah nominal yang ditagih lewat Mayar. Pembeli otomatis mendapat akses setelah pembayarannya terverifikasi.
        </p>
        <button onClick={() => setFaqUmum(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <HelpCircle size={15} /> FAQ Umum
        </button>
        <button onClick={bukaBaru}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Program
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : rows.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "46px 24px", textAlign: "center", color: "#94A3B8" }}>
          <ListTree size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .5 }} />
          <div style={{ fontWeight: 700, color: "#475569" }}>Belum ada program</div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>Buat program, isi kurikulumnya, lalu terbitkan.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {rows.map(b => {
            const s = stat[b.id] ?? { peserta: 0, materi: 0 };
            return (
              <div key={b.id} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "16 / 9", background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                  {b.cover_url
                    ? <img src={b.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <ImageIcon size={26} style={{ color: "#CBD5E1" }} />}
                </div>
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8" }}>{b.category_label}</span>
                    {!b.is_published && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEF3C7", color: "#B45309" }}>Draf</span>}
                    {s.materi === 0 && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEE2E2", color: "#B91C1C" }}>Kurikulum kosong</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0F172A", lineHeight: 1.35 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 700 }}>
                    {b.price > 0 ? rupiah(b.price) : "Gratis"}
                    {b.original_price ? <span style={{ fontWeight: 500, color: "#94A3B8", textDecoration: "line-through", marginLeft: 8 }}>{rupiah(b.original_price)}</span> : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#64748B", display: "flex", gap: 14 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Users size={13} /> {s.peserta} peserta</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><ListTree size={13} /> {s.materi} materi</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 10, borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                    <Toggle on={b.is_published} loading={togglingId === b.id} onToggle={() => toggleTerbit(b)} />
                    <span style={{ fontSize: 12, color: "#64748B" }}>{b.is_published ? "Terbit" : "Draf"}</span>
                    <button onClick={() => setKelola(b)} title="Kurikulum & FAQ"
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "7px 10px", borderRadius: 8, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                      <ListTree size={13} /> Kurikulum
                    </button>
                    {b.is_published && (
                      <a href={`/bootcamp/${b.slug}`} target="_blank" rel="noopener noreferrer" title="Lihat halaman"
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#475569", display: "flex" }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button onClick={() => bukaEdit(b)} title="Ubah"
                      style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setHapus(b)} title="Hapus"
                      style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Ubah Program" : "Tambah Program"} onClose={() => setForm(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "24px 28px" }}>
            <Field label="Judul program">
              <input value={form.title ?? ""} placeholder="mis. Complete JavaScript 2026: Nol Sampai Mahir"
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, title: v, slug: slugTouched ? p?.slug : keSlug(v) })); }} style={inputStyle} />
            </Field>
            <Field label="Slug (alamat halaman)" half>
              <input value={form.slug ?? ""} onChange={e => { setSlugTouched(true); setForm(p => ({ ...p, slug: e.target.value })); }} style={inputStyle} />
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>talentika.id/bootcamp/{keSlug(form.slug || form.title || "") || "…"}</div>
            </Field>
            <Field label="Label kategori" half>
              <input value={form.category_label ?? ""} placeholder="Bootcamp / Kelas Online" onChange={e => setForm(p => ({ ...p, category_label: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Subjudul singkat">
              <input value={form.subtitle ?? ""} placeholder="Satu kalimat: apa yang akan dicapai peserta" onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Tentang program">
              <textarea value={form.description ?? ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Untuk siapa program ini, apa yang dipelajari, proyek apa yang dibangun." style={{ ...textareaStyle, minHeight: 110 }} />
            </Field>
            <Field label="Cover">
              <div style={{ maxWidth: 460 }}>
                <UnggahGambar value={form.cover_url} onChange={url => setForm(p => ({ ...p, cover_url: url }))} folder="bootcamp" rasio="16 / 9" saran="1600 × 900 px" />
              </div>
            </Field>
            <Field label="Tipe materi (ditampilkan)" half>
              <input value={form.lesson_type ?? ""} placeholder="Video / Ebook Only / Video & Ebook" onChange={e => setForm(p => ({ ...p, lesson_type: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Tingkatan" half>
              <select value={form.level ?? "beginner"} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} style={selectStyle}>
                {LEVELS.map(l => <option key={l.v} value={l.v}>{l.label}</option>)}
              </select>
            </Field>
            <Field label="Mentor" half>
              <select value={form.mentor_id ?? ""} onChange={e => setForm(p => ({ ...p, mentor_id: e.target.value || null }))} style={selectStyle}>
                <option value="">— Tanpa mentor —</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {mentors.length === 0 && <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>Belum ada mentor — tambahkan di menu Mentor.</div>}
            </Field>
            <Field label="Tanggal rilis" half>
              <input type="date" value={form.released_at ?? ""} onChange={e => setForm(p => ({ ...p, released_at: e.target.value || null }))} style={inputStyle} />
            </Field>

            <div style={{ gridColumn: "span 2", borderTop: "1px solid #F1F5F9", paddingTop: 14, fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Harga & manfaat</div>
            <Field label="Harga jual (Rp) — 0 = gratis" half>
              <input type="number" min={0} value={form.price ?? 0} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="Harga coret (opsional)" half>
              <input type="number" min={0} value={form.original_price ?? ""} onChange={e => setForm(p => ({ ...p, original_price: e.target.value ? Number(e.target.value) : null }))} style={inputStyle} />
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>Isi hanya dengan harga yang benar-benar pernah berlaku.</div>
            </Field>
            <Field label="Label masa akses" half>
              <input value={form.price_label ?? ""} placeholder="Selamanya / Akses 6 bulan" onChange={e => setForm(p => ({ ...p, price_label: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Urutan tampil" half>
              <input type="number" value={form.sort_order ?? 0} onChange={e => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="Kalimat di kartu harga">
              <input value={form.price_description ?? ""} placeholder="mis. Miliki kelas secara permanen dan bangun proyek nyata" onChange={e => setForm(p => ({ ...p, price_description: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Manfaat (satu per baris)">
              <textarea value={benefitsText} onChange={e => setBenefitsText(e.target.value)}
                placeholder={"Akses kelas selamanya\nSertifikat kelulusan\nForum konsultasi"} style={{ ...textareaStyle, minHeight: 100 }} />
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 22, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.has_certificate} onChange={e => setForm(p => ({ ...p, has_certificate: e.target.checked }))} /> Ada sertifikat
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.has_consultation} onChange={e => setForm(p => ({ ...p, has_consultation: e.target.checked }))} /> Ada konsultasi
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 28px 24px" }}>
            <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={simpan} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {hapus && (
        <Confirm message={`Hapus "${hapus.title}" beserta kurikulum & FAQ-nya? Program yang sudah punya peserta tidak bisa dihapus.`}
          onConfirm={hapusProgram} onCancel={() => setHapus(null)} loading={menghapus} />
      )}
    </div>
  );
}

/* ─── Kurikulum: bab & materi ──────────────────────────────────────────── */

function KelolaKurikulum({ bootcamp, onBack }: { bootcamp: Bootcamp; onBack: () => void }) {
  const [tab, setTab] = useState<"kurikulum" | "faq">("kurikulum");
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [babBaru, setBabBaru] = useState("");
  const [lessonForm, setLessonForm] = useState<Partial<Lesson> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, lRes] = await Promise.all([
      t("bootcamp_sections").select("*").eq("bootcamp_id", bootcamp.id).order("sort_order"),
      t("bootcamp_lessons").select("*").eq("bootcamp_id", bootcamp.id).order("sort_order"),
    ]);
    setSections(sRes.data ?? []);
    setLessons(lRes.data ?? []);
    setLoading(false);
  }, [bootcamp.id]);

  useEffect(() => { load(); }, [load]);

  async function tambahBab() {
    if (!babBaru.trim()) return;
    const { error } = await t("bootcamp_sections").insert({ bootcamp_id: bootcamp.id, title: babBaru.trim(), sort_order: sections.length });
    if (error) { toast.error(error.message); return; }
    setBabBaru("");
    load();
  }
  async function ubahBab(s: Section) {
    const judul = window.prompt("Judul bab", s.title);
    if (!judul?.trim() || judul === s.title) return;
    const { error } = await t("bootcamp_sections").update({ title: judul.trim() }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    load();
  }
  async function hapusBab(s: Section) {
    const n = lessons.filter(l => l.section_id === s.id).length;
    if (!window.confirm(`Hapus bab "${s.title}"${n ? ` beserta ${n} materinya` : ""}?`)) return;
    const { error } = await t("bootcamp_sections").delete().eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    load();
  }
  async function geserBab(i: number, arah: -1 | 1) {
    const n = geser(sections, i, arah);
    setSections(n);
    await simpanUrutan("bootcamp_sections", n);
  }
  async function geserMateri(sectionId: string, i: number, arah: -1 | 1) {
    const daftar = lessons.filter(l => l.section_id === sectionId);
    const n = geser(daftar, i, arah);
    setLessons(prev => [...prev.filter(l => l.section_id !== sectionId), ...n]);
    await simpanUrutan("bootcamp_lessons", n);
  }
  async function simpanMateri() {
    if (!lessonForm?.title?.trim()) { toast.error("Judul materi wajib diisi"); return; }
    setSaving(true);
    const payload = {
      bootcamp_id: bootcamp.id,
      section_id: lessonForm.section_id,
      title: lessonForm.title.trim(),
      lesson_type: lessonForm.lesson_type || "video",
      duration_minutes: lessonForm.duration_minutes ?? null,
      content_url: lessonForm.content_url?.trim() || null,
      is_preview: !!lessonForm.is_preview,
    };
    const { error } = lessonForm.id
      ? await t("bootcamp_lessons").update(payload).eq("id", lessonForm.id)
      : await t("bootcamp_lessons").insert({ ...payload, sort_order: lessons.filter(l => l.section_id === lessonForm.section_id).length });
    setSaving(false);
    if (error) { toast.error("Gagal menyimpan: " + error.message); return; }
    setLessonForm(null);
    load();
  }
  async function hapusMateri(l: Lesson) {
    if (!window.confirm(`Hapus materi "${l.title}"?`)) return;
    const { error } = await t("bootcamp_lessons").delete().eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const tanpaUrl = lessons.filter(l => !l.content_url).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#475569", fontWeight: 700, fontSize: 13.5 }}>
          <ArrowLeft size={16} /> Semua program
        </button>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>{bootcamp.title}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
        {([["kurikulum", "Kurikulum"], ["faq", "FAQ Program"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5,
                     color: tab === id ? "#2563EB" : "#64748B", borderBottom: tab === id ? "2px solid #2563EB" : "2px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "faq" ? <KelolaFaq bootcampId={bootcamp.id} /> : loading ? (
        <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : (
        <>
          {tanpaUrl > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, color: "#92400E", marginBottom: 14 }}>
              {tanpaUrl} materi belum punya tautan konten — peserta yang sudah membeli tidak akan bisa membukanya.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map((s, i) => {
              const daftar = lessons.filter(l => l.section_id === s.id);
              return (
                <div key={s.id} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: daftar.length ? "1px solid #F1F5F9" : "none" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#F1F5F9", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12.5 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14.5, color: "#0F172A" }}>{s.title}</span>
                    <IconBtn onClick={() => geserBab(i, -1)} disabled={i === 0}><ArrowUp size={13} /></IconBtn>
                    <IconBtn onClick={() => geserBab(i, 1)} disabled={i === sections.length - 1}><ArrowDown size={13} /></IconBtn>
                    <IconBtn onClick={() => ubahBab(s)}><Edit2 size={13} /></IconBtn>
                    <IconBtn onClick={() => hapusBab(s)} danger><Trash2 size={13} /></IconBtn>
                  </div>
                  {daftar.map((l, j) => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px 9px 52px", fontSize: 13.5 }}>
                      <span style={{ flex: 1, minWidth: 0, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</span>
                      {l.is_preview && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#059669", background: "#ECFDF5", padding: "2px 8px", borderRadius: 99 }}><Eye size={10} style={{ verticalAlign: -1 }} /> Pratinjau</span>}
                      {!l.content_url && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B91C1C", background: "#FEE2E2", padding: "2px 8px", borderRadius: 99 }}>Tanpa tautan</span>}
                      <span style={{ fontSize: 11.5, color: "#64748B", width: 90, textAlign: "right" }}>
                        {LESSON_TYPES.find(x => x.v === l.lesson_type)?.label}{l.duration_minutes ? ` · ${l.duration_minutes}m` : ""}
                      </span>
                      <IconBtn onClick={() => geserMateri(s.id, j, -1)} disabled={j === 0}><ArrowUp size={13} /></IconBtn>
                      <IconBtn onClick={() => geserMateri(s.id, j, 1)} disabled={j === daftar.length - 1}><ArrowDown size={13} /></IconBtn>
                      <IconBtn onClick={() => setLessonForm({ ...l })}><Edit2 size={13} /></IconBtn>
                      <IconBtn onClick={() => hapusMateri(l)} danger><Trash2 size={13} /></IconBtn>
                    </div>
                  ))}
                  <div style={{ padding: "8px 16px 12px 52px" }}>
                    <button onClick={() => setLessonForm({ section_id: s.id, lesson_type: "video", is_preview: false })}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontWeight: 700, fontSize: 12.5 }}>
                      <Plus size={13} /> Tambah materi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input value={babBaru} onChange={e => setBabBaru(e.target.value)} onKeyDown={e => e.key === "Enter" && tambahBab()}
              placeholder="Judul bab baru, mis. Warming Up" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={tambahBab}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              <Plus size={14} /> Tambah Bab
            </button>
          </div>
        </>
      )}

      {lessonForm && (
        <Modal title={lessonForm.id ? "Ubah Materi" : "Tambah Materi"} onClose={() => setLessonForm(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "24px 28px" }}>
            <Field label="Judul materi">
              <input value={lessonForm.title ?? ""} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Bab" half>
              <select value={lessonForm.section_id} onChange={e => setLessonForm(p => ({ ...p, section_id: e.target.value }))} style={selectStyle}>
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </Field>
            <Field label="Jenis" half>
              <select value={lessonForm.lesson_type ?? "video"} onChange={e => setLessonForm(p => ({ ...p, lesson_type: e.target.value }))} style={selectStyle}>
                {LESSON_TYPES.map(x => <option key={x.v} value={x.v}>{x.label}</option>)}
              </select>
            </Field>
            <Field label="Durasi (menit)" half>
              <input type="number" min={0} value={lessonForm.duration_minutes ?? ""} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: e.target.value ? Number(e.target.value) : null }))} style={inputStyle} />
            </Field>
            <Field label="Tautan konten" half>
              <input value={lessonForm.content_url ?? ""} placeholder="https://… (video, PDF, dokumen)" onChange={e => setLessonForm(p => ({ ...p, content_url: e.target.value }))} style={inputStyle} />
            </Field>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                <input type="checkbox" checked={!!lessonForm.is_preview} onChange={e => setLessonForm(p => ({ ...p, is_preview: e.target.checked }))} />
                Pratinjau gratis — bisa dibuka siapa pun tanpa membeli
              </label>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                Tautan materi non-pratinjau hanya dikirim ke peserta terdaftar. Tetap gunakan tautan yang tidak bisa ditebak (mis. video YouTube "Tidak publik"), karena siapa pun yang menerima tautan bisa membagikannya.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 28px 24px" }}>
            <button onClick={() => setLessonForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={simpanMateri} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── FAQ (per program atau umum) ──────────────────────────────────────── */

function KelolaFaq({ bootcampId, judul, onBack }: { bootcampId: string | null; judul?: string; onBack?: () => void }) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Faq> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = t("bootcamp_faqs").select("*").order("sort_order");
    const { data } = await (bootcampId ? q.eq("bootcamp_id", bootcampId) : q.is("bootcamp_id", null));
    setFaqs(data ?? []);
    setLoading(false);
  }, [bootcampId]);

  useEffect(() => { load(); }, [load]);

  async function simpan() {
    if (!form?.question?.trim() || !form?.answer?.trim()) { toast.error("Pertanyaan dan jawaban wajib diisi"); return; }
    setSaving(true);
    const payload = { question: form.question.trim(), answer: form.answer.trim(), bootcamp_id: bootcampId };
    const { error } = form.id
      ? await t("bootcamp_faqs").update(payload).eq("id", form.id)
      : await t("bootcamp_faqs").insert({ ...payload, sort_order: faqs.length });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setForm(null);
    load();
  }
  async function hapus(f: Faq) {
    if (!window.confirm("Hapus pertanyaan ini?")) return;
    const { error } = await t("bootcamp_faqs").delete().eq("id", f.id);
    if (error) { toast.error(error.message); return; }
    load();
  }
  async function geserFaq(i: number, arah: -1 | 1) {
    const n = geser(faqs, i, arah);
    setFaqs(n);
    await simpanUrutan("bootcamp_faqs", n);
  }

  return (
    <div>
      {onBack && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#475569", fontWeight: 700, fontSize: 13.5 }}>
            <ArrowLeft size={16} /> Semua program
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#0F172A" }}>{judul}</div>
        </div>
      )}
      <p style={{ fontSize: 12.5, color: "#64748B", margin: "0 0 12px" }}>
        {bootcampId ? "FAQ khusus program ini tampil di atas FAQ umum." : "FAQ umum tampil di bawah FAQ khusus di setiap halaman program."}
      </p>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={22} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((f, i) => (
            <div key={f.id} style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{f.question}</div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, whiteSpace: "pre-line", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.answer}</div>
              </div>
              <IconBtn onClick={() => geserFaq(i, -1)} disabled={i === 0}><ArrowUp size={13} /></IconBtn>
              <IconBtn onClick={() => geserFaq(i, 1)} disabled={i === faqs.length - 1}><ArrowDown size={13} /></IconBtn>
              <IconBtn onClick={() => setForm({ ...f })}><Edit2 size={13} /></IconBtn>
              <IconBtn onClick={() => hapus(f)} danger><Trash2 size={13} /></IconBtn>
            </div>
          ))}
          {faqs.length === 0 && <div style={{ fontSize: 13, color: "#94A3B8", padding: "10px 0" }}>Belum ada pertanyaan.</div>}
          <button onClick={() => setForm({ question: "", answer: "" })}
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            <Plus size={14} /> Tambah Pertanyaan
          </button>
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Ubah Pertanyaan" : "Tambah Pertanyaan"} onClose={() => setForm(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "24px 28px" }}>
            <Field label="Pertanyaan">
              <input value={form.question ?? ""} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="mis. Apakah kelas ini cocok untuk pemula?" style={inputStyle} />
            </Field>
            <Field label="Jawaban">
              <textarea value={form.answer ?? ""} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} style={{ ...textareaStyle, minHeight: 120 }} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 28px 24px" }}>
            <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={simpan} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "6px 8px", borderRadius: 7, border: `1px solid ${danger ? "#FECACA" : "#E2E8F0"}`, background: "white",
               color: danger ? "#B91C1C" : "#475569", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .35 : 1, display: "flex", flexShrink: 0 }}>
      {children}
    </button>
  );
}
