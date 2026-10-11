/**
 * Token desain Talentika Mobile — nilai dari prototype v3 (handoff 2026-10-11).
 */
export const C = {
  // Token v3 (design-handoff "Talentika Mobile App v3") — nama kunci tetap agar semua layar ikut berubah
  blue: "#0066FF",
  blueDark: "#0052CC",
  orange: "#D97706",
  orangeDark: "#B45309",
  yellow: "#FFD146",
  gold: "#B7791F",
  navy: "#0F172A",
  green: "#16A34A",
  greenDark: "#15803D",
  red: "#E11D48",
  purple: "#7C3AED",
  sky: "#0891B2",
  teal: "#0D9488",
  cyan: "#00C6EF",
  amber: "#F59E0B",
  bg: "#F5F9FF",
  line: "#E2EAF5",
  track: "#EEF3FA",
  subtle: "#F8FBFF",
  soft: "#F1F6FD",
  text: "#0F172A",
  text2: "#334155",
  text3: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  disabled: "#CBD5E1",
  tintBlue: "#EAF4FF",
  tintOrange: "#FFF6DB",
  tintYellow: "#FFF6DB",
  tintGreen: "#E7F8EE",
  tintPurple: "#F1EAFE",
  tintSky: "#E0F7FD",
  tintRed: "#FDECEF",
  tintTeal: "#DDF7F2",
  lightBlue: "#D6E6FF",
  mint: "#5CE0A1",
};

export const F = {
  display: "'Poppins', system-ui, sans-serif",
  body: "'Poppins', system-ui, sans-serif",
  mono: "ui-monospace, Menlo, monospace",
};

export const SH = {
  card: "0 4px 16px rgba(15,23,42,.05)",
  cardSm: "0 2px 10px rgba(15,23,42,.05)",
  btn: "0 2px 10px rgba(15,23,42,.08)",
  chip: "0 2px 8px rgba(15,23,42,.05)",
  primary: "0 12px 26px rgba(0,102,255,.3)",
  primarySm: "0 10px 22px rgba(0,102,255,.28)",
  orange: "0 10px 24px rgba(255,106,0,.32)",
  orangeSm: "0 8px 20px rgba(255,106,0,.3)",
};

/** Warna status deadline: merah ≤3 hari, oranye ≤10 hari, hijau >10 hari (HOME-05). */
export function deadlineColor(days: number | null) {
  if (days === null) return { c: C.muted, bg: C.track };
  if (days < 0) return { c: C.faint, bg: C.track };
  if (days <= 3) return { c: C.red, bg: C.tintRed };
  if (days <= 10) return { c: C.orange, bg: C.tintOrange };
  return { c: C.green, bg: C.tintGreen };
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

/** Palet avatar inisial — dipilih stabil dari nama. */
const AVA = [
  [C.tintBlue, C.blueDark], [C.tintOrange, C.orangeDark], [C.tintGreen, C.green],
  [C.tintPurple, C.purple], [C.tintYellow, C.gold], [C.tintSky, C.sky],
];
export function avatarColors(seed: string) {
  let h = 0;
  for (const ch of seed || "?") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVA[h % AVA.length];
}

export const rp = (n: number) => "Rp" + Math.round(n).toLocaleString("id-ID");
export const rpShort = (n: number) =>
  n >= 1_000_000 ? `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
  : n % 1000 === 0 ? `Rp${(n / 1000).toLocaleString("id-ID")}rb` : rp(n);
