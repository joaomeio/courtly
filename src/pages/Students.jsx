import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import AddStudentModal from '../components/AddStudentModal';
import { Search, UserPlus, Calendar, History, ArrowRight, Plus, ExternalLink, TrendingUp, Clock, Star, ChevronRight, Lock } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeModal from '../components/UpgradeModal';

const levelColors = {
  Beginner: 'bg-emerald-100 text-emerald-600',
  Intermediate: 'bg-orange-100 text-orange-600',
  Advanced: 'bg-blue-100 text-blue-600',
  Elite: 'bg-purple-100 text-purple-600',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const FREE_LIMIT = 5;
  const atLimit = !isPro && students.length >= FREE_LIMIT;

  const handleAddStudent = () => {
    if (atLimit) { setUpgradeOpen(true); return; }
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`*, lessons(start_time)`)
        .eq('status', 'Active')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAdded = (newStudent) => {
    setStudents(prev => [...prev, newStudent].sort((a, b) => a.full_name.localeCompare(b.full_name)));
  };

  const getLastLesson = (lessonsArray) => {
    if (!lessonsArray || lessonsArray.length === 0) return null;
    const past = lessonsArray
      .map(l => parseISO(l.start_time))
      .filter(d => d <= new Date())
      .sort((a, b) => b.getTime() - a.getTime());
    return past[0] ? format(past[0], 'MMM d, yyyy') : null;
  };

  const getNextLesson = (lessonsArray) => {
    if (!lessonsArray || lessonsArray.length === 0) return null;
    const futureLessons = lessonsArray
      .map(l => parseISO(l.start_time))
      .filter(date => date >= new Date())
      .sort((a, b) => a.getTime() - b.getTime());
    return futureLessons[0] ? format(futureLessons[0], 'MMM d, h:mm a') : null;
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(search.toLowerCase());
    const level = s.experience_level || 'Intermediate';
    const matchesFilter = filter === 'All' || level === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'];

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative">
        {/* Header with Search */}
        <div className="bg-white p-4 border-b border-primary/10 sticky top-0 z-20 shadow-sm">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search students by name"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto hide-scrollbar bg-white shadow-sm sticky top-[80px] z-10 border-b border-slate-200">
          <div className="flex px-4 gap-8 whitespace-nowrap pt-2">
            {['All', 'Beginner', 'Intermediate', 'Advanced', 'Elite'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${filter === t ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-primary'}`}
              >
                <p className="text-sm font-bold leading-normal tracking-wide">{t}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        <main className="flex-1 p-4 space-y-4 pb-28">
          {filteredStudents.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No students found.
            </div>
          ) : (
            filteredStudents.map(student => {
              const nextTime = getNextLesson(student.lessons);
              const level = student.experience_level || 'Intermediate';
              const badgeClass = levelColors[level] || levelColors.Intermediate;
              return (
                <Link to={`/students/${student.id}`} key={student.id} className="block">
                  <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 items-center justify-between transition-transform hover:-translate-y-1 hover:border-primary/50 hover:shadow-md cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 flex items-center justify-center rounded-full h-14 w-14 text-xl font-bold text-slate-600 border border-slate-200">
                        {student.full_name?.charAt(0)}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-900 text-base font-bold leading-tight">{student.full_name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest ${badgeClass}`}>
                            {level}
                          </span>
                        </div>
                        {nextTime ? (
                          <p className="text-primary text-xs font-bold leading-normal mt-1 flex items-center gap-1">
                            <Calendar size={13} strokeWidth={2.5} /> {nextTime}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-xs font-medium leading-normal mt-1 flex items-center gap-1">
                            <History size={13} /> No upcoming lesson
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={handleAddStudent}
          className={`fixed bottom-[100px] right-6 size-14 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50 ${atLimit ? 'bg-slate-400 shadow-slate-400/30' : 'bg-primary shadow-primary/30'}`}
        >
          {atLimit ? <Lock size={22} strokeWidth={2.5} /> : <UserPlus size={24} strokeWidth={2.5} />}
        </button>
      </div>
      {/* Free plan limit banner (mobile) */}
      {!isPro && (
        <div className="lg:hidden mx-4 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-amber-700">{students.length} / {FREE_LIMIT} students used</p>
          {atLimit && <button onClick={() => setUpgradeOpen(true)} className="text-xs font-bold text-primary shrink-0">Upgrade →</button>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT — only shown on lg+ screens
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          {/* Page Header */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Active Roster</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Students</h1>
            </div>
            <button
            onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              New Student
            </button>
          </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  filter === f
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skill Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Lesson</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Lesson</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const level = student.experience_level || 'Intermediate';
                  const badgeClass = levelColors[level] || levelColors.Intermediate;
                  const lastLesson = getLastLesson(student.lessons);
                  const nextLesson = getNextLesson(student.lessons);
                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => navigate(`/students/${student.id}`)}
                      className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {student.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{student.full_name}</p>
                            <p className="text-xs text-slate-500">{student.phone || student.notes || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${badgeClass}`}>
                          {level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {lastLesson || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {nextLesson ? (
                          <span className="text-primary font-bold bg-primary/10 px-2 py-1 rounded-md">{nextLesson}</span>
                        ) : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/students/${student.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                        >
                          <ExternalLink size={14} strokeWidth={2.5} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Students</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900">{students.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Needs Scheduling</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900">
                {students.filter(s => !getNextLesson(s.lessons)).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Star size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advanced / Elite</p>
              <p className="text-2xl font-bold mt-0.5 text-slate-900">
                {students.filter(s => ['Advanced', 'Elite'].includes(s.experience_level)).length}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={handleStudentAdded}
      />
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="Unlimited Students" />
    </>
  );
}
