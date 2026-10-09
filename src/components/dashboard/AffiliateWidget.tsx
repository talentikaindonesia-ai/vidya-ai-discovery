/**
 * AffiliateWidget — Guru/BK referral program
 * Shows affiliate code, earnings, and stats
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2, Users, TrendingUp, DollarSign, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props { userId: string; profile: any }

export function AffiliateWidget({ userId, profile }: Props) {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    supabase.from("affiliate_codes").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { setAffiliate(data); setLoading(false); });
  }, [userId]);

  const createCode = async () => {
    setCreating(true);
    const { data, error } = await supabase.from("affiliate_codes").insert({
      user_id: userId,
      referrer_name: profile?.full_name || "Guru",
      referrer_type: "teacher",
      institution: profile?.school_name || "",
    }).select().single();
    if (!error) { setAffiliate(data); toast.success("Kode affiliasi berhasil dibuat! 🎉"); }
    else toast.error("Gagal membuat kode");
    setCreating(false);
  };

  const copyLink = () => {
    const link = `https://talentika.id/auth?ref=${affiliate?.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link disalin!");
  };

  const shareLink = () => {
    const link = `https://talentika.id/auth?ref=${affiliate?.code}`;
    const text = `Hai! Yuk coba Talentika — platform tes minat bakat gratis untuk pelajar Indonesia. Daftar gratis di: ${link}`;
    if (navigator.share) navigator.share({ title: "Talentika", text, url: link });
    else { navigator.clipboard.writeText(text); toast.success("Pesan disalin!"); }
  };

  if (loading) return null;

  return (
    <div style={{ background: "white", borderRadius: 20, border: "1.5px solid var(--tk-blue-200)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, var(--tk-blue-600), var(--tk-purple))", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏫</div>
          <div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 16, color: "white" }}>Program Afiliasi Talentika</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)" }}>Untuk Guru BK & Tenaga Pengajar</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.85)", margin: "10px 0 0", lineHeight: 1.6 }}>
          Rekomendasikan Talentika ke siswamu. Dapatkan komisi <strong>Rp 5.000</strong> per siswa yang berlangganan Premium melalui linkmu.
        </p>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {!affiliate ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink)", marginBottom: 8 }}>Buat Kode Afiliasi-mu</div>
            <p style={{ fontSize: 13, color: "var(--tk-gray-500)", marginBottom: 20, lineHeight: 1.6 }}>
              Gratis. Bagikan link ke siswa dan pantau perkembangannya.
            </p>
            <button onClick={createCode} disabled={creating} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 12, border: "none", background: "var(--tk-blue-600)", color: "white", fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 14, cursor: creating ? "not-allowed" : "pointer" }}>
              {creating ? <Loader2 size={15} style={{ animation: "spin .8s linear infinite" }} /> : <Link2 size={15} />}
              {creating ? "Membuat..." : "Buat Kode Afiliasi"}
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 18 }}>
              {[
                { icon: Users, label: "Siswa Daftar", value: affiliate.total_signups, color: "var(--tk-blue-600)" },
                { icon: TrendingUp, label: "Berlangganan", value: affiliate.total_premium, color: "var(--tk-green-dark)" },
                { icon: DollarSign, label: "Komisi (IDR)", value: `${(affiliate.commission_earned / 100).toLocaleString("id-ID")}`, color: "var(--tk-orange)" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--tk-gray-50)", borderRadius: 12, padding: "12px 14px", textAlign: "center", border: "1px solid var(--tk-gray-200)" }}>
                  <s.icon size={16} style={{ color: s.color, marginBottom: 4 }} />
                  <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Link */}
            <div style={{ background: "var(--tk-blue-50)", borderRadius: 12, padding: "12px 16px", border: "1px solid var(--tk-blue-200)", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tk-blue-600)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>Link Afiliasimu</div>
              <div style={{ fontFamily: "var(--tk-font-mono)", fontSize: 12.5, color: "var(--tk-ink)", wordBreak: "break-all", marginBottom: 10 }}>
                talentika.id/auth?ref=<strong>{affiliate.code}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyLink} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, border: "1.5px solid var(--tk-blue-200)", background: "white", color: "var(--tk-blue-600)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <Copy size={13} /> Salin Link
                </button>
                <button onClick={shareLink} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, border: "none", background: "var(--tk-blue-600)", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <Share2 size={13} /> Bagikan ke WA
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--tk-gray-400)", textAlign: "center" }}>
              Komisi dihitung otomatis setiap bulan · Min. pencairan Rp 50.000
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
