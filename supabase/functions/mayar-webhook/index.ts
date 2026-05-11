import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapMayarStatus(mayarStatus: string): string {
  switch (mayarStatus?.toLowerCase()) {
    case "paid":       return "completed";
    case "expired":
    case "cancelled":
    case "failed":     return "failed";
    case "pending":
    default:           return "pending";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Verify Mayar callback token ──────────────────────────────────────────
    const callbackToken = req.headers.get("x-callback-token");
    const expectedToken = Deno.env.get("MAYAR_WEBHOOK_TOKEN");
    if (expectedToken && callbackToken !== expectedToken) {
      console.warn("Invalid Mayar callback token received");
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Mayar webhook received:", JSON.stringify(payload, null, 2));

    // Mayar webhook fields
    const {
      id: mayarPaymentId,   // Mayar's payment link ID — our primary match key
      status: mayarStatus,
      amount: paidAmount,
    } = payload;

    // ── If no payment ID it's a test / ping — accept it ─────────────────────
    if (!mayarPaymentId) {
      console.log("No payment ID in payload — treating as test ping, returning 200");
      return new Response("OK", { headers: corsHeaders, status: 200 });
    }

    const newStatus = mapMayarStatus(mayarStatus);
    console.log(`Mayar payment ${mayarPaymentId}: status ${mayarStatus} -> ${newStatus}`);

    // ── Find our transaction by external_transaction_id = Mayar payment ID ───
    // (we stored this via update_transaction_status after creating the Mayar link)
    const { data: tx, error: findError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("external_transaction_id", mayarPaymentId)
      .maybeSingle();

    if (findError || !tx) {
      // For test calls Mayar sends a dummy payment ID that won't match — that's OK
      console.log("Transaction not found for Mayar payment ID:", mayarPaymentId, "— may be a test event");
      return new Response("OK", { headers: corsHeaders, status: 200 });
    }

    console.log("Matched transaction:", tx.id, "user:", tx.user_id);

    // ── Update transaction status ────────────────────────────────────────────
    const { error: updateError } = await supabase.rpc("update_transaction_status", {
      p_transaction_id: tx.id,
      p_new_status: newStatus,
      p_external_id: mayarPaymentId,
    });

    if (updateError) {
      console.error("Error updating transaction status:", updateError);
      return new Response("Error updating transaction", { status: 500 });
    }

    // ── If paid, activate subscription ───────────────────────────────────────
    if (newStatus === "completed") {
      console.log("Payment completed — activating subscription for user:", tx.user_id);

      let billingCycle = "monthly";
      let planId = tx.subscription_id;

      try {
        if (tx.notes) {
          const notes = JSON.parse(tx.notes);
          billingCycle = notes.billingCycle ?? "monthly";
          planId = notes.planId ?? planId;
        }
      } catch {
        console.warn("Could not parse transaction notes — defaulting to monthly");
      }

      const { data: plan, error: planError } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      if (planError || !plan) {
        console.error("Plan not found:", planId, planError);
        return new Response("Plan not found", { status: 404 });
      }

      const startsAt = new Date();
      const expiresAt = new Date(startsAt);
      if (billingCycle === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: subError } = await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: tx.user_id,
            package_id: plan.id,
            status: "active",
            billing_cycle: billingCycle,
            amount_paid: paidAmount ?? tx.amount,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "mayar",
            auto_renew: false,
          },
          { onConflict: "user_id" }
        );

      if (subError) {
        console.error("Error upserting user_subscriptions:", subError);
        return new Response("Error activating subscription", { status: 500 });
      }

      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_type: plan.type,
          subscription_end_date: expiresAt.toISOString(),
        })
        .eq("user_id", tx.user_id);

      console.log("Subscription activated:", plan.name, billingCycle, "expires:", expiresAt.toISOString());
    }

    return new Response("OK", { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error("Mayar webhook error:", error);
    return new Response("Internal server error", { headers: corsHeaders, status: 500 });
  }
});
