import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Play, BookOpen, FileText, Star, Lock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DBCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface DBContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  category_id: string | null;
  difficulty_level: string | null;
  duration_minutes: number | null;
  is_premium: boolean | null;
  is_featured: boolean | null;
  tags: string[] | null;
  priority_score: number | null;
}

interface UserProgress {
  content_id: string;
  progress_percentage: number | null;
  status: string | null;
}

// ── Difficulty helpers ─────────────────────────────────────────────────────────

const DIFF: Record<string, { bg: string; color: string; label: string }> = {
  beginner:     { bg: "#D1FAE5", color: "#0F7A3E", label: "Pemula" },
  intermediate: { bg: "#FFEDE2", color: "#FF6A00", label: "Menengah" },
  advanced:     { bg: "#FEE2E2", color: "#DC2626", label: "Lanjutan" },
};

function diffStyle(level: string | null) {
  return DIFF[level ?? ""] ?? { bg: "#F1F5F9", color: "#64748B", label: "Umum" };
}

// ── Content type icon ──────────────────────────────────────────────────────────

function ContentIcon({ type }: { type: string }) {
  if (type === "video") return <Play size={14} />;
  if (type === "article") return <FileText size={14} />;
  return <BookOpen size={14} />;
}

// ── Duration formatter ─────────────────────────────────────────────────────────

function fmtDuration(mins: number | null) {
  if (!mins) return "—";
  if (mins < 60) return `${mins} mnt`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}j ${m}m` : `${h} jam`;
}

// ══════════════════════════════════════════════════════════════════════════════

const LearningHub = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection]     = useState("courses");
  const [categories, setCategories]           = useState<DBCategory[]>([]);
  const [allContent, setAllContent]           = useState<DBContent[]>([]);
  const [userProgress, setUserProgress]       = useState<UserProgress[]>([]);
  const [selectedCatId, setSelectedCatId]     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [loading, setLoading]                 = useState(true);
  const [enrolling, setEnrolling]             = useState<string | null>(null);
  const [profile, setProfile]                 = useState<{ full_name?: string; subscription_type?: string } | null>(null);
  const [userId, setUserId]                   = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);

      const [catRes, contentRes, profileRes, progressRes] = await Promise.all([
        supabase.from("learning_categories").select("id,name,description,icon,color").eq("is_active", true).order("name"),
        supabase.from("learning_content").select("id,title,description,content_type,category_id,difficulty_level,duration_minutes,is_premium,is_featured,tags,priority_score").eq("is_active", true).order("priority_score", { ascending: false }),
        supabase.from("profiles").select("full_name,subscription_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("learning_progress").select("content_id,progress_percentage,status").eq("user_id", user.id),
      ]);

      setCategories(catRes.data ?? []);
      setAllContent(contentRes.data ?? []);
      setProfile(profileRes.data ?? null);
      setUserProgress(progressRes.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat kursus.");
    } finally {
      setLoading(false);
    }
  };

  // ── Enroll & navigate ─────────────────────────────────────────────────────

  const handleStart = async (content: DBContent) => {
    if (!userId) return;
    if (content.is_premium && profile?.subscription_type !== "premium") {
      toast.error("Kursus ini hanya untuk pengguna Premium. Upgrade sekarang!", { action: { label: "Upgrade", onClick: () => navigate("/subscription") } });
      return;
    }
    setEnrolling(content.id);
    try {
      await supabase.from("learning_progress").upsert({
        user_id: userId,
        content_id: content.id,
        status: "in_progress",
        last_accessed_at: new Date().toISOString(),
      }, { onConflict: "user_id,content_id", ignoreDuplicates: false });

      // Refresh local progress
      setUserProgress(prev => {
        const exists = prev.find(p => p.content_id === content.id);
        if (exists) return prev;
        return [...prev, { content_id: content.id, progress_percentage: 0, status: "in_progress" }];
      });

      navigate(`/learning/content/${content.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const progressMap = new Map(userProgress.map(p => [p.content_id, p]));

  const filteredContent = allContent.filter(c => {
    const matchSearch = !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tags ?? []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = !selectedCatId || c.category_id === selectedCatId;
    return matchSearch && matchCat;
  });

  const featuredContent = allContent.filter(c => c.is_featured).slice(0, 4);
  const inProgressContent = allContent.filter(c => {
    const p = progressMap.get(c.id);
    return p && p.status === "in_progress" && (p.progress_percentage ?? 0) < 100;
  });

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #1D4ED8", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
    </div>
  );

  // ── Shared styles ──────────────────────────────────────────────────────────

  const pillBase: React.CSSProperties = { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" as const };

  // ── Course card ────────────────────────────────────────────────────────────

  const CourseCard = ({ c }: { c: DBContent }) => {
    const prog = progressMap.get(c.id);
    const pct = prog?.progress_percentage ?? 0;
    const done = prog?.status === "completed";
    const started = !!prog;
    const diff = diffStyle(c.difficulty_level);
    const catColor = categories.find(cat => cat.id === c.category_id)?.color ?? "#6366F1";

    return (
      <div
        style={{
          background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB",
          overflow: "hidden", transition: "box-shadow .2s, transform .2s", cursor: "pointer",
          display: "flex", flexDirection: "column",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px -8px rgba(11,29,58,.18)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
        onClick={() => handleStart(c)}
      >
        {/* Color band */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${catColor}, ${catColor}88)` }} />

        <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ ...pillBase, background: diff.bg, color: diff.color }}>{diff.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280" }}>
              <ContentIcon type={c.content_type} />
              {fmtDuration(c.duration_minutes)}
            </div>
          </div>

          {/* Title */}
          <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1D3A", margin: 0, lineHeight: 1.35 }}>
            {c.is_premium && <Lock size={13} style={{ marginRight: 5, color: "#F97316", verticalAlign: "middle" }} />}
            {c.title}
          </h3>

          {/* Description */}
          <p style={{ fontSize: 13, color: "#4B5563", margin: 0, lineHeight: 1.55, flex: 1,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {c.description}
          </p>

          {/* Tags */}
          {(c.tags ?? []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(c.tags ?? []).slice(0, 3).map(t => (
                <span key={t} style={{ ...pillBase, background: "#F3F4F6", color: "#6B7280", padding: "2px 8px", fontSize: 11 }}>{t}</span>
              ))}
            </div>
          )}

          {/* Progress bar (if started) */}
          {started && (
            <div>
              <div style={{ height: 5, borderRadius: 999, background: "#E5E7EB", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: done ? "linear-gradient(90deg,#0F7A3E,#16A34A)" : "linear-gradient(90deg,#1D4ED8,#3B82F6)", transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: 11, color: done ? "#0F7A3E" : "#1D4ED8", fontWeight: 600, marginTop: 4 }}>
                {done ? "✓ Selesai" : `${pct}% selesai`}
              </div>
            </div>
          )}

          {/* CTA button */}
          <button
            disabled={enrolling === c.id}
            style={{
              marginTop: "auto", padding: "10px 0", borderRadius: 10, fontFamily: "'Poppins',sans-serif",
              fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", width: "100%",
              background: done ? "#D1FAE5" : started ? "#EFF6FF" : "linear-gradient(135deg,#2563EB,#1D4ED8)",
              color: done ? "#0F7A3E" : started ? "#1D4ED8" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
            onClick={e => { e.stopPropagation(); handleStart(c); }}
          >
            {enrolling === c.id
              ? "Membuka..."
              : done ? <><CheckCircle size={14} /> Ulangi Kursus</>
              : started ? <><Play size={14} /> Lanjutkan</>
              : c.is_premium ? <><Lock size={14} /> Mulai — Premium</>
              : <><Play size={14} /> Mulai Kursus</>
            }
          </button>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
        <DashboardSidebar activeSection={activeSection} setActiveSection={setActiveSection} onSignOut={handleSignOut} />

        <main className="tk-page-in" style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 0" }}>

            {/* ── Page header ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 30, color: "#0B1D3A", margin: 0 }}>Kursus Saya</h1>
                <p style={{ fontSize: 15, color: "#6B7280", margin: "6px 0 0" }}>
                  Kelola dan lanjutkan pembelajaran untuk mencapai tujuan terbaik.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{profile?.full_name || "Pengguna"}</span>
                  <span style={{ ...pillBase, background: profile?.subscription_type === "premium" ? "#EFF6FF" : "#F3F4F6", color: profile?.subscription_type === "premium" ? "#1D4ED8" : "#6B7280", border: "1px solid", borderColor: profile?.subscription_type === "premium" ? "#BFDBFE" : "#E5E7EB" }}>
                    {profile?.subscription_type === "premium" ? "⭐ Premium" : "Individual"}
                  </span>
                </div>
              </div>

              {/* Stats pills */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "Kursus Tersedia", val: allContent.length, bg: "#EFF6FF", c: "#1D4ED8" },
                  { label: "Sedang Dipelajari", val: inProgressContent.length, bg: "#FFEDE2", c: "#FF6A00" },
                  { label: "Selesai", val: userProgress.filter(p => p.status === "completed").length, bg: "#D1FAE5", c: "#0F7A3E" },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 20, color: s.c, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Continue learning (if any in progress) ───────────────── */}
            {inProgressContent.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: "#0B1D3A", margin: "0 0 14px" }}>
                  ▶ Lanjutkan Belajar
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {inProgressContent.slice(0, 3).map(c => <CourseCard key={c.id} c={c} />)}
                </div>
              </div>
            )}

            {/* ── Search bar ────────────────────────────────────────────── */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                type="text"
                placeholder="Cari kursus, topik, atau keahlian..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12,
                  border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box" as const,
                  fontFamily: "'Inter',sans-serif", color: "#0B1D3A",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "#1D4ED8"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9CA3AF" }}>✕</button>
              )}
            </div>

            {/* ── Category chips ─────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              <button
                onClick={() => setSelectedCatId(null)}
                style={{
                  ...pillBase, padding: "8px 16px", cursor: "pointer", fontSize: 13,
                  background: !selectedCatId ? "#1D4ED8" : "#fff",
                  color: !selectedCatId ? "#fff" : "#374151",
                  border: `1.5px solid ${!selectedCatId ? "#1D4ED8" : "#E5E7EB"}`,
                  transition: "all .15s",
                }}
              >
                Semua Kategori
              </button>
              {categories.map(cat => {
                const active = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(active ? null : cat.id)}
                    style={{
                      ...pillBase, padding: "8px 16px", cursor: "pointer", fontSize: 13,
                      background: active ? (cat.color ?? "#6366F1") : "#fff",
                      color: active ? "#fff" : "#374151",
                      border: `1.5px solid ${active ? (cat.color ?? "#6366F1") : "#E5E7EB"}`,
                      transition: "all .15s",
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* ── Featured (only when no filter active) ─────────────────── */}
            {!selectedCatId && !searchTerm && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Star size={18} color="#F97316" fill="#F97316" />
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: "#0B1D3A", margin: 0 }}>Kursus Unggulan</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {featuredContent.map(c => <CourseCard key={c.id} c={c} />)}
                </div>
              </div>
            )}

            {/* ── Filtered results OR grouped by category ────────────────── */}
            {(selectedCatId || searchTerm) ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: "#0B1D3A", margin: 0 }}>
                    {filteredContent.length} kursus ditemukan
                  </h2>
                  {(selectedCatId || searchTerm) && (
                    <button onClick={() => { setSelectedCatId(null); setSearchTerm(""); }} style={{ fontSize: 13, color: "#1D4ED8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      Tampilkan semua
                    </button>
                  )}
                </div>
                {filteredContent.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "#9CA3AF" }}>
                    <BookOpen size={48} style={{ marginBottom: 12, opacity: .4 }} />
                    <p style={{ fontSize: 15 }}>Kursus tidak ditemukan. Coba kata kunci lain.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                    {filteredContent.map(c => <CourseCard key={c.id} c={c} />)}
                  </div>
                )}
              </div>
            ) : (
              /* Browse by category */
              <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                {categories.map(cat => {
                  const catContent = allContent.filter(c => c.category_id === cat.id);
                  if (catContent.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      {/* Category header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color ?? "#6366F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={18} color="#fff" />
                          </div>
                          <div>
                            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 17, color: "#0B1D3A", margin: 0 }}>{cat.name}</h2>
                            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{catContent.length} kursus</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCatId(cat.id)}
                          style={{ fontSize: 13, color: "#1D4ED8", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                          Lihat semua →
                        </button>
                      </div>

                      {/* Course cards (up to 4) */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                        {catContent.slice(0, 4).map(c => <CourseCard key={c.id} c={c} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: 40 }} />
          </div>
        </main>

        <BottomNavigationBar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>
    </SidebarProvider>
  );
};

export default LearningHub;
