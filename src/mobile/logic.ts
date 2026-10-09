import { C } from "./theme";

/* Logika domain murni (tanpa IO): Talent DNA, kecocokan karier, kecocokan peluang. */

export type AxisKey = "analytical" | "creative" | "leadership" | "technology" | "communication";
export type Axes = Record<AxisKey, number>;

export const AXES: { key: AxisKey; name: string; nameId: string; short: string; color: string }[] = [
  { key: "analytical", name: "Analytical", nameId: "Analitis", short: "Analytical", color: C.blue },
  { key: "creative", name: "Creative", nameId: "Kreatif", short: "Creative", color: C.orange },
  { key: "leadership", name: "Leadership", nameId: "Kepemimpinan", short: "Leadership", color: C.purple },
  { key: "technology", name: "Technology", nameId: "Teknologi", short: "Technology", color: C.green },
  { key: "communication", name: "Communication", nameId: "Komunikasi", short: "Comm.", color: C.gold },
];

export const MODULES: { key: string; n: string; name: string; nameId: string; q: string; qEn: string }[] = [
  { key: "interest", n: "01", name: "Interest Discovery", nameId: "Interest Discovery", q: "Apa yang kamu sukai?", qEn: "What do you enjoy?" },
  { key: "strength", n: "02", name: "Strength Discovery", nameId: "Strength Discovery", q: "Apa yang secara alami kamu kuasai?", qEn: "What are you naturally good at?" },
  { key: "aptitude", n: "03", name: "Aptitude", nameId: "Aptitude", q: "Logika, numerik, verbal, spasial & problem solving", qEn: "Logical, numerical, verbal, spatial & problem solving" },
  { key: "personality", n: "04", name: "Personality", nameId: "Personality", q: "RIASEC, Big Five & preferensi perilaku", qEn: "RIASEC, Big Five & behavioral preferences" },
  { key: "learning_style", n: "05", name: "Learning Style", nameId: "Learning Style", q: "Format belajar, tempo & preferensi latihan", qEn: "Learning format, pace & practice preferences" },
  { key: "career_interest", n: "06", name: "Career Interest", nameId: "Career Interest", q: "Industri & profesi", qEn: "Industries & professions" },
  { key: "future_skills", n: "07", name: "Future Skills", nameId: "Future Skills", q: "Kemampuan yang dibutuhkan masa depan", qEn: "Skills the future needs" },
  { key: "values", n: "08", name: "Values", nameId: "Values", q: "Dampak, penghasilan, kreativitas, stabilitas, kepemimpinan…", qEn: "Impact, income, creativity, stability, leadership…" },
];

const AXIS_WORD: Record<AxisKey, string> = {
  analytical: "Problem Solver", creative: "Creator", leadership: "Leader", technology: "Builder", communication: "Connector",
};

const ARCHETYPE: Record<AxisKey, { name: string; icon: string; bg: string; desc: string; descEn: string }> = {
  technology: { name: "Technology Builder", icon: "🛠️", bg: C.tintBlue, desc: "Kamu senang mengubah ide jadi sistem atau produk yang benar-benar jalan.", descEn: "You love turning ideas into systems or products that actually work." },
  creative: { name: "Creative Problem Solver", icon: "💡", bg: C.tintOrange, desc: "Kamu mencari cara baru saat solusi biasa nggak berhasil.", descEn: "You look for new ways when the usual solutions don't work." },
  leadership: { name: "Future Entrepreneur", icon: "🚀", bg: C.tintGreen, desc: "Kamu melihat peluang dan berani menggerakkan orang untuk mewujudkannya.", descEn: "You spot opportunities and rally people to make them happen." },
  analytical: { name: "Young Researcher", icon: "🔬", bg: C.tintPurple, desc: "Kamu penasaran pada 'kenapa' dan menikmati menggali data sampai tuntas.", descEn: "You are curious about 'why' and enjoy digging into data." },
  communication: { name: "Social Connector", icon: "🤝", bg: C.tintYellow, desc: "Kamu kuat membangun hubungan dan membantu orang lain berkembang.", descEn: "You build relationships and help others grow." },
};

export function rankAxes(axes: Partial<Axes> | null | undefined): AxisKey[] {
  if (!axes) return [];
  return (Object.keys(axes) as AxisKey[]).filter(k => typeof axes[k] === "number").sort((a, b) => (axes[b] ?? 0) - (axes[a] ?? 0));
}

/** "Explorer • Builder • Problem Solver" — Explorer untuk profil yang masih awal (<4 modul). */
export function dnaTitle(axes: Partial<Axes> | null | undefined, modulesDone: number): string | null {
  const r = rankAxes(axes);
  if (!r.length) return null;
  const words = r.slice(0, modulesDone < 4 ? 2 : 3).map(k => AXIS_WORD[k]);
  return (modulesDone < 4 ? ["Explorer", ...words] : words).join(" • ");
}

export function archetypes(axes: Partial<Axes> | null | undefined) {
  return rankAxes(axes).slice(0, 3).map(k => ARCHETYPE[k]);
}

/** Career Fit % = bobot karier × sumbu siswa (0–100), dikalibrasi ke 30–98. */
export function careerFit(axes: Partial<Axes> | null | undefined, careerAxes: Record<string, number> | null | undefined): number | null {
  if (!axes || !careerAxes) return null;
  let s = 0, w = 0;
  for (const [k, wt] of Object.entries(careerAxes)) {
    const v = (axes as any)[k];
    if (typeof v === "number") { s += v * wt; w += wt; }
  }
  if (!w) return null;
  return Math.max(30, Math.min(98, Math.round((s / w) * 0.85 + 12)));
}

/** Titik radar 5 sumbu (sama dengan prototype: pusat 110, r=80). */
export function radarPoints(vals: number[], r = 80) {
  return vals.map((v, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180, rr = (v / 100) * r;
    return `${(110 + rr * Math.cos(a)).toFixed(1)},${(110 + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/* ── Peluang ──────────────────────────────────────────────────────────── */

export type OppType = "Scholarship" | "Competition" | "Internship" | "Global" | "Research" | "Bootcamp";
export const TYPEC: Record<OppType, [string, string]> = {
  Competition: [C.tintBlue, C.blueDark], Scholarship: [C.tintYellow, C.gold], Research: [C.tintPurple, C.purple],
  Global: [C.tintGreen, C.green], Bootcamp: [C.tintSky, C.sky], Internship: [C.tintOrange, C.orangeDark],
};
export const TYPE_ID: Record<OppType, string> = {
  Scholarship: "Beasiswa", Competition: "Kompetisi", Internship: "Magang", Global: "Global", Research: "Riset", Bootcamp: "Bootcamp",
};

export function oppTypeOf(raw?: string | null, title = ""): OppType {
  const t = (raw || "").toLowerCase();
  if (t.startsWith("beasiswa")) return "Scholarship";
  if (t === "kompetisi" || t === "hackathon") return /riset|research|ilmiah|lkti/i.test(title) ? "Research" : "Competition";
  if (t === "magang" || t === "lowongan_kerja") return "Internship";
  if (["pertukaran", "konferensi", "fellowship"].includes(t)) return "Global";
  if (t === "riset") return "Research";
  if (["workshop", "program", "grant"].includes(t)) return "Bootcamp";
  return /beasiswa|scholarship/i.test(title) ? "Scholarship" : "Competition";
}

const TUJUAN_TYPES: Record<string, OppType[]> = {
  kuliah: ["Scholarship", "Global", "Research"],
  kerja: ["Internship", "Bootcamp"],
  wirausaha: ["Competition", "Bootcamp"],
};

const FIELD_WORDS: Record<string, string[]> = {
  Technology: ["teknologi", "technology", "ai", "data", "coding", "software", "it ", "digital", "programming", "hackathon"],
  "Technology & Business": ["product", "bisnis", "business", "teknologi", "startup"],
  "Creative Technology": ["desain", "design", "ux", "kreatif", "creative", "media"],
  Sustainability: ["energi", "energy", "iklim", "climate", "lingkungan", "environment", "sustainab"],
  Kesehatan: ["kesehatan", "health", "medis", "kedokteran", "biologi"],
  "Kesehatan & Sosial": ["psikologi", "kesehatan mental", "sosial", "social"],
  Pendidikan: ["pendidikan", "education", "guru", "mengajar"],
  Entrepreneurship: ["wirausaha", "bisnis", "startup", "business", "entrepreneur"],
  STEM: ["sains", "science", "olimpiade", "robot", "engineering", "teknik", "stem"],
};

export const DEFAULT_DOCS: Record<OppType, string[]> = {
  Scholarship: ["Rapor / transkrip nilai", "Esai motivasi", "Surat rekomendasi guru", "Sertifikat prestasi"],
  Competition: ["Proposal atau ide solusi", "Video pitch singkat", "Surat keterangan siswa"],
  Internship: ["CV", "Portofolio", "Surat lamaran"],
  Global: ["Paspor", "Surat izin orang tua", "Esai singkat"],
  Research: ["Abstrak penelitian", "Surat rekomendasi guru", "Kartu pelajar"],
  Bootcamp: ["CV", "Esai motivasi"],
};

export function docsFor(o: { requirements?: string[] | null; type: OppType }): string[] {
  const req = (o.requirements || []).map(s => s.trim()).filter(s => s.length > 2 && s.length < 90);
  return req.length ? req.slice(0, 6) : DEFAULT_DOCS[o.type];
}

export interface MatchCtx { axes?: Partial<Axes> | null; tujuan?: string | null; careerField?: string | null; careerName?: string | null; }

export function oppMatch(o: { title: string; description?: string | null; location?: string | null; type: OppType; quality_score?: number | null; opportunity_field?: string | null }, ctx: MatchCtx) {
  const why: string[] = [];
  let m = 55;
  const hay = `${o.title} ${o.description ?? ""} ${o.opportunity_field ?? ""}`.toLowerCase();
  if (ctx.tujuan && TUJUAN_TYPES[ctx.tujuan]?.includes(o.type)) { m += 14; why.push(ctx.tujuan === "kuliah" ? "Sesuai rencana kuliah" : ctx.tujuan === "kerja" ? "Sesuai rencana kerja" : "Sesuai rencana usaha"); }
  if (ctx.careerField && (FIELD_WORDS[ctx.careerField] || []).some(w => hay.includes(w))) { m += 12; why.push(`Relevan dengan ${ctx.careerName ?? ctx.careerField}`); }
  const top = rankAxes(ctx.axes)[0];
  if (top) {
    const fit: Partial<Record<AxisKey, OppType[]>> = {
      technology: ["Competition", "Bootcamp", "Internship"], analytical: ["Research", "Competition", "Scholarship"],
      leadership: ["Competition", "Global"], communication: ["Global", "Scholarship"], creative: ["Competition", "Bootcamp"],
    };
    if (fit[top]?.includes(o.type)) { m += 8; why.push(`${AXES.find(a => a.key === top)!.name} ${ctx.axes![top]}`); }
  }
  const loc = (o.location || "").toLowerCase();
  if (!loc || /online|indonesia|jakarta|daring|nasional/.test(loc)) { m += 4; if (why.length < 3) why.push(loc.includes("online") || loc.includes("daring") ? "Bisa diikuti online" : "Di Indonesia"); }
  if ((o.quality_score ?? 0) >= 70) m += 4;
  if (!why.length) why.push("Terbuka untuk pelajar");
  return { match: Math.max(50, Math.min(97, m)), why: why.slice(0, 3) };
}

/* ── Journey (HOME-03) ─────────────────────────────────────────────── */
export const JOURNEY = ["Discover", "Develop", "Build", "Achieve", "Opportunity"] as const;

export function greeting(lang: "id" | "en", d = new Date()) {
  const h = d.getHours();
  if (lang === "en") return h < 11 ? "Good morning" : h < 15 ? "Good afternoon" : h < 19 ? "Good evening" : "Good night";
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 19 ? "Selamat sore" : "Selamat malam";
}

export function fmtDate(iso?: string | null, lang: "id" | "en" = "id", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta", ...opts });
}

export function timeAgo(iso: string, lang: "id" | "en" = "id") {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const en = lang === "en";
  if (s < 60) return en ? "just now" : "baru saja";
  const m = Math.round(s / 60); if (m < 60) return en ? `${m} min ago` : `${m} menit lalu`;
  const h = Math.round(m / 60); if (h < 24) return en ? `${h} h ago` : `${h} jam lalu`;
  const d = Math.round(h / 24); if (d === 1) return en ? "yesterday" : "Kemarin";
  if (d < 30) return en ? `${d} days ago` : `${d} hari lalu`;
  return fmtDate(iso, lang);
}

/** Pemetaan action_url notifikasi lama (web) → rute aplikasi (NOT-03). */
export function deepLink(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/app")) return url;
  const map: [RegExp, string][] = [
    [/^\/opportunities/, "/app/opportunities"], [/^\/learning\/content\/([\w-]+)/, "/app/course/$1"], [/^\/learning/, "/app/learn"],
    [/^\/mentors/, "/app/mentors"], [/^\/community/, "/app/community"], [/^\/profile/, "/app/profile"], [/^\/portfolio/, "/app/portfolio"],
    [/^\/subscription/, "/app/pro"], [/^\/assessment/, "/app/dna"], [/^\/dashboard/, "/app/home"], [/^\/progress/, "/app/readiness"],
  ];
  for (const [re, to] of map) if (re.test(url)) return url.replace(re, to).replace(/\?.*$/, "");
  return null;
}

export const NOTIF_CATS = ["Semua", "Opportunities", "Learning", "Mentorship", "Achievement", "AI Insight", "Community"] as const;
export function notifCat(type?: string | null): (typeof NOTIF_CATS)[number] {
  const t = (type || "").toLowerCase();
  if (/opportun|deadline|peluang/.test(t)) return "Opportunities";
  if (/mentor/.test(t)) return "Mentorship";
  if (/achiev|challenge|badge|certificate|xp/.test(t)) return "Achievement";
  if (/ai|insight|recommend/.test(t)) return "AI Insight";
  if (/community|forum|reply|like/.test(t)) return "Community";
  return "Learning";
}
export const NOTIF_STYLE: Record<string, { icon: string; bg: string }> = {
  Opportunities: { icon: "⏰", bg: C.tintRed }, "AI Insight": { icon: "✦", bg: C.tintBlue }, Mentorship: { icon: "🤝", bg: C.tintGreen },
  Achievement: { icon: "💡", bg: C.tintYellow }, Learning: { icon: "📘", bg: C.tintBlue }, Community: { icon: "💬", bg: C.tintPurple },
};

export const READINESS_META: Record<string, { name: string; nameEn: string; color: string }> = {
  talent: { name: "Talent Clarity", nameEn: "Talent Clarity", color: C.blue },
  skill: { name: "Skill Readiness", nameEn: "Skill Readiness", color: C.green },
  experience: { name: "Experience", nameEn: "Experience", color: C.purple },
  portfolio: { name: "Portfolio", nameEn: "Portfolio", color: C.orange },
  achievement: { name: "Achievement", nameEn: "Achievement", color: C.gold },
  opportunity: { name: "Opportunity Readiness", nameEn: "Opportunity Readiness", color: C.sky },
};

export const JENJANG_OPTS = [
  { value: "smp", label: "Junior High", labelId: "SMP" },
  { value: "sma_smk", label: "Senior High", labelId: "SMA" },
  { value: "smk", label: "Vocational School", labelId: "SMK" },
  { value: "kuliah", label: "University", labelId: "Kuliah" },
  { value: "lulusan", label: "Graduate / Early Career", labelId: "Lulus / Awal karier" },
];
