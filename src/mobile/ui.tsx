import React, { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { C, F, SH } from "./theme";
import { Icon } from "./icons";
import tikaImg from "./assets/v3/tika.webp";
import logoIcon from "./assets/v3/logo-icon.webp";

export { Icon };
export const TIKA = tikaImg;
export const LOGO = logoIcon;

/* Komponen dasar Talentika Mobile v3 (handoff "Talentika Mobile App v3"). */

const TOP = "calc(env(safe-area-inset-top, 0px) + 16px)";

export function Screen({ children, tab = false, style, bg = C.bg }: { children: ReactNode; tab?: boolean; style?: CSSProperties; bg?: string }) {
  return (
    <div className={tab ? "tk-screen tk-tabpad" : "tk-screen"} style={{ position: "absolute", inset: 0, overflow: "auto", background: bg, paddingBottom: tab ? "calc(env(safe-area-inset-bottom, 0px) + 120px)" : 40, animation: "tkIn .25s ease both", ...style }}>
      {children}
    </div>
  );
}

/** Tombol bundar 42px. `dark` = di atas latar putih (isi #F1F6FD), default = putih berbayang. */
export function BackBtn({ onClick, small, dark, light }: { onClick?: () => void; small?: boolean; dark?: boolean; light?: boolean }) {
  const nav = useNavigate();
  const s = small ? 38 : 42;
  return (
    <button aria-label="Kembali" onClick={onClick ?? (() => (window.history.length > 1 ? nav(-1) : nav("/app/home")))}
      style={{ width: s, height: s, border: "none", borderRadius: "50%", background: light ? "rgba(255,255,255,.12)" : dark ? C.soft : "#fff",
        boxShadow: dark || light ? "none" : SH.btn, cursor: "pointer", color: light ? "#fff" : C.text, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name="left" size={20} />
    </button>
  );
}

export function IconBtn({ icon, onClick, label, primary, badge, size = 42, style }: { icon: string; onClick?: () => void; label: string; primary?: boolean; badge?: boolean; size?: number; style?: CSSProperties }) {
  return (
    <button aria-label={label} onClick={onClick}
      style={{ position: "relative", width: size, height: size, borderRadius: "50%", border: "none", background: primary ? C.blue : "#fff", color: primary ? "#fff" : C.text,
        boxShadow: primary ? "0 6px 14px rgba(0,102,255,.3)" : SH.btn, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none", ...style }}>
      <Icon name={icon} size={19} />
      {badge && <span style={{ position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff" }} />}
    </button>
  );
}

export function Header({ title, sub, subColor, right, onBack, plain }: { title: ReactNode; sub?: ReactNode; subColor?: string; right?: ReactNode; onBack?: () => void; plain?: boolean }) {
  return (
    <div style={{ padding: `${TOP} 20px 0`, display: "flex", alignItems: "center", gap: 12 }}>
      <BackBtn onClick={onBack} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {plain ? <div style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{title}</div> : (
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.2px", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>)}
        {sub && <div style={{ fontSize: 11.5, color: subColor ?? C.muted, fontWeight: subColor ? 600 : 400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function TabTitle({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ padding: `${TOP} 20px 0`, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1.15 }}>{title}</h1>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 13, color: C.muted }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Baris merek untuk Beranda: logo + Talentika + tombol kanan. */
export function BrandBar({ right }: { right?: ReactNode }) {
  return (
    <div style={{ padding: `${TOP} 20px 0`, display: "flex", alignItems: "center", gap: 10 }}>
      <img src={logoIcon} alt="" style={{ width: 38, height: 38, borderRadius: 11, boxShadow: "0 3px 10px rgba(15,23,42,.08)" }} />
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1 }}>Talentika</div><div style={{ fontSize: 10, color: C.muted, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Discover your full potential</div></div>
      {right}
    </div>
  );
}

export function Body({ children, gap = 14, top = 16 }: { children: ReactNode; gap?: number; top?: number }) {
  return <div style={{ padding: `${top}px 20px 0`, display: "flex", flexDirection: "column", gap }}>{children}</div>;
}

export function Card({ children, style, onClick, pad = 16, radius = 20 }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; pad?: number | string; radius?: number }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: radius, padding: pad, boxShadow: SH.card, cursor: onClick ? "pointer" : undefined, ...style }}>
      {children}
    </div>
  );
}

export function DarkCard({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background: C.navy, borderRadius: 18, padding: 14, color: "#fff", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}>{children}</div>;
}

/** Kartu gelap bermaskot Tika: label kuning + isi. */
export function TikaCard({ kicker, children, onClick, action, style }: { kicker: ReactNode; children: ReactNode; onClick?: () => void; action?: ReactNode; style?: CSSProperties }) {
  return (
    <div onClick={onClick} style={{ background: C.navy, borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "flex-start", cursor: onClick ? "pointer" : undefined, ...style }}>
      <img src={tikaImg} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow, textTransform: "uppercase" }}>{kicker}</div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,.9)", marginTop: 3 }}>{children}</div>
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
      </div>
    </div>
  );
}

export function HeroCard({ children, style, onClick, bg = "linear-gradient(120deg,#0066FF,#00A3E0)" }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; bg?: string }) {
  return (
    <div onClick={onClick} style={{ background: bg, borderRadius: 22, padding: 18, color: "#fff", position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : undefined, ...style }}>
      <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export function CardTitle({ children, right, size = 15 }: { children: ReactNode; right?: ReactNode; size?: number }) {
  if (!right) return <div style={{ fontSize: size, fontWeight: 700 }}>{children}</div>;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
      <div style={{ fontSize: size, fontWeight: 700 }}>{children}</div>{right}
    </div>
  );
}

/** Judul seksi v3: 17px tebal + tautan biru "Lihat semua". */
export function SectionHead({ children, action, onAction, right, style }: { children: ReactNode; action?: ReactNode; onAction?: () => void; right?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 6, ...style }}>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.1px" }}>{children}</div>
      {right ?? (action && <button onClick={onAction} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{action}</button>)}
    </div>
  );
}

export function Kicker({ children, color = C.faint, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: ".6px", textTransform: "uppercase", ...style }}>{children}</div>;
}

export function Pill({ children, fg = C.blue, bg = C.tintBlue, size = 11, display, style }: { children: ReactNode; fg?: string; bg?: string; size?: number; display?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ fontSize: size, fontWeight: display ? 700 : 600, color: fg, background: bg, padding: size >= 12 ? "6px 12px" : "4px 10px", borderRadius: 99, flex: "none", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, ...style }}>
      {children}
    </span>
  );
}

type BtnKind = "primary" | "orange" | "outline" | "ghost" | "soft" | "success" | "disabled" | "dark" | "yellow" | "blueOutline";
export function Btn({ children, onClick, kind = "primary", h = 54, style, disabled, type = "button", full = true }: { children: ReactNode; onClick?: (e: any) => void; kind?: BtnKind; h?: number; style?: CSSProperties; disabled?: boolean; type?: "button" | "submit"; full?: boolean }) {
  const k = disabled ? "disabled" : kind;
  const big = h >= 50;
  const map: Record<BtnKind, CSSProperties> = {
    primary: { background: C.blue, color: "#fff", boxShadow: big ? SH.primarySm : undefined, border: "none" },
    // v3 memakai satu warna aksi utama — "orange" lama kini tampil biru
    orange: { background: C.blue, color: "#fff", boxShadow: big ? SH.primarySm : undefined, border: "none" },
    outline: { background: "#fff", color: C.text, border: `1.5px solid ${C.line}` },
    blueOutline: { background: "#fff", color: C.blue, border: `1.5px solid ${C.blue}` },
    ghost: { background: "none", color: C.muted, border: "none" },
    soft: { background: C.tintBlue, color: C.blue, border: "none" },
    success: { background: C.green, color: "#fff", border: "none" },
    dark: { background: C.navy, color: "#fff", border: "none" },
    yellow: { background: C.yellow, color: C.text, border: "none" },
    disabled: { background: C.disabled, color: "#fff", border: "none", cursor: "not-allowed" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ height: h, borderRadius: big ? 18 : 13, fontFamily: "inherit", fontSize: big ? 15.5 : 13, fontWeight: 600, cursor: "pointer",
        width: full ? "100%" : undefined, padding: full ? "0 14px" : "0 16px", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, ...map[k], ...style }}>
      {children}
    </button>
  );
}

/** Tab pil v3: aktif biru, nonaktif #F1F6FD. */
export function ChipBtn({ children, on, onClick, dark, style }: { children: ReactNode; on?: boolean; onClick?: () => void; dark?: boolean; style?: CSSProperties }) {
  const bgOn = dark ? C.navy : C.blue;
  return (
    <button onClick={onClick} style={{ flex: "none", height: 34, padding: "0 14px", border: "none", borderRadius: 99, background: on ? bgOn : C.soft, color: on ? "#fff" : C.text2,
      fontFamily: "inherit", fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", ...style }}>{children}</button>
  );
}

export function Tabs<T extends string | number>({ items, value, onChange, bleed = true }: { items: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; bleed?: boolean }) {
  return (
    <HScroll gap={7} bleed={bleed}>
      {items.map(it => <ChipBtn key={String(it.value)} on={it.value === value} onClick={() => onChange(it.value)}>{it.label}</ChipBtn>)}
    </HScroll>
  );
}

export function FilterChip({ children, onClick, on }: { children: ReactNode; onClick?: () => void; on?: boolean }) {
  return (
    <button onClick={onClick} style={{ flex: "none", height: 32, fontSize: 12, fontWeight: 500, color: on ? C.blue : C.text2, background: on ? C.tintBlue : "#fff",
      border: `1.5px solid ${on ? C.blue : C.line}`, padding: "0 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{children}</button>
  );
}

export function HScroll({ children, gap = 8, bleed = true, style }: { children: ReactNode; gap?: number; bleed?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ margin: bleed ? "0 -20px" : 0, padding: bleed ? "0 20px 4px" : "0 0 4px", display: "flex", gap, overflow: "auto", ...style }}>{children}</div>
  );
}

export function Bar({ pct, color = C.blue, h = 8, track = C.track }: { pct: number; color?: string; h?: number; track?: string }) {
  return (
    <div style={{ flex: 1, height: h, borderRadius: 99, background: track }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", borderRadius: 99, background: color, transition: "width .4s" }} />
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 9, color = C.blue, track = C.track, children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2 - (size > 100 ? 2 : 0.5);
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;
  const c = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
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
      style={{ width: 44, height: 26, borderRadius: 99, background: on ? C.blue : C.disabled, position: "relative", flex: "none", transition: "background .2s", cursor: "pointer" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s" }} />
    </span>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "#fff", padding: 6, borderRadius: 16, boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, height: 38, border: "none", borderRadius: 11, background: value === o.value ? C.blue : "transparent",
          color: value === o.value ? "#fff" : C.text2, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{o.label}</button>
      ))}
    </div>
  );
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blue : "#fff", color: "#fff", flex: "none",
      display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Icon name="check" size={13} />}</span>
  );
}

export function Check({ on, size = 24 }: { on: boolean; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 8, border: `1.5px solid ${on ? C.green : C.disabled}`, background: on ? C.green : "#fff", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on && <Icon name="check" size={size * 0.56} />}</span>
  );
}

export function Avatar({ name, size = 44, radius, bg, fg, src, fontSize, ring }: { name?: string | null; size?: number; radius?: number | string; bg?: string; fg?: string; src?: string | null; fontSize?: number; ring?: string }) {
  const ini = (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join("").toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: radius ?? "50%", background: bg ?? C.tintBlue, color: fg ?? C.blue, display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: fontSize ?? Math.round(size * 0.36), flex: "none", overflow: "hidden", border: ring ? `2px solid ${ring}` : undefined }}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
    </div>
  );
}

export function IconTile({ children, bg, size = 42, radius = 13, fontSize = 18, color }: { children: ReactNode; bg: string; size?: number; radius?: number; fontSize?: number; color?: string }) {
  return <span style={{ width: size, height: size, borderRadius: radius, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize, flex: "none", color }}>{children}</span>;
}

/** Gambar sampul sebagai background (seperti span role=img di prototype). */
export function ImgBox({ src, w = "100%", h, r = 14, style, children }: { src?: string | null; w?: number | string; h: number | string; r?: number | string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <span role="img" aria-label="" style={{ position: "relative", display: "block", flex: "none", width: w, height: h, borderRadius: r, overflow: "hidden", background: C.tintBlue,
      backgroundImage: src ? `url('${src}')` : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", ...style }}>{children}</span>
  );
}

export function MenuList({ items }: { items: { icon: ReactNode; label: ReactNode; onClick: () => void; danger?: boolean; right?: ReactNode }[] }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, boxShadow: SH.card, overflow: "hidden" }}>
      {items.map((it, i) => (
        <button key={i} onClick={it.onClick} style={{ width: "100%", border: "none", background: "none", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left",
          borderBottom: i < items.length - 1 ? "1px solid #F1F5FB" : "none", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: it.danger ? C.tintRed : C.tintBlue, color: it.danger ? C.red : C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flex: "none" }}>
            {typeof it.icon === "string" && /^[a-z]+$/.test(it.icon) ? <Icon name={it.icon} size={17} /> : it.icon}
          </span>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: it.danger ? C.red : C.text }}>{it.label}</span>
          {it.right ?? (!it.danger && <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>)}
        </button>
      ))}
    </div>
  );
}

export function Row({ children, onClick, last, style }: { children: ReactNode; onClick?: () => void; last?: boolean; style?: CSSProperties }) {
  return <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: last ? "none" : "1px solid #F1F5FB", cursor: onClick ? "pointer" : undefined, ...style }}>{children}</div>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { icon?: string }) {
  const { icon, style, ...rest } = props;
  const base: CSSProperties = { height: 54, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: "0 16px", fontFamily: "inherit", fontSize: 14.5, background: C.subtle, color: C.text, outline: "none", minWidth: 0, width: "100%", boxSizing: "border-box" };
  if (!icon) return <input {...rest} style={{ ...base, ...(style || {}) }} />;
  return (
    <div style={{ ...base, display: "flex", alignItems: "center", gap: 10, ...(style || {}) }}>
      <span style={{ color: C.faint, display: "flex" }}><Icon name={icon} size={19} /></span>
      <input {...rest} style={{ flex: 1, minWidth: 0, border: "none", background: "none", fontFamily: "inherit", fontSize: 14.5, color: C.text, outline: "none", height: "100%" }} />
    </div>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ width: "100%", height: 96, border: `1.5px solid ${C.line}`, borderRadius: 13, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, resize: "none", outline: "none", color: C.text, background: C.subtle, boxSizing: "border-box", ...(props.style || {}) }} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{children}</div>;
}

/** Fitur Plus yang terkunci untuk akun Free — ketuk untuk membuka penawaran Plus. */
export function PlusTeaser({ title, body, onClick, style }: { title: ReactNode; body?: ReactNode; onClick: () => void; style?: CSSProperties }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", border: "1.5px dashed #C9DCF8", background: "#fff", borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", ...style }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="lock" size={18} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{title}</span>
        {body && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 1, lineHeight: 1.4 }}>{body}</span>}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "3px 8px", borderRadius: 99, flex: "none" }}>PLUS</span>
    </button>
  );
}

export function Empty({ icon = "folder", title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", boxShadow: SH.card, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 20, background: C.tintBlue, color: C.blue, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {typeof icon === "string" && /^[a-z]+$/.test(icon) ? <Icon name={icon} size={28} /> : icon}
      </div>
      <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700 }}>{title}</div>
      {body && <p style={{ margin: "4px auto 0", fontSize: 12.5, color: C.muted, lineHeight: 1.5, maxWidth: 290 }}>{body}</p>}
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
  return <div style={{ height: h, borderRadius: r, background: "linear-gradient(90deg,#EEF3FA 25%,#F5F9FF 50%,#EEF3FA 75%)", backgroundSize: "200% 100%", animation: "tkShimmer 1.2s infinite" }} />;
}

export function AiLabel({ dark }: { dark?: boolean }) {
  return <span style={{ fontSize: 10.5, color: dark ? "rgba(255,255,255,.7)" : C.faint }}>AI-generated · cek detail penting dengan mentor atau guru</span>;
}

export function Note({ children, onClick, tone = "blue", icon }: { children: ReactNode; onClick?: () => void; tone?: "blue" | "green" | "yellow"; icon?: string }) {
  const bg = tone === "green" ? C.tintGreen : tone === "yellow" ? C.tintYellow : C.tintBlue;
  const fg = tone === "green" ? C.greenDark : tone === "yellow" ? "#7A5200" : "#1E3A8A";
  return (
    <div onClick={onClick} style={{ background: bg, borderRadius: 16, padding: "12px 14px", fontSize: 12.5, color: fg, lineHeight: 1.5, cursor: onClick ? "pointer" : undefined, display: "flex", gap: 10, alignItems: "flex-start" }}>
      {icon && <span style={{ color: tone === "blue" ? C.blue : fg, display: "flex", flex: "none" }}><Icon name={icon} size={18} /></span>}
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

/** Kartu daftar v3: gambar/ikon kiri, teks, chevron. */
export function ListCard({ img, imgW = 84, imgH = 72, icon, iconBg, iconColor, kicker, title, sub, right, onClick, style }: {
  img?: string | null; imgW?: number; imgH?: number; icon?: string; iconBg?: string; iconColor?: string; kicker?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void; style?: CSSProperties;
}) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center",
      cursor: onClick ? "pointer" : "default", boxShadow: SH.card, fontFamily: "inherit", color: C.text, ...style }}>
      {img !== undefined ? <ImgBox src={img} w={imgW} h={imgH} r={13} />
        : icon ? <span style={{ width: 46, height: 46, borderRadius: 14, background: iconBg ?? C.tintBlue, color: iconColor ?? C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginLeft: 4 }}><Icon name={icon} size={22} /></span> : null}
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        {kicker}
        <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{title}</span>
        {sub && <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{sub}</span>}
      </span>
      {right ?? (onClick && <span style={{ color: C.faint, display: "flex", marginRight: 4 }}><Icon name="chev" size={18} /></span>)}
    </button>
  );
}

/** Ubin statistik kecil (3 kolom di profil/portofolio). */
export function Stat({ value, label, sub, icon, color = C.blue }: { value: ReactNode; label: ReactNode; sub?: ReactNode; icon?: string; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 12, boxShadow: SH.card, textAlign: icon ? "left" : "center" }}>
      {icon && <span style={{ color, display: "flex" }}><Icon name={icon} size={20} /></span>}
      {icon && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{label}</div>}
      <div style={{ fontSize: icon ? 19 : 20, fontWeight: 700 }}>{value}</div>
      {!icon && <div style={{ fontSize: 11, color: C.muted }}>{label}</div>}
      {sub && <div style={{ fontSize: 10.5, color: C.muted }}>{sub}</div>}
    </div>
  );
}

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({ left: 4 + (i * 7) % 92, w: 6 + (i % 3) * 2, h: 9 + (i % 2) * 4,
  color: ["#FFD146", "#0066FF", "#5CE0A1", "#A78BFA", "#F472B6"][i % 5], dur: 1.8 + (i % 4) * 0.4, delay: (i % 6) * 0.18 }));
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
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "tkFade .2s ease both" }}>
      <div onClick={e => e.stopPropagation()} className="tk-sheet" style={{ width: "100%", maxWidth: 560, maxHeight: "86%", overflow: "auto", background: "#fff", borderRadius: "26px 26px 0 0", padding: "16px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)", animation: "tkFadeUp .25s ease both" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.disabled, margin: "0 auto 14px" }} />
        {title && <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export const GLOBAL_CSS = `
@keyframes tkIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes tkFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes tkPop{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
@keyframes tkFade{from{opacity:0}to{opacity:1}}
@keyframes tkSpin{to{transform:rotate(360deg)}}
@keyframes tkShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes tkToast{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes tkConfetti{0%{transform:translateY(-16px) rotate(0);opacity:1}100%{transform:translateY(260px) rotate(400deg);opacity:0}}
.tk-app{font-family:'Poppins',system-ui,sans-serif;color:#0F172A}
.tk-app *{box-sizing:border-box;scrollbar-width:none}
.tk-app button,.tk-app input,.tk-app textarea,.tk-app select{font-family:inherit}
.tk-app input::placeholder,.tk-app textarea::placeholder{color:#94A3B8}
.tk-app ::-webkit-scrollbar{width:0;height:0;display:none}
.tk-app button{-webkit-tap-highlight-color:transparent}
.tk-app button:active{transform:scale(.98)}
.tk-app :focus-visible{outline:2.5px solid #0066FF;outline-offset:2px}
@media (prefers-reduced-motion: reduce){.tk-app *{animation:none!important;transition:none!important}}
@media (pointer:coarse){.tk-app input,.tk-app textarea,.tk-app select{font-size:16px!important}}
@media (min-width:600px){.tk-onb-screen{padding-left:max(0px,calc((100% - 560px) / 2))!important;padding-right:max(0px,calc((100% - 560px) / 2))!important}.tk-onb-pad{padding-left:max(22px,calc((100% - 516px) / 2))!important;padding-right:max(22px,calc((100% - 516px) / 2))!important}.tk-onb-img>span{background-position:center!important}}
@media (max-height:620px){.tk-onb-screen{overflow-y:auto!important}.tk-onb-screen>*{flex-shrink:0!important}.tk-onb-screen>div[style*="flex: 1"]{flex-basis:auto!important;overflow:visible!important}.tk-onb-img{min-height:220px!important}}
.tk-side .tk-screen{padding-left:max(0px,calc((100% - 760px) / 2));padding-right:max(0px,calc((100% - 760px) / 2))}
.tk-side .tk-screen.tk-tabpad{padding-bottom:48px!important}
.tk-side .tk-sheet{border-radius:26px 26px 0 0}
.tk-side *{scrollbar-width:thin;scrollbar-color:#CFE3FF transparent}
.tk-side ::-webkit-scrollbar{display:block;width:8px;height:6px}
.tk-side ::-webkit-scrollbar-thumb{background:#CFE3FF;border-radius:99px}
.tk-side button{cursor:pointer}
.tk-nav-item:hover{background:#F1F6FD}
.tk-dark img,.tk-dark video,.tk-dark iframe,.tk-dark canvas,.tk-dark [role=img]{filter:invert(1) hue-rotate(180deg)}
.tk-reduce *{animation:none!important;transition:none!important}
@media (min-width:1100px){.tk-side .tk-grid2{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.tk-side .tk-grid2>:only-child{grid-column:1 / -1}}
`;
