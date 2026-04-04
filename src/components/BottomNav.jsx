import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, Dumbbell, Users, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const baseClasses = "flex flex-col items-center gap-1.5 transition-colors flex-1";
  const activeClasses = "text-primary";
  const inactiveClasses = "text-slate-400 hover:text-primary";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 pt-3 px-6 z-20" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-2xl mx-auto flex justify-around items-center">
        <NavLink id="tutorial-mobile-home-nav" to="/" end className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <Home size={24} className="mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </NavLink>

        <NavLink to="/schedule" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <CalendarDays size={24} className="mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Schedule</span>
        </NavLink>

        <NavLink to="/drills" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <Dumbbell size={24} className="mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Drills</span>
        </NavLink>

        <NavLink id="tutorial-mobile-students-nav" to="/students" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <Users size={24} className="mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Students</span>
        </NavLink>

        <NavLink to="/programs" className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          <BookOpen size={24} className="mb-0.5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Programs</span>
        </NavLink>
      </div>
    </nav>
  );
}
