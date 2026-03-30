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

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const getUserId = async (customerId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
    return data?.id;
  };

  try {
    switch (event.type) {
      // ===== STRIPE CONNECT EVENTS =====
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const courtlyUserId = account.metadata?.courtly_user_id;
        if (courtlyUserId) {
          const onboardingComplete = account.details_submitted;
          const chargesEnabled = account.charges_enabled;
          const payoutsEnabled = account.payouts_enabled;
          
          await supabase.from('profiles').update({
            stripe_onboarding_complete: onboardingComplete,
            stripe_charges_enabled: chargesEnabled,
            stripe_payouts_enabled: payoutsEnabled,
          }).eq('id', courtlyUserId);
        }
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment') {
          await supabase.from('payments').update({ payment_status: 'failed' }).eq('stripe_checkout_session_id', session.id);
        }
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // In Express Connect, charge refund affects passing
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
        if (paymentIntentId) {
          await supabase.from('payments').update({ payment_status: 'refunded' }).eq('stripe_payment_intent_id', paymentIntentId);
        }
        break;
      }

      // ===== SHARED CHECKOUT EVENT =====
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle Coach Lesson Payments (Peer to peer)
        if (session.mode === 'payment') {
          const paymentIntentId = session.payment_intent as string;
          let stripeFee = 0;
          let coachPayout = 0;
          let stripeChargeId = null;

          if (paymentIntentId) {
            // Retrieve Payment Intent with Expanded Latest Charge + Balance Transaction to calculate exact fees
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ['latest_charge.balance_transaction'],
            });

            if (pi.latest_charge && typeof pi.latest_charge !== 'string') {
                stripeChargeId = pi.latest_charge.id;
                const bt = pi.latest_charge.balance_transaction;
                if (bt && typeof bt !== 'string') {
                    stripeFee = bt.fee; // in cents
                }
            }
          }

          const amountTotal = session.amount_total || 0;
          const applicationFee = session.metadata?.application_fee ? parseInt(session.metadata.application_fee, 10) : amountTotal * 0.025;
          coachPayout = amountTotal - applicationFee - stripeFee;

          await supabase.from('payments').update({
            payment_status: session.payment_status === 'paid' ? 'completed' : 'pending',
            stripe_payment_intent_id: paymentIntentId,
            stripe_charge_id: stripeChargeId,
            stripe_fee: stripeFee,
            coach_payout: coachPayout,
          }).eq('stripe_checkout_session_id', session.id);
          
        } else if (session.mode === 'subscription') {
          // Handle PRO Subscriptions (App revenue)
          const userId = session.metadata?.supabase_user_id 
            || await getUserId(session.customer as string);
          if (userId) {
            await supabase.from('profiles').update({
              plan: 'pro',
              stripe_subscription_id: session.subscription as string,
            }).eq('id', userId);
          }
        }
        break;
      }

      // ===== PRO SUBSCRIPTION EVENTS =====
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object as any;
        const customerId = obj.customer as string;
        const userId = await getUserId(customerId);
        if (userId) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserId(sub.customer as string);
        if (userId) {
          const plan = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free';
          await supabase.from('profiles').update({ plan }).eq('id', userId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
