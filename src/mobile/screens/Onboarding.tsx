import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authRedirect, db, errMsg, oauthSignIn, useApp } from "../store";
import { BackBtn, Btn, Input, Label, Loading, Radio, Segmented, Sheet } from "../ui";
import { C, F, SH } from "../theme";
import { JENJANG_OPTS } from "../logic";
import { homeFor } from "../MobileApp";
import heroBrand from "../assets/hero-brand.webp";
import heroStudents from "../assets/hero-students.webp";
import authIndividual from "../assets/auth-individual.webp";
import authSchool from "../assets/auth-school.webp";

type S = "splash" | "welcome" | "signup" | "start" | "role" | "education" | "consent";

export default function Onboarding({ screen }: { screen: S }) {
  switch (screen) {
    case "splash": return <Splash />;
    case "welcome": return <Welcome />;
    case "signup": return <SignUp />;
    case "start": return <Start />;
    case "role": return <RolePick />;
    case "education": return <Education />;
    case "consent": return <Consent />;
  }
}

const wrap: React.CSSProperties = { position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 24px calc(env(safe-area-inset-bottom, 0px) + 36px)", overflow: "auto" };

function Logo({ light, size = 24 }: { light?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        <span style={{ fontFamily: F.display, fontSize: size, fontWeight: 700, color: light ? "#fff" : C.blue, letterSpacing: "-.5px", lineHeight: 1 }}>Talentika</span>
        <span style={{ color: C.yellow, fontSize: size / 2 }}>✦</span>
      </div>
      <div style={{ fontFamily: F.display, fontSize: size * 0.46, fontWeight: 600 }}>
        <span style={{ color: light ? "#A9C5FF" : C.blue }}>Discover.</span>{" "}
        <span style={{ color: light ? "#FFB27A" : C.orange }}>Develop.</span>{" "}
        <span style={{ color: light ? C.yellow : "#E0A800" }}>Grow.</span>
      </div>
    </div>
  );
}

/* 01 SPLASH */
function Splash() {
  const nav = useNavigate();
  const { user, profile, authReady, t } = useApp();
  if (authReady && user && profile) return <Navigate to={homeFor(profile)} replace />;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.blue, display: "flex", flexDirection: "column", padding: "0 28px calc(env(safe-area-inset-bottom, 0px) + 44px)", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
      <div style={{ position: "absolute", bottom: 180, left: -70, width: 190, height: 190, borderRadius: "50%", background: "rgba(255,193,7,.2)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, position: "relative", animation: "tkFadeUp .6s ease both" }}>
        <img src={heroBrand} alt={t("Pelajar Talentika", "Talentika students")} style={{ width: "100%", aspectRatio: "573/284", objectFit: "cover", borderRadius: 24, display: "block", boxShadow: "0 14px 34px rgba(4,16,48,.3)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 3 }}>
            <span style={{ fontSize: 42, fontWeight: 700, fontFamily: F.display, color: "#fff", letterSpacing: "-.8px", lineHeight: 1 }}>Talentika</span>
            <span style={{ color: C.yellow, fontSize: 20, lineHeight: 1 }}>✦</span>
          </div>
          <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600 }}><span style={{ color: "#A9C5FF" }}>Discover.</span> <span style={{ color: "#FFB27A" }}>Develop.</span> <span style={{ color: C.yellow }}>Grow.</span></div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>
          {t("Temukan potensimu.", "Find your potential.")}<br /><span style={{ color: C.yellow }}>{t("Bangun masa depanmu.", "Build your future.")}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        <button onClick={() => nav("/app/welcome")} style={{ height: 54, border: "none", borderRadius: 16, background: C.orange, color: "#fff", fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px rgba(255,106,0,.4)" }}>{t("Mulai", "Get Started")}</button>
        <button onClick={() => nav("/app/signup?mode=login")} style={{ height: 54, border: "1.5px solid rgba(255,255,255,.35)", borderRadius: 16, background: "rgba(255,255,255,.08)", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{t("Sudah punya akun? Masuk", "Already have an account? Sign in")}</button>
      </div>
    </div>
  );
}

/* 02 WELCOME */
function Welcome() {
  const nav = useNavigate();
  const { t } = useApp();
  const items = [
    { t: "Discover", d: t("Pahami minat, kekuatan & potensimu.", "Understand your interests, strengths & potential."), bg: C.tintBlue, stroke: C.blue, icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.3" fill={C.blue} /></> },
    { t: "Develop", d: t("Bangun skill lewat belajar yang personal.", "Build skills through personalized learning."), bg: C.tintOrange, stroke: C.orange, icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /> },
    { t: "Unlock", d: t("Temukan peluang yang cocok untukmu.", "Find opportunities matched to you."), bg: C.tintGreen, stroke: C.green, icon: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M17 6l3 3M14 9l2 2" /></> },
  ];
  return (
    <div style={wrap}>
      <Logo />
      <img src={heroStudents} alt={t("Pelajar belajar bersama", "Students learning together")} style={{ marginTop: 20, width: "100%", aspectRatio: "610/285", objectFit: "cover", borderRadius: 22, display: "block" }} />
      <h1 style={{ margin: "20px 0 0", fontSize: 28, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.6px", lineHeight: 1.22, animation: "tkFadeUp .4s ease both" }}>
        {t("Masa depanmu dimulai dari mengenal dirimu.", "Your future starts with knowing yourself.")}
      </h1>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <div key={it.t} style={{ display: "flex", gap: 14, alignItems: "center", background: "#fff", borderRadius: 20, padding: 18, boxShadow: SH.card, animation: `tkPop .35s ${i * 0.08}s ease both` }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: it.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={it.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{it.icon}</svg>
            </div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800 }}>{it.t}</div><div style={{ marginTop: 3, fontSize: 13, color: C.muted, lineHeight: 1.45 }}>{it.d}</div></div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 20 }} />
      <Btn h={54} onClick={() => nav("/app/signup")} style={{ boxShadow: SH.primary, fontSize: 16 }}>{t("Mulai Perjalananku", "Start My Journey")}</Btn>
    </div>
  );
}

/* 03 SIGN UP / SIGN IN (AUTH-01) */
function SignUp() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const login = params.get("mode") === "login";
  const { t, toast, user, profile } = useApp();
  const [sheet, setSheet] = useState<null | "email" | "phone">(null);
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [isLogin, setIsLogin] = useState(login);
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const redirect = authRedirect();

  if (user && profile) return <Navigate to="/app/start" replace />;

  const oauth = async (provider: "google" | "apple") => {
    const { error } = await oauthSignIn(provider);
    if (error) toast(provider === "apple" ? t("Masuk dengan Apple belum diaktifkan. Pakai Google atau email dulu.", "Sign in with Apple isn't enabled yet. Use Google or email.") : errMsg(error), "error");
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || pass.length < 8) { toast(t("Email valid & kata sandi minimal 8 karakter", "Valid email & password of 8+ characters"), "error"); return; }
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        nav("/app/start", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: redirect } });
        if (error) throw error;
        if (data.session) nav("/app/start", { replace: true });
        else setInfo(t("Cek emailmu untuk verifikasi, lalu kembali ke aplikasi.", "Check your email to verify, then come back to the app."));
      }
    } catch (err) { toast(errMsg(err), "error"); }
    setBusy(false);
  };

  const normPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("0") ? "+62" + d.slice(1) : d.startsWith("62") ? "+" + d : "+62" + d; };
  const sendOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normPhone(phone) });
    setBusy(false);
    if (error) { toast(t("Login nomor HP belum tersedia. Pakai Google atau email dulu.", "Phone sign-in isn't available yet. Use Google or email."), "error"); return; }
    setOtpSent(true);
  };
  const verify = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone: normPhone(phone), token: otp.trim(), type: "sms" });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    nav("/app/start", { replace: true });
  };

  const big: React.CSSProperties = { height: 54, borderRadius: 16, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" };
  return (
    <div style={wrap}>
      <BackBtn />
      <h1 style={{ margin: "26px 0 0", fontSize: 26, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px" }}>{login ? t("Masuk ke Talentika", "Sign in to Talentika") : t("Buat akun Talentika", "Create your Talentika account")}</h1>
      <p style={{ margin: "8px 0 0", fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>{t("Satu profil untuk seluruh perjalananmu — gratis.", "One profile for your whole journey — free.")}</p>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 11 }}>
        <button onClick={() => oauth("google")} style={{ ...big, border: `1.5px solid ${C.line}`, background: "#fff", color: C.text }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.6z" /><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" /><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" /><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-4.9 6.8-4.9z" /></svg>
          {t("Lanjut dengan Google", "Continue with Google")}
        </button>
        <button onClick={() => oauth("apple")} style={{ ...big, border: "none", background: C.navy, color: "#fff" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8zM14.1 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" /></svg>
          {t("Lanjut dengan Apple", "Continue with Apple")}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.faint, fontSize: 12.5, margin: "4px 0" }}><div style={{ flex: 1, height: 1, background: C.line }} />{t("atau", "or")}<div style={{ flex: 1, height: 1, background: C.line }} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => setSheet("email")} style={{ ...big, height: 52, border: `1.5px solid ${C.line}`, background: "#fff", color: C.text, fontSize: 14 }}>✉️ Email</button>
          <button onClick={() => setSheet("phone")} style={{ ...big, height: 52, border: `1.5px solid ${C.line}`, background: "#fff", color: C.text, fontSize: 14 }}>📱 {t("Nomor HP", "Phone number")}</button>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
        {t("Dengan melanjutkan, kamu setuju dengan ", "By continuing, you agree to Talentika's ")}
        <a href="/tentang-kami" style={{ color: C.blue }}>{t("Syarat & Kebijakan Privasi", "Terms & Privacy Policy")}</a>{t(" Talentika.", ".")}
      </p>

      <Sheet open={sheet === "email"} onClose={() => { setSheet(null); setInfo(null); }} title={isLogin ? t("Masuk dengan email", "Sign in with email") : t("Daftar dengan email", "Sign up with email")}>
        {info ? <div style={{ fontSize: 14, lineHeight: 1.6, color: C.text3 }}>📬 {info}</div> : (
          <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input type="email" autoComplete="email" placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder={t("Kata sandi (min. 8 karakter)", "Password (min. 8 characters)")} value={pass} onChange={e => setPass(e.target.value)} />
            <Btn type="submit" disabled={busy}>{busy ? "…" : isLogin ? t("Masuk", "Sign in") : t("Daftar", "Sign up")}</Btn>
            <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ border: "none", background: "none", color: C.blue, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {isLogin ? t("Belum punya akun? Daftar", "No account yet? Sign up") : t("Sudah punya akun? Masuk", "Have an account? Sign in")}
            </button>
            {isLogin && <button type="button" onClick={async () => {
              if (!email.includes("@")) { toast(t("Isi email dulu", "Enter your email first"), "error"); return; }
              await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
              toast(t("Link reset kata sandi dikirim ke email", "Password reset link sent"));
            }} style={{ border: "none", background: "none", color: C.muted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>{t("Lupa kata sandi?", "Forgot password?")}</button>}
          </form>
        )}
      </Sheet>
      <Sheet open={sheet === "phone"} onClose={() => setSheet(null)} title={t("Masuk dengan nomor HP", "Sign in with phone")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input type="tel" inputMode="tel" placeholder="08xx xxxx xxxx" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
          {otpSent && <Input inputMode="numeric" autoComplete="one-time-code" placeholder={t("Kode OTP 6 digit", "6-digit OTP")} value={otp} onChange={e => setOtp(e.target.value)} />}
          <Btn disabled={busy || phone.replace(/\D/g, "").length < 9} onClick={otpSent ? verify : sendOtp}>{otpSent ? t("Verifikasi", "Verify") : t("Kirim kode OTP", "Send OTP")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/* Setelah login: arahkan ke onboarding atau beranda sesuai peran */
function Start() {
  const { profile, user } = useApp();
  const nav = useNavigate();
  useEffect(() => {
    if (!profile || !user) return;
    (async () => {
      const { data: m } = await db.rpc("statistik_mentor_saya");
      nav(homeFor(profile, !!m), { replace: true });
    })();
  }, [profile, user, nav]);
  return <Loading />;
}

/* 04 USER TYPE (AUTH-02) */
function RolePick() {
  const nav = useNavigate();
  const { t, profile, toast, refreshProfile, track } = useApp();
  const [role, setRole] = useState<"student" | "parent" | "mentor" | "school">("student");
  const [schoolSheet, setSchoolSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  // Pengguna lama dari web (sudah punya tes, belajar, atau akun > 1 hari) tidak
  // perlu memilih peran lagi — perannya sudah "student" — langsung lengkapi profil.
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const lama = Date.now() - new Date((profile as any).created_at ?? Date.now()).getTime() > 86400000;
      const [{ count: tes }, { count: belajar }] = await Promise.all([
        db.from("assessment_results").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
        db.from("learning_progress").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
      ]);
      if (profile.role === "student" && (lama || (tes ?? 0) > 0 || (belajar ?? 0) > 0 || profile.jenjang || profile.tujuan)) {
        nav("/app/profile-setup?returning=1", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [profile?.user_id]); // eslint-disable-line
  const roles = [
    { id: "student" as const, label: t("Pelajar", "Student"), desc: t("Temukan potensi, belajar, dan raih peluang", "Discover your potential, learn and seize opportunities"), icon: "🎓", bg: C.tintBlue, img: authIndividual },
    { id: "parent" as const, label: t("Orang tua", "Parent"), desc: t("Pahami potensi & dukung perkembangan anak", "Understand and support your child's growth"), icon: "👨‍👩‍👧", bg: C.tintOrange },
    { id: "mentor" as const, label: "Mentor", desc: t("Bimbing pelajar dari pengalaman industrimu", "Guide students with your industry experience"), icon: "🧭", bg: C.tintGreen },
    { id: "school" as const, label: t("Sekolah / Guru BK", "School / Counselor"), desc: t("Talent map, partisipasi & readiness siswa", "Talent map, participation & student readiness"), icon: "🏫", bg: C.tintPurple, img: authSchool },
  ];
  const next = async () => {
    if (role === "school") {
      if (profile?.role === "school_admin") { nav("/app/school", { replace: true }); return; }
      setSchoolSheet(true); return;
    }
    setBusy(true);
    try {
      if (role === "parent") {
        const { error } = await db.rpc("pilih_peran_awal", { p_role: "parent" });
        if (error) throw error;
        await db.from("profiles").update({ onboarding_done: true }).eq("user_id", profile!.user_id);
        await refreshProfile();
        track("onboarding_completed", { role: "parent", education_level: null, signup_method: null });
        nav("/app/parent", { replace: true });
      } else if (role === "mentor") {
        await db.from("profiles").update({ onboarding_done: true, app_prefs: { ...(profile?.app_prefs || {}), mode: "mentor" } }).eq("user_id", profile!.user_id);
        await refreshProfile();
        track("onboarding_completed", { role: "mentor", education_level: null, signup_method: null });
        nav("/app/mentor-dashboard", { replace: true });
      } else {
        const { error } = await db.rpc("pilih_peran_awal", { p_role: "student" });
        if (error) throw error;
        nav("/app/profile-setup");
      }
    } catch (e) { toast(errMsg(e), "error"); }
    setBusy(false);
  };
  if (checking) return <Loading />;
  return (
    <div style={wrap}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px" }}>{t("Kamu bergabung sebagai?", "You're joining as?")}</h1>
      <p style={{ margin: "8px 0 0", fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>{t("Pengalaman Talentika menyesuaikan peranmu.", "Talentika adapts to your role.")}</p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {roles.map(r => {
          const on = role === r.id;
          return (
            <button key={r.id} onClick={() => setRole(r.id)} style={{ textAlign: "left", display: "flex", gap: 15, alignItems: "center", padding: 18, border: `2px solid ${on ? C.blue : C.track}`, borderRadius: 20, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flex: "none", overflow: "hidden", position: "relative" }}>
                {r.icon}{r.img && <img src={r.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: C.text }}>{r.label}</div><div style={{ marginTop: 3, fontSize: 13, color: C.muted, lineHeight: 1.4 }}>{r.desc}</div></div>
              <Radio on={on} />
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 20 }} />
      <Btn h={54} disabled={busy} onClick={next} style={{ boxShadow: SH.primary, fontSize: 16 }}>{t("Lanjut", "Continue")}</Btn>
      <Sheet open={schoolSheet} onClose={() => setSchoolSheet(false)} title={t("Akun sekolah", "School account")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>
          {t("Dashboard Guru BK di aplikasi bersifat baca-saja dan memakai akun sekolah yang sudah terverifikasi. Pendaftaran sekolah & konsol lengkap ada di web.",
             "The counselor dashboard in the app is read-only and uses a verified school account. School registration and the full console are on the web.")}
        </p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={() => { window.location.href = "/for-schools"; }}>{t("Daftarkan sekolah di web", "Register your school on the web")}</Btn>
          <Btn kind="outline" onClick={() => { setSchoolSheet(false); setRole("student"); }}>{t("Saya pelajar", "I'm a student")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/* 05 EDUCATION & PROFILE (AUTH-03) */
function Education() {
  const nav = useNavigate();
  const returning = new URLSearchParams(window.location.search).get("returning") === "1";
  const { t, profile, toast, refreshProfile, track } = useApp();
  const [edu, setEdu] = useState<string>(() => profile?.jenjang ?? "sma_smk");
  const [name, setName] = useState(profile?.full_name ?? "");
  const [usia, setUsia] = useState(profile?.usia ? String(profile.usia) : "");
  const [kelas, setKelas] = useState(profile?.kelas ?? "");
  const [school, setSchool] = useState(profile?.school_name ?? "");
  const [lokasi, setLokasi] = useState(profile?.lokasi ?? "");
  const [lang, setLang] = useState<"id" | "en">(profile?.language_preference === "en" ? "en" : "id");
  const [busy, setBusy] = useState(false);
  const opts = JENJANG_OPTS;
  const save = async () => {
    const age = parseInt(usia, 10);
    if (name.trim().length < 2) { toast(t("Isi namamu dulu", "Please enter your name"), "error"); return; }
    if (!(age >= 8 && age <= 90)) { toast(t("Usia belum valid", "Age isn't valid"), "error"); return; }
    setBusy(true);
    const jenjang = edu === "smk" ? "sma_smk" : edu;
    const { error } = await db.from("profiles").update({
      full_name: name.trim(), usia: age, kelas: kelas.trim() || null, school_name: school.trim() || null, lokasi: lokasi.trim() || null,
      jenjang, language_preference: lang, onboarding_done: true,
    }).eq("user_id", profile!.user_id);
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    localStorage.setItem("tk-lang", lang);
    await refreshProfile();
    track("onboarding_completed", { role: "student", education_level: edu, signup_method: null });
    nav(age < 18 ? "/app/consent" : "/app/dna", { replace: true });
  };
  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <BackBtn />
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.track }}><div style={{ width: "66%", height: "100%", borderRadius: 3, background: C.blue }} /></div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>2/3</span>
      </div>
      <h1 style={{ margin: "24px 0 0", fontSize: 24, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px" }}>{returning ? t("Selamat datang di aplikasi Talentika!", "Welcome to the Talentika app!") : t("Ceritain tentang kamu", "Tell us about you")}</h1>
      {returning && <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>{t("Akunmu dari talentika.id sudah tersambung — hasil tes, materi belajar, dan peluang tersimpanmu ikut terbawa. Lengkapi beberapa data ini dulu ya.", "Your talentika.id account is connected — your test results, courses and saved opportunities came along. Just complete these details.")}</p>}
      <div style={{ marginTop: 20 }}><Label>{t("Jenjang pendidikan", "Education level")}</Label></div>
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opts.map(o => {
          const on = edu === o.value;
          return <button key={o.value} onClick={() => setEdu(o.value)} style={{ height: 40, padding: "0 15px", border: `1.8px solid ${on ? C.blue : C.track}`, borderRadius: 99, background: on ? C.tintBlue : "#fff", color: on ? C.blueDark : C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t(o.labelId, o.label)}</button>;
        })}
      </div>
      <div style={{ marginTop: 20 }}><Label>{t("Profil dasar", "Basic profile")}</Label></div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        <Input placeholder={t("Nama · Dafa Pratama", "Name · Dafa Pratama")} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input inputMode="numeric" placeholder={t("Usia · 17", "Age · 17")} value={usia} onChange={e => setUsia(e.target.value.replace(/\D/g, "").slice(0, 2))} />
          <Input placeholder={t("Kelas · XII", "Grade · XII")} value={kelas} onChange={e => setKelas(e.target.value)} />
        </div>
        <Input placeholder={t("Sekolah · SMAN 1 Jakarta", "School · SMAN 1 Jakarta")} value={school} onChange={e => setSchool(e.target.value)} />
        <Input placeholder={t("Lokasi · Jakarta Selatan", "Location · South Jakarta")} value={lokasi} onChange={e => setLokasi(e.target.value)} />
      </div>
      <div style={{ marginTop: 20 }}><Label>{t("Bahasa", "Preferred language")}</Label></div>
      <div style={{ marginTop: 10 }}><Segmented value={lang} onChange={v => setLang(v as "id" | "en")} options={[{ value: "id", label: "Bahasa Indonesia" }, { value: "en", label: "English" }]} /></div>
      <div style={{ flex: 1, minHeight: 20 }} />
      <Btn h={54} disabled={busy} onClick={save} style={{ marginTop: 20, boxShadow: SH.primary, fontSize: 16 }}>{t("Lanjut ke Talent Discovery", "Continue to Talent Discovery")}</Btn>
    </div>
  );
}

/* 06 PARENT CONSENT (AUTH-04) — tidak memblokir eksplorasi, wajib untuk berbagi & bayar */
function Consent() {
  const nav = useNavigate();
  const { t, toast } = useApp();
  const [contact, setContact] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const invite = async () => {
    setBusy(true);
    const { data, error } = await db.rpc("undang_orang_tua", { p_contact: contact.trim() });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    setCode(data.invite_code);
  };
  const msg = code ? t(
    `Halo! Aku pakai Talentika untuk menemukan potensi & rencana karierku. Untuk usia di bawah 18 tahun, aku butuh persetujuanmu. Buka ${window.location.origin}/app, daftar sebagai Orang tua, lalu masukkan kode: ${code}`,
    `Hi! I'm using Talentika to discover my potential and plan my future. Since I'm under 18, I need your consent. Open ${window.location.origin}/app, sign up as Parent and enter code: ${code}`) : "";
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text: msg }); return; } catch { /* batal */ } }
    await navigator.clipboard?.writeText(msg);
    toast(t("Pesan undangan disalin", "Invitation copied"));
  };
  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <BackBtn />
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.track }}><div style={{ width: "100%", height: "100%", borderRadius: 3, background: C.blue }} /></div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>3/3</span>
      </div>
      <div style={{ marginTop: 24, fontSize: 40 }}>👨‍👩‍👧</div>
      <h1 style={{ margin: "10px 0 0", fontSize: 24, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.4px" }}>{t("Ajak orang tuamu", "Invite your parent")}</h1>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: C.muted, lineHeight: 1.55 }}>
        {t("Karena usiamu di bawah 18 tahun, kami butuh persetujuan orang tua sebelum data dibagikan atau ada pembayaran. Kamu tetap bisa mulai eksplorasi sekarang.",
           "Because you're under 18, we need parental consent before any sharing or payment. You can still start exploring now.")}
      </p>
      {!code ? (
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>{t("Email atau nomor HP orang tua", "Parent's email or phone")}</Label>
          <Input placeholder="ibu@email.com / 0812…" value={contact} onChange={e => setContact(e.target.value)} />
          <Btn disabled={busy || contact.trim().length < 5} onClick={invite}>{t("Buat undangan", "Create invitation")}</Btn>
        </div>
      ) : (
        <div style={{ marginTop: 20, background: "#fff", borderRadius: 20, padding: 18, boxShadow: SH.card, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{t("Kode undangan", "Invitation code")}</div>
          <div style={{ marginTop: 6, fontSize: 30, fontWeight: 700, fontFamily: F.display, letterSpacing: 4, color: C.blue }}>{code}</div>
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{t("Kirim kode ini ke orang tuamu. Persetujuan tercatat otomatis saat mereka memasukkannya.", "Send this code to your parent. Consent is recorded when they enter it.")}</p>
          <Btn kind="soft" h={46} onClick={share} style={{ marginTop: 12 }}>{t("Bagikan undangan", "Share invitation")}</Btn>
        </div>
      )}
      <div style={{ flex: 1, minHeight: 20 }} />
      <Btn h={54} onClick={() => nav("/app/dna", { replace: true })} style={{ boxShadow: SH.primary, fontSize: 16 }}>{t("Lanjut ke Talent Discovery", "Continue to Talent Discovery")}</Btn>
      {!code && <Btn kind="ghost" h={44} onClick={() => nav("/app/dna", { replace: true })} style={{ marginTop: 6 }}>{t("Nanti saja", "Later")}</Btn>}
    </div>
  );
}
