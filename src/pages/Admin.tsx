import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard, BookOpen, Tag, Trophy, FileText,
  Briefcase, Users, CreditCard, ChevronRight,
  Loader2, ArrowLeft, LogOut, School, GraduationCap, Activity, CalendarDays,
  Compass, BookMarked, ShieldCheck, Smartphone,
} from "lucide-react";
import { Category, NavSection } from "@/components/admin/adminShared";
import ErrorBoundary from "@/components/ErrorBoundary";

// ─── Lazy section imports ─────────────────────────────────────────────────────
const Overview          = lazy(() => import("@/components/admin/sections/Overview"));
const LearningContentCMS = lazy(() => import("@/components/admin/sections/LearningContentCMS"));
const LearningPathBuilder = lazy(() => import("@/components/admin/LearningPathBuilder").then(m => ({ default: m.LearningPathBuilder })));
const CategoriesCMS     = lazy(() => import("@/components/admin/sections/CategoriesCMS"));
const ChallengesCMS     = lazy(() => import("@/components/admin/sections/ChallengesCMS"));
const ArticlesCMS       = lazy(() => import("@/components/admin/sections/ArticlesCMS"));
const OpportunitiesCMS  = lazy(() => import("@/components/admin/sections/OpportunitiesCMS"));
const PremiumProgramsCMS = lazy(() => import("@/components/admin/sections/PremiumProgramsCMS"));
const BootcampsCMS      = lazy(() => import("@/components/admin/sections/BootcampsCMS"));
const SchoolInquiriesCMS = lazy(() => import("@/components/admin/sections/SchoolInquiriesCMS"));
const PenggunaCMS       = lazy(() => import("@/components/admin/sections/PenggunaCMS"));
const PaymentsCMS       = lazy(() => import("@/components/admin/sections/PaymentsCMS"));
const SchoolsCMS        = lazy(() => import("@/components/admin/sections/SchoolsCMS"));
const MentorsCMS        = lazy(() => import("@/components/admin/sections/MentorsCMS"));
const EventsCMS         = lazy(() => import("@/components/admin/sections/EventsCMS"));
const SystemHealthCMS   = lazy(() => import("@/components/admin/sections/SystemHealthCMS"));
// Aplikasi mobile (PRD Talentika Mobile v1.0)
const CareersCMS        = lazy(() => import("@/components/admin/sections/CareersCMS"));
const PlaybooksCMS      = lazy(() => import("@/components/admin/sections/PlaybooksCMS"));
const ReviewQueueCMS    = lazy(() => import("@/components/admin/sections/ReviewQueueCMS"));
const MobileAppCMS      = lazy(() => import("@/components/admin/sections/MobileAppCMS"));

// ─── Design constants ─────────────────────────────────────────────────────────
const SIDEBAR_W      = 240;
const SIDEBAR_BG     = "#0F172A";
const SIDEBAR_HOVER  = "#1E293B";
const SIDEBAR_ACTIVE = "#2563EB";

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: "overview",      label: "Overview",         icon: LayoutDashboard },
  { id: "content",       label: "Learning Content",  icon: BookOpen },
  { id: "paths",         label: "Jalur Belajar",     icon: GraduationCap },
  { id: "bootcamps",     label: "Bootcamp",          icon: BookOpen },
  { id: "categories",    label: "Kategori",          icon: Tag },
  { id: "challenges",    label: "Tantangan",         icon: Trophy },
  { id: "articles",      label: "Artikel",           icon: FileText },
  { id: "opportunities", label: "Peluang",           icon: Briefcase },
  { id: "premium_programs", label: "Program Premium", icon: Briefcase },
  { id: "events",        label: "Event",             icon: CalendarDays },
  { id: "users",         label: "Pengguna",          icon: Users },
  { id: "schools",       label: "Sekolah",           icon: School },
  { id: "school_inquiries", label: "Permintaan Sekolah", icon: School },
  { id: "mentors",       label: "Mentor",            icon: GraduationCap },
  { id: "careers",       label: "Karier & Kampus",   icon: Compass },
  { id: "playbooks",     label: "Playbook",          icon: BookMarked },
  { id: "review",        label: "Verifikasi & Moderasi", icon: ShieldCheck },
  { id: "mobile_app",    label: "Aplikasi Mobile",   icon: Smartphone },
  { id: "payments",      label: "Pembayaran",        icon: CreditCard },
  { id: "health",        label: "Kesehatan Sistem",  icon: Activity },
];

const PAGE_TITLES: Record<NavSection, string> = {
  overview: "Overview", content: "Learning Content", paths: "Jalur Belajar", categories: "Kategori",
  challenges: "Tantangan", articles: "Artikel", opportunities: "Peluang",
  premium_programs: "Program Premium", bootcamps: "Bootcamp", school_inquiries: "Permintaan Sekolah",
  users: "Pengguna", schools: "Sekolah", mentors: "Mentor", payments: "Pembayaran",
  health: "Kesehatan Sistem", events: "Event",
  careers: "Karier & Kampus", playbooks: "Playbook", review: "Verifikasi & Moderasi", mobile_app: "Aplikasi Mobile",
};

const SectionFallback = () => (
  <div style={{ padding: 60, textAlign: "center" }}>
    <Loader2 size={28} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} />
  </div>
);

// ─── Main Admin shell ─────────────────────────────────────────────────────────
const Admin = () => {
  const navigate   = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [section, setSection]     = useState<NavSection>("overview");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("Akses ditolak. Bukan admin."); navigate("/dashboard"); return; }
      loadCategories();
      setLoading(false);
    })();
  }, [navigate]);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from("learning_categories").select("*").order("name");
    setCategories(data ?? []);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#2563EB" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F1F5F9" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{
        width: SIDEBAR_W, flexShrink: 0, background: SIDEBAR_BG,
        display: "flex", flexDirection: "column",
        position: "fixed", inset: "0 auto 0 0", zIndex: 100,
        overflowY: "auto",
      }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
            <div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "white" }}>Talentika</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 1, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>Admin CMS</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 11,
                padding: "10px 12px", borderRadius: 10, border: "none", marginBottom: 2,
                background: active ? SIDEBAR_ACTIVE : "transparent",
                color: active ? "white" : "rgba(255,255,255,.65)",
                fontWeight: active ? 700 : 500, fontSize: 13.5,
                fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                transition: "all .15s", textAlign: "left",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; (e.currentTarget as HTMLElement).style.color = "white"; }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.65)"; } }}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.7 }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "12px 10px 20px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => navigate("/dashboard")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer", marginBottom: 4, fontFamily: "var(--tk-font-sans)" }}>
            <ArrowLeft size={15} /> Dashboard
          </button>
          <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 9, border: "none", background: "transparent", color: "rgba(239,68,68,.75)", fontSize: 13, cursor: "pointer", fontFamily: "var(--tk-font-sans)" }}>
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, marginLeft: SIDEBAR_W, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>Admin</span>
            <ChevronRight size={12} color="#CBD5E1" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", fontFamily: "var(--tk-font-display)" }}>{PAGE_TITLES[section]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>Admin Panel</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "28px 32px 48px" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "#0F172A", margin: "0 0 4px" }}>
              {PAGE_TITLES[section]}
            </h1>
            <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
              {section === "overview"      && "Ringkasan semua konten dan aktivitas platform"}
              {section === "content"       && "Kelola semua konten pembelajaran — tambah, edit, toggle status"}
              {section === "paths"         && "Kelompokkan konten menjadi jalur belajar berurutan per tipe RIASEC"}
              {section === "categories"    && "Kelola kategori konten pembelajaran"}
              {section === "challenges"    && "Kelola tantangan komunitas dengan XP reward"}
              {section === "articles"      && "Kelola artikel dan blog platform"}
              {section === "opportunities" && "Kelola peluang kerja dan magang"}
              {section === "users"         && "Kelola pengguna terdaftar"}
              {section === "schools"       && "Verifikasi sekolah terdaftar (badge NPSN)"}
              {section === "mentors"       && "Tinjau & setujui aplikasi mentor"}
              {section === "events"        && "Buat, terbitkan, dan kelola event — tampil di halaman Komunitas siswa"}
              {section === "payments"      && "Revenue, transaksi Mayar, paket berlangganan & voucher"}
              {section === "health"        && "Deteksi dini kegagalan senyap — email, spam, notifikasi, pembayaran, integritas data"}
              {section === "careers"       && "Katalog karier (Career Fit, Compare, Simulator) dan kampus untuk aplikasi mobile"}
              {section === "playbooks"     && "Playbook Store — harga, sampul, dan PDF privat yang dibuka pembeli"}
              {section === "review"        && "Verifikasi prestasi siswa dan tinjau laporan konten komunitas"}
              {section === "mobile_app"    && "Bank soal Talent DNA, bobot Career Readiness, pengaturan AI, dan analitik aplikasi"}
            </p>
          </div>

          <ErrorBoundary>
          <Suspense fallback={<SectionFallback />}>
            {section === "overview"      && <Overview onNav={setSection} />}
            {section === "content"       && <LearningContentCMS categories={categories} />}
            {section === "paths"         && <LearningPathBuilder />}
            {section === "categories"    && <CategoriesCMS onReload={loadCategories} />}
            {section === "challenges"    && <ChallengesCMS />}
            {section === "articles"      && <ArticlesCMS />}
            {section === "opportunities" && <OpportunitiesCMS />}
            {section === "premium_programs" && <PremiumProgramsCMS />}
            {section === "bootcamps"     && <BootcampsCMS />}
            {section === "school_inquiries" && <SchoolInquiriesCMS />}
            {section === "users"         && <PenggunaCMS />}
            {section === "schools"       && <SchoolsCMS />}
            {section === "mentors"       && <MentorsCMS />}
            {section === "events"        && <EventsCMS />}
            {section === "payments"      && <PaymentsCMS />}
            {section === "health"        && <SystemHealthCMS />}
            {section === "careers"       && <CareersCMS />}
            {section === "playbooks"     && <PlaybooksCMS />}
            {section === "review"        && <ReviewQueueCMS />}
            {section === "mobile_app"    && <MobileAppCMS />}
          </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Admin;
