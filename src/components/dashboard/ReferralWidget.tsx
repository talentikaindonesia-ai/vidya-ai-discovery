/**
 * ReferralWidget — compact referral card for the main Dashboard
 *
 * Shows user's referral code, copy-to-clipboard, WhatsApp share,
 * and total referral count + XP earned from referrals.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Gift, Users } from "lucide-react";
import { toast } from "sonner";

const WA_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

interface Props {
  userId: string;
}

export const ReferralWidget = ({ userId }: Props) => {
  const [code, setCode]               = useState<string | null>(null);
  const [totalReferrals, setTotal]    = useState(0);
  const [copied, setCopied]           = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadReferral();
  }, [userId]);

  const generateCode = (uid: string) =>
    `TLK-${uid.replace(/-/g, "").toUpperCase().slice(0, 6)}`;

  const loadReferral = async () => {
    try {
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("code, total_referrals")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) {
        setCode(existing.code);
        setTotal(existing.total_referrals ?? 0);
        return;
      }

      // Auto-create code
      const newCode = generateCode(userId);
      const { data: created } = await supabase
        .from("referral_codes")
        .insert({ user_id: userId, code: newCode, commission_rate: 10, is_active: true })
        .select("code, total_referrals")
        .single();

      if (created) { setCode(created.code); setTotal(0); }
    } catch (e) {
      console.error("ReferralWidget:", e);
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = code ? `${window.location.origin}/auth?ref=${code}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link referral disalin!");
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hei! Aku lagi pakai Talentika buat explore minat & bakat, keren banget platformnya 🚀\n\nCoba daftar gratis via link ku ya, kita bisa sama-sama dapat bonus XP! 🎁\n\n👉 ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) return (
    <div style={{ height: 120, borderRadius: 16, background: "var(--tk-gray-100)", animation: "pulse 1.5s infinite" }} />
  );

  if (!code) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #7C3AED 100%)",
      borderRadius: 20,
      padding: "20px 24px",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gift size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14 }}>Undang Teman</div>
            <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 11.5, color: "rgba(255,255,255,.7)" }}>Kamu &amp; temanmu dapat bonus XP!</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "6px 12px" }}>
          <Users size={13} color="rgba(255,255,255,.8)" />
          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14 }}>{totalReferrals}</span>
          <span style={{ fontFamily: "var(--tk-font-sans)", fontSize: 11, color: "rgba(255,255,255,.7)" }}>teman</span>
        </div>
      </div>

      {/* Code display */}
      <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 10.5, color: "rgba(255,255,255,.6)", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>Kode Referralmu</div>
          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 17, letterSpacing: ".12em", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{code}</div>
        </div>
        <button
          onClick={handleCopy}
          style={{ flexShrink: 0, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontFamily: "var(--tk-font-sans)", fontWeight: 600, fontSize: 12, transition: "background .15s" }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Disalin!" : "Salin"}
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleWhatsApp}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#25D366", border: "none", borderRadius: 10, padding: "10px 0", fontFamily: "var(--tk-font-sans)", fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer" }}
        >
          {WA_ICON} Bagikan via WhatsApp
        </button>
        <button
          onClick={handleCopy}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.15)", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", color: "#fff" }}
          title="Salin link"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
};
