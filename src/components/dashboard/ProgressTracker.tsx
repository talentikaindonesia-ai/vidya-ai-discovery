import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Activity, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Types ─────────────────────────────────────────────── */
interface CourseProgressRow {
  id: string;
  progress_percentage: number | null;
  time_spent_minutes: number | null;
  learning_content: {
    title: string;
    learning_categories: { name: string } | null;
  } | null;
}

/* ─── Weekly bar-chart data ──────────────────────────────── */
const WEEKLY_DATA = [
  { d: "Sen", h: 2.5 },
  { d: "Sel", h: 3.0 },
  { d: "Rab", h: 1.5 },
  { d: "Kam", h: 4.2 },
  { d: "Jum", h: 3.5 },
  { d: "Sab", h: 2.0 },
  { d: "Min", h: 1.0 },
];
const MAX_H = Math.max(...WEEKLY_DATA.map((x) => x.h));

/* ─── Radar chart data ───────────────────────────────────── */
const RADAR_SKILLS = ["Design", "Coding", "Komunikasi", "Analitik", "Kreatif", "Leadership"];
const RADAR_VALUES = [85, 70, 60, 75, 90, 55];
const CX = 150;
const CY = 140;
const R = 110;
const N = RADAR_SKILLS.length;

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)];
}

function buildPolygon(values: number[]): string {
  return values
    .map((v, i) => {
      const r = (v / 100) * R;
      const [x, y] = polarToXY((360 / N) * i, r);
      return `${x},${y}`;
    })
    .join(" ");
}

function buildGridPolygon(pct: number): string {
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = polarToXY((360 / N) * i, R * pct);
    return `${x},${y}`;
  }).join(" ");
}

/* ─── Stat card helper ───────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  sub: string;
}

function StatCard({ icon, iconBg, value, label, sub }: StatCardProps) {
  return (
    <div
      className="tk-card"
      style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--tk-ink)",
            fontFamily: "var(--tk-font-display)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>{sub}</div>
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────── */
export const ProgressTracker = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [totalHours, setTotalHours] = useState<number>(0);
  const [courseProgress, setCourseProgress] = useState<CourseProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("learning_progress")
        .select(
          `id, progress_percentage, time_spent_minutes,
           learning_content(title, learning_categories(name))`
        )
        .eq("user_id", user.id);

      if (data) {
        const rows = data as unknown as CourseProgressRow[];
        const hours = rows.reduce(
          (sum, r) => sum + (r.time_spent_minutes ?? 0),
          0
        ) / 60;
        setTotalHours(Math.round(hours));
        setCourseProgress(rows);
      }
    } catch (err) {
      console.error("Error loading progress:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Colour ramp for course icon backgrounds */
  const ICON_COLORS = [
    "#EDE9FE", "#E8F1FF", "#D1FAE5", "#FFF6E0", "#FFEDE2", "#F0FDF4",
  ];

  return (
    <div className="tk-page-in" style={{ paddingBottom: 40 }}>
      {/* Page header */}
      <div style={{ paddingBottom: 24 }}>
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
          Progress
        </h1>
        <p
          style={{
            marginTop: 6,
            fontSize: 15,
            color: "var(--tk-gray-500)",
            fontFamily: "var(--tk-font-sans)",
          }}
        >
          Pantau perjalanan belajarmu dari waktu ke waktu.
        </p>
      </div>

      {/* 4-col stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<Clock size={22} color="#0F7A3E" />}
          iconBg="var(--tk-mint)"
          value={loading ? "…" : `${totalHours}j`}
          label="Jam Belajar Total"
          sub="Sejak bergabung"
        />
        <StatCard
          icon={<Activity size={22} color="var(--tk-blue-600)" />}
          iconBg="var(--tk-blue-50)"
          value="42"
          label="Hari Aktif"
          sub="Konsisten!"
        />
        <StatCard
          icon={<TrendingUp size={22} color="var(--tk-orange)" />}
          iconBg="var(--tk-orange-soft)"
          value="7 hari"
          label="Streak Saat Ini"
          sub="Lanjutkan terus"
        />
        <StatCard
          icon={<Star size={22} color="var(--tk-yellow)" />}
          iconBg="var(--tk-yellow-soft)"
          value="3.450"
          label="XP Total"
          sub="+120 minggu ini"
        />
      </div>

      {/* 2-col: Bar chart + Radar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Bar chart */}
        <div className="tk-card" style={{ padding: "22px 24px" }}>
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--tk-ink)",
              margin: "0 0 20px",
            }}
          >
            Jam Belajar Mingguan
          </h3>
          <div
            style={{
              height: 200,
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            {WEEKLY_DATA.map((item) => {
              const pct = item.h / MAX_H;
              const isHigh = item.h >= 3.5;
              return (
                <div
                  key={item.d}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--tk-blue-700)",
                      marginBottom: 4,
                      fontFamily: "var(--tk-font-sans)",
                    }}
                  >
                    {item.h}j
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: `${pct * 140}px`,
                      borderRadius: "8px 8px 0 0",
                      background: isHigh
                        ? "linear-gradient(180deg,#3B82F6,#1D4ED8)"
                        : "linear-gradient(180deg,#BFDBFE,#93C5FD)",
                      transition: "height .4s",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--tk-gray-500)",
                      marginTop: 6,
                      fontFamily: "var(--tk-font-sans)",
                    }}
                  >
                    {item.d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar chart */}
        <div className="tk-card" style={{ padding: "22px 24px" }}>
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--tk-ink)",
              margin: "0 0 8px",
            }}
          >
            Peta Keterampilan
          </h3>
          <svg
            viewBox="0 0 300 280"
            width="100%"
            style={{ display: "block", maxHeight: 240 }}
          >
            {/* Grid polygons */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <polygon
                key={pct}
                points={buildGridPolygon(pct)}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}

            {/* Spokes */}
            {Array.from({ length: N }, (_, i) => {
              const [x, y] = polarToXY((360 / N) * i, R);
              return (
                <line
                  key={i}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled area */}
            <polygon
              points={buildPolygon(RADAR_VALUES)}
              fill="rgba(29,78,216,0.18)"
              stroke="#1D4ED8"
              strokeWidth="2"
            />

            {/* Dots */}
            {RADAR_VALUES.map((v, i) => {
              const r = (v / 100) * R;
              const [x, y] = polarToXY((360 / N) * i, r);
              return <circle key={i} cx={x} cy={y} r={4} fill="#1D4ED8" />;
            })}

            {/* Labels */}
            {RADAR_SKILLS.map((skill, i) => {
              const [x, y] = polarToXY((360 / N) * i, R + 20);
              const anchor =
                x < CX - 5 ? "end" : x > CX + 5 ? "start" : "middle";
              return (
                <text
                  key={skill}
                  x={x}
                  y={y + 4}
                  textAnchor={anchor}
                  fontSize="11"
                  fontWeight="600"
                  fill="#374151"
                  fontFamily="Inter, sans-serif"
                >
                  {skill}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Course Progress full-width card */}
      <div className="tk-card" style={{ padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
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
            Progress per Kursus
          </h3>
          <button
            onClick={() => navigate("/learning-hub")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              color: "var(--tk-blue-600)",
              fontFamily: "var(--tk-font-sans)", padding: 0,
            }}
          >
            Lihat Semua
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "var(--tk-gray-400)", padding: 32 }}>
            Memuat...
          </div>
        ) : courseProgress.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--tk-gray-400)",
              padding: "32px 0",
              fontSize: 14,
            }}
          >
            Belum ada kursus aktif
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {courseProgress.map((row, idx) => {
              const pct = row.progress_percentage ?? 0;
              const title = row.learning_content?.title ?? "Kursus";
              const cat = row.learning_content?.learning_categories?.name ?? "";
              const emoji = ["💻", "🎨", "📊", "🗣️", "🚀", "📚"][idx % 6];
              const bgColor = ICON_COLORS[idx % ICON_COLORS.length];
              return (
                <div
                  key={row.id}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {emoji}
                  </div>

                  {/* Name + category */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
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
                    {cat && (
                      <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>{cat}</div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      maxWidth: 300,
                      flex: "0 1 300px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 7,
                        borderRadius: 999,
                        background: "var(--tk-gray-100)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 999,
                          background:
                            pct === 100
                              ? "linear-gradient(90deg,#0F7A3E,#16A34A)"
                              : "linear-gradient(90deg,var(--tk-blue-600),#3B82F6)",
                          transition: "width .4s",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          pct === 100
                            ? "var(--tk-green-dark)"
                            : "var(--tk-blue-600)",
                        minWidth: 34,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
