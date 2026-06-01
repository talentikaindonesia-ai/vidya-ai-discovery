import { X, Loader2, ToggleLeft, ToggleRight, BarChart2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface LearningContent {
  id: string; title: string; description: string | null;
  content_type: string; content_url: string | null; thumbnail_url: string | null;
  duration_minutes: number | null; difficulty_level: string | null;
  category_id: string | null; tags: string[] | null;
  is_featured: boolean | null; is_premium: boolean | null;
  is_active: boolean | null; priority_score: number | null;
  created_at: string;
  learning_categories?: { name: string; color: string | null } | null;
}

export interface Category {
  id: string; name: string; description: string | null;
  icon: string | null; color: string | null; is_active: boolean | null;
}

export interface Challenge {
  id: string; title: string; description: string | null;
  challenge_type: string; difficulty: string | null;
  xp_reward: number | null; max_participants: number | null;
  start_date: string | null; end_date: string | null; is_active: boolean | null;
}

export type NavSection = "overview" | "content" | "categories" | "challenges" | "articles" | "opportunities" | "users" | "payments";

// ─── Design constants ─────────────────────────────────────────────────────────
export const DIFF_CFG: Record<string, { label: string; bg: string; color: string }> = {
  beginner:     { label: "Pemula",   bg: "#D1FAE5", color: "#065F46" },
  intermediate: { label: "Menengah", bg: "#FEF3C7", color: "#92400E" },
  advanced:     { label: "Lanjutan", bg: "#FEE2E2", color: "#991B1B" },
};
export const TYPE_CFG: Record<string, { label: string; bg: string; color: string }> = {
  course:   { label: "Kursus",  bg: "#DBEAFE", color: "#1D4ED8" },
  video:    { label: "Video",   bg: "#EDE9FE", color: "#5B21B6" },
  article:  { label: "Artikel", bg: "#ECFDF5", color: "#065F46" },
  module:   { label: "Modul",   bg: "#FFF7ED", color: "#C2410C" },
  quiz:     { label: "Kuis",    bg: "#FDF2F8", color: "#9D174D" },
};

// ─── Shared styles ─────────────────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#0F172A", background: "#FAFAFA", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
export const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" };
export const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", minHeight: 80 };

// ─── Shared utilities ─────────────────────────────────────────────────────────
export function fmtIDR(n: number) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }
export function fmtDate(s: string) { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }

// ─── Shared components ─────────────────────────────────────────────────────────
export function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Toggle({ on, onToggle, loading }: { on: boolean; onToggle: () => void; loading?: boolean }) {
  return (
    <button onClick={onToggle} disabled={loading} style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, padding: 0 }}>
      {on ? <ToggleRight size={22} style={{ color: "#2563EB" }} /> : <ToggleLeft size={22} style={{ color: "#94A3B8" }} />}
    </button>
  );
}

export function StatCard({ icon: Icon, value, label, sub, color }: { icon: React.ElementType; value: string | number; label: string; sub: string; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", fontFamily: "var(--tk-font-display)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#64748B" }}>{sub}</div>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: wide ? 820 : 600, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #E2E8F0" }}>
          <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "#0F172A", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex" }}><X size={20} /></button>
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ message, onConfirm, onCancel, loading }: { message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 48px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>🗑️</div>
        <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "#0F172A", textAlign: "center", margin: "0 0 10px" }}>Hapus Konten?</h3>
        <p style={{ fontSize: 14, color: "#64748B", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Batal</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#DC2626", color: "white", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : null} Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div style={{ ...(half ? { gridColumn: "span 1" } : { gridColumn: "span 2" }) }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</label>
      {children}
    </div>
  );
}

export const SectionLoader = () => (
  <div style={{ padding: 60, textAlign: "center" }}>
    <Loader2 size={28} className="animate-spin" style={{ color: "#2563EB", margin: "0 auto" }} />
  </div>
);
