import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Trophy, Briefcase, GraduationCap, Building2,
  ExternalLink, Globe, Star, Clock, Gift, Bookmark, ChevronLeft, ChevronRight, Mic, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { toast } from "sonner";

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

  // ── State (PRESERVED) ──────────────────────────────────────────────────────
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("opportunities");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadOpportunities();
  }, []);

  // ── Data loading (PRESERVED — fetches from scraped_content with scoring) ───
  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scraped_content')
        .select('id, title, organizer, category, location, description, url, deadline, poster_url, source_website, created_at, tags')
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
          regionScore: regionScore * 3 + recency + deadlineBoost,
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

  // ── Filter logic (PRESERVED) ───────────────────────────────────────────────
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || opp.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOpportunities.length / PAGE_SIZE));
  const pageItems  = filteredOpportunities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTabChange = (id: string) => { setSelectedCategory(id); setPage(1); };

  // ── Sign out (PRESERVED) ───────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // ── Category counts ────────────────────────────────────────────────────────
  const getCatCount = (id: string) =>
    id === "all"
      ? opportunities.length
      : opportunities.filter(o => o.type === id).length;

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
            flex: 1,
            overflow: "hidden",
            paddingBottom: 80,
          }}
          className="md:pb-0 mobile-no-scroll"
        >
          <div className="mobile-container" style={{ padding: "24px 24px 32px" }}>

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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
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
                    Tidak ada peluang yang ditemukan
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
                    {pageItems.map((opp) => {
                      const TypeIcon  = TYPE_ICONS[opp.type] ?? GraduationCap;
                      const [gradFrom, gradTo] = GRADIENT_COLORS[opp.type] ?? ["#3B82F6", "#1D4ED8"];
                      const typeFg    = TYPE_FG[opp.type] ?? "#1D4ED8";
                      const typeLabel = TYPE_LABELS[opp.type] ?? "Beasiswa";

                      const { label: regionLabel } = getRegionScore(opp.location, opp.tags);
                      const isNew   = (Date.now() - new Date(opp.created_at).getTime()) / 86400000 <= 7;
                      const daysLeft = opp.deadline
                        ? Math.floor((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                        : null;

                      return (
                        <div
                          key={opp.id}
                          onClick={() => window.open(opp.link, '_blank')}
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
                          {/* ── Coloured header ─────────────────────────────── */}
                          <div
                            style={{
                              height: 104,
                              background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                              padding: "14px 16px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              position: "relative",
                            }}
                          >
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

                            {/* CTA button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); window.open(opp.link, '_blank'); }}
                              style={{
                                marginTop: 4,
                                width: "100%",
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Pagination ──────────────────────────────────────────── */}
                {filteredOpportunities.length > 0 && (
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
