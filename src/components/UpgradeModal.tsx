import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, Diamond, CheckCircle2, Zap, BookOpen, Users,
  Award, HeadphonesIcon, ArrowRight,
} from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: Zap,             text: "Assessment RIASEC lengkap & analitik mendalam" },
  { icon: BookOpen,        text: "Akses semua kursus & materi premium" },
  { icon: Users,           text: "Komunitas eksklusif & mentorship langsung" },
  { icon: Award,           text: "Sertifikat digital resmi Talentika" },
  { icon: Diamond,         text: "Rekomendasi karier personal berbasis AI" },
  { icon: HeadphonesIcon,  text: "Priority support 24/7" },
];

export const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const navigate = useNavigate();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleUpgrade = () => {
    onClose();
    navigate("/subscription");
  };

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15,23,42,.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        className="tk-page-in"
        style={{
          background: "#fff",
          borderRadius: 28,
          padding: "36px 32px 28px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 32px 80px rgba(0,0,0,.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background sparkle decoration */}
        <span
          style={{
            position: "absolute", top: 18, right: 60, fontSize: 14,
            color: "var(--tk-yellow)", opacity: 0.7, pointerEvents: "none",
          }}
          className="tk-sparkle"
        >✦</span>
        <span
          style={{
            position: "absolute", top: 56, right: 32, fontSize: 9,
            color: "var(--tk-blue-400)", opacity: 0.6, pointerEvents: "none",
          }}
          className="tk-sparkle"
        >✦</span>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18,
            width: 32, height: 32, borderRadius: 10,
            border: "none", background: "var(--tk-gray-100)",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "var(--tk-gray-500)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-200)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--tk-blue-50)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Diamond size={20} style={{ color: "var(--tk-blue-600)" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800, fontSize: 22,
              color: "var(--tk-ink)", letterSpacing: "-.02em", margin: 0,
            }}
          >
            Upgrade ke <span style={{ color: "var(--tk-blue-600)" }}>Pro</span>
          </h2>
        </div>
        <p style={{ color: "var(--tk-gray-500)", fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>
          Buka akses penuh ke semua fitur premium Talentika dan akselerasi perjalananmu.
        </p>

        {/* Plan highlight card */}
        <div
          style={{
            background: "linear-gradient(135deg, #E8F1FF, #FFEDE2)",
            borderRadius: 16, padding: "18px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--tk-font-mono)", fontWeight: 700, fontSize: 10.5,
                textTransform: "uppercase", letterSpacing: ".12em",
                color: "var(--tk-orange)", marginBottom: 4,
              }}
            >
              Talentika Pro
            </div>
            <div
              style={{
                fontFamily: "var(--tk-font-display)", fontWeight: 800,
                fontSize: 26, color: "var(--tk-ink)", lineHeight: 1,
              }}
            >
              Rp 99.000
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tk-gray-500)", marginLeft: 4 }}>
                /bulan
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)", marginTop: 4 }}>
              atau Rp 799.000/tahun — hemat 33%
            </div>
          </div>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 99,
              background: "var(--tk-orange)", color: "#fff",
              fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12,
            }}
          >
            ✦ Populer
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div
              key={text}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <CheckCircle2
                size={17}
                style={{ color: "var(--tk-blue-600)", flexShrink: 0 }}
              />
              <span style={{ fontFamily: "var(--tk-font-sans)", fontSize: 13.5, color: "var(--tk-gray-700)" }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleUpgrade}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 16,
            border: "none", cursor: "pointer",
            background: "var(--tk-blue-600)",
            fontFamily: "var(--tk-font-display)", fontWeight: 700,
            fontSize: 15.5, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 6px 20px rgba(37,99,235,.35)",
            transition: "background .18s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
        >
          Mulai Upgrade ke Pro <ArrowRight size={16} />
        </button>

        {/* Secondary link */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--tk-font-sans)", fontSize: 13,
              color: "var(--tk-gray-400)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--tk-gray-600)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--tk-gray-400)"; }}
          >
            Tetap menggunakan Free
          </button>
        </div>
      </div>
    </div>
  );
};
