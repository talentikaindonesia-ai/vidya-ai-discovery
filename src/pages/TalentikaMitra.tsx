import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

/* ── Design tokens ───────────────────────────────────────────────── */
const C = {
  blue:    "#1D4ED8",
  blue2:   "#2563EB",
  blue50:  "#EEF3FF",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue300: "#93C5FD",
  blue700: "#1D4ED8",
  orange:  "#FF6A00",
  orange2: "#FF8A33",
  orangeSoft: "#FFF0EB",
  yellow:  "#FFD23F",
  yellowSoft: "#FEF9C3",
  green:   "#2DB67D",
  greenDark: "#16A34A",
  mint:    "#E6F7EF",
  purple:  "#7C3AED",
  purpleLight: "#6D28D9",
  lilac:   "#EDE9FE",
  pink:    "#DB2777",
  pinkSoft: "#FCE7F3",
  ink:     "#0B1D3A",
  ink2:    "#1A2340",
  gray50:  "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray500: "#6B7280",
  gray600: "#6B7280",
  gray700: "#374151",
  white:   "#FFFFFF",
};
const display = "'Poppins', system-ui, sans-serif";
const sans    = "'Inter', system-ui, sans-serif";

/* ── Tab data ────────────────────────────────────────────────────── */
type TabKey = "sekolah" | "brand" | "komunitas" | "pemerintah";
const TAB_LABELS: Record<TabKey, string> = {
  sekolah:    "🏫 Sekolah / Kampus",
  brand:      "💼 Brand / Perusahaan",
  komunitas:  "👥 Komunitas",
  pemerintah: "🏛 Pemerintah",
};

const TAB_DATA: Record<TabKey, {
  title: string; emoji: string; desc: string;
  color: string; checkBg: string; bgGrad: string;
  benefits: string[];
}> = {
  sekolah: {
    title: "Mitra Sekolah & Kampus", emoji: "🏫",
    desc: "Program kemitraan khusus untuk sekolah SD–SMA, SMK, dan perguruan tinggi yang ingin meningkatkan kualitas pengembangan siswa secara holistik dan berbasis data.",
    color: C.blue, checkBg: C.blue50, bgGrad: `linear-gradient(135deg,${C.blue50},${C.blue100})`,
    benefits: [
      "Dashboard admin sekolah dengan laporan progress siswa real-time",
      "Asesmen potensi, minat & bakat untuk seluruh siswa",
      "Akses ke 1.000+ kursus dan program pengembangan diri",
      "Kompetisi dan event eksklusif untuk siswa sekolah mitra",
      "Pelatihan dan sertifikasi untuk guru & tenaga pendidik",
      "Laporan analitik per kelas, jurusan, dan angkatan",
    ],
  },
  brand: {
    title: "Mitra Brand & Perusahaan", emoji: "💼",
    desc: "Kolaborasi strategis untuk brand dan perusahaan yang ingin menjangkau talenta muda, mendukung CSR pendidikan, atau membangun talent pipeline dari generasi berikutnya.",
    color: C.orange, checkBg: C.orangeSoft, bgGrad: `linear-gradient(135deg,${C.orangeSoft},#FED7AA)`,
    benefits: [
      "Brand visibility di platform dengan 50K+ pengguna aktif muda",
      "Program beasiswa & kompetisi bermerek perusahaan",
      "Akses talent scouting langsung dari database Talentika",
      "Co-branded events, webinar, dan workshop digital",
      "CSR reporting yang terukur dan berdampak nyata",
      "Direct channel ke komunitas Gen-Z yang engaged",
    ],
  },
  komunitas: {
    title: "Mitra Komunitas & Organisasi", emoji: "👥",
    desc: "Program untuk komunitas pemuda, organisasi non-profit, dan asosiasi profesi yang ingin memberdayakan anggotanya dengan program pengembangan diri berkualitas.",
    color: C.purpleLight, checkBg: C.lilac, bgGrad: `linear-gradient(135deg,#F0E8FF,${C.lilac})`,
    benefits: [
      "Co-branded program komunitas dengan content Talentika",
      "Akses discounted/subsidized untuk anggota komunitas",
      "Join event organizer Talentika untuk acara kolaboratif",
      "Platform untuk showcase karya dan portofolio anggota",
      "Mendapat kurasi konten sesuai visi komunitas",
      "Networking dengan 200+ komunitas mitra Talentika",
    ],
  },
  pemerintah: {
    title: "Mitra Pemerintah & Dinas", emoji: "🏛",
    desc: "Kemitraan dengan instansi pemerintah, dinas pendidikan, dan BUMN untuk memperluas dampak program pengembangan talenta muda di seluruh wilayah Indonesia.",
    color: C.greenDark, checkBg: C.mint, bgGrad: `linear-gradient(135deg,${C.mint},#A7F3D0)`,
    benefits: [
      "Integrasi dengan program Merdeka Belajar & Kampus Merdeka",
      "Data asesmen massal untuk perencanaan pendidikan daerah",
      "Program beasiswa digital bersubsidi untuk daerah 3T",
      "Modul konten yang selaras dengan kurikulum nasional",
      "MoU formal dan laporan berkala untuk stakeholder",
      "Dukungan teknis implementasi di seluruh wilayah",
    ],
  },
};

/* ── SVG helpers ─────────────────────────────────────────────────── */
const StarSVG = ({ size = 20, color = C.blue }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" />
  </svg>
);
const CheckSVG = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const PlusSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ArrowSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const WASVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" />
  </svg>
);

/* ── Reveal hook ─────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Animation styles ────────────────────────────────────────────── */
const rvBase: React.CSSProperties = { transition: "opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)" };
const rvHide: React.CSSProperties = { opacity: 0, transform: "translateY(22px)" };
const rvShow: React.CSSProperties = { opacity: 1, transform: "none" };
const rvL = (v: boolean): React.CSSProperties => ({ ...rvBase, opacity: v ? 1 : 0, transform: v ? "none" : "translateX(-28px)" });
const rvR = (v: boolean): React.CSSProperties => ({ ...rvBase, opacity: v ? 1 : 0, transform: v ? "none" : "translateX(28px)" });

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function TalentikaMitra() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("sekolah");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSent, setFormSent] = useState(false);

  const handleWA = () => window.open("https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20bergabung%20sebagai%20mitra!", "_blank");

  /* global animation keyframes + responsive */
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes mitraSpark{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}
      @keyframes mitraFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      .mitra-tab-btn:hover{border-color:${C.blue2}!important;color:${C.blue2}!important;background:${C.blue50}!important}
      @media(max-width:1024px){
        .mitra-hero-grid{grid-template-columns:1fr!important}
        .mitra-hero-right{display:none!important}
        .mitra-trust-strip{grid-template-columns:1fr 1fr!important}
        .mitra-tab-content{grid-template-columns:1fr!important}
        .mitra-mentor-split{grid-template-columns:1fr!important}
        .mitra-mentor-visual{display:none!important}
        .mitra-steps{grid-template-columns:1fr 1fr!important}
        .mitra-steps::before{display:none!important}
        .mitra-testi-grid{grid-template-columns:1fr 1fr!important}
        .mitra-faq-grid{grid-template-columns:1fr!important}
        .mitra-contact-grid{grid-template-columns:1fr!important}
        .mitra-footer-grid{grid-template-columns:1fr 1fr!important}
        .mitra-mentor-perks{grid-template-columns:1fr!important}
      }
      @media(max-width:640px){
        .mitra-hero-grid{padding:40px 20px 0!important}
        .mitra-trust-strip{grid-template-columns:1fr!important;padding:16px 20px!important}
        .mitra-steps{grid-template-columns:1fr!important}
        .mitra-testi-grid{grid-template-columns:1fr!important}
        .mitra-footer-grid{grid-template-columns:1fr!important}
        .mitra-mentor-stats{grid-template-columns:1fr!important}
        .mitra-section{padding:56px 20px!important}
        .mitra-form-row{grid-template-columns:1fr!important}
        .mitra-tab-btns{gap:6px!important}
        .mitra-tab-btn{padding:9px 14px!important;font-size:13px!important}
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const tab = TAB_DATA[activeTab];

  /* ── Reveal refs ─ */
  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal();
  const r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), r8 = useReveal();
  const r9 = useReveal(), r10 = useReveal();

  /* ── FAQ data ── */
  const faqs = [
    { q: "Apa saja jenis kemitraan yang tersedia?", a: "Kami menyediakan 4 jenis kemitraan: Sekolah/Kampus, Brand/Perusahaan, Komunitas/Organisasi, dan Pemerintah/Dinas. Masing-masing memiliki program dan benefit yang disesuaikan." },
    { q: "Apakah ada biaya untuk bergabung sebagai mitra?", a: "Tidak ada biaya pendaftaran. Biaya bervariasi tergantung jenis dan skala program yang dipilih. Kami menawarkan paket mulai dari pilot gratis untuk eksplorasi awal." },
    { q: "Berapa lama proses pendaftaran mitra?", a: "Rata-rata 1–2 minggu dari pengisian formulir hingga MoU ditandatangani, tergantung kompleksitas program. Untuk program standar, bisa lebih cepat." },
    { q: "Apa syarat untuk menjadi mentor Talentika?", a: "Kami menerima profesional aktif dengan min. 3 tahun pengalaman di bidangnya, memiliki passion untuk mengembangkan generasi muda, dan bersedia mengikuti onboarding singkat dari tim Talentika." },
    { q: "Apakah bisa bermitra dari luar Jawa?", a: "Ya! Talentika hadir di 34 provinsi dan mendukung kemitraan online maupun hybrid. Kami sangat antusias memperluas jangkauan ke seluruh Indonesia." },
    { q: "Bagaimana sistem pelaporan untuk mitra sekolah?", a: "Mitra sekolah mendapat dashboard admin khusus dengan laporan perkembangan siswa, rekap program, dan data asesmen yang dapat diunduh setiap saat secara real-time." },
  ];

  return (
    <div style={{ fontFamily: sans, background: "#F5F7FF", color: C.ink }}>
      <Header />

      {/* ══════════ HERO ══════════ */}
      <section style={{ background: `linear-gradient(160deg,${C.blue50} 0%,#F5F7FF 50%,#EEF7FF 100%)`, padding: "60px 36px 0", overflow: "hidden" }}>
        <div className="mitra-hero-grid" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 48, alignItems: "center" }}>

          {/* LEFT */}
          <div style={{ paddingBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 99, border: `1.5px solid ${C.blue200}`, background: "#fff", color: C.blue700, fontFamily: display, fontWeight: 600, fontSize: 13, marginBottom: 24 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#EC4899"><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" /></svg>
              Untuk Sekolah, Brand &amp; Komunitas
            </div>
            <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(38px,4.8vw,62px)", letterSpacing: "-.03em", lineHeight: 1.05, margin: "0 0 18px", color: C.ink }}>
              Bergabung Menjadi<br />
              Mitra <span style={{ color: C.blue }}>Talentika</span>
            </h1>
            <p style={{ fontSize: 16, color: C.gray600, lineHeight: 1.7, maxWidth: "46ch", margin: "0 0 28px" }}>
              Memberikan kemudahan bagi sekolah, brand, atau komunitas yang ingin bermitra dengan Talentika untuk mengembangkan potensi generasi muda Indonesia.
            </p>

            {/* Trust meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { bg: C.mint, fg: C.greenDark, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>, lbl: "Respon cepat", val: "dalam 1x24 jam" },
                { bg: "#E0FAF5", fg: "#0DBFBF", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" /></svg>, lbl: "Langsung terhubung", val: "ke WhatsApp", valColor: C.blue },
              ].map((item, i) => (
                <div key={i} style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, color: item.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 11.5, color: C.gray500, marginBottom: 2 }}>{item.lbl}</div>
                    <div style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: item.valColor || C.ink }}>{item.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleWA} style={{ width: "100%", padding: "18px 28px", borderRadius: 16, border: "none", cursor: "pointer", background: `linear-gradient(90deg,${C.blue2},${C.blue})`, color: "#fff", fontFamily: display, fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 12px 32px -10px rgba(29,78,216,.5)" }}>
              <WASVG />
              Hubungi Kami Sekarang <span style={{ fontSize: 18 }}>›</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.gray500, marginTop: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${C.gray300}`, flexShrink: 0 }} />
              * Dengan mengklik tombol di atas, Anda akan diarahkan ke WhatsApp untuk memulai percakapan.
            </div>
          </div>

          {/* RIGHT VISUAL */}
          <div className="mitra-hero-right" style={{ position: "relative", minHeight: 500 }}>
            {/* bg blobs */}
            <div style={{ position: "absolute", right: -20, top: -10, width: "85%", height: "90%", borderRadius: "40% 60% 50% 60% / 50% 40% 60% 50%", background: `linear-gradient(135deg,${C.blue},${C.blue2})`, zIndex: 0 }} />
            <div style={{ position: "absolute", right: "10%", top: "8%", width: "44%", aspectRatio: "1/1", borderRadius: "50%", background: "#FF6B35", zIndex: 1, opacity: .85 }} />
            <div style={{ position: "absolute", right: -10, bottom: "12%", width: "28%", aspectRatio: "1/1", borderRadius: "50%", background: C.yellow, zIndex: 1, opacity: .9 }} />

            {/* dot grid */}
            <div style={{ position: "absolute", right: "4%", top: "6%", zIndex: 5 }}>
              <svg width="80" height="66" viewBox="0 0 80 66" fill={C.yellow}>
                {[7,25,43,61,79].map(cx => [7,25,43].map(cy => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" />))}
              </svg>
            </div>

            {/* sparkles */}
            {[
              { top: "18%", left: "36%", size: 18, color: C.blue, delay: 0 },
              { top: "6%", left: "44%", size: 14, color: C.yellow, delay: 500 },
              { bottom: "22%", right: "6%", size: 16, color: C.yellow, delay: 900 },
            ].map((s, i) => (
              <svg key={i} style={{ position: "absolute", zIndex: 5, ...s, animation: `mitraSpark 3s ease-in-out ${s.delay}ms infinite` }} width={s.size} height={s.size} viewBox="0 0 24 24" fill={s.color}>
                <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
              </svg>
            ))}

            {/* Photo placeholder */}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-44%,-48%)", width: "82%", borderRadius: 24, overflow: "hidden", zIndex: 2, boxShadow: "0 28px 70px -28px rgba(11,29,58,.28)", background: `linear-gradient(135deg,${C.blue50},${C.blue100})`, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: C.blue700, fontFamily: display, fontWeight: 600, fontSize: 14 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 8, opacity: .5 }}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                <div style={{ opacity: .6 }}>Foto Mitra Talentika</div>
              </div>
            </div>

            {/* Floating partner cards */}
            {[
              { cls: "c-school", top: "10%", left: -20, bg: C.blue100, color: C.blue, title: "Sekolah", desc: "Tingkatkan kualitas bimbingan & pengembangan siswa", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" /></svg> },
              { cls: "c-brand", top: "6%", right: -20, bg: "#FFEDE2", color: C.orange, title: "Brand / Perusahaan", desc: "Jangkau talenta muda dan bangun kolaborasi berdampak", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" /></svg> },
              { cls: "c-komunitas", bottom: "18%", left: -10, bg: C.lilac, color: C.purpleLight, title: "Komunitas", desc: "Berdayakan anggota dan ciptakan program bermanfaat", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" /></svg> },
            ].map((card, i) => (
              <div key={i} style={{ position: "absolute", background: "#fff", borderRadius: 14, padding: "14px 16px", boxShadow: "0 18px 40px -16px rgba(11,29,58,.22)", border: `1px solid ${C.gray200}`, zIndex: 6, display: "flex", gap: 12, alignItems: "flex-start", width: 220, top: card.top, bottom: card.bottom, left: card.left, right: card.right, animation: `mitraFloat ${3.5 + i * 0.5}s ease-in-out infinite` }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: card.bg, color: card.color, display: "grid", placeItems: "center", flexShrink: 0 }}>{card.icon}</div>
                <div>
                  <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 13.5, margin: "0 0 4px", color: C.ink }}>{card.title}</h5>
                  <p style={{ fontSize: 12, color: C.gray600, margin: 0, lineHeight: 1.4 }}>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TRUST STRIP ══════════ */}
      <div ref={r1.ref} style={{ background: "#fff", borderTop: `1px solid ${C.gray200}`, borderBottom: `1px solid ${C.gray200}`, padding: "24px 36px", ...rvBase, ...(r1.visible ? rvShow : rvHide) }}>
        <div className="mitra-trust-strip" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            { bg: C.blue50, fg: C.blue700, title: "Aman & Terpercaya", desc: "Data dan informasi aman bersama Talentika", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg> },
            { bg: C.mint, fg: C.greenDark, title: "Berdampak Nyata", desc: "Bersama membangun generasi muda berpotensi", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" /></svg> },
            { bg: C.orangeSoft, fg: C.orange, title: "Solusi Fleksibel", desc: "Program dapat disesuaikan dengan kebutuhan Anda", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg> },
            { bg: C.pinkSoft, fg: C.pink, title: "Kolaborasi Berkelanjutan", desc: "Bersama menciptakan perubahan positif untuk masa depan", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" /></svg> },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 20px", borderLeft: i > 0 ? `1px solid ${C.gray200}` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: item.bg, color: item.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>{item.icon}</div>
              <div>
                <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: C.blue700, margin: "0 0 2px" }}>{item.title}</h5>
                <p style={{ fontSize: 12.5, color: C.gray600, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ TIPE MITRA ══════════ */}
      <section id="tipe-mitra" className="mitra-section" style={{ padding: "80px 36px", background: "#fff" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div ref={r2.ref} style={{ textAlign: "center", marginBottom: 44, ...rvBase, ...(r2.visible ? rvShow : rvHide) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.blue50, color: C.blue700, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>Tipe Kemitraan</span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", lineHeight: 1.1, color: C.ink, margin: "0 0 12px" }}>
              Pilih <span style={{ color: C.blue }}>Jenis Kemitraan</span> yang Tepat
            </h2>
            <p style={{ fontSize: 16, color: C.gray600, maxWidth: "58ch", margin: "0 auto", lineHeight: 1.6 }}>
              Kami menyediakan program kemitraan yang disesuaikan untuk setiap jenis institusi dan kebutuhan kolaborasi.
            </p>
          </div>

          {/* Tabs */}
          <div className="mitra-tab-btns" style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
            {(Object.keys(TAB_DATA) as TabKey[]).map(key => {
              const d = TAB_DATA[key];
              const active = activeTab === key;
              return (
                <button key={key} className="mitra-tab-btn" onClick={() => setActiveTab(key)}
                  style={{ padding: "12px 22px", borderRadius: 14, fontFamily: display, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `1.5px solid ${active ? d.color : C.gray200}`, background: active ? d.color : "#fff", color: active ? "#fff" : C.gray600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all .2s", boxShadow: active ? `0 8px 20px -8px ${d.color}80` : "none" }}>
                  {TAB_LABELS[key]}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div ref={r3.ref} className="mitra-tab-content" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start", background: "#fff", borderRadius: 24, padding: 36, border: `1.5px solid ${C.gray200}`, boxShadow: "0 4px 24px -8px rgba(11,29,58,.1)", ...rvBase, ...(r3.visible ? rvShow : rvHide) }}>
            <div>
              <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 26, color: tab.color, margin: "0 0 12px" }}>{tab.emoji} {tab.title}</h3>
              <p style={{ fontSize: 15, color: C.gray600, lineHeight: 1.7, margin: "0 0 20px" }}>{tab.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {tab.benefits.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, color: C.gray700, lineHeight: 1.45 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: tab.checkBg, color: tab.color, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}><CheckSVG /></span>
                    {b}
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ padding: "11px 20px", borderRadius: 12, background: tab.color, color: "#fff", border: "none", cursor: "pointer", fontFamily: display, fontWeight: 700, fontSize: 14 }}>
                  Mulai Kemitraan →
                </button>
                <button onClick={handleWA}
                  style={{ padding: "11px 20px", borderRadius: 12, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer", fontFamily: display, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" /></svg>
                  Konsultasi via WhatsApp
                </button>
              </div>
            </div>
            <div style={{ background: tab.bgGrad, borderRadius: 18, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <div style={{ textAlign: "center", color: tab.color, opacity: .6, fontFamily: display, fontWeight: 600 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{tab.emoji}</div>
                <div>{tab.title}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ MENTOR SECTION ══════════ */}
      <section id="mentor" className="mitra-section" style={{ padding: "80px 36px", background: "#F5F7FF" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div className="mitra-mentor-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>

            {/* left */}
            <div ref={r4.ref} style={rvL(r4.visible)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.orangeSoft, color: C.orange, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>Bergabung sebagai Mentor</span>
              <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3vw,38px)", color: C.ink, letterSpacing: "-.02em", margin: "0 0 14px", lineHeight: 1.15 }}>
                Jadilah Mentor <span style={{ color: C.blue }}>Talentika</span> dan Ubah Hidup Generasi Muda
              </h3>
              <p style={{ fontSize: 15.5, color: C.gray600, lineHeight: 1.7, margin: "0 0 22px" }}>
                Bagikan keahlian dan pengalamanmu kepada ribuan anak muda Indonesia yang siap berkembang. Mentor Talentika adalah katalis yang nyata bagi masa depan bangsa.
              </p>

              <div className="mitra-mentor-perks" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  { bg: C.blue50, fg: C.blue, title: "Dampak Nyata", desc: "Bimbing hingga ratusan talenta muda", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg> },
                  { bg: C.orangeSoft, fg: C.orange, title: "Penghasilan Tambahan", desc: "Honorarium kompetitif per sesi", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></svg> },
                  { bg: C.mint, fg: C.greenDark, title: "Jaringan Profesional", desc: "Terhubung dengan ribuan mentor & mitra", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" /></svg> },
                  { bg: C.yellowSoft, fg: "#A47000", title: "Sertifikasi Resmi", desc: "Sertifikat Mentor Talentika yang diakui", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg> },
                ].map((p, i) => (
                  <div key={i} style={{ background: C.gray50, border: `1.5px solid ${C.gray200}`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: p.bg, color: p.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>{p.icon}</div>
                    <div>
                      <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 14, margin: "0 0 2px", color: C.ink }}>{p.title}</h5>
                      <p style={{ fontSize: 12.5, color: C.gray600, margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ padding: "13px 24px", borderRadius: 12, background: `linear-gradient(90deg,${C.blue2},${C.blue})`, color: "#fff", border: "none", cursor: "pointer", fontFamily: display, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                  Daftar Jadi Mentor <ArrowSVG />
                </button>
                <button style={{ padding: "13px 24px", borderRadius: 12, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer", fontFamily: display, fontWeight: 600, fontSize: 15 }}>
                  Lihat Syarat &amp; Ketentuan
                </button>
              </div>
            </div>

            {/* right */}
            <div ref={r5.ref} className="mitra-mentor-visual" style={{ position: "relative", ...rvR(r5.visible) }}>
              <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 28px 70px -20px rgba(11,29,58,.25)", background: `linear-gradient(135deg,${C.blue50},${C.lilac})`, aspectRatio: "4/5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: C.blue700, opacity: .5 }}>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 12 }}><circle cx="12" cy="8" r="5" /><path d="M3 21c0-5 4-9 9-9s9 4 9 9" /></svg>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: 14 }}>Foto Mentor</div>
                </div>
              </div>
              {/* floating badges */}
              {[
                { style: { left: -24, top: 40 }, bg: C.yellowSoft, fg: "#A47000", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" /></svg>, title: "500+ Mentor Aktif", sub: "Di 6 bidang keahlian" },
                { style: { right: -24, bottom: 60 }, bg: C.blue50, fg: C.blue, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg>, title: "4.9★ Rating Mentor", sub: "Dari 10K+ sesi mentoring" },
              ].map((f, i) => (
                <div key={i} style={{ position: "absolute", background: "#fff", borderRadius: 14, padding: "14px 18px", boxShadow: "0 18px 40px -14px rgba(11,29,58,.22)", border: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", gap: 12, minWidth: 200, zIndex: 2, ...f.style }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: f.bg, color: f.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: C.ink }}>{f.title}</h5>
                    <p style={{ fontSize: 11.5, color: C.gray500, margin: 0, lineHeight: 1.3 }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mentor stats */}
          <div ref={r6.ref} className="mitra-mentor-stats" style={{ background: `linear-gradient(135deg,${C.ink},${C.blue})`, borderRadius: 20, padding: 24, display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center", marginTop: 32, ...rvBase, ...(r6.visible ? rvShow : rvHide) }}>
            {[
              { n: "500", acc: "+", l: "Mentor Terverifikasi" },
              { n: "10K", acc: "+", l: "Sesi Mentoring" },
              { n: "4.9", acc: "★", l: "Rata-rata Rating" },
            ].map((s, i) => (
              <div key={i} style={{ padding: 14, borderLeft: i > 0 ? "1px solid rgba(255,255,255,.15)" : "none" }}>
                <div style={{ fontFamily: display, fontWeight: 800, fontSize: 32, color: "#fff", lineHeight: 1, letterSpacing: "-.02em" }}>
                  {s.n}<span style={{ color: C.yellow }}>{s.acc}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", fontFamily: display, fontWeight: 500, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PROSES ══════════ */}
      <section className="mitra-section" style={{ padding: "80px 36px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div ref={r7.ref} style={{ textAlign: "center", marginBottom: 44, ...rvBase, ...(r7.visible ? rvShow : rvHide) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.blue50, color: C.blue700, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>Cara Bergabung</span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px" }}>
              Mudah, Cepat, <span style={{ color: C.blue }}>Berdampak</span>
            </h2>
            <p style={{ fontSize: 16, color: C.gray600, maxWidth: "58ch", margin: "0 auto", lineHeight: 1.6 }}>
              Proses pendaftaran mitra Talentika hanya butuh 5 langkah sederhana. Tim kami siap mendampingi di setiap tahap.
            </p>
          </div>

          <div className="mitra-steps" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0, position: "relative" }}>
            {/* connector */}
            <div style={{ position: "absolute", left: "10%", right: "10%", top: 32, height: 2, background: `repeating-linear-gradient(to right,${C.blue200} 0 8px,transparent 8px 16px)`, zIndex: 0 }} />
            {[
              { num: "01", bg: `linear-gradient(135deg,#3B82F6,${C.blue})`, shadow: "rgba(29,78,216,.45)", title: "Isi Formulir", desc: "Lengkapi formulir pendaftaran mitra online di halaman ini." },
              { num: "02", bg: "linear-gradient(135deg,#FF8A33,#FF6A00)", shadow: "rgba(255,106,0,.45)", title: "Konsultasi", desc: "Tim kami akan menghubungi untuk diskusi kebutuhan & program." },
              { num: "03", bg: "linear-gradient(135deg,#FFD23F,#FFC107)", shadow: "rgba(255,193,7,.45)", title: "Proposal", desc: "Kami menyiapkan proposal kerja sama yang sesuai visi Anda.", textColor: C.ink },
              { num: "04", bg: "linear-gradient(135deg,#34D399,#16A34A)", shadow: "rgba(22,163,74,.45)", title: "MoU & Onboarding", desc: "Penandatanganan MoU dan setup akun platform mitra." },
              { num: "05", bg: "linear-gradient(135deg,#A78BFA,#7C3AED)", shadow: "rgba(124,58,237,.45)", title: "Launch!", desc: "Program resmi berjalan dengan dukungan penuh tim Talentika." },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 10px", position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: step.bg, color: step.textColor || "#fff", fontFamily: display, fontWeight: 800, fontSize: 20, display: "grid", placeItems: "center", margin: "0 auto 14px", boxShadow: `0 8px 20px -8px ${step.shadow}` }}>{step.num}</div>
                <h4 style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: C.ink, margin: "0 0 6px" }}>{step.title}</h4>
                <p style={{ fontSize: 12.5, color: C.gray500, margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PARTNER LOGOS ══════════ */}
      <div style={{ padding: "48px 36px", background: "#fff", borderTop: `1px solid ${C.gray200}` }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: C.gray500, fontFamily: display, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 28 }}>Dipercaya oleh 200+ mitra di seluruh Indonesia</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, flexWrap: "wrap", opacity: .85 }}>
            {["Kampus Merdeka", "BINUS", "ACE CLASS", "Telkom Univ", "WWF", "Gojek"].map((name, i) => (
              <div key={i} style={{ fontFamily: display, fontWeight: 800, fontSize: 16, color: C.blue, opacity: .75 }}>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="mitra-section" style={{ padding: "80px 36px", background: "#F5F7FF" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div ref={r8.ref} style={{ textAlign: "center", marginBottom: 44, ...rvBase, ...(r8.visible ? rvShow : rvHide) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.yellowSoft, color: "#A47000", fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>💬 Testimoni Mitra</span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px" }}>
              Apa Kata <span style={{ color: C.blue }}>Mitra Kami?</span>
            </h2>
            <p style={{ fontSize: 16, color: C.gray600, maxWidth: "58ch", margin: "0 auto" }}>Cerita sukses dari institusi yang telah bermitra dengan Talentika.</p>
          </div>

          <div className="mitra-testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { quote: "Kemitraan dengan Talentika benar-benar mengubah cara kami membimbing siswa. Data asesmen yang akurat membantu guru kami memberikan arahan yang jauh lebih tepat sasaran.", name: "Dr. Bambang Kurniawan, M.Pd", role: "Kepala Sekolah — SMA Cerdas Bangsa, Jakarta", av: "BK", avBg: `linear-gradient(135deg,${C.blue},${C.blue2})` },
              { quote: "Sebagai brand, bermitra dengan Talentika membuka akses kami ke segmen Gen-Z yang autentik. Program talent scouting kami jadi lebih efektif dari sebelumnya.", name: "Sarah Amelia", role: "Head of Talent, PT Kreasi Digital Indonesia", av: "SA", avBg: `linear-gradient(135deg,#FF8A33,${C.orange})` },
              { quote: "Komunitas kami tumbuh 3x lipat setelah bergabung sebagai mitra Talentika. Anggota kami mendapat akses ke program, mentor, dan peluang yang tidak ada di tempat lain.", name: "Rizky Pratama", role: "Founder — Tech Youth Indonesia Community", av: "RP", avBg: `linear-gradient(135deg,${C.purple},#A78BFA)` },
            ].map((t, i) => (
              <div key={i} style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 20, padding: 26, position: "relative", overflow: "hidden" }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 64, lineHeight: .75, color: C.blue100, position: "absolute", top: 12, right: 18 }}>"</div>
                <div style={{ display: "flex", gap: 2, marginBottom: 12, color: C.yellow }}>
                  {"★★★★★".split("").map((s, j) => <span key={j} style={{ fontSize: 14 }}>{s}</span>)}
                </div>
                <blockquote style={{ fontFamily: display, fontWeight: 600, fontSize: 14.5, lineHeight: 1.6, color: C.ink, margin: "0 0 18px" }}>{t.quote}</blockquote>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.gray200}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.avBg, display: "grid", placeItems: "center", fontFamily: display, fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0 }}>{t.av}</div>
                  <div>
                    <div style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: C.ink }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.gray500 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section className="mitra-section" style={{ padding: "80px 36px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div ref={r9.ref} style={{ textAlign: "center", marginBottom: 44, ...rvBase, ...(r9.visible ? rvShow : rvHide) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.blue50, color: C.blue700, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>FAQ</span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px" }}>
              Pertanyaan yang Sering <span style={{ color: C.blue }}>Diajukan</span>
            </h2>
            <p style={{ fontSize: 16, color: C.gray600, maxWidth: "58ch", margin: "0 auto" }}>Belum menemukan jawaban? Tim kami siap via WhatsApp dalam 1×24 jam.</p>
          </div>

          <div className="mitra-faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i} onClick={() => setOpenFaq(open ? null : i)}
                  style={{ background: "#fff", border: `1.5px solid ${open ? C.blue300 : C.gray200}`, borderRadius: 14, padding: "18px 22px", cursor: "pointer", boxShadow: open ? "0 4px 20px -8px rgba(11,29,58,.1)" : "none", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontFamily: display, fontWeight: 700, fontSize: 15, color: C.ink }}>
                    {faq.q}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: open ? C.blue : C.blue50, color: open ? "#fff" : C.blue700, display: "grid", placeItems: "center", transition: "all .2s", transform: open ? "rotate(45deg)" : "none", flexShrink: 0 }}>
                      <PlusSVG />
                    </div>
                  </div>
                  {open && (
                    <p style={{ fontSize: 14, color: C.gray600, lineHeight: 1.65, margin: "14px 0 0", paddingTop: 14, borderTop: `1px solid ${C.gray200}` }}>{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ CONTACT FORM ══════════ */}
      <section id="contact" className="mitra-section" style={{ padding: "80px 36px", background: "#fff" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div ref={r10.ref} style={{ textAlign: "center", marginBottom: 44, ...rvBase, ...(r10.visible ? rvShow : rvHide) }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: C.orangeSoft, color: C.orange, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>📋 Formulir Pendaftaran</span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px" }}>
              Mulai <span style={{ color: C.blue }}>Kemitraan</span> Hari Ini
            </h2>
            <p style={{ fontSize: 16, color: C.gray600, maxWidth: "58ch", margin: "0 auto" }}>Isi formulir di bawah dan tim kami akan menghubungi Anda dalam 1×24 jam kerja.</p>
          </div>

          <div className="mitra-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "start" }}>
            {/* Form */}
            <div style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 24, padding: 36 }}>
              <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, color: C.ink, margin: "0 0 6px" }}>Formulir Pendaftaran Mitra</h3>
              <p style={{ fontSize: 14, color: C.gray600, margin: "0 0 22px", lineHeight: 1.5 }}>Lengkapi data di bawah untuk memulai perjalanan kemitraan Anda bersama Talentika.</p>

              {[
                { label: "Nama Lengkap *", placeholder: "Dr. Bambang Santoso", type: "text" },
                { label: "Jabatan *", placeholder: "Kepala Sekolah / CEO", type: "text" },
                { label: "Email *", placeholder: "email@institusi.id", type: "email" },
                { label: "Nomor WhatsApp *", placeholder: "+62 812 3456 7890", type: "tel" },
              ].reduce<{ label: string; placeholder: string; type: string }[][]>((rows, field, i) => {
                if (i % 2 === 0) rows.push([field]);
                else rows[rows.length - 1].push(field);
                return rows;
              }, []).map((row, ri) => (
                <div key={ri} className="mitra-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {row.map((field, fi) => (
                    <div key={fi} style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontFamily: display, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 6 }}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "11px 14px", fontFamily: sans, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontFamily: display, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 6 }}>Nama Institusi *</label>
                <input type="text" placeholder="SMA Cerdas Bangsa / PT Kreasi Digital"
                  style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "11px 14px", fontFamily: sans, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box" }} />
              </div>

              <div className="mitra-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: display, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 6 }}>Jenis Kemitraan *</label>
                  <select style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "11px 14px", fontFamily: sans, fontSize: 14, color: C.ink, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                    <option value="">-- Pilih jenis --</option>
                    <option>Sekolah / Kampus</option>
                    <option>Brand / Perusahaan</option>
                    <option>Komunitas / Organisasi</option>
                    <option>Mentor Individu</option>
                    <option>Pemerintah / Dinas</option>
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: display, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 6 }}>Kota / Provinsi *</label>
                  <input type="text" placeholder="Jakarta Selatan, DKI Jakarta"
                    style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "11px 14px", fontFamily: sans, fontSize: 14, color: C.ink, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: display, fontWeight: 600, fontSize: 13, color: C.ink, marginBottom: 6 }}>Ceritakan Kebutuhan Anda</label>
                <textarea placeholder="Jelaskan secara singkat tujuan dan harapan kemitraan Anda dengan Talentika..." rows={4}
                  style={{ width: "100%", background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 12, padding: "11px 14px", fontFamily: sans, fontSize: 14, color: C.ink, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <button onClick={() => setFormSent(true)}
                style={{ width: "100%", padding: 16, borderRadius: 12, background: formSent ? C.greenDark : `linear-gradient(90deg,${C.blue2},${C.blue})`, color: "#fff", border: "none", cursor: formSent ? "default" : "pointer", fontFamily: display, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {formSent ? "✓ Formulir Terkirim! Tim kami akan menghubungi Anda." : <><span>Kirim Formulir</span><ArrowSVG /></>}
              </button>
              <p style={{ fontSize: 12, color: C.gray500, textAlign: "center", marginTop: 10 }}>🔒 Data Anda aman. Kami tidak membagikan informasi ke pihak ketiga.</p>
            </div>

            {/* Contact info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { bg: `linear-gradient(135deg,#3B82F6,${C.blue})`, title: "Email Kemitraan", desc: "Kirim detail program dan kebutuhan Anda melalui email resmi kami.", link: "Discover@Talentika.id", linkColor: C.blue700, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></svg> },
                { bg: "linear-gradient(135deg,#25D366,#128C7E)", title: "WhatsApp Business", desc: "Langsung terhubung dengan tim Partnership Talentika — respons dalam 1×24 jam.", link: "+62 851 4843 4141", linkColor: "#16A34A", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" /></svg>, onClick: handleWA },
                { bg: `linear-gradient(135deg,${C.orange2},${C.orange})`, title: "Kantor Pusat", desc: "Jalan Kuningan Mulia Lot 9 B, Kota Adm. Jakarta Selatan, DKI Jakarta", link: "Lihat di Maps", linkColor: C.orange, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg> },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 18, padding: 22, transition: "all .25s" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, color: "#fff", display: "grid", placeItems: "center", marginBottom: 14 }}>{c.icon}</div>
                  <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 16, margin: "0 0 6px", color: C.ink }}>{c.title}</h5>
                  <p style={{ fontSize: 13.5, color: C.gray600, margin: "0 0 12px", lineHeight: 1.5 }}>{c.desc}</p>
                  <button onClick={c.onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: display, fontWeight: 700, fontSize: 13.5, color: c.linkColor }}>
                    {c.link} <ArrowSVG />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section style={{ background: `linear-gradient(135deg,${C.ink} 0%,#1E3A8A 60%,${C.blue} 100%)`, padding: "80px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,193,7,.2),transparent 65%)", top: -180, right: -60 }} />
        <div style={{ maxWidth: 780, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: "clamp(28px,4vw,48px)", color: "#fff", letterSpacing: "-.025em", lineHeight: 1.1, margin: "0 0 14px" }}>
            Bergabung Bersama 200+ Mitra <span style={{ color: C.yellow }}>Terpercaya</span> Talentika!
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.78)", maxWidth: "56ch", margin: "0 auto 32px", lineHeight: 1.65 }}>
            Bersama kita wujudkan generasi muda Indonesia yang berpotensi, berkarakter, dan berprestasi. Mulai hari ini — gratis konsultasi pertama!
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: C.yellow, color: C.ink, border: "none", cursor: "pointer", fontFamily: display, fontWeight: 800, fontSize: 16, padding: "16px 32px", borderRadius: 14, boxShadow: "0 12px 32px -8px rgba(255,193,7,.5)" }}>
              Daftar Mitra Sekarang →
            </button>
            <button onClick={handleWA}
              style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,.3)", cursor: "pointer", fontFamily: display, fontWeight: 700, fontSize: 16, padding: "16px 32px", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" /></svg>
              WhatsApp Kami
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: "#1E293B", color: "#fff", padding: "48px 36px 24px" }}>
        <div className="mitra-footer-grid" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img src="/logo.png" alt="Talentika" style={{ width: 42, height: 42, objectFit: "contain", borderRadius: 11, flexShrink: 0 }} />
              <div><div style={{ fontFamily: display, fontWeight: 800, fontSize: 18 }}>Talentika</div><div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>Discover. Develop. Grow.</div></div>
            </div>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.6)", lineHeight: 1.7, maxWidth: "32ch" }}>Platform mitra pengembangan talenta terdepan untuk mengembangkan potensi generasi muda Indonesia bersama.</p>
          </div>
          <div>
            <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 14, marginBottom: 16, color: "rgba(255,255,255,.9)" }}>Produk</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["Talentika", "/"], ["Talentika for School", "/for-schools"], ["Talentika Junior", "/talentika-junior"], ["Tentang Kami", "/tentang-kami"]].map(([label, path]) => (
                <button key={label} onClick={() => navigate(path)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5, color: "rgba(255,255,255,.65)", fontFamily: sans, padding: 0 }}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 14, marginBottom: 16, color: "rgba(255,255,255,.9)" }}>Kemitraan</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Mitra Sekolah", "Mitra Brand", "Jadi Mentor", "Hubungi Kami"].map(label => (
                <button key={label} onClick={() => document.getElementById(label === "Hubungi Kami" ? "contact" : "tipe-mitra")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13.5, color: "rgba(255,255,255,.65)", fontFamily: sans, padding: 0 }}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 14, marginBottom: 16, color: "rgba(255,255,255,.9)" }}>Kontak</h5>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13.5, color: "rgba(255,255,255,.65)" }}>
              <div>Discover@Talentika.id</div>
              <div>+62 851 4843 4141</div>
              <div style={{ lineHeight: 1.6 }}>Jl. Kuningan Mulia Lot 9B,<br />Jakarta Selatan</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(255,255,255,.5)" }}>
          <span>© 2026 Talentika. All rights reserved.</span>
          <span style={{ display: "flex", gap: 18 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.5)", fontSize: 13 }}>Kebijakan Privasi</button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.5)", fontSize: 13 }}>Syarat &amp; Ketentuan</button>
          </span>
        </div>
      </footer>
    </div>
  );
}
