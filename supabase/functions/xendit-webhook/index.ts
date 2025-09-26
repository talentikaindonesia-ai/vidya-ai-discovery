import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Received Xendit webhook:', JSON.stringify(webhookData, null, 2));

    const { external_id, status, id: invoice_id, paid_amount } = webhookData;

    if (!external_id) {
      console.error('No external_id in webhook data');
      return new Response('Missing external_id', { status: 400 });
    }

    // Find transaction by external_id
    const { data: transaction, error: findError } = await supabase
      .from('payment_transactions')
      .select('*, user_subscriptions(*)')
      .eq('external_transaction_id', invoice_id)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found:', findError);
      return new Response('Transaction not found', { status: 404 });
    }

    console.log('Found transaction:', transaction.id);

    let newStatus = 'pending';
    
    // Map Xendit status to our status
    switch (status) {
      case 'PAID':
        newStatus = 'completed';
        break;
      case 'EXPIRED':
      case 'FAILED':
        newStatus = 'failed';
        break;
      case 'PENDING':
        newStatus = 'pending';
        break;
      default:
        console.log('Unknown status:', status);
        return new Response('Unknown status', { status: 400 });
    }

    // Update transaction status
    const { error: updateError } = await supabase.rpc('update_transaction_status', {
      p_transaction_id: transaction.id,
      p_new_status: newStatus,
      p_external_id: invoice_id
    });

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return new Response('Error updating transaction', { status: 500 });
    }

    // If payment is completed, activate subscription
    if (newStatus === 'completed') {
      console.log('Payment completed, activating subscription');

      // Get subscription plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('id', transaction.subscription_id)
        .single();

      if (planError || !plan) {
        console.error('Plan not found:', planError);
        return new Response('Plan not found', { status: 404 });
      }

      // Calculate expiration date
      const startDate = new Date();
      const expirationDate = new Date(startDate);
      
      if (transaction.transaction_type === 'subscription') {
        // Assume monthly for now - you can get billing cycle from transaction metadata
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      }

      // Create or update user subscription
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: transaction.user_id,
          package_id: plan.id,
          status: 'active',
          billing_cycle: 'monthly', // Get this from transaction metadata in real implementation
          amount_paid: paid_amount || transaction.amount,
          starts_at: startDate.toISOString(),
          expires_at: expirationDate.toISOString(),
          payment_method: 'xendit'
        }, {
          onConflict: 'user_id'
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return new Response('Error creating subscription', { status: 500 });
      }

      // Update profile subscription status
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_type: plan.type,
          subscription_end_date: expirationDate.toISOString()
        })
        .eq('user_id', transaction.user_id);

      console.log('Subscription activated for user:', transaction.user_id);
    }

    return new Response('Webhook processed successfully', {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', {
      headers: corsHeaders,
      status: 500,
    });
  }
});