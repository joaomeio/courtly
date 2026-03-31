import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PlusCircle,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import ProGate from '../components/ProGate';
import { supabase } from '../supabaseClient';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import InvoiceModal from '../components/InvoiceModal';

const Payments = () => {
  const { session } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentTab, setCurrentTab] = useState('Invoices'); // 'Invoices' or 'Payments'

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, students(full_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*, students(full_name)')
          .order('payment_date', { ascending: false })
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    if (!confirm(`Mark invoice for ${invoice.students.full_name} as paid?`)) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Update invoice status
      const { error: invError } = await supabase
        .from('invoices')
        .update({ status: 'Paid' })
        .eq('id', invoice.id);

      if (invError) throw invError;

      // 2. Create payment record
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          coach_id: user.id,
          student_id: invoice.student_id,
          invoice_id: invoice.id,
          amount: invoice.amount,
          method: 'Cash', // Default to Cash for manual marking
          payment_date: format(new Date(), 'yyyy-MM-dd')
        });

      if (payError) throw payError;

      await fetchFinancialData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Failed to mark as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      await fetchFinancialData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculation
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthRevenue = payments
    .filter(p => isWithinInterval(parseISO(p.payment_date), { start: thisMonthStart, end: thisMonthEnd }))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const lastMonthRevenue = payments
    .filter(p => isWithinInterval(parseISO(p.payment_date), { start: lastMonthStart, end: lastMonthEnd }))
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const revenueGrowth = lastMonthRevenue === 0 ? 100 : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

  const outstandingAmount = invoices
    .filter(inv => inv.status === 'Pending' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const outstandingCount = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').length;

  const filteredInvoices = filterStatus === 'All' 
    ? invoices 
    : invoices.filter(inv => inv.status === filterStatus);

  const filteredPayments = payments; // Add filtering if needed

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <ProGate feature="Payment Tracking" description="Track revenue, log payments, and see who owes you money — all in one place. Available on Pro.">
      <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 pb-24 relative">
        {/* Header */}
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-slate-900">Payments & Invoicing</h2>
          <div className="flex w-10 items-center justify-end"></div>
        </div>

        <div className="p-4 space-y-4">
          {/* Metric Cards */}
          {/* Metrics Tab Selector (Mobile) */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {['Invoices', 'Payments'].map(tab => (
              <button 
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currentTab === tab ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1 rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Revenue</h3>
              <div className="flex justify-between items-end mt-1">
                <p className="text-slate-900 text-xl font-bold">${thisMonthRevenue.toLocaleString()}</p>
                <div className={`px-1.5 py-0.5 ${revenueGrowth >= 0 ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-500'} rounded flex items-center gap-0.5 text-[9px] font-bold`}>
                  {revenueGrowth >= 0 ? <ArrowUpRight size={10} strokeWidth={2.5} /> : <ArrowDownRight size={10} strokeWidth={2.5} />}
                  {Math.abs(revenueGrowth)}%
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-1 rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <h3 className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Outstanding</h3>
              <div className="flex justify-between items-end mt-1">
                <p className="text-amber-500 text-xl font-bold">${outstandingAmount.toLocaleString()}</p>
                <div className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded flex items-center gap-0.5 text-[9px] font-bold">
                  <ArrowDownRight size={10} strokeWidth={2.5} /> {outstandingCount} Due
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex items-center justify-between mt-6 mb-2">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">Recent {currentTab}</h2>
            {currentTab === 'Invoices' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFilterStatus(filterStatus === 'Pending' ? 'All' : 'Pending')}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${filterStatus === 'Pending' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  Pending Only
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {currentTab === 'Invoices' ? (
              filteredInvoices.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">No invoices found.</div>
              ) : (
                filteredInvoices.slice(0, 10).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${inv.status === 'Paid' ? 'bg-primary/10 text-primary' : inv.status === 'Overdue' ? 'bg-red-50 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        <DollarSign size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 leading-tight">{inv.students?.full_name || 'Unknown Student'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{format(parseISO(inv.issued_at), 'MMM d, yyyy')}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-base text-slate-900 leading-tight">${Number(inv.amount).toFixed(2)}</div>
                      <div className="flex items-center gap-2">
                        {inv.status === 'Pending' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(inv); }}
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary text-white"
                          >
                            Pay
                          </button>
                        )}
                        <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${inv.status === 'Paid' ? 'bg-primary/10 text-primary' : inv.status === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {inv.status}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id); }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredPayments.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">No payments recorded yet.</div>
              ) : (
                filteredPayments.slice(0, 10).map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary`}>
                        <DollarSign size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 leading-tight">{pay.students?.full_name || 'Unknown Student'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{format(parseISO(pay.payment_date), 'MMM d, yyyy')} • {pay.method}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-base text-primary leading-tight">+${Number(pay.amount).toFixed(2)}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        Received
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
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
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm"
            >
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
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">${thisMonthRevenue.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className={`flex items-center gap-0.5 ${revenueGrowth >= 0 ? 'text-primary bg-primary/10' : 'text-red-600 bg-red-50'} px-2 py-0.5 rounded text-[11px] font-bold`}>
                    {revenueGrowth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {Math.abs(revenueGrowth)}%
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
                  <p className="text-slate-900 text-3xl font-bold m-0 tracking-tight leading-none">${outstandingAmount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-bold">
                    <ArrowDownRight size={12} /> {outstandingCount} Invoices
                  </span>
                  <span className="text-slate-500 text-[11px]">need follow-up</span>
                </div>
              </div>
            </div>

            {/* Right Column - Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-6">
                  {['Invoices', 'Payments'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setCurrentTab(tab)}
                      className={`text-lg font-bold tracking-tight m-0 transition-all ${currentTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab === 'Invoices' ? 'Invoice History' : 'Payment History'}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                   {currentTab === 'Invoices' ? (
                     ['All', 'Paid', 'Pending'].map(status => (
                       <button 
                         key={status}
                         onClick={() => setFilterStatus(status)}
                         className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${filterStatus === status ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                       >
                         {status}
                       </button>
                     ))
                   ) : (
                     <div className="h-6" /> // Placeholder to keep layout stable
                   )}
                </div>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  {currentTab === 'Invoices' ? (
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issued Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTab === 'Invoices' ? (
                    filteredInvoices.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">No invoices found matching the filter.</td></tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-full flex flex-col items-center justify-center font-bold text-sm ${inv.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-orange-50 text-orange-500'}`}>
                                {inv.students?.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-bold text-[13px] text-slate-900">{inv.students?.full_name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 text-[13px] font-medium">{format(parseISO(inv.issued_at), 'MMM d, yyyy')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-[13px] text-slate-900">${Number(inv.amount).toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {inv.status === 'Pending' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(inv); }}
                                  className="text-[11px] font-bold text-primary hover:underline"
                                >
                                  Mark as Paid
                                </button>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${inv.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-orange-50 text-orange-600'}`}>
                                {inv.status}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv.id); }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Invoice"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredPayments.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">No payments recorded yet.</td></tr>
                    ) : (
                      filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`size-10 rounded-full flex flex-col items-center justify-center font-bold text-sm bg-primary/10 text-primary`}>
                                {pay.students?.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-bold text-[13px] text-slate-900">{pay.students?.full_name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 text-[13px] font-medium">{format(parseISO(pay.payment_date), 'MMM d, yyyy')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-500 text-[13px] font-medium">{pay.method}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-[14px] text-primary">+${Number(pay.amount).toFixed(2)}</span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <InvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchFinancialData();
        }} 
      />
      </>
    </ProGate>
  );
};

export default Payments;
