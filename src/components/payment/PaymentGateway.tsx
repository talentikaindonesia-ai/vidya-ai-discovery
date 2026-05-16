/**
 * PaymentGateway — simplified Mayar checkout
 *
 * User picks a payment category here (for UX clarity), then gets
 * redirected to Mayar's hosted page which handles the actual payment.
 * Mayar supports all methods — the selection here just sets the context.
 */
import { useState, useEffect } from "react";
import {
  Loader2, ArrowLeft, Phone, ShieldCheck, ChevronRight,
  Building2, Smartphone, CreditCard, QrCode, Check,
} from "lucide-react";
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

const METHODS = [
  {
    id: "bank_transfer",
    icon: Building2,
    label: "Transfer Bank",
    sub: "BCA · Mandiri · BNI · BRI",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    id: "e_wallet",
    icon: Smartphone,
    label: "E-Wallet",
    sub: "GoPay · OVO · DANA · LinkAja",
    color: "#059669",
    bg: "#ECFDF5",
  },
  {
    id: "qris",
    icon: QrCode,
    label: "QRIS",
    sub: "Scan dari dompet digital manapun",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    id: "credit_card",
    icon: CreditCard,
    label: "Kartu Kredit / Debit",
    sub: "Visa · Mastercard · JCB",
    color: "#D97706",
    bg: "#FFFBEB",
  },
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
  const [method, setMethod]   = useState("bank_transfer");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const { toast }             = useToast();

  const finalAmount = amount - discount;

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
          paymentMethod: method,
          billingCycle,
          voucherId,
          phone: phone.trim(),
        },
      });

      if (error) {
        let msg = "Terjadi kesalahan saat membuat link pembayaran.";
        try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch {}
        throw new Error(msg);
      }

      if (!data?.success || !data?.invoice_url) {
        throw new Error(data?.error || "Gagal membuat link pembayaran Mayar.");
      }

      if (data.transaction_id) sessionStorage.setItem("mayar_tx_id", data.transaction_id);

      // Redirect to Mayar's hosted checkout
      window.location.href = data.invoice_url;
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const selectedMethod = METHODS.find(m => m.id === method)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Order summary ─────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1D4ED8,#2563EB)", borderRadius: 16, padding: "20px 24px", color: "white" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Ringkasan Pesanan</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{planName}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 3 }}>
              Berlangganan {billingCycle === "monthly" ? "Bulanan" : "Tahunan"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {discount > 0 && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", textDecoration: "line-through" }}>{formatCurrency(amount)}</div>
            )}
            <div style={{ fontFamily: "var(--tk-font-display)", fontWeight: 800, fontSize: 26 }}>{formatCurrency(finalAmount)}</div>
            {discount > 0 && (
              <div style={{ fontSize: 11, background: "rgba(255,255,255,.2)", borderRadius: 6, padding: "2px 8px", marginTop: 2, display: "inline-block" }}>
                Hemat {formatCurrency(discount)} 🎟
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment method ────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
          Pilih Metode Pembayaran
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {METHODS.map(m => {
            const active = method === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                  border: active ? `2px solid ${m.color}` : "1.5px solid #E2E8F0",
                  background: active ? m.bg : "white",
                  transition: "all .15s", textAlign: "left", position: "relative",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: active ? m.color : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                  <Icon size={17} color={active ? "white" : "#94A3B8"} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: active ? m.color : "#0F172A", lineHeight: 1.2 }}>{m.label}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.sub}</div>
                </div>
                {active && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: "#94A3B8", background: "#F8FAFC", borderRadius: 8, padding: "8px 12px" }}>
          💡 Anda akan menyelesaikan pembayaran via <strong style={{ color: "#374151" }}>Mayar</strong> — pilihan metode di atas akan disiapkan untuk Anda
        </div>
      </div>

      {/* ── Phone ─────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginBottom: 9 }}>
          <Phone size={14} style={{ color: "#2563EB" }} />
          Nomor WhatsApp / HP <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="08123456789"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 14px", borderRadius: 10,
            border: "1.5px solid #E2E8F0", fontSize: 15,
            color: "#0F172A", background: "#F8FAFC",
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "#2563EB")}
          onBlur={e => (e.currentTarget.style.borderColor = "#E2E8F0")}
        />
        <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6 }}>
          Untuk notifikasi konfirmasi pembayaran dari Mayar
        </p>
      </div>

      {/* ── Security note ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11.5, color: "#94A3B8" }}>
        <ShieldCheck size={13} style={{ color: "#059669" }} />
        Pembayaran aman & terenkripsi melalui Mayar
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flexShrink: 0, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid #E2E8F0", background: "white",
            color: "#475569", fontWeight: 600, fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 6,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        <button
          onClick={handlePay}
          disabled={loading || !phone.trim()}
          style={{
            flex: 1, padding: "12px 20px", borderRadius: 12, border: "none",
            background: loading || !phone.trim()
              ? "#93C5FD"
              : `linear-gradient(135deg,${selectedMethod.color},${selectedMethod.color}dd)`,
            color: "white", fontWeight: 700, fontSize: 14.5,
            cursor: loading || !phone.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: loading || !phone.trim() ? "none" : `0 4px 16px ${selectedMethod.color}44`,
            transition: "all .2s",
          }}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Membuat link…</>
          ) : (
            <>
              <selectedMethod.icon size={15} />
              Bayar via {selectedMethod.label}
              <ChevronRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
