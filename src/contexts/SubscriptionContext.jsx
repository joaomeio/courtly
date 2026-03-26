import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const SubscriptionContext = createContext({
  plan: 'free',
  isPro: false,
  isLoading: true,
  refresh: () => {},
});

export function SubscriptionProvider({ children, session }) {
  const [plan, setPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = async () => {
    if (!session?.user) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      // If the profile row doesn't exist yet (new user), create it
      if (error?.code === 'PGRST116') {
        await supabase.from('profiles').insert({
          id: session.user.id,
          plan: 'free',
        });
        setPlan('free');
      } else {
        setPlan(data?.plan || 'free');
      }
    } catch {
      setPlan('free');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, [session?.user?.id]);

  return (
    <SubscriptionContext.Provider value={{ plan, isPro: plan === 'pro', isLoading, refresh: fetchPlan }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
