import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ExternalLink, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { inputStyle, selectStyle, Field, Modal } from "../adminShared";

/**
 * Daftar kerja kurasi — HANYA situs resmi penyelenggara, bukan agregator.
 *
 * Kenapa ini ada: pada 2026-09-07 kami memeriksa 62 URL sumber resmi langsung
 * dari server. NOL di antaranya menyediakan feed berisi peluang siap pakai.
 * Situs pemerintah RI tidak menyediakan RSS sama sekali, dan feed "resmi" yang
 * ada (Chevening, Erasmus+) ternyata berisi placeholder atau berita lama.
 * Jadi kurasi manual bukan jalan darurat — ini satu-satunya cara mendapat
 * peluang dari sumber resmi. Halaman ini yang menjadikannya terkelola.
 */

interface Sumber {
  id: string;
  nama: string;
  penyelenggara: string | null;
  url: string;
  wilayah: "indonesia" | "internasional";
  kategori: string;
  jenjang: string | null;
  periode_buka: string | null;
  catatan: string | null;
  aktif: boolean;
  terakhir_dicek: string | null;
  urutan: number;
}

const STATUS_CFG: { match: string; label: string; bg: string; color: string; hint: string }[] = [
  { match: "TERJANGKAU",       label: "Terjangkau",   bg: "#F0FDF4", color: "#15803D", hint: "Server berhasil membuka halaman ini." },
  { match: "DIBLOKIR",         label: "Diblokir bot", bg: "#EEF2FF", color: "#4338CA", hint: "Situs menolak akses otomatis (403). Ini normal untuk situs resmi — buka dari browser biasa." },
  { match: "TIDAK TERJANGKAU", label: "Perlu browser",bg: "#FFFBEB", color: "#B45309", hint: "Tidak bisa dijangkau dari server luar negeri. Situs .go.id sering memblokir IP asing — belum tentu mati." },
  { match: "PERLU CEK URL",    label: "Cek URL",      bg: "#FEF2F2", color: "#B91C1C", hint: "Halaman menjawab 404. Kemungkinan alamatnya berubah." },
];

function statusOf(catatan: string | null) {
  const c = catatan ?? "";
  return STATUS_CFG.find(s => c.startsWith(s.match))
    ?? { label: "Belum dicek", bg: "#F1F5F9", color: "#475569", hint: "Belum pernah diperiksa.", match: "" };
}

const KATEGORI = ["beasiswa", "magang", "lowongan_kerja", "kompetisi", "konferensi", "program", "volunteer"];

export default function SumberResmiPanel({ onKurasi }: { onKurasi: (s: Sumber) => void }) {
  const [rows, setRows]       = useState<Sumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [wilayah, setWilayah] = useState<"all" | "indonesia" | "internasional">("all");
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [baru, setBaru]       = useState<Partial<Sumber>>({ wilayah: "indonesia", kategori: "beasiswa", urutan: 100 });
  const [delId, setDelId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sumber_resmi" as any)
      .select("*")
      .order("wilayah", { ascending: true })
      .order("urutan", { ascending: true });
    if (error) toast.error("Gagal memuat sumber: " + error.message);
    setRows(((data ?? []) as unknown) as Sumber[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function tandaiDicek(s: Sumber) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("sumber_resmi" as any)
      .update({ terakhir_dicek: new Date().toISOString(), dicek_oleh: u?.user?.id ?? null })
      .eq("id", s.id);
    if (error) { toast.error("Gagal: " + error.message); return; }
    setRows(prev => prev.map(r => r.id === s.id ? { ...r, terakhir_dicek: new Date().toISOString() } : r));
    toast.success(`${s.nama} ditandai sudah dicek`);
  }

  async function simpanBaru() {
    if (!baru.nama || !baru.url) { toast.error("Nama dan URL wajib diisi"); return; }
    setSaving(true);
    const { error } = await supabase.from("sumber_resmi" as any).insert({
      nama: baru.nama, penyelenggara: baru.penyelenggara || null, url: baru.url,
      wilayah: baru.wilayah || "indonesia", kategori: baru.kategori || "beasiswa",
      jenjang: baru.jenjang || null, periode_buka: baru.periode_buka || null,
      urutan: baru.urutan ?? 100,
    });
    setSaving(false);
    if (error) { toast.error("Gagal: " + error.message); return; }
    toast.success("Sumber resmi ditambahkan");
    setModal(false);
    setBaru({ wilayah: "indonesia", kategori: "beasiswa", urutan: 100 });
    load();
  }

  async function hapus() {
    if (!delId) return;
    const { error } = await supabase.from("sumber_resmi" as any).delete().eq("id", delId);
    if (error) { toast.error("Gagal: " + error.message); return; }
    setDelId(null); load();
  }

  const filtered = rows.filter(r => wilayah === "all" || r.wilayah === wilayah);
  const grup: ("indonesia" | "internasional")[] =
    wilayah === "all" ? ["indonesia", "internasional"] : [wilayah];

  const belumDicek = rows.filter(r => !r.terakhir_dicek).length;

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center" }}>
      <Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} />
    </div>;
  }

  return (
    <div>
      <div style={{ background: "#EEF3FF", border: "1px solid #DBEAFE", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 12.5, color: "#1E3A8A", lineHeight: 1.7 }}>
        <strong>Kenapa manual?</strong> 62 URL sumber resmi diperiksa langsung dari server pada 7 Sep 2026 —
        nol di antaranya menyediakan feed berisi peluang. Situs pemerintah RI tidak punya RSS, dan feed
        “resmi” yang ada (Chevening, Erasmus+) ternyata berisi placeholder atau berita lama.
        Kurasi manual dari daftar ini adalah satu-satunya jalan mendapat peluang bersumber resmi.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <select value={wilayah} onChange={e => setWilayah(e.target.value as typeof wilayah)} style={{ ...selectStyle, width: 190 }}>
          <option value="all">Semua Wilayah ({rows.length})</option>
          <option value="indonesia">🇮🇩 Indonesia ({rows.filter(r => r.wilayah === "indonesia").length})</option>
          <option value="internasional">🌐 Internasional ({rows.filter(r => r.wilayah === "internasional").length})</option>
        </select>
        <span style={{ fontSize: 12.5, color: "#64748B" }}>
          {belumDicek > 0 ? `${belumDicek} sumber belum pernah ditandai dicek` : "Semua sumber sudah pernah dicek"}
        </span>
        <button onClick={() => setModal(true)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Sumber Resmi
        </button>
      </div>

      {grup.map(w => (
        <div key={w} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
            {w === "indonesia" ? "🇮🇩 Indonesia" : "🌐 Internasional"}
          </div>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            {filtered.filter(r => r.wilayah === w).map((s, i, arr) => {
              const st = statusOf(s.catatan);
              return (
                <div key={s.id} style={{ padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: "#0F172A" }}>{s.nama}</span>
                      <span title={st.hint} style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: st.bg, color: st.color, cursor: "help" }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {s.penyelenggara}
                      {s.jenjang ? ` · ${s.jenjang}` : ""}
                      {s.periode_buka ? ` · Buka: ${s.periode_buka}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>
                      {s.terakhir_dicek
                        ? `Terakhir dicek ${new Date(s.terakhir_dicek).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Belum pernah ditandai dicek"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#334155", fontWeight: 600, fontSize: 12.5, textDecoration: "none" }}>
                      <ExternalLink size={13} /> Buka situs
                    </a>
                    <button onClick={() => onKurasi(s)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                      <Plus size={13} /> Tambah peluang
                    </button>
                    <button onClick={() => tandaiDicek(s)} title="Tandai sudah saya periksa hari ini"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#15803D", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                      <CheckCircle2 size={13} />
                    </button>
                    <button onClick={() => setDelId(s.id)} title="Hapus sumber"
                      style={{ padding: "7px 11px", borderRadius: 8, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title="Tambah Sumber Resmi" onClose={() => setModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Nama program">
            <input value={baru.nama ?? ""} onChange={e => setBaru(p => ({ ...p, nama: e.target.value }))} placeholder="mis. Beasiswa Unggulan" style={inputStyle} />
          </Field>
          <Field label="Penyelenggara">
            <input value={baru.penyelenggara ?? ""} onChange={e => setBaru(p => ({ ...p, penyelenggara: e.target.value }))} placeholder="mis. Kemendikdasmen" style={inputStyle} />
          </Field>
          <Field label="URL halaman resmi">
            <input value={baru.url ?? ""} onChange={e => setBaru(p => ({ ...p, url: e.target.value }))} placeholder="https://…" style={inputStyle} />
          </Field>
          <Field label="Wilayah" half>
            <select value={baru.wilayah} onChange={e => setBaru(p => ({ ...p, wilayah: e.target.value as Sumber["wilayah"] }))} style={inputStyle}>
              <option value="indonesia">🇮🇩 Indonesia</option>
              <option value="internasional">🌐 Internasional</option>
            </select>
          </Field>
          <Field label="Kategori" half>
            <select value={baru.kategori} onChange={e => setBaru(p => ({ ...p, kategori: e.target.value }))} style={inputStyle}>
              {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Jenjang" half>
            <input value={baru.jenjang ?? ""} onChange={e => setBaru(p => ({ ...p, jenjang: e.target.value }))} placeholder="mis. S1, S2" style={inputStyle} />
          </Field>
          <Field label="Periode buka" half>
            <input value={baru.periode_buka ?? ""} onChange={e => setBaru(p => ({ ...p, periode_buka: e.target.value }))} placeholder="mis. ~Juli setiap tahun" style={inputStyle} />
          </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button onClick={() => setModal(false)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={simpanBaru} disabled={saving}
              style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {delId && (
        <Modal title="Hapus sumber ini?" onClose={() => setDelId(null)}>
          <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7 }}>
            Sumber dihapus dari daftar kerja kurasi. Peluang yang sudah terlanjur dibuat dari sumber ini tidak ikut terhapus.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button onClick={() => setDelId(null)} style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={hapus} style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#DC2626", color: "white", fontWeight: 700, cursor: "pointer" }}>Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
