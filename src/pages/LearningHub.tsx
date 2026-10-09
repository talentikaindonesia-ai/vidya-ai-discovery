import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ambilIdentitas, LABEL_RIASEC, type IdentitasSiswa, type TipeRiasec } from "@/hooks/useIdentitasSiswa";
import { Search, Play, BookOpen, FileText, Star, Lock, CheckCircle, Sparkles, Target, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Calendar, MapPin, Clock, Award, Compass, RefreshCw, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { useSubscription } from "@/hooks/useSubscription";
import { RIASEC_FOCUS_PLAN, kunciAksi, kunciMinggu } from "@/lib/riasecFocusPlan";

/**
 * Belajar (Learning) — direstyle 2026-09-17 mengikuti mockup desain
 * "Talentika Dashboard.html" (halaman Belajar), TAPI dengan satu batasan
 * ketat yang dipegang sepanjang proyek ini: TANPA data karangan.
 *
 * Mockup aslinya punya dua program flagship berbayar ("The Future Of™",
 * "The STEM Achievement Playbook™") dengan modul/minggu/harga fiktif, tab
 * Bootcamp dengan mitra ("Talentika × Gojek Academy") yang belum pernah ada,
 * dan angka "282 kursus" yang tidak cocok dengan isi database (36 materi,
 * 6 jalur). Semua itu sama persis dengan pola yang sudah dibersihkan dari
 * mentor/testimoni/leaderboard palsu sepanjang sesi ini — jadi TIDAK di-porting.
 *
 * Yang diambil dari mockup: struktur dua tab (Jelajahi / Lanjutkan Belajar),
 * banner hero "Alur Belajar" yang merujuk identitas RIASEC asli, kartu jalur
 * dengan skor kecocokan dihitung dari identitas asli (bukan ditulis manual),
 * dan tab rekomendasi Course/Event — Event memakai community_events yang
 * sungguhan (menu Event CMS baru dibangun beberapa hari lalu). Tab "Bootcamp"
 * di mockup DIHILANGKAN karena tidak ada model data untuk itu.
 */

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
  thumbnail_url: string | null;
  average_rating: number | null;
}

interface UserProgress {
  content_id: string;
  progress_percentage: number | null;
  status: string | null;
  time_spent_minutes: number | null;
}

interface BootcampRow {
  id: string;
  slug: string;
  title: string;
  category_label: string;
  cover_url: string | null;
  price: number;
  original_price: number | null;
  level: string;
  lesson_count: number;
  total_minutes: number;
}

interface EventRow {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
  is_premium_only: boolean | null;
  banner_url: string | null;
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

// Sama dengan palet di EventsCMS.tsx — supaya jenis event konsisten di seluruh app.
const JENIS_EVENT: Record<string, { bg: string; color: string; label: string }> = {
  webinar:  { bg: "#ECFDF5", color: "#047857", label: "Webinar" },
  workshop: { bg: "#EFF6FF", color: "#1D4ED8", label: "Workshop" },
  meetup:   { bg: "#F5F3FF", color: "#5B21B6", label: "Meetup" },
  bootcamp: { bg: "#FFF7ED", color: "#C2410C", label: "Bootcamp" },
};

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

/**
 * Skor kecocokan JALUR BELAJAR — dihitung dari identitas RIASEC asli siswa,
 * bukan angka yang ditulis manual per jalur. Huruf utama > kedua > ketiga;
 * jalur di luar kode Holland siswa tidak diberi skor sama sekali (lebih
 * jujur daripada memaksakan angka rendah yang seolah presisi).
 */
function pathMatchPct(tipe: TipeRiasec, identitas: IdentitasSiswa | null): number | null {
  if (!identitas) return null;
  if (tipe === identitas.tipeUtama) return 95;
  if (tipe === identitas.tipeKedua) return 75;
  if (tipe === identitas.tipeKetiga) return 55;
  return null;
}

function pathWhy(tipe: TipeRiasec, identitas: IdentitasSiswa | null): string {
  const label = LABEL_RIASEC[tipe] ?? tipe;
  if (!identitas) return `Cocok untuk kamu yang tertarik ke arah ${label}.`;
  if (tipe === identitas.tipeUtama) return `Selaras dengan tipe utamamu — ${label} (kode Holland ${identitas.kode}).`;
  if (tipe === identitas.tipeKedua || tipe === identitas.tipeKetiga) return `Salah satu minat pendukungmu — cocok untuk memperluas keahlian.`;
  return `Di luar tipe utamamu — cara bagus untuk menjelajah minat baru.`;
}

// ── Slider kartu horizontal ─────────────────────────────────────────────────
// Dipakai untuk "Jalur Belajar" supaya banyak kartu tidak memenuhi layar
// sekaligus — geser dengan tombol panah atau drag/swipe biasa.
function CardSlider({ children }: { children: React.ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [bisaKiri, setBisaKiri] = useState(false);
  const [bisaKanan, setBisaKanan] = useState(false);

  const cekPanah = () => {
    const el = trackRef.current;
    if (!el) return;
    setBisaKiri(el.scrollLeft > 4);
    setBisaKanan(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    cekPanah();
    const el = trackRef.current;
    if (!el) return;
    const onResize = () => cekPanah();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(cekPanah);
    ro.observe(el);
    return () => { window.removeEventListener("resize", onResize); ro.disconnect(); };
  }, [children.length]);

  const geser = (arah: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const kartu = el.querySelector<HTMLElement>("[data-slide]");
    const jarak = kartu ? kartu.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: arah * jarak * 2, behavior: "smooth" });
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={trackRef}
        onScroll={cekPanah}
        className="tk-hscroll"
        style={{ display: "flex", gap: 16, overflowX: "auto", scrollSnapType: "x proximity", paddingBottom: 4 }}
      >
        {children.map((child, i) => (
          <div key={i} data-slide style={{ flex: "0 0 auto", width: "min(320px, 82vw)", scrollSnapAlign: "start" }}>
            {child}
          </div>
        ))}
      </div>
      {bisaKiri && (
        <button onClick={() => geser(-1)} aria-label="Geser ke kiri"
          style={{ position: "absolute", top: "50%", left: -6, transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "1px solid #E5E7EB", background: "#fff", color: "#0B1D3A", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(15,23,42,.15)", zIndex: 2 }}>
          <ChevronLeft size={18} />
        </button>
      )}
      {bisaKanan && (
        <button onClick={() => geser(1)} aria-label="Geser ke kanan"
          style={{ position: "absolute", top: "50%", right: -6, transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "1px solid #E5E7EB", background: "#fff", color: "#0B1D3A", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 6px 16px rgba(15,23,42,.15)", zIndex: 2 }}>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// ── Rencana Aksi (dulu halaman terpisah "/focus") ──────────────────────────
// Dipindah ke sini atas permintaan pengguna 2026-09-22: rencana aksi mingguan
// & rencana belajar 4 minggu sekarang tampil langsung di seksi "Alur Belajar",
// bukan lagi di halaman /focus tersendiri. Progres (localStorage) memakai
// kunci yang sama seperti sebelumnya, jadi centang lama tetap terbawa.
function RencanaAksiCard({ tipe, userId }: { tipe: TipeRiasec; userId: string }) {
  const cfg = RIASEC_FOCUS_PLAN[tipe];
  const [checkedActions, setCheckedActions] = useState<boolean[]>([false, false, false, false, false]);
  const [completedWeeks, setCompletedWeeks] = useState<boolean[]>([false, false, false, false]);
  const [showWeeks, setShowWeeks] = useState(false);

  useEffect(() => {
    if (!cfg) return;
    try {
      const a = localStorage.getItem(kunciAksi(userId, tipe));
      if (a) setCheckedActions(JSON.parse(a));
      const w = localStorage.getItem(kunciMinggu(userId, tipe));
      if (w) setCompletedWeeks(JSON.parse(w));
    } catch { /* abaikan localStorage rusak */ }
  }, [userId, tipe]);

  if (!cfg) return null;

  const toggleAction = (i: number) => {
    const next = checkedActions.map((v, idx) => idx === i ? !v : v);
    setCheckedActions(next);
    localStorage.setItem(kunciAksi(userId, tipe), JSON.stringify(next));
  };
  const toggleWeek = (i: number) => {
    const next = completedWeeks.map((v, idx) => idx === i ? !v : v);
    setCompletedWeeks(next);
    localStorage.setItem(kunciMinggu(userId, tipe), JSON.stringify(next));
  };
  const resetActions = () => {
    const r = [false, false, false, false, false];
    setCheckedActions(r);
    localStorage.setItem(kunciAksi(userId, tipe), JSON.stringify(r));
  };

  const doneCount = checkedActions.filter(Boolean).length;
  const doneWeeks = completedWeeks.filter(Boolean).length;

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "20px 22px 22px", marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF6FF", display: "grid", placeItems: "center" }}>
            <Flame size={17} style={{ color: "#1D4ED8" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 15, color: "#0B1D3A" }}>Aksi Fokus Minggu Ini</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>{doneCount}/5 selesai — untuk tipe {cfg.label}</div>
          </div>
        </div>
        <button onClick={resetActions} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 9, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(doneCount / 5) * 100}%`, background: doneCount === 5 ? "linear-gradient(90deg,#10B981,#34D399)" : "linear-gradient(90deg,#1D4ED8,#3B82F6)", borderRadius: 99, transition: "width .4s" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: doneCount === 5 ? "#059669" : "#1D4ED8", minWidth: 32, textAlign: "right" }}>{Math.round((doneCount / 5) * 100)}%</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {cfg.weeklyActions.map((action, i) => {
          const checked = checkedActions[i];
          return (
            <div key={i} onClick={() => toggleAction(i)} className="tk-lift"
              style={{ display: "flex", alignItems: "center", gap: 12, background: checked ? "#ECFDF5" : "#F8FAFC", borderRadius: 12, padding: "11px 14px", border: checked ? "1.5px solid #10B981" : "1px solid #E5E7EB", cursor: "pointer" }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
                fontSize: 12, fontWeight: 800, transition: "all .15s",
                background: checked ? "#10B981" : "#fff", color: checked ? "#fff" : "#94A3B8",
                border: checked ? "none" : "1.5px solid #CBD5E1",
              }}>
                {checked ? <CheckCircle size={15} /> : i + 1}
              </span>
              <span style={{ fontSize: 13, color: checked ? "#6B7280" : "#334155", lineHeight: 1.5, textDecoration: checked ? "line-through" : "none" }}>{action}</span>
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowWeeks(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "8px 0", borderTop: "1px solid #F1F5F9" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13.5, color: "#0B1D3A" }}>
          <Calendar size={15} style={{ color: "#7C3AED" }} /> Rencana Belajar 4 Minggu
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>({doneWeeks}/4 fase)</span>
        </span>
        <ChevronDown size={16} style={{ color: "#94A3B8", transform: showWeeks ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {showWeeks && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 14 }}>
          {cfg.fourWeekPlan.map((w, i) => {
            const done = completedWeeks[i];
            return (
              <div key={w.week} style={{ background: done ? "#ECFDF5" : "#F8FAFC", borderRadius: 14, padding: "14px 16px", border: done ? "1.5px solid #10B981" : "1px solid #E5E7EB" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: ".05em" }}>Minggu {w.week}</span>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13.5, color: "#0B1D3A", marginTop: 2 }}>{w.theme}</div>
                  </div>
                  <button onClick={() => toggleWeek(i)}
                    style={{ padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: done ? "#D1FAE5" : "#EFF6FF", color: done ? "#059669" : "#1D4ED8", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {done ? "✓ Selesai" : "Tandai"}
                  </button>
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {w.goals.map((g, gi) => (
                    <li key={gi} style={{ fontSize: 12, color: done ? "#94A3B8" : "#475569", lineHeight: 1.5, textDecoration: done ? "line-through" : "none" }}>{g}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

const LearningHub = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection]     = useState("courses");
  const [tab, setTab]                         = useState<"jelajahi" | "lanjutkan">("jelajahi");
  const [recTab, setRecTab]                   = useState<"course" | "event">("course");
  const [categories, setCategories]           = useState<DBCategory[]>([]);
  const [allContent, setAllContent]           = useState<DBContent[]>([]);
  const [userProgress, setUserProgress]       = useState<UserProgress[]>([]);
  const [selectedCatId, setSelectedCatId]     = useState<string | null>(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [loading, setLoading]                 = useState(true);
  const [enrolling, setEnrolling]             = useState<string | null>(null);
  const [profile, setProfile]                 = useState<{ full_name?: string; subscription_type?: string } | null>(null);
  const [userId, setUserId]                   = useState<string | null>(null);
  const [certCount, setCertCount]             = useState(0);
  const [events, setEvents]                   = useState<EventRow[]>([]);
  const [bootcamps, setBootcamps]             = useState<BootcampRow[]>([]);
  // Personalized recommendations from my_learning_recommendations RPC
  const [recs, setRecs] = useState<{
    id: string; title: string; description: string | null; content_type: string;
    duration_minutes: number | null; difficulty_level: string | null;
    category_name: string; is_premium: boolean; created_at: string; reason: string;
  }[]>([]);
  const sub = useSubscription();
  // Course catalog: every active learning path, browsable regardless of RIASEC match
  const [paths, setPaths] = useState<{
    id: string; name: string; description: string | null; difficulty_level: string | null;
    riasec_type: string; estimated_duration_hours: number | null; item_count: number;
    cover_url?: string | null;
  }[]>([]);
  const [identitas, setIdentitas] = useState<IdentitasSiswa | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);

      const [catRes, contentRes, profileRes, progressRes, recRes, pathsRes, certRes, eventRes, bootcampRes] = await Promise.all([
        supabase.from("learning_categories").select("id,name,description,icon,color").eq("is_active", true).order("name"),
        supabase.from("learning_content").select("id,title,description,content_type,category_id,difficulty_level,duration_minutes,is_premium,is_featured,tags,priority_score,thumbnail_url,average_rating").eq("is_active", true).order("priority_score", { ascending: false }),
        supabase.from("profiles").select("full_name,subscription_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("learning_progress").select("content_id,progress_percentage,status,time_spent_minutes").eq("user_id", user.id),
        (supabase.rpc as any)("my_learning_recommendations", { p_limit: 6 }),
        (supabase.rpc as any)("list_learning_paths"),
        supabase.from("certificates" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id),
        // Event nyata dari community_events (bukan karangan) — hanya yang terbit & belum lewat.
        supabase.from("community_events" as any)
          .select("id,title,event_type,event_date,location,is_premium_only,banner_url")
          .eq("is_active", true).gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true }).limit(4),
        (supabase.rpc as any)("list_bootcamps"),
      ]);
      setBootcamps(Array.isArray(bootcampRes.data) ? bootcampRes.data : []);

      setCategories(catRes.data ?? []);
      setAllContent(contentRes.data ?? []);
      setProfile(profileRes.data ?? null);
      setUserProgress((progressRes.data as unknown as UserProgress[]) ?? []);
      setRecs(Array.isArray(recRes.data) ? recRes.data : []);
      setCertCount(certRes.count ?? 0);
      const daftarEvent = (eventRes.data as unknown as EventRow[]) ?? [];
      setEvents(daftarEvent);
      // Kalau tak ada rekomendasi kursus tapi ada event, buka tab yang berisi.
      if ((!Array.isArray(recRes.data) || recRes.data.length === 0) && daftarEvent.length > 0) {
        setRecTab("event");
      }

      /* Enam jalur belajar memetakan tepat ke enam tipe RIASEC, tapi selama ini
         ditampilkan tanpa urutan sama sekali — siswa Artistik dan siswa
         Konvensional melihat susunan yang identik. Sekarang diurutkan menurut
         kode Holland: huruf utama di atas, lalu kedua, lalu ketiga. Tetap
         MENGURUTKAN, bukan menyaring — keenam jalur selalu terlihat. */
      const ident = await ambilIdentitas(user.id);
      setIdentitas(ident);
      const daftar = Array.isArray(pathsRes.data) ? [...pathsRes.data] : [];
      if (ident) {
        const urutan = [ident.tipeUtama, ident.tipeKedua, ident.tipeKetiga].filter(Boolean) as string[];
        const bobot = (p: { riasec_type: string }) => {
          const i = urutan.indexOf((p.riasec_type || "").replace(/^riasec:/, ""));
          return i === -1 ? 99 : i;
        };
        daftar.sort((a: any, b: any) => bobot(a) - bobot(b));
      }
      setPaths(daftar);
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
    // Server-truth premium check (covers paid, trial, school members, admin)
    if (content.is_premium && !sub.loading && sub.isFree) {
      toast.error("Kursus ini hanya untuk pengguna Premium. Upgrade sekarang!", { action: { label: "Upgrade", onClick: () => navigate("/subscription?from=%2Flearning") } });
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
        return [...prev, { content_id: content.id, progress_percentage: 0, status: "in_progress", time_spent_minutes: 0 }];
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
  const completedCount = userProgress.filter(p => p.status === "completed").length;
  const jamBelajar = userProgress.reduce((sum, p) => sum + (p.time_spent_minutes ?? 0), 0) / 60;
  const rataRataProgress = inProgressContent.length > 0
    ? Math.round(inProgressContent.reduce((sum, c) => sum + (progressMap.get(c.id)?.progress_percentage ?? 0), 0) / inProgressContent.length)
    : 0;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex" }}>
      {/* Sidebar skeleton */}
      <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #E2E8F0", background: "#fff", padding: 16, display: "flex", flexDirection: "column", gap: 8 }} className="hidden md:flex">
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div><Skeleton className="h-4 w-20 mb-1" /><Skeleton className="h-3 w-28" /></div>
        </div>
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
      </div>
      {/* Content skeleton */}
      <div style={{ flex: 1, padding: "32px 28px", maxWidth: 1600, width: "100%", margin: "0 auto", overflow: "auto" }}>
        {/* Header + stats pills */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <div className="flex gap-3 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-28 rounded-full" />)}
        </div>
        {/* Continue learning */}
        <Skeleton className="h-6 w-44 mb-4" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <Skeleton className="h-36 w-full rounded-none" />
              <div style={{ padding: "14px 16px" }}>
                <Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-2 w-full rounded-full mb-1" /><Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-24 rounded-lg" />)}
        </div>
        {/* Course grid */}
        <Skeleton className="h-6 w-44 mb-4" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #E2E8F0" }}>
              <Skeleton className="h-28 w-full rounded-none" />
              <div style={{ padding: "12px 14px" }}>
                <Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
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
        {/* Thumbnail (real image if available, gradient fallback) */}
        <div style={{ position: "relative", height: 130, background: `linear-gradient(135deg, ${catColor}, ${catColor}99)`, overflow: "hidden" }}>
          {c.thumbnail_url && (
            <img src={c.thumbnail_url} alt={c.title} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
          {!c.thumbnail_url && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "rgba(255,255,255,.9)" }}>
              <ContentIcon type={c.content_type} />
            </div>
          )}
          {c.is_featured && (
            <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,.95)", color: "#B45309", fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99 }}>⭐ Unggulan</span>
          )}
        </div>

        <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ ...pillBase, background: diff.bg, color: diff.color }}>{diff.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280" }}>
              <ContentIcon type={c.content_type} />
              {fmtDuration(c.duration_minutes)}
            </div>
          </div>

          {/* Rating (only if content has been rated) */}
          {(c.average_rating ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={13}
                  style={{
                    fill: Math.round(c.average_rating ?? 0) >= n ? "#FBBF24" : "transparent",
                    color: Math.round(c.average_rating ?? 0) >= n ? "#FBBF24" : "#D1D5DB",
                  }} />
              ))}
              <span style={{ fontSize: 12, color: "#B45309", fontWeight: 700, marginLeft: 3 }}>
                {(c.average_rating ?? 0).toFixed(1)}
              </span>
            </div>
          )}

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

  // ── Underline tab button ──────────────────────────────────────────────────

  const TabBtn = ({ id, label, icon, count }: { id: "jelajahi" | "lanjutkan"; label: string; icon: React.ReactNode; count?: number }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "12px 2px", border: "none", background: "none", cursor: "pointer",
        fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14,
        color: tab === id ? "#1D4ED8" : "#6B7280",
        borderBottom: tab === id ? "2px solid #1D4ED8" : "2px solid transparent",
        display: "flex", alignItems: "center", gap: 8, marginBottom: -1,
      }}
    >
      {icon} {label}
      {typeof count === "number" && count > 0 && (
        <span style={{ ...pillBase, background: "#FFEDE2", color: "#C2410C", fontSize: 10.5, padding: "2px 8px" }}>{count}</span>
      )}
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
        <DashboardSidebar activeSection={activeSection} setActiveSection={setActiveSection} onSignOut={handleSignOut} />

        <main className="tk-page-in" style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
          <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 28px 0" }}>

            {/* ── Page header ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 30, color: "#0B1D3A", margin: 0 }}>Belajar</h1>
                <p style={{ fontSize: 15, color: "#6B7280", margin: "6px 0 0" }}>
                  Alur belajar, rekomendasi, dan seluruh katalog Talentika dalam satu tempat.
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
                  { label: "Selesai", val: completedCount, bg: "#D1FAE5", c: "#0F7A3E" },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 20, color: s.c, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #E5E7EB", marginBottom: 24 }}>
              <TabBtn id="jelajahi" label="Jelajahi" icon={<Compass size={15} />} />
              <TabBtn id="lanjutkan" label="Lanjutkan Belajar" icon={<BookOpen size={15} />} count={inProgressContent.length} />
            </div>

            {tab === "lanjutkan" ? (
              // ══════════════════════ TAB: LANJUTKAN BELAJAR ══════════════════
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                  {[
                    { icon: <BookOpen size={18} />, label: "Kursus Aktif", value: String(inProgressContent.length), bg: "#EFF6FF", c: "#1D4ED8" },
                    { icon: <Clock size={18} />, label: "Jam Belajar", value: jamBelajar.toLocaleString("id-ID", { maximumFractionDigits: 1 }), bg: "#D1FAE5", c: "#0F7A3E" },
                    { icon: <Target size={18} />, label: "Progress Rata-rata", value: inProgressContent.length > 0 ? `${rataRataProgress}%` : "—", bg: "#FFF6E0", c: "#A47000" },
                    { icon: <Award size={18} />, label: "Sertifikat", value: String(certCount), bg: "#F0E8FF", c: "#5B21B6" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "16px 18px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.c, display: "grid", placeItems: "center", marginBottom: 10 }}>{s.icon}</div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: "#0B1D3A", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 18, color: "#0B1D3A", margin: "0 0 14px" }}>Kursus Aktif</h2>
                {inProgressContent.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "56px 20px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, color: "#94A3B8" }}>
                    <BookOpen size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .4 }} />
                    <div style={{ fontWeight: 700, color: "#475569", fontSize: 15 }}>Belum ada kursus yang sedang dipelajari</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Buka tab Jelajahi untuk mulai kursus pertamamu.</div>
                    <button onClick={() => setTab("jelajahi")} style={{ marginTop: 16, padding: "9px 20px", borderRadius: 10, border: "none", background: "#1D4ED8", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                      Jelajahi Kursus
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                    {inProgressContent.map(c => <CourseCard key={c.id} c={c} />)}
                  </div>
                )}
              </div>
            ) : (
              // ══════════════════════ TAB: JELAJAHI ══════════════════════════
              <div>

            {/* ── Alur Belajar (hero + jalur) ─────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                borderRadius: 20, background: "linear-gradient(120deg,#0B1D3A 0%,#1D4ED8 70%,#2563EB 100%)",
                color: "#fff", padding: "26px 28px", marginBottom: 18, position: "relative", overflow: "hidden",
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}>
                {/* Dekorasi — pola titik + dua bola cahaya, murni CSS */}
                <div aria-hidden style={{
                  position: "absolute", inset: 0, pointerEvents: "none", opacity: .5,
                  backgroundImage: "radial-gradient(rgba(255,255,255,.35) 1px, transparent 1.5px)",
                  backgroundSize: "22px 22px",
                  WebkitMaskImage: "radial-gradient(ellipse 620px 220px at 78% 30%, #000 0%, transparent 75%)",
                  maskImage: "radial-gradient(ellipse 620px 220px at 78% 30%, #000 0%, transparent 75%)",
                }} />
                <div aria-hidden style={{ position: "absolute", right: -60, top: -70, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,193,7,.28), transparent 70%)", pointerEvents: "none" }} />
                <div aria-hidden style={{ position: "absolute", left: "38%", bottom: -90, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,.25), transparent 70%)", pointerEvents: "none" }} />

                <div style={{ width: 54, height: 54, borderRadius: 16, background: "rgba(255,255,255,.18)", boxShadow: "0 0 0 1px rgba(255,255,255,.15) inset", display: "grid", placeItems: "center", flex: "0 0 auto", position: "relative" }}>
                  <Target size={26} />
                </div>
                <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", opacity: .75, marginBottom: 4 }}>Alur Belajar</div>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: "#fff", fontSize: 22, margin: "0 0 4px" }}>Rekomendasi Alur Belajar Untukmu</h2>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,.85)", maxWidth: "62ch" }}>
                    {identitas
                      ? <>Disusun dari hasil tes minat &amp; bakatmu — <b style={{ color: "#FFC107" }}>{LABEL_RIASEC[identitas.tipeUtama]}</b>. Ikuti jalur yang paling dekat agar belajarmu terarah.</>
                      : "Selesaikan Tes Minat & Bakat supaya kami bisa mengurutkan jalur belajar yang paling cocok untukmu."}
                  </p>
                  {identitas?.kode && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "rgba(255,255,255,.14)", borderRadius: 99, padding: "5px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: "rgba(255,255,255,.7)" }}>KODE HOLLAND</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 13, color: "#FFC107" }}>{identitas.kode}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => navigate("/assessment")} style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFC107", color: "#0B1D3A", border: "none", borderRadius: 11, padding: "11px 18px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13.5, cursor: "pointer", position: "relative", boxShadow: "0 8px 20px -6px rgba(255,193,7,.6)" }}>
                  <Sparkles size={14} /> {identitas ? "Lihat Hasil Tes" : "Mulai Tes Minat & Bakat"}
                </button>
              </div>

              {paths.length > 0 && (
                <CardSlider>
                  {paths.map(p => {
                    const tipe = (p.riasec_type || "").replace(/^riasec:/, "") as TipeRiasec;
                    const match = pathMatchPct(tipe, identitas);
                    const posisi = identitas ? [identitas.tipeUtama, identitas.tipeKedua, identitas.tipeKetiga].indexOf(tipe) : -1;
                    return (
                      <div key={p.id} onClick={() => navigate(`/learning/path/${p.id}`)} className="tk-lift"
                        style={{ background: "#fff", border: posisi === 0 ? "2px solid #1D4ED8" : "1px solid #E5E7EB", borderRadius: 20, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", boxShadow: posisi === 0 ? "0 24px 60px -20px rgba(29,78,216,.22)" : "none" }}>
                        <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#F1F5F9" }}>
                          {p.cover_url ? (
                            <img src={p.cover_url} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#CBD5E1" }}><BookOpen size={28} /></div>
                          )}
                          <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,.95)", color: "#7C3AED", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: "5px 11px", borderRadius: 99 }}>
                            {LABEL_RIASEC[tipe] ?? p.riasec_type}
                          </span>
                          {match !== null && (
                            <span style={{ position: "absolute", top: 12, right: 12, background: "#1D4ED8", color: "#fff", fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 12, padding: "6px 12px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5 }}>
                              <Target size={12} /> {match}% cocok
                            </span>
                          )}
                        </div>
                        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <h3 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 17, color: "#0B1D3A", margin: "0 0 4px" }}>{p.name}</h3>
                          <p style={{ fontSize: 12.5, color: "#6B7280", margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
                          <div style={{ background: "#F8FAFC", borderLeft: "3px solid #1D4ED8", borderRadius: "0 10px 10px 0", padding: "10px 12px", fontSize: 12.5, color: "#334155", lineHeight: 1.5, marginBottom: 14 }}>
                            <Sparkles size={12} style={{ color: "#1D4ED8", verticalAlign: -2, marginRight: 5 }} />{pathWhy(tipe, identitas)}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
                            <span style={{ fontSize: 12, color: "#94A3B8" }}>{p.item_count} materi{p.estimated_duration_hours ? ` · ±${p.estimated_duration_hours} jam` : ""}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#1D4ED8", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13 }}>Ikuti Alur <ArrowRight size={14} /></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardSlider>
              )}

              {/* Rencana aksi mingguan — hanya kalau identitas RIASEC sudah ada */}
              {identitas?.tipeUtama && userId && (
                <RencanaAksiCard tipe={identitas.tipeUtama} userId={userId} />
              )}
            </div>

            {/* ── Bootcamp (program dari CMS; kosong = tidak tampil) ─────── */}
            {bootcamps.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ marginBottom: 14 }}>
                  <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: "#0B1D3A", margin: 0 }}>🚀 Bootcamp</h2>
                  <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>Program intensif berbasis proyek bersama mentor</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {bootcamps.map(bc => {
                    const lvl = DIFF[bc.level] ?? { bg: "#EFF6FF", color: "#1D4ED8", label: "Semua Level" };
                    return (
                      <div key={bc.id} onClick={() => navigate(`/bootcamp/${bc.slug}`)} className="tk-lift"
                        style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 18, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}>
                        <div style={{ aspectRatio: "16 / 10", background: "#F1F5F9" }}>
                          {bc.cover_url
                            ? <img src={bc.cover_url} alt={bc.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#CBD5E1" }}><BookOpen size={28} /></div>}
                        </div>
                        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ ...pillBase, background: "#EFF6FF", color: "#1D4ED8", fontSize: 10.5, padding: "3px 9px" }}>{bc.category_label}</span>
                            <span style={{ ...pillBase, background: lvl.bg, color: lvl.color, fontSize: 10.5, padding: "3px 9px" }}>{lvl.label}</span>
                          </div>
                          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1D3A", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bc.title}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>
                            {Number(bc.lesson_count)} materi{Number(bc.total_minutes) > 0 ? ` · ${Math.round(Number(bc.total_minutes) / 60)} jam` : ""}
                          </div>
                          <div style={{ marginTop: "auto", fontSize: 14.5, fontWeight: 700, color: "#0B1D3A" }}>
                            {bc.price > 0 && bc.original_price ? <span style={{ fontWeight: 500, color: "#FCA5A5", textDecoration: "line-through", marginRight: 8, fontSize: 13 }}>Rp {bc.original_price.toLocaleString("id-ID")}</span> : null}
                            {bc.price > 0 ? `Rp ${bc.price.toLocaleString("id-ID")}` : "Gratis"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Rekomendasi Untukmu (Course / Event) ────────────────────── */}
            {(recs.length > 0 || events.length > 0) && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 18, color: "#0B1D3A", margin: 0 }}>✨ Rekomendasi Untukmu</h2>
                    <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>Kursus dan event yang paling relevan dengan profil bakatmu</div>
                  </div>
                  <div style={{ display: "inline-flex", gap: 4, background: "#F1F5F9", borderRadius: 12, padding: 4 }}>
                    <button onClick={() => setRecTab("course")}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12.5, background: recTab === "course" ? "#1D4ED8" : "transparent", color: recTab === "course" ? "#fff" : "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
                      <BookOpen size={13} /> Course ({recs.length})
                    </button>
                    <button onClick={() => setRecTab("event")}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12.5, background: recTab === "event" ? "#1D4ED8" : "transparent", color: recTab === "event" ? "#fff" : "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} /> Event ({events.length})
                    </button>
                  </div>
                </div>

                {recTab === "course" && (
                  recs.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: 13, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14 }}>Belum ada rekomendasi kursus untukmu saat ini.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                      {recs.map(r => {
                        const isNew = (Date.now() - new Date(r.created_at).getTime()) / 86400000 <= 7;
                        const full = allContent.find(c => c.id === r.id);
                        const CT_COLOR: Record<string, { bg: string; color: string }> = {
                          video: { bg: "#EFF6FF", color: "#1D4ED8" }, article: { bg: "#F5F3FF", color: "#7C3AED" },
                          course: { bg: "#ECFDF5", color: "#059669" },
                        };
                        const ct = CT_COLOR[r.content_type] ?? { bg: "#F1F5F9", color: "#475569" };
                        return (
                          <div key={r.id} onClick={() => full && handleStart(full)} className="tk-lift"
                            style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "16px 16px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, transition: "box-shadow .18s, transform .18s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px -8px rgba(29,78,216,.22)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ width: 36, height: 36, borderRadius: 10, background: ct.bg, color: ct.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <ContentIcon type={r.content_type} />
                              </span>
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {isNew && <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D", background: "#DCFCE7", padding: "3px 8px", borderRadius: 99 }}>🆕 Baru</span>}
                                {r.is_premium && <span style={{ fontSize: 10, fontWeight: 800, color: "#A47000", background: "#FEF9C3", padding: "3px 8px", borderRadius: 99 }}>⭐</span>}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: "#0B1D3A", lineHeight: 1.4 }}>{r.title}</div>
                            <div style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              <Sparkles size={11} /> {r.reason}
                            </div>
                            <div style={{ fontSize: 12, color: "#94A3B8", display: "flex", gap: 10, marginTop: "auto", paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
                              <span>{r.category_name}</span>
                              {r.duration_minutes ? <span>· {r.duration_minutes} mnt</span> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {recTab === "event" && (
                  events.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: 13, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14 }}>Belum ada event mendatang. Pantau terus halaman ini.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                      {events.map(e => {
                        const j = JENIS_EVENT[e.event_type] ?? { bg: "#F1F5F9", color: "#475569", label: e.event_type };
                        const tgl = new Date(e.event_date);
                        return (
                          <div key={e.id} onClick={() => navigate("/community")}
                            style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}>
                            <div style={{ aspectRatio: "16/9", background: "#F1F5F9", overflow: "hidden" }}>
                              {e.banner_url
                                ? <img src={e.banner_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#CBD5E1" }}><Calendar size={22} /></div>}
                            </div>
                            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, background: j.bg, color: j.color, padding: "3px 9px", borderRadius: 99 }}>{j.label}</span>
                                {e.is_premium_only && <span style={{ fontSize: 10.5, fontWeight: 800, background: "#FEF9C3", color: "#A47000", padding: "3px 9px", borderRadius: 99 }}>⭐ Premium</span>}
                              </div>
                              <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 14, color: "#0B1D3A", lineHeight: 1.35 }}>{e.title}</div>
                              <div style={{ fontSize: 12, color: "#6B7280", display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
                                <span><Clock size={11} style={{ verticalAlign: -2 }} /> {tgl.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                                {e.location && <span><MapPin size={11} style={{ verticalAlign: -2 }} /> {e.location}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
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

            {/* ── Category chips (mendua sebagai "Semua Kategori") ────────── */}
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
                const jumlah = allContent.filter(c => c.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(active ? null : cat.id)}
                    style={{
                      ...pillBase, padding: "8px 16px", cursor: "pointer", fontSize: 13, gap: 6,
                      background: active ? (cat.color ?? "#6366F1") : "#fff",
                      color: active ? "#fff" : "#374151",
                      border: `1.5px solid ${active ? (cat.color ?? "#6366F1") : "#E5E7EB"}`,
                      transition: "all .15s",
                    }}
                  >
                    {cat.icon ? <span>{cat.icon}</span> : null}
                    {cat.name}
                    <span style={{ opacity: .65, fontWeight: 700 }}>{jumlah}</span>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                        {catContent.slice(0, 4).map(c => <CourseCard key={c.id} c={c} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
