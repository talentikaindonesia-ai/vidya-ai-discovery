import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Clock, Eye, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ──────────────────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  category: string;
  tags: string[];
  view_count: number;
  reading_time_minutes: number;
  created_at: string;
  published_at: string;
  is_featured: boolean;
  seo_title?: string;
  seo_description?: string;
}

interface DA { // DisplayArticle
  id: string | number;
  cat: string;
  featured: boolean;
  tags: string[];
  title: string;
  desc: string;
  read: number;
  views: number;
  date: string;
  slug: string;
  thumb: string;
  brand_hashtag: string;
  brand_name: string;
  highlight: boolean;
  image_url?: string;
}

// ── Static data ────────────────────────────────────────────────────────────
const DUMMY: DA[] = [
  { id:1, cat:"karir", featured:true, tags:["CV fresh graduate","cara membuat CV"], title:"Cara Membuat CV Fresh Graduate yang Menarik HRD (+ Tips ATS)", desc:"Panduan lengkap membuat CV fresh graduate yang profesional, lolos sistem ATS, dan berhasil menarik perhatian HRD — lengkap dengan contoh dan tips dari rekruter.", read:8, views:1240, date:"2/5/2026", slug:"cara-membuat-cv-fresh-graduate", thumb:"tbg-karir", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:2, cat:"pengembangan", featured:true, tags:["jurusan kuliah","prospek kerja"], title:"10 Jurusan Kuliah dengan Prospek Kerja Terbaik di Indonesia 2026", desc:"Bingung memilih jurusan kuliah? Berikut 10 jurusan dengan prospek karir terbaik, gaji tertinggi, dan paling diminati industri di Indonesia pada 2026.", read:9, views:980, date:"2/5/2026", slug:"10-jurusan-prospek-kerja-terbaik", thumb:"tbg-pengembangan", brand_hashtag:"Temukan", brand_name:"Minat & Bakatmu", highlight:false },
  { id:3, cat:"beasiswa", featured:true, tags:["beasiswa internasional","mahasiswa"], title:"10 Beasiswa Internasional Terbaik untuk Mahasiswa Indonesia 2026", desc:"Daftar 10 beasiswa internasional bergengsi yang terbuka untuk mahasiswa Indonesia, lengkap dengan nominal, syarat, dan cara mendaftar di setiap program.", read:10, views:2100, date:"2/5/2026", slug:"beasiswa-internasional-terbaik", thumb:"tbg-beasiswa", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:4, cat:"karir", featured:false, tags:["MBTI","RIASEC"], title:"MBTI vs RIASEC: Mana yang Lebih Tepat untuk Memilih Karier?", desc:"Perbandingan mendalam antara MBTI dan RIASEC sebagai alat tes kepribadian untuk pilih karir — kelebihan, kekurangan, dan mana yang lebih akurat secara ilmiah.", read:7, views:2, date:"2/5/2026", slug:"mbti-vs-riasec", thumb:"tbg-karir", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:5, cat:"karir", featured:false, tags:["magang mahasiswa","internship"], title:"Panduan Lengkap Magang untuk Mahasiswa: Cara Dapat, Tips Sukses, dan Manfaatnya", desc:"Dari cara mencari magang, mempersiapkan diri, hingga memaksimalkan pengalaman magang — panduan ini menjawab semua pertanyaan mahasiswa tentang internship.", read:9, views:0, date:"2/5/2026", slug:"panduan-magang-mahasiswa", thumb:"tbg-karir", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:true },
  { id:6, cat:"karir", featured:false, tags:["wawancara kerja","interview tips"], title:"12 Pertanyaan Interview Kerja yang Paling Sering Ditanyakan & Cara Jawabnya", desc:"Persiapkan diri untuk interview kerja dengan mengetahui pertanyaan-pertanyaan umum yang sering ditanyakan HRD beserta strategi menjawab yang tepat.", read:8, views:620, date:"2/5/2026", slug:"pertanyaan-interview-kerja", thumb:"tbg-karir", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:7, cat:"pengembangan", featured:false, tags:["karir","minat bakat"], title:"5 Cara Mengenali Bakat Terpendam yang Jarang Disadari", desc:"Banyak orang tidak menyadari bakat terbesar mereka. Berikut cara-cara praktis untuk mengenali dan mengembangkan potensi tersembunyi dalam dirimu.", read:6, views:445, date:"2/5/2026", slug:"mengenali-bakat-terpendam", thumb:"tbg-pengembangan", brand_hashtag:"Kembangkan", brand_name:"Potensimu", highlight:false },
  { id:8, cat:"beasiswa", featured:false, tags:["beasiswa pemerintah","beasiswa S1"], title:"Panduan Lengkap Beasiswa KIP Kuliah 2026: Syarat, Cara Daftar & Tips Lolos", desc:"KIP Kuliah adalah program beasiswa pemerintah untuk mahasiswa berprestasi dari keluarga kurang mampu. Simak panduan lengkapnya di sini.", read:10, views:1120, date:"2/5/2026", slug:"beasiswa-kip-kuliah", thumb:"tbg-beasiswa", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:9, cat:"skills", featured:false, tags:["public speaking","soft skills"], title:"7 Cara Efektif Meningkatkan Public Speaking untuk Pemula", desc:"Public speaking adalah skill penting di era modern. Berikut 7 cara terbukti untuk meningkatkan kemampuan berbicara di depan umum mulai dari nol.", read:6, views:312, date:"10/4/2026", slug:"public-speaking-pemula", thumb:"tbg-skills", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:10, cat:"pengembangan", featured:false, tags:["produktivitas","time management"], title:"Teknik Pomodoro & Time Blocking: Mana yang Cocok untuk Kamu?", desc:"Dua teknik manajemen waktu populer diuji dan dibandingkan untuk membantu kamu menemukan gaya belajar dan kerja yang paling efektif.", read:5, views:188, date:"8/4/2026", slug:"pomodoro-vs-time-blocking", thumb:"tbg-pengembangan", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:11, cat:"beasiswa", featured:false, tags:["beasiswa LPDP","tips"], title:"Tips Lolos Seleksi Beasiswa LPDP 2026 dari Para Awardee", desc:"Panduan lengkap persiapan beasiswa LPDP dari awardee yang sudah berhasil: dari Essay of Purpose, wawancara, hingga seleksi substansi.", read:12, views:1560, date:"3/4/2026", slug:"tips-lpdp-2026", thumb:"tbg-beasiswa", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
  { id:12, cat:"skills", featured:false, tags:["LinkedIn","personal branding"], title:"Cara Optimasi Profil LinkedIn agar Dilirik Recruiter 2026", desc:"Profil LinkedIn yang kuat adalah kunci karir modern. Berikut panduan lengkap optimasi LinkedIn mulai dari foto profil hingga keyword yang tepat.", read:7, views:890, date:"1/4/2026", slug:"optimasi-linkedin", thumb:"tbg-skills", brand_hashtag:"#MULAIDARI", brand_name:"Talentika", highlight:false },
];

const POPULAR = [
  { id:11, title:"Tips Lolos Seleksi Beasiswa LPDP 2026", meta:"🕐 12 min · 1.5k views" },
  { id:1,  title:"Cara Membuat CV Fresh Graduate yang Menarik HRD", meta:"🕐 8 min · 1.2k views" },
  { id:12, title:"Cara Optimasi Profil LinkedIn 2026", meta:"🕐 7 min · 890 views" },
  { id:3,  title:"10 Beasiswa Internasional Terbaik 2026", meta:"🕐 10 min · 2.1k views" },
  { id:9,  title:"7 Cara Meningkatkan Public Speaking", meta:"🕐 6 min · 312 views" },
];

const TOPICS = ["MBTI","RIASEC","CV Menarik","Magang","Beasiswa S1","Public Speaking","LinkedIn","Soft Skills","Networking","Startup","Remote Work","Portfolio"];

const PER_PAGE = 6;

const CAT_TABS = [
  { key: "semua", label: "Semua" },
  { key: "karir", label: "Karir" },
  { key: "beasiswa", label: "Beasiswa" },
  { key: "skills", label: "Skills" },
  { key: "pengembangan", label: "Pengembangan Diri" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeCat(category: string): string {
  const c = (category || "").toLowerCase();
  if (c.includes("beasiswa") || c.includes("scholarship")) return "beasiswa";
  if (c.includes("skill")) return "skills";
  if (c.includes("pengembangan") || c.includes("development") || c.includes("personal")) return "pengembangan";
  if (c.includes("tips")) return "tips";
  return "karir";
}

function catColors(cat: string) {
  const map: Record<string, { bg: string; color: string }> = {
    karir:        { bg: "#EEF3FE", color: "#2A5FE8" },
    beasiswa:     { bg: "#FFF0EB", color: "#FF6B35" },
    skills:       { bg: "#E6F7EF", color: "#16A34A" },
    pengembangan: { bg: "#F0E8FF", color: "#7C3AED" },
    tips:         { bg: "#FFFBEB", color: "#B45309" },
  };
  return map[cat] || map.karir;
}

function thumbGradient(thumb: string): string {
  const map: Record<string, string> = {
    "tbg-karir":        "linear-gradient(160deg,#1D4ED8 0%,#2563EB 50%,#FFD23F 100%)",
    "tbg-beasiswa":     "linear-gradient(160deg,#FF6B35 0%,#FF9A72 50%,#FFF0EB 100%)",
    "tbg-skills":       "linear-gradient(160deg,#059669 0%,#2DB67D 50%,#E6F7EF 100%)",
    "tbg-pengembangan": "linear-gradient(160deg,#7C3AED 0%,#A78BFA 60%,#EDE9FE 100%)",
    "tbg-tips":         "linear-gradient(160deg,#D97706 0%,#F59E0B 50%,#FEF3C7 100%)",
  };
  return map[thumb] || map["tbg-karir"];
}

function toDisplayArticle(a: Article): DA {
  const cat = normalizeCat(a.category);
  return {
    id: a.id,
    cat,
    featured: a.is_featured,
    tags: a.tags || [],
    title: a.title,
    desc: a.excerpt || "",
    read: a.reading_time_minutes || 5,
    views: a.view_count || 0,
    date: new Date(a.published_at || a.created_at).toLocaleDateString("id-ID"),
    slug: a.slug,
    thumb: `tbg-${cat}`,
    brand_hashtag: "#MULAIDARI",
    brand_name: "Talentika",
    highlight: false,
    image_url: a.featured_image_url,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ThumbBg({ da, height = 200 }: { da: DA; height?: number }) {
  const cc = catColors(da.cat);
  return (
    <div style={{ position:"relative", height, overflow:"hidden" }}>
      {da.image_url ? (
        <img
          src={da.image_url}
          alt={da.title}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
          loading="lazy"
        />
      ) : (
        <div style={{ position:"absolute", inset:0, background: thumbGradient(da.thumb) }} />
      )}
      {/* overlay text */}
      <div style={{
        position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"flex-start", justifyContent:"flex-end",
        padding:"14px 16px",
        background:"linear-gradient(0deg, rgba(11,29,58,.52) 0%, transparent 55%)",
      }}>
        <div style={{ fontWeight:800, fontSize:12, color:"rgba(255,255,255,.7)", letterSpacing:".04em", fontFamily:"inherit" }}>{da.brand_hashtag}</div>
        <div style={{ fontWeight:900, fontSize:20, color:"#fff", lineHeight:1.05, letterSpacing:"-.01em" }}>{da.brand_name}</div>
      </div>
      {/* category pill */}
      <span style={{
        position:"absolute", top:12, left:12,
        background: cc.bg, color: cc.color,
        fontWeight:700, fontSize:11, padding:"4px 10px", borderRadius:99,
      }}>{da.cat}</span>
    </div>
  );
}

function FeatCard({ da, onClick }: { da: DA; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="art-feat-card"
      style={{
        background:"#fff", borderRadius:20, overflow:"hidden",
        border:"1.5px solid #E2E8F0", cursor:"pointer",
        transition:"all .3s cubic-bezier(.16,1,.3,1)",
      }}
    >
      <div style={{ position:"relative" }}>
        <ThumbBg da={da} height={200} />
        <span style={{
          position:"absolute", top:12, right:12,
          background:"#2A5FE8", color:"#fff",
          fontWeight:700, fontSize:11, padding:"4px 10px", borderRadius:99,
        }}>⭐ Featured</span>
      </div>
      <div style={{ padding:"18px 20px 20px" }}>
        <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
          {da.tags.map(t => (
            <span key={t} style={{ fontWeight:600, fontSize:11.5, padding:"4px 10px", borderRadius:99, background:"#F1F5F9", color:"#64748B" }}>{t}</span>
          ))}
        </div>
        <h3 style={{ fontWeight:700, fontSize:17, color:"#0B1D3A", lineHeight:1.35, margin:"0 0 8px" }}>{da.title}</h3>
        <p style={{ fontSize:13.5, color:"#64748B", margin:"0 0 14px", lineHeight:1.55, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{da.desc}</p>
        <div style={{ display:"flex", alignItems:"center", gap:14, fontSize:12.5, color:"#94A3B8" }}>
          <span style={{ display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            {da.read} min
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
            {da.views}
          </span>
        </div>
      </div>
    </div>
  );
}

function ArtCard({ da, onClick }: { da: DA; onClick: () => void }) {
  const cc = catColors(da.cat);
  return (
    <div
      onClick={onClick}
      className="art-list-card"
      style={{
        background:"#fff", borderRadius:18, overflow:"hidden",
        border: da.highlight ? `1.5px solid #60A5FA` : "1.5px solid #E2E8F0",
        cursor:"pointer", transition:"all .3s cubic-bezier(.16,1,.3,1)",
        boxShadow: da.highlight ? "0 8px 32px -10px rgba(42,95,232,.18)" : "none",
      }}
    >
      <ThumbBg da={da} height={180} />
      <div style={{ padding:"16px 18px 18px" }}>
        <div style={{ display:"flex", gap:5, marginBottom:9, flexWrap:"wrap" }}>
          {da.tags.map(t => (
            <span key={t} style={{ fontWeight:600, fontSize:11, padding:"3px 9px", borderRadius:99, background:"#F1F5F9", color:"#64748B" }}>{t}</span>
          ))}
        </div>
        <h3 style={{ fontWeight:700, fontSize:16, color: da.highlight ? "#1D4ED8" : "#0B1D3A", lineHeight:1.35, margin:"0 0 7px" }}>{da.title}</h3>
        <p style={{ fontSize:13, color:"#64748B", margin:"0 0 12px", lineHeight:1.55, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{da.desc}</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:12, color:"#94A3B8" }}>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              {da.read} min
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:4, fontWeight:500 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
              {da.views}
            </span>
          </div>
          <span>{da.date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const Articles = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [nlEmail, setNlEmail] = useState("");
  const [nlSuccess, setNlSuccess] = useState(false);
  const viewCountedSlugRef = useRef<string | null>(null);

  // CSS injection
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "art-page-css";
    style.innerHTML = `
      .art-feat-card:hover { transform:translateY(-5px); box-shadow:0 24px 60px -20px rgba(42,95,232,.2),0 8px 20px -10px rgba(11,29,58,.08); border-color:#BFDBFE !important; }
      .art-list-card:hover { transform:translateY(-4px); box-shadow:0 20px 50px -18px rgba(42,95,232,.18),0 6px 16px -8px rgba(11,29,58,.08); border-color:#BFDBFE !important; }
      .art-cat-tab { padding:10px 18px; border-radius:11px; font-weight:600; font-size:13.5px; cursor:pointer; border:1.5px solid #E2E8F0; background:#fff; color:#64748B; transition:all .15s; white-space:nowrap; }
      .art-cat-tab:hover { border-color:#93C5FD; color:#1D4ED8; background:#EFF6FF; }
      .art-cat-tab.active { background:#2A5FE8; color:#fff; border-color:#2A5FE8; box-shadow:0 4px 14px -4px rgba(42,95,232,.4); }
      .art-topic-chip { display:inline-flex; margin:4px; padding:6px 13px; border-radius:99px; border:1.5px solid #E2E8F0; background:#fff; font-weight:600; font-size:13px; color:#475569; cursor:pointer; transition:all .15s; }
      .art-topic-chip:hover { border-color:#93C5FD; color:#1D4ED8; background:#EFF6FF; }
      .art-page-btn { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; border:1.5px solid #E2E8F0; background:#fff; color:#374151; font-weight:600; font-size:13.5px; cursor:pointer; transition:all .15s; }
      .art-page-btn:hover { background:#2A5FE8; color:#fff; border-color:#2A5FE8; }
      .art-page-btn.active { background:#2A5FE8; color:#fff; border-color:#2A5FE8; }
      .art-page-btn:disabled { opacity:.4; cursor:default; pointer-events:none; }
      @media(max-width:1100px) {
        .art-feat-grid { grid-template-columns:1fr 1fr !important; }
        .art-main-grid { grid-template-columns:1fr !important; }
        .art-sidebar { display:none !important; }
        .art-list-grid { grid-template-columns:1fr 1fr !important; }
      }
      @media(max-width:680px) {
        .art-feat-grid { grid-template-columns:1fr !important; }
        .art-list-grid { grid-template-columns:1fr !important; }
        .art-sf-row { flex-direction:column; align-items:stretch !important; }
        .art-pagination { flex-direction:column; gap:14px !important; }
        .art-newsletter { margin:0 16px 36px !important; padding:24px !important; }
        .nl-form-inner { flex-direction:column !important; }
      }
    `;
    if (!document.getElementById("art-page-css")) {
      document.head.appendChild(style);
    }
    return () => { document.getElementById("art-page-css")?.remove(); };
  }, []);

  useEffect(() => { fetchArticles(); }, []);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const article = articles.find(a => a.slug === slug);
      if (article) {
        setSelectedArticle(article);
        if (viewCountedSlugRef.current !== slug) {
          viewCountedSlugRef.current = slug;
          incrementViewCount(article.id);
        }
      }
    } else if (!slug) {
      setSelectedArticle(null);
      viewCountedSlugRef.current = null;
    }
  }, [slug, articles]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,slug,excerpt,featured_image_url,category,tags,view_count,reading_time_minutes,created_at,published_at,is_featured,seo_title,seo_description,content")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch {
      toast.error("Gagal memuat artikel");
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (articleId: string) => {
    try {
      const { error } = await supabase.rpc("increment_article_view_count", { article_id: articleId });
      if (error) throw error;
      setSelectedArticle(prev => prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev);
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, view_count: (a.view_count || 0) + 1 } : a));
    } catch { /* silent */ }
  };

  // Use real articles when available, fallback to dummy
  const displayArticles: DA[] = articles.length > 0 ? articles.map(toDisplayArticle) : DUMMY;

  const filtered = displayArticles.filter(a => {
    const matchCat = selectedCategory === "semua" || a.cat === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  const featured = displayArticles.filter(a => a.featured).slice(0, 3);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageArticles = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const goToArticle = (slug: string) => navigate(`/articles/${slug}`);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
        <Header />
        {/* Hero skeleton */}
        <section style={{ background: "#fff", padding: "80px 36px 52px", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-5 w-1/2 mx-auto mb-6" />
            <div className="flex gap-6 justify-center">
              <Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-32" />
            </div>
          </div>
        </section>
        {/* Featured cards skeleton */}
        <div style={{ padding: "52px 36px 0", maxWidth: 1320, margin: "0 auto" }}>
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1.5px solid #E2E8F0" }}>
                <Skeleton className="h-48 w-full rounded-none" />
                <div style={{ padding: "18px 20px 20px" }}>
                  <div className="flex gap-2 mb-3"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
                  <Skeleton className="h-5 w-full mb-2" /><Skeleton className="h-5 w-4/5 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-5/6 mb-1" /><Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex gap-4"><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-14" /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: "#E2E8F0", marginTop: 40 }} />
        </div>
        {/* Search + grid skeleton */}
        <div style={{ padding: "28px 36px", maxWidth: 1320, margin: "0 auto" }}>
          <div className="flex gap-4 flex-wrap">
            <Skeleton className="h-11 flex-1 min-w-[280px] rounded-xl" />
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-11 w-28 rounded-xl" />)}
          </div>
        </div>
        <div style={{ padding: "0 36px 48px", maxWidth: 1320, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1.5px solid #E2E8F0" }}>
                  <Skeleton className="h-44 w-full rounded-none" />
                  <div style={{ padding: "16px 18px 18px" }}>
                    <div className="flex gap-2 mb-2"><Skeleton className="h-4 w-16 rounded-full" /><Skeleton className="h-4 w-20 rounded-full" /></div>
                    <Skeleton className="h-5 w-full mb-1" /><Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-5/6 mb-3" />
                    <div className="flex justify-between"><div className="flex gap-3"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-12" /></div><Skeleton className="h-3 w-16" /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 18, padding: 22 }}>
                <Skeleton className="h-5 w-36 mb-4" />
                {[1,2,3,4,5].map(i => <div key={i} className="flex gap-3 py-2"><Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" /><div className="flex-1"><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-3 w-24" /></div></div>)}
              </div>
              <div style={{ background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 18, padding: 22 }}>
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="flex flex-wrap gap-2">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}</div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Article detail view ────────────────────────────────────────────────
  if (selectedArticle) {
    const processContentWithMedia = (content: string) => {
      return content.split("\n\n").map(section => {
        if (section.startsWith("# ")) return `<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-6 mt-12 first:mt-0 pb-4 border-b-2 border-border/50">${section.replace(/^# /, "")}</h1>`;
        if (section.startsWith("## ")) return `<h2 class="text-2xl md:text-3xl font-bold text-foreground mb-5 mt-10">${section.replace(/^## /, "")}</h2>`;
        if (section.startsWith("### ")) return `<h3 class="text-xl md:text-2xl font-semibold text-foreground mb-4 mt-8 pl-4 border-l-4 border-border/50">${section.replace(/^### /, "")}</h3>`;
        if (section.startsWith("#### ")) return `<h4 class="text-lg md:text-xl font-semibold text-foreground mb-3 mt-6">${section.replace(/^#### /, "")}</h4>`;
        if (section.includes("\n- ")) {
          const items = section.split("\n").filter(l => l.trim().startsWith("-")).map(l => {
            const text = l.replace(/^- /, "").trim().replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic">$1</em>').replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-0.5 rounded text-sm font-mono">$1</code>');
            return `<li class="flex items-start gap-3 py-2"><span class="w-1.5 h-1.5 bg-foreground/40 rounded-full mt-2.5 flex-shrink-0"></span><span class="flex-1 text-base md:text-lg leading-relaxed text-muted-foreground">${text}</span></li>`;
          }).join("");
          return `<ul class="space-y-1 my-6 pl-2">${items}</ul>`;
        }
        if (/^\d+\.\s/.test(section)) {
          const items = section.split("\n").filter(l => /^\d+\.\s/.test(l.trim())).map((l, i) => {
            const text = l.replace(/^\d+\.\s/, "").trim().replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic">$1</em>').replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-0.5 rounded text-sm font-mono">$1</code>');
            return `<li class="flex items-start gap-4 py-2"><span class="flex items-center justify-center w-7 h-7 bg-muted text-foreground rounded-full text-sm font-bold flex-shrink-0">${i + 1}</span><span class="flex-1 text-base md:text-lg leading-relaxed text-muted-foreground pt-0.5">${text}</span></li>`;
          }).join("");
          return `<ol class="space-y-2 my-6">${items}</ol>`;
        }
        if (section.startsWith("> ")) return `<blockquote class="border-l-4 border-border bg-muted/30 pl-6 pr-6 py-5 my-8 rounded-r-lg"><p class="text-lg md:text-xl italic text-foreground font-medium leading-relaxed">${section.replace(/^> /, "")}</p></blockquote>`;
        if (section.match(/!\[(.*?)\]\((.*?)\)/)) {
          const match = section.match(/!\[(.*?)\]\((.*?)\)/);
          if (match) return `<figure class="my-10"><img src="${match[2]}" alt="${match[1]}" class="w-full rounded-xl shadow-xl border border-border/30" loading="lazy" />${match[1] ? `<figcaption class="text-center text-sm text-muted-foreground mt-4 italic">${match[1]}</figcaption>` : ""}</figure>`;
        }
        if (section.includes("[video:")) {
          const match = section.match(/\[video:(https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))\]/);
          if (match) return `<div class="my-10"><div class="aspect-video rounded-xl overflow-hidden shadow-xl border border-border/30 bg-muted"><iframe src="https://www.youtube.com/embed/${match[2]}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div></div>`;
        }
        if (section.startsWith("```")) return `<pre class="bg-muted/50 p-6 rounded-xl my-8 overflow-x-auto border border-border/30"><code class="text-sm font-mono text-foreground leading-relaxed">${section.replace(/```\w*\n?/, "").replace(/```$/, "")}</code></pre>`;
        if (section.trim()) {
          const text = section.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>').replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>').replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-0.5 rounded text-sm font-mono">$1</code>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-foreground hover:underline font-medium underline" target="_blank" rel="noopener noreferrer">$1</a>');
          return `<p class="text-base md:text-lg leading-relaxed text-muted-foreground mb-6">${text}</p>`;
        }
        return "";
      }).join("");
    };

    const share = () => {
      if (navigator.share) {
        navigator.share({ title: selectedArticle.title, url: window.location.href }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link berhasil disalin!");
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={selectedArticle.seo_title || selectedArticle.title}
          description={selectedArticle.seo_description || selectedArticle.excerpt}
          keywords={(selectedArticle.tags || []).join(", ")}
          image={selectedArticle.featured_image_url}
          type="article"
          canonical={`https://talentika.id/articles/${selectedArticle.slug}`}
          structuredData={{ "@context":"https://schema.org","@type":"Article","headline":selectedArticle.title,"description":selectedArticle.excerpt,"image":selectedArticle.featured_image_url,"author":{"@type":"Organization","name":"Tim Talentika"},"publisher":{"@type":"Organization","name":"Talentika","logo":{"@type":"ImageObject","url":"https://talentika.id/logo.png"}},"datePublished":selectedArticle.published_at||selectedArticle.created_at,"dateModified":selectedArticle.created_at,"mainEntityOfPage":{"@type":"WebPage","@id":`https://talentika.id/articles/${selectedArticle.slug}`} }}
        />
        <Header />

        {/* Detail Hero */}
        <div className="relative pt-20 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <Button variant="ghost" asChild className="mb-8 hover:bg-primary/10 group">
              <Link to="/articles">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Artikel
              </Link>
            </Button>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ background:"#2A5FE8" }}>{selectedArticle.category}</span>
                {(selectedArticle.tags || []).slice(0, 4).map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm font-medium border border-border bg-background/80">{tag}</span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-6 leading-tight">{selectedArticle.title}</h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">{selectedArticle.excerpt}</p>
              <div className="flex items-center justify-center gap-6 flex-wrap mb-8">
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{new Date(selectedArticle.published_at || selectedArticle.created_at).toLocaleDateString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{selectedArticle.reading_time_minutes} menit baca</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{selectedArticle.view_count} views</span>
                </div>
                <Button variant="ghost" size="sm" className="bg-background/50 border border-border/50 hover:bg-primary/10 rounded-full px-4" onClick={share}>
                  <Share2 className="w-4 h-4 text-primary mr-2" />
                  <span className="font-medium">Bagikan</span>
                </Button>
              </div>
              {selectedArticle.featured_image_url && (
                <div className="relative mb-12 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity" />
                  <img loading="lazy" src={selectedArticle.featured_image_url} alt={selectedArticle.title} className="relative w-full h-64 md:h-80 lg:h-96 object-cover rounded-xl shadow-2xl border border-border/50" />
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <article className="mb-16">
              <div className="bg-background border border-border/20 rounded-2xl p-8 md:p-12 shadow-sm">
                <div className="article-content" dangerouslySetInnerHTML={{ __html: processContentWithMedia(selectedArticle.content) }} />
              </div>
            </article>
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-2xl p-8 mb-16 border border-border/20">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">T</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">Tim Talentika</p>
                    <p className="text-sm text-muted-foreground">Career Development Expert</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={share}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Bagikan Artikel
                </Button>
              </div>
            </div>
            <Separator className="my-12" />
            {/* Related articles */}
            <div>
              <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Artikel Terkait</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {displayArticles
                  .filter(a => a.slug !== selectedArticle.slug && a.cat === normalizeCat(selectedArticle.category))
                  .slice(0, 4)
                  .map(a => (
                    <div key={a.id} onClick={() => goToArticle(String(a.slug))} style={{ cursor:"pointer" }}>
                      <ArtCard da={a} onClick={() => goToArticle(String(a.slug))} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Article listing view ───────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC" }}>
      <SEO
        title="Artikel Karir & Pengembangan Diri | Talentika"
        description="Kumpulan artikel terlengkap tentang pengembangan karir, tips memilih jurusan, tes minat bakat, soft skills, dan strategi sukses untuk pelajar dan mahasiswa Indonesia."
        keywords="artikel karir, pengembangan diri, tips memilih jurusan, tes minat bakat, soft skills, strategi belajar"
        canonical="https://talentika.id/articles"
        structuredData={{ "@context":"https://schema.org","@type":"CollectionPage","name":"Artikel Karir & Pengembangan Diri","description":"Kumpulan artikel terlengkap tentang pengembangan karir dan potensi diri","url":"https://talentika.id/articles","publisher":{"@type":"Organization","name":"Talentika","logo":{"@type":"ImageObject","url":"https://talentika.id/logo.png"}} }}
      />
      <Header />

      {/* ── Hero ── */}
      <section style={{ background:"#fff", padding:"80px 36px 52px", textAlign:"center", borderBottom:"1px solid #E2E8F0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(42,95,232,.06), transparent 70%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:760, margin:"0 auto", position:"relative", zIndex:1 }}>
          <h1 style={{ fontWeight:800, fontSize:"clamp(34px,5vw,54px)", letterSpacing:"-.03em", lineHeight:1.1, margin:"0 0 16px" }}>
            <span style={{ color:"#0B1D3A" }}>Artikel </span>
            <span style={{ color:"#2A5FE8" }}>Karir &amp; Pengembangan Diri</span>
          </h1>
          <p style={{ fontSize:16.5, color:"#64748B", maxWidth:"54ch", margin:"0 auto 28px", lineHeight:1.65 }}>
            Temukan tips, strategi, dan insight terbaru untuk mengembangkan karir dan potensi diri Anda dengan panduan dari para ahli
          </p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontWeight:600, fontSize:14, color:"#2A5FE8" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#2A5FE8", display:"inline-block" }} />
              Artikel Berkualitas
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontWeight:600, fontSize:14, color:"#64748B" }}>
              Tips Praktis
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontWeight:600, fontSize:14, color:"#FF6B35" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#FF6B35", display:"inline-block" }} />
              Insight Mendalam
            </span>
          </div>
        </div>
      </section>

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <div style={{ padding:"52px 36px 0", maxWidth:1320, margin:"0 auto" }}>
          <h2 style={{ fontWeight:800, fontSize:26, color:"#2A5FE8", textAlign:"center", marginBottom:24, letterSpacing:"-.01em" }}>Artikel Unggulan</h2>
          <div
            className="art-feat-grid"
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20 }}
          >
            {featured.map(da => (
              <FeatCard key={da.id} da={da} onClick={() => goToArticle(String(da.slug))} />
            ))}
          </div>
          <div style={{ height:1, background:"#E2E8F0", marginTop:40 }} />
        </div>
      )}

      {/* ── Search + Filter ── */}
      <div style={{ padding:"28px 36px", maxWidth:1320, margin:"0 auto" }}>
        <div className="art-sf-row" style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{
            flex:1, minWidth:280, display:"flex", alignItems:"center", gap:10,
            background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:13, padding:"12px 16px",
            transition:"border-color .15s, box-shadow .15s",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              placeholder="Cari artikel..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              style={{ border:"none", outline:"none", flex:1, background:"transparent", color:"#0B1D3A", fontSize:15, fontFamily:"inherit" }}
            />
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CAT_TABS.map(tab => (
              <button
                key={tab.key}
                className={`art-cat-tab${selectedCategory === tab.key ? " active" : ""}`}
                onClick={() => handleCategoryChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Article Grid + Sidebar ── */}
      <div style={{ padding:"0 36px 48px", maxWidth:1320, margin:"0 auto" }}>
        <div className="art-main-grid" style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:24 }}>
          {/* Left: article grid */}
          <div>
            {pageArticles.length > 0 ? (
              <div className="art-list-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
                {pageArticles.map(da => (
                  <ArtCard key={da.id} da={da} onClick={() => goToArticle(String(da.slug))} />
                ))}
              </div>
            ) : (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:48, color:"#94A3B8", fontWeight:600, fontSize:16 }}>
                😕 Tidak ada artikel yang ditemukan
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="art-pagination" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:28 }}>
                <span style={{ fontWeight:500, fontSize:13.5, color:"#64748B" }}>
                  Menampilkan {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} dari {filtered.length} artikel
                </span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <button className="art-page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`art-page-btn${p === currentPage ? " active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >{p}</button>
                  ))}
                  <button className="art-page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="art-sidebar" style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {/* Popular */}
            <div style={{ background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:18, padding:22 }}>
              <h4 style={{ fontWeight:700, fontSize:16, color:"#0B1D3A", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}>
                🔥 Artikel Populer
              </h4>
              {POPULAR.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display:"flex", gap:12, padding:"10px 0",
                    borderTop: i === 0 ? "none" : "1px solid #F1F5F9",
                    cursor:"pointer",
                  }}
                  onClick={() => {
                    const da = displayArticles.find(a => a.id === p.id);
                    if (da) goToArticle(String(da.slug));
                  }}
                >
                  <div style={{ width:28, height:28, borderRadius:8, background:"#EFF6FF", color:"#1D4ED8", display:"grid", placeItems:"center", fontWeight:800, fontSize:12, flexShrink:0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13.5, color:"#0B1D3A", lineHeight:1.35, marginBottom:3 }}>{p.title}</div>
                    <div style={{ fontSize:11.5, color:"#94A3B8" }}>{p.meta}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Topics */}
            <div style={{ background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:18, padding:22 }}>
              <h4 style={{ fontWeight:700, fontSize:16, color:"#0B1D3A", margin:"0 0 12px", display:"flex", alignItems:"center", gap:8 }}>
                🏷 Topik Populer
              </h4>
              <div style={{ display:"flex", flexWrap:"wrap", margin:-4 }}>
                {TOPICS.map(t => (
                  <button
                    key={t}
                    className="art-topic-chip"
                    onClick={() => handleSearch(t)}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Talent Test CTA */}
            <div style={{ background:"linear-gradient(135deg,#EEF3FF,#E0EBFF)", border:"1.5px solid #BFDBFE", borderRadius:18, padding:22 }}>
              <h4 style={{ fontWeight:700, fontSize:16, color:"#1D4ED8", margin:"0 0 10px", display:"flex", alignItems:"center", gap:8 }}>
                🎯 Mulai Talent Test
              </h4>
              <p style={{ fontSize:13.5, color:"#374151", margin:"0 0 14px", lineHeight:1.55 }}>
                Kenali potensi, minat, dan bakatmu melalui tes psikometri gratis — hasil instan!
              </p>
              <Link
                to="/assessment"
                style={{
                  display:"block", textAlign:"center", padding:"12px 16px",
                  background:"#2A5FE8", color:"#fff", borderRadius:11,
                  fontWeight:700, fontSize:14, textDecoration:"none",
                  transition:"background .15s",
                }}
              >
                Mulai Talent Test →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Newsletter ── */}
      <div
        className="art-newsletter"
        style={{
          background:"linear-gradient(135deg,#1D4ED8,#1E3A8A)", color:"#fff",
          borderRadius:22, padding:40, textAlign:"center",
          margin:"0 36px 52px", position:"relative", overflow:"hidden",
          maxWidth:1248, marginLeft:"auto", marginRight:"auto",
        }}
      >
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,193,7,.2),transparent 65%)", top:-120, right:-60, pointerEvents:"none" }} />
        <h3 style={{ fontWeight:800, fontSize:26, letterSpacing:"-.02em", margin:"0 0 8px", position:"relative", zIndex:1 }}>
          📩 Dapatkan Artikel Terbaru Setiap Minggu
        </h3>
        <p style={{ fontSize:14.5, color:"rgba(255,255,255,.8)", margin:"0 0 22px", position:"relative", zIndex:1 }}>
          Bergabunglah dengan 10.000+ pembaca yang mendapat tips karir, beasiswa, dan pengembangan diri langsung di inbox.
        </p>
        <div className="nl-form-inner" style={{ display:"flex", gap:10, maxWidth:480, margin:"0 auto", position:"relative", zIndex:1 }}>
          {nlSuccess ? (
            <div style={{ flex:1, padding:"13px 16px", borderRadius:12, background:"rgba(22,163,74,.3)", color:"#fff", fontWeight:700, fontSize:14, textAlign:"center" }}>
              ✓ Berhasil Berlangganan!
            </div>
          ) : (
            <>
              <input
                type="email"
                placeholder="email@kamu.com"
                value={nlEmail}
                onChange={e => setNlEmail(e.target.value)}
                style={{ flex:1, padding:"13px 16px", borderRadius:12, border:"none", background:"rgba(255,255,255,.15)", color:"#fff", fontSize:14, outline:"none", fontFamily:"inherit" }}
              />
              <button
                onClick={() => {
                  if (nlEmail.includes("@")) { setNlSuccess(true); setNlEmail(""); }
                  else toast.error("Masukkan email yang valid");
                }}
                style={{ padding:"13px 22px", borderRadius:12, border:"none", cursor:"pointer", background:"#FFD23F", color:"#0B1D3A", fontWeight:700, fontSize:14, whiteSpace:"nowrap" }}
              >
                Langganan Gratis
              </button>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Articles;
