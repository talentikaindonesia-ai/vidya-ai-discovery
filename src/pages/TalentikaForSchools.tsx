import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import "./TalentikaForSchools.css";

/* ── SVG helpers ─────────────────────────────────────────── */
const IcoSchool = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/>
  </svg>
);
const IcoShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>
  </svg>
);
const IcoUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
  </svg>
);
const IcoTrend = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>
  </svg>
);
const IcoBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M19 19H6"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);
const IcoPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
);
const IcoCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IcoUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6"/>
    <circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4-5-4"/>
  </svg>
);
const IcoChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
  </svg>
);
const IcoStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
  </svg>
);
const IcoWa = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2zM12 21a9 9 0 01-4.6-1.3l-3.2.8.9-3.1A9 9 0 1112 21z"/>
  </svg>
);

/* ── Reveal hook ─────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("sp-in"); io.disconnect(); } },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── Reveal wrapper ── */
function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="sp-reveal" style={style}>{children}</div>;
}

/* ── FAQ Item ─────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sp-faq${open ? " open" : ""}`}>
      <button className="sp-faq-summary" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span className="sp-faq-icon"><IcoPlus /></span>
      </button>
      {open && <div className="sp-faq-body">{a}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
const TalentikaForSchools = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Talentika for School — Platform Pengembangan Diri & Talenta Siswa"
        description="Platform terintegrasi untuk sekolah dalam mengembangkan potensi dan karakter siswa — asesmen ilmiah, dashboard admin, mentoring, dan laporan real-time."
        keywords="talentika sekolah, platform pendidikan, asesmen siswa, pengembangan karakter, dashboard sekolah"
      />
      <Header />

      <div className="school-page">
        {/* ══ HERO ══════════════════════════════════════════════ */}
        <header className="sp-hero">
          <div className="sp-hero-grid">
            {/* Left copy */}
            <div>
              <div className="sp-badge">
                <div className="sp-badge-ico"><IcoSchool /></div>
                Talentika for School
              </div>

              <h1>
                Platform Pengembangan<br />
                Diri &amp; Talenta Siswa<br />
                Terintegrasi{" "}
                <span className="sp-blue">untuk Sekolah</span>
              </h1>

              <p className="sp-lede">
                Talentika membantu sekolah mencetak generasi berkarakter, kompeten, dan siap menghadapi masa depan melalui pembelajaran, mentoring, dan pengembangan diri yang terukur.
              </p>

              <div className="sp-hero-btns">
                <button className="sp-btn-primary" onClick={() => navigate("/auth")}>
                  Daftar Sekolah Anda <IcoArrow />
                </button>
                <button className="sp-btn-secondary">
                  <IcoPlay /> Lihat Demo
                </button>
              </div>

              {/* 4 mini feature highlights */}
              <div className="sp-feat-row">
                {[
                  { cls: "c1", ico: <IcoBook />, title: "Pembelajaran Berkualitas", desc: "Kursus sesuai kebutuhan siswa dan kurikulum." },
                  { cls: "c2", ico: <IcoUser />, title: "Mentoring Personal", desc: "Bimbingan dari mentor profesional dan ahli." },
                  { cls: "c3", ico: <IcoTrend />, title: "Tracking Terukur", desc: "Pantau progress, potensi, dan pencapaian siswa." },
                  { cls: "c4", ico: <IcoShield />, title: "Karakter & Soft Skill", desc: "Bangun karakter positif dan soft skill sejak dini." },
                ].map((f) => (
                  <div key={f.title} className="sp-fi">
                    <div className={`sp-fi-ico ${f.cls}`}>{f.ico}</div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="sp-hero-visual">
              <div className="sp-hero-blob" />

              {/* Decorative sparkles */}
              <svg className="sp-dot" style={{ top: "34%", left: "46%", fontSize: 24 }} width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
              <svg className="sp-dot" style={{ top: "20%", left: "54%", color: "#3B82F6", animationDelay: ".4s" }} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
              <svg className="sp-dot" style={{ bottom: "30%", right: "8%", color: "#93C5FD", animationDelay: ".8s" }} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>

              {/* Photo placeholder */}
              <div className="sp-hero-photo">
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.6)", padding: 32 }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: .4, marginBottom: 12 }}><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/></svg>
                  <p style={{ fontFamily: "var(--sp-display)", fontWeight: 700, fontSize: 14, margin: 0 }}>Talentika for School</p>
                </div>
              </div>

              {/* Trust card */}
              <div className="sp-trust">
                <div className="sp-trust-ico"><IcoShield /></div>
                <h5>
                  Dipercaya oleh<br />
                  <b>Ribuan Sekolah</b><br />
                  di Seluruh Indonesia
                  <div className="sp-stars">
                    {[...Array(5)].map((_, i) => <IcoStar key={i} />)}
                  </div>
                </h5>
              </div>
            </div>
          </div>
        </header>

        {/* ══ MANFAAT BAND ══════════════════════════════════════ */}
        <section id="manfaat" className="sp-manfaat-wrap">
          <Reveal>
            <div className="sp-manfaat-band">
              <div className="sp-manfaat-title">Manfaat untuk<br />Sekolah Anda</div>
              {[
                { ico: <IcoShield />, text: "Meningkatkan kualitas pembelajaran & daya saing sekolah" },
                { ico: <IcoUser />, text: "Membantu guru dalam memantau perkembangan siswa" },
                { ico: <IcoTrend />, text: "Mendukung program sekolah berbasis data dan insight" },
                { ico: <IcoUsers />, text: "Membangun ekosistem positif untuk siswa, guru, dan orang tua" },
              ].map((m, i) => (
                <div key={i} className="sp-manfaat-item">
                  <div className="sp-mi-ico">{m.ico}</div>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ══ POSITIONING + KAMI BERBEDA ════════════════════════ */}
        <section id="positioning" className="sp-section">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head center">
                <span className="sp-eyebrow blue">Brand Positioning</span>
                <h2>Mengapa <span className="sp-blue">Talentika for School?</span></h2>
                <p>Bukan sekadar platform — kami adalah mitra strategis sekolah dalam membangun generasi hebat yang berkarakter dan berprestasi.</p>
              </div>
            </Reveal>

            <div className="sp-pos-grid">
              <Reveal>
                <div className="sp-pos-card">
                  <div className="sp-card-eyebrow">Our Positioning</div>
                  <p>Talentika for School adalah <b>platform terintegrasi pertama di Indonesia</b> yang menggabungkan asesmen potensi, pengembangan diri, dan penguatan karakter untuk mendukung sekolah dalam menciptakan ekosistem pendidikan yang holistik dan berdampak nyata.</p>
                  <div style={{ marginTop: 20, padding: 18, background: "#EFF6FF", borderRadius: 14, borderLeft: "4px solid #1D4ED8" }}>
                    <div style={{ fontFamily: "var(--sp-display)", fontWeight: 800, fontSize: 11, color: "#1E40AF", letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 6 }}>Our Positioning Statement</div>
                    <p style={{ fontFamily: "var(--sp-display)", fontWeight: 500, fontSize: 14, color: "var(--sp-ink)", margin: 0, lineHeight: 1.6 }}>
                      Talentika for School adalah <b style={{ color: "#1E40AF" }}>mitra strategis sekolah</b> dalam <b style={{ color: "#FF6A00" }}>mengembangkan potensi dan karakter siswa</b> secara terintegrasi, untuk menciptakan <b style={{ color: "#0F7A3E" }}>generasi hebat</b> yang siap meraih masa depan dan memberi dampak.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="sp-kami-card">
                  <div className="sp-card-eyebrow">Kami Berbeda</div>
                  <p>Talentika dirancang oleh praktisi pendidikan & psikolog untuk memberikan dampak nyata pada perkembangan siswa.</p>
                  <ul className="sp-kami-list">
                    {[
                      "Pendekatan ilmiah & terverifikasi",
                      "Solusi terintegrasi & mudah digunakan",
                      "Konten relevan & terus diperbarui",
                      "Dampak terukur untuk siswa & sekolah",
                      "Didukung oleh komunitas & ahli terbaik",
                    ].map((item) => (
                      <li key={item}>
                        <span className="sp-kami-check"><IcoCheck size={12} /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ TARGET AUDIENCE ═══════════════════════════════════ */}
        <section className="sp-section sp-section-tint">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head center">
                <span className="sp-eyebrow">Our Target</span>
                <h2>Untuk Siapa <span className="sp-blue">Talentika for School?</span></h2>
                <p>Satu platform yang melayani semua aktor utama dalam ekosistem pendidikan — sekolah, guru, dan siswa.</p>
              </div>
            </Reveal>

            <div className="sp-target-grid">
              {[
                {
                  t: "t1",
                  ico: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/></svg>,
                  title: "Sekolah", meta: "SD · SMP · SMA · SMK",
                  desc: "Yang ingin meningkatkan kualitas pendidikan, pembinaan karakter, dan kesiapan siswa menghadapi masa depan dengan ekosistem yang terstruktur.",
                },
                {
                  t: "t2",
                  ico: <IcoUsers />,
                  title: "Guru & Tenaga Pendidik", meta: "Wali Kelas · BK · Mentor",
                  desc: "Yang ingin mendapatkan data dan insight untuk mendampingi siswa secara lebih tepat dan efektif berbasis hasil asesmen yang valid.",
                },
                {
                  t: "t3",
                  ico: <IcoUser />,
                  title: "Siswa", meta: "Generasi Penerus Bangsa",
                  desc: "Yang ingin mengenali potensi diri, mengembangkan kemampuan, dan meraih masa depan terbaiknya melalui pembelajaran yang relevan dan menyenangkan.",
                },
              ].map((c) => (
                <Reveal key={c.t}>
                  <div className="sp-target-card">
                    <div className={`sp-target-ico ${c.t}`}>{c.ico}</div>
                    <h3>{c.title}</h3>
                    <div className={`sp-target-meta ${c.t}`}>{c.meta}</div>
                    <p>{c.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ VALUE PROPOSITION ═════════════════════════════════ */}
        <section id="fitur" className="sp-section">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head center">
                <span className="sp-eyebrow">Our Value Proposition</span>
                <h2>Empat Kekuatan Utama untuk <span className="sp-blue">Sekolah Hebat</span></h2>
                <p>Setiap fitur Talentika for School dirancang untuk mendukung sekolah dari hulu ke hilir — dari mengenali potensi hingga mengukur dampak.</p>
              </div>
            </Reveal>

            <div className="sp-value-grid">
              {[
                {
                  v: "v1",
                  ico: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><circle cx="11" cy="11" r="2.5" fill="currentColor"/></svg>,
                  title: "Kenali Potensi Secara Akurat",
                  desc: "Asesmen ilmiah berbasis Holland, MBTI, dan Multiple Intelligences untuk memetakan potensi, minat, bakat, dan gaya belajar setiap siswa dengan akurasi tinggi.",
                },
                {
                  v: "v2",
                  ico: <IcoBook />,
                  title: "Kembangkan Diri & Karakter",
                  desc: "Program dan konten pembelajaran lengkap untuk pengembangan diri, soft skills, dan karakter positif yang relevan dengan kebutuhan masa depan.",
                },
                {
                  v: "v3",
                  ico: <IcoChart />,
                  title: "Pantau & Ukur Perkembangan",
                  desc: "Dashboard dan laporan komprehensif untuk memantau perkembangan siswa secara berkelanjutan — by individual, kelas, jurusan, atau seluruh sekolah.",
                },
                {
                  v: "v4",
                  ico: <IcoUsers />,
                  title: "Kolaborasi & Dukungan",
                  desc: "Ekosistem kolaboratif antara sekolah, guru, siswa, orang tua, dan komunitas Talentika untuk hasil pembinaan yang maksimal dan berkelanjutan.",
                },
              ].map((c) => (
                <Reveal key={c.v}>
                  <div className="sp-value-card">
                    <div className={`sp-value-ico ${c.v}`}>{c.ico}</div>
                    <div>
                      <h3>{c.title}</h3>
                      <p>{c.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Stats bar */}
            <Reveal>
              <div className="sp-stats-bar">
                {[
                  { ico: <IcoSchool />, n: "500", acc: "+", l: "Sekolah Mitra di Indonesia" },
                  { ico: <IcoUser />, n: "120K", acc: "+", l: "Siswa Tergabung" },
                  { ico: <IcoTrend />, n: "95", acc: "%", l: "Tingkat Akurasi Asesmen" },
                  { ico: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>, n: "4.9", acc: "★", l: "Rating Kepuasan Sekolah" },
                ].map((s) => (
                  <div key={s.l} className="sp-stat-cell">
                    <div className="sp-stat-ico">{s.ico}</div>
                    <div className="sp-stat-n">{s.n}<span className="acc">{s.acc}</span></div>
                    <div className="sp-stat-l">{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ SATU PLATFORM BANYAK SOLUSI ═══════════════════════ */}
        <section className="sp-section sp-section-tint">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head">
                <span className="sp-eyebrow blue">Dashboard Sekolah</span>
                <h2>Satu Platform, <span className="sp-blue">Banyak Solusi</span></h2>
                <p>Akses semua kebutuhan sekolah dalam satu dashboard yang intuitif — mulai dari katalog kursus, mentoring, asesmen, hingga laporan analitik real-time.</p>
              </div>
            </Reveal>

            <div className="sp-dash-grid">
              {/* Feature list */}
              <Reveal>
                <div className="sp-df-list">
                  {[
                    { r: "r1", ico: <IcoBook />, title: "Katalog Kursus Lengkap", desc: "Ribuan kursus berkualitas dari berbagai bidang untuk mendukung pembelajaran dan pengembangan diri siswa." },
                    { r: "r2", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 11-3-6l3-1-1 3a8 8 0 011 4z"/></svg>, title: "Mentoring & Konsultasi", desc: "Siswa dapat berkonsultasi dan mendapatkan arahan langsung dari mentor berpengalaman." },
                    { r: "r3", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>, title: "Asesmen & Potensi Diri", desc: "Tes psikometri dan asesmen untuk membantu siswa mengenali potensi dan minat terbaiknya." },
                    { r: "r4", ico: <IcoChart />, title: "Laporan & Analitik Sekolah", desc: "Dapatkan laporan perkembangan siswa secara real-time untuk pengambilan keputusan yang lebih baik." },
                    { r: "r5", ico: <IcoUsers />, title: "Kolaborasi Multi-Pihak", desc: "Hubungkan sekolah, guru, siswa, dan orang tua dalam satu ekosistem yang transparan." },
                  ].map((f) => (
                    <div key={f.r} className="sp-df-row">
                      <div className={`sp-df-ico ${f.r}`}>{f.ico}</div>
                      <div><h4>{f.title}</h4><p>{f.desc}</p></div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Dashboard mockup */}
              <Reveal>
                <div className="sp-dash-mock">
                  <div className="sp-dm-inner">
                    {/* Sidebar */}
                    <div className="sp-dm-side">
                      <div className="sp-dm-brand">
                        <svg width="24" height="24" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1D4ED8"/><path d="M16 7l1.6 5.4L23 14l-5.4 1.6L16 21l-1.6-5.4L9 14l5.4-1.6z" fill="#fff"/></svg>
                        <b>Talentika<span style={{ color: "#FFC107" }}>✦</span></b>
                      </div>
                      <div className="sp-dm-nav">
                        {["Dashboard", "Siswa", "Kursus", "Mentoring", "Asesmen", "Laporan", "Pengumuman", "Pengaturan"].map((n, i) => (
                          <div key={n} className={`sp-dm-nv${i === 0 ? " active" : ""}`}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {i === 0 && <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>}
                              {i === 1 && <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>}
                              {i === 2 && <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/>}
                              {i === 3 && <path d="M21 12a8 8 0 11-3-6l3-1-1 3a8 8 0 011 4z"/>}
                              {i === 4 && <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/>}
                              {i === 5 && <><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>}
                              {i === 6 && <path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>}
                              {i === 7 && <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 11-14 0 7 7 0 0114 0z"/></>}
                            </svg>
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main area */}
                    <div className="sp-dm-main">
                      <div className="sp-dm-head">
                        <h3>Ringkasan Sekolah</h3>
                        <div className="sp-dm-av-row">
                          <div className="sp-dm-av">SC</div>
                          <div>
                            <div style={{ fontSize: 10, color: "#374151", fontFamily: "var(--sp-display)", fontWeight: 600 }}>SMA Cerdas Bangsa</div>
                            <div style={{ fontSize: 9, color: "#6B7280" }}>Admin Sekolah</div>
                          </div>
                        </div>
                      </div>

                      <div className="sp-dm-stats">
                        {[
                          { lbl: "Siswa Aktif", val: "1.250", delta: "+12% dari bulan lalu" },
                          { lbl: "Kursus Diikuti", val: "320", delta: "+10% dari bulan lalu" },
                          { lbl: "Jam Belajar", val: "2.450", delta: "+18% dari bulan lalu" },
                          { lbl: "Sertifikat", val: "180", delta: "+25% dari bulan lalu" },
                        ].map((s) => (
                          <div key={s.lbl} className="sp-dm-stat">
                            <div className="lbl">{s.lbl}</div>
                            <div className="val">{s.val}</div>
                            <div className="delta">{s.delta}</div>
                          </div>
                        ))}
                      </div>

                      <div className="sp-dm-charts">
                        <div className="sp-dm-card">
                          <h4>Progress Belajar Siswa</h4>
                          <svg viewBox="0 0 280 100" width="100%" height="80" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0" stopColor="#3B82F6" stopOpacity=".25"/>
                                <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <g stroke="#E5E7EB" strokeWidth=".6">
                              <line x1="20" y1="20" x2="280" y2="20"/>
                              <line x1="20" y1="50" x2="280" y2="50"/>
                              <line x1="20" y1="80" x2="280" y2="80"/>
                            </g>
                            <path d="M20 70 L70 60 L120 64 L170 40 L220 36 L270 18" fill="none" stroke="#1D4ED8" strokeWidth="2"/>
                            <path d="M20 70 L70 60 L120 64 L170 40 L220 36 L270 18 L270 95 L20 95 Z" fill="url(#lg1)"/>
                            <g fill="#1D4ED8">
                              <circle cx="20" cy="70" r="2.5"/><circle cx="70" cy="60" r="2.5"/><circle cx="120" cy="64" r="2.5"/>
                              <circle cx="170" cy="40" r="2.5"/><circle cx="220" cy="36" r="2.5"/>
                              <circle cx="270" cy="18" r="3" stroke="#fff" strokeWidth="1.5"/>
                            </g>
                            <g fontFamily="Inter" fontSize="7" fill="#94A3B8">
                              <text x="20" y="98">Jan</text><text x="68" y="98">Feb</text><text x="118" y="98">Mar</text>
                              <text x="168" y="98">Apr</text><text x="218" y="98">Mei</text><text x="266" y="98">Jun</text>
                            </g>
                          </svg>
                        </div>
                        <div className="sp-dm-card">
                          <h4>Top Kategori</h4>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <svg width="70" height="70" viewBox="0 0 42 42">
                              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#E5E7EB" strokeWidth="6"/>
                              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#1D4ED8" strokeWidth="6" strokeDasharray="40 100" strokeDashoffset="25" transform="rotate(-90 21 21)"/>
                              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#FF6A00" strokeWidth="6" strokeDasharray="25 100" strokeDashoffset="-15" transform="rotate(-90 21 21)"/>
                              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#FFC107" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-40" transform="rotate(-90 21 21)"/>
                              <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#7C3AED" strokeWidth="6" strokeDasharray="15 100" strokeDashoffset="-60" transform="rotate(-90 21 21)"/>
                            </svg>
                            <div style={{ fontSize: 9, color: "#374151", display: "flex", flexDirection: "column", gap: 3 }}>
                              {[["#1D4ED8","Teknologi","40%"],["#FF6A00","Bisnis","25%"],["#FFC107","Desain","20%"],["#7C3AED","P. Diri","15%"]].map(([c,l,v]) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ width: 7, height: 7, background: c, borderRadius: 2, display: "inline-block" }}/>
                                  {l} <b style={{ marginLeft: "auto" }}>{v}</b>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sp-dm-list">
                        <h4 style={{ fontFamily: "var(--sp-display)", fontWeight: 700, fontSize: 11, margin: "0 0 6px", color: "var(--sp-ink)" }}>Aktivitas Terbaru</h4>
                        {[
                          { av: "SA", grad: "linear-gradient(135deg,#3B82F6,#1D4ED8)", name: "Siti Aisyah", action: "menyelesaikan kursus", item: "Public Speaking Mastery", time: "2 jam lalu" },
                          { av: "RP", grad: "linear-gradient(135deg,#FF8A33,#FF6A00)", name: "Rafi Pratama", action: "mendapatkan sertifikat", item: "UI/UX Design Fundamentals", time: "5 jam lalu" },
                          { av: "DK", grad: "linear-gradient(135deg,#FFD23F,#FFC107)", name: "Dimas Kurniawan", action: "bergabung dengan komunitas", item: "Tech Innovators", time: "1 hari lalu" },
                        ].map((li) => (
                          <div key={li.name} className="sp-dm-li">
                            <div className="sp-dm-li-row">
                              <div className="sp-dm-av-sm" style={{ background: li.grad }}>{li.av}</div>
                              <div>
                                <b style={{ fontFamily: "var(--sp-display)", fontWeight: 600 }}>{li.name}</b>
                                {" "}{li.action}{" "}
                                <i style={{ color: "#1E40AF" }}>{li.item}</i>
                              </div>
                            </div>
                            <span style={{ color: "#6B7280", fontSize: 9 }}>{li.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ PROGRAM UNGGULAN ══════════════════════════════════ */}
        <section id="program" className="sp-section">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head">
                <span className="sp-eyebrow">Program Unggulan</span>
                <h2>Program Unggulan untuk <span className="sp-blue">Sekolah</span></h2>
                <p>Empat program andalan yang siap diaktifkan di sekolah Anda — dapat disesuaikan dengan kebutuhan, kurikulum, dan anggaran sekolah.</p>
              </div>
            </Reveal>

            <div className="sp-prog-grid">
              {[
                { p: "p1", ico: <IcoSchool />, title: "Talent Development Program", desc: "Program pengembangan talenta terstruktur sesuai kebutuhan sekolah, mulai dari asesmen hingga aksi konkret." },
                { p: "p2", ico: <IcoUsers />, title: "Kompetisi & Challenge", desc: "Tantangan seru untuk meningkatkan motivasi, kreativitas, dan prestasi siswa — solo & tim." },
                { p: "p3", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>, title: "Pelatihan Guru", desc: "Tingkatkan kompetensi guru melalui pelatihan digital dan program sertifikasi terstandar." },
                { p: "p4", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z"/></svg>, title: "Kolaborasi Sekolah", desc: "Bersinergi dengan sekolah lain dalam kegiatan positif dan program lintas-sekolah yang bermanfaat." },
              ].map((c) => (
                <Reveal key={c.p}>
                  <div className="sp-prog-card">
                    <div className={`sp-prog-ico ${c.p}`}>{c.ico}</div>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BENEFITS + TESTIMONIAL ════════════════════════════ */}
        <section className="sp-section sp-section-tint">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head">
                <span className="sp-eyebrow green">Benefits for School</span>
                <h2>Apa yang Anda <span className="sp-blue">Dapatkan?</span></h2>
                <p>Bergabungnya sekolah Anda dengan Talentika menghasilkan keuntungan yang nyata — bukan hanya untuk siswa, tapi juga citra sekolah di mata orang tua dan stakeholder.</p>
              </div>
            </Reveal>

            <div className="sp-benefits-grid">
              <Reveal>
                <div className="sp-benefit-list">
                  {[
                    { b: "b1", ico: <IcoSchool />, text: "Meningkatkan kualitas pendidikan berbasis data dan teknologi." },
                    { b: "b2", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 01-10 0V4z"/><path d="M5 4H3v3a3 3 0 003 3M19 4h2v3a3 3 0 01-3 3M9 14h6l-1 6h-4l-1-6z"/></svg>, text: "Membantu sekolah mencapai visi misi dan keunggulan kompetitif." },
                    { b: "b3", ico: <IcoUsers />, text: "Mendukung program pengembangan siswa secara holistik dan terstruktur." },
                    { b: "b4", ico: <IcoShield />, text: "Memperkuat kepercayaan orang tua dan stakeholder terhadap sekolah." },
                  ].map((r) => (
                    <div key={r.b} className="sp-benefit-row">
                      <span className="sp-br-check"><IcoCheck size={16} /></span>
                      <p>{r.text}</p>
                      <span className={`sp-br-ico ${r.b}`}>{r.ico}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal>
                <div className="sp-b-visual">
                  <div className="sp-b-photo">
                    <div style={{ textAlign: "center", color: "rgba(255,255,255,.5)" }}>
                      <IcoSchool />
                      <p style={{ fontFamily: "var(--sp-display)", fontWeight: 700, fontSize: 13, marginTop: 8 }}>Foto Sekolah</p>
                    </div>
                  </div>
                  <div className="sp-b-quote">
                    <div className="sp-qmark">"</div>
                    <blockquote>Talentika membantu kami mengembangkan potensi siswa secara menyeluruh, tidak hanya akademik tapi juga karakter dan keterampilan masa depan.</blockquote>
                    <cite>
                      <b>Drs. Bambang Surya, M.Pd</b>
                      Kepala Sekolah — SMA Cerdas Bangsa, Jakarta
                    </cite>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Mini benefits */}
            <Reveal>
              <div className="sp-mini-benefits">
                <div className="sp-mini-title">Keuntungan Utama <b>untuk Sekolah</b></div>
                {[
                  { m: "m1", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 11l3 3 8-8"/></svg>, title: "Data & Insight Akurat", desc: "Pengambilan keputusan berbasis data nyata." },
                  { m: "m2", ico: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>, title: "Program Terstruktur", desc: "Roadmap pengembangan yang jelas." },
                  { m: "m3", ico: <IcoTrend />, title: "Hasil Terukur & Berkelanjutan", desc: "Dampak nyata setiap semester." },
                  { m: "m4", ico: <IcoUsers />, title: "Mitra Terpercaya Jangka Panjang", desc: "Dukungan support tim & komunitas." },
                ].map((b) => (
                  <div key={b.m} className="sp-mini-item">
                    <div className={`sp-mini-ico ${b.m}`}>{b.ico}</div>
                    <div><h5>{b.title}</h5><p>{b.desc}</p></div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ════════════════════════════════════════════════ */}
        <section id="faq" className="sp-section">
          <div className="sp-section-inner">
            <Reveal>
              <div className="sp-head center">
                <span className="sp-eyebrow">FAQ</span>
                <h2>Pertanyaan yang Sering <span className="sp-blue">Diajukan</span></h2>
                <p>Belum menemukan jawaban? Tim kami siap membantu via WhatsApp dalam 1×24 jam.</p>
              </div>
            </Reveal>

            <div className="sp-faq-grid">
              {[
                { q: "Sekolah seperti apa yang cocok dengan Talentika?", a: "Talentika for School cocok untuk semua jenjang — SD, SMP, SMA, dan SMK negeri maupun swasta — yang ingin meningkatkan kualitas pengembangan siswa berbasis data dan teknologi." },
                { q: "Apakah ada biaya untuk sekolah?", a: "Kami menawarkan beberapa paket fleksibel — dari pilot gratis untuk uji coba, hingga paket institusi penuh. Hubungi tim kami untuk konsultasi paket yang paling sesuai dengan kebutuhan dan anggaran sekolah." },
                { q: "Berapa lama proses implementasi di sekolah?", a: "Proses implementasi rata-rata 2–4 minggu, mencakup onboarding admin, pelatihan guru, setup data siswa, dan briefing program. Tim Customer Success kami akan mendampingi sepanjang prosesnya." },
                { q: "Bagaimana keamanan data siswa?", a: "Seluruh data dienkripsi end-to-end dan disimpan di server lokal dengan standar ISO 27001. Talentika tunduk pada UU PDP Indonesia dan tidak pernah membagikan data ke pihak ketiga tanpa izin." },
                { q: "Bisakah disesuaikan dengan kurikulum sekolah?", a: "Tentu. Talentika mendukung Kurikulum Merdeka, Kurikulum 2013, IB, dan Cambridge. Konten dan asesmen dapat disesuaikan dengan visi-misi sekolah." },
                { q: "Apakah orang tua bisa mengakses progres anak?", a: "Ya, orang tua mendapat akses portal khusus untuk memantau perkembangan, pencapaian, dan rekomendasi pengembangan anak — transparan dan real-time." },
              ].map((f) => (
                <Reveal key={f.q}>
                  <FaqItem q={f.q} a={f.a} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ROCKET ════════════════════════════════════════ */}
        <div className="sp-cta-wrap">
          <Reveal>
            <div className="sp-cta-rocket">
              {/* Decorative sparkles */}
              <svg style={{ position: "absolute", top: 30, right: 200, color: "#FFC107", zIndex: 1 }} width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
              <svg style={{ position: "absolute", bottom: 40, right: 340, color: "#FFC107", zIndex: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>

              {/* Rocket */}
              <div style={{ position: "relative", zIndex: 1 }}>
                <svg width="160" height="180" viewBox="0 0 160 180" fill="none">
                  <ellipse cx="40" cy="160" rx="30" ry="9" fill="#fff" opacity=".25"/>
                  <ellipse cx="120" cy="170" rx="25" ry="7" fill="#fff" opacity=".2"/>
                  <g transform="translate(50,10)">
                    <path d="M30 0 C 18 14, 12 30, 12 60 V 110 H 48 V 60 C 48 30, 42 14, 30 0Z" fill="#3B82F6"/>
                    <path d="M30 0 C 24 14, 22 30, 22 60 V 110 H 30 V 0Z" fill="#1D4ED8"/>
                    <circle cx="30" cy="50" r="11" fill="#fff" stroke="#1E40AF" strokeWidth="2"/>
                    <circle cx="30" cy="50" r="7" fill="#60A5FA"/>
                    <circle cx="27" cy="47" r="2" fill="#fff" opacity=".8"/>
                    <path d="M12 80 L0 110 L12 110 Z" fill="#FF6A00"/>
                    <path d="M48 80 L60 110 L48 110 Z" fill="#FF6A00"/>
                    <path d="M18 110 Q 20 130 30 145 Q 40 130 42 110 Z" fill="#FFC107"/>
                    <path d="M22 110 Q 24 124 30 134 Q 36 124 38 110 Z" fill="#FF6A00"/>
                  </g>
                  <path d="M20 30l1.5 4 4 1.5-4 1.5L20 41l-1.5-4-4-1.5 4-1.5z" fill="#FFC107"/>
                  <circle cx="150" cy="20" r="2" fill="#FFC107"/>
                </svg>
              </div>

              <div className="sp-cta-copy">
                <h2>
                  Bersama Talentika,<br />
                  Wujudkan <span className="o">Sekolah Hebat</span> untuk{" "}
                  <span className="y">Generasi Hebat!</span>
                </h2>
                <p>Daftar sekolah Anda hari ini dan dapatkan demo gratis + konsultasi program selama 30 menit dengan tim Education Success Talentika.</p>
              </div>

              <div className="sp-cta-btns">
                <a href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20mendaftarkan%20sekolah%20kami" target="_blank" rel="noopener noreferrer" className="sp-btn-wa">
                  <IcoWa />
                  Hubungi Kami via WhatsApp
                  <IcoArrow />
                </a>
                <button className="sp-btn-demo-cta">
                  <IcoPlay /> Lihat Demo Dashboard
                </button>
                <div className="sp-cta-url">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>
                  www.talentika.id/school
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default TalentikaForSchools;
