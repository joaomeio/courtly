// @ts-nocheck
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id 
          || await getUserId(session.customer as string);
        if (userId) {
          await supabase.from('profiles').update({
            plan: 'pro',
            stripe_subscription_id: session.subscription as string,
          }).eq('id', userId);
        }
        break;
      }
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
