import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ShieldCheck, Zap, ArrowRight, Loader } from 'lucide-react';

const DOWNSELL_PRICE_ID = 'price_1TF2suCnYp1Fi3zgJlkyXjhQ';

export default function Offer() {
  const { isPro } = useSubscription();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const sessionPayload = {
        priceId: DOWNSELL_PRICE_ID,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing` // Send to pricing if they cancel the downsell
      };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(sessionPayload)
        }
      );
      const { url, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);
      window.location.href = url;
    } catch (err) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // If they somehow land here while already pro, boot them to dashboard
  if (isPro) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-display flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background flourishes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-200 z-10 text-center relative overflow-hidden">
        
        {/* Urgent header badge */}
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-amber-200 shadow-sm">
          <Zap size={14} fill="currentColor" /> Wait! Don't leave yet
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Claim Your <span className="text-primary">20% Discount</span>
        </h1>
        
        <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
          We noticed you didn't finish your upgrade. We want to help you scale your coaching business today, so we're offering you <strong>20% off your first year</strong> of Pro.
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Courtly Pro Annual</span>
            <div className="text-right">
              <span className="text-slate-400 line-through text-xs mr-2">$228</span>
              <span className="text-xl font-black text-slate-900">$182</span>
            </div>
          </div>
          
          <ul className="space-y-3">
            {[
              "Unlimited Students & Roster Management",
              "Access to 250+ Premium Drills",
              "Recurring Lessons & Waitlists",
              "Detailed Income & Stripe Analytics"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] transition-all bg-gradient-to-b from-primary to-[#579915] text-white shadow-[0_8px_20px_rgba(102,179,25,0.35)] hover:scale-[1.02]"
          >
            {loading ? <Loader className="animate-spin w-5 h-5" /> : (
              <>Claim 20% Off Now <ArrowRight size={18} /></>
            )}
          </button>
          
          <Link 
            to="/"
            className="w-full py-3 rounded-xl flex items-center justify-center font-bold text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            No thanks, I don't want to grow my business
          </Link>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-slate-400 text-xs font-semibold">
        <ShieldCheck size={14} /> Secure transaction powered by Stripe
      </div>
    </div>
  );
}
