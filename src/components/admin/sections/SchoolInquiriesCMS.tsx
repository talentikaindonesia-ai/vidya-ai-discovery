import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, MessageCircle, School, Users, MapPin } from "lucide-react";
import { selectStyle, textareaStyle } from "../adminShared";
import { LABEL_PAKET_SEKOLAH, type PaketSekolah } from "@/components/school/SchoolInquiryModal";

/**
 * Permintaan dari form "Hubungi Kami" di /for-schools. Belum ada email
 * notifikasi (RESEND_API_KEY belum dipasang) — cek menu ini secara berkala.
 */

interface Inquiry {
  id: string; created_at: string; package: PaketSekolah; school_name: string; contact_name: string;
  position: string | null; email: string; phone: string; city: string | null;
  student_count: number | null; message: string | null; status: string; admin_note: string | null;
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  baru:      { label: "Baru",      bg: "#DBEAFE", color: "#1D4ED8" },
  dihubungi: { label: "Dihubungi", bg: "#FEF3C7", color: "#92400E" },
  selesai:   { label: "Selesai",   bg: "#D1FAE5", color: "#065F46" },
  batal:     { label: "Batal",     bg: "#F1F5F9", color: "#64748B" },
};

const tabel = () => supabase.from("school_inquiries" as any) as any;

function waLink(phone: string, nama: string, sekolah: string) {
  let n = phone.replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return `https://wa.me/${n}?text=${encodeURIComponent(`Halo ${nama}, kami dari Talentika menindaklanjuti permintaan informasi untuk ${sekolah}.`)}`;
}

export default function SchoolInquiriesCMS() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("aktif");
  const [catatan, setCatatan] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await tabel().select("*").order("created_at", { ascending: false });
    if (error) toast.error("Gagal memuat: " + error.message);
    setRows((data ?? []) as Inquiry[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function ubahStatus(r: Inquiry, status: string) {
    const { error } = await tabel().update({ status }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
  }
  async function simpanCatatan(r: Inquiry) {
    const admin_note = (catatan[r.id] ?? r.admin_note ?? "").trim() || null;
    const { error } = await tabel().update({ admin_note }).eq("id", r.id);
    if (error) { toast.error(error.message); return; }
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, admin_note } : x));
    toast.success("Catatan disimpan");
  }

  const tampil = rows.filter(r => filter === "semua" ? true : filter === "aktif" ? (r.status === "baru" || r.status === "dihubungi") : r.status === filter);
  const baru = rows.filter(r => r.status === "baru").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "inline-flex", gap: 4, background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: 3 }}>
          {([["aktif", `Perlu tindak lanjut`], ["baru", `Baru (${baru})`], ["selesai", "Selesai"], ["semua", "Semua"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5,
                       background: filter === id ? "#2563EB" : "transparent", color: filter === id ? "white" : "#64748B" }}>
              {l}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: "#94A3B8" }}>Belum ada notifikasi email — cek menu ini secara berkala.</span>
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: "center" }}><Loader2 size={24} className="animate-spin" style={{ color: "#2563EB" }} /></div>
      ) : tampil.length === 0 ? (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "46px 24px", textAlign: "center", color: "#94A3B8" }}>
          <School size={30} style={{ margin: "0 auto 10px", display: "block", opacity: .5 }} />
          <div style={{ fontWeight: 700, color: "#475569" }}>Belum ada permintaan</div>
          <div style={{ fontSize: 12.5, marginTop: 6 }}>Permintaan dari form "Hubungi Kami" di halaman For School akan muncul di sini.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tampil.map(r => {
            const st = STATUS[r.status] ?? STATUS.baru;
            return (
              <div key={r.id} style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA" }}>{LABEL_PAKET_SEKOLAH[r.package] ?? r.package}</span>
                      <span style={{ fontSize: 11.5, color: "#94A3B8" }}>{new Date(r.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15.5, color: "#0F172A" }}>{r.school_name}</div>
                    <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{r.contact_name}{r.position ? ` · ${r.position}` : ""}</div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "#64748B", marginTop: 6 }}>
                      {r.city && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {r.city}</span>}
                      {r.student_count && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> ±{r.student_count.toLocaleString("id-ID")} siswa</span>}
                      <span>{r.email}</span>
                      <span>{r.phone}</span>
                    </div>
                    {r.message && <p style={{ fontSize: 13.5, color: "#334155", background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", margin: "10px 0 0", whiteSpace: "pre-line" }}>{r.message}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 190 }}>
                    <a href={waLink(r.phone, r.contact_name, r.school_name)} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, background: "#059669", color: "#fff", fontWeight: 700, fontSize: 12.5, textDecoration: "none" }}>
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                    <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Talentika for School — ${r.school_name}`)}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, border: "1px solid #E2E8F0", color: "#475569", fontWeight: 700, fontSize: 12.5, textDecoration: "none" }}>
                      <Mail size={14} /> Email
                    </a>
                    <select value={r.status} onChange={e => ubahStatus(r, e.target.value)} style={{ ...selectStyle, fontSize: 12.5, padding: "7px 10px" }}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "flex-start" }}>
                  <textarea value={catatan[r.id] ?? r.admin_note ?? ""} onChange={e => setCatatan(p => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Catatan internal (tidak terlihat oleh sekolah)" rows={1} style={{ ...textareaStyle, minHeight: 38, flex: 1, fontSize: 13 }} />
                  <button onClick={() => simpanCatatan(r)}
                    style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                    Simpan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
