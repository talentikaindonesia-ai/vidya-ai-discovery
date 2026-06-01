import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Pill, Toggle, Modal, Confirm, Field } from "../adminShared";

interface Article {
  id: string; title: string; slug: string; content: string;
  excerpt: string | null; featured_image_url: string | null;
  category: string | null; tags: string[] | null;
  is_published: boolean | null; is_featured: boolean | null;
  view_count: number | null; reading_time_minutes: number | null;
  seo_title: string | null; seo_description: string | null;
  created_at: string; published_at: string | null;
}

const ARTICLE_CATS = ["karir", "pendidikan", "teknologi", "kesehatan", "bisnis", "gaya_hidup"];
const ARTICLE_CAT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  karir:      { label: "Karir",       bg: "#DBEAFE", color: "#1D4ED8" },
  pendidikan: { label: "Pendidikan",  bg: "#D1FAE5", color: "#065F46" },
  teknologi:  { label: "Teknologi",   bg: "#EDE9FE", color: "#5B21B6" },
  kesehatan:  { label: "Kesehatan",   bg: "#ECFDF5", color: "#047857" },
  bisnis:     { label: "Bisnis",      bg: "#FEF3C7", color: "#92400E" },
  gaya_hidup: { label: "Gaya Hidup",  bg: "#FCE7F3", color: "#9D174D" },
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

export default function ArticlesCMS() {
  const [items, setItems]         = useState<Article[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterPub, setFilterPub] = useState("all");
  const [modal, setModal]         = useState<null | "create" | "edit">(null);
  const [editItem, setEditItem]   = useState<Partial<Article> | null>(null);
  const [delId, setDelId]         = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tagInput, setTagInput]   = useState("");
  const [page, setPage]           = useState(0);
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.title.toLowerCase().includes(q)) return false;
    if (filterCat !== "all" && a.category !== filterCat) return false;
    if (filterPub === "published" && !a.is_published) return false;
    if (filterPub === "draft"     &&  a.is_published) return false;
    return true;
  });
  const paginated = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  function openCreate() {
    setEditItem({ title: "", slug: "", content: "", excerpt: "", category: "karir", tags: [], is_published: false, is_featured: false, reading_time_minutes: 5 });
    setTagInput(""); setModal("create");
  }
  function openEdit(a: Article) { setEditItem({ ...a }); setTagInput(""); setModal("edit"); }
  function close() { setModal(null); setEditItem(null); }

  async function save() {
    if (!editItem?.title || !editItem.content) { toast.error("Judul dan konten wajib diisi"); return; }
    setSaving(true);
    const payload = {
      title: editItem.title,
      slug: editItem.slug || slugify(editItem.title!),
      content: editItem.content,
      excerpt: editItem.excerpt || null,
      featured_image_url: editItem.featured_image_url || null,
      category: editItem.category || "karir",
      tags: editItem.tags ?? [],
      is_published: editItem.is_published ?? false,
      is_featured: editItem.is_featured ?? false,
      reading_time_minutes: editItem.reading_time_minutes ?? 5,
      seo_title: editItem.seo_title || null,
      seo_description: editItem.seo_description || null,
      published_at: editItem.is_published ? (editItem.published_at || new Date().toISOString()) : null,
    };
    if (modal === "create") {
      const { error } = await supabase.from("articles").insert(payload);
      if (error) { toast.error("Gagal menyimpan: " + error.message); }
      else { toast.success("Artikel dibuat"); close(); load(); }
    } else {
      const { error } = await supabase.from("articles").update(payload).eq("id", editItem.id!);
      if (error) { toast.error("Gagal menyimpan: " + error.message); }
      else { toast.success("Artikel diperbarui"); close(); load(); }
    }
    setSaving(false);
  }

  async function deleteItem() {
    if (!delId) return;
    setDeleting(true);
    await supabase.from("articles").delete().eq("id", delId);
    toast.success("Artikel dihapus"); setDelId(null); load();
    setDeleting(false);
  }

  async function togglePub(a: Article) {
    setTogglingId(a.id);
    const is_published = !a.is_published;
    await supabase.from("articles").update({ is_published, published_at: is_published ? new Date().toISOString() : null }).eq("id", a.id);
    setItems(prev => prev.map(x => x.id === a.id ? { ...x, is_published } : x));
    setTogglingId(null);
  }
  async function toggleFeat(a: Article) {
    setTogglingId(a.id + "_f");
    const is_featured = !a.is_featured;
    await supabase.from("articles").update({ is_featured }).eq("id", a.id);
    setItems(prev => prev.map(x => x.id === a.id ? { ...x, is_featured } : x));
    setTogglingId(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || (editItem?.tags ?? []).includes(t)) { setTagInput(""); return; }
    setEditItem(p => ({ ...p, tags: [...(p?.tags ?? []), t] }));
    setTagInput("");
  }
  function removeTag(t: string) { setEditItem(p => ({ ...p, tags: (p?.tags ?? []).filter(x => x !== t) })); }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Cari judul artikel…" style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 150 }}>
          <option value="all">Semua Kategori</option>
          {ARTICLE_CATS.map(c => <option key={c} value={c}>{ARTICLE_CAT_CFG[c]?.label ?? c}</option>)}
        </select>
        <select value={filterPub} onChange={e => { setFilterPub(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 140 }}>
          <option value="all">Semua Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Artikel
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 80px 90px", padding: "10px 20px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", gap: 12 }}>
          <span>Judul</span><span>Kategori</span><span>Baca</span><span>Published</span><span>Featured</span><span>Aksi</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada artikel ditemukan</div>
        ) : paginated.map((a, i) => {
          const catCfg = ARTICLE_CAT_CFG[a.category ?? "karir"] ?? { label: a.category, bg: "#F1F5F9", color: "#475569" };
          return (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 80px 90px", padding: "14px 20px", borderBottom: i < paginated.length - 1 ? "1px solid #F1F5F9" : "none", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, fontFamily: "monospace" }}>/{a.slug}</div>
              </div>
              <div><Pill bg={catCfg.bg} color={catCfg.color}>{catCfg.label}</Pill></div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{a.reading_time_minutes ?? 5} mnt · {a.view_count ?? 0} views</div>
              <div><Toggle on={!!a.is_published} onToggle={() => togglePub(a)} loading={togglingId === a.id} /></div>
              <div><Toggle on={!!a.is_featured} onToggle={() => toggleFeat(a)} loading={togglingId === a.id + "_f"} /></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(a)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#475569" }}>
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => setDelId(a.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>{filtered.length} artikel</span>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{ padding: "5px 12px", borderRadius: 7, border: page === i ? "none" : "1px solid #E2E8F0", background: page === i ? "#2563EB" : "white", color: page === i ? "white" : "#475569", fontWeight: page === i ? 700 : 400, cursor: "pointer", fontSize: 13 }}>{i + 1}</button>
          ))}
        </div>
      )}

      {modal && editItem && (
        <Modal title={modal === "create" ? "Tambah Artikel" : "Edit Artikel"} onClose={close} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", padding: "28px 28px 24px" }}>
            <Field label="Judul">
              <input value={editItem.title ?? ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Judul artikel" style={inputStyle} />
            </Field>
            <Field label="Slug (URL)" half>
              <input value={editItem.slug ?? ""} onChange={e => setEditItem(p => ({ ...p, slug: e.target.value }))} placeholder="url-artikel" style={inputStyle} />
            </Field>
            <Field label="Kategori" half>
              <select value={editItem.category ?? "karir"} onChange={e => setEditItem(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                {ARTICLE_CATS.map(c => <option key={c} value={c}>{ARTICLE_CAT_CFG[c]?.label ?? c}</option>)}
              </select>
            </Field>
            <Field label="Excerpt">
              <textarea value={editItem.excerpt ?? ""} onChange={e => setEditItem(p => ({ ...p, excerpt: e.target.value }))} placeholder="Ringkasan singkat artikel" style={{ ...textareaStyle, minHeight: 64 }} />
            </Field>
            <Field label="Konten">
              <textarea value={editItem.content ?? ""} onChange={e => setEditItem(p => ({ ...p, content: e.target.value }))} placeholder="Isi artikel lengkap (Markdown atau plain text)" style={{ ...textareaStyle, minHeight: 160 }} />
            </Field>
            <Field label="Featured Image URL" half>
              <input value={editItem.featured_image_url ?? ""} onChange={e => setEditItem(p => ({ ...p, featured_image_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </Field>
            <Field label="Waktu Baca (menit)" half>
              <input type="number" min={1} value={editItem.reading_time_minutes ?? 5} onChange={e => setEditItem(p => ({ ...p, reading_time_minutes: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="Tags">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                {(editItem.tags ?? []).map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "#4338CA", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 600 }}>
                    {t}<button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4338CA", padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Tambah tag, Enter" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={addTag} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 600 }}>+</button>
              </div>
            </Field>
            <Field label="SEO Title" half>
              <input value={editItem.seo_title ?? ""} onChange={e => setEditItem(p => ({ ...p, seo_title: e.target.value }))} placeholder="SEO title (opsional)" style={inputStyle} />
            </Field>
            <Field label="SEO Description" half>
              <input value={editItem.seo_description ?? ""} onChange={e => setEditItem(p => ({ ...p, seo_description: e.target.value }))} placeholder="SEO description" style={inputStyle} />
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                <Toggle on={editItem.is_published ?? false} onToggle={() => setEditItem(p => ({ ...p, is_published: !p?.is_published }))} /> Published
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                <Toggle on={editItem.is_featured ?? false} onToggle={() => setEditItem(p => ({ ...p, is_featured: !p?.is_featured }))} /> Featured
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
      {delId && <Confirm message="Hapus artikel ini? Tindakan ini tidak bisa dibatalkan." onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />}
    </div>
  );
}
