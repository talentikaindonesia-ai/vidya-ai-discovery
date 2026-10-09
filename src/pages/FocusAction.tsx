/**
 * FocusAction — Personalized Learning & Career Action Plan
 * Tabs: Rencana (weekly actions) | Kursus (course recs) | Peluang | Mentor & Komunitas
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ambilIdentitas } from "@/hooks/useIdentitasSiswa";
import { RIASEC_FOCUS_PLAN as RIASEC } from "@/lib/riasecFocusPlan";
import SEO from "@/components/SEO";
import {
  BookOpen, Target, Trophy, Users, ExternalLink, ChevronRight,
  Star, Zap, Calendar, MapPin, Clock, CheckSquare, Square,
  RefreshCw, Sparkles, TrendingUp, Award, Loader2, Play,
  GraduationCap, MessageCircle, Globe, BarChart2, Flame,
} from "lucide-react";

const DIFF_CFG: Record<string, { label: string; color: string; bg: string }> = {
  easy:   { label: "Pemula",   color: "var(--tk-green-dark)", bg: "var(--tk-mint)" },
  medium: { label: "Menengah", color: "var(--tk-orange)",     bg: "var(--tk-orange-soft)" },
  hard:   { label: "Lanjutan", color: "var(--tk-blue-700)",   bg: "var(--tk-blue-100)" },
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  video: "🎥 Video", article: "📄 Artikel", course: "📚 Kursus",
  quiz: "🧩 Kuis", podcast: "🎙️ Podcast", worksheet: "📝 Worksheet",
};

const CAT_CFG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  beasiswa:       { label: "Beasiswa",   color: "var(--tk-blue-600)",   bg: "var(--tk-blue-50)",    emoji: "🎓" },
  magang:         { label: "Magang",     color: "var(--tk-green-dark)", bg: "var(--tk-mint)",        emoji: "💼" },
  lowongan_kerja: { label: "Lowongan",   color: "var(--tk-orange)",     bg: "var(--tk-orange-soft)", emoji: "🏢" },
  kompetisi:      { label: "Kompetisi",  color: "var(--tk-purple)",     bg: "var(--tk-lilac)",       emoji: "🏆" },
  konferensi:     { label: "Konferensi", color: "var(--tk-blue-700)",   bg: "var(--tk-blue-100)",    emoji: "📅" },
  volunteer:      { label: "Volunteer",  color: "var(--tk-green-dark)", bg: "var(--tk-mint)",        emoji: "🤝" },
  program:        { label: "Program",    color: "var(--tk-purple)",     bg: "var(--tk-lilac)",       emoji: "📋" },
};

// All platform chips use Talentika blue as neutral brand color
const PLATFORM_COLOR: Record<string, string> = {
  "Coursera": "var(--tk-blue-600)", "edX (Harvard)": "var(--tk-blue-700)", "edX": "var(--tk-blue-700)",
  "Dicoding": "var(--tk-blue-600)", "Udemy": "var(--tk-purple)", "Kaggle": "var(--tk-blue-500)",
  "freeCodeCamp": "var(--tk-ink)", "Google (Coursera)": "var(--tk-blue-600)",
  "YouTube": "var(--tk-orange)", "Skill Academy": "var(--tk-green-dark)", "Skillana / Prakerja": "var(--tk-green-dark)",
  "Udacity (Gratis)": "var(--tk-blue-600)", "Canva Design School": "var(--tk-blue-500)",
  "LinkedIn Learning": "var(--tk-blue-700)", "YC (Gratis)": "var(--tk-orange)", "Y Combinator Startup School": "var(--tk-orange)",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface LearningItem {
  id: string; title: string; description: string | null;
  content_type: string; difficulty_level: string | null; thumbnail_url: string | null;
}
interface OppItem {
  id: string; title: string; organizer: string | null; category: string;
  location: string | null; deadline: string | null; url: string | null;
}
interface MentorItem {
  id: string; name: string; title: string | null; bio: string | null;
  avatar_url: string | null; expertise_areas: string[] | null;
  experience_years: number | null; rating: number | null; hourly_rate: number | null;
}

type TabId = "rencana" | "kursus" | "peluang" | "mentor";

// ─── Main Component ───────────────────────────────────────────────────────────
const FocusAction = () => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();

  const [user, setUser]           = useState<any>(null);
  const [profile, setProfile]     = useState<any>(null);
  const [riasecType, setRiasecType] = useState<string | null>(null);
  const [xpData, setXpData]       = useState<{ current_xp: number; current_level: number } | null>(null);
  const [learning, setLearning]   = useState<LearningItem[]>([]);
  const [opps, setOpps]           = useState<OppItem[]>([]);
  const [mentors, setMentors]     = useState<MentorItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState("focus");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tab, setTab]             = useState<TabId>("rencana");
  const [checkedActions, setCheckedActions] = useState<boolean[]>([false, false, false, false, false]);
  const [completedWeeks, setCompletedWeeks] = useState<boolean[]>([false, false, false, false]);

  const rConfig = riasecType ? RIASEC[riasecType] : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadAll(session.user.id);
    });
  }, [navigate]);

  // Persist weekly checkboxes
  useEffect(() => {
    if (!user || !riasecType) return;
    const saved = localStorage.getItem(`focus_actions_${user.id}_${riasecType}`);
    if (saved) { try { setCheckedActions(JSON.parse(saved)); } catch { /**/ } }
    const savedW = localStorage.getItem(`focus_weeks_${user.id}_${riasecType}`);
    if (savedW) { try { setCompletedWeeks(JSON.parse(savedW)); } catch { /**/ } }
  }, [user?.id, riasecType]);

  const toggleAction = (i: number) => {
    const next = checkedActions.map((v, idx) => idx === i ? !v : v);
    setCheckedActions(next);
    if (user && riasecType) localStorage.setItem(`focus_actions_${user.id}_${riasecType}`, JSON.stringify(next));
  };

  const toggleWeek = (i: number) => {
    const next = completedWeeks.map((v, idx) => idx === i ? !v : v);
    setCompletedWeeks(next);
    if (user && riasecType) localStorage.setItem(`focus_weeks_${user.id}_${riasecType}`, JSON.stringify(next));
  };

  const resetActions = () => {
    const r = [false, false, false, false, false];
    setCheckedActions(r);
    if (user && riasecType) localStorage.setItem(`focus_actions_${user.id}_${riasecType}`, JSON.stringify(r));
  };

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    // Identitas dari view kanonik — lihat src/hooks/useIdentitasSiswa.ts
    const [profileRes, ident, xpRes] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_url, subscription_type").eq("user_id", uid).maybeSingle(),
      ambilIdentitas(uid),
      supabase.from("user_xp").select("current_xp, current_level").eq("user_id", uid).maybeSingle(),
    ]);
    setProfile(profileRes.data);
    setXpData(xpRes.data);
    const pType = ident?.tipeUtama ?? null;
    setRiasecType(pType);
    if (!pType) { setLoading(false); return; }
    const cfg = RIASEC[pType];
    const [lRes, oRes, mRes] = await Promise.all([
      supabase.from("learning_content")
        .select("id, title, description, content_type, difficulty_level, thumbnail_url")
        .eq("is_active", true)
        .limit(6),
      supabase.from("scraped_content")
        .select("id, title, organizer, category, location, deadline, url")
        .eq("is_active", true)
        .in("category", cfg.oppCategories)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("mentors")
        .select("id, name, title, bio, avatar_url, expertise_areas, experience_years, rating, hourly_rate")
        .eq("is_available", true)
        .limit(6),
    ]);
    setLearning(lRes.data ?? []);
    setOpps(oRes.data ?? []);
    setMentors(mRes.data ?? []);
    setLoading(false);
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ color: "var(--tk-blue-600)", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Kamu";
  const completedCount = checkedActions.filter(Boolean).length;
  const completedWeekCount = completedWeeks.filter(Boolean).length;
  const levelPct = xpData ? Math.round(((xpData.current_xp % 100) / 100) * 100) : 0;

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "rencana", label: "Rencana Aksi", icon: Target },
    { id: "kursus",  label: "Rekomendasi Kursus", icon: GraduationCap },
    { id: "peluang", label: "Peluang Cocok", icon: Sparkles },
    { id: "mentor",  label: "Mentor & Komunitas", icon: Users },
  ];

  return (
    <>
      <SEO
        title="Focus Action — Rencana Belajar Personalmu"
        description="Jalur belajar, kursus, peluang, mentor, dan rencana aksi mingguan yang dipersonalisasi berdasarkan tipe RIASEC-mu."
        noindex
      />
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--tk-gray-50)", fontFamily: "var(--tk-font-sans)" }}>
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={(s) => { setActiveSection(s); navigate(`/${s === "overview" ? "dashboard" : s}`); }}
          onSignOut={handleSignOut}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <DashboardHeader user={user} profile={profile} onSignOut={handleSignOut} />
          <main style={{ flex: 1, padding: isMobile ? "20px 16px 80px" : "28px 32px 60px", maxWidth: 1100, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

            {!riasecType ? (
              <NoAssessmentState navigate={navigate} />
            ) : (
              <>
                {/* ── Hero ───────────────────────────────────────────────── */}
                <HeroCard
                  rConfig={rConfig!}
                  firstName={firstName}
                  xpData={xpData}
                  levelPct={levelPct}
                  completedCount={completedCount}
                  completedWeekCount={completedWeekCount}
                  isMobile={isMobile}
                />

                {/* ── Tabs ───────────────────────────────────────────────── */}
                <div style={{
                  display: "flex", gap: isMobile ? 4 : 8, marginBottom: 24,
                  overflowX: "auto", paddingBottom: 2,
                }}>
                  {TABS.map(t => {
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)} style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: isMobile ? "9px 14px" : "10px 18px",
                        borderRadius: 12, border: active ? "none" : "1.5px solid var(--tk-gray-200)",
                        background: active ? rConfig!.color : "white",
                        color: active ? "white" : "var(--tk-gray-600)",
                        fontFamily: "var(--tk-font-display)", fontWeight: 700,
                        fontSize: isMobile ? 12.5 : 13.5, cursor: "pointer", whiteSpace: "nowrap",
                        transition: "all .15s",
                        boxShadow: active ? `0 4px 12px ${rConfig!.color}44` : "none",
                      }}>
                        <t.icon size={15} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── Tab: Rencana Aksi ──────────────────────────────────── */}
                {tab === "rencana" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {/* 4-Week Plan */}
                    <div>
                      <SectionHeader icon={Calendar} color="var(--tk-purple)" title="Rencana Belajar 4 Minggu" sub={`${completedWeekCount}/4 fase selesai`} />
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
                        {rConfig!.fourWeekPlan.map((w, i) => (
                          <div key={w.week} style={{
                            background: completedWeeks[i] ? "var(--tk-mint)" : "white",
                            borderRadius: 16, padding: "18px 20px",
                            border: completedWeeks[i] ? `1.5px solid var(--tk-green)` : `1.5px solid ${rConfig!.color}30`,
                            position: "relative", overflow: "hidden",
                          }}>
                            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: completedWeeks[i] ? "var(--tk-green)" : rConfig!.color, borderRadius: "4px 0 0 4px" }} />
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                              <div>
                                <span style={{ fontSize: 11, fontWeight: 800, color: rConfig!.color, textTransform: "uppercase", letterSpacing: ".06em" }}>Minggu {w.week}</span>
                                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 14.5, color: "var(--tk-ink)", marginTop: 2 }}>{w.theme}</div>
                              </div>
                              <button onClick={() => toggleWeek(i)} style={{
                                padding: "6px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                                background: completedWeeks[i] ? "var(--tk-mint)" : rConfig!.bg,
                                color: completedWeeks[i] ? "var(--tk-green-dark)" : rConfig!.color,
                                fontSize: 12, fontWeight: 700,
                              }}>
                                {completedWeeks[i] ? "✓ Selesai" : "Tandai Selesai"}
                              </button>
                            </div>
                            <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                              {w.goals.map((g, gi) => (
                                <li key={gi} style={{ fontSize: 13, color: completedWeeks[i] ? "var(--tk-gray-400)" : "var(--tk-gray-700)", lineHeight: 1.5, textDecoration: completedWeeks[i] ? "line-through" : "none" }}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Actions */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <SectionHeader icon={Flame} color="var(--tk-green)" title="Aksi Fokus Minggu Ini" sub={`${completedCount}/5 selesai`} />
                        <button onClick={resetActions} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--tk-gray-200)", background: "white", fontSize: 12, color: "var(--tk-gray-500)", cursor: "pointer" }}>
                          <RefreshCw size={12} /> Reset
                        </button>
                      </div>
                      <div style={{ height: 8, background: "var(--tk-gray-200)", borderRadius: 99, marginBottom: 16, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(completedCount / 5) * 100}%`, background: completedCount === 5 ? "var(--tk-green)" : rConfig!.color, borderRadius: 99, transition: "width .4s" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {rConfig!.weeklyActions.map((action, i) => (
                          <ActionCard key={i} action={action} index={i} checked={checkedActions[i]} onToggle={() => toggleAction(i)} rConfig={rConfig!} />
                        ))}
                        {completedCount === 5 && (
                          <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "linear-gradient(135deg, var(--tk-mint), #A7F3D0)", border: "1.5px solid var(--tk-green)" }}>
                            <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
                            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-green-dark)" }}>Luar biasa! Semua aksi minggu ini selesai!</div>
                            <div style={{ fontSize: 13, color: "var(--tk-green-dark)", marginTop: 4, opacity: .8 }}>Kamu berada di jalur yang tepat menuju karir impianmu. Keep going! 🚀</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Learning Content from DB */}
                    {learning.length > 0 && (
                      <div>
                        <SectionHeader icon={BookOpen} color={rConfig!.color} title="Konten Belajar di Platform" sub="Materi langsung di Talentika Learning Hub" cta="Buka Learning Hub" onCta={() => navigate("/learning")} />
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
                          {learning.slice(0, 6).map((item, i) => {
                            const diff = DIFF_CFG[item.difficulty_level ?? "easy"] ?? DIFF_CFG.easy;
                            return (
                              <div key={item.id} onClick={() => navigate("/learning")} style={{
                                background: "white", borderRadius: 16, overflow: "hidden",
                                border: "1px solid var(--tk-gray-200)", cursor: "pointer", transition: "all .18s",
                              }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${rConfig!.color}22`; (e.currentTarget as HTMLElement).style.borderColor = rConfig!.color + "60"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)"; }}
                              >
                                <div style={{
                                  height: 90, background: item.thumbnail_url ? `url(${item.thumbnail_url}) center/cover` : `linear-gradient(${rConfig!.gradient})`,
                                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                                }}>
                                  {!item.thumbnail_url && <BookOpen size={24} style={{ color: rConfig!.color, opacity: .5 }} />}
                                  <div style={{ position: "absolute", top: 8, left: 8 }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(255,255,255,.9)", color: rConfig!.color }}>
                                      {CONTENT_TYPE_LABEL[item.content_type] ?? item.content_type}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ padding: "12px 14px" }}>
                                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--tk-ink)", lineHeight: 1.35, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{item.title}</div>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: diff.bg, color: diff.color }}>{diff.label}</span>
                                    <ChevronRight size={13} style={{ color: "var(--tk-gray-400)" }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Kursus ────────────────────────────────────────── */}
                {tab === "kursus" && (
                  <div>
                    <SectionHeader icon={GraduationCap} color={rConfig!.color} title={`Kursus Terpilih untuk Tipe ${rConfig!.label}`} sub="Platform terpercaya • Bisa diakses dari Indonesia" />
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
                      {rConfig!.courses.map(course => {
                        const pColor = PLATFORM_COLOR[course.platform] ?? "var(--tk-gray-600)";
                        return (
                          <a key={course.title} href={course.url} target="_blank" rel="noopener noreferrer" style={{
                            background: "white", borderRadius: 16, padding: "18px 20px",
                            border: "1px solid var(--tk-gray-200)", textDecoration: "none",
                            display: "flex", alignItems: "flex-start", gap: 14, transition: "all .18s",
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${pColor}22`; (e.currentTarget as HTMLElement).style.borderColor = pColor + "60"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)"; }}
                          >
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: pColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                              {course.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: pColor + "18", color: pColor }}>
                                  {course.platform}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: course.free ? "var(--tk-mint)" : "var(--tk-orange-soft)", color: course.free ? "var(--tk-green-dark)" : "var(--tk-orange)" }}>
                                  {course.free ? "✓ Gratis" : "Berbayar"}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tk-gray-400)" }}>{course.level}</span>
                              </div>
                              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, color: "var(--tk-ink)", marginBottom: 4, lineHeight: 1.35 }}>
                                {course.title}
                              </div>
                            </div>
                            <ExternalLink size={14} style={{ color: "var(--tk-gray-400)", flexShrink: 0, marginTop: 2 }} />
                          </a>
                        );
                      })}
                    </div>

                    {/* Free vs Paid breakdown */}
                    <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 14, background: "white", border: "1px solid var(--tk-gray-200)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 20 }}>💡</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--tk-ink)", marginBottom: 3 }}>Tips memulai tanpa biaya</div>
                        <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>
                          Mulai dari kursus gratis terlebih dahulu untuk validasi minat. Coursera & edX bisa diaudit gratis (tanpa sertifikat). Dicoding & freeCodeCamp 100% gratis dengan sertifikat.
                        </div>
                      </div>
                      <a href="https://www.coursera.org/financial-aid" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tk-blue-600)", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Financial Aid Coursera →
                      </a>
                    </div>
                  </div>
                )}

                {/* ── Tab: Peluang ──────────────────────────────────────── */}
                {tab === "peluang" && (
                  <div>
                    <SectionHeader icon={Target} color="var(--tk-blue-600)" title="Peluang yang Cocok untuk Tipe Kamu" sub={`Beasiswa, magang & kompetisi untuk ${rConfig!.label}`} cta="Lihat Semua" onCta={() => navigate("/opportunities")} />
                    {opps.length === 0 ? (
                      <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--tk-gray-200)", padding: "40px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", marginBottom: 8 }}>Peluang sedang diperbarui</div>
                        <div style={{ fontSize: 13, color: "var(--tk-gray-500)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 20px" }}>
                          Scraper otomatis menambahkan peluang baru setiap hari. Kembali lagi besok atau cek halaman utama.
                        </div>
                        <button onClick={() => navigate("/opportunities")} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--tk-blue-600)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Buka Semua Peluang →
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {opps.map(opp => {
                          const cat = CAT_CFG[opp.category] ?? { label: opp.category, color: "var(--tk-gray-600)", bg: "var(--tk-gray-100)", emoji: "📌" };
                          const isExpired = opp.deadline && new Date(opp.deadline) < new Date();
                          const daysLeft = opp.deadline ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400_000) : null;
                          const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                          return (
                            <div key={opp.id} style={{
                              background: isUrgent ? "var(--tk-yellow-soft)" : "white", borderRadius: 16, padding: "16px 18px",
                              border: isUrgent ? "1.5px solid #FDE68A" : "1px solid var(--tk-gray-200)",
                              display: "flex", alignItems: "flex-start", gap: 14,
                            }}>
                              <div style={{ width: 42, height: 42, borderRadius: 12, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {cat.emoji}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: cat.bg, color: cat.color }}>{cat.label}</span>
                                  {isUrgent && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--tk-orange)" }}>⏰ {daysLeft} hari lagi!</span>}
                                  {isExpired && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tk-blue-700)" }}>Expired</span>}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--tk-ink)", lineHeight: 1.35, marginBottom: 5 }}>
                                  {opp.title}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--tk-gray-500)", flexWrap: "wrap" }}>
                                  {opp.organizer && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={11} />{opp.organizer.slice(0, 30)}</span>}
                                  {opp.location  && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} />{opp.location}</span>}
                                  {opp.deadline  && <span style={{ display: "flex", alignItems: "center", gap: 3, color: isExpired ? "var(--tk-blue-700)" : isUrgent ? "var(--tk-orange)" : "var(--tk-gray-500)", fontWeight: isUrgent ? 700 : 400 }}><Calendar size={11} />{new Date(opp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>}
                                </div>
                              </div>
                              {opp.url && (
                                <a href={opp.url} target="_blank" rel="noopener noreferrer" style={{
                                  flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "1px solid #BFDBFE",
                                  background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", fontSize: 12.5, fontWeight: 700,
                                  textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                                }}>
                                  <ExternalLink size={12} /> Buka
                                </a>
                              )}
                            </div>
                          );
                        })}
                        <button onClick={() => navigate("/opportunities")} style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1.5px dashed var(--tk-gray-300)", background: "transparent", color: "var(--tk-gray-500)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                          Lihat Semua Peluang →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Mentor & Komunitas ───────────────────────────── */}
                {tab === "mentor" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {/* Mentors from DB */}
                    <div>
                      <SectionHeader icon={Star} color="var(--tk-purple)" title="Mentor Tersedia" sub="Profesional berpengalaman siap membimbing kamu" />
                      {mentors.length === 0 ? (
                        <div style={{ background: "white", borderRadius: 14, border: "1px solid var(--tk-gray-200)", padding: "28px 24px", textAlign: "center" }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>👨‍🏫</div>
                          <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.6 }}>Program mentorship 1-on-1 dengan profesional sedang disiapkan. Coba komunitas di bawah untuk terhubung sekarang!</div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
                          {mentors.map(m => {
                            const initials = m.name.slice(0, 2).toUpperCase();
                            return (
                              <div key={m.id} style={{ background: "white", borderRadius: 16, padding: "18px 20px", border: "1px solid var(--tk-gray-200)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt={m.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--tk-purple), var(--tk-blue-600))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14.5, color: "var(--tk-ink)" }}>{m.name}</div>
                                  {m.title && <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginBottom: 6 }}>{m.title}</div>}
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                                    {(m.expertise_areas || []).slice(0, 3).map(e => (
                                      <span key={e} style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: "var(--tk-lilac)", color: "var(--tk-purple)" }}>{e}</span>
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                                    {m.rating && <span style={{ color: "var(--tk-orange)", fontWeight: 700 }}>★ {Number(m.rating).toFixed(1)}</span>}
                                    {m.experience_years && <span style={{ color: "var(--tk-gray-500)" }}>{m.experience_years} tahun exp</span>}
                                    {m.hourly_rate && <span style={{ color: "var(--tk-blue-600)", fontWeight: 700 }}>Rp{m.hourly_rate.toLocaleString("id-ID")}/jam</span>}
                                  </div>
                                </div>
                                <button onClick={() => navigate("/community")} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, var(--tk-purple), var(--tk-blue-600))", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                                  Hubungi
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Free Mentorship Platforms */}
                    <div>
                      <SectionHeader icon={Globe} color="var(--tk-green-dark)" title="Mentorship Gratis — ADPList" sub="Lebih dari 25.000 mentor di seluruh dunia, 0 biaya" />
                      <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--tk-green)", padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--tk-mint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🎓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "var(--tk-ink)", marginBottom: 4 }}>ADPList — 100% Gratis</div>
                          <div style={{ fontSize: 13, color: "var(--tk-gray-500)", lineHeight: 1.6, marginBottom: 12 }}>
                            Platform mentorship terpercaya dengan 25.000+ mentor di bidang tech, desain, bisnis & lebih banyak lagi. Booking sesi 1-on-1 langsung, gratis.
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {rConfig!.skills.slice(0, 3).map(skill => (
                              <a key={skill} href="https://adplist.org" target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 9, border: "1px solid var(--tk-green)", background: "var(--tk-mint)", color: "var(--tk-green-dark)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                Cari mentor {skill} →
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Community Cards */}
                    <div>
                      <SectionHeader icon={MessageCircle} color="var(--tk-blue-600)" title={`Komunitas untuk Tipe ${rConfig!.label}`} sub="Bergabung untuk belajar, sharing & networking" />
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
                        {rConfig!.communities.map(comm => (
                          <a key={comm.name} href={comm.url} target="_blank" rel="noopener noreferrer" style={{
                            background: "white", borderRadius: 16, padding: "18px 20px",
                            border: "1px solid var(--tk-gray-200)", textDecoration: "none",
                            display: "flex", alignItems: "flex-start", gap: 14, transition: "all .15s",
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = rConfig!.color + "60"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${rConfig!.color}18`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                          >
                            <div style={{ width: 46, height: 46, borderRadius: 13, background: rConfig!.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                              {comm.emoji}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "var(--tk-ink)" }}>{comm.name}</span>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: rConfig!.bg, color: rConfig!.color, display: "inline-block", marginBottom: 6 }}>
                                {comm.type}
                              </span>
                              <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>{comm.desc}</div>
                            </div>
                            <ExternalLink size={14} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* LinkedIn tip */}
                    <div style={{ borderRadius: 14, padding: "16px 20px", background: "var(--tk-blue-50)", border: "1px solid var(--tk-blue-200)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 22 }}>🔗</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--tk-blue-600)", marginBottom: 4 }}>Tips LinkedIn untuk Networking</div>
                        <div style={{ fontSize: 12.5, color: "var(--tk-blue-700)", lineHeight: 1.6 }}>
                          Optimasi headline LinkedIn dengan tipe RIASEC dan skill-mu ({rConfig!.skills.slice(0, 2).join(", ")}). Koneksi dengan alumni dari universitas target dan kirim pesan personal. Posting insight mingguan tentang bidangmu untuk bangun personal brand.
                        </div>
                        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "var(--tk-blue-600)", textDecoration: "none" }}>
                          <ExternalLink size={12} /> Buka LinkedIn →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
        <BottomNavigationBar />
      </div>
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

function NoAssessmentState({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, flexDirection: "column", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 72 }}>🧠</div>
      <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24, color: "var(--tk-ink)", margin: 0 }}>Belum Ada Profil RIASEC-mu</h2>
      <p style={{ fontSize: 15, color: "var(--tk-gray-500)", maxWidth: 420, lineHeight: 1.7 }}>
        Ikuti tes RIASEC terlebih dahulu. Hanya 8 pertanyaan — hasilnya menentukan rekomendasi kursus, peluang, mentor, dan rencana aksi yang paling cocok untukmu.
      </p>
      <button onClick={() => navigate("/assessment")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,var(--tk-blue-500),var(--tk-purple))", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
        <Sparkles size={18} /> Mulai Tes RIASEC — Gratis →
      </button>
    </div>
  );
}

function HeroCard({ rConfig, firstName, xpData, levelPct, completedCount, completedWeekCount, isMobile }: {
  rConfig: typeof RIASEC[string]; firstName: string; xpData: { current_xp: number; current_level: number } | null;
  levelPct: number; completedCount: number; completedWeekCount: number; isMobile: boolean;
}) {
  return (
    <div style={{ borderRadius: 24, overflow: "hidden", background: `linear-gradient(${rConfig.gradient})`, border: `1.5px solid ${rConfig.color}30`, marginBottom: 20, position: "relative" }}>
      <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: `${rConfig.color}12`, pointerEvents: "none" }} />
      <div style={{ padding: isMobile ? "22px 18px" : "28px 32px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ width: 66, height: 66, borderRadius: 18, background: "rgba(255,255,255,.75)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, marginBottom: 5, boxShadow: `0 4px 14px ${rConfig.color}28` }}>
              {rConfig.emoji}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: rConfig.color, letterSpacing: ".06em", textTransform: "uppercase" }}>{rConfig.label}</div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: `${rConfig.color}cc`, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 3px" }}>Focus Action Plan</p>
            <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: isMobile ? 18 : 22, color: "var(--tk-ink)", margin: "0 0 5px", letterSpacing: "-.02em" }}>
              Hei {firstName}! Ini rencana personalmu 🎯
            </h1>
            <p style={{ fontSize: 13.5, color: "var(--tk-gray-600)", margin: "0 0 14px", lineHeight: 1.55 }}>{rConfig.tagline}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {rConfig.careerPaths.map(c => (
                <span key={c} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,.7)", color: rConfig.color, border: `1px solid ${rConfig.color}35` }}>{c}</span>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
            {xpData && (
              <div style={{ background: "rgba(255,255,255,.8)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${rConfig.color}25`, textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Level {xpData.current_level}</div>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: rConfig.color }}>{xpData.current_xp} XP</div>
                <div style={{ height: 5, background: `${rConfig.color}22`, borderRadius: 99, margin: "6px 0 3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${levelPct}%`, background: rConfig.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--tk-gray-400)" }}>{100 - (xpData.current_xp % 100)} XP lagi</div>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,.8)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${rConfig.color}25`, textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Minggu Ini</div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: rConfig.color }}>{completedCount}<span style={{ fontSize: 13 }}>/5</span></div>
              <div style={{ fontSize: 10, color: "var(--tk-gray-400)" }}>aksi selesai</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.8)", borderRadius: 14, padding: "12px 16px", border: `1px solid ${rConfig.color}25`, textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>Fase</div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: rConfig.color }}>{completedWeekCount}<span style={{ fontSize: 13 }}>/4</span></div>
              <div style={{ fontSize: 10, color: "var(--tk-gray-400)" }}>bulan selesai</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--tk-gray-500)", fontWeight: 600 }}>Skills target:</span>
          {rConfig.skills.map(s => (
            <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 99, background: `${rConfig.color}18`, color: rConfig.color }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action, index, checked, onToggle, rConfig }: {
  action: string; index: number; checked: boolean; onToggle: () => void;
  rConfig: typeof RIASEC[string];
}) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "flex-start", gap: 14, background: checked ? "var(--tk-mint)" : "white",
      borderRadius: 14, padding: "14px 18px",
      border: checked ? `1.5px solid var(--tk-green)` : "1px solid var(--tk-gray-200)", cursor: "pointer", transition: "all .15s",
    }}>
      {checked ? <CheckSquare size={20} style={{ color: "var(--tk-green)", flexShrink: 0, marginTop: 1 }} /> : <Square size={20} style={{ color: "var(--tk-gray-300)", flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: rConfig.color, background: rConfig.bg, padding: "1px 7px", borderRadius: 99 }}>Aksi {index + 1}</span>
          {checked && <span style={{ fontSize: 11, color: "var(--tk-green)", fontWeight: 700 }}>✓ Selesai!</span>}
        </div>
        <p style={{ fontSize: 13.5, color: checked ? "var(--tk-gray-400)" : "var(--tk-gray-700)", margin: 0, lineHeight: 1.5, textDecoration: checked ? "line-through" : "none" }}>
          {action}
        </p>
      </div>
      {checked && <Award size={18} style={{ color: "var(--tk-green)", flexShrink: 0 }} />}
    </div>
  );
}

function SectionHeader({ icon: Icon, color, title, sub, cta, onCta }: {
  icon: React.ElementType; color: string; title: string; sub?: string; cta?: string; onCta?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "var(--tk-ink)" }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--tk-gray-500)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {cta && onCta && (
        <button onClick={onCta} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--tk-gray-200)", background: "white", fontSize: 12.5, color: "var(--tk-gray-600)", fontWeight: 600, cursor: "pointer" }}>
          {cta} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

export default FocusAction;
