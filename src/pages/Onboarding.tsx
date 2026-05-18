import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, ChevronLeft, Shield, Lock, Brain,
  User, GraduationCap, Heart, BookOpen, Users, TrendingUp,
  Check, Rocket,
} from "lucide-react";

// ─── Onboarding step data ────────────────────────────────────────────────────
const ONBOARD_STEPS = [
  { title: "Kenali dirimu lebih dalam",           desc: "Ikuti Talent Test yang dirancang secara ilmiah untuk memahami bakat, minat, dan kepribadianmu.",       emoji: "👋", color: "blue"   },
  { title: "Dapatkan insight karier yang tepat",  desc: "Terima rekomendasi jurusan, karier, dan peluang yang sesuai dengan potensi unikmu.",                   emoji: "💡", color: "yellow" },
  { title: "Bangun roadmap pengembangan diri",    desc: "Dapatkan langkah-langkah terarah untuk mengembangkan skill dan mencapai tujuanmu.",                    emoji: "🏔️", color: "orange" },
  { title: "Bergabung dengan komunitas positif",  desc: "Terhubung dengan ribuan pemuda inspiratif dan temukan peluang tak terbatas bersama Talentika.",         emoji: "🙌", color: "green"  },
  { title: "Siap untuk masa depanmu?",            desc: "Yuk, mulai perjalananmu sekarang dan wujudkan masa depan terbaikmu bersama Talentika.",                 emoji: "🚀", color: "blue"   },
];

const CARD_GRADS: Record<string, string> = {
  blue:   "linear-gradient(135deg, #E8F1FF, #DBEAFE)",
  yellow: "linear-gradient(135deg, #FFF6E0, #FDE68A)",
  orange: "linear-gradient(135deg, #FFEDE2, #FDB97D)",
  green:  "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
};

const INTEREST_OPTIONS = [
  { id: "science",       label: "Sains & Teknologi",    icon: "🔬" },
  { id: "creative",      label: "Seni & Kreativitas",   icon: "🎨" },
  { id: "leadership",    label: "Kepemimpinan",         icon: "👑" },
  { id: "communication", label: "Komunikasi",           icon: "💬" },
  { id: "analytical",    label: "Analitik & Data",      icon: "📊" },
  { id: "business",      label: "Bisnis & Wirausaha",   icon: "💼" },
  { id: "social",        label: "Sosial & Kemanusiaan", icon: "🤝" },
  { id: "sports",        label: "Olahraga & Kesehatan", icon: "⚽" },
];

const EDU_OPTIONS = [
  "SD / Sederajat", "SMP / Sederajat", "SMA / SMK / Sederajat",
  "D1 / D2 / D3", "S1 / D4", "S2 / S3",
];

const TRUST_ITEMS = [
  { icon: Shield, title: "Aman & Terpercaya",   desc: "Data pribadimu aman bersama kami." },
  { icon: Lock,   title: "Privasi Terjaga",     desc: "Kami tidak akan membagikan data kamu ke pihak manapun." },
  { icon: Brain,  title: "Berdasarkan Sains",   desc: "Metode ilmiah dan psikometri yang valid & terpercaya." },
];

// ─── Main component ──────────────────────────────────────────────────────────
const Onboarding = () => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [step,    setStep]    = useState(0); // 0 = card carousel, 1-3 = form steps
  const [phase,   setPhase]   = useState<"carousel" | "form">("carousel");
  const [saving,  setSaving]  = useState(false);
  const [formData, setFormData] = useState({
    fullName:       "",
    age:            "",
    educationLevel: "",
    interests:      [] as string[],
  });

  const toggleInterest = (id: string) =>
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id],
    }));

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: formData.fullName, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      await supabase.auth.updateUser({
        data: { education_level: formData.educationLevel, age: formData.age },
      });

      const { data: categories } = await supabase.from("interest_categories").select("id, name");
      for (const interestId of formData.interests) {
        const match = categories?.find(c =>
          c.name?.toLowerCase().replace(/\s+/g, "-") === interestId || c.id === interestId
        );
        if (!match) continue;
        await supabase.from("user_interests").upsert(
          { user_id: user.id, category_id: match.id, is_primary: true, score: 80 },
          { onConflict: "user_id,category_id" }
        );
      }

      toast.success("Profil berhasil disimpan! Mari mulai assessment 🎉");
      navigate("/assessment");
    } catch (error: any) {
      toast.error("Gagal menyimpan profil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Form steps ─────────────────────────────────────────────────────────────
  const FORM_STEPS = 3;
  const [formStep, setFormStep] = useState(1);

  const startForm = () => { setPhase("form"); setFormStep(1); };
  const nextForm  = () => { if (formStep < FORM_STEPS) setFormStep(s => s + 1); else handleComplete(); };
  const prevForm  = () => { if (formStep > 1) setFormStep(s => s - 1); else setPhase("carousel"); };

  const stepCanProceed = () => {
    if (formStep === 1) return formData.fullName.trim().length > 0;
    if (formStep === 2) return formData.educationLevel.length > 0;
    if (formStep === 3) return formData.interests.length > 0;
    return true;
  };

  // ── RENDER: carousel ───────────────────────────────────────────────────────
  if (phase === "carousel") {
    return (
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(180deg,#F1F5FB,#FFFFFF)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative waves */}
        <svg
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%" }}
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          height="200"
        >
          <path d="M0 120 C 240 60, 480 180, 720 100 S 1200 40, 1440 120 L 1440 200 L 0 200 Z" fill="#D6E4FF" opacity=".5" />
          <path d="M0 150 C 240 100, 480 200, 720 140 S 1200 80, 1440 160 L 1440 200 L 0 200 Z" fill="#1D4ED8" opacity=".15" />
        </svg>

        {/* Top bar */}
        <div style={{ position: "absolute", top: 32, left: 48, zIndex: 5 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24, color: "var(--tk-blue-600)", letterSpacing: "-.02em" }}>
            Talentika<span style={{ color: "var(--tk-yellow)", fontSize: 14, marginLeft: 2 }}>✦</span>
          </div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 11, marginTop: 2 }}>
            <span style={{ color: "var(--tk-blue-600)" }}>Discover.</span>{" "}
            <span style={{ color: "var(--tk-orange)" }}>Develop.</span>{" "}
            <span style={{ color: "#A47000" }}>Grow.</span>
          </div>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            position: "absolute", top: 32, right: 40, zIndex: 5,
            background: "transparent", border: "1px solid var(--tk-gray-200)",
            padding: "8px 16px", borderRadius: 10, cursor: "pointer",
            fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13.5,
            color: "var(--tk-gray-600)", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Lewati <ChevronLeft size={14} style={{ transform: "rotate(180deg)" }} />
        </button>

        {/* Main content */}
        <div
          style={{
            maxWidth: 1200, margin: "0 auto",
            padding: isMobile ? "80px 16px 40px" : "120px 40px 60px",
            position: "relative", zIndex: 2,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h1
              style={{
                fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 38,
                color: "var(--tk-ink)", letterSpacing: "-.02em", marginBottom: 10,
              }}
            >
              Selamat datang di Talentika!{" "}
              <span className="tk-wave" style={{ display: "inline-block" }}>👋</span>
            </h1>
            <p style={{ color: "var(--tk-gray-600)", fontSize: 16, margin: 0 }}>
              Ikuti langkah berikut untuk mulai perjalananmu menemukan potensi terbaik.
            </p>
          </div>

          {/* 5-card carousel */}
          <div style={isMobile ? {
            display: "flex", overflowX: "auto", gap: 14,
            scrollSnapType: "x mandatory", paddingBottom: 12,
            WebkitOverflowScrolling: "touch" as any,
            marginLeft: -8, marginRight: -8, paddingLeft: 8, paddingRight: 8,
          } : { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 18 }}>
            {ONBOARD_STEPS.map((card, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  background: "white",
                  border: i === step ? "2px solid var(--tk-blue-600)" : "1px solid var(--tk-gray-200)",
                  borderRadius: 22, padding: "24px 18px",
                  cursor: "pointer", position: "relative",
                  boxShadow: i === step ? "var(--tk-shadow-lg)" : "0 2px 8px rgba(0,0,0,.06)",
                  transform: i === step ? "translateY(-6px)" : "none",
                  transition: "all .3s ease",
                  ...(isMobile ? { minWidth: 220, flexShrink: 0, scrollSnapAlign: "start" } : {}),
                }}
              >
                {/* Step number bubble */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: i === step ? "var(--tk-blue-600)" : "var(--tk-gray-100)",
                  color: i === step ? "#fff" : "var(--tk-gray-500)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
                  marginBottom: 14,
                }}>{i + 1}</div>

                {/* Emoji illustration */}
                <div style={{
                  aspectRatio: "1/1",
                  background: CARD_GRADS[card.color] ?? CARD_GRADS.blue,
                  borderRadius: 18, display: "grid", placeItems: "center",
                  fontSize: 56, marginBottom: 14, position: "relative", overflow: "hidden",
                }}>
                  {card.emoji}
                  <span className="tk-sparkle" style={{ position: "absolute", top: 8, right: 10, fontSize: 12, color: "var(--tk-yellow)" }}>✦</span>
                </div>

                <div style={{
                  fontFamily: "var(--tk-font-display)", fontWeight: 600,
                  fontSize: 15, color: "var(--tk-ink)", lineHeight: 1.3, marginBottom: 8,
                }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--tk-gray-600)", lineHeight: 1.5 }}>{card.desc}</div>

                {/* Dot indicators */}
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14 }}>
                  {ONBOARD_STEPS.map((_, d) => (
                    <span key={d} style={{
                      width: d === i ? 16 : 6, height: 6, borderRadius: 99,
                      background: d === i ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
                      display: "inline-block", transition: "all .25s",
                    }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 40 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 rounded-xl transition-colors"
                style={{
                  padding: "12px 24px", background: "white",
                  border: "1px solid var(--tk-gray-200)", cursor: "pointer",
                  fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14,
                  color: "var(--tk-gray-700)", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
            )}
            {step < ONBOARD_STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  padding: "12px 28px", background: "var(--tk-blue-600)", border: "none",
                  borderRadius: 14, cursor: "pointer", color: "#fff",
                  fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15,
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
              >
                Selanjutnya <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={startForm}
                style={{
                  padding: "12px 28px", background: "var(--tk-blue-600)", border: "none",
                  borderRadius: 14, cursor: "pointer", color: "#fff",
                  fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15,
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)"; }}
              >
                Mulai Sekarang <Rocket size={16} />
              </button>
            )}
          </div>

          {/* Trust items */}
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 24,
            marginTop: 48, maxWidth: 900, marginLeft: "auto", marginRight: "auto",
          }}>
            {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "var(--tk-yellow-soft)", color: "#A47000",
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13.5 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--tk-gray-600)", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: form ───────────────────────────────────────────────────────────
  const progress = (formStep / FORM_STEPS) * 100;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(180deg,#F1F5FB,#fff)", padding: "60px 24px" }}
    >
      <div style={{ maxWidth: 680, width: "100%" }}>
        {/* Logo + pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-blue-600)" }}>
            Talentika<span style={{ color: "var(--tk-yellow)", fontSize: 12, marginLeft: 2 }}>✦</span>
          </span>
          <div style={{ flex: 1 }} />
          <span style={{
            padding: "4px 12px", borderRadius: 99,
            background: "var(--tk-blue-50)", color: "var(--tk-blue-700)",
            fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12,
          }}>
            Pengaturan Profil
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--tk-gray-150)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: "var(--tk-blue-600)", borderRadius: 99,
              transition: "width .5s ease",
            }} />
          </div>
          <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, color: "var(--tk-blue-700)" }}>
            {formStep} / {FORM_STEPS}
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: "white", borderRadius: 24,
          boxShadow: "var(--tk-shadow-lg)", padding: 36,
          border: "1px solid var(--tk-gray-200)", marginTop: 24,
        }}>
          {/* Step 1: Nama & Usia */}
          {formStep === 1 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", display: "grid", placeItems: "center" }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-mono)", fontWeight: 600, fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" as const, color: "var(--tk-blue-600)", marginBottom: 2 }}>Langkah 1</div>
                  <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink)", margin: 0 }}>Kenalkan Dirimu</h2>
                </div>
              </div>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13.5, marginBottom: 24, marginTop: 6 }}>Siapa namamu? Kami ingin mengenalmu lebih baik.</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-ink)", marginBottom: 8 }}>Nama Lengkap</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--tk-gray-50)", border: "1px solid var(--tk-gray-200)", borderRadius: 12, padding: "12px 14px" }}>
                  <User size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    value={formData.fullName}
                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Masukkan nama lengkapmu"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-ink)" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, color: "var(--tk-ink)", marginBottom: 8 }}>Usia</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--tk-gray-50)", border: "1px solid var(--tk-gray-200)", borderRadius: 12, padding: "12px 14px" }}>
                  <input
                    type="number" min="10" max="100"
                    value={formData.age}
                    onChange={e => setFormData(p => ({ ...p, age: e.target.value }))}
                    placeholder="Contoh: 17"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "var(--tk-font-sans)", fontSize: 14, color: "var(--tk-ink)" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pendidikan */}
          {formStep === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--tk-orange-soft)", color: "var(--tk-orange)", display: "grid", placeItems: "center" }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-mono)", fontWeight: 600, fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" as const, color: "var(--tk-orange)", marginBottom: 2 }}>Langkah 2</div>
                  <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink)", margin: 0 }}>Jenjang Pendidikan</h2>
                </div>
              </div>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13.5, marginBottom: 24, marginTop: 6 }}>Sedang di jenjang pendidikan apa sekarang?</p>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {EDU_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFormData(p => ({ ...p, educationLevel: opt }))}
                    style={{
                      textAlign: "left" as const, padding: "14px 18px",
                      background: formData.educationLevel === opt ? "var(--tk-blue-50)" : "white",
                      border: formData.educationLevel === opt ? "2px solid var(--tk-blue-600)" : "1.5px solid var(--tk-gray-200)",
                      borderRadius: 14, cursor: "pointer", fontSize: 14,
                      color: formData.educationLevel === opt ? "var(--tk-blue-700)" : "var(--tk-ink)",
                      fontFamily: "var(--tk-font-display)", fontWeight: formData.educationLevel === opt ? 700 : 500,
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all .15s ease",
                    }}
                  >
                    {opt}
                    {formData.educationLevel === opt && <Check size={16} style={{ color: "var(--tk-blue-600)" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Minat */}
          {formStep === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--tk-mint)", color: "var(--tk-green-dark)", display: "grid", placeItems: "center" }}>
                  <Heart size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--tk-font-mono)", fontWeight: 600, fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" as const, color: "var(--tk-green-dark)", marginBottom: 2 }}>Langkah 3</div>
                  <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink)", margin: 0 }}>Minat & Passion</h2>
                </div>
              </div>
              <p style={{ color: "var(--tk-gray-500)", fontSize: 13.5, marginBottom: 24, marginTop: 6 }}>Pilih minatmu (bisa lebih dari satu) untuk rekomendasi yang lebih personal.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {INTEREST_OPTIONS.map(({ id, label, icon }) => {
                  const selected = formData.interests.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleInterest(id)}
                      style={{
                        padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                        background: selected ? "var(--tk-blue-50)" : "white",
                        border: selected ? "2px solid var(--tk-blue-600)" : "1.5px solid var(--tk-gray-200)",
                        display: "flex", alignItems: "center", gap: 10,
                        fontFamily: "var(--tk-font-display)", fontWeight: selected ? 700 : 500,
                        fontSize: 13.5, color: selected ? "var(--tk-blue-700)" : "var(--tk-ink)",
                        transition: "all .15s ease",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <span style={{ flex: 1, textAlign: "left" as const }}>{label}</span>
                      {selected && <Check size={15} style={{ color: "var(--tk-blue-600)", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              {formData.interests.length > 0 && (
                <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--tk-gray-500)" }}>
                  {formData.interests.length} minat dipilih
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <button
              onClick={prevForm}
              style={{
                padding: "12px 20px", background: "white",
                border: "1px solid var(--tk-gray-200)", borderRadius: 12,
                cursor: "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 600,
                fontSize: 14, color: "var(--tk-gray-700)", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <ChevronLeft size={14} /> Kembali
            </button>
            <button
              onClick={nextForm}
              disabled={!stepCanProceed() || saving}
              style={{
                flex: 1, padding: "12px 20px",
                background: stepCanProceed() ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
                border: "none", borderRadius: 12,
                cursor: stepCanProceed() ? "pointer" : "default",
                fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
                color: stepCanProceed() ? "#fff" : "var(--tk-gray-400)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .2s",
              }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} />
                  Menyimpan…
                </span>
              ) : formStep === FORM_STEPS ? (
                <>Mulai Talent Test <Rocket size={15} /></>
              ) : (
                <>Selanjutnya <ArrowRight size={15} /></>
              )}
            </button>
          </div>

          {/* Skip link */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--tk-font-display)", fontSize: 13,
                color: "var(--tk-gray-400)", textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Isi nanti, langsung ke dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
