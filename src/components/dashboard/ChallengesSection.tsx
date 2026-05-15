import { useState } from "react";
import { Trophy, Star, Shield, Users, ArrowRight, Check } from "lucide-react";

interface Challenge {
  id: string;
  name: string;
  desc: string;
  days: number;
  grad: string;
  progress: number;
  joined: number;
  reward: string;
  active: boolean;
}

const CHALLENGES: Challenge[] = [
  {
    id: "1",
    name: "30 Hari Belajar Coding",
    desc: "Belajar coding minimal 1 jam sehari selama 30 hari berturut-turut.",
    days: 30,
    grad: "linear-gradient(135deg,#2563EB,#1D4ED8)",
    progress: 73,
    joined: 1247,
    reward: "500 XP + Badge",
    active: true,
  },
  {
    id: "2",
    name: "Design Sprint Week",
    desc: "Selesaikan 1 challenge desain UI/UX setiap hari selama seminggu.",
    days: 7,
    grad: "linear-gradient(135deg,#F97316,#EA580C)",
    progress: 40,
    joined: 892,
    reward: "300 XP + Sertifikat",
    active: true,
  },
  {
    id: "3",
    name: "Data Science Bootcamp",
    desc: "Ikuti bootcamp intensif analisis data dan machine learning selama 2 minggu.",
    days: 14,
    grad: "linear-gradient(135deg,#7C3AED,#6D28D9)",
    progress: 0,
    joined: 445,
    reward: "800 XP + Badge",
    active: false,
  },
  {
    id: "4",
    name: "English Speaking Challenge",
    desc: "Latih kemampuan berbicara Bahasa Inggris dengan native speakers setiap hari.",
    days: 21,
    grad: "linear-gradient(135deg,#16A34A,#15803D)",
    progress: 0,
    joined: 2031,
    reward: "400 XP + Sertifikat",
    active: false,
  },
];

export const ChallengesSection = () => {
  const [tab, setTab] = useState<"active" | "explore">("active");
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": false,
    "4": false,
  });

  const joinedChallenges = CHALLENGES.filter((c) => joinedMap[c.id]);
  const exploreChallenges = CHALLENGES.filter((c) => !joinedMap[c.id]);
  const visibleChallenges = tab === "active" ? joinedChallenges : exploreChallenges;

  const handleJoin = (id: string) => {
    setJoinedMap((prev) => ({ ...prev, [id]: true }));
  };

  const formatJoined = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="tk-page-in" style={{ padding: "0 0 40px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingBottom: 24,
        }}
      >
        <div>
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
            Tantangan
          </h1>
          <p
            style={{
              marginTop: 6,
              color: "var(--tk-gray-500)",
              fontSize: 15,
              fontFamily: "var(--tk-font-sans)",
            }}
          >
            Ikuti tantangan harian dan mingguan untuk tingkatkan skill dan raih badge.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Trophy / Active */}
        <div
          className="tk-card"
          style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--tk-orange-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trophy size={22} color="var(--tk-orange)" />
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--tk-ink)",
                fontFamily: "var(--tk-font-display)",
                lineHeight: 1,
              }}
            >
              {joinedChallenges.length}
            </div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}
            >
              Tantangan Aktif
            </div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Sedang berjalan</div>
          </div>
        </div>

        {/* Star / Streak */}
        <div
          className="tk-card"
          style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--tk-yellow-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Star size={22} color="var(--tk-yellow)" />
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--tk-ink)",
                fontFamily: "var(--tk-font-display)",
                lineHeight: 1,
              }}
            >
              7 hari
            </div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}
            >
              Streak Terbaik
            </div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Pertahankan!</div>
          </div>
        </div>

        {/* Shield / Badge */}
        <div
          className="tk-card"
          style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "var(--tk-lilac)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={22} color="#7C3AED" />
          </div>
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--tk-ink)",
                fontFamily: "var(--tk-font-display)",
                lineHeight: 1,
              }}
            >
              4
            </div>
            <div
              style={{ fontSize: 13, fontWeight: 600, color: "var(--tk-ink)", marginTop: 2 }}
            >
              Badge dari Tantangan
            </div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Total badge</div>
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
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                borderRadius: 999,
                border: isActive
                  ? "2px solid var(--tk-blue-600)"
                  : "2px solid var(--tk-gray-200)",
                background: isActive ? "var(--tk-blue-50)" : "white",
                color: isActive ? "var(--tk-blue-600)" : "var(--tk-gray-600)",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "var(--tk-font-sans)",
                cursor: "pointer",
                transition: "all .18s",
              }}
            >
              {label}
              <span
                style={{
                  background: isActive ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
                  color: isActive ? "white" : "var(--tk-gray-600)",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Challenge Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
        }}
      >
        {visibleChallenges.map((c) => {
          const isJoined = joinedMap[c.id];
          return (
            <div
              key={c.id}
              className="tk-card"
              style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {/* Gradient Header */}
              <div
                style={{
                  background: c.grad,
                  height: 96,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Sparkle top-left area */}
                <span
                  className="tk-sparkle"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 14,
                    fontSize: 14,
                    opacity: 0.7,
                  }}
                >
                  ✦
                </span>
                <span
                  className="tk-sparkle"
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 36,
                    fontSize: 10,
                    opacity: 0.5,
                  }}
                >
                  ✦
                </span>
                {/* Days pill */}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 14,
                    background: "rgba(255,255,255,0.22)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "white",
                    padding: "3px 10px",
                    fontFamily: "var(--tk-font-sans)",
                  }}
                >
                  {c.days} hari
                </div>
                <Trophy size={36} color="white" style={{ opacity: 0.9 }} />
              </div>

              {/* Card Body */}
              <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column" }}>
                <h3
                  style={{
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--tk-ink)",
                    margin: "0 0 6px",
                  }}
                >
                  {c.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--tk-gray-600)",
                    lineHeight: 1.5,
                    margin: "0 0 14px",
                  }}
                >
                  {c.desc}
                </p>

                {/* Progress bar — only if joined */}
                {isJoined && (
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--tk-gray-600)",
                        marginBottom: 6,
                      }}
                    >
                      <span>Progress harimu</span>
                      <span style={{ color: "var(--tk-blue-600)" }}>{c.progress}%</span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 999,
                        background: "var(--tk-gray-100)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${c.progress}%`,
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg, var(--tk-blue-600), #3B82F6)",
                          transition: "width .4s",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                    marginBottom: 16,
                    marginTop: "auto",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: "var(--tk-gray-500)",
                    }}
                  >
                    <Users size={14} />
                    {formatJoined(c.joined)} peserta
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: "var(--tk-orange)",
                      fontWeight: 600,
                    }}
                  >
                    <Star size={13} fill="var(--tk-orange)" />
                    {c.reward}
                  </span>
                </div>

                {/* CTA Button */}
                {isJoined ? (
                  <button
                    disabled
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 10,
                      border: "2px solid var(--tk-gray-200)",
                      background: "white",
                      color: "var(--tk-gray-500)",
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: "var(--tk-font-sans)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      cursor: "not-allowed",
                    }}
                  >
                    <Check size={15} />
                    Sedang Diikuti
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoin(c.id)}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      borderRadius: 10,
                      border: "none",
                      background:
                        "linear-gradient(135deg, var(--tk-blue-600), var(--tk-blue-700))",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      fontFamily: "var(--tk-font-sans)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(29,78,216,.25)",
                      transition: "opacity .15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
                    }
                  >
                    Ikuti Tantangan
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleChallenges.length === 0 && (
        <div
          className="tk-card"
          style={{ padding: 48, textAlign: "center", color: "var(--tk-gray-400)" }}
        >
          <Trophy size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontWeight: 600, fontSize: 15 }}>
            {tab === "active"
              ? "Belum ada tantangan yang diikuti."
              : "Semua tantangan sudah diikuti!"}
          </p>
        </div>
      )}
    </div>
  );
};
