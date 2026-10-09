import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { canPurchase, db, errMsg, useApp, useDna } from "../store";
import { BackBtn, Body, Btn, Card, CardTitle, Confetti, DarkCard, Header, HeroCard, IconTile, Loading, Pill, Radio, Screen, Sheet } from "../ui";
import { C, F, SH } from "../theme";
import { archetypes, AXES, MODULES, radarPoints, rankAxes } from "../logic";

export default function Dna({ screen }: { screen: "center" | "question" | "result" }) {
  if (screen === "center") return <Center />;
  if (screen === "question") return <Question />;
  return <Result />;
}

/* 07 ASSESSMENT CENTER */
function Center() {
  const nav = useNavigate();
  const { t, isPro } = useApp();
  const { dna, done, isLoading } = useDna();
  const [lockSheet, setLockSheet] = useState<string | null>(null);
  const total = MODULES.length;
  return (
    <Screen>
      <Header title="Talent Discovery" sub="Assessment Center" />
      <Body gap={12}>
        <HeroCard>
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: F.display, letterSpacing: 1, color: C.yellow }}>TALENT DNA™</div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, lineHeight: 1.45, maxWidth: 280 }}>
            {t("Profil kecerdasan yang terus berkembang — dari minat, kekuatan, skill, sampai project-mu.", "An evolving intelligence profile — from your interests and strengths to your skills and projects.")}
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 4, background: "rgba(255,255,255,.22)" }}><div style={{ width: `${Math.round((done / total) * 100)}%`, height: "100%", borderRadius: 4, background: C.yellow }} /></div>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{done}/{total} {t("modul", "modules")}</span>
          </div>
        </HeroCard>
        {isLoading && <Loading />}
        {MODULES.map(m => {
          const st = dna?.modules.find(x => x.key === m.key);
          const isDone = !!st?.done;
          const prog = !isDone && (st?.answered ?? 0) > 0;
          const locked = !isDone && st && !st.free && !isPro;
          const pct = st && st.total ? Math.round((st.answered / st.total) * 100) : 0;
          const chip = isDone ? t("Selesai", "Done") : prog ? `${t("Lanjut", "Resume")} · ${pct}%` : locked ? "👑 Pro" : t("Mulai", "Start");
          const bg = isDone ? C.tintGreen : prog ? C.tintOrange : C.tintBlue;
          const fg = isDone ? C.green : prog ? C.orangeDark : C.blueDark;
          return (
            <div key={m.key} onClick={() => { if (isDone) return; nav(`/app/dna/${m.key}`); }}
              style={{ display: "flex", gap: 13, alignItems: "center", background: "#fff", borderRadius: 17, padding: 14, boxShadow: SH.cardSm, cursor: isDone ? "default" : "pointer" }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{isDone ? "✓" : m.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                <div style={{ marginTop: 2, fontSize: 12, color: C.muted, lineHeight: 1.35 }}>{t(m.q, m.qEn)}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, color: isDone ? C.green : prog ? C.orangeDark : locked ? "#7A5200" : "#fff",
                background: isDone ? C.tintGreen : prog ? C.tintOrange : locked ? C.yellow : C.blue, padding: "5px 10px", borderRadius: 99, flex: "none" }}>{chip}</span>
            </div>
          );
        })}
        {dna?.legacy_riasec && <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center" }}>{t("Modul Personality terisi dari tes RIASEC-mu sebelumnya.", "Personality is filled from your earlier RIASEC test.")}</div>}
        <Btn onClick={() => nav("/app/dna/result")} disabled={done === 0} style={{ marginTop: 6 }}>{t("Lihat Talent DNA-ku", "See my Talent DNA")}</Btn>
        <Btn kind="ghost" h={44} onClick={() => nav("/app/home", { replace: true })} style={{ fontSize: 13.5 }}>{t("Nanti saja, ke Home", "Later, go Home")}</Btn>
      </Body>
      <Sheet open={!!lockSheet} onClose={() => setLockSheet(null)}>{null}</Sheet>
    </Screen>
  );
}

/* 08 ASSESSMENT QUESTION — tersimpan per jawaban, bisa dilanjutkan (DNA-03) */
const QUEUE_KEY = "tk-dna-queue";
async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  if (!q.length) return;
  const { error } = await db.from("talent_dna_answers").upsert(q, { onConflict: "user_id,module_key,item_index" });
  if (!error) localStorage.removeItem(QUEUE_KEY);
}

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

  if (!meta) return <Screen><Header title="Talent DNA" /><Body><Card>{t("Modul tidak ditemukan.", "Module not found.")}</Card></Body></Screen>;
  if (!items || idx === null || idx < 0) return <Loading />;
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

  const pick = async (v: number) => {
    setAnswers(a => ({ ...a, [item.idx]: v }));
    const row = { user_id: user!.id, module_key: module, item_index: item.idx, value: v, answered_at: new Date().toISOString() };
    db.from("talent_dna_answers").upsert(row, { onConflict: "user_id,module_key,item_index" }).then(({ error }: any) => {
      if (error) {
        if (/row-level security|permission/i.test(error.message)) { setPaywall(true); return; }
        // offline / jaringan lambat → antrekan, sinkron saat online (DNA-03)
        const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").filter((r: any) => !(r.module_key === module && r.item_index === item.idx));
        q.push(row); localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      }
    });
    if (!free && !isPro && idx === 0) { setTimeout(() => setPaywall(true), 180); return; }
    if (idx >= total - 1) { setTimeout(finish, 180); return; }
    setTimeout(() => setIdx(i => (i ?? 0) + 1), 180);
  };

  const likert = [t("Nggak aku banget", "Not me at all"), t("Kurang cocok", "Not really"), t("Netral", "Neutral"), t("Lumayan aku", "Quite me"), t("Aku banget!", "Totally me!")];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 24px calc(env(safe-area-inset-bottom, 0px) + 36px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <BackBtn small onClick={() => (idx === 0 ? nav("/app/dna") : setIdx(idx - 1))} />
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.track }}><div style={{ width: `${Math.round((idx / total) * 100)}%`, height: "100%", borderRadius: 4, background: C.blue, transition: "width .3s" }} /></div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, flex: "none" }}>{idx + 1}/{total}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        <div key={item.idx} style={{ animation: "tkFadeUp .25s ease both" }}>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".6px", color: C.blue, background: C.tintBlue, padding: "5px 11px", borderRadius: 99 }}>{meta.n} · {meta.name}</span>
          <h2 style={{ margin: "16px 0 0", fontSize: 23, fontWeight: 700, fontFamily: F.display, lineHeight: 1.35, letterSpacing: "-.3px" }}>“{lang === "en" ? item.text_en : item.text_id}”</h2>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.muted }}>{t("Seberapa cocok pernyataan ini sama kamu?", "How well does this describe you?")}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {likert.map((label, j) => {
            const on = cur === j + 1;
            return (
              <button key={j} disabled={finishing} onClick={() => pick(j + 1)} style={{ height: 52, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", border: `1.8px solid ${on ? C.blue : C.track}`, borderRadius: 15, background: on ? C.tintBlue : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <Radio on={on} /><span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{label}</span>
              </button>
            );
          })}
        </div>
        {finishing && <div style={{ textAlign: "center", fontSize: 13, color: C.muted }}>{t("Menyusun Talent DNA-mu…", "Building your Talent DNA…")}</div>}
      </div>
      <Sheet open={paywall} onClose={() => nav("/app/dna")} title={t("Lanjutkan dengan Talentika Pro", "Continue with Talentika Pro")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>
          {canPurchase() ? t(`Modul ${meta.name} adalah bagian dari Full Talent DNA. Jawabanmu sudah tersimpan — upgrade untuk melanjutkan dan membuka laporan PDF.`,
             `${meta.name} is part of the Full Talent DNA. Your answer is saved — upgrade to continue and unlock the PDF report.`)
            : t(`Modul ${meta.name} tersedia untuk akun Talentika Pro. Jawabanmu sudah tersimpan.`, `${meta.name} is available for Talentika Pro accounts. Your answer is saved.`)}
        </p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn kind="orange" onClick={() => { track("paywall_viewed", { entry_point: "dna_module" }); nav("/app/pro"); }}>👑 {t("Lihat Talentika Pro", "See Talentika Pro")}</Btn>
          <Btn kind="outline" onClick={() => nav("/app/dna")}>{t("Kembali ke modul gratis", "Back to free modules")}</Btn>
        </div>
      </Sheet>
    </div>
  );
}

/* 14 TALENT DNA RESULT (DNA-04/05/06) */
function Result() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { t, lang, isPro, profile, toast } = useApp();
  const { dna, done, title, isLoading } = useDna();
  const celebrate = !!loc.state?.celebrate;
  const axes = dna?.axes;
  const vals = AXES.map(a => axes?.[a.key] ?? 0);
  const arch = useMemo(() => archetypes(axes), [axes]);
  const top = rankAxes(axes).slice(0, 3);
  const cardRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <Loading />;
  if (!axes) return (
    <Screen><Header title="Talent DNA" />
      <Body><Card><CardTitle>{t("Belum ada hasil", "No results yet")}</CardTitle><p style={{ fontSize: 13.5, color: C.muted }}>{t("Selesaikan minimal satu modul untuk melihat Talent DNA-mu.", "Finish at least one module to see your Talent DNA.")}</p><Btn onClick={() => nav("/app/dna")}>{t("Mulai modul", "Start a module")}</Btn></Card></Body>
    </Screen>
  );

  const insight = top.length >= 2
    ? t(`Kombinasi terkuatmu adalah ${top.map(k => AXES.find(a => a.key === k)!.nameId.toLowerCase()).join(" + ")}. Jelajahi karier yang memadukan ketiganya.`,
        `Your strongest combination is ${top.map(k => AXES.find(a => a.key === k)!.name.toLowerCase()).join(" + ")}. Explore careers that blend them.`)
    : t("Selesaikan lebih banyak modul untuk insight yang lebih tajam.", "Finish more modules for a sharper insight.");

  const shareCard = async () => {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    const g = cv.getContext("2d")!;
    g.fillStyle = C.blue; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(980, 120, 260, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "700 64px Poppins, sans-serif"; g.fillText("Talentika", 90, 170);
    g.fillStyle = C.yellow; g.font = "600 34px Poppins, sans-serif"; g.fillText("YOUR TALENT DNA", 90, 300);
    g.fillStyle = "#fff"; g.font = "700 60px Poppins, sans-serif";
    const words = (title || "").split(" • "); words.forEach((w, i) => g.fillText(w, 90, 400 + i * 80));
    let y = 400 + words.length * 80 + 60;
    AXES.forEach(a => {
      g.fillStyle = "rgba(255,255,255,.85)"; g.font = "600 34px Inter, sans-serif"; g.fillText(a.name, 90, y);
      g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(420, y - 26, 520, 22);
      g.fillStyle = C.yellow; g.fillRect(420, y - 26, 5.2 * (axes[a.key] ?? 0), 22);
      y += 80;
    });
    g.fillStyle = "rgba(255,255,255,.7)"; g.font = "500 28px Inter, sans-serif"; g.fillText("talentika.id · Discover. Develop. Grow.", 90, 1270);
    const blob: Blob = await new Promise(r => cv.toBlob(b => r(b!), "image/png"));
    const file = new File([blob], "talent-dna.png", { type: "image/png" });
    if ((navigator as any).canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Talent DNA" } as any); return; } catch { return; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "talent-dna.png"; a.click();
    toast(t("Kartu Talent DNA diunduh", "Talent DNA card downloaded"));
  };

  const pdf = () => {
    if (!isPro) { nav("/app/pro"); return; }
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = AXES.map(a => `<tr><td>${lang === "en" ? a.name : a.nameId}</td><td style="text-align:right;font-weight:700">${axes[a.key] ?? "-"}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Talent DNA</title><style>body{font-family:Inter,Arial,sans-serif;color:#0B1D3A;padding:40px;max-width:720px;margin:auto}h1{font-family:Poppins,Arial;color:#1D4ED8}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #E6EAF0}.n{color:#64748B;font-size:12px}</style></head><body>
      <h1>Talentika · Laporan Talent DNA</h1><p><b>${profile?.full_name ?? ""}</b> · ${profile?.school_name ?? ""} ${profile?.kelas ? "· Kelas " + profile.kelas : ""}</p>
      <h2>${title}</h2><p>Diperbarui dari ${done} modul assessment + ${dna?.projects ?? 0} project.</p><table>${rows}</table>
      <h3>Arketipe</h3><ul>${arch.map(a => `<li><b>${a.name}</b> — ${lang === "en" ? a.descEn : a.desc}</li>`).join("")}</ul>
      <p class="n">Skor adalah indikator eksplorasi minat & kekuatan berdasarkan jawaban self-report, bukan vonis atau prediksi pasti. Dicetak ${new Date().toLocaleDateString("id-ID")}.</p>
      <script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <Screen>
      <Header title="Talent DNA" right={<button onClick={shareCard} style={{ height: 36, border: "none", borderRadius: 11, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: C.blue, padding: "0 12px" }}>{t("Bagikan", "Share")}</button>} />
      <Body>
        <div ref={cardRef} style={{ background: C.blue, borderRadius: 22, padding: "24px 20px", color: "#fff", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {celebrate && <Confetti />}
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: F.display, letterSpacing: 1.2, color: "rgba(255,255,255,.75)" }}>YOUR TALENT DNA</div>
          <div style={{ marginTop: 10, fontSize: 23, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px", lineHeight: 1.3, animation: "tkPop .5s ease both" }}>{title}</div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>
            {dna?.legacy_riasec && done <= 1 ? t("Dari tes RIASEC-mu", "From your RIASEC test") : t(`Diperbarui dari ${done} modul assessment + ${dna?.projects ?? 0} project`, `Updated from ${done} modules + ${dna?.projects ?? 0} projects`)}
          </div>
        </div>
        <Card>
          <svg width="100%" viewBox="-45 0 310 220" role="img" aria-label="Radar Talent DNA">
            {[100, 66, 33].map(g => <polygon key={g} points={radarPoints([g, g, g, g, g])} fill="none" stroke={C.track} strokeWidth="1" />)}
            <polygon points={radarPoints(vals)} fill="rgba(29,78,216,.2)" stroke={C.blue} strokeWidth="2.5" strokeLinejoin="round" />
            {[["Analytical", 110, 14], ["Creative", 200, 84], ["Leadership", 168, 200], ["Technology", 52, 200], ["Communication", 16, 84]].map(([l, x, y]) => (
              <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.text3} fontFamily="Inter">{l}</text>
            ))}
          </svg>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 6 }}>
            {AXES.map(a => (
              <div key={a.key} style={{ textAlign: "center", background: C.subtle, borderRadius: 12, padding: "9px 2px" }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: F.display, color: a.color }}>{axes[a.key] ?? "–"}</div>
                <div style={{ marginTop: 2, fontSize: 9, fontWeight: 700, color: C.muted }}>{a.short}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>{t("Talent Archetype-mu", "Your Talent Archetypes")}</CardTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {arch.map(a => (
              <div key={a.name} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <IconTile bg={a.bg} size={36} radius={12} fontSize={16}>{a.icon}</IconTile>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div><div style={{ marginTop: 2, fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>{lang === "en" ? a.descEn : a.desc}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <DarkCard style={{ display: "flex", gap: 12 }}>
          <IconTile bg="rgba(255,193,7,.2)" size={34} radius={11} fontSize={16} color={C.yellow}>✦</IconTile>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.lightBlue }}>INSIGHT</div><div style={{ marginTop: 5, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>“{insight}”</div></div>
        </DarkCard>
        <p style={{ margin: 0, fontSize: 11.5, color: C.faint, textAlign: "center", lineHeight: 1.5 }}>{t("Ini gambaran eksplorasi, bukan vonis. Talent DNA ikut berkembang dari project, course, dan refleksimu.", "This is an exploration, not a verdict. Your Talent DNA evolves with your projects, courses and reflections.")}</p>
        <Btn kind="orange" onClick={() => nav("/app/discover")}>{t("Jelajahi karier yang cocok", "Explore matching careers")}</Btn>
        <Btn kind="outline" h={48} onClick={() => nav("/app/dna")}>{t("Lengkapi modul lain", "Complete other modules")}</Btn>
        <Btn kind="ghost" h={44} onClick={pdf}>{isPro ? "📄 " : "👑 "}{t("Unduh laporan PDF", "Download PDF report")}</Btn>
      </Body>
    </Screen>
  );
}
