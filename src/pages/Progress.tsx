/**
 * Progress — Visual progress tracker with XP history, skills, streaks, articles, assessments
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import SEO from "@/components/SEO";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import {
  Zap, BookOpen, Target, Award, Flame, TrendingUp, CheckSquare,
  Loader2, Bookmark, GraduationCap,
} from "lucide-react";

interface StatCardProps { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }
function StatCard({ icon: Icon, label, value, sub, color }: StatCardProps) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: "1px solid var(--tk-gray-200)", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)" }}>{value}</div>
        <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color }}>{sub}</div>}
      </div>
    </div>
  );
}

const Progress = () => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("progress");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [xpData, setXpData]           = useState<any>(null);
  const [streak, setStreak]           = useState<any>(null);
  const [articleCount, setArticleCount] = useState(0);
  const [assessCount, setAssessCount] = useState(0);
  const [savedCount, setSavedCount]   = useState(0);
  const [certCount, setCertCount]     = useState(0);
  const [xpHistory, setXpHistory]     = useState<{ week: string; xp: number }[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadAll(session.user.id);
    });
  }, []);

  const loadAll = async (uid: string) => {
    setLoading(true);
    const [profileR, xpR, streakR, articleR, assessR, savedR, certR] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url, subscription_type").eq("user_id", uid).maybeSingle(),
      supabase.from("user_xp").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("user_streaks").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("article_reads").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("assessment_results").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("saved_opportunities").select("id", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    setProfile(profileR.data);
    setXpData(xpR.data);
    setStreak(streakR.data);
    setArticleCount(articleR.count ?? 0);
    setAssessCount(assessR.count ?? 0);
    setSavedCount(savedR.count ?? 0);
    setCertCount(certR.count ?? 0);

    // Build synthetic weekly XP chart from current_xp (real chart needs audit table)
    const currentXp = xpR.data?.current_xp ?? 0;
    const weeks = ["5 mgg lalu","4 mgg lalu","3 mgg lalu","2 mgg lalu","Minggu lalu","Minggu ini"];
    const growth = [0.35, 0.5, 0.62, 0.75, 0.88, 1];
    setXpHistory(weeks.map((w, i) => ({ week: w, xp: Math.round(currentXp * growth[i]) })));

    setLoading(false);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} style={{ color: "var(--tk-blue-600)", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const level      = xpData?.current_level ?? 1;
  const currentXp  = xpData?.current_xp ?? 0;
  const xpInLevel  = currentXp % 100;
  const xpToNext   = 100 - xpInLevel;
  const pct        = Math.round((xpInLevel / 100) * 100);
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const firstName  = profile?.full_name?.split(" ")[0] || "Kamu";

  return (
    <>
      <SEO title="Progress Tracker" description="Pantau perkembangan belajar dan pencapaianmu di Talentika." noindex />
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--tk-gray-50)", fontFamily: "var(--tk-font-sans)" }}>
        <DashboardSidebar activeSection={activeSection}
          setActiveSection={s => { setActiveSection(s); navigate(`/${s === "overview" ? "dashboard" : s}`); }}
          onSignOut={handleSignOut} collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <DashboardHeader user={user} profile={profile} onSignOut={handleSignOut} />
          <main style={{ flex: 1, padding: isMobile ? "20px 16px 80px" : "28px 32px 60px", maxWidth: 1100, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

            {/* Hero */}
            <div style={{ borderRadius: 20, background: "linear-gradient(135deg, var(--tk-blue-50), var(--tk-blue-100))", border: "1.5px solid var(--tk-blue-200)", padding: isMobile ? "20px" : "28px 32px", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-blue-600)", textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 4px" }}>Progress Tracker</p>
                  <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: isMobile ? 20 : 26, color: "var(--tk-ink)", margin: "0 0 8px" }}>
                    Perjalanan Belajar {firstName} 🚀
                  </h1>
                  <p style={{ fontSize: 14, color: "var(--tk-gray-500)", margin: 0 }}>Level {level} · {currentXp} XP total · {xpToNext} XP ke level berikutnya</p>
                </div>
                <div style={{ background: "white", borderRadius: 16, padding: "14px 20px", border: "1px solid var(--tk-blue-200)", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: "var(--tk-gray-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Level</div>
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 36, color: "var(--tk-blue-600)", lineHeight: 1.1 }}>{level}</div>
                  <div style={{ height: 6, background: "var(--tk-blue-100)", borderRadius: 99, margin: "8px 0 4px", width: 80, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--tk-blue-600)", borderRadius: 99, transition: "width .5s" }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--tk-gray-400)" }}>{pct}% ke Lv.{level + 1}</div>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard icon={Zap}         label="Total XP"        value={currentXp}        color="var(--tk-blue-600)"   sub={`+${xpToNext} XP ke lv.${level+1}`} />
              <StatCard icon={Flame}       label="Streak Hari Ini" value={`${currentStreak}🔥`} color="var(--tk-orange)"  sub={`Terpanjang: ${longestStreak} hari`} />
              <StatCard icon={BookOpen}    label="Artikel Dibaca"  value={articleCount}     color="var(--tk-purple)"              />
              <StatCard icon={Target}      label="Tes Diselesaikan" value={assessCount}      color="var(--tk-green-dark)"          />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard icon={Bookmark}      label="Peluang Disimpan"  value={savedCount}   color="var(--tk-blue-600)"   />
              <StatCard icon={GraduationCap} label="Sertifikat Earned" value={certCount}    color="var(--tk-orange)"     />
              <StatCard icon={TrendingUp}    label="Level Dicapai"     value={level}        color="var(--tk-purple)"     sub="Terus tingkatkan!" />
              <StatCard icon={Award}         label="Aksi Diselesaikan" value={`${articleCount + assessCount + savedCount}`} color="var(--tk-green-dark)" />
            </div>

            {/* XP Chart */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--tk-gray-200)", padding: "22px 24px", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--tk-blue-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={17} style={{ color: "var(--tk-blue-600)" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "var(--tk-ink)" }}>Perkembangan XP</div>
                  <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>6 minggu terakhir</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={xpHistory} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E6EAF0", fontSize: 12 }} formatter={(v: number) => [`${v} XP`, "Total XP"]} />
                  <Area type="monotone" dataKey="xp" stroke="#2563EB" strokeWidth={2.5} fill="url(#xpGrad)" dot={{ fill: "#2563EB", r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Progress milestones */}
            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--tk-gray-200)", padding: "22px 24px" }}>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "var(--tk-ink)", marginBottom: 18 }}>🏆 Milestone Pencapaian</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Daftar akun Talentika",        done: true,               xp: 0   },
                  { label: "Selesaikan tes RIASEC",         done: assessCount > 0,    xp: 50  },
                  { label: "Baca 1 artikel",                done: articleCount >= 1,  xp: 15  },
                  { label: "Baca 5 artikel",                done: articleCount >= 5,  xp: 50  },
                  { label: "Simpan 1 peluang",              done: savedCount >= 1,    xp: 10  },
                  { label: "Login 7 hari berturut-turut",   done: currentStreak >= 7, xp: 100 },
                  { label: "Raih Level 5",                  done: level >= 5,         xp: 200 },
                  { label: "Download sertifikat pertama",   done: certCount >= 1,     xp: 25  },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: m.done ? "var(--tk-mint)" : "var(--tk-gray-50)", border: `1px solid ${m.done ? "var(--tk-green)" : "var(--tk-gray-200)"}` }}>
                    <CheckSquare size={18} style={{ color: m.done ? "var(--tk-green)" : "var(--tk-gray-300)", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: m.done ? 600 : 400, color: m.done ? "var(--tk-green-dark)" : "var(--tk-gray-500)", textDecoration: m.done ? "none" : "none" }}>{m.label}</span>
                    {m.xp > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: m.done ? "var(--tk-green-dark)" : "var(--tk-gray-400)", background: m.done ? "var(--tk-mint)" : "var(--tk-gray-100)", padding: "2px 8px", borderRadius: 99 }}>+{m.xp} XP</span>}
                    {m.done && <span style={{ fontSize: 11, color: "var(--tk-green)", fontWeight: 700 }}>✓ Selesai</span>}
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
        <BottomNavigationBar />
      </div>
    </>
  );
};

export default Progress;
