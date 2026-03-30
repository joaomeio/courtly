import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { parseISO, isThisWeek, isThisMonth, isThisYear, getDay, format } from 'date-fns';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ProGate from '../components/ProGate';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#66b319', '#f59e0b', '#10b981', '#6366f1']; // Primary (Green), Amber, Emerald, Indigo

export default function Analytics() {
  const [period, setPeriod] = useState('Weekly');
  const [lessons, setLessons] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lessonsRes, studentsRes] = await Promise.all([
          supabase.from('lessons').select('*').neq('status', 'Cancelled'),
          supabase.from('students').select('id', { count: 'exact' }).eq('status', 'Active')
        ]);
        setLessons(lessonsRes.data || []);
        setStudentsCount(studentsRes.count || 0);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter lessons by period
  const periodFilter = (lesson) => {
    const date = parseISO(lesson.start_time);
    if (period === 'Weekly') return isThisWeek(date, { weekStartsOn: 1 });
    if (period === 'Monthly') return isThisMonth(date);
    return isThisYear(date);
  };

  const periodLessons = lessons.filter(periodFilter);
  const completedLessons = periodLessons.filter(l => l.status === 'Completed');
  const hoursCoached = (periodLessons.reduce((s, l) => s + (l.duration_minutes || 60), 0) / 60).toFixed(1);

  // Revenue estimate (flat rate $80/lesson)
  const revenue = completedLessons.length * 80;

  // 1. Session Trends (Line Chart Data)
  const dayCount = Array(7).fill(0);
  periodLessons.forEach(l => {
    const d = getDay(parseISO(l.start_time)); // 0=Sun
    const mon0 = (d + 6) % 7; // convert to Mon=0
    dayCount[mon0]++;
  });
  
  const trendData = DAYS.map((day, index) => ({
    name: day,
    sessions: dayCount[index]
  }));

  // 2. Make-up by Type (Donut Chart Data)
  const typeCounts = {};
  periodLessons.forEach(l => {
    const type = l.type || 'Private';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // 3. Sparkline Data Generation (Simple mock curve based on trend)
  const sparklineSessions = trendData.map(d => ({ value: d.sessions }));
  const sparklineRevenue = trendData.map(d => ({ value: d.sessions * 80 }));

  // Popular time slots
  const timeSlots = {};
  periodLessons.forEach(l => {
    const h = parseISO(l.start_time).getHours();
    const slot = h < 12 ? 'Morning (8am–12pm)' : h < 17 ? 'Afternoon (12–5pm)' : 'Evening (5pm+)';
    timeSlots[slot] = (timeSlots[slot] || 0) + 1;
  });
  const maxSlot = Math.max(...Object.values(timeSlots), 1);

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
        <BarChart2 size={24} />
      </div>
      <p className="text-sm font-bold text-slate-600 mb-1">No Data Available</p>
      <p className="text-xs text-slate-400 max-w-[200px]">{message}</p>
    </div>
  );

  return (
    <ProGate feature="Analytics" description="Track your coaching hours, revenue trends, session patterns and student growth with beautiful charts. Available on Pro.">
      <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24">
        {/* Header */}
        <div className="flex items-center bg-white p-4 border-b border-slate-200 justify-between sticky top-0 z-20 shadow-sm" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50 z-20">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="absolute left-0 right-0 text-slate-900 text-lg font-bold leading-tight tracking-tight text-center z-10 pointer-events-none">
            Analytics
          </h2>
          <div className="w-10 relative z-20"></div>
        </div>

        {/* Period Selector */}
        <div className="bg-white border-b border-primary/10 mb-6">
          <div className="flex px-4 gap-8">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 transition-colors ${period === p ? 'border-primary text-slate-900' : 'border-transparent text-slate-500 hover:text-primary'}`}
              >
                <p className={`text-sm font-bold tracking-tight ${period === p ? '' : 'font-medium'}`}>{p}</p>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics with Sparklines */}
            <div className="grid grid-cols-2 gap-4 px-4 mb-6">
              <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">Sessions</p>
                <div className="flex items-end gap-2 relative z-10">
                  <p className="text-slate-900 text-3xl font-extrabold">{periodLessons.length}</p>
                  <p className="text-xs font-bold mb-1.5 text-primary">{completedLessons.length} done</p>
                </div>
                <div className="absolute -bottom-2 -left-2 right-0 h-16 opacity-10 group-hover:opacity-20 pointer-events-none transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineSessions}>
                      <Line type="monotone" dataKey="value" stroke="#66b319" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">Hours</p>
                <div className="flex items-end gap-2 relative z-10">
                  <p className="text-slate-900 text-3xl font-extrabold">{hoursCoached}h</p>
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">Students</p>
                <p className="text-slate-900 text-3xl font-extrabold relative z-10">{studentsCount}</p>
              </div>

              <div className="flex flex-col gap-1 rounded-xl p-5 bg-white border border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider relative z-10">Revenue</p>
                <p className="text-slate-900 text-3xl font-extrabold relative z-10">${revenue}</p>
                <div className="absolute -bottom-2 -left-2 right-0 h-16 opacity-10 group-hover:opacity-20 pointer-events-none transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineRevenue}>
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="px-4 grid grid-cols-1 gap-6">
              
              {/* Session Trends - Line Chart */}
              <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
                <h3 className="text-slate-900 font-bold text-base mb-6">Session Trends</h3>
                {periodLessons.length === 0 ? (
                  <EmptyState message={`No sessions scheduled for this ${period.toLowerCase()}.`} />
                ) : (
                  <div className="h-64 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} dy={10} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600, color: '#0f172a'}} 
                          cursor={{stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4'}}
                        />
                        <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#66b319" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, strokeWidth: 0, fill: '#66b319'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Make-up by Type - Donut Chart */}
              <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
                <h3 className="text-slate-900 font-bold text-base mb-2">Lesson Types</h3>
                {typeData.length === 0 ? (
                  <EmptyState message="No lesson types recorded yet." />
                ) : (
                  <>
                    <div className="h-48 w-full flex justify-center mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={typeData} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {typeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600}}
                            itemStyle={{color: '#0f172a'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {typeData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <div className="size-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                          <span className="text-xs font-bold text-slate-700">{entry.name} <span className="opacity-50 ml-1">({entry.value})</span></span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Popular Times - Progress Bars */}
              <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-sm">
                <h3 className="text-slate-900 font-bold text-base mb-6">Popular Times</h3>
                {Object.keys(timeSlots).length === 0 ? (
                  <EmptyState message="No session times recorded yet." />
                ) : (
                  <div className="space-y-5">
                    {Object.entries(timeSlots).sort((a, b) => b[1] - a[1]).map(([slot, count]) => (
                      <div key={slot} className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-semibold text-slate-700">{slot}</span>
                          <span className="text-xs font-bold text-primary">{count} sessions</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary relative" style={{ width: `${(count / maxSlot) * 100}%` }}>
                             <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Header */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Performance Overview</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Coaching Analytics</h1>
            </div>
            
            {/* Period Selector Desktop */}
            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
              {PERIODS.map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-colors border-none cursor-pointer ${period === p ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Desktop Metrics Row */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase m-0 mb-3 relative z-10">Sessions</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">{periodLessons.length}</p>
                    <p className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded m-0">{completedLessons.length} done</p>
                  </div>
                  <div className="absolute -bottom-2 -left-2 right-0 h-16 opacity-10 group-hover:opacity-20 pointer-events-none transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineSessions}>
                        <Line type="monotone" dataKey="value" stroke="#66b319" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase m-0 mb-3 relative z-10">Hours</p>
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none relative z-10">{hoursCoached}h</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase m-0 mb-3 relative z-10">Students</p>
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none relative z-10">{studentsCount}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
                  <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase m-0 mb-3 relative z-10">Revenue</p>
                  <div className="flex items-baseline gap-0.5 relative z-10">
                    <p className="text-slate-400 text-lg font-bold m-0">$</p>
                    <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">{revenue}</p>
                  </div>
                  <div className="absolute -bottom-2 -left-2 right-0 h-16 opacity-10 group-hover:opacity-20 pointer-events-none transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineRevenue}>
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-3 gap-6 items-start">
                
                {/* Main Trend Line Chart (Span 2) */}
                <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight m-0 mb-8 text-slate-900">Session Trends</h3>
                  {periodLessons.length === 0 ? (
                    <EmptyState message={`No sessions scheduled for this ${period.toLowerCase()}.`} />
                  ) : (
                    <div className="h-[280px] w-full -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} dy={10} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 600, color: '#0f172a', fontSize: '13px'}} 
                            cursor={{stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4'}}
                          />
                          <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#66b319" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6, strokeWidth: 0, fill: '#66b319'}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Right Column Stack */}
                <div className="flex flex-col gap-6">
                  
                  {/* Lesson Types Donut */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight m-0 mb-4 text-slate-900">Lesson Types</h3>
                    {typeData.length === 0 ? (
                      <EmptyState message="No lesson types recorded yet." />
                    ) : (
                      <>
                        <div className="h-[180px] w-full flex justify-center mb-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={typeData} 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={4} 
                                dataKey="value"
                              >
                                {typeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '12px'}}
                                itemStyle={{color: '#0f172a'}}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-2">
                          {typeData.map((entry, i) => (
                            <div key={entry.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                <span className="text-[13px] font-bold text-slate-700">{entry.name}</span>
                              </div>
                              <span className="text-[13px] font-bold text-slate-400">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Popular Times */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight m-0 mb-6 text-slate-900">Popular Times</h3>
                    {Object.keys(timeSlots).length === 0 ? (
                      <EmptyState message="No session times recorded yet." />
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(timeSlots).sort((a, b) => b[1] - a[1]).map(([slot, count]) => (
                          <div key={slot} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[12px] font-bold text-slate-700">{slot.split(' (')[0]}</span>
                              <span className="text-[11px] font-bold text-primary">{count} sessions</span>
                            </div>
                            <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary relative" style={{ width: `${(count / maxSlot) * 100}%` }}>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    </ProGate>
  );
}
