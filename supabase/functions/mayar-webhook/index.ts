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

    if (!expectedToken) {
      // Token not yet configured — allow through but warn loudly
      console.warn("⚠️  MAYAR_WEBHOOK_TOKEN not set. Go to: Supabase Dashboard → Edge Functions → Secrets → add MAYAR_WEBHOOK_TOKEN");
    } else if (callbackToken !== expectedToken) {
      console.warn("❌ Invalid Mayar token. Received:", callbackToken?.slice(0, 8) ?? "none");
      return new Response("Unauthorized", { status: 401 });
    }

    // Log full payload for debugging
    const rawBody = await req.text();
    console.log("📦 Mayar webhook raw payload:", rawBody);
    let payload: any;
    try { payload = JSON.parse(rawBody); }
    catch { console.error("Invalid JSON body"); return new Response("Bad Request", { status: 400 }); }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // payload already parsed above
    console.log("✅ Mayar webhook parsed:", JSON.stringify(payload, null, 2));

    // Mayar webhook fields — handle both top-level and nested `data` envelope
    const data = payload?.data ?? payload;
    // Mayar sends event-level `id` at top level and payment `id` inside `data`
    const {
      id: mayarPaymentId,   // payment link ID (inside data envelope)
      status: mayarStatus,
      amount: paidAmount,
      referenceNo,          // maps to our invoice_number — fallback match key
    } = data;

    // ── If no payment ID it's a test / ping — accept it ─────────────────────
    if (!mayarPaymentId && !referenceNo) {
      console.log("No payment ID or referenceNo — treating as test ping");
      return new Response("OK", { headers: corsHeaders, status: 200 });
    }

    const newStatus = mapMayarStatus(mayarStatus);
    console.log(`Mayar: id=${mayarPaymentId} ref=${referenceNo} status=${mayarStatus} → ${newStatus}`);

    // ── Find transaction: try external_transaction_id first, fallback to invoice_number ──
    let tx: any = null;

    if (mayarPaymentId) {
      const { data: byId } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("external_transaction_id", mayarPaymentId)
        .maybeSingle();
      tx = byId;
    }

    // Fallback: match by referenceNo → invoice_number (Mayar may use event id at top level)
    if (!tx && referenceNo) {
      console.log("Falling back to referenceNo match:", referenceNo);
      const { data: byRef } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("invoice_number", referenceNo)
        .maybeSingle();
      tx = byRef;
    }

    if (!tx) {
      console.log("⚠️  Transaction not found for id:", mayarPaymentId, "ref:", referenceNo, "— test event or mismatch");
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
