import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const SubscriptionContext = createContext({
  plan: 'free',
  isPro: false,
  onboardingCompleted: true, // Default to true to prevent flicker
  isLoading: true,
  refresh: () => {},
});

export function SubscriptionProvider({ children, session }) {
  const [plan, setPlan] = useState('free');
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    if (!session?.user) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, onboarding_completed')
        .eq('id', session.user.id)
        .single();

      // If the profile row doesn't exist yet (new user), create it
      if (error?.code === 'PGRST116') {
        await supabase.from('profiles').insert({
          id: session.user.id,
          plan: 'free',
          onboarding_completed: false
        });
        setPlan('free');
        setOnboardingCompleted(false);
      } else {
        setPlan(data?.plan || 'free');
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      }
    } catch {
      setPlan('free');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [session?.user?.id]);

  return (
    <SubscriptionContext.Provider value={{ 
      plan, 
      isPro: plan === 'pro', 
      onboardingCompleted, 
      isLoading, 
      refresh: fetchProfile 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
