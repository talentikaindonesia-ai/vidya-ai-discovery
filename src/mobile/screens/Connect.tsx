import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { askAi, db, errMsg, uploadEvidence, useApp, useCareers } from "../store";
import { AiLabel, Avatar, Body, Btn, Card, CardTitle, ChipBtn, DarkCard, Empty, FilterChip, Header, HScroll, Input, Kicker, Label, Loading, Pill, Screen, Sheet, TextArea } from "../ui";
import { C, F, SH, avatarColors, rpShort } from "../theme";
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

/* 57 MENTOR DISCOVER (MEN-01) */
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
  return (
    <Screen>
      <Header title="Mentor Discover" sub={target ? t(`Cocok dengan pathway ${target.name}-mu`, `Matched to your ${target.name} pathway`) : t("Belajar langsung dari praktisi", "Learn from practitioners")} />
      <HScroll gap={7} style={{ margin: "14px 0 0", padding: "0 20px" }}>
        <FilterChip on={!filter.k} onClick={() => setFilter({ k: null, v: null })}>{t("Untukmu", "For you")}</FilterChip>
        {(["industry", "languages", "country"] as const).map(k => (
          <FilterChip key={k} on={filter.k === k} onClick={() => setSheet(k)}>{filter.k === k ? filter.v : ({ industry: "Industry", languages: "Language", country: "Country" } as any)[k]} ▾</FilterChip>
        ))}
      </HScroll>
      <Body top={14} gap={12}>
        {isLoading && <Loading />}
        {!isLoading && !list.length && <Empty icon="🤝" title={t("Mentor sedang dikurasi", "Mentors are being curated")} body={t("Kami memverifikasi setiap mentor sebelum tampil. Kamu profesional dan ingin berbagi?", "We verify every mentor before they appear. Are you a professional who wants to give back?")} action={<Btn kind="outline" h={44} onClick={() => nav("/app/mentor-dashboard")}>{t("Daftar jadi mentor", "Become a mentor")}</Btn>} />}
        {list.map(m => {
          const [bg, fg] = avatarColors(m.name);
          return (
            <Card key={m.id} pad={16}>
              <div style={{ display: "flex", gap: 13 }}>
                <Avatar name={m.name} src={m.avatar_url} size={52} bg={bg} fg={fg} fontSize={19} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{m.name} {m.is_verified && <span title="Verified" style={{ color: C.blue }}>✓</span>}</div>
                  <div style={{ marginTop: 2, fontSize: 12.5, color: C.text3, fontWeight: 600 }}>{m.title}{m.company ? ` · ${m.company}` : ""}</div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: C.muted, fontWeight: 600 }}>{m.experience_years ? t(`${m.experience_years} tahun pengalaman`, `${m.experience_years} yrs experience`) : ""}{m.total_sessions > 0 && m.rating > 0 ? ` · ⭐ ${Number(m.rating).toFixed(1)} (${m.total_sessions})` : ` · ${t("Mentor baru", "New mentor")}`}</div>
                </div>
              </div>
              <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 6 }}>{(m.expertise_areas || []).slice(0, 4).map((x: string) => <Pill key={x}>{x}</Pill>)}</div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, fontFamily: F.display, color: isPro ? C.green : C.text }}>{isPro ? t("Termasuk Pro 👑", "Included in Pro 👑") : m.price_per_session ? `${rpShort(m.price_per_session)} / ${t("sesi", "session")}` : t("Khusus Pro", "Pro only")}</span>
                <button onClick={() => nav(`/app/mentors/${m.id}`)} style={{ border: "none", background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "9px 16px", borderRadius: 99, cursor: "pointer" }}>Book Session</button>
              </div>
            </Card>
          );
        })}
      </Body>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet ? ({ industry: "Industry", languages: "Language", country: "Country" } as any)[sheet] : ""}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {sheet && opts(sheet).map(v => <ChipBtn key={v} on={filter.v === v} onClick={() => { setFilter({ k: sheet, v }); setSheet(null); }}>{v}</ChipBtn>)}
          {sheet && !opts(sheet).length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada pilihan.", "No options yet.")}</div>}
        </div>
      </Sheet>
    </Screen>
  );
}

/* 59 MENTOR PROFILE + BOOKING (MEN-02, MEN-03, MEN-04, MEN-06) */
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
  if (!m) return <Screen><Header title="Mentor" /><Body><Empty title={t("Mentor tidak ditemukan", "Mentor not found")} /></Body></Screen>;
  const [bg, fg] = avatarColors(m.name);
  const minor = (profile?.usia ?? 0) < 18;
  const fmtSlot = (s: string) => new Date(s).toLocaleString(lang === "en" ? "en-GB" : "id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

  const book = async () => {
    if (!slot) return;
    if (!isPro) { track("paywall_viewed", { entry_point: "mentor_booking" }); nav("/app/pro"); return; }
    setBusy(true);
    const { error } = await db.rpc("pesan_slot_mentor", { p_slot: slot, p_topic: topic.trim() || (profile?.career_target ? `Karier ${profile.career_target}` : "Konsultasi karier") });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    track("mentor_session_booked", { mentor_id: id, price: m.price_per_session ?? 0, is_pro: isPro });
    toast(t("Request terkirim — mentor merespons maksimal 48 jam", "Request sent — the mentor responds within 48 hours"));
    qc.invalidateQueries({ queryKey: ["m-mentor", id] });
  };

  return (
    <Screen>
      <Header plain title="Mentor Profile" />
      <Body top={14} gap={12}>
        <Card radius={22} pad={20} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Avatar name={m.name} src={m.avatar_url} size={72} bg={bg} fg={fg} fontSize={26} /></div>
          <div style={{ marginTop: 11, fontSize: 19, fontWeight: 800 }}>{m.name} {m.is_verified && <span style={{ color: C.blue, fontSize: 15 }}>✓</span>}</div>
          <div style={{ marginTop: 3, fontSize: 13, color: C.text3, fontWeight: 600 }}>{m.title}{m.company ? ` · ${m.company}` : ""}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: C.muted }}>{m.experience_years ? t(`${m.experience_years} tahun pengalaman`, `${m.experience_years} yrs experience`) : ""}{data!.reviews.length ? ` · ⭐ ${Number(m.rating).toFixed(1)} · ${data!.reviews.length} reviews` : ""}</div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>{(m.expertise_areas || []).map((x: string) => <Pill key={x}>{x}</Pill>)}{(m.languages || []).map((x: string) => <Pill key={x} fg={C.muted} bg={C.bg}>{x}</Pill>)}</div>
        </Card>
        <Card>
          <CardTitle>About</CardTitle>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text3 }}>{m.bio || "—"}</p>
          {Array.isArray(m.career_journey) && m.career_journey.length > 0 && (<>
            <Kicker style={{ marginTop: 14 }}>Career journey</Kicker>
            <div style={{ marginTop: 9 }}>
              {m.career_journey.map((j: any, i: number, a: any[]) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.blue, marginTop: 3 }} />{i < a.length - 1 && <span style={{ width: 2, flex: 1, background: C.track, minHeight: 14 }} />}</div>
                  <div style={{ paddingBottom: 11, fontSize: 13 }}><b>{j[0] ?? j.year}</b> · {j[1] ?? j.role}</div>
                </div>
              ))}
            </div>
          </>)}
        </Card>
        {data!.reviews.length > 0 && (
          <Card>
            <CardTitle>Reviews</CardTitle>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
              {data!.reviews.slice(0, 5).map((r: any, i: number) => (
                <div key={i} style={{ background: C.subtle, borderRadius: 13, padding: "12px 14px" }}><div style={{ fontSize: 13, lineHeight: 1.5, color: C.text2 }}>“{r.note}”</div><div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: C.faint }}>{"⭐".repeat(r.rating)} · {r.who}</div></div>
              ))}
            </div>
          </Card>
        )}
        {!active ? (<>
          <Card>
            <CardTitle>Availability</CardTitle>
            {data!.slots.length ? (
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {data!.slots.map((s: any) => { const on = slot === s.id; return (
                  <button key={s.id} onClick={() => setSlot(s.id)} style={{ height: 44, border: `1.8px solid ${on ? C.blue : C.track}`, borderRadius: 13, background: on ? C.tintBlue : "#fff", color: on ? C.blueDark : C.muted, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{fmtSlot(s.starts_at)}</button>); })}
              </div>
            ) : <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Belum ada jadwal kosong. Cek lagi nanti.", "No open slots yet. Check back later.")}</div>}
            {slot && <><div style={{ marginTop: 12 }}><Label>{t("Topik yang ingin dibahas", "What do you want to discuss?")}</Label></div><TextArea value={topic} onChange={e => setTopic(e.target.value)} placeholder={t("Contoh: memilih jurusan antara Ilmu Komputer dan Sistem Informasi", "e.g. choosing between Computer Science and Information Systems")} style={{ marginTop: 8, height: 76 }} /></>}
          </Card>
          {minor && <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.5, background: C.tintYellow, borderRadius: 14, padding: "11px 13px" }}>🛡️ {t("Karena usiamu di bawah 18 tahun, sesi direkam dengan persetujuan orang tua atau diadakan dalam format grup. Jangan berbagi kontak pribadi di luar Talentika.", "Because you're under 18, sessions are recorded with parental consent or held as a group. Don't share personal contacts outside Talentika.")}</div>}
          <Btn kind={slot ? "orange" : "disabled"} h={54} disabled={!slot || busy} onClick={book} style={{ fontSize: 16 }}>{isPro ? "Request Mentorship" : "👑 Request Mentorship · Pro"}</Btn>
        </>) : (<>
          <div style={{ background: C.tintGreen, borderRadius: 20, padding: "16px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{active.status === "confirmed" ? "✅" : "⏳"}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, fontFamily: F.display, color: C.greenDark }}>{active.status === "confirmed" ? t("Sesi dikonfirmasi", "Session confirmed") : t("Request terkirim", "Request sent")}</div>
              <div style={{ marginTop: 2, fontSize: 12.5, color: "#166534" }}>{fmtSlot(active.session_date)} · 30 {t("menit · video call", "min · video call")}</div></div>
          </div>
          <DarkCard>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow }}>✦</span><span style={{ fontSize: 14.5, fontWeight: 800, flex: 1 }}>AI prepares you</span>{prep && <AiLabel dark />}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "rgba(255,255,255,.78)" }}>{t("Ini 5 pertanyaan yang bisa kamu tanyakan ke mentor.", "Here are 5 questions you can ask your mentor.")}</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {(prep ?? []).map((q, i) => <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.45 }}><span style={{ color: C.yellow, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{i + 1}.</span><span>{q}</span></div>)}
              {!prep && <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)" }}>●●●</div>}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 12, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>{t("Pengingat dikirim 24 jam & 1 jam sebelum sesi. Setelah sesi, isi refleksi — roadmap-mu ikut diperbarui.", "Reminders go out 24h & 1h before. After the session, reflect — your roadmap updates.")}</div>
          </DarkCard>
          <Btn kind="outline" h={50} onClick={() => nav(`/app/reflection?booking=${active.id}`)}>{t("Sesi selesai? Isi Session Reflection →", "Session done? Fill in the reflection →")}</Btn>
        </>)}
      </Body>
    </Screen>
  );
}

/* 62 SESSION REFLECTION (MEN-05) */
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
  const defaults = [t("Mulai project kecil bulan ini", "Start a small project this month"), t("Ikut organisasi/komunitas yang relevan", "Join a relevant club or community"), t("Baca 1 buku di bidang ini", "Read one book in this field"), t("Ngobrol lagi dengan mentor bulan depan", "Talk to the mentor again next month")];
  const [acts, setActs] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [done, setDone] = useState<string[] | null>(null);
  const [stars, setStars] = useState(0); const [note, setNote] = useState(""); const [rated, setRated] = useState(false);
  if (isLoading) return <Loading />;
  if (!b) return <Screen><Header title="Session Reflection" /><Body><Empty icon="📝" title={t("Belum ada sesi untuk direfleksikan", "No sessions to reflect on yet")} action={<Btn h={44} onClick={() => nav("/app/mentors")}>{t("Cari mentor", "Find a mentor")}</Btn>} /></Body></Screen>;
  const submit = async () => {
    const { data: r, error } = await db.rpc("simpan_refleksi_mentor", { p_booking: b.id, p_learned: learned.trim(), p_actions: acts });
    if (error) { toast(errMsg(error), "error"); return; }
    track("mentor_session_completed", { mentor_id: b.id, price: 0, is_pro: true });
    setDone(acts);
    await afterAction(t("Mentorship reflection", "Mentorship reflection"));
    void r;
  };
  const rate = async () => {
    const { error } = await db.rpc("rate_mentor_session", { p_booking_id: b.id, p_rating: stars, p_note: note.trim() || null });
    if (error) { toast(errMsg(error), "error"); return; }
    setRated(true); toast(t("Terima kasih atas ulasanmu", "Thanks for your review"));
  };
  return (
    <Screen>
      <Header title="Session Reflection" sub={`${b.mentors?.name ?? "Mentor"} · ${fmtDate(b.session_date, lang)}`} />
      <Body>
        {(data?.length ?? 0) > 1 && <HScroll gap={7}>{data!.map(x => <ChipBtn key={x.id} on={x.id === b.id} onClick={() => { setBid(x.id); setDone(null); }} style={{ height: 32, fontSize: 12 }}>{x.mentors?.name} · {fmtDate(x.session_date, lang, { day: "numeric", month: "short" })}</ChipBtn>)}</HScroll>}
        {!done ? (<>
          <Card><CardTitle>What did you learn?</CardTitle><TextArea value={learned} onChange={e => setLearned(e.target.value)} placeholder={t("Contoh: AI PM butuh pemahaman data, bukan harus jago coding…", "e.g. An AI PM needs data sense, not necessarily coding…")} style={{ marginTop: 10 }} /></Card>
          <Card>
            <CardTitle>What will you do next?</CardTitle>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {[...defaults, ...acts.filter(a => !defaults.includes(a))].map(a => { const on = acts.includes(a); return (
                <button key={a} onClick={() => setActs(s => on ? s.filter(x => x !== a) : [...s, a])} style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 11, border: `1.8px solid ${on ? C.blue : C.track}`, borderRadius: 14, background: on ? C.tintBlue : "#fff", padding: "12px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, background: on ? C.blue : "#fff", border: `2px solid ${on ? C.blue : C.disabled}`, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on ? "✓" : "+"}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{a}</span>
                </button>); })}
              <div style={{ display: "flex", gap: 8 }}><Input placeholder={t("Aksi lain…", "Other action…")} value={custom} onChange={e => setCustom(e.target.value)} style={{ height: 44 }} /><Btn full={false} h={44} kind="soft" onClick={() => { if (custom.trim()) { setActs(s => [...s, custom.trim()]); setCustom(""); } }}>+</Btn></div>
            </div>
          </Card>
          <Btn h={54} disabled={!learned.trim() && !acts.length} onClick={submit}>{t("Simpan refleksi", "Save reflection")}</Btn>
        </>) : (<>
          <DarkCard style={{ animation: "tkPop .35s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow }}>✦</span><span style={{ fontSize: 14.5, fontWeight: 800 }}>{t("Roadmap diperbarui", "Roadmap updated")}</span></div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 7, fontSize: 13, lineHeight: 1.45 }}>
              {done.map(a => <span key={a}>+ {a} → {t("masuk 90-Day Plan", "added to 90-Day Plan")}</span>)}
              {!done.length && <span>{t("Refleksi tersimpan (privat).", "Reflection saved (private).")}</span>}
            </div>
            <button onClick={() => nav("/app/goals")} style={{ marginTop: 14, height: 42, padding: "0 16px", border: "none", borderRadius: 12, background: C.orange, color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>{t("Lihat 90-Day Plan", "See 90-Day Plan")}</button>
          </DarkCard>
          {!b.rating && !rated && (
            <Card>
              <CardTitle>{t("Beri nilai sesi ini", "Rate this session")}</CardTitle>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setStars(s)} aria-label={`${s} bintang`} style={{ border: "none", background: "none", fontSize: 28, cursor: "pointer", opacity: s <= stars ? 1 : 0.3 }}>⭐</button>)}</div>
              <TextArea value={note} onChange={e => setNote(e.target.value)} placeholder={t("Ulasan singkat (opsional, tampil publik tanpa nama lengkap)", "Short review (optional, shown publicly without full name)")} style={{ marginTop: 8, height: 70 }} />
              <Btn h={44} disabled={!stars} onClick={rate} style={{ marginTop: 10 }}>{t("Kirim ulasan", "Submit review")}</Btn>
            </Card>
          )}
        </>)}
        <div style={{ fontSize: 11.5, color: C.faint, textAlign: "center" }}>🔒 {t("Refleksi selalu privat — tidak dibagikan ke orang tua, sekolah, atau mentor.", "Reflections are always private — never shared with parents, school or mentors.")}</div>
      </Body>
    </Screen>
  );
}

/* 63 COMMUNITY (COM-01, COM-02, COM-04) */
const FEED_TABS: [string, string, string][] = [["projects", "Projects", "Projects"], ["achievements", "Achievements", "Achievements"], ["questions", "Questions", "Questions"], ["challenges", "Challenges", "Challenges"], ["events", "Events", "Events"]];
const INTERESTS = ["AI", "Robotics", "Sustainability", "Entrepreneurship", "Research", "Creative Tech", "Global Leadership"];
function Community() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, gam, toast, isPro } = useApp();
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
    if (error) { toast(/premium|row-level|policy/i.test(error.message) ? t("Membuat postingan tersedia untuk Talentika Pro", "Posting is available on Talentika Pro") : errMsg(error), "error"); if (!isPro) nav("/app/pro"); return; }
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
  const daysLeft = challenge?.end_date ? Math.max(0, Math.ceil((+new Date(challenge.end_date) - Date.now()) / 86400000)) : null;
  return (
    <Screen>
      <Header title="Talentika Community" right={<Btn full={false} h={36} onClick={() => setCompose(true)} style={{ fontSize: 12.5, borderRadius: 11 }}>+ Post</Btn>} />
      <Body top={14}>
        {challenge && (
          <div style={{ background: C.tintYellow, borderRadius: 22, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".6px", color: C.gold }}>WEEKLY CHALLENGE{daysLeft !== null ? ` · ${t(`${daysLeft} hari lagi`, `${daysLeft} days left`)}` : ""}</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700, fontFamily: F.display, lineHeight: 1.3 }}>{challenge.title}</div>
            {challenge.description && <div style={{ marginTop: 6, fontSize: 12.5, color: "#7A5200", lineHeight: 1.5 }}>{challenge.description}</div>}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 7 }}>
              {parts.map((p, i) => { const on = !!challenge.parts?.[p]; return (
                <div key={p} style={{ background: "#fff", borderRadius: 13, padding: "9px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: on ? C.green : "#fff", color: on ? "#fff" : C.gold, border: `1.5px solid ${C.yellow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{on ? "✓" : i + 1}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7A5200", textTransform: "capitalize" }}>{p}</span>
                </div>); })}
            </div>
            {gam && <div style={{ marginTop: 11, fontSize: 12, fontWeight: 700, color: C.gold }}>Earn: +{challenge.xp_reward ?? 0} XP · badge · portfolio evidence</div>}
            {challenge.mine && ["submitted", "completed"].includes(challenge.mine.status)
              ? <Btn kind="success" h={46} style={{ marginTop: 12 }} onClick={() => nav("/app/portfolio")}>{t("Sudah submit ✓", "Submitted ✓")}</Btn>
              : <Btn kind="orange" h={46} style={{ marginTop: 12 }} onClick={() => nav(`/app/challenge/${challenge.id}`)}>Submit Challenge</Btn>}
          </div>
        )}
        <HScroll gap={7}>
          <span onClick={() => setInterest(null)} style={{ flex: "none", fontSize: 12, fontWeight: 700, color: !interest ? "#fff" : C.blueDark, background: !interest ? C.blue : C.tintBlue, padding: "7px 12px", borderRadius: 99, cursor: "pointer" }}>{t("Semua", "All")}</span>
          {INTERESTS.map(n => <span key={n} onClick={() => setInterest(n)} style={{ flex: "none", fontSize: 12, fontWeight: 700, color: interest === n ? "#fff" : C.blueDark, background: interest === n ? C.blue : C.tintBlue, padding: "7px 12px", borderRadius: 99, cursor: "pointer" }}>{n}</span>)}
        </HScroll>
        <HScroll gap={6} bleed={false}>{FEED_TABS.map(([k, , en]) => <ChipBtn key={k} dark on={tab === k} onClick={() => setTab(k)} style={{ height: 34, padding: "0 13px" }}>{en}</ChipBtn>)}</HScroll>
        {isLoading && <Loading />}
        {!isLoading && !posts?.length && <Empty icon="💬" title={t("Belum ada postingan di sini", "No posts here yet")} body={t("Jadilah yang pertama berbagi project, prestasi, atau pertanyaan.", "Be the first to share a project, achievement or question.")} />}
        {posts?.map(p => {
          const [bg, fg] = avatarColors(p.author);
          return (
            <div key={p.id} style={{ background: "#fff", borderRadius: 18, padding: 16, boxShadow: "0 4px 14px rgba(11,29,58,.06)" }}>
              <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                <Avatar name={p.author} size={38} bg={bg} fg={fg} fontSize={14} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.author}</div><div style={{ fontSize: 11.5, color: C.faint }}>{timeAgo(p.created_at, lang)}{p.interest ? ` · ${p.interest}` : ""}</div></div>
                {p.author_id !== user!.id && <button onClick={() => follow(p)} style={{ border: `1.5px solid ${C.line}`, background: p.following ? C.tintBlue : "#fff", color: C.blue, fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 99, cursor: "pointer" }}>{p.following ? t("Mengikuti", "Following") : "Follow"}</button>}
                <button onClick={() => setMenu(p)} aria-label="Menu" style={{ border: "none", background: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>⋯</button>
              </div>
              <div style={{ marginTop: 11, fontSize: 13.5, lineHeight: 1.55, color: C.text2, whiteSpace: "pre-wrap" }}>{p.content}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 18, fontSize: 12.5, fontWeight: 600, color: C.muted }}>
                <span onClick={() => like(p)} style={{ cursor: "pointer", color: p.liked_by_me ? C.red : C.muted }}>♥ {p.likes}</span>
                <span onClick={() => openReplies(p)} style={{ cursor: "pointer" }}>💬 {p.replies}</span>
                <span onClick={() => share(p)} style={{ cursor: "pointer" }}>↗ Share</span>
              </div>
            </div>
          );
        })}
      </Body>
      <Sheet open={compose} onClose={() => setCompose(false)} title={t(`Post ke ${FEED_TABS.find(f => f[0] === tab)![2]}`, `Post to ${FEED_TABS.find(f => f[0] === tab)![2]}`)}>
        <TextArea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={t("Ceritakan project, prestasi, atau pertanyaanmu…", "Share your project, achievement or question…")} style={{ height: 120 }} />
        <div style={{ marginTop: 8, fontSize: 11.5, color: C.faint }}>{t("Postingan dicek otomatis. Jangan bagikan nomor HP, alamat, atau data pribadi.", "Posts are auto-checked. Don't share phone numbers, addresses or personal data.")}</div>
        <Btn disabled={text.trim().length < 5} onClick={post} style={{ marginTop: 10 }}>{t("Kirim", "Post")}</Btn>
      </Sheet>
      <Sheet open={!!replies} onClose={() => setReplies(null)} title={t("Balasan", "Replies")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {replies?.list.map((r: any) => <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 12, fontWeight: 700 }}>{r.author} <span style={{ color: C.faint, fontWeight: 500 }}>· {timeAgo(r.created_at, lang)}</span></div><div style={{ marginTop: 3, fontSize: 13, color: C.text2 }}>{r.content}</div></div>)}
          {!replies?.list.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada balasan.", "No replies yet.")}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}><Input value={reply} onChange={e => setReply(e.target.value)} placeholder={t("Tulis balasan…", "Write a reply…")} style={{ height: 44 }} /><Btn full={false} h={44} disabled={!reply.trim()} onClick={sendReply}>➤</Btn></div>
        </div>
      </Sheet>
      <Sheet open={!!menu} onClose={() => setMenu(null)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn kind="outline" onClick={() => report(menu)}>🚩 {t("Laporkan postingan", "Report post")}</Btn>
          {menu?.author_id !== user?.id && <Btn kind="outline" onClick={() => block(menu)} style={{ color: C.red }}>⛔ {t("Blokir pengguna", "Block user")}</Btn>}
        </div>
      </Sheet>
    </Screen>
  );
}

/* 67 CHALLENGE SUBMISSION (COM-03) */
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
  const defs: [string, string, string, string, string][] = [
    ["idea", "Idea", t("Ringkasan ide solusimu", "Summary of your solution idea"), "text", ""],
    ["prototype", "Prototype", t("Upload foto, video, atau link", "Upload a photo, video, or link"), "file", ""],
    ["presentation", "Presentation", t("Slide atau video pitch 2 menit", "Slides or a 2-minute pitch video"), "file", ""],
    ["reflection", "Reflection", t("Apa yang kamu pelajari?", "What did you learn?"), "text", ""],
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
    await afterAction(t("Challenge submitted", "Challenge submitted"));
  };
  return (
    <Screen>
      <Header title="Submit Challenge" sub={ch?.title} />
      <Body gap={12}>
        {!done ? (<>
          {defs.map(([k, label, desc, kind], i) => { const on = !!parts[k]; return (
            <Card key={k} pad={15} onClick={() => { setEdit(k); setVal(parts[k]?.startsWith("storage:") ? "" : parts[k] ?? ""); }} style={{ display: "flex", gap: 13, alignItems: "center" }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: on ? C.green : C.track, color: on ? "#fff" : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{on ? "✓" : i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 2, fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{on ? (parts[k].startsWith("storage:") ? t("File terlampir", "File attached") : parts[k]) : desc}</div></div>
              <Pill display fg={on ? C.green : C.blueDark} bg={on ? C.tintGreen : C.tintBlue} style={{ padding: "5px 10px" }}>{on ? t("Terlampir", "Attached") : t("Tambah", "Add")}</Pill>
            </Card>); })}
          <Btn kind={all ? "orange" : "disabled"} h={54} disabled={!all || busy} onClick={submit} style={{ marginTop: 4 }}>Submit</Btn>
          <p style={{ margin: 0, textAlign: "center", fontSize: 11.5, color: C.faint }}>{t("Lengkapi 4 bagian untuk submit · draf tersimpan otomatis", "Complete all 4 parts to submit · draft auto-saved")}</p>
        </>) : (
          <Card pad="28px 20px" style={{ textAlign: "center", animation: "tkPop .4s ease both" }}>
            <div style={{ fontSize: 44 }}>🌱</div>
            <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800 }}>{t("Submission terkirim!", "Submission sent!")}</div>
            <p style={{ margin: "8px auto 0", fontSize: 13.5, color: C.muted, lineHeight: 1.55, maxWidth: 260 }}>{t("Submission-mu sudah masuk Portfolio sebagai evidence.", "Your submission is now evidence in your Portfolio.")}</p>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {gam && <Pill display size={12} fg={C.gold} bg={C.tintYellow}>+{ch?.xp_reward ?? 0} XP</Pill>}
              <Pill display size={12} fg={C.blueDark} bg={C.tintBlue}>Portfolio evidence</Pill>
            </div>
            <Btn h={48} onClick={() => nav("/app/portfolio")} style={{ marginTop: 18 }}>{t("Lihat di Portfolio", "See in Portfolio")}</Btn>
          </Card>
        )}
      </Body>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={defs.find(d => d[0] === edit)?.[1]}>
        {edit && defs.find(d => d[0] === edit)![3] === "file" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ height: 48, border: `1.5px dashed ${C.disabled}`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.muted, cursor: "pointer" }}>
              + {t("Upload file", "Upload a file")}<input type="file" hidden accept="image/*,video/*,.pdf" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </label>
            <div style={{ textAlign: "center", fontSize: 12, color: C.faint }}>{t("atau tempel link", "or paste a link")}</div>
            <Input placeholder="https://…" value={val} onChange={e => setVal(e.target.value)} />
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
