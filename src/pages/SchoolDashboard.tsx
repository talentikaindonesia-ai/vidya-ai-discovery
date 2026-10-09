import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolData, SchoolStudent, SchoolOverview, RiasecSlice, SchoolActivity, RiasecByClass, CareerRec, SchoolCourse, SchoolAnnouncement } from "@/hooks/useSchoolData";

/* ── Design tokens ────────────────────────────────────────────────────── */
const C = {
  blue: "#1D4ED8", blue2: "#2563EB", blue50: "#EEF3FF", blue100: "#DBEAFE", blue200: "#BFDBFE",
  green: "#10B981", greenSoft: "#ECFDF5", greenDark: "#059669",
  orange: "#F97316", orangeSoft: "#FFF7ED",
  purple: "#8B5CF6", purpleSoft: "#F5F3FF",
  yellow: "#F59E0B", yellowSoft: "#FFFBEB",
  red: "#EF4444", redSoft: "#FEF2F2",
  cyan: "#06B6D4", cyanSoft: "#ECFEFF",
  ink: "#0F172A", ink2: "#1E293B",
  gray50: "#F8FAFC", gray100: "#F1F5F9", gray200: "#E2E8F0",
  gray300: "#CBD5E1", gray400: "#94A3B8", gray500: "#64748B",
  gray600: "#475569", gray700: "#334155", white: "#FFFFFF",
};
const D = "'Poppins', system-ui, sans-serif";
const S = "'Inter', system-ui, sans-serif";

type Sec = "dashboard" | "siswa" | "peringkat" | "kursus" | "mentoring" | "asesmen" | "laporan" | "pengumuman" | "pengaturan";

/* ── Static helpers ───────────────────────────────────────────────────── */
const MONTHS   = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];
const DONUT    = [
  { label:"Teknologi", pct:40, color:C.blue   },
  { label:"Bisnis",    pct:25, color:C.orange  },
  { label:"Desain",    pct:20, color:C.purple  },
  { label:"P. Diri",  pct:15, color:C.green   },
];

/* ── Icons ────────────────────────────────────────────────────────────── */
const IcoHome = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15"/></svg>;
const IcoUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoBook = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const IcoChat = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
const IcoClip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>;
const IcoChart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoBell = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
const IcoCog  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const IcoOut  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoStar = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IcoPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcoDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoCheck= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const IcoTrophy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>;

const NAV: { id: Sec; label: string; Icon: () => JSX.Element }[] = [
  { id:"dashboard",   label:"Dashboard",   Icon:IcoHome  },
  { id:"siswa",       label:"Siswa",       Icon:IcoUsers },
  { id:"peringkat",   label:"Peringkat",   Icon:IcoTrophy },
  { id:"kursus",      label:"Kursus",      Icon:IcoBook  },
  { id:"mentoring",   label:"Mentoring",   Icon:IcoChat  },
  { id:"asesmen",     label:"Asesmen",     Icon:IcoClip  },
  { id:"laporan",     label:"Laporan",     Icon:IcoChart },
  { id:"pengumuman",  label:"Pengumuman",  Icon:IcoBell  },
  { id:"pengaturan",  label:"Pengaturan",  Icon:IcoCog   },
];

const PAGE_TITLES: Record<Sec, string> = {
  dashboard:  "Dashboard Sekolah",
  siswa:      "Manajemen Siswa",
  peringkat:  "Peringkat Siswa",
  kursus:     "Katalog Kursus",
  mentoring:  "Program Mentoring",
  asesmen:    "Asesmen & Potensi",
  laporan:    "Laporan & Analitik",
  pengumuman: "Pengumuman",
  pengaturan: "Pengaturan Sekolah",
};

/* ── Small helpers ────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, subColor, subBg, icon, iconBg, iconColor }: {
  label: string; value: string; sub: string; subColor: string; subBg: string;
  icon: JSX.Element; iconBg: string; iconColor: string;
}) {
  return (
    <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ width:44, height:44, borderRadius:13, background:iconBg, color:iconColor, display:"grid", placeItems:"center", flexShrink:0 }}>{icon}</div>
        <span style={{ fontSize:12, color:subColor, fontWeight:600, background:subBg, padding:"3px 9px", borderRadius:99, fontFamily:S }}>{sub}</span>
      </div>
      <div style={{ fontFamily:D, fontWeight:800, fontSize:30, color:C.ink, margin:"10px 0 4px", letterSpacing:"-.02em" }}>{value}</div>
      <div style={{ fontSize:13, color:C.gray500, fontFamily:S }}>{label}</div>
    </div>
  );
}

function ProgressBar({ value, color = C.blue }: { value: number; color?: string }) {
  return (
    <div style={{ width:"100%", height:6, borderRadius:99, background:C.gray100, overflow:"hidden" }}>
      <div style={{ width:`${value}%`, height:"100%", borderRadius:99, background:color, transition:"width .4s" }} />
    </div>
  );
}

/* ── SVG Line Chart ───────────────────────────────────────────────────── */
function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 500, H = 120, padX = 12, padY = 10;
  const min = Math.min(...data) * 0.88;
  const max = Math.max(...data) * 1.06;
  const span = (max - min) || 1; // guard against flat/all-zero series
  const denom = (data.length - 1) || 1;
  const pts = data.map((v, i) => ({
    x: padX + (i / denom) * (W - padX * 2),
    y: padY + (1 - (v - min) / span) * (H - padY * 2),
  }));
  const pathD = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:H, display:"block" }}>
      <defs>
        <linearGradient id="lgChart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.blue2} stopOpacity=".18" />
          <stop offset="100%" stopColor={C.blue2} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25,0.5,0.75,1].map(t => (
        <line key={t} x1={padX} x2={W-padX}
          y1={padY + t*(H-padY*2)} y2={padY + t*(H-padY*2)}
          stroke={C.gray200} strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#lgChart)" />
      <path d={pathD} fill="none" stroke={C.blue2} strokeWidth="2.2" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={C.white} stroke={C.blue2} strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={pts[i].x} y={H-1} textAnchor="middle" fontSize="9" fill={C.gray400} fontFamily={S}>{l}</text>
      ))}
    </svg>
  );
}

/* ── SVG Donut Chart ──────────────────────────────────────────────────── */
function DonutChart({ segments }: { segments: typeof DONUT }) {
  const r = 46, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(s => {
    const dash = (s.pct / 100) * circ;
    const arc = { dash, offset, color: s.color };
    offset += dash;
    return arc;
  });
  return (
    <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink:0 }}>
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={a.color} strokeWidth="14"
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.offset + circ * 0.25}
            style={{ transition:"all .5s" }} />
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} fontFamily={D}>Top</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.ink} fontFamily={D}>Kategori</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }} />
            <span style={{ fontSize:12.5, color:C.gray700, fontFamily:S }}>{s.label}</span>
            <span style={{ fontSize:12.5, fontWeight:700, color:C.ink, fontFamily:D, marginLeft:"auto", paddingLeft:8 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Verified badge ───────────────────────────────────────────────────── */
function VerifiedBadge({ size = 13 }: { size?: number }) {
  return (
    <span title="Sekolah terverifikasi NPSN" style={{ display:"inline-flex", alignItems:"center", flexShrink:0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill={C.blue2} aria-label="Terverifikasi">
        <path d="M12 1l2.4 2.1 3.2-.3 1 3 2.9 1.3-1 3 1 3-2.9 1.3-1 3-3.2-.3L12 23l-2.4-2.1-3.2.3-1-3L2.5 17l1-3-1-3 2.9-1.3 1-3 3.2.3L12 1z"/>
        <path d="M10.6 14.6l-2.2-2.2-1.2 1.2 3.4 3.4 6-6-1.2-1.2-4.8 4.8z" fill="#fff"/>
      </svg>
    </span>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ sec, setSec, collapsed, onCollapse, schoolName, verified, onSignOut, mobileOpen, onNavClose }:{
  sec:Sec; setSec:(s:Sec)=>void; collapsed:boolean; onCollapse:(v:boolean)=>void;
  schoolName:string; verified:boolean; onSignOut:()=>void;
  mobileOpen:boolean; onNavClose:()=>void;
}) {
  const W = collapsed ? 68 : 240;
  return (
    <aside className={"sd-sidebar" + (mobileOpen ? " sd-open" : "")} style={{
      width:W, minHeight:"100vh", background:C.white,
      borderRight:`1px solid ${C.gray200}`, display:"flex", flexDirection:"column",
      flexShrink:0, transition:"width .25s cubic-bezier(.4,0,.2,1)", overflow:"hidden",
      position:"sticky", top:0, height:"100vh",
    }}>
      {/* Logo */}
      <div style={{ padding:"18px 14px 14px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${C.gray100}`, minHeight:68 }}>
        <img src="/logo.png" alt="Talentika" style={{ width:40, height:40, objectFit:"contain", borderRadius:10, flexShrink:0 }} />
        {!collapsed && (
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontFamily:D, fontWeight:800, fontSize:16, color:C.ink, whiteSpace:"nowrap" }}>Talentika</div>
            <div style={{ fontSize:10.5, color:C.gray400, whiteSpace:"nowrap" }}>for Schools</div>
          </div>
        )}
        <button onClick={() => onCollapse(!collapsed)}
          style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:C.gray400, padding:4, borderRadius:8, flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {collapsed
              ? <><path d="M9 18l6-6-6-6"/></>
              : <><path d="M15 18l-6-6 6-6"/></>}
          </svg>
        </button>
      </div>

      {/* School info */}
      {!collapsed && (
        <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.gray100}` }}>
          <div style={{ background:C.blue50, borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, display:"grid", placeItems:"center", flexShrink:0, fontFamily:D, fontWeight:800, fontSize:13, color:C.white }}>
              {schoolName.slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontFamily:D, fontWeight:700, fontSize:12.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:118 }}>{schoolName}</span>
                {verified && <VerifiedBadge />}
              </div>
              <div style={{ fontSize:11, color:C.blue2 }}>{verified ? "Terverifikasi" : "Admin Sekolah"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        {NAV.map(item => {
          const active = sec === item.id;
          return (
            <button key={item.id} onClick={() => { setSec(item.id); onNavClose(); }}
              title={collapsed ? item.label : undefined}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:collapsed?"10px":"10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius:10, border:"none", cursor:"pointer", transition:"all .15s",
                background: active ? C.blue50 : "transparent",
                color: active ? C.blue2 : C.gray600,
                fontFamily:D, fontWeight: active ? 700 : 500, fontSize:14, width:"100%",
              }}>
              <span style={{ flexShrink:0 }}><item.Icon /></span>
              {!collapsed && <span style={{ whiteSpace:"nowrap" }}>{item.label}</span>}
              {!collapsed && active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.blue2 }} />}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{ padding:"10px", borderTop:`1px solid ${C.gray100}` }}>
        <button onClick={onSignOut}
          title={collapsed ? "Keluar" : undefined}
          style={{
            display:"flex", alignItems:"center", gap:12, padding:collapsed?"10px":"10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius:10, border:"none", cursor:"pointer",
            background:"transparent", color:C.gray500, width:"100%",
            fontFamily:D, fontWeight:500, fontSize:14, transition:"all .15s",
          }}>
          <IcoOut />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

/* ── TopBar ───────────────────────────────────────────────────────────── */
function TopBar({ sec, schoolName, userInitials, verified, onMenu }: { sec: Sec; schoolName: string; userInitials: string; verified: boolean; onMenu: () => void }) {
  const today = new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  return (
    <header className="sd-topbar" style={{ background:C.white, borderBottom:`1px solid ${C.gray200}`, padding:"0 28px", height:64, display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:10 }}>
      <button className="sd-hamburger" onClick={onMenu} aria-label="Buka menu"
        style={{ width:38, height:38, borderRadius:10, background:C.gray50, border:`1px solid ${C.gray200}`, placeItems:"center", cursor:"pointer", color:C.gray700, flexShrink:0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink, letterSpacing:"-.01em" }}>{PAGE_TITLES[sec]}</div>
        <div style={{ fontSize:12, color:C.gray400, fontFamily:S }}>{today}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button style={{ width:38, height:38, borderRadius:10, background:C.gray50, border:`1px solid ${C.gray200}`, display:"grid", placeItems:"center", cursor:"pointer", color:C.gray600, position:"relative" }}>
          <IcoBell />
          <span style={{ position:"absolute", top:8, right:8, width:7, height:7, borderRadius:"50%", background:C.red, border:`1.5px solid ${C.white}` }} />
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 12px 6px 6px", borderRadius:12, background:C.gray50, border:`1px solid ${C.gray200}` }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:12, color:C.white }}>
            {userInitials}
          </div>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontFamily:D, fontWeight:700, fontSize:12.5, color:C.ink }}>{schoolName}</span>
              {verified && <VerifiedBadge size={12} />}
            </div>
            <div style={{ fontSize:11, color:C.gray400 }}>{verified ? "Terverifikasi NPSN" : "Admin Sekolah"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: DASHBOARD
════════════════════════════════════════════════════════════════════════ */
function InviteBanner({ schoolCode, schoolName }: { schoolCode: string | null; schoolName: string }) {
  const [copied, setCopied] = useState(false);
  const link = schoolCode ? `${window.location.origin}/join/${schoolCode}` : null;

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = () => {
    if (!link) return;
    const text = `Hai! Bergabunglah ke dashboard sekolah kita di Talentika: ${link}`;
    if (navigator.share) navigator.share({ title: "Talentika — Undangan Sekolah", text, url: link });
    else { navigator.clipboard.writeText(text); }
  };

  if (!schoolCode) return (
    <div style={{ background:"#FFF7ED", border:"1.5px dashed #FED7AA", borderRadius:16, padding:"18px 22px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ fontSize:28 }}>⏳</div>
      <div>
        <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:"#92400E", marginBottom:2 }}>Kode Sekolah Belum Tersedia</div>
        <div style={{ fontSize:12.5, color:"#B45309" }}>Tim Talentika sedang memverifikasi sekolahmu. Kode akan muncul di sini setelah verifikasi selesai (1×24 jam).</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"linear-gradient(135deg,#EFF6FF,#F0F9FF)", border:"1.5px solid #BFDBFE", borderRadius:16, padding:"18px 22px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      <div style={{ width:44, height:44, borderRadius:13, background:C.blue50, border:`1.5px solid ${C.blue200}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔗</div>
      <div style={{ flex:1, minWidth:200 }}>
        <div style={{ fontFamily:D, fontWeight:800, fontSize:14, color:C.blue, marginBottom:3 }}>Undang Siswa ke {schoolName}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", borderRadius:10, border:`1px solid ${C.blue200}`, padding:"7px 12px", width:"fit-content" }}>
          <code style={{ fontFamily:"'Courier New', monospace", fontSize:13, fontWeight:700, color:C.ink, letterSpacing:".05em" }}>{link}</code>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
        <button onClick={copy}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:`1.5px solid ${C.blue200}`, background:copied?"var(--tk-mint)":"white", color:copied?C.greenDark:C.blue2, fontFamily:D, fontWeight:700, fontSize:12.5, cursor:"pointer", transition:"all .2s" }}>
          {copied ? "✓ Disalin!" : "📋 Salin Link"}
        </button>
        <button onClick={share}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, border:"none", background:C.blue2, color:"white", fontFamily:D, fontWeight:700, fontSize:12.5, cursor:"pointer" }}>
          📤 Bagikan
        </button>
      </div>
      <div style={{ width:"100%", fontSize:11.5, color:C.gray400 }}>
        Kode sekolah: <strong style={{ color:C.blue2 }}>{schoolCode}</strong> · Siswa bisa bergabung via link atau input kode saat daftar
      </div>
    </div>
  );
}

/* ── Overview helpers ─────────────────────────────────────────────────── */
// Blue/cyan/indigo family — on-brand but slices stay distinguishable
const RIASEC_COLORS: Record<string, string> = {
  investigative: "#1D4ED8", social: "#2563EB", artistic: "#3B82F6",
  conventional: "#0EA5E9", enterprising: "#06B6D4", realistic: "#6366F1",
};
const riasecShort = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Multiple Intelligence (Gardner) — labels + purple-family palette (MI = purple app-wide)
const MI_LABEL: Record<string, string> = {
  linguistic: "Linguistik", logical: "Logis-Matematis", spatial: "Spasial-Visual",
  musical: "Musikal", kinesthetic: "Kinestetik", interpersonal: "Interpersonal",
  intrapersonal: "Intrapersonal", naturalistic: "Naturalis",
};
const MI_COLORS: Record<string, string> = {
  linguistic: "#8B5CF6", logical: "#7C3AED", spatial: "#A855F7",
  musical: "#C026D3", kinesthetic: "#6366F1", interpersonal: "#9333EA",
  intrapersonal: "#7E22CE", naturalistic: "#D946EF",
};
const miLabel = (t: string) => MI_LABEL[t] || (t.charAt(0).toUpperCase() + t.slice(1));
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function OverviewSection({ schoolCode, schoolName, overview, riasec, activity, loading, onNavigate }: {
  schoolCode: string | null; schoolName: string;
  overview: SchoolOverview | null; riasec: RiasecSlice[]; activity: SchoolActivity[]; loading: boolean;
  onNavigate: (s: Sec) => void;
}) {
  const dash = (v: number | undefined) => (loading ? "…" : (v ?? 0).toLocaleString("id-ID"));
  const monthlyHours  = overview?.monthly_hours ?? [0,0,0,0,0,0];
  const monthlyLabels = overview?.monthly_labels ?? MONTHS;
  const donutSegments = riasec.map(r => ({
    label: riasecShort(r.riasec_type), pct: r.pct, color: RIASEC_COLORS[r.riasec_type] || C.blue2,
  }));

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Invite banner */}
      <InviteBanner schoolCode={schoolCode} schoolName={schoolName} />

      {/* KPI cards */}
      <div className="sd-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Siswa Aktif" value={dash(overview?.active_students)} sub={loading ? "—" : `+${overview?.new_students_month ?? 0} bulan ini`} subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoUsers />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Kursus Diikuti" value={dash(overview?.courses_enrolled)} sub="enrollment" subColor={C.blue2} subBg={C.blue50}
          icon={<IcoBook />} iconBg={C.purpleSoft} iconColor={C.purple} />
        <StatCard label="Jam Belajar" value={dash(overview?.study_hours)} sub="kumulatif" subColor={C.orange} subBg={C.orangeSoft}
          icon={<IcoChart />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Sertifikat" value={dash(overview?.certificates)} sub="diterbitkan" subColor={C.yellow} subBg={C.yellowSoft}
          icon={<IcoClip />} iconBg={C.yellowSoft} iconColor={C.yellow} />
      </div>

      {/* Charts row */}
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        {/* Line chart */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Progress Belajar Siswa</div>
              <div style={{ fontSize:12, color:C.gray400, fontFamily:S }}>Total jam belajar per bulan</div>
            </div>
            <div style={{ fontSize:12.5, fontFamily:D, fontWeight:700, color:C.blue2, background:C.blue50, padding:"5px 12px", borderRadius:99 }}>{new Date().getFullYear()}</div>
          </div>
          <LineChart data={monthlyHours} labels={monthlyLabels} />
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            {monthlyHours.map((v, i) => (
              <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.ink, fontFamily:D }}>{v}</div>
                <div style={{ fontSize:10, color:C.gray400 }}>{monthlyLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart — real RIASEC distribution */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi RIASEC</div>
          <div style={{ fontSize:12, color:C.gray400, fontFamily:S, marginBottom:18 }}>Tipe kepribadian siswa</div>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments} />
            : <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontFamily:S, fontSize:13 }}>{loading ? "Memuat…" : "Belum ada hasil asesmen"}</div>}
        </div>
      </div>

      {/* Activity + Quick actions */}
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16 }}>
        {/* Activity */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Aktivitas Terbaru</div>
          {activity.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontFamily:S, fontSize:13 }}>
              {loading ? "Memuat…" : "Belum ada aktivitas belajar"}
            </div>
          ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:12, borderBottom: i<activity.length-1?`1px solid ${C.gray100}`:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:gradientFor(a.name), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:13, color:C.white, flexShrink:0 }}>{initialsOf(a.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontFamily:S }}>
                    <b style={{ color:C.ink, fontWeight:600 }}>{a.name}</b>
                    <span style={{ color:C.gray500 }}> {a.action} </span>
                    <b style={{ color:C.blue2 }}>{a.item}</b>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.gray400, fontFamily:S, flexShrink:0 }}>{timeAgo(a.ts)}</div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Aksi Cepat</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Buat Pengumuman",     bg:C.blue50,      fg:C.blue2,    icon:<IcoBell />, to:"pengumuman" as Sec },
              { label:"Lihat Laporan",       bg:C.greenSoft,   fg:C.greenDark,icon:<IcoDown />, to:"laporan" as Sec },
              { label:"Asesmen & Potensi",   bg:C.purpleSoft,  fg:C.purple,   icon:<IcoClip />, to:"asesmen" as Sec },
              { label:"Katalog Kursus",      bg:C.orangeSoft,  fg:C.orange,   icon:<IcoBook />, to:"kursus" as Sec },
            ].map((a, i) => (
              <button key={i} onClick={() => onNavigate(a.to)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, background:a.bg, border:"none", cursor:"pointer", textAlign:"left", transition:"filter .15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.filter="brightness(.96)"}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.filter="none"}>
                <div style={{ width:32, height:32, borderRadius:9, background:a.fg, color:C.white, display:"grid", placeItems:"center", flexShrink:0 }}>{a.icon}</div>
                <span style={{ fontFamily:D, fontWeight:600, fontSize:13.5, color:a.fg }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Student helpers ──────────────────────────────────────────────────── */
const GRADIENTS = [
  "linear-gradient(135deg,#3B82F6,#1D4ED8)", "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#8B5CF6,#7C3AED)", "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#F97316,#EA580C)", "linear-gradient(135deg,#EC4899,#DB2777)",
  "linear-gradient(135deg,#06B6D4,#0891B2)", "linear-gradient(135deg,#6366F1,#4F46E5)",
];
function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "S";
}
function gradientFor(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}
const RIASEC_LABEL: Record<string, string> = {
  realistic: "Realistic (Doer)", investigative: "Investigative (Thinker)",
  artistic: "Artistic (Creator)", social: "Social (Helper)",
  enterprising: "Enterprising (Persuader)", conventional: "Conventional (Organizer)",
};
const riasecLabel = (t: string | null) => (t ? RIASEC_LABEL[t] || t : "Belum tes");

/* ════════════════════════════════════════════════════════════════════════
   SECTION: SISWA
════════════════════════════════════════════════════════════════════════ */
function SiswaSection({ students, loading }: { students: SchoolStudent[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"active"|"inactive">("all");
  const [kelas, setKelas]   = useState("Semua");
  const [selected, setSelected] = useState<SchoolStudent | null>(null);

  const classes = useMemo(
    () => ["Semua", ...Array.from(new Set(students.map(s => s.class_label).filter(Boolean) as string[])).sort()],
    [students]
  );

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const match = s.name.toLowerCase().includes(q) || (s.class_label || "").toLowerCase().includes(q);
    const statusOk = filter === "all" || (filter === "active" ? s.status === "active" : s.status !== "active");
    const classOk  = kelas === "Semua" || s.class_label === kelas;
    return match && statusOk && classOk;
  });

  // Stats from real data
  const total      = students.length;
  const activeCnt  = students.filter(s => s.status === "active").length;
  const totalCerts = students.reduce((a, s) => a + (s.certs || 0), 0);
  const avgHours   = total ? (students.reduce((a, s) => a + Number(s.hours || 0), 0) / total) : 0;

  // Engagement signals — the "are my students actually using it?" answer
  const startedLearning = students.filter(s => (s.courses || 0) > 0).length;
  const activeWeek = students.filter(s => s.last_active && (Date.now() - new Date(s.last_active).getTime()) / 86400000 <= 7).length;
  const dormant = total - startedLearning;

  const exportCsv = () => {
    const head = ["Nama","Kelas","Status","Kursus","Selesai","Jam","Sertifikat","XP","Level","Streak","RIASEC","Progress%","Terakhir Aktif"];
    const rows = filtered.map(s => [
      s.name, s.class_label || "", s.status, s.courses, s.completed, s.hours, s.certs, s.xp, s.level, s.streak,
      s.riasec_type || "", s.progress, s.last_active ? new Date(s.last_active).toISOString().slice(0,10) : "",
    ]);
    const csv = [head, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `siswa-talentika-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div className="sd-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Total Siswa" value={loading ? "…" : total.toLocaleString("id-ID")} sub="terhubung" subColor={C.blue2} subBg={C.blue50}
          icon={<IcoUsers />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Siswa Aktif" value={loading ? "…" : activeCnt.toLocaleString("id-ID")} sub={total ? `${Math.round(activeCnt/total*100)}% dari total` : "—"} subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoCheck />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Sertifikat Diraih" value={loading ? "…" : totalCerts.toLocaleString("id-ID")} sub="total" subColor={C.orange} subBg={C.orangeSoft}
          icon={<IcoStar />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Rata-rata Jam" value={loading ? "…" : `${avgHours.toFixed(1)} jam`} sub="per siswa" subColor={C.purple} subBg={C.purpleSoft}
          icon={<IcoChart />} iconBg={C.purpleSoft} iconColor={C.purple} />
      </div>

      {/* Engagement summary — who is actually learning */}
      {!loading && total > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", background:C.white, borderRadius:14, border:`1px solid ${C.gray200}`, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <span style={{ fontSize:20 }}>📊</span>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.ink }}>Keterlibatan Belajar</div>
            <div style={{ fontSize:12, color:C.gray500, marginTop:1 }}>
              <b style={{ color:C.blue2 }}>{startedLearning}</b> dari {total} siswa sudah mulai belajar
              {activeWeek > 0 && <> · <b style={{ color:C.greenDark }}>{activeWeek}</b> aktif 7 hari terakhir</>}
              {dormant > 0 && <> · <b style={{ color:C.orange }}>{dormant}</b> belum mulai</>}
            </div>
          </div>
          {/* mini progress of participation */}
          <div style={{ width:140, maxWidth:"40vw" }}>
            <div style={{ height:8, borderRadius:99, background:C.gray100, overflow:"hidden" }}>
              <div style={{ width:`${total ? Math.round(startedLearning/total*100) : 0}%`, height:"100%", borderRadius:99, background:`linear-gradient(90deg,${C.blue2},${C.cyan})` }} />
            </div>
            <div style={{ fontSize:11, color:C.gray500, marginTop:4, textAlign:"right" }}>{total ? Math.round(startedLearning/total*100) : 0}% partisipasi</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        {/* Toolbar */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.gray100}`, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.gray400 }}><IcoSearch /></span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cari nama atau kelas siswa..."
              style={{ width:"100%", padding:"9px 14px 9px 36px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:13.5, color:C.ink, outline:"none", background:C.gray50, boxSizing:"border-box" }} />
          </div>
          {classes.length > 1 && (
            <select value={kelas} onChange={e=>setKelas(e.target.value)}
              style={{ padding:"9px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:D, fontWeight:600, fontSize:12.5, color:C.gray700, background:C.white, cursor:"pointer", outline:"none" }}>
              {classes.map(c => <option key={c} value={c}>{c === "Semua" ? "Semua Kelas" : c}</option>)}
            </select>
          )}
          <div style={{ display:"flex", gap:6 }}>
            {(["all","active","inactive"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${filter===f ? C.blue2 : C.gray200}`, background:filter===f?C.blue50:"transparent", color:filter===f?C.blue2:C.gray600, fontFamily:D, fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
                {f==="all"?"Semua":f==="active"?"Aktif":"Tidak Aktif"}
              </button>
            ))}
          </div>
          <button onClick={exportCsv} disabled={!filtered.length}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, background: filtered.length ? `linear-gradient(135deg,${C.blue2},${C.blue})` : C.gray300, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:13, cursor: filtered.length ? "pointer" : "not-allowed" }}>
            <IcoDown /> Export CSV
          </button>
        </div>

        {/* Table (horizontal scroll on mobile so 7 cols stay readable) */}
        <div className="sd-table-scroll">
        <div style={{ minWidth: 680 }}>
        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", padding:"10px 20px", background:C.gray50, fontSize:12, fontFamily:D, fontWeight:700, color:C.gray500, letterSpacing:".04em", textTransform:"uppercase" }}>
          <span>Nama Siswa</span><span>Kelas</span><span>Kursus</span><span>Jam</span><span>Sertifikat</span><span>Progress</span><span>Status</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"50px", color:C.gray400, fontFamily:D, fontSize:14 }}>Memuat data siswa…</div>
        )}

        {/* Rows */}
        {!loading && filtered.map((s) => (
          <div key={s.user_id} onClick={() => setSelected(s)}
            style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", padding:"13px 20px", alignItems:"center", borderTop:`1px solid ${C.gray100}`, transition:"background .15s", cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=C.gray50}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:gradientFor(s.user_id), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:12, color:C.white, flexShrink:0 }}>{initialsOf(s.name)}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:D, fontWeight:600, fontSize:13.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:200 }}>{s.name}</div>
                <div style={{ fontSize:11.5, color:C.gray400 }}>{riasecLabel(s.riasec_type)}</div>
              </div>
            </div>
            <span style={{ fontSize:13, color:C.gray700, fontFamily:S }}>{s.class_label || "—"}</span>
            <span style={{ fontSize:13.5, fontFamily:D, fontWeight:700, color:C.ink }}>{s.courses}</span>
            <span style={{ fontSize:13, color:C.gray700, fontFamily:S }}>{Number(s.hours).toFixed(0)}j</span>
            <span style={{ fontSize:13.5, fontFamily:D, fontWeight:700, color:C.ink }}>{s.certs}</span>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <ProgressBar value={s.progress} color={s.progress>80?C.green:s.progress>50?C.blue2:C.orange} />
              <span style={{ fontSize:11, color:C.gray500, fontFamily:S }}>{s.progress}%</span>
            </div>
            <span style={{ display:"inline-block", padding:"4px 10px", borderRadius:99, fontSize:12, fontFamily:D, fontWeight:600,
              background:s.status==="active"?C.greenSoft:C.gray100, color:s.status==="active"?C.greenDark:C.gray500 }}>
              {s.status==="active"?"Aktif":"Tidak Aktif"}
            </span>
          </div>
        ))}

        {/* Empty states */}
        {!loading && total===0 && (
          <div style={{ textAlign:"center", padding:"56px 24px", color:C.gray500, fontFamily:S }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎓</div>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:6 }}>Belum ada siswa bergabung</div>
            <div style={{ fontSize:13, maxWidth:380, margin:"0 auto", lineHeight:1.6 }}>Bagikan link undangan di dashboard agar siswa bisa bergabung dengan sekolahmu.</div>
          </div>
        )}
        {!loading && total>0 && filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"40px", color:C.gray400, fontFamily:D }}>Tidak ada siswa cocok dengan filter</div>
        )}

        {!loading && total>0 && (
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.gray100}`, fontSize:12.5, color:C.gray500, fontFamily:S }}>
            Menampilkan {filtered.length} dari {total} siswa
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && <StudentDrawer student={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Student detail drawer ────────────────────────────────────────────── */
function StudentDrawer({ student: s, onClose }: { student: SchoolStudent; onClose: () => void }) {
  const stat = (label: string, value: string | number, color: string, bg: string) => (
    <div style={{ background:bg, borderRadius:12, padding:"14px 16px" }}>
      <div style={{ fontFamily:D, fontWeight:800, fontSize:22, color, lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:11.5, color:C.gray500, marginTop:3 }}>{label}</div>
    </div>
  );
  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:50, display:"flex", justifyContent:"flex-end", animation:"sdFade .2s ease" }}>
      <style>{`@keyframes sdFade{from{opacity:0}to{opacity:1}}@keyframes sdSlide{from{transform:translateX(40px);opacity:.6}to{transform:translateX(0);opacity:1}}`}</style>
      <div onClick={e=>e.stopPropagation()}
        style={{ width:400, maxWidth:"92vw", height:"100%", background:C.white, boxShadow:"-8px 0 40px rgba(0,0,0,.18)", overflowY:"auto", animation:"sdSlide .25s cubic-bezier(.4,0,.2,1)" }}>
        {/* Header */}
        <div style={{ padding:"24px 24px 20px", background:`linear-gradient(135deg,${C.blue50},#F0F9FF)`, borderBottom:`1px solid ${C.gray200}`, position:"relative" }}>
          <button onClick={onClose}
            style={{ position:"absolute", top:18, right:18, width:32, height:32, borderRadius:9, border:"none", background:C.white, color:C.gray500, cursor:"pointer", fontSize:18, lineHeight:1, boxShadow:"0 1px 4px rgba(0,0,0,.08)" }}>×</button>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:56, height:56, borderRadius:14, background:gradientFor(s.user_id), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:20, color:C.white, flexShrink:0 }}>{initialsOf(s.name)}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink, lineHeight:1.2 }}>{s.name}</div>
              <div style={{ fontSize:13, color:C.gray500, marginTop:2 }}>{s.class_label || "Tanpa kelas"} · Level {s.level}</div>
            </div>
          </div>
          {/* RIASEC badge */}
          <div style={{ marginTop:16, display:"inline-flex", alignItems:"center", gap:8, background:C.white, border:`1.5px solid ${C.blue200}`, borderRadius:10, padding:"8px 14px" }}>
            <span style={{ fontSize:18 }}>🧭</span>
            <div>
              <div style={{ fontSize:10.5, color:C.gray400, fontFamily:D, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>Tipe RIASEC</div>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.blue }}>{riasecLabel(s.riasec_type)}</div>
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ padding:"20px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {stat("Kursus dimulai", s.courses, C.blue2, C.blue50)}
          {stat("Materi selesai", s.completed, C.greenDark, C.greenSoft)}
          {stat("Jam belajar", `${Number(s.hours).toFixed(1)}j`, C.orange, C.orangeSoft)}
          {stat("Sertifikat", s.certs, C.yellow, C.yellowSoft)}
          {stat("Total XP", s.xp.toLocaleString("id-ID"), C.purple, C.purpleSoft)}
          {stat("Streak harian", `${s.streak} 🔥`, C.red, C.redSoft)}
        </div>

        {/* Progress bar */}
        <div style={{ padding:"0 24px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12.5, color:C.gray500, fontFamily:S }}>Penyelesaian belajar</span>
            <span style={{ fontSize:12.5, fontWeight:700, color:C.ink, fontFamily:D }}>{s.progress}%</span>
          </div>
          <ProgressBar value={s.progress} color={s.progress>80?C.green:s.progress>50?C.blue2:C.orange} />
        </div>

        {/* Meta */}
        <div style={{ padding:"0 24px 28px" }}>
          <div style={{ background:C.gray50, borderRadius:12, padding:"14px 16px", fontSize:12.5, color:C.gray600, fontFamily:S, lineHeight:1.8 }}>
            <div>Status: <b style={{ color:s.status==="active"?C.greenDark:C.gray500 }}>{s.status==="active"?"Aktif":"Tidak Aktif"}</b></div>
            <div>Bergabung: <b style={{ color:C.ink }}>{s.joined_at ? new Date(s.joined_at).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "—"}</b></div>
            <div>Terakhir belajar: <b style={{ color:C.ink }}>{s.last_active ? timeAgo(s.last_active) : "belum pernah"}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: PERINGKAT (class leaderboard — built client-side from students)
════════════════════════════════════════════════════════════════════════ */
function PeringkatSection({ students, loading }: { students: SchoolStudent[]; loading: boolean }) {
  const [kelas, setKelas] = useState("Semua");
  const [metric, setMetric] = useState<"xp"|"completed"|"streak">("xp");

  const classes = useMemo(
    () => ["Semua", ...Array.from(new Set(students.map(s => s.class_label).filter(Boolean) as string[])).sort()],
    [students]
  );

  const metricVal = (s: SchoolStudent) => metric === "xp" ? s.xp : metric === "completed" ? s.completed : s.streak;
  const metricLabel = metric === "xp" ? "XP" : metric === "completed" ? "Materi Selesai" : "Streak";

  const ranked = useMemo(() => {
    return students
      .filter(s => kelas === "Semua" || s.class_label === kelas)
      .slice()
      .sort((a, b) => metricVal(b) - metricVal(a) || b.completed - a.completed || a.name.localeCompare(b.name));
  }, [students, kelas, metric]);

  const anyPoints = ranked.some(s => metricVal(s) > 0);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const medal = ["🥇","🥈","🥉"];
  const podiumH = [96, 74, 60];
  const podiumOrder = [1, 0, 2]; // visually 2nd, 1st, 3rd

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header + controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink }}>🏆 Peringkat Siswa</div>
          <div style={{ fontSize:13, color:C.gray500, marginTop:2 }}>Dorong semangat belajar dengan kompetisi sehat antar siswa & kelas</div>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {classes.length > 1 && (
            <select value={kelas} onChange={e=>setKelas(e.target.value)}
              style={{ padding:"9px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:D, fontWeight:600, fontSize:12.5, color:C.gray700, background:C.white, cursor:"pointer", outline:"none" }}>
              {classes.map(c => <option key={c} value={c}>{c === "Semua" ? "Semua Kelas" : c}</option>)}
            </select>
          )}
          <div style={{ display:"flex", gap:6 }}>
            {(["xp","completed","streak"] as const).map(m => (
              <button key={m} onClick={() => setMetric(m)}
                style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${metric===m ? C.blue2 : C.gray200}`, background:metric===m?C.blue50:"transparent", color:metric===m?C.blue2:C.gray600, fontFamily:D, fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
                {m==="xp"?"XP":m==="completed"?"Materi":"Streak"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"56px", color:C.gray400, fontFamily:D, fontSize:14 }}>Memuat peringkat…</div>
      ) : ranked.length === 0 ? (
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, textAlign:"center", padding:"56px 24px", color:C.gray500, fontFamily:S }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:6 }}>Belum ada siswa untuk diperingkat</div>
          <div style={{ fontSize:13, maxWidth:380, margin:"0 auto", lineHeight:1.6 }}>Ajak siswa bergabung dan mulai belajar untuk melihat papan peringkat.</div>
        </div>
      ) : (
        <>
          {!anyPoints && (
            <div style={{ background:C.orangeSoft, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"12px 16px", fontSize:12.5, color:C.gray700, fontFamily:S }}>
              💡 Belum ada siswa yang mengumpulkan {metricLabel.toLowerCase()}. Peringkat akan hidup begitu siswa mulai belajar & menyelesaikan materi.
            </div>
          )}

          {/* Podium (top 3) */}
          {anyPoints && top3.length > 0 && (
            <div style={{ background:`linear-gradient(135deg,${C.blue50},#F0F9FF)`, borderRadius:18, border:`1px solid ${C.blue200}`, padding:"24px 20px 20px", display:"flex", justifyContent:"center", alignItems:"flex-end", gap:16 }}>
              {podiumOrder.map(idx => {
                const s = top3[idx]; if (!s) return null;
                return (
                  <div key={s.user_id} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, width:96 }}>
                    <div style={{ fontSize:22 }}>{medal[idx]}</div>
                    <div style={{ width:idx===0?56:46, height:idx===0?56:46, borderRadius:14, background:gradientFor(s.user_id), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:idx===0?18:15, color:C.white, boxShadow:"0 4px 12px rgba(0,0,0,.12)" }}>{initialsOf(s.name)}</div>
                    <div style={{ fontFamily:D, fontWeight:700, fontSize:12.5, color:C.ink, textAlign:"center", lineHeight:1.25, maxWidth:96, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                    <div style={{ fontSize:11, color:C.gray500 }}>{s.class_label || "—"}</div>
                    <div style={{ width:"100%", height:podiumH[idx], borderRadius:"10px 10px 0 0", background:idx===0?`linear-gradient(180deg,${C.blue2},${C.blue})`:C.blue100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", paddingTop:8, color:idx===0?C.white:C.blue }}>
                      <div style={{ fontFamily:D, fontWeight:800, fontSize:16, lineHeight:1 }}>{metricVal(s).toLocaleString("id-ID")}</div>
                      <div style={{ fontSize:9.5, opacity:.85, marginTop:2 }}>{metric==="streak"?"hari":metricLabel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranked list */}
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div className="sd-table-scroll"><div style={{ minWidth: 560 }}>
            <div style={{ display:"grid", gridTemplateColumns:"48px 2.4fr 1.2fr 0.9fr 0.9fr 0.9fr", padding:"10px 20px", background:C.gray50, fontSize:12, fontFamily:D, fontWeight:700, color:C.gray500, letterSpacing:".04em", textTransform:"uppercase" }}>
              <span>#</span><span>Nama</span><span>Kelas</span><span>XP</span><span>Selesai</span><span>Streak</span>
            </div>
            {(anyPoints ? rest : ranked).map((s, i) => {
              const rank = anyPoints ? i + 4 : i + 1;
              return (
                <div key={s.user_id} style={{ display:"grid", gridTemplateColumns:"48px 2.4fr 1.2fr 0.9fr 0.9fr 0.9fr", padding:"12px 20px", alignItems:"center", borderTop:`1px solid ${C.gray100}` }}>
                  <span style={{ fontFamily:D, fontWeight:800, fontSize:13.5, color:C.gray400 }}>{rank}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:gradientFor(s.user_id), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:11.5, color:C.white, flexShrink:0 }}>{initialsOf(s.name)}</div>
                    <span style={{ fontFamily:D, fontWeight:600, fontSize:13.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize:13, color:C.gray700, fontFamily:S }}>{s.class_label || "—"}</span>
                  <span style={{ fontSize:13.5, fontFamily:D, fontWeight:700, color: metric==="xp"?C.blue2:C.ink }}>{s.xp.toLocaleString("id-ID")}</span>
                  <span style={{ fontSize:13.5, fontFamily:D, fontWeight:700, color: metric==="completed"?C.greenDark:C.ink }}>{s.completed}</span>
                  <span style={{ fontSize:13, color: metric==="streak"?C.red:C.gray700, fontFamily:D, fontWeight: metric==="streak"?700:500 }}>{s.streak} 🔥</span>
                </div>
              );
            })}
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: KURSUS
════════════════════════════════════════════════════════════════════════ */
function KursusSection({ courses, loading }: { courses: SchoolCourse[]; loading: boolean }) {
  const [cat, setCat] = useState("Semua");
  const cats = ["Semua", ...Array.from(new Set(courses.map(c => c.category))).sort()];
  const shown = cat === "Semua" ? courses : courses.filter(c => c.category === cat);

  const totalEnroll = courses.reduce((a, c) => a + c.enrolled, 0);
  const rated = courses.filter(c => c.rating > 0);
  const avgRating = rated.length ? (rated.reduce((a, c) => a + Number(c.rating), 0) / rated.length) : 0;

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div className="sd-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        <StatCard label="Total Kursus Tersedia" value={loading ? "…" : String(courses.length)} sub={`${cats.length-1} kategori`} subColor={C.blue2} subBg={C.blue50} icon={<IcoBook />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Enrollment Siswamu" value={loading ? "…" : totalEnroll.toLocaleString("id-ID")} sub="dari sekolahmu" subColor={C.greenDark} subBg={C.greenSoft} icon={<IcoUsers />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Rata-rata Rating" value={loading ? "…" : (avgRating ? `${avgRating.toFixed(1)} ★` : "—")} sub={rated.length ? `${rated.length} kursus dinilai` : "belum ada rating"} subColor={C.yellow} subBg={C.yellowSoft} icon={<IcoStar />} iconBg={C.yellowSoft} iconColor={C.yellow} />
      </div>

      {/* Category filter */}
      {cats.length > 1 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding:"8px 16px", borderRadius:99, border:`1.5px solid ${cat===c?C.blue2:C.gray200}`, background:cat===c?C.blue2:"transparent", color:cat===c?C.white:C.gray600, fontFamily:D, fontWeight:600, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign:"center", padding:"50px", color:C.gray400, fontFamily:D }}>Memuat katalog kursus…</div>}

      {!loading && courses.length === 0 && (
        <div style={{ textAlign:"center", padding:"56px 24px", color:C.gray500, fontFamily:S, background:C.white, borderRadius:16, border:`1px solid ${C.gray200}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📚</div>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:6 }}>Katalog kursus belum tersedia</div>
          <div style={{ fontSize:13 }}>Konten pembelajaran akan muncul di sini.</div>
        </div>
      )}

      {/* Course cards */}
      {!loading && courses.length > 0 && (
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {shown.map(c => {
          const compPct = c.enrolled ? Math.round(c.completed / c.enrolled * 100) : 0;
          return (
          <div key={c.id} style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)", transition:"box-shadow .2s, transform .2s", cursor:"pointer" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 8px 24px -8px rgba(0,0,0,.12)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 1px 4px rgba(0,0,0,.04)";(e.currentTarget as HTMLDivElement).style.transform="none"}}>
            {/* Header */}
            <div style={{ padding:"18px 18px 14px", borderBottom:`1px solid ${C.gray100}`, background:`${c.category_color}10`, display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:c.category_color, display:"grid", placeItems:"center", flexShrink:0, color:C.white }}>
                <IcoBook />
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink, lineHeight:1.4 }}>{c.title}</div>
                <span style={{ display:"inline-block", marginTop:4, fontSize:11.5, padding:"2px 8px", borderRadius:99, background:`${c.category_color}1F`, color:c.category_color, fontFamily:D, fontWeight:600 }}>{c.category}</span>
              </div>
            </div>
            {/* Stats */}
            <div style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
              {[
                { label:"Enrolled", val:c.enrolled },
                { label:"Selesai", val:c.completed },
                { label:"Durasi", val:c.duration_minutes ? `${c.duration_minutes}m` : "—" },
              ].map((s,i) => (
                <div key={i} style={{ background:C.gray50, borderRadius:9, padding:"8px 4px" }}>
                  <div style={{ fontFamily:D, fontWeight:800, fontSize:17, color:C.ink }}>{s.val}</div>
                  <div style={{ fontSize:11, color:C.gray400 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Rating + progress */}
            <div style={{ padding:"0 18px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, color:c.rating>0?C.yellow:C.gray400, fontSize:13, fontFamily:D, fontWeight:700 }}>
                  <IcoStar /> {c.rating>0 ? Number(c.rating).toFixed(1) : "—"}
                </div>
                <span style={{ fontSize:12, color:C.gray500 }}>{c.enrolled ? `${compPct}% selesai` : "Belum ada siswa"}</span>
              </div>
              <ProgressBar value={compPct} color={c.category_color} />
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: MENTORING
════════════════════════════════════════════════════════════════════════ */
function MentoringSection() {
  return (
    <div style={{ padding:"24px 28px" }}>
      <div style={{ background:C.white, borderRadius:20, border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)", padding:"56px 32px", textAlign:"center", maxWidth:640, margin:"24px auto" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${C.blue50},#E0F2FE)`, display:"grid", placeItems:"center", margin:"0 auto 20px", color:C.blue2 }}>
          <IcoChat />
        </div>
        <div style={{ display:"inline-block", fontSize:11.5, fontWeight:700, color:C.orange, background:C.orangeSoft, padding:"4px 12px", borderRadius:99, letterSpacing:".05em", textTransform:"uppercase", marginBottom:14 }}>
          Segera Hadir
        </div>
        <div style={{ fontFamily:D, fontWeight:800, fontSize:22, color:C.ink, marginBottom:10 }}>Program Mentoring</div>
        <div style={{ fontSize:14, color:C.gray500, lineHeight:1.7, maxWidth:440, margin:"0 auto 24px" }}>
          Fitur mentoring sedang kami siapkan — siswa akan dapat terhubung dengan mentor profesional untuk bimbingan karier 1-on-1, dan kamu bisa memantau sesinya dari sini.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, maxWidth:360, margin:"0 auto", textAlign:"left" }}>
          {[
            "Booking sesi mentor profesional",
            "Pantau jadwal & progres bimbingan siswa",
            "Rating & feedback tiap sesi",
          ].map((f, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:C.gray700, fontFamily:S }}>
              <span style={{ width:22, height:22, borderRadius:"50%", background:C.blue50, color:C.blue2, display:"grid", placeItems:"center", flexShrink:0 }}><IcoCheck /></span>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: ASESMEN
════════════════════════════════════════════════════════════════════════ */
// Auto-insight per dominant RIASEC type → recommended study/career directions
const RIASEC_INSIGHT: Record<string, string> = {
  realistic: "cenderung praktis & teknikal. Arahkan ke jurusan Teknik, Vokasi, Pertanian, atau Olahraga, dan perbanyak kegiatan hands-on/praktik bengkel.",
  investigative: "kuat dalam analisis & riset. Dorong ke bidang Sains, Kedokteran, Teknologi, dan Penelitian; sediakan klub sains/olimpiade & proyek riset.",
  artistic: "menonjol di kreativitas & ekspresi. Arahkan ke Desain, Seni, Media, dan Komunikasi Visual; fasilitasi studio kreatif & lomba karya.",
  social: "berorientasi membantu & berinteraksi. Cocok ke Pendidikan, Psikologi, Kesehatan, dan Konseling; perkuat kegiatan sosial & peer-mentoring.",
  enterprising: "berjiwa memimpin & persuasif. Dorong ke Bisnis, Manajemen, Hukum, dan Kewirausahaan; adakan program business plan & organisasi siswa.",
  conventional: "teliti & terstruktur. Arahkan ke Akuntansi, Administrasi, Keuangan, dan Data; sediakan pelatihan spreadsheet/aplikasi perkantoran.",
};

function exportRiasecReport(schoolName: string, riasec: RiasecSlice[], byClass: RiasecByClass[], careers: CareerRec[]) {
  const today = new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
  const total = riasec.reduce((a, r) => a + r.cnt, 0);
  const distRows = riasec.map(r => `<tr><td>${riasecLabel(r.riasec_type)}</td><td style="text-align:center">${r.cnt}</td><td style="text-align:center">${r.pct}%</td></tr>`).join("");
  // group by class
  const classes = Array.from(new Set(byClass.map(b => b.class_label)));
  const classRows = classes.map(cls => {
    const items = byClass.filter(b => b.class_label === cls).sort((a,b)=>b.cnt-a.cnt);
    const tot = items.reduce((a,i)=>a+i.cnt,0);
    const top = items[0];
    return `<tr><td>${cls}</td><td style="text-align:center">${tot}</td><td>${top ? riasecShort(top.riasec_type)+" ("+top.cnt+")" : "—"}</td></tr>`;
  }).join("");
  const careerRows = careers.map((c,i) => `<tr><td>${i+1}. ${c.career}</td><td style="text-align:center">${c.cnt} siswa</td></tr>`).join("");
  const top = riasec[0];
  const insight = top ? `Mayoritas siswa bertipe <b>${riasecShort(top.riasec_type)}</b> (${top.pct}%) — ${RIASEC_INSIGHT[top.riasec_type] || ""}` : "Belum ada data asesmen.";

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan RIASEC — ${schoolName}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;color:#0F172A;padding:40px;max-width:800px;margin:auto}
    h1{font-size:22px;margin:0 0 4px} .sub{color:#64748B;font-size:13px;margin-bottom:24px}
    h2{font-size:15px;margin:26px 0 10px;color:#1D4ED8}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px}
    th,td{border:1px solid #E2E8F0;padding:7px 10px;text-align:left}
    th{background:#EFF6FF;color:#1D4ED8;font-size:12px}
    .insight{background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.6;margin-top:8px}
    .foot{margin-top:30px;font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px}
  </style></head><body>
    <h1>Laporan Analitik RIASEC</h1>
    <div class="sub">${schoolName} · ${today} · ${total} siswa telah mengikuti asesmen</div>
    <h2>Distribusi Tipe Kepribadian</h2>
    <table><tr><th>Tipe RIASEC</th><th>Jumlah</th><th>Persentase</th></tr>${distRows || '<tr><td colspan="3">Belum ada data</td></tr>'}</table>
    <h2>Distribusi per Kelas</h2>
    <table><tr><th>Kelas</th><th>Jumlah Siswa</th><th>Tipe Dominan</th></tr>${classRows || '<tr><td colspan="3">Belum ada data</td></tr>'}</table>
    <h2>Rekomendasi Karier Terpopuler</h2>
    <table><tr><th>Karier</th><th>Frekuensi</th></tr>${careerRows || '<tr><td colspan="2">Belum ada data</td></tr>'}</table>
    <h2>Insight & Rekomendasi</h2>
    <div class="insight">💡 ${insight}</div>
    <div class="foot">Dibuat otomatis oleh Talentika · talentika.id — Platform bimbingan karier berbasis AI</div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

function AsesmenSection({ riasec, mi, riasecByClass, careers, overview, loading, schoolName }: {
  riasec: RiasecSlice[]; mi: MiSlice[]; riasecByClass: RiasecByClass[]; careers: CareerRec[];
  overview: SchoolOverview | null; loading: boolean; schoolName: string;
}) {
  const miTested = mi.reduce((a, m) => a + m.cnt, 0);
  const maxMi = mi.reduce((a, m) => Math.max(a, m.cnt), 0) || 1;
  const tested  = overview?.assessments_done ?? 0;
  const active  = overview?.active_students ?? 0;
  const partic  = active ? Math.round(tested / active * 100) : 0;
  const top     = riasec[0];
  const donutSegments = riasec.map(r => ({ label: riasecShort(r.riasec_type), pct: r.pct, color: RIASEC_COLORS[r.riasec_type] || C.blue2 }));
  const maxCareer = careers.reduce((m, c) => Math.max(m, c.cnt), 0) || 1;

  // group RIASEC by class
  const classGroups = useMemo(() => {
    const map = new Map<string, RiasecByClass[]>();
    riasecByClass.forEach(r => { (map.get(r.class_label) ?? map.set(r.class_label, []).get(r.class_label)!).push(r); });
    return Array.from(map.entries()).map(([cls, items]) => ({
      cls, items: items.slice().sort((a,b)=>b.cnt-a.cnt), total: items.reduce((a,i)=>a+i.cnt,0),
    }));
  }, [riasecByClass]);

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header + export */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink }}>Analitik Asesmen RIASEC</div>
          <div style={{ fontSize:13, color:C.gray500, marginTop:2 }}>Pemetaan minat & potensi siswa berdasarkan hasil tes</div>
        </div>
        <button onClick={() => exportRiasecReport(schoolName, riasec, riasecByClass, careers)} disabled={!riasec.length}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, background: riasec.length ? `linear-gradient(135deg,${C.blue2},${C.blue})` : C.gray300, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:13, cursor: riasec.length ? "pointer" : "not-allowed" }}>
          <IcoDown /> Export Laporan PDF
        </button>
      </div>

      {/* Stat cards */}
      <div className="sd-kpi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Siswa Sudah Tes" value={loading ? "…" : tested.toLocaleString("id-ID")} sub="hasil RIASEC" subColor={C.blue2} subBg={C.blue50} icon={<IcoClip />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Partisipasi" value={loading ? "…" : `${partic}%`} sub={`dari ${active} siswa`} subColor={C.greenDark} subBg={C.greenSoft} icon={<IcoCheck />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Tipe Terbanyak" value={loading ? "…" : (top ? riasecShort(top.riasec_type) : "—")} sub={top ? `${top.pct}% siswa` : "belum ada"} subColor={C.orange} subBg={C.orangeSoft} icon={<IcoChart />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Tipe Teridentifikasi" value={loading ? "…" : `${riasec.length}/6`} sub="ragam RIASEC" subColor={C.purple} subBg={C.purpleSoft} icon={<IcoStar />} iconBg={C.purpleSoft} iconColor={C.purple} />
      </div>

      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Distribution + insight */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi RIASEC</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Tipe kepribadian dominan siswa</div>
          {donutSegments.length > 0
            ? <DonutChart segments={donutSegments} />
            : <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontSize:13 }}>{loading ? "Memuat…" : "Belum ada hasil asesmen"}</div>}
          {top && (
            <div style={{ marginTop:20, padding:"14px 16px", borderRadius:12, background:C.blue50, border:`1px solid ${C.blue200}` }}>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:13, color:C.blue, marginBottom:4 }}>💡 Insight Talentika</div>
              <div style={{ fontSize:12.5, color:C.gray700, lineHeight:1.6 }}>
                Mayoritas siswa bertipe <b>{riasecShort(top.riasec_type)}</b> ({top.pct}%) — {RIASEC_INSIGHT[top.riasec_type]}
              </div>
            </div>
          )}
        </div>

        {/* Career recommendations */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Rekomendasi Karier Terpopuler</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Agregat dari hasil asesmen siswa</div>
          {careers.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontSize:13 }}>{loading ? "Memuat…" : "Belum ada data"}</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {careers.map((c, i) => (
                <div key={c.career} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12.5, color:C.gray600, width:18, fontFamily:D, fontWeight:700 }}>{i+1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:13, color:C.ink, fontFamily:S, fontWeight:500 }}>{c.career}</span>
                      <span style={{ fontSize:12, color:C.gray500 }}>{c.cnt}</span>
                    </div>
                    <div style={{ height:7, borderRadius:99, background:C.gray100, overflow:"hidden" }}>
                      <div style={{ width:`${c.cnt/maxCareer*100}%`, height:"100%", borderRadius:99, background:`linear-gradient(90deg,${C.blue2},${C.cyan})` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-class breakdown */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi RIASEC per Kelas</div>
        <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Komposisi tipe kepribadian tiap kelas</div>
        {classGroups.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontSize:13 }}>{loading ? "Memuat…" : "Belum ada data asesmen per kelas"}</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {classGroups.map(g => (
              <div key={g.cls}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontFamily:D, fontWeight:700, fontSize:13, color:C.ink }}>{g.cls}</span>
                  <span style={{ fontSize:12, color:C.gray500 }}>{g.total} siswa</span>
                </div>
                {/* stacked bar */}
                <div style={{ display:"flex", height:14, borderRadius:99, overflow:"hidden", background:C.gray100 }}>
                  {g.items.map(it => (
                    <div key={it.riasec_type} title={`${riasecShort(it.riasec_type)}: ${it.cnt}`}
                      style={{ width:`${it.cnt/g.total*100}%`, background:RIASEC_COLORS[it.riasec_type] || C.blue2 }} />
                  ))}
                </div>
                {/* legend */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:6 }}>
                  {g.items.map(it => (
                    <span key={it.riasec_type} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, color:C.gray600 }}>
                      <span style={{ width:9, height:9, borderRadius:3, background:RIASEC_COLORS[it.riasec_type] || C.blue2 }} />
                      {riasecShort(it.riasec_type)} {it.cnt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multiple Intelligence distribution */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>🧠 Distribusi Kecerdasan Majemuk (MI)</div>
          {miTested > 0 && <span style={{ fontSize:12, color:C.purple, fontFamily:D, fontWeight:700, background:C.purpleSoft, padding:"3px 10px", borderRadius:99 }}>{miTested} siswa</span>}
        </div>
        <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Berdasarkan Tes Kecerdasan Majemuk (Gardner) — melengkapi profil RIASEC</div>
        {mi.length === 0 ? (
          <div style={{ textAlign:"center", padding:"30px 16px", color:C.gray400, fontSize:13, lineHeight:1.6 }}>
            {loading ? "Memuat…" : (
              <>
                <div style={{ fontSize:32, marginBottom:8 }}>🧠</div>
                <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.gray600, marginBottom:4 }}>Belum ada siswa mengambil Tes MI</div>
                <div style={{ maxWidth:400, margin:"0 auto" }}>Ajak siswa melengkapi Tes Kecerdasan Majemuk agar pemetaan bakatnya lebih lengkap, tidak hanya RIASEC.</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            {mi.map(m => (
              <div key={m.mi_type} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:9, height:9, borderRadius:3, background:MI_COLORS[m.mi_type] || C.purple, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, color:C.ink, fontFamily:S, fontWeight:500 }}>{miLabel(m.mi_type)}</span>
                    <span style={{ fontSize:12, color:C.gray500 }}>{m.cnt} · {m.pct}%</span>
                  </div>
                  <div style={{ height:7, borderRadius:99, background:C.gray100, overflow:"hidden" }}>
                    <div style={{ width:`${m.cnt/maxMi*100}%`, height:"100%", borderRadius:99, background:MI_COLORS[m.mi_type] || C.purple }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: LAPORAN
════════════════════════════════════════════════════════════════════════ */
function openPrintReport(title: string, schoolName: string, bodyHtml: string) {
  const today = new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title} — ${schoolName}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;color:#0F172A;padding:40px;max-width:820px;margin:auto}
    h1{font-size:22px;margin:0 0 4px} .sub{color:#64748B;font-size:13px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:8px}
    th,td{border:1px solid #E2E8F0;padding:7px 10px;text-align:left}
    th{background:#EFF6FF;color:#1D4ED8;font-size:12px}
    .foot{margin-top:30px;font-size:11px;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:12px}
  </style></head><body>
    <h1>${title}</h1>
    <div class="sub">${schoolName} · ${today}</div>
    ${bodyHtml}
    <div class="foot">Dibuat otomatis oleh Talentika · talentika.id — Platform bimbingan karier berbasis AI</div>
  </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html); w.document.close();
  setTimeout(() => w.print(), 350);
}

function exportStudentsReport(schoolName: string, students: SchoolStudent[]) {
  const rows = students.map((s, i) =>
    `<tr><td>${i+1}. ${s.name}</td><td>${s.class_label || "—"}</td><td style="text-align:center">${s.courses}</td><td style="text-align:center">${Number(s.hours).toFixed(1)}</td><td style="text-align:center">${s.certs}</td><td style="text-align:center">${s.xp}</td><td>${s.riasec_type ? riasecShort(s.riasec_type) : "—"}</td><td style="text-align:center">${s.progress}%</td></tr>`
  ).join("");
  openPrintReport("Laporan Progres Siswa", schoolName,
    `<table><tr><th>Nama</th><th>Kelas</th><th>Kursus</th><th>Jam</th><th>Sertifikat</th><th>XP</th><th>RIASEC</th><th>Progress</th></tr>${rows || '<tr><td colspan="8">Belum ada siswa</td></tr>'}</table>`);
}

function exportCoursesReport(schoolName: string, courses: SchoolCourse[]) {
  const rows = courses.map(c =>
    `<tr><td>${c.title}</td><td>${c.category}</td><td style="text-align:center">${c.enrolled}</td><td style="text-align:center">${c.completed}</td><td style="text-align:center">${c.duration_minutes || 0}m</td></tr>`
  ).join("");
  openPrintReport("Laporan Kursus & Kelas", schoolName,
    `<table><tr><th>Kursus</th><th>Kategori</th><th>Enrolled</th><th>Selesai</th><th>Durasi</th></tr>${rows || '<tr><td colspan="5">Belum ada kursus</td></tr>'}</table>`);
}

function LaporanSection({ overview, riasec, riasecByClass, careers, students, courses, loading, schoolName }: {
  overview: SchoolOverview | null; riasec: RiasecSlice[]; riasecByClass: RiasecByClass[];
  careers: CareerRec[]; students: SchoolStudent[]; courses: SchoolCourse[]; loading: boolean; schoolName: string;
}) {
  const monthlyHours  = overview?.monthly_hours ?? [0,0,0,0,0,0];
  const monthlyLabels = overview?.monthly_labels ?? MONTHS;

  // Category distribution from real catalog (count of courses per category)
  const categoryDonut = useMemo(() => {
    const map = new Map<string, { count: number; color: string }>();
    courses.forEach(c => {
      const e = map.get(c.category) ?? { count: 0, color: c.category_color };
      e.count++; map.set(c.category, e);
    });
    const total = courses.length || 1;
    return Array.from(map.entries())
      .sort((a,b) => b[1].count - a[1].count)
      .map(([label, v]) => ({ label, pct: Math.round(v.count/total*100), color: v.color }));
  }, [courses]);

  const reports = [
    { title:"Laporan Progres Siswa", desc:"Detail perkembangan per siswa: kursus, jam, sertifikat, XP, RIASEC.", color:C.blue, bg:C.blue50, on:() => exportStudentsReport(schoolName, students) },
    { title:"Laporan Kursus & Kelas", desc:"Enrollment, completion, dan distribusi kategori kursus.", color:C.purple, bg:C.purpleSoft, on:() => exportCoursesReport(schoolName, courses) },
    { title:"Laporan Asesmen RIASEC", desc:"Distribusi tipe, per kelas, rekomendasi karier & insight.", color:C.green, bg:C.greenSoft, on:() => exportRiasecReport(schoolName, riasec, riasecByClass, careers) },
  ];

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Laporan & Analitik Sekolah</div>
          <div style={{ fontSize:12, color:C.gray400, marginTop:2 }}>Cetak/simpan laporan berkala (PDF) dari data nyata sekolahmu</div>
        </div>
        <button onClick={() => exportStudentsReport(schoolName, students)} disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          <IcoDown /> Unduh Ringkasan
        </button>
      </div>

      {/* Charts */}
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Tren Jam Belajar</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Kumulatif per bulan ({new Date().getFullYear()})</div>
          <LineChart data={monthlyHours} labels={monthlyLabels} />
        </div>
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi Kategori Kursus</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Komposisi katalog pembelajaran</div>
          {categoryDonut.length > 0
            ? <DonutChart segments={categoryDonut} />
            : <div style={{ textAlign:"center", padding:"30px 10px", color:C.gray400, fontSize:13 }}>{loading ? "Memuat…" : "Belum ada kursus"}</div>}
        </div>
      </div>

      {/* Report types */}
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:r.bg, color:r.color, display:"grid", placeItems:"center", marginBottom:14 }}>
              <IcoChart />
            </div>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink, marginBottom:6 }}>{r.title}</div>
            <div style={{ fontSize:12.5, color:C.gray500, marginBottom:14, lineHeight:1.5 }}>{r.desc}</div>
            <button onClick={r.on}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background:r.bg, border:"none", color:r.color, fontFamily:D, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              <IcoDown /> Unduh PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: PENGUMUMAN
════════════════════════════════════════════════════════════════════════ */
function PengumumanSection({ schoolCode, announcements, classes, loading, onSent }: {
  schoolCode: string | null; announcements: SchoolAnnouncement[]; classes: string[]; loading: boolean; onSent: () => void;
}) {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("");      // "" = all
  const [priority, setPriority] = useState("normal");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const PRIO_LABEL: Record<string,string> = { normal:"Normal", penting:"Penting", mendesak:"Mendesak" };
  const PRIO_STYLE: Record<string,{bg:string;fg:string}> = {
    normal:{bg:C.gray100,fg:C.gray600}, penting:{bg:C.orangeSoft,fg:C.orange}, mendesak:{bg:C.redSoft,fg:C.red},
  };

  const send = async () => {
    if (!schoolCode || !title.trim()) { setErr("Judul pengumuman wajib diisi."); return; }
    setSending(true); setErr("");
    const { error } = await (supabase.rpc as any)("send_school_announcement", {
      p_code: schoolCode, p_title: title.trim(), p_body: body.trim(), p_target: target || null, p_priority: priority,
    });
    setSending(false);
    if (error) { setErr(error.message); return; }
    setTitle(""); setBody(""); setTarget(""); setPriority("normal"); setComposing(false);
    onSent();
  };

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink }}>Pengumuman Sekolah</div>
          <div style={{ fontSize:13, color:C.gray500, marginTop:2 }}>Kirim pengumuman langsung ke notifikasi siswa</div>
        </div>
        <button onClick={() => setComposing(!composing)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:12, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:`0 6px 16px -6px ${C.blue}80` }}>
          <IcoPlus /> Buat Pengumuman
        </button>
      </div>

      {/* Compose box */}
      {composing && (
        <div style={{ background:C.white, borderRadius:16, border:`1.5px solid ${C.blue2}`, padding:"22px 24px", boxShadow:`0 8px 24px -8px ${C.blue}22` }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Buat Pengumuman Baru</div>
          {err && <div style={{ background:C.redSoft, border:`1px solid ${C.red}33`, borderRadius:10, padding:"9px 14px", marginBottom:12, fontSize:13, color:C.red }}>⚠ {err}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Judul Pengumuman *</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Masukkan judul pengumuman..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Target Penerima</label>
                <select value={target} onChange={e=>setTarget(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", background:C.white, cursor:"pointer", boxSizing:"border-box" }}>
                  <option value="">Seluruh Siswa</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Prioritas</label>
                <select value={priority} onChange={e=>setPriority(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", background:C.white, cursor:"pointer", boxSizing:"border-box" }}>
                  <option value="normal">Normal</option>
                  <option value="penting">Penting</option>
                  <option value="mendesak">Mendesak</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Isi Pengumuman</label>
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} placeholder="Tulis isi pengumuman di sini..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={send} disabled={sending} style={{ flex:1, padding:"11px", borderRadius:10, background: sending?C.gray300:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:14, cursor: sending?"not-allowed":"pointer" }}>
                {sending ? "Mengirim…" : "Kirim Pengumuman"}
              </button>
              <button onClick={() => { setComposing(false); setErr(""); }} style={{ padding:"11px 20px", borderRadius:10, background:C.gray50, border:`1px solid ${C.gray200}`, color:C.gray700, fontFamily:D, fontWeight:600, fontSize:14, cursor:"pointer" }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.gray100}`, fontFamily:D, fontWeight:700, fontSize:14, color:C.ink }}>
          Pengumuman Terkirim ({announcements.length})
        </div>
        {loading && <div style={{ textAlign:"center", padding:"40px", color:C.gray400, fontFamily:D }}>Memuat…</div>}
        {!loading && announcements.length === 0 && (
          <div style={{ textAlign:"center", padding:"48px 24px", color:C.gray500, fontFamily:S }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📢</div>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink, marginBottom:4 }}>Belum ada pengumuman</div>
            <div style={{ fontSize:13 }}>Buat pengumuman pertama untuk siswamu.</div>
          </div>
        )}
        {announcements.map((a, i) => {
          const ps = PRIO_STYLE[a.priority] || PRIO_STYLE.normal;
          return (
          <div key={a.id} style={{ padding:"16px 20px", borderTop: i>0?`1px solid ${C.gray100}`:"none", display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:C.blue50, color:C.blue2, display:"grid", placeItems:"center", flexShrink:0 }}>
              <IcoBell />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink }}>{a.title}</span>
                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:ps.bg, color:ps.fg, fontFamily:D, fontWeight:700 }}>{PRIO_LABEL[a.priority] || a.priority}</span>
              </div>
              {a.body && <div style={{ fontSize:12.5, color:C.gray600, margin:"4px 0", lineHeight:1.5 }}>{a.body}</div>}
              <div style={{ fontSize:12, color:C.gray500, margin:"4px 0 8px" }}>
                Untuk: <b style={{ color:C.ink }}>{a.target || "Seluruh Siswa"}</b> · {new Date(a.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12.5, color:C.gray500 }}>📨 {a.recipient_count} terkirim</span>
                <span style={{ fontSize:12.5, color:C.gray500 }}>👁 {a.reads} dibaca</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: PENGATURAN
════════════════════════════════════════════════════════════════════════ */
const NOTIF_KEYS = [
  { key:"weekly_progress", label:"Email mingguan progres siswa", def:true },
  { key:"new_assessment",  label:"Notifikasi asesmen baru",       def:true },
  { key:"inactive_alert",  label:"Alert siswa tidak aktif",        def:true },
  { key:"newsletter",      label:"Newsletter Talentika",           def:false },
];

function PengaturanSection({ profile, userId, verified, onSaved }: {
  profile: any; userId: string | null; verified: boolean; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    school_name: profile?.school_name || "",
    school_npsn: profile?.school_npsn || "",
    pic_name: profile?.pic_name || profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const p = profile?.notif_prefs || {};
    return Object.fromEntries(NOTIF_KEYS.map(n => [n.key, p[n.key] ?? n.def]));
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!userId) return;
    setSaving(true); setMsg("");
    const { error } = await supabase.from("profiles").update({
      school_name: form.school_name, school_npsn: form.school_npsn,
      pic_name: form.pic_name, phone: form.phone, address: form.address,
    }).eq("user_id", userId);
    setSaving(false);
    setMsg(error ? `Gagal: ${error.message}` : "Tersimpan ✓");
    if (!error) onSaved();
    setTimeout(() => setMsg(""), 3000);
  };

  const togglePref = async (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    if (userId) await supabase.from("profiles").update({ notif_prefs: next }).eq("user_id", userId);
  };

  // ── Multi-admin management ──
  const schoolCode = profile?.school_code || null;
  const [admins, setAdmins] = useState<{ user_id: string; name: string; email: string; is_self: boolean }[]>([]);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");

  const loadAdmins = async () => {
    if (!schoolCode) return;
    const { data } = await (supabase.rpc as any)("list_school_admins", { p_code: schoolCode });
    setAdmins(data || []);
  };
  useEffect(() => { loadAdmins(); /* eslint-disable-next-line */ }, [schoolCode]);

  const addAdmin = async () => {
    if (!schoolCode || !addEmail.trim()) return;
    setAdding(true); setAdminMsg("");
    const { error } = await (supabase.rpc as any)("add_school_admin", { p_code: schoolCode, p_email: addEmail.trim() });
    setAdding(false);
    if (error) { setAdminMsg(error.message); return; }
    setAddEmail(""); setAdminMsg("Admin ditambahkan ✓"); loadAdmins();
    setTimeout(() => setAdminMsg(""), 3000);
  };

  const removeAdmin = async (uid: string) => {
    if (!schoolCode) return;
    const { error } = await (supabase.rpc as any)("remove_school_admin", { p_code: schoolCode, p_user_id: uid });
    if (error) { setAdminMsg(error.message); setTimeout(() => setAdminMsg(""), 3000); return; }
    loadAdmins();
  };

  const adminInitials = (form.pic_name || "AD").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div className="sd-chart-grid" style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:20 }}>
        {/* School profile form */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Profil Sekolah</div>
            {msg && <span style={{ fontSize:12.5, fontWeight:700, color: msg.startsWith("Gagal")?C.red:C.greenDark }}>{msg}</span>}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {([
              { k:"school_name", label:"Nama Sekolah", ph:"SMA Negeri 1...", type:"text" },
              { k:"school_npsn", label:"NPSN / Nomor Sekolah", ph:"20101234", type:"text" },
              { k:"pic_name", label:"Nama PIC / Admin", ph:"Nama lengkap", type:"text" },
              { k:"phone", label:"Nomor Telepon", ph:"+62 21 1234 5678", type:"tel" },
            ] as const).map(f => (
              <div key={f.k}>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={form[f.k]} onChange={e=>set(f.k, e.target.value)} placeholder={f.ph}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, color:C.ink, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Alamat Sekolah</label>
              <textarea rows={3} value={form.address} onChange={e=>set("address", e.target.value)} placeholder="Jalan, Kelurahan, Kecamatan, Kota/Kabupaten..."
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <button onClick={save} disabled={saving} style={{ padding:"12px", borderRadius:10, background: saving?C.gray300:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:14, cursor: saving?"not-allowed":"pointer" }}>
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* Account & notifications */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Admin accounts */}
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Admin Sekolah</div>
              {adminMsg && <span style={{ fontSize:11.5, fontWeight:700, color: adminMsg.includes("✓")?C.greenDark:C.red }}>{adminMsg}</span>}
            </div>

            {/* Admin list */}
            {(admins.length ? admins : [{ user_id:"self", name: form.pic_name || "Admin Sekolah", email: profile?.email || "", is_self:true }]).map((a, i) => (
              <div key={a.user_id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderTop: i>0?`1px solid ${C.gray100}`:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background: a.is_self?`linear-gradient(135deg,${C.blue2},${C.blue})`:gradientFor(a.user_id), display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:13, color:C.white, flexShrink:0 }}>{initialsOf(a.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:140 }}>{a.name}</span>
                    {a.is_self && verified && <VerifiedBadge size={12} />}
                  </div>
                  <div style={{ fontSize:12, color:C.gray500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.email}{a.is_self ? " · Kamu" : ""}</div>
                </div>
                {a.is_self
                  ? <span style={{ fontSize:12, padding:"3px 9px", borderRadius:99, background:C.greenSoft, color:C.greenDark, fontFamily:D, fontWeight:600 }}>Aktif</span>
                  : <button onClick={() => removeAdmin(a.user_id)} title="Hapus admin"
                      style={{ fontSize:12, padding:"4px 10px", borderRadius:9, border:`1px solid ${C.gray200}`, background:"transparent", color:C.red, fontFamily:D, fontWeight:600, cursor:"pointer" }}>Hapus</button>}
              </div>
            ))}

            {/* Add admin */}
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} type="email" placeholder="Email admin baru (sudah terdaftar)"
                style={{ flex:1, minWidth:0, padding:"9px 12px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:13, outline:"none", boxSizing:"border-box" }} />
              <button onClick={addAdmin} disabled={adding || !addEmail.trim()}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background: (adding||!addEmail.trim())?C.gray300:C.blue50, border:"none", color: (adding||!addEmail.trim())?C.white:C.blue2, fontFamily:D, fontWeight:700, fontSize:12.5, cursor:(adding||!addEmail.trim())?"not-allowed":"pointer", flexShrink:0 }}>
                <IcoPlus /> {adding ? "…" : "Tambah"}
              </button>
            </div>
            <div style={{ marginTop:8, fontSize:11, color:C.gray400, lineHeight:1.5 }}>
              Admin baru harus sudah punya akun Talentika. Mereka akan langsung bisa akses dashboard sekolah ini.
            </div>
          </div>

          {/* Notification settings */}
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Notifikasi</div>
            {NOTIF_KEYS.map((n, i) => {
              const on = prefs[n.key];
              return (
              <div key={n.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderTop:i>0?`1px solid ${C.gray100}`:"none" }}>
                <span style={{ fontSize:13.5, color:C.gray700, fontFamily:S }}>{n.label}</span>
                <button onClick={() => togglePref(n.key)} aria-label={n.label}
                  style={{ width:42, height:24, borderRadius:12, background:on?C.blue2:C.gray300, position:"relative", cursor:"pointer", transition:"background .2s", border:"none", padding:0 }}>
                  <div style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:C.white, top:3, left:on?21:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
                </button>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════ */
export default function SchoolDashboard() {
  const navigate   = useNavigate();
  const [sec, setSec]             = useState<Sec>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile]     = useState<any>(null);
  const [userId, setUserId]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth?role=school"); return; }
    setUserId(session.user.id);
    const { data } = await supabase.from("profiles")
      .select("full_name, school_name, school_npsn, school_city, phone, address, email, pic_name, subscription_type, school_code, role, account_verified, notif_prefs")
      .eq("user_id", session.user.id).maybeSingle();
    // Redirect individual users away from school dashboard
    if (data && data.role !== "school_admin") { navigate("/dashboard"); return; }
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, [navigate]);

  /* Inject responsive CSS */
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .sd-kpi-grid { grid-template-columns: repeat(4,1fr) !important; }
      .sd-chart-grid { grid-template-columns: 1.6fr 1fr !important; }
      @media(max-width:1024px){
        .sd-kpi-grid { grid-template-columns: 1fr 1fr !important; }
        .sd-chart-grid { grid-template-columns: 1fr !important; }
      }
      @media(max-width:640px){
        .sd-kpi-grid { grid-template-columns: 1fr !important; }
      }
      .sd-row:hover { background: #F8FAFC; }
      .sd-hamburger { display: none; }
      .sd-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      @media(max-width:768px){
        .sd-sidebar { position: fixed !important; left: 0; top: 0; height: 100vh !important; width: 240px !important; z-index: 60; transform: translateX(-100%); transition: transform .25s cubic-bezier(.4,0,.2,1); box-shadow: 8px 0 40px rgba(0,0,0,.18); }
        .sd-sidebar.sd-open { transform: translateX(0); }
        .sd-hamburger { display: grid !important; }
        .sd-topbar { padding: 0 14px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const schoolCode = profile?.school_code || null;
  const school = useSchoolData(schoolCode);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:C.gray50 }}>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <img src="/logo.png" alt="Talentika" style={{ width:56, height:56, objectFit:"contain", borderRadius:14 }} />
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.gray500 }}>Memuat dashboard...</div>
        </div>
      </div>
    );
  }

  const schoolName   = profile?.school_name || profile?.full_name || "SMA Cerdas Bangsa";
  const verified     = profile?.account_verified === true;
  const userInitials = schoolName.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase();
  const schoolClasses = Array.from(new Set(school.students.map(s => s.class_label).filter(Boolean) as string[])).sort();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.gray50, fontFamily:S }}>
      <Sidebar sec={sec} setSec={setSec} collapsed={collapsed} onCollapse={setCollapsed}
        schoolName={schoolName} verified={verified} onSignOut={handleSignOut}
        mobileOpen={mobileOpen} onNavClose={() => setMobileOpen(false)} />
      {/* Mobile drawer backdrop */}
      {mobileOpen && <div className="sd-backdrop" onClick={() => setMobileOpen(false)}
        style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.45)", zIndex:55 }} />}

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <TopBar sec={sec} schoolName={schoolName} userInitials={userInitials} verified={verified} onMenu={() => { setCollapsed(false); setMobileOpen(true); }} />
        <main style={{ flex:1, overflowY:"auto" }}>
          {school.error && (
            <div style={{ margin:"16px 28px 0", background:C.redSoft, border:`1px solid ${C.red}33`, borderRadius:12, padding:"12px 16px", fontSize:13, color:C.red, fontFamily:S }}>
              ⚠ Gagal memuat data sekolah: {school.error}
            </div>
          )}
          {sec==="dashboard"  && <OverviewSection schoolCode={schoolCode} schoolName={schoolName} overview={school.overview} riasec={school.riasec} activity={school.activity} loading={school.loading} onNavigate={setSec} />}
          {sec==="siswa"      && <SiswaSection students={school.students} loading={school.loading} />}
          {sec==="peringkat"  && <PeringkatSection students={school.students} loading={school.loading} />}
          {sec==="kursus"     && <KursusSection courses={school.courses} loading={school.loading} />}
          {sec==="mentoring"  && <MentoringSection />}
          {sec==="asesmen"    && <AsesmenSection riasec={school.riasec} mi={school.mi} riasecByClass={school.riasecByClass} careers={school.careers} overview={school.overview} loading={school.loading} schoolName={schoolName} />}
          {sec==="laporan"    && <LaporanSection overview={school.overview} riasec={school.riasec} riasecByClass={school.riasecByClass} careers={school.careers} students={school.students} courses={school.courses} loading={school.loading} schoolName={schoolName} />}
          {sec==="pengumuman" && <PengumumanSection schoolCode={schoolCode} announcements={school.announcements} classes={schoolClasses} loading={school.loading} onSent={school.refetch} />}
          {sec==="pengaturan" && <PengaturanSection profile={profile} userId={userId} verified={verified} onSaved={loadProfile} />}
        </main>
      </div>
    </div>
  );
}
