import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db, errMsg, useApp, useCareers } from "../store";
import { Avatar, Body, Btn, Card, CardTitle, ChipBtn, Empty, HScroll, Input, Kicker, Label, Loading, Note, Pill, Ring, Row, Screen, Sheet, TextArea } from "../ui";
import { C, F, SH, avatarColors, daysUntil, deadlineColor } from "../theme";
import { archetypes, AXES, dnaTitle, fmtDate, rankAxes } from "../logic";
import authSchool from "../assets/auth-school.webp";
import { keluar } from "../push";

export default function Roles({ screen }: { screen: "parent" | "mentor" | "school" }) {
  if (screen === "mentor") return <MentorDash />;
  if (screen === "school") return <SchoolDash />;
  return <ParentDash />;
}

function TopBar({ avatar, kicker, title, extra }: { avatar: React.ReactNode; kicker: string; title: string; extra?: React.ReactNode }) {
  const nav = useNavigate();
  const { t } = useApp();
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{kicker}</div><div style={{ fontSize: 19, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px" }}>{title}</div></div>
      {extra}
      <button onClick={async () => { await keluar(); nav("/app", { replace: true }); }} style={{ border: "none", background: "#fff", boxShadow: SH.btn, borderRadius: 11, fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: C.muted, padding: "9px 12px", cursor: "pointer" }}>{t("Keluar", "Sign out")}</button>
    </div>
  );
}

/* 80 PARENT DASHBOARD (ROL-01, AUTH-07) */
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
  const linkForm = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Label>{t("Kode undangan dari anak", "Invite code from your child")}</Label>
      <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="AB12CD34" autoCapitalize="characters" style={{ letterSpacing: 3, fontWeight: 700 }} />
      <Btn disabled={code.trim().length < 6} onClick={link}>{t("Hubungkan & setujui", "Link & give consent")}</Btn>
      <div style={{ fontSize: 11.5, color: C.faint, lineHeight: 1.5 }}>{t("Dengan menghubungkan, Anda menyetujui anak menggunakan Talentika sesuai Kebijakan Privasi (UU PDP No. 27/2022).", "By linking, you consent to your child using Talentika under our Privacy Policy (Indonesia PDP Law No. 27/2022).")}</div>
    </div>
  );
  return (
    <Screen>
      <TopBar avatar={<Avatar name={profile?.full_name} size={44} radius={14} bg={C.tintOrange} fg={C.orangeDark} fontSize={18} />} kicker="Parent view" title={`${t("Halo", "Hi")}, ${first || t("Ayah/Bunda", "there")} 👋`} />
      <Body>
        {isLoading && <Loading />}
        {!isLoading && !kids?.length && <Card><CardTitle>{t("Hubungkan akun anak", "Link your child's account")}</CardTitle><p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{t("Minta anak membuka Talentika → Privacy & Sharing → Undang orang tua, lalu masukkan kodenya di sini.", "Ask your child to open Talentika → Privacy & Sharing → Invite parent, then enter the code here.")}</p>{linkForm}</Card>}
        {(kids?.length ?? 0) > 0 && (
          <HScroll gap={7}>
            {kids!.map(k => <ChipBtn key={k.student_user_id} on={k.student_user_id === cur} onClick={() => setChild(k.student_user_id)}>{k.name}</ChipBtn>)}
            <ChipBtn onClick={() => setAddOpen(true)}>+ {t("Anak lain", "Another child")}</ChipBtn>
          </HScroll>
        )}
        {s && (<>
          <Card radius={22}>
            <Kicker>Child progress · {s.name}</Kicker>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <Ring value={s.readiness ?? 0}><span style={{ fontSize: 22, fontWeight: 800 }}>{s.readiness ?? "–"}</span></Ring>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Career Readiness</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: C.muted }}>{t("Minat saat ini", "Current interest")}</div>
                <div style={{ marginTop: 2, fontSize: 15, fontWeight: 800 }}>{career?.name ?? (sh.dna && top ? AXES.find(a => a.key === top)![lang === "en" ? "name" : "nameId"] : t("Belum ditentukan", "Not set yet"))}</div>
                {sh.dna && s.axes && <div style={{ marginTop: 4, fontSize: 11.5, color: C.blue, fontWeight: 700 }}>🧬 {dnaTitle(s.axes, 4)}</div>}
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.faint }}>{t("Skor adalah indikator progres, bukan prediksi.", "The score is a progress indicator, not a prediction.")}</div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {[[sh.learn ? s.learning_active ?? 0 : "—", C.blue, t("Materi aktif", "Active learning")], [sh.proj ? s.projects ?? 0 : "—", C.orange, "Projects"], [sh.ach ? (s.achievements ?? []).length : "—", C.gold, "Achievements"], [sh.opps ? (s.opportunities ?? []).length : "—", C.green, t("Peluang berjalan", "Opportunities")]].map(([v, c, l]) => (
              <div key={l as string} style={{ background: "#fff", borderRadius: 18, padding: 15, boxShadow: SH.cardSm }}><div style={{ fontSize: 24, fontWeight: 700, fontFamily: F.display, color: c as string }}>{v}</div><div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{l}</div></div>
            ))}
          </div>
          <Card>
            <CardTitle>{t("Peluang & deadline", "Upcoming opportunities")}</CardTitle>
            {sh.opps ? ((s.opportunities ?? []).slice(0, 5).map((o: any, i: number, a: any[]) => { const d = daysUntil(o.deadline); const dc = deadlineColor(d); return (
              <Row key={i} last={i === a.length - 1}><span style={{ width: 9, height: 9, borderRadius: "50%", background: dc.c, flex: "none" }} /><span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{o.title}</span><span style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, color: dc.c, flex: "none" }}>{d === null ? "—" : d < 0 ? t("lewat", "passed") : t(`${d} hari`, `${d}d`)}</span></Row>); })) : null}
            {sh.opps && !(s.opportunities ?? []).length && <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Belum ada.", "None yet.")}</div>}
            {!sh.opps && <div style={{ marginTop: 8, fontSize: 13, color: C.faint }}>🔒 {t("Tidak dibagikan oleh anak", "Not shared by your child")}</div>}
          </Card>
          <Card>
            <CardTitle>{t("Aktivitas prestasi", "Achievement activity")}</CardTitle>
            {sh.ach ? (s.achievements ?? []).slice(0, 5).map((a: any, i: number, arr: any[]) => (
              <Row key={i} last={i === arr.length - 1}><span style={{ fontSize: 20 }}>{a.medal}</span><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700 }}>{a.title} · {a.event}</div><div style={{ fontSize: 11.5, color: C.faint }}>{a.year}{a.verified ? " · ✓ Verified" : ""}</div></div></Row>
            )) : <div style={{ marginTop: 8, fontSize: 13, color: C.faint }}>🔒 {t("Tidak dibagikan oleh anak", "Not shared by your child")}</div>}
            {sh.ach && !(s.achievements ?? []).length && <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Belum ada.", "None yet.")}</div>}
          </Card>
          <Note>🔒 {t(`Anda melihat ringkasan yang dibagikan ${s.name?.split(" ")[0] ?? "anak"}. Chat AI, refleksi, dan catatan pribadi tetap privat.`, `You see the summary ${s.name?.split(" ")[0] ?? "your child"} shares. AI chats, reflections and private notes stay private.`)}</Note>
        </>)}
      </Body>
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={t("Hubungkan anak lain", "Link another child")}>{linkForm}</Sheet>
    </Screen>
  );
}

/* MENTOR DASHBOARD (ROL-02, MEN-03) */
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
  const switchStudent = profile?.role === "student" ? <button onClick={async () => { await updatePrefs({ mode: "student" }); nav(profile?.onboarding_done ? "/app/home" : "/app/role"); }} style={{ border: "none", background: C.tintBlue, borderRadius: 11, fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: C.blueDark, padding: "9px 10px", cursor: "pointer" }}>{t("Mode siswa", "Student")}</button> : null;

  if (!st) return (
    <Screen>
      <TopBar avatar={<Avatar name={profile?.full_name} size={44} bg={bg} fg={fg} fontSize={18} />} kicker="Mentor" title={t("Jadi mentor Talentika", "Become a Talentika mentor")} extra={switchStudent} />
      <Body gap={10}>
        <Note>{t("Mentor diverifikasi tim Talentika sebelum tampil ke siswa. Sesi untuk siswa di bawah 18 tahun direkam dengan persetujuan atau dalam format grup.", "Mentors are verified by the Talentika team before appearing to students. Sessions with under-18s are recorded with consent or held as groups.")}</Note>
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
      </Body>
    </Screen>
  );

  const pending = (reqs ?? []).filter(r => r.status === "pending");
  const upcoming = (reqs ?? []).filter(r => r.status === "confirmed");
  return (
    <Screen>
      <TopBar avatar={<Avatar name={st.name} size={44} bg={bg} fg={fg} fontSize={18} />} kicker={`Mentor · ${st.title}`} title={`${t("Halo", "Hi")}, ${first || st.name} 👋`} extra={switchStudent} />
      <Body>
        {!st.is_available && <Note tone="yellow">⏳ {t("Profilmu sedang diverifikasi. Kamu bisa menyiapkan jadwal sekarang; profil tampil ke siswa setelah disetujui.", "Your profile is under review. You can set up slots now; it becomes visible once approved.")}</Note>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
          {[[st.sessions ?? 0, C.blue, "Sessions"], [st.rating ?? "–", C.gold, "Rating"], [st.students ?? 0, C.green, "Students"]].map(([v, c, l]) => (
            <div key={l as string} style={{ background: "#fff", borderRadius: 16, padding: 13, textAlign: "center", boxShadow: SH.cardSm }}><div style={{ fontSize: 20, fontWeight: 700, fontFamily: F.display, color: c as string }}>{v}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{l}</div></div>
          ))}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{t("Permintaan mentoring", "Mentoring requests")}</div>
        {!pending.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada permintaan baru. Tambahkan jadwal kosong di bawah.", "No new requests. Add open slots below.")}</div>}
        {pending.map(r => {
          const [b2, f2] = avatarColors(r.student_name ?? "S");
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 18, padding: 15, boxShadow: "0 4px 14px rgba(11,29,58,.06)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar name={r.student_name} size={42} bg={b2} fg={f2} fontSize={15} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800 }}>{r.student_name ?? t("Siswa", "Student")}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{r.topic}{r.student_kelas ? ` · ${t("kelas", "grade")} ${r.student_kelas}` : ""}</div></div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: C.text3, lineHeight: 1.6 }}>
                {r.student_axes && <><b>Talent DNA:</b> {dnaTitle(r.student_axes, 4)}<br /></>}
                <b>{t("Jadwal", "Schedule")}:</b> {fmt(r.session_date)} WIB
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => respond(r.id, "decline")} style={{ flex: 1, height: 40, border: `1.5px solid ${C.line}`, borderRadius: 12, background: "#fff", color: C.muted, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Tolak", "Decline")}</button>
                <button onClick={() => respond(r.id, "confirm")} style={{ flex: 1.5, height: 40, border: "none", borderRadius: 12, background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Terima", "Accept")}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: C.faint }}>{t("Mohon respons dalam 48 jam.", "Please respond within 48 hours.")}</div>
            </div>
          );
        })}
        {upcoming.length > 0 && (
          <Card>
            <CardTitle>{t("Sesi terjadwal", "Scheduled sessions")}</CardTitle>
            {upcoming.map((r, i) => (
              <Row key={r.id} last={i === upcoming.length - 1}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.student_name}</div><div style={{ fontSize: 11.5, color: C.faint }}>{fmt(r.session_date)} WIB · {r.topic}</div></div>
                {+new Date(r.session_date) < Date.now() && <button onClick={() => complete(r.id)} style={{ border: "none", background: C.tintGreen, color: C.green, borderRadius: 99, fontSize: 11.5, fontWeight: 700, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }}>{t("Selesai", "Done")}</button>}
              </Row>
            ))}
          </Card>
        )}
        <Card>
          <CardTitle>{t("Jadwal kosong", "Open slots")}</CardTitle>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {(slots ?? []).map(s => (
              <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: s.booking_id ? C.green : C.blueDark, background: s.booking_id ? C.tintGreen : C.tintBlue, padding: "6px 10px", borderRadius: 99 }}>
                {fmt(s.starts_at)}{!s.booking_id && <span onClick={async () => { await db.from("mentor_slots").delete().eq("id", s.id); refresh(); }} style={{ cursor: "pointer", color: C.faint }}>✕</span>}
              </span>
            ))}
            {!(slots ?? []).length && <span style={{ fontSize: 13, color: C.muted }}>{t("Belum ada.", "None yet.")}</span>}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Input type="datetime-local" value={slotAt} onChange={e => setSlotAt(e.target.value)} style={{ height: 44 }} />
            <Btn full={false} h={44} disabled={!slotAt} onClick={addSlot}>+</Btn>
          </div>
        </Card>
        <Note>{t("Ringkasan & pembayaran honor dikelola di web pada V1.", "Payout summaries are handled on the web in V1.")}</Note>
      </Body>
    </Screen>
  );
}

/* SCHOOL DASHBOARD — baca saja (ROL-04) */
const RIASEC_LABEL: Record<string, string> = { realistic: "Teknik & praktik", investigative: "Sains & riset", artistic: "Desain & media", social: "Pendidikan & sosial", enterprising: "Bisnis & startup", conventional: "Administrasi & data" };
function SchoolDash() {
  const { t, profile, toast } = useApp();
  const code = profile?.school_code ?? "";
  const { data, isLoading, error } = useQuery({ queryKey: ["m-school", code], enabled: !!code, queryFn: async () => { const r = await db.rpc("school_mobile_insights", { p_code: code }); if (r.error) throw r.error; return r.data; } });
  const { data: riasec } = useQuery({ queryKey: ["m-school-riasec", code], enabled: !!code, queryFn: async () => ((await db.rpc("school_riasec_distribution", { p_code: code })).data ?? []) as any[] });
  const remind = async () => {
    const { data: r, error: e } = await db.rpc("send_school_announcement", { p_code: code, p_title: "Yuk lengkapi Talent DNA-mu", p_body: "Buka Talentika dan selesaikan modul Talent DNA untuk melihat karier & peluang yang cocok.", p_target: "", p_priority: "normal" });
    if (e) { toast(errMsg(e), "error"); return; }
    toast(t(`Pengingat terkirim ke ${r.recipient_count} siswa`, `Reminder sent to ${r.recipient_count} students`));
  };
  const top = (data?.talent_map ?? []) as { k: string; n: number }[];
  const max = Math.max(1, ...top.map(x => x.n));
  const ARCH: Record<string, string> = { technology: "Technology Builder", creative: "Creative Problem Solver", leadership: "Future Entrepreneur", analytical: "Young Researcher", communication: "Social Connector" };
  const trend = (data?.trend ?? []) as { m: string; v: number }[];
  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <img src={authSchool} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{profile?.school_name ?? "Sekolah"} · Guru BK</div><div style={{ fontSize: 19, fontWeight: 700, fontFamily: F.display, letterSpacing: "-.3px" }}>{t("Halo", "Hi")}, {((profile as any)?.pic_name ?? profile?.full_name ?? "").split(" ")[0] || "Bu/Pak"} 👋</div></div>
        <button onClick={async () => { await keluar(); window.location.href = "/app"; }} style={{ border: "none", background: "#fff", boxShadow: SH.btn, borderRadius: 11, fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: C.muted, padding: "9px 12px", cursor: "pointer" }}>{t("Keluar", "Sign out")}</button>
      </div>
      <Body>
        {!code && <Empty icon="🏫" title={t("Akun ini belum terhubung ke sekolah", "This account isn't linked to a school")} body={t("Dashboard sekolah memakai akun sekolah terverifikasi.", "The school dashboard uses a verified school account.")} action={<Btn h={44} onClick={() => { window.location.href = "/for-schools"; }}>{t("Daftarkan sekolah", "Register school")}</Btn>} />}
        {isLoading && <Loading />}
        {error && <Note tone="yellow">{t("Akun sekolah belum terverifikasi atau tidak berwenang.", "School account not verified or not authorized.")}</Note>}
        {data && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
            {[[data.students, C.blue, t("Siswa", "Students")], [data.students ? `${Math.round((data.dna_done / data.students) * 100)}%` : "0%", C.green, t("Talent DNA selesai", "Talent DNA done")], [data.applications, C.orange, t("Aplikasi peluang", "Applications")]].map(([v, c, l]) => (
              <div key={l as string} style={{ background: "#fff", borderRadius: 16, padding: 13, boxShadow: SH.cardSm }}><div style={{ fontSize: 20, fontWeight: 700, fontFamily: F.display, color: c as string }}>{v}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{l}</div></div>
            ))}
          </div>
          <Card>
            <CardTitle right={trend.length > 1 ? <span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.green }}>{trend[trend.length - 1].v - trend[0].v >= 0 ? "+" : ""}{trend[trend.length - 1].v - trend[0].v} {t("sejak", "since")} {trend[0].m}</span> : undefined}>{t("Career Readiness rata-rata", "Average Career Readiness")}</CardTitle>
            {trend.length ? (
              <div style={{ marginTop: 14, height: 96, display: "flex", alignItems: "flex-end", gap: 10 }}>
                {trend.map((x, i) => <div key={x.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}><span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: F.display, color: C.text3 }}>{x.v}</span><div style={{ width: "100%", height: Math.max(6, Math.round(x.v * 0.7)), borderRadius: "7px 7px 3px 3px", background: i === trend.length - 1 ? C.blue : C.lightBlue }} /><span style={{ fontSize: 10, fontWeight: 700, color: C.faint }}>{x.m}</span></div>)}
              </div>
            ) : <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Tren muncul setelah siswa memakai aplikasi.", "The trend appears once students use the app.")}</div>}
          </Card>
          <Card>
            <CardTitle>Talent Map</CardTitle>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
              {top.map((s, i) => <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 140, fontSize: 12, fontWeight: 700, color: C.text3, flex: "none" }}>{ARCH[s.k] ?? s.k}</span><div style={{ flex: 1, height: 8, borderRadius: 4, background: C.track }}><div style={{ width: `${(s.n / max) * 100}%`, height: "100%", borderRadius: 4, background: [C.blue, C.orange, C.gold, C.purple, C.green][i % 5] }} /></div><span style={{ width: 30, textAlign: "right", fontSize: 12, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{data.dna_done ? Math.round((s.n / data.dna_done) * 100) : 0}%</span></div>)}
              {!top.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Belum ada data Talent DNA.", "No Talent DNA data yet.")}</div>}
            </div>
          </Card>
          {(riasec?.length ?? 0) > 0 && (
            <Card>
              <CardTitle>{t("Minat karier teratas", "Top career interests")}</CardTitle>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7 }}>{riasec!.slice(0, 5).map(r => <Pill key={r.riasec_type} size={12}>{RIASEC_LABEL[r.riasec_type] ?? r.riasec_type} · {r.pct}%</Pill>)}</div>
            </Card>
          )}
          <Card>
            <CardTitle>{t("Perlu perhatian", "Needs attention")}</CardTitle>
            {(data.attention ?? []).map((a: any, i: number) => {
              const red = a.reason === "deadline";
              return (
                <Row key={i} last={i === data.attention.length - 1}>
                  <Avatar name={a.name} size={38} bg={red ? C.tintRed : C.tintOrange} fg={red ? C.red : C.orangeDark} fontSize={14} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.name} {a.kelas && <span style={{ color: C.faint, fontWeight: 600 }}>· {a.kelas}</span>}</div><div style={{ marginTop: 1, fontSize: 12, color: red ? C.red : C.orangeDark, fontWeight: 600 }}>{red ? t(`Deadline ≤3 hari: ${a.item}`, `Deadline ≤3 days: ${a.item}`) : t("Belum mengikuti Talent Discovery", "Hasn't started Talent Discovery")}</div></div>
                </Row>
              );
            })}
            {!(data.attention ?? []).length && <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Tidak ada siswa yang perlu perhatian khusus.", "No students need special attention.")}</div>}
            <Btn h={44} onClick={remind} style={{ marginTop: 12, fontSize: 13.5 }}>{t("Kirim pengingat Talent DNA ke siswa", "Send Talent DNA reminder to students")}</Btn>
          </Card>
          <Note onClick={() => { window.location.href = "/school-dashboard"; }}>{t("Konsol lengkap (data siswa, laporan, pengumuman) tersedia di web →", "The full console (students, reports, announcements) is on the web →")}</Note>
        </>)}
      </Body>
    </Screen>
  );
}
