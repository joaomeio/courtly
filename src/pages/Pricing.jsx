import React, { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../supabaseClient';
import { Check, Zap, Star, LayoutGrid, Users, ClipboardList, TrendingUp, CalendarDays, Loader, ArrowLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MONTHLY_PRICE_ID = 'price_1TF0pKCnYp1Fi3zgd9iK8AwL';
const ANNUAL_PRICE_ID = 'price_1TF2j3CnYp1Fi3zgrT7zovaI';

export default function Pricing() {
  const { isPro, plan, isNative, presentPaywall, presentCustomerCenter } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('annual'); // 'annual' or 'monthly'
  const navigate = useNavigate();

  // On native: present the appropriate RevenueCat UI immediately and go back.
  // The web pricing page is only rendered for browser/web builds.
  useEffect(() => {
    if (!isNative) return;
    (async () => {
      if (isPro) {
        await presentCustomerCenter();
      } else {
        await presentPaywall();
      }
      navigate(-1);
    })();
  }, [isNative]); // eslint-disable-line react-hooks/exhaustive-deps

  // While the native paywall is opening, show a minimal loader so there's
  // no flash of the web pricing UI underneath.
  if (isNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const features = [
    { title: "Up to 5 Students", basic: true, pro: true },
    { title: "25 Preset Drills", basic: true, pro: true },
    { title: "Basic Calendar view", basic: true, pro: true },
    { title: "Unlimited Students & Contacts", basic: false, pro: true },
    { title: "Full 250+ Drill Library & Custom", basic: false, pro: true },
    { title: "Recurring Lessons & Waitlist", basic: false, pro: true },
    { title: "Court & Group Management", basic: false, pro: true },
    { title: "Payment & Income Tracking", basic: false, pro: true },
  ];

  const handleCheckoutOrPortal = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const endpoint = isPro ? 'create-portal' : 'create-checkout';
      const selectedPriceId = billingCycle === 'annual' ? ANNUAL_PRICE_ID : MONTHLY_PRICE_ID;
      
      const sessionPayload = {
        priceId: selectedPriceId,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl: `${window.location.origin}/offer`
      };

      const body = isPro ? undefined : JSON.stringify(sessionPayload);

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
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT - Skeleton Matched Version
      ═══════════════════════════════════════════════════ */}
      <div className="md:hidden pt-8 px-6 flex flex-col min-h-screen">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm shrink-0">
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex bg-white shadow-[0_4px_10px_rgba(0,0,0,0.03)] p-1 rounded-full items-center border border-slate-100 flex-1 mx-4 max-w-[200px]">
            <button 
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${billingCycle === 'annual' ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Annual
            </button>
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white border border-slate-200 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Monthly
            </button>
          </div>
          
          <div className="w-10 h-10 shrink-0"></div>
        </div>

        {/* Title & Dots */}
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-4xl text-slate-900 font-extrabold tracking-tight">Pricing</h1>
          <div className="flex gap-1.5 mb-2.5">
            <div className={`w-3.5 h-[5px] rounded-full transition-all ${!isPro ? 'bg-primary' : 'bg-slate-300'}`}></div>
            <div className={`w-3.5 h-[5px] rounded-full transition-all ${isPro ? 'bg-primary' : 'bg-slate-300'}`}></div>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-6 px-6 hide-scrollbar flex-1 items-stretch">
          
          {/* Basic Card */}
          <div className="w-[85vw] snap-center shrink-0 bg-white rounded-[2rem] p-7 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col h-full self-stretch">
            <h3 className="text-[22px] font-bold text-slate-800 mb-4">Basic</h3>
            <div className="flex items-start gap-3 mb-6">
              <span className="text-[56px] font-black text-slate-900 tracking-tight leading-none">$0</span>
              <p className="text-[10px] text-slate-500 font-semibold leading-[1.3] w-[100px] pt-1.5 uppercase tracking-wide">
                Per month, free forever
              </p>
            </div>

            <Link to="/" className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-[15px] transition-all mb-8 ${!isPro ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
              {!isPro ? 'Current Plan' : 'Downgrade'}
            </Link>

            <p className="text-xs font-bold text-slate-800 mb-5">Includes:</p>
            <ul className="space-y-4 mb-auto">
              {features.map((f, i) => (
                <li key={i} className={`flex items-start gap-4 text-[13px] font-semibold ${f.basic ? 'text-slate-700' : 'text-slate-400'}`}>
                  <div className={`w-[18px] h-[18px] mt-0.5 rounded-full flex items-center justify-center shrink-0 ${f.basic ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-slate-100 border border-slate-200 text-slate-300'}`}>
                    {f.basic ? <Check size={11} strokeWidth={4} /> : <X size={10} strokeWidth={3} />}
                  </div>
                  <span className="leading-snug pt-[1px]">{f.title}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Card */}
          <div className="w-[85vw] snap-center shrink-0 bg-white rounded-[2rem] p-1 border border-primary/20 shadow-2xl shadow-primary/10 relative h-full flex flex-col self-stretch">
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 to-transparent rounded-t-[2rem] pointer-events-none"></div>
            
            <div className="text-center pt-3 pb-2 bg-white/60 backdrop-blur-md rounded-t-[1.75rem] z-10 border-b border-primary/10 mx-[2px] mt-[2px]">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">Most Popular</span>
            </div>

            <div className="p-6 flex-1 flex flex-col z-10">
              <h3 className="text-[22px] font-bold text-slate-800 mb-4">Courtly Pro</h3>
              <div className="flex items-start gap-3 mb-6">
                <span className="text-[56px] font-black text-slate-900 tracking-tight leading-none">
                  ${billingCycle === 'annual' ? '19' : '29'}
                </span>
                <p className="text-[10px] text-slate-500 font-semibold leading-[1.3] w-[110px] pt-1 uppercase tracking-wide">
                  Per month
                  <span className="block italic text-[9px] mt-0.5 lowercase text-slate-400">
                    {billingCycle === 'annual' ? '(billed $228 yearly)' : '(billed monthly)'}
                  </span>
                </p>
              </div>

              <button 
                onClick={handleCheckoutOrPortal}
                disabled={loading}
                className="w-full py-4 rounded-xl flex items-center justify-center font-bold text-[15px] transition-all mb-8 bg-gradient-to-b from-primary to-[#579915] text-white shadow-[0_8px_20px_rgba(102,179,25,0.35)]"
              >
                {loading ? <Loader className="animate-spin w-5 h-5" /> : (isPro ? 'Manage Billing' : 'Get Started')}
              </button>

              <p className="text-xs font-bold text-slate-800 mb-5">Includes:</p>
              <ul className="space-y-4 mb-auto">
                {features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-4 text-[13px] font-semibold text-slate-700`}>
                    <div className="w-[18px] h-[18px] mt-0.5 rounded-full flex items-center justify-center shrink-0 bg-primary text-white shadow-sm shadow-primary/30">
                      <Check size={11} strokeWidth={4} />
                    </div>
                    <span className="leading-snug pt-[1px]">{f.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT - Unchanged Original
      ═══════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 pt-12">
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
          
          {/* Free Plan Desktop */}
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

          {/* Pro Plan Desktop */}
          <div className={`bg-slate-900 rounded-3xl p-8 border relative overflow-hidden ${isPro ? 'border-primary shadow-2xl shadow-primary/20 ring-4 ring-primary/20' : 'border-slate-800 shadow-xl'}`}>
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1">
                <Star size={12} fill="currentColor" /> Most Popular
              </span>
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Courtly Pro</h3>
            <p className="text-slate-400 text-sm mb-6">Everything you need to grow your tennis coaching business.</p>
            
            <div className="flex bg-slate-800 p-1 rounded-full items-center mb-6 w-fit border border-slate-700">
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${billingCycle === 'annual' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Annually
              </button>
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-white">${billingCycle === 'annual' ? '19' : '29'}</span>
                <span className="text-slate-400 font-medium mb-1">/ month</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 italic">
                 {billingCycle === 'annual' ? 'Billed annually at $228' : 'Billed monthly ($29)'}
              </p>
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

        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Secure payments via Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
