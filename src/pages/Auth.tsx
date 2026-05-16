import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

// ─── Supabase helpers ────────────────────────────────────────────────────────

const recordReferral = async (code: string, newUserId: string) => {
  const { data: refRow } = await supabase
    .from("referral_codes")
    .select("id, user_id, total_referrals")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (!refRow) return;
  if (newUserId === refRow.user_id) return;

  await supabase.from("referral_usage").insert({
    referral_code_id: refRow.id,
    referred_user_id: newUserId,
    commission_earned: 0,
  });

  await supabase
    .from("referral_codes")
    .update({ total_referrals: (refRow.total_referrals || 0) + 1 })
    .eq("id", refRow.id);

  const { data: xpRow } = await supabase
    .from("user_xp")
    .select("current_xp, total_xp_earned, current_level")
    .eq("user_id", refRow.user_id)
    .maybeSingle();

  if (xpRow) {
    const newXP = xpRow.current_xp + 100;
    await supabase
      .from("user_xp")
      .update({
        current_xp: newXP,
        total_xp_earned: xpRow.total_xp_earned + 100,
        current_level: Math.floor(newXP / 1000) + 1,
      })
      .eq("user_id", refRow.user_id);
  }
};

// ─── Small reusable styled components ────────────────────────────────────────

const inputWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1.5px solid var(--tk-gray-200)",
  borderRadius: 12,
  padding: "12px 14px",
  background: "#fff",
  transition: "border-color .2s",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 14,
  color: "var(--tk-ink)",
  background: "transparent",
  fontFamily: "var(--tk-font-sans)",
};

const selectStyle: React.CSSProperties = {
  ...inputWrapStyle,
  padding: "0 14px",
  height: 48,
};

const nativeSelectStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 14,
  color: "var(--tk-ink)",
  background: "transparent",
  fontFamily: "var(--tk-font-sans)",
  height: "100%",
  cursor: "pointer",
};

// ─── Main component ───────────────────────────────────────────────────────────

const Auth = () => {
  // ── state ──
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"login" | "register">("login");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const navigate = useNavigate();

  // ── URL params ──
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect");
  const refCode = urlParams.get("ref");
  if (refCode) sessionStorage.setItem("referral_code", refCode);

  // ── set tab from URL ──
  useEffect(() => {
    if (urlParams.get("mode") === "register") setTab("register");
  }, []);

  // ── session check ──
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const destination =
          redirectTo === "talentika-junior" ? "/talentika-junior" : "/dashboard";
        navigate(destination);
      }
    };
    checkUser();
  }, [navigate, redirectTo]);

  // ── handlers ──
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const redirectUrl =
        redirectTo === "talentika-junior"
          ? `${window.location.origin}/talentika-junior`
          : `${window.location.origin}/dashboard`;

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            account_type: accountType,
            organization_name: organizationName,
            organization_type: organizationType,
          },
        },
      });

      if (error) throw error;

      const savedRef = sessionStorage.getItem("referral_code");
      if (savedRef && signUpData?.user?.id) {
        recordReferral(savedRef, signUpData.user.id).catch(() => {});
        sessionStorage.removeItem("referral_code");
      }

      // Fire welcome email (non-blocking)
      if (signUpData?.user?.id) {
        supabase.functions
          .invoke("send-welcome-email", {
            body: {
              email: signUpData.user.email,
              name: fullName || "",
              user_id: signUpData.user.id,
            },
          })
          .catch(() => {}); // best-effort
      }

      toast.success("Akun berhasil dibuat! Silakan login untuk melanjutkan.");
    } catch (error: any) {
      setError(error.message);
      toast.error("Gagal membuat akun: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Login berhasil!");
        const destination =
          redirectTo === "talentika-junior" ? "/talentika-junior" : "/dashboard";
        navigate(destination);
      }
    } catch (error: any) {
      setError(error.message);
      toast.error("Login gagal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const redirectUrl =
        redirectTo === "talentika-junior"
          ? `${window.location.origin}/talentika-junior`
          : `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      toast.error("Gagal login dengan Google: " + error.message);
      setIsLoading(false);
    }
  };

  // H-02: Password reset via Supabase magic link
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Masukkan alamat email kamu terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── value props data ──
  const valueProps = [
    {
      icon: <BookOpen size={18} style={{ color: "var(--tk-blue-600)" }} />,
      bg: "var(--tk-blue-50)",
      title: "Akses Pembelajaran Berkualitas",
      sub: "Kursus, mentoring, dan resources terbaik",
    },
    {
      icon: <Users size={18} style={{ color: "var(--tk-orange)" }} />,
      bg: "var(--tk-orange-soft)",
      title: "Komunitas Positif & Inspiratif",
      sub: "Bertemu dengan teman, mentor, dan komunitas",
    },
    {
      icon: <TrendingUp size={18} style={{ color: "var(--tk-green-dark)" }} />,
      bg: "var(--tk-mint)",
      title: "Bangun Masa Depanmu",
      sub: "Tingkatkan skill, raih peluang, dan wujudkan impianmu",
    },
  ];

  // ── Social proof stats (H-04: removed fake star rating) ──
  const STATS = [
    { value: "12K+",  label: "Pengguna aktif" },
    { value: "500+",  label: "Kursus tersedia" },
    { value: "100%",  label: "Gratis untuk mulai" },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="tk-page-in auth-grid"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-left  { display: none !important; }
          .auth-right { padding: 32px 20px !important; }
        }
      `}</style>
      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div
        className="auth-left"
        style={{
          background: "linear-gradient(135deg, #F1F5FB, #E8F1FF)",
          padding: "64px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              fontFamily: "var(--tk-font-display)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--tk-blue-600)",
              letterSpacing: "-0.5px",
            }}
          >
            Talentika✦
          </span>
        </div>

        {/* Tagline row */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 28,
            fontFamily: "var(--tk-font-display)",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "var(--tk-blue-600)" }}>Discover.</span>
          <span style={{ color: "var(--tk-orange)" }}>Develop.</span>
          <span style={{ color: "var(--tk-yellow)" }}>Grow.</span>
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "var(--tk-font-display)",
            fontSize: 46,
            fontWeight: 700,
            color: "var(--tk-ink)",
            lineHeight: 1.18,
            maxWidth: "14ch",
            marginBottom: 20,
          }}
        >
          Mulai perjalanan terbaikmu bersama Talentika✦
        </h1>

        {/* Description */}
        <p
          style={{
            maxWidth: "42ch",
            color: "var(--tk-gray-600)",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          Platform pembelajaran terpadu yang membantu kamu menemukan potensi,
          mengembangkan skill, dan meraih impian bersama komunitas inspiratif.
        </p>

        {/* Value props */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {valueProps.map((vp) => (
            <div
              key={vp.title}
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: vp.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {vp.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--tk-font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--tk-ink)",
                  }}
                >
                  {vp.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--tk-font-sans)",
                    fontSize: 13,
                    color: "var(--tk-gray-500)",
                    marginTop: 2,
                  }}
                >
                  {vp.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Social proof stats ── */}
        <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.65)",
                borderRadius: 12,
                padding: "12px 14px",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}
            >
              <div style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 800,
                fontSize: 20,
                color: "var(--tk-blue-600)",
                lineHeight: 1.1,
              }}>{value}</div>
              <div style={{
                fontFamily: "var(--tk-font-sans)",
                fontSize: 11.5,
                color: "var(--tk-gray-600)",
                marginTop: 3,
              }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Decorative blur circle */}
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 280,
            height: 280,
            opacity: 0.18,
            pointerEvents: "none",
          }}
          viewBox="0 0 280 280"
        >
          <circle cx="140" cy="140" r="140" fill="var(--tk-blue-600)" />
        </svg>

        {/* Sparkle stars */}
        <svg
          aria-hidden="true"
          className="tk-sparkle"
          style={{
            position: "absolute",
            top: 48,
            right: 56,
            width: 22,
            height: 22,
            opacity: 0.7,
          }}
          viewBox="0 0 22 22"
        >
          <path
            d="M11 1 L12.5 9.5 L21 11 L12.5 12.5 L11 21 L9.5 12.5 L1 11 L9.5 9.5 Z"
            fill="var(--tk-yellow)"
          />
        </svg>
        <svg
          aria-hidden="true"
          className="tk-sparkle"
          style={{
            position: "absolute",
            top: 120,
            right: 100,
            width: 14,
            height: 14,
            opacity: 0.5,
            animationDelay: "0.6s",
          }}
          viewBox="0 0 14 14"
        >
          <path
            d="M7 0 L8 5.5 L13.5 7 L8 8.5 L7 14 L6 8.5 L0.5 7 L6 5.5 Z"
            fill="var(--tk-blue-600)"
          />
        </svg>
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div
        className="auth-right"
        style={{
          background: "var(--tk-gray-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 40px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "42px 40px",
            width: "100%",
            maxWidth: 560,
            boxShadow: "var(--tk-shadow-lg, 0 8px 40px rgba(0,0,0,0.10))",
          }}
        >
          {/* ── Tab row ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "2px solid var(--tk-gray-100)",
              marginBottom: 32,
            }}
          >
            {(["login", "register"] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "12px 0",
                    fontSize: 15,
                    fontWeight: active ? 700 : 500,
                    fontFamily: "var(--tk-font-sans)",
                    color: active ? "var(--tk-blue-600)" : "var(--tk-gray-400)",
                    borderBottom: active
                      ? "2.5px solid var(--tk-blue-600)"
                      : "2.5px solid transparent",
                    marginBottom: -2,
                    cursor: "pointer",
                    transition: "color .2s, border-color .2s",
                  }}
                >
                  {t === "login" ? "Masuk" : "Daftar Akun"}
                </button>
              );
            })}
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 13,
                color: "#B91C1C",
                fontFamily: "var(--tk-font-sans)",
              }}
            >
              {error}
            </div>
          )}

          {/* ════════ FORGOT PASSWORD ════════ */}
          {forgotMode && (
            <div>
              {forgotSent ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                  <h2 style={{ fontFamily: "var(--tk-font-display)", fontSize: 20, fontWeight: 700, color: "var(--tk-ink)", marginBottom: 8 }}>
                    Email Terkirim!
                  </h2>
                  <p style={{ fontSize: 14, color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-sans)", marginBottom: 24 }}>
                    Link reset kata sandi telah dikirim ke <strong>{email}</strong>. Periksa inbox atau folder spam kamu.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setForgotSent(false); }}
                    style={{
                      background: "var(--tk-blue-600)", color: "#fff", border: "none",
                      borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600,
                      fontFamily: "var(--tk-font-sans)", cursor: "pointer",
                    }}
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <h2 style={{ fontFamily: "var(--tk-font-display)", fontSize: 22, fontWeight: 700, color: "var(--tk-ink)", marginBottom: 6 }}>
                    Reset Kata Sandi
                  </h2>
                  <p style={{ fontSize: 14, color: "var(--tk-gray-500)", marginBottom: 24, fontFamily: "var(--tk-font-sans)" }}>
                    Masukkan email yang terdaftar. Kami akan kirimkan link untuk mereset kata sandi.
                  </p>
                  {error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#B91C1C", fontFamily: "var(--tk-font-sans)" }}>
                      {error}
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}>
                    <div style={inputWrapStyle}>
                      <Mail size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                      <input
                        type="email"
                        placeholder="Alamat email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%", background: isLoading ? "var(--tk-gray-200)" : "var(--tk-blue-600)",
                      color: isLoading ? "var(--tk-gray-400)" : "#fff", border: "none",
                      borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 600,
                      fontFamily: "var(--tk-font-sans)", cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    Kirim Link Reset →
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setError(""); }}
                    style={{
                      width: "100%", background: "none", border: "1.5px solid var(--tk-gray-200)",
                      borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 500,
                      fontFamily: "var(--tk-font-sans)", cursor: "pointer", color: "var(--tk-gray-600)",
                    }}
                  >
                    Kembali ke Login
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ════════ LOGIN TAB ════════ */}
          {!forgotMode && tab === "login" && (
            <form onSubmit={handleSignIn}>
              <h2
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--tk-ink)",
                  marginBottom: 6,
                }}
              >
                Selamat datang kembali! 👋
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--tk-gray-500)",
                  marginBottom: 28,
                  fontFamily: "var(--tk-font-sans)",
                }}
              >
                Masuk ke akun Talentika-mu dan lanjutkan perjalananmu.
              </p>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <div style={inputWrapStyle}>
                  <Mail size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    type="email"
                    placeholder="Alamat email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 8 }}>
                <div style={inputWrapStyle}>
                  <Lock size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "var(--tk-gray-400)",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* H-02: Forgot password — triggers real reset flow */}
              <div style={{ textAlign: "right", marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setForgotSent(false); setError(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: "var(--tk-blue-600)",
                    cursor: "pointer",
                    fontFamily: "var(--tk-font-sans)",
                    padding: 0,
                  }}
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: isLoading ? "var(--tk-gray-200)" : "var(--tk-blue-600)",
                  color: isLoading ? "var(--tk-gray-400)" : "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "var(--tk-font-sans)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background .2s",
                  marginBottom: 20,
                }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                Masuk →
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--tk-gray-400)",
                    fontFamily: "var(--tk-font-sans)",
                    whiteSpace: "nowrap",
                  }}
                >
                  atau masuk dengan
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
              </div>

              {/* OAuth buttons */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    border: "1.5px solid var(--tk-gray-200)",
                    borderRadius: 12,
                    padding: "11px 0",
                    background: "#fff",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 14,
                    fontFamily: "var(--tk-font-sans)",
                    color: "var(--tk-ink)",
                    fontWeight: 500,
                  }}
                >
                  {/* Official Google logo */}
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>

                {/* Apple */}
                <button
                  type="button"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    border: "1.5px solid var(--tk-gray-200)",
                    borderRadius: 12,
                    padding: "11px 0",
                    background: "#fff",
                    cursor: "not-allowed",
                    opacity: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 14,
                    fontFamily: "var(--tk-font-sans)",
                    color: "var(--tk-ink)",
                    fontWeight: 500,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <circle cx="9" cy="9" r="9" fill="#1a1a1a" />
                    <text
                      x="9"
                      y="13.5"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#fff"
                      fontFamily="sans-serif"
                    >

                    </text>
                  </svg>
                  Apple
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    border: "1.5px solid var(--tk-gray-200)",
                    borderRadius: 12,
                    padding: "11px 0",
                    background: "#fff",
                    cursor: "not-allowed",
                    opacity: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 14,
                    fontFamily: "var(--tk-font-sans)",
                    color: "var(--tk-ink)",
                    fontWeight: 500,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <circle cx="9" cy="9" r="9" fill="#1877F2" />
                    <text
                      x="9"
                      y="13.5"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#fff"
                      fontFamily="sans-serif"
                    >
                      f
                    </text>
                  </svg>
                  Facebook
                </button>
              </div>

              {/* Switch to register */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--tk-gray-500)",
                  fontFamily: "var(--tk-font-sans)",
                  marginBottom: 14,
                }}
              >
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--tk-blue-600)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    padding: 0,
                    fontFamily: "var(--tk-font-sans)",
                  }}
                >
                  Daftar sekarang
                </button>
              </p>

              {/* Legal */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  color: "var(--tk-gray-400)",
                  fontSize: 11,
                  fontFamily: "var(--tk-font-sans)",
                }}
              >
                <Shield size={12} />
                <span>Data kamu aman. Kami tidak pernah menjual informasi pribadi.</span>
              </div>
            </form>
          )}

          {/* ════════ REGISTER TAB ════════ */}
          {!forgotMode && tab === "register" && (
            <form onSubmit={handleSignUp}>
              <h2
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--tk-ink)",
                  marginBottom: 6,
                }}
              >
                Bergabung sekarang ✨
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--tk-gray-500)",
                  marginBottom: 20,
                  fontFamily: "var(--tk-font-sans)",
                }}
              >
                Buat akun gratis dan mulai eksplorasi potensimu bersama Talentika.
              </p>

              {/* ── Google sign-up ── */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                style={{
                  width: "100%",
                  border: "1.5px solid var(--tk-gray-200)",
                  borderRadius: 12,
                  padding: "12px 0",
                  background: "#fff",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 14.5,
                  fontFamily: "var(--tk-font-sans)",
                  color: "var(--tk-ink)",
                  fontWeight: 600,
                  marginBottom: 16,
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-blue-600)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--tk-gray-200)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Official Google logo SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Daftar dengan Google
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
                <span style={{ fontSize: 12, color: "var(--tk-gray-400)", fontFamily: "var(--tk-font-sans)", whiteSpace: "nowrap" }}>
                  atau daftar dengan email
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--tk-gray-200)" }} />
              </div>

              {/* Full name */}
              <div style={{ marginBottom: 14 }}>
                <div style={inputWrapStyle}>
                  <User size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <div style={inputWrapStyle}>
                  <Mail size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    type="email"
                    placeholder="Alamat email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <div style={inputWrapStyle}>
                  <Lock size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Kata sandi (min. 6 karakter)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "var(--tk-gray-400)",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Account type */}
              <div style={{ marginBottom: 14 }}>
                <div style={selectStyle}>
                  <User size={16} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    style={nativeSelectStyle}
                  >
                    <option value="individual">Individual</option>
                    <option value="school">Sekolah / Institusi</option>
                    <option value="organization">Organisasi</option>
                  </select>
                </div>
              </div>

              {/* Conditional org fields */}
              {accountType === "school" && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div style={inputWrapStyle}>
                      <input
                        type="text"
                        placeholder="Nama sekolah / institusi"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={selectStyle}>
                      <select
                        value={organizationType}
                        onChange={(e) => setOrganizationType(e.target.value)}
                        style={nativeSelectStyle}
                      >
                        <option value="">Pilih jenis institusi</option>
                        <option value="school">Sekolah</option>
                        <option value="institution">Institusi</option>
                        <option value="company">Perusahaan</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Referral code */}
              <div style={{ marginBottom: 22 }}>
                <div style={inputWrapStyle}>
                  <input
                    type="text"
                    placeholder="Kode referral (opsional, contoh: TLK-ABC123)"
                    defaultValue={sessionStorage.getItem("referral_code") || ""}
                    onChange={(e) => {
                      const v = e.target.value.trim().toUpperCase();
                      if (v) sessionStorage.setItem("referral_code", v);
                      else sessionStorage.removeItem("referral_code");
                    }}
                    style={{ ...inputStyle, fontFamily: "monospace", textTransform: "uppercase" }}
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: isLoading ? "var(--tk-gray-200)" : "var(--tk-blue-600)",
                  color: isLoading ? "var(--tk-gray-400)" : "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 0",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "var(--tk-font-sans)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background .2s",
                  marginBottom: 20,
                }}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                Daftar Akun →
              </button>

              {/* Switch to login */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "var(--tk-gray-500)",
                  fontFamily: "var(--tk-font-sans)",
                }}
              >
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--tk-blue-600)",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    padding: 0,
                    fontFamily: "var(--tk-font-sans)",
                  }}
                >
                  Masuk
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
