import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Settings, ShieldCheck, Mail, CalendarPlus, BarChart2, TrendingUp, TrendingDown, ArrowRight, ChevronRight, FileEdit, Check, X, Lock } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradeModal from '../components/UpgradeModal';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', email: '', phone: '', experience_level: '' });
  const { isPro } = useSubscription();

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentRes, lessonsRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', id).single(),
        supabase.from('lessons').select('*, courts(name)').eq('student_id', id).order('start_time', { ascending: false })
      ]);

      if (studentRes.error) throw studentRes.error;
      setStudent(studentRes.data);
      setLessons(lessonsRes.data || []);
      setEditData({
        full_name: studentRes.data.full_name || '',
        email: studentRes.data.email || '',
        phone: studentRes.data.phone || '',
        experience_level: studentRes.data.experience_level || 'Beginner',
      });
    } catch (err) {
      console.error('Error fetching student details:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingLessons = lessons.filter(l => parseISO(l.start_time) >= new Date()).slice(0, 3);
  const pastLessons = lessons.filter(l => parseISO(l.start_time) < new Date() && l.status !== 'Cancelled');

  const getWeeklyRate = () => {
    if (lessons.length < 2) return lessons.length;
    const sortedDates = lessons.map(l => parseISO(l.start_time).getTime()).sort((a,b) => a - b);
    const first = sortedDates[0];
    const last = new Date().getTime();
    const weeks = Math.max(1, (last - first) / (1000 * 60 * 60 * 24 * 7));
    return (lessons.length / weeks).toFixed(1);
  };

  const totalLessons = lessons.length;
  const cancelledLessons = lessons.filter(l => l.status === 'Cancelled').length;
  const cancelRate = totalLessons > 0 ? Math.round((cancelledLessons / totalLessons) * 100) : 0;
  
  const performanceStats = [
    { label: 'Total Lessons', score: totalLessons.toString(), trend: 'up', val: 'All time' },
    { label: 'Sessions / Wk', score: getWeeklyRate().toString(), trend: 'up', val: 'Average' },
    { label: 'Cancel Rate', score: cancelRate + '%', trend: cancelRate > 20 ? 'down' : 'up', val: cancelledLessons + ' total' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update(editData)
        .eq('id', id);
      if (error) throw error;
      setStudent(prev => ({ ...prev, ...editData }));
      setEditing(false);
    } catch (err) {
      console.error('Error saving student:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      experience_level: student.experience_level || 'Beginner',
    });
    setEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  if (!student) {
    return <div className="text-center p-8">Student not found</div>;
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-24">
        {/* Local Header */}
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 border-b border-slate-200 shadow-sm" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/students" className="text-slate-500 hover:text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer transition-colors bg-slate-50 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Student Profile</h2>
          <div className="flex w-10 items-center justify-end">
            {editing ? (
              <button onClick={handleCancelEdit} className="flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:text-primary transition-colors">
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {/* Profile Hero */}
          <div className="bg-white p-6 shadow-sm border-b border-slate-200">
            <div className="flex w-full flex-col gap-4 items-center">
              <div className="flex gap-4 flex-col items-center">
                <div className="relative">
                  <div className="bg-slate-100 flex items-center justify-center rounded-full h-28 w-28 text-4xl font-bold text-slate-600 shadow-sm border border-slate-200">
                    {student.full_name?.charAt(0)}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-primary text-slate-900 size-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <ShieldCheck size={16} strokeWidth={3} />
                  </div>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
                    <input
                      value={editData.full_name}
                      onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-primary"
                      placeholder="Full name"
                    />
                    <input
                      value={editData.email}
                      onChange={e => setEditData(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                      placeholder="Email"
                      type="email"
                    />
                    <input
                      value={editData.phone}
                      onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                      placeholder="Phone"
                      type="tel"
                    />
                    <div className="flex gap-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                        <button
                          key={level}
                          onClick={() => setEditData(p => ({ ...p, experience_level: level }))}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${editData.experience_level === level ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold leading-tight tracking-tight text-center">{student.full_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-primary text-[10px] uppercase font-bold px-3 py-1 bg-primary/10 rounded-full tracking-widest">
                        {student.experience_level || 'Intermediate Level'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {!editing && (
              <div className="flex w-full gap-3 mt-4 max-w-sm">
                <button
                  onClick={() => student.email ? window.location.href = `mailto:${student.email}` : alert('No email address on file for this student.')}
                  className="flex-1 flex cursor-pointer items-center justify-center rounded-xl h-12 px-4 border border-slate-200 bg-white font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Mail size={18} className="mr-2 text-slate-500" />
                  Message
                </button>
                <Link to="/schedule" className="flex-1 flex cursor-pointer items-center justify-center rounded-xl h-12 px-4 bg-primary text-white font-bold hover:opacity-90 shadow-[0_4px_12px_rgba(102,179,25,0.25)] transition-all">
                  <CalendarPlus size={18} className="mr-2" />
                  Book
                </Link>
              </div>
              )}
            </div>
          </div>

          {/* Performance Stats Grid */}
          <div className="px-4">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
              <BarChart2 size={16} />
              Performance Stats
              {!isPro && <Lock size={12} className="text-slate-600 shadow-none" />}
            </h3>
            
            {isPro ? (
              <div className="grid grid-cols-3 gap-3">
                {performanceStats.map(stat => (
                  <div key={stat.label} className="flex flex-col gap-1 rounded-xl p-4 bg-white border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.score}</p>
                    <p className={`text-[10px] font-bold uppercase flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-primary' : 'text-amber-500'}`}>
                      {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {stat.val}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-white border border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all shadow-sm group"
              >
                <div className="flex items-center justify-center mx-auto mb-3 text-slate-600 group-hover:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <p className="text-xs font-bold text-slate-900">Unlock Performance Insights</p>
                <p className="text-[10px] text-slate-500 mt-1">Upgrade to Pro to see detailed stats and trends.</p>
              </div>
            )}
          </div>

          {/* Upcoming Lessons */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500">Upcoming Lessons</h3>
              <Link to="/schedule" className="text-primary text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingLessons.length === 0 ? (
                <p className="text-slate-500 text-sm bg-white p-4 rounded-xl text-center border border-slate-200 border-dashed shadow-sm">No upcoming lessons scheduled.</p>
              ) : (
                upcomingLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="size-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="text-[10px] font-bold uppercase">{format(parseISO(lesson.start_time), 'MMM')}</span>
                      <span className="text-lg font-bold leading-none">{format(parseISO(lesson.start_time), 'd')}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-sm text-slate-900 truncate">{lesson.type} Session</p>
                      <p className="text-slate-500 text-xs mt-0.5 truncate">{format(parseISO(lesson.start_time), 'EEEE, h:mm a')} • {lesson.courts?.name || 'No Data'}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-primary transition-colors shrink-0">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        {/* Lesson History Timeline (Mobile) */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
              <CalendarPlus size={16} />
              Lesson History
            </h3>
            
            {pastLessons.length === 0 ? (
              <p className="text-slate-500 text-sm bg-white p-4 rounded-xl text-center border border-slate-200 border-dashed shadow-sm">No past lessons found.</p>
            ) : (
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute left-[33px] top-6 bottom-6 w-px bg-slate-100"></div>
                <div className="space-y-6 relative z-10">
                  {pastLessons.slice(0, 5).map(lesson => (
                    <div key={lesson.id} className="flex gap-4 relative">
                      <div className="w-4 h-4 rounded-full border-4 border-white bg-slate-300 shadow-sm mt-1 z-10 shrink-0 mx-auto"></div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900 m-0 leading-tight">{format(parseISO(lesson.start_time), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-slate-500 m-0 mt-0.5">{lesson.type} • {lesson.courts?.name || 'No Court'}</p>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">Done</span>
                        </div>
                        
                        {lesson.cancellation_reason && (
                          <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <FileEdit size={10} /> Internal Note
                            </p>
                            <p className="text-xs text-slate-600 italic m-0">"{lesson.cancellation_reason}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/students" className="flex items-center justify-center size-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Student Profile</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">{student.full_name}</h1>
            </div>
            {editing ? (
              <button onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
                <X size={16} /> Cancel
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors">
                <Settings size={16} /> Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-[300px_1fr] gap-8 items-start">
            
            {/* Left Column - Profile Card */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center relative overflow-hidden text-center shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-24 bg-primary/10"></div>
                
                <div className="relative z-10">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm inline-block">
                    <div className="bg-slate-100 flex items-center justify-center rounded-full h-24 w-24 text-4xl font-bold text-slate-600">
                      {student.full_name?.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-primary text-white size-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <ShieldCheck size={16} strokeWidth={2.5} />
                  </div>
                </div>

                {editing ? (
                  <div className="flex flex-col gap-3 w-full mt-4 text-left">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Full Name</label>
                      <input
                        value={editData.full_name}
                        onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Email</label>
                      <input
                        value={editData.email}
                        onChange={e => setEditData(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Phone</label>
                      <input
                        value={editData.phone}
                        onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Level</label>
                      <div className="flex gap-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                          <button
                            key={level}
                            onClick={() => setEditData(p => ({ ...p, experience_level: level }))}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${editData.experience_level === level ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 mt-1"
                    >
                      <Check size={15} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mt-4 text-slate-900">{student.full_name}</h2>
                    <div className="mt-2 text-primary tracking-wide text-[11px] font-bold px-3 py-1 bg-primary/10 rounded-full">
                      {student.experience_level || 'Intermediate Level'}
                    </div>
                    <p className="text-slate-500 text-xs mt-4">
                      {student.phone ? student.phone : 'No phone number'} <br/>
                      {student.email ? student.email : 'No email'}
                    </p>
                    <div className="flex w-full gap-3 mt-6">
                      <button
                        onClick={() => student.email ? window.location.href = `mailto:${student.email}` : alert('No email address on file.')}
                        className="flex-1 flex cursor-pointer items-center justify-center rounded-xl h-11 border border-slate-200 bg-white font-bold text-[13px] hover:bg-slate-50 transition-colors"
                      >
                        <Mail size={16} className="mr-2 text-slate-500" />
                        Message
                      </button>
                      <Link to="/schedule" className="flex-1 flex cursor-pointer items-center justify-center rounded-xl h-11 bg-primary text-white font-bold text-[13px] hover:bg-primary/90 shadow-sm transition-colors">
                        <CalendarPlus size={16} className="mr-2" />
                        Book
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Performance Insights</p>
                  {!isPro && <Lock size={12} className="text-slate-600" />}
                </div>

                {isPro ? (
                  <div className="flex flex-col gap-4">
                    {performanceStats.map(stat => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{stat.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900">{stat.score}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${stat.trend === 'up' ? 'bg-primary/10 text-primary' : 'bg-rose-100 text-rose-600'}`}>
                            {stat.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {stat.val}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="py-4 text-center cursor-pointer group"
                  >
                    <div className="flex items-center justify-center mx-auto mb-3 text-slate-600 group-hover:text-primary transition-colors">
                      <Lock size={20} />
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight">Pro Analytics</p>
                    <p className="text-[10px] text-slate-500 mt-1 px-4">Upgrade to unlock advanced performance tracking.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              
              {/* Upcoming Lessons */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold tracking-tight m-0 text-slate-900">Upcoming Lessons</h3>
                  <Link to="/schedule" className="text-primary text-[13px] font-bold hover:underline">Full Schedule</Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {upcomingLessons.length === 0 ? (
                    <div className="col-span-2 text-slate-500 text-sm bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
                      No upcoming lessons scheduled.
                    </div>
                  ) : (
                    upcomingLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary transition-colors cursor-pointer group">
                        <div className="size-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                          <span className="text-[10px] font-bold uppercase">{format(parseISO(lesson.start_time), 'MMM')}</span>
                          <span className="text-lg font-bold leading-none">{format(parseISO(lesson.start_time), 'd')}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[13px] text-slate-900 m-0 leading-tight">{lesson.type} Session</p>
                          <p className="text-slate-500 text-[11.5px] m-0 mt-1">{format(parseISO(lesson.start_time), 'EEEE, h:mm a')}</p>
                          <p className="text-slate-500 text-[11.5px] m-0">{lesson.courts?.name || 'No Data'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Lessons & Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold tracking-tight m-0 mb-6 text-slate-900">Lesson History</h3>
                
                {pastLessons.length === 0 ? (
                  <div className="text-slate-500 text-sm bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
                    No past lessons found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastLessons.slice(0, 5).map(lesson => (
                      <div key={lesson.id} className="flex gap-4">
                        <div className="w-12 flex flex-col items-center pt-2">
                          <div className="size-3 rounded-full bg-slate-300"></div>
                          <div className="w-px h-full bg-slate-200 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900 m-0">{format(parseISO(lesson.start_time), 'MMM d, yyyy')}</p>
                              <p className="text-xs text-slate-500 m-0">{lesson.type} • {lesson.courts?.name || 'No Court'}</p>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">Completed</span>
                          </div>
                          
                          {lesson.cancellation_reason && (
                            <div className="mt-3 bg-[#f8fafc] border border-slate-200 rounded-xl p-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 shadow-sm">Coach's Internal Note</p>
                              <p className="text-sm text-slate-700 italic m-0">"{lesson.cancellation_reason}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Performance Insights"
      />
    </>
  );
}
