/**
 * Gambar sampul v3 untuk data yang belum punya gambar sendiri.
 * Data asli (thumbnail_url, poster_url, foto mentor) selalu didahulukan.
 */
import kAi from "./assets/v3/k-ai.webp";
import kEnv from "./assets/v3/k-env.webp";
import kDesign from "./assets/v3/k-design.webp";
import kEntre from "./assets/v3/k-entre.webp";
import cRobot from "./assets/v3/c-robot.webp";
import cTurbines from "./assets/v3/c-turbines.webp";
import cHiker from "./assets/v3/c-hiker.webp";
import oppComp from "./assets/v3/opp-comp.webp";
import oppIntern from "./assets/v3/opp-intern.webp";
import oppScholar from "./assets/v3/opp-scholar.webp";
import rChallenge from "./assets/v3/r-challenge.webp";
import rIntern from "./assets/v3/r-intern.webp";
import aiHero from "./assets/v3/ai-hero.webp";
import pathHiker from "./assets/v3/path-hiker.webp";
import type { OppType } from "./logic";

export const IMG = { kAi, kEnv, kDesign, kEntre, cRobot, cTurbines, cHiker, oppComp, oppIntern, oppScholar, rChallenge, rIntern, aiHero, pathHiker };

function pick<T>(seed: string, arr: T[]): T {
  let h = 0;
  for (const ch of seed || "?") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

/** Bidang karier → ilustrasi. */
export function careerImg(field?: string | null, seed = "") {
  const f = (field || "").toLowerCase();
  if (/sustain|lingkungan|environment|energi/.test(f)) return kEnv;
  if (/creative|desain|design|kreatif/.test(f)) return kDesign;
  if (/entrepre|bisnis|business|wirausaha/.test(f)) return kEntre;
  if (/tech|teknologi|stem|data|ai/.test(f)) return kAi;
  return pick(seed || f, [kAi, kEnv, kDesign, kEntre]);
}

/** Peluang: poster asli bila ada, selain itu ilustrasi per jenis. */
export function oppImg(type: OppType, poster?: string | null, seed = "") {
  if (poster && /^https?:\/\//.test(poster)) return poster;
  switch (type) {
    case "Scholarship": return oppScholar;
    case "Competition": return oppComp;
    case "Internship": return oppIntern;
    case "Research": return rChallenge;
    case "Bootcamp": return rIntern;
    default: return pick(seed, [cHiker, oppComp, rChallenge]);
  }
}

/** Materi belajar: thumbnail asli bila ada, selain itu ilustrasi stabil per judul. */
export function courseImg(thumb?: string | null, seed = "") {
  if (thumb && /^https?:\/\//.test(thumb)) return thumb;
  return pick(seed, [cRobot, cTurbines, cHiker]);
}
