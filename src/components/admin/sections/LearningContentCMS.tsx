import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Eye, Loader2, Save, FileQuestion, X, Copy, Upload, Image as ImageIcon, ListChecks } from "lucide-react";
import {
  LearningContent, Category, DIFF_CFG, TYPE_CFG,
  inputStyle, selectStyle, textareaStyle,
  Pill, Toggle, Modal, Confirm, Field,
} from "../adminShared";

// Extracts a YouTube video ID from common URL shapes and returns its thumbnail, or null.
function youtubeThumb(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

export default function LearningContentCMS({ categories }: { categories: Category[] }) {
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
  const [objectiveInput, setObjectiveInput] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE = 15;

  // ── LMS: engagement stats, bulk selection, quiz builder, students drawer ──
  const [stats, setStats] = useState<Map<string, { enrolled: number; completed: number; avg_progress: number; quiz_questions: number }>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [studentsFor, setStudentsFor] = useState<LearningContent | null>(null);
  const [quizFor, setQuizFor] = useState<LearningContent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, statsRes] = await Promise.all([
      supabase
        .from("learning_content")
        .select("*, learning_categories(name, color)")
        .order("priority_score", { ascending: false }),
      (supabase.rpc as any)("admin_content_stats"),
    ]);
    setItems(data ?? []);
    if (Array.isArray(statsRes.data)) {
      setStats(new Map(statsRes.data.map((s: any) => [s.content_id, s])));
    }
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
    setEditItem({ content_type: "course", difficulty_level: "beginner", is_active: true, is_featured: false, is_premium: false, priority_score: 50, tags: [], riasec_types: [], mi_types: [], learning_objectives: [] });
    setTagInput(""); setObjectiveInput(""); setModal("create");
  };
  const openEdit = (item: LearningContent) => { setEditItem({ ...item }); setTagInput(""); setObjectiveInput(""); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditItem(null); };

  const duplicateItem = (item: LearningContent) => {
    const { id, created_at, learning_categories, ...rest } = item;
    setEditItem({ ...rest, title: `${item.title} (Salinan)`, is_active: false });
    setTagInput(""); setObjectiveInput(""); setModal("create");
    toast.info("Konten disalin — tinjau lalu simpan sebagai konten baru");
  };

  // Thumbnail upload to the public content-media bucket (also used by ContentEditor)
  const uploadThumbnail = async (file: File) => {
    setUploadingThumb(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("content-media").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("content-media").getPublicUrl(path);
      setEditItem(p => ({ ...p, thumbnail_url: data.publicUrl }));
      toast.success("Thumbnail diunggah!");
    } catch (e: any) {
      toast.error("Gagal unggah: " + e.message);
    } finally {
      setUploadingThumb(false);
    }
  };

  const addObjective = () => {
    const t = objectiveInput.trim();
    if (!t) return;
    setEditItem(prev => ({ ...prev, learning_objectives: [...(prev?.learning_objectives ?? []), t] }));
    setObjectiveInput("");
  };
  const removeObjective = (i: number) =>
    setEditItem(prev => ({ ...prev, learning_objectives: (prev?.learning_objectives ?? []).filter((_, j) => j !== i) }));

  const save = async () => {
    if (!editItem?.title?.trim()) { toast.error("Judul wajib diisi"); return; }
    if (!editItem?.category_id) { toast.error("Kategori wajib dipilih"); return; }
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
        riasec_types: editItem.riasec_types ?? [],
        mi_types: editItem.mi_types ?? [],
        learning_objectives: editItem.learning_objectives ?? [],
      };
      if (modal === "edit" && editItem.id) {
        const { error } = await supabase.from("learning_content").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Konten diperbarui!");
      } else {
        const { error } = await supabase.from("learning_content").insert(payload);
        if (error) throw error;
        // DB trigger auto-notifies students whose RIASEC type matches
        toast.success(
          payload.is_active && (payload.riasec_types?.length ?? 0) > 0
            ? "Konten ditambahkan! 🔔 Siswa dengan tipe kepribadian cocok otomatis diberi notifikasi."
            : "Konten ditambahkan!"
        );
      }
      closeModal(); load();
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
    setDelId(null); setDeleting(false);
  };

  // ── Bulk actions on selected rows ──
  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () =>
    setSelected(prev => prev.size === paged.length ? new Set() : new Set(paged.map(c => c.id)));

  const bulkUpdate = async (patch: Record<string, boolean>) => {
    setBulkBusy(true);
    const { error } = await supabase.from("learning_content").update(patch).in("id", [...selected]);
    setBulkBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${selected.size} konten diperbarui`);
    setSelected(new Set()); load();
  };
  const bulkDelete = async () => {
    if (!confirm(`Hapus ${selected.size} konten? Tidak bisa dikembalikan.`)) return;
    setBulkBusy(true);
    const { error } = await supabase.from("learning_content").delete().in("id", [...selected]);
    setBulkBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${selected.size} konten dihapus`);
    setSelected(new Set()); load();
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
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Cari konten..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
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
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(37,99,235,.3)" }}>
          <Plus size={15} /> Tambah Konten
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
        Menampilkan <strong>{filtered.length}</strong> dari <strong>{items.length}</strong> konten
        {filtered.length > PAGE && <> · Halaman {page + 1}/{totalPages}</>}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "10px 16px", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>{selected.size} dipilih</span>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {([
              ["Aktifkan", { is_active: true }, "#059669"],
              ["Nonaktifkan", { is_active: false }, "#64748B"],
              ["Jadikan Premium", { is_premium: true }, "#7C3AED"],
              ["Jadikan Gratis", { is_premium: false }, "#2563EB"],
            ] as [string, Record<string, boolean>, string][]).map(([label, patch, clr]) => (
              <button key={label} disabled={bulkBusy} onClick={() => bulkUpdate(patch)}
                style={{ padding: "6px 13px", borderRadius: 8, border: `1px solid ${clr}33`, background: "white", color: clr, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {label}
              </button>
            ))}
            <button disabled={bulkBusy} onClick={bulkDelete}
              style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#FFF5F5", color: "#DC2626", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Hapus
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Batal</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} />
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "11px 10px 11px 14px", width: 34 }}>
                  <input type="checkbox" checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                </th>
                {["Konten", "Kategori", "Tipe", "Level", "Durasi", "Peserta", "Aktif", "Unggulan", "Premium", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={11} style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada konten ditemukan</td></tr>
              )}
              {paged.map((c, idx) => {
                const diffCfg = DIFF_CFG[c.difficulty_level ?? ""] ?? { label: "–", bg: "#F1F5F9", color: "#64748B" };
                const typeCfg = TYPE_CFG[c.content_type] ?? { label: c.content_type, bg: "#F1F5F9", color: "#64748B" };
                const catColor = c.learning_categories?.color ?? "#6366F1";
                const st = stats.get(c.id);
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: selected.has(c.id) ? "#EFF6FF" : idx % 2 === 0 ? "white" : "#FAFAFA" }}>
                    <td style={{ padding: "12px 10px 12px 14px" }}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} style={{ cursor: "pointer" }} />
                    </td>
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
                    <td style={{ padding: "12px 14px" }}>
                      {c.learning_categories ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
                          {c.learning_categories.name}
                        </span>
                      ) : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px" }}><Pill bg={typeCfg.bg} color={typeCfg.color}>{typeCfg.label}</Pill></td>
                    <td style={{ padding: "12px 14px" }}><Pill bg={diffCfg.bg} color={diffCfg.color}>{diffCfg.label}</Pill></td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>
                      {c.duration_minutes ? `${c.duration_minutes} mnt` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <button onClick={() => setStudentsFor(c)} title="Lihat siswa yang mengambil konten ini"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12.5, color: (st?.enrolled ?? 0) > 0 ? "#1D4ED8" : "#94A3B8", fontWeight: 700 }}>
                        👥 {st?.enrolled ?? 0}
                        {(st?.completed ?? 0) > 0 && <span style={{ color: "#059669" }}> · ✓{st?.completed}</span>}
                      </button>
                      {(st?.quiz_questions ?? 0) > 0 && (
                        <div style={{ fontSize: 10.5, color: "#7C3AED", fontWeight: 700, marginTop: 2 }}>📝 {st?.quiz_questions} soal</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_active ?? false} loading={togglingId === c.id + "is_active"}
                        onToggle={() => toggleField(c.id, "is_active", !(c.is_active ?? false))} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_featured ?? false} loading={togglingId === c.id + "is_featured"}
                        onToggle={() => toggleField(c.id, "is_featured", !(c.is_featured ?? false))} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <Toggle on={c.is_premium ?? false} loading={togglingId === c.id + "is_premium"}
                        onToggle={() => toggleField(c.id, "is_premium", !(c.is_premium ?? false))} />
                    </td>
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
                        <button onClick={() => setQuizFor(c)} title="Kelola Kuis"
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E9D5FF", background: "#FAF5FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED" }}>
                          <FileQuestion size={14} />
                        </button>
                        <button onClick={() => duplicateItem(c)} title="Duplikat"
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                          <Copy size={14} />
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

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderTop: "1px solid #F1F5F9" }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1, fontSize: 13, fontWeight: 600 }}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 32, height: 32, borderRadius: 7, border: page === i ? "none" : "1px solid #E2E8F0", background: page === i ? "#2563EB" : "white", color: page === i ? "white" : "#475569", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
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

      {modal && editItem && (
        <Modal title={modal === "create" ? "Tambah Konten Baru" : "Edit Konten"} onClose={closeModal} wide>
          <div style={{ padding: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Judul Konten *">
                <input value={editItem.title ?? ""} onChange={e => setEditItem(p => ({ ...p, title: e.target.value }))} style={{ ...inputStyle, borderColor: !editItem.title?.trim() ? "#FCA5A5" : undefined }} placeholder="Judul konten..." />
              </Field>
              <Field label="Tipe Konten" half>
                <select value={editItem.content_type ?? "course"} onChange={e => setEditItem(p => ({ ...p, content_type: e.target.value }))} style={selectStyle}>
                  {Object.entries(TYPE_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="Kategori *" half>
                <select value={editItem.category_id ?? ""} onChange={e => setEditItem(p => ({ ...p, category_id: e.target.value || null }))} style={selectStyle}>
                  <option value="">Pilih Kategori...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Deskripsi">
                <textarea value={editItem.description ?? ""} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} style={textareaStyle} placeholder="Deskripsi singkat konten..." />
              </Field>
              <Field label="URL Konten" half>
                <input value={editItem.content_url ?? ""} onChange={e => setEditItem(p => ({ ...p, content_url: e.target.value }))} style={inputStyle} placeholder="https://youtube.com/... atau https://..." />
                {(() => {
                  const yt = youtubeThumb(editItem.content_url);
                  return yt ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                      <img src={yt} alt="Preview YouTube" style={{ width: 64, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid #E2E8F0" }} />
                      <span style={{ fontSize: 11.5, color: "#059669", fontWeight: 700 }}>✓ Video YouTube terdeteksi</span>
                    </div>
                  ) : null;
                })()}
              </Field>
              <Field label="Thumbnail" half>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {editItem.thumbnail_url ? (
                    <img src={editItem.thumbnail_url} alt="Thumbnail" style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 7, border: "1px solid #E2E8F0", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 40, borderRadius: 7, border: "1px dashed #E2E8F0", display: "grid", placeItems: "center", flexShrink: 0, color: "#CBD5E1" }}>
                      <ImageIcon size={16} />
                    </div>
                  )}
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", cursor: uploadingThumb ? "wait" : "pointer", fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                    {uploadingThumb ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploadingThumb ? "Mengunggah…" : "Unggah"}
                    <input type="file" accept="image/*" hidden disabled={uploadingThumb}
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadThumbnail(f); e.target.value = ""; }} />
                  </label>
                </div>
                <input value={editItem.thumbnail_url ?? ""} onChange={e => setEditItem(p => ({ ...p, thumbnail_url: e.target.value }))} style={{ ...inputStyle, marginTop: 7, fontSize: 12 }} placeholder="atau tempel URL gambar…" />
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
              <Field label="Tags">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    style={{ ...inputStyle, flex: 1 }} placeholder="Ketik tag lalu Enter..." />
                  <button onClick={addTag} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "#EEF2FF", color: "#4F46E5", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Add</button>
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
              <Field label="✅ Yang Akan Dipelajari (tampil ke siswa)">
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={objectiveInput} onChange={e => setObjectiveInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addObjective(); } }}
                    style={{ ...inputStyle, flex: 1 }} placeholder="mis. Memahami dasar variabel & fungsi..." />
                  <button onClick={addObjective} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: "#ECFDF5", color: "#059669", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>+ Add</button>
                </div>
                {(editItem.learning_objectives ?? []).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {(editItem.learning_objectives ?? []).map((o, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", borderRadius: 7, padding: "6px 10px" }}>
                        <ListChecks size={13} style={{ color: "#059669", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12.5, color: "#334155" }}>{o}</span>
                        <button onClick={() => removeObjective(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="🎯 Target Tipe RIASEC (rekomendasi + notifikasi otomatis)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(["realistic","investigative","artistic","social","enterprising","conventional"]).map(t => {
                    const on = (editItem.riasec_types ?? []).includes(t);
                    return (
                      <button key={t} type="button"
                        onClick={() => setEditItem(p => ({
                          ...p,
                          riasec_types: on
                            ? (p?.riasec_types ?? []).filter(x => x !== t)
                            : [...(p?.riasec_types ?? []), t],
                        }))}
                        style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", border: `1.5px solid ${on ? "#2563EB" : "#E2E8F0"}`, background: on ? "#EFF6FF" : "white", color: on ? "#1D4ED8" : "#64748B" }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="🧠 Target Kecerdasan Majemuk (opsional)">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(["logical","linguistic","musical","bodily","visual","interpersonal","intrapersonal","naturalist"]).map(t => {
                    const on = (editItem.mi_types ?? []).includes(t);
                    return (
                      <button key={t} type="button"
                        onClick={() => setEditItem(p => ({
                          ...p,
                          mi_types: on
                            ? (p?.mi_types ?? []).filter(x => x !== t)
                            : [...(p?.mi_types ?? []), t],
                        }))}
                        style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize", border: `1.5px solid ${on ? "#7C3AED" : "#E2E8F0"}`, background: on ? "#F5F3FF" : "white", color: on ? "#6D28D9" : "#64748B" }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>
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
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
              <button onClick={closeModal} style={{ padding: "10px 20px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 8px rgba(37,99,235,.3)" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Menyimpan..." : modal === "create" ? "Simpan Konten" : "Perbarui Konten"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {studentsFor && <StudentsDrawer content={studentsFor} onClose={() => setStudentsFor(null)} />}
      {quizFor && <QuizBuilderModal content={quizFor} onClose={() => { setQuizFor(null); load(); }} />}

      {delId && (
        <Confirm message="Konten yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?"
          onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />
      )}
    </div>
  );
}

// ─── Students drawer: who is taking this content ──────────────────────────────
function StudentsDrawer({ content, onClose }: { content: LearningContent; onClose: () => void }) {
  const [rows, setRows] = useState<{ student_name: string; email: string; status: string; progress: number; last_accessed_at: string | null }[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    (supabase.rpc as any)("admin_content_students", { p_content_id: content.id }).then(({ data }: any) => {
      setRows(Array.isArray(data) ? data : []);
      setBusy(false);
    });
  }, [content.id]);

  const S_CFG: Record<string, { label: string; color: string }> = {
    in_progress: { label: "Sedang belajar", color: "#B45309" },
    completed: { label: "Selesai ✓", color: "#059669" },
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 90, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: "92vw", height: "100%", background: "white", boxShadow: "-8px 0 32px rgba(0,0,0,.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "#0F172A" }}>👥 Peserta Konten</div>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 3 }}>{content.title}</div>
          </div>
          <button onClick={onClose} style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#64748B", display: "grid", placeItems: "center" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 22px" }}>
          {busy ? (
            <div style={{ padding: 40, textAlign: "center" }}><Loader2 size={22} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} /></div>
          ) : rows.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 13.5 }}>Belum ada siswa yang mengambil konten ini.</div>
          ) : rows.map((r, i) => {
            const cfg = S_CFG[r.status] ?? { label: r.status, color: "#64748B" };
            return (
              <div key={i} style={{ padding: "11px 0", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>{r.student_name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{r.email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                    <div style={{ width: `${r.progress}%`, height: "100%", background: r.status === "completed" ? "#10B981" : "#2563EB", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 700 }}>{r.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Quiz builder: manage questions attached to a content ─────────────────────
interface QuizQ { id: string; question: string; options: string[] | null; correct_answer: string; explanation: string | null; is_active: boolean }

function QuizBuilderModal({ content, onClose }: { content: LearningContent; onClose: () => void }) {
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [expl, setExpl] = useState("");

  const loadQ = async () => {
    setBusy(true);
    const { data } = await supabase.from("quizzes")
      .select("id, question, options, correct_answer, explanation, is_active")
      .eq("content_id", content.id).order("created_at");
    setQuestions((data as unknown as QuizQ[]) ?? []);
    setBusy(false);
  };
  useEffect(() => { loadQ(); }, [content.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addQuestion = async () => {
    const filled = opts.map(o => o.trim()).filter(Boolean);
    if (!q.trim()) { toast.error("Tulis pertanyaannya dulu"); return; }
    if (filled.length < 2) { toast.error("Minimal 2 pilihan jawaban"); return; }
    if (!opts[correctIdx]?.trim()) { toast.error("Jawaban benar tidak boleh kosong"); return; }
    setSaving(true);
    const { error } = await supabase.from("quizzes").insert({
      title: q.trim().slice(0, 80),
      question: q.trim(),
      options: opts.map(o => o.trim()).filter(Boolean),
      correct_answer: opts[correctIdx].trim(),
      explanation: expl.trim() || null,
      content_id: content.id,
      question_type: "multiple_choice",
      difficulty: "easy",
      points_reward: 10,
      is_active: true,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Soal ditambahkan!");
    setQ(""); setOpts(["", "", "", ""]); setCorrectIdx(0); setExpl("");
    loadQ();
  };

  const removeQuestion = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setQuestions(prev => prev.filter(x => x.id !== id));
    toast.success("Soal dihapus");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: "24px 26px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#64748B", display: "grid", placeItems: "center" }}><X size={16} /></button>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "#0F172A" }}>📝 Kuis Konten</div>
        <div style={{ fontSize: 12.5, color: "#64748B", margin: "4px 0 6px" }}>{content.title}</div>
        <div style={{ fontSize: 12, color: "#7C3AED", background: "#FAF5FF", border: "1px solid #E9D5FF", borderRadius: 9, padding: "7px 12px", marginBottom: 16 }}>
          💡 Siswa lulus kuis (skor ≥70%) → konten otomatis ditandai <b>selesai</b>.
        </div>

        {busy ? (
          <div style={{ padding: 24, textAlign: "center" }}><Loader2 size={20} className="animate-spin" style={{ color: "#7C3AED", margin: "0 auto" }} /></div>
        ) : questions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {questions.map((qq, i) => (
              <div key={qq.id} style={{ border: "1px solid #E2E8F0", borderRadius: 11, padding: "11px 14px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{i + 1}. {qq.question}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                      {(qq.options ?? []).map(o => (
                        <span key={o} style={{ fontSize: 11.5, padding: "2px 9px", borderRadius: 99, background: o === qq.correct_answer ? "#DCFCE7" : "#F1F5F9", color: o === qq.correct_answer ? "#15803D" : "#64748B", fontWeight: o === qq.correct_answer ? 700 : 500 }}>
                          {o === qq.correct_answer ? "✓ " : ""}{o}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeQuestion(qq.id)} style={{ background: "#FFF5F5", border: "1px solid #FEE2E2", borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: "#DC2626", display: "grid", placeItems: "center", flexShrink: 0 }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: "1.5px dashed #E2E8F0", paddingTop: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0F172A", marginBottom: 10 }}>+ Tambah Soal</div>
          <textarea value={q} onChange={e => setQ(e.target.value)} rows={2} placeholder="Tulis pertanyaan…"
            style={{ ...textareaStyle, marginBottom: 10 }} />
          {opts.map((o, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <input type="radio" name="correct" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} title="Tandai sebagai jawaban benar" style={{ cursor: "pointer", accentColor: "#059669" }} />
              <input value={o} onChange={e => setOpts(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                placeholder={`Pilihan ${String.fromCharCode(65 + i)}${i < 2 ? " (wajib)" : " (opsional)"}`} style={{ ...inputStyle, flex: 1 }} />
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginBottom: 10 }}>Pilih radio ⚪ di samping jawaban yang benar.</div>
          <input value={expl} onChange={e => setExpl(e.target.value)} placeholder="Penjelasan jawaban (opsional — ditampilkan setelah menjawab)" style={{ ...inputStyle, marginBottom: 12 }} />
          <button onClick={addQuestion} disabled={saving}
            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: saving ? "#CBD5E1" : "#7C3AED", color: "white", fontWeight: 700, fontSize: 13.5, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Menyimpan…" : "Simpan Soal"}
          </button>
        </div>
      </div>
    </div>
  );
}
