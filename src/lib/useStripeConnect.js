import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useStripeConnect(session) {
  const [stripeStatus, setStripeStatus] = useState({
    isLoading: true,
    stripeAccountId: null,
    onboardingComplete: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    isConnected: false,
  });

  const fetchStripeStatus = async () => {
    if (!session?.user?.id) return;
    try {
      setStripeStatus((s) => ({ ...s, isLoading: true }));
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setStripeStatus({
        isLoading: false,
        stripeAccountId: data.stripe_account_id,
        onboardingComplete: data.stripe_onboarding_complete || false,
        chargesEnabled: data.stripe_charges_enabled || false,
        payoutsEnabled: data.stripe_payouts_enabled || false,
        isConnected: !!data.stripe_account_id && data.stripe_onboarding_complete,
      });
    } catch (err) {
      console.error('Error fetching Stripe status:', err);
      setStripeStatus((s) => ({ ...s, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchStripeStatus();
  }, [session?.user?.id]);

  const startOnboarding = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect-onboard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`,
        },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start onboarding');
      }
    } catch (err) {
      console.error(err);
      alert('Could not start Stripe onboarding. Please try again.');
    }
  };

  const createCheckout = async ({ coachId, amount, description, lessonId, studentEmail, studentId }) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          coach_id: coachId,
          amount,
          description,
          lesson_id: lessonId,
          student_email: studentEmail,
          student_id: studentId,
          successUrl: `${window.location.origin}/settings/payments?checkout=success`,
          cancelUrl: `${window.location.origin}/settings/payments?checkout=cancel`,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize checkout');
      }
    } catch (err) {
      console.error(err);
      alert('Checkout failed. Please try again later.');
    }
  };

  return {
    ...stripeStatus,
    startOnboarding,
    createCheckout,
    refresh: fetchStripeStatus,
  };
}
