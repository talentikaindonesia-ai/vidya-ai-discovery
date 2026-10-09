/**
 * Halaman verifikasi sertifikat — PUBLIK, tanpa login.
 *
 * Siapa pun yang menerima kode sertifikat (perekrut, panitia beasiswa, guru)
 * bisa memastikan sertifikat itu sungguh diterbitkan Talentika. Karena itu
 * datanya harus bisa dipercaya:
 *  • sertifikat hanya terbit lewat RPC server terbitkan_sertifikat_asesmen(),
 *    dari hasil Tes RIASEC yang benar-benar ada — siswa tidak bisa menulis
 *    judul atau isi sendiri;
 *  • halaman ini hanya bisa mencocokkan SATU kode persis lewat
 *    verifikasi_sertifikat() — tabel certificates tidak lagi terbaca publik;
 *  • tidak ada user_id yang dikembalikan, hanya yang tertulis di sertifikat.
 *
 * Dulu tautan berbagi mengarah ke /certificate/<token> yang tidak pernah ada
 * rutenya — setiap tautan yang dibagikan siswa berujung 404.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Hasil {
  valid: boolean;
  dicabut?: boolean;
  kode?: string;
  judul?: string;
  penerbit?: string;
  nama?: string;
  tipe?: string;
  holland_code?: string | null;
  terbit?: string;
}

const LABEL_TIPE: Record<string, { nama: string; emoji: string; warna: string }> = {
  realistic:     { nama: "Realistic — Teknis & Praktis",     emoji: "🔧", warna: "#EA580C" },
  investigative: { nama: "Investigative — Analitis & Riset", emoji: "🔬", warna: "#0F7A3E" },
  artistic:      { nama: "Artistic — Kreatif & Ekspresif",   emoji: "🎨", warna: "#7C3AED" },
  social:        { nama: "Social — Empatik & Komunikatif",   emoji: "🤝", warna: "#1D4ED8" },
  enterprising:  { nama: "Enterprising — Ambisius & Leader", emoji: "💼", warna: "#C2410C" },
  conventional:  { nama: "Conventional — Terorganisir",      emoji: "📊", warna: "#475569" },
};

export default function VerifikasiSertifikat() {
  const { kode = "" } = useParams<{ kode: string }>();
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    /* Nama siswa (banyak di bawah umur) tidak boleh terindeks mesin pencari.
       Halaman ini untuk diperiksa lewat tautan yang sengaja dibagikan.

       index.html sudah memuat meta robots global "index, follow". Versi awal
       halaman ini MENAMBAHKAN meta kedua "noindex" — diperiksa di situs live,
       yang terbaca pertama tetap "index, follow", dan dengan dua directive
       bertentangan tidak semua crawler memilih yang lebih ketat. Jadi meta
       yang sudah ada DIUBAH, lalu dikembalikan saat halaman ditinggalkan. */
    const semua = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'));
    const dibuat = semua.length === 0;
    const target = dibuat ? [document.createElement("meta")] : semua;
    const asli = target.map(m => m.content);
    target.forEach(m => { m.name = "robots"; m.content = "noindex, nofollow"; });
    if (dibuat) document.head.appendChild(target[0]);

    const judulAsli = document.title;
    document.title = "Verifikasi Sertifikat — Talentika";

    return () => {
      if (dibuat) target[0].remove();
      else target.forEach((m, i) => { m.content = asli[i]; });
      document.title = judulAsli;
    };
  }, []);

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      const { data, error } = await (supabase.rpc as any)("verifikasi_sertifikat", { p_kode: kode });
      if (batal) return;
      if (error) setGalat(error.message);
      else setHasil((data ?? { valid: false }) as Hasil);
      setMemuat(false);
    })();
    return () => { batal = true; };
  }, [kode]);

  const tipe = hasil?.tipe ? LABEL_TIPE[hasil.tipe] : null;
  const warna = tipe?.warna ?? "#2563EB";
  const tanggal = hasil?.terbit
    ? new Date(hasil.terbit).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "var(--tk-font-sans, Inter, system-ui, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Link to="/" style={{ fontFamily: "var(--tk-font-display, Poppins, sans-serif)", fontWeight: 800, fontSize: 20, color: "#2563EB", textDecoration: "none", letterSpacing: ".02em" }}>
            TALENTIKA
          </Link>
          <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 2 }}>Verifikasi Sertifikat</div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", boxShadow: "0 12px 36px rgba(15,23,42,.08)", overflow: "hidden" }}>
          {memuat ? (
            <div style={{ padding: "56px 24px", textAlign: "center", color: "#64748B", fontSize: 14 }}>Memeriksa kode…</div>
          ) : galat ? (
            <div style={{ padding: "44px 28px", textAlign: "center" }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Pemeriksaan gagal</div>
              <div style={{ fontSize: 13.5, color: "#64748B", marginTop: 6, lineHeight: 1.6 }}>
                Server tidak bisa dihubungi. Coba muat ulang halaman ini sebentar lagi.
              </div>
            </div>
          ) : !hasil?.kode ? (
            <div style={{ padding: "44px 28px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", color: "#DC2626", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800, margin: "0 auto 14px" }}>✕</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0F172A" }}>Sertifikat tidak ditemukan</div>
              <div style={{ fontSize: 13.5, color: "#64748B", marginTop: 8, lineHeight: 1.65 }}>
                Tidak ada sertifikat Talentika dengan kode{" "}
                <span style={{ fontFamily: "var(--tk-font-mono, ui-monospace, monospace)", fontWeight: 700, color: "#334155" }}>{kode || "(kosong)"}</span>.
                Periksa kembali penulisan kodenya — atau sertifikat ini tidak diterbitkan oleh Talentika.
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: "22px 26px", background: hasil.dicabut ? "#FFFBEB" : "#F0FDF4", borderBottom: `1px solid ${hasil.dicabut ? "#FDE68A" : "#BBF7D0"}`, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: hasil.dicabut ? "#F59E0B" : "#16A34A", color: "#fff", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                  {hasil.dicabut ? "!" : "✓"}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: hasil.dicabut ? "#92400E" : "#166534" }}>
                    {hasil.dicabut ? "Sertifikat ini sudah dicabut" : "Sertifikat asli"}
                  </div>
                  <div style={{ fontSize: 12.5, color: hasil.dicabut ? "#B45309" : "#15803D", marginTop: 2 }}>
                    {hasil.dicabut
                      ? "Pernah diterbitkan Talentika, tetapi tidak berlaku lagi."
                      : "Diterbitkan oleh Talentika dan tercatat di sistem kami."}
                  </div>
                </div>
              </div>

              <div style={{ padding: "24px 26px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: ".06em" }}>Diberikan kepada</div>
                <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 26, color: warna, marginTop: 4 }}>{hasil.nama}</div>

                <div style={{ fontSize: 13.5, color: "#475569", marginTop: 14, lineHeight: 1.6 }}>{hasil.judul}</div>

                {tipe && (
                  <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${warna}33`, background: `${warna}0D` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: warna, letterSpacing: ".08em" }}>TIPE KEPRIBADIAN</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginTop: 3 }}>{tipe.emoji} {tipe.nama}</div>
                    {hasil.holland_code && (
                      <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
                        Kode Holland <span style={{ fontFamily: "var(--tk-font-mono, ui-monospace, monospace)", fontWeight: 700, letterSpacing: ".14em", color: warna }}>{hasil.holland_code}</span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Tanggal terbit</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#334155", marginTop: 2 }}>{tanggal}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>ID sertifikat</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#334155", marginTop: 2, fontFamily: "var(--tk-font-mono, ui-monospace, monospace)" }}>{hasil.kode}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "14px 26px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9", fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                Sertifikat ini membuktikan penyelesaian Tes Minat & Bakat RIASEC di Talentika.
                Ini hasil tes minat, <b>bukan</b> ijazah atau penilaian kemampuan akademik.
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link to="/" style={{ fontSize: 13, color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
            Temukan tipe kepribadianmu di Talentika →
          </Link>
        </div>
      </div>
    </div>
  );
}
