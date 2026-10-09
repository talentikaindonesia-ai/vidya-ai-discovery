import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isPremium: boolean;
  isFree: boolean;
  isSchool: boolean;
  isEnterprise: boolean;
  /** Where premium came from: 'paid' | 'school' | 'admin' | null */
  source: string | null;
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
  source: null,
  type: null,
  status: null,
  expiresAt: null,
  daysLeft: null,
  loading: true,
};

let cache: { state: SubscriptionState; ts: number } | null = null;
const CACHE_MS = 60_000; // 1 minute

/**
 * Subscription state, backed by the server-side `my_access()` RPC —
 * the same logic RLS uses (paid-not-expired OR school member OR admin),
 * so the UI and the database can never disagree about who is premium.
 */
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

      const { data, error } = await supabase.rpc("my_access");
      if (cancelled) return;

      if (error || !data) {
        // Fail closed (free) but don't cache errors
        console.error("my_access RPC failed:", error);
        setState({ ...DEFAULT, loading: false });
        return;
      }

      const acc = data as {
        is_premium: boolean;
        source: string | null;
        expires_at: string | null;
        type: string | null;
      };

      const exp = acc.expires_at ?? null;
      const daysLeft =
        (acc.source === "paid" || acc.source === "trial") && exp
          ? Math.ceil((new Date(exp).getTime() - Date.now()) / 86_400_000)
          : null;

      const next: SubscriptionState = {
        isPremium: !!acc.is_premium,
        isFree: !acc.is_premium,
        isSchool: acc.source === "school",
        isEnterprise: acc.type === "enterprise" && !!acc.is_premium,
        source: acc.source,
        type: acc.type ?? "free",
        status: acc.is_premium ? "active" : "inactive",
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
