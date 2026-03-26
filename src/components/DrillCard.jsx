import React, { useState } from 'react';
import { Clock, Plus, ChevronRight, X, Info } from 'lucide-react';

const DIFFICULTY_STYLES = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CATEGORY_COLORS = {
  Serve: 'bg-violet-50 text-violet-700',
  Return: 'bg-sky-50 text-sky-700',
  Footwork: 'bg-orange-50 text-orange-700',
  'Net Play': 'bg-teal-50 text-teal-700',
  Baseline: 'bg-indigo-50 text-indigo-700',
  Fitness: 'bg-pink-50 text-pink-700',
  Mental: 'bg-slate-100 text-slate-600',
  Match: 'bg-yellow-50 text-yellow-700',
  Skill: 'bg-lime-50 text-lime-700',
};

const CourtThumb = ({ overlay, width = 52, height = 120 }) => {
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 502">
      <defs>
        <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#FFB703"/>
        </marker>
      </defs>
      <rect x="0" y="0" width="220" height="502" fill="#1a3a2a"/>
      <rect x="30" y="20" width="160" height="462" fill="#2e6b3e"/>
      <rect x="30" y="20" width="160" height="462" fill="none" stroke="#d8d8c8" stroke-width="1.4"/>
      <line x1="30" y1="251" x2="190" y2="251" stroke="#ffffff" stroke-width="2.8"/>
      <line x1="30" y1="127" x2="190" y2="127" stroke="#d8d8c8" stroke-width="1"/>
      <line x1="30" y1="375" x2="190" y2="375" stroke="#d8d8c8" stroke-width="1"/>
      <line x1="110" y1="127" x2="110" y2="375" stroke="#d8d8c8" stroke-width="1"/>
      <line x1="110" y1="20" x2="110" y2="28" stroke="#d8d8c8" stroke-width="1.4"/>
      <line x1="110" y1="474" x2="110" y2="482" stroke="#d8d8c8" stroke-width="1.4"/>
      <circle cx="30" cy="251" r="2.5" fill="#d8d8c8"/>
      <circle cx="190" cy="251" r="2.5" fill="#d8d8c8"/>
      ${overlay || ''}
    </svg>`;
  return (
    <div
      className="rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm"
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

const CourtDiagramModal = ({ isOpen, onClose, overlay, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{title || 'Diagram Viewer'}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 bg-slate-100 flex items-center justify-center flex-1 overflow-y-auto">
          {/* We scale the CourtThumb up by rendering it larger */}
          <CourtThumb overlay={overlay} width={220} height={502} className="shadow-xl" />
        </div>

        <div className="p-5 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Diagram Legend</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-6 border-t-[3px] border-dashed border-[#FFB703]"></span>
              Ball Trajectory
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 border-t-2 border-white bg-slate-400"></span>
              Player Movement
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#FFB703] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-[#FFB703] rounded-full"></div></div>
              Target Area
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-2 h-2 bg-primary rounded-full"></div></div>
              Player Position
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CourtThumb, CourtDiagramModal };

export default function DrillCard({ drill, onAdd, onClick, compact = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const diffStyle = DIFFICULTY_STYLES[drill.difficulty] || 'bg-slate-50 text-slate-600 border-slate-200';
  const catStyle = CATEGORY_COLORS[drill.category] || 'bg-slate-100 text-slate-600';

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-primary/40 transition-all group cursor-pointer"
        onClick={() => onAdd && onAdd(drill)}
      >
        <CourtThumb overlay={drill.svg} width={32} height={72} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{drill.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {drill.category && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${catStyle}`}>{drill.category}</span>
            )}
            {drill.duration_mins && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Clock size={10} /> {drill.duration_mins}m
              </span>
            )}
          </div>
        </div>
        {onAdd && (
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Plus size={14} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div 
          className="relative cursor-zoom-in hover:opacity-90 transition-opacity"
          onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
        >
          <CourtThumb overlay={drill.svg} />
          <div className="absolute bottom-1 right-1 size-5 bg-black/60 rounded flex items-center justify-center text-white backdrop-blur-sm pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{drill.name}</h3>
              {drill.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{drill.description}</p>
              )}
            </div>
            {onAdd ? (
              <button
                onClick={(e) => { e.stopPropagation(); onAdd(drill); }}
                className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0 mt-0.5"
              >
                <Plus size={16} />
              </button>
            ) : (
              <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors shrink-0 mt-1" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {drill.category && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle}`}>{drill.category}</span>
            )}
            {drill.difficulty && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffStyle}`}>{drill.difficulty}</span>
            )}
            {drill.duration_mins && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium ml-auto">
                <Clock size={10} /> {drill.duration_mins} min
              </span>
            )}
          </div>
        </div>
      </div>

      {drill.is_preset && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Preset Drill</span>
        </div>
      )}

      <CourtDiagramModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        overlay={drill.svg} 
        title={drill.name}
      />
    </div>
  );
}
