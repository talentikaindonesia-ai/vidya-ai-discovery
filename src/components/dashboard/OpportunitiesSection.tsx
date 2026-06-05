import { useState, useEffect, useMemo, memo } from "react";
import { Gift, Shield, MapPin, Bookmark, ChevronRight, ChevronLeft, GraduationCap, Trophy, Briefcase, Users, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// ─── Type badge colours ──────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, [string, string]> = {
  "Beasiswa":        ["#DBEAFE", "#1D4ED8"],
  "Kompetisi":       ["#FFEDE2", "#FF6A00"],
  "Magang":          ["#D1FAE5", "#0F7A3E"],
  "Lowongan Kerja":  ["#EDE9FE", "#5B21B6"],
  "Konferensi":      ["#FFF6E0", "#A47000"],
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  "Beasiswa":        GraduationCap,
  "Kompetisi":       Trophy,
  "Magang":          Briefcase,
  "Lowongan Kerja":  Users,
  "Konferensi":      Mic,
};

const CATS = ["Semua", "Beasiswa", "Kompetisi", "Magang", "Lowongan Kerja", "Konferensi"];

// Maps scraped_content.category → display type used in this dashboard
const CAT_MAP: Record<string, string> = {
  beasiswa:       "Beasiswa",
  kompetisi:      "Kompetisi",
  magang:         "Magang",
  lowongan_kerja: "Lowongan Kerja",
  konferensi:     "Konferensi",
  program:        "Konferensi",
  volunteer:      "Beasiswa",
};

interface ScrapedOpp {
  id: string;
  title: string;
  organizer: string | null;
  location: string | null;
  category: string;
  tags: string[] | null;
  source_website: string | null;
  is_sponsored: boolean | null;
  sponsor_badge: string | null;
  sponsor_cta: string | null;
}

interface OppItem {
  id: string;
  title: string;
  source: string;
  type: string;
  loc: string;
  tags: string[];
  saved: boolean;
  featured: boolean;
  isSponsored?: boolean;
  sponsorBadge?: string;
  sponsorCta?: string;
}

// ─── Fallback mock data (shown only when Supabase returns nothing) ─────────────
const MOCK_OPPORTUNITIES: OppItem[] = [
  { id: "1", title: "LPDP Scholarship 2025", source: "Kemendikbudristek", type: "Beasiswa", loc: "Indonesia & Global", tags: ["full-scholarship", "s2/s3", "riset"], saved: false, featured: true },
  { id: "2", title: "Software Engineer Intern – TechCorp", source: "TechCorp Indonesia", type: "Magang", loc: "Jakarta", tags: ["react", "typescript", "remote-friendly"], saved: false, featured: false },
  { id: "3", title: "National UI/UX Design Competition", source: "Creative Foundation", type: "Kompetisi", loc: "Bandung", tags: ["design", "figma", "hadiah-50jt"], saved: false, featured: false },
  { id: "4", title: "Data Analyst – FinTech Startup", source: "PayLater.id", type: "Lowongan Kerja", loc: "Jakarta", tags: ["sql", "python", "fresh-grad"], saved: false, featured: false },
  { id: "5", title: "Beasiswa Unggulan Kemendikbud", source: "Kemendikbudristek", type: "Beasiswa", loc: "Indonesia", tags: ["s1", "berprestasi", "fully-funded"], saved: false, featured: false },
  { id: "6", title: "Google Developer Student Club Conference", source: "Google", type: "Konferensi", loc: "Online", tags: ["google", "web", "gratis"], saved: false, featured: false },
  { id: "7", title: "Marketing Intern – E-Commerce Giant", source: "Tokopedia", type: "Magang", loc: "Jakarta", tags: ["marketing", "digital", "paid"], saved: false, featured: false },
  { id: "8", title: "Startup Pitch Competition – 100jt Prize", source: "Innovation Hub", type: "Kompetisi", loc: "Surabaya", tags: ["startup", "pitch", "prize"], saved: false, featured: false },
];

const PAGE_SIZE = 6;

// ─── Opportunity card ────────────────────────────────────────────────────────
const OppCard = memo(function OppCard({
  opp,
  focused,
  onFocus,
  saved,
  onSave,
}: {
  opp: OppItem;
  focused: boolean;
  onFocus: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  const [bg, fg] = TYPE_COLORS[opp.type] ?? ["#E8F1FF", "#1D4ED8"];
  const TypeIcon = TYPE_ICONS[opp.type] ?? Shield;

  return (
    <div
      onClick={onFocus}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      style={{
        background: "white",
        border: focused ? "2px solid var(--tk-blue-600)" : "1px solid var(--tk-gray-200)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* coloured header */}
      <div
        style={{
          height: 104,
          background: `linear-gradient(135deg, ${bg}, ${fg})`,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div className="flex items-start justify-between">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 99,
                background: "rgba(255,255,255,.9)",
                color: fg,
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              <TypeIcon size={12} /> {opp.type}
            </span>
            {opp.isSponsored && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "#FEF3C7",
                  color: "#92400E",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 800,
                  fontSize: 9.5,
                  letterSpacing: ".04em",
                  border: "1px solid #FDE68A",
                }}
              >
                ⭐ {opp.sponsorBadge || "SPONSOR"}
              </span>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onSave(); }}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              border: "none",
              background: "rgba(255,255,255,.2)",
              cursor: "pointer",
              color: saved ? "var(--tk-yellow)" : "#fff",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.2)"; }}
          >
            <Bookmark size={16} fill={saved ? "var(--tk-yellow)" : "none"} />
          </button>
        </div>

        <div style={{ textAlign: "center" }}>
          <TypeIcon size={28} style={{ opacity: 0.85, color: "#fff", marginBottom: 4 }} />
          <div
            style={{
              fontSize: 12,
              opacity: 0.95,
              fontFamily: "var(--tk-font-display)",
              fontWeight: 500,
              color: "#fff",
            }}
          >
            {opp.source}
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 14.5,
            color: focused ? "var(--tk-blue-700)" : "var(--tk-ink)",
            lineHeight: 1.3,
            minHeight: 38,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {opp.title}
        </div>

        <div
          className="flex items-center gap-1"
          style={{ fontSize: 12, color: "var(--tk-gray-500)" }}
        >
          <MapPin size={12} /> {opp.loc}
        </div>

        <div className="flex flex-wrap gap-1.5" style={{ flex: 1 }}>
          {opp.tags.map(t => (
            <span
              key={t}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 99,
                background: "var(--tk-gray-100)",
                color: "var(--tk-gray-600)",
                fontFamily: "var(--tk-font-sans)",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <button
          onClick={e => { e.stopPropagation(); }}
          className="w-full flex items-center justify-center gap-2 rounded-xl transition-all"
          style={{
            marginTop: 6,
            padding: "8px 14px",
            background: focused ? "var(--tk-blue-600)" : "var(--tk-gray-50)",
            border: focused ? "none" : "1px solid var(--tk-gray-200)",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 13,
            color: focused ? "#fff" : "var(--tk-gray-700)",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = focused ? "var(--tk-blue-700)" : "var(--tk-gray-100)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = focused ? "var(--tk-blue-600)" : "var(--tk-gray-50)";
          }}
        >
          Lihat Detail <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
});

// ─── Main component ──────────────────────────────────────────────────────────
export const OpportunitiesSection = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab,       setTab]       = useState("Semua");
  const [focusId,   setFocusId]   = useState<string>("");
  const [page,      setPage]      = useState(1);
  const [opps,      setOpps]      = useState<OppItem[]>(MOCK_OPPORTUNITIES);
  const [savedMap,  setSavedMap]  = useState<Record<string, boolean>>({});
  const [dbLoaded,  setDbLoaded]  = useState(false);

  // ── Load real data from Supabase ──────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("scraped_content")
      .select("id, title, organizer, location, category, tags, source_website, is_sponsored, sponsor_badge, sponsor_cta")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: OppItem[] = (data as ScrapedOpp[]).map(o => ({
            id: o.id,
            title: o.title,
            source: o.organizer || o.source_website || "Talentika",
            type: CAT_MAP[o.category] ?? "Konferensi",
            loc: o.location || "Indonesia",
            tags: (o.tags ?? []).slice(0, 3),
            saved: false,
            featured: o.is_sponsored ?? false,
            isSponsored: o.is_sponsored ?? false,
            sponsorBadge: o.sponsor_badge ?? undefined,
            sponsorCta: o.sponsor_cta ?? undefined,
          }));
          // Pin sponsored cards first (JS sort — safe even if column doesn't exist yet)
          mapped.sort((a, b) => (b.isSponsored ? 1 : 0) - (a.isSponsored ? 1 : 0));
          setOpps(mapped);
          setSavedMap(Object.fromEntries(mapped.map(o => [o.id, false])));
          setFocusId(mapped[0]?.id ?? "");
        } else {
          setFocusId(MOCK_OPPORTUNITIES[0].id);
          setSavedMap(Object.fromEntries(MOCK_OPPORTUNITIES.map(o => [o.id, o.saved])));
        }
        setDbLoaded(true);
      });
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Semua: opps.length };
    opps.forEach(o => { c[o.type] = (c[o.type] ?? 0) + 1; });
    return c;
  }, [opps]);

  const filtered = tab === "Semua" ? opps : opps.filter(o => o.type === tab);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTab = (t: string) => { setTab(t); setPage(1); };
  const toggleSave = async (id: string) => {
    const willSave = !savedMap[id];
    setSavedMap(m => ({ ...m, [id]: willSave }));
    // Award XP on first save (idempotent via award_xp)
    if (willSave) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('award_xp', {
          p_user_id: user.id, p_amount: 10, p_reason: 'Peluang disimpan 🔖',
        });
        if (data?.leveled_up) {
          toast(`🎉 Level Up! Kamu mencapai Level ${data.current_level}!`, { duration: 5000 });
        } else if (data) {
          toast(`+10 XP — Peluang disimpan 🔖`, { duration: 2500 });
        }
      }
    }
  };

  return (
    <div className="tk-page-in" style={{ paddingTop: 8 }}>
      {/* ── Centered hero header ───────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "16px 0 12px", position: "relative" }}>
        <h1
          className="inline-flex items-center gap-3"
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 32,
            color: "var(--tk-ink)",
            letterSpacing: "-.02em",
          }}
        >
          <Gift size={28} style={{ color: "var(--tk-blue-600)" }} />
          Opportunity for{" "}
          <span style={{ color: "var(--tk-blue-600)" }}>You</span>
        </h1>
        <p style={{ color: "var(--tk-gray-500)", margin: "6px auto 0", maxWidth: "60ch", fontSize: 14 }}>
          Beasiswa, kompetisi, dan magang terbaik — diprioritaskan untuk Indonesia &amp; Asia Tenggara
        </p>

        <span style={{ position: "absolute", top: -10, right: 40,  fontSize: 42, opacity: 0.7 }}>🎓</span>
        <span style={{ position: "absolute", top:  10, right: 120, fontSize: 32, opacity: 0.7 }}>🏆</span>
        <span style={{ position: "absolute", top:  40, right: 200, fontSize: 24, opacity: 0.5 }}>💼</span>
      </div>

      {/* ── Category tabs ──────────────────────────────────────── */}
      <div className="flex justify-center mb-6" style={isMobile ? { overflowX: "auto", justifyContent: "flex-start" } : {}}>
        <div
          className="flex items-center gap-1 rounded-2xl p-1"
          style={{ background: "var(--tk-gray-100)", border: "1px solid var(--tk-gray-200)", flexShrink: 0 }}
        >
          {CATS.map(c => {
            const active = c === tab;
            return (
              <button
                key={c}
                onClick={() => handleTab(c)}
                className="flex items-center gap-1.5 rounded-xl transition-all"
                style={{
                  padding: "7px 14px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  background: active ? "white" : "transparent",
                  color: active ? "var(--tk-blue-700)" : "var(--tk-gray-600)",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                }}
              >
                {c}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: 99,
                    background: active ? "var(--tk-blue-50)" : "var(--tk-gray-200)",
                    color: active ? "var(--tk-blue-700)" : "var(--tk-gray-500)",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {counts[c] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3-col card grid ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
        {pageItems.map(o => (
          <OppCard
            key={o.id}
            opp={o}
            focused={o.id === focusId}
            onFocus={() => setFocusId(o.id)}
            saved={!!savedMap[o.id]}
            onSave={() => toggleSave(o.id)}
          />
        ))}
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ padding: "24px 4px" }}>
        <span style={{ fontSize: 13, color: "var(--tk-gray-500)" }}>
          {!dbLoaded ? "Memuat peluang..." : (
            <>
              Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} peluang
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              border: "1px solid var(--tk-gray-200)",
              background: "transparent",
              cursor: page === 1 ? "default" : "pointer",
              color: page === 1 ? "var(--tk-gray-300)" : "var(--tk-gray-600)",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13,
                background: p === page ? "var(--tk-blue-600)" : "transparent",
                color: p === page ? "#fff" : "var(--tk-gray-700)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              border: "1px solid var(--tk-gray-200)",
              background: "transparent",
              cursor: page === totalPages ? "default" : "pointer",
              color: page === totalPages ? "var(--tk-gray-300)" : "var(--tk-gray-600)",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
