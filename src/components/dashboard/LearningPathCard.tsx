/**
 * LearningPathCard — "Jalur Belajarmu": personalized learning path from the
 * user's RIASEC type (my_learning_path RPC). Renders nothing if the user hasn't
 * taken the assessment yet. Drives the assessment→learning engagement loop.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, PlayCircle, Circle, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { LockedButton } from "@/components/payment/LockedButton";

interface PathItem {
  content_id: string;
  title: string;
  content_type: string;
  duration_minutes: number | null;
  order_index: number;
  status: string;        // completed | in_progress | not_started
  progress: number;
}
interface PathData {
  path: { id: string; name: string; description: string; riasec_type: string; hours: number | null; certificate_claimed?: boolean };
  items: PathItem[];
}

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>)(fn, args);

export const LearningPathCard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: res } = await rpc("my_learning_path", {});
      const d = (res as PathData) ?? null;
      setData(d);
      setClaimed(d?.path?.certificate_claimed === true);
      setLoading(false);
    })();
  }, []);

  if (loading || !data || !data.items?.length) return null;

  const { path, items } = data;
  const done = items.filter(i => i.status === "completed").length;
  const pct = Math.round((done / items.length) * 100);
  const next = items.find(i => i.status !== "completed") ?? items[0];
  const allDone = done === items.length;

  const claimCertificate = async () => {
    setClaiming(true);
    const { data: r, error } = await rpc("claim_path_certificate", { p_path_id: path.id }) as { data: { verification_code?: string } | null; error: { message: string } | null };
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    setClaimed(true);
    toast.success(`🎓 Sertifikat diraih! Kode: ${r?.verification_code ?? ""}`);
  };

  return (
    <div className="tk-card" style={{ padding: "22px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <BookOpen size={18} />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              {path.name}
              <Sparkles size={14} style={{ color: "var(--tk-yellow)" }} />
            </h3>
            <div style={{ fontSize: 12, color: "var(--tk-gray-500)", marginTop: 1 }}>
              Jalur belajar personal · {path.hours ? `±${path.hours} jam` : `${items.length} materi`}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tk-blue-600)", background: "var(--tk-blue-50)", padding: "4px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
          {done}/{items.length} selesai
        </span>
      </div>

      {/* Overall progress */}
      <div style={{ height: 8, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--tk-blue-500, #3B82F6), var(--tk-blue-600))", transition: "width .4s" }} />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {items.map((it, i) => {
          const isDone = it.status === "completed";
          const isActive = it.status === "in_progress";
          return (
            <button key={it.content_id} onClick={() => navigate(`/learning/content/${it.content_id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 12,
                border: "1px solid var(--tk-gray-100)", background: isActive ? "var(--tk-blue-50)" : "transparent",
                cursor: "pointer", textAlign: "left", width: "100%", transition: "background .15s",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--tk-gray-50)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <span style={{ flexShrink: 0, color: isDone ? "var(--tk-green, #10B981)" : isActive ? "var(--tk-blue-600)" : "var(--tk-gray-300)" }}>
                {isDone ? <CheckCircle2 size={20} /> : isActive ? <PlayCircle size={20} /> : <Circle size={20} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--tk-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>
                  {i + 1}. {it.title}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)" }}>
                  {it.content_type}{it.duration_minutes ? ` · ${it.duration_minutes} mnt` : ""}{isActive ? ` · ${it.progress}%` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      {!allDone ? (
        <button onClick={() => navigate(`/learning/content/${next.content_id}`)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 0", borderRadius: 13, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, var(--tk-blue-500, #3B82F6), var(--tk-blue-600))",
            color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
          }}>
          Lanjutkan Belajar <ArrowRight size={16} />
        </button>
      ) : claimed ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 13, background: "var(--tk-mint, #ECFDF5)", color: "var(--tk-green-dark, #059669)", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14 }}>
            <GraduationCap size={17} /> Sertifikat Diraih ✓
          </div>
          <button onClick={() => navigate("/learning")} style={{ background: "none", border: "none", color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Jelajahi kursus lain →
          </button>
        </div>
      ) : (
        <LockedButton
          feature="Sertifikat Jalur Belajar"
          benefits={[
            "Sertifikat resmi Talentika dengan kode verifikasi",
            "Bisa dibagikan ke sekolah, kampus & rekruter",
            "Akses semua konten belajar tanpa batas",
          ]}
          fromPath="/dashboard"
          onClick={claimCertificate}
        >
          {(locked, guardedClick) => (
            <button onClick={guardedClick} disabled={claiming}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 0", borderRadius: 13, border: "none", cursor: claiming ? "wait" : "pointer",
                background: locked ? "linear-gradient(135deg,#475569,#334155)" : "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14,
                boxShadow: locked ? "none" : "0 4px 12px rgba(217,119,6,.3)",
              }}>
              <GraduationCap size={17} /> {claiming ? "Memproses…" : locked ? "🔒 Klaim Sertifikat" : "🎓 Klaim Sertifikat"}
            </button>
          )}
        </LockedButton>
      )}
    </div>
  );
};
