import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { supabase } from '../supabaseClient';

const GOALS = [
  'Improve Serve', 'Improve Return', 'Net Play Development', 'Footwork & Agility',
  'Match Play Preparation', 'Fitness & Conditioning', 'Beginner Foundation', 'Tournament Prep',
];

export default function ProgramModal({ session, onClose, onSaved, editProgram = null }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: editProgram?.name || '',
    student_id: editProgram?.student_id || '',
    goal: editProgram?.goal || '',
    description: editProgram?.description || '',
    start_date: editProgram?.start_date || '',
    end_date: editProgram?.end_date || '',
    is_template: editProgram?.is_template || false,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('coach_id', session.user.id)
      .order('full_name');
    setStudents(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, coach_id: session.user.id };
      if (!payload.student_id) delete payload.student_id;
      if (!payload.start_date) delete payload.start_date;
      if (!payload.end_date) delete payload.end_date;

      let error;
      if (editProgram) {
        ({ error } = await supabase.from('programs').update(payload).eq('id', editProgram.id));
      } else {
        ({ error } = await supabase.from('programs').insert([payload]));
      }
      if (error) throw error;
      onSaved();
    } catch (err) {
      alert('Error saving program: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {editProgram ? 'Edit Program' : 'New Training Program'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 p-5">
          <form id="program-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Program Name *</label>
              <input
                type="text" required value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Summer Serve Improvement"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Student</label>
              <select
                value={form.student_id} onChange={e => set('student_id', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all appearance-none"
              >
                <option value="">No student (template)</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Training Goal</label>
              <select
                value={form.goal} onChange={e => set('goal', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all appearance-none"
              >
                <option value="">Select a goal…</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
              <textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the program objectives and approach…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Start Date</label>
                <input
                  type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">End Date</label>
                <input
                  type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox" checked={form.is_template} onChange={e => set('is_template', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Save as Template</p>
                <p className="text-xs text-slate-500">Reuse this program structure for future students</p>
              </div>
            </label>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="program-form" disabled={loading || !form.name}
            className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm border-none cursor-pointer">
            {loading ? 'Saving…' : editProgram ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
}
