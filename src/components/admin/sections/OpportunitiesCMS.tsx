import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Pill, Toggle, Modal, Confirm, Field } from "../adminShared";

interface Opportunity {
  id: string; title: string; description: string | null;
  category: string; organizer: string | null; location: string | null;
  deadline: string | null; url: string | null; poster_url: string | null;
  tags: string[] | null; is_active: boolean | null;
  source_website: string; content_type: string;
  is_sponsored: boolean | null; sponsor_badge: string | null;
  sponsor_cta: string | null; sponsor_until: string | null;
  created_at: string;
}

const OPP_CATS = ["beasiswa", "magang", "lowongan_kerja", "kompetisi", "program", "volunteer"];
const OPP_CAT_CFG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  beasiswa:      { label: "Beasiswa",       bg: "#DBEAFE", color: "#1D4ED8", emoji: "🎓" },
  magang:        { label: "Magang",         bg: "#D1FAE5", color: "#065F46", emoji: "💼" },
  lowongan_kerja:{ label: "Lowongan Kerja", bg: "#FEF3C7", color: "#92400E", emoji: "🏢" },
  kompetisi:     { label: "Kompetisi",      bg: "#FEE2E2", color: "#991B1B", emoji: "🏆" },
  program:       { label: "Program",        bg: "#EDE9FE", color: "#5B21B6", emoji: "📋" },
  volunteer:     { label: "Volunteer",      bg: "#ECFDF5", color: "#047857", emoji: "🤝" },
};

export default function OpportunitiesCMS() {
  const [items, setItems]         = useState<Opportunity[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modal, setModal]         = useState<null | "create" | "edit">(null);
  const [editItem, setEditItem]   = useState<Partial<Opportunity> | null>(null);
  const [delId, setDelId]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tagInput, setTagInput]   = useState("");
  const [page, setPage]           = useState(0);
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("scraped_content").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.title.toLowerCase().includes(q) && !(o.organizer ?? "").toLowerCase().includes(q) && !(o.source_website ?? "").toLowerCase().includes(q)) return false;
    if (filterCat !== "all" && o.category !== filterCat) return false;
    return true;
  });
  const paginated = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  function openCreate() {
    setEditItem({ title: "", description: "", category: "program", organizer: "", location: "", is_active: false, url: "", poster_url: "", tags: [], source_website: "manual", content_type: "program", is_sponsored: false, sponsor_badge: "", sponsor_cta: "", sponsor_until: null });
    setTagInput(""); setModal("create");
  }
  function openEdit(o: Opportunity) { setEditItem({ ...o }); setTagInput(""); setModal("edit"); }
  function close() { setModal(null); setEditItem(null); }

  async function save() {
    if (!editItem?.title) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    const payload = {
      title: editItem.title,
      description: editItem.description || null,
      category: editItem.category || "program",
      content_type: editItem.category || "program",
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

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Cari judul atau penyelenggara…" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 160 }}>
          <option value="all">Semua Kategori</option>
          {OPP_CATS.map(c => <option key={c} value={c}>{OPP_CAT_CFG[c]?.label ?? c}</option>)}
        </select>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Peluang
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 130px 80px 90px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 12 }}>
          <span>Judul</span><span>Kategori</span><span>Penyelenggara</span><span>Deadline</span><span>Published</span><span>Aksi</span>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada peluang ditemukan</div>
        ) : paginated.map((o, i) => {
          const cfg = OPP_CAT_CFG[o.category] ?? { label: o.category, bg: "#F1F5F9", color: "#475569", emoji: "📌" };
          const deadline = o.deadline ? new Date(o.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
          const expired = o.deadline && new Date(o.deadline) < new Date();
          return (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 160px 130px 80px 90px", padding: "14px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #F1F5F9" : "none", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{cfg.emoji} {o.title}</div>
                {o.source_website && o.source_website !== "manual" && <span style={{ fontSize: 10, background: "#EEF2FF", color: "#4338CA", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>{o.source_website}</span>}
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
            <Field label="Penyelenggara" half>
              <input value={editItem.organizer ?? ""} onChange={e => setEditItem(p => ({ ...p, organizer: e.target.value }))} placeholder="Nama institusi / perusahaan" style={inputStyle} />
            </Field>
            <Field label="Deskripsi">
              <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat tentang peluang ini" style={{ ...textareaStyle, minHeight: 100 }} />
            </Field>
            <Field label="Lokasi" half>
              <input value={editItem.location ?? ""} onChange={e => setEditItem(p => ({ ...p, location: e.target.value }))} placeholder="Kota / Provinsi" style={inputStyle} />
            </Field>
            <Field label="Deadline" half>
              <input type="datetime-local" value={editItem.deadline ? editItem.deadline.slice(0, 16) : ""} onChange={e => setEditItem(p => ({ ...p, deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
            </Field>
            <Field label="Link Pendaftaran / URL" half>
              <input value={editItem.url ?? ""} onChange={e => setEditItem(p => ({ ...p, url: e.target.value }))} placeholder="https://daftarkan.di/sini" style={inputStyle} />
            </Field>
            <Field label="Poster / Image URL" half>
              <input value={editItem.poster_url ?? ""} onChange={e => setEditItem(p => ({ ...p, poster_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
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
    </div>
  );
}
