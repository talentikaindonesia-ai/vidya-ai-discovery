import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isPremium: boolean;
  isFree: boolean;
  isSchool: boolean;
  isEnterprise: boolean;
  type: string | null;
  status: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  loading: boolean;
}

const DEFAULT: SubscriptionState = {
  isPremium: false,
  isFree: true,
  isSchool: false,
  isEnterprise: false,
  type: null,
  status: null,
  expiresAt: null,
  daysLeft: null,
  loading: true,
};

let cache: { state: SubscriptionState; ts: number } | null = null;
const CACHE_MS = 60_000; // 1 minute

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>(DEFAULT);

  useEffect(() => {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      setState({ ...cache.state, loading: false });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("subscription_type, subscription_status, subscription_end_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const type   = data?.subscription_type ?? "free";
      const status = data?.subscription_status ?? "inactive";
      const exp    = data?.subscription_end_date ?? null;
      const daysLeft = exp
        ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86_400_000)
        : null;

      const isPremium    = (type === "premium" || type === "premium_individual" || type === "individual" || type === "family") && status === "active";
      const isSchool     = type === "school"     && status === "active";
      const isEnterprise = type === "enterprise" && status === "active";

      const next: SubscriptionState = {
        isPremium: isPremium || isSchool || isEnterprise,
        isFree: !isPremium && !isSchool && !isEnterprise,
        isSchool,
        isEnterprise,
        type,
        status,
        expiresAt: exp,
        daysLeft,
        loading: false,
      };

      cache = { state: next, ts: Date.now() };
      setState(next);
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

/** Invalidate the module-level cache (call after subscription change) */
export function invalidateSubscriptionCache() {
  cache = null;
}
