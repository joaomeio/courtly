import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useSubscription } from '../contexts/SubscriptionContext';
import { format, addDays } from 'date-fns';
import { User, Users, Zap, X, Search, Check, ChevronDown, LayoutGrid, Timer, Clock, Repeat, Repeat1, RefreshCw, Loader2, CheckCircle2, Lock, AlertTriangle, AlertCircle } from 'lucide-react';

const TYPE_ICONS = { Private: <User size={24} />, Group: <Users size={24} />, Clinic: <Zap size={24} /> };

export default function BookingModal({ isOpen, onClose, session }) {
  const { isPro } = useSubscription();
  const [students, setStudents] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null); // { sameTime: bool, studentName: string }

  // For multi-student search
  const [studentSearch, setStudentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    // Single student_id for Private, array of student_ids for Group/Clinic
    student_id: '',
    student_ids: [],   // multi-select
    court_id: '',
    type: 'Private',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    duration_minutes: 60,
    is_recurring: false,
    recurring_pattern: 'weekly',
  });

  const isMulti = form.type === 'Group' || form.type === 'Clinic';

  useEffect(() => {
    if (isOpen && session) {
      fetchData();
      // Reset form on open
      setForm(prev => ({
        ...prev,
        student_id: '',
        student_ids: [],
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        is_recurring: false,
        recurring_pattern: 'weekly',
      }));
      setStudentSearch('');
      setError(null);
      setConflict(null);
    }
  }, [isOpen, session]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, courtsRes] = await Promise.all([
        supabase.from('students').select('id, full_name').order('full_name'), // Removed rigid 'Active' filter to capture all coach students natively
        supabase.from('courts').select('id, name').order('name'),
      ]);
      if (studentsRes.error) throw studentsRes.error;
      if (courtsRes.error) throw courtsRes.error;
      setStudents(studentsRes.data || []);
      const fetchedCourts = courtsRes.data || [];
      setCourts(fetchedCourts);
      // Free users are locked to the default (first) court
      if (!isPro && fetchedCourts.length > 0) {
        setForm(prev => ({ ...prev, court_id: fetchedCourts[0].id }));
      }
    } catch (err) {
      console.error('Error fetching data for modal:', err);
    }
  };

  // ── Date helpers ────────────────────────────────────────────────────────────
  const dates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  // ── Student selection helpers ────────────────────────────────────────────────
  const toggleStudent = (id) => {
    setForm(prev => {
      const already = prev.student_ids.includes(id);
      return {
        ...prev,
        student_ids: already
          ? prev.student_ids.filter(x => x !== id)
          : [...prev.student_ids, id],
      };
    });
  };

  const removeStudent = (id) => {
    setForm(prev => ({ ...prev, student_ids: prev.student_ids.filter(x => x !== id) }));
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const selectedStudentObjects = students.filter(s => form.student_ids.includes(s.id));

  // ── Overlap check ────────────────────────────────────────────────────────────
  const checkOverlap = async (newStartISO) => {
    const newStart = new Date(newStartISO);
    const newEnd = new Date(newStart.getTime() + form.duration_minutes * 60 * 1000);
    const dayStart = new Date(`${form.date}T00:00:00`).toISOString();
    const dayEnd = new Date(`${form.date}T23:59:59`).toISOString();

    const { data: existing } = await supabase
      .from('lessons')
      .select('id, start_time, duration_minutes, students(full_name)')
      .eq('coach_id', session.user.id)
      .neq('status', 'Cancelled')
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd);

    if (!existing) return null;
    for (const lesson of existing) {
      const existStart = new Date(lesson.start_time);
      const existEnd = new Date(existStart.getTime() + lesson.duration_minutes * 60 * 1000);
      if (newStart < existEnd && newEnd > existStart) {
        return {
          sameTime: existStart.getTime() === newStart.getTime(),
          studentName: lesson.students?.full_name || 'another student',
        };
      }
    }
    return null;
  };

  // ── Quick time suggestions ────────────────────────────────────────────────────
  const quickTimes = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isMulti) {
      if (form.student_ids.length === 0) {
        setError('Please select at least one student.');
        return;
      }
    } else {
      if (!form.student_id) {
        setError('Please select a student.');
        return;
      }
    }
    if (!form.court_id) {
      setError('Please select a court.');
      return;
    }

    setLoading(true);
    try {
      const start_time = new Date(`${form.date}T${form.time}:00`).toISOString();

      const found = await checkOverlap(start_time);
      if (found) {
        setConflict(found);
        setLoading(false);
        return;
      }

      if (isMulti) {
        const { error: insertError } = await supabase.from('lessons').insert([{
          coach_id: session.user.id,
          student_id: form.student_ids[0] || null,
          student_ids: form.student_ids,
          court_id: form.court_id,
          type: form.type,
          start_time,
          duration_minutes: form.duration_minutes,
          is_recurring: form.is_recurring,
          recurring_pattern: form.is_recurring ? form.recurring_pattern : null,
        }]);
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from('lessons').insert([{
          coach_id: session.user.id,
          student_id: form.student_id,
          court_id: form.court_id,
          type: form.type,
          start_time,
          duration_minutes: form.duration_minutes,
          is_recurring: form.is_recurring,
          recurring_pattern: form.is_recurring ? form.recurring_pattern : null,
        }]);
        if (insertError) throw insertError;
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-slate-50/30">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Schedule Session</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4 text-red-500 font-medium text-sm text-center">{error}</div>
        )}

        {conflict && (
          <div className={`mx-6 mt-4 rounded-xl p-4 flex flex-col gap-2 border ${conflict.sameTime ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2.5">
              {conflict.sameTime
                ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                : <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
              <p className={`text-sm font-semibold leading-snug ${conflict.sameTime ? 'text-amber-800' : 'text-red-700'}`}>
                {conflict.sameTime
                  ? `A session with ${conflict.studentName} already starts at this time. Switch to a Group lesson to book multiple students together?`
                  : `This time overlaps with ${conflict.studentName}'s session. Please choose a different time.`}
              </p>
            </div>
            {conflict.sameTime && (
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, type: 'Group', student_ids: [], student_id: '' }));
                  setConflict(null);
                }}
                className="self-start ml-6 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Switch to Group Lesson
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto hide-scrollbar">

            {/* Segmented Control - Lesson Type */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 shadow-inner">
              {['Private', 'Group', 'Clinic'].map(type => (
                <button
                  key={type} type="button"
                  onClick={() => setForm(prev => ({ ...prev, type, student_id: '', student_ids: [] }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    form.type === type 
                      ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className={form.type === type ? 'text-primary' : 'text-slate-400 opacity-60'}>
                    {TYPE_ICONS[type] && React.cloneElement(TYPE_ICONS[type], { size: 16, strokeWidth: 2.5 })}
                  </span>
                  {type}
                </button>
              ))}
            </div>

            {/* Student Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isMulti ? 'Select Students' : 'Select Student'}
              </label>

              {isMulti ? (
                <div ref={dropdownRef} className="relative">
                  {/* Selected tags */}
                  {selectedStudentObjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedStudentObjects.map(s => (
                        <span key={s.id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 bg-primary/10 text-primary text-[11px] font-bold tracking-wide rounded-full border border-primary/20">
                          {s.full_name}
                          <button type="button" onClick={() => removeStudent(s.id)} className="size-4 ml-0.5 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors">
                            <X size={10} strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add students to roster..."
                      value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl text-sm font-medium text-slate-900 outline-none border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-normal"
                    />
                  </div>

                  {/* Dropdown list */}
                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                      {filteredStudents.length === 0 ? (
                         <p className="px-4 py-3 text-xs font-semibold text-slate-400">No students found matching your search</p>
                      ) : (
                        filteredStudents.map(s => {
                          const checked = form.student_ids.includes(s.id);
                          return (
                            <button
                              key={s.id} type="button"
                              onClick={() => { toggleStudent(s.id); setStudentSearch(''); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-slate-50 ${checked ? 'bg-primary/5' : ''}`}
                            >
                              <div className={`size-[18px] rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors ${checked ? 'bg-primary border-primary shadow-sm shadow-primary/30' : 'border-slate-300'}`}>
                                {checked && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                              <span className={`font-semibold ${checked ? 'text-primary' : 'text-slate-700'}`}>
                                {s.full_name}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={form.student_id}
                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="" disabled>Choose a student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              )}
            </div>

            {/* Condensed Grid Row for Time/Space logistics */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              
              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => { setForm({ ...form, date: e.target.value }); setConflict(null); }}
                  className="w-full h-11 px-3.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900 outline-none border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-left"
                  required
                />
              </div>

              {/* Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time</label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => { setForm({ ...form, time: e.target.value }); setConflict(null); }}
                    className="w-full h-11 pl-9 pr-3.5 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900 outline-none border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</label>
                <div className="relative">
                  <select
                    value={form.duration_minutes}
                    onChange={e => { setForm({ ...form, duration_minutes: Number(e.target.value) }); setConflict(null); }}
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900 outline-none border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                  >
                    {[30, 45, 60, 75, 90, 120].map(m => (
                      <option key={m} value={m}>{m} minutes</option>
                    ))}
                  </select>
                  <Timer size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Court */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</label>
                {isPro ? (
                  <div className="relative">
                    <select
                      value={form.court_id}
                      onChange={e => setForm({ ...form, court_id: e.target.value })}
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 rounded-xl text-sm font-semibold text-slate-900 outline-none border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select court</option>
                      {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <LayoutGrid size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                ) : (
                  <div className="relative h-11 px-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">
                      {courts[0]?.name || 'Default Court'}
                    </span>
                    <Lock size={14} className="text-slate-400" />
                  </div>
                )}
              </div>

            </div>

            {/* Advanced Options (Recurring) */}
            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary flex items-center gap-1.5 transition-colors"
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced (Recurring)
              </button>
            </div>

            {showAdvanced && (
              <div className="flex flex-col gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">Repeat Lesson</label>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        form.is_recurring ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block size-5 rounded-full bg-white shadow transform transition-transform ${
                          form.is_recurring ? 'translate-x-5' : 'translate-x-1'
                      }`}/>
                    </button>
                  </div>

                  {form.is_recurring && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[ 
                        { value: 'weekly', label: 'Every week', icon: <Repeat size={18} className="mb-1.5" /> },
                        { value: 'bi-weekly', label: 'Every 2 weeks', icon: <Repeat1 size={18} className="mb-1.5" /> },
                        { value: 'monthly', label: 'Every month', icon: <RefreshCw size={18} className="mb-1.5" /> },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, recurring_pattern: opt.value }))}
                          className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border-2 text-center transition-all ${
                            form.recurring_pattern === opt.value
                              ? 'border-primary bg-white text-primary shadow-[0_2px_10px_rgba(102,179,25,0.1)]'
                              : 'border-transparent bg-white/60 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          {opt.icon}
                          <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 h-11 rounded-xl text-sm text-slate-600 font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-8 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm tracking-wide hover:bg-primary transition-colors flex items-center justify-center gap-2 shadow-sm">
              {loading
                ? <Loader2 size={18} className="animate-spin" />
                : <CheckCircle2 size={16} />}
              {isMulti && form.student_ids.length > 1
                ? `Book ${form.student_ids.length} Sessions`
                : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
