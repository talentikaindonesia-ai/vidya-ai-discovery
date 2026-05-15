import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Ticket, X, Loader2, Tag, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface VoucherInputProps {
  onVoucherApplied: (voucher: any, discountAmount: number) => void;
  selectedPlan: any;
  billingCycle: "monthly" | "yearly";
}

export const VoucherInput = ({
  onVoucherApplied,
  selectedPlan,
  billingCycle,
}: VoucherInputProps) => {
  const [voucherCode,    setVoucherCode]    = useState("");
  const [loading,        setLoading]        = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discount,       setDiscount]       = useState(0);
  const { toast } = useToast();

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({ title: "Error", description: "Masukkan kode voucher", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: voucher, error } = await supabase
        .from("voucher_codes")
        .select("*")
        .eq("code", voucherCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !voucher) throw new Error("Kode voucher tidak valid atau tidak ditemukan");

      const now        = new Date();
      const validFrom  = new Date(voucher.valid_from);
      const validUntil = new Date(voucher.valid_until);
      if (now < validFrom || now > validUntil) throw new Error("Kode voucher sudah kadaluarsa");

      if (voucher.max_uses && voucher.current_uses >= voucher.max_uses)
        throw new Error("Kode voucher sudah mencapai batas penggunaan");

      const { data: existingUsage } = await supabase
        .from("voucher_usage")
        .select("id")
        .eq("voucher_id", voucher.id)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (existingUsage) throw new Error("Anda sudah menggunakan kode voucher ini");

      let discountAmount = 0;
      if (selectedPlan) {
        const planPrice =
          billingCycle === "monthly" ? selectedPlan.price_monthly : selectedPlan.price_yearly;
        if (voucher.min_purchase_amount && planPrice < voucher.min_purchase_amount)
          throw new Error(`Minimum pembelian ${formatCurrency(voucher.min_purchase_amount)} untuk menggunakan voucher ini`);
        if (voucher.discount_type === "percentage")
          discountAmount = Math.floor((planPrice * voucher.discount_value) / 100);
        else if (voucher.discount_type === "amount")
          discountAmount = Math.min(voucher.discount_value, planPrice);
      }

      setAppliedVoucher(voucher);
      setDiscount(discountAmount);
      onVoucherApplied(voucher, discountAmount);
      toast({
        title: "Voucher Berhasil Diterapkan!",
        description: `Diskon ${voucher.discount_type === "percentage" ? voucher.discount_value + "%" : formatCurrency(voucher.discount_value)} telah diterapkan`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode("");
    onVoucherApplied(null, 0);
    toast({ title: "Voucher Dihapus", description: "Kode voucher telah dihapus" });
  };

  // ── Applied state ───────────────────────────────────────────────────────────
  if (appliedVoucher) {
    return (
      <div
        style={{
          borderRadius: 14,
          border: "1.5px solid #A7F3D0",
          background: "#ECFDF5",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "#D1FAE5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--tk-font-display)",
              fontWeight: 700,
              fontSize: 13.5,
              color: "#065F46",
            }}
          >
            Voucher Diterapkan
          </div>
          <div style={{ fontSize: 12.5, color: "#059669", marginTop: 2, fontFamily: "var(--tk-font-sans)" }}>
            {appliedVoucher.name} · Hemat {formatCurrency(discount)}
          </div>
        </div>
        <button
          onClick={removeVoucher}
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: "none", background: "#D1FAE5",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#059669", flexShrink: 0,
          }}
          aria-label="Hapus voucher"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#A7F3D0"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#D1FAE5"; }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── Input state ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1.5px solid var(--tk-gray-200)",
        background: "var(--tk-gray-50)",
        padding: "16px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Tag size={15} style={{ color: "var(--tk-blue-600)" }} />
        <span
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 13.5,
            color: "var(--tk-ink)",
          }}
        >
          Punya Kode Voucher?
        </span>
      </div>

      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1.5px solid var(--tk-gray-200)",
            borderRadius: 10,
            padding: "10px 13px",
            background: "#fff",
          }}
        >
          <Ticket size={14} style={{ color: "var(--tk-gray-400)", flexShrink: 0 }} />
          <input
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode voucher"
            onKeyDown={(e) => e.key === "Enter" && validateVoucher()}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13.5,
              fontFamily: "var(--tk-font-mono)",
              letterSpacing: ".06em",
              color: "var(--tk-ink)",
              background: "transparent",
              textTransform: "uppercase",
            }}
          />
        </div>

        <button
          onClick={validateVoucher}
          disabled={loading || !voucherCode.trim()}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: voucherCode.trim() && !loading ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
            color: voucherCode.trim() && !loading ? "#fff" : "var(--tk-gray-400)",
            cursor: voucherCode.trim() && !loading ? "pointer" : "not-allowed",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            transition: "background .15s",
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Terapkan"}
        </button>
      </div>

      <p style={{ marginTop: 8, fontSize: 12, color: "var(--tk-gray-500)", fontFamily: "var(--tk-font-sans)" }}>
        Masukkan kode voucher untuk mendapatkan diskon spesial
      </p>
    </div>
  );
};
