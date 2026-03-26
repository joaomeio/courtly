import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeModal from './UpgradeModal';
import { Lock } from 'lucide-react';

/**
 * Wrap any Pro-only page with <ProGate feature="Payments">…</ProGate>
 * Free users see a beautiful locked state + upgrade modal trigger.
 * Pro users see children as normal.
 */
export default function ProGate({ children, feature = 'This feature', description }) {
  const { isPro, isLoading } = useSubscription();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isPro) return children;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="flex items-center justify-center mb-5">
          <Lock size={40} className="text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{feature}</h2>
        <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
          {description || `${feature} is available on the Pro plan. Upgrade to unlock this and every other Pro feature.`}
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25"
        >
          Upgrade to Pro →
        </button>
        <p className="text-xs text-slate-400 mt-3">Cancel anytime</p>
      </div>
      <UpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} feature={feature} />
    </>
  );
}
