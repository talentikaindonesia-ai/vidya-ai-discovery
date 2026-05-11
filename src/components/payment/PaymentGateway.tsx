import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, CreditCard, Building, Smartphone, QrCode,
  CheckCircle2, ExternalLink, RefreshCw, ArrowLeft, Phone,
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

const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    name: "Transfer Bank",
    icon: <Building className="w-5 h-5" />,
    description: "BCA, Mandiri, BNI, BRI",
    fee: 0,
  },
  {
    id: "e_wallet",
    name: "E-Wallet",
    icon: <Smartphone className="w-5 h-5" />,
    description: "GoPay, OVO, Dana, LinkAja",
    fee: 0,
  },
  {
    id: "credit_card",
    name: "Kartu Kredit",
    icon: <CreditCard className="w-5 h-5" />,
    description: "Visa, Mastercard, JCB",
    fee: 3000,
  },
  {
    id: "qr_code",
    name: "QRIS",
    icon: <QrCode className="w-5 h-5" />,
    description: "Scan QR untuk bayar",
    fee: 0,
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
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();

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
        .then(({ data }) => {
          if (data?.phone) setPhone(data.phone);
        });
    });
  }, []);

  // Auto-poll every 30 s while awaiting Xendit confirmation
  useEffect(() => {
    if (!paymentInitiated || !transactionId) return;
    const interval = setInterval(() => checkPaymentStatus(false), 30_000);
    return () => clearInterval(interval);
  }, [paymentInitiated, transactionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkPaymentStatus = async (showToast = true) => {
    if (!transactionId) return;
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("status")
        .eq("id", transactionId)
        .maybeSingle();

      if (error) throw error;

      if (data?.status === "completed") {
        toast({
          title: "Pembayaran Berhasil! 🎉",
          description: "Selamat! Langganan Anda sudah aktif.",
        });
        onPaymentSuccess?.(transactionId);
      } else if (data?.status === "failed" || data?.status === "expired") {
        toast({
          title: "Pembayaran Gagal",
          description: "Silakan coba lagi dengan metode lain.",
          variant: "destructive",
        });
        setPaymentInitiated(false);
        setTransactionId(null);
      } else if (showToast) {
        toast({
          title: "Masih Menunggu",
          description: "Pembayaran belum dikonfirmasi. Selesaikan di halaman Xendit.",
        });
      }
    } catch {
      if (showToast) {
        toast({
          title: "Error",
          description: "Gagal memeriksa status pembayaran.",
          variant: "destructive",
        });
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      const methodFee = PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.fee ?? 0;

      const { data, error } = await supabase.functions.invoke("create-mayar-payment", {
        body: {
          planId,
          userId: user.id,
          amount: finalAmount + methodFee,
          paymentMethod: selectedMethod,
          billingCycle,
          voucherId,
          phone: phone.trim(),
        },
      });

      if (error) {
        // Extract the actual error message from the edge function response body
        let message = "Terjadi kesalahan saat memproses pembayaran.";
        try {
          const body = await (error as any).context?.json?.();
          if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }

      if (data.success) {
        setInvoiceUrl(data.invoice_url ?? null);
        setTransactionId(data.transaction_id ?? null);
        setPaymentInitiated(true);
      } else {
        throw new Error(data.error || "Failed to create payment");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memproses pembayaran.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── POST-PAYMENT AWAITING STATE ──────────────────────────────────────────
  if (paymentInitiated) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Menunggu Konfirmasi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary CTA — manual link avoids popup blocker */}
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Buka Halaman Pembayaran Mayar
              </a>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Setelah membayar, ikuti langkah berikut:
            </p>

            <ol className="space-y-3">
              {[
                {
                  step: "1",
                  text: "Klik tombol di atas untuk membuka halaman pembayaran Mayar",
                  icon: <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />,
                },
                {
                  step: "2",
                  text: "Selesaikan pembayaran di halaman Mayar",
                  icon: <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />,
                },
                {
                  step: "3",
                  text: 'Kembali ke sini lalu klik "Cek Status Pembayaran"',
                  icon: <ArrowLeft className="w-4 h-4 text-primary flex-shrink-0" />,
                },
              ].map(({ step, text, icon }) => (
                <li
                  key={step}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step}
                  </span>
                  {icon}
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ol>

            <p className="text-xs text-muted-foreground text-center">
              Status diperbarui otomatis setiap 30 detik
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setPaymentInitiated(false);
              setTransactionId(null);
              setInvoiceUrl(null);
            }}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Pilihan Metode
          </Button>
          <Button
            onClick={() => checkPaymentStatus(true)}
            disabled={checkingStatus}
            className="flex-1"
          >
            {checkingStatus ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Cek Status Pembayaran
          </Button>
        </div>
      </div>
    );
  }

  // ─── PAYMENT METHOD SELECTION STATE ──────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>
              {planName} ({billingCycle === "monthly" ? "Bulanan" : "Tahunan"})
            </span>
            <span>{formatCurrency(amount)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Voucher</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Pembayaran</span>
              <span>{formatCurrency(finalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phone number — required by Mayar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Nomor WhatsApp / HP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="phone">
              Nomor HP aktif untuk notifikasi pembayaran <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Notifikasi status pembayaran akan dikirim ke nomor ini
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Metode Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {method.icon}
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
                {method.fee > 0 && (
                  <Badge variant="secondary">+{formatCurrency(method.fee)}</Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!selectedMethod || !phone.trim() || loading}
          className="flex-1"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Bayar Sekarang
        </Button>
      </div>
    </div>
  );
};
