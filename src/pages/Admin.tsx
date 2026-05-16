import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard, BookOpen, Tag, Trophy, FileText,
  Briefcase, Users, Settings, LogOut, ChevronRight,
  Plus, Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight,
  Loader2, X, Save, Star, Lock, Globe, Zap, Clock,
  BarChart2, TrendingUp, CheckCircle, AlertCircle, Filter,
  ArrowUpDown, ArrowLeft, Image, Link2, AlignLeft,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface LearningContent {
  id: string; title: string; description: string | null;
  content_type: string; content_url: string | null; thumbnail_url: string | null;
  duration_minutes: number | null; difficulty_level: string | null;
  category_id: string | null; tags: string[] | null;
  is_featured: boolean | null; is_premium: boolean | null;
  is_active: boolean | null; priority_score: number | null;
  created_at: string;
  learning_categories?: { name: string; color: string | null } | null;
}

interface Category {
  id: string; name: string; description: string | null;
  icon: string | null; color: string | null; is_active: boolean | null;
}

interface Challenge {
  id: string; title: string; description: string | null;
  challenge_type: string; difficulty: string | null;
  xp_reward: number | null; max_participants: number | null;
  start_date: string | null; end_date: string | null; is_active: boolean | null;
}

type NavSection = "overview" | "content" | "categories" | "challenges" | "articles" | "opportunities" | "users";

// ─────────────────────────────────────────────────────────────────────────────
// Design constants
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_W = 240;
const SIDEBAR_BG = "#0F172A";
const SIDEBAR_HOVER = "#1E293B";
const SIDEBAR_ACTIVE = "#2563EB";

const DIFF_CFG: Record<string, { label: string; bg: string; color: string }> = {
  beginner:     { label: "Pemula",   bg: "#D1FAE5", color: "#065F46" },
  intermediate: { label: "Menengah", bg: "#FEF3C7", color: "#92400E" },
  advanced:     { label: "Lanjutan", bg: "#FEE2E2", color: "#991B1B" },
};
const TYPE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  course:   { label: "Kursus",  bg: "#DBEAFE", color: "#1D4ED8" },
  video:    { label: "Video",   bg: "#EDE9FE", color: "#5B21B6" },
  article:  { label: "Artikel", bg: "#ECFDF5", color: "#065F46" },
  module:   { label: "Modul",   bg: "#FFF7ED", color: "#C2410C" },
  quiz:     { label: "Kuis",    bg: "#FDF2F8", color: "#9D174D" },
};

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview",     label: "Overview",         icon: LayoutDashboard },
  { id: "content",      label: "Learning Content",  icon: BookOpen },
  { id: "categories",   label: "Kategori",          icon: Tag },
  { id: "challenges",   label: "Tantangan",         icon: Trophy },
  { id: "articles",     label: "Artikel",           icon: FileText },
  { id: "opportunities",label: "Peluang",           icon: Briefcase },
  { id: "users",        label: "Pengguna",          icon: Users },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Toggle({ on, onToggle, loading }: { on: boolean; onToggle: () => void; loading?: boolean }) {
  return (
    <button onClick={onToggle} disabled={loading} style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, padding: 0 }}>
      {on
        ? <ToggleRight size={22} style={{ color: "#2563EB" }} />
        : <ToggleLeft  size={22} style={{ color: "#94A3B8" }} />}
    </button>
  );
}

function StatCard({ icon: Icon, value, label, sub, color }: { icon: React.ElementType; value: string | number; label: string; sub: string; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", fontFamily: "var(--tk-font-display)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "white", borderRadius: 20, width: "100%",
        maxWidth: wide ? 820 : 600, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #E2E8F0" }}>
          <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "#0F172A", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm dialog
// ─────────────────────────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel, loading }: { message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 48px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>🗑️</div>
        <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "#0F172A", textAlign: "center", margin: "0 0 10px" }}>Hapus Konten?</h3>
        <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#DC2626", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Field helpers
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ ...(half ? { gridColumn: "span 1" } : { gridColumn: "span 2" }) }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FAFAFA", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", minHeight: 80 };

// ─────────────────────────────────────────────────────────────────────────────
// Learning Content CRUD
// ─────────────────────────────────────────────────────────────────────────────
function LearningContentCMS({ categories }: { categories: Category[] }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [modal, setModal] = useState<null | "create" | "edit">(null);
  const [editItem, setEditItem] = useState<Partial<LearningContent> | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("learning_content")
      .select("*, learning_categories(name, color)")
      .order("priority_score", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.title.toLowerCase().includes(q) && !(c.description ?? "").toLowerCase().includes(q)) return false;
    if (filterType !== "all" && c.content_type !== filterType) return false;
    if (filterCat !== "all" && c.category_id !== filterCat) return false;
    if (filterDiff !== "all" && c.difficulty_level !== filterDiff) return false;
    return true;
  });
  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  const openCreate = () => {
    setEditItem({ content_type: "course", difficulty_level: "beginner", is_active: true, is_featured: false, is_premium: false, priority_score: 50, tags: [] });
    setTagInput("");
    setModal("create");
  };
  const openEdit = (item: LearningContent) => {
    setEditItem({ ...item });
    setTagInput("");
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditItem(null); };

  const save = async () => {
    if (!editItem?.title?.trim()) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: editItem.title, description: editItem.description || null,
        content_type: editItem.content_type || "course",
        content_url: editItem.content_url || null,
        thumbnail_url: editItem.thumbnail_url || null,
        duration_minutes: editItem.duration_minutes ? Number(editItem.duration_minutes) : null,
        difficulty_level: editItem.difficulty_level || "beginner",
        category_id: editItem.category_id || null,
        tags: editItem.tags || [],
        is_featured: editItem.is_featured ?? false,
        is_premium: editItem.is_premium ?? false,
        is_active: editItem.is_active ?? true,
        priority_score: editItem.priority_score ? Number(editItem.priority_score) : 50,
      };
      if (modal === "edit" && editItem.id) {
        const { error } = await supabase.from("learning_content").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Konten diperbarui!");
      } else {
        const { error } = await supabase.from("learning_content").insert(payload);
        if (error) throw error;
        toast.success("Konten ditambahkan!");
      }
      closeModal();
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleField = async (id: string, field: "is_active" | "is_featured" | "is_premium", val: boolean) => {
    setTogglingId(id + field);
    await supabase.from("learning_content").update({ [field]: val }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
    setTogglingId(null);
  };

  const deleteItem = async () => {
    if (!delId) return;
    setDeleting(true);
    const { error } = await supabase.from("learning_content").delete().eq("id", delId);
    if (error) { toast.error(error.message); }
    else { toast.success("Konten dihapus"); setItems(prev => prev.filter(i => i.id !== delId)); }
    setDelId(null);
    setDeleting(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t) return;
    setEditItem(prev => ({ ...prev, tags: [...(prev?.tags ?? []), t] }));
    setTagInput("");
  };
  const removeTag = (t: string) => setEditItem(prev => ({ ...prev, tags: (prev?.tags ?? []).filter(x => x !== t) }));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Cari konten..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        {/* Filters */}
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 130 }}>
          <option value="all">Semua Tipe</option>
          {Object.entries(TYPE_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 150 }}>
          <option value="all">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setPage(0); }} style={{ ...selectStyle, width: 130 }}>
          <option value="all">Semua Level</option>
          {Object.entries(DIFF_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <button onClick={openCreate} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
          borderRadius: 9, border: "none", background: "#2563EB", color: "white",
          fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(37,99,235,.3)",
        }}>
          <Plus size={15} /> Tambah Konten
        </button>
      </div>

      {/* Count bar */}
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
        Menampilkan <strong>{filtered.length}</strong> dari <strong>{items.length}</strong> konten
        {filtered.length > PAGE && <> · Halaman {page + 1}/{totalPages}</>}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} />
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Konten", "Kategori", "Tipe", "Level", "Durasi", "Aktif", "Unggulan", "Premium", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
                  Tidak ada konten ditemukan
                </td></tr>
              )}
              {paged.map((c, idx) => {
                const diffCfg = DIFF_CFG[c.difficulty_level ?? ""] ?? { label: "–", bg: "#F1F5F9", color: "#64748B" };
                const typeCfg = TYPE_CFG[c.content_type] ?? { label: c.content_type, bg: "#F1F5F9", color: "#64748B" };
                const catColor = c.learning_categories?.color ?? "#6366F1";
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}>
                    {/* Title */}
                    <td style={{ padding: "12px 14px", maxWidth: 280 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.title}>{c.title}</div>
                      {c.tags && c.tags.length > 0 && (
                        <div style={{ marginTop: 3, display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {c.tags.slice(0, 2).map(t => (
                            <span key={t} style={{ background: "#EEF2FF", color: "#4F46E5", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>#{t}</span>
                          ))}
                          {c.tags.length > 2 && <span style={{ fontSize: 10, color: "#94A3B8" }}>+{c.tags.length - 2}</span>}
                        </div>
                      )}
                    </td>
                    {/* Category */}
                    <td style={{ padding: "12px 14px" }}>
                      {c.learning_categories ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
                          {c.learning_categories.name}
                        </span>
                      ) : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}
                    </td>
                    {/* Type */}
                    <td style={{ padding: "12px 14px" }}><Pill bg={typeCfg.bg} color={typeCfg.color}>{typeCfg.label}</Pill></td>
                    {/* Difficulty */}
                    <td style={{ padding: "12px 14px" }}><Pill bg={diffCfg.bg} color={diffCfg.color}>{diffCfg.label}</Pill></td>
                    {/* Duration */}
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                      {c.duration_minutes ? `${c.duration_minutes} mnt` : "—"}
                    </td>
                    {/* Active */}
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_active ?? false} loading={togglingId === c.id + "is_active"}
                        onToggle={() => toggleField(c.id, "is_active", !(c.is_active ?? false))} />
                    </td>
                    {/* Featured */}
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_featured ?? false} loading={togglingId === c.id + "is_featured"}
                        onToggle={() => toggleField(c.id, "is_featured", !(c.is_featured ?? false))} />
                    </td>
                    {/* Premium */}
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_premium ?? false} loading={togglingId === c.id + "is_premium"}
                        onToggle={() => toggleField(c.id, "is_premium", !(c.is_premium ?? false))} />
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => navigate(`/learning/content/${c.id}`)} title="Preview"
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(c)} title="Edit"
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #DBEAFE", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDelId(c.id)} title="Hapus"
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderTop: "1px solid #F1F5F9" }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, fontSize: 13, fontWeight: 600 }}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 32, height: 32, borderRadius: 7, border: "none", background: page === i ? "#2563EB" : "white", color: page === i ? "white" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600, border: page === i ? "none" : "1px solid #E2E8F0" } as any}>
                {i + 1}
              </button>
            ))}
            <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1, fontSize: 13, fontWeight: 600 }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && editItem && (
        <Modal title={modal === "create" ? "Tambah Konten Baru" : "Edit Konten"} onClose={closeModal} wide>
          <div style={{ padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Judul Konten">
                <input value={editItem.title ?? ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="Judul konten..." />
              </Field>
              <Field label="Tipe Konten" half>
                <select value={editItem.content_type ?? "course"} onChange={e => setEditItem(p => ({ ...p, content_type: e.target.value }))} style={selectStyle}>
                  {Object.entries(TYPE_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Kategori" half>
                <select value={editItem.category_id ?? ""} onChange={e => setEditItem(p => ({ ...p, category_id: e.target.value || null }))} style={selectStyle}>
                  <option value="">Pilih Kategori...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Deskripsi">
                <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} style={textareaStyle} placeholder="Deskripsi singkat konten..." />
              </Field>
              <Field label="URL Konten" half>
                <input value={editItem.content_url ?? ""} onChange={e => setEditItem(p => ({ ...p, content_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </Field>
              <Field label="URL Thumbnail" half>
                <input value={editItem.thumbnail_url ?? ""} onChange={e => setEditItem(p => ({ ...p, thumbnail_url: e.target.value }))} style={inputStyle} placeholder="https://..." />
              </Field>
              <Field label="Level Kesulitan" half>
                <select value={editItem.difficulty_level ?? "beginner"} onChange={e => setEditItem(p => ({ ...p, difficulty_level: e.target.value }))} style={selectStyle}>
                  {Object.entries(DIFF_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Durasi (menit)" half>
                <input type="number" min={0} value={editItem.duration_minutes ?? ""} onChange={e => setEditItem(p => ({ ...p, duration_minutes: Number(e.target.value) }))} style={inputStyle} placeholder="60" />
              </Field>
              <Field label="Priority Score" half>
                <input type="number" min={0} max={100} value={editItem.priority_score ?? 50} onChange={e => setEditItem(p => ({ ...p, priority_score: Number(e.target.value) }))} style={inputStyle} />
              </Field>
              {/* Tags */}
              <Field label="Tags">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    style={{ ...inputStyle, flex: 1 }} placeholder="Ketik tag lalu Enter..." />
                  <button onClick={addTag} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "#EEF2FF", color: "#4F46E5", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(editItem.tags ?? []).map(t => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEF2FF", color: "#4F46E5", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                      #{t}
                      <button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366F1", lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                    </span>
                  ))}
                </div>
              </Field>
              {/* Toggles */}
              <div style={{ gridColumn: "span 2", display: "flex", gap: 24, padding: "12px 0", borderTop: "1px solid #F1F5F9" }}>
                {([
                  ["is_active", "Aktif", "#059669"],
                  ["is_featured", "Unggulan ⭐", "#D97706"],
                  ["is_premium", "Premium 🔒", "#7C3AED"],
                ] as [keyof LearningContent, string, string][]).map(([field, label, clr]) => (
                  <label key={field} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    <Toggle on={!!(editItem as any)[field]}
                      onToggle={() => setEditItem(p => ({ ...p, [field]: !(p as any)[field] }))} />
                    <span style={{ color: (editItem as any)[field] ? clr : "#94A3B8" }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={closeModal} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Batal
              </button>
              <button onClick={save} disabled={saving} style={{
                padding: "10px 24px", borderRadius: 9, border: "none",
                background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 7,
                boxShadow: "0 2px 8px rgba(37,99,235,.3)",
              }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : modal === "create" ? "Simpan Konten" : "Perbarui Konten"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {delId && (
        <Confirm
          message="Konten yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?"
          onConfirm={deleteItem}
          onCancel={() => setDelId(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories CRUD
// ─────────────────────────────────────────────────────────────────────────────
function CategoriesCMS({ onReload }: { onReload: () => void }) {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Category> | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("learning_categories").select("*").order("name");
    setItems(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem({ is_active: true, color: "#6366F1" }); setModal(true); };
  const openEdit   = (item: Category) => { setEditItem({ ...item }); setModal(true); };
  const close      = () => { setModal(false); setEditItem(null); };

  const save = async () => {
    if (!editItem?.name?.trim()) { toast.error("Nama wajib diisi"); return; }
    setSaving(true);
    try {
      const payload = { name: editItem.name, description: editItem.description || null, icon: editItem.icon || null, color: editItem.color || "#6366F1", is_active: editItem.is_active ?? true };
      if (editItem.id) {
        await supabase.from("learning_categories").update(payload).eq("id", editItem.id);
        toast.success("Kategori diperbarui!");
      } else {
        await supabase.from("learning_categories").insert(payload);
        toast.success("Kategori ditambahkan!");
      }
      close(); load(); onReload();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deleteItem = async () => {
    if (!delId) return;
    setDeleting(true);
    const { error } = await supabase.from("learning_categories").delete().eq("id", delId);
    if (error) toast.error(error.message);
    else { toast.success("Kategori dihapus"); load(); onReload(); }
    setDelId(null); setDeleting(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#64748B" }}><strong>{items.length}</strong> kategori</span>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Kategori
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Nama", "Deskripsi", "Warna", "Aktif", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                        {c.icon || "📁"}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#0F172A" }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#64748B", maxWidth: 300 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{c.description || "—"}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, background: c.color ?? "#6366F1" }} />
                      <span style={{ fontSize: 12, color: "#64748B", fontFamily: "monospace" }}>{c.color ?? "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <Pill bg={c.is_active ? "#D1FAE5" : "#F1F5F9"} color={c.is_active ? "#065F46" : "#64748B"}>
                      {c.is_active ? "Aktif" : "Nonaktif"}
                    </Pill>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #DBEAFE", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDelId(c.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && editItem && (
        <Modal title={editItem.id ? "Edit Kategori" : "Tambah Kategori"} onClose={close}>
          <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Nama Kategori">
              <input value={editItem.name ?? ""} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Nama kategori..." />
            </Field>
            <Field label="Icon (emoji)" half>
              <input value={editItem.icon ?? ""} onChange={e => setEditItem(p => ({ ...p, icon: e.target.value }))} style={inputStyle} placeholder="📚" maxLength={4} />
            </Field>
            <Field label="Warna (hex)" half>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={editItem.color ?? "#6366F1"} onChange={e => setEditItem(p => ({ ...p, color: e.target.value }))} style={{ width: 40, height: 36, border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                <input value={editItem.color ?? ""} onChange={e => setEditItem(p => ({ ...p, color: e.target.value }))} style={{ ...inputStyle, flex: 1 }} placeholder="#6366F1" />
              </div>
            </Field>
            <Field label="Deskripsi">
              <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} style={textareaStyle} placeholder="Deskripsi kategori..." />
            </Field>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                <Toggle on={editItem.is_active ?? true} onToggle={() => setEditItem(p => ({ ...p, is_active: !p?.is_active }))} />
                <span>Aktif</span>
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
      {delId && <Confirm message="Hapus kategori ini?" onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Challenges CRUD
// ─────────────────────────────────────────────────────────────────────────────
const CH_TYPES = ["daily","weekly","monthly","learning","quiz","project","community","skill","competition"];
const CH_DIFF  = ["easy","medium","hard"];

function ChallengesCMS() {
  const [items, setItems]   = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editItem, setEditItem] = useState<Partial<Challenge> | null>(null);
  const [delId, setDelId]   = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("community_challenges").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));
  const openCreate = () => { setEditItem({ is_active: true, challenge_type: "learning", difficulty: "medium", xp_reward: 500, max_participants: 500 }); setModal(true); };
  const openEdit = (item: Challenge) => { setEditItem({ ...item }); setModal(true); };
  const close = () => { setModal(false); setEditItem(null); };

  const save = async () => {
    if (!editItem?.title?.trim()) { toast.error("Judul wajib diisi"); return; }
    setSaving(true);
    try {
      const payload: any = {
        title: editItem.title, description: editItem.description || null,
        challenge_type: editItem.challenge_type || "learning",
        difficulty: editItem.difficulty || "medium",
        xp_reward: Number(editItem.xp_reward || 0),
        max_participants: Number(editItem.max_participants || 0),
        start_date: editItem.start_date || null,
        end_date: editItem.end_date || null,
        is_active: editItem.is_active ?? true,
      };
      if (editItem.id) {
        await supabase.from("community_challenges").update(payload).eq("id", editItem.id);
        toast.success("Tantangan diperbarui!");
      } else {
        await supabase.from("community_challenges").insert(payload);
        toast.success("Tantangan ditambahkan!");
      }
      close(); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const deleteItem = async () => {
    if (!delId) return;
    setDeleting(true);
    await supabase.from("community_challenges").delete().eq("id", delId);
    toast.success("Tantangan dihapus");
    setDelId(null); setDeleting(false); load();
  };

  const toggleActive = async (id: string, val: boolean) => {
    await supabase.from("community_challenges").update({ is_active: val }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: val } : i));
  };

  const TYPE_EMOJI: Record<string, string> = { daily:"🔥",weekly:"📅",monthly:"🌟",learning:"📚",quiz:"🧠",project:"💻",community:"🤝",skill:"⚡",competition:"🏆" };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari tantangan..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Tantangan
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Tantangan","Tipe","Level","XP","Peserta","Berakhir","Aktif","Aksi"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>Tidak ada tantangan</td></tr>
              )}
              {filtered.map((c, idx) => {
                const dCfg = DIFF_CFG[c.difficulty ?? ""] ?? { label: "–", bg: "#F1F5F9", color: "#64748B" };
                const endDays = c.end_date ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) : null;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 14px", maxWidth: 260 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                      {c.description && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</div>}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 14 }}>{TYPE_EMOJI[c.challenge_type] ?? "🎯"}</span>
                      <span style={{ fontSize: 12, color: "#475569", marginLeft: 5 }}>{c.challenge_type}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}><Pill bg={dCfg.bg} color={dCfg.color}>{dCfg.label}</Pill></td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#C2410C" }}>{c.xp_reward?.toLocaleString() ?? "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569" }}>{c.max_participants?.toLocaleString() ?? "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: endDays !== null && endDays <= 3 ? "#DC2626" : "#475569" }}>
                      {endDays === null ? "—" : endDays < 0 ? "Selesai" : `${endDays}h lagi`}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_active ?? false} onToggle={() => toggleActive(c.id, !(c.is_active ?? false))} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(c)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #DBEAFE", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDelId(c.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && editItem && (
        <Modal title={editItem.id ? "Edit Tantangan" : "Tambah Tantangan"} onClose={close} wide>
          <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Judul Tantangan">
              <input value={editItem.title ?? ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="Judul tantangan..." />
            </Field>
            <Field label="Tipe" half>
              <select value={editItem.challenge_type ?? "learning"} onChange={e => setEditItem(p => ({ ...p, challenge_type: e.target.value }))} style={selectStyle}>
                {CH_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
              </select>
            </Field>
            <Field label="Level" half>
              <select value={editItem.difficulty ?? "medium"} onChange={e => setEditItem(p => ({ ...p, difficulty: e.target.value }))} style={selectStyle}>
                {CH_DIFF.map(d => <option key={d} value={d}>{DIFF_CFG[d]?.label ?? d}</option>)}
              </select>
            </Field>
            <Field label="Deskripsi">
              <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} style={textareaStyle} placeholder="Deskripsi tantangan..." />
            </Field>
            <Field label="XP Reward" half>
              <input type="number" min={0} value={editItem.xp_reward ?? ""} onChange={e => setEditItem(p => ({ ...p, xp_reward: Number(e.target.value) }))} style={inputStyle} placeholder="500" />
            </Field>
            <Field label="Max Peserta" half>
              <input type="number" min={0} value={editItem.max_participants ?? ""} onChange={e => setEditItem(p => ({ ...p, max_participants: Number(e.target.value) }))} style={inputStyle} placeholder="500" />
            </Field>
            <Field label="Tanggal Mulai" half>
              <input type="datetime-local" value={editItem.start_date ? editItem.start_date.slice(0,16) : ""} onChange={e => setEditItem(p => ({ ...p, start_date: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
            </Field>
            <Field label="Tanggal Selesai" half>
              <input type="datetime-local" value={editItem.end_date ? editItem.end_date.slice(0,16) : ""} onChange={e => setEditItem(p => ({ ...p, end_date: e.target.value ? new Date(e.target.value).toISOString() : null }))} style={inputStyle} />
            </Field>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <Toggle on={editItem.is_active ?? true} onToggle={() => setEditItem(p => ({ ...p, is_active: !p?.is_active }))} />
                Aktif
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
      {delId && <Confirm message="Hapus tantangan ini?" onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview section
// ─────────────────────────────────────────────────────────────────────────────
function Overview({ onNav }: { onNav: (s: NavSection) => void }) {
  const [stats, setStats] = useState({ content: 0, active: 0, categories: 0, challenges: 0, users: 0, featured: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("learning_content").select("id, is_active, is_featured", { count: "exact" }),
      supabase.from("learning_categories").select("id", { count: "exact" }),
      supabase.from("community_challenges").select("id", { count: "exact" }),
      supabase.from("profiles").select("user_id", { count: "exact" }),
    ]).then(([{ data: c }, { count: cats }, { count: chal }, { count: users }]) => {
      setStats({
        content: c?.length ?? 0,
        active: c?.filter(x => x.is_active).length ?? 0,
        featured: c?.filter(x => x.is_featured).length ?? 0,
        categories: cats ?? 0,
        challenges: chal ?? 0,
        users: users ?? 0,
      });
    });
  }, []);

  const quickLinks = [
    { label: "Tambah Konten Baru", desc: "Tambah video, artikel, atau kursus", icon: BookOpen, color: "#2563EB", action: () => onNav("content") },
    { label: "Tambah Kategori", desc: "Buat kategori baru untuk konten", icon: Tag, color: "#7C3AED", action: () => onNav("categories") },
    { label: "Buat Tantangan", desc: "Buat tantangan dengan XP reward", icon: Trophy, color: "#D97706", action: () => onNav("challenges") },
  ];

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard icon={BookOpen}    value={stats.content}    label="Total Konten"     sub="Learning content" color="#2563EB" />
        <StatCard icon={CheckCircle} value={stats.active}     label="Konten Aktif"     sub="Ditampilkan"      color="#059669" />
        <StatCard icon={Star}        value={stats.featured}   label="Konten Unggulan"  sub="Featured"         color="#D97706" />
        <StatCard icon={Tag}         value={stats.categories} label="Kategori"         sub="Learning topics"  color="#7C3AED" />
        <StatCard icon={Trophy}      value={stats.challenges} label="Tantangan"        sub="Community"        color="#DC2626" />
        <StatCard icon={Users}       value={stats.users}      label="Pengguna"         sub="Terdaftar"        color="#0891B2" />
      </div>

      {/* Quick actions */}
      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "#0F172A", margin: "0 0 14px" }}>Aksi Cepat</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {quickLinks.map(({ label, desc, icon: Icon, color, action }) => (
          <button key={label} onClick={action} style={{
            background: "white", border: "1px solid #E2E8F0", borderRadius: 14,
            padding: "20px 22px", textAlign: "left", cursor: "pointer",
            transition: "all .15s", boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}22`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,.04)"; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Admin shell
// ─────────────────────────────────────────────────────────────────────────────
const Admin = () => {
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<NavSection>("overview");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("Akses ditolak. Bukan admin."); navigate("/dashboard"); return; }
      loadCategories();
      setLoading(false);
    })();
  }, [navigate]);

  const loadCategories = async () => {
    const { data } = await supabase.from("learning_categories").select("*").order("name");
    setCategories(data ?? []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#2563EB" }} />
      </div>
    );
  }

  const PAGE_TITLES: Record<NavSection, string> = {
    overview: "Overview", content: "Learning Content", categories: "Kategori",
    challenges: "Tantangan", articles: "Artikel", opportunities: "Peluang", users: "Pengguna",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, background: SIDEBAR_BG,
        display: "flex", flexDirection: "column",
        position: "fixed", inset: "0 auto 0 0", zIndex: 100,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
            <div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "white" }}>Talentika</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 1, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>Admin CMS</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 11,
                padding: "10px 12px", borderRadius: 10, border: "none", marginBottom: 2,
                background: active ? SIDEBAR_ACTIVE : "transparent",
                color: active ? "white" : "rgba(255,255,255,.65)",
                fontWeight: active ? 700 : 500, fontSize: 13.5,
                fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                transition: "all .15s", textAlign: "left",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.65)"; } }}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 10px 20px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => navigate("/dashboard")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer", marginBottom: 4, fontFamily: "var(--tk-font-sans)" }}>
            <ArrowLeft size={15} /> Dashboard
          </button>
          <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "rgba(239,68,68,.75)", fontSize: 13, cursor: "pointer", fontFamily: "var(--tk-font-sans)" }}>
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: SIDEBAR_W, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Top bar */}
        <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>Admin</span>
            <ChevronRight size={12} color="#CBD5E1" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "var(--tk-font-display)" }}>{PAGE_TITLES[section]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Admin Panel</span>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "28px 32px 48px" }}>
          {/* Page heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "#0F172A", margin: "0 0 4px" }}>
              {PAGE_TITLES[section]}
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              {section === "overview" && "Ringkasan semua konten dan aktivitas platform"}
              {section === "content" && "Kelola semua konten pembelajaran — tambah, edit, toggle status"}
              {section === "categories" && "Kelola kategori konten pembelajaran"}
              {section === "challenges" && "Kelola tantangan komunitas dengan XP reward"}
              {section === "articles" && "Kelola artikel dan blog platform"}
              {section === "opportunities" && "Kelola peluang kerja dan magang"}
              {section === "users" && "Kelola pengguna terdaftar"}
            </p>
          </div>

          {/* Section content */}
          {section === "overview"     && <Overview onNav={setSection} />}
          {section === "content"      && <LearningContentCMS categories={categories} />}
          {section === "categories"   && <CategoriesCMS onReload={loadCategories} />}
          {section === "challenges"   && <ChallengesCMS />}
          {(section === "articles" || section === "opportunities" || section === "users") && (
            <div style={{ background: "white", borderRadius: 16, padding: "48px 32px", textAlign: "center", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🚧</div>
              <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "#0F172A", margin: "0 0 8px" }}>
                Segera Hadir
              </h3>
              <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
                Modul <strong>{PAGE_TITLES[section]}</strong> sedang dalam pengembangan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
