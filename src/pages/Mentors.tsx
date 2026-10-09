/**
 * Mentors — mentor directory + "Jadi Mentor" application + session booking.
 * Real data only (no seeded mentors): directory shows admin-approved mentors
 * (mentors.is_available=true). Applications start pending until admin approves.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { ArrowLeft, Star, Plus, Calendar, X, GraduationCap, Users, Lock } from "lucide-react";
import { LockedButton } from "@/components/payment/LockedButton";

interface Mentor {
  id: string; name: string; title: string; bio: string | null;
  expertise_areas: string[] | null; experience_years: number | null;
  rating: number | null; total_sessions: number | null;
  avatar_url: string | null;
}
interface MyProfile { id: string; name: string; title: string; is_available: boolean; }
interface MyBooking {
  id: string; session_date: string; status: string; notes: string | null;
  rating: number | null; mentors: { name: string } | null;
}
interface IncomingBooking {
  id: string; session_date: string; duration_minutes: number | null;
  status: string; notes: string | null; student_name: string;
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "⏳ Menunggu Konfirmasi", bg: "#FEF3C7", color: "#B45309" },
  confirmed: { label: "✅ Terkonfirmasi",       bg: "#DBEAFE", color: "#1D4ED8" },
  completed: { label: "🎓 Selesai",             bg: "#D1FAE5", color: "#059669" },
  cancelled: { label: "✖ Dibatalkan",           bg: "#F3F4F6", color: "#6B7280" },
};

const fmtSession = (d: string) =>
  new Date(d).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

const grad = ["linear-gradient(135deg,#3B82F6,#1D4ED8)", "linear-gradient(135deg,#10B981,#059669)", "linear-gradient(135deg,#8B5CF6,#7C3AED)", "linear-gradient(135deg,#F97316,#EA580C)", "linear-gradient(135deg,#EC4899,#DB2777)", "linear-gradient(135deg,#06B6D4,#0891B2)"];
const gradOf = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return grad[h % grad.length]; };
const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export default function Mentors() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mine, setMine] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [booking, setBooking] = useState<Mentor | null>(null);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [incoming, setIncoming] = useState<IncomingBooking[]>([]);
  const [ratingFor, setRatingFor] = useState<MyBooking | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: ms }, { data: mp }, { data: mb }, { data: inc }] = await Promise.all([
      supabase.from("mentors").select("id, name, title, bio, expertise_areas, experience_years, rating, total_sessions, avatar_url").eq("is_available", true).order("total_sessions", { ascending: false }),
      rpc("my_mentor_profile", {}),
      user
        ? supabase.from("mentor_bookings").select("id, session_date, status, notes, rating, mentors(name)").eq("user_id", user.id).order("session_date", { ascending: false })
        : Promise.resolve({ data: null }),
      rpc("my_incoming_bookings", {}),
    ]);
    setMentors((ms as Mentor[]) || []);
    setMine((mp as MyProfile) ?? null);
    setMyBookings((mb as unknown as MyBooking[]) || []);
    setIncoming((inc as IncomingBooking[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ── Mentor actions on incoming bookings ────────────────────────────────────
  const respond = async (id: string, action: "confirm" | "decline") => {
    setActing(id);
    const { error } = await rpc("respond_mentor_booking", { p_booking_id: id, p_action: action });
    if (error) toast.error(error.message);
    else toast.success(action === "confirm" ? "Sesi dikonfirmasi — siswa sudah diberi tahu ✅" : "Sesi ditolak — siswa diberi tahu.");
    setActing(null); load();
  };
  const complete = async (id: string) => {
    setActing(id);
    const { error } = await rpc("complete_mentor_booking", { p_booking_id: id });
    if (error) toast.error(error.message);
    else toast.success("Sesi ditandai selesai 🎓 Siswa diminta memberi rating.");
    setActing(null); load();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#F8FAFD,#EEF3FB)" }}>
      <SEO title="Mentor — Talentika" description="Terhubung dengan mentor profesional untuk bimbingan karier 1-on-1." />
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--tk-gray-200)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tk-gray-500)", display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 600 }}>
          <ArrowLeft size={17} /> Dashboard
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowApply(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 11, padding: "9px 16px", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Jadi Mentor
        </button>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px 60px" }}>
        <h1 style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26, color: "var(--tk-ink)", margin: "0 0 6px" }}>Temukan Mentormu 🎓</h1>
        <p style={{ fontSize: 14.5, color: "var(--tk-gray-500)", margin: "0 0 8px" }}>Bimbingan karier 1-on-1 dari mentor profesional & berpengalaman.</p>

        {/* Own application status */}
        {mine && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: mine.is_available ? "var(--tk-mint,#ECFDF5)" : "#FFF7ED", border: `1px solid ${mine.is_available ? "#A7F3D0" : "#FED7AA"}`, borderRadius: 12, padding: "8px 14px", fontSize: 12.5, color: mine.is_available ? "#059669" : "#B45309", marginTop: 6, marginBottom: 4, fontWeight: 600 }}>
            <GraduationCap size={15} /> {mine.is_available ? "Kamu terdaftar sebagai mentor aktif ✓" : "Aplikasi mentormu sedang ditinjau tim Talentika…"}
          </div>
        )}

        {/* ── Booking Masuk (mentor view) ─────────────────────────────────── */}
        {incoming.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #BFDBFE", padding: "18px 20px", marginTop: 18, marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-ink)", marginBottom: 14 }}>
              📥 Booking Masuk ({incoming.filter(b => b.status === "pending").length} menunggu)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {incoming.map(b => {
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--tk-gray-200)", background: "var(--tk-gray-50,#F8FAFC)" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tk-ink)" }}>{b.student_name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 2 }}>{fmtSession(b.session_date)}</div>
                      {b.notes && <div style={{ fontSize: 12.5, color: "var(--tk-gray-600)", marginTop: 4, fontStyle: "italic" }}>“{b.notes}”</div>}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 11px", borderRadius: 99 }}>{cfg.label}</span>
                    {b.status === "pending" && (
                      <div style={{ display: "flex", gap: 7 }}>
                        <button disabled={acting === b.id} onClick={() => respond(b.id, "confirm")} style={{ background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Konfirmasi</button>
                        <button disabled={acting === b.id} onClick={() => respond(b.id, "decline")} style={{ background: "#fff", color: "#6B7280", border: "1px solid var(--tk-gray-200)", borderRadius: 9, padding: "8px 14px", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Tolak</button>
                      </div>
                    )}
                    {b.status === "confirmed" && (
                      <button disabled={acting === b.id} onClick={() => complete(b.id)} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Tandai Selesai</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sesi Saya (student view) ────────────────────────────────────── */}
        {myBookings.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--tk-gray-200)", padding: "18px 20px", marginTop: 18, marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "var(--tk-ink)", marginBottom: 14 }}>
              🗓 Sesi Mentoring Saya
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myBookings.map(b => {
                const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--tk-gray-200)", background: "var(--tk-gray-50,#F8FAFC)" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--tk-ink)" }}>{b.mentors?.name ?? "Mentor"}</div>
                      <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)", marginTop: 2 }}>{fmtSession(b.session_date)}</div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "4px 11px", borderRadius: 99 }}>{cfg.label}</span>
                    {b.status === "completed" && b.rating == null && (
                      <button onClick={() => setRatingFor(b)} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Star size={13} /> Beri Rating
                      </button>
                    )}
                    {b.status === "completed" && b.rating != null && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>
                        {"★".repeat(b.rating)}<span style={{ color: "var(--tk-gray-300)" }}>{"★".repeat(5 - b.rating)}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--tk-gray-400)" }}>Memuat mentor…</div>
        ) : mentors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 20, border: "1px solid var(--tk-gray-200)", marginTop: 18 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🤝</div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 8 }}>Mentor hebat segera bergabung</div>
            <div style={{ fontSize: 14, color: "var(--tk-gray-500)", maxWidth: 400, margin: "0 auto 20px", lineHeight: 1.6 }}>Kami sedang mengkurasi mentor profesional. Punya keahlian untuk dibagikan? Jadilah mentor pertama!</div>
            <button onClick={() => setShowApply(true)} style={{ background: "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 26px", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Jadi Mentor →</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 18 }}>
            {mentors.map(m => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--tk-gray-200)", padding: "20px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.name} loading="lazy"
                      style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: gradOf(m.id), display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{initials(m.name)}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)" }}>{m.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--tk-gray-500)" }}>{m.title}</div>
                  </div>
                </div>
                {m.bio && <div style={{ fontSize: 13, color: "var(--tk-gray-600)", lineHeight: 1.55, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{m.bio}</div>}
                {m.expertise_areas && m.expertise_areas.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {m.expertise_areas.slice(0, 4).map(e => <span key={e} style={{ fontSize: 11, fontWeight: 600, color: "var(--tk-blue-600)", background: "var(--tk-blue-50)", padding: "3px 9px", borderRadius: 99 }}>{e}</span>)}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--tk-gray-500)", marginBottom: 14 }}>
                  {/* Rating hanya muncul kalau benar-benar ada sesi yang dinilai.
                      Default kolom `rating` dulu 5.00, sehingga mentor yang belum
                      pernah sekali pun mengajar tampil berbintang lima. Default itu
                      sudah dilepas; NULL berarti belum dinilai, dan dikatakan apa adanya. */}
                  {(m.rating ?? 0) > 0 && (m.total_sessions ?? 0) > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#F59E0B", fontWeight: 700 }}>
                      <Star size={12} fill="#F59E0B" /> {Number(m.rating).toFixed(1)}
                    </span>
                  )}
                  {(m.experience_years ?? 0) > 0 && <span>{m.experience_years} thn pengalaman</span>}
                  {(m.total_sessions ?? 0) > 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Users size={12} /> {m.total_sessions} sesi</span>
                  ) : (
                    <span style={{ color: "var(--tk-gray-400)" }}>Mentor baru — belum ada penilaian</span>
                  )}
                </div>
                <LockedButton
                  feature="Booking Sesi Mentor"
                  benefits={[
                    "Sesi 1-on-1 dengan mentor profesional",
                    "Bimbingan karier sesuai hasil tes bakatmu",
                    "Akses semua fitur premium lainnya",
                  ]}
                  fromPath="/mentors"
                  onClick={() => setBooking(m)}
                >
                  {(locked, guardedClick) => (
                    <button onClick={guardedClick} style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: locked ? "linear-gradient(135deg,#475569,#334155)" : "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                      {locked ? <Lock size={14} /> : <Calendar size={15} />} Ajukan Sesi
                    </button>
                  )}
                </LockedButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {showApply && <ApplyModal existing={mine} onClose={() => setShowApply(false)} onDone={() => { setShowApply(false); load(); }} />}
      {booking && <BookingModal mentor={booking} onClose={() => setBooking(null)} onDone={() => { setBooking(null); load(); }} />}
      {ratingFor && <RatingModal booking={ratingFor} onClose={() => setRatingFor(null)} onDone={() => { setRatingFor(null); load(); }} />}
    </div>
  );
}

/* ── Modals ─────────────────────────────────────────────────────────────── */
function ApplyModal({ existing, onClose, onDone }: { existing: MyProfile | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(existing?.name ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [exp, setExp] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !title.trim()) { toast.error("Nama & bidang keahlian wajib diisi"); return; }
    setSaving(true);
    const { error } = await rpc("apply_as_mentor", {
      p_name: name.trim(), p_title: title.trim(), p_bio: bio.trim(),
      p_expertise: expertise.split(",").map(s => s.trim()).filter(Boolean),
      p_experience: parseInt(exp) || 0,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Aplikasi mentor terkirim! Tim Talentika akan meninjau.");
    onDone();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 4 }}>Jadi Mentor Talentika</div>
      <div style={{ fontSize: 13, color: "var(--tk-gray-500)", marginBottom: 18 }}>Bagikan keahlianmu & bimbing pelajar. Profil ditinjau sebelum tampil.</div>
      <Field label="Nama lengkap *"><input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Nama kamu" /></Field>
      <Field label="Bidang/Jabatan *"><input value={title} onChange={e => setTitle(e.target.value)} style={inp} placeholder="mis. Data Scientist di Gojek" /></Field>
      <Field label="Bidang keahlian (pisah koma)"><input value={expertise} onChange={e => setExpertise(e.target.value)} style={inp} placeholder="Data Science, Karier Tech, AI" /></Field>
      <Field label="Pengalaman (tahun)"><input value={exp} onChange={e => setExp(e.target.value.replace(/\D/g, ""))} style={inp} placeholder="5" inputMode="numeric" /></Field>
      <Field label="Bio singkat"><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="Ceritakan pengalaman & apa yang bisa kamu bagikan…" /></Field>
      <button onClick={submit} disabled={saving} style={{ width: "100%", background: saving ? "var(--tk-gray-300)" : "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", marginTop: 6 }}>
        {saving ? "Mengirim…" : existing ? "Perbarui Profil Mentor" : "Kirim Aplikasi"}
      </button>
    </Overlay>
  );
}

function BookingModal({ mentor, onClose, onDone }: { mentor: Mentor; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!date) { toast.error("Pilih tanggal & waktu sesi"); return; }
    if (new Date(date).getTime() < Date.now()) { toast.error("Pilih waktu di masa depan"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Silakan login dulu"); setSaving(false); return; }
    const { error } = await supabase.from("mentor_bookings").insert({
      user_id: user.id, mentor_id: mentor.id, session_date: new Date(date).toISOString(),
      duration_minutes: 60, status: "pending", notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Permintaan sesi dengan ${mentor.name} terkirim! 🎉`);
    onDone();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 4 }}>Ajukan Sesi Mentoring</div>
      <div style={{ fontSize: 13, color: "var(--tk-gray-500)", marginBottom: 18 }}>Bersama <b>{mentor.name}</b> · {mentor.title}</div>
      <Field label="Tanggal & waktu *"><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={inp} /></Field>
      <Field label="Topik yang ingin dibahas"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="mis. Cara masuk industri data, review CV, dll." /></Field>
      <button onClick={submit} disabled={saving} style={{ width: "100%", background: saving ? "var(--tk-gray-300)" : "var(--tk-blue-600)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", marginTop: 6 }}>
        {saving ? "Mengirim…" : "Kirim Permintaan Sesi"}
      </button>
    </Overlay>
  );
}

function RatingModal({ booking, onClose, onDone }: { booking: MyBooking; onClose: () => void; onDone: () => void }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (stars < 1) { toast.error("Pilih rating dulu"); return; }
    setSaving(true);
    const { error } = await rpc("rate_mentor_session", { p_booking_id: booking.id, p_rating: stars, p_note: note.trim() || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Terima kasih atas ratingmu! ⭐");
    onDone();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: "var(--tk-ink)", marginBottom: 4 }}>Beri Rating Sesi</div>
      <div style={{ fontSize: 13, color: "var(--tk-gray-500)", marginBottom: 18 }}>Bagaimana sesimu bersama <b>{booking.mentors?.name ?? "mentor"}</b>?</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setStars(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}>
            <Star size={36} fill={(hover || stars) >= n ? "#F59E0B" : "none"} color={(hover || stars) >= n ? "#F59E0B" : "var(--tk-gray-300)"} />
          </button>
        ))}
      </div>
      <Field label="Ceritakan pengalamanmu (opsional)"><textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="mis. Penjelasannya mudah dipahami, sangat membantu…" /></Field>
      <button onClick={submit} disabled={saving} style={{ width: "100%", background: saving ? "var(--tk-gray-300)" : "#F59E0B", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", marginTop: 6 }}>
        {saving ? "Mengirim…" : "Kirim Rating"}
      </button>
    </Overlay>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: "10px 13px", borderRadius: 10, border: "1.5px solid var(--tk-gray-200)", fontFamily: "var(--tk-font-sans)", fontSize: 14, outline: "none", boxSizing: "border-box" };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontFamily: "var(--tk-font-display)", fontWeight: 600, fontSize: 12.5, color: "var(--tk-ink)", marginBottom: 5 }}>{label}</label>{children}</div>;
}
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 26px", width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "var(--tk-gray-100)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "var(--tk-gray-500)", display: "grid", placeItems: "center" }}><X size={17} /></button>
        {children}
      </div>
    </div>
  );
}
