import { BookOpen, Clock, Trophy, Star } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface MiniStatItem {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  sub: string;
}

interface DashboardHeroProps {
  user: User | null;
  profile: any;
  stats?: {
    coursesEnrolled?: number;
    totalLearningTime?: number;
    challenges?: number;
    achievements?: number;
  };
  onNavigate?: (section: string) => void;
}

const TINTS: Record<string, [string, string]> = {
  blue:   ["var(--tk-blue-50)",   "var(--tk-blue-700)"],
  green:  ["var(--tk-mint)",      "var(--tk-green-dark)"],
  purple: ["var(--tk-lilac)",     "#5B21B6"],
  yellow: ["var(--tk-yellow-soft)", "#A47000"],
};

function MiniStatCard({ icon: Icon, color, label, value, sub }: MiniStatItem) {
  const [bg, fg] = TINTS[color] ?? TINTS.blue;
  return (
    <div
      className="rounded-2xl p-3.5 flex items-center justify-between"
      style={{
        background: "var(--tk-gray-50)",
        border: "1px solid var(--tk-gray-200)",
      }}
    >
      <div>
        <div style={{ fontSize: 11.5, color: "var(--tk-gray-500)", fontWeight: 500 }}>{label}</div>
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--tk-ink)",
            lineHeight: 1.15,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)" }}>{sub}</div>
      </div>
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, background: bg, color: fg }}
      >
        <Icon size={18} />
      </div>
    </div>
  );
}

export const DashboardHero = ({ user, profile, stats, onNavigate }: DashboardHeroProps) => {
  const hour = new Date().getHours();
  const greeting =
    hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Talentika";

  const miniStats: MiniStatItem[] = [
    {
      icon: BookOpen,
      color: "blue",
      label: "Kursus Aktif",
      value: String(stats?.coursesEnrolled ?? 0),
      sub: "Lanjutkan belajar!",
    },
    {
      icon: Clock,
      color: "green",
      label: "Jam Belajar",
      value: `${stats?.totalLearningTime ?? 0}`,
      sub: "Jam",
    },
    {
      icon: Trophy,
      color: "purple",
      label: "Tantangan Aktif",
      value: String(stats?.challenges ?? 0),
      sub: "Ikuti tantangan",
    },
    {
      icon: Star,
      color: "yellow",
      label: "Pencapaian",
      value: String(stats?.achievements ?? 0),
      sub: "Badge diraih",
    },
  ];

  return (
    <div className="space-y-4 tk-page-in">
      {/* ── Blue gradient hero banner ─────────────────────────── */}
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
        {/* Text content */}
        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 26,
              color: "white",
              marginBottom: 6,
              letterSpacing: "-.02em",
            }}
          >
            Selamat {greeting}, {firstName}!{" "}
            <span className="tk-wave" style={{ display: "inline-block" }}>
              👋
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,.85)", margin: 0, fontSize: 14.5 }}>
            Mari lanjutkan perjalanan pembelajaran Anda hari ini.
          </p>
          {profile?.subscription_type !== "premium" && (
            <button
              onClick={() => onNavigate?.("subscription")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,.3)",
                fontFamily: "var(--tk-font-display)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.2)"; }}
            >
              ✦ Upgrade ke Pro
            </button>
          )}
        </div>

        {/* Decorative SVG */}
        <svg
          width="220"
          height="140"
          viewBox="0 0 220 140"
          style={{ position: "absolute", right: 0, top: 0, opacity: 0.9 }}
        >
          <path
            d="M0 90 C 60 60, 120 110, 200 80 L 220 90 L 220 140 L 0 140 Z"
            fill="rgba(255,255,255,.12)"
          />
          <circle cx="175" cy="52" r="22" fill="#FFC107" opacity=".7" />
          <text x="140" y="102" fontSize="52">🙋‍♂️</text>
        </svg>

        {/* Sparkles */}
        <span
          className="tk-sparkle"
          style={{ position: "absolute", top: 18, right: 55, fontSize: 15, color: "#FFC107" }}
        >
          ✦
        </span>
        <span
          className="tk-sparkle"
          style={{ position: "absolute", top: 58, right: 130, fontSize: 10, color: "rgba(255,255,255,.6)" }}
        >
          ✦
        </span>
      </div>

      {/* ── Mini stat cards 2×2 ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {miniStats.map((s) => (
          <MiniStatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
};
