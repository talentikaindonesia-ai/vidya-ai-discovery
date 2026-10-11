import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { authRedirect, db, errMsg, oauthSignIn, useApp, useCareers } from "../store";
import { BackBtn, Btn, Icon, Input, Loading, LOGO, Segmented, Sheet, TIKA } from "../ui";
import { C, SH } from "../theme";
import { INTEREST_TILES, JENJANG_OPTS } from "../logic";
import { editionOf, homeFor } from "../MobileApp";
import welcomeHero from "../assets/v3/welcome-hero.webp";
import intro1 from "../assets/v3/intro-1.webp";
import intro2 from "../assets/v3/intro-2.webp";
import intro3 from "../assets/v3/intro-3.webp";
import intro4 from "../assets/v3/intro-4.webp";

type S = "splash" | "welcome" | "signup" | "start" | "role" | "education" | "gtk" | "consent";

export default function Onboarding({ screen }: { screen: S }) {
  switch (screen) {
    case "splash": return <Welcome />;
    case "welcome": return <Intro />;
    case "signup": return <SignUp />;
    case "start": return <Start />;
    case "role": return <StagePick />;
    case "education": return <Education />;
    case "gtk": return <GetToKnow />;
    case "consent": return <Consent />;
  }
}

const SAFE_T = "calc(env(safe-area-inset-top, 0px) + 18px)";
const SAFE_B = "calc(env(safe-area-inset-bottom, 0px) + 26px)";
const fade = (top: number, bottom: number) => `linear-gradient(180deg,transparent 0,#000 ${top}%,#000 ${bottom}%,transparent 100%)`;

function Brand({ size = 46, onSkip, skipLabel }: { size?: number; onSkip?: () => void; skipLabel?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <img src={LOGO} alt="Talentika" style={{ width: size, height: size, borderRadius: 13, boxShadow: "0 4px 12px rgba(15,23,42,.1)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: size > 44 ? 20 : 19, fontWeight: 700, letterSpacing: "-.3px", lineHeight: 1 }}>Talentika</div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Discover your full potential</div>
      </div>
      {onSkip && <button onClick={onSkip} style={{ border: "none", background: "none", fontSize: 15, fontWeight: 600, color: "#5B6B9A", cursor: "pointer" }}>{skipLabel}</button>}
    </div>
  );
}

/** Dua garis kuning dekoratif di pojok judul (prototype v3). */
function Sparks({ right = 40, top = -30 }: { right?: number; top?: number }) {
  return (
    <>
      <span style={{ position: "absolute", right, top, width: 6, height: 28, borderRadius: 3, background: "#FFC93C", transform: "rotate(22deg)" }} />
      <span style={{ position: "absolute", right: right - 26, top: top + 18, width: 6, height: 26, borderRadius: 3, background: "#FFC93C", transform: "rotate(58deg)" }} />
    </>
  );
}

function PrimaryCta({ children, onClick, disabled, round }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; round?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", height: 58, border: "none", borderRadius: round ? 99 : 18, background: disabled ? C.disabled : C.blue, color: "#fff",
      fontSize: round ? 17 : 16, fontWeight: round ? 700 : 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: disabled ? "none" : "0 12px 26px rgba(0,102,255,.32)", flex: "none" }}>
      {children} <Icon name="right" size={19} />
    </button>
  );
}

/* ── 01 WELCOME ─────────────────────────────────────────────────────── */
function Welcome() {
  const nav = useNavigate();
  const { user, profile, authReady, t } = useApp();
  if (authReady && user && profile) return <Navigate to={homeFor(profile)} replace />;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "linear-gradient(180deg,#FFFFFF 0%,#F3F8FF 60%,#EAF3FF 100%)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: `${SAFE_T} 24px 0` }}><Brand onSkip={() => nav("/app/welcome")} skipLabel={t("Lewati", "Skip")} /></div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "12px 24px 0" }}>
        <div style={{ position: "relative", animation: "tkIn .4s ease both" }}>
          <Sparks />
          <div style={{ fontSize: 35, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1px", color: "#0B1B4D" }}>
            {t("Lebih Banyak Talenta,", "More People,")}<br /><span style={{ color: C.blue }}>{t("Masa Depan Cerah.", "Brighter Futures.")}</span>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#5B6B85" }}>
            {t("Platform belajar dan peluang yang personal untuk membantumu menemukan, mengembangkan, dan meraih potensi terbaikmu.",
               "A personalized learning and opportunity platform to help you discover, develop, and achieve your full potential.")}
          </p>
        </div>
      </div>
      <div style={{ position: "relative", flex: "none", marginTop: 14 }}>
        <img src={welcomeHero} alt={t("Pelajar dengan label Talenta, Belajar dan Peluang", "Students with Talent, Learning and Opportunity labels")}
          style={{ display: "block", width: "100%", height: "auto", maxHeight: "44dvh", objectFit: "contain", objectPosition: "center bottom", WebkitMaskImage: fade(6, 86), maskImage: fade(6, 86) }} />
      </div>
      <div style={{ padding: `0 22px ${SAFE_B}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <PrimaryCta round onClick={() => nav("/app/welcome")}>{t("Mulai Sekarang", "Get Started")}</PrimaryCta>
        <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map(i => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i === 0 ? C.blue : "#D6E6FB" }} />)}</div>
        <div style={{ fontSize: 12.5, color: C.muted }}>
          {t("Sudah punya akun? ", "Already have an account? ")}
          <button onClick={() => nav("/app/signup?mode=login")} style={{ border: "none", background: "none", padding: 0, color: C.blue, fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>{t("Masuk", "Sign In")}</button>
        </div>
      </div>
    </div>
  );
}

/* ── 02 INTRO TOUR (4 pilar) ────────────────────────────────────────── */
function Intro() {
  const nav = useNavigate();
  const { t } = useApp();
  const [i, setI] = useState(0);
  const slides = [
    { h1: t("Temukan", "Discover"), h2: t("Kekuatanmu", "Your Strengths"), d: t("Pahami minat, bakat, dan berbagai kemungkinan di depanmu.", "Understand your interests, talents, and the possibilities ahead."), img: intro1, alt: t("Kartu kekuatan dengan rekomendasi jalur karier", "Strengths card with recommended career paths") },
    { h1: t("Bangun Skill", "Build Skills"), h2: t("untuk Dampak Nyata", "for Real Impact"), d: t("Akses kursus seru, proyek langsung, dan pengalaman nyata yang dirancang untuk masa depan.", "Access engaging courses, hands-on projects, and real-world experiences designed for the future."), img: intro2, alt: t("Pelajar belajar dengan laptop", "Student learning on a laptop") },
    { h1: t("Tunjukkan", "Showcase"), h2: t("Prestasimu", "Your Achievements"), d: t("Bangun portofolio, pantau kemajuan, dan rayakan setiap pencapaianmu.", "Build your portfolio, track your progress, and celebrate your achievements."), img: intro3, alt: t("Kartu prestasi dan portofolio", "Achievements and portfolio card") },
    { h1: t("Jelajahi", "Explore"), h2: t("Peluang Nyata", "Real Opportunities"), d: t("Temukan beasiswa, kompetisi, magang, dan jalur karier dari seluruh dunia.", "Find scholarships, competitions, internships, and career pathways from around the world."), img: intro4, alt: t("Pelajar dengan bola dunia peluang", "Student with a globe of opportunities") },
  ];
  const sl = slides[i];
  const next = () => (i < 3 ? setI(i + 1) : nav("/app/signup"));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "linear-gradient(180deg,#FFFFFF 0%,#F3F8FF 55%,#EAF3FF 100%)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: `${SAFE_T} 24px 0` }}><Brand size={42} onSkip={() => nav("/app/signup")} skipLabel={t("Lewati", "Skip")} /></div>
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 7 }}>
        {slides.map((_, k) => <span key={k} style={{ width: k === i ? 24 : 9, height: 9, borderRadius: 99, background: k === i ? C.blue : "#C9DCF8", transition: "all .25s" }} />)}
      </div>
      <div key={i} style={{ padding: "14px 24px 0", position: "relative", animation: "tkIn .3s ease both" }}>
        <Sparks right={40} top={-14} />
        <div style={{ fontSize: 35, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1px", color: "#0B1B4D" }}>{sl.h1}<br /><span style={{ color: C.blue }}>{sl.h2}</span></div>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: C.text3 }}>{sl.d}</p>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 4 }}>
        <span role="img" aria-label={sl.alt} style={{ position: "absolute", inset: 0, backgroundImage: `url('${sl.img}')`, backgroundSize: "contain", backgroundPosition: "center top", backgroundRepeat: "no-repeat",
          WebkitMaskImage: fade(8, 92), maskImage: fade(8, 92) }} />
      </div>
      <div style={{ padding: `8px 24px ${SAFE_B}`, display: "flex", gap: 12, alignItems: "center" }}>
        {i > 0 && <button onClick={() => setI(i - 1)} aria-label={t("Sebelumnya", "Previous")} style={{ width: 58, height: 58, borderRadius: "50%", border: "none", background: "#E6F0FF", color: "#0B1B4D", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}><Icon name="left" size={22} /></button>}
        <div style={{ flex: 1 }}><PrimaryCta round onClick={next}>{i === 3 ? t("Mulai", "Get Started") : t("Lanjut", "Next")}</PrimaryCta></div>
      </div>
    </div>
  );
}

/* ── 03 CREATE ACCOUNT / SIGN IN ───────────────────────────────────── */
function SignUp() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, toast, user, profile } = useApp();
  const [isLogin, setIsLogin] = useState(params.get("mode") === "login");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [show, setShow] = useState(false);
  const [phoneSheet, setPhoneSheet] = useState(false);
  const [phone, setPhone] = useState(""); const [otp, setOtp] = useState(""); const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  if (user && profile) return <Navigate to="/app/start" replace />;

  const oauth = async (provider: "google" | "apple") => {
    const { error } = await oauthSignIn(provider);
    if (error) toast(provider === "apple" ? t("Masuk dengan Apple belum diaktifkan. Pakai Google atau email dulu.", "Sign in with Apple isn't enabled yet. Use Google or email.") : errMsg(error), "error");
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.includes("@") || pass.length < 8) { toast(t("Email valid & kata sandi minimal 8 karakter", "Valid email & password of 8+ characters"), "error"); return; }
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        nav("/app/start", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: authRedirect() } });
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

  const social: React.CSSProperties = { height: 52, borderRadius: 16, fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", width: "100%" };
  return (
    <form onSubmit={submit} style={{ position: "absolute", inset: 0, overflowY: "auto", background: "#fff", padding: `${SAFE_T} 24px ${SAFE_B}`, display: "flex", flexDirection: "column" }}>
      <BackBtn dark />
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.7px", marginTop: 22 }}>
        {isLogin ? <>{t("Masuk ke", "Sign in to")}<br /><span style={{ color: C.blue }}>Talentika</span></> : <>{t("Buat", "Create your")}<br /><span style={{ color: C.blue }}>{t("akunmu", "account")}</span></>}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, color: C.text3 }}>{t("Simpan kemajuan, profil talenta, dan peluangmu di satu tempat.", "Save your progress, talent profile and opportunities in one place.")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <button type="button" onClick={() => oauth("google")} style={{ ...social, border: `1.5px solid ${C.line}`, background: "#fff", color: C.text }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.6z" /><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" /><path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" /><path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-4.9 6.8-4.9z" /></svg>
          {t("Lanjut dengan Google", "Continue with Google")}
        </button>
        <button type="button" onClick={() => oauth("apple")} style={{ ...social, border: "none", background: C.navy, color: "#fff" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-.9-2.5-3.8zM14.1 5.8c.6-.8 1.1-1.8 1-2.8-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.7 1 .1 2-.5 2.7-1.3z" /></svg>
          {t("Lanjut dengan Apple", "Continue with Apple")}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", fontSize: 12, color: C.faint }}>
        <span style={{ flex: 1, height: 1, background: "#E6EDF7" }} />{t("atau dengan email", "or with email")}<span style={{ flex: 1, height: 1, background: "#E6EDF7" }} />
      </div>
      {info ? (
        <div style={{ background: C.tintBlue, borderRadius: 16, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.55, color: "#1E3A8A", display: "flex", gap: 10 }}>
          <span style={{ color: C.blue, display: "flex" }}><Icon name="mail" size={20} /></span>{info}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input icon="mail" type="email" autoComplete="email" placeholder={t("Alamat email", "Email address")} value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{ position: "relative" }}>
            <Input icon="lock" type={show ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} placeholder={t("Kata sandi (min. 8 karakter)", "Password (min. 8 characters)")} value={pass} onChange={e => setPass(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? t("Sembunyikan kata sandi", "Hide password") : t("Tampilkan kata sandi", "Show password")}
              style={{ position: "absolute", right: 14, top: 17, border: "none", background: "none", color: C.faint, cursor: "pointer", padding: 0, display: "flex" }}><Icon name="eye" size={18} /></button>
          </div>
          {isLogin && (
            <button type="button" onClick={async () => {
              if (!email.includes("@")) { toast(t("Isi email dulu", "Enter your email first"), "error"); return; }
              await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth` });
              toast(t("Link reset kata sandi dikirim ke email", "Password reset link sent"));
            }} style={{ alignSelf: "flex-end", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>{t("Lupa kata sandi?", "Forgot password?")}</button>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 16, background: C.tintBlue, borderRadius: 16, padding: "13px 14px" }}>
        <span style={{ color: C.blue, display: "flex", flex: "none" }}><Icon name="shield" size={20} /></span>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text2 }}>{t("Datamu tetap privat. Kamu yang menentukan apa yang bisa dilihat orang tua, sekolah, dan mentor.", "Your data stays private. You choose what parents, schools and mentors can see.")}</span>
      </div>
      <div style={{ flex: 1, minHeight: 20 }} />
      {!info && (
        <button type="submit" disabled={busy} style={{ height: 56, border: "none", borderRadius: 18, background: busy ? C.disabled : C.blue, color: "#fff", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: busy ? "none" : SH.primary, flex: "none" }}>
          {busy ? "…" : isLogin ? t("Masuk", "Sign In") : t("Buat Akun", "Create Account")} <Icon name="right" size={18} />
        </button>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 12, fontSize: 12.5 }}>
        <button type="button" onClick={() => { setIsLogin(!isLogin); setInfo(null); }} style={{ border: "none", background: "none", color: C.blue, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 12.5 }}>
          {isLogin ? t("Belum punya akun? Daftar", "No account yet? Sign up") : t("Sudah punya akun? Masuk", "Have an account? Sign in")}
        </button>
        <span style={{ color: C.disabled }}>·</span>
        <button type="button" onClick={() => setPhoneSheet(true)} style={{ border: "none", background: "none", color: C.muted, fontWeight: 500, cursor: "pointer", padding: 0, fontSize: 12.5 }}>{t("Pakai nomor HP", "Use phone number")}</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: C.faint, marginTop: 10 }}>
        {t("Dengan melanjutkan, kamu setuju dengan ", "By continuing you agree to the ")}<a href="/tentang-kami" style={{ color: C.blue }}>{t("Syarat & Kebijakan Privasi", "Terms & Privacy Policy")}</a>
      </div>

      <Sheet open={phoneSheet} onClose={() => setPhoneSheet(false)} title={t("Masuk dengan nomor HP", "Sign in with phone")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input icon="phone" type="tel" inputMode="tel" placeholder="08xx xxxx xxxx" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
          {otpSent && <Input icon="lock" inputMode="numeric" autoComplete="one-time-code" placeholder={t("Kode OTP 6 digit", "6-digit OTP")} value={otp} onChange={e => setOtp(e.target.value)} />}
          <Btn disabled={busy || phone.replace(/\D/g, "").length < 9} onClick={otpSent ? verify : sendOtp}>{otpSent ? t("Verifikasi", "Verify") : t("Kirim kode OTP", "Send OTP")}</Btn>
        </div>
      </Sheet>
    </form>
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

/* ── 04 CHOOSE STAGE (pelajar) + peran lain ─────────────────────────── */
type Ed = "explorer" | "pro";
function useEditions() {
  const { t } = useApp();
  return [
    { id: "explorer" as Ed, label: "Talentika Explorer", range: "SMP–SMA/SMK", verb: t("Bangun", "Build"), icon: "compass", c: C.blue,
      journey: [t("Temukan", "Discover"), t("Bangun Skill", "Build Skills"), t("Buat Proyek", "Create Projects"), t("Bangun Portofolio", "Build Portfolio")] },
    // Edisi kampus di desain bernama "Pro" — diganti agar tidak tertukar dengan paket berbayar Plus/Pro
    { id: "pro" as Ed, label: t("Talentika Kampus", "Talentika Campus"), range: t("Kuliah & awal karier", "University & early career"), verb: t("Luncurkan", "Launch"), icon: "rocket", c: C.purple,
      journey: [t("Tetapkan Tujuan", "Define Goals"), t("Kembangkan Keahlian", "Develop Expertise"), t("Buktikan Skill", "Prove Skills"), t("Raih Peluang", "Access Opportunities")] },
  ];
}

function StagePick() {
  const nav = useNavigate();
  const { t, profile, toast, refreshProfile, track } = useApp();
  const eds = useEditions();
  const [choice, setChoice] = useState<Ed | "parent" | "mentor" | "school">(() => editionOf(profile?.jenjang));
  const [schoolSheet, setSchoolSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  // Pengguna lama dari web (sudah tes/belajar, atau akun > 1 hari) tidak memilih peran lagi
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

  const next = async () => {
    if (choice === "school") {
      if (profile?.role === "school_admin") { nav("/app/school", { replace: true }); return; }
      setSchoolSheet(true); return;
    }
    setBusy(true);
    try {
      if (choice === "parent") {
        const { error } = await db.rpc("pilih_peran_awal", { p_role: "parent" });
        if (error) throw error;
        await db.from("profiles").update({ onboarding_done: true }).eq("user_id", profile!.user_id);
        await refreshProfile();
        track("onboarding_completed", { role: "parent", education_level: null, signup_method: null });
        nav("/app/parent", { replace: true });
      } else if (choice === "mentor") {
        await db.from("profiles").update({ onboarding_done: true, app_prefs: { ...(profile?.app_prefs || {}), mode: "mentor" } }).eq("user_id", profile!.user_id);
        await refreshProfile();
        track("onboarding_completed", { role: "mentor", education_level: null, signup_method: null });
        nav("/app/mentor-dashboard", { replace: true });
      } else {
        const { error } = await db.rpc("pilih_peran_awal", { p_role: "student" });
        if (error) throw error;
        nav(`/app/profile-setup?ed=${choice}`);
      }
    } catch (e) { toast(errMsg(e), "error"); }
    setBusy(false);
  };
  if (checking) return <Loading />;
  const others = [
    { id: "parent" as const, label: t("Orang tua", "Parent"), icon: "users", c: C.orange, bg: C.tintOrange },
    { id: "mentor" as const, label: "Mentor", icon: "cap", c: C.green, bg: C.tintGreen },
    { id: "school" as const, label: t("Sekolah / Guru BK", "School / Counselor"), icon: "school", c: C.sky, bg: C.tintSky },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: C.bg, padding: `${SAFE_T} 22px ${SAFE_B}`, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.6px", marginTop: 6 }}>{t("Kamu sekarang", "Which stage")}<br /><span style={{ color: C.blue }}>{t("di tahap mana?", "are you in?")}</span></div>
      <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: C.text3 }}>{t("Talentika menyesuaikan pengalaman dengan usia dan tujuanmu.", "Talentika adapts the experience to your age and goals.")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
        {eds.map(e => {
          const on = choice === e.id;
          return (
            <button key={e.id} onClick={() => setChoice(e.id)} style={{ textAlign: "left", border: `2px solid ${on ? e.c : "#E6EDF7"}`, background: on ? "#F3F8FF" : "#fff", borderRadius: 20, padding: 14,
              display: "flex", gap: 13, alignItems: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: e.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={e.icon} size={24} /></span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>{e.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: e.c }}>{e.range} · {e.verb}</span>
                <span style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{e.journey.join("  →  ")}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 20, fontSize: 12.5, fontWeight: 600, color: C.muted }}>{t("Bukan pelajar?", "Not a student?")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
        {others.map(o => {
          const on = choice === o.id;
          return (
            <button key={o.id} onClick={() => setChoice(o.id)} style={{ border: `1.5px solid ${on ? o.c : "#E6EDF7"}`, background: on ? o.bg : "#fff", borderRadius: 16, padding: "12px 6px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: o.bg, color: o.c, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={o.icon} size={18} /></span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text, textAlign: "center", lineHeight: 1.25 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <div style={{ marginTop: 16 }}><PrimaryCta disabled={busy} onClick={next}>{t("Lanjut", "Continue")}</PrimaryCta></div>
      <Sheet open={schoolSheet} onClose={() => setSchoolSheet(false)} title={t("Akun sekolah", "School account")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>
          {t("Dashboard Guru BK di aplikasi bersifat baca-saja dan memakai akun sekolah yang sudah terverifikasi. Pendaftaran sekolah & konsol lengkap ada di web.",
             "The counselor dashboard in the app is read-only and uses a verified school account. School registration and the full console are on the web.")}
        </p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={() => { window.location.href = "/for-schools"; }}>{t("Daftarkan sekolah di web", "Register your school on the web")}</Btn>
          <Btn kind="outline" onClick={() => { setSchoolSheet(false); setChoice("explorer"); }}>{t("Saya pelajar", "I'm a student")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/** Kepala langkah "Kenali dirimu": tombol kembali, judul, progres. */
function StepHead({ step, total, onBack, title }: { step: number; total: number; onBack: () => void; title: string }) {
  const { t } = useApp();
  return (
    <>
      <div style={{ padding: `${SAFE_T} 22px 0`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn dark onClick={onBack} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t(`Langkah ${step} dari ${total} · tersimpan otomatis`, `Step ${step} of ${total} · saved automatically`)}</div></div>
      </div>
      <div style={{ margin: "16px 22px 0", height: 7, borderRadius: 99, background: "#EAF0F8" }}><div style={{ width: `${Math.round(step / total * 100)}%`, height: "100%", borderRadius: 99, background: C.blue, transition: "width .3s" }} /></div>
    </>
  );
}

function StepFoot({ onBack, onNext, nextLabel, busy, backLabel }: { onBack: () => void; onNext: () => void; nextLabel: string; busy?: boolean; backLabel: string }) {
  return (
    <div style={{ padding: `12px 22px ${SAFE_B}`, display: "flex", gap: 12, borderTop: "1px solid #F1F5FB", background: "#fff" }}>
      <button onClick={onBack} style={{ height: 54, border: "none", background: C.soft, borderRadius: 16, color: C.text2, fontSize: 14.5, fontWeight: 600, padding: "0 22px", cursor: "pointer" }}>{backLabel}</button>
      <button onClick={onNext} disabled={busy} style={{ flex: 1, height: 54, border: "none", borderRadius: 16, background: busy ? C.disabled : C.blue, color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: busy ? "none" : "0 10px 22px rgba(0,102,255,.28)" }}>
        {busy ? "…" : nextLabel} <Icon name="right" size={18} />
      </button>
    </div>
  );
}

/* ── 05 PROFIL DASAR (langkah 1/4) ──────────────────────────────────── */
function Education() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const returning = params.get("returning") === "1";
  const { t, profile, toast, refreshProfile, track } = useApp();
  const ed: Ed = (params.get("ed") as Ed) || editionOf(profile?.jenjang);
  const opts = JENJANG_OPTS.filter(o => (ed === "pro" ? ["kuliah", "lulusan"] : ["smp", "sma_smk", "smk"]).includes(o.value));
  const [edu, setEdu] = useState<string>(() => profile?.jenjang && opts.some(o => o.value === profile.jenjang) ? profile.jenjang : opts[ed === "pro" ? 0 : 1]?.value ?? opts[0].value);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [usia, setUsia] = useState(profile?.usia ? String(profile.usia) : "");
  const [kelas, setKelas] = useState(profile?.kelas ?? "");
  const [school, setSchool] = useState(profile?.school_name ?? "");
  const [lokasi, setLokasi] = useState(profile?.lokasi ?? "");
  const [lang, setLang] = useState<"id" | "en">(profile?.language_preference === "en" ? "en" : "id");
  const [busy, setBusy] = useState(false);
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
    // Pengguna lama dari web sudah punya data — lewati "Kenali dirimu" yang opsional
    nav(returning ? (age < 18 ? "/app/consent" : "/app/dna") : "/app/get-to-know", { replace: true });
  };
  const pro = ed === "pro";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
      <StepHead step={1} total={4} onBack={() => nav(-1)} title={t("Kenali dirimu", "Get to know yourself")} />
      <div style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px" }}>
        <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-.3px" }}>{returning ? t("Selamat datang di aplikasi Talentika!", "Welcome to the Talentika app!") : t("Ceritakan tentang dirimu", "Tell us about yourself")}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
          {returning ? t("Akunmu dari talentika.id sudah tersambung — hasil tes, materi belajar, dan peluang tersimpanmu ikut terbawa.", "Your talentika.id account is connected — your test results, courses and saved opportunities came along.")
            : t("Dipakai untuk menyesuaikan materi, peluang, dan perlindungan privasi.", "Used to tailor content, opportunities and privacy protection.")}
        </div>
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: C.text2 }}>{t("Jenjang", "Education level")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 10 }}>
          {opts.map(o => {
            const on = edu === o.value;
            return <button key={o.value} onClick={() => setEdu(o.value)} style={{ height: 42, border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blue : "#fff", color: on ? "#fff" : C.text2, borderRadius: 99, padding: "0 16px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>{t(o.labelId, o.label)}</button>;
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <Input icon="user" placeholder={t("Nama lengkap", "Full name")} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input inputMode="numeric" placeholder={t("Usia", "Age")} value={usia} onChange={e => setUsia(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            <Input placeholder={pro ? t("Semester", "Semester") : t("Kelas · XI", "Grade · XI")} value={kelas} onChange={e => setKelas(e.target.value)} />
          </div>
          <Input icon="school" placeholder={pro ? t("Kampus", "University") : t("Sekolah", "School")} value={school} onChange={e => setSchool(e.target.value)} />
          <Input icon="pin" placeholder={t("Kota", "City")} value={lokasi} onChange={e => setLokasi(e.target.value)} />
        </div>
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: C.text2 }}>{t("Bahasa aplikasi", "App language")}</div>
        <div style={{ marginTop: 10 }}><Segmented value={lang} onChange={v => setLang(v as "id" | "en")} options={[{ value: "id", label: "Bahasa Indonesia" }, { value: "en", label: "English" }]} /></div>
      </div>
      <StepFoot onBack={() => nav(-1)} onNext={save} busy={busy} nextLabel={t("Lanjut", "Next")} backLabel={t("Kembali", "Back")} />
    </div>
  );
}

/* ── 06 KENALI DIRIMU (langkah 2–4): minat, gaya belajar, cita-cita ──── */
const TILES = INTEREST_TILES;
const STYLES: [string, string, string, string][] = [
  ["Menonton video & demonstrasi", "Watch videos and demonstrations", "play", "#7C3AED"],
  ["Membaca artikel & materi", "Read articles and materials", "book", "#0066FF"],
  ["Praktik langsung & proyek", "Hands-on practice and projects", "puzzle", "#D97706"],
  ["Berdiskusi dengan orang lain", "Discuss with others", "users", "#0D9488"],
  ["Belajar dari pengalaman nyata", "Learn through real-world experiences", "globe", "#7C3AED"],
  ["Campuran semuanya", "A mix of everything", "sparkle", "#D97706"],
];

function GetToKnow() {
  const nav = useNavigate();
  const { t, profile, toast, refreshProfile, lang } = useApp();
  const { careers } = useCareers();
  const prefs = profile?.app_prefs || {};
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>(prefs.interests ?? []);
  const [learnStyle, setLearnStyle] = useState<number | null>(typeof prefs.learn_style === "number" ? prefs.learn_style : null);
  const [dreams, setDreams] = useState<string[]>(prefs.dreams ?? (profile?.career_target ? [profile.career_target] : []));
  const [busy, setBusy] = useState(false);
  const minor = (profile?.usia ?? 99) < 18;
  const finish = async () => {
    setBusy(true);
    const career = dreams.find(d => d !== "unsure" && careers.some(c => c.id === d)) ?? null;
    const { error } = await db.from("profiles").update({
      app_prefs: { ...prefs, interests, learn_style: learnStyle, dreams },
      ...(career ? { career_target: career } : {}),
    }).eq("user_id", profile!.user_id);
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    await refreshProfile();
    nav(minor ? "/app/consent" : "/app/dna", { replace: true });
  };
  const next = () => (step < 2 ? setStep(step + 1) : finish());
  const back = () => (step > 0 ? setStep(step - 1) : nav(-1));
  const L = (id: string, en: string) => (lang === "en" ? en : id);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
      <StepHead step={step + 2} total={4} onBack={back} title={t("Kenali dirimu", "Get to know yourself")} />
      <div key={step} style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px", animation: "tkIn .25s ease both" }}>
        {step === 0 && <>
          <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-.3px" }}>{t("Kegiatan apa yang paling kamu sukai?", "What activities do you enjoy the most?")}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t("Pilih maksimal 3.", "Choose up to 3 options.")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 18 }}>
            {TILES.map(([id, en, icon, bg, c]) => {
              const on = interests.includes(id);
              return (
                <button key={id} onClick={() => setInterests(s => on ? s.filter(x => x !== id) : s.length >= 3 ? s : [...s, id])} aria-pressed={on}
                  style={{ position: "relative", height: 118, border: `2px solid ${on ? C.blue : "transparent"}`, borderRadius: 18, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", padding: 8 }}>
                  <span style={{ color: c, display: "flex" }}><Icon name={icon} size={30} /></span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text, lineHeight: 1.3, textAlign: "center" }}>{L(id, en)}</span>
                  {on && <span style={{ position: "absolute", top: -7, right: -7, width: 24, height: 24, borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}><Icon name="check" size={14} /></span>}
                </button>
              );
            })}
          </div>
        </>}
        {step === 1 && <>
          <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-.3px" }}>{t("Bagaimana kamu suka belajar?", "How do you like to learn?")}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t("Pilih yang paling menggambarkan dirimu.", "Pick the one that feels most like you.")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 18 }}>
            {STYLES.map(([id, en, icon, c], i) => {
              const on = learnStyle === i;
              return (
                <button key={id} onClick={() => setLearnStyle(i)} aria-pressed={on} style={{ height: 56, border: `1.5px solid ${on ? C.blue : "#E6EDF7"}`, background: on ? "#F3F8FF" : "#fff", borderRadius: 16, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} size={16} /></span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: C.text }}>{L(id, en)}</span>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${on ? C.blue : "#E6EDF7"}`, background: on ? C.blue : "#E6EDF7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="check" size={13} /></span>
                </button>
              );
            })}
          </div>
        </>}
        {step === 2 && <>
          <div style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-.3px" }}>{t("Kamu bermimpi menjadi apa?", "What do you dream of becoming?")}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t("Boleh pilih banyak, atau \"Belum yakin\".", "It's okay to pick many, or \"Not sure yet\".")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 }}>
            {[...careers.map(c => ({ id: c.id, label: lang === "en" ? c.name_en || c.name : c.name })), { id: "unsure", label: t("Belum yakin", "Not sure yet") }].map(d => {
              const on = dreams.includes(d.id);
              return <button key={d.id} onClick={() => setDreams(s => on ? s.filter(x => x !== d.id) : d.id === "unsure" ? ["unsure"] : [...s.filter(x => x !== "unsure"), d.id])} aria-pressed={on}
                style={{ height: 42, border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blue : "#fff", color: on ? "#fff" : C.text2, borderRadius: 99, padding: "0 16px", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>{d.label}</button>;
            })}
          </div>
          <div style={{ marginTop: 22, background: C.bg, borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <img src={TIKA} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
            <span style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text2 }}>{t("Selanjutnya, assessment singkat membantuku memahami kekuatanmu. Kamu bisa jeda kapan saja.", "Next, a short assessment helps me understand your strengths. You can pause anytime.")}</span>
          </div>
        </>}
      </div>
      <StepFoot onBack={back} onNext={next} busy={busy} nextLabel={t("Lanjut", "Next")} backLabel={t("Kembali", "Back")} />
    </div>
  );
}

/* ── 07 PERSETUJUAN ORANG TUA — tidak memblokir eksplorasi, wajib untuk berbagi & bayar ── */
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
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: C.bg, padding: `${SAFE_T} 22px ${SAFE_B}`, display: "flex", flexDirection: "column" }}>
      <BackBtn />
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.6px", marginTop: 20 }}>{t("Ajak", "Invite your")}<br /><span style={{ color: C.blue }}>{t("orang tuamu", "guardian")}</span></div>
      <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: C.text3 }}>
        {t("Karena usiamu di bawah 18 tahun, persetujuan wali dibutuhkan untuk berbagi data dan pembayaran. Kamu tetap bisa mulai eksplorasi sekarang.",
           "Because you're under 18, guardian consent is needed for sharing and payments. You can keep exploring now.")}
      </p>
      <div style={{ marginTop: 18, background: "#fff", borderRadius: 20, padding: 15, boxShadow: "0 4px 14px rgba(15,23,42,.05)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: C.tintYellow, color: C.orange, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="users" size={18} /></span>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>{t("Persetujuan wali", "Guardian consent")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Dibutuhkan untuk berbagi & pembayaran.", "Needed for sharing and payments.")}</div></div>
        </div>
        {!code ? (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={contact} onChange={e => setContact(e.target.value)} placeholder={t("Email atau HP orang tua", "Parent's phone or email")}
              style={{ flex: 1, minWidth: 0, height: 44, border: `1.5px solid ${C.line}`, borderRadius: 13, padding: "0 13px", fontSize: 13, outline: "none", background: C.subtle }} />
            <button onClick={invite} disabled={busy || contact.trim().length < 5} style={{ height: 44, border: "none", borderRadius: 13, background: busy || contact.trim().length < 5 ? C.disabled : C.navy, color: "#fff", fontSize: 13, fontWeight: 600, padding: "0 14px", cursor: "pointer" }}>{t("Kirim", "Send")}</button>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: C.green }}><Icon name="check" size={16} />{t("Undangan dibuat. Kirim kode ini ke orang tuamu.", "Invitation created. Send this code to your parent.")}</div>
            <div style={{ marginTop: 10, textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: 4, color: C.blue, background: C.tintBlue, borderRadius: 14, padding: "10px 0" }}>{code}</div>
            <Btn kind="soft" h={44} onClick={share} style={{ marginTop: 10 }}><Icon name="share" size={16} />{t("Bagikan undangan", "Share invitation")}</Btn>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <div style={{ marginTop: 16 }}><PrimaryCta onClick={() => nav("/app/dna", { replace: true })}>{t("Lanjut ke Assessment", "Continue to Assessment")}</PrimaryCta></div>
      {!code && <button onClick={() => nav("/app/dna", { replace: true })} style={{ marginTop: 8, border: "none", background: "none", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", height: 40 }}>{t("Nanti saja", "Later")}</button>}
    </div>
  );
}
