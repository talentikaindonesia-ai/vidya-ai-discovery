/**
 * PathDetail — full-page view of any active learning path (course), browsable
 * regardless of the viewer's RIASEC match (uses get_learning_path, not the
 * persona-locked my_learning_path). Same completion → certificate flow.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { LockedButton } from "@/components/payment/LockedButton";
import {
  ArrowLeft, BookOpen, CheckCircle2, PlayCircle, Circle, ArrowRight,
  GraduationCap, Clock, Loader2, Briefcase, Wallet, Award,
} from "lucide-react";

interface PathItem {
  content_id: string; title: string; content_type: string;
  duration_minutes: number | null; order_index: number;
  status: string; progress: number;
}
interface PathData {
  path: {
    id: string; name: string; description: string; riasec_type: string; hours: number | null;
    certificate_claimed?: boolean;
    career_outlook: string | null; salary_range: string | null; related_certifications: string[] | null;
  };
  items: PathItem[];
}

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

export default function PathDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: res, error } = await rpc("get_learning_path", { p_path_id: id });
      if (error || !res) { setNotFound(true); setLoading(false); return; }
      const d = res as unknown as PathData;
      setData(d);
      setClaimed(d?.path?.certificate_claimed === true);
      setLoading(false);
    })();
  }, [id]);

  const claimCertificate = async () => {
    if (!data) return;
    setClaiming(true);
    const { data: r, error } = await rpc("claim_path_certificate", { p_path_id: data.path.id }) as unknown as { data: { verification_code?: string } | null; error: { message: string } | null };
    setClaiming(false);
    if (error) { toast.error(error.message); return; }
    setClaimed(true);
    toast.success(`🎓 Sertifikat diraih! Kode: ${r?.verification_code ?? ""}`);
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--tk-blue-600)" }} /></div>;
  }
  if (notFound || !data || !data.items?.length) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 6 }}>Jalur belajar tidak ditemukan</div>
          <button onClick={() => navigate("/learning")} style={{ marginTop: 10, background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Kembali ke Learning Hub</button>
        </div>
      </div>
    );
  }

  const { path, items } = data;
  const done = items.filter(i => i.status === "completed").length;
  const pct = Math.round((done / items.length) * 100);
  const next = items.find(i => i.status !== "completed") ?? items[0];
  const allDone = done === items.length;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F8FAFD,#EEF3FB)" }}>
      <SEO title={`${path.name} — Jalur Belajar Talentika`} description={path.description} />
      <div style={{ background: "#fff", borderBottom: "1px solid var(--tk-gray-200)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/learning")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-500)", display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 600 }}>
          <ArrowLeft size={17} /> Learning Hub
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 60px" }}>
        <div className="tk-card" style={{ padding: "24px 26px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--tk-blue-50)", color: "var(--tk-blue-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <BookOpen size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 21, color: "var(--tk-ink)", margin: 0 }}>{path.name}</h1>
              <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", margin: "6px 0 0", lineHeight: 1.6 }}>{path.description}</p>
              <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12.5, color: "var(--tk-gray-500)" }}>
                {path.hours ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} /> ±{path.hours} jam</span> : null}
                <span>{items.length} materi</span>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--tk-blue-600)", background: "var(--tk-blue-50)", padding: "5px 13px", borderRadius: 99, whiteSpace: "nowrap" }}>
              {done}/{items.length}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: "var(--tk-gray-100)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--tk-blue-500), var(--tk-blue-600))", transition: "width .4s" }} />
          </div>
        </div>

        {(path.career_outlook || path.salary_range || (path.related_certifications && path.related_certifications.length > 0)) && (
          <div className="tk-card" style={{ padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 15, color: "var(--tk-ink)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Briefcase size={17} style={{ color: "var(--tk-blue-600)" }} /> Prospek Karier
            </div>
            {path.career_outlook && (
              <p style={{ fontSize: 13.5, color: "var(--tk-gray-600)", lineHeight: 1.65, margin: "0 0 16px" }}>{path.career_outlook}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {path.salary_range && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: "#ECFDF5", color: "#059669", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Wallet size={15} />
                  </span>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>Kisaran Pendapatan</div>
                    <div style={{ fontSize: 13.5, color: "var(--tk-ink)", fontWeight: 600, marginTop: 2 }}>{path.salary_range}</div>
                  </div>
                </div>
              )}
              {path.related_certifications && path.related_certifications.length > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: "#F0E8FF", color: "#7C3AED", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Award size={15} />
                  </span>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--tk-gray-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 5 }}>Sertifikasi Terkait</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {path.related_certifications.map(cert => (
                        <span key={cert} style={{ fontSize: 12, fontWeight: 600, color: "#5B21B6", background: "#F0E8FF", padding: "4px 11px", borderRadius: 99 }}>{cert}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="tk-card" style={{ padding: "10px", marginBottom: 20 }}>
          {items.map((it, i) => {
            const isDone = it.status === "completed";
            const isActive = it.status === "in_progress";
            return (
              <button key={it.content_id} onClick={() => navigate(`/learning/content/${it.content_id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 12,
                  background: isActive ? "var(--tk-blue-50)" : "transparent",
                  cursor: "pointer", textAlign: "left", width: "100%", border: "none",
                }}>
                <span style={{ flexShrink: 0, color: isDone ? "#10B981" : isActive ? "var(--tk-blue-600)" : "var(--tk-gray-300)" }}>
                  {isDone ? <CheckCircle2 size={21} /> : isActive ? <PlayCircle size={21} /> : <Circle size={21} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tk-ink)", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>
                    {i + 1}. {it.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--tk-gray-400)" }}>
                    {it.content_type}{it.duration_minutes ? ` · ${it.duration_minutes} mnt` : ""}{isActive ? ` · ${it.progress}%` : ""}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!allDone ? (
          <button onClick={() => navigate(`/learning/content/${next.content_id}`)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, var(--tk-blue-500), var(--tk-blue-600))", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15 }}>
            {done > 0 ? "Lanjutkan Belajar" : "Mulai Jalur Ini"} <ArrowRight size={17} />
          </button>
        ) : claimed ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, background: "#ECFDF5", color: "#059669", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15 }}>
            <GraduationCap size={19} /> Sertifikat Diraih ✓
          </div>
        ) : (
          <LockedButton
            feature="Sertifikat Jalur Belajar"
            benefits={[
              "Sertifikat resmi Talentika dengan kode verifikasi",
              "Bisa dibagikan ke sekolah, kampus & rekruter",
              "Akses semua konten belajar tanpa batas",
            ]}
            fromPath={`/learning/path/${path.id}`}
            onClick={claimCertificate}
          >
            {(locked, guardedClick) => (
              <button onClick={guardedClick} disabled={claiming}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 14, border: "none", cursor: claiming ? "wait" : "pointer", background: locked ? "linear-gradient(135deg,#475569,#334155)" : "linear-gradient(135deg, #F59E0B, #D97706)", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15 }}>
                <GraduationCap size={18} /> {claiming ? "Memproses…" : locked ? "🔒 Klaim Sertifikat" : "🎓 Klaim Sertifikat"}
              </button>
            )}
          </LockedButton>
        )}
      </div>
    </div>
  );
}
