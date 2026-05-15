import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Pen,
  Award,
  GraduationCap,
  ChevronRight,
  User as UserIcon,
  Lock,
  Bell,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/* ─────────────────────────────────────────── helpers ── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

const FALLBACK_INTERESTS = [
  "UI/UX Design",
  "Ilustrasi Digital",
  "Public Speaking",
  "Startup",
  "AI for Creators",
];

const courseIcons: Record<string, { emoji: string; bg: string }> = {
  default:   { emoji: "📚", bg: "#E8F1FF" },
  design:    { emoji: "🎨", bg: "#EDE9FE" },
  tech:      { emoji: "💻", bg: "#D1FAE5" },
  business:  { emoji: "📊", bg: "#FFEDE2" },
  language:  { emoji: "🗣️", bg: "#FEF3C7" },
};

const getCourseIcon = (category = "") => {
  const c = category.toLowerCase();
  if (c.includes("design") || c.includes("desain") || c.includes("visual"))
    return courseIcons.design;
  if (c.includes("tech") || c.includes("program") || c.includes("coding"))
    return courseIcons.tech;
  if (c.includes("bisnis") || c.includes("business") || c.includes("startup"))
    return courseIcons.business;
  if (c.includes("bahasa") || c.includes("language") || c.includes("speaking"))
    return courseIcons.language;
  return courseIcons.default;
};

/* ─────────────────────────────────────────── component ── */
const Profile = () => {
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [interests, setInterests]   = useState<any[]>([]);
  const [progress, setProgress]     = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  /* ── auth ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) navigate("/auth");
        if (event === "SIGNED_IN" && session) loadData(session.user.id);
      }
    );

    return () => subscription.unsubscribe();
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
      ] = await Promise.all([
        supabase
          .rpc("get_profile_secure", { profile_user_id: userId })
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_interests")
          .select("*, interest_categories(name)")
          .eq("user_id", userId),
        supabase
          .from("learning_progress")
          .select("*, learning_content(title, learning_categories(name))")
          .eq("user_id", userId)
          .limit(5),
        supabase
          .from("assessment_results")
          .select("primary_type, career_recommendations")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("achievements")
          .select("id")
          .eq("user_id", userId),
      ]);

      setProfile(profileData);
      setUserRole(roleData?.role ?? "individual");
      setInterests(interestsData ?? []);
      setProgress(progressData ?? []);
      setAssessment(assessmentData);
      setBadgeCount(achievementsData?.length ?? 0);
    } catch (err) {
      console.error("Error loading profile data:", err);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  /* ── sign-out ── */
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (err: any) {
      toast.error("Gagal logout: " + err.message);
    }
  };

  /* ── nav ── */
  const handleNav = (section: string) => {
    if (section === "community") { navigate("/community"); return; }
    if (section === "timeline")  { navigate("/discovery"); return; }
    if (section === "overview")  { navigate("/dashboard"); return; }
    navigate("/dashboard");
  };

  /* ── derived ── */
  const displayName = profile?.full_name || user?.email || "Pengguna";
  const initials    = getInitials(displayName);
  const coursesCount = progress.length;
  const certsCount   = progress.filter((p: any) => p.progress_percentage === 100 || p.status === "completed").length;

  const personalityPills: string[] = [];
  if (assessment?.primary_type) personalityPills.push(assessment.primary_type);
  if (assessment?.career_recommendations?.length) {
    personalityPills.push(assessment.career_recommendations[0]);
  }

  const interestLabels: string[] =
    interests.length > 0
      ? interests.map((i: any) => i.interest_categories?.name ?? i.category_name ?? "")
          .filter(Boolean)
      : FALLBACK_INTERESTS;

  /* ── loading ── */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--tk-gray-50)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full mx-auto mb-4"
            style={{
              width: 48,
              height: 48,
              border: "3px solid var(--tk-gray-200)",
              borderTopColor: "var(--tk-blue-600)",
            }}
          />
          <p style={{ color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-sans)" }}>
            Memuat profil...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  /* ── render ── */
  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: "var(--tk-gray-50)" }}
    >
      {/* Sidebar */}
      <DashboardSidebar
        activeSection="profile"
        setActiveSection={handleNav}
        onSignOut={handleSignOut}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader user={user} profile={profile} onSignOut={handleSignOut} />

        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "var(--tk-gray-0,#fff)", borderColor: "var(--tk-gray-200)" }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
              alt="Talentika"
              className="w-8 h-8 object-contain"
            />
            <span
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--tk-blue-600)",
              }}
            >
              Talentika
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown userId={user?.id} />
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Main */}
        <main
          className="flex-1 overflow-auto pb-20 md:pb-6 tk-page-in"
          style={{ padding: "0 28px 60px" }}
        >
          <div className="max-w-full mx-auto pt-2">

            {/* ── Page header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                paddingBottom: 24,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 700,
                    fontSize: 30,
                    color: "var(--tk-ink)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Profile
                </h1>
                <p
                  style={{
                    fontFamily: "var(--tk-font-sans)",
                    fontSize: 14,
                    color: "var(--tk-gray-500)",
                    marginTop: 4,
                  }}
                >
                  Identitas, minat, dan progress publikmu di Talentika.
                </p>
              </div>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--tk-radius)",
                  border: "1.5px solid var(--tk-blue-600)",
                  background: "transparent",
                  color: "var(--tk-blue-600)",
                  fontFamily: "var(--tk-font-sans)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Pen size={14} />
                Edit Profil
              </button>
            </div>

            {/* ── Two-column grid ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: 20,
                alignItems: "start",
              }}
              className="profile-grid"
            >
              {/* ── LEFT: identity card ── */}
              <div
                className="tk-card"
                style={{
                  background: "#fff",
                  borderRadius: "var(--tk-radius-lg)",
                  padding: 24,
                  textAlign: "center",
                  boxShadow: "var(--tk-shadow-lg,0 4px 24px rgba(0,0,0,.07))",
                }}
              >
                {/* Avatar */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      objectFit: "cover",
                      margin: "0 auto 12px",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#1D4ED8,#3B82F6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      color: "#fff",
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: 700,
                      margin: "0 auto 12px",
                    }}
                  >
                    {initials}
                  </div>
                )}

                {/* Name + email */}
                <h3
                  style={{
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "var(--tk-ink)",
                    margin: "0 0 4px",
                  }}
                >
                  {displayName}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--tk-font-sans)",
                    fontSize: 13,
                    color: "var(--tk-gray-500)",
                    margin: "0 0 14px",
                    wordBreak: "break-all",
                  }}
                >
                  {user.email}
                </p>

                {/* Personality pills */}
                {personalityPills.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    {personalityPills.map((pill, i) => (
                      <span
                        key={i}
                        style={{
                          background: "var(--tk-orange-soft)",
                          color: "var(--tk-orange)",
                          fontFamily: "var(--tk-font-sans)",
                          fontWeight: 600,
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mini stats */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    borderTop: "1px solid var(--tk-gray-100,#F3F4F6)",
                    borderBottom: "1px solid var(--tk-gray-100,#F3F4F6)",
                    padding: "14px 0",
                    margin: "0 0 18px",
                  }}
                >
                  {[
                    { icon: <Award size={16} />, value: badgeCount,    label: "Badges" },
                    { icon: <GraduationCap size={16} />, value: coursesCount, label: "Kursus" },
                    { icon: <Award size={16} style={{ color: "var(--tk-yellow)" }} />, value: certsCount, label: "Sertifikat" },
                  ].map(({ icon, value, label }, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          color: "var(--tk-blue-600)",
                          marginBottom: 2,
                        }}
                      >
                        {icon}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--tk-font-display)",
                          fontWeight: 700,
                          fontSize: 18,
                          color: "var(--tk-ink)",
                        }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--tk-font-sans)",
                          fontSize: 11,
                          color: "var(--tk-gray-500)",
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit button */}
                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 0",
                    borderRadius: "var(--tk-radius)",
                    border: "1.5px solid var(--tk-blue-600)",
                    background: "transparent",
                    color: "var(--tk-blue-600)",
                    fontFamily: "var(--tk-font-sans)",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <Pen size={14} />
                  Edit Profil
                </button>
              </div>

              {/* ── RIGHT column ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Card: Tentang Saya */}
                <div
                  className="tk-card"
                  style={{
                    background: "#fff",
                    borderRadius: "var(--tk-radius-lg)",
                    padding: 24,
                    boxShadow: "var(--tk-shadow-lg,0 4px 24px rgba(0,0,0,.07))",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--tk-ink)",
                      margin: "0 0 12px",
                    }}
                  >
                    Tentang Saya
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--tk-font-sans)",
                      fontSize: 14,
                      color: "var(--tk-gray-600,#4B5563)",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {profile?.bio ||
                      profile?.description ||
                      "Pelajar yang antusias mengeksplorasi dunia digital, desain, dan inovasi. Saat ini fokus mengasah skill untuk masa depan yang lebih cerah."}
                  </p>
                </div>

                {/* Card: Minat & Tujuan */}
                <div
                  className="tk-card"
                  style={{
                    background: "#fff",
                    borderRadius: "var(--tk-radius-lg)",
                    padding: 24,
                    boxShadow: "var(--tk-shadow-lg,0 4px 24px rgba(0,0,0,.07))",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--tk-ink)",
                      margin: "0 0 12px",
                    }}
                  >
                    Minat &amp; Tujuan
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {interestLabels.map((label, i) => (
                      <span
                        key={i}
                        style={{
                          background: "var(--tk-blue-50)",
                          color: "var(--tk-blue-600)",
                          fontFamily: "var(--tk-font-sans)",
                          fontWeight: 600,
                          fontSize: 13,
                          padding: "5px 13px",
                          borderRadius: 999,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card: Riwayat Pembelajaran */}
                <div
                  className="tk-card"
                  style={{
                    background: "#fff",
                    borderRadius: "var(--tk-radius-lg)",
                    padding: 24,
                    boxShadow: "var(--tk-shadow-lg,0 4px 24px rgba(0,0,0,.07))",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "var(--tk-ink)",
                        margin: 0,
                      }}
                    >
                      Riwayat Pembelajaran
                    </h3>
                    <button
                      onClick={() => navigate("/dashboard")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--tk-blue-600)",
                        fontFamily: "var(--tk-font-sans)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Lihat Semua
                    </button>
                  </div>

                  {progress.length === 0 ? (
                    <p
                      style={{
                        fontFamily: "var(--tk-font-sans)",
                        fontSize: 14,
                        color: "var(--tk-gray-400,#9CA3AF)",
                        textAlign: "center",
                        padding: "16px 0",
                        margin: 0,
                      }}
                    >
                      Belum ada riwayat pembelajaran.
                    </p>
                  ) : (
                    <div>
                      {progress.map((item: any, i: number) => {
                        const title    = item.learning_content?.title ?? "Kursus";
                        const category = item.learning_content?.learning_categories?.name ?? "";
                        const pct      = item.progress_percentage ?? 0;
                        const done     = pct >= 100 || item.status === "completed";
                        const ci       = getCourseIcon(category);

                        return (
                          <div
                            key={item.id ?? i}
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              padding: "10px 0",
                              borderTop: i === 0 ? "none" : "1px solid var(--tk-gray-100,#F3F4F6)",
                            }}
                          >
                            {/* Icon box */}
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: ci.bg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            >
                              {ci.emoji}
                            </div>

                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: "var(--tk-font-display)",
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: "var(--tk-ink)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {title}
                              </div>
                              <div
                                style={{
                                  fontFamily: "var(--tk-font-sans)",
                                  fontSize: 12,
                                  color: "var(--tk-gray-500)",
                                  marginTop: 2,
                                }}
                              >
                                {category}
                                {category && " · "}
                                {pct}% selesai
                              </div>
                            </div>

                            {/* Status pill */}
                            <span
                              style={{
                                flexShrink: 0,
                                background: done ? "var(--tk-mint)" : "var(--tk-gray-100,#F3F4F6)",
                                color: done ? "var(--tk-green-dark)" : "var(--tk-gray-600,#4B5563)",
                                fontFamily: "var(--tk-font-sans)",
                                fontWeight: 600,
                                fontSize: 11,
                                padding: "3px 9px",
                                borderRadius: 999,
                              }}
                            >
                              {done ? "Selesai" : "Berjalan"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card: Pengaturan Akun */}
                <div
                  className="tk-card"
                  style={{
                    background: "#fff",
                    borderRadius: "var(--tk-radius-lg)",
                    padding: 24,
                    boxShadow: "var(--tk-shadow-lg,0 4px 24px rgba(0,0,0,.07))",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "var(--tk-ink)",
                      margin: "0 0 12px",
                    }}
                  >
                    Pengaturan Akun
                  </h3>

                  {[
                    {
                      icon: <UserIcon size={18} style={{ color: "var(--tk-blue-600)" }} />,
                      label: "Informasi Akun",
                      onClick: () => {},
                      danger: false,
                    },
                    {
                      icon: <Lock size={18} style={{ color: "var(--tk-blue-600)" }} />,
                      label: "Keamanan & Password",
                      onClick: () => {},
                      danger: false,
                    },
                    {
                      icon: <Bell size={18} style={{ color: "var(--tk-blue-600)" }} />,
                      label: "Notifikasi",
                      onClick: () => {},
                      danger: false,
                    },
                    {
                      icon: <Sun size={18} style={{ color: "var(--tk-blue-600)" }} />,
                      label: "Tampilan",
                      onClick: toggleTheme,
                      danger: false,
                    },
                    {
                      icon: <LogOut size={18} style={{ color: "#EF4444" }} />,
                      label: "Keluar",
                      onClick: handleSignOut,
                      danger: true,
                    },
                  ].map(({ icon, label, onClick, danger }, i, arr) => (
                    <button
                      key={i}
                      onClick={onClick}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        background: "none",
                        border: "none",
                        borderBottom: i < arr.length - 1
                          ? "1px solid var(--tk-gray-100,#F3F4F6)"
                          : "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {icon}
                        <span
                          style={{
                            fontFamily: "var(--tk-font-sans)",
                            fontWeight: 500,
                            fontSize: 14,
                            color: danger ? "#EF4444" : "var(--tk-ink)",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                      {!danger && (
                        <ChevronRight
                          size={16}
                          style={{ color: "var(--tk-gray-400,#9CA3AF)" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* end right column */}
            </div>
            {/* end grid */}

            {/* Responsive: collapse to single column on mobile */}
            <style>{`
              @media (max-width: 768px) {
                .profile-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        </main>

        <BottomNavigationBar activeSection="profile" onSectionChange={handleNav} />
      </div>
    </div>
  );
};

export default Profile;
