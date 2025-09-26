import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionManager } from "@/components/payment/SubscriptionManager";
import { PaymentStatusChecker } from "@/components/payment/PaymentStatusChecker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Subscription = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk mengakses halaman ini",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setUser(session.user);
    setLoading(false);
  };

  const handleSubscriptionChange = () => {
    toast({
      title: "Berhasil!",
      description: "Status berlangganan telah diperbarui",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Kelola Berlangganan
            </h1>
            <p className="text-muted-foreground">
              Pilih paket yang sesuai dengan kebutuhan Anda
            </p>
          </div>
        </div>

        {/* Subscription Manager */}
        <div className="max-w-6xl mx-auto space-y-6">
          {user && <PaymentStatusChecker userId={user.id} />}
          <SubscriptionManager 
            userId={user.id} 
            onSubscriptionChange={handleSubscriptionChange}
          />
        </div>

        {/* Payment Security Notice */}
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Keamanan Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-foreground">Pembayaran Aman</p>
                <p>Transaksi dilindungi dengan Xendit</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">30</span>
                </div>
                <p className="font-medium text-foreground">Garansi 30 Hari</p>
                <p>Tidak puas? Dapatkan refund 100%</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">24/7</span>
                </div>
                <p className="font-medium text-foreground">Support 24/7</p>
                <p>Tim support siap membantu kapan saja</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Webhook URL untuk Xendit:</strong> <br/>
                https://doogbcrodipaeahgbjuj.supabase.co/functions/v1/xendit-webhook
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Konfigurasi webhook ini di dashboard Xendit untuk update status pembayaran otomatis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;