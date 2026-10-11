import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { db, useApp, useCareers, useDna } from "../store";
import { BackBtn, Icon, TIKA } from "../ui";
import { C } from "../theme";
import { editionOf } from "../MobileApp";

interface Msg { id?: string; role: "user" | "assistant"; content: string; card?: { title: string; rows: [string, string][] } | null; pending?: boolean }

const FN_URL = `${(supabase as any).supabaseUrl ?? "https://doogbcrodipaeahgbjuj.supabase.co"}/functions/v1/talentika-ai`;

/* 68 AI COPILOT (AI-01..05) */
export default function Copilot() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, lang, user, profile, toast, track, isPro } = useApp();
  const { done, title: dnaName } = useDna();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const first = (profile?.full_name || "").split(" ")[0];

  useEffect(() => {
    (async () => {
      const { data } = await db.from("ai_messages").select("id,role,content,card").eq("user_id", user!.id).eq("surface", "copilot").order("created_at", { ascending: true }).limit(60);
      setMsgs((data ?? []) as Msg[]);
      const q = params.get("q");
      if (q && !sentInitial.current) { sentInitial.current = true; send(q); }
    })();
  }, [user]); // eslint-disable-line
  useEffect(() => { scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [msgs, typing]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", content: q }, { role: "assistant", content: "", pending: true }]);
    setTyping(true);
    track("ai_message_sent", { surface: "copilot", chip_or_free_text: CHIPS(t).includes(q) ? "chip" : "free_text" });
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch(FN_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}`, apikey: (supabase as any).supabaseKey ?? "" }, body: JSON.stringify({ mode: "chat", input: q, lang }) });
      if (!res.ok || !res.body) {
        const b = await res.json().catch(() => ({}));
        setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: b.message ?? t("Tika AI belum tersedia. Coba lagi nanti.", "Talentika AI isn't available yet. Try again later.") }));
        if (b.error === "limit" && !isPro) setTimeout(() => nav("/app/pro"), 1600);
        setTyping(false); return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let acc = "";
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        const evs = buf.split("\n\n"); buf = evs.pop() ?? "";
        for (const raw of evs) {
          const ev = /^event: (\w+)/m.exec(raw)?.[1]; const dataLine = /^data: (.*)$/m.exec(raw)?.[1];
          if (!ev || !dataLine) continue;
          const d = JSON.parse(dataLine);
          if (ev === "delta") { acc += d.t; const shown = acc.replace(/```card[\s\S]*$/, "").trim(); setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: shown, pending: true })); }
          if (ev === "replace") { acc = d.text; }
          if (ev === "done") setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: d.text, card: d.card }));
          if (ev === "error") setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: d.message }));
        }
      }
    } catch {
      setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: t("Koneksi terputus. Coba kirim lagi.", "Connection lost. Please try again.") }));
    }
    setTyping(false);
  };

  const addToGoals = async (card: NonNullable<Msg["card"]>, i: number) => {
    await db.from("user_plans").upsert({ user_id: user!.id, title: card.title.slice(0, 120), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    const rows = card.rows.slice(0, 6).map((r, k) => ({ user_id: user!.id, month: Math.min(3, Math.floor((k * 3) / Math.max(1, card.rows.length)) + 1), title: `${r[0]}: ${r[1]}`.slice(0, 200), source: "ai_copilot", sort: k }));
    const { error } = await db.from("plan_tasks").insert(rows);
    if (error) { toast(error.message, "error"); return; }
    setMsgs(m => m.map((x, k) => k === i ? { ...x, card: { ...card, title: card.title + " ✓" } } : x));
    toast(t("Ditambahkan ke Rencana Bertumbuh", "Added to your Growth Plan"));
  };
  const clearHistory = async () => {
    if (!confirm(t("Hapus seluruh riwayat chat AI?", "Delete all AI chat history?"))) return;
    await db.from("ai_messages").delete().eq("user_id", user!.id);
    setMsgs([]);
  };

  const { careers } = useCareers();
  const goal = careers.find(c => c.id === profile?.career_target);
  const ed = editionOf(profile?.jenjang) === "pro" ? "Talentika Kampus" : "Talentika Explorer";
  const ctx: [string, string, string][] = [
    dnaName ? [dnaName, C.purple, C.tintPurple] : [t(`Talent DNA ${done}/8 modul`, `Talent DNA ${done}/8 modules`), C.purple, C.tintPurple],
    ...(goal ? [[t(`Tujuan: ${goal.name}`, `Goal: ${goal.name_en || goal.name}`), C.blue, C.tintBlue] as [string, string, string]] : []),
    [ed, C.amber, C.tintYellow],
  ];
  const canSend = !!input.trim() && !typing;
  return (
    <div className="tk-screen" style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 12px", display: "flex", alignItems: "center", gap: 12, background: "#fff", borderBottom: "1px solid #EEF2F8", flex: "none" }}>
        <BackBtn dark />
        <img src={TIKA} alt="Tika" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flex: "none", background: C.tintBlue }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Tika · AI Mentor</div>
          <div style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, flex: "none" }} />{t("Mengenal profil, tujuan & skill-mu", "Knows your profile, goals & skills")}</div>
        </div>
        {msgs.length > 0 && <button onClick={clearHistory} aria-label={t("Hapus riwayat", "Clear history")} style={{ width: 38, height: 38, border: "none", borderRadius: "50%", background: C.soft, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="trash" size={16} /></button>}
      </div>
      <div ref={scroller} style={{ flex: 1, overflow: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ctx.map(([l, c, bg]) => <span key={l} style={{ fontSize: 10.5, fontWeight: 500, color: c, background: bg, padding: "4px 10px", borderRadius: 99 }}>{l}</span>)}
        </div>
        <div style={{ alignSelf: "flex-start", maxWidth: "86%", background: "#fff", borderRadius: "6px 18px 18px 18px", padding: "12px 14px", fontSize: 13, lineHeight: 1.55, color: C.text, boxShadow: "0 2px 10px rgba(15,23,42,.05)" }}>
          {t(`Halo ${first || ""}! Aku Tika, mentor AI-mu. Aku tahu Profil Talenta, tujuan, dan skill-mu. Mau mengerjakan apa hari ini?`, `Hi ${first || ""}! I'm Tika, your AI mentor. I know your Talent Profile, goals and skills. What do you want to work on today?`)}
        </div>
        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} style={{ alignSelf: "flex-end", maxWidth: "80%", background: C.blue, color: "#fff", borderRadius: "18px 6px 18px 18px", padding: "11px 14px", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.content}</div>
        ) : (
          <div key={i} style={{ alignSelf: "flex-start", maxWidth: "88%", display: "flex", flexDirection: "column", gap: 8 }}>
            {(m.content || m.pending) && (
              <div style={{ background: "#fff", borderRadius: "6px 18px 18px 18px", padding: "12px 14px", fontSize: 13, lineHeight: 1.55, color: C.text, boxShadow: "0 2px 10px rgba(15,23,42,.05)", whiteSpace: "pre-wrap" }}>
                {m.content || <span style={{ color: C.faint, letterSpacing: 2 }}>●●●</span>}
              </div>
            )}
            {m.card && (
              <div style={{ background: C.navy, borderRadius: 18, padding: "13px 14px", color: "#fff" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow, textTransform: "uppercase" }}>{m.card.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {m.card.rows.map((r, k) => (
                    <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "rgba(255,255,255,.9)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, flex: "none" }} />
                      <b style={{ fontWeight: 600, flex: "none" }}>{r[0]}:</b>
                      {editing === i ? <input value={r[1]} onChange={e => setMsgs(ms => ms.map((x, j) => j === i ? { ...x, card: { ...x.card!, rows: x.card!.rows.map((rr, kk) => kk === k ? [rr[0], e.target.value] as [string, string] : rr) } } : x))}
                        style={{ flex: 1, minWidth: 0, border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, padding: "2px 6px", fontFamily: "inherit", fontSize: 12.5, background: "rgba(255,255,255,.08)", color: "#fff" }} /> : <span>{r[1]}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  {!m.card.title.endsWith("✓") && <button onClick={() => addToGoals(m.card!, i)} style={{ height: 34, border: "none", borderRadius: 10, background: C.blue, color: "#fff", fontSize: 12, fontWeight: 600, padding: "0 12px", cursor: "pointer" }}>{t("Tambah ke Rencana Bertumbuh", "Add to my Growth Plan")}</button>}
                  <button onClick={() => setEditing(editing === i ? null : i)} style={{ marginLeft: "auto", border: "none", background: "none", color: "rgba(255,255,255,.7)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>{editing === i ? t("Selesai", "Done") : t("Ubah", "Edit")}</button>
                </div>
              </div>
            )}
            {!m.pending && m.content && <div style={{ fontSize: 10.5, color: C.faint }}>{t("Dibuat AI · cek detail penting dengan mentor atau guru", "AI-generated · check important details with a mentor or teacher")}</div>}
          </div>
        ))}
      </div>
      <div style={{ flex: "none", padding: "8px 18px 0", display: "flex", gap: 7, overflow: "auto" }}>
        {CHIPS(t).map(c => <button key={c} onClick={() => send(c)} disabled={typing} style={{ flex: "none", height: 34, border: "1.5px solid #D6E6FF", borderRadius: 99, background: "#fff", color: C.blue, fontSize: 12, fontWeight: 500, padding: "0 13px", cursor: "pointer", whiteSpace: "nowrap" }}>{c}</button>)}
      </div>
      <form onSubmit={e => { e.preventDefault(); send(input); }} style={{ flex: "none", padding: "10px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)", display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t("Tanya Tika apa saja…", "Ask Tika anything…")} aria-label={t("Pesan", "Message")} maxLength={2000}
          style={{ flex: 1, minWidth: 0, height: 50, border: `1.5px solid ${C.line}`, borderRadius: 99, padding: "0 18px", fontFamily: "inherit", fontSize: 14, background: "#fff", color: C.text, outline: "none" }} />
        <button type="submit" aria-label={t("Kirim", "Send")} disabled={!canSend} style={{ width: 50, height: 50, border: "none", borderRadius: "50%", background: canSend ? C.blue : C.disabled, color: "#fff", cursor: canSend ? "pointer" : "default", flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="send" size={19} /></button>
      </form>
    </div>
  );
}

function CHIPS(t: (a: string, b: string) => string) {
  return [t("Jelaskan machine learning dengan sederhana.", "Explain machine learning simply."), t("Apa yang sebaiknya aku pelajari berikutnya?", "What should I learn next?"),
    t("Buatkan rencana belajar 30 hari.", "Create a 30-day learning plan."), t("Aku ingin kuliah ke luar negeri.", "I want to study abroad.")];
}
