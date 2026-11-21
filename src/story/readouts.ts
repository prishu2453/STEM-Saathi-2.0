/** Live numbers shown next to the 3D experiment, computed from the same physics as the scene. */
import * as P from './physics';
import type { KitName, SceneState } from './Story3D';
import type { L3 } from './stories';
import type { Language } from '../types/stem';

const W = (en: string, hi: string, kn: string): L3 => ({ en, hi, kn });
const T = {
  u: W('Object distance u', 'वस्तु दूरी u', 'ವಸ್ತು ದೂರ u'),
  v: W('Image distance v', 'प्रतिबिंब दूरी v', 'ಪ್ರತಿಬಿಂಬ ದೂರ v'),
  f: W('Focal length f', 'फोकस दूरी f', 'ನಾಭಿ ದೂರ f'),
  m: W('Magnification m', 'आवर्धन m', 'ವರ್ಧನೆ m'),
  nature: W('Image', 'प्रतिबिंब', 'ಪ್ರತಿಬಿಂಬ'),
  real: W('real', 'वास्तविक', 'ನೈಜ'),
  virtual: W('virtual', 'आभासी', 'ಮಿಥ್ಯಾ'),
  erect: W('upright', 'सीधा', 'ನೇರ'),
  inverted: W('upside down', 'उल्टा', 'ತಲೆಕೆಳಗು'),
  enlarged: W('enlarged', 'बड़ा', 'ದೊಡ್ಡದು'),
  diminished: W('smaller', 'छोटा', 'ಚಿಕ್ಕದು'),
  same: W('same size', 'समान आकार', 'ಅದೇ ಗಾತ್ರ'),
  infinity: W('at infinity', 'अनंत पर', 'ಅನಂತದಲ್ಲಿ'),
  power: W('Power of lens P', 'लेंस की क्षमता P', 'ಮಸೂರದ ಸಾಮರ್ಥ್ಯ P'),
  i: W('Angle of incidence i', 'आपतन कोण i', 'ಪತನ ಕೋನ i'),
  r: W('Angle of reflection r', 'परावर्तन कोण r', 'ಪ್ರತಿಫಲನ ಕೋನ r'),
  rr: W('Angle of refraction r', 'अपवर्तन कोण r', 'ವಕ್ರೀಭವನ ಕೋನ r'),
  n: W('Refractive index n', 'अपवर्तनांक n', 'ವಕ್ರೀಭವನ ಸೂಚ್ಯಂಕ n'),
  speed: W('Speed of light inside', 'अंदर प्रकाश की चाल', 'ಒಳಗೆ ಬೆಳಕಿನ ವೇಗ'),
  shift: W('Sideways shift (3 cm slab)', 'पार्श्व विस्थापन (3 cm गुटका)', 'ಪಾರ್ಶ್ವ ಸ್ಥಳಾಂತರ (3 cm)'),
  devRed: W('Deviation of red', 'लाल का विचलन', 'ಕೆಂಪಿನ ವಿಚಲನ'),
  devViolet: W('Deviation of violet', 'बैंगनी का विचलन', 'ನೇರಳೆಯ ವಿಚಲನ'),
  eye: W('On the retina', 'रेटिना पर', 'ರೆಟಿನಾದ ಮೇಲೆ'),
  sharp: W('sharp image', 'साफ़ प्रतिबिंब', 'ಸ್ಪಷ್ಟ ಪ್ರತಿಬಿಂಬ'),
  blurry: W('blurry', 'धुंधला', 'ಮಸುಕು'),
  lensNeeded: W('Glasses needed', 'ज़रूरी चश्मा', 'ಬೇಕಾದ ಕನ್ನಡಕ'),
  concave: W('concave lens', 'अवतल लेंस', 'ನಿಮ್ನ ಮಸೂರ'),
  convex: W('convex lens', 'उत्तल लेंस', 'ಪೀನ ಮಸೂರ'),
  none: W('none', 'नहीं', 'ಇಲ್ಲ'),
  sun: W('Sun height', 'सूरज की ऊँचाई', 'ಸೂರ್ಯನ ಎತ್ತರ'),
  sky: W('Sky colour', 'आसमान का रंग', 'ಆಕಾಶದ ಬಣ್ಣ'),
  blue: W('blue', 'नीला', 'ನೀಲಿ'),
  orange: W('orange-red', 'नारंगी-लाल', 'ಕಿತ್ತಳೆ-ಕೆಂಪು'),
  V: W('Battery voltage V', 'बैटरी वोल्टेज V', 'ಬ್ಯಾಟರಿ ವೋಲ್ಟೇಜ್ V'),
  I: W('Current from battery I', 'बैटरी से धारा I', 'ಬ್ಯಾಟರಿಯಿಂದ ಪ್ರವಾಹ I'),
  Req: W('Total resistance R', 'कुल प्रतिरोध R', 'ಒಟ್ಟು ರೋಧ R'),
  Ptot: W('Power P = V × I', 'शक्ति P = V × I', 'ಪವರ್ P = V × I'),
  heat: W('Heat in 1 minute H = I²Rt', '1 मिनट में ऊष्मा H = I²Rt', '1 ನಿಮಿಷದಲ್ಲಿ ಉಷ್ಣ H = I²Rt'),
  VoverI: W('V ÷ I', 'V ÷ I', 'V ÷ I'),
  open: W('open circuit: no current', 'खुला परिपथ: धारा नहीं', 'ತೆರೆದ ಮಂಡಲ: ಪ್ರವಾಹವಿಲ್ಲ'),
  wire: W('Wire R = ρL/A', 'तार R = ρL/A', 'ತಂತಿ R = ρL/A'),
  current: W('Current', 'धारा', 'ಪ್ರವಾಹ'),
  force: W('Force on the rod', 'छड़ पर बल', 'ಸರಳಿನ ಮೇಲಿನ ಬಲ'),
  angle: W('Angle between I and B', 'I और B के बीच कोण', 'I ಮತ್ತು B ನಡುವಿನ ಕೋನ'),
  zero: W('zero', 'शून्य', 'ಸೊನ್ನೆ'),
  maxF: W('maximum', 'अधिकतम', 'ಗರಿಷ್ಠ'),
  load: W('Appliances on', 'चालू उपकरण', 'ಆನ್ ಇರುವ ಉಪಕರಣಗಳು'),
  houseI: W('Current I = P ÷ 220 V', 'धारा I = P ÷ 220 V', 'ಪ್ರವಾಹ I = P ÷ 220 V'),
  fuse: W('Fuse', 'फ़्यूज़', 'ಫ್ಯೂಸ್'),
  ok: W('OK', 'ठीक', 'ಸರಿ'),
  blown: W('BLOWN', 'उड़ गया', 'ಸುಟ್ಟಿದೆ'),
  field: W('Field around the wire', 'तार के चारों ओर क्षेत्र', 'ತಂತಿಯ ಸುತ್ತ ಕ್ಷೇತ್ರ'),
  acw: W('anticlockwise from above', 'ऊपर से वामावर्त', 'ಮೇಲಿನಿಂದ ಅಪ್ರದಕ್ಷಿಣ'),
  cw: W('clockwise from above', 'ऊपर से दक्षिणावर्त', 'ಮೇಲಿನಿಂದ ಪ್ರದಕ್ಷಿಣ'),
  noField: W('no field (no current)', 'क्षेत्र नहीं (धारा नहीं)', 'ಕ್ಷೇತ್ರವಿಲ್ಲ (ಪ್ರವಾಹವಿಲ್ಲ)'),
};

const n = (s: SceneState, k: string, d = 0) => (typeof s[k] === 'number' ? (s[k] as number) : d);
const st = (s: SceneState, k: string, d: string) => (typeof s[k] === 'string' ? (s[k] as string) : d);
const cm = (units: number) => `${(units * 10).toFixed(1)} cm`;

export function readouts(kit: KitName, s: SceneState, lang: Language): { label: string; value: string; warn?: boolean }[] {
  const L = (x: L3) => x[lang] || x.en;
  if (kit === 'optics') {
    const mode = st(s, 'mode', 'convex-lens');
    if (mode === 'reflection') return [{ label: L(T.i), value: `${Math.round(n(s, 'incidence', 30))}°` }, { label: L(T.r), value: `${Math.round(n(s, 'incidence', 30))}°` }];
    if (mode === 'plane-mirror') {
      const u = n(s, 'u', -3);
      return [{ label: L(T.u), value: cm(u) }, { label: L(T.v), value: cm(-u) }, { label: L(T.m), value: '+1' }, { label: L(T.nature), value: `${L(T.virtual)}, ${L(T.erect)}, ${L(T.same)}` }];
    }
    if (mode.endsWith('mirror') || mode.endsWith('lens')) {
      const kind = mode.endsWith('mirror') ? 'mirror' : 'lens';
      const fm = n(s, 'f', 1.5);
      const f = mode === 'concave-mirror' || mode === 'concave-lens' ? -fm : fm;
      const u = n(s, 'u', -3);
      const img = kind === 'mirror' ? P.mirrorImage(u, f) : P.lensImage(u, f);
      const d = P.describeImage(kind, img);
      const rows = [
        { label: L(T.u), value: cm(u) },
        { label: L(T.f), value: cm(f) },
        { label: L(T.v), value: img.atInfinity ? L(T.infinity) : cm(img.v) },
        { label: L(T.m), value: img.atInfinity ? '∞' : img.m.toFixed(2) },
        {
          label: L(T.nature),
          value: img.atInfinity
            ? L(T.infinity)
            : `${L(img.real ? T.real : T.virtual)}, ${L(d.erect ? T.erect : T.inverted)}, ${L(d.size === 'enlarged' ? T.enlarged : d.size === 'diminished' ? T.diminished : T.same)}`,
        },
      ];
      if (kind === 'lens') rows.push({ label: L(T.power), value: `${(1 / (f / 10)).toFixed(2)} D` });
      return rows;
    }
    if (mode === 'slab') {
      const i = n(s, 'incidence', 40);
      const ni = n(s, 'n', 1.5);
      const p = P.slabPath(i, ni);
      return [
        { label: L(T.i), value: `${Math.round(i)}°` },
        { label: L(T.rr), value: `${p.r.toFixed(1)}°` },
        { label: L(T.n), value: ni.toFixed(2) },
        { label: L(T.speed), value: `${(3 / ni).toFixed(2)} × 10⁸ m/s` },
        { label: L(T.shift), value: cm(p.shift) },
      ];
    }
    if (mode === 'prism') {
      const real = P.prismPaths(n(s, 'incidence', 45), 1);
      return [
        { label: L(T.i), value: `${Math.round(n(s, 'incidence', 45))}°` },
        { label: L(T.devRed), value: `${real.rays[real.rays.length - 1].deviation.toFixed(1)}°` },
        { label: L(T.devViolet), value: `${real.rays[0].deviation.toFixed(1)}°` },
      ];
    }
    if (mode === 'eye') {
      const defect = st(s, 'defect', 'none') as P.EyeDefect;
      const far = st(s, 'object', 'far') === 'far';
      const corrected = n(s, 'correction', 0) > 0.5;
      const sharp = defect === 'none' || corrected || (defect === 'myopia' && !far) || (defect === 'hypermetropia' && far);
      const need = defect === 'myopia' ? T.concave : defect === 'hypermetropia' ? T.convex : T.none;
      return [
        { label: L(T.eye), value: L(sharp ? T.sharp : T.blurry), warn: !sharp },
        { label: L(T.lensNeeded), value: L(need) },
      ];
    }
    const sun = n(s, 'sun', 60);
    return [
      { label: L(T.sun), value: `${Math.round(sun)}°` },
      { label: L(T.sky), value: L(sun < 15 ? T.orange : T.blue) },
    ];
  }
  if (kit === 'circuit') {
    const layout = st(s, 'layout', 'series') as 'series' | 'parallel';
    const count = Math.max(1, Math.min(3, Math.round(n(s, 'count', 1))));
    const load = st(s, 'load', 'bulb');
    const V = n(s, 'V', 6);
    const base = load === 'wire' ? P.wireResistance(n(s, 'wireL', 1), n(s, 'wireA', 1) * 0.5) : n(s, 'R', 6);
    const rs = Array.from({ length: count }, () => base);
    const blown = Math.round(n(s, 'blown', 0));
    const open = rs.map((_, i) => blown === i + 1);
    const off = n(s, 'switch', 1) < 0.5;
    const extra = st(s, 'voltmeter', 'none') === 'series' && layout === 'series' ? P.VOLTMETER_R : 0;
    const sol = off ? P.solveCircuit(V, rs, 'series', rs.map(() => true)) : P.solveCircuit(V, rs, layout, open, extra);
    const rows: { label: string; value: string; warn?: boolean }[] = [
      { label: L(T.V), value: `${V.toFixed(1)} V` },
      { label: L(T.I), value: sol.current < 1e-4 ? L(T.open) : `${sol.current.toFixed(2)} A`, warn: sol.current < 1e-4 },
      { label: L(T.Req), value: Number.isFinite(sol.req) ? `${sol.req >= 1e5 ? '≈ 1,000,000' : sol.req.toFixed(2)} Ω` : '∞' },
    ];
    if (sol.current > 1e-4) {
      rows.push({ label: L(T.VoverI), value: `${(V / sol.current).toFixed(2)} Ω` });
      rows.push({ label: L(T.Ptot), value: `${(V * sol.current).toFixed(1)} W` });
      if (load === 'heater') rows.push({ label: L(T.heat), value: `${(sol.current * sol.current * base * 60).toFixed(0)} J` });
    }
    if (load === 'wire') rows.push({ label: L(T.wire), value: `${base.toFixed(2)} Ω (L ${n(s, 'wireL', 1).toFixed(1)} m, A ${(n(s, 'wireA', 1) * 0.5).toFixed(2)} mm²)` });
    return rows;
  }
  const mode = st(s, 'mode', 'bar');
  const I = n(s, 'current', 0);
  if (mode === 'force') {
    const tilt = n(s, 'tilt', 0);
    const ang = 90 - tilt;
    const F = Math.abs(I) * Math.sin((ang * Math.PI) / 180);
    return [
      { label: L(T.current), value: `${I.toFixed(2)} A` },
      { label: L(T.angle), value: `${Math.round(ang)}°` },
      { label: L(T.force), value: F < 0.01 ? L(T.zero) : ang > 85 ? `${L(T.maxF)} (∝ I)` : `∝ I sin ${Math.round(ang)}°` },
    ];
  }
  if (mode === 'house') {
    const on = { bulb: n(s, 'bulb', 1), fan: n(s, 'fan', 0), heater: n(s, 'heater', 0), iron: n(s, 'iron', 0) };
    const fuse = n(s, 'fuse', 5);
    const fault = st(s, 'fault', 'none') as 'none' | 'short' | 'earth';
    const load = P.houseLoad(on, fuse, fault, n(s, 'earthing', 1) > 0.5);
    return [
      { label: L(T.load), value: `${load.watts} W` },
      { label: L(T.houseI), value: load.current > 900 ? '≫' : `${load.current.toFixed(1)} A` },
      { label: `${L(T.fuse)} ${fuse} A`, value: L(load.blown ? T.blown : T.ok), warn: load.blown },
    ];
  }
  if (mode === 'wire' || mode === 'solenoid')
    return [
      { label: L(T.current), value: `${I.toFixed(2)} A` },
      { label: L(T.field), value: Math.abs(I) < 0.05 ? L(T.noField) : L(I > 0 ? T.acw : T.cw) },
    ];
  return [];
}
