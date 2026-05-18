import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import WhatsAppButton from "@/components/WhatsAppButton";
import Header from "@/components/Header";

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  blue: "#2A5FE8",
  blueDark: "#1D4ED8",
  blueLight: "#5B8DF6",
  blue50: "#EEF3FE",
  orange: "#FF6B35",
  orangeLight: "#FF9A72",
  orangeSoft: "#FFF0EB",
  yellow: "#FFD23F",
  yellowDark: "#F5B800",
  yellowSoft: "#FFFBEB",
  green: "#2DB67D",
  greenSoft: "#E6F7EF",
  purple: "#7C3AED",
  purpleSoft: "#F0E8FF",
  pink: "#F472B6",
  pinkSoft: "#FDF0F7",
  teal: "#0DBFBF",
  tealSoft: "#E0FAFA",
  ink: "#1A2340",
  gray500: "#6B7280",
  gray200: "#E5E7EB",
  gray100: "#F9FAFB",
};

const display = "'Nunito', 'Poppins', system-ui, sans-serif";
const sans = "'Inter', system-ui, sans-serif";

// ─── Learning Path data ──────────────────────────────────────────────────────
const LP_DATA: Record<string, { title: string; sub: string; color: string; stages: { label: string; title: string; desc: string; chips: string[] }[] }> = {
  scientist: {
    title: "🔬 Scientist Track", sub: "Eksplorasi sains dan penelitian ilmiah", color: C.purple,
    stages: [
      { label: "Starter", title: "Saintis Mula", desc: "Pengenalan metode ilmiah, alat laboratorium, dan eksperimen sederhana.", chips: ["Metode Ilmiah", "Lab Safety", "Observasi"] },
      { label: "Explorer", title: "Penjelajah Sains", desc: "Eksperimen kimia, fisika dasar, dan biologi untuk anak.", chips: ["Kimia Dasar", "Fisika Fun", "Biologi Mini"] },
      { label: "Researcher", title: "Peneliti Junior", desc: "Merancang proyek penelitian nyata dan dokumentasi ilmiah.", chips: ["Research Design", "Data Analisis", "Dokumentasi"] },
      { label: "Champion", title: "Jagoan Sains", desc: "Kompetisi science fair dan presentasi karya di depan juri profesional.", chips: ["Science Fair", "Presentasi", "Award"] },
    ],
  },
  tech: {
    title: "💻 Technologist Track", sub: "Teknologi dan inovasi digital", color: C.blue,
    stages: [
      { label: "Starter", title: "Coder Pemula", desc: "Dasar-dasar komputer, logika pemrograman, dan Scratch.", chips: ["Scratch", "Logika", "Algoritma"] },
      { label: "Builder", title: "App Builder", desc: "Membuat aplikasi web sederhana dan game dengan Python/JavaScript.", chips: ["Python", "HTML/CSS", "Game Dev"] },
      { label: "Innovator", title: "Tech Innovator", desc: "Robotika, Arduino, dan proyek IoT untuk remaja.", chips: ["Arduino", "Robotika", "IoT"] },
      { label: "Champion", title: "Jagoan Tech", desc: "Hackathon junior dan pitching produk digital ke investor muda.", chips: ["Hackathon", "Pitching", "Demo Day"] },
    ],
  },
  entre: {
    title: "💡 Entrepreneur Track", sub: "Kewirausahaan dan bisnis kreatif", color: C.orange,
    stages: [
      { label: "Starter", title: "Pebisnis Kecil", desc: "Dasar-dasar bisnis, uang, dan produk sederhana.", chips: ["Bisnis Dasar", "Uang", "Produk"] },
      { label: "Creator", title: "Kreator Produk", desc: "Membuat produk nyata dan strategi penjualan.", chips: ["Produk", "Branding", "Marketing"] },
      { label: "Pitcher", title: "Pitcher Junior", desc: "Pitch ide bisnis ke juri dan mini bazaar school market.", chips: ["Pitch Deck", "Bazaar", "Sales"] },
      { label: "Champion", title: "Jagoan Bisnis", desc: "Business plan kompetisi dan mentorship langsung dengan pengusaha.", chips: ["Business Plan", "Kompetisi", "Mentoring"] },
    ],
  },
  creative: {
    title: "🎨 Creative Track", sub: "Seni, kreativitas, dan ekspresi diri", color: C.pink,
    stages: [
      { label: "Starter", title: "Kreator Mula", desc: "Menggambar, mewarnai digital, dan dasar fotografi.", chips: ["Menggambar", "Warna", "Foto Dasar"] },
      { label: "Artist", title: "Seniman Muda", desc: "Ilustrasi digital, animasi sederhana, dan storytelling visual.", chips: ["Ilustrasi", "Animasi", "Komik"] },
      { label: "Producer", title: "Content Creator", desc: "Videografi, editing, dan konten kreatif untuk media sosial.", chips: ["Video", "Editing", "Konten"] },
      { label: "Champion", title: "Jagoan Kreatif", desc: "Pameran karya, portfolio digital, dan kompetisi seni nasional.", chips: ["Pameran", "Portfolio", "Kompetisi"] },
    ],
  },
  env: {
    title: "🌿 Environmentalist Track", sub: "Peduli lingkungan dan aksi nyata", color: C.green,
    stages: [
      { label: "Starter", title: "Pejuang Hijau", desc: "Mengenal lingkungan hidup, ekosistem, dan masalah lingkungan.", chips: ["Ekosistem", "Polusi", "Daur Ulang"] },
      { label: "Activist", title: "Aktivis Muda", desc: "Proyek daur ulang, berkebun urban, dan pengurangan sampah.", chips: ["Urban Farm", "Upcycling", "Zero Waste"] },
      { label: "Researcher", title: "Peneliti Ekologi", desc: "Pemantauan kualitas udara, air, dan tanah di lingkungan sekitar.", chips: ["Pemantauan", "Data", "Riset Eko"] },
      { label: "Champion", title: "Jagoan Hijau", desc: "Eco-project competition dan kampanye lingkungan nasional.", chips: ["Eco Project", "Kampanye", "Award"] },
    ],
  },
};

const LP_TABS = [
  { key: "scientist", label: "Scientist", emoji: "🔬" },
  { key: "tech", label: "Technologist", emoji: "💻" },
  { key: "entre", label: "Entrepreneur", emoji: "💡" },
  { key: "creative", label: "Creative", emoji: "🎨" },
  { key: "env", label: "Environmentalist", emoji: "🌿" },
];

// ─── Small reusable pieces ───────────────────────────────────────────────────
const StarIcon = ({ size = 24, fill = C.yellow }: { size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
  </svg>
);

const Stars5 = ({ color = C.yellow }: { color?: string }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[0, 1, 2, 3, 4].map(i => <StarIcon key={i} size={13} fill={color} />)}
  </div>
);

const CheckIcon = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const WAIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="#25D366">
    <path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" />
  </svg>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function TalentikaJuniorLanding() {
  const navigate = useNavigate();
  const [activeLP, setActiveLP] = useState("scientist");

  const handleRegister = () => navigate("/auth");
  const handleWA = () => window.open("https://wa.me/6285148434141?text=Halo%20Talentika%20Junior,%20saya%20ingin%20informasi%20lebih%20lanjut.", "_blank");
  const handleWAPartner = () => window.open("https://wa.me/6285148434141?text=Halo%20Talentika,%20saya%20ingin%20bergabung%20sebagai%20mitra%20sekolah.", "_blank");

  const lp = LP_DATA[activeLP];

  return (
    <>
      <SEO
        title="Talentika Junior — Jelajahi Bakatmu, Bangun Masa Depanmu!"
        description="Platform pembelajaran berbasis pengalaman untuk anak dan remaja SD–SMP. Dari saintis, technologist, entrepreneur, creative hingga environmentalist — jadilah versi terbaik dirimu!"
        keywords="talentika junior, bakat anak, minat anak SD SMP, tes bakat anak, eksplorasi karir anak, si jagoan sains, gamifikasi belajar"
        canonical="https://talentika.id/talentika-junior"
        type="website"
      />

      <style>{`
        @keyframes jrBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes jrSparkle { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
        .jr-bounce { animation: jrBounce 2.8s ease-in-out infinite; }
        .jr-bounce2 { animation: jrBounce 3.2s ease-in-out infinite .5s; }
        .jr-sparkle { animation: jrSparkle 3s ease-in-out infinite; }
        .jr-track-card { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s cubic-bezier(.16,1,.3,1); }
        .jr-track-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px -20px rgba(42,95,232,.22),0 8px 20px -10px rgba(26,35,64,.09); }
        .jr-card-hover { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s; }
        .jr-card-hover:hover { transform: translateY(-5px); box-shadow: 0 24px 60px -20px rgba(42,95,232,.22),0 8px 20px -10px rgba(26,35,64,.09); }
        .jr-lb-row { transition: all .2s; }
        .jr-lb-row:hover { border-color: ${C.blue}; box-shadow: 0 6px 28px -8px rgba(42,95,232,.13); }
        .jr-event-card { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s; }
        .jr-event-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px -20px rgba(42,95,232,.22); }
        .jr-lp-tab { transition: all .2s; cursor: pointer; }
        .jr-price-card { transition: all .3s cubic-bezier(.16,1,.3,1); }
        .jr-price-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px -20px rgba(42,95,232,.22); }
        .jr-price-featured { border: 1.5px solid ${C.orange}; box-shadow: 0 20px 60px -20px rgba(255,107,53,.3); transform: translateY(-8px); }
        .jr-price-featured:hover { transform: translateY(-12px) !important; }
        .jr-foot-link { color: #94A3B8; transition: color .15s; cursor: pointer; text-decoration: none; font-size: 13.5px; }
        .jr-foot-link:hover { color: #fff; }
        .jr-social-btn { width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.07);color:#94A3B8;display:grid;place-items:center;transition:background .15s,color .15s;cursor:pointer;border:none; }
        .jr-social-btn:hover { background: ${C.blue}; color: #fff; }
        .jr-btn-ghost-green:hover { background: ${C.greenSoft}; }
      `}</style>

      <div style={{ fontFamily: sans, color: C.ink, background: "#fff" }}>
        <Header />

        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section style={{ background: "linear-gradient(180deg,#F5F7FF 0%,#FFF9F2 50%,#F0FBF5 100%)", overflow: "hidden" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "48px 40px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, alignItems: "flex-end", position: "relative" }}>

            {/* Left copy */}
            <div style={{ paddingBottom: 56 }}>
              {/* Stamp */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontFamily: display, fontWeight: 900, fontSize: 22, color: C.ink }}>Talentika</span>
                <span style={{ background: C.blue, color: "#fff", fontFamily: display, fontWeight: 900, fontSize: 14, padding: "5px 14px", borderRadius: 99 }}>Junior</span>
                <svg width={20} height={20} viewBox="0 0 24 24" fill={C.yellow} className="jr-sparkle"><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /></svg>
                <svg width={14} height={14} viewBox="0 0 24 24" fill={C.yellow} className="jr-sparkle" style={{ marginTop: -8 }}><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /></svg>
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(38px,4.6vw,60px)", lineHeight: 1.07, letterSpacing: "-.03em", margin: "0 0 18px" }}>
                <span style={{ color: C.blue, display: "block" }}>Talentika Junior:</span>
                <span style={{ background: `linear-gradient(90deg,${C.blue},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>Jelajahi Bakatmu,</span>
                <span style={{ background: `linear-gradient(90deg,${C.orange},#E8461D)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "block" }}>Bangun Masa Depanmu!</span>
              </h1>

              {/* Sub */}
              <p style={{ fontSize: 15.5, color: "#4B5563", lineHeight: 1.7, maxWidth: "50ch", margin: "0 0 26px" }}>
                Platform pembelajaran berbasis pengalaman untuk anak dan remaja.<br />
                Dari saintis, technologist, entrepreneur, creative hingga environmentalist—<br />
                jadilah versi terbaik dirimu dengan tantangan seru, program interaktif, dan pengalaman nyata!
              </p>

              {/* Feature pill row */}
              <div style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 18, padding: "18px 20px", display: "flex", gap: 0, marginBottom: 28, boxShadow: "0 4px 20px -8px rgba(42,95,232,.1)" }}>
                {[
                  { emoji: "🚀", label: "Eksplorasi Diri", desc: "Kenali minat dan bakat terpendammu", gradient: `linear-gradient(135deg,${C.blue},#60A5FA)` },
                  { emoji: "🔬", label: "Belajar Seru", desc: "Pembelajaran interaktif berbasis pengalaman", gradient: "linear-gradient(135deg,#059669,#34D399)" },
                  { emoji: "🏆", label: "Tantangan & Proyek", desc: "Asah kemampuan lewat challenge seru", gradient: `linear-gradient(135deg,${C.purple},#A78BFA)` },
                  { emoji: "👨‍🏫", label: "Mentoring", desc: "Belajar langsung dari mentor inspiratif", gradient: `linear-gradient(135deg,${C.orange},${C.orangeLight})` },
                  { emoji: "⭐", label: "Raih Prestasi", desc: "Bangun portofolio dan wujudkan impianmu", gradient: "linear-gradient(135deg,#DB2777,#F472B6)" },
                ].map((item, i, arr) => (
                  <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", padding: "0 8px", borderRight: i < arr.length - 1 ? `1px solid #F3F4F6` : "none" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: item.gradient, display: "grid", placeItems: "center", fontSize: 22 }}>{item.emoji}</div>
                    <b style={{ fontFamily: display, fontSize: 12.5, color: C.ink }}>{item.label}</b>
                    <span style={{ fontSize: 11, color: C.gray500, lineHeight: 1.4 }}>{item.desc}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={handleRegister} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 14, fontFamily: display, fontWeight: 700, fontSize: 15.5, background: `linear-gradient(135deg,${C.orange},#E8461D)`, color: "#fff", border: "none", cursor: "pointer", boxShadow: `0 6px 20px -6px rgba(255,107,53,.45)` }}>
                  Mulai Petualanganmu Sekarang! →
                </button>
                <button onClick={handleWA} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 26px", borderRadius: 14, fontFamily: display, fontWeight: 700, fontSize: 15, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer" }}>
                  <WAIcon /> Gabung &amp; Hubungi Kami di WhatsApp
                </button>
              </div>
            </div>

            {/* Right visual */}
            <div style={{ position: "relative", minHeight: 580, alignSelf: "flex-end" }}>
              {/* Light-blue bg blob */}
              <svg style={{ position: "absolute", right: -40, top: -30, width: "100%", height: "110%", zIndex: 0 }} viewBox="0 0 620 600" fill="none" preserveAspectRatio="xMidYMid meet">
                <path d="M540 60 C600 100,640 200,580 320 C520 440,380 500,260 480 C140 460,60 380,80 260 C100 140,200 40,340 20 C440 5,480 20,540 60Z" fill="#C8D9F5" opacity=".55" />
              </svg>

              {/* Blue textured blob top-left */}
              <svg style={{ position: "absolute", left: "6%", top: "2%", zIndex: 1, width: "42%", opacity: .95 }} viewBox="0 0 260 220" fill="none">
                <path d="M220 20 C260 60,270 140,220 180 C170 220,80 230,40 190 C0 150,-10 80,30 40 C70 0,180 -20,220 20Z" fill="#1E40AF" />
                <circle cx={60} cy={80} r={4} fill="#60A5FA" opacity=".7" />
                <circle cx={100} cy={50} r={6} fill="#60A5FA" opacity=".5" />
                <circle cx={160} cy={60} r={3} fill="#93C5FD" opacity=".6" />
                <circle cx={180} cy={110} r={5} fill="#3B82F6" opacity=".5" />
                <circle cx={90} cy={150} r={4} fill="#60A5FA" opacity=".6" />
                <circle cx={140} cy={170} r={3} fill="#93C5FD" opacity=".5" />
              </svg>

              {/* Yellow blob center */}
              <svg style={{ position: "absolute", left: "18%", bottom: "8%", zIndex: 1, width: "55%", opacity: .92 }} viewBox="0 0 360 300" fill="none">
                <path d="M300 40 C360 90,370 200,300 250 C230 300,100 310,40 260 C-20 210,-20 110,50 60 C120 10,240 -10,300 40Z" fill={C.yellow} />
              </svg>

              {/* Orange blob bottom-right */}
              <svg style={{ position: "absolute", right: "2%", bottom: "5%", zIndex: 2, width: "30%", opacity: .88 }} viewBox="0 0 200 180" fill="none">
                <path d="M170 20 C210 60,210 130,170 160 C130 190,50 190,20 160 C-10 130,-10 60,20 30 C50 0,130 -20,170 20Z" fill={C.orange} />
              </svg>

              {/* Paper plane */}
              <svg style={{ position: "absolute", left: "38%", top: "3%", zIndex: 5 }} className="jr-bounce" width={70} height={70} viewBox="0 0 80 80" fill="none">
                <path d="M60 12 L15 35 L28 40 L34 60 L48 48 L60 12Z" fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinejoin="round" />
                <path d="M28 40 L48 48" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" />
                <path d="M14 60 Q 4 50 8 38 Q 12 26 18 18" stroke={C.blue} strokeWidth={2} fill="none" strokeDasharray="4 5" strokeLinecap="round" opacity=".6" />
              </svg>

              {/* Blue ring circles */}
              <svg style={{ position: "absolute", right: "1%", top: "22%", zIndex: 5 }} width={56} height={56} viewBox="0 0 56 56" fill="none">
                <circle cx={28} cy={28} r={24} stroke={C.blue} strokeWidth={5} />
              </svg>
              <svg style={{ position: "absolute", left: "10%", bottom: "28%", zIndex: 5 }} width={44} height={44} viewBox="0 0 44 44" fill="none">
                <circle cx={22} cy={22} r={18} stroke={C.blue} strokeWidth={5} />
              </svg>
              <svg style={{ position: "absolute", right: "12%", bottom: "18%", zIndex: 5 }} width={28} height={28} viewBox="0 0 28 28" fill="none">
                <circle cx={14} cy={14} r={10} stroke={C.yellow} strokeWidth={4} />
              </svg>

              {/* Yellow dot grid */}
              <svg style={{ position: "absolute", right: "0%", top: "4%", zIndex: 5, opacity: .85 }} width={72} height={60} viewBox="0 0 72 60">
                <g fill={C.yellow}>
                  {[6, 22, 38, 54, 70].map(cx => [6, 22, 38].map(cy => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={3.5} />))}
                </g>
              </svg>

              {/* Floating dots */}
              <div className="jr-bounce" style={{ position: "absolute", left: "48%", top: "20%", width: 12, height: 12, borderRadius: "50%", background: C.yellow, zIndex: 5 }} />
              <div className="jr-bounce2" style={{ position: "absolute", right: "8%", bottom: "38%", width: 16, height: 16, borderRadius: "50%", background: C.yellow, zIndex: 5 }} />
              <div style={{ position: "absolute", left: "22%", top: "12%", width: 10, height: 10, borderRadius: "50%", background: C.yellow, zIndex: 5 }} className="jr-bounce" />

              {/* Hero photo placeholder */}
              <div style={{ position: "absolute", left: "28%", bottom: 0, width: "66%", zIndex: 4, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 0, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,rgba(42,95,232,.08),rgba(255,210,63,.1))", borderRadius: "24px 24px 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
                    👦
                  </div>
                </div>
              </div>

              {/* Trust card */}
              <div style={{ position: "absolute", right: -10, bottom: 40, zIndex: 6, background: "#fff", borderRadius: 16, padding: "14px 18px", boxShadow: "0 20px 50px -16px rgba(11,29,58,.25)", border: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", gap: 12, minWidth: 240 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${C.blueDark},${C.blue})`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: display, fontWeight: 600, fontSize: 11.5, color: C.gray500, marginBottom: 2 }}>Dipercaya oleh</div>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 13.5, color: C.ink }}>Sekolah di Seluruh Indonesia</div>
                  <Stars5 />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ STATS BAND ═══════════════════════ */}
        <div style={{ background: "#fff", borderTop: `1px solid ${C.gray200}`, borderBottom: `1px solid ${C.gray200}`, padding: "28px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { n: "10K+", l: "Anak & Remaja Tergabung", color: C.orange },
              { n: "5+", l: "Jalur Talenta (Tracks)", color: C.blue },
              { n: "200+", l: "Program & Challenge Seru", color: C.green },
              { n: "4.9★", l: "Rating Kepuasan Orang Tua", color: C.yellow },
            ].map((s, i) => (
              <div key={s.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", borderRight: i < 3 ? `1px solid ${C.gray200}` : "none" }}>
                <span style={{ fontFamily: display, fontWeight: 900, fontSize: 36, lineHeight: 1, letterSpacing: "-.02em", marginBottom: 4, color: s.color }}>{s.n}</span>
                <span style={{ fontSize: 13, color: C.gray500, fontWeight: 500 }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════ APA ITU TALENTIKA JUNIOR ═══════════════════════ */}
        <section id="fitur" style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.blue50, color: C.blue }}>🌟 Apa itu Talentika Junior?</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Belajar sambil bermain, membangun masa depan<br />dengan sains, teknologi, kreativitas,<br />kewirausahaan, dan peduli lingkungan.
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { emoji: "🔬", title: "Scientist", desc: "Eksplorasi sains dan penelitian", cls: "tr-scientist", accent: C.purple, topBg: C.purple, iconBg: "linear-gradient(135deg,#EDE9FE,#DDD6FE)" },
                { emoji: "💻", title: "Technologist", desc: "Teknologi dan inovasi digital", cls: "tr-tech", accent: C.blue, topBg: C.blue, iconBg: "linear-gradient(135deg,#DBEAFE,#BFDBFE)" },
                { emoji: "💡", title: "Entrepreneur", desc: "Kewirausahaan dan bisnis", cls: "tr-entre", accent: C.orange, topBg: C.orange, iconBg: "linear-gradient(135deg,#FFF7ED,#FED7AA)" },
                { emoji: "🎨", title: "Creative", desc: "Seni dan kreativitas", cls: "tr-creative", accent: C.pink, topBg: C.pink, iconBg: "linear-gradient(135deg,#FDF0F7,#FBCFE8)" },
                { emoji: "🌿", title: "Environmentalist", desc: "Peduli lingkungan", cls: "tr-env", accent: C.green, topBg: C.green, iconBg: "linear-gradient(135deg,#E6F7EF,#A7F3D0)" },
              ].map(t => (
                <div key={t.title} className="jr-track-card" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: "28px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "28px 28px 0 0", background: t.topBg }} />
                  <div style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 18px", display: "grid", placeItems: "center", fontSize: 30, background: t.iconBg, color: t.accent }}>{t.emoji}</div>
                  <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 17, margin: "0 0 6px", color: C.ink }}>{t.title}</h3>
                  <p style={{ fontSize: 13, color: C.gray500, margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CHALLENGE & GAMIFIKASI ═══════════════════════ */}
        <section style={{ padding: "80px 32px", background: C.gray100 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.yellowSoft, color: C.yellowDark }}>🎮 Challenge &amp; Gamifikasi</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Challenge &amp; <span style={{ color: C.blue }}>Gamifikasi</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Sistem pembelajaran interaktif dengan modul "Si Jagoan Sains" dan bidang lainnya</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 48, alignItems: "center" }}>
              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { emoji: "🔍", title: "Discover", desc: "Eksplorasi minat dan bakat alami anak melalui kuis interaktif dan tantangan seru yang menyenangkan.", gradient: `linear-gradient(135deg,${C.blueLight},${C.blue})` },
                  { emoji: "⚡", title: "Develop", desc: "Kembangkan kemampuan melalui challenge mingguan yang dirancang oleh mentor dan pakar di bidangnya.", gradient: `linear-gradient(135deg,${C.orangeLight},${C.orange})` },
                  { emoji: "🏆", title: "Grow", desc: "Raih pencapaian dan portofolio digital yang membuktikan kemampuan nyata anak-anak kita.", gradient: `linear-gradient(135deg,${C.yellow},${C.yellowDark})` },
                ].map(s => (
                  <div key={s.title} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, display: "grid", placeItems: "center", color: s.title === "Grow" ? C.ink : "#fff", flexShrink: 0, fontSize: 22, background: s.gradient }}>
                      {s.emoji}
                    </div>
                    <div>
                      <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 19, margin: "0 0 4px", color: C.ink }}>{s.title}</h4>
                      <p style={{ fontSize: 14, color: C.gray500, margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Journey card */}
              <div style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: 28, boxShadow: "0 6px 28px -8px rgba(42,95,232,.13)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 17, margin: 0, color: C.ink }}>Progress Journey</h4>
                  <span style={{ background: C.yellow, color: C.ink, fontFamily: display, fontWeight: 800, fontSize: 12, padding: "4px 10px", borderRadius: 99 }}>Level 5</span>
                </div>
                {/* Bar */}
                <div style={{ height: 14, background: C.gray200, borderRadius: 99, overflow: "visible", marginBottom: 24, position: "relative" }}>
                  <div style={{ height: "100%", background: `linear-gradient(90deg,${C.blue},${C.blueLight})`, borderRadius: 99, width: "72%", position: "relative" }}>
                    <div style={{ position: "absolute", right: -4, top: -3, width: 20, height: 20, borderRadius: "50%", background: C.yellow, border: "3px solid #fff", boxShadow: "0 2px 8px rgba(255,210,63,.4)" }} />
                  </div>
                </div>
                {/* Milestones */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {[
                    { emoji: "⚡", val: "2.450", lbl: "XP", bg: C.blue50 },
                    { emoji: "🏅", val: "12", lbl: "Badges", bg: "#FFEDE2" },
                    { emoji: "🎁", val: "5", lbl: "Rewards", bg: C.yellowSoft },
                    { emoji: "🌟", val: "#3", lbl: "Wall of Fame", bg: C.orangeSoft },
                  ].map(m => (
                    <div key={m.lbl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, background: m.bg }}>{m.emoji}</div>
                      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 14, color: C.ink }}>{m.val}</div>
                      <div style={{ fontSize: 11, color: C.gray500, fontWeight: 500 }}>{m.lbl}</div>
                    </div>
                  ))}
                </div>
                {/* Tags */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.gray200}`, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.blue50, color: C.blue, padding: "7px 14px", borderRadius: 10, fontFamily: display, fontWeight: 700, fontSize: 12 }}>📚 Learning Path Personalized</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.orangeSoft, color: C.orange, padding: "7px 14px", borderRadius: 10, fontFamily: display, fontWeight: 700, fontSize: 12 }}>📈 Progress Tracking</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.greenSoft, color: C.green, padding: "7px 14px", borderRadius: 10, fontFamily: display, fontWeight: 700, fontSize: 12 }}>🎓 Sertifikat &amp; Achievement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ EXPERIENCE CENTER ═══════════════════════ */}
        <section id="experience" style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.greenSoft, color: C.green }}>🏛 Experience Center</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                <span style={{ color: C.blue }}>Experience Center</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Rasakan keseruan langsung di Talentika Experience Center (bermitra dengan Indonesia Science Center).</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 36 }}>
              {[
                { emoji: "🔍", title: "Discovery Zone", desc: "Eksplorasi interaktif untuk menemukan minat dan bakat tersembunyi yang belum pernah kamu bayangkan sebelumnya.", bg: C.blue50, color: C.blue },
                { emoji: "⚡", title: "Development Zone", desc: "Praktik langsung mengembangkan kemampuan spesifik dengan bimbingan mentor ahli dari berbagai bidang industri.", bg: C.orangeSoft, color: C.orange },
                { emoji: "🏆", title: "Growth Zone", desc: "Showcase hasil karya dan pencapaianmu di depan audiens nyata — juri, orang tua, dan komunitas Talentika.", bg: C.greenSoft, color: C.green },
              ].map(c => (
                <div key={c.title} className="jr-card-hover" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: "32px 24px", textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 28, background: c.bg, color: c.color }}>{c.emoji}</div>
                  <h3 style={{ fontFamily: display, fontWeight: 800, fontSize: 19, margin: "0 0 8px", color: C.ink }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: C.gray500, margin: 0, lineHeight: 1.55 }}>{c.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 22px", background: C.blue50, borderRadius: 14, fontFamily: display, fontWeight: 700, fontSize: 14, color: C.blue }}>
              🏠 Bermitra resmi dengan Indonesia Science Center
            </div>
          </div>
        </section>

        {/* ═══════════════════════ ACHIEVEMENT & WALL OF FAME ═══════════════════════ */}
        <section style={{ padding: "80px 32px", background: C.gray100 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.purpleSoft, color: C.purple }}>🏆 Achievement</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Achievement &amp; <span style={{ color: C.blue }}>Wall of Fame</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Showcase karya &amp; prestasi anak-anak Talentika Junior</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 36 }}>
              {/* Leaderboard */}
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: display, fontWeight: 800, fontSize: 21, color: C.ink, margin: "0 0 18px" }}>🏆 Leaderboard Mingguan</h3>
                {[
                  { rank: 1, emoji: "🔬", name: "Alex S.", tag: "Jagoan Sains Minggu Ini", xp: "2450 XP", rankBg: `linear-gradient(135deg,${C.yellow},${C.yellowDark})` },
                  { rank: 2, emoji: "🎨", name: "Maya L.", tag: "Creative Master", xp: "1890 XP", rankBg: "linear-gradient(135deg,#C0C0C0,#A0A0A0)" },
                  { rank: 3, emoji: "💻", name: "Rio K.", tag: "Tech Innovator", xp: "2100 XP", rankBg: "linear-gradient(135deg,#CD7F32,#A0522D)" },
                ].map(row => (
                  <div key={row.rank} className="jr-lb-row" style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 16, padding: "16px 18px", marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: display, fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0, background: row.rankBg }}>{row.rank}</div>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 20, background: C.gray100, flexShrink: 0 }}>{row.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: C.ink }}>{row.name}</div>
                      <div style={{ fontSize: 12, color: C.gray500 }}>{row.tag}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: C.blue }}>{row.xp}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: C.yellow, color: C.ink, fontFamily: display, fontWeight: 800, fontSize: 12 }}>#{row.rank}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Badge showcase */}
                <div style={{ marginTop: 22, background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 20, padding: 20 }}>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 14 }}>🎖 Badge Terbaru</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { emoji: "🔬", label: "Science Hero", bg: `linear-gradient(135deg,#DBEAFE,${C.blueDark})` },
                      { emoji: "💡", label: "Innovator", bg: `linear-gradient(135deg,#FED7AA,${C.orange})` },
                      { emoji: "🌿", label: "Eco Warrior", bg: `linear-gradient(135deg,#A7F3D0,${C.green})` },
                      { emoji: "🔒", label: "Locked", bg: "linear-gradient(135deg,#F3F4F6,#E5E7EB)", opacity: 0.45 },
                      { emoji: "🔒", label: "Locked", bg: "linear-gradient(135deg,#F3F4F6,#E5E7EB)", opacity: 0.45 },
                    ].map((b, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, opacity: b.opacity ?? 1 }}>
                        <div style={{ width: 48, height: 48, background: b.bg, clipPath: "polygon(50% 0%,95% 25%,95% 75%,50% 100%,5% 75%,5% 25%)", display: "grid", placeItems: "center", fontSize: 20 }}>{b.emoji}</div>
                        <span style={{ fontFamily: display, fontWeight: 700, fontSize: 10, color: C.gray500, textAlign: "center", maxWidth: 52 }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Galeri */}
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: display, fontWeight: 800, fontSize: 21, color: C.ink, margin: "0 0 18px" }}>📸 Galeri Event</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { emoji: "📷", label: "Science Fair 2024", bg: "linear-gradient(160deg,#C7D2FE,#A5B4FC)" },
                    { emoji: "🏆", label: "Tech Competition", bg: "linear-gradient(160deg,#FED7AA,#FDBA74)" },
                    { emoji: "🎨", label: "Creative Workshop", bg: "linear-gradient(160deg,#A7F3D0,#6EE7B7)" },
                    { emoji: "🎖", label: "Award Ceremony", bg: "linear-gradient(160deg,#E9D5FF,#D8B4FE)" },
                  ].map(g => (
                    <div key={g.label} style={{ borderRadius: 20, overflow: "hidden", position: "relative", aspectRatio: "4/3", display: "flex", alignItems: "flex-end", background: g.bg }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 36 }}>{g.emoji}</div>
                      <span style={{ position: "relative", zIndex: 1, background: C.yellow, color: C.ink, padding: "6px 12px", margin: 10, borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12 }}>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ UNTUK ORANG TUA ═══════════════════════ */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.orangeSoft, color: C.orange }}>👨‍👩‍👧 Untuk Orang Tua</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Investasi Terbaik untuk <span style={{ color: C.orange }}>Masa Depan Anak</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Talentika Junior bukan sekadar platform belajar — ini adalah ekosistem pertumbuhan yang menyeluruh untuk buah hati Anda.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
              {[
                { emoji: "🧠", title: "Asesmen Ilmiah", desc: "Kenali potensi anak secara akurat dengan metode psikometri tervalidasi." },
                { emoji: "📊", title: "Dashboard Orang Tua", desc: "Pantau perkembangan, XP, badge, dan progres belajar anak secara real-time." },
                { emoji: "🛡️", title: "Aman & Terpercaya", desc: "Platform bebas konten negatif dengan filter ketat dan moderasi 24/7." },
                { emoji: "🌟", title: "Mentor Berpengalaman", desc: "Didampingi oleh mentor profesional dari berbagai bidang yang terakreditasi." },
              ].map(c => (
                <div key={c.title} className="jr-card-hover" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{c.emoji}</div>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 6 }}>{c.title}</div>
                  <p style={{ fontSize: 13, color: C.gray500, margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ PROGRAM SI JAGOAN ═══════════════════════ */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.purpleSoft, color: C.purple }}>🦸 Program Unggulan</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Program <span style={{ color: C.blue }}>"Si Jagoan"</span> Talentika Junior
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Modul pembelajaran bertema seru yang membangun skill nyata — dari laboratorium sains hingga studio kreatif digital.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { num: "01", emoji: "🔬", title: "Si Jagoan Sains", tag: "Scientist Track · 12 Modul", headerBg: "linear-gradient(145deg,#4F46E5,#7C3AED)", dotColor: C.purple, items: ["Eksperimen kimia & fisika mini", "Proyek riset ilmiah sederhana", "Science fair competition", "Portofolio penelitian digital"], age: "Usia 8–15 tahun", ageBg: C.purpleSoft, ageColor: C.purple, badge: "⚡ Popular" },
                { num: "02", emoji: "💻", title: "Si Jagoan Tech", tag: "Technologist Track · 15 Modul", headerBg: `linear-gradient(145deg,${C.blueDark},${C.blue})`, dotColor: C.blue, items: ["Coding & pemrograman dasar", "Membuat game & aplikasi sederhana", "Robotika & Arduino untuk anak", "Hackathon Junior"], age: "Usia 9–15 tahun", ageBg: C.blue50, ageColor: C.blue, badge: "🔥 Trending" },
                { num: "03", emoji: "💡", title: "Si Jagoan Bisnis", tag: "Entrepreneur Track · 10 Modul", headerBg: "linear-gradient(145deg,#EA580C,#FF6B35)", dotColor: C.orange, items: ["Cara membuat produk & jual", "Pitch ide bisnis ke juri", "Mini bazaar & market day", "Financial literacy for kids"], age: "Usia 10–16 tahun", ageBg: C.orangeSoft, ageColor: C.orange, badge: "✨ Baru" },
                { num: "04", emoji: "🎨", title: "Si Jagoan Kreatif", tag: "Creative Track · 12 Modul", headerBg: "linear-gradient(145deg,#BE185D,#F472B6)", dotColor: C.pink, items: ["Ilustrasi digital & animasi", "Fotografi & videografi kreatif", "Storytelling & komik", "Pameran karya Junior"], age: "Usia 8–15 tahun", ageBg: C.pinkSoft, ageColor: "#BE185D", badge: "🎭 Seru" },
                { num: "05", emoji: "🌿", title: "Si Jagoan Hijau", tag: "Environmentalist Track · 8 Modul", headerBg: "linear-gradient(145deg,#059669,#2DB67D)", dotColor: C.green, items: ["Berkebun & urban farming", "Daur ulang kreatif (upcycling)", "Pemantauan lingkungan & riset", "Eco-project competition"], age: "Usia 7–14 tahun", ageBg: C.greenSoft, ageColor: C.green, badge: "🌍 Impactful" },
                { num: "06", emoji: "🤝", title: "Si Jagoan Sosial", tag: "Leadership Track · 9 Modul", headerBg: "linear-gradient(145deg,#0891B2,#0DBFBF)", dotColor: C.teal, items: ["Public speaking untuk anak", "Kepemimpinan & teamwork", "Social impact mini-project", "Community building"], age: "Usia 10–16 tahun", ageBg: C.tealSoft, ageColor: "#0891B2", badge: "👑 Leader" },
              ].map(p => (
                <div key={p.num} className="jr-card-hover" style={{ borderRadius: 28, overflow: "hidden" }}>
                  {/* Header */}
                  <div style={{ padding: "28px 24px 22px", background: p.headerBg, position: "relative", overflow: "hidden", minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ position: "absolute", top: -10, right: -10, fontFamily: display, fontWeight: 900, fontSize: 80, color: "rgba(255,255,255,.12)", lineHeight: 1, pointerEvents: "none" }}>{p.num}</div>
                    <span style={{ fontSize: 36, marginBottom: 10, display: "block" }}>{p.emoji}</span>
                    <h3 style={{ fontFamily: display, fontWeight: 900, fontSize: 21, color: "#fff", margin: "0 0 4px", lineHeight: 1.15 }}>{p.title}</h3>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.78)", fontWeight: 600 }}>{p.tag}</div>
                  </div>
                  {/* Body */}
                  <div style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderTop: "none", padding: "20px 24px", borderRadius: "0 0 28px 28px" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {p.items.map(item => (
                        <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: C.gray500 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.dotColor, flexShrink: 0 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: display, fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 99, background: p.ageBg, color: p.ageColor }}>{p.age}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: display, fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 99, background: C.yellow, color: C.ink }}>{p.badge}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ LEARNING PATH ═══════════════════════ */}
        <section id="learning-path" style={{ padding: "80px 32px", background: C.gray100 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.blue50, color: C.blue }}>📚 Learning Path</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Perjalanan Belajar yang <span style={{ color: C.blue }}>Terstruktur</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Setiap track punya roadmap yang jelas — dari pemula hingga ahli. Pilih jalurmu dan mulai petualangan!</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, alignItems: "start" }}>
              {/* Tabs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {LP_TABS.map(tab => {
                  const active = activeLP === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setActiveLP(tab.key)} className="jr-lp-tab"
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 20, border: `1.5px solid ${active ? C.blue : C.gray200}`, background: active ? C.blue : "#fff", color: active ? "#fff" : C.gray500, fontFamily: display, fontWeight: 700, fontSize: 14.5, boxShadow: active ? "0 8px 20px -8px rgba(42,95,232,.4)" : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontSize: 18, background: active ? "rgba(255,255,255,.2)" : C.gray100, flexShrink: 0 }}>{tab.emoji}</div>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: 28 }}>
                <h3 style={{ fontFamily: display, fontWeight: 900, fontSize: 22, color: lp.color, margin: "0 0 6px" }}>{lp.title}</h3>
                <div style={{ fontSize: 14, color: C.gray500, marginBottom: 22 }}>{lp.sub}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {lp.stages.map((stage, i) => (
                    <div key={stage.title} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 14, alignItems: "start" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", fontFamily: display, fontWeight: 900, fontSize: 16, color: "#fff", background: lp.color, flexShrink: 0 }}>{i + 1}</div>
                      <div>
                        <div style={{ fontSize: 11, fontFamily: display, fontWeight: 700, color: lp.color, marginBottom: 2 }}>{stage.label}</div>
                        <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: C.ink, margin: "0 0 3px" }}>{stage.title}</h4>
                        <p style={{ fontSize: 13, color: C.gray500, margin: "0 0 8px", lineHeight: 1.5 }}>{stage.desc}</p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {stage.chips.map(chip => (
                            <span key={chip} style={{ fontFamily: display, fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 99, background: C.blue50, color: C.blue }}>{chip}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ UPCOMING EVENTS ═══════════════════════ */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.orangeSoft, color: C.orange }}>📅 Upcoming Events</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Event &amp; Kompetisi <span style={{ color: C.orange }}>Seru</span> Bulan Ini
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Ikuti event, kompetisi, dan workshop seru yang diselenggarakan oleh Talentika Junior setiap bulannya.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
              {[
                { bannerBg: "linear-gradient(135deg,#EDE9FE,#C4B5FD)", emoji: "🔬", date: "25 Mei 2026", trackLabel: "Scientist", trackBg: C.purpleSoft, trackColor: C.purple, title: "Junior Science Fair 2026", location: "GBK, Jakarta", slots: "32 slot tersisa" },
                { bannerBg: "linear-gradient(135deg,#DBEAFE,#93C5FD)", emoji: "💻", date: "1 Jun 2026", trackLabel: "Technologist", trackBg: C.blue50, trackColor: C.blue, title: 'Hackathon Junior "Build the Future"', location: "Online + Offline", slots: "18 slot tersisa" },
                { bannerBg: "linear-gradient(135deg,#FFF7ED,#FED7AA)", emoji: "🎨", date: "8 Jun 2026", trackLabel: "Creative", trackBg: C.pinkSoft, trackColor: "#BE185D", title: 'Pameran Karya Junior "Warna-Warna"', location: "Museum Nasional, Jakarta", slots: "45 slot tersisa" },
                { bannerBg: "linear-gradient(135deg,#E6F7EF,#A7F3D0)", emoji: "🌿", date: "15 Jun 2026", trackLabel: "Environmentalist", trackBg: C.greenSoft, trackColor: C.green, title: "Eco Hero Challenge: Zero Waste School", location: "Seluruh Indonesia", slots: "Terbuka" },
              ].map(ev => (
                <div key={ev.title} className="jr-event-card" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, overflow: "hidden" }}>
                  <div style={{ height: 80, display: "grid", placeItems: "center", fontSize: 40, position: "relative", background: ev.bannerBg }}>
                    {ev.emoji}
                    <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)", backdropFilter: "blur(4px)", borderRadius: 10, padding: "4px 10px", fontFamily: display, fontWeight: 800, fontSize: 11, color: C.ink }}>{ev.date}</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <span style={{ fontFamily: display, fontWeight: 700, fontSize: 11, padding: "4px 10px", borderRadius: 99, marginBottom: 8, display: "inline-block", background: ev.trackBg, color: ev.trackColor }}>{ev.trackLabel}</span>
                    <h4 style={{ fontFamily: display, fontWeight: 800, fontSize: 15, color: C.ink, margin: "0 0 5px", lineHeight: 1.3 }}>{ev.title}</h4>
                    <div style={{ fontSize: 12, color: C.gray500, display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      📍 {ev.location}
                    </div>
                    <span style={{ fontFamily: display, fontWeight: 700, fontSize: 11.5, padding: "4px 10px", borderRadius: 99, background: C.yellowSoft, color: C.yellowDark }}>🎯 {ev.slots}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button style={{ padding: "12px 24px", borderRadius: 12, fontFamily: display, fontWeight: 700, fontSize: 15, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer" }}>
                Lihat Semua Event →
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ MENTORS ═══════════════════════ */}
        <section style={{ padding: "80px 32px", background: C.gray100 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.greenSoft, color: C.green }}>👨‍🏫 Mentor Kami</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Dibimbing oleh <span style={{ color: C.blue }}>Mentor Terbaik</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Semua mentor Talentika Junior adalah profesional terverifikasi yang berpengalaman membimbing anak dan remaja.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
              {[
                { initials: "Dr. R", name: "Dr. Rini Suryani", role: "PhD Biologi, UI", roleColor: C.purple, track: "🔬 Scientist", trackBg: C.purpleSoft, trackColor: C.purple, avBg: "linear-gradient(135deg,#4F46E5,#7C3AED)", bio: "10+ tahun membimbing anak-anak cinta sains melalui eksperimen menyenangkan." },
                { initials: "Bg. T", name: "Bagus Teguh", role: "Software Engineer, Tokopedia", roleColor: C.blue, track: "💻 Technologist", trackBg: C.blue50, trackColor: C.blue, avBg: `linear-gradient(135deg,${C.blueDark},${C.blue})`, bio: "Mengajarkan coding dengan cara yang fun dan relevan untuk generasi digital." },
                { initials: "Cs. M", name: "Cesa Maharani", role: "Young Entrepreneur, Forbes 30U30", roleColor: C.orange, track: "💡 Entrepreneur", trackBg: C.orangeSoft, trackColor: C.orange, avBg: "linear-gradient(135deg,#EA580C,#FF6B35)", bio: "Membantu anak-anak menemukan ide bisnis dan keberanian untuk mencoba." },
                { initials: "Nd. A", name: "Nadia Aulia, M.Si", role: "Aktivis Lingkungan, WWF", roleColor: C.green, track: "🌿 Environmentalist", trackBg: C.greenSoft, trackColor: C.green, avBg: "linear-gradient(135deg,#059669,#2DB67D)", bio: "Menginspirasi generasi muda untuk menjadi penjaga bumi dengan aksi nyata." },
              ].map(m => (
                <div key={m.name} className="jr-card-hover" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: 24, textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 22, margin: "0 auto 14px", display: "grid", placeItems: "center", fontFamily: display, fontWeight: 900, fontSize: 26, color: "#fff", background: m.avBg }}>{m.initials}</div>
                  <div style={{ fontFamily: display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 3 }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, fontFamily: display, fontWeight: 700, color: m.roleColor, marginBottom: 8 }}>{m.role}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, background: m.trackBg, color: m.trackColor, marginBottom: 10 }}>{m.track}</span>
                  <p style={{ fontSize: 12.5, color: C.gray500, lineHeight: 1.5, margin: "0 0 10px" }}>{m.bio}</p>
                  <Stars5 />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONI ═══════════════════════ */}
        <section style={{ padding: "80px 32px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.yellowSoft, color: C.yellowDark }}>💬 Testimoni</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Kata Mereka tentang <span style={{ color: C.blue }}>Talentika Junior</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Orang tua, anak, dan guru yang merasakan dampak nyata dari Talentika Junior.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { quote: "Anak saya yang tadinya pemalu sekarang berani presentasi di depan puluhan orang. Challenge dan komunitas Talentika Junior benar-benar mengubahnya!", avBg: `linear-gradient(135deg,#4F46E5,${C.purple})`, initials: "Ibu R", name: "Ibu Ratna Dewi", role: "Orang Tua · Jakarta Selatan", tagBg: C.purpleSoft, tagColor: C.purple, tag: "🔬 Scientist Track" },
                { quote: "Aku suka banget belajar coding di Talentika Junior! Mentornya sabar dan seru. Sekarang aku udah bisa bikin game sendiri lho!", avBg: `linear-gradient(135deg,${C.blueDark},${C.blue})`, initials: "Rio", name: "Rio Kurniawan", role: "Siswa SD, 12 tahun · Bandung", tagBg: C.blue50, tagColor: C.blue, tag: "💻 Tech Track" },
                { quote: "Sebagai guru SD, program Talentika Junior sangat membantu saya membimbing siswa mengenal potensi diri. Dashboard guru-nya sangat informatif!", avBg: "linear-gradient(135deg,#059669,#2DB67D)", initials: "Bu S", name: "Bu Siti Aminah, S.Pd", role: "Guru SD Negeri, Surabaya", tagBg: C.greenSoft, tagColor: C.green, tag: "🏫 Sekolah Mitra" },
              ].map(t => (
                <div key={t.name} className="jr-card-hover" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 28, padding: 26, position: "relative", overflow: "hidden" }}>
                  <div style={{ fontFamily: "Georgia,serif", fontSize: 70, lineHeight: .75, position: "absolute", top: 12, right: 20, opacity: .09, color: C.blue }}>"</div>
                  <Stars5 />
                  <blockquote style={{ fontFamily: display, fontWeight: 600, fontSize: 14.5, lineHeight: 1.6, color: C.ink, margin: "12px 0 18px" }}>{t.quote}</blockquote>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.gray200}` }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", fontFamily: display, fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0, background: t.avBg }}>{t.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: C.ink }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: C.gray500 }}>{t.role}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: display, fontWeight: 700, fontSize: 11, padding: "4px 9px", borderRadius: 99, background: t.tagBg, color: t.tagColor }}>{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HARGA ═══════════════════════ */}
        <section id="harga" style={{ padding: "80px 32px", background: C.gray100 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, fontFamily: display, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14, background: C.blue50, color: C.blue }}>💰 Harga</span>
              <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-.025em", color: C.ink, margin: "0 0 12px", lineHeight: 1.1 }}>
                Pilih Paket untuk <span style={{ color: C.blue }}>Buah Hatimu</span>
              </h2>
              <p style={{ fontSize: 16, color: C.gray500, maxWidth: "56ch", margin: "0 auto", lineHeight: 1.6 }}>Investasi yang terjangkau untuk masa depan anak yang luar biasa. Coba gratis selama 7 hari!</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22, maxWidth: 1100, margin: "0 auto" }}>
              {/* Explorer */}
              <div className="jr-price-card" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 40, overflow: "hidden" }}>
                <div style={{ padding: 10, textAlign: "center", fontFamily: display, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(90deg,${C.blue},${C.blueLight})`, color: "#fff" }}>🌟 Starter</div>
                <div style={{ padding: "28px 26px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px", display: "grid", placeItems: "center", fontSize: 28, background: C.blue50 }}>🔍</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 20, textAlign: "center", color: C.ink, marginBottom: 4 }}>Explorer</div>
                  <div style={{ fontSize: 13, color: C.gray500, textAlign: "center", marginBottom: 20 }}>Cocok untuk memulai perjalanan</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 36, textAlign: "center", color: C.blue, letterSpacing: "-.02em", lineHeight: 1, marginBottom: 4 }}>Rp 59.000<span style={{ fontSize: 14, color: C.gray500, fontWeight: 600 }}>/bln</span></div>
                  <div style={{ fontSize: 12, color: C.gray500, textAlign: "center", marginBottom: 22 }}>atau Rp 590.000 / tahun (hemat 17%)</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Akses 1 track pilihan", "Progress journey & XP system", "5 challenge per bulan", "Dashboard orang tua", "Komunitas Junior"].map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: C.gray500 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: C.greenSoft, color: C.green }}><CheckIcon /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleRegister} style={{ width: "100%", padding: 13, borderRadius: 12, fontFamily: display, fontWeight: 700, fontSize: 14, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer" }}>Coba 7 Hari Gratis</button>
                </div>
              </div>

              {/* Jagoan (featured) */}
              <div className="jr-price-card jr-price-featured" style={{ background: "#fff", borderRadius: 40, overflow: "hidden" }}>
                <div style={{ padding: 10, textAlign: "center", fontFamily: display, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(90deg,${C.orange},${C.orangeLight})`, color: "#fff" }}>🏆 Paling Populer — Si Jagoan!</div>
                <div style={{ padding: "28px 26px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px", display: "grid", placeItems: "center", fontSize: 28, background: C.orangeSoft }}>🦸</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 20, textAlign: "center", color: C.ink, marginBottom: 4 }}>Jagoan</div>
                  <div style={{ fontSize: 13, color: C.gray500, textAlign: "center", marginBottom: 20 }}>Untuk anak yang ingin jadi yang terbaik</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 36, textAlign: "center", color: C.orange, letterSpacing: "-.02em", lineHeight: 1, marginBottom: 4 }}>Rp 99.000<span style={{ fontSize: 14, color: C.gray500, fontWeight: 600 }}>/bln</span></div>
                  <div style={{ fontSize: 12, color: C.gray500, textAlign: "center", marginBottom: 22 }}>atau Rp 890.000 / tahun (hemat 25%)</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[["Akses semua 6 track", true], ["Unlimited challenge", true], ["Mentoring 1-on-1 (2x/bulan)", true], ["Prioritas event & kompetisi", true], ["Digital portofolio builder", true], ["Sertifikat resmi Talentika", true], ["Wall of Fame & leaderboard", true]].map(([f, star]) => (
                      <li key={f as string} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: C.gray500 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: C.yellowSoft, color: C.yellowDark }}><StarIcon size={10} fill={C.yellowDark} /></div>
                        {f as string}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleRegister} style={{ width: "100%", padding: 14, borderRadius: 12, fontFamily: display, fontWeight: 700, fontSize: 15, background: `linear-gradient(135deg,${C.orange},#E8461D)`, color: "#fff", border: "none", cursor: "pointer" }}>Daftar Sekarang 🚀</button>
                </div>
              </div>

              {/* Sekolah */}
              <div className="jr-price-card" style={{ background: "#fff", border: `1.5px solid ${C.gray200}`, borderRadius: 40, overflow: "hidden" }}>
                <div style={{ padding: 10, textAlign: "center", fontFamily: display, fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(90deg,${C.green},${C.teal})`, color: "#fff" }}>🏫 Untuk Sekolah &amp; Grup</div>
                <div style={{ padding: "28px 26px" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px", display: "grid", placeItems: "center", fontSize: 28, background: C.greenSoft }}>🏫</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 20, textAlign: "center", color: C.ink, marginBottom: 4 }}>Sekolah / Grup</div>
                  <div style={{ fontSize: 13, color: C.gray500, textAlign: "center", marginBottom: 20 }}>Min. 20 siswa — harga spesial</div>
                  <div style={{ fontFamily: display, fontWeight: 900, fontSize: 36, textAlign: "center", color: C.green, letterSpacing: "-.02em", lineHeight: 1, marginBottom: 4 }}>Custom<span style={{ fontSize: 14, color: C.gray500, fontWeight: 600 }}> /siswa</span></div>
                  <div style={{ fontSize: 12, color: C.gray500, textAlign: "center", marginBottom: 22 }}>Hubungi kami untuk penawaran khusus</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {["Semua fitur Jagoan", "Dashboard admin sekolah", "Laporan per kelas & siswa", "Pelatihan guru inklusif", "Event eksklusif sekolah", "Dedicated support manager"].map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: C.gray500 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2, background: C.greenSoft, color: C.green }}><CheckIcon /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={handleWAPartner} style={{ width: "100%", padding: 13, borderRadius: 12, fontFamily: display, fontWeight: 700, fontSize: 14, background: "#fff", color: C.green, border: `1.5px solid ${C.green}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <WAIcon /> Hubungi via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CTA ═══════════════════════ */}
        <section style={{ padding: "80px 32px", background: "linear-gradient(160deg,#F0F5FF 0%,#FFF9F0 60%,#F5FFF8 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* blobs */}
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,#BFDBFE,transparent 70%)", top: -100, left: "10%", opacity: .7, pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,#FED7AA,transparent 70%)", bottom: -100, right: "10%", opacity: .6, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontFamily: display, fontWeight: 900, fontSize: "clamp(30px,4vw,48px)", letterSpacing: "-.03em", lineHeight: 1.1, color: C.ink, margin: "0 0 14px" }}>
              Ayo Bergabung Bersama <span style={{ color: C.blue }}>Talentika Junior,</span><br />
              Jadi Bagian dari <span style={{ color: C.orange }}>Masa Depan Indonesia!</span>
            </h2>
            <p style={{ fontSize: 17, color: C.gray500, maxWidth: "54ch", margin: "0 auto 36px", lineHeight: 1.65 }}>Mulai perjalanan seru menemukan dan mengembangkan bakat anak sejak dini</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleRegister} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "18px 36px", borderRadius: 16, fontFamily: display, fontWeight: 700, fontSize: 18, background: `linear-gradient(135deg,${C.orange},#E8461D)`, color: "#fff", border: "none", cursor: "pointer", boxShadow: `0 6px 20px -6px rgba(255,107,53,.45)` }}>
                Daftar Sekarang →
              </button>
              <button onClick={handleWAPartner} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "18px 36px", borderRadius: 16, fontFamily: display, fontWeight: 700, fontSize: 18, background: "#fff", color: C.ink, border: `1.5px solid ${C.gray200}`, cursor: "pointer" }}>
                <WAIcon /> Bergabung Jadi Mitra
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FOOTER ═══════════════════════ */}
        <footer style={{ background: "#1E293B", color: "#CBD5E1", padding: "56px 32px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.3fr", gap: 48, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},#1E40AF)`, display: "grid", placeItems: "center", position: "relative" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" /></svg>
                  <span style={{ position: "absolute", top: -3, right: -3, color: C.yellow, fontSize: 12 }}>✦</span>
                </div>
                <div>
                  <b style={{ fontFamily: display, fontWeight: 800, fontSize: 19, color: "#fff", display: "block" }}>Talentika</b>
                  <small style={{ display: "block", fontSize: 10, color: "#64748B" }}>Discover Your Full Potential</small>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: "#94A3B8", lineHeight: 1.65, maxWidth: "36ch", margin: "0 0 18px" }}>Talentika membantu generasi muda menemukan passion dan mengembangkan talenta melalui assessment yang komprehensif dan panduan karir yang personal.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {["IG", "YT", "TK"].map(s => (
                  <button key={s} className="jr-social-btn">{s}</button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: "#fff", margin: "0 0 18px" }}>Tautan Cepat</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Beranda", "/"], ["Fitur", "#fitur"], ["Cara Kerja", "#"], ["Harga", "#harga"], ["Kontak", "#"]].map(([label, href]) => (
                  <li key={label as string}><a href={href as string} className="jr-foot-link">{label as string}</a></li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: "#fff", margin: "0 0 18px" }}>Layanan</h5>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {["Tes Minat & Bakat", "Eksplorasi Karir", "Learning Hub", "Komunitas Belajar", "Portfolio Builder"].map(item => (
                  <li key={item}><a className="jr-foot-link">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 style={{ fontFamily: display, fontWeight: 700, fontSize: 15, color: "#fff", margin: "0 0 18px" }}>Kontak</h5>
              {[
                { icon: "✉", text: "Discover@Talentika.id" },
                { icon: "📞", text: "+62 851 4843 4141" },
                { icon: "📍", text: "Jalan Kuningan Mulia Lot 9 B, Kota Adm. Jakarta Selatan, DKI Jakarta" },
              ].map(c => (
                <div key={c.icon} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, fontSize: 13.5, color: "#94A3B8" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,.07)", color: "#7DD3FC", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 13 }}>{c.icon}</div>
                  {c.text}
                </div>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#64748B", flexWrap: "wrap", gap: 10 }}>
            <span>© 2025 Talentika by PT. Invisi Karya Indonesia. Semua hak dilindungi undang-undang.</span>
            <span style={{ display: "flex", gap: 16 }}>
              <a href="/privacy" className="jr-foot-link">Kebijakan Privasi</a>
              <a href="/terms" className="jr-foot-link">Syarat &amp; Ketentuan</a>
            </span>
          </div>
        </footer>

        <WhatsAppButton />
      </div>
    </>
  );
}
