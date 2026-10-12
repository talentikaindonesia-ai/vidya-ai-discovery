import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, errMsg, openExternal, Tracked, useApp, useCareers, useDna, useKuota, useOpportunities, useTracker } from "../store";
import { BackBtn, Btn, Empty, Header, Icon, IconBtn, ImgBox, Loading, Screen, Sheet, TabTitle, Tabs } from "../ui";
import { C, SH, daysUntil, deadlineColor } from "../theme";
import { docsFor, fmtDate, JENJANG_LABEL, OppType, oppMatch, oppTypeOf, TYPE_ID } from "../logic";
import { oppImg } from "../media";
import mentorWoman from "../assets/v3/mentor-woman.webp";

export default function Opportunities({ screen }: { screen: "list" | "detail" | "tracker" | "calendar" }) {
  switch (screen) {
    case "detail": return <Detail />;
    case "tracker": return <Tracker />;
    case "calendar": return <Calendar />;
    default: return <Explore />;
  }
}

const STAGES = ["saved", "preparing", "applied", "selection", "accepted", "completed"] as const;
const STAGE_LABEL: Record<string, [string, string]> = {
  saved: ["Disimpan", "Saved"], preparing: ["Persiapan", "Preparing"], applied: ["Mendaftar", "Applied"],
  selection: ["Seleksi", "Selection"], accepted: ["Diterima", "Accepted"], completed: ["Selesai", "Completed"], rejected: ["Belum lolos", "Not selected"],
};
/** Warna solid (pil di atas foto) + tint per jenis peluang (palet v3). */
const TC: Record<OppType, [string, string]> = {
  Scholarship: [C.blue, C.tintBlue], Competition: [C.purple, C.tintPurple], Internship: [C.sky, C.tintSky],
  Global: [C.green, C.tintGreen], Research: [C.amber, C.tintYellow], Bootcamp: [C.red, C.tintRed],
};

/** Gabungkan baris katalog + konteks siswa → kartu peluang lengkap (OPP-02). */
function useEnriched() {
  const { profile } = useApp();
  const { dna } = useDna();
  const { careers } = useCareers();
  const { data: opps, isLoading } = useOpportunities();
  const { data: tracker } = useTracker();
  const target = careers.find(c => c.id === profile?.career_target);
  const list = useMemo(() => {
    const tmap = new Map((tracker ?? []).map(x => [x.opportunity_id, x]));
    return (opps ?? []).map(o => {
      const type = oppTypeOf(o.opportunity_type, o.title);
      const m = oppMatch({ ...o, type }, { axes: dna?.axes, tujuan: profile?.tujuan, careerField: target?.field, careerName: target?.name, jenjang: (profile as any)?.jenjang });
      const tr = tmap.get(o.id) ?? null;
      const docs = docsFor({ requirements: o.requirements, type });
      const missing = docs.filter(d => !tr?.checklist?.[d]);
      return { ...o, type, match: m.match, why: m.why, tracked: tr, docs, missing, days: daysUntil(o.deadline) };
    }).sort((a, b) => b.match - a.match);
  }, [opps, tracker, dna, profile, target]);
  return { list, isLoading, tracker: tracker ?? [] };
}

function useSaveToggle() {
  const qc = useQueryClient();
  const { user, track, toast, t } = useApp();
  return async (o: { id: string; title: string; url: string | null; type: OppType; deadline: string | null; opportunity_type: string | null; match?: number; days?: number | null }, tracked: Tracked | null) => {
    if (tracked) {
      if (!["saved", "preparing"].includes(tracked.status)) { toast(t("Peluang yang sudah didaftar tidak bisa dihapus dari Tracker", "Applied opportunities stay in your Tracker")); return; }
      await db.from("saved_opportunities").delete().eq("id", tracked.id);
    } else {
      const { error } = await db.from("saved_opportunities").insert({ user_id: user!.id, opportunity_id: o.id, opportunity_title: o.title, opportunity_url: o.url, category: o.opportunity_type, opportunity_type: o.opportunity_type, deadline: o.deadline, status: "saved" });
      if (error) { toast(errMsg(error), "error"); return; }
      track("opportunity_saved", { opp_id: o.id, type: o.type, match: o.match, days_to_deadline: o.days });
      toast(t("Disimpan ke Tracker — pengingat D-7, D-3, D-1 aktif", "Saved to Tracker — D-7, D-3, D-1 reminders on"));
    }
    qc.invalidateQueries({ queryKey: ["m-tracker"] });
  };
}

const eligOf = (o: { jenjang_target?: string[] | null }, t: (a: string, b: string) => string) =>
  o.jenjang_target?.length ? o.jenjang_target.map(j => JENJANG_LABEL[j] ?? j).join(", ") : t("Terbuka", "Open");
const dlText = (o: { deadline: string | null }, lang: "id" | "en", t: (a: string, b: string) => string) =>
  o.deadline ? fmtDate(o.deadline, lang, { day: "numeric", month: "short", year: "numeric" }) : t("Bergulir", "Rolling");

/* ── EXPLORE (tab) ──────────────────────────────────────────────────── */
function Explore() {
  const nav = useNavigate();
  const { t, lang, user, isPro, openPaywall } = useApp();
  const { title: dnaTitleText, done } = useDna();
  const { list: ranked, isLoading, tracker } = useEnriched();
  const { data: kuota } = useKuota();
  // Free: pencarian & filter dasar (urut tenggat); urutan sesuai profil = Plus
  const list = useMemo(() => (isPro ? ranked : [...ranked].sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))), [ranked, isPro]);
  const dibuka = new Set(kuota?.peluang_dibuka ?? []);
  const habis = !isPro && !!kuota && kuota.peluang_dipakai >= kuota.peluang_batas;
  const save = useSaveToggle();
  const [type, setType] = useState<OppType | "all" | "mentor">("all");
  const [f, setF] = useState<{ soon: boolean; online: boolean; free: boolean; sma: boolean }>({ soon: false, online: false, free: false, sma: false });
  const { data: mentors } = useQuery({
    queryKey: ["m-explore-mentors", type === "mentor"], enabled: !!user, staleTime: 10 * 60_000,
    queryFn: async () => ((await db.from("mentors").select("id,name,title,company,avatar_url,rating,total_sessions").eq("is_available", true).order("total_sessions", { ascending: false }).limit(type === "mentor" ? 12 : 2)).data ?? []) as any[],
  });
  const active = tracker.filter(x => !["accepted", "completed", "rejected"].includes(x.status)).map(x => daysUntil(x.deadline)).filter((d): d is number => d !== null && d >= 0);
  const urgent = active.filter(d => d <= 3).length;
  const shown = list.filter(o => (type === "all" || o.type === type)
    && (!f.soon || (o.days !== null && o.days <= 30))
    && (!f.online || o.mode === "online" || o.mode === "hybrid" || (!o.mode && /online|daring|virtual/i.test(`${o.location} ${o.title}`)))
    && (!f.free || o.cost === "gratis" || o.cost === "pendanaan_penuh" || (!o.cost && /gratis|free|tanpa biaya|fully funded|pendanaan penuh/i.test(`${o.description} ${o.prize_info}`)))
    && (!f.sma || (o.jenjang_target?.length ? o.jenjang_target.includes("sma_smk") : /sma|smk|siswa|pelajar|high school/i.test(`${o.description} ${o.title}`))));
  const tabs: { value: OppType | "all" | "mentor"; label: string }[] = [
    { value: "all", label: t("Untukmu", "For You") }, { value: "Scholarship", label: t("Beasiswa", "Scholarships") }, { value: "Competition", label: t("Kompetisi", "Competitions") },
    { value: "Internship", label: t("Magang", "Internships") }, { value: "Global", label: "Global" }, { value: "Research", label: t("Riset", "Research") }, { value: "Bootcamp", label: "Bootcamp" },
    { value: "mentor", label: "Mentor" },
  ];
  const chip = (on: boolean, label: string, fn: () => void) => (
    <button key={label} onClick={fn} aria-pressed={on} style={{ flex: "none", height: 30, border: `1.5px solid ${on ? C.blue : C.line}`, borderRadius: 99, padding: "0 11px", fontSize: 11.5, fontWeight: 500, cursor: "pointer", background: on ? C.tintBlue : "#fff", color: on ? C.blue : C.text2 }}>{label}</button>
  );
  const MentorRow = ({ m }: { m: any }) => (
    <div style={{ background: "#fff", borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", boxShadow: SH.card }}>
      {m.avatar_url ? <ImgBox src={m.avatar_url} w={54} h={54} r="50%" /> : <span style={{ width: 54, height: 54, borderRadius: "50%", background: C.tintPurple, color: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flex: "none" }}>{m.name?.[0]}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
        <div style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[m.title, m.company].filter(Boolean).join(" · ")}</div>
        {(m.rating || m.total_sessions) ? <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.text2, marginTop: 3 }}>{m.rating ? <><span style={{ color: "#F59E0B", display: "flex" }}><Icon name="star" size={12} filled /></span>{Number(m.rating).toFixed(1)}</> : null}{m.total_sessions ? ` · ${m.total_sessions} ${t("sesi", "sessions")}` : ""}</div> : null}
      </div>
      <button onClick={() => nav(`/app/mentors/${m.id}`)} style={{ height: 36, border: "none", borderRadius: 11, background: C.blue, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "0 14px", cursor: "pointer", flex: "none" }}>{t("Pesan", "Book")}</button>
    </div>
  );

  return (
    <Screen tab>
      <TabTitle title={t("Jelajah", "Explore")} sub={t("Ubah talentamu jadi peluang nyata", "Turn your talent into real opportunities")} right={<>
        <IconBtn icon="cal" label={t("Kalender deadline", "Deadline calendar")} onClick={() => nav("/app/calendar")} />
        <IconBtn icon="brief" label={t("Lamaranku", "My applications")} onClick={() => nav("/app/tracker")} badge={urgent > 0} />
      </>} />
      <div style={{ padding: "0 20px" }}>
        <button onClick={() => nav(done ? "/app/dna/result" : "/app/dna")} style={{ width: "100%", textAlign: "left", marginTop: 14, border: "none", background: "#fff", borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
          <span style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(140deg,#A78BFA,#6D28D9)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="sparkle" size={20} /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 11, color: C.muted }}>Talent Discovery</span><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dnaTitleText ?? t("Belum dimulai", "Not started yet")}</span></span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.purple, background: C.tintPurple, padding: "6px 11px", borderRadius: 99 }}>{done ? t("Perbarui", "Update") : t("Mulai", "Start")}</span>
        </button>
        <div style={{ marginTop: 14 }}><Tabs value={type} onChange={v => setType(v as typeof type)} items={tabs} /></div>

        {type !== "mentor" && <>
          <div style={{ position: "relative", marginTop: 14, borderRadius: 24, overflow: "hidden", background: "linear-gradient(120deg,#EAF4FF,#D6E8FF)", minHeight: 170, padding: 18 }}>
            <div style={{ position: "absolute", right: -30, top: -10, width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%,#E6F2FF 0,#9CC8FF 55%,#3D8BFF 100%)", color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="globe" size={150} strokeWidth={1.2} /></div>
            <img src={mentorWoman} alt="" style={{ position: "absolute", right: 96, top: 16, width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} />
            <span style={{ position: "absolute", right: 20, top: 20, color: C.blue, display: "flex", transform: "rotate(-20deg)" }}><Icon name="send" size={24} /></span>
            <div style={{ position: "relative", width: "62%" }}>
              <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.4px" }}>{t("Peluang", "Global")}<br />{t("Global", "Opportunities")}<br /><span style={{ color: C.blue }}>{t("untuk Masa Depanmu", "for Your Future")}</span></div>
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: C.text2, marginTop: 7 }}>{t("Beasiswa, kompetisi, magang, dan jalur karier dari seluruh dunia — dikurasi dari sumber resmi.", "Scholarships, competitions, internships, and career pathways from around the world — curated from official sources.")}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", margin: "12px -20px 0", padding: "0 20px" }}>
            {chip(f.soon, t("Deadline ≤30 hari", "Deadline ≤30 days"), () => setF(s => ({ ...s, soon: !s.soon })))}
            {chip(f.online, "Online", () => setF(s => ({ ...s, online: !s.online })))}
            {chip(f.free, t("Gratis", "Free"), () => setF(s => ({ ...s, free: !s.free })))}
            {chip(f.sma, t("Untuk SMA/SMK", "High school"), () => setF(s => ({ ...s, sma: !s.sma })))}
          </div>

          {urgent > 0 && (
            <button onClick={() => nav("/app/tracker")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: C.tintRed, borderRadius: 16, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
              <span style={{ color: C.red, display: "flex" }}><Icon name="clock" size={18} /></span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "#9F1239" }}>{t(`${urgent} lamaran tutup ≤3 hari lagi`, `${urgent} applications close in ≤3 days`)}</span>
              <span style={{ color: "#9F1239", display: "flex" }}><Icon name="chev" size={16} /></span>
            </button>
          )}

          {!isPro && kuota && (
            <button onClick={() => openPaywall("opps")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: habis ? C.tintYellow : C.soft, borderRadius: 16, padding: "11px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
              <span style={{ color: habis ? C.amber : C.blue, display: "flex" }}><Icon name={habis ? "lock" : "eye"} size={18} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.text }}>{t(`${kuota.peluang_dipakai}/${kuota.peluang_batas} peluang dibuka bulan ini`, `${kuota.peluang_dipakai}/${kuota.peluang_batas} opportunities opened this month`)}</span>
                <span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{habis ? t("Kuota Free habis — buka semua dengan Plus", "Free quota used — open everything with Plus") : t("Akun Free · tanpa batas dengan Plus", "Free account · unlimited with Plus")}</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "3px 8px", borderRadius: 99 }}>PLUS</span>
            </button>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{isPro ? t("Cocok untukmu", "Matched for You") : t("Peluang terbaru", "Latest opportunities")}</div>
            {isPro ? <span style={{ fontSize: 12, color: C.muted }}>{t("urut sesuai kecocokan", "sorted by fit")}</span>
              : <button onClick={() => openPaywall("matching")} style={{ border: "none", background: C.tintPurple, color: C.purple, borderRadius: 99, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}><Icon name="lock" size={12} />{t("Urut sesuai profilku", "Sort by my profile")}</button>}
          </div>
          <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
            {isLoading && <Loading />}
            {shown.map(o => {
              const [c] = TC[o.type];
              const terkunci = habis && !dibuka.has(o.id);
              return (
                <div key={o.id} onClick={() => (terkunci ? openPaywall("opps") : nav(`/app/opportunities/${o.id}`))} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", cursor: "pointer", boxShadow: SH.card, opacity: terkunci ? 0.75 : 1 }}>
                  <div style={{ position: "relative", height: 120 }}>
                    <ImgBox src={oppImg(o.type, o.poster_url, o.id)} h="100%" r={0} />
                    <span style={{ position: "absolute", left: 12, top: 12, fontSize: 11, fontWeight: 600, color: "#fff", background: c, padding: "4px 11px", borderRadius: 99 }}>{t(TYPE_ID[o.type], o.type)}</span>
                    {isPro && <span style={{ position: "absolute", right: 56, top: 12, fontSize: 11, fontWeight: 700, color: C.green, background: "#fff", padding: "4px 10px", borderRadius: 99 }}>{t(`${o.match}% cocok`, `${o.match}% match`)}</span>}
                    {terkunci && <span style={{ position: "absolute", left: 12, bottom: 10, fontSize: 11, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "4px 10px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5 }}><Icon name="lock" size={12} />Plus</span>}
                    <button onClick={e => { e.stopPropagation(); save(o, o.tracked); }} aria-label={o.tracked ? t("Hapus dari Tracker", "Remove from Tracker") : t("Simpan", "Save")} aria-pressed={!!o.tracked}
                      style={{ position: "absolute", right: 12, top: 8, width: 36, height: 36, borderRadius: "50%", border: "none", background: "#fff", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="bookmark" size={16} filled={!!o.tracked} /></button>
                  </div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{o.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{o.organizer ?? o.source_website ?? ""}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 9, fontSize: 11.5, color: C.text2 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ color: C.muted, display: "flex" }}><Icon name="cap" size={14} /></span>{eligOf(o, t)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ color: C.muted, display: "flex" }}><Icon name="pin" size={14} /></span>{o.location || "—"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: deadlineColor(o.days).c }}><span style={{ display: "flex" }}><Icon name="cal" size={14} /></span>{dlText(o, lang, t)}</span>
                    </div>
                    {isPro && o.why[0] && <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 9, fontSize: 11.5, color: C.blue }}><Icon name="sparkle" size={13} /><span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.why[0]}</span></div>}
                  </div>
                </div>
              );
            })}
            {!isLoading && !shown.length && (
              <div style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", textAlign: "center", boxShadow: SH.card }}>
                <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 20, background: C.tintBlue, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={28} /></div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>{t("Belum ada yang cocok di sini", "No matches here yet")}</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.muted, marginTop: 4 }}>{t("Tim Talentika mengkurasi peluang dari sumber resmi secara manual. Coba kategori lain atau cek lagi minggu ini.", "The Talentika team curates opportunities from official sources by hand. Try another category or check back this week.")}</div>
                <button onClick={() => nav("/app/community")} style={{ marginTop: 14, height: 40, border: "none", borderRadius: 12, background: C.blue, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "0 16px", cursor: "pointer" }}>{t("Lihat aktivitas teman", "See what friends are doing")}</button>
              </div>
            )}
          </div>
        </>}

        {!!mentors?.length && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: type === "mentor" ? 16 : 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{t("Mentor untukmu", "Mentors for You")}</div>
            <button onClick={() => nav("/app/mentors")} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>{t("Lihat Semua", "See All")}</button>
          </div>
          <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>{mentors.map(m => <MentorRow key={m.id} m={m} />)}</div>
        </>}
        {type === "mentor" && mentors && !mentors.length && <Empty icon="users" title={t("Mentor sedang disiapkan", "Mentors are on the way")} />}
      </div>
    </Screen>
  );
}

const ACTION_WORDS: [RegExp, string][] = [[/esai|essay|motivasi|motivation/i, "esai"], [/cv|resume/i, "cv"], [/proposal/i, "proposal"], [/abstrak|abstract|riset|research/i, "riset"], [/portofolio|portfolio/i, "portofolio"], [/video|pitch/i, "pitch"]];

/* ── OPPORTUNITY DETAIL ─────────────────────────────────────────────── */
function Detail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, profile, afterAction, track, toast, isPro, openPaywall } = useApp();
  const { list, isLoading } = useEnriched();
  const save = useSaveToggle();
  const [confirmApply, setConfirmApply] = useState(false);
  const o = list.find(x => x.id === id);
  // Free: maks. 5 peluang berbeda per bulan (buka_peluang — sama dengan web)
  const { data: akses, isLoading: cekAkses } = useQuery({
    queryKey: ["m-buka-peluang", id, user?.id, isPro], enabled: !!user && !!id && !isPro, staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await db.rpc("buka_peluang", { p_id: id });
      qc.invalidateQueries({ queryKey: ["m-kuota"] });
      return error ? { allowed: true } : (data as { allowed: boolean; used?: number; limit?: number });
    },
  });
  const missing0 = o?.missing[0] ?? null;
  const kw = missing0 ? ACTION_WORDS.find(([re]) => re.test(missing0))?.[1] : null;
  const { data: action } = useQuery({
    queryKey: ["m-opp-action", kw, user?.id], enabled: !!kw && !!user,
    queryFn: async () => {
      const { data: lc } = await db.from("learning_content").select("id,title").eq("is_active", true).ilike("title", `%${kw}%`).limit(1);
      const c = lc?.[0]; if (!c) return null;
      const { data: p } = await db.from("learning_progress").select("status").eq("user_id", user!.id).eq("content_id", c.id).maybeSingle();
      return { ...c, done: p?.status === "completed" };
    },
  });
  // OPP-06: gap otomatis terselesaikan bila materi yang direkomendasikan sudah selesai
  useEffect(() => {
    if (action?.done && o?.tracked && missing0 && !o.tracked.checklist?.[missing0]) {
      db.from("saved_opportunities").update({ checklist: { ...o.tracked.checklist, [missing0]: true } }).eq("id", o.tracked.id).then(() => qc.invalidateQueries({ queryKey: ["m-tracker"] }));
    }
  }, [action?.done, o?.tracked?.id, missing0]); // eslint-disable-line
  useEffect(() => { if (o) track("recommendation_viewed", { type: "opp", fit: o.match, position: 0 }); }, [o?.id]); // eslint-disable-line

  if (isLoading || (!isPro && cekAkses)) return <Loading />;
  if (o && !isPro && akses && !akses.allowed) return (
    <Screen><Header title={t("Peluang", "Opportunity")} />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 18, boxShadow: SH.card }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: TC[o.type][0], padding: "4px 11px", borderRadius: 99 }}>{t(TYPE_ID[o.type], o.type)}</span>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginTop: 10 }}>{o.title}</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{[o.organizer, dlText(o, lang, t)].filter(Boolean).join(" · ")}</div>
          <div style={{ marginTop: 16, background: C.tintYellow, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ color: C.amber, display: "flex" }}><Icon name="lock" size={18} /></span>
            <span style={{ fontSize: 12.5, color: "#7A5200", lineHeight: 1.5 }}>{t(`Kamu sudah membuka ${akses.limit ?? 5} peluang bulan ini. Kuota Free terisi lagi awal bulan depan.`, `You've opened ${akses.limit ?? 5} opportunities this month. Your Free quota refills next month.`)}</span>
          </div>
          <Btn onClick={() => openPaywall("opps")} style={{ marginTop: 14 }}><Icon name="star" size={16} />{t("Buka semua peluang dengan Plus", "Open every opportunity with Plus")}</Btn>
          <Btn kind="outline" h={46} onClick={() => nav("/app/tracker")} style={{ marginTop: 8 }}>{t("Lihat peluang yang sudah kusimpan", "See my saved opportunities")}</Btn>
        </div>
      </div>
    </Screen>
  );
  if (!o) return <Screen><Header title={t("Peluang", "Opportunity")} /><div style={{ padding: 20 }}><Empty icon="clock" title={t("Peluang sudah ditutup atau tidak ditemukan", "Opportunity closed or not found")} action={<Btn kind="outline" h={44} onClick={() => nav("/app/explore")}>{t("Lihat peluang lain", "See other opportunities")}</Btn>} /></div></Screen>;
  const tr = o.tracked;
  const applied = !!tr && ["applied", "selection", "accepted", "completed"].includes(tr.status);
  const similar = list.filter(x => x.id !== o.id && x.type === o.type).slice(0, 2);
  const ready = o.docs.filter(d => tr?.checklist?.[d]).length;
  const [tc, tb] = TC[o.type];
  const span = o.registration_start_date && o.deadline ? Math.max(1, (+new Date(o.deadline) - +new Date(o.registration_start_date)) / 86400000) : 60;
  const daysPct = o.days !== null ? Math.max(4, Math.min(100, 100 - (o.days / span) * 100)) : 0;

  // Cek kelayakan dari data yang ada (jenjang & tenggat). Data kosong = tidak ditandai gagal.
  const myJ: string | null = (profile as any)?.jenjang ?? null;
  const elig: { ok: boolean; t: string; fix?: string; to?: string }[] = [];
  if (o.jenjang_target?.length) elig.push(myJ && o.jenjang_target.includes(myJ)
    ? { ok: true, t: t(`Jenjangmu (${JENJANG_LABEL[myJ] ?? myJ}) termasuk sasaran`, `Your level (${JENJANG_LABEL[myJ] ?? myJ}) is eligible`) }
    : { ok: false, t: t(`Untuk ${eligOf(o, t)}`, `For ${eligOf(o, t)}`), fix: t("Cari yang lain", "Find others"), to: "/app/explore" });
  if (o.days !== null) elig.push(o.days >= 0 ? { ok: true, t: t(`Pendaftaran masih dibuka (${o.days} hari lagi)`, `Registration still open (${o.days} days left)`) } : { ok: false, t: t("Pendaftaran sudah ditutup", "Registration has closed") });
  if (missing0) elig.push(action?.done ? { ok: true, t: t(`Siap: ${missing0}`, `Ready: ${missing0}`) } : { ok: false, t: t(`Perlu disiapkan: ${missing0}`, `Needs work: ${missing0}`), fix: action ? t("Pelajari", "Learn it") : t("Minta bantuan", "Get help"), to: action ? `/app/course/${action.id}` : `/app/copilot?q=${encodeURIComponent(`${t("Bantu aku menyiapkan", "Help me prepare")} ${missing0} (${o.title})`)}` });

  const toggleDoc = async (d: string) => {
    let row = tr;
    if (!row) {
      const { data, error } = await db.from("saved_opportunities").insert({ user_id: user!.id, opportunity_id: o.id, opportunity_title: o.title, opportunity_url: o.url, category: o.opportunity_type, opportunity_type: o.opportunity_type, deadline: o.deadline, status: "preparing" }).select("*").single();
      if (error) { toast(errMsg(error), "error"); return; }
      row = data;
    }
    const cl = { ...(row!.checklist || {}), [d]: !row!.checklist?.[d] };
    await db.from("saved_opportunities").update({ checklist: cl, status: row!.status === "saved" ? "preparing" : row!.status }).eq("id", row!.id);
    qc.invalidateQueries({ queryKey: ["m-tracker"] });
  };
  const apply = () => { if (o.url) openExternal(o.url); setConfirmApply(true); };
  const markApplied = async () => {
    setConfirmApply(false);
    if (tr) await db.from("saved_opportunities").update({ status: "applied", applied_at: new Date().toISOString(), stage_changed_at: new Date().toISOString() }).eq("id", tr.id);
    else await db.from("saved_opportunities").insert({ user_id: user!.id, opportunity_id: o.id, opportunity_title: o.title, opportunity_url: o.url, category: o.opportunity_type, opportunity_type: o.opportunity_type, deadline: o.deadline, status: "applied", applied_at: new Date().toISOString() });
    track("opportunity_applied", { opp_id: o.id, type: o.type, match: o.match, days_to_deadline: o.days });
    await qc.invalidateQueries({ queryKey: ["m-tracker"] });
    await afterAction(t(`Mendaftar ke ${o.title}`, `Applied to ${o.title}`));
    nav("/app/tracker");
  };
  const assistant = [t("Bantu aku menulis motivation letter.", "Help me write a motivation letter."), t("Review proposal kompetisiku.", "Review my competition proposal."), t("Siapkan aku untuk interview.", "Prepare me for an interview.")];
  const circle: React.CSSProperties = { position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", width: 42, height: 42, borderRadius: "50%", border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,.2)" };
  const H = ({ children }: { children: React.ReactNode }) => <div style={{ fontSize: 16, fontWeight: 700, marginTop: 18 }}>{children}</div>;

  return (
    <Screen bg="#fff" style={{ paddingBottom: 0 }}>
      <div style={{ position: "relative", height: 230 }}>
        <ImgBox src={oppImg(o.type, o.poster_url, o.id)} h="100%" r={0} />
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={{ ...circle, left: 18, color: C.text }}><Icon name="left" size={20} /></button>
        <button aria-label={tr ? t("Hapus dari Tracker", "Remove from Tracker") : t("Simpan", "Save")} aria-pressed={!!tr} onClick={() => save(o, tr)} style={{ ...circle, right: 18, color: C.blue }}><Icon name="bookmark" size={19} filled={!!tr} /></button>
      </div>
      <div style={{ position: "relative", marginTop: -24, background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: tc, background: tb, padding: "4px 11px", borderRadius: 99 }}>{t(TYPE_ID[o.type], o.type)}</span>
          {isPro && <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.tintGreen, padding: "4px 11px", borderRadius: 99 }}>{t(`${o.match}% cocok`, `${o.match}% match`)}</span>}
        </div>
        <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.4px" }}>{o.title}</h1>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{o.organizer ?? o.source_website}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
          {[["cap", t("Kelayakan", "Eligibility"), eligOf(o, t)], ["pin", t("Lokasi", "Location"), o.location || "—"], ["cal", "Deadline", dlText(o, lang, t)]].map(([ic, l, v]) => (
            <div key={l} style={{ background: C.bg, borderRadius: 14, padding: 10 }}>
              <div style={{ color: C.blue, display: "flex" }}><Icon name={ic} size={17} /></div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 5 }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{v}</div>
            </div>
          ))}
        </div>
        {o.days !== null && o.days >= 0 && (
          <div style={{ marginTop: 12, background: C.tintYellow, borderRadius: 14, padding: "11px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#7A5200", gap: 8 }}><span>{t(`${o.days} hari lagi`, `${o.days} days left`)}</span><span>{tr ? t("Pengingat H-7 · H-3 · H-1", "Reminders D-7 · D-3 · D-1") : t("Simpan untuk pengingat", "Save for reminders")}</span></div>
            <div style={{ height: 6, borderRadius: 99, background: "#FFEBB0", marginTop: 7 }}><div style={{ width: `${daysPct}%`, height: "100%", borderRadius: 99, background: "#F59E0B" }} /></div>
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 10.5, color: C.faint }}>{t("Waktu dalam WIB. Fakta peluang dari sumber resmi, bukan dari AI.", "Times shown in WIB. Opportunity facts come from official sources, not AI.")}</div>

        <H>{t("Kenapa direkomendasikan", "Why it's recommended")}</H>
        {isPro ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 9 }}>
            {o.why.map(w => <div key={w} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 12.5, color: C.text2 }}><span style={{ color: C.blue, display: "flex", flex: "none" }}><Icon name="sparkle" size={15} /></span>{w}</div>)}
          </div>
        ) : (
          <button onClick={() => openPaywall("matching")} style={{ width: "100%", textAlign: "left", marginTop: 9, border: "1.5px dashed #C9DCF8", background: "#fff", borderRadius: 14, padding: "11px 13px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
            <span style={{ color: C.purple, display: "flex" }}><Icon name="lock" size={16} /></span>
            <span style={{ flex: 1, fontSize: 12.5, color: C.text2 }}>{t("Lihat kecocokan & alasannya untuk profilmu", "See the match and reasons for your profile")}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "3px 8px", borderRadius: 99 }}>PLUS</span>
          </button>
        )}

        {elig.length > 0 && <>
          <H>{t("Cek kelayakan", "Eligibility check")}</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 9 }}>
            {elig.map(e => (
              <div key={e.t} style={{ display: "flex", gap: 10, alignItems: "center", background: "#F8FBFF", borderRadius: 13, padding: "10px 12px" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: e.ok ? C.tintGreen : C.tintYellow, color: e.ok ? C.green : C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={e.ok ? "check" : "info"} size={13} /></span>
                <span style={{ flex: 1, fontSize: 12.5, color: C.text }}>{e.t}</span>
                {!e.ok && e.fix && e.to && <button onClick={() => nav(e.to!)} style={{ border: "none", background: "none", fontSize: 11.5, fontWeight: 600, color: C.blue, cursor: "pointer", padding: 0, flex: "none" }}>{e.fix}</button>}
              </div>
            ))}
          </div>
        </>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{t("Persyaratan", "Requirements")}</div><span style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{ready}/{o.docs.length} {t("siap", "ready")}</span></div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 6 }}>
          {o.docs.map(d => {
            const on = !!tr?.checklist?.[d];
            return (
              <div key={d} style={{ display: "flex", gap: 11, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5FB" }}>
                <button onClick={() => toggleDoc(d)} aria-pressed={on} aria-label={d} style={{ width: 22, height: 22, borderRadius: 7, background: on ? C.green : "#fff", border: `1.5px solid ${on ? C.green : "#CBD5E1"}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", padding: 0 }}>{on && <Icon name="check" size={13} />}</button>
                <span onClick={() => toggleDoc(d)} style={{ flex: 1, fontSize: 13, color: on ? C.faint : C.text, textDecoration: on ? "line-through" : "none", cursor: "pointer" }}>{d}</span>
                <button onClick={() => on ? toggleDoc(d) : nav(`/app/copilot?q=${encodeURIComponent(`${t("Bantu aku menyiapkan", "Help me prepare")} ${d} (${o.title})`)}`)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11, fontWeight: 600, color: on ? C.green : C.blue, flex: "none" }}>{on ? t("Siap", "Ready") : t("Bantuan AI", "AI help")}</button>
              </div>
            );
          })}
        </div>

        <H>{t("Ringkasan", "Overview")}</H>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text2, whiteSpace: "pre-line" }}>{o.description || t("Detail lengkap ada di situs resmi penyelenggara.", "Full details are on the organizer's official site.")}</p>
        {(o.mode || o.cost) ? (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[o.mode && ({ online: "Online", offline: "Offline", hybrid: "Hybrid" } as Record<string, string>)[o.mode],
              o.cost && ({ gratis: t("Gratis", "Free"), berbayar: t("Berbayar", "Paid"), pendanaan_penuh: t("Didanai penuh", "Fully funded"), pendanaan_sebagian: t("Didanai sebagian", "Partially funded") } as Record<string, string>)[o.cost]].filter(Boolean).map(x => (
              <span key={x as string} style={{ fontSize: 11.5, fontWeight: 500, padding: "4px 10px", borderRadius: 99, background: C.tintBlue, color: C.blue }}>{x}</span>
            ))}
          </div>
        ) : null}
        {o.eligibility && <><div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginTop: 12 }}>{t("Siapa yang bisa daftar", "Who can apply")}</div><div style={{ marginTop: 5, fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{o.eligibility}</div></>}
        {(o.benefits?.length || o.prize_info) && <><div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginTop: 12 }}>{t("Manfaat", "Benefits")}</div><div style={{ marginTop: 5, fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{(o.benefits?.length ? o.benefits : [o.prize_info]).map((b, i) => <div key={i}>· {b}</div>)}</div></>}

        {(o.registration_start_date || o.registration_end_date) && <>
          <H>{t("Jadwal", "Timeline")}</H>
          <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            {[[t("Pendaftaran dibuka", "Registration opens"), o.registration_start_date], [t("Pendaftaran ditutup", "Registration closes"), o.registration_end_date], ["Deadline", o.deadline]].filter(([, d]) => d).map(([a, d]) => (
              <div key={a as string} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}><span>{a}</span><span style={{ color: C.muted, fontWeight: 600, flex: "none" }}>{fmtDate(d as string, lang)}</span></div>
            ))}
          </div>
        </>}

        <H>{t("Asisten Pendaftaran", "Application Assistant")}</H>
        <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 7 }}>
          {assistant.map(a => <button key={a} onClick={() => nav(`/app/copilot?q=${encodeURIComponent(`${a} (${o.title})`)}`)} style={{ border: `1.5px solid ${C.line}`, borderRadius: 99, background: "#fff", color: C.blue, fontSize: 12, fontWeight: 500, padding: "7px 12px", cursor: "pointer" }}>{a}</button>)}
        </div>

        {similar.length > 0 && <>
          <H>{t("Peluang serupa", "Similar opportunities")}</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 9 }}>
            {similar.map(s => (
              <button key={s.id} onClick={() => nav(`/app/opportunities/${s.id}`, { replace: true })} style={{ textAlign: "left", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 16, padding: 9, display: "flex", gap: 11, alignItems: "center", cursor: "pointer" }}>
                <ImgBox src={oppImg(s.type, s.poster_url, s.id)} w={54} h={48} r={11} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.title}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green, flex: "none" }}>{s.match}%</span>
              </button>
            ))}
          </div>
        </>}
        {!o.url && !applied && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: 14 }}>{t("Link pendaftaran belum tersedia.", "Registration link not available yet.")}</div>}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)", borderTop: "1px solid #EEF2F8", display: "flex", gap: 10, background: "#fff", zIndex: 2 }}>
        <button onClick={() => nav(`/app/copilot?q=${encodeURIComponent(`${assistant[0]} (${o.title})`)}`)} style={{ height: 54, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 16, color: C.text, fontSize: 13.5, fontWeight: 600, padding: "0 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: C.blue, display: "flex" }}><Icon name="sparkle" size={16} /></span>{t("Bantuan AI", "AI help")}</button>
        {applied
          ? <button onClick={() => nav("/app/tracker")} style={{ flex: 1, height: 54, border: "none", borderRadius: 16, background: C.green, color: "#fff", fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>{t("Sudah daftar · Lacak", "Applied · Track status")}</button>
          : <button onClick={apply} disabled={!o.url} style={{ flex: 1, height: 54, border: "none", borderRadius: 16, background: o.url ? C.blue : C.disabled, color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: o.url ? "pointer" : "not-allowed", boxShadow: o.url ? "0 10px 22px rgba(0,102,255,.28)" : "none" }}>{t("Daftar Sekarang", "Apply Now")} <Icon name="right" size={17} /></button>}
      </div>
      <Sheet open={confirmApply} onClose={() => setConfirmApply(false)} title={t("Sudah mendaftar?", "Did you apply?")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text2, lineHeight: 1.6 }}>{t("Pendaftaran dibuka di situs resmi penyelenggara. Setelah kamu mengirim pendaftaran, tandai di sini agar Tracker & Career Readiness-mu ter-update.", "Applications open on the organizer's official site. Once you've submitted, mark it here to update your Tracker & Career Readiness.")}</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={markApplied}>{t("Ya, aku sudah mendaftar", "Yes, I've applied")}</Btn>
          <Btn kind="outline" onClick={() => setConfirmApply(false)}>{t("Belum", "Not yet")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── MY APPLICATIONS (tracker) ──────────────────────────────────────── */
function Tracker() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, afterAction, toast } = useApp();
  const { data, isLoading } = useTracker();
  const { data: opps } = useOpportunities();
  const items = data ?? [];
  const [filter, setFilter] = useState<string>("active");
  const nextAction = (x: Tracked) => {
    const type = oppTypeOf(x.opportunity_type, x.opportunity_title);
    const docs = DEFAULT_DOC_COUNT(x, type);
    return ({
      saved: t("Mulai siapkan dokumen", "Start preparing documents"),
      preparing: t(`${docs.ready}/${docs.total} dokumen siap`, `${docs.ready}/${docs.total} documents ready`),
      applied: t("Tunggu pengumuman seleksi", "Wait for the selection announcement"),
      selection: t("Latihan interview dengan Tika AI", "Practise your interview with Tika AI"),
      accepted: t("Catat sebagai prestasi di Profil", "Log it as an achievement in Profile"),
      completed: t("Selesai", "Completed"),
      rejected: t("Coba peluang serupa", "Try a similar opportunity"),
    } as Record<string, string>)[x.status];
  };
  const advance = async (x: Tracked) => {
    const i = STAGES.indexOf(x.status as any);
    if (i < 0 || i >= STAGES.length - 1) return;
    const to = STAGES[i + 1];
    await db.from("saved_opportunities").update({ status: to, stage_changed_at: new Date().toISOString(), ...(to === "applied" ? { applied_at: new Date().toISOString() } : {}) }).eq("id", x.id);
    await qc.invalidateQueries({ queryKey: ["m-tracker"] });
    if (to === "accepted") { toast(t("Selamat! Catat sebagai prestasi untuk portofoliomu.", "Congrats! Log it as an achievement for your portfolio.")); nav(`/app/achievements?from=${encodeURIComponent(x.opportunity_title)}`); return; }
    await afterAction(t(`${x.opportunity_title} → ${STAGE_LABEL[to][0]}`, `${x.opportunity_title} → ${STAGE_LABEL[to][1]}`));
  };
  const reject = async (x: Tracked) => { await db.from("saved_opportunities").update({ status: "rejected" }).eq("id", x.id); qc.invalidateQueries({ queryKey: ["m-tracker"] }); };
  const DOTS = ["saved", "preparing", "applied", "selection", "accepted"] as const;
  const shown = items.filter(x => filter === "active" ? !["completed", "rejected", "accepted"].includes(x.status) : filter === "done" ? ["completed", "rejected", "accepted"].includes(x.status) : true);
  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => nav(-1)} />
        <div style={{ flex: 1 }}><div style={{ fontSize: 19, fontWeight: 700 }}>{t("Lamaranku", "My Applications")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t(`${items.length} peluang dilacak`, `${items.length} opportunities tracked`)}</div></div>
        <IconBtn icon="cal" label={t("Kalender", "Calendar")} onClick={() => nav("/app/calendar")} />
      </div>
      <div style={{ padding: "14px 20px 0" }}>
        <Tabs bleed={false} value={filter} onChange={v => setFilter(v as string)} items={[{ value: "active", label: t("Aktif", "Active") }, { value: "done", label: t("Selesai", "Finished") }, { value: "all", label: t("Semua", "All") }]} />
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {!isLoading && !items.length && <Empty icon="bookmark" title={t("Belum ada lamaran", "No applications yet")} body={t("Simpan peluang untuk mulai melacak dan dapat pengingat deadline.", "Save opportunities to start tracking and get deadline reminders.")} action={<Btn h={44} onClick={() => nav("/app/explore")}>{t("Cari peluang", "Find opportunities")}</Btn>} />}
        {shown.map(x => {
          const type = oppTypeOf(x.opportunity_type, x.opportunity_title);
          const src = opps?.find(o => o.id === x.opportunity_id);
          const d = daysUntil(x.deadline);
          const cur = DOTS.indexOf(x.status as any);
          const rejected = x.status === "rejected";
          const si = STAGES.indexOf(x.status as any);
          const canAdvance = si >= 0 && si < STAGES.length - 1;
          return (
            <div key={x.id} style={{ background: "#fff", borderRadius: 20, padding: 14, boxShadow: SH.card }}>
              <div onClick={() => nav(`/app/opportunities/${x.opportunity_id}`)} style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
                <ImgBox src={oppImg(type, src?.poster_url, x.opportunity_id)} w={54} h={54} r={13} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{x.opportunity_title}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                    {t(...STAGE_LABEL[x.status] ?? ["—", "—"])} · <span style={{ color: deadlineColor(d).c }}>{d === null ? t("Bergulir", "Rolling") : d < 0 ? t("Lewat", "Passed") : `${fmtDate(x.deadline!, lang, { day: "numeric", month: "short" })} · ${t(`${d} hari`, `${d}d`)}`}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 12 }}>
                {DOTS.map((s, i) => {
                  const on = !rejected && (x.status === "completed" || i <= cur);
                  return (
                    <div key={s}>
                      <div style={{ height: 5, borderRadius: 99, background: rejected && i === 3 ? C.red : on ? (i === cur ? C.blue : C.green) : C.track }} />
                      <div style={{ fontSize: 9.5, fontWeight: 500, color: on ? C.text : C.faint, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t(...STAGE_LABEL[s])}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: C.bg, borderRadius: 12, padding: "9px 11px", fontSize: 12, color: C.text2 }}>
                <span style={{ color: C.blue, display: "flex" }}><Icon name="target" size={15} /></span>
                <span style={{ flex: 1 }}>{t("Berikutnya", "Next")}: {nextAction(x)}</span>
                {canAdvance && !rejected && <button onClick={() => advance(x)} style={{ border: "none", background: C.blue, color: "#fff", fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 99, cursor: "pointer", flex: "none" }}>{t(STAGE_LABEL[STAGES[si + 1]][0], STAGE_LABEL[STAGES[si + 1]][1])} →</button>}
              </div>
              {x.status === "selection" && <button onClick={() => reject(x)} style={{ marginTop: 8, border: "none", background: "none", color: C.faint, fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>{t("Tandai belum lolos", "Mark as not selected")}</button>}
            </div>
          );
        })}
        {!isLoading && items.length > 0 && !shown.length && <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: C.muted }}>{t("Tidak ada di kategori ini.", "Nothing in this category.")}</div>}
      </div>
    </Screen>
  );
}
function DEFAULT_DOC_COUNT(x: Tracked, type: OppType) {
  const docs = docsFor({ requirements: null, type });
  const keys = Object.keys(x.checklist || {});
  const all = Array.from(new Set([...docs, ...keys]));
  return { total: all.length, ready: keys.filter(k => x.checklist[k]).length };
}

/* ── DEADLINE CALENDAR ──────────────────────────────────────────────── */
interface Ev { date: Date; title: string; type: string; c: string; time: string; url?: string }
function Calendar() {
  const nav = useNavigate();
  const { t, lang, user, toast } = useApp();
  const { data: tracker } = useTracker();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState(() => new Date().getDate());
  const { data: extra } = useQuery({
    queryKey: ["m-cal-extra", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: b }, { data: ev }] = await Promise.all([
        db.from("mentor_bookings").select("session_date,status,mentors(name)").eq("user_id", user!.id).in("status", ["pending", "confirmed"]),
        db.from("community_events").select("*").eq("is_active", true).limit(50),
      ]);
      return { bookings: b ?? [], events: ev ?? [] };
    },
  });
  const events: Ev[] = useMemo(() => {
    const out: Ev[] = [];
    (tracker ?? []).filter(x => x.deadline && !["completed", "rejected"].includes(x.status)).forEach(x => {
      const ty = oppTypeOf(x.opportunity_type, x.opportunity_title); const d = daysUntil(x.deadline);
      out.push({ date: new Date(x.deadline!), title: `Deadline · ${x.opportunity_title}`, type: t(TYPE_ID[ty], ty), c: d !== null && d <= 3 ? C.red : d !== null && d <= 10 ? C.orange : ty === "Competition" ? C.blue : C.green, time: "23.59 WIB" });
    });
    (extra?.bookings ?? []).forEach((b: any) => out.push({ date: new Date(b.session_date), title: `Mentoring · ${b.mentors?.name ?? "Mentor"}`, type: "Mentor", c: C.green, time: new Date(b.session_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB" }));
    (extra?.events ?? []).forEach((e: any) => { const d = e.event_date ?? e.start_date ?? e.starts_at; if (d) out.push({ date: new Date(d), title: e.title, type: "Event", c: C.purple, time: new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB" }); });
    return out.sort((a, b) => +a.date - +b.date);
  }, [tracker, extra, t]);
  const y = month.getFullYear(), m = month.getMonth();
  const inMonth = events.filter(e => e.date.getFullYear() === y && e.date.getMonth() === m);
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = 0
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const dayEvents = inMonth.filter(e => e.date.getDate() === day);
  const monthLabel = month.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { month: "long", year: "numeric" });

  const ics = () => {
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = events.filter(e => +e.date >= Date.now() - 86400000).map((e, i) => [
      "BEGIN:VEVENT", `UID:talentika-${i}-${+e.date}@talentika.id`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(e.date)}`, `DTEND:${f(new Date(+e.date + 3600000))}`,
      `SUMMARY:${e.title.replace(/[,;]/g, " ")}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Talentika", "END:VALARM", "END:VEVENT"].join("\r\n")).join("\r\n");
    const blob = new Blob([`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Talentika//Mobile//ID\r\nX-WR-CALNAME:Talentika\r\n${body}\r\nEND:VCALENDAR`], { type: "text/calendar" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "talentika-deadlines.ics"; a.click();
    toast(t("File kalender diunduh — buka untuk menambah ke Google/Apple Calendar", "Calendar file downloaded — open it to add to Google/Apple Calendar"));
  };
  const gcal = (e: Ev) => {
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    openExternal(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title)}&dates=${f(e.date)}/${f(new Date(+e.date + 3600000))}&details=${encodeURIComponent("Dari Talentika")}`);
  };
  const card: React.CSSProperties = { background: "#fff", borderRadius: 20, padding: 16, boxShadow: SH.card };
  const navBtn = (lbl: string, icon: string, fn: () => void) => <button onClick={fn} aria-label={lbl} style={{ width: 36, height: 36, border: "none", borderRadius: "50%", background: C.soft, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={17} /></button>;
  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => nav(-1)} />
        <div style={{ flex: 1, fontSize: 19, fontWeight: 700 }}>{t("Kalender Deadline", "Deadline Calendar")}</div>
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            {navBtn(t("Bulan sebelumnya", "Previous month"), "left", () => { setMonth(new Date(y, m - 1, 1)); setDay(1); })}
            <span style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{monthLabel}</span>
            {navBtn(t("Bulan berikutnya", "Next month"), "right", () => { setMonth(new Date(y, m + 1, 1)); setDay(1); })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", textAlign: "center", fontSize: 10.5, fontWeight: 600, color: C.faint }}>
            {(lang === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]).map(d => <span key={d}>{d}</span>)}
          </div>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4 }}>
            {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(d => {
              const on = d === day; const ev = inMonth.filter(e => e.date.getDate() === d);
              const past = new Date(y, m, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button key={d} onClick={() => setDay(d)} style={{ height: 44, border: "none", borderRadius: 12, background: on ? C.blue : isToday(d) ? C.tintBlue : "transparent", color: on ? "#fff" : past ? C.disabled : C.text,
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0 }}>
                  <span>{d}</span>
                  <span style={{ display: "flex", gap: 2, height: 5 }}>{ev.slice(0, 3).map((e, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: "50%", background: on ? "#fff" : e.c }} />)}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 11, color: C.muted }}>
            {[[C.red, t("≤3 hari", "≤3 days")], [C.orange, t("≤10 hari", "≤10 days")], [C.blue, t("Kompetisi", "Competition")], [C.green, "Mentor / Global"], [C.purple, "Event"]].map(([c, l]) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}</span>)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{new Date(y, m, day).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={{ marginTop: 6 }}>
            {dayEvents.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
                <span style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: e.c }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</div><div style={{ fontSize: 11.5, color: C.faint, marginTop: 1 }}>{e.type} · {e.time}</div></div>
                <button onClick={() => gcal(e)} style={{ border: "none", background: C.tintBlue, color: C.blue, borderRadius: 99, fontSize: 11, fontWeight: 600, padding: "5px 9px", cursor: "pointer" }}>+ GCal</button>
              </div>
            ))}
            {!dayEvents.length && <div style={{ padding: "10px 0", fontSize: 13, color: C.faint }}>{t("Tidak ada agenda di hari ini.", "Nothing scheduled this day.")}</div>}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Mendatang bulan ini", "Upcoming this month")}</div>
          {inMonth.filter(e => +e.date >= Date.now() - 86400000).map((e, i, a) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < a.length - 1 ? `1px solid ${C.track}` : "none" }}>
              <span style={{ width: 48, fontSize: 12, fontWeight: 700, color: e.c, flex: "none" }}>{e.date.getDate()} {e.date.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { month: "short" })}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{e.title}</span>
            </div>
          ))}
          {!inMonth.length && <div style={{ padding: "10px 0", fontSize: 13, color: C.faint }}>{t("Belum ada agenda bulan ini.", "Nothing this month yet.")}</div>}
        </div>
        <Btn onClick={ics} disabled={!events.length}><Icon name="download" size={18} />{t("Ekspor ke kalender HP (.ics)", "Export to phone calendar (.ics)")}</Btn>
      </div>
    </Screen>
  );
}
