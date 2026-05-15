import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  BookOpen, Trophy, Star, TrendingUp, Award,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ColorKey = "blue" | "green" | "orange" | "yellow" | "purple";

interface TimelineItem {
  icon: React.ElementType;
  color: ColorKey;
  time: string;
  title: string;
  meta: string;
}

interface TimelineGroup {
  date: string;
  items: TimelineItem[];
}

// ─── Color tints ───────────────────────────────────────────────────────────────

const TINTS: Record<ColorKey, [string, string]> = {
  blue:   ["var(--tk-blue-50,#E8F1FF)",      "var(--tk-blue-700,#1E40AF)"],
  green:  ["var(--tk-mint,#D1FAE5)",          "var(--tk-green-dark,#0F7A3E)"],
  orange: ["var(--tk-orange-soft,#FFEDE2)",   "var(--tk-orange,#FF6A00)"],
  yellow: ["var(--tk-yellow-soft,#FFF6E0)",   "#A47000"],
  purple: ["var(--tk-lilac,#EDE9FE)",         "#5B21B6"],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Group an array of items by a date-string key */
function groupByDate(items: Array<{ dateKey: string; item: TimelineItem }>): TimelineGroup[] {
  const map = new Map<string, TimelineItem[]>();
  for (const { dateKey, item } of items) {
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(item);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

function friendlyDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === todayStr) return "Hari Ini";
  if (d.toDateString() === yest.toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── Filter options ────────────────────────────────────────────────────────────

const FILTERS = ["Semua aktivitas", "Belajar", "Pencapaian", "Komunitas"];

// ─── Sub-components ────────────────────────────────────────────────────────────

const FilterDropdown = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1.5px solid var(--tk-gray-200, #E5E7EB)",
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 13.5,
          fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
          color: "var(--tk-ink, #0B1D3A)",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {value}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "#fff",
            border: "1.5px solid var(--tk-gray-200, #E5E7EB)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,.10)",
            zIndex: 50,
            minWidth: 190,
          }}
        >
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { onChange(f); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontSize: 13.5,
                fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                color: f === value ? "var(--tk-blue-600, #1D4ED8)" : "var(--tk-ink, #0B1D3A)",
                fontWeight: f === value ? 600 : 400,
                background: f === value ? "var(--tk-blue-50, #E8F1FF)" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineDot = ({
  icon: Icon,
  color,
}: {
  icon: React.ElementType;
  color: ColorKey;
}) => {
  const [bg, fg] = TINTS[color];
  return (
    <div
      style={{
        position: "absolute",
        left: -32,
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: bg,
        color: fg,
        border: "3px solid #fff",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.10)",
        flexShrink: 0,
      }}
    >
      <Icon size={14} color={fg} strokeWidth={2.5} />
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const DiscoveryTimeline = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("timeline");
  const [filter, setFilter] = useState("Semua aktivitas");
  const [timelineData, setTimelineData] = useState<TimelineGroup[]>([]);

  // ── Auth guard + real data fetch ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadTimelineData(session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  // C-06: Load real timeline from achievements + assessment_results
  const loadTimelineData = async (userId: string) => {
    try {
      const rawItems: Array<{ dateKey: string; item: TimelineItem }> = [];

      // Load achievements (badges earned)
      const { data: achievements } = await supabase
        .from("achievements")
        .select("title, description, type, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })
        .limit(20);

      for (const a of achievements ?? []) {
        rawItems.push({
          dateKey: friendlyDate(a.earned_at),
          item: {
            icon: a.type === "assessment" ? Star : Trophy,
            color: "yellow",
            time: formatTime(a.earned_at),
            title: "Badge Diperoleh",
            meta: `${a.title}${a.description ? ` — ${a.description}` : ""}`,
          },
        });
      }

      // Load assessment completions
      const { data: assessments } = await supabase
        .from("assessment_results")
        .select("assessment_type, personality_type, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(10);

      for (const r of assessments ?? []) {
        rawItems.push({
          dateKey: friendlyDate(r.completed_at),
          item: {
            icon: Award,
            color: "purple",
            time: formatTime(r.completed_at),
            title: "Tes Selesai",
            meta: `${r.assessment_type === "personality_interest" ? "Tes Minat & Bakat" : r.assessment_type}${r.personality_type ? ` — Tipe ${r.personality_type}` : ""}`,
          },
        });
      }

      // Load learning progress updates
      const { data: progress } = await supabase
        .from("learning_progress")
        .select("completed_at, content_id")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(15);

      for (const p of progress ?? []) {
        if (!p.completed_at) continue;
        rawItems.push({
          dateKey: friendlyDate(p.completed_at),
          item: {
            icon: BookOpen,
            color: "blue",
            time: formatTime(p.completed_at),
            title: "Kursus Diselesaikan",
            meta: "Materi pembelajaran selesai",
          },
        });
      }

      // Sort all items newest-first within each group
      rawItems.sort((a, b) => {
        // put "Hari Ini" first, "Kemarin" second, rest by actual date desc
        const order = (s: string) => s === "Hari Ini" ? 0 : s === "Kemarin" ? 1 : 2;
        return order(a.dateKey) - order(b.dateKey);
      });

      setTimelineData(groupByDate(rawItems));
    } catch (err) {
      console.error("Error loading timeline:", err);
      setTimelineData([]);
    }
  };

  // ── Sign-out ──
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (error: any) {
      toast.error("Gagal logout: " + error.message);
    }
  };

  // ── Navigation handler ──
  const handleNav = (section: string) => {
    if (section === "community")    { navigate("/community");  return; }
    if (section === "overview")     { navigate("/dashboard");  return; }
    if (section === "courses")      { navigate("/learning");   return; }
    if (section === "opportunities"){ navigate("/opportunities"); return; }
    if (section === "profile")      { navigate("/profile");    return; }
    if (section === "timeline")     { navigate("/discovery");  return; }
    // fallback: go to dashboard with the section
    navigate("/dashboard");
    setActiveSection(section);
  };

  // ── Filter logic ──
  const filterGroup = (group: TimelineGroup): TimelineGroup => {
    if (filter === "Semua aktivitas") return group;
    const keywords: Record<string, string[]> = {
      "Belajar":    ["Kursus", "Sertifikat", "Progress", "Diselesaikan", "Dimulai"],
      "Pencapaian": ["Badge", "Tantangan", "Diperoleh", "Tes Selesai"],
      "Komunitas":  ["Komunitas", "Diskusi"],
    };
    const kw = keywords[filter] ?? [];
    return {
      ...group,
      items: group.items.filter(item =>
        kw.some(k => item.title.includes(k) || item.meta.includes(k))
      ),
    };
  };

  const visibleGroups = timelineData
    .map(filterGroup)
    .filter(g => g.items.length > 0);

  // ── Loading state ──
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--tk-gray-50, #F9FAFB)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full border-b-2 border-primary mx-auto mb-4"
            style={{ width: 44, height: 44, borderColor: "var(--tk-blue-600, #1D4ED8)" }}
          />
          <p style={{ color: "var(--tk-gray-500, #6B7280)", fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)" }}>
            Memuat timeline...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: "var(--tk-gray-50, #F9FAFB)" }}
    >
      {/* ── Sidebar ── */}
      <DashboardSidebar
        activeSection={activeSection}
        setActiveSection={handleNav}
        onSignOut={handleSignOut}
      />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader user={user} profile={null} onSignOut={handleSignOut} />

        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "#fff", borderColor: "var(--tk-gray-200, #E5E7EB)" }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
              alt="Talentika"
              className="w-8 h-8 object-contain"
            />
            <span
              style={{
                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--tk-blue-600, #1D4ED8)",
              }}
            >
              Talentika
            </span>
          </div>
        </div>

        {/* Page content */}
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
                paddingBottom: 28,
                paddingTop: 8,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                    fontWeight: 700,
                    fontSize: 30,
                    color: "var(--tk-ink, #0B1D3A)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Timeline
                </h1>
                <p
                  style={{
                    marginTop: 6,
                    color: "var(--tk-gray-500, #6B7280)",
                    fontSize: 14,
                    fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                  }}
                >
                  Riwayat aktivitas, pencapaian, dan pengingat penting.
                </p>
              </div>

              <FilterDropdown value={filter} onChange={setFilter} />
            </div>

            {/* ── Timeline card ── */}
            <div
              style={{
                background: "#fff",
                borderRadius: "var(--tk-radius-lg, 20px)",
                border: "1.5px solid var(--tk-gray-200, #E5E7EB)",
                padding: "28px 32px",
                maxWidth: 780,
              }}
            >
              {visibleGroups.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 0",
                    color: "var(--tk-gray-400, #9CA3AF)",
                    fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                  }}
                >
                  <p style={{ fontSize: 15 }}>Tidak ada aktivitas untuk filter ini.</p>
                </div>
              ) : visibleGroups.length === 0 && !loading ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--tk-gray-400,#9CA3AF)", fontFamily: "var(--tk-font-sans,'Inter',sans-serif)" }}>
                  <TrendingUp size={40} style={{ margin: "0 auto 12px", opacity: .35 }} />
                  <p style={{ fontSize: 15, margin: 0 }}>Belum ada aktivitas.</p>
                  <p style={{ fontSize: 13, marginTop: 6 }}>Selesaikan tes atau kursus untuk melihat riwayat di sini.</p>
                </div>
              ) : (
                visibleGroups.map((group, gi) => (
                  <div key={gi} style={{ marginBottom: gi < visibleGroups.length - 1 ? 32 : 0 }}>
                    {/* Group date label */}
                    <p
                      style={{
                        fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--tk-gray-500, #6B7280)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: 14,
                        marginTop: 0,
                      }}
                    >
                      {group.date}
                    </p>

                    {/* Items container */}
                    <div style={{ position: "relative", paddingLeft: 32 }}>
                      {/* Vertical line */}
                      <div
                        style={{
                          position: "absolute",
                          left: 15,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          background: "var(--tk-gray-200, #E5E7EB)",
                          borderRadius: 2,
                        }}
                      />

                      {/* Timeline items */}
                      {group.items.map((item, ii) => (
                        <div
                          key={ii}
                          style={{
                            display: "flex",
                            gap: 14,
                            paddingBottom: ii < group.items.length - 1 ? 18 : 0,
                            position: "relative",
                          }}
                        >
                          <TimelineDot icon={item.icon} color={item.color} />

                          {/* Text block */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: "var(--tk-gray-500, #6B7280)",
                                fontFamily: "var(--tk-font-mono, 'JetBrains Mono', monospace)",
                                margin: "0 0 2px",
                              }}
                            >
                              {item.time}
                            </p>
                            <p
                              style={{
                                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                fontWeight: 600,
                                fontSize: 14.5,
                                color: "var(--tk-ink, #0B1D3A)",
                                margin: "0 0 2px",
                                lineHeight: 1.25,
                              }}
                            >
                              {item.title}
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--tk-gray-600, #4B5563)",
                                margin: 0,
                                fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                              }}
                            >
                              {item.meta}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </main>

        <BottomNavigationBar activeSection="timeline" onSectionChange={handleNav} />
      </div>
    </div>
  );
};

export default DiscoveryTimeline;
