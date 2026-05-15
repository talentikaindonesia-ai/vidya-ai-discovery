import { useState, useEffect } from "react";
import {
  Trophy, Star, BookOpen, Target, Zap, Users, Shield, Award,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Badge hex component ───────────────────────────────────────────────────────

const TINTS: Record<string, [string, string]> = {
  blue:   ["#DBEAFE", "#1D4ED8"],
  green:  ["#D1FAE5", "#0F7A3E"],
  orange: ["#FFEDE2", "#FF6A00"],
  yellow: ["#FFF6E0", "#A47000"],
  purple: ["#EDE9FE", "#6D28D9"],
};

interface BadgeHexProps {
  icon: React.ElementType;
  color: string;
  size?: number;
  earned?: boolean;
}

const BadgeHex = ({ icon: Icon, color, size = 68, earned = true }: BadgeHexProps) => {
  const [light, dark] = TINTS[color] ?? ["#F3F4F6", "#6B7280"];
  const hexClip = "polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)";
  const iconSize = Math.round(size * 0.38);

  const bgStyle: React.CSSProperties = earned
    ? {
        background: `radial-gradient(circle at 38% 38%, ${light}, ${dark})`,
      }
    : {
        background: "#E5E7EB",
        filter: "grayscale(.8)",
        opacity: 0.55,
      };

  return (
    <div
      style={{
        width: size,
        height: size,
        clipPath: hexClip,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        ...bgStyle,
      }}
    >
      <Icon size={iconSize} color={earned ? "#fff" : "#9CA3AF"} strokeWidth={2} />
    </div>
  );
};

// L-03: LOCKED_BADGES stays as aspirational goals; EARNED_BADGES replaced by real DB data

const LOCKED_BADGES = [
  { icon: Zap,    color: "purple", name: "Speed Learner",       desc: "Selesaikan kursus dalam 48 jam" },
  { icon: Users,  color: "blue",   name: "Community Builder",   desc: "Bergabung dengan 5 komunitas" },
  { icon: Shield, color: "green",  name: "Master Achiever",     desc: "Raih 20 badge sekaligus" },
  { icon: Award,  color: "orange", name: "Top Performer",       desc: "Masuk top 10 leaderboard" },
];

// badge_icon in DB is an emoji string; map type → lucide icon as fallback
const TYPE_ICON: Record<string, React.ElementType> = {
  course:     BookOpen,
  challenge:  Trophy,
  streak:     Star,
  goal:       Target,
  community:  Users,
  assessment: Award,
};

interface DBBadge {
  id: string;
  title: string;
  description: string | null;
  badge_icon: string | null;
  earned_at: string;
  type: string;
}

// ─── Achievements component ────────────────────────────────────────────────────

export const Achievements = () => {
  // L-03: load real achievements from DB instead of showing fake EARNED_BADGES
  const [earnedBadges, setEarnedBadges] = useState<DBBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("achievements")
          .select("id, title, description, badge_icon, earned_at, type")
          .eq("user_id", user.id)
          .order("earned_at", { ascending: false });
        if (!error) setEarnedBadges(data ?? []);
      } catch (err) {
        console.error("Error loading achievements:", err);
      } finally {
        setLoadingBadges(false);
      }
    };
    load();
  }, []);

  const earned = earnedBadges.length;
  const total  = earned + LOCKED_BADGES.length;

  // ── Shared card style ──
  const cardBase: React.CSSProperties = {
    background: "#fff",
    border: "1.5px solid var(--tk-gray-200, #E5E7EB)",
    borderRadius: 16,
    padding: 20,
    textAlign: "center",
    transition: "box-shadow .18s",
    cursor: "default",
  };

  return (
    <div>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingBottom: 24,
          flexWrap: "wrap",
          gap: 8,
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
            Pencapaian
          </h1>
          <p
            style={{
              marginTop: 6,
              color: "var(--tk-gray-500, #6B7280)",
              fontSize: 14,
              fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
            }}
          >
            Kumpulkan badge dengan menyelesaikan kursus, tantangan, dan misi.
          </p>
        </div>
      </div>

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg,#FFF8E1,#FFEDE2)",
          borderRadius: "var(--tk-radius-lg, 20px)",
          padding: 28,
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative blobs */}
        <div
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,193,7,.12)",
            right: -30,
            top: -40,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,106,0,.08)",
            right: 80,
            bottom: -20,
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
          {/* hex badge + sparkle */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <BadgeHex icon={Trophy} color="yellow" size={86} earned />
            <span
              className="tk-sparkle"
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                fontSize: 18,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              ✦
            </span>
          </div>

          {/* text */}
          <div>
            <p
              style={{
                fontFamily: "var(--tk-font-mono, 'JetBrains Mono', monospace)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--tk-orange, #FF6A00)",
                textTransform: "uppercase",
                letterSpacing: ".15em",
                margin: 0,
              }}
            >
              Koleksimu Sejauh Ini
            </p>
            <h2
              style={{
                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                fontWeight: 700,
                fontSize: 30,
                color: "var(--tk-ink, #0B1D3A)",
                margin: "4px 0 6px",
                lineHeight: 1.15,
              }}
            >
              {earned} dari {total} badge
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--tk-gray-600, #4B5563)",
                margin: 0,
                fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
              }}
            >
              Terus belajar dan selesaikan tantangan untuk membuka lebih banyak badge!
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: Sudah Diraih ─────────────────────────────────────── */}
      <h3
        style={{
          fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--tk-ink, #0B1D3A)",
          marginBottom: 12,
          marginTop: 24,
        }}
      >
        Sudah Diraih
      </h3>

      {/* L-03: Real earned badges from DB */}
      {loadingBadges ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--tk-gray-400)" }}>Memuat...</div>
      ) : earnedBadges.length === 0 ? (
        <div className="tk-card" style={{ ...cardBase, padding: 32, gridColumn: "1/-1" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
          <p style={{ fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-gray-400)", margin: 0 }}>
            Belum ada badge diraih. Selesaikan kursus dan tantangan untuk mendapatkan badge pertamamu!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {earnedBadges.map((b) => {
            const IconComp = TYPE_ICON[b.type] ?? Award;
            const earnedDate = new Date(b.earned_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
            return (
              <div
                key={b.id}
                className="tk-card"
                style={cardBase}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  {b.badge_icon ? (
                    <div style={{ width: 68, height: 68, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, background: "#FFF8E1", borderRadius: "50%" }}>
                      {b.badge_icon}
                    </div>
                  ) : (
                    <BadgeHex icon={IconComp} color="yellow" size={68} earned />
                  )}
                </div>
                <h4 style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 600, fontSize: 14, color: "var(--tk-ink, #0B1D3A)", margin: "0 0 4px" }}>
                  {b.title}
                </h4>
                {b.description && (
                  <p style={{ fontSize: 11.5, color: "var(--tk-gray-500)", lineHeight: 1.4, margin: "0 0 10px", fontFamily: "var(--tk-font-sans)" }}>
                    {b.description}
                  </p>
                )}
                <span style={{ display: "inline-block", background: "var(--tk-mint, #D1FAE5)", color: "var(--tk-green-dark, #0F7A3E)", borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", fontFamily: "var(--tk-font-sans)" }}>
                  ✓ {earnedDate}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section: Belum Terbuka ────────────────────────────────────── */}
      <h3
        style={{
          fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
          fontWeight: 700,
          fontSize: 17,
          color: "var(--tk-ink, #0B1D3A)",
          marginBottom: 12,
          marginTop: 8,
        }}
      >
        Belum Terbuka
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {LOCKED_BADGES.map((b, i) => (
          <div
            key={i}
            className="tk-card"
            style={{ ...cardBase, opacity: 0.82 }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <BadgeHex icon={b.icon} color={b.color} size={68} earned={false} />
            </div>
            <h4
              style={{
                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--tk-gray-500, #6B7280)",
                margin: "0 0 4px",
              }}
            >
              {b.name}
            </h4>
            <p
              style={{
                fontSize: 11.5,
                color: "var(--tk-gray-400, #9CA3AF)",
                lineHeight: 1.4,
                margin: "0 0 10px",
                fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
              }}
            >
              {b.desc}
            </p>
            <span
              style={{
                display: "inline-block",
                background: "var(--tk-gray-100, #F3F4F6)",
                color: "var(--tk-gray-500, #6B7280)",
                borderRadius: 99,
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 10px",
                fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
              }}
            >
              🔒 Terkunci
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
