/**
 * PaymentGateway — simplified Mayar checkout
 *
 * Mayar already shows all payment method options on their hosted page
 * (bank transfer, e-wallet, QRIS, credit card), so we don't duplicate
 * that UI here. The only thing we need from the user is a phone number,
 * which Mayar requires for the payment link API call.
 *
 * Flow:
 *   1. Show order summary + phone field
 *   2. Click "Lanjut ke Pembayaran" → create Mayar link via edge function
 *   3. Redirect same-tab to Mayar's hosted checkout
 *   4. Mayar redirects back to /subscription?payment=success&ref=<txId>
 */
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Phone, ShieldCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

interface PaymentGatewayProps {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  discount?: number;
  voucherId?: string;
  onPaymentSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
}

const MAYAR_METHODS = [
  { icon: "🏦", label: "Transfer Bank", sub: "BCA, Mandiri, BNI, BRI" },
  { icon: "📱", label: "E-Wallet",      sub: "GoPay, OVO, DANA, LinkAja" },
  { icon: "⊡",  label: "QRIS",          sub: "Scan QR dari semua dompet" },
  { icon: "💳", label: "Kartu Kredit",  sub: "Visa, Mastercard, JCB" },
];

export const PaymentGateway = ({
  planId,
  planName,
  amount,
  billingCycle,
  discount = 0,
  voucherId,
  onPaymentSuccess,
  onCancel,
}: PaymentGatewayProps) => {
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { toast }               = useToast();

  const finalAmount = amount - discount;

  // Pre-fill phone from user profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
    });
  }, []);

  const handlePay = async () => {
    if (!phone.trim()) {
      toast({ title: "Nomor HP diperlukan", description: "Masukkan nomor WhatsApp / HP aktif.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Silakan login terlebih dahulu");

      const { data, error } = await supabase.functions.invoke("create-mayar-payment", {
        body: {
          planId,
          userId: user.id,
          amount: finalAmount,
          paymentMethod: "mayar",   // Mayar handles method selection on their page
          billingCycle,
          voucherId,
          phone: phone.trim(),
        },
      });

      // Extract edge-function error body when present
      if (error) {
        let msg = "Terjadi kesalahan saat membuat link pembayaran.";
        try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch {}
        throw new Error(msg);
      }

      if (!data?.success || !data?.invoice_url) {
        throw new Error(data?.error || "Gagal membuat link pembayaran Mayar.");
      }

      // Save txId in sessionStorage so the return page can verify status
      if (data.transaction_id) {
        sessionStorage.setItem("mayar_tx_id", data.transaction_id);
      }

      // Redirect to Mayar's hosted checkout — Mayar will send the user back
      // to /subscription?payment=success&ref=<txId> after completion.
      window.location.href = data.invoice_url;
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Order summary card */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        {/* Header stripe */}
        <div style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)", padding: "18px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Ringkasan Pesanan</div>
          <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 20, color: "white" }}>{planName}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 2 }}>
            Berlangganan {billingCycle === "monthly" ? "Bulanan" : "Tahunan"}
          </div>
        </div>

        {/* Price breakdown */}
        <div style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748B", marginBottom: 8 }}>
            <span>Harga {billingCycle === "monthly" ? "bulanan" : "tahunan"}</span>
            <span>{formatCurrency(amount)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#059669", marginBottom: 8, fontWeight: 600 }}>
              <span>🎟 Diskon Voucher</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Total Pembayaran</span>
            <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 24, color: "#2563EB" }}>
              {formatCurrency(finalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Phone input */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", padding: "18px 24px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
          <Phone size={15} style={{ color: "#2563EB" }} />
          Nomor WhatsApp / HP
          <span style={{ color: "#EF4444", fontSize: 12 }}>*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="contoh: 08123456789"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 14px", borderRadius: 10,
            border: "1.5px solid #E2E8F0", fontSize: 15,
            color: "#0F172A", background: "#F8FAFC",
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => (e.target.style.borderColor = "#2563EB")}
          onBlur={e => (e.target.style.borderColor = "#E2E8F0")}
        />
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>
          Digunakan Mayar untuk mengirim konfirmasi pembayaran
        </p>
      </div>

      {/* Available methods — informational only */}
      <div style={{ background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
          Metode pembayaran tersedia di Mayar
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {MAYAR_METHODS.map(m => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 10, padding: "9px 12px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 18 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 10, textAlign: "center" }}>
          Anda akan memilih metode di halaman pembayaran Mayar
        </p>
      </div>

      {/* Security badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#64748B" }}>
        <ShieldCheck size={14} style={{ color: "#059669" }} />
        Pembayaran aman & terenkripsi melalui Mayar
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: "0 0 auto", padding: "12px 18px", borderRadius: 12,
            border: "1.5px solid #E2E8F0", background: "white",
            color: "#475569", fontWeight: 600, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.6 : 1,
          }}
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        <button
          onClick={handlePay}
          disabled={loading || !phone.trim()}
          style={{
            flex: 1, padding: "12px 24px", borderRadius: 12, border: "none",
            background: loading || !phone.trim() ? "#93C5FD" : "linear-gradient(135deg,#1D4ED8,#2563EB)",
            color: "white", fontWeight: 700, fontSize: 15,
            cursor: loading || !phone.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: loading || !phone.trim() ? "none" : "0 4px 16px rgba(37,99,235,.35)",
            transition: "all .15s",
          }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Membuat link pembayaran…</>
          ) : (
            <>Lanjut ke Pembayaran Mayar <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
};
