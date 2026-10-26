import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, errMsg, useApp, useCareers } from "../store";
import { Btn, Icon, Input, Label, Sheet, TextArea } from "../ui";
import { C, SH } from "../theme";

/* Roadmap milik mentor (dashboard mentor). Mentor hanya bisa menyimpan draf
   atau mengirim untuk ditinjau — admin yang menerbitkan (kebijakan RLS
   roadmaps_mentor_*). Roadmap yang sudah terbit hanya bisa diubah admin. */

type Langkah = { id?: string; judul: string; isi: string; perkiraan: string; url: string };
type Form = { id?: string; judul: string; ringkasan: string; career_id: string; riasec: string; jenjang: string[]; durasi: string; langkah: Langkah[] };

const STATUS: Record<string, [string, string, string, string]> = {
  draf: ["Draf", "Draft", C.soft, C.text2], tinjau: ["Ditinjau admin", "In review", C.tintYellow, "#7A5200"], terbit: ["Terbit", "Published", C.tintGreen, C.green],
};
const RIASEC: [string, string][] = [["R", "Realistis"], ["I", "Investigatif"], ["A", "Artistik"], ["S", "Sosial"], ["E", "Enterprising"], ["C", "Konvensional"]];
const JENJANG: [string, string][] = [["smp", "SMP"], ["sma_smk", "SMA/SMK"], ["kuliah", "Kuliah"], ["lulusan", "Lulusan"]];
const KOSONG: Form = { judul: "", ringkasan: "", career_id: "", riasec: "", jenjang: [], durasi: "", langkah: [{ judul: "", isi: "", perkiraan: "", url: "" }, { judul: "", isi: "", perkiraan: "", url: "" }] };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

export function RoadmapSaya({ mentorId }: { mentorId: string }) {
  const qc = useQueryClient();
  const { t, lang, toast } = useApp();
  const { careers } = useCareers();
  const [form, setForm] = useState<Form | null>(null);
  const [hapusIds, setHapusIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const { data: rows } = useQuery({
    queryKey: ["m-mentor-roadmaps", mentorId],
    queryFn: async () => {
      const [{ data: rm }, { data: fn }] = await Promise.all([
        db.from("roadmaps").select("id, slug, judul, status, diperbarui_pada, roadmap_langkah(count)").eq("mentor_id", mentorId).order("diperbarui_pada", { ascending: false }),
        db.rpc("admin_funnel_roadmap"),
      ]);
      const f = new Map(((fn ?? []) as any[]).map(x => [x.roadmap_id, x]));
      return ((rm ?? []) as any[]).map(r => ({ ...r, n: r.roadmap_langkah?.[0]?.count ?? 0, f: f.get(r.id) }));
    },
  });

  const buka = async (r?: any) => {
    setHapusIds([]);
    if (!r) { setForm({ ...KOSONG, langkah: KOSONG.langkah.map(l => ({ ...l })) }); return; }
    const [{ data: d }, { data: ls }] = await Promise.all([
      db.from("roadmaps").select("*").eq("id", r.id).single(),
      db.from("roadmap_langkah").select("*").eq("roadmap_id", r.id).order("urut"),
    ]);
    setForm({
      id: d.id, judul: d.judul ?? "", ringkasan: d.ringkasan ?? "", career_id: d.career_id ?? "", riasec: d.riasec ?? "",
      jenjang: d.jenjang_target ?? [], durasi: d.durasi ?? "",
      langkah: ((ls ?? []) as any[]).map(l => ({ id: l.id, judul: l.judul, isi: l.isi ?? "", perkiraan: l.perkiraan ?? "", url: l.tautan_tipe === "url" ? l.tautan_id ?? "" : "" })),
    });
  };

  const simpan = async (status: "draf" | "tinjau") => {
    if (!form) return;
    const isi = form.langkah.filter(l => l.judul.trim());
    if (!form.judul.trim()) { toast(t("Isi judul dulu", "Add a title first"), "error"); return; }
    if (status === "tinjau" && isi.length < 2) { toast(t("Minimal 2 langkah sebelum dikirim", "At least 2 steps before submitting"), "error"); return; }
    const kontak = /(\+?62|08)\d{8,}|wa\.me|@gmail|instagram\.com|t\.me\//i;
    if ([form.judul, form.ringkasan, ...isi.map(l => `${l.judul} ${l.isi}`)].some(x => kontak.test(x))) {
      toast(t("Hapus nomor HP, email, atau akun pribadi — pembaca kebanyakan di bawah 18 tahun.", "Remove phone numbers, emails or personal accounts — most readers are under 18."), "error"); return;
    }
    setBusy(true);
    const payload = {
      judul: form.judul.trim(), ringkasan: form.ringkasan.trim() || null, mentor_id: mentorId,
      career_id: form.career_id || null, riasec: form.riasec || null, jenjang_target: form.jenjang, durasi: form.durasi.trim() || null,
      topik: "Karier", status, diperbarui_pada: new Date().toISOString(),
    };
    const q = form.id
      ? db.from("roadmaps").update(payload).eq("id", form.id).select("id").single()
      : db.from("roadmaps").insert({ ...payload, slug: `${slugify(form.judul) || "roadmap"}-${Math.random().toString(36).slice(2, 6)}` }).select("id").single();
    const { data: rm, error } = await q;
    if (error) { setBusy(false); toast(errMsg(error), "error"); return; }
    if (hapusIds.length) await db.from("roadmap_langkah").delete().in("id", hapusIds);
    for (let i = 0; i < isi.length; i++) {
      const l = isi[i];
      const url = l.url.trim();
      const row = { roadmap_id: rm.id, urut: i + 1, judul: l.judul.trim(), isi: l.isi.trim() || null, perkiraan: l.perkiraan.trim() || null,
        tautan_tipe: /^https?:\/\//.test(url) ? "url" : null, tautan_id: /^https?:\/\//.test(url) ? url : null };
      const { error: e2 } = l.id ? await db.from("roadmap_langkah").update(row).eq("id", l.id) : await db.from("roadmap_langkah").insert(row);
      if (e2) { setBusy(false); toast(errMsg(e2), "error"); return; }
    }
    setBusy(false);
    toast(status === "tinjau" ? t("Terkirim — admin akan meninjau sebelum terbit", "Submitted — an admin will review it before publishing") : t("Draf disimpan", "Draft saved"));
    setForm(null);
    qc.invalidateQueries({ queryKey: ["m-mentor-roadmaps"] });
  };

  const ubahL = (i: number, p: Partial<Langkah>) => setForm(f => f && ({ ...f, langkah: f.langkah.map((l, k) => (k === i ? { ...l, ...p } : l)) }));
  const chip = (on: boolean): React.CSSProperties => ({ height: 32, padding: "0 11px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${on ? C.blue : C.line}`, background: on ? C.tintBlue : "#fff", color: on ? C.blue : C.text2 });

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 16, boxShadow: SH.card }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t("Roadmap saya", "My roadmaps")}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{t("Bagikan jalur yang kamu tempuh — admin meninjau sebelum terbit.", "Share the path you took — an admin reviews before publishing.")}</div>
        </div>
        <Btn full={false} h={38} onClick={() => buka()} style={{ fontSize: 12.5, padding: "0 14px" }}><Icon name="plus" size={15} />{t("Buat", "New")}</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {(rows ?? []).map(r => {
          const [id, en, bg, fg] = STATUS[r.status] ?? STATUS.draf;
          return (
            <button key={r.id} onClick={() => (r.status === "terbit" ? toast(t("Roadmap terbit hanya bisa diubah admin. Hubungi tim Talentika.", "Published roadmaps can only be edited by an admin.")) : buka(r))}
              style={{ textAlign: "left", border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 14, padding: "10px 12px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{r.judul}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, background: bg, color: fg, padding: "3px 8px", borderRadius: 99, flex: "none" }}>{lang === "en" ? en : id}</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                {r.n} {t("langkah", "steps")}{r.f ? ` · ${r.f.dilihat} ${t("dilihat", "views")} · ${r.f.dimulai} ${t("mulai", "started")} · ${r.f.selesai} ${t("selesai", "finished")}` : ""}
              </div>
            </button>
          );
        })}
        {!(rows ?? []).length && <div style={{ fontSize: 12.5, color: C.muted }}>{t("Belum ada roadmap.", "No roadmaps yet.")}</div>}
      </div>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? t("Ubah roadmap", "Edit roadmap") : t("Roadmap baru", "New roadmap")}>
        {form && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Label>{t("Judul", "Title")}</Label>
            <Input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} placeholder={t("Dari SMA sampai jadi Data Analyst", "From high school to Data Analyst")} />
            <Label>{t("Ringkasan", "Summary")}</Label>
            <TextArea value={form.ringkasan} onChange={e => setForm({ ...form, ringkasan: e.target.value })} rows={2} />
            <Label>{t("Karier terkait", "Related career")}</Label>
            <select value={form.career_id} onChange={e => setForm({ ...form, career_id: e.target.value })} style={{ height: 44, borderRadius: 12, border: `1.5px solid ${C.line}`, padding: "0 10px", fontSize: 14, background: "#fff" }}>
              <option value="">{t("— Umum —", "— General —")}</option>
              {careers.map(c => <option key={c.id} value={c.id}>{lang === "en" ? c.name_en ?? c.name : c.name}</option>)}
            </select>
            <Label>{t("Cocok untuk tipe (klik berurutan, maks. 3)", "Fits types (tap in order, max 3)")}</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {RIASEC.map(([h, l]) => { const pos = form.riasec.indexOf(h); return <button key={h} type="button" style={chip(pos >= 0)} onClick={() => setForm({ ...form, riasec: form.riasec.includes(h) ? form.riasec.replace(h, "") : (form.riasec + h).slice(0, 3) })}>{pos >= 0 ? `${pos + 1}. ` : ""}{l}</button>; })}
            </div>
            <Label>{t("Jenjang pembaca", "Reader level")}</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {JENJANG.map(([v, l]) => { const on = form.jenjang.includes(v); return <button key={v} type="button" style={chip(on)} onClick={() => setForm({ ...form, jenjang: on ? form.jenjang.filter(x => x !== v) : [...form.jenjang, v] })}>{l}</button>; })}
            </div>
            <Label>{t("Perkiraan durasi", "Estimated duration")}</Label>
            <Input value={form.durasi} onChange={e => setForm({ ...form, durasi: e.target.value })} placeholder={t("3 bulan", "3 months")} />

            <Label>{t("Langkah-langkah", "Steps")}</Label>
            {form.langkah.map((l, i) => (
              <div key={l.id ?? `b${i}`} style={{ border: `1.5px solid ${C.line}`, borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.blue, color: "#fff", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</span>
                  <Input value={l.judul} onChange={e => ubahL(i, { judul: e.target.value })} placeholder={t("Judul langkah", "Step title")} style={{ height: 40 }} />
                  <button type="button" aria-label={t("Hapus langkah", "Remove step")} onClick={() => setForm(f => { if (!f) return f; const x = f.langkah[i]; if (x.id) setHapusIds(h => [...h, x.id!]); return { ...f, langkah: f.langkah.filter((_, k) => k !== i) }; })}
                    style={{ border: "none", background: "none", color: C.red, cursor: "pointer", display: "flex" }}><Icon name="trash" size={16} /></button>
                </div>
                <TextArea value={l.isi} onChange={e => ubahL(i, { isi: e.target.value })} rows={2} placeholder={t("Apa yang dikerjakan & kenapa penting", "What to do & why it matters")} />
                <div style={{ display: "flex", gap: 6 }}>
                  <Input value={l.perkiraan} onChange={e => ubahL(i, { perkiraan: e.target.value })} placeholder={t("2 minggu", "2 weeks")} style={{ height: 40, width: 110 }} />
                  <Input value={l.url} onChange={e => ubahL(i, { url: e.target.value })} placeholder={t("Tautan situs resmi (opsional)", "Official link (optional)")} style={{ height: 40 }} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, langkah: [...form.langkah, { judul: "", isi: "", perkiraan: "", url: "" }] })}
              style={{ height: 40, border: `1.5px dashed ${C.line}`, borderRadius: 12, background: "#fff", color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ {t("Tambah langkah", "Add step")}</button>
            <div style={{ fontSize: 11.5, color: "#7A5200", background: C.tintYellow, borderRadius: 12, padding: "9px 11px", lineHeight: 1.5 }}>
              {t("Jangan cantumkan nomor HP, email, akun pribadi, atau tautan pembayaran — sebagian besar pembaca berusia di bawah 18 tahun.", "Don't include phone numbers, emails, personal accounts or payment links — most readers are under 18.")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn kind="outline" h={48} disabled={busy} onClick={() => simpan("draf")}>{t("Simpan draf", "Save draft")}</Btn>
              <Btn h={48} disabled={busy} onClick={() => simpan("tinjau")}>{busy ? "…" : t("Kirim untuk ditinjau", "Submit for review")}</Btn>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
