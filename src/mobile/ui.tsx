import React, { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { C, F, SH } from "./theme";

/* Komponen dasar yang meniru gaya prototype Talentika Mobile v2 secara presisi. */

export function Screen({ children, tab = false, style, bg = C.bg }: { children: ReactNode; tab?: boolean; style?: CSSProperties; bg?: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto", background: bg, paddingBottom: tab ? 170 : 40, ...style }}>
      {children}
    </div>
  );
}

export function BackBtn({ onClick, small, dark }: { onClick?: () => void; small?: boolean; dark?: boolean }) {
  const nav = useNavigate();
  const s = small ? 38 : 40;
  return (
    <button aria-label="Kembali" onClick={onClick ?? (() => (window.history.length > 1 ? nav(-1) : nav("/app/home")))}
      style={{ width: s, height: s, border: "none", borderRadius: 12, background: dark ? C.bg : "#fff", boxShadow: dark ? "none" : SH.btn,
        cursor: "pointer", fontSize: small ? 16 : 17, color: C.text, flex: "none", fontFamily: "inherit" }}>←</button>
  );
}

export function Header({ title, sub, subColor, right, onBack, plain }: { title: ReactNode; sub?: ReactNode; subColor?: string; right?: ReactNode; onBack?: () => void; plain?: boolean }) {
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <BackBtn onClick={onBack} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {plain ? <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{title}</div> : (
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px" }}>{title}</div>)}
        {sub && <div style={{ fontSize: 12, color: subColor ?? C.muted, fontWeight: subColor ? 700 : 400, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function TabTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 25, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px", flex: 1 }}>{title}</h1>
        {right}
      </div>
      {sub && <p style={{ margin: "5px 0 0", fontSize: 13.5, color: C.muted }}>{sub}</p>}
    </div>
  );
}

export function Body({ children, gap = 14, top = 16 }: { children: ReactNode; gap?: number; top?: number }) {
  return <div style={{ padding: `${top}px 20px 0`, display: "flex", flexDirection: "column", gap }}>{children}</div>;
}

export function Card({ children, style, onClick, pad = 18, radius = 20 }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; pad?: number | string; radius?: number }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: radius, padding: pad, boxShadow: SH.card, cursor: onClick ? "pointer" : undefined, ...style }}>
      {children}
    </div>
  );
}

export function DarkCard({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: C.navy, borderRadius: 20, padding: 18, color: "#fff", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}>{children}</div>;
}

export function HeroCard({ children, style, onClick, bg = C.blue }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; bg?: string }) {
  return (
    <div onClick={onClick} style={{ background: bg, borderRadius: 22, padding: 20, color: "#fff", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.09)" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export function CardTitle({ children, right, size = 15 }: { children: ReactNode; right?: ReactNode; size?: number }) {
  if (!right) return <div style={{ fontSize: size, fontWeight: 800 }}>{children}</div>;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
      <div style={{ fontSize: size, fontWeight: 800 }}>{children}</div>{right}
    </div>
  );
}

export function Kicker({ children, color = C.faint, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, color, letterSpacing: ".5px", textTransform: "uppercase", ...style }}>{children}</div>;
}

export function Pill({ children, fg = C.blueDark, bg = C.tintBlue, size = 11, display, style }: { children: ReactNode; fg?: string; bg?: string; size?: number; display?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, fontFamily: display ? F.display : undefined, color: fg, background: bg, padding: size >= 12 ? "6px 11px" : "4px 9px", borderRadius: 99, flex: "none", whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
}

type BtnKind = "primary" | "orange" | "outline" | "ghost" | "soft" | "success" | "disabled";
export function Btn({ children, onClick, kind = "primary", h = 52, style, disabled, type = "button", full = true }: { children: ReactNode; onClick?: (e: any) => void; kind?: BtnKind; h?: number; style?: CSSProperties; disabled?: boolean; type?: "button" | "submit"; full?: boolean }) {
  const k = disabled ? "disabled" : kind;
  const map: Record<BtnKind, CSSProperties> = {
    primary: { background: C.blue, color: "#fff", boxShadow: h >= 52 ? SH.primarySm : undefined, border: "none" },
    orange: { background: C.orange, color: "#fff", boxShadow: h >= 52 ? SH.orange : undefined, border: "none" },
    outline: { background: "#fff", color: C.text, border: `1.5px solid ${C.line}` },
    ghost: { background: "none", color: C.muted, border: "none" },
    soft: { background: C.tintBlue, color: C.blueDark, border: "none" },
    success: { background: C.tintGreen, color: C.greenDark, border: "none", fontFamily: F.display },
    disabled: { background: C.disabled, color: "#fff", border: "none", cursor: "not-allowed" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ height: h, borderRadius: h >= 50 ? 16 : 13, fontFamily: "inherit", fontSize: h >= 52 ? 15.5 : 14, fontWeight: 700, cursor: "pointer",
        width: full ? "100%" : undefined, padding: full ? undefined : "0 18px", flex: "none", ...map[k], ...style }}>
      {children}
    </button>
  );
}

export function ChipBtn({ children, on, onClick, dark, style }: { children: ReactNode; on?: boolean; onClick?: () => void; dark?: boolean; style?: CSSProperties }) {
  const bgOn = dark ? C.navy : C.blue;
  return (
    <button onClick={onClick} style={{ flex: "none", height: 36, padding: "0 14px", border: "none", borderRadius: 99, background: on ? bgOn : "#fff", color: on ? "#fff" : C.text3,
      fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: SH.chip, ...style }}>{children}</button>
  );
}

export function FilterChip({ children, onClick, on }: { children: ReactNode; onClick?: () => void; on?: boolean }) {
  return (
    <button onClick={onClick} style={{ flex: "none", fontSize: 11.5, fontWeight: 700, color: on ? "#fff" : C.muted, background: on ? C.blue : "transparent",
      border: on ? `1.5px solid ${C.blue}` : `1.5px solid ${C.line}`, padding: "6px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>
  );
}

export function HScroll({ children, gap = 8, bleed = true, style }: { children: ReactNode; gap?: number; bleed?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ margin: bleed ? "0 -20px" : 0, padding: bleed ? "0 20px 2px" : "0 0 2px", display: "flex", gap, overflow: "auto", ...style }}>{children}</div>
  );
}

export function Bar({ pct, color = C.blue, h = 7, track = C.track }: { pct: number; color?: string; h?: number; track?: string }) {
  return (
    <div style={{ flex: 1, height: h, borderRadius: h / 2, background: track }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: h / 2, background: color, transition: "width .3s" }} />
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 9, color = C.blue, children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2 - (size > 100 ? 2 : 0.5);
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;
  const c = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.track} strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(0)}`} transform={`rotate(-90 ${c} ${c})`} style={{ transition: "stroke-dasharray .5s ease-out" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick?: () => void; label?: string }) {
  return (
    <span role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      style={{ width: 44, height: 26, borderRadius: 99, background: on ? C.blue : C.line, position: "relative", flex: "none", transition: "background .2s", cursor: "pointer" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }} />
    </span>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, background: C.track, padding: 5, borderRadius: 14 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, height: 40, border: "none", borderRadius: 11, background: value === o.value ? "#fff" : "transparent",
          color: value === o.value ? C.blue : C.muted, fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>{o.label}</button>
      ))}
    </div>
  );
}

export function Radio({ on }: { on: boolean }) {
  return <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${on ? C.blue : C.disabled}`, background: on ? C.blue : "#fff", flex: "none", boxShadow: on ? "inset 0 0 0 3px #fff" : undefined }} />;
}

export function Check({ on, size = 22 }: { on: boolean; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 7, border: `2px solid ${on ? C.green : C.disabled}`, background: on ? C.green : "#fff", color: "#fff",
      fontSize: 12, fontWeight: 700, fontFamily: F.display, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on ? "✓" : ""}</span>
  );
}

export function Avatar({ name, size = 44, radius, bg, fg, src, fontSize }: { name?: string | null; size?: number; radius?: number | string; bg?: string; fg?: string; src?: string | null; fontSize?: number }) {
  const ini = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: radius ?? "50%", background: bg ?? C.yellow, color: fg ?? "#7A5200", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontFamily: F.display, fontSize: fontSize ?? Math.round(size * 0.4), flex: "none", overflow: "hidden" }}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
    </div>
  );
}

export function IconTile({ children, bg, size = 42, radius = 13, fontSize = 18, color }: { children: ReactNode; bg: string; size?: number; radius?: number; fontSize?: number; color?: string }) {
  return <span style={{ width: size, height: size, borderRadius: radius, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize, flex: "none", color }}>{children}</span>;
}

export function MenuList({ items }: { items: { icon: ReactNode; label: ReactNode; onClick: () => void; danger?: boolean; right?: ReactNode }[] }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, boxShadow: SH.card, overflow: "hidden" }}>
      {items.map((it, i) => (
        <div key={i} onClick={it.onClick} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", borderBottom: i < items.length - 1 ? `1px solid ${C.track}` : "none", cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>{it.icon}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: it.danger ? C.red : undefined }}>{it.label}</span>
          {it.right ?? (!it.danger && <span style={{ color: C.faint }}>→</span>)}
        </div>
      ))}
    </div>
  );
}

export function Row({ children, onClick, last, style }: { children: ReactNode; onClick?: () => void; last?: boolean; style?: CSSProperties }) {
  return <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: last ? "none" : `1px solid ${C.track}`, cursor: onClick ? "pointer" : undefined, ...style }}>{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ height: 50, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "0 16px", fontFamily: "inherit", fontSize: 14.5, background: "#fff", color: C.text, outline: "none", minWidth: 0, width: "100%", boxSizing: "border-box", ...(props.style || {}) }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ width: "100%", height: 96, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", fontFamily: "inherit", fontSize: 14, resize: "none", outline: "none", color: C.text, background: C.subtle, boxSizing: "border-box", ...(props.style || {}) }} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: C.text3 }}>{children}</div>;
}

export function Empty({ icon = "🗂️", title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "26px 20px", boxShadow: SH.card, textAlign: "center" }}>
      <div style={{ fontSize: 34 }}>{icon}</div>
      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800 }}>{title}</div>
      {body && <p style={{ margin: "6px auto 0", fontSize: 13, color: C.muted, lineHeight: 1.55, maxWidth: 280 }}>{body}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: C.muted, fontSize: 13 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${C.track}`, borderTopColor: C.blue, animation: "tkSpin .8s linear infinite" }} />
      {label}
    </div>
  );
}

export function Skeleton({ h = 80, r = 20 }: { h?: number; r?: number }) {
  return <div style={{ height: h, borderRadius: r, background: "linear-gradient(90deg,#EEF1F6 25%,#F5F7FA 50%,#EEF1F6 75%)", backgroundSize: "200% 100%", animation: "tkShimmer 1.2s infinite" }} />;
}

export function AiLabel({ dark }: { dark?: boolean }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: dark ? "rgba(255,255,255,.7)" : C.faint }}>✦ AI-generated</span>;
}

export function Note({ children, onClick, tone = "blue" }: { children: ReactNode; onClick?: () => void; tone?: "blue" | "green" | "yellow" }) {
  const bg = tone === "green" ? C.tintGreen : tone === "yellow" ? C.tintYellow : C.tintBlue;
  return <div onClick={onClick} style={{ background: bg, borderRadius: 16, padding: "13px 15px", fontSize: 12.5, color: C.text3, lineHeight: 1.55, cursor: onClick ? "pointer" : undefined }}>{children}</div>;
}

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({ left: 4 + (i * 7) % 92, w: 6 + (i % 3) * 2, h: 9 + (i % 2) * 4,
  color: ["#FFC107", "#FF6A00", "#5CE0A1", "#A9C5FF", "#F472B6"][i % 5], dur: 1.8 + (i % 4) * 0.4, delay: (i % 6) * 0.18 }));
export function Confetti() {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;
  return <>{CONFETTI.map((c, i) => (
    <span key={i} style={{ position: "absolute", top: 0, left: `${c.left}%`, width: c.w, height: c.h, borderRadius: 2, background: c.color, animation: `tkConfetti ${c.dur}s ${c.delay}s ease-in both`, pointerEvents: "none" }} />
  ))}</>;
}

/** Lembar bawah sederhana (modal) */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(11,29,58,.45)", display: "flex", alignItems: "flex-end", animation: "tkFade .2s ease both" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "86%", overflow: "auto", background: C.bg, borderRadius: "24px 24px 0 0", padding: "18px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)", animation: "tkFadeUp .25s ease both" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.disabled, margin: "0 auto 14px" }} />
        {title && <div style={{ fontSize: 17, fontWeight: 800, fontFamily: F.display, marginBottom: 12 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export const GLOBAL_CSS = `
@keyframes tkFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes tkPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes tkFade{from{opacity:0}to{opacity:1}}
@keyframes tkSpin{to{transform:rotate(360deg)}}
@keyframes tkShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes tkConfetti{0%{transform:translateY(-16px) rotate(0);opacity:1}100%{transform:translateY(260px) rotate(400deg);opacity:0}}
.tk-app *{box-sizing:border-box}
.tk-app input::placeholder,.tk-app textarea::placeholder{color:#94A3B8}
.tk-app ::-webkit-scrollbar{width:0;height:0}
.tk-app button{-webkit-tap-highlight-color:transparent}
.tk-app button:active{transform:scale(.98)}
.tk-app :focus-visible{outline:2.5px solid #1D4ED8;outline-offset:2px}
@media (prefers-reduced-motion: reduce){.tk-app *{animation:none!important;transition:none!important}}
`;
