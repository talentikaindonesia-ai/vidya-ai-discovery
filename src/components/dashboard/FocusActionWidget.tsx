import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ambilIdentitas } from "@/hooks/useIdentitasSiswa";
import { Target, ChevronRight, CheckSquare, Square, Sparkles, ArrowRight, BookOpen, Users, GraduationCap } from "lucide-react";

const RIASEC_META: Record<string, { label: string; emoji: string; tagline: string; weeklyActions: string[] }> = {
  realistic:    { label: "Realistic",    emoji: "🔧", tagline: "Teknis & berorientasi hasil",    weeklyActions: ["Selesaikan 1 modul coding di Learning Hub", "Daftar ke 1 program magang teknis", "Update portfolio dengan proyek terbaru"] },
  investigative:{ label: "Investigative",emoji: "🔬", tagline: "Analitis & suka riset",           weeklyActions: ["Baca 1 jurnal ilmiah di bidangmu", "Analisis 1 dataset kecil (Excel/Python)", "Daftar ke kompetisi riset / olimpiade"] },
  artistic:     { label: "Artistic",     emoji: "🎨", tagline: "Kreatif & suka mengekspresikan diri", weeklyActions: ["Selesaikan 1 proyek desain (poster/UI)", "Upload 1 karya baru ke portfolio", "Pelajari 1 fitur baru Figma/Canva"] },
  social:       { label: "Social",       emoji: "🤝", tagline: "Empatis & komunikatif",           weeklyActions: ["Ikuti 1 sesi volunteer minggu ini", "Latih public speaking 3 menit", "Bergabung komunitas diskusi online"] },
  enterprising: { label: "Enterprising", emoji: "💼", tagline: "Ambisius & berjiwa pemimpin",     weeklyActions: ["Buat pitch deck sederhana untuk ide bisnis", "Ikuti kompetisi startup / bisnis plan", "Reach out 1 profesional untuk networking"] },
  conventional: { label: "Conventional", emoji: "📊", tagline: "Terorganisir & detail-oriented",  weeklyActions: ["Rapikan sistem (spreadsheet/Notion)", "Pelajari 1 fungsi baru Excel/SQL", "Daftar magang bidang keuangan/administrasi"] },
};

const QUICK_TABS = [
  { icon: BookOpen,      label: "Kursus",    tab: "kursus"  },
  { icon: Target,        label: "Peluang",   tab: "peluang" },
  { icon: GraduationCap, label: "Mentor",    tab: "mentor"  },
];

interface Props { userId: string }

export function FocusActionWidget({ userId }: Props) {
  const navigate = useNavigate();
  const [riasecType, setRiasecType] = useState<string | null>(null);
  const [xp, setXp]                 = useState<{ current_xp: number; current_level: number } | null>(null);
  const [checked, setChecked]       = useState<boolean[]>([false, false, false]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      // Identitas dari view kanonik — lihat src/hooks/useIdentitasSiswa.ts
      const [ident, xpRes] = await Promise.all([
        ambilIdentitas(userId),
        supabase.from("user_xp").select("current_xp, current_level").eq("user_id", userId).maybeSingle(),
      ]);
      const pType = ident?.tipeUtama ?? null;
      setRiasecType(pType);
      setXp(xpRes.data);
      if (pType) {
        const saved = localStorage.getItem(`focus_actions_${userId}_${pType}`);
        if (saved) {
          try {
            const all = JSON.parse(saved) as boolean[];
            setChecked([all[0] ?? false, all[1] ?? false, all[2] ?? false]);
          } catch { /**/ }
        }
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const toggleAction = (i: number) => {
    const next = checked.map((v, idx) => idx === i ? !v : v);
    setChecked(next);
    if (riasecType) {
      const saved = localStorage.getItem(`focus_actions_${userId}_${riasecType}`);
      const all: boolean[] = saved ? JSON.parse(saved) : [false, false, false, false, false];
      all[i] = next[i];
      localStorage.setItem(`focus_actions_${userId}_${riasecType}`, JSON.stringify(all));
    }
  };

  if (loading) return null;

  // No assessment yet — teaser state
  if (!riasecType) {
    return (
      <div style={{
        borderRadius: 20, background: "linear-gradient(135deg, var(--tk-blue-50), var(--tk-blue-100))",
        border: "1.5px solid var(--tk-blue-200)", padding: "20px 24px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 42 }}>🎯</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-ink)", marginBottom: 4 }}>
            Mulai Focus Action Plan-mu
          </div>
          <div style={{ fontSize: 13, color: "var(--tk-gray-500)", lineHeight: 1.6, marginBottom: 14 }}>
            Ikuti tes RIASEC gratis untuk mendapatkan rencana belajar, kursus, peluang, dan mentor yang dipersonalisasi khusus untukmu.
          </div>
          <button onClick={() => navigate("/assessment")} style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: "var(--tk-blue-600)", color: "white",
            fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}>
            <Sparkles size={15} /> Mulai Tes RIASEC — Gratis
          </button>
        </div>
      </div>
    );
  }

  const meta = RIASEC_META[riasecType];
  const completedCount = checked.filter(Boolean).length;
  const levelPct = xp ? Math.round(((xp.current_xp % 100) / 100) * 100) : 0;

  return (
    <div style={{ borderRadius: 20, border: "1.5px solid var(--tk-blue-200)", overflow: "hidden", background: "white" }}>

      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, var(--tk-blue-50), var(--tk-blue-100))",
        padding: "18px 22px", borderBottom: "1px solid var(--tk-blue-200)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* RIASEC badge */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: "white",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
            boxShadow: "0 4px 12px var(--tk-blue-200)", flexShrink: 0,
          }}>
            {meta.emoji}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--tk-blue-600)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                Focus Action · {meta.label}
              </span>
            </div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-ink)", marginBottom: 2 }}>
              Rencana Aksi Minggu Ini
            </div>
            <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)" }}>{meta.tagline}</div>
          </div>
        </div>

        {/* XP + Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {xp && (
            <div style={{ textAlign: "center", background: "white", borderRadius: 12, padding: "8px 14px", border: "1px solid var(--tk-blue-200)" }}>
              <div style={{ fontSize: 10, color: "var(--tk-gray-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Level {xp.current_level}</div>
              <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "var(--tk-blue-600)" }}>{xp.current_xp} XP</div>
              <div style={{ height: 4, background: "var(--tk-blue-100)", borderRadius: 99, marginTop: 4, overflow: "hidden", width: 70 }}>
                <div style={{ height: "100%", width: `${levelPct}%`, background: "var(--tk-blue-600)", borderRadius: 99 }} />
              </div>
            </div>
          )}
          <div style={{ textAlign: "center", background: "white", borderRadius: 12, padding: "8px 14px", border: "1px solid var(--tk-blue-200)" }}>
            <div style={{ fontSize: 10, color: "var(--tk-gray-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Selesai</div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "var(--tk-blue-600)" }}>
              {completedCount}<span style={{ fontSize: 12, color: "var(--tk-gray-400)" }}>/3</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--tk-gray-400)" }}>aksi</div>
          </div>
        </div>
      </div>

      {/* ── Weekly Actions (top 3) ──────────────────────────────────── */}
      <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--tk-gray-150)" }}>
        {/* Progress bar */}
        <div style={{ height: 6, background: "var(--tk-gray-150)", borderRadius: 99, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(completedCount / 3) * 100}%`, background: completedCount === 3 ? "var(--tk-green)" : "var(--tk-blue-600)", borderRadius: 99, transition: "width .4s" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {meta.weeklyActions.map((action, i) => (
            <div key={i} onClick={() => toggleAction(i)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 12, cursor: "pointer",
              background: checked[i] ? "var(--tk-mint)" : "var(--tk-gray-50)",
              border: `1px solid ${checked[i] ? "var(--tk-green)" : "var(--tk-gray-200)"}`,
              transition: "all .15s",
            }}>
              {checked[i]
                ? <CheckSquare size={18} style={{ color: "var(--tk-green)", flexShrink: 0 }} />
                : <Square size={18} style={{ color: "var(--tk-gray-300)", flexShrink: 0 }} />
              }
              <span style={{ flex: 1, fontSize: 13, fontWeight: checked[i] ? 400 : 600, color: checked[i] ? "var(--tk-gray-400)" : "var(--tk-gray-700)", textDecoration: checked[i] ? "line-through" : "none", lineHeight: 1.4 }}>
                {action}
              </span>
              {checked[i] && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tk-green)" }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick-access tabs + CTA ─────────────────────────────────── */}
      <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "var(--tk-gray-50)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {QUICK_TABS.map(t => (
            <button key={t.tab} onClick={() => navigate(`/focus#${t.tab}`)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 13px", borderRadius: 10, cursor: "pointer",
              border: "1.5px solid var(--tk-blue-200)", background: "white",
              color: "var(--tk-blue-600)", fontSize: 12.5, fontWeight: 700,
              transition: "all .15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-50)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/focus")} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 18px", borderRadius: 11, border: "none",
          background: "var(--tk-blue-600)", color: "white",
          fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Lihat Semua <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
