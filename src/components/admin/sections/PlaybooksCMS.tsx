/**
 * PlaybooksCMS — Playbook Store di aplikasi mobile (LRN-06).
 *
 * File PDF disimpan di bucket PRIVAT "playbooks". Siswa hanya bisa membuka
 * lewat signed URL bila sudah membeli (playbook_purchases, dicatat oleh
 * mayar-webhook) atau bila playbook "gratis untuk Pro" dan dia Pro — aturan
 * itu ditegakkan oleh kebijakan storage, bukan oleh UI.
 * Harga di sini adalah harga yang DITAGIH: create-mayar-payment membacanya.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, BookOpen, FileUp } from "lucide-react";
import { inputStyle, textareaStyle, Toggle, Modal, Field, Confirm, fmtIDR } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

const db = supabase as any;
interface Playbook {
  id?: string; slug: string; title: string; description: string | null; price: number; cover_url: string | null;
  color: string; file_path: string | null; free_for_pro: boolean; is_active: boolean; sort: number;
}
const COLORS = ["#0B1D3A", "#1D4ED8", "#16A34A", "#7C3AED", "#A47000", "#0369A1", "#FF6A00"];

export default function PlaybooksCMS() {
  const [rows, setRows] = useState<(Playbook & { buyers: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Playbook | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hapus, setHapus] = useState<Playbook | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: buys }] = await Promise.all([
      db.from("playbooks").select("*").order("sort"),
      db.from("playbook_purchases").select("playbook_id"),
    ]);
    if (error) toast.error(error.message);
    const count = new Map<string, number>();
    (buys ?? []).forEach((b: any) => count.set(b.playbook_id, (count.get(b.playbook_id) ?? 0) + 1));
    setRows((data ?? []).map((p: Playbook) => ({ ...p, buyers: count.get(p.id!) ?? 0 })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadPdf = async (f: File) => {
    if (!form) return;
    if (f.type !== "application/pdf") { toast.error("File harus PDF"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("Maksimal 50 MB"); return; }
    setUploading(true);
    const slug = (form.slug || form.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "playbook";
    const path = `${slug}/${Date.now()}.pdf`;
    const { error } = await supabase.storage.from("playbooks").upload(path, f, { contentType: "application/pdf" });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setForm({ ...form, file_path: path });
    toast.success("PDF terunggah — simpan untuk menerapkan");
  };

  const save = async () => {
    if (!form) return;
    const slug = (form.slug || form.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!form.title.trim() || !slug) { toast.error("Judul wajib diisi"); return; }
    if (form.price !== 0 && form.price < 1000) { toast.error("Harga minimal Rp1.000 (atau 0 untuk gratis)"); return; }
    if (form.is_active && !form.file_path) { toast.error("Unggah PDF dulu sebelum menerbitkan"); return; }
    const { id, ...rest } = form;
    const row = { ...rest, slug, title: form.title.trim(), description: form.description?.trim() || null };
    setSaving(true);
    const { error } = id ? await db.from("playbooks").update(row).eq("id", id) : await db.from("playbooks").insert(row);
    setSaving(false);
    if (error) { toast.error(/duplicate/i.test(error.message) ? "Slug sudah dipakai" : error.message); return; }
    toast.success("Playbook disimpan"); setForm(null); load();
  };
  const toggle = async (p: Playbook) => {
    if (!p.is_active && !p.file_path) { toast.error("Unggah PDF dulu"); return; }
    await db.from("playbooks").update({ is_active: !p.is_active }).eq("id", p.id); load();
  };
  const remove = async () => {
    if (!hapus) return;
    const { error } = await db.from("playbooks").delete().eq("id", hapus.id);
    setHapus(null);
    if (error) { toast.error(error.message); return; }
    if (hapus.file_path) await supabase.storage.from("playbooks").remove([hapus.file_path]);
    toast.success("Playbook dihapus"); load();
  };
  const preview = async (path: string) => {
    const { data } = await supabase.storage.from("playbooks").createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#64748B" }}>{rows.filter(r => r.is_active).length} terbit · {rows.reduce((a, r) => a + r.buyers, 0)} pembelian</div>
        <button onClick={() => setForm({ slug: "", title: "", description: "", price: 79000, cover_url: null, color: COLORS[1], file_path: null, free_for_pro: false, is_active: false, sort: rows.length + 1 })}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}><Plus size={15} /> Tambah Playbook</button>
      </div>
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
          : !rows.length ? (
            <div style={{ padding: "44px 30px", textAlign: "center", color: "#94A3B8" }}>
              <BookOpen size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />
              <div style={{ fontWeight: 700, color: "#475569", fontSize: 14 }}>Belum ada playbook</div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}>Aplikasi menampilkan "Playbook sedang disiapkan" sampai ada yang diterbitkan.</div>
            </div>
          ) : rows.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i ? "1px solid #F1F5F9" : "none", opacity: p.is_active ? 1 : 0.6 }}>
              <div style={{ width: 40, height: 52, borderRadius: 7, background: p.color, overflow: "hidden", flexShrink: 0 }}>{p.cover_url && <img src={p.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  {p.price ? fmtIDR(p.price) : "Gratis"}{p.free_for_pro ? " · gratis untuk Pro" : ""} · {p.buyers} pembeli ·{" "}
                  {p.file_path ? <button onClick={() => preview(p.file_path!)} style={{ border: "none", background: "none", color: "#2563EB", cursor: "pointer", padding: 0, fontSize: 12 }}>lihat PDF</button> : <span style={{ color: "#DC2626" }}>PDF belum diunggah</span>}
                </div>
              </div>
              <Toggle on={p.is_active} onToggle={() => toggle(p)} />
              <button onClick={() => setForm({ ...p })} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}><Pencil size={13} /></button>
              <button onClick={() => setHapus(p)} disabled={p.buyers > 0} title={p.buyers > 0 ? "Sudah dibeli — nonaktifkan saja" : "Hapus"} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: p.buyers ? "not-allowed" : "pointer", opacity: p.buyers ? 0.4 : 1 }}><Trash2 size={13} /></button>
            </div>
          ))}
      </div>

      {form && (
        <Modal title={form.id ? `Ubah ${form.title}` : "Tambah Playbook"} onClose={() => setForm(null)}>
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Judul"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="THE FUTURE OF™" style={inputStyle} /></Field>
              <Field label="Deskripsi singkat"><textarea value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={textareaStyle} /></Field>
              <Field label="Harga (Rp, 0 = gratis)" half><input type="number" min={0} step={1000} value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} style={inputStyle} /></Field>
              <Field label="Urutan" half><input type="number" value={form.sort} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} style={inputStyle} /></Field>
              <Field label="Sampul (opsional)" half><UnggahGambar value={form.cover_url} onChange={url => setForm({ ...form, cover_url: url })} folder="playbook" rasio="3 / 4" saran="600 × 800 px" /></Field>
              <Field label="Warna sampul cadangan" half>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{COLORS.map(c => <button key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 28, height: 28, borderRadius: 7, background: c, border: form.color === c ? "3px solid #FFC107" : "none", cursor: "pointer" }} />)}</div>
              </Field>
              <Field label="File PDF (privat)">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: "1px dashed #94A3B8", background: "#F8FAFC", color: "#334155", fontWeight: 600, cursor: "pointer" }}>
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} {form.file_path ? "Ganti PDF" : "Unggah PDF"}
                  </button>
                  <span style={{ fontSize: 12, color: form.file_path ? "#059669" : "#94A3B8" }}>{form.file_path ? `✓ ${form.file_path}` : "Belum ada file"}</span>
                  <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }} />
                </div>
              </Field>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={form.free_for_pro} onChange={e => setForm({ ...form, free_for_pro: e.target.checked })} /> Gratis untuk pelanggan Talentika Pro
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Terbitkan di aplikasi
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setForm(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
              <button onClick={save} disabled={saving || uploading} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>{saving ? "Menyimpan…" : "Simpan"}</button>
            </div>
          </div>
        </Modal>
      )}
      {hapus && <Confirm message={`Hapus "${hapus.title}" beserta file PDF-nya?`} onConfirm={remove} onCancel={() => setHapus(null)} />}
    </div>
  );
}
