import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { askAi, canPurchase, db, errMsg, isKuotaError, openExternal, signedUrl, uploadEvidence, useApp, useCareers, useKuota } from "../store";
import { AiLabel, Avatar, BackBtn, Btn, Empty, Header, Icon, IconBtn, ImgBox, Input, Label, Loading, Screen, Sheet, TabTitle, Tabs, TextArea, TIKA } from "../ui";
import { C, SH, rpShort } from "../theme";
import { cekPembayaran } from "@/lib/pembayaran";
import { careerImg, courseImg, IMG } from "../media";
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

const AREA_STYLE: [string, string, string][] = [
  ["cpu", C.blue, C.tintBlue], ["leaf", C.green, C.tintGreen], ["bulb", C.red, C.tintRed], ["rocket", C.purple, C.tintPurple],
  ["chart", C.amber, C.tintYellow], ["globe", C.sky, C.tintSky],
];
const LVL: Record<string, [string, string]> = { beginner: ["Pemula", "Beginner"], intermediate: ["Menengah", "Intermediate"], advanced: ["Lanjutan", "Advanced"] };

function usePathItems(pathId: string | null) {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-path-items", pathId, user?.id], enabled: !!pathId && !!user,
    queryFn: async () => {
      const [{ data: items }, { data: prog }] = await Promise.all([
        db.from("learning_path_contents").select("order_index, learning_content(id,title,duration_minutes,content_type,thumbnail_url)").eq("path_id", pathId).order("order_index"),
        db.from("learning_progress").select("content_id,status,progress_percentage").eq("user_id", user!.id),
      ]);
      const pm = new Map((prog ?? []).map((p: any) => [p.content_id, p]));
      return (items ?? []).filter((i: any) => i.learning_content).map((i: any) => ({ ...i.learning_content, prog: pm.get(i.learning_content.id) ?? null })) as any[];
    },
  });
}

/* ── LEARN ──────────────────────────────────────────────────────────── */
function LearnHome() {
  const nav = useNavigate();
  const { t, lang, user, toast, profile } = useApp();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"foryou" | "paths" | "courses">("foryou");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
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
    queryFn: async () => (await db.from("learning_progress").select("content_id,progress_percentage,status,learning_content(title,thumbnail_url)").eq("user_id", user!.id).neq("status", "completed").order("last_accessed_at", { ascending: false }).limit(1)).data?.[0] ?? null,
  });
  const { data: stats } = useQuery({
    queryKey: ["m-learn-stats", user?.id], enabled: !!user, staleTime: 60_000,
    queryFn: async () => {
      const [lp, cert] = await Promise.all([
        db.from("learning_progress").select("status,progress_percentage,time_spent_minutes").eq("user_id", user!.id),
        db.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_active", true),
      ]);
      const rows = (lp.data ?? []) as any[];
      return {
        active: rows.filter(r => r.status !== "completed").length,
        hours: rows.reduce((a, r) => a + (r.time_spent_minutes ?? 0), 0) / 60,
        avg: rows.length ? Math.round(rows.reduce((a, r) => a + (r.progress_percentage ?? 0), 0) / rows.length) : 0,
        certs: cert.count ?? 0,
      };
    },
  });
  const { data: courses } = useQuery({
    queryKey: ["m-learn-recs", user?.id], enabled: !!user, staleTime: 5 * 60_000,
    queryFn: async () => ((await db.rpc("my_learning_recommendations", { p_limit: 12 })).data ?? []) as any[],
  });

  let nextGiven = false;
  const steps = (items ?? []).map((c, i) => {
    const st = c.prog?.status === "completed" ? "done" : c.prog ? "progress" : !nextGiven ? (nextGiven = true, "next") : "locked";
    if (st === "progress") nextGiven = true;
    return { ...c, st, n: i + 1 };
  });
  const nextStep = steps.find(s => s.st === "progress" || s.st === "next");
  const doneCount = steps.filter(s => s.st === "done").length;
  const ql = q.trim().toLowerCase();
  const courseList = (courses ?? []).filter(c => !ql || `${c.title} ${c.category_name ?? ""}`.toLowerCase().includes(ql));
  const pathList = (paths ?? []).filter(p => !ql || `${p.name} ${p.description ?? ""}`.toLowerCase().includes(ql));
  const lvl = (d?: string | null) => d ? (LVL[d.toLowerCase()] ? t(LVL[d.toLowerCase()][0], LVL[d.toLowerCase()][1]) : d) : null;

  const CourseCard = ({ c }: { c: any }) => (
    <button onClick={() => nav(`/app/course/${c.id}`)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
      <ImgBox src={courseImg(c.thumbnail_url, c.title)} w={92} h={84} r={14} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: c.is_premium ? C.amber : C.blue, background: c.is_premium ? C.tintYellow : C.tintBlue, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>{c.is_premium ? "Plus" : (c.category_name || c.content_type || t("Materi", "Course"))}</span>
        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 14, fontWeight: 700, color: C.text, marginTop: 5, lineHeight: 1.3 } as any}>{c.title}</span>
        {c.reason && <span style={{ display: "block", fontSize: 11, lineHeight: 1.4, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.reason}</span>}
        <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 10.5, color: C.muted, marginTop: 5 }}>
          {c.duration_minutes ? <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Icon name="clock" size={12} />{c.duration_minutes} {t("mnt", "min")}</span> : null}
          {lvl(c.difficulty_level) && <span>{lvl(c.difficulty_level)}</span>}
        </span>
      </span>
      <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={18} /></span>
    </button>
  );

  return (
    <Screen tab>
      <TabTitle title={t("Kursus Saya", "My Courses")} sub={t("Bangun skill untuk masa depan", "Build skills for the future")}
        right={<IconBtn icon={searching ? "x" : "search"} label={t("Cari", "Search")} onClick={() => { setSearching(s => !s); setQ(""); }} />} />
      <div style={{ padding: "0 20px" }}>
        {searching && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, background: "#fff", borderRadius: 15, padding: "0 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(15,23,42,.05)" }}>
            <span style={{ color: C.muted, display: "flex" }}><Icon name="search" size={18} /></span>
            <input autoFocus value={q} onChange={e => { setQ(e.target.value); if (tab === "foryou") setTab("courses"); }} placeholder={t("Cari materi atau jalur…", "Search courses or paths…")} aria-label={t("Cari materi", "Search courses")}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, background: "transparent", color: C.text }} />
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Tabs value={tab} onChange={v => setTab(v as typeof tab)} items={[
            { value: "foryou", label: t("Untukmu", "For You") }, { value: "paths", label: t("Jalur Belajar", "Learning Paths") }, { value: "courses", label: t("Materi", "Courses") },
          ]} />
        </div>

        {tab === "foryou" && <>
          {/* Jalur unggulan */}
          <div style={{ position: "relative", marginTop: 14, borderRadius: 24, overflow: "hidden", background: "linear-gradient(120deg,#EAF4FF,#D6E8FF)", minHeight: 196, padding: "16px 18px" }}>
            <span style={{ position: "absolute", right: 0, top: 0, width: "44%", height: "100%", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 30%)", maskImage: "linear-gradient(90deg,transparent,#000 30%)", backgroundImage: `url('${IMG.pathHiker}')`, backgroundSize: "cover", backgroundPosition: "center" } as any} />
            <div style={{ position: "relative", width: "64%" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", color: C.blue, background: "#fff", padding: "4px 10px", borderRadius: 99 }}>{my?.path?.id === pathId ? t("DARI TALENT DNA-MU", "FROM YOUR TALENT DNA") : t("JALUR BELAJAR UNGGULAN", "FEATURED LEARNING PATH")}</span>
              {path ? <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-.4px", marginTop: 10 }}>{path.name}</div>
                : <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.4px", marginTop: 10 }}>{t("Dari Rasa Ingin Tahu", "From Curiosity")}<br />{t("menuju ", "to ")}<span style={{ color: C.blue }}>{t("Peluang", "Opportunity")}</span></div>}
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: C.text2, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                {path?.description || t("Jalur lengkap untuk menemukan kekuatan dan pilihan karier masa depanmu.", "A complete path to discover your strengths and future career options.")}
              </div>
              {steps.length > 0 && <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, marginTop: 6 }}>{doneCount}/{steps.length} {t("materi selesai", "lessons done")}</div>}
              <button onClick={() => nextStep ? nav(`/app/course/${nextStep.id}`) : setTab("paths")} style={{ marginTop: 10, height: 38, border: "none", borderRadius: 12, background: C.blue, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "0 14px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                {doneCount > 0 ? t("Lanjutkan", "Continue") : t("Mulai Belajar", "Start Learning")} <Icon name="right" size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
            {[[String(stats?.active ?? 0), t("Kursus aktif", "Active courses"), C.blue], [`${(stats?.hours ?? 0).toLocaleString(lang === "en" ? "en-US" : "id-ID", { maximumFractionDigits: 1 })}${t("j", "h")}`, t("Jam belajar", "Study hours"), C.purple], [`${stats?.avg ?? 0}%`, t("Rata-rata", "Average"), C.green], [String(stats?.certs ?? 0), t("Sertifikat", "Certificates"), C.amber]].map(([v, l, c]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 14, padding: "10px 6px", textAlign: "center", boxShadow: SH.card }}><div style={{ fontSize: 17, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, color: C.muted, lineHeight: 1.25 }}>{l}</div></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={() => nav("/app/challenges")} style={{ flex: 1, height: 44, border: "none", borderRadius: 13, background: C.tintYellow, color: "#7A5200", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer" }}><Icon name="trophy" size={16} />{t("Tantangan", "Challenges")}</button>
            <button onClick={() => nav("/app/articles")} style={{ flex: 1, height: 44, border: "none", borderRadius: 13, background: C.tintBlue, color: C.blue, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer" }}><Icon name="book" size={16} />{t("Artikel", "Articles")}</button>
          </div>

          {cont && (
            <button onClick={() => nav(`/app/course/${cont.content_id}`)} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
              <ImgBox src={courseImg(cont.learning_content?.thumbnail_url, cont.learning_content?.title ?? "")} w={64} h={64} r={14} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".5px", color: C.amber }}>{t("LANJUTKAN BELAJAR", "CONTINUE LEARNING")}</span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cont.learning_content?.title}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}><span style={{ flex: 1, height: 6, borderRadius: 99, background: C.track }}><span style={{ display: "block", width: `${cont.progress_percentage ?? 0}%`, height: "100%", borderRadius: 99, background: C.blue }} /></span><span style={{ fontSize: 11, fontWeight: 600 }}>{cont.progress_percentage ?? 0}%</span></span>
              </span>
            </button>
          )}

          {/* Langkah di jalur */}
          {pathId && (
            <div style={{ background: "#fff", borderRadius: 20, padding: "14px 16px", marginTop: 12, boxShadow: SH.card }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t("Langkah di jalurmu", "Steps in your path")}</div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
                {!items && <Loading />}
                {steps.map((s, i) => {
                  const dot = s.st === "done" ? [C.green, C.tintGreen] : s.st === "progress" ? ["#fff", C.blue] : s.st === "next" ? [C.blue, C.tintBlue] : [C.faint, C.soft];
                  const chip = s.st === "done" ? [t("Selesai", "Done"), C.green, C.tintGreen] : s.st === "progress" ? [`${s.prog?.progress_percentage ?? 0}%`, C.blue, C.tintBlue] : s.st === "next" ? [t("Berikutnya", "Next"), C.amber, C.tintYellow] : null;
                  return (
                    <button key={s.id} onClick={() => s.st === "locked" ? toast(t("Selesaikan langkah sebelumnya dulu", "Finish the previous step first")) : nav(`/app/course/${s.id}`)}
                      style={{ display: "flex", gap: 12, cursor: "pointer", opacity: s.st === "locked" ? 0.65 : 1, border: "none", background: "none", padding: 0, textAlign: "left" }}>
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                        <span style={{ width: 30, height: 30, borderRadius: 10, background: dot[1], color: dot[0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{s.st === "done" ? <Icon name="check" size={15} /> : s.st === "locked" ? <Icon name="lock" size={13} /> : s.n}</span>
                        {i < steps.length - 1 && <span style={{ width: 2, flex: 1, background: C.line, minHeight: 12 }} />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, padding: "4px 0 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{s.title}</span><span style={{ display: "block", marginTop: 1, fontSize: 11.5, color: C.faint }}>{s.content_type}{s.duration_minutes ? ` · ${s.duration_minutes} ${t("menit", "min")}` : ""}</span></span>
                        {chip && <span style={{ fontSize: 10.5, fontWeight: 600, color: chip[1], background: chip[2], padding: "3px 9px", borderRadius: 99, flex: "none" }}>{chip[0]}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {steps.length > 0 && steps.every(s => s.st === "done") && <ClaimCert pathId={pathId} />}
            </div>
          )}

          {(paths?.length ?? 0) > 0 && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{t("Bidang Skill", "Skill Areas")}</div><button onClick={() => setTab("paths")} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>{t("Lihat Semua", "See All")}</button></div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "10px -20px 0", padding: "0 20px" }}>
              {paths!.map((p, i) => {
                const [ic, c, bg] = AREA_STYLE[i % AREA_STYLE.length];
                const on = p.id === pathId;
                return (
                  <button key={p.id} onClick={() => setParams({ path: p.id })} style={{ flex: "none", width: 76, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                    <span style={{ width: 62, height: 62, borderRadius: 18, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? `0 0 0 2.5px ${C.blue}` : "none" }}><Icon name={ic} size={28} /></span>
                    <span style={{ fontSize: 10.5, fontWeight: 500, textAlign: "center", lineHeight: 1.3, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </>}

          {(courses?.length ?? 0) > 0 && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{t("Rekomendasi Materi", "Recommended Courses")}</div><button onClick={() => setTab("courses")} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>{t("Lihat Semua", "See All")}</button></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>{courses!.slice(0, 3).map(c => <CourseCard key={c.id} c={c} />)}</div>
          </>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            <button onClick={() => nav("/app/projects")} style={{ textAlign: "left", border: "none", background: "linear-gradient(120deg,#FFF6DB,#FFEBB0)", borderRadius: 18, padding: 14, cursor: "pointer" }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="folder" size={20} /></span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, marginTop: 10 }}>{t("Bangun Proyek", "Build a Project")}</span>
              <span style={{ display: "block", fontSize: 11, color: "#7A5200", marginTop: 2 }}>{t("Belajar sambil berkarya", "Learn by doing")}</span>
            </button>
            <button onClick={() => nav("/app/playbooks")} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 14, cursor: "pointer", boxShadow: SH.card, display: "flex", flexDirection: "column" }}>
              <img src={stemCover} alt="" style={{ width: 34, height: 44, borderRadius: 6, objectFit: "cover", boxShadow: "0 3px 8px rgba(15,23,42,.18)" }} />
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, marginTop: 6 }}>Playbooks</span>
              <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 2 }}>{t("Panduan karier & beasiswa", "Career & scholarship guides")}</span>
            </button>
          </div>
        </>}

        {tab === "paths" && (
          <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {!paths && <Loading />}
            {pathList.map((p, i) => {
              const [ic, c, bg] = AREA_STYLE[i % AREA_STYLE.length];
              const on = p.id === pathId;
              return (
                <button key={p.id} onClick={() => { setParams({ path: p.id }); setTab("foryou"); }} style={{ textAlign: "left", border: on ? `2px solid ${C.blue}` : "2px solid transparent", background: "#fff", borderRadius: 18, padding: 12, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
                  {p.cover_url ? <ImgBox src={p.cover_url} w={64} h={64} r={14} /> : <span style={{ width: 64, height: 64, borderRadius: 16, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={ic} size={28} /></span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{p.name}</span>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.4 } as any}>{p.description}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: C.faint, marginTop: 4 }}>{p.item_count} {t("materi", "items")}{p.estimated_duration_hours ? ` · ${p.estimated_duration_hours} ${t("jam", "h")}` : ""}</span>
                  </span>
                  {on && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{t("Aktif", "Active")}</span>}
                </button>
              );
            })}
            {paths && !pathList.length && <Empty icon="search" title={t("Tidak ada jalur yang cocok", "No matching paths")} />}
          </div>
        )}

        {tab === "courses" && (
          <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {!courses && <Loading />}
            {courseList.map(c => <CourseCard key={c.id} c={c} />)}
            {courses && !courseList.length && <Empty icon="book" title={t("Belum ada materi yang cocok", "No matching courses yet")} />}
          </div>
        )}
      </div>
    </Screen>
  );
}

function ClaimCert({ pathId }: { pathId: string }) {
  const nav = useNavigate();
  const { t, isPro, toast, afterAction, openPaywall } = useApp();
  const [code, setCode] = useState<string | null>(null);
  const claim = async () => {
    if (!isPro) { openPaywall("cert"); return; }
    const { data, error } = await db.rpc("claim_path_certificate", { p_path_id: pathId });
    if (error) { toast(errMsg(error), "error"); return; }
    setCode(data.verification_code);
    await afterAction(t("Sertifikat jalur diterbitkan", "Track certificate issued"));
  };
  return code ? <div style={{ marginTop: 6, fontSize: 12.5, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icon name="medal" size={16} />{t("Kode verifikasi", "Verification code")}: {code}</div>
    : <Btn kind="soft" h={44} onClick={claim} style={{ marginTop: 6 }}><Icon name={isPro ? "medal" : "lock"} size={16} />{t("Klaim sertifikat jalur", "Claim track certificate")}</Btn>;
}

/* ── COURSE · LEARN BY DOING ────────────────────────────────────────── */
const STAGES = ["learn", "practice", "build", "reflect", "prove"] as const;
const STAGE_UI: Record<(typeof STAGES)[number], { icon: string; c: string; bg: string; id: string; en: string; dId: string; dEn: string }> = {
  learn: { icon: "play", c: C.blue, bg: C.tintBlue, id: "Pelajari", en: "Learn", dId: "Tonton atau baca materinya", dEn: "Watch or read the lesson" },
  practice: { icon: "puzzle", c: C.purple, bg: C.tintPurple, id: "Latihan", en: "Practice", dId: "Kuis singkat untuk menguji pemahaman", dEn: "A short quiz to check understanding" },
  build: { icon: "rocket", c: C.amber, bg: C.tintYellow, id: "Bangun", en: "Build", dId: "Terapkan dalam mini proyek", dEn: "Apply it in a mini project" },
  reflect: { icon: "pencil", c: C.teal, bg: C.tintTeal, id: "Refleksi", en: "Reflect", dId: "Tulis apa yang kamu pelajari", dEn: "Write what you learned" },
  prove: { icon: "medal", c: C.green, bg: C.tintGreen, id: "Buktikan", en: "Prove", dId: "Tambahkan ke portofolio", dEn: "Add it to your portfolio" },
};
const OFFLINE_KEY = "tk-offline-courses";
function readOffline(): Record<string, any> { try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "{}"); } catch { return {}; } }

function Course() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, gam, toast, afterAction, track, isPro, openPaywall } = useApp();
  const [stage, setStage] = useState<(typeof STAGES)[number]>("learn");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [quizRes, setQuizRes] = useState<any>(null);
  const [refl, setRefl] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(!!readOffline()[id]);
  const stageRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["m-course", id, user?.id], enabled: !!user,
    queryFn: async () => {
      try {
        const [{ data: c, error }, { data: p }, { data: st }, { data: q }, { data: r }] = await Promise.all([
          db.from("learning_content").select("id,title,description,content_type,content_url,duration_minutes,learning_objectives,tags,is_premium,thumbnail_url,difficulty_level").eq("id", id).maybeSingle(),
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
  if (!c) return <Screen><Header title={t("Materi", "Course")} /><div style={{ padding: 20 }}><Empty title={t("Materi tidak ditemukan", "Course not found")} /></div></Screen>;
  const done = data!.stages as Set<string>;
  const ci = STAGES.indexOf(stage);
  const lessons: string[] = (c.learning_objectives?.length ? c.learning_objectives : [c.description?.split(". ")[0]]).filter(Boolean);
  const yt = /youtube\.com\/watch\?v=([\w-]+)|youtu\.be\/([\w-]+)/.exec(c.content_url || "");
  const ytId = yt ? (yt[1] || yt[2]) : null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["m-course", id] });
  const pct = Math.round((STAGES.filter(s => done.has(s)).length / STAGES.length) * 100);
  const go = (s: (typeof STAGES)[number]) => { setStage(s); setTimeout(() => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); };

  const ensureProgress = async (pctv: number, status = "in_progress") => {
    if (data?.p) {
      if (data.p.status === "completed") return true;
      await db.from("learning_progress").update({ progress_percentage: Math.max(pctv, data.p.progress_percentage ?? 0), status, last_accessed_at: new Date().toISOString(), ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}) }).eq("id", data.p.id);
      return true;
    }
    const { error } = await db.from("learning_progress").insert({ user_id: user!.id, content_id: id, status, progress_percentage: pctv, last_accessed_at: new Date().toISOString() });
    if (error) {
      if (/row-level|policy/i.test(error.message)) { toast(t("Akun gratis bisa aktif di 3 materi. Selesaikan yang lain atau upgrade Plus.", "Free accounts can have 3 active courses. Finish one or upgrade to Plus."), "error"); openPaywall("course"); return false; }
      toast(errMsg(error), "error"); return false;
    }
    return true;
  };
  const markStage = async (s: string) => {
    await db.from("course_stage_progress").upsert({ user_id: user!.id, content_id: id, stage: s }, { onConflict: "user_id,content_id,stage" });
    track("course_stage_completed", { course_id: id, stage: s });
  };
  const next = () => (ci < 4 ? go(STAGES[ci + 1]) : nav(-1));

  const doLearn = async () => {
    setBusy(true);
    if (await ensureProgress(30)) { await markStage("learn"); await refresh(); toast(t("Tahap Pelajari selesai", "Learn stage done")); go("practice"); }
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
    if (error) { if (isKuotaError(error, "KUOTA_PROYEK")) openPaywall("projects"); else toast(errMsg(error), "error"); return; }
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
    if (!offline && !isPro) { openPaywall("offline"); return; }
    const all = readOffline();
    if (offline) { delete all[id]; toast(t("Unduhan offline dihapus", "Offline download removed")); }
    else { all[id] = { c, quiz: data!.quiz, stages: Array.from(done), savedAt: Date.now() }; toast(t(`${c.title} tersimpan untuk offline`, `${c.title} saved for offline`)); }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(all)); setOffline(!offline);
  };
  const circle: React.CSSProperties = { position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", height: 42, borderRadius: 99, border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,.2)" };
  const lv = c.difficulty_level ? (LVL[c.difficulty_level.toLowerCase()] ? t(LVL[c.difficulty_level.toLowerCase()][0], LVL[c.difficulty_level.toLowerCase()][1]) : c.difficulty_level) : null;
  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, padding: 16, boxShadow: SH.card };

  return (
    <Screen>
      <div style={{ position: "relative", height: 210 }}>
        <ImgBox src={courseImg(c.thumbnail_url, c.title)} h="100%" r={0} />
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={{ ...circle, left: 18, width: 42, color: C.text }}><Icon name="left" size={20} /></button>
        {offline && <button onClick={toggleOffline} aria-pressed={offline} aria-label={t("Hapus unduhan offline", "Remove offline download")} style={{ ...circle, right: 18, padding: "0 13px", color: C.green, fontSize: 12, fontWeight: 600 }}><Icon name="check" size={16} />Offline</button>}
      </div>
      <div style={{ position: "relative", marginTop: -24, background: C.bg, borderRadius: "24px 24px 0 0", padding: "20px 20px 10px" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 6, textTransform: "uppercase" }}>{c.content_type || t("Materi", "Course")}</span>
        <h1 style={{ margin: "8px 0 0", fontSize: 23, fontWeight: 800, letterSpacing: "-.4px", lineHeight: 1.2 }}>{c.title}</h1>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.muted, marginTop: 4, flexWrap: "wrap" }}>
          <span>{lessons.length} {t("poin belajar", "learning points")}</span>
          {c.duration_minutes && <span>{c.duration_minutes} {t("menit", "min")}</span>}
          {lv && <span>{lv}</span>}
          {c.is_premium && <span style={{ color: C.amber, fontWeight: 600 }}>Plus</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: C.line }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: C.blue, transition: "width .4s" }} /></div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{STAGES.filter(s => done.has(s)).length}/5</span>
        </div>
        {data?.offline && <div style={{ marginTop: 10, fontSize: 11.5, color: C.gold, background: C.tintYellow, borderRadius: 10, padding: "6px 10px" }}>{t("Mode offline — progres disinkron saat online", "Offline mode — progress syncs when online")}</div>}

        {/* Video / materi */}
        {ytId ? (
          <div style={{ marginTop: 16, borderRadius: 20, overflow: "hidden", background: C.navy, aspectRatio: "16/9" }}>
            <iframe title={c.title} src={`https://www.youtube-nocookie.com/embed/${ytId}?cc_load_policy=1&hl=id`} style={{ width: "100%", height: "100%", border: 0 }} allow="encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          <button onClick={() => c.content_url && openExternal(c.content_url)} style={{ position: "relative", width: "100%", marginTop: 16, borderRadius: 20, overflow: "hidden", height: 170, border: "none", padding: 0, cursor: c.content_url ? "pointer" : "default", display: "block" }}>
            <ImgBox src={IMG.aiHero} h="100%" r={0} />
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(15,23,42,0) 30%,rgba(15,23,42,.75))" }} />
            <span style={{ position: "absolute", left: "50%", top: "42%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,.95)", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={c.content_url ? "play" : "book"} size={22} filled={!!c.content_url} /></span>
            <span style={{ position: "absolute", left: 14, bottom: 12, color: "#fff", textAlign: "left" }}>
              <span style={{ display: "block", fontSize: 11, opacity: .85 }}>{c.duration_minutes ? `${c.duration_minutes} ${t("menit", "min")}` : t("Materi", "Lesson")}</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{c.content_url ? t("Buka materi", "Open lesson") : t("Materi teks di bawah", "Text lesson below")}</span>
            </span>
          </button>
        )}

        {!offline && (
          <button onClick={toggleOffline} style={{ width: "100%", marginTop: 12, height: 46, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 14, fontSize: 13, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ color: C.blue, display: "flex" }}><Icon name="download" size={16} /></span>{t("Unduh untuk offline", "Download for offline")}
            {!isPro && <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "2px 7px", borderRadius: 99 }}>PLUS</span>}
          </button>
        )}

        {/* Learn by doing */}
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Belajar dengan Praktik", "Learn by Doing")}</div>
        <div style={{ ...card, padding: 14, marginTop: 10 }}>
          {STAGES.map((s, i) => {
            const u = STAGE_UI[s]; const ok = done.has(s); const on = s === stage;
            return (
              <button key={s} onClick={() => go(s)} style={{ display: "flex", gap: 12, width: "100%", border: "none", background: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: ok ? C.tintGreen : on ? u.c : u.bg, color: ok ? C.green : on ? "#fff" : u.c, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ok ? "check" : u.icon} size={16} /></span>
                  {i < STAGES.length - 1 && <span style={{ width: 2, height: 14, background: C.line }} />}
                </span>
                <span style={{ flex: 1, paddingTop: 2, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: on ? C.blue : C.text }}>{t(u.id, u.en)}</span><span style={{ display: "block", fontSize: 11.5, color: C.faint }}>{t(u.dId, u.dEn)}</span></span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: ok ? C.green : on ? C.blue : C.faint, whiteSpace: "nowrap" }}>{ok ? t("Selesai", "Done") : on ? t("Sekarang", "Now") : ""}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div ref={stageRef} style={{ scrollMarginTop: 12, marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {stage === "learn" && (<>
            {c.description && <div style={card}><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: C.text2 }}>{c.description}</p></div>}
            <div style={{ ...card, padding: "6px 16px" }}>
              {lessons.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < lessons.length - 1 ? `1px solid ${C.track}` : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 9, background: done.has("learn") ? C.tintGreen : C.tintBlue, color: done.has("learn") ? C.green : C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={done.has("learn") ? "check" : "play"} size={12} filled={!done.has("learn")} /></span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{l}</span>
                </div>
              ))}
            </div>
            {!done.has("learn") && <Btn disabled={busy} onClick={doLearn}>{t("Tandai sudah dipelajari", "Mark lesson complete")}{gam && <span style={{ fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "3px 8px", borderRadius: 99 }}>+XP</span>}</Btn>}
          </>)}
          {stage === "practice" && (
            <div style={card}>
              {!data!.quiz.length ? (<>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t("Belum ada kuis untuk materi ini", "No quiz for this course yet")}</div>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t("Latih dirimu dengan menjelaskan isi materi ke teman, lalu lanjut ke tahap Bangun.", "Practice by explaining the lesson to a friend, then move on to Build.")}</p>
                {!done.has("practice") && <Btn kind="soft" h={46} onClick={async () => { await markStage("practice"); refresh(); next(); }}>{t("Lanjut", "Continue")}</Btn>}
              </>) : (<>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.purple, background: C.tintPurple, padding: "4px 10px", borderRadius: 99 }}>{t(`Kuis · ${data!.quiz.length} soal`, `Quiz · ${data!.quiz.length} questions`)}</span>
                {data!.quiz.map((q: any, qi: number) => {
                  const opts: string[] = Array.isArray(q.options) ? q.options : [];
                  const res = quizRes?.results?.find((r: any) => r.question_id === q.id);
                  return (
                    <div key={q.id} style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>{qi + 1}. {q.question}</div>
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                        {opts.map((o, k) => {
                          const p = picks[q.id] === o;
                          const ok = res && res.correct_answer?.toLowerCase().trim() === o.toLowerCase().trim();
                          const bad = res && p && !res.correct;
                          return (
                            <button key={k} disabled={!!quizRes} onClick={() => setPicks(s => ({ ...s, [q.id]: o }))} style={{ minHeight: 50, display: "flex", alignItems: "center", gap: 12, padding: "8px 14px",
                              border: `1.8px solid ${ok ? C.green : bad ? C.red : p ? C.blue : C.line}`, borderRadius: 14, background: ok ? C.tintGreen : bad ? C.tintRed : p ? C.tintBlue : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                              <span style={{ width: 26, height: 26, borderRadius: 9, background: ok ? C.green : bad ? C.red : p ? C.blue : C.track, color: ok || bad || p ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flex: "none" }}>{"ABCDEF"[k]}</span>
                              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: C.text }}>{o}</span>
                              {ok && <span style={{ color: C.green, display: "flex" }}><Icon name="check" size={17} /></span>}
                              {bad && <span style={{ color: C.red, display: "flex" }}><Icon name="x" size={17} /></span>}
                            </button>
                          );
                        })}
                      </div>
                      {res?.explanation && <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{res.explanation}</div>}
                    </div>
                  );
                })}
                {quizRes ? (
                  <div style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: quizRes.passed ? C.green : C.orange }}>
                    {quizRes.passed ? t(`Lulus! ${quizRes.correct}/${quizRes.total} benar.`, `Passed! ${quizRes.correct}/${quizRes.total} correct.`) : t(`${quizRes.correct}/${quizRes.total} benar — butuh 70% untuk lulus.`, `${quizRes.correct}/${quizRes.total} correct — 70% needed.`)}
                    {quizRes.passed && gam && <span> +XP</span>}
                    {!quizRes.passed && <Btn kind="outline" h={42} onClick={() => { setQuizRes(null); setPicks({}); }} style={{ marginTop: 10 }}>{t("Coba lagi", "Try again")}</Btn>}
                  </div>
                ) : <Btn disabled={busy || Object.keys(picks).length < data!.quiz.length} h={48} onClick={submitQuiz} style={{ marginTop: 14 }}>{t("Kirim jawaban", "Submit answers")}</Btn>}
              </>)}
            </div>
          )}
          {stage === "build" && (
            <div style={card}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.amber, background: C.tintYellow, padding: "4px 10px", borderRadius: 99 }}>{t("Mini proyek", "Mini project")}</span>
              <div style={{ marginTop: 8, fontSize: 17, fontWeight: 700 }}>{t(`Terapkan ${c.title} dalam proyek kecil`, `Apply ${c.title} in a small project`)}</div>
              <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text2 }}>{t("Buat satu hasil nyata — sekecil apa pun — lalu dokumentasikan di ruang proyek. Hasilnya otomatis jadi bukti di Portofolio.", "Make one real output — however small — and document it in the project workspace. It becomes evidence in your Portfolio.")}</p>
              <Btn h={48} disabled={busy} onClick={makeProject} style={{ marginTop: 14 }}>{t("Buka Ruang Proyek", "Open Project Workspace")}</Btn>
              {!done.has("build") && <Btn kind="ghost" h={40} onClick={async () => { await markStage("build"); refresh(); next(); }} style={{ marginTop: 6, fontSize: 12.5 }}>{t("Lewati untuk sekarang", "Skip for now")}</Btn>}
            </div>
          )}
          {stage === "reflect" && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t("Apa yang kamu pelajari hari ini?", "What did you learn today?")}</div>
              {data!.refl && <div style={{ marginTop: 10, fontSize: 13, color: C.text2, background: C.bg, borderRadius: 12, padding: "10px 12px" }}>“{data!.refl.body}”</div>}
              {data!.refl?.ai_feedback && (
                <div style={{ marginTop: 12, background: C.navy, borderRadius: 16, padding: "12px 14px", display: "flex", gap: 10 }}>
                  <img src={TIKA} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
                  <div style={{ flex: 1 }}><span style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.9)" }}>{data!.refl.ai_feedback}</span><div style={{ marginTop: 4 }}><AiLabel dark /></div></div>
                </div>
              )}
              <TextArea value={refl} onChange={e => setRefl(e.target.value)} placeholder={t("Contoh: aku jadi paham cara bikin fungsi sendiri…", "e.g. I now understand how to write my own functions…")} style={{ marginTop: 10 }} />
              <Btn h={46} disabled={busy || refl.trim().length < 3} onClick={sendRefl} style={{ marginTop: 10 }}>{busy ? t("Mengirim…", "Sending…") : t("Kirim refleksi", "Send reflection")}</Btn>
              <div style={{ marginTop: 8, fontSize: 11.5, color: C.faint, display: "flex", alignItems: "center", gap: 5 }}><Icon name="lock" size={12} />{t("Refleksi selalu privat.", "Reflections are always private.")}</div>
            </div>
          )}
          {stage === "prove" && (
            <div style={{ ...card, padding: "22px 18px", textAlign: "center", border: "2px solid #FFE3A8" }}>
              <span style={{ width: 54, height: 54, margin: "0 auto", borderRadius: 16, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="medal" size={28} /></span>
              <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.gold }}>{t("SERTIFIKAT PENYELESAIAN", "CERTIFICATE OF COMPLETION")}</div>
              <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{c.title}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: C.muted }}>{profile?.full_name} · Talentika · {new Date().toLocaleDateString("id-ID", { month: "short", year: "numeric" })}</div>
              {done.has("prove") ? <Btn kind="success" h={48} onClick={() => nav("/app/portfolio")} style={{ marginTop: 16 }}>{t("Ada di Portofolio", "In your Portfolio")} <Icon name="check" size={16} /></Btn>
                : <Btn h={48} disabled={busy || !done.has("learn")} onClick={prove} style={{ marginTop: 16 }}>{t("Tambah ke Portofolio", "Add to Portfolio")}</Btn>}
              {!done.has("learn") && <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>{t("Selesaikan tahap Pelajari dulu.", "Finish the Learn stage first.")}</div>}
            </div>
          )}
          <div style={{ background: C.tintBlue, borderRadius: 16, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.blue, display: "flex", flex: "none" }}><Icon name="target" size={18} /></span>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: "#1E3A8A" }}>{t("Tujuannya: kemampuan yang terbukti. Selesaikan kelima tahap untuk mendapat bukti di portofoliomu.", "Goal: demonstrated capability. Finish all five stages to earn evidence for your portfolio.")}</span>
          </div>
          <Btn kind="outline" h={50} onClick={next}>{ci < 4 ? <>{t("Berikutnya", "Next")}: {t(STAGE_UI[STAGES[ci + 1]].id, STAGE_UI[STAGES[ci + 1]].en)} <Icon name="right" size={16} /></> : t("Selesai", "Done")}</Btn>
        </div>
      </div>
    </Screen>
  );
}

/* ── PROJECTS (tab) ─────────────────────────────────────────────────── */
function Projects() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, profile, toast, track, isPro, openPaywall } = useApp();
  const { data: kuota } = useKuota();
  const { careers } = useCareers();
  const [tab, setTab] = useState<"mine" | "ideas" | "done">("mine");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [field, setField] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-projects", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("projects").select("id,title,field,status,progress,skills,team,problem,solution,result,reflection,updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? []) as any[],
  });
  const { data: extra } = useQuery({
    queryKey: ["m-projects-extra", user?.id], enabled: !!user, staleTime: 60_000,
    queryFn: async () => {
      const [ch, pf] = await Promise.all([
        db.from("community_challenges").select("id,title,xp_reward,end_date,difficulty").eq("is_active", true).or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`).order("end_date", { ascending: true, nullsFirst: false }).limit(2),
        db.from("portfolio_items").select("id,title,item_type", { count: "exact" }).eq("user_id", user!.id).order("created_at", { ascending: false }).limit(3),
      ]);
      return { challenges: (ch.data ?? []) as any[], portfolio: (pf.data ?? []) as any[], pfCount: pf.count ?? 0 };
    },
  });
  const create = async (tt = title, ff = field) => {
    const { data: p, error } = await db.from("projects").insert({ user_id: user!.id, title: tt.trim(), field: ff.trim() || null }).select("id").single();
    if (error) { if (isKuotaError(error, "KUOTA_PROYEK")) { setOpen(false); openPaywall("projects"); } else toast(errMsg(error), "error"); return; }
    qc.invalidateQueries({ queryKey: ["m-kuota"] });
    track("evidence_added", { source: "project" });
    nav(`/app/projects/${p.id}`);
  };
  const active = (data ?? []).filter(p => p.status !== "completed");
  const finished = (data ?? []).filter(p => p.status === "completed");
  // Free: Talent Passport dasar, maks. 3 proyek (dibatasi juga di database)
  const penuh = !isPro && !!kuota && kuota.proyek >= kuota.proyek_batas;
  const baru = () => (penuh ? openPaywall("projects") : setOpen(true));
  const target = careers.find(c => c.id === profile?.career_target) ?? careers[0];
  const ideas = [...(target?.projects ?? []).map(x => ({ t: x, d: target!.name, f: target!.field })), ...careers.filter(c => c.id !== target?.id).slice(0, 3).map(c => ({ t: c.projects[0], d: c.name, f: c.field }))].filter(x => x.t).slice(0, 6);
  const milestones = (p: any) => ["problem", "solution", "result", "reflection"].filter(k => p[k]).length;

  return (
    <Screen tab>
      <TabTitle title={t("Proyek", "Projects")} sub={t("Belajar sambil berkarya, bangun portofoliomu", "Learn by doing, build your portfolio")} right={<IconBtn primary icon="plus" label={t("Proyek baru", "New project")} onClick={baru} />} />
      <div style={{ padding: "16px 20px 0" }}>
        <Tabs bleed={false} value={tab} onChange={v => setTab(v as typeof tab)} items={[
          { value: "mine", label: t("Proyekku", "My Projects") }, { value: "ideas", label: t("Ide Proyek", "Ideas") }, { value: "done", label: t("Selesai", "Completed") },
        ]} />
        {!isPro && kuota && <button onClick={() => openPaywall("projects")} style={{ marginTop: 10, border: "none", background: "none", padding: 0, fontSize: 11.5, color: penuh ? C.amber : C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon name={penuh ? "lock" : "folder"} size={13} />{t(`${kuota.proyek}/${kuota.proyek_batas} proyek · Akun Free — tanpa batas dengan Plus`, `${kuota.proyek}/${kuota.proyek_batas} projects · Free account — unlimited with Plus`)}</button>}

        {tab === "mine" && <>
          {isLoading && <Loading />}
          {!isLoading && !active.length && (
            <div style={{ marginTop: 14, background: "#fff", borderRadius: 20, padding: "22px 18px", textAlign: "center", boxShadow: SH.card }}>
              <span style={{ width: 60, height: 60, margin: "0 auto", borderRadius: 18, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="folder" size={28} /></span>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>{t("Belum ada proyek aktif", "No active projects yet")}</div>
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginTop: 4 }}>{t("Proyek adalah bukti terkuat untuk beasiswa, kompetisi, dan kampus. Mulai dari masalah kecil di sekitarmu.", "Projects are the strongest evidence for scholarships, competitions and universities. Start with a small problem around you.")}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <Btn kind="outline" h={44} onClick={() => setTab("ideas")} style={{ flex: 1, width: "auto", fontSize: 13 }}>{t("Lihat ide", "See ideas")}</Btn>
                <Btn h={44} onClick={baru} style={{ flex: 1, width: "auto", fontSize: 13 }}>{t("Mulai proyek", "Start a project")}</Btn>
              </div>
            </div>
          )}
          {active.map((p, i) => (
            <button key={p.id} onClick={() => nav(`/app/projects/${p.id}`)} style={{ width: "100%", textAlign: "left", marginTop: i ? 10 : 14, border: "none", background: "#fff", borderRadius: 20, padding: 0, overflow: "hidden", cursor: "pointer", boxShadow: SH.card }}>
              {i === 0 && <ImgBox src={careerImg(p.field, p.id)} h={120} r={0} />}
              <span style={{ display: "block", padding: "14px 16px 16px" }}>
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: C.amber, background: C.tintYellow, padding: "3px 9px", borderRadius: 99 }}>{(p.team?.length ?? 0) > 0 ? t(`Proyek tim · ${p.team.length + 1} orang`, `Team project · ${p.team.length + 1} members`) : (p.field || t("Proyek pribadi", "Solo project"))}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{t("Diperbarui", "Updated")} {new Date(p.updated_at).toLocaleDateString(lang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" })}</span>
                </span>
                <span style={{ display: "block", fontSize: 17, fontWeight: 700, color: C.text, marginTop: 8 }}>{p.title}</span>
                {p.problem && <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.problem}</span>}
                <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <span style={{ flex: 1, height: 7, borderRadius: 99, background: C.track }}><span style={{ display: "block", width: `${p.progress ?? 0}%`, height: "100%", borderRadius: 99, background: C.green }} /></span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{milestones(p)}/4 {t("tahap", "milestones")}</span>
                </span>
              </span>
            </button>
          ))}

          {!!extra?.challenges.length && <>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 20 }}>{t("Tantangan", "Challenges")}</div>
            {extra.challenges.map(ch => (
              <div key={ch.id} style={{ marginTop: 10, background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 20, padding: 16, color: "#fff", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="rocket" size={24} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("TANTANGAN MINGGU INI", "WEEKLY CHALLENGE")}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>{ch.title}</div>
                  <div style={{ fontSize: 11.5, opacity: .85 }}>{ch.end_date ? t(`Berakhir ${new Date(ch.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`, `Ends ${new Date(ch.end_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`) : t("Tanpa batas waktu", "No deadline")}{ch.xp_reward ? ` · +${ch.xp_reward} XP` : ""}</div>
                </div>
                <button onClick={() => nav(`/app/challenge/${ch.id}`)} style={{ height: 36, border: "none", borderRadius: 11, background: "#fff", color: C.blue, fontSize: 12.5, fontWeight: 700, padding: "0 13px", cursor: "pointer", flex: "none" }}>{t("Ikut", "Join")}</button>
              </div>
            ))}
          </>}

          <button onClick={() => nav("/app/community")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: "#fff", boxShadow: SH.card, borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: C.tintPurple, color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="users" size={21} /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{t("Komunitas", "Community")}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t("Bagikan karya, cari teman tim", "Share work, find teammates")}</span></span>
            <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}><div style={{ fontSize: 17, fontWeight: 700 }}>{t("Portofolioku", "My Portfolio")}</div><button onClick={() => nav("/app/portfolio")} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>{t("Buka", "Open")}{extra?.pfCount ? ` (${extra.pfCount})` : ""}</button></div>
          {extra?.portfolio.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
              {extra.portfolio.map((it, i) => (
                <button key={it.id} onClick={() => nav("/app/portfolio")} style={{ border: "none", padding: 0, background: "none", cursor: "pointer", textAlign: "left" }}>
                  <ImgBox src={[IMG.cTurbines, IMG.oppComp, IMG.cHiker][i % 3]} h={84} r={14}>
                    <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "14px 7px 6px", background: "linear-gradient(180deg,transparent,rgba(15,23,42,.7))", color: "#fff", fontSize: 10, fontWeight: 600, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{it.title}</span>
                  </ImgBox>
                </button>
              ))}
            </div>
          ) : <div style={{ marginTop: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", fontSize: 12.5, color: C.muted, boxShadow: SH.card }}>{t("Selesaikan materi atau proyek — buktinya otomatis masuk ke sini.", "Finish a course or project — the evidence lands here automatically.")}</div>}
        </>}

        {tab === "ideas" && <>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 16 }}>{t("Ide proyek yang dipilih sesuai minat dan target kariermu.", "Projects picked for your interests and career target.")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {ideas.map((x, i) => {
              const [ic, c, bg] = AREA_STYLE[i % AREA_STYLE.length];
              return (
                <div key={x.t + i} style={{ background: "#fff", borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "center", boxShadow: SH.card }}>
                  <span style={{ width: 46, height: 46, borderRadius: 14, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={ic} size={22} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{x.t}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Untuk", "For")} {x.d}</div></div>
                  <button onClick={() => create(x.t, x.f)} style={{ height: 34, border: "none", borderRadius: 11, background: C.tintBlue, color: C.blue, fontSize: 12.5, fontWeight: 600, padding: "0 13px", cursor: "pointer", flex: "none" }}>{t("Mulai", "Start")}</button>
                </div>
              );
            })}
            {!ideas.length && <Empty icon="bulb" title={t("Belum ada ide", "No ideas yet")} body={t("Pilih target karier untuk mendapat ide proyek.", "Pick a career target to get project ideas.")} action={<Btn h={44} onClick={() => nav("/app/discover")}>{t("Pilih karier", "Pick a career")}</Btn>} />}
          </div>
        </>}

        {tab === "done" && (
          finished.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
              {finished.map(p => (
                <button key={p.id} onClick={() => nav(`/app/projects/${p.id}`)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 12, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
                  <ImgBox src={careerImg(p.field, p.id)} w={60} h={60} r={13} />
                  <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{p.title}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t("Masuk portofolio", "In your portfolio")}</span></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "4px 10px", borderRadius: 99 }}>{t("Selesai", "Done")}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 30, textAlign: "center", color: C.muted, fontSize: 13 }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 12px", borderRadius: 20, background: C.tintBlue, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="upload" size={28} /></div>
              {t("Belum ada proyek selesai.", "No completed projects yet.")}<br />{t("Lengkapi tahapannya lalu tandai selesai.", "Complete the milestones, then mark it done.")}
            </div>
          )
        )}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("Proyek baru", "New project")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input placeholder={t("Judul · Prediksi Kualitas Udara Jakarta", "Title · Jakarta Air Quality Prediction")} value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder={t("Bidang · Sustainability", "Field · Sustainability")} value={field} onChange={e => setField(e.target.value)} />
          <Btn disabled={title.trim().length < 2} onClick={() => create()}>{t("Buat proyek", "Create project")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── PROJECT DETAIL + AI COACH ──────────────────────────────────────── */
const COACH: { k: "problem" | "roadmap" | "research" | "portfolio"; id: string; en: string }[] = [
  { k: "problem", id: "Rumuskan masalah", en: "Define problem" }, { k: "roadmap", id: "Buat roadmap", en: "Create roadmap" },
  { k: "research", id: "Pertanyaan riset", en: "Research questions" }, { k: "portfolio", id: "Deskripsi portofolio", en: "Portfolio description" },
];
function ProjectWorkspace() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, toast, afterAction, track } = useApp();
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [coach, setCoach] = useState<(typeof COACH)[number]["k"] | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);
  const [coachEditing, setCoachEditing] = useState(false);
  const [coachText, setCoachText] = useState("");
  const [linkSheet, setLinkSheet] = useState(false); const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState("image/*,video/*,.pdf,.csv,.ipynb,.zip,.txt");
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
  if (!p) return <Screen><Header title={t("Proyek", "Project")} /><div style={{ padding: 20 }}><Empty title={t("Proyek tidak ditemukan", "Project not found")} /></div></Screen>;

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
  const progress = p.status === "completed" ? 100 : Math.max(p.progress, autoProgress);

  const upload = async (f: File) => {
    try {
      const path = await uploadEvidence(user!.id, `project-${id}`, f);
      const kind = f.type.startsWith("image") ? "photo" : f.type.startsWith("video") ? "video" : "file";
      await db.from("project_evidence").insert({ project_id: id, user_id: user!.id, kind, name: f.name, storage_path: path });
      track("evidence_added", { source: "project" });
      refresh(); await afterAction(t("Bukti proyek ditambahkan", "Project evidence added"));
    } catch (e) { toast(errMsg(e, t("Gagal mengunggah", "Upload failed")), "error"); }
  };
  const addLink = async () => {
    if (!/^https?:\/\//.test(link)) { toast(t("Link harus diawali https://", "Link must start with https://"), "error"); return; }
    await db.from("project_evidence").insert({ project_id: id, user_id: user!.id, kind: "link", name: link.replace(/^https?:\/\//, "").slice(0, 60), url: link });
    setLink(""); setLinkSheet(false); refresh(); await afterAction(t("Bukti proyek ditambahkan", "Project evidence added"));
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
    await afterAction(t("Proyek selesai", "Project completed"));
  };

  // Tahapan = bagian proyek yang harus diisi; yang pertama kosong adalah tahap "sekarang".
  const MS: { k: string; id: string; en: string; ph: string; phEn: string }[] = [
    { k: "problem", id: "Rumuskan masalah", en: "Define the problem", ph: "Masalah apa yang ingin kamu selesaikan?", phEn: "What problem are you solving?" },
    { k: "solution", id: "Rancang solusi", en: "Design the solution", ph: "Solusi yang kamu bangun", phEn: "The solution you're building" },
    { k: "result", id: "Uji & catat hasil", en: "Test & record results", ph: "Hasil & angka yang kamu capai", phEn: "Results & numbers achieved" },
    { k: "reflection", id: "Refleksi", en: "Reflect", ph: "Apa tantangan terbesarnya?", phEn: "What was the biggest challenge?" },
  ];
  const curK = MS.find(m => !p[m.k])?.k;
  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
  const editor = (k: string, ph: string) => (
    <div style={{ marginTop: 8 }}>
      <TextArea autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder={ph} style={{ height: 84 }} />
      <div style={{ marginTop: 6, display: "flex", gap: 8 }}><Btn h={38} onClick={commit} style={{ flex: 1 }}>{t("Simpan", "Save")}</Btn><Btn kind="outline" h={38} onClick={() => setEdit(null)} style={{ flex: 1 }}>{t("Batal", "Cancel")}</Btn></div>
    </div>
  );
  const listField = (k: "skills" | "tools" | "team", label: string, ph: string) => (
    <div style={{ padding: "12px 0", borderTop: `1px solid ${C.track}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{label}</span>{edit !== k && <button onClick={() => startEdit(k, p[k])} style={{ border: "none", background: "none", color: C.blue, fontSize: 11.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><Icon name="pencil" size={12} />{t("Ubah", "Edit")}</button>}</div>
      {edit === k ? editor(k, ph) : (
        <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 6 }}>{(p[k] || []).length ? p[k].map((s: string) => <span key={s} style={{ fontSize: 11.5, fontWeight: 500, color: k === "tools" ? C.text2 : C.blue, background: k === "tools" ? C.soft : C.tintBlue, padding: "4px 10px", borderRadius: 99 }}>{s}</span>) : <span style={{ fontSize: 12.5, color: C.faint }}>{ph}</span>}</div>
      )}
    </div>
  );
  const EV = [
    { k: "photo", icon: "image", id: "Foto", en: "Photo", acc: "image/*" }, { k: "video", icon: "video", id: "Video", en: "Video", acc: "video/*" },
    { k: "file", icon: "file", id: "File", en: "File", acc: ".pdf,.csv,.ipynb,.zip,.txt" }, { k: "link", icon: "link", id: "Link", en: "Link", acc: "" },
  ];
  const team: string[] = p.team || [];
  const coachLatest = coach ? coachText : (data!.notes[0]?.content ?? null);

  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => nav(-1)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.25 }}>{p.title}</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>{team.length ? t("Proyek tim", "Team project") : t("Proyek pribadi", "Solo project")}{p.field ? ` · ${p.field}` : ""}</div>
        </div>
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex" }}>
            <Avatar name={profile?.full_name} src={profile?.avatar_url} size={34} ring="#fff" />
            {team.slice(0, 2).map((n, i) => <span key={n} style={{ marginLeft: -10 }}><Avatar name={n} size={34} ring="#fff" bg={[C.tintPurple, C.tintYellow][i]} fg={[C.purple, C.amber][i]} /></span>)}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[(profile?.full_name || "").split(" ")[0], ...team].filter(Boolean).join(", ")}</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: p.status === "completed" ? C.green : C.blue }}>{progress}%</span>
        </div>
        <input type="range" min={0} max={100} step={10} value={progress} onChange={e => save({ progress: +e.target.value })} aria-label={t("Progres proyek", "Project progress")} style={{ width: "100%", marginTop: 10, accentColor: C.blue }} />

        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 14 }}>{t("Tahapan", "Milestones")}</div>
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {MS.map((m, i) => {
            const ok = !!p[m.k]; const cur = m.k === curK;
            return (
              <div key={m.k} style={{ padding: "11px 0", borderBottom: i < MS.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => edit === m.k ? setEdit(null) : startEdit(m.k, p[m.k])}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: ok ? C.green : cur ? C.tintBlue : "#fff", border: `2px solid ${ok ? C.green : cur ? C.blue : C.line}`, color: ok ? "#fff" : cur ? C.blue : C.faint, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{ok ? <Icon name="check" size={13} /> : i + 1}</span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: ok || cur ? C.text : C.muted }}>{t(m.id, m.en)}</span>
                  {cur && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{t("Sekarang", "Current")}</span>}
                  {!cur && <span style={{ color: C.faint, display: "flex" }}><Icon name={edit === m.k ? "down" : "pencil"} size={14} /></span>}
                </div>
                {edit === m.k ? editor(m.k, t(m.ph, m.phEn)) : ok && <div style={{ margin: "6px 0 0 38px", fontSize: 12.5, lineHeight: 1.5, color: C.text2 }}>{p[m.k]}</div>}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{t("Bukti", "Evidence")}</div><span style={{ fontSize: 12, color: C.muted }}>{data!.ev.length} {t("ditambahkan", "added")}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 10 }}>
          {EV.map(e => {
            const n = data!.ev.filter(x => x.kind === e.k).length;
            return (
              <button key={e.k} onClick={() => { if (e.k === "link") { setLinkSheet(true); return; } setAccept(e.acc); setTimeout(() => fileRef.current?.click(), 0); }}
                style={{ height: 84, border: `1.5px dashed ${n ? C.green : C.lightBlue}`, background: n ? C.tintGreen : "#fff", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", color: n ? C.green : C.blue }}>
                <Icon name={e.icon} size={22} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>{t(e.id, e.en)}</span><span style={{ fontSize: 9.5, opacity: .8 }}>{n ? t(`${n} ditambah`, `${n} added`) : t("Tambah", "Add")}</span>
              </button>
            );
          })}
        </div>
        <input ref={fileRef} type="file" hidden accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        {data!.ev.length > 0 && (
          <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
            {data!.ev.map((e, i) => (
              <button key={e.id} onClick={() => openEv(e)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 0", border: "none", borderBottom: i < data!.ev.length - 1 ? `1px solid ${C.track}` : "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: C.soft, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={({ photo: "image", video: "video", file: "file", link: "link" } as any)[e.kind] ?? "file"} size={15} /></span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                <span style={{ color: C.faint, display: "flex" }}><Icon name="right" size={14} /></span>
              </button>
            ))}
          </div>
        )}

        <div style={{ ...card, padding: "2px 16px 4px", marginTop: 14 }}>
          {listField("skills", t("Skill yang dipakai", "Skills used"), "Python, Data analysis…")}
          {listField("tools", "Tools", "Google Colab, Figma…")}
          {listField("team", t("Anggota tim", "Team"), t("Nama anggota tim, pisahkan dengan koma", "Team members, comma separated"))}
        </div>

        {/* AI feedback */}
        <div style={{ background: C.navy, borderRadius: 18, padding: 14, marginTop: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <img src={TIKA} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("MASUKAN AI · DRAF", "AI FEEDBACK · DRAFT")}</span>
                {coach && coachText && <button onClick={() => (coachEditing ? saveCoach() : setCoachEditing(true))} style={{ border: "none", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, cursor: "pointer" }}>{coachEditing ? t("Selesai", "Done") : t("Ubah", "Edit")}</button>}
              </div>
              {coachBusy ? <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.7)" }}>●●●</div> : coachEditing ? (
                <textarea value={coachText} onChange={e => setCoachText(e.target.value)} style={{ marginTop: 7, width: "100%", height: 110, border: `1.5px solid ${C.lightBlue}`, borderRadius: 11, padding: "9px 11px", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, color: "#fff", background: "rgba(255,255,255,.06)", resize: "none", outline: "none" }} />
              ) : <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,.9)", whiteSpace: "pre-wrap" }}>{coachLatest ?? t("Pilih bantuan di bawah — Tika akan memberi masukan untuk proyekmu.", "Pick a prompt below — Tika will give feedback on your project.")}</div>}
              {coach === "portfolio" && coachText && !coachEditing && <button onClick={() => save({ solution: p.solution ?? coachText })} style={{ marginTop: 8, border: "none", background: "none", color: C.mint, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{t("Pakai sebagai deskripsi solusi →", "Use as solution description →")}</button>}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {COACH.map(c => <button key={c.k} onClick={() => ask(c.k)} style={{ border: "none", borderRadius: 99, background: coach === c.k ? C.blue : "rgba(255,255,255,.1)", color: "#fff", fontSize: 12, fontWeight: 500, padding: "7px 12px", cursor: "pointer" }}>{t(c.id, c.en)}</button>)}
          </div>
        </div>

        {p.status !== "completed" ? <>
          <Btn disabled={!p.problem || !p.solution} onClick={complete} style={{ marginTop: 16 }}>{t("Tandai selesai & masukkan ke Portofolio", "Mark complete & add to Portfolio")} <Icon name="upload" size={18} /></Btn>
          {(!p.problem || !p.solution) && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: 6 }}>{t("Isi tahap masalah & solusi untuk menyelesaikan proyek.", "Fill the problem & solution milestones to complete the project.")}</div>}
        </> : <Btn kind="success" onClick={() => nav("/app/portfolio")} style={{ marginTop: 16 }}>{t("Selesai · Lihat di Portofolio", "Completed · View in Portfolio")} <Icon name="right" size={18} /></Btn>}
        <Btn kind="ghost" h={40} onClick={async () => { if (confirm(t("Hapus proyek ini?", "Delete this project?"))) { await db.from("projects").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["m-projects"] }); nav("/app/projects", { replace: true }); } }} style={{ color: C.red, fontSize: 12.5, marginTop: 6 }}>{t("Hapus proyek", "Delete project")}</Btn>
      </div>
      <Sheet open={linkSheet} onClose={() => setLinkSheet(false)} title={t("Tambah link bukti", "Add evidence link")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Input icon="link" placeholder="https://github.com/…" value={link} onChange={e => setLink(e.target.value)} /><Btn onClick={addLink}>{t("Tambah", "Add")}</Btn></div>
      </Sheet>
    </Screen>
  );
}

/* ── PLAYBOOKS ──────────────────────────────────────────────────────── */
function Playbooks() {
  const { t, user, isPro, toast, profile } = useApp();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const [buy, setBuy] = useState<any>(null);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (params.get("payment") !== "success") return;
    toast(t("Pembayaran diterima — playbook aktif setelah konfirmasi", "Payment received — playbook unlocks after confirmation"));
    // Cek ulang ke Mayar lewat server beberapa kali, lalu muat ulang daftar playbook
    const ref = params.get("ref");
    let n = 0;
    const iv = setInterval(async () => {
      await cekPembayaran(ref);
      qc.invalidateQueries({ queryKey: ["m-playbooks"] });
      if (++n >= 8) clearInterval(iv);
    }, 6000);
    return () => clearInterval(iv);
  }, []); // eslint-disable-line
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
    toast(t(`${p.title} ditambahkan ke Rencana 90 Hari`, `${p.title} added to your 90-Day Plan`));
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
      <Header title="Talentika Playbooks" sub={t("Panduan yang terhubung ke roadmap-mu", "Guides linked to your roadmap")} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {!isLoading && !data?.length && <Empty icon="book" title={t("Playbook sedang disiapkan", "Playbooks are on the way")} body={t("THE FUTURE OF™, THE STEM ACHIEVEMENT™, dan panduan beasiswa akan tersedia di sini.", "THE FUTURE OF™, THE STEM ACHIEVEMENT™ and scholarship guides will be available here.")} />}
        {data?.map((p: any) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: 18, padding: 12, display: "flex", gap: 13, alignItems: "center", boxShadow: SH.card }}>
            <div style={{ width: 60, height: 78, borderRadius: 10, background: p.color, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 8, flex: "none", boxShadow: "0 4px 10px rgba(15,23,42,.18)", position: "relative", overflow: "hidden" }}>
              {p.cover_url && <img src={p.cover_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} />}
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".6px", opacity: 0.8 }}>TALENTIKA</span>
              <span style={{ fontSize: 15, fontWeight: 800 }}>{p.title.replace(/[™&]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("")}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ marginTop: 3, fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{p.description}</div>
              <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: p.owned ? C.green : C.text }}>{p.owned ? (p.price === 0 ? t("Gratis", "Free") : p.free_for_pro && isPro ? t("Gratis untuk Plus", "Free for Plus") : t("Dimiliki", "Owned")) : canPurchase() ? rpShort(p.price) : t("Belum dimiliki", "Not owned")}</span>
                {p.owned ? (<>
                  <button onClick={() => read(p)} style={{ border: "none", background: C.tintBlue, color: C.blue, fontSize: 12, fontWeight: 600, padding: "7px 11px", borderRadius: 99, cursor: "pointer" }}>{t("Baca", "Read")}</button>
                  <button onClick={() => addPlan(p)} style={{ border: "none", background: C.tintGreen, color: C.green, fontSize: 12, fontWeight: 600, padding: "7px 11px", borderRadius: 99, cursor: "pointer" }}>+ {t("Rencana", "Plan")}</button>
                </>) : canPurchase() && <button onClick={() => setBuy(p)} style={{ border: "none", background: C.blue, color: "#fff", fontSize: 12, fontWeight: 600, padding: "7px 13px", borderRadius: 99, cursor: "pointer" }}>{t("Beli", "Buy")}</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Sheet open={!!buy} onClose={() => setBuy(null)} title={buy?.title}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Total: {buy && rpShort(buy.price)}</div>
          <Label>{t("Nomor HP (untuk konfirmasi pembayaran)", "Phone (for payment confirmation)")}</Label>
          <Input type="tel" icon="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08…" />
          <Btn disabled={busy || phone.replace(/\D/g, "").length < 9} onClick={pay}>{t("Bayar via Mayar", "Pay via Mayar")}</Btn>
          <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="lock" size={12} />GoPay · QRIS · Transfer bank · Kartu</div>
        </div>
      </Sheet>
    </Screen>
  );
}
