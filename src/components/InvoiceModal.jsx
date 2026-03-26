import React, { useState, useEffect } from 'react';
import { X, Search, User, DollarSign, Calendar, Loader, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

const InvoiceModal = ({ isOpen, onClose, initialStudent = null, initialAmount = '' }) => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(initialStudent);
  const [amount, setAmount] = useState(initialAmount);
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      setSelectedStudent(initialStudent);
      setAmount(initialAmount);
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setSuccess(false);
    }
  }, [isOpen, initialStudent, initialAmount]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase.from('students').select('id, full_name').eq('status', 'Active');
    setStudents(data || []);
    setLoading(false);
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !amount) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('invoices').insert({
        coach_id: user.id,
        student_id: selectedStudent.id,
        amount: parseFloat(amount),
        due_date: dueDate,
        status: 'Pending'
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
            <p className="text-xs text-slate-500 mt-1">Send a billing request to a student</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95">
            <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Invoice Created</h3>
            <p className="text-slate-500 mt-2">The invoice has been logged to your dashboard.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="space-y-6">
              
              {/* Student Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Student</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs">
                        {selectedStudent.full_name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-slate-900">{selectedStudent.full_name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-primary text-[10px] font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for a student..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    
                    {search && filteredStudents.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-2">
                        {filteredStudents.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedStudent(s)}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                          >
                            <div className="size-7 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-[10px]">
                              {s.full_name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{s.full_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Amount Due</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Due Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Student</span>
                  <span className="font-bold text-slate-700">{selectedStudent?.full_name || '-'}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Due Date</span>
                  <span className="font-bold text-slate-700">{dueDate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center mt-2">
                  <span className="text-sm font-bold text-slate-900">Total Invoice</span>
                  <span className="text-xl font-black text-primary">${Number(amount || 0).toFixed(2)}</span>
                </div>
              </div>

            </div>

            <div className="mt-auto pt-8">
              <button
                type="submit"
                disabled={!selectedStudent || !amount || submitting}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader size={18} className="animate-spin" /> : 'Create Invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InvoiceModal;
