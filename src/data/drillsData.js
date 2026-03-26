import { serveData } from './drillsServe.js';
import { returnData } from './drillsReturn.js';
import { footworkData } from './drillsFootwork.js';
import { netPlayData } from './drillsNetPlay.js';
import { baselineData } from './drillsBaseline.js';
import { fitnessData, mentalData, matchData, skillData } from './drillsRest.js';

export const PRESET_DRILLS = [
  ...serveData,
  ...returnData,
  ...footworkData,
  ...netPlayData,
  ...baselineData,
  ...fitnessData,
  ...mentalData,
  ...matchData,
  ...skillData,
];

export const CATEGORIES = [...new Set(PRESET_DRILLS.map(d => d.category))];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export const getDrillById = (id) => PRESET_DRILLS.find(d => d.id === id);
export const getDrillsByCategory = (cat) => PRESET_DRILLS.filter(d => d.category === cat);

// Base court SVG (the green court + lines) — used as background for all drills
export const BASE_COURT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 502">
  <defs>
    <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"/>
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
</svg>`;

// Render a full court SVG with overlay injected before the closing tag
export const renderCourtSVG = (overlay = '') => `
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
  ${overlay}
</svg>`;
