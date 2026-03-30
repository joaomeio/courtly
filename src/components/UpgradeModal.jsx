import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Zap, Lock, Check, Loader } from 'lucide-react';

// Web-only Stripe price ID (used when isNative is false)
const WEB_PRICE_ID = 'price_1TF0pKCnYp1Fi3zgd9iK8AwL';

export default function UpgradeModal({ isOpen, onClose, feature = 'This feature' }) {
  const { isNative, presentPaywall } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      if (isNative) {
        // On native: delegate entirely to the RevenueCat native paywall UI.
        // The paywall handles plan selection, pricing display, and purchase flow.
        await presentPaywall();
        onClose();
      } else {
        // On web: fall back to the Stripe checkout flow.
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ priceId: WEB_PRICE_ID }),
          }
        );
        const { url, error: fnError } = await res.json();
        if (fnError) throw new Error(fnError);
        window.location.href = url;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-slate-400" />
          </div>
          <h2 className="text-white text-2xl font-bold">Upgrade to Pro</h2>
          <p className="text-slate-400 text-sm mt-1">
            {feature} is a Pro feature.
          </p>
        </div>

        {/* Features */}
        <div className="p-6">
          <ul className="space-y-3 mb-6">
            {[
              'Unlimited students',
              '250+ drills + custom drills',
              'Recurring lessons',
              'Payment tracking',
              'Court management',
              'Analytics & reports',
              'Training programs',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-primary font-bold" strokeWidth={3} />
                </div>
                {f}
              </li>
            ))}
          </ul>

          {/* Only show static pricing on web — native gets it from RC paywall */}
          {!isNative && (
            <div className="text-center mb-4">
              <span className="text-3xl font-black text-slate-900">$29</span>
              <span className="text-slate-500 text-sm">/month</span>
              <p className="text-xs text-slate-400 mt-1">Cancel anytime</p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
            {loading ? 'Loading…' : 'Upgrade to Pro →'}
          </button>

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
