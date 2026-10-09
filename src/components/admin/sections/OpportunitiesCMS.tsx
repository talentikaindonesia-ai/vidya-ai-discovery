import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Pill, Toggle, Modal, Confirm, Field } from "../adminShared";
import SumberResmiPanel from "./SumberResmiPanel";
import UnggahGambar from "../UnggahGambar";

/* Agregator pihak ke-3 yang pernah mengisi papan ini. Daftar yang sama
   ditegakkan di database lewat host_agregator() — cek di sini hanya supaya
   admin diberi tahu SEBELUM menyimpan, bukan pengganti penjaga di server. */
const AGREGATOR = [
  "opportunitydesk.org", "scholarshipscorner.website", "opportunitiescircle.com",
  "opportunitiesforyouth.org", "scholarships360.org", "worldscholarshipforum.com",
  "afterschoolafrica.com", "youthop.com", "scholars4dev.com", "indbeasiswa.com",
  "internships.com", "goabroad.com", "ted.com", "topcoder.com", "openideo.com",
];
function urlAgregator(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return AGREGATOR.find(a => h === a || h.endsWith("." + a)) ?? null;
  } catch { return null; }
}

interface Opportunity {
  id: string; title: string; description: string | null;
  category: string; organizer: string | null; location: string | null;
  deadline: string | null; url: string | null; poster_url: string | null;
  tags: string[] | null; is_active: boolean | null;
  source_website: string; content_type: string;
  opportunity_type: string | null;
  opportunity_field: string | null; field_locked: boolean | null;
  is_sponsored: boolean | null; sponsor_badge: string | null;
  sponsor_cta: string | null; sponsor_until: string | null;
  created_at: string;
  source_tier: number | null; last_verified_at: string | null; report_count: number | null;
}

const TIER_OPTS = [
  { v: 1, label: "Tier 1 — Sumber Resmi", color: "#059669" },
  { v: 2, label: "Tier 2 — Aggregator", color: "#2563EB" },
  { v: 3, label: "Tier 3 — Perlu Review", color: "#D97706" },
];

// Broad feed category (kept for the edit form — it's what the scraper assigns)
const OPP_CATS = ["beasiswa", "magang", "lowongan_kerja", "kompetisi", "konferensi", "program", "volunteer"];
const OPP_CAT_CFG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  beasiswa:      { label: "Beasiswa",       bg: "#DBEAFE", color: "#1D4ED8", emoji: "🎓" },
  magang:        { label: "Magang",         bg: "#D1FAE5", color: "#065F46", emoji: "💼" },
  lowongan_kerja:{ label: "Lowongan Kerja", bg: "#FEF3C7", color: "#92400E", emoji: "🏢" },
  kompetisi:     { label: "Kompetisi",      bg: "#FEE2E2", color: "#991B1B", emoji: "🏆" },
  konferensi:    { label: "Konferensi",     bg: "#E0F2FE", color: "#0369A1", emoji: "🎤" },
  program:       { label: "Program",        bg: "#EDE9FE", color: "#5B21B6", emoji: "📋" },
  volunteer:     { label: "Volunteer",      bg: "#ECFDF5", color: "#047857", emoji: "🤝" },
};

/* Specific jenis peluang — derived server-side from title+description by
   classify_opportunity(), so it is far more accurate than the feed category. */
const OPP_TYPES = [
  "beasiswa", "beasiswa_s1", "beasiswa_s2", "beasiswa_s3", "magang", "fellowship",
  "lowongan_kerja", "kompetisi", "hackathon", "konferensi", "workshop",
  "pertukaran", "volunteer", "grant", "lainnya",
];
const OPP_TYPE_CFG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  beasiswa:      { label: "Beasiswa (umum)",  bg: "#DBEAFE", color: "#1D4ED8", emoji: "🎓" },
  beasiswa_s1:   { label: "Beasiswa S1",      bg: "#DBEAFE", color: "#1E40AF", emoji: "🎓" },
  beasiswa_s2:   { label: "Beasiswa S2",      bg: "#C7D2FE", color: "#3730A3", emoji: "🎓" },
  beasiswa_s3:   { label: "Beasiswa S3",      bg: "#E0E7FF", color: "#4338CA", emoji: "🎓" },
  magang:        { label: "Magang",           bg: "#D1FAE5", color: "#065F46", emoji: "💼" },
  fellowship:    { label: "Fellowship",       bg: "#FCE7F3", color: "#9D174D", emoji: "🌟" },
  lowongan_kerja:{ label: "Lowongan Kerja",   bg: "#FEF3C7", color: "#92400E", emoji: "🏢" },
  kompetisi:     { label: "Kompetisi",        bg: "#FEE2E2", color: "#991B1B", emoji: "🏆" },
  hackathon:     { label: "Hackathon",        bg: "#FFE4E6", color: "#BE123C", emoji: "💻" },
  konferensi:    { label: "Konferensi",       bg: "#E0F2FE", color: "#0369A1", emoji: "🎤" },
  workshop:      { label: "Workshop/Pelatihan", bg: "#F3E8FF", color: "#6B21A8", emoji: "🛠" },
  pertukaran:    { label: "Pertukaran",       bg: "#CCFBF1", color: "#0F766E", emoji: "✈️" },
  volunteer:     { label: "Volunteer",        bg: "#ECFDF5", color: "#047857", emoji: "🤝" },
  grant:         { label: "Grant/Pendanaan",  bg: "#FEF9C3", color: "#854D0E", emoji: "💰" },
  lainnya:       { label: "Lainnya",          bg: "#F1F5F9", color: "#475569", emoji: "📌" },
};
const typeCfg = (t: string | null) =>
  OPP_TYPE_CFG[t ?? ""] ?? { label: t || "—", bg: "#F1F5F9", color: "#475569", emoji: "📌" };

/* BIDANG — dimensi kedua. Ini yang dicocokkan dengan kepribadian RIASEC.
   Berbeda dari JENIS: semua siswa tetap melihat semua jenis peluang; yang
   berbeda antar siswa adalah ITEM-nya, diurutkan lewat kecocokan bidang. */
const OPP_FIELDS = [
  "teknologi", "sains_riset", "kesehatan", "lingkungan", "bisnis", "keuangan",
  "seni_kreatif", "media_komunikasi", "sosial_kemanusiaan", "pendidikan",
  "hukum_politik", "umum",
];
const OPP_FIELD_CFG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  teknologi:          { label: "Teknologi",        bg: "#DBEAFE", color: "#1D4ED8", emoji: "💻" },
  sains_riset:        { label: "Sains & Riset",    bg: "#E0E7FF", color: "#4338CA", emoji: "🔬" },
  kesehatan:          { label: "Kesehatan",        bg: "#FEE2E2", color: "#991B1B", emoji: "🩺" },
  lingkungan:         { label: "Lingkungan",       bg: "#D1FAE5", color: "#065F46", emoji: "🌱" },
  bisnis:             { label: "Bisnis",           bg: "#FEF3C7", color: "#92400E", emoji: "💼" },
  keuangan:           { label: "Keuangan",         bg: "#FEF9C3", color: "#854D0E", emoji: "💰" },
  seni_kreatif:       { label: "Seni & Kreatif",   bg: "#FCE7F3", color: "#9D174D", emoji: "🎨" },
  media_komunikasi:   { label: "Media & Komunikasi", bg: "#F3E8FF", color: "#6B21A8", emoji: "📢" },
  sosial_kemanusiaan: { label: "Sosial",           bg: "#ECFDF5", color: "#047857", emoji: "🤝" },
  pendidikan:         { label: "Pendidikan",       bg: "#E0F2FE", color: "#0369A1", emoji: "📚" },
  hukum_politik:      { label: "Hukum & Politik",  bg: "#F1F5F9", color: "#334155", emoji: "⚖️" },
  umum:               { label: "Umum",             bg: "#F8FAFC", color: "#64748B", emoji: "🌐" },
};
const fieldCfg = (f: string | null) =>
  OPP_FIELD_CFG[f ?? ""] ?? { label: f || "—", bg: "#F8FAFC", color: "#64748B", emoji: "🌐" };

export default function OpportunitiesCMS() {
  const [items, setItems]         = useState<Opportunity[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterField, setFilterField] = useState("all");
  const [modal, setModal]         = useState<null | "create" | "edit">(null);
  const [editItem, setEditItem]   = useState<Partial<Opportunity> | null>(null);
  const [delId, setDelId]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tagInput, setTagInput]   = useState("");
  const [page, setPage]           = useState(0);
  const [quality, setQuality]     = useState<"all" | "reported" | "expired" | "indonesia" | "manual" | "inactive">("all");
  const [view, setView]           = useState<"peluang" | "sumber">("peluang");
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("scraped_content").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Scraper otomatis dihentikan 2026-09-07: semua feed-nya situs internasional
  // (443 dari 468 peluang berlokasi "Internasional", hanya 6 Indonesia).
  // Peluang sekarang dikurasi manual lewat tombol "Tambah Peluang" di bawah.

  const filtered = items.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.title.toLowerCase().includes(q) && !(o.organizer ?? "").toLowerCase().includes(q) && !(o.source_website ?? "").toLowerCase().includes(q)) return false;
    if (filterCat !== "all" && o.category !== filterCat) return false;
    if (filterType !== "all" && o.opportunity_type !== filterType) return false;
    if (filterField !== "all" && o.opportunity_field !== filterField) return false;
    const expired = o.deadline && new Date(o.deadline) < new Date();
    if (quality === "reported" && !(o.report_count && o.report_count > 0)) return false;
    if (quality === "expired" && !expired) return false;
    if (quality === "indonesia" && !((o.location || "").toLowerCase().includes("indonesia") || (o.tags || []).includes("indonesia"))) return false;
    if (quality === "manual" && o.source_website !== "manual") return false;
    if (quality === "inactive" && o.is_active) return false;
    return true;
  });
  const paginated = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  function openCreate() {
    setEditItem({ title: "", description: "", category: "program", organizer: "", location: "Indonesia", is_active: false, url: "", poster_url: "", tags: ["indonesia"], source_website: "manual", content_type: "program", is_sponsored: false, sponsor_badge: "", sponsor_cta: "", sponsor_until: null, source_tier: 1 });
    setTagInput(""); setModal("create");
  }

  /* Dipanggil dari daftar Sumber Resmi: buka form dengan penyelenggara,
     wilayah, kategori dan URL sumber sudah terisi — supaya kurasi manual
     tidak berarti mengetik ulang hal yang sudah kita tahu. */
  function kurasiDariSumber(s: { nama: string; penyelenggara: string | null; url: string; wilayah: string; kategori: string; jenjang: string | null }) {
    const indo = s.wilayah === "indonesia";
    setEditItem({
      title: s.nama,
      description: "",
      category: s.kategori,
      content_type: s.kategori,
      organizer: s.penyelenggara ?? s.nama,
      location: indo ? "Indonesia" : "",
      tags: indo ? ["indonesia"] : [],
      url: s.url,
      is_active: false,
      source_website: "manual",
      source_tier: 1,
      poster_url: "",
      is_sponsored: false,
      sponsor_badge: "", sponsor_cta: "", sponsor_until: null,
    });
    setTagInput("");
    setView("peluang");
    setModal("create");
  }
  function openEdit(o: Opportunity) { setEditItem({ ...o }); setTagInput(""); setModal("edit"); }

  // Filter wilayah di papan siswa membaca location+tags dan mencari kata
  // "indonesia" / nama negara ASEAN. Mengetik "Bandung" saja TIDAK terbaca
  // sebagai Indonesia — jadi wilayah dipilih eksplisit lewat tag, bukan ditebak.
  const wilayah = (editItem?.tags ?? []).includes("indonesia") ? "indonesia"
    : (editItem?.tags ?? []).includes("asia tenggara") ? "asia tenggara"
    : "internasional";
  function setWilayah(w: string) {
    setEditItem(p => {
      const sisa = (p?.tags ?? []).filter(t => t !== "indonesia" && t !== "asia tenggara");
      return { ...p, tags: w === "internasional" ? sisa : [...sisa, w] };
    });
  }
  function close() { setModal(null); setEditItem(null); }

  async function save() {
    if (!editItem?.title) { toast.error("Judul wajib diisi"); return; }
    const agr = urlAgregator(editItem.url ?? "");
    if (agr) {
      toast.error(`${agr} adalah agregator pihak ke-3 — pakai tautan dari situs resmi penyelenggara.`);
      return;
    }
    setSaving(true);
    const payload = {
      title: editItem.title,
      description: editItem.description || null,
      category: editItem.category || "program",
      content_type: editItem.category || "program",
      // null → the DB trigger auto-classifies from title+description
      opportunity_type: editItem.opportunity_type || null,
      // field_locked=true → klasifikasi otomatis tidak akan menimpanya
      opportunity_field: editItem.field_locked ? (editItem.opportunity_field || null) : null,
      field_locked: !!editItem.field_locked,
      organizer: editItem.organizer || null,
      location: editItem.location || null,
      deadline: editItem.deadline || null,
      url: editItem.url || "",
      poster_url: editItem.poster_url || null,
      tags: editItem.tags ?? [],
      is_active: editItem.is_active ?? false,
      is_manual: true,
      source_website: editItem.source_website || "manual",
      is_sponsored: editItem.is_sponsored ?? false,
      sponsor_badge: editItem.sponsor_badge || null,
      sponsor_cta: editItem.sponsor_cta || null,
      sponsor_until: editItem.sponsor_until || null,
      source_tier: editItem.source_tier ?? 2,
      last_verified_at: new Date().toISOString(),
    };
    if (modal === "create") {
      const { error } = await supabase.from("scraped_content").insert(payload);
      if (error) { toast.error("Gagal: " + error.message); }
      else { toast.success("Peluang ditambahkan"); close(); load(); }
    } else {
      const { error } = await supabase.from("scraped_content").update(payload).eq("id", editItem.id!);
      if (error) { toast.error("Gagal: " + error.message); }
      else { toast.success("Peluang diperbarui"); close(); load(); }
    }
    setSaving(false);
  }

  async function deleteItem() {
    if (!delId) return;
    setDeleting(true);
    await supabase.from("scraped_content").delete().eq("id", delId);
    toast.success("Peluang dihapus"); setDelId(null); load();
    setDeleting(false);
  }

  async function togglePub(o: Opportunity) {
    setTogglingId(o.id);
    const is_active = !o.is_active;
    await supabase.from("scraped_content").update({ is_active }).eq("id", o.id);
    setItems(prev => prev.map(x => x.id === o.id ? { ...x, is_active } : x));
    setTogglingId(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || (editItem?.tags ?? []).includes(t)) { setTagInput(""); return; }
    setEditItem(p => ({ ...p, tags: [...(p?.tags ?? []), t] })); setTagInput("");
  }
  function removeTag(t: string) { setEditItem(p => ({ ...p, tags: (p?.tags ?? []).filter(x => x !== t) })); }

  const activeCnt = items.filter(o => o.is_active).length;
  const reportedCnt = items.filter(o => (o.report_count ?? 0) > 0).length;
  const idCnt = items.filter(o => o.is_active && ((o.location || "").toLowerCase().includes("indonesia") || (o.tags || []).includes("indonesia"))).length;
  const manualCnt = items.filter(o => o.source_website === "manual").length;

  // Count per jenis (active only) → drives the filter dropdown labels
  const typeCounts = items.reduce<Record<string, number>>((acc, o) => {
    if (!o.is_active) return acc;
    const t = o.opportunity_type ?? "lainnya";
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const fieldCounts = items.reduce<Record<string, number>>((acc, o) => {
    if (!o.is_active) return acc;
    const f = o.opportunity_field ?? "umum";
    acc[f] = (acc[f] ?? 0) + 1;
    return acc;
  }, {});
  const lockedCnt = items.filter(o => o.field_locked).length;

  return (
    <div>
      {/* Peluang vs daftar kerja Sumber Resmi */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
        {([
          { id: "peluang", label: "Peluang" },
          { id: "sumber",  label: "Sumber Resmi" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            style={{
              padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13.5,
              color: view === t.id ? "#2563EB" : "#64748B",
              borderBottom: view === t.id ? "2px solid #2563EB" : "2px solid transparent",
              marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === "sumber" ? <SumberResmiPanel onKurasi={kurasiDariSumber} /> : (
      <>
      {/* Quality stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Peluang Aktif", value: activeCnt, color: "#2563EB" },
          { label: "🇮🇩 Konten Indonesia", value: idCnt, color: "#059669" },
          { label: "Kurasi Manual", value: manualCnt, color: "#7C3AED" },
          { label: "⚠ Dilaporkan User", value: reportedCnt, color: reportedCnt > 0 ? "#DC2626" : "#94A3B8" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 12, border: "1px solid #E2E8F0", padding: "13px 16px" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: s.color, fontFamily: "var(--tk-font-display)" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Cari judul atau penyelenggara…" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 210 }}>
          <option value="all">🔎 Semua Jenis Peluang</option>
          {OPP_TYPES.filter(t => typeCounts[t]).map(t => (
            <option key={t} value={t}>{OPP_TYPE_CFG[t].emoji} {OPP_TYPE_CFG[t].label} ({typeCounts[t]})</option>
          ))}
        </select>
        <select value={filterField} onChange={e => { setFilterField(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 210 }}>
          <option value="all">🎯 Semua Bidang</option>
          {OPP_FIELDS.filter(f => fieldCounts[f]).map(f => (
            <option key={f} value={f}>{OPP_FIELD_CFG[f].emoji} {OPP_FIELD_CFG[f].label} ({fieldCounts[f]})</option>
          ))}
        </select>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 150 }}>
          <option value="all">Semua Kategori</option>
          {OPP_CATS.map(c => <option key={c} value={c}>{OPP_CAT_CFG[c]?.label ?? c}</option>)}
        </select>
        <select value={quality} onChange={e => { setQuality(e.target.value as typeof quality); setPage(0); }} style={{ ...selectStyle, width: 170 }}>
          <option value="all">Semua Status</option>
          <option value="reported">⚠ Dilaporkan User</option>
          <option value="expired">Deadline Lewat</option>
          <option value="indonesia">🇮🇩 Indonesia</option>
          <option value="manual">Kurasi Manual</option>
          <option value="inactive">Nonaktif</option>
        </select>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Peluang
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 130px 80px 90px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 12 }}>
          <span>Judul</span><span>Jenis Peluang</span><span>Penyelenggara</span><span>Deadline</span><span>Published</span><span>Aksi</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada peluang ditemukan</div>
        ) : paginated.map((o, i) => {
          const cfg = typeCfg(o.opportunity_type);
          const deadline = o.deadline ? new Date(o.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
          const expired = o.deadline && new Date(o.deadline) < new Date();
          return (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 130px 80px 90px", padding: "14px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #F1F5F9" : "none", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{cfg.emoji} {o.title}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
                  {(() => { const fc = fieldCfg(o.opportunity_field); return (
                    <span style={{ fontSize: 10, background: fc.bg, color: fc.color, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}
                      title={o.field_locked ? "Bidang dikunci manual oleh admin" : "Bidang hasil klasifikasi otomatis"}>
                      {fc.emoji} {fc.label}{o.field_locked ? " 🔒" : ""}
                    </span>
                  ); })()}
                  <span style={{ fontSize: 10, background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }} title="Kategori dari feed sumber">{OPP_CAT_CFG[o.category]?.label ?? o.category}</span>
                  {o.source_website && o.source_website !== "manual" && <span style={{ fontSize: 10, background: "#EEF2FF", color: "#4338CA", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{o.source_website}</span>}
                  {o.source_website === "manual" && <span style={{ fontSize: 10, background: "#F5F3FF", color: "#7C3AED", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>✍ kurasi</span>}
                  {o.source_tier === 1 && <span style={{ fontSize: 10, background: "#ECFDF5", color: "#059669", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>✓ resmi</span>}
                  {(o.report_count ?? 0) > 0 && <span style={{ fontSize: 10, background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>⚠ {o.report_count} laporan</span>}
                </div>
              </div>
              <div><Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill></div>
              <div style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.organizer ?? "—"}</div>
              <div style={{ fontSize: 12, color: expired ? "#DC2626" : "#64748B", fontWeight: expired ? 600 : 400 }}>{deadline}{expired && " ⚠"}</div>
              <div><Toggle on={!!o.is_active} onToggle={() => togglePub(o)} loading={togglingId === o.id} /></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(o)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => setDelId(o.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>{filtered.length} peluang</span>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ padding: "5px 12px", borderRadius: 7, border: page === i ? "none" : "1px solid #E2E8F0", background: page === i ? "#2563EB" : "white", color: page === i ? "white" : "#475569", fontWeight: page === i ? 700 : 400, cursor: "pointer", fontSize: 13 }}>{i + 1}</button>
          ))}
        </div>
      )}

      {modal && editItem && (
        <Modal title={modal === "create" ? "Tambah Peluang" : "Edit Peluang"} onClose={close} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", padding: "28px 28px 24px" }}>
            <Field label="Judul">
              <input value={editItem.title ?? ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value }))} placeholder="Nama beasiswa / lowongan / program" style={inputStyle} />
            </Field>
            <Field label="Kategori" half>
              <select value={editItem.category ?? "program"} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                {OPP_CATS.map(c => <option key={c} value={c}>{OPP_CAT_CFG[c]?.label ?? c}</option>)}
              </select>
            </Field>
            <Field label="Jenis Peluang (spesifik)" half>
              <select value={editItem.opportunity_type ?? ""} onChange={e => setEditItem(p => ({ ...p, opportunity_type: e.target.value || null }))} style={selectStyle}>
                <option value="">✨ Otomatis (dari judul & deskripsi)</option>
                {OPP_TYPES.map(t => <option key={t} value={t}>{OPP_TYPE_CFG[t].emoji} {OPP_TYPE_CFG[t].label}</option>)}
              </select>
            </Field>
            <Field label="Bidang (dicocokkan ke kepribadian siswa)" half>
              <select
                value={editItem.field_locked ? (editItem.opportunity_field ?? "") : ""}
                onChange={e => {
                  const v = e.target.value;
                  // Memilih bidang = mengunci; "Otomatis" = lepas kunci lalu
                  // biarkan trigger DB mengklasifikasi ulang
                  setEditItem(p => ({
                    ...p,
                    opportunity_field: v || null,
                    field_locked: !!v,
                  }));
                }}
                style={selectStyle}
              >
                <option value="">
                  ✨ Otomatis{editItem.opportunity_field && !editItem.field_locked ? ` — terdeteksi: ${fieldCfg(editItem.opportunity_field).label}` : ""}
                </option>
                {OPP_FIELDS.map(f => <option key={f} value={f}>🔒 {OPP_FIELD_CFG[f].emoji} {OPP_FIELD_CFG[f].label}</option>)}
              </select>
            </Field>
            <Field label="Penyelenggara" half>
              <input value={editItem.organizer ?? ""} onChange={e => setEditItem(p => ({ ...p, organizer: e.target.value }))} placeholder="Nama institusi / perusahaan" style={inputStyle} />
            </Field>
            <Field label="Deskripsi">
              <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat tentang peluang ini" style={{ ...textareaStyle, minHeight: 100 }} />
            </Field>
            <Field label="Wilayah (menentukan filter 🇮🇩 di papan siswa)" half>
              <select value={wilayah} onChange={e => setWilayah(e.target.value)} style={inputStyle}>
                <option value="indonesia">🇮🇩 Indonesia</option>
                <option value="asia tenggara">🌏 Asia Tenggara</option>
                <option value="internasional">🌐 Internasional</option>
              </select>
            </Field>
            <Field label="Lokasi (detail)" half>
              <input value={editItem.location ?? ""} onChange={e => setEditItem(p => ({ ...p, location: e.target.value }))} placeholder="Jakarta / Online / Seluruh Indonesia" style={inputStyle} />
            </Field>
            <Field label="Deadline" half>
              <input type="datetime-local" value={editItem.deadline ? editItem.deadline.slice(0, 16) : ""} onChange={e => setEditItem(p => ({ ...p, deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
            </Field>
            <Field label="Link Pendaftaran / URL — wajib situs resmi penyelenggara" half>
              <input value={editItem.url ?? ""} onChange={e => setEditItem(p => ({ ...p, url: e.target.value }))} placeholder="https://lpdp.kemenkeu.go.id/…" style={inputStyle} />
              {urlAgregator(editItem.url ?? "") && (
                <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 600, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 10px", lineHeight: 1.5 }}>
                  {urlAgregator(editItem.url ?? "")} adalah agregator pihak ke-3. Cari halaman aslinya
                  di situs penyelenggara — database akan menolak tautan ini.
                </div>
              )}
            </Field>
            <Field label="Poster" half>
              <UnggahGambar value={editItem.poster_url} onChange={url => setEditItem(p => ({ ...p, poster_url: url }))}
                folder="peluang" rasio="4 / 5" saran="1080 × 1350 px" />
            </Field>
            <Field label="Tags">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {(editItem.tags ?? []).map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "#4338CA", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>
                    {t}<button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4338CA", padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Tag, Enter" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addTag} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 600 }}>+</button>
              </div>
            </Field>
            <Field label="Sumber Website" half>
              <input value={editItem.source_website ?? "manual"} onChange={e => setEditItem(p => ({ ...p, source_website: e.target.value }))} placeholder="manual / kemendikbud.go.id / dll" style={inputStyle} />
            </Field>
            <Field label="Kredibilitas Sumber" half>
              <select value={editItem.source_tier ?? 2} onChange={e => setEditItem(p => ({ ...p, source_tier: parseInt(e.target.value) }))} style={selectStyle}>
                {TIER_OPTS.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </Field>
            {/* ── Sponsored section ── */}
            <div style={{ gridColumn: "span 2", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#92400E", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                ⭐ Konten Sponsor (opsional — berbayar)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10 }}>
                  <Toggle on={editItem.is_sponsored ?? false} onToggle={() => setEditItem(p => ({ ...p, is_sponsored: !p?.is_sponsored }))} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Tandai sebagai Konten Sponsor</span>
                </div>
                {editItem.is_sponsored && (<>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#78350F", marginBottom: 4 }}>Badge Label</div>
                    <input value={editItem.sponsor_badge ?? ""} onChange={e => setEditItem(p => ({ ...p, sponsor_badge: e.target.value }))} placeholder="Eksklusif · Partner Resmi" style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#78350F", marginBottom: 4 }}>Sponsor URL (tracking)</div>
                    <input value={editItem.sponsor_cta ?? ""} onChange={e => setEditItem(p => ({ ...p, sponsor_cta: e.target.value }))} placeholder="https://sponsor.link/..." style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#78350F", marginBottom: 4 }}>Sponsor Berakhir</div>
                    <input type="date" value={editItem.sponsor_until ? editItem.sponsor_until.slice(0, 10) : ""} onChange={e => setEditItem(p => ({ ...p, sponsor_until: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
                  </div>
                </>)}
              </div>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                <Toggle on={editItem.is_active ?? false} onToggle={() => setEditItem(p => ({ ...p, is_active: !p?.is_active }))} /> Aktif / Published
              </label>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={close} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {delId && <Confirm message="Hapus peluang ini? Tindakan ini tidak bisa dibatalkan." onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />}
      </>
      )}
    </div>
  );
}
