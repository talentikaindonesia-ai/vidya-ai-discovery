import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import WelcomePopup from "@/components/WelcomePopup";
import WhatsAppButton from "@/components/WhatsAppButton";
import { supabase } from "@/integrations/supabase/client";
import "../landing.css";

/* ─── Star SVG (reused) ─── */
const StarSVG = ({ size = 14, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" />
  </svg>
);

const CheckSVG = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

/* ─── Nav ─── */
const Nav = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Beranda", href: "#beranda" },
    { label: "Fitur", href: "#fitur" },
    { label: "Cara Kerja", href: "#cara-kerja" },
    { label: "Harga", href: "#harga" },
    { label: "Testimoni", href: "#testimoni" },
    { label: "Artikel", href: "/articles" },
    { label: "Talentika Junior", href: "/talentika-junior", junior: true },
  ];

  const handleNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <nav className="lp-nav" style={{ boxShadow: scrolled ? "0 2px 20px -4px rgba(11,29,58,.08)" : "none" }}>
      <div className="lp-nav-inner">
        {/* Brand */}
        <a className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="lp-brand-mark">
            <StarSVG size={22} />
            <span className="lp-star">✦</span>
          </div>
          <div className="lp-brand-name">
            <b>Talentika</b>
            <small>Discover your full potential</small>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="lp-nav-links">
          {navItems.map((item) => (
            <a
              key={item.label}
              className={`lp-nav-link${item.junior ? " junior" : ""}`}
              href={item.href}
              onClick={(e) => handleNav(e, item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="lp-nav-cta">
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate("/auth")}>Masuk</button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate("/auth")}>Daftar Gratis</button>
        </div>

        {/* Hamburger */}
        <button
          className="lp-hamburger"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`lp-mobile-menu${menuOpen ? " open" : ""}`}>
        {navItems.map((item) => (
          <a
            key={item.label}
            className={`lp-nav-link${item.junior ? " junior" : ""}`}
            href={item.href}
            onClick={(e) => handleNav(e, item.href)}
          >
            {item.label}
          </a>
        ))}
        <div className="lp-nav-cta" style={{ marginTop: 12 }}>
          <button className="lp-btn lp-btn-ghost lp-btn-block" onClick={() => { setMenuOpen(false); navigate("/auth"); }}>Masuk</button>
          <button className="lp-btn lp-btn-primary lp-btn-block" onClick={() => { setMenuOpen(false); navigate("/auth"); }}>Daftar Gratis</button>
        </div>
      </div>
    </nav>
  );
};

/* ─── Hero ─── */
const Hero = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <section id="beranda" className="lp-hero">
    <div className="lp-blob lp-blob-blue" />
    <div className="lp-blob lp-blob-yellow" />
    <div className="lp-blob lp-blob-orange" />

    <div className="lp-hero-grid">
      {/* Copy */}
      <div>
        <span className="lp-hero-eyebrow">
          <StarSVG size={14} style={{ color: "var(--lp-orange)" }} />
          #MULAIDARI TALENTIKA
        </span>
        <h1 className="lp-headline">
          <span className="word-ink">Temukan</span><br />
          <span className="word-blue">Potensimu,</span> <span className="word-ink">Raih</span><br />
          <span className="word-orange">Masa Depanmu!</span>
        </h1>
        <p className="lp-lede">
          Platform untuk membantumu mengenal diri, mengembangkan skill, dan menemukan peluang terbaik —
          dari talent test, kursus, hingga komunitas inspiratif.
        </p>
        <div className="lp-hero-cta">
          <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate("/auth")}>
            Mulai Talent Test Gratis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="lp-btn lp-btn-secondary lp-btn-lg"
            onClick={() => document.querySelector("#cara-kerja")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="lp-play-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            Lihat Cara Kerjanya
          </button>
        </div>
      </div>

      {/* Visual */}
      <div className="lp-hero-visual">
        <svg className="lp-sp s1" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" /></svg>
        <svg className="lp-sp s2" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" /></svg>
        <svg className="lp-sp s3" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" /></svg>
        <svg className="lp-sp s4" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" /></svg>

        <div className="lp-paper-plane">
          <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
            <path d="M58 6L4 30l20 4 4 20L58 6z" fill="#FFC107" />
            <path d="M24 34l34-28-30 32" stroke="#A47000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M28 54l-4-20-20-4" stroke="#A47000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3" />
          </svg>
        </div>

        {/* Hero Photo Placeholder */}
        <div className="lp-hero-photo">
          <div className="lp-hero-photo-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7FA8FF" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <p>Hero Image</p>
          </div>
        </div>

        {/* Floating Info Card */}
        <div className="lp-hero-floater">
          <h4>Kenali dirimu lebih dalam<br />bersama <span>Talentika</span></h4>
          <ul>
            {["AI-Powered Insight", "Personalized Roadmap", "Komunitas Positif", "Peluang Tanpa Batas"].map((item) => (
              <li key={item}>
                <span className="lp-check">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Stat Strip */}
    <div className="lp-stat-strip">
      <div className="lp-stat-strip-inner reveal">
        {/* Value Pillars Row */}
        <div className="lp-pillars-row">
          {/* DISCOVER */}
          <div className="lp-value-pillar lp-vp-discover">
            <div className="lp-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M16 8l-3 7-5 1 3-7z" fill="#fff" />
              </svg>
            </div>
            <div>
              <h5>Discover</h5>
              <p>Kenali minat, bakat, kepribadianmu melalui talent test akurat.</p>
            </div>
          </div>
          {/* DEVELOP */}
          <div className="lp-value-pillar lp-vp-develop">
            <div className="lp-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />
              </svg>
            </div>
            <div>
              <h5>Develop</h5>
              <p>Tingkatkan skill dengan rekomendasi belajar yang sesuai untukmu.</p>
            </div>
          </div>
          {/* GROW */}
          <div className="lp-value-pillar lp-vp-grow">
            <div className="lp-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" />
              </svg>
            </div>
            <div>
              <h5>Grow</h5>
              <p>Terhubung dengan komunitas, mentor, dan berbagai peluang untuk masa depanmu.</p>
            </div>
          </div>
          {/* OPPORTUNITIES */}
          <div className="lp-value-pillar lp-vp-opp">
            <div className="lp-ico">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
              </svg>
            </div>
            <div>
              <h5>Opportunities</h5>
              <p>Temukan beasiswa, kompetisi, magang, dan lowongan kerja terbaik untukmu.</p>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="lp-metrics-row">
        <div className="lp-metric lp-metric-users">
          <div className="lp-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" />
            </svg>
          </div>
          <div className="lp-num">100K+</div>
          <div className="lp-lbl">Pengguna Aktif</div>
        </div>
        <div className="lp-metric lp-metric-schools">
          <div className="lp-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" />
            </svg>
          </div>
          <div className="lp-num">500+</div>
          <div className="lp-lbl">Sekolah & Universitas</div>
        </div>
        <div className="lp-metric lp-metric-partners">
          <div className="lp-ico">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 11l5 5 4-4M9 7l3-3 3 3" /><path d="M3 12c0 5 4 9 9 9s9-4 9-9-4-9-9-9" />
            </svg>
          </div>
          <div className="lp-num">200+</div>
          <div className="lp-lbl">Partner Terpercaya</div>
        </div>
        </div>{/* /lp-metrics-row */}
      </div>
    </div>

    {/* Partners Row */}
    <div className="lp-partners reveal">
      <p className="lp-partners-lbl">Dipercaya oleh sekolah, universitas, dan partner terbaik</p>
      <div className="lp-partner-logos">
        {/* Kampus Merdeka */}
        <svg className="lp-partner-logo" viewBox="0 0 180 50" width="140" height="46">
          <text x="6" y="22" fontFamily="Poppins" fontWeight="800" fontSize="18" fill="#FF6A00">Kampus</text>
          <text x="6" y="40" fontFamily="Poppins" fontWeight="800" fontSize="18" fill="#1D4ED8">Merdeka</text>
          <text x="108" y="32" fontFamily="Poppins" fontWeight="600" fontSize="9" fill="#FF6A00">INDONESIA JAYA</text>
        </svg>
        {/* BINUS */}
        <svg className="lp-partner-logo" viewBox="0 0 130 50" width="120" height="42">
          <circle cx="18" cy="25" r="13" fill="#FFC107" stroke="#1D4ED8" strokeWidth="2" />
          <circle cx="18" cy="25" r="5" fill="#1D4ED8" />
          <text x="40" y="24" fontFamily="Poppins" fontWeight="800" fontSize="17" fill="#1D4ED8">BINUS</text>
          <text x="40" y="40" fontFamily="Poppins" fontWeight="500" fontSize="9" fill="#94A3B8">UNIVERSITY</text>
        </svg>
        {/* Universitas Indonesia */}
        <svg className="lp-partner-logo" viewBox="0 0 200 50" width="170" height="42">
          <g transform="translate(6,4)">
            <path d="M16 0 L24 12 L20 12 L24 22 L20 22 L24 32 L8 32 L12 22 L8 22 L12 12 L8 12z" fill="#FFC107" />
          </g>
          <text x="40" y="22" fontFamily="Poppins" fontWeight="700" fontSize="14" fill="#1D4ED8">UNIVERSITAS</text>
          <text x="40" y="38" fontFamily="Poppins" fontWeight="700" fontSize="14" fill="#1D4ED8">INDONESIA</text>
        </svg>
        {/* Telkom */}
        <svg className="lp-partner-logo" viewBox="0 0 160 50" width="140" height="40">
          <circle cx="20" cy="25" r="14" fill="none" stroke="#DC2626" strokeWidth="3" />
          <path d="M20 12 v26 M7 25 h26" stroke="#DC2626" strokeWidth="3" />
          <circle cx="20" cy="25" r="4" fill="#DC2626" />
          <text x="44" y="23" fontFamily="Poppins" fontWeight="800" fontSize="16" fill="#1D4ED8">Telkom</text>
          <text x="44" y="38" fontFamily="Poppins" fontWeight="600" fontSize="10" fill="#1D4ED8">University</text>
        </svg>
        {/* ACE Class */}
        <svg className="lp-partner-logo" viewBox="0 0 130 50" width="110" height="42">
          <rect x="2" y="6" width="38" height="38" rx="5" fill="#DC2626" />
          <text x="11" y="36" fontFamily="Poppins" fontWeight="800" fontSize="24" fill="#fff">A+</text>
          <text x="48" y="32" fontFamily="Poppins" fontWeight="800" fontSize="18" fill="#1F2937">CLASS</text>
        </svg>
      </div>
      <button className="lp-see-all" onClick={() => navigate("/auth")}>
        Lihat semua partner
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </section>
);

/* ─── Feature card data ─── */
const FEATURES = [
  {
    num: "01", color: "blue", title: "Tes Minat & Bakat",
    desc: "Tes psikometri berbasis Holland, MBTI, dan Multiple Intelligences dengan UI yang interaktif dan gamified.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#E8F1FF" />
        <g transform="translate(70,55)">
          <path d="M30 10 C12 10, 4 26, 14 42 C4 58, 18 78, 36 70 C40 80, 60 80, 60 66 L60 14 C60 4, 42 0, 30 10z" fill="#5B5BE0" />
          <path d="M70 10 C88 10, 96 26, 86 42 C96 58, 82 78, 64 70 L64 14 C64 4, 78 0, 70 10z" fill="#3A3AC5" />
          <path d="M22 32 C30 30, 36 36, 36 44 M22 50 C30 48, 36 54, 36 62 M76 32 C68 30, 62 36, 62 44 M76 50 C68 48, 62 54, 62 62" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <ellipse cx="30" cy="22" rx="6" ry="3" fill="#9CA8FF" opacity=".5" />
        </g>
        <circle cx="60" cy="78" r="14" fill="#10B981" />
        <path d="M53 78l5 5 9-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="170" cy="120" r="14" fill="#10B981" />
        <path d="M163 120l5 5 9-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M58 38l1.5 4 4 1.5-4 1.5L58 49l-1.5-4-4-1.5 4-1.5z" fill="#FFC107" />
      </svg>
    ),
  },
  {
    num: "02", color: "yellow", title: "Eksplorasi Bidang",
    desc: "Jelajahi berbagai bidang studi dan profesi yang sesuai dengan hasil tes minat dan bakatmu.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#FFF6E0" />
        <path d="M50 150 Q 100 50, 175 50" stroke="#FFC107" strokeWidth="2" fill="none" strokeDasharray="3 4" strokeLinecap="round" />
        <g transform="translate(85,80)">
          <circle cx="35" cy="35" r="34" fill="#FFD23F" stroke="#A47000" strokeWidth="2" />
          <circle cx="35" cy="35" r="26" fill="#FFF8E1" />
          <path d="M35 16 L40 35 L35 54 L30 35 z" fill="#1D4ED8" />
          <path d="M35 16 L40 35 L35 35 z" fill="#3B82F6" />
          <circle cx="35" cy="35" r="3" fill="#1E40AF" />
          <text x="33" y="13" fontFamily="Poppins" fontWeight="700" fontSize="7" fill="#A47000">N</text>
        </g>
        <path d="M40 70l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FFC107" />
      </svg>
    ),
  },
  {
    num: "03", color: "pink", title: "Rekomendasi Personal",
    desc: "Dapatkan rekomendasi kursus, workshop, dan proyek yang disesuaikan dengan minat dan bakatmu.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#FCE7F3" />
        <g transform="translate(95,55)">
          <circle cx="40" cy="40" r="40" fill="#FECDD3" />
          <circle cx="40" cy="40" r="30" fill="#FB7185" />
          <circle cx="40" cy="40" r="20" fill="#fff" />
          <circle cx="40" cy="40" r="12" fill="#FB7185" />
          <circle cx="40" cy="40" r="5" fill="#fff" />
        </g>
        <path d="M170 60l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FB7185" />
      </svg>
    ),
  },
  {
    num: "04", color: "purple", title: "Komunitas Belajar",
    desc: "Bergabung dengan komunitas pelajar dan mahasiswa untuk berbagi pengalaman dan tips belajar.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#E8F1FF" />
        <g transform="translate(70,40)">
          <path d="M0 16 C0 7 7 0 16 0 H50 C59 0 66 7 66 16 V32 C66 41 59 48 50 48 H22 L10 60 V48 H16 C7 48 0 41 0 32 z" fill="#3B82F6" />
          <circle cx="22" cy="24" r="3" fill="#fff" />
          <circle cx="33" cy="24" r="3" fill="#fff" />
          <circle cx="44" cy="24" r="3" fill="#fff" />
        </g>
        <g transform="translate(58,108)">
          <circle cx="24" cy="20" r="14" fill="#1D4ED8" />
          <path d="M0 60c0-13 11-24 24-24s24 11 24 24v8H0z" fill="#1D4ED8" />
          <circle cx="54" cy="22" r="12" fill="#3B82F6" />
          <path d="M30 64c0-11 11-20 24-20s24 9 24 20v6H30z" fill="#3B82F6" />
        </g>
        <circle cx="170" cy="48" r="6" fill="#FFC107" />
      </svg>
    ),
  },
  {
    num: "05", color: "green", title: "Progress Tracking",
    desc: "Pantau perkembangan skill dan capai milestone pribadi dengan sistem tracking yang motivasi.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#D1FAE5" />
        <g transform="translate(80,80)">
          <rect x="0" y="50" width="14" height="30" rx="3" fill="#34D399" />
          <rect x="20" y="35" width="14" height="45" rx="3" fill="#10B981" />
          <rect x="40" y="20" width="14" height="60" rx="3" fill="#3B82F6" />
          <rect x="60" y="8" width="14" height="72" rx="3" fill="#7C3AED" />
          <line x1="-4" y1="82" x2="84" y2="82" stroke="#94A3B8" strokeWidth="1.5" />
          <polyline points="0,55 14,40 28,35 42,28 56,18 74,8" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
        <path d="M40 50l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#10B981" />
      </svg>
    ),
  },
  {
    num: "06", color: "orange", title: "Gamifikasi Belajar",
    desc: "Sistem poin, badge, dan tantangan mingguan yang membuat proses eksplorasi jadi lebih seru.",
    illus: (
      <svg className="lp-feature-illus" viewBox="0 0 200 200" fill="none">
        <ellipse cx="120" cy="110" rx="80" ry="62" fill="#F0E8FF" />
        <g transform="translate(80,55)">
          <path d="M20 0 H50 V20 C50 32, 42 40, 35 40 C28 40, 20 32, 20 20 z" fill="#FFC107" stroke="#A47000" strokeWidth="2" />
          <path d="M22 4 H48 V18 C48 28, 42 36, 35 36 C28 36, 22 28, 22 18 z" fill="#FFD23F" />
          <path d="M20 4 H10 V14 C10 22, 16 28, 20 28" stroke="#A47000" strokeWidth="2.5" fill="none" />
          <path d="M50 4 H60 V14 C60 22, 54 28, 50 28" stroke="#A47000" strokeWidth="2.5" fill="none" />
          <path d="M35 16 L37 22 L43 22.5 L38.5 26.5 L40 32 L35 29 L30 32 L31.5 26.5 L27 22.5 L33 22z" fill="#fff" />
          <rect x="29" y="40" width="12" height="10" fill="#A47000" />
          <rect x="22" y="50" width="26" height="6" rx="2" fill="#A47000" />
        </g>
        <g transform="translate(126,128)">
          <path d="M0 16 C0 8 8 0 18 0 H38 C48 0 56 8 56 16 V24 C56 30 50 36 44 32 L36 26 H20 L12 32 C6 36 0 30 0 24z" fill="#7C3AED" />
          <circle cx="14" cy="18" r="3" fill="#fff" />
          <circle cx="42" cy="14" r="3" fill="#FFC107" />
          <circle cx="42" cy="22" r="3" fill="#34D399" />
          <rect x="20" y="17" width="6" height="2" fill="#fff" />
          <rect x="22" y="15" width="2" height="6" fill="#fff" />
        </g>
        <path d="M158 50l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#FFC107" />
      </svg>
    ),
  },
];

/* ─── Fitur Section ─── */
const Fitur = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <section id="fitur" className="lp-section lp-section-tint">
    <div className="lp-section-inner">
      <div className="lp-section-head reveal">
        <span className="lp-eyebrow">
          <StarSVG size={14} />
          Semua yang kamu butuhkan, ada di Talentika
        </span>
        <h2>Fitur Unggulan <span className="accent">Talentika</span></h2>
        <p>Temukan dan kembangkan potensimu dengan fitur-fitur canggih yang dibuat khusus untuk perjalanan eksplorasi minat dan bakatmu.</p>
      </div>

      <div className="lp-features-grid">
        {FEATURES.map((f) => (
          <div key={f.num} className={`lp-feature-card lp-fc-${f.color} reveal`}>
            <span className="lp-feat-num">{f.num}</span>
            <h3>{f.title}</h3>
            <div className="lp-accent-bar" />
            <p>{f.desc}</p>
            {f.illus}
          </div>
        ))}
      </div>

      {/* Trust Strip */}
      <div className="lp-feature-trust reveal">
        <div className="lp-ft-lead">
          <div className="lp-badge">
            <StarSVG size={26} />
          </div>
          <p>Dirancang untuk membantumu<br /><span>menemukan versi terbaik dirimu.</span></p>
        </div>
        {[
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" />
              </svg>
            ),
            title: "Aman & Terpercaya", desc: "Data pribadimu aman bersama kami.",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            ),
            title: "Privasi Terjamin", desc: "Kami tidak akan membagikan datamu ke pihak manapun.",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" />
              </svg>
            ),
            title: "Dibuat untukmu", desc: "Fitur yang relevan, personal, dan mudah digunakan.",
          },
        ].map((item) => (
          <div key={item.title} className="lp-ft-item">
            <div className="lp-ico">{item.icon}</div>
            <div>
              <h5>{item.title}</h5>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Cara Kerja ─── */
const CaraKerja = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const steps = [
    { num: "01", cls: "", title: "Daftar & Setup Profil", desc: "Buat akun dan lengkapi informasi dasar seperti umur, pendidikan, dan minat awal.", meta: { bg: "var(--lp-blue-50)", color: "var(--lp-blue-700)", label: "Hanya 2 menit" } },
    { num: "02", cls: "lp-s2", title: "Ikuti Tes Minat & Bakat", desc: "Selesaikan tes psikometri yang fun dan interaktif untuk mengidentifikasi potensimu.", meta: { bg: "var(--lp-orange-soft)", color: "var(--lp-orange)", label: "5 menit" } },
    { num: "03", cls: "lp-s3", title: "Dapatkan Hasil Personal", desc: "Terima peta minat & bakat visual yang detail plus rekomendasi bidang yang cocok.", meta: { bg: "var(--lp-yellow-soft)", color: "#A47000", label: "Hasil Instan" } },
    { num: "04", cls: "lp-s4", title: "Mulai Berkembang", desc: "Akses kursus, komunitas, dan peluang yang dipersonalisasi sesuai potensimu.", meta: { bg: "var(--lp-lilac)", color: "#6D28D9", label: "Setiap hari" } },
  ];

  return (
    <section id="cara-kerja" className="lp-section">
      <div className="lp-section-inner">
        <div className="lp-section-head reveal">
          <span className="lp-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Hanya butuh 5 menit untuk memulai
          </span>
          <h2>Bagaimana Cara <span className="accent">Kerjanya?</span></h2>
          <p>Proses eksplorasi minat dan bakat yang mudah, cepat, dan menyenangkan dalam 4 langkah sederhana.</p>
        </div>

        <div className="lp-steps">
          {steps.map((s) => (
            <div key={s.num} className={`lp-step ${s.cls} reveal`}>
              <div className="lp-step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <span className="lp-step-meta" style={{ background: s.meta.bg, color: s.meta.color }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                </svg>
                {s.meta.label}
              </span>
            </div>
          ))}
        </div>

        <div className="lp-steps-cta">
          <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate("/auth")}>
            Mulai Sekarang
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button className="lp-btn lp-btn-yellow lp-btn-lg" onClick={() => document.querySelector("#fitur")?.scrollIntoView({ behavior: "smooth" })}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 8v8l6-4z" />
            </svg>
            Tonton Demo
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── Testimoni ─── */
const Testimoni = () => {
  const testimonials = [
    {
      quote: "Awalnya bingung mau ambil jurusan apa. Setelah talent test Talentika, aku tahu aku punya kecenderungan ke design. Sekarang aku lagi belajar UI/UX dan udah dapat magang!",
      name: "Aisyah Rahmadani", role: "SMA Kelas 12, Bandung",
      av: "A", avGrad: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
    },
    {
      quote: "Komunitas Talentika sangat suportif. Aku jadi punya teman-teman yang punya passion serupa di bidang AI. Setiap minggu kita sharing project. Bener-bener seru!",
      name: "Reza Pratama", role: "Mahasiswa Telkom University",
      av: "R", avGrad: "linear-gradient(135deg,#FF8A33,#FF6A00)",
    },
    {
      quote: "Sebagai guru BK, Talentika sangat membantu aku memberikan arahan ke siswa-siswa. Hasil tes-nya komprehensif dan rekomendasinya konkret. Sekolah kami pakai resminya sekarang!",
      name: "Sari Wijayanti, S.Pd", role: "Guru BK, SMA Negeri 1 Surabaya",
      av: "S", avGrad: "linear-gradient(135deg,#FFD23F,#FFC107)", avColor: "var(--lp-ink)",
    },
  ];

  return (
    <section id="testimoni" className="lp-section lp-section-tint">
      <div className="lp-section-inner">
        <div className="lp-section-head reveal">
          <span className="lp-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" />
            </svg>
            Cerita dari pengguna Talentika
          </span>
          <h2>Kata Mereka tentang <span className="accent">Talentika</span></h2>
          <p>Ribuan pelajar dan mahasiswa Indonesia sudah menemukan arah mereka. Berikut beberapa cerita inspiratif dari mereka.</p>
        </div>

        <div className="lp-testimonial-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="lp-testimonial reveal">
              <span className="lp-quote-mark">"</span>
              <div className="lp-stars">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
                  </svg>
                ))}
              </div>
              <blockquote>{t.quote}</blockquote>
              <div className="lp-tperson">
                <div className="lp-tav" style={{ background: t.avGrad, color: t.avColor || "#fff" }}>{t.av}</div>
                <div>
                  <div className="lp-tname">{t.name}</div>
                  <div className="lp-trole">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Harga / Pricing ─── */
const Harga = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const individualFeatures = [
    "Tes minat & bakat untuk kenali potensi",
    "Rekomendasi jalur studi sesuai hasil assestment",
    "Kursus online dasar untuk mulai belajar skill yang sesuai minatmu",
    "Progress tracking agar tahu perkembangan diri",
    "Akses kepada Peluang Mengembangkan diri (Beasiswa, Kompetisi, Karier, dll)",
    "Akses forum komunitas untuk sharing & belajar bareng",
  ];
  const premiumFeatures = [
    "Semua fitur Individual",
    "Analisis potensi & skill lebih lengkap",
    "Konsultasi dengan mentor berpengalaman",
    "Akses kursus & program premium",
    "Portofolio builder untuk beasiswa/magang",
    "Networking dengan profesional & industri",
    "Akses lengkap kepada Peluang Mengembangkan diri",
    "Sertifikat & pencatatan skill",
  ];

  return (
    <section id="harga" className="lp-section">
      <div className="lp-section-inner">
        <div className="lp-section-head reveal">
          <span className="lp-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9l4-5h12l4 5-10 13L2 9z" />
            </svg>
            Harga sederhana, dampak luar biasa
          </span>
          <h2>Pilih Paket yang <span className="accent">Tepat</span></h2>
          <p>Mulai perjalanan penemuan minat dan bakat Anda dengan paket yang sesuai kebutuhan.</p>
        </div>

        <div className="lp-pricing-grid">
          {/* Individual */}
          <div className="lp-pricing-card reveal">
            <div className="lp-pc-banner">
              <StarSVG size={14} />
              Untuk Pelajar
            </div>
            <div className="lp-pc-body">
              <div className="lp-pc-icon">
                <StarSVG size={28} />
              </div>
              <h3 className="lp-pc-tier">Individual</h3>
              <div className="lp-pc-price">Rp 39.000<small>/bulan</small></div>
              <ul className="lp-pc-features">
                {individualFeatures.map((f) => (
                  <li key={f}>
                    <span className="lp-check"><CheckSVG /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn lp-btn-secondary lp-btn-block lp-btn-lg" onClick={() => navigate("/subscription")}>
                Berlangganan Sekarang
              </button>
            </div>
          </div>

          {/* Premium */}
          <div className="lp-pricing-card featured reveal">
            <div className="lp-pc-banner">
              <StarSVG size={14} />
              Paling Populer
            </div>
            <div className="lp-pc-body">
              <div className="lp-pc-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 18h18M3 18l2-10 5 5 2-7 2 7 5-5 2 10" />
                </svg>
              </div>
              <h3 className="lp-pc-tier">Premium</h3>
              <div className="lp-pc-price">Rp 99.000<small>/bulan</small></div>
              <ul className="lp-pc-features">
                {premiumFeatures.map((f) => (
                  <li key={f}>
                    <span className="lp-check"><CheckSVG /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn lp-btn-primary lp-btn-block lp-btn-lg" onClick={() => navigate("/subscription")}>
                Berlangganan Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Mitra ─── */
const Mitra = () => {
  const mitraCards = [
    {
      cls: "lp-mc-school",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" /></svg>,
      title: "Sekolah", desc: "Tingkatkan kualitas bimbingan & pengembangan siswa",
    },
    {
      cls: "lp-mc-brand",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" /></svg>,
      title: "Brand / Perusahaan", desc: "Jangkau talenta muda dan bangun kolaborasi berdampak",
    },
    {
      cls: "lp-mc-komunitas",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" /></svg>,
      title: "Komunitas", desc: "Berdayakan anggota dan ciptakan program bermanfaat",
    },
  ];

  const trustItems = [
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>, title: "Aman & Terpercaya", desc: "Data dan informasi aman bersama Talentika" },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6" /><circle cx="17" cy="9" r="2.5" /><path d="M22 19c0-2.5-2-4-5-4" /></svg>, title: "Berdampak Nyata", desc: "Bersama membangun generasi muda berpotensi" },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg>, title: "Solusi Fleksibel", desc: "Program dapat disesuaikan dengan kebutuhan Anda" },
    { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" /></svg>, title: "Kolaborasi Berkelanjutan", desc: "Bersama menciptakan perubahan positif untuk masa depan" },
  ];

  const handleWhatsApp = () => {
    window.open("https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20menjadi%20mitra!", "_blank");
  };

  return (
    <section id="mitra" className="lp-mitra">
      <div className="lp-mitra-inner">
        {/* Left */}
        <div className="reveal">
          <span className="lp-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z" /></svg>
            Untuk Sekolah, Brand & Komunitas
          </span>
          <h2>Bergabung Menjadi<br />Mitra <span className="accent">Talentika</span></h2>
          <p className="lp-mitra-lede">
            Memberikan kemudahan bagi sekolah, brand, atau komunitas yang ingin bermitra dengan Talentika untuk mengembangkan potensi generasi muda Indonesia.
          </p>

          <div className="lp-mitra-meta">
            <div className="lp-mitra-meta-item lp-mmi-fast">
              <div className="lp-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
              </div>
              <div>
                <div className="lp-lbl">Respon cepat</div>
                <div className="lp-val">dalam 1x24 jam</div>
              </div>
            </div>
            <div className="lp-mitra-meta-item lp-mmi-wa">
              <div className="lp-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2zM12 21a9 9 0 01-4.6-1.3l-3.2.8.9-3.1A9 9 0 1112 21z" />
                </svg>
              </div>
              <div>
                <div className="lp-lbl">Langsung terhubung</div>
                <div className="lp-val">ke WhatsApp</div>
              </div>
            </div>
          </div>

          <button className="lp-btn-wa" onClick={handleWhatsApp}>
            <span className="lp-wa-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.5 3.5A11 11 0 003 19l-1 5 5-1.3a11 11 0 0013.5-19.2z" />
              </svg>
            </span>
            Hubungi Kami Sekarang
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="lp-privacy-note">
            <span className="lp-shield">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
              </svg>
            </span>
            <span>* Dengan mengklik tombol di atas, Anda akan diarahkan ke WhatsApp untuk memulai percakapan.</span>
          </div>
        </div>

        {/* Right Visual */}
        <div className="lp-mitra-visual reveal">
          <div className="lp-mitra-circle" />
          <div className="lp-mitra-dots" />

          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }} viewBox="0 0 600 520" fill="none" preserveAspectRatio="none">
            <path d="M120 100 Q 250 180, 300 260" stroke="#1D4ED8" strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity=".5" />
            <path d="M480 100 Q 380 180, 300 260" stroke="#1D4ED8" strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity=".5" />
            <path d="M100 380 Q 200 320, 300 260" stroke="#1D4ED8" strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity=".5" />
          </svg>

          {["s1", "s2", "s3", "s4"].map((s) => (
            <svg key={s} className={`lp-mitra-sp ${s}`} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z" />
            </svg>
          ))}

          {/* Photo placeholder */}
          <div className="lp-mitra-photo">
            <div style={{ textAlign: "center", color: "#7FA8FF", opacity: .5 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          </div>

          {mitraCards.map((card) => (
            <div key={card.title} className={`lp-mitra-card ${card.cls}`}>
              <div className="lp-mc-ico">{card.icon}</div>
              <div>
                <h5>{card.title}</h5>
                <p>{card.desc}</p>
              </div>
            </div>
          ))}

          <div className="lp-mitra-glow">
            <div className="lp-gicon">
              <StarSVG size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="lp-mitra-trust reveal">
        {trustItems.map((item) => (
          <div key={item.title} className="lp-mtr-item">
            <div className="lp-ico">{item.icon}</div>
            <div>
              <h5>{item.title}</h5>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── Footer ─── */
const Footer = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <footer className="lp-footer">
    <div className="lp-footer-inner">
      {/* Brand + desc + socials */}
      <div>
        <div className="lp-foot-brand">
          <div className="lp-foot-brand-mark">
            <StarSVG size={22} />
            <span className="lp-foot-brand-star">✦</span>
          </div>
          <div>
            <b>Talentika</b>
            <small>Discover Your Full Potential</small>
          </div>
        </div>
        <p className="lp-foot-desc">
          Talentika membantu generasi muda menemukan passion dan mengembangkan talenta melalui assessment yang komprehensif dan panduan karir yang personal.
        </p>
        <div className="lp-socials">
          {[
            { label: "Instagram", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg> },
            { label: "YouTube", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8a3 3 0 00-2-2c-2-.5-8-.5-8-.5s-6 0-8 .5a3 3 0 00-2 2c-.5 2-.5 4-.5 4s0 2 .5 4a3 3 0 002 2c2 .5 8 .5 8 .5s6 0 8-.5a3 3 0 002-2c.5-2 .5-4 .5-4s0-2-.5-4zM10 15V9l5 3-5 3z" /></svg> },
            { label: "TikTok", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3a5 5 0 005 5v3a8 8 0 01-5-1.7V16a6 6 0 11-6-6v3.2A2.8 2.8 0 1013 16V3z" /></svg> },
            { label: "LinkedIn", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /><path d="M10 9h4v2c.5-1 2-2 4-2 3 0 4 2 4 5v7h-4v-6c0-1 0-2-2-2s-2 1-2 2v6h-4z" /></svg> },
          ].map((s) => (
            <a key={s.label} aria-label={s.label}>{s.icon}</a>
          ))}
        </div>
      </div>

      {/* Tautan Cepat */}
      <div>
        <h5>Tautan Cepat</h5>
        <ul>
          {["Beranda", "Fitur", "Cara Kerja", "Tentang Kami", "FAQ"].map((item) => (
            <li key={item}><a onClick={() => {}}>{item}</a></li>
          ))}
        </ul>
      </div>

      {/* Layanan */}
      <div>
        <h5>Layanan</h5>
        <ul>
          {["Tes Minat & Bakat", "Eksplorasi Karir", "Rekomendasi Skill", "Komunitas Belajar", "Progress Tracking"].map((item) => (
            <li key={item}><a>{item}</a></li>
          ))}
        </ul>
      </div>

      {/* Kontak */}
      <div>
        <h5>Kontak</h5>
        <div className="lp-contact-row">
          <span className="lp-cio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" />
            </svg>
          </span>
          Discover@Talentika.id
        </div>
        <div className="lp-contact-row">
          <span className="lp-cio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5c0 9 7 16 16 16l3-4-5-2-2 2c-3-1-6-4-7-7l2-2-2-5z" />
            </svg>
          </span>
          +62 851 4843 4141
        </div>
        <div className="lp-contact-row" style={{ alignItems: "flex-start" }}>
          <span className="lp-cio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </span>
          <span>Jalan Kuningan Mulia Lot 9 B,<br />Kota Adm. Jakarta Selatan, DKI Jakarta</span>
        </div>
      </div>
    </div>

    <div className="lp-foot-bottom">
      <span>© 2026 Talentika. All rights reserved.</span>
      <div className="lp-foot-links">
        <a>Kebijakan Privasi</a>
        <a>Syarat & Ketentuan</a>
        <a>Cookie</a>
      </div>
    </div>
  </footer>
);

/* ─── Articles Section ─── */
interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  featured_image_url: string | null;
  reading_time_minutes: number;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

const Articles = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("articles")
      .select("id,title,slug,excerpt,category,tags,featured_image_url,reading_time_minutes,view_count,published_at,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setArticles((data as Article[]) || []);
        setLoading(false);
      });
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section id="artikel" className="lp-articles-section">
      <div className="lp-articles-inner">
        <div className="lp-articles-head reveal">
          <div className="lp-articles-head-row">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--lp-blue-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <h2>Artikel Terbaru</h2>
          </div>
          <p>Tips, panduan, dan insight pengembangan karir dari para ahli untuk generasi muda Indonesia.</p>
        </div>

        {loading ? (
          /* Skeleton */
          <div className="lp-articles-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, border: "1px solid #EEF1F6", overflow: "hidden" }}>
                <div className="lp-art-skel" style={{ height: 176 }} />
                <div style={{ padding: "20px" }}>
                  <div className="lp-art-skel" style={{ height: 14, marginBottom: 10, width: "60%" }} />
                  <div className="lp-art-skel" style={{ height: 18, marginBottom: 8 }} />
                  <div className="lp-art-skel" style={{ height: 18, marginBottom: 16, width: "80%" }} />
                  <div className="lp-art-skel" style={{ height: 13, marginBottom: 6 }} />
                  <div className="lp-art-skel" style={{ height: 13, width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lp-articles-grid">
            {articles.map((article) => (
              <div key={article.id} className="lp-article-card">
                <div className="lp-article-img-wrap">
                  {article.featured_image_url ? (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="lp-article-img"
                      loading="lazy"
                      width="400"
                      height="176"
                    />
                  ) : (
                    <div className="lp-article-img-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                      </svg>
                    </div>
                  )}
                  {article.category && (
                    <span className="lp-article-cat">{article.category}</span>
                  )}
                </div>
                <div className="lp-article-body">
                  {(article.tags || []).length > 0 && (
                    <div className="lp-article-tags">
                      {(article.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="lp-article-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <Link to={`/articles/${article.slug}`} className="lp-article-title">
                    {article.title}
                  </Link>
                  {article.excerpt && (
                    <p className="lp-article-excerpt">{article.excerpt}</p>
                  )}
                  <div className="lp-article-meta">
                    <div className="lp-article-meta-left">
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                        </svg>
                        {article.reading_time_minutes} min
                      </span>
                      <span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        {article.view_count}
                      </span>
                    </div>
                    <span>
                      {new Date(article.published_at || article.created_at).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="lp-articles-cta">
          <button className="lp-articles-btn" onClick={() => navigate("/articles")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            Baca Semua Artikel
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── Main Index ─── */
const Index = () => {
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  /* Reveal on scroll */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    el.querySelectorAll(".reveal").forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <SEO
        title="Talentika - Temukan Minat & Bakat Mu | Eksplorasi Karir & Potensi Diri"
        description="Platform terlengkap untuk menemukan minat, bakat, dan potensi diri. Tes psikometri RIASEC, Holland Test, panduan karir, beasiswa & kompetisi untuk pelajar dan mahasiswa Indonesia."
        keywords="tes minat bakat, eksplorasi karir, psikometri online, holland test indonesia, RIASEC test, pelajar, mahasiswa, talent discovery, beasiswa indonesia, magang indonesia, kompetisi pelajar"
        canonical="https://talentika.id/"
      />
      <WelcomePopup />
      <WhatsAppButton />

      <div className="lp-wrap" ref={wrapRef}>
        <Nav navigate={navigate} />
        <Hero navigate={navigate} />
        <Fitur navigate={navigate} />
        <CaraKerja navigate={navigate} />
        <Testimoni />
        <Harga navigate={navigate} />
        <Mitra />
        <Articles navigate={navigate} />
        <Footer navigate={navigate} />
      </div>
    </>
  );
};

export default Index;
