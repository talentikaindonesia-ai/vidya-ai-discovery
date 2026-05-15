import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Clock,
  Heart,
  Code,
  Briefcase,
  TrendingUp,
  TreePine,
  Users,
  Cpu,
  Globe,
  ArrowRight,
  ChevronLeft,
  Lightbulb,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserSubscriptionInfo } from "@/lib/subscription";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface CourseCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  courses: Course[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  project: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  isRecommended?: boolean;
}

// ─── Category colour palette ──────────────────────────────────────────────────
// Each entry: { iconBg (gradient), iconFg, cardAccent }
const CATEGORY_PALETTE: Record<
  string,
  { gradStart: string; gradEnd: string; fg: string; soft: string }
> = {
  "life-skills":       { gradStart: "#FB7185", gradEnd: "#F43F5E", fg: "#fff", soft: "#FFF1F2" },
  "digital-skills":    { gradStart: "#3B82F6", gradEnd: "#2563EB", fg: "#fff", soft: "var(--tk-blue-50,#EFF6FF)" },
  "vocational-skills": { gradStart: "#FB923C", gradEnd: "#EA580C", fg: "#fff", soft: "var(--tk-orange-soft,#FFEDE2)" },
  "entrepreneurship":  { gradStart: "#22C55E", gradEnd: "#16A34A", fg: "#fff", soft: "#F0FDF4" },
  "green-skills":      { gradStart: "#10B981", gradEnd: "#059669", fg: "#fff", soft: "var(--tk-mint,#D1FAE5)" },
  "soft-skills":       { gradStart: "#A78BFA", gradEnd: "#7C3AED", fg: "#fff", soft: "#F5F3FF" },
  "steam-skills":      { gradStart: "#6366F1", gradEnd: "#4338CA", fg: "#fff", soft: "#EEF2FF" },
  "community-skills":  { gradStart: "#14B8A6", gradEnd: "#0F766E", fg: "#fff", soft: "#F0FDFA" },
};

function palette(id: string) {
  return (
    CATEGORY_PALETTE[id] ?? {
      gradStart: "#64748B",
      gradEnd: "#475569",
      fg: "#fff",
      soft: "#F8FAFC",
    }
  );
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  beginner:     { bg: "var(--tk-mint,#D1FAE5)",    color: "var(--tk-green-dark,#0F7A3E)", label: "Pemula" },
  intermediate: { bg: "var(--tk-orange-soft,#FFEDE2)", color: "var(--tk-orange,#FF6A00)",   label: "Menengah" },
  advanced:     { bg: "#FEE2E2",                    color: "#DC2626",                      label: "Lanjutan" },
};

function diffStyle(level: string) {
  return DIFFICULTY_STYLE[level] ?? { bg: "#F1F5F9", color: "#64748B", label: "Tidak Diketahui" };
}

// ─── Component ───────────────────────────────────────────────────────────────

const LearningHub = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Course data ──────────────────────────────────────────────────────────────
  const courseCategories: CourseCategory[] = [
    {
      id: "life-skills",
      title: "Life Skills",
      description: "Keterampilan hidup fundamental untuk masa depan",
      icon: Heart,
      color: "bg-rose-500",
      courses: [
        {
          id: "communication",
          title: "Komunikasi Efektif & Public Speaking",
          description: "Belajar berbicara di depan umum dengan percaya diri",
          project: "Membuat podcast/video 5 menit tentang isu sosial",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true,
        },
        {
          id: "leadership",
          title: "Kepemimpinan & Kerja Tim",
          description: "Mengembangkan jiwa kepemimpinan dan kolaborasi",
          project: "Simulasi community project (kegiatan bakti sosial sekolah)",
          duration: "3 minggu",
          difficulty: "intermediate",
        },
        {
          id: "financial-literacy",
          title: "Literasi Keuangan",
          description: "Mengelola keuangan dengan bijak sejak dini",
          project: "Simulasi membuat anggaran keluarga/UKM mini",
          duration: "2 minggu",
          difficulty: "beginner",
        },
        {
          id: "problem-solving",
          title: "Problem Solving & Critical Thinking",
          description: "Mengasah kemampuan berpikir kritis dan memecahkan masalah",
          project: "Studi kasus: mengurangi sampah plastik di sekolah",
          duration: "2 minggu",
          difficulty: "intermediate",
        },
      ],
    },
    {
      id: "digital-skills",
      title: "Digital Skills",
      description: "Keterampilan digital untuk era modern",
      icon: Code,
      color: "bg-blue-500",
      courses: [
        {
          id: "graphic-design",
          title: "Desain Grafis",
          description: "Membuat karya visual yang menarik dan profesional",
          project: "Buat poster digital untuk kampanye sekolah/lingkungan",
          duration: "3 minggu",
          difficulty: "beginner",
          isRecommended: true,
        },
        {
          id: "coding-basics",
          title: "Coding Dasar",
          description: "Pengenalan pemrograman dengan bahasa yang mudah dipahami",
          project: "Bikin game sederhana dengan Scratch/Python",
          duration: "4 minggu",
          difficulty: "beginner",
        },
        {
          id: "digital-marketing",
          title: "Digital Marketing",
          description: "Strategi pemasaran digital untuk generasi Z",
          project: "Jalankan mini campaign IG/TikTok untuk produk/jasa lokal",
          duration: "3 minggu",
          difficulty: "intermediate",
        },
        {
          id: "data-literacy",
          title: "Data Literacy",
          description: "Memahami dan menganalisis data dengan mudah",
          project: "Analisis data sederhana: survei minat siswa di sekolah",
          duration: "2 minggu",
          difficulty: "intermediate",
        },
      ],
    },
    {
      id: "vocational-skills",
      title: "Vocational Skills",
      description: "Keterampilan vokasional yang praktis dan aplikatif",
      icon: Briefcase,
      color: "bg-orange-500",
      courses: [
        {
          id: "culinary",
          title: "Tata Boga",
          description: "Seni memasak dan mengelola bisnis kuliner",
          project: "Buka pop-up cafe di sekolah untuk sehari",
          duration: "4 minggu",
          difficulty: "beginner",
        },
        {
          id: "fashion-design",
          title: "Fashion Design & Menjahit",
          description: "Merancang dan membuat busana dengan kreativitas",
          project: "Lomba upcycle pakaian bekas jadi produk baru",
          duration: "5 minggu",
          difficulty: "intermediate",
        },
        {
          id: "agribusiness",
          title: "Agribisnis",
          description: "Bisnis pertanian modern dan berkelanjutan",
          project: "Buat kebun hidroponik mini & jual hasil panen",
          duration: "6 minggu",
          difficulty: "beginner",
        },
        {
          id: "automotive",
          title: "Otomotif Dasar",
          description: "Pemahaman dasar sistem kendaraan bermotor",
          project: "Simulasi bengkel kecil (service sepeda motor sekolah)",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
      ],
    },
    {
      id: "entrepreneurship",
      title: "Entrepreneurship & Business",
      description: "Jiwa wirausaha dan keterampilan bisnis",
      icon: TrendingUp,
      color: "bg-green-500",
      courses: [
        {
          id: "business-model",
          title: "Business Model Canvas",
          description: "Merancang model bisnis yang solid dan terukur",
          project: "Susun BMC untuk ide usaha siswa",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true,
        },
        {
          id: "product-innovation",
          title: "Inovasi Produk & Prototyping",
          description: "Mengembangkan produk inovatif dari ide hingga prototype",
          project: "Kembangkan prototipe produk dengan barang sederhana",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
        {
          id: "pitching",
          title: "Pitching",
          description: "Mempresentasikan ide bisnis dengan meyakinkan",
          project: "Presentasi ide bisnis ke 'investor' (guru, orang tua, komunitas)",
          duration: "2 minggu",
          difficulty: "intermediate",
        },
        {
          id: "export-business",
          title: "Ekspor & Go Global",
          description: "Memahami pasar global dan strategi ekspor",
          project: "Riset produk lokal & buat export readiness plan",
          duration: "3 minggu",
          difficulty: "advanced",
        },
      ],
    },
    {
      id: "green-skills",
      title: "Green Skills & Sustainability",
      description: "Keterampilan untuk masa depan yang berkelanjutan",
      icon: TreePine,
      color: "bg-emerald-500",
      courses: [
        {
          id: "waste-management",
          title: "Pengelolaan Sampah",
          description: "Mengelola sampah dengan prinsip reduce, reuse, recycle",
          project: "Mendirikan bank sampah di sekolah/komunitas",
          duration: "3 minggu",
          difficulty: "beginner",
        },
        {
          id: "renewable-energy",
          title: "Energi Terbarukan",
          description: "Memahami dan memanfaatkan energi ramah lingkungan",
          project: "Membuat panel surya mini/lampu tenaga surya sederhana",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
        {
          id: "urban-farming",
          title: "Urban Farming",
          description: "Bertani di lahan terbatas dengan teknik modern",
          project: "Kebun vertikal di sekolah",
          duration: "5 minggu",
          difficulty: "beginner",
        },
        {
          id: "eco-entrepreneurship",
          title: "Eco-Entrepreneurship",
          description: "Bisnis yang menguntungkan dan ramah lingkungan",
          project: "Membuat produk ramah lingkungan & dijual di bazaar sekolah",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
      ],
    },
    {
      id: "soft-skills",
      title: "Soft Skills untuk Dunia Kerja",
      description: "Persiapan memasuki dunia profesional",
      icon: Users,
      color: "bg-purple-500",
      courses: [
        {
          id: "career-preparation",
          title: "Persiapan Karir",
          description: "Mempersiapkan diri untuk dunia kerja profesional",
          project: "Buat CV, LinkedIn, & mock interview",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true,
        },
        {
          id: "networking-branding",
          title: "Networking & Branding",
          description: "Membangun jaringan dan personal branding yang kuat",
          project: "Susun portfolio online",
          duration: "3 minggu",
          difficulty: "intermediate",
        },
        {
          id: "project-management",
          title: "Project Management",
          description: "Mengelola proyek dari perencanaan hingga eksekusi",
          project: "Jalankan event nyata (pameran, lomba, expo kecil)",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
        {
          id: "service-excellence",
          title: "Service Excellence",
          description: "Memberikan pelayanan terbaik kepada pelanggan",
          project: "Simulasi melayani pelanggan (role-play restoran/hotel)",
          duration: "2 minggu",
          difficulty: "beginner",
        },
      ],
    },
    {
      id: "steam-skills",
      title: "21st Century STEAM Skills",
      description: "Integrasi sains, teknologi, engineering, seni, dan matematika",
      icon: Cpu,
      color: "bg-indigo-500",
      courses: [
        {
          id: "robotics",
          title: "Robotics Dasar",
          description: "Pengenalan dunia robotika dan automasi",
          project: "Membuat robot line follower sederhana",
          duration: "5 minggu",
          difficulty: "intermediate",
        },
        {
          id: "game-based-learning",
          title: "Game-Based Learning",
          description: "Belajar melalui permainan yang edukatif",
          project: "Membuat boardgame edukasi",
          duration: "3 minggu",
          difficulty: "beginner",
        },
        {
          id: "ar-vr-education",
          title: "AR/VR untuk Edukasi",
          description: "Teknologi immersive untuk pembelajaran",
          project: "Buat AR sederhana pakai Assemblr",
          duration: "4 minggu",
          difficulty: "advanced",
        },
        {
          id: "steam-interdisciplinary",
          title: "STEAM Interdisipliner",
          description: "Menggabungkan berbagai disiplin ilmu dalam proyek",
          project: "Pameran karya gabungan sains, seni, teknologi",
          duration: "6 minggu",
          difficulty: "advanced",
        },
      ],
    },
    {
      id: "community-skills",
      title: "Community & Civic Skills",
      description: "Keterampilan untuk berkontribusi pada masyarakat",
      icon: Globe,
      color: "bg-teal-500",
      courses: [
        {
          id: "community-organizing",
          title: "Community Organizing",
          description: "Mengorganisir dan memobilisasi komunitas",
          project: "Buat program sosial lokal (literasi anak kecil di sekitar sekolah)",
          duration: "4 minggu",
          difficulty: "intermediate",
        },
        {
          id: "disaster-preparedness",
          title: "Disaster Preparedness",
          description: "Kesiapsiagaan menghadapi bencana alam",
          project: "Simulasi tanggap bencana di sekolah",
          duration: "2 minggu",
          difficulty: "beginner",
        },
        {
          id: "youth-empowerment",
          title: "Youth Empowerment",
          description: "Memberdayakan generasi muda untuk perubahan positif",
          project: "Adakan youth talkshow atau webinar SDGs",
          duration: "3 minggu",
          difficulty: "intermediate",
        },
      ],
    },
  ];

  // ── Auth / profile load ───────────────────────────────────────────────────

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, subscription_type")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profileData) setProfile(profileData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredCategories = courseCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.courses.some((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const activeCategoryObj = selectedCategory
    ? courseCategories.find((c) => c.id === selectedCategory) ?? null
    : null;

  const filteredCourses = activeCategoryObj
    ? activeCategoryObj.courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // ── Loading spinner ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--tk-gray-50,#F8FAFC)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--tk-blue-600,#2563EB)",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  // ── Shared style helpers ──────────────────────────────────────────────────

  const cardBase: React.CSSProperties = {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid var(--tk-gray-200,#E2E8F0)",
    padding: 24,
    transition: "box-shadow 0.2s, transform 0.2s",
  };

  const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
    whiteSpace: "nowrap",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SidebarProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--tk-gray-50,#F8FAFC)",
        }}
      >
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />

        <main
          className="tk-page-in"
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: 80,
            paddingTop: 0,
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 28px 0" }}>

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontFamily: "var(--tk-font-display,Poppins,sans-serif)",
                  fontWeight: 800,
                  fontSize: 30,
                  color: "var(--tk-ink,#0F172A)",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Kursus Saya
              </h1>
              <p
                style={{
                  fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                  fontSize: 15,
                  color: "var(--tk-gray-600,#475569)",
                  margin: "6px 0 0",
                }}
              >
                Kelola dan lanjutkan pembelajaran untuk mencapai tujuan terbaik.
              </p>

              {/* User badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                    fontSize: 13,
                    color: "var(--tk-gray-500,#64748B)",
                  }}
                >
                  {profile?.full_name || user?.email?.split("@")[0] || "Pengguna"}
                </span>
                <span
                  style={{
                    ...pillBase,
                    background:
                      profile?.subscription_type === "premium"
                        ? "var(--tk-blue-50,#EFF6FF)"
                        : "#F1F5F9",
                    color:
                      profile?.subscription_type === "premium"
                        ? "var(--tk-blue-700,#1D4ED8)"
                        : "var(--tk-gray-600,#475569)",
                    border:
                      profile?.subscription_type === "premium"
                        ? "1px solid var(--tk-blue-300,#93C5FD)"
                        : "1px solid var(--tk-gray-200,#E2E8F0)",
                  }}
                >
                  {profile?.subscription_type === "premium" ? "Premium" : "Individual"}
                </span>
              </div>
            </div>

            {/* ── Search Bar ────────────────────────────────────────────── */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid var(--tk-gray-200,#E2E8F0)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                marginBottom: 20,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <Search
                style={{
                  width: 18,
                  height: 18,
                  color: "var(--tk-gray-400,#94A3B8)",
                  flexShrink: 0,
                }}
              />
              <input
                type="text"
                placeholder="Cari kursus atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                  fontSize: 14,
                  color: "var(--tk-ink,#0F172A)",
                  background: "transparent",
                }}
              />
            </div>

            {/* ── Category Pill Filters ──────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                marginBottom: 28,
                scrollbarWidth: "none",
              }}
            >
              {/* "Semua" pill */}
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  ...pillBase,
                  padding: "8px 18px",
                  fontSize: 13,
                  cursor: "pointer",
                  border: selectedCategory === null
                    ? "none"
                    : "1px solid var(--tk-gray-200,#E2E8F0)",
                  background: selectedCategory === null
                    ? "var(--tk-blue-600,#2563EB)"
                    : "#fff",
                  color: selectedCategory === null ? "#fff" : "var(--tk-gray-600,#475569)",
                  fontWeight: 600,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Semua
              </button>
              {courseCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      ...pillBase,
                      padding: "8px 18px",
                      fontSize: 13,
                      cursor: "pointer",
                      border: active
                        ? "none"
                        : "1px solid var(--tk-gray-200,#E2E8F0)",
                      background: active
                        ? "var(--tk-blue-600,#2563EB)"
                        : "#fff",
                      color: active ? "#fff" : "var(--tk-gray-600,#475569)",
                      fontWeight: 600,
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {cat.title}
                  </button>
                );
              })}
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                VIEW A: No category selected — show category grid
            ═══════════════════════════════════════════════════════════════ */}
            {!selectedCategory && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
                  gap: 20,
                }}
              >
                {filteredCategories.map((cat) => {
                  const p = palette(cat.id);
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      style={{ ...cardBase, cursor: "pointer" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 8px 24px rgba(0,0,0,0.10)";
                        (e.currentTarget as HTMLDivElement).style.transform =
                          "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        (e.currentTarget as HTMLDivElement).style.transform = "none";
                      }}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {/* Icon badge */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          background: `linear-gradient(135deg,${p.gradStart},${p.gradEnd})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 16,
                        }}
                      >
                        <Icon style={{ width: 26, height: 26, color: p.fg }} />
                      </div>

                      {/* Title */}
                      <h3
                        style={{
                          fontFamily: "var(--tk-font-display,Poppins,sans-serif)",
                          fontWeight: 700,
                          fontSize: 18,
                          color: "var(--tk-ink,#0F172A)",
                          margin: "0 0 6px",
                        }}
                      >
                        {cat.title}
                      </h3>

                      {/* Description */}
                      <p
                        style={{
                          fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                          fontSize: 13,
                          color: "var(--tk-gray-600,#475569)",
                          margin: "0 0 14px",
                          lineHeight: 1.5,
                        }}
                      >
                        {cat.description}
                      </p>

                      {/* Footer row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Course count pill */}
                        <span
                          style={{
                            ...pillBase,
                            background: p.soft,
                            color: p.gradEnd,
                            border: `1px solid ${p.gradStart}33`,
                          }}
                        >
                          {cat.courses.length} kursus
                        </span>

                        {/* Jelajahi button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(cat.id);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "var(--tk-blue-600,#2563EB)",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Jelajahi
                          <ArrowRight style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                VIEW B: Category selected — show course list
            ═══════════════════════════════════════════════════════════════ */}
            {selectedCategory && activeCategoryObj && (
              <div>
                {/* Back button */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: "#fff",
                    border: "1px solid var(--tk-gray-200,#E2E8F0)",
                    color: "var(--tk-gray-600,#475569)",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                    cursor: "pointer",
                    marginBottom: 24,
                  }}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                  Kembali
                </button>

                {/* Category heading */}
                {(() => {
                  const p = palette(activeCategoryObj.id);
                  const Icon = activeCategoryObj.icon;
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: `linear-gradient(135deg,${p.gradStart},${p.gradEnd})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: 28, height: 28, color: "#fff" }} />
                      </div>
                      <div>
                        <h2
                          style={{
                            fontFamily: "var(--tk-font-display,Poppins,sans-serif)",
                            fontWeight: 700,
                            fontSize: 22,
                            color: "var(--tk-ink,#0F172A)",
                            margin: 0,
                          }}
                        >
                          {activeCategoryObj.title}
                        </h2>
                        <p
                          style={{
                            fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                            fontSize: 14,
                            color: "var(--tk-gray-600,#475569)",
                            margin: "4px 0 0",
                          }}
                        >
                          {activeCategoryObj.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Course cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {filteredCourses.map((course) => {
                    const p = palette(activeCategoryObj.id);
                    const Icon = activeCategoryObj.icon;
                    const diff = diffStyle(course.difficulty);
                    return (
                      <div
                        key={course.id}
                        style={{ ...cardBase, padding: 20 }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            "0 6px 20px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        }}
                      >
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                          {/* Icon badge */}
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 14,
                              background: `linear-gradient(135deg,${p.gradStart},${p.gradEnd})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon style={{ width: 22, height: 22, color: "#fff" }} />
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Title + recommended */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: 6,
                              }}
                            >
                              <h3
                                style={{
                                  fontFamily:
                                    "var(--tk-font-display,Poppins,sans-serif)",
                                  fontWeight: 700,
                                  fontSize: 16,
                                  color: "var(--tk-ink,#0F172A)",
                                  margin: 0,
                                }}
                              >
                                {course.title}
                              </h3>
                              {course.isRecommended && (
                                <span
                                  style={{
                                    ...pillBase,
                                    background: "var(--tk-blue-50,#EFF6FF)",
                                    color: "var(--tk-blue-700,#1D4ED8)",
                                    border: "1px solid var(--tk-blue-300,#93C5FD)",
                                  }}
                                >
                                  Direkomendasikan
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p
                              style={{
                                fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                                fontSize: 14,
                                color: "var(--tk-gray-600,#475569)",
                                margin: "0 0 12px",
                                lineHeight: 1.55,
                              }}
                            >
                              {course.description}
                            </p>

                            {/* Meta row */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 14,
                              }}
                            >
                              {/* Duration badge */}
                              <span
                                style={{
                                  ...pillBase,
                                  background: "#F1F5F9",
                                  color: "var(--tk-gray-600,#475569)",
                                  gap: 4,
                                }}
                              >
                                <Clock style={{ width: 12, height: 12 }} />
                                {course.duration}
                              </span>
                              {/* Difficulty badge */}
                              <span
                                style={{
                                  ...pillBase,
                                  background: diff.bg,
                                  color: diff.color,
                                }}
                              >
                                {diff.label}
                              </span>
                            </div>

                            {/* CTA */}
                            <button
                              onClick={() =>
                                navigate(`/learning/content/${course.id}`)
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                width: "100%",
                                padding: "10px 0",
                                borderRadius: 12,
                                background: "var(--tk-blue-600,#2563EB)",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 600,
                                fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                                border: "none",
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "var(--tk-blue-700,#1D4ED8)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "var(--tk-blue-600,#2563EB)";
                              }}
                            >
                              Mulai Kursus
                              <ArrowRight style={{ width: 16, height: 16 }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredCourses.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "48px 0",
                        color: "var(--tk-gray-400,#94A3B8)",
                        fontFamily: "var(--tk-font-sans,Inter,sans-serif)",
                        fontSize: 15,
                      }}
                    >
                      Tidak ada kursus yang cocok dengan pencarian.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <BottomNavigationBar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    </SidebarProvider>
  );
};

export default LearningHub;
