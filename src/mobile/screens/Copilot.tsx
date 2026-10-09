import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { db, useApp, useDna } from "../store";
import { BackBtn } from "../ui";
import { C, F } from "../theme";
import tika from "../assets/tika-mascot.webp";

interface Msg { id?: string; role: "user" | "assistant"; content: string; card?: { title: string; rows: [string, string][] } | null; pending?: boolean }

const FN_URL = `${(supabase as any).supabaseUrl ?? "https://doogbcrodipaeahgbjuj.supabase.co"}/functions/v1/talentika-ai`;

/* 68 AI COPILOT (AI-01..05) */
export default function Copilot() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, lang, user, profile, toast, track, isPro } = useApp();
  const { dna, done } = useDna();
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
        setMsgs(m => m.slice(0, -1).concat({ role: "assistant", content: b.message ?? t("Talentika AI belum tersedia. Coba lagi nanti.", "Talentika AI isn't available yet. Try again later.") }));
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
    toast(t("Ditambahkan ke 90-Day Plan", "Added to your 90-Day Plan"));
  };
  const clearHistory = async () => {
    if (!confirm(t("Hapus seluruh riwayat chat AI?", "Delete all AI chat history?"))) return;
    await db.from("ai_messages").delete().eq("user_id", user!.id);
    setMsgs([]);
  };

  const ctx = [dna?.axes ? "🧬 Talent DNA" : null, profile?.career_target ? `🎯 ${profile.career_target.toUpperCase()}` : null, `📘 ${done}/8 ${t("modul", "modules")}`].filter(Boolean) as string[];
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 14px", background: "#fff", boxShadow: "0 2px 12px rgba(11,29,58,.06)", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BackBtn small dark />
          <img src={tika} alt="Tika" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flex: "none", background: C.tintBlue }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Talentika AI</div><div style={{ fontSize: 11.5, color: C.green, fontWeight: 700 }}>● Career Copilot</div></div>
          {msgs.length > 0 && <button onClick={clearHistory} style={{ border: "none", background: "none", color: C.faint, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t("Hapus riwayat", "Clear")}</button>}
        </div>
        <div style={{ marginTop: 11, display: "flex", gap: 6, overflow: "auto" }}>
          {ctx.map(c => <span key={c} style={{ flex: "none", fontSize: 10.5, fontWeight: 700, color: C.muted, background: C.bg, padding: "5px 9px", borderRadius: 99 }}>{c}</span>)}
        </div>
      </div>
      <div ref={scroller} style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex" }}>
          <div style={{ maxWidth: "80%", padding: "12px 15px", borderRadius: "18px 18px 18px 6px", background: "#fff", color: C.text2, fontSize: 13.5, lineHeight: 1.55, boxShadow: "0 2px 10px rgba(11,29,58,.06)" }}>
            {t(`Halo ${first || ""}! Aku Talentika AI ✦ Aku tahu Talent DNA, target, dan goals-mu. Mau mulai dari mana?`, `Hi ${first || ""}! I'm Talentika AI ✦ I know your Talent DNA, target and goals. Where shall we start?`)}
          </div>
        </div>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "assistant" ? "flex-start" : "flex-end", flexDirection: "column", alignItems: m.role === "assistant" ? "flex-start" : "flex-end", gap: 8 }}>
            {(m.content || m.pending) && (
              <div style={{ maxWidth: "80%", padding: "12px 15px", borderRadius: m.role === "assistant" ? "18px 18px 18px 6px" : "18px 18px 6px 18px", background: m.role === "assistant" ? "#fff" : C.blue,
                color: m.role === "assistant" ? C.text2 : "#fff", fontSize: 13.5, lineHeight: 1.55, boxShadow: "0 2px 10px rgba(11,29,58,.06)", whiteSpace: "pre-wrap" }}>
                {m.content || <span style={{ color: C.faint, letterSpacing: 2 }}>●●●</span>}
                {m.role === "assistant" && !m.pending && m.content && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: C.faint }}>✦ AI-generated</div>}
              </div>
            )}
            {m.card && (
              <div style={{ width: "86%", background: "#fff", borderRadius: "18px 18px 18px 6px", padding: 15, boxShadow: "0 2px 10px rgba(11,29,58,.06)" }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{m.card.title}</div>
                <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                  {m.card.rows.map((r, k) => (
                    <div key={k} style={{ display: "flex", gap: 10, fontSize: 12.5, lineHeight: 1.45 }}>
                      <span style={{ width: 70, fontWeight: 700, fontFamily: F.display, color: C.blue, flex: "none" }}>{r[0]}</span>
                      {editing === i ? <input value={r[1]} onChange={e => setMsgs(ms => ms.map((x, j) => j === i ? { ...x, card: { ...x.card!, rows: x.card!.rows.map((rr, kk) => kk === k ? [rr[0], e.target.value] as [string, string] : rr) } } : x))}
                        style={{ flex: 1, border: `1px solid ${C.lightBlue}`, borderRadius: 6, padding: "2px 6px", fontFamily: "inherit", fontSize: 12.5 }} /> : <span style={{ color: C.text2 }}>{r[1]}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 8 }}>
                  {!m.card.title.endsWith("✓") && <button onClick={() => addToGoals(m.card!, i)} style={{ border: "none", background: C.tintBlue, color: C.blueDark, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 99, cursor: "pointer" }}>+ {t("Tambah ke Goals", "Add to Goals")}</button>}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint }}>✦ AI-generated · <u style={{ cursor: "pointer" }} onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? t("Selesai", "Done") : "Edit"}</u></span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ flex: "none", padding: "0 20px 10px", display: "flex", gap: 8, overflow: "auto" }}>
        {CHIPS(t).map(c => <button key={c} onClick={() => send(c)} disabled={typing} style={{ flex: "none", border: `1.5px solid ${C.line}`, borderRadius: 99, background: "#fff", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "9px 14px", cursor: "pointer" }}>{c}</button>)}
      </div>
      <form onSubmit={e => { e.preventDefault(); send(input); }} style={{ flex: "none", padding: "0 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={t("Tanya Talentika AI…", "Ask Talentika AI…")} aria-label={t("Pesan", "Message")} maxLength={2000}
          style={{ flex: 1, minWidth: 0, height: 48, border: `1.5px solid ${C.line}`, borderRadius: 99, padding: "0 18px", fontFamily: "inherit", fontSize: 14, background: "#fff", color: C.text, outline: "none" }} />
        <button type="submit" aria-label={t("Kirim", "Send")} disabled={!input.trim() || typing} style={{ width: 48, height: 48, border: "none", borderRadius: "50%", background: input.trim() && !typing ? C.blue : C.disabled, color: "#fff", fontSize: 16, cursor: "pointer", flex: "none" }}>➤</button>
      </form>
    </div>
  );
}

function CHIPS(t: (a: string, b: string) => string) {
  return [t("Jelaskan machine learning dengan sederhana.", "Explain machine learning simply."), t("Apa yang sebaiknya aku pelajari berikutnya?", "What should I learn next?"),
    t("Buatkan rencana belajar 30 hari.", "Create a 30-day learning plan."), t("Aku ingin kuliah ke luar negeri.", "I want to study abroad.")];
}
