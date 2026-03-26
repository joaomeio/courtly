import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import BookingModal from './BookingModal';
import NotificationsDropdown from './NotificationsDropdown';

export default function Layout({ session }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 font-display text-slate-800">

      {/* ─────────────────────────────────────────────────────
          DESKTOP LAYOUT  (lg and above)
          Sidebar on the left, scrollable main on the right.
          Hidden completely on mobile via 'hidden lg:flex'.
      ───────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <Sidebar
          session={session}
          onAddClick={() => setIsBookingModalOpen(true)}
        />

        {/* Desktop top bar + page content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Header Bar */}
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

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet context={{ session }} />
          </main>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          MOBILE LAYOUT  (below lg)
          Unchanged from original: header on dashboard only,
          bottom nav always visible.
          Hidden completely on desktop via 'flex lg:hidden'.
      ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden min-h-screen">
        {isDashboard && <Header session={session} />}

        <main className="flex-1 w-full max-w-2xl mx-auto pb-28">
          <Outlet context={{ session }} />
        </main>

        <BottomNav />
      </div>

      {/* Booking Modal — shared between both layouts */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        session={session}
      />
    </div>
  );
}
