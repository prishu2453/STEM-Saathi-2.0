/**
 * The concept graph drawn as four chapter columns; each node is coloured by mastery
 * and arrows point from a prerequisite to what builds on it.
 */
import React, { useMemo } from 'react';
import { CHAPTERS, CONCEPTS, DEPTH, type ChapterKey } from '../../../shared/tutor/conceptGraph';
import type { Language } from '../../types/stem';
import { STATUS_COLOR } from './tutorText';

export interface NodeView {
  status: keyof typeof STATUS_COLOR;
  value: number | null; // mastery 0..1, null = unknown
  inferred?: boolean;
  due?: boolean;
}

interface Props {
  language: Language;
  nodes: Record<string, NodeView>;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Optional caption under each node (e.g. "12 of 28 have a gap" on the teacher view). */
  caption?: (id: string) => string | null;
}

const COL_W = 200;
const NODE_W = 170;
const NODE_H = 52;
const ROW_H = 70;
const TOP = 44;

function wrap(text: string, max = 22): string[] {
  const words = text.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  if (lines.length > 2) return [lines[0], `${lines.slice(1).join(' ').slice(0, max - 1)}…`];
  return lines;
}

export const ConceptMap: React.FC<Props> = ({ language, nodes, selected, onSelect, caption }) => {
  const layout = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const colOf: Record<ChapterKey, number> = { light: 0, eye: 1, electricity: 2, magnetism: 3 };
    let maxRows = 0;
    for (const ch of CHAPTERS) {
      const list = CONCEPTS.filter((c) => c.chapter === ch.key).sort((a, b) => DEPTH[a.id] - DEPTH[b.id]);
      list.forEach((c, i) => {
        pos[c.id] = { x: colOf[ch.key] * COL_W + (COL_W - NODE_W) / 2, y: TOP + i * ROW_H };
      });
      maxRows = Math.max(maxRows, list.length);
    }
    return { pos, width: COL_W * CHAPTERS.length, height: TOP + maxRows * ROW_H };
  }, []);

  const edges = CONCEPTS.flatMap((c) => c.prereqs.map((p) => ({ from: p, to: c.id })));

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full min-w-[720px] h-auto"
        role="img"
        aria-label="Concept map: arrows go from a prerequisite to the concept that builds on it"
      >
        <defs>
          <marker id="cm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-[#94A3B8]" />
          </marker>
        </defs>
        {CHAPTERS.map((ch, i) => (
          <text key={ch.key} x={i * COL_W + COL_W / 2} y={22} textAnchor="middle" className="fill-[#2E1A6E] dark:fill-[#F5F0FF] text-[12px] font-semibold">
            {ch.ncert} · {(ch.name[language] || ch.name.en).split(':')[0]}
          </text>
        ))}
        {edges.map(({ from, to }) => {
          const a = layout.pos[from];
          const b = layout.pos[to];
          const sameCol = Math.abs(a.x - b.x) < 1;
          const hot = selected === from || selected === to;
          let d: string;
          if (sameCol) {
            // route down the left edge so stacked arrows do not hide behind nodes
            const x1 = a.x + 10;
            const y1 = a.y + NODE_H;
            const x2 = b.x + 10;
            const y2 = b.y;
            const bend = b.y - a.y > ROW_H + 1 ? -18 : 0;
            d = `M ${x1} ${y1} C ${x1 + bend} ${y1 + 20}, ${x2 + bend} ${y2 - 20}, ${x2} ${y2}`;
          } else {
            const forward = b.x > a.x;
            const x1 = forward ? a.x + NODE_W : a.x;
            const x2 = forward ? b.x : b.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const y2 = b.y + NODE_H / 2;
            const mid = (x1 + x2) / 2;
            d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
          }
          return (
            <path
              key={`${from}-${to}`}
              d={d}
              fill="none"
              strokeWidth={hot ? 2.2 : 1.2}
              className={hot ? 'stroke-[#2E1A6E] dark:stroke-[#F5F0FF]' : 'stroke-[#94A3B8]/70'}
              markerEnd="url(#cm-arrow)"
            />
          );
        })}
        {CONCEPTS.map((c) => {
          const p = layout.pos[c.id];
          const n = nodes[c.id] ?? { status: 'unseen', value: null };
          const color = STATUS_COLOR[n.status];
          const lines = wrap(c.name[language] || c.name.en);
          const isSel = selected === c.id;
          const cap = caption?.(c.id);
          return (
            <g
              key={c.id}
              transform={`translate(${p.x},${p.y})`}
              onClick={() => onSelect?.(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.(c.id);
                }
              }}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={`${c.name.en}: ${n.value === null ? 'not tested' : `${Math.round(n.value * 100)}% mastery`}`}
              className={onSelect ? 'cursor-pointer outline-none' : undefined}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                className={`fill-white dark:fill-[#1F1545] ${isSel ? 'stroke-[#2E1A6E] dark:stroke-[#F5F0FF]' : ''}`}
                stroke={isSel ? undefined : color}
                strokeWidth={isSel ? 3 : 2}
                strokeDasharray={n.inferred ? '5 3' : undefined}
              />
              <rect x={0} y={0} width={6} height={NODE_H} rx={3} fill={color} />
              {lines.map((l, i) => (
                <text key={i} x={14} y={lines.length === 1 ? 24 : 18 + i * 14} className="fill-[#2E1A6E] dark:fill-[#F5F0FF] text-[11.5px] font-medium">
                  {l}
                </text>
              ))}
              <rect x={14} y={NODE_H - 10} width={NODE_W - 60} height={4} rx={2} className="fill-[#E7DDFB] dark:fill-[#3B2C78]" />
              {n.value !== null && <rect x={14} y={NODE_H - 10} width={(NODE_W - 60) * n.value} height={4} rx={2} fill={color} />}
              <text x={NODE_W - 8} y={NODE_H - 6} textAnchor="end" className="fill-[#4A3F66] dark:fill-[#C9BFEA] text-[10px] font-mono">
                {n.value === null ? '—' : `${Math.round(n.value * 100)}%`}
              </text>
              {n.due && <circle cx={NODE_W - 8} cy={9} r={4.5} className="fill-[#7C3AED]" />}
              {cap && (
                <text x={NODE_W / 2} y={NODE_H + 11} textAnchor="middle" className="fill-[#C2410C] dark:fill-[#F5B38A] text-[9.5px] font-medium">
                  {cap}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
