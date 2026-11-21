export type L3 = { en: string; hi: string; kn: string };
export const l3 = (en: string, hi: string, kn: string): L3 => ({ en, hi, kn });
export type Params = Record<string, number>;

export interface SimParam {
  key: string;
  label: L3;
  min: number;
  max: number;
  step: number;
  unit: string;
  def: number;
  /** When set, shown as a dropdown instead of a slider */
  choices?: { value: number; label: L3 }[];
  /** Changing a live parameter keeps the simulation running instead of restarting it */
  live?: boolean;
}

export interface GraphSpec {
  xLabel: string;
  yLabel: string;
  /** hist rows are [x, y1, y2, ...] */
  series: { label: string; color: string; idx: number }[];
  /** optional fixed x-range end (else uses data) */
  xMax?: (s: any, p: Params) => number;
}

export interface SimDef<S = any> {
  id: string;
  title: L3;
  formula: string;
  what: L3;
  why: L3;
  principle: L3;
  whatIf: L3[];
  params: SimParam[];
  /** false = no play/pause/speed (the picture just reacts to the sliders) */
  animated: boolean;
  /** canvas height in px */
  height?: number;
  init(p: Params): S;
  step(s: S, p: Params, dt: number): void;
  draw(c: CanvasRenderingContext2D, s: S, p: Params, w: number, h: number): void;
  readings(s: S, p: Params): { label: L3; value: string }[];
  graph?: GraphSpec;
}

export const defaults = (params: SimParam[]): Params =>
  Object.fromEntries(params.map((q) => [q.key, q.def]));

export const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/* ---------- small canvas helpers ---------- */
export const INK = '#2E1A6E';
export const TEAL = '#6D28D9';
export const AMBER = '#F07C00';
export const RED = '#B91C1C';
export const PURPLE = '#7C3AED';
export const PAPER = '#FFFDF7';

export function arrow(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = INK, width = 2.5) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return;
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  const h = Math.min(10, len * 0.4);
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - h * Math.cos(ang - 0.4), y2 - h * Math.sin(ang - 0.4));
  c.lineTo(x2 - h * Math.cos(ang + 0.4), y2 - h * Math.sin(ang + 0.4));
  c.closePath();
  c.fill();
}
export function label(c: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 13, align: CanvasTextAlign = 'left') {
  c.fillStyle = color;
  c.font = `600 ${size}px system-ui, sans-serif`;
  c.textAlign = align;
  c.fillText(text, x, y);
}
