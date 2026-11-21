/**
 * Five full "experiment stations" (Simple Pendulum, Torricelli, Bernoulli, Concave and Convex mirror).
 * Every number on screen is computed from the current parameters and the running simulation state —
 * nothing is hard-coded or random.
 */
import { AMBER, INK, PURPLE, RED, TEAL, arrow, clamp, fmt, l3, label, type L3, type Params, type SimParam } from './simTypes';

export type Lang = 'en' | 'hi' | 'kn';
const tr = (lang: Lang, en: string, hi: string, kn: string) => (lang === 'hi' ? hi : lang === 'kn' ? kn : en);
import { STATION_ORDER, isStationId, type StationId } from './stationIds';
export { STATION_ORDER, isStationId, type StationId };

export interface QuizItem {
  q: L3;
  options: L3[];
  correct: number;
  explain: L3;
}

export interface StationDef<S = any> {
  id: StationId;
  title: L3;
  intro: L3;
  params: SimParam[];
  /** speeds offered in the speed menu */
  speeds: number[];
  /** keep parameters physically consistent (e.g. hole below water level) */
  constrain?: (p: Params) => Params;
  init(p: Params): S;
  step(s: S, p: Params, dt: number): void;
  draw(c: CanvasRenderingContext2D, s: S, p: Params, w: number, h: number, dark: boolean, lang: Lang): void;
  readings(s: S, p: Params): { label: L3; value: string; unit?: string; accent?: boolean; nature?: L3 }[];
  formulas: { expr: string; note: L3 }[];
  /** the main formula with the student's current numbers substituted */
  liveFormula(s: S, p: Params): string;
  principle: L3;
  observations: L3[];
  assumptions: L3[];
  quiz: QuizItem[];
}

const G = 9.8;
const RHO = 1000;
const P_ATM = 101.325; // kPa

/* ---------------- drawing helpers ---------------- */
function fit(w: number, h: number, xmin: number, xmax: number, ymin: number, ymax: number, padPx = 28) {
  const s = Math.min((w - 2 * padPx) / (xmax - xmin), (h - 2 * padPx) / (ymax - ymin));
  const ox = (w - s * (xmax - xmin)) / 2 - s * xmin;
  const oy = (h + s * (ymax - ymin)) / 2 + s * ymin;
  return { s, X: (x: number) => ox + s * x, Y: (y: number) => oy - s * y };
}
const colors = (dark: boolean) => ({
  ink: dark ? '#F3EFFF' : INK,
  soft: dark ? '#9FB3C8' : '#5B6B73',
  grid: dark ? '#26405C' : '#E8E0CB',
  bg: dark ? '#120A28' : '#FFFDF7',
  water: dark ? 'rgba(74,163,230,0.55)' : 'rgba(56,140,214,0.45)',
  waterDeep: dark ? 'rgba(30,90,170,0.75)' : 'rgba(26,86,170,0.6)',
});
function dashed(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, w = 1.5, dash = [6, 5]) {
  c.save();
  c.setLineDash(dash);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
  c.restore();
}
function dimArrow(c: CanvasRenderingContext2D, x: number, y1: number, y2: number, text: string, color: string) {
  if (Math.abs(y2 - y1) < 4) return;
  arrow(c, x, (y1 + y2) / 2, x, y1, color, 1.5);
  arrow(c, x, (y1 + y2) / 2, x, y2, color, 1.5);
  label(c, text, x - 6, (y1 + y2) / 2 + 4, color, 12, 'right');
}
function panel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dark: boolean) {
  c.save();
  c.fillStyle = dark ? 'rgba(21,42,64,0.92)' : 'rgba(255,255,255,0.92)';
  c.strokeStyle = dark ? '#3B2C78' : '#E7DDFB';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(x, y, w, h, 10);
  c.fill();
  c.stroke();
  c.restore();
}
/** Arithmetic-geometric mean — gives the exact pendulum period for any amplitude. */
function agm(a: number, b: number) {
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return a;
}
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

/* =====================================================================
   1. SIMPLE PENDULUM — full non-linear equation θ'' = −(g/L)·sin θ (RK4)
   ===================================================================== */
interface PendState {
  th: number;
  om: number;
  t: number;
  lastCross: number | null;
  measured: number | null;
  hist: [number, number][];
}
const pendulum: StationDef<PendState> = {
  id: 'pendulum',
  title: l3('Simple Pendulum', 'सरल लोलक', 'ಸರಳ ಲೋಲಕ'),
  intro: l3(
    'A small heavy bob hangs from a light string. Pull it aside and let go: it swings back and forth. Find out what decides how long one swing takes.',
    'एक हल्की डोरी से छोटा भारी गोलक लटका है। उसे एक ओर खींचकर छोड़ें — वह आगे-पीछे झूलता है। पता करें कि एक दोलन का समय किस पर निर्भर करता है।',
    'ಹಗುರವಾದ ದಾರಕ್ಕೆ ಸಣ್ಣ ಭಾರವಾದ ಗುಂಡು ತೂಗುಹಾಕಲಾಗಿದೆ. ಅದನ್ನು ಪಕ್ಕಕ್ಕೆ ಎಳೆದು ಬಿಡಿ — ಅದು ಹಿಂದೆ-ಮುಂದೆ ತೂಗುತ್ತದೆ. ಒಂದು ತೂಗಾಟದ ಸಮಯ ಯಾವುದರ ಮೇಲೆ ಅವಲಂಬಿತ ಎಂದು ಕಂಡುಹಿಡಿಯಿರಿ.'
  ),
  params: [
    { key: 'L', label: l3('Length of string (L)', 'डोरी की लंबाई (L)', 'ದಾರದ ಉದ್ದ (L)'), min: 0.2, max: 2.5, step: 0.05, unit: 'm', def: 1 },
    { key: 'th0', label: l3('Starting angle (θ₀)', 'प्रारंभिक कोण (θ₀)', 'ಆರಂಭಿಕ ಕೋನ (θ₀)'), min: 2, max: 80, step: 1, unit: '°', def: 15 },
    { key: 'g', label: l3('Gravity (g)', 'गुरुत्व (g)', 'ಗುರುತ್ವ (g)'), min: 1.6, max: 25, step: 0.1, unit: 'm/s²', def: 9.8 },
  ],
  speeds: [0.25, 0.5, 1, 2],
  init: (p) => ({ th: rad(p.th0), om: 0, t: 0, lastCross: null, measured: null, hist: [[0, p.th0]] }),
  step(s, p, dt) {
    const f = (th: number) => -(p.g / p.L) * Math.sin(th);
    const k1t = s.om, k1o = f(s.th);
    const k2t = s.om + (dt / 2) * k1o, k2o = f(s.th + (dt / 2) * k1t);
    const k3t = s.om + (dt / 2) * k2o, k3o = f(s.th + (dt / 2) * k2t);
    const k4t = s.om + dt * k3o, k4o = f(s.th + dt * k3t);
    const prevTh = s.th;
    s.th += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    s.om += (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
    s.t += dt;
    // one full period = time between two upward crossings of the vertical
    if (prevTh < 0 && s.th >= 0) {
      const tc = s.t - dt * (s.th / (s.th - prevTh)); // interpolate the exact crossing time
      if (s.lastCross !== null) s.measured = tc - s.lastCross;
      s.lastCross = tc;
    }
    const last = s.hist[s.hist.length - 1];
    if (s.t - last[0] >= 0.02) {
      s.hist.push([s.t, deg(s.th)]);
      while (s.hist.length && s.t - s.hist[0][0] > 12) s.hist.shift();
    }
  },
  draw(c, s, p, w, h, dark) {
    const k = colors(dark);
    const LMAX = 2.5;
    const graphH = Math.min(150, h * 0.24);
    const areaH = h - graphH - 10;
    const px = w * 0.38;
    const py = 36;
    const insetLeft = w - Math.min(250, w * 0.3) - 12;
    // one fixed metres→pixels scale for every length (so a longer string really looks longer);
    // the sideways room needed depends on the swing angle actually chosen
    const halfW = LMAX * Math.sin(Math.min(rad(p.th0), Math.PI / 2)) + 0.12;
    const scale = Math.min((areaH - 60) / (LMAX * 1.02), Math.min(px - 16, insetLeft - px - 8) / halfW);
    // ceiling
    c.fillStyle = k.soft;
    c.fillRect(px - 70, py - 10, 140, 10);
    c.strokeStyle = k.soft;
    for (let i = -70; i < 70; i += 10) {
      c.beginPath();
      c.moveTo(px + i, py - 10);
      c.lineTo(px + i + 8, py - 20);
      c.stroke();
    }
    const Lpx = p.L * scale;
    // amplitude arc + vertical reference
    dashed(c, px, py, px, py + Lpx + 30, k.soft, 1);
    c.save();
    c.setLineDash([3, 5]);
    c.strokeStyle = k.grid;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(px, py, Lpx, Math.PI / 2 - rad(p.th0), Math.PI / 2 + rad(p.th0));
    c.stroke();
    c.restore();
    const bx = px + Lpx * Math.sin(s.th);
    const by = py + Lpx * Math.cos(s.th);
    // string
    c.strokeStyle = k.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(bx, by);
    c.stroke();
    // angle arc
    c.strokeStyle = AMBER;
    c.lineWidth = 2;
    c.beginPath();
    const a0 = Math.PI / 2, a1 = Math.PI / 2 - s.th;
    c.arc(px, py, Math.min(46, Lpx * 0.4), Math.min(a0, a1), Math.max(a0, a1));
    c.stroke();
    label(c, `θ = ${fmt(deg(s.th), 1)}°`, px + (s.th >= 0 ? 10 : -86), py + Math.min(46, Lpx * 0.4) + 18, AMBER, 13);
    // bob with shading
    const r = 15;
    const grad = c.createRadialGradient(bx - 5, by - 5, 2, bx, by, r);
    grad.addColorStop(0, '#FBD38D');
    grad.addColorStop(1, '#B7791F');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(bx, by, r, 0, Math.PI * 2);
    c.fill();
    // velocity arrow (tangent)
    const v = p.L * s.om;
    const vlen = clamp(v * 22, -90, 90);
    if (Math.abs(vlen) > 3) arrow(c, bx, by, bx + vlen * Math.cos(s.th), by - vlen * Math.sin(s.th), TEAL, 2.5);
    // length label + scale bar
    label(c, `L = ${fmt(p.L, 2)} m`, (px + bx) / 2 + 10, (py + by) / 2, k.ink, 13);
    c.strokeStyle = k.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(16, areaH - 14);
    c.lineTo(16 + 0.5 * scale, areaH - 14);
    c.stroke();
    label(c, '0.5 m', 16, areaH - 20, k.soft, 11);

    // inset: T vs L for the current g
    const iw = Math.min(250, w * 0.3), ih = Math.min(170, areaH * 0.42);
    const ix = w - iw - 12, iy = 12;
    panel(c, ix, iy, iw, ih, dark);
    const tMax = 2 * Math.PI * Math.sqrt(LMAX / p.g) * 1.15;
    const gx = (L: number) => ix + 36 + (L / LMAX) * (iw - 50);
    const gy = (T: number) => iy + ih - 26 - (T / tMax) * (ih - 52);
    c.strokeStyle = k.soft;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(gx(0), gy(tMax));
    c.lineTo(gx(0), gy(0));
    c.lineTo(gx(LMAX), gy(0));
    c.stroke();
    c.strokeStyle = TEAL;
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 50; i++) {
      const L = (LMAX * i) / 50;
      const T = 2 * Math.PI * Math.sqrt(L / p.g);
      if (i === 0) c.moveTo(gx(L), gy(T));
      else c.lineTo(gx(L), gy(T));
    }
    c.stroke();
    const Tnow = (2 * Math.PI * Math.sqrt(p.L / p.g)) / agm(1, Math.cos(rad(p.th0) / 2));
    c.fillStyle = AMBER;
    c.beginPath();
    c.arc(gx(p.L), gy(Tnow), 5, 0, Math.PI * 2);
    c.fill();
    label(c, 'T (s) vs L (m)', ix + 10, iy + 16, k.ink, 12);
    label(c, `g = ${fmt(p.g, 1)}`, ix + iw - 10, iy + 16, k.soft, 11, 'right');
    label(c, fmt(tMax, 1), ix + 30, gy(tMax) + 4, k.soft, 10, 'right');
    label(c, '0', ix + 30, gy(0) + 4, k.soft, 10, 'right');
    label(c, `${LMAX}`, gx(LMAX), gy(0) + 14, k.soft, 10, 'center');

    // bottom strip: θ vs time
    const gy0 = h - graphH;
    panel(c, 8, gy0, w - 16, graphH - 6, dark);
    const hist = s.hist;
    const t0 = hist[0][0];
    const span = Math.max(4, s.t - t0);
    const TX = (t: number) => 50 + ((t - t0) / span) * (w - 80);
    const amp = Math.max(5, p.th0) * 1.1;
    const TY = (a: number) => gy0 + (graphH - 6) / 2 - (a / amp) * ((graphH - 30) / 2);
    c.strokeStyle = k.grid;
    c.beginPath();
    c.moveTo(50, TY(0));
    c.lineTo(w - 30, TY(0));
    c.stroke();
    c.strokeStyle = PURPLE;
    c.lineWidth = 2;
    c.beginPath();
    hist.forEach(([t, a], i) => (i ? c.lineTo(TX(t), TY(a)) : c.moveTo(TX(t), TY(a))));
    c.stroke();
    label(c, 'θ (°)', 14, gy0 + 18, k.ink, 11);
    label(c, `+${fmt(amp, 0)}`, 46, TY(amp) + 4, k.soft, 10, 'right');
    label(c, `−${fmt(amp, 0)}`, 46, TY(-amp) + 4, k.soft, 10, 'right');
    label(c, `t = ${fmt(s.t, 1)} s`, w - 30, gy0 + 18, k.soft, 11, 'right');
  },
  readings(s, p) {
    const T0 = 2 * Math.PI * Math.sqrt(p.L / p.g);
    const Tex = T0 / agm(1, Math.cos(rad(p.th0) / 2));
    return [
      { label: l3('Time period (theory)', 'आवर्तकाल (सिद्धांत)', 'ಆವರ್ತ ಕಾಲ (ಸಿದ್ಧಾಂತ)'), value: fmt(Tex, 3), unit: 's', accent: true },
      { label: l3('Time period (measured)', 'आवर्तकाल (मापा गया)', 'ಆವರ್ತ ಕಾಲ (ಅಳೆದದ್ದು)'), value: s.measured ? fmt(s.measured, 3) : '…', unit: 's' },
      { label: l3('Small-angle formula 2π√(L/g)', 'लघु-कोण सूत्र 2π√(L/g)', 'ಸಣ್ಣ-ಕೋನ ಸೂತ್ರ 2π√(L/g)'), value: fmt(T0, 3), unit: 's' },
      { label: l3('Frequency f = 1/T', 'आवृत्ति f = 1/T', 'ಆವರ್ತನ f = 1/T'), value: fmt(1 / Tex, 3), unit: 'Hz' },
      { label: l3('Angular displacement θ', 'कोणीय विस्थापन θ', 'ಕೋನೀಯ ಸ್ಥಾನಪಲ್ಲಟ θ'), value: fmt(deg(s.th), 1), unit: '°' },
      { label: l3('Angular velocity ω', 'कोणीय वेग ω', 'ಕೋನೀಯ ವೇಗ ω'), value: fmt(s.om, 2), unit: 'rad/s' },
      { label: l3('Bob speed v = Lω', 'गोलक की चाल v = Lω', 'ಗುಂಡಿನ ವೇಗ v = Lω'), value: fmt(Math.abs(p.L * s.om), 2), unit: 'm/s' },
      { label: l3('Time', 'समय', 'ಸಮಯ'), value: fmt(s.t, 1), unit: 's' },
    ];
  },
  formulas: [
    { expr: 'T = 2π √(L / g)', note: l3('Time period for small angles (below about 15°).', 'छोटे कोणों (लगभग 15° से कम) के लिए आवर्तकाल।', 'ಸಣ್ಣ ಕೋನಗಳಿಗೆ (ಸುಮಾರು 15° ಕ್ಕಿಂತ ಕಡಿಮೆ) ಆವರ್ತ ಕಾಲ.') },
    { expr: 'f = 1 / T', note: l3('Frequency: number of complete swings each second.', 'आवृत्ति: हर सेकंड में पूरे दोलनों की संख्या।', 'ಆವರ್ತನ: ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ ಪೂರ್ಣ ತೂಗಾಟಗಳ ಸಂಖ್ಯೆ.') },
    { expr: 'd²θ/dt² = −(g / L) sin θ', note: l3('The exact equation this simulation solves at every step.', 'सटीक समीकरण जिसे यह सिमुलेशन हर चरण में हल करता है।', 'ಈ ಅನುಕರಣೆ ಪ್ರತಿ ಹಂತದಲ್ಲಿ ಪರಿಹರಿಸುವ ನಿಖರ ಸಮೀಕರಣ.') },
  ],
  liveFormula: (_s, p) => `T = 2π √(${fmt(p.L, 2)} / ${fmt(p.g, 1)}) = ${fmt(2 * Math.PI * Math.sqrt(p.L / p.g), 3)} s`,
  principle: l3(
    'Gravity pulls the bob back towards the lowest point. The pull is stronger when the bob is further out, so the bob speeds up towards the middle, overshoots, and slows down on the other side. A longer string means a longer path for the same angle, so each swing takes more time. The mass of the bob does not matter, because a heavier bob is pulled harder but is also harder to move by exactly the same amount.',
    'गुरुत्व गोलक को सबसे निचले बिंदु की ओर वापस खींचता है। गोलक जितना दूर होता है, खिंचाव उतना अधिक होता है, इसलिए वह बीच की ओर तेज़ होता है, आगे निकल जाता है और दूसरी ओर धीमा होता है। लंबी डोरी में उसी कोण के लिए रास्ता लंबा होता है, इसलिए हर दोलन में अधिक समय लगता है। गोलक का द्रव्यमान मायने नहीं रखता, क्योंकि भारी गोलक पर बल अधिक होता है पर उसे हिलाना भी उतना ही कठिन होता है।',
    'ಗುರುತ್ವವು ಗುಂಡನ್ನು ಅತ್ಯಂತ ಕೆಳಗಿನ ಬಿಂದುವಿನ ಕಡೆಗೆ ಎಳೆಯುತ್ತದೆ. ಗುಂಡು ದೂರ ಇದ್ದಷ್ಟೂ ಎಳೆತ ಹೆಚ್ಚು, ಆದ್ದರಿಂದ ಅದು ಮಧ್ಯದ ಕಡೆ ವೇಗ ಪಡೆಯುತ್ತದೆ, ಮುಂದೆ ಹೋಗಿ ಇನ್ನೊಂದು ಬದಿಯಲ್ಲಿ ನಿಧಾನವಾಗುತ್ತದೆ. ಉದ್ದ ದಾರದಲ್ಲಿ ಅದೇ ಕೋನಕ್ಕೆ ದಾರಿ ಉದ್ದ, ಆದ್ದರಿಂದ ಪ್ರತಿ ತೂಗಾಟಕ್ಕೆ ಹೆಚ್ಚು ಸಮಯ. ಗುಂಡಿನ ದ್ರವ್ಯರಾಶಿ ಪರಿಣಾಮ ಬೀರುವುದಿಲ್ಲ — ಭಾರವಾದ ಗುಂಡಿಗೆ ಬಲ ಹೆಚ್ಚು, ಆದರೆ ಅದನ್ನು ಚಲಿಸುವುದೂ ಅಷ್ಟೇ ಕಷ್ಟ.'
  ),
  observations: [
    l3('Make L four times longer (0.5 m → 2.0 m): the period becomes twice as long, because T ∝ √L.', 'L को चार गुना करें (0.5 m → 2.0 m): आवर्तकाल दोगुना हो जाता है, क्योंकि T ∝ √L।', 'L ಅನ್ನು ನಾಲ್ಕು ಪಟ್ಟು ಮಾಡಿ (0.5 m → 2.0 m): ಆವರ್ತ ಕಾಲ ಎರಡು ಪಟ್ಟಾಗುತ್ತದೆ, ಏಕೆಂದರೆ T ∝ √L.'),
    l3('Lower g to Moon value (1.6 m/s²): the pendulum swings about 2.5 times slower.', 'g को चंद्रमा के मान (1.6 m/s²) पर करें: लोलक लगभग 2.5 गुना धीमा झूलता है।', 'g ಅನ್ನು ಚಂದ್ರನ ಮೌಲ್ಯಕ್ಕೆ (1.6 m/s²) ಇಳಿಸಿ: ಲೋಲಕ ಸುಮಾರು 2.5 ಪಟ್ಟು ನಿಧಾನವಾಗಿ ತೂಗುತ್ತದೆ.'),
    l3('Up to about 15° the period hardly changes with angle. At 60–80° the measured period is clearly longer than 2π√(L/g).', 'लगभग 15° तक कोण बदलने से आवर्तकाल लगभग नहीं बदलता। 60–80° पर मापा गया आवर्तकाल 2π√(L/g) से स्पष्ट रूप से अधिक होता है।', 'ಸುಮಾರು 15° ವರೆಗೆ ಕೋನ ಬದಲಿಸಿದರೆ ಆವರ್ತ ಕಾಲ ಬಹುತೇಕ ಬದಲಾಗುವುದಿಲ್ಲ. 60–80° ನಲ್ಲಿ ಅಳೆದ ಆವರ್ತ ಕಾಲ 2π√(L/g) ಗಿಂತ ಸ್ಪಷ್ಟವಾಗಿ ಹೆಚ್ಚು.'),
    l3('The bob is fastest at the bottom (θ = 0) and stops for an instant at each end.', 'गोलक सबसे नीचे (θ = 0) सबसे तेज़ होता है और हर छोर पर एक क्षण रुकता है।', 'ಗುಂಡು ಕೆಳಗೆ (θ = 0) ಅತಿ ವೇಗವಾಗಿರುತ್ತದೆ ಮತ್ತು ಪ್ರತಿ ತುದಿಯಲ್ಲಿ ಕ್ಷಣ ನಿಲ್ಲುತ್ತದೆ.'),
  ],
  assumptions: [
    l3('No air resistance or friction, so the swing never dies down. A real pendulum slowly loses amplitude.', 'हवा का प्रतिरोध या घर्षण नहीं है, इसलिए झूलना कभी कम नहीं होता। असली लोलक धीरे-धीरे आयाम खोता है।', 'ಗಾಳಿಯ ಪ್ರತಿರೋಧ ಅಥವಾ ಘರ್ಷಣೆ ಇಲ್ಲ, ಆದ್ದರಿಂದ ತೂಗಾಟ ಎಂದೂ ಕಡಿಮೆಯಾಗುವುದಿಲ್ಲ. ನಿಜವಾದ ಲೋಲಕ ನಿಧಾನವಾಗಿ ವೈಶಾಲ್ಯ ಕಳೆದುಕೊಳ್ಳುತ್ತದೆ.'),
    l3('The string has no mass and does not stretch; the bob is treated as a point.', 'डोरी का द्रव्यमान नहीं है और वह खिंचती नहीं; गोलक को एक बिंदु माना गया है।', 'ದಾರಕ್ಕೆ ದ್ರವ್ಯರಾಶಿ ಇಲ್ಲ ಮತ್ತು ಅದು ಹಿಗ್ಗುವುದಿಲ್ಲ; ಗುಂಡನ್ನು ಬಿಂದುವಾಗಿ ಪರಿಗಣಿಸಲಾಗಿದೆ.'),
    l3('"Theory" period uses the exact large-angle result; the textbook formula 2π√(L/g) is shown separately.', '"सिद्धांत" आवर्तकाल बड़े कोण का सटीक परिणाम है; पाठ्यपुस्तक सूत्र 2π√(L/g) अलग दिखाया गया है।', '"ಸಿದ್ಧಾಂತ" ಆವರ್ತ ಕಾಲ ದೊಡ್ಡ ಕೋನದ ನಿಖರ ಫಲಿತಾಂಶ; ಪಠ್ಯಪುಸ್ತಕ ಸೂತ್ರ 2π√(L/g) ಪ್ರತ್ಯೇಕವಾಗಿ ತೋರಿಸಲಾಗಿದೆ.'),
  ],
  quiz: [
    {
      q: l3('If the length of a pendulum is made 4 times, its time period becomes…', 'लोलक की लंबाई 4 गुना करने पर आवर्तकाल हो जाता है…', 'ಲೋಲಕದ ಉದ್ದ 4 ಪಟ್ಟು ಮಾಡಿದರೆ ಆವರ್ತ ಕಾಲ…'),
      options: [l3('4 times', '4 गुना', '4 ಪಟ್ಟು'), l3('2 times', '2 गुना', '2 ಪಟ್ಟು'), l3('Half', 'आधा', 'ಅರ್ಧ'), l3('Unchanged', 'वही', 'ಬದಲಾಗದು')],
      correct: 1,
      explain: l3('T ∝ √L, and √4 = 2.', 'T ∝ √L, और √4 = 2।', 'T ∝ √L, ಮತ್ತು √4 = 2.'),
    },
    {
      q: l3('A heavier bob (same length) will swing…', 'भारी गोलक (समान लंबाई) झूलेगा…', 'ಭಾರವಾದ ಗುಂಡು (ಅದೇ ಉದ್ದ) ತೂಗುತ್ತದೆ…'),
      options: [l3('Faster', 'तेज़', 'ವೇಗವಾಗಿ'), l3('Slower', 'धीमा', 'ನಿಧಾನವಾಗಿ'), l3('With the same period', 'समान आवर्तकाल से', 'ಅದೇ ಆವರ್ತ ಕಾಲದೊಂದಿಗೆ')],
      correct: 2,
      explain: l3('Mass does not appear in T = 2π√(L/g).', 'T = 2π√(L/g) में द्रव्यमान नहीं है।', 'T = 2π√(L/g) ನಲ್ಲಿ ದ್ರವ್ಯರಾಶಿ ಇಲ್ಲ.'),
    },
    {
      q: l3('On the Moon (smaller g), a pendulum clock would run…', 'चंद्रमा पर (कम g) लोलक घड़ी चलेगी…', 'ಚಂದ್ರನಲ್ಲಿ (ಕಡಿಮೆ g) ಲೋಲಕ ಗಡಿಯಾರ ನಡೆಯುತ್ತದೆ…'),
      options: [l3('Slow', 'धीमी', 'ನಿಧಾನವಾಗಿ'), l3('Fast', 'तेज़', 'ವೇಗವಾಗಿ'), l3('Correctly', 'सही', 'ಸರಿಯಾಗಿ')],
      correct: 0,
      explain: l3('Smaller g gives a longer period, so fewer ticks each hour.', 'कम g से आवर्तकाल लंबा होता है, इसलिए हर घंटे कम टिक।', 'ಕಡಿಮೆ g ಯಿಂದ ಆವರ್ತ ಕಾಲ ಉದ್ದ, ಆದ್ದರಿಂದ ಪ್ರತಿ ಗಂಟೆ ಕಡಿಮೆ ಟಿಕ್.'),
    },
  ],
};

/* =====================================================================
   2. TORRICELLI — v = √(2g·depth), jet is a projectile, tank drains
   ===================================================================== */
interface TorState {
  level: number;
  t: number;
  drops: { x: number; y: number; vx: number; vy: number }[];
  emitAcc: number;
  outL: number;
}
const TANK_D = 0.3; // m (inner diameter)
const TANK_A = (Math.PI * TANK_D * TANK_D) / 4;
const TANK_H = 1.9;
const torricelli: StationDef<TorState> = {
  id: 'torricelli',
  title: l3("Torricelli's Principle", 'टॉरिसेली का सिद्धांत', 'ಟೊರಿಸೆಲ್ಲಿಯ ತತ್ವ'),
  intro: l3(
    'Water squirts out of a small hole in the side of a tank. The deeper the hole is below the water surface, the faster the water comes out — exactly as fast as if it had fallen freely through that depth.',
    'टंकी की दीवार के एक छोटे छेद से पानी की धार निकलती है। छेद पानी की सतह से जितना नीचे होता है, पानी उतनी तेज़ी से निकलता है — ठीक उतनी जितनी उस गहराई तक मुक्त रूप से गिरने पर होती।',
    'ತೊಟ್ಟಿಯ ಗೋಡೆಯ ಸಣ್ಣ ರಂಧ್ರದಿಂದ ನೀರು ಚಿಮ್ಮುತ್ತದೆ. ರಂಧ್ರ ನೀರಿನ ಮೇಲ್ಮೈಯಿಂದ ಎಷ್ಟು ಆಳದಲ್ಲಿದೆಯೋ ಅಷ್ಟು ವೇಗವಾಗಿ ನೀರು ಹೊರಬರುತ್ತದೆ — ಆ ಆಳದಿಂದ ಮುಕ್ತವಾಗಿ ಬಿದ್ದಂತೆಯೇ.'
  ),
  params: [
    { key: 'h', label: l3('Water level (h)', 'पानी का स्तर (h)', 'ನೀರಿನ ಮಟ್ಟ (h)'), min: 0.3, max: 1.8, step: 0.05, unit: 'm', def: 1.2 },
    { key: 'y', label: l3('Hole height (y)', 'छेद की ऊँचाई (y)', 'ರಂಧ್ರದ ಎತ್ತರ (y)'), min: 0.05, max: 1.7, step: 0.05, unit: 'm', def: 0.4 },
    { key: 'd', label: l3('Hole diameter', 'छेद का व्यास', 'ರಂಧ್ರದ ವ್ಯಾಸ'), min: 4, max: 20, step: 1, unit: 'mm', def: 10, live: true },
    {
      key: 'drain',
      label: l3('Tank mode', 'टंकी मोड', 'ತೊಟ್ಟಿ ಮೋಡ್'),
      min: 0, max: 1, step: 1, unit: '', def: 0, live: true,
      choices: [
        { value: 0, label: l3('Level kept full (tap on)', 'स्तर भरा रखें (नल चालू)', 'ಮಟ್ಟ ತುಂಬಿರಲಿ (ನಲ್ಲಿ ಆನ್)') },
        { value: 1, label: l3('Let it drain', 'खाली होने दें', 'ಖಾಲಿಯಾಗಲಿ') },
      ],
    },
  ],
  speeds: [0.25, 0.5, 1, 2, 5, 20],
  constrain: (p) => ({ ...p, y: Math.min(p.y, Math.round((p.h - 0.05) * 100) / 100) }),
  init: (p) => ({ level: p.h, t: 0, drops: [], emitAcc: 0, outL: 0 }),
  step(s, p, dt) {
    s.t += dt;
    if (!p.drain) s.level = p.h;
    const depth = Math.max(0, s.level - p.y);
    const v = Math.sqrt(2 * G * depth);
    const a = Math.PI * (p.d / 1000) ** 2 / 4;
    if (p.drain && depth > 0) {
      // exact solution of dh/dt = −(a/A)√(2g(h − y)):  √(h − y) falls linearly with time
      const sq = Math.sqrt(depth) - ((a / TANK_A) * Math.sqrt(2 * G) * dt) / 2;
      s.level = p.y + Math.max(0, sq) ** 2;
    }
    s.outL += a * v * dt * 1000;
    if (depth > 0.002) {
      s.emitAcc += dt;
      while (s.emitAcc > 0.01) {
        s.emitAcc -= 0.01;
        s.drops.push({ x: 0, y: p.y + (((s.drops.length * 7) % 5) / 4 - 0.5) * (p.d / 1000), vx: v, vy: 0 });
      }
    }
    for (const d of s.drops) {
      d.vy -= G * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    s.drops = s.drops.filter((d) => d.y > 0).slice(-420);
  },
  draw(c, s, p, w, h, dark, lang) {
    const k = colors(dark);
    const depth = Math.max(0, s.level - p.y);
    const v = Math.sqrt(2 * G * depth);
    const R = 2 * Math.sqrt(depth * p.y);
    const xmax = Math.max(2.2, R + 0.35);
    const { s: sc, X, Y } = fit(w, h, -TANK_D - 0.62, xmax, -0.08, TANK_H + 0.15, 24);
    // ground
    c.fillStyle = dark ? '#3B2F22' : '#E9DFC6';
    c.fillRect(0, Y(0), w, h - Y(0));
    c.strokeStyle = k.soft;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, Y(0));
    c.lineTo(w, Y(0));
    c.stroke();
    // metre marks on the ground
    for (let m = 0; m <= Math.floor(xmax); m += 0.5) {
      c.strokeStyle = k.soft;
      c.beginPath();
      c.moveTo(X(m), Y(0));
      c.lineTo(X(m), Y(0) + (m % 1 === 0 ? 10 : 5));
      c.stroke();
      if (m % 1 === 0) label(c, `${m} m`, X(m), Y(0) + 22, k.soft, 11, 'center');
    }
    // water with pressure-shaded gradient
    const gTop = Y(s.level), gBot = Y(0);
    const grad = c.createLinearGradient(0, gTop, 0, gBot);
    grad.addColorStop(0, k.water);
    grad.addColorStop(1, k.waterDeep);
    c.fillStyle = grad;
    c.fillRect(X(-TANK_D), gTop, X(0) - X(-TANK_D), gBot - gTop);
    // tank walls
    c.strokeStyle = k.ink;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(X(-TANK_D), Y(TANK_H));
    c.lineTo(X(-TANK_D), Y(0));
    c.lineTo(X(0), Y(0));
    c.lineTo(X(0), Y(TANK_H));
    c.stroke();
    // tap when level is kept full
    if (!p.drain) {
      c.fillStyle = k.soft;
      c.fillRect(X(-TANK_D) - 4, Y(TANK_H + 0.1), 40, 8);
      c.fillStyle = k.water;
      c.fillRect(X(-TANK_D) + 26, Y(TANK_H + 0.1) + 8, 5, Y(s.level) - Y(TANK_H + 0.1) - 8);
    }
    // hole
    c.fillStyle = RED;
    c.beginPath();
    c.arc(X(0), Y(p.y), 5, 0, Math.PI * 2);
    c.fill();
    // predicted path (dashed)
    if (depth > 0.002) {
      c.save();
      c.setLineDash([5, 5]);
      c.strokeStyle = k.soft;
      c.lineWidth = 1.5;
      c.beginPath();
      const tf = Math.sqrt((2 * p.y) / G);
      for (let i = 0; i <= 40; i++) {
        const t = (tf * i) / 40;
        const x = v * t, y = p.y - 0.5 * G * t * t;
        if (i === 0) c.moveTo(X(x), Y(y));
        else c.lineTo(X(x), Y(y));
      }
      c.stroke();
      c.restore();
    }
    // droplets
    c.fillStyle = dark ? '#7CC4FF' : '#2B7BD0';
    for (const d of s.drops) {
      c.beginPath();
      c.arc(X(d.x), Y(d.y), Math.max(2.6, Math.min(5.5, (p.d / 1000) * sc * 0.6 + 1.5)), 0, Math.PI * 2);
      c.fill();
    }
    // landing marker
    if (depth > 0.002) {
      c.fillStyle = AMBER;
      c.beginPath();
      c.moveTo(X(R), Y(0) - 2);
      c.lineTo(X(R) - 7, Y(0) - 14);
      c.lineTo(X(R) + 7, Y(0) - 14);
      c.closePath();
      c.fill();
      label(c, `R = ${fmt(R, 2)} m`, X(R), Y(0) - 20, AMBER, 13, 'center');
      arrow(c, X(0) + 8, Y(p.y), X(0) + 8 + Math.min(110, v * 18), Y(p.y), TEAL, 3);
      label(c, `v = ${fmt(v, 2)} m/s`, X(0) + 12, Y(p.y) - 10, TEAL, 13);
    }
    // dimensions
    dimArrow(c, X(-TANK_D) - 12, Y(s.level), Y(p.y), `h − y = ${fmt(depth, 2)} m`, PURPLE);
    dimArrow(c, X(-TANK_D) - 12, Y(p.y), Y(0), `y = ${fmt(p.y, 2)} m`, k.soft);
    label(c, `h = ${fmt(s.level, 2)} m`, X(-TANK_D) + 4, Y(s.level) - 6, k.ink, 12);
    if (p.drain && depth <= 0.002) label(c, tr(lang, 'Water has drained down to the hole — flow stopped.', 'पानी छेद तक खाली हो गया — प्रवाह रुक गया।', 'ನೀರು ರಂಧ್ರದವರೆಗೆ ಖಾಲಿಯಾಯಿತು — ಹರಿವು ನಿಂತಿತು.'), 16, 22, RED, 13);
  },
  readings(s, p) {
    const depth = Math.max(0, s.level - p.y);
    const v = Math.sqrt(2 * G * depth);
    const a = Math.PI * (p.d / 1000) ** 2 / 4;
    return [
      { label: l3('Exit velocity v', 'निकास वेग v', 'ನಿರ್ಗಮನ ವೇಗ v'), value: fmt(v, 2), unit: 'm/s', accent: true },
      { label: l3('Depth of hole (h − y)', 'छेद की गहराई (h − y)', 'ರಂಧ್ರದ ಆಳ (h − y)'), value: fmt(depth, 2), unit: 'm' },
      { label: l3('Pressure at hole ρg(h − y)', 'छेद पर दाब ρg(h − y)', 'ರಂಧ್ರದಲ್ಲಿ ಒತ್ತಡ ρg(h − y)'), value: fmt((RHO * G * depth) / 1000, 2), unit: 'kPa (gauge)' },
      { label: l3('Horizontal range R', 'क्षैतिज दूरी R', 'ಸಮತಲ ದೂರ R'), value: fmt(2 * Math.sqrt(depth * p.y), 2), unit: 'm' },
      { label: l3('Fall time √(2y/g)', 'गिरने का समय √(2y/g)', 'ಬೀಳುವ ಸಮಯ √(2y/g)'), value: fmt(Math.sqrt((2 * p.y) / G), 2), unit: 's' },
      { label: l3('Flow rate Q = a·v', 'प्रवाह दर Q = a·v', 'ಹರಿವಿನ ದರ Q = a·v'), value: fmt(a * v * 60000, 2), unit: 'L/min' },
      { label: l3('Water level now', 'अभी पानी का स्तर', 'ಈಗಿನ ನೀರಿನ ಮಟ್ಟ'), value: fmt(s.level, 3), unit: 'm' },
      { label: l3('Water flowed out', 'बाहर निकला पानी', 'ಹೊರ ಹರಿದ ನೀರು'), value: fmt(s.outL, 2), unit: 'L' },
    ];
  },
  formulas: [
    { expr: 'v = √(2 g (h − y))', note: l3("Torricelli's law: exit speed equals free-fall speed through the depth.", 'टॉरिसेली का नियम: निकास चाल उस गहराई से मुक्त पतन की चाल के बराबर।', 'ಟೊರಿಸೆಲ್ಲಿ ನಿಯಮ: ನಿರ್ಗಮನ ವೇಗ ಆ ಆಳದಿಂದ ಮುಕ್ತ ಪತನದ ವೇಗಕ್ಕೆ ಸಮ.') },
    { expr: 'P = ρ g (h − y)', note: l3('Water pressure at the hole (above the air pressure).', 'छेद पर पानी का दाब (वायुदाब से ऊपर)।', 'ರಂಧ್ರದಲ್ಲಿ ನೀರಿನ ಒತ್ತಡ (ವಾಯು ಒತ್ತಡಕ್ಕಿಂತ ಹೆಚ್ಚು).') },
    { expr: 'R = v √(2y / g) = 2 √((h − y) y)', note: l3('Where the jet lands. It is largest when the hole is at half the water height.', 'धार कहाँ गिरती है। छेद पानी की आधी ऊँचाई पर हो तो सबसे दूर।', 'ಧಾರೆ ಎಲ್ಲಿ ಬೀಳುತ್ತದೆ. ರಂಧ್ರ ನೀರಿನ ಅರ್ಧ ಎತ್ತರದಲ್ಲಿದ್ದಾಗ ಅತಿ ದೂರ.') },
    { expr: 'Q = a v,   dh/dt = −(a / A) v', note: l3('Flow rate, and how fast the level falls when draining.', 'प्रवाह दर, और खाली होते समय स्तर कितनी तेज़ी से गिरता है।', 'ಹರಿವಿನ ದರ, ಮತ್ತು ಖಾಲಿಯಾಗುವಾಗ ಮಟ್ಟ ಎಷ್ಟು ವೇಗವಾಗಿ ಇಳಿಯುತ್ತದೆ.') },
  ],
  liveFormula: (s, p) => {
    const depth = Math.max(0, s.level - p.y);
    return `v = √(2 × 9.8 × ${fmt(depth, 2)}) = ${fmt(Math.sqrt(2 * G * depth), 2)} m/s`;
  },
  principle: l3(
    'Water deep in the tank is squeezed by the weight of all the water above it, so the pressure at the hole is ρg(h − y). That pressure pushes water out. Energy is conserved: water leaving the hole has the same speed it would get by falling from the surface down to the hole. After leaving, the jet is just a horizontal projectile.',
    'टंकी में गहरे पानी पर ऊपर के सारे पानी का भार दबाव डालता है, इसलिए छेद पर दाब ρg(h − y) होता है। यही दाब पानी को बाहर धकेलता है। ऊर्जा संरक्षित रहती है: छेद से निकलते पानी की चाल उतनी ही होती है जितनी सतह से छेद तक गिरने पर होती। निकलने के बाद धार एक क्षैतिज प्रक्षेप्य है।',
    'ತೊಟ್ಟಿಯ ಆಳದ ನೀರಿನ ಮೇಲೆ ಮೇಲಿನ ಎಲ್ಲ ನೀರಿನ ತೂಕ ಒತ್ತುತ್ತದೆ, ಆದ್ದರಿಂದ ರಂಧ್ರದಲ್ಲಿ ಒತ್ತಡ ρg(h − y). ಆ ಒತ್ತಡ ನೀರನ್ನು ಹೊರಗೆ ತಳ್ಳುತ್ತದೆ. ಶಕ್ತಿ ಸಂರಕ್ಷಣೆ: ರಂಧ್ರದಿಂದ ಹೊರಬರುವ ನೀರಿನ ವೇಗ ಮೇಲ್ಮೈಯಿಂದ ರಂಧ್ರದವರೆಗೆ ಬಿದ್ದರೆ ಸಿಗುವ ವೇಗಕ್ಕೆ ಸಮ. ಹೊರಬಂದ ನಂತರ ಧಾರೆ ಸಮತಲ ಪ್ರಕ್ಷೇಪಕ.'
  ),
  observations: [
    l3('Raise the water level: the depth grows, the jet comes out faster and lands further away.', 'पानी का स्तर बढ़ाएँ: गहराई बढ़ती है, धार तेज़ निकलती है और दूर गिरती है।', 'ನೀರಿನ ಮಟ್ಟ ಹೆಚ್ಚಿಸಿ: ಆಳ ಹೆಚ್ಚಾಗಿ ಧಾರೆ ವೇಗವಾಗಿ ಬಂದು ದೂರ ಬೀಳುತ್ತದೆ.'),
    l3('Lower the hole: water exits faster, but has less height to fall. The farthest jet comes from a hole at half the water height (y = h/2), where R = h.', 'छेद नीचे करें: पानी तेज़ निकलता है, पर गिरने की ऊँचाई कम होती है। सबसे दूर की धार आधी ऊँचाई (y = h/2) पर छेद से आती है, जहाँ R = h।', 'ರಂಧ್ರ ಕೆಳಗೆ ಇಳಿಸಿ: ನೀರು ವೇಗವಾಗಿ ಬರುತ್ತದೆ, ಆದರೆ ಬೀಳುವ ಎತ್ತರ ಕಡಿಮೆ. ಅತಿ ದೂರದ ಧಾರೆ ಅರ್ಧ ಎತ್ತರದ (y = h/2) ರಂಧ್ರದಿಂದ, ಅಲ್ಲಿ R = h.'),
    l3('A bigger hole gives more litres per minute, but the exit speed stays the same.', 'बड़े छेद से प्रति मिनट अधिक लीटर निकलते हैं, पर निकास चाल वही रहती है।', 'ದೊಡ್ಡ ರಂಧ್ರದಿಂದ ಪ್ರತಿ ನಿಮಿಷ ಹೆಚ್ಚು ಲೀಟರ್, ಆದರೆ ನಿರ್ಗಮನ ವೇಗ ಅದೇ.'),
    l3('In "Let it drain" mode the jet gets shorter as the level falls — fast at first, then slower.', '"खाली होने दें" मोड में स्तर गिरने पर धार छोटी होती जाती है — पहले तेज़, फिर धीमी।', '"ಖಾಲಿಯಾಗಲಿ" ಮೋಡ್‌ನಲ್ಲಿ ಮಟ್ಟ ಇಳಿದಂತೆ ಧಾರೆ ಚಿಕ್ಕದಾಗುತ್ತದೆ — ಮೊದಲು ವೇಗ, ನಂತರ ನಿಧಾನ.'),
  ],
  assumptions: [
    l3('Ideal water: no viscosity or friction at the hole. Real jets are slower; a sharp-edged hole gives only about 60% of the ideal flow.', 'आदर्श पानी: छेद पर श्यानता या घर्षण नहीं। असली धार धीमी होती है; तेज़ किनारे वाला छेद आदर्श प्रवाह का लगभग 60% ही देता है।', 'ಆದರ್ಶ ನೀರು: ರಂಧ್ರದಲ್ಲಿ ಸ್ನಿಗ್ಧತೆ ಅಥವಾ ಘರ್ಷಣೆ ಇಲ್ಲ. ನಿಜವಾದ ಧಾರೆ ನಿಧಾನ; ಚೂಪಾದ ಅಂಚಿನ ರಂಧ್ರ ಆದರ್ಶ ಹರಿವಿನ ಸುಮಾರು 60% ಮಾತ್ರ ಕೊಡುತ್ತದೆ.'),
    l3('The hole is tiny compared with the tank (30 cm wide), so the surface moves very slowly. Air resistance on the jet is ignored.', 'छेद टंकी (30 cm चौड़ी) की तुलना में बहुत छोटा है, इसलिए सतह बहुत धीरे चलती है। धार पर हवा का प्रतिरोध नहीं लिया गया।', 'ರಂಧ್ರ ತೊಟ್ಟಿಗೆ (30 cm ಅಗಲ) ಹೋಲಿಸಿದರೆ ತುಂಬಾ ಚಿಕ್ಕದು, ಆದ್ದರಿಂದ ಮೇಲ್ಮೈ ತುಂಬಾ ನಿಧಾನ ಚಲಿಸುತ್ತದೆ. ಧಾರೆಯ ಮೇಲೆ ಗಾಳಿ ಪ್ರತಿರೋಧ ಪರಿಗಣಿಸಿಲ್ಲ.'),
    l3('Draining is slow in real life; use the 5× or 20× speed to watch it.', 'असल में खाली होना धीमा है; देखने के लिए 5× या 20× गति चुनें।', 'ನಿಜದಲ್ಲಿ ಖಾಲಿಯಾಗುವುದು ನಿಧಾನ; ನೋಡಲು 5× ಅಥವಾ 20× ವೇಗ ಆರಿಸಿ.'),
  ],
  quiz: [
    {
      q: l3('If the depth of the hole below the surface is made 4 times, the exit speed becomes…', 'सतह से छेद की गहराई 4 गुना करने पर निकास चाल हो जाती है…', 'ಮೇಲ್ಮೈಯಿಂದ ರಂಧ್ರದ ಆಳ 4 ಪಟ್ಟಾದರೆ ನಿರ್ಗಮನ ವೇಗ…'),
      options: [l3('2 times', '2 गुना', '2 ಪಟ್ಟು'), l3('4 times', '4 गुना', '4 ಪಟ್ಟು'), l3('16 times', '16 गुना', '16 ಪಟ್ಟು')],
      correct: 0,
      explain: l3('v = √(2g·depth), and √4 = 2.', 'v = √(2g·गहराई), और √4 = 2।', 'v = √(2g·ಆಳ), ಮತ್ತು √4 = 2.'),
    },
    {
      q: l3('For water level h, which hole height throws water the farthest?', 'पानी के स्तर h के लिए, किस ऊँचाई का छेद पानी सबसे दूर फेंकता है?', 'ನೀರಿನ ಮಟ್ಟ h ಗೆ, ಯಾವ ಎತ್ತರದ ರಂಧ್ರ ನೀರನ್ನು ಅತಿ ದೂರ ಎಸೆಯುತ್ತದೆ?'),
      options: [l3('Near the bottom', 'तल के पास', 'ತಳದ ಹತ್ತಿರ'), l3('At h/2', 'h/2 पर', 'h/2 ನಲ್ಲಿ'), l3('Near the top', 'ऊपर के पास', 'ಮೇಲಿನ ಹತ್ತಿರ')],
      correct: 1,
      explain: l3('R = 2√((h − y)y) is largest when y = h/2. Try it with the slider!', 'R = 2√((h − y)y) तब सबसे बड़ा है जब y = h/2। स्लाइडर से जाँचें!', 'R = 2√((h − y)y) y = h/2 ಆದಾಗ ಅತಿ ದೊಡ್ಡದು. ಸ್ಲೈಡರ್‌ನಲ್ಲಿ ಪ್ರಯತ್ನಿಸಿ!'),
    },
    {
      q: l3('Making the hole bigger changes…', 'छेद बड़ा करने से बदलता है…', 'ರಂಧ್ರ ದೊಡ್ಡದು ಮಾಡಿದರೆ ಬದಲಾಗುವುದು…'),
      options: [l3('The exit speed', 'निकास चाल', 'ನಿರ್ಗಮನ ವೇಗ'), l3('The litres per minute', 'प्रति मिनट लीटर', 'ಪ್ರತಿ ನಿಮಿಷ ಲೀಟರ್'), l3('Nothing', 'कुछ नहीं', 'ಏನೂ ಇಲ್ಲ')],
      correct: 1,
      explain: l3('Q = a·v: area a grows, v stays √(2g·depth).', 'Q = a·v: क्षेत्रफल a बढ़ता है, v वही √(2g·गहराई) रहता है।', 'Q = a·v: ವಿಸ್ತೀರ್ಣ a ಹೆಚ್ಚುತ್ತದೆ, v ಅದೇ √(2g·ಆಳ).'),
    },
  ],
};

/* =====================================================================
   3. BERNOULLI — Venturi pipe: continuity A·v = Q and P + ½ρv² = constant
   ===================================================================== */
interface BerState {
  t: number;
  parts: { s: number; e: number }[];
}
/** pipe diameter (m) at normalised position x ∈ [0,1] */
function pipeD(x: number, D1: number, D2: number) {
  const smooth = (a: number, b: number, t: number) => {
    const u = clamp((t - a) / (b - a), 0, 1);
    return u * u * (3 - 2 * u);
  };
  if (x < 0.5) return D1 + (D2 - D1) * smooth(0.28, 0.42, x);
  return D2 + (D1 - D2) * smooth(0.58, 0.78, x);
}
const PIPE_LEN = 1.2; // m represented by the drawing
const SLOWMO = 0.25;
function bernoulliCalc(p: Params) {
  const D1 = p.D1 / 100, D2 = p.D2 / 100, Q = p.Q / 1000;
  const A1 = (Math.PI * D1 * D1) / 4, A2 = (Math.PI * D2 * D2) / 4;
  const v1 = Q / A1, v2 = Q / A2;
  const P1 = p.P1; // kPa gauge
  const P2 = P1 + (0.5 * RHO * (v1 * v1 - v2 * v2)) / 1000;
  return { D1, D2, Q, A1, A2, v1, v2, P1, P2 };
}
const bernoulli: StationDef<BerState> = {
  id: 'bernoulli',
  title: l3("Bernoulli's Principle", 'बर्नौली का सिद्धांत', 'ಬರ್ನೌಲಿಯ ತತ್ವ'),
  intro: l3(
    'Water flows through a pipe that becomes narrow in the middle (a Venturi tube). Watch the water speed up in the narrow part — and see the pressure there drop.',
    'पानी एक ऐसे पाइप से बहता है जो बीच में संकरा हो जाता है (वेंचुरी नली)। देखें कि संकरे भाग में पानी तेज़ होता है — और वहाँ दाब घट जाता है।',
    'ಮಧ್ಯದಲ್ಲಿ ಕಿರಿದಾಗುವ ಕೊಳವೆಯ (ವೆಂಚುರಿ ನಳಿಕೆ) ಮೂಲಕ ನೀರು ಹರಿಯುತ್ತದೆ. ಕಿರಿದಾದ ಭಾಗದಲ್ಲಿ ನೀರು ವೇಗ ಪಡೆಯುವುದನ್ನು — ಮತ್ತು ಅಲ್ಲಿ ಒತ್ತಡ ಇಳಿಯುವುದನ್ನು ನೋಡಿ.'
  ),
  params: [
    { key: 'D1', label: l3('Wide pipe diameter (D₁)', 'चौड़े पाइप का व्यास (D₁)', 'ಅಗಲ ಕೊಳವೆಯ ವ್ಯಾಸ (D₁)'), min: 6, max: 14, step: 0.5, unit: 'cm', def: 10, live: true },
    { key: 'D2', label: l3('Narrow part diameter (D₂)', 'संकरे भाग का व्यास (D₂)', 'ಕಿರಿದಾದ ಭಾಗದ ವ್ಯಾಸ (D₂)'), min: 3, max: 14, step: 0.5, unit: 'cm', def: 3.5, live: true },
    { key: 'Q', label: l3('Flow rate (Q)', 'प्रवाह दर (Q)', 'ಹರಿವಿನ ದರ (Q)'), min: 0.5, max: 4, step: 0.1, unit: 'L/s', def: 3, live: true },
    { key: 'P1', label: l3('Pressure at inlet (P₁)', 'प्रवेश पर दाब (P₁)', 'ಒಳಹರಿವಿನಲ್ಲಿ ಒತ್ತಡ (P₁)'), min: 5, max: 60, step: 1, unit: 'kPa', def: 15, live: true },
  ],
  speeds: [0.5, 1, 2],
  constrain: (p) => ({ ...p, D2: Math.min(p.D2, p.D1) }),
  init: () => ({
    t: 0,
    parts: Array.from({ length: 170 }, (_, i) => ({ s: (i * 0.6180339) % 1, e: ((i * 0.7548776) % 1) * 1.8 - 0.9 })),
  }),
  step(s, p, dt) {
    s.t += dt;
    const { D1, D2, Q } = bernoulliCalc(p);
    for (const q of s.parts) {
      const A = (Math.PI * pipeD(q.s, D1, D2) ** 2) / 4;
      q.s += ((Q / A) * SLOWMO * dt) / PIPE_LEN;
      if (q.s > 1) q.s -= 1;
    }
  },
  draw(c, s, p, w, h, dark, lang) {
    const k = colors(dark);
    const r = bernoulliCalc(p);
    const left = Math.min(90, w * 0.1), right = w - 30;
    const cy = h * 0.42;
    const maxR = Math.min(h * 0.16, 90);
    const rpx = (D: number) => (D / 0.14) * maxR; // radius px for diameter D (m)
    const xAt = (x: number) => left + x * (right - left);
    const pAt = (x: number) => {
      const D = pipeD(x, r.D1, r.D2);
      const v = r.Q / ((Math.PI * D * D) / 4);
      return { D, v, P: r.P1 + (0.5 * RHO * (r.v1 * r.v1 - v * v)) / 1000 };
    };
    // fluid coloured by pressure
    const pMin = Math.min(r.P2, 0), pMax = Math.max(r.P1, 1);
    const N = 160;
    for (let i = 0; i < N; i++) {
      const x = i / N;
      const { D, P } = pAt(x + 0.5 / N);
      const tt = clamp((P - pMin) / (pMax - pMin), 0, 1);
      const rr = Math.round(dark ? 40 + 40 * (1 - tt) : 150 + 90 * (1 - tt));
      const gg = Math.round(dark ? 90 + 60 * (1 - tt) : 190 + 50 * (1 - tt));
      const bb = Math.round(dark ? 170 + 60 * tt : 235 - 30 * (1 - tt));
      c.fillStyle = `rgb(${rr},${gg},${bb})`;
      const R = rpx(D) / 2;
      c.fillRect(xAt(x), cy - R, (right - left) / N + 1, 2 * R);
    }
    // walls
    c.strokeStyle = k.ink;
    c.lineWidth = 3;
    for (const sign of [-1, 1]) {
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        const y = cy + sign * (rpx(pipeD(x, r.D1, r.D2)) / 2);
        if (i === 0) c.moveTo(xAt(x), y);
        else c.lineTo(xAt(x), y);
      }
      c.stroke();
    }
    // particles
    c.fillStyle = dark ? '#FFFFFF' : '#0B3B66';
    for (const q of s.parts) {
      const R = rpx(pipeD(q.s, r.D1, r.D2)) / 2;
      c.beginPath();
      c.arc(xAt(q.s), cy + q.e * R * 0.9, 2.2, 0, Math.PI * 2);
      c.fill();
    }
    // pressure tubes (piezometers) at 3 points: water column height = P/(ρg)
    const probes = [0.14, 0.5, 0.88];
    const hScale = Math.min(cy - rpx(r.D1) / 2 - 62, 160) / (Math.max(r.P1, 1) / (RHO * G / 1000));
    probes.forEach((x, idx) => {
      const { D, v, P } = pAt(x);
      const top = cy - rpx(D) / 2;
      const col = (P / (RHO * G / 1000)) * hScale; // px
      c.strokeStyle = k.soft;
      c.lineWidth = 1.5;
      c.strokeRect(xAt(x) - 7, top - Math.max(col, 0) - 30, 14, Math.max(col, 0) + 30);
      if (P >= 0) {
        c.fillStyle = k.waterDeep;
        c.fillRect(xAt(x) - 6, top - col, 12, col);
      }
      const name = idx === 0 ? '1' : idx === 1 ? '2' : '3';
      label(c, `P${name === '3' ? '₃' : name === '2' ? '₂' : '₁'} = ${fmt(P, 1)} kPa`, xAt(x), top - Math.max(col, 0) - 38, P < 0 ? RED : k.ink, 13, 'center');
      label(c, `v = ${fmt(v, 2)} m/s`, xAt(x), cy + rpx(r.D1) / 2 + 22, TEAL, 13, 'center');
      label(c, `A = ${fmt((Math.PI * D * D * 1e4) / 4, 1)} cm²`, xAt(x), cy + rpx(r.D1) / 2 + 40, k.soft, 12, 'center');
      if (P < 0) label(c, tr(lang, 'below air pressure (suction)', 'वायुदाब से कम (चूषण)', 'ವಾಯು ಒತ್ತಡಕ್ಕಿಂತ ಕಡಿಮೆ (ಹೀರಿಕೆ)'), xAt(x), top - 8, RED, 11, 'center');
    });
    arrow(c, 8, cy, left - 4, cy, k.ink, 2.5);
    label(c, `Q = ${fmt(p.Q, 1)} L/s`, 8, cy - 10, k.ink, 11);

    // profile chart: speed and pressure along the pipe
    const gy0 = h * 0.72, gh = h * 0.24;
    panel(c, 16, gy0, w - 32, gh, dark);
    const vMax = r.v2 * 1.15;
    const pSpan = Math.max(0.5, r.P1 - r.P2);
    const pLo = r.P2 - 0.25 * pSpan, pHi = r.P1 + 0.25 * pSpan;
    c.lineWidth = 2;
    c.strokeStyle = TEAL;
    c.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      const yy = gy0 + gh - 14 - (pAt(x).v / vMax) * (gh - 34);
      if (i) c.lineTo(xAt(x), yy);
      else c.moveTo(xAt(x), yy);
    }
    c.stroke();
    c.strokeStyle = PURPLE;
    c.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = i / 100;
      const yy = gy0 + gh - 14 - ((pAt(x).P - pLo) / (pHi - pLo)) * (gh - 34);
      if (i) c.lineTo(xAt(x), yy);
      else c.moveTo(xAt(x), yy);
    }
    c.stroke();
    label(c, `— ${tr(lang, 'speed v', 'चाल v', 'ವೇಗ v')}`, 28, gy0 + 18, TEAL, 12);
    label(c, `— ${tr(lang, 'pressure P', 'दाब P', 'ಒತ್ತಡ P')}`, 130, gy0 + 18, PURPLE, 12);
    label(c, tr(lang, 'Along the pipe →', 'पाइप के साथ →', 'ಕೊಳವೆಯ ಉದ್ದಕ್ಕೂ →'), w - 28, gy0 + 18, k.soft, 11, 'right');
    const pY = (P: number) => gy0 + gh - 14 - ((P - pLo) / (pHi - pLo)) * (gh - 34);
    label(c, `${fmt(r.P1, 1)} kPa`, xAt(0.02), pY(r.P1) - 6, PURPLE, 11);
    label(c, `${fmt(r.P2, 1)} kPa`, xAt(0.5), pY(r.P2) + 16, PURPLE, 11, 'center');
    label(c, `${fmt(r.v2, 2)} m/s`, xAt(0.5), gy0 + gh - 14 - (r.v2 / vMax) * (gh - 34) - 6, TEAL, 11, 'center');
    const absP2 = r.P2 + P_ATM;
    if (absP2 < 2.34) label(c, tr(lang, '⚠ Narrow-part pressure is below water vapour pressure — real water would cavitate; this ideal model no longer holds.', '⚠ संकरे भाग का दाब जल वाष्प दाब से कम है — असली पानी में गुहिकायन होगा; यह आदर्श मॉडल लागू नहीं।', '⚠ ಕಿರಿದಾದ ಭಾಗದ ಒತ್ತಡ ನೀರಿನ ಆವಿ ಒತ್ತಡಕ್ಕಿಂತ ಕಡಿಮೆ — ನಿಜ ನೀರಿನಲ್ಲಿ ಕುಹರೀಕರಣ; ಈ ಆದರ್ಶ ಮಾದರಿ ಅನ್ವಯಿಸದು.'), 24, h - 8, RED, 12);
    label(c, tr(lang, 'Particles shown at ¼ real speed', 'कण वास्तविक गति के ¼ पर दिखाए गए', 'ಕಣಗಳನ್ನು ನಿಜ ವೇಗದ ¼ ನಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ'), w - 24, gy0 - 8, k.soft, 11, 'right');
  },
  readings(_s, p) {
    const r = bernoulliCalc(p);
    const dyn1 = (0.5 * RHO * r.v1 * r.v1) / 1000, dyn2 = (0.5 * RHO * r.v2 * r.v2) / 1000;
    return [
      { label: l3('Speed in wide part v₁', 'चौड़े भाग में चाल v₁', 'ಅಗಲ ಭಾಗದಲ್ಲಿ ವೇಗ v₁'), value: fmt(r.v1, 2), unit: 'm/s' },
      { label: l3('Speed in narrow part v₂', 'संकरे भाग में चाल v₂', 'ಕಿರಿದಾದ ಭಾಗದಲ್ಲಿ ವೇಗ v₂'), value: fmt(r.v2, 2), unit: 'm/s', accent: true },
      { label: l3('Area A₁', 'क्षेत्रफल A₁', 'ವಿಸ್ತೀರ್ಣ A₁'), value: fmt(r.A1 * 1e4, 1), unit: 'cm²' },
      { label: l3('Area A₂', 'क्षेत्रफल A₂', 'ವಿಸ್ತೀರ್ಣ A₂'), value: fmt(r.A2 * 1e4, 1), unit: 'cm²' },
      { label: l3('Pressure P₁ (gauge)', 'दाब P₁ (गेज)', 'ಒತ್ತಡ P₁ (ಗೇಜ್)'), value: fmt(r.P1, 1), unit: 'kPa' },
      { label: l3('Pressure P₂ (gauge)', 'दाब P₂ (गेज)', 'ಒತ್ತಡ P₂ (ಗೇಜ್)'), value: fmt(r.P2, 1), unit: 'kPa', accent: true },
      { label: l3('Pressure drop P₁ − P₂', 'दाब में कमी P₁ − P₂', 'ಒತ್ತಡ ಇಳಿಕೆ P₁ − P₂'), value: fmt(r.P1 - r.P2, 2), unit: 'kPa' },
      { label: l3('P + ½ρv² (wide)', 'P + ½ρv² (चौड़ा)', 'P + ½ρv² (ಅಗಲ)'), value: fmt(r.P1 + dyn1, 2), unit: 'kPa' },
      { label: l3('P + ½ρv² (narrow)', 'P + ½ρv² (संकरा)', 'P + ½ρv² (ಕಿರಿದು)'), value: fmt(r.P2 + dyn2, 2), unit: 'kPa' },
    ];
  },
  formulas: [
    { expr: 'A₁ v₁ = A₂ v₂ = Q', note: l3('Continuity: the same volume of water passes every section each second.', 'सांतत्य: हर सेकंड हर भाग से पानी का उतना ही आयतन गुज़रता है।', 'ನಿರಂತರತೆ: ಪ್ರತಿ ಸೆಕೆಂಡ್ ಪ್ರತಿ ಭಾಗದಿಂದ ಅದೇ ಘನಫಲದ ನೀರು ಹಾದುಹೋಗುತ್ತದೆ.') },
    { expr: 'P₁ + ½ρv₁² = P₂ + ½ρv₂²', note: l3("Bernoulli's equation for a level pipe (same height).", 'समतल पाइप (समान ऊँचाई) के लिए बर्नौली समीकरण।', 'ಸಮತಲ ಕೊಳವೆಗೆ (ಅದೇ ಎತ್ತರ) ಬರ್ನೌಲಿ ಸಮೀಕರಣ.') },
    { expr: 'A = π D² / 4', note: l3('Cross-section area from the diameter.', 'व्यास से अनुप्रस्थ क्षेत्रफल।', 'ವ್ಯಾಸದಿಂದ ಅಡ್ಡಛೇದ ವಿಸ್ತೀರ್ಣ.') },
  ],
  liveFormula: (_s, p) => {
    const r = bernoulliCalc(p);
    return `P₂ = ${fmt(r.P1, 1)} + ½(1000)(${fmt(r.v1, 2)}² − ${fmt(r.v2, 2)}²)/1000 = ${fmt(r.P2, 2)} kPa`;
  },
  principle: l3(
    'Water cannot pile up inside the pipe, so the same amount must pass through the narrow part each second — it has to move faster there. To speed water up, something must push it forward: the pressure behind it must be higher than the pressure in front. So where the water is fast, the pressure is low. Bernoulli\'s equation is energy conservation for flowing fluid.',
    'पानी पाइप में जमा नहीं हो सकता, इसलिए हर सेकंड उतना ही पानी संकरे भाग से गुज़रना चाहिए — वहाँ उसे तेज़ चलना पड़ता है। पानी को तेज़ करने के लिए पीछे का दाब आगे के दाब से अधिक होना चाहिए। इसलिए जहाँ पानी तेज़ है, वहाँ दाब कम है। बर्नौली समीकरण बहते द्रव के लिए ऊर्जा संरक्षण है।',
    'ನೀರು ಕೊಳವೆಯಲ್ಲಿ ಶೇಖರವಾಗಲಾರದು, ಆದ್ದರಿಂದ ಪ್ರತಿ ಸೆಕೆಂಡ್ ಅದೇ ಪ್ರಮಾಣ ಕಿರಿದಾದ ಭಾಗದಲ್ಲಿ ಹಾದುಹೋಗಬೇಕು — ಅಲ್ಲಿ ಅದು ವೇಗವಾಗಿ ಚಲಿಸಬೇಕು. ನೀರನ್ನು ವೇಗಗೊಳಿಸಲು ಹಿಂದಿನ ಒತ್ತಡ ಮುಂದಿನದಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು. ಆದ್ದರಿಂದ ನೀರು ವೇಗವಾಗಿರುವಲ್ಲಿ ಒತ್ತಡ ಕಡಿಮೆ. ಬರ್ನೌಲಿ ಸಮೀಕರಣ ಹರಿಯುವ ದ್ರವಕ್ಕೆ ಶಕ್ತಿ ಸಂರಕ್ಷಣೆ.'
  ),
  observations: [
    l3('Halve the narrow diameter: the area becomes ¼, so the speed there becomes 4 times.', 'संकरे व्यास को आधा करें: क्षेत्रफल ¼ हो जाता है, इसलिए वहाँ चाल 4 गुना हो जाती है।', 'ಕಿರಿದಾದ ವ್ಯಾಸವನ್ನು ಅರ್ಧ ಮಾಡಿ: ವಿಸ್ತೀರ್ಣ ¼ ಆಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಅಲ್ಲಿ ವೇಗ 4 ಪಟ್ಟು.'),
    l3('The water column above the narrow part is shorter — lower pressure where the water is faster.', 'संकरे भाग के ऊपर पानी का स्तंभ छोटा है — जहाँ पानी तेज़ है वहाँ दाब कम।', 'ಕಿರಿದಾದ ಭಾಗದ ಮೇಲಿನ ನೀರಿನ ಕಂಬ ಚಿಕ್ಕದು — ನೀರು ವೇಗವಾಗಿರುವಲ್ಲಿ ಒತ್ತಡ ಕಡಿಮೆ.'),
    l3('Increase the flow rate: the pressure drop grows with the square of the speed.', 'प्रवाह दर बढ़ाएँ: दाब में कमी चाल के वर्ग के अनुसार बढ़ती है।', 'ಹರಿವಿನ ದರ ಹೆಚ್ಚಿಸಿ: ಒತ್ತಡ ಇಳಿಕೆ ವೇಗದ ವರ್ಗದಂತೆ ಹೆಚ್ಚುತ್ತದೆ.'),
    l3('P + ½ρv² is the same in the wide and narrow parts — check the two readings.', 'P + ½ρv² चौड़े और संकरे दोनों भागों में समान है — दोनों माप देखें।', 'P + ½ρv² ಅಗಲ ಮತ್ತು ಕಿರಿದಾದ ಎರಡೂ ಭಾಗಗಳಲ್ಲಿ ಸಮ — ಎರಡು ಅಳತೆಗಳನ್ನು ನೋಡಿ.'),
    l3('After the narrow part the pipe widens again, the water slows, and the pressure recovers.', 'संकरे भाग के बाद पाइप फिर चौड़ा होता है, पानी धीमा होता है और दाब लौट आता है।', 'ಕಿರಿದಾದ ಭಾಗದ ನಂತರ ಕೊಳವೆ ಮತ್ತೆ ಅಗಲವಾಗುತ್ತದೆ, ನೀರು ನಿಧಾನವಾಗುತ್ತದೆ ಮತ್ತು ಒತ್ತಡ ಮರಳುತ್ತದೆ.'),
  ],
  assumptions: [
    l3('Ideal fluid: no friction (viscosity), no turbulence, water does not compress, pipe is level.', 'आदर्श द्रव: घर्षण (श्यानता) नहीं, विक्षोभ नहीं, पानी संपीड्य नहीं, पाइप समतल।', 'ಆದರ್ಶ ದ್ರವ: ಘರ್ಷಣೆ (ಸ್ನಿಗ್ಧತೆ) ಇಲ್ಲ, ಪ್ರಕ್ಷುಬ್ಧತೆ ಇಲ್ಲ, ನೀರು ಸಂಕುಚಿಸದು, ಕೊಳವೆ ಸಮತಲ.'),
    l3('Speed is taken as uniform across each section. Real pipes lose some pressure to friction, so P₃ is slightly less than P₁.', 'हर भाग में चाल समान मानी गई है। असली पाइप में घर्षण से कुछ दाब खोता है, इसलिए P₃ थोड़ा P₁ से कम होता है।', 'ಪ್ರತಿ ಭಾಗದಲ್ಲಿ ವೇಗ ಏಕರೂಪ ಎಂದು ಪರಿಗಣಿಸಲಾಗಿದೆ. ನಿಜವಾದ ಕೊಳವೆಗಳಲ್ಲಿ ಘರ್ಷಣೆಯಿಂದ ಸ್ವಲ್ಪ ಒತ್ತಡ ನಷ್ಟ, ಆದ್ದರಿಂದ P₃ P₁ ಗಿಂತ ಸ್ವಲ್ಪ ಕಡಿಮೆ.'),
    l3('Pressures are gauge pressures (above air pressure). Columns are drawn to a common scale.', 'दाब गेज दाब हैं (वायुदाब से ऊपर)। स्तंभ एक ही पैमाने पर बने हैं।', 'ಒತ್ತಡಗಳು ಗೇಜ್ ಒತ್ತಡ (ವಾಯು ಒತ್ತಡಕ್ಕಿಂತ ಹೆಚ್ಚು). ಕಂಬಗಳನ್ನು ಒಂದೇ ಪ್ರಮಾಣದಲ್ಲಿ ಚಿತ್ರಿಸಲಾಗಿದೆ.'),
  ],
  quiz: [
    {
      q: l3('Where is the water pressure lowest in a Venturi tube?', 'वेंचुरी नली में पानी का दाब कहाँ सबसे कम है?', 'ವೆಂಚುರಿ ನಳಿಕೆಯಲ್ಲಿ ನೀರಿನ ಒತ್ತಡ ಎಲ್ಲಿ ಅತಿ ಕಡಿಮೆ?'),
      options: [l3('In the wide part', 'चौड़े भाग में', 'ಅಗಲ ಭಾಗದಲ್ಲಿ'), l3('In the narrow part', 'संकरे भाग में', 'ಕಿರಿದಾದ ಭಾಗದಲ್ಲಿ'), l3('Same everywhere', 'हर जगह समान', 'ಎಲ್ಲೆಡೆ ಸಮ')],
      correct: 1,
      explain: l3('Water is fastest there, and faster flow means lower pressure.', 'वहाँ पानी सबसे तेज़ है, और तेज़ प्रवाह का अर्थ कम दाब।', 'ಅಲ್ಲಿ ನೀರು ಅತಿ ವೇಗ, ವೇಗದ ಹರಿವು ಎಂದರೆ ಕಡಿಮೆ ಒತ್ತಡ.'),
    },
    {
      q: l3('If the narrow diameter is halved, the speed there becomes…', 'संकरा व्यास आधा करने पर वहाँ चाल हो जाती है…', 'ಕಿರಿದಾದ ವ್ಯಾಸ ಅರ್ಧವಾದರೆ ಅಲ್ಲಿ ವೇಗ…'),
      options: [l3('2 times', '2 गुना', '2 ಪಟ್ಟು'), l3('4 times', '4 गुना', '4 ಪಟ್ಟು'), l3('Half', 'आधी', 'ಅರ್ಧ')],
      correct: 1,
      explain: l3('Area ∝ D², so area becomes ¼ and v = Q/A becomes 4 times.', 'क्षेत्रफल ∝ D², इसलिए क्षेत्रफल ¼ और v = Q/A चार गुना।', 'ವಿಸ್ತೀರ್ಣ ∝ D², ಆದ್ದರಿಂದ ವಿಸ್ತೀರ್ಣ ¼ ಮತ್ತು v = Q/A ನಾಲ್ಕು ಪಟ್ಟು.'),
    },
    {
      q: l3('Which everyday effect uses this principle?', 'कौन-सा रोज़मर्रा का प्रभाव इस सिद्धांत पर है?', 'ಯಾವ ದೈನಂದಿನ ಪರಿಣಾಮ ಈ ತತ್ವ ಬಳಸುತ್ತದೆ?'),
      options: [l3('A spray pump / atomiser', 'स्प्रे पंप / एटमाइज़र', 'ಸ್ಪ್ರೇ ಪಂಪ್ / ಅಟೊಮೈಸರ್'), l3('A magnet picking up pins', 'चुंबक का पिन उठाना', 'ಆಯಸ್ಕಾಂತ ಪಿನ್ ಎತ್ತುವುದು'), l3('A ball rolling down a slope', 'ढलान पर लुढ़कती गेंद', 'ಇಳಿಜಾರಿನಲ್ಲಿ ಉರುಳುವ ಚೆಂಡು')],
      correct: 0,
      explain: l3('Fast air over the tube lowers the pressure, so liquid is pulled up and sprayed.', 'नली के ऊपर तेज़ हवा दाब घटाती है, इसलिए द्रव ऊपर खिंचकर छिड़कता है।', 'ನಳಿಕೆಯ ಮೇಲಿನ ವೇಗದ ಗಾಳಿ ಒತ್ತಡ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ದ್ರವ ಮೇಲೆಳೆದು ಸಿಂಪಡಿಸಲಾಗುತ್ತದೆ.'),
    },
  ],
};

/* =====================================================================
   4 & 5. SPHERICAL MIRRORS — New Cartesian sign convention (NCERT)
   Pole at origin, light travels left → right, distances against the light are negative.
   1/v + 1/u = 1/f,   m = −v/u
   ===================================================================== */
interface MirState {
  t: number;
  sweepT: number;
  u: number; // signed, cm (negative)
}
function mirrorImage(u: number, f: number) {
  const inv = 1 / f - 1 / u;
  if (Math.abs(inv) < 1e-6) return { v: Infinity, m: Infinity };
  const v = 1 / inv;
  return { v, m: -v / u };
}
function mirrorNature(u: number, f: number, lang: Lang) {
  const { v, m } = mirrorImage(u, f);
  const T = (en: string, hi: string, kn: string) => (lang === 'hi' ? hi : lang === 'kn' ? kn : en);
  if (!Number.isFinite(v)) return T('Image at infinity (rays come out parallel)', 'प्रतिबिंब अनंत पर (किरणें समानांतर)', 'ಪ್ರತಿಬಿಂಬ ಅನಂತದಲ್ಲಿ (ಕಿರಣಗಳು ಸಮಾಂತರ)');
  const real = v < 0;
  const am = Math.abs(m);
  const size = Math.abs(am - 1) < 0.02 ? T('same size', 'समान आकार', 'ಅದೇ ಗಾತ್ರ') : am > 1 ? T('magnified', 'आवर्धित', 'ವರ್ಧಿತ') : T('diminished', 'छोटा', 'ಚಿಕ್ಕದು');
  return [
    real ? T('Real', 'वास्तविक', 'ನೈಜ') : T('Virtual', 'आभासी', 'ಮಿಥ್ಯ'),
    m < 0 ? T('inverted', 'उल्टा', 'ತಲೆಕೆಳಗು') : T('erect', 'सीधा', 'ನೇರ'),
    size,
  ].join(', ');
}
function concaveZone(u: number, f: number, lang: Lang) {
  const T = (en: string, hi: string, kn: string) => (lang === 'hi' ? hi : lang === 'kn' ? kn : en);
  const d = Math.abs(u), F = Math.abs(f);
  if (Math.abs(d - 2 * F) < 0.26) return T('Object at C → image at C', 'वस्तु C पर → प्रतिबिंब C पर', 'ವಸ್ತು C ನಲ್ಲಿ → ಪ್ರತಿಬಿಂಬ C ನಲ್ಲಿ');
  if (Math.abs(d - F) < 0.26) return T('Object at F → image at infinity', 'वस्तु F पर → प्रतिबिंब अनंत पर', 'ವಸ್ತು F ನಲ್ಲಿ → ಪ್ರತಿಬಿಂಬ ಅನಂತದಲ್ಲಿ');
  if (d > 2 * F) return T('Object beyond C → image between F and C', 'वस्तु C से परे → प्रतिबिंब F और C के बीच', 'ವಸ್ತು C ಆಚೆ → ಪ್ರತಿಬಿಂಬ F ಮತ್ತು C ನಡುವೆ');
  if (d > F) return T('Object between C and F → image beyond C', 'वस्तु C और F के बीच → प्रतिबिंब C से परे', 'ವಸ್ತು C ಮತ್ತು F ನಡುವೆ → ಪ್ರತಿಬಿಂಬ C ಆಚೆ');
  return T('Object between F and P → image behind the mirror', 'वस्तु F और P के बीच → प्रतिबिंब दर्पण के पीछे', 'ವಸ್ತು F ಮತ್ತು P ನಡುವೆ → ಪ್ರತಿಬಿಂಬ ದರ್ಪಣದ ಹಿಂದೆ');
}

function makeMirror(kind: 'concave' | 'convex'): StationDef<MirState> {
  const concave = kind === 'concave';
  const sgn = concave ? -1 : 1; // sign of f
  const uOf = (s: MirState, p: Params) => (p.sweep ? s.u : -p.u);
  const fOf = (p: Params) => sgn * p.f;
  const XMIN = -66, XMAX = concave ? 40 : 56, YMAX = 10;

  return {
    id: concave ? 'concave-mirror' : 'convex-mirror',
    title: concave ? l3('Ray Optics – Concave Mirror', 'किरण प्रकाशिकी – अवतल दर्पण', 'ಕಿರಣ ದೃಗ್ವಿಜ್ಞಾನ – ನಿಮ್ನ ದರ್ಪಣ') : l3('Ray Optics – Convex Mirror', 'किरण प्रकाशिकी – उत्तल दर्पण', 'ಕಿರಣ ದೃಗ್ವಿಜ್ಞಾನ – ಪೀನ ದರ್ಪಣ'),
    intro: concave
      ? l3(
          'A concave mirror curves inward, like the inside of a spoon. Move the object and watch three light rays find the image — sometimes real and upside-down, sometimes virtual and enlarged.',
          'अवतल दर्पण चम्मच के अंदर की तरह भीतर की ओर मुड़ा होता है। वस्तु को खिसकाएँ और देखें कि तीन किरणें प्रतिबिंब कैसे बनाती हैं — कभी वास्तविक और उल्टा, कभी आभासी और बड़ा।',
          'ನಿಮ್ನ ದರ್ಪಣ ಚಮಚದ ಒಳಭಾಗದಂತೆ ಒಳಕ್ಕೆ ಬಾಗಿರುತ್ತದೆ. ವಸ್ತುವನ್ನು ಸರಿಸಿ ಮೂರು ಕಿರಣಗಳು ಪ್ರತಿಬಿಂಬ ಹೇಗೆ ರೂಪಿಸುತ್ತವೆ ನೋಡಿ — ಕೆಲವೊಮ್ಮೆ ನೈಜ ಮತ್ತು ತಲೆಕೆಳಗು, ಕೆಲವೊಮ್ಮೆ ಮಿಥ್ಯ ಮತ್ತು ದೊಡ್ಡದು.'
        )
      : l3(
          'A convex mirror bulges outward, like the back of a spoon or a vehicle side mirror. Move the object and see why the image is always small, upright and behind the mirror.',
          'उत्तल दर्पण चम्मच के पीछे या वाहन के साइड मिरर की तरह बाहर की ओर उभरा होता है। वस्तु खिसकाएँ और देखें कि प्रतिबिंब हमेशा छोटा, सीधा और दर्पण के पीछे क्यों बनता है।',
          'ಪೀನ ದರ್ಪಣ ಚಮಚದ ಹಿಂಭಾಗ ಅಥವಾ ವಾಹನದ ಪಕ್ಕದ ಕನ್ನಡಿಯಂತೆ ಹೊರಕ್ಕೆ ಉಬ್ಬಿರುತ್ತದೆ. ವಸ್ತು ಸರಿಸಿ ಪ್ರತಿಬಿಂಬ ಯಾವಾಗಲೂ ಚಿಕ್ಕದು, ನೇರ ಮತ್ತು ದರ್ಪಣದ ಹಿಂದೆ ಏಕೆ ಎಂದು ನೋಡಿ.'
        ),
    params: [
      { key: 'u', label: l3('Object distance |u|', 'वस्तु दूरी |u|', 'ವಸ್ತು ದೂರ |u|'), min: 3, max: 60, step: 0.5, unit: 'cm', def: 30 },
      { key: 'f', label: l3('Focal length |f|', 'फोकस दूरी |f|', 'ನಾಭಿ ದೂರ |f|'), min: 5, max: 25, step: 0.5, unit: 'cm', def: 12 },
      { key: 'ho', label: l3('Object height', 'वस्तु की ऊँचाई', 'ವಸ್ತುವಿನ ಎತ್ತರ'), min: 1, max: 6, step: 0.5, unit: 'cm', def: 4, live: true },
      {
        key: 'sweep',
        label: l3('Move object automatically', 'वस्तु अपने आप खिसकाएँ', 'ವಸ್ತುವನ್ನು ಸ್ವಯಂ ಸರಿಸಿ'),
        min: 0, max: 1, step: 1, unit: '', def: 0, live: true,
        choices: [
          { value: 0, label: l3('Off', 'बंद', 'ಆಫ್') },
          { value: 1, label: l3('On', 'चालू', 'ಆನ್') },
        ],
      },
    ],
    speeds: [0.5, 1, 2],
    init: (p) => ({ t: 0, sweepT: 0, u: -p.u }),
    step(s, p, dt) {
      s.t += dt;
      if (p.sweep) {
        s.sweepT += dt;
        const ph = (s.sweepT % 20) / 20; // 20 s round trip
        const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        s.u = -(58 - tri * 55); // 58 cm → 3 cm → 58 cm
      } else s.u = -p.u;
    },
    draw(c, s, p, w, h, dark, lang) {
      const k = colors(dark);
      const u = uOf(s, p), f = fOf(p);
      const { v, m } = mirrorImage(u, f);
      const hi = m * p.ho;
      // Distances along the axis are to scale; heights are enlarged by a stated factor (as in textbook
      // ray diagrams). A stretch along one direction keeps straight lines straight, so the rays still
      // meet exactly at the image given by the mirror formula.
      const pad = 24;
      const sx = (w - 2 * pad) / (XMAX - XMIN);
      const sy = Math.max(sx, (h - 44 - 2 * pad) / (2 * YMAX));
      const X = (x: number) => pad + (x - XMIN) * sx;
      const Y = (y: number) => pad + (YMAX - y) * sy;
      const stretch = sy / sx;
      const prog = p.sweep ? 99 : s.t; // animated ray drawing
      // axis + grid ticks
      c.strokeStyle = k.soft;
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(X(XMIN), Y(0));
      c.lineTo(X(XMAX), Y(0));
      c.stroke();
      for (let x = Math.ceil(XMIN / 10) * 10; x <= XMAX; x += 10) {
        c.beginPath();
        c.moveTo(X(x), Y(0) - 3);
        c.lineTo(X(x), Y(0) + 3);
        c.stroke();
        label(c, `${x}`, X(x), Y(0) + 15, k.soft, 10, 'center');
      }
      label(c, 'cm', X(XMAX) - 2, Y(0) - 6, k.soft, 10, 'right');
      if (stretch > 1.05)
        label(c, tr(lang, `Heights ×${fmt(stretch, 1)}`, `ऊँचाई ×${fmt(stretch, 1)}`, `ಎತ್ತರ ×${fmt(stretch, 1)}`), 16, 36, k.soft, 11);
      // mirror (schematic arc) with hatching on the back
      const ap = YMAX - 1;
      const sag = 1.6 * (concave ? -1 : 1);
      c.strokeStyle = dark ? '#A5C8E8' : '#2C5F8A';
      c.lineWidth = 4;
      c.beginPath();
      for (let i = -20; i <= 20; i++) {
        const y = (ap * i) / 20;
        const x = sag * (y / ap) ** 2;
        if (i === -20) c.moveTo(X(x), Y(y));
        else c.lineTo(X(x), Y(y));
      }
      c.stroke();
      c.strokeStyle = k.soft;
      c.lineWidth = 1;
      for (let i = -18; i <= 18; i += 2) {
        const y = (ap * i) / 20;
        const x = sag * (y / ap) ** 2;
        c.beginPath();
        c.moveTo(X(x) + 2, Y(y));
        c.lineTo(X(x) + 9, Y(y) + 6);
        c.stroke();
      }
      // P, F, C
      const pts: [string, number][] = [['P', 0], ['F', f], ['C', 2 * f]];
      for (const [name, x] of pts) {
        if (x < XMIN || x > XMAX) continue;
        c.fillStyle = name === 'P' ? k.ink : name === 'F' ? AMBER : PURPLE;
        c.beginPath();
        c.arc(X(x), Y(0), 4.5, 0, Math.PI * 2);
        c.fill();
        label(c, name, X(x) + (name === 'P' ? 8 : 0), Y(0) - 10, c.fillStyle as string, 14, 'center');
      }
      // object arrow
      arrow(c, X(u), Y(0), X(u), Y(p.ho), RED, 3.5);
      label(c, tr(lang, 'Object', 'वस्तु', 'ವಸ್ತು'), X(u), Y(p.ho) - 8, RED, 12, 'center');
      // ---- rays ----
      const seg = (x1: number, y1: number, x2: number, y2: number, t0: number, color: string, dash = false, dur = 0.9) => {
        const t = clamp((prog - t0) / dur, 0, 1);
        if (t <= 0) return;
        const xe = x1 + (x2 - x1) * t, ye = y1 + (y2 - y1) * t;
        if (dash) dashed(c, X(x1), Y(y1), X(xe), Y(ye), color, 1.6, [6, 5]);
        else {
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(X(x1), Y(y1));
          c.lineTo(X(xe), Y(ye));
          c.stroke();
          if (t === 1) {
            // small direction arrowhead at the middle
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            const ang = Math.atan2(Y(y2) - Y(y1), X(x2) - X(x1));
            c.fillStyle = color;
            c.beginPath();
            c.moveTo(X(mx) + 7 * Math.cos(ang), Y(my) + 7 * Math.sin(ang));
            c.lineTo(X(mx) - 6 * Math.cos(ang - 0.5), Y(my) - 6 * Math.sin(ang - 0.5));
            c.lineTo(X(mx) - 6 * Math.cos(ang + 0.5), Y(my) - 6 * Math.sin(ang + 0.5));
            c.fill();
          }
        }
      };
      /** extend a reflected ray from (0,y0) along direction (dx,dy) to the left edge of the view */
      const toLeft = (y0: number, dx: number, dy: number) => {
        const tt = (XMIN - 0) / dx;
        return { x: XMIN, y: y0 + dy * tt };
      };
      const rayColors = ['#D97706', '#6D28D9', '#7C3AED'];
      const imgFinite = Number.isFinite(v);
      // Ray 1: parallel to axis → reflects through F (concave) / as if from F (convex)
      {
        const yh = p.ho;
        seg(u, yh, 0, yh, 0, rayColors[0]);
        const dx = f - 0, dy = 0 - yh; // direction towards F from hit point
        const dirx = concave ? dx : -dx, diry = concave ? dy : -dy; // convex: away from F
        const e = toLeft(yh, dirx, diry);
        seg(0, yh, e.x, e.y, 0.9, rayColors[0]);
        if (!concave) seg(0, yh, f, 0, 1.8, rayColors[0], true, 0.6);
        else if (imgFinite && v > 0) seg(0, yh, v, hi, 1.8, rayColors[0], true, 0.6);
      }
      // Ray 2: towards C → reflects back on itself
      if (Math.abs(2 * f - u) > 1e-6) {
        const yb = p.ho + ((0 - u) * (0 - p.ho)) / (2 * f - u);
        if (Math.abs(yb) < YMAX + 25) {
          seg(u, p.ho, 0, yb, 0, rayColors[1]);
          const e = toLeft(yb, u - 0, p.ho - yb);
          seg(0, yb, e.x, e.y, 0.9, rayColors[1]);
          if (!concave) seg(0, yb, 2 * f, 0, 1.8, rayColors[1], true, 0.6);
          else if (imgFinite && v > 0) seg(0, yb, v, hi, 1.8, rayColors[1], true, 0.6);
        }
      }
      // Ray 3: through / towards F → reflects parallel to axis
      if (Math.abs(u - f) > 0.26) {
        const yc = (-p.ho * f) / (u - f);
        if (Math.abs(yc) < YMAX + 25) {
          seg(u, p.ho, 0, yc, 0, rayColors[2]);
          seg(0, yc, XMIN, yc, 0.9, rayColors[2]);
          if (imgFinite && v > 0) seg(0, yc, v, hi, 1.8, rayColors[2], true, 0.6);
        }
      }
      // image arrow
      if (imgFinite && prog > 1.8) {
        const visible = v > XMIN && v < XMAX;
        if (visible) {
          const yTop = clamp(hi, -YMAX, YMAX);
          if (v > 0) dashed(c, X(v), Y(0), X(v), Y(yTop), '#2563EB', 3, [5, 4]);
          arrow(c, X(v), Y(0), X(v), Y(yTop), '#2563EB', v > 0 ? 1.5 : 3.5);
          label(c, v > 0 ? tr(lang, 'Virtual image', 'आभासी प्रतिबिंब', 'ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ') : tr(lang, 'Real image', 'वास्तविक प्रतिबिंब', 'ನೈಜ ಪ್ರತಿಬಿಂಬ'), X(v), Y(yTop) + (yTop >= 0 ? -8 : 18), '#2563EB', 12, 'center');
          if (Math.abs(hi) > YMAX) label(c, tr(lang, '(taller than the view)', '(दृश्य से ऊँचा)', '(ನೋಟಕ್ಕಿಂತ ಎತ್ತರ)'), X(v), Y(yTop) + (yTop >= 0 ? -22 : 32), '#2563EB', 11, 'center');
        } else label(c, `${tr(lang, 'Image is outside the view', 'प्रतिबिंब दृश्य के बाहर है', 'ಪ್ರತಿಬಿಂಬ ನೋಟದ ಹೊರಗಿದೆ')} (v = ${fmt(v, 1)} cm)`, 16, 22, '#2563EB', 13);
      }
      // status line
      const zone = concave ? concaveZone(u, f, lang) : '';
      label(c, `${mirrorNature(u, f, lang)}${zone ? '   •   ' + zone : ''}`, 16, h - 14, k.ink, 14);
      label(c, `u = ${fmt(u, 1)} cm    v = ${imgFinite ? fmt(v, 1) + ' cm' : '∞'}    m = ${imgFinite ? fmt(m, 2) : '∞'}`, 16, 18, k.ink, 13);
    },
    readings(s, p) {
      const u = uOf(s, p), f = fOf(p);
      const { v, m } = mirrorImage(u, f);
      const inf = !Number.isFinite(v);
      return [
        { label: l3('Object distance u', 'वस्तु दूरी u', 'ವಸ್ತು ದೂರ u'), value: fmt(u, 1), unit: 'cm' },
        { label: l3('Image distance v', 'प्रतिबिंब दूरी v', 'ಪ್ರತಿಬಿಂಬ ದೂರ v'), value: inf ? '∞' : fmt(v, 1), unit: inf ? '' : 'cm', accent: true },
        { label: l3('Focal length f', 'फोकस दूरी f', 'ನಾಭಿ ದೂರ f'), value: fmt(f, 1), unit: 'cm' },
        { label: l3('Radius of curvature R = 2f', 'वक्रता त्रिज्या R = 2f', 'ವಕ್ರತಾ ತ್ರಿಜ್ಯ R = 2f'), value: fmt(2 * f, 1), unit: 'cm' },
        { label: l3('Magnification m = −v/u', 'आवर्धन m = −v/u', 'ವರ್ಧನೆ m = −v/u'), value: inf ? '∞' : fmt(m, 2), unit: '', accent: true },
        { label: l3("Image height h' = m·h", "प्रतिबिंब ऊँचाई h' = m·h", "ಪ್ರತಿಬಿಂಬ ಎತ್ತರ h' = m·h"), value: inf ? '∞' : fmt(m * p.ho, 2), unit: inf ? '' : 'cm' },
        { label: l3('Object height h', 'वस्तु ऊँचाई h', 'ವಸ್ತು ಎತ್ತರ h'), value: fmt(p.ho, 1), unit: 'cm' },
        { label: l3('Image', 'प्रतिबिंब', 'ಪ್ರತಿಬಿಂಬ'), value: '', unit: '', nature: { en: mirrorNature(u, f, 'en'), hi: mirrorNature(u, f, 'hi'), kn: mirrorNature(u, f, 'kn') } },
      ];
    },
    formulas: [
      { expr: '1/v + 1/u = 1/f', note: l3('Mirror formula (New Cartesian sign convention).', 'दर्पण सूत्र (नई कार्तीय चिह्न परिपाटी)।', 'ದರ್ಪಣ ಸೂತ್ರ (ಹೊಸ ಕಾರ್ಟೀಸಿಯನ್ ಚಿಹ್ನೆ ಸಂಪ್ರದಾಯ).') },
      { expr: "m = h'/h = −v/u", note: l3('Magnification: negative = inverted, positive = erect.', 'आवर्धन: ऋणात्मक = उल्टा, धनात्मक = सीधा।', 'ವರ್ಧನೆ: ಋಣ = ತಲೆಕೆಳಗು, ಧನ = ನೇರ.') },
      { expr: 'f = R/2', note: concave ? l3('For a concave mirror f is negative (F is in front).', 'अवतल दर्पण के लिए f ऋणात्मक है (F सामने है)।', 'ನಿಮ್ನ ದರ್ಪಣಕ್ಕೆ f ಋಣ (F ಮುಂದೆ ಇದೆ).') : l3('For a convex mirror f is positive (F is behind).', 'उत्तल दर्पण के लिए f धनात्मक है (F पीछे है)।', 'ಪೀನ ದರ್ಪಣಕ್ಕೆ f ಧನ (F ಹಿಂದೆ ಇದೆ).') },
      { expr: 'Sign rule', note: l3('Distances measured from the pole P. Along the incident light (to the right) = +, against it (in front of the mirror) = −. Up = +, down = −.', 'दूरी ध्रुव P से मापी जाती है। आपतित प्रकाश की दिशा (दाईं ओर) = +, विपरीत (दर्पण के सामने) = −। ऊपर = +, नीचे = −।', 'ದೂರವನ್ನು ಧ್ರುವ P ಯಿಂದ ಅಳೆಯಲಾಗುತ್ತದೆ. ಬೀಳುವ ಬೆಳಕಿನ ದಿಕ್ಕು (ಬಲಕ್ಕೆ) = +, ವಿರುದ್ಧ (ದರ್ಪಣದ ಮುಂದೆ) = −. ಮೇಲೆ = +, ಕೆಳಗೆ = −.') },
    ],
    liveFormula: (s, p) => {
      const u = uOf(s, p), f = fOf(p);
      const { v } = mirrorImage(u, f);
      return `1/v = 1/(${fmt(f, 1)}) − 1/(${fmt(u, 1)})  ⇒  v = ${Number.isFinite(v) ? fmt(v, 1) + ' cm' : '∞'}`;
    },
    principle: concave
      ? l3(
          'Every light ray obeys the law of reflection: angle of incidence = angle of reflection. For a curved mirror this makes three rays easy to follow: a ray parallel to the axis reflects through the focus F, a ray through F reflects parallel, and a ray through the centre of curvature C hits the mirror straight on and comes back. Where the reflected rays meet, a real image forms; if they spread out, they only seem to come from a point behind the mirror — a virtual image.',
          'हर किरण परावर्तन के नियम का पालन करती है: आपतन कोण = परावर्तन कोण। वक्र दर्पण में तीन किरणें आसानी से देखी जा सकती हैं: अक्ष के समानांतर किरण फोकस F से होकर परावर्तित होती है, F से होकर आने वाली किरण समानांतर परावर्तित होती है, और वक्रता केंद्र C से होकर आने वाली किरण सीधे टकराकर वापस लौटती है। जहाँ परावर्तित किरणें मिलती हैं वहाँ वास्तविक प्रतिबिंब बनता है; यदि वे फैलती हैं तो दर्पण के पीछे के बिंदु से आती लगती हैं — आभासी प्रतिबिंब।',
          'ಪ್ರತಿ ಕಿರಣ ಪ್ರತಿಫಲನ ನಿಯಮ ಪಾಲಿಸುತ್ತದೆ: ಪತನ ಕೋನ = ಪ್ರತಿಫಲನ ಕೋನ. ಬಾಗಿದ ದರ್ಪಣದಲ್ಲಿ ಮೂರು ಕಿರಣಗಳು ಸುಲಭ: ಅಕ್ಷಕ್ಕೆ ಸಮಾಂತರ ಕಿರಣ ನಾಭಿ F ಮೂಲಕ ಪ್ರತಿಫಲಿಸುತ್ತದೆ, F ಮೂಲಕ ಬರುವ ಕಿರಣ ಸಮಾಂತರವಾಗಿ ಪ್ರತಿಫಲಿಸುತ್ತದೆ, ವಕ್ರತಾ ಕೇಂದ್ರ C ಮೂಲಕ ಬರುವ ಕಿರಣ ನೇರವಾಗಿ ಹಿಂದಿರುಗುತ್ತದೆ. ಪ್ರತಿಫಲಿತ ಕಿರಣಗಳು ಸೇರುವಲ್ಲಿ ನೈಜ ಪ್ರತಿಬಿಂಬ; ಅವು ಹರಡಿದರೆ ದರ್ಪಣದ ಹಿಂದಿನ ಬಿಂದುವಿನಿಂದ ಬಂದಂತೆ ಕಾಣುತ್ತವೆ — ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ.'
        )
      : l3(
          'A convex mirror spreads light out. A ray parallel to the axis reflects as if it came from the focus F behind the mirror; a ray aimed at F reflects parallel; a ray aimed at C comes straight back. The reflected rays never meet in front of the mirror — traced backwards (dashed lines) they meet behind it, so the image is always virtual, erect and smaller. That is why convex mirrors show a wide view in vehicles and at road bends.',
          'उत्तल दर्पण प्रकाश को फैलाता है। अक्ष के समानांतर किरण ऐसे परावर्तित होती है मानो दर्पण के पीछे फोकस F से आ रही हो; F की ओर जाने वाली किरण समानांतर परावर्तित होती है; C की ओर जाने वाली किरण सीधे लौटती है। परावर्तित किरणें दर्पण के सामने कभी नहीं मिलतीं — पीछे बढ़ाने पर (बिंदुदार रेखाएँ) दर्पण के पीछे मिलती हैं, इसलिए प्रतिबिंब हमेशा आभासी, सीधा और छोटा होता है। इसीलिए वाहनों और सड़क के मोड़ पर उत्तल दर्पण चौड़ा दृश्य दिखाते हैं।',
          'ಪೀನ ದರ್ಪಣ ಬೆಳಕನ್ನು ಹರಡುತ್ತದೆ. ಅಕ್ಷಕ್ಕೆ ಸಮಾಂತರ ಕಿರಣ ದರ್ಪಣದ ಹಿಂದಿನ ನಾಭಿ F ನಿಂದ ಬಂದಂತೆ ಪ್ರತಿಫಲಿಸುತ್ತದೆ; F ಕಡೆಗೆ ಹೋಗುವ ಕಿರಣ ಸಮಾಂತರವಾಗಿ ಪ್ರತಿಫಲಿಸುತ್ತದೆ; C ಕಡೆಗೆ ಹೋಗುವ ಕಿರಣ ನೇರವಾಗಿ ಹಿಂದಿರುಗುತ್ತದೆ. ಪ್ರತಿಫಲಿತ ಕಿರಣಗಳು ದರ್ಪಣದ ಮುಂದೆ ಎಂದೂ ಸೇರುವುದಿಲ್ಲ — ಹಿಂದಕ್ಕೆ ವಿಸ್ತರಿಸಿದರೆ (ಚುಕ್ಕೆ ಗೆರೆ) ಹಿಂದೆ ಸೇರುತ್ತವೆ, ಆದ್ದರಿಂದ ಪ್ರತಿಬಿಂಬ ಯಾವಾಗಲೂ ಮಿಥ್ಯ, ನೇರ ಮತ್ತು ಚಿಕ್ಕದು. ಅದಕ್ಕೇ ವಾಹನಗಳಲ್ಲಿ ಮತ್ತು ರಸ್ತೆ ತಿರುವುಗಳಲ್ಲಿ ಪೀನ ದರ್ಪಣ ವಿಶಾಲ ನೋಟ ತೋರಿಸುತ್ತದೆ.'
        ),
    observations: concave
      ? [
          l3('Object far away (beyond C): image is real, inverted and small, between F and C.', 'वस्तु दूर (C से परे): प्रतिबिंब वास्तविक, उल्टा और छोटा, F और C के बीच।', 'ವಸ್ತು ದೂರ (C ಆಚೆ): ಪ್ರತಿಬಿಂಬ ನೈಜ, ತಲೆಕೆಳಗು ಮತ್ತು ಚಿಕ್ಕದು, F ಮತ್ತು C ನಡುವೆ.'),
          l3('Object at C (|u| = 2|f|): image is at C, real, inverted and the same size (m = −1).', 'वस्तु C पर (|u| = 2|f|): प्रतिबिंब C पर, वास्तविक, उल्टा और समान आकार (m = −1)।', 'ವಸ್ತು C ನಲ್ಲಿ (|u| = 2|f|): ಪ್ರತಿಬಿಂಬ C ನಲ್ಲಿ, ನೈಜ, ತಲೆಕೆಳಗು ಮತ್ತು ಅದೇ ಗಾತ್ರ (m = −1).'),
          l3('Object between C and F: image moves beyond C and becomes bigger than the object.', 'वस्तु C और F के बीच: प्रतिबिंब C से परे चला जाता है और वस्तु से बड़ा हो जाता है।', 'ವಸ್ತು C ಮತ್ತು F ನಡುವೆ: ಪ್ರತಿಬಿಂಬ C ಆಚೆ ಹೋಗಿ ವಸ್ತುವಿಗಿಂತ ದೊಡ್ಡದಾಗುತ್ತದೆ.'),
          l3('Object at F: reflected rays are parallel — the image is at infinity (used in torches and headlights).', 'वस्तु F पर: परावर्तित किरणें समानांतर — प्रतिबिंब अनंत पर (टॉर्च और हेडलाइट में उपयोग)।', 'ವಸ್ತು F ನಲ್ಲಿ: ಪ್ರತಿಫಲಿತ ಕಿರಣಗಳು ಸಮಾಂತರ — ಪ್ರತಿಬಿಂಬ ಅನಂತದಲ್ಲಿ (ಟಾರ್ಚ್ ಮತ್ತು ಹೆಡ್‌ಲೈಟ್‌ನಲ್ಲಿ ಬಳಕೆ).'),
          l3('Object between F and P: rays spread out; the image is virtual, erect and magnified behind the mirror (shaving / makeup mirror).', 'वस्तु F और P के बीच: किरणें फैलती हैं; प्रतिबिंब दर्पण के पीछे आभासी, सीधा और बड़ा (शेविंग / मेकअप दर्पण)।', 'ವಸ್ತು F ಮತ್ತು P ನಡುವೆ: ಕಿರಣಗಳು ಹರಡುತ್ತವೆ; ಪ್ರತಿಬಿಂಬ ದರ್ಪಣದ ಹಿಂದೆ ಮಿಥ್ಯ, ನೇರ ಮತ್ತು ದೊಡ್ಡದು (ಶೇವಿಂಗ್ / ಮೇಕಪ್ ಕನ್ನಡಿ).'),
        ]
      : [
          l3('Wherever the object is, the image stays behind the mirror, between P and F.', 'वस्तु कहीं भी हो, प्रतिबिंब दर्पण के पीछे P और F के बीच रहता है।', 'ವಸ್ತು ಎಲ್ಲೇ ಇರಲಿ, ಪ್ರತಿಬಿಂಬ ದರ್ಪಣದ ಹಿಂದೆ P ಮತ್ತು F ನಡುವೆ ಇರುತ್ತದೆ.'),
          l3('The image is always virtual, erect and smaller (0 < m < 1).', 'प्रतिबिंब हमेशा आभासी, सीधा और छोटा होता है (0 < m < 1)।', 'ಪ್ರತಿಬಿಂಬ ಯಾವಾಗಲೂ ಮಿಥ್ಯ, ನೇರ ಮತ್ತು ಚಿಕ್ಕದು (0 < m < 1).'),
          l3('Move the object closer: the image grows and moves towards P; move it away: the image shrinks towards F.', 'वस्तु पास लाएँ: प्रतिबिंब बड़ा होकर P की ओर आता है; दूर ले जाएँ: प्रतिबिंब छोटा होकर F की ओर जाता है।', 'ವಸ್ತು ಹತ್ತಿರ ತನ್ನಿ: ಪ್ರತಿಬಿಂಬ ದೊಡ್ಡದಾಗಿ P ಕಡೆ ಬರುತ್ತದೆ; ದೂರ ಒಯ್ಯಿರಿ: ಚಿಕ್ಕದಾಗಿ F ಕಡೆ ಹೋಗುತ್ತದೆ.'),
          l3('A smaller |f| (more curved mirror) makes the image even smaller and shows a wider area.', 'छोटा |f| (अधिक वक्र दर्पण) प्रतिबिंब और छोटा करता है और अधिक चौड़ा क्षेत्र दिखाता है।', 'ಚಿಕ್ಕ |f| (ಹೆಚ್ಚು ಬಾಗಿದ ದರ್ಪಣ) ಪ್ರತಿಬಿಂಬವನ್ನು ಇನ್ನಷ್ಟು ಚಿಕ್ಕದಾಗಿಸಿ ವಿಶಾಲ ಪ್ರದೇಶ ತೋರಿಸುತ್ತದೆ.'),
        ],
    assumptions: [
      l3('Paraxial rays: rays stay close to the axis, so reflection is drawn at the pole plane (as in NCERT diagrams). Wide real mirrors blur the image a little (spherical aberration).', 'उपाक्षीय किरणें: किरणें अक्ष के पास रहती हैं, इसलिए परावर्तन ध्रुव तल पर दिखाया गया है (NCERT चित्रों की तरह)। चौड़े असली दर्पण प्रतिबिंब को थोड़ा धुंधला करते हैं (गोलीय विपथन)।', 'ಸಮೀಪಾಕ್ಷೀಯ ಕಿರಣಗಳು: ಕಿರಣಗಳು ಅಕ್ಷದ ಹತ್ತಿರ ಇರುತ್ತವೆ, ಆದ್ದರಿಂದ ಪ್ರತಿಫಲನ ಧ್ರುವ ಸಮತಲದಲ್ಲಿ ತೋರಿಸಲಾಗಿದೆ (NCERT ಚಿತ್ರಗಳಂತೆ). ಅಗಲ ನಿಜ ದರ್ಪಣಗಳು ಪ್ರತಿಬಿಂಬವನ್ನು ಸ್ವಲ್ಪ ಮಸುಕಾಗಿಸುತ್ತವೆ (ಗೋಳೀಯ ವಿಪಥನ).'),
      l3('The mirror curve is drawn schematically. Distances along the axis are to scale (1 mark = 10 cm); heights are enlarged by the factor shown on screen so the rays are easy to see — the image position is not affected.', 'दर्पण का वक्र सांकेतिक है। अक्ष के साथ दूरी पैमाने पर है (1 निशान = 10 cm); किरणें साफ़ दिखें इसलिए ऊँचाइयाँ स्क्रीन पर लिखे गुणक से बड़ी दिखाई गई हैं — प्रतिबिंब की स्थिति नहीं बदलती।', 'ದರ್ಪಣದ ವಕ್ರತೆ ಸಾಂಕೇತಿಕ. ಅಕ್ಷದ ಉದ್ದಕ್ಕೂ ದೂರ ಪ್ರಮಾಣದಲ್ಲಿದೆ (1 ಗುರುತು = 10 cm); ಕಿರಣಗಳು ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಲು ಎತ್ತರಗಳನ್ನು ಪರದೆಯ ಮೇಲಿನ ಗುಣಕದಿಂದ ದೊಡ್ಡದಾಗಿಸಲಾಗಿದೆ — ಪ್ರತಿಬಿಂಬದ ಸ್ಥಾನ ಬದಲಾಗುವುದಿಲ್ಲ.'),
    ],
    quiz: concave
      ? [
          {
            q: l3('A concave mirror has f = −10 cm. An object is at u = −30 cm. Where is the image?', 'अवतल दर्पण f = −10 cm। वस्तु u = −30 cm पर है। प्रतिबिंब कहाँ है?', 'ನಿಮ್ನ ದರ್ಪಣ f = −10 cm. ವಸ್ತು u = −30 cm. ಪ್ರತಿಬಿಂಬ ಎಲ್ಲಿ?'),
            options: [l3('v = −15 cm', 'v = −15 cm', 'v = −15 cm'), l3('v = +15 cm', 'v = +15 cm', 'v = +15 cm'), l3('v = −7.5 cm', 'v = −7.5 cm', 'v = −7.5 cm')],
            correct: 0,
            explain: l3('1/v = 1/f − 1/u = −1/10 + 1/30 = −1/15, so v = −15 cm (real, in front).', '1/v = 1/f − 1/u = −1/10 + 1/30 = −1/15, अतः v = −15 cm (वास्तविक, सामने)।', '1/v = 1/f − 1/u = −1/10 + 1/30 = −1/15, ಆದ್ದರಿಂದ v = −15 cm (ನೈಜ, ಮುಂದೆ).'),
          },
          {
            q: l3('Where should an object be placed to get a same-size image?', 'समान आकार का प्रतिबिंब पाने के लिए वस्तु कहाँ रखें?', 'ಅದೇ ಗಾತ್ರದ ಪ್ರತಿಬಿಂಬಕ್ಕೆ ವಸ್ತು ಎಲ್ಲಿ ಇಡಬೇಕು?'),
            options: [l3('At F', 'F पर', 'F ನಲ್ಲಿ'), l3('At C', 'C पर', 'C ನಲ್ಲಿ'), l3('Between F and P', 'F और P के बीच', 'F ಮತ್ತು P ನಡುವೆ')],
            correct: 1,
            explain: l3('At C, v = u, so m = −1: inverted, same size.', 'C पर v = u, इसलिए m = −1: उल्टा, समान आकार।', 'C ನಲ್ಲಿ v = u, ಆದ್ದರಿಂದ m = −1: ತಲೆಕೆಳಗು, ಅದೇ ಗಾತ್ರ.'),
          },
          {
            q: l3('A dentist\'s mirror gives an enlarged, upright view. The tooth is…', 'दंत चिकित्सक का दर्पण बड़ा, सीधा दृश्य देता है। दाँत होता है…', 'ದಂತವೈದ್ಯರ ಕನ್ನಡಿ ದೊಡ್ಡ, ನೇರ ನೋಟ ಕೊಡುತ್ತದೆ. ಹಲ್ಲು…'),
            options: [l3('Beyond C', 'C से परे', 'C ಆಚೆ'), l3('Between F and P', 'F और P के बीच', 'F ಮತ್ತು P ನಡುವೆ'), l3('At F', 'F पर', 'F ನಲ್ಲಿ')],
            correct: 1,
            explain: l3('Only an object inside F gives a virtual, erect, magnified image.', 'केवल F के भीतर की वस्तु आभासी, सीधा, बड़ा प्रतिबिंब देती है।', 'F ಒಳಗಿನ ವಸ್ತು ಮಾತ್ರ ಮಿಥ್ಯ, ನೇರ, ದೊಡ್ಡ ಪ್ರತಿಬಿಂಬ ಕೊಡುತ್ತದೆ.'),
          },
        ]
      : [
          {
            q: l3('A convex mirror always forms an image that is…', 'उत्तल दर्पण हमेशा ऐसा प्रतिबिंब बनाता है जो…', 'ಪೀನ ದರ್ಪಣ ಯಾವಾಗಲೂ ರೂಪಿಸುವ ಪ್ರತಿಬಿಂಬ…'),
            options: [l3('Real and inverted', 'वास्तविक और उल्टा', 'ನೈಜ ಮತ್ತು ತಲೆಕೆಳಗು'), l3('Virtual, erect and diminished', 'आभासी, सीधा और छोटा', 'ಮಿಥ್ಯ, ನೇರ ಮತ್ತು ಚಿಕ್ಕದು'), l3('Virtual and magnified', 'आभासी और बड़ा', 'ಮಿಥ್ಯ ಮತ್ತು ದೊಡ್ಡದು')],
            correct: 1,
            explain: l3('Reflected rays always diverge, and m is between 0 and 1.', 'परावर्तित किरणें हमेशा फैलती हैं, और m 0 और 1 के बीच है।', 'ಪ್ರತಿಫಲಿತ ಕಿರಣಗಳು ಯಾವಾಗಲೂ ಹರಡುತ್ತವೆ, m 0 ಮತ್ತು 1 ನಡುವೆ.'),
          },
          {
            q: l3('Convex mirror f = +15 cm, object at u = −30 cm. Find v.', 'उत्तल दर्पण f = +15 cm, वस्तु u = −30 cm। v ज्ञात करें।', 'ಪೀನ ದರ್ಪಣ f = +15 cm, ವಸ್ತು u = −30 cm. v ಕಂಡುಹಿಡಿಯಿರಿ.'),
            options: [l3('+10 cm', '+10 cm', '+10 cm'), l3('−10 cm', '−10 cm', '−10 cm'), l3('+30 cm', '+30 cm', '+30 cm')],
            correct: 0,
            explain: l3('1/v = 1/15 + 1/30 = 3/30, so v = +10 cm (behind the mirror).', '1/v = 1/15 + 1/30 = 3/30, अतः v = +10 cm (दर्पण के पीछे)।', '1/v = 1/15 + 1/30 = 3/30, ಆದ್ದರಿಂದ v = +10 cm (ದರ್ಪಣದ ಹಿಂದೆ).'),
          },
          {
            q: l3('Why are convex mirrors used as rear-view mirrors?', 'उत्तल दर्पण पीछे देखने वाले दर्पण के रूप में क्यों उपयोग होते हैं?', 'ಹಿಂಬದಿ ನೋಟದ ಕನ್ನಡಿಯಾಗಿ ಪೀನ ದರ್ಪಣ ಏಕೆ?'),
            options: [l3('They make things look bigger', 'वे चीज़ें बड़ी दिखाते हैं', 'ವಸ್ತುಗಳನ್ನು ದೊಡ್ಡದಾಗಿ ತೋರಿಸುತ್ತವೆ'), l3('They show a wider field of view, upright', 'वे सीधा, अधिक चौड़ा दृश्य दिखाते हैं', 'ನೇರವಾದ, ವಿಶಾಲ ನೋಟ ತೋರಿಸುತ್ತವೆ'), l3('They form real images', 'वे वास्तविक प्रतिबिंब बनाते हैं', 'ನೈಜ ಪ್ರತಿಬಿಂಬ ರೂಪಿಸುತ್ತವೆ')],
            correct: 1,
            explain: l3('Diminished, erect images let the driver see a large area behind.', 'छोटे, सीधे प्रतिबिंब से चालक पीछे का बड़ा क्षेत्र देख पाता है।', 'ಚಿಕ್ಕ, ನೇರ ಪ್ರತಿಬಿಂಬದಿಂದ ಚಾಲಕ ಹಿಂದಿನ ದೊಡ್ಡ ಪ್ರದೇಶ ನೋಡಬಹುದು.'),
          },
        ],
  };
}

export const STATIONS: Record<StationId, StationDef> = {
  pendulum,
  torricelli,
  bernoulli,
  'concave-mirror': makeMirror('concave'),
  'convex-mirror': makeMirror('convex'),
};

/** exported for tests */
export const _physics = { agm, mirrorImage, bernoulliCalc };
