import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, CheckCircle2 } from "lucide-react";

export type PaketSekolah = "essential" | "core" | "future_ready" | "belum_yakin";

export const LABEL_PAKET_SEKOLAH: Record<PaketSekolah, string> = {
  essential: "School Essential",
  core: "Talentika School Core™",
  future_ready: "Talentika Future Ready School™",
  belum_yakin: "Belum yakin — ingin konsultasi",
};

const WA_SEKOLAH = "6282249148433";

const input: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: "1.5px solid #E2E8F0",
  fontSize: 14.5, boxSizing: "border-box", outline: "none", fontFamily: "inherit", background: "#fff",
};
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 };

interface Props {
  open: boolean;
  paket: PaketSekolah;
  onClose: () => void;
}

/**
 * Form "Hubungi Kami" paket sekolah. Isian masuk ke school_inquiries
 * (pengunjung boleh mengirim, hanya admin yang bisa membaca) dan tampil di
 * CMS → Permintaan Sekolah.
 */
export default function SchoolInquiryModal({ open, paket, onClose }: Props) {
  const [f, setF] = useState({
    package: paket as PaketSekolah, school_name: "", contact_name: "", position: "",
    email: "", phone: "", city: "", student_count: "", message: "", website: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setF(p => ({ ...p, package: paket }));
    setDone(false);
    setError("");
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      setF(p => ({ ...p, email: p.email || data.user!.email || "" }));
    });
  }, [open, paket]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  const ubah = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Honeypot: kolom tersembunyi yang hanya diisi bot.
    if (f.website) { setDone(true); return; }
    if (f.school_name.trim().length < 3) { setError("Nama sekolah wajib diisi."); return; }
    if (f.contact_name.trim().length < 2) { setError("Nama kontak wajib diisi."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) { setError("Alamat email belum valid."); return; }
    if (!/^[0-9+\-\s()]{8,20}$/.test(f.phone.trim())) { setError("Nomor WhatsApp belum valid."); return; }
    const jumlah = f.student_count ? Number(f.student_count) : null;
    if (jumlah !== null && (!Number.isInteger(jumlah) || jumlah < 1)) { setError("Jumlah siswa harus berupa angka."); return; }

    setSending(true);
    // Tanpa .select(): pengunjung tidak berhak membaca baris yang dikirimnya.
    const { error: err } = await supabase.from("school_inquiries" as any).insert({
      user_id: userId,
      package: f.package,
      school_name: f.school_name.trim(),
      contact_name: f.contact_name.trim(),
      position: f.position.trim() || null,
      email: f.email.trim(),
      phone: f.phone.trim(),
      city: f.city.trim() || null,
      student_count: jumlah,
      message: f.message.trim() || null,
    });
    setSending(false);
    if (err) { setError("Gagal mengirim. Coba lagi, atau hubungi kami lewat WhatsApp."); return; }
    setDone(true);
  };

  const pesanWa = encodeURIComponent(
    `Halo Talentika, saya ${f.contact_name || "…"} dari ${f.school_name || "…"}. Saya tertarik dengan paket ${LABEL_PAKET_SEKOLAH[f.package]}.`,
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.55)", display: "grid", placeItems: "center", padding: 16, overflowY: "auto" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="judul-form-sekolah"
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "calc(100vh - 32px)", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,.25)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "22px 24px 0" }}>
          <div>
            <h3 id="judul-form-sekolah" style={{ fontFamily: "var(--sp-display, 'Poppins', sans-serif)", fontWeight: 800, fontSize: 20, color: "#0B1D3A", margin: 0 }}>
              {done ? "Terima kasih!" : "Hubungi Kami"}
            </h3>
            {!done && <p style={{ fontSize: 13.5, color: "#64748B", margin: "6px 0 0", lineHeight: 1.55 }}>Isi data berikut untuk informasi harga dan setup. Tim kami akan menghubungi Anda.</p>}
          </div>
          <button onClick={onClose} aria-label="Tutup" style={{ background: "#F1F5F9", border: "none", borderRadius: 10, width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", color: "#64748B", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: "24px 24px 28px", textAlign: "center" }}>
            <CheckCircle2 size={48} style={{ color: "#059669", margin: "4px auto 14px", display: "block" }} />
            <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.65, margin: "0 0 20px" }}>
              Permintaan untuk <b>{LABEL_PAKET_SEKOLAH[f.package]}</b> sudah kami terima. Tim kami akan menghubungi Anda melalui email atau WhatsApp.
            </p>
            <a href={`https://wa.me/${WA_SEKOLAH}?text=${pesanWa}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", padding: "12px 22px", borderRadius: 12, background: "#059669", color: "#fff", fontWeight: 700, fontSize: 14.5, textDecoration: "none" }}>
              💬 Ingin lebih cepat? Chat WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={kirim} style={{ padding: "18px 24px 24px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 14px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label} htmlFor="sk-paket">Paket yang diminati</label>
              <select id="sk-paket" value={f.package} onChange={ubah("package")} style={input}>
                {(Object.keys(LABEL_PAKET_SEKOLAH) as PaketSekolah[]).map(k => <option key={k} value={k}>{LABEL_PAKET_SEKOLAH[k]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label} htmlFor="sk-sekolah">Nama sekolah *</label>
              <input id="sk-sekolah" value={f.school_name} onChange={ubah("school_name")} maxLength={150} required style={input} placeholder="SMA Negeri 1 …" />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-nama">Nama Anda *</label>
              <input id="sk-nama" value={f.contact_name} onChange={ubah("contact_name")} maxLength={100} required style={input} autoComplete="name" />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-jabatan">Jabatan</label>
              <input id="sk-jabatan" value={f.position} onChange={ubah("position")} maxLength={100} style={input} placeholder="Kepala Sekolah, Guru BK…" />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-email">Email *</label>
              <input id="sk-email" type="email" value={f.email} onChange={ubah("email")} maxLength={150} required style={input} autoComplete="email" />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-wa">No. WhatsApp *</label>
              <input id="sk-wa" type="tel" inputMode="tel" value={f.phone} onChange={ubah("phone")} maxLength={20} required style={input} placeholder="08…" autoComplete="tel" />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-kota">Kota</label>
              <input id="sk-kota" value={f.city} onChange={ubah("city")} maxLength={100} style={input} />
            </div>
            <div className="sk-col">
              <label style={label} htmlFor="sk-siswa">Perkiraan jumlah siswa</label>
              <input id="sk-siswa" type="number" min={1} value={f.student_count} onChange={ubah("student_count")} style={input} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={label} htmlFor="sk-pesan">Pesan / kebutuhan khusus</label>
              <textarea id="sk-pesan" value={f.message} onChange={ubah("message")} maxLength={2000} rows={3} style={{ ...input, resize: "vertical" }} />
            </div>
            <input type="text" name="website" value={f.website} onChange={ubah("website")} tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
            {error && <div style={{ gridColumn: "1 / -1", fontSize: 13.5, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>{error}</div>}
            <button type="submit" disabled={sending}
              style={{ gridColumn: "1 / -1", padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: sending ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {sending && <Loader2 size={16} className="animate-spin" />} {sending ? "Mengirim…" : "Kirim Permintaan"}
            </button>
            <style>{`@media (max-width: 520px) { .sk-col { grid-column: 1 / -1; } }`}</style>
          </form>
        )}
      </div>
    </div>
  );
}
