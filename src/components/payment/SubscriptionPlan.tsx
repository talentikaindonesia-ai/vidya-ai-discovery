import { Check, Star, Users, BookOpen, Award, Crown, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionPlanProps {
  plan: {
    id: string;
    name: string;
    type: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    max_users: number;
    is_popular?: boolean;
  };
  billingCycle: "monthly" | "yearly";
  onSelectPlan: (planId: string, billingCycle: "monthly" | "yearly") => void;
  currentPlan?: string;
  loading?: boolean;
  isHighlighted?: boolean;
}

// ── Plan colour palette ───────────────────────────────────────────────────────
const PLAN_THEME: Record<string, {
  headerGrad: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  btnBg: string;
  btnHover: string;
  accentColor: string;
  borderColor: string;
}> = {
  free: {
    headerGrad:  "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
    badgeBg:     "#D1FAE5",
    badgeText:   "#065F46",
    iconBg:      "#ECFDF5",
    btnBg:       "#059669",
    btnHover:    "#047857",
    accentColor: "#059669",
    borderColor: "#A7F3D0",
  },
  individual: {
    headerGrad:  "linear-gradient(135deg, #E8F1FF, #BFDBFE)",
    badgeBg:     "#DBEAFE",
    badgeText:   "#1E40AF",
    iconBg:      "#EFF6FF",
    btnBg:       "var(--tk-blue-600)",
    btnHover:    "var(--tk-blue-700)",
    accentColor: "var(--tk-blue-600)",
    borderColor: "#93C5FD",
  },
  premium_individual: {
    headerGrad:  "linear-gradient(135deg, #E8F1FF, #FFEDE2)",
    badgeBg:     "#FEF3C7",
    badgeText:   "#92400E",
    iconBg:      "#FFFBEB",
    btnBg:       "linear-gradient(135deg, var(--tk-blue-600), var(--tk-orange))",
    btnHover:    "linear-gradient(135deg, var(--tk-blue-700), #D97706)",
    accentColor: "var(--tk-orange)",
    borderColor: "#FCD34D",
  },
  family: {
    headerGrad:  "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
    badgeBg:     "#EDE9FE",
    badgeText:   "#5B21B6",
    iconBg:      "#F5F3FF",
    btnBg:       "#7C3AED",
    btnHover:    "#6D28D9",
    accentColor: "#7C3AED",
    borderColor: "#C4B5FD",
  },
  school: {
    headerGrad:  "linear-gradient(135deg, #CCFBF1, #99F6E4)",
    badgeBg:     "#CCFBF1",
    badgeText:   "#0F766E",
    iconBg:      "#F0FDFA",
    btnBg:       "#0D9488",
    btnHover:    "#0F766E",
    accentColor: "#0D9488",
    borderColor: "#5EEAD4",
  },
};

const getTheme = (type: string) =>
  PLAN_THEME[type] ?? PLAN_THEME["individual"];

const getPlanIcon = (type: string, priceMonthly: number) => {
  switch (type) {
    case "free":              return BookOpen;
    case "premium_individual":
      return priceMonthly > 50_000 ? Crown : Star;
    case "family":            return Users;
    case "school":            return Award;
    default:                  return Zap;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────
export const SubscriptionPlan = ({
  plan,
  billingCycle,
  onSelectPlan,
  currentPlan,
  loading,
  isHighlighted,
}: SubscriptionPlanProps) => {
  const theme       = getTheme(plan.type);
  const Icon        = getPlanIcon(plan.type, plan.price_monthly);
  const price       = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  const isCurrentPlan = currentPlan === plan.id;
  const isFree      = plan.type === "free";
  const isPopular   = plan.type === "premium_individual" || isHighlighted;
  const savePercent = Math.round(
    ((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100
  );

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        border: `2px solid ${isPopular || isCurrentPlan ? theme.borderColor : "var(--tk-gray-200)"}`,
        background: "white",
        overflow: "hidden",
        boxShadow: isPopular || isCurrentPlan
          ? `0 8px 32px rgba(0,0,0,.10), 0 0 0 1px ${theme.borderColor}`
          : "0 2px 8px rgba(0,0,0,.06)",
        transform: isPopular ? "scale(1.025)" : "none",
        transition: "box-shadow .2s, transform .2s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 16px 40px rgba(0,0,0,.13), 0 0 0 1px ${theme.borderColor}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isPopular || isCurrentPlan
          ? `0 8px 32px rgba(0,0,0,.10), 0 0 0 1px ${theme.borderColor}`
          : "0 2px 8px rgba(0,0,0,.06)";
      }}
    >
      {/* ── Ribbon: popular / active ────────────────────────────────────── */}
      {(isPopular || isCurrentPlan) && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            background: isCurrentPlan
              ? "linear-gradient(90deg,#059669,#0D9488)"
              : "linear-gradient(90deg,var(--tk-blue-600),var(--tk-orange))",
            color: "#fff",
            textAlign: "center",
            padding: "7px 0",
            fontSize: 12,
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            letterSpacing: ".04em",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Star size={12} />
          {isCurrentPlan ? "PAKET AKTIF" : "PALING POPULER"}
        </div>
      )}

      {/* ── Gradient header ─────────────────────────────────────────────── */}
      <div
        style={{
          background: theme.headerGrad,
          padding: `${isPopular || isCurrentPlan ? 44 : 24}px 24px 20px`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative sparkle */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 10, right: 14,
            fontSize: 22,
            opacity: 0.25,
            color: theme.accentColor,
          }}
        >✦</span>

        {/* Icon bubble */}
        <div
          style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: theme.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: `0 4px 12px rgba(0,0,0,.08)`,
          }}
        >
          <Icon size={26} style={{ color: theme.accentColor }} />
        </div>

        {/* Plan name */}
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--tk-ink)",
            marginBottom: 10,
          }}
        >
          {plan.name}
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          {isFree ? (
            <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--tk-font-display)", color: theme.accentColor }}>
              Gratis
            </span>
          ) : (
            <>
              <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--tk-font-display)", color: "var(--tk-ink)" }}>
                {formatCurrency(price)}
              </span>
              <span style={{ fontSize: 13, color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-sans)" }}>
                /{billingCycle === "monthly" ? "bln" : "thn"}
              </span>
            </>
          )}
        </div>

        {/* Yearly save badge */}
        {billingCycle === "yearly" && !isFree && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              padding: "3px 10px",
              borderRadius: 99,
              background: theme.badgeBg,
              color: theme.badgeText,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "var(--tk-font-display)",
            }}
          >
            Hemat {savePercent}%
          </div>
        )}

        {/* Users label */}
        <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 8, fontFamily: "var(--tk-font-sans)" }}>
          {plan.max_users > 1 ? `Untuk ${plan.max_users} pengguna` : "Untuk pengguna individu"}
        </div>
      </div>

      {/* ── Feature list ────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {plan.features.map((feature, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: "50%",
                background: theme.badgeBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}
            >
              <Check size={11} style={{ color: theme.accentColor }} />
            </div>
            <span style={{ fontSize: 13.5, color: "var(--tk-gray-700)", fontFamily: "var(--tk-font-sans)", lineHeight: 1.45 }}>
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* ── CTA button ──────────────────────────────────────────────────── */}
      <div style={{ padding: "0 22px 22px" }}>
        <button
          disabled={loading || isCurrentPlan}
          onClick={() => onSelectPlan(plan.id, billingCycle)}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 14,
            border: "none",
            cursor: loading || isCurrentPlan ? "not-allowed" : "pointer",
            background: isCurrentPlan
              ? "var(--tk-gray-100)"
              : plan.type === "premium_individual"
              ? "linear-gradient(135deg, var(--tk-blue-600), var(--tk-orange))"
              : theme.btnBg,
            color: isCurrentPlan ? "var(--tk-gray-400)" : "#fff",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 14.5,
            opacity: loading ? 0.7 : 1,
            transition: "opacity .2s, filter .2s",
            letterSpacing: ".01em",
          }}
          onMouseEnter={(e) => {
            if (!isCurrentPlan && !loading)
              (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.filter = "none";
          }}
        >
          {isCurrentPlan
            ? "✓ Paket Aktif"
            : isFree
            ? "Mulai Gratis"
            : "Berlangganan Sekarang →"}
        </button>
      </div>
    </div>
  );
};
