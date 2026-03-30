import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, isSameDay, startOfWeek, addDays, subWeeks, addWeeks, differenceInWeeks, isBefore } from 'date-fns';
import { useOutletContext } from 'react-router-dom';
import LessonDetailsModal from '../components/LessonDetailsModal';
import BookingModal from '../components/BookingModal';
import { Calendar, ChevronLeft, ChevronRight, CalendarOff, PlusCircle, Plus } from 'lucide-react';

// Hours shown in the desktop calendar
const CALENDAR_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function Schedule() {
  const { session } = useOutletContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*, students(full_name), courts(name)')
        .neq('status', 'Cancelled');
      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleLessonsForDay = (day) => {
    return lessons.filter(lesson => {
      const lessonStart = parseISO(lesson.start_time);
      if (isSameDay(lessonStart, day)) return true;
      if (lesson.is_recurring && (isBefore(lessonStart, day) || isSameDay(lessonStart, day))) {
        if (lesson.recurring_pattern === 'weekly' && lessonStart.getDay() === day.getDay()) return true;
        if (lesson.recurring_pattern === 'bi-weekly' && lessonStart.getDay() === day.getDay()) {
          const lessonStartStartOfDay = new Date(lessonStart.setHours(0,0,0,0));
          const checkDayStartOfDay = new Date(day.setHours(0,0,0,0));
          if (differenceInWeeks(checkDayStartOfDay, lessonStartStartOfDay) % 2 === 0) return true;
        }
      }
      return false;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const currentDayLessons = getVisibleLessonsForDay(currentDate);

  const changeWeek = (direction) => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const renderTimelineSlot = (lesson) => {
    const time = format(parseISO(lesson.start_time), 'HH:mm');
    const isPrivate = lesson.type === 'Private';
    return (
      <div key={lesson.id} className="relative cursor-pointer group" onClick={() => setSelectedLesson(lesson)}>
        <div className="absolute -left-12 top-0 text-[11px] font-bold text-slate-400">{time}</div>
        <div className={`absolute -left-[41px] top-1.5 size-2.5 rounded-full border-2 bg-slate-50 z-10 ${isPrivate ? 'border-primary' : 'border-slate-300'}`}></div>
        <div className="bg-white p-4 rounded-xl border border-primary/5 shadow-sm hover:border-primary/30 transition-all flex items-center justify-between ml-2">
          <div className="flex gap-3 items-center">
            <div className={`size-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs ${isPrivate ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
              {lesson.students?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{lesson.students?.full_name}</h4>
              <p className="text-xs text-slate-500">{lesson.type} • {lesson.courts?.name || 'No court'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${isPrivate ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'}`}>
              {isPrivate ? 'Confirmed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col bg-slate-50 min-h-screen">

        {/* Mini Calendar */}
        <div className="p-4 bg-white shadow-sm border-b border-primary/5" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => changeWeek('prev')} className="text-slate-400 hover:text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <p className="text-sm font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</p>
            <button onClick={() => changeWeek('next')} className="text-slate-400 hover:text-primary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, currentDate);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentDate(day)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-colors ${isSelected ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-100 text-slate-800'}`}
                >
                  <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{format(day, 'EEE')}</span>
                  <span className="text-sm font-bold mt-1">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 flex-1">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {isSameDay(currentDate, new Date()) ? "Today's Sessions" : `${format(currentDate, 'EEEE')} Sessions`}
                </span>
                <div className="h-px flex-1 bg-primary/10"></div>
              </div>
              {currentDayLessons.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 shadow-sm">
                  <CalendarOff size={40} className="mb-2 opacity-30 mx-auto text-slate-400" />
                  <p className="text-sm font-medium">No sessions scheduled for this day.</p>
                </div>
              ) : (
                <div className="relative pl-12 space-y-6 pb-8">
                  <div className="absolute left-[18px] top-2 bottom-0 w-px bg-slate-200"></div>
                  {currentDayLessons.map(lesson => renderTimelineSlot(lesson))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT — weekly calendar grid, lg+ only
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans h-screen bg-slate-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 py-8 h-full flex flex-col space-y-8">
          {/* Desktop header row */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">{format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d, yyyy')}</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Weekly Schedule</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                <button onClick={() => changeWeek('prev')} className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center bg-slate-200/50 rounded-lg p-1 mx-1">
                  <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Day</button>
                  <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-slate-900 cursor-pointer">Week</button>
                  <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">Month</button>
                </div>
                <button onClick={() => changeWeek('next')} className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600">
                  <ChevronRight size={18} />
                </button>
              </div>

              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} />
                New Session
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex justify-center items-center flex-1"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-auto flex-1 flex flex-col shadow-sm">
              {/* Day Headers */}
              <div className="desktop-calendar-grid border-b border-slate-200 bg-slate-50 sticky top-0 z-10 shrink-0">
                <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center">Time</div>
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={i}
                      className={`p-3 border-l border-slate-200 flex flex-col items-center cursor-pointer hover:bg-slate-100 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                      onClick={() => setCurrentDate(day)}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-slate-500'}`}>{format(day, 'EEE')}</span>
                      <span className={`text-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-slate-900'}`}>{format(day, 'd')}</span>
                    </div>
                  );
                })}
              </div>

              {/* Time Rows */}
              <div className="flex-1 overflow-y-auto">
                {CALENDAR_HOURS.map(hour => {
                  const label = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
                  return (
                    <div key={hour} className="desktop-calendar-grid border-b border-slate-100 min-h-[80px]">
                      {/* Time Label */}
                      <div className="flex justify-center pt-2 text-[10px] font-bold text-slate-400 flex-shrink-0 uppercase px-1">{label}</div>

                      {/* Day Cells */}
                      {weekDays.map((day, di) => {
                        const dayLessons = getVisibleLessonsForDay(day).filter(l => {
                          const h = parseISO(l.start_time).getHours();
                          return h === hour;
                        });
                        return (
                          <div key={di} className="p-1.5 border-l border-slate-100 space-y-1 hover:bg-slate-50/50 transition-colors min-w-0">
                            {dayLessons.map(lesson => {
                              const isPrivate = lesson.type === 'Private';
                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => setSelectedLesson(lesson)}
                                  className={`rounded-lg p-2 cursor-pointer transition-opacity hover:opacity-80 ${isPrivate ? 'bg-primary/10 border-l-[3px] border-primary text-primary' : 'bg-slate-100 border-l-[3px] border-slate-400 text-slate-700'}`}
                                >
                                  <p className="text-[11.5px] font-bold leading-tight truncate">
                                    {lesson.students?.full_name || 'Unknown'}
                                  </p>
                                  <p className="text-[10px] opacity-80 mt-0.5 truncate font-medium">
                                    {lesson.courts?.name || 'No court'} • {lesson.duration_minutes}m
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Modals */}
      <LessonDetailsModal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        lesson={selectedLesson}
        onUpdate={fetchSchedule}
      />
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => { setIsBookingModalOpen(false); fetchSchedule(); }}
        session={session}
      />
    </>
  );
}
