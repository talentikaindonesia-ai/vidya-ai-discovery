import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, errMsg, OppRow, openExternal, Tracked, useApp, useCareers, useDna, useOpportunities, useTracker } from "../store";
import { Body, Btn, Card, CardTitle, Check, ChipBtn, Empty, FilterChip, Header, HScroll, Kicker, Loading, Pill, Ring, Row, Screen, Sheet, TabTitle } from "../ui";
import { C, F, SH, daysUntil, deadlineColor } from "../theme";
import { docsFor, fmtDate, OppType, oppMatch, oppTypeOf, TYPEC, TYPE_ID } from "../logic";

export default function Opportunities({ screen }: { screen: "list" | "detail" | "tracker" | "calendar" }) {
  switch (screen) {
    case "detail": return <Detail />;
    case "tracker": return <Tracker />;
    case "calendar": return <Calendar />;
    default: return <List />;
  }
}

const STAGES = ["saved", "preparing", "applied", "selection", "accepted", "completed"] as const;
const STAGE_LABEL: Record<string, [string, string]> = {
  saved: ["Disimpan", "Saved"], preparing: ["Persiapan", "Preparing"], applied: ["Mendaftar", "Applied"],
  selection: ["Seleksi", "Selection"], accepted: ["Diterima", "Accepted"], completed: ["Selesai", "Completed"], rejected: ["Belum lolos", "Not selected"],
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
      const m = oppMatch({ ...o, type }, { axes: dna?.axes, tujuan: profile?.tujuan, careerField: target?.field, careerName: target?.name });
      const tr = tmap.get(o.id) ?? null;
      const docs = docsFor({ requirements: o.requirements, type });
      const missing = docs.filter(d => !tr?.checklist?.[d]);
      return { ...o, type, match: m.match, why: m.why, tracked: tr, docs, missing, days: daysUntil(o.deadline) };
    }).sort((a, b) => b.match - a.match);
  }, [opps, tracker, dna, profile, target]);
  return { list, isLoading, tracker: tracker ?? [] };
}
type Opp = ReturnType<typeof useEnriched>["list"][number];

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

function DeadlineText({ o }: { o: { deadline: string | null; days: number | null } }) {
  const { t, lang } = useApp();
  const dc = deadlineColor(o.days);
  return <span style={{ fontWeight: 700, fontFamily: F.display, color: dc.c }}>⏰ {o.deadline ? fmtDate(o.deadline, lang) : t("Tanpa tenggat", "No deadline")}</span>;
}

/* 49 OPPORTUNITIES (OPP-01, OPP-02) */
function List() {
  const nav = useNavigate();
  const { t } = useApp();
  const { list, isLoading, tracker } = useEnriched();
  const save = useSaveToggle();
  const [type, setType] = useState<OppType | null>(null);
  const [f, setF] = useState<{ soon: boolean; online: boolean; free: boolean; sma: boolean }>({ soon: false, online: false, free: false, sma: false });
  const active = tracker.filter(x => !["accepted", "completed", "rejected"].includes(x.status)).map(x => daysUntil(x.deadline)).filter((d): d is number => d !== null && d >= 0);
  const dl = { r: active.filter(d => d <= 3).length, o: active.filter(d => d > 3 && d <= 10).length, g: active.filter(d => d > 10).length };
  const shown = list.filter(o => (!type || o.type === type)
    && (!f.soon || (o.days !== null && o.days <= 30))
    && (!f.online || /online|daring|virtual/i.test(`${o.location} ${o.title}`))
    && (!f.free || /gratis|free|tanpa biaya|fully funded|pendanaan penuh/i.test(`${o.description} ${o.prize_info}`))
    && (!f.sma || /sma|smk|siswa|pelajar|high school/i.test(`${o.description} ${o.title}`)));
  const fresh = list.filter(o => o.match >= 70).length;
  const types: [OppType | null, string][] = [[null, t("Semua", "All")], ["Scholarship", "Scholarships"], ["Competition", "Competitions"], ["Internship", "Internships"], ["Global", "Global"], ["Research", "Research"], ["Bootcamp", "Bootcamps"]];
  return (
    <Screen tab>
      <TabTitle title="Opportunities" right={<>
        <button onClick={() => nav("/app/calendar")} aria-label={t("Kalender deadline", "Deadline calendar")} style={{ width: 38, height: 38, border: "none", borderRadius: 12, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontSize: 16 }}>📅</button>
        <button onClick={() => nav("/app/tracker")} style={{ height: 38, border: "none", borderRadius: 12, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: C.blue, padding: "0 13px" }}>Tracker · {tracker.length}</button>
      </>} />
      <div style={{ padding: "14px 20px 0" }}>
        <Card pad={16}>
          <Kicker color={C.blue} style={{ letterSpacing: ".6px" }}>For you</Kicker>
          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 800 }}>{t(`${fresh} peluang cocok untukmu`, `${fresh} opportunities matched to you`)}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {[["#FDECEC", C.red, "#991B1B", `≤3 ${t("hari", "days")} · ${dl.r}`], ["#FFEDE2", C.orange, "#9A3412", `≤10 ${t("hari", "days")} · ${dl.o}`], ["#E6F7EF", C.green, C.greenDark, `>10 ${t("hari", "days")} · ${dl.g}`]].map(([bg, dot, fg, l]) => (
              <div key={l} style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, background: bg, borderRadius: 12, padding: "9px 10px" }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, flex: "none" }} /><span style={{ fontSize: 11.5, fontWeight: 700, color: fg }}>{l}</span></div>
            ))}
          </div>
        </Card>
      </div>
      <HScroll gap={8} style={{ margin: "14px 0 0", padding: "0 20px 2px" }}>
        {types.map(([v, l]) => <ChipBtn key={l} on={type === v} onClick={() => setType(v)}>{l}</ChipBtn>)}
      </HScroll>
      <HScroll gap={7} style={{ margin: "9px 0 0", padding: "0 20px" }}>
        <FilterChip on={f.soon} onClick={() => setF(s => ({ ...s, soon: !s.soon }))}>Deadline ≤30 {t("hari", "days")}</FilterChip>
        <FilterChip on={f.online} onClick={() => setF(s => ({ ...s, online: !s.online }))}>Online</FilterChip>
        <FilterChip on={f.free} onClick={() => setF(s => ({ ...s, free: !s.free }))}>{t("Gratis", "Free")}</FilterChip>
        <FilterChip on={f.sma} onClick={() => setF(s => ({ ...s, sma: !s.sma }))}>{t("Untuk SMA/SMK", "High school")}</FilterChip>
      </HScroll>
      <Body top={14} gap={12}>
        {isLoading && <Loading />}
        {shown.map(o => (
          <Card key={o.id} pad={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pill display size={10.5} fg={TYPEC[o.type][1]} bg={TYPEC[o.type][0]}>{t(TYPE_ID[o.type], o.type)}</Pill>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: F.display, color: C.green }}>{o.match}% Match</span>
              <button onClick={() => save(o, o.tracked)} aria-label={o.tracked ? t("Hapus dari Tracker", "Remove from Tracker") : t("Simpan", "Save")} style={{ border: "none", background: "none", fontSize: 19, color: o.tracked ? C.orange : C.faint, cursor: "pointer", padding: "0 0 0 4px", lineHeight: 1 }}>{o.tracked ? "★" : "☆"}</button>
            </div>
            <div style={{ marginTop: 9, fontSize: 16, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{o.title}</div>
            <div style={{ marginTop: 3, fontSize: 12, color: C.muted }}>{o.organizer ?? o.source_website ?? ""}</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 12 }}>
              <DeadlineText o={o} /><span style={{ color: C.text3, fontWeight: 600 }}>📍 {o.location || "—"}</span>
            </div>
            <div style={{ marginTop: 11, background: C.subtle, borderRadius: 13, padding: "11px 13px" }}>
              <Kicker style={{ letterSpacing: ".4px" }}>Why you match</Kicker>
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "5px 12px" }}>{o.why.map(w => <span key={w} style={{ fontSize: 12, fontWeight: 700, color: C.green }}>✓ {w}</span>)}</div>
              {o.missing.length > 0 && <div style={{ marginTop: 5, fontSize: 12, fontWeight: 700, color: C.gold }}>△ {o.tracked ? "Missing" : t("Siapkan", "Prepare")}: {o.missing[0]}</div>}
            </div>
            <Btn h={44} onClick={() => nav(`/app/opportunities/${o.id}`)} style={{ marginTop: 12, fontSize: 13.5 }}>{t("Lihat peluang", "View Opportunity")}</Btn>
          </Card>
        ))}
        {!isLoading && !shown.length && <Empty icon="🔍" title={t("Belum ada peluang di kategori ini", "No opportunities in this category yet")} body={t("Tim Talentika mengkurasi peluang dari sumber resmi secara manual. Cek lagi minggu ini.", "The Talentika team curates opportunities from official sources by hand. Check back this week.")} />}
      </Body>
    </Screen>
  );
}

const ACTION_WORDS: [RegExp, string][] = [[/esai|essay|motivasi|motivation/i, "esai"], [/cv|resume/i, "cv"], [/proposal/i, "proposal"], [/abstrak|abstract|riset|research/i, "riset"], [/portofolio|portfolio/i, "portofolio"], [/video|pitch/i, "pitch"]];

/* 51 OPPORTUNITY DETAIL (OPP-03, OPP-06, OPP-07) */
function Detail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, afterAction, track, toast } = useApp();
  const { list, isLoading } = useEnriched();
  const save = useSaveToggle();
  const [confirmApply, setConfirmApply] = useState(false);
  const o = list.find(x => x.id === id);
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

  if (isLoading) return <Loading />;
  if (!o) return <Screen><Header title="Opportunity" /><Body><Empty icon="🕰️" title={t("Peluang sudah ditutup atau tidak ditemukan", "Opportunity closed or not found")} action={<Btn kind="outline" h={44} onClick={() => nav("/app/opportunities")}>{t("Lihat peluang lain", "See other opportunities")}</Btn>} /></Body></Screen>;
  const tr = o.tracked;
  const applied = !!tr && ["applied", "selection", "accepted", "completed"].includes(tr.status);
  const dc = deadlineColor(o.days);
  const similar = list.filter(x => x.id !== o.id && x.type === o.type).slice(0, 2);
  const ready = o.docs.filter(d => tr?.checklist?.[d]).length;

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

  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => nav(-1)} aria-label="Kembali" style={{ width: 40, height: 40, border: "none", borderRadius: 12, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontSize: 17, color: C.text, flex: "none", fontFamily: "inherit" }}>←</button>
        <Pill display fg={TYPEC[o.type][1]} bg={TYPEC[o.type][0]} style={{ padding: "5px 10px" }}>{t(TYPE_ID[o.type], o.type)}</Pill>
        <span style={{ flex: 1 }} />
        <button onClick={() => save(o, tr)} aria-label={t("Simpan", "Save")} style={{ width: 40, height: 40, border: "none", borderRadius: 12, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontSize: 19, color: tr ? C.orange : C.faint, flex: "none" }}>{tr ? "★" : "☆"}</button>
      </div>
      <Body top={14} gap={12}>
        <Card radius={22}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px", lineHeight: 1.25 }}>{o.title}</h1><div style={{ marginTop: 4, fontSize: 12.5, color: C.muted }}>{o.organizer ?? o.source_website}</div></div>
            <Ring value={o.match} size={64} stroke={7} color={C.green}><span style={{ fontSize: 15, fontWeight: 700, fontFamily: F.display, lineHeight: 1 }}>{o.match}%</span><span style={{ fontSize: 8, fontWeight: 700, color: C.faint }}>MATCH</span></Ring>
          </div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
            <div style={{ background: dc.bg, borderRadius: 12, padding: 10 }}><div style={{ fontSize: 10, fontWeight: 700, fontFamily: F.display, color: C.faint }}>DEADLINE</div><div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700, fontFamily: F.display, color: dc.c }}>{o.deadline ? fmtDate(o.deadline, lang) : "—"}</div></div>
            <div style={{ background: C.subtle, borderRadius: 12, padding: 10 }}><div style={{ fontSize: 10, fontWeight: 700, fontFamily: F.display, color: C.faint }}>LOCATION</div><div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700 }}>{o.location || "—"}</div></div>
            <div style={{ background: C.subtle, borderRadius: 12, padding: 10 }}><div style={{ fontSize: 10, fontWeight: 700, fontFamily: F.display, color: C.faint }}>{t("SISA WAKTU", "TIME LEFT")}</div><div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 700 }}>{o.days === null ? "—" : t(`${o.days} hari`, `${o.days} days`)}</div></div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: C.faint }}>{t("Waktu ditampilkan dalam WIB. Fakta peluang dari sumber resmi, bukan dari AI.", "Times shown in WIB. Opportunity facts come from official sources, not AI.")}</div>
        </Card>
        <Card>
          <CardTitle>{t("Kenapa direkomendasikan", "Why this is recommended")}</CardTitle>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>{o.why.map(w => <span key={w} style={{ fontSize: 13.5, fontWeight: 600, color: C.greenDark }}>✓ {w}</span>)}</div>
          {missing0 && (<>
            <Kicker style={{ marginTop: 12 }}>Gap</Kicker>
            <div style={{ marginTop: 5, fontSize: 13.5, fontWeight: 600, color: action?.done ? C.green : C.gold }}>{action?.done ? "✓ Resolved:" : "△ Missing:"} {missing0}</div>
            {action && !action.done && (
              <div onClick={() => nav(`/app/course/${action.id}`)} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 11, background: C.tintBlue, borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}>
                <span style={{ fontSize: 18 }}>📘</span><div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, color: C.blue }}>RECOMMENDED ACTION</div><div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 700 }}>Complete: {action.title}</div></div><span style={{ color: C.blue, fontWeight: 800 }}>→</span>
              </div>
            )}
          </>)}
        </Card>
        <Card>
          <CardTitle>Overview</CardTitle>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text3, whiteSpace: "pre-line" }}>{o.description || t("Detail lengkap ada di situs resmi penyelenggara.", "Full details are on the organizer's official site.")}</p>
          {o.prize_info && (<><Kicker style={{ marginTop: 12 }}>Benefits</Kicker><div style={{ marginTop: 7, fontSize: 13, color: C.text3, lineHeight: 1.5 }}>· {o.prize_info}</div></>)}
        </Card>
        {(o.registration_start_date || o.registration_end_date || o.deadline) && (
          <Card>
            <CardTitle>Timeline</CardTitle>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
              {[[t("Pendaftaran dibuka", "Registration opens"), o.registration_start_date], [t("Pendaftaran ditutup", "Registration closes"), o.registration_end_date], ["Deadline", o.deadline]].filter(([, d]) => d).map(([a, d]) => (
                <div key={a as string} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}><span style={{ fontWeight: 600 }}>{a}</span><span style={{ color: C.muted, fontWeight: 700, flex: "none" }}>{fmtDate(d as string, lang)}</span></div>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <CardTitle right={<span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.blue }}>{ready}/{o.docs.length} {t("siap", "ready")}</span>}>Application Checklist</CardTitle>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {o.docs.map(d => { const on = !!tr?.checklist?.[d]; return (
              <div key={d} onClick={() => toggleDoc(d)} style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", padding: "4px 0" }}>
                <Check on={on} /><span style={{ fontSize: 13.5, fontWeight: 600, color: on ? C.faint : C.text2, textDecoration: on ? "line-through" : "none" }}>{d}</span>
              </div>); })}
          </div>
          <Kicker style={{ marginTop: 14 }}>✦ Application Assistant</Kicker>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {assistant.map(a => <button key={a} onClick={() => nav(`/app/copilot?q=${encodeURIComponent(`${a} (${o.title})`)}`)} style={{ border: `1.5px solid ${C.line}`, borderRadius: 99, background: "#fff", color: C.blue, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 12px", cursor: "pointer" }}>{a}</button>)}
          </div>
        </Card>
        {similar.length > 0 && (
          <Card pad="14px 18px">
            <div style={{ fontSize: 14, fontWeight: 800 }}>Similar opportunities</div>
            {similar.map((s, i) => <Row key={s.id} last={i === similar.length - 1} onClick={() => nav(`/app/opportunities/${s.id}`, { replace: true })}><span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{s.title}</span><span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.green }}>{s.match}%</span></Row>)}
          </Card>
        )}
        {applied ? <Btn kind="success" h={54} onClick={() => nav("/app/tracker")}>Applied ✓ · {t("Lihat di Tracker", "See in Tracker")}</Btn>
          : <Btn kind="orange" h={54} onClick={apply} disabled={!o.url} style={{ fontSize: 16 }}>Apply Now</Btn>}
        {!o.url && !applied && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: -6 }}>{t("Link pendaftaran belum tersedia.", "Registration link not available yet.")}</div>}
      </Body>
      <Sheet open={confirmApply} onClose={() => setConfirmApply(false)} title={t("Sudah mendaftar?", "Did you apply?")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>{t("Pendaftaran dibuka di situs resmi penyelenggara. Setelah kamu mengirim pendaftaran, tandai di sini agar Tracker & Career Readiness-mu ter-update.", "Applications open on the organizer's official site. Once you've submitted, mark it here to update your Tracker & Career Readiness.")}</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn kind="orange" onClick={markApplied}>{t("Ya, aku sudah mendaftar", "Yes, I've applied")}</Btn>
          <Btn kind="outline" onClick={() => setConfirmApply(false)}>{t("Belum", "Not yet")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* 55 APPLICATION TRACKER (OPP-04) */
function Tracker() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, afterAction, toast } = useApp();
  const { data, isLoading } = useTracker();
  const items = data ?? [];
  const nextAction = (x: Tracked) => {
    const type = oppTypeOf(x.opportunity_type, x.opportunity_title);
    const docs = DEFAULT_DOC_COUNT(x, type);
    return ({
      saved: t("Mulai siapkan dokumen", "Start preparing documents"),
      preparing: t(`${docs.ready}/${docs.total} dokumen siap`, `${docs.ready}/${docs.total} documents ready`),
      applied: t("Tunggu pengumuman seleksi", "Wait for the selection announcement"),
      selection: t("Latihan interview dengan AI Copilot", "Practise your interview with AI Copilot"),
      accepted: t("Catat sebagai prestasi di Profil", "Log it as an achievement in Profile"),
      completed: t("Selesai 🎉", "Completed 🎉"),
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
  return (
    <Screen>
      <Header title="Opportunity Tracker" sub="Saved → Preparing → Applied → Selection → Accepted" />
      <HScroll gap={7} style={{ margin: "14px 0 0", padding: "0 20px 2px" }}>
        {STAGES.map(s => { const n = items.filter(x => x.status === s).length; return (
          <div key={s} style={{ flex: "none", background: n ? C.tintBlue : "#fff", borderRadius: 13, padding: "9px 12px", textAlign: "center", boxShadow: SH.chip }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: n ? C.blueDark : C.faint }}>{n}</div><div style={{ fontSize: 10.5, fontWeight: 700, color: n ? C.blueDark : C.faint }}>{t(...STAGE_LABEL[s])}</div>
          </div>); })}
      </HScroll>
      <Body gap={16}>
        {isLoading && <Loading />}
        {!isLoading && !items.length && <Empty icon="📌" title={t("Tracker masih kosong", "Your tracker is empty")} body={t("Simpan peluang (☆) untuk mulai melacak dan dapat pengingat deadline.", "Save opportunities (☆) to start tracking and get deadline reminders.")} action={<Btn h={44} onClick={() => nav("/app/opportunities")}>{t("Cari peluang", "Find opportunities")}</Btn>} />}
        {[...STAGES, "rejected" as const].map((s, si) => {
          const g = items.filter(x => x.status === s);
          if (!g.length) return null;
          return (
            <div key={s}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: F.display, color: C.muted, letterSpacing: ".3px" }}>{t(...STAGE_LABEL[s])} · {g.length}</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 9 }}>
                {g.map(x => {
                  const type = oppTypeOf(x.opportunity_type, x.opportunity_title);
                  const d = daysUntil(x.deadline); const dc = deadlineColor(d);
                  return (
                    <div key={x.id} style={{ background: "#fff", borderRadius: 17, padding: 14, boxShadow: SH.cardSm }}>
                      <div onClick={() => nav(`/app/opportunities/${x.opportunity_id}`)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <Pill display size={10.5} fg={TYPEC[type][1]} bg={TYPEC[type][0]}>{t(TYPE_ID[type], type)}</Pill>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.opportunity_title}</span>
                        {d !== null && <Pill display size={10.5} fg={dc.c} bg={dc.bg} style={{ padding: "4px 8px" }}>{d < 0 ? t("Lewat", "Passed") : t(`${d} hari lagi`, `${d}d left`)}</Pill>}
                      </div>
                      <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 12, color: C.muted }}>Next: {nextAction(x)}</span>
                        {si < STAGES.length - 1 && s !== "rejected" && <button onClick={() => advance(x)} style={{ border: "none", background: C.tintBlue, color: C.blueDark, fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, padding: "6px 10px", borderRadius: 99, cursor: "pointer", flex: "none" }}>{t(`Ke ${STAGE_LABEL[STAGES[si + 1]][0]} →`, `Move to ${STAGE_LABEL[STAGES[si + 1]][1]} →`)}</button>}
                      </div>
                      {s === "selection" && <button onClick={() => reject(x)} style={{ marginTop: 6, border: "none", background: "none", color: C.faint, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>{t("Belum lolos", "Not selected")}</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Body>
    </Screen>
  );
}
function DEFAULT_DOC_COUNT(x: Tracked, type: OppType) {
  const docs = docsFor({ requirements: null, type });
  const keys = Object.keys(x.checklist || {});
  const all = Array.from(new Set([...docs, ...keys]));
  return { total: all.length, ready: keys.filter(k => x.checklist[k]).length };
}

/* 56 DEADLINE CALENDAR (OPP-05) */
interface Ev { date: Date; title: string; type: string; c: string; time: string; url?: string }
function Calendar() {
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
  return (
    <Screen>
      <Header title="Deadline Calendar" sub={monthLabel} right={<div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => { setMonth(new Date(y, m - 1, 1)); setDay(1); }} aria-label="Bulan sebelumnya" style={{ width: 34, height: 34, border: "none", borderRadius: 10, background: "#fff", boxShadow: SH.btn, cursor: "pointer" }}>‹</button>
        <button onClick={() => { setMonth(new Date(y, m + 1, 1)); setDay(1); }} aria-label="Bulan berikutnya" style={{ width: 34, height: 34, border: "none", borderRadius: 10, background: "#fff", boxShadow: SH.btn, cursor: "pointer" }}>›</button>
      </div>} />
      <Body>
        <Card pad={16}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", textAlign: "center", fontSize: 10.5, fontWeight: 700, fontFamily: F.display, color: C.faint }}>
            {(lang === "en" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]).map(d => <span key={d}>{d}</span>)}
          </div>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4 }}>
            {Array.from({ length: lead }).map((_, i) => <span key={"b" + i} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map(d => {
              const on = d === day; const ev = inMonth.filter(e => e.date.getDate() === d);
              const past = new Date(y, m, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button key={d} onClick={() => setDay(d)} style={{ height: 44, border: "none", borderRadius: 12, background: on ? C.blue : isToday(d) ? C.tintBlue : "transparent", color: on ? "#fff" : past ? C.disabled : C.text,
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0 }}>
                  <span>{d}</span>
                  <span style={{ display: "flex", gap: 2, height: 5 }}>{ev.slice(0, 3).map((e, k) => <span key={k} style={{ width: 5, height: 5, borderRadius: "50%", background: on ? "#fff" : e.c }} />)}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 11, fontWeight: 700, color: C.muted }}>
            {[[C.red, "≤3 hari"], [C.orange, "≤10 hari"], [C.blue, "Kompetisi"], [C.green, "Mentor / Global"], [C.purple, "Event"]].map(([c, l]) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}</span>)}
          </div>
        </Card>
        <Card>
          <CardTitle>{new Date(y, m, day).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</CardTitle>
          <div style={{ marginTop: 6 }}>
            {dayEvents.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
                <span style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: e.c }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{e.title}</div><div style={{ fontSize: 11.5, color: C.faint, marginTop: 1 }}>{e.type} · {e.time}</div></div>
                <button onClick={() => gcal(e)} style={{ border: "none", background: C.tintBlue, color: C.blueDark, borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "5px 9px", cursor: "pointer", fontFamily: "inherit" }}>+ GCal</button>
              </div>
            ))}
            {!dayEvents.length && <div style={{ padding: "10px 0", fontSize: 13, color: C.faint }}>{t("Nggak ada agenda di hari ini.", "Nothing scheduled this day.")}</div>}
          </div>
        </Card>
        <Card>
          <CardTitle>{t("Upcoming bulan ini", "Upcoming this month")}</CardTitle>
          {inMonth.filter(e => +e.date >= Date.now() - 86400000).map((e, i, a) => (
            <Row key={i} last={i === a.length - 1} style={{ padding: "10px 0" }}><span style={{ width: 46, fontSize: 12, fontWeight: 700, fontFamily: F.display, color: e.c, flex: "none" }}>{e.date.getDate()} {e.date.toLocaleDateString("id-ID", { month: "short" })}</span><span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{e.title}</span></Row>
          ))}
          {!inMonth.length && <div style={{ padding: "10px 0", fontSize: 13, color: C.faint }}>{t("Belum ada agenda bulan ini.", "Nothing this month yet.")}</div>}
        </Card>
        <Btn onClick={ics} disabled={!events.length}>{t("Ekspor ke kalender HP (.ics)", "Export to phone calendar (.ics)")}</Btn>
      </Body>
    </Screen>
  );
}
