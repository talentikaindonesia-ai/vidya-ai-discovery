/**
 * OnboardingChecklist — "Mulai di sini" card for new users
 *
 * Shown to users who created their account ≤ 14 days ago and haven't
 * completed all steps yet. Hides itself once everything is done.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Circle, ChevronRight, X, Sparkles } from "lucide-react";

interface Step {
  id: string;
  label: string;
  desc: string;
  done: boolean;
  href: string;
  emoji: string;
}

interface Props {
  userId: string;
  profile: any;
}

export const OnboardingChecklist = ({ userId, profile }: Props) => {
  const [steps, setSteps]       = useState<Step[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    // Only show to users created ≤ 14 days ago
    const created = profile?.created_at ?? new Date().toISOString();
    const ageMs = Date.now() - new Date(created).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > 14) { setLoading(false); return; }

    // Check dismiss state
    if (sessionStorage.getItem(`onboarding_dismissed_${userId}`)) {
      setDismissed(true); setLoading(false); return;
    }

    loadSteps();
  }, [userId, profile]);

  const loadSteps = async () => {
    const [
      { data: assessmentData },
      { data: progressData },
      { data: interestData },
    ] = await Promise.all([
      supabase.from("assessment_results").select("id").eq("user_id", userId).limit(1),
      supabase.from("learning_progress").select("id").eq("user_id", userId).limit(1),
      supabase.from("user_interests").select("id").eq("user_id", userId).limit(1),
    ]);

    const hasBio       = !!(profile?.bio || profile?.description);
    const hasAssessment = (assessmentData?.length ?? 0) > 0;
    const hasProgress   = (progressData?.length ?? 0) > 0;
    const hasInterests  = (interestData?.length ?? 0) > 0;

    const built: Step[] = [
      {
        id: "account",
        emoji: "🎉",
        label: "Buat Akun",
        desc: "Kamu sudah bergabung di Talentika!",
        done: true,
        href: "/profile",
      },
      {
        id: "interests",
        emoji: "🎯",
        label: "Pilih Minat",
        desc: "Tentukan bidang yang ingin kamu eksplorasi",
        done: hasInterests,
        href: "/settings",
      },
      {
        id: "bio",
        emoji: "✍️",
        label: "Lengkapi Profil",
        desc: "Tambahkan foto dan bio singkatmu",
        done: hasBio,
        href: "/settings",
      },
      {
        id: "assessment",
        emoji: "🧠",
        label: "Ikuti Assessment",
        desc: "Temukan tipe kepribadian dan rekomendasimu",
        done: hasAssessment,
        href: "/assessment",
      },
      {
        id: "learning",
        emoji: "📚",
        label: "Mulai Belajar",
        desc: "Buka kursus pertamamu dan mulai belajar",
        done: hasProgress,
        href: "/learning",
      },
    ];

    setSteps(built);
    setLoading(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(`onboarding_dismissed_${userId}`, "1");
    setDismissed(true);
  };

  if (loading || dismissed) return null;

  const doneCount = steps.filter(s => s.done).length;
  const allDone   = doneCount === steps.length;
  if (allDone) return null;

  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div style={{
      background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
      borderRadius: 20,
      border: "1px solid #BFDBFE",
      padding: "20px 24px",
      marginBottom: 4,
      position: "relative",
    }}>
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4, borderRadius: 6, display: "flex" }}
        aria-label="Tutup"
      >
        <X size={15} />
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#60A5FA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>
            Mulai di sini — {doneCount}/{steps.length} selesai
          </div>
          <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12.5, color: "var(--tk-gray-500)" }}>
            Selesaikan langkah berikut untuk pengalaman terbaik
          </div>
        </div>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "#2563EB" }}>
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "#DBEAFE", borderRadius: 999, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#2563EB,#34D399)", borderRadius: 999, transition: "width .5s" }} />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step, i) => (
          <button
            key={step.id}
            onClick={() => !step.done && navigate(step.href)}
            disabled={step.done}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              borderRadius: 12, border: "none", textAlign: "left", cursor: step.done ? "default" : "pointer",
              background: step.done ? "rgba(255,255,255,.5)" : "#fff",
              opacity: step.done ? 0.75 : 1,
              transition: "background .15s",
            }}
          >
            {step.done
              ? <CheckCircle size={20} style={{ color: "#059669", flexShrink: 0 }} />
              : <Circle size={20} style={{ color: "#CBD5E1", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{step.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--tk-font-sans)", fontWeight: step.done ? 500 : 700, fontSize: 13.5, color: step.done ? "var(--tk-gray-500)" : "var(--tk-ink)", textDecoration: step.done ? "line-through" : "none" }}>
                {step.label}
              </div>
              <div style={{ fontFamily: "var(--tk-font-sans)", fontSize: 12, color: "var(--tk-gray-400)", marginTop: 1 }}>
                {step.desc}
              </div>
            </div>
            {!step.done && <ChevronRight size={14} style={{ color: "#94A3B8", flexShrink: 0 }} />}
          </button>
        ))}
      </div>
    </div>
  );
};
