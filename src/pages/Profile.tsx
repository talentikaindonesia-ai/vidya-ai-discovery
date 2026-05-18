/**
 * Profile — unified Profile + Membership page
 *
 * Merges the old /profile identity page with MembershipDashboard (/membership)
 * into a single destination accessible from the bottom nav "Profile" tab.
 *
 * Layout:
 *   Left  — identity card (avatar, name, subscription badge, mini-stats)
 *   Right — tab-based sections:
 *             Profil | Pembelajaran | Portfolio | Mentorship | Jaringan | Pengaturan
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { PortfolioBuilder } from "@/components/membership/PortfolioBuilder";
import { MentorshipBooking } from "@/components/membership/MentorshipBooking";
import { NetworkingHub } from "@/components/membership/NetworkingHub";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Pen, Award, GraduationCap, ChevronRight,
  User as UserIcon, Lock, Bell, Sun, LogOut,
  Crown, Star, Target, FileText, Calendar,
  TrendingUp, CheckCircle, Clock, Zap,
  BookOpen, Users, Diamond,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─────────────────────────────────── helpers ── */
const getInitials = (name: string) =>
  name.split(" ").map(w => w.charAt(0)).join("").toUpperCase().slice(0, 2);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const FALLBACK_INTERESTS = ["UI/UX Design", "Ilustrasi Digital", "Public Speaking", "Startup", "AI for Creators"];

const courseIcons: Record<string, { emoji: string; bg: string }> = {
  default:  { emoji: "📚", bg: "#E8F1FF" },
  design:   { emoji: "🎨", bg: "#EDE9FE" },
  tech:     { emoji: "💻", bg: "#D1FAE5" },
  business: { emoji: "📊", bg: "#FFEDE2" },
  language: { emoji: "🗣️", bg: "#FEF3C7" },
};
const getCourseIcon = (cat = "") => {
  const c = cat.toLowerCase();
  if (c.includes("design") || c.includes("desain") || c.includes("visual")) return courseIcons.design;
  if (c.includes("tech") || c.includes("program") || c.includes("coding"))  return courseIcons.tech;
  if (c.includes("bisnis") || c.includes("business") || c.includes("startup")) return courseIcons.business;
  if (c.includes("bahasa") || c.includes("language") || c.includes("speaking")) return courseIcons.language;
  return courseIcons.default;
};

/* ─────────────────────────────────── tab config ── */
type Tab = "profil" | "pembelajaran" | "portfolio" | "mentorship" | "jaringan" | "pengaturan";

const TABS: { id: Tab; label: string; icon: any; premiumOnly?: boolean }[] = [
  { id: "profil",       label: "Profil",       icon: UserIcon },
  { id: "pembelajaran", label: "Pembelajaran",  icon: BookOpen },
  { id: "portfolio",    label: "Portfolio",     icon: FileText,  premiumOnly: true },
  { id: "mentorship",   label: "Mentorship",    icon: Calendar,  premiumOnly: true },
  { id: "jaringan",     label: "Jaringan",      icon: Users,     premiumOnly: true },
  { id: "pengaturan",   label: "Pengaturan",    icon: Lock },
];

/* ─────────────────────────────────── component ── */
const Profile = () => {
  const [user, setUser]           = useState<User | null>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [userRole, setUserRole]   = useState<string | null>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [progress, setProgress]   = useState<any[]>([]);
  const [assessment, setAssessment]   = useState<any>(null);
  const [badgeCount, setBadgeCount]   = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [portfolioStats, setPortfolioStats]   = useState({ total: 0, featured: 0 });
  const [mentorshipStats, setMentorshipStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const isMobile = useIsMobile();

  /* ── auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else loadData(session.user.id);
    });
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      if (event === "SIGNED_IN" && session) loadData(session.user.id);
    });
    return () => sub.unsubscribe();
  }, [navigate]);

  /* ── data ── */
  const loadData = async (userId: string) => {
    try {
      const [
        { data: profileData },
        { data: roleData },
        { data: interestsData },
        { data: progressData },
        { data: assessmentData },
        { data: achievementsData },
        { data: subData },
      ] = await Promise.all([
        supabase.rpc("get_profile_secure", { profile_user_id: userId }).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("user_interests").select("*, interest_categories(name)").eq("user_id", userId),
        supabase.from("learning_progress")
          .select("*, learning_content(title, learning_categories(name))")
          .eq("user_id", userId).limit(5),
        supabase.from("assessment_results")
          .select("personality_type, career_recommendations, talent_areas, completed_at")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("achievements").select("id").eq("user_id", userId),
        supabase.from("user_subscriptions")
          .select("*, subscription_packages(*)")
          .eq("user_id", userId).eq("status", "active").maybeSingle(),
      ]);

      setProfile(profileData);
      setUserRole(roleData?.role ?? "individual");
      setInterests(interestsData ?? []);
      setProgress(progressData ?? []);
      setAssessment(assessmentData);
      setBadgeCount(achievementsData?.length ?? 0);

      if (subData) {
        // features is Json in the schema — already parsed by Supabase client.
        // Guard for rare edge-case where it arrives as a JSON string.
        const rawFeatures = subData.subscription_packages?.features;
        const features: string[] = Array.isArray(rawFeatures)
          ? rawFeatures as string[]
          : typeof rawFeatures === "string"
            ? (() => { try { return JSON.parse(rawFeatures); } catch { return []; } })()
            : [];
        setSubscription({ ...subData, subscription_packages: { ...subData.subscription_packages, features } });
      }

      // Portfolio + mentorship stats
      const [
        { count: portTotal },
        { count: portFeatured },
        { count: mentTotal },
        { count: mentCompleted },
      ] = await Promise.all([
        supabase.from("portfolio_items").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("portfolio_items").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_featured", true),
        supabase.from("mentorship_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("mentorship_sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "completed"),
      ]);
      setPortfolioStats({ total: portTotal ?? 0, featured: portFeatured ?? 0 });
      setMentorshipStats({ total: mentTotal ?? 0, completed: mentCompleted ?? 0 });
    } catch (err) {
      console.error("Error loading profile data:", err);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil logout");
    navigate("/");
  };
  const handleNav = (section: string) => {
    if (section === "community") { navigate("/community"); return; }
    if (section === "timeline")  { navigate("/discovery"); return; }
    navigate("/dashboard");
  };

  /* ── derived ── */
  const displayName   = profile?.full_name || user?.email || "Pengguna";
  const initials      = getInitials(displayName);
  const coursesCount  = progress.length;
  const certsCount    = progress.filter((p: any) => p.progress_percentage === 100 || p.status === "completed").length;
  const isPremium     = ["premium", "premium_individual", "premium_school", "enterprise"].includes(
    subscription?.subscription_packages?.type ?? ""
  );
  const planName      = subscription?.subscription_packages?.name ?? null;

  const completionPct = Math.round(
    ([assessment != null, portfolioStats.total > 0, mentorshipStats.total > 0].filter(Boolean).length / 3) * 100
  );

  const interestLabels: string[] =
    interests.length > 0
      ? interests.map((i: any) => i.interest_categories?.name ?? i.category_name ?? "").filter(Boolean)
      : FALLBACK_INTERESTS;

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--tk-gray-50)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full mx-auto mb-4"
            style={{ width: 48, height: 48, border: "3px solid var(--tk-gray-200)", borderTopColor: "var(--tk-blue-600)" }} />
          <p style={{ color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-sans)" }}>Memuat profil…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  /* ────────────────────────────────────────────────── render ── */
  return (
    <div className="min-h-screen flex w-full" style={{ background: "var(--tk-gray-50)" }}>
      <DashboardSidebar activeSection="profile" setActiveSection={handleNav} onSignOut={handleSignOut} userRole={userRole} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader user={user} profile={profile} onSignOut={handleSignOut} />

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "#fff", borderColor: "var(--tk-gray-200)" }}>
          <div className="flex items-center gap-2.5">
            <img src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png" alt="Talentika" className="w-8 h-8 object-contain" />
            <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-blue-600)" }}>Talentika</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown userId={user?.id} />
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-auto pb-20 md:pb-6" style={{ padding: isMobile ? "16px 16px 80px" : "28px 28px 60px" }}>
          <div style={{ maxWidth: 1140, margin: "0 auto" }}>

            {/* ── Page title ── */}
            <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "flex-start", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 28, color: "var(--tk-ink)", margin: 0 }}>
                  Profil &amp; Keanggotaan
                </h1>
                <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-gray-500)", marginTop: 4 }}>
                  Identitas, minat, membership, dan progress karir Anda di Talentika.
                </p>
              </div>
              <button onClick={() => navigate("/settings")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--tk-radius)", border: "1.5px solid var(--tk-blue-600)", background: "transparent", color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                <Pen size={14} /> Edit Profil
              </button>
            </div>

            {/* ── Two-column layout ── */}
            <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "300px 1fr", gap: 20, alignItems: "start" }}>

              {/* ══════════ LEFT: Identity Card ══════════ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Identity card */}
                <div style={{ background: "#fff", borderRadius: 20, padding: 24, textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,.07)", border: "1px solid var(--tk-gray-100)" }}>

                  {/* Subscription badge banner */}
                  {subscription ? (
                    <div style={{ background: isPremium ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#2563EB,#1D4ED8)", borderRadius: 12, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {isPremium ? <Crown size={14} color="#fff" /> : <Star size={14} color="#fff" />}
                      <span style={{ color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13 }}>{planName}</span>
                      <span style={{ background: "rgba(255,255,255,.25)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999 }}>AKTIF</span>
                    </div>
                  ) : (
                    <button onClick={() => navigate("/subscription")}
                      style={{ width: "100%", background: "linear-gradient(135deg,#E8F1FF,#FFEDE2)", borderRadius: 12, padding: "8px 12px", marginBottom: 16, border: "1.5px dashed #CBD5E1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Diamond size={14} style={{ color: "var(--tk-blue-600)" }} />
                      <span style={{ fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 13, color: "var(--tk-blue-600)" }}>Upgrade ke Premium</span>
                    </button>
                  )}

                  {/* Avatar */}
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName}
                      style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block", border: "3px solid var(--tk-gray-100)" }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#1D4ED8,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, margin: "0 auto 12px" }}>
                      {initials}
                    </div>
                  )}

                  <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 19, color: "var(--tk-ink)", margin: "0 0 4px" }}>{displayName}</h3>
                  <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13, color: "var(--tk-gray-500)", margin: "0 0 14px", wordBreak: "break-all" }}>{user.email}</p>

                  {/* Personality pills */}
                  {(assessment?.personality_type || assessment?.career_recommendations?.[0]) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 14 }}>
                      {[assessment.personality_type, assessment.career_recommendations?.[0]].filter(Boolean).map((p: string, i: number) => (
                        <span key={i} style={{ background: "#FFF7ED", color: "#D97706", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 11, padding: "3px 10px", borderRadius: 999 }}>{p}</span>
                      ))}
                    </div>
                  )}

                  {/* Mini stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--tk-gray-100)", borderBottom: "1px solid var(--tk-gray-100)", padding: "14px 0", margin: "0 0 16px" }}>
                    {[
                      { icon: <Award size={15} />, value: badgeCount,    label: "Badges" },
                      { icon: <BookOpen size={15} />, value: coursesCount, label: "Kursus" },
                      { icon: <Award size={15} style={{ color: "#F59E0B" }} />, value: certsCount, label: "Sertifikat" },
                    ].map(({ icon, value, label }, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", color: "var(--tk-blue-600)", marginBottom: 2 }}>{icon}</div>
                        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "var(--tk-ink)" }}>{value}</div>
                        <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 10.5, color: "var(--tk-gray-500)" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate("/settings")}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: "var(--tk-radius)", border: "1.5px solid var(--tk-blue-600)", background: "transparent", color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    <Pen size={14} /> Edit Profil
                  </button>
                </div>

                {/* Membership progress card (only when subscribed) */}
                {subscription && (
                  <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 4px 24px rgba(0,0,0,.07)", border: "1px solid var(--tk-gray-100)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <TrendingUp size={15} style={{ color: "var(--tk-blue-600)" }} />
                      <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "var(--tk-ink)" }}>Progress Keanggotaan</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12, color: "var(--tk-gray-500)" }}>Penyelesaian</span>
                      <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12, color: "var(--tk-blue-600)" }}>{completionPct}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--tk-gray-100)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
                      <div style={{ height: "100%", width: `${completionPct}%`, background: "linear-gradient(90deg,#2563EB,#60A5FA)", borderRadius: 999, transition: "width .5s" }} />
                    </div>
                    {/* Steps */}
                    {[
                      { done: assessment != null,          label: "Assessment Selesai" },
                      { done: portfolioStats.total > 0,   label: `Portfolio (${portfolioStats.total} item)` },
                      { done: mentorshipStats.total > 0,  label: `Mentorship (${mentorshipStats.completed}/${mentorshipStats.total} sesi)` },
                    ].map(({ done, label }, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                        {done
                          ? <CheckCircle size={14} style={{ color: "#059669", flexShrink: 0 }} />
                          : <Clock size={14} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />}
                        <span style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12.5, color: done ? "var(--tk-ink)" : "var(--tk-gray-500)" }}>{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick links */}
                <div style={{ background: "#fff", borderRadius: 20, padding: "12px 16px", boxShadow: "0 4px 24px rgba(0,0,0,.07)", border: "1px solid var(--tk-gray-100)" }}>
                  {TABS.map((tab, i) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", background: "none", border: "none", borderBottom: i < TABS.length - 1 ? "1px solid var(--tk-gray-100)" : "none", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: activeTab === tab.id ? "var(--tk-blue-50)" : "var(--tk-gray-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <tab.icon size={14} style={{ color: activeTab === tab.id ? "var(--tk-blue-600)" : "var(--tk-gray-400)" }} />
                        </div>
                        <span style={{ fontFamily: "var(--tk-font-sans)", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13.5, color: activeTab === tab.id ? "var(--tk-blue-600)" : "var(--tk-ink)" }}>
                          {tab.label}
                        </span>
                        {tab.premiumOnly && !subscription && (
                          <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999 }}>PRO</span>
                        )}
                      </div>
                      <ChevronRight size={13} style={{ color: activeTab === tab.id ? "var(--tk-blue-600)" : "var(--tk-gray-400)" }} />
                    </button>
                  ))}
                </div>
              </div>
              {/* end LEFT */}

              {/* ══════════ RIGHT: Tab content ══════════ */}
              <div style={{ minWidth: 0 }}>

                {/* Tab pill bar */}
                <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" as any, marginBottom: 18, paddingBottom: isMobile ? 4 : 0 }}>
                  {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, border: "none", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s", flexShrink: 0,
                        background: activeTab === tab.id ? "var(--tk-blue-600)" : "#fff",
                        color: activeTab === tab.id ? "#fff" : "var(--tk-gray-600)",
                        boxShadow: activeTab === tab.id ? "0 2px 8px rgba(37,99,235,.3)" : "0 1px 4px rgba(0,0,0,.06)",
                      }}>
                      <tab.icon size={13} />
                      {tab.label}
                      {tab.premiumOnly && !subscription && (
                        <span style={{ background: "#FEF3C7", color: "#D97706", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999 }}>PRO</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Tab: Profil ── */}
                {activeTab === "profil" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Assessment result banner */}
                    {assessment && (
                      <div style={{ background: "linear-gradient(135deg,#E8F1FF 0%,#FFEDE2 100%)", borderRadius: 16, padding: "20px 24px", border: "1px solid #BFDBFE" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <Target size={16} style={{ color: "var(--tk-blue-600)" }} />
                          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>Hasil Assessment Terbaru</span>
                          {assessment.completed_at && (
                            <span style={{ fontSize: 11, color: "var(--tk-gray-500)", marginLeft: "auto" }}>{fmtDate(assessment.completed_at)}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                          {assessment.personality_type && (
                            <div>
                              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 11, color: "var(--tk-gray-500)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Tipe Kepribadian</div>
                              <span style={{ background: "var(--tk-blue-600)", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 999 }}>{assessment.personality_type}</span>
                            </div>
                          )}
                          {assessment.talent_areas?.length > 0 && (
                            <div>
                              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 11, color: "var(--tk-gray-500)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Area Talenta</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {assessment.talent_areas.slice(0, 3).map((t: string, i: number) => (
                                  <span key={i} style={{ background: "#fff", border: "1px solid #CBD5E1", color: "var(--tk-ink)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {assessment.career_recommendations?.length > 0 && (
                            <div>
                              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 11, color: "var(--tk-gray-500)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Rekomendasi Karir</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {assessment.career_recommendations.slice(0, 3).map((c: string, i: number) => (
                                  <span key={i} style={{ background: "#FFF7ED", color: "#D97706", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>{c}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button onClick={() => navigate("/assessment")}
                          style={{ marginTop: 14, background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, fontFamily: "var(--tk-font-sans)", cursor: "pointer" }}>
                          Tes Ulang
                        </button>
                      </div>
                    )}
                    {!assessment && (
                      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", textAlign: "center", border: "1.5px dashed #CBD5E1" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
                        <h4 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: "0 0 6px" }}>Belum Ada Assessment</h4>
                        <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13, color: "var(--tk-gray-500)", margin: "0 0 14px" }}>Kenali potensi dan minat bakatmu</p>
                        <button onClick={() => navigate("/assessment")}
                          style={{ background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, fontFamily: "var(--tk-font-sans)", cursor: "pointer" }}>
                          Mulai Assessment
                        </button>
                      </div>
                    )}

                    {/* Bio */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid var(--tk-gray-100)" }}>
                      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", margin: "0 0 10px" }}>Tentang Saya</h3>
                      {profile?.bio || profile?.description ? (
                        <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-gray-600)", lineHeight: 1.7, margin: 0 }}>
                          {profile.bio || profile.description}
                        </p>
                      ) : (
                        <div style={{ textAlign: "center", padding: "6px 0" }}>
                          <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13, color: "var(--tk-gray-400)", margin: "0 0 10px" }}>Belum ada bio. Tambahkan bio untuk memperkenalkan dirimu.</p>
                          <button onClick={() => navigate("/settings")}
                            style={{ background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, fontFamily: "var(--tk-font-sans)", cursor: "pointer" }}>
                            + Tambah Bio
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interests */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid var(--tk-gray-100)" }}>
                      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", margin: "0 0 12px" }}>Minat &amp; Tujuan</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {interestLabels.map((label, i) => (
                          <span key={i} style={{ background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 13, padding: "5px 14px", borderRadius: 999 }}>{label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Tab: Pembelajaran ── */}
                {activeTab === "pembelajaran" && (
                  <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid var(--tk-gray-100)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>Riwayat Pembelajaran</h3>
                      <button onClick={() => navigate("/dashboard")}
                        style={{ background: "none", border: "none", color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}>
                        Lihat Semua →
                      </button>
                    </div>
                    {progress.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
                        <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13, color: "var(--tk-gray-400)", margin: 0 }}>Belum ada riwayat pembelajaran.</p>
                      </div>
                    ) : (
                      progress.map((item: any, i: number) => {
                        const title    = item.learning_content?.title ?? "Kursus";
                        const category = item.learning_content?.learning_categories?.name ?? "";
                        const pct      = item.progress_percentage ?? 0;
                        const done     = pct >= 100 || item.status === "completed";
                        const ci       = getCourseIcon(category);
                        return (
                          <div key={item.id ?? i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--tk-gray-100)" }}>
                            <div style={{ width: 42, height: 42, borderRadius: 11, background: ci.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{ci.emoji}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14, color: "var(--tk-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12, color: "var(--tk-gray-500)", marginTop: 2 }}>{category}{category && " · "}{pct}% selesai</div>
                              {/* Progress bar */}
                              <div style={{ height: 4, background: "var(--tk-gray-100)", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: done ? "#059669" : "var(--tk-blue-600)", borderRadius: 999 }} />
                              </div>
                            </div>
                            <span style={{ flexShrink: 0, background: done ? "#D1FAE5" : "var(--tk-gray-100)", color: done ? "#059669" : "var(--tk-gray-600)", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 11, padding: "3px 9px", borderRadius: 999 }}>
                              {done ? "Selesai" : "Berjalan"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── Tab: Portfolio ── */}
                {activeTab === "portfolio" && (
                  subscription ? (
                    <PortfolioBuilder userId={user?.id} />
                  ) : (
                    <UpgradeCTA feature="Portfolio Builder" onUpgrade={() => navigate("/subscription")} />
                  )
                )}

                {/* ── Tab: Mentorship ── */}
                {activeTab === "mentorship" && (
                  subscription ? (
                    <MentorshipBooking userId={user?.id} userPlan={isPremium ? "premium" : "individual"} />
                  ) : (
                    <UpgradeCTA feature="Mentorship Booking" onUpgrade={() => navigate("/subscription")} />
                  )
                )}

                {/* ── Tab: Jaringan ── */}
                {activeTab === "jaringan" && (
                  subscription ? (
                    <NetworkingHub userId={user?.id} userPlan={isPremium ? "premium" : "individual"} />
                  ) : (
                    <UpgradeCTA feature="Networking Hub" onUpgrade={() => navigate("/subscription")} />
                  )
                )}

                {/* ── Tab: Pengaturan ── */}
                {activeTab === "pengaturan" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Subscription card */}
                    <div style={{ background: subscription ? "linear-gradient(135deg,#1D4ED8,#2563EB)" : "#fff", borderRadius: 16, padding: 20, border: subscription ? "none" : "1px solid var(--tk-gray-100)", boxShadow: "0 2px 12px rgba(0,0,0,.07)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: subscription ? "rgba(255,255,255,.2)" : "var(--tk-blue-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isPremium ? <Crown size={20} style={{ color: subscription ? "#fff" : "var(--tk-blue-600)" }} />
                            : subscription ? <Star size={20} color="#fff" /> : <Zap size={20} style={{ color: "var(--tk-blue-600)" }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: subscription ? "#fff" : "var(--tk-ink)" }}>
                            {subscription ? planName : "Belum Berlangganan"}
                          </div>
                          <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12.5, color: subscription ? "rgba(255,255,255,.7)" : "var(--tk-gray-500)" }}>
                            {subscription ? "Membership aktif" : "Upgrade untuk fitur lengkap"}
                          </div>
                        </div>
                        <button onClick={() => navigate("/subscription")}
                          style={{ flexShrink: 0, background: subscription ? "rgba(255,255,255,.2)" : "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, fontFamily: "var(--tk-font-sans)", cursor: "pointer" }}>
                          {subscription ? "Kelola" : "Upgrade"}
                        </button>
                      </div>
                    </div>

                    {/* Account settings list */}
                    <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid var(--tk-gray-100)" }}>
                      <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", margin: "0 0 12px" }}>Pengaturan Akun</h3>
                      {[
                        { icon: <UserIcon size={17} style={{ color: "var(--tk-blue-600)" }} />, label: "Informasi Akun",      onClick: () => navigate("/settings") },
                        { icon: <Lock     size={17} style={{ color: "var(--tk-blue-600)" }} />, label: "Keamanan & Password",  onClick: () => navigate("/settings") },
                        { icon: <Bell     size={17} style={{ color: "var(--tk-blue-600)" }} />, label: "Notifikasi",           onClick: () => navigate("/settings") },
                        { icon: <Sun      size={17} style={{ color: "var(--tk-blue-600)" }} />, label: "Tampilan",             onClick: toggleTheme },
                        { icon: <LogOut   size={17} style={{ color: "#EF4444" }} />,             label: "Keluar",               onClick: handleSignOut, danger: true },
                      ].map(({ icon, label, onClick, danger }, i, arr) => (
                        <button key={i} onClick={onClick}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", background: "none", border: "none", borderBottom: i < arr.length - 1 ? "1px solid var(--tk-gray-100)" : "none", cursor: "pointer", textAlign: "left" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {icon}
                            <span style={{ fontFamily: "var(--tk-font-sans)", fontWeight: 500, fontSize: 14, color: (danger as any) ? "#EF4444" : "var(--tk-ink)" }}>{label}</span>
                          </div>
                          {!(danger as any) && <ChevronRight size={15} style={{ color: "var(--tk-gray-400)" }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* end RIGHT */}
            </div>

            {/* Responsive styles */}
            <style>{`
              @media (max-width: 768px) {
                .profile-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </main>

        <BottomNavigationBar activeSection="profile" onSectionChange={handleNav} />
      </div>
    </div>
  );
};

/* ── Upgrade CTA — shown for premium tabs when user has no subscription ── */
const UpgradeCTA = ({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) => (
  <div style={{ background: "#fff", borderRadius: 16, padding: "48px 32px", textAlign: "center", border: "1.5px dashed #CBD5E1", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
    <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#E8F1FF,#FFEDE2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
      <Crown size={28} style={{ color: "#D97706" }} />
    </div>
    <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 20, color: "var(--tk-ink)", margin: "0 0 8px" }}>Fitur Premium</h3>
    <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-gray-500)", margin: "0 0 24px" }}>
      <strong style={{ color: "var(--tk-ink)" }}>{feature}</strong> tersedia untuk member berbayar.<br />
      Upgrade sekarang dan akses semua fitur eksklusif Talentika.
    </p>
    <button onClick={onUpgrade}
      style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, fontFamily: "var(--tk-font-sans)", cursor: "pointer", boxShadow: "0 4px 16px rgba(37,99,235,.35)" }}>
      Lihat Paket &amp; Upgrade
    </button>
  </div>
);

export default Profile;
