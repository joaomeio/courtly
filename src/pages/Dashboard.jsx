import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, isSameDay, differenceInWeeks, addDays } from 'date-fns';
import { Link, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import LessonDetailsModal from '../components/LessonDetailsModal';
import BookingModal from '../components/BookingModal'; // Needed for quick action
import { Clock, TrendingUp, Users, PieChart, CreditCard, LayoutGrid, ArrowRight, ChevronRight, Calendar, UserPlus, Settings, PartyPopper, CheckCircle2 } from 'lucide-react';

// --- NEW DESKTOP COMPONENTS AND CONSTANTS ---

const C = {
  green: "#66b319",
  greenDark: "#4e8a13",
  greenLight: "#edf7e0",
  greenMid: "#d4edab",
  bg: "#f8fafc",
  white: "#ffffff",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  amber: "#f59e0b",
  amberLight: "#fef3c7",
  amberDark: "#92400e",
};

function Avatar({ initials, bg, color, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function AvatarStack({ students }) {
  const visible = students.slice(0, 4);
  const extra = students.length - 4;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((s, i) => (
        <div key={s.name + i} style={{ marginLeft: i === 0 ? 0 : -7, zIndex: visible.length - i }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: s.bg, color: s.color,
            border: `2px solid ${C.white}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 7.5, fontWeight: 700,
          }}>
            {s.avatar}
          </div>
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -7, width: 22, height: 22, borderRadius: "50%",
          background: C.slate200, color: C.slate500,
          border: `2px solid ${C.white}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 7.5, fontWeight: 700,
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session, onClick }) {
  const [open, setOpen] = useState(false);
  const isGroup = session.type === "group";
  const isLive = session.status === "now";
  const isDone = session.status === "done";

  return (
    <div className="mb-0.5">
      <div
        onClick={() => {
          if (isGroup) {
            setOpen(o => !o);
          } else {
            onClick(session.originalLesson);
          }
        }}
        className={`flex items-center gap-3 px-2.5 py-2 cursor-pointer transition-colors ${open ? 'rounded-t-lg bg-slate-100' : 'rounded-lg hover:bg-slate-50'} ${isLive ? 'border-l-4 border-amber-500 bg-amber-50/50' : 'border-l-4 border-transparent'} ${isDone ? 'opacity-50' : ''}`}
      >
        {/* Time */}
        <div className="w-10 shrink-0">
          <p className="m-0 text-[13px] font-bold text-slate-900">{session.time}</p>
          <p className="m-0 text-[11px] text-slate-400">{session.duration}min</p>
        </div>

        {/* Dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-amber-500' : isGroup ? 'bg-primary' : 'bg-slate-300'}`} />

        {/* Identity */}
        {isGroup ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 shrink-0 text-primary">
               {/* Icon */}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="4.5" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="9" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 10.5c0-1.657 1.567-3 3.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M6.5 10.5c0-1.657 1.119-3 2.5-3s2.5 1.343 2.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-xs font-bold tracking-wide">Group</span>
            </div>
            <span className="text-[13px] font-medium text-slate-700 truncate">
              {session.label}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar initials={session.avatar} bg={session.avatarBg} color={session.avatarColor} size={28} />
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-medium text-slate-900 truncate">
                {session.student}
              </p>
              <p className="m-0 text-[11.5px] text-slate-500">Private</p>
            </div>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {isGroup && <AvatarStack students={session.students} />}
          <span className="text-xs text-slate-500">{session.court}</span>
          {isLive && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Live now</span>
          )}
          {isGroup ? (
            <ChevronRight size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
          ) : (
            <ChevronRight size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isGroup && open && (
        <div className="border-l-2 border-slate-200 ml-5 pl-3 py-1.5 mb-0.5">
          {session.students.map((s, i) => (
            <div 
              key={s.name + i} 
              onClick={() => onClick(session.originalLesson)}
              className="flex items-center gap-2 p-2 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Avatar initials={s.avatar} bg={s.bg} color={s.color} size={22} />
              <span className="text-[13px] text-slate-700 flex-1">{s.name}</span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-primary/5 hover:border-primary transition-all cursor-pointer flex-1 group"
    >
      <span className="text-slate-500 group-hover:text-primary transition-colors flex">{icon}</span>
      <span className="text-[11.5px] font-medium text-slate-700 group-hover:text-primary transition-colors whitespace-nowrap">{label}</span>
    </button>
  );
}

// --- MAIN COMPONENT ---

export default function Dashboard() {
  const { session } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    initDashboard();
    
    // Check for Stripe success loopback
    if (searchParams.get('checkout') === 'success') {
      setShowSuccessModal(true);
      // Clean up URL without reloading
      setSearchParams(new URLSearchParams());
    }
  }, [searchParams]);

  const initDashboard = async () => {
    try {
      setLoading(true);
      const [lessonsRes, studentsRes] = await Promise.all([
        supabase.from('lessons').select('*, students(full_name), courts(name)').neq('status', 'Cancelled'),
        supabase.from('students').select('id', { count: 'exact' }).eq('status', 'Active')
      ]);
      
      if (lessonsRes.error) throw lessonsRes.error;
      setLessons(lessonsRes.data || []);
      setStudentsCount(studentsRes.count || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleLessonsForDay = (day) => {
    return lessons.filter(lesson => {
      const lessonStart = parseISO(lesson.start_time);
      if (isSameDay(lessonStart, day)) return true;
      if (lesson.is_recurring && lessonStart <= day) {
        if (lesson.recurring_pattern === 'weekly') {
          if (lessonStart.getDay() === day.getDay()) return true;
        }
        if (lesson.recurring_pattern === 'bi-weekly') {
          if (lessonStart.getDay() === day.getDay()) {
             const lessonStartStartOfDay = new Date(lessonStart.setHours(0,0,0,0));
             const checkDayStartOfDay = new Date(day.setHours(0,0,0,0));
             const diffWeeks = differenceInWeeks(checkDayStartOfDay, lessonStartStartOfDay);
             if (diffWeeks % 2 === 0) return true;
          }
        }
      }
      return false;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const todaysLessonsRaw = getVisibleLessonsForDay(new Date());
  const todaysMinutes = todaysLessonsRaw.reduce((total, lesson) => total + lesson.duration_minutes, 0);
  const todaysHours = (todaysMinutes / 60).toFixed(1);

  // Transform raw lessons to new SESSIONS format
  const colors = [
    { bg: "#e0f2fe", color: "#0369a1" },
    { bg: "#ede9fe", color: "#5b21b6" },
    { bg: "#fce7f3", color: "#9d174d" },
    { bg: "#edf7e0", color: "#4e8a13" },
    { bg: "#fef3c7", color: "#92400e" },
  ];

  const mapLessonToSession = (lesson) => {
    const isGroup = lesson.type === 'Group' || lesson.type === 'Clinic';
    const color = colors[lesson.id % colors.length] || colors[0];
    const studentName = lesson.students?.full_name || 'Unknown';
    const avatar = studentName.charAt(0).toUpperCase();

    // Determine status (done, now, upcoming)
    const now = new Date();
    const lessonDate = parseISO(lesson.start_time);
    const isToday = isSameDay(lessonDate, now);
    let status = 'upcoming';
    if (lesson.status === 'Completed') status = 'done';
    else if (isToday && lessonDate.getHours() <= now.getHours() && (lessonDate.getHours() + (lesson.duration_minutes/60)) > now.getHours()) {
      status = 'now';
    } else if (lessonDate < now && isToday) {
      status = 'done';
    }

    // Mock extra students for visual variety if it's a group class but only 1 is in DB
    const mockGroupStudents = [
      { name: studentName, avatar, bg: color.bg, color: color.color }
    ];
    if (isGroup) {
      mockGroupStudents.push({ name: 'Ana Souza', avatar: 'AS', bg: '#e0f2fe', color: '#0369a1' });
      mockGroupStudents.push({ name: 'Bruno Lima', avatar: 'BL', bg: '#ede9fe', color: '#5b21b6' });
    }

    return {
      id: lesson.id,
      time: format(lessonDate, 'HH:mm'),
      duration: lesson.duration_minutes,
      type: isGroup ? 'group' : 'private',
      student: studentName,
      label: isGroup ? `${lesson.type} Session` : studentName,
      court: lesson.courts?.name || 'No court',
      status,
      avatar,
      avatarBg: color.bg,
      avatarColor: color.color,
      students: mockGroupStudents,
      originalLesson: lesson
    };
  };

  const SESSIONS = todaysLessonsRaw.map(mapLessonToSession);
  const nowSession = SESSIONS.find(s => s.status === "now" || s.time === format(new Date(), 'HH:mm')) || (SESSIONS.length > 0 ? SESSIONS.find(s => s.status === "upcoming") : null);

  // Generate upcoming days data
  const UPCOMING = Array(5).fill(0).map((_, i) => {
    const d = addDays(new Date(), i + 1); // Start from tomorrow
    return {
      day: format(d, 'EEEE'),
      date: format(d, 'MMM d'),
      sessions: getVisibleLessonsForDay(d).length
    };
  });

  const TODAY = format(new Date(), "EEEE, MMMM d");

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#66b319] border-t-transparent rounded-full"></div></div>;
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          SUCCESS MODAL (Post Stripe Checkout)
      ═══════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center animate-in zoom-in-95 duration-300 delay-100">
            {/* Confetti-like background element */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-primary/5">
                <PartyPopper size={36} strokeWidth={2.5} className="animate-bounce" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Welcome to Pro!</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                Your subscription is active. You now have unlimited access to the 250+ drill library, recurring lesson scheduling, and unbounded rosters.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl w-full p-4 mb-8 text-left space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Start</p>
                <Link to="/drills" onClick={() => setShowSuccessModal(false)} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Browse Pro Drills</span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary" />
                </Link>
                <Link to="/schedule" onClick={() => setShowSuccessModal(false)} className="flex items-center justify-between group p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-sm font-bold text-slate-700">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary"/> Set up Recurring Lessons</span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary" />
                </Link>
              </div>

              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 rounded-xl flex items-center justify-center font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col gap-6 p-4">
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Clock size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Today</span>
            </div>
            <p className="text-3xl font-bold mt-1 text-slate-900">{todaysHours} <span className="text-sm font-normal text-slate-400">hrs</span></p>
            <div className="flex items-center gap-1 text-xs font-medium text-primary mt-1">
              <TrendingUp size={14} />
              <span>+12% vs last week</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-primary/20 shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-primary">
              <Users size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Students</span>
            </div>
            <p className="text-3xl font-bold mt-1 text-slate-900">{studentsCount}</p>
            <div className="text-xs font-medium text-slate-400 mt-1">Active Roster</div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Link to="/analytics" className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary transition-all group">
            <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <PieChart size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors">Analytics</span>
          </Link>
          <Link to="/payments" className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary transition-all group">
            <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <CreditCard size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors">Payments</span>
          </Link>
          <Link to="/courts" className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-primary transition-all group">
            <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <LayoutGrid size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors">Courts</span>
          </Link>
        </section>

        <section className="flex flex-col gap-4">
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 active:scale-[0.98] transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5v12M1.5 7.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            New Lesson
          </button>
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Today's Schedule</h2>
            <Link to="/schedule" className="text-primary text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {todaysLessonsRaw.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
                Your schedule is clear for today.
              </div>
            ) : (
              todaysLessonsRaw.map((lesson) => (
                <div key={lesson.id} onClick={() => setSelectedLesson(lesson)} className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full flex items-center justify-center overflow-hidden border border-primary/20 bg-primary/10 text-primary font-bold text-lg">
                      {lesson.students?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{lesson.students?.full_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                        <Clock size={16} />
                        {format(parseISO(lesson.start_time), 'h:mm a')} ({lesson.duration_minutes}m)
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT — Custom UI matching user's spec
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">{TODAY}</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Good morning 👋</h1>
              <p className="text-[13px] text-slate-500 mt-2">
                You have <strong className="text-slate-900 font-bold">{SESSIONS.length} sessions</strong> today
              </p>
            </div>
            
            <button 
              onClick={() => setIsBookingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              New Session
            </button>
          </div>

          {/* Live banner */}
          {nowSession && SESSIONS.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-slate-400 m-0">{nowSession.status === 'now' ? 'Session in progress' : 'Next session'}</p>
                <p className="text-[15px] font-bold text-white mt-1 m-0">{nowSession.type === 'group' ? nowSession.label : nowSession.student} · {nowSession.court}</p>
              </div>
              <span className="text-xs font-bold bg-slate-800 text-amber-500 px-3 py-1.5 rounded-lg">
                {nowSession.time}
              </span>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-[1fr_285px] gap-6 items-start">
            <div className="flex flex-col gap-6">

              {/* Sessions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[300px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 m-0">Today's Sessions</p>
                  <span className="text-xs text-slate-500">{SESSIONS.length} total</span>
                </div>
                {SESSIONS.length === 0 ? (
                  <div className="flex justify-center items-center h-[200px] text-slate-400 text-sm">
                    Your schedule is clear for today.
                  </div>
                ) : (
                  SESSIONS.map(s => <SessionRow key={s.id} session={s} onClick={setSelectedLesson} />)
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 m-0 mb-4">Quick Actions</p>
                <div className="flex gap-3">
                  <QuickAction onClick={() => setIsBookingModalOpen(true)} label="New Session" icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 2.5v12M2.5 8.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>} />
                  <QuickAction onClick={() => navigate('/students')} label="Add Student" icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M3 14.5c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 2.5v4M11 4.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>} />
                  <QuickAction onClick={() => navigate('/payments')} label="Log Payment" icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2" y="5" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 8.5h13" stroke="currentColor" strokeWidth="1.4"/><rect x="4" y="11" width="3.5" height="1.5" rx="0.5" fill="currentColor" opacity="0.5"/></svg>} />
                  <QuickAction onClick={() => navigate('/courts')} label="Book Court" icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><rect x="2" y="2" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M8.5 2v13M2 8.5h13" stroke="currentColor" strokeWidth="1.4"/></svg>} />
                  <QuickAction onClick={() => navigate('/schedule')} label="Calendar" icon={<Calendar size={18} strokeWidth={1.5} />} />
                </div>
              </div>
            </div>

            {/* Upcoming week */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-8">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 m-0 mb-4">Upcoming Week</p>
              <div className="flex flex-col gap-1">
                {UPCOMING.map(day => (
                  <div
                    key={day.date}
                    onClick={() => navigate('/schedule')}
                    className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="m-0 text-[13px] font-bold text-slate-900">{day.day}</p>
                      <p className="m-0 text-[11px] text-slate-500">{day.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-[55px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min((day.sessions / 10) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 min-w-[14px] text-right">{day.sessions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <LessonDetailsModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
        onUpdate={initDashboard}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => { setIsBookingModalOpen(false); initDashboard(); }}
        session={session}
      />
    </>
  );
}
