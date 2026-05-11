import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { VoucherInput } from "./VoucherInput";
import { PaymentGateway } from "./PaymentGateway";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  CreditCard,
  Receipt,
  Crown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SubscriptionManagerProps {
  userId: string;
  onSubscriptionChange?: () => void;
  preSelectedPlanId?: string | null;
}

/** Days remaining until expiry (negative = already expired) */
function daysRemaining(expiresAt: string | null) {
  if (!expiresAt) return Infinity;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

export const SubscriptionManager = ({
  userId,
  onSubscriptionChange,
  preSelectedPlanId,
}: SubscriptionManagerProps) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
    loadTransactions();
  }, [userId]);

  // Pre-select plan once plans are loaded
  useEffect(() => {
    if (preSelectedPlanId && plans.length > 0) {
      const planToSelect = plans.find((p) => p.id === preSelectedPlanId);
      if (planToSelect) setSelectedPlan(planToSelect);
    }
  }, [preSelectedPlanId, plans]);

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly");

    if (error) {
      toast({ title: "Error", description: "Gagal memuat paket berlangganan", variant: "destructive" });
      return;
    }
    setPlans(data || []);
  };

  const loadCurrentSubscription = async () => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_packages (*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    setCurrentSubscription(data ?? null);
  };

  const loadTransactions = async () => {
    // Join through user_subscriptions to get the plan name
    const { data } = await supabase
      .from("payment_transactions")
      .select("*, user_subscriptions (subscription_packages (name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    setTransactions(data || []);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectPlan = async (planId: string, cycle: "monthly" | "yearly") => {
    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) throw new Error("Plan tidak ditemukan");

      if (plan.type === "free") {
        await activateFreePlan(planId);
        return;
      }

      const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
      setSelectedPlan({ ...plan, selectedCycle: cycle, finalPrice: price - discount });
      setShowPaymentGateway(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activateFreePlan = async (planId: string) => {
    const { error } = await supabase.from("user_subscriptions").insert({
      user_id: userId,
      package_id: planId,
      status: "active",
      billing_cycle: "monthly",
      amount_paid: 0,
      starts_at: new Date().toISOString(),
      expires_at: null,
    });
    if (error) throw error;
    toast({ title: "Berhasil!", description: "Paket gratis telah diaktifkan" });
    loadCurrentSubscription();
    onSubscriptionChange?.();
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ status: "cancelled", auto_renew: false })
        .eq("id", currentSubscription.id);

      if (error) throw error;

      toast({
        title: "Berlangganan dibatalkan",
        description: "Akses premium Anda akan tetap aktif hingga akhir periode berlangganan.",
      });
      loadCurrentSubscription();
      onSubscriptionChange?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = (transaction: any) => {
    const planName =
      transaction.user_subscriptions?.subscription_packages?.name || "Subscription";
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${transaction.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; }
    .header { border-bottom: 2px solid #7E69AB; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #7E69AB; }
    .badge { background: #f0ebff; color: #7E69AB; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 0; }
    .label { color: #888; width: 160px; }
    .total { border-top: 2px solid #eee; padding-top: 12px; font-weight: bold; font-size: 18px; }
    .status-ok { color: #16a34a; font-weight: bold; }
    .footer { margin-top: 40px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Talentika</div>
    <div style="font-size:12px;color:#888;margin-top:4px;">Discover your full potential</div>
  </div>
  <h2 style="margin:0 0 4px">Invoice</h2>
  <div class="badge">${transaction.status === 'completed' ? '✓ Lunas' : transaction.status.toUpperCase()}</div>
  <table style="margin-top:20px">
    <tr><td class="label">No. Invoice</td><td>${transaction.invoice_number || "-"}</td></tr>
    <tr><td class="label">Tanggal</td><td>${new Date(transaction.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td></tr>
    <tr><td class="label">Paket</td><td>${planName}</td></tr>
    <tr><td class="label">Metode Pembayaran</td><td>${transaction.payment_method || "-"}</td></tr>
    <tr><td class="label">Status</td><td class="status-ok">${transaction.status === "completed" ? "Berhasil" : transaction.status}</td></tr>
  </table>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(transaction.amount)}</td></tr>
    <tr class="total"><td>Total Pembayaran</td><td style="text-align:right">${formatCurrency(transaction.amount)}</td></tr>
  </table>
  <div class="footer">
    Diterbitkan oleh Talentika • support@talentika.id<br/>
    Dokumen ini dibuat otomatis dan sah tanpa tanda tangan.
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${transaction.invoice_number || transaction.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Invoice diunduh!", description: "Buka file HTML untuk mencetak." });
  };

  const handleVoucherApplied = (voucher: any, discountAmount: number) => {
    setSelectedVoucher(voucher);
    setDiscount(discountAmount);
    toast({
      title: "Voucher Diterapkan!",
      description: `Diskon ${formatCurrency(discountAmount)} telah diterapkan`,
    });
  };

  // ── Sub-renders ───────────────────────────────────────────────────────────

  const renderCurrentSubscription = () => {
    if (!currentSubscription) return null;

    const days = daysRemaining(currentSubscription.expires_at);
    const isExpiringSoon = days <= 7 && days !== Infinity;
    const isExpired = days < 0;
    const isCancelled = currentSubscription.status === "cancelled";
    const pkg = currentSubscription.subscription_packages;

    // Progress bar for time remaining (out of the full billing period)
    const totalDays = currentSubscription.billing_cycle === "monthly" ? 30 : 365;
    const progressPct = days === Infinity ? 100 : Math.max(0, Math.min(100, (days / totalDays) * 100));

    return (
      <Card className={`mb-6 border-2 ${isExpiringSoon ? "border-amber-400" : "border-primary/20"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Status Berlangganan</CardTitle>
            </div>
            <Badge
              className={
                isCancelled ? "bg-red-100 text-red-700" :
                isExpired ? "bg-gray-100 text-gray-600" :
                "bg-green-100 text-green-700"
              }
            >
              {isCancelled ? "Dibatalkan" : isExpired ? "Kedaluwarsa" : "Aktif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan name + billing */}
          <div>
            <p className="text-2xl font-bold text-foreground">{pkg?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              Tagihan {currentSubscription.billing_cycle === "monthly" ? "Bulanan" : "Tahunan"}
              {currentSubscription.auto_renew === false && (
                <span className="ml-2 text-amber-600">(Auto-renew dimatikan)</span>
              )}
            </p>
          </div>

          {/* Days remaining + progress */}
          {currentSubscription.expires_at && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Berakhir {formatDate(currentSubscription.expires_at)}
                </span>
                <span className={`font-semibold ${isExpiringSoon ? "text-amber-600" : "text-foreground"}`}>
                  {days === Infinity
                    ? "Tidak terbatas"
                    : isExpired
                    ? "Sudah berakhir"
                    : `${days} hari lagi`}
                </span>
              </div>
              <Progress value={progressPct} className={`h-2 ${isExpiringSoon ? "[&>div]:bg-amber-500" : ""}`} />
            </div>
          )}

          {/* Expiry warning banner */}
          {isExpiringSoon && !isExpired && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Berlangganan Anda akan berakhir dalam <strong>{days} hari</strong>.
                Perpanjang sekarang agar tidak kehilangan akses premium.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Renew / Upgrade */}
            {(isExpiringSoon || isExpired || isCancelled) && (
              <Button
                size="sm"
                onClick={() => {
                  const el = document.getElementById("plans-tab");
                  el?.click();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isCancelled || isExpired ? "Berlangganan Ulang" : "Perpanjang Sekarang"}
              </Button>
            )}

            {/* Download latest invoice */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const latest = transactions.find(
                  (t) => t.status === "completed"
                );
                if (latest) handleDownloadInvoice(latest);
                else toast({ title: "Tidak ada invoice", description: "Belum ada transaksi berhasil." });
              }}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Unduh Invoice
            </Button>

            {/* Cancel — only if active and not already cancelled */}
            {!isCancelled && !isExpired && currentSubscription.expires_at && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    Batalkan Berlangganan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan Berlangganan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Akses premium Anda akan tetap aktif hingga{" "}
                      <strong>{formatDate(currentSubscription.expires_at)}</strong>.
                      Setelah itu akun akan beralih ke paket gratis secara otomatis.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Kembali</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={cancelling}
                    >
                      {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Ya, Batalkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handlePaymentSuccess = () => {
    setShowPaymentGateway(false);
    setSelectedPlan(null);
    loadCurrentSubscription();
    loadTransactions();
    onSubscriptionChange?.();
  };

  const handlePaymentCancel = () => {
    setShowPaymentGateway(false);
    // Keep selectedPlan so user can try again or switch billing cycle
  };

  // ── Payment gateway full-screen ───────────────────────────────────────────
  if (showPaymentGateway && selectedPlan) {
    return (
      <PaymentGateway
        planId={selectedPlan.id}
        planName={selectedPlan.name}
        amount={selectedPlan.selectedCycle === "monthly" ? selectedPlan.price_monthly : selectedPlan.price_yearly}
        billingCycle={selectedPlan.selectedCycle}
        discount={discount}
        voucherId={selectedVoucher?.id}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {renderCurrentSubscription()}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans" id="plans-tab">Paket Berlangganan</TabsTrigger>
          <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
        </TabsList>

        {/* ── Plans tab ── */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Paket Berlangganan</CardTitle>
              <CardDescription>Pilih paket yang sesuai dengan kebutuhan Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing cycle toggle — clean Button group, not nested Tabs */}
              <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
                {(["monthly", "yearly"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === cycle
                        ? "bg-background shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cycle === "monthly" ? "Bulanan" : "Tahunan"}
                    {cycle === "yearly" && (
                      <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                        Hemat ~17%
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Pre-selected plan banner */}
              {preSelectedPlanId && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                  <p className="text-sm text-primary font-medium">
                    ✨ Paket terpilih dari dashboard — pilih periode lalu klik "Berlangganan Sekarang".
                  </p>
                </div>
              )}

              {/* Plan grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <SubscriptionPlan
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                    onSelectPlan={handleSelectPlan}
                    currentPlan={currentSubscription?.package_id}
                    loading={loading}
                    isHighlighted={plan.id === preSelectedPlanId}
                  />
                ))}
              </div>

              {/* Voucher — shown ONLY after a plan is highlighted/selected */}
              {selectedPlan && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Punya kode voucher? Terapkan sebelum melanjutkan pembayaran.
                  </p>
                  <VoucherInput
                    onVoucherApplied={handleVoucherApplied}
                    selectedPlan={selectedPlan}
                    billingCycle={billingCycle}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Transaction history tab ── */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Riwayat Transaksi</CardTitle>
                  <CardDescription>Daftar semua transaksi pembayaran Anda</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadTransactions}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const planName =
                      tx.user_subscriptions?.subscription_packages?.name ?? "—";
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {tx.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          ) : tx.status === "failed" ? (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{planName}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.invoice_number || tx.id.slice(0, 8)} •{" "}
                              {formatDate(tx.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(tx.amount)}</p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                tx.status === "completed"
                                  ? "border-green-300 text-green-700"
                                  : tx.status === "pending"
                                  ? "border-amber-300 text-amber-700"
                                  : "border-red-300 text-red-700"
                              }`}
                            >
                              {tx.status === "completed"
                                ? "Berhasil"
                                : tx.status === "pending"
                                ? "Menunggu"
                                : "Gagal"}
                            </Badge>
                          </div>
                          {tx.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleDownloadInvoice(tx)}
                            >
                              <Receipt className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
