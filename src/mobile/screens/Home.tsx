import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, canPurchase, db, useApp, useCareers, useDna, useOpportunities, useReadiness, useSkills, useTracker } from "../store";
import { Avatar, BrandBar, Empty, Header, Icon, IconBtn, ImgBox, Loading, LOGO, Screen, SectionHead, Skeleton, TIKA as TIKA_SRC } from "../ui";
import { C, SH, daysUntil } from "../theme";
import { deepLink, fmtDate, notifCat, oppMatch, oppTypeOf, READINESS_META, timeAgo, TYPE_ID } from "../logic";
import { editionOf } from "../MobileApp";
import { careerImg, courseImg, oppImg } from "../media";
import heroBoy from "../assets/v3/hero-boy.webp";

export default function Home({ screen }: { screen: "home" | "notif" | "readiness" | "recap" }) {
  if (screen === "notif") return <Notifications />;
  if (screen === "readiness") return <Readiness />;
  if (screen === "recap") return <Recap />;
  return <HomeScreen />;
}

/** Level & XP sesuai rumus server (_berikan_xp): level = max(1, floor(sqrt(xp/100))). */
export function levelInfo(xp: number) {
  const lvl = Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)));
  const lo = lvl === 1 ? 0 : lvl * lvl * 100, hi = (lvl + 1) * (lvl + 1) * 100;
  return { lvl, inLvl: xp - lo, span: hi - lo, pct: Math.round(((xp - lo) / (hi - lo)) * 100) };
}

function useHomeData() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-home", user?.id], enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [lp, proj, ach, certs, notif, ch, rec, mentors, myCh, xp, streak] = await Promise.all([
        db.from("learning_progress").select("content_id,status,progress_percentage,last_accessed_at,learning_content(title,thumbnail_url,difficulty_level)").eq("user_id", uid).order("last_accessed_at", { ascending: false }).limit(10),
        db.from("projects").select("id,title,status,progress,field").eq("user_id", uid).order("updated_at", { ascending: false }),
        db.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false),
        db.from("community_challenges").select("id,title,xp_reward,end_date").eq("is_active", true).or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`).order("end_date", { ascending: true, nullsFirst: false }).limit(1),
        db.rpc("my_learning_recommendations", { p_limit: 2 }),
        db.from("mentors").select("id,name,title,company,avatar_url").eq("is_available", true).order("total_sessions", { ascending: false }).limit(1),
        db.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["submitted", "completed"]),
        db.from("user_xp").select("current_xp,current_level").eq("user_id", uid).maybeSingle(),
        db.from("user_streaks").select("streak_type,current_streak").eq("user_id", uid),
      ]);
      const st = (streak.data ?? []) as { streak_type: string; current_streak: number }[];
      return {
        learning: (lp.data ?? []) as any[], projects: (proj.data ?? []) as any[], achievements: ach.count ?? 0, certificates: certs.count ?? 0,
        unread: notif.count ?? 0, challenge: (ch.data ?? [])[0] ?? null, recs: (rec.data ?? []) as any[], mentor: (mentors.data ?? [])[0] ?? null, challengesDone: myCh.count ?? 0,
        xp: (xp.data?.current_xp ?? 0) as number,
        streak: Math.max(0, ...st.filter(s => s.streak_type === "learning" || s.streak_type === "login").map(s => s.current_streak ?? 0)),
      };
    },
  });
}

function useWeek() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-week", user?.id], enabled: !!user, staleTime: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [xl, done, ach] = await Promise.all([
        db.from("xp_ledger").select("amount").eq("user_id", user!.id).gte("created_at", since),
        db.from("learning_progress").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("completed_at", since),
        db.from("user_achievements").select("title").eq("user_id", user!.id).gte("created_at", since).limit(3),
      ]);
      return { xp: ((xl.data ?? []) as any[]).reduce((s, r) => s + Math.max(0, r.amount ?? 0), 0), lessons: done.count ?? 0, badges: (ach.data ?? []) as { title: string }[] };
    },
  });
}

/* ── HOME · GROWTH HUB ──────────────────────────────────────────────── */
function HomeScreen() {
  const nav = useNavigate();
  const { t, lang, profile, isPro, gam } = useApp();
  const { dna, isNew, isLoading: dnaLoading } = useDna();
  const { data: rd } = useReadiness();
  const { data: home } = useHomeData();
  const { data: week } = useWeek();
  const { data: tracker } = useTracker();
  const { data: skills } = useSkills();
  const { careers } = useCareers();
  const { data: opps } = useOpportunities();
  const first = (profile?.full_name || "").split(" ")[0] || t("kamu", "there");
  const target = careers.find(c => c.id === profile?.career_target) ?? null;
  const pro = editionOf(profile?.jenjang) === "pro";

  const active = (tracker ?? []).filter(o => !["accepted", "completed", "rejected"].includes(o.status) && o.deadline && (daysUntil(o.deadline) ?? -1) >= 0)
    .sort((a, b) => +new Date(a.deadline!) - +new Date(b.deadline!));
  const inprog = home?.learning.find((l: any) => l.status !== "completed");

  // Langkah berikutnya — dipilih aturan, kalimatnya dipoles AI
  const step = useMemo(() => {
    if (isNew) return { text: t("Ikuti Talent Discovery untuk membuka rekomendasi yang personal.", "Take Talent Discovery to unlock personalized recommendations."), label: "Talent Discovery", to: "/app/dna", key: "dna" };
    const urgent = active.find(o => (daysUntil(o.deadline) ?? 99) <= 3 && ["saved", "preparing"].includes(o.status));
    if (!profile?.career_target) return { text: t("Pilih satu target karier supaya rekomendasi belajar & peluangmu makin tajam.", "Pick a career target so your learning and opportunity picks get sharper."), label: t("Pilih target karier", "Pick a career target"), to: "/app/discover", key: "target" };
    if (urgent) return { text: t(`${urgent.opportunity_title} tutup ${daysUntil(urgent.deadline)} hari lagi — lengkapi checklist-mu sekarang.`, `${urgent.opportunity_title} closes in ${daysUntil(urgent.deadline)} days — finish your checklist now.`), label: urgent.opportunity_title, to: `/app/opportunities/${urgent.opportunity_id}`, key: "urgent:" + urgent.opportunity_id };
    if (inprog) return { text: t(`Lanjutkan ${inprog.learning_content?.title ?? "materimu"} untuk memperkuat jalur ${target?.name ?? "karier"}-mu.`, `Continue ${inprog.learning_content?.title ?? "your course"} to strengthen your ${target?.name ?? "career"} pathway.`), label: inprog.learning_content?.title ?? t("Lanjutkan materi", "Continue course"), to: `/app/course/${inprog.content_id}`, key: "course:" + inprog.content_id };
    if (!home?.projects.length) return { text: t("Mulai satu proyek kecil — bukti nyata menaikkan Career Readiness paling cepat.", "Start a small project — real evidence raises Career Readiness fastest."), label: t("Mulai proyek pertama", "Start your first project"), to: "/app/projects", key: "project" };
    return { text: t("Cek peluang yang cocok minggu ini dan simpan satu ke Tracker.", "Check this week's matched opportunities and save one to your Tracker."), label: t("Peluang minggu ini", "This week's opportunities"), to: "/app/explore", key: "opps" };
  }, [active, home, profile, target, t, isNew, inprog]);

  const [aiText, setAiText] = useState<string | null>(null);
  useEffect(() => {
    if (isNew || !home) return;
    const k = `tk-insight:${new Date().toDateString()}:${step.key}:${lang}`;
    const cached = localStorage.getItem(k);
    if (cached) { setAiText(cached); return; }
    askAi("insight", { input: step.text, lang }).then(r => { if (r.text) { setAiText(r.text); localStorage.setItem(k, r.text); } });
  }, [step.key, isNew, home, lang, step.text]);

  const matched = useMemo(() => {
    if (!opps?.length) return [];
    const ctx = { axes: dna?.axes, tujuan: profile?.tujuan, careerField: target?.field, careerName: target?.name, jenjang: profile?.jenjang };
    return opps.map(o => { const type = oppTypeOf(o.opportunity_type, o.title); const m = oppMatch({ ...o, type }, ctx); return { o, type, m: m.match, why: m.why[0] }; }).sort((a, b) => b.m - a.m);
  }, [opps, dna, profile, target]);

  const recs = [
    home?.recs[0] && { tag: t("Materi", "Learning"), tc: C.blue, tb: C.tintBlue, title: home.recs[0].title, sub: [home.recs[0].category_name, home.recs[0].difficulty_level].filter(Boolean).join(" · "), why: home.recs[0].reason || t("Cocok dengan minatmu", "Matches your interests"), img: courseImg(home.recs[0].thumbnail_url, home.recs[0].title), to: `/app/course/${home.recs[0].id}` },
    careers[0] && { tag: t("Wawasan Karier", "Career Insight"), tc: C.purple, tb: C.tintPurple, title: careers[0].name, sub: careers[0].fit ? t(`${careers[0].fit}% cocok`, `${careers[0].fit}% match`) : t("Jelajahi", "Explore"), why: t("Sesuai profil talentamu", "Fits your talent profile"), img: careerImg(careers[0].field, careers[0].id), to: `/app/careers/${careers[0].id}` },
    matched[0] && { tag: TYPE_ID[matched[0].type], tc: C.orange, tb: C.tintOrange, title: matched[0].o.title, sub: matched[0].o.deadline ? t(`Tutup ${fmtDate(matched[0].o.deadline, lang, { day: "numeric", month: "short" })}`, `Closes ${fmtDate(matched[0].o.deadline, lang, { day: "numeric", month: "short" })}`) : matched[0].o.organizer ?? "", why: matched[0].why, img: oppImg(matched[0].type, matched[0].o.poster_url, matched[0].o.id), to: `/app/opportunities/${matched[0].o.id}` },
    home?.mentor && { tag: "Mentor", tc: C.green, tb: C.tintGreen, title: home.mentor.name, sub: [home.mentor.title, home.mentor.company].filter(Boolean).join(" · "), why: t("Bisa bantu rencana kariermu", "Can help with your career plan"), img: home.mentor.avatar_url || null, to: `/app/mentors/${home.mentor.id}` },
  ].filter(Boolean) as any[];

  const upcoming = active.length
    ? active.slice(0, 2).map(o => { const type = oppTypeOf(o.opportunity_type, o.opportunity_title); const src = opps?.find(x => x.id === o.opportunity_id); return { id: o.opportunity_id, type, title: o.opportunity_title, org: src?.organizer ?? t("Disimpan di Tracker", "Saved in Tracker"), dl: o.deadline, img: oppImg(type, src?.poster_url, o.opportunity_id) }; })
    : matched.slice(0, 2).map(x => ({ id: x.o.id, type: x.type, title: x.o.title, org: x.o.organizer ?? "", dl: x.o.deadline, img: oppImg(x.type, x.o.poster_url, x.o.id) }));

  const lv = levelInfo(home?.xp ?? 0);
  const proj = home?.projects.find((p: any) => p.status !== "completed") ?? home?.projects[0];
  const typeColor: Record<string, [string, string]> = { Scholarship: [C.blue, C.tintBlue], Competition: [C.purple, C.tintPurple], Internship: [C.sky, C.tintSky], Global: [C.green, C.tintGreen], Research: [C.orange, C.tintOrange], Bootcamp: [C.orange, C.tintOrange] };

  return (
    <Screen tab>
      <BrandBar right={<>
        <IconBtn icon="bell" label={t("Notifikasi", "Notifications")} onClick={() => nav("/app/notifications")} badge={(home?.unread ?? 0) > 0} />
        <button onClick={() => nav("/app/profile")} aria-label={t("Profil", "Profile")} style={{ border: "none", padding: 0, background: "none", cursor: "pointer", borderRadius: "50%", boxShadow: "0 2px 10px rgba(15,23,42,.12)" }}>
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size={42} ring="#fff" />
        </button>
      </>} />
      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.6px", marginTop: 18 }}>{t(`Halo, ${first}!`, `Hello, ${first}!`)}</div>
        <div style={{ fontSize: 13.5, color: C.text3, marginTop: 2 }}>{t("Ayo jelajahi, belajar, dan bangun masa depan cerah bersama.", "Let's explore, learn, and create a brighter future together.")}</div>
        <button onClick={() => nav("/app/explore")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, height: 50, background: "#fff", border: "none", borderRadius: 16, padding: "0 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(15,23,42,.05)", cursor: "pointer", textAlign: "left" }}>
          <span style={{ color: C.muted, display: "flex" }}><Icon name="search" size={18} /></span>
          <span style={{ flex: 1, fontSize: 13, color: C.faint }}>{t("Cari karier, peluang, mentor…", "Search careers, opportunities, mentors…")}</span>
          <span style={{ color: C.text, display: "flex" }}><Icon name="sliders" size={18} /></span>
        </button>

        {/* Hero: langkah berikutnya */}
        {dnaLoading ? <div style={{ marginTop: 14 }}><Skeleton h={200} r={24} /></div> : (
          <div style={{ position: "relative", marginTop: 14, borderRadius: 24, overflow: "hidden", background: "linear-gradient(120deg,#DCEBFF 0%,#EAF4FF 55%,#CFE3FF 100%)", minHeight: 200, padding: 18 }}>
            <img src={heroBoy} alt="" style={{ position: "absolute", right: -6, bottom: 0, height: "100%", width: "44%", objectFit: "cover", objectPosition: "center top" }} />
            <span style={{ position: "absolute", right: "46%", top: 20, color: C.yellow, display: "flex" }}><Icon name="sparkle" size={22} /></span>
            <div style={{ position: "relative", width: "58%" }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.5px" }}>{pro ? t("Luncurkan", "Launch") : t("Jelajahi", "Explore")}<br /><span style={{ color: C.blue }}>{pro ? t("Kariermu", "Your Career") : t("Potensimu", "Your Potential")}</span></div>
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: C.text2, marginTop: 7 }}>{pro ? t("Tutup skill gap, buktikan skill, raih magang & kerja.", "Close skill gaps, prove your skills, reach internships and jobs.") : t("Belajar personal, peluang nyata, masa depan cerah.", "Personalized learning, real-world opportunities, a brighter future.")}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: C.blue, background: "#fff", borderRadius: 10, padding: "6px 9px", marginTop: 9, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{t("Berikutnya: ", "Next: ")}{step.label}</div>
              <button onClick={() => nav(step.to)} style={{ marginTop: 10, minHeight: 40, border: "none", borderRadius: 12, background: C.blue, color: "#fff", fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, textAlign: "left", padding: "8px 14px", display: "flex", alignItems: "center", gap: 7, cursor: "pointer", boxShadow: "0 8px 18px rgba(0,102,255,.3)" }}>
                {t("Mulai Langkah Berikutnya", "Start Your Next Step")} <Icon name="right" size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Aksi cepat */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginTop: 16 }}>
          {[[t("Profil Talenta", "Talent Profile"), "user", C.tintBlue, C.blue, "/app/dna/result"], [t("Belajar", "Learn"), "book", C.tintSky, C.sky, "/app/learn"], [t("Jalur Karier", "Career Paths"), "chart", C.tintYellow, C.orange, "/app/discover"], [t("Peluang", "Opportunities"), "trophy", "#FDF1DC", C.orange, "/app/explore"]].map(([label, icon, bg, c, to]) => (
            <button key={to} onClick={() => nav(to)} style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer", padding: 0 }}>
              <span style={{ width: 58, height: 58, borderRadius: 18, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={26} /></span>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.text, textAlign: "center", lineHeight: 1.25 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Level & streak */}
        {gam && home && (
          <div style={{ marginTop: 16, background: "#fff", borderRadius: 20, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: SH.card }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 11.5, fontWeight: 700, background: C.yellow, color: C.text, padding: "3px 10px", borderRadius: 99 }}>Level {lv.lvl}</span><span style={{ fontSize: 11.5, color: C.muted }}>{lv.inLvl} / {lv.span} XP</span></div>
              <div style={{ height: 8, borderRadius: 99, background: C.track, marginTop: 9 }}><div style={{ width: `${lv.pct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#0066FF,#00C6EF)", transition: "width .4s" }} /></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.tintYellow, borderRadius: 14, padding: "8px 11px" }}>
              <span style={{ color: C.amber, display: "flex" }}><Icon name="flame" size={20} /></span>
              <div><div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{home.streak}</div><div style={{ fontSize: 9.5, color: "#7A5200" }}>{t("hari beruntun", "day streak")}</div></div>
            </div>
          </div>
        )}

        {/* Career readiness */}
        {!isNew && rd && (
          <button onClick={() => nav("/app/readiness")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: C.navy, borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.1)", color: C.cyan, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="target" size={26} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Career Readiness{target ? ` · ${target.name}` : ""}</span>
              <span style={{ display: "block", fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>{rd.score}%</span>
              <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,.75)" }}>{(rd.week_delta ?? 0) >= 0 ? "+" : ""}{rd.week_delta ?? 0} {t("minggu ini · ketuk untuk menaikkan", "this week · tap to improve")}</span>
            </span>
            <span style={{ color: "#fff", display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}

        {/* Rekap mingguan */}
        {!isNew && week && (
          <button onClick={() => nav("/app/recap")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: "linear-gradient(120deg,#FDECEF,#FFF1F4)", borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="chart" size={22} /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{t("Rekap mingguanmu siap", "Your weekly recap is ready")}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "#9F1239", marginTop: 2 }}>+{week.xp} XP · {week.lessons} {t("materi selesai", "lessons done")}{week.badges.length ? ` · ${week.badges.length} ${t("prestasi baru", "new badge")}` : ""}</span>
            </span>
            <span style={{ color: "#9F1239", display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}

        {/* Lanjutkan belajar */}
        <SectionHead action={t("Lihat Semua", "See All")} onAction={() => nav("/app/learn")} style={{ marginTop: 20 }}>{t("Lanjutkan Belajar", "Continue Learning")}</SectionHead>
        {inprog ? (
          <button onClick={() => nav(`/app/course/${inprog.content_id}`)} style={{ width: "100%", textAlign: "left", marginTop: 10, border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
            <ImgBox src={courseImg(inprog.learning_content?.thumbnail_url, inprog.learning_content?.title ?? "")} w={70} h={70} r={14} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inprog.learning_content?.title ?? t("Materi", "Course")}</span>
              <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{inprog.progress_percentage ?? 0}% {t("selesai", "done")}{inprog.learning_content?.difficulty_level ? ` · ${inprog.learning_content.difficulty_level}` : ""}</span>
              <span style={{ display: "block", height: 6, borderRadius: 99, background: C.track, marginTop: 8 }}><span style={{ display: "block", width: `${inprog.progress_percentage ?? 0}%`, height: "100%", borderRadius: 99, background: C.blue }} /></span>
            </span>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="play" size={15} filled /></span>
          </button>
        ) : (
          <button onClick={() => nav("/app/learn")} style={{ width: "100%", textAlign: "left", marginTop: 10, border: `1.5px dashed ${C.lightBlue}`, background: "#fff", borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: C.tintBlue, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="book" size={22} /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{t("Pilih materi pertamamu", "Pick your first course")}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t("Jalur belajar disesuaikan dengan profilmu", "Learning paths matched to your profile")}</span></span>
            <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}

        {/* Skill */}
        {!!skills?.length && <>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 20 }}>{t("Skill yang Berkembang", "Skills in Progress")}</div>
          <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginTop: 10, display: "flex", flexDirection: "column", gap: 11, boxShadow: SH.card }}>
            {skills.slice(0, 3).map((s, i) => {
              const c = [C.blue, C.purple, C.orange][i];
              const pct = Math.max(0, Math.min(100, Math.round(s.level)));
              return (
                <div key={s.skill} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 118, fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.skill}</span>
                  <div style={{ flex: 1, height: 7, borderRadius: 99, background: C.track }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: c }} /></div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: C.muted, width: 32, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </>}

        {/* Proyek */}
        <SectionHead action={t("Lihat Semua", "See All")} onAction={() => nav("/app/projects")} style={{ marginTop: 20 }}>{t("Proyek Saat Ini", "Current Project")}</SectionHead>
        <button onClick={() => nav(proj ? `/app/projects/${proj.id}` : "/app/projects")} style={{ width: "100%", textAlign: "left", marginTop: 10, border: "none", background: "linear-gradient(120deg,#FFF6DB,#FFEBB0)", borderRadius: 18, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="folder" size={22} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{proj ? proj.title : t("Mulai proyek pertamamu", "Start your first project")}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "#7A5200", marginTop: 2 }}>{proj ? `${proj.progress ?? 0}% · ${proj.field ?? t("proyek", "project")}` : t("Bukti nyata untuk portofoliomu", "Real evidence for your portfolio")}</span>
          </span>
          <span style={{ color: "#7A5200", display: "flex" }}><Icon name="chev" size={18} /></span>
        </button>

        {/* Tika AI mentor */}
        {!isNew && (
          <button onClick={() => nav("/app/copilot")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: C.navy, borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <TikaFace />
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>TIKA · AI MENTOR</span>
              <span style={{ display: "block", fontSize: 13, lineHeight: 1.45, color: "#fff", marginTop: 3 }}>{aiText ?? step.text}</span>
            </span>
          </button>
        )}

        {/* Rekomendasi */}
        {recs.length > 0 && <>
          <SectionHead action={t("Lihat Semua", "See All")} onAction={() => nav("/app/explore")} style={{ marginTop: 20 }}>{t("Direkomendasikan untukmu", "Recommended for You")}</SectionHead>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "10px -20px 0", padding: "0 20px 4px" }}>
            {recs.map((r: any) => (
              <button key={r.to} onClick={() => nav(r.to)} style={{ flex: "none", width: 200, textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 0, overflow: "hidden", cursor: "pointer", boxShadow: SH.card }}>
                <ImgBox src={r.img} h={96} r={0} />
                <span style={{ display: "block", padding: "10px 12px 12px" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: r.tc, background: r.tb, padding: "3px 9px", borderRadius: 99 }}>{r.tag}</span>
                  <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 7, lineHeight: 1.3 } as any}>{r.title}</span>
                  <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.blue, marginTop: 6 }}><Icon name="sparkle" size={12} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.why}</span></span>
                </span>
              </button>
            ))}
          </div>
        </>}

        {/* Peluang */}
        {upcoming.length > 0 && <>
          <SectionHead action="Tracker" onAction={() => nav("/app/tracker")} style={{ marginTop: 20 }}>{t("Peluang Mendatang", "Upcoming Opportunities")}</SectionHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {upcoming.map(u => {
              const [c, bg] = typeColor[u.type] ?? [C.blue, C.tintBlue];
              const d = daysUntil(u.dl);
              return (
                <button key={u.id} onClick={() => nav(`/app/opportunities/${u.id}`)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
                  <ImgBox src={u.img} w={76} h={64} r={13} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: c, background: bg, padding: "2px 9px", borderRadius: 99 }}>{TYPE_ID[u.type]}</span>
                      <span style={{ fontSize: 11, color: d !== null && d <= 3 ? C.red : C.muted, whiteSpace: "nowrap" }}>{d === null ? t("Bergulir", "Rolling") : d === 0 ? t("Hari ini", "Today") : t(`${d} hari lagi`, `${d} days left`)}</span>
                    </span>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 5, lineHeight: 1.3 } as any}>{u.title}</span>
                    <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.org}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>}

        {!isPro && canPurchase() && (
          <button onClick={() => nav("/app/pro")} style={{ width: "100%", textAlign: "left", marginTop: 16, background: "#fff", border: `1.5px dashed ${C.lightBlue}`, borderRadius: 18, padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="star" size={20} filled /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>Talentika Plus</span><span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 2 }}>{t("Full Talent DNA, mentoring, Application Assistant", "Full Talent DNA, mentoring, Application Assistant")}</span></span>
            <span style={{ color: C.blue, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}
      </div>
    </Screen>
  );
}

function TikaFace({ size = 50 }: { size?: number }) {
  return <img src={TIKA_SRC} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />;
}

/* ── NOTIFIKASI ─────────────────────────────────────────────────────── */
const NSTYLE: Record<string, { icon: string; bg: string; c: string }> = {
  Opportunities: { icon: "cal", bg: C.tintYellow, c: C.orange }, Mentorship: { icon: "users", bg: C.tintPurple, c: C.purple },
  Achievement: { icon: "trophy", bg: C.tintBlue, c: C.blue }, "AI Insight": { icon: "sparkle", bg: C.tintSky, c: C.sky },
  Learning: { icon: "book", bg: C.tintGreen, c: C.green }, Community: { icon: "msg", bg: C.tintRed, c: C.red },
};
function Notifications() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user } = useApp();
  const { data, isLoading } = useQuery({
    queryKey: ["m-notifs", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("notifications").select("id,title,message,type,is_read,action_url,created_at,metadata").eq("user_id", user!.id).neq("type", "promo").order("created_at", { ascending: false }).limit(80)).data ?? []) as any[],
  });
  const list = (data ?? []).map(n => ({ ...n, cat: notifCat(n.type) }));
  const unread = list.filter(n => !n.is_read).length;
  const open = async (n: any) => {
    if (!n.is_read) { await db.from("notifications").update({ is_read: true }).eq("id", n.id); qc.invalidateQueries({ queryKey: ["m-notifs"] }); qc.invalidateQueries({ queryKey: ["m-home"] }); }
    const to = n.metadata?.opportunity_id ? `/app/opportunities/${n.metadata.opportunity_id}` : deepLink(n.action_url);
    if (to) nav(to);
  };
  const readAll = async () => { await db.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false); qc.invalidateQueries({ queryKey: ["m-notifs"] }); qc.invalidateQueries({ queryKey: ["m-home"] }); };
  return (
    <Screen>
      <Header title={t("Notifikasi", "Notifications")} sub={t(`${unread} belum dibaca`, `${unread} unread`)}
        right={unread > 0 ? <button onClick={readAll} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Tandai dibaca", "Mark all read")}</button> : undefined} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {isLoading && <Loading />}
        {!isLoading && !list.length && <Empty icon="bell" title={t("Belum ada notifikasi", "No notifications yet")} body={t("Pengingat deadline, balasan mentor, dan insight akan muncul di sini.", "Deadline reminders, mentor replies and insights will appear here.")} />}
        {list.map(n => {
          const st = NSTYLE[n.cat] ?? NSTYLE.Learning;
          return (
            <button key={n.id} onClick={() => open(n)} style={{ width: "100%", textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", boxShadow: SH.card }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: st.bg, color: st.c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={st.icon} size={20} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{n.title}</span><span style={{ fontSize: 10.5, color: C.faint, whiteSpace: "nowrap" }}>{timeAgo(n.created_at, lang)}</span></span>
                <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: C.text3, marginTop: 2 }}>{n.message}</span>
              </span>
              {!n.is_read && <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.blue, flex: "none", marginTop: 6 }} />}
            </button>
          );
        })}
        <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center", fontSize: 11.5, color: C.muted, background: "#fff", borderRadius: 14, padding: "11px 13px" }}>
          <Icon name="clock" size={15} />{t("Jam tenang 21.00–06.00 untuk pelajar di bawah 18 tahun", "Quiet hours 21.00–06.00 for students under 18")}
        </div>
      </div>
    </Screen>
  );
}

/* ── CAREER READINESS · SKILL GAP ──────────────────────────────────── */
function Readiness() {
  const nav = useNavigate();
  const { t, lang, profile } = useApp();
  const { data: rd, isLoading } = useReadiness();
  const { careers } = useCareers();
  const target = careers.find(c => c.id === profile?.career_target);
  if (isLoading || !rd) return <Loading />;
  const ACT: Record<string, { t: string; en: string; d: string; dEn: string; to: string; icon: string; c: string; bg: string }> = {
    talent: { t: "Selesaikan 1 modul Talent DNA", en: "Complete 1 Talent DNA module", d: "Profil talenta lebih tajam", dEn: "Sharper talent profile", to: "/app/dna", icon: "sparkle", c: C.purple, bg: C.tintPurple },
    skill: { t: "Selesaikan 1 materi sampai tahap Prove", en: "Finish 1 course to the Prove stage", d: "Menutup gap skill terbesar", dEn: "Closes the biggest skill gap", to: "/app/learn", icon: "book", c: C.blue, bg: C.tintBlue },
    experience: { t: "Bangun 1 proyek", en: "Build 1 project", d: "Bukti portofolio · ~2 minggu", dEn: "Portfolio evidence · ~2 weeks", to: "/app/projects", icon: "folder", c: C.orange, bg: C.tintOrange },
    portfolio: { t: "Tambah bukti portofolio", en: "Add portfolio evidence", d: "Foto, video, file, atau tautan", dEn: "Photo, video, file or link", to: "/app/portfolio", icon: "image", c: C.sky, bg: C.tintSky },
    achievement: { t: "Catat prestasimu", en: "Log an achievement", d: "Diverifikasi tim Talentika", dEn: "Verified by the Talentika team", to: "/app/achievements", icon: "medal", c: C.teal, bg: C.tintTeal },
    opportunity: { t: "Daftar ke 2 peluang", en: "Apply to 2 opportunities", d: "Lacak di Tracker", dEn: "Track it in the Tracker", to: "/app/explore", icon: "brief", c: C.green, bg: C.tintGreen },
  };
  const improve = [...rd.components].sort((a, b) => a.v - b.v).slice(0, 3);
  const gaps = rd.components.filter(c => c.v < 60).length;
  return (
    <Screen>
      <Header title={t("Kesiapan Karier", "Career Readiness")} sub={target ? t(`Target: ${target.name}`, `Target: ${target.name}`) : t("Pilih target karier untuk analisis lebih tajam", "Pick a career target for a sharper analysis")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: C.navy, borderRadius: 22, padding: 18, color: "#fff", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 86, height: 86, borderRadius: "50%", background: `conic-gradient(${C.cyan} 0 ${rd.score}%,rgba(255,255,255,.12) ${rd.score}% 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{rd.score}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>CAREER READINESS</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{gaps ? t(`${gaps} gap untuk ditutup`, `${gaps} gaps to close`) : t("Semua komponen di atas 60", "All components above 60")}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.7)", marginTop: 3 }}>{(rd.week_delta ?? 0) >= 0 ? "+" : ""}{rd.week_delta ?? 0} {t("minggu ini", "this week")}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{t("Komponen skor", "Score components")}</div><span style={{ fontSize: 11, color: C.muted }}>{t("▏= batas siap (60)", "▏= ready line (60)")}</span></div>
        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginTop: 10, display: "flex", flexDirection: "column", gap: 13, boxShadow: SH.card }}>
          {rd.components.map(c => {
            const m = READINESS_META[c.key];
            const ok = c.v >= 60;
            return (
              <div key={c.key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ fontWeight: 500 }}>{lang === "en" ? m.nameEn : m.name} <span style={{ color: C.faint }}>· {c.w}%</span></span><span style={{ fontWeight: 600, color: ok ? C.green : C.orange }}>{ok ? t("Siap", "Ready") : `Gap ${60 - c.v}`}</span></div>
                <div style={{ position: "relative", height: 8, borderRadius: 99, background: C.track, marginTop: 6 }}>
                  <div style={{ width: `${c.v}%`, height: "100%", borderRadius: 99, background: C.blue }} />
                  <span style={{ position: "absolute", top: -3, left: "60%", width: 3, height: 14, borderRadius: 2, background: C.navy }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{t("Tutup gap-nya", "Close the gap")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {improve.map(c => {
            const a = ACT[c.key];
            return (
              <button key={c.key} onClick={() => nav(a.to)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, background: a.bg, color: a.c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={a.icon} size={18} /></span>
                <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{t(a.t, a.en)}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t(a.d, a.dEn)}</span></span>
                <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 20, padding: 16, boxShadow: SH.card }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: C.tintBlue, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="file" size={21} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{t("Portofolio dari bukti nyata", "Portfolio from verified evidence")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Proyek, sertifikat & prestasi di satu halaman", "Projects, certificates & achievements on one page")}</div></div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
            <button onClick={() => nav("/app/public")} style={{ flex: 1, height: 42, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 13, fontSize: 12.5, fontWeight: 600, color: C.text, cursor: "pointer" }}>{t("Tautan publik", "Share link")}</button>
            <button onClick={() => nav("/app/portfolio")} style={{ flex: 1, height: 42, border: "none", background: C.blue, borderRadius: 13, fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}>{t("Lihat portofolio", "View portfolio")}</button>
          </div>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 11.5, color: C.faint, textAlign: "center", lineHeight: 1.5 }}>{t("Skor ini indikator progres, bukan penilaian pasti tentang masa depanmu.", "This score is a progress indicator, not a verdict about your future.")}</p>
      </div>
    </Screen>
  );
}

/* ── REKAP MINGGUAN (bisa dibagikan) ───────────────────────────────── */
function Recap() {
  const nav = useNavigate();
  const { t, lang, profile, toast } = useApp();
  const { data: week, isLoading } = useWeek();
  const { data: home } = useHomeData();
  if (isLoading || !week) return <Loading />;
  const first = (profile?.full_name || "").split(" ")[0] || t("Kamu", "You");
  const from = new Date(Date.now() - 6 * 86400000), to = new Date();
  const range = `${fmtDate(from.toISOString(), lang, { day: "numeric", month: "short" })} – ${fmtDate(to.toISOString(), lang, { day: "numeric", month: "short", year: "numeric" })}`.toUpperCase();
  const tiles = [[`+${week.xp}`, t("XP didapat", "XP earned")], [String(week.lessons), t("Materi selesai", "Lessons done")], [String(home?.projects.length ?? 0), t("Proyek", "Projects")], [String(home?.streak ?? 0), t("Hari beruntun", "Day streak")]];
  const share = async () => {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
    const g = cv.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 1080, 1920); grd.addColorStop(0, "#0066FF"); grd.addColorStop(.6, "#00A3E0"); grd.addColorStop(1, "#00C6EF");
    g.fillStyle = grd; g.fillRect(0, 0, 1080, 1920);
    g.fillStyle = "rgba(255,209,70,.85)"; g.beginPath(); g.arc(1000, 80, 330, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "700 56px Poppins, sans-serif"; g.fillText("Talentika", 90, 200);
    g.font = "600 34px Poppins, sans-serif"; g.globalAlpha = .9; g.fillText(range, 90, 340); g.globalAlpha = 1;
    g.font = "800 92px Poppins, sans-serif"; g.fillText(lang === "en" ? `${first}'s week` : `Minggu ${first}`, 90, 460); g.fillText(lang === "en" ? "of growth" : "bertumbuh", 90, 570);
    tiles.forEach(([v, l], i) => {
      const x = 90 + (i % 2) * 460, y = 700 + Math.floor(i / 2) * 300;
      g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); (g as any).roundRect?.(x, y, 420, 250, 40); g.fill();
      g.fillStyle = "#fff"; g.font = "800 96px Poppins, sans-serif"; g.fillText(v, x + 40, y + 130); g.font = "500 36px Poppins, sans-serif"; g.fillText(l, x + 40, y + 200);
    });
    g.font = "500 34px Poppins, sans-serif"; g.fillText("#MorePeopleBrighterFutures", 90, 1800);
    const blob: Blob = await new Promise(r => cv.toBlob(b => r(b!), "image/png"));
    const file = new File([blob], "talentika-recap.png", { type: "image/png" });
    if ((navigator as any).canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Talentika" } as any); return; } catch { return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "talentika-recap.png"; a.click();
    toast(t("Gambar rekap disimpan", "Recap image saved"));
  };
  return (
    <Screen bg={C.navy}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 16px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="left" size={20} /></button>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{t("Rekap Mingguan", "Weekly Recap")}</div>
      </div>
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", background: "linear-gradient(160deg,#0066FF 0%,#00A3E0 60%,#00C6EF 100%)", padding: "22px 20px 20px", color: "#fff", minHeight: 440 }}>
          <div style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,209,70,.85)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}><img src={LOGO} alt="" style={{ width: 30, height: 30, borderRadius: 9 }} /><span style={{ fontSize: 14, fontWeight: 700 }}>Talentika</span></div>
          <div style={{ position: "relative", fontSize: 12, fontWeight: 600, letterSpacing: ".8px", marginTop: 22, opacity: .9 }}>{range}</div>
          <div style={{ position: "relative", fontSize: 30, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.6px", marginTop: 6 }}>{lang === "en" ? <>{first}'s week<br />of growth</> : <>Minggu {first}<br />bertumbuh</>}</div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
            {tiles.map(([v, l]) => <div key={l} style={{ background: "rgba(255,255,255,.16)", borderRadius: 18, padding: 14 }}><div style={{ fontSize: 26, fontWeight: 800 }}>{v}</div><div style={{ fontSize: 11.5, opacity: .9 }}>{l}</div></div>)}
          </div>
          {week.badges[0] && (
            <div style={{ position: "relative", marginTop: 12, background: "#fff", color: C.text, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="rocket" size={21} /></span>
              <div><div style={{ fontSize: 11, color: C.muted }}>{t("Prestasi baru", "New badge")}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{week.badges[0].title}</div></div>
            </div>
          )}
          <div style={{ position: "relative", fontSize: 12, marginTop: 14, opacity: .9 }}>#MorePeopleBrighterFutures</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 18 }}>{t("Minggu depan", "Next week")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9, fontSize: 12.5, color: "rgba(255,255,255,.85)" }}>
          {[t("Selesaikan 3 materi dari jalur belajarmu", "Finish 3 lessons from your learning path"), t("Tambah satu bukti ke proyekmu", "Add one piece of evidence to your project")].map(x => <div key={x} style={{ display: "flex", gap: 9, alignItems: "center" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.yellow, flex: "none" }} />{x}</div>)}
        </div>
        <button onClick={share} style={{ width: "100%", marginTop: 18, height: 54, border: "none", borderRadius: 16, background: C.yellow, color: C.text, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: "pointer" }}><Icon name="share" size={18} />{t("Bagikan ke Story", "Share to Story")}</button>
      </div>
    </Screen>
  );
}
