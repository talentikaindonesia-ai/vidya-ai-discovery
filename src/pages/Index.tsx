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
  const [menuOpen, setMenuOpen]     = useState(false);
  const [solusiOpen, setSolusiOpen] = useState(false);
  const [mobileSolusi, setMobileSolusi] = useState(true); // expanded by default in mobile
  const [scrolled, setScrolled]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolusiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    setSolusiOpen(false);
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  const mainLinks = [
    { label: "Fitur",        href: "#fitur" },
    { label: "Tentang Kami", href: "/tentang-kami" },
    { label: "Harga",        href: "#harga" },
    { label: "Artikel",      href: "/articles" },
    { label: "Mitra",        href: "/mitra" },
  ];

  const solusiItems = [
    {
      href: "/for-schools",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/>
        </svg>
      ),
      iconBg: "#D1FAE5", iconColor: "#059669",
      label: "For School",
      desc: "Platform untuk sekolah & institusi",
    },
    {
      href: "/talentika-junior",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/>
        </svg>
      ),
      iconBg: "#EEF2FF", iconColor: "#4F46E5",
      label: "Talentika Junior",
      desc: "Untuk pelajar SD–SMP",
    },
    {
      href: "/mitra",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      iconBg: "#FFF0EB", iconColor: "#FF6A00",
      label: "Bergabung Mitra",
      desc: "Untuk sekolah, brand & komunitas",
    },
  ];

  return (
    <nav className="lp-nav" style={{ boxShadow: scrolled ? "0 2px 20px -4px rgba(11,29,58,.10)" : "none" }}>
      <div className="lp-nav-inner">

        {/* ── Brand ── */}
        <a className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo.png" alt="Talentika" className="lp-brand-mark" />
          <div className="lp-brand-name">
            <b>Talentika</b>
            <small>Discover your full potential</small>
          </div>
        </a>

        {/* ── Desktop Links ── */}
        <div className="lp-nav-links">
          {mainLinks.map(item => (
            <button
              key={item.label}
              className="lp-nav-link"
              onClick={() => handleNav(item.href)}
            >
              {item.label}
            </button>
          ))}

          {/* Solusi dropdown */}
          <div className="lp-nav-dropdown" ref={dropdownRef}>
            <button
              className={`lp-nav-link lp-dropdown-trigger${solusiOpen ? " active" : ""}`}
              onClick={() => setSolusiOpen(v => !v)}
              aria-expanded={solusiOpen}
            >
              Solusi
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ transition: "transform .2s", transform: solusiOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {solusiOpen && (
              <div className="lp-dropdown-menu">
                {solusiItems.map(item => (
                  <button key={item.href} className="lp-dropdown-item" onClick={() => handleNav(item.href)}>
                    <div className="lp-dropdown-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                      {item.icon}
                    </div>
                    <div className="lp-dropdown-text">
                      <span className="lp-dropdown-label">{item.label}</span>
                      <span className="lp-dropdown-desc">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop CTAs ── */}
        <div className="lp-nav-cta">
          <button className="lp-btn lp-btn-ghost" onClick={() => navigate("/auth")}>Masuk</button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate("/auth")}>
            Daftar Gratis
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        {/* ── Hamburger ── */}
        <button
          className="lp-hamburger"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          onClick={() => setMenuOpen(v => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></>
            }
          </svg>
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`lp-mobile-menu${menuOpen ? " open" : ""}`}>

        {/* Main links */}
        {mainLinks.map(item => (
          <button key={item.label} className="lp-nav-link" onClick={() => handleNav(item.href)}>
            {item.label}
          </button>
        ))}

        {/* Solusi accordion */}
        <div className="lp-mobile-solusi">
          <button
            className="lp-mobile-solusi-toggle"
            onClick={() => setMobileSolusi(v => !v)}
          >
            <span>Solusi</span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: "transform .2s", transform: mobileSolusi ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {mobileSolusi && (
            <div className="lp-mobile-solusi-items">
              {solusiItems.map(item => (
                <button key={item.href} className="lp-mobile-solusi-item" onClick={() => handleNav(item.href)}>
                  <div className="lp-dropdown-icon" style={{ background: item.iconBg, color: item.iconColor, width: 36, height: 36, borderRadius: 10 }}>
                    {item.icon}
                  </div>
                  <div className="lp-dropdown-text">
                    <span className="lp-dropdown-label">{item.label}</span>
                    <span className="lp-dropdown-desc">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <button className="lp-btn lp-btn-ghost lp-btn-block" onClick={() => { setMenuOpen(false); navigate("/auth"); }}>
            Masuk
          </button>
          <button className="lp-btn lp-btn-primary lp-btn-block" onClick={() => { setMenuOpen(false); navigate("/auth"); }}>
            Daftar Gratis →
          </button>
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

        {/* Hero Photo */}
        <div className="lp-hero-photo" style={{ backgroundImage: "url('/hero-students.webp')", backgroundSize: "cover", backgroundPosition: "center" }}>
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
  const [annual, setAnnual] = useState(false);

  const freeFeatures = [
    "Tes minat & bakat RIASEC",
    "Hasil asesmen singkat",
    "Rekomendasi karier dasar",
    "Akses forum komunitas",
  ];
  const basicFeatures = [
    "Semua fitur Gratis",
    "Laporan asesmen 1x/bulan",
    "Rekomendasi jalur studi lengkap",
    "Progress tracking & dashboard",
    "Akses peluang (beasiswa, karier, kompetisi)",
    "Kursus online dasar",
    "Sertifikat digital",
  ];
  const premiumFeatures = [
    "Semua fitur Basic",
    "Laporan asesmen tak terbatas",
    "Mentoring 1-on-1 (2x/bulan)",
    "VOD Bootcamp eksklusif",
    "Diskon 30% Live Bootcamp",
    "Portofolio builder premium",
    "LinkedIn achievement badge",
    "Komunitas & networking eksklusif",
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
          <p>Mulai gratis, upgrade kapan saja. Bayar bulanan atau tahunan — selalu bisa diubah.</p>
        </div>

        {/* ── Billing Toggle ── */}
        <div className="lp-billing-toggle reveal">
          <div className="lp-billing-pill">
            <button
              className={`lp-billing-btn${!annual ? " active" : ""}`}
              onClick={() => setAnnual(false)}
            >
              Bulanan
            </button>
            <button
              className={`lp-billing-btn${annual ? " active" : ""}`}
              onClick={() => setAnnual(true)}
            >
              Tahunan
              {!annual && <span className="lp-billing-save">Hemat 2 bulan!</span>}
            </button>
          </div>
        </div>

        {/* ── Report One-time Callout ── */}
        <div className="lp-report-callout reveal">
          <div className="lp-report-callout-left">
            <div className="lp-report-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "var(--lp-display)", fontWeight: 700, fontSize: 15, color: "#92400E", marginBottom: 2 }}>
                📊 Laporan Asesmen Lengkap — Rp 29.000 sekali bayar
              </div>
              <div style={{ fontSize: 13, color: "#B45309", lineHeight: 1.5 }}>
                Tidak ingin berlangganan? Dapatkan laporan mendalam + rekomendasi personal sekali bayar, berlaku selamanya.
              </div>
            </div>
          </div>
          <button
            className="lp-btn lp-btn-secondary"
            style={{ whiteSpace: "nowrap", background: "#fff", borderColor: "#FED7AA", color: "#C2410C", flexShrink: 0 }}
            onClick={() => navigate("/assessment")}
          >
            Beli Laporan →
          </button>
        </div>

        {/* ── 4-Column Pricing Grid ── */}
        <div className="lp-pricing-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 1100 }}>

          {/* Free */}
          <div className="lp-pricing-card free-card reveal">
            <div className="lp-pc-banner">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Mulai Gratis
            </div>
            <div className="lp-pc-body">
              <div className="lp-pc-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>
              </div>
              <h3 className="lp-pc-tier">Gratis</h3>
              <div className="lp-pc-price" style={{ fontSize: 28, color: "#64748B" }}>Rp 0<small style={{ fontSize: 13 }}>/selamanya</small></div>
              <ul className="lp-pc-features">
                {freeFeatures.map((f) => (
                  <li key={f}>
                    <span className="lp-check"><CheckSVG /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn lp-btn-block" style={{ background: "#F1F5FB", color: "#475569", border: "1.5px solid #CBD5E1", fontWeight: 600, borderRadius: 12, padding: "12px 20px", cursor: "pointer", width: "100%" }} onClick={() => navigate("/auth")}>
                Mulai Gratis
              </button>
            </div>
          </div>

          {/* Basic */}
          <div className="lp-pricing-card reveal">
            <div className="lp-pc-banner">
              <StarSVG size={13} />
              Untuk Pelajar
            </div>
            <div className="lp-pc-body">
              <div className="lp-pc-icon">
                <StarSVG size={26} />
              </div>
              <h3 className="lp-pc-tier">Basic</h3>
              {annual && <div className="lp-pc-price-old">Rp 468.000/thn</div>}
              <div className="lp-pc-price">
                {annual ? <>Rp 390.000<small>/tahun</small></> : <>Rp 39.000<small>/bulan</small></>}
              </div>
              <ul className="lp-pc-features">
                {basicFeatures.map((f) => (
                  <li key={f}>
                    <span className="lp-check"><CheckSVG /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="lp-btn lp-btn-secondary lp-btn-block lp-btn-lg" onClick={() => navigate("/subscription")}>
                Berlangganan
              </button>
            </div>
          </div>

          {/* Premium — Featured */}
          <div className="lp-pricing-card featured reveal">
            <div className="lp-pc-banner">
              <StarSVG size={13} />
              🔥 Paling Populer
            </div>
            <div className="lp-pc-body">
              <div className="lp-pc-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z"/>
                </svg>
              </div>
              <h3 className="lp-pc-tier">Premium</h3>
              {annual && <div className="lp-pc-price-old" style={{ color: "#93C5FD" }}>Rp 1.068.000/thn</div>}
              <div className="lp-pc-price">
                {annual
                  ? <><span style={{ fontSize: 22 }}>Rp 890.000</span><small>/tahun</small></>
                  : <>Rp 89.000<small>/bulan</small></>}
              </div>
              {annual && (
                <div style={{ textAlign: "center", marginTop: -14, marginBottom: 14 }}>
                  <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                    ✓ Hemat 2 bulan!
                  </span>
                </div>
              )}
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

        {/* ── Footer note ── */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "#94A3B8" }} className="reveal">
          Semua paket dilengkapi uji coba 7 hari · Batalkan kapan saja · Tidak ada biaya tersembunyi
        </div>
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 13 }} className="reveal">
          <span style={{ color: "#94A3B8" }}>Mewakili sekolah atau institusi? </span>
          <button
            onClick={() => navigate("/for-schools")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontWeight: 700, fontSize: 13, padding: 0, textDecoration: "underline" }}
          >
            Lihat Paket Sekolah →
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── Talentika for School Teaser ─── */
const ForSchoolTeaser = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <section style={{
    padding: "88px 36px",
    background: "linear-gradient(180deg,#F1F5FB 0%,#E8F1FF 60%,#F8FAFC 100%)",
    position: "relative",
    overflow: "hidden",
  }}>
    {/* Decorative blobs */}
    <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(29,78,216,.06) 0%,transparent 70%)",top:-200,right:-100,pointerEvents:"none" }}/>
    <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,193,7,.08) 0%,transparent 70%)",bottom:-80,left:-50,pointerEvents:"none" }}/>

    <div style={{ maxWidth:1320,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center" }}>
      {/* Left: copy */}
      <div className="reveal">
        <div style={{ display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px 8px 8px",borderRadius:99,background:"#fff",border:"1.5px solid #BFDBFE",color:"#1E40AF",fontWeight:700,fontSize:14,boxShadow:"0 6px 20px -8px rgba(29,78,216,.2)",marginBottom:24 }}>
          <div style={{ width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#3B82F6,#1D4ED8)",color:"#fff",display:"grid",placeItems:"center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/></svg>
          </div>
          Talentika for School
        </div>

        <h2 style={{ fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:"clamp(30px,3.4vw,44px)",letterSpacing:"-.025em",lineHeight:1.1,margin:"0 0 16px",color:"#0B1D3A" }}>
          Platform Resmi untuk<br/>
          <span style={{ color:"#1D4ED8" }}>Sekolah &amp; Institusi</span><br/>
          Pendidikan Indonesia
        </h2>

        <p style={{ fontSize:16,color:"#4B5563",lineHeight:1.65,margin:"0 0 28px",maxWidth:"48ch" }}>
          Talentika for School menghadirkan ekosistem lengkap — asesmen potensi siswa, dashboard admin, mentoring, dan laporan real-time — khusus dirancang untuk sekolah SD, SMP, SMA, dan SMK.
        </p>

        {/* 4 quick benefits */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32 }}>
          {[
            { icon:"🎯", text:"Asesmen Ilmiah & Akurat" },
            { icon:"📊", text:"Dashboard Admin Sekolah" },
            { icon:"🏆", text:"Program Pengembangan Siswa" },
            { icon:"🤝", text:"Kolaborasi Guru & Orang Tua" },
          ].map((b) => (
            <div key={b.text} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:12,border:"1px solid #E5E7EB",fontSize:13,fontWeight:600,color:"#0B1D3A" }}>
              <span style={{ fontSize:18 }}>{b.icon}</span> {b.text}
            </div>
          ))}
        </div>

        <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
          <button
            onClick={() => navigate("/for-schools")}
            style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"14px 24px",borderRadius:13,background:"linear-gradient(135deg,#2563EB,#1D4ED8)",color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:15,border:"none",cursor:"pointer",boxShadow:"0 14px 32px -10px rgba(29,78,216,.4)",transition:"transform .15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform="translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform="none")}
          >
            Pelajari Selengkapnya
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <a
            href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20mendaftarkan%20sekolah%20kami"
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"14px 24px",borderRadius:13,background:"#fff",color:"#0B1D3A",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:15,border:"1.5px solid #E5E7EB",cursor:"pointer",textDecoration:"none" }}
          >
            Daftar Sekolah
          </a>
        </div>
      </div>

      {/* Right: mini dashboard mockup */}
      <div className="reveal" style={{ display:"flex",flexDirection:"column",gap:12 }}>
        {/* Stats row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
          {[
            { n:"500+", l:"Sekolah Mitra", c:"#1D4ED8" },
            { n:"120K+", l:"Siswa Aktif", c:"#FF6A00" },
            { n:"95%", l:"Akurasi Asesmen", c:"#16A34A" },
            { n:"4.9★", l:"Rating Sekolah", c:"#D97706" },
          ].map((s) => (
            <div key={s.l} style={{ background:"#fff",borderRadius:14,padding:"14px 12px",textAlign:"center",border:"1px solid #E5E7EB",boxShadow:"0 2px 8px -2px rgba(11,29,58,.08)" }}>
              <div style={{ fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:20,color:s.c,lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:11,color:"#6B7280",marginTop:4,lineHeight:1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Mini dashboard card */}
        <div style={{ background:"#fff",borderRadius:20,border:"1px solid #E5E7EB",boxShadow:"0 20px 60px -20px rgba(11,29,58,.2)",overflow:"hidden" }}>
          {/* Header bar */}
          <div style={{ padding:"12px 18px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:7,background:"#1D4ED8",display:"grid",placeItems:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
              </div>
              <span style={{ fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:13,color:"#1E40AF" }}>Talentika School Dashboard</span>
            </div>
            <div style={{ fontSize:10,background:"#D1FAE5",color:"#0F7A3E",borderRadius:99,padding:"3px 10px",fontWeight:700 }}>● Live</div>
          </div>

          {/* Content */}
          <div style={{ padding:18 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:".06em" }}>Progress Belajar Siswa — Bulan Ini</div>
            <svg viewBox="0 0 400 80" width="100%" height="70" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lp-school-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#3B82F6" stopOpacity=".2"/>
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 60 L60 50 L130 54 L200 32 L280 28 L360 14 L400 10" fill="none" stroke="#1D4ED8" strokeWidth="2.5"/>
              <path d="M0 60 L60 50 L130 54 L200 32 L280 28 L360 14 L400 10 L400 80 L0 80Z" fill="url(#lp-school-grad)"/>
              <g fill="#1D4ED8">
                {[[0,60],[130,54],[200,32],[280,28],[400,10]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="3"/>)}
              </g>
            </svg>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14 }}>
              {[
                { lbl:"Siswa Aktif Minggu Ini", val:"1.250", delta:"+12%" },
                { lbl:"Kursus Diselesaikan", val:"320", delta:"+18%" },
                { lbl:"Jam Belajar Total", val:"2.450j", delta:"+22%" },
              ].map((s) => (
                <div key={s.lbl} style={{ background:"#F9FAFB",borderRadius:10,padding:"10px 12px" }}>
                  <div style={{ fontSize:9,color:"#9CA3AF",marginBottom:3 }}>{s.lbl}</div>
                  <div style={{ fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:18,color:"#0B1D3A",lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:9,color:"#16A34A",marginTop:2,fontWeight:600 }}>{s.delta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 program pills */}
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {[
            { t:"Talent Development", c:"#1D4ED8", bg:"#EFF6FF" },
            { t:"Kompetisi & Challenge", c:"#16A34A", bg:"#D1FAE5" },
            { t:"Pelatihan Guru", c:"#D97706", bg:"#FFF6E0" },
            { t:"Kolaborasi Sekolah", c:"#7C3AED", bg:"#EDE9FE" },
          ].map((p) => (
            <div key={p.t} style={{ padding:"7px 14px",borderRadius:99,background:p.bg,color:p.c,fontSize:12,fontWeight:700 }}>
              {p.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

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

          <button className="lp-btn-wa" onClick={() => navigate("/mitra")}>
            <span className="lp-wa-icon" style={{ background: "rgba(255,255,255,.25)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </span>
            Daftar Jadi Mitra
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
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

          {/* Mitra Photo */}
          <div className="lp-mitra-photo" style={{ backgroundImage: "url('/mitra-mentor.webp')", backgroundSize: "cover", backgroundPosition: "center top" }} />

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
          <img src="/logo.png" alt="Talentika" className="lp-foot-brand-mark" />
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
            { label: "Instagram", href: "https://www.instagram.com/talentika.id/", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg> },
            { label: "YouTube", href: "https://www.youtube.com/@talentikaid", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8a3 3 0 00-2-2c-2-.5-8-.5-8-.5s-6 0-8 .5a3 3 0 00-2 2c-.5 2-.5 4-.5 4s0 2 .5 4a3 3 0 002 2c2 .5 8 .5 8 .5s6 0 8-.5a3 3 0 002-2c.5-2 .5-4 .5-4s0-2-.5-4zM10 15V9l5 3-5 3z" /></svg> },
            { label: "TikTok", href: "https://www.tiktok.com/@talentika.id", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3a5 5 0 005 5v3a8 8 0 01-5-1.7V16a6 6 0 11-6-6v3.2A2.8 2.8 0 1013 16V3z" /></svg> },
            { label: "LinkedIn", href: "https://www.linkedin.com/company/talentika", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /><path d="M10 9h4v2c.5-1 2-2 4-2 3 0 4 2 4 5v7h-4v-6c0-1 0-2-2-2s-2 1-2 2v6h-4z" /></svg> },
          ].map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>{s.icon}</a>
          ))}
        </div>
      </div>

      {/* Tautan Cepat */}
      <div>
        <h5>Tautan Cepat</h5>
        <ul>
          {[
            { label: "Beranda",     href: "/" },
            { label: "Fitur",       href: "/#fitur" },
            { label: "Cara Kerja",  href: "/#cara-kerja" },
            { label: "Harga",       href: "/#harga" },
            { label: "Kontak",      href: "mailto:Discover@Talentika.id" },
          ].map(({ label, href }) => (
            <li key={label}><a href={href}>{label}</a></li>
          ))}
        </ul>
      </div>

      {/* Layanan */}
      <div>
        <h5>Layanan</h5>
        <ul>
          {[
            { label: "Tes Minat & Bakat",   href: "/assessment" },
            { label: "Eksplorasi Karir",     href: "/opportunities" },
            { label: "Learning Hub",         href: "/learning-hub" },
            { label: "Komunitas Belajar",    href: "/community" },
            { label: "Portfolio Builder",    href: "/portfolio" },
          ].map(({ label, href }) => (
            <li key={label}><a href={href}>{label}</a></li>
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
        <a href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20menanyakan%20Kebijakan%20Privasi" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a>
        <a href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20menanyakan%20Syarat%20%26%20Ketentuan" target="_blank" rel="noopener noreferrer">Syarat & Ketentuan</a>
        <a href="mailto:Discover@Talentika.id">Cookie</a>
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
        <ForSchoolTeaser navigate={navigate} />
        <Mitra />
        <Articles navigate={navigate} />
        <Footer navigate={navigate} />
      </div>
    </>
  );
};

export default Index;
