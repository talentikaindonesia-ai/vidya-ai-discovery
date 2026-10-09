/**
 * BootcampDetail — halaman jualan & kurikulum satu program bootcamp.
 * Publik (tanpa login); membeli / bergabung baru meminta login.
 *
 * Semua isi datang dari CMS (tabel bootcamps & turunannya). Yang TIDAK
 * ditampilkan meski ada di desain rujukan: rating bintang & jumlah ulasan
 * (belum ada sistem ulasan — angka apa pun akan karangan). Jumlah peserta
 * dihitung dari bootcamp_enrollments, bukan diketik admin.
 *
 * URL materi hanya dikirim server untuk materi pratinjau atau bila pengguna
 * sudah terdaftar (lihat get_bootcamp_detail) — gembok di sini hanya tampilan.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronDown, FileText, Globe, Lock,
  Loader2, MessageCircle, PlayCircle, RefreshCw, Radio, ClipboardCheck, Star, Users, X,
} from "lucide-react";

interface Lesson {
  id: string; title: string; lesson_type: string; duration_minutes: number | null;
  is_preview: boolean; content_url: string | null;
}
interface Section { id: string; title: string; lessons: Lesson[] }
interface Detail {
  bootcamp: {
    id: string; slug: string; title: string; category_label: string; subtitle: string | null;
    description: string | null; cover_url: string | null; lesson_type: string; level: string;
    has_certificate: boolean; has_consultation: boolean; price: number; original_price: number | null;
    price_label: string; price_description: string | null; benefits: string[];
    released_at: string | null; updated_at: string;
  };
  mentor: { id: string; name: string; title: string | null; avatar_url: string | null; bio: string | null } | null;
  is_enrolled: boolean;
  enrolled_count: number;
  sections: Section[];
  faqs: { id: string; question: string; answer: string }[];
}
interface Rekomendasi {
  id: string; slug: string; title: string; cover_url: string | null; price: number;
  original_price: number | null; level: string;
}

const WA_CS = "6285148434141";

const LEVEL: Record<string, { label: string; bar: number }> = {
  beginner:     { label: "Pemula",      bar: 1 },
  intermediate: { label: "Menengah",    bar: 2 },
  advanced:     { label: "Lanjutan",    bar: 3 },
  all:          { label: "Semua Level", bar: 3 },
};

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const bulanTahun = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : null;
const durasi = (m: number | null) => (m ? `${m} mnt` : "");

function IkonMateri({ type, size = 17 }: { type: string; size?: number }) {
  if (type === "ebook") return <BookOpen size={size} />;
  if (type === "article") return <FileText size={size} />;
  if (type === "quiz") return <ClipboardCheck size={size} />;
  if (type === "live") return <Radio size={size} />;
  return <PlayCircle size={size} />;
}

const LABEL_TIPE: Record<string, string> = {
  video: "Video", ebook: "Ebook", article: "Artikel", quiz: "Kuis", live: "Live",
};

function LevelBars({ level }: { level: string }) {
  const n = LEVEL[level]?.bar ?? 1;
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 3, height: 20 }} aria-label={LEVEL[level]?.label}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ width: 5, height: 6 + i * 4, borderRadius: 2, background: i <= n ? "var(--tk-blue-600)" : "var(--tk-gray-200)" }} />
      ))}
    </span>
  );
}

export default function BootcampDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rekomendasi, setRekomendasi] = useState<Rekomendasi[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [showAllSections, setShowAllSections] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const kurikulumRef = useRef<HTMLDivElement>(null);
  const hargaRef = useRef<HTMLDivElement>(null);

  const muat = async () => {
    const { data: res, error } = await (supabase.rpc as any)("get_bootcamp_detail", { p_slug: slug });
    if (error || !res) { setNotFound(true); setLoading(false); return null; }
    const d = res as Detail;
    setData(d);
    setLoading(false);
    return d;
  };

  useEffect(() => {
    if (!slug) return;
    muat().then(d => { if (d?.sections[0]) setOpenSections(new Set([d.sections[0].id])); });
    (supabase.rpc as any)("list_bootcamps").then(({ data: rows }: { data: Rekomendasi[] | null }) => {
      setRekomendasi((rows ?? []).filter(r => r.slug !== slug).slice(0, 4));
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setLoggedIn(!!session);
      if (session) {
        const { data: p } = await supabase.from("profiles").select("phone").eq("user_id", session.user.id).maybeSingle();
        if (p?.phone) setPhone(p.phone);
      }
    });
  }, [slug]);

  // Kembali dari Mayar: akses baru aktif setelah webhook memverifikasi pembayaran.
  useEffect(() => {
    if (searchParams.get("payment") !== "success" || !data || data.is_enrolled) return;
    setConfirming(true);
    let percobaan = 0;
    const t = setInterval(async () => {
      percobaan++;
      const d = await muat();
      if (d?.is_enrolled) {
        clearInterval(t);
        setConfirming(false);
        setSearchParams({}, { replace: true });
        toast.success("Pembayaran terkonfirmasi — selamat belajar! 🎉");
      } else if (percobaan >= 15) {
        clearInterval(t);
        setConfirming(false);
        toast.info("Konfirmasi pembayaran butuh waktu lebih lama. Muat ulang halaman ini beberapa menit lagi, atau hubungi CS.", { duration: 9000 });
      }
    }, 4000);
    return () => clearInterval(t);
  }, [searchParams, data?.bootcamp.id]);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--tk-blue-600)" }} /></div>;
  }
  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, marginBottom: 12 }}>Program tidak ditemukan</div>
          <button onClick={() => navigate("/learning")} style={{ background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Lihat program lain</button>
        </div>
      </div>
    );
  }

  const { bootcamp: b, mentor, sections, faqs, is_enrolled, enrolled_count } = data;
  const semuaMateri = sections.flatMap(s => s.lessons);
  const totalMenit = semuaMateri.reduce((a, l) => a + (l.duration_minutes ?? 0), 0);
  const totalJam = (totalMenit / 60).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  const gratis = b.price === 0;
  const sectionTampil = showAllSections ? sections : sections.slice(0, 3);

  const bukaMateri = (l: Lesson) => {
    if (l.content_url) { window.open(l.content_url, "_blank", "noopener"); return; }
    hargaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast.info(gratis ? "Gabung program dulu untuk membuka materi ini." : "Materi ini terbuka setelah kamu membeli program.");
  };

  const mulai = () => {
    const pertama = semuaMateri.find(l => l.content_url);
    if (pertama) bukaMateri(pertama);
    else kurikulumRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const beli = async () => {
    if (!loggedIn) { navigate(`/auth?role=individual&redirect=/bootcamp/${b.slug}`); return; }
    if (gratis) {
      setPaying(true);
      const { error } = await (supabase.rpc as any)("enroll_free_bootcamp", { p_bootcamp_id: b.id });
      setPaying(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Kamu sudah bergabung! Materi sekarang terbuka.");
      muat();
      return;
    }
    if (!phone.trim()) { setPhoneOpen(true); return; }
    setPaying(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("create-mayar-payment", {
        body: { kind: "bootcamp", bootcampId: b.id, phone: phone.trim() },
      });
      if (error) {
        let msg = "Gagal membuat link pembayaran.";
        try { const body = await (error as any).context?.json?.(); if (body?.error) msg = body.error; } catch { /* abaikan */ }
        throw new Error(msg);
      }
      if (!res?.success || !res?.invoice_url) throw new Error(res?.error || "Gagal membuat link pembayaran.");
      window.location.href = res.invoice_url;
    } catch (e: any) {
      toast.error(e.message);
      setPaying(false);
    }
  };

  const labelCta = is_enrolled ? "Mulai Belajar" : gratis ? "Gabung Gratis" : "Gabung Program";
  const aksiCta = is_enrolled ? mulai : beli;

  const toggleSection = (id: string) => setOpenSections(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--tk-gray-50, #F8FAFC)", paddingBottom: 60 }}>
      <SEO title={`${b.title} — Talentika`} description={b.subtitle ?? b.description ?? b.title} />
      <style>{`
        .bc-wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .bc-meta { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 12px; }
        .bc-hero { display: grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: 24px; align-items: start; }
        .bc-main { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(0,1fr); gap: 28px; align-items: start; }
        .bc-reco { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 18px; }
        .bc-faq  { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.6fr); gap: 32px; align-items: start; }
        .bc-sticky { position: sticky; top: 84px; }
        .bc-row:hover { background: var(--tk-gray-50, #F8FAFC); }
        @media (max-width: 900px) {
          .bc-hero, .bc-main, .bc-faq { grid-template-columns: minmax(0,1fr); }
          .bc-meta { grid-template-columns: repeat(3, minmax(0,1fr)); }
          .bc-reco { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .bc-sticky { position: static; }
        }
        @media (max-width: 520px) {
          .bc-meta { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .bc-reco { grid-template-columns: minmax(0,1fr); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--tk-gray-200)", position: "sticky", top: 0, zIndex: 20 }}>
        <div className="bc-wrap" style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate(loggedIn ? "/learning" : "/")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-500)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={17} /> {loggedIn ? "Kembali ke Belajar" : "Talentika"}
          </button>
          {!loggedIn && (
            <Link to={`/auth?role=individual&redirect=/bootcamp/${b.slug}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--tk-blue-600)" }}>Masuk</Link>
          )}
        </div>
      </div>

      {confirming && (
        <div style={{ background: "#EFF6FF", borderBottom: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 14, fontWeight: 600, padding: "12px 20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Loader2 size={16} className="animate-spin" /> Pembayaran diterima, sedang mengonfirmasi dengan Mayar…
        </div>
      )}

      <div className="bc-wrap">
        {/* ── Hero ── */}
        <div style={{ textAlign: "center", padding: "44px 0 28px" }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-blue-600)", marginBottom: 10 }}>{b.category_label}</div>
          <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: "clamp(26px, 4vw, 40px)", lineHeight: 1.2, color: "var(--tk-ink)", margin: "0 auto", maxWidth: 820 }}>{b.title}</h1>
          {b.subtitle && <p style={{ fontSize: 16, color: "var(--tk-gray-500)", margin: "14px auto 0", maxWidth: 640, lineHeight: 1.6 }}>{b.subtitle}</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 18, fontSize: 14, color: "var(--tk-gray-600)" }}>
            {bulanTahun(b.released_at) && <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Globe size={16} /> Dirilis {bulanTahun(b.released_at)}</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}><RefreshCw size={15} /> Diperbarui {bulanTahun(b.updated_at)}</span>
          </div>
        </div>

        {/* ── Meta row ── */}
        <div className="bc-meta" style={{ textAlign: "center", marginBottom: 32 }}>
          {[
            { k: "Peserta", v: enrolled_count > 0 ? <><b>{enrolled_count}</b> terdaftar</> : <span style={{ color: "var(--tk-gray-500)" }}>Baru dibuka</span> },
            { k: "Tipe Materi", v: <b>{b.lesson_type}</b> },
            { k: "Tingkatan", v: <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><LevelBars level={b.level} /> {LEVEL[b.level]?.label}</span> },
            { k: "Sertifikat", v: b.has_certificate ? <CheckCircle2 size={20} style={{ color: "var(--tk-blue-600)" }} /> : <span style={{ color: "var(--tk-gray-400)" }}>—</span> },
            { k: "Konsultasi", v: b.has_consultation ? <CheckCircle2 size={20} style={{ color: "var(--tk-blue-600)" }} /> : <span style={{ color: "var(--tk-gray-400)" }}>—</span> },
          ].map(m => (
            <div key={m.k}>
              <div style={{ fontSize: 14, color: "var(--tk-gray-500)", marginBottom: 8 }}>{m.k}</div>
              <div style={{ fontSize: 15, color: "var(--tk-ink)", minHeight: 22, display: "flex", justifyContent: "center", alignItems: "center" }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* ── Cover + ringkasan materi ── */}
        <div className="bc-hero" style={{ marginBottom: 44 }}>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "var(--tk-gray-100)", aspectRatio: "16 / 9" }}>
            {b.cover_url
              ? <img src={b.cover_url} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--tk-gray-300)" }}><BookOpen size={44} /></div>}
          </div>
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid var(--tk-gray-200)" }}>
            <div style={{ padding: "22px 22px 16px" }}>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", marginBottom: 14 }}>
                {semuaMateri.length} materi{totalMenit > 0 ? ` (${totalJam} jam)` : ""}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {semuaMateri.slice(0, 4).map(l => (
                  <button key={l.id} onClick={() => bukaMateri(l)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 99, background: "var(--tk-gray-100)", border: "none", cursor: "pointer", textAlign: "left", color: "var(--tk-ink)" }}>
                    <span style={{ color: "var(--tk-gray-600)", flexShrink: 0 }}><IkonMateri type={l.lesson_type} /></span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</span>
                    <span style={{ fontSize: 13, color: "var(--tk-gray-500)", flexShrink: 0 }}>{durasi(l.duration_minutes)}</span>
                  </button>
                ))}
                {semuaMateri.length > 4 && (
                  <button onClick={() => kurikulumRef.current?.scrollIntoView({ behavior: "smooth" })}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 99, background: "var(--tk-gray-100)", border: "none", cursor: "pointer", fontSize: 14, color: "var(--tk-ink)" }}>
                    <PlayCircle size={17} /> {semuaMateri.length - 4} materi lainnya
                  </button>
                )}
                {semuaMateri.length === 0 && <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)" }}>Kurikulum sedang disusun.</div>}
              </div>
            </div>
            <button onClick={aksiCta} disabled={paying}
              style={{ width: "100%", padding: "18px 0", border: "none", background: "var(--tk-blue-600)", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, cursor: paying ? "wait" : "pointer" }}>
              {paying ? "Memproses…" : labelCta}
            </button>
          </div>
        </div>

        {/* ── Kurikulum + mentor | Harga ── */}
        <div className="bc-main" style={{ marginBottom: 56 }}>
          <div>
            {b.description && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", margin: "0 0 12px" }}>Tentang Program</h2>
                <p style={{ fontSize: 15, color: "var(--tk-gray-600)", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{b.description}</p>
              </div>
            )}

            <div ref={kurikulumRef} style={{ scrollMarginTop: 80 }}>
              <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", margin: "0 0 16px" }}>Kurikulum Program</h2>
              {sections.length === 0 && <div style={{ background: "#fff", borderRadius: 16, padding: 24, color: "var(--tk-gray-500)", fontSize: 14 }}>Kurikulum sedang disusun.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sectionTampil.map((s, i) => {
                  const terbuka = openSections.has(s.id);
                  return (
                    <div key={s.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--tk-gray-200)", overflow: "hidden" }}>
                      <button onClick={() => toggleSection(s.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--tk-gray-100)", display: "grid", placeItems: "center", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ flex: 1, fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "var(--tk-ink)" }}>{s.title}</span>
                        <span style={{ fontSize: 12.5, color: "var(--tk-gray-500)", flexShrink: 0 }}>{s.lessons.length} materi</span>
                        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--tk-gray-100)", display: "grid", placeItems: "center", flexShrink: 0, transform: terbuka ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                          <ChevronDown size={16} />
                        </span>
                      </button>
                      {terbuka && (
                        <div style={{ padding: "0 14px 14px" }}>
                          {s.lessons.map(l => {
                            const terkunci = !l.content_url;
                            return (
                              <button key={l.id} className="bc-row" onClick={() => bukaMateri(l)}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                                <span style={{ color: terkunci ? "var(--tk-gray-300)" : "var(--tk-gray-600)", flexShrink: 0 }}>
                                  {terkunci ? <Lock size={17} /> : <IkonMateri type={l.lesson_type} />}
                                </span>
                                <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: "var(--tk-ink)" }}>{l.title}</span>
                                {l.is_preview && !is_enrolled && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 9px", borderRadius: 99, flexShrink: 0 }}>Pratinjau</span>
                                )}
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tk-blue-700)", background: "var(--tk-blue-50)", padding: "3px 10px", borderRadius: 99, flexShrink: 0 }}>{LABEL_TIPE[l.lesson_type] ?? l.lesson_type}</span>
                                <span style={{ fontSize: 13.5, color: "var(--tk-gray-600)", width: 56, textAlign: "right", flexShrink: 0 }}>{durasi(l.duration_minutes)}</span>
                              </button>
                            );
                          })}
                          {s.lessons.length === 0 && <div style={{ padding: "8px 10px", fontSize: 13.5, color: "var(--tk-gray-400)" }}>Belum ada materi di bab ini.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {sections.length > 3 && (
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <button onClick={() => setShowAllSections(v => !v)}
                    style={{ padding: "12px 26px", borderRadius: 99, border: "none", background: "var(--tk-gray-200)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--tk-ink)" }}>
                    {showAllSections ? "Tampilkan Lebih Sedikit" : `Tampilkan ${sections.length - 3} Bab Lainnya`}
                  </button>
                </div>
              )}
            </div>

            {mentor && (
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", margin: "0 0 16px" }}>Belajar Bersama Mentor</h2>
                <div style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--tk-gray-200)", padding: 24, maxWidth: 420 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: mentor.bio ? 14 : 18 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid var(--tk-blue-600)", padding: 3, flexShrink: 0 }}>
                      {mentor.avatar_url
                        ? <img src={mentor.avatar_url} alt={mentor.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--tk-blue-50)", display: "grid", placeItems: "center", fontWeight: 800, color: "var(--tk-blue-600)", fontSize: 22 }}>{mentor.name.slice(0, 1)}</div>}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 18, color: "var(--tk-ink)" }}>{mentor.name}</div>
                      {mentor.title && <div style={{ fontSize: 14, color: "var(--tk-gray-500)", marginTop: 2 }}>{mentor.title}</div>}
                    </div>
                  </div>
                  {mentor.bio && <p style={{ fontSize: 14, color: "var(--tk-gray-600)", lineHeight: 1.65, margin: "0 0 18px" }}>{mentor.bio}</p>}
                  <button onClick={() => navigate("/mentors")}
                    style={{ width: "100%", padding: "12px 0", borderRadius: 99, border: "none", background: "var(--tk-gray-200)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--tk-ink)" }}>
                    Lihat Profil
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Harga */}
          <div className="bc-sticky" ref={hargaRef}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24, color: "var(--tk-ink)", margin: 0 }}>Investasi untuk Dirimu</h2>
              <p style={{ fontSize: 14.5, color: "var(--tk-gray-500)", margin: "8px 0 0", lineHeight: 1.6 }}>Bekal keterampilan yang kamu bawa ke langkah karier berikutnya.</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid var(--tk-gray-200)", padding: "26px 26px 24px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF3C7", color: "#D97706", display: "grid", placeItems: "center", marginBottom: 16 }}>
                <Star size={26} fill="currentColor" />
              </div>
              <div style={{ fontSize: 15, color: "var(--tk-gray-600)" }}>{b.price_label}</div>
              {!gratis && b.original_price && (
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 20, color: "#FCA5A5", textDecoration: "line-through", marginTop: 4 }}>{rupiah(b.original_price)}</div>
              )}
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 28, color: "var(--tk-ink)", marginTop: 2 }}>{gratis ? "Gratis" : rupiah(b.price)}</div>
              {b.price_description && <p style={{ fontSize: 14.5, color: "var(--tk-gray-600)", lineHeight: 1.6, margin: "10px 0 0" }}>{b.price_description}</p>}
              {b.benefits.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", paddingTop: 18, borderTop: "1px solid var(--tk-gray-200)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {b.benefits.map(x => (
                    <li key={x} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, color: "var(--tk-ink)" }}>
                      <CheckCircle2 size={19} style={{ color: "#10B981", flexShrink: 0, marginTop: 1 }} /> {x}
                    </li>
                  ))}
                </ul>
              )}
              {is_enrolled ? (
                <div style={{ marginTop: 22, padding: "14px 0", borderRadius: 99, background: "#ECFDF5", color: "#059669", textAlign: "center", fontFamily: "var(--tk-font-display)", fontWeight: 700 }}>✓ Kamu sudah terdaftar</div>
              ) : (
                <button onClick={beli} disabled={paying}
                  style={{ width: "100%", marginTop: 22, padding: "14px 0", borderRadius: 99, border: "none", background: "var(--tk-blue-600)", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15.5, cursor: paying ? "wait" : "pointer" }}>
                  {paying ? "Memproses…" : gratis ? "Gabung Gratis" : "Beli Program"}
                </button>
              )}
              <a href={`https://wa.me/${WA_CS}?text=${encodeURIComponent(`Halo, saya ingin bertanya tentang program "${b.title}"`)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, padding: "13px 0", borderRadius: 99, background: "var(--tk-gray-200)", color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}>
                <MessageCircle size={16} /> Tanya via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Rekomendasi ── */}
        {rekomendasi.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 28, color: "var(--tk-ink)", margin: "0 0 20px" }}>Rekomendasi Untukmu</h2>
            <div className="bc-reco">
              {rekomendasi.map(r => (
                <Link key={r.id} to={`/bootcamp/${r.slug}`} onClick={() => window.scrollTo({ top: 0 })}
                  style={{ background: "#fff", borderRadius: 18, overflow: "hidden", border: "1px solid var(--tk-gray-200)", textDecoration: "none", display: "flex", flexDirection: "column" }}>
                  <div style={{ aspectRatio: "16 / 10", background: "var(--tk-gray-100)" }}>
                    {r.cover_url && <img src={r.cover_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  </div>
                  <div style={{ padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
                      <div style={{ fontSize: 14.5 }}>
                        {r.price > 0 && r.original_price && <span style={{ color: "#FCA5A5", textDecoration: "line-through", marginRight: 8 }}>{rupiah(r.original_price)}</span>}
                        <span style={{ color: "var(--tk-gray-600)" }}>{r.price > 0 ? rupiah(r.price) : "Gratis"}</span>
                      </div>
                      <LevelBars level={r.level} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {faqs.length > 0 && (
          <div className="bc-faq">
            <div>
              <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 30, color: "var(--tk-ink)", margin: 0 }}>Pertanyaan Umum</h2>
              <p style={{ fontSize: 15, color: "var(--tk-gray-600)", lineHeight: 1.6, margin: "12px 0 20px", maxWidth: 360 }}>Belum menemukan jawabannya? Tim kami siap membantu.</p>
              <a href={`https://wa.me/${WA_CS}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "13px 24px", borderRadius: 99, background: "var(--tk-gray-200)", color: "var(--tk-ink)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}>
                <Users size={16} /> Hubungi CS
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {faqs.map(f => {
                const buka = openFaq === f.id;
                return (
                  <div key={f.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid var(--tk-gray-200)" }}>
                    <button onClick={() => setOpenFaq(buka ? null : f.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "20px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15.5, color: "var(--tk-ink)" }}>
                      {f.question}
                      <ChevronDown size={18} style={{ flexShrink: 0, transform: buka ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                    </button>
                    {buka && <div style={{ padding: "0 22px 20px", fontSize: 15, color: "var(--tk-gray-600)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{f.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Nomor HP untuk Mayar ── */}
      {phoneOpen && (
        <div onClick={() => setPhoneOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 18, padding: 24, width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17 }}>Nomor HP / WhatsApp</div>
              <button onClick={() => setPhoneOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-500)" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", margin: "0 0 14px", lineHeight: 1.55 }}>Diperlukan oleh Mayar untuk mengirim bukti pembayaran.</p>
            <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="08xxxxxxxxxx" autoFocus
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--tk-gray-200)", fontSize: 15, boxSizing: "border-box", outline: "none" }} />
            <button disabled={!phone.trim() || paying} onClick={() => { setPhoneOpen(false); beli(); }}
              style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 99, border: "none", background: phone.trim() ? "var(--tk-blue-600)" : "var(--tk-gray-300)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: phone.trim() ? "pointer" : "not-allowed" }}>
              Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
