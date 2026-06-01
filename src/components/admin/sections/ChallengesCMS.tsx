import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Loader2, Save } from "lucide-react";
import { Challenge, DIFF_CFG, inputStyle, selectStyle, textareaStyle, Pill, Toggle, Modal, Confirm, Field } from "../adminShared";

const CH_TYPES = ["daily","weekly","monthly","learning","quiz","project","community","skill","competition"];
const CH_DIFF  = ["easy","medium","hard"];
const TYPE_EMOJI: Record<string, string> = { daily:"🔥",weekly:"📅",monthly:"🌟",learning:"📚",quiz:"🧠",project:"💻",community:"🤝",skill:"⚡",competition:"🏆" };

export default function ChallengesCMS() {
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
                        <button onClick={() => openEdit(c)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #DBEAFE", background: "#EFF6FF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}><Edit2 size={14} /></button>
                        <button onClick={() => setDelId(c.id)} style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}><Trash2 size={14} /></button>
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
