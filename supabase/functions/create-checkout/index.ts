// @ts-nocheck
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // We try to grab the user, but for unauthenticated students paying a coach, we might not require auth.
    // The prompt says POST: body: { coach_id, amount ... student_email }. So we allow unauthenticated.
    let userId = null;
    let userEmail = null;
    
    if (token) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        userEmail = user.email;
      }
    }

    const {
      priceId,          // Used for Pro Subscriptions
      successUrl,
      cancelUrl,
      // Used for Coach Payouts
      coach_id,
      amount,           // in dollars
      currency = 'usd',
      description,
      lesson_id,
      student_email,
      student_id,       // optional if logged in
    } = await req.json();

    const origin = req.headers.get('origin') || Deno.env.get('APP_URL') || '';
    const finalSuccessUrl = successUrl || `${origin}/settings?checkout=success`;
    const finalCancelUrl = cancelUrl || `${origin}/settings`;

    // 1) HANDLE COACH PAYOUT (PEER TO PEER)
    if (coach_id && amount) {
      // Validate coach has Stripe connected
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_charges_enabled')
        .eq('id', coach_id)
        .single();
        
      if (!profile?.stripe_account_id || !profile?.stripe_charges_enabled) {
        throw new Error('Coach has not connected to Stripe or is not ready to receive payments.');
      }

      const amountTotal = Math.round(parseFloat(amount) * 100); // cents
      const applicationFee = Math.round(amountTotal * 0.025); // Courtly 2.5% fee
      
      const sessionData = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || 'Tennis Lesson',
            },
            unit_amount: amountTotal,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: profile.stripe_account_id,
          },
          metadata: {
            coach_id,
            lesson_id: lesson_id || '',
            student_email: student_email || userEmail || '',
            student_id: student_id || userId || '',
            amount_total: amountTotal.toString(),
            application_fee: applicationFee.toString(),
          }
        },
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        customer_email: student_email || userEmail || undefined,
        metadata: {
          coach_id,
          lesson_id: lesson_id || '',
          student_email: student_email || userEmail || '',
          student_id: student_id || userId || '',
          amount_total: amountTotal.toString(),
          application_fee: applicationFee.toString(),
        }
      };

      const session = await stripe.checkout.sessions.create(sessionData);

      // Insert pending payment record
      await supabase.from('payments').insert({
        coach_id,
        student_id: student_id || userId || null,
        lesson_id: lesson_id || null,
        stripe_checkout_session_id: session.id,
        amount: amount,
        amount_total: amountTotal,
        currency: currency.toLowerCase(),
        application_fee: applicationFee,
        method: 'Stripe',
        payment_status: 'pending',
        description: description || 'Stripe Checkout',
      });

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) HANDLE PRO SUBSCRIPTION (ORIGINAL LOGIC)
    if (priceId && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { supabase_user_id: userId },
        });
        customerId = customer.id;
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata: { supabase_user_id: userId },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid checkout configuration. Provide coach_id & amount OR priceId.');
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
