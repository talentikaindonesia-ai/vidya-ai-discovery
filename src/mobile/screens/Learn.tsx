import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { askAi, canPurchase, db, errMsg, openExternal, signedUrl, uploadEvidence, useApp } from "../store";
import { AiLabel, Body, Btn, Card, CardTitle, DarkCard, Empty, Header, HeroCard, HScroll, Input, Kicker, Label, Loading, Pill, Row, Screen, Sheet, TabTitle, TextArea } from "../ui";
import { C, F, SH, rpShort } from "../theme";
import stemCover from "../assets/stem-cover-portrait.webp";

export default function Learn({ screen }: { screen: "learn" | "course" | "projects" | "project" | "playbooks" }) {
  switch (screen) {
    case "course": return <Course />;
    case "projects": return <Projects />;
    case "project": return <ProjectWorkspace />;
    case "playbooks": return <Playbooks />;
    default: return <LearnHome />;
  }
}

const SPEC_STYLE = [
  { bg: C.tintBlue, fg: C.blueDark, icon: "💻" }, { bg: C.tintGreen, fg: C.green, icon: "🔬" }, { bg: C.tintSky, fg: C.sky, icon: "🌱" },
  { bg: C.tintOrange, fg: C.orangeDark, icon: "🚀" }, { bg: C.tintPurple, fg: C.purple, icon: "🎨" }, { bg: C.tintYellow, fg: C.gold, icon: "🌏" },
];

function usePathItems(pathId: string | null) {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-path-items", pathId, user?.id], enabled: !!pathId && !!user,
    queryFn: async () => {
      const [{ data: items }, { data: prog }] = await Promise.all([
        db.from("learning_path_contents").select("order_index, learning_content(id,title,duration_minutes,content_type)").eq("path_id", pathId).order("order_index"),
        db.from("learning_progress").select("content_id,status,progress_percentage").eq("user_id", user!.id),
      ]);
      const pm = new Map((prog ?? []).map((p: any) => [p.content_id, p]));
      return (items ?? []).filter((i: any) => i.learning_content).map((i: any) => ({ ...i.learning_content, prog: pm.get(i.learning_content.id) ?? null })) as any[];
    },
  });
}

/* 28 LEARN (LRN-01, LRN-05) */
function LearnHome() {
  const nav = useNavigate();
  const { t, user, toast, profile } = useApp();
  const [params, setParams] = useSearchParams();
  const { data: my } = useQuery({ queryKey: ["m-my-path", user?.id], enabled: !!user, queryFn: async () => (await db.rpc("my_learning_path")).data });
  const { data: paths } = useQuery({ queryKey: ["m-paths"], staleTime: 10 * 60_000, queryFn: async () => ((await db.rpc("list_learning_paths")).data ?? []) as any[] });
  // jalur yang disusun untuk target karier siswa (target_persona 'career:<id>', mis. dari AI Kurator)
  const careerTarget: string | null = (profile as any)?.career_target ?? null;
  const { data: careerPath } = useQuery({
    queryKey: ["m-career-path", careerTarget], enabled: !!careerTarget, staleTime: 10 * 60_000,
    queryFn: async () => ((await db.from("learning_paths").select("id").eq("is_active", true).eq("target_persona", `career:${careerTarget}`).order("created_at", { ascending: false }).limit(1)).data ?? [])[0]?.id as string | undefined,
  });
  const pathId: string | null = params.get("path") ?? my?.path?.id ?? careerPath ?? paths?.[0]?.id ?? null;
  const path = paths?.find(p => p.id === pathId) ?? (my?.path?.id === pathId ? my.path : null);
  const { data: items } = usePathItems(pathId);
  const { data: cont } = useQuery({
    queryKey: ["m-continue", user?.id], enabled: !!user,
    queryFn: async () => (await db.from("learning_progress").select("content_id,progress_percentage,status,learning_content(title)").eq("user_id", user!.id).neq("status", "completed").order("last_accessed_at", { ascending: false }).limit(1)).data?.[0] ?? null,
  });
  const { data: project } = useQuery({
    queryKey: ["m-active-project", user?.id], enabled: !!user,
    queryFn: async () => (await db.from("projects").select("id,title").eq("user_id", user!.id).eq("status", "in_progress").order("updated_at", { ascending: false }).limit(1)).data?.[0] ?? null,
  });

  let nextGiven = false;
  const steps = (items ?? []).map((c, i) => {
    const st = c.prog?.status === "completed" ? "done" : c.prog ? "progress" : !nextGiven ? (nextGiven = true, "next") : "locked";
    if (st === "progress") nextGiven = true;
    return { ...c, st, n: i + 1 };
  });

  return (
    <Screen tab>
      <TabTitle title="Learn" sub={t("Dipersonalisasi dari Talent DNA & target karier-mu", "Personalized from your Talent DNA & career target")} />
      <Body>
        {cont && (
          <HeroCard onClick={() => nav(`/app/course/${cont.content_id}`)} style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.yellow }}>CONTINUE LEARNING</div>
            <div style={{ marginTop: 7, fontSize: 18, fontWeight: 800 }}>{cont.learning_content?.title}</div>
            <div style={{ marginTop: 3, fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>{path?.name ?? ""}</div>
            <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(255,255,255,.22)" }}><div style={{ width: `${cont.progress_percentage ?? 0}%`, height: "100%", borderRadius: 4, background: C.yellow }} /></div>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{cont.progress_percentage ?? 0}%</span>
            </div>
          </HeroCard>
        )}
        <Card radius={22}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted }}>{my?.path?.id === pathId ? t("Recommended Learning · dari Talent DNA-mu", "Recommended Learning · from your Talent DNA") : t("Learning track", "Learning track")}</div>
          <div style={{ marginTop: 3, fontSize: 16, fontWeight: 800 }}>{path?.name ?? t("Pilih track di bawah", "Pick a track below")}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
            {!items && pathId && <Loading />}
            {steps.map((s, i) => {
              const circBg = s.st === "done" ? C.tintGreen : s.st === "progress" ? C.blue : s.st === "next" ? C.tintBlue : C.track;
              const circFg = s.st === "done" ? C.green : s.st === "progress" ? "#fff" : s.st === "next" ? C.blueDark : C.faint;
              const chip = s.st === "done" ? "✓" : s.st === "progress" ? `${s.prog?.progress_percentage ?? 0}%` : s.st === "next" ? "Next" : "🔒";
              return (
                <div key={s.id} onClick={() => s.st === "locked" ? toast(t("Selesaikan langkah sebelumnya dulu", "Finish the previous step first")) : nav(`/app/course/${s.id}`)}
                  style={{ display: "flex", gap: 12, cursor: "pointer", opacity: s.st === "locked" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: circBg, color: circFg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{s.st === "done" ? "✓" : s.n}</span>
                    {i < steps.length - 1 && <span style={{ width: 2, flex: 1, background: C.track, minHeight: 12 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, padding: "4px 0 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.title}</div><div style={{ marginTop: 1, fontSize: 11.5, color: C.faint }}>{s.content_type}{s.duration_minutes ? ` · ${s.duration_minutes} ${t("menit", "min")}` : ""}</div></div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: F.display, color: s.st === "done" ? C.green : s.st === "progress" ? C.blueDark : s.st === "next" ? C.gold : C.faint,
                      background: s.st === "done" ? C.tintGreen : s.st === "progress" ? C.tintBlue : s.st === "next" ? C.tintYellow : C.bg, padding: "4px 9px", borderRadius: 99, flex: "none" }}>{chip}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {pathId && steps.length > 0 && steps.every(s => s.st === "done") && <ClaimCert pathId={pathId} />}
        </Card>
        <div onClick={() => nav(project ? `/app/projects/${project.id}` : "/app/projects")} style={{ background: C.tintOrange, borderRadius: 22, padding: 18, display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
          <span style={{ width: 48, height: 48, borderRadius: 15, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flex: "none" }}>🛠️</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".6px", color: C.orangeDark }}>PROJECT BUILDER</div><div style={{ marginTop: 3, fontSize: 14.5, fontWeight: 800 }}>Build Something</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "#7A3A12" }}>{project ? `${t("Aktif", "Active")}: ${project.title}` : t("Mulai project pertamamu", "Start your first project")}</div></div>
          <span style={{ color: C.orangeDark, fontWeight: 800 }}>→</span>
        </div>
        <Card onClick={() => nav("/app/playbooks")} pad="16px 18px" radius={22} style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <img src={stemCover} alt="" style={{ width: 46, height: 62, borderRadius: 8, objectFit: "cover", flex: "none", boxShadow: "0 4px 10px rgba(11,29,58,.18)" }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800 }}>Talentika Playbooks</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>{t("Panduan karier, beasiswa, dan STEM", "Career, scholarship and STEM guides")}</div></div>
          <span style={{ color: C.blue, fontWeight: 800 }}>→</span>
        </Card>
        {(paths?.length ?? 0) > 0 && (
          <div>
            <CardTitle>Specialized Learning Tracks</CardTitle>
            <HScroll gap={11} style={{ marginTop: 11, paddingBottom: 4 }}>
              {paths!.map((p, i) => {
                const s = SPEC_STYLE[i % SPEC_STYLE.length];
                return (
                  <div key={p.id} onClick={() => setParams({ path: p.id })} style={{ flex: "none", width: 172, background: "#fff", borderRadius: 18, padding: 15, boxShadow: "0 3px 12px rgba(11,29,58,.06)", cursor: "pointer", border: p.id === pathId ? `2px solid ${C.blue}` : "2px solid transparent" }}>
                    <span style={{ width: 40, height: 40, borderRadius: 13, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{s.icon}</span>
                    <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, fontFamily: F.display, color: s.fg }}>{p.name}</div>
                    <div style={{ marginTop: 4, fontSize: 11.5, color: C.muted, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{p.description}</div>
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: C.faint }}>{p.item_count} {t("materi", "items")}{p.estimated_duration_hours ? ` · ${p.estimated_duration_hours} ${t("jam", "h")}` : ""}</div>
                  </div>
                );
              })}
            </HScroll>
          </div>
        )}
      </Body>
    </Screen>
  );
}

function ClaimCert({ pathId }: { pathId: string }) {
  const nav = useNavigate();
  const { t, isPro, toast, afterAction } = useApp();
  const [code, setCode] = useState<string | null>(null);
  const claim = async () => {
    if (!isPro) { nav("/app/pro"); return; }
    const { data, error } = await db.rpc("claim_path_certificate", { p_path_id: pathId });
    if (error) { toast(errMsg(error), "error"); return; }
    setCode(data.verification_code);
    await afterAction(t("Sertifikat track diterbitkan", "Track certificate issued"));
  };
  return code ? <div style={{ marginTop: 6, fontSize: 12.5, color: C.green, fontWeight: 700 }}>📜 {t("Kode verifikasi", "Verification code")}: {code}</div>
    : <Btn kind="soft" h={44} onClick={claim} style={{ marginTop: 6 }}>{isPro ? "📜 " : "👑 "}{t("Klaim sertifikat track", "Claim track certificate")}</Btn>;
}

/* 31 COURSE — Learn · Practice · Build · Reflect · Prove (LRN-02) */
const STAGES = ["learn", "practice", "build", "reflect", "prove"] as const;
const OFFLINE_KEY = "tk-offline-courses";
function readOffline(): Record<string, any> { try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}"); } catch { return {}; } }

function Course() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, gam, toast, afterAction, track } = useApp();
  const [stage, setStage] = useState<(typeof STAGES)[number]>("learn");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [quizRes, setQuizRes] = useState<any>(null);
  const [refl, setRefl] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(!!readOffline()[id]);

  const { data, isLoading } = useQuery({
    queryKey: ["m-course", id, user?.id], enabled: !!user,
    queryFn: async () => {
      try {
        const [{ data: c, error }, { data: p }, { data: st }, { data: q }, { data: r }] = await Promise.all([
          db.from("learning_content").select("id,title,description,content_type,content_url,duration_minutes,learning_objectives,tags,is_premium").eq("id", id).maybeSingle(),
          db.from("learning_progress").select("*").eq("user_id", user!.id).eq("content_id", id).maybeSingle(),
          db.from("course_stage_progress").select("stage").eq("user_id", user!.id).eq("content_id", id),
          db.rpc("get_content_quiz", { p_content_id: id }),
          db.from("learning_reflections").select("body,ai_feedback").eq("user_id", user!.id).eq("content_id", id).order("created_at", { ascending: false }).limit(1),
        ]);
        if (error) throw error;
        return { c, p, stages: new Set((st ?? []).map((s: any) => s.stage)), quiz: (q ?? []) as any[], refl: r?.[0] ?? null };
      } catch (e) {
        const off = readOffline()[id];
        if (off) return { ...off, stages: new Set(off.stages ?? []), p: null, refl: null, offline: true };
        throw e;
      }
    },
  });
  useEffect(() => { if (data?.stages) { const first = STAGES.find(s => !data.stages.has(s)); if (first) setStage(first); } }, [data?.c?.id]); // eslint-disable-line

  if (isLoading) return <Loading />;
  const c = data?.c;
  if (!c) return <Screen><Header title="Course" /><Body><Empty title={t("Materi tidak ditemukan", "Course not found")} /></Body></Screen>;
  const done = data!.stages as Set<string>;
  const ci = STAGES.indexOf(stage);
  const lessons: string[] = (c.learning_objectives?.length ? c.learning_objectives : [c.description?.split(". ")[0]]).filter(Boolean);
  const yt = /youtube\.com\/watch\?v=([\w-]+)|youtu\.be\/([\w-]+)/.exec(c.content_url || "");
  const ytId = yt ? (yt[1] || yt[2]) : null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["m-course", id] });

  const ensureProgress = async (pct: number, status = "in_progress") => {
    if (data?.p) {
      if (data.p.status === "completed") return true;
      await db.from("learning_progress").update({ progress_percentage: Math.max(pct, data.p.progress_percentage ?? 0), status, last_accessed_at: new Date().toISOString(), ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) }).eq("id", data.p.id);
      return true;
    }
    const { error } = await db.from("learning_progress").insert({ user_id: user!.id, content_id: id, status, progress_percentage: pct, last_accessed_at: new Date().toISOString() });
    if (error) {
      if (/row-level|policy/i.test(error.message)) { toast(t("Akun gratis bisa aktif di 3 materi. Selesaikan yang lain atau upgrade Pro.", "Free accounts can have 3 active courses. Finish one or upgrade to Pro."), "error"); nav("/app/pro"); return false; }
      toast(errMsg(error), "error"); return false;
    }
    return true;
  };
  const markStage = async (s: string) => {
    await db.from("course_stage_progress").upsert({ user_id: user!.id, content_id: id, stage: s }, { onConflict: "user_id,content_id,stage" });
    track("course_stage_completed", { course_id: id, stage: s });
  };
  const next = () => (ci < 4 ? setStage(STAGES[ci + 1]) : nav(-1));

  const doLearn = async () => {
    setBusy(true);
    if (await ensureProgress(30)) { await markStage("learn"); await refresh(); toast(t("Tahap Learn selesai", "Learn stage done")); setStage("practice"); }
    setBusy(false);
  };
  const submitQuiz = async () => {
    setBusy(true);
    if (!(await ensureProgress(50))) { setBusy(false); return; }
    const { data: r, error } = await db.rpc("submit_content_quiz", { p_content_id: id, p_answers: picks });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    setQuizRes(r);
    if (r.passed) { await markStage("practice"); await ensureProgress(60); refresh(); }
  };
  const makeProject = async () => {
    setBusy(true);
    const { data: p, error } = await db.from("projects").insert({ user_id: user!.id, title: `Project: ${c.title}`.slice(0, 140), skills: (c.tags || []).slice(0, 5), field: c.content_type, problem: null }).select("id").single();
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    await markStage("build");
    nav(`/app/projects/${p.id}`);
  };
  const sendRefl = async () => {
    if (refl.trim().length < 3) return;
    setBusy(true);
    const { data: row, error } = await db.from("learning_reflections").insert({ user_id: user!.id, content_id: id, body: refl.trim() }).select("id").single();
    if (error) { setBusy(false); toast(errMsg(error), "error"); return; }
    const ai = await askAi("reflect", { input: refl.trim(), context: c.title });
    if (ai.text) await db.from("learning_reflections").update({ ai_feedback: ai.text }).eq("id", row.id);
    await markStage("reflect");
    setBusy(false); setRefl(""); refresh();
  };
  const prove = async () => {
    setBusy(true);
    if (!(await ensureProgress(100, "completed"))) { setBusy(false); return; }
    const { data: ex } = await db.from("portfolio_items").select("id").eq("user_id", user!.id).eq("item_type", "course_completion").eq("title", `Selesai: ${c.title}`).maybeSingle();
    if (!ex) {
      await db.from("portfolio_items").insert({ user_id: user!.id, title: `Selesai: ${c.title}`, description: c.description?.slice(0, 500) ?? null, item_type: "course_completion", tags: (c.tags || []).slice(0, 6), is_public: true });
      track("evidence_added", { source: "course" });
    }
    const tags: string[] = (c.tags || []).filter((x: string) => x && x.length < 30).slice(0, 4);
    if (tags.length) await db.from("user_skills").upsert(tags.map(s => ({ user_id: user!.id, skill: s, level: 60, source: "course", updated_at: new Date().toISOString() })), { onConflict: "user_id,skill", ignoreDuplicates: true });
    await markStage("prove");
    qc.invalidateQueries({ queryKey: ["m-path-items"] }); qc.invalidateQueries({ queryKey: ["m-continue"] }); qc.invalidateQueries({ queryKey: ["m-tracker"] });
    setBusy(false); refresh();
    await afterAction(t(`Sertifikat ${c.title}`, `Certificate ${c.title}`));
  };
  const toggleOffline = () => {
    const all = readOffline();
    if (offline) { delete all[id]; toast(t("Unduhan offline dihapus", "Offline download removed")); }
    else { all[id] = { c, quiz: data!.quiz, stages: Array.from(done), savedAt: Date.now() }; toast(t(`${c.title} tersimpan untuk offline`, `${c.title} saved for offline`)); }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(all)); setOffline(!offline);
  };

  return (
    <Screen>
      <Header title={<span style={{ fontSize: 18 }}>{c.title}</span>} sub={c.content_type}
        right={<button onClick={toggleOffline} style={{ height: 36, border: "none", borderRadius: 11, background: offline ? C.tintGreen : "#fff", color: offline ? C.green : C.blue, boxShadow: SH.btn, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "0 11px", cursor: "pointer", flex: "none" }}>{offline ? "✓ Offline" : "⬇ Offline"}</button>} />
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 6 }}>
        {STAGES.map((s, i) => {
          const on = i === ci, ok = done.has(s);
          return (
            <button key={s} onClick={() => setStage(s)} style={{ flex: 1, minWidth: 0, height: 54, border: "none", borderRadius: 14, background: on ? C.blue : ok ? C.tintGreen : "#fff", color: on ? "#fff" : ok ? C.green : C.muted,
              fontFamily: "inherit", cursor: "pointer", boxShadow: "0 2px 8px rgba(11,29,58,.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: F.display, opacity: 0.75 }}>{ok && !on ? "✓" : i + 1}</span><span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "capitalize" }}>{s}</span>
            </button>
          );
        })}
      </div>
      <Body top={14}>
        {data?.offline && <Pill fg={C.gold} bg={C.tintYellow}>{t("Mode offline — progres disinkron saat online", "Offline mode — progress syncs when online")}</Pill>}
        {stage === "learn" && (<>
          {ytId ? (
            <div style={{ borderRadius: 20, overflow: "hidden", background: C.navy, aspectRatio: "16/9" }}>
              <iframe title={c.title} src={`https://www.youtube-nocookie.com/embed/${ytId}?cc_load_policy=1&hl=id`} style={{ width: "100%", height: "100%", border: 0 }} allow="encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <div onClick={() => c.content_url && openExternal(c.content_url)} style={{ height: 190, borderRadius: 20, background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: c.content_url ? "pointer" : "default" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
              <div style={{ width: 62, height: 62, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 0, height: 0, borderLeft: `19px solid ${C.blue}`, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", marginLeft: 5 }} /></div>
              <span style={{ position: "absolute", bottom: 12, left: 14, fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.content_url ? t("Buka materi", "Open lesson") : t("Materi teks", "Text lesson")}</span>
              {c.duration_minutes && <span style={{ position: "absolute", bottom: 12, right: 14, fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,.35)", padding: "4px 9px", borderRadius: 8 }}>{c.duration_minutes} {t("menit", "min")}</span>}
            </div>
          )}
          {c.description && <Card><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.text3 }}>{c.description}</p></Card>}
          <Card pad="6px 16px">
            {lessons.map((l, i) => (
              <Row key={i} last={i === lessons.length - 1}>
                <span style={{ width: 26, height: 26, borderRadius: 9, background: done.has("learn") ? C.tintGreen : C.tintBlue, color: done.has("learn") ? C.green : C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{done.has("learn") ? "✓" : "▶"}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{l}</span>
              </Row>
            ))}
          </Card>
          {!done.has("learn") && <Btn disabled={busy} onClick={doLearn}>{t("Tandai sudah dipelajari", "Mark as learned")}</Btn>}
        </>)}
        {stage === "practice" && (
          <Card>
            {!data!.quiz.length ? (<>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{t("Belum ada kuis untuk materi ini", "No quiz for this course yet")}</div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t("Latih dirimu dengan menjelaskan isi materi ke teman, lalu lanjut ke tahap Build.", "Practice by explaining the lesson to a friend, then move on to Build.")}</p>
              {!done.has("practice") && <Btn kind="soft" h={46} onClick={async () => { await markStage("practice"); refresh(); next(); }}>{t("Lanjut", "Continue")}</Btn>}
            </>) : (<>
              <Pill display>{`Quiz · ${data!.quiz.length} ${t("soal", "questions")}`}</Pill>
              {data!.quiz.map((q: any, qi: number) => {
                const opts: string[] = Array.isArray(q.options) ? q.options : [];
                const res = quizRes?.results?.find((r: any) => r.question_id === q.id);
                return (
                  <div key={q.id} style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, lineHeight: 1.4 }}>{qi + 1}. {q.question}</div>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                      {opts.map((o, k) => {
                        const p = picks[q.id] === o;
                        const ok = res && res.correct_answer?.toLowerCase().trim() === o.toLowerCase().trim();
                        const bad = res && p && !res.correct;
                        return (
                          <button key={k} disabled={!!quizRes} onClick={() => setPicks(s => ({ ...s, [q.id]: o }))} style={{ minHeight: 50, display: "flex", alignItems: "center", gap: 12, padding: "8px 15px",
                            border: `1.8px solid ${ok ? C.green : bad ? C.red : p ? C.blue : C.line}`, borderRadius: 14, background: ok ? C.tintGreen : bad ? C.tintRed : p ? C.tintBlue : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                            <span style={{ width: 26, height: 26, borderRadius: 9, background: ok ? C.green : bad ? C.red : p ? C.blue : C.track, color: ok || bad || p ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{"ABCDEF"[k]}</span>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>{o}</span><span>{ok ? "✅" : bad ? "❌" : ""}</span>
                          </button>
                        );
                      })}
                    </div>
                    {res?.explanation && <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{res.explanation}</div>}
                  </div>
                );
              })}
              {quizRes ? (
                <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: quizRes.passed ? C.green : C.orangeDark }}>
                  {quizRes.passed ? t(`Lulus! ${quizRes.correct}/${quizRes.total} benar.`, `Passed! ${quizRes.correct}/${quizRes.total} correct.`) : t(`${quizRes.correct}/${quizRes.total} benar — butuh 70% untuk lulus.`, `${quizRes.correct}/${quizRes.total} correct — 70% needed.`)}
                  {quizRes.passed && gam && <span> +XP</span>}
                  {!quizRes.passed && <Btn kind="outline" h={42} onClick={() => { setQuizRes(null); setPicks({}); }} style={{ marginTop: 10 }}>{t("Coba lagi", "Try again")}</Btn>}
                </div>
              ) : <Btn disabled={busy || Object.keys(picks).length < data!.quiz.length} h={48} onClick={submitQuiz} style={{ marginTop: 14 }}>{t("Kirim jawaban", "Submit answers")}</Btn>}
            </>)}
          </Card>
        )}
        {stage === "build" && (
          <Card>
            <Kicker color={C.orangeDark}>Mini project</Kicker>
            <div style={{ marginTop: 6, fontSize: 17, fontWeight: 800 }}>{t(`Terapkan ${c.title} dalam project kecil`, `Apply ${c.title} in a small project`)}</div>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text3 }}>{t("Buat satu hasil nyata — sekecil apa pun — lalu dokumentasikan di Project Workspace. Hasilnya otomatis jadi bukti di Portfolio.", "Make one real output — however small — and document it in the Project Workspace. It becomes evidence in your Portfolio.")}</p>
            <Btn kind="orange" h={48} disabled={busy} onClick={makeProject} style={{ marginTop: 14 }}>{t("Buka Project Workspace", "Open Project Workspace")}</Btn>
            {!done.has("build") && <Btn kind="ghost" h={40} onClick={async () => { await markStage("build"); refresh(); next(); }} style={{ marginTop: 6, fontSize: 12.5 }}>{t("Lewati untuk sekarang", "Skip for now")}</Btn>}
          </Card>
        )}
        {stage === "reflect" && (
          <Card>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{t("Apa yang kamu pelajari hari ini?", "What did you learn today?")}</div>
            {data!.refl && (
              <div style={{ marginTop: 10, fontSize: 13, color: C.text3, background: C.subtle, borderRadius: 12, padding: "10px 12px" }}>“{data!.refl.body}”</div>
            )}
            {data!.refl?.ai_feedback && (
              <div style={{ marginTop: 12, background: C.tintBlue, borderRadius: 14, padding: "13px 15px", display: "flex", gap: 10 }}>
                <span style={{ color: C.blue }}>✦</span><div style={{ flex: 1 }}><span style={{ fontSize: 13, lineHeight: 1.55, color: C.text2 }}>{data!.refl.ai_feedback}</span><div style={{ marginTop: 4 }}><AiLabel /></div></div>
              </div>
            )}
            <TextArea value={refl} onChange={e => setRefl(e.target.value)} placeholder={t("Contoh: aku jadi paham cara bikin fungsi sendiri…", "e.g. I now understand how to write my own functions…")} style={{ marginTop: 10 }} />
            <Btn h={46} disabled={busy || refl.trim().length < 3} onClick={sendRefl} style={{ marginTop: 10 }}>{busy ? t("Mengirim…", "Sending…") : t("Kirim refleksi", "Send reflection")}</Btn>
            <div style={{ marginTop: 8, fontSize: 11.5, color: C.faint }}>🔒 {t("Refleksi selalu privat.", "Reflections are always private.")}</div>
          </Card>
        )}
        {stage === "prove" && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "22px 18px", boxShadow: SH.card, textAlign: "center", border: "2px solid #FFE3A8" }}>
            <div style={{ fontSize: 34 }}>📜</div>
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: 1, color: C.gold }}>CERTIFICATE OF COMPLETION</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800 }}>{c.title}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: C.muted }}>{profile?.full_name} · Talentika · {new Date().toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</div>
            {done.has("prove") ? <Btn kind="success" h={48} onClick={() => nav("/app/portfolio")} style={{ marginTop: 16 }}>{t("Ditambahkan ke Portfolio ✓", "Added to Portfolio ✓")}</Btn>
              : <Btn h={48} disabled={busy || !done.has("learn")} onClick={prove} style={{ marginTop: 16 }}>{t("Tambah ke Portfolio", "Add to Portfolio")}</Btn>}
            {!done.has("learn") && <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>{t("Selesaikan tahap Learn dulu.", "Finish the Learn stage first.")}</div>}
          </div>
        )}
        <Btn kind="outline" h={50} onClick={next}>{ci < 4 ? `Next: ${STAGES[ci + 1][0].toUpperCase() + STAGES[ci + 1].slice(1)} →` : t("Selesai", "Done")}</Btn>
      </Body>
    </Screen>
  );
}

/* PROJECTS */
function Projects() {
  const nav = useNavigate();
  const { t, user, toast, track } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [field, setField] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-projects", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("projects").select("id,title,field,status,progress,skills").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? []) as any[],
  });
  const create = async () => {
    const { data: p, error } = await db.from("projects").insert({ user_id: user!.id, title: title.trim(), field: field.trim() || null }).select("id").single();
    if (error) { toast(errMsg(error), "error"); return; }
    track("evidence_added", { source: "project" });
    nav(`/app/projects/${p.id}`);
  };
  return (
    <Screen>
      <Header title="Projects" sub="Project Builder" right={<Btn full={false} h={36} onClick={() => setOpen(true)} style={{ fontSize: 12.5, borderRadius: 11 }}>+ {t("Baru", "New")}</Btn>} />
      <Body gap={12}>
        {isLoading && <Loading />}
        {!isLoading && !data?.length && <Empty icon="🛠️" title={t("Belum ada project", "No projects yet")} body={t("Project adalah bukti terkuat untuk beasiswa, kompetisi, dan kampus. Mulai dari masalah kecil di sekitarmu.", "Projects are the strongest evidence for scholarships, competitions and universities. Start with a small problem around you.")} action={<Btn kind="orange" h={46} onClick={() => setOpen(true)}>{t("Mulai project", "Start a project")}</Btn>} />}
        {data?.map(p => (
          <Card key={p.id} onClick={() => nav(`/app/projects/${p.id}`)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{p.title}</div>
              <Pill display fg={p.status === "completed" ? C.green : C.orangeDark} bg={p.status === "completed" ? C.tintGreen : C.tintOrange}>{p.status === "completed" ? "Completed" : "In progress"}</Pill>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.track }}><div style={{ width: `${p.progress}%`, height: "100%", borderRadius: 3, background: C.orange }} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.orangeDark }}>{p.progress}%</span>
            </div>
          </Card>
        ))}
      </Body>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("Project baru", "New project")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input placeholder={t("Judul · Prediksi Kualitas Udara Jakarta", "Title · Jakarta Air Quality Prediction")} value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder={t("Bidang · Sustainability", "Field · Sustainability")} value={field} onChange={e => setField(e.target.value)} />
          <Btn disabled={title.trim().length < 2} onClick={create}>{t("Buat project", "Create project")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* 38 PROJECT WORKSPACE + AI COACH (PRJ-01, PRJ-02) */
const COACH: { k: "problem" | "roadmap" | "research" | "portfolio"; label: string }[] = [
  { k: "problem", label: "Define problem" }, { k: "roadmap", label: "Create roadmap" }, { k: "research", label: "Research questions" }, { k: "portfolio", label: "Portfolio description" },
];
function ProjectWorkspace() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, toast, afterAction, track } = useApp();
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [coach, setCoach] = useState<(typeof COACH)[number]["k"] | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachEditing, setCoachEditing] = useState(false);
  const [coachText, setCoachText] = useState("");
  const [linkSheet, setLinkSheet] = useState(false); const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["m-project", id], enabled: !!user,
    queryFn: async () => {
      const [{ data: p }, { data: ev }, { data: notes }] = await Promise.all([
        db.from("projects").select("*").eq("id", id).maybeSingle(),
        db.from("project_evidence").select("*").eq("project_id", id).order("created_at"),
        db.from("project_coach_notes").select("*").eq("project_id", id),
      ]);
      return { p, ev: (ev ?? []) as any[], notes: (notes ?? []) as any[] };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["m-project", id] }); qc.invalidateQueries({ queryKey: ["m-projects"] }); };
  if (isLoading) return <Loading />;
  const p = data?.p;
  if (!p) return <Screen><Header title="Project" /><Body><Empty title={t("Project tidak ditemukan", "Project not found")} /></Body></Screen>;

  const save = async (patch: Record<string, any>) => {
    const { error } = await db.from("projects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast(errMsg(error), "error"); return; }
    refresh();
  };
  const startEdit = (k: string, v: any) => { setEdit(k); setVal(Array.isArray(v) ? v.join(", ") : v ?? ""); };
  const commit = async () => {
    if (!edit) return;
    const arr = ["skills", "tools", "team"].includes(edit);
    await save({ [edit]: arr ? val.split(",").map(s => s.trim()).filter(Boolean).slice(0, 12) : val.trim() || null });
    setEdit(null);
  };
  const filled = ["problem", "solution", "result", "reflection"].filter(k => p[k]).length;
  const autoProgress = Math.min(100, filled * 20 + (data!.ev.length ? 20 : 0));

  const upload = async (f: File) => {
    try {
      const path = await uploadEvidence(user!.id, `project-${id}`, f);
      const kind = f.type.startsWith("image") ? "photo" : f.type.startsWith("video") ? "video" : "file";
      await db.from("project_evidence").insert({ project_id: id, user_id: user!.id, kind, name: f.name, storage_path: path });
      track("evidence_added", { source: "project" });
      refresh(); await afterAction(t("Evidence project ditambahkan", "Project evidence added"));
    } catch (e) { toast(errMsg(e, t("Gagal mengunggah", "Upload failed")), "error"); }
  };
  const addLink = async () => {
    if (!/^https?:\/\//.test(link)) { toast(t("Link harus diawali https://", "Link must start with https://"), "error"); return; }
    await db.from("project_evidence").insert({ project_id: id, user_id: user!.id, kind: "link", name: link.replace(/^https?:\/\//, "").slice(0, 60), url: link });
    setLink(""); setLinkSheet(false); refresh(); await afterAction(t("Evidence project ditambahkan", "Project evidence added"));
  };
  const openEv = async (e: any) => { const u = e.url ?? (e.storage_path ? await signedUrl(e.storage_path) : null); if (u) openExternal(u); };
  const ask = async (k: (typeof COACH)[number]["k"]) => {
    setCoach(k); setCoachEditing(false);
    const ex = data!.notes.find(n => n.topic === k);
    if (ex) { setCoachText(ex.content); return; }
    setCoachBusy(true); setCoachText("");
    const summary = `Judul: ${p.title}\nBidang: ${p.field ?? "-"}\nMasalah: ${p.problem ?? "-"}\nSolusi: ${p.solution ?? "-"}\nSkills: ${(p.skills || []).join(", ")}\nHasil: ${p.result ?? "-"}`;
    const r = await askAi("coach", { input: summary, topic: k });
    setCoachBusy(false);
    if (!r.text) { toast(r.message ?? t("AI belum tersedia", "AI unavailable"), "error"); return; }
    setCoachText(r.text);
    await db.from("project_coach_notes").upsert({ project_id: id, user_id: user!.id, topic: k, content: r.text, edited: false, updated_at: new Date().toISOString() });
    refresh();
  };
  const saveCoach = async () => {
    await db.from("project_coach_notes").upsert({ project_id: id, user_id: user!.id, topic: coach, content: coachText, edited: true, updated_at: new Date().toISOString() });
    setCoachEditing(false); refresh();
  };
  const complete = async () => {
    await save({ status: "completed", progress: 100 });
    await db.from("portfolio_items").insert({ user_id: user!.id, title: p.title, description: p.solution ?? p.problem, item_type: "project", tags: (p.skills || []).slice(0, 6), is_public: p.is_public });
    track("evidence_added", { source: "project" });
    await afterAction(t("Project selesai", "Project completed"));
  };

  const field = (k: string, label: string, ph: string) => (
    <div style={{ padding: "13px 0", borderBottom: `1px solid ${C.track}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><Kicker>{label}</Kicker>{edit !== k && <button onClick={() => startEdit(k, p[k])} style={{ border: "none", background: "none", color: C.blue, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✎ Edit</button>}</div>
      {edit === k ? (
        <div style={{ marginTop: 6 }}><TextArea autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder={ph} style={{ height: 80 }} />
          <div style={{ marginTop: 6, display: "flex", gap: 8 }}><Btn h={38} onClick={commit} style={{ flex: 1 }}>{t("Simpan", "Save")}</Btn><Btn kind="outline" h={38} onClick={() => setEdit(null)} style={{ flex: 1 }}>{t("Batal", "Cancel")}</Btn></div></div>
      ) : (
        ["skills", "tools", "team"].includes(k) ? (
          <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>{(p[k] || []).length ? p[k].map((s: string) => <Pill key={s} size={11.5} fg={k === "tools" ? C.muted : C.blueDark} bg={k === "tools" ? C.bg : C.tintBlue}>{s}</Pill>) : <span style={{ fontSize: 13, color: C.faint }}>{ph}</span>}</div>
        ) : <div style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.5, color: p[k] ? C.text : C.faint }}>{p[k] || ph}</div>
      )}
    </div>
  );

  return (
    <Screen>
      <Header title="Project Workspace" sub={p.field ?? undefined} />
      <Body gap={12}>
        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{p.title}</div>
            <Pill display fg={p.status === "completed" ? C.green : C.orangeDark} bg={p.status === "completed" ? C.tintGreen : C.tintOrange}>{p.status === "completed" ? "Completed" : "In progress"}</Pill>
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={0} max={100} step={10} value={p.status === "completed" ? 100 : Math.max(p.progress, autoProgress)} onChange={e => save({ progress: +e.target.value })} aria-label="Progress" style={{ flex: 1, accentColor: C.orange }} />
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.orangeDark }}>{p.status === "completed" ? 100 : Math.max(p.progress, autoProgress)}%</span>
          </div>
        </Card>
        <Card pad="4px 18px">
          {field("problem", "Problem", t("Masalah apa yang ingin kamu selesaikan?", "What problem are you solving?"))}
          {field("solution", "Solution", t("Solusi yang kamu bangun", "The solution you're building"))}
          {field("skills", "Skills used", t("Python, Data analysis…", "Python, Data analysis…"))}
          {field("tools", "Tools", "Google Colab, Figma…")}
          {field("team", "Team", t("Nama anggota tim", "Team members"))}
          <div style={{ padding: "13px 0", borderBottom: `1px solid ${C.track}` }}>
            <Kicker>Evidence</Kicker>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              {data!.ev.map(e => (
                <div key={e.id} onClick={() => openEv(e)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: e.kind === "link" ? C.tintPurple : e.kind === "photo" ? C.tintGreen : C.tintBlue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{({ photo: "🖼️", video: "🎬", file: "📄", link: "🔗" } as any)[e.kind]}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8 }}>
                <div onClick={() => fileRef.current?.click()} style={{ flex: 1, height: 42, border: `1.5px dashed ${C.disabled}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, color: C.muted, cursor: "pointer" }}>+ {t("Foto/video/file", "Photo/video/file")}</div>
                <div onClick={() => setLinkSheet(true)} style={{ flex: 0.6, height: 42, border: `1.5px dashed ${C.disabled}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, color: C.muted, cursor: "pointer" }}>+ Link</div>
              </div>
              <input ref={fileRef} type="file" hidden accept="image/*,video/*,.pdf,.csv,.ipynb,.zip,.txt" capture={undefined} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </div>
          </div>
          {field("result", "Result", t("Hasil & angka yang kamu capai", "Results & numbers achieved"))}
          <div style={{ borderBottom: "none" }}>{field("reflection", "Reflection", t("Apa tantangan terbesarnya?", "What was the biggest challenge?"))}</div>
        </Card>
        <DarkCard>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow }}>✦</span><span style={{ fontSize: 14.5, fontWeight: 800 }}>AI Project Coach</span></div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {COACH.map(c => <button key={c.k} onClick={() => ask(c.k)} style={{ border: "none", borderRadius: 99, background: coach === c.k ? C.blue : "#fff", color: coach === c.k ? "#fff" : C.blue, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "8px 13px", cursor: "pointer" }}>{c.label}</button>)}
          </div>
          {coach && (
            <div style={{ marginTop: 12, background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "13px 15px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, color: C.lightBlue, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{COACH.find(c => c.k === coach)!.label} · ✦ AI-generated</span>
                {coachText && <button onClick={() => (coachEditing ? saveCoach() : setCoachEditing(true))} style={{ border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontFamily: "inherit", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, cursor: "pointer" }}>{coachEditing ? t("Selesai", "Done") : "Edit"}</button>}
              </div>
              {coachBusy ? <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.7)" }}>●●●</div> : coachEditing ? (
                <textarea value={coachText} onChange={e => setCoachText(e.target.value)} style={{ marginTop: 7, width: "100%", height: 110, border: `1.5px solid ${C.lightBlue}`, borderRadius: 11, padding: "9px 11px", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, color: "#fff", background: "rgba(255,255,255,.06)", resize: "none", outline: "none" }} />
              ) : <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,.92)", whiteSpace: "pre-wrap" }}>{coachText}</div>}
              {coach === "portfolio" && coachText && !coachEditing && <button onClick={() => save({ solution: p.solution ?? coachText })} style={{ marginTop: 8, border: "none", background: "none", color: C.mint, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{t("Pakai sebagai deskripsi solusi →", "Use as solution description →")}</button>}
            </div>
          )}
        </DarkCard>
        {p.status !== "completed" && <Btn kind="orange" disabled={!p.problem || !p.solution} onClick={complete}>{t("Tandai project selesai", "Mark project complete")}</Btn>}
        {p.status !== "completed" && (!p.problem || !p.solution) && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: -6 }}>{t("Isi Problem & Solution untuk menyelesaikan project.", "Fill Problem & Solution to complete the project.")}</div>}
        <Btn kind="ghost" h={40} onClick={async () => { if (confirm(t("Hapus project ini?", "Delete this project?"))) { await db.from("projects").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["m-projects"] }); nav("/app/projects", { replace: true }); } }} style={{ color: C.red, fontSize: 12.5 }}>{t("Hapus project", "Delete project")}</Btn>
      </Body>
      <Sheet open={linkSheet} onClose={() => setLinkSheet(false)} title={t("Tambah link evidence", "Add evidence link")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Input placeholder="https://github.com/…" value={link} onChange={e => setLink(e.target.value)} /><Btn onClick={addLink}>{t("Tambah", "Add")}</Btn></div>
      </Sheet>
    </Screen>
  );
}

/* 37 PLAYBOOK STORE (LRN-06) */
function Playbooks() {
  const { t, user, isPro, toast, profile } = useApp();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const [buy, setBuy] = useState<any>(null);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (params.get("payment") === "success") toast(t("Pembayaran diterima — playbook aktif setelah konfirmasi", "Payment received — playbook unlocks after confirmation")); }, []); // eslint-disable-line
  const { data, isLoading } = useQuery({
    queryKey: ["m-playbooks", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: pb }, { data: own }] = await Promise.all([
        db.from("playbooks").select("*").eq("is_active", true).order("sort"),
        db.from("playbook_purchases").select("playbook_id").eq("user_id", user!.id),
      ]);
      const owned = new Set((own ?? []).map((o: any) => o.playbook_id));
      return (pb ?? []).map((p: any) => ({ ...p, owned: owned.has(p.id) || p.price === 0 || (p.free_for_pro && isPro) }));
    },
  });
  const read = async (p: any) => {
    if (!p.file_path) { toast(t("File playbook sedang disiapkan", "Playbook file is being prepared")); return; }
    const { data: s, error } = await supabase.storage.from("playbooks").createSignedUrl(p.file_path, 3600);
    if (error || !s) { toast(errMsg(error), "error"); return; }
    openExternal(s.signedUrl);
  };
  const addPlan = async (p: any) => {
    await db.from("user_plans").upsert({ user_id: user!.id }, { onConflict: "user_id", ignoreDuplicates: true });
    await db.from("plan_tasks").insert({ user_id: user!.id, month: 1, title: t(`Baca ${p.title}`, `Read ${p.title}`), source: "playbook" });
    toast(t(`${p.title} ditambahkan ke 90-Day Plan`, `${p.title} added to your 90-Day Plan`));
  };
  const pay = async () => {
    setBusy(true);
    const { data: r, error } = await (supabase as any).functions.invoke("create-mayar-payment", { body: { kind: "playbook", playbookId: buy.id, phone } });
    setBusy(false);
    if (error || !r?.invoice_url) { let m = r?.error; try { m = (await (error as any)?.context?.json?.())?.error ?? m; } catch { /* */ } toast(m ?? t("Gagal membuat pembayaran", "Couldn't create payment"), "error"); return; }
    qc.invalidateQueries({ queryKey: ["m-playbooks"] });
    openExternal(r.invoice_url);
  };
  return (
    <Screen>
      <Header title="Talentika Playbooks" sub={t("Knowledge products yang terhubung ke roadmap-mu", "Knowledge products linked to your roadmap")} />
      <Body gap={12}>
        {isLoading && <Loading />}
        {!isLoading && !data?.length && <Empty icon="📚" title={t("Playbook sedang disiapkan", "Playbooks are on the way")} body={t("THE FUTURE OF™, THE STEM ACHIEVEMENT™, dan panduan beasiswa akan tersedia di sini.", "THE FUTURE OF™, THE STEM ACHIEVEMENT™ and scholarship guides will be available here.")} />}
        {data?.map((p: any) => (
          <Card key={p.id} pad={14} style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ width: 58, height: 74, borderRadius: 10, background: p.color, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8, flex: "none", boxShadow: "0 4px 10px rgba(11,29,58,.18)", position: "relative", overflow: "hidden" }}>
              {p.cover_url && <img src={p.cover_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />}
              <span style={{ fontSize: 8, fontWeight: 700, fontFamily: F.display, letterSpacing: ".6px", opacity: 0.8 }}>TALENTIKA</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{p.title.replace(/[™&]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("")}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ marginTop: 3, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{p.description}</div>
              <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, fontFamily: F.display, color: p.owned ? C.green : C.text }}>{p.owned ? (p.price === 0 ? t("Gratis", "Free") : p.free_for_pro && isPro ? t("Gratis untuk Pro", "Free for Pro") : t("Dimiliki", "Owned")) : canPurchase() ? rpShort(p.price) : t("Belum dimiliki", "Not owned")}</span>
                {p.owned ? (<>
                  <button onClick={() => read(p)} style={{ border: "none", background: C.tintBlue, color: C.blueDark, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 11px", borderRadius: 99, cursor: "pointer" }}>{t("Baca", "Read")}</button>
                  <button onClick={() => addPlan(p)} style={{ border: "none", background: C.tintGreen, color: C.green, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 11px", borderRadius: 99, cursor: "pointer" }}>+ Plan</button>
                </>) : canPurchase() && <button onClick={() => setBuy(p)} style={{ border: "none", background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 13px", borderRadius: 99, cursor: "pointer" }}>{t("Beli", "Buy")}</button>}
              </div>
            </div>
          </Card>
        ))}
      </Body>
      <Sheet open={!!buy} onClose={() => setBuy(null)} title={buy?.title}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Total: {buy && rpShort(buy.price)}</div>
          <Label>{t("Nomor HP (untuk konfirmasi pembayaran)", "Phone (for payment confirmation)")}</Label>
          <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08…" />
          <Btn kind="orange" disabled={busy || phone.replace(/\D/g, "").length < 9} onClick={pay}>{t("Bayar via Mayar", "Pay via Mayar")}</Btn>
          <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center" }}>🔒 GoPay · QRIS · Transfer bank · Kartu</div>
        </div>
      </Sheet>
    </Screen>
  );
}
