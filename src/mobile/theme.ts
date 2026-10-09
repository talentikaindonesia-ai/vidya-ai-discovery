/**
 * Token desain Talentika Mobile (PRD §13) — nilai persis dari prototype v2.
 */
export const C = {
  blue: "#1D4ED8",
  blueDark: "#1E40AF",
  orange: "#FF6A00",
  orangeDark: "#C04400",
  yellow: "#FFC107",
  gold: "#A47000",
  navy: "#0B1D3A",
  green: "#16A34A",
  greenDark: "#0F7A3E",
  red: "#DC2626",
  purple: "#7C3AED",
  sky: "#0369A1",
  bg: "#F5F7FA",
  line: "#E6EAF0",
  track: "#EEF1F6",
  subtle: "#F8FAFC",
  text: "#0B1D3A",
  text2: "#334155",
  text3: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  disabled: "#CBD5E1",
  tintBlue: "#E8F1FF",
  tintOrange: "#FFEDE2",
  tintYellow: "#FFF6E0",
  tintGreen: "#E6F7EF",
  tintPurple: "#F0E8FF",
  tintSky: "#E0F2FE",
  tintRed: "#FDECEC",
  lightBlue: "#A9C5FF",
  mint: "#5CE0A1",
};

export const F = {
  display: "'Poppins', sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "ui-monospace, Menlo, monospace",
};

export const SH = {
  card: "0 4px 16px rgba(11,29,58,.06)",
  cardSm: "0 3px 12px rgba(11,29,58,.05)",
  btn: "0 2px 8px rgba(11,29,58,.08)",
  chip: "0 2px 8px rgba(11,29,58,.05)",
  primary: "0 10px 24px rgba(29,78,216,.3)",
  primarySm: "0 8px 20px rgba(29,78,216,.28)",
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
