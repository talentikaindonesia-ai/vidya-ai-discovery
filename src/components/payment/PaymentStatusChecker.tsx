import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentStatusCheckerProps {
  userId: string;
  onPaymentCompleted?: () => void;
}

export const PaymentStatusChecker = ({ userId, onPaymentCompleted }: PaymentStatusCheckerProps) => {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingPayments();
    // Poll every 30 seconds for updates
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          subscription_packages (name, type)
        `)
        .eq('user_id', userId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error: any) {
      console.error('Error loading pending payments:', error);
    }
  };

  const refreshPaymentStatus = async (transactionId: string) => {
    setLoading(true);
    try {
      await loadPendingPayments();
      toast({
        title: "Status Diperbarui",
        description: "Status pembayaran telah diperbarui",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memperbarui status pembayaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  if (pendingPayments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Status Pembayaran Aktif</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPendingPayments()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(payment.status)}
              <div>
                <p className="font-medium">
                  {payment.subscription_packages?.name || 'Subscription'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(payment.amount)} • {formatDate(payment.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(payment.status)}>
                {payment.status === 'pending' ? 'Menunggu' : 
                 payment.status === 'completed' ? 'Berhasil' : 'Gagal'}
              </Badge>
              
              {payment.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshPaymentStatus(payment.id)}
                  disabled={loading}
                >
                  Cek Status
                </Button>
              )}
            </div>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground text-center pt-2">
          Status akan diperbarui otomatis setiap 30 detik
        </div>
      </CardContent>
    </Card>
  );
};