import React, { useState, useEffect } from 'react';
import { X, Search, GripVertical, Clock, ChevronUp, ChevronDown, Trash2, Plus, CalendarDays, Dumbbell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import DrillCard from './DrillCard';

export default function SessionPlanBuilder({ session, programId, onClose, onSaved, editPlan = null }) {
  const [drills, setDrills] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedDrills, setSelectedDrills] = useState(editPlan?.drills || []);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: editPlan?.title || '',
    scheduled_date: editPlan?.scheduled_date || '',
  });

  const CATEGORIES = ['All', 'Serve', 'Return', 'Footwork', 'Net Play', 'Baseline', 'Fitness', 'Mental', 'Match'];

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    const { data } = await supabase
      .from('drills')
      .select('*')
      .or(`coach_id.eq.${session.user.id},is_preset.eq.true`)
      .order('name');
    setDrills(data || []);
  };

  const filteredDrills = drills.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || d.category === categoryFilter;
    const notAdded = !selectedDrills.find(sd => sd.drill_id === d.id);
    return matchSearch && matchCat && notAdded;
  });

  const addDrill = (drill) => {
    setSelectedDrills(prev => [...prev, {
      drill_id: drill.id,
      drill,
      duration_override_mins: drill.duration_mins || 10,
      coach_notes: '',
      order_index: prev.length,
    }]);
  };

  const removeDrill = (index) => {
    setSelectedDrills(prev => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, order_index: i })));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setSelectedDrills(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((d, i) => ({ ...d, order_index: i }));
    });
  };

  const moveDown = (index) => {
    setSelectedDrills(prev => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((d, i) => ({ ...d, order_index: i }));
    });
  };

  const updateSelected = (index, key, val) => {
    setSelectedDrills(prev => prev.map((d, i) => i === index ? { ...d, [key]: val } : d));
  };

  const totalDuration = selectedDrills.reduce((sum, d) => sum + (parseInt(d.duration_override_mins) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDrills.length === 0) { alert('Add at least one drill to the plan.'); return; }
    setLoading(true);
    try {
      let planId = editPlan?.id;
      const planPayload = {
        program_id: programId,
        coach_id: session.user.id,
        title: form.title,
        scheduled_date: form.scheduled_date || null,
        total_duration_mins: totalDuration,
      };

      if (editPlan) {
        const { error } = await supabase.from('session_plans').update(planPayload).eq('id', editPlan.id);
        if (error) throw error;
        await supabase.from('session_plan_drills').delete().eq('session_plan_id', editPlan.id);
      } else {
        const { data, error } = await supabase.from('session_plans').insert([planPayload]).select().single();
        if (error) throw error;
        planId = data.id;
      }

      const drillRows = selectedDrills.map((sd, i) => ({
        session_plan_id: planId,
        drill_id: sd.drill_id,
        order_index: i,
        duration_override_mins: parseInt(sd.duration_override_mins) || 0,
        coach_notes: sd.coach_notes || null,
      }));
      const { error: drillErr } = await supabase.from('session_plan_drills').insert(drillRows);
      if (drillErr) throw drillErr;

      onSaved();
    } catch (err) {
      alert('Error saving plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">{editPlan ? 'Edit Session Plan' : 'New Session Plan'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          
          {/* Left: Drill Library Picker */}
          <div className="sm:w-80 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col max-h-64 sm:max-h-none">
            <div className="p-3 border-b border-slate-100 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Drill Library</p>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search drills…"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${categoryFilter === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {filteredDrills.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No drills found</p>
              ) : (
                filteredDrills.map(d => (
                  <DrillCard key={d.id} drill={d} onAdd={addDrill} compact />
                ))
              )}
            </div>
          </div>

          {/* Right: Plan Builder */}
          <form id="plan-form" onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 shrink-0 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Week 1 – Serve Clinic"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1"><CalendarDays size={11} /> Date</span>
                  </label>
                  <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              {/* Duration summary */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
                <Clock size={13} className="text-primary shrink-0" />
                <span className="text-xs font-bold text-primary">{totalDuration} min total</span>
                <span className="text-xs text-slate-400 ml-auto">{selectedDrills.length} drill{selectedDrills.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {selectedDrills.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <Plus size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Add drills from the library</p>
                  <p className="text-xs text-slate-400 mt-1">Click + on any drill to add it to this plan</p>
                </div>
              ) : (
                selectedDrills.map((sd, i) => (
                  <div key={`${sd.drill_id}-${i}`} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                          className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors">
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" onClick={() => moveDown(i)} disabled={i === selectedDrills.length - 1}
                          className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 w-4 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{sd.drill.name}</p>
                        {sd.drill.category && (
                          <p className="text-[10px] text-slate-400">{sd.drill.category}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock size={12} className="text-slate-400" />
                        <input
                          type="number" min="1" max="120" value={sd.duration_override_mins}
                          onChange={e => updateSelected(i, 'duration_override_mins', e.target.value)}
                          className="w-12 px-1 py-0.5 text-center text-xs border border-slate-200 rounded-lg bg-white focus:border-primary outline-none"
                        />
                        <span className="text-[10px] text-slate-400">m</span>
                      </div>
                      <button type="button" onClick={() => removeDrill(i)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text" value={sd.coach_notes}
                      onChange={e => updateSelected(i, 'coach_notes', e.target.value)}
                      placeholder="Coach notes for this drill…"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-primary outline-none text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !form.title || selectedDrills.length === 0}
                className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm border-none cursor-pointer">
                {loading ? 'Saving…' : editPlan ? 'Save Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
