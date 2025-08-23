import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Zap, 
  ShoppingBag,
  Crown,
  Palette,
  BookOpen,
  Ticket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGameification } from "@/hooks/useGameification";
import { useToast } from "@/hooks/use-toast";

interface RewardItem {
  id: string;
  title: string;
  description: string;
  item_type: string;
  xp_cost: number;
  image_url?: string;
  is_available: boolean;
  stock_quantity?: number;
}

interface UserReward {
  id: string;
  reward_item_id: string;
  is_redeemed: boolean;
  redemption_code?: string;
}

export const RewardStore = () => {
  const [rewardItems, setRewardItems] = useState<RewardItem[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const { userXP, loadGameificationData } = useGameification();
  const { toast } = useToast();

  useEffect(() => {
    loadRewardStore();
  }, []);

  const loadRewardStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load available reward items
      const { data: itemsData } = await supabase
        .from('reward_items')
        .select('*')
        .eq('is_available', true)
        .order('xp_cost', { ascending: true });

      // Load user's purchased rewards
      const { data: userRewardsData } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id);

      setRewardItems(itemsData || mockRewardItems);
      setUserRewards(userRewardsData || []);
    } catch (error) {
      console.error('Error loading reward store:', error);
      setRewardItems(mockRewardItems);
    } finally {
      setLoading(false);
    }
  };

  const purchaseReward = async (item: RewardItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userXP.current_xp < item.xp_cost) {
        toast({
          title: "Insufficient XP",
          description: `You need ${item.xp_cost - userXP.current_xp} more XP to purchase this item.`,
          variant: "destructive"
        });
        return;
      }

      // Generate redemption code
      const redemptionCode = `TLK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Record the purchase
      const { error: purchaseError } = await supabase
        .from('user_rewards')
        .insert([{
          user_id: user.id,
          reward_item_id: item.id,
          xp_spent: item.xp_cost,
          redemption_code: redemptionCode
        }]);

      if (purchaseError) throw purchaseError;

      // Deduct XP from user
      const { error: xpError } = await supabase
        .from('user_xp')
        .update({
          current_xp: userXP.current_xp - item.xp_cost
        })
        .eq('user_id', user.id);

      if (xpError) throw xpError;

      toast({
        title: "🎉 Purchase Successful!",
        description: `You've purchased ${item.title}! Redemption code: ${redemptionCode}`,
        duration: 10000,
      });

      loadGameificationData();
      loadRewardStore();
    } catch (error) {
      console.error('Error purchasing reward:', error);
      toast({
        title: "Purchase Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'discount': return Ticket;
      case 'merchandise': return ShoppingBag;
      case 'premium_content': return BookOpen;
      case 'customization': return Palette;
      default: return Gift;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'discount': return 'text-green-600 bg-green-100';
      case 'merchandise': return 'text-blue-600 bg-blue-100';
      case 'premium_content': return 'text-purple-600 bg-purple-100';
      case 'customization': return 'text-pink-600 bg-pink-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  // Mock data for demonstration
  const mockRewardItems = [
    {
      id: '1',
      title: '10% Course Discount',
      description: 'Get 10% off any premium course',
      item_type: 'discount',
      xp_cost: 500,
      is_available: true
    },
    {
      id: '2',
      title: 'Talentika T-Shirt',
      description: 'Official Talentika branded t-shirt',
      item_type: 'merchandise',
      xp_cost: 2000,
      is_available: true
    },
    {
      id: '3',
      title: 'Premium Dashboard Theme',
      description: 'Unlock exclusive dark theme for your dashboard',
      item_type: 'customization',
      xp_cost: 800,
      is_available: true
    },
    {
      id: '4',
      title: 'Exclusive Webinar Access',
      description: 'Access to VIP-only career webinars',
      item_type: 'premium_content',
      xp_cost: 1200,
      is_available: true
    },
    {
      id: '5',
      title: '25% Bootcamp Discount',
      description: 'Get 25% off any Talentika bootcamp',
      item_type: 'discount',
      xp_cost: 1500,
      is_available: true
    },
    {
      id: '6',
      title: 'Custom Avatar Badge',
      description: 'Design your own special achievement badge',
      item_type: 'customization',
      xp_cost: 1000,
      is_available: true
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reward Store</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Reward Store
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">{userXP.current_xp}</span>
            <span className="text-sm text-muted-foreground">XP Available</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rewardItems.map((item) => {
            const Icon = getItemIcon(item.item_type);
            const colorClass = getItemColor(item.item_type);
            const canAfford = userXP.current_xp >= item.xp_cost;
            const alreadyPurchased = userRewards.some(ur => ur.reward_item_id === item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  canAfford && !alreadyPurchased
                    ? 'bg-card hover:shadow-md hover-scale'
                    : 'bg-muted/50 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {item.item_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      {item.xp_cost}
                    </Badge>
                  </div>

                  {alreadyPurchased ? (
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Owned
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => purchaseReward(item)}
                      className="hover-scale"
                    >
                      {canAfford ? 'Purchase' : 'Need More XP'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {rewardItems.length === 0 && (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No rewards available at the moment. Check back soon!
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
          <p className="text-sm text-muted-foreground">
            💡 Earn XP by completing quests, courses, and daily activities. Redeem your XP for exclusive rewards!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};