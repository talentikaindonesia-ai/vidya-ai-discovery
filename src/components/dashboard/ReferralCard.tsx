import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Copy, CheckCheck, Users, Share2 } from "lucide-react";

interface ReferralStats {
  referral_code: string | null;
  referred_count: number;
  reward_given: boolean;
}

/**
 * ReferralCard — shown on Dashboard / Profile
 * Displays the user's referral link and referral stats.
 * "Ajak teman, kamu & temanmu dapat 1 bulan gratis!"
 */
export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, refCountRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("referral_code, referral_reward_given")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("user_id", { count: "exact" })
          .eq("referred_by", user.id),
      ]);

      setStats({
        referral_code: profileRes.data?.referral_code ?? null,
        referred_count: refCountRes.count ?? 0,
        reward_given: profileRes.data?.referral_reward_given ?? false,
      });
    })();
  }, []);

  if (!stats) return null;

  const referralUrl = `https://talentika.id/auth?ref=${stats.referral_code ?? ""}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Link referral disalin!", { description: "Bagikan ke temanmu sekarang 🎉" });
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Talentika — Temukan Minat & Bakat Mu",
        text: "Daftar Talentika pakai link aku dan kita berdua dapat hadiah! 🎁",
        url: referralUrl,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EFF6FF, #FFF7ED)",
        border: "1px solid #BFDBFE",
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(37,99,235,0.07)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#DBEAFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Gift size={20} color="#1D4ED8" />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 14,
              color: "var(--tk-ink)",
              marginBottom: 2,
            }}
          >
            Ajak Teman, Dapat Hadiah!
          </div>
          <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>
            Kamu & temanmu dapat <strong style={{ color: "#1D4ED8" }}>1 bulan gratis</strong> saat mereka upgrade Premium
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 14,
          background: "rgba(255,255,255,0.6)",
          borderRadius: 10,
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Users size={14} color="#1D4ED8" />
          <span style={{ fontSize: 12, color: "var(--tk-gray-600)", fontWeight: 600 }}>
            <strong style={{ color: "var(--tk-ink)" }}>{stats.referred_count}</strong> teman diajak
          </span>
        </div>
        {stats.reward_given && (
          <div
            style={{
              background: "#D1FAE5",
              color: "#065F46",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 99,
            }}
          >
            ✓ Reward diterima
          </div>
        )}
        {!stats.reward_given && stats.referred_count > 0 && (
          <div style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>
            {1 - stats.referred_count > 0
              ? `${1 - stats.referred_count} lagi untuk dapat reward!`
              : "Reward pending verifikasi"}
          </div>
        )}
      </div>

      {/* Referral link */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "white",
          border: "1px solid #BFDBFE",
          borderRadius: 10,
          padding: "8px 10px 8px 14px",
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: "#1D4ED8",
            fontFamily: "var(--tk-font-mono, monospace)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          talentika.id/auth?ref={stats.referral_code ?? "..."}
        </span>
        <button
          onClick={copyLink}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: copied ? "#D1FAE5" : "#EFF6FF",
            color: copied ? "#065F46" : "#1D4ED8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
          {copied ? "Disalin!" : "Salin"}
        </button>
        <button
          onClick={shareLink}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "#2563EB",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <Share2 size={13} />
          Bagikan
        </button>
      </div>
    </div>
  );
}
