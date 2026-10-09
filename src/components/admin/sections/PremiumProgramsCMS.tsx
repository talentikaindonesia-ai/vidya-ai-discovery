import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit2, Loader2, Save, ImageIcon, Users } from "lucide-react";
import { inputStyle, textareaStyle, Toggle, Modal, Field } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

/**
 * PremiumProgramsCMS — kelola kartu "Program Premium" di halaman Peluang siswa.
 *
 * Dua program ("The Future Of™", "The STEM Achievement Playbook™") awalnya
 * hanya konsep PRD tanpa harga/kurikulum final. Sekarang tahap waitlist:
 * siswa bisa daftar minat lewat tombol "Ikuti Alur", TANPA pembayaran dan
 * TANPA skor "match %" (program ini untuk semua siswa, bukan tersegmentasi
 * per tipe RIASEC seperti jalur belajar).
 *
 * Slug program TETAP (tidak bisa tambah/hapus dari sini) — hanya isi &
 * status terbit yang admin atur. Banner harus diunggah di sini karena aset
 * marketing aslinya ada di komputer admin, bukan di database.
 */

interface ProgramRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  banner_url: string | null;
  cta_label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const tabel = () => supabase.from("premium_programs" as any) as any;
const tabelMinat = () => supabase.from("premium_program_interest" as any) as any;

export default function PremiumProgramsCMS() {
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProgramRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [minat, setMinat] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: minatRows }] = await Promise.all([
      tabel().select("*").order("sort_order", { ascending: true }),
      tabelMinat().select("program_id"),
    ]);
    if (error) toast.error("Gagal memuat program: " + error.message);
    setRows((data ?? []) as ProgramRow[]);
    const hitung: Record<string, number> = {};
    (minatRows ?? []).forEach((r: { program_id: string }) => { hitung[r.program_id] = (hitung[r.program_id] ?? 0) + 1; });
    setMinat(hitung);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function simpan() {
    if (!form) return;
    setSaving(true);
    const { error } = await tabel().update({
      name: form.name.trim(),
      tagline: form.tagline || null,
      banner_url: form.banner_url || null,
      cta_label: form.cta_label?.trim() || "Ikuti Alur",
      updated_at: new Date().toISOString(),
    }).eq("id", form.id);
    setSaving(false);
    if (error) { toast.error("Gagal menyimpan: " + error.message); return; }
    toast.success("Program disimpan");
    setForm(null);
    load();
  }

  async function toggleTerbit(r: ProgramRow) {
    setTogglingId(r.id);
    const is_active = !r.is_active;
    const { error } = await tabel().update({ is_active, updated_at: new Date().toISOString() }).eq("id", r.id);
    setTogglingId(null);
    if (error) { toast.error(error.message); return; }
    if (is_active && !r.banner_url) {
      toast.warning("Diterbitkan tanpa banner — kartu akan tampil polos. Unggah banner dulu untuk hasil terbaik.");
    } else {
      toast.success(is_active ? "Program tampil di halaman Peluang" : "Program disembunyikan dari siswa");
    }
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_active } : x));
  }

  return (
    <div>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 12.5, color: "#1D4ED8", lineHeight: 1.6 }}>
        Tahap waitlist — tombol di halaman siswa hanya mencatat minat (tanpa pembayaran). Program tidak diberi skor "match %" karena ditujukan untuk semua siswa.
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {rows.map(r => (
            <div key={r.id} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ aspectRatio: "16 / 9", background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                {r.banner_url
                  ? <img src={r.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <ImageIcon size={26} style={{ color: "#CBD5E1" }} />}
              </div>
              <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {!r.is_active && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEF3C7", color: "#B45309" }}>Draf</span>}
                  {!r.banner_url && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEE2E2", color: "#B91C1C" }}>Belum ada banner</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0F172A", lineHeight: 1.35 }}>{r.name}</div>
                <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.5 }}>{r.tagline}</div>
                <div style={{ fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                  <Users size={13} /> {minat[r.id] ?? 0} siswa mendaftar minat
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
                  <Toggle on={r.is_active} loading={togglingId === r.id} onToggle={() => toggleTerbit(r)} />
                  <span style={{ fontSize: 12, color: "#64748B" }}>{r.is_active ? "Tampil ke siswa" : "Draf"}</span>
                  <button onClick={() => setForm(r)} title="Ubah"
                    style={{ marginLeft: "auto", padding: "7px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}>
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={`Ubah — ${form.name}`} onClose={() => setForm(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "24px 28px" }}>
            <Field label="Banner program">
              <UnggahGambar value={form.banner_url} onChange={url => setForm(p => p ? { ...p, banner_url: url } : p)}
                folder="program-premium" rasio="16 / 9" saran="1600 × 900 px" />
            </Field>
            <Field label="Nama program">
              <input value={form.name} onChange={e => setForm(p => p ? { ...p, name: e.target.value } : p)} style={inputStyle} />
            </Field>
            <Field label="Tagline">
              <textarea value={form.tagline ?? ""} onChange={e => setForm(p => p ? { ...p, tagline: e.target.value } : p)}
                style={{ ...textareaStyle, minHeight: 60 }} />
            </Field>
            <Field label="Label tombol" half>
              <input value={form.cta_label} onChange={e => setForm(p => p ? { ...p, cta_label: e.target.value } : p)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 28px 24px" }}>
            <button onClick={() => setForm(null)}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
              Batal
            </button>
            <button onClick={simpan} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
