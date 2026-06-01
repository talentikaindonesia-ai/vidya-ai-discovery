import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { Category, inputStyle, selectStyle, textareaStyle, Pill, Toggle, Modal, Confirm, Field } from "../adminShared";

export default function CategoriesCMS({ onReload }: { onReload: () => void }) {
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
  const openEdit = (item: Category) => { setEditItem({ ...item }); setModal(true); };
  const close = () => { setModal(false); setEditItem(null); };

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
                      <span style={{ width: 32, height: 32, borderRadius: 8, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{c.icon || "📁"}</span>
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
                      <button onClick={() => openEdit(c)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #DBEAFE", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}><Edit2 size={14} /></button>
                      <button onClick={() => setDelId(c.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}><Trash2 size={14} /></button>
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
