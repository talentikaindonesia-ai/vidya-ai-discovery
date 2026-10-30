import React, { createContext, lazy, ReactNode, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, handleAuthCallback, NATIVE_SCHEME, useApp, useKetersediaan } from "./store";
import { initPush } from "./push";
import { Avatar, GLOBAL_CSS, Icon, Loading, LOGO, TIKA } from "./ui";
import { C, F } from "./theme";

const Onb = lazy(() => import("./screens/Onboarding"));
const Dna = lazy(() => import("./screens/Dna"));
const Home = lazy(() => import("./screens/Home"));
const Discover = lazy(() => import("./screens/Discover"));
const Learn = lazy(() => import("./screens/Learn"));
const Opps = lazy(() => import("./screens/Opportunities"));
const Connect = lazy(() => import("./screens/Connect"));
const Copilot = lazy(() => import("./screens/Copilot"));
const Me = lazy(() => import("./screens/Profile"));
const Pro = lazy(() => import("./screens/Pro"));
const Roles = lazy(() => import("./screens/Roles"));
const More = lazy(() => import("./screens/More"));
const Roadmap = lazy(() => import("./screens/Roadmap"));

const TABS = [
  { id: "home", path: "/app/home", label: "Home", labelId: "Beranda", icon: "home" },
  { id: "learn", path: "/app/learn", label: "Learn", labelId: "Belajar", icon: "book" },
  { id: "projects", path: "/app/projects", label: "Projects", labelId: "Proyek", icon: "folder" },
  { id: "explore", path: "/app/explore", label: "Explore", labelId: "Jelajah", icon: "compass" },
  { id: "profile", path: "/app/profile", label: "Profile", labelId: "Profil", icon: "user" },
];
/** Rute yang menampilkan navigasi bawah (v3: tab utama + My Growth). */
const TAB_ROOTS: Record<string, string> = {
  "/app/home": "home", "/app/learn": "learn", "/app/projects": "projects", "/app/explore": "explore", "/app/opportunities": "explore",
  "/app/profile": "profile", "/app/goals": "profile",
};

/** Edisi v3 dari jenjang: Explorer (SMP–SMA) atau Pro (kuliah & awal karier). Junior disembunyikan. */
export function editionOf(jenjang?: string | null): "explorer" | "pro" {
  return jenjang === "kuliah" || jenjang === "lulusan" ? "pro" : "explorer";
}

function BottomNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { t, profile } = useApp();
  const { side } = useContext(LayoutCtx);
  const active = TAB_ROOTS[pathname.replace(/\/$/, "")];
  if (!active || side) return null;
  const pro = editionOf(profile?.jenjang) === "pro";
  return (
    <>
      <button onClick={() => nav("/app/copilot")} aria-label={t("Tanya Tika AI", "Ask Tika AI")}
        style={{ position: "absolute", right: 16, bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)", zIndex: 35, width: 60, height: 60, borderRadius: "50%", border: "3px solid #fff",
          background: C.tintBlue, padding: 0, overflow: "hidden", cursor: "pointer", boxShadow: "0 10px 24px rgba(0,102,255,.35)" }}>
        <img src={TIKA} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </button>
      <nav style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 30, background: "#fff", borderTop: "1px solid #EEF2F8", display: "flex",
        padding: "8px 6px calc(env(safe-area-inset-bottom, 0px) + 14px)" }}>
        {TABS.map(tb => {
          const on = tb.id === active;
          const label = tb.id === "explore" && pro ? t("Peluang", "Opportunity") : t(tb.labelId, tb.label);
          const icon = tb.id === "explore" && pro ? "brief" : tb.icon;
          return (
            <button key={tb.id} onClick={() => nav(tb.path, { replace: true })} aria-current={on ? "page" : undefined}
              style={{ flex: 1, minWidth: 0, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", color: on ? C.blue : C.faint }}>
              <Icon name={icon} size={23} />
              <span style={{ fontSize: 11, fontWeight: on ? 600 : 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Tujuan utama setelah login, berdasarkan peran & status onboarding. */
export function homeFor(profile: any, isMentor = false) {
  if (!profile) return "/app/start";
  if (profile.role === "school_admin") return "/app/school";
  if (profile.role === "parent") return "/app/parent";
  if (!profile.onboarding_done) return "/app/role";
  return isMentor && profile.app_prefs?.mode === "mentor" ? "/app/mentor-dashboard" : "/app/home";
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, authReady, profile } = useApp();
  const { pathname } = useLocation();
  if (!authReady) return <Loading />;
  if (!user) return <Navigate to="/app" replace />;
  if (!profile) return <Loading />;
  const onboardingPaths = ["/app/role", "/app/profile-setup", "/app/get-to-know", "/app/consent", "/app/start"];
  if (!profile.onboarding_done && profile.role === "student" && !onboardingPaths.includes(pathname) && !pathname.startsWith("/app/mentor"))
    return <Navigate to="/app/role" replace />;
  return <>{children}</>;
}

function Shell() {
  const { textSize, user, profile } = useApp();
  const navigate = useNavigate();
  // Tap notifikasi push → pindah layar tanpa memuat ulang aplikasi
  useEffect(() => {
    const h = (e: Event) => navigate((e as CustomEvent).detail);
    window.addEventListener("tk-nav", h);
    return () => window.removeEventListener("tk-nav", h);
  }, [navigate]);
  // Daftarkan push: diam-diam bila izin sudah ada; tanya sekali setelah onboarding selesai
  useEffect(() => {
    if (!user || !profile?.onboarding_done) return;
    const asked = localStorage.getItem("tk-push-asked") === "1";
    initPush(user.id, !asked).then(r => { if (r !== "unsupported") localStorage.setItem("tk-push-asked", "1"); }).catch(() => {});
  }, [user?.id, profile?.onboarding_done]); // eslint-disable-line
  const { side, vw } = useContext(LayoutCtx);
  const fit = !side && vw < 375 ? Math.max(0.86, vw / 375) : 1;
  const zoom = +(fit * ({ Kecil: 0.92, Normal: 1, Besar: 1.1 }[textSize] ?? 1)).toFixed(3);
  const loc = useLocation();
  useEffect(() => { document.title = "Talentika"; }, []);
  // Android: tombol/gestur back sistem mengikuti riwayat aplikasi (PRD §10)
  useEffect(() => {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return;
    let off: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", ({ canGoBack }) => { if (canGoBack) window.history.back(); else App.exitApp(); }).then(h => { off = () => h.remove(); });
      // Deep link (talentika.id/app/...) → buka layar yang tepat (NOT-03)
      App.addListener("appUrlOpen", async ({ url }) => {
        try {
          if (url.startsWith(`${NATIVE_SCHEME}://`)) { await handleAuthCallback(url); window.location.assign("/app/start"); return; }
          const u = new URL(url);
          if (u.pathname.startsWith("/app") || u.pathname.startsWith("/u/")) window.location.assign(u.pathname + u.search + u.hash);
        } catch { /* abaikan */ }
      });
    });
    return () => off?.();
  }, []);
  const A = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>;
  return (
    // Skala lewat transform (bukan CSS zoom): perilaku `zoom` + tinggi persen berbeda antar versi Chrome/WebView
    <div style={{ position: "absolute", top: 0, left: 0, width: `${(100 / zoom).toFixed(3)}%`, height: `${(100 / zoom).toFixed(3)}%`, transform: zoom === 1 ? undefined : `scale(${zoom})`, transformOrigin: "0 0", background: C.bg, fontFamily: F.body, color: C.text, overflow: "hidden" }}>
      <Suspense fallback={<Loading />}>
        <Routes location={loc}>
          {/* Onboarding (J1) */}
          <Route index element={<Onb screen="splash" />} />
          <Route path="welcome" element={<Onb screen="welcome" />} />
          <Route path="signup" element={<Onb screen="signup" />} />
          <Route path="start" element={A(<Onb screen="start" />)} />
          <Route path="role" element={A(<Onb screen="role" />)} />
          <Route path="profile-setup" element={A(<Onb screen="education" />)} />
          <Route path="get-to-know" element={A(<Onb screen="gtk" />)} />
          <Route path="consent" element={A(<Onb screen="consent" />)} />
          {/* Talent DNA (J2) */}
          <Route path="dna" element={A(<Dna screen="center" />)} />
          <Route path="dna/result" element={A(<Dna screen="result" />)} />
          <Route path="dna/:module" element={A(<Dna screen="question" />)} />
          {/* Home */}
          <Route path="home" element={A(<Home screen="home" />)} />
          <Route path="notifications" element={A(<Home screen="notif" />)} />
          <Route path="readiness" element={A(<Home screen="readiness" />)} />
          <Route path="recap" element={A(<Home screen="recap" />)} />
          <Route path="copilot" element={A(<Copilot />)} />
          {/* Discover */}
          <Route path="discover" element={A(<Discover screen="discover" />)} />
          <Route path="careers/:id" element={A(<Discover screen="detail" />)} />
          <Route path="roadmap/:slug" element={A(<Roadmap />)} />
          <Route path="careers/:id/path" element={A(<Discover screen="path" />)} />
          <Route path="compare" element={A(<Discover screen="compare" />)} />
          <Route path="simulator" element={A(<Discover screen="sim" />)} />
          <Route path="universities" element={A(<Discover screen="unis" />)} />
          {/* Learn */}
          <Route path="learn" element={A(<Learn screen="learn" />)} />
          <Route path="course/:id" element={A(<Learn screen="course" />)} />
          <Route path="projects" element={A(<Learn screen="projects" />)} />
          <Route path="projects/:id" element={A(<Learn screen="project" />)} />
          <Route path="playbooks" element={A(<Learn screen="playbooks" />)} />
          {/* Opportunities */}
          <Route path="explore" element={A(<Opps screen="list" />)} />
          <Route path="opportunities" element={A(<Opps screen="list" />)} />
          <Route path="opportunities/:id" element={A(<Opps screen="detail" />)} />
          <Route path="tracker" element={A(<Opps screen="tracker" />)} />
          <Route path="calendar" element={A(<Opps screen="calendar" />)} />
          {/* Connect */}
          <Route path="mentors" element={A(<Connect screen="mentors" />)} />
          <Route path="mentors/:id" element={A(<Connect screen="mentor" />)} />
          <Route path="reflection" element={A(<Connect screen="reflection" />)} />
          <Route path="community" element={A(<Connect screen="community" />)} />
          <Route path="challenge/:id" element={A(<Connect screen="challenge" />)} />
          {/* Profile */}
          <Route path="profile" element={A(<Me screen="profile" />)} />
          <Route path="portfolio" element={A(<Me screen="portfolio" />)} />
          <Route path="public" element={A(<Me screen="public" />)} />
          <Route path="goals" element={A(<Me screen="goals" />)} />
          <Route path="privacy" element={A(<Me screen="privacy" />)} />
          <Route path="settings" element={A(<More screen="settings" />)} />
          <Route path="achievements" element={A(<More screen="achievements" />)} />
          <Route path="store" element={A(<More screen="store" />)} />
          <Route path="referral" element={A(<More screen="referral" />)} />
          <Route path="data" element={A(<More screen="data" />)} />
          <Route path="challenges" element={A(<More screen="challenges" />)} />
          <Route path="timeline" element={A(<More screen="timeline" />)} />
          <Route path="articles" element={A(<More screen="articles" />)} />
          <Route path="articles/:slug" element={A(<More screen="article" />)} />
          <Route path="programs" element={A(<More screen="programs" />)} />
          <Route path="programs/:id" element={A(<More screen="program" />)} />
          <Route path="mentor-apply" element={A(<More screen="mentorApply" />)} />
          <Route path="talent-card" element={A(<More screen="talentCard" />)} />
          <Route path="plus" element={A(<Pro screen="pro" />)} />
          <Route path="purchases" element={A(<More screen="purchases" />)} />
          {/* Pro (J5) */}
          <Route path="pro" element={A(<Pro screen="pro" />)} />
          <Route path="checkout" element={A(<Pro screen="checkout" />)} />
          <Route path="paid" element={A(<Pro screen="paid" />)} />
          {/* Peran lain */}
          <Route path="parent" element={A(<Roles screen="parent" />)} />
          <Route path="mentor-dashboard" element={A(<Roles screen="mentor" />)} />
          <Route path="school" element={A(<Roles screen="school" />)} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
      <BottomNav />
      <OfflineBanner />
      <PaywallSheet />
    </div>
  );
}

/** Banner saat perangkat offline (pola "UI states" v3). */
function OfflineBanner() {
  const { t } = useApp();
  const [off, setOff] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOff(false), down = () => setOff(true);
    window.addEventListener("online", on); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", down); };
  }, []);
  if (!off) return null;
  return (
    <div role="status" style={{ position: "absolute", left: 12, right: 12, top: "calc(env(safe-area-inset-top, 0px) + 8px)", zIndex: 70, background: C.navy, color: "#fff", borderRadius: 14, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", fontSize: 12.5, boxShadow: "0 10px 24px rgba(15,23,42,.25)" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow, flex: "none" }} />
      {t("Kamu sedang offline · menampilkan materi tersimpan; perubahan disinkron nanti.", "You're offline · showing saved lessons; changes sync later.")}
    </div>
  );
}

/** Paywall Plus yang bisa dibuka dari layar mana pun lewat openPaywall(kind). */
function PaywallSheet() {
  const nav = useNavigate();
  const { t, paywall, closePaywall, track } = useApp();
  useEffect(() => { if (paywall) track("paywall_viewed", { entry_point: paywall }); }, [paywall]); // eslint-disable-line
  if (!paywall) return null;
  const copy: Record<string, [string, string, string, string]> = {
    ai: ["Kuota chat Tika AI hari ini sudah habis", "You've used today's Tika AI chats", "Plus memberi hingga 200 pesan per hari dan bantuan pendaftaran lengkap.", "Plus gives up to 200 messages a day and full application help."],
    dna: ["Asesmen lengkap adalah fitur Plus", "The full assessment is a Plus feature", "Buka 5 modul lanjutan: Aptitude, Learning Style, Career Interest, Future Skills, dan Values.", "Unlock 5 advanced modules: Aptitude, Learning Style, Career Interest, Future Skills and Values."],
    opps: ["Kuota 5 peluang bulan ini sudah terpakai", "You've used this month's 5 opportunities", "Plus membuka katalog peluang penuh tanpa batas bulanan, plus rekomendasi sesuai profilmu.", "Plus unlocks the full opportunity catalog with no monthly cap, plus picks based on your profile."],
    matching: ["Rekomendasi sesuai profil adalah fitur Plus", "Profile-based picks are a Plus feature", "Plus mengurutkan peluang berdasarkan tipe RIASEC, target karier, dan tujuanmu — lengkap dengan alasannya.", "Plus ranks opportunities by your RIASEC type, career target and goal — with the reasons why."],
    projects: ["Akun Free bisa menyimpan 3 proyek", "Free accounts can keep 3 projects", "Plus membuka Talent Passport lengkap: proyek tanpa batas dan bukti keterampilan.", "Plus unlocks the full Talent Passport: unlimited projects and skill evidence."],
    path: ["Jalur studi & karier personal adalah fitur Plus", "Personal study & career paths are a Plus feature", "Langkah demi langkah dari sekarang sampai kariermu — disesuaikan dengan profilmu.", "Step by step from now to your career — tailored to your profile."],
    profile: ["Profil talenta lengkap adalah fitur Plus", "The full talent profile is a Plus feature", "Detail ketiga tipe RIASEC-mu, laporan PDF, dan rekomendasi pengembangan.", "Details of all three of your RIASEC types, a PDF report and growth recommendations."],
    timeline: ["Riwayat progres lengkap adalah fitur Plus", "Full progress history is a Plus feature", "Lihat seluruh perjalananmu: XP, materi, peluang, dan pencapaian dari waktu ke waktu.", "See your whole journey: XP, courses, opportunities and achievements over time."],
    roadmap: ["Roadmap lengkap ada di Talentika Plus", "Full roadmaps are in Talentika Plus", "Semua langkah dari praktisi, centang progresmu, dan panduan PDF-nya.", "Every step from the practitioner, progress tracking and the PDF guide."],
    parent: ["Ringkasan lengkap untuk orang tua ada di Plus", "The full parent summary is in Plus", "Daftar prestasi dan peluang yang sedang diikuti anak, dengan izin anak.", "Your child's achievements and opportunities in progress, with their permission."],
    offline: ["Unduh materi untuk offline", "Download lessons offline", "Plus bisa belajar tanpa internet dan menghemat kuota.", "Plus lets you learn without internet and saves data."],
    course: ["Akun gratis bisa aktif di 3 materi", "Free accounts can have 3 active courses", "Selesaikan salah satu dulu, atau buka materi tanpa batas dengan Plus.", "Finish one first, or unlock unlimited courses with Plus."],
    community: ["Membuat postingan adalah fitur Plus", "Posting is a Plus feature", "Bagikan proyek, prestasi, dan pertanyaanmu ke komunitas.", "Share your projects, achievements and questions with the community."],
    cert: ["Sertifikat jalur adalah fitur Plus", "Track certificates are a Plus feature", "Dapatkan sertifikat terverifikasi ber-kode QR untuk CV dan beasiswa.", "Get QR-verifiable certificates for your CV and scholarships."],
  };
  const c = copy[paywall] ?? ["Fitur Talentika Plus", "A Talentika Plus feature", "Buka semua fitur dengan Talentika Plus.", "Unlock everything with Talentika Plus."];
  return (
    <div onClick={closePaywall} style={{ position: "absolute", inset: 0, zIndex: 85, background: "rgba(15,23,42,.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "tkFade .2s ease both" }}>
      <div onClick={e => e.stopPropagation()} className="tk-sheet" role="dialog" aria-modal="true" style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: "26px 26px 0 0", padding: "14px 22px calc(env(safe-area-inset-bottom, 0px) + 24px)", textAlign: "center", animation: "tkFadeUp .25s ease both" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.disabled, margin: "0 auto 16px" }} />
        <div style={{ width: 58, height: 58, margin: "0 auto", borderRadius: "50%", background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="star" size={27} filled /></div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".7px", color: C.blue, marginTop: 12 }}>TALENTIKA PLUS</div>
        <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.25, marginTop: 6 }}>{t(c[0], c[1])}</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginTop: 6 }}>{t(c[2], c[3])}</div>
        <button onClick={() => { closePaywall(); nav("/app/pro"); }} style={{ width: "100%", height: 52, marginTop: 18, border: "none", borderRadius: 16, background: C.blue, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 22px rgba(0,102,255,.28)" }}>{t("Lihat Talentika Plus", "See Talentika Plus")}</button>
        <button onClick={closePaywall} style={{ width: "100%", height: 44, marginTop: 6, border: "none", background: "none", color: C.muted, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{t("Nanti saja", "Not now")}</button>
      </div>
    </div>
  );
}

/* ── Tata letak responsif ──────────────────────────────────────────────
 * HP (<768px): layar penuh, navigasi bawah; di bawah 375px tampilan diskalakan
 *   proporsional supaya desain 375–390pt tetap utuh di HP kecil.
 * Tablet & desktop (≥768px): menu samping + kolom konten di tengah (lihat
 *   .tk-side di GLOBAL_CSS). Dashboard peran tetap berbingkai.
 * Onboarding: layar penuh di semua ukuran, kolom isi maks 560px (.tk-onb-screen),
 *   ditambah panel merek di kiri mulai 1024px. */
const WIDE = 768;
const LayoutCtx = createContext<{ side: boolean; vw: number }>({ side: false, vw: 390 });
const PANEL_ONB = 1024;
const ONB_PATHS = ["/app", "/app/welcome", "/app/signup", "/app/start", "/app/role", "/app/profile-setup", "/app/get-to-know", "/app/consent"];
const NO_SIDE = [...ONB_PATHS, "/app/parent", "/app/school", "/app/mentor-dashboard"];

function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 390 : window.innerWidth));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

/** Tab mana yang menaungi sebuah rute (untuk menyorot menu samping). */
function tabOf(path: string): string | null {
  if (TAB_ROOTS[path]) return TAB_ROOTS[path];
  if (/^\/app\/(course|playbooks|roadmap)/.test(path)) return "learn";
  if (/^\/app\/(projects\/|challenge)/.test(path)) return "projects";
  if (/^\/app\/(opportunities|calendar)/.test(path)) return "explore";
  if (/^\/app\/(portfolio|public|privacy|settings|achievements|pro|plus|checkout|paid|store|referral|data|timeline|talent-card|mentor-apply)/.test(path)) return "profile";
  if (/^\/app\/(challenges|articles)/.test(path)) return "learn";
  if (/^\/app\/programs/.test(path)) return "home";
  if (/^\/app\/(readiness|recap|discover|careers|compare|simulator|universities|dna)/.test(path)) return "home";
  return null;
}

const SIDE_EXTRA = [
  { path: "/app/tracker", icon: "brief", labelId: "Lamaranku", label: "My Applications" },
  { path: "/app/mentors", icon: "users", labelId: "Mentor", label: "Mentors" },
  { path: "/app/community", icon: "msg", labelId: "Komunitas", label: "Community" },
  { path: "/app/notifications", icon: "bell", labelId: "Notifikasi", label: "Notifications" },
];

function SideNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { t, profile } = useApp();
  const ada = useKetersediaan();
  const path = pathname.replace(/\/$/, "");
  const extra = SIDE_EXTRA.find(x => path === x.path || path.startsWith(x.path + "/"));
  const active = extra ? null : tabOf(path);
  const pro = editionOf(profile?.jenjang) === "pro";
  const item = (key: string, to: string, icon: string, label: string, on: boolean) => (
    <button key={key} onClick={() => nav(to)} aria-current={on ? "page" : undefined} className={on ? undefined : "tk-nav-item"}
      style={{ width: "100%", height: 46, border: "none", borderRadius: 14, background: on ? C.tintBlue : "transparent", color: on ? C.blue : C.text2, display: "flex", alignItems: "center", gap: 12, padding: "0 14px", fontSize: 14, fontWeight: on ? 600 : 500, textAlign: "left" }}>
      <Icon name={icon} size={21} /><span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </button>
  );
  return (
    <aside style={{ width: "clamp(212px, 22vw, 256px)", flex: "none", background: "#fff", borderRight: "1px solid #EEF2F8", display: "flex", flexDirection: "column", padding: "22px 14px 18px", overflowY: "auto" }}>
      <button onClick={() => nav("/app/home")} style={{ display: "flex", alignItems: "center", gap: 10, border: "none", background: "none", padding: "0 6px", textAlign: "left" }}>
        <img src={LOGO} alt="" style={{ width: 38, height: 38, borderRadius: 11, boxShadow: "0 3px 10px rgba(15,23,42,.08)", flex: "none" }} />
        <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 17, fontWeight: 700, lineHeight: 1, color: C.text }}>Talentika</span><span style={{ display: "block", fontSize: 10, color: C.muted, marginTop: 3, whiteSpace: "nowrap" }}>Discover your full potential</span></span>
      </button>
      <nav aria-label={t("Menu utama", "Main menu")} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
        {TABS.map(tb => {
          const label = tb.id === "explore" && pro ? t("Peluang", "Opportunity") : t(tb.labelId, tb.label);
          return item(tb.id, tb.path, tb.id === "explore" && pro ? "brief" : tb.icon, label, tb.id === active);
        })}
      </nav>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".6px", color: C.faint, margin: "20px 14px 6px" }}>{t("LAINNYA", "MORE")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SIDE_EXTRA.filter(x => x.path !== "/app/mentors" || ada.mentor).map(x => item(x.path, x.path, x.icon, t(x.labelId, x.label), extra?.path === x.path))}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <button onClick={() => nav("/app/copilot")} style={{ border: "none", background: C.navy, borderRadius: 18, padding: 12, display: "flex", gap: 10, alignItems: "center", textAlign: "left", outline: path === "/app/copilot" ? `2px solid ${C.blue}` : "none" }}>
        <img src={TIKA} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
        <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff" }}>{t("Tanya Tika AI", "Ask Tika AI")}</span><span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.7)" }}>{t("Mentor AI-mu", "Your AI mentor")}</span></span>
      </button>
      <button onClick={() => nav("/app/profile")} style={{ marginTop: 12, border: "none", background: "none", display: "flex", alignItems: "center", gap: 10, padding: "6px", borderRadius: 14, textAlign: "left" }} className="tk-nav-item">
        <Avatar name={profile?.full_name} src={profile?.avatar_url} size={36} />
        <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(profile?.full_name || "Talentika").split(" ").slice(0, 2).join(" ")}</span><span style={{ display: "block", fontSize: 11, color: C.muted }}>{pro ? "Talentika Pro" : "Talentika Explorer"}</span></span>
      </button>
    </aside>
  );
}

/** Tema (terang/gelap/ikuti sistem) & aksesibilitas dari app_prefs.
 *  Mode gelap = inversi warna "pintar" (gambar dibalik lagi lewat .tk-dark di GLOBAL_CSS). */
function useLook() {
  const { profile } = useApp();
  const prefs = profile?.app_prefs || {};
  const [sysDark, setSysDark] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const h = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);
  const dark = prefs.theme === "dark" || (prefs.theme === "system" && sysDark);
  const contrast = !!prefs.a11y?.contrast;
  const filter = [dark && "invert(1) hue-rotate(180deg)", contrast && "contrast(1.12)"].filter(Boolean).join(" ") || undefined;
  const cls = [dark && "tk-dark", prefs.a11y?.motion && "tk-reduce"].filter(Boolean).join(" ") || undefined;
  return { filter, cls };
}

/** Panel merek onboarding di layar lebar. */
function OnbPanel() {
  const { t } = useApp();
  const poin: [string, string][] = [
    ["sparkle", t("Tes minat untuk mengenali dirimu", "An interest test to know yourself")],
    ["target", t("Beasiswa, kompetisi, dan magang yang sesuai", "Scholarships, competitions, and internships that fit")],
    ["compass", t("Jalur belajar dan karier yang personal", "A personal learning and career path")],
  ];
  return (
    <aside style={{ width: "clamp(380px, 38vw, 560px)", flex: "none", background: "linear-gradient(150deg,#0066FF,#00A3E0)", color: "#fff", display: "flex", flexDirection: "column", padding: "36px 44px", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <img src={LOGO} alt="" style={{ width: 42, height: 42, borderRadius: 12, background: "#fff", flex: "none" }} />
        <span style={{ fontSize: 19, fontWeight: 700 }}>Talentika</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.8px" }}>{t("Temukan potensi terbaikmu", "Discover your full potential")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {poin.map(([ikon, teks]) => (
            <div key={ikon} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 14.5, lineHeight: 1.4 }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={ikon} size={18} /></span>{teks}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Frame() {
  const vw = useViewportWidth();
  const { profile } = useApp();
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, "") || "/app";
  const wide = vw >= WIDE;
  const dnaQuestion = /^\/app\/dna\/(?!result$)[^/]+$/.test(path);
  const side = wide && !NO_SIDE.includes(path) && !dnaQuestion && !["parent", "school_admin"].includes(profile?.role ?? "");
  const ctx = useMemo(() => ({ side, vw }), [side, vw]);
  const look = useLook();
  const onb = ONB_PATHS.includes(path);
  return (
    <LayoutCtx.Provider value={ctx}>
      <div className={look.cls} style={{ minHeight: "100dvh", background: "#EAF4FF", filter: look.filter }}>
      {onb ? (
        <div style={{ display: "flex", height: "100dvh", background: "#fff" }}>
          {vw >= PANEL_ONB && <OnbPanel />}
          <main style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}><Shell /></main>
        </div>
      ) : side ? (
        <div className="tk-side" style={{ display: "flex", height: "100dvh", maxWidth: 1440, margin: "0 auto", background: C.bg, boxShadow: "0 0 0 1px rgba(15,23,42,.05), 0 30px 70px rgba(15,23,42,.08)" }}>
          <SideNav />
          <main style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}><Shell /></main>
        </div>
      ) : (
        <div style={{ minHeight: "100dvh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: wide ? 460 : 440, height: wide ? "min(calc(100dvh - 48px), 940px)" : "100dvh", borderRadius: wide ? 28 : 0, position: "relative", overflow: "hidden", background: C.bg, boxShadow: "0 0 0 1px rgba(15,23,42,.05), 0 30px 70px rgba(15,23,42,.14)" }}>
            <Shell />
          </div>
        </div>
      )}
      </div>
    </LayoutCtx.Provider>
  );
}

/**
 * Talentika Mobile — "Personal Future OS" (PRD v1.0).
 * HP: layar penuh. Tablet & desktop: menu samping + konten di tengah.
 * Dibungkus Capacitor untuk Android & iOS (lihat capacitor.config.ts).
 */
export default function MobileApp() {
  return (
    <div className="tk-app" style={{ minHeight: "100dvh", background: "#EAF4FF" }}>
      <style>{GLOBAL_CSS}</style>
      <AppProvider>
        <Frame />
      </AppProvider>
    </div>
  );
}
