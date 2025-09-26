import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ArrowRight, Star, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface UserSubscription {
  status: string;
  subscription_packages?: {
    name: string;
    type: string;
  };
  expires_at?: string;
}

export const SubscriptionButton = ({ userId }: { userId: string }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          expires_at,
          subscription_packages (
            name,
            type
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionIcon = (type?: string) => {
    switch (type) {
      case 'individual': return <Crown className="w-5 h-5 text-primary" />;
      case 'business': return <Star className="w-5 h-5 text-purple-600" />;
      case 'free': return <Gift className="w-5 h-5 text-green-600" />;
      default: return <Crown className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const isExpiring = subscription?.expires_at && 
    new Date(subscription.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || subscription.status !== 'active') {
    return (
      <Card className="w-full border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Upgrade ke Premium</p>
                <p className="text-sm text-muted-foreground">
                  Akses semua fitur dan konten premium
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/subscription')}
              className="hero"
              size="sm"
            >
              <ArrowRight className="w-4 h-4 ml-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getSubscriptionIcon(subscription.subscription_packages?.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {subscription.subscription_packages?.name || 'Premium'}
                </p>
                <Badge variant="default" className="text-xs">
                  Aktif
                </Badge>
                {isExpiring && (
                  <Badge variant="destructive" className="text-xs">
                    Segera Berakhir
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription.expires_at ? (
                  `Berlaku sampai ${new Date(subscription.expires_at).toLocaleDateString('id-ID')}`
                ) : (
                  'Berlangganan aktif'
                )}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
          >
            Kelola
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};