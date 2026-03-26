import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Zap, Lock, Check, Loader } from 'lucide-react';

const PRO_PRICE_ID = 'price_1TF0pKCnYp1Fi3zgd9iK8AwL';

export default function UpgradeModal({ isOpen, onClose, feature = 'This feature' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ priceId: PRO_PRICE_ID }),
        }
      );
      const { url, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
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
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Lock size={22} className="text-primary" />
          </div>
          <h2 className="text-white text-xl font-bold">Upgrade to Pro</h2>
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

          <div className="text-center mb-4">
            <span className="text-3xl font-black text-slate-900">$29</span>
            <span className="text-slate-500 text-sm">/month</span>
            <p className="text-xs text-slate-400 mt-1">Cancel anytime · 14-day free trial</p>
          </div>

          {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-60"
          >
            {loading ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
            {loading ? 'Redirecting…' : 'Upgrade to Pro →'}
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
