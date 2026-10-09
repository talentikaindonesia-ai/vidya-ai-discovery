/**
 * CertificateGenerator — SVG certificate rendered in-browser, exported as PNG
 * Triggered from Assessment results page after completing RIASEC test
 *
 * Sertifikat DITERBITKAN DI SERVER (RPC terbitkan_sertifikat_asesmen) dari
 * hasil Tes RIASEC yang benar-benar ada, bukan dari data kiriman browser.
 * Sebelumnya:
 *  • insert menulis ke kolom yang tidak ada (cert_type, share_token, …) dan
 *    errornya diabaikan — gagal diam-diam, tabel 0 baris;
 *  • ID di gambar dibuat dari Date.now() setiap render — bisa ditebak, dan
 *    tidak sama dengan yang (seharusnya) tersimpan;
 *  • siswa boleh insert sertifikat berjudul apa pun untuk dirinya sendiri.
 * Sekarang kode diambil dulu dari server, baru gambar dirender dengan kode
 * itu — jadi ID yang tercetak persis sama dengan yang bisa diverifikasi di
 * talentika.id/sertifikat/<kode>.
 */
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Share2, Award, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const RIASEC_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  realistic:    { label: "Realistic — Teknis & Praktis",    emoji: "🔧", color: "#FF6A00" },
  investigative:{ label: "Investigative — Analitis & Riset", emoji: "🔬", color: "#0F7A3E" },
  artistic:     { label: "Artistic — Kreatif & Ekspresif",   emoji: "🎨", color: "#7C3AED" },
  social:       { label: "Social — Empatik & Komunikatif",   emoji: "🤝", color: "#1D4ED8" },
  enterprising: { label: "Enterprising — Ambisius & Leader", emoji: "💼", color: "#FF6A00" },
  conventional: { label: "Conventional — Terorganisir",      emoji: "📊", color: "#475569" },
};

interface Props {
  userId: string;
  userName: string;
  personalityType: string;
  onClose: () => void;
}

interface Terbitan {
  kode: string;
  nama: string;
  tipe: string;
  holland_code: string | null;
  terbit: string;
}

export function CertificateGenerator({ userName, personalityType, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [saving, setSaving] = useState(false);
  const [terbitan, setTerbitan] = useState<Terbitan | null>(null);
  const [menerbitkan, setMenerbitkan] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  // Terbitkan (atau ambil yang sudah ada — idempoten per hasil tes) sebelum
  // apa pun dirender, supaya ID di gambar = ID yang bisa diverifikasi.
  useEffect(() => {
    let batal = false;
    (async () => {
      const { data, error } = await (supabase.rpc as any)("terbitkan_sertifikat_asesmen");
      if (batal) return;
      if (error) setGalat(error.message);
      else setTerbitan(data as Terbitan);
      setMenerbitkan(false);
    })();
    return () => { batal = true; };
  }, []);

  // Server adalah sumber kebenaran — nama & tipe diambil dari sana.
  const nama = terbitan?.nama || userName;
  const tipeKey = terbitan?.tipe || personalityType;
  const riasec = RIASEC_LABELS[tipeKey] ?? RIASEC_LABELS.realistic;
  const issueDate = (terbitan ? new Date(terbitan.terbit) : new Date())
    .toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const kode = terbitan?.kode ?? "";
  const urlVerifikasi = kode ? `${window.location.origin}/sertifikat/${kode}` : "";
  const domain = window.location.host;

  const downloadPNG = async () => {
    const svg = svgRef.current;
    if (!svg || !terbitan) return;
    setSaving(true);

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 848;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => { ctx.drawImage(img, 0, 0, 1200, 848); URL.revokeObjectURL(url); resolve(); };
        img.onerror = reject;
        img.src = url;
      });

      const link = document.createElement("a");
      link.download = `Sertifikat-Talentika-${nama.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Sertifikat berhasil diunduh 🎓");
    } catch (e) {
      toast.error("Gagal mengunduh sertifikat");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!terbitan) return;
    const teks = `Aku menyelesaikan Tes Minat & Bakat RIASEC di Talentika — tipe ${riasec.label}. Cek keasliannya:`;
    if (navigator.share) {
      await navigator.share({ title: "Sertifikat Talentika", text: teks, url: urlVerifikasi });
    } else {
      await navigator.clipboard.writeText(`${teks} ${urlVerifikasi}`);
      toast.success("Tautan verifikasi disalin — tinggal tempel di LinkedIn 🔗");
    }
  };

  const W = 1200, H = 848;
  const accent = riasec.color;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 20, maxWidth: 860, width: "100%", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.3)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--tk-gray-200)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={20} style={{ color: "var(--tk-blue-600)" }} />
            <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>Sertifikat Digital Talentika</span>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "var(--tk-gray-400)" }}>×</button>
        </div>

        {menerbitkan ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--tk-gray-500)", fontSize: 14 }}>
            <Loader2 size={22} style={{ animation: "spin .8s linear infinite", marginBottom: 10 }} />
            <div>Menerbitkan sertifikatmu…</div>
          </div>
        ) : galat || !terbitan ? (
          <div style={{ padding: "48px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--tk-ink)" }}>Sertifikat belum bisa diterbitkan</div>
            <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)", marginTop: 6, lineHeight: 1.6, maxWidth: 420, margin: "6px auto 0" }}>
              {galat ?? "Terjadi kesalahan."} Kami tidak menerbitkan sertifikat yang tidak bisa diverifikasi.
            </div>
          </div>
        ) : (
        <>
        {/* SVG Certificate */}
        <div style={{ padding: "16px 24px", background: "var(--tk-gray-50)", overflowX: "auto" }}>
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: "100%", display: "block", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.12)" }}
            xmlns="http://www.w3.org/2000/svg" fontFamily="Georgia, serif">

            {/* Background */}
            <rect width={W} height={H} fill="#FAFBFF" />
            <rect x={0} y={0} width={W} height={10} fill={accent} />
            <rect x={0} y={H-10} width={W} height={10} fill={accent} />
            <rect x={0} y={0} width={10} height={H} fill={accent} />
            <rect x={W-10} y={0} width={10} height={H} fill={accent} />

            {/* Corner decorations */}
            <circle cx={40} cy={40} r={30} fill="none" stroke={accent} strokeWidth={2} opacity={.3} />
            <circle cx={40} cy={40} r={20} fill="none" stroke={accent} strokeWidth={1} opacity={.2} />
            <circle cx={W-40} cy={40} r={30} fill="none" stroke={accent} strokeWidth={2} opacity={.3} />
            <circle cx={W-40} cy={H-40} r={30} fill="none" stroke={accent} strokeWidth={2} opacity={.3} />
            <circle cx={40} cy={H-40} r={30} fill="none" stroke={accent} strokeWidth={2} opacity={.3} />

            {/* Header Logo area */}
            <text x={W/2} y={90} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="28" fill={accent}>TALENTIKA</text>
            <text x={W/2} y={115} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="400" fontSize="13" fill="#64748B" letterSpacing="3">DISCOVER YOUR FULL POTENTIAL</text>

            {/* Divider */}
            <line x1={W/2-180} y1={135} x2={W/2+180} y2={135} stroke={accent} strokeWidth={1} opacity={.4} />
            <circle cx={W/2} cy={135} r={4} fill={accent} opacity={.5} />

            {/* Certificate Title */}
            <text x={W/2} y={195} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="400" fontSize="18" fill="#94A3B8" letterSpacing="4">SERTIFIKAT</text>
            <text x={W/2} y={245} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="34" fill="#0B1D3A">TES MINAT &amp; BAKAT</text>

            {/* Recipient */}
            <text x={W/2} y={300} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="400" fontSize="15" fill="#64748B">Diberikan kepada</text>
            <text x={W/2} y={358} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="48" fill={accent}>{nama}</text>

            {/* Underline for name */}
            <line x1={W/2-220} y1={372} x2={W/2+220} y2={372} stroke={accent} strokeWidth={1.5} opacity={.5} />

            {/* RIASEC Result */}
            <text x={W/2} y={415} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="14" fill="#64748B">telah menyelesaikan Tes RIASEC Talentika dengan hasil tipe kepribadian</text>

            {/* Type Badge */}
            <rect x={W/2-200} y={435} width={400} height={70} rx={12} fill={accent} opacity={.1} />
            <rect x={W/2-200} y={435} width={400} height={70} rx={12} fill="none" stroke={accent} strokeWidth={1.5} />
            <text x={W/2} y={463} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="13" fill={accent} letterSpacing="2">
              TIPE KEPRIBADIAN{terbitan.holland_code ? ` · KODE ${terbitan.holland_code}` : ""}
            </text>
            <text x={W/2} y={492} textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill={accent}>{riasec.emoji} {riasec.label}</text>

            {/* Description */}
            <text x={W/2} y={545} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="13" fill="#64748B">
              Sertifikat ini diterbitkan sebagai bukti penyelesaian tes minat berbasis RIASEC
            </text>
            <text x={W/2} y={565} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="13" fill="#64748B">
              dan Holland Code Theory oleh platform Talentika.
            </text>

            {/* Footer row */}
            <line x1={80} y1={620} x2={W-80} y2={620} stroke="#E2E8F0" strokeWidth={1} />

            {/* Left: Date */}
            <text x={130} y={655} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="12" fill="#94A3B8">Tanggal Terbit</text>
            <text x={130} y={675} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="13" fill="#334155">{issueDate}</text>

            {/* Center: Seal */}
            <circle cx={W/2} cy={670} r={55} fill={accent} opacity={.08} />
            <circle cx={W/2} cy={670} r={45} fill="none" stroke={accent} strokeWidth={2} opacity={.4} />
            <text x={W/2} y={658} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="11" fill={accent} letterSpacing="1">TALENTIKA</text>
            <text x={W/2} y={672} textAnchor="middle" fontSize="22">🎓</text>
            <text x={W/2} y={687} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9" fill={accent} letterSpacing="1">VERIFIED</text>

            {/* Right: Cert ID — sama persis dengan yang tersimpan di server */}
            <text x={W-130} y={655} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="12" fill="#94A3B8">ID Sertifikat</text>
            <text x={W-130} y={675} textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="13" fill="#334155">{kode}</text>

            {/* Tempat memeriksa keaslian — dulu stempel "VERIFIED" tidak menunjuk ke mana pun */}
            <text x={W/2} y={765} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="12.5" fill="#64748B">
              Cek keaslian: {domain}/sertifikat/{kode}
            </text>
            <text x={W/2} y={788} textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="12" fill="#CBD5E1">talentika.id · Discover Your Full Potential</text>
          </svg>
        </div>

        <div style={{ padding: "12px 24px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--tk-gray-500)" }}>
          <ShieldCheck size={15} style={{ color: "#16A34A", flexShrink: 0 }} />
          <span>
            Tercatat dengan kode <b style={{ fontFamily: "var(--tk-font-mono)", color: "var(--tk-ink)" }}>{kode}</b> —
            siapa pun bisa memeriksa keasliannya lewat tautan verifikasi.
          </span>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 24px", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", background: "white" }}>
          <button onClick={handleShare} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, border: "1.5px solid var(--tk-blue-200)", background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <Share2 size={15} /> Bagikan tautan verifikasi
          </button>
          <button onClick={downloadPNG} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--tk-blue-600)", color: "white", fontSize: 13.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? <Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} /> : <Download size={15} />}
            {saving ? "Menyiapkan..." : "Unduh PNG"}
          </button>
        </div>
        </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
