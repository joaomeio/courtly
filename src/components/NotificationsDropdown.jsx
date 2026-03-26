import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, isSameDay, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarCheck, Clock, AlertTriangle, Calendar } from 'lucide-react';

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [read, setRead] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch when opened
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Fetch today's lessons + any lessons without a court assigned
      const { data, error } = await supabase
        .from('lessons')
        .select('*, students(full_name), courts(name)')
        .neq('status', 'Cancelled')
        .gte('start_time', `${todayStr}T00:00:00`)
        .lte('start_time', `${todayStr}T23:59:59`)
        .order('start_time');

      if (error) throw error;

      const now = new Date();
      const items = (data || []).map((lesson) => {
        const start = parseISO(lesson.start_time);
        const upcoming = isAfter(start, now);
        const startsSoon = upcoming && (start - now) < 60 * 60 * 1000; // within 1 hour
        return {
          id: lesson.id,
          student: lesson.students?.full_name || 'Unknown',
          court: lesson.courts?.name || null,
          time: format(start, 'h:mm a'),
          upcoming,
          startsSoon,
          noCourt: !lesson.courts?.name,
        };
      });

      setNotifications(items);
    } catch (err) {
      console.error('Notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.startsSoon || n.noCourt).length;
  const hasUnread = !read && unreadCount > 0;

  const handleOpen = () => {
    setOpen(o => !o);
    setRead(true);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="size-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 relative hover:bg-slate-200 transition-colors"
      >
        <Bell size={20} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Today's Notifications</h3>
            <button
              onClick={() => { setOpen(false); navigate('/schedule'); }}
              className="text-[11px] text-primary font-semibold hover:underline"
            >
              View Schedule
            </button>
          </div>

          {/* Body */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <CalendarCheck size={32} className="mb-2 opacity-50" />
                <p className="text-xs font-medium">No lessons scheduled for today</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { setOpen(false); navigate('/schedule'); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${n.startsSoon ? 'bg-primary/5' : ''}`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.startsSoon ? 'bg-amber-100 text-amber-600' : n.noCourt ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
                    {n.startsSoon ? <Clock size={16} /> : n.noCourt ? <AlertTriangle size={16} /> : <Calendar size={16} />}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {n.startsSoon ? '⚡ Starting soon — ' : ''}{n.student}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {n.time}
                      {n.court ? ` · ${n.court}` : ' · ⚠ No court assigned'}
                    </p>
                  </div>
                  {/* Badge */}
                  {n.upcoming && !n.startsSoon && (
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded self-start mt-0.5 flex-shrink-0">
                      Upcoming
                    </span>
                  )}
                  {n.startsSoon && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded self-start mt-0.5 flex-shrink-0">
                      Soon
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-[11px] text-slate-400 text-center">
                {notifications.length} lesson{notifications.length !== 1 ? 's' : ''} today
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
