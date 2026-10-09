import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, X, Check } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { logGateEvent } from "@/lib/gateAnalytics";
import { useHargaMulai } from "@/hooks/usePaketLangganan";

interface LockedButtonProps {
  /** Feature name shown in the modal title, e.g. "Booking Sesi Mentor" */
  feature: string;
  /** Benefit bullets shown in the modal */
  benefits: string[];
  /** Path to return to after successful payment, e.g. "/mentors" */
  fromPath: string;
  /** The real action for premium users */
  onClick: () => void;
  /** Render the button — receives locked state + guarded click handler */
  children: (locked: boolean, guardedClick: () => void) => React.ReactNode;
}

/**
 * Action-level premium gate. Premium users' clicks pass straight through;
 * free users get an upgrade modal with feature benefits + CTA to /subscription
 * carrying ?from= so payment success returns them right here.
 */
export function LockedButton({ feature, benefits, fromPath, onClick, children }: LockedButtonProps) {
  const sub = useSubscription();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const hargaMulai = useHargaMulai();

  const locked = !sub.loading && !sub.isPremium;

  const guardedClick = () => {
    if (sub.loading) return; // avoid mis-gating while unresolved
    if (sub.isPremium) {
      onClick();
    } else {
      setShowModal(true);
      logGateEvent("upgrade_prompt_shown", feature);
    }
  };

  return (
    <>
      {children(locked, guardedClick)}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 20,
              maxWidth: 400,
              width: "100%",
              padding: "28px 26px 24px",
              position: "relative",
              boxShadow: "0 24px 64px rgba(15,23,42,0.28)",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Tutup"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "none",
                background: "var(--tk-gray-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={15} color="var(--tk-gray-600)" />
            </button>

            {/* Lock badge */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
              }}
            >
              <Lock size={24} color="#fff" />
            </div>

            <h3
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 800,
                fontSize: 19,
                color: "var(--tk-ink)",
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              {feature} — Fitur Premium
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", margin: "0 0 16px", lineHeight: 1.55 }}>
              Upgrade ke Premium untuk membuka fitur ini dan semua fitur lainnya.
            </p>

            {/* Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {benefits.map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#DCFCE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Check size={11} color="#16A34A" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13.5, color: "var(--tk-gray-700)", lineHeight: 1.45 }}>{b}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                logGateEvent("upgrade_prompt_clicked", feature);
                navigate(`/subscription?from=${encodeURIComponent(fromPath)}`);
              }}
              style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 20px",
                borderRadius: 13,
                border: "none",
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                color: "white",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 14.5,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
              }}
            >
              <Sparkles size={16} />
              {hargaMulai ? `Upgrade — mulai ${hargaMulai}/bln` : "Lihat Paket Berlangganan"}
            </button>
            <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--tk-gray-400)", margin: "10px 0 0" }}>
              Setelah pembayaran, kamu otomatis kembali ke halaman ini 🎉
            </p>
          </div>
        </div>
      )}
    </>
  );
}
