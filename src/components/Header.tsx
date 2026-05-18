import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [solusiOpen, setSolusiOpen]     = useState(false);
  const [mobileSolusi, setMobileSolusi] = useState(true);
  const [scrolled, setScrolled]         = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSolusiOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setSolusiOpen(false); }, [location.pathname]);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    setSolusiOpen(false);
    if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }), 120);
      } else {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(href);
    }
  };

  const mainLinks = [
    { label: "Fitur",        href: "#fitur" },
    { label: "Tentang Kami", href: "/tentang-kami" },
    { label: "Harga",        href: "#harga" },
    { label: "Artikel",      href: "/articles" },
  ];

  const solusiItems = [
    {
      href: "/for-schools",
      iconBg: "#D1FAE5", iconColor: "#059669",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21V8l9-5 9 5v13"/><path d="M9 21V12h6v9"/>
        </svg>
      ),
      label: "For School",
      desc: "Platform untuk sekolah & institusi",
    },
    {
      href: "/talentika-junior",
      iconBg: "#EEF2FF", iconColor: "#4F46E5",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/>
        </svg>
      ),
      label: "Talentika Junior",
      desc: "Untuk pelajar SD–SMP",
    },
    {
      href: "/mitra",
      iconBg: "#FFF0EB", iconColor: "#FF6A00",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      label: "Bergabung Mitra",
      desc: "Untuk sekolah, brand & komunitas",
    },
  ];

  /* ─── styles (inline so Header works outside landing.css scope) ─── */
  const s: Record<string, React.CSSProperties> = {
    nav: {
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 50,
      background: "rgba(255,255,255,.92)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(0,0,0,.07)",
      boxShadow: scrolled ? "0 2px 20px -4px rgba(11,29,58,.10)" : "none",
      transition: "box-shadow .3s",
    },
    inner: {
      maxWidth: 1320,
      margin: "0 auto",
      padding: "0 36px",
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 36,
    },
    brand: {
      display: "flex", alignItems: "center", gap: 10,
      cursor: "pointer", textDecoration: "none", flexShrink: 0,
    },
    brandMark: {
      width: 38, height: 38, borderRadius: 10,
      background: "linear-gradient(135deg,#1D4ED8,#1E40AF)",
      display: "grid", placeItems: "center",
      boxShadow: "0 4px 12px -4px rgba(29,78,216,.4)",
      color: "#fff", flexShrink: 0, position: "relative",
    },
    brandName: { display: "flex", flexDirection: "column", lineHeight: 1 },
    links: {
      display: "flex", alignItems: "center", gap: 4,
      flex: 1, justifyContent: "center",
    },
    link: {
      padding: "8px 14px", borderRadius: 10,
      color: "#374151", fontFamily: "'Poppins',sans-serif",
      fontWeight: 500, fontSize: 14,
      background: "transparent", border: "none",
      cursor: "pointer", transition: "color .15s, background .15s",
      textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
    },
    cta: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
    btnGhost: {
      padding: "8px 16px", borderRadius: 10,
      border: "1px solid #E5E7EB", background: "transparent",
      color: "#374151", fontFamily: "'Poppins',sans-serif",
      fontWeight: 600, fontSize: 14, cursor: "pointer",
      transition: "background .15s",
    },
    btnPrimary: {
      padding: "9px 18px", borderRadius: 10,
      border: "none",
      background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
      color: "#fff", fontFamily: "'Poppins',sans-serif",
      fontWeight: 700, fontSize: 14, cursor: "pointer",
      boxShadow: "0 4px 12px -2px rgba(29,78,216,.35)",
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "filter .15s",
    },
    dropdownWrap: { position: "relative" },
    dropdownMenu: {
      position: "absolute",
      top: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      minWidth: 280,
      background: "#fff",
      border: "1.5px solid #E5E7EB",
      borderRadius: 18,
      boxShadow: "0 20px 48px -12px rgba(11,29,58,.16)",
      padding: 8,
      zIndex: 100,
      animation: "hdr-drop-in .18s cubic-bezier(.22,1,.36,1) both",
    },
    dropItem: {
      display: "flex", alignItems: "center", gap: 14,
      width: "100%", padding: "10px 12px",
      borderRadius: 12, border: "none",
      background: "transparent", cursor: "pointer",
      textAlign: "left" as const, transition: "background .15s",
    },
    dropIcon: {
      width: 40, height: 40, borderRadius: 12,
      display: "grid", placeItems: "center", flexShrink: 0,
    },
    hamburger: {
      display: "none", background: "transparent",
      border: "none", cursor: "pointer", padding: 8,
      borderRadius: 8, color: "#374151",
    },
    mobileMenu: {
      borderTop: "1px solid #F3F4F6",
      background: "rgba(255,255,255,.98)",
      padding: "12px 20px 20px",
      display: "flex", flexDirection: "column" as const, gap: 4,
    },
    mobileSolusiToggle: {
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      width: "100%", padding: "12px 14px",
      borderRadius: 10, border: "none",
      background: "transparent", cursor: "pointer",
      fontFamily: "'Poppins',sans-serif", fontWeight: 500,
      fontSize: 14, color: "#374151", textAlign: "left" as const,
    },
    mobileSolusiItems: {
      display: "flex", flexDirection: "column" as const, gap: 4,
      padding: "4px 0 4px 12px",
      borderLeft: "2px solid #F3F4F6",
      marginLeft: 16,
    },
    mobileSolusiItem: {
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "10px 12px",
      borderRadius: 12, border: "none",
      background: "transparent", cursor: "pointer",
      textAlign: "left" as const, transition: "background .15s",
    },
  };

  const isActive = (href: string) =>
    href.startsWith("#") ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <>
      {/* Dropdown animation keyframe */}
      <style>{`
        @keyframes hdr-drop-in {
          from { opacity:0; transform:translateX(-50%) translateY(-6px) scale(.97); }
          to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1); }
        }
        .hdr-link:hover { background:#F9FAFB !important; color:#1D4ED8 !important; }
        .hdr-drop-item:hover { background:#F9FAFB !important; }
        .hdr-ghost:hover { background:#F9FAFB !important; }
        .hdr-primary:hover { filter:brightness(1.08); }
        .hdr-mobile-item:hover { background:#F9FAFB !important; }
        @media (max-width: 768px) {
          .hdr-links { display:none !important; }
          .hdr-cta   { display:none !important; }
          .hdr-burger { display:grid !important; place-items:center; }
          .hdr-inner { padding: 0 18px !important; }
        }
      `}</style>

      <nav style={s.nav}>
        <div style={s.inner} className="hdr-inner">

          {/* ── Brand ── */}
          <div style={s.brand} onClick={() => handleNav(location.pathname === "/" ? "#beranda" : "/")}>
            <img src="/logo.png" alt="Talentika" style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 10, flexShrink: 0 }} />
            <div style={s.brandName}>
              <b style={{ fontFamily:"'Poppins',sans-serif", fontSize:19, fontWeight:700, color:"#0B1D3A", letterSpacing:"-.01em" }}>Talentika</b>
              <small style={{ fontSize:10, color:"#9CA3AF", marginTop:2, fontWeight:400 }}>Discover your full potential</small>
            </div>
          </div>

          {/* ── Desktop links ── */}
          <div style={s.links} className="hdr-links">
            {mainLinks.map(item => (
              <button
                key={item.label}
                className="hdr-link"
                style={{ ...s.link, color: isActive(item.href) ? "#1D4ED8" : "#374151", fontWeight: isActive(item.href) ? 600 : 500 }}
                onClick={() => handleNav(item.href)}
              >
                {item.label}
              </button>
            ))}

            {/* Solusi dropdown */}
            <div style={s.dropdownWrap} ref={dropdownRef}>
              <button
                className="hdr-link"
                style={{ ...s.link, color: solusiOpen ? "#1D4ED8" : "#374151", background: solusiOpen ? "#EFF6FF" : "transparent" }}
                onClick={() => setSolusiOpen(v => !v)}
                aria-expanded={solusiOpen}
              >
                Solusi
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition:"transform .2s", transform: solusiOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {solusiOpen && (
                <div style={s.dropdownMenu}>
                  {/* arrow tip */}
                  <div style={{ position:"absolute", top:-7, left:"50%", transform:"translateX(-50%)", width:14, height:7,
                    background:"#fff", clipPath:"polygon(0% 100%, 50% 0%, 100% 100%)" }} />
                  {solusiItems.map(item => (
                    <button key={item.href} className="hdr-drop-item" style={s.dropItem} onClick={() => handleNav(item.href)}>
                      <div style={{ ...s.dropIcon, background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:"#0B1D3A" }}>{item.label}</span>
                        <span style={{ fontSize:12, color:"#6B7280" }}>{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop CTAs ── */}
          <div style={s.cta} className="hdr-cta">
            <button className="hdr-ghost" style={s.btnGhost} onClick={() => navigate("/auth")}>Masuk</button>
            <button className="hdr-primary" style={s.btnPrimary} onClick={() => navigate("/auth")}>
              Daftar Gratis
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* ── Hamburger ── */}
          <button
            className="hdr-burger"
            style={s.hamburger}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen(v => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></>}
            </svg>
          </button>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div style={s.mobileMenu}>
            {mainLinks.map(item => (
              <button key={item.label} className="hdr-mobile-item" style={{ ...s.link, width:"100%", justifyContent:"flex-start", padding:"12px 14px" }} onClick={() => handleNav(item.href)}>
                {item.label}
              </button>
            ))}

            {/* Solusi accordion */}
            <div>
              <button style={s.mobileSolusiToggle} onClick={() => setMobileSolusi(v => !v)}>
                <span>Solusi</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition:"transform .2s", transform: mobileSolusi ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {mobileSolusi && (
                <div style={s.mobileSolusiItems}>
                  {solusiItems.map(item => (
                    <button key={item.href} className="hdr-mobile-item" style={s.mobileSolusiItem} onClick={() => handleNav(item.href)}>
                      <div style={{ width:36, height:36, borderRadius:10, background:item.iconBg, color:item.iconColor, display:"grid", placeItems:"center", flexShrink:0 }}>
                        {item.icon}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                        <span style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:"#0B1D3A" }}>{item.label}</span>
                        <span style={{ fontSize:12, color:"#6B7280" }}>{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile CTAs */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
              <button style={{ ...s.btnGhost, width:"100%", textAlign:"center" }} onClick={() => { setMenuOpen(false); navigate("/auth"); }}>
                Masuk
              </button>
              <button style={{ ...s.btnPrimary, width:"100%", justifyContent:"center" }} onClick={() => { setMenuOpen(false); navigate("/auth"); }}>
                Daftar Gratis →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content doesn't go under fixed nav */}
      <div style={{ height: 64 }} />
    </>
  );
};

export default Header;
