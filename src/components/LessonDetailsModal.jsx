import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';
import { ArrowLeft, MoreVertical, ShieldCheck, Clock, LayoutGrid, Loader2, Repeat, Target, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function LessonDetailsModal({ isOpen, onClose, lesson, onUpdate }) {
  const [completing, setCompleting] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [objectives, setObjectives] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (lesson) {
      setObjectives(lesson.objectives || '');
      setFeedback(lesson.feedback || '');
      setRescheduleDate(lesson.start_time ? format(parseISO(lesson.start_time), 'yyyy-MM-dd') : '');
      setRescheduleTime(lesson.start_time ? format(parseISO(lesson.start_time), 'HH:mm') : '');
      setShowReschedule(false);
    }
  }, [lesson]);

  if (!isOpen || !lesson) return null;

  const autoSaveNotes = (field, value) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('lessons').update({ [field]: value }).eq('id', lesson.id);
    }, 1200);
  };

  const handleCompleteLesson = async () => {
    setCompleting(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ status: 'Completed' })
        .eq('id', lesson.id);
      if (error) throw error;
      onUpdate?.();
      onClose();
    } catch (err) {
      console.error('Error completing lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    try {
      const newStartTime = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
      const { error } = await supabase
        .from('lessons')
        .update({ start_time: newStartTime })
        .eq('id', lesson.id);
      if (error) throw error;
      onUpdate?.();
      setShowReschedule(false);
      onClose();
    } catch (err) {
      console.error('Error rescheduling lesson:', err);
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-900 animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <header className="flex items-center bg-white p-4 sticky top-0 z-10 border-b border-primary/10">
        <button onClick={onClose} className="text-slate-500 flex size-10 items-center justify-center hover:bg-primary/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 ml-2">Lesson Details</h1>
        <button
          onClick={() => setShowReschedule(v => !v)}
          className="text-slate-500 flex size-10 items-center justify-center hover:bg-primary/10 rounded-full transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Student Profile Section */}
        <section className="p-6 bg-white mb-2 border-b border-primary/5">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="bg-slate-100 flex items-center justify-center rounded-full h-24 w-24 shadow-sm text-4xl font-bold text-slate-600">
                {lesson.students?.full_name?.charAt(0) || '?'}
              </div>
              <div className="absolute bottom-1 right-1 text-white rounded-full p-1 border-2 border-white bg-primary">
                <ShieldCheck size={14} strokeWidth={3} className="block" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold leading-tight tracking-tight">{lesson.students?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/10 text-primary">
                  {lesson.type} Lesson
                </span>
                {lesson.status === 'Completed' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Completed</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats/Details */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock size={16} />
                <p className="text-xs font-medium uppercase tracking-wide">Time</p>
              </div>
              <p className="text-base font-semibold">
                {format(parseISO(lesson.start_time), 'h:mm a')} - {format(new Date(parseISO(lesson.start_time).getTime() + lesson.duration_minutes * 60000), 'h:mm a')}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <LayoutGrid size={16} />
                <p className="text-xs font-medium uppercase tracking-wide">Court</p>
              </div>
              <p className="text-base font-semibold">{lesson.courts?.name || 'Unassigned'}</p>
            </div>
          </div>
        </section>

        {/* Reschedule Panel */}
        {showReschedule && (
          <div className="mx-4 mt-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
            <h3 className="text-base font-bold mb-3 text-primary">Reschedule Session</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              onClick={handleReschedule}
              disabled={rescheduling}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: '#66b319' }}
            >
              {rescheduling ? <Loader2 size={16} className="animate-spin" /> : <Repeat size={16} />}
              Confirm Reschedule
            </button>
          </div>
        )}

        {/* Lesson Notes */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Target size={24} className="text-primary" />
              <h3 className="text-lg font-bold">Lesson Objectives</h3>
              <span className="text-xs text-slate-400 ml-auto italic">Auto-saves</span>
            </div>
            <textarea
              value={objectives}
              onChange={e => { setObjectives(e.target.value); autoSaveNotes('objectives', e.target.value); }}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-base focus:border-primary focus:ring-2 min-h-[120px] transition-all placeholder:text-slate-400 outline-none"
              placeholder="Focus on backhand top-spin and service placement accuracy..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={24} className="text-primary" />
              <h3 className="text-lg font-bold">Post-Session Feedback</h3>
              <span className="text-xs text-slate-400 ml-auto italic">Auto-saves</span>
            </div>
            <textarea
              value={feedback}
              onChange={e => { setFeedback(e.target.value); autoSaveNotes('feedback', e.target.value); }}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-base focus:border-primary focus:ring-2 min-h-[120px] transition-all placeholder:text-slate-400 outline-none"
              placeholder={`${lesson.students?.full_name} showed great improvement...`}
            />
          </div>
        </div>

        {/* Action Area */}
        {lesson.status !== 'Completed' && (
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={handleCompleteLesson}
              disabled={completing}
              className="w-full text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform active:scale-[0.98] mt-2 bg-primary"
            >
              {completing ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <CheckCircle2 size={24} className="transition-transform group-hover:scale-110" />
              )}
              {completing ? 'Completing...' : 'Complete Lesson'}
            </button>
            <button
              onClick={() => setShowReschedule(v => !v)}
              className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Repeat size={24} />
              Reschedule Session
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
