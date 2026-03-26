import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { format, addDays } from 'date-fns';
import { User, Users, Zap, X, Search, Check, ChevronDown, LayoutGrid, Timer, Clock, Repeat, Repeat1, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';

const TYPE_ICONS = { Private: <User size={24} />, Group: <Users size={24} />, Clinic: <Zap size={24} /> };

export default function BookingModal({ isOpen, onClose, session }) {
  const [students, setStudents] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        supabase.from('students').select('id, full_name').eq('status', 'Active').order('full_name'),
        supabase.from('courts').select('id, name').order('name'),
      ]);
      if (studentsRes.error) throw studentsRes.error;
      if (courtsRes.error) throw courtsRes.error;
      setStudents(studentsRes.data || []);
      setCourts(courtsRes.data || []);
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

      if (isMulti) {
        // Insert one lesson per selected student
        const rows = form.student_ids.map(student_id => ({
          coach_id: session.user.id,
          student_id,
          court_id: form.court_id,
          type: form.type,
          start_time,
          duration_minutes: form.duration_minutes,
          is_recurring: form.is_recurring,
          recurring_pattern: form.is_recurring ? form.recurring_pattern : null,
        }));
        const { error: insertError } = await supabase.from('lessons').insert(rows);
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
      <div className="relative w-full max-w-lg bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
          <h2 className="text-xl font-bold text-slate-800">Schedule New Session</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="px-6 pt-4 text-red-500 font-medium text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

            {/* Lesson Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Lesson Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Private', 'Group', 'Clinic'].map(type => (
                  <button
                    key={type} type="button"
                    onClick={() => setForm(prev => ({ ...prev, type, student_id: '', student_ids: [] }))}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${form.type === type ? 'border-primary bg-primary/10 text-slate-900' : 'border-transparent bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                  >
                    <div className="mb-1">{TYPE_ICONS[type]}</div>
                    <span className="text-xs font-medium">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Student Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {isMulti ? 'Students' : 'Student'}
                {isMulti && form.student_ids.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full font-bold">
                    {form.student_ids.length} selected
                  </span>
                )}
              </label>

              {isMulti ? (
                <div ref={dropdownRef} className="relative">
                  {/* Selected tags */}
                  {selectedStudentObjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedStudentObjects.map(s => (
                        <span key={s.id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-primary/15 text-slate-800 text-xs font-semibold rounded-full">
                          {s.full_name}
                          <button type="button" onClick={() => removeStudent(s.id)} className="size-4 rounded-full hover:bg-primary/30 flex items-center justify-center transition-colors">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search and add students..."
                      value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-9 pr-4 h-11 bg-slate-50 rounded-lg text-sm text-slate-900 outline-none border-2 border-transparent focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {/* Dropdown list */}
                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-400">No students found</p>
                      ) : (
                        filteredStudents.map(s => {
                          const checked = form.student_ids.includes(s.id);
                          return (
                            <button
                              key={s.id} type="button"
                              onClick={() => { toggleStudent(s.id); setStudentSearch(''); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-primary/5 ${checked ? 'bg-primary/10' : ''}`}
                            >
                              <div className={`size-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${checked ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                {checked && <Check size={14} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className={`font-medium ${checked ? 'text-slate-900' : 'text-slate-700'}`}>
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
                // Private — single select dropdown
                <div className="relative">
                  <select
                    value={form.student_id}
                    onChange={e => setForm({ ...form, student_id: e.target.value })}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-slate-900 focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              )}
            </div>

            {/* Court */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Court</label>
                <div className="relative">
                  <select
                    value={form.court_id}
                    onChange={e => setForm({ ...form, court_id: e.target.value })}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-slate-900 focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Court</option>
                    {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <LayoutGrid size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Duration</label>
                <div className="relative">
                  <select
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 border-none rounded-lg text-slate-900 focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                  >
                    {[30, 45, 60, 75, 90, 120].map(m => (
                      <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}`}</option>
                    ))}
                  </select>
                  <Timer size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
            </div>

            {/* Date picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x hide-scrollbar">
                  {dates.map((d, i) => {
                    const val = format(d, 'yyyy-MM-dd');
                    const isSelected = form.date === val;
                    return (
                      <button
                        key={i} type="button"
                        onClick={() => setForm({ ...form, date: val })}
                        className={`min-w-[48px] flex flex-col items-center p-2 rounded-xl transition-colors snap-center ${isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-slate-200'}`}
                      >
                        <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{format(d, 'EEE')}</span>
                        <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{format(d, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time — free input + quick picks */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Time</label>

              {/* Free-form time input */}
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-lg text-slate-900 outline-none border-2 border-transparent focus:border-primary/40 transition-colors text-sm font-medium"
                  required
                />
              </div>

              {/* Quick-pick suggestions */}
              <div className="flex flex-wrap gap-2">
                {quickTimes.map(t => {
                  const [h] = t.split(':');
                  const hour = parseInt(h, 10);
                  const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
                  const isSelected = form.time === t;
                  return (
                    <button
                      key={t} type="button"
                      onClick={() => setForm({ ...form, time: t })}
                      className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-colors ${isSelected ? 'border-primary bg-primary/10 text-slate-900' : 'border-transparent bg-slate-50 text-slate-600 hover:border-slate-200'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm font-bold text-slate-500 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <ChevronDown size={16} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                {/* Repeat / Recurring */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Repeat Lesson</label>
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, is_recurring: !prev.is_recurring }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        form.is_recurring ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block size-5 rounded-full bg-white shadow transform transition-transform ${
                          form.is_recurring ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {form.is_recurring && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[ 
                        { value: 'weekly', label: 'Every week', icon: <Repeat size={20} className="mb-1" /> },
                        { value: 'bi-weekly', label: 'Every 2 weeks', icon: <Repeat1 size={20} className="mb-1" /> },
                        { value: 'monthly', label: 'Every month', icon: <RefreshCw size={20} className="mb-1" /> },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, recurring_pattern: opt.value }))}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                            form.recurring_pattern === opt.value
                              ? 'border-primary bg-white text-slate-900 shadow-sm'
                              : 'border-transparent bg-white/60 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          {opt.icon}
                          <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* Footer */}
          <div className="px-6 py-5 bg-slate-50 flex flex-col sm:flex-row gap-3 border-t border-primary/10">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-lg bg-slate-200 text-slate-600 font-semibold hover:bg-slate-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 h-12 rounded-lg bg-primary text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {loading
                ? <Loader2 size={24} className="animate-spin" />
                : <CheckCircle2 size={20} />}
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
