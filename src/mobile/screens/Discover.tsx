import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, Career, db, errMsg, useApp, useCareers, useDna, useOpportunities, useSkills } from "../store";
import { AiLabel, Body, Btn, Card, CardTitle, ChipBtn, DarkCard, Empty, Header, HScroll, Kicker, Loading, Pill, Ring, Row, Screen, TabTitle } from "../ui";
import { C, F, SH } from "../theme";
import { oppMatch, oppTypeOf, TYPEC, TYPE_ID } from "../logic";

export default function Discover({ screen }: { screen: "discover" | "detail" | "compare" | "sim" | "unis" }) {
  switch (screen) {
    case "detail": return <CareerDetail />;
    case "compare": return <Compare />;
    case "sim": return <Simulator />;
    case "unis": return <Universities />;
    default: return <DiscoverHome />;
  }
}

const hasSkill = (skills: { skill: string; level: number }[], s: string) => skills.some(x => x.level >= 50 && x.skill.toLowerCase() === s.toLowerCase());

/* 20 DISCOVER (DIS-01) */
function DiscoverHome() {
  const nav = useNavigate();
  const { t, toast } = useApp();
  const { careers, isLoading } = useCareers();
  const { dna } = useDna();
  const [q, setQ] = useState("");
  const [field, setField] = useState<string | null>(null);
  const ql = q.trim().toLowerCase();
  const list = careers.filter(c => (!ql || `${c.name} ${c.field} ${c.skills.join(" ")}`.toLowerCase().includes(ql)) && (!field || c.field === field));
  const fields = Array.from(new Set(careers.map(c => c.field)));
  const soon = () => toast(t("Segera hadir di versi berikutnya", "Coming in a later version"));
  const cats: [string, string, string, (() => void)][] = [
    [t("Karier", "Careers"), "💼", C.tintBlue, () => document.getElementById("career-list")?.scrollIntoView({ behavior: "smooth" })],
    ["Skills", "🧩", C.tintGreen, () => nav("/app/profile")],
    [t("Industri", "Industries"), "🏭", C.tintYellow, soon],
    [t("Kampus", "Universities"), "🎓", C.tintOrange, () => nav("/app/universities")],
    [t("Perusahaan", "Companies"), "🏢", C.tintSky, soon],
    [t("Program", "Programs"), "📋", C.tintPurple, () => nav("/app/opportunities")],
    ["Mentors", "🤝", C.tintGreen, () => nav("/app/mentors")],
    ["Projects", "🛠️", C.tintOrange, () => nav("/app/projects")],
    ["Trends", "📈", C.tintBlue, () => { setField(null); setQ(""); toast(t("Diurutkan berdasarkan fit — lihat label permintaan ↗", "Sorted by fit — see the demand labels ↗")); }],
    ["Future Careers", "🔮", C.tintYellow, () => nav("/app/simulator")],
  ];
  return (
    <Screen tab>
      <TabTitle title="Discover" sub={t("Jelajahi masa depanmu", "Explore Your Future")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 50, background: "#fff", borderRadius: 15, padding: "0 15px", boxShadow: "0 2px 10px rgba(11,29,58,.05)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t("Cari karier — coba “AI Engineer”", "Search careers — try “AI Engineer”")} aria-label={t("Cari karier", "Search careers")}
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontFamily: "inherit", fontSize: 14.5, background: "transparent", color: C.text }} />
        </div>
      </div>
      <Body top={18} gap={18}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "12px 6px" }}>
          {cats.map(([l, ic, bg, go]) => (
            <button key={l} onClick={go} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 0 }}>
              <span style={{ width: 50, height: 50, borderRadius: 16, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{ic}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textAlign: "center", lineHeight: 1.2 }}>{l}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <div onClick={() => nav("/app/compare")} style={{ background: "#fff", borderRadius: 18, padding: 15, boxShadow: "0 3px 12px rgba(11,29,58,.06)", cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>⚖️</span><div style={{ marginTop: 8, fontSize: 14, fontWeight: 800 }}>Compare Careers</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: C.muted, lineHeight: 1.4 }}>{careers[0] && careers[1] ? `${careers[0].name} vs ${careers[1].name}` : t("Bandingkan dua karier", "Compare two careers")}</div>
          </div>
          <div onClick={() => nav("/app/simulator")} style={{ background: C.blue, borderRadius: 18, padding: 15, cursor: "pointer", color: "#fff" }}>
            <span style={{ fontSize: 20 }}>🔮</span><div style={{ marginTop: 8, fontSize: 14, fontWeight: 800 }}>Career Simulator</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "rgba(255,255,255,.82)", lineHeight: 1.4 }}>{t("Aku bisa di mana 3 tahun lagi?", "Where could I be in 3 years?")}</div>
          </div>
        </div>
        <div id="career-list">
          <CardTitle right={<span style={{ fontSize: 11.5, fontWeight: 700, color: C.muted }}>{dna?.axes ? t("Urut berdasarkan fit", "Sorted by fit") : t("Isi Talent DNA untuk fit %", "Do Talent DNA for fit %")}</span>}>Career Explorer</CardTitle>
          <HScroll gap={7} style={{ marginTop: 10 }}>
            <ChipBtn on={!field} onClick={() => setField(null)} style={{ height: 32, fontSize: 12 }}>{t("Semua", "All")}</ChipBtn>
            {fields.map(f => <ChipBtn key={f} on={field === f} onClick={() => setField(f)} style={{ height: 32, fontSize: 12 }}>{f}</ChipBtn>)}
          </HScroll>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoading && <Loading />}
            {list.map(c => (
              <div key={c.id} onClick={() => nav(`/app/careers/${c.id}`)} style={{ display: "flex", gap: 13, alignItems: "center", background: "#fff", borderRadius: 17, padding: 14, boxShadow: SH.cardSm, cursor: "pointer" }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: F.display, fontSize: 14, flex: "none" }}>{c.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>{c.field}{c.demand ? ` · ${c.demand}` : ""}</div>
                  <div style={{ marginTop: 7, height: 5, borderRadius: 3, background: C.track }}><div style={{ width: `${c.fit ?? 0}%`, height: "100%", borderRadius: 3, background: C.blue }} /></div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}><div style={{ fontSize: 16, fontWeight: 700, fontFamily: F.display, color: C.blue }}>{c.fit ? `${c.fit}%` : "—"}</div><div style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>Career Fit</div></div>
              </div>
            ))}
            {!isLoading && !list.length && <div style={{ textAlign: "center", padding: 24, fontSize: 13.5, color: C.muted }}>{t("Belum ada karier yang cocok dengan pencarianmu.", "No careers match your search yet.")}</div>}
          </div>
        </div>
      </Body>
    </Screen>
  );
}

/* 22 CAREER DETAIL (DIS-02) */
function CareerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, profile, user, afterAction, toast, track } = useApp();
  const { careers, isLoading } = useCareers();
  const { data: skills = [] } = useSkills();
  const { data: opps } = useOpportunities();
  const { dna } = useDna();
  const c = careers.find(x => x.id === id);
  const { data: mentor } = useQuery({
    queryKey: ["m-career-mentor", id], enabled: !!c,
    queryFn: async () => {
      const { data } = await db.from("mentors").select("id,name,title,company,expertise_areas,industry").eq("is_available", true).limit(30);
      const words = [c!.name, c!.field, ...c!.skills].map(s => s.toLowerCase());
      return (data ?? []).find((m: any) => [m.title, m.industry, ...(m.expertise_areas || [])].join(" ").toLowerCase().split(/\W+/).some((w: string) => w.length > 2 && words.some(x => x.includes(w)))) ?? null;
    },
  });
  useEffect(() => { if (c) track("recommendation_viewed", { type: "career", fit: c.fit, position: 0 }); }, [c?.id]); // eslint-disable-line
  if (isLoading) return <Loading />;
  if (!c) return <Screen><Header title="Career" /><Body><Empty title={t("Karier tidak ditemukan", "Career not found")} /></Body></Screen>;
  const isTarget = profile?.career_target === c.id;
  const related = (opps ?? []).map(o => {
    const type = oppTypeOf(o.opportunity_type, o.title);
    return { o, type, m: oppMatch({ ...o, type }, { axes: dna?.axes, tujuan: profile?.tujuan, careerField: c.field, careerName: c.name }) };
  }).filter(x => x.m.why.some(w => w.includes(c.name) || w.includes(c.field))).sort((a, b) => b.m.match - a.m.match).slice(0, 3);

  const setTarget = async () => {
    const { error } = await db.from("profiles").update({ career_target: isTarget ? null : c.id }).eq("user_id", user!.id);
    if (error) { toast(errMsg(error), "error"); return; }
    if (!isTarget) {
      await db.from("user_goals").insert({ user_id: user!.id, horizon: "long", title: `Menjadi ${c.name}`, source: "career_target" });
      track("recommendation_clicked", { type: "career", fit: c.fit, position: 0 });
    }
    await qc.invalidateQueries({ queryKey: ["m-profile"] });
    await afterAction(isTarget ? t("Target karier dilepas", "Career target removed") : t(`Target karier: ${c.name}`, `Career target: ${c.name}`));
  };

  return (
    <Screen>
      <Header plain title="Career Explorer" />
      <Body top={14}>
        <Card radius={22} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 17, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: F.display, fontSize: 17, flex: "none" }}>{c.initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}><h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px" }}>{c.name}</h1><div style={{ marginTop: 3, fontSize: 12.5, color: C.muted }}>{c.field}{c.salary ? ` · ${c.salary}` : ""}</div></div>
          <Ring value={c.fit ?? 0} size={64} stroke={7} color={C.green}><span style={{ fontSize: 15, fontWeight: 700, fontFamily: F.display, lineHeight: 1 }}>{c.fit ? `${c.fit}%` : "—"}</span><span style={{ fontSize: 8, fontWeight: 700, color: C.faint }}>FIT</span></Ring>
        </Card>
        <Card><CardTitle>{t("Apa yang mereka kerjakan", "What they do")}</CardTitle><p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text3 }}>{c.what}</p>
          {c.demand && <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}><Pill fg={C.green} bg={C.tintGreen}>{t("Permintaan", "Demand")}: {c.demand}</Pill>{c.salary && <Pill fg={C.gold} bg={C.tintYellow}>{c.salary} · {t("perkiraan", "estimate")}</Pill>}</div>}
        </Card>
        <Card>
          <CardTitle right={<span style={{ fontSize: 11, fontWeight: 700, color: C.faint }}>✓ {t("kamu punya", "you have")} · △ gap</span>}>Skills</CardTitle>
          <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {c.skills.map(s => { const h = hasSkill(skills, s); return <span key={s} style={{ fontSize: 12.5, fontWeight: 700, color: h ? C.green : C.gold, background: h ? C.tintGreen : C.tintYellow, padding: "7px 12px", borderRadius: 99 }}>{h ? "✓" : "△"} {s}</span>; })}
          </div>
          {!skills.length && <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>{t("Tambahkan skill-mu di Profil agar gap terlihat akurat.", "Add your skills in Profile to see accurate gaps.")}</div>}
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card pad={16}><div style={{ fontSize: 14, fontWeight: 800 }}>{t("Pendidikan", "Education")}</div><div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>{c.edu.map(e => <span key={e} style={{ fontSize: 12.5, color: C.text3 }}>· {e}</span>)}</div></Card>
          <Card pad={16}><div style={{ fontSize: 14, fontWeight: 800 }}>{t("Contoh project", "Typical projects")}</div><div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>{c.projects.map(p => <span key={p} style={{ fontSize: 12.5, color: C.text3, lineHeight: 1.35 }}>· {p}</span>)}</div></Card>
        </div>
        <Card>
          <CardTitle>{t("Roadmap karier", "Career roadmap")}</CardTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
            {c.roadmap.map(([w, tt], i, a) => (
              <div key={i} style={{ display: "flex", gap: 13 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: i === 0 ? C.orange : C.blue, marginTop: 3 }} />{i < a.length - 1 && <span style={{ width: 2, flex: 1, background: C.track, minHeight: 22 }} />}</div>
                <div style={{ paddingBottom: 14 }}><div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: F.display, color: C.faint }}>{w}</div><div style={{ marginTop: 2, fontSize: 13.5, fontWeight: 600 }}>{tt}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>{t("Peluang terkait", "Related opportunities")}</CardTitle>
          <div style={{ marginTop: 6 }}>
            {related.map(({ o, type, m }, i) => (
              <Row key={o.id} last={i === related.length - 1} onClick={() => nav(`/app/opportunities/${o.id}`)}>
                <Pill display size={10.5} fg={TYPEC[type][1]} bg={TYPEC[type][0]}>{TYPE_ID[type]}</Pill>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.green, flex: "none" }}>{m.match}%</span>
              </Row>
            ))}
            {!related.length && <div style={{ padding: "8px 0", fontSize: 13, color: C.muted }}>{t("Belum ada peluang aktif untuk bidang ini.", "No active opportunities for this field yet.")}</div>}
          </div>
        </Card>
        {mentor && (
          <Card onClick={() => nav(`/app/mentors/${mentor.id}`)} pad="16px 18px" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.tintOrange, color: C.orangeDark, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: F.display, fontSize: 16, flex: "none" }}>{mentor.name[0]}</div>
            <div style={{ flex: 1 }}><Kicker>Meet professionals</Kicker><div style={{ marginTop: 2, fontSize: 14, fontWeight: 700 }}>{mentor.name}{mentor.company ? ` · ${mentor.company}` : ""}</div></div>
            <span style={{ color: C.blue, fontWeight: 800 }}>→</span>
          </Card>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn kind="outline" h={50} onClick={() => nav(`/app/compare?a=${c.id}`)} style={{ flex: 1, width: "auto" }}>{t("Bandingkan", "Compare")}</Btn>
          <Btn h={50} onClick={setTarget} style={{ flex: 1.6, width: "auto", boxShadow: SH.primarySm }}>{isTarget ? t("Target karierku ✓", "My career target ✓") : t("Jadikan target karier", "Set as career target")}</Btn>
        </div>
      </Body>
    </Screen>
  );
}

/* 23 CAREER COMPARISON (DIS-03) */
function Compare() {
  const { t, lang } = useApp();
  const { careers, isLoading } = useCareers();
  const { data: skills = [] } = useSkills();
  const params = new URLSearchParams(window.location.search);
  const [a, setA] = useState<string | null>(params.get("a"));
  const [b, setB] = useState<string | null>(null);
  const A = careers.find(c => c.id === a) ?? careers[0];
  const B = careers.find(c => c.id === b) ?? careers.find(c => c.id !== A?.id);
  const [ai, setAi] = useState<string | null>(null);
  useEffect(() => {
    if (!A || !B) return;
    setAi(null);
    const k = `tk-cmp:${A.id}:${B.id}:${lang}`;
    const c = sessionStorage.getItem(k);
    if (c) { setAi(c); return; }
    askAi("compare", { input: `${A.name} vs ${B.name}`, lang }).then(r => { if (r.text) { setAi(r.text); sessionStorage.setItem(k, r.text); } });
  }, [A?.id, B?.id, lang]); // eslint-disable-line
  if (isLoading || !A || !B) return <Loading />;
  const gap = (c: Career) => c.skills.filter(s => !hasSkill(skills, s)).slice(0, 3).join(", ") || "—";
  const rows: [string, string, string][] = [
    ["Skills", A.skills.slice(0, 4).join(", "), B.skills.slice(0, 4).join(", ")],
    ["Tools", A.tools.join(", ") || "—", B.tools.join(", ") || "—"],
    [t("Pendidikan", "Education"), A.edu.slice(0, 2).join(", "), B.edu.slice(0, 2).join(", ")],
    ["Projects", A.projects[0] ?? "—", B.projects[0] ?? "—"],
    [t("Industri", "Industry"), A.industries.join(", ") || A.field, B.industries.join(", ") || B.field],
    [t("Permintaan", "Demand"), A.demand ?? "—", B.demand ?? "—"],
    [t("Fit-mu", "Your Fit"), A.fit ? `${A.fit}%` : "—", B.fit ? `${B.fit}%` : "—"],
    ["Skill Gap", gap(A), gap(B)],
  ];
  const sel = (v: string, on: (x: string) => void, excl: string) => (
    <select value={v} onChange={e => on(e.target.value)} aria-label="Pilih karier" style={{ width: "100%", marginTop: 6, background: "rgba(255,255,255,.15)", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, padding: "4px 6px", fontFamily: "inherit" }}>
      {careers.filter(c => c.id !== excl).map(c => <option key={c.id} value={c.id} style={{ color: C.text }}>{c.name}</option>)}
    </select>
  );
  return (
    <Screen>
      <Header title="Compare Careers" />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: C.blue, borderRadius: "18px 18px 0 0", padding: "15px 12px", color: "#fff", textAlign: "center" }}><div style={{ fontSize: 15, fontWeight: 800 }}>{A.name}</div><div style={{ marginTop: 3, fontSize: 11, color: "rgba(255,255,255,.78)" }}>{A.fit ? `${A.fit}% fit` : ""}</div>{sel(A.id, setA, B.id)}</div>
          <div style={{ flex: 1, background: C.green, borderRadius: "18px 18px 0 0", padding: "15px 12px", color: "#fff", textAlign: "center" }}><div style={{ fontSize: 15, fontWeight: 800 }}>{B.name}</div><div style={{ marginTop: 3, fontSize: 11, color: "rgba(255,255,255,.8)" }}>{B.fit ? `${B.fit}% fit` : ""}</div>{sel(B.id, setB, A.id)}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: "0 0 18px 18px", boxShadow: "0 6px 20px rgba(11,29,58,.07)", overflow: "hidden" }}>
          {rows.map(([l, x, y]) => (
            <div key={l} style={{ borderBottom: `1px solid ${C.track}` }}>
              <div style={{ padding: "10px 12px 0", fontSize: 10.5, fontWeight: 700, fontFamily: F.display, color: C.faint, textTransform: "uppercase", letterSpacing: ".5px", textAlign: "center" }}>{l}</div>
              <div style={{ display: "flex", padding: "6px 6px 12px" }}>
                <div style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: C.blueDark, lineHeight: 1.4, padding: "0 6px" }}>{x}</div>
                <div style={{ width: 1, background: C.track }} />
                <div style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: C.greenDark, lineHeight: 1.4, padding: "0 6px" }}>{y}</div>
              </div>
            </div>
          ))}
        </div>
        <DarkCard style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow }}>✦</span><span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.lightBlue, flex: 1 }}>{t("APA BEDANYA?", "WHAT'S THE DIFFERENCE?")}</span>{ai && <AiLabel dark />}</div>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,.9)" }}>
            {ai ?? `${A.name}: ${A.what} ${B.name}: ${B.what}`}
          </p>
        </DarkCard>
      </div>
    </Screen>
  );
}

/* CAREER SIMULATOR (DIS-04) */
function Simulator() {
  const nav = useNavigate();
  const { t, user, profile, afterAction, toast } = useApp();
  const { careers, isLoading } = useCareers();
  const { data: skills = [] } = useSkills();
  const { data: opps } = useOpportunities();
  const { dna } = useDna();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const paths = careers.slice(0, 3);
  if (isLoading) return <Loading />;
  const p = paths[i];
  if (!p) return <Screen><Header title="Career Simulator" /><Body><Empty title={t("Belum ada data karier", "No career data yet")} /></Body></Screen>;
  const yrs = p.roadmap.slice(1, 4);
  const pOpps = (opps ?? []).map(o => ({ o, m: oppMatch({ ...o, type: oppTypeOf(o.opportunity_type, o.title) }, { axes: dna?.axes, careerField: p.field, careerName: p.name }) }))
    .filter(x => x.m.why.some(w => w.includes(p.name))).slice(0, 2).map(x => x.o.title);
  const gaps = p.skills.filter(s => !hasSkill(skills, s));
  const makePlan = async () => {
    setBusy(true);
    const uid = user!.id;
    await db.from("user_plans").upsert({ user_id: uid, title: t(`Menuju ${p.name}`, `Towards ${p.name}`), started_at: new Date().toISOString().slice(0, 10),
      month_titles: [t("Belajar dasar", "Learn the basics"), t("Bangun project", "Build a project"), t("Daftar peluang", "Apply")], updated_at: new Date().toISOString() });
    const tasks = [
      ...gaps.slice(0, 3).map(g => ({ month: 1, title: t(`Pelajari ${g}`, `Learn ${g}`) })),
      { month: 1, title: t("Ikut satu sesi mentoring", "Join one mentoring session") },
      { month: 2, title: t(`Tentukan masalah untuk project: ${p.projects[0] ?? p.name}`, `Define a project problem: ${p.projects[0] ?? p.name}`) },
      { month: 2, title: t("Bangun & dokumentasikan project di Portfolio", "Build & document the project in Portfolio") },
      ...(pOpps.length ? pOpps : [t("satu kompetisi/beasiswa yang relevan", "one relevant competition/scholarship")]).map(o => ({ month: 3, title: t(`Daftar: ${o}`, `Apply: ${o}`) })),
      { month: 3, title: t("Siapkan CV & motivation letter", "Prepare CV & motivation letter") },
    ];
    const { error } = await db.from("plan_tasks").insert(tasks.map((x, k) => ({ ...x, user_id: uid, source: "career_simulator", sort: k })));
    if (!profile?.career_target) await db.from("profiles").update({ career_target: p.id }).eq("user_id", uid);
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    await afterAction(t("90-Day Plan dibuat", "90-Day Plan created"));
    nav("/app/goals");
  };
  return (
    <Screen>
      <Header title="Career Simulator" sub={t("Aku bisa di mana 3 tahun lagi?", "Where could I be in 3 years?")} />
      <Body>
        <Card pad="16px 18px">
          <Kicker>Current state</Kicker>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, fontSize: 13 }}>
            {[[t("Pendidikan", "Education"), [profile?.jenjang?.toUpperCase().replace("_", "/"), profile?.kelas && `kelas ${profile.kelas}`].filter(Boolean).join(" · ") || "—"],
              ["Skills", skills.slice(0, 3).map(s => s.skill).join(", ") || t("Belum diisi", "Not set")],
              [t("Minat", "Interests"), careers.slice(0, 3).map(c => c.field).filter((v, k, a) => a.indexOf(v) === k).join(", ")]].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", gap: 10 }}><span style={{ width: 76, color: C.muted, fontWeight: 600, flex: "none" }}>{k}</span><span style={{ fontWeight: 700 }}>{v}</span></div>
            ))}
          </div>
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          {paths.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} style={{ flex: 1, minWidth: 0, border: "none", borderRadius: 15, background: i === k ? C.blue : "#fff", color: i === k ? "#fff" : C.text, fontFamily: "inherit", cursor: "pointer", padding: "11px 6px", boxShadow: "0 2px 10px rgba(11,29,58,.06)" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>Path {"ABC"[k]}</div><div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 600, color: i === k ? "rgba(255,255,255,.8)" : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
            </button>
          ))}
        </div>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 17, fontWeight: 800 }}>{p.name}</div>{p.fit && <Pill display size={12} fg={C.green} bg={C.tintGreen}>{p.fit}% fit</Pill>}</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
            {yrs.map(([y, tt], k) => (
              <div key={k} style={{ display: "flex", gap: 13 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}><span style={{ width: 26, height: 26, borderRadius: "50%", background: C.tintBlue, color: C.blueDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{k + 1}</span>{k < yrs.length - 1 && <span style={{ width: 2, flex: 1, background: C.track, minHeight: 16 }} />}</div>
                <div style={{ padding: "4px 0 14px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}><span style={{ color: C.faint, fontSize: 11.5, fontFamily: F.display }}>{y}</span><br />{tt}</div>
              </div>
            ))}
          </div>
          <Kicker style={{ fontSize: 12 }}>Skills needed</Kicker>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 7 }}>{p.skills.map(s => <Pill key={s} size={12}>{s}</Pill>)}</div>
          <Kicker style={{ fontSize: 12, marginTop: 14 }}>Opportunities</Kicker>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 7 }}>{(pOpps.length ? pOpps : [t("Kompetisi & beasiswa bidang ini", "Competitions & scholarships in this field")]).map(o => <Pill key={o} size={12} fg={C.gold} bg={C.tintYellow} style={{ whiteSpace: "normal" }}>{o}</Pill>)}</div>
        </Card>
        <Btn disabled={busy} onClick={makePlan}>{t("Jadikan path ini 90-Day Plan", "Make this my 90-Day Plan")}</Btn>
      </Body>
    </Screen>
  );
}

/* 25 UNIVERSITY EXPLORER (DIS-05) */
function Universities() {
  const { t, profile } = useApp();
  const { careers } = useCareers();
  const [f, setF] = useState("Semua");
  const target = careers.find(c => c.id === profile?.career_target) ?? careers[0];
  const { data, isLoading } = useQuery({
    queryKey: ["m-unis"], staleTime: 30 * 60_000,
    queryFn: async () => ((await db.from("universities").select("*").eq("is_active", true).order("sort")).data ?? []) as any[],
  });
  const list = (data ?? []).filter(u => f === "Semua" || u.kind === f).map(u => {
    const match = target ? u.programs.filter((p: string) => target.edu.some(e => e.toLowerCase() === p.toLowerCase())) : [];
    return { ...u, match };
  }).sort((a, b) => b.match.length - a.match.length);
  return (
    <Screen>
      <Header title="University Explorer" sub={target ? t(`Program yang cocok dengan target ${target.name}-mu`, `Programs that fit your ${target.name} target`) : t("Program & jalur masuk", "Programs & admission routes")} />
      <HScroll gap={7} style={{ margin: "14px 0 0", padding: "0 20px" }}>
        {["Semua", "PTN", "Swasta", "Luar negeri"].map(x => <ChipBtn key={x} on={f === x} onClick={() => setF(x)} style={{ height: 34 }}>{x === "Semua" ? t("Semua", "All") : x}</ChipBtn>)}
      </HScroll>
      <Body top={14} gap={12}>
        {isLoading && <Loading />}
        {list.map(u => (
          <Card key={u.id} pad={16}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: u.bg, color: u.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: F.display, fontSize: 13, flex: "none" }}>{u.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{u.name}</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted }}>{u.location} · {u.kind}</div></div>
              {u.match.length > 0 && <Pill display fg={C.green} bg={C.tintGreen}>✓ {t("Sesuai target", "Fits target")}</Pill>}
            </div>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: C.blueDark }}>🎓 {(u.match.length ? u.match : u.programs.slice(0, 2)).join(" · ")}</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{u.admission_routes.map((j: string) => <Pill key={j} fg={C.text3} bg={C.bg}>{j}</Pill>)}</div>
            <div style={{ marginTop: 11, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
              {[[t("KEKETATAN", "SELECTIVITY"), u.selectivity], [t("BIAYA", "COST"), u.cost], [t("BEASISWA", "AID"), u.aid]].map(([k, v]) => (
                <div key={k} style={{ background: C.subtle, borderRadius: 11, padding: 9 }}><div style={{ fontSize: 9.5, fontWeight: 700, fontFamily: F.display, color: C.faint }}>{k}</div><div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{v ?? "—"}</div></div>
              ))}
            </div>
            {u.website && <a href={u.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 700, color: C.blue }}>{t("Situs resmi →", "Official site →")}</a>}
          </Card>
        ))}
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.faint, textAlign: "center" }}>{t("Angka biaya perkiraan — cek situs resmi kampus.", "Costs are estimates — check the official site.")}</p>
      </Body>
    </Screen>
  );
}
