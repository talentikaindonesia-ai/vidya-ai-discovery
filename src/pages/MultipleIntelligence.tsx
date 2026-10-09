/**
 * MultipleIntelligence — Tes Kecerdasan Majemuk (Howard Gardner, 8 dimensi).
 * Dimensi kedua Profil Talenta (selain RIASEC). 24 soal skala setuju 1–4.
 * Menyimpan ke assessment_results (assessment_type='multiple_intelligence').
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Sparkles, LayoutDashboard, RefreshCw, Lock } from "lucide-react";
import { LockedButton } from "@/components/payment/LockedButton";

type MIKey = "linguistic" | "logical" | "spatial" | "musical" | "kinesthetic" | "interpersonal" | "intrapersonal" | "naturalistic";

const MI: Record<MIKey, { name: string; emoji: string; accent: string; desc: string; fields: string[] }> = {
  linguistic:    { name: "Linguistik", emoji: "📖", accent: "#2563EB", desc: "Pandai berkata-kata, membaca, menulis, dan berbahasa.", fields: ["Penulis", "Jurnalis", "Pengacara", "Penerjemah", "Public Speaker"] },
  logical:       { name: "Logis-Matematis", emoji: "🔢", accent: "#0EA5E9", desc: "Kuat di logika, angka, pola, dan penalaran ilmiah.", fields: ["Ilmuwan", "Programmer", "Akuntan", "Insinyur", "Analis Data"] },
  spatial:       { name: "Spasial-Visual", emoji: "🎨", accent: "#8B5CF6", desc: "Berpikir dalam gambar, ruang, dan visual.", fields: ["Desainer", "Arsitek", "Fotografer", "Animator", "Pilot"] },
  musical:       { name: "Musikal", emoji: "🎵", accent: "#EC4899", desc: "Peka pada nada, irama, dan suara.", fields: ["Musisi", "Komposer", "Sound Engineer", "Penyanyi", "Produser Musik"] },
  kinesthetic:   { name: "Kinestetik", emoji: "🤸", accent: "#F97316", desc: "Terampil menggunakan tubuh dan koordinasi fisik.", fields: ["Atlet", "Penari", "Aktor", "Dokter Bedah", "Chef"] },
  interpersonal: { name: "Interpersonal", emoji: "🤝", accent: "#10B981", desc: "Pandai memahami & berinteraksi dengan orang lain.", fields: ["Guru", "Psikolog", "Marketing", "HRD", "Pemimpin"] },
  intrapersonal: { name: "Intrapersonal", emoji: "🧘", accent: "#6366F1", desc: "Memahami diri sendiri, emosi, dan tujuan hidup.", fields: ["Penulis", "Filsuf", "Peneliti", "Wirausaha", "Konselor"] },
  naturalistic:  { name: "Naturalis", emoji: "🌿", accent: "#059669", desc: "Peka pada alam, makhluk hidup, dan lingkungan.", fields: ["Biolog", "Dokter Hewan", "Petani", "Ahli Lingkungan", "Geolog"] },
};

const QUESTIONS: { q: string; k: MIKey }[] = [
  { q: "Aku suka membaca buku, artikel, atau cerita.", k: "linguistic" },
  { q: "Aku senang memecahkan soal angka atau teka-teki logika.", k: "logical" },
  { q: "Aku mudah membayangkan bentuk atau ruang dalam pikiran.", k: "spatial" },
  { q: "Aku peka terhadap nada, irama, dan melodi.", k: "musical" },
  { q: "Aku belajar lebih baik sambil bergerak atau praktik langsung.", k: "kinesthetic" },
  { q: "Aku mudah memahami perasaan dan kebutuhan orang lain.", k: "interpersonal" },
  { q: "Aku sering merenungkan perasaan, tujuan, dan kelebihanku.", k: "intrapersonal" },
  { q: "Aku tertarik pada alam, hewan, atau tumbuhan.", k: "naturalistic" },
  { q: "Aku mudah mengungkapkan ide lewat tulisan atau berbicara.", k: "linguistic" },
  { q: "Aku senang mencari pola dan hubungan sebab-akibat.", k: "logical" },
  { q: "Aku suka menggambar, mendesain, atau menata sesuatu secara visual.", k: "spatial" },
  { q: "Aku sering menyanyi, bersenandung, atau memainkan alat musik.", k: "musical" },
  { q: "Aku terampil dalam olahraga, menari, atau kegiatan fisik.", k: "kinesthetic" },
  { q: "Aku senang bekerja dalam tim dan berinteraksi dengan banyak orang.", k: "interpersonal" },
  { q: "Aku tahu apa yang membuatku termotivasi dan nyaman.", k: "intrapersonal" },
  { q: "Aku peka terhadap perubahan lingkungan dan cuaca.", k: "naturalistic" },
  { q: "Aku senang bermain kata, teka-teki, atau belajar bahasa baru.", k: "linguistic" },
  { q: "Aku nyaman bekerja dengan data, hitungan, atau eksperimen.", k: "logical" },
  { q: "Aku mudah membaca peta, diagram, atau grafik.", k: "spatial" },
  { q: "Musik mudah memengaruhi suasana hatiku.", k: "musical" },
  { q: "Aku suka membuat atau memperbaiki sesuatu dengan tangan.", k: "kinesthetic" },
  { q: "Teman-teman sering meminta nasihat atau bantuanku.", k: "interpersonal" },
  { q: "Aku lebih suka menetapkan tujuan dan bekerja secara mandiri.", k: "intrapersonal" },
  { q: "Aku suka kegiatan di luar ruangan atau menjaga lingkungan.", k: "naturalistic" },
];

const SCALE = [
  { v: 1, label: "Sangat Tidak Setuju" },
  { v: 2, label: "Tidak Setuju" },
  { v: 3, label: "Setuju" },
  { v: 4, label: "Sangat Setuju" },
];

const MAX_PER_DIM = 3 * 4; // 3 questions × max 4

export default function MultipleIntelligence() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scores, setScores] = useState<Record<MIKey, number>>({} as Record<MIKey, number>);
  const [saving, setSaving] = useState(false);

  const finish = async (allAnswers: Record<number, number>) => {
    // tally per dimension → percentage of max
    const tally = {} as Record<MIKey, number>;
    (Object.keys(MI) as MIKey[]).forEach(k => (tally[k] = 0));
    QUESTIONS.forEach((qq, i) => { tally[qq.k] += allAnswers[i] || 0; });
    const pct = {} as Record<MIKey, number>;
    (Object.keys(tally) as MIKey[]).forEach(k => (pct[k] = Math.round((tally[k] / MAX_PER_DIM) * 100)));
    setScores(pct);
    setPhase("results");

    const sorted = (Object.keys(pct) as MIKey[]).sort((a, b) => pct[b] - pct[a]);
    const top = sorted[0];
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("assessment_results").insert({
          user_id: user.id,
          assessment_type: "multiple_intelligence",
          personality_type: top,
          questions_answers: allAnswers,
          score_breakdown: pct,
          talent_areas: sorted.slice(0, 3).map(k => MI[k].name),
          career_recommendations: MI[top].fields,
        });
      }
    } catch { /* non-blocking */ }
    setSaving(false);
  };

  const answer = (v: number) => {
    const next = { ...answers, [step]: v };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else finish(next);
  };

  const retake = () => { setPhase("intro"); setStep(0); setAnswers({}); setScores({} as Record<MIKey, number>); };

  /* ── INTRO ── */
  if (phase === "intro") {
    return (
      <Shell>
        <SEO title="Tes Kecerdasan Majemuk — Talentika" description="Temukan 8 jenis kecerdasanmu menurut teori Multiple Intelligence Howard Gardner." />
        <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🧠</div>
          <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 28, color: "var(--tk-ink)", margin: "0 0 12px" }}>Tes Kecerdasan Majemuk</h1>
          <p style={{ fontSize: 15, color: "var(--tk-gray-500)", lineHeight: 1.7, marginBottom: 24 }}>
            Berdasarkan teori <b>Multiple Intelligence</b> Howard Gardner — temukan 8 jenis kecerdasanmu dan dimensi mana yang paling menonjol. <b>24 pertanyaan, ±4 menit.</b>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(76px, 1fr))", gap: 8, marginBottom: 28 }}>
            {(Object.values(MI)).map(m => (
              <div key={m.name} style={{ background: "var(--tk-gray-50)", borderRadius: 12, padding: "12px 6px", border: "1px solid var(--tk-gray-100)" }}>
                <div style={{ fontSize: 22 }}>{m.emoji}</div>
                <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)", marginTop: 3, fontWeight: 600 }}>{m.name}</div>
              </div>
            ))}
          </div>
          <LockedButton
            feature="Tes Kecerdasan Majemuk"
            benefits={[
              "Kenali 8 jenis kecerdasanmu (teori Howard Gardner)",
              "Rekomendasi peluang & belajar makin akurat",
              "Lengkapi profil bakatmu di luar tes RIASEC",
            ]}
            fromPath="/multiple-intelligence"
            onClick={() => setPhase("quiz")}
          >
            {(locked, guardedClick) => (
              <button onClick={guardedClick}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: locked ? "linear-gradient(135deg,#475569,#334155)" : "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 32px", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 18px rgba(37,99,235,.3)" }}>
                {locked ? <Lock size={16} /> : null} Mulai Tes <ArrowRight size={18} />
              </button>
            )}
          </LockedButton>
        </div>
      </Shell>
    );
  }

  /* ── QUIZ ── */
  if (phase === "quiz") {
    const q = QUESTIONS[step];
    const progress = ((step + 1) / QUESTIONS.length) * 100;
    return (
      <Shell>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={() => step > 0 ? setStep(step - 1) : setPhase("intro")}
              style={{ background: "none", border: "none", color: "var(--tk-gray-400)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, padding: 0 }}>
              <ArrowLeft size={15} /> Kembali
            </button>
            <span style={{ fontSize: 13, color: "var(--tk-gray-400)", fontWeight: 700 }}>{step + 1} / {QUESTIONS.length}</span>
          </div>
          <div style={{ height: 7, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden", marginBottom: 28 }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: "var(--tk-blue-600)", transition: "width .3s" }} />
          </div>
          <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--tk-gray-200)", padding: "28px 24px", marginBottom: 18 }}>
            <div style={{ fontSize: 30, marginBottom: 10, textAlign: "center" }}>{MI[q.k].emoji}</div>
            <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 19, color: "var(--tk-ink)", textAlign: "center", lineHeight: 1.4, margin: 0 }}>{q.q}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SCALE.map(s => {
              const sel = answers[step] === s.v;
              return (
                <button key={s.v} onClick={() => answer(s.v)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                    border: `2px solid ${sel ? "var(--tk-blue-600)" : "var(--tk-gray-200)"}`,
                    background: sel ? "var(--tk-blue-50)" : "white",
                    fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 15, color: "var(--tk-ink)", transition: "all .15s" }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${sel ? "var(--tk-blue-600)" : "var(--tk-gray-300)"}`, background: sel ? "var(--tk-blue-600)" : "transparent", flexShrink: 0 }} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  /* ── RESULTS ── */
  const sorted = (Object.keys(scores) as MIKey[]).sort((a, b) => scores[b] - scores[a]);
  const top = sorted[0];
  return (
    <Shell>
      <SEO title="Hasil Kecerdasan Majemuk — Talentika" noindex />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{MI[top].emoji}</div>
          <div style={{ fontSize: 13, color: "var(--tk-gray-500)", fontWeight: 600 }}>Kecerdasan dominanmu</div>
          <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 30, color: MI[top].accent, margin: "4px 0 10px" }}>{MI[top].name}</h1>
          <p style={{ fontSize: 14.5, color: "var(--tk-gray-600)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>{MI[top].desc}</p>
          {saving && <div style={{ fontSize: 12, color: "var(--tk-gray-400)", marginTop: 8 }}>Menyimpan hasil…</div>}
        </div>

        {/* All 8 bars */}
        <div style={{ background: "white", borderRadius: 22, border: "1px solid var(--tk-gray-200)", padding: "24px 26px", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "var(--tk-ink)", marginBottom: 18 }}>Peta 8 Kecerdasanmu</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {sorted.map((k, i) => (
              <div key={k}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13.5, fontWeight: i < 3 ? 700 : 500, color: i < 3 ? "var(--tk-ink)" : "var(--tk-gray-600)" }}>{MI[k].emoji} {MI[k].name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: MI[k].accent }}>{scores[k]}%</span>
                </div>
                <div style={{ height: 9, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden" }}>
                  <div style={{ width: `${scores[k]}%`, height: "100%", borderRadius: 99, background: MI[k].accent, transition: "width .5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 detail + careers */}
        <div style={{ background: "white", borderRadius: 22, border: "1px solid var(--tk-gray-200)", padding: "24px 26px", marginBottom: 18 }}>
          <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 17, color: "var(--tk-ink)", marginBottom: 16 }}>3 Kekuatan Utamamu & Arah Karier</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sorted.slice(0, 3).map(k => (
              <div key={k} style={{ borderLeft: `3px solid ${MI[k].accent}`, paddingLeft: 14 }}>
                <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>{MI[k].emoji} {MI[k].name} <span style={{ color: MI[k].accent }}>· {scores[k]}%</span></div>
                <div style={{ fontSize: 13, color: "var(--tk-gray-500)", margin: "3px 0 7px", lineHeight: 1.5 }}>{MI[k].desc}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MI[k].fields.map(f => (
                    <span key={f} style={{ fontSize: 11.5, fontWeight: 600, color: MI[k].accent, background: `${MI[k].accent}15`, padding: "3px 10px", borderRadius: 99 }}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 13, padding: "12px 24px", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <LayoutDashboard size={17} /> Ke Dashboard
          </button>
          <button onClick={() => navigate("/assessment")}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", color: "var(--tk-gray-600)", border: "1.5px solid var(--tk-gray-200)", borderRadius: 13, padding: "12px 24px", fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <Sparkles size={15} /> Tes RIASEC
          </button>
          <button onClick={retake}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", color: "var(--tk-gray-500)", border: "1.5px solid var(--tk-gray-200)", borderRadius: 13, padding: "12px 20px", fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            <RefreshCw size={14} /> Ulangi
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F8FAFD,#EEF3FB)", padding: "40px 18px 60px" }}>
      {children}
    </div>
  );
}
