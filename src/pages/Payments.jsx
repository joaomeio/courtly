import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, ArrowLeft, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProGate from '../components/ProGate';

const Payments = () => {
  const transactions = [
    { id: 1, student: 'Sarah Jenkins', amount: 80.00, date: 'Today, 11:00 AM', status: 'Paid', method: 'Stripe' },
    { id: 2, student: 'Mike Davis', amount: 150.00, date: 'Yesterday', status: 'Pending', method: 'Invoice' },
    { id: 3, student: 'Emma Wilson', amount: 80.00, date: 'Oct 12, 2023', status: 'Paid', method: 'Cash' },
  ];

  return (
    <ProGate feature="Payment Tracking" description="Track revenue, log payments, and see who owes you money — all in one place. Available on Pro.">
      <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 pb-24 relative">
        {/* Header */}
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200">
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-slate-900">Payments & Invoicing</h2>
          <div className="flex w-10 items-center justify-end"></div>
        </div>

        <div className="p-4 space-y-4">
          {/* Metric Cards */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1 rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Revenue</h3>
              <div className="flex justify-between items-end mt-1">
                <p className="text-slate-900 text-xl font-bold">$3,240</p>
                <div className="px-1.5 py-0.5 bg-primary/10 text-primary rounded flex items-center gap-0.5 text-[9px] font-bold">
                  <ArrowUpRight size={10} strokeWidth={2.5} /> +12%
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-1 rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Outstanding</h3>
              <div className="flex justify-between items-end mt-1">
                <p className="text-amber-500 text-xl font-bold">$450</p>
                <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded flex items-center gap-0.5 text-[9px] font-bold">
                  <ArrowDownRight size={10} strokeWidth={2.5} /> 3 Due
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex items-center justify-between mt-6 mb-2">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">Recent Transactions</h2>
          </div>
          
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${tx.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                    <DollarSign size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 leading-tight">{tx.student}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{tx.date} • {tx.method}</div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="font-bold text-base text-slate-900 leading-tight">${tx.amount.toFixed(2)}</div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${tx.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          className="fixed bottom-[100px] right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50"
        >
          <PlusCircle size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Page Header */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Financial Overview</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Payments & Invoicing</h1>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm">
              <PlusCircle size={16} strokeWidth={2.5} />
              New Invoice
            </button>
          </div>

          <div className="grid grid-cols-[300px_1fr] gap-8 items-start">
            
            {/* Left Column - Metrics */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-slate-500 text-[11px] font-bold tracking-widest uppercase m-0">Total Revenue</h3>
                    <p className="text-slate-400 text-[10px] m-0">This Month</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">$3,240<span className="text-lg text-slate-400">.00</span></p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-0.5 text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] font-bold">
                    <ArrowUpRight size={12} /> +12%
                  </span>
                  <span className="text-slate-500 text-[11px]">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <div className="relative">
                      <DollarSign size={20} />
                      <div className="absolute top-0 right-0 size-2 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-slate-500 text-[11px] font-bold tracking-widest uppercase m-0">Outstanding</h3>
                    <p className="text-slate-400 text-[10px] m-0">Awaiting Payment</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">$450<span className="text-lg text-slate-400">.00</span></p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-bold">
                    <ArrowDownRight size={12} /> 3 Students
                  </span>
                  <span className="text-slate-500 text-[11px]">need reminders</span>
                </div>
              </div>
            </div>

            {/* Right Column - Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <h3 className="text-lg font-bold tracking-tight m-0 text-slate-900">Recent Transactions</h3>
                <button className="text-primary text-[13px] font-bold hover:underline bg-transparent border-none cursor-pointer">View All</button>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount/Method</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-full flex flex-col items-center justify-center font-bold text-sm ${tx.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-orange-50 text-orange-500'}`}>
                            {tx.student.charAt(0)}
                          </div>
                          <span className="font-bold text-[13px] text-slate-900">{tx.student}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500 text-[13px] font-medium">{tx.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[13px] text-slate-900">${tx.amount.toFixed(2)}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{tx.method}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${tx.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-orange-50 text-orange-600'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </>
    </ProGate>
  );
};

export default Payments;
