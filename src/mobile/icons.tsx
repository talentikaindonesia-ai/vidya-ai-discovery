import React, { CSSProperties } from "react";

/**
 * Set ikon garis Talentika Mobile v3 (sama persis dengan prototype handoff).
 * Format: path SVG, "cX,Y,R" = lingkaran, "rX,Y,W,H,RX" = persegi.
 */
const ICONS: Record<string, string[]> = {
  home: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  book: ["M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z", "M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"],
  folder: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  compass: ["c12,12,10", "M16.2 7.8 14 14l-6.2 2.2L10 10z"],
  user: ["c12,8,4", "M4 21a8 8 0 0 1 16 0"],
  bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  search: ["c11,11,7", "m20 20-4-4"],
  right: ["M5 12h14", "M13 6l6 6-6 6"],
  left: ["M19 12H5", "M11 18l-6-6 6-6"],
  chev: ["m9 6 6 6-6 6"],
  down: ["m6 9 6 6 6-6"],
  check: ["M5 12.5 10 17 19 7"],
  star: ["M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"],
  sparkle: ["M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z", "M19 3v4", "M17 5h4"],
  trophy: ["M8 21h8", "M12 17v4", "M7 4h10v5a5 5 0 0 1-10 0z", "M17 5h3v2a3 3 0 0 1-3 3", "M7 5H4v2a3 3 0 0 0 3 3"],
  cap: ["M2 9l10-5 10 5-10 5z", "M6 11v5c3 2 9 2 12 0v-5", "M22 9v6"],
  chart: ["M5 21V11", "M12 21V4", "M19 21v-7"],
  users: ["c9,8,4", "M2 21a7 7 0 0 1 14 0", "M16 4a4 4 0 0 1 0 8", "M22 21a7 7 0 0 0-4-6.3"],
  globe: ["c12,12,10", "M2 12h20", "M12 2a15 15 0 0 1 0 20", "M12 2a15 15 0 0 0 0 20"],
  rocket: ["M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2", "M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5z", "M9 10l-4 1-2 3 4 1", "M14 15l-1 4-3 2-1-4"],
  bulb: ["M9 18h6", "M10 22h4", "M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"],
  cpu: ["r6,6,12,12,2", "M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"],
  leaf: ["M11 20A7 7 0 0 1 4 13c0-6 6-10 16-10 0 10-4 16-9 17z", "M4 21c4-5 8-8 12-10"],
  puzzle: ["M14 4a2 2 0 1 0-4 0H6v4a2 2 0 1 0 0 4v4h4a2 2 0 1 0 4 0h4v-4a2 2 0 1 0 0-4V4z"],
  cal: ["r3,5,18,16,2", "M3 10h18", "M8 3v4", "M16 3v4"],
  clock: ["c12,12,9", "M12 7v5l3 2"],
  pin: ["M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z", "c12,10,2.5"],
  bookmark: ["M6 3h12v18l-6-4-6 4z"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
  upload: ["M12 16V4", "M6 10l6-6 6 6", "M4 20h16"],
  download: ["M12 4v12", "M6 10l6 6 6-6", "M4 20h16"],
  msg: ["M4 5h16v11H8l-4 4z"],
  send: ["M4 12 20 4l-6 16-3-7z"],
  flame: ["M12 22a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-3 5-3 8a6 6 0 0 0 6 6z"],
  lock: ["r5,11,14,10,2", "M8 11V7a4 4 0 0 1 8 0v4"],
  target: ["c12,12,9", "c12,12,5", "c12,12,1"],
  brief: ["r3,7,18,13,2", "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M3 13h18"],
  gear: ["c12,12,3", "M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"],
  play: ["M7 4l13 8-13 8z"],
  heart: ["M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"],
  sliders: ["M4 6h16", "M7 12h10", "M10 18h4"],
  plus: ["M12 5v14", "M5 12h14"],
  file: ["M6 2h8l5 5v15H6z", "M14 2v5h5"],
  video: ["r3,6,13,12,2", "M16 10l5-3v10l-5-3z"],
  link: ["M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1", "M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"],
  image: ["r3,4,18,16,2", "c9,10,2", "M21 16l-5-5-9 9"],
  x: ["M6 6l12 12", "M18 6 6 18"],
  medal: ["c12,9,6", "M8.5 14 7 22l5-3 5 3-1.5-8"],
  pencil: ["M4 20h4L19 9l-4-4L4 16z"],
  share: ["c18,5,3", "c6,12,3", "c18,19,3", "M8.6 13.5l6.8 4", "M15.4 6.5l-6.8 4"],
  school: ["M3 21h18", "M5 21V10l7-5 7 5v11", "M10 21v-5h4v5"],
  pause: ["M8 5v14", "M16 5v14"],
  mail: ["r3,5,18,14,2", "m3 7 9 6 9-6"],
  eye: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "c12,12,3"],
  phone: ["r6,2,12,20,3", "M11 18h2"],
  logout: ["M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3", "M10 17l-5-5 5-5", "M5 12h11"],
  trash: ["M4 7h16", "M10 11v6", "M14 11v6", "M6 7l1 13h10l1-13", "M9 7V4h6v3"],
  info: ["c12,12,9", "M12 11v5", "M12 8h.01"],
  wallet: ["r3,6,18,14,2", "M3 10h18", "M16 15h2"],
  refresh: ["M20 11a8 8 0 0 0-14-5l-2 2", "M4 4v4h4", "M4 13a8 8 0 0 0 14 5l2-2", "M20 20v-4h-4"],
  filter: ["M3 5h18l-7 8v6l-4 2v-8z"],
  layers: ["M12 3 2 8l10 5 10-5z", "M2 13l10 5 10-5", "M2 18l10 5 10-5"],
};

export type IconName = keyof typeof ICONS | string;

export function Icon({ name, size = 20, filled, color, strokeWidth, style }: { name: IconName; size?: number; filled?: boolean; color?: string; strokeWidth?: number; style?: CSSProperties }) {
  const kids = (ICONS[name] || []).map((d, i) => {
    if (d[0] === "c" && /^c[\d.]/.test(d)) { const [cx, cy, r] = d.slice(1).split(",").map(Number); return <circle key={i} cx={cx} cy={cy} r={r} />; }
    if (d[0] === "r" && /^r[\d.]/.test(d)) { const [x, y, w, h, rx] = d.slice(1).split(",").map(Number); return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />; }
    return <path key={i} d={d} />;
  });
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={strokeWidth ?? (filled ? 1.2 : 2)} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "none", color, ...style }}>{kids}</svg>
  );
}
