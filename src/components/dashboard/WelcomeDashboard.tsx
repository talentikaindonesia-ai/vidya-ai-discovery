import { useState, useEffect } from "react";
import {
  BookOpen, Clock, Target, Star, Trophy, Brain,
  Activity, TrendingUp, ChevronRight, RefreshCw,
  Wrench, Microscope, Palette, Users, Briefcase, Calculator,
  Play, CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface WelcomeDashboardProps {
  user: User | null;
  profile: any;
}

// ── RIASEC type map ───────────────────────────────────────────────────────────
const RIASEC: Record<string, { emoji: string; name: string; desc: string; gradient: string; iconColor: string }> = {
  realistic:     { emoji: "🔧", name: "Realistic (Doer)",         desc: "Suka bekerja dengan tangan, praktis, dan berorientasi hasil konkret",    gradient: "linear-gradient(135deg,#FED7AA,#FB923C)", iconColor: "#C2410C" },
  investigative: { emoji: "🔬", name: "Investigative (Thinker)",  desc: "Suka menganalisis, meneliti, dan memecahkan masalah kompleks",           gradient: "linear-gradient(135deg,#BFDBFE,#60A5FA)", iconColor: "#1D4ED8" },
  artistic:      { emoji: "🎨", name: "Artistic (Creator)",       desc: "Kreatif, ekspresif, dan suka menciptakan sesuatu yang baru",             gradient: "linear-gradient(135deg,#E9D5FF,#A78BFA)", iconColor: "#6D28D9" },
  social:        { emoji: "🤝", name: "Social (Helper)",          desc: "Suka membantu orang lain, empatis, dan berorientasi hubungan sosial",    gradient: "linear-gradient(135deg,#FBCFE8,#F472B6)", iconColor: "#BE185D" },
  enterprising:  { emoji: "💼", name: "Enterprising (Persuader)", desc: "Suka memimpin, persuasif, dan berorientasi pada pencapaian tujuan",      gradient: "linear-gradient(135deg,#D1FAE5,#34D399)", iconColor: "#065F46" },
  conventional:  { emoji: "📊", name: "Conventional (Organizer)", desc: "Teratur, detail, dan suka mengorganisir informasi atau data",            gradient: "linear-gradient(135deg,#CCFBF1,#2DD4BF)", iconColor: "#0F766E" },
};

const RIASEC_ICONS: Record<string, React.ElementType> = {
  realistic: Wrench, investigative: Microscope, artistic: Palette,
  social: Users, enterprising: Briefcase, conventional: Calculator,
};

// ── Design tokens helpers ─────────────────────────────────────────────────────
const TINTS: Record<string, [string, string]> = {
  blue:   ["var(--tk-blue-50)",     "var(--tk-blue-700)"],
  green:  ["var(--tk-mint)",        "var(--tk-green-dark)"],
  purple: ["var(--tk-lilac)",       "#5B21B6"],
  yellow: ["var(--tk-yellow-soft)", "#A47000"],
  orange: ["var(--tk-orange-soft)", "#C04400"],
};

function MiniStat({ icon: Icon, color, label, value, sub }: {
  icon: React.ElementType; color: string; label: string; value: string; sub: string;
}) {
  const [bg, fg] = TINTS[color] ?? TINTS.blue;
  return (
    <div className="rounded-2xl p-3.5 flex items-center justify-between"
      style={{ background: "var(--tk-gray-50)", border: "1px solid var(--tk-gray-200)" }}>
      <div>
        <div style={{ fontSize: 11.5, color: "var(--tk-gray-500)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink)" }}>{value}</div>
        <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)" }}>{sub}</div>
      </div>
      <div className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, background: bg, color: fg }}>
        <Icon size={18} />
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, color, title, subject, time }: {
  icon: React.ElementType; color: string; title: string; subject: string; time: string;
}) {
  const [bg, fg] = TINTS[color] ?? TINTS.blue;
  return (
    <div className="flex gap-2.5 items-start">
      <div className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 34, height: 34, background: bg, color: fg }}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>{title}</div>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 12.5, color: "var(--tk-ink)", lineHeight: 1.3 }}>{subject}</div>
        <div style={{ fontSize: 11, color: "var(--tk-gray-500)", marginTop: 2 }}>{time}</div>
      </div>
    </div>
  );
}

// ── Category colour band ──────────────────────────────────────────────────────
const CAT_GRADIENTS = [
  "linear-gradient(135deg,#DBEAFE,#93C5FD)",
  "linear-gradient(135deg,#FEF3C7,#FDE68A)",
  "linear-gradient(135deg,#EDE9FE,#C4B5FD)",
  "linear-gradient(135deg,#D1FAE5,#A7F3D0)",
  "linear-gradient(135deg,#FCE7F3,#FBCFE8)",
  "linear-gradient(135deg,#CCFBF1,#2DD4BF)",
];
const CAT_COLORS = ["#1D4ED8","#A47000","#6D28D9","#0F7A3E","#BE185D","#0F766E"];

export const WelcomeDashboard = ({ user, profile }: WelcomeDashboardProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalLearningTime: 0,
    achievements: 0,
    challenges: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);

  useEffect(() => {
    if (user?.id) loadDashboardData(user.id);
  }, [user?.id]);

  const loadDashboardData = async (userId: string) => {
    try {
      const [
        { data: progressData },
        { data: achievementsData },
        { data: assessmentData },
        { data: recentProgressData },
      ] = await Promise.all([
        supabase
          .from("learning_progress")
          .select("content_id, status, progress_percentage, time_spent_minutes, last_accessed_at")
          .eq("user_id", userId),
        supabase.from("achievements").select("id").eq("user_id", userId),
        supabase
          .from("assessment_results")
          .select("personality_type, career_recommendations, talent_areas, score_breakdown, interest_categories, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("learning_progress")
          .select("content_id, progress_percentage, status, last_accessed_at, learning_content(id, title, description, content_type, category_id, duration_minutes)")
          .eq("user_id", userId)
          .order("last_accessed_at", { ascending: false })
          .limit(3),
      ]);

      setStats({
        coursesEnrolled:   progressData?.filter(p => p.status !== "completed").length ?? 0,
        coursesCompleted:  progressData?.filter(p => p.status === "completed").length ?? 0,
        totalLearningTime: Math.round(
          (progressData?.reduce((t, p: any) => t + (p.time_spent_minutes ?? 0), 0) ?? 0) / 60
        ),
        achievements: achievementsData?.length ?? 0,
        challenges: 0,
      });

      setAssessmentResults(assessmentData ?? null);

      // Map recent courses from progress data
      const courses = (recentProgressData ?? [])
        .filter(p => (p as any).learning_content)
        .map((p: any) => ({
          ...p.learning_content,
          progress_percentage: p.progress_percentage ?? 0,
          status: p.status,
          last_accessed_at: p.last_accessed_at,
        }));
      setRecentCourses(courses);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Talentika";

  // RIASEC derived values
  const riasecKey = assessmentResults?.personality_type as string | undefined;
  const riasecInfo = riasecKey ? (RIASEC[riasecKey] ?? null) : null;
  const RiasecIcon = riasecKey ? (RIASEC_ICONS[riasecKey] ?? Brain) : Brain;

  const scoreBreakdown: Record<string, number> = assessmentResults?.score_breakdown ?? {};
  const totalScore = Object.values(scoreBreakdown).reduce((s, v) => s + Number(v || 0), 0);
  const primaryScore = Number(scoreBreakdown[riasecKey ?? ""] || 0);
  const percentage = totalScore > 0 ? Math.round((primaryScore / totalScore) * 100) : 0;

  const formatTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3.6e6);
    if (h < 1) return "Baru saja";
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
  };

  return (
    <div
      className="tk-page-in"
      style={{
        paddingTop: 8,
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 20,
        alignItems: "start",
      }}
    >
      {/* ══════════════ LEFT COLUMN ══════════════ */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* ── Hero greeting banner ───────────────────────────── */}
        <div
          className="relative overflow-hidden flex items-center"
          style={{
            borderRadius: "var(--tk-radius-lg)",
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E3A8A 100%)",
            color: "white",
            padding: "28px 32px",
            minHeight: 140,
          }}
        >
          <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 26,
              color: "white",
              marginBottom: 6,
              letterSpacing: "-.02em",
            }}>
              Selamat {greeting}, {firstName}!{" "}
              <span className="tk-wave" style={{ display: "inline-block" }}>👋</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,.85)", margin: 0, fontSize: 14.5 }}>
              {riasecInfo
                ? `Tipe ${riasecInfo.name} — ${riasecInfo.desc}`
                : "Mari lanjutkan perjalanan pembelajaran Anda hari ini."}
            </p>
          </div>

          {/* Decorative SVG */}
          <svg width="220" height="140" viewBox="0 0 220 140"
            style={{ position: "absolute", right: 0, top: 0, opacity: .9 }}>
            <path d="M0 90 C 60 60, 120 110, 200 80 L 220 90 L 220 140 L 0 140 Z"
              fill="rgba(255,255,255,.12)" />
            <circle cx="175" cy="52" r="22" fill="#FFC107" opacity=".7" />
            <text x="140" y="102" fontSize="52">{riasecInfo?.emoji ?? "🙋‍♂️"}</text>
          </svg>
          <span className="tk-sparkle" style={{ position: "absolute", top: 18, right: 55, fontSize: 15, color: "#FFC107" }}>✦</span>
          <span className="tk-sparkle" style={{ position: "absolute", top: 58, right: 130, fontSize: 10, color: "rgba(255,255,255,.6)" }}>✦</span>
        </div>

        {/* ── Assessment results ─────────────────────────────── */}
        <div className="tk-card tk-card-elevated" style={{ padding: 28, boxShadow: "var(--tk-shadow)" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <Brain size={20} style={{ color: "var(--tk-blue-600)" }} />
            <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-ink)", margin: 0 }}>
              Hasil Assessment Anda
            </h3>
          </div>

          {riasecInfo ? (
            <>
              {/* RIASEC type */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center mx-auto mb-3"
                  style={{
                    width: 80, height: 80, borderRadius: 20,
                    background: riasecInfo.gradient,
                    color: riasecInfo.iconColor,
                    fontSize: 36,
                  }}>
                  {riasecInfo.emoji}
                </div>
                <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 20, color: "var(--tk-ink)", margin: "0 0 4px" }}>
                  {riasecInfo.name}
                </h3>
                <p style={{ color: "var(--tk-gray-500)", margin: 0, fontSize: 13 }}>
                  {riasecInfo.desc}
                </p>
              </div>

              {/* Kesesuaian */}
              {percentage > 0 && (
                <>
                  <div className="flex justify-between items-center mb-1.5">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)" }}>Tingkat Kesesuaian</span>
                    <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, color: "var(--tk-blue-700)" }}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="tk-progress mb-5">
                    <div className="tk-progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </>
              )}

              {/* Career pills */}
              {assessmentResults.career_recommendations?.length > 0 && (
                <>
                  <div className="text-center mb-3">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13 }}>
                      <Target size={14} style={{ color: "var(--tk-orange)" }} /> Rekomendasi Karier
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mb-5">
                    {assessmentResults.career_recommendations.slice(0, 4).map((c: string) => (
                      <span key={c} className="tk-pill tk-pill-orange">{c}</span>
                    ))}
                  </div>
                </>
              )}

              {/* Talent areas */}
              {assessmentResults.talent_areas?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-5">
                  {assessmentResults.talent_areas.slice(0, 3).map((t: string) => {
                    const TIcon = RIASEC_ICONS[t] ?? Brain;
                    return (
                      <span key={t} className="tk-pill" style={{ background: "var(--tk-blue-50)", color: "var(--tk-blue-700)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <TIcon size={11} /> {RIASEC[t]?.name?.split(" ")[0] ?? t}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold text-sm transition-colors"
                  style={{
                    border: "1px solid var(--tk-blue-200)", color: "var(--tk-blue-700)",
                    background: "white", cursor: "pointer", fontFamily: "var(--tk-font-display)",
                  }}
                  onClick={() => navigate("/assessment")}
                >
                  <RefreshCw size={14} /> Tes Ulang
                </button>
                <button
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                  style={{ background: "var(--tk-blue-600)", border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
                  onClick={() => navigate("/learning")}
                >
                  Lihat Kursus
                </button>
              </div>
            </>
          ) : (
            /* No assessment yet */
            <div className="text-center py-8">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
              <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-ink)", marginBottom: 8 }}>
                Belum Ada Hasil Assessment
              </h3>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 16 }}>
                Mulai tes minat dan bakat untuk mendapatkan rekomendasi karier yang tepat.
              </p>
              <button
                onClick={() => navigate("/assessment")}
                className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
                style={{ background: "var(--tk-blue-600)", border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)" }}
              >
                Mulai Tes Sekarang
              </button>
            </div>
          )}
        </div>

        {/* ── Aktivitas Terbaru ──────────────────────────────── */}
        <div className="tk-card">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>
              Aktivitas Terbaru
            </h3>
            <a
              onClick={() => navigate("/learning")}
              style={{ color: "var(--tk-blue-600)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Lihat Semua
            </a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <ActivityItem icon={BookOpen}   color="blue"   title="Kursus Dilanjutkan" subject="UI/UX Design Fundamental" time="2 jam lalu" />
            <ActivityItem icon={Trophy}     color="purple" title="Tantangan Diikuti"  subject="Data Science Challenge" time="5 jam lalu" />
            <ActivityItem icon={Star}       color="yellow" title="Badge Diperoleh"    subject="Consistent Learner 🏆" time="1 hari lalu" />
            <ActivityItem icon={TrendingUp} color="green"  title="Progress Naik"      subject="Persentase naik +8%" time="2 hari lalu" />
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT RAIL ══════════════ */}
      <div className="flex flex-col gap-4">

        {/* ── Ringkasan Progress ─────────────────────────────── */}
        <div className="tk-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color: "var(--tk-blue-600)" }} />
              <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>
                Ringkasan Progress
              </h3>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <MiniStat icon={BookOpen}    color="blue"   label="Kursus Aktif"    value={String(stats.coursesEnrolled)}   sub="Lanjutkan belajar!" />
            <MiniStat icon={CheckCircle} color="green"  label="Selesai"         value={String(stats.coursesCompleted)}  sub="Kursus tuntas" />
            <MiniStat icon={Clock}       color="orange" label="Jam Belajar"     value={String(stats.totalLearningTime)} sub="Total waktu" />
            <MiniStat icon={Star}        color="yellow" label="Pencapaian"      value={String(stats.achievements)}      sub="Badge diraih" />
          </div>
        </div>

        {/* ── Kursus Terakhir Diakses ────────────────────────── */}
        <div className="tk-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} style={{ color: "var(--tk-blue-600)" }} />
              <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>
                Kursus Anda
              </h3>
            </div>
            <a onClick={() => navigate("/learning")} style={{ color: "var(--tk-blue-600)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Lihat Semua
            </a>
          </div>

          {recentCourses.length === 0 ? (
            <div className="text-center py-6">
              <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13 }}>Belum ada kursus aktif</p>
              <button
                onClick={() => navigate("/learning")}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--tk-blue-50)", color: "var(--tk-blue-700)", border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)" }}
              >
                Jelajahi Kursus
              </button>
            </div>
          ) : (
            recentCourses.map((course, idx) => {
              const grad = CAT_GRADIENTS[idx % CAT_GRADIENTS.length];
              const clr  = CAT_COLORS[idx % CAT_COLORS.length];
              const progress = course.progress_percentage ?? 0;
              const isDone = course.status === "completed";
              return (
                <div key={course.id} className="flex items-center gap-3 py-2.5"
                  style={{ borderTop: idx > 0 ? "1px solid var(--tk-gray-150)" : "none" }}>
                  <div className="flex items-center justify-center flex-shrink-0 rounded-xl"
                    style={{ width: 40, height: 40, background: grad, color: clr }}>
                    {isDone ? <CheckCircle size={18} /> : <Play size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {course.title ?? "Kursus"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>
                      {course.last_accessed_at ? formatTimeAgo(course.last_accessed_at) : ""}
                    </div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div className="tk-progress">
                      <div className="tk-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "var(--tk-font-display)", fontWeight: 700, color: isDone ? "var(--tk-green-dark)" : "var(--tk-blue-700)", textAlign: "right", marginTop: 3 }}>
                      {progress}%
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--tk-gray-400)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--tk-blue-600)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--tk-gray-400)"; }}
                    onClick={() => navigate(`/learning/content/${course.id}`)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── RIASEC quick summary (if assessment done) ─────── */}
        {riasecInfo && (
          <div className="tk-card" style={{ background: riasecInfo.gradient }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} style={{ color: riasecInfo.iconColor }} />
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "var(--tk-ink)" }}>
                Tipe Kepribadian Anda
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 48, height: 48, borderRadius: 14, fontSize: 24,
                  background: "rgba(255,255,255,.45)",
                }}>
                {riasecInfo.emoji}
              </div>
              <div>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>
                  {riasecInfo.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--tk-gray-600)" }}>
                  Tes · {new Date(assessmentResults.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
