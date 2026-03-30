import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Plus, BookOpen, ChevronRight, Search, Target, Calendar, User } from 'lucide-react';
import ProgramModal from '../components/ProgramModal';
import ProGate from '../components/ProGate';

const GOAL_COLORS = {
  'Improve Serve': 'bg-violet-50 text-violet-700',
  'Improve Return': 'bg-sky-50 text-sky-700',
  'Net Play Development': 'bg-teal-50 text-teal-700',
  'Footwork & Agility': 'bg-orange-50 text-orange-700',
  'Match Play Preparation': 'bg-yellow-50 text-yellow-700',
  'Fitness & Conditioning': 'bg-pink-50 text-pink-700',
  'Beginner Foundation': 'bg-emerald-50 text-emerald-700',
  'Tournament Prep': 'bg-rose-50 text-rose-700',
};

function ProgramCard({ program, onClick }) {
  const completedSessions = (program.session_plans || []).filter(sp => sp.is_completed).length;
  const totalSessions = (program.session_plans || []).length;
  const pct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const goalColor = GOAL_COLORS[program.goal] || 'bg-slate-100 text-slate-600';

  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <BookOpen size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">{program.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {program.students && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <User size={10} /> {program.students.full_name}
              </span>
            )}
            {!program.student_id && (
              <span className="text-xs text-slate-400 italic">Template</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors mt-1 shrink-0" />
      </div>

      {program.goal && (
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${goalColor}`}>
          <span className="flex items-center gap-1"><Target size={9} /> {program.goal}</span>
        </span>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500 font-medium">{completedSessions}/{totalSessions} sessions</span>
          <span className="font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {(program.start_date || program.end_date) && (
        <div className="flex items-center gap-1 mt-3 text-[11px] text-slate-400">
          <Calendar size={10} />
          {program.start_date && <span>{new Date(program.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
          {program.start_date && program.end_date && <span>→</span>}
          {program.end_date && <span>{new Date(program.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
        </div>
      )}
    </div>
  );
}

export default function Programs() {
  const { session } = useOutletContext();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');

  useEffect(() => { if (session) fetchPrograms(); }, [session]);

  const fetchPrograms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('programs')
      .select('*, students(full_name), session_plans(id, is_completed)')
      .eq('coach_id', session.user.id)
      .order('created_at', { ascending: false });
    setPrograms(data || []);
    setLoading(false);
  };

  const filtered = programs.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.students?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const isTemplate = p.is_template;
    if (tab === 'templates') return matchSearch && isTemplate;
    return matchSearch && !isTemplate;
  });

  return (
    <ProGate feature="Training Programs" description="Build structured multi-week training programs and assign them to students. Available on Pro.">
      <>
      {/* ═══════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24">
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-slate-900">Programs</h2>
          <div className="w-10" />
        </div>

        <div className="p-4 space-y-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('active')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'active' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
              Active
            </button>
            <button onClick={() => setTab('templates')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'templates' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
              Templates
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No programs yet</p>
              <p className="text-xs text-slate-400 mt-1">Tap + to create your first training program</p>
            </div>
          ) : (
            filtered.map(p => (
              <Link key={p.id} to={`/programs/${p.id}`}>
                <ProgramCard program={p} />
              </Link>
            ))
          )}
        </div>

        <button onClick={() => setShowModal(true)}
          className="fixed bottom-[100px] right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50">
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Training</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Training Programs</h1>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              <Plus size={16} strokeWidth={2.5} />
              New Program
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                <button onClick={() => setTab('active')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Active Programs
                </button>
                <button onClick={() => setTab('templates')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'templates' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Templates
                </button>
              </div>
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or student…"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-500">No programs yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "New Program" to create your first training program</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(p => (
                <Link key={p.id} to={`/programs/${p.id}`}>
                  <ProgramCard program={p} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <ProgramModal session={session} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchPrograms(); }} />
      )}
      </>
    </ProGate>
  );
}
