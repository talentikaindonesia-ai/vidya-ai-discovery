import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { canPurchase, db, errMsg, gabungSekolah, isNative, openExternal, useApp, useDna, useKetersediaan, useTracker, webUrl } from "../store";
import { Btn, Empty, Header, Icon, ImgBox, Input, Label, Loading, LOGO, PlusTeaser, Screen, Segmented, Sheet, Tabs, TextArea, TIKA, Toggle } from "../ui";
import { C, SH, daysUntil, rpShort } from "../theme";
import { AXES, AxisKey, fmtDate, oppTypeOf, rankAxes, riasecArch, riasecLabel, timeAgo } from "../logic";
import { courseImg, IMG } from "../media";
import { bacaPembelian, cekPembayaran, LABEL_SUMBER, STATUS_ORDER } from "@/lib/pembayaran";
import { initPush, keluar } from "../push";

export type MoreScreen = "store" | "referral" | "data" | "challenges" | "achievements" | "timeline" | "articles" | "article" | "programs" | "program" | "mentorApply" | "talentCard" | "settings" | "purchases";

export default function More({ screen }: { screen: MoreScreen }) {
  switch (screen) {
    case "store": return <Store />;
    case "purchases": return <Purchases />;
    case "referral": return <Referral />;
    case "data": return <PrivacyData />;
    case "challenges": return <Challenges />;
    case "achievements": return <Achievements />;
    case "timeline": return <Timeline />;
    case "articles": return <Articles />;
    case "article": return <ArticleReader />;
    case "programs": return <Programs />;
    case "program": return <ProgramDetail />;
    case "mentorApply": return <MentorApply />;
    case "talentCard": return <TalentCard />;
    default: return <Settings />;
  }
}

/* ── bagian bersama ─────────────────────────────────────────────────── */
const card: React.CSSProperties = { background: "#fff", borderRadius: 18, boxShadow: SH.card };
const H = ({ children, right, mt = 18 }: { children: React.ReactNode; right?: React.ReactNode; mt?: number }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: mt }}><div style={{ fontSize: 16, fontWeight: 700 }}>{children}</div>{right}</div>
);
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
function Tile({ icon, c, bg, title, sub, right, onClick }: { icon: string; c: string; bg: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; onClick?: () => void }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} style={{ ...card, width: "100%", border: "none", textAlign: "left", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: onClick ? "pointer" : "default" }}>
      <span style={{ width: 42, height: 42, borderRadius: 13, background: bg, color: c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={icon} size={20} /></span>
      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{title}</span>{sub && <span style={{ display: "block", fontSize: 11.5, color: C.muted, marginTop: 1 }}>{sub}</span>}</span>
      {right}
    </Tag>
  );
}
const Check = ({ on }: { on: boolean }) => (
  <span style={{ width: 24, height: 24, borderRadius: 8, background: on ? C.green : "#fff", border: `1.5px solid ${on ? C.green : "#CBD5E1"}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on && <Icon name="check" size={13} />}</span>
);
async function shareOrCopy(text: string, url: string, toast: (m: string) => void, done: string) {
  if (navigator.share) { try { await navigator.share({ text, url }); return; } catch { return; } }
  await navigator.clipboard?.writeText(`${text} ${url}`.trim()); toast(done);
}

/* ── STORE ──────────────────────────────────────────────────────────── */
function Store() {
  const nav = useNavigate();
  const { t, user, isPro } = useApp();
  const ada = useKetersediaan();
  const buy = canPurchase();
  const { data, isLoading } = useQuery({
    queryKey: ["m-store", user?.id], enabled: !!user, staleTime: 5 * 60_000,
    queryFn: async () => {
      const [pb, own, prem, boot] = await Promise.all([
        db.from("playbooks").select("id,title,description,price,free_for_pro").eq("is_active", true).order("sort"),
        db.from("playbook_purchases").select("playbook_id").eq("user_id", user!.id),
        db.from("premium_programs").select("id,name,tagline").eq("is_active", true).order("sort_order"),
        db.rpc("list_bootcamps"),
      ]);
      const owned = new Set(((own.data ?? []) as any[]).map(o => o.playbook_id));
      return { playbooks: ((pb.data ?? []) as any[]).map(p => ({ ...p, owned: owned.has(p.id) || p.price === 0 || (p.free_for_pro && isPro) })), programs: (prem.data ?? []) as any[], bootcamps: (boot.data ?? []) as any[] };
    },
  });
  const label = (owned: boolean, price?: number | null) => owned ? t("Dimiliki", "Owned") : buy && price ? rpShort(price) : t("Lihat", "View");
  const pill = (txt: string, on = false) => <span style={{ fontSize: 11.5, fontWeight: 600, color: on ? C.green : "#fff", background: on ? C.tintGreen : C.blue, padding: "6px 11px", borderRadius: 99, flex: "none", whiteSpace: "nowrap" }}>{txt}</span>;
  return (
    <Screen>
      <Header title="Store" sub={t("Playbook, program, mentor & sertifikat", "Playbooks, programs, mentors & certificates")} />
      <div style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {!isPro && (
          <button onClick={() => nav("/app/pro")} style={{ width: "100%", textAlign: "left", border: "none", background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer", color: "#fff" }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: C.yellow, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name="star" size={21} filled /></span>
            <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>Talentika Plus</span><span style={{ display: "block", fontSize: 11.5, opacity: .9 }}>{t("Semua modul, mentor, dan sertifikat jalur", "All modules, mentors and track certificates")}</span></span>
            <Icon name="chev" size={18} />
          </button>
        )}
        {isLoading && <Loading />}
        {data && <>
          {data.playbooks.length > 0 && <H mt={6}>Playbook</H>}
          {data.playbooks.length > 0 && data.playbooks.map(p => (
            <Tile key={p.id} icon="book" c={C.text} bg={C.tintBlue} title={p.title} sub={p.description} onClick={() => nav("/app/playbooks")} right={pill(label(p.owned, p.price), p.owned)} />
          ))}
          <H mt={data.playbooks.length ? undefined : 6}>{t("Program", "Programs")}</H>
          {data.programs.map(p => <Tile key={p.id} icon="globe" c={C.amber} bg={C.tintYellow} title={p.name} sub={p.tagline} onClick={() => nav(`/app/programs/p-${p.id}`)} right={pill(t("Lihat", "View"))} />)}
          {data.bootcamps.map(b => <Tile key={b.id} icon="rocket" c={C.purple} bg={C.tintPurple} title={b.title} sub={[b.category_label, b.lesson_count ? `${b.lesson_count} ${t("pelajaran", "lessons")}` : null].filter(Boolean).join(" · ")} onClick={() => nav(`/app/programs/b-${b.slug}`)} right={pill(label(false, b.price))} />)}
          {!data.programs.length && !data.bootcamps.length && <div style={{ ...card, padding: "12px 14px", fontSize: 12.5, color: C.muted }}>{t("Belum ada program yang dibuka.", "No programs open yet.")}</div>}
          <H>{ada.mentor ? t("Mentor & sertifikat", "Mentors & certificates") : t("Sertifikat", "Certificates")}</H>
          {ada.mentor && <Tile icon="users" c={C.purple} bg={C.tintPurple} title={t("Sesi mentor 1-on-1", "1-on-1 mentor session")} sub={t("Program terpisah — tidak termasuk langganan", "Separate program — not part of any plan")} onClick={() => nav("/app/mentors")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />}
          <Tile icon="medal" c={C.teal} bg={C.tintTeal} title={t("Sertifikat terverifikasi", "Verified certificate")} sub={t("Selesaikan jalur belajar · bisa dicek lewat kode QR", "Finish a learning track · verifiable by QR code")} onClick={() => nav("/app/learn")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
        </>}
      </div>
    </Screen>
  );
}

/* ── AJAK TEMAN & PERINGKAT KELAS ───────────────────────────────────── */
function SchoolCodeSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const { t, user, toast, refreshProfile } = useApp();
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false);
  const join = async () => {
    setBusy(true);
    const r = await gabungSekolah(user!.id, code);
    setBusy(false);
    if (!r.ok) { toast(r.msg ?? t("Gagal bergabung", "Couldn't join"), "error"); return; }
    await refreshProfile();
    toast(r.verified ? t(`Bergabung dengan ${r.name}`, `Joined ${r.name}`) : t(`Bergabung dengan ${r.name} · akses sekolah aktif setelah sekolah diverifikasi`, `Joined ${r.name} · school access starts once the school is verified`));
    setCode(""); onClose(); onDone?.();
  };
  return (
    <Sheet open={open} onClose={onClose} title={t("Masukkan kode sekolah", "Enter school code")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{t("Minta kode dari guru BK atau admin sekolahmu.", "Ask your counselor or school admin for the code.")}</div>
        <Input icon="school" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="TLK-SMAN1-AB12" autoCapitalize="characters" />
        <Btn disabled={busy || code.trim().length < 4} onClick={join}>{t("Gabung sekolah", "Join school")}</Btn>
      </div>
    </Sheet>
  );
}
export { SchoolCodeSheet };

function Referral() {
  const qc = useQueryClient();
  const { t, user, profile, toast, updatePrefs } = useApp();
  const [schoolSheet, setSchoolSheet] = useState(false);
  const hidden = !!profile?.app_prefs?.hide_leaderboard;
  const { data: ref, isLoading } = useQuery({
    queryKey: ["m-referral", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: ex } = await db.from("referral_codes").select("code,total_referrals").eq("user_id", user!.id).eq("is_active", true).maybeSingle();
      if (ex) return ex;
      // Sama dengan ReferralCard di web: kode tetap dari user id
      const code = `TLK-${user!.id.replace(/-/g, "").toUpperCase().slice(0, 6)}`;
      const { data: made } = await db.from("referral_codes").insert({ user_id: user!.id, code, commission_rate: 10, is_active: true }).select("code,total_referrals").single();
      return made ?? null;
    },
  });
  const { data: lb, isLoading: lbLoading } = useQuery({
    queryKey: ["m-leaderboard", user?.id, profile?.school_code], enabled: !!user,
    queryFn: async () => (await db.rpc("leaderboard_kelas", { p_limit: 10 })).data as { status: string; class?: string; rows?: { rank: number; name: string; xp: number; is_me: boolean }[] } | null,
  });
  const link = ref?.code ? webUrl(`/auth?ref=${ref.code}`) : "";
  const share = () => shareOrCopy(t("Yuk temukan bakat & peluangmu di Talentika!", "Discover your talents & opportunities on Talentika!"), link, m => toast(m), t("Link undangan disalin", "Invite link copied"));
  const n = ref?.total_referrals ?? 0;
  const colors = [C.purple, C.blue, C.amber, C.teal, C.green, C.red];
  return (
    <Screen>
      <Header title={t("Ajak Teman", "Invite Friends")} sub={t("Bertumbuh bersama", "Grow together")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 22, padding: 18, color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,209,70,.85)" }} />
          <div style={{ position: "relative", fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{t("Ajak teman bergabung,", "Invite a friend,")}<br />{t("kamu dapat +100 XP", "you earn +100 XP")}</div>
          <div style={{ position: "relative", marginTop: 12, display: "inline-block", fontSize: 22, fontWeight: 800, letterSpacing: 2, background: "rgba(255,255,255,.18)", borderRadius: 12, padding: "6px 14px" }}>{isLoading ? "…" : ref?.code ?? "—"}</div>
          <button onClick={share} disabled={!link} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, marginTop: 14, height: 44, border: "none", borderRadius: 13, background: "#fff", color: C.blue, fontSize: 13.5, fontWeight: 700, padding: "0 16px", cursor: "pointer" }}><Icon name="share" size={17} />{t("Bagikan link undangan", "Share invite link")}</button>
          <div style={{ position: "relative", marginTop: 10, fontSize: 12, opacity: .9 }}>{t(`${n} teman bergabung · +${n * 100} XP didapat`, `${n} friends joined · +${n * 100} XP earned`)}</div>
        </div>

        <H right={lb?.status === "ok" ? <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: C.muted }}>{t("Tampilkan aku", "Show me")}<Toggle on={!hidden} onClick={async () => { await updatePrefs({ hide_leaderboard: !hidden }); qc.invalidateQueries({ queryKey: ["m-leaderboard"] }); }} label={t("Tampilkan aku di peringkat kelas", "Show me on the class leaderboard")} /></span> : undefined}>{t("Peringkat kelas", "Class leaderboard")}</H>
        {lbLoading && <Loading />}
        {!lbLoading && !lb && <div style={{ ...card, padding: "12px 14px", marginTop: 10, fontSize: 12.5, color: C.muted }}>{t("Peringkat kelas belum bisa dimuat. Coba lagi nanti.", "The class leaderboard couldn't load. Try again later.")}</div>}
        {lb?.status === "no_school" && (
          <div style={{ ...card, padding: 16, marginTop: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Gabung sekolahmu dulu", "Join your school first")}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{t("Peringkat hanya dibandingkan dengan teman sekelas. Masukkan kode dari gurumu.", "Rankings only compare you with classmates. Enter the code from your teacher.")}</div>
            <Btn kind="soft" h={42} onClick={() => setSchoolSheet(true)} style={{ marginTop: 10 }}>{t("Masukkan kode sekolah", "Enter school code")}</Btn>
          </div>
        )}
        {lb?.status === "no_class" && <div style={{ ...card, padding: "12px 14px", marginTop: 10, fontSize: 12.5, color: C.muted }}>{t("Kelasmu belum diatur oleh sekolah, jadi peringkat kelas belum tersedia.", "Your class hasn't been set by the school yet, so the class leaderboard isn't available.")}</div>}
        {lb?.status === "ok" && (hidden ? (
          <div style={{ ...card, padding: "12px 14px", marginTop: 10, fontSize: 12.5, color: C.muted }}>{t("Kamu disembunyikan dari peringkat. XP-mu tetap dihitung.", "You're hidden from the leaderboard. Your XP still counts.")}</div>
        ) : (
          <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
            {(lb.rows ?? []).map((r, i, a) => (
              <div key={r.rank + r.name + i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid #F1F5FB" : "none", background: r.is_me ? C.tintBlue : "transparent", margin: r.is_me ? "0 -14px" : 0, paddingLeft: r.is_me ? 14 : 0, paddingRight: r.is_me ? 14 : 0 }}>
                <span style={{ width: 22, fontSize: 13, fontWeight: 700, color: r.rank <= 3 ? C.amber : C.muted }}>{r.rank}</span>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: colors[i % colors.length], color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{r.name.slice(0, 2).toUpperCase()}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: r.is_me ? 700 : 500 }}>{r.name}{r.is_me ? ` (${t("kamu", "you")})` : ""}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.blue }}>{r.xp.toLocaleString("id-ID")} XP</span>
              </div>
            ))}
            {!(lb.rows ?? []).length && <div style={{ padding: "12px 0", fontSize: 12.5, color: C.muted }}>{t("Belum ada XP di kelasmu.", "No XP in your class yet.")}</div>}
          </div>
        ))}
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}><Icon name="shield" size={14} />{t("Hanya terlihat oleh teman sekelas, dengan nama depan saja. Tidak ada peringkat publik untuk pelajar.", "Visible only to your classmates, first names only. No public ranking for students.")}</div>
      </div>
      <SchoolCodeSheet open={schoolSheet} onClose={() => setSchoolSheet(false)} onDone={() => qc.invalidateQueries({ queryKey: ["m-leaderboard"] })} />
    </Screen>
  );
}

/* ── PEMBELIAN SAYA ─────────────────────────────────────────────────── */
function Purchases() {
  const { t, lang, user } = useApp();
  const [params] = useSearchParams();
  const ref = params.get("ref");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["m-purchases", user?.id, ref], enabled: !!user,
    queryFn: async () => { if (ref) await cekPembayaran(ref); return bacaPembelian(); },
  });
  const card = { background: "#fff", borderRadius: 18, boxShadow: SH.card, padding: "4px 14px", marginTop: 10 } as const;
  const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
  if (isLoading) return <Loading />;
  return (
    <Screen>
      <Header title={t("Pembelian saya", "My purchases")} />
      <div style={{ padding: "14px 20px 28px" }}>
        {isError && <Empty title={t("Gagal memuat pembelian", "Couldn't load purchases")} />}
        {data && (
          <>
            <H mt={4}>{t("Yang kamu miliki", "What you own")}</H>
            <div style={card}>
              {!data.hak.length && <div style={{ padding: "12px 0", fontSize: 13, color: C.muted }}>{t("Belum ada pembelian aktif.", "No active purchases yet.")}</div>}
              {data.hak.map((h, i) => (
                <div key={`${h.kode}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: i < data.hak.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                  <span style={{ minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>{h.nama}</span><span style={{ fontSize: 11.5, color: C.muted }}>{LABEL_SUMBER[h.sumber] ?? h.sumber}</span></span>
                  <span style={{ flexShrink: 0, fontSize: 11.5, color: C.muted, textAlign: "right" }}>{h.berakhir ? `${t("Sampai", "Until")} ${fmtDate(h.berakhir, lang)}` : t("Permanen", "Permanent")}</span>
                </div>
              ))}
            </div>
            <H>{t("Riwayat pembelian", "Purchase history")}</H>
            <div style={card}>
              {!data.orders.length && <div style={{ padding: "12px 0", fontSize: 13, color: C.muted }}>{t("Belum ada riwayat pembelian.", "No purchase history yet.")}</div>}
              {data.orders.map((o, i) => (
                <div key={o.id} style={{ padding: "11px 0", borderBottom: i < data.orders.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0 }}>{o.item.join(", ") || t("Pembelian", "Purchase")}</span>
                    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700 }}>{rupiah(o.total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 3, fontSize: 11.5, color: C.muted }}>
                    <span>{o.nomor} · {fmtDate(o.dibuat, lang)}</span>
                    <span style={{ flexShrink: 0 }}>{STATUS_ORDER[o.status]?.label ?? o.status}</span>
                  </div>
                  {o.lanjut_url && <Btn h={38} onClick={() => openExternal(o.lanjut_url!)} style={{ marginTop: 8, fontSize: 13 }}>{t("Lanjutkan pembayaran", "Continue payment")}</Btn>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

/* ── PRIVASI & DATA ─────────────────────────────────────────────────── */
function PrivacyData() {
  const nav = useNavigate();
  const { t, lang, user, profile, toast, updatePrefs } = useApp();
  const [delSheet, setDelSheet] = useState(false); const [confirmTxt, setConfirmTxt] = useState(""); const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["m-consents", user?.id], enabled: !!user,
    queryFn: async () => {
      const [pl, sm] = await Promise.all([
        db.from("parent_links").select("status,parent_contact,consent_at,created_at").eq("student_user_id", user!.id).order("created_at", { ascending: false }).limit(1),
        db.from("school_members").select("school_code,joined_at,status").eq("student_user_id", user!.id).order("joined_at", { ascending: false }).limit(1),
      ]);
      return { parent: (pl.data ?? [])[0] ?? null, school: (sm.data ?? [])[0] ?? null };
    },
  });
  const notif = profile?.app_prefs?.notif || {};
  const promoOn = notif.promo !== false;
  const exportData = async () => {
    setBusy(true);
    const uid = user!.id;
    const tables = ["profiles", "talent_dna_answers", "talent_dna_modules_done", "user_skills", "saved_opportunities", "user_goals", "plan_tasks", "projects", "project_evidence", "user_achievements", "learning_progress", "learning_reflections", "portfolio_items", "certificates", "mentor_bookings", "ai_messages", "sharing_settings", "career_readiness_snapshots"];
    const out: Record<string, any> = { exported_at: new Date().toISOString() };
    for (const tb of tables) { const { data: d } = await db.from(tb).select("*").eq("user_id", uid); out[tb] = d ?? []; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = `talentika-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setBusy(false); toast(t("Data diekspor", "Data exported"));
  };
  const deleteAccount = async () => {
    setBusy(true);
    const { data: r, error } = await supabase.functions.invoke("hapus-akun", { body: { confirm: "HAPUS" } });
    setBusy(false);
    if (error) { toast(t("Gagal memproses. Hubungi support.", "Couldn't process. Contact support."), "error"); return; }
    toast(r?.pending ? r.message : t("Akunmu sudah dihapus.", "Your account has been deleted."));
    await keluar(); nav("/app", { replace: true });
  };
  const p = data?.parent;
  const rows: [string, string][] = [
    [t("Persetujuan wali", "Guardian consent"), p?.status === "active" ? `${p.parent_contact} · ${fmtDate(p.consent_at, lang)}` : p?.status === "pending" ? t(`Menunggu · ${p.parent_contact}`, `Pending · ${p.parent_contact}`) : t("Belum ada", "None yet")],
    [t("Berbagi progres dengan sekolah", "Share progress with school"), data?.school ? `${profile?.school_name ?? data.school.school_code} · ${fmtDate(data.school.joined_at, lang)}` : t("Tidak terhubung ke sekolah", "Not linked to a school")],
  ];
  return (
    <Screen>
      <Header title={t("Privasi & Data", "Privacy & Data")} sub={t("Datamu, kendalimu (UU PDP)", "Your data, your control (PDP Law)")}
        right={<button onClick={() => openExternal(webUrl("/privacy"))} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Kebijakan", "Policy")}</button>} />
      <div style={{ padding: "14px 20px 0" }}>
        <H mt={4}>{t("Riwayat persetujuan", "Consent history")}</H>
        <div style={{ ...card, padding: "4px 16px", marginTop: 10 }}>
          {rows.map(([a, b]) => <div key={a} style={{ padding: "12px 0", borderBottom: "1px solid #F1F5FB" }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{a}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{b}</div></div>)}
          <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("Info promo & program baru", "Promos & new programs")}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{promoOn ? t("Aktif · maks 2× sebulan", "On · max twice a month") : t("Mati", "Off")}</div></div>
            <Toggle on={promoOn} onClick={() => updatePrefs({ notif: { ...notif, promo: !promoOn } })} label={t("Info promo", "Promos")} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
          <Tile icon="users" c={C.blue} bg={C.tintBlue} title={t("Atur yang dilihat wali & sekolah", "Manage what guardian & school see")} onClick={() => nav("/app/privacy")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
          <Tile icon="download" c={C.green} bg={C.tintGreen} title={busy ? "…" : t("Ekspor dataku (JSON)", "Export my data (JSON)")} sub={t("Profil, Talent DNA, proyek, chat AI, dan lainnya", "Profile, Talent DNA, projects, AI chats and more")} onClick={exportData} />
          <Tile icon="trash" c={C.red} bg={C.tintRed} title={<span style={{ color: C.red }}>{t("Hapus akun", "Delete account")}</span>} sub={t("Data pribadi dihapus paling lambat 30 hari", "Personal data deleted within 30 days")} onClick={() => setDelSheet(true)} />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: C.muted, lineHeight: 1.5 }}><Icon name="lock" size={14} />{t("Chat AI tidak dipakai untuk melatih model pihak ketiga.", "AI chats are not used to train third-party models.")}</div>
      </div>
      <Sheet open={delSheet} onClose={() => setDelSheet(false)} title={t("Hapus akun permanen", "Delete account permanently")}>
        <p style={{ margin: 0, fontSize: 13.5, color: C.text2, lineHeight: 1.6 }}>{t("Semua data pribadimu (profil, Talent DNA, proyek, chat AI) akan dihapus paling lambat 30 hari. Ekspor datamu dulu bila perlu. Ketik HAPUS untuk konfirmasi.", "All your personal data (profile, Talent DNA, projects, AI chats) will be deleted within 30 days. Export first if needed. Type HAPUS to confirm.")}</p>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <Input value={confirmTxt} onChange={e => setConfirmTxt(e.target.value)} placeholder="HAPUS" />
          <Btn disabled={confirmTxt !== "HAPUS" || busy} onClick={deleteAccount} style={{ background: C.red, boxShadow: "none" }}>{t("Hapus akunku", "Delete my account")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── TANTANGAN ──────────────────────────────────────────────────────── */
function Challenges() {
  const nav = useNavigate();
  const { t, user, gam } = useApp();
  const { data, isLoading } = useQuery({
    queryKey: ["m-challenges", user?.id], enabled: !!user, staleTime: 30_000,
    queryFn: async () => {
      const since = todayStart(), uid = user!.id;
      const [st, stage, rep, post, quiz, xl, ch] = await Promise.all([
        db.from("user_streaks").select("streak_type,current_streak").eq("user_id", uid),
        db.from("course_stage_progress").select("stage", { count: "exact", head: true }).eq("user_id", uid).gte("completed_at", since),
        db.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", since),
        db.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", since),
        db.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("completed_at", since),
        db.from("xp_ledger").select("amount").eq("user_id", uid).gte("created_at", since),
        db.from("community_challenges").select("*").eq("is_active", true).or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`).order("end_date", { ascending: true, nullsFirst: false }).limit(1),
      ]);
      const weekly = (ch.data ?? [])[0] ?? null;
      let mine: any = null;
      if (weekly) mine = (await db.from("user_challenges").select("status,submission_data").eq("user_id", uid).eq("challenge_id", weekly.id).maybeSingle()).data;
      const streaks = (st.data ?? []) as any[];
      return {
        streak: Math.max(0, ...streaks.filter(s => s.streak_type === "learning" || s.streak_type === "login").map(s => s.current_streak ?? 0)),
        lesson: (stage.count ?? 0) > 0, comm: ((rep.count ?? 0) + (post.count ?? 0)) > 0, quiz: (quiz.count ?? 0) > 0,
        xp: ((xl.data ?? []) as any[]).reduce((a, r) => a + Math.max(0, r.amount ?? 0), 0),
        weekly, mine, draft: weekly ? JSON.parse(localStorage.getItem(`tk-ch:${weekly.id}`) || "{}") : {},
      };
    },
  });
  if (isLoading || !data) return <Loading />;
  const daily: [boolean, string, string, string, string][] = [
    [data.lesson, t("Selesaikan 1 tahap materi", "Finish 1 course stage"), "book", C.blue, "/app/learn"],
    [data.comm, t("Tulis 1 postingan atau balasan di komunitas", "Write 1 community post or reply"), "msg", C.purple, "/app/community"],
    [data.quiz, t("Kerjakan 1 kuis", "Answer 1 quiz"), "puzzle", C.amber, "/app/learn"],
  ];
  const done = daily.filter(d => d[0]).length;
  const parts = ["idea", "prototype", "presentation", "reflection"];
  const src = data.mine?.submission_data ?? data.draft ?? {};
  const pdone = parts.filter(p => src[p]).length;
  const submitted = data.mine && ["submitted", "completed"].includes(data.mine.status);
  const left = data.weekly?.end_date ? Math.max(0, Math.ceil((+new Date(data.weekly.end_date) - Date.now()) / 86400000)) : null;
  return (
    <Screen>
      <Header title={t("Tantangan", "Challenges")} sub={t("Harian & mingguan", "Daily & weekly")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ background: "linear-gradient(120deg,#FFF6DB,#FFE9A8)", borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#F59E0B", display: "flex" }}><Icon name="flame" size={30} /></span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800 }}>{t(`${data.streak} hari beruntun`, `${data.streak}-day streak`)}</div><div style={{ fontSize: 11.5, color: "#7A5200" }}>{done ? t("Mantap! Tantangan hari ini sudah jalan.", "Nice! Today's challenge is underway.") : t("Selesaikan 1 tantangan hari ini untuk lanjut", "Finish 1 challenge today to keep it going")}</div></div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#7A5200" }}>{done}/3</span>
        </div>
        <H right={gam ? <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>+{data.xp} XP {t("hari ini", "today")}</span> : undefined}>{t("Tantangan harian", "Daily challenges")}</H>
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {daily.map(([on, txt, ic, c, to], i) => (
            <button key={txt} onClick={() => !on && nav(to)} style={{ width: "100%", border: "none", background: "none", borderBottom: i < 2 ? "1px solid #F1F5FB" : "none", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: on ? "default" : "pointer", textAlign: "left" }}>
              <Check on={on} />
              <span style={{ color: c, display: "flex" }}><Icon name={ic} size={18} /></span>
              <span style={{ flex: 1, fontSize: 13.5, color: on ? C.muted : C.text, textDecoration: on ? "line-through" : "none" }}>{txt}</span>
              {!on && <span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={16} /></span>}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 6 }}>{t("Tercentang otomatis dari aktivitasmu hari ini. XP diberikan oleh aktivitasnya.", "Ticked automatically from today's activity. XP comes from the activity itself.")}</div>
        <H>{t("Tantangan mingguan", "Weekly challenge")}</H>
        {data.weekly ? (
          <div style={{ marginTop: 10, background: "linear-gradient(120deg,#0066FF,#00A3E0)", borderRadius: 20, padding: 16, color: "#fff" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".6px", color: C.yellow }}>{left !== null ? t(`BERAKHIR ${left} HARI LAGI`, `ENDS IN ${left} DAYS`) : t("TANPA BATAS WAKTU", "NO DEADLINE")}{data.weekly.xp_reward ? ` · +${data.weekly.xp_reward} XP` : ""}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{data.weekly.title}</div>
            {data.weekly.description && <div style={{ fontSize: 12, opacity: .9, marginTop: 4, lineHeight: 1.5 }}>{data.weekly.description}</div>}
            <div style={{ height: 7, borderRadius: 99, background: "rgba(255,255,255,.25)", marginTop: 12 }}><div style={{ width: `${(pdone / 4) * 100}%`, height: "100%", borderRadius: 99, background: C.yellow }} /></div>
            <div style={{ fontSize: 11.5, opacity: .9, marginTop: 6 }}>{t(`${pdone} dari 4 bagian`, `${pdone} of 4 parts`)}{submitted ? ` · ${t("terkirim", "submitted")}` : ""}</div>
            <button onClick={() => nav(`/app/challenge/${data.weekly.id}`)} style={{ marginTop: 12, height: 40, border: "none", borderRadius: 12, background: "#fff", color: C.blue, fontSize: 13, fontWeight: 700, padding: "0 16px", cursor: "pointer" }}>{submitted ? t("Lihat kiriman", "View submission") : pdone ? t("Lanjutkan", "Continue") : t("Ikut", "Join")}</button>
          </div>
        ) : <div style={{ ...card, padding: "12px 14px", marginTop: 10, fontSize: 12.5, color: C.muted }}>{t("Belum ada tantangan minggu ini. Cek lagi nanti.", "No challenge this week. Check back later.")}</div>}
        <Btn kind="outline" h={46} onClick={() => nav("/app/referral")} style={{ marginTop: 14 }}><Icon name="trophy" size={17} />{t("Peringkat kelas", "Class leaderboard")}</Btn>
      </div>
    </Screen>
  );
}

/* ── PENCAPAIAN ─────────────────────────────────────────────────────── */
function Achievements() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { t, lang, user, toast, afterAction } = useApp();
  const { done: dnaDone } = useDna();
  const [form, setForm] = useState(!!params.get("from") || params.has("catat"));
  const [title, setTitle] = useState(""); const [event, setEvent] = useState(params.get("from") ?? "");
  const [year, setYear] = useState(String(new Date().getFullYear())); const [medal, setMedal] = useState("🏅");
  const [skills, setSkills] = useState(""); const [url, setUrl] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["m-ach", user?.id], enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [ach, lp, proj, posts, replies, xp, st, mb, pf, so, certs] = await Promise.all([
        db.from("user_achievements").select("*").eq("user_id", uid).order("year", { ascending: false }),
        db.from("learning_progress").select("completed_at").eq("user_id", uid).eq("status", "completed").order("completed_at", { ascending: true }),
        db.from("projects").select("status,updated_at").eq("user_id", uid).eq("status", "completed").order("updated_at", { ascending: true }),
        db.from("forum_posts").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("forum_replies").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("user_xp").select("total_xp_earned").eq("user_id", uid).maybeSingle(),
        db.from("user_streaks").select("longest_streak").eq("user_id", uid),
        db.from("mentor_bookings").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "completed"),
        db.from("portfolio_items").select("id", { count: "exact", head: true }).eq("user_id", uid),
        db.from("saved_opportunities").select("status,applied_at,opportunity_type,opportunity_title").eq("user_id", uid),
        db.from("certificates").select("title,issuer,issue_date,verification_code").eq("user_id", uid).eq("is_active", true).order("issue_date", { ascending: false }),
      ]);
      return {
        ach: (ach.data ?? []) as any[], courses: (lp.data ?? []) as any[], projects: (proj.data ?? []) as any[], community: (posts.count ?? 0) + (replies.count ?? 0),
        xp: xp.data?.total_xp_earned ?? 0, longest: Math.max(0, ...((st.data ?? []) as any[]).map(s => s.longest_streak ?? 0)), mentor: mb.count ?? 0, portfolio: pf.count ?? 0,
        apps: ((so.data ?? []) as any[]).filter(a => a.applied_at || ["applied", "selection", "accepted", "completed"].includes(a.status)), certs: (certs.data ?? []) as any[],
      };
    },
  });
  const add = async () => {
    const { error } = await db.from("user_achievements").insert({ user_id: user!.id, title: title.trim(), event: event.trim(), year: +year, medal, skills: skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 6), evidence_url: /^https?:\/\//.test(url) ? url : null });
    if (error) { toast(errMsg(error), "error"); return; }
    setTitle(""); setEvent(""); setSkills(""); setUrl(""); setForm(false); qc.invalidateQueries({ queryKey: ["m-ach"] }); qc.invalidateQueries({ queryKey: ["m-profile-extra"] });
    await afterAction(t("Prestasi dicatat", "Achievement logged"));
  };
  if (isLoading || !data) return <Loading />;
  const badges: [string, string, string, boolean][] = [
    [t("Materi Pertama", "First Course"), "star", C.amber, data.courses.length > 0],
    [t("Pembangun Inovasi", "Innovation Builder"), "rocket", C.blue, data.projects.length > 0],
    [t("Kontributor Komunitas", "Community Contributor"), "heart", C.purple, data.community > 0],
    [t("Pembelajar Unggul", "Top Learner"), "trophy", C.orange, data.xp >= 1000],
    [t("7 Hari Beruntun", "7-Day Streak"), "flame", C.red, data.longest >= 7],
    [t("Ngobrol dengan Mentor", "Mentor Talk"), "users", C.teal, data.mentor > 0],
    [t("Portofolio Lengkap", "Full Portfolio"), "folder", C.sky, data.portfolio >= 5],
    [t("Penjelajah Global", "Global Explorer"), "globe", C.green, data.apps.some(a => oppTypeOf(a.opportunity_type, a.opportunity_title) === "Global")],
  ];
  const got = badges.filter(b => b[3]).length;
  const firstApp = data.apps.map(a => a.applied_at).filter(Boolean).sort()[0];
  const miles: [string, string | null, boolean][] = [
    [t("Talent Discovery dimulai", "Talent Discovery started"), null, dnaDone > 0],
    [t("Materi pertama selesai", "First course completed"), data.courses[0]?.completed_at ?? null, data.courses.length > 0],
    [t("Proyek pertama selesai", "First project completed"), data.projects[0]?.updated_at ?? null, data.projects.length > 0],
    [t("Daftar peluang pertama", "First opportunity applied"), firstApp ?? null, data.apps.length > 0],
  ];
  return (
    <Screen>
      <Header title={t("Pencapaian", "Achievements")} sub={t("Badge, sertifikat & milestone", "Badges, certificates & milestones")} />
      <div style={{ padding: "14px 20px 0" }}>
        <H mt={4}>{t(`Badge · ${got} dari ${badges.length}`, `Badges · ${got} of ${badges.length}`)}</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px 6px", marginTop: 12 }}>
          {badges.map(([n, ic, c, on]) => (
            <div key={n} style={{ textAlign: "center", opacity: on ? 1 : .55 }}>
              <span style={{ width: 54, height: 54, margin: "0 auto", borderRadius: "50%", background: on ? c : "#E2E8F0", color: on ? "#fff" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: on ? "0 6px 14px rgba(15,23,42,.14)" : "none" }}><Icon name={on ? ic : "lock"} size={on ? 23 : 18} filled={on && ic === "star"} /></span>
              <div style={{ fontSize: 10.5, fontWeight: 500, marginTop: 6, lineHeight: 1.25 }}>{n}</div>
            </div>
          ))}
        </div>

        <H>{t("Sertifikat", "Certificates")}</H>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {data.certs.map(c => (
            <button key={c.verification_code} onClick={() => openExternal(webUrl(`/sertifikat/${c.verification_code}`))} style={{ ...card, border: "none", width: "100%", textAlign: "left", padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <ImgBox src={courseImg(null, c.title)} w={56} h={48} r={11} />
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: C.text }}>{c.title}</span><span style={{ display: "block", fontSize: 11.5, color: C.muted }}>{c.issuer} · {fmtDate(c.issue_date, lang)}</span></span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: C.green, background: C.tintGreen, padding: "3px 9px", borderRadius: 99 }}>{t("Terverifikasi", "Verified")}</span>
            </button>
          ))}
          {!data.certs.length && <div style={{ ...card, padding: "12px 14px", fontSize: 12.5, color: C.muted }}>{t("Selesaikan jalur belajar untuk mendapat sertifikat ber-kode verifikasi.", "Finish a learning track to earn a verifiable certificate.")}</div>}
        </div>

        <H>Milestone</H>
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {miles.map(([m, d, on], i) => (
            <div key={m} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < miles.length - 1 ? "1px solid #F1F5FB" : "none" }}>
              <Check on={on} /><span style={{ flex: 1, fontSize: 13.5, color: on ? C.text : C.faint }}>{m}</span><span style={{ fontSize: 11.5, color: C.muted }}>{d ? fmtDate(d, lang) : on ? "✓" : "—"}</span>
            </div>
          ))}
        </div>

        <H right={<button onClick={() => setForm(true)} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>{t("+ Catat", "+ Log")}</button>}>{t("Prestasi lomba & penghargaan", "Competitions & awards")}</H>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
          {data.ach.map(a => (
            <div key={a.id} style={{ ...card, display: "flex", gap: 12, padding: 12, alignItems: "center" }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: C.tintYellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flex: "none" }}>{a.medal}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.title}</div><div style={{ fontSize: 11.5, color: C.muted }}>{a.event} · {a.year}</div>
                <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, fontWeight: 600, color: a.verified ? C.green : C.faint, background: a.verified ? C.tintGreen : C.soft, padding: "2px 9px", borderRadius: 99 }}>{a.verified ? t("Terverifikasi", "Verified") : t("Dilaporkan sendiri", "Self-reported")}</span></div>
              <button onClick={async () => { await db.from("user_achievements").delete().eq("id", a.id); qc.invalidateQueries({ queryKey: ["m-ach"] }); }} aria-label={t("Hapus", "Delete")} style={{ border: "none", background: "none", color: C.disabled, cursor: "pointer", display: "flex" }}><Icon name="x" size={15} /></button>
            </div>
          ))}
          {!data.ach.length && <div style={{ ...card, padding: "12px 14px", fontSize: 12.5, color: C.muted }}>{t("Catat lomba, olimpiade, atau penghargaanmu. Yang terverifikasi berbobot lebih besar di Career Readiness.", "Log your competitions, olympiads or awards. Verified ones weigh more in Career Readiness.")}</div>}
        </div>
      </div>
      <Sheet open={form} onClose={() => setForm(false)} title={t("Catat prestasi", "Log an achievement")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", gap: 6 }}>{["🥇", "🥈", "🥉", "🏅", "🏆", "🎖️"].map(m => <button key={m} onClick={() => setMedal(m)} aria-pressed={medal === m} style={{ flex: 1, height: 42, border: `1.5px solid ${medal === m ? C.blue : C.line}`, borderRadius: 12, background: medal === m ? C.tintBlue : "#fff", fontSize: 19, cursor: "pointer" }}>{m}</button>)}</div>
          <Input placeholder={t("Gelar · Gold Winner / Finalis", "Title · Gold Winner / Finalist")} value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder={t("Kegiatan · Olimpiade Robotik Nasional", "Event · National Robotics Olympiad")} value={event} onChange={e => setEvent(e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 9 }}><Input inputMode="numeric" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} /><Input placeholder="Skills · Robotics, Teamwork" value={skills} onChange={e => setSkills(e.target.value)} /></div>
          <Input icon="link" placeholder={t("Link bukti (opsional)", "Evidence link (optional)")} value={url} onChange={e => setUrl(e.target.value)} />
          <Btn disabled={title.trim().length < 2 || event.trim().length < 2 || +year < 2000} onClick={add}>{t("Simpan", "Save")}</Btn>
        </div>
      </Sheet>
    </Screen>
  );
}

/* ── TIMELINE ───────────────────────────────────────────────────────── */
const reasonIcon = (r: string): [string, string] =>
  /materi|kursus|course|belajar|pelajaran/i.test(r) ? ["book", C.blue] : /kuis|quiz/i.test(r) ? ["puzzle", C.amber] : /proyek|project/i.test(r) ? ["folder", C.orange]
    : /tantangan|challenge/i.test(r) ? ["trophy", C.amber] : /ajak|referral/i.test(r) ? ["users", C.teal] : /login|masuk|streak|beruntun/i.test(r) ? ["flame", C.red]
    : /sertifikat|certificate/i.test(r) ? ["medal", C.teal] : /dna|talent/i.test(r) ? ["sparkle", C.purple] : ["star", C.blue];
function Timeline() {
  const nav = useNavigate();
  const { t, lang, user, isPro, openPaywall } = useApp();
  const { data: tracker } = useTracker();
  const { data, isLoading } = useQuery({
    queryKey: ["m-timeline", user?.id], enabled: !!user,
    queryFn: async () => {
      const [xl, so] = await Promise.all([
        db.from("xp_ledger").select("reason,amount,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(40),
        db.from("saved_opportunities").select("opportunity_title,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(15),
      ]);
      const items = [
        ...((xl.data ?? []) as any[]).map(r => { const [icon, c] = reasonIcon(r.reason ?? ""); return { at: r.created_at, t: r.reason || "XP", sub: r.amount > 0 ? `+${r.amount} XP` : "", icon, c }; }),
        ...((so.data ?? []) as any[]).map(r => ({ at: r.created_at, t: `${t("Menyimpan", "Saved")} ${r.opportunity_title}`, sub: "", icon: "bookmark", c: C.purple })),
      ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 40);
      return items;
    },
  });
  const deadlines = (tracker ?? []).filter(x => x.deadline && !["accepted", "completed", "rejected"].includes(x.status) && (daysUntil(x.deadline) ?? -1) >= 0)
    .sort((a, b) => +new Date(a.deadline!) - +new Date(b.deadline!)).slice(0, 5);
  const today = new Date(todayStart()).getTime(), week = today - 6 * 86400000;
  const groups: [string, any[]][] = [[t("Hari ini", "Today"), []], [t("Minggu ini", "This week"), []], [t("Sebelumnya", "Earlier"), []]];
  // Free: progres dasar (7 hari terakhir); riwayat lengkap = Plus
  (data ?? []).forEach(it => { const ts = +new Date(it.at); if (!isPro && ts < week) return; groups[ts >= today ? 0 : ts >= week ? 1 : 2][1].push(it); });
  const lamaTerkunci = !isPro && (data ?? []).some(it => +new Date(it.at) < week);
  return (
    <Screen>
      <Header title="Timeline" sub={t("Aktivitas & deadline tersimpan", "Activity & saved deadlines")} />
      <div style={{ padding: "14px 20px 0" }}>
        <H mt={4} right={<button onClick={() => nav("/app/tracker")} style={{ border: "none", background: "none", fontSize: 12.5, fontWeight: 600, color: C.blue, cursor: "pointer" }}>Tracker</button>}>{t("Deadline tersimpan", "Saved deadlines")}</H>
        {deadlines.length ? (
          <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "10px -20px 0", padding: "0 20px 4px" }}>
            {deadlines.map(d => {
              const n = daysUntil(d.deadline)!; const c = n <= 3 ? C.red : n <= 10 ? C.amber : C.blue;
              return (
                <button key={d.id} onClick={() => nav(`/app/opportunities/${d.opportunity_id}`)} style={{ ...card, border: "none", flex: "none", width: 190, textAlign: "left", padding: 14, cursor: "pointer", borderTop: `4px solid ${c}` }}>
                  <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: c }}>{n === 0 ? t("Hari ini", "Today") : t(`${n} hari lagi`, `${n} days left`)}</span>
                  <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13.5, fontWeight: 600, color: C.text, marginTop: 4, lineHeight: 1.3 } as any}>{d.opportunity_title}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.muted, marginTop: 6 }}><Icon name="cal" size={13} />{fmtDate(d.deadline!, lang)}</span>
                </button>
              );
            })}
          </div>
        ) : <div style={{ ...card, padding: "12px 14px", marginTop: 10, fontSize: 12.5, color: C.muted }}>{t("Belum ada deadline tersimpan. Simpan peluang agar kami ingatkan.", "No saved deadlines yet. Save opportunities so we can remind you.")}</div>}
        {isLoading && <Loading />}
        {groups.filter(g => g[1].length).map(([g, items]) => (
          <div key={g}>
            <H>{g}</H>
            <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < items.length - 1 ? "1px solid #F1F5FB" : "none" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: C.soft, color: it.c, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={it.icon} size={16} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 13, color: C.text, lineHeight: 1.35 }}>{it.t}</span>{it.sub && <span style={{ display: "block", fontSize: 11, color: C.green, fontWeight: 600 }}>{it.sub}</span>}</span>
                  <span style={{ fontSize: 11, color: C.faint, flex: "none" }}>{timeAgo(it.at, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {lamaTerkunci && <PlusTeaser onClick={() => openPaywall("timeline")} style={{ marginTop: 14 }}
          title={t("Riwayat sebelum minggu ini", "History before this week")}
          body={t("Riwayat dan progres lengkap tersedia di Plus.", "Full history and progress are in Plus.")} />}
        {!isLoading && !(data ?? []).length && <Empty icon="clock" title={t("Belum ada aktivitas", "No activity yet")} body={t("Mulai belajar, simpan peluang, atau kerjakan proyek — semuanya tercatat di sini.", "Start learning, save opportunities or build a project — it all shows up here.")} />}
      </div>
    </Screen>
  );
}

/* ── ARTIKEL ────────────────────────────────────────────────────────── */
function Articles() {
  const nav = useNavigate();
  const { t } = useApp();
  const [cat, setCat] = useState<string>("all");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["m-articles"], staleTime: 10 * 60_000,
    queryFn: async () => { const r = await db.from("articles").select("id,title,slug,excerpt,featured_image_url,category,reading_time_minutes,published_at").eq("is_published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(60); if (r.error) throw r.error; return (r.data ?? []) as any[]; },
  });
  const cats = Array.from(new Set((data ?? []).map(a => a.category).filter(Boolean))) as string[];
  const list = (data ?? []).filter(a => cat === "all" || a.category === cat);
  return (
    <Screen>
      <Header title={t("Artikel", "Articles")} sub={t("Dari talentika.id", "From talentika.id")} />
      <div style={{ padding: "14px 20px 0" }}>
        {cats.length > 1 && <Tabs value={cat} onChange={v => setCat(v as string)} items={[{ value: "all", label: t("Semua", "All") }, ...cats.map(c => ({ value: c, label: c }))]} />}
        <div className="tk-grid2" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {isLoading && <Loading />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {list.map(a => (
            <button key={a.id} onClick={() => nav(`/app/articles/${a.slug}`)} style={{ ...card, border: "none", width: "100%", textAlign: "left", padding: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <ImgBox src={a.featured_image_url && /^https?:\/\//.test(a.featured_image_url) ? a.featured_image_url : courseImg(null, a.title)} w={88} h={76} r={13} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>{a.category && <span style={{ fontSize: 10.5, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "2px 8px", borderRadius: 6 }}>{a.category}</span>}{a.reading_time_minutes ? <span style={{ fontSize: 10.5, color: C.muted }}>{a.reading_time_minutes} {t("mnt baca", "min read")}</span> : null}</span>
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 5, lineHeight: 1.3 } as any}>{a.title}</span>
              </span>
            </button>
          ))}
          {!isLoading && !isError && !list.length && <Empty icon="book" title={t("Belum ada artikel", "No articles yet")} />}
        </div>
      </div>
    </Screen>
  );
}

/** Teks bergaya markdown → elemen React (tanpa innerHTML, jadi aman dari XSS). */
function inline(s: string): React.ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).filter(Boolean).map((p, i) =>
    p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith("`") ? <code key={i} style={{ background: C.soft, padding: "1px 5px", borderRadius: 5, fontSize: "0.92em" }}>{p.slice(1, -1)}</code> : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <i key={i}>{p.slice(1, -1)}</i> : <React.Fragment key={i}>{p}</React.Fragment>);
}
function ArticleBody({ text }: { text: string }) {
  const blocks = (text ?? "").replace(/\r/g, "").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return (
    <div style={{ fontSize: 15, lineHeight: 1.75, color: C.text2 }}>
      {blocks.map((b, i) => {
        const h = /^(#{1,4})\s+(.*)$/s.exec(b);
        if (h) return <div key={i} style={{ fontSize: [0, 21, 18.5, 16.5, 15.5][h[1].length], fontWeight: 700, color: C.text, margin: "22px 0 8px", lineHeight: 1.3 }}>{inline(h[2])}</div>;
        const img = /^!\[(.*?)\]\((https:\/\/[^\s)]+)\)$/.exec(b);
        if (img) return <figure key={i} style={{ margin: "16px 0" }}><img src={img[2]} alt={img[1]} loading="lazy" style={{ width: "100%", borderRadius: 14 }} />{img[1] && <figcaption style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 6 }}>{img[1]}</figcaption>}</figure>;
        const yt = /^\[video:https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)\]$/.exec(b);
        if (yt) return <div key={i} style={{ margin: "16px 0", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", background: C.navy }}><iframe title="video" src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} style={{ width: "100%", height: "100%", border: 0 }} allowFullScreen /></div>;
        if (b.startsWith("> ")) return <blockquote key={i} style={{ margin: "16px 0", borderLeft: `4px solid ${C.blue}`, background: C.tintBlue, borderRadius: "0 12px 12px 0", padding: "12px 14px", fontStyle: "italic", color: C.text }}>{inline(b.replace(/^>\s?/gm, ""))}</blockquote>;
        const lines = b.split("\n");
        if (lines.every(l => /^[-*]\s+/.test(l.trim()))) return <ul key={i} style={{ margin: "10px 0", paddingLeft: 20 }}>{lines.map((l, k) => <li key={k} style={{ margin: "4px 0" }}>{inline(l.trim().replace(/^[-*]\s+/, ""))}</li>)}</ul>;
        if (lines.every(l => /^\d+\.\s+/.test(l.trim()))) return <ol key={i} style={{ margin: "10px 0", paddingLeft: 22 }}>{lines.map((l, k) => <li key={k} style={{ margin: "4px 0" }}>{inline(l.trim().replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
        return <p key={i} style={{ margin: "10px 0" }}>{lines.map((l, k) => <React.Fragment key={k}>{k > 0 && <br />}{inline(l)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}
function ArticleReader() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const { t, lang, user, toast } = useApp();
  const counted = useRef(false);
  const { data: a, isLoading } = useQuery({
    queryKey: ["m-article", slug], staleTime: 10 * 60_000,
    queryFn: async () => (await db.from("articles").select("id,title,slug,content,excerpt,featured_image_url,category,reading_time_minutes,published_at").eq("slug", slug).eq("is_published", true).maybeSingle()).data,
  });
  useEffect(() => {
    if (!a || counted.current) return;
    counted.current = true;
    db.rpc("increment_article_view_count", { article_id: a.id }).then(() => {}, () => {});
    if (user) db.rpc("mark_article_read", { p_user_id: user.id, p_article_id: a.id }).then(() => {}, () => {});
  }, [a, user]);
  if (isLoading) return <Loading />;
  if (!a) return <Screen><Header title={t("Artikel", "Article")} /><div style={{ padding: 20 }}><Empty icon="book" title={t("Artikel tidak ditemukan", "Article not found")} /></div></Screen>;
  const circle: React.CSSProperties = { position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 14px)", width: 42, height: 42, borderRadius: "50%", border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,.2)" };
  const img = a.featured_image_url && /^https?:\/\//.test(a.featured_image_url) ? a.featured_image_url : courseImg(null, a.title);
  return (
    <Screen bg="#fff">
      <div style={{ position: "relative", height: 220 }}>
        <ImgBox src={img} h="100%" r={0} />
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={{ ...circle, left: 18, color: C.text }}><Icon name="left" size={20} /></button>
        <button aria-label={t("Bagikan", "Share")} onClick={() => shareOrCopy(a.title, webUrl(`/articles/${a.slug}`), m => toast(m), t("Link disalin", "Link copied"))} style={{ ...circle, right: 18, color: C.blue }}><Icon name="share" size={18} /></button>
      </div>
      <div style={{ position: "relative", marginTop: -24, background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 22px 10px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {a.category && <span style={{ fontSize: 11, fontWeight: 600, color: C.blue, background: C.tintBlue, padding: "3px 10px", borderRadius: 99 }}>{a.category}</span>}
          <span style={{ fontSize: 11.5, color: C.muted }}>{[a.published_at && fmtDate(a.published_at, lang), a.reading_time_minutes && `${a.reading_time_minutes} ${t("mnt baca", "min read")}`].filter(Boolean).join(" · ")}</span>
        </div>
        <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-.3px" }}>{a.title}</h1>
        <div style={{ marginTop: 8 }}><ArticleBody text={a.content ?? a.excerpt ?? ""} /></div>
      </div>
    </Screen>
  );
}

/* ── PROGRAM TALENTIKA ──────────────────────────────────────────────── */
function usePrograms() {
  return useQuery({
    queryKey: ["m-programs"], staleTime: 10 * 60_000,
    queryFn: async () => {
      const [prem, boot] = await Promise.all([
        db.from("premium_programs").select("id,slug,name,tagline,banner_url,cta_label").eq("is_active", true).order("sort_order"),
        db.rpc("list_bootcamps"),
      ]);
      return [
        ...((prem.data ?? []) as any[]).map(p => ({ key: `p-${p.id}`, title: p.name, sub: p.tagline, img: p.banner_url, kind: "premium" as const, raw: p })),
        ...((boot.data ?? []) as any[]).map(b => ({ key: `b-${b.slug}`, title: b.title, sub: [b.category_label, b.level].filter(Boolean).join(" · "), img: b.cover_url, kind: "bootcamp" as const, raw: b })),
      ];
    },
  });
}
export { usePrograms };
const progImg = (img: string | null | undefined, seed: string) => (img && /^https?:\/\//.test(img) ? img : [IMG.cHiker, IMG.kAi, IMG.cTurbines, IMG.kDesign][seed.length % 4]);
function Programs() {
  const nav = useNavigate();
  const { t } = useApp();
  const { data, isLoading } = usePrograms();
  return (
    <Screen>
      <Header title={t("Program Talentika", "Talentika Programs")} sub={t("Pengalaman nyata bersama mentor", "Real experiences with mentors")} />
      <div className="tk-grid2" style={{ padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading && <Loading />}
        {(data ?? []).map(p => (
          <button key={p.key} onClick={() => nav(`/app/programs/${p.key}`)} style={{ ...card, border: "none", width: "100%", textAlign: "left", padding: 0, overflow: "hidden", cursor: "pointer" }}>
            <ImgBox src={progImg(p.img, p.title)} h={130} r={0} />
            <span style={{ display: "block", padding: "12px 14px 14px" }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: p.kind === "premium" ? C.amber : C.purple, background: p.kind === "premium" ? C.tintYellow : C.tintPurple, padding: "3px 9px", borderRadius: 99 }}>{p.kind === "premium" ? t("Program premium", "Premium program") : "Bootcamp"}</span>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.text, marginTop: 7 }}>{p.title}</span>
              {p.sub && <span style={{ display: "block", fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>{p.sub}</span>}
            </span>
          </button>
        ))}
        {!isLoading && !(data ?? []).length && <Empty icon="globe" title={t("Belum ada program yang dibuka", "No programs open yet")} body={t("Tim Talentika akan mengumumkan program berikutnya di sini.", "The Talentika team will announce upcoming programs here.")} />}
      </div>
    </Screen>
  );
}
function ProgramDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, toast } = useApp();
  const isPrem = id.startsWith("p-"), key = id.slice(2);
  const { data, isLoading } = useQuery({
    queryKey: ["m-program", id, user?.id], enabled: !!user,
    queryFn: async () => {
      if (isPrem) {
        const [{ data: p }, { data: mine }] = await Promise.all([
          db.from("premium_programs").select("*").eq("id", key).maybeSingle(),
          db.from("premium_program_interest").select("id").eq("user_id", user!.id).eq("program_id", key).maybeSingle(),
        ]);
        return p ? { kind: "premium", p, interested: !!mine } : null;
      }
      const { data: b } = await db.rpc("get_bootcamp_detail", { p_slug: key });
      const row = Array.isArray(b) ? b[0] : b;
      return row ? { kind: "bootcamp", p: row?.bootcamp ?? row, interested: false } : null;
    },
  });
  if (isLoading) return <Loading />;
  if (!data) return <Screen><Header title={t("Program", "Program")} /><div style={{ padding: 20 }}><Empty icon="globe" title={t("Program tidak ditemukan", "Program not found")} /></div></Screen>;
  const p = data.p;
  const title = p.name ?? p.title;
  const register = async () => {
    const { error } = await db.from("premium_program_interest").insert({ user_id: user!.id, program_id: key });
    if (error && !/duplicate|unique/i.test(error.message)) { toast(errMsg(error), "error"); return; }
    qc.invalidateQueries({ queryKey: ["m-program", id] });
    toast(t("Minatmu tercatat — tim Talentika akan menghubungimu", "Interest saved — the Talentika team will contact you"));
  };
  const benefits: string[] = Array.isArray(p.benefits) ? p.benefits.map((b: any) => typeof b === "string" ? b : b?.title ?? b?.text).filter(Boolean) : [];
  const circle: React.CSSProperties = { position: "absolute", left: 18, top: "calc(env(safe-area-inset-top, 0px) + 14px)", width: 42, height: 42, borderRadius: "50%", border: "none", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(15,23,42,.2)", color: C.text };
  return (
    <Screen bg="#fff" style={{ paddingBottom: 0 }}>
      <div style={{ position: "relative", height: 230 }}>
        <ImgBox src={progImg(p.banner_url ?? p.cover_url, title)} h="100%" r={0} />
        <button aria-label={t("Kembali", "Back")} onClick={() => nav(-1)} style={circle}><Icon name="left" size={20} /></button>
      </div>
      <div style={{ position: "relative", marginTop: -24, background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 20px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: data.kind === "premium" ? C.amber : C.purple, background: data.kind === "premium" ? C.tintYellow : C.tintPurple, padding: "4px 11px", borderRadius: 99 }}>{data.kind === "premium" ? t("Program premium", "Premium program") : (p.category_label ?? "Bootcamp")}</span>
        <h1 style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-.4px" }}>{title}</h1>
        {(p.tagline || p.subtitle) && <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.6, color: C.text2 }}>{p.tagline ?? p.subtitle}</p>}
        {p.description && <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.65, color: C.text2, whiteSpace: "pre-line" }}>{p.description}</p>}
        {benefits.length > 0 && <>
          <H>{t("Yang kamu dapat", "What you get")}</H>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>{benefits.map(b => <div key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: C.text2 }}><span style={{ color: C.green, display: "flex", marginTop: 2 }}><Icon name="check" size={15} /></span>{b}</div>)}</div>
        </>}
        {data.kind === "bootcamp" && !canPurchase() && <div style={{ marginTop: 14, fontSize: 12, color: C.muted, background: C.bg, borderRadius: 12, padding: "10px 12px" }}>{t("Pendaftaran bootcamp tersedia di talentika.id.", "Bootcamp registration is available on talentika.id.")}</div>}
      </div>
      <div style={{ position: "sticky", bottom: 0, padding: "12px 20px calc(env(safe-area-inset-bottom, 0px) + 18px)", borderTop: "1px solid #EEF2F8", display: "flex", gap: 12, alignItems: "center", background: "#fff", zIndex: 2 }}>
        {data.kind === "bootcamp" && canPurchase() && p.price ? <div style={{ flex: "none" }}><div style={{ fontSize: 17, fontWeight: 800 }}>{rpShort(p.price)}</div>{p.price_label && <div style={{ fontSize: 11, color: C.muted }}>{p.price_label}</div>}</div> : null}
        {data.kind === "premium"
          ? (data.interested ? <Btn kind="success" h={52} disabled><Icon name="check" size={17} />{t("Minatmu sudah tercatat", "Interest saved")}</Btn> : <Btn h={52} onClick={register}>{p.cta_label || t("Daftar minat", "Register interest")}</Btn>)
          : canPurchase() ? <Btn h={52} onClick={() => openExternal(webUrl(`/bootcamp/${key}`))}>{t("Lihat & daftar", "View & register")} <Icon name="right" size={17} /></Btn> : null}
      </div>
    </Screen>
  );
}

/* ── JADI MENTOR / MITRA ────────────────────────────────────────────── */
function MentorApply() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, user, profile, toast } = useApp();
  const [role, setRole] = useState<"mentor" | "mitra">("mentor");
  const [f, setF] = useState({ name: profile?.full_name ?? "", title: "", expertise: "", exp: "", link: "", bio: "", org: "", kind: "", program: "", contact: "" });
  const [busy, setBusy] = useState(false);
  const { data: st, isLoading } = useQuery({ queryKey: ["m-mentor-stats", user?.id], enabled: !!user, queryFn: async () => (await db.rpc("statistik_mentor_saya")).data });
  const sent = !!st;
  const submitMentor = async () => {
    setBusy(true);
    const bio = [f.bio.trim(), f.link.trim() && `Profil: ${f.link.trim()}`].filter(Boolean).join("\n\n");
    const { error } = await db.rpc("apply_as_mentor", { p_name: f.name.trim(), p_title: f.title.trim(), p_bio: bio, p_expertise: f.expertise.split(",").map(s => s.trim()).filter(Boolean), p_experience: parseInt(f.exp) || 0 });
    setBusy(false);
    if (error) { toast(errMsg(error), "error"); return; }
    qc.invalidateQueries({ queryKey: ["m-mentor-stats"] });
    toast(t("Pendaftaran diterima. Verifikasi biasanya 3–5 hari kerja.", "Application received. Verification usually takes 3–5 working days."));
  };
  const submitMitra = () => {
    const msg = [`Halo Talentika, kami ingin bergabung sebagai mitra.`, `Organisasi: ${f.org}`, f.kind && `Jenis: ${f.kind}`, f.program && `Program: ${f.program}`, f.contact && `Kontak: ${f.contact}`].filter(Boolean).join("\n");
    openExternal(`https://wa.me/6285148434141?text=${encodeURIComponent(msg)}`);
  };
  const steps: [string, boolean][] = [[t("Kirim pendaftaran", "Submit application"), sent], [t("Verifikasi profil & dokumen", "Profile & document check"), !!st?.is_available], [t("Onboarding & pelatihan mentor", "Mentor onboarding & training"), !!st?.is_available], [t("Mulai sesi pertama", "First session"), (st?.sessions ?? 0) > 0]];
  const field = (k: keyof typeof f, ph: string, icon?: string, mode?: any) => <Input icon={icon} inputMode={mode} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={ph} />;
  if (isLoading) return <Loading />;
  return (
    <Screen>
      <Header title={t("Jadi Mentor / Mitra", "Become a Mentor / Partner")} sub="Talentika Mitra & Mentor" />
      <div style={{ padding: "14px 20px 0" }}>
        <Segmented value={role} onChange={v => setRole(v)} options={[{ value: "mentor", label: "Mentor" }, { value: "mitra", label: t("Mitra / Organisasi", "Partner / Organization") }]} />
        <div style={{ marginTop: 12, fontSize: 13, color: C.text2, lineHeight: 1.55 }}>{role === "mentor" ? t("Bagikan pengalamanmu ke pelajar Indonesia lewat sesi 1:1, review proyek, dan webinar.", "Share your experience with Indonesian students through 1:1 sessions, project reviews and webinars.") : t("Untuk kampus, perusahaan, dan komunitas yang ingin membuka beasiswa, kompetisi, atau magang di Talentika.", "For universities, companies and communities that want to offer scholarships, competitions or internships on Talentika.")}</div>
        {role === "mentor" ? (sent ? (
          <div style={{ ...card, padding: 14, marginTop: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: st.is_available ? C.tintGreen : C.tintYellow, color: st.is_available ? C.green : C.amber, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={st.is_available ? "check" : "clock"} size={19} /></span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{st.is_available ? t("Kamu sudah mentor Talentika", "You're a Talentika mentor") : t("Pendaftaranmu sedang diverifikasi", "Your application is under review")}</div><div style={{ fontSize: 11.5, color: C.muted }}>{t("Atur jadwal & permintaan di Mode Mentor", "Manage slots & requests in Mentor mode")}</div></div>
            <Btn full={false} h={38} onClick={() => nav("/app/mentor-dashboard")} style={{ fontSize: 12.5, padding: "0 12px" }}>{t("Buka", "Open")}</Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {field("name", t("Nama lengkap", "Full name"), "user")}
            {field("title", t("Peran · AI Product Manager di …", "Role · AI Product Manager at …"), "brief")}
            {field("expertise", t("Bidang keahlian · AI, Desain, Beasiswa", "Expertise · AI, Design, Scholarships"), "sparkle")}
            {field("exp", t("Pengalaman (tahun)", "Experience (years)"), "clock", "numeric")}
            {field("link", t("Link LinkedIn / website", "LinkedIn / website link"), "link")}
            <TextArea value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder={t("Ceritakan perjalanan kariermu", "Tell us about your career journey")} />
          </div>
        )) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {field("org", t("Nama organisasi", "Organization name"), "school")}
            {field("kind", t("Jenis · kampus, perusahaan, komunitas", "Type · university, company, community"), "globe")}
            {field("program", t("Program yang ingin dibuka · beasiswa, magang…", "Program to offer · scholarship, internship…"), "trophy")}
            {field("contact", t("Email / nomor kontak", "Email / phone"), "mail")}
          </div>
        )}
        <H>{t("Tahapan", "Steps")}</H>
        <div style={{ ...card, padding: "4px 14px", marginTop: 10 }}>
          {(role === "mentor" ? steps : [[t("Kirim data organisasi via WhatsApp", "Send organization details via WhatsApp"), false], [t("Diskusi kebutuhan dengan tim Talentika", "Discuss needs with the Talentika team"), false], [t("Program tayang di Talentika", "Program goes live on Talentika"), false]] as [string, boolean][]).map(([s, on], i, a) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < a.length - 1 ? "1px solid #F1F5FB" : "none" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: on ? C.green : "#fff", border: `2px solid ${on ? C.green : "#CBD5E1"}`, color: on ? "#fff" : C.faint, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{on ? <Icon name="check" size={13} /> : i + 1}</span>
              <span style={{ fontSize: 13.5, color: on ? C.text : C.muted }}>{s}</span>
            </div>
          ))}
        </div>
        {role === "mentor" && !sent && <Btn disabled={busy || !f.name.trim() || !f.title.trim()} onClick={submitMentor} style={{ marginTop: 16 }}>{t("Kirim pendaftaran", "Submit application")}</Btn>}
        {role === "mitra" && <Btn disabled={!f.org.trim()} onClick={submitMitra} style={{ marginTop: 16 }}><Icon name="msg" size={17} />{t("Kirim via WhatsApp", "Send via WhatsApp")}</Btn>}
      </div>
    </Screen>
  );
}

/* ── TALENT CARD ────────────────────────────────────────────────────── */
function TalentCard() {
  const nav = useNavigate();
  const { t, lang, profile, toast } = useApp();
  const { dna, title, isLoading, riasec } = useDna();
  if (isLoading) return <Loading />;
  const top = rankAxes(dna?.axes).slice(0, 3) as AxisKey[];
  // Tipe = hasil tes RIASEC (sama dengan web) bila ada
  const headline = riasec ? riasecLabel(riasec.tipe_utama, lang) : title;
  const intro = riasec ? t("Tipe minatku", "My interest type") : t("Aku adalah", "I am");
  const name = (profile?.full_name || "").split(" ")[0] || "Talentika";
  const link = profile?.username ? webUrl(`/u/${profile.username}`) : webUrl("/app");
  const linkShort = link.replace(/^https?:\/\//, "");
  const axName = (k: AxisKey) => { const a = AXES.find(x => x.key === k)!; return lang === "en" ? a.name : a.nameId; };
  const chips = riasec
    ? [riasec.holland_code && `${t("Kode Holland", "Holland code")} ${riasec.holland_code}`, ...riasecArch(riasec, lang).slice(1).map(a => a.name)].filter(Boolean) as string[]
    : top.map(k => `${axName(k)} ${((dna?.axes?.[k] ?? 0) / 20).toFixed(1)}`);
  const draw = async (): Promise<Blob> => {
    const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
    const g = cv.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 1080, 1920); grd.addColorStop(0, "#0066FF"); grd.addColorStop(.6, "#00A3E0"); grd.addColorStop(1, "#00C6EF");
    g.fillStyle = grd; g.fillRect(0, 0, 1080, 1920);
    g.fillStyle = "rgba(255,209,70,.85)"; g.beginPath(); g.arc(980, 120, 320, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "700 56px Poppins, sans-serif"; g.fillText("Talentika", 90, 200);
    g.font = "500 48px Poppins, sans-serif"; g.globalAlpha = .9; g.fillText(intro, 90, 560); g.globalAlpha = 1;
    g.font = "800 108px Poppins, sans-serif";
    const words = (headline ?? "").split(" "); let line = "", y = 690;
    words.forEach(w => { const tryL = line ? `${line} ${w}` : w; if (g.measureText(tryL).width > 900 && line) { g.fillText(line, 90, y); y += 120; line = w; } else line = tryL; });
    if (line) g.fillText(line + "!", 90, y);
    g.font = "600 40px Poppins, sans-serif"; y += 140;
    chips.forEach(c => { const w = g.measureText(c).width + 64; g.fillStyle = "rgba(255,255,255,.2)"; g.beginPath(); (g as any).roundRect?.(90, y - 54, w, 80, 40); g.fill(); g.fillStyle = "#fff"; g.fillText(c, 122, y); y += 110; });
    g.font = "500 38px Poppins, sans-serif"; g.fillText(lang === "en" ? "Discover your talent at" : "Temukan bakatmu di", 90, 1720); g.font = "700 42px Poppins, sans-serif"; g.fillText(linkShort, 90, 1785);
    return new Promise(r => cv.toBlob(b => r(b!), "image/png"));
  };
  const save = async () => { const b = await draw(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "talentika-talent-card.png"; a.click(); toast(t("Gambar disimpan", "Image saved")); };
  const story = async () => {
    const b = await draw(); const file = new File([b], "talentika-talent-card.png", { type: "image/png" });
    if ((navigator as any).canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: "Talentika" } as any); } catch { /* batal */ } return; }
    await save();
  };
  const text = riasec
    ? t(`Tipe minatku ${headline}${riasec.holland_code ? ` (kode Holland ${riasec.holland_code})` : ""}! Temukan bakatmu di Talentika:`, `My interest type is ${headline}${riasec.holland_code ? ` (Holland code ${riasec.holland_code})` : ""}! Discover yours on Talentika:`)
    : t(`Aku adalah ${title}! Temukan bakatmu di Talentika:`, `I'm ${title}! Discover your talents on Talentika:`);
  const actions: [string, string, () => void][] = [
    ["image", "IG Story", story],
    ["msg", "WhatsApp", () => openExternal(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`)],
    ["link", t("Salin link", "Copy link"), async () => { await navigator.clipboard?.writeText(link); toast(t("Link disalin", "Link copied")); }],
    ["download", t("Simpan", "Save"), save],
  ];
  if (!title) return <Screen><Header title={t("Bagikan Talent Card", "Share Talent Card")} /><div style={{ padding: 20 }}><Empty icon="sparkle" title={t("Talent Card belum siap", "Your Talent Card isn't ready")} body={t("Selesaikan Talent Discovery untuk membuat kartumu.", "Finish Talent Discovery to create your card.")} action={<Btn h={46} onClick={() => nav("/app/dna")}>{t("Mulai Talent Discovery", "Start Talent Discovery")}</Btn>} /></div></Screen>;
  return (
    <Screen>
      <Header title={t("Bagikan Talent Card", "Share Talent Card")} sub={t("Format story 1080×1920", "Story format 1080×1920")} />
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ position: "relative", margin: "0 auto", maxWidth: 300, aspectRatio: "9/16", borderRadius: 26, overflow: "hidden", background: "linear-gradient(160deg,#0066FF 0%,#00A3E0 60%,#00C6EF 100%)", color: "#fff", padding: "22px 20px", boxShadow: "0 20px 40px rgba(0,102,255,.3)" }}>
          <div style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,209,70,.85)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}><img src={LOGO} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} /><span style={{ fontSize: 14, fontWeight: 700 }}>Talentika</span></div>
          <div style={{ position: "relative", fontSize: 13, opacity: .9, marginTop: "28%" }}>{intro}</div>
          <div style={{ position: "relative", fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.5px", marginTop: 4 }}>{headline}!</div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7, marginTop: 16 }}>
            {chips.map(c => <span key={c} style={{ fontSize: 11.5, fontWeight: 600, background: "rgba(255,255,255,.2)", borderRadius: 99, padding: "5px 11px" }}>{c}</span>)}
          </div>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 20, fontSize: 11, lineHeight: 1.4 }}>{t("Temukan bakatmu di", "Discover your talent at")}<br /><b style={{ fontSize: 12 }}>{linkShort}</b></div>
          <img src={TIKA} alt="" style={{ position: "absolute", right: 14, bottom: 60, width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,.6)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 18 }}>
          {actions.map(([ic, l, fn]) => (
            <button key={l} onClick={fn} style={{ border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: 0 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: "#fff", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SH.card }}><Icon name={ic} size={21} /></span>
              <span style={{ fontSize: 11.5, fontWeight: 500, color: C.text }}>{l}</span>
            </button>
          ))}
        </div>
        {!profile?.username && <div style={{ marginTop: 14, fontSize: 11.5, color: C.muted, textAlign: "center" }}>{t("Buat link profil publik di Profil agar teman bisa melihat profilmu.", "Create a public profile link in Profile so friends can view it.")}</div>}
      </div>
    </Screen>
  );
}

/* ── PENGATURAN ─────────────────────────────────────────────────────── */
function Settings() {
  const nav = useNavigate();
  const { t, lang, user, profile, textSize, gam, updatePrefs, refreshProfile, toast } = useApp();
  const push = usePushNotifications(user?.id);
  const [nativePush, setNativePush] = useState<string>("prompt");
  useEffect(() => { if (isNative() && user) initPush(user.id, false).then(setNativePush); }, [user]);
  const prefs = profile?.app_prefs || {};
  const notif = prefs.notif || {};
  const a11y = prefs.a11y || {};
  const theme: "light" | "dark" | "system" = prefs.theme ?? "light";
  const [offline, setOffline] = useState(() => { try { return JSON.parse(localStorage.getItem("tk-offline-courses") || "{}"); } catch { return {}; } });
  const setLang = async (l: "id" | "en") => { localStorage.setItem("tk-lang", l); await db.from("profiles").update({ language_preference: l }).eq("user_id", user!.id); await refreshProfile(); };
  const removeOffline = (id: string) => { const o = { ...offline }; delete o[id]; localStorage.setItem("tk-offline-courses", JSON.stringify(o)); setOffline(o); };
  const cats: [string, string, string, string][] = [
    ["opportunities", t("Deadline peluang", "Opportunity deadlines"), t("H-7, H-3, H-1", "D-7, D-3, D-1"), ""],
    ["learning", t("Pengingat belajar", "Learning reminders"), t("Saat ada materi baru & progres", "New lessons & progress"), ""],
    ["community", t("Balasan komunitas", "Community replies"), t("Saat ada balasan", "When someone replies"), ""],
    ["mentorship", "Mentor", t("Konfirmasi & pengingat sesi", "Session confirmations & reminders"), ""],
    ["achievement", t("Pencapaian & insight AI", "Achievements & AI insights"), t("Badge baru dan saran Tika", "New badges and Tika's tips"), ""],
    ["promo", t("Promo & program baru", "Promos & new programs"), t("Maks 2× sebulan", "Max twice a month"), ""],
  ];
  const sw = (on: boolean, fn: () => void, label: string) => <Toggle on={on} onClick={fn} label={label} />;
  const row = (title: string, sub: string | null, right: React.ReactNode, last = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: last ? "none" : `1px solid ${C.track}` }}>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5 }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: C.faint }}>{sub}</div>}</div>{right}
    </div>
  );
  const box: React.CSSProperties = { ...card, padding: "4px 16px", marginTop: 10 };
  return (
    <Screen>
      <Header title={t("Pengaturan", "Settings")} />
      <div style={{ padding: "14px 20px 0" }}>
        <H mt={4}>{t("Bahasa", "Language")}</H>
        <div style={{ marginTop: 10 }}><Segmented value={lang} onChange={setLang} options={[{ value: "id", label: "Bahasa Indonesia" }, { value: "en", label: "English" }]} /></div>

        <H>{t("Tema", "Theme")}</H>
        <div style={{ marginTop: 10 }}><Segmented value={theme} onChange={v => updatePrefs({ theme: v })} options={[{ value: "light", label: t("Terang", "Light") }, { value: "dark", label: t("Gelap", "Dark") }, { value: "system", label: t("Ikuti sistem", "System") }]} /></div>

        <H>{t("Ukuran teks", "Text size")}</H>
        <div style={{ marginTop: 10 }}><Segmented value={textSize} onChange={v => updatePrefs({ textSize: v })} options={[{ value: "Kecil", label: t("Kecil", "Small") }, { value: "Normal", label: "Normal" }, { value: "Besar", label: t("Besar", "Large") }]} /></div>
        <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>{t("Contoh: Kamu 2 pelajaran lagi menuju badge pertamamu.", "Example: You're 2 lessons away from your first badge.")}</div>

        <H>{t("Notifikasi", "Notifications")}</H>
        <div style={box}>
          {(isNative() ? nativePush !== "granted" : push.permission !== "unsupported" && push.permission !== "granted") && (
            <Btn kind="soft" h={42} style={{ margin: "10px 0 4px" }} onClick={async () => {
              if (isNative()) { const r = await initPush(user!.id, true); setNativePush(r); if (r === "denied") toast(t("Izin notifikasi ditolak — aktifkan dari Pengaturan HP", "Notification permission denied — enable it in phone Settings"), "error"); }
              else push.subscribe();
            }}>{t("Aktifkan notifikasi push", "Enable push notifications")}</Btn>
          )}
          {cats.map(([k, ti, d], i) => <React.Fragment key={k}>{row(ti, d, sw(notif[k] !== false, () => updatePrefs({ notif: { ...notif, [k]: notif[k] === false } }), ti), i === cats.length - 1)}</React.Fragment>)}
        </div>
        {(profile?.usia ?? 99) < 18 && <div style={{ marginTop: 6, fontSize: 11.5, color: C.faint, display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} />{t("Jam tenang 21.00–06.00 aktif untuk pengguna di bawah 18 tahun.", "Quiet hours 21:00–06:00 are on for users under 18.")}</div>}

        <H>{t("Aksesibilitas", "Accessibility")}</H>
        <div style={box}>
          {row(t("Kontras tinggi", "High contrast"), t("Teks dan garis lebih tegas", "Bolder text and lines"), sw(!!a11y.contrast, () => updatePrefs({ a11y: { ...a11y, contrast: !a11y.contrast } }), t("Kontras tinggi", "High contrast")))}
          {row(t("Kurangi animasi", "Reduce motion"), t("Matikan transisi dan konfeti", "Turn off transitions and confetti"), sw(!!a11y.motion, () => updatePrefs({ a11y: { ...a11y, motion: !a11y.motion } }), t("Kurangi animasi", "Reduce motion")))}
          {row(t("Label pembaca layar", "Screen reader labels"), t("Deskripsi untuk TalkBack / VoiceOver", "Descriptions for TalkBack / VoiceOver"), <span style={{ fontSize: 11.5, fontWeight: 600, color: C.green }}>{t("Selalu aktif", "Always on")}</span>, true)}
        </div>

        <H>{t("Pengalaman", "Experience")}</H>
        <div style={box}>
          {row(t("Gamifikasi (XP, level, badge)", "Gamification (XP, levels, badges)"), null, sw(gam, () => updatePrefs({ gamification: !gam }), "Gamification"))}
          {row(t("Hemat data", "Data saver"), t("Kualitas video lebih rendah di data seluler", "Lower video quality on cellular"), sw(!!prefs.dataSaver, () => updatePrefs({ dataSaver: !prefs.dataSaver }), "Data saver"), true)}
        </div>

        <H>{t("Unduhan offline", "Offline downloads")}</H>
        <div style={box}>
          {Object.entries(offline).map(([id, o]: any, i, a) => <React.Fragment key={id}>{row(o.c?.title ?? "—", `${t("Disimpan", "Saved")} ${fmtDate(new Date(o.savedAt).toISOString(), lang)}`, <button onClick={() => removeOffline(id)} aria-label={t("Hapus unduhan", "Remove download")} style={{ border: "none", background: C.tintRed, color: C.red, width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="trash" size={15} /></button>, i === a.length - 1)}</React.Fragment>)}
          {!Object.keys(offline).length && <div style={{ padding: "12px 0", fontSize: 12.5, color: C.muted }}>{t("Ketuk “Unduh untuk offline” di halaman materi.", "Tap “Download for offline” on a course page.")}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <Tile icon="shield" c={C.blue} bg={C.tintBlue} title={t("Privasi & Data", "Privacy & Data")} onClick={() => nav("/app/data")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
          <Tile icon="users" c={C.purple} bg={C.tintPurple} title={t("Keluarga & Sekolah", "Family & School")} onClick={() => nav("/app/privacy")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
          <Tile icon="bell" c={C.amber} bg={C.tintYellow} title={t("Pusat notifikasi", "Notification center")} onClick={() => nav("/app/notifications")} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
          <Tile icon="info" c={C.teal} bg={C.tintTeal} title={t("Bantuan & tentang Talentika", "Help & about")} onClick={() => openExternal(webUrl("/tentang-kami"))} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="chev" size={17} /></span>} />
          <Tile icon="shield" c={C.muted} bg={C.soft} title={t("Kebijakan Privasi", "Privacy Policy")} onClick={() => openExternal(webUrl("/privacy"))} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="link" size={16} /></span>} />
          <Tile icon="file" c={C.muted} bg={C.soft} title={t("Syarat & Ketentuan", "Terms of Service")} onClick={() => openExternal(webUrl("/terms"))} right={<span style={{ color: C.faint, display: "flex" }}><Icon name="link" size={16} /></span>} />
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, marginTop: 16 }}>Talentika Mobile · v1.1</div>
      </div>
    </Screen>
  );
}

/* ── status error dengan tombol coba lagi (pola "UI States") ────────── */
export function ErrorState({ onRetry, title, body }: { onRetry: () => void; title?: string; body?: string }) {
  const { t } = useApp();
  return (
    <div style={{ ...card, padding: "22px 18px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, margin: "0 auto", borderRadius: 18, background: C.tintRed, color: C.red, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={24} /></div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>{title ?? t("Gagal memuat", "Couldn't load")}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{body ?? t("Progres kamu aman. Coba lagi sebentar.", "Your progress is safe. Try again in a moment.")}</div>
      <Btn h={42} full={false} onClick={onRetry} style={{ marginTop: 12, padding: "0 18px", fontSize: 13 }}><Icon name="refresh" size={15} />{t("Coba lagi", "Try again")}</Btn>
    </div>
  );
}
