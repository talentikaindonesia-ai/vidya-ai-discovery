/**
 * ChallengesPreview — compact challenges widget embedded in the dashboard overview.
 * Shows up to 3 active/upcoming challenges as horizontal cards.
 * Challenges are temporary by nature — no dedicated tab, just this inline section.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Flame, Calendar, Star, BookOpen, Brain, Code2, MessageSquare,
  Zap, Target, Swords, Clock, ArrowRight, Trophy,
} from "lucide-react";

// ── Visual config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { gradient: string; lightBg: string; accent: string; emoji: string; label: string; icon: React.ElementType }> = {
  daily:       { gradient: "linear-gradient(135deg,#F59E0B,#D97706)", lightBg: "#FFFBEB", accent: "#D97706", emoji: "🔥", label: "Harian",    icon: Flame },
  weekly:      { gradient: "linear-gradient(135deg,#7C3AED,#5B21B6)", lightBg: "#F5F3FF", accent: "#7C3AED", emoji: "📅", label: "Mingguan",  icon: Calendar },
  monthly:     { gradient: "linear-gradient(135deg,#2563EB,#1D4ED8)", lightBg: "#EFF6FF", accent: "#2563EB", emoji: "🌟", label: "Bulanan",   icon: Star },
  learning:    { gradient: "linear-gradient(135deg,#0891B2,#0E7490)", lightBg: "#ECFEFF", accent: "#0891B2", emoji: "📚", label: "Belajar",   icon: BookOpen },
  quiz:        { gradient: "linear-gradient(135deg,#F97316,#EA580C)", lightBg: "#FFF7ED", accent: "#F97316", emoji: "🧠", label: "Kuis",      icon: Brain },
  project:     { gradient: "linear-gradient(135deg,#059669,#047857)", lightBg: "#ECFDF5", accent: "#059669", emoji: "💻", label: "Proyek",    icon: Code2 },
  community:   { gradient: "linear-gradient(135deg,#EC4899,#DB2777)", lightBg: "#FDF2F8", accent: "#EC4899", emoji: "🤝", label: "Komunitas", icon: MessageSquare },
  skill:       { gradient: "linear-gradient(135deg,#8B5CF6,#7C3AED)", lightBg: "#F5F3FF", accent: "#8B5CF6", emoji: "⚡", label: "Skill",     icon: Zap },
  competition: { gradient: "linear-gradient(135deg,#DC2626,#B91C1C)", lightBg: "#FEF2F2", accent: "#DC2626", emoji: "🏆", label: "Kompetisi", icon: Swords },
};
const DEFAULT_CFG = { gradient: "linear-gradient(135deg,#64748B,#475569)", lightBg: "#F8FAFC", accent: "#64748B", emoji: "🎯", label: "Tantangan", icon: Target };

function daysLeft(end: string | null): { label: string; urgent: boolean } | null {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
  if (d < 0)   return { label: "Selesai",       urgent: false };
  if (d === 0) return { label: "Hari ini!",     urgent: true  };
  if (d <= 3)  return { label: `${d} hari lagi`, urgent: true  };
  return       { label: `${d} hari lagi`,        urgent: false };
}

// ── Component ──────────────────────────────────────────────────────────────────
export const ChallengesPreview = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("challenges")
        .select("id, title, description, challenge_type, difficulty, end_date, xp_reward, is_active")
        .eq("is_active", true)
        .order("end_date", { ascending: true, nullsFirst: false })
        .limit(3);
      setChallenges(data ?? []);
      setLoading(false);
    })();
  }, []);

  // Don't render anything if no challenges exist
  if (!loading && challenges.length === 0) return null;

  return (
    <div className="tk-card" style={{ padding: "22px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={18} style={{ color: "#D97706" }} />
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>
            Tantangan Aktif
          </h3>
          <span style={{
            padding: "2px 8px", borderRadius: 99,
            background: "#FFFBEB", color: "#D97706",
            fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 11,
          }}>
            {loading ? "…" : challenges.length}
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard-gamified")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13,
            color: "var(--tk-blue-600)", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          Mode Gamified <ArrowRight size={13} />
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="animate-pulse" style={{ height: 110, borderRadius: 14, background: "var(--tk-gray-150)" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${challenges.length}, 1fr)`, gap: 12 }}>
          {challenges.map((c) => {
            const cfg = TYPE_CONFIG[c.challenge_type] ?? DEFAULT_CFG;
            const rem = daysLeft(c.end_date);
            return (
              <div
                key={c.id}
                onClick={() => navigate("/dashboard-gamified")}
                style={{
                  borderRadius: 14,
                  background: cfg.lightBg,
                  border: `1.5px solid ${cfg.accent}22`,
                  padding: "16px 16px 14px",
                  cursor: "pointer",
                  transition: "box-shadow .2s, transform .2s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${cfg.accent}33`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                {/* Decorative circle */}
                <div style={{
                  position: "absolute", right: -16, top: -16,
                  width: 64, height: 64, borderRadius: "50%",
                  background: `${cfg.accent}18`,
                }} />

                {/* Type pill */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 99,
                    background: `${cfg.accent}20`, color: cfg.accent,
                    fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 11,
                  }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  {rem && (
                    <span style={{
                      padding: "2px 7px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                      background: rem.urgent ? "#FEF2F2" : "rgba(0,0,0,.05)",
                      color: rem.urgent ? "#DC2626" : "var(--tk-gray-500)",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <Clock size={10} /> {rem.label}
                    </span>
                  )}
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: "var(--tk-font-display)", fontWeight: 700,
                  fontSize: 13.5, color: "var(--tk-ink)", lineHeight: 1.3,
                  marginBottom: 8,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as React.CSSProperties}>
                  {c.title}
                </div>

                {/* XP reward */}
                {c.xp_reward && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Zap size={13} color={cfg.accent} fill={cfg.accent} />
                    <span style={{
                      fontFamily: "var(--tk-font-display)", fontWeight: 700,
                      fontSize: 13, color: cfg.accent,
                    }}>
                      {c.xp_reward.toLocaleString()} XP
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
