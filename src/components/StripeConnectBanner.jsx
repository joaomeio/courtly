import React from 'react';
import { useStripeConnect } from '../lib/useStripeConnect';
import { AlertCircle, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';

export default function StripeConnectBanner({ session }) {
  const { isLoading, stripeAccountId, onboardingComplete, chargesEnabled, startOnboarding } = useStripeConnect(session);

  if (isLoading) return null;

  // Fully connected and ready to receive payouts
  if (stripeAccountId && onboardingComplete && chargesEnabled) {
    return null; 
  }

  // Connected but missed some onboarding steps (requires revision)
  if (stripeAccountId && (!onboardingComplete || !chargesEnabled)) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex gap-4">
          <div className="size-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold text-base m-0 leading-tight">Complete your payment setup</h3>
            <p className="text-amber-700 text-sm mt-1 mb-0 leading-snug">
              You're almost there! We need a bit more info to verify your identity and enable payouts.
            </p>
          </div>
        </div>
        <button
          onClick={startOnboarding}
          className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          Resume Setup <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // Not connected at all
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 bg-primary/10 size-48 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex gap-4 relative z-10">
        <div className="size-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <DollarSign size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-slate-900 font-bold text-lg m-0 leading-tight tracking-tight">Start accepting payments</h3>
          <p className="text-slate-600 text-sm mt-1 mb-0 max-w-md leading-relaxed">
            Connect your bank account with Stripe to receive payments directly from your students securely.
          </p>
        </div>
      </div>
      <button
        onClick={startOnboarding}
        className="shrink-0 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center relative z-10"
      >
        Connect Stripe
      </button>
    </div>
  );
}
