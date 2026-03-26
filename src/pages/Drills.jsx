import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Plus, Search, Dumbbell, X, BookOpen, Clock, Video, ChevronRight, Map, Lock } from 'lucide-react';
import DrillCard, { CourtThumb } from '../components/DrillCard';
import CourtDrawer from '../components/CourtDrawer';
import { PRESET_DRILLS, CATEGORIES, DIFFICULTIES } from '../data/drillsData';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeModal from '../components/UpgradeModal';

const ALL_CATEGORIES = ['All', ...CATEGORIES];
const ALL_DIFFICULTIES = ['All', ...DIFFICULTIES];
const FOCUS_AREAS = ['All', 'Technique', 'Conditioning', 'Match Play', 'Tactics', 'Mental Game', 'Agility', 'Placement', 'Positioning', 'Consistency', 'Footwork'];

const EMPTY_FORM = {
  name: '', category: '', focus_area: '', difficulty: '', duration_mins: '', description: '', video_url: '', tags: '', svg: '',
};

export default function Drills() {
  const { session } = useOutletContext();
  const [tab, setTab] = useState('library');
  const [myDrills, setMyDrills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { isPro } = useSubscription();
  const FREE_DRILL_LIMIT = 25;

  useEffect(() => { if (session) fetchMyDrills(); }, [session]);

  const fetchMyDrills = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('drills')
      .select('*')
      .eq('coach_id', session.user.id)
      .order('name');
    setMyDrills(data || []);
    setLoading(false);
  };

  const sourceList = tab === 'library' ? PRESET_DRILLS : myDrills;

  const allFiltered = sourceList.filter(d => {
    const s = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(search.toLowerCase());
    const c = category === 'All' || d.category === category;
    const diff = difficulty === 'All' || d.difficulty === difficulty;
    return s && c && diff;
  });
  // Limit preset drills to 50 for free users
  const filtered = (tab === 'library' && !isPro)
    ? allFiltered.slice(0, FREE_DRILL_LIMIT)
    : allFiltered;
  const showDrillUpgradeBanner = tab === 'library' && !isPro && allFiltered.length >= FREE_DRILL_LIMIT;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('drills').insert([{
        ...form,
        duration_mins: parseInt(form.duration_mins) || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        coach_id: session.user.id,
        is_preset: false,
      }]);
      if (error) throw error;
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchMyDrills();
      setTab('my');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const DrillFilters = ({ mobile = false }) => (
    <div className={`space-y-2 ${mobile ? '' : ''}`}>
      <div className="flex gap-2">
        <button onClick={() => setTab('library')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'library' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
          📚 Library ({PRESET_DRILLS.length})
        </button>
        <button onClick={() => setTab('my')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'my' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
          🎯 My Drills ({myDrills.length})
        </button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ALL_CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${category === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ALL_DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${difficulty === d ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24">
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200">
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-slate-900">Drill Library</h2>
          <div className="w-10" />
        </div>

        <div className="p-4 space-y-3 bg-white border-b border-slate-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drills…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <DrillFilters mobile />
        </div>

        <div className="p-4 space-y-3">
          {loading && tab === 'my' ? (
            <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <Dumbbell size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No drills found</p>
              {tab === 'my' && <p className="text-xs text-slate-400 mt-1">Tap + to create your first custom drill</p>}
            </div>
          ) : (
            filtered.map(d => <DrillCard key={d.id} drill={d} onClick={() => setSelectedDrill(d)} />)
          )}
          {/* Upgrade banner after 25 drills for free users */}
          {showDrillUpgradeBanner && (
            <div className="mx-0 px-4 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">🔒 Showing 25 of {allFiltered.length} drills</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Upgrade to Pro to unlock all {PRESET_DRILLS.length}+</p>
              </div>
              <button onClick={() => setUpgradeOpen(true)} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shrink-0">Upgrade</button>
            </div>
          )}
        </div>

        <button onClick={() => isPro ? setShowModal(true) : setUpgradeOpen(true)}
          className="fixed bottom-[100px] right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50">
          {isPro ? <Plus size={24} strokeWidth={2.5} /> : <Lock size={22} strokeWidth={2.5} />}
        </button>
      </div>

      {/* ═══════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-16 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Training</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Drill Library</h1>
              <p className="text-sm text-slate-400 mt-1">{PRESET_DRILLS.length} preset drills + {myDrills.length} custom</p>
            </div>
            <button onClick={() => isPro ? setShowModal(true) : setUpgradeOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              {isPro ? <Plus size={16} strokeWidth={2.5} /> : <Lock size={16} strokeWidth={2.5} />}
              {isPro ? 'Create Drill' : 'Pro Feature'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                <button onClick={() => setTab('library')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  📚 Preset Library ({PRESET_DRILLS.length})
                </button>
                <button onClick={() => setTab('my')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${tab === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  🎯 My Drills ({myDrills.length})
                </button>
              </div>
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drills…"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {ALL_CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${category === c ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 ml-auto flex-wrap">
                {ALL_DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${difficulty === d ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && tab === 'my' ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Dumbbell size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-500">No drills found</p>
              {tab === 'my' && <p className="text-sm text-slate-400 mt-1">Click "Create Drill" to add your first custom drill</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(d => <DrillCard key={d.id} drill={d} onClick={() => setSelectedDrill(d)} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Drill Detail Modal ── */}
      {selectedDrill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedDrill(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{selectedDrill.name}</h3>
              <button onClick={() => setSelectedDrill(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 flex gap-4">
              <div className="shrink-0">
                <CourtThumb overlay={selectedDrill.svg} width={90} height={205} />
              </div>
              <div className="flex-1 min-w-0">
                {selectedDrill.description && <p className="text-sm text-slate-600 mb-4 leading-relaxed">{selectedDrill.description}</p>}
                <div className="flex flex-wrap gap-2">
                  {selectedDrill.category && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{selectedDrill.category}</span>}
                  {selectedDrill.difficulty && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{selectedDrill.difficulty}</span>}
                  {selectedDrill.focus_area && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">{selectedDrill.focus_area}</span>}
                  {selectedDrill.duration_mins && (
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                      <Clock size={11} /> {selectedDrill.duration_mins} min
                    </span>
                  )}
                </div>
                {selectedDrill.video_url && (
                  <a href={selectedDrill.video_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-4">
                    <Video size={15} /> Watch reference video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Drill Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-800">Create Custom Drill</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {showDrawer ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setShowDrawer(false)} className="text-slate-500 hover:text-primary transition-colors text-sm flex items-center gap-1">
                      ← Back
                    </button>
                    <h3 className="text-sm font-bold text-slate-700">Draw Court Diagram</h3>
                  </div>
                  <CourtDrawer
                    onSave={(svg) => { set('svg', svg); setShowDrawer(false); }}
                    onCancel={() => setShowDrawer(false)}
                  />
                </div>
              ) : (
                <form id="drill-form" onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Name *</label>
                    <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cross-Court Rally"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
                      <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                        <option value="">None</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Difficulty</label>
                      <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                        <option value="">None</option>
                        {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Focus Area</label>
                      <select value={form.focus_area} onChange={e => set('focus_area', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                        <option value="">None</option>
                        {FOCUS_AREAS.filter(f => f !== 'All').map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Duration (min)</label>
                      <input type="number" min="1" max="120" value={form.duration_mins} onChange={e => set('duration_mins', e.target.value)} placeholder="15"
                        className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe this drill…" rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" />
                  </div>

                  {/* Court Diagram */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Court Diagram</label>
                    {form.svg ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <CourtThumb overlay={form.svg} width={40} height={92} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700">Diagram saved ✓</p>
                          <button type="button" onClick={() => setShowDrawer(true)}
                            className="text-xs text-primary hover:underline">Edit diagram</button>
                        </div>
                        <button type="button" onClick={() => set('svg', '')} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowDrawer(true)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 text-sm font-semibold text-slate-500 hover:text-primary flex items-center justify-center gap-2 transition-all">
                        <Map size={16} /> Draw Court Diagram (optional)
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Video URL (optional)</label>
                    <input type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/…"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                </form>
              )}
            </div>
            {!showDrawer && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" form="drill-form" disabled={submitting || !form.name}
                  className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm border-none cursor-pointer">
                  {submitting ? 'Saving…' : 'Create Drill'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="Custom Drills & Full Library" />
    </>
  );
}
