import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Search, MapPin, Trophy, Briefcase, GraduationCap, Building2,
  ExternalLink, Globe, Star, Clock, Gift, Bookmark, ChevronLeft, ChevronRight, Mic, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { BookmarkButton } from "@/components/dashboard/BookmarkButton";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { ambilIdentitas, JENIS_UNTUK_TUJUAN, LABEL_TUJUAN, type IdentitasSiswa } from "@/hooks/useIdentitasSiswa";
import { UpgradeGate } from "@/components/payment/UpgradeGate";
import { useHargaMulai } from "@/hooks/usePaketLangganan";

// ─── Types ───────────────────────────────────────────────────────────────────
type OpportunityCategory = 'beasiswa' | 'kompetisi' | 'magang' | 'lowongan_kerja' | 'konferensi';

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityCategory;
  category: string;
  location: string;
  description: string;
  link: string;
  deadline?: string;
  poster_url?: string;
  source_website: string;
  created_at: string;
  tags: string[];
  regionScore: number;
  source_tier: number;
  last_verified_at?: string | null;
  opportunity_field?: string | null;
  quality_score?: number | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SEA_KEYWORDS = [
  'indonesia', 'malaysia', 'singapore', 'singapura', 'thailand', 'philippines', 'filipina',
  'vietnam', 'myanmar', 'cambodia', 'kamboja', 'laos', 'brunei', 'timor', 'asean', 'sea',
  'southeast asia', 'asia tenggara',
];

// gradient pairs: [from, to] — used to build the card header background
const GRADIENT_COLORS: Record<OpportunityCategory, [string, string]> = {
  beasiswa:       ["#3B82F6", "#1D4ED8"],
  kompetisi:      ["#A855F7", "#7E22CE"],
  magang:         ["#FB923C", "#EA580C"],
  lowongan_kerja: ["#22C55E", "#15803D"],
  konferensi:     ["#EC4899", "#E11D48"],
};

// type-pill text colours (category foreground)
const TYPE_FG: Record<OpportunityCategory, string> = {
  beasiswa:       "#1D4ED8",
  kompetisi:      "#7E22CE",
  magang:         "#EA580C",
  lowongan_kerja: "#15803D",
  konferensi:     "#E11D48",
};

// RIASEC → opportunity keywords for personalized match-score
/* ─── Match Score ───────────────────────────────────────────────────────────
   DIPERBAIKI 2026-08-29. Versi lama mencocokkan SUBSTRING, bukan kata:
     "it"  (realistic) cocok dengan commun·it·y / dig·it·al / univers·it·y
           → 453 dari 534 peluang dianggap "cocok"
     "art" (artistic)  cocok dengan st·art / p·art·icipate / qu·art·er
     "beasiswa" (investigative) cocok dengan hampir semua beasiswa
   Akibatnya siswa Realistic melihat badge "cocok" di 85% papan — angka yang
   tidak bermakna, dan kemungkinan besar sebabnya baru 1 orang pernah menyimpan.

   Sekarang: sinyal utama = `opportunity_field` (terstruktur, tak bisa salah
   tangkap), kata kunci hanya pendukung dengan BATAS KATA. Bila buktinya lemah,
   kembalikan 0 → badge disembunyikan. Lebih baik diam daripada mengarang. */
const RIASEC_FIELDS: Record<string, string[]> = {
  realistic:     ["teknologi", "lingkungan"],
  investigative: ["sains_riset", "teknologi", "kesehatan"],
  artistic:      ["seni_kreatif", "media_komunikasi"],
  social:        ["sosial_kemanusiaan", "pendidikan", "kesehatan"],
  enterprising:  ["bisnis", "keuangan", "hukum_politik"],
  conventional:  ["keuangan", "bisnis", "teknologi"],
};

const RIASEC_OPP_KW: Record<string, string[]> = {
  realistic:     ["teknik", "engineering", "robotik", "robotics", "manufaktur", "konstruksi", "otomotif"],
  investigative: ["riset", "research", "penelitian", "sains", "science", "laboratorium", "olimpiade", "olympiad"],
  artistic:      ["desain", "design", "seni", "kreatif", "creative", "film", "musik", "fotografi", "animasi"],
  social:        ["sosial", "social", "relawan", "volunteer", "mengajar", "teaching", "komunitas", "community", "psikologi"],
  enterprising:  ["wirausaha", "entrepreneur", "startup", "bisnis", "business", "marketing", "kepemimpinan", "leadership"],
  conventional:  ["akuntansi", "accounting", "keuangan", "finance", "administrasi", "audit", "perbankan", "banking"],
};

/** Cocokkan sebagai KATA UTUH, bukan potongan di tengah kata lain. */
const hasWord = (hay: string, kw: string) =>
  new RegExp(`(^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(hay);

const riasecMatchPct = (
  opp: { title: string; description: string; tags: string[]; opportunity_field?: string | null },
  type: string | null,
): number => {
  if (!type) return 0;

  // 1) Sinyal terstruktur — paling andal
  const fields = RIASEC_FIELDS[type] ?? [];
  const idx = fields.indexOf(opp.opportunity_field ?? "");
  let score = idx === 0 ? 70 : idx > 0 ? 60 : 0;

  // 2) Kata kunci sebagai penguat saja (maks +24)
  const hay = `${opp.title} ${opp.description} ${(opp.tags || []).join(" ")}`.toLowerCase();
  const hits = (RIASEC_OPP_KW[type] ?? []).filter(k => hasWord(hay, k)).length;
  score += Math.min(hits, 3) * 8;

  // Bukti tidak cukup → jangan tampilkan skor sama sekali
  return score >= 70 ? Math.min(95, score) : 0;
};

/**
 * Kecocokan terhadap KODE HOLLAND 3 huruf, bukan satu huruf.
 *
 * 42% hasil tes punya selisih peringkat 1–2 hanya ≤2 poin, jadi memakai satu
 * huruf saja membuang separuh minat siswa yang sebenarnya sama kuat. Huruf
 * kedua dan ketiga tetap dihitung, hanya dengan bobot lebih rendah supaya
 * huruf utama tetap yang menentukan arah.
 */
const BOBOT_HOLLAND = [1, 0.75, 0.55];
const cocokIdentitas = (
  opp: { title: string; description: string; tags: string[]; opportunity_field?: string | null },
  ident: IdentitasSiswa | null,
  fallbackType: string | null,
): number => {
  if (!ident) return riasecMatchPct(opp, fallbackType);
  const tipe = [ident.tipeUtama, ident.tipeKedua, ident.tipeKetiga];
  let terbaik = 0;
  tipe.forEach((t, i) => {
    if (!t) return;
    const skor = riasecMatchPct(opp, t) * BOBOT_HOLLAND[i];
    if (skor > terbaik) terbaik = skor;
  });
  // Ambang 70 sudah diterapkan per-huruf di riasecMatchPct; setelah dibobot,
  // huruf pendukung bisa turun di bawahnya — itu memang maksudnya, badge hanya
  // muncul kalau buktinya cukup kuat.
  return terbaik >= 50 ? Math.round(terbaik) : 0;
};

// Multiple Intelligence → opportunity keywords (secondary persona signal)
const MI_OPP_KW: Record<string, string[]> = {
  linguistic:    ["writing", "essay", "journalism", "menulis", "debat", "debate", "language", "bahasa", "penulisan"],
  logical:       ["data", "science", "math", "riset", "research", "analytics", "statistik", "olimpiade", "stem"],
  spatial:       ["design", "desain", "art", "seni", "arsitektur", "visual", "film", "fotografi", "animation"],
  musical:       ["music", "musik", "band", "choir", "komposisi"],
  kinesthetic:   ["sport", "olahraga", "atlet", "dance", "tari", "culinary", "chef"],
  interpersonal: ["leadership", "volunteer", "relawan", "community", "komunitas", "exchange", "delegate", "sosial"],
  intrapersonal: ["entrepreneur", "wirausaha", "startup", "research", "fellowship", "self"],
  naturalistic:  ["environment", "lingkungan", "climate", "iklim", "agriculture", "pertanian", "sustainability", "conservation", "biology"],
};
const miMatchPct = (opp: { title: string; description: string; tags: string[] }, miType: string | null): number => {
  if (!miType) return 0;
  const kw = MI_OPP_KW[miType] || [];
  const hay = `${opp.title} ${opp.description} ${(opp.tags || []).join(" ")}`.toLowerCase();
  let hits = 0;
  kw.forEach(k => { if (hay.includes(k)) hits++; });
  return hits === 0 ? 0 : Math.min(90, 55 + hits * 12);
};

// ── Matching & Ranking Engine v2 ──
// persona = RIASEC ∨ MI ∨ perilaku bookmark; final menambah bobot region (target market ID/ASEAN)
// final = 0.40×persona + 0.20×credibility + 0.20×urgency + 0.10×recency + 0.10×region
interface PersonaSignals {
  riasecType: string | null;
  miType: string | null;
  savedCats: Set<string>;
  identitas: IdentitasSiswa | null;
}

/**
 * Kecocokan terhadap TUJUAN siswa (kuliah / kerja / wirausaha).
 *
 * Ini penyaring yang lebih kuat daripada tipe kepribadian: siswa kelas 12 yang
 * mengejar beasiswa dan lulusan yang mencari kerja tidak seharusnya melihat
 * papan yang sama meski sama-sama bertipe Sosial.
 *
 * Dipakai untuk MENGURUTKAN, bukan menyembunyikan — pelajaran dari papan yang
 * pernah tampak kosong karena disaring terlalu ketat.
 */
const cocokTujuan = (opp: Opportunity, ident: IdentitasSiswa | null): number => {
  if (!ident?.tujuan || ident.tujuan === "belum_yakin") return 0.5; // netral
  const jenis = JENIS_UNTUK_TUJUAN[ident.tujuan] ?? [];
  if (jenis.length === 0) return 0.5;
  return jenis.includes(opp.type) ? 1 : 0.25;
};
const credScore = (tier: number) => (tier === 1 ? 1 : tier === 2 ? 0.6 : 0.3);
const urgencyScore = (deadline?: string): number => {
  if (!deadline) return 0.3;
  const d = Math.floor((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return 0;
  if (d <= 7) return 1;
  if (d <= 14) return 0.8;
  if (d <= 30) return 0.6;
  return 0.4;
};
const recencyScore = (created: string): number => {
  const d = (Date.now() - new Date(created).getTime()) / 86400000;
  return d <= 3 ? 1 : d <= 7 ? 0.8 : d <= 30 ? 0.5 : 0.2;
};
const personaScore = (opp: Opportunity, sig: PersonaSignals): number => {
  // Kode Holland 3 huruf, bukan satu huruf — lihat cocokIdentitas()
  const base = Math.max(
    cocokIdentitas(opp, sig.identitas, sig.riasecType),
    0.9 * miMatchPct(opp, sig.miType),
  ) / 100;
  const behavior = sig.savedCats.has(opp.type) ? 0.1 : 0; // user tends to save this category
  return Math.min(1, base + behavior);
};
const finalScore = (opp: Opportunity, sig: PersonaSignals): number => {
  const region = getRegionScore(opp.location, opp.tags).score / 3; // 0 | .67 | 1
  // Region diperberat (target market Indonesia & SEA); tujuan diberi bobot
  // setara persona karena arah yang dituju menentukan kelayakan, bukan selera.
  return 0.28 * personaScore(opp, sig) + 0.20 * cocokTujuan(opp, sig.identitas)
       + 0.16 * credScore(opp.source_tier) + 0.10 * urgencyScore(opp.deadline)
       + 0.08 * recencyScore(opp.created_at) + 0.18 * region;
};
// Explainability: why this card is recommended
const RIASEC_ID_LABEL: Record<string, string> = {
  realistic: "teknik & praktik", investigative: "riset & sains", artistic: "kreatif & desain",
  social: "sosial & pendidikan", enterprising: "bisnis & kepemimpinan", conventional: "keuangan & organisasi",
};
const MI_ID_LABEL: Record<string, string> = {
  linguistic: "bahasa & menulis", logical: "logika & data", spatial: "visual & desain", musical: "musik",
  kinesthetic: "fisik & praktik", interpersonal: "sosial & kepemimpinan", intrapersonal: "riset & wirausaha", naturalistic: "alam & lingkungan",
};
const reasonsFor = (opp: Opportunity, sig: PersonaSignals): string[] => {
  const r: string[] = [];
  // Tujuan disebut lebih dulu — ini alasan paling konkret bagi siswa, dan
  // tanpa menyebutnya perubahan urutan terasa tak berdasar.
  const id = sig.identitas;
  if (id?.tujuan && id.tujuan !== "belum_yakin" && (JENIS_UNTUK_TUJUAN[id.tujuan] ?? []).includes(opp.type)) {
    r.push(`Mendukung tujuanmu: ${LABEL_TUJUAN[id.tujuan].toLowerCase()}`);
  }
  // Cocokkan ke seluruh kode Holland, bukan huruf pertama saja
  const tipeCocok = id
    ? [id.tipeUtama, id.tipeKedua, id.tipeKetiga].find(t => t && riasecMatchPct(opp, t) >= 70)
    : (sig.riasecType && riasecMatchPct(opp, sig.riasecType) >= 70 ? sig.riasecType : null);
  if (tipeCocok) r.push(`Cocok minatmu di ${RIASEC_ID_LABEL[tipeCocok] || tipeCocok}`);
  else if (sig.miType && miMatchPct(opp, sig.miType) >= 67) r.push(`Sesuai kecerdasan ${MI_ID_LABEL[sig.miType] || sig.miType}`);
  const region = getRegionScore(opp.location, opp.tags);
  if (region.label) r.push(`Relevan ${region.label}`);
  if ((opp.tags || []).includes("beasiswa-penuh")) r.push("Fully funded");
  if (opp.source_tier === 1) r.push("Sumber resmi");
  const d = opp.deadline ? Math.floor((new Date(opp.deadline).getTime() - Date.now()) / 86400000) : null;
  if (d !== null && d >= 0 && d <= 7) r.push("Deadline dekat");
  if ((Date.now() - new Date(opp.created_at).getTime()) / 86400000 <= 3) r.push("Baru ditambahkan");
  return r.slice(0, 2);
};

const TYPE_ICONS: Record<OpportunityCategory, React.ElementType> = {
  beasiswa:       GraduationCap,
  kompetisi:      Trophy,
  magang:         Briefcase,
  lowongan_kerja: Users,
  konferensi:     Mic,
};

const TYPE_LABELS: Record<OpportunityCategory, string> = {
  beasiswa:       "Beasiswa",
  kompetisi:      "Kompetisi",
  magang:         "Magang",
  lowongan_kerja: "Lowongan Kerja",
  konferensi:     "Konferensi",
};

// Tab definitions (display label → category id)
const TABS = [
  { id: "all",            label: "Semua" },
  { id: "beasiswa",       label: "Beasiswa" },
  { id: "kompetisi",      label: "Kompetisi" },
  { id: "magang",         label: "Magang" },
  { id: "lowongan_kerja", label: "Lowongan Kerja" },
  { id: "konferensi",     label: "Konferensi" },
];

const PAGE_SIZE = 9; // 3 columns × 3 rows

// ─── Helper functions (PRESERVED) ────────────────────────────────────────────
function getRegionScore(location: string, tags: string[]): { score: number; label: string | null } {
  const combined = `${location} ${(tags || []).join(' ')}`.toLowerCase();
  if (combined.includes('indonesia')) return { score: 3, label: 'Indonesia' };
  for (const kw of SEA_KEYWORDS) {
    if (combined.includes(kw)) return { score: 2, label: 'Asia Tenggara' };
  }
  return { score: 0, label: null };
}

function getRecencyBoost(createdAt: string): number {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days <= 3) return 3;
  if (days <= 7) return 2;
  if (days <= 14) return 1;
  return 0;
}

// ─── Main component ───────────────────────────────────────────────────────────
const OpportunityBoard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // ── State (PRESERVED) ──────────────────────────────────────────────────────
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("opportunities");
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [riasecType, setRiasecType] = useState<string | null>(null);
  const [miType, setMiType] = useState<string | null>(null);
  const [identitas, setIdentitas] = useState<IdentitasSiswa | null>(null);
  const [savedCats, setSavedCats] = useState<Set<string>>(new Set());
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (supabase.rpc as any)("opportunity_save_counts").then(({ data }: any) => {
      if (Array.isArray(data)) {
        setSaveCounts(Object.fromEntries(data.map((r: any) => [r.opportunity_id, Number(r.saves)])));
      }
    });
    loadOpportunities();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user) {
        // Identitas dibaca dari view kanonik `identitas_siswa`, bukan query
        // sendiri. Halaman ini dulu mengurutkan pakai completed_at sementara
        // dashboard pakai created_at — belum pernah berbeda hasilnya, tapi
        // tidak ada alasan menyimpan dua definisi identitas.
        const [ident, { data: saved }] = await Promise.all([
          ambilIdentitas(session.user.id),
          supabase.from("saved_opportunities").select("category").eq("user_id", session.user.id),
        ]);
        setIdentitas(ident);
        setRiasecType(ident?.tipeUtama ?? null);
        setMiType(ident?.tipeMI ?? null);
        setSavedCats(new Set((saved || []).map((s: { category: string | null }) => s.category).filter(Boolean) as string[]));
      }
    });
  }, []);

  const personaSignals: PersonaSignals = { riasecType, miType, savedCats, identitas };
  const hasPersona = !!(riasecType || miType || identitas?.tujuan);

  // ── Data loading (PRESERVED — fetches from scraped_content with scoring) ───
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scraped_content')
        .select('id, title, organizer, category, location, description, url, deadline, poster_url, source_website, created_at, tags, source_tier, last_verified_at, opportunity_field, quality_score')
        .eq('is_active', true)
        .or(`deadline.is.null,deadline.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) { toast.error('Gagal memuat peluang'); return; }

      const validCategories: OpportunityCategory[] = ['beasiswa', 'kompetisi', 'magang', 'lowongan_kerja', 'konferensi'];

      const scored: Opportunity[] = (data || []).map(item => {
        const { score: regionScore } = getRegionScore(item.location || '', item.tags || []);
        const recency = getRecencyBoost(item.created_at);
        const deadlineBoost = item.deadline ? 1 : 0;
        return {
          id: item.id,
          title: item.title,
          organization: item.organizer || item.source_website || 'Unknown',
          type: validCategories.includes(item.category as OpportunityCategory)
            ? (item.category as OpportunityCategory) : 'beasiswa',
          category: item.category,
          location: item.location || 'Online',
          description: item.description || '',
          link: item.url || '#',
          deadline: item.deadline,
          poster_url: item.poster_url,
          source_website: item.source_website,
          created_at: item.created_at,
          tags: item.tags || [],
          // Mutu ikut menentukan urutan: listing tak lengkap / tanpa deadline /
          // dari sumber meragukan akan tenggelam dengan sendirinya (PRD §5).
          regionScore: regionScore * 3 + recency + deadlineBoost
                       + ((item as { quality_score?: number | null }).quality_score ?? 50) / 25,
          source_tier: (item as { source_tier?: number }).source_tier ?? 2,
          last_verified_at: (item as { last_verified_at?: string | null }).last_verified_at ?? null,
          opportunity_field: (item as { opportunity_field?: string | null }).opportunity_field ?? null,
          quality_score: (item as { quality_score?: number | null }).quality_score ?? null,
        };
      });

      // Sort: Indonesia first, then SEA, then by recency
      scored.sort((a, b) => b.regionScore - a.regionScore || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOpportunities(scored);
    } catch {
      toast.error('Terjadi kesalahan saat memuat peluang');
    } finally {
      setLoading(false);
    }
  };

  // ── View mode: "Untuk Anda" (personalized) vs "Explore Semua" ─────────────
  const [viewMode, setViewMode] = useState<"foryou" | "explore">("foryou");

  // Premium gate: free users get 5 cards, no personalization (Untuk Anda / match
  // badges are premium). Declared BEFORE every derived list that reads it.
  const sub = useSubscription();
  const hargaMulai = useHargaMulai();
  const isFreeUser = !sub.loading && sub.isFree;
  const FREE_OPP_LIMIT = 5;
  const [reported, setReported] = useState<Set<string>>(new Set());

  const reportOpp = async (oppId: string) => {
    const { error } = await (supabase.rpc as any)("report_opportunity", { p_opportunity_id: oppId, p_reason: "link bermasalah" });
    if (error) { toast.error(error.message); return; }
    setReported(prev => new Set(prev).add(oppId));
    toast.success("Terima kasih! Laporan diterima — link akan kami tinjau.");
  };

  // Explore sort selector + region filter (declared BEFORE baseFiltered which reads them)
  const [sortBy, setSortBy] = useState<"newest" | "deadline" | "match">("newest");
  const [regionFilter, setRegionFilter] = useState<"all" | "idsea" | "intl">("all");

  // ── Filter logic (search + category + region) ─────────────────────────────
  const baseFiltered = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || opp.type === selectedCategory;
    const rScore = getRegionScore(opp.location, opp.tags).score;
    const matchesRegion = regionFilter === "all" || (regionFilter === "idsea" ? rScore > 0 : rScore === 0);
    return matchesSearch && matchesCategory && matchesRegion;
  });

  // "Untuk Anda": rank by final_score + diversity injection (2 of 10 outside persona)
  const forYouList = (() => {
    if (!hasPersona) return baseFiltered;
    const scored = baseFiltered.slice().sort((a, b) => finalScore(b, personaSignals) - finalScore(a, personaSignals));
    const inPersona = scored.filter(o => personaScore(o, personaSignals) > 0);
    const outPersona = scored.filter(o => personaScore(o, personaSignals) === 0);
    if (inPersona.length >= 8 && outPersona.length >= 2) {
      const merged: Opportunity[] = [];
      let pi = 0, oi = 0;
      for (let i = 0; i < scored.length; i++) {
        // positions 6 & 9 (0-based) reserved for diversity picks in each block of 10
        if ((i % 10 === 6 || i % 10 === 9) && oi < outPersona.length) merged.push(outPersona[oi++]);
        else if (pi < inPersona.length) merged.push(inPersona[pi++]);
        else if (oi < outPersona.length) merged.push(outPersona[oi++]);
      }
      return merged;
    }
    return scored;
  })();

  // Explore list honors the sort selector
  const exploreList = (() => {
    const l = baseFiltered.slice();
    if (sortBy === "deadline") {
      l.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });
    } else if (sortBy === "match" && hasPersona) {
      l.sort((a, b) => finalScore(b, personaSignals) - finalScore(a, personaSignals));
    } else {
      l.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return l;
  })();

  // Free users always get the non-personalized explore ordering
  const filteredOpportunities = viewMode === "foryou" && hasPersona && !isFreeUser ? forYouList : exploreList;

  /* Instrumentasi North Star (PRD §26). Tanpa catatan "siapa melihat peluang
     apa", Opportunity-to-Save Rate tidak punya penyebut — mustahil dihitung.
     Dicatat sekali per pengguna/peluang/hari di sisi database, jadi aman
     dipanggil berulang. Fire-and-forget: kegagalan tidak boleh mengganggu UI. */
  const loggedViewsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!userId || filteredOpportunities.length === 0) return;
    const baru = filteredOpportunities
      .slice(0, 30)
      .map(o => o.id)
      .filter(id => !loggedViewsRef.current.has(id));
    if (baru.length === 0) return;
    baru.forEach(id => loggedViewsRef.current.add(id));
    const t = setTimeout(() => {
      (supabase.rpc as any)("log_opportunity_views", { p_ids: baru }).then(() => {}, () => {});
    }, 1200); // tunggu sebentar agar hanya yang benar-benar dilihat tercatat
    return () => clearTimeout(t);
  }, [userId, filteredOpportunities]);

  const catatKlik = (id: string) => {
    if (!userId) return;
    (supabase.rpc as any)("log_opportunity_click", { p_id: id }).then(() => {}, () => {});
  };

  // "Rekomendasi Terbaik Minggu Ini": top 3 by full formula across all
  const topPicks = opportunities.slice()
    .sort((a, b) => finalScore(b, personaSignals) - finalScore(a, personaSignals))
    .slice(0, 3);

  const totalPages = Math.max(1, Math.ceil(filteredOpportunities.length / PAGE_SIZE));
  const pageItems  = filteredOpportunities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Free tier: single page of 5 cards; the rest are teased behind the unlock banner
  const gatedItems  = isFreeUser ? filteredOpportunities.slice(0, FREE_OPP_LIMIT) : pageItems;
  const lockedCount = isFreeUser ? Math.max(0, filteredOpportunities.length - FREE_OPP_LIMIT) : 0;

  const handleTabChange = (id: string) => { setSelectedCategory(id); setPage(1); };

  // ── Sign out (PRESERVED) ───────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };


  // ── Category counts ────────────────────────────────────────────────────────
  // Harus ikut filter wilayah yang sedang aktif. Sebelumnya angka ini dihitung
  // dari SELURUH peluang, jadi tab bisa menulis "98" padahal daftarnya kosong
  // karena tak satu pun dari 98 itu berlokasi Indonesia.
  const regionScoped = opportunities.filter(o => {
    if (regionFilter === "all") return true;
    const s = getRegionScore(o.location, o.tags).score;
    return regionFilter === "idsea" ? s > 0 : s === 0;
  });
  const getCatCount = (id: string) =>
    id === "all"
      ? regionScoped.length
      : regionScoped.filter(o => o.type === id).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--tk-gray-50, #F8FAFC)" }}>
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />

        <main
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            width: "100%",
            overflow: "hidden",
            paddingBottom: 80,
          }}
          className="md:pb-0 mobile-no-scroll"
        >
          <div className="mobile-container" style={{ padding: "24px 24px 32px", maxWidth: 1600, width: "100%" }}>

            {/* ── Page header ──────────────────────────────────────────────── */}
            <div
              style={{
                textAlign: "center",
                padding: "16px 0 12px",
                position: "relative",
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <h1
                className="inline-flex items-center gap-3"
                style={{
                  fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                  fontWeight: 800,
                  fontSize: 32,
                  color: "var(--tk-ink, #0F172A)",
                  letterSpacing: "-.02em",
                  margin: 0,
                }}
              >
                <Gift size={28} style={{ color: "var(--tk-blue-600, #2563EB)" }} />
                Opportunity for{" "}
                <span style={{ color: "var(--tk-blue-600, #2563EB)" }}>You</span>
              </h1>

              <p
                style={{
                  color: "var(--tk-gray-500, #6B7280)",
                  margin: "6px auto 0",
                  maxWidth: "60ch",
                  fontSize: 14,
                  fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                }}
              >
                Beasiswa, kompetisi, dan magang terbaik — diprioritaskan untuk Indonesia &amp; Asia Tenggara
              </p>

              {/* Floating emoji decorations */}
              <span style={{ position: "absolute", top: -10, right: 40,  fontSize: 42, opacity: 0.7, pointerEvents: "none" }}>🎓</span>
              <span style={{ position: "absolute", top:  10, right: 120, fontSize: 32, opacity: 0.7, pointerEvents: "none" }}>🏆</span>
              <span style={{ position: "absolute", top:  40, right: 200, fontSize: 24, opacity: 0.5, pointerEvents: "none" }}>💼</span>
            </div>

            {/* ── Search bar ───────────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "white",
                borderRadius: 16,
                border: "1px solid var(--tk-gray-200, #E5E7EB)",
                boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                padding: "12px 16px",
                marginBottom: 20,
              }}
            >
              <Search size={16} style={{ color: "var(--tk-gray-400, #9CA3AF)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari peluang..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                  fontSize: 14,
                  color: "var(--tk-ink, #0F172A)",
                }}
              />
            </div>

            {/* ── View mode: Untuk Anda vs Explore ──────────────────────────── */}
            <div className="flex justify-center" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6, background: "white", border: "1px solid var(--tk-gray-200, #E5E7EB)", borderRadius: 14, padding: 5, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                {([
                  { id: "foryou" as const, label: "✨ Untuk Anda" },
                  { id: "explore" as const, label: "🌐 Jelajahi Semua" },
                ]).map(m => (
                  <button key={m.id} onClick={() => { setViewMode(m.id); setPage(1); }}
                    style={{
                      padding: "9px 20px", border: "none", borderRadius: 10, cursor: "pointer",
                      fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 700, fontSize: 13.5,
                      background: viewMode === m.id ? "var(--tk-blue-600, #2563EB)" : "transparent",
                      color: viewMode === m.id ? "#fff" : "var(--tk-gray-600, #4B5563)",
                      transition: "all .15s",
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Region filter chips */}
            <div className="flex justify-center" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  { id: "all" as const, label: "🌏 Semua Wilayah" },
                  { id: "idsea" as const, label: "🇮🇩 Indonesia & SEA" },
                  { id: "intl" as const, label: "🌐 Internasional" },
                ]).map(r => (
                  <button key={r.id} onClick={() => { setRegionFilter(r.id); setPage(1); }}
                    style={{
                      padding: "6px 14px", borderRadius: 99, cursor: "pointer",
                      border: `1.5px solid ${regionFilter === r.id ? "var(--tk-blue-600, #2563EB)" : "var(--tk-gray-200, #E5E7EB)"}`,
                      background: regionFilter === r.id ? "var(--tk-blue-50, #EFF6FF)" : "white",
                      color: regionFilter === r.id ? "var(--tk-blue-700, #1D4ED8)" : "var(--tk-gray-600, #4B5563)",
                      fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 600, fontSize: 12.5,
                      transition: "all .15s",
                    }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === "foryou" && !hasPersona && !loading && (
              <div style={{ textAlign: "center", marginBottom: 16, fontSize: 13, color: "var(--tk-gray-500)" }}>
                Ikuti <a href="/assessment" style={{ color: "var(--tk-blue-600)", fontWeight: 700 }}>tes minat bakat</a> dulu agar rekomendasi dipersonalisasi untukmu.
              </div>
            )}
            {viewMode === "explore" && (
              <div className="flex justify-center" style={{ marginBottom: 14 }}>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--tk-gray-200, #E5E7EB)", background: "white", fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 600, fontSize: 12.5, color: "var(--tk-gray-600)", cursor: "pointer", outline: "none" }}>
                  <option value="newest">Urutkan: Terbaru</option>
                  <option value="deadline">Urutkan: Deadline Terdekat</option>
                  {hasPersona && <option value="match">Urutkan: Paling Cocok</option>}
                </select>
              </div>
            )}

            {/* ── Rekomendasi Terbaik Minggu Ini (premium: personalisasi) ───── */}
            {viewMode === "foryou" && hasPersona && !loading && topPicks.length > 0 && (
              <UpgradeGate
                feature="Rekomendasi personal berdasarkan hasil tes bakatmu — buka dengan Premium"
                fromPath="/opportunities"
              >
              <div style={{ marginBottom: 22, background: "linear-gradient(135deg,#EFF6FF,#F0F9FF)", border: "1.5px solid #BFDBFE", borderRadius: 18, padding: "16px 18px" }}>
                <div style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 800, fontSize: 15, color: "var(--tk-blue-700, #1D4ED8)", marginBottom: 10 }}>
                  🏆 Rekomendasi Terbaik Minggu Ini
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 10 }}>
                  {topPicks.map(tp => (
                    <button key={tp.id} onClick={() => window.open(tp.link, "_blank")}
                      style={{ textAlign: "left", background: "white", border: "1px solid var(--tk-gray-200)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tk-ink)", fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                        {tp.title}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                        {reasonsFor(tp, personaSignals).map(r => (
                          <span key={r} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tk-blue-700)", background: "var(--tk-blue-50, #EFF6FF)", padding: "2px 8px", borderRadius: 99 }}>{r}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              </UpgradeGate>
            )}

            {/* ── Category tabs ─────────────────────────────────────────────── */}
            <div className="flex justify-center" style={{ marginBottom: 24 }}>
              <div
                className="flex items-center gap-1 rounded-2xl"
                style={{
                  background: "var(--tk-gray-100, #F3F4F6)",
                  border: "1px solid var(--tk-gray-200, #E5E7EB)",
                  padding: 4,
                  flexWrap: "wrap",
                }}
              >
                {TABS.map(tab => {
                  const active = selectedCategory === tab.id;
                  const count  = getCatCount(tab.id);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className="flex items-center gap-1.5 rounded-xl transition-all"
                      style={{
                        padding: "7px 14px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                        fontWeight: active ? 700 : 500,
                        fontSize: 13,
                        background: active ? "white" : "transparent",
                        color: active ? "var(--tk-blue-700, #1D4ED8)" : "var(--tk-gray-600, #4B5563)",
                        boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                      }}
                    >
                      {tab.label}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 18,
                          height: 18,
                          borderRadius: 99,
                          background: active ? "var(--tk-blue-50, #EFF6FF)" : "var(--tk-gray-200, #E5E7EB)",
                          color: active ? "var(--tk-blue-700, #1D4ED8)" : "var(--tk-gray-500, #6B7280)",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Loading skeleton ──────────────────────────────────────────── */}
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "1px solid var(--tk-gray-200, #E5E7EB)",
                      background: "white",
                    }}
                  >
                    {/* skeleton header */}
                    <div
                      className="animate-pulse"
                      style={{ height: 104, background: "var(--tk-gray-100, #F3F4F6)" }}
                    />
                    {/* skeleton body */}
                    <div className="animate-pulse" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ height: 14, background: "var(--tk-gray-100, #F3F4F6)", borderRadius: 6, width: "75%" }} />
                      <div style={{ height: 12, background: "var(--tk-gray-100, #F3F4F6)", borderRadius: 6, width: "50%" }} />
                      <div style={{ height: 12, background: "var(--tk-gray-100, #F3F4F6)", borderRadius: 6, width: "40%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* ── Cards grid ─────────────────────────────────────────────── */}
                {filteredOpportunities.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                      color: "var(--tk-gray-500, #6B7280)",
                      fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                      fontSize: 15,
                    }}
                  >
                    {opportunities.length === 0 ? (
                      <>
                        <div style={{ fontSize: 34, marginBottom: 10 }}>🌱</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--tk-gray-800, #1F2937)" }}>
                          Papan peluang sedang dikurasi ulang
                        </div>
                        <div style={{ maxWidth: 460, margin: "8px auto 0", lineHeight: 1.65 }}>
                          Kami menghentikan sumber otomatis dari luar negeri dan menggantinya
                          dengan peluang yang dipilih satu per satu supaya benar-benar relevan
                          untuk pelajar Indonesia. Peluang baru akan muncul di sini.
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--tk-gray-700, #374151)" }}>
                          Tidak ada peluang yang cocok dengan filter ini
                        </div>
                        <button
                          onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setRegionFilter("all"); }}
                          style={{
                            marginTop: 14, padding: "9px 18px", borderRadius: 9, cursor: "pointer",
                            border: "1px solid var(--tk-gray-200, #E5E7EB)", background: "white",
                            color: "var(--tk-blue-700, #1D4ED8)", fontWeight: 700, fontSize: 13.5,
                          }}
                        >
                          Atur ulang filter
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                    {gatedItems.map((opp) => {
                      const TypeIcon  = TYPE_ICONS[opp.type] ?? GraduationCap;
                      const [gradFrom, gradTo] = GRADIENT_COLORS[opp.type] ?? ["#3B82F6", "#1D4ED8"];
                      const typeFg    = TYPE_FG[opp.type] ?? "#1D4ED8";
                      const typeLabel = TYPE_LABELS[opp.type] ?? "Beasiswa";

                      const { label: regionLabel } = getRegionScore(opp.location, opp.tags);
                      const isNew   = (Date.now() - new Date(opp.created_at).getTime()) / 86400000 <= 7;
                      const daysLeft = opp.deadline
                        ? Math.floor((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                        : null;
                      const matchPct = cocokIdentitas(opp, identitas, riasecType);
                      const saves = saveCounts[opp.id] ?? 0;

                      return (
                        <div
                          key={opp.id}
                          onClick={() => { catatKlik(opp.id); window.open(opp.link, '_blank'); }}
                          className="group"
                          style={{
                            background: "white",
                            borderRadius: 16,
                            border: "1px solid var(--tk-gray-200, #E5E7EB)",
                            overflow: "hidden",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            transition: "box-shadow .2s, transform .2s",
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.boxShadow = "0 8px 24px rgba(0,0,0,.12)";
                            el.style.transform  = "translateY(-2px)";
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.boxShadow = "none";
                            el.style.transform  = "translateY(0)";
                          }}
                        >
                          {/* ── Header: real poster when available, else gradient ── */}
                          <div
                            style={{
                              height: 104,
                              background: opp.poster_url
                                ? `linear-gradient(rgba(15,23,42,.35), rgba(15,23,42,.45)), url(${opp.poster_url}) center/cover no-repeat`
                                : `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                              padding: "14px 16px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              position: "relative",
                            }}
                          >
                            {/* RIASEC match + official source badges */}
                            <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                              {matchPct >= 70 && !isFreeUser && (
                                <div style={{
                                  display: "flex", alignItems: "center", gap: 4,
                                  background: "rgba(255,255,255,.95)", color: typeFg,
                                  borderRadius: 99, padding: "3px 9px",
                                  fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 11,
                                  boxShadow: "0 2px 6px rgba(0,0,0,.15)",
                                }}>
                                  ✦ Cocok {matchPct}%
                                </div>
                              )}
                              {opp.source_tier === 1 && (
                                <div style={{
                                  display: "flex", alignItems: "center", gap: 4,
                                  background: "#059669", color: "#fff",
                                  borderRadius: 99, padding: "3px 9px",
                                  fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 10.5,
                                  boxShadow: "0 2px 6px rgba(0,0,0,.15)",
                                }}>
                                  ✓ Sumber Resmi
                                </div>
                              )}
                            </div>
                            {/* dot pattern overlay */}
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0.1,
                                backgroundImage:
                                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                                backgroundSize: "30px 30px",
                              }}
                            />

                            {/* top row: type pill + bookmark */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                              {/* type pill */}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3px 10px",
                                  borderRadius: 99,
                                  background: "rgba(255,255,255,.9)",
                                  color: typeFg,
                                  fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                  fontWeight: 700,
                                  fontSize: 11.5,
                                }}
                              >
                                <TypeIcon size={12} /> {typeLabel}
                              </span>

                              {/* isNew badge */}
                              {isNew && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    padding: "3px 8px",
                                    borderRadius: 99,
                                    background: "var(--tk-yellow, #FFC107)",
                                    color: "#7A5700",
                                    fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                    fontWeight: 700,
                                    fontSize: 11,
                                  }}
                                >
                                  <Star size={10} /> Baru
                                </span>
                              )}
                            </div>

                            {/* center: icon + source */}
                            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                              <TypeIcon size={28} style={{ opacity: 0.85, color: "#fff", marginBottom: 4 }} />
                              <div
                                style={{
                                  fontSize: 12,
                                  opacity: 0.95,
                                  fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                  fontWeight: 500,
                                  color: "#fff",
                                }}
                              >
                                {opp.source_website}
                              </div>
                            </div>

                            {/* region badge — top-right overlay */}
                            {regionLabel && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 10,
                                  right: 12,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "3px 8px",
                                  borderRadius: 99,
                                  background: "rgba(255,255,255,.9)",
                                  color: "var(--tk-gray-700, #374151)",
                                  fontSize: 11,
                                  fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                                  fontWeight: 500,
                                  zIndex: 1,
                                }}
                              >
                                <Globe size={10} /> {regionLabel}
                              </div>
                            )}

                            {/* deadline urgency strip */}
                            {daysLeft !== null && daysLeft <= 30 && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  padding: "4px 10px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                                  background: daysLeft <= 7 ? "#DC2626" : "rgba(0,0,0,.55)",
                                  color: "white",
                                  zIndex: 2,
                                }}
                              >
                                <Clock size={11} />
                                {daysLeft <= 0 ? "Deadline hari ini" : `${daysLeft} hari lagi`}
                              </div>
                            )}
                          </div>

                          {/* ── Card body ───────────────────────────────────── */}
                          <div
                            style={{
                              padding: "14px 16px",
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {/* title */}
                            <div
                              style={{
                                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                fontWeight: 600,
                                fontSize: 14.5,
                                color: "var(--tk-ink, #0F172A)",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: 39,
                              }}
                            >
                              {opp.title}
                            </div>

                            {/* organization */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                color: "var(--tk-gray-500, #6B7280)",
                              }}
                            >
                              <Building2 size={12} style={{ flexShrink: 0 }} />
                              <span
                                style={{
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {opp.organization}
                              </span>
                            </div>

                            {/* location */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                color: "var(--tk-gray-500, #6B7280)",
                              }}
                            >
                              <MapPin size={12} style={{ flexShrink: 0 }} />
                              <span
                                style={{
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {opp.location}
                              </span>
                            </div>

                            {/* deadline line — real date when known, honest fallback otherwise
                                so the 74% without a parsed deadline never feel dead */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                color: opp.deadline ? "var(--tk-gray-600, #4B5563)" : "var(--tk-gray-400, #9CA3AF)",
                              }}
                            >
                              <Clock size={12} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                {opp.deadline
                                  ? `Deadline ${new Date(opp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                                  : "Cek deadline di sumber"}
                              </span>
                            </div>

                            {/* description preview */}
                            {opp.description && (
                              <div style={{
                                fontSize: 12, color: "var(--tk-gray-500, #6B7280)", lineHeight: 1.5,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                              } as React.CSSProperties}>
                                {opp.description}
                              </div>
                            )}

                            {/* why-recommended chips (Untuk Anda mode) + fully-funded */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                              {viewMode === "foryou" && hasPersona && !isFreeUser && reasonsFor(opp, personaSignals).map(r => (
                                <span key={r} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tk-blue-700, #1D4ED8)", background: "var(--tk-blue-50, #EFF6FF)", padding: "2px 8px", borderRadius: 99 }}>
                                  💡 {r}
                                </span>
                              ))}
                              {viewMode === "explore" && (opp.tags || []).includes("beasiswa-penuh") && (
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#B45309", background: "#FFFBEB", padding: "2px 8px", borderRadius: 99 }}>
                                  💰 Fully Funded
                                </span>
                              )}
                            </div>

                            {/* tags */}
                            {opp.tags.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
                                {opp.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "2px 8px",
                                      borderRadius: 99,
                                      background: "var(--tk-gray-100, #F3F4F6)",
                                      color: "var(--tk-gray-600, #4B5563)",
                                      fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                                      fontSize: 11,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* CTA + Bookmark */}
                            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            {userId && (
                              <div onClick={e => e.stopPropagation()}>
                                <BookmarkButton
                                  userId={userId}
                                  opportunityId={opp.id}
                                  opportunityTitle={opp.title}
                                  opportunityUrl={opp.link}
                                  category={opp.type}
                                />
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); catatKlik(opp.id); window.open(opp.link, '_blank'); }}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "8px 14px",
                                borderRadius: 12,
                                border: "1px solid var(--tk-gray-200, #E5E7EB)",
                                background: "var(--tk-gray-50, #F8FAFC)",
                                cursor: "pointer",
                                fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                                fontWeight: 600,
                                fontSize: 13,
                                color: "var(--tk-gray-700, #374151)",
                                transition: "background .15s, color .15s, border-color .15s",
                              }}
                              onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background   = "var(--tk-blue-600, #2563EB)";
                                el.style.color        = "#fff";
                                el.style.borderColor  = "var(--tk-blue-600, #2563EB)";
                              }}
                              onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background   = "var(--tk-gray-50, #F8FAFC)";
                                el.style.color        = "var(--tk-gray-700, #374151)";
                                el.style.borderColor  = "var(--tk-gray-200, #E5E7EB)";
                              }}
                            >
                              Lihat Detail <ExternalLink size={13} />
                            </button>
                            </div>

                            {/* verification footer */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                              <span style={{ fontSize: 10.5, color: "var(--tk-gray-400, #9CA3AF)", display: "inline-flex", alignItems: "center", gap: 7 }}>
                                {(opp.quality_score ?? 0) >= 80 && (
                                  <span title={`Skor mutu ${opp.quality_score}/100 — sumber kredibel, deadline terkonfirmasi, info lengkap`}
                                    style={{ color: "#047857", fontWeight: 700 }}>
                                    ✓ Terverifikasi {opp.quality_score}
                                  </span>
                                )}
                                {saves >= 2 && <span style={{ color: "var(--tk-blue-600, #2563EB)", fontWeight: 700 }}>🔖 {saves} menyimpan</span>}
                                {opp.last_verified_at ? `✓ Diverifikasi ${new Date(opp.last_verified_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                              </span>
                              {userId && (
                                reported.has(opp.id) ? (
                                  <span style={{ fontSize: 10.5, color: "var(--tk-gray-400)" }}>Dilaporkan ✓</span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); reportOpp(opp.id); }}
                                    title="Laporkan link bermasalah"
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10.5, color: "var(--tk-gray-400, #9CA3AF)", padding: 0, textDecoration: "underline", textDecorationStyle: "dotted" }}>
                                    Laporkan link
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Free tier: unlock banner for the rest of the board ──── */}
                {lockedCount > 0 && (
                  <div
                    onClick={() => navigate("/subscription?from=%2Fopportunities")}
                    style={{
                      marginTop: 20,
                      borderRadius: 18,
                      padding: "26px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #1E3A8A, #6D28D9)",
                      color: "white",
                      boxShadow: "0 8px 28px rgba(30,58,138,.35)",
                    }}
                  >
                    <div style={{ fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
                      🔓 {lockedCount} peluang lagi menantimu
                    </div>
                    <div style={{ fontSize: 13.5, opacity: 0.85, marginBottom: 14 }}>
                      Beasiswa, kompetisi, magang & event pilihan — plus rekomendasi personal sesuai bakatmu.
                    </div>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        background: "white", color: "#1D4ED8",
                        borderRadius: 12, padding: "11px 22px",
                        fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)", fontWeight: 700, fontSize: 14,
                      }}
                    >
                      ✨ {hargaMulai ? `Upgrade — mulai ${hargaMulai}/bln` : "Lihat Paket Berlangganan"}
                    </span>
                  </div>
                )}

                {/* ── Pagination (premium only — free sees the unlock banner) ── */}
                {!isFreeUser && filteredOpportunities.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "24px 4px",
                    }}
                  >
                    {/* count label */}
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--tk-gray-500, #6B7280)",
                        fontFamily: "var(--tk-font-sans, 'Inter', sans-serif)",
                      }}
                    >
                      Menampilkan{" "}
                      {filteredOpportunities.length === 0
                        ? 0
                        : (page - 1) * PAGE_SIZE + 1}
                      –{Math.min(page * PAGE_SIZE, filteredOpportunities.length)}{" "}
                      dari {filteredOpportunities.length} peluang
                    </span>

                    {/* page controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid var(--tk-gray-200, #E5E7EB)",
                          background: "transparent",
                          cursor: page === 1 ? "default" : "pointer",
                          color: page === 1 ? "var(--tk-gray-300, #D1D5DB)" : "var(--tk-gray-600, #4B5563)",
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--tk-font-display, 'Poppins', sans-serif)",
                            fontWeight: 700,
                            fontSize: 13,
                            background: p === page ? "var(--tk-blue-600, #2563EB)" : "transparent",
                            color: p === page ? "#fff" : "var(--tk-gray-700, #374151)",
                          }}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid var(--tk-gray-200, #E5E7EB)",
                          background: "transparent",
                          cursor: page === totalPages ? "default" : "pointer",
                          color: page === totalPages ? "var(--tk-gray-300, #D1D5DB)" : "var(--tk-gray-600, #4B5563)",
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <BottomNavigationBar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
    </SidebarProvider>
  );
};

export default OpportunityBoard;
