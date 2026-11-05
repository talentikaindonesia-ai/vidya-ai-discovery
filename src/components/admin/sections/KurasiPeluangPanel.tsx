/**
 * Antrean kurasi peluang — peluang aktif yang datanya belum lengkap, diurutkan
 * dari yang paling sering dilihat siswa 30 hari terakhir (RPC antrean_kurasi_peluang).
 *
 *  • Tenggat   → dipakai pengingat tenggat & penyembunyian otomatis setelah lewat.
 *                Bila memang tidak ada (bergulir / sepanjang tahun), tandai "Tanpa tenggat".
 *  • RIASEC    → dicocokkan dengan kepribadian siswa (peluang_untukku). Saran awal
 *                diambil dari bidang; admin tetap yang memutuskan.
 *  • Bidang    → disimpan dengan field_locked supaya klasifikasi otomatis tidak menimpanya.
 *  • Poster    → selama kosong, web & aplikasi memakai sampul Talentika.
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save, Sparkles } from "lucide-react";
import { inputStyle, selectStyle } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

const db = supabase as any;

type Kurang = "tenggat" | "riasec" | "bidang" | "poster";
interface Baris {
  id: string; title: string; organizer: string | null; url: string | null;
  opportunity_type: string | null; opportunity_field: string | null; riasec: string | null;
  deadline: string | null; tanpa_tenggat: boolean; poster_url: string | null; created_at: string;
  dilihat_30h: number; diklik_30h: number; disimpan: number; kurang: Kurang[];
}
interface Ubahan { deadline?: string; tanpa_tenggat?: boolean; riasec?: string; opportunity_field?: string; poster_url?: string | null }

const LABEL_KURANG: Record<Kurang, string> = { tenggat: "Tenggat", riasec: "Kode RIASEC", bidang: "Bidang", poster: "Poster" };
const HURUF = ["R", "I", "A", "S", "E", "C"] as const;
const NAMA_HURUF: Record<string, string> = { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" };

/** Saran awal kode RIASEC dari bidang peluang (Holland). */
const SARAN_RIASEC: Record<string, string> = {
  teknologi: "IR", sains_riset: "IR", kesehatan: "IS", lingkungan: "RI", bisnis: "EC", keuangan: "CE",
  seni_kreatif: "AE", media_komunikasi: "AE", sosial_kemanusiaan: "SE", pendidikan: "SA", hukum_politik: "ES",
};

const tglInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export default function KurasiPeluangPanel({ bidang }: { bidang: [string, string][] }) {
  const [rows, setRows] = useState<Baris[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | Kurang>("semua");
  const [ubah, setUbah] = useState<Record<string, Ubahan>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [batas, setBatas] = useState(30);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db.rpc("antrean_kurasi_peluang");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Baris[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const hitung = useMemo(() => {
    const h: Record<string, number> = { semua: rows.length, tenggat: 0, riasec: 0, bidang: 0, poster: 0 };
    rows.forEach(r => r.kurang.forEach(k => { h[k]++; }));
    return h;
  }, [rows]);
  const tampil = rows.filter(r => filter === "semua" || r.kurang.includes(filter));

  const set = (id: string, p: Ubahan) => setUbah(u => ({ ...u, [id]: { ...u[id], ...p } }));

  const simpan = async (r: Baris) => {
    const u = ubah[r.id];
    if (!u || !Object.keys(u).length) return;
    const patch: Record<string, unknown> = { last_verified_at: new Date().toISOString() };
    if (u.tanpa_tenggat !== undefined) patch.tanpa_tenggat = u.tanpa_tenggat;
    if (u.deadline !== undefined) {
      // Tenggat = akhir hari WIB, supaya peluang tidak tersembunyi pagi harinya
      patch.deadline = u.deadline ? new Date(`${u.deadline}T23:59:59+07:00`).toISOString() : null;
      if (u.deadline) patch.tanpa_tenggat = false;
    }
    if (u.riasec !== undefined) patch.riasec = u.riasec || null;
    if (u.opportunity_field !== undefined) { patch.opportunity_field = u.opportunity_field || null; patch.field_locked = !!u.opportunity_field; }
    if (u.poster_url !== undefined) patch.poster_url = u.poster_url;
    if (patch.deadline && new Date(patch.deadline as string).getTime() < Date.now()) {
      if (!window.confirm("Tenggat ini sudah lewat — peluang akan otomatis disembunyikan dalam satu jam. Lanjutkan?")) return;
    }
    setBusy(r.id);
    const { error } = await db.from("scraped_content").update(patch).eq("id", r.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Tersimpan");
    setUbah(x => { const { [r.id]: _, ...sisa } = x; return sisa; });
    // Perbarui baris di tempat; buang dari antrean bila sudah lengkap
    setRows(rs => rs.flatMap(x => {
      if (x.id !== r.id) return [x];
      const baru: Baris = {
        ...x,
        deadline: patch.deadline !== undefined ? (patch.deadline as string | null) : x.deadline,
        tanpa_tenggat: (patch.tanpa_tenggat as boolean | undefined) ?? x.tanpa_tenggat,
        riasec: patch.riasec !== undefined ? (patch.riasec as string | null) : x.riasec,
        opportunity_field: patch.opportunity_field !== undefined ? (patch.opportunity_field as string | null) : x.opportunity_field,
        poster_url: patch.poster_url !== undefined ? (patch.poster_url as string | null) : x.poster_url,
      };
      baru.kurang = ([
        !baru.deadline && !baru.tanpa_tenggat && "tenggat",
        !baru.riasec && "riasec",
        (baru.opportunity_field ?? "umum") === "umum" && "bidang",
        !baru.poster_url && "poster",
      ].filter(Boolean)) as Kurang[];
      return baru.kurang.length ? [baru] : [];
    }));
  };

  const chip = (aktif: boolean): CSSProperties => ({
    padding: "7px 13px", borderRadius: 99, border: `1px solid ${aktif ? "#2563EB" : "#E2E8F0"}`, cursor: "pointer",
    background: aktif ? "#EFF6FF" : "#fff", color: aktif ? "#1D4ED8" : "#475569", fontSize: 12.5, fontWeight: 700,
  });

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#334155", lineHeight: 1.55, marginBottom: 14 }}>
        <b>{rows.length} peluang aktif</b> belum lengkap. Urutan: paling sering dilihat siswa 30 hari terakhir, lalu yang paling banyak kekurangannya.
        Cek di situs resmi (tombol <ExternalLink size={12} style={{ display: "inline", verticalAlign: -1 }} />) sebelum mengisi.
        Tenggat & syarat juga bisa diusulkan AI lewat menu <b><Sparkles size={12} style={{ display: "inline", verticalAlign: -1 }} /> AI Kurator → Lengkapi</b>.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {(["semua", "tenggat", "riasec", "bidang", "poster"] as const).map(k => (
          <button key={k} onClick={() => { setFilter(k); setBatas(30); }} style={chip(filter === k)}>
            {k === "semua" ? "Semua" : `Tanpa ${LABEL_KURANG[k].toLowerCase()}`} · {hitung[k]}
          </button>
        ))}
      </div>

      {!tampil.length && <div style={{ padding: 40, textAlign: "center", color: "#64748B", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0" }}>Tidak ada yang perlu dilengkapi di filter ini. 🎉</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tampil.slice(0, batas).map(r => {
          const u = ubah[r.id] ?? {};
          const riasec = (u.riasec ?? r.riasec ?? "").toUpperCase();
          const field = (u.opportunity_field ?? r.opportunity_field) || "umum";
          const saran = SARAN_RIASEC[field];
          const tanpaTenggat = u.tanpa_tenggat ?? r.tanpa_tenggat;
          const berubah = !!Object.keys(u).length;
          return (
            <div key={r.id} style={{ background: "#fff", border: `1px solid ${berubah ? "#93C5FD" : "#E2E8F0"}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    {r.organizer ?? "Penyelenggara belum diisi"} · {r.opportunity_type ?? "—"} · 👁 {r.dilihat_30h} dilihat · {r.disimpan} disimpan
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {r.kurang.map(k => <span key={k} style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 8px", borderRadius: 99 }}>Tanpa {LABEL_KURANG[k].toLowerCase()}</span>)}
                  </div>
                </div>
                {r.url && <a href={r.url} target="_blank" rel="noreferrer" title="Buka situs resmi" style={{ color: "#2563EB", flex: "none", padding: 4 }}><ExternalLink size={17} /></a>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                  Tenggat pendaftaran
                  <input type="date" value={u.deadline ?? tglInput(r.deadline)} disabled={tanpaTenggat}
                    onChange={e => set(r.id, { deadline: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontWeight: 500, color: "#475569" }}>
                    <input type="checkbox" checked={tanpaTenggat} onChange={e => set(r.id, { tanpa_tenggat: e.target.checked, ...(e.target.checked ? { deadline: "" } : {}) })} />
                    Memang tanpa tenggat (bergulir)
                  </span>
                </label>

                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                  Bidang
                  <select value={field} onChange={e => set(r.id, { opportunity_field: e.target.value === "umum" ? "" : e.target.value })} style={{ ...selectStyle, marginTop: 4, width: "100%" }}>
                    {bidang.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                  Kode RIASEC <span style={{ fontWeight: 500, color: "#64748B" }}>(1–3 huruf, urut terkuat)</span>
                  <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                    {HURUF.map(h => {
                      const on = riasec.includes(h);
                      return (
                        <button key={h} type="button" title={NAMA_HURUF[h]}
                          onClick={() => set(r.id, { riasec: on ? riasec.replace(h, "") : (riasec + h).slice(0, 3) })}
                          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${on ? "#2563EB" : "#CBD5E1"}`, background: on ? "#2563EB" : "#fff", color: on ? "#fff" : "#334155", fontWeight: 800, cursor: "pointer" }}>
                          {h}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 6, fontWeight: 500, color: "#475569" }}>
                    {riasec ? <>Kode: <b>{riasec}</b></> : "Belum diisi"}
                    {saran && saran !== riasec && <button type="button" onClick={() => set(r.id, { riasec: saran })} style={{ marginLeft: 8, border: "none", background: "none", color: "#2563EB", fontWeight: 700, cursor: "pointer", padding: 0 }}>Pakai saran {saran}</button>}
                  </div>
                </div>

                {r.kurang.includes("poster") || u.poster_url !== undefined ? (
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                    Poster
                    <div style={{ marginTop: 4, maxWidth: 220 }}>
                      <UnggahGambar value={u.poster_url !== undefined ? u.poster_url : r.poster_url} onChange={v => set(r.id, { poster_url: v })} folder="peluang" rasio="4 / 5" saran="1080 × 1350 px" />
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button disabled={!berubah || busy === r.id} onClick={() => simpan(r)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", cursor: berubah ? "pointer" : "default", background: berubah ? "#2563EB" : "#E2E8F0", color: berubah ? "#fff" : "#94A3B8", fontWeight: 700, fontSize: 13 }}>
                  {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {tampil.length > batas && (
        <button onClick={() => setBatas(b => b + 30)} style={{ ...chip(false), display: "block", margin: "14px auto 0" }}>Tampilkan 30 lagi ({tampil.length - batas} tersisa)</button>
      )}
    </div>
  );
}
