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
  phone?: string;
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
      phone,
    }: PaymentRequest = await req.json();

    console.log("Creating Mayar payment | user:", userId, "amount:", amount, "plan:", planId);

    // ── Validate subscription plan ───────────────────────────────────────────
    const { data: plan, error: planError } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("id", planId)
      .maybeSingle();

    if (planError || !plan) {
      throw new Error("Invalid subscription plan: " + (planError?.message ?? "not found"));
    }

    // ── Fetch user profile for name / email ──────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("user_id", userId)
      .maybeSingle();

    const customerName = profile?.full_name ?? "Customer";
    const customerEmail = profile?.email ?? "";

    // ── Create pending transaction record ────────────────────────────────────
    const { data: transactionId, error: txError } = await supabase.rpc(
      "create_payment_transaction",
      {
        p_user_id: userId,
        p_transaction_type: "subscription",
        p_amount: Math.round(amount),   // ensure integer
        p_payment_gateway: "mayar",
        p_currency: "IDR",
      }
    );

    if (txError || !transactionId) {
      throw new Error("Failed to create transaction: " + (txError?.message ?? "unknown"));
    }

    console.log("Transaction created:", transactionId);

    // Store billingCycle + planId in notes so webhook can activate correctly
    await supabase
      .from("payment_transactions")
      .update({ notes: JSON.stringify({ billingCycle, planId, paymentMethod, transactionId }) })
      .eq("id", transactionId);

    // ── Call Mayar API ───────────────────────────────────────────────────────
    const mayarApiKey = Deno.env.get("MAYAR_API_KEY");
    if (!mayarApiKey) throw new Error("Mayar API key not configured");

    // APP_URL secret → custom domain; fallback to talentika.id
    const baseUrl = Deno.env.get("APP_URL") ?? "https://talentika.id";

    const description = `${plan.name} – ${billingCycle === "monthly" ? "Bulanan" : "Tahunan"} | Ref: ${transactionId.slice(0, 8)}`;

    // Mayar create payment link body — only include supported fields
    const mayarBody: Record<string, unknown> = {
      name: plan.name,                // product name (required)
      amount: Math.round(amount),
      description,
      redirectUrl: `${baseUrl}/subscription?payment=success&ref=${transactionId}`,
      closedAmount: true,
    };

    // mobile is required by Mayar — use phone from request, fallback to profile phone
    const mobile = phone?.trim() || profile?.phone?.trim() || "";
    if (!mobile) throw new Error("Nomor HP wajib diisi untuk melanjutkan pembayaran.");
    mayarBody.mobile = mobile;

    if (customerEmail) mayarBody.email = customerEmail;

    console.log("Calling Mayar API with body:", JSON.stringify(mayarBody));

    const mayarResponse = await fetch("https://api.mayar.id/hl/v1/payment/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mayarApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mayarBody),
    });

    const mayarText = await mayarResponse.text();
    console.log("Mayar API response status:", mayarResponse.status, "body:", mayarText);

    if (!mayarResponse.ok) {
      throw new Error(`Mayar API error ${mayarResponse.status}: ${mayarText}`);
    }

    let mayarData: any;
    try {
      mayarData = JSON.parse(mayarText);
    } catch {
      throw new Error("Mayar returned non-JSON response: " + mayarText);
    }

    const payment = mayarData?.data;
    if (!payment?.link) {
      throw new Error("Mayar did not return a payment link: " + mayarText);
    }

    console.log("Mayar payment link created:", payment.id, "->", payment.link);

    // ── Store Mayar payment link ID as external_transaction_id ───────────────
    // This is the primary key we use to match the webhook later
    await supabase.rpc("update_transaction_status", {
      p_transaction_id: transactionId,
      p_new_status: "pending",
      p_external_id: payment.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_url: payment.link,
        invoice_id: payment.id,
        transaction_id: transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("create-mayar-payment error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
