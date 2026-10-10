/**
 * Auth.tsx — Redesigned 3-path authentication
 * Step 0 : Role selector  (Pelajar / Sekolah)
 * Step 1a: Individual flow (Google OAuth + email/password)
 * Step 1b: School flow     (email/password only + school details)
 *
 * Post-login redirect:
 *   school_admin → /school-dashboard
 *   new student  → /onboarding
 *   returning    → /dashboard
 */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import {
  Loader2, Eye, EyeOff, Mail, Lock, User,
  BookOpen, Users, TrendingUp, ChevronLeft,
  GraduationCap, School, Building2, MapPin,
  Hash, CheckCircle, ArrowRight,
  Target, Rocket, Briefcase, Sparkles, Star,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

// Kembali ke halaman program setelah login. Pola dibatasi ketat supaya
// ?redirect= tidak bisa dipakai untuk mengarahkan ke situs lain.
const jalurKembali = (r: string | null) =>
  r && /^\/bootcamp\/[a-z0-9]+(-[a-z0-9]+)*$/.test(r) ? r : null;

const recordReferral = async (code: string, newUserId: string) => {
  const { data: refRow } = await supabase
    .from("referral_codes")
    .select("id, user_id, total_referrals")
    .eq("code", code).eq("is_active", true).maybeSingle();
  if (!refRow || newUserId === refRow.user_id) return;
  await supabase.from("referral_usage").insert({
    referral_code_id: refRow.id, referred_user_id: newUserId, commission_earned: 0,
  });
  // total_referrals & +100 XP untuk pengajak diberikan server (trigger proses_referral)
};

const generateSchoolCode = (name: string) => {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `TLK-${slug}-${rand}`;
};

// ─── shared input styles ──────────────────────────────────────────────────────
const iWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  border: "1.5px solid var(--tk-gray-200)", borderRadius: 12,
  padding: "12px 14px", background: "#fff", transition: "border-color .2s",
};
const iInner: React.CSSProperties = {
  flex: 1, border: "none", outline: "none",
  fontSize: 14, color: "var(--tk-ink)", background: "transparent",
  fontFamily: "var(--tk-font-sans)",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function InputField({
  icon, type = "text", placeholder, value, onChange, rightEl,
}: {
  icon: React.ReactNode; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; rightEl?: React.ReactNode;
}) {
  return (
    <div style={iWrap}>
      <span style={{ color: "var(--tk-gray-400)", flexShrink: 0 }}>{icon}</span>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} style={iInner} required />
      {rightEl}
    </div>
  );
}

function PrimaryBtn({ loading, children, onClick, style }: {
  loading?: boolean; children: React.ReactNode;
  onClick?: () => void; style?: React.CSSProperties;
}) {
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "14px 0", borderRadius: 13, border: "none",
        background: loading ? "var(--tk-gray-300)" : "var(--tk-blue-600)",
        color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700,
        fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,.28)",
        transition: "background .2s", ...style,
      }}>
      {loading ? <Loader2 size={17} className="animate-spin" /> : children}
    </button>
  );
}

function GoogleBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "13px 0", borderRadius: 13,
        border: "1.5px solid var(--tk-gray-200)", background: "#fff",
        fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14,
        color: "var(--tk-ink)", cursor: loading ? "not-allowed" : "pointer",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--tk-blue-300)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--tk-gray-200)")}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.8 29.3 36 24 36a12 12 0 0 1 0-24c3 0 5.7 1.1 7.8 2.9L38 8.7A20 20 0 1 0 24 44c11 0 20-8.9 20-20 0-1.3-.1-2.7-.4-4z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.8 2.9L38 8.7A20 20 0 0 0 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5L31 33.8A12 12 0 0 1 24 36c-5.2 0-9.7-3.3-11.3-8L6.1 33.3A20 20 0 0 0 24 44z"/>
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.3l6.5 5.2c3.8-3.5 6.2-8.7 6.2-14.5 0-1.3-.1-2.7-.4-4z"/>
      </svg>
      Masuk dengan Google
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
      <span style={{ fontSize: 12, color: "var(--tk-gray-400)", fontWeight: 500 }}>atau</span>
      <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
    </div>
  );
}

function Tabs({ tab, setTab, labels }: {
  tab: string; setTab: (t: any) => void;
  labels: { key: string; label: string }[];
}) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${labels.length}, 1fr)`,
      borderBottom: "2px solid var(--tk-gray-100)", marginBottom: 28,
    }}>
      {labels.map(({ key, label }) => (
        <button key={key} type="button" onClick={() => setTab(key)}
          style={{
            background: "none", border: "none", padding: "11px 0", cursor: "pointer",
            fontSize: 14.5, fontWeight: tab === key ? 700 : 500,
            fontFamily: "var(--tk-font-display)",
            color: tab === key ? "var(--tk-blue-600)" : "var(--tk-gray-400)",
            borderBottom: tab === key ? "2.5px solid var(--tk-blue-600)" : "2.5px solid transparent",
            marginBottom: -2, transition: "color .2s",
          }}>{label}</button>
      ))}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10,
      padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8,
    }}>
      <span style={{ color: "#DC2626", fontSize: 13 }}>⚠ {msg}</span>
    </div>
  );
}

// ─── LEFT PANEL (shared) ──────────────────────────────────────────────────────
function LeftPanel({ role }: { role: "individual" | "school" | null }) {
  const schoolProps = [
    { icon: <Building2 size={18} style={{ color: "var(--tk-blue-600)" }} />, bg: "var(--tk-blue-50)", title: "Dashboard Sekolah Terpadu", sub: "Pantau seluruh aktivitas siswa dari satu tempat" },
    { icon: <Users size={18} style={{ color: "var(--tk-orange)" }} />, bg: "var(--tk-orange-soft)", title: "Manajemen Siswa Mudah", sub: "Undang siswa via kode, kelola kelas & laporan" },
    { icon: <TrendingUp size={18} style={{ color: "var(--tk-green-dark)" }} />, bg: "var(--tk-mint)", title: "Laporan & Analitik Real-time", sub: "RIASEC distribution, progress, & engagement siswa" },
  ];
  const individualProps = [
    { icon: <BookOpen size={18} style={{ color: "var(--tk-blue-600)" }} />, bg: "var(--tk-blue-50)", title: "Tes Minat Bakat Gratis", sub: "RIASEC, MBTI, Multiple Intelligence — akurat & ilmiah" },
    { icon: <Users size={18} style={{ color: "var(--tk-orange)" }} />, bg: "var(--tk-orange-soft)", title: "Komunitas & Mentoring", sub: "Terhubung dengan ribuan pelajar & mentor inspiratif" },
    { icon: <TrendingUp size={18} style={{ color: "var(--tk-green-dark)" }} />, bg: "var(--tk-mint)", title: "Temukan Peluangmu", sub: "Beasiswa, magang, kompetisi — sesuai profilmu" },
  ];
  const props = role === "school" ? schoolProps : individualProps;
  const headline = role === "school"
    ? "Platform Terpadu untuk Sekolah & Institusi Pendidikan"
    : "Mulai perjalanan terbaikmu bersama Talentika✦";
  const sub = role === "school"
    ? "Kelola siswa, pantau perkembangan, dan jadikan bimbingan karier lebih efektif dengan data nyata."
    : "Platform pembelajaran terpadu yang membantu kamu menemukan potensi, mengembangkan skill, dan meraih impian.";

  return (
    <div style={{
      background: role === "school"
        ? "linear-gradient(135deg, #EFF6FF, #E0F2FE)"
        : "linear-gradient(135deg, #F1F5FB, #E8F1FF)",
      padding: "64px 56px",
      display: "flex", flexDirection: "column", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontFamily: "var(--tk-font-display)", fontSize: 30, fontWeight: 800, color: "var(--tk-blue-600)", letterSpacing: "-.02em" }}>
          Talentika✦
        </span>
        {role === "school" && (
          <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--tk-blue-400)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 2 }}>
            For Schools & Institutions
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: "var(--tk-font-display)", fontSize: 38, fontWeight: 800, color: "var(--tk-ink)", lineHeight: 1.2, maxWidth: "16ch", marginBottom: 16, letterSpacing: "-.02em" }}>
        {headline}
      </h1>
      <p style={{ maxWidth: "42ch", color: "var(--tk-gray-600)", fontSize: 14.5, lineHeight: 1.7, marginBottom: 36 }}>
        {sub}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {props.map(vp => (
          <div key={vp.title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: vp.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {vp.icon}
            </div>
            <div>
              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--tk-ink)" }}>{vp.title}</div>
              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 2 }}>{vp.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
        {(role === "school"
          ? [{ v: "500+", l: "Sekolah terdaftar" }, { v: "50K+", l: "Siswa terlayani" }, { v: "Gratis", l: "Untuk mulai" }]
          : [{ v: "12K+", l: "Pelajar aktif" }, { v: "500+", l: "Kursus tersedia" }, { v: "100%", l: "Gratis untuk mulai" }]
        ).map(({ v, l }) => (
          <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.65)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,.8)" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "var(--tk-blue-600)", lineHeight: 1.1 }}>{v}</div>
            <div style={{ fontSize: 11, color: "var(--tk-gray-600)", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Decorative */}
      <svg aria-hidden style={{ position: "absolute", bottom: -80, right: -80, width: 260, height: 260, opacity: .14, pointerEvents: "none" }} viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="130" fill="var(--tk-blue-600)" />
      </svg>
      <svg aria-hidden style={{ position: "absolute", top: 48, right: 56, width: 22, height: 22, opacity: .7 }} viewBox="0 0 22 22">
        <path d="M11 1 L12.5 9.5 L21 11 L12.5 12.5 L11 21 L9.5 12.5 L1 11 L9.5 9.5 Z" fill="var(--tk-yellow)" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 0 — ROLE SELECTOR  (fully responsive)
// ═══════════════════════════════════════════════════════════════════════════════
function RoleSelector({ onSelect }: { onSelect: (r: "individual" | "school") => void }) {
  const [hovered, setHovered] = useState<"individual" | "school" | null>(null);

  return (
    <div className="rs-root">
      <style>{`
        /* ── animations ── */
        @keyframes rs-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rs-floatA {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes rs-floatB {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(-4deg); }
        }

        /* ── layout ── */
        .rs-root {
          min-height: 100vh;
          display: flex;
          font-family: var(--tk-font-sans);
        }

        /* ── left decorative panel ── */
        .rs-left {
          width: 420px;
          flex-shrink: 0;
          background: linear-gradient(160deg, #1E3A8A 0%, #1D4ED8 45%, #2563EB 70%, #0EA5E9 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 44px 44px;
        }

        /* ── right selector panel ── */
        .rs-right {
          flex: 1;
          min-width: 0;
          background: #F8FAFD;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
        }

        /* ── inner content ── */
        .rs-inner {
          width: 100%;
          max-width: 500px;
          animation: rs-fadeUp .45s ease both;
        }

        /* ── cards ── */
        .rs-card {
          width: 100%;
          text-align: left;
          cursor: pointer;
          border-radius: 20px;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s, border-color .22s, background .22s;
        }
        .rs-card:hover  { transform: translateY(-4px) scale(1.012); }
        .rs-card:active { transform: translateY(0) scale(.985); }
        .rs-arrow { transition: transform .22s, opacity .22s; }
        .rs-card:hover .rs-arrow { transform: translateX(4px); opacity: 1 !important; }
        .rs-perk  { transition: background .18s, color .18s, border-color .18s; }
        .rs-jr-link { transition: color .18s; }
        .rs-jr-link:hover { color: #EA580C !important; }

        /* ── trust badges strip ── */
        .rs-trust {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
        }

        /* ═══ MOBILE (≤ 640px) ═══ */
        @media (max-width: 640px) {
          .rs-left { display: none !important; }

          .rs-right {
            padding: 0;
            align-items: flex-start;
            background: #fff;
          }

          .rs-inner {
            max-width: 100%;
            padding: 0;
            animation: none;
          }

          /* Mobile hero strip at top */
          .rs-mobile-hero {
            display: flex !important;
          }

          /* Content area padding on mobile */
          .rs-content-wrap {
            padding: 24px 20px 32px;
          }

          .rs-header { margin-bottom: 24px !important; }
          .rs-header h1 { font-size: 22px !important; }
          .rs-header p  { font-size: 13.5px !important; }

          .rs-cards-wrap { gap: 12px !important; margin-bottom: 20px !important; }

          /* Compact card on mobile */
          .rs-card { padding: 16px !important; gap: 14px !important; border-radius: 16px !important; }
          .rs-card-img { width: 52px !important; height: 52px !important; border-radius: 12px !important; }
          .rs-card-title { font-size: 14px !important; }
          .rs-card-sub   { font-size: 12px !important; margin-bottom: 10px !important; }
          .rs-perks { gap: 5px !important; }
          .rs-perk  { font-size: 10.5px !important; padding: 2px 8px !important; }

          .rs-trust { gap: 10px !important; }
          .rs-trust-item { font-size: 11px !important; }
        }

        /* ═══ TABLET (641px – 900px) ═══ */
        @media (min-width: 641px) and (max-width: 900px) {
          .rs-left { width: 300px; padding: 36px 28px; }
          .rs-left-feat-title { font-size: 12.5px !important; }
          .rs-left h2 { font-size: 26px !important; }
          .rs-left p  { font-size: 13px !important; }
          .rs-mobile-hero { display: none !important; }
          .rs-content-wrap { padding: 0; }
        }

        /* ═══ DESKTOP (> 900px) ═══ */
        @media (min-width: 901px) {
          .rs-mobile-hero { display: none !important; }
          .rs-content-wrap { padding: 0; }
        }
      `}</style>

      {/* ── LEFT PANEL (hidden on mobile) ──────────────────────────────────── */}
      <div className="rs-left">
        {/* Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={17} color="#fff" /></div>
            <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-.02em" }}>Talentika</span>
          </div>
          <h2 className="rs-left" style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 34, color: "#fff", lineHeight: 1.18, letterSpacing: "-.02em", margin: "0 0 14px", display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            <span>Temukan Potensi<br />Terbaikmu</span> <Sparkles size={24} color="#FFC107" style={{ marginTop: 6, flexShrink: 0 }} />
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,.75)", lineHeight: 1.75, maxWidth: "28ch", margin: "0 0 36px" }}>
            Platform bimbingan karier berbasis AI untuk pelajar Indonesia.
          </p>
        </div>

        {/* Feature mini-cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { Icon: Target, title: "Tes RIASEC Gratis",  sub: "Temukan tipe kepribadianmu" },
            { Icon: Rocket, title: "Rekomendasi AI",      sub: "Karier & jalur studi personal" },
            { Icon: Briefcase, title: "5.000+ Peluang",   sub: "Beasiswa, magang, kompetisi" },
          ].map((f, i) => (
            <div key={f.title} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,.10)", backdropFilter: "blur(8px)",
              borderRadius: 13, padding: "12px 14px", border: "1px solid rgba(255,255,255,.18)",
              animation: `rs-fadeUp .5s ease both`, animationDelay: `${.1 + i * .08}s`,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><f.Icon size={17} color="#fff" /></div>
              <div>
                <div className="rs-left-feat-title" style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: "13px", color: "#fff", marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.65)" }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 60, right: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 140, right: 28, animation: "rs-floatA 4s ease-in-out infinite", pointerEvents: "none", opacity: .55 }}><GraduationCap size={30} color="#fff" /></div>
        <div style={{ position: "absolute", top: 240, right: 52, animation: "rs-floatB 5s ease-in-out infinite", pointerEvents: "none", opacity: .6 }}><Star size={20} color="#FFC107" fill="#FFC107" /></div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="rs-right">
        <div className="rs-inner">

          {/* Mobile-only hero strip */}
          <div className="rs-mobile-hero" style={{
            display: "none",
            background: "linear-gradient(135deg, #1E3A8A, #2563EB, #0EA5E9)",
            padding: "28px 20px 24px",
            alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✦</div>
            <div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-.02em" }}>Talentika</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.7)", marginTop: 1 }}>Discover your full potential</div>
            </div>
          </div>

          {/* Selector content */}
          <div className="rs-content-wrap">

            {/* Header */}
            <div className="rs-header" style={{ marginBottom: 32 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                borderRadius: 99, padding: "4px 14px",
                fontSize: 11.5, fontWeight: 700, color: "#1D4ED8",
                letterSpacing: ".04em", textTransform: "uppercase" as const,
                marginBottom: 14,
              }}>
                ✦ Selamat Datang
              </div>
              <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "#0B1D3A", margin: "0 0 8px", letterSpacing: "-.02em", lineHeight: 1.22 }}>
                Kamu siapa?
              </h1>
              <p style={{ fontSize: "14px", color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                Pilih tipe akun untuk pengalaman yang paling sesuai.
              </p>
            </div>

            {/* Role cards */}
            <div className="rs-cards-wrap" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>

              {/* PELAJAR */}
              <button type="button" className="rs-card"
                onClick={() => onSelect("individual")}
                onMouseEnter={() => setHovered("individual")}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "20px 20px",
                  background: hovered === "individual" ? "#EFF6FF" : "#fff",
                  border: `2px solid ${hovered === "individual" ? "#2563EB" : "#E2E8F0"}`,
                  boxShadow: hovered === "individual" ? "0 12px 32px rgba(37,99,235,.13)" : "0 2px 10px rgba(0,0,0,.05)",
                }}>
                <div className="rs-card-img" style={{
                  width: 64, height: 64, borderRadius: 16, flexShrink: 0, overflow: "hidden",
                  border: `2.5px solid ${hovered === "individual" ? "#2563EB" : "#E2E8F0"}`,
                  boxShadow: hovered === "individual" ? "0 4px 16px rgba(37,99,235,.25)" : "0 1px 6px rgba(0,0,0,.08)",
                  transition: "border-color .22s, box-shadow .22s",
                }}>
                  <img src="/role-pelajar.png" alt="Pelajar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span className="rs-card-title" style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "#0B1D3A" }}>Pelajar / Mahasiswa</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1D4ED8", background: "#DBEAFE", padding: "2px 7px", borderRadius: 99, letterSpacing: ".04em", flexShrink: 0 }}>GRATIS</span>
                  </div>
                  <div className="rs-card-sub" style={{ fontSize: "12px", color: "#64748B", marginBottom: 12, lineHeight: 1.45 }}>
                    Siswa SMA, mahasiswa, & fresh graduate
                  </div>
                  <div className="rs-perks" style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["🎯 Tes RIASEC", "📚 Kursus", "💼 Peluang", "🤝 Mentoring"].map(p => (
                      <span key={p} className="rs-perk" style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                        color: hovered === "individual" ? "#1D4ED8" : "#475569",
                        background: hovered === "individual" ? "#DBEAFE" : "#F1F5F9",
                        border: `1px solid ${hovered === "individual" ? "#BFDBFE" : "#E2E8F0"}`,
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
                <ArrowRight size={17} className="rs-arrow"
                  style={{ color: hovered === "individual" ? "#2563EB" : "#CBD5E1", flexShrink: 0, marginTop: 4, opacity: hovered === "individual" ? 1 : .45 }} />
              </button>

              {/* SEKOLAH */}
              <button type="button" className="rs-card"
                onClick={() => onSelect("school")}
                onMouseEnter={() => setHovered("school")}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "20px 20px",
                  background: hovered === "school" ? "#F0F9FF" : "#fff",
                  border: `2px solid ${hovered === "school" ? "#0EA5E9" : "#E2E8F0"}`,
                  boxShadow: hovered === "school" ? "0 12px 32px rgba(14,165,233,.13)" : "0 2px 10px rgba(0,0,0,.05)",
                }}>
                <div className="rs-card-img" style={{
                  width: 64, height: 64, borderRadius: 16, flexShrink: 0, overflow: "hidden",
                  border: `2.5px solid ${hovered === "school" ? "#0EA5E9" : "#E2E8F0"}`,
                  boxShadow: hovered === "school" ? "0 4px 16px rgba(14,165,233,.25)" : "0 1px 6px rgba(0,0,0,.08)",
                  transition: "border-color .22s, box-shadow .22s",
                }}>
                  <img src="/role-sekolah.png" alt="Sekolah" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    <span className="rs-card-title" style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "#0B1D3A" }}>Sekolah / Institusi</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0284C7", background: "#E0F2FE", padding: "2px 7px", borderRadius: 99, letterSpacing: ".04em", flexShrink: 0 }}>FOR SCHOOLS</span>
                  </div>
                  <div className="rs-card-sub" style={{ fontSize: "12px", color: "#64748B", marginBottom: 12, lineHeight: 1.45 }}>
                    Guru BK, kepala sekolah, & institusi pendidikan
                  </div>
                  <div className="rs-perks" style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["📊 Dashboard", "🧠 RIASEC", "📋 Laporan BK", "👥 Kelas"].map(p => (
                      <span key={p} className="rs-perk" style={{
                        fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: 99,
                        color: hovered === "school" ? "#0284C7" : "#475569",
                        background: hovered === "school" ? "#E0F2FE" : "#F1F5F9",
                        border: `1px solid ${hovered === "school" ? "#BAE6FD" : "#E2E8F0"}`,
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
                <ArrowRight size={17} className="rs-arrow"
                  style={{ color: hovered === "school" ? "#0EA5E9" : "#CBD5E1", flexShrink: 0, marginTop: 4, opacity: hovered === "school" ? 1 : .45 }} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              <span style={{ fontSize: 12, color: "#94A3B8" }}>atau</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            </div>

            {/* Footer links */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0, textAlign: "center" as const }}>
                Sudah punya akun?{" "}
                <button type="button" onClick={() => onSelect("individual")}
                  style={{ background: "none", border: "none", color: "#2563EB", fontWeight: 700, cursor: "pointer", fontSize: "13px", padding: 0, textDecoration: "underline", textDecorationStyle: "dotted" as const, textUnderlineOffset: 2 }}>
                  Masuk sekarang
                </button>
              </p>
              <p style={{ fontSize: "12px", color: "#94A3B8", margin: 0, textAlign: "center" as const }}>
                Siswa SD–SMP?{" "}
                <Link to="/talentika-junior" className="rs-jr-link" style={{ color: "#F97316", fontWeight: 700, textDecoration: "none" }}>
                  Talentika Junior →
                </Link>
              </p>
            </div>

            {/* Trust badges */}
            <div className="rs-trust">
              {[
                { icon: "🔒", label: "Data Aman" },
                { icon: "✅", label: "100% Gratis" },
                { icon: "🏆", label: "12K+ Pelajar" },
              ].map(b => (
                <div key={b.label} className="rs-trust-item" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
                  <span style={{ fontSize: 13 }}>{b.icon}</span> {b.label}
                </div>
              ))}
            </div>
          </div>{/* end rs-content-wrap */}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function IndividualAuth({
  onBack, redirectTo, refCode,
}: { onBack: () => void; redirectTo: string | null; refCode: string | null }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fullName, setFullName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const afterLoginRedirect = async (userId: string, isNew = false) => {
    // Check role from profiles
    const { data: profile } = await supabase.from("profiles")
      .select("role").eq("user_id", userId).maybeSingle();
    if (profile?.role === "school_admin") { navigate("/school-dashboard"); return; }
    if (redirectTo === "talentika-junior") { navigate("/talentika-junior"); return; }
    const kembali = jalurKembali(redirectTo);
    if (kembali) { navigate(kembali); return; }
    if (isNew) { navigate("/onboarding"); return; }
    navigate("/dashboard");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          // school_code (optional) is linked server-side by the handle_new_user
          // trigger — atomic & RLS-timing proof even when email confirmation is on.
          data: {
            full_name: fullName, account_type: "individual", role: "student",
            ...(schoolCode.trim() ? { school_code: schoolCode.trim().toUpperCase() } : {}),
          },
        },
      });
      if (error) throw error;

      const savedRef = refCode || sessionStorage.getItem("referral_code");
      if (savedRef && data?.user?.id) {
        recordReferral(savedRef, data.user.id).catch(() => {});
        sessionStorage.removeItem("referral_code");
      }

      // Email sambutan dikirim saat login pertama (butuh sesi; server memastikan hanya sekali)

      sessionStorage.setItem("new_user_email", email);
      toast.success("Akun berhasil dibuat! Silakan login.");
      setTab("login");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        // Email sambutan: hanya ke alamat akun sendiri, sekali saja (dijaga server)
        supabase.functions.invoke("send-welcome-email", { body: {} }).catch(() => {});
        toast.success("Login berhasil!");
        const isNew = sessionStorage.getItem("new_user_email") === data.user.email;
        if (isNew) sessionStorage.removeItem("new_user_email");
        await afterLoginRedirect(data.user.id, isNew);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Login gagal: " + err.message);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Masukkan email kamu terlebih dahulu."); return; }
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Back + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, padding: 0 }}>
          <ChevronLeft size={16} /> Ganti tipe
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--tk-blue-50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>👤</div>
          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "var(--tk-blue-600)" }}>Pelajar / Mahasiswa</span>
        </div>
      </div>

      {forgotMode ? (
        /* ── Forgot password ── */
        <div>
          <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", marginBottom: 8 }}>Reset Password</h2>
          {forgotSent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ fontSize: 14, color: "var(--tk-gray-500)" }}>Link reset password sudah dikirim ke <strong>{email}</strong>. Cek inbox-mu!</p>
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); }}
                style={{ marginTop: 16, background: "none", border: "none", color: "var(--tk-blue-600)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                ← Kembali ke Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)" }}>Masukkan email-mu dan kami akan kirim link untuk reset password.</p>
              <ErrorBanner msg={error} />
              <InputField icon={<Mail size={16} />} type="email" placeholder="Email kamu" value={email} onChange={setEmail} />
              <PrimaryBtn loading={loading}>Kirim Link Reset</PrimaryBtn>
              <button type="button" onClick={() => setForgotMode(false)}
                style={{ background: "none", border: "none", color: "var(--tk-gray-400)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                ← Kembali ke Login
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          <Tabs tab={tab} setTab={t => { setTab(t); setError(""); }}
            labels={[{ key: "login", label: "Masuk" }, { key: "register", label: "Daftar Akun" }]} />
          <ErrorBanner msg={error} />

          {tab === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <GoogleBtn loading={loading} onClick={handleGoogle} />
              <Divider />
              <InputField icon={<Mail size={16} />} type="email" placeholder="Email kamu" value={email} onChange={setEmail} />
              <InputField icon={<Lock size={16} />} type={showPw ? "text" : "password"} placeholder="Password"
                value={password} onChange={setPassword}
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", padding: 0, display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                } />
              <div style={{ textAlign: "right" }}>
                <button type="button" onClick={() => { setForgotMode(true); setError(""); }}
                  style={{ background: "none", border: "none", color: "var(--tk-blue-600)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Lupa password?
                </button>
              </div>
              <PrimaryBtn loading={loading}>Masuk ke Akun <ArrowRight size={16} /></PrimaryBtn>
              <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--tk-gray-400)", margin: 0 }}>
                Belum punya akun?{" "}
                <button type="button" onClick={() => setTab("register")}
                  style={{ background: "none", border: "none", color: "var(--tk-blue-600)", fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>
                  Daftar gratis
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <GoogleBtn loading={loading} onClick={handleGoogle} />
              <Divider />
              <InputField icon={<User size={16} />} placeholder="Nama lengkap" value={fullName} onChange={setFullName} />
              <InputField icon={<Mail size={16} />} type="email" placeholder="Email kamu" value={email} onChange={setEmail} />
              <InputField icon={<Lock size={16} />} type={showPw ? "text" : "password"} placeholder="Buat password (min. 6 karakter)"
                value={password} onChange={setPassword}
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", padding: 0, display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                } />
              {/* School code optional */}
              <div style={{ ...iWrap, borderStyle: "dashed" }}>
                <Hash size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                <input type="text" placeholder="Kode sekolah (opsional)" value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value)} style={{ ...iInner, fontSize: 13.5 }} />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)", marginTop: -6 }}>
                Punya kode dari sekolahmu? Masukkan untuk terhubung ke dashboard sekolah.
              </div>
              <PrimaryBtn loading={loading}>Buat Akun Gratis <ArrowRight size={16} /></PrimaryBtn>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--tk-gray-400)", margin: 0 }}>
                Dengan mendaftar kamu menyetujui{" "}
                <a href="/terms" style={{ color: "var(--tk-blue-600)" }}>Syarat & Ketentuan</a>
                {" "}dan{" "}
                <a href="/privacy" style={{ color: "var(--tk-blue-600)" }}>Kebijakan Privasi</a>
              </p>
            </form>
          )}
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHOOL FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function SchoolAuth({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Register fields
  const [picName, setPicName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [schoolNpsn, setSchoolNpsn] = useState("");
  const [registered, setRegistered] = useState(false);
  const [newCode, setNewCode] = useState("");

  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const { data: profile } = await supabase.from("profiles")
          .select("role").eq("user_id", data.user.id).maybeSingle();
        if (profile?.role !== "school_admin") {
          await supabase.auth.signOut();
          throw new Error("Akun ini bukan akun sekolah. Gunakan login Pelajar.");
        }
        toast.success("Login berhasil!");
        navigate("/school-dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleSchoolRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picName || !schoolName || !schoolCity) {
      setError("Lengkapi semua data sekolah."); return;
    }
    setLoading(true); setError("");
    try {
      const code = generateSchoolCode(schoolName);
      // All school fields go into signUp metadata; the handle_new_user DB trigger
      // populates the profile + school_code atomically (server-side, RLS-timing proof).
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/school-dashboard`,
          data: {
            full_name: picName, account_type: "school", role: "school_admin",
            pic_name: picName, school_name: schoolName, school_city: schoolCity,
            school_npsn: schoolNpsn, school_code: code,
          },
        },
      });
      if (error) throw error;

      setNewCode(code);
      setRegistered(true);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <>
      {/* Back + badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, padding: 0 }}>
          <ChevronLeft size={16} /> Ganti tipe
        </button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🏫</div>
          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0EA5E9" }}>Sekolah / Institusi</span>
        </div>
      </div>

      {registered ? (
        /* ── Success ── */
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "var(--tk-ink)", marginBottom: 10 }}>Pendaftaran Berhasil!</h3>
          <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.7, marginBottom: 18 }}>
            Akun sekolah kamu sudah aktif. <strong>Kode sekolahmu sudah bisa langsung dipakai</strong> untuk mengundang siswa.
          </p>

          {/* Active school code */}
          <div style={{ background: "linear-gradient(135deg,#EFF6FF,#F0F9FF)", borderRadius: 14, padding: "16px 20px", border: "1.5px solid var(--tk-blue-200)", marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--tk-blue-600)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Kode Sekolahmu</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", letterSpacing: ".04em" }}>{newCode}</div>
          </div>

          <div style={{ background: "var(--tk-blue-50)", borderRadius: 14, padding: "16px 20px", border: "1px solid var(--tk-blue-200)", marginBottom: 20, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-blue-600)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Langkah Selanjutnya</div>
            {["Cek email & konfirmasi akun (jika diminta)", "Login ke Dashboard Sekolah", "Bagikan kode/link undangan ke siswa"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--tk-gray-600)", marginBottom: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--tk-blue-600)", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                {s}
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)", marginTop: 8, lineHeight: 1.5 }}>
              💡 Badge <strong>Terverifikasi</strong> akan muncul setelah tim Talentika memverifikasi NPSN sekolahmu.
            </div>
          </div>
          <button type="button" onClick={() => setTab("login")}
            style={{ background: "var(--tk-blue-600)", border: "none", borderRadius: 12, padding: "12px 28px", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Mengerti, Login Sekarang
          </button>
        </div>
      ) : (
        <>
          <Tabs tab={tab} setTab={t => { setTab(t); setError(""); }}
            labels={[{ key: "login", label: "Masuk" }, { key: "register", label: "Daftar Sekolah" }]} />
          <ErrorBanner msg={error} />

          {tab === "login" ? (
            <form onSubmit={handleSchoolLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#F0F9FF", borderRadius: 12, padding: "12px 16px", border: "1px solid #BAE6FD", fontSize: 13, color: "#0369A1", lineHeight: 1.6 }}>
                🔐 Login khusus untuk akun <strong>Sekolah & Institusi</strong>. Pelajar silakan gunakan tab Pelajar.
              </div>
              <InputField icon={<Mail size={16} />} type="email" placeholder="Email institusi" value={email} onChange={setEmail} />
              <InputField icon={<Lock size={16} />} type={showPw ? "text" : "password"} placeholder="Password"
                value={password} onChange={setPassword}
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", padding: 0, display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                } />
              <PrimaryBtn loading={loading} style={{ background: "#0EA5E9" }}>
                Masuk ke Dashboard Sekolah <ArrowRight size={16} />
              </PrimaryBtn>
              <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--tk-gray-400)", margin: 0 }}>
                Sekolah belum terdaftar?{" "}
                <button type="button" onClick={() => setTab("register")}
                  style={{ background: "none", border: "none", color: "#0EA5E9", fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>
                  Daftar sekolah gratis
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSchoolRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)", marginBottom: 4, lineHeight: 1.6 }}>
                Daftarkan sekolah kamu. Kode sekolah akan dikirim setelah verifikasi tim Talentika.
              </div>
              <InputField icon={<User size={16} />} placeholder="Nama PIC / Guru BK" value={picName} onChange={setPicName} />
              <InputField icon={<School size={16} />} placeholder="Nama sekolah / institusi" value={schoolName} onChange={setSchoolName} />
              <InputField icon={<MapPin size={16} />} placeholder="Kota / kabupaten" value={schoolCity} onChange={setSchoolCity} />
              <InputField icon={<Hash size={16} />} placeholder="NPSN (opsional)" value={schoolNpsn} onChange={setSchoolNpsn} />
              <InputField icon={<Mail size={16} />} type="email" placeholder="Email institusi" value={email} onChange={setEmail} />
              <InputField icon={<Lock size={16} />} type={showPw ? "text" : "password"} placeholder="Buat password (min. 6 karakter)"
                value={password} onChange={setPassword}
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-400)", padding: 0, display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                } />
              <PrimaryBtn loading={loading} style={{ background: "#0EA5E9" }}>
                Daftarkan Sekolah <ArrowRight size={16} />
              </PrimaryBtn>
            </form>
          )}
        </>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Auth = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect");
  const refCode    = urlParams.get("ref");
  if (refCode) sessionStorage.setItem("referral_code", refCode);

  // role: null = show selector, "individual" or "school" = show that flow
  const [role, setRole] = useState<null | "individual" | "school">(null);

  // Pre-select from URL param: /auth?role=school
  useEffect(() => {
    const r = urlParams.get("role");
    if (r === "school") setRole("school");
    else if (r === "individual") setRole("individual");
    if (urlParams.get("mode") === "register") setRole("individual");
  }, []);

  // Redirect already-logged-in users
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase.from("profiles")
        .select("role").eq("user_id", session.user.id).maybeSingle();
      if (profile?.role === "school_admin") { navigate("/school-dashboard"); return; }
      navigate(redirectTo === "talentika-junior" ? "/talentika-junior" : jalurKembali(redirectTo) ?? "/dashboard");
    });
  }, [navigate, redirectTo]);

  // ── Step 0: Role selector (full-screen, no left panel) ──
  if (role === null) {
    return (
      <>
        <SEO title="Masuk atau Daftar — Talentika" description="Login atau buat akun Talentika gratis untuk pelajar, mahasiswa, dan sekolah." noindex />
        <RoleSelector onSelect={setRole} />
      </>
    );
  }

  // ── Step 1: Show left panel + right form ──
  return (
    <>
      <SEO title={role === "school" ? "Login Sekolah — Talentika" : "Masuk atau Daftar — Talentika"}
        description="Login atau buat akun Talentika." noindex />

      <div className="auth-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <style>{`
          @media (max-width: 768px) {
            .auth-grid { grid-template-columns: 1fr !important; }
            .auth-left  { display: none !important; }
            .auth-right { padding: 28px 20px !important; }
          }
        `}</style>

        {/* LEFT */}
        <div className="auth-left">
          <LeftPanel role={role} />
        </div>

        {/* RIGHT */}
        <div className="auth-right" style={{ background: "var(--tk-gray-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "36px 36px", width: "100%", maxWidth: 520, boxShadow: "0 8px 40px rgba(0,0,0,.09)" }}>
            {role === "individual"
              ? <IndividualAuth onBack={() => setRole(null)} redirectTo={redirectTo} refCode={refCode} />
              : <SchoolAuth onBack={() => setRole(null)} />
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
