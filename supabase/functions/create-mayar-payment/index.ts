import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  planId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  billingCycle: string;
  voucherId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      planId,
      userId,
      amount,
      paymentMethod,
      billingCycle,
      voucherId,
    }: PaymentRequest = await req.json();

    console.log("Creating Mayar payment for user:", userId, "amount:", amount);

    // ── Validate subscription plan ──────────────────────────────────────────
    const { data: plan, error: planError } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan) {
      throw new Error("Invalid subscription plan");
    }

    // ── Fetch user profile (for name / email) ───────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    const customerName = profile?.full_name ?? "Customer";
    const customerEmail = profile?.email ?? "";

    // ── Create pending transaction record ───────────────────────────────────
    const { data: transactionId, error: txError } = await supabase.rpc(
      "create_payment_transaction",
      {
        p_user_id: userId,
        p_transaction_type: "subscription",
        p_amount: amount,
        p_payment_gateway: "mayar",
        p_currency: "IDR",
      }
    );

    if (txError || !transactionId) {
      throw new Error("Failed to create transaction: " + txError?.message);
    }

    // Store billingCycle + planId in notes so the webhook can read them
    await supabase
      .from("payment_transactions")
      .update({ notes: JSON.stringify({ billingCycle, planId, paymentMethod }) })
      .eq("id", transactionId);

    // ── Call Mayar API ──────────────────────────────────────────────────────
    const mayarApiKey = Deno.env.get("MAYAR_API_KEY");
    if (!mayarApiKey) throw new Error("Mayar API key not configured");

    const baseUrl =
      Deno.env.get("APP_URL") ??
      Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") ??
      "https://app.talentika.id";

    const mayarBody = {
      name: customerName,
      amount,
      description: `${plan.name} – ${billingCycle === "monthly" ? "Bulanan" : "Tahunan"}`,
      redirectUrl: `${baseUrl}/subscription?payment=success`,
      closedAmount: true,
      externalId: transactionId,        // echoed back in webhook payload
      ...(customerEmail && { email: customerEmail }),
    };

    console.log("Calling Mayar API:", JSON.stringify(mayarBody, null, 2));

    const mayarResponse = await fetch("https://api.mayar.id/hl/v1/payment/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mayarApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mayarBody),
    });

    if (!mayarResponse.ok) {
      const errorText = await mayarResponse.text();
      console.error("Mayar API error:", errorText);
      throw new Error(`Mayar API error: ${mayarResponse.status} – ${errorText}`);
    }

    const mayarData = await mayarResponse.json();
    const payment = mayarData.data;

    if (!payment?.link) {
      throw new Error("Mayar did not return a payment link: " + JSON.stringify(mayarData));
    }

    console.log("Mayar payment created:", payment.id, "link:", payment.link);

    // ── Store Mayar payment ID as external_transaction_id ───────────────────
    await supabase.rpc("update_transaction_status", {
      p_transaction_id: transactionId,
      p_new_status: "pending",
      p_external_id: payment.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_url: payment.link,   // PaymentGateway opens this in a new tab
        invoice_id: payment.id,
        transaction_id: transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating Mayar payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
