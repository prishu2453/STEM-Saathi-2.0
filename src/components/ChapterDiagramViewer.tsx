import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { DiagramKind, SyllabusSubject } from '../../shared/syllabus/types';

interface ChapterDiagramViewerProps {
  kind: DiagramKind;
  caption: string;
  subject?: SyllabusSubject | 'mathematics';
  lowPowerMode?: boolean;
}

const SLIDER_LABELS: Record<DiagramKind, { label: string; min: number; max: number; unit: string }> = {
  'projectile-motion': { label: 'Launch Angle θ', min: 15, max: 75, unit: '°' },
  'force-friction': { label: 'Applied Force F', min: 10, max: 90, unit: 'N' },
  'pressure-depth': { label: 'Liquid Depth h', min: 10, max: 90, unit: 'cm' },
  'electric-circuit': { label: 'Supply Voltage V', min: 2, max: 12, unit: 'V' },
  'magnet-induction': { label: 'Magnet Speed / Flux Rate', min: 10, max: 90, unit: '%' },
  'optics-lens-mirror': { label: 'Object Distance u', min: 20, max: 85, unit: 'cm' },
  'waves-sound': { label: 'Wave Frequency ν', min: 20, max: 90, unit: 'Hz' },
  'gas-particles': { label: 'Absolute Temp T', min: 200, max: 600, unit: 'K' },
  'solar-shadows': { label: 'Sun Elevation Angle', min: 15, max: 85, unit: '°' },
  'chemical-reaction': { label: 'Reaction Progress', min: 0, max: 100, unit: '%' },
  'acids-bases-ph': { label: 'Solution pH Value', min: 1, max: 14, unit: 'pH' },
  'states-of-matter': { label: 'Thermal Energy / Temp', min: 10, max: 95, unit: '°C' },
  'cell-osmosis': { label: 'External Salt Concentration', min: 0, max: 100, unit: '%' },
  'photosynthesis-stomata': { label: 'Sunlight Intensity', min: 10, max: 100, unit: '%' },
  'human-circulatory': { label: 'Heart / Activity Rate', min: 60, max: 150, unit: 'bpm' },
  'ecosystem-web': { label: 'Solar Energy Input', min: 20, max: 100, unit: '%' },
  'quantum-photoelectric': { label: 'Photon Energy hf', min: 10, max: 60, unit: '×0.1 eV' },
};

export const ChapterDiagramViewer: React.FC<ChapterDiagramViewerProps> = ({
  kind,
  caption,
  lowPowerMode = false,
}) => {
  const cfg = SLIDER_LABELS[kind];
  const initialVal = Math.round((cfg.min + cfg.max) / 2);
  const [param, setParam] = useState<number>(initialVal);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setParam(Math.round((cfg.min + cfg.max) / 2));
    setPlaying(false);
  }, [kind, cfg.min, cfg.max]);

  useEffect(() => {
    if (!playing || lowPowerMode) return;
    const timer = window.setInterval(() => {
      setParam((prev) => {
        const step = Math.max(1, Math.round((cfg.max - cfg.min) / 24));
        const next = prev + step;
        return next > cfg.max ? cfg.min : next;
      });
    }, 140);
    return () => window.clearInterval(timer);
  }, [playing, lowPowerMode, cfg.min, cfg.max]);

  const norm = (param - cfg.min) / Math.max(1, cfg.max - cfg.min);

  const renderDiagramSvg = () => {
    switch (kind) {
      case 'projectile-motion': {
        const rad = (param * Math.PI) / 180;
        const range = 250 * Math.sin(2 * rad);
        const peakY = 148 - 115 * Math.sin(rad) * Math.sin(rad);
        const endX = 40 + range;
        const midX = 40 + range / 2;
        return (
          <g>
            <line x1="30" y1="150" x2="330" y2="150" stroke="#2E1A6E" strokeWidth="2" />
            <path
              d={`M 40 150 Q ${midX} ${peakY - 40}, ${endX} 150`}
              fill="none"
              stroke="#6D28D9"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <circle cx={40} cy={150} r="6" fill="#2E1A6E" />
            <circle cx={midX} cy={(150 + peakY - 40) / 2 + 12} r="7" fill="#FF9F1C" />
            <circle cx={endX} cy={150} r="6" fill="#6D28D9" />
            <text x="42" y="28" fill="#2E1A6E" fontSize="11" fontWeight="600">
              θ = {param}° · Max Height &amp; Range Preview
            </text>
          </g>
        );
      }

      case 'force-friction': {
        const net = Math.max(0, param - 30);
        const blockX = 95 + norm * 90;
        return (
          <g>
            <line x1="25" y1="145" x2="335" y2="145" stroke="#2E1A6E" strokeWidth="2.5" />
            <rect
              x={blockX}
              y="98"
              width="66"
              height="46"
              rx="6"
              fill="#FFFFFF"
              stroke="#2E1A6E"
              strokeWidth="2.5"
            />
            <text x={blockX + 16} y="125" fill="#2E1A6E" fontSize="11" fontWeight="700">
              Mass m
            </text>
            <line
              x1={blockX + 68}
              y1="120"
              x2={blockX + 68 + 25 + norm * 45}
              y2="120"
              stroke="#6D28D9"
              strokeWidth="3.5"
            />
            <line
              x1={blockX - 4}
              y1="138"
              x2={blockX - 38}
              y2="138"
              stroke="#D97706"
              strokeWidth="3"
            />
            <text x="26" y="28" fill="#2E1A6E" fontSize="11" fontWeight="600">
              Applied: {param} N | Static/Kinetic Friction ≈ 30 N | Net F ≈ {net} N
            </text>
          </g>
        );
      }

      case 'pressure-depth': {
        const holeY = 48 + norm * 92;
        const jetLen = 35 + norm * 115;
        return (
          <g>
            <rect x="65" y="34" width="95" height="122" fill="#EFE7FF" stroke="#2E1A6E" strokeWidth="2.5" />
            <line x1="65" y1="45" x2="160" y2="45" stroke="#6D28D9" strokeWidth="2" />
            <circle cx="160" cy={holeY} r="4" fill="#2E1A6E" />
            <path
              d={`M 162 ${holeY} Q ${162 + jetLen * 0.55} ${holeY}, ${162 + jetLen} 156`}
              fill="none"
              stroke="#6D28D9"
              strokeWidth="3.5"
            />
            <text x="172" y="34" fill="#2E1A6E" fontSize="11" fontWeight="600">
              P = h ρ g · Depth h = {param} cm
            </text>
          </g>
        );
      }

      case 'electric-circuit': {
        const current = (param / 4).toFixed(2);
        return (
          <g>
            <rect x="60" y="40" width="220" height="105" rx="8" fill="none" stroke="#2E1A6E" strokeWidth="2.5" />
            <rect x="44" y="74" width="32" height="36" rx="4" fill="#F5F0FF" stroke="#6D28D9" strokeWidth="2" />
            <text x="48" y="96" fill="#2E1A6E" fontSize="10" fontWeight="700">
              {param}V
            </text>
            <rect x="145" y="28" width="60" height="24" rx="4" fill="#FFFFFF" stroke="#2E1A6E" strokeWidth="2" />
            <text x="155" y="44" fill="#2E1A6E" fontSize="10" fontWeight="700">
              R = 4 Ω
            </text>
            <circle cx="280" cy="92" r="17" fill="#FFFFFF" stroke="#6D28D9" strokeWidth="2.5" />
            <text x="275" y="96" fill="#6D28D9" fontSize="11" fontWeight="700">
              A
            </text>
            <text x="115" y="96" fill="#2E1A6E" fontSize="12" fontWeight="700">
              I = V / R = {current} A
            </text>
          </g>
        );
      }

      case 'magnet-induction': {
        const magX = 35 + norm * 90;
        const needleDeg = -35 + norm * 70;
        return (
          <g>
            <rect x={magX} y="75" width="70" height="28" rx="4" fill="#2E1A6E" />
            <rect x={magX + 35} y="75" width="35" height="28" rx="4" fill="#6D28D9" />
            <text x={magX + 12} y="93" fill="#FFF" fontSize="11" fontWeight="700">
              S
            </text>
            <text x={magX + 48} y="93" fill="#FFF" fontSize="11" fontWeight="700">
              N
            </text>
            <ellipse cx="220" cy="89" rx="18" ry="38" fill="none" stroke="#FF9F1C" strokeWidth="4" />
            <ellipse cx="235" cy="89" rx="18" ry="38" fill="none" stroke="#D97706" strokeWidth="3.5" />
            <circle cx="305" cy="89" r="24" fill="#FFFFFF" stroke="#2E1A6E" strokeWidth="2" />
            <line
              x1="305"
              y1="89"
              x2={305 + 16 * Math.sin((needleDeg * Math.PI) / 180)}
              y2={89 - 16 * Math.cos((needleDeg * Math.PI) / 180)}
              stroke="#6D28D9"
              strokeWidth="3"
            />
            <text x="35" y="30" fill="#2E1A6E" fontSize="11" fontWeight="600">
              ε = −N (dΦ_B/dt) · Flux Change Rate: {param}%
            </text>
          </g>
        );
      }

      case 'optics-lens-mirror': {
        const objX = 165 - (28 + norm * 85);
        return (
          <g>
            <line x1="20" y1="92" x2="340" y2="92" stroke="#4A3F66" strokeDasharray="4 3" strokeWidth="1.5" />
            <ellipse cx="180" cy="92" rx="10" ry="52" fill="#EFE7FF" stroke="#6D28D9" strokeWidth="2.5" />
            <line x1={objX} y1="92" x2={objX} y2="54" stroke="#2E1A6E" strokeWidth="3.5" />
            <line x1={objX} y1="54" x2="180" y2="54" stroke="#FF9F1C" strokeWidth="2" />
            <line x1="180" y1="54" x2="290" y2="128" stroke="#FF9F1C" strokeWidth="2" />
            <line x1={objX} y1="54" x2="290" y2="128" stroke="#6D28D9" strokeWidth="2" />
            <circle cx="228" cy="92" r="3" fill="#2E1A6E" />
            <text x="224" y="106" fill="#2E1A6E" fontSize="10" fontWeight="700">
              F
            </text>
            <text x="25" y="25" fill="#2E1A6E" fontSize="11" fontWeight="600">
              Convex Lens Ray Tracing · u = −{param} cm
            </text>
          </g>
        );
      }

      case 'waves-sound': {
        const cycles = 2 + Math.round(norm * 5);
        const pts: string[] = [];
        for (let x = 25; x <= 335; x += 4) {
          const t = (x - 25) / 310;
          const y = 92 - 36 * Math.sin(t * cycles * Math.PI * 2);
          pts.push(`${x},${y.toFixed(1)}`);
        }
        return (
          <g>
            <line x1="25" y1="92" x2="335" y2="92" stroke="#CBD5E1" strokeWidth="1.5" />
            <polyline fill="none" stroke="#6D28D9" strokeWidth="3" points={pts.join(' ')} />
            <text x="25" y="28" fill="#2E1A6E" fontSize="11" fontWeight="600">
              Wave Profile · Frequency = {param} Hz (v = f λ)
            </text>
          </g>
        );
      }

      case 'gas-particles': {
        const pistonY = 38 + (1 - norm) * 40;
        const speedDots = [
          { x: 115, y: 115 },
          { x: 165, y: 128 },
          { x: 205, y: 108 },
          { x: 140, y: 140 },
          { x: 230, y: 135 },
        ];
        return (
          <g>
            <rect x="90" y="34" width="170" height="122" fill="#F5F0FF" stroke="#2E1A6E" strokeWidth="2.5" />
            <rect x="92" y={pistonY} width="166" height="12" fill="#2E1A6E" />
            {speedDots.map((d, i) => (
              <circle
                key={i}
                cx={d.x + Math.round(norm * ((i % 2 === 0 ? 1 : -1) * 14))}
                cy={Math.max(pistonY + 18, d.y)}
                r="5.5"
                fill="#6D28D9"
              />
            ))}
            <text x="24" y="22" fill="#2E1A6E" fontSize="11" fontWeight="600">
              Ideal Gas Cylinder · T = {param} K (PV = nRT)
            </text>
          </g>
        );
      }

      case 'quantum-photoelectric': {
        const photonEv = param / 10;
        const phi = 2.3; // work function of the metal in this diagram (eV)
        const emitted = photonEv > phi;
        const kMax = Math.max(0, photonEv - phi);
        const escape = 20 + Math.min(kMax, 3.7) * 30;
        return (
          <g>
            <rect x="40" y="110" width="150" height="24" fill="#C9BFEA" stroke="#2E1A6E" strokeWidth="2" />
            <text x="48" y="127" fill="#2E1A6E" fontSize="11" fontWeight="600">Metal (φ = {phi} eV)</text>
            <line x1="70" y1="20" x2="100" y2="106" stroke="#F07C00" strokeWidth="3" />
            <line x1="120" y1="20" x2="140" y2="106" stroke="#F07C00" strokeWidth="3" />
            {emitted &&
              [0, 1].map((i) => (
                <g key={i}>
                  <circle cx={105 + i * 45 + escape} cy={106 - escape} r="5" fill="#6D28D9" />
                  <line x1={105 + i * 45} y1="106" x2={105 + i * 45 + escape} y2={106 - escape} stroke="#6D28D9" strokeWidth="1.5" strokeDasharray="3 3" />
                </g>
              ))}
            <text x="30" y="156" fill="#2E1A6E" fontSize="11" fontWeight="600">
              {emitted
                ? `E = ${photonEv.toFixed(1)} eV > φ → electrons escape, K_max = ${kMax.toFixed(1)} eV`
                : `E = ${photonEv.toFixed(1)} eV ≤ φ → no electrons, however bright the light`}
            </text>
          </g>
        );
      }

      case 'acids-bases-ph': {
        const indicatorColor =
          param <= 5 ? '#E11D48' : param <= 8 ? '#6D28D9' : '#1D4ED8';
        return (
          <g>
            <rect x="35" y="64" width="290" height="24" rx="12" fill="#F5F0FF" stroke="#2E1A6E" strokeWidth="2" />
            <circle cx={45 + ((param - 1) / 13) * 270} cy="76" r="14" fill={indicatorColor} />
            <text x={38 + ((param - 1) / 13) * 270} y="80" fill="#FFF" fontSize="10" fontWeight="700">
              {param}
            </text>
            <text x="35" y="114" fill="#E11D48" fontSize="11" fontWeight="700">
              Acidic (pH &lt; 7)
            </text>
            <text x="155" y="114" fill="#6D28D9" fontSize="11" fontWeight="700">
              Neutral (7)
            </text>
            <text x="255" y="114" fill="#1D4ED8" fontSize="11" fontWeight="700">
              Basic (pH &gt; 7)
            </text>
          </g>
        );
      }

      case 'cell-osmosis': {
        const radius = 48 - norm * 18;
        return (
          <g>
            <rect x="65" y="34" width="230" height="122" rx="16" fill="#EFE7FF" stroke="#2E1A6E" strokeWidth="2.5" />
            <circle cx="180" cy="95" r={radius} fill="#FDE68A" stroke="#6D28D9" strokeWidth="3" />
            <circle cx="180" cy="95" r="12" fill="#2E1A6E" />
            <text x="28" y="23" fill="#2E1A6E" fontSize="11" fontWeight="600">
              Osmosis · Solute Outside: {param}% ({param < 35 ? 'Turgid' : param > 65 ? 'Plasmolysed' : 'Isotonic'})
            </text>
          </g>
        );
      }

      default: {
        const barW = 40 + norm * 220;
        return (
          <g>
            <rect x="35" y="42" width="290" height="96" rx="14" fill="#F5F0FF" stroke="#2E1A6E" strokeWidth="2" />
            <circle cx="95" cy="90" r="24" fill="#EFE7FF" stroke="#6D28D9" strokeWidth="2.5" />
            <circle cx="180" cy="90" r="24" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
            <circle cx="265" cy="90" r="24" fill="#E0E7FF" stroke="#2E1A6E" strokeWidth="2.5" />
            <line x1="119" y1="90" x2="156" y2="90" stroke="#2E1A6E" strokeWidth="2.5" />
            <line x1="204" y1="90" x2="241" y2="90" stroke="#6D28D9" strokeWidth="2.5" />
            <rect x="35" y="148" width={barW} height="8" rx="4" fill="#6D28D9" />
            <text x="36" y="30" fill="#2E1A6E" fontSize="11" fontWeight="600">
              {cfg.label}: {param} {cfg.unit}
            </text>
          </g>
        );
      }
    }
  };

  return (
    <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-3">
      <div className="rounded-xl bg-white dark:bg-[#102235] border border-[#E7DDFB] dark:border-[#3B2C78] p-2 overflow-hidden">
        <svg viewBox="0 0 360 175" className="w-full h-auto max-h-56" role="img" aria-label={caption}>
          {renderDiagramSvg()}
        </svg>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex-1 space-y-1 text-xs">
          <div className="flex items-center justify-between font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
            <span>{cfg.label}</span>
            <span className="tabular-nums text-[#5B21B6] dark:text-[#C4B5FD]">
              {param} {cfg.unit}
            </span>
          </div>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            value={param}
            onChange={(e) => setParam(Number(e.target.value))}
            className="w-full accent-[#6D28D9] cursor-pointer"
          />
        </label>

        {!lowPowerMode && (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#2E1A6E] dark:text-white hover:border-[#6D28D9] cursor-pointer"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{playing ? 'Pause Sweep' : 'Animate Diagram'}</span>
          </button>
        )}
      </div>

      <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] leading-relaxed">{caption}</p>
    </div>
  );
};
