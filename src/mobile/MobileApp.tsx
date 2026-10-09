import React, { lazy, ReactNode, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppProvider, handleAuthCallback, NATIVE_SCHEME, useApp } from "./store";
import { initPush } from "./push";
import { GLOBAL_CSS, Loading } from "./ui";
import { C, F } from "./theme";
import tika from "./assets/tika-mascot.webp";

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

const TABS = [
  { id: "home", path: "/app/home", label: "Home", labelId: "Beranda", d: "M3 10.5L12 3l9 7.5V21h-6v-6h-6v6H3z" },
  { id: "discover", path: "/app/discover", label: "Discover", labelId: "Jelajah", d: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5 5-2z" },
  { id: "learn", path: "/app/learn", label: "Learn", labelId: "Belajar", d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" },
  { id: "opps", path: "/app/opportunities", label: "Opportunities", labelId: "Peluang", d: "M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18" },
  { id: "profile", path: "/app/profile", label: "Profile", labelId: "Profil", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6" },
];
const TAB_ROOTS: Record<string, string> = {
  "/app/home": "home", "/app/discover": "discover", "/app/learn": "learn", "/app/opportunities": "opps", "/app/profile": "profile",
};

function BottomNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { t } = useApp();
  const active = TAB_ROOTS[pathname.replace(/\/$/, "")];
  if (!active) return null;
  return (
    <>
      <button onClick={() => nav("/app/copilot")} aria-label="AI Copilot"
        style={{ position: "absolute", right: 18, bottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)", zIndex: 30, height: 50, padding: "0 17px 0 14px", border: "none", borderRadius: 99,
          background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: F.display, cursor: "pointer", boxShadow: "0 10px 26px rgba(11,29,58,.35)", display: "flex", alignItems: "center", gap: 7 }}>
        <img src={tika} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, marginLeft: -6 }} />AI Copilot
      </button>
      <nav style={{ position: "absolute", left: 12, right: 12, bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)", zIndex: 30, height: 72, background: "rgba(255,255,255,.94)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderRadius: 24, boxShadow: "0 10px 30px rgba(11,29,58,.14)", display: "flex", alignItems: "center", padding: "0 4px" }}>
        {TABS.map(tb => {
          const on = tb.id === active;
          const col = on ? C.blue : C.faint;
          return (
            <button key={tb.id} onClick={() => nav(tb.path, { replace: true })} aria-current={on ? "page" : undefined}
              style={{ flex: 1, minWidth: 0, height: "100%", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={tb.d} /></svg>
              <span style={{ fontSize: 9.5, fontWeight: on ? 800 : 600, color: col }}>{t(tb.labelId, tb.label)}</span>
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
  const onboardingPaths = ["/app/role", "/app/profile-setup", "/app/consent", "/app/start"];
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
  const zoom = { Kecil: 0.92, Normal: 1, Besar: 1.1 }[textSize] ?? 1;
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
    <div style={{ height: `${(100 / zoom).toFixed(2)}%`, zoom, position: "relative", background: C.bg, fontFamily: F.body, color: C.text, overflow: "hidden" } as any}>
      <Suspense fallback={<Loading />}>
        <Routes location={loc}>
          {/* Onboarding (J1) */}
          <Route index element={<Onb screen="splash" />} />
          <Route path="welcome" element={<Onb screen="welcome" />} />
          <Route path="signup" element={<Onb screen="signup" />} />
          <Route path="start" element={A(<Onb screen="start" />)} />
          <Route path="role" element={A(<Onb screen="role" />)} />
          <Route path="profile-setup" element={A(<Onb screen="education" />)} />
          <Route path="consent" element={A(<Onb screen="consent" />)} />
          {/* Talent DNA (J2) */}
          <Route path="dna" element={A(<Dna screen="center" />)} />
          <Route path="dna/result" element={A(<Dna screen="result" />)} />
          <Route path="dna/:module" element={A(<Dna screen="question" />)} />
          {/* Home */}
          <Route path="home" element={A(<Home screen="home" />)} />
          <Route path="notifications" element={A(<Home screen="notif" />)} />
          <Route path="readiness" element={A(<Home screen="readiness" />)} />
          <Route path="copilot" element={A(<Copilot />)} />
          {/* Discover */}
          <Route path="discover" element={A(<Discover screen="discover" />)} />
          <Route path="careers/:id" element={A(<Discover screen="detail" />)} />
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
          <Route path="settings" element={A(<Me screen="settings" />)} />
          <Route path="achievements" element={A(<Me screen="achievements" />)} />
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
    </div>
  );
}

/**
 * Talentika Mobile — "Personal Future OS" (PRD v1.0).
 * Di HP tampil layar penuh; di desktop dibingkai selebar ponsel agar
 * tata letak 390pt prototype tetap terjaga. Dibungkus Capacitor untuk
 * Android & iOS (lihat capacitor.config.ts).
 */
export default function MobileApp() {
  return (
    <div className="tk-app" style={{ minHeight: "100dvh", background: "#EEF1F6", display: "flex", justifyContent: "center" }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width: "100%", maxWidth: 440, height: "100dvh", position: "relative", overflow: "hidden", background: C.bg, boxShadow: "0 0 0 1px rgba(11,29,58,.04), 0 20px 60px rgba(11,29,58,.12)" }}>
        <AppProvider>
          <Shell />
        </AppProvider>
      </div>
    </div>
  );
}
