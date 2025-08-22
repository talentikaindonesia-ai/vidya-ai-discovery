import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionLimits {
  maxCourses: number;
  maxOpportunities: number;
  canAccessPremiumContent: boolean;
}

export const getSubscriptionLimits = (subscriptionStatus: string | null, subscriptionType: string | null): SubscriptionLimits => {
  // Check if user has active subscription
  if (subscriptionStatus === 'active') {
    return {
      maxCourses: -1, // Unlimited
      maxOpportunities: -1, // Unlimited
      canAccessPremiumContent: true,
    };
  }
  
  // Basic/Free tier limits
  return {
    maxCourses: 3,
    maxOpportunities: 5,
    canAccessPremiumContent: false,
  };
};

export const checkSubscriptionAccess = (
  itemCount: number,
  limit: number,
  subscriptionStatus: string | null
): { canAccess: boolean; isLimitReached: boolean } => {
  if (subscriptionStatus === 'active' || limit === -1) {
    return { canAccess: true, isLimitReached: false };
  }
  
  const isLimitReached = itemCount >= limit;
  return { canAccess: !isLimitReached, isLimitReached };
};

export const getUserSubscriptionInfo = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_type, subscription_end_date')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching subscription info:', error);
    return null;
  }
  
  return data;
};