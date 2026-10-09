import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row { name: string; xp: number; level: number; rank: number; is_me: boolean }
interface Me { rank: number; xp: number; total: number }

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Mini XP leaderboard on the student overview — real user_xp data via the
 * xp_leaderboard RPC (top 5 + caller's own rank). Hidden while empty so a
 * brand-new platform doesn't show a hollow widget.
 */
export const XpLeaderboard = () => {
  const [top, setTop] = useState<Row[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (supabase.rpc as any)("xp_leaderboard", { p_limit: 5 }).then(({ data }: any) => {
      if (data) {
        setTop(Array.isArray(data.top) ? data.top : []);
        setMe(data.me ?? null);
      }
      setLoaded(true);
    });
  }, []);

  if (!loaded || top.length === 0) return null;

  return (
    <div className="tk-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} style={{ color: "#F59E0B" }} />
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0 }}>
            Papan Peringkat XP
          </h3>
        </div>
        {me && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-blue-600)", background: "var(--tk-blue-50)", padding: "4px 11px", borderRadius: 99 }}>
            Posisimu #{me.rank} dari {me.total}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {top.map(r => (
          <div key={r.rank}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 12,
              background: r.is_me ? "var(--tk-blue-50)" : "var(--tk-gray-50)",
              border: `1px solid ${r.is_me ? "var(--tk-blue-200, #BFDBFE)" : "var(--tk-gray-200)"}`,
            }}>
            <span style={{ width: 26, textAlign: "center", fontSize: r.rank <= 3 ? 16 : 13, fontFamily: "var(--tk-font-display)", fontWeight: 800, color: "var(--tk-gray-500)" }}>
              {r.rank <= 3 ? MEDALS[r.rank - 1] : r.rank}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13.5, color: "var(--tk-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}{r.is_me && " (kamu)"}
            </span>
            <span style={{ fontSize: 13, fontFamily: "var(--tk-font-display)", fontWeight: 700, color: "var(--tk-blue-600)" }}>
              {r.xp.toLocaleString("id-ID")} XP
            </span>
          </div>
        ))}
      </div>

      {!me && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--tk-gray-500)", textAlign: "center" }}>
          Selesaikan kursus & kuis untuk mengumpulkan XP dan masuk peringkat! 🚀
        </div>
      )}
    </div>
  );
};
