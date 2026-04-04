import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import BookingModal from './BookingModal';
import NotificationsDropdown from './NotificationsDropdown';
import OnboardingModal from './OnboardingModal';
import TutorialOverlay from './TutorialOverlay';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function Layout({ session }) {
  const { onboardingCompleted, tutorialCompleted, markTutorialComplete } = useSubscription();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const showTutorial = onboardingCompleted && !tutorialCompleted;

  return (
    <div className="min-h-screen bg-slate-50 font-display text-slate-800">

      {/* ─────────────────────────────────────────────────────
          DESKTOP LAYOUT  (lg and above)
      ───────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <Sidebar
          session={session}
          onAddClick={() => setIsBookingModalOpen(true)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 flex-shrink-0">
            <h2 className="text-lg font-bold tracking-tight capitalize">
              {location.pathname === '/'
                ? 'Overview'
                : location.pathname.startsWith('/students/')
                  ? 'Student Profile'
                  : location.pathname.slice(1).replace(/-/g, ' ')}
            </h2>
            <div className="flex items-center gap-3">
              <NotificationsDropdown />
              <div className="h-6 w-px bg-slate-200" />
              <span className="text-sm font-bold text-slate-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <Outlet context={{ session }} />
          </main>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          MOBILE LAYOUT  (below lg)
      ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden min-h-screen">
        {isDashboard && <Header session={session} />}

        <main className="flex-1 w-full max-w-2xl mx-auto" style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
          <Outlet context={{ session }} />
        </main>

        <BottomNav />
      </div>

      {/* Booking Modal — shared for desktop sidebar "New Session" button */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        session={session}
      />

      {/* Onboarding Quiz Modal */}
      {!onboardingCompleted && <OnboardingModal />}

      {/* Interactive Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay
          onComplete={markTutorialComplete}
          session={session}
        />
      )}
    </div>
  );
}
