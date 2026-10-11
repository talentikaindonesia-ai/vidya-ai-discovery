import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, errMsg, useApp, useCareers } from "../store";
import { Avatar, Btn, Card, ChipBtn, Empty, Icon, Input, Label, Loading, Note, Ring, Screen, Sheet, TextArea, TIKA } from "../ui";
import { C, SH, avatarColors, daysUntil, deadlineColor } from "../theme";
import { AXES, dnaTitle, fmtDate, rankAxes } from "../logic";
import authSchool from "../assets/auth-school.webp";
import { keluar } from "../push";

export default function Roles({ screen }: { screen: "parent" | "mentor" | "school" }) {
  if (screen === "mentor") return <MentorDash />;
  if (screen === "school") return <SchoolDash />;
  return <ParentDash />;
}

function TopBar({ avatar, kicker, kickerColor = C.blue, title, extra }: { avatar: React.ReactNode; kicker: string; kickerColor?: string; title: string; extra?: React.ReactNode }) {
  const nav = useNavigate();
  const { t } = useApp();
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: kickerColor, textTransform: "uppercase" }}>{kicker}</div><div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.2px" }}>{title}</div></div>
      {extra}
      <button onClick={async () => { await keluar(); nav("/app", { replace: true }); }} aria-label={t("Keluar", "Sign out")} style={{ width: 42, height: 42, border: "none", background: "#fff", boxShadow: "0 2px 10px rgba(15,23,42,.08)", borderRadius: "50%", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="logout" size={18} /></button>
    </div>
  );
}
const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
const H = ({ children, mt = 18 }: { children: React.ReactNode; mt?: number }) => <div style={{ fontSize: 15, fontWeight: 700, marginTop: mt }}>{children}</div>;
const Locked = ({ t }: { t: (a: string, b: string) => string }) => <div style={{ ...card, padding: "12px 14px", marginTop: 9, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.faint }}><Icon name="lock" size={14} />{t("Tidak dibagikan oleh anak", "Not shared by your child")}</div>;

/* ── PARENT VIEW ────────────────────────────────────────────────────── */
function ParentDash() {
  const qc = useQueryClient();
  const { t, lang, profile, user, toast } = useApp();
  const { careers } = useCareers();
  const [child, setChild] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: kids, isLoading } = useQuery({ queryKey: ["m-kids", user?.id], enabled: !!user, queryFn: async () => ((await db.rpc("anak_saya")).data ?? []) as any[] });
  const cur = child ?? kids?.[0]?.student_user_id ?? null;
  const { data: s } = useQuery({ queryKey: ["m-kid", cur], enabled: !!cur, queryFn: async () => (await db.rpc("ringkasan_anak", { p_student: cur })).data });
  const link = async () => {
    const { data, error } = await db.rpc("hubungkan_anak", { p_code: code.trim() });
    if (error) { toast(errMsg(error), "error"); return; }
    setCode(""); setAddOpen(false); setChild(data.student_user_id);
    qc.invalidateQueries({ queryKey: ["m-kids"] });
    toast(t(`Terhubung dengan ${data.name ?? "anakmu"} — persetujuan tercatat`, `Linked with ${data.name ?? "your child"} — consent recorded`));
  };
  const first = (profile?.full_name || "").split(" ")[0];
  const sh = s?.shared ?? {};
  const career = careers.find(c => c.id === s?.career_target);
  const top = rankAxes(s?.axes)[0];
  const kidFirst = s?.name?.split(" ")[0] ?? t("anak", "your child");
  const opps = (s?.opportunities ?? []) as any[];
  const achs = (s?.achievements ?? []) as any[];
  const nextOpp = opps.filter(o => (daysUntil(o.deadline) ?? -1) >= 0).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))[0];
  const tip = sh.opps && nextOpp
    ? t(`Tanyakan ke ${kidFirst} persiapan untuk “${nextOpp.title}”. Membicarakannya bersama membangun rasa percaya diri sebelum tenggat.`, `Ask ${kidFirst} how they're preparing for “${nextOpp.title}”. Talking it through builds confidence before the deadline.`)
    : sh.proj && (s?.projects ?? 0) > 0 ? t(`Minta ${kidFirst} menunjukkan proyeknya. Bercerita tentang karya sendiri melatih kemampuan presentasi.`, `Ask ${kidFirst} to show you their project. Explaining their own work builds presentation skills.`)
    : t(`Tanyakan apa yang paling ${kidFirst} sukai minggu ini — dukungan sederhana sangat berarti.`, `Ask what ${kidFirst} enjoyed most this week — simple support goes a long way.`);
  const linkForm = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Label>{t("Kode undangan dari anak", "Invite code from your child")}</Label>
      <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" autoCapitalize="characters" style={{ letterSpacing: 3, fontWeight: 700 }} />
      <Btn disabled={code.trim().length < 6} onClick={link}>{t("Hubungkan & setujui", "Link & give consent")}</Btn>
      <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>{t("Dengan menghubungkan, Anda menyetujui anak menggunakan Talentika sesuai Kebijakan Privasi (UU PDP No. 27/2022).", "By linking, you consent to your child using Talentika under our Privacy Policy (Indonesia PDP Law No. 27/2022).")}</div>
    </div>
  );
  return (
    <Screen bg="#FFFBF0">
      <TopBar avatar={<Avatar name={profile?.full_name} size={44} bg={C.tintYellow} fg={C.amber} fontSize={16} />} kicker={t("Tampilan orang tua", "Parent view")} kickerColor={C.amber} title={`${t("Halo", "Hi")}, ${first || t("Ayah/Bunda", "there")}`} />
      <div style={{ padding: "14px 20px 0" }}>
        {isLoading && <Loading />}
        {!isLoading && !kids?.length && <Card><div style={{ fontSize: 15, fontWeight: 700 }}>{t("Hubungkan akun anak", "Link your child's account")}</div><p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{t("Minta anak membuka Talentika → Profil → Keluarga & Sekolah → Undang orang tua, lalu masukkan kodenya di sini.", "Ask your child to open Talentika → Profile → Family & School → Invite parent, then enter the code here.")}</p>{linkForm}</Card>}
        {(kids?.length ?? 0) > 0 && (
          <div style={{ display: "flex", gap: 7, overflowX: "auto" }}>
            {kids!.map(k => <ChipBtn key={k.student_user_id} on={k.student_user_id === cur} onClick={() => setChild(k.student_user_id)}>{k.name}</ChipBtn>)}
            <ChipBtn onClick={() => setAddOpen(true)}>+ {t("Anak lain", "Another child")}</ChipBtn>
          </div>
        )}
        {s && (<>
          <div style={{ ...card, borderRadius: 22, padding: 16, marginTop: 12, display: "flex", gap: 13, alignItems: "center" }}>
            <Avatar name={s.name} size={58} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{[s.kelas && `${t("Kelas", "Grade")} ${s.kelas}`, s.school_name].filter(Boolean).join(" · ") || (career ? career.name : "")}</div>
              {sh.dna && s.axes && <div style={{ fontSize: 11.5, fontWeight: 600, color: C.purple, marginTop: 3 }}>{dnaTitle(s.axes, 4)}</div>}
            </div>
            <Ring value={s.readiness ?? 0} size={62} stroke={7}><span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{s.readiness ?? "–"}</span><span style={{ fontSize: 8, color: C.faint }}>READY</span></Ring>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 12 }}>
            {[[sh.learn ? s.learning_active ?? 0 : "—", t("Materi aktif", "Active courses"), t("sedang dipelajari", "in progress")], [sh.proj ? s.projects ?? 0 : "—", t("Proyek", "Projects"), t("bukti nyata", "real evidence")],
              [sh.ach ? achs.length : "—", t("Prestasi", "Achievements"), t("tercatat", "logged")], [sh.opps ? opps.length : "—", t("Peluang", "Opportunities"), t("sedang diikuti", "in progress")]].map(([v, l, sub]) => (
              <div key={l as string} style={{ ...card, borderRadius: 16, padding: 13 }}><div style={{ fontSize: 11, color: C.muted }}>{l}</div><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 11, color: C.muted }}>{sub}</div></div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>{t("Career Readiness adalah indikator progres, bukan prediksi.", "Career Readiness is a progress indicator, not a prediction.")}{career ? ` · ${t("Minat", "Interest")}: ${career.name}` : sh.dna && top ? ` · ${AXES.find(a => a.key === top)![lang === "en" ? "name" : "nameId"]}` : ""}</div>

          <H>{t("Akan datang", "Coming up")}</H>
          {sh.opps ? (opps.length ? opps.slice(0, 4).map((o, i) => { const d = daysUntil(o.deadline); const dc = deadlineColor(d); return (
            <div key={i} style={{ ...card, borderRadius: 16, padding: "12px 14px", marginTop: 9, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="cal" size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.title}</div><div style={{ fontSize: 11.5, color: C.muted }}>{o.deadline ? `Deadline ${fmtDate(o.deadline, lang)}` : t("Tanpa tenggat", "No deadline")}</div></div>
              <span style={{ fontSize: 11, fontWeight: 600, color: dc.c, flex: "none" }}>{d === null ? "—" : d < 0 ? t("lewat", "passed") : t(`${d} hari`, `${d}d`)}</span>
            </div>); }) : <div style={{ ...card, padding: "12px 14px", marginTop: 9, fontSize: 12.5, color: C.muted }}>{t("Belum ada.", "None yet.")}</div>) : <Locked t={t} />}

          <H>{t("Prestasi terbaru", "Recent achievements")}</H>
          {sh.ach ? (achs.length ? achs.slice(0, 3).map((a, i) => (
            <div key={i} style={{ ...card, borderRadius: 16, padding: "12px 14px", marginTop: 9, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flex: "none" }}>{a.medal}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.title} · {a.event}</div><div style={{ fontSize: 11.5, color: C.muted }}>{a.year}{a.verified ? ` · ${t("Terverifikasi", "Verified")}` : ""}</div></div>
            </div>)) : <div style={{ ...card, padding: "12px 14px", marginTop: 9, fontSize: 12.5, color: C.muted }}>{t("Belum ada.", "None yet.")}</div>) : <Locked t={t} />}

          <div style={{ marginTop: 14, background: C.navy, borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <img src={TIKA} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
            <div><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t(`CARA MENDUKUNG ${kidFirst.toUpperCase()}`, `HOW TO SUPPORT ${kidFirst.toUpperCase()}`)}</div><div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,.9)", marginTop: 3 }}>{tip}</div></div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 9, alignItems: "center", fontSize: 11.5, color: C.muted }}><Icon name="lock" size={15} />{t(`Chat AI dan refleksi ${kidFirst} tetap privat.`, `${kidFirst}'s AI chats and reflections stay private.`)}</div>
        </>)}
      </div>
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={t("Hubungkan anak lain", "Link another child")}>{linkForm}</Sheet>
    </Screen>
  );
}

/* ── MENTOR DASHBOARD ───────────────────────────────────────────────── */
function MentorDash() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, profile, user, toast, updatePrefs } = useApp();
  const [slotAt, setSlotAt] = useState("");
  const [apply, setApply] = useState({ name: profile?.full_name ?? "", title: "", company: "", bio: "", expertise: "", exp: "", industry: "", languages: "Bahasa Indonesia", price: "" });
  const { data: st, isLoading } = useQuery({ queryKey: ["m-mentor-stats", user?.id], enabled: !!user, queryFn: async () => (await db.rpc("statistik_mentor_saya")).data });
  const { data: reqs } = useQuery({ queryKey: ["m-mentor-reqs", user?.id], enabled: !!st, queryFn: async () => ((await db.rpc("permintaan_mentor_saya")).data ?? []) as any[] });
  const { data: slots } = useQuery({ queryKey: ["m-mentor-slots", st?.mentor_id], enabled: !!st, queryFn: async () => ((await db.from("mentor_slots").select("*").eq("mentor_id", st.mentor_id).gt("starts_at", new Date().toISOString()).order("starts_at")).data ?? []) as any[] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["m-mentor-reqs"] }); qc.invalidateQueries({ queryKey: ["m-mentor-stats"] }); qc.invalidateQueries({ queryKey: ["m-mentor-slots"] }); };
  const respond = async (id: string, action: "confirm" | "decline") => { const { error } = await db.rpc("respond_mentor_booking", { p_booking_id: id, p_action: action }); if (error) toast(errMsg(error), "error"); refresh(); };
  const complete = async (id: string) => { const { error } = await db.rpc("complete_mentor_booking", { p_booking_id: id }); if (error) toast(errMsg(error), "error"); refresh(); };
  const addSlot = async () => {
    const d = new Date(slotAt);
    if (isNaN(+d) || +d < Date.now() + 3 * 3600000) { toast(t("Pilih waktu minimal 3 jam dari sekarang", "Pick a time at least 3 hours from now"), "error"); return; }
    const { error } = await db.from("mentor_slots").insert({ mentor_id: st.mentor_id, starts_at: d.toISOString(), duration_minutes: 30 });
    if (error) { toast(errMsg(error), "error"); return; }
    setSlotAt(""); refresh();
  };
  const submitApply = async () => {
    const { data, error } = await db.rpc("apply_as_mentor", { p_name: apply.name.trim(), p_title: apply.title.trim(), p_bio: apply.bio.trim(), p_expertise: apply.expertise.split(",").map(s => s.trim()).filter(Boolean), p_experience: parseInt(apply.exp) || 0 });
    if (error) { toast(errMsg(error), "error"); return; }
    await db.from("mentors").update({ company: apply.company.trim() || null, industry: apply.industry.trim() || null, languages: apply.languages.split(",").map(s => s.trim()).filter(Boolean), price_per_session: parseInt(apply.price) || null }).eq("id", data.id);
    toast(t("Pendaftaran mentor terkirim — tim kami akan memverifikasi profilmu", "Mentor application sent — our team will verify your profile"));
    refresh();
  };
  if (isLoading) return <Loading />;
  const [bg, fg] = avatarColors(profile?.full_name ?? "M");
  const first = (profile?.full_name || "").split(" ")[0];
  const fmt = (s: string) => new Date(s).toLocaleString(lang === "en" ? "en-GB" : "id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  const switchStudent = profile?.role === "student" ? <button onClick={async () => { await updatePrefs({ mode: "student" }); nav(profile?.onboarding_done ? "/app/home" : "/app/role"); }} style={{ border: "none", background: C.tintBlue, borderRadius: 99, fontSize: 12, fontWeight: 600, color: C.blue, padding: "9px 12px", cursor: "pointer", flex: "none" }}>{t("Mode siswa", "Student")}</button> : null;

  if (!st) return (
    <Screen>
      <TopBar avatar={<Avatar name={profile?.full_name} size={44} bg={bg} fg={fg} fontSize={16} />} kicker="Mentor" kickerColor={C.purple} title={t("Jadi mentor Talentika", "Become a Talentika mentor")} extra={switchStudent} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <Note icon="shield">{t("Mentor diverifikasi tim Talentika sebelum tampil ke siswa. Sesi untuk siswa di bawah 18 tahun direkam dengan persetujuan atau dalam format grup.", "Mentors are verified by the Talentika team before appearing to students. Sessions with under-18s are recorded with consent or held as groups.")}</Note>
        <Input placeholder={t("Nama lengkap", "Full name")} value={apply.name} onChange={e => setApply({ ...apply, name: e.target.value })} />
        <Input placeholder={t("Peran · AI Product Manager", "Role · AI Product Manager")} value={apply.title} onChange={e => setApply({ ...apply, title: e.target.value })} />
        <Input placeholder={t("Perusahaan · Google", "Company · Google")} value={apply.company} onChange={e => setApply({ ...apply, company: e.target.value })} />
        <Input placeholder={t("Industri · Technology", "Industry · Technology")} value={apply.industry} onChange={e => setApply({ ...apply, industry: e.target.value })} />
        <Input placeholder={t("Keahlian (pisahkan koma)", "Expertise (comma-separated)")} value={apply.expertise} onChange={e => setApply({ ...apply, expertise: e.target.value })} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input inputMode="numeric" placeholder={t("Pengalaman (thn)", "Experience (yrs)")} value={apply.exp} onChange={e => setApply({ ...apply, exp: e.target.value.replace(/\D/g, "") })} />
          <Input inputMode="numeric" placeholder={t("Tarif/sesi (Rp)", "Rate/session (Rp)")} value={apply.price} onChange={e => setApply({ ...apply, price: e.target.value.replace(/\D/g, "") })} />
        </div>
        <Input placeholder={t("Bahasa · Bahasa Indonesia, English", "Languages · Bahasa Indonesia, English")} value={apply.languages} onChange={e => setApply({ ...apply, languages: e.target.value })} />
        <TextArea placeholder={t("Tentang kamu & perjalanan kariermu", "About you & your career journey")} value={apply.bio} onChange={e => setApply({ ...apply, bio: e.target.value })} />
        <Btn disabled={!apply.name.trim() || !apply.title.trim()} onClick={submitApply}>{t("Kirim pendaftaran", "Submit application")}</Btn>
      </div>
    </Screen>
  );

  const pending = (reqs ?? []).filter(r => r.status === "pending");
  const upcoming = (reqs ?? []).filter(r => r.status === "confirmed");
  return (
    <Screen>
      <TopBar avatar={<Avatar name={st.name} size={44} bg={bg} fg={fg} fontSize={16} />} kicker={`Mentor · ${st.title}`} kickerColor={C.purple} title={`${t("Halo", "Hi")}, ${first || st.name}`} extra={switchStudent} />
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {!st.is_available && <Note tone="yellow" icon="clock">{t("Profilmu sedang diverifikasi. Kamu bisa menyiapkan jadwal sekarang; profil tampil ke siswa setelah disetujui.", "Your profile is under review. You can set up slots now; it becomes visible once approved.")}</Note>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
          {[[st.sessions ?? 0, C.blue, t("Sesi", "Sessions"), "cal"], [st.rating ?? "–", C.amber, "Rating", "star"], [st.students ?? 0, C.green, t("Siswa", "Students"), "users"]].map(([v, c, l, ic]) => (
            <div key={l as string} style={{ ...card, borderRadius: 16, padding: 12 }}><span style={{ color: c as string, display: "flex" }}><Icon name={ic as string} size={18} /></span><div style={{ fontSize: 19, fontWeight: 700, marginTop: 6 }}>{v}</div><div style={{ fontSize: 11, color: C.muted }}>{l}</div></div>
          ))}
        </div>
        <H mt={4}>{t("Permintaan mentoring", "Mentoring requests")}</H>
        {!pending.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada permintaan baru. Tambahkan jadwal kosong di bawah.", "No new requests. Add open slots below.")}</div>}
        {pending.map(r => {
          const [b2, f2] = avatarColors(r.student_name ?? "S");
          return (
            <div key={r.id} style={{ ...card, borderRadius: 20, padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar name={r.student_name} size={42} bg={b2} fg={f2} fontSize={14} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{r.student_name ?? t("Siswa", "Student")}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{r.topic}{r.student_kelas ? ` · ${t("kelas", "grade")} ${r.student_kelas}` : ""}</div></div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: C.text2, lineHeight: 1.6, background: C.bg, borderRadius: 12, padding: "8px 11px" }}>
                {r.student_axes && <><b>Talent DNA:</b> {dnaTitle(r.student_axes, 4)}<br /></>}
                <b>{t("Jadwal", "Schedule")}:</b> {fmt(r.session_date)} WIB
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => respond(r.id, "decline")} style={{ flex: 1, height: 42, border: `1.5px solid ${C.line}`, borderRadius: 13, background: "#fff", color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Tolak", "Decline")}</button>
                <button onClick={() => respond(r.id, "confirm")} style={{ flex: 1.5, height: 42, border: "none", borderRadius: 13, background: C.blue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("Terima", "Accept")}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: C.faint }}>{t("Mohon respons dalam 48 jam.", "Please respond within 48 hours.")}</div>
            </div>
          );
        })}
        {upcoming.length > 0 && (
          <div style={{ ...card, padding: "12px 14px" }}>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Sesi terjadwal", "Scheduled sessions")}</div>
            {upcoming.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < upcoming.length - 1 ? `1px solid ${C.track}` : "none" }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.student_name}</div><div style={{ fontSize: 11.5, color: C.faint }}>{fmt(r.session_date)} WIB · {r.topic}</div></div>
                {+new Date(r.session_date) < Date.now() && <button onClick={() => complete(r.id)} style={{ border: "none", background: C.tintGreen, color: C.green, borderRadius: 99, fontSize: 11.5, fontWeight: 600, padding: "6px 10px", cursor: "pointer" }}>{t("Selesai", "Done")}</button>}
              </div>
            ))}
          </div>
        )}
        <div style={{ ...card, padding: "12px 14px" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Jadwal kosong", "Open slots")}</div>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {(slots ?? []).map(s => (
              <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: s.booking_id ? C.green : C.blue, background: s.booking_id ? C.tintGreen : C.tintBlue, padding: "6px 10px", borderRadius: 99 }}>
                {fmt(s.starts_at)}{!s.booking_id && <button onClick={async () => { await db.from("mentor_slots").delete().eq("id", s.id); refresh(); }} aria-label={t("Hapus", "Delete")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: C.faint, display: "flex" }}><Icon name="x" size={12} /></button>}
              </span>
            ))}
            {!(slots ?? []).length && <span style={{ fontSize: 13, color: C.muted }}>{t("Belum ada.", "None yet.")}</span>}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Input type="datetime-local" value={slotAt} onChange={e => setSlotAt(e.target.value)} style={{ height: 44 }} />
            <Btn full={false} h={44} disabled={!slotAt} onClick={addSlot}><Icon name="plus" size={18} /></Btn>
          </div>
        </div>
        <Note>{t("Ringkasan & pembayaran honor dikelola di web pada V1.", "Payout summaries are handled on the web in V1.")}</Note>
      </div>
    </Screen>
  );
}

/* ── TALENTIKA FOR SCHOOL (teacher view, baca saja) ─────────────────── */
const RIASEC_LABEL: Record<string, [string, string]> = { realistic: ["Teknik & praktik", "Engineering & hands-on"], investigative: ["Sains & riset", "Science & research"], artistic: ["Desain & media", "Design & media"], social: ["Pendidikan & sosial", "Education & social"], enterprising: ["Bisnis & startup", "Business & startups"], conventional: ["Administrasi & data", "Admin & data"] };
function SchoolDash() {
  const { t, lang: lng, profile, toast } = useApp();
  const code = profile?.school_code ?? "";
  const [sent, setSent] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["m-school", code], enabled: !!code, queryFn: async () => { const r = await db.rpc("school_mobile_insights", { p_code: code }); if (r.error) throw r.error; return r.data; } });
  const { data: riasec } = useQuery({ queryKey: ["m-school-riasec", code], enabled: !!code, queryFn: async () => ((await db.rpc("school_riasec_distribution", { p_code: code })).data ?? []) as any[] });
  const remind = async () => {
    const { data: r, error: e } = await db.rpc("send_school_announcement", { p_code: code, p_title: "Yuk lengkapi Talent DNA-mu", p_body: "Buka Talentika dan selesaikan modul Talent DNA untuk melihat karier & peluang yang cocok.", p_target: "", p_priority: "normal" });
    if (e) { toast(errMsg(e), "error"); return; }
    setSent(r.recipient_count);
    toast(t(`Pengingat terkirim ke ${r.recipient_count} siswa`, `Reminder sent to ${r.recipient_count} students`));
  };
  const top = (data?.talent_map ?? []) as { k: string; n: number }[];
  const max = Math.max(1, ...top.map(x => x.n));
  const ARCH: Record<string, string> = { technology: "Technology Builder", creative: "Creative Problem Solver", leadership: "Future Entrepreneur", analytical: "Young Researcher", communication: "Social Connector" };
  const trend = (data?.trend ?? []) as { m: string; v: number }[];
  const dnaPct = data?.students ? Math.round((data.dna_done / data.students) * 100) : 0;
  return (
    <Screen>
      <TopBar avatar={<img src={authSchool} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flex: "none" }} />} kicker="Talentika for School" kickerColor={C.green}
        title={`${((profile as any)?.pic_name ?? profile?.full_name ?? "").split(" ")[0] || t("Bu/Pak", "Teacher")} · ${t("Guru BK", "Counselor")}`} />
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {!code && <Empty icon="school" title={t("Akun ini belum terhubung ke sekolah", "This account isn't linked to a school")} body={t("Dashboard sekolah memakai akun sekolah terverifikasi.", "The school dashboard uses a verified school account.")} action={<Btn h={44} onClick={() => { window.location.href = "/for-schools"; }}>{t("Daftarkan sekolah", "Register school")}</Btn>} />}
        {isLoading && <Loading />}
        {error && <Note tone="yellow">{t("Akun sekolah belum terverifikasi atau tidak berwenang.", "School account not verified or not authorized.")}</Note>}
        {data && (<>
          <div style={{ background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 22, padding: 16, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div><div style={{ fontSize: 12, opacity: .85 }}>{t("Siswa terdaftar", "Enrolled students")}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{data.students} {t("siswa", "students")}</div></div>
              {profile?.school_name && <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 10px", borderRadius: 99, maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.school_name}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 14 }}><span>{t("Talent Discovery selesai", "Talent Discovery completed")}</span><span style={{ fontWeight: 700 }}>{data.dna_done} / {data.students}</span></div>
            <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,.25)", marginTop: 6 }}><div style={{ width: `${dnaPct}%`, height: "100%", borderRadius: 99, background: C.yellow }} /></div>
            <div style={{ fontSize: 11.5, opacity: .85, marginTop: 8 }}>{data.applications} {t("aplikasi peluang dari siswa", "opportunity applications by students")}</div>
          </div>

          <div style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t("Kirim aktivitas ke siswa", "Send an activity to students")}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, background: C.bg, borderRadius: 13, padding: "10px 12px" }}>
              <span style={{ color: C.blue, display: "flex" }}><Icon name="file" size={18} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t("Lengkapi Talent DNA", "Complete Talent DNA")}</div><div style={{ fontSize: 11, color: C.muted }}>{t("Pengumuman ke semua siswa · ~15 menit", "Announcement to all students · ~15 min")}</div></div>
            </div>
            {sent === null ? <Btn h={44} onClick={remind} style={{ marginTop: 10, fontSize: 13 }}>{t("Kirim ke siswa", "Send to students")}</Btn>
              : <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: C.green }}><Icon name="check" size={15} />{t(`Terkirim ke ${sent} siswa`, `Sent to ${sent} students`)}</div>}
          </div>

          <H mt={4}>{t("Perlu perhatian", "Needs attention")}</H>
          {(data.attention ?? []).map((a: any, i: number) => {
            const red = a.reason === "deadline";
            return (
              <div key={i} style={{ ...card, borderRadius: 16, padding: "11px 13px", display: "flex", gap: 11, alignItems: "center" }}>
                <Avatar name={a.name} size={36} bg={red ? C.tintRed : C.tintYellow} fg={red ? C.red : C.amber} fontSize={12} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}{a.kelas && <span style={{ color: C.faint, fontWeight: 500 }}> · {a.kelas}</span>}</div><div style={{ fontSize: 11.5, color: red ? C.red : C.muted }}>{red ? t(`Deadline ≤3 hari: ${a.item}`, `Deadline ≤3 days: ${a.item}`) : t("Belum mengikuti Talent Discovery", "Hasn't started Talent Discovery")}</div></div>
              </div>
            );
          })}
          {!(data.attention ?? []).length && <div style={{ ...card, padding: "12px 14px", fontSize: 12.5, color: C.muted }}>{t("Tidak ada siswa yang perlu perhatian khusus.", "No students need special attention.")}</div>}

          {(riasec?.length ?? 0) > 0 && <>
            <H mt={4}>{t("Minat teratas di sekolah", "Top interests at school")}</H>
            <div style={{ ...card, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11 }}>
              {riasec!.slice(0, 5).map((r, i) => (
                <div key={r.riasec_type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 118, fontSize: 12, fontWeight: 500, flex: "none" }}>{RIASEC_LABEL[r.riasec_type] ? (lng === "en" ? RIASEC_LABEL[r.riasec_type][1] : RIASEC_LABEL[r.riasec_type][0]) : r.riasec_type}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 99, background: C.track }}><div style={{ width: `${r.pct}%`, height: "100%", borderRadius: 99, background: [C.blue, C.purple, C.orange, C.green, C.sky][i % 5] }} /></div>
                  <span style={{ width: 32, textAlign: "right", fontSize: 11.5, fontWeight: 600, color: C.muted, flex: "none" }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </>}

          <H mt={4}>Talent Map</H>
          <div style={{ ...card, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {top.map((s, i) => <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 130, fontSize: 12, fontWeight: 500, flex: "none" }}>{ARCH[s.k] ?? s.k}</span><div style={{ flex: 1, height: 8, borderRadius: 99, background: C.track }}><div style={{ width: `${(s.n / max) * 100}%`, height: "100%", borderRadius: 99, background: [C.blue, C.orange, C.amber, C.purple, C.green][i % 5] }} /></div><span style={{ width: 32, textAlign: "right", fontSize: 11.5, fontWeight: 600, color: C.muted, flex: "none" }}>{data.dna_done ? Math.round((s.n / data.dna_done) * 100) : 0}%</span></div>)}
            {!top.length && <div style={{ fontSize: 12.5, color: C.muted }}>{t("Belum ada data Talent DNA.", "No Talent DNA data yet.")}</div>}
          </div>

          <div style={{ ...card, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Career Readiness rata-rata", "Average Career Readiness")}</div>
              {trend.length > 1 && <span style={{ fontSize: 11.5, fontWeight: 600, color: C.green }}>{trend[trend.length - 1].v - trend[0].v >= 0 ? "+" : ""}{trend[trend.length - 1].v - trend[0].v} {t("sejak", "since")} {trend[0].m}</span>}
            </div>
            {trend.length ? (
              <div style={{ marginTop: 14, height: 100, display: "flex", alignItems: "flex-end", gap: 10 }}>
                {trend.map((x, i) => <div key={x.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}><span style={{ fontSize: 10, color: C.muted }}>{x.v}</span><div style={{ width: "100%", height: Math.max(6, Math.round(x.v * 0.7)), borderRadius: 8, background: i === trend.length - 1 ? C.blue : "#CFE3FF" }} /><span style={{ fontSize: 10, color: C.faint }}>{x.m}</span></div>)}
              </div>
            ) : <div style={{ marginTop: 8, fontSize: 12.5, color: C.muted }}>{t("Tren muncul setelah siswa memakai aplikasi.", "The trend appears once students use the app.")}</div>}
          </div>
          <Note onClick={() => { window.location.href = "/school-dashboard"; }}>{t("Konsol lengkap (data siswa, laporan, pengumuman) tersedia di web →", "The full console (students, reports, announcements) is on the web →")}</Note>
        </>)}
      </div>
    </Screen>
  );
}
