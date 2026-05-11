/**
 * WelcomeNudge — shows smart "next step" banners for new users.
 *
 * Logic (checked in order):
 *   1. No full_name in profile → nudge to complete onboarding
 *   2. No RIASEC assessment result → nudge to take the test
 *   3. Profile + assessment done → nudge to explore opportunities (shown once)
 *
 * Each nudge can be dismissed (saved to localStorage) so it doesn't annoy
 * returning users who already acted on a previous nudge.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Brain, User, Briefcase } from "lucide-react";

interface Nudge {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaPath: string;
  gradient: string;
}

const NUDGES: Nudge[] = [
  {
    key: "complete_profile",
    icon: <User className="w-5 h-5" />,
    title: "Lengkapi profilmu dulu yuk! 👋",
    description:
      "Isi nama, usia, dan minatmu agar kami bisa menyesuaikan pengalaman untukmu.",
    ctaLabel: "Lengkapi Profil",
    ctaPath: "/onboarding",
    gradient: "from-blue-500/10 to-cyan-500/10 border-blue-200",
  },
  {
    key: "take_assessment",
    icon: <Brain className="w-5 h-5" />,
    title: "Temukan tipe kepribadianmu! 🧠",
    description:
      "Ikuti tes RIASEC 8 pertanyaan (~3 menit) untuk mendapatkan rekomendasi karir & peluang yang dipersonalisasi.",
    ctaLabel: "Mulai Tes RIASEC",
    ctaPath: "/assessment",
    gradient: "from-purple-500/10 to-pink-500/10 border-purple-200",
  },
  {
    key: "explore_opportunities",
    icon: <Briefcase className="w-5 h-5" />,
    title: "Peluangmu sudah siap! 🎯",
    description:
      "Hasil tesmu sudah diproses. Lihat beasiswa, magang, dan kompetisi yang cocok untuk profil kepribadianmu.",
    ctaLabel: "Lihat Peluangku",
    ctaPath: "/opportunities",
    gradient: "from-orange-500/10 to-amber-500/10 border-orange-200",
  },
];

interface WelcomeNudgeProps {
  userId?: string;
}

const WelcomeNudge = ({ userId }: WelcomeNudgeProps) => {
  const navigate = useNavigate();
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    determineNudge(userId);
  }, [userId]);

  const isDismissed = (key: string) =>
    localStorage.getItem(`nudge_dismissed_${key}`) === "1";

  const dismiss = (key: string) => {
    localStorage.setItem(`nudge_dismissed_${key}`, "1");
    setVisible(false);
  };

  const determineNudge = async (uid: string) => {
    try {
      // Parallel: load profile + latest assessment result
      // maybeSingle() returns null instead of throwing when profile doesn't exist yet
      const [{ data: profile }, { data: assessments }] = await Promise.all([
        supabase
          .rpc("get_profile_secure", { profile_user_id: uid })
          .maybeSingle(),
        supabase
          .from("assessment_results")
          .select("id")
          .eq("user_id", uid)
          .limit(1),
      ]);

      const hasName = !!profile?.full_name?.trim();
      const hasAssessment = (assessments?.length ?? 0) > 0;

      if (!hasName && !isDismissed("complete_profile")) {
        setActiveNudge(NUDGES[0]);
        setVisible(true);
      } else if (!hasAssessment && !isDismissed("take_assessment")) {
        setActiveNudge(NUDGES[1]);
        setVisible(true);
      } else if (hasAssessment && !isDismissed("explore_opportunities")) {
        setActiveNudge(NUDGES[2]);
        setVisible(true);
      }
    } catch (err) {
      console.error("WelcomeNudge error:", err);
    }
  };

  if (!visible || !activeNudge) return null;

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-r ${activeNudge.gradient} mb-4 transition-all duration-300`}
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm text-foreground">
        {activeNudge.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-snug">
          {activeNudge.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {activeNudge.description}
        </p>
        <Button
          size="sm"
          className="mt-2 h-7 text-xs gap-1.5"
          onClick={() => {
            dismiss(activeNudge.key);
            navigate(activeNudge.ctaPath);
          }}
        >
          {activeNudge.ctaLabel}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => dismiss(activeNudge.key)}
        className="shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors text-muted-foreground"
        aria-label="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default WelcomeNudge;
