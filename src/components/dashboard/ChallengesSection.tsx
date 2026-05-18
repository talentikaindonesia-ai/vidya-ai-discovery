import { useState, useEffect, memo } from "react";
import {
  Trophy, Star, Shield, Users, ArrowRight, Check, Loader2,
  Zap, Target, Clock, Flame, ChevronRight, BookOpen,
  MessageSquare, Code2, BarChart2, Mic, TrendingUp, Brain,
  Swords, Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  difficulty: string | null;
  end_date: string | null;
  start_date: string | null;
  max_participants: number | null;
  xp_reward: number | null;
  is_active: boolean | null;
}

// ── Visual config per type ─────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, {
  gradient: string; lightBg: string; accent: string;
  emoji: string; label: string; icon: React.ElementType;
}> = {
  daily:       { gradient: "linear-gradient(135deg,#F59E0B,#D97706)", lightBg: "#FFFBEB", accent: "#D97706", emoji: "🔥", label: "Harian",       icon: Flame },
  weekly:      { gradient: "linear-gradient(135deg,#7C3AED,#5B21B6)", lightBg: "#F5F3FF", accent: "#7C3AED", emoji: "📅", label: "Mingguan",     icon: Calendar },
  monthly:     { gradient: "linear-gradient(135deg,#2563EB,#1D4ED8)", lightBg: "#EFF6FF", accent: "#2563EB", emoji: "🌟", label: "Bulanan",      icon: Star },
  learning:    { gradient: "linear-gradient(135deg,#0891B2,#0E7490)", lightBg: "#ECFEFF", accent: "#0891B2", emoji: "📚", label: "Belajar",      icon: BookOpen },
  quiz:        { gradient: "linear-gradient(135deg,#F97316,#EA580C)", lightBg: "#FFF7ED", accent: "#F97316", emoji: "🧠", label: "Kuis",         icon: Brain },
  project:     { gradient: "linear-gradient(135deg,#059669,#047857)", lightBg: "#ECFDF5", accent: "#059669", emoji: "💻", label: "Proyek",       icon: Code2 },
  community:   { gradient: "linear-gradient(135deg,#EC4899,#DB2777)", lightBg: "#FDF2F8", accent: "#EC4899", emoji: "🤝", label: "Komunitas",    icon: MessageSquare },
  skill:       { gradient: "linear-gradient(135deg,#8B5CF6,#7C3AED)", lightBg: "#F5F3FF", accent: "#8B5CF6", emoji: "⚡", label: "Skill",        icon: Zap },
  competition: { gradient: "linear-gradient(135deg,#DC2626,#B91C1C)", lightBg: "#FEF2F2", accent: "#DC2626", emoji: "🏆", label: "Kompetisi",    icon: Swords },
};
const DEFAULT_TYPE = { gradient: "linear-gradient(135deg,#64748B,#475569)", lightBg: "#F8FAFC", accent: "#64748B", emoji: "🎯", label: "Tantangan", icon: Target };

const DIFF_CONFIG: Record<string, { label: string; color: string; dots: number }> = {
  easy:   { label: "Mudah",   color: "#16A34A", dots: 1 },
  medium: { label: "Sedang",  color: "#D97706", dots: 2 },
  hard:   { label: "Sulit",   color: "#DC2626", dots: 3 },
};

const ALL_TYPES = ["semua", "daily", "weekly", "monthly", "learning", "quiz", "project", "community", "skill", "competition"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysRemaining(end: string | null) {
  if (!end) return null;
  const d = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (d < 0)  return { label: "Selesai",   urgent: false };
  if (d === 0) return { label: "Hari ini!", urgent: true };
  if (d <= 3)  return { label: `${d} hari lagi`, urgent: true };
  return { label: `${d} hari lagi`, urgent: false };
}

function isUpcoming(start: string | null) {
  if (!start) return false;
  return new Date(start).getTime() > Date.now();
}

function DiffDots({ difficulty }: { difficulty: string | null }) {
  const cfg = DIFF_CONFIG[difficulty ?? ""] ?? { label: "?", color: "#94A3B8", dots: 1 };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: i <= cfg.dots ? cfg.color : "#E2E8F0",
        }} />
      ))}
      <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600, marginLeft: 2 }}>{cfg.label}</span>
    </span>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────────
const ChallengeCard = memo(function ChallengeCard({
  c, isJoined, isJoining, isFeatured, onJoin,
}: {
  c: Challenge; isJoined: boolean; isJoining: boolean; isFeatured?: boolean; onJoin: () => void;
}) {
  const cfg = TYPE_CONFIG[c.challenge_type] ?? DEFAULT_TYPE;
  const remaining = daysRemaining(c.end_date);
  const upcoming  = isUpcoming(c.start_date);
  const Icon = cfg.icon;

  if (isFeatured) {
    return (
      <div style={{
        borderRadius: 20, overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,.12)",
        background: "white",
        border: "1px solid var(--tk-gray-150)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Featured banner */}
        <div style={{
          background: cfg.gradient, padding: "32px 32px 28px", position: "relative", overflow: "hidden",
        }}>
          {/* BG circles */}
          <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.08)", top: -60, right: -40 }} />
          <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.06)", bottom: -30, left: 20 }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{
                  background: "rgba(255,255,255,.22)", backdropFilter: "blur(6px)",
                  borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                  color: "white", display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  ⭐ Pilihan Minggu Ini
                </span>
              </div>
              {remaining && (
                <span style={{
                  background: remaining.urgent ? "rgba(239,68,68,.85)" : "rgba(255,255,255,.2)",
                  backdropFilter: "blur(6px)", borderRadius: 999,
                  padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "white",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  <Clock size={11} /> {remaining.label}
                </span>
              )}
            </div>

            <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>{cfg.emoji}</div>
            <h2 style={{
              fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24,
              color: "white", margin: "0 0 8px", lineHeight: 1.2,
            }}>{c.title}</h2>
            <p style={{ color: "rgba(255,255,255,.85)", fontSize: 14, margin: 0, lineHeight: 1.6, maxWidth: 420 }}>
              {c.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 20 }}>
            {c.xp_reward && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={16} color="#F97316" fill="#F97316" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)" }}>{c.xp_reward.toLocaleString()} XP</div>
                  <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>Reward</div>
                </div>
              </div>
            )}
            {c.max_participants && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={15} color="#0891B2" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)" }}>{c.max_participants.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>Max peserta</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <DiffDots difficulty={c.difficulty} />
            </div>
          </div>

          {isJoined ? (
            <button disabled style={{
              padding: "12px 24px", borderRadius: 12,
              border: "2px solid var(--tk-gray-200)", background: "white",
              color: "var(--tk-gray-500)", fontWeight: 700, fontSize: 14,
              fontFamily: "var(--tk-font-sans)", display: "flex",
              alignItems: "center", gap: 7, cursor: "not-allowed",
            }}>
              <Check size={16} style={{ color: "#16A34A" }} /> Sedang Diikuti
            </button>
          ) : (
            <button
              onClick={onJoin}
              disabled={isJoining || upcoming}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: upcoming ? "var(--tk-gray-200)" : cfg.gradient,
                color: upcoming ? "var(--tk-gray-500)" : "white",
                fontWeight: 700, fontSize: 14, fontFamily: "var(--tk-font-sans)",
                display: "flex", alignItems: "center", gap: 8,
                cursor: isJoining || upcoming ? "not-allowed" : "pointer",
                boxShadow: upcoming ? "none" : "0 4px 14px rgba(0,0,0,.2)",
                transition: "all .15s", opacity: isJoining ? 0.7 : 1,
              }}
            >
              {isJoining ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {upcoming ? "Segera Dibuka" : isJoining ? "Mendaftar..." : "Ikuti Tantangan"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Regular card ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", background: "white",
      border: "1px solid var(--tk-gray-150)",
      boxShadow: "0 2px 8px rgba(0,0,0,.06)",
      display: "flex", flexDirection: "column",
      transition: "transform .15s, box-shadow .15s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,.1)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
      }}
    >
      {/* Gradient header */}
      <div style={{ background: cfg.gradient, padding: "20px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.1)", top: -20, right: -20 }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{
            background: "rgba(255,255,255,.22)", backdropFilter: "blur(4px)",
            borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "white",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <Icon size={10} /> {cfg.label}
          </span>
          {remaining && (
            <span style={{
              background: remaining.urgent ? "rgba(239,68,68,.8)" : "rgba(0,0,0,.18)",
              borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 600,
              color: "white", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <Clock size={10} /> {remaining.label}
            </span>
          )}
          {upcoming && (
            <span style={{
              background: "rgba(0,0,0,.2)", borderRadius: 999, padding: "3px 8px",
              fontSize: 11, fontWeight: 600, color: "white",
            }}>
              🔜 Segera
            </span>
          )}
        </div>

        <div style={{ fontSize: 36, marginTop: 10, marginBottom: 4, lineHeight: 1 }}>{cfg.emoji}</div>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15,
          color: "var(--tk-ink)", margin: "0 0 6px", lineHeight: 1.3,
        }}>{c.title}</h3>

        {c.description && (
          <p style={{
            fontSize: 12.5, color: "var(--tk-gray-600)", lineHeight: 1.55,
            margin: "0 0 14px", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{c.description}</p>
        )}

        {/* Meta chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, marginTop: "auto" }}>
          {c.xp_reward && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "#FFF7ED", borderRadius: 999,
              padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#C2410C",
            }}>
              <Zap size={11} fill="#F97316" color="#F97316" /> {c.xp_reward} XP
            </span>
          )}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: cfg.lightBg, borderRadius: 999,
            padding: "4px 10px", fontSize: 12, fontWeight: 600, color: cfg.accent,
          }}>
            <DiffDots difficulty={c.difficulty} />
          </span>
          {c.max_participants && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "var(--tk-gray-50)", borderRadius: 999,
              padding: "4px 10px", fontSize: 12, color: "var(--tk-gray-500)",
            }}>
              <Users size={11} /> {c.max_participants >= 1000
                ? `${(c.max_participants / 1000).toFixed(0)}K` : c.max_participants}
            </span>
          )}
        </div>

        {/* CTA */}
        {isJoined ? (
          <button disabled style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: "2px solid #D1FAE5", background: "#F0FDF4",
            color: "#16A34A", fontWeight: 700, fontSize: 13,
            fontFamily: "var(--tk-font-sans)", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6, cursor: "default",
          }}>
            <Check size={14} /> Sedang Diikuti
          </button>
        ) : (
          <button
            onClick={onJoin}
            disabled={isJoining || upcoming}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
              background: upcoming
                ? "var(--tk-gray-100)"
                : `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}dd)`,
              color: upcoming ? "var(--tk-gray-400)" : "white",
              fontWeight: 700, fontSize: 13, fontFamily: "var(--tk-font-sans)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: isJoining || upcoming ? "not-allowed" : "pointer",
              boxShadow: upcoming ? "none" : `0 4px 12px ${cfg.accent}44`,
              transition: "all .15s", opacity: isJoining ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!isJoining && !upcoming) (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            {isJoining ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} />}
            {upcoming ? "Segera Dibuka" : isJoining ? "Mendaftar..." : "Ikuti Tantangan"}
          </button>
        )}
      </div>
    </div>
  );
});

// ── Leaderboard mini-widget ────────────────────────────────────────────────────
const MOCK_LEADERS = [
  { rank: 1, name: "Rina S.",     xp: 12400, avatar: "R" },
  { rank: 2, name: "Budi P.",     xp: 10800, avatar: "B" },
  { rank: 3, name: "Citra M.",    xp:  9600, avatar: "C" },
  { rank: 4, name: "Dimas W.",    xp:  8200, avatar: "D" },
  { rank: 5, name: "Ella F.",     xp:  7900, avatar: "E" },
];
const RANK_BADGE = ["🥇", "🥈", "🥉", "4", "5"];

function Leaderboard() {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: 20,
      border: "1px solid var(--tk-gray-150)",
      boxShadow: "0 2px 8px rgba(0,0,0,.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <TrendingUp size={18} color="var(--tk-orange)" />
        <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>
          Papan Peringkat
        </span>
      </div>
      {MOCK_LEADERS.map((l, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "8px 0",
          borderTop: i > 0 ? "1px solid var(--tk-gray-100)" : "none",
        }}>
          <span style={{ fontSize: i < 3 ? 18 : 13, minWidth: 24, textAlign: "center", fontWeight: 700, color: "var(--tk-gray-500)" }}>
            {RANK_BADGE[i]}
          </span>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: `hsl(${i * 60}, 65%, 55%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 13, fontWeight: 700,
          }}>{l.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-ink)" }}>{l.name}</div>
            <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>{l.xp.toLocaleString()} XP</div>
          </div>
          {i === 0 && <span style={{ fontSize: 10, background: "#FEF3C7", color: "#92400E", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>Top 1</span>}
        </div>
      ))}
    </div>
  );
}

// ── XP Progress bar ────────────────────────────────────────────────────────────
function XpCard({ joinedCount, totalXp }: { joinedCount: number; totalXp: number }) {
  const level = Math.floor(totalXp / 1000) + 1;
  const progress = (totalXp % 1000) / 10;
  return (
    <div style={{
      background: "linear-gradient(135deg,#1E3A8A,#2563EB)",
      borderRadius: 16, padding: "20px 22px", color: "white",
      border: "none", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.06)", top: -40, right: -30 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, marginBottom: 2 }}>Level Kamu</div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 28 }}>Level {level}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 12, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Tantangan</div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20 }}>{joinedCount}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
          <span>{totalXp.toLocaleString()} XP</span>
          <span>{((level) * 1000).toLocaleString()} XP →</span>
        </div>
        <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 999, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#FCD34D", borderRadius: 999,
            width: `${progress}%`, transition: "width .4s",
          }} />
        </div>
        <div style={{ fontSize: 11, marginTop: 8, opacity: 0.75 }}>
          {(1000 - (totalXp % 1000)).toLocaleString()} XP lagi ke Level {level + 1}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export const ChallengesSection = () => {
  const [tab, setTab]               = useState<"active" | "explore">("explore");
  const [typeFilter, setTypeFilter] = useState("semua");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedIds, setJoinedIds]   = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [joiningId, setJoiningId]   = useState<string | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [
        { data: challengesData },
        { data: userChallenges },
      ] = await Promise.all([
        supabase.from("community_challenges").select("id,title,description,challenge_type,difficulty,xp_reward,max_participants,start_date,end_date,is_active").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("user_challenges").select("challenge_id").eq("user_id", user.id),
      ]);

      setChallenges(challengesData || []);
      const ids = new Set((userChallenges || []).map((uc) => uc.challenge_id));
      setJoinedIds(ids);

      // Compute XP from joined challenges
      const earned = (challengesData || [])
        .filter(c => ids.has(c.id))
        .reduce((s, c) => s + (c.xp_reward || 0), 0);
      setTotalXp(earned);
    } catch (err) {
      console.error("Error loading challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (challengeId: string) => {
    if (!userId) return;
    setJoiningId(challengeId);
    try {
      const { error } = await supabase
        .from("user_challenges")
        .insert({ user_id: userId, challenge_id: challengeId, status: "active" });
      if (error) throw error;
      setJoinedIds(prev => new Set([...prev, challengeId]));
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge?.xp_reward) setTotalXp(prev => prev + challenge.xp_reward!);
      toast.success("🎉 Berhasil bergabung ke tantangan!");
    } catch (err: any) {
      toast.error("Gagal bergabung: " + err.message);
    } finally {
      setJoiningId(null);
    }
  };

  // Derived lists
  const joinedChallenges  = challenges.filter(c => joinedIds.has(c.id));
  const exploreChallenges = challenges.filter(c => !joinedIds.has(c.id));
  const baseList = tab === "active" ? joinedChallenges : exploreChallenges;
  const filtered = typeFilter === "semua"
    ? baseList
    : baseList.filter(c => c.challenge_type === typeFilter);

  // Featured = highest XP in explore list
  const featuredChallenge = exploreChallenges.length > 0
    ? [...exploreChallenges].sort((a, b) => (b.xp_reward ?? 0) - (a.xp_reward ?? 0))[0]
    : null;

  // Present types in current base list
  const presentTypes = new Set(baseList.map(c => c.challenge_type));
  const filterTypes  = ["semua", ...ALL_TYPES.slice(1).filter(t => presentTypes.has(t))];

  if (loading) {
    return (
      <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={30} className="animate-spin" style={{ color: "var(--tk-blue-600)" }} />
      </div>
    );
  }

  return (
    <div className="tk-page-in" style={{ paddingBottom: 48 }}>

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1E3A8A 0%,#2563EB 55%,#7C3AED 100%)",
        borderRadius: 20, padding: "32px 36px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.05)", top: -80, right: -60 }} />
        <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)", bottom: -40, left: 40 }} />
        <div style={{ position: "absolute", width: 60, height: 60, borderRadius: "50%", background: "rgba(255,215,0,.15)", top: 20, right: 200 }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,.15)", borderRadius: 999, padding: "4px 14px", marginBottom: 14 }}>
              <Flame size={13} color="#FCD34D" fill="#FCD34D" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>Tantangan Aktif Tersedia</span>
            </div>
            <h1 style={{
              fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 28,
              color: "white", margin: "0 0 8px", lineHeight: 1.2,
            }}>Buktikan Kemampuanmu! 🚀</h1>
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
              Ikuti tantangan, kumpulkan XP, dan raih badge eksklusif. Setiap langkah membawamu lebih dekat ke puncak.
            </p>
          </div>

          {/* Stats pills */}
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            {[
              { icon: Trophy,  val: challenges.length,         label: "Tantangan",  bg: "#FEF3C7", fg: "#92400E" },
              { icon: Zap,     val: `${totalXp.toLocaleString()} XP`, label: "XP kamu", bg: "#F0FDF4", fg: "#166534" },
              { icon: Shield,  val: joinedChallenges.length,   label: "Diikuti",    bg: "#EEF2FF", fg: "#3730A3" },
            ].map(({ icon: Icon, val, label, bg, fg }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,.12)", backdropFilter: "blur(6px)",
                borderRadius: 14, padding: "14px 18px", textAlign: "center", minWidth: 88,
              }}>
                <Icon size={18} color="rgba(255,255,255,.85)" style={{ marginBottom: 6 }} />
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "white" }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content grid ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>

        {/* LEFT — feed */}
        <div>
          {/* Tab + Filter row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 6, background: "var(--tk-gray-100)", borderRadius: 12, padding: 4 }}>
              {(["explore", "active"] as const).map(t => {
                const active = tab === t;
                const count  = t === "active" ? joinedChallenges.length : exploreChallenges.length;
                return (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "7px 16px", borderRadius: 9, border: "none",
                    background: active ? "white" : "transparent",
                    color: active ? "var(--tk-ink)" : "var(--tk-gray-500)",
                    fontWeight: active ? 700 : 500, fontSize: 13,
                    fontFamily: "var(--tk-font-sans)",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                    cursor: "pointer", transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {t === "explore" ? "🌐 Jelajahi" : "⚡ Aktif"}
                    <span style={{
                      background: active ? "var(--tk-blue-600)" : "var(--tk-gray-300)",
                      color: "white", borderRadius: 999, fontSize: 10,
                      fontWeight: 700, padding: "1px 6px",
                    }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Type filter chips */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filterTypes.map(t => {
                const cfg    = TYPE_CONFIG[t];
                const active = typeFilter === t;
                return (
                  <button key={t} onClick={() => setTypeFilter(t)} style={{
                    padding: "5px 12px", borderRadius: 999, border: "none",
                    background: active ? (cfg ? cfg.accent : "var(--tk-ink)") : "var(--tk-gray-100)",
                    color: active ? "white" : "var(--tk-gray-600)",
                    fontWeight: active ? 700 : 500, fontSize: 12,
                    fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                    transition: "all .15s",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {cfg ? <span>{cfg.emoji}</span> : "🎯"} {cfg ? cfg.label : "Semua"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured card (explore tab only, no filter) */}
          {tab === "explore" && typeFilter === "semua" && featuredChallenge && (
            <div style={{ marginBottom: 20 }}>
              <ChallengeCard
                c={featuredChallenge}
                isJoined={joinedIds.has(featuredChallenge.id)}
                isJoining={joiningId === featuredChallenge.id}
                isFeatured
                onJoin={() => handleJoin(featuredChallenge.id)}
              />
            </div>
          )}

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {filtered
                .filter(c => !(tab === "explore" && typeFilter === "semua" && c.id === featuredChallenge?.id))
                .map(c => (
                  <ChallengeCard
                    key={c.id}
                    c={c}
                    isJoined={joinedIds.has(c.id)}
                    isJoining={joiningId === c.id}
                    onJoin={() => handleJoin(c.id)}
                  />
                ))}
            </div>
          ) : (
            <div style={{
              background: "white", borderRadius: 16, padding: "48px 32px",
              textAlign: "center", border: "1px solid var(--tk-gray-150)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {tab === "active" ? "⚡" : "🔍"}
              </div>
              <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-ink)", margin: "0 0 8px" }}>
                {tab === "active"
                  ? "Belum ada tantangan aktif"
                  : typeFilter !== "semua"
                    ? `Tidak ada tantangan ${TYPE_CONFIG[typeFilter]?.label ?? ""}`
                    : "Semua tantangan sudah diikuti!"}
              </h3>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 14, margin: "0 0 20px" }}>
                {tab === "active"
                  ? "Yuk jelajahi dan ikuti tantangan yang sesuai minatmu."
                  : "Coba kategori lain atau kembali nanti."}
              </p>
              {tab === "active" && (
                <button
                  onClick={() => { setTab("explore"); setTypeFilter("semua"); }}
                  style={{
                    background: "var(--tk-blue-600)", color: "white", border: "none",
                    borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 700,
                    fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}
                >
                  <ArrowRight size={14} /> Jelajahi Tantangan
                </button>
              )}
              {typeFilter !== "semua" && (
                <button
                  onClick={() => setTypeFilter("semua")}
                  style={{
                    background: "var(--tk-gray-100)", color: "var(--tk-gray-700)", border: "none",
                    borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600,
                    fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                  }}
                >
                  Lihat Semua Kategori
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* XP card */}
          <XpCard joinedCount={joinedChallenges.length} totalXp={totalXp} />

          {/* Leaderboard */}
          <Leaderboard />

          {/* Tips card */}
          <div style={{
            background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
            borderRadius: 16, padding: 18,
            border: "1px solid #A7F3D0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Target size={16} color="#059669" />
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#064E3B" }}>
                Tips Sukses
              </span>
            </div>
            {[
              "Ikuti tantangan daily untuk streak XP harian",
              "Kerjakan proyek untuk XP terbesar",
              "Pantau leaderboard setiap minggu",
            ].map((tip, i) => (
              <div key={i} style={{
                display: "flex", gap: 8, fontSize: 12.5,
                color: "#065F46", marginBottom: i < 2 ? 8 : 0, lineHeight: 1.5,
              }}>
                <span style={{ color: "#10B981", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
