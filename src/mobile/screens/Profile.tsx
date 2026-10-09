import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { askAi, db, errMsg, useApp, useCareers, useDna, useReadiness, useSkills } from "../store";
import { AiLabel, Avatar, Body, Btn, Card, CardTitle, DarkCard, Empty, Header, Input, Kicker, Label, Loading, MenuList, Note, Pill, Row, Screen, Segmented, Sheet, TabTitle, TextArea, Toggle } from "../ui";
import { C, F, SH } from "../theme";
import { fmtDate, rankAxes } from "../logic";
import { PublicProfileBody } from "../PublicTalentProfile";

export default function Profile({ screen }: { screen: "profile" | "portfolio" | "public" | "goals" | "privacy" | "settings" | "achievements" }) {
  switch (screen) {
    case "portfolio": return <Portfolio />;
    case "public": return <PublicPreview />;
    case "goals": return <Goals />;
    case "privacy": return <Privacy />;
    case "settings": return <Settings />;
    case "achievements": return <Achievements />;
    default: return <ProfileHome />;
  }
}

const SKILL_COLORS = [C.blue, C.green, C.purple, C.orange, C.gold, C.sky];
const publicUrl = (u: string) => `${window.location.origin}/u/${u}`;

function UsernameSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, user, profile, toast, refreshProfile, afterAction } = useApp();
  const [u, setU] = useState(profile?.username ?? (profile?.full_name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20));
  const save = async () => {
    const v = u.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,30}$/.test(v)) { toast(t("3–30 huruf kecil, angka, titik, atau garis bawah", "3–30 lowercase letters, digits, dots or underscores"), "error"); return; }
    const { error } = await db.from("profiles").update({ username: v }).eq("user_id", user!.id);
    if (error) { toast(/unique|duplicate/i.test(error.message) ? t("Username sudah dipakai", "Username taken") : errMsg(error), "error"); return; }
    await refreshProfile(); onClose(); await afterAction(t("Profil publik dibuat", "Public profile created"));
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("Link profil publik", "Public profile link")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: C.muted }}>{window.location.host}/u/</div>
        <Input value={u} onChange={e => setU(e.target.value.toLowerCase())} placeholder="dafa" autoCapitalize="none" />
        <Btn onClick={save}>{t("Simpan", "Save")}</Btn>
      </div>
    </Sheet>
  );
}

/* 73 PROFILE (PRO-01) */
function ProfileHome() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, gam, isPro, toast } = useApp();
  const { dna, title, done } = useDna();
  const { data: rd } = useReadiness();
  const { data: skills = [] } = useSkills();
  const [uSheet, setUSheet] = useState(false);
  const [skillSheet, setSkillSheet] = useState(false);
  const [sk, setSk] = useState(""); const [lv, setLv] = useState(60);
  const { data } = useQuery({
    queryKey: ["m-profile-extra", user?.id], enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [xp, ach, proj, ch, apps, mentor] = await Promise.all([
        db.from("user_xp").select("current_xp,current_level").eq("user_id", uid).maybeSingle(),
        db.from("user_achievements").select("*").eq("user_id", uid).order("year", { ascending: false }),
        db.from("projects").select("status,field").eq("user_id", uid),
        db.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["submitted", "completed"]),
        db.from("saved_opportunities").select("opportunity_type,status").eq("user_id", uid),
        db.rpc("statistik_mentor_saya"),
      ]);
      return { xp: xp.data, ach: (ach.data ?? []) as any[], proj: (proj.data ?? []) as any[], challenges: ch.count ?? 0, apps: (apps.data ?? []) as any[], mentor: mentor.data };
    },
  });
  const fields = [profile?.full_name, profile?.usia, profile?.kelas, profile?.school_name, profile?.lokasi, profile?.bio, profile?.username, profile?.career_target, skills.length > 0, done > 0];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const top = rankAxes(dna?.axes)[0];
  const lvlWord = top ? ({ technology: "Builder", analytical: "Researcher", creative: "Creator", leadership: "Leader", communication: "Connector" } as any)[top] : "Explorer";
  const applied = (data?.apps ?? []).filter(a => ["applied", "selection", "accepted", "completed"].includes(a.status));
  const badges: [string, string, boolean][] = [
    ["🏆", "Competition Champion", (data?.ach ?? []).some(a => /🥇|juara|gold|winner/i.test(`${a.medal} ${a.title}`))],
    ["🔬", "Young Researcher", applied.some(a => /riset|research/i.test(a.opportunity_type ?? "")) || (data?.proj ?? []).some(p => /riset|research/i.test(p.field ?? ""))],
    ["💡", "Innovation Builder", (data?.proj ?? []).some(p => p.status === "completed")],
    ["🌱", "Sustainability Changemaker", (data?.challenges ?? 0) > 0],
    ["🌎", "Global Explorer", applied.some(a => /pertukaran|konferensi|fellowship/i.test(a.opportunity_type ?? ""))],
    ["🚀", "Young Entrepreneur", (dna?.axes?.leadership ?? 0) >= 75 && (data?.proj ?? []).length > 0],
  ];
  const addSkill = async () => {
    if (sk.trim().length < 2) return;
    const { error } = await db.from("user_skills").upsert({ user_id: user!.id, skill: sk.trim().slice(0, 40), level: lv, source: "self", updated_at: new Date().toISOString() }, { onConflict: "user_id,skill" });
    if (error) { toast(errMsg(error), "error"); return; }
    setSk(""); setSkillSheet(false); qc.invalidateQueries({ queryKey: ["m-skills"] });
  };
  return (
    <Screen tab>
      <TabTitle title={t("Profil", "Profile")} />
      <Body top={14}>
        <Card radius={22}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Avatar name={profile?.full_name} src={profile?.avatar_url} size={64} radius={21} fontSize={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name || t("Pengguna Talentika", "Talentika user")}</div>
              <div style={{ marginTop: 2, fontSize: 12.5, color: C.muted }}>{[profile?.school_name, profile?.kelas && `${t("Kelas", "Grade")} ${profile.kelas}`].filter(Boolean).join(" · ") || "—"}</div>
              {gam && <div style={{ marginTop: 6, display: "inline-flex", fontSize: 11, fontWeight: 700, fontFamily: F.display, color: C.blueDark, background: C.tintBlue, padding: "4px 9px", borderRadius: 99 }}>{lvlWord} · Lv {data?.xp?.current_level ?? 1} · {(data?.xp?.current_xp ?? 0).toLocaleString("id-ID")} XP</div>}
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, background: C.subtle, borderRadius: 13, padding: "10px 12px" }}>
            <span style={{ fontSize: 14 }}>🔗</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.username ? `${window.location.host}/u/${profile.username}` : t("Buat link profil publik", "Create your public link")}</span>
            <button onClick={() => profile?.username ? nav("/app/public") : setUSheet(true)} style={{ border: "none", background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, padding: "6px 12px", borderRadius: 99, cursor: "pointer" }}>{profile?.username ? "Share" : t("Buat", "Create")}</button>
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}><span style={{ color: C.muted }}>Profile completion</span><span style={{ color: C.blue }}>{completion}%</span></div>
          <div style={{ marginTop: 6, height: 7, borderRadius: 4, background: C.track }}><div style={{ width: `${completion}%`, height: "100%", borderRadius: 4, background: C.blue }} /></div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card pad={16} onClick={() => nav("/app/readiness")}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted }}>Career Readiness</div>
            <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, fontFamily: F.display, color: C.blue, lineHeight: 1 }}>{rd?.score ?? "–"}<span style={{ fontSize: 13, color: C.faint }}> / 100</span></div>
            <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: (rd?.week_delta ?? 0) >= 0 ? C.green : C.red }}>{(rd?.week_delta ?? 0) >= 0 ? "+" : ""}{rd?.week_delta ?? 0} {t("minggu ini", "this week")}</div>
          </Card>
          <div onClick={() => nav(done ? "/app/dna/result" : "/app/dna")} style={{ background: C.blue, borderRadius: 20, padding: 16, cursor: "pointer", color: "#fff" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.8)" }}>Talent DNA</div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, fontFamily: F.display, lineHeight: 1.35 }}>{title ?? t("Mulai assessment →", "Start assessment →")}</div>
          </div>
        </div>
        <Card>
          <CardTitle right={<button onClick={() => setSkillSheet(true)} style={{ border: "none", background: "none", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ {t("Tambah", "Add")}</button>}>Skills</CardTitle>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {skills.slice(0, 8).map((s, i) => (
              <div key={s.skill} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 104, fontSize: 12.5, fontWeight: 700, color: C.text3, flex: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.skill}</span>
                <div style={{ flex: 1, height: 7, borderRadius: 4, background: C.track }}><div style={{ width: `${s.level}%`, height: "100%", borderRadius: 4, background: SKILL_COLORS[i % SKILL_COLORS.length] }} /></div>
                <span style={{ width: 28, textAlign: "right", fontSize: 12, fontWeight: 700, fontFamily: F.display, flex: "none" }}>{s.level}</span>
              </div>
            ))}
            {!skills.length && <div style={{ fontSize: 13, color: C.muted }}>{t("Tambahkan skill yang kamu kuasai — dipakai untuk menghitung skill gap karier.", "Add skills you have — used to compute career skill gaps.")}</div>}
          </div>
        </Card>
        <Card>
          <CardTitle right={<button onClick={() => nav("/app/achievements")} style={{ border: "none", background: "none", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ {t("Tambah", "Add")}</button>}>My Achievements</CardTitle>
          <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.ach ?? []).slice(0, 3).map(a => (
              <div key={a.id} style={{ display: "flex", gap: 12, background: C.subtle, borderRadius: 15, padding: 13 }}>
                <span style={{ width: 42, height: 42, borderRadius: 13, background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flex: "none" }}>{a.medal}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800 }}>{a.title} {a.verified && <span style={{ color: C.blue, fontSize: 12 }}>✓</span>}</div><div style={{ marginTop: 1, fontSize: 12.5, color: C.text3 }}>{a.event} · {a.year}</div>
                  <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 5 }}>{a.skills.map((k: string) => <span key={k} style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, background: "#fff", padding: "3px 8px", borderRadius: 99 }}>{k}</span>)}<span style={{ fontSize: 10.5, fontWeight: 700, color: a.verified ? C.blue : C.faint, background: "#fff", padding: "3px 8px", borderRadius: 99 }}>{a.verified ? "Verified" : "Self-reported"}</span></div></div>
              </div>
            ))}
            {!(data?.ach ?? []).length && <div style={{ fontSize: 13, color: C.muted }}>{t("Catat lomba, olimpiade, atau penghargaanmu.", "Log your competitions, olympiads or awards.")}</div>}
          </div>
        </Card>
        {gam && (
          <Card>
            <CardTitle>Badges</CardTitle>
            <div style={{ marginTop: 11, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {badges.map(([e, n, on]) => <div key={n} style={{ background: on ? C.tintYellow : C.bg, borderRadius: 14, padding: "12px 6px", textAlign: "center", opacity: on ? 1 : 0.35 }}><div style={{ fontSize: 22 }}>{e}</div><div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: C.text3, lineHeight: 1.25 }}>{n}</div></div>)}
            </div>
          </Card>
        )}
        <MenuList items={[
          { icon: "🗂️", label: "My Portfolio", onClick: () => nav("/app/portfolio") },
          { icon: "🎯", label: "Goals & 90-Day Plan", onClick: () => nav("/app/goals") },
          { icon: "📌", label: "Opportunity Tracker", onClick: () => nav("/app/tracker") },
          { icon: "🛠️", label: "Projects", onClick: () => nav("/app/projects") },
          { icon: "🤝", label: "Mentorship", onClick: () => nav("/app/mentors") },
          { icon: "💬", label: "Community", onClick: () => nav("/app/community") },
          { icon: "👑", label: isPro ? "Talentika Pro · Aktif" : t("Upgrade ke Talentika Pro", "Upgrade to Talentika Pro"), onClick: () => nav("/app/pro") },
          { icon: "🌐", label: "Public Talent Profile", onClick: () => profile?.username ? nav("/app/public") : setUSheet(true) },
          { icon: "📅", label: "Deadline Calendar", onClick: () => nav("/app/calendar") },
          { icon: "📚", label: "Talentika Playbooks", onClick: () => nav("/app/playbooks") },
          { icon: "🎓", label: "University Explorer", onClick: () => nav("/app/universities") },
          ...(data?.mentor ? [{ icon: "🧭", label: t("Mode Mentor", "Mentor mode"), onClick: () => nav("/app/mentor-dashboard") }] : []),
          { icon: "🔒", label: "Privacy & Sharing", onClick: () => nav("/app/privacy") },
          { icon: "⚙️", label: "Settings & Preferences", onClick: () => nav("/app/settings") },
          { icon: "🚪", label: t("Keluar", "Sign out"), danger: true, onClick: async () => { await supabase.auth.signOut(); nav("/app", { replace: true }); } },
        ]} />
      </Body>
      <UsernameSheet open={uSheet} onClose={() => setUSheet(false)} />
      <Sheet open={skillSheet} onClose={() => setSkillSheet(false)} title={t("Tambah skill", "Add a skill")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input value={sk} onChange={e => setSk(e.target.value)} placeholder="Python, Public speaking, Figma…" />
          <Label>{t("Tingkat", "Level")}: {lv}</Label>
          <input type="range" min={10} max={100} step={10} value={lv} onChange={e => setLv(+e.target.value)} style={{ accentColor: C.blue }} />
          <Btn onClick={addSkill} disabled={sk.trim().length < 2}>{t("Simpan", "Save")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* 42 PORTFOLIO + AI PORTFOLIO BUILDER (PRJ-03) */
function Portfolio() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, toast, afterAction, track, refreshProfile } = useApp();
  const { title } = useDna();
  const { data: skills = [] } = useSkills();
  const [raw, setRaw] = useState("");
  const [ev, setEv] = useState<{ title: string; body: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bioEdit, setBioEdit] = useState(false); const [bio, setBio] = useState(profile?.bio ?? "");
  const { data } = useQuery({
    queryKey: ["m-portfolio", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: items }, { data: projects }, { data: certs }] = await Promise.all([
        db.from("portfolio_items").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        db.from("projects").select("id,title,status,skills").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        db.from("certificates").select("title,issuer,issue_date,verification_code").eq("user_id", user!.id).eq("is_active", true),
      ]);
      return { items: (items ?? []) as any[], projects: (projects ?? []) as any[], certs: (certs ?? []) as any[] };
    },
  });
  const transform = async () => {
    setBusy(true);
    const r = await askAi("evidence", { input: raw.trim() });
    setBusy(false);
    if (!r.text) { toast(r.message ?? t("AI belum tersedia", "AI unavailable"), "error"); return; }
    try { const j = JSON.parse(r.text.replace(/^```json|```$/g, "").trim()); setEv({ title: j.title, body: j.body }); }
    catch { setEv({ title: raw.trim().slice(0, 60), body: r.text }); }
  };
  const saveEv = async () => {
    const { error } = await db.from("portfolio_items").insert({ user_id: user!.id, title: ev!.title, description: ev!.body, item_type: "evidence", tags: ["ai-builder"], is_public: true });
    if (error) { toast(errMsg(error), "error"); return; }
    track("evidence_added", { source: "ai_builder" });
    setEv(null); setRaw(""); qc.invalidateQueries({ queryKey: ["m-portfolio"] });
    await afterAction(t("Portfolio evidence", "Portfolio evidence"));
  };
  const saveBio = async () => { await db.from("profiles").update({ bio: bio.trim() || null }).eq("user_id", user!.id); await refreshProfile(); setBioEdit(false); };
  const evidence = (data?.items ?? []).filter(i => i.item_type !== "course_completion");
  const completions = (data?.items ?? []).filter(i => i.item_type === "course_completion");
  return (
    <Screen>
      <Header title="My Portfolio" sub={profile?.username ? `${window.location.host}/u/${profile.username}` : undefined} subColor={C.blue}
        right={<button onClick={() => nav("/app/public")} style={{ height: 36, border: "none", borderRadius: 11, background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "0 12px", cursor: "pointer" }}>Preview</button>} />
      <Body>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between" }}><Kicker>About me</Kicker><button onClick={() => (bioEdit ? saveBio() : setBioEdit(true))} style={{ border: "none", background: "none", color: C.blue, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{bioEdit ? t("Simpan", "Save") : "✎ Edit"}</button></div>
          {bioEdit ? <TextArea value={bio} onChange={e => setBio(e.target.value)} maxLength={400} style={{ marginTop: 6 }} placeholder={t("Ceritakan dirimu dalam 1–2 kalimat", "Describe yourself in 1–2 sentences")} />
            : <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.6, color: profile?.bio ? C.text2 : C.faint }}>{profile?.bio || t("Belum ada bio.", "No bio yet.")}</p>}
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {title && <Pill display fg="#fff" bg={C.blue}>{title}</Pill>}
            {skills.slice(0, 4).map(s => <Pill key={s.skill}>{s.skill}</Pill>)}
          </div>
        </Card>
        <DarkCard>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.yellow }}>✦</span><span style={{ fontSize: 14.5, fontWeight: 800 }}>AI Portfolio Builder</span></div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: "rgba(255,255,255,.75)" }}>{t("Ubah aktivitas jadi bukti profesional.", "Turn activities into professional evidence.")}</div>
          <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, fontFamily: F.display, color: C.lightBlue, letterSpacing: ".5px" }}>RAW</div>
          <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={t("“Aku ikut lomba robotik.”", "“I joined a robotics competition.”")} style={{ marginTop: 5, width: "100%", height: 64, background: "rgba(255,255,255,.08)", border: "none", borderRadius: 12, padding: "11px 13px", fontSize: 13.5, color: "#fff", fontFamily: "inherit", resize: "none", outline: "none" }} />
          {!ev && <button disabled={busy || raw.trim().length < 6} onClick={transform} style={{ marginTop: 12, width: "100%", height: 44, border: "none", borderRadius: 13, background: C.yellow, color: C.navy, fontSize: 14, fontWeight: 700, fontFamily: F.display, cursor: "pointer", opacity: raw.trim().length < 6 ? 0.6 : 1 }}>{busy ? "…" : "Transform ✦"}</button>}
          {ev && (<>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, fontFamily: F.display, color: C.mint, letterSpacing: ".5px", display: "flex", justifyContent: "space-between" }}><span>PROFESSIONAL EVIDENCE</span><AiLabel dark /></div>
            {!editing ? (
              <div style={{ marginTop: 5, background: "#fff", color: C.navy, borderRadius: 13, padding: "13px 14px", animation: "tkPop .35s ease both" }}><div style={{ fontSize: 14, fontWeight: 800 }}>{ev.title}</div><div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: C.text3 }}>{ev.body}</div></div>
            ) : (
              <div style={{ marginTop: 5, background: "#fff", borderRadius: 13, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={ev.title} onChange={e => setEv({ ...ev, title: e.target.value })} style={{ height: 40, border: `1.5px solid ${C.blue}`, borderRadius: 10, padding: "0 11px", fontSize: 14, fontWeight: 700, fontFamily: F.display, color: C.navy, outline: "none" }} />
                <textarea value={ev.body} onChange={e => setEv({ ...ev, body: e.target.value })} style={{ height: 86, border: `1.5px solid ${C.blue}`, borderRadius: 10, padding: "9px 11px", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, color: C.text3, resize: "none", outline: "none" }} />
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(!editing)} style={{ flex: 1, height: 42, border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>{editing ? t("✓ Selesai edit", "✓ Done") : "✎ Edit"}</button>
              <button onClick={saveEv} style={{ flex: 1.4, height: 42, border: "none", borderRadius: 12, background: C.mint, color: "#064E2B", fontSize: 13.5, fontWeight: 700, fontFamily: F.display, cursor: "pointer" }}>{t("Simpan ke Portfolio", "Save to Portfolio")}</button>
            </div>
          </>)}
        </DarkCard>
        <Card>
          <CardTitle right={<button onClick={() => nav("/app/projects")} style={{ border: "none", background: "none", color: C.blue, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>+ Project</button>}>Projects</CardTitle>
          {(data?.projects ?? []).map((p, i, a) => (
            <Row key={p.id} last={i === a.length - 1} onClick={() => nav(`/app/projects/${p.id}`)} style={{ padding: "10px 0" }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, background: p.status === "completed" ? C.tintGreen : C.tintOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flex: "none" }}>{p.status === "completed" ? "✅" : "🛠️"}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{p.title}</div><div style={{ fontSize: 11.5, color: C.faint }}>{p.status === "completed" ? "Completed" : "In progress"}{p.skills?.length ? ` · ${p.skills.slice(0, 3).join(", ")}` : ""}</div></div>
            </Row>
          ))}
          {!(data?.projects ?? []).length && <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>{t("Belum ada project.", "No projects yet.")}</div>}
        </Card>
        <Card>
          <CardTitle>Certificates</CardTitle>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            {(data?.certs ?? []).map(c => <div key={c.verification_code} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ fontWeight: 700 }}>📜 {c.title}</span><span style={{ color: C.faint, flex: "none" }}>{c.issuer} · {new Date(c.issue_date).getFullYear()}</span></div>)}
            {completions.map(c => <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ fontWeight: 700 }}>{c.title.replace(/^Selesai: /, "")}</span><span style={{ color: C.faint, flex: "none" }}>Talentika · {new Date(c.created_at).getFullYear()}</span></div>)}
            {!(data?.certs ?? []).length && !completions.length && <div style={{ color: C.muted }}>{t("Selesaikan materi sampai tahap Prove untuk menambah bukti.", "Finish a course to the Prove stage to add evidence.")}</div>}
          </div>
        </Card>
        {evidence.length > 0 && (
          <Card>
            <CardTitle>Evidence</CardTitle>
            {evidence.map((e, i) => (
              <Row key={e.id} last={i === evidence.length - 1}>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{e.title}</div>{e.description && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginTop: 2 }}>{e.description}</div>}</div>
                <button onClick={async () => { await db.from("portfolio_items").delete().eq("id", e.id); qc.invalidateQueries({ queryKey: ["m-portfolio"] }); }} aria-label="Hapus" style={{ border: "none", background: "none", color: C.faint, cursor: "pointer" }}>✕</button>
              </Row>
            ))}
          </Card>
        )}
      </Body>
    </Screen>
  );
}

/* 45 PUBLIC TALENT PROFILE preview (PRJ-04) */
function PublicPreview() {
  const nav = useNavigate();
  const { t, profile, toast } = useApp();
  const [uSheet, setUSheet] = useState(!profile?.username);
  const { data, isLoading } = useQuery({
    queryKey: ["m-public", profile?.username], enabled: !!profile?.username,
    queryFn: async () => (await db.rpc("public_talent_profile", { p_username: profile!.username })).data,
  });
  const url = profile?.username ? publicUrl(profile.username) : "";
  const copy = async () => {
    if (navigator.share) { try { await navigator.share({ url, title: "Talentika" }); return; } catch { /* */ } }
    await navigator.clipboard?.writeText(url); toast(t("Link disalin", "Link copied"));
  };
  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => nav(-1)} aria-label="Kembali" style={{ width: 40, height: 40, border: "none", borderRadius: 12, background: "#fff", boxShadow: SH.btn, cursor: "pointer", fontSize: 17, color: C.text, flex: "none", fontFamily: "inherit" }}>←</button>
        <div style={{ flex: 1, minWidth: 0, height: 36, borderRadius: 11, background: "#fff", boxShadow: "0 2px 8px rgba(11,29,58,.06)", display: "flex", alignItems: "center", gap: 7, padding: "0 12px", fontSize: 12.5, fontWeight: 700, color: C.muted, overflow: "hidden", whiteSpace: "nowrap" }}>🔒 {url.replace(/^https?:\/\//, "")}</div>
        <button onClick={copy} disabled={!url} style={{ height: 36, border: "none", borderRadius: 11, background: C.blue, color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "0 12px", cursor: "pointer", flex: "none" }}>Copy link</button>
      </div>
      <Body top={14} gap={12}>
        {isLoading && <Loading />}
        {data && <PublicProfileBody p={data} />}
        <Note onClick={() => nav("/app/privacy")}>👁️ {t("Ini tampilan publik profilmu. Atur apa yang terlihat di", "This is your public view. Control what's visible in")} <b style={{ color: C.blue }}>Privacy & Sharing →</b></Note>
      </Body>
      <UsernameSheet open={uSheet} onClose={() => { setUSheet(false); if (!profile?.username) nav(-1); }} />
    </Screen>
  );
}

/* 76 GOALS & 90-DAY PLAN (PRO-03) */
function Goals() {
  const qc = useQueryClient();
  const { t, user, toast } = useApp();
  const [adding, setAdding] = useState<{ kind: "task"; month: number } | { kind: "goal"; horizon: string } | null>(null);
  const [val, setVal] = useState("");
  const [titleEdit, setTitleEdit] = useState(false); const [ptitle, setPtitle] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-goals", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: plan }, { data: tasks }, { data: goals }] = await Promise.all([
        db.from("user_plans").select("*").eq("user_id", user!.id).maybeSingle(),
        db.from("plan_tasks").select("*").eq("user_id", user!.id).order("month").order("sort").order("created_at"),
        db.from("user_goals").select("*").eq("user_id", user!.id).order("created_at"),
      ]);
      return { plan, tasks: (tasks ?? []) as any[], goals: (goals ?? []) as any[] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["m-goals"] });
  if (isLoading) return <Loading />;
  const tasks = data!.tasks; const done = tasks.filter(x => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const toggle = async (x: any) => { await db.from("plan_tasks").update({ done: !x.done, done_at: !x.done ? new Date().toISOString() : null }).eq("id", x.id); refresh(); };
  const save = async () => {
    if (val.trim().length < 2 || !adding) return;
    if (adding.kind === "task") {
      await db.from("user_plans").upsert({ user_id: user!.id }, { onConflict: "user_id", ignoreDuplicates: true });
      const { error } = await db.from("plan_tasks").insert({ user_id: user!.id, month: adding.month, title: val.trim(), sort: tasks.length });
      if (error) { toast(errMsg(error), "error"); return; }
    } else {
      const { error } = await db.from("user_goals").insert({ user_id: user!.id, horizon: adding.horizon, title: val.trim() });
      if (error) { toast(errMsg(error), "error"); return; }
    }
    setVal(""); setAdding(null); refresh();
  };
  const saveTitle = async () => { await db.from("user_plans").upsert({ user_id: user!.id, title: ptitle.trim() || "Rencana 90 hari-ku", updated_at: new Date().toISOString() }, { onConflict: "user_id" }); setTitleEdit(false); refresh(); };
  const monthTitles: string[] = data!.plan?.month_titles ?? ["Bulan 1", "Bulan 2", "Bulan 3"];
  const H: [string, string, string][] = [["short", "Short-term · 30–90 hari", "Short-term · 30–90 days"], ["medium", "Medium-term · 6–12 bulan", "Medium-term · 6–12 months"], ["long", "Long-term · 1–5 tahun", "Long-term · 1–5 years"]];
  return (
    <Screen>
      <Header title={t("Goals-ku", "My Goals")} />
      <Body>
        <div style={{ background: C.blue, borderRadius: 22, padding: 18, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: F.display, letterSpacing: ".8px", color: C.yellow }}>MY 90-DAY PLAN</div>
          {titleEdit ? <div style={{ marginTop: 6, display: "flex", gap: 8 }}><input value={ptitle} onChange={e => setPtitle(e.target.value)} autoFocus style={{ flex: 1, height: 38, borderRadius: 10, border: "none", padding: "0 10px", fontFamily: "inherit", fontSize: 15, fontWeight: 700 }} /><button onClick={saveTitle} style={{ border: "none", borderRadius: 10, background: C.yellow, fontWeight: 700, padding: "0 12px", cursor: "pointer" }}>✓</button></div>
            : <div onClick={() => { setPtitle(data!.plan?.title ?? ""); setTitleEdit(true); }} style={{ marginTop: 6, fontSize: 19, fontWeight: 800, cursor: "pointer" }}>{data!.plan?.title ?? t("Buat rencana 90 harimu", "Create your 90-day plan")} <span style={{ fontSize: 12, opacity: 0.7 }}>✎</span></div>}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,.22)" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: C.yellow, transition: "width .3s" }} /></div><span style={{ fontSize: 14, fontWeight: 800 }}>{pct}%</span></div>
          {data!.plan?.started_at && <div style={{ marginTop: 6, fontSize: 11.5, color: "rgba(255,255,255,.75)" }}>{t("Mulai", "Started")} {fmtDate(data!.plan.started_at)}</div>}
        </div>
        {[1, 2, 3].map(mo => {
          const list = tasks.filter(x => x.month === mo);
          return (
            <Card key={mo} pad="16px 18px">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><Kicker>Month {mo}</Kicker><span style={{ flex: 1, fontSize: 14.5, fontWeight: 800 }}>{monthTitles[mo - 1]}</span><span style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: C.blue }}>{list.filter(x => x.done).length}/{list.length}</span></div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {list.map(x => (
                  <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span onClick={() => toggle(x)} style={{ width: 21, height: 21, borderRadius: 7, border: `2px solid ${x.done ? C.green : C.disabled}`, background: x.done ? C.green : "#fff", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: F.display, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer" }}>{x.done ? "✓" : ""}</span>
                    <span onClick={() => toggle(x)} style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: x.done ? C.faint : C.text2, textDecoration: x.done ? "line-through" : "none", cursor: "pointer" }}>{x.title}</span>
                    <button onClick={async () => { await db.from("plan_tasks").delete().eq("id", x.id); refresh(); }} aria-label="Hapus" style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setAdding({ kind: "task", month: mo })} style={{ alignSelf: "flex-start", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>+ {t("Tambah tugas", "Add task")}</button>
              </div>
            </Card>
          );
        })}
        {H.map(([h, id, en]) => (
          <Card key={h} pad="16px 18px">
            <Kicker>{t(id, en)}</Kicker>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {data!.goals.filter(g => g.horizon === h).map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span onClick={async () => { await db.from("user_goals").update({ done: !g.done }).eq("id", g.id); refresh(); }} style={{ flex: 1, fontSize: 13.5, fontWeight: 700, cursor: "pointer", textDecoration: g.done ? "line-through" : "none", color: g.done ? C.faint : C.text }}>🎯 {g.title}</span>
                  <button onClick={async () => { await db.from("user_goals").delete().eq("id", g.id); refresh(); }} aria-label="Hapus" style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer", fontSize: 12 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setAdding({ kind: "goal", horizon: h })} style={{ alignSelf: "flex-start", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>+ {t("Tambah goal", "Add goal")}</button>
            </div>
          </Card>
        ))}
      </Body>
      <Sheet open={!!adding} onClose={() => setAdding(null)} title={adding?.kind === "task" ? t(`Tugas bulan ${adding.month}`, `Month ${adding.month} task`) : t("Goal baru", "New goal")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} /><Btn onClick={save}>{t("Simpan", "Save")}</Btn></div>
      </Sheet>
    </Screen>
  );
}

/* PRIVACY & SHARING (SET-01, AUTH-04) */
const PRIV_LABELS: [string, string, string][] = [["dna", "Talent DNA", "Talent DNA"], ["ach", "Achievements", "Achievements"], ["proj", "Projects", "Projects"], ["opps", "Opportunity activity", "Opportunity activity"], ["learn", "Learning progress", "Learning progress"]];
function Privacy() {
  const qc = useQueryClient();
  const { t, lang, user, profile, toast } = useApp();
  const [contact, setContact] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-privacy", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: s }, { data: links }] = await Promise.all([
        db.from("sharing_settings").select("*").eq("user_id", user!.id).maybeSingle(),
        db.from("parent_links").select("*").eq("student_user_id", user!.id).order("created_at", { ascending: false }),
      ]);
      return { s: s ?? { parent: { dna: true, ach: true, proj: true, opps: true, learn: true }, school: { dna: true, ach: true, proj: false, opps: false, learn: true }, public: { dna: false, ach: false, proj: false, opps: false, learn: false } }, links: (links ?? []) as any[] };
    },
  });
  if (isLoading) return <Loading />;
  const minor = (profile?.usia ?? 99) < 18;
  const active = data!.links.find(l => l.status === "active");
  const pending = data!.links.find(l => l.status === "pending");
  const consentOk = !minor || !!active;
  const toggle = async (aud: "parent" | "school" | "public", k: string) => {
    if (aud === "public" && !consentOk) { toast(t("Berbagi publik butuh persetujuan orang tua dulu", "Public sharing needs parental consent first"), "error"); return; }
    if (aud === "public" && !profile?.username) { toast(t("Buat link profil publik dulu di Profil", "Create your public link in Profile first"), "error"); return; }
    const next = { ...data!.s, [aud]: { ...data!.s[aud], [k]: !data!.s[aud][k] } };
    await db.from("sharing_settings").upsert({ user_id: user!.id, parent: next.parent, school: next.school, public: next.public, updated_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["m-privacy"] });
  };
  const invite = async () => {
    const { error } = await db.rpc("undang_orang_tua", { p_contact: contact.trim() });
    if (error) { toast(errMsg(error), "error"); return; }
    setContact(""); qc.invalidateQueries({ queryKey: ["m-privacy"] });
  };
  const revoke = async (l: any) => { if (!confirm(t("Putuskan akses orang tua?", "Revoke parent access?"))) return; await db.from("parent_links").update({ status: "revoked" }).eq("id", l.id); qc.invalidateQueries({ queryKey: ["m-privacy"] }); };
  const groups: [("parent" | "school" | "public"), string, string][] = [
    ["parent", t("Orang tua", "Parent"), "👨‍👩‍👧"],
    ["school", `${t("Sekolah", "School")}${profile?.school_name ? " · " + profile.school_name : ""}`, "🏫"],
    ["public", `Public Talent Profile${profile?.username ? " · /u/" + profile.username : ""}`, "🌐"],
  ];
  return (
    <Screen>
      <Header title="Privacy & Sharing" sub={t("Kamu yang menentukan siapa melihat apa", "You decide who sees what")} />
      <Body gap={12}>
        {active ? (
          <div style={{ background: C.tintGreen, borderRadius: 18, padding: "15px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: F.display, color: C.greenDark }}>{t("Persetujuan orang tua terverifikasi", "Parental consent verified")}</div><div style={{ marginTop: 2, fontSize: 12, color: "#166534" }}>{profile?.usia ? t(`Usia ${profile.usia} · `, `Age ${profile.usia} · `) : ""}{t("Disetujui", "Approved")} {fmtDate(active.consent_at, lang)}</div></div>
            <button onClick={() => revoke(active)} style={{ border: "none", background: "none", color: C.muted, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t("Cabut", "Revoke")}</button>
          </div>
        ) : pending ? (
          <div style={{ background: C.tintYellow, borderRadius: 18, padding: "15px 16px" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.gold }}>⏳ {t("Menunggu persetujuan orang tua", "Waiting for parental consent")}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: C.text3 }}>{t("Kode undangan", "Invite code")}: <b style={{ letterSpacing: 2 }}>{pending.invite_code}</b> · {pending.parent_contact}</div>
          </div>
        ) : (
          <Card pad={16}>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>{minor ? t("Butuh persetujuan orang tua", "Parental consent needed") : t("Hubungkan orang tua (opsional)", "Link a parent (optional)")}</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{t("Orang tua hanya melihat ringkasan yang kamu bagikan di bawah.", "Parents only see the summary you share below.")}</div>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}><Input value={contact} onChange={e => setContact(e.target.value)} placeholder={t("Email / HP orang tua", "Parent email / phone")} style={{ height: 44 }} /><Btn full={false} h={44} disabled={contact.trim().length < 5} onClick={invite}>{t("Undang", "Invite")}</Btn></div>
          </Card>
        )}
        {groups.map(([aud, title, icon]) => (
          <Card key={aud} pad="14px 18px">
            <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 4 }}><span style={{ fontSize: 17 }}>{icon}</span><span style={{ fontSize: 14, fontWeight: 800 }}>{title}</span></div>
            {PRIV_LABELS.map(([k, id, en]) => (
              <div key={k} onClick={() => toggle(aud, k)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.track}`, cursor: "pointer", opacity: aud === "public" && !consentOk ? 0.5 : 1 }}>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{t(id, en)}</span><Toggle on={!!data!.s[aud][k]} label={`${title} ${en}`} />
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0 2px" }}><span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: C.faint }}>{t("AI chat, refleksi & catatan pribadi", "AI chats, reflections & private notes")}</span><Pill display fg={C.muted} bg={C.bg}>🔒 {t("Selalu privat", "Always private")}</Pill></div>
          </Card>
        ))}
        <Note>✦ <b>AI transparency:</b> {t("semua konten buatan AI diberi label “AI-generated” dan selalu bisa kamu edit sebelum dibagikan.", "all AI content is labeled “AI-generated” and always editable before sharing.")}</Note>
      </Body>
    </Screen>
  );
}

/* 79 SETTINGS (SET-02..04, NOT-02, AUTH-06) */
function Settings() {
  const nav = useNavigate();
  const { t, lang, user, profile, textSize, gam, updatePrefs, refreshProfile, toast } = useApp();
  const push = usePushNotifications(user?.id);
  const prefs = profile?.app_prefs || {};
  const notif = prefs.notif || {};
  const [offline, setOffline] = useState(() => { try { return JSON.parse(localStorage.getItem("tk-offline-courses") || "{}"); } catch { return {}; } });
  const [delSheet, setDelSheet] = useState(false); const [confirmTxt, setConfirmTxt] = useState(""); const [busy, setBusy] = useState(false);
  const setLang = async (l: "id" | "en") => { localStorage.setItem("tk-lang", l); await (db.from("profiles").update({ language_preference: l }).eq("user_id", user!.id)); await refreshProfile(); };
  const removeOffline = (id: string) => { const o = { ...offline }; delete o[id]; localStorage.setItem("tk-offline-courses", JSON.stringify(o)); setOffline(o); };
  const cats: [string, string][] = [["opportunities", "Opportunities"], ["learning", "Learning"], ["mentorship", "Mentorship"], ["achievement", "Achievement"], ["ai", "AI Insight"], ["community", "Community"]];
  const exportData = async () => {
    setBusy(true);
    const uid = user!.id;
    const tables = ["profiles", "talent_dna_answers", "talent_dna_modules_done", "user_skills", "saved_opportunities", "user_goals", "plan_tasks", "projects", "project_evidence", "user_achievements", "learning_progress", "learning_reflections", "portfolio_items", "certificates", "mentor_bookings", "ai_messages", "sharing_settings", "career_readiness_snapshots"];
    const out: Record<string, any> = { exported_at: new Date().toISOString() };
    for (const tb of tables) { const { data } = await db.from(tb).select("*").eq("user_id", uid); out[tb] = data ?? []; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = `talentika-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setBusy(false); toast(t("Data diekspor", "Data exported"));
  };
  const deleteAccount = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("hapus-akun", { body: { confirm: "HAPUS" } });
    setBusy(false);
    if (error) { toast(t("Gagal memproses. Hubungi support.", "Couldn't process. Contact support."), "error"); return; }
    toast(data?.pending ? data.message : t("Akunmu sudah dihapus.", "Your account has been deleted."));
    await supabase.auth.signOut(); nav("/app", { replace: true });
  };
  return (
    <Screen>
      <Header title="Settings & Preferences" />
      <Body gap={12}>
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t("Bahasa", "Preferred language")}</div>
          <div style={{ marginTop: 10 }}><Segmented value={lang} onChange={setLang} options={[{ value: "id", label: "Bahasa Indonesia" }, { value: "en", label: "English" }]} /></div>
        </Card>
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t("Ukuran teks", "Text size")}</div>
          <div style={{ marginTop: 10 }}><Segmented value={textSize} onChange={v => updatePrefs({ textSize: v })} options={[{ value: "Kecil", label: t("Kecil", "Small") }, { value: "Normal", label: "Normal" }, { value: "Besar", label: t("Besar", "Large") }]} /></div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: C.faint }}>{t("Juga mengikuti ukuran font sistem HP-mu.", "Also follows your phone's system font size.")}</div>
        </Card>
        <Card pad="14px 18px">
          <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: F.display, paddingBottom: 4 }}>{t("Pengalaman", "Experience")}</div>
          <div onClick={() => updatePrefs({ gamification: !gam })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.track}`, cursor: "pointer" }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Gamifikasi (XP, level, badge)", "Gamification (XP, levels, badges)")}</div></div><Toggle on={gam} />
          </div>
          <div onClick={() => updatePrefs({ dataSaver: !prefs.dataSaver })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer" }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Hemat data", "Data saver")}</div><div style={{ fontSize: 11.5, color: C.faint }}>{t("Kualitas video lebih rendah di data seluler", "Lower video quality on cellular")}</div></div><Toggle on={!!prefs.dataSaver} />
          </div>
        </Card>
        <Card pad="14px 18px">
          <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: F.display, paddingBottom: 4 }}>{t("Unduhan offline", "Offline downloads")}</div>
          {Object.entries(offline).map(([id, o]: any) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}><span style={{ fontSize: 17 }}>📘</span><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{o.c?.title}</div><div style={{ fontSize: 11.5, color: C.faint }}>{t("Disimpan", "Saved")} {fmtDate(new Date(o.savedAt).toISOString(), lang)}</div></div><Toggle on onClick={() => removeOffline(id)} /></div>
          ))}
          {!Object.keys(offline).length && <div style={{ padding: "8px 0", fontSize: 13, color: C.muted }}>{t("Tekan ⬇ Offline di halaman materi untuk menyimpannya.", "Tap ⬇ Offline on a course to save it.")}</div>}
        </Card>
        <Card pad="14px 18px">
          <div style={{ fontSize: 14.5, fontWeight: 700, fontFamily: F.display, paddingBottom: 4 }}>{t("Notifikasi", "Notifications")}</div>
          {push.permission !== "unsupported" && push.permission !== "granted" && <Btn kind="soft" h={42} onClick={push.subscribe} style={{ margin: "6px 0" }}>{t("Aktifkan notifikasi push", "Enable push notifications")}</Btn>}
          {cats.map(([k, l]) => (
            <div key={k} onClick={() => updatePrefs({ notif: { ...notif, [k]: notif[k] === false } })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${C.track}`, cursor: "pointer" }}>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{l}</span><Toggle on={notif[k] !== false} />
            </div>
          ))}
          {(profile?.usia ?? 99) < 18 && <div style={{ paddingTop: 8, fontSize: 11.5, color: C.faint }}>🌙 {t("Jam tenang 21.00–06.00 aktif untuk pengguna di bawah 18 tahun.", "Quiet hours 21:00–06:00 are on for users under 18.")}</div>}
        </Card>
        <MenuList items={[
          { icon: "🔒", label: "Privacy & Sharing", onClick: () => nav("/app/privacy") },
          { icon: "🔔", label: t("Pusat notifikasi", "Notification center"), onClick: () => nav("/app/notifications") },
          { icon: "⬇️", label: busy ? "…" : t("Ekspor dataku (JSON)", "Export my data (JSON)"), onClick: exportData },
          { icon: "❓", label: t("Bantuan & tentang Talentika", "Help & about"), onClick: () => { window.location.href = "/tentang-kami"; } },
          { icon: "🗑️", label: t("Hapus akun", "Delete account"), danger: true, onClick: () => setDelSheet(true) },
        ]} />
        <div style={{ textAlign: "center", fontSize: 11, color: C.faint }}>Talentika Mobile · v1.0</div>
      </Body>
      <Sheet open={delSheet} onClose={() => setDelSheet(false)} title={t("Hapus akun permanen", "Delete account permanently")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text3, lineHeight: 1.6 }}>{t("Semua data pribadimu (profil, Talent DNA, project, chat AI) akan dihapus paling lambat 30 hari. Ekspor datamu dulu bila perlu. Ketik HAPUS untuk konfirmasi.", "All your personal data (profile, Talent DNA, projects, AI chats) will be deleted within 30 days. Export first if needed. Type HAPUS to confirm.")}</p>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <Input value={confirmTxt} onChange={e => setConfirmTxt(e.target.value)} placeholder="HAPUS" />
          <Btn disabled={confirmTxt !== "HAPUS" || busy} onClick={deleteAccount} style={{ background: C.red, boxShadow: "none" }}>{t("Hapus akunku", "Delete my account")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ACHIEVEMENTS (PRJ-05) */
function Achievements() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { t, user, toast, afterAction } = useApp();
  const [title, setTitle] = useState(""); const [event, setEvent] = useState(params.get("from") ?? "");
  const [year, setYear] = useState(String(new Date().getFullYear())); const [medal, setMedal] = useState("🏅");
  const [skills, setSkills] = useState(""); const [url, setUrl] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["m-ach", user?.id], enabled: !!user, queryFn: async () => ((await db.from("user_achievements").select("*").eq("user_id", user!.id).order("year", { ascending: false })).data ?? []) as any[] });
  const add = async () => {
    const { error } = await db.from("user_achievements").insert({ user_id: user!.id, title: title.trim(), event: event.trim(), year: +year, medal, skills: skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 6), evidence_url: /^https?:\/\//.test(url) ? url : null });
    if (error) { toast(errMsg(error), "error"); return; }
    setTitle(""); setEvent(""); setSkills(""); setUrl(""); qc.invalidateQueries({ queryKey: ["m-ach"] }); qc.invalidateQueries({ queryKey: ["m-profile-extra"] });
    await afterAction(t("Prestasi dicatat", "Achievement logged"));
  };
  return (
    <Screen>
      <Header title="Achievements" sub={t("Self-reported vs terverifikasi penyelenggara", "Self-reported vs organizer-verified")} />
      <Body gap={12}>
        <Card>
          <CardTitle>{t("Catat prestasi", "Log an achievement")}</CardTitle>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", gap: 6 }}>{["🥇", "🥈", "🥉", "🏅", "🏆", "🎖️"].map(m => <button key={m} onClick={() => setMedal(m)} style={{ flex: 1, height: 42, border: `2px solid ${medal === m ? C.blue : C.track}`, borderRadius: 12, background: medal === m ? C.tintBlue : "#fff", fontSize: 19, cursor: "pointer" }}>{m}</button>)}</div>
            <Input placeholder={t("Gelar · Gold Winner / Finalis", "Title · Gold Winner / Finalist")} value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder={t("Kegiatan · Olimpiade Robotik Nasional", "Event · National Robotics Olympiad")} value={event} onChange={e => setEvent(e.target.value)} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 9 }}><Input inputMode="numeric" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} /><Input placeholder="Skills · Robotics, Teamwork" value={skills} onChange={e => setSkills(e.target.value)} /></div>
            <Input placeholder={t("Link bukti (opsional)", "Evidence link (optional)")} value={url} onChange={e => setUrl(e.target.value)} />
            <Btn disabled={title.trim().length < 2 || event.trim().length < 2 || +year < 2000} onClick={add}>{t("Simpan", "Save")}</Btn>
          </div>
        </Card>
        {isLoading && <Loading />}
        {data?.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 16, padding: 13, boxShadow: SH.cardSm }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flex: "none" }}>{a.medal}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 800 }}>{a.title}</div><div style={{ fontSize: 12.5, color: C.text3 }}>{a.event} · {a.year}</div><div style={{ marginTop: 5 }}><Pill size={10.5} fg={a.verified ? C.blue : C.faint} bg={a.verified ? C.tintBlue : C.bg}>{a.verified ? "✓ Verified" : "Self-reported"}</Pill></div></div>
            <button onClick={async () => { await db.from("user_achievements").delete().eq("id", a.id); qc.invalidateQueries({ queryKey: ["m-ach"] }); }} aria-label="Hapus" style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer" }}>✕</button>
          </div>
        ))}
        {!isLoading && !data?.length && <Empty icon="🏅" title={t("Belum ada prestasi", "No achievements yet")} body={t("Prestasi terverifikasi berbobot lebih besar di Career Readiness.", "Verified achievements weigh more in Career Readiness.")} />}
      </Body>
    </Screen>
  );
}
