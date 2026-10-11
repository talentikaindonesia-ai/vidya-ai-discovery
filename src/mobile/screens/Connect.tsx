import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, canPurchase, db, errMsg, uploadEvidence, useApp, useCareers } from "../store";
import { AiLabel, Avatar, BackBtn, Btn, Card, ChipBtn, Empty, Header, Icon, IconBtn, Input, Label, Loading, Screen, Sheet, Tabs, TextArea, TIKA } from "../ui";
import { C, SH, avatarColors, rpShort } from "../theme";
import { fmtDate, timeAgo } from "../logic";

export default function Connect({ screen }: { screen: "mentors" | "mentor" | "reflection" | "community" | "challenge" }) {
  switch (screen) {
    case "mentor": return <MentorProfile />;
    case "reflection": return <Reflection />;
    case "community": return <Community />;
    case "challenge": return <ChallengeSubmit />;
    default: return <Mentors />;
  }
}

const H = ({ children, right, style }: { children: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, ...style }}><div style={{ fontSize: 16, fontWeight: 700 }}>{children}</div>{right}</div>
);
const Stars = ({ v }: { v: number }) => <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><span style={{ color: "#F59E0B", display: "flex" }}><Icon name="star" size={13} filled /></span>{v.toFixed(1)}</span>;

/* ── MENTORS ────────────────────────────────────────────────────────── */
function Mentors() {
  const nav = useNavigate();
  const { t, isPro, profile } = useApp();
  const { careers } = useCareers();
  const target = careers.find(c => c.id === profile?.career_target);
  const [filter, setFilter] = useState<{ k: "industry" | "languages" | "country" | null; v: string | null }>({ k: null, v: null });
  const [sheet, setSheet] = useState<null | "industry" | "languages" | "country">(null);
  const { data, isLoading } = useQuery({
    queryKey: ["m-mentors"],
    queryFn: async () => ((await db.from("mentors").select("id,name,title,company,bio,avatar_url,expertise_areas,experience_years,rating,total_sessions,price_per_session,industry,country,languages,is_verified").eq("is_available", true).order("total_sessions", { ascending: false })).data ?? []) as any[],
  });
  const words = target ? [target.name, target.field, ...target.skills].map(s => s.toLowerCase()) : [];
  const score = (m: any) => [m.title, m.industry, ...(m.expertise_areas || [])].join(" ").toLowerCase().split(/\W+/).filter((w: string) => w.length > 2 && words.some(x => x.includes(w))).length;
  const list = (data ?? []).filter(m => !filter.k || (filter.k === "languages" ? (m.languages || []).includes(filter.v) : m[filter.k] === filter.v)).sort((a, b) => score(b) - score(a));
  const opts = (k: "industry" | "languages" | "country") => Array.from(new Set((data ?? []).flatMap(m => (k === "languages" ? m.languages || [] : [m[k]]).filter(Boolean))));
  const LBL = { industry: t("Industri", "Industry"), languages: t("Bahasa", "Language"), country: t("Negara", "Country") };
  return (
    <Screen>
      <Header title="Mentor" sub={target ? t(`Cocok dengan jalur ${target.name}-mu`, `Matched to your ${target.name} pathway`) : t("Belajar langsung dari praktisi", "Learn from practitioners")} />
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "14px 20px 0" }}>
        <ChipBtn on={!filter.k} onClick={() => setFilter({ k: null, v: null })}>{t("Untukmu", "For you")}</ChipBtn>
        {(["industry", "languages", "country"] as const).map(k => (
          <ChipBtn key={k} on={filter.k === k} onClick={() => setSheet(k)}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{filter.k === k ? filter.v : LBL[k]}<Icon name="down" size={13} /></span></ChipBtn>
        ))}
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {!isLoading && !list.length && <Empty icon="users" title={t("Mentor sedang dikurasi", "Mentors are being curated")} body={t("Kami memverifikasi setiap mentor sebelum tampil. Kamu profesional dan ingin berbagi?", "We verify every mentor before they appear. Are you a professional who wants to give back?")} action={<Btn kind="outline" h={44} onClick={() => nav("/app/mentor-dashboard")}>{t("Daftar jadi mentor", "Become a mentor")}</Btn>} />}
        {list.map(m => {
          const [bg, fg] = avatarColors(m.name);
          return (
            <div key={m.id} style={{ background: "#fff", borderRadius: 20, padding: 14, boxShadow: SH.card }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar name={m.name} src={m.avatar_url} size={54} bg={bg} fg={fg} fontSize={19} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>{m.name}{m.is_verified && <span title="Verified" style={{ color: C.green, display: "flex" }}><Icon name="shield" size={14} /></span>}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}{m.company ? ` · ${m.company}` : ""}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.text2, marginTop: 3 }}>
                    {m.total_sessions > 0 && m.rating > 0 ? <><Stars v={Number(m.rating)} /> · {m.total_sessions} {t("sesi", "sessions")}</> : <span style={{ color: C.purple }}>{t("Mentor baru", "New mentor")}</span>}
                    {m.experience_years ? <span>· {m.experience_years} {t("thn", "yrs")}</span> : null}
                  </div>
                </div>
              </div>
              {(m.expertise_areas || []).length > 0 && <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{(m.expertise_areas || []).slice(0, 4).map((x: string) => <span key={x} style={{ fontSize: 11, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{x}</span>)}</div>}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: isPro ? C.green : C.text }}>{isPro ? t("Termasuk Plus", "Included in Plus") : m.price_per_session && canPurchase() ? `${rpShort(m.price_per_session)} / ${t("sesi", "session")}` : t("Khusus Plus", "Plus only")}</span>
                <button onClick={() => nav(`/app/mentors/${m.id}`)} style={{ height: 36, border: "none", borderRadius: 11, background: C.blue, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "0 16px", cursor: "pointer" }}>{t("Pesan Sesi", "Book Session")}</button>
              </div>
            </div>
          );
        })}
      </div>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet ? LBL[sheet] : ""}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sheet && opts(sheet).map(v => <ChipBtn key={v} on={filter.v === v} onClick={() => { setFilter({ k: sheet, v }); setSheet(null); }}>{v}</ChipBtn>)}
          {sheet && !opts(sheet).length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada pilihan.", "No options yet.")}</div>}
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── MENTOR PROFILE + BOOKING ───────────────────────────────────────── */
function MentorProfile() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, isPro, profile, toast, track } = useApp();
  const [slot, setSlot] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [prep, setPrep] = useState<string[] | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["m-mentor", id, user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: m }, { data: slots }, { data: reviews }, { data: mine }] = await Promise.all([
        db.from("mentors").select("*").eq("id", id).maybeSingle(),
        db.from("mentor_slots").select("id,starts_at,duration_minutes,booking_id").eq("mentor_id", id).is("booking_id", null).gt("starts_at", new Date(Date.now() + 2 * 3600000).toISOString()).order("starts_at").limit(8),
        db.rpc("ulasan_mentor", { p_mentor: id }),
        db.from("mentor_bookings").select("id,session_date,status,topic").eq("user_id", user!.id).eq("mentor_id", id).order("session_date", { ascending: false }).limit(3),
      ]);
      return { m, slots: slots ?? [], reviews: reviews ?? [], mine: (mine ?? []) as any[] };
    },
  });
  const active = data?.mine.find(b => ["pending", "confirmed"].includes(b.status));
  useEffect(() => {
    if (!active || prep || !data?.m) return;
    const k = `tk-prep:${active.id}`;
    const c = localStorage.getItem(k);
    if (c) { setPrep(JSON.parse(c)); return; }
    askAi("mentor_prep", { input: `${data.m.name}, ${data.m.title}${data.m.company ? " di " + data.m.company : ""}. Topik: ${active.topic || "karier"}`, lang }).then(r => {
      if (r.text) { const qs = r.text.split("\n").map(s => s.replace(/^[\d\-.\s•]+/, "").trim()).filter(Boolean).slice(0, 5); setPrep(qs); localStorage.setItem(k, JSON.stringify(qs)); }
    });
  }, [active?.id, data?.m]); // eslint-disable-line
  if (isLoading) return <Loading />;
  const m = data?.m;
  if (!m) return <Screen><Header title="Mentor" /><div style={{ padding: 20 }}><Empty title={t("Mentor tidak ditemukan", "Mentor not found")} /></div></Screen>;
  const [bg, fg] = avatarColors(m.name);
  const minor = (profile?.usia ?? 0) < 18;
  const fmtSlot = (s: string) => new Date(s).toLocaleString(lang === "en" ? "en-GB" : "id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const slotRow = data!.slots.find((s: any) => s.id === slot);
  const first = (m.name || "").split(" ")[0];

  const book = async () => {
    if (!slot) return;
    if (!isPro) { track("paywall_viewed", { entry_point: "mentor_booking" }); nav("/app/pro"); return; }
    setBusy(true);
    const { error } = await db.rpc("pesan_slot_mentor", { p_slot: slot, p_topic: topic.trim() || (profile?.career_target ? `Karier ${profile.career_target}` : "Konsultasi karier") });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    track("mentor_session_booked", { mentor_id: id, price: m.price_per_session ?? 0, is_pro: isPro });
    toast(t("Permintaan terkirim — mentor merespons maksimal 48 jam", "Request sent — the mentor responds within 48 hours"));
    qc.invalidateQueries({ queryKey: ["m-mentor", id] });
  };
  const journey: [string, string][] = Array.isArray(m.career_journey) ? m.career_journey.map((j: any) => [j[0] ?? j.year ?? "", j[1] ?? j.role ?? ""]) : [];
  const dots = [C.blue, C.purple, C.green, C.amber, C.sky];

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => nav(-1)} /><div style={{ fontSize: 19, fontWeight: 700 }}>Mentor</div>
      </div>
      <div style={{ padding: "14px 20px 20px" }}>
        <div style={{ background: "#fff", borderRadius: 22, padding: 18, textAlign: "center", boxShadow: SH.card }}>
          <div style={{ display: "flex", justifyContent: "center" }}><span style={{ borderRadius: "50%", border: `4px solid ${C.tintBlue}`, display: "inline-flex" }}><Avatar name={m.name} src={m.avatar_url} size={80} bg={bg} fg={fg} fontSize={28} /></span></div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 8 }}>{m.name}</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>{m.title}{m.company ? ` · ${m.company}` : ""}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8, fontSize: 12, color: C.text2, flexWrap: "wrap" }}>
            {data!.reviews.length > 0 && <Stars v={Number(m.rating)} />}
            {m.total_sessions > 0 && <span>{m.total_sessions} {t("sesi", "sessions")}</span>}
            {m.experience_years ? <span>{m.experience_years} {t("thn pengalaman", "yrs exp.")}</span> : null}
            {m.is_verified && <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.green, fontWeight: 600 }}><Icon name="shield" size={13} />{t("Terverifikasi", "Verified")}</span>}
          </div>
          {((m.expertise_areas || []).length > 0 || (m.languages || []).length > 0) && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
              {(m.expertise_areas || []).map((x: string) => <span key={x} style={{ fontSize: 11, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{x}</span>)}
              {(m.languages || []).map((x: string) => <span key={x} style={{ fontSize: 11, color: C.text2, background: C.soft, padding: "3px 9px", borderRadius: 99 }}>{x}</span>)}
            </div>
          )}
        </div>

        {m.bio && <><H>{t("Tentang", "About")}</H><div style={{ background: "#fff", borderRadius: 18, padding: "12px 14px", marginTop: 10, fontSize: 13, lineHeight: 1.6, color: C.text2, boxShadow: SH.card }}>{m.bio}</div></>}
        {journey.length > 0 && <>
          <H>{t("Perjalanan karier", "Career journey")}</H>
          <div style={{ background: "#fff", borderRadius: 18, padding: "12px 14px", marginTop: 10, display: "flex", flexDirection: "column", gap: 10, boxShadow: SH.card, fontSize: 12.5, color: C.text2 }}>
            {journey.map(([y, r], i) => <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: dots[i % dots.length], flex: "none" }} />{y && <b style={{ color: C.text }}>{y}</b>}{y && " · "}{r}</div>)}
          </div>
        </>}
        {data!.reviews.length > 0 && <>
          <H>{t("Ulasan", "Reviews")}</H>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
            {data!.reviews.slice(0, 5).map((r: any, i: number) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", boxShadow: SH.card }}>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: C.text2 }}>“{r.note}”</div>
                <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.faint }}><span style={{ display: "flex", color: "#F59E0B" }}>{Array.from({ length: r.rating }).map((_, k) => <Icon key={k} name="star" size={11} filled />)}</span>{r.who}</div>
              </div>
            ))}
          </div>
        </>}

        {!active ? (<>
          <H>{t("Pilih waktu · 30 menit", "Choose a time · 30 min")}</H>
          {data!.slots.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              {data!.slots.map((s: any) => { const on = slot === s.id; return (
                <button key={s.id} onClick={() => setSlot(s.id)} aria-pressed={on} style={{ height: 46, border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.blue : "#fff", color: on ? "#fff" : C.text, borderRadius: 14, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{fmtSlot(s.starts_at)}</button>); })}
            </div>
          ) : <div style={{ marginTop: 10, background: "#fff", borderRadius: 16, padding: "12px 14px", fontSize: 13, color: C.muted, boxShadow: SH.card }}>{t("Belum ada jadwal kosong. Cek lagi nanti.", "No open slots yet. Check back later.")}</div>}
          {slot && <><div style={{ marginTop: 14 }}><Label>{t("Topik yang ingin dibahas", "What do you want to discuss?")}</Label></div><TextArea value={topic} onChange={e => setTopic(e.target.value)} placeholder={t("Contoh: memilih jurusan antara Ilmu Komputer dan Sistem Informasi", "e.g. choosing between Computer Science and Information Systems")} style={{ marginTop: 8, height: 76 }} /></>}
          {minor && <div style={{ marginTop: 12, display: "flex", gap: 9, fontSize: 11.5, color: "#7A5200", lineHeight: 1.5, background: C.tintYellow, borderRadius: 14, padding: "11px 13px" }}><span style={{ display: "flex", flex: "none", color: C.amber }}><Icon name="shield" size={16} /></span>{t("Karena usiamu di bawah 18 tahun, sesi direkam dengan persetujuan orang tua atau diadakan dalam format grup. Jangan berbagi kontak pribadi di luar Talentika.", "Because you're under 18, sessions are recorded with parental consent or held as a group. Don't share personal contacts outside Talentika.")}</div>}
        </>) : (<>
          <div style={{ marginTop: 14, background: C.tintGreen, borderRadius: 18, padding: "13px 14px", display: "flex", gap: 11, alignItems: "center" }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: active.status === "confirmed" ? C.green : C.amber, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={active.status === "confirmed" ? "check" : "clock"} size={17} /></span>
            <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#14532D" }}>{active.status === "confirmed" ? t("Sesi dikonfirmasi", "Session confirmed") : t("Sesi diminta", "Session requested")} · {fmtSlot(active.session_date)}</div>
              <div style={{ fontSize: 11.5, color: "#166534" }}>{active.status === "confirmed" ? t("30 menit · video call", "30 min · video call") : t(`${first} biasanya membalas dalam 48 jam`, `${first} usually replies within 48 hours`)}</div></div>
          </div>
          <div style={{ marginTop: 12, background: C.navy, borderRadius: 18, padding: 14, color: "#fff" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <img src={TIKA} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", background: C.tintBlue }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("TIKA MENYIAPKAN 5 PERTANYAAN", "TIKA PREPARED 5 QUESTIONS")}</span>
              {prep && <AiLabel dark />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
              {(prep ?? []).map((q, i) => <div key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.45, color: "rgba(255,255,255,.9)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, flex: "none", marginTop: 7 }} />{q}</div>)}
              {!prep && <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>●●●</div>}
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 11.5, color: "rgba(255,255,255,.7)", lineHeight: 1.5 }}>{t("Pengingat dikirim 24 jam & 1 jam sebelum sesi.", "Reminders go out 24h & 1h before the session.")}</div>
          </div>
        </>)}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)", borderTop: "1px solid #EEF2F8", background: "#fff", zIndex: 2 }}>
        {!active
          ? <Btn h={54} disabled={!slot || busy} onClick={book}>{!isPro && <Icon name="lock" size={16} />}{slot ? t(`Pesan Sesi · ${fmtSlot(slotRow?.starts_at)}`, `Book Session · ${fmtSlot(slotRow?.starts_at)}`) : t("Pilih waktu dulu", "Pick a time first")}</Btn>
          : <Btn kind="blueOutline" h={54} onClick={() => nav(`/app/reflection?booking=${active.id}`)}>{t("Sesi selesai? Isi refleksi", "Session done? Write a reflection")} <Icon name="right" size={16} /></Btn>}
      </div>
    </Screen>
  );
}

/* ── SESSION REFLECTION ─────────────────────────────────────────────── */
function Reflection() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { t, lang, user, toast, afterAction, track } = useApp();
  const { data, isLoading } = useQuery({
    queryKey: ["m-my-bookings", user?.id], enabled: !!user,
    queryFn: async () => ((await db.from("mentor_bookings").select("id,session_date,status,rating,mentors(name,title)").eq("user_id", user!.id).in("status", ["confirmed", "completed"]).order("session_date", { ascending: false }).limit(10)).data ?? []) as any[],
  });
  const [bid, setBid] = useState<string | null>(params.get("booking"));
  const b = data?.find(x => x.id === bid) ?? data?.[0];
  const [learned, setLearned] = useState("");
  const defaults = [t("Mulai proyek kecil bulan ini", "Start a small project this month"), t("Ikut organisasi/komunitas yang relevan", "Join a relevant club or community"), t("Baca 1 buku di bidang ini", "Read one book in this field"), t("Ngobrol lagi dengan mentor bulan depan", "Talk to the mentor again next month")];
  const [acts, setActs] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [done, setDone] = useState<string[] | null>(null);
  const [stars, setStars] = useState(0); const [note, setNote] = useState(""); const [rated, setRated] = useState(false);
  if (isLoading) return <Loading />;
  if (!b) return <Screen><Header title={t("Refleksi Sesi", "Session Reflection")} /><div style={{ padding: 20 }}><Empty icon="pencil" title={t("Belum ada sesi untuk direfleksikan", "No sessions to reflect on yet")} action={<Btn h={44} onClick={() => nav("/app/mentors")}>{t("Cari mentor", "Find a mentor")}</Btn>} /></div></Screen>;
  const submit = async () => {
    const { error } = await db.rpc("simpan_refleksi_mentor", { p_booking: b.id, p_learned: learned.trim(), p_actions: acts });
    if (error) { toast(errMsg(error), "error"); return; }
    track("mentor_session_completed", { mentor_id: b.id, price: 0, is_pro: true });
    setDone(acts);
    await afterAction(t("Refleksi mentoring", "Mentorship reflection"));
  };
  const rate = async () => {
    const { error } = await db.rpc("rate_mentor_session", { p_booking_id: b.id, p_rating: stars, p_note: note.trim() || null });
    if (error) { toast(errMsg(error), "error"); return; }
    setRated(true); toast(t("Terima kasih atas ulasanmu", "Thanks for your review"));
  };
  return (
    <Screen>
      <Header title={t("Refleksi Sesi", "Session Reflection")} sub={`${b.mentors?.name ?? "Mentor"} · ${fmtDate(b.session_date, lang)}`} />
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {(data?.length ?? 0) > 1 && <div style={{ display: "flex", gap: 7, overflowX: "auto" }}>{data!.map(x => <ChipBtn key={x.id} on={x.id === b.id} onClick={() => { setBid(x.id); setDone(null); }}>{x.mentors?.name} · {fmtDate(x.session_date, lang, { day: "numeric", month: "short" })}</ChipBtn>)}</div>}
        {!done ? (<>
          <Card><div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Apa yang kamu pelajari?", "What did you learn?")}</div><TextArea value={learned} onChange={e => setLearned(e.target.value)} placeholder={t("Contoh: AI PM butuh pemahaman data, bukan harus jago coding…", "e.g. An AI PM needs data sense, not necessarily coding…")} style={{ marginTop: 10 }} /></Card>
          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Apa yang akan kamu lakukan?", "What will you do next?")}</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {[...defaults, ...acts.filter(a => !defaults.includes(a))].map(a => { const on = acts.includes(a); return (
                <button key={a} onClick={() => setActs(s => on ? s.filter(x => x !== a) : [...s, a])} aria-pressed={on} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 11, border: `1.5px solid ${on ? C.blue : C.line}`, borderRadius: 14, background: on ? C.tintBlue : "#fff", padding: "12px 14px", cursor: "pointer" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: on ? C.blue : "#fff", border: `1.5px solid ${on ? C.blue : "#CBD5E1"}`, color: on ? "#fff" : C.faint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={on ? "check" : "plus"} size={13} /></span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: C.text }}>{a}</span>
                </button>); })}
              <div style={{ display: "flex", gap: 8 }}><Input placeholder={t("Aksi lain…", "Other action…")} value={custom} onChange={e => setCustom(e.target.value)} style={{ height: 44 }} /><Btn full={false} h={44} kind="soft" onClick={() => { if (custom.trim()) { setActs(s => [...s, custom.trim()]); setCustom(""); } }}><Icon name="plus" size={18} /></Btn></div>
            </div>
          </Card>
          <Btn h={54} disabled={!learned.trim() && !acts.length} onClick={submit}>{t("Simpan ke Rencana Bertumbuh", "Save to Growth Plan")}</Btn>
        </>) : (<>
          <div style={{ background: C.navy, borderRadius: 20, padding: 16, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow, display: "flex" }}><Icon name="sparkle" size={16} /></span><span style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Roadmap diperbarui", "Roadmap updated")}</span></div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,.9)" }}>
              {done.map(a => <span key={a}>+ {a} → {t("masuk Rencana 90 Hari", "added to 90-Day Plan")}</span>)}
              {!done.length && <span>{t("Refleksi tersimpan (privat).", "Reflection saved (private).")}</span>}
            </div>
            <button onClick={() => nav("/app/goals")} style={{ marginTop: 14, height: 42, padding: "0 16px", border: "none", borderRadius: 12, background: C.yellow, color: C.text, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>{t("Lihat Rencana 90 Hari", "See 90-Day Plan")}</button>
          </div>
          {!b.rating && !rated && (
            <Card>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Beri nilai sesi ini", "Rate this session")}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setStars(s)} aria-label={`${s}`} style={{ border: "none", background: "none", cursor: "pointer", color: s <= stars ? "#F59E0B" : C.line, padding: 2 }}><Icon name="star" size={28} filled /></button>)}</div>
              <TextArea value={note} onChange={e => setNote(e.target.value)} placeholder={t("Ulasan singkat (opsional, tampil publik tanpa nama lengkap)", "Short review (optional, shown publicly without full name)")} style={{ marginTop: 8, height: 70 }} />
              <Btn h={44} disabled={!stars} onClick={rate} style={{ marginTop: 10 }}>{t("Kirim ulasan", "Submit review")}</Btn>
            </Card>
          )}
        </>)}
        <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Icon name="lock" size={12} />{t("Refleksi selalu privat — tidak dibagikan ke orang tua, sekolah, atau mentor.", "Reflections are always private — never shared with parents, school or mentors.")}</div>
      </div>
    </Screen>
  );
}

/* ── COMMUNITY ──────────────────────────────────────────────────────── */
const FEED_TABS: [string, string, string][] = [["projects", "Proyek", "Projects"], ["achievements", "Prestasi", "Achievements"], ["questions", "Pertanyaan", "Questions"], ["challenges", "Tantangan", "Challenges"], ["events", "Acara", "Events"]];
const INTERESTS = ["AI", "Robotics", "Sustainability", "Entrepreneurship", "Research", "Creative Tech", "Global Leadership"];
function Community() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, profile, gam, toast, isPro } = useApp();
  const [tab, setTab] = useState("projects");
  const [interest, setInterest] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [text, setText] = useState("");
  const [replies, setReplies] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [menu, setMenu] = useState<any>(null);
  const { data: challenge } = useQuery({
    queryKey: ["m-challenge-week", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: c } = await db.from("community_challenges").select("*").eq("is_active", true).or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`).order("end_date", { ascending: true, nullsFirst: false }).limit(1);
      const ch = c?.[0]; if (!ch) return null;
      const { data: mine } = await db.from("user_challenges").select("status,submission_data").eq("user_id", user!.id).eq("challenge_id", ch.id).maybeSingle();
      const draft = JSON.parse(localStorage.getItem(`tk-ch:${ch.id}`) || "{}");
      return { ...ch, mine, parts: mine?.submission_data ?? draft };
    },
  });
  const { data: posts, isLoading } = useQuery({
    queryKey: ["m-feed", tab, interest, user?.id], enabled: !!user,
    queryFn: async () => ((await db.rpc("list_feed", { p_tab: tab, p_interest: interest })).data ?? []) as any[],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["m-feed"] });
  const like = async (p: any) => { await db.rpc("toggle_post_like", { p_post_id: p.id }); refresh(); };
  const follow = async (p: any) => {
    if (p.author_id === user!.id) return;
    if (p.following) await db.from("user_follows").delete().eq("follower_id", user!.id).eq("followee_id", p.author_id);
    else await db.from("user_follows").insert({ follower_id: user!.id, followee_id: p.author_id });
    refresh();
  };
  const post = async () => {
    const { error } = await db.rpc("buat_post_komunitas", { p_content: text.trim(), p_category: tab, p_interest: interest });
    if (error) { toast(/premium|row-level|policy/i.test(error.message) ? t("Membuat postingan tersedia untuk Talentika Plus", "Posting is available on Talentika Plus") : errMsg(error), "error"); if (!isPro) nav("/app/pro"); return; }
    setText(""); setCompose(false); refresh(); toast(t("Postingan terkirim — dicek otomatis sebelum tampil", "Post sent — auto-checked before it shows"));
  };
  const openReplies = async (p: any) => { const { data } = await db.rpc("get_post_replies", { p_post_id: p.id }); setReplies({ post: p, list: data ?? [] }); };
  const sendReply = async () => {
    const { error } = await db.rpc("create_forum_reply", { p_post_id: replies.post.id, p_content: reply.trim() });
    if (error) { toast(errMsg(error), "error"); return; }
    setReply(""); openReplies(replies.post); refresh();
  };
  const report = async (p: any) => { await db.from("content_reports").insert({ reporter_id: user!.id, target_type: "post", target_id: p.id, reason: "Dilaporkan dari aplikasi" }); setMenu(null); toast(t("Laporan terkirim. Tim moderasi akan meninjau.", "Report sent. Our moderators will review it.")); };
  const block = async (p: any) => { await db.from("user_blocks").insert({ blocker_id: user!.id, blocked_id: p.author_id }); setMenu(null); refresh(); toast(t("Pengguna diblokir", "User blocked")); };
  const share = async (p: any) => { const s = `${p.author}: ${p.content.slice(0, 140)} — via Talentika`; if (navigator.share) { try { await navigator.share({ text: s }); } catch { /* */ } } else { await navigator.clipboard?.writeText(s); toast(t("Disalin", "Copied")); } };
  const parts = ["idea", "prototype", "presentation", "reflection"];
  const PART_L: Record<string, [string, string]> = { idea: ["Ide", "Idea"], prototype: ["Prototipe", "Prototype"], presentation: ["Presentasi", "Presentation"], reflection: ["Refleksi", "Reflection"] };
  const daysLeft = challenge?.end_date ? Math.max(0, Math.ceil((+new Date(challenge.end_date) - Date.now()) / 86400000)) : null;
  const tabL = FEED_TABS.find(f => f[0] === tab)!;
  return (
    <Screen>
      <Header title={t("Komunitas", "Community")} sub={t("Pelajar membangun masa depan cerah", "Students building brighter futures")} />
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={() => setCompose(true)} style={{ width: "100%", border: "none", background: "#fff", borderRadius: 16, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: SH.card }}>
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size={36} />
          <span style={{ flex: 1, textAlign: "left", fontSize: 13, color: C.faint }}>{t("Bagikan proyek atau prestasimu…", "Share your project or achievement…")}</span>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: C.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="pencil" size={16} /></span>
        </button>

        {challenge && (
          <div style={{ background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 20, padding: 16, color: "#fff" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="rocket" size={23} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("TANTANGAN MINGGU INI", "WEEKLY CHALLENGE")}{daysLeft !== null ? ` · ${t(`${daysLeft} HARI LAGI`, `${daysLeft} DAYS LEFT`)}` : ""}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>{challenge.title}</div>
              </div>
            </div>
            {challenge.description && <div style={{ marginTop: 8, fontSize: 12, opacity: .9, lineHeight: 1.5 }}>{challenge.description}</div>}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6 }}>
              {parts.map((p, i) => { const on = !!challenge.parts?.[p]; return (
                <div key={p} style={{ background: "rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: on ? C.green : "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{on ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span style={{ fontSize: 10, fontWeight: 500 }}>{t(...PART_L[p])}</span>
                </div>); })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              {gam && <span style={{ flex: 1, fontSize: 11.5, opacity: .9 }}>+{challenge.xp_reward ?? 0} XP · badge · {t("bukti portofolio", "portfolio evidence")}</span>}
              {challenge.mine && ["submitted", "completed"].includes(challenge.mine.status)
                ? <button onClick={() => nav("/app/portfolio")} style={{ marginLeft: "auto", height: 36, border: "none", borderRadius: 11, background: C.green, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "0 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Icon name="check" size={14} />{t("Terkirim", "Submitted")}</button>
                : <button onClick={() => nav(`/app/challenge/${challenge.id}`)} style={{ marginLeft: "auto", height: 36, border: "none", borderRadius: 11, background: "#fff", color: C.blue, fontSize: 12.5, fontWeight: 700, padding: "0 13px", cursor: "pointer" }}>{t("Ikut", "Join")}</button>}
            </div>
          </div>
        )}

        <Tabs value={tab} onChange={v => setTab(v as string)} items={FEED_TABS.map(([k, id, en]) => ({ value: k, label: t(id, en) }))} />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
          {[null, ...INTERESTS].map(n => <button key={n ?? "all"} onClick={() => setInterest(n)} style={{ flex: "none", height: 28, border: "none", fontSize: 11.5, fontWeight: 500, color: interest === n ? "#fff" : C.blue, background: interest === n ? C.blue : C.tintBlue, padding: "0 11px", borderRadius: 99, cursor: "pointer" }}>{n ?? t("Semua minat", "All interests")}</button>)}
        </div>
        {isLoading && <Loading />}
        {!isLoading && !posts?.length && <Empty icon="msg" title={t("Belum ada postingan di sini", "No posts here yet")} body={t("Jadilah yang pertama berbagi proyek, prestasi, atau pertanyaan.", "Be the first to share a project, achievement or question.")} />}
        {posts?.map(p => {
          const [bg, fg] = avatarColors(p.author);
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 20, boxShadow: SH.card }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px" }}>
                <Avatar name={p.author} size={38} bg={bg} fg={fg} fontSize={13} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.author}</div><div style={{ fontSize: 11, color: C.muted }}>{timeAgo(p.created_at, lang)}</div></div>
                {p.interest && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{p.interest}</span>}
                {p.author_id !== user!.id && <button onClick={() => follow(p)} style={{ border: `1.5px solid ${C.line}`, background: p.following ? C.tintBlue : "#fff", color: C.blue, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, cursor: "pointer" }}>{p.following ? t("Mengikuti", "Following") : t("Ikuti", "Follow")}</button>}
                <button onClick={() => setMenu(p)} aria-label="Menu" style={{ border: "none", background: "none", color: C.faint, cursor: "pointer", padding: 2, fontSize: 18, lineHeight: 1 }}>⋯</button>
              </div>
              <div style={{ padding: "0 14px 10px", fontSize: 13, lineHeight: 1.55, color: C.text, whiteSpace: "pre-wrap" }}>{p.content}</div>
              <div style={{ display: "flex", gap: 18, padding: "10px 14px", borderTop: `1px solid ${C.track}`, fontSize: 12.5, color: C.muted }}>
                <button onClick={() => like(p)} aria-pressed={!!p.liked_by_me} style={{ border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, color: p.liked_by_me ? C.red : C.muted }}><Icon name="heart" size={17} filled={!!p.liked_by_me} />{p.likes}</button>
                <button onClick={() => openReplies(p)} style={{ border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, color: C.muted }}><Icon name="msg" size={17} />{p.replies}</button>
                <button onClick={() => share(p)} style={{ marginLeft: "auto", border: "none", background: "none", padding: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, color: C.muted }}><Icon name="share" size={16} />{t("Bagikan", "Share")}</button>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: C.faint, textAlign: "center" }}>{t("Postingan pelajar di bawah 18 tahun ditinjau sebelum tampil publik.", "Posts by students under 18 are reviewed before they go public.")}</div>
      </div>
      <Sheet open={compose} onClose={() => setCompose(false)} title={t(`Posting ke ${tabL[1]}`, `Post to ${tabL[2]}`)}>
        <TextArea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={t("Ceritakan proyek, prestasi, atau pertanyaanmu…", "Share your project, achievement or question…")} style={{ height: 120 }} />
        <div style={{ marginTop: 8, fontSize: 11.5, color: C.faint }}>{t("Postingan dicek otomatis. Jangan bagikan nomor HP, alamat, atau data pribadi.", "Posts are auto-checked. Don't share phone numbers, addresses or personal data.")}</div>
        <Btn disabled={text.trim().length < 5} onClick={post} style={{ marginTop: 10 }}>{t("Kirim", "Post")}</Btn>
      </Sheet>
      <Sheet open={!!replies} onClose={() => setReplies(null)} title={t("Balasan", "Replies")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {replies?.list.map((r: any) => <div key={r.id} style={{ background: C.bg, borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{r.author} <span style={{ color: C.faint, fontWeight: 500 }}>· {timeAgo(r.created_at, lang)}</span></div><div style={{ marginTop: 3, fontSize: 13, color: C.text2 }}>{r.content}</div></div>)}
          {!replies?.list.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada balasan.", "No replies yet.")}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}><Input value={reply} onChange={e => setReply(e.target.value)} placeholder={t("Tulis balasan…", "Write a reply…")} style={{ height: 44 }} /><Btn full={false} h={44} disabled={!reply.trim()} onClick={sendReply}><Icon name="send" size={17} /></Btn></div>
        </div>
      </Sheet>
      <Sheet open={!!menu} onClose={() => setMenu(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn kind="outline" onClick={() => report(menu)}><Icon name="info" size={17} />{t("Laporkan postingan", "Report post")}</Btn>
          {menu?.author_id !== user?.id && <Btn kind="outline" onClick={() => block(menu)} style={{ color: C.red }}><Icon name="x" size={17} />{t("Blokir pengguna", "Block user")}</Btn>}
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── CHALLENGE SUBMISSION ───────────────────────────────────────────── */
function ChallengeSubmit() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, gam, toast, afterAction, track } = useApp();
  const key = `tk-ch:${id}`;
  const [parts, setParts] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem(key) || "{}"));
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: ch } = useQuery({ queryKey: ["m-challenge", id], queryFn: async () => (await db.from("community_challenges").select("*").eq("id", id).maybeSingle()).data });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(parts)); }, [parts, key]);
  const defs: [string, string, string, "text" | "file", string][] = [
    ["idea", t("Ide", "Idea"), t("Ringkasan ide solusimu", "Summary of your solution idea"), "text", "bulb"],
    ["prototype", t("Prototipe", "Prototype"), t("Unggah foto, video, atau link", "Upload a photo, video, or link"), "file", "image"],
    ["presentation", t("Presentasi", "Presentation"), t("Slide atau video pitch 2 menit", "Slides or a 2-minute pitch video"), "file", "video"],
    ["reflection", t("Refleksi", "Reflection"), t("Apa yang kamu pelajari?", "What did you learn?"), "text", "pencil"],
  ];
  const all = defs.every(([k]) => parts[k]);
  const upload = async (f: File) => {
    try { const p = await uploadEvidence(user!.id, `challenge-${id}`, f); setParts(s => ({ ...s, [edit!]: `storage:${p}` })); setEdit(null); }
    catch (e) { toast(errMsg(e), "error"); }
  };
  const submit = async () => {
    setBusy(true);
    const { error } = await db.rpc("kirim_challenge", { p_challenge: id, p_data: parts });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    localStorage.removeItem(key); setDone(true);
    track("evidence_added", { source: "challenge" });
    qc.invalidateQueries({ queryKey: ["m-challenge-week"] });
    await afterAction(t("Tantangan terkirim", "Challenge submitted"));
  };
  return (
    <Screen>
      <Header title={t("Kirim Tantangan", "Submit Challenge")} sub={ch?.title} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {!done ? (<>
          {defs.map(([k, label, desc, , icon], i) => { const on = !!parts[k]; return (
            <button key={k} onClick={() => { setEdit(k); setVal(parts[k]?.startsWith("storage:") ? "" : parts[k] ?? ""); }} style={{ width: "100%", textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: on ? C.tintGreen : C.tintBlue, color: on ? C.green : C.blue, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={on ? "check" : icon} size={19} /></span>
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{i + 1}. {label}</span><span style={{ display: "block", marginTop: 2, fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{on ? (parts[k].startsWith("storage:") ? t("File terlampir", "File attached") : parts[k]) : desc}</span></span>
              <span style={{ fontSize: 11, fontWeight: 600, color: on ? C.green : C.blue, background: on ? C.tintGreen : C.tintBlue, padding: "4px 10px", borderRadius: 99 }}>{on ? t("Terlampir", "Attached") : t("Tambah", "Add")}</span>
            </button>); })}
          <Btn h={54} disabled={!all || busy} onClick={submit} style={{ marginTop: 6 }}>{t("Kirim", "Submit")}</Btn>
          <p style={{ margin: 0, textAlign: "center", fontSize: 11.5, color: C.faint }}>{t("Lengkapi 4 bagian untuk mengirim · draf tersimpan otomatis", "Complete all 4 parts to submit · draft auto-saved")}</p>
        </>) : (
          <div style={{ background: "#fff", borderRadius: 22, padding: "28px 20px", textAlign: "center", boxShadow: SH.card }}>
            <span style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 20, background: C.tintGreen, color: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="leaf" size={30} /></span>
            <div style={{ marginTop: 12, fontSize: 20, fontWeight: 800 }}>{t("Kiriman terkirim!", "Submission sent!")}</div>
            <p style={{ margin: "8px auto 0", fontSize: 13.5, color: C.muted, lineHeight: 1.55, maxWidth: 260 }}>{t("Kirimanmu sudah masuk Portofolio sebagai bukti.", "Your submission is now evidence in your Portfolio.")}</p>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {gam && <span style={{ fontSize: 12, fontWeight: 600, color: C.gold, background: C.tintYellow, padding: "5px 11px", borderRadius: 99 }}>+{ch?.xp_reward ?? 0} XP</span>}
              <span style={{ fontSize: 12, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "5px 11px", borderRadius: 99 }}>{t("Bukti portofolio", "Portfolio evidence")}</span>
            </div>
            <Btn h={48} onClick={() => nav("/app/portfolio")} style={{ marginTop: 18 }}>{t("Lihat di Portofolio", "See in Portfolio")}</Btn>
          </div>
        )}
      </div>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={defs.find(d => d[0] === edit)?.[1]}>
        {edit && defs.find(d => d[0] === edit)![3] === "file" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ height: 52, border: `1.5px dashed ${C.lightBlue}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: C.blue, cursor: "pointer" }}>
              <Icon name="upload" size={18} />{t("Unggah file", "Upload a file")}<input type="file" hidden accept="image/*,video/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </label>
            <div style={{ textAlign: "center", fontSize: 12, color: C.faint }}>{t("atau tempel link", "or paste a link")}</div>
            <Input icon="link" placeholder="https://…" value={val} onChange={e => setVal(e.target.value)} />
            <Btn disabled={!/^https?:\/\//.test(val)} onClick={() => { setParts(s => ({ ...s, [edit]: val.trim() })); setEdit(null); }}>{t("Simpan", "Save")}</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TextArea autoFocus value={val} onChange={e => setVal(e.target.value)} style={{ height: 120 }} />
            <Btn disabled={val.trim().length < 5} onClick={() => { setParts(s => ({ ...s, [edit!]: val.trim() })); setEdit(null); }}>{t("Simpan", "Save")}</Btn>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
