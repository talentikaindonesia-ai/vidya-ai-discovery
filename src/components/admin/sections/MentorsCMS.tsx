/**
 * MentorsCMS — platform-admin tool to approve/unapprove mentor applications.
 * Uses list_all_mentors + set_mentor_availability RPCs (has_role admin guarded).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, GraduationCap, BadgeCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { inputStyle, textareaStyle, Modal, Field } from "../adminShared";
import UnggahGambar from "../UnggahGambar";

interface MentorRow {
  id: string; name: string; title: string; bio: string | null;
  expertise_areas: string[] | null; experience_years: number | null;
  is_available: boolean; total_sessions: number; created_at: string;
  avatar_url?: string | null;
  // Kolom profil yang dipakai aplikasi mobile (MEN-01/02)
  company?: string | null; industry?: string | null; country?: string | null;
  languages?: string[] | null; price_per_session?: number | null;
  career_journey?: [string, string][] | null; is_verified?: boolean;
}
interface BookingRow {
  id: string; session_date: string; status: string; notes: string | null;
  rating: number | null; mentor_name: string; mentor_has_account: boolean; student_name: string;
}
const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

const B_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "⏳ Menunggu",     bg: "#FEF3C7", color: "#B45309" },
  confirmed: { label: "✅ Terkonfirmasi", bg: "#DBEAFE", color: "#1D4ED8" },
  completed: { label: "🎓 Selesai",       bg: "#D1FAE5", color: "#059669" },
  cancelled: { label: "✖ Dibatalkan",     bg: "#F3F4F6", color: "#6B7280" },
};
const fmtDate = (d: string) => new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function MentorsCMS() {
  const [tab, setTab] = useState<"applications" | "bookings">("applications");
  const [rows, setRows] = useState<MentorRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  /* Mentor diisi manual oleh admin. Sebelumnya CMS ini hanya bisa menyetujui/
     mencabut — tidak ada cara menambah, sehingga 5 mentor yang ada dulu masuk
     lewat seed dan semuanya fiktif (user_id NULL, rating & jumlah sesi
     karangan). Sudah dihapus 2026-09-09, diarsipkan di
     arsip_mentor_palsu_20260909. */
  const [form, setForm] = useState<Partial<MentorRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [keahlian, setKeahlian] = useState("");
  const [bahasa, setBahasa] = useState("");
  const [perjalanan, setPerjalanan] = useState("");
  const [hapusId, setHapusId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [mRes, bRes] = await Promise.all([
      rpc("list_all_mentors", {}),
      rpc("admin_all_mentor_bookings", {}),
    ]);
    if (mRes.error) toast.error(mRes.error.message);
    // list_all_mentors tidak mengembalikan avatar_url — diambil terpisah
    // (admin punya kebijakan baca penuh atas tabel mentors). Tanpa ini,
    // mengedit mentor akan mengosongkan fotonya.
    const { data: foto } = await (supabase.from("mentors") as any)
      .select("id, avatar_url, company, industry, country, languages, price_per_session, career_journey, is_verified");
    const petaFoto = new Map((foto ?? []).map((f: any) => [f.id, f]));
    setRows(((mRes.data as MentorRow[]) || []).map(m => ({ ...m, ...((petaFoto.get(m.id) as any) ?? {}) })));
    setBookings((bRes.data as BookingRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (m: MentorRow) => {
    setBusy(m.id);
    const { error } = await rpc("set_mentor_availability", { p_mentor_id: m.id, p_available: !m.is_available });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!m.is_available ? `${m.name} disetujui sebagai mentor ✓` : `Persetujuan ${m.name} dicabut`);
    setRows(rows.map(r => r.id === m.id ? { ...r, is_available: !m.is_available } : r));
  };

  const actOnBooking = async (b: BookingRow, action: "confirm" | "decline" | "complete") => {
    setBusy(b.id);
    const { error } = action === "complete"
      ? await rpc("complete_mentor_booking", { p_booking_id: b.id })
      : await rpc("respond_mentor_booking", { p_booking_id: b.id, p_action: action });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking diperbarui — siswa diberi tahu.");
    load();
  };

  const simpanMentor = async () => {
    if (!form?.name?.trim()) { toast.error("Nama mentor wajib diisi"); return; }
    setSaving(true);
    const { data, error } = await rpc("admin_upsert_mentor", {
      p_id: form.id ?? null,
      p_name: form.name.trim(),
      p_title: form.title || null,
      p_bio: form.bio || null,
      p_expertise_areas: keahlian.split(",").map(s => s.trim()).filter(Boolean),
      p_experience_years: form.experience_years ?? null,
      p_avatar_url: form.avatar_url ?? null,
      p_is_available: form.is_available ?? false,
    });
    if (error) { setSaving(false); toast.error(error.message); return; }
    // Kolom tambahan aplikasi mobile — admin punya akses tulis penuh ke tabel mentors
    const mentorId = (form.id ?? data) as string;
    const journey = perjalanan.split("\n").map(l => l.split("|").map(x => x.trim())).filter(([y, r]) => y && r).map(([y, r]) => [y, r]);
    const { error: e2 } = await (supabase.from("mentors") as any).update({
      company: form.company?.trim() || null,
      industry: form.industry?.trim() || null,
      country: form.country?.trim() || "Indonesia",
      languages: bahasa.split(",").map(s => s.trim()).filter(Boolean),
      price_per_session: form.price_per_session ?? null,
      career_journey: journey,
      is_verified: !!form.is_verified,
    }).eq("id", mentorId);
    setSaving(false);
    if (e2) { toast.error("Data utama tersimpan, tapi profil mobile gagal: " + e2.message); load(); return; }
    toast.success(form.id ? "Mentor diperbarui" : "Mentor ditambahkan — setujui agar tampil ke siswa");
    setForm(null); setKeahlian(""); setBahasa(""); setPerjalanan(""); load();
  };

  const hapusMentor = async () => {
    if (!hapusId) return;
    const { error } = await rpc("admin_delete_mentor", { p_id: hapusId });
    setHapusId(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Mentor dihapus"); load();
  };

  const approved = rows.filter(r => r.is_available).length;
  const pendingBookings = bookings.filter(b => b.status === "pending").length;

  const TabBtn = ({ id, label }: { id: typeof tab; label: string }) => (
    <button onClick={() => setTab(id)}
      style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, background: tab === id ? "#2563EB" : "transparent", color: tab === id ? "#fff" : "#64748B" }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "inline-flex", gap: 4, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        <TabBtn id="applications" label="🎓 Aplikasi Mentor" />
        <TabBtn id="bookings" label={`📅 Semua Booking${pendingBookings > 0 ? ` (${pendingBookings})` : ""}`} />
      </div>

      {tab === "bookings" ? (
        <div>
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
            ) : bookings.length === 0 ? (
              <div style={{ padding: 50, textAlign: "center", color: "#94A3B8" }}>
                <GraduationCap size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />
                <div>Belum ada booking sesi mentoring</div>
              </div>
            ) : bookings.map((b, i) => {
              const cfg = B_CFG[b.status] ?? B_CFG.pending;
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 20px", borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13.5, color: "#0F172A" }}>
                      <b>{b.student_name}</b> → <b>{b.mentor_name}</b>
                      {!b.mentor_has_account && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 7px", borderRadius: 99, marginLeft: 6 }}>mentor demo</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{fmtDate(b.session_date)}{b.rating ? ` · ⭐ ${b.rating}` : ""}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 11px", borderRadius: 99 }}>{cfg.label}</span>
                  {b.status === "pending" && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button disabled={busy === b.id} onClick={() => actOnBooking(b, "confirm")} style={{ background: "#2563EB", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Konfirmasi</button>
                      <button disabled={busy === b.id} onClick={() => actOnBooking(b, "decline")} style={{ background: "#fff", color: "#6B7280", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 12px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Tolak</button>
                    </div>
                  )}
                  {b.status === "confirmed" && (
                    <button disabled={busy === b.id} onClick={() => actOnBooking(b, "complete")} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Tandai Selesai</button>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 10 }}>
            💡 Untuk mentor demo (tanpa akun), kamu bisa konfirmasi/selesaikan booking atas nama mereka di sini.
          </p>
        </div>
      ) : (
      <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Total Aplikasi", value: rows.length, color: "#2563EB" },
          { label: "Mentor Aktif", value: approved, color: "#10B981" },
          { label: "Menunggu Persetujuan", value: rows.length - approved, color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => { setForm({ is_available: false, country: "Indonesia" }); setKeahlian(""); setBahasa("Bahasa Indonesia"); setPerjalanan(""); }}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> Tambah Mentor
        </button>
      </div>

      <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={26} className="animate-spin" style={{ color: "#2563EB" }} /></div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "44px 30px", textAlign: "center", color: "#94A3B8" }}>
            <GraduationCap size={32} style={{ margin: "0 auto 10px", opacity: .5 }} />
            <div style={{ fontWeight: 700, color: "#475569", fontSize: 14 }}>Belum ada mentor</div>
            <div style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.6, maxWidth: 460, margin: "6px auto 0" }}>
              5 mentor lama dihapus pada 9 Sep 2026 karena seluruhnya fiktif — tanpa akun,
              dengan rating dan jumlah sesi yang tidak pernah terjadi. Tambahkan mentor
              nyata lewat tombol di atas; rating akan terisi sendiri dari sesi yang benar-benar berjalan.
            </div>
          </div>
        ) : rows.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 20px", borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                {m.name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{m.name}</span>
                {m.is_available && <BadgeCheck size={14} style={{ color: "#2563EB" }} />}
                <span style={{ fontSize: 12, color: "#94A3B8" }}>· {m.title}{m.company ? ` · ${m.company}` : ""}</span>
                {m.is_verified && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1D4ED8", background: "#DBEAFE", padding: "2px 7px", borderRadius: 99 }}>✓ Terverifikasi</span>}
              </div>
              {m.bio && <div style={{ fontSize: 12.5, color: "#64748B", margin: "4px 0", lineHeight: 1.5 }}>{m.bio}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {(m.expertise_areas || []).slice(0, 6).map(e => <span key={e} style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 99 }}>{e}</span>)}
                {(m.experience_years ?? 0) > 0 && <span style={{ fontSize: 11, color: "#94A3B8" }}>{m.experience_years} thn</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setForm({ ...m }); setKeahlian((m.expertise_areas || []).join(", ")); setBahasa((m.languages || []).join(", ")); setPerjalanan((m.career_journey || []).map(j => `${j[0]} | ${j[1]}`).join("\n")); }}
                title="Ubah data mentor"
                style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", cursor: "pointer" }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => setHapusId(m.id)} title="Hapus mentor"
                style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #FECACA", background: "white", color: "#B91C1C", cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
              <button onClick={() => toggle(m)} disabled={busy === m.id}
                style={{ padding: "8px 16px", borderRadius: 9, border: "none", cursor: busy === m.id ? "wait" : "pointer", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 12.5, background: m.is_available ? "#FEF2F2" : "#EFF6FF", color: m.is_available ? "#DC2626" : "#2563EB" }}>
                {busy === m.id ? "…" : m.is_available ? "Cabut" : "Setujui"}
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
      )}

      {form && (
        <Modal title={form.id ? "Ubah Mentor" : "Tambah Mentor"} onClose={() => setForm(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Foto">
              <UnggahGambar value={form.avatar_url} onChange={url => setForm(p => ({ ...p, avatar_url: url }))}
                folder="mentor" bulat />
            </Field>
            <Field label="Nama lengkap">
              <input value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="mis. Dra. Sri Wahyuni" style={inputStyle} />
            </Field>
            <Field label="Jabatan / profesi" half>
              <input value={form.title ?? ""} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="mis. Guru BK SMAN 1" style={inputStyle} />
            </Field>
            <Field label="Pengalaman (tahun)" half>
              <input type="number" min={0} value={form.experience_years ?? ""}
                onChange={e => setForm(p => ({ ...p, experience_years: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </Field>
            <Field label="Bidang keahlian (pisahkan dengan koma)">
              <input value={keahlian} onChange={e => setKeahlian(e.target.value)}
                placeholder="Konseling Karier, Persiapan SNBT, Beasiswa" style={inputStyle} />
            </Field>
            <Field label="Perusahaan / instansi" half>
              <input value={form.company ?? ""} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="mis. Google" style={inputStyle} />
            </Field>
            <Field label="Industri" half>
              <input value={form.industry ?? ""} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                placeholder="mis. Technology" style={inputStyle} />
            </Field>
            <Field label="Negara" half>
              <input value={form.country ?? ""} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                placeholder="Indonesia" style={inputStyle} />
            </Field>
            <Field label="Tarif per sesi (Rp, opsional)" half>
              <input type="number" min={0} step={5000} value={form.price_per_session ?? ""}
                onChange={e => setForm(p => ({ ...p, price_per_session: e.target.value ? Number(e.target.value) : null }))}
                style={inputStyle} />
            </Field>
            <Field label="Bahasa (pisahkan dengan koma)">
              <input value={bahasa} onChange={e => setBahasa(e.target.value)}
                placeholder="Bahasa Indonesia, English" style={inputStyle} />
            </Field>
            <Field label="Perjalanan karier (satu baris: tahun | peran)">
              <textarea value={perjalanan} onChange={e => setPerjalanan(e.target.value)} rows={3}
                placeholder={"2014 | Software Engineer · Traveloka\n2021 | AI Product Manager · Google"} style={textareaStyle} />
            </Field>
            <Field label="Bio singkat">
              <textarea value={form.bio ?? ""} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                rows={3} placeholder="Pengalaman dan fokus pendampingannya." style={textareaStyle} />
            </Field>
          </div>

          <div style={{ marginTop: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 12.5, color: "#64748B", lineHeight: 1.6 }}>
            Rating dan jumlah sesi <b>tidak bisa diisi di sini</b> — keduanya terisi sendiri
            dari sesi yang benar-benar berjalan. Mentor baru tampil tanpa penilaian sampai
            ada siswa yang menilainya.
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
            <input type="checkbox" checked={!!form.is_available}
              onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} />
            Langsung tampilkan ke siswa
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
            <input type="checkbox" checked={!!form.is_verified}
              onChange={e => setForm(p => ({ ...p, is_verified: e.target.checked }))} />
            Identitas & pengalaman sudah diverifikasi (badge ✓ di aplikasi)
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button onClick={() => setForm(null)}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={simpanMentor} disabled={saving}
              style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#2563EB", color: "white", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </Modal>
      )}

      {hapusId && (
        <Modal title="Hapus mentor ini?" onClose={() => setHapusId(null)}>
          <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7 }}>
            Mentor yang sudah punya riwayat booking tidak bisa dihapus — nonaktifkan saja
            lewat tombol "Cabut".
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button onClick={() => setHapusId(null)}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 600, cursor: "pointer" }}>Batal</button>
            <button onClick={hapusMentor}
              style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: "#DC2626", color: "white", fontWeight: 700, cursor: "pointer" }}>Hapus</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
