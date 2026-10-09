/**
 * JoinSchool — landing page for school invite links
 * URL: /join/:schoolCode
 * Allows a student to join a school by clicking a shared link.
 * If not logged in → redirect to /auth?role=individual, then return here.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { Loader2, School, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const JoinSchool = () => {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "confirm" | "joining" | "done" | "error" | "already">("loading");
  const [schoolInfo, setSchoolInfo] = useState<{ school_name?: string; school_city?: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!schoolCode) { setStatus("error"); setErrorMsg("Kode sekolah tidak valid."); return; }
    init();
  }, [schoolCode]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Save code and redirect to login
      sessionStorage.setItem("pending_school_code", schoolCode!);
      navigate(`/auth?role=individual&redirect=join`);
      return;
    }

    setUserId(session.user.id);

    /* Cari sekolah lewat RPC server info_sekolah().
       Versi lama membaca tabel profiles langsung — padahal RLS profiles hanya
       mengizinkan membaca baris milik sendiri, jadi siswa TIDAK PERNAH bisa
       melihat profil admin sekolah. Diuji 2026-09-11: pencarian itu selalu
       0 baris, sehingga setiap siswa melihat "Kode sekolah tidak ditemukan". */
    const { data: hasil } = await (supabase.rpc as any)("info_sekolah", {
      p_code: schoolCode!.toUpperCase(),
    });
    const school = Array.isArray(hasil) && hasil.length > 0 ? hasil[0] : null;

    if (!school) {
      setStatus("error");
      setErrorMsg("Kode sekolah tidak ditemukan atau tidak aktif. Pastikan kode yang kamu masukkan benar.");
      return;
    }

    setSchoolInfo(school);

    // Check if already member
    const { data: existing } = await supabase.from("school_members")
      .select("id")
      .eq("school_code", schoolCode!.toUpperCase())
      .eq("student_user_id", session.user.id)
      .maybeSingle();

    if (existing) { setStatus("already"); return; }

    setStatus("confirm");
  };

  const joinSchool = async () => {
    if (!userId || !schoolCode) return;
    setStatus("joining");

    const code = schoolCode.toUpperCase();

    const { error: memberErr } = await supabase.from("school_members").upsert({
      school_code: code, student_user_id: userId,
    }, { onConflict: "school_code,student_user_id", ignoreDuplicates: true });

    if (memberErr) { setStatus("error"); setErrorMsg(memberErr.message); return; }

    await supabase.from("profiles")
      .update({ school_code: code, school_name: schoolInfo?.school_name })
      .eq("user_id", userId);

    toast.success(`Berhasil bergabung dengan ${schoolInfo?.school_name}! 🎉`);
    // Premium lewat sekolah hanya berlaku untuk sekolah yang sudah
    // diverifikasi Talentika — katakan apa adanya, jangan biarkan siswa
    // mengira aksesnya langsung terbuka.
    if ((schoolInfo as any)?.terverifikasi === false) {
      toast.info("Sekolahmu belum diverifikasi Talentika. Akses premium dari sekolah aktif setelah verifikasi selesai.");
    }
    setStatus("done");
  };

  // ── UI states ──────────────────────────────────────────────────────────────

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <>
      <SEO title="Bergabung dengan Sekolah — Talentika" description="Bergabung dengan sekolahmu di Talentika." noindex />
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #F1F5FB, #E8F1FF)", padding: "24px 16px" }}>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,.09)", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--tk-font-display)", fontSize: 24, fontWeight: 800, color: "var(--tk-blue-600)", marginBottom: 28, letterSpacing: "-.02em" }}>
            Talentika✦
          </div>
          {children}
        </div>
      </div>
    </>
  );

  if (status === "loading") return (
    <Shell>
      <Loader2 size={36} style={{ color: "var(--tk-blue-600)", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
      <p style={{ color: "var(--tk-gray-500)", fontSize: 14 }}>Memeriksa kode sekolah…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  if (status === "error") return (
    <Shell>
      <XCircle size={48} style={{ color: "#EF4444", margin: "0 auto 16px" }} />
      <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "var(--tk-ink)", marginBottom: 10 }}>Kode Tidak Valid</h2>
      <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.7, marginBottom: 24 }}>{errorMsg}</p>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "var(--tk-blue-600)", border: "none", borderRadius: 12, padding: "12px 28px", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Ke Dashboard
      </button>
    </Shell>
  );

  if (status === "already") return (
    <Shell>
      <CheckCircle size={48} style={{ color: "var(--tk-green)", margin: "0 auto 16px" }} />
      <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "var(--tk-ink)", marginBottom: 10 }}>
        Sudah Terdaftar 🎓
      </h2>
      <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.7, marginBottom: 24 }}>
        Kamu sudah terdaftar di <strong>{schoolInfo?.school_name}</strong>. Tidak perlu bergabung lagi.
      </p>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "var(--tk-blue-600)", border: "none", borderRadius: 12, padding: "12px 28px", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Ke Dashboard <ArrowRight size={15} style={{ display: "inline", verticalAlign: "middle" }} />
      </button>
    </Shell>
  );

  if (status === "done") return (
    <Shell>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 22, color: "var(--tk-ink)", marginBottom: 10 }}>
        Selamat Bergabung!
      </h2>
      <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", lineHeight: 1.7, marginBottom: 8 }}>
        Kamu resmi menjadi bagian dari
      </p>
      <div style={{ background: "var(--tk-blue-50)", borderRadius: 14, padding: "14px 20px", border: "1px solid var(--tk-blue-200)", marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 17, color: "var(--tk-blue-700)" }}>{schoolInfo?.school_name}</div>
        {schoolInfo?.school_city && <div style={{ fontSize: 13, color: "var(--tk-gray-500)", marginTop: 3 }}>📍 {schoolInfo.school_city}</div>}
      </div>
      <p style={{ fontSize: 13, color: "var(--tk-gray-400)", marginBottom: 20 }}>
        Data belajarmu sekarang terlihat di dashboard guru BK sekolah.
      </p>
      <button onClick={() => navigate("/dashboard")}
        style={{ background: "var(--tk-blue-600)", border: "none", borderRadius: 12, padding: "13px 32px", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,.3)" }}>
        Mulai Belajar <ArrowRight size={16} style={{ display: "inline", verticalAlign: "middle" }} />
      </button>
    </Shell>
  );

  // status === "confirm" | "joining"
  return (
    <Shell>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--tk-blue-50)", border: "2px solid var(--tk-blue-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
        🏫
      </div>
      <h2 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "var(--tk-ink)", marginBottom: 6 }}>
        Undangan Bergabung
      </h2>
      <p style={{ fontSize: 13.5, color: "var(--tk-gray-500)", marginBottom: 20 }}>
        Kamu diundang untuk bergabung ke:
      </p>

      <div style={{ background: "linear-gradient(135deg, var(--tk-blue-50), var(--tk-blue-100))", borderRadius: 16, padding: "18px 22px", border: "1.5px solid var(--tk-blue-200)", marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 4 }}>
          {schoolInfo?.school_name}
        </div>
        {schoolInfo?.school_city && (
          <div style={{ fontSize: 13.5, color: "var(--tk-gray-500)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            📍 {schoolInfo.school_city}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, background: "white", borderRadius: 8, padding: "4px 12px", display: "inline-block", color: "var(--tk-blue-600)", fontWeight: 700, border: "1px solid var(--tk-blue-200)" }}>
          Kode: {schoolCode?.toUpperCase()}
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--tk-gray-400)", lineHeight: 1.6, marginBottom: 22 }}>
        Dengan bergabung, guru BK sekolahmu dapat melihat progres belajar dan hasil tes RIASEC-mu untuk membantu bimbingan karier.
      </p>

      <button onClick={joinSchool} disabled={status === "joining"}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", borderRadius: 13, border: "none", background: "var(--tk-blue-600)", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, cursor: status === "joining" ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(37,99,235,.28)", marginBottom: 12 }}>
        {status === "joining"
          ? <><Loader2 size={16} style={{ animation: "spin .8s linear infinite" }} /> Memproses…</>
          : <>Bergabung Sekarang <ArrowRight size={16} /></>
        }
      </button>

      <button onClick={() => navigate("/dashboard")}
        style={{ background: "none", border: "none", color: "var(--tk-gray-400)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
        Nanti saja
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
};

export default JoinSchool;
