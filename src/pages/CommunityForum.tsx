import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import {
  MessageSquare,
  Users,
  Calendar,
  Search,
  Plus,
  Heart,
  MessageCircle,
  BookOpen,
  Code,
  Palette,
  FlaskConical,
  Briefcase,
  Leaf,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  category: string;
  replies: number;
  likes: number;
  timestamp: string;
  isHot?: boolean;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  nextMeeting: string;
  isActive: boolean;
}

// C-05: Real event type from community_events table
interface Event {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  duration_minutes: number;
  max_participants: number | null;
  current_participants: number;
  location: string | null;
  is_premium_only: boolean;
  is_active: boolean;
}

/* ─── Token shortcuts (local constants for readability) ─── */
const TK = {
  ink: "var(--tk-ink)",
  blue50: "var(--tk-blue-50)",
  blue600: "var(--tk-blue-600)",
  blue700: "var(--tk-blue-700)",
  gray0: "var(--tk-gray-0)",
  gray50: "var(--tk-gray-50)",
  gray100: "var(--tk-gray-100)",
  gray200: "var(--tk-gray-200)",
  gray400: "var(--tk-gray-400)",
  gray500: "var(--tk-gray-500)",
  gray600: "var(--tk-gray-600)",
  gray700: "var(--tk-gray-700)",
  orange: "var(--tk-orange)",
  orangeSoft: "var(--tk-orange-soft)",
  display: "var(--tk-font-display)",
  sans: "var(--tk-font-sans)",
  shadowSm: "var(--tk-shadow-sm)",
  shadow: "var(--tk-shadow)",
  radius: "var(--tk-radius)",
  radiusLg: "var(--tk-radius-lg)",
};

/* ─── Helpers ────────────────────────────────────────────── */
const avatarGradients = [
  "linear-gradient(135deg,#1D4ED8,#3B82F6)",
  "linear-gradient(135deg,#7C3AED,#A855F7)",
  "linear-gradient(135deg,#059669,#34D399)",
  "linear-gradient(135deg,#FF6A00,#FF8A33)",
];

const getAvatarGradient = (name: string) =>
  avatarGradients[name.charCodeAt(0) % avatarGradients.length];

/* ═══════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════ */
const CommunityForum = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("community");
  const [activeTab, setActiveTab] = useState<
    "discussions" | "study-groups" | "mentorship" | "events"
  >("discussions");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  // C-05: Real data states
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  /* ── Sign-out ────────────────────────────────────────── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  /* ── Section navigation (sidebar) ───────────────────── */
  const handleSectionChange = (section: string) => {
    if (section === "community") return;
    if (section === "timeline") { navigate("/discovery"); return; }
    navigate("/dashboard");
  };

  /* ── C-05: Load real events from community_events table ── */
  useEffect(() => {
    if (activeTab !== "events") return;
    setEventsLoading(true);
    supabase
      .from("community_events")
      .select("id,title,event_type,event_date,duration_minutes,max_participants,current_participants,location,is_premium_only,is_active")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setUpcomingEvents((data || []) as Event[]);
        setEventsLoading(false);
      });
  }, [activeTab]);

  /* ── Forum posts: no table yet — empty state ── */
  const forumPosts: ForumPost[] = [];

  /* ── Study groups: no table yet — empty state ── */
  const studyGroups: StudyGroup[] = [];

  const categories = [
    { id: "all",            name: "Semua",           icon: MessageSquare },
    { id: "tech",           name: "Teknologi",       icon: Code          },
    { id: "art",            name: "Seni & Kreativitas", icon: Palette    },
    { id: "science",        name: "Sains",           icon: FlaskConical  },
    { id: "business",       name: "Bisnis",          icon: Briefcase     },
    { id: "sustainability", name: "Sustainability",  icon: Leaf          },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    return cat ? cat.icon : MessageSquare;
  };

  const getEventTypeColor = (
    type: string
  ): { bg: string; color: string } => {
    switch (type) {
      case "workshop":
        return { bg: TK.blue50, color: TK.blue700 };
      case "webinar":
        return { bg: "var(--tk-mint)", color: "var(--tk-green-dark)" };
      case "meetup":
        return { bg: "var(--tk-lilac)", color: "#5B21B6" };
      case "bootcamp":
        return { bg: TK.orangeSoft, color: "#C04400" };
      default:
        return { bg: TK.gray100, color: TK.gray700 };
    }
  };

  /* ── Filtered posts ──────────────────────────────────── */
  const filteredPosts = forumPosts.filter((post) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q) ||
      post.author.toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /* ── Tab config ──────────────────────────────────────── */
  const tabs = [
    { id: "discussions",  label: "Diskusi",       icon: MessageSquare },
    { id: "study-groups", label: "Study Groups",  icon: BookOpen      },
    { id: "mentorship",   label: "Mentorship",    icon: Users         },
    { id: "events",       label: "Events",        icon: Calendar      },
  ] as const;

  /* ─────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: TK.gray50, fontFamily: TK.sans }}
    >
      {/* Sidebar */}
      <DashboardSidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        onSignOut={handleSignOut}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader
          user={null}
          profile={null}
          onSignOut={handleSignOut}
        />

        {/* Page content */}
        <main
          className="flex-1 overflow-auto pb-20 md:pb-6 tk-page-in"
          style={{ padding: "0 28px 60px" }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>

            {/* ── Hero header ─────────────────────────────── */}
            <div
              style={{
                textAlign: "center",
                padding: "40px 0 32px",
                position: "relative",
              }}
            >
              {/* Sparkle decorations */}
              <span
                className="tk-sparkle"
                style={{
                  position: "absolute",
                  top: 24,
                  left: "15%",
                  fontSize: 18,
                  color: TK.blue600,
                  opacity: 0.5,
                }}
              >
                ✦
              </span>
              <span
                className="tk-sparkle"
                style={{
                  position: "absolute",
                  top: 48,
                  right: "18%",
                  fontSize: 12,
                  color: TK.orange,
                  opacity: 0.6,
                  animationDelay: "1.2s",
                }}
              >
                ✦
              </span>
              <span
                className="tk-sparkle"
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "25%",
                  fontSize: 10,
                  color: TK.blue700,
                  opacity: 0.4,
                  animationDelay: "2.4s",
                }}
              >
                ✦
              </span>

              {/* Icon */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <Users size={28} style={{ color: TK.blue600 }} />
              </div>

              {/* Heading */}
              <h1
                style={{
                  fontFamily: TK.display,
                  fontWeight: 800,
                  fontSize: 32,
                  color: TK.ink,
                  margin: "0 0 10px",
                  lineHeight: 1.2,
                }}
              >
                Community for{" "}
                <span style={{ color: TK.blue600 }}>You</span>
              </h1>

              {/* Sub */}
              <p
                style={{
                  color: TK.gray500,
                  fontFamily: TK.sans,
                  fontSize: 15,
                  margin: "0 0 24px",
                }}
              >
                Bergabung, diskusi, dan tumbuh bersama komunitas
              </p>

              {/* Stat pills */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "15k+ Members" },
                  { label: "1k+ Diskusi" },
                  { label: "24/7 Aktif" },
                ].map((s) => (
                  <span
                    key={s.label}
                    style={{
                      background: TK.blue50,
                      color: TK.blue700,
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "6px 18px",
                      borderRadius: 999,
                    }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Search bar ──────────────────────────────── */}
            <div
              style={{
                maxWidth: 560,
                margin: "0 auto 20px",
                background: TK.gray0,
                borderRadius: 16,
                border: `1px solid ${TK.gray200}`,
                boxShadow: TK.shadowSm,
                display: "flex",
                alignItems: "center",
                padding: "10px 16px",
                gap: 10,
              }}
            >
              <Search size={18} style={{ color: TK.gray400, flexShrink: 0 }} />
              <input
                placeholder="Cari diskusi, topik, atau pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontFamily: TK.sans,
                  fontSize: 14,
                  color: TK.ink,
                  background: "transparent",
                }}
              />
            </div>

            {/* ── Category filter pills ────────────────────── */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 16px",
                      borderRadius: 999,
                      border: `1px solid ${isActive ? TK.blue600 : TK.gray200}`,
                      background: isActive ? TK.blue600 : TK.gray0,
                      color: isActive ? "#fff" : TK.gray700,
                      fontFamily: TK.display,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all .18s ease",
                    }}
                  >
                    <Icon size={14} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* ── Tab switcher ─────────────────────────────── */}
            <div
              style={{
                display: "flex",
                gap: 4,
                background: TK.gray100,
                borderRadius: 16,
                padding: 4,
                marginBottom: 28,
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 4px",
                      borderRadius: 12,
                      border: "none",
                      background: isActive ? TK.gray0 : "transparent",
                      boxShadow: isActive ? TK.shadowSm : "none",
                      color: isActive ? TK.blue700 : TK.gray500,
                      fontFamily: TK.display,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all .18s ease",
                    }}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ══ DISCUSSIONS tab ══════════════════════════════ */}
            {activeTab === "discussions" && (
              <div>
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 20,
                      color: TK.ink,
                      margin: 0,
                    }}
                  >
                    Diskusi Terbaru
                  </h2>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 18px",
                      borderRadius: 10,
                      border: "none",
                      background: TK.blue600,
                      color: "#fff",
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} />
                    Buat Diskusi
                  </button>
                </div>

                {/* Post list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filteredPosts.map((post) => {
                    const CategoryIcon = getCategoryIcon(post.category);
                    const initial = post.author.charAt(0).toUpperCase();
                    return (
                      <div
                        key={post.id}
                        style={{
                          background: TK.gray0,
                          border: `1px solid ${TK.gray200}`,
                          borderRadius: TK.radiusLg,
                          padding: 20,
                          cursor: "pointer",
                          transition: "box-shadow .2s ease",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.boxShadow =
                            TK.shadow)
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.boxShadow =
                            "none")
                        }
                      >
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                          {/* Avatar */}
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: getAvatarGradient(post.author),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              fontFamily: TK.display,
                              fontWeight: 700,
                              fontSize: 16,
                              color: "#fff",
                            }}
                          >
                            {initial}
                          </div>

                          {/* Body */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Title + Hot badge */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: TK.display,
                                  fontWeight: 600,
                                  fontSize: 15,
                                  color: TK.ink,
                                }}
                              >
                                {post.title}
                              </span>
                              {post.isHot && (
                                <span
                                  style={{
                                    background: TK.orangeSoft,
                                    color: "#C04400",
                                    fontFamily: TK.display,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    padding: "2px 9px",
                                    borderRadius: 999,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  🔥 Hot
                                </span>
                              )}
                            </div>

                            {/* Content preview */}
                            <p
                              style={{
                                fontFamily: TK.sans,
                                fontSize: 13,
                                color: TK.gray500,
                                margin: "0 0 12px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {post.content}
                            </p>

                            {/* Footer row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  fontSize: 12,
                                  color: TK.gray500,
                                  fontFamily: TK.sans,
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <CategoryIcon size={13} />
                                  {post.author}
                                </span>
                                <span>{post.timestamp}</span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 14,
                                  fontSize: 13,
                                  color: TK.gray500,
                                  fontFamily: TK.sans,
                                }}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  ❤️ {post.likes}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  💬 {post.replies}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredPosts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 0", color: TK.gray500, fontFamily: TK.sans, fontSize: 14 }}>
                      <MessageSquare size={40} style={{ margin: "0 auto 12px", opacity: .3, display: "block" }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: TK.gray600 }}>Forum diskusi segera hadir!</p>
                      <p style={{ margin: "6px 0 0", fontSize: 13, opacity: .7 }}>Fitur forum komunitas sedang dalam pengembangan. Nantikan pembaruan berikutnya!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ STUDY GROUPS tab ══════════════════════════════ */}
            {activeTab === "study-groups" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 20,
                      color: TK.ink,
                      margin: 0,
                    }}
                  >
                    Study Groups Aktif
                  </h2>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 18px",
                      borderRadius: 10,
                      border: "none",
                      background: TK.blue600,
                      color: "#fff",
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} />
                    Buat Study Group
                  </button>
                </div>

                {studyGroups.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 0", color: TK.gray500, fontFamily: TK.sans }}>
                    <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .3, display: "block" }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: TK.gray600 }}>Study Groups segera hadir!</p>
                    <p style={{ margin: "6px 0 0", fontSize: 13, opacity: .7 }}>Fitur study group komunitas sedang dalam pengembangan.</p>
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 18,
                  }}
                >
                  {studyGroups.map((group) => {
                    const CategoryIcon = getCategoryIcon(group.category);
                    return (
                      <div
                        key={group.id}
                        style={{
                          background: TK.gray0,
                          border: `1px solid ${TK.gray200}`,
                          borderRadius: TK.radiusLg,
                          padding: 20,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          transition: "box-shadow .2s ease",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.boxShadow =
                            TK.shadow)
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.boxShadow =
                            "none")
                        }
                      >
                        {/* Category label */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: TK.blue600,
                            fontSize: 12,
                            fontFamily: TK.display,
                            fontWeight: 600,
                          }}
                        >
                          <CategoryIcon size={14} />
                          {categories.find((c) => c.id === group.category)?.name ?? group.category}
                        </div>

                        {/* Name */}
                        <h3
                          style={{
                            fontFamily: TK.display,
                            fontWeight: 700,
                            fontSize: 17,
                            color: TK.ink,
                            margin: 0,
                          }}
                        >
                          {group.name}
                        </h3>

                        {/* Description */}
                        <p
                          style={{
                            fontFamily: TK.sans,
                            fontSize: 13,
                            color: TK.gray500,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {group.description}
                        </p>

                        {/* Meta */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: TK.gray500,
                            fontFamily: TK.sans,
                          }}
                        >
                          <span>
                            👥 {group.members} anggota
                          </span>
                          <span>{group.nextMeeting}</span>
                        </div>

                        {/* Join button */}
                        <button
                          style={{
                            marginTop: 4,
                            width: "100%",
                            padding: "10px 0",
                            borderRadius: 10,
                            border: `1px solid ${group.isActive ? TK.blue600 : TK.gray200}`,
                            background: group.isActive ? TK.blue600 : TK.gray0,
                            color: group.isActive ? "#fff" : TK.gray700,
                            fontFamily: TK.display,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                          }}
                        >
                          Gabung Group
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ MENTORSHIP tab ══════════════════════════════ */}
            {activeTab === "mentorship" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "16px 0",
                }}
              >
                <div
                  style={{
                    background: TK.gray0,
                    border: `1px solid ${TK.gray200}`,
                    borderRadius: TK.radiusLg,
                    padding: "56px 40px",
                    textAlign: "center",
                    maxWidth: 480,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: TK.blue50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={32} style={{ color: TK.blue600 }} />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 20,
                      color: TK.ink,
                      margin: "0 0 10px",
                    }}
                  >
                    Mentorship Corner
                  </h3>
                  <p
                    style={{
                      fontFamily: TK.sans,
                      fontSize: 14,
                      color: TK.gray500,
                      margin: "0 0 28px",
                    }}
                  >
                    Connect dengan mentor berpengalaman dan alumni sukses
                  </p>

                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    <button
                      style={{
                        padding: "10px 22px",
                        borderRadius: 10,
                        border: "none",
                        background: TK.blue600,
                        color: "#fff",
                        fontFamily: TK.display,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Cari Mentor
                    </button>
                    <button
                      style={{
                        padding: "10px 22px",
                        borderRadius: 10,
                        border: `1px solid ${TK.gray200}`,
                        background: TK.gray0,
                        color: TK.gray700,
                        fontFamily: TK.display,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Jadi Mentor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ══ EVENTS tab ══════════════════════════════════ */}
            {activeTab === "events" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 20,
                      color: TK.ink,
                      margin: 0,
                    }}
                  >
                    Upcoming Events
                  </h2>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 18px",
                      borderRadius: 10,
                      border: "none",
                      background: TK.blue600,
                      color: "#fff",
                      fontFamily: TK.display,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={16} />
                    Buat Event
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {eventsLoading ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: TK.gray500, fontFamily: TK.sans }}>Memuat events...</div>
                  ) : upcomingEvents.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: TK.gray500, fontFamily: TK.sans }}>
                      <Calendar size={36} style={{ margin: "0 auto 10px", opacity: .35, display: "block" }} />
                      <p style={{ fontSize: 14, margin: 0 }}>Belum ada event yang akan datang.</p>
                      <p style={{ fontSize: 13, marginTop: 6, opacity: .7 }}>Pantau terus untuk event berikutnya!</p>
                    </div>
                  ) : upcomingEvents.map((event) => {
                    const typeStyle = getEventTypeColor(event.event_type as any);
                    const eventDate = new Date(event.event_date);
                    const isOnline = !event.location || event.location.toLowerCase().includes("online");
                    return (
                      <div
                        key={event.id}
                        style={{
                          background: TK.gray0,
                          border: `1px solid ${TK.gray200}`,
                          borderRadius: TK.radiusLg,
                          padding: "18px 20px",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          flexWrap: "wrap",
                          cursor: "pointer",
                          transition: "box-shadow .2s ease",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = TK.shadow)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
                      >
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: TK.display, fontWeight: 600, fontSize: 15, color: TK.ink }}>{event.title}</span>
                            <span style={{ background: typeStyle.bg, color: typeStyle.color, fontFamily: TK.display, fontWeight: 700, fontSize: 11, padding: "2px 10px", borderRadius: 999, textTransform: "capitalize" }}>
                              {event.event_type}
                            </span>
                            {isOnline && (
                              <span style={{ background: TK.gray100, color: TK.gray600, fontFamily: TK.display, fontWeight: 600, fontSize: 11, padding: "2px 10px", borderRadius: 999 }}>Online</span>
                            )}
                            {event.is_premium_only && (
                              <span style={{ background: "var(--tk-yellow-soft)", color: "#A47000", fontFamily: TK.display, fontWeight: 700, fontSize: 11, padding: "2px 10px", borderRadius: 999 }}>Premium</span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 16, fontSize: 13, color: TK.gray500, fontFamily: TK.sans, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={13} />
                              {eventDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} • {eventDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Users size={13} />
                              {event.current_participants}{event.max_participants ? `/${event.max_participants}` : ""} peserta
                            </span>
                          </div>
                        </div>
                        <button style={{ flexShrink: 0, padding: "9px 20px", borderRadius: 10, border: "none", background: TK.blue600, color: "#fff", fontFamily: TK.display, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                          Daftar Sekarang
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>

        <BottomNavigationBar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
    </div>
  );
};

export default CommunityForum;
