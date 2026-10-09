import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Save, CalendarDays, Users, MapPin, ImageIcon } from "lucide-react";
import { inputStyle, selectStyle, textareaStyle, Toggle, Modal, Confirm, Field } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

/**
 * EventsCMS — kelola event (webinar, workshop, meetup, bootcamp).
 *
 * Sebelum 2026-09-14 tidak ada menu event di CMS, dan tabel community_events
 * tidak punya kebijakan tulis untuk admin sama sekali — event mustahil dibuat
 * dari mana pun. Komponen lama CommunityManager.tsx tidak dipasang di mana pun.
 *
 * Belum di sini (menunggu fondasi pesanan & jalur bayar terbukti): tiket
 * berbayar, tautan Zoom yang hanya terlihat peserta terdaftar, check-in.
 */

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  duration_minutes: number | null;
  max_participants: number | null;
  current_participants: number | null;
  location: string | null;
  is_premium_only: boolean | null;
  is_active: boolean | null;
  banner_url: string | null;
  created_at: string;
}

// Harus sama dengan getEventTypeColor() di CommunityForum.tsx
const JENIS: { v: string; label: string; bg: string; color: string }[] = [
  { v: "webinar",  label: "Webinar",  bg: "#ECFDF5", color: "#047857" },
  { v: "workshop", label: "Workshop", bg: "#EFF6FF", color: "#1D4ED8" },
  { v: "meetup",   label: "Meetup",   bg: "#F5F3FF", color: "#5B21B6" },
  { v: "bootcamp", label: "Bootcamp", bg: "#FFF7ED", color: "#C2410C" },
];
const jenisCfg = (v: string) => JENIS.find(j => j.v === v) ?? { v, label: v, bg: "#F1F5F9", color: "#475569" };

// <input type="datetime-local"> bekerja dalam zona waktu perangkat admin.
function keInputLokal(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const KOSONG: Partial<EventRow> = {
  title: "", description: "", event_type: "webinar", duration_minutes: 90,
  max_participants: 100, location: "Online (Zoom)", is_premium_only: false,
  is_active: false, banner_url: null,
};

// banner_url belum ada di tipe hasil generate Supabase
const tabel = () => supabase.from("community_events" as any) as any;

export default function EventsCMS() {
  const [rows, setRows]         = useState<EventRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState<Partial<EventRow> | null>(null);
  const [tanggal, setTanggal]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [hapusId, setHapusId]   = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<"mendatang" | "lewat" | "semua">("mendatang");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await tabel().select("*").order("event_date", { ascending: true });
    if (error) toast.error("Gagal memuat event: " + error.message);
    setRows((data ?? []) as EventRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bukaBaru = () => { setForm({ ...KOSONG }); setTanggal(""); };
  const bukaEdit = (e: EventRow) => { setForm({ ...e }); setTanggal(keInputLokal(e.event_date)); };

  async function simpan() {
    if (!form?.title?.trim()) { toast.error("Judul event wajib diisi"); return; }
    if (!tanggal) { toast.error("Tanggal & jam event wajib diisi"); return; }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      event_type: form.event_type || "webinar",
      event_date: new Date(tanggal).toISOString(),
      duration_minutes: form.duration_minutes ?? null,
      max_participants: form.max_participants ?? null,
      location: form.location || null,
      is_premium_only: !!form.is_premium_only,
      is_active: !!form.is_active,
      banner_url: form.banner_url || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (form.id) {
      ({ error } = await tabel().update(payload).eq("id", form.id));
    } else {
      const { data: u } = await supabase.auth.getUser();
      ({ error } = await tabel().insert({ ...payload, organizer_id: u?.user?.id ?? null, current_participants: 0 }));
    }
    setSaving(false);
    if (error) { toast.error("Gagal menyimpan: " + error.message); return; }
    toast.success(form.id ? "Event diperbarui" : payload.is_active ? "Event diterbitkan" : "Event disimpan sebagai draf");
    setForm(null);
    load();
  }

  async function toggleTerbit(e: EventRow) {
    setTogglingId(e.id);
    const is_active = !e.is_active;
    const { error } = await tabel().update({ is_active, updated_at: new Date().toISOString() }).eq("id", e.id);
    setTogglingId(null);
    if (error) { toast.error(error.message); return; }
    setRows(prev => prev.map(r => r.id === e.id ? { ...r, is_active } : r));
    toast.success(is_active ? "Event diterbitkan — tampil di halaman Komunitas" : "Event disembunyikan");
  }

  async function hapus() {
    if (!hapusId) return;
    setMenghapus(true);
    const { error } = await tabel().delete().eq("id", hapusId);
    setMenghapus(false);
    if (error) {
      toast.error(/foreign key|violates/i.test(error.message)
        ? "Event ini sudah punya peserta terdaftar — sembunyikan saja, jangan dihapus."
        : "Gagal menghapus: " + error.message);
      return;
    }
    toast.success("Event dihapus");
    setHapusId(null);
    load();
  }

  const sekarang = Date.now();
  const mendatang = rows.filter(r => new Date(r.event_date).getTime() >= sekarang);
  const lewat = rows.filter(r => new Date(r.event_date).getTime() < sekarang).reverse();
  const tampil = filter === "mendatang" ? mendatang : filter === "lewat" ? lewat : rows;
  const draf = mendatang.filter(r => !r.is_active).length;

  return (
    <div>
      {/* Ringkasan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Event mendatang", value: mendatang.length, color: "#2563EB" },
          { label: "Terbit & tampil ke siswa", value: mendatang.length - draf, color: "#059669" },
          { label: "Draf (belum tampil)", value: draf, color: draf > 0 ? "#B45309" : "#94A3B8" },
          { label: "Total pendaftar", value: rows.reduce((a, r) => a + (r.current_participants ?? 0), 0), color: "#7C3AED" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "inline-flex", gap: 4, background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: 3 }}>
          {([["mendatang", "Mendatang"], ["lewat", "Sudah lewat"], ["semua", "Semua"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5,
                       background: filter === id ? "#2563EB" : "transparent", color: filter === id ? "white" : "#64748B" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={bukaBaru}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Event
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : tampil.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "46px 24px", textAlign: "center", color: "#94A3B8" }}>
          <CalendarDays size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .5 }} />
          <div style={{ fontWeight: 700, color: "#475569" }}>
            {filter === "lewat" ? "Belum ada event yang sudah lewat" : "Belum ada event mendatang"}
          </div>
          {filter !== "lewat" && (
            <div style={{ fontSize: 12.5, marginTop: 6 }}>
              Event yang diterbitkan akan tampil di halaman Komunitas siswa.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {tampil.map(e => {
            const j = jenisCfg(e.event_type);
            const sudahLewat = new Date(e.event_date).getTime() < sekarang;
            return (
              <div key={e.id} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column", opacity: sudahLewat ? .75 : 1 }}>
                <div style={{ aspectRatio: "16 / 9", background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                  {e.banner_url
                    ? <img src={e.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <ImageIcon size={26} style={{ color: "#CBD5E1" }} />}
                </div>
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: j.bg, color: j.color }}>{j.label}</span>
                    {e.is_premium_only && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEF9C3", color: "#854D0E" }}>Premium</span>}
                    {!e.is_active && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#FEF3C7", color: "#B45309" }}>Draf</span>}
                    {sudahLewat && <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#F1F5F9", color: "#64748B" }}>Sudah lewat</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "#0F172A", lineHeight: 1.35 }}>{e.title}</div>
                  <div style={{ fontSize: 12.5, color: "#475569", display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><CalendarDays size={13} /> {fmtTanggal(e.event_date)}</span>
                    {e.location && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={13} /> {e.location}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={13} /> {e.current_participants ?? 0}{e.max_participants ? ` / ${e.max_participants}` : ""} pendaftar</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: "1px solid #F1F5F9" }}>
                    <Toggle on={!!e.is_active} loading={togglingId === e.id} onToggle={() => toggleTerbit(e)} />
                    <span style={{ fontSize: 12, color: "#64748B" }}>{e.is_active ? "Terbit" : "Draf"}</span>
                    <button onClick={() => bukaEdit(e)} title="Ubah"
                      style={{ marginLeft: "auto", padding: "7px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setHapusId(e.id)} title="Hapus"
                      style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Ubah Event" : "Tambah Event"} onClose={() => setForm(null)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", padding: "24px 28px" }}>
            <Field label="Banner event">
              <UnggahGambar value={form.banner_url} onChange={url => setForm(p => ({ ...p, banner_url: url }))}
                folder="event" rasio="16 / 9" saran="1600 × 900 px" />
            </Field>
            <Field label="Judul">
              <input value={form.title ?? ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="mis. Webinar: Cara Lolos LPDP 2027" style={inputStyle} />
            </Field>
            <Field label="Jenis" half>
              <select value={form.event_type ?? "webinar"} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))} style={selectStyle}>
                {JENIS.map(j => <option key={j.v} value={j.v}>{j.label}</option>)}
              </select>
            </Field>
            <Field label="Tanggal & jam (waktu perangkatmu)" half>
              <input type="datetime-local" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Durasi (menit)" half>
              <input type="number" min={0} value={form.duration_minutes ?? ""}
                onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value ? Number(e.target.value) : null }))} style={inputStyle} />
            </Field>
            <Field label="Kuota peserta (kosongkan = tanpa batas)" half>
              <input type="number" min={0} value={form.max_participants ?? ""}
                onChange={e => setForm(p => ({ ...p, max_participants: e.target.value ? Number(e.target.value) : null }))} style={inputStyle} />
            </Field>
            <Field label="Lokasi">
              <input value={form.location ?? ""} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                placeholder="Online (Zoom) — atau alamat lengkap" style={inputStyle} />
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 5 }}>
                Jangan tempel tautan Zoom di sini — kolom ini terlihat publik. Tautan khusus peserta belum tersedia.
              </div>
            </Field>
            <Field label="Deskripsi">
              <textarea value={form.description ?? ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Apa yang akan dipelajari, siapa pembicaranya, untuk siapa event ini." style={{ ...textareaStyle, minHeight: 100 }} />
            </Field>
            <div style={{ gridColumn: "span 2", display: "flex", gap: 22, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.is_premium_only} onChange={e => setForm(p => ({ ...p, is_premium_only: e.target.checked }))} />
                Khusus pelanggan premium
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
                Terbitkan sekarang (tampil di halaman Komunitas)
              </label>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 28px 24px" }}>
            <button onClick={() => setForm(null)}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
              Batal
            </button>
            <button onClick={simpan} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Menyimpan…" : form.is_active ? "Simpan & terbitkan" : "Simpan sebagai draf"}
            </button>
          </div>
        </Modal>
      )}

      {hapusId && (
        <Confirm
          message="Hapus event ini? Event yang sudah punya pendaftar tidak bisa dihapus — sembunyikan saja."
          onConfirm={hapus}
          onCancel={() => setHapusId(null)}
          loading={menghapus}
        />
      )}
    </div>
  );
}
