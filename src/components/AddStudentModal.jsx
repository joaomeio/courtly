import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AddStudentModal({ isOpen, onClose, onStudentAdded }) {
  const { session } = useOutletContext();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    experience_level: 'Beginner',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { experience_level, ...insertData } = formData;
      const { data, error: insertError } = await supabase
        .from('students')
        .insert([{ 
          ...insertData,
          coach_id: session?.user?.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      onStudentAdded(data);
      onClose();
      setFormData({ full_name: '', email: '', phone: '', experience_level: 'Beginner', status: 'Active' });
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Add New Student</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
              {error}
            </div>
          )}

          <form id="add-student-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
              <input 
                type="text" 
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="e.g. Roger Federer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="roger@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Experience Level</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, experience_level: level })}
                    className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                      formData.experience_level === level 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="add-student-form"
            disabled={loading || !formData.full_name}
            className="flex-[2] py-3.5 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-sm flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Save Student'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
