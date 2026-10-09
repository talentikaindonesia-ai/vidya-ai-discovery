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
  Lock,
  Send,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { LockedButton } from "@/components/payment/LockedButton";

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const COMMUNITY_BENEFITS = [
  "Buat diskusi, study group & event komunitas",
  "Akses event eksklusif member Premium",
  "Networking dengan pelajar berprestasi se-Indonesia",
];

/* ─── Types ─────────────────────────────────────────────── */
interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  replies: number;
  likes: number;
  timestamp: string;
  isHot?: boolean;
  likedByMe: boolean;
}

interface ForumReply {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  category: string;
  nextMeeting: string;
  isActive: boolean;
  joinedByMe: boolean;
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
  banner_url?: string | null;
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

  // Forum posts (real)
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [repliesByPost, setRepliesByPost] = useState<Record<string, ForumReply[]>>({});
  const [replyInput, setReplyInput] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [likeBusy, setLikeBusy] = useState<string | null>(null);

  // Study groups (real)
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [showGroupComposer, setShowGroupComposer] = useState(false);
  const [groupJoinBusy, setGroupJoinBusy] = useState<string | null>(null);

  const loadForumPosts = async () => {
    setPostsLoading(true);
    const { data, error } = await rpc("list_forum_posts", { p_category: selectedCategory === "all" ? null : selectedCategory });
    if (error) toast.error("Gagal memuat diskusi: " + error.message);
    setForumPosts(((data as any[]) ?? []).map(p => ({
      id: p.id, title: p.title, content: p.content, author: p.author, category: p.category,
      replies: Number(p.replies), likes: Number(p.likes), timestamp: timeAgo(p.created_at),
      isHot: p.is_hot, likedByMe: p.liked_by_me,
    })));
    setPostsLoading(false);
  };

  const loadStudyGroups = async () => {
    setGroupsLoading(true);
    const { data, error } = await rpc("list_study_groups", { p_category: selectedCategory === "all" ? null : selectedCategory });
    if (error) toast.error("Gagal memuat study group: " + error.message);
    setStudyGroups(((data as any[]) ?? []).map(g => ({
      id: g.id, name: g.name, description: g.description ?? "", members: Number(g.members),
      maxMembers: g.max_members, category: g.category, nextMeeting: g.meeting_schedule || "Jadwal menyusul",
      isActive: g.is_active, joinedByMe: g.joined_by_me,
    })));
    setGroupsLoading(false);
  };

  useEffect(() => {
    if (activeTab === "discussions") loadForumPosts();
    if (activeTab === "study-groups") loadStudyGroups();
  }, [activeTab, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLike = async (postId: string) => {
    setLikeBusy(postId);
    const { data, error } = await rpc("toggle_post_like", { p_post_id: postId }) as { data: { liked: boolean; likes: number } | null; error: { message: string } | null };
    setLikeBusy(null);
    if (error) { toast.error(error.message); return; }
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, likedByMe: !!data?.liked, likes: data?.likes ?? p.likes } : p));
  };

  const toggleReplies = async (postId: string) => {
    if (expandedPostId === postId) { setExpandedPostId(null); return; }
    setExpandedPostId(postId);
    if (!repliesByPost[postId]) {
      const { data, error } = await rpc("get_post_replies", { p_post_id: postId });
      if (error) { toast.error(error.message); return; }
      setRepliesByPost(prev => ({
        ...prev,
        [postId]: ((data as any[]) ?? []).map(r => ({ id: r.id, content: r.content, author: r.author, timestamp: timeAgo(r.created_at) })),
      }));
    }
  };

  const submitReply = async (postId: string) => {
    if (!replyInput.trim()) return;
    setReplySubmitting(true);
    const { error } = await rpc("create_forum_reply", { p_post_id: postId, p_content: replyInput.trim() });
    setReplySubmitting(false);
    if (error) { toast.error(error.message); return; }
    setReplyInput("");
    const { data } = await rpc("get_post_replies", { p_post_id: postId });
    setRepliesByPost(prev => ({ ...prev, [postId]: ((data as any[]) ?? []).map(r => ({ id: r.id, content: r.content, author: r.author, timestamp: timeAgo(r.created_at) })) }));
    setForumPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: p.replies + 1 } : p));
    toast.success("Balasan terkirim!");
  };

  const joinGroup = async (groupId: string) => {
    setGroupJoinBusy(groupId);
    const { error } = await rpc("join_study_group", { p_group_id: groupId });
    setGroupJoinBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Berhasil gabung study group!");
    setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, joinedByMe: true, members: g.members + 1 } : g));
  };

  const leaveGroup = async (groupId: string) => {
    setGroupJoinBusy(groupId);
    const { error } = await rpc("leave_study_group", { p_group_id: groupId });
    setGroupJoinBusy(null);
    if (error) { toast.error(error.message); return; }
    setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, joinedByMe: false, members: Math.max(0, g.members - 1) } : g));
  };

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
      // banner_url belum ada di tipe hasil generate Supabase
      .from("community_events" as any)
      .select("id,title,event_type,event_date,duration_minutes,max_participants,current_participants,location,is_premium_only,is_active,banner_url")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setUpcomingEvents((data || []) as Event[]);
        setEventsLoading(false);
      });
  }, [activeTab]);

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
                  <LockedButton
                    feature="Buat Diskusi"
                    benefits={COMMUNITY_BENEFITS}
                    fromPath="/community"
                    onClick={() => setShowPostComposer(true)}
                  >
                    {(locked, guardedClick) => (
                      <button
                        onClick={guardedClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: locked ? "linear-gradient(135deg,#475569,#334155)" : TK.blue600,
                          color: "#fff",
                          fontFamily: TK.display,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        {locked ? <Lock size={14} /> : <Plus size={16} />}
                        Buat Diskusi
                      </button>
                    )}
                  </LockedButton>
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
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                                  disabled={likeBusy === post.id}
                                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, color: post.likedByMe ? "#DC2626" : TK.gray500, fontWeight: post.likedByMe ? 700 : 400 }}
                                >
                                  {post.likedByMe ? "❤️" : "🤍"} {post.likes}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleReplies(post.id); }}
                                  style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, color: TK.gray500 }}
                                >
                                  💬 {post.replies} {expandedPostId === post.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              </div>
                            </div>

                            {/* Reply thread (expandable) */}
                            {expandedPostId === post.id && (
                              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${TK.gray100}`, display: "flex", flexDirection: "column", gap: 10 }}>
                                {(repliesByPost[post.id] ?? []).map(r => (
                                  <div key={r.id} style={{ display: "flex", gap: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: getAvatarGradient(r.author), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: TK.display, fontWeight: 700, fontSize: 12, color: "#fff" }}>
                                      {r.author.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, background: TK.gray50, borderRadius: 10, padding: "8px 12px" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: TK.ink, fontFamily: TK.display }}>{r.author}</span>
                                        <span style={{ fontSize: 11, color: TK.gray400 }}>{r.timestamp}</span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: 13, color: TK.gray700, fontFamily: TK.sans }}>{r.content}</p>
                                    </div>
                                  </div>
                                ))}
                                {(repliesByPost[post.id] ?? []).length === 0 && (
                                  <p style={{ fontSize: 12.5, color: TK.gray400, textAlign: "center", margin: "4px 0" }}>Belum ada balasan. Jadilah yang pertama!</p>
                                )}
                                <div style={{ display: "flex", gap: 8 }}>
                                  <input
                                    value={replyInput}
                                    onChange={e => setReplyInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !replySubmitting) submitReply(post.id); }}
                                    placeholder="Tulis balasan..."
                                    style={{ flex: 1, padding: "9px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 13, outline: "none" }}
                                  />
                                  <button
                                    onClick={() => submitReply(post.id)}
                                    disabled={replySubmitting || !replyInput.trim()}
                                    style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: TK.blue600, color: "#fff", cursor: replySubmitting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: replyInput.trim() ? 1 : 0.5 }}
                                  >
                                    {replySubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {postsLoading ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}><Loader2 size={26} className="animate-spin" style={{ color: TK.blue600, margin: "0 auto" }} /></div>
                  ) : filteredPosts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 0", color: TK.gray500, fontFamily: TK.sans, fontSize: 14 }}>
                      <MessageSquare size={40} style={{ margin: "0 auto 12px", opacity: .3, display: "block" }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: TK.gray600 }}>Belum ada diskusi</p>
                      <p style={{ margin: "6px 0 0", fontSize: 13, opacity: .7 }}>Jadilah yang pertama memulai diskusi di kategori ini!</p>
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
                  <LockedButton
                    feature="Buat Study Group"
                    benefits={COMMUNITY_BENEFITS}
                    fromPath="/community"
                    onClick={() => setShowGroupComposer(true)}
                  >
                    {(locked, guardedClick) => (
                      <button
                        onClick={guardedClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: locked ? "linear-gradient(135deg,#475569,#334155)" : TK.blue600,
                          color: "#fff",
                          fontFamily: TK.display,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        {locked ? <Lock size={14} /> : <Plus size={16} />}
                        Buat Study Group
                      </button>
                    )}
                  </LockedButton>
                </div>

                {groupsLoading ? (
                  <div style={{ textAlign: "center", padding: "48px 0" }}><Loader2 size={26} className="animate-spin" style={{ color: TK.blue600, margin: "0 auto" }} /></div>
                ) : studyGroups.length === 0 && (
                  <div style={{ textAlign: "center", padding: "48px 0", color: TK.gray500, fontFamily: TK.sans }}>
                    <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .3, display: "block" }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: TK.gray600 }}>Belum ada study group</p>
                    <p style={{ margin: "6px 0 0", fontSize: 13, opacity: .7 }}>Jadilah yang pertama membuat study group di kategori ini!</p>
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
                            👥 {group.members}/{group.maxMembers} anggota
                          </span>
                          <span>{group.nextMeeting}</span>
                        </div>

                        {/* Join/Leave button */}
                        {group.joinedByMe ? (
                          <button
                            onClick={() => leaveGroup(group.id)}
                            disabled={groupJoinBusy === group.id}
                            style={{ marginTop: 4, width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${TK.gray200}`, background: TK.gray0, color: TK.gray700, fontFamily: TK.display, fontWeight: 700, fontSize: 14, cursor: groupJoinBusy === group.id ? "wait" : "pointer" }}
                          >
                            {groupJoinBusy === group.id ? "…" : "✓ Sudah Bergabung — Keluar"}
                          </button>
                        ) : (
                          <button
                            onClick={() => joinGroup(group.id)}
                            disabled={groupJoinBusy === group.id || group.members >= group.maxMembers}
                            style={{
                              marginTop: 4, width: "100%", padding: "10px 0", borderRadius: 10,
                              border: `1px solid ${TK.blue600}`, background: TK.blue600, color: "#fff",
                              fontFamily: TK.display, fontWeight: 700, fontSize: 14,
                              cursor: groupJoinBusy === group.id ? "wait" : "pointer",
                              opacity: group.members >= group.maxMembers ? 0.5 : 1,
                            }}
                          >
                            {groupJoinBusy === group.id ? "…" : group.members >= group.maxMembers ? "Penuh" : "Gabung Group"}
                          </button>
                        )}
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
                  <LockedButton
                    feature="Buat Event"
                    benefits={COMMUNITY_BENEFITS}
                    fromPath="/community"
                    onClick={() => toast.info("Fitur buat event segera hadir 🚧")}
                  >
                    {(locked, guardedClick) => (
                      <button
                        onClick={guardedClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "9px 18px",
                          borderRadius: 10,
                          border: "none",
                          background: locked ? "linear-gradient(135deg,#475569,#334155)" : TK.blue600,
                          color: "#fff",
                          fontFamily: TK.display,
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        {locked ? <Lock size={14} /> : <Plus size={16} />}
                        Buat Event
                      </button>
                    )}
                  </LockedButton>
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
                        {event.banner_url && (
                          <img src={event.banner_url} alt="" loading="lazy"
                            style={{ width: 144, maxWidth: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
                        )}
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
                        {event.is_premium_only ? (
                          <LockedButton
                            feature="Event Eksklusif Premium"
                            benefits={COMMUNITY_BENEFITS}
                            fromPath="/community"
                            onClick={() => toast.info("Pendaftaran event segera dibuka 🚧")}
                          >
                            {(locked, guardedClick) => (
                              <button onClick={guardedClick} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 10, border: "none", background: locked ? "linear-gradient(135deg,#475569,#334155)" : TK.blue600, color: "#fff", fontFamily: TK.display, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                                {locked && <Lock size={13} />} Daftar Sekarang
                              </button>
                            )}
                          </LockedButton>
                        ) : (
                          <button onClick={() => toast.info("Pendaftaran event segera dibuka 🚧")} style={{ flexShrink: 0, padding: "9px 20px", borderRadius: 10, border: "none", background: TK.blue600, color: "#fff", fontFamily: TK.display, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                            Daftar Sekarang
                          </button>
                        )}
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

      {showPostComposer && (
        <PostComposerModal
          categories={categories.filter(c => c.id !== "all")}
          onClose={() => setShowPostComposer(false)}
          onDone={() => { setShowPostComposer(false); loadForumPosts(); }}
        />
      )}
      {showGroupComposer && (
        <GroupComposerModal
          categories={categories.filter(c => c.id !== "all")}
          onClose={() => setShowGroupComposer(false)}
          onDone={() => { setShowGroupComposer(false); loadStudyGroups(); }}
        />
      )}
    </div>
  );
};

/* ─── Post composer modal ───────────────────────────────── */
function PostComposerModal({ categories, onClose, onDone }: {
  categories: { id: string; name: string }[]; onClose: () => void; onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "tech");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Judul dan isi wajib diisi"); return; }
    setSaving(true);
    const { error } = await rpc("create_forum_post", { p_title: title.trim(), p_content: content.trim(), p_category: category });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Diskusi berhasil dibuat! 🎉");
    onDone();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 26px", width: "100%", maxWidth: 480, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: TK.gray100, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: TK.gray500, display: "grid", placeItems: "center" }}><X size={17} /></button>
        <div style={{ fontFamily: TK.display, fontWeight: 800, fontSize: 18, color: TK.ink, marginBottom: 18 }}>✍️ Buat Diskusi Baru</div>

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Kategori</label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Judul</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="mis. Cara memilih jurusan kuliah?"
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Isi Diskusi</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Ceritakan apa yang ingin kamu diskusikan..."
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 18, boxSizing: "border-box", resize: "vertical" }} />

        <button onClick={submit} disabled={saving}
          style={{ width: "100%", background: saving ? TK.gray200 : TK.blue600, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: TK.display, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Mempublikasikan…" : "Publikasikan Diskusi"}
        </button>
      </div>
    </div>
  );
}

/* ─── Study group composer modal ────────────────────────── */
function GroupComposerModal({ categories, onClose, onDone }: {
  categories: { id: string; name: string }[]; onClose: () => void; onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "tech");
  const [maxMembers, setMaxMembers] = useState(10);
  const [schedule, setSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast.error("Nama study group wajib diisi"); return; }
    setSaving(true);
    const { error } = await rpc("create_study_group", {
      p_name: name.trim(), p_description: description.trim() || null, p_category: category,
      p_max_members: maxMembers, p_meeting_schedule: schedule.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Study group berhasil dibuat! 🎉");
    onDone();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 26px", width: "100%", maxWidth: 480, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: TK.gray100, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: TK.gray500, display: "grid", placeItems: "center" }}><X size={17} /></button>
        <div style={{ fontFamily: TK.display, fontWeight: 800, fontSize: 18, color: TK.ink, marginBottom: 18 }}>👥 Buat Study Group</div>

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Kategori</label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Nama Group</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="mis. Belajar Data Science Bareng"
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box" }} />

        <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Deskripsi</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Apa yang akan dipelajari bersama?"
          style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", marginBottom: 14, boxSizing: "border-box", resize: "vertical" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Maks Anggota</label>
            <input type="number" min={2} max={100} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value) || 10)}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: TK.display, fontWeight: 600, fontSize: 12.5, color: TK.ink, marginBottom: 5 }}>Jadwal (opsional)</label>
            <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="mis. Sabtu 19:00"
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${TK.gray200}`, fontFamily: TK.sans, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={submit} disabled={saving}
          style={{ width: "100%", background: saving ? TK.gray200 : TK.blue600, color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: TK.display, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Membuat…" : "Buat Study Group"}
        </button>
      </div>
    </div>
  );
}

export default CommunityForum;
