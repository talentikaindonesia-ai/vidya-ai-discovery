import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { askAi, db, errMsg, useApp, useCareers, useDna, useKetersediaan, useReadiness, useSkills } from "../store";
import { AiLabel, Avatar, BackBtn, Btn, Card, Empty, Header, Icon, IconBtn, ImgBox, Input, Label, Loading, MenuList, Note, Screen, Segmented, Sheet, TabTitle, TextArea, Toggle, TIKA } from "../ui";
import { C, SH } from "../theme";
import { AXES, AxisKey, fmtDate } from "../logic";
import { PublicProfileBody } from "../PublicTalentProfile";
import { keluar } from "../push";
import { canPurchase } from "../store";
import { editionOf } from "../MobileApp";
import { courseImg, IMG } from "../media";

export default function Profile({ screen }: { screen: "profile" | "portfolio" | "public" | "goals" | "privacy" }) {
  switch (screen) {
    case "portfolio": return <Portfolio />;
    case "public": return <PublicPreview />;
    case "goals": return <Growth />;
    case "privacy": return <FamilySchool />;
    default: return <ProfileHome />;
  }
}

const SKILL_COLORS = [C.blue, C.purple, C.orange, C.green, C.sky, C.red];
const publicUrl = (u: string) => `${window.location.origin}/u/${u}`;
/** Level & XP sesuai rumus server (_berikan_xp): level = max(1, floor(sqrt(xp/100))). */
function levelInfo(xp: number) {
  const lvl = Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)));
  const lo = lvl === 1 ? 0 : lvl * lvl * 100, hi = (lvl + 1) * (lvl + 1) * 100;
  return { lvl, inLvl: xp - lo, span: hi - lo, pct: Math.round(((xp - lo) / (hi - lo)) * 100) };
}
const AXIS_ICON: Record<AxisKey, [string, string]> = { analytical: ["chart", C.green], creative: ["bulb", C.orange], leadership: ["users", C.purple], technology: ["cpu", C.sky], communication: ["msg", C.blue] };
const to5 = (v?: number) => (typeof v === "number" ? (v / 20).toFixed(1) : "–");
const sectionTitle = (s: React.ReactNode, right?: React.ReactNode, mt = 18) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: mt }}><div style={{ fontSize: 16, fontWeight: 700 }}>{s}</div>{right}</div>
);
const linkBtn = (label: React.ReactNode, onClick: () => void) => <button onClick={onClick} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer", padding: 0 }}>{label}</button>;

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

/** Radar 5 sumbu (Talent DNA, skala 0–100). */
function Radar({ axes, size = 150 }: { axes: Partial<Record<AxisKey, number>>; size?: number }) {
  const keys = AXES.map(a => a.key);
  const cx = size / 2, cy = size / 2, R = size / 2 - 10;
  const pt = (i: number, r: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / keys.length; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; };
  const ring = (f: number) => keys.map((_, i) => pt(i, R * f)).join(" ");
  const pts = keys.map((k, i) => pt(i, R * Math.max(0.08, (axes[k] ?? 0) / 100))).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: "block" }} role="img" aria-label="Talent DNA radar">
      <polygon points={ring(1)} fill={C.bg} stroke="#D6E6FF" strokeWidth="1" />
      <polygon points={ring(0.66)} fill="none" stroke="#D6E6FF" strokeWidth="1" />
      <polygon points={ring(0.33)} fill="none" stroke="#D6E6FF" strokeWidth="1" />
      <polygon points={pts} fill="rgba(0,102,255,.22)" stroke={C.blue} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── MY PROFILE (tab) ───────────────────────────────────────────────── */
function ProfileHome() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, profile, gam, isPro, toast } = useApp();
  const ada = useKetersediaan();
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
      const [xp, ach, proj, ch, apps, mentor, lp, certs, rec] = await Promise.all([
        db.from("user_xp").select("current_xp,current_level").eq("user_id", uid).maybeSingle(),
        db.from("user_achievements").select("*").eq("user_id", uid).order("year", { ascending: false }),
        db.from("projects").select("status,field").eq("user_id", uid),
        db.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", uid).in("status", ["submitted", "completed"]),
        db.from("saved_opportunities").select("opportunity_type,status").eq("user_id", uid),
        db.rpc("statistik_mentor_saya"),
        db.from("learning_progress").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "completed"),
        db.from("certificates").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_active", true),
        db.rpc("my_learning_recommendations", { p_limit: 1 }),
      ]);
      return { xp: xp.data, ach: (ach.data ?? []) as any[], proj: (proj.data ?? []) as any[], challenges: ch.count ?? 0, apps: (apps.data ?? []) as any[], mentor: mentor.data, courses: lp.count ?? 0, certs: certs.count ?? 0, rec: ((rec.data ?? []) as any[])[0] ?? null };
    },
  });
  const fields = [profile?.full_name, profile?.usia, profile?.kelas, profile?.school_name, profile?.lokasi, profile?.bio, profile?.username, profile?.career_target, skills.length > 0, done > 0];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const applied = (data?.apps ?? []).filter(a => ["applied", "selection", "accepted", "completed"].includes(a.status));
  const badges: [string, string, string, string, boolean][] = [
    ["trophy", t("Juara Kompetisi", "Competition Champion"), C.amber, C.tintYellow, (data?.ach ?? []).some(a => /🥇|juara|gold|winner/i.test(`${a.medal} ${a.title}`))],
    ["search", t("Peneliti Muda", "Young Researcher"), C.sky, C.tintSky, applied.some(a => /riset|research/i.test(a.opportunity_type ?? "")) || (data?.proj ?? []).some(p => /riset|research/i.test(p.field ?? ""))],
    ["bulb", t("Pembangun Inovasi", "Innovation Builder"), C.blue, C.tintBlue, (data?.proj ?? []).some(p => p.status === "completed")],
    ["leaf", t("Agen Keberlanjutan", "Sustainability Changemaker"), C.green, C.tintGreen, (data?.challenges ?? 0) > 0],
    ["globe", t("Penjelajah Global", "Global Explorer"), C.purple, C.tintPurple, applied.some(a => /pertukaran|konferensi|fellowship/i.test(a.opportunity_type ?? ""))],
    ["rocket", t("Wirausaha Muda", "Young Entrepreneur"), C.red, C.tintRed, (dna?.axes?.leadership ?? 0) >= 75 && (data?.proj ?? []).length > 0],
  ];
  const lvi = levelInfo(data?.xp?.current_xp ?? 0);
  const ed = editionOf(profile?.jenjang);
  const roleLine = [ed === "pro" ? "Talentika Pro" : "Talentika Explorer", profile?.school_name, profile?.kelas && `${t("Kelas", "Grade")} ${profile.kelas}`].filter(Boolean).join(" · ");
  const ax = dna?.axes ?? null;
  const L = AXES.slice(0, 3), R = AXES.slice(3);
  const axisItem = (a: (typeof AXES)[number]) => (
    <div key={a.key} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
      <span style={{ color: AXIS_ICON[a.key][1], display: "flex", marginTop: 1 }}><Icon name={AXIS_ICON[a.key][0]} size={16} /></span>
      <div><div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.2 }}>{lang === "en" ? a.name : a.nameId}</div><div style={{ fontSize: 14, fontWeight: 700 }}>{to5(ax?.[a.key])}</div></div>
    </div>
  );
  const addSkill = async () => {
    if (sk.trim().length < 2) return;
    const { error } = await db.from("user_skills").upsert({ user_id: user!.id, skill: sk.trim().slice(0, 40), level: lv, source: "self", updated_at: new Date().toISOString() }, { onConflict: "user_id,skill" });
    if (error) { toast(errMsg(error), "error"); return; }
    setSk(""); setSkillSheet(false); qc.invalidateQueries({ queryKey: ["m-skills"] });
  };
  const stat = (icon: string, c: string, label: string, v: number, sub: string, to: string) => (
    <button onClick={() => nav(to)} style={{ textAlign: "left", border: "none", background: "#fff", borderRadius: 16, padding: 12, boxShadow: SH.card, cursor: "pointer" }}>
      <span style={{ color: c, display: "flex" }}><Icon name={icon} size={20} /></span>
      <span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 6 }}>{label}</span>
      <span style={{ display: "block", fontSize: 19, fontWeight: 700, color: C.text }}>{v}</span>
      <span style={{ display: "block", fontSize: 10.5, color: C.muted }}>{sub}</span>
    </button>
  );

  return (
    <Screen tab>
      <TabTitle title={t("Profilku", "My Profile")} right={<IconBtn icon="gear" label={t("Pengaturan", "Settings")} onClick={() => nav("/app/settings")} />} />
      <div style={{ padding: "0 20px" }}>
        <div style={{ background: "#fff", borderRadius: 22, padding: 16, marginTop: 14, boxShadow: SH.card }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button onClick={() => nav("/app/profile-setup?returning=1")} aria-label={t("Ubah profil", "Edit profile")} style={{ position: "relative", flex: "none", border: "none", background: "none", padding: 0, cursor: "pointer" }}>
              <Avatar name={profile?.full_name} src={profile?.avatar_url} size={76} fontSize={26} />
              <span style={{ position: "absolute", right: -2, bottom: 2, width: 26, height: 26, borderRadius: "50%", background: C.blue, color: "#fff", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="pencil" size={12} /></span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{(profile?.full_name || t("Pengguna Talentika", "Talentika user")).split(" ").slice(0, 2).join(" ")}</div>
              <div style={{ fontSize: 12.5, color: C.muted }}>{roleLine}</div>
              {title && <div style={{ marginTop: 6, display: "inline-flex", fontSize: 11, fontWeight: 600, color: C.purple, background: C.tintPurple, padding: "3px 10px", borderRadius: 99 }}>{title}</div>}
            </div>
          </div>
          {gam && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, background: C.yellow, color: C.text, padding: "4px 11px", borderRadius: 99 }}>Level {lvi.lvl}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 99, background: C.track }}><div style={{ width: `${lvi.pct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#0066FF,#00C6EF)" }} /></div>
              <span style={{ fontSize: 11.5, color: C.muted }}>{lvi.inLvl} / {lvi.span} XP</span>
            </div>
          )}
          <div style={{ marginTop: 12, background: C.bg, borderRadius: 13, padding: "10px 12px", fontSize: 12.5, color: C.text2, fontStyle: profile?.bio ? "italic" : "normal" }}>
            {profile?.bio ? `“${profile.bio}”` : <span style={{ color: C.faint }}>{t("Tambahkan bio singkat di Portofolio.", "Add a short bio in your Portfolio.")}</span>}
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: C.blue, display: "flex" }}><Icon name="link" size={15} /></span>
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: C.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.username ? `${window.location.host}/u/${profile.username}` : t("Buat link profil publik", "Create your public link")}</span>
            <button onClick={() => profile?.username ? nav("/app/public") : setUSheet(true)} style={{ border: "none", background: C.tintBlue, color: C.blue, fontSize: 11.5, fontWeight: 600, padding: "5px 11px", borderRadius: 99, cursor: "pointer" }}>{profile?.username ? t("Bagikan", "Share") : t("Buat", "Create")}</button>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span style={{ color: C.muted }}>{t("Kelengkapan profil", "Profile completion")}</span><span style={{ color: C.blue, fontWeight: 600 }}>{completion}%</span></div>
          <div style={{ marginTop: 5, height: 6, borderRadius: 99, background: C.track }}><div style={{ width: `${completion}%`, height: "100%", borderRadius: 99, background: C.blue }} /></div>
        </div>

        {sectionTitle(t("Profil Talentaku", "My Talent Profile"), linkBtn(done ? t("Lihat Detail", "See Details") : t("Mulai", "Start"), () => nav(done ? "/app/dna/result" : "/app/dna")))}
        {ax ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "14px 10px", marginTop: 10, display: "grid", gridTemplateColumns: "1fr 150px 1fr", alignItems: "center", boxShadow: SH.card }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{L.map(axisItem)}</div>
            <Radar axes={ax} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingLeft: 8 }}>{R.map(axisItem)}</div>
          </div>
        ) : (
          <button onClick={() => nav("/app/dna")} style={{ width: "100%", textAlign: "left", marginTop: 10, border: "none", background: "linear-gradient(120deg,#F1EAFE,#E6DBFF)", borderRadius: 20, padding: 16, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: C.purple, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="sparkle" size={22} /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text }}>{t("Temukan profil talentamu", "Discover your talent profile")}</span><span style={{ display: "block", fontSize: 11.5, color: C.purple }}>{t("~10–15 menit · aman & privat", "~10–15 min · safe & private")}</span></span>
            <span style={{ color: C.purple, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        )}

        {rd && (
          <button onClick={() => nav("/app/readiness")} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: C.navy, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
            <span style={{ color: C.cyan, display: "flex" }}><Icon name="target" size={22} /></span>
            <span style={{ flex: 1, fontSize: 13, color: "#fff" }}>Career Readiness <b style={{ fontSize: 15 }}>{rd.score}%</b> <span style={{ color: "rgba(255,255,255,.65)", fontSize: 11.5 }}>· {(rd.week_delta ?? 0) >= 0 ? "+" : ""}{rd.week_delta ?? 0} {t("minggu ini", "this week")}</span></span>
            <span style={{ color: "#fff", display: "flex" }}><Icon name="chev" size={17} /></span>
          </button>
        )}

        {sectionTitle(t("Progresku", "My Progress"))}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
          {stat("book", C.blue, t("Materi", "Courses"), data?.courses ?? 0, t("Selesai", "Completed"), "/app/learn")}
          {stat("medal", C.teal, t("Sertifikat", "Certificates"), data?.certs ?? 0, t("Diraih", "Earned"), "/app/portfolio")}
          {stat("folder", C.amber, t("Proyek", "Projects"), (data?.proj ?? []).filter(p => p.status === "completed").length, t("Selesai", "Completed"), "/app/projects")}
        </div>

        {sectionTitle(t("Prestasiku", "My Achievements"), linkBtn(t("+ Catat", "+ Log"), () => nav("/app/achievements?catat=1")))}
        {gam && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px 8px", marginTop: 10 }}>
            {badges.map(([ic, n, c, bg, on]) => (
              <div key={n} style={{ textAlign: "center", opacity: on ? 1 : 0.38 }}>
                <span style={{ width: 56, height: 56, margin: "0 auto", borderRadius: "50%", background: on ? bg : C.soft, color: on ? c : C.faint, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? "0 6px 14px rgba(15,23,42,.12)" : "none" }}><Icon name={on ? ic : "lock"} size={on ? 24 : 18} /></span>
                <div style={{ fontSize: 10.5, fontWeight: 500, marginTop: 6, lineHeight: 1.3 }}>{n}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {(data?.ach ?? []).slice(0, 2).map(a => (
            <div key={a.id} style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 16, padding: 12, boxShadow: SH.card, alignItems: "center" }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flex: "none" }}>{a.medal}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.title}</div><div style={{ fontSize: 11.5, color: C.muted }}>{a.event} · {a.year}</div></div>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: a.verified ? C.green : C.faint, background: a.verified ? C.tintGreen : C.soft, padding: "3px 9px", borderRadius: 99 }}>{a.verified ? t("Terverifikasi", "Verified") : t("Dilaporkan sendiri", "Self-reported")}</span>
            </div>
          ))}
        </div>

        {sectionTitle(t("Skill", "Skills"), linkBtn(t("+ Tambah", "+ Add"), () => setSkillSheet(true)))}
        <div style={{ background: "#fff", borderRadius: 18, padding: "14px 16px", marginTop: 10, display: "flex", flexDirection: "column", gap: 11, boxShadow: SH.card }}>
          {skills.slice(0, 6).map((s, i) => (
            <div key={s.skill} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 110, fontSize: 12.5, fontWeight: 500, flex: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.skill}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 99, background: C.track }}><div style={{ width: `${s.level}%`, height: "100%", borderRadius: 99, background: SKILL_COLORS[i % SKILL_COLORS.length] }} /></div>
              <span style={{ width: 28, textAlign: "right", fontSize: 11.5, fontWeight: 600, color: C.muted, flex: "none" }}>{s.level}</span>
            </div>
          ))}
          {!skills.length && <div style={{ fontSize: 12.5, color: C.muted }}>{t("Tambahkan skill yang kamu kuasai — dipakai untuk menghitung skill gap karier.", "Add skills you have — used to compute career skill gaps.")}</div>}
        </div>

        {data?.rec && <>
          {sectionTitle(t("Langkah Berikutnya", "Recommended Next Step"))}
          <button onClick={() => nav(`/app/course/${data.rec.id}`)} style={{ width: "100%", textAlign: "left", marginTop: 10, border: "none", background: "#fff", borderRadius: 18, padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH.card }}>
            <ImgBox src={courseImg(data.rec.thumbnail_url, data.rec.title)} w={64} h={58} r={12} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.tintBlue, padding: "2px 8px", borderRadius: 6 }}>{t("MATERI", "COURSE")}</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.rec.title}</span>
              <span style={{ display: "block", fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.rec.reason || t("Berdasarkan minatmu", "Based on your interests")}</span>
            </span>
            <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={18} /></span>
          </button>
        </>}

        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".5px", color: C.faint, margin: "20px 4px 8px" }}>{t("PERJALANANKU", "MY JOURNEY")}</div>
        <MenuList items={[
          { icon: "chart", label: t("Pertumbuhanku & Rencana 90 Hari", "My Growth & 90-Day Plan"), onClick: () => nav("/app/goals") },
          { icon: "medal", label: t("Pencapaian", "Achievements"), onClick: () => nav("/app/achievements") },
          { icon: "trophy", label: t("Tantangan", "Challenges"), onClick: () => nav("/app/challenges") },
          { icon: "clock", label: "Timeline", onClick: () => nav("/app/timeline") },
          { icon: "file", label: t("Portofolioku", "My Portfolio"), onClick: () => nav("/app/portfolio") },
          { icon: "brief", label: t("Lamaranku", "My Applications"), onClick: () => nav("/app/tracker") },
        ]} />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".5px", color: C.faint, margin: "20px 4px 8px" }}>{t("JELAJAHI", "EXPLORE")}</div>
        <MenuList items={[
          { icon: "globe", label: t("Program Talentika", "Talentika Programs"), onClick: () => nav("/app/programs") },
          { icon: "book", label: t("Artikel", "Articles"), onClick: () => nav("/app/articles") },
          { icon: "wallet", label: ada.playbook ? t("Store · Playbook & Program", "Store · Playbooks & Programs") : t("Store · Program", "Store · Programs"), onClick: () => nav("/app/store") },
          ...(ada.mentor ? [{ icon: "users", label: "Mentor", onClick: () => nav("/app/mentors") }] : []),
          { icon: "msg", label: t("Komunitas", "Community"), onClick: () => nav("/app/community") },
          { icon: "cap", label: t("Jelajah Kampus", "University Explorer"), onClick: () => nav("/app/universities") },
          { icon: "cal", label: t("Kalender Deadline", "Deadline Calendar"), onClick: () => nav("/app/calendar") },
        ]} />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".5px", color: C.faint, margin: "20px 4px 8px" }}>{t("AKUN", "ACCOUNT")}</div>
        <MenuList items={[
          { icon: "star", label: isPro ? t("Talentika Plus · Aktif", "Talentika Plus · Active") : canPurchase() ? t("Upgrade ke Talentika Plus", "Upgrade to Talentika Plus") : "Talentika Plus", onClick: () => nav("/app/pro") },
          { icon: "share", label: t("Ajak Teman", "Invite Friends"), onClick: () => nav("/app/referral") },
          { icon: "image", label: t("Bagikan Talent Card", "Share Talent Card"), onClick: () => nav("/app/talent-card") },
          { icon: "globe", label: t("Profil Talenta Publik", "Public Talent Profile"), onClick: () => profile?.username ? nav("/app/public") : setUSheet(true) },
          data?.mentor ? { icon: "compass", label: t("Mode Mentor", "Mentor mode"), onClick: () => nav("/app/mentor-dashboard") } : { icon: "users", label: t("Jadi Mentor / Mitra", "Become a Mentor / Partner"), onClick: () => nav("/app/mentor-apply") },
          { icon: "school", label: t("Keluarga & Sekolah", "Family & School"), onClick: () => nav("/app/privacy") },
          { icon: "shield", label: t("Privasi & Data", "Privacy & Data"), onClick: () => nav("/app/data") },
          { icon: "gear", label: t("Pengaturan", "Settings"), onClick: () => nav("/app/settings") },
          { icon: "logout", label: t("Keluar", "Sign out"), danger: true, onClick: async () => { await keluar(); nav("/app", { replace: true }); } },
        ]} />
      </div>
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

/* ── PORTFOLIO + AI PORTFOLIO BUILDER ───────────────────────────────── */
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
      const [{ data: items }, { data: projects }, { data: certs }, { count: ach }] = await Promise.all([
        db.from("portfolio_items").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        db.from("projects").select("id,title,status,skills,field").eq("user_id", user!.id).order("updated_at", { ascending: false }),
        db.from("certificates").select("title,issuer,issue_date,verification_code").eq("user_id", user!.id).eq("is_active", true),
        db.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return { items: (items ?? []) as any[], projects: (projects ?? []) as any[], certs: (certs ?? []) as any[], ach: ach ?? 0 };
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
    await afterAction(t("Bukti portofolio", "Portfolio evidence"));
  };
  const saveBio = async () => { await db.from("profiles").update({ bio: bio.trim() || null }).eq("user_id", user!.id); await refreshProfile(); setBioEdit(false); };
  const KIND: Record<string, [string, string]> = { project: ["Proyek", "Project"], course_completion: ["Materi selesai", "Course completed"], evidence: ["Bukti", "Evidence"], challenge: ["Tantangan", "Challenge"] };
  const imgs = [IMG.cTurbines, IMG.oppComp, IMG.cHiker, IMG.kDesign, IMG.cRobot, IMG.kEnv];
  const items = data?.items ?? [];
  return (
    <Screen>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <BackBtn onClick={() => nav(-1)} />
        <div style={{ flex: 1, fontSize: 19, fontWeight: 700 }}>{t("Portofolioku", "My Portfolio")}</div>
        <IconBtn primary icon="share" label={t("Bagikan", "Share")} onClick={() => nav("/app/public")} />
      </div>
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 22, padding: 18, color: "#fff", display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,.6)", display: "inline-flex", flex: "none" }}><Avatar name={profile?.full_name} src={profile?.avatar_url} size={56} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.full_name || "Talentika"}</div>
            <div style={{ fontSize: 12, opacity: .85 }}>{[title, editionOf(profile?.jenjang) === "pro" ? "Talentika Pro" : "Talentika Explorer"].filter(Boolean).join(" · ")}</div>
            {profile?.username && <div style={{ fontSize: 11.5, marginTop: 5, background: "rgba(255,255,255,.18)", display: "inline-block", padding: "3px 10px", borderRadius: 99, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window.location.host}/u/{profile.username}</div>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
          {[[data?.projects.length ?? 0, t("Proyek", "Projects")], [(data?.certs.length ?? 0) + items.filter(i => i.item_type === "course_completion").length, t("Sertifikat", "Certificates")], [data?.ach ?? 0, t("Prestasi", "Achievements")]].map(([v, l]) => (
            <div key={l as string} style={{ background: "#fff", borderRadius: 16, padding: 12, textAlign: "center", boxShadow: SH.card }}><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div><div style={{ fontSize: 11, color: C.muted }}>{l}</div></div>
          ))}
        </div>

        {sectionTitle(t("Tentang aku", "About me"), linkBtn(bioEdit ? t("Simpan", "Save") : t("Ubah", "Edit"), () => (bioEdit ? saveBio() : setBioEdit(true))))}
        <div style={{ background: "#fff", borderRadius: 18, padding: "12px 14px", marginTop: 10, boxShadow: SH.card }}>
          {bioEdit ? <TextArea value={bio} onChange={e => setBio(e.target.value)} maxLength={400} placeholder={t("Ceritakan dirimu dalam 1–2 kalimat", "Describe yourself in 1–2 sentences")} />
            : <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: profile?.bio ? C.text2 : C.faint }}>{profile?.bio || t("Belum ada bio.", "No bio yet.")}</p>}
          {skills.length > 0 && <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>{skills.slice(0, 5).map(s => <span key={s.skill} style={{ fontSize: 11, color: C.blue, background: C.tintBlue, padding: "3px 9px", borderRadius: 99 }}>{s.skill}</span>)}</div>}
        </div>

        {sectionTitle(t("Karya & bukti", "Work & evidence"), linkBtn(t("+ Proyek", "+ Project"), () => nav("/app/projects")))}
        {items.length || data?.projects.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            {(data?.projects ?? []).filter(p => p.status !== "completed").map(p => (
              <button key={p.id} onClick={() => nav(`/app/projects/${p.id}`)} style={{ textAlign: "left", border: "none", padding: 0, background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: SH.card, cursor: "pointer" }}>
                <ImgBox src={imgs[(p.title?.length ?? 0) % imgs.length]} h={96} r={0} />
                <span style={{ display: "block", padding: "10px 12px 12px" }}><span style={{ display: "block", fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: C.text }}>{p.title}</span><span style={{ display: "block", fontSize: 11, color: C.muted, marginTop: 2 }}>{t("Proyek", "Project")}</span>
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 10.5, fontWeight: 600, color: C.amber, background: C.tintYellow, padding: "2px 9px", borderRadius: 99 }}>{t("Berjalan", "In progress")}</span></span>
              </button>
            ))}
            {items.map((it, i) => (
              <div key={it.id} style={{ position: "relative", background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: SH.card }}>
                <ImgBox src={imgs[i % imgs.length]} h={96} r={0} />
                {it.item_type === "evidence" && <button onClick={async () => { await db.from("portfolio_items").delete().eq("id", it.id); qc.invalidateQueries({ queryKey: ["m-portfolio"] }); }} aria-label={t("Hapus", "Delete")} style={{ position: "absolute", right: 8, top: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.92)", color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="x" size={13} /></button>}
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{it.title.replace(/^Selesai: /, "")}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t(...(KIND[it.item_type] ?? ["Bukti", "Evidence"]))}</div>
                  <span style={{ display: "inline-block", marginTop: 6, fontSize: 10.5, fontWeight: 600, color: it.item_type === "evidence" ? C.faint : C.green, background: it.item_type === "evidence" ? C.soft : C.tintGreen, padding: "2px 9px", borderRadius: 99 }}>{it.item_type === "evidence" ? t("Dilaporkan sendiri", "Self-reported") : t("Terverifikasi", "Verified")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <div style={{ marginTop: 10, background: "#fff", borderRadius: 16, padding: "14px 16px", fontSize: 12.5, color: C.muted, boxShadow: SH.card }}>{t("Selesaikan materi atau proyek — buktinya otomatis masuk ke sini.", "Finish a course or project — the evidence lands here automatically.")}</div>}

        {(data?.certs.length ?? 0) > 0 && <>
          {sectionTitle(t("Sertifikat", "Certificates"))}
          <div style={{ background: "#fff", borderRadius: 18, padding: "4px 14px", marginTop: 10, boxShadow: SH.card }}>
            {data!.certs.map((c, i) => (
              <div key={c.verification_code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < data!.certs.length - 1 ? `1px solid ${C.track}` : "none" }}>
                <span style={{ color: C.teal, display: "flex" }}><Icon name="medal" size={18} /></span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.title}</span>
                <span style={{ fontSize: 11, color: C.faint, flex: "none" }}>{c.issuer} · {new Date(c.issue_date).getFullYear()}</span>
              </div>
            ))}
          </div>
        </>}

        <div style={{ marginTop: 16, background: C.navy, borderRadius: 20, padding: 16, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={TIKA} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", background: C.tintBlue }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("PEMBUAT PORTOFOLIO AI", "AI PORTFOLIO BUILDER")}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>{t("Ubah aktivitas jadi bukti profesional.", "Turn activities into professional evidence.")}</div></div>
          </div>
          <textarea value={raw} onChange={e => setRaw(e.target.value)} placeholder={t("“Aku ikut lomba robotik.”", "“I joined a robotics competition.”")} style={{ marginTop: 12, width: "100%", height: 64, background: "rgba(255,255,255,.08)", border: "none", borderRadius: 12, padding: "11px 13px", fontSize: 13, color: "#fff", fontFamily: "inherit", resize: "none", outline: "none" }} />
          {!ev && <button disabled={busy || raw.trim().length < 6} onClick={transform} style={{ marginTop: 10, width: "100%", height: 44, border: "none", borderRadius: 13, background: C.yellow, color: C.navy, fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: raw.trim().length < 6 ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>{busy ? "…" : <><Icon name="sparkle" size={16} />{t("Ubah jadi bukti", "Transform")}</>}</button>}
          {ev && (<>
            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: C.mint, letterSpacing: ".5px", display: "flex", justifyContent: "space-between" }}><span>{t("BUKTI PROFESIONAL", "PROFESSIONAL EVIDENCE")}</span><AiLabel dark /></div>
            {!editing ? (
              <div style={{ marginTop: 5, background: "#fff", color: C.navy, borderRadius: 13, padding: "13px 14px" }}><div style={{ fontSize: 14, fontWeight: 700 }}>{ev.title}</div><div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, color: C.text2 }}>{ev.body}</div></div>
            ) : (
              <div style={{ marginTop: 5, background: "#fff", borderRadius: 13, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={ev.title} onChange={e => setEv({ ...ev, title: e.target.value })} style={{ height: 40, border: `1.5px solid ${C.blue}`, borderRadius: 10, padding: "0 11px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", color: C.navy, outline: "none" }} />
                <textarea value={ev.body} onChange={e => setEv({ ...ev, body: e.target.value })} style={{ height: 86, border: `1.5px solid ${C.blue}`, borderRadius: 10, padding: "9px 11px", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5, color: C.text2, resize: "none", outline: "none" }} />
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(!editing)} style={{ flex: 1, height: 42, border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{editing ? t("Selesai", "Done") : t("Ubah", "Edit")}</button>
              <button onClick={saveEv} style={{ flex: 1.4, height: 42, border: "none", borderRadius: 12, background: C.mint, color: "#064E2B", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t("Simpan ke Portofolio", "Save to Portfolio")}</button>
            </div>
          </>)}
        </div>
      </div>
    </Screen>
  );
}

/* ── PUBLIC TALENT PROFILE preview ──────────────────────────────────── */
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
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <BackBtn onClick={() => nav(-1)} />
        <div style={{ flex: 1, minWidth: 0, height: 38, borderRadius: 99, background: "#fff", boxShadow: "0 2px 10px rgba(15,23,42,.06)", display: "flex", alignItems: "center", gap: 7, padding: "0 13px", fontSize: 12, fontWeight: 500, color: C.muted, overflow: "hidden", whiteSpace: "nowrap" }}><Icon name="lock" size={13} />{url.replace(/^https?:\/\//, "")}</div>
        <IconBtn primary icon="share" label={t("Salin link", "Copy link")} onClick={copy} />
      </div>
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {data && <PublicProfileBody p={data} />}
        <Note icon="eye" onClick={() => nav("/app/privacy")}>{t("Ini tampilan publik profilmu. Atur apa yang terlihat di", "This is your public view. Control what's visible in")} <b style={{ color: C.blue }}>{t("Keluarga & Sekolah", "Family & School")} →</b></Note>
      </div>
      <UsernameSheet open={uSheet} onClose={() => { setUSheet(false); if (!profile?.username) nav(-1); }} />
    </Screen>
  );
}

/* ── MY GROWTH (goals & 90-day plan) ────────────────────────────────── */
function Growth() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, toast } = useApp();
  const { data: skills = [] } = useSkills();
  const [adding, setAdding] = useState<{ kind: "task"; month: number } | { kind: "goal"; horizon: string } | null>(null);
  const [val, setVal] = useState("");
  const [titleEdit, setTitleEdit] = useState(false); const [ptitle, setPtitle] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-goals", user?.id], enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 42 * 86400000).toISOString();
      const [{ data: plan }, { data: tasks }, { data: goals }, { data: streaks }, { data: xl }, { data: rec }] = await Promise.all([
        db.from("user_plans").select("*").eq("user_id", user!.id).maybeSingle(),
        db.from("plan_tasks").select("*").eq("user_id", user!.id).order("month").order("sort").order("created_at"),
        db.from("user_goals").select("*").eq("user_id", user!.id).order("created_at"),
        db.from("user_streaks").select("streak_type,current_streak,last_activity_date").eq("user_id", user!.id),
        db.from("xp_ledger").select("amount,created_at").eq("user_id", user!.id).gte("created_at", since),
        db.rpc("my_learning_recommendations", { p_limit: 1 }),
      ]);
      return { plan, tasks: (tasks ?? []) as any[], goals: (goals ?? []) as any[], streaks: (streaks ?? []) as any[], xl: (xl ?? []) as any[], rec: ((rec ?? []) as any[])[0] ?? null };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["m-goals"] });
  // Runtun: pakai runtun belajar bila ada, selain itu runtun login.
  const streak = useMemo(() => {
    const s = (data?.streaks ?? []).find(x => x.streak_type === "learning" && x.current_streak > 0) ?? (data?.streaks ?? []).find(x => x.streak_type === "login");
    return { n: s?.current_streak ?? 0, last: s?.last_activity_date ? new Date(s.last_activity_date) : null };
  }, [data]);
  const week = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const last = streak.last ? new Date(streak.last.getFullYear(), streak.last.getMonth(), streak.last.getDate()) : null;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const active = !!last && d <= last && (+last - +d) / 86400000 < streak.n;
      return { d: d.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { weekday: "narrow" }), active, today: +d === +today, future: d > today };
    });
  }, [streak, lang]);
  const weeks = useMemo(() => {
    const out = Array.from({ length: 6 }, (_, i) => ({ w: `M${i + 1}`, v: 0 }));
    const now = Date.now();
    (data?.xl ?? []).forEach(r => { const k = 5 - Math.floor((now - +new Date(r.created_at)) / (7 * 86400000)); if (k >= 0 && k < 6) out[k].v += Math.max(0, r.amount ?? 0); });
    const max = Math.max(1, ...out.map(x => x.v));
    return out.map((x, i) => ({ ...x, w: i === 5 ? t("Ini", "Now") : `-${5 - i}`, h: Math.max(6, Math.round((x.v / max) * 86)) }));
  }, [data, t]);
  if (isLoading) return <Loading />;
  const tasks = data!.tasks; const done = tasks.filter(x => x.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const started = data!.plan?.started_at ? new Date(data!.plan.started_at) : null;
  const curMonth = started ? Math.min(3, Math.max(1, Math.floor((Date.now() - +started) / (30 * 86400000)) + 1)) : 1;
  const nowTasks = tasks.filter(x => x.month === curMonth);
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
  const monthTitles: string[] = data!.plan?.month_titles ?? [t("Bulan 1", "Month 1"), t("Bulan 2", "Month 2"), t("Bulan 3", "Month 3")];
  const HZ: [string, string, string][] = [["short", "Jangka pendek · 30–90 hari", "Short-term · 30–90 days"], ["medium", "Jangka menengah · 6–12 bulan", "Medium-term · 6–12 months"], ["long", "Jangka panjang · 1–5 tahun", "Long-term · 1–5 years"]];
  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
  const checkRow = (x: any, last: boolean) => (
    <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: last ? "none" : "1px solid #F1F5FB" }}>
      <button onClick={() => toggle(x)} aria-pressed={!!x.done} aria-label={x.title} style={{ width: 24, height: 24, borderRadius: 8, background: x.done ? C.green : "#fff", border: `1.5px solid ${x.done ? C.green : "#CBD5E1"}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", cursor: "pointer", padding: 0 }}>{x.done && <Icon name="check" size={13} />}</button>
      <span onClick={() => toggle(x)} style={{ flex: 1, fontSize: 13.5, color: x.done ? C.faint : C.text, textDecoration: x.done ? "line-through" : "none", cursor: "pointer" }}>{x.title}</span>
      <button onClick={async () => { await db.from("plan_tasks").delete().eq("id", x.id); refresh(); }} aria-label={t("Hapus", "Delete")} style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer", display: "flex", padding: 2 }}><Icon name="x" size={13} /></button>
    </div>
  );

  return (
    <Screen tab>
      <Header title={t("Pertumbuhanku", "My Growth")} sub={t("Progres, tujuan, dan rencanamu", "Your progress, goals and plan")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "linear-gradient(120deg,#FFF6DB,#FFE9A8)", borderRadius: 22, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#F59E0B", display: "flex" }}><Icon name="flame" size={30} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{t(`${streak.n} hari beruntun`, `${streak.n}-day streak`)}</div><div style={{ fontSize: 11.5, color: "#7A5200", marginTop: 3 }}>{t("Belajar 10 menit hari ini untuk menjaganya", "Learn 10 minutes today to keep it going")}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginTop: 14 }}>
            {week.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ height: 34, borderRadius: 11, background: d.active ? "#F59E0B" : d.today ? "#fff" : "rgba(255,255,255,.55)", color: d.active ? "#fff" : C.faint, border: d.today && !d.active ? "1.5px dashed #F59E0B" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>{d.active ? <Icon name="check" size={15} /> : null}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "#7A5200", marginTop: 4 }}>{d.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 16, marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><div style={{ fontSize: 15, fontWeight: 700 }}>{t("XP per minggu", "XP per week")}</div><span style={{ fontSize: 11.5, color: C.muted }}>{t("6 minggu terakhir", "last 6 weeks")}</span></div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginTop: 12 }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, justifyContent: "flex-end", height: "100%" }}>
                <span style={{ fontSize: 9.5, color: C.muted }}>{w.v}</span>
                <div style={{ width: "100%", height: w.h, borderRadius: 8, background: i === 5 ? C.blue : "#CFE3FF" }} />
                <span style={{ fontSize: 10, color: C.faint }}>{w.w}</span>
              </div>
            ))}
          </div>
        </div>

        {skills.length > 0 && <>
          {sectionTitle(t("Perkembangan skill", "Skill development"))}
          <div style={{ ...card, padding: "14px 16px", marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
            {skills.slice(0, 4).map((s, i) => (
              <div key={s.skill}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ fontWeight: 500 }}>{s.skill}</span><span style={{ color: C.muted, fontWeight: 600 }}>{s.level}/100</span></div>
                <div style={{ height: 7, borderRadius: 99, background: C.track, marginTop: 6 }}><div style={{ width: `${s.level}%`, height: "100%", borderRadius: 99, background: SKILL_COLORS[i % SKILL_COLORS.length] }} /></div>
              </div>
            ))}
          </div>
        </>}

        {sectionTitle(t(`Target bulan ini · ${monthTitles[curMonth - 1]}`, `This month's goals · ${monthTitles[curMonth - 1]}`), <span style={{ fontSize: 12, color: C.muted }}>{nowTasks.filter(x => x.done).length}/{nowTasks.length} {t("selesai", "done")}</span>)}
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {nowTasks.map((x, i) => checkRow(x, i === nowTasks.length - 1))}
          {!nowTasks.length && <div style={{ padding: "12px 0", fontSize: 12.5, color: C.muted }}>{t("Belum ada target. Tambahkan satu langkah kecil.", "No goals yet. Add one small step.")}</div>}
          <button onClick={() => setAdding({ kind: "task", month: curMonth })} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "10px 0" }}>+ {t("Tambah target", "Add goal")}</button>
        </div>

        {data!.rec && (
          <button onClick={() => nav(`/app/course/${data!.rec.id}`)} style={{ width: "100%", textAlign: "left", marginTop: 12, border: "none", background: C.navy, borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
            <img src={TIKA} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", background: C.tintBlue, flex: "none" }} />
            <span><span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{t("REKOMENDASI TERBARU", "UPDATED RECOMMENDATION")}</span>
              <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,.9)", marginTop: 3 }}>{t(`Coba “${data!.rec.title}” berikutnya`, `Try “${data!.rec.title}” next`)}{data!.rec.reason ? ` — ${data!.rec.reason}` : "."}</span></span>
          </button>
        )}

        {/* Rencana 90 hari */}
        <div style={{ marginTop: 18, background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 22, padding: 18, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".8px", color: C.yellow }}>{t("RENCANA 90 HARIKU", "MY 90-DAY PLAN")}</div>
          {titleEdit ? <div style={{ marginTop: 6, display: "flex", gap: 8 }}><input value={ptitle} onChange={e => setPtitle(e.target.value)} autoFocus style={{ flex: 1, minWidth: 0, height: 38, borderRadius: 10, border: "none", padding: "0 10px", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }} /><button onClick={saveTitle} aria-label={t("Simpan", "Save")} style={{ border: "none", borderRadius: 10, background: C.yellow, color: C.text, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}><Icon name="check" size={16} /></button></div>
            : <button onClick={() => { setPtitle(data!.plan?.title ?? ""); setTitleEdit(true); }} style={{ marginTop: 6, border: "none", background: "none", padding: 0, color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}>{data!.plan?.title ?? t("Buat rencana 90 harimu", "Create your 90-day plan")}<Icon name="pencil" size={13} /></button>}
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1, height: 8, borderRadius: 99, background: "rgba(255,255,255,.22)" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: C.yellow, transition: "width .3s" }} /></div><span style={{ fontSize: 14, fontWeight: 700 }}>{pct}%</span></div>
          {started && <div style={{ marginTop: 6, fontSize: 11.5, color: "rgba(255,255,255,.8)" }}>{t("Mulai", "Started")} {fmtDate(data!.plan.started_at, lang)}</div>}
        </div>
        {[1, 2, 3].filter(mo => mo !== curMonth).map(mo => {
          const list = tasks.filter(x => x.month === mo);
          return (
            <div key={mo} style={{ ...card, padding: "12px 14px 4px", marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 11, fontWeight: 600, color: C.faint }}>{t(`BULAN ${mo}`, `MONTH ${mo}`)}</span><span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{monthTitles[mo - 1]}</span><span style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{list.filter(x => x.done).length}/{list.length}</span></div>
              {list.map((x, i) => checkRow(x, i === list.length - 1))}
              <button onClick={() => setAdding({ kind: "task", month: mo })} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "10px 0" }}>+ {t("Tambah tugas", "Add task")}</button>
            </div>
          );
        })}
        {sectionTitle(t("Tujuan jangka panjang", "Longer-term goals"))}
        {HZ.map(([h, id, en]) => (
          <div key={h} style={{ ...card, padding: "12px 14px", marginTop: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.muted }}>{t(id, en)}</div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
              {data!.goals.filter(g => g.horizon === h).map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: g.done ? C.green : C.blue, display: "flex" }}><Icon name={g.done ? "check" : "target"} size={15} /></span>
                  <span onClick={async () => { await db.from("user_goals").update({ done: !g.done }).eq("id", g.id); refresh(); }} style={{ flex: 1, fontSize: 13.5, fontWeight: 500, cursor: "pointer", textDecoration: g.done ? "line-through" : "none", color: g.done ? C.faint : C.text }}>{g.title}</span>
                  <button onClick={async () => { await db.from("user_goals").delete().eq("id", g.id); refresh(); }} aria-label={t("Hapus", "Delete")} style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer", display: "flex", padding: 2 }}><Icon name="x" size={13} /></button>
                </div>
              ))}
              <button onClick={() => setAdding({ kind: "goal", horizon: h })} style={{ alignSelf: "flex-start", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ {t("Tambah tujuan", "Add goal")}</button>
            </div>
          </div>
        ))}
      </div>
      <Sheet open={!!adding} onClose={() => setAdding(null)} title={adding?.kind === "task" ? t(`Tugas bulan ${adding.month}`, `Month ${adding.month} task`) : t("Tujuan baru", "New goal")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}><Input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} /><Btn onClick={save}>{t("Simpan", "Save")}</Btn></div>
      </Sheet>
    </Screen>
  );
}

/* ── FAMILY & SCHOOL (privacy & sharing) ────────────────────────────── */
const PRIV_LABELS: [string, string, string][] = [["dna", "Profil Talenta (Talent DNA)", "Talent Profile (Talent DNA)"], ["ach", "Prestasi", "Achievements"], ["proj", "Proyek", "Projects"], ["opps", "Aktivitas peluang", "Opportunity activity"], ["learn", "Progres belajar", "Learning progress"]];
function FamilySchool() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, profile, toast } = useApp();
  const [contact, setContact] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-privacy", user?.id], enabled: !!user,
    queryFn: async () => {
      const [{ data: s }, { data: links }, { data: ann }] = await Promise.all([
        db.from("sharing_settings").select("*").eq("user_id", user!.id).maybeSingle(),
        db.from("parent_links").select("*").eq("student_user_id", user!.id).order("created_at", { ascending: false }),
        db.from("notifications").select("id,title,message,is_read,created_at,metadata").eq("user_id", user!.id).eq("type", "announcement").order("created_at", { ascending: false }).limit(3),
      ]);
      return { s: s ?? { parent: { dna: true, ach: true, proj: true, opps: true, learn: true }, school: { dna: true, ach: true, proj: false, opps: false, learn: true }, public: { dna: false, ach: false, proj: false, opps: false, learn: false } }, links: (links ?? []) as any[], ann: (ann ?? []) as any[] };
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
  const markRead = async (n: any) => { if (!n.is_read) { await db.from("notifications").update({ is_read: true }).eq("id", n.id); qc.invalidateQueries({ queryKey: ["m-privacy"] }); } };
  const guardian = active?.parent_contact ?? pending?.parent_contact ?? null;
  const groups: [("parent" | "school" | "public"), string, string][] = [
    ["parent", t("Yang bisa dilihat orang tuamu", "What your guardian can see"), "users"],
    ["school", `${t("Yang bisa dilihat sekolah", "What your school can see")}${profile?.school_name ? " · " + profile.school_name : ""}`, "school"],
    ["public", `${t("Profil Talenta Publik", "Public Talent Profile")}${profile?.username ? " · /u/" + profile.username : ""}`, "globe"],
  ];
  const parentSees = PRIV_LABELS.filter(([k]) => data!.s.parent[k]);
  const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
  return (
    <Screen>
      <Header title={t("Keluarga & Sekolah", "Family & School")} sub={[profile?.school_name, guardian && `${guardian} (${t("wali", "guardian")})`].filter(Boolean).join(" · ") || t("Kamu yang menentukan siapa melihat apa", "You decide who sees what")} />
      <div style={{ padding: "14px 20px 0" }}>
        {data!.ann.length > 0 && <>
          {sectionTitle(t("Dari sekolahmu", "From your school"), undefined, 4)}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {data!.ann.map(n => (
              <button key={n.id} onClick={() => markRead(n)} style={{ width: "100%", textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", boxShadow: SH.card }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: n.is_read ? C.green : "#fff", border: `1.5px solid ${n.is_read ? C.green : "#CBD5E1"}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{n.is_read && <Icon name="check" size={14} />}</span>
                <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{n.title}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 1 }}>{n.message}</span><span style={{ display: "block", fontSize: 10.5, color: C.faint, marginTop: 3 }}>{fmtDate(n.created_at, lang)}</span></span>
              </button>
            ))}
          </div>
        </>}

        <div style={{ marginTop: data!.ann.length ? 16 : 4 }}>
          {active ? (
            <div style={{ background: C.tintGreen, borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="check" size={17} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: "#14532D" }}>{t("Persetujuan orang tua terverifikasi", "Parental consent verified")}</div><div style={{ marginTop: 2, fontSize: 11.5, color: "#166534" }}>{profile?.usia ? t(`Usia ${profile.usia} · `, `Age ${profile.usia} · `) : ""}{t("Disetujui", "Approved")} {fmtDate(active.consent_at, lang)}</div></div>
              <button onClick={() => revoke(active)} style={{ border: "none", background: "none", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>{t("Cabut", "Revoke")}</button>
            </div>
          ) : pending ? (
            <div style={{ background: C.tintYellow, borderRadius: 18, padding: "13px 14px", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 34, height: 34, borderRadius: "50%", background: C.amber, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="clock" size={17} /></span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: "#7A5200" }}>{t("Menunggu persetujuan orang tua", "Waiting for parental consent")}</div><div style={{ marginTop: 2, fontSize: 11.5, color: C.text2 }}>{t("Kode", "Code")}: <b style={{ letterSpacing: 2 }}>{pending.invite_code}</b> · {pending.parent_contact}</div></div>
            </div>
          ) : (
            <div style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{minor ? t("Butuh persetujuan orang tua", "Parental consent needed") : t("Hubungkan orang tua (opsional)", "Link a parent (optional)")}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{t("Orang tua hanya melihat ringkasan yang kamu bagikan di bawah.", "Parents only see the summary you share below.")}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}><Input value={contact} onChange={e => setContact(e.target.value)} placeholder={t("Email / HP orang tua", "Parent email / phone")} style={{ height: 44 }} /><Btn full={false} h={44} disabled={contact.trim().length < 5} onClick={invite}>{t("Undang", "Invite")}</Btn></div>
            </div>
          )}
        </div>

        {groups.map(([aud, title, icon]) => (
          <div key={aud}>
            {sectionTitle(<span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: C.blue, display: "flex" }}><Icon name={icon} size={17} /></span>{title}</span>)}
            <div style={{ ...card, marginTop: 10, opacity: aud === "public" && !consentOk ? 0.55 : 1 }}>
              {PRIV_LABELS.map(([k, id, en]) => (
                <div key={k} onClick={() => toggle(aud, k)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid #F1F5FB", cursor: "pointer" }}>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{t(id, en)}</span><Toggle on={!!data!.s[aud][k]} label={`${title} ${en}`} />
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", fontSize: 12.5, color: C.muted }}><Icon name="lock" size={15} />{t("Chat AI dan refleksi selalu privat", "AI chats and reflections are always private")}</div>
            </div>
          </div>
        ))}

        {(active || pending) && (<>
          {sectionTitle(t("Pratinjau: ringkasan mingguan untuk wali", "Preview: your guardian's weekly update"))}
          <div style={{ background: "#fff", borderRadius: 18, padding: 14, marginTop: 10, border: "1.5px dashed #D6E6FF" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 34, height: 34, borderRadius: 11, background: C.tintYellow, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="users" size={17} /></span><div style={{ fontSize: 12.5, color: C.text2 }}>{t("Ringkasan sesuai usia, dikirim tiap Minggu", "Age-appropriate summary sent every Sunday")}</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 11 }}>
              {parentSees.map(([k, id, en]) => <div key={k} style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 12.5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, flex: "none" }} />{t(id, en)}</div>)}
              {!parentSees.length && <div style={{ fontSize: 12.5, color: C.muted }}>{t("Tidak ada yang dibagikan.", "Nothing shared.")}</div>}
            </div>
          </div>
        </>)}
        <div style={{ marginTop: 14 }}><Note icon="sparkle"><b>{t("Transparansi AI:", "AI transparency:")}</b> {t("semua konten buatan AI diberi label dan selalu bisa kamu ubah sebelum dibagikan.", "all AI content is labeled and always editable before sharing.")}</Note></div>
        {profile?.username && <button onClick={() => nav("/app/public")} style={{ display: "block", margin: "12px auto 0", border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Lihat profil publikku", "View my public profile")} →</button>}
      </div>
    </Screen>
  );
}
