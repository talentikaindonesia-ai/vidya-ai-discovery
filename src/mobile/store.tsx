import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Axes, careerFit, dnaTitle, MODULES } from "./logic";

/** Klien tanpa tipe untuk tabel/RPC baru yang belum ada di types.ts hasil generate. */
export const db = supabase as any;

export type Lang = "id" | "en";

export interface Profile {
  user_id: string; full_name: string | null; email: string | null; avatar_url: string | null; role: string | null;
  jenjang: string | null; usia: number | null; kelas: string | null; school_name: string | null; school_code: string | null;
  lokasi: string | null; language_preference: string | null; onboarding_done: boolean | null; career_target: string | null;
  username: string | null; bio: string | null; tujuan: string | null; app_prefs: any; notif_prefs: any; phone: string | null;
}

interface Ctx {
  user: User | null;
  authReady: boolean;
  profile: Profile | null;
  lang: Lang;
  t: (id: string, en: string) => string;
  isPro: boolean;
  gam: boolean;
  textSize: "Kecil" | "Normal" | "Besar";
  toast: (msg: string, kind?: "gain" | "info" | "error") => void;
  /** Hitung ulang Career Readiness lalu tampilkan "+N Career Readiness · alasan" bila naik (§8). */
  afterAction: (reason: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePrefs: (p: Record<string, any>) => Promise<void>;
  track: (event: string, props?: Record<string, any>) => void;
}

const AppCtx = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; kind: string } | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setUser(s?.user ?? null); qc.invalidateQueries(); });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const { data: profile, refetch } = useQuery({
    queryKey: ["m-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data as Profile | null;
    },
  });

  const { data: access } = useQuery({
    queryKey: ["m-access", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => (await db.rpc("my_access")).data as { is_premium: boolean; source: string | null; expires_at: string | null } | null,
  });

  const prefs = profile?.app_prefs || {};
  const lang: Lang = (profile?.language_preference === "en" ? "en" : (localStorage.getItem("tk-lang") as Lang)) || "id";
  const t = useCallback((id: string, en: string) => (lang === "en" ? en : id), [lang]);

  const toast = useCallback((msg: string, kind: "gain" | "info" | "error" = "info") => {
    setToastMsg({ msg, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const track = useCallback((event: string, props: Record<string, any> = {}) => {
    if (!user) return;
    const platform = (window as any).Capacitor?.getPlatform?.() ?? "web";
    db.from("app_events").insert({ user_id: user.id, event, props, platform }).then(() => {});
  }, [user]);

  const afterAction = useCallback(async (reason: string) => {
    const prev = qc.getQueryData<any>(["m-readiness", user?.id]);
    const { data } = await db.rpc("my_career_readiness");
    if (data) qc.setQueryData(["m-readiness", user?.id], data);
    qc.invalidateQueries({ queryKey: ["m-dna"] });
    const before = prev?.score ?? null, after = data?.score ?? null;
    if (before !== null && after !== null && after > before) {
      toast(`+${after - before} Career Readiness · ${reason}`, "gain");
      track("readiness_changed", { delta: after - before, reason: reason.slice(0, 60), new_score: after });
    } else {
      toast(reason, "info");
    }
  }, [qc, user, toast, track]);

  const refreshProfile = useCallback(async () => { await refetch(); }, [refetch]);

  const updatePrefs = useCallback(async (p: Record<string, any>) => {
    if (!user) return;
    const next = { ...(profile?.app_prefs || {}), ...p };
    await db.from("profiles").update({ app_prefs: next }).eq("user_id", user.id);
    await refetch();
  }, [user, profile, refetch]);

  const value = useMemo<Ctx>(() => ({
    user, authReady, profile: profile ?? null, lang, t,
    isPro: !!access?.is_premium,
    gam: prefs.gamification !== false,
    textSize: prefs.textSize ?? "Normal",
    toast, afterAction, refreshProfile, updatePrefs, track,
  }), [user, authReady, profile, lang, t, access, prefs.gamification, prefs.textSize, toast, afterAction, refreshProfile, updatePrefs, track]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      {toastMsg && (
        <div role="status" style={{ position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", left: 20, right: 20, zIndex: 90, background: toastMsg.kind === "error" ? "#7F1D1D" : "#0B1D3A", color: "#fff",
          borderRadius: 16, padding: "13px 16px", fontSize: 13, fontWeight: 700, boxShadow: "0 12px 30px rgba(11,29,58,.35)", display: "flex", alignItems: "center", gap: 10, animation: "tkFadeUp .3s ease both" }}>
          <span style={{ color: toastMsg.kind === "error" ? "#FCA5A5" : "#5CE0A1", fontSize: 16 }}>{toastMsg.kind === "gain" ? "↗" : toastMsg.kind === "error" ? "!" : "✓"}</span>
          <span style={{ flex: 1 }}>{toastMsg.msg}</span>
        </div>
      )}
    </AppCtx.Provider>
  );
}

/* ── Hook data bersama ─────────────────────────────────────────────── */

export interface DnaState {
  modules: { key: string; total: number; answered: number; done: boolean; free: boolean }[];
  axes: Axes | null; legacy_riasec: boolean; projects: number; updated_at: string | null;
}

export function useDna() {
  const { user } = useApp();
  const q = useQuery({
    queryKey: ["m-dna", user?.id], enabled: !!user,
    queryFn: async () => (await db.rpc("my_talent_dna")).data as DnaState | null,
  });
  const d = q.data;
  const done = d?.modules.filter(m => m.done).length ?? 0;
  return { ...q, dna: d, done, title: dnaTitle(d?.axes, done), isNew: !!d && done === 0 && !d.axes };
}

export function useReadiness() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-readiness", user?.id], enabled: !!user,
    queryFn: async () => (await db.rpc("my_career_readiness")).data as { score: number; week_delta: number; components: { key: string; w: number; v: number }[] } | null,
  });
}

export interface Career {
  id: string; name: string; name_en: string | null; field: string; initial: string; bg: string; fg: string; demand: string | null; salary: string | null;
  what: string; skills: string[]; tools: string[]; edu: string[]; projects: string[]; industries: string[]; roadmap: [string, string][]; axes: Record<string, number>;
}

export function useCareers() {
  const { dna } = useDna();
  const q = useQuery({
    queryKey: ["m-careers"], staleTime: 30 * 60_000,
    queryFn: async () => ((await db.from("careers").select("*").eq("is_active", true).order("sort")).data ?? []) as Career[],
  });
  const list = useMemo(() => (q.data ?? []).map(c => ({ ...c, fit: careerFit(dna?.axes, c.axes) }))
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0)), [q.data, dna?.axes]);
  return { ...q, careers: list };
}

export function useSkills() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-skills", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("user_skills").select("skill, level, source").eq("user_id", user!.id).order("level", { ascending: false })).data ?? []) as { skill: string; level: number; source: string }[],
  });
}

export interface Tracked {
  id: string; opportunity_id: string; opportunity_title: string; opportunity_url: string | null; category: string | null; status: string;
  applied_at: string | null; checklist: Record<string, boolean>; deadline: string | null; opportunity_type: string | null; created_at: string;
}

export function useTracker() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-tracker", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("saved_opportunities").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? []) as Tracked[],
  });
}

export interface OppRow {
  id: string; title: string; organizer: string | null; description: string | null; url: string | null; deadline: string | null; location: string | null;
  opportunity_type: string | null; opportunity_field: string | null; requirements: string[] | null; prize_info: string | null; poster_url: string | null;
  registration_start_date: string | null; registration_end_date: string | null; quality_score: number | null; source_website: string | null; created_at: string; tags: string[] | null;
  // diisi AI Kurator / admin (boleh kosong pada data lama)
  eligibility?: string | null; jenjang_target?: string[] | null; benefits?: string[] | null; cost?: string | null; mode?: string | null;
}

export function useOpportunities() {
  return useQuery({
    queryKey: ["m-opps"], staleTime: 5 * 60_000,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await db.from("scraped_content")
        .select("id,title,organizer,description,url,deadline,location,opportunity_type,opportunity_field,requirements,prize_info,poster_url,registration_start_date,registration_end_date,quality_score,source_website,created_at,tags,eligibility,jenjang_target,benefits,cost,mode")
        .eq("is_active", true).or(`deadline.is.null,deadline.gt.${now}`).order("deadline", { ascending: true, nullsFirst: false }).limit(200);
      return (data ?? []) as OppRow[];
    },
  });
}

/** Nama modul dalam bahasa aktif */
export function moduleName(key: string) { return MODULES.find(m => m.key === key)?.name ?? key; }

/** Upload ke storage bucket bukti proyek: path <uid>/<folder>/<nama> */
export async function uploadEvidence(uid: string, folder: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${uid}/${folder}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from("project-evidence").upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

export async function signedUrl(path: string) {
  const { data } = await supabase.storage.from("project-evidence").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Panggil gateway AI non-streaming. */
export async function askAi(mode: string, payload: Record<string, any>): Promise<{ text?: string; error?: string; message?: string }> {
  const { data, error } = await supabase.functions.invoke("talentika-ai", { body: { mode, ...payload } });
  if (error) {
    try { const b = await (error as any).context?.json?.(); return { error: b?.error ?? "ai_error", message: b?.message }; } catch { /* */ }
    return { error: "ai_error", message: "Talentika AI belum tersedia." };
  }
  return data;
}

/* ── Login di aplikasi native ───────────────────────────────────────────
 * Google memblokir OAuth di dalam WebView, jadi di Android/iOS halaman
 * login dibuka di browser sistem lalu kembali ke aplikasi lewat skema
 * id.talentika.app://login-callback (didaftarkan di AndroidManifest &
 * Info.plist; WAJIB juga ditambahkan di Supabase → Auth → Redirect URLs). */
export const NATIVE_SCHEME = "id.talentika.app";
export const isNative = () => !!(window as any).Capacitor?.isNativePlatform?.();
/** Pembelian digital hanya di web. Di app native, Apple/Google mewajibkan IAP —
 *  untuk v1 tombol beli & harga disembunyikan; Pro dari web/sekolah tetap berlaku. */
export const canPurchase = () => !isNative();
/** Link verifikasi email selalu ke domain web — App Links/Universal Links membukanya di aplikasi. */
export const authRedirect = () => (isNative() ? "https://talentika.id/app/start" : `${window.location.origin}/app/start`);

export async function oauthSignIn(provider: "google" | "apple") {
  if (!isNative()) return supabase.auth.signInWithOAuth({ provider, options: { redirectTo: authRedirect() } });
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${NATIVE_SCHEME}://login-callback`, skipBrowserRedirect: true } });
  if (error || !data?.url) return { data, error };
  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url: data.url, presentationStyle: "popover" });
  return { data, error: null };
}

/** Dipanggil saat aplikasi dibuka lewat id.talentika.app://login-callback#access_token=… atau ?code=… */
export async function handleAuthCallback(url: string) {
  const u = new URL(url);
  const q = new URLSearchParams(u.search);
  const h = new URLSearchParams(u.hash.replace(/^#/, ""));
  const code = q.get("code");
  if (code) await supabase.auth.exchangeCodeForSession(code);
  else if (h.get("access_token") && h.get("refresh_token")) await supabase.auth.setSession({ access_token: h.get("access_token")!, refresh_token: h.get("refresh_token")! });
  try { const { Browser } = await import("@capacitor/browser"); await Browser.close(); } catch { /* sudah tertutup */ }
}

/** Buka tautan eksternal: in-app browser di native (OPP-07), tab baru di web. */
export async function openExternal(url: string) {
  // tolak javascript:, data:, file:, intent: dll. — URL berasal dari data (mentor, peluang, bukti)
  if (!/^(https?:|mailto:|tel:)/i.test((url ?? "").trim())) return;
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover", toolbarColor: "#1D4ED8" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function errMsg(e: any, fallback = "Terjadi kesalahan. Coba lagi.") {
  return (e?.message || e?.error_description || fallback).toString().replace(/^.*?ERROR:\s*/, "");
}
