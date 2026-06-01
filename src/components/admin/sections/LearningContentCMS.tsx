import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Eye, Loader2, Save } from "lucide-react";
import {
  LearningContent, Category, DIFF_CFG, TYPE_CFG,
  inputStyle, selectStyle, textareaStyle,
  Pill, Toggle, Modal, Confirm, Field,
} from "../adminShared";

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
    setTagInput(""); setModal("create");
  };
  const openEdit = (item: LearningContent) => { setEditItem({ ...item }); setTagInput(""); setModal("edit"); };
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
                <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Tidak ada konten ditemukan</td></tr>
              )}
              {paged.map((c, idx) => {
                const diffCfg = DIFF_CFG[c.difficulty_level ?? ""] ?? { label: "–", bg: "#F1F5F9", color: "#64748B" };
                const typeCfg = TYPE_CFG[c.content_type] ?? { label: c.content_type, bg: "#F1F5F9", color: "#64748B" };
                const catColor = c.learning_categories?.color ?? "#6366F1";
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "white" : "#FAFAFA" }}>
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

      {delId && (
        <Confirm message="Konten yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?"
          onConfirm={deleteItem} onCancel={() => setDelId(null)} loading={deleting} />
      )}
    </div>
  );
}
