import { useState, useEffect } from "react";
import { Trophy, Star, Shield, Users, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// M-04: replaced all hardcoded CHALLENGES with real community_challenges + user_challenges queries

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  difficulty: string | null;
  end_date: string | null;
  max_participants: number | null;
  xp_reward: number | null;
  is_active: boolean | null;
}

// Map challenge_type to visual gradient
const TYPE_GRAD: Record<string, string> = {
  learning:    "linear-gradient(135deg,#2563EB,#1D4ED8)",
  quiz:        "linear-gradient(135deg,#F97316,#EA580C)",
  project:     "linear-gradient(135deg,#7C3AED,#6D28D9)",
  community:   "linear-gradient(135deg,#16A34A,#15803D)",
  skill:       "linear-gradient(135deg,#0891B2,#0E7490)",
  competition: "linear-gradient(135deg,#DC2626,#B91C1C)",
  daily:       "linear-gradient(135deg,#D97706,#B45309)",
  weekly:      "linear-gradient(135deg,#7C3AED,#5B21B6)",
  monthly:     "linear-gradient(135deg,#1D4ED8,#1E40AF)",
};
const DEFAULT_GRAD = "linear-gradient(135deg,#64748B,#475569)";

const DIFF_LABEL: Record<string, string> = {
  easy: "Mudah", medium: "Sedang", hard: "Sulit",
};

export const ChallengesSection = () => {
  const [tab, setTab] = useState<"active" | "explore">("active");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [
        { data: challengesData },
        { data: userChallenges },
        { data: achievementsData },
      ] = await Promise.all([
        supabase
          .from("community_challenges")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_challenges")
          .select("challenge_id")
          .eq("user_id", user.id),
        supabase
          .from("achievements")
          .select("id")
          .eq("user_id", user.id),
      ]);

      setChallenges(challengesData || []);
      setJoinedIds(new Set((userChallenges || []).map((uc) => uc.challenge_id)));
      setBadgeCount(achievementsData?.length ?? 0);
    } catch (err: any) {
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
      setJoinedIds((prev) => new Set([...prev, challengeId]));
      toast.success("Berhasil bergabung ke tantangan!");
    } catch (err: any) {
      toast.error("Gagal bergabung: " + err.message);
    } finally {
      setJoiningId(null);
    }
  };

  const daysRemaining = (end_date: string | null) => {
    if (!end_date) return null;
    const days = Math.ceil((new Date(end_date).getTime() - Date.now()) / 86400000);
    return days > 0 ? `${days} hari` : "Selesai";
  };

  const joinedChallenges  = challenges.filter((c) => joinedIds.has(c.id));
  const exploreChallenges = challenges.filter((c) => !joinedIds.has(c.id));
  const visibleChallenges = tab === "active" ? joinedChallenges : exploreChallenges;

  if (loading) {
    return (
      <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--tk-blue-600)" }} />
      </div>
    );
  }

  return (
    <div className="tk-page-in" style={{ padding: "0 0 40px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 30, color: "var(--tk-ink)", margin: 0, lineHeight: 1.2 }}>
            Tantangan
          </h1>
          <p style={{ marginTop: 6, color: "var(--tk-gray-500)", fontSize: 15, fontFamily: "var(--tk-font-sans)" }}>
            Ikuti tantangan dan raih badge untuk tingkatkan skill-mu.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {/* Active */}
        <div className="tk-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--tk-orange-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Trophy size={22} color="var(--tk-orange)" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)", lineHeight: 1 }}>{joinedChallenges.length}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}>Tantangan Aktif</div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Sedang berjalan</div>
          </div>
        </div>

        {/* Available */}
        <div className="tk-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--tk-yellow-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Star size={22} color="var(--tk-yellow)" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)", lineHeight: 1 }}>{exploreChallenges.length}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}>Tersedia</div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Belum diikuti</div>
          </div>
        </div>

        {/* Badges */}
        <div className="tk-card" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--tk-lilac)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={22} color="#7C3AED" />
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)", lineHeight: 1 }}>{badgeCount}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}>Badge</div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Total diraih</div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {(["active", "explore"] as const).map((t) => {
          const label = t === "active" ? "Aktif" : "Jelajahi";
          const count = t === "active" ? joinedChallenges.length : exploreChallenges.length;
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 18px", borderRadius: 999,
                border: isActive ? "2px solid var(--tk-blue-600)" : "2px solid var(--tk-gray-200)",
                background: isActive ? "var(--tk-blue-50)" : "white",
                color: isActive ? "var(--tk-blue-600)" : "var(--tk-gray-600)",
                fontWeight: 600, fontSize: 14, fontFamily: "var(--tk-font-sans)",
                cursor: "pointer", transition: "all .18s",
              }}
            >
              {label}
              <span style={{
                background: isActive ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
                color: isActive ? "white" : "var(--tk-gray-600)",
                borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 7px",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Challenge Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {visibleChallenges.map((c) => {
          const isJoined   = joinedIds.has(c.id);
          const isJoining  = joiningId === c.id;
          const grad       = TYPE_GRAD[c.challenge_type] ?? DEFAULT_GRAD;
          const remaining  = daysRemaining(c.end_date);

          return (
            <div key={c.id} className="tk-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Gradient Header */}
              <div style={{ background: grad, height: 96, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="tk-sparkle" style={{ position: "absolute", top: 10, right: 14, fontSize: 14, opacity: 0.7, color: "white" }}>✦</span>
                <span className="tk-sparkle" style={{ position: "absolute", bottom: 12, right: 36, fontSize: 10, opacity: 0.5, color: "white" }}>✦</span>
                {remaining && (
                  <div style={{
                    position: "absolute", top: 10, left: 14,
                    background: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)",
                    borderRadius: 999, fontSize: 11, fontWeight: 700, color: "white",
                    padding: "3px 10px", fontFamily: "var(--tk-font-sans)",
                  }}>
                    {remaining}
                  </div>
                )}
                <Trophy size={36} color="white" style={{ opacity: 0.9 }} />
              </div>

              {/* Card Body */}
              <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: "0 0 6px" }}>
                  {c.title}
                </h3>
                {c.description && (
                  <p style={{ fontSize: 13, color: "var(--tk-gray-600)", lineHeight: 1.5, margin: "0 0 14px" }}>
                    {c.description}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 16, marginTop: "auto" }}>
                  {c.difficulty && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--tk-gray-500)" }}>
                      <Users size={14} />
                      {DIFF_LABEL[c.difficulty] ?? c.difficulty}
                    </span>
                  )}
                  {c.xp_reward && (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--tk-orange)", fontWeight: 600 }}>
                      <Star size={13} fill="var(--tk-orange)" />
                      {c.xp_reward} XP
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                {isJoined ? (
                  <button disabled style={{
                    width: "100%", padding: "11px 0", borderRadius: 10,
                    border: "2px solid var(--tk-gray-200)", background: "white",
                    color: "var(--tk-gray-500)", fontWeight: 600, fontSize: 14,
                    fontFamily: "var(--tk-font-sans)", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 7, cursor: "not-allowed",
                  }}>
                    <Check size={15} />
                    Sedang Diikuti
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(c.id)}
                    disabled={isJoining}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
                      background: "linear-gradient(135deg, var(--tk-blue-600), var(--tk-blue-700))",
                      color: "white", fontWeight: 600, fontSize: 14,
                      fontFamily: "var(--tk-font-sans)", display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 7,
                      cursor: isJoining ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 12px rgba(29,78,216,.25)", transition: "opacity .15s",
                      opacity: isJoining ? 0.7 : 1,
                    }}
                  >
                    {isJoining ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                    {isJoining ? "Bergabung..." : "Ikuti Tantangan"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {visibleChallenges.length === 0 && (
        <div className="tk-card" style={{ padding: 48, textAlign: "center", color: "var(--tk-gray-400)" }}>
          <Trophy size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontWeight: 600, fontSize: 15 }}>
            {tab === "active"
              ? "Belum ada tantangan yang diikuti. Jelajahi tantangan yang tersedia!"
              : challenges.length === 0
                ? "Belum ada tantangan tersedia. Pantau terus!"
                : "Semua tantangan sudah diikuti!"}
          </p>
          {tab === "active" && challenges.length > 0 && (
            <button
              onClick={() => setTab("explore")}
              style={{
                marginTop: 14, background: "var(--tk-blue-600)", color: "white",
                border: "none", borderRadius: 10, padding: "10px 20px",
                fontSize: 14, fontWeight: 600, fontFamily: "var(--tk-font-sans)", cursor: "pointer",
              }}
            >
              Jelajahi Tantangan
            </button>
          )}
        </div>
      )}
    </div>
  );
};
