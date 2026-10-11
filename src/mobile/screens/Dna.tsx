import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { canPurchase, db, errMsg, useApp, useDna, useSkills } from "../store";
import { BackBtn, Btn, Card, Confetti, Header, Icon, Loading, LOGO, Screen, Sheet, Tabs } from "../ui";
import { C, SH } from "../theme";
import { archetypes, AXES, AxisKey, MODULES, rankAxes } from "../logic";
import { editionOf } from "../MobileApp";
import assessHero from "../assets/v3/assess-hero.webp";
import readyHero from "../assets/v3/ready-hero.webp";

export default function Dna({ screen }: { screen: "center" | "question" | "result" }) {
  if (screen === "center") return <Center />;
  if (screen === "question") return <Question />;
  return <Result />;
}

const SAFE_T = "calc(env(safe-area-inset-top, 0px) + 16px)";
const SAFE_B = "calc(env(safe-area-inset-bottom, 0px) + 26px)";
const fade = (top: number, bottom: number) => `linear-gradient(180deg,transparent 0,#000 ${top}%,#000 ${bottom}%,transparent 100%)`;

/** Warna & ikon per sumbu Talent DNA (palet v3). */
export const AXIS_UI: Record<AxisKey, { c: string; bg: string; icon: string }> = {
  analytical: { c: C.green, bg: C.tintGreen, icon: "chart" },
  creative: { c: C.orange, bg: C.tintOrange, icon: "bulb" },
  leadership: { c: C.purple, bg: C.tintPurple, icon: "users" },
  technology: { c: C.sky, bg: C.tintSky, icon: "cpu" },
  communication: { c: C.blue, bg: C.tintBlue, icon: "msg" },
};
/** Skor 0–100 ditampilkan pada skala 5,0 seperti desain. */
export const to5 = (v?: number | null) => (typeof v === "number" ? (v / 20).toFixed(1) : "–");

const DOMAINS: [string, string, string, string][] = [
  ["Kreatif", "Creative", "#FDECEF", "#E11D48"], ["Analitis", "Analytical", "#DDF7F2", "#0D9488"], ["Teknis", "Technical", "#E0F7FD", "#0891B2"],
  ["Sosial", "Social", "#F1EAFE", "#7C3AED"], ["Wirausaha", "Entrepreneurial", "#FFF6DB", "#B7791F"], ["Kepemimpinan", "Leadership", "#EAF4FF", "#0066FF"],
];

/* ── ASSESSMENT INTRO + modul ───────────────────────────────────────── */
function Center() {
  const nav = useNavigate();
  const { t, isPro, profile, lang, openPaywall } = useApp();
  const { dna, done, isLoading } = useDna();
  const total = MODULES.length;
  const pro = editionOf(profile?.jenjang) === "pro";
  const states = MODULES.map(m => {
    const st = dna?.modules.find(x => x.key === m.key);
    const isDone = !!st?.done;
    const prog = !isDone && (st?.answered ?? 0) > 0;
    const locked = !isDone && !!st && !st.free && !isPro;
    const pct = st && st.total ? Math.round((st.answered / st.total) * 100) : 0;
    return { m, isDone, prog, locked, pct };
  });
  const nextMod = states.find(s => s.prog && !s.locked) ?? states.find(s => !s.isDone && !s.locked);
  const started = states.some(s => s.isDone || s.prog);
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflowY: "auto", background: "linear-gradient(180deg,#fff 0%,#F3F8FF 100%)", paddingBottom: SAFE_B, animation: "tkIn .25s ease both" }}>
      <div style={{ padding: `${SAFE_T} 22px 0`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BackBtn dark onClick={() => nav("/app/home", { replace: true })} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: C.purple, background: C.tintPurple, padding: "6px 12px", borderRadius: 99 }}>
          {t("Disesuaikan untuk ", "Adapted for ")}{pro ? t("Talentika Kampus", "Talentika Campus") : "Talentika Explorer"}
        </span>
      </div>
      <div style={{ padding: "20px 26px 0" }}>
        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.8px" }}>{t("Ayo Temukan", "Let's Discover")}<br /><span style={{ color: C.blue }}>{t("Potensimu", "Your Potential")}</span></div>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: C.text3 }}>
          {t("Assessment singkat dan interaktif untuk memahami minat, kekuatan, kepribadian, dan peluang masa depanmu.", "A short, interactive assessment to understand your interests, strengths, personality, and future opportunities.")}
        </p>
      </div>
      <div style={{ position: "relative", height: 250, marginTop: 4 }}>
        <img src={assessHero} alt={t("Pelajar membayangkan ide", "Student imagining ideas")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", WebkitMaskImage: fade(10, 76), maskImage: fade(10, 76) }} />
      </div>
      <div style={{ padding: "0 22px", display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
        {DOMAINS.map(([id, en, bg, c]) => <span key={id} style={{ fontSize: 11, fontWeight: 500, background: bg, color: c, padding: "5px 10px", borderRadius: 99 }}>{lang === "en" ? en : id}</span>)}
      </div>
      <div style={{ padding: "16px 22px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {nextMod ? (
          <button onClick={() => nav(`/app/dna/${nextMod.m.key}`)} style={{ height: 56, border: "none", borderRadius: 18, background: C.blue, color: "#fff", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: SH.primary }}>
            {started ? t("Lanjutkan Assessment", "Continue Assessment") : t("Mulai Assessment", "Start Assessment")} <Icon name="right" size={18} />
          </button>
        ) : done > 0 && (
          <button onClick={() => nav("/app/dna/result")} style={{ height: 56, border: "none", borderRadius: 18, background: C.blue, color: "#fff", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: SH.primary }}>
            {t("Lihat Profil Talentaku", "See My Talent Profile")} <Icon name="right" size={18} />
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontSize: 13, color: C.text3 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}><Icon name="clock" size={17} />~10–15 {t("menit", "minutes")}</span>
          <span style={{ width: 1, height: 18, background: C.disabled }} />
          <span style={{ display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}><Icon name="shield" size={17} />{t("Aman & Privat", "Safe & Private")}</span>
        </div>
      </div>
      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t("Modul Talent DNA", "Talent DNA modules")}</div>
          <span style={{ fontSize: 12, color: C.muted }}>{done}/{total} {t("selesai", "done")}</span>
        </div>
        {isLoading && <Loading />}
        <div style={{ background: "#fff", borderRadius: 18, padding: "4px 14px", marginTop: 10, boxShadow: SH.card }}>
          {states.map(({ m, isDone, prog, locked, pct }, i) => (
            <button key={m.key} disabled={isDone} onClick={() => (locked ? openPaywall("dna") : nav(`/app/dna/${m.key}`))}
              style={{ width: "100%", border: "none", background: "none", display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: i < states.length - 1 ? "1px solid #F1F5FB" : "none", cursor: isDone ? "default" : "pointer", textAlign: "left" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: isDone ? C.tintGreen : prog ? C.tintOrange : locked ? C.tintYellow : C.tintBlue, color: isDone ? C.green : prog ? C.orange : locked ? C.gold : C.blue,
                fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{isDone ? <Icon name="check" size={16} /> : locked ? <Icon name="lock" size={15} /> : m.n}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{m.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: C.muted, lineHeight: 1.35 }}>{t(m.q, m.qEn)}</span>
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 99, flex: "none",
                color: isDone ? C.green : prog ? C.orange : locked ? C.gold : C.blue, background: isDone ? C.tintGreen : prog ? C.tintOrange : locked ? C.tintYellow : C.tintBlue }}>
                {isDone ? t("Selesai", "Done") : prog ? `${pct}%` : locked ? "Plus" : t("Mulai", "Start")}
              </span>
            </button>
          ))}
        </div>
        {dna?.legacy_riasec && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", marginTop: 10 }}>{t("Modul Personality terisi dari tes RIASEC-mu sebelumnya.", "Personality is filled from your earlier RIASEC test.")}</div>}
        {done > 0 && nextMod && <Btn kind="blueOutline" h={50} onClick={() => nav("/app/dna/result")} style={{ marginTop: 12 }}>{t("Lihat Profil Talentaku", "See My Talent Profile")}</Btn>}
        <button onClick={() => nav("/app/home", { replace: true })} style={{ width: "100%", marginTop: 6, height: 44, border: "none", background: "none", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t("Nanti saja, ke Beranda", "Later, go Home")}</button>
      </div>
    </div>
  );
}

/* ── TALENT DISCOVERY (pertanyaan) — tersimpan per jawaban, bisa dilanjutkan ── */
const QUEUE_KEY = "tk-dna-queue";
async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  if (!q.length) return;
  const { error } = await db.from("talent_dna_answers").upsert(q, { onConflict: "user_id,module_key,item_index" });
  if (!error) localStorage.removeItem(QUEUE_KEY);
}
const OCOL = ["#0066FF", "#7C3AED", "#D97706", "#0D9488", "#E11D48"];

function Question() {
  const { module = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, isPro, toast, afterAction, track } = useApp();
  const meta = MODULES.find(m => m.key === module);
  const started = useRef(Date.now());
  const [idx, setIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [paywall, setPaywall] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const free = ["interest", "strength", "personality"].includes(module);

  const { data: items } = useQuery({
    queryKey: ["m-dna-items", module], staleTime: Infinity,
    queryFn: async () => ((await db.from("talent_dna_items").select("idx,text_id,text_en").eq("module_key", module).order("idx")).data ?? []) as { idx: number; text_id: string; text_en: string }[],
  });

  useEffect(() => {
    flushQueue();
    (async () => {
      const { data } = await db.from("talent_dna_answers").select("item_index,value").eq("user_id", user!.id).eq("module_key", module);
      const a: Record<number, number> = {};
      (data ?? []).forEach((r: any) => { a[r.item_index] = r.value; });
      const local = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").filter((r: any) => r.module_key === module);
      local.forEach((r: any) => { a[r.item_index] = r.value; });
      setAnswers(a);
      setIdx(-1); // ditentukan setelah items termuat
    })();
  }, [module, user]);

  useEffect(() => {
    if (idx !== -1 || !items) return;
    const first = items.findIndex(it => !answers[it.idx]);
    setIdx(first === -1 ? Math.max(0, items.length - 1) : first);
  }, [idx, items, answers]);

  if (!meta) return <Screen><Header title="Talent Discovery" /><div style={{ padding: 20 }}><Card>{t("Modul tidak ditemukan.", "Module not found.")}</Card></div></Screen>;
  if (!items || idx === null || idx < 0) return <Loading />;
  if (!items.length) return <Screen><Header title="Talent Discovery" /><div style={{ padding: 20 }}><Card>{t("Pertanyaan modul ini belum tersedia. Coba modul lain dulu.", "This module's questions aren't available yet. Try another module.")}</Card></div></Screen>;
  const total = items.length;
  const item = items[idx];
  const cur = answers[item.idx];

  const finish = async () => {
    setFinishing(true);
    await flushQueue();
    const { error } = await db.rpc("selesaikan_modul_dna", { p_module: module, p_duration_s: Math.round((Date.now() - started.current) / 1000) });
    if (error) { setFinishing(false); toast(errMsg(error), "error"); return; }
    track("dna_module_completed", { module_id: module, duration_s: Math.round((Date.now() - started.current) / 1000), is_pro: !free });
    await qc.invalidateQueries({ queryKey: ["m-dna"] });
    await afterAction("Talent Clarity");
    nav("/app/dna/result", { replace: true, state: { celebrate: true } });
  };

  const pick = (v: number) => {
    setAnswers(a => ({ ...a, [item.idx]: v }));
    const row = { user_id: user!.id, module_key: module, item_index: item.idx, value: v, answered_at: new Date().toISOString() };
    db.from("talent_dna_answers").upsert(row, { onConflict: "user_id,module_key,item_index" }).then(({ error }: any) => {
      if (error) {
        if (/row-level security|permission/i.test(error.message)) { setPaywall(true); return; }
        // offline / jaringan lambat → antrekan, sinkron saat online
        const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").filter((r: any) => !(r.module_key === module && r.item_index === item.idx));
        q.push(row); localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      }
    });
    if (!free && !isPro && idx === 0) setTimeout(() => setPaywall(true), 180);
  };
  const next = () => {
    if (!cur) { toast(t("Pilih salah satu jawaban dulu", "Pick an answer first"), "error"); return; }
    if (idx >= total - 1) finish(); else setIdx(idx + 1);
  };
  const back = () => (idx === 0 ? nav("/app/dna") : setIdx(idx - 1));
  const likert = [t("Aku banget!", "Totally me!"), t("Lumayan aku", "Quite me"), t("Netral", "Neutral"), t("Kurang cocok", "Not really"), t("Bukan aku sama sekali", "Not me at all")];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: `${SAFE_T} 22px 0`, display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn dark onClick={back} />
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>Talent Discovery</div>
        <button onClick={() => { toast(t("Kemajuan tersimpan. Lanjutkan kapan saja.", "Progress saved. Continue anytime.")); nav("/app/home", { replace: true }); }}
          style={{ height: 34, border: "none", borderRadius: 99, background: C.soft, color: C.text2, fontSize: 12.5, fontWeight: 600, padding: "0 13px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <Icon name="pause" size={14} />{t("Jeda", "Pause")}
        </button>
      </div>
      <div style={{ margin: "18px 22px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 7, borderRadius: 99, background: "#EAF0F8" }}><div style={{ width: `${Math.round(((idx + 1) / total) * 100)}%`, height: "100%", borderRadius: 99, background: C.blue, transition: "width .3s" }} /></div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text2 }}>{idx + 1}/{total}</span>
      </div>
      <div key={item.idx} style={{ flex: 1, overflowY: "auto", padding: "22px 22px 10px", animation: "tkIn .25s ease both" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".5px", color: C.purple, background: C.tintPurple, padding: "5px 11px", borderRadius: 99, textTransform: "uppercase" }}>{meta.name}</span>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-.3px", marginTop: 14 }}>“{lang === "en" ? item.text_en : item.text_id}”</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{t("Seberapa cocok pernyataan ini denganmu?", "How well does this describe you?")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 18 }}>
          {likert.map((label, j) => {
            const v = 5 - j;
            const on = cur === v;
            return (
              <button key={j} disabled={finishing} onClick={() => pick(v)} aria-pressed={on}
                style={{ minHeight: 56, border: `1.5px solid ${on ? C.blue : "#E6EDF7"}`, background: on ? "#F3F8FF" : "#fff", borderRadius: 16, display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 30, height: 30, borderRadius: 10, background: OCOL[j], color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{"ABCDE"[j]}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, lineHeight: 1.4, color: C.text }}>{label}</span>
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${on ? C.blue : "#E6EDF7"}`, background: on ? C.blue : "#E6EDF7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on && <Icon name="check" size={13} />}</span>
              </button>
            );
          })}
        </div>
        {finishing && <div style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 16 }}>{t("Menyusun profil talentamu…", "Building your talent profile…")}</div>}
      </div>
      <div style={{ padding: `12px 22px ${SAFE_B}`, display: "flex", gap: 12, borderTop: "1px solid #F1F5FB" }}>
        <button onClick={back} style={{ height: 54, border: "none", background: C.soft, borderRadius: 16, color: C.text2, fontSize: 14.5, fontWeight: 600, padding: "0 22px", cursor: "pointer" }}>{t("Kembali", "Back")}</button>
        <button onClick={next} disabled={finishing} style={{ flex: 1, height: 54, border: "none", borderRadius: 16, background: cur && !finishing ? C.blue : C.disabled, color: "#fff", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: cur ? "0 10px 22px rgba(0,102,255,.28)" : "none" }}>
          {idx >= total - 1 ? t("Selesai", "Finish") : t("Lanjut", "Next")} <Icon name="right" size={18} />
        </button>
      </div>
      <Sheet open={paywall} onClose={() => nav("/app/dna")} title={t("Lanjutkan dengan Talentika Plus", "Continue with Talentika Plus")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>
          {canPurchase() ? t(`Modul ${meta.name} adalah bagian dari Full Talent DNA. Jawabanmu sudah tersimpan — upgrade untuk melanjutkan dan membuka laporan PDF.`,
             `${meta.name} is part of the Full Talent DNA. Your answer is saved — upgrade to continue and unlock the PDF report.`)
            : t(`Modul ${meta.name} tersedia untuk akun berlangganan. Jawabanmu sudah tersimpan.`, `${meta.name} is available for subscribed accounts. Your answer is saved.`)}
        </p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={() => { track("paywall_viewed", { entry_point: "dna_module" }); nav("/app/pro"); }}><Icon name="star" size={16} />{t("Lihat paket", "See plans")}</Btn>
          <Btn kind="outline" onClick={() => nav("/app/dna")}>{t("Kembali ke modul gratis", "Back to free modules")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/* ── PROFILE READY → MY TALENT PROFILE ──────────────────────────────── */
function Result() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [celebrate, setCelebrate] = useState(!!loc.state?.celebrate);
  const { dna, isLoading } = useDna();
  if (isLoading) return <Loading />;
  if (celebrate && dna?.axes) return <Ready onNext={() => { setCelebrate(false); nav("/app/dna/result", { replace: true }); }} />;
  return <TalentProfile />;
}

function useTalent() {
  const { t, lang } = useApp();
  const { dna, done, title } = useDna();
  const axes = dna?.axes;
  const arch = useMemo(() => archetypes(axes), [axes]);
  const top = rankAxes(axes).slice(0, 3);
  const name = (k: AxisKey) => { const a = AXES.find(x => x.key === k)!; return lang === "en" ? a.name : a.nameId; };
  const type = arch[0];
  const insight = top.length >= 2
    ? t(`Kombinasi terkuatmu adalah ${top.map(k => name(k).toLowerCase()).join(" + ")}. Jelajahi karier yang memadukan semuanya.`, `Your strongest combination is ${top.map(k => name(k).toLowerCase()).join(" + ")}. Explore careers that blend them.`)
    : t("Selesaikan lebih banyak modul untuk insight yang lebih tajam.", "Finish more modules for a sharper insight.");
  return { dna, done, title, axes, arch, top, name, type, insight };
}

function TypeBadge({ size = 54 }: { size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(140deg,#A78BFA,#6D28D9)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="sparkle" size={size * 0.48} /></span>;
}

function Ready({ onNext }: { onNext: () => void }) {
  const { t, lang } = useApp();
  const { type, top, name } = useTalent();
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, overflowY: "auto", background: "linear-gradient(180deg,#fff 0%,#F3F8FF 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: `calc(env(safe-area-inset-top, 0px) + 22px) 22px ${SAFE_B}`, textAlign: "center" }}>
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 300, overflow: "hidden", pointerEvents: "none" }}><Confetti /></div>
      <img src={LOGO} alt="" style={{ width: 44, height: 44, borderRadius: 12 }} />
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.7px", marginTop: 14 }}>{t("Profil Talentamu", "Your Talent Profile")}<br /><span style={{ color: C.blue }}>{t("Sudah Siap!", "is Ready!")}</span></div>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: C.text3 }}>{t("Ini ringkasan kekuatan dan potensi utamamu.", "Here's a summary of your key strengths and potential.")}</p>
      <img src={readyHero} alt={t("Pelajar merayakan", "Student celebrating")} style={{ width: "calc(100% + 44px)", margin: "8px -22px 0", height: "auto", display: "block", WebkitMaskImage: fade(14, 78), maskImage: fade(14, 78) }} />
      <div style={{ width: "100%", background: "#fff", borderRadius: 22, padding: 18, boxShadow: "0 14px 34px rgba(15,23,42,.10)", textAlign: "left", marginTop: -16, position: "relative" }}>
        <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
          <TypeBadge />
          <div><div style={{ fontSize: 12, color: C.muted }}>{t("Tipe Talentamu", "Your Talent Type")}</div><div style={{ fontSize: 22, fontWeight: 800, color: "#6D28D9", letterSpacing: "-.4px", lineHeight: 1.2 }}>{type?.name ?? "Explorer"}</div></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {top.map(k => <span key={k} style={{ fontSize: 12.5, fontWeight: 500, background: AXIS_UI[k].bg, color: AXIS_UI[k].c, padding: "6px 14px", borderRadius: 99 }}>{name(k)}</span>)}
        </div>
        {type && <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, color: C.text3 }}>{lang === "en" ? type.descEn : type.desc}</p>}
      </div>
      <div style={{ flex: 1, minHeight: 16 }} />
      <div style={{ fontSize: 11.5, color: C.muted, margin: "14px 0 12px", display: "flex", gap: 6, alignItems: "center" }}><span style={{ color: C.blue, display: "flex" }}><Icon name="sparkle" size={14} /></span>{t("Titik awal, bukan label tetap. Terus berkembang saat kamu belajar dan berkarya.", "A starting point, not a fixed label. It grows as you learn and build.")}</div>
      <button onClick={onNext} style={{ width: "100%", height: 56, border: "none", borderRadius: 18, background: C.blue, color: "#fff", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", boxShadow: SH.primary, flex: "none" }}>
        {t("Lihat Profil Lengkap", "See Your Full Profile")} <Icon name="right" size={18} />
      </button>
    </div>
  );
}

function TalentProfile() {
  const nav = useNavigate();
  const { t, lang, isPro, profile, toast, openPaywall } = useApp();
  const { dna, done, title, axes, arch, type, top, name, insight } = useTalent();
  const { data: skills } = useSkills();
  const [tab, setTab] = useState<"overview" | "arch" | "modules">("overview");
  const pro = editionOf(profile?.jenjang) === "pro";

  if (!axes) return (
    <Screen><Header title={t("Profil Talentaku", "My Talent Profile")} />
      <div style={{ padding: "16px 20px 0" }}>
        <Card><div style={{ fontSize: 15, fontWeight: 700 }}>{t("Belum ada hasil", "No results yet")}</div><p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{t("Selesaikan minimal satu modul untuk melihat profil talentamu.", "Finish at least one module to see your talent profile.")}</p><Btn onClick={() => nav("/app/dna")}>{t("Mulai assessment", "Start assessment")}</Btn></Card>
      </div>
    </Screen>
  );

  const shareCard = async () => {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    const g = cv.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 1080, 1350); grd.addColorStop(0, "#0066FF"); grd.addColorStop(1, "#00A3E0");
    g.fillStyle = grd; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = "rgba(255,209,70,.85)"; g.beginPath(); g.arc(1000, 90, 230, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "700 64px Poppins, sans-serif"; g.fillText("Talentika", 90, 170);
    g.fillStyle = "#FFD146"; g.font = "600 34px Poppins, sans-serif"; g.fillText("MY TALENT TYPE", 90, 300);
    g.fillStyle = "#fff"; g.font = "800 72px Poppins, sans-serif"; g.fillText(type?.name ?? "", 90, 390);
    g.font = "600 40px Poppins, sans-serif"; g.fillText((title || "").replace(/ • /g, " · "), 90, 460);
    let y = 600;
    AXES.forEach(a => {
      g.fillStyle = "rgba(255,255,255,.9)"; g.font = "600 34px Poppins, sans-serif"; g.fillText(lang === "en" ? a.name : a.nameId, 90, y);
      g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(470, y - 26, 500, 22);
      g.fillStyle = "#FFD146"; g.fillRect(470, y - 26, 5 * (axes[a.key] ?? 0), 22);
      y += 90;
    });
    g.fillStyle = "rgba(255,255,255,.8)"; g.font = "500 28px Poppins, sans-serif"; g.fillText("talentika.id · #MorePeopleBrighterFutures", 90, 1270);
    const blob: Blob = await new Promise(r => cv.toBlob(b => r(b!), "image/png"));
    const file = new File([blob], "talent-profile.png", { type: "image/png" });
    if ((navigator as any).canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Talent Profile" } as any); return; } catch { return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "talent-profile.png"; a.click();
    toast(t("Kartu profil talenta diunduh", "Talent profile card downloaded"));
  };

  const pdf = () => {
    if (!isPro) { nav("/app/pro"); return; }
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = AXES.map(a => `<tr><td>${lang === "en" ? a.name : a.nameId}</td><td style="text-align:right;font-weight:700">${to5(axes[a.key])} / 5.0</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Talent DNA</title><style>body{font-family:Poppins,Arial,sans-serif;color:#0F172A;padding:40px;max-width:720px;margin:auto}h1{color:#0066FF}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #E2EAF5}.n{color:#64748B;font-size:12px}</style></head><body>
      <h1>Talentika · Laporan Talent DNA</h1><p><b>${profile?.full_name ?? ""}</b> · ${profile?.school_name ?? ""} ${profile?.kelas ? "· Kelas " + profile.kelas : ""}</p>
      <h2>${type?.name ?? ""} — ${title}</h2><p>Diperbarui dari ${done} modul assessment + ${dna?.projects ?? 0} project.</p><table>${rows}</table>
      <h3>Arketipe</h3><ul>${arch.map(a => `<li><b>${a.name}</b> — ${lang === "en" ? a.descEn : a.desc}</li>`).join("")}</ul>
      <p class="n">Skor adalah indikator eksplorasi minat & kekuatan berdasarkan jawaban self-report, bukan vonis atau prediksi pasti. Dicetak ${new Date().toLocaleDateString("id-ID")}.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const bars = rankAxes(axes).map(k => ({ k, v: axes[k] ?? 0 }));
  const cta = pro
    ? { label: t("Cek Kesiapan Karierku", "Check My Career Readiness"), hint: t("Kampus: skill gap untuk target peranmu", "Campus: skill gaps for your target role"), go: () => nav("/app/readiness") }
    : { label: t("Lihat Kecocokan Karier", "See Career Matches"), hint: t("Explorer: karier untuk dijelajahi, belum ada yang final", "Explorer: careers to explore, nothing is final yet"), go: () => nav("/app/discover") };
  return (
    <Screen>
      <Header title={t("Profil Talentaku", "My Talent Profile")} right={<button aria-label={t("Bagikan", "Share")} onClick={shareCard} style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="share" size={18} /></button>} />
      <div style={{ padding: "16px 20px 0" }}>
        <Tabs value={tab} onChange={v => setTab(v as typeof tab)} items={[{ value: "overview", label: t("Ringkasan", "Overview") }, { value: "arch", label: t("Arketipe", "Archetypes") }, { value: "modules", label: t("Modul", "Modules") }]} />
        <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginTop: 14, boxShadow: SH.card, display: "flex", gap: 13, alignItems: "flex-start" }}>
          <TypeBadge size={50} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{type?.name ?? "Explorer"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{top.map(name).join(" · ")}</div>
            {type && <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.text3, marginTop: 6 }}>{lang === "en" ? type.descEn : type.desc}</div>}
          </div>
        </div>

        {tab === "overview" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{t("Kekuatan Utama", "Key Strengths")}</div><span style={{ fontSize: 12, color: C.muted }}>{t("dari 5,0", "out of 5.0")}</span></div>
          <div style={{ background: "#fff", borderRadius: 20, padding: 16, marginTop: 10, boxShadow: SH.card, display: "flex", flexDirection: "column", gap: 14 }}>
            {bars.map(b => (
              <div key={b.k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: AXIS_UI[b.k].c, display: "flex", flex: "none" }}><Icon name={AXIS_UI[b.k].icon} size={18} /></span>
                <span style={{ width: 112, fontSize: 12.5, fontWeight: 500, flex: "none" }}>{name(b.k)}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 99, background: C.track }}><div style={{ width: `${b.v}%`, height: "100%", borderRadius: 99, background: AXIS_UI[b.k].c }} /></div>
                <span style={{ width: 26, textAlign: "right", fontSize: 12.5, fontWeight: 700 }}>{to5(b.v)}</span>
              </div>
            ))}
          </div>
          {(dna?.modules ?? []).some(m => !m.done) && (
            <button onClick={() => { const locked = (dna?.modules ?? []).some(m => !m.done && !m.free); if (locked && !isPro) openPaywall("dna"); else nav("/app/dna"); }} style={{ width: "100%", textAlign: "left", marginTop: 14, border: "1.5px dashed #C9DCF8", background: "#fff", borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={isPro ? "sparkle" : "lock"} size={18} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{t(`${(dna?.modules ?? []).filter(m => !m.done).length} modul lagi untuk ditemukan`, `${(dna?.modules ?? []).filter(m => !m.done).length} more modules to discover`)}</span>
                <span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{t("Aptitude, Learning Style, Future Skills…", "Aptitude, Learning Style, Future Skills…")}{!isPro && " · Plus"}</span>
              </span>
              {!isPro && <span style={{ fontSize: 10, fontWeight: 700, color: "#7A5200", background: C.yellow, padding: "3px 8px", borderRadius: 99 }}>PLUS</span>}
            </button>
          )}
          <div style={{ background: C.tintBlue, borderRadius: 18, padding: "14px 16px", marginTop: 12, fontSize: 13, lineHeight: 1.55, color: "#1E3A8A", fontStyle: "italic" }}>“{insight}”</div>
          {!!skills?.length && <>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 20 }}>{t("Skill yang sedang berkembang", "Skills in progress")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {skills.slice(0, 8).map(s => <span key={s.skill} style={{ fontSize: 12.5, fontWeight: 500, background: "#fff", border: `1.5px solid ${C.line}`, padding: "7px 13px", borderRadius: 99 }}>{s.skill}</span>)}
            </div>
          </>}
        </>}

        {tab === "arch" && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "6px 14px", marginTop: 14, boxShadow: SH.card }}>
            {arch.map((a, i) => {
              const k = top[i];
              const ui = k ? AXIS_UI[k] : AXIS_UI.technology;
              return (
                <div key={a.name} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < arch.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: ui.bg, color: ui.c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={ui.icon} size={17} /></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginTop: 2 }}>{lang === "en" ? a.descEn : a.desc}</div></div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "modules" && (
          <div style={{ background: "#fff", borderRadius: 18, padding: "6px 14px", marginTop: 14, boxShadow: SH.card }}>
            {MODULES.map((m, i) => {
              const st = dna?.modules.find(x => x.key === m.key);
              return (
                <div key={m.key} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: i < MODULES.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: st?.done ? C.green : "#fff", border: `2px solid ${st?.done ? C.green : C.disabled}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{st?.done && <Icon name="check" size={13} />}</span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: st?.done ? C.muted : C.text }}>{m.name}</span>
                  {!st?.done && <button onClick={() => nav(`/app/dna/${m.key}`)} style={{ border: "none", background: "none", color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{t("Mulai", "Start")}</button>}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
          <button onClick={() => nav("/app/privacy")} style={{ flex: 1, height: 46, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 14, fontSize: 12.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer" }}><span style={{ color: C.orange, display: "flex" }}><Icon name="users" size={16} /></span>{t("Bahas dengan orang tua", "Discuss with parent")}</button>
          <button onClick={() => nav("/app/mentors")} style={{ flex: 1, height: 46, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 14, fontSize: 12.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer" }}><span style={{ color: C.purple, display: "flex" }}><Icon name="msg" size={16} /></span>{t("Tanya mentor", "Ask a mentor")}</button>
        </div>
        <Btn onClick={cta.go} h={56} style={{ marginTop: 14 }}>{cta.label} <Icon name="right" size={18} /></Btn>
        <Btn kind="blueOutline" h={52} onClick={() => nav("/app/home")} style={{ marginTop: 10, borderColor: C.lightBlue }}><Icon name="home" size={18} />{t("Ke Beranda & pilih materi belajar", "Go to Dashboard & pick my learning")}</Btn>
        <div style={{ textAlign: "center", fontSize: 11.5, color: C.muted, marginTop: 8 }}>{cta.hint}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
          <button onClick={() => nav("/app/dna")} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Lengkapi modul lain", "Complete other modules")}</button>
          <button onClick={pdf} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon name={isPro ? "download" : "lock"} size={14} />{t("Laporan PDF", "PDF report")}</button>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 11.5, color: C.faint, textAlign: "center", lineHeight: 1.5 }}>{t("Ini gambaran eksplorasi, bukan vonis. Profil talentamu ikut berkembang dari proyek, kursus, dan refleksimu.", "This is an exploration, not a verdict. Your talent profile evolves with your projects, courses and reflections.")}</p>
      </div>
    </Screen>
  );
}
