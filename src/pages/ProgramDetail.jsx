import React, { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Plus, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Pencil, Trash2, CalendarDays, Target, MoreHorizontal } from 'lucide-react';
import SessionPlanBuilder from '../components/SessionPlanBuilder';
import ProgramModal from '../components/ProgramModal';

export default function ProgramDetail() {
  const { id } = useParams();
  const { session } = useOutletContext();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => { if (session) { fetchProgram(); fetchPlans(); } }, [session, id]);

  const fetchProgram = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*, students(full_name)')
      .eq('id', id)
      .single();
    setProgram(data);
  };

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('session_plans')
      .select('*, session_plan_drills(*, drills(*))')
      .eq('program_id', id)
      .order('scheduled_date', { ascending: true, nullsLast: true });
    setPlans(data || []);
    setLoading(false);
  };

  const toggleComplete = async (plan) => {
    const { error } = await supabase
      .from('session_plans')
      .update({ is_completed: !plan.is_completed })
      .eq('id', plan.id);
    if (!error) fetchPlans();
  };

  const deletePlan = async (planId) => {
    if (!window.confirm('Delete this session plan?')) return;
    await supabase.from('session_plans').delete().eq('id', planId);
    fetchPlans();
  };

  const deleteProgram = async () => {
    if (!window.confirm('Delete this entire program? All session plans will be lost.')) return;
    await supabase.from('programs').delete().eq('id', id);
    navigate('/programs');
  };

  const completedCount = plans.filter(p => p.is_completed).length;
  const pct = plans.length > 0 ? Math.round((completedCount / plans.length) * 100) : 0;

  const PlanCard = ({ plan }) => {
    const isExpanded = expandedPlan === plan.id;
    const drills = (plan.session_plan_drills || []).sort((a, b) => a.order_index - b.order_index);

    return (
      <div className={`bg-white rounded-xl border transition-all overflow-hidden ${plan.is_completed ? 'border-primary/30 opacity-80' : 'border-slate-200'} shadow-sm`}>
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => toggleComplete(plan)}
            className={`shrink-0 transition-colors ${plan.is_completed ? 'text-primary' : 'text-slate-300 hover:text-primary'}`}>
            {plan.is_completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${plan.is_completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
              {plan.title}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              {plan.scheduled_date && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <CalendarDays size={10} />
                  {new Date(plan.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
              {plan.total_duration_mins > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock size={10} /> {plan.total_duration_mins} min
                </span>
              )}
              <span className="text-[11px] text-slate-400">{drills.length} drill{drills.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { setEditPlan(plan); setShowBuilder(true); }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => deletePlan(plan.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 transition-colors">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isExpanded && drills.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50">
            {drills.map((sd, i) => (
              <div key={sd.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-none">
                <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{sd.drills?.name || 'Unknown Drill'}</p>
                  {sd.coach_notes && <p className="text-[11px] text-slate-400 truncate">{sd.coach_notes}</p>}
                </div>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                  <Clock size={10} /> {sd.duration_override_mins}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!program && !loading) return <div className="p-8 text-center text-slate-500">Program not found.</div>;

  const headerContent = program && (
    <div className="space-y-4">
      {/* Program Info Card */}
      <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 p-4 lg:p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 truncate">{program.name}</h1>
            {program.students && (
              <p className="text-sm text-slate-500 mt-0.5">Student: <span className="font-semibold text-slate-700">{program.students.full_name}</span></p>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-3">
            <button onClick={() => setShowEditProgram(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
              <Pencil size={16} />
            </button>
            <button onClick={deleteProgram}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {program.goal && (
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-primary" />
            <span className="text-sm font-semibold text-slate-700">{program.goal}</span>
          </div>
        )}
        {program.description && <p className="text-sm text-slate-500 mb-4">{program.description}</p>}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-medium">{completedCount} of {plans.length} sessions completed</span>
            <span className="font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {(program.start_date || program.end_date) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <CalendarDays size={12} />
            {program.start_date && new Date(program.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {program.start_date && program.end_date && ' → '}
            {program.end_date && new Date(program.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24">
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/programs" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-base font-bold leading-tight tracking-tight flex-1 text-center text-slate-900 truncate px-2">
            {program?.name || 'Program'}
          </h2>
          <div className="w-10" />
        </div>

        <div className="p-4 space-y-4">
          {headerContent}

          {/* Session Plans */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Session Plans</h3>
            <span className="text-xs text-slate-400">{plans.length} total</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-500">No session plans yet</p>
              <p className="text-xs text-slate-400 mt-1">Tap + to build your first session plan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map(p => <PlanCard key={p.id} plan={p} />)}
            </div>
          )}
        </div>

        <button onClick={() => { setEditPlan(null); setShowBuilder(true); }}
          className="fixed bottom-[100px] right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50">
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-6">
          <div className="flex items-center gap-3">
            <Link to="/programs" className="text-slate-400 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
              <ArrowLeft size={16} /> Programs
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-600 font-semibold truncate">{program?.name}</span>
          </div>

          {headerContent}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Session Plans</h2>
            <button onClick={() => { setEditPlan(null); setShowBuilder(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              <Plus size={15} strokeWidth={2.5} />
              Add Session Plan
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-base font-semibold text-slate-500">No session plans yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "Add Session Plan" to build your first plan for this program</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map(p => <PlanCard key={p.id} plan={p} />)}
            </div>
          )}
        </div>
      </div>

      {showBuilder && (
        <SessionPlanBuilder
          session={session}
          programId={id}
          editPlan={editPlan ? { ...editPlan, drills: (editPlan.session_plan_drills || []).map(sd => ({ drill_id: sd.drill_id, drill: sd.drills, duration_override_mins: sd.duration_override_mins, coach_notes: sd.coach_notes, order_index: sd.order_index })) } : null}
          onClose={() => { setShowBuilder(false); setEditPlan(null); }}
          onSaved={() => { setShowBuilder(false); setEditPlan(null); fetchPlans(); }}
        />
      )}

      {showEditProgram && (
        <ProgramModal
          session={session}
          editProgram={program}
          onClose={() => setShowEditProgram(false)}
          onSaved={() => { setShowEditProgram(false); fetchProgram(); }}
        />
      )}
    </>
  );
}
