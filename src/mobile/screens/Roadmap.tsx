import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { db, errMsg, isKuotaError, openExternal, useApp } from "../store";
import { Avatar, Empty, Header, Icon, ImgBox, Loading, PlusTeaser, Screen } from "../ui";
import { C, SH } from "../theme";
import { teksAlasanRoadmap } from "@/lib/peluang";

/* Roadmap dari praktisi (MVP 2026-10-26). Data & gating Free/Plus di server:
   roadmap_untukku() untuk daftar, roadmap_detail() untuk isi, tandai_langkah()
   untuk centang. Free melihat 2 langkah pertama; Plus semua langkah + PDF. */

export interface RoadmapRingkas {
  id: string; slug: string; judul: string; ringkasan: string | null;
  penulis_nama: string | null; penulis_peran: string | null; penulis_foto: string | null; terverifikasi: boolean;
  career_id: string | null; career_nama: string | null; durasi: string | null; topik: string | null;
  jumlah_langkah: number; selesai: number; skor: number; alasan: string[];
}

export function useRoadmaps(careerId?: string | null, limit = 10) {
  const { user } = useApp();
  return useQuery({
    queryKey: ["m-roadmaps", user?.id ?? "anon", careerId ?? null, limit], staleTime: 5 * 60_000,
    queryFn: async () => ((await db.rpc("roadmap_untukku", { p_career: careerId ?? null, p_limit: limit })).data ?? []) as RoadmapRingkas[],
  });
}

const alasanRoadmap = teksAlasanRoadmap;

/** Kartu roadmap — dipakai di detail karier, Beranda, dan tab Belajar. */
export function RoadmapCard({ r, compact = false }: { r: RoadmapRingkas; compact?: boolean }) {
  const nav = useNavigate();
  const { t, lang } = useApp();
  const pct = r.jumlah_langkah ? Math.round((r.selesai / r.jumlah_langkah) * 100) : 0;
  return (
    <button onClick={() => nav(`/app/roadmap/${r.slug}`)}
      style={{ width: "100%", textAlign: "left", border: "none", background: "#fff", borderRadius: 18, padding: 14, boxShadow: SH.card, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ display: "flex", gap: 11, alignItems: "center" }}>
        <Avatar name={r.penulis_nama} src={r.penulis_foto} size={40} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: C.text }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.penulis_nama}</span>
            {r.terverifikasi && <span title={t("Mentor terverifikasi", "Verified mentor")} style={{ color: C.blue, display: "flex", flex: "none" }}><Icon name="check" size={13} /></span>}
          </span>
          <span style={{ display: "block", fontSize: 11, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.penulis_peran}</span>
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.purple, background: C.tintPurple, padding: "3px 8px", borderRadius: 99, flex: "none" }}>ROADMAP</span>
      </span>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{r.judul}</span>
      {!compact && r.ringkasan && <span style={{ fontSize: 12, color: C.text3, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{r.ringkasan}</span>}
      <span style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11, color: C.text2 }}>
        <span>{r.jumlah_langkah} {t("langkah", "steps")}{r.durasi ? ` · ${r.durasi}` : ""}</span>
        {r.alasan.slice(0, 1).map(a => <span key={a} style={{ color: C.blue, fontWeight: 600 }}>· {alasanRoadmap(a, lang)}</span>)}
      </span>
      {r.selesai > 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, height: 6, borderRadius: 99, background: C.track }}><span style={{ display: "block", width: `${pct}%`, height: "100%", borderRadius: 99, background: C.green }} /></span>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>{r.selesai}/{r.jumlah_langkah}</span>
        </span>
      )}
    </button>
  );
}

/** Rak roadmap: tidak tampil apa pun bila belum ada roadmap terbit. */
export function RoadmapShelf({ careerId, title, limit = 3, style }: { careerId?: string | null; title?: React.ReactNode; limit?: number; style?: React.CSSProperties }) {
  const { t } = useApp();
  const { data } = useRoadmaps(careerId, limit);
  if (!data?.length) return null;
  return (
    <div style={style}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{title ?? t("Roadmap dari praktisi", "Roadmaps from practitioners")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {data.map(r => <RoadmapCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}

/* ── DETAIL ─────────────────────────────────────────────────────────── */
export default function RoadmapDetail() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t, lang, user, toast, openPaywall, track } = useApp();
  const { data: r, isLoading } = useQuery({
    queryKey: ["m-roadmap", slug, user?.id], enabled: !!slug,
    queryFn: async () => (await db.rpc("roadmap_detail", { p_slug: slug })).data as any,
  });
  React.useEffect(() => {
    if (!r?.id) return;
    track("roadmap_viewed", { roadmap: r.slug, plus: r.plus });
    if (user && r.status === "terbit") db.rpc("catat_lihat_roadmap", { p_roadmap: r.id }).then(() => {}); // funnel Admin
  }, [r?.id]); // eslint-disable-line
  const { data: umpan } = useQuery({
    queryKey: ["m-roadmap-umpan", r?.id, user?.id], enabled: !!user && !!r?.id,
    queryFn: async () => ((await db.from("roadmap_umpan_balik").select("relevan").eq("user_id", user!.id).eq("roadmap_id", r.id).maybeSingle()).data?.relevan ?? null) as boolean | null,
  });
  const kirimUmpan = async (relevan: boolean) => {
    if (!user || !r?.id) return;
    const { error } = await db.from("roadmap_umpan_balik").upsert({ user_id: user.id, roadmap_id: r.id, relevan, dibuat_pada: new Date().toISOString() }, { onConflict: "user_id,roadmap_id" });
    if (error) { toast(errMsg(error), "error"); return; }
    qc.setQueryData(["m-roadmap-umpan", r.id, user.id], relevan);
    toast(t("Terima kasih atas masukanmu!", "Thanks for your feedback!"));
  };

  if (isLoading) return <Loading />;
  if (!r) return <Screen><Header title="Roadmap" /><div style={{ padding: 20 }}><Empty icon="compass" title={t("Roadmap tidak ditemukan", "Roadmap not found")} /></div></Screen>;

  const langkah = (r.langkah ?? []) as any[];
  const selesai = langkah.filter(l => l.selesai).length;
  const pct = r.jumlah_langkah ? Math.round((selesai / r.jumlah_langkah) * 100) : 0;

  const centang = async (l: any) => {
    if (!user) { nav("/app/signup?mode=login"); return; }
    const { error } = await db.rpc("tandai_langkah", { p_langkah: l.id, p_selesai: !l.selesai });
    if (error) { if (isKuotaError(error, "KUOTA_ROADMAP")) openPaywall("roadmap"); else toast(errMsg(error), "error"); return; }
    if (!l.selesai) track("roadmap_step_done", { roadmap: r.slug, step: l.urut });
    qc.invalidateQueries({ queryKey: ["m-roadmap", slug] });
    qc.invalidateQueries({ queryKey: ["m-roadmaps"] });
  };
  const buka = (l: any) => {
    if (!l.tautan_id) return;
    if (l.tautan_tipe === "materi") nav(`/app/course/${l.tautan_id}`);
    else if (l.tautan_tipe === "peluang") nav(`/app/opportunities/${l.tautan_id}`);
    else if (l.tautan_tipe === "karier") nav(`/app/careers/${l.tautan_id}`);
    else if (l.tautan_tipe === "url" && /^https?:\/\//.test(l.tautan_id)) openExternal(l.tautan_id);
  };
  const labelTautan: Record<string, [string, string]> = { materi: ["Buka materi", "Open course"], peluang: ["Lihat peluang", "View opportunity"], karier: ["Lihat karier", "View career"], url: ["Buka tautan", "Open link"] };
  const pdf = async () => {
    if (!r.plus) { openPaywall("roadmap"); return; }
    if (!r.pdf_path) return;
    const { data, error } = await supabase.storage.from("roadmap").createSignedUrl(r.pdf_path, 600);
    if (error || !data?.signedUrl) { toast(t("PDF belum bisa dibuka. Coba lagi.", "Couldn't open the PDF. Try again."), "error"); return; }
    openExternal(data.signedUrl);
  };

  return (
    <Screen>
      <Header title="Roadmap" sub={r.topik ?? undefined} />
      <div style={{ padding: "14px 20px 28px" }}>
        {r.cover_url && <ImgBox src={r.cover_url} h={150} r={20} />}
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-.3px", marginTop: r.cover_url ? 14 : 0 }}>{r.judul}</div>
        {r.ringkasan && <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: C.text3 }}>{r.ringkasan}</p>}

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14, background: "#fff", borderRadius: 16, padding: "12px 14px", boxShadow: SH.card }}>
          <Avatar name={r.penulis?.nama} src={r.penulis?.foto} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700 }}>
              {r.penulis?.nama}
              {r.penulis?.terverifikasi && <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.tintBlue, padding: "2px 7px", borderRadius: 99 }}>{t("Terverifikasi", "Verified")}</span>}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{r.penulis?.peran}</div>
          </div>
          {r.penulis?.mentor_id && <button onClick={() => nav(`/app/mentors/${r.penulis.mentor_id}`)} style={{ border: "none", background: "none", color: C.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{t("Profil", "Profile")}</button>}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12, fontSize: 12, color: C.text2 }}>
          <span style={{ background: C.soft, padding: "5px 10px", borderRadius: 99 }}>{r.jumlah_langkah} {t("langkah", "steps")}</span>
          {r.durasi && <span style={{ background: C.soft, padding: "5px 10px", borderRadius: 99 }}>{r.durasi}</span>}
          {r.career_id && <button onClick={() => nav(`/app/careers/${r.career_id}`)} style={{ border: "none", background: C.tintBlue, color: C.blue, padding: "5px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{r.career_nama ?? r.career_id}</button>}
        </div>

        {user && r.jumlah_langkah > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}><span>{t("Progresmu", "Your progress")}</span><span>{selesai}/{r.jumlah_langkah}</span></div>
            <div style={{ height: 7, borderRadius: 99, background: C.track, marginTop: 6 }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: C.green }} /></div>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {langkah.map((l, i) => (
            <div key={l.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flex: "none" }}>
                <button onClick={() => centang(l)} aria-pressed={!!l.selesai} aria-label={l.selesai ? t("Tandai belum", "Mark not done") : t("Tandai selesai", "Mark done")}
                  style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${l.selesai ? C.green : C.disabled}`, background: l.selesai ? C.green : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                  {l.selesai ? <Icon name="check" size={15} /> : <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{l.urut}</span>}
                </button>
                {(i < langkah.length - 1 || r.terkunci > 0) && <span style={{ flex: 1, width: 2, background: C.line, margin: "3px 0" }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 18, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: l.selesai ? C.muted : C.text, textDecoration: l.selesai ? "line-through" : "none" }}>{l.judul}</span>
                  {l.perkiraan && <span style={{ fontSize: 11, color: C.muted, flex: "none" }}>{l.perkiraan}</span>}
                </div>
                {l.isi && <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.55, color: C.text3, whiteSpace: "pre-line" }}>{l.isi}</p>}
                {l.tautan_tipe && l.tautan_id && (
                  <button onClick={() => buka(l)} style={{ marginTop: 8, border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 11, padding: "6px 11px", fontSize: 12, fontWeight: 600, color: C.blue, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {t(...labelTautan[l.tautan_tipe])} <Icon name="right" size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {r.terkunci > 0 && (
          <PlusTeaser onClick={() => openPaywall("roadmap")}
            title={t(`${r.terkunci} langkah berikutnya${r.ada_pdf ? " + panduan PDF" : ""}`, `${r.terkunci} more steps${r.ada_pdf ? " + PDF guide" : ""}`)}
            body={t("Roadmap lengkap dari praktisi tersedia di Talentika Plus.", "Full practitioner roadmaps are in Talentika Plus.")} />
        )}
        {r.plus && r.ada_pdf && (
          <button onClick={pdf} style={{ width: "100%", marginTop: 10, height: 46, border: `1.5px solid ${C.line}`, borderRadius: 14, background: "#fff", color: C.text, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
            <Icon name="download" size={16} /> {t("Unduh panduan PDF", "Download PDF guide")}
          </button>
        )}
        {user && r.status === "terbit" && (
          <div style={{ marginTop: 16, background: C.soft, borderRadius: 14, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: C.text2 }}>{t("Apakah roadmap ini relevan untukmu?", "Is this roadmap relevant to you?")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {([true, false] as const).map(v => (
                <button key={String(v)} onClick={() => kirimUmpan(v)} aria-pressed={umpan === v}
                  style={{ flex: 1, height: 38, borderRadius: 12, border: `1.5px solid ${umpan === v ? C.blue : C.line}`, background: umpan === v ? C.tintBlue : "#fff", color: umpan === v ? C.blue : C.text2, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  {v ? `👍 ${t("Relevan", "Relevant")}` : `👎 ${t("Tidak relevan", "Not relevant")}`}
                </button>
              ))}
            </div>
          </div>
        )}
        <p style={{ margin: "16px 0 0", fontSize: 11.5, color: C.faint, lineHeight: 1.5, textAlign: "center" }}>
          {t("Roadmap ini berisi pengalaman dan pandangan pribadi penulis — gunakan sebagai panduan, bukan satu-satunya jalan.", "This roadmap reflects the author's own experience and views — use it as a guide, not the only path.")}
        </p>
      </div>
    </Screen>
  );
}
