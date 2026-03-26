import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { User, Palette, ChevronRight, CreditCard, HelpCircle, LogOut, Bell, Calendar, Check, Save, Zap, Star, Loader } from 'lucide-react';
import UpgradeModal from '../components/UpgradeModal';

export default function Settings() {
  const { session } = useOutletContext();
  const { themeId, setThemeId, themes } = useTheme();
  const { plan, isPro } = useSubscription();
  const [searchParams] = useSearchParams();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Detect ?checkout=success
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setCheckoutSuccess(true);
      setTimeout(() => setCheckoutSuccess(false), 6000);
    }
  }, [searchParams]);
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Notification State (Mock)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  useEffect(() => {
    if (session?.user?.user_metadata) {
      setFullName(session.user.user_metadata.full_name || '');
      setPhone(session.user.user_metadata.phone || '');
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccess(false);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone: phone }
    });
    setSavingProfile(false);
    if (!error) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession?.access_token}`,
          },
        }
      );
      const { url, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);
      window.location.href = url;
    } catch (err) {
      alert('Could not open billing portal: ' + err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  const userInitial = fullName ? fullName.charAt(0).toUpperCase() : (session?.user?.email?.charAt(0).toUpperCase() || 'C');
  const displayEmail = session?.user?.email || '';

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24 text-slate-700">
        <div className="max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>
              <p className="text-slate-500 mt-1 text-sm">Manage your account preferences</p>
            </div>
          </header>

          {/* Profile Quick Info */}
          <section className="bg-white rounded-xl p-5 border border-primary/10 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
              {userInitial}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-lg font-semibold text-slate-800 truncate">{fullName || displayEmail}</h2>
              <p className="text-sm text-slate-500 truncate">Head Coach</p>
            </div>
          </section>

          {/* Profile Edit Module */}
           <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary/5 bg-slate-50 flex items-center gap-3">
              <User size={18} className="text-primary" />
              <h3 className="font-semibold text-slate-800">Profile Details</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={displayEmail}
                  disabled
                  className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-slate-500"
                />
              </div>
              <button 
                onClick={saveProfile}
                disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {savingProfile ? 'Saving...' : (profileSuccess ? <><Check size={18} /> Saved!</> : 'Save Profile')}
              </button>
            </div>
          </div>

          {/* Appearance Module */}
          <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary/5 bg-slate-50 flex items-center gap-3">
              <Palette size={18} className="text-primary" />
              <h3 className="font-semibold text-slate-800">Appearance</h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-3">Accent Color</p>
              <div className="grid grid-cols-3 gap-3">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      themeId === t.id 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full mb-2 shadow-sm" style={{ backgroundColor: t.color }} />
                    <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications Module */}
          <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-primary/5 bg-slate-50 flex items-center gap-3">
              <Bell size={18} className="text-primary" />
              <h3 className="font-semibold text-slate-800">Notifications</h3>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between p-3 border-b border-slate-50">
                <div>
                  <p className="font-medium text-slate-700 text-sm">Email Reminders</p>
                  <p className="text-xs text-slate-500">Receive schedule updates via email</p>
                </div>
                <button 
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailAlerts ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-slate-700 text-sm">SMS Alerts</p>
                  <p className="text-xs text-slate-500">Get text messages for late changes</p>
                </div>
                <button 
                  onClick={() => setSmsAlerts(!smsAlerts)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsAlerts ? 'bg-primary' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Others */}
          <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group text-left">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100 group-hover:border-primary/20">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="block font-medium text-slate-700 text-sm">Calendar Sync</span>
                  <span className="text-xs text-slate-500">Connect Google Calendar</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </button>
             <button className="w-full flex items-center justify-between p-4 border-t border-slate-50 hover:bg-slate-50 transition-colors group text-left">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100 group-hover:border-primary/20">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="block font-medium text-slate-700 text-sm">Subscription</span>
                  <span className="text-xs text-primary font-semibold">Pro Plan Active</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 border-t border-slate-50 hover:bg-slate-50 transition-colors group text-left">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-slate-100 group-hover:border-primary/20">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <span className="block font-medium text-slate-700 text-sm">Help & Support</span>
                  <span className="text-xs text-slate-500">Guides and FAQ</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </button>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all rounded-xl border border-primary/10 hover:border-red-200 font-medium "
            >
              <LogOut size={20} className="mr-2" />
              <span>Sign Out</span>
            </button>
            <p className="text-center text-slate-400 text-xs mt-6 font-semibold">Courtly Version 1.1.0</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Account Management</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Settings & Preferences</h1>
            </div>
            
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-sm font-bold transition-colors cursor-pointer border border-slate-200 hover:border-red-200 shadow-sm"
            >
              <LogOut size={16} strokeWidth={2.5} />
              Sign Out
            </button>
          </div>

          <div className="grid grid-cols-[320px_1fr] gap-8 items-start">
            
            {/* Left Column - Navigation / Quick Info */}
            <div className="space-y-6 sticky top-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center relative overflow-hidden text-center shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-28 bg-primary/10"></div>
                
                <div className="relative z-10 mb-4 mt-6">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm inline-block">
                    <div className="bg-primary/10 flex items-center justify-center rounded-full h-24 w-24 text-4xl font-bold text-primary">
                      {userInitial}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold mt-2 text-slate-900 break-all">{fullName || displayEmail}</h2>
                <div className="mt-3 text-primary text-[11px] font-bold uppercase tracking-widest px-3 py-1 bg-primary/10 rounded-full">
                  Head Coach
                </div>
                
                <p className="text-slate-500 mt-4 text-sm px-4">
                  Manage your personal information, app appearance, and notification preferences.
                </p>
              </div>

              {/* Billing Card */}
              <div className={`rounded-2xl border p-6 flex flex-col items-center text-center ${isPro ? 'bg-primary/5 border-primary/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                  {isPro ? <Star size={20} className="text-primary" /> : <CreditCard size={20} className="text-amber-500" />}
                </div>
                <h3 className="font-bold text-slate-800">{isPro ? 'Pro Plan Active' : 'Free Plan'}</h3>
                <p className="text-[13px] text-slate-600 mt-1 mb-4">
                  {isPro ? 'All features unlocked. Manage your subscription below.' : 'Upgrade to unlock unlimited students, full drills, and analytics.'}
                </p>
                {isPro ? (
                  <button onClick={handleManageBilling} disabled={portalLoading}
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 disabled:opacity-60">
                    {portalLoading ? <Loader size={14} className="animate-spin" /> : null}
                    Manage Billing
                  </button>
                ) : (
                  <button onClick={() => setUpgradeOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl transition-all hover:bg-primary/90">
                    <Zap size={14} /> Upgrade to Pro
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Settings Content */}
             <div className="flex flex-col gap-6 pb-20">
              
              {/* Profile Details */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <User size={20} className="text-primary" />
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">Personal Information</h3>
                </div>
                
                <div className="p-6">
                   <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-slate-800"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={displayEmail}
                      disabled
                      className="w-full px-4 py-2.5 border border-slate-100 bg-slate-50 rounded-xl text-slate-500"
                    />
                    <p className="text-[13px] text-slate-500 mt-2">Email changes require re-verification for security purposes.</p>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button 
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-6 py-2.5 mt-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 shadow-sm"
                    >
                      {savingProfile ? 'Saving...' : (profileSuccess ? <><Check size={18} strokeWidth={3} /> Saved</> : <><Save size={18} strokeWidth={2.5} /> Save Changes</>)}
                    </button>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <Palette size={20} className="text-primary" />
                  <h3 className="text-lg font-bold tracking-tight text-slate-900">App Appearance</h3>
                </div>
                
                <div className="p-6">
                  <p className="text-sm font-semibold text-slate-700 mb-4">Choose Accent Color</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group ${
                          themeId === t.id 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                         <div className={`w-10 h-10 rounded-full mb-3 shadow-inner flex items-center justify-center text-white ${themeId === t.id ? 'scale-110' : 'scale-100'} transition-transform`} style={{ backgroundColor: t.color }}>
                            {themeId === t.id && <Check size={18} strokeWidth={3} />}
                         </div>
                        <span className="text-[12px] font-bold text-slate-700 text-center leading-tight">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
               {/* Notifications & Integrations */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Notifications */}
                 <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                      <Bell size={20} className="text-primary" />
                      <h3 className="text-[16px] font-bold text-slate-900">Notifications</h3>
                    </div>
                    <div className="p-2 py-4">
                       <label className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group mx-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Email Reminders</p>
                          <p className="text-[13px] text-slate-500 mt-0.5">Automated emails for upcoming lessons</p>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailAlerts ? 'bg-primary' : 'bg-slate-200'}`}>
                          <input type="checkbox" className="sr-only" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group mx-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">SMS Alerts</p>
                          <p className="text-[13px] text-slate-500 mt-0.5">Text messages for cancellations</p>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsAlerts ? 'bg-primary' : 'bg-slate-200'}`}>
                          <input type="checkbox" className="sr-only" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </label>
                    </div>
                 </div>

                 {/* Integrations */}
                 <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                      <Calendar size={20} className="text-primary" />
                      <h3 className="text-[16px] font-bold text-slate-900">Integrations</h3>
                    </div>
                    <div className="p-6">
                       <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                             {/* Simple generic calendar icon to substitute real Google icon since we are using lucide */}
                             <Calendar size={18} />
                           </div>
                           <div>
                             <p className="font-bold text-slate-800 text-sm">Google Calendar</p>
                             <p className="text-[12px] text-slate-500 mt-0.5">Not connected</p>
                           </div>
                         </div>
                         <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                           Connect
                         </button>
                       </div>
                    </div>
                 </div>
                 
               </div>

              <div className="flex justify-center pt-6 pb-12">
                <p className="text-slate-400 text-[13px] font-semibold">Courtly Version 1.1.0</p>
              </div>

            </div>
          </div>
        </div>
      </div>
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="Courtly Pro" />
      {/* Checkout success toast */}
      {checkoutSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2">
          <Check size={18} strokeWidth={3} /> You're now on Pro! All features unlocked.
        </div>
      )}
    </>
  );
}
