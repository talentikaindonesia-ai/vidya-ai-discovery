import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionPlan } from "./SubscriptionPlan";
import { VoucherInput } from "./VoucherInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard, Receipt, Users, Crown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SubscriptionManagerProps {
  userId: string;
  onSubscriptionChange?: () => void;
}

export const SubscriptionManager = ({ userId, onSubscriptionChange }: SubscriptionManagerProps) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
    loadCurrentSubscription();
    loadTransactions();
  }, [userId]);

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_packages')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat paket berlangganan",
        variant: "destructive",
      });
      return;
    }

    setPlans(data || []);
  };

  const loadCurrentSubscription = async () => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_packages (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (data) {
      setCurrentSubscription(data);
    }
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTransactions(data);
    }
  };

  const handleSelectPlan = async (planId: string, cycle: "monthly" | "yearly") => {
    setLoading(true);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan tidak ditemukan');

      const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
      const finalPrice = price - discount;

      if (plan.type === 'free') {
        // Handle free plan activation
        await activateFreePlan(planId);
        return;
      }

      // Create payment session (integrate with payment gateway)
      await createPaymentSession(planId, cycle, finalPrice);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activateFreePlan = async (planId: string) => {
    const { error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        package_id: planId,
        status: 'active',
        billing_cycle: 'monthly',
        amount_paid: 0,
        starts_at: new Date().toISOString(),
        expires_at: null, // Free plan doesn't expire
      });

    if (error) throw error;

    toast({
      title: "Berhasil!",
      description: "Paket gratis telah diaktifkan",
    });

    loadCurrentSubscription();
    onSubscriptionChange?.();
  };

  const createPaymentSession = async (planId: string, cycle: "monthly" | "yearly", amount: number) => {
    // This would integrate with payment gateway (Midtrans, Xendit, etc.)
    // For now, we'll show a placeholder
    toast({
      title: "Redirect ke Pembayaran",
      description: "Akan diarahkan ke halaman pembayaran...",
    });
    
    // Create pending transaction
    const { error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'subscription',
        amount,
        status: 'pending',
        payment_gateway: 'midtrans', // or selected gateway
      });

    if (error) throw error;
  };

  const handleVoucherApplied = (voucher: any, discountAmount: number) => {
    setSelectedVoucher(voucher);
    setDiscount(discountAmount);
    toast({
      title: "Voucher Diterapkan!",
      description: `Diskon ${formatCurrency(discountAmount)} telah diterapkan`,
    });
  };

  const getSubscriptionStatus = () => {
    if (!currentSubscription) return null;
    
    const isExpiring = currentSubscription.expires_at && 
      new Date(currentSubscription.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle>Status Berlangganan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{currentSubscription.subscription_packages?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {currentSubscription.billing_cycle === 'monthly' ? 'Bulanan' : 'Tahunan'}
              </p>
            </div>
            <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
              {currentSubscription.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          </div>
          
          {currentSubscription.expires_at && (
            <div className={`p-3 rounded-lg ${isExpiring ? 'bg-destructive/10' : 'bg-muted'}`}>
              <p className="text-sm">
                Berakhir pada: {formatDate(currentSubscription.expires_at)}
                {isExpiring && (
                  <span className="text-destructive font-medium ml-2">
                    (Akan berakhir dalam 7 hari)
                  </span>
                )}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Kelola Pembayaran
            </Button>
            <Button variant="outline" size="sm">
              <Receipt className="w-4 h-4 mr-2" />
              Unduh Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {getSubscriptionStatus()}
      
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Paket Berlangganan</TabsTrigger>
          <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Paket Berlangganan</CardTitle>
              <CardDescription>
                Pilih paket yang sesuai dengan kebutuhan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
                  <TabsList>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                    <TabsTrigger value="yearly">Tahunan (Hemat!)</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <VoucherInput 
                onVoucherApplied={handleVoucherApplied}
                selectedPlan={null}
                billingCycle={billingCycle}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {plans.map((plan) => (
                  <SubscriptionPlan
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                    onSelectPlan={handleSelectPlan}
                    currentPlan={currentSubscription?.package_id}
                    loading={loading}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>
                Daftar semua transaksi pembayaran Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada transaksi
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {transaction.status === 'completed' ? 'Berhasil' :
                           transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};