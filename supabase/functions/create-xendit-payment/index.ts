import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { planId, userId, amount, paymentMethod, billingCycle, voucherId }: PaymentRequest = await req.json();

    console.log('Creating Xendit payment for user:', userId, 'amount:', amount);

    // Validate user and plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_packages')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid subscription plan');
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase.rpc('create_payment_transaction', {
      p_user_id: userId,
      p_transaction_type: 'subscription',
      p_amount: amount,
      p_payment_gateway: 'xendit',
      p_currency: 'IDR'
    });

    if (transactionError) {
      throw new Error('Failed to create transaction: ' + transactionError.message);
    }

    // Create Xendit invoice
    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      throw new Error('Xendit secret key not configured');
    }

    const invoiceData = {
      external_id: transaction,
      amount: amount,
      description: `${plan.name} - ${billingCycle === 'monthly' ? 'Bulanan' : 'Tahunan'}`,
      invoice_duration: 86400, // 24 hours
      customer: {
        given_names: "Customer",
        email: "customer@example.com" // In production, get from user profile
      },
      customer_notification_preference: {
        invoice_created: ["email"],
        invoice_reminder: ["email"],
        invoice_paid: ["email"],
        invoice_expired: ["email"]
      },
      success_redirect_url: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/subscription?payment=success`,
      failure_redirect_url: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/subscription?payment=failed`,
      currency: "IDR",
      items: [
        {
          name: plan.name,
          quantity: 1,
          price: amount,
          category: "Subscription"
        }
      ]
    };

    console.log('Creating Xendit invoice with data:', JSON.stringify(invoiceData, null, 2));

    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(xenditSecretKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData)
    });

    if (!xenditResponse.ok) {
      const errorText = await xenditResponse.text();
      console.error('Xendit API error:', errorText);
      throw new Error(`Xendit API error: ${xenditResponse.status} - ${errorText}`);
    }

    const invoice = await xenditResponse.json();
    console.log('Xendit invoice created:', invoice.id);

    // Update transaction with external ID
    await supabase.rpc('update_transaction_status', {
      p_transaction_id: transaction,
      p_new_status: 'pending',
      p_external_id: invoice.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice_url: invoice.invoice_url,
        invoice_id: invoice.id,
        transaction_id: transaction
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});