import React from 'react';
import { Link } from 'react-router-dom';
import NotificationsDropdown from './NotificationsDropdown';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Zap } from 'lucide-react';

export default function Header({ session }) {
  const coachName = session?.user?.user_metadata?.full_name || 'Coach';
  const { isPro } = useSubscription();
  
  return (
    <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-primary/10">
      <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
        {/* Courtly logo — switches between light and dark variants */}
        <Link to="/" className="flex items-center cursor-pointer">
          <img
            src="/logo-full.png"
            alt="Courtly"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center gap-3">
          {!isPro && (
            <Link to="/pricing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[11px] font-bold">
              <Zap size={13} fill="currentColor" />
              Become Pro
            </Link>
          )}
          <NotificationsDropdown />
          <Link to="/settings" className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95">
            <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-slate-600 font-bold group-hover:bg-slate-200 transition-colors text-sm">
              {coachName.charAt(0)}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
