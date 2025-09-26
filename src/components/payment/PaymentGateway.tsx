import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Building, Smartphone, QrCode } from "lucide-react";
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
    id: 'bank_transfer',
    name: 'Transfer Bank',
    icon: <Building className="w-5 h-5" />,
    description: 'BCA, Mandiri, BNI, BRI',
    fee: 0,
  },
  {
    id: 'e_wallet',
    name: 'E-Wallet',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'GoPay, OVO, Dana, LinkAja',
    fee: 0,
  },
  {
    id: 'credit_card',
    name: 'Kartu Kredit',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Visa, Mastercard, JCB',
    fee: 3000,
  },
  {
    id: 'qr_code',
    name: 'QRIS',
    icon: <QrCode className="w-5 h-5" />,
    description: 'Scan QR untuk bayar',
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
  onCancel 
}: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const finalAmount = amount - discount;

  const handlePayment = async (methodId: string) => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create Xendit payment
      const { data, error } = await supabase.functions.invoke('create-xendit-payment', {
        body: {
          planId,
          userId: user.id,
          amount: finalAmount + (PAYMENT_METHODS.find(m => m.id === methodId)?.fee || 0),
          paymentMethod: methodId,
          billingCycle,
          voucherId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Redirect to Xendit payment page
        window.open(data.invoice_url, '_blank');
        
        toast({
          title: "Pembayaran Dibuat",
          description: "Silakan selesaikan pembayaran di halaman yang terbuka",
        });

        // Simulate checking payment status (in real app, you'd poll or use webhooks)
        setTimeout(() => {
          toast({
            title: "Menunggu Pembayaran",
            description: "Silakan selesaikan pembayaran untuk mengaktifkan subscription",
          });
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>{planName} ({billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'})</span>
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
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
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
                <div className="text-right">
                  {method.fee > 0 && (
                    <Badge variant="secondary">+{formatCurrency(method.fee)}</Badge>
                  )}
                </div>
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
          Batal
        </Button>
        <Button 
          onClick={() => handlePayment(selectedMethod)}
          disabled={!selectedMethod || loading}
          className="flex-1"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Bayar Sekarang
        </Button>
      </div>
    </div>
  );
};