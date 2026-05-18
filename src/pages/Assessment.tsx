import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Microscope, Palette, Users, Briefcase, Calculator,
  ArrowRight, ChevronLeft, ExternalLink, Sparkles, RefreshCw,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── RIASEC type definitions ─────────────────────────────────────────────────
const riasecTypes = {
  realistic: {
    name: "Realistic",
    emoji: "🔧",
    icon: Wrench,
    gradient: "135deg, #FEF3C7, #FDE68A",
    accent: "#D97706",
    description:
      "Cenderung suka pekerjaan yang berorientasi dengan penerapan dari skill yang dimiliki, keterampilan fisik & minim keterampilan sosial",
    characteristics: ["Praktis", "Teknis", "Suka bekerja dengan tangan", "Oriented pada hasil nyata"],
    careers: ["Insinyur Mesin", "Teknisi", "Arsitek", "Ahli Konstruksi", "Pilot", "Chef", "Teknisi IT"],
  },
  investigative: {
    name: "Investigative",
    emoji: "🔬",
    icon: Microscope,
    gradient: "135deg, #D1FAE5, #A7F3D0",
    accent: "#0F7A3E",
    description:
      "Lebih suka pekerjaan yang mengandalkan analisa, pemahaman cara berpikir secara kreatif dan abstrak",
    characteristics: ["Analitis", "Intelektual", "Suka riset", "Problem solver"],
    careers: ["Peneliti", "Dokter", "Scientist", "Psikolog", "Data Scientist", "Ahli Forensik", "Profesor"],
  },
  artistic: {
    name: "Artistic",
    emoji: "🎨",
    icon: Palette,
    gradient: "135deg, #EDE9FE, #DDD6FE",
    accent: "#5B21B6",
    description:
      "Tipikal orang yang suka bekerja sama dengan orang lain untuk menghasilkan suatu hal yang dianggap 'Karya Seni'",
    characteristics: ["Kreatif", "Imajinatif", "Ekspresif", "Inovatif"],
    careers: ["Desainer Grafis", "Penulis", "Musisi", "Fotografer", "Animator", "Content Creator", "Art Director"],
  },
  social: {
    name: "Social",
    emoji: "🤝",
    icon: Users,
    gradient: "135deg, #DBEAFE, #BFDBFE",
    accent: "#1D4ED8",
    description:
      "Lebih suka pekerjaan yang bersifat membantu sesama. Punya karakter yang supel dan friendly.",
    characteristics: ["Empatis", "Komunikatif", "Suka membantu", "Team oriented"],
    careers: ["Guru", "Konselor", "Perawat", "Pekerja Sosial", "HR Manager", "Terapis", "Customer Service"],
  },
  enterprising: {
    name: "Enterprising",
    emoji: "💼",
    icon: Briefcase,
    gradient: "135deg, #FFEDE2, #FFD5BB",
    accent: "#FF6A00",
    description:
      "Suka bergaul dan berbicara dengan orang banyak, jago merangkai kata dan meyakinkan orang",
    characteristics: ["Persuasif", "Ambisius", "Leadership", "Goal oriented"],
    careers: ["Entrepreneur", "Sales Manager", "Marketing Director", "CEO", "Business Consultant", "Lawyer", "Politisi"],
  },
  conventional: {
    name: "Conventional",
    emoji: "📊",
    icon: Calculator,
    gradient: "135deg, #F1F5F9, #E2E8F0",
    accent: "#475569",
    description:
      "Karakternya formal banget, sangat setia, tipikal tim player yang baik. Suka pekerjaan terstruktur dan sistematis",
    characteristics: ["Terorganisir", "Detail oriented", "Sistematis", "Reliable"],
    careers: ["Akuntan", "Administrasi", "Sekretaris", "Auditor", "Perpustakaan", "Data Entry", "Quality Control"],
  },
};

// ─── RIASEC Questions ─────────────────────────────────────────────────────────
const riasecQuestions = [
  {
    category: "Aktivitas Kerja",
    question: "Dari aktivitas berikut, mana yang paling menarik bagimu?",
    options: [
      { text: "Memperbaiki mesin atau alat elektronik",          weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Melakukan eksperimen atau penelitian",             weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Mendesain atau menciptakan karya seni",            weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Mengajar atau membantu orang lain",                weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Memimpin tim atau memulai bisnis",                 weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengorganisir data dan dokumen",                   weight: { realistic: 0, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Lingkungan Kerja",
    question: "Lingkungan kerja seperti apa yang paling cocok denganmu?",
    options: [
      { text: "Workshop atau laboratorium dengan alat-alat praktis",          weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang penelitian atau perpustakaan yang tenang",               weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Studio kreatif atau ruang terbuka yang inspiratif",            weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang komunitas atau tempat berinteraksi dengan banyak orang", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Kantor dinamis dengan banyak meeting dan presentasi",          weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Kantor terstruktur dengan sistem dan prosedur yang jelas",     weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Kemampuan & Minat",
    question: "Kemampuan mana yang paling menggambarkan dirimu?",
    options: [
      { text: "Mahir menggunakan peralatan dan teknologi",       weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Analitis dan suka memecahkan masalah kompleks",   weight: { realistic: 1, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Kreatif dan imajinatif dalam berkarya",           weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Empati tinggi dan mudah berkomunikasi",           weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Persuasif dan berorientasi pada hasil",           weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Teliti dan terorganisir dengan baik",             weight: { realistic: 1, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 3 } },
    ],
  },
  {
    category: "Nilai & Motivasi",
    question: "Apa yang paling memotivasimu dalam bekerja?",
    options: [
      { text: "Melihat hasil kerja yang nyata dan bermanfaat",            weight: { realistic: 3, investigative: 1, artistic: 1, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Menemukan pengetahuan baru atau memecahkan misteri",        weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Mengekspresikan diri dan menciptakan sesuatu yang unik",   weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Membantu orang lain dan membuat perbedaan positif",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mencapai kesuksesan finansial dan status",                  weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 1 } },
      { text: "Stabilitas dan keamanan dalam pekerjaan",                   weight: { realistic: 1, investigative: 0, artistic: 0, social: 1, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Gaya Komunikasi",
    question: "Bagaimana cara kamu berkomunikasi yang paling efektif?",
    options: [
      { text: "Langsung ke pokok masalah dengan contoh praktis",       weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 1 } },
      { text: "Menyampaikan dengan data dan analisis mendalam",         weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 2 } },
      { text: "Menggunakan cerita dan visualisasi kreatif",             weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Mendengarkan dulu, lalu memberikan dukungan",            weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mempresentasikan dengan percaya diri dan meyakinkan",   weight: { realistic: 0, investigative: 0, artistic: 1, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengikuti prosedur komunikasi yang sudah ditetapkan",   weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Cara Belajar",
    question: "Metode belajar mana yang paling cocok untukmu?",
    options: [
      { text: "Learning by doing - praktik langsung",                   weight: { realistic: 3, investigative: 1, artistic: 1, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Membaca jurnal dan melakukan riset mendalam",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Eksperimen kreatif dan eksplorasi bebas",                weight: { realistic: 0, investigative: 1, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Diskusi kelompok dan sharing pengalaman",                weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Studi kasus bisnis dan simulasi",                        weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Mengikuti panduan step-by-step yang terstruktur",       weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Keputusan Karier",
    question: "Faktor apa yang paling penting dalam memilih karier?",
    options: [
      { text: "Bisa bekerja dengan tangan dan melihat hasil konkret",  weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kesempatan untuk terus belajar dan meneliti",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kebebasan berkreasi dan mengekspresikan diri",           weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Dapat membantu dan berinteraksi dengan banyak orang",   weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Peluang untuk memimpin dan mengembangkan bisnis",       weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 0 } },
      { text: "Pekerjaan yang stabil dengan aturan yang jelas",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
  {
    category: "Tantangan Kerja",
    question: "Jenis tantangan kerja mana yang membuatmu bersemangat?",
    options: [
      { text: "Memecahkan masalah teknis atau memperbaiki sistem",          weight: { realistic: 3, investigative: 2, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Menganalisis data kompleks untuk menemukan pola",            weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Menciptakan ide baru yang belum pernah ada",                weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Menyelesaikan konflik dan membangun hubungan",              weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Mencapai target penjualan atau mengembangkan pasar",        weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengelola sistem dan memastikan akurasi data",              weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } },
    ],
  },
];

// ─── letter labels ────────────────────────────────────────────────────────────
const LETTERS = ["A", "B", "C", "D", "E", "F"];

// ─── Main Component ───────────────────────────────────────────────────────────
const Assessment = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("intro");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [relatedOpportunities, setRelatedOpportunities] = useState<any[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);

  // RIASEC keyword map for opportunity matching
  const riasecKeywords: Record<string, string[]> = {
    realistic:     ["teknik", "engineering", "konstruksi", "teknologi", "mekanik"],
    investigative: ["riset", "sains", "penelitian", "data", "science", "kedokteran", "ilmiah"],
    artistic:      ["desain", "kreatif", "seni", "media", "komunikasi", "content"],
    social:        ["sosial", "pendidikan", "kesehatan", "komunitas", "mengajar"],
    enterprising:  ["bisnis", "wirausaha", "leadership", "kompetisi", "manajemen", "startup"],
    conventional:  ["akuntansi", "keuangan", "administrasi", "hukum", "audit"],
  };

  // Fetch relevant opportunities once results are ready
  useEffect(() => {
    if (phase !== "results") return;
    const fetchOpportunities = async () => {
      setLoadingOpps(true);
      try {
        const type = getPrimaryRiasecType();
        const keywords = riasecKeywords[type] || [];
        const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(",");

        let { data } = await supabase
          .from("scraped_content")
          .select("id, title, description, tags, deadline, url, poster_url")
          .or(orFilter)
          .limit(3);

        if (!data || data.length === 0) {
          const fallback = await supabase
            .from("scraped_content")
            .select("id, title, description, tags, deadline, url, poster_url")
            .limit(3);
          data = fallback.data;
        }
        setRelatedOpportunities(data || []);
      } catch (err) {
        console.error("Error fetching related opportunities:", err);
      } finally {
        setLoadingOpps(false);
      }
    };
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPrimaryRiasecTypeFromScores = (s: { [key: string]: number }) => {
    const keys: (keyof typeof riasecTypes)[] = ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"];
    const riasecScores = keys.reduce((acc, k) => ({ ...acc, [k]: s[k] || 0 }), {} as Record<string, number>);
    const maxScore = Math.max(...Object.values(riasecScores));
    return (Object.entries(riasecScores).find(([, v]) => v === maxScore)?.[0] || "realistic") as keyof typeof riasecTypes;
  };

  const getPrimaryRiasecType = () => getPrimaryRiasecTypeFromScores(scores);

  const saveAssessmentResults = async (allAnswers: { [key: number]: number }, s: { [key: string]: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const primaryType = getPrimaryRiasecTypeFromScores(s);
      const careerMappings: Record<string, string[]> = {
        realistic:     ["Teknik", "Konstruksi", "Pertanian", "Teknologi"],
        investigative: ["Sains", "Penelitian", "Matematika", "Kedokteran"],
        artistic:      ["Seni", "Design", "Media", "Kreatif"],
        social:        ["Pendidikan", "Konseling", "Sosial", "Kesehatan"],
        enterprising:  ["Bisnis", "Manajemen", "Penjualan", "Kewirausahaan"],
        conventional:  ["Akuntansi", "Administrasi", "Keuangan", "Organisasi"],
      };
      const { error } = await supabase.from("assessment_results").insert({
        user_id: user.id,
        assessment_type: "riasec_personality",
        personality_type: primaryType,
        questions_answers: allAnswers,
        score_breakdown: s,
        career_recommendations: careerMappings[primaryType] || [],
        talent_areas: [primaryType, ...Object.entries(s).sort(([, a], [, b]) => b - a).slice(1, 3).map(([k]) => k)],
      });
      if (error) console.error("Error saving assessment results:", error);
    } catch (err) {
      console.error("Error in saveAssessmentResults:", err);
    }
  };

  const calculateResults = async (allAnswers: { [key: number]: number }) => {
    const newScores: { [key: string]: number } = {};
    riasecQuestions.forEach((q, qi) => {
      const ai = allAnswers[qi];
      if (ai !== undefined) {
        Object.entries(q.options[ai].weight).forEach(([trait, w]) => {
          newScores[trait] = (newScores[trait] || 0) + (w as number);
        });
      }
    });
    setScores(newScores);
    await saveAssessmentResults(allAnswers, newScores);
    setPhase("results");
  };

  // ── Quiz option click — auto-advance after short delay ────────────────────
  const handleOptionClick = (index: number) => {
    if (autoAdvancing) return;
    setSelectedAnswer(index);
    setAutoAdvancing(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [currentStep]: index };
      setAnswers(newAnswers);
      if (currentStep < riasecQuestions.length - 1) {
        setCurrentStep(s => s + 1);
        setSelectedAnswer(null);
        setAutoAdvancing(false);
      } else {
        calculateResults(newAnswers);
      }
    }, 380);
  };

  const handleBack = () => {
    if (currentStep > 0 && !autoAdvancing) {
      setCurrentStep(s => s - 1);
      setSelectedAnswer(answers[currentStep - 1] ?? null);
    }
  };

  const handleRetake = () => {
    setPhase("intro");
    setCurrentStep(0);
    setAnswers({});
    setScores({});
    setSelectedAnswer(null);
    setAutoAdvancing(false);
  };

  // ── Shared page wrapper ───────────────────────────────────────────────────
  const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #F1F5FB 0%, #E8F1FF 50%, #F0F7FF 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 16px" : "18px 32px",
          background: "rgba(255,255,255,.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--tk-gray-200)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 20,
            color: "var(--tk-blue-700)",
            letterSpacing: "-.02em",
          }}
        >
          Talentika
          <span style={{ color: "var(--tk-yellow)", fontSize: 16 }}>✦</span>
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 99,
            background: "var(--tk-blue-50)",
            color: "var(--tk-blue-700)",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <Sparkles size={13} /> Talent Test RIASEC
        </span>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--tk-gray-500)",
          }}
        >
          <LayoutDashboard size={14} /> Dashboard
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px 60px" }}>
        {children}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 1 — INTRO
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "intro") {
    const typeEntries = Object.entries(riasecTypes) as [keyof typeof riasecTypes, (typeof riasecTypes)[keyof typeof riasecTypes]][];
    return (
      <PageShell>
        {/* Hero */}
        <div style={{ textAlign: "center", maxWidth: 620, marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 99,
              background: "var(--tk-lilac)",
              color: "#5B21B6",
              fontFamily: "var(--tk-font-mono)",
              fontWeight: 700,
              fontSize: 11.5,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 20,
            }}
          >
            RIASEC Personality Assessment
          </div>
          <h1
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 42,
              color: "var(--tk-ink)",
              letterSpacing: "-.03em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Temukan Tipe{" "}
            <span style={{ color: "var(--tk-blue-600)" }}>Kepribadianmu</span>!
          </h1>
          <p style={{ color: "var(--tk-gray-500)", fontSize: 16, lineHeight: 1.65 }}>
            Ikuti 8 pertanyaan sederhana untuk mengetahui tipe kepribadian RIASEC-mu
            dan dapatkan rekomendasi karier yang tepat.
          </p>
        </div>

        {/* 6 personality type cards (3×2 desktop, 2×3 mobile) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: 14,
            maxWidth: 780,
            width: "100%",
            marginBottom: 40,
          }}
        >
          {typeEntries.map(([key, t]) => {
            const Icon = t.icon;
            return (
              <div
                key={key}
                className="rounded-2xl transition-shadow hover:shadow-md"
                style={{
                  background: "white",
                  border: "1px solid var(--tk-gray-200)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `linear-gradient(${t.gradient})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--tk-ink)",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-mono)",
                        fontSize: 10.5,
                        color: t.accent,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      {key.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--tk-gray-500)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties}
                >
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={() => setPhase("quiz")}
          className="inline-flex items-center gap-3 rounded-2xl transition-all"
          style={{
            padding: "16px 48px",
            background: "var(--tk-blue-600)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 17,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(37,99,235,.35)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
        >
          Mulai Talent Test <ArrowRight size={18} />
        </button>

        {/* trust line */}
        <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--tk-gray-400)", fontFamily: "var(--tk-font-sans)" }}>
          ✓ Gratis &nbsp;·&nbsp; ✓ 8 Pertanyaan &nbsp;·&nbsp; ✓ Hasil Instan
        </p>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 2 — QUIZ
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "quiz") {
    const q = riasecQuestions[currentStep];
    const progress = ((currentStep + 1) / riasecQuestions.length) * 100;

    return (
      <PageShell>
        <div style={{ width: "100%", maxWidth: 660 }}>
          {/* Progress */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--tk-font-mono)",
                  fontSize: 13,
                  color: "var(--tk-gray-500)",
                  fontWeight: 600,
                }}
              >
                {currentStep + 1} / {riasecQuestions.length}
              </span>
              <span
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontSize: 13,
                  color: "var(--tk-blue-600)",
                  fontWeight: 700,
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 99,
                background: "var(--tk-gray-200)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, var(--tk-blue-500), var(--tk-blue-600))",
                  width: `${progress}%`,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>

          {/* Question card */}
          <div
            className="tk-card"
            style={{
              background: "white",
              borderRadius: 24,
              border: "1px solid var(--tk-gray-200)",
              boxShadow: "0 8px 32px rgba(0,0,0,.09)",
              padding: "36px 32px",
              marginBottom: 24,
            }}
          >
            {/* Category label */}
            <div
              style={{
                fontFamily: "var(--tk-font-mono)",
                fontWeight: 700,
                fontSize: 11,
                color: "var(--tk-gray-400)",
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 14,
              }}
            >
              {q.category}
            </div>

            {/* Question */}
            <h2
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 22,
                color: "var(--tk-ink)",
                lineHeight: 1.35,
                marginBottom: 28,
              }}
            >
              {q.question}
            </h2>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(idx)}
                    disabled={autoAdvancing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 16px",
                      borderRadius: 14,
                      border: isSelected
                        ? "2px solid var(--tk-blue-600)"
                        : "1.5px solid var(--tk-gray-200)",
                      background: isSelected ? "var(--tk-blue-600)" : "white",
                      cursor: autoAdvancing ? "default" : "pointer",
                      textAlign: "left",
                      transition: "all .2s ease",
                      width: "100%",
                    } as React.CSSProperties}
                    onMouseEnter={e => {
                      if (!isSelected && !autoAdvancing) {
                        (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-50)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-blue-400)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.background = "white";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)";
                      }
                    }}
                  >
                    {/* Letter badge */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isSelected ? "rgba(255,255,255,.25)" : "var(--tk-blue-50)",
                        color: isSelected ? "#fff" : "var(--tk-blue-600)",
                        fontFamily: "var(--tk-font-mono)",
                        fontWeight: 800,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {LETTERS[idx]}
                    </span>

                    {/* Option text */}
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--tk-font-sans)",
                        fontWeight: 500,
                        fontSize: 14,
                        color: isSelected ? "#fff" : "var(--tk-ink)",
                        lineHeight: 1.45,
                      }}
                    >
                      {opt.text}
                    </span>

                    {/* Arrow */}
                    <ArrowRight
                      size={15}
                      style={{
                        flexShrink: 0,
                        color: isSelected ? "#fff" : "var(--tk-gray-400)",
                        opacity: isSelected ? 1 : 0.5,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Back button */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              disabled={autoAdvancing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: autoAdvancing ? "default" : "pointer",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--tk-gray-500)",
                padding: "8px 4px",
              }}
            >
              <ChevronLeft size={16} /> Pertanyaan Sebelumnya
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN 3 — RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  const primaryType = getPrimaryRiasecType();
  const personalityData = riasecTypes[primaryType];
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const percentage = totalScore > 0 ? Math.round(((scores[primaryType] || 0) / totalScore) * 100) : 0;
  const TypeIcon = personalityData.icon;

  return (
    <PageShell>
      <div style={{ width: "100%", maxWidth: 720 }}>
        {/* Result hero card */}
        <div
          style={{
            background: "white",
            borderRadius: 28,
            border: "1px solid var(--tk-gray-200)",
            boxShadow: "0 16px 48px rgba(0,0,0,.1)",
            padding: isMobile ? "32px 20px" : "44px 40px",
            textAlign: "center",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Sparkle decorations */}
          <span className="tk-sparkle" style={{ position: "absolute", top: 20, left: 40, fontSize: 18, color: "var(--tk-yellow)" }}>✦</span>
          <span className="tk-sparkle" style={{ position: "absolute", top: 50, right: 50, fontSize: 13, color: "var(--tk-blue-400)" }}>✦</span>
          <span className="tk-sparkle" style={{ position: "absolute", bottom: 30, left: 80, fontSize: 10, color: "var(--tk-orange)", opacity: 0.7 }}>✦</span>

          {/* Category mono label */}
          <div
            style={{
              fontFamily: "var(--tk-font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--tk-gray-400)",
              textTransform: "uppercase",
              letterSpacing: ".12em",
              marginBottom: 20,
            }}
          >
            Hasil Talent Test
          </div>

          {/* Avatar circle */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${personalityData.gradient.split(",")[1].trim()}, ${personalityData.accent})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 40,
              boxShadow: `0 8px 24px ${personalityData.accent}44`,
            }}
          >
            {personalityData.emoji}
          </div>

          {/* Type name */}
          <h2
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 800,
              fontSize: 30,
              color: "var(--tk-ink)",
              letterSpacing: "-.02em",
              marginBottom: 10,
            }}
          >
            Tipe {personalityData.name}
          </h2>

          {/* Description */}
          <p
            style={{
              color: "var(--tk-gray-500)",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: "50ch",
              margin: "0 auto 24px",
            }}
          >
            {personalityData.description}
          </p>

          {/* Match percentage bar */}
          <div style={{ maxWidth: 400, margin: "0 auto 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-gray-500)" }}>Tingkat Kesesuaian</span>
              <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, color: personalityData.accent }}>{percentage}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${personalityData.gradient.split(",")[1].trim()}, ${personalityData.accent})`,
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>

          {/* Characteristic pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            {personalityData.characteristics.map(ch => (
              <span
                key={ch}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "var(--tk-blue-50)",
                  color: "var(--tk-blue-700)",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 12.5,
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>

        {/* Career recommendations */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TypeIcon size={18} style={{ color: personalityData.accent }} />
            Rekomendasi Karier
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {personalityData.careers.map(c => (
              <span
                key={c}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 14px",
                  borderRadius: 99,
                  background: "var(--tk-orange-soft)",
                  color: "var(--tk-orange)",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* RIASEC score breakdown */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 20,
            }}
          >
            Detail Skor RIASEC
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 14 }}>
            {(Object.entries(riasecTypes) as [keyof typeof riasecTypes, (typeof riasecTypes)[keyof typeof riasecTypes]][]).map(([key, t]) => {
              const sc = scores[key] || 0;
              const pct = totalScore > 0 ? (sc / totalScore) * 100 : 0;
              const Icon = t.icon;
              const isPrimary = key === primaryType;
              return (
                <div
                  key={key}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: isPrimary ? `2px solid ${t.accent}` : "1.5px solid var(--tk-gray-200)",
                    background: isPrimary ? `linear-gradient(${t.gradient})` : "var(--tk-gray-50)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: isPrimary ? "rgba(255,255,255,.6)" : `linear-gradient(${t.gradient})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={14} style={{ color: t.accent }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--tk-ink)",
                      }}
                    >
                      {t.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--tk-gray-500)" }}>Skor: {sc}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.6)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: t.accent,
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personalized opportunities */}
        <div
          style={{
            background: "white",
            borderRadius: 24,
            border: "1px solid var(--tk-gray-200)",
            padding: isMobile ? "20px 16px" : "28px 32px",
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--tk-ink)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Sparkles size={18} style={{ color: "var(--tk-yellow)" }} />
            Peluang untuk Tipe {personalityData.name}
          </h3>
          <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 18 }}>
            Beasiswa, magang &amp; kompetisi yang cocok dengan kepribadianmu
          </p>
          {loadingOpps ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: 130, borderRadius: 14, background: "var(--tk-gray-100)" }} className="animate-pulse" />
              ))}
            </div>
          ) : relatedOpportunities.length > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
                {relatedOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: "1.5px solid var(--tk-gray-200)",
                      background: "var(--tk-gray-50)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 3,
                        borderRadius: 99,
                        background: personalityData.accent,
                        marginBottom: 4,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as React.CSSProperties}
                    >
                      {opp.title}
                    </p>
                    {opp.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--tk-gray-500)",
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}
                      >
                        {opp.description}
                      </p>
                    )}
                    {opp.deadline && (
                      <p style={{ fontSize: 11.5, color: "var(--tk-orange)", fontWeight: 600, marginTop: "auto" }}>
                        📅 {new Date(opp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {opp.url && (
                      <button
                        onClick={() => window.open(opp.url, "_blank", "noopener,noreferrer")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--tk-font-display)",
                          fontWeight: 600,
                          fontSize: 12,
                          color: "var(--tk-blue-600)",
                          padding: 0,
                          marginTop: 4,
                        }}
                      >
                        <ExternalLink size={11} /> Lihat detail →
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => navigate("/opportunities")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 22px",
                    borderRadius: 12,
                    border: "1.5px solid var(--tk-blue-300)",
                    background: "var(--tk-blue-50)",
                    cursor: "pointer",
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--tk-blue-700)",
                  }}
                >
                  <ExternalLink size={13} /> Lihat semua peluang →
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 14, marginBottom: 14 }}>
                Temukan beasiswa, magang, dan kompetisi yang cocok untukmu.
              </p>
              <button
                onClick={() => navigate("/opportunities")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--tk-blue-600)",
                  cursor: "pointer",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#fff",
                }}
              >
                <ExternalLink size={13} /> Jelajahi Semua Peluang
              </button>
            </div>
          )}
        </div>

        {/* Recommended courses based on RIASEC type */}
        {(() => {
          const courseMap: Record<string, { emoji: string; title: string; desc: string; tag: string }[]> = {
            realistic:     [
              { emoji: "🛠️", title: "Teknik & Rekayasa Dasar", desc: "Pelajari prinsip dasar rekayasa, mekanik, dan pembuatan produk fisik.", tag: "Teknik" },
              { emoji: "💻", title: "Pemrograman untuk Pemula", desc: "Mulai coding dari nol — logika, variabel, dan membangun program pertamamu.", tag: "Teknologi" },
              { emoji: "📐", title: "Desain Produk & Prototyping", desc: "Dari ide ke prototipe: belajar merancang produk yang fungsional dan estetis.", tag: "Desain" },
            ],
            investigative: [
              { emoji: "📊", title: "Analisis Data dengan Python", desc: "Transformasi data mentah menjadi insight bermakna menggunakan Python & Pandas.", tag: "Data Science" },
              { emoji: "🔬", title: "Riset & Metodologi Ilmiah", desc: "Pelajari cara merancang penelitian yang valid dan menyajikan hasilnya.", tag: "Riset" },
              { emoji: "🧮", title: "Statistika untuk Pemula", desc: "Dasar probabilitas, distribusi, dan pengujian hipotesis secara praktis.", tag: "Matematika" },
            ],
            artistic:      [
              { emoji: "🎨", title: "UI/UX Design Fundamental", desc: "Prinsip desain antarmuka yang indah dan pengalaman pengguna yang intuitif.", tag: "Desain" },
              { emoji: "✍️", title: "Content Writing & Copywriting", desc: "Tulis konten yang menarik, persuasif, dan relevan untuk audiens digitalmu.", tag: "Konten" },
              { emoji: "🎬", title: "Video Editing & Storytelling", desc: "Buat video yang menghipnotis — teknik editing, color grading, dan narasi.", tag: "Kreatif" },
            ],
            social:        [
              { emoji: "🤝", title: "Public Speaking & Presentasi", desc: "Bicara dengan percaya diri di depan umum dan sampaikan pesan yang berkesan.", tag: "Komunikasi" },
              { emoji: "🧘", title: "Psikologi Dasar & Empati", desc: "Pahami perilaku manusia, emosi, dan cara membangun hubungan bermakna.", tag: "Psikologi" },
              { emoji: "🏫", title: "Pendidikan & Fasilitasi", desc: "Teknik mengajar efektif, merancang kurikulum, dan memfasilitasi belajar.", tag: "Pendidikan" },
            ],
            enterprising:  [
              { emoji: "🚀", title: "Kewirausahaan & Startup", desc: "Dari ide ke bisnis nyata — validasi pasar, pitch, dan scale-up.", tag: "Bisnis" },
              { emoji: "📣", title: "Digital Marketing Fundamentals", desc: "SEO, social media, dan iklan digital untuk tumbuhkan bisnis online.", tag: "Marketing" },
              { emoji: "💼", title: "Leadership & Manajemen Tim", desc: "Pelajari cara memimpin tim, membuat keputusan, dan mengelola konflik.", tag: "Leadership" },
            ],
            conventional:  [
              { emoji: "📋", title: "Manajemen Proyek dengan Agile", desc: "Kelola proyek secara terstruktur dengan metode Scrum dan Kanban.", tag: "Manajemen" },
              { emoji: "💹", title: "Akuntansi & Keuangan Dasar", desc: "Pahami laporan keuangan, arus kas, dan prinsip akuntansi untuk bisnis.", tag: "Keuangan" },
              { emoji: "🗂️", title: "Produktivitas & Manajemen Waktu", desc: "Sistem kerja efisien, prioritisasi tugas, dan kebiasaan yang menghasilkan.", tag: "Produktivitas" },
            ],
          };
          const courses = courseMap[primaryType] ?? courseMap.investigative;
          return (
            <div
              style={{
                background: "white",
                borderRadius: 24,
                border: "1px solid var(--tk-gray-200)",
                padding: isMobile ? "20px 16px" : "28px 32px",
                marginBottom: 32,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--tk-ink)",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>🎓</span>
                Kursus yang Cocok untuk Tipe {personalityData.name}
              </h3>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13, marginBottom: 20 }}>
                Mulai belajar sekarang dengan kursus yang dirancang khusus untuk tipe kepribadianmu.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
                {courses.map((course, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "18px 16px",
                      borderRadius: 16,
                      border: "1.5px solid var(--tk-gray-200)",
                      background: "var(--tk-gray-50)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      cursor: "pointer",
                      transition: "box-shadow .2s, border-color .2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "var(--tk-shadow-lg)";
                      (e.currentTarget as HTMLElement).style.borderColor = personalityData.accent;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)";
                    }}
                    onClick={() => navigate("/learning")}
                  >
                    <div style={{ fontSize: 30 }}>{course.emoji}</div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 99,
                        background: `${personalityData.accent}18`,
                        color: personalityData.accent,
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 11,
                        width: "fit-content",
                      }}
                    >
                      {course.tag}
                    </span>
                    <div
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 700,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        lineHeight: 1.35,
                      }}
                    >
                      {course.title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--tk-gray-500)", lineHeight: 1.5 }}>
                      {course.desc}
                    </div>
                    <div
                      style={{
                        marginTop: "auto",
                        fontSize: 12,
                        fontWeight: 700,
                        color: personalityData.accent,
                        fontFamily: "var(--tk-font-display)",
                      }}
                    >
                      Mulai belajar →
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => navigate("/learning")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 22px",
                    borderRadius: 12,
                    border: "1.5px solid var(--tk-blue-300)",
                    background: "var(--tk-blue-50)",
                    cursor: "pointer",
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--tk-blue-700)",
                  }}
                >
                  Lihat semua kursus →
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Laporan Lengkap CTA ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 50%, #FEF3C7 100%)",
            border: "2px solid #FED7AA",
            borderRadius: 24,
            padding: isMobile ? "24px 20px" : "32px 40px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative blob */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,.15) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: 24, position: "relative" }}>
            {/* Left: icon + copy */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "#92400E", letterSpacing: "-.01em" }}>
                    Laporan Asesmen Lengkap
                  </div>
                  <div style={{ fontSize: 13, color: "#B45309", fontWeight: 600 }}>
                    Rp 29.000 · bayar sekali, berlaku selamanya
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                Dapatkan analisis mendalam tentang tipe <strong>{personalityData.name}</strong>-mu, jalur karier yang paling tepat, rekomendasi kuliah & jurusan, serta roadmap pengembangan diri — dalam format PDF profesional yang bisa kamu simpan & bagikan.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {["✓ 15+ halaman analisis", "✓ Rekomendasi jurusan", "✓ Roadmap karier", "✓ Format PDF profesional"].map(item => (
                  <span key={item} style={{ fontSize: 12, fontWeight: 600, color: "#B45309", background: "rgba(251,191,36,.2)", padding: "3px 10px", borderRadius: 99 }}>{item}</span>
                ))}
              </div>
            </div>

            {/* Right: price + CTA */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "stretch" : "center", gap: 10, flexShrink: 0, minWidth: isMobile ? undefined : 160 }}>
              <div style={{ textAlign: "center", fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "#C2410C" }}>
                Rp 29.000
              </div>
              <button
                onClick={() => navigate("/subscription")}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "13px 24px",
                  borderRadius: 14,
                  border: "none",
                  background: "linear-gradient(135deg,#F97316,#EA580C)",
                  color: "#fff",
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px -4px rgba(234,88,12,.4)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#EA580C,#C2410C)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,#F97316,#EA580C)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Beli Laporan
              </button>
              <div style={{ textAlign: "center", fontSize: 11, color: "#B45309", fontWeight: 500 }}>
                Tidak perlu berlangganan
              </div>
            </div>
          </div>
        </div>

        {/* CTA: Lihat Dashboard + Retake */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 56px",
              borderRadius: 20,
              border: "none",
              background: "var(--tk-blue-600)",
              cursor: "pointer",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 17,
              color: "#fff",
              boxShadow: "0 8px 24px rgba(37,99,235,.35)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
          >
            <LayoutDashboard size={18} /> Lihat Dashboard <ArrowRight size={18} />
          </button>

          {/* ── Share hasil ── */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  `Aku baru selesai tes minat & bakat di Talentika! 🎉\n\nHasilnya: *${personalityData?.label ?? primaryType}* (${percentage}%)\n\n"${personalityData?.desc ?? ""}"\n\nCoba juga yuk, gratis! 👉 ${window.location.origin}`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#25D366", border: "none", borderRadius: 12,
                padding: "11px 20px", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#fff",
                boxShadow: "0 4px 12px rgba(37,211,102,.35)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Bagikan via WhatsApp
            </button>

            <button
              onClick={() => {
                const text = `Hasil assessment Talentika-ku: ${personalityData?.label ?? primaryType} (${percentage}%)\n${window.location.origin}`;
                if (navigator.share) {
                  navigator.share({ title: "Hasil Assessment Talentika", text, url: window.location.origin });
                } else {
                  navigator.clipboard.writeText(text).then(() => {
                    import("sonner").then(({ toast }) => toast.success("Hasil disalin!"));
                  });
                }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "none", border: "1.5px solid var(--tk-gray-200)", borderRadius: 12,
                padding: "11px 20px", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14, color: "var(--tk-gray-600)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Bagikan Hasil
            </button>
          </div>

          <button
            onClick={handleRetake}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "1.5px solid var(--tk-gray-200)",
              borderRadius: 12,
              cursor: "pointer",
              padding: "10px 24px",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--tk-gray-500)",
            }}
          >
            <RefreshCw size={14} /> Tes Ulang
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default Assessment;
