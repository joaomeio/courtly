import React from 'react';
import { Clock, Plus, ChevronRight } from 'lucide-react';

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

export { CourtThumb };

export default function DrillCard({ drill, onAdd, onClick, compact = false }) {
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
        <CourtThumb overlay={drill.svg} />
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
    </div>
  );
}
