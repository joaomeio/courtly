import { useRef, useState, useCallback } from 'react';

const TOOLS = [
  { id: 'player', label: 'Player', icon: '🟡', color: '#FFB703' },
  { id: 'coach', label: 'Coach', icon: '🔴', color: '#e85d3c' },
  { id: 'opponent', label: 'Opponent', icon: '🔵', color: '#4CC9F0' },
  { id: 'target', label: 'Target', icon: '🎯', color: '#FFB703' },
  { id: 'arrow', label: 'Arrow', icon: '➡️', color: '#FFB703' },
  { id: 'cone', label: 'Cone', icon: '🔶', color: '#ff6b35' },
  { id: 'eraser', label: 'Erase', icon: '🗑️', color: '#888' },
];

const ARROW_COLORS = [
  { label: 'Gold', value: '#FFB703' },
  { label: 'Blue', value: '#4CC9F0' },
  { label: 'Green', value: '#aaffaa' },
  { label: 'Orange', value: '#ff9933' },
];

// Scale: SVG viewBox is 220×502
const VB_W = 220, VB_H = 502;

export default function CourtDrawer({ onSave, onCancel }) {
  const svgRef = useRef(null);
  const [tool, setTool] = useState('player');
  const [arrowColor, setArrowColor] = useState('#FFB703');
  const [elements, setElements] = useState([]);
  const [drawing, setDrawing] = useState(null); // for arrow path
  const [history, setHistory] = useState([]);

  const svgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = VB_W / rect.width;
    const scaleY = VB_H / rect.height;
    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }, []);

  const addElement = useCallback((el) => {
    setHistory(h => [...h, elements]);
    setElements(els => [...els, el]);
  }, [elements]);

  const handleSvgClick = useCallback((e) => {
    if (tool === 'arrow') return;
    const { x, y } = svgPoint(e);
    if (tool === 'eraser') {
      // Remove element closest to click point
      setHistory(h => [...h, elements]);
      setElements(els => {
        const closest = els.reduce((best, el, i) => {
          const dx = (el.x ?? ((el.x1 + el.x2) / 2) ?? 0) - x;
          const dy = (el.y ?? ((el.y1 + el.y2) / 2) ?? 0) - y;
          const d = Math.sqrt(dx * dx + dy * dy);
          return d < best.d ? { d, i } : best;
        }, { d: 999, i: -1 });
        if (closest.d < 20 && closest.i >= 0) {
          return els.filter((_, i) => i !== closest.i);
        }
        return els;
      });
      return;
    }
    if (tool === 'player') { addElement({ type: 'player', x, y, label: 'P', color: '#FFB703' }); return; }
    if (tool === 'coach') { addElement({ type: 'player', x, y, label: 'C', color: '#e85d3c' }); return; }
    if (tool === 'opponent') { addElement({ type: 'player', x, y, label: 'R', color: '#4CC9F0' }); return; }
    if (tool === 'target') { addElement({ type: 'target', x, y }); return; }
    if (tool === 'cone') { addElement({ type: 'cone', x, y }); return; }
  }, [tool, svgPoint, addElement, elements]);

  const handleMouseDown = useCallback((e) => {
    if (tool !== 'arrow') return;
    const { x, y } = svgPoint(e);
    setDrawing({ x1: x, y1: y, x2: x, y2: y, cx: x, cy: y, color: arrowColor });
  }, [tool, svgPoint, arrowColor]);

  const handleMouseMove = useCallback((e) => {
    if (!drawing) return;
    const { x, y } = svgPoint(e);
    setDrawing(d => ({
      ...d,
      x2: x,
      y2: y,
      cx: Math.round((d.x1 + x) / 2),
      cy: Math.round((d.y1 + y) / 2),
    }));
  }, [drawing, svgPoint]);

  const handleMouseUp = useCallback(() => {
    if (!drawing) return;
    const dx = drawing.x2 - drawing.x1, dy = drawing.y2 - drawing.y1;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      addElement({ type: 'arrow', ...drawing });
    }
    setDrawing(null);
  }, [drawing, addElement]);

  const undo = () => {
    if (!history.length) return;
    setElements(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
  };

  const renderOverlaySVG = () => elements.map(el => {
    if (el.type === 'player') {
      return `<circle cx="${el.x}" cy="${el.y}" r="8" fill="${el.color}" stroke="#fff" stroke-width="1.5"/><text x="${el.x}" y="${el.y + 3}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7.5" font-weight="700" fill="#1a1a1a">${el.label}</text>`;
    }
    if (el.type === 'target') {
      return `<circle cx="${el.x}" cy="${el.y}" r="6" fill="none" stroke="#FFB703" stroke-width="1.6" stroke-dasharray="2 2"/><circle cx="${el.x}" cy="${el.y}" r="2.5" fill="#FFB703"/>`;
    }
    if (el.type === 'cone') {
      return `<polygon points="${el.x},${el.y - 10} ${el.x + 5},${el.y} ${el.x - 5},${el.y}" fill="#ff6b35"/>`;
    }
    if (el.type === 'arrow') {
      return `<path d="M${el.x1} ${el.y1} Q${el.cx} ${el.cy} ${el.x2} ${el.y2}" stroke="${el.color}" stroke-width="1.8" fill="none" stroke-dasharray="5 3" marker-end="url(#ah)"/>`;
    }
    return '';
  }).join('');

  const handleSave = () => {
    onSave(renderOverlaySVG());
  };

  const renderSvgEls = () => elements.map((el, i) => {
    if (el.type === 'player') return (
      <g key={i}>
        <circle cx={el.x} cy={el.y} r="8" fill={el.color} stroke="#fff" strokeWidth="1.5" />
        <text x={el.x} y={el.y + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#1a1a1a">{el.label}</text>
      </g>
    );
    if (el.type === 'target') return (
      <g key={i}>
        <circle cx={el.x} cy={el.y} r="6" fill="none" stroke="#FFB703" strokeWidth="1.6" strokeDasharray="2 2" />
        <circle cx={el.x} cy={el.y} r="2.5" fill="#FFB703" />
      </g>
    );
    if (el.type === 'cone') return (
      <polygon key={i} points={`${el.x},${el.y - 10} ${el.x + 5},${el.y} ${el.x - 5},${el.y}`} fill="#ff6b35" />
    );
    if (el.type === 'arrow') return (
      <path key={i} d={`M${el.x1} ${el.y1} Q${el.cx} ${el.cy} ${el.x2} ${el.y2}`}
        stroke={el.color} strokeWidth="1.8" fill="none" strokeDasharray="5 3"
        markerEnd="url(#ah-draw)" />
    );
    return null;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${tool === t.id
                ? 'bg-amber-400 text-slate-900 shadow-md scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        {tool === 'arrow' && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-slate-500">Color:</span>
            {ARROW_COLORS.map(c => (
              <button key={c.value} onClick={() => setArrowColor(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${arrowColor === c.value ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }} title={c.label} />
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={undo} disabled={!history.length}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all">
            ↩ Undo
          </button>
          <button onClick={() => { setHistory(h => [...h, elements]); setElements([]); }}
            className="px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all">
            Clear
          </button>
        </div>
      </div>

      {/* Court Canvas */}
      <div className="relative select-none">
        <p className="text-xs text-slate-400 mb-2 text-center">
          {tool === 'arrow' ? '🖱 Click and drag to draw an arrow' : '🖱 Click on court to place element'}
        </p>
        <div className="mx-auto" style={{ maxWidth: 280, cursor: tool === 'eraser' ? 'crosshair' : tool === 'arrow' ? 'crosshair' : 'pointer' }}>
          <svg ref={svgRef} viewBox="0 0 220 502" xmlns="http://www.w3.org/2000/svg"
            className="w-full rounded-xl border-2 border-slate-200 shadow-lg"
            onClick={handleSvgClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}>
            <defs>
              <marker id="ah-draw" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={arrowColor} />
              </marker>
            </defs>
            {/* Base Court */}
            <rect x="0" y="0" width="220" height="502" fill="#1a3a2a" />
            <rect x="30" y="20" width="160" height="462" fill="#2e6b3e" />
            <rect x="30" y="20" width="160" height="462" fill="none" stroke="#d8d8c8" strokeWidth="1.4" />
            <line x1="30" y1="251" x2="190" y2="251" stroke="#ffffff" strokeWidth="2.8" />
            <line x1="30" y1="127" x2="190" y2="127" stroke="#d8d8c8" strokeWidth="1" />
            <line x1="30" y1="375" x2="190" y2="375" stroke="#d8d8c8" strokeWidth="1" />
            <line x1="110" y1="127" x2="110" y2="375" stroke="#d8d8c8" strokeWidth="1" />
            <line x1="110" y1="20" x2="110" y2="28" stroke="#d8d8c8" strokeWidth="1.4" />
            <line x1="110" y1="474" x2="110" y2="482" stroke="#d8d8c8" strokeWidth="1.4" />
            <circle cx="30" cy="251" r="2.5" fill="#d8d8c8" />
            <circle cx="190" cy="251" r="2.5" fill="#d8d8c8" />

            {/* User elements */}
            {renderSvgEls()}

            {/* Live arrow preview */}
            {drawing && (
              <path d={`M${drawing.x1} ${drawing.y1} Q${drawing.cx} ${drawing.cy} ${drawing.x2} ${drawing.y2}`}
                stroke={arrowColor} strokeWidth="1.8" fill="none" strokeDasharray="5 3"
                markerEnd="url(#ah-draw)" opacity="0.7" />
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 justify-center">
        <span>🟡 = Player</span>
        <span>🔴 = Coach</span>
        <span>🔵 = Opponent</span>
        <span>🎯 = Target zone</span>
        <span>🔶 = Cone</span>
        <span>➡️ = Movement/Ball path</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
        <button onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm shadow-md transition-all">
          Use This Diagram ✓
        </button>
      </div>
    </div>
  );
}
