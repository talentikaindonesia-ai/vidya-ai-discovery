import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, canPurchase, db, useApp, useCareers, useDna, useOpportunities, useReadiness, useTracker } from "../store";
import { Body, Card, CardTitle, ChipBtn, DarkCard, Empty, Header, HeroCard, HScroll, Loading, Pill, Ring, Row, Screen, Skeleton } from "../ui";
import { C, F, SH, daysUntil, deadlineColor } from "../theme";
import { deepLink, greeting, JOURNEY, NOTIF_CATS, NOTIF_STYLE, notifCat, oppMatch, oppTypeOf, READINESS_META, timeAgo, TYPEC, TYPE_ID } from "../logic";
import tika from "../assets/tika-mascot.webp";

export default function Home({ screen }: { screen: "home" | "notif" | "readiness" }) {
  if (screen === "notif") return <Notifications />;
  if (screen === "readiness") return <Readiness />;
  return <HomeScreen />;
}

function useHomeData() {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-home", user?.id], enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [lp, proj, ach, certs, notif, ch, rec, mentors, myCh] = await Promise.all([
        db.from("learning_progress").select("content_id,status,progress_percentage,last_accessed_at,learning_content(title)").eq("user_id", uid).order("last_accessed_at", { ascending: false }).limit(10),
        db.from("projects").select("id,title,status").eq("user_id", uid).order("updated_at", { ascending: false }),
        db.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false),
        db.from("community_challenges").select("id,title,xp_reward,end_date").eq("is_active", true).or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`).order("end_date", { ascending: true, nullsFirst: false }).limit(1),
        db.rpc("my_learning_recommendations", { p_limit: 1 }),
        db.from("mentors").select("id,name,title,company").eq("is_available", true).order("total_sessions", { ascending: false }).limit(1),
        db.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["submitted", "completed"]),
      ]);
      return {
        learning: (lp.data ?? []) as any[], projects: (proj.data ?? []) as any[], achievements: ach.count ?? 0, certificates: certs.count ?? 0,
        unread: notif.count ?? 0, challenge: (ch.data ?? [])[0] ?? null, rec: (rec.data ?? [])[0] ?? null, mentor: (mentors.data ?? [])[0] ?? null, challengesDone: myCh.count ?? 0,
      };
    },
  });
}

/* 15 HOME */
function HomeScreen() {
  const nav = useNavigate();
  const { t, lang, profile, isPro, gam } = useApp();
  const { dna, done, isNew } = useDna();
  const { data: rd } = useReadiness();
  const { data: home } = useHomeData();
  const { data: tracker } = useTracker();
  const { careers } = useCareers();
  const { data: opps } = useOpportunities();
  const first = (profile?.full_name || "").split(" ")[0] || t("kamu", "there");
  const target = careers.find(c => c.id === profile?.career_target) ?? null;

  const active = (tracker ?? []).filter(o => !["accepted", "completed", "rejected"].includes(o.status) && o.deadline && (daysUntil(o.deadline) ?? -1) >= 0)
    .sort((a, b) => +new Date(a.deadline!) - +new Date(b.deadline!));

  // Next best step — dipilih oleh aturan, kalimatnya dipoles AI (HOME-02)
  const step = useMemo(() => {
    const urgent = active.find(o => (daysUntil(o.deadline) ?? 99) <= 3 && ["saved", "preparing"].includes(o.status));
    const inprog = home?.learning.find((l: any) => l.status !== "completed");
    if (!profile?.career_target) return { text: t("Pilih satu target karier supaya rekomendasi belajar & peluangmu makin tajam.", "Pick a career target so your learning and opportunity picks get sharper."), to: "/app/discover", key: "target" };
    if (urgent) return { text: t(`${urgent.opportunity_title} tutup ${daysUntil(urgent.deadline)} hari lagi — lengkapi checklist-mu sekarang.`, `${urgent.opportunity_title} closes in ${daysUntil(urgent.deadline)} days — finish your checklist now.`), to: `/app/opportunities/${urgent.opportunity_id}`, key: "urgent:" + urgent.opportunity_id };
    if (inprog) return { text: t(`Lanjutkan ${inprog.learning_content?.title ?? "materimu"} untuk memperkuat pathway ${target?.name ?? "karier"}-mu.`, `Continue ${inprog.learning_content?.title ?? "your course"} to strengthen your ${target?.name ?? "career"} pathway.`), to: `/app/course/${inprog.content_id}`, key: "course:" + inprog.content_id };
    if (!home?.projects.length) return { text: t("Mulai satu project kecil — bukti nyata menaikkan Career Readiness paling cepat.", "Start a small project — real evidence raises Career Readiness fastest."), to: "/app/projects", key: "project" };
    return { text: t("Cek peluang yang cocok minggu ini dan simpan satu ke Tracker.", "Check this week's matched opportunities and save one to your Tracker."), to: "/app/opportunities", key: "opps" };
  }, [active, home, profile, target, t]);

  const [aiText, setAiText] = useState<string | null>(null);
  useEffect(() => {
    if (isNew || !home) return;
    const k = `tk-insight:${new Date().toDateString()}:${step.key}:${lang}`;
    const cached = localStorage.getItem(k);
    if (cached) { setAiText(cached); return; }
    askAi("insight", { input: step.text, lang }).then(r => { if (r.text) { setAiText(r.text); localStorage.setItem(k, r.text); } });
  }, [step.key, isNew, home, lang, step.text]);

  // Journey 5 tahap
  const flags = [done > 0, (home?.learning.length ?? 0) > 0, (home?.projects.length ?? 0) > 0,
    (home?.achievements ?? 0) + (home?.certificates ?? 0) + (home?.challengesDone ?? 0) > 0,
    (tracker ?? []).some(o => ["applied", "selection", "accepted", "completed"].includes(o.status))];
  const cur = flags.findIndex(f => !f);
  const stageNo = cur === -1 ? 5 : cur + 1;

  // Rekomendasi (HOME-04)
  const topOpp = useMemo(() => {
    if (!opps?.length) return null;
    const ctx = { axes: dna?.axes, tujuan: profile?.tujuan, careerField: target?.field, careerName: target?.name, jenjang: (profile as any)?.jenjang };
    return opps.map(o => ({ o, m: oppMatch({ ...o, type: oppTypeOf(o.opportunity_type, o.title) }, ctx).match })).sort((a, b) => b.m - a.m)[0];
  }, [opps, dna, profile, target]);
  const recs = [
    careers[0] && { type: "Career", title: careers[0].name, meta: "Career fit", badge: careers[0].fit ? `${careers[0].fit}% fit` : t("Jelajahi", "Explore"), bg: C.tintBlue, fg: C.blueDark, to: `/app/careers/${careers[0].id}` },
    home?.rec && { type: "Learning", title: home.rec.title, meta: home.rec.category_name ?? "Learning", badge: "Recommended", bg: C.tintGreen, fg: C.green, to: `/app/course/${home.rec.id}` },
    topOpp && { type: "Opportunity", title: topOpp.o.title, meta: topOpp.o.organizer ?? "", badge: `${topOpp.m}% match`, bg: C.tintPurple, fg: C.purple, to: `/app/opportunities/${topOpp.o.id}` },
    home?.mentor && { type: "Mentor", title: home.mentor.title, meta: `${home.mentor.name}${home.mentor.company ? " · " + home.mentor.company : ""}`, badge: "Recommended", bg: C.tintOrange, fg: C.orangeDark, to: `/app/mentors/${home.mentor.id}` },
  ].filter(Boolean) as any[];

  const today = new Date().toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
  const delta = rd?.week_delta ?? 0;

  return (
    <Screen tab>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => nav("/app/profile")} aria-label={t("Profil", "Profile")} style={{ width: 44, height: 44, border: "none", borderRadius: 14, background: C.yellow, color: "#7A5200", fontWeight: 700, fontFamily: F.display, fontSize: 18, cursor: "pointer", flex: "none" }}>{(first[0] || "T").toUpperCase()}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{today}</div>
          <div style={{ fontSize: 19, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{greeting(lang)}, {first} 👋</div>
        </div>
        <button onClick={() => nav("/app/notifications")} aria-label={t("Notifikasi", "Notifications")} style={{ width: 42, height: 42, border: "none", borderRadius: 13, background: "#fff", boxShadow: SH.btn, cursor: "pointer", position: "relative", flex: "none" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a2 2 0 0 0 3.4 0" /></svg>
          {(home?.unread ?? 0) > 0 && <span style={{ position: "absolute", top: 10, right: 11, width: 8, height: 8, borderRadius: "50%", background: C.orange, border: "1.5px solid #fff" }} />}
        </button>
      </div>
      <Body>
        {!dna ? <Skeleton h={120} r={22} /> : isNew ? (
          <HeroCard>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.yellow }}>TALENT DNA™ · 0/8</div>
            <div style={{ marginTop: 7, fontSize: 18, fontWeight: 800 }}>{t("Mulai dari Talent DNA-mu", "Start with your Talent DNA")}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.85)", maxWidth: 290 }}>{t("Ikuti Interest Discovery 5 menit untuk membuka rekomendasi karier, belajar, dan peluang yang personal.", "Take a 5-minute Interest Discovery to unlock personalized careers, learning, and opportunities.")}</div>
            <button onClick={() => nav("/app/dna/interest")} style={{ marginTop: 14, height: 44, padding: "0 20px", border: "none", borderRadius: 12, background: C.orange, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t("Mulai Talent Discovery", "Start Talent Discovery")}</button>
          </HeroCard>
        ) : (
          <>
            <Card radius={22} onClick={() => nav("/app/readiness")} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Ring value={rd?.score ?? 0}><span style={{ fontSize: 22, fontWeight: 700, fontFamily: F.display, lineHeight: 1 }}>{rd?.score ?? "–"}</span><span style={{ fontSize: 10, color: C.faint, fontWeight: 700 }}>/ 100</span></Ring>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{t("Career Readiness-mu", "Your Career Readiness")}</div>
                <div style={{ marginTop: 4, fontSize: 15.5, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{(rd?.score ?? 0) >= 40 ? t("Kamu di jalur yang tepat", "You're on the right track") : t("Awal yang bagus — terus bergerak", "A good start — keep going")}</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Pill display fg={delta >= 0 ? C.green : C.red} bg={delta >= 0 ? C.tintGreen : C.tintRed}>{delta >= 0 ? "+" : ""}{delta} {t("minggu ini", "this week")}</Pill>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{t("Naikkan skor →", "Improve score →")}</span>
                </div>
              </div>
            </Card>
            <DarkCard style={{ borderRadius: 22 }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
              <img src={tika} alt="" style={{ position: "absolute", right: 14, bottom: 14, width: 84, height: 84, objectFit: "cover", borderRadius: "50%", clipPath: "circle(47%)", background: C.tintBlue }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}><span style={{ color: C.yellow, fontSize: 15 }}>✦</span><span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.lightBlue }}>{aiText ? "AI DAILY INSIGHT" : "NEXT BEST STEP"}</span></div>
              <div style={{ marginTop: 8, fontSize: 17, fontWeight: 800, position: "relative" }}>{t("Langkah terbaikmu berikutnya", "Your next best step")}</div>
              <div style={{ marginTop: 5, fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,.85)", maxWidth: 215, position: "relative" }}>{aiText ?? step.text}</div>
              <button onClick={() => nav(step.to)} style={{ marginTop: 14, height: 42, padding: "0 20px", border: "none", borderRadius: 12, background: C.orange, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", position: "relative" }}>{t("Lanjutkan", "Continue")}</button>
            </DarkCard>
          </>
        )}

        <Card radius={22}>
          <CardTitle right={<span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{t(`Tahap ${stageNo} dari 5`, `Stage ${stageNo} of 5`)}</span>}>{t("Perjalananmu", "Your Journey")}</CardTitle>
          <div style={{ marginTop: 16, position: "relative" }}>
            <div style={{ position: "absolute", top: 14, left: "10%", right: "10%", height: 3, background: C.track, borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 14, left: "10%", width: `${Math.max(0, (stageNo - 1) * 20)}%`, height: 3, background: C.blue, borderRadius: 2 }} />
            <div style={{ position: "relative", display: "flex" }}>
              {JOURNEY.map((l, i) => {
                const s = flags[i] ? "done" : i === cur ? "current" : "next";
                return (
                  <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 31, height: 31, borderRadius: "50%", background: s === "done" ? C.blue : "#fff", border: `2.5px solid ${s === "done" ? C.blue : s === "current" ? C.orange : C.line}`,
                      color: s === "done" ? "#fff" : s === "current" ? C.orange : C.disabled, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{s === "done" ? "✓" : s === "current" ? "●" : ""}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s === "next" ? C.faint : C.text }}>{l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {recs.length > 0 && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: F.display, padding: "0 2px" }}>{t("Rekomendasi untukmu", "Recommended for You")}</div>
            <HScroll gap={11} style={{ marginTop: 11, paddingBottom: 4 }}>
              {recs.map(r => (
                <div key={r.type} onClick={() => nav(r.to)} style={{ flex: "none", width: 160, background: "#fff", borderRadius: 18, padding: 15, boxShadow: "0 3px 12px rgba(11,29,58,.06)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                  <Pill display size={10.5} fg={r.fg} bg={r.bg} style={{ alignSelf: "flex-start" }}>{r.type}</Pill>
                  <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3, minHeight: 38, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{r.title}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.green }}>{r.badge}</div>
                </div>
              ))}
            </HScroll>
          </div>
        )}

        <Card radius={22}>
          <CardTitle right={<button onClick={() => nav("/app/tracker")} style={{ border: "none", background: "none", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>Tracker →</button>}>{t("Deadline terdekat", "Upcoming deadlines")}</CardTitle>
          <div style={{ marginTop: 8 }}>
            {active.slice(0, 3).map((o, i, a) => {
              const d = daysUntil(o.deadline)!; const dc = deadlineColor(d);
              return (
                <Row key={o.id} last={i === a.length - 1} onClick={() => nav(`/app/opportunities/${o.opportunity_id}`)}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: dc.c, flex: "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.opportunity_title}</div><div style={{ fontSize: 11.5, color: C.faint, marginTop: 1 }}>{TYPE_ID[oppTypeOf(o.opportunity_type, o.opportunity_title)]} · {o.status}</div></div>
                  <Pill display fg={dc.c} bg={dc.bg}>{d === 0 ? t("Hari ini", "Today") : t(`${d} hari lagi`, `${d} days left`)}</Pill>
                </Row>
              );
            })}
            {!active.length && <div style={{ padding: "10px 0 2px", fontSize: 13, color: C.muted }}>{t("Belum ada deadline. Simpan peluang ke Tracker agar diingatkan D-7, D-3, D-1.", "No deadlines yet. Save opportunities to get D-7, D-3, D-1 reminders.")}</div>}
          </div>
        </Card>

        {home?.challenge && (
          <div onClick={() => nav("/app/community")} style={{ background: C.tintYellow, borderRadius: 22, padding: 18, cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ width: 48, height: 48, borderRadius: 15, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flex: "none" }}>🏆</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".6px", color: C.gold }}>WEEKLY CHALLENGE</div>
              <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, fontFamily: F.display, lineHeight: 1.35 }}>{home.challenge.title}</div>
              {gam && <div style={{ marginTop: 4, fontSize: 12, color: C.gold, fontWeight: 700 }}>+{home.challenge.xp_reward ?? 0} XP · badge · portfolio evidence</div>}
            </div>
          </div>
        )}

        {!isPro && canPurchase() && (
          <div onClick={() => nav("/app/pro")} style={{ background: "#fff", border: `1.5px dashed ${C.lightBlue}`, borderRadius: 22, padding: "16px 18px", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>👑</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 800 }}>Talentika Pro</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>{t("Full Talent DNA, mentoring, Application Assistant", "Full Talent DNA, mentoring, Application Assistant")}</div></div>
            <span style={{ color: C.blue, fontWeight: 800 }}>→</span>
          </div>
        )}
      </Body>
    </Screen>
  );
}

/* NOTIFICATION CENTER (NOT-01, NOT-03) */
function Notifications() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user } = useApp();
  const [cat, setCat] = useState<(typeof NOTIF_CATS)[number]>("Semua");
  const { data, isLoading } = useQuery({
    queryKey: ["m-notifs", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("notifications").select("id,title,message,type,is_read,action_url,created_at").eq("user_id", user!.id).neq("type", "promo").order("created_at", { ascending: false }).limit(80)).data ?? []) as any[],
  });
  const list = (data ?? []).map(n => ({ ...n, cat: notifCat(n.type) })).filter(n => cat === "Semua" || n.cat === cat);
  const open = async (n: any) => {
    if (!n.is_read) { await db.from("notifications").update({ is_read: true }).eq("id", n.id); qc.invalidateQueries({ queryKey: ["m-notifs"] }); qc.invalidateQueries({ queryKey: ["m-home"] }); }
    const to = deepLink(n.action_url);
    if (to) nav(to);
  };
  const readAll = async () => { await db.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false); qc.invalidateQueries({ queryKey: ["m-notifs"] }); qc.invalidateQueries({ queryKey: ["m-home"] }); };
  return (
    <Screen>
      <Header title={t("Notifikasi", "Notifications")} right={<button onClick={readAll} style={{ border: "none", background: "none", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{t("Tandai dibaca", "Mark all read")}</button>} />
      <HScroll gap={7} style={{ marginTop: 14, padding: "0 20px", margin: "14px 0 0" }}>
        {NOTIF_CATS.map(c => <ChipBtn key={c} on={cat === c} onClick={() => setCat(c)} style={{ height: 34, fontSize: 12, padding: "0 13px" }}>{c === "Semua" ? t("Semua", "All") : c}</ChipBtn>)}
      </HScroll>
      <Body top={14} gap={10}>
        {isLoading && <Loading />}
        {!isLoading && !list.length && <Empty icon="🔔" title={t("Belum ada notifikasi", "No notifications yet")} body={t("Pengingat deadline, mentor, dan insight akan muncul di sini.", "Deadline reminders, mentor updates and insights will appear here.")} />}
        {list.map(n => {
          const st = NOTIF_STYLE[n.cat];
          return (
            <div key={n.id} onClick={() => open(n)} style={{ display: "flex", gap: 12, background: n.is_read ? "#fff" : C.tintBlue, borderRadius: 16, padding: 14, boxShadow: SH.cardSm, cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "none", color: C.blue }}>{st.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: F.display, color: C.faint, letterSpacing: ".4px" }}>{n.cat}</div>
                <div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 700 }}>{n.title}</div>
                <div style={{ marginTop: 2, fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>{n.message}</div>
                <div style={{ marginTop: 4, fontSize: 11, color: C.faint, fontWeight: 600 }}>{timeAgo(n.created_at, lang)}</div>
              </div>
              {!n.is_read && <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.orange, flex: "none", marginTop: 4 }} />}
            </div>
          );
        })}
      </Body>
    </Screen>
  );
}

/* CAREER READINESS (PRO-02, §8) */
function Readiness() {
  const nav = useNavigate();
  const { t, lang } = useApp();
  const { data: rd, isLoading } = useReadiness();
  if (isLoading || !rd) return <Loading />;
  const ACT: Record<string, { t: string; en: string; pts: string; to: string }> = {
    talent: { t: "Selesaikan 1 modul Talent DNA", en: "Complete 1 Talent DNA module", pts: "+2", to: "/app/dna" },
    skill: { t: "Selesaikan 1 materi sampai tahap Prove", en: "Finish 1 course to the Prove stage", pts: "+3", to: "/app/learn" },
    experience: { t: "Bangun 1 project", en: "Build 1 project", pts: "+4", to: "/app/projects" },
    portfolio: { t: "Tambah portfolio evidence", en: "Add portfolio evidence", pts: "+2", to: "/app/portfolio" },
    achievement: { t: "Catat prestasimu", en: "Log an achievement", pts: "+2", to: "/app/achievements" },
    opportunity: { t: "Daftar ke 2 peluang", en: "Apply to 2 opportunities", pts: "+3", to: "/app/opportunities" },
  };
  const improve = [...rd.components].sort((a, b) => a.v - b.v).slice(0, 4).map(c => ({ ...ACT[c.key], key: c.key }));
  return (
    <Screen>
      <Header title="Career Readiness" />
      <Body>
        <Card radius={22} pad={22} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Ring value={rd.score} size={136} stroke={12}><span style={{ fontSize: 36, fontWeight: 700, fontFamily: F.display, lineHeight: 1 }}>{rd.score}</span><span style={{ fontSize: 12, color: C.faint, fontWeight: 700 }}>/ 100</span></Ring>
          </div>
          <p style={{ margin: "14px auto 0", fontSize: 12.5, color: C.muted, lineHeight: 1.5, maxWidth: 270 }}>{t("Skor ini indikator progres, bukan penilaian pasti tentang masa depanmu.", "This score is a progress indicator, not a verdict about your future.")}</p>
        </Card>
        <Card>
          <CardTitle>{t("Komponen skor", "Score components")}</CardTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {rd.components.map(c => {
              const m = READINESS_META[c.key];
              return (
                <div key={c.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ fontWeight: 700 }}>{lang === "en" ? m.nameEn : m.name} <span style={{ color: C.faint, fontWeight: 600 }}>· {c.w}%</span></span><span style={{ fontWeight: 800 }}>{c.v}</span></div>
                  <div style={{ marginTop: 6, height: 7, borderRadius: 4, background: C.track }}><div style={{ width: `${c.v}%`, height: "100%", borderRadius: 4, background: m.color }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardTitle>{t("Naikkan skormu", "Improve your score")}</CardTitle>
          <div style={{ marginTop: 8 }}>
            {improve.map((i, k) => (
              <Row key={i.key} last={k === improve.length - 1} onClick={() => nav(i.to)} style={{ padding: "12px 0" }}>
                <Pill display size={12} fg={C.green} bg={C.tintGreen} style={{ padding: "4px 9px" }}>{i.pts}</Pill>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{t(i.t, i.en)}</span>
                <span style={{ color: C.blue, fontWeight: 800 }}>→</span>
              </Row>
            ))}
          </div>
        </Card>
      </Body>
    </Screen>
  );
}
