/**
 * check-mayar-payment
 *
 * Called by admin "Sync Mayar" button or by PaymentStatusChecker.
 * Queries Mayar API for a payment link status and updates our DB.
 *
 * Body: { externalId: string }   — the Mayar payment link ID
 * OR:   { invoiceNumber: string } — our invoice number (used as fallback)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapMayarStatus(s: string): string {
  switch (s?.toLowerCase()) {
    case "paid":                       return "completed";
    case "expired": case "cancelled":
    case "failed":                     return "failed";
    default:                           return "pending";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const mayarApiKey = Deno.env.get("MAYAR_API_KEY") ?? "";

    const { externalId, invoiceNumber } = await req.json();

    // ── Find our transaction ───────────────────────────────────────────────────
    let tx: any = null;

    if (externalId) {
      const { data } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("external_transaction_id", externalId)
        .maybeSingle();
      tx = data;
    }
    if (!tx && invoiceNumber) {
      const { data } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("invoice_number", invoiceNumber)
        .maybeSingle();
      tx = data;
    }

    if (!tx) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tx.external_transaction_id) {
      return new Response(JSON.stringify({ status: tx.status, message: "No Mayar ID stored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Query Mayar API for current status ────────────────────────────────────
    const mayarRes = await fetch(
      `https://api.mayar.id/hl/v1/payment/${tx.external_transaction_id}`,
      { headers: { Authorization: `Bearer ${mayarApiKey}`, "Content-Type": "application/json" } }
    );

    if (!mayarRes.ok) {
      const errText = await mayarRes.text();
      return new Response(JSON.stringify({ error: "Mayar API error", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mayarData = await mayarRes.json();
    const payment   = mayarData?.data ?? mayarData;
    const mayarStatus  = payment?.status ?? "pending";
    const newStatus    = mapMayarStatus(mayarStatus);

    console.log(`check-mayar: tx=${tx.id} mayar_status=${mayarStatus} → ${newStatus}`);

    // ── Only update if status changed ─────────────────────────────────────────
    if (newStatus !== tx.status) {
      await supabase.rpc("update_transaction_status", {
        p_transaction_id: tx.id,
        p_new_status:     newStatus,
        p_external_id:    tx.external_transaction_id,
      });

      // If now completed — activate subscription (same as webhook flow)
      if (newStatus === "completed") {
        const notes = tx.notes ? JSON.parse(tx.notes) : {};
        const { data: plan } = await supabase
          .from("subscription_packages").select("*")
          .eq("id", notes.planId ?? tx.subscription_id).maybeSingle();

        if (plan) {
          const billingCycle = notes.billingCycle ?? "monthly";
          const startsAt  = new Date();
          const expiresAt = new Date(startsAt);
          billingCycle === "yearly"
            ? expiresAt.setFullYear(expiresAt.getFullYear() + 1)
            : expiresAt.setMonth(expiresAt.getMonth() + 1);

          await supabase.from("user_subscriptions").upsert({
            user_id: tx.user_id, package_id: plan.id, status: "active",
            billing_cycle: billingCycle, amount_paid: tx.amount,
            starts_at: startsAt.toISOString(), expires_at: expiresAt.toISOString(),
            payment_method: "mayar", auto_renew: false,
          }, { onConflict: "user_id" });

          await supabase.from("profiles").update({
            subscription_status: "active",
            subscription_type:   plan.type,
            subscription_end_date: expiresAt.toISOString(),
          }).eq("user_id", tx.user_id);
        }
      }
    }

    return new Response(JSON.stringify({ previousStatus: tx.status, newStatus, mayarStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
