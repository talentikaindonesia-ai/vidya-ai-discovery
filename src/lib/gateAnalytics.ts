import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget logging of premium-gate funnel events.
 * Powers gate_conversion_stats() — which gate converts best.
 */
export async function logGateEvent(
  event: "upgrade_prompt_shown" | "upgrade_prompt_clicked",
  feature: string,
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("funnel_events").insert({
      user_id: user.id,
      event,
      feature,
    });
  } catch {
    // analytics must never break the UX
  }
}
