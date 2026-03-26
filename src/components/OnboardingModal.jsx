import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Check, ArrowRight, ArrowLeft, Trophy, Users, Target, Rocket, Loader } from 'lucide-react';

const STEPS = [
  {
    id: 'experience',
    title: 'Your Experience',
    description: 'How long have you been coaching tennis?',
    icon: <Trophy className="text-amber-500" size={32} />,
    options: [
      { label: 'New Coach', value: '0-2 years', sub: 'Just starting out' },
      { label: 'Experienced', value: '2-5 years', sub: 'Established practice' },
      { label: 'Veteran', value: '5+ years', sub: 'Master professional' }
    ]
  },
  {
    id: 'roster',
    title: 'Student Roster',
    description: 'How many students do you currently manage?',
    icon: <Users className="text-primary" size={32} />,
    options: [
      { label: 'Small', value: '0-5 students', sub: 'Focused attention' },
      { label: 'Moderate', value: '5-20 students', sub: 'Growing business' },
      { label: 'Large', value: '20+ students', sub: 'Full-scale academy' }
    ]
  },
  {
    id: 'ages',
    title: 'Target Audience',
    description: 'Who do you primarily coach?',
    icon: <Target className="text-rose-500" size={32} />,
    options: [
      { label: 'Juniors', value: 'Juniors', sub: 'Under 18 players' },
      { label: 'Adults', value: 'Adults', sub: 'Recreational & League' },
      { label: 'Both', value: 'Mixed', sub: 'Diverse program' }
    ]
  },
  {
    id: 'goals',
    title: 'Primary Goal',
    description: 'What is your main focus with Courtly?',
    icon: <Rocket className="text-sky-500" size={32} />,
    options: [
      { label: 'Organization', value: 'Organization', sub: 'Cleaning up the schedule' },
      { label: 'Payments', value: 'Payments', sub: 'Tracking income better' },
      { label: 'Growth', value: 'Growth', sub: 'Scaling my business' }
    ]
  }
];

export default function OnboardingModal() {
  const { onboardingCompleted, refresh } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (onboardingCompleted) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleSelect = (value) => {
    setResponses({ ...responses, [step.id]: value });
  };

  const handleNext = async () => {
    if (isLastStep) {
      await finishOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const finishOnboarding = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          coach_details: responses
        })
        .eq('id', user.id);

      if (error) throw error;
      await refresh();
    } catch (error) {
      console.error('Error saving onboarding:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-primary' : 'bg-transparent'}`} 
              style={{ width: `${100 / STEPS.length}%` }} 
            />
          ))}
        </div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              {step.icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
              {step.title}
            </h2>
            <p className="text-slate-500 text-sm md:text-base font-medium max-w-[280px]">
              {step.description}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {step.options.map((opt) => {
              const isActive = responses[step.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group ${
                    isActive 
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className={`font-bold text-[15px] ${isActive ? 'text-primary' : 'text-slate-800'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {opt.sub}
                    </p>
                  </div>
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white'
                  }`}>
                    {isActive && <Check size={14} strokeWidth={4} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-10 flex items-center gap-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="size-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-slate-200 transition-all shrink-0"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!responses[step.id] || isSaving}
              className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-lg ${
                !responses[step.id] || isSaving
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isSaving ? <Loader className="animate-spin" size={20} /> : (
                <>
                  {isLastStep ? 'Finalize Roster' : 'Next Step'}
                  {!isLastStep && <ArrowRight size={18} />}
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-8">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
