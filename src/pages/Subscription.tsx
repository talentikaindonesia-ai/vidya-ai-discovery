import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionManager } from "@/components/payment/SubscriptionManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Star, Users, Trophy } from "lucide-react";
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
    
    // Allow non-members to view subscription offer
    setUser(session?.user || null);
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

  if (!user) {
    // Non-member view - Subscription offer
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Talentika Branding */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-soft">
                <img 
                  src="/lovable-uploads/ce4aabf2-d425-472e-ada0-d085a2b285b9.png" 
                  alt="Talentika Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Talentika</h1>
                <p className="text-sm text-muted-foreground">Discover your full potential</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2"
            >
              Masuk / Daftar
            </Button>
          </div>

          {/* Hero Section for Non-Members */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Bergabunglah dengan Talentika
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Dapatkan akses ke platform pengembangan bakat terlengkap dan mulai perjalanan menuju potensi terbaik Anda
            </p>
            <Button 
              variant="hero" 
              size="hero"
              onClick={() => navigate('/auth')}
              className="mb-8"
            >
              Mulai Gratis Sekarang
            </Button>
          </div>

          {/* Benefits for Non-Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Asesmen Kepribadian</h3>
                <p className="text-muted-foreground">
                  Temukan tipe kepribadian dan minat karir Anda dengan asesmen RIASEC yang komprehensif
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pembelajaran Personal</h3>
                <p className="text-muted-foreground">
                  Akses ke ribuan konten pembelajaran yang disesuaikan dengan profil dan tujuan karir Anda
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Komunitas & Mentor</h3>
                <p className="text-muted-foreground">
                  Bergabung dengan komunitas profesional dan dapatkan bimbingan dari mentor berpengalaman
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-primary text-white text-center">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">Siap Memulai Perjalanan Anda?</h3>
              <p className="text-lg mb-6 opacity-90">
                Daftar sekarang dan dapatkan akses gratis ke semua fitur dasar Talentika
              </p>
              <Button 
                variant="elegant" 
                size="hero"
                onClick={() => navigate('/auth')}
              >
                Daftar Gratis Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Talentika Branding */}
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-soft">
              <img 
                src="/lovable-uploads/ce4aabf2-d425-472e-ada0-d085a2b285b9.png" 
                alt="Talentika Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Talentika</h1>
              <p className="text-sm text-muted-foreground">Kelola Berlangganan Anda</p>
            </div>
          </div>
        </div>

        {/* Subscription Manager */}
        <div className="max-w-6xl mx-auto">
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
                <p>Transaksi dilindungi SSL 256-bit encryption</p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;