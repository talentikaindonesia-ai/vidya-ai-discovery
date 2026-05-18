import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import "../landing.css";

const TentangKami = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal,.reveal-left,.reveal-right").forEach((el) =>
      io.observe(el)
    );
    return () => io.disconnect();
  }, []);

  return (
    <div className="au-root">
      <SEO
        title="Tentang Kami – Talentika | Platform Penemuan Potensi Diri"
        description="Kenali tim dan misi Talentika dalam membantu generasi muda Indonesia menemukan, mengembangkan, dan mewujudkan potensi penuh mereka."
        keywords="tentang talentika, misi talentika, tim talentika, platform bakat indonesia"
      />
      <Header />

      {/* ════════════════════════════════════
          1. HERO
      ════════════════════════════════════ */}
      <section className="au-hero">
        <div className="au-hero-bg" />
        {/* Decorative blobs */}
        <div className="au-blob au-blob-1" />
        <div className="au-blob au-blob-2" />
        {/* Sparkles */}
        <span className="au-sparkle au-sp-1">✦</span>
        <span className="au-sparkle au-sp-2">✦</span>
        <span className="au-sparkle au-sp-3">★</span>

        <div className="au-hero-inner">
          {/* Left copy */}
          <div className="au-hero-copy reveal-left">
            <div className="au-hashtag">#mulaidaritalentika</div>
            <h1 className="au-hero-h1">
              <span className="au-h1-white">Kami Hadir untuk</span>
              <span className="au-h1-yellow"> Menemukan &amp;</span>
              <span className="au-h1-green"> Menumbuhkan Potensi</span>
            </h1>
            <p className="au-hero-sub">
              Talentika adalah platform penemuan diri berbasis AI yang membantu pelajar dan
              mahasiswa Indonesia memahami kekuatan mereka dan melangkah percaya diri ke masa depan.
            </p>

            {/* DDG Badges */}
            <div className="au-ddg-badges">
              <span className="au-badge au-badge-discover">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" />
                </svg>
                Discover
              </span>
              <span className="au-badge au-badge-develop">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                Develop
              </span>
              <span className="au-badge au-badge-grow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22V12m0-10C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
                  <path d="M12 12c0-3.314 2.686-6 6-6" />
                </svg>
                Grow
              </span>
            </div>

            {/* CTA buttons */}
            <div className="au-hero-ctas">
              <button className="au-btn-primary" onClick={() => navigate("/auth")}>
                Mulai Gratis
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="au-btn-ghost" onClick={() => navigate("/auth")}>
                Pelajari Lebih Lanjut
              </button>
            </div>
          </div>

          {/* Right visual */}
          <div className="au-hero-visual reveal-right">
            <div className="au-hero-photo-wrap">
              <div
                className="au-hero-photo-slot"
                style={{
                  backgroundImage: "url('/hero-students.webp')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                }}
              />
              {/* Floating card bottom-left */}
              <div className="au-float-card au-float-left">
                <div className="au-float-icon">👥</div>
                <div>
                  <div className="au-float-num">50K+</div>
                  <div className="au-float-label">Pengguna Aktif</div>
                </div>
              </div>
              {/* Floating card top-right */}
              <div className="au-float-card au-float-topright">
                {[
                  "Tes Bakat RIASEC",
                  "Panduan Karir AI",
                  "Komunitas Pelajar",
                  "Program Beasiswa",
                ].map((item) => (
                  <div key={item} className="au-checklist-item">
                    <span className="au-check-icon">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          2. STORY STRIP
      ════════════════════════════════════ */}
      <section className="au-section story-strip">
        <div className="au-container">
          <div className="au-two-col">
            {/* Left */}
            <div className="reveal-left">
              <div className="au-eyebrow">Cerita Kami</div>
              <h2 className="au-section-h2">
                Setiap Potensi Punya Peluang.{" "}
                <span style={{ color: "var(--au-blue-600)" }}>Temukan di Talentika!</span>
              </h2>
              <p className="au-section-p">
                Kami lahir dari keprihatinan bahwa jutaan pelajar Indonesia belum mendapat panduan
                yang tepat untuk mengenali kekuatan mereka. Talentika hadir sebagai jembatan antara
                potensi dan peluang nyata.
              </p>
              <div className="au-q-grid">
                {[
                  { icon: "🎯", color: "blue", label: "Berbasis Ilmu", desc: "Psikometri RIASEC & MBTI tervalidasi" },
                  { icon: "🤖", color: "orange", label: "Teknologi AI", desc: "Rekomendasi personal berbasis data" },
                  { icon: "🌱", color: "green", label: "Tumbuh Bersama", desc: "Konten & program terus diperbarui" },
                  { icon: "🤝", color: "purple", label: "Inklusif", desc: "Gratis & aksesibel untuk semua pelajar" },
                ].map((q) => (
                  <div key={q.label} className={`au-q-item au-q-${q.color}`}>
                    <span className="au-q-icon">{q.icon}</span>
                    <div>
                      <div className="au-q-label">{q.label}</div>
                      <div className="au-q-desc">{q.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right – quote card */}
            <div className="reveal-right">
              <div className="au-quote-card">
                <div className="au-quote-mark">"</div>
                <blockquote className="au-blockquote">
                  Investasi terbaik adalah investasi pada diri sendiri. Talentika memastikan setiap
                  pelajar Indonesia tahu persis ke mana harus melangkah — dan berani memulainya.
                </blockquote>
                <cite className="au-cite">— Tim Talentika</cite>
                <div className="au-quote-stars">★★★★★</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          3. MISSION & VISION
      ════════════════════════════════════ */}
      <section className="au-section mv-section">
        <div className="au-container">

          {/* Section header — left-aligned */}
          <div className="reveal" style={{ marginBottom: 48 }}>
            <span style={{ display: "inline-block", border: "1.5px solid #1D4ED8", borderRadius: 999, padding: "4px 20px", color: "#1D4ED8", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
              Mission &amp; Vision
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, color: "#0B1D3A", marginBottom: 14, lineHeight: 1.2 }}>
              <span style={{ color: "#1D4ED8" }}>Mission</span> &amp; Vision
            </h2>
            <p style={{ color: "#6B7280", maxWidth: 540, lineHeight: 1.7, fontSize: 15, margin: 0 }}>
              Kami percaya setiap individu memiliki potensi luar biasa. Misi dan visi kami adalah menjadi
              katalis untuk membantu mereka bertumbuh, berkontribusi, dan menciptakan dampak positif bagi dunia.
            </p>
          </div>

          <div className="mv-grid">

            {/* ── MISSION card — dark navy ── */}
            <div className="reveal-left" style={{
              background: "linear-gradient(145deg, #0B1D3A 0%, #132447 60%, #1a2e5e 100%)",
              borderRadius: 24, padding: "44px 40px", position: "relative", overflow: "hidden", minHeight: 420,
            }}>
              {/* Decorative stars */}
              <span style={{ position: "absolute", top: 22, right: 30, color: "#FFC107", fontSize: 30, lineHeight: 1 }}>★</span>
              <span style={{ position: "absolute", top: "48%", right: "18%", color: "#FFC107", fontSize: 18, lineHeight: 1 }}>✦</span>

              {/* Icon + label */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: "rgba(255,255,255,.13)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: "#FF6A00", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>OUR</div>
                  <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>MISSION</div>
                </div>
              </div>

              {/* Body */}
              <p style={{ color: "rgba(255,255,255,.88)", fontSize: 15.5, lineHeight: 1.75, marginBottom: 40, fontWeight: 500 }}>
                Memberdayakan setiap individu untuk menemukan potensi,{" "}
                <span style={{ color: "#FF6A00", fontWeight: 700 }}>mengembangkan</span>{" "}
                keterampilan, dan{" "}
                <span style={{ color: "#34D399", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>meraih masa depan terbaik</span>{" "}
                melalui teknologi, konten berkualitas, dan komunitas yang suportif.
              </p>

              {/* 4 icon buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  {
                    bg: "#1D4ED8", label: "Temukan Potensimu",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
                  },
                  {
                    bg: "#FF6A00", label: "Kembangkan Dirimu",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></svg>,
                  },
                  {
                    bg: "#059669", label: "Raih Masa Depanmu",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>,
                  },
                  {
                    bg: "#7C3AED", label: "Beri Dampak Positif",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: item.bg, display: "grid", placeItems: "center" }}>
                      {item.icon}
                    </div>
                    <span style={{ color: "rgba(255,255,255,.75)", fontSize: 10.5, textAlign: "center", lineHeight: 1.35, fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── VISION card — white ── */}
            <div className="reveal-right" style={{
              background: "#fff", borderRadius: 24, padding: "44px 40px",
              border: "1.5px solid #E5E7EB", minHeight: 420, position: "relative",
            }}>
              {/* Icon + label */}
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28 }}>
                <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#EFF6FF", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: "#FF6A00", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>OUR</div>
                  <div style={{ color: "#0B1D3A", fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>VISION</div>
                </div>
              </div>

              {/* Body */}
              <p style={{ color: "#374151", fontSize: 15.5, lineHeight: 1.75, marginBottom: 40, fontWeight: 500 }}>
                Menjadi platform pengembangan diri{" "}
                <span style={{ color: "#1D4ED8", fontWeight: 700 }}>terdepan</span>{" "}
                di Indonesia dan Asia Tenggara yang{" "}
                <span style={{ color: "#FF6A00", fontWeight: 700 }}>menginspirasi generasi</span>{" "}
                untuk bertumbuh tanpa batas dan{" "}
                <span style={{ color: "#16A34A", fontWeight: 700 }}>menciptakan dunia yang lebih baik.</span>
              </p>

              {/* 4 icon buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  {
                    bg: "#1D4ED8", label: "Platform Terkemuka di Indonesia & Asia Tenggara",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                  },
                  {
                    bg: "#FF6A00", label: "Menginspirasi Generasi",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  },
                  {
                    bg: "#16A34A", label: "Bertumbuh Tanpa Batas",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                  },
                  {
                    bg: "#7C3AED", label: "Menciptakan Dunia yang Lebih Baik",
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: item.bg, display: "grid", placeItems: "center" }}>
                      {item.icon}
                    </div>
                    <span style={{ color: "#6B7280", fontSize: 10.5, textAlign: "center", lineHeight: 1.35, fontWeight: 600 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          4. NILAI UTAMA (CORE VALUES)
      ════════════════════════════════════ */}
      <section className="au-section nilai-section">
        <div className="au-container">
          <div className="au-center-head reveal">
            <div className="au-eyebrow">Fondasi Kami</div>
            <h2 className="au-section-h2">Nilai Utama</h2>
            <p className="au-section-sub">
              Lima prinsip yang memandu setiap keputusan dan inovasi di Talentika.
            </p>
          </div>
          <div className="nilai-grid">
            {[
              {
                color: "blue",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: "Integritas",
                desc: "Kami berkomitmen pada kejujuran dan transparansi dalam setiap langkah.",
              },
              {
                color: "orange",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "Inovasi",
                desc: "Kami terus mencari solusi baru untuk menjawab tantangan generasi muda.",
              },
              {
                color: "green",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
                title: "Kolaborasi",
                desc: "Bersama sekolah, mentor, dan komunitas untuk dampak yang lebih besar.",
              },
              {
                color: "purple",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: "Berorientasi Dampak",
                desc: "Setiap fitur dirancang untuk menghasilkan perubahan nyata dalam kehidupan.",
              },
              {
                color: "pink",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                ),
                title: "Empati",
                desc: "Kami mendengarkan, memahami, dan merancang dengan perspektif pengguna.",
              },
            ].map((val) => (
              <div key={val.title} className={`nilai-card nilai-card-${val.color} reveal`}>
                <div className={`nilai-icon-wrap nilai-icon-${val.color}`}>{val.icon}</div>
                <h3 className="nilai-title">{val.title}</h3>
                <p className="nilai-desc">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          5. IMPACT STATS
      ════════════════════════════════════ */}
      <section className="au-section impact-section">
        <div className="au-container">
          <div className="au-center-head au-center-head-light reveal">
            <div className="au-eyebrow au-eyebrow-light">Dampak Nyata</div>
            <h2 className="au-section-h2 au-h2-white">Angka yang Bicara</h2>
            <p className="au-section-sub au-sub-light">
              Ribuan pelajar telah membuktikan manfaat Talentika dalam perjalanan mereka.
            </p>
          </div>
          <div className="impact-grid">
            {[
              { num: "50K+", label: "Pengguna Aktif", icon: "👥", color: "blue" },
              { num: "1.000+", label: "Materi Pembelajaran", icon: "📚", color: "orange" },
              { num: "200+", label: "Program Pengembangan", icon: "🏆", color: "green" },
              { num: "500+", label: "Sekolah Mitra", icon: "🏫", color: "purple" },
              { num: "4.9★", label: "Rating Pengguna", icon: "⭐", color: "yellow" },
              { num: "34+", label: "Provinsi Terjangkau", icon: "🗺️", color: "pink" },
            ].map((stat) => (
              <div key={stat.label} className={`impact-card impact-card-${stat.color} reveal`}>
                <div className="impact-emoji">{stat.icon}</div>
                <div className="impact-num">{stat.num}</div>
                <div className="impact-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          6. BRAND PILLARS
      ════════════════════════════════════ */}
      <section className="au-section pillars-section">
        <div className="au-container">
          <div className="au-center-head reveal">
            <div className="au-eyebrow">Framework Kami</div>
            <h2 className="au-section-h2">Tiga Pilar Talentika</h2>
            <p className="au-section-sub">
              Setiap langkah dalam perjalanan penggunamu didukung oleh tiga pilar utama.
            </p>
          </div>
          <div className="pillars-grid">
            {/* Discover */}
            <div className="pillar-card pillar-blue reveal">
              <div className="pillar-num">01</div>
              <h3 className="pillar-title">Discover</h3>
              <span className="pillar-tag">Kenali Dirimu</span>
              <p className="pillar-desc">
                Gunakan tes psikometri tervalidasi untuk memahami kepribadian, minat, dan bakat
                unikmu secara mendalam.
              </p>
              <ul className="pillar-list">
                {["RIASEC Holland Test", "MBTI Personality", "Tes Kecerdasan Majemuk", "Profil Karir Otomatis"].map((i) => (
                  <li key={i}>
                    <span className="pillar-check">✓</span> {i}
                  </li>
                ))}
              </ul>
              {/* Decorative SVG */}
              <svg className="pillar-deco" viewBox="0 0 100 100" fill="none">
                <circle cx="80" cy="20" r="40" stroke="currentColor" strokeWidth="1.5" opacity=".15" />
                <circle cx="80" cy="20" r="25" stroke="currentColor" strokeWidth="1.5" opacity=".1" />
              </svg>
            </div>
            {/* Develop */}
            <div className="pillar-card pillar-orange reveal">
              <div className="pillar-num">02</div>
              <h3 className="pillar-title">Develop</h3>
              <span className="pillar-tag">Kembangkan Potensi</span>
              <p className="pillar-desc">
                Akses kurikulum personal, mentor berpengalaman, dan konten belajar yang disesuaikan
                dengan profil unikmu.
              </p>
              <ul className="pillar-list">
                {["Learning Path Adaptif", "Mentoring 1-on-1", "Workshop & Webinar", "Sertifikasi Kompetensi"].map((i) => (
                  <li key={i}>
                    <span className="pillar-check">✓</span> {i}
                  </li>
                ))}
              </ul>
              <svg className="pillar-deco" viewBox="0 0 100 100" fill="none">
                <polygon points="80,5 95,35 65,35" stroke="currentColor" strokeWidth="1.5" opacity=".15" />
                <polygon points="80,20 90,42 70,42" stroke="currentColor" strokeWidth="1.5" opacity=".1" />
              </svg>
            </div>
            {/* Grow */}
            <div className="pillar-card pillar-green reveal">
              <div className="pillar-num">03</div>
              <h3 className="pillar-title">Grow</h3>
              <span className="pillar-tag">Raih Peluang</span>
              <p className="pillar-desc">
                Hubungkan potensimu dengan peluang nyata — beasiswa, magang, kompetisi, dan jaringan
                profesional.
              </p>
              <ul className="pillar-list">
                {["Papan Peluang Live", "Portfolio Builder", "Koneksi Alumni", "Rekomendasi AI Karir"].map((i) => (
                  <li key={i}>
                    <span className="pillar-check">✓</span> {i}
                  </li>
                ))}
              </ul>
              <svg className="pillar-deco" viewBox="0 0 100 100" fill="none">
                <path d="M20 80 Q50 10 80 80" stroke="currentColor" strokeWidth="1.5" opacity=".15" />
                <path d="M30 80 Q50 25 70 80" stroke="currentColor" strokeWidth="1.5" opacity=".1" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          7. TEAM — hidden
      ════════════════════════════════════ */}
      <section className="au-section team-section" style={{ display: "none" }}>
        <div className="au-container">
          <div className="au-center-head reveal">
            <div className="au-eyebrow">Tim Kami</div>
            <h2 className="au-section-h2">Orang-Orang di Balik Talentika</h2>
            <p className="au-section-sub">
              Dipimpin oleh para profesional yang berdedikasi pada pendidikan dan teknologi.
            </p>
          </div>
          <div className="team-grid">
            {[
              { initials: "AR", name: "Ahmad Rizki", role: "CEO & Co-Founder", grad: "blue", desc: "Berpengalaman 10+ tahun di EdTech & startup Indonesia." },
              { initials: "SD", name: "Sari Dewi, M.Psi", role: "CPO – Psikologi", grad: "purple", desc: "Psikolog klinis & spesialis psikometri karir remaja." },
              { initials: "RP", name: "Rafi Pratama", role: "CTO – Teknologi", grad: "green", desc: "Engineer senior dengan keahlian AI & platform scalable." },
              { initials: "DK", name: "Dina Kusuma", role: "CMO – Pemasaran", grad: "orange", desc: "Growth marketer yang membangun komunitas 50K+ pengguna." },
            ].map((member) => (
              <div key={member.name} className="team-card reveal">
                <div className={`team-avatar team-avatar-${member.grad}`}>{member.initials}</div>
                <h3 className="team-name">{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p className="team-desc">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          8. TIMELINE — hidden
      ════════════════════════════════════ */}
      <section className="au-section journey-section" style={{ display: "none" }}>
        <div className="au-container">
          <div className="au-center-head reveal">
            <div className="au-eyebrow">Perjalanan Kami</div>
            <h2 className="au-section-h2">Dari Mimpi ke Realita</h2>
          </div>
          <div className="timeline">
            {[
              { year: "2022", title: "Talentika Lahir", desc: "Ide bermula dari keprihatinan akan minimnya panduan karir untuk pelajar Indonesia.", side: "left" },
              { year: "2023", title: "Pilot 50 Sekolah", desc: "Program percontohan di 50 sekolah menengah, melibatkan 2.000+ siswa pertama.", side: "right" },
              { year: "2024", title: "Ekspansi Nasional", desc: "Platform diluncurkan secara nasional, menjangkau 34 provinsi di seluruh Indonesia.", side: "left" },
              { year: "2025", title: "50K Pengguna", desc: "Mencapai milestone 50.000 pengguna aktif dengan rating 4.9★ di app store.", side: "right" },
              { year: "2026", title: "Asia Tenggara", desc: "Ekspansi ke Malaysia, Filipina, dan Vietnam dengan versi multibahasa.", side: "left" },
              { year: "2027+", title: "Visi 1 Juta", desc: "Target satu juta pengguna aktif dan menjadi platform referensi regional.", side: "right" },
            ].map((item, idx) => (
              <div key={idx} className={`tl-item tl-${item.side} reveal`}>
                <div className="tl-dot" />
                <div className="tl-card">
                  <div className="tl-year">{item.year}</div>
                  <h3 className="tl-title">{item.title}</h3>
                  <p className="tl-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          9. CAMPAIGN CTA
      ════════════════════════════════════ */}
      <section className="campaign-section">
        <div className="campaign-watermark">#mulaidaritalentika</div>
        <div className="au-container campaign-inner">
          <h2 className="campaign-h2 reveal">Mulai Perjalananmu Sekarang!</h2>
          <p className="campaign-sub reveal">
            Bergabung dengan 50.000+ pelajar yang sudah menemukan potensi terbaik mereka bersama
            Talentika.
          </p>
          <div className="campaign-ctas reveal">
            <button className="au-btn-primary au-btn-lg" onClick={() => navigate("/auth")}>
              Daftar Gratis — Mulai Sekarang
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="au-btn-outline-white" onClick={() => navigate("/for-schools")}>
              Untuk Sekolah →
            </button>
          </div>
          <div className="campaign-trust reveal">
            {["✓ Gratis Selamanya", "✓ Tanpa Kartu Kredit", "✓ 50K+ Pengguna Puas"].map((t) => (
              <span key={t} className="campaign-trust-item">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          10. SOCIAL STRIP
      ════════════════════════════════════ */}
      <footer className="social-strip">
        <div className="au-container social-inner">
          {/* Brand */}
          <div className="social-brand">
            <img src="/logo.png" alt="Talentika" className="social-brand-mark" />
            <span className="social-brand-name">Talentika</span>
          </div>
          {/* URL */}
          <a href="https://www.talentika.id" className="social-url" target="_blank" rel="noreferrer">
            www.talentika.id
          </a>
          {/* Hashtag */}
          <span className="social-hashtag">#mulaidaritalentika</span>
          {/* Icons */}
          <div className="social-icons">
            {/* Instagram */}
            <a href="https://instagram.com/talentika.id" className="social-icon-link" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com/company/talentika" className="social-icon-link" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            {/* YouTube */}
            <a href="https://youtube.com/@talentika.id" className="social-icon-link" target="_blank" rel="noreferrer" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
              </svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com/@talentika.id" className="social-icon-link" target="_blank" rel="noreferrer" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.9a8.19 8.19 0 004.79 1.52V7c-.01 0-1.02-.07-1.02-.31z" />
              </svg>
            </a>
            <span className="social-handle">@talentika.id</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TentangKami;
