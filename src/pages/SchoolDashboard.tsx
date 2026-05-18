import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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

type Sec = "dashboard" | "siswa" | "kursus" | "mentoring" | "asesmen" | "laporan" | "pengumuman" | "pengaturan";

/* ── Dummy data ───────────────────────────────────────────────────────── */
const STUDENTS = [
  { id:1,  name:"Aisyah Pratiwi",  kelas:"XII IPA 1", courses:5, hours:42, certs:2, status:"active",   av:"AP", avBg:"linear-gradient(135deg,#3B82F6,#1D4ED8)", progress:78  },
  { id:2,  name:"Budi Santoso",    kelas:"XI IPS 2",  courses:3, hours:28, certs:1, status:"active",   av:"BS", avBg:"linear-gradient(135deg,#10B981,#059669)", progress:65  },
  { id:3,  name:"Citra Dewi",      kelas:"XII IPA 2", courses:7, hours:58, certs:3, status:"active",   av:"CD", avBg:"linear-gradient(135deg,#8B5CF6,#7C3AED)", progress:92  },
  { id:4,  name:"Dimas Kurniawan", kelas:"X IPS 1",   courses:2, hours:14, certs:0, status:"inactive", av:"DK", avBg:"linear-gradient(135deg,#F59E0B,#D97706)", progress:32  },
  { id:5,  name:"Eka Permata",     kelas:"XI IPA 3",  courses:4, hours:36, certs:1, status:"active",   av:"EP", avBg:"linear-gradient(135deg,#F97316,#EA580C)", progress:71  },
  { id:6,  name:"Fajar Nugroho",   kelas:"XII IPS 1", courses:6, hours:48, certs:2, status:"active",   av:"FN", avBg:"linear-gradient(135deg,#EC4899,#DB2777)", progress:85  },
  { id:7,  name:"Gilang Pratama",  kelas:"X IPA 1",   courses:1, hours:8,  certs:0, status:"active",   av:"GP", avBg:"linear-gradient(135deg,#06B6D4,#0891B2)", progress:22  },
  { id:8,  name:"Hana Sari",       kelas:"XI IPA 1",  courses:5, hours:44, certs:2, status:"active",   av:"HS", avBg:"linear-gradient(135deg,#10B981,#0D9488)", progress:88  },
  { id:9,  name:"Ibnu Hakim",      kelas:"XII IPA 3", courses:3, hours:22, certs:1, status:"inactive", av:"IH", avBg:"linear-gradient(135deg,#6366F1,#4F46E5)", progress:45  },
  { id:10, name:"Julia Ayu",       kelas:"XI IPS 1",  courses:8, hours:62, certs:4, status:"active",   av:"JA", avBg:"linear-gradient(135deg,#F43F5E,#E11D48)", progress:96  },
];

const COURSES = [
  { id:1, title:"Public Speaking Mastery",              cat:"Komunikasi",         enrolled:145, completed:89,  rating:4.8, hours:12, color:C.blue,   catBg:C.blue50   },
  { id:2, title:"UI/UX Design Fundamentals",            cat:"Desain",             enrolled:98,  completed:52,  rating:4.9, hours:18, color:C.purple, catBg:C.purpleSoft },
  { id:3, title:"Coding Dasar Python",                  cat:"Teknologi",          enrolled:201, completed:134, rating:4.7, hours:24, color:C.green,  catBg:C.greenSoft  },
  { id:4, title:"Digital Marketing 101",                cat:"Bisnis",             enrolled:87,  completed:45,  rating:4.6, hours:8,  color:C.orange, catBg:C.orangeSoft },
  { id:5, title:"Critical Thinking & Problem Solving",  cat:"Pengembangan Diri",  enrolled:156, completed:78,  rating:4.8, hours:10, color:C.yellow, catBg:C.yellowSoft },
  { id:6, title:"Financial Literacy untuk Remaja",      cat:"Bisnis",             enrolled:123, completed:67,  rating:4.5, hours:6,  color:"#EC4899", catBg:"#FDF2F8"   },
];

const MENTORS = [
  { name:"Dr. Rizky Handoko",     field:"Teknologi & AI",            sessions:48, rating:4.9, av:"RH", avBg:"linear-gradient(135deg,#3B82F6,#1D4ED8)", available:true  },
  { name:"Sarah Amelia, M.Psi",  field:"Psikologi & Pengembangan Diri", sessions:62, rating:4.8, av:"SA", avBg:"linear-gradient(135deg,#EC4899,#DB2777)", available:true  },
  { name:"Bambang Wijaya, MBA",  field:"Bisnis & Kewirausahaan",    sessions:35, rating:4.7, av:"BW", avBg:"linear-gradient(135deg,#F97316,#EA580C)", available:false },
  { name:"Dian Kusuma",           field:"Desain Kreatif & Seni",     sessions:29, rating:4.9, av:"DK", avBg:"linear-gradient(135deg,#8B5CF6,#7C3AED)", available:true  },
];

const SESSIONS = [
  { student:"Aisyah Pratiwi",  mentor:"Dr. Rizky Handoko",    topic:"Karir di bidang AI",              date:"Senin, 19 Mei 2026",    time:"14.00–15.00" },
  { student:"Citra Dewi",      mentor:"Sarah Amelia, M.Psi",  topic:"Manajemen stres & produktivitas", date:"Selasa, 20 Mei 2026",   time:"10.00–11.00" },
  { student:"Fajar Nugroho",   mentor:"Bambang Wijaya, MBA",  topic:"Business plan siswa",             date:"Rabu, 21 Mei 2026",     time:"13.00–14.00" },
  { student:"Hana Sari",       mentor:"Dian Kusuma",           topic:"Portfolio desain kreatif",        date:"Kamis, 22 Mei 2026",    time:"15.00–16.00" },
];

const ASSESSMENTS = [
  { name:"Asesmen Potensi & Bakat",      period:"1–10 Mei 2026",  completed:1089, total:1250, status:"active" },
  { name:"Tes Minat Karir",              period:"15 Apr 2026",    completed:1180, total:1180, status:"done"   },
  { name:"Evaluasi Soft Skills Q1 2026", period:"20 Mar 2026",    completed:1143, total:1143, status:"done"   },
];

const ANNOUNCEMENTS = [
  { title:"Program Webinar Nasional: AI untuk Generasi Z",      date:"15 Mei 2026", target:"Seluruh Siswa",      reads:892,  status:"published" },
  { title:"Pendaftaran Kompetisi Talentika Award 2026",          date:"10 Mei 2026", target:"XII IPA & IPS",      reads:445,  status:"published" },
  { title:"Workshop Public Speaking — Sesi Tambahan",            date:"5 Mei 2026",  target:"XI IPA 1, XI IPS 1", reads:201,  status:"published" },
  { title:"Jadwal Asesmen Semester Genap 2026",                  date:"1 Mei 2026",  target:"Seluruh Siswa",      reads:1180, status:"published" },
];

const MONTHLY  = [320, 480, 540, 620, 780, 860];
const MONTHS   = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];
const DONUT    = [
  { label:"Teknologi", pct:40, color:C.blue   },
  { label:"Bisnis",    pct:25, color:C.orange  },
  { label:"Desain",    pct:20, color:C.purple  },
  { label:"P. Diri",  pct:15, color:C.green   },
];

const ACTIVITY = [
  { av:"AP", avBg:"linear-gradient(135deg,#3B82F6,#1D4ED8)", name:"Aisyah Pratiwi",  action:"menyelesaikan kursus",     item:"Public Speaking Mastery",     time:"2 jam lalu" },
  { av:"RP", avBg:"linear-gradient(135deg,#F97316,#EA580C)", name:"Rafi Pratama",    action:"mendapatkan sertifikat",   item:"UI/UX Design Fundamentals",   time:"5 jam lalu" },
  { av:"CD", avBg:"linear-gradient(135deg,#8B5CF6,#7C3AED)", name:"Citra Dewi",      action:"bergabung komunitas",      item:"Tech Innovators",             time:"1 hari lalu"},
  { av:"HS", avBg:"linear-gradient(135deg,#10B981,#059669)", name:"Hana Sari",       action:"memulai kursus",           item:"Financial Literacy Remaja",   time:"1 hari lalu"},
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

const NAV: { id: Sec; label: string; Icon: () => JSX.Element }[] = [
  { id:"dashboard",   label:"Dashboard",   Icon:IcoHome  },
  { id:"siswa",       label:"Siswa",       Icon:IcoUsers },
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
  const pts = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: padY + (1 - (v - min) / (max - min)) * (H - padY * 2),
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

/* ── Sidebar ──────────────────────────────────────────────────────────── */
function Sidebar({ sec, setSec, collapsed, onCollapse, schoolName, onSignOut }:{
  sec:Sec; setSec:(s:Sec)=>void; collapsed:boolean; onCollapse:(v:boolean)=>void;
  schoolName:string; onSignOut:()=>void;
}) {
  const W = collapsed ? 68 : 240;
  return (
    <aside style={{
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
              <div style={{ fontFamily:D, fontWeight:700, fontSize:12.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:140 }}>{schoolName}</div>
              <div style={{ fontSize:11, color:C.blue2 }}>Admin Sekolah</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:"8px 10px", display:"flex", flexDirection:"column", gap:2, overflowY:"auto" }}>
        {NAV.map(item => {
          const active = sec === item.id;
          return (
            <button key={item.id} onClick={() => setSec(item.id)}
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
function TopBar({ sec, schoolName, userInitials }: { sec: Sec; schoolName: string; userInitials: string }) {
  return (
    <header style={{ background:C.white, borderBottom:`1px solid ${C.gray200}`, padding:"0 28px", height:64, display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:10 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink, letterSpacing:"-.01em" }}>{PAGE_TITLES[sec]}</div>
        <div style={{ fontSize:12, color:C.gray400, fontFamily:S }}>Senin, 19 Mei 2026</div>
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
            <div style={{ fontFamily:D, fontWeight:700, fontSize:12.5, color:C.ink }}>{schoolName}</div>
            <div style={{ fontSize:11, color:C.gray400 }}>Admin Sekolah</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: DASHBOARD
════════════════════════════════════════════════════════════════════════ */
function OverviewSection() {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPI cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Siswa Aktif" value="1.250" sub="+12% bulan ini" subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoUsers />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Kursus Diikuti" value="320" sub="+10% bulan ini" subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoBook />} iconBg={C.purpleSoft} iconColor={C.purple} />
        <StatCard label="Jam Belajar" value="2.450" sub="+18% bulan ini" subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoChart />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Sertifikat" value="180" sub="+25% bulan ini" subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoClip />} iconBg={C.yellowSoft} iconColor={C.yellow} />
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        {/* Line chart */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Progress Belajar Siswa</div>
              <div style={{ fontSize:12, color:C.gray400, fontFamily:S }}>Total jam belajar per bulan</div>
            </div>
            <div style={{ fontSize:12.5, fontFamily:D, fontWeight:700, color:C.blue2, background:C.blue50, padding:"5px 12px", borderRadius:99 }}>2026</div>
          </div>
          <LineChart data={MONTHLY} labels={MONTHS} />
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            {MONTHLY.map((v, i) => (
              <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.ink, fontFamily:D }}>{v}</div>
                <div style={{ fontSize:10, color:C.gray400 }}>{MONTHS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Kategori Populer</div>
          <div style={{ fontSize:12, color:C.gray400, fontFamily:S, marginBottom:18 }}>Distribusi minat siswa</div>
          <DonutChart segments={DONUT} />
        </div>
      </div>

      {/* Activity + Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16 }}>
        {/* Activity */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Aktivitas Terbaru</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:12, borderBottom: i<ACTIVITY.length-1?`1px solid ${C.gray100}`:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:a.avBg, display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:13, color:C.white, flexShrink:0 }}>{a.av}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontFamily:S }}>
                    <b style={{ color:C.ink, fontWeight:600 }}>{a.name}</b>
                    <span style={{ color:C.gray500 }}> {a.action} </span>
                    <b style={{ color:C.blue2 }}>{a.item}</b>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.gray400, fontFamily:S, flexShrink:0 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ background:C.white, borderRadius:16, padding:"20px 22px", border:`1px solid ${C.gray200}`, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Aksi Cepat</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Buat Pengumuman",     bg:C.blue50,      fg:C.blue2,    icon:<IcoBell />  },
              { label:"Unduh Laporan",       bg:C.greenSoft,   fg:C.greenDark,icon:<IcoDown />  },
              { label:"Jadwal Asesmen Baru", bg:C.purpleSoft,  fg:C.purple,   icon:<IcoClip />  },
              { label:"Tambah Kursus",       bg:C.orangeSoft,  fg:C.orange,   icon:<IcoBook />  },
            ].map((a, i) => (
              <button key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, background:a.bg, border:"none", cursor:"pointer", textAlign:"left", transition:"filter .15s" }}
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

/* ════════════════════════════════════════════════════════════════════════
   SECTION: SISWA
════════════════════════════════════════════════════════════════════════ */
function SiswaSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"active"|"inactive">("all");
  const filtered = STUDENTS.filter(s => {
    const match = s.name.toLowerCase().includes(search.toLowerCase()) || s.kelas.toLowerCase().includes(search.toLowerCase());
    return match && (filter==="all" || s.status===filter);
  });

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Total Siswa" value="1.250" sub="+42 bulan ini" subColor={C.blue2} subBg={C.blue50}
          icon={<IcoUsers />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Siswa Aktif" value="1.089" sub="87% dari total" subColor={C.greenDark} subBg={C.greenSoft}
          icon={<IcoCheck />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Sertifikat Diraih" value="180" sub="+12 minggu ini" subColor={C.orange} subBg={C.orangeSoft}
          icon={<IcoStar />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Rata-rata Jam" value="15,3 jam" sub="per siswa aktif" subColor={C.purple} subBg={C.purpleSoft}
          icon={<IcoChart />} iconBg={C.purpleSoft} iconColor={C.purple} />
      </div>

      {/* Table */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        {/* Toolbar */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.gray100}`, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:C.gray400 }}><IcoSearch /></span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Cari nama atau kelas siswa..."
              style={{ width:"100%", padding:"9px 14px 9px 36px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:13.5, color:C.ink, outline:"none", background:C.gray50, boxSizing:"border-box" }} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {(["all","active","inactive"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${filter===f ? C.blue2 : C.gray200}`, background:filter===f?C.blue50:"transparent", color:filter===f?C.blue2:C.gray600, fontFamily:D, fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
                {f==="all"?"Semua":f==="active"?"Aktif":"Tidak Aktif"}
              </button>
            ))}
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:10, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            <IcoPlus /> Tambah Siswa
          </button>
        </div>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", padding:"10px 20px", background:C.gray50, fontSize:12, fontFamily:D, fontWeight:700, color:C.gray500, letterSpacing:".04em", textTransform:"uppercase" }}>
          <span>Nama Siswa</span><span>Kelas</span><span>Kursus</span><span>Jam</span><span>Sertifikat</span><span>Progress</span><span>Status</span>
        </div>

        {/* Rows */}
        {filtered.map((s, i) => (
          <div key={s.id}
            style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 0.8fr", padding:"13px 20px", alignItems:"center", borderTop:`1px solid ${C.gray100}`, transition:"background .15s", cursor:"pointer" }}
            onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=C.gray50}
            onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:s.avBg, display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:12, color:C.white, flexShrink:0 }}>{s.av}</div>
              <div>
                <div style={{ fontFamily:D, fontWeight:600, fontSize:13.5, color:C.ink }}>{s.name}</div>
                <div style={{ fontSize:11.5, color:C.gray400 }}>ID: T{String(s.id).padStart(4,"0")}</div>
              </div>
            </div>
            <span style={{ fontSize:13, color:C.gray700, fontFamily:S }}>{s.kelas}</span>
            <span style={{ fontSize:13.5, fontFamily:D, fontWeight:700, color:C.ink }}>{s.courses}</span>
            <span style={{ fontSize:13, color:C.gray700, fontFamily:S }}>{s.hours}j</span>
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

        {filtered.length===0 && (
          <div style={{ textAlign:"center", padding:"40px", color:C.gray400, fontFamily:D }}>Tidak ada siswa ditemukan</div>
        )}
        <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.gray100}`, fontSize:12.5, color:C.gray500, fontFamily:S, display:"flex", justifyContent:"space-between" }}>
          <span>Menampilkan {filtered.length} dari {STUDENTS.length} siswa</span>
          <span style={{ color:C.blue2, fontWeight:600, cursor:"pointer" }}>Lihat semua 1.250 siswa →</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: KURSUS
════════════════════════════════════════════════════════════════════════ */
function KursusSection() {
  const [cat, setCat] = useState("Semua");
  const cats = ["Semua", ...Array.from(new Set(COURSES.map(c=>c.cat)))];
  const shown = cat==="Semua" ? COURSES : COURSES.filter(c=>c.cat===cat);
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        <StatCard label="Total Kursus Tersedia" value="48" sub="6 kategori" subColor={C.blue2} subBg={C.blue50} icon={<IcoBook />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Total Enrollment" value="810" sub="dari 6 kursus pilihan" subColor={C.greenDark} subBg={C.greenSoft} icon={<IcoUsers />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Rata-rata Rating" value="4.72 ★" sub="dari 810 ulasan" subColor={C.yellow} subBg={C.yellowSoft} icon={<IcoStar />} iconBg={C.yellowSoft} iconColor={C.yellow} />
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            style={{ padding:"8px 16px", borderRadius:99, border:`1.5px solid ${cat===c?C.blue2:C.gray200}`, background:cat===c?C.blue2:"transparent", color:cat===c?C.white:C.gray600, fontFamily:D, fontWeight:600, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Course cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {shown.map(c => (
          <div key={c.id} style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)", transition:"box-shadow .2s, transform .2s", cursor:"pointer" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 8px 24px -8px rgba(0,0,0,.12)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 1px 4px rgba(0,0,0,.04)";(e.currentTarget as HTMLDivElement).style.transform="none"}}>
            {/* Header */}
            <div style={{ padding:"18px 18px 14px", borderBottom:`1px solid ${C.gray100}`, background:c.catBg, display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:c.color, display:"grid", placeItems:"center", flexShrink:0 }}>
                <IcoBook />
              </div>
              <div>
                <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink, lineHeight:1.4 }}>{c.title}</div>
                <span style={{ display:"inline-block", marginTop:4, fontSize:11.5, padding:"2px 8px", borderRadius:99, background:`${c.color}18`, color:c.color, fontFamily:D, fontWeight:600 }}>{c.cat}</span>
              </div>
            </div>
            {/* Stats */}
            <div style={{ padding:"14px 18px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
              {[
                { label:"Enrolled", val:c.enrolled },
                { label:"Selesai", val:c.completed },
                { label:"Durasi", val:`${c.hours}j` },
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
                <div style={{ display:"flex", alignItems:"center", gap:4, color:C.yellow, fontSize:13, fontFamily:D, fontWeight:700 }}>
                  <IcoStar /> {c.rating}
                </div>
                <span style={{ fontSize:12, color:C.gray500 }}>{Math.round(c.completed/c.enrolled*100)}% selesai</span>
              </div>
              <ProgressBar value={Math.round(c.completed/c.enrolled*100)} color={c.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: MENTORING
════════════════════════════════════════════════════════════════════════ */
function MentoringSection() {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        <StatCard label="Sesi Bulan Ini" value="48" sub="+8 dari bulan lalu" subColor={C.greenDark} subBg={C.greenSoft} icon={<IcoChat />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Mentor Aktif" value="4" sub="dari 12 mentor total" subColor={C.blue2} subBg={C.blue50} icon={<IcoUsers />} iconBg={C.purpleSoft} iconColor={C.purple} />
        <StatCard label="Rata-rata Rating" value="4.8 ★" sub="dari 174 sesi" subColor={C.yellow} subBg={C.yellowSoft} icon={<IcoStar />} iconBg={C.yellowSoft} iconColor={C.yellow} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:16 }}>
        {/* Upcoming sessions */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Sesi Mendatang</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {SESSIONS.map((s, i) => (
              <div key={i} style={{ border:`1px solid ${C.gray200}`, borderRadius:12, padding:"14px 16px", display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:C.blue50, display:"grid", placeItems:"center", color:C.blue2, flexShrink:0 }}>
                  <IcoChat />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.ink }}>{s.topic}</div>
                  <div style={{ fontSize:12, color:C.gray500, margin:"3px 0" }}>{s.student} × {s.mentor}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11.5, color:C.blue2, fontWeight:600 }}>{s.date}</span>
                    <span style={{ fontSize:11.5, color:C.gray500 }}>{s.time}</span>
                  </div>
                </div>
                <span style={{ fontSize:11.5, padding:"3px 9px", borderRadius:99, background:C.blue50, color:C.blue2, fontFamily:D, fontWeight:600, flexShrink:0 }}>Terjadwal</span>
              </div>
            ))}
          </div>
          <button style={{ width:"100%", marginTop:12, padding:"10px", borderRadius:10, border:`1.5px dashed ${C.gray200}`, background:"transparent", cursor:"pointer", color:C.blue2, fontFamily:D, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <IcoPlus /> Jadwalkan Sesi Baru
          </button>
        </div>

        {/* Mentor list */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Daftar Mentor</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {MENTORS.map((m, i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", borderRadius:12, background:C.gray50, border:`1px solid ${C.gray200}` }}>
                <div style={{ width:42, height:42, borderRadius:11, background:m.avBg, display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:14, color:C.white, flexShrink:0 }}>{m.av}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.name}</div>
                  <div style={{ fontSize:11.5, color:C.gray500, marginTop:2 }}>{m.field}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                    <span style={{ color:C.yellow, fontSize:12, display:"flex", alignItems:"center", gap:2 }}><IcoStar /> {m.rating}</span>
                    <span style={{ fontSize:11.5, color:C.gray400 }}>· {m.sessions} sesi</span>
                  </div>
                </div>
                <span style={{ fontSize:11.5, padding:"4px 10px", borderRadius:99, fontFamily:D, fontWeight:700,
                  background: m.available ? C.greenSoft : C.gray100,
                  color: m.available ? C.greenDark : C.gray500 }}>
                  {m.available ? "Tersedia" : "Penuh"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: ASESMEN
════════════════════════════════════════════════════════════════════════ */
function AsesmenSection() {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatCard label="Asesmen Aktif" value="1" sub="sedang berlangsung" subColor={C.blue2} subBg={C.blue50} icon={<IcoClip />} iconBg={C.blue50} iconColor={C.blue2} />
        <StatCard label="Siswa Selesai" value="1.089" sub="87% partisipasi" subColor={C.greenDark} subBg={C.greenSoft} icon={<IcoCheck />} iconBg={C.greenSoft} iconColor={C.greenDark} />
        <StatCard label="Minat Terbanyak" value="Teknologi" sub="40% siswa" subColor={C.orange} subBg={C.orangeSoft} icon={<IcoChart />} iconBg={C.orangeSoft} iconColor={C.orange} />
        <StatCard label="Total Asesmen" value="3" sub="tahun 2026" subColor={C.purple} subBg={C.purpleSoft} icon={<IcoStar />} iconBg={C.purpleSoft} iconColor={C.purple} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16 }}>
        {/* Assessment list */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Daftar Asesmen</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {ASSESSMENTS.map((a, i) => (
              <div key={i} style={{ border:`1.5px solid ${a.status==="active"?C.blue2:C.gray200}`, borderRadius:14, padding:"16px 18px", background:a.status==="active"?C.blue50:"#fff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink }}>{a.name}</div>
                    <div style={{ fontSize:12, color:C.gray500, marginTop:2 }}>{a.period}</div>
                  </div>
                  <span style={{ fontSize:12, padding:"4px 10px", borderRadius:99, fontFamily:D, fontWeight:700,
                    background:a.status==="active"?C.blue2:C.greenSoft,
                    color:a.status==="active"?C.white:C.greenDark }}>
                    {a.status==="active"?"Aktif":"Selesai"}
                  </span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:C.gray600 }}>{a.completed.toLocaleString()} / {a.total.toLocaleString()} siswa</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:C.ink, fontFamily:D }}>{Math.round(a.completed/a.total*100)}%</span>
                </div>
                <ProgressBar value={Math.round(a.completed/a.total*100)} color={a.status==="active"?C.blue2:C.green} />
              </div>
            ))}
          </div>
          <button style={{ width:"100%", marginTop:12, padding:"11px", borderRadius:10, border:`1.5px dashed ${C.gray200}`, background:"transparent", cursor:"pointer", color:C.blue2, fontFamily:D, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <IcoPlus /> Buat Asesmen Baru
          </button>
        </div>

        {/* Interest distribution */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi Minat Siswa</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Berdasarkan hasil asesmen terakhir</div>
          <DonutChart segments={DONUT} />
          <div style={{ marginTop:20, padding:"14px 16px", borderRadius:12, background:C.blue50, border:`1px solid ${C.blue200}` }}>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:13, color:C.blue, marginBottom:4 }}>💡 Insight Talentika</div>
            <div style={{ fontSize:12.5, color:C.gray700, lineHeight:1.6 }}>40% siswa menunjukkan minat kuat di bidang Teknologi. Rekomendasikan kursus Coding dan AI untuk kelompok ini.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: LAPORAN
════════════════════════════════════════════════════════════════════════ */
function LaporanSection() {
  const [period, setPeriod] = useState<"bulanan"|"triwulan"|"tahunan">("bulanan");
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Controls */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Laporan Perkembangan Siswa</div>
          <div style={{ fontSize:12, color:C.gray400, marginTop:2 }}>Unduh atau lihat laporan berkala sekolah Anda</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ display:"flex", gap:4, background:C.gray100, borderRadius:10, padding:4 }}>
            {(["bulanan","triwulan","tahunan"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:D, fontWeight:600, fontSize:12.5, background:period===p?C.white:"transparent", color:period===p?C.ink:C.gray500, boxShadow:period===p?"0 1px 4px rgba(0,0,0,.08)":"none", transition:"all .15s" }}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            <IcoDown /> Unduh PDF
          </button>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Tren Jam Belajar</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Kumulatif per bulan (2026)</div>
          <LineChart data={MONTHLY} labels={MONTHS} />
        </div>
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:4 }}>Distribusi Kategori</div>
          <div style={{ fontSize:12, color:C.gray400, marginBottom:18 }}>Kursus yang diikuti siswa</div>
          <DonutChart segments={DONUT} />
        </div>
      </div>

      {/* Report types */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {[
          { title:"Laporan Progres Siswa",    desc:"Detail perkembangan per siswa, kelas, dan jurusan.",  color:C.blue,   bg:C.blue50   },
          { title:"Laporan Kursus & Kelas",   desc:"Enrollment, completion rate, dan distribusi kategori.", color:C.purple, bg:C.purpleSoft },
          { title:"Laporan Sertifikat",       desc:"Daftar sertifikat yang diraih dan jadwal kedaluwarsa.", color:C.green,  bg:C.greenSoft  },
        ].map((r, i) => (
          <div key={i} style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:r.bg, color:r.color, display:"grid", placeItems:"center", marginBottom:14 }}>
              <IcoChart />
            </div>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink, marginBottom:6 }}>{r.title}</div>
            <div style={{ fontSize:12.5, color:C.gray500, marginBottom:14, lineHeight:1.5 }}>{r.desc}</div>
            <button style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, background:r.bg, border:"none", color:r.color, fontFamily:D, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              <IcoDown /> Unduh Laporan
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
function PengumumanSection() {
  const [composing, setComposing] = useState(false);
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:D, fontWeight:800, fontSize:18, color:C.ink }}>Pengumuman Sekolah</div>
          <div style={{ fontSize:13, color:C.gray500, marginTop:2 }}>Buat dan kelola pengumuman untuk seluruh siswa</div>
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
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Judul Pengumuman *</label>
              <input placeholder="Masukkan judul pengumuman..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Target Penerima</label>
                <select style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", background:C.white, cursor:"pointer", boxSizing:"border-box" }}>
                  <option>Seluruh Siswa</option>
                  <option>XII IPA (Semua)</option>
                  <option>XII IPS (Semua)</option>
                  <option>XI IPA (Semua)</option>
                  <option>Kelas Tertentu...</option>
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Prioritas</label>
                <select style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", background:C.white, cursor:"pointer", boxSizing:"border-box" }}>
                  <option>Normal</option>
                  <option>Penting</option>
                  <option>Mendesak</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Isi Pengumuman</label>
              <textarea rows={4} placeholder="Tulis isi pengumuman di sini..." style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setComposing(false)} style={{ flex:1, padding:"11px", borderRadius:10, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Kirim Pengumuman
              </button>
              <button onClick={() => setComposing(false)} style={{ padding:"11px 20px", borderRadius:10, background:C.gray50, border:`1px solid ${C.gray200}`, color:C.gray700, fontFamily:D, fontWeight:600, fontSize:14, cursor:"pointer" }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.gray100}`, fontFamily:D, fontWeight:700, fontSize:14, color:C.ink }}>
          Pengumuman Terkirim ({ANNOUNCEMENTS.length})
        </div>
        {ANNOUNCEMENTS.map((a, i) => (
          <div key={i} style={{ padding:"16px 20px", borderTop: i>0?`1px solid ${C.gray100}`:"none", display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:C.blue50, color:C.blue2, display:"grid", placeItems:"center", flexShrink:0 }}>
              <IcoBell />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:14, color:C.ink }}>{a.title}</div>
              <div style={{ fontSize:12.5, color:C.gray500, margin:"4px 0 8px" }}>
                Untuk: <b style={{ color:C.ink }}>{a.target}</b> · {a.date}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12.5, color:C.gray500 }}>👁 {a.reads.toLocaleString()} dibaca</span>
                <span style={{ fontSize:12, padding:"3px 10px", borderRadius:99, background:C.greenSoft, color:C.greenDark, fontFamily:D, fontWeight:600 }}>Terkirim</span>
              </div>
            </div>
            <button style={{ padding:"7px 14px", borderRadius:9, border:`1px solid ${C.gray200}`, background:"transparent", color:C.gray600, fontFamily:D, fontWeight:600, fontSize:12.5, cursor:"pointer" }}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION: PENGATURAN
════════════════════════════════════════════════════════════════════════ */
function PengaturanSection({ schoolName }: { schoolName: string }) {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:20 }}>
        {/* School profile form */}
        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:20 }}>Profil Sekolah</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Nama Sekolah", placeholder: schoolName, type:"text" },
              { label:"NPSN / Nomor Sekolah", placeholder:"20101234", type:"text" },
              { label:"Email Admin", placeholder:"admin@sekolah.sch.id", type:"email" },
              { label:"Nomor Telepon", placeholder:"+62 21 1234 5678", type:"tel" },
            ].map((f, i) => (
              <div key={i}>
                <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>{f.label}</label>
                <input type={f.type} defaultValue={i===0?schoolName:""} placeholder={f.placeholder}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, color:C.ink, outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ display:"block", fontFamily:D, fontWeight:600, fontSize:13, color:C.ink, marginBottom:6 }}>Alamat Sekolah</label>
              <textarea rows={3} placeholder="Jalan, Kelurahan, Kecamatan, Kota/Kabupaten..."
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.gray200}`, fontFamily:S, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <button style={{ padding:"12px", borderRadius:10, background:`linear-gradient(135deg,${C.blue2},${C.blue})`, border:"none", color:C.white, fontFamily:D, fontWeight:700, fontSize:14, cursor:"pointer" }}>
              Simpan Perubahan
            </button>
          </div>
        </div>

        {/* Account & notifications */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Admin accounts */}
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink }}>Admin Sekolah</div>
              <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:9, background:C.blue50, border:"none", color:C.blue2, fontFamily:D, fontWeight:700, fontSize:12.5, cursor:"pointer" }}>
                <IcoPlus /> Tambah
              </button>
            </div>
            {[
              { name:"Bpk. Bambang Kurniawan", role:"Kepala Sekolah",  av:"BK", avBg:"linear-gradient(135deg,#3B82F6,#1D4ED8)" },
              { name:"Ibu. Sari Dewi, S.Pd",   role:"Admin Kurikulum", av:"SD", avBg:"linear-gradient(135deg,#10B981,#059669)" },
            ].map((a, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderTop:i>0?`1px solid ${C.gray100}`:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:a.avBg, display:"grid", placeItems:"center", fontFamily:D, fontWeight:800, fontSize:13, color:C.white, flexShrink:0 }}>{a.av}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:D, fontWeight:700, fontSize:13.5, color:C.ink }}>{a.name}</div>
                  <div style={{ fontSize:12, color:C.gray500 }}>{a.role}</div>
                </div>
                <span style={{ fontSize:12, padding:"3px 9px", borderRadius:99, background:C.greenSoft, color:C.greenDark, fontFamily:D, fontWeight:600 }}>Aktif</span>
              </div>
            ))}
          </div>

          {/* Notification settings */}
          <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.gray200}`, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:D, fontWeight:700, fontSize:15, color:C.ink, marginBottom:16 }}>Notifikasi</div>
            {[
              { label:"Email mingguan progres siswa", checked:true  },
              { label:"Notifikasi asesmen baru",       checked:true  },
              { label:"Alert siswa tidak aktif",        checked:true  },
              { label:"Newsletter Talentika",           checked:false },
            ].map((n, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderTop:i>0?`1px solid ${C.gray100}`:"none" }}>
                <span style={{ fontSize:13.5, color:C.gray700, fontFamily:S }}>{n.label}</span>
                <div style={{ width:42, height:24, borderRadius:12, background:n.checked?C.blue2:C.gray300, position:"relative", cursor:"pointer", transition:"background .2s" }}>
                  <div style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:C.white, top:3, left:n.checked?21:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
                </div>
              </div>
            ))}
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
  const [profile, setProfile]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      supabase.from("profiles").select("full_name, organization_name, subscription_type")
        .eq("id", session.user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false); });
    });
  }, [navigate]);

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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  const schoolName   = profile?.organization_name || profile?.full_name || "SMA Cerdas Bangsa";
  const userInitials = schoolName.split(" ").slice(0,2).map((w: string) => w[0]).join("").toUpperCase();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.gray50, fontFamily:S }}>
      <Sidebar sec={sec} setSec={setSec} collapsed={collapsed} onCollapse={setCollapsed}
        schoolName={schoolName} onSignOut={handleSignOut} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
        <TopBar sec={sec} schoolName={schoolName} userInitials={userInitials} />
        <main style={{ flex:1, overflowY:"auto" }}>
          {sec==="dashboard"  && <OverviewSection />}
          {sec==="siswa"      && <SiswaSection />}
          {sec==="kursus"     && <KursusSection />}
          {sec==="mentoring"  && <MentoringSection />}
          {sec==="asesmen"    && <AsesmenSection />}
          {sec==="laporan"    && <LaporanSection />}
          {sec==="pengumuman" && <PengumumanSection />}
          {sec==="pengaturan" && <PengaturanSection schoolName={schoolName} />}
        </main>
      </div>
    </div>
  );
}
