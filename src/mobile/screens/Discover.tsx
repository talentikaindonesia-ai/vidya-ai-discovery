import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, Career, db, errMsg, useApp, useCareers, useDna, useOpportunities, useSkills } from "../store";
import { AiLabel, BackBtn, Btn, Empty, Header, Icon, ImgBox, Loading, Screen, Tabs } from "../ui";
import { C, SH } from "../theme";
import { AXES, AxisKey, INTEREST_TILES, oppMatch, oppTypeOf, TYPEC, TYPE_ID } from "../logic";
import { careerImg, oppImg } from "../media";

export default function Discover({ screen }: { screen: "discover" | "detail" | "path" | "compare" | "sim" | "unis" }) {
  switch (screen) {
    case "detail": return <CareerDetail />;
    case "path": return <LearningPath />;
    case "compare": return <Compare />;
    case "sim": return <Simulator />;
    case "unis": return <Universities />;
    default: return <CareerMatches />;
  }
}

const hasSkill = (skills: { skill: string; level: number }[], s: string) => skills.some(x => x.level >= 50 && x.skill.toLowerCase() === s.toLowerCase());
const skillLevel = (skills: { skill: string; level: number }[], s: string) => skills.find(x => x.skill.toLowerCase() === s.toLowerCase())?.level ?? 0;
const to5 = (v: number) => (v / 20).toFixed(1);
const isEmerging = (c: Career) => !!c.demand && /sangat|tinggi|high|tumbuh|grow|emerg/i.test(c.demand);

function TopBar({ title, onBack, right }: { title: React.ReactNode; onBack?: () => void; right?: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      <BackBtn onClick={onBack ?? (() => nav(-1))} />
      <div style={{ flex: 1, fontSize: 19, fontWeight: 700, letterSpacing: "-.2px" }}>{title}</div>
      {right}
    </div>
  );
}

/* ── CAREER MATCHES ─────────────────────────────────────────────────── */
function CareerMatches() {
  const nav = useNavigate();
  const { t, lang, profile } = useApp();
  const { careers, isLoading } = useCareers();
  const { dna } = useDna();
  const [tab, setTab] = useState<"best" | "emerging" | "all">("best");
  const [q, setQ] = useState("");
  const [field, setField] = useState<string | null>(null);
  const ql = q.trim().toLowerCase();
  const fields = Array.from(new Set(careers.map(c => c.field)));
  const list = tab === "best" ? careers.slice(0, 6)
    : tab === "emerging" ? careers.filter(isEmerging)
    : careers.filter(c => (!ql || `${c.name} ${c.field} ${c.skills.join(" ")}`.toLowerCase().includes(ql)) && (!field || c.field === field));

  const interests: string[] = profile?.app_prefs?.interests ?? [];
  const intLabel = interests.map(i => { const x = INTEREST_TILES.find(r => r[0] === i); return x ? (lang === "en" ? x[1] : x[0]) : i; });
  const topAxes = dna?.axes ? (Object.entries(dna.axes) as [AxisKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => { const a = AXES.find(x => x.key === k)!; return lang === "en" ? a.name : a.nameId; }) : [];
  const why = intLabel.length && topAxes.length
    ? t(`Kamu memilih ${intLabel.join(" & ")}, dan skor tertinggimu ada di ${topAxes.join(" dan ")}.`, `You chose ${intLabel.join(" & ")}, and scored highest in ${topAxes.join(" and ")}.`)
    : topAxes.length ? t(`Skor tertinggimu ada di ${topAxes.join(" dan ")}.`, `You scored highest in ${topAxes.join(" and ")}.`)
    : t("Selesaikan Talent Discovery agar persentase kecocokan dihitung dari profilmu.", "Finish Talent Discovery so match percentages come from your profile.");

  return (
    <Screen>
      <TopBar title={t("Kecocokan Karier", "Career Matches")} onBack={() => nav("/app/home")} />
      <div style={{ padding: "16px 20px 0" }}>
        <Tabs bleed={false} value={tab} onChange={v => setTab(v as typeof tab)} items={[
          { value: "best", label: t("Paling Cocok", "Best Matches") },
          { value: "emerging", label: t("Masa Depan", "Emerging") },
          { value: "all", label: t("Semua", "All Careers") },
        ]} />
        {tab === "all" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 48, background: "#fff", borderRadius: 15, padding: "0 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(15,23,42,.05)" }}>
            <span style={{ color: C.muted, display: "flex" }}><Icon name="search" size={18} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={t("Cari karier — coba “AI Engineer”", "Search careers — try “AI Engineer”")} aria-label={t("Cari karier", "Search careers")}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, background: "transparent", color: C.text }} />
          </div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", margin: "10px -20px 0", padding: "0 20px" }}>
            {[null, ...fields].map(f => (
              <button key={f ?? "all"} onClick={() => setField(f)} style={{ flex: "none", height: 32, border: "none", borderRadius: 99, padding: "0 13px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: field === f ? C.blue : "#fff", color: field === f ? "#fff" : C.text2 }}>{f ?? t("Semua", "All")}</button>
            ))}
          </div>
        </>}
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 18, letterSpacing: "-.2px" }}>
          {tab === "emerging" ? t("Karier dengan Permintaan Tinggi", "High-Demand Careers") : tab === "all" ? t("Jelajahi Semua Karier", "Explore All Careers") : t("Karier Paling Cocok Untukmu", "Top Career Matches for You")}
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{t("Berdasarkan minat, kekuatan, dan peluang global.", "Based on your interests, strengths, and global opportunities.")}</div>
        <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          {isLoading && <Loading />}
          {list.map(c => (
            <button key={c.id} onClick={() => nav(`/app/careers/${c.id}`)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
              <ImgBox src={careerImg(c.field, c.id)} w={84} h={72} r={13} />
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {c.fit ? <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "2px 9px", borderRadius: 99 }}>{t(`${c.fit}% Cocok`, `${c.fit}% Match`)}</span>
                  : <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, color: C.muted, background: C.soft, padding: "2px 9px", borderRadius: 99 }}>{t("Isi Talent DNA", "Do Talent DNA")}</span>}
                <span style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{lang === "en" && c.name_en ? c.name_en : c.name}</span>
                <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[c.field, c.demand].filter(Boolean).map(x => <span key={x} style={{ fontSize: 10.5, color: C.text2, background: C.soft, padding: "2px 8px", borderRadius: 99 }}>{x}</span>)}
                </span>
              </span>
              <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={18} /></span>
            </button>
          ))}
          {!isLoading && !list.length && <div style={{ textAlign: "center", padding: 24, fontSize: 13.5, color: C.muted }}>{t("Belum ada karier yang cocok dengan pencarianmu.", "No careers match your search yet.")}</div>}
        </div>

        <div style={{ background: "#fff", borderRadius: 18, padding: 14, marginTop: 14, display: "flex", gap: 12, alignItems: "flex-start", boxShadow: SH.card }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="bulb" size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t("Kenapa karier ini?", "Why these careers?")}</div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: C.text2, marginTop: 3 }}>{why}</div>
            <button onClick={() => nav(dna?.axes ? "/app/get-to-know" : "/app/dna")} style={{ border: "none", background: "none", padding: 0, marginTop: 6, fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>
              {dna?.axes ? t("Kurang pas? Perbarui minatku", "Not quite right? Update my interests") : t("Mulai Talent Discovery", "Start Talent Discovery")}
            </button>
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Alat eksplorasi", "Exploration tools")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 10 }}>
          {[[t("Bandingkan", "Compare"), "sliders", C.tintBlue, C.blue, "/app/compare"], [t("Simulator", "Simulator"), "rocket", C.tintPurple, C.purple, "/app/simulator"], [t("Kampus", "Universities"), "cap", C.tintYellow, C.amber, "/app/universities"]].map(([l, ic, bg, c, to]) => (
            <button key={to} onClick={() => nav(to)} style={{ border: "none", background: "#fff", borderRadius: 16, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: SH.card }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={21} /></span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{l}</span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ── CAREER DETAIL ──────────────────────────────────────────────────── */
function CareerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, profile, user, afterAction, toast, track } = useApp();
  const { careers, isLoading } = useCareers();
  const { data: skills = [] } = useSkills();
  const { data: opps } = useOpportunities();
  const { dna } = useDna();
  const c = careers.find(x => x.id === id);
  const { data: mentor } = useQuery({
    queryKey: ["m-career-mentor", id], enabled: !!c,
    queryFn: async () => {
      const { data } = await db.from("mentors").select("id,name,title,company,expertise_areas,industry,avatar_url").eq("is_available", true).limit(30);
      const words = [c!.name, c!.field, ...c!.skills].map(s => s.toLowerCase());
      return (data ?? []).find((m: any) => [m.title, m.industry, ...(m.expertise_areas || [])].join(" ").toLowerCase().split(/\W+/).some((w: string) => w.length > 2 && words.some(x => x.includes(w)))) ?? null;
    },
  });
  useEffect(() => { if (c) track("recommendation_viewed", { type: "career", fit: c.fit, position: 0 }); }, [c?.id]); // eslint-disable-line
  if (isLoading) return <Loading />;
  if (!c) return <Screen><Header title={t("Karier", "Career")} /><div style={{ padding: 20 }}><Empty title={t("Karier tidak ditemukan", "Career not found")} /></div></Screen>;
  const isTarget = profile?.career_target === c.id;
  const name = lang === "en" && c.name_en ? c.name_en : c.name;
  const related = (opps ?? []).map(o => {
    const type = oppTypeOf(o.opportunity_type, o.title);
    return { o, type, m: oppMatch({ ...o, type }, { axes: dna?.axes, tujuan: profile?.tujuan, careerField: c.field, careerName: c.name }) };
  }).filter(x => x.m.why.some(w => w.includes(c.name) || w.includes(c.field))).sort((a, b) => b.m.match - a.m.match).slice(0, 3);

  // Alasan kecocokan: sumbu DNA terkuat yang juga dibutuhkan karier ini, minat, dan impian.
  const why: string[] = [];
  if (dna?.axes) {
    const ks = (Object.entries(c.axes ?? {}) as [AxisKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).filter(k => typeof dna.axes![k] === "number");
    if (ks.length) why.push(ks.map(k => { const a = AXES.find(x => x.key === k)!; return `${lang === "en" ? a.name : a.nameId} (${to5(dna.axes![k])})`; }).join(t(" dan ", " and ")) + t(" — kekuatan yang dibutuhkan peran ini", " — strengths this role needs"));
  }
  const interests: string[] = profile?.app_prefs?.interests ?? [];
  if (interests.length) { const x = INTEREST_TILES.find(r => r[0] === interests[0]); why.push(t(`Kamu memilih minat “${interests[0]}”`, `You picked “${x?.[1] ?? interests[0]}” as an interest`)); }
  if ((profile?.app_prefs?.dreams ?? []).includes(c.id) || isTarget) why.push(t(`Impianmu: ${c.name}`, `Your dream: ${name}`));
  if (!why.length) why.push(t("Selesaikan Talent Discovery untuk melihat alasan kecocokan yang personal.", "Finish Talent Discovery to see personal match reasons."));

  const SK = [["cpu", C.blue, C.tintBlue], ["sparkle", C.purple, C.tintPurple], ["chart", C.sky, C.tintSky], ["puzzle", C.green, C.tintGreen], ["bulb", C.amber, C.tintYellow], ["globe", C.teal, C.tintTeal]];
  const tags: [string, string, string][] = [[c.field, C.blue, C.tintBlue], ...(c.skills[0] ? [[c.skills[0], C.purple, C.tintPurple] as [string, string, string]] : []), ...(c.demand ? [[c.demand, C.red, C.tintRed] as [string, string, string]] : [])];

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
  const circle: React.CSSProperties = { position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", width: 42, height: 42, borderRadius: "50%", border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,.2)" };

  return (
    <Screen bg="#fff">
      <div style={{ position: "relative", height: 260 }}>
        <ImgBox src={careerImg(c.field, c.id)} h="100%" r={0} />
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={{ ...circle, left: 18, color: C.text }}><Icon name="left" size={20} /></button>
        <button aria-label={isTarget ? t("Lepas target karier", "Remove career target") : t("Jadikan target karier", "Set as career target")} aria-pressed={isTarget} onClick={setTarget} style={{ ...circle, right: 18, color: C.blue }}><Icon name="bookmark" size={19} filled={isTarget} /></button>
      </div>
      <div style={{ position: "relative", marginTop: -26, background: "#fff", borderRadius: "26px 26px 0 0", padding: "22px 22px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1.15 }}>{name}</h1>
          {c.fit ? <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", background: C.green, padding: "6px 12px", borderRadius: 99, whiteSpace: "nowrap" }}>{t(`${c.fit}% Cocok`, `${c.fit}% Match`)}</span> : null}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text2 }}>{c.what}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {tags.map(([x, fg, bg]) => <span key={x} style={{ fontSize: 11.5, fontWeight: 500, background: bg, color: fg, padding: "5px 11px", borderRadius: 99 }}>{x}</span>)}
          {c.salary && <span style={{ fontSize: 11.5, fontWeight: 500, background: C.tintYellow, color: C.gold, padding: "5px 11px", borderRadius: 99 }}>{c.salary}</span>}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Kenapa cocok untukmu", "Why it matches you")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {why.map(w => (
            <div key={w} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, color: C.text2 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: C.tintGreen, color: C.green, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="check" size={13} /></span>{w}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Skill Utama", "Key Skills")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px 8px", marginTop: 10 }}>
          {c.skills.slice(0, 8).map((s, i) => {
            const [ic, fg, bg] = SK[i % SK.length];
            const lv = skillLevel(skills, s);
            const [st, sc] = lv >= 50 ? [t("Kamu punya", "You have"), C.green] : lv > 0 ? [t("Dipelajari", "Learning"), C.amber] : [t("Perlu dipelajari", "To learn"), C.red];
            return (
              <div key={s} style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, margin: "0 auto", borderRadius: 16, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={24} /></div>
                <div style={{ fontSize: 11.5, fontWeight: 500, marginTop: 6, lineHeight: 1.25 }}>{s}</div>
                <div style={{ fontSize: 10, color: sc }}>{st}</div>
              </div>
            );
          })}
        </div>
        {!skills.length && <div style={{ marginTop: 10, fontSize: 11.5, color: C.muted }}>{t("Skill-mu terisi otomatis dari materi & proyek yang kamu selesaikan.", "Your skills fill in automatically from courses and projects you finish.")}</div>}

        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Jalur studi", "Study pathways")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {c.edu.map(e => (
            <button key={e} onClick={() => nav("/app/universities")} style={{ display: "flex", alignItems: "center", gap: 11, background: C.bg, border: "none", borderRadius: 14, padding: "11px 13px", cursor: "pointer", textAlign: "left" }}>
              <span style={{ color: C.blue, display: "flex" }}><Icon name="cap" size={19} /></span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.text }}>{e}</span>
              <span style={{ fontSize: 11, color: C.muted }}>S1</span>
            </button>
          ))}
        </div>

        {related.length > 0 && <>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Peluang terkait", "Related opportunities")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
            {related.map(({ o, type, m }) => (
              <button key={o.id} onClick={() => nav(`/app/opportunities/${o.id}`)} style={{ textAlign: "left", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 16, padding: 9, display: "flex", gap: 11, alignItems: "center", cursor: "pointer" }}>
                <ImgBox src={oppImg(type, o.poster_url, o.id)} w={60} h={52} r={11} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: TYPEC[type][1], background: TYPEC[type][0], padding: "2px 8px", borderRadius: 99 }}>{TYPE_ID[type]}</span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.title}</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.green, flex: "none" }}>{m.match}%</span>
              </button>
            ))}
          </div>
        </>}

        {mentor && (
          <button onClick={() => nav(`/app/mentors/${mentor.id}`)} style={{ width: "100%", textAlign: "left", marginTop: 14, border: "none", background: C.tintPurple, borderRadius: 16, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            {mentor.avatar_url ? <img src={mentor.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
              : <span style={{ width: 44, height: 44, borderRadius: "50%", background: C.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flex: "none" }}>{mentor.name[0]}</span>}
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 11, color: C.purple, fontWeight: 600 }}>{t("Ngobrol dengan profesional", "Meet a professional")}</span><span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 1 }}>{mentor.name}{mentor.company ? ` · ${mentor.company}` : ""}</span></span>
            <span style={{ color: C.purple, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <Btn kind="blueOutline" h={52} onClick={() => nav(`/app/copilot?q=${encodeURIComponent(t(`Ceritakan tentang karier ${c.name} — apakah cocok untukku dan apa langkah pertamaku?`, `Tell me about a career as ${name} — does it fit me and what's my first step?`))}`)} style={{ flex: 1, width: "auto", fontSize: 14 }}>{t("Tanya Tika AI", "Ask Tika AI")}</Btn>
          <Btn h={52} onClick={() => nav(`/app/careers/${c.id}/path`)} style={{ flex: 1.3, width: "auto", fontSize: 14 }}>{t("Lihat Jalur Belajar", "See Learning Path")}</Btn>
        </div>
        <button onClick={() => nav(`/app/compare?a=${c.id}`)} style={{ display: "block", margin: "12px auto 0", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Bandingkan dengan karier lain", "Compare with another career")}</button>
      </div>
    </Screen>
  );
}

/* ── LEARNING PATH (per karier) ─────────────────────────────────────── */
function LearningPath() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t, lang, profile, user, afterAction, toast } = useApp();
  const qc = useQueryClient();
  const { careers, isLoading } = useCareers();
  const { data: skills = [] } = useSkills();
  const c = careers.find(x => x.id === id);
  if (isLoading) return <Loading />;
  if (!c) return <Screen><Header title={t("Jalur Belajar", "Learning Path")} /><div style={{ padding: 20 }}><Empty title={t("Karier tidak ditemukan", "Career not found")} /></div></Screen>;
  const name = lang === "en" && c.name_en ? c.name_en : c.name;
  const gaps = c.skills.filter(s => !hasSkill(skills, s));
  const levels = c.roadmap.map(([when, title], i) => ({ n: when, t: title, d: i === 0 ? (gaps.length ? t(`Mulai dari: ${gaps.slice(0, 3).join(" · ")}`, `Start with: ${gaps.slice(0, 3).join(" · ")}`) : t("Skill dasarmu sudah kuat", "Your basics are strong")) : i === c.roadmap.length - 1 ? t("Tujuan akhir jalur ini", "The goal of this path") : "", cur: i === 0 }));
  const start = async () => {
    if (profile?.career_target !== c.id) {
      const { error } = await db.from("profiles").update({ career_target: c.id }).eq("user_id", user!.id);
      if (error) { toast(errMsg(error), "error"); return; }
      await qc.invalidateQueries({ queryKey: ["m-profile"] });
      await afterAction(t(`Target karier: ${c.name}`, `Career target: ${c.name}`));
    }
    nav("/app/learn");
  };
  return (
    <Screen bg="#fff">
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 22px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <BackBtn dark onClick={() => nav(-1)} />
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-.3px" }}>{t("Jalur Belajar", "Your Personalized")}<br />{t("Personalmu", "Learning Path")}</div>
      </div>
      <div style={{ padding: "0 22px" }}>
        <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.55, color: C.muted }}>{t("Rencana langkah demi langkah untuk membangun skill, pengalaman, dan portofolio menuju karier impianmu: ", "A step-by-step plan to build the skills, experience, and portfolio for your future career: ")}<b style={{ color: C.text }}>{name}</b>.</p>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column" }}>
          {levels.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flex: "none" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: l.cur ? C.blue : "#fff", border: `2.5px solid ${l.cur ? C.blue : "#CBD5E1"}`, boxShadow: "0 0 0 4px #fff", flex: "none" }} />
                {i < levels.length - 1 && <span style={{ flex: 1, width: 2, background: C.line, margin: "2px 0" }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 18, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11.5, color: C.blue, fontWeight: 600 }}>{l.n}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{l.t}</div>
                  {l.d && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{l.d}</div>}
                </div>
                {l.cur ? <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>{t("Sedang berjalan", "In Progress")}</span>
                  : <span style={{ alignSelf: "flex-start", width: 28, height: 28, borderRadius: 9, background: C.soft, color: C.faint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="lock" size={14} /></span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: C.bg, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "#fff", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="cal" size={20} /></span>
          <div><div style={{ fontSize: 12, color: C.muted }}>{t("Perkiraan waktu", "Estimated time")}</div><div style={{ fontSize: 17, fontWeight: 700 }}>{c.roadmap[c.roadmap.length - 1]?.[0] ?? "—"}</div></div>
        </div>
        <Btn onClick={start} style={{ marginTop: 18 }}>{t("Mulai Belajar Sekarang", "Start Learning Now")} <Icon name="right" size={18} /></Btn>
      </div>
    </Screen>
  );
}

/* ── COMPARE ────────────────────────────────────────────────────────── */
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
    [t("Proyek", "Projects"), A.projects[0] ?? "—", B.projects[0] ?? "—"],
    [t("Industri", "Industry"), A.industries.join(", ") || A.field, B.industries.join(", ") || B.field],
    [t("Permintaan", "Demand"), A.demand ?? "—", B.demand ?? "—"],
    [t("Kecocokanmu", "Your Match"), A.fit ? `${A.fit}%` : "—", B.fit ? `${B.fit}%` : "—"],
    ["Skill Gap", gap(A), gap(B)],
  ];
  const head = (X: Career & { fit?: number | null }, set: (x: string) => void, excl: string, bg: string) => (
    <div style={{ flex: 1, minWidth: 0, borderRadius: 18, overflow: "hidden", background: "#fff", boxShadow: SH.card }}>
      <div style={{ position: "relative", height: 84 }}>
        <ImgBox src={careerImg(X.field, X.id)} h="100%" r={0} />
        <span style={{ position: "absolute", left: 8, top: 8, fontSize: 10.5, fontWeight: 700, color: "#fff", background: bg, padding: "3px 9px", borderRadius: 99 }}>{X.fit ? `${X.fit}%` : "—"}</span>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <select value={X.id} onChange={e => set(e.target.value)} aria-label={t("Pilih karier", "Pick a career")} style={{ width: "100%", border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12.5, fontWeight: 600, padding: "6px 6px", fontFamily: "inherit", color: C.text, background: "#fff" }}>
          {careers.filter(c => c.id !== excl).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
  return (
    <Screen>
      <TopBar title={t("Bandingkan Karier", "Compare Careers")} />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: 10 }}>{head(A, setA, B.id, C.blue)}{head(B, setB, A.id, C.green)}</div>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: SH.card, overflow: "hidden", marginTop: 12 }}>
          {rows.map(([l, x, y], i) => (
            <div key={l} style={{ borderTop: i ? `1px solid ${C.track}` : "none" }}>
              <div style={{ padding: "10px 12px 0", fontSize: 10.5, fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: ".5px", textAlign: "center" }}>{l}</div>
              <div style={{ display: "flex", padding: "6px 6px 12px" }}>
                <div style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.blueDark, lineHeight: 1.4, padding: "0 6px" }}>{x}</div>
                <div style={{ width: 1, background: C.track }} />
                <div style={{ flex: 1, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.greenDark, lineHeight: 1.4, padding: "0 6px" }}>{y}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: C.navy, borderRadius: 20, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow, display: "flex" }}><Icon name="sparkle" size={16} /></span><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow, flex: 1 }}>{t("APA BEDANYA?", "WHAT'S THE DIFFERENCE?")}</span>{ai && <AiLabel dark />}</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.9)" }}>{ai ?? `${A.name}: ${A.what} ${B.name}: ${B.what}`}</p>
        </div>
      </div>
    </Screen>
  );
}

/* ── CAREER SIMULATOR ───────────────────────────────────────────────── */
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
  if (!p) return <Screen><TopBar title={t("Simulator Karier", "Career Simulator")} /><div style={{ padding: 20 }}><Empty title={t("Belum ada data karier", "No career data yet")} /></div></Screen>;
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
    await afterAction(t("Rencana 90 hari dibuat", "90-Day Plan created"));
    nav("/app/goals");
  };
  return (
    <Screen>
      <TopBar title={t("Simulator Karier", "Career Simulator")} />
      <div style={{ padding: "4px 20px 0 74px", fontSize: 12.5, color: C.muted }}>{t("Aku bisa di mana 3 tahun lagi?", "Where could I be in 3 years?")}</div>
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", boxShadow: SH.card }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.faint, letterSpacing: ".5px", textTransform: "uppercase" }}>{t("Kondisimu sekarang", "Where you are now")}</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, fontSize: 13 }}>
            {[[t("Pendidikan", "Education"), [profile?.jenjang?.toUpperCase().replace("_", "/"), profile?.kelas && `kelas ${profile.kelas}`].filter(Boolean).join(" · ") || "—"],
              ["Skills", skills.slice(0, 3).map(s => s.skill).join(", ") || t("Belum ada", "None yet")],
              [t("Minat", "Interests"), careers.slice(0, 3).map(c => c.field).filter((v, k, a) => a.indexOf(v) === k).join(", ")]].map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", gap: 10 }}><span style={{ width: 80, color: C.muted, flex: "none" }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {paths.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} style={{ flex: 1, minWidth: 0, border: "none", borderRadius: 15, background: i === k ? C.blue : "#fff", color: i === k ? "#fff" : C.text, fontFamily: "inherit", cursor: "pointer", padding: "11px 6px", boxShadow: SH.card }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>{t("Jalur", "Path")} {"ABC"[k]}</div><div style={{ marginTop: 2, fontSize: 10.5, color: i === k ? "rgba(255,255,255,.8)" : C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
            </button>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: SH.card }}>
          <div style={{ position: "relative", height: 120 }}>
            <ImgBox src={careerImg(p.field, p.id)} h="100%" r={0} />
            {p.fit ? <span style={{ position: "absolute", right: 12, top: 12, fontSize: 12, fontWeight: 700, color: "#fff", background: C.green, padding: "4px 11px", borderRadius: 99 }}>{t(`${p.fit}% cocok`, `${p.fit}% match`)}</span> : null}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
              {yrs.map(([y, tt], k) => (
                <div key={k} style={{ display: "flex", gap: 13 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}><span style={{ width: 26, height: 26, borderRadius: "50%", background: C.tintBlue, color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{k + 1}</span>{k < yrs.length - 1 && <span style={{ width: 2, flex: 1, background: C.track, minHeight: 16 }} />}</div>
                  <div style={{ padding: "3px 0 14px", fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}><span style={{ color: C.blue, fontSize: 11.5 }}>{y}</span><br />{tt}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted }}>{t("Skill yang dibutuhkan", "Skills needed")}</div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>{p.skills.map(s => <span key={s} style={{ fontSize: 11.5, fontWeight: 500, color: C.blue, background: C.tintBlue, padding: "4px 10px", borderRadius: 99 }}>{s}</span>)}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.muted, marginTop: 14 }}>{t("Peluang", "Opportunities")}</div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>{(pOpps.length ? pOpps : [t("Kompetisi & beasiswa bidang ini", "Competitions & scholarships in this field")]).map(o => <span key={o} style={{ fontSize: 11.5, fontWeight: 500, color: C.gold, background: C.tintYellow, padding: "4px 10px", borderRadius: 99 }}>{o}</span>)}</div>
          </div>
        </div>
        <Btn disabled={busy} onClick={makePlan}>{t("Jadikan Rencana 90 Hari", "Make this my 90-Day Plan")}</Btn>
      </div>
    </Screen>
  );
}

/* ── UNIVERSITY EXPLORER ────────────────────────────────────────────── */
function Universities() {
  const { t, profile } = useApp();
  const { careers } = useCareers();
  const [f, setF] = useState("Semua");
  const target = careers.find(c => c.id === profile?.career_target) ?? careers[0];
  const { data, isLoading } = useQuery({
    queryKey: ["m-unis"], staleTime: 30 * 60_000,
    queryFn: async () => ((await db.from("universities").select("*").eq("is_active", true).order("sort")).data ?? []) as any[],
  });
  const list = useMemo(() => (data ?? []).filter(u => f === "Semua" || u.kind === f).map(u => {
    const match = target ? u.programs.filter((p: string) => target.edu.some(e => e.toLowerCase() === p.toLowerCase())) : [];
    return { ...u, match };
  }).sort((a, b) => b.match.length - a.match.length), [data, f, target]);
  return (
    <Screen>
      <TopBar title={t("Jelajah Kampus", "University Explorer")} />
      <div style={{ padding: "4px 20px 0 74px", fontSize: 12.5, color: C.muted }}>{target ? t(`Program yang cocok dengan target ${target.name}`, `Programs that fit your ${target.name} target`) : t("Program & jalur masuk", "Programs & admission routes")}</div>
      <div style={{ padding: "14px 20px 0" }}>
        <Tabs bleed={false} value={f} onChange={v => setF(v as string)} items={["Semua", "PTN", "Swasta", "Luar negeri"].map(x => ({ value: x, label: x === "Semua" ? t("Semua", "All") : x === "Luar negeri" ? t("Luar negeri", "Abroad") : x }))} />
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {list.map(u => (
          <div key={u.id} style={{ background: "#fff", borderRadius: 20, padding: 16, boxShadow: SH.card }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: u.bg, color: u.fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flex: "none" }}>{u.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{u.name}</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><Icon name="pin" size={12} />{u.location} · {u.kind}</div></div>
              {u.match.length > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "3px 9px", borderRadius: 99, flex: "none" }}>{t("Sesuai target", "Fits target")}</span>}
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: C.blue }}><Icon name="cap" size={16} />{(u.match.length ? u.match : u.programs.slice(0, 2)).join(" · ")}</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{u.admission_routes.map((j: string) => <span key={j} style={{ fontSize: 11, color: C.text2, background: C.soft, padding: "3px 9px", borderRadius: 99 }}>{j}</span>)}</div>
            <div style={{ marginTop: 11, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
              {[[t("Keketatan", "Selectivity"), u.selectivity], [t("Biaya", "Cost"), u.cost], [t("Beasiswa", "Aid"), u.aid]].map(([k, v]) => (
                <div key={k} style={{ background: C.bg, borderRadius: 12, padding: 9 }}><div style={{ fontSize: 10, color: C.faint }}>{k}</div><div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{v ?? "—"}</div></div>
              ))}
            </div>
            {u.website && <a href={u.website} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: C.blue }}>{t("Situs resmi", "Official site")}<Icon name="right" size={13} /></a>}
          </div>
        ))}
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.faint, textAlign: "center" }}>{t("Angka biaya perkiraan — cek situs resmi kampus.", "Costs are estimates — check the official site.")}</p>
      </div>
    </Screen>
  );
}
