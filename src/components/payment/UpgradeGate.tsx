import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock, Sparkles } from "lucide-react";
import { logGateEvent } from "@/lib/gateAnalytics";

interface UpgradeGateProps {
  /** Short description of what's behind the gate */
  feature: string;
  /** Which plan is required. Default: "premium" */
  requiredPlan?: "premium" | "school" | "enterprise";
  /** Children to blur + overlay */
  children: React.ReactNode;
  /** Optional plan ID to pre-select on subscription page */
  planId?: string;
  /** Path to return to after successful payment, e.g. "/learning" */
  fromPath?: string;
}

/**
 * Wraps any content with a premium blur gate.
 * Free users see a blurred preview + upgrade CTA.
 * Premium/school/enterprise users see the content normally.
 */
export function UpgradeGate({
  feature,
  requiredPlan = "premium",
  children,
  planId,
  fromPath,
}: UpgradeGateProps) {
  const navigate = useNavigate();
  const sub = useSubscription();

  // Access check (computed before any early return so hooks stay unconditional)
  const hasAccess =
    requiredPlan === "school"
      ? sub.isSchool || sub.isEnterprise
      : requiredPlan === "enterprise"
      ? sub.isEnterprise
      : sub.isPremium;

  const locked = !sub.loading && !hasAccess;

  // Funnel analytics: log once per mount when the gate is actually shown
  useEffect(() => {
    if (locked) logGateEvent("upgrade_prompt_shown", feature);
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Still loading — render children transparently to avoid layout shift
  if (sub.loading) return <>{children}</>;

  if (hasAccess) return <>{children}</>;

  const params = new URLSearchParams();
  if (planId) params.set("planId", planId);
  if (fromPath) params.set("from", fromPath);
  const qs = params.toString();
  const href = qs ? `/subscription?${qs}` : "/subscription";

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      {/* Blurred preview */}
      <div
        style={{
          filter: "blur(5px) saturate(0.3)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, rgba(15,23,42,0.72), rgba(29,78,216,0.55))",
          backdropFilter: "blur(2px)",
          borderRadius: 14,
          padding: "24px 20px",
          textAlign: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(37,99,235,0.25)",
            border: "1.5px solid rgba(59,130,246,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={22} color="#93C5FD" />
        </div>

        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 16,
            color: "#F1F5F9",
            letterSpacing: "-0.01em",
          }}
        >
          Fitur Premium
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#CBD5E1",
            lineHeight: 1.5,
            maxWidth: 260,
          }}
        >
          {feature}
        </div>

        <button
          onClick={() => {
            logGateEvent("upgrade_prompt_clicked", feature);
            navigate(href);
          }}
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "11px 24px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            color: "white",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
            transition: "filter 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
        >
          <Sparkles size={15} />
          Upgrade Sekarang →
        </button>
      </div>
    </div>
  );
}
