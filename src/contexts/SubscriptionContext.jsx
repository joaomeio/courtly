import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  isNative,
  configureRevenueCat,
  rcLogOut,
  getCustomerInfo,
  hasProAccess,
  getOfferings,
  presentPaywall as rcPresentPaywall,
  presentPaywallIfNeeded as rcPresentPaywallIfNeeded,
  presentCustomerCenter as rcPresentCustomerCenter,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  isUserCancelledError,
} from '../lib/revenuecat';

const SubscriptionContext = createContext({
  plan: 'free',
  isPro: false,
  onboardingCompleted: true,
  tutorialCompleted: true,
  isLoading: true,
  isNative: false,
  customerInfo: null,
  offerings: null,
  refresh: async () => {},
  signOut: async () => {},
  markTutorialComplete: async () => {},
  presentPaywall: async () => null,
  presentPaywallIfNeeded: async () => null,
  presentCustomerCenter: async () => {},
  purchasePackage: async () => null,
  restorePurchases: async () => null,
});

export function SubscriptionProvider({ children, session }) {
  const [plan, setPlan] = useState('free');
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);

  const userId = session?.user?.id;

  // ── Supabase profile ────────────────────────────────────────────────────────
  // Always used for onboarding_completed state.
  // Also used as the plan source-of-truth on web (non-native) builds.
  const fetchSupabaseProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, onboarding_completed, tutorial_completed')
        .eq('id', userId)
        .single();

      if (error?.code === 'PGRST116') {
        // New user — create profile row
        await supabase.from('profiles').insert({
          id: userId,
          plan: 'free',
          onboarding_completed: false,
          tutorial_completed: false,
        });
        setOnboardingCompleted(false);
        setTutorialCompleted(false);
        if (!isNative) setPlan('free');
      } else if (!error) {
        setOnboardingCompleted(data?.onboarding_completed ?? false);
        setTutorialCompleted(data?.tutorial_completed ?? false);
        if (!isNative) setPlan(data?.plan || 'free');
      }
    } catch (err) {
      console.error('[Sub] Supabase profile error:', err);
    }
  }, [userId]);

  // ── Initialization ──────────────────────────────────────────────────────────
  const init = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (isNative) {
        // Configure RevenueCat and identify the Supabase user
        await configureRevenueCat(userId);
        // Fetch customer info and offerings in parallel
        const [info, offs] = await Promise.all([getCustomerInfo(), getOfferings()]);
        setCustomerInfo(info);
        setOfferings(offs);
        setPlan(hasProAccess(info) ? 'pro' : 'free');
      }
      // Always sync Supabase profile (for onboarding + web fallback plan)
      await fetchSupabaseProfile();
    } catch (err) {
      console.error('[Sub] Init error:', err);
      // Fall back to Supabase plan so the app remains usable
      await fetchSupabaseProfile();
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchSupabaseProfile]);

  useEffect(() => {
    init();
  }, [init]);

  // ── Refresh ─────────────────────────────────────────────────────────────────
  // Re-fetches subscription state after a purchase, restore, or paywall close.
  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      if (isNative) {
        const info = await getCustomerInfo();
        setCustomerInfo(info);
        setPlan(hasProAccess(info) ? 'pro' : 'free');
      } else {
        await fetchSupabaseProfile();
      }
    } catch (err) {
      console.error('[Sub] Refresh error:', err);
    }
  }, [userId, fetchSupabaseProfile]);

  // ── Mark tutorial complete ────────────────────────────────────────────────────
  const markTutorialComplete = useCallback(async () => {
    setTutorialCompleted(true);
    if (!userId) return;
    try {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', userId);
    } catch (err) {
      console.error('[Tutorial] Failed to persist completion:', err);
    }
  }, [userId]);

  // ── Sign out ─────────────────────────────────────────────────────────────────
  // Logs out from both Supabase and RevenueCat.
  const signOut = useCallback(async () => {
    await rcLogOut();
    await supabase.auth.signOut();
  }, []);

  // ── Paywall ──────────────────────────────────────────────────────────────────
  // Always shows the paywall (even if already subscribed).
  // Use this for "Become Pro" CTAs where the user explicitly requested it.
  const presentPaywall = useCallback(async (offering) => {
    if (!isNative) return null;
    try {
      const result = await rcPresentPaywall(offering);
      await refresh();
      return result;
    } catch (err) {
      if (isUserCancelledError(err)) return 'CANCELLED';
      console.error('[RC] presentPaywall error:', err);
      return 'ERROR';
    }
  }, [refresh]);

  // Only shows the paywall when the "Courtly Pro" entitlement is missing.
  // Use this for gating flows where you need subscription before proceeding.
  const presentPaywallIfNeeded = useCallback(async (offering) => {
    if (!isNative) return null;
    try {
      const result = await rcPresentPaywallIfNeeded(offering);
      await refresh();
      return result;
    } catch (err) {
      if (isUserCancelledError(err)) return 'CANCELLED';
      console.error('[RC] presentPaywallIfNeeded error:', err);
      return 'ERROR';
    }
  }, [refresh]);

  // ── Customer Center ──────────────────────────────────────────────────────────
  // Self-service subscription management: cancel, restore, refunds, plan changes.
  const presentCustomerCenter = useCallback(async () => {
    if (!isNative) return;
    try {
      await rcPresentCustomerCenter();
      await refresh(); // entitlement may have changed (e.g. after cancellation)
    } catch (err) {
      console.error('[RC] presentCustomerCenter error:', err);
    }
  }, [refresh]);

  // ── Direct purchase ──────────────────────────────────────────────────────────
  // For custom purchase UIs that bypass the RevenueCat paywall UI.
  const purchasePackage = useCallback(async (pkg) => {
    try {
      const info = await rcPurchasePackage(pkg);
      setCustomerInfo(info);
      setPlan(hasProAccess(info) ? 'pro' : 'free');
      return info;
    } catch (err) {
      if (isUserCancelledError(err)) return null;
      throw err;
    }
  }, []);

  // ── Restore purchases ────────────────────────────────────────────────────────
  const restorePurchases = useCallback(async () => {
    const info = await rcRestorePurchases();
    setCustomerInfo(info);
    setPlan(hasProAccess(info) ? 'pro' : 'free');
    return info;
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      plan,
      isPro: plan === 'pro',
      onboardingCompleted,
      tutorialCompleted,
      isLoading,
      isNative,
      customerInfo,
      offerings,
      refresh,
      signOut,
      markTutorialComplete,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
      purchasePackage,
      restorePurchases,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
