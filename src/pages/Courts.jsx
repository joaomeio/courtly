import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, Pencil, Trash2, X } from 'lucide-react';
import ProGate from '../components/ProGate';

const Courts = () => {
  const { session } = useOutletContext();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourtId, setCurrentCourtId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    if (session) {
      fetchCourts();
    }
  }, [session]);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('courts')
          .update({ name: formData.name })
          .eq('id', currentCourtId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courts')
          .insert([{ name: formData.name }]);
        if (error) throw error;
      }
      
      closeModal();
      fetchCourts();
    } catch (error) {
      alert('Error saving court: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this court? It may affect existing lessons.')) {
      try {
        const { error } = await supabase
          .from('courts')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchCourts();
      } catch (error) {
        alert('Error deleting court: ' + error.message);
      }
    }
  };

  const openModal = (court = null) => {
    if (court) {
      setIsEditing(true);
      setCurrentCourtId(court.id);
      setFormData({ name: court.name });
    } else {
      setIsEditing(false);
      setCurrentCourtId(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '' });
    setIsEditing(false);
    setCurrentCourtId(null);
  };

  return (
    <ProGate feature="Court Management" description="Assign courts to sessions, track availability and prevent double-bookings. Available on Pro.">
      <>
      {/* ═══════════════════════════════════════════════════
          MOBILE LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-50 relative pb-24">
        {/* Header */}
        <div className="flex items-center bg-white p-4 justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200">
          <Link to="/" className="text-slate-500 hover:text-primary flex size-10 items-center justify-center rounded-full transition-colors bg-slate-50">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-slate-900">Court Management</h2>
          <div className="flex w-10 items-center justify-end"></div>
        </div>

        {/* Courts List */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm shadow-sm">
              No courts added yet. Click the + button to add one.
            </div>
          ) : (
            courts.map(court => (
              <div key={court.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-base leading-tight">{court.name}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Active Court</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal(court)} className="flex items-center justify-center size-10 rounded-full text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(court.id)} className="flex items-center justify-center size-10 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => openModal()}
          className="fixed bottom-[100px] right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 ring-[6px] ring-slate-50"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          DESKTOP LAYOUT
      ═══════════════════════════════════════════════════ */}
      <div className="hidden lg:block font-sans min-h-screen bg-slate-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-8">
          
          {/* Header */}
          <div className="flex items-start justify-between shrink-0">
            <div>
              <p className="text-[13px] text-slate-500 m-0 mb-1 tracking-wide uppercase font-semibold">Facility Management</p>
              <h1 className="text-[28px] font-bold m-0 tracking-tight text-slate-900 leading-none">Courts</h1>
            </div>
            <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm">
              <Plus size={16} strokeWidth={2.5} />
              Add Court
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold tracking-tight m-0 text-slate-900">Active Courts</h3>
              <span className="text-slate-500 text-[13px] font-bold">{courts.length} total</span>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : courts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm bg-slate-50">
                No courts added yet. Click the Add Court button above.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Court Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courts.map((court) => (
                    <tr key={court.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/20">
                            <LayoutGrid size={18} />
                          </div>
                          <span className="font-bold text-[13px] text-slate-900">{court.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider bg-primary/10 text-primary uppercase">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(court)} className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(court.id)} className="flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Court' : 'Add Court'}</h2>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <form id="court-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Court Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Center Court, Court 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                type="button" 
                onClick={closeModal}
                className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="court-form"
                disabled={!formData.name}
                className="flex-[2] py-3.5 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-sm border-none cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Add Court'}
              </button>
            </div>
            
          </div>
        </div>
      )}
      </>
    </ProGate>
  );
};

export default Courts;
