// ARCHIVED 2026-07-14 — Xendit gateway abandoned. Not deployed. See README.md.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    const { external_id, status, id: invoice_id, paid_amount } = webhookData;

    if (!external_id) {
      return new Response('Missing external_id', { status: 400 });
    }

    const { data: transaction, error: findError } = await supabase
      .from('payment_transactions')
      .select('*, user_subscriptions(*)')
      .eq('external_transaction_id', invoice_id)
      .single();

    if (findError || !transaction) {
      return new Response('Transaction not found', { status: 404 });
    }

    let newStatus = 'pending';
    switch (status) {
      case 'PAID': newStatus = 'completed'; break;
      case 'EXPIRED':
      case 'FAILED': newStatus = 'failed'; break;
      case 'PENDING': newStatus = 'pending'; break;
      default: return new Response('Unknown status', { status: 400 });
    }

    const { error: updateError } = await supabase.rpc('update_transaction_status', {
      p_transaction_id: transaction.id,
      p_new_status: newStatus,
      p_external_id: invoice_id
    });

    if (updateError) {
      return new Response('Error updating transaction', { status: 500 });
    }

    if (newStatus === 'completed') {
      const { data: plan, error: planError } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('id', transaction.subscription_id)
        .single();

      if (planError || !plan) {
        return new Response('Plan not found', { status: 404 });
      }

      const startDate = new Date();
      const expirationDate = new Date(startDate);
      if (transaction.transaction_type === 'subscription') {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      await supabase.from('user_subscriptions').upsert({
        user_id: transaction.user_id,
        package_id: plan.id,
        status: 'active',
        billing_cycle: 'monthly',
        amount_paid: paid_amount || transaction.amount,
        starts_at: startDate.toISOString(),
        expires_at: expirationDate.toISOString(),
        payment_method: 'xendit'
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_type: plan.type,
        subscription_end_date: expirationDate.toISOString()
      }).eq('user_id', transaction.user_id);
    }

    return new Response('Webhook processed successfully', { headers: corsHeaders, status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { headers: corsHeaders, status: 500 });
  }
});
