import { useState, useEffect } from "react";
import {
  BookOpen, Clock, Activity, Shield, Star, ChevronRight,
  ChevronLeft, Bookmark, MoreHorizontal, Play, Video, FileText, Headphones,
  Trophy, Target, Brain,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ─── colour tints map ────────────────────────────────────────────────────────
const TINTS: Record<string, [string, string]> = {
  blue:   ["var(--tk-blue-50)",    "var(--tk-blue-700)"],
  green:  ["var(--tk-mint)",       "var(--tk-green-dark)"],
  orange: ["var(--tk-orange-soft)","var(--tk-orange)"],
  yellow: ["var(--tk-yellow-soft)","#A47000"],
  purple: ["var(--tk-lilac)",      "#5B21B6"],
  pink:   ["#FCE7F3",              "#B83280"],
};

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, color, label, value, sub,
}: {
  icon: React.ElementType; color: string; label: string; value: string; sub: string;
}) {
  const [bg, fg] = TINTS[color] ?? TINTS.blue;
  return (
    <div
      className="rounded-2xl flex items-center gap-4 transition-shadow hover:shadow-md"
      style={{
        background: "white",
        border: "1px solid var(--tk-gray-200)",
        padding: 18,
      }}
    >
      <div
        className="flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{ width: 48, height: 48, background: bg, color: fg }}
      >
        <Icon size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--tk-gray-500)", fontWeight: 500 }}>{label}</div>
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 26,
            color: "var(--tk-ink)",
            lineHeight: 1.15,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--tk-gray-500)" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Course thumbnail ────────────────────────────────────────────────────────
const COURSE_GRADS: Record<string, string> = {
  blue:   "linear-gradient(135deg,#DBEAFE,#93C5FD)",
  green:  "linear-gradient(135deg,#D1FAE5,#6EE7B7)",
  orange: "linear-gradient(135deg,#FFEDE2,#FDB97D)",
  purple: "linear-gradient(135deg,#EDE9FE,#C4B5FD)",
  yellow: "linear-gradient(135deg,#FFF6E0,#FDE68A)",
};

function CourseThumb({ color = "blue", icon = "📚", sm = false }: { color?: string; icon?: string; sm?: boolean }) {
  const size = sm ? 44 : 56;
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-xl"
      style={{
        width: size,
        height: size,
        background: COURSE_GRADS[color] ?? COURSE_GRADS.blue,
        fontSize: sm ? 20 : 26,
      }}
    >
      {icon}
    </div>
  );
}

// ─── Mini calendar ───────────────────────────────────────────────────────────
function MiniCalendar() {
  const now = new Date();
  const today = now.getDate();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  // C-08: real activity days loaded from learning_progress
  const [scheduled, setScheduled] = useState<Set<number>>(new Set());

  const DAYS  = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const MONTHS = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];

  // Load activity days from DB whenever the calendar month changes
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from("learning_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", startOfMonth)
        .lte("completed_at", endOfMonth);

      const days = new Set<number>(
        (data ?? []).map(r => new Date(r.completed_at!).getDate())
      );
      setScheduled(days);
    })();
  }, [month, year]);

  // first weekday of month (Mon=0)
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // convert Sun=0 to Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3"
        style={{ padding: "0 4px" }}
      >
        <button
          onClick={prev}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--tk-gray-600)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <ChevronLeft size={14} />
        </button>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13.5 }}>
          {MONTHS[month]} {year}
        </div>
        <button
          onClick={next}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--tk-gray-600)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          fontSize: 11,
          color: "var(--tk-gray-500)",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Dates grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday = d === today && month === now.getMonth() && year === now.getFullYear();
          const isSch   = scheduled.has(d);
          return (
            <div
              key={i}
              style={{
                aspectRatio: "1/1",
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                fontSize: 12.5,
                fontFamily: "var(--tk-font-display)",
                fontWeight: isToday || isSch ? 700 : 500,
                background: isToday ? "var(--tk-blue-600)" : isSch ? "var(--tk-blue-50)" : "transparent",
                color: isToday ? "#fff" : isSch ? "var(--tk-blue-700)" : "var(--tk-gray-700)",
                cursor: "pointer",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Badge / hexagon icon ────────────────────────────────────────────────────
function BadgeHex({ icon: Icon, color, size = 52 }: { icon: React.ElementType; color: string; size?: number }) {
  const [bg, fg] = TINTS[color] ?? TINTS.blue;
  return (
    <div
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 30% 30%, ${bg}, ${fg})`,
        clipPath: "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.4} />
    </div>
  );
}

// ─── Filter dropdown ─────────────────────────────────────────────────────────
const STATUS_OPTS = ["Semua Status", "Sedang Berjalan", "Selesai", "Belum Dimulai"];

function FilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl transition-colors"
        style={{
          padding: "8px 14px",
          background: "white",
          border: "1px solid var(--tk-gray-200)",
          cursor: "pointer",
          fontFamily: "var(--tk-font-display)",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--tk-gray-700)",
        }}
      >
        {value}
        <ChevronRight
          size={14}
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: ".15s" }}
        />
      </button>
      {open && (
        <div
          className="tk-page-in"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "white",
            borderRadius: 12,
            boxShadow: "var(--tk-shadow-lg)",
            border: "1px solid var(--tk-gray-200)",
            minWidth: 200,
            padding: 6,
            zIndex: 30,
          }}
          onMouseLeave={() => setOpen(false)}
        >
          {STATUS_OPTS.map(o => (
            <div
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13.5,
                color: o === value ? "var(--tk-blue-700)" : "var(--tk-gray-700)",
                background: o === value ? "var(--tk-blue-50)" : "transparent",
                fontWeight: o === value ? 600 : 500,
                fontFamily: "var(--tk-font-sans)",
              }}
              onMouseEnter={e => {
                if (o !== value) (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-50)";
              }}
              onMouseLeave={e => {
                if (o !== value) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const COURSE_COLORS = ["blue", "green", "orange", "purple", "yellow"];
const COURSE_ICONS  = ["📚", "🎨", "💻", "🔬", "🎯", "✏️", "🏆", "🌐"];

function courseColor(idx: number) { return COURSE_COLORS[idx % COURSE_COLORS.length]; }
function courseIcon(idx: number)  { return COURSE_ICONS[idx  % COURSE_ICONS.length];  }

function getContentIcon(t: string) {
  switch (t) {
    case "video":   return Video;
    case "article": return FileText;
    case "podcast": return Headphones;
    default:        return BookOpen;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

export const CoursesSection = () => {
  const navigate = useNavigate();

  const [enrolledContent,   setEnrolledContent]   = useState<any[]>([]);
  const [personalizedContent, setPersonalizedContent] = useState<any[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [userInterests,     setUserInterests]     = useState<any[]>([]);
  const [filter,            setFilter]            = useState("Semua Status");
  const [page,              setPage]              = useState(1);
  const [loading,           setLoading]           = useState(true);

  // derived stats
  const totalHours = Math.round(
    enrolledContent.reduce((s: number, e: any) =>
      s + (e.learning_content?.duration_minutes ?? 0), 0
    ) / 60
  );
  const avgProgress = enrolledContent.length
    ? Math.round(
        enrolledContent.reduce((s: number, e: any) => s + (e.progress_percentage ?? 0), 0) /
        enrolledContent.length
      )
    : 0;
  const certCount = enrolledContent.filter((e: any) => e.status === "completed").length;

  // filter applied
  const filtered = enrolledContent.filter((e: any) => {
    if (filter === "Semua Status") return true;
    if (filter === "Selesai")        return e.status === "completed";
    if (filter === "Belum Dimulai")  return e.status === "not_started" || !e.status;
    return e.status === "in_progress";
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { data: enrolled },
          { data: interests },
          { data: assessment },
        ] = await Promise.all([
          supabase
            .from("learning_progress")
            .select("*, learning_content(*, learning_categories(name, icon, color))")
            .eq("user_id", user.id),
          supabase
            .from("user_interests")
            .select("*, interest_categories(*)")
            .eq("user_id", user.id),
          supabase
            .from("assessment_results")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        setEnrolledContent(enrolled  ?? []);
        setUserInterests(interests   ?? []);
        setAssessmentResults(assessment);

        // load recommendations
        const catIds = (interests ?? []).map((i: any) => i.category_id);
        const query = supabase
          .from("learning_content")
          .select("*, learning_categories(name, icon, color)")
          .eq("is_active", true)
          .limit(4);

        const { data: recs } = catIds.length
          ? await query.in("category_id", catIds)
          : await query;
        setPersonalizedContent(recs ?? []);
      } catch (err) {
        console.error("CoursesSection load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleContinue = (contentId: string) => {
    navigate(`/learning?content=${contentId}`);
  };

  // reset page when filter changes
  const handleFilter = (v: string) => { setFilter(v); setPage(1); };

  return (
    <div className="tk-page-in" style={{ paddingTop: 8 }}>
      {/* ── Page header ────────────────────────────────────────── */}
      <div
        className="flex items-end justify-between flex-wrap gap-4"
        style={{ padding: "8px 0 24px" }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 30,
              color: "var(--tk-ink)",
              marginBottom: 6,
              letterSpacing: "-.02em",
            }}
          >
            Kursus Saya
          </h1>
          <p style={{ color: "var(--tk-gray-500)", margin: 0, fontSize: 14 }}>
            Kelola dan lanjutkan pembelajaranmu untuk mencapai tujuan terbaik.
          </p>
        </div>
        <FilterDropdown value={filter} onChange={handleFilter} />
      </div>

      {/* ── 4-col stat cards ───────────────────────────────────── */}
      <div
        className="grid gap-4 mb-5"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl flex items-center gap-4 animate-pulse"
              style={{ background: "white", border: "1px solid var(--tk-gray-200)", padding: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "var(--tk-gray-150)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, background: "var(--tk-gray-150)", borderRadius: 6, marginBottom: 8, width: "60%" }} />
                <div style={{ height: 20, background: "var(--tk-gray-150)", borderRadius: 6, marginBottom: 6, width: "40%" }} />
                <div style={{ height: 9, background: "var(--tk-gray-150)", borderRadius: 6, width: "70%" }} />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard icon={BookOpen} color="blue"   label="Kursus Aktif"       value={String(enrolledContent.length)} sub="Lanjutkan belajar!" />
            <StatCard icon={Clock}    color="green"  label="Jam Belajar"         value={String(totalHours)}             sub="Jam" />
            <StatCard icon={Activity} color="yellow" label="Progress Rata-rata"  value={`${avgProgress}%`}              sub="Semangat!" />
            <StatCard icon={Shield}   color="purple" label="Sertifikat"          value={String(certCount)}              sub="Sertifikat diperoleh" />
          </>
        )}
      </div>

      {/* ── Main 2-col area ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* LEFT: course list */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "white",
            border: "1px solid var(--tk-gray-200)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between"
            style={{ padding: "20px 22px 14px" }}
          >
            <h3
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--tk-ink)",
              }}
            >
              Kursus Aktif
            </h3>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--tk-blue-600)",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Lihat Semua
            </button>
          </div>

          {loading ? (
            /* ── Skeleton loading ── */
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", borderTop: "1px solid var(--tk-gray-150)" }}>
                <div className="animate-pulse" style={{ width: 56, height: 56, borderRadius: 14, background: "var(--tk-gray-150)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="animate-pulse" style={{ height: 13, background: "var(--tk-gray-150)", borderRadius: 6, marginBottom: 8, width: "65%" }} />
                  <div className="animate-pulse" style={{ height: 10, background: "var(--tk-gray-150)", borderRadius: 6, marginBottom: 10, width: "40%" }} />
                  <div className="animate-pulse" style={{ height: 6, background: "var(--tk-gray-150)", borderRadius: 99, width: "80%" }} />
                </div>
                <div className="animate-pulse" style={{ width: 80, height: 32, borderRadius: 10, background: "var(--tk-gray-150)", flexShrink: 0 }} />
              </div>
            ))
          ) : pageItems.length === 0 ? (
            /* ── Rich empty state ── */
            <div style={{ padding: "44px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>📚</div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "var(--tk-ink)", marginBottom: 6 }}>
                Kamu belum mendaftar kursus apapun
              </div>
              <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)", marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" }}>
                Mulai perjalanan belajarmu sekarang. Ribuan kursus menunggu — dari desain, coding, bisnis, hingga pengembangan diri.
              </div>
              <button
                onClick={() => navigate("/learning")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 28px", borderRadius: 14, border: "none",
                  background: "var(--tk-blue-600)", color: "#fff", cursor: "pointer",
                  fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
                  boxShadow: "0 4px 14px rgba(37,99,235,.3)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
              >
                <BookOpen size={16} /> Jelajahi Kursus Sekarang
              </button>
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => navigate("/assessment")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--tk-font-display)", fontSize: 13,
                    color: "var(--tk-blue-600)", fontWeight: 600,
                    textDecoration: "underline", textUnderlineOffset: 3,
                  }}
                >
                  Atau ikuti assessment untuk rekomendasi kursus personal →
                </button>
              </div>
            </div>
          ) : (
            pageItems.map((enrollment: any, idx: number) => {
              const content  = enrollment.learning_content ?? {};
              const progress = enrollment.progress_percentage ?? 0;
              const color    = courseColor(idx + (page - 1) * PAGE_SIZE);
              const icon     = content.learning_categories?.icon ?? courseIcon(idx);
              const modules  = Math.ceil((content.duration_minutes ?? 60) / 12);

              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4"
                  style={{
                    padding: "18px 22px",
                    borderTop: "1px solid var(--tk-gray-150)",
                  }}
                >
                  <CourseThumb color={color} icon={icon} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 600,
                        fontSize: 15,
                        color: "var(--tk-ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {content.title ?? "Kursus"}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 2 }}>
                      {content.learning_categories?.name ?? "Umum"} · {modules} Modul
                    </div>
                    {/* progress bar */}
                    <div className="flex items-center gap-3 mt-2.5">
                      <div
                        className="flex-1 rounded-full"
                        style={{ height: 6, background: "var(--tk-gray-150)", maxWidth: 280 }}
                      >
                        <div
                          className="rounded-full"
                          style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: "var(--tk-blue-600)",
                            transition: "width .8s var(--tk-ease-lift, ease)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--tk-font-display)",
                          fontWeight: 700,
                          color: "var(--tk-blue-700)",
                          fontSize: 13,
                        }}
                      >
                        {progress}%
                      </span>
                    </div>
                  </div>

                  {/* Continue button */}
                  <button
                    onClick={() => handleContinue(content.id)}
                    className="flex items-center gap-1.5 rounded-xl transition-colors"
                    style={{
                      padding: "7px 14px",
                      background: "var(--tk-gray-50)",
                      border: "1px solid var(--tk-gray-200)",
                      cursor: "pointer",
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--tk-gray-700)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-50)"; }}
                  >
                    <Play size={13} /> Lanjutkan
                  </button>

                  {/* More options */}
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--tk-gray-400)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              );
            })
          )}

          {/* Pagination */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 22px",
              borderTop: "1px solid var(--tk-gray-150)",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--tk-gray-500)" }}>
              Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} kursus
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{
                  border: "1px solid var(--tk-gray-200)",
                  background: "transparent",
                  cursor: page === 1 ? "default" : "pointer",
                  color: page === 1 ? "var(--tk-gray-300)" : "var(--tk-gray-600)",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13,
                    background: p === page ? "var(--tk-blue-600)" : "transparent",
                    color: p === page ? "#fff" : "var(--tk-gray-700)",
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                style={{
                  border: "1px solid var(--tk-gray-200)",
                  background: "transparent",
                  cursor: page === totalPages ? "default" : "pointer",
                  color: page === totalPages ? "var(--tk-gray-300)" : "var(--tk-gray-600)",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: sidebar */}
        <div className="flex flex-col gap-4">
          {/* Mini calendar */}
          <div
            className="rounded-2xl"
            style={{
              background: "white",
              border: "1px solid var(--tk-gray-200)",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--tk-ink)",
                marginBottom: 14,
              }}
            >
              Kalender <span style={{ color: "var(--tk-gray-500)", fontWeight: 600 }}>Belajar</span>
            </h3>
            <MiniCalendar />
          </div>

          {/* Recommendations */}
          <div
            className="rounded-2xl"
            style={{
              background: "white",
              border: "1px solid var(--tk-gray-200)",
              padding: "18px 20px",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--tk-ink)",
                }}
              >
                Rekomendasi <span style={{ color: "var(--tk-gray-500)", fontWeight: 600 }}>Untukmu</span>
              </h3>
              <button
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-display)",
                  fontWeight: 600, fontSize: 13,
                }}
              >
                Lihat Semua
              </button>
            </div>

            {personalizedContent.length === 0 ? (
              <div style={{ padding: "16px 0", textAlign: "center", color: "var(--tk-gray-400)", fontSize: 13 }}>
                Belum ada rekomendasi
              </div>
            ) : (
              personalizedContent.map((rec: any, idx: number) => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: "10px 0",
                    borderTop: idx === 0 ? "none" : "1px solid var(--tk-gray-150)",
                  }}
                >
                  <CourseThumb color={courseColor(idx)} icon={rec.learning_categories?.icon ?? courseIcon(idx)} sm />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--tk-gray-500)", marginTop: 2 }}>
                      {rec.learning_categories?.name ?? "Umum"}
                    </div>
                    <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11.5, color: "var(--tk-gray-700)" }}>
                      <Star size={12} style={{ color: "var(--tk-yellow)", fill: "var(--tk-yellow)" }} />
                      4.8
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--tk-gray-400)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Bookmark size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Latest achievement */}
          <div
            className="rounded-2xl"
            style={{
              background: "white",
              border: "1px solid var(--tk-gray-200)",
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "var(--tk-ink)",
                }}
              >
                Pencapaian <span style={{ color: "var(--tk-gray-500)", fontWeight: 600 }}>Terbaru</span>
              </h3>
              <button
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--tk-blue-600)", fontFamily: "var(--tk-font-display)",
                  fontWeight: 600, fontSize: 13,
                }}
              >
                Lihat Semua
              </button>
            </div>

            <div className="flex items-center gap-3" style={{ padding: "8px 0" }}>
              <BadgeHex icon={Star} color="green" size={52} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 700,
                    color: "var(--tk-ink)",
                    fontSize: 14,
                  }}
                >
                  Consistent Learner
                </div>
                <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>
                  Belajar selama 7 hari berturut-turut
                </div>
                <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)", marginTop: 2 }}>
                  Diperoleh 2 hari lalu
                </div>
              </div>
              <span
                className="tk-sparkle"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  fontSize: 16,
                  color: "var(--tk-yellow)",
                }}
              >
                ✦
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
