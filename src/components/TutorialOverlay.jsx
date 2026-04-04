import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowDown, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    title:           'Add Your First Student',
    mobileTip:       'Tap "Students" in the bottom menu to get started.',
    desktopTip:      'Click on "Students" to reach your roster.',
    mobileTargetId:  'tutorial-mobile-students-nav',
    mobileAnchor:    'top',
    desktopTargetId: 'tutorial-students-nav',
    desktopPosition: 'right',
  },
  {
    title:           'Create a Student Profile',
    mobileTip:       'Tap the button to add your first student. Just enter their name.',
    desktopTip:      'Add your first student to the roster.',
    mobileTargetId:  'tutorial-mobile-add-student-fab',
    desktopTargetId: 'tutorial-add-student-btn',
    mobileAnchor:    'top',
  },
  {
    title:           'Return to Dashboard',
    mobileTip:       'Great job! Now tap Home to see your schedule.',
    desktopTip:      'Now go back to the dashboard.',
    mobileTargetId:  'tutorial-mobile-home-nav',
    desktopTargetId: 'tutorial-home-nav',
    mobileAnchor:    'top',
  },
  {
    title:           'Book Your First Session',
    mobileTip:       'Tap New Lesson to schedule a session with your student.',
    desktopTip:      'Schedule your first session on the calendar.',
    mobileTargetId:  'tutorial-mobile-new-lesson-btn',
    desktopTargetId: 'tutorial-desktop-new-session-btn',
    mobileAnchor:    'top',
  },
  {
    title:           'Welcome to Courtly!',
    mobileTip:       'You are all set! You have successfully added your first student and session. Start growing your business today.',
    desktopTip:      'Onboarding complete! You are ready to manage your coaching business.',
    mobileTargetId:  null,
    desktopTargetId: null,
  },
];

const PAD = 12; // slightly more breathing room around the button

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 1024);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

function useElementRect(id) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!id) {
      setRect(null);
      return;
    }

    const handler = () => {
      console.log(`Tutorial: Target ${id} clicked!`);
      // Logic handled via step-specific effects
    };

    const measure = () => {
      const el = document.getElementById(id);
      if (!el) {
        setRect(null);
        return;
      }
      
      const r = el.getBoundingClientRect();
      
      // If width/height is 0, it's effectively hidden.
      if (r.width === 0 || r.height === 0) {
        setRect(null);
        return;
      }

      setRect((prev) => {
        const newRect = {
          top:     r.top - PAD,
          left:    r.left - PAD,
          width:   r.width + PAD * 2,
          height:  r.height + PAD * 2,
          centerX: r.left + r.width / 2,
          centerY: r.top + r.height / 2,
        };

        // If nothing changed, bail to save renders
        if (prev && 
            Math.abs(prev.top - newRect.top) < 0.5 && 
            Math.abs(prev.left - newRect.left) < 0.5 &&
            Math.abs(prev.width - newRect.width) < 0.5) {
          return prev;
        }

        return newRect;
      });
    };

    measure();
    const t = setInterval(measure, 100); // Fast poll
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    
    return () => {
      clearInterval(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [id]);

  return rect;
}

// No longer using buildClipPath for the primary mask. Using 4 panels instead.
function desktopCardPos(rect, position, vw, vh) {
  const W = 296, gap = 18;
  if (!rect) return { top: vh / 2 - 110, left: vw / 2 - W / 2 };
  if (position === 'right') {
    return {
      top:  Math.max(Math.min(rect.centerY - 100, vh - 240), 16),
      left: Math.min(rect.left + rect.width + gap, vw - W - 16),
    };
  }
  return {
    top:  Math.min(rect.top + rect.height + gap, vh - 240),
    left: Math.max(Math.min(rect.centerX - W / 2, vw - W - 16), 16),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TutorialOverlay({ onComplete, session }) {
  const [step, setStep]               = useState(0);
  const [skipWarning, setSkipWarning] = useState(false);
  const [animating, setAnimating]     = useState(false);
  const [removed, setRemoved]           = useState(false); // Local "kill switch" for instant removal
  const [vw, setVw]                   = useState(window.innerWidth);
  const [vh, setVh]                   = useState(window.innerHeight);
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const stepRef   = useRef(step);
  stepRef.current = step;

  const current    = STEPS[step];
  const targetId   = isMobile ? current.mobileTargetId : current.desktopTargetId;
  const rect       = useElementRect(targetId);

  useEffect(() => {
    const fn = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const advance = useCallback(() => {
    console.log(`Tutorial: Moving from step ${stepRef.current} to ${stepRef.current + 1}`);
    setAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 250);
  }, []);

  // ── Step 0: advance when user navigates to /students ─────────────────────
  useEffect(() => {
    if (step === 0 && location.pathname === '/students') {
      advance();
    }
  }, [location.pathname, step, advance]);

  // ── Step 2: advance when user returns home from students ────────────────
  useEffect(() => {
    if (step === 2 && (location.pathname === '/' || location.pathname === '/dashboard')) {
      advance();
    }
  }, [location.pathname, step, advance]);

  // ── Step 1: listen for student INSERT in Supabase, then go back to home ──
  useEffect(() => {
    if (step !== 1) return;

    const userId = session?.user?.id;
    if (!userId) return;

    const channel = supabase
      .channel('tutorial-db-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'students' },
        (payload) => {
          if (payload.new?.coach_id === userId && stepRef.current === 1) {
            console.log('Tutorial: New student detected!', payload);
            advance();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lessons' },
        (payload) => {
          if (payload.new?.coach_id === userId && stepRef.current === 3) {
            console.log('Tutorial: New lesson detected and advancing!', payload);
            advance();
          }
        }
      )
      .subscribe((status) => {
        console.log('Tutorial: Realtime subscription status:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [step, session, navigate, advance]);

  // ── Step 3: advance when user CONFIRMS the booking ───────────────────────
  useEffect(() => {
    const check = () => {
      if (step !== 3) return;
      const el = document.getElementById('tutorial-confirm-booking-btn');
      if (el && !el.hasAttribute('data-tutorial-watching')) {
        el.setAttribute('data-tutorial-watching', 'true');
        el.addEventListener('click', () => {
          console.log('Tutorial: Confirm Booking clicked in Modal!');
          // We can advance here or wait for DB. Let's do a tiny delay.
          setTimeout(() => { if (stepRef.current === 3) advance(); }, 600);
        });
      }
    };
    const t = setInterval(check, 300);
    return () => clearInterval(t);
  }, [step, advance]);

  const [modalOpen, setModalOpen]       = useState(false);

  // ─── Modal Watcher ────────────────────────────────────────────────────────
  // If any modal is open, hide the tutorial to give the user a clear view.
  useEffect(() => {
    const check = () => {
      // Check for our booking modal or any common modal indicators
      const found = !!document.getElementById('booking-modal-overlay');
      setModalOpen(found);
    };
    const t = setInterval(check, 150);
    return () => clearInterval(t);
  }, []);

  // ─── Render Guard ─────────────────────────────────────────────────────────
  if (removed) return null;
  if (animating && !rect) return null; 
  // Step 4 (Welcome) has no targetId, so we must explicitly allow it.
  if (!targetId && step !== 0 && step !== 4) return null;

  // ─── Spotlight (Four Gate Mask) ──────────────────────────────────────────
  // This uses 4 dark panels to create a hole, which is 100% robust.
  // We DISABLE the backdrop for Step 1 (FAB) and Step 3 (Book Session). Step 2 (Return home) gets the shadow.
  const isTransparent = isMobile && (step === 1 || step === 3);
  const maskBase = {
    position: 'fixed', zIndex: 9998,
    background: isTransparent ? 'transparent' : 'rgba(15,23,42,0.68)',
    pointerEvents: 'none', transition: 'all 0.15s ease-out'
  };
  
  const spotlight = rect ? (
    <>
      <div style={{ ...maskBase, top: 0, left: 0, right: 0, height: rect.top }} />
      <div style={{ ...maskBase, top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }} />
      <div style={{ ...maskBase, top: rect.top, left: 0, width: rect.left, height: rect.height }} />
      <div style={{ ...maskBase, top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }} />
    </>
  ) : (
    <div style={{ ...maskBase, inset: 0 }} />
  );

  const ringEl = rect ? (
    <div style={{
      position: 'fixed',
      top: rect.top, left: rect.left, width: rect.width, height: rect.height,
      borderRadius: 12,
      border: '3px solid #66b319',
      boxShadow: '0 0 0 4px rgba(102,179,25,0.3)',
      zIndex: 10001,
      pointerEvents: 'none',
      transition: 'top 0.25s, left 0.25s, width 0.25s, height 0.25s',
      animation: 'tut-pulse 2s infinite',
    }} />
  ) : null;

  // ─── Card content (shared) ────────────────────────────────────────────────
  const cardContent = (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header: dots + skip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 18 : 5, height: 5, borderRadius: 3,
              background: i < step ? '#66b319' : i === step ? '#66b319' : '#d1d5db',
              transition: 'all 0.25s',
            }} />
          ))}
        </div>
        {!skipWarning && (
          <button onClick={() => setSkipWarning(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#94a3b8', fontFamily: 'inherit', padding: 0,
          }}>
            Skip
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary">
            <span className="text-sm font-black">{step + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1.5">{current.title}</h3>
            <p className="text-[12.5px] leading-relaxed text-slate-500 font-medium">
              {isMobile ? current.mobileTip : current.desktopTip}
            </p>
          </div>
        </div>

        {step === 4 && (
          <button 
            onClick={onComplete}
            className="mt-2 w-full py-2.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-95 transition-all mt-1"
          >
            Start coaching
          </button>
        )}
      </div>

      {/* Skip confirmation overlay */}
      {skipWarning && (
        <div style={{
          position: 'absolute', inset: 0, 
          background: 'rgba(255,255,255,0.95)', backdropBlur: '4px',
          borderRadius: 18, padding: '20px 18px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <AlertTriangle size={20} color="#f97316" />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#9a3412' }}>Skip the setup?</p>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#7c2d12', lineHeight: 1.5 }}>
            It takes just 2 minutes to learn the basics. Are you sure you want to exit?
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSkipWarning(false)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: '#66b319', color: 'white', border: 'none',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}>Keep going</button>
            <button onClick={() => onComplete?.()} style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'white', color: '#94a3b8', border: '1px solid #e2e8f0',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Skip setup</button>
          </div>
        </div>
      )}
    </div>
  );

  // ─── MOBILE ───────────────────────────────────────────────────────────────
  if (isMobile) {
    if (modalOpen) return null; // Hide UI but keep logic alive
    const CARD_TOP     = 80; 
    const showArrow    = !!rect;
    const arrowX       = rect ? Math.max(20, Math.min(rect.centerX - 11, vw - 40)) : vw / 2 - 11;
    const arrowTop     = rect ? rect.top - 48 : 0; 

    return (
      <>
        {spotlight}
        {ringEl}

        {showArrow && (
          <div style={{
            position: 'fixed',
            left: arrowX,
            top: arrowTop,
            zIndex: 10002,
            pointerEvents: 'none',
            animation: 'tut-bounce 1s ease-in-out infinite',
          }}>
            <ArrowDown size={22} color="#66b319" strokeWidth={2.5} />
          </div>
        )}

        <div style={{
          position: 'fixed',
          left: 16, right: 16,
          top: CARD_TOP,
          zIndex: 10000,
          background: '#ffffff',
          borderRadius: 18,
          padding: '20px 18px',
          boxShadow: '0 8px 40px rgba(15,23,42,0.22)',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'opacity 0.2s, transform 0.2s',
          overflow: 'hidden'
        }}>
          {cardContent}
        </div>

        <style>{`
          @keyframes tut-bounce {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(7px); }
          }
          @keyframes tut-pulse {
            0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(102,179,25,0.4); opacity: 1; }
            70%  { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(102,179,25,0); opacity: 0.8; }
            100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(102,179,25,0); opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  // ─── DESKTOP ──────────────────────────────────────────────────────────────
  const pos = desktopCardPos(rect, current.desktopPosition, vw, vh);

  return (
    <>
      {!modalOpen && spotlight}
      {!modalOpen && ringEl}

      {!modalOpen && (
        <div style={{
          position: 'fixed',
          top: pos.top, left: pos.left,
          width: 296,
          zIndex: 10000,
          opacity: animating ? 0 : 1,
          transition: 'top 0.28s cubic-bezier(0.4,0,0.2,1), left 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '20px',
            boxShadow: '0 16px 48px rgba(15,23,42,0.22), 0 2px 8px rgba(15,23,42,0.06)',
            position: 'relative', overflow: 'hidden'
          }}>
            {cardContent}
          </div>

          {current.desktopPosition === 'right' && rect && (
            <div style={{
              position: 'absolute', left: -7, top: 100,
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '7px solid #ffffff',
            }} />
          )}
          {current.desktopPosition === 'bottom' && rect && (
            <div style={{
              position: 'absolute', top: -7, left: 36,
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid #ffffff',
            }} />
          )}
        </div>
      )}
    </>
  );
}

