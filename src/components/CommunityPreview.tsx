import { useState, useEffect } from "react";
import { Users, MessageCircle, ArrowRight, Check, MessageSquare, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommunityPreviewProps {
  userAssessment?: any;
  userInterests?: any[];
  profile?: any;
}

// ─── Category colour map ─────────────────────────────────────────────────────
const CAT_PILL: Record<string, [string, string]> = {
  Technology:         ["var(--tk-blue-50)",    "var(--tk-blue-700)"],
  Design:             ["var(--tk-orange-soft)", "var(--tk-orange)"],
  Social:             ["var(--tk-mint)",        "var(--tk-green-dark)"],
  Marketing:          ["var(--tk-lilac)",       "#5B21B6"],
  Seni:               ["#FCE7F3",              "#B83280"],
  "Pengembangan Diri":["var(--tk-yellow-soft)", "#A47000"],
  Community:          ["var(--tk-blue-50)",    "var(--tk-blue-700)"],
};

const FALLBACK_COMMUNITIES = [
  {
    id: "tech",
    name: "Tech Innovators Community",
    description: "Komunitas untuk para inovator teknologi yang ingin berbagi ide dan berkolaborasi dalam project nyata.",
    cat: "Technology",
    members: 1247,
    discussions: 89,
    tags: ["Programming", "AI", "Web Dev"],
    rec: true,
  },
  {
    id: "design",
    name: "Creative Designers Hub",
    description: "Tempat berkumpul para desainer untuk saling menginspirasi dan belajar teknik terbaru.",
    cat: "Design",
    members: 892,
    discussions: 156,
    tags: ["UI/UX", "Graphic Design", "Animation"],
    rec: true,
  },
  {
    id: "social",
    name: "Social Impact Leaders",
    description: "Komunitas untuk mereka yang ingin membuat perubahan positif di masyarakat.",
    cat: "Social",
    members: 567,
    discussions: 78,
    tags: ["Social Work", "NGO", "Community Dev"],
    rec: false,
  },
  {
    id: "startup",
    name: "Startup Builders Indonesia",
    description: "Ekosistem bagi para founder, co-founder, dan builder startup Indonesia.",
    cat: "Marketing",
    members: 2031,
    discussions: 320,
    tags: ["Startup", "Bisnis", "Growth"],
    rec: false,
  },
  {
    id: "seni",
    name: "Seniman Digital Nusantara",
    description: "Ruang kreatif bagi seniman dan kreator konten digital Indonesia.",
    cat: "Seni",
    members: 445,
    discussions: 55,
    tags: ["Seni", "Digital Art", "Ilustrasi"],
    rec: false,
  },
  {
    id: "growth",
    name: "Pengembangan Diri Kolektif",
    description: "Belajar bersama, tumbuh bersama — mindset, produktivitas, dan self-mastery.",
    cat: "Pengembangan Diri",
    members: 3102,
    discussions: 412,
    tags: ["Mindset", "Produktivitas", "Habit"],
    rec: false,
  },
];

const PAGE_ITEMS = 3; // per page

// ─── Community card ──────────────────────────────────────────────────────────
function CommCard({
  comm,
  joined,
  onJoin,
}: {
  comm: (typeof FALLBACK_COMMUNITIES)[0];
  joined: boolean;
  onJoin: () => void;
}) {
  const [bg, fg] = CAT_PILL[comm.cat] ?? CAT_PILL.Technology;

  return (
    <div
      className="rounded-2xl transition-shadow hover:shadow-lg"
      style={{
        background: "white",
        border: "1px solid var(--tk-gray-200)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* top badges */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            borderRadius: 99,
            background: bg,
            color: fg,
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 11.5,
          }}
        >
          <Users size={12} /> {comm.cat}
        </span>
        {comm.rec && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: 99,
              background: "var(--tk-lilac)",
              color: "#5B21B6",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 11.5,
            }}
          >
            Rekomendasi
          </span>
        )}
      </div>

      {/* name + desc */}
      <h3
        style={{
          fontFamily: "var(--tk-font-display)",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--tk-ink)",
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {comm.name}
      </h3>
      <p style={{ color: "var(--tk-gray-600)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
        {comm.description}
      </p>

      {/* stats */}
      <div
        className="flex items-center gap-4"
        style={{ fontSize: 13, color: "var(--tk-gray-600)", marginBottom: 14 }}
      >
        <span className="flex items-center gap-1.5">
          <Users size={14} /> {comm.members.toLocaleString("id-ID")} peserta
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle size={14} /> {comm.discussions} diskusi
        </span>
      </div>

      {/* tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {comm.tags.map(t => (
          <span
            key={t}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: 99,
              background: bg,
              color: fg,
              fontFamily: "var(--tk-font-sans)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {t}
          </span>
        ))}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 8px",
            borderRadius: 99,
            background: "var(--tk-gray-100)",
            color: "var(--tk-gray-500)",
            fontFamily: "var(--tk-font-sans)",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          +1
        </span>
      </div>

      {/* join button */}
      <button
        onClick={onJoin}
        className="w-full flex items-center justify-center gap-2 rounded-xl transition-all"
        style={{
          padding: "9px 14px",
          cursor: "pointer",
          fontFamily: "var(--tk-font-display)",
          fontWeight: 700,
          fontSize: 13.5,
          background: joined ? "var(--tk-blue-600)" : "var(--tk-gray-50)",
          color: joined ? "#fff" : "var(--tk-gray-700)",
          border: joined ? "none" : "1px solid var(--tk-gray-200)",
        } as React.CSSProperties}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = joined ? "var(--tk-blue-700)" : "var(--tk-gray-100)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = joined ? "var(--tk-blue-600)" : "var(--tk-gray-50)";
        }}
      >
        {joined ? <><Check size={14} /> Bergabung</> : "Bergabung"}
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const CommunityPreview = ({ userAssessment, userInterests, profile }: CommunityPreviewProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [communities, setCommunities] = useState(FALLBACK_COMMUNITIES);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [joinedMap, setJoinedMap]     = useState<Record<string, boolean>>(
    () => Object.fromEntries(FALLBACK_COMMUNITIES.map(c => [c.id, false]))
  );

  const totalPages = Math.ceil(communities.length / PAGE_ITEMS);
  const visible    = communities.slice(page * PAGE_ITEMS, page * PAGE_ITEMS + PAGE_ITEMS);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("community_events")
          .select("id, title, description, event_type, location, event_date, max_participants, current_participants")
          .eq("is_active", true)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(6);

        if (!error && data && data.length > 0) {
          const mapped = data.map((e: any) => ({
            id: e.id,
            name: e.title,
            description: e.description || "",
            cat: e.event_type || "Community",
            members: e.current_participants ?? 0,
            discussions: 0,
            tags: [],
            rec: false,
          }));
          setCommunities(mapped);
          setJoinedMap(Object.fromEntries(mapped.map((c: any) => [c.id, false])));
        } else {
          // sort by RIASEC match
          let sorted = [...FALLBACK_COMMUNITIES];
          const pt = userAssessment?.personality_type?.toLowerCase();
          if (pt) {
            const MAP: Record<string, string> = {
              realistic: "Technology", investigative: "Technology",
              artistic: "Seni", social: "Social", enterprising: "Marketing",
              conventional: "Pengembangan Diri",
            };
            const preferred = MAP[pt];
            if (preferred) {
              sorted = [
                ...sorted.filter(c => c.cat === preferred),
                ...sorted.filter(c => c.cat !== preferred),
              ];
            }
          }
          setCommunities(sorted);
        }
      } catch (err) {
        console.error("CommunityPreview error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userAssessment]);

  const toggleJoin = (id: string) => setJoinedMap(m => ({ ...m, [id]: !m[id] }));

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--tk-gray-400)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
        Memuat komunitas…
      </div>
    );
  }

  return (
    <div className="tk-page-in" style={{ paddingTop: 8 }}>
      {/* ── Centered header ────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "16px 0 20px", position: "relative" }}>
        <span className="tk-sparkle" style={{ position: "absolute", top: 0, left: 120, fontSize: 14, color: "var(--tk-blue-500)" }}>✦</span>
        <span className="tk-sparkle" style={{ position: "absolute", top: 30, right: 160, fontSize: 18, color: "var(--tk-yellow)" }}>✦</span>

        <h2
          className="inline-flex items-center gap-3"
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 30,
            color: "var(--tk-ink)",
            letterSpacing: "-.02em",
          }}
        >
          <Users size={26} style={{ color: "var(--tk-blue-600)" }} />
          Community for{" "}
          <span style={{ color: "var(--tk-blue-600)" }}>You</span>
        </h2>
        <p style={{ color: "var(--tk-gray-500)", margin: "6px auto 0", fontSize: 14 }}>
          Bergabung dengan komunitas yang sesuai minat dan kepribadianmu
        </p>

        {/* decorative */}
        <MessageSquare size={26} style={{ position: "absolute", top: 0, right: 40, color: "var(--tk-blue-300)", opacity: 0.7 }} />
        <Heart size={18} style={{ position: "absolute", top: 52, right: 90, color: "var(--tk-orange)", opacity: 0.6 }} />
      </div>

      {/* ── 3-col community cards ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 18 }}>
        {visible.map(c => (
          <CommCard
            key={c.id}
            comm={c}
            joined={!!joinedMap[c.id]}
            onJoin={() => toggleJoin(c.id)}
          />
        ))}
      </div>

      {/* ── Pagination dots ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 22 : 8,
                height: 8,
                borderRadius: 99,
                border: "none",
                background: i === page ? "var(--tk-blue-600)" : "var(--tk-gray-300)",
                cursor: "pointer",
                transition: "all .25s",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Explore CTA ────────────────────────────────────────── */}
      <div className="flex justify-center mt-5">
        <button
          onClick={() => navigate("/community")}
          className="inline-flex items-center gap-2 rounded-2xl transition-all"
          style={{
            padding: "12px 28px",
            background: "var(--tk-blue-600)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
        >
          <Users size={16} /> Explore All Communities <ArrowRight size={16} />
        </button>
      </div>

      {/* ── Career CTA Banner ───────────────────────────────────── */}
      <div
        style={{
          marginTop: 28,
          borderRadius: 20,
          padding: "30px 36px",
          background: "linear-gradient(135deg, #E8F1FF, #FFEDE2)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <MessageSquare
          size={72}
          style={{ color: "var(--tk-blue-600)", opacity: 0.85, flexShrink: 0 }}
        />
        <div style={{ flex: 1, textAlign: "center" }}>
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--tk-ink)",
              marginBottom: 6,
            }}
          >
            Siap Mengembangkan Karir?
          </h3>
          <p
            style={{
              color: "var(--tk-gray-600)",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: "60ch",
              margin: "0 auto 16px",
            }}
          >
            Bergabung dengan sistem membership Talentika untuk akses penuh ke fitur
            assessment, mentorship, dan networking profesional.
          </p>
          <button
            onClick={() => navigate("/membership")}
            className="inline-flex items-center gap-2 rounded-xl transition-all"
            style={{
              padding: "10px 24px",
              background: "var(--tk-blue-600)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
          >
            Akses Membership Dashboard <ArrowRight size={14} />
          </button>
        </div>
        <span className="tk-sparkle" style={{ position: "absolute", top: 20, right: 60, fontSize: 16, color: "var(--tk-yellow)" }}>✦</span>
        <span className="tk-sparkle" style={{ position: "absolute", top: 60, right: 140, fontSize: 12, color: "var(--tk-blue-500)" }}>✦</span>
      </div>
    </div>
  );
};

export default CommunityPreview;
