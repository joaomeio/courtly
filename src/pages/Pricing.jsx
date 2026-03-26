import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../supabaseClient';
import { Check, Zap, Star, LayoutGrid, Users, ClipboardList, TrendingUp, CalendarDays, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const PRO_PRICE_ID = 'price_1TF0pKCnYp1Fi3zgd9iK8AwL';

export default function Pricing() {
  const { isPro, plan } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleCheckoutOrPortal = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const endpoint = isPro ? 'create-portal' : 'create-checkout';
      const body = isPro ? undefined : JSON.stringify({ priceId: PRO_PRICE_ID });

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body
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

  return (
    <div className="min-h-screen bg-slate-50 font-display pb-24 lg:pb-8">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-6 shadow-sm">
            <Zap size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl text-slate-900 font-extrabold tracking-tight mb-4">Choose Your Plan</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Upgrade your coaching business with unlimited students, advanced analytics, and recurring scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-start">
          
          {/* Free Plan */}
          <div className={`bg-white rounded-3xl p-8 border ${!isPro ? 'border-primary shadow-xl shadow-primary/10' : 'border-slate-200 shadow-sm'}`}>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
            <p className="text-slate-500 text-sm mb-6">Perfect for getting started and trying out the platform.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900">$0</span>
              <span className="text-slate-500 font-medium">/ forever</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-600" strokeWidth={3} />
                </div>
                Up to 5 Students
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-600" strokeWidth={3} />
                </div>
                25 Preset Drills
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-600" strokeWidth={3} />
                </div>
                Basic Calendar view
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-600" strokeWidth={3} />
                </div>
                Single session booking
              </li>
            </ul>

            <Link to="/" className={`w-full py-4 rounded-xl flex items-center justify-center font-bold transition-all ${!isPro ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {!isPro ? 'Current Plan' : 'Downgrade to Basic'}
            </Link>
          </div>

          {/* Pro Plan */}
          <div className={`bg-slate-900 rounded-3xl p-8 border relative overflow-hidden ${isPro ? 'border-primary shadow-2xl shadow-primary/20 ring-4 ring-primary/20' : 'border-slate-800 shadow-xl'}`}>
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1">
                <Star size={12} fill="currentColor" /> Most Popular
              </span>
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Courtly Pro</h3>
            <p className="text-slate-400 text-sm mb-6">Everything you need to grow your tennis coaching business.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">$29</span>
              <span className="text-slate-400 font-medium">/ month</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              {[
                { label: 'Unlimited Students & Contacts', icon: Users },
                { label: 'Full 250+ Drill Library & Custom Drills', icon: ClipboardList },
                { label: 'Recurring Lessons & Waitlist', icon: CalendarDays },
                { label: 'Court & Group Management', icon: LayoutGrid },
                { label: 'Payment & Income Tracking', icon: TrendingUp },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check size={14} className="text-primary font-bold" strokeWidth={3} />
                  </div>
                  {f.label}
                </li>
              ))}
            </ul>

            <button 
              onClick={handleCheckoutOrPortal}
              disabled={loading}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${isPro ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-primary text-white hover:bg-primary/90 hover:-translate-y-1 shadow-lg shadow-primary/20'}`}
            >
              {loading ? <Loader className="animate-spin w-5 h-5" /> : (isPro ? 'Manage Billing' : 'Upgrade to Pro')}
            </button>
          </div>
        </div>

        {/* FAQ or Assurance below */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Secure payments via Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
