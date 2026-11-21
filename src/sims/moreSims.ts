import { AMBER, arrow, clamp, fmt, INK, l3, label, PAPER, PURPLE, RED, TEAL, type SimDef } from './simTypes';

/* ================= Calorimetry: method of mixtures ================= */
interface CalState { T1: number; T2: number; t: number; hist: number[][]; Q: number }
export const calorimetry: SimDef<CalState> = {
  id: 'calorimetry',
  title: l3('Mixing hot and cold (calorimetry)', 'गर्म और ठंडा मिलाना (ऊष्मामिति)', 'ಬಿಸಿ ಮತ್ತು ತಣ್ಣನೆ ಬೆರೆಸುವುದು (ಕ್ಯಾಲೊರಿಮೆಟ್ರಿ)'),
  formula: 'Q = m c ΔT   |   heat lost = heat gained   |   T_final = (m₁c₁T₁ + m₂c₂T₂) / (m₁c₁ + m₂c₂)',
  what: l3('A hot body is placed in cold water. Both temperatures move towards each other and meet at a final temperature.', 'गर्म वस्तु को ठंडे पानी में रखा जाता है। दोनों के ताप एक-दूसरे की ओर बढ़कर अंतिम ताप पर मिलते हैं।', 'ಬಿಸಿ ವಸ್ತುವನ್ನು ತಣ್ಣನೆಯ ನೀರಿನಲ್ಲಿ ಇಡಲಾಗುತ್ತದೆ. ಎರಡರ ತಾಪ ಪರಸ್ಪರ ಹತ್ತಿರ ಬಂದು ಅಂತಿಮ ತಾಪದಲ್ಲಿ ಸೇರುತ್ತವೆ.'),
  why: l3('Heat flows from hot to cold until the temperatures are equal. The heat the hot body loses is exactly the heat the cold water gains.', 'ऊष्मा गर्म से ठंडे की ओर तब तक बहती है जब तक ताप बराबर न हो जाएँ। गर्म वस्तु की खोई ऊष्मा ठीक ठंडे पानी की ली गई ऊष्मा के बराबर होती है।', 'ತಾಪ ಸಮವಾಗುವವರೆಗೆ ಶಾಖ ಬಿಸಿಯಿಂದ ತಣ್ಣನೆಗೆ ಹರಿಯುತ್ತದೆ. ಬಿಸಿ ವಸ್ತು ಕಳೆದ ಶಾಖ ತಣ್ಣನೆಯ ನೀರು ಪಡೆದ ಶಾಖಕ್ಕೆ ಸಮ.'),
  principle: l3('Principle of method of mixtures; conservation of energy.', 'मिश्रण विधि का सिद्धांत; ऊर्जा संरक्षण।', 'ಮಿಶ್ರಣ ವಿಧಾನದ ತತ್ವ; ಶಕ್ತಿ ಸಂರಕ್ಷಣೆ.'),
  whatIf: [
    l3('Water (high c) changes temperature slowly, so the final temperature is closer to the water’s.', 'जल (अधिक c) का ताप धीरे बदलता है, इसलिए अंतिम ताप जल के ताप के निकट रहता है।', 'ನೀರು (ಹೆಚ್ಚು c) ನಿಧಾನವಾಗಿ ತಾಪ ಬದಲಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಅಂತಿಮ ತಾಪ ನೀರಿನದಕ್ಕೆ ಹತ್ತಿರ.'),
    l3('A copper block (low c) cools down quickly and warms the water only a little.', 'तांबे का टुकड़ा (कम c) तेज़ी से ठंडा होता है और पानी को थोड़ा ही गर्म करता है।', 'ತಾಮ್ರದ ತುಂಡು (ಕಡಿಮೆ c) ಬೇಗ ತಣ್ಣಗಾಗಿ ನೀರನ್ನು ಸ್ವಲ್ಪ ಮಾತ್ರ ಬಿಸಿ ಮಾಡುತ್ತದೆ.'),
  ],
  params: [
    { key: 'sub', label: l3('Hot body is', 'गर्म वस्तु है', 'ಬಿಸಿ ವಸ್ತು'), min: 0, max: 2, step: 1, unit: '', def: 1, choices: [{ value: 0, label: l3('Water (4186)', 'जल (4186)', 'ನೀರು (4186)') }, { value: 1, label: l3('Copper (385)', 'तांबा (385)', 'ತಾಮ್ರ (385)') }, { value: 2, label: l3('Aluminium (900)', 'ऐल्युमिनियम (900)', 'ಅಲ್ಯೂಮಿನಿಯಂ (900)') }] },
    { key: 'm1', label: l3('Hot mass', 'गर्म का द्रव्यमान', 'ಬಿಸಿಯ ದ್ರವ್ಯರಾಶಿ'), min: 0.1, max: 1, step: 0.05, unit: 'kg', def: 0.4 },
    { key: 'T1', label: l3('Hot temperature', 'गर्म का ताप', 'ಬಿಸಿಯ ತಾಪ'), min: 40, max: 100, step: 5, unit: '°C', def: 90 },
    { key: 'm2', label: l3('Water mass', 'जल का द्रव्यमान', 'ನೀರಿನ ದ್ರವ್ಯರಾಶಿ'), min: 0.1, max: 1, step: 0.05, unit: 'kg', def: 0.5 },
    { key: 'T2', label: l3('Water temperature', 'जल का ताप', 'ನೀರಿನ ತಾಪ'), min: 0, max: 30, step: 1, unit: '°C', def: 20 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: '°C', series: [{ label: 'hot', color: RED, idx: 1 }, { label: 'water', color: TEAL, idx: 2 }] },
  init: (p) => ({ T1: p.T1, T2: p.T2, t: 0, hist: [[0, p.T1, p.T2]], Q: 0 }),
  step(s, p, dt) {
    const c1 = [4186, 385, 900][p.sub] ?? 385, C1 = p.m1 * c1, C2 = p.m2 * 4186, k = 60;
    const q = k * (s.T1 - s.T2) * dt;
    s.T1 -= q / C1; s.T2 += q / C2; s.Q += q; s.t += dt;
    const last = s.hist[s.hist.length - 1];
    if (s.t - last[0] > 0.1) s.hist.push([s.t, s.T1, s.T2]);
  },
  draw(c, s, p, w, h) {
    const col = (T: number) => `hsl(${220 - clamp((T / 100) * 220, 0, 220)} 80% 55%)`;
    const bw = Math.min(150, w * 0.32), by = h - 40, bh = 120;
    c.strokeStyle = INK; c.lineWidth = 3;
    const bx = w * 0.3 - bw / 2;
    c.fillStyle = col(s.T1); c.fillRect(bx, by - bh * 0.7, bw, bh * 0.7); c.strokeRect(bx, by - bh, bw, bh);
    label(c, `${fmt(s.T1, 1)} °C`, bx + bw / 2, by - bh - 8, INK, 14, 'center'); label(c, 'hot body', bx + bw / 2, by + 20, INK, 12, 'center');
    const cx = w * 0.7 - bw / 2;
    c.fillStyle = col(s.T2); c.fillRect(cx, by - bh * 0.75, bw, bh * 0.75); c.strokeRect(cx, by - bh, bw, bh);
    label(c, `${fmt(s.T2, 1)} °C`, cx + bw / 2, by - bh - 8, INK, 14, 'center'); label(c, 'water', cx + bw / 2, by + 20, INK, 12, 'center');
    const flow = Math.abs(s.T1 - s.T2) > 0.3;
    if (flow) arrow(c, bx + bw + 6, by - bh / 2, cx - 6, by - bh / 2, RED, 3 + Math.min(4, (s.T1 - s.T2) / 20));
    label(c, flow ? 'heat flows →' : 'equal temperature', w / 2, 24, flow ? RED : TEAL, 13, 'center');
  },
  readings: (s, p) => {
    const c1 = [4186, 385, 900][p.sub] ?? 385, C1 = p.m1 * c1, C2 = p.m2 * 4186, Tf = (C1 * p.T1 + C2 * p.T2) / (C1 + C2);
    return [
      { label: l3('Final temp (formula)', 'अंतिम ताप (सूत्र)', 'ಅಂತಿಮ ತಾಪ (ಸೂತ್ರ)'), value: `${fmt(Tf, 1)} °C` },
      { label: l3('Heat lost by hot', 'गर्म की खोई ऊष्मा', 'ಬಿಸಿ ಕಳೆದ ಶಾಖ'), value: `${fmt(C1 * (p.T1 - s.T1), 0)} J` },
      { label: l3('Heat gained by water', 'जल की ली ऊष्मा', 'ನೀರು ಪಡೆದ ಶಾಖ'), value: `${fmt(C2 * (s.T2 - p.T2), 0)} J` },
      { label: l3('Time', 'समय', 'ಸಮಯ'), value: `${fmt(s.t, 1)} s` },
    ];
  },
};

/* ================= Lens ================= */
const lensCalc = (kind: number, f: number, uAbs: number) => {
  const F = kind === 1 ? f : -f, u = -uAbs, inv = 1 / F + 1 / u;
  if (Math.abs(inv) < 1e-6) return { v: Infinity, m: Infinity, F, u };
  const v = 1 / inv;
  return { v, m: v / u, F, u };
};
export const lens: SimDef<Record<string, never>> = {
  id: 'lens',
  title: l3('Image formed by a lens', 'लेंस से प्रतिबिंब', 'ಮಸೂರದಿಂದ ಪ್ರತಿಬಿಂಬ'),
  formula: '1/v − 1/u = 1/f   |   m = v/u   |   P = 1/f (metres)',
  what: l3('An object stands in front of a lens. Two rays show where the image forms.', 'एक वस्तु लेंस के सामने है। दो किरणें दिखाती हैं कि प्रतिबिंब कहाँ बनता है।', 'ವಸ್ತು ಮಸೂರದ ಮುಂದೆ ಇದೆ. ಎರಡು ಕಿರಣಗಳು ಪ್ರತಿಬಿಂಬ ಎಲ್ಲಿ ಮೂಡುತ್ತದೆ ತೋರಿಸುತ್ತವೆ.'),
  why: l3('A convex lens bends rays towards each other so they can meet; a concave lens spreads them so they only seem to come from a point.', 'उत्तल लेंस किरणों को पास लाता है ताकि वे मिलें; अवतल लेंस उन्हें फैलाता है इसलिए वे केवल एक बिंदु से आती प्रतीत होती हैं।', 'ಪೀನ ಮಸೂರ ಕಿರಣಗಳನ್ನು ಒಂದಕ್ಕೊಂದು ಹತ್ತಿರ ತರುತ್ತದೆ; ನಿಮ್ನ ಮಸೂರ ಹರಡಿ ಒಂದು ಬಿಂದುವಿನಿಂದ ಬಂದಂತೆ ತೋರಿಸುತ್ತದೆ.'),
  principle: l3('Refraction through a lens; lens formula with the sign convention.', 'लेंस द्वारा अपवर्तन; चिह्न परिपाटी सहित लेंस सूत्र।', 'ಮಸೂರದ ಮೂಲಕ ವಕ್ರೀಭವನ; ಚಿಹ್ನೆ ಸಂಪ್ರದಾಯದೊಂದಿಗೆ ಮಸೂರ ಸೂತ್ರ.'),
  whatIf: [
    l3('Convex lens, object beyond 2f: a small, real, inverted image.', 'उत्तल लेंस, वस्तु 2f से दूर: छोटा, वास्तविक, उलटा प्रतिबिंब।', 'ಪೀನ ಮಸೂರ, ವಸ್ತು 2f ಗಿಂತ ದೂರ: ಚಿಕ್ಕ, ನೈಜ, ತಲೆಕೆಳಗಾದ ಪ್ರತಿಬಿಂಬ.'),
    l3('Convex lens, object inside f: a magnified, upright, virtual image (a magnifying glass).', 'उत्तल लेंस, वस्तु f के भीतर: बड़ा, सीधा, आभासी प्रतिबिंब (आवर्धक लेंस)।', 'ಪೀನ ಮಸೂರ, ವಸ್ತು f ಒಳಗೆ: ದೊಡ್ಡ, ನೇರ, ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ (ಭೂತಗನ್ನಡಿ).'),
    l3('A concave lens always gives a small, upright, virtual image.', 'अवतल लेंस सदैव छोटा, सीधा, आभासी प्रतिबिंब देता है।', 'ನಿಮ್ನ ಮಸೂರ ಯಾವಾಗಲೂ ಚಿಕ್ಕ, ನೇರ, ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ ನೀಡುತ್ತದೆ.'),
  ],
  params: [
    { key: 'kind', label: l3('Lens', 'लेंस', 'ಮಸೂರ'), min: 0, max: 1, step: 1, unit: '', def: 1, live: true, choices: [{ value: 1, label: l3('Convex', 'उत्तल', 'ಪೀನ') }, { value: 0, label: l3('Concave', 'अवतल', 'ನಿಮ್ನ') }] },
    { key: 'f', label: l3('Focal length f', 'फोकस दूरी f', 'ನಾಭಿದೂರ f'), min: 5, max: 30, step: 1, unit: 'cm', def: 10, live: true },
    { key: 'u', label: l3('Object distance', 'वस्तु की दूरी', 'ವಸ್ತು ದೂರ'), min: 3, max: 60, step: 1, unit: 'cm', def: 25, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const { v, m, F } = lensCalc(p.kind, p.f, p.u), ox = w / 2, oy = h / 2, sc = Math.min((w / 2 - 20) / 65, 7), ho = 4;
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(10, oy); c.lineTo(w - 10, oy); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(ox, oy - 78); c.lineTo(ox, oy + 78); c.stroke();
    const tip = p.kind === 1 ? 1 : -1;
    for (const d of [-78, 78]) { c.beginPath(); c.moveTo(ox, oy + d); c.lineTo(ox - 7, oy + d - Math.sign(d) * 10 * tip); c.moveTo(ox, oy + d); c.lineTo(ox + 7, oy + d - Math.sign(d) * 10 * tip); c.stroke(); }
    for (const q of [-1, 1]) { c.fillStyle = AMBER; c.beginPath(); c.arc(ox + q * p.f * sc, oy, 3.5, 0, 7); c.fill(); label(c, 'F', ox + q * p.f * sc, oy + 18, INK, 11, 'center'); }
    const ux = ox - p.u * sc, ty = oy - ho * sc;
    arrow(c, ux, oy, ux, ty, TEAL, 3);
    if (!isFinite(v)) { label(c, 'image at infinity', w / 2, 24, RED, 14, 'center'); return; }
    const ix = ox + v * sc, iy = oy - m * ho * sc;
    const real = v > 0;
    // ray 1: parallel to axis, then towards image tip
    c.lineWidth = 2; c.strokeStyle = RED;
    c.beginPath(); c.moveTo(ux, ty); c.lineTo(ox, ty); c.stroke();
    const d1x = ix - ox, d1y = iy - ty, far = w - ox - 10;
    const k1 = real ? (far / Math.max(1, d1x)) : (d1x < 0 ? far / Math.max(1, -d1x) : 1);
    if (real) { c.beginPath(); c.moveTo(ox, ty); c.lineTo(ox + d1x * Math.min(k1, 1.6), ty + d1y * Math.min(k1, 1.6)); c.stroke(); }
    else { const k = far / Math.max(1, Math.abs(d1x) + 1); c.beginPath(); c.moveTo(ox, ty); c.lineTo(ox + Math.abs(d1x) * k * Math.sign(-d1x || -1) * -1, ty + d1y * k * Math.sign(-d1x || -1) * -1); c.stroke(); c.setLineDash([5, 4]); c.beginPath(); c.moveTo(ox, ty); c.lineTo(ix, iy); c.stroke(); c.setLineDash([]); }
    // ray 2: through the optical centre
    c.strokeStyle = PURPLE; c.beginPath(); c.moveTo(ux, ty); c.lineTo(ox, oy); c.stroke();
    const sl = (ty - oy) / (ux - ox);
    if (real) { c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.min(far, Math.abs(v * sc) * 1.4), oy + sl * Math.min(far, Math.abs(v * sc) * 1.4)); c.stroke(); }
    else { c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + 90, oy + sl * 90); c.stroke(); c.setLineDash([5, 4]); c.beginPath(); c.moveTo(ox, oy); c.lineTo(ix, iy); c.stroke(); c.setLineDash([]); }
    // image arrow
    c.setLineDash(real ? [] : [5, 4]); arrow(c, ix, oy, ix, iy, AMBER, 3); c.setLineDash([]);
    label(c, `v = ${fmt(v, 1)} cm   m = ${fmt(m, 2)}`, 12, 22);
  },
  readings: (s, p) => {
    const { v, m, F } = lensCalc(p.kind, p.f, p.u);
    const nat = !isFinite(v) ? '—' : `${v > 0 ? 'real' : 'virtual'}, ${m < 0 ? 'inverted' : 'upright'}, ${Math.abs(m) > 1.001 ? 'magnified' : Math.abs(m) < 0.999 ? 'diminished' : 'same size'}`;
    return [
      { label: l3('Image distance v', 'प्रतिबिंब दूरी v', 'ಪ್ರತಿಬಿಂಬ ದೂರ v'), value: isFinite(v) ? `${fmt(v, 1)} cm` : '∞' },
      { label: l3('Magnification m', 'आवर्धन m', 'ವರ್ಧನೆ m'), value: isFinite(m) ? fmt(m, 2) : '∞' },
      { label: l3('Power P', 'क्षमता P', 'ಸಾಮರ್ಥ್ಯ P'), value: `${fmt(100 / F, 1)} D` },
      { label: l3('Image', 'प्रतिबिंब', 'ಪ್ರತಿಬಿಂಬ'), value: nat },
    ];
  },
};

/* ================= Spherical mirror ================= */
export const mirror: SimDef<Record<string, never>> = {
  id: 'mirror',
  title: l3('Image in a spherical mirror', 'गोलीय दर्पण में प्रतिबिंब', 'ಗೋಳೀಯ ದರ್ಪಣದಲ್ಲಿ ಪ್ರತಿಬಿಂಬ'),
  formula: '1/v + 1/u = 1/f   |   m = −v/u   |   f = R/2',
  what: l3('An object stands in front of a curved mirror. Move it to see how the image changes.', 'एक वस्तु वक्र दर्पण के सामने है। उसे खिसकाकर देखें प्रतिबिंब कैसे बदलता है।', 'ವಸ್ತು ಬಾಗಿದ ದರ್ಪಣದ ಮುಂದೆ ಇದೆ. ಅದನ್ನು ಸರಿಸಿ ಪ್ರತಿಬಿಂಬ ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ ನೋಡಿ.'),
  why: l3('A concave mirror gathers light to a focus, so it can form real images; a convex mirror spreads light and gives a small virtual image.', 'अवतल दर्पण प्रकाश को फोकस पर इकट्ठा करता है, इसलिए वास्तविक प्रतिबिंब बना सकता है; उत्तल दर्पण प्रकाश फैलाता है और छोटा आभासी प्रतिबिंब देता है।', 'ನಿಮ್ನ ದರ್ಪಣ ಬೆಳಕನ್ನು ನಾಭಿಗೆ ಸೇರಿಸಿ ನೈಜ ಪ್ರತಿಬಿಂಬ ಮಾಡಬಲ್ಲದು; ಪೀನ ದರ್ಪಣ ಹರಡಿ ಚಿಕ್ಕ ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ ನೀಡುತ್ತದೆ.'),
  principle: l3('Laws of reflection and the mirror formula.', 'परावर्तन के नियम और दर्पण सूत्र।', 'ಪ್ರತಿಫಲನ ನಿಯಮ ಮತ್ತು ದರ್ಪಣ ಸೂತ್ರ.'),
  whatIf: [
    l3('Concave mirror with the object very close (inside f): an upright, magnified image — a shaving mirror.', 'अवतल दर्पण, वस्तु बहुत पास (f के भीतर): सीधा, बड़ा प्रतिबिंब — दाढ़ी का दर्पण।', 'ನಿಮ್ನ ದರ್ಪಣ, ವಸ್ತು ಬಹಳ ಹತ್ತಿರ (f ಒಳಗೆ): ನೇರ, ದೊಡ್ಡ ಪ್ರತಿಬಿಂಬ — ಕ್ಷೌರ ದರ್ಪಣ.'),
    l3('A convex mirror always gives a small upright image and a wide view — a vehicle rear-view mirror.', 'उत्तल दर्पण सदैव छोटा सीधा प्रतिबिंब और चौड़ा दृश्य देता है — वाहन का पश्च-दर्पण।', 'ಪೀನ ದರ್ಪಣ ಯಾವಾಗಲೂ ಚಿಕ್ಕ ನೇರ ಪ್ರತಿಬಿಂಬ ಮತ್ತು ವಿಶಾಲ ನೋಟ ನೀಡುತ್ತದೆ — ವಾಹನದ ಹಿನ್ನೋಟ ದರ್ಪಣ.'),
  ],
  params: [
    { key: 'kind', label: l3('Mirror', 'दर्पण', 'ದರ್ಪಣ'), min: 0, max: 1, step: 1, unit: '', def: 1, live: true, choices: [{ value: 1, label: l3('Concave', 'अवतल', 'ನಿಮ್ನ') }, { value: 0, label: l3('Convex', 'उत्तल', 'ಪೀನ') }] },
    { key: 'f', label: l3('Focal length |f|', 'फोकस दूरी |f|', 'ನಾಭಿದೂರ |f|'), min: 5, max: 30, step: 1, unit: 'cm', def: 10, live: true },
    { key: 'u', label: l3('Object distance', 'वस्तु की दूरी', 'ವಸ್ತು ದೂರ'), min: 3, max: 60, step: 1, unit: 'cm', def: 25, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    // New Cartesian: mirror at x = 0, object at u < 0. concave f < 0.
    const f = p.kind === 1 ? -p.f : p.f, u = -p.u, inv = 1 / f - 1 / u, ho = 4;
    const mx = w * 0.72, oy = h / 2, sc = Math.min((mx - 20) / 65, 7);
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(10, oy); c.lineTo(w - 10, oy); c.stroke();
    const R = Math.abs(2 * f) * sc;
    c.lineWidth = 4; c.beginPath();
    if (p.kind === 1) c.arc(mx + R, oy, R, Math.PI - 0.55, Math.PI + 0.55); else c.arc(mx - R, oy, R, -0.55, 0.55);
    c.stroke();
    label(c, 'F', mx + f * sc, oy + 18, INK, 11, 'center'); c.fillStyle = AMBER; c.beginPath(); c.arc(mx + f * sc, oy, 3.5, 0, 7); c.fill();
    const ux = mx + u * sc, ty = oy - ho * sc;
    arrow(c, ux, oy, ux, ty, TEAL, 3);
    if (Math.abs(inv) < 1e-6) { label(c, 'image at infinity', w / 2, 24, RED, 14, 'center'); return; }
    const v = 1 / inv, m = -v / u, ix = mx + v * sc, iy = oy - m * ho * sc, real = v < 0;
    c.lineWidth = 2;
    const draw = (col: string, ay: number) => {
      c.strokeStyle = col; c.beginPath(); c.moveTo(ux, ty); c.lineTo(mx, ay); c.stroke();
      if (real) { c.beginPath(); c.moveTo(mx, ay); c.lineTo(ix, iy); c.stroke(); }
      else { const dx = mx - ix, dy = ay - iy, k = (mx - 10) / Math.max(1, Math.abs(dx)); c.beginPath(); c.moveTo(mx, ay); c.lineTo(mx - dx * k, ay - dy * k); c.stroke(); c.setLineDash([5, 4]); c.beginPath(); c.moveTo(mx, ay); c.lineTo(ix, iy); c.stroke(); c.setLineDash([]); }
    };
    draw(RED, ty); // parallel ray
    c.strokeStyle = PURPLE; c.beginPath(); c.moveTo(ux, ty); c.lineTo(mx, oy); c.stroke(); // ray to the pole
    c.beginPath(); c.moveTo(mx, oy); if (real) c.lineTo(ix, iy); else { const dx = mx - ix, dy = oy - iy, k = (mx - 10) / Math.max(1, Math.abs(dx)); c.lineTo(mx - dx * k, oy - dy * k); } c.stroke();
    c.setLineDash(real ? [] : [5, 4]); arrow(c, ix, oy, ix, iy, AMBER, 3); c.setLineDash([]);
    label(c, `v = ${fmt(v, 1)} cm   m = ${fmt(m, 2)}`, 12, 22);
  },
  readings: (s, p) => {
    const f = p.kind === 1 ? -p.f : p.f, u = -p.u, inv = 1 / f - 1 / u;
    if (Math.abs(inv) < 1e-6) return [{ label: l3('Image', 'प्रतिबिंब', 'ಪ್ರತಿಬಿಂಬ'), value: '∞' }];
    const v = 1 / inv, m = -v / u;
    return [
      { label: l3('Image distance v', 'प्रतिबिंब दूरी v', 'ಪ್ರತಿಬಿಂಬ ದೂರ v'), value: `${fmt(v, 1)} cm` },
      { label: l3('Magnification m', 'आवर्धन m', 'ವರ್ಧನೆ m'), value: fmt(m, 2) },
      { label: l3('Radius of curvature', 'वक्रता त्रिज्या', 'ವಕ್ರತಾ ತ್ರಿಜ್ಯ'), value: `${fmt(2 * p.f, 0)} cm` },
      { label: l3('Image', 'प्रतिबिंब', 'ಪ್ರತಿಬಿಂಬ'), value: `${v < 0 ? 'real' : 'virtual'}, ${m < 0 ? 'inverted' : 'upright'}, ${Math.abs(m) > 1.001 ? 'magnified' : Math.abs(m) < 0.999 ? 'diminished' : 'same'}` },
    ];
  },
};

/* ================= Two plane mirrors ================= */
function reflectAcross(px: number, py: number, ang: number): [number, number] {
  const c2 = Math.cos(2 * ang), s2 = Math.sin(2 * ang);
  return [px * c2 + py * s2, px * s2 - py * c2];
}
export function mirrorImages(theta: number, phi: number): [number, number][] {
  const obj: [number, number] = [Math.cos(phi), Math.sin(phi)];
  const imgs: [number, number][] = [];
  const same = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;
  for (const first of [0, 1]) {
    let cur = obj, which = first;
    for (let i = 0; i < Math.round(360 / ((theta * 180) / Math.PI)) + 1; i++) {
      cur = reflectAcross(cur[0], cur[1], which === 0 ? 0 : theta);
      which = 1 - which;
      if (!same(cur, obj) && !imgs.some((q) => same(q, cur))) imgs.push(cur);
    }
  }
  return imgs;
}
export const twomirrors: SimDef<Record<string, never>> = {
  id: 'twomirrors',
  title: l3('Images in two plane mirrors', 'दो समतल दर्पणों में प्रतिबिंब', 'ಎರಡು ಸಮತಲ ದರ್ಪಣಗಳಲ್ಲಿ ಪ್ರತಿಬಿಂಬ'),
  formula: 'n = (360° / θ) − 1   (when 360°/θ is even)   |   images lie on a circle through the object',
  what: l3('An object stands between two mirrors at an angle θ. Every image is found by repeated reflection.', 'एक वस्तु θ कोण पर रखे दो दर्पणों के बीच है। प्रत्येक प्रतिबिंब बार-बार परावर्तन से मिलता है।', 'ವಸ್ತು θ ಕೋನದ ಎರಡು ದರ್ಪಣಗಳ ನಡುವೆ ಇದೆ. ಪ್ರತಿ ಪ್ರತಿಬಿಂಬ ಪದೇ ಪದೇ ಪ್ರತಿಫಲನದಿಂದ ಸಿಗುತ್ತದೆ.'),
  why: l3('Each mirror reflects the images made by the other, so a smaller angle gives more reflections and more images, all on one circle around the mirror hinge.', 'प्रत्येक दर्पण दूसरे के बनाए प्रतिबिंबों को परावर्तित करता है, इसलिए कम कोण पर अधिक प्रतिबिंब बनते हैं, सभी दर्पण-कब्ज़े के चारों ओर एक वृत्त पर।', 'ಪ್ರತಿ ದರ್ಪಣ ಇನ್ನೊಂದರ ಪ್ರತಿಬಿಂಬಗಳನ್ನು ಪ್ರತಿಫಲಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಕಡಿಮೆ ಕೋನ ಹೆಚ್ಚು ಪ್ರತಿಬಿಂಬ, ಎಲ್ಲವೂ ಒಂದೇ ವೃತ್ತದಲ್ಲಿ.'),
  principle: l3('Laws of reflection applied repeatedly.', 'परावर्तन के नियम बार-बार लगाना।', 'ಪ್ರತಿಫಲನ ನಿಯಮ ಪುನಃ ಪುನಃ ಅನ್ವಯ.'),
  whatIf: [
    l3('θ = 90° gives 3 images; θ = 60° gives 5; θ = 30° gives 11.', 'θ = 90° पर 3 प्रतिबिंब; θ = 60° पर 5; θ = 30° पर 11।', 'θ = 90° ಗೆ 3 ಪ್ರತಿಬಿಂಬ; θ = 60° ಗೆ 5; θ = 30° ಗೆ 11.'),
    l3('θ = 180° (mirrors in a line) gives one image — an ordinary plane mirror.', 'θ = 180° (दर्पण एक रेखा में) पर एक प्रतिबिंब — साधारण समतल दर्पण।', 'θ = 180° (ದರ್ಪಣ ಒಂದೇ ರೇಖೆಯಲ್ಲಿ) ಒಂದು ಪ್ರತಿಬಿಂಬ — ಸಾಮಾನ್ಯ ಸಮತಲ ದರ್ಪಣ.'),
  ],
  params: [
    { key: 'th', label: l3('Angle between mirrors θ', 'दर्पणों के बीच कोण θ', 'ದರ್ಪಣಗಳ ನಡುವಿನ ಕೋನ θ'), min: 30, max: 180, step: 1, unit: '°', def: 90, live: true, choices: [30, 36, 45, 60, 90, 180].map((v) => ({ value: v, label: l3(`${v}°`, `${v}°`, `${v}°`) })) },
    { key: 'pos', label: l3('Object position between mirrors', 'दर्पणों के बीच वस्तु की स्थिति', 'ದರ್ಪಣಗಳ ನಡುವೆ ವಸ್ತು ಸ್ಥಾನ'), min: 15, max: 85, step: 5, unit: '%', def: 35, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const th = (p.th * Math.PI) / 180, phi = th * (p.pos / 100), cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38;
    c.strokeStyle = 'rgba(23,50,77,0.25)'; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.setLineDash([]);
    c.strokeStyle = INK; c.lineWidth = 5;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * 1.25, cy); c.stroke();
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + R * 1.25 * Math.cos(th), cy - R * 1.25 * Math.sin(th)); c.stroke();
    mirrorImages(th, phi).forEach((q, i) => { c.fillStyle = AMBER; c.beginPath(); c.arc(cx + q[0] * R, cy - q[1] * R, 8, 0, 7); c.fill(); label(c, `${i + 1}`, cx + q[0] * R, cy - q[1] * R + 4, INK, 10, 'center'); });
    c.fillStyle = TEAL; c.beginPath(); c.arc(cx + R * Math.cos(phi), cy - R * Math.sin(phi), 9, 0, 7); c.fill();
    label(c, 'object', cx + R * Math.cos(phi) + 12, cy - R * Math.sin(phi), TEAL, 12);
  },
  readings: (s, p) => {
    const th = (p.th * Math.PI) / 180;
    return [
      { label: l3('Images counted', 'गिने गए प्रतिबिंब', 'ಎಣಿಸಿದ ಪ್ರತಿಬಿಂಬ'), value: `${mirrorImages(th, th * (p.pos / 100)).length}` },
      { label: l3('360°/θ − 1', '360°/θ − 1', '360°/θ − 1'), value: `${fmt(360 / p.th - 1, 0)}` },
    ];
  },
};

/* ================= Echo / speed of sound ================= */
interface EchoState { t: number }
export const echo: SimDef<EchoState> = {
  id: 'echo',
  title: l3('Echo and speed of sound', 'प्रतिध्वनि और ध्वनि की चाल', 'ಪ್ರತಿಧ್ವನಿ ಮತ್ತು ಧ್ವನಿಯ ವೇಗ'),
  formula: 'V = 331 + 0.6 T (m/s)   |   2d = V × t   |   echo heard if t ≥ 0.1 s (d ≥ 17 m)',
  what: l3('A clap travels to a wall and comes back. The animation is slowed down 20 times.', 'ताली दीवार तक जाकर लौटती है। एनिमेशन 20 गुना धीमा है।', 'ಚಪ್ಪಾಳೆ ಗೋಡೆಗೆ ಹೋಗಿ ಮರಳುತ್ತದೆ. ಅನಿಮೇಷನ್ 20 ಪಟ್ಟು ನಿಧಾನ.'),
  why: l3('Sound reflects from a hard wall. The sound travels 2d in total, so the echo arrives after t = 2d / V. Our ear keeps a sound for about 0.1 s, so a closer wall just blends in.', 'ध्वनि कठोर दीवार से परावर्तित होती है। ध्वनि कुल 2d चलती है, इसलिए प्रतिध्वनि t = 2d / V बाद आती है। कान ध्वनि को लगभग 0.1 s रखता है, इसलिए पास की दीवार से अलग नहीं सुनाई देती।', 'ಧ್ವನಿ ಗಟ್ಟಿ ಗೋಡೆಯಿಂದ ಪ್ರತಿಫಲಿಸುತ್ತದೆ. ಒಟ್ಟು 2d ಚಲಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಪ್ರತಿಧ್ವನಿ t = 2d / V ನಂತರ. ಕಿವಿ ಧ್ವನಿಯನ್ನು ಸುಮಾರು 0.1 s ಉಳಿಸುತ್ತದೆ, ಹತ್ತಿರದ ಗೋಡೆಯದು ಬೇರೆ ಕೇಳದು.'),
  principle: l3('Reflection of sound; speed = distance ÷ time.', 'ध्वनि का परावर्तन; चाल = दूरी ÷ समय।', 'ಧ್ವನಿಯ ಪ್ರತಿಫಲನ; ವೇಗ = ದೂರ ÷ ಸಮಯ.'),
  whatIf: [
    l3('Bring the wall closer than about 17 m: the echo blends with the original sound.', 'दीवार को लगभग 17 m से पास लाएँ: प्रतिध्वनि मूल ध्वनि में मिल जाती है।', 'ಗೋಡೆಯನ್ನು ಸುಮಾರು 17 m ಗಿಂತ ಹತ್ತಿರ ತನ್ನಿ: ಪ್ರತಿಧ್ವನಿ ಮೂಲ ಧ್ವನಿಯೊಂದಿಗೆ ಬೆರೆಯುತ್ತದೆ.'),
    l3('A hotter day makes sound a little faster, so the echo comes sooner.', 'गर्म दिन में ध्वनि थोड़ी तेज़ होती है, इसलिए प्रतिध्वनि जल्दी आती है।', 'ಹೆಚ್ಚು ಬಿಸಿ ದಿನ ಧ್ವನಿ ಸ್ವಲ್ಪ ವೇಗ, ಪ್ರತಿಧ್ವನಿ ಬೇಗ ಬರುತ್ತದೆ.'),
  ],
  params: [
    { key: 'd', label: l3('Distance to wall d', 'दीवार तक दूरी d', 'ಗೋಡೆಗೆ ದೂರ d'), min: 5, max: 200, step: 5, unit: 'm', def: 85 },
    { key: 'T', label: l3('Air temperature', 'वायु का ताप', 'ಗಾಳಿಯ ತಾಪ'), min: 0, max: 40, step: 1, unit: '°C', def: 20 },
  ],
  animated: true,
  init: () => ({ t: 0 }),
  step(s, p, dt) { const V = 331 + 0.6 * p.T, tot = (2 * p.d) / V; s.t += dt / 20; if (s.t > tot + 0.3 * 0) s.t = tot; },
  draw(c, s, p, w, h) {
    const V = 331 + 0.6 * p.T, tot = (2 * p.d) / V, xa = 50, xb = w - 60, y0 = h * 0.6, sc = (xb - xa);
    c.fillStyle = INK; c.fillRect(xb, y0 - 70, 14, 90);
    c.fillStyle = TEAL; c.beginPath(); c.arc(xa - 14, y0 - 18, 10, 0, 7); c.fill(); c.fillRect(xa - 20, y0 - 8, 12, 28);
    const dist = clamp(s.t * V, 0, 2 * p.d), x = dist <= p.d ? xa + (dist / p.d) * sc : xb - ((dist - p.d) / p.d) * sc;
    const back = dist > p.d;
    c.strokeStyle = back ? RED : AMBER; c.lineWidth = 3;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - (back ? -1 : 1) * i * 10, y0 - 22, 14 + i * 7, back ? Math.PI * 0.6 : -Math.PI * 0.4, back ? Math.PI * 1.4 : Math.PI * 0.4); c.stroke(); }
    c.strokeStyle = '#D8D0B8'; c.lineWidth = 1; c.beginPath(); c.moveTo(xa, y0 + 30); c.lineTo(xb, y0 + 30); c.stroke();
    label(c, `${p.d} m`, (xa + xb) / 2, y0 + 48, INK, 13, 'center');
    label(c, `t = ${fmt(s.t, 3)} s  (slow motion ÷20)`, 12, 22);
    if (s.t >= tot - 1e-6) label(c, tot >= 0.1 ? 'echo heard ✔' : 'echo blends in', w - 12, 22, tot >= 0.1 ? TEAL : RED, 13, 'right');
  },
  readings: (s, p) => {
    const V = 331 + 0.6 * p.T, tot = (2 * p.d) / V;
    return [
      { label: l3('Speed of sound', 'ध्वनि की चाल', 'ಧ್ವನಿಯ ವೇಗ'), value: `${fmt(V, 1)} m/s` },
      { label: l3('Echo time 2d/V', 'प्रतिध्वनि समय 2d/V', 'ಪ್ರತಿಧ್ವನಿ ಸಮಯ 2d/V'), value: `${fmt(tot, 3)} s` },
      { label: l3('Heard as echo?', 'क्या प्रतिध्वनि सुनाई देगी?', 'ಪ್ರತಿಧ್ವನಿ ಕೇಳುವುದೇ?'), value: tot >= 0.1 ? 'yes' : 'no (< 0.1 s)' },
    ];
  },
};

/* ================= Coulomb's law ================= */
export const coulomb: SimDef<Record<string, never>> = {
  id: 'coulomb',
  title: l3("Force between two charges (Coulomb's law)", 'दो आवेशों के बीच बल (कूलॉम का नियम)', 'ಎರಡು ಆವೇಶಗಳ ನಡುವಿನ ಬಲ (ಕೂಲಂಬ್ ನಿಯಮ)'),
  formula: 'F = k q₁ q₂ / r²   (k = 9 × 10⁹ N·m²/C²)   |   E = k q / r²',
  what: l3('Two charges attract or repel. The arrows show the force on each charge.', 'दो आवेश आकर्षित या प्रतिकर्षित करते हैं। तीर प्रत्येक आवेश पर बल दिखाते हैं।', 'ಎರಡು ಆವೇಶ ಆಕರ್ಷಿಸುತ್ತವೆ ಅಥವಾ ವಿಕರ್ಷಿಸುತ್ತವೆ. ಬಾಣಗಳು ಪ್ರತಿ ಆವೇಶದ ಮೇಲಿನ ಬಲ ತೋರಿಸುತ್ತವೆ.'),
  why: l3('Like charges repel and unlike charges attract. The force grows with the charges and falls quickly with distance (inverse square).', 'समान आवेश प्रतिकर्षित और विपरीत आकर्षित करते हैं। बल आवेशों के साथ बढ़ता और दूरी के साथ तेज़ी से घटता है (व्युत्क्रम वर्ग)।', 'ಸಮ ಆವೇಶ ವಿಕರ್ಷಿಸುತ್ತವೆ, ವಿರುದ್ಧ ಆಕರ್ಷಿಸುತ್ತವೆ. ಬಲ ಆವೇಶದೊಂದಿಗೆ ಹೆಚ್ಚಿ ದೂರದೊಂದಿಗೆ ವೇಗವಾಗಿ ಕಡಿಮೆ (ವ್ಯಸ್ತ ವರ್ಗ).'),
  principle: l3("Coulomb's law; Newton's third law (equal and opposite forces).", 'कूलॉम का नियम; न्यूटन का तीसरा नियम (बराबर और विपरीत बल)।', 'ಕೂಲಂಬ್ ನಿಯಮ; ನ್ಯೂಟನ್ ಮೂರನೇ ನಿಯಮ (ಸಮ ಮತ್ತು ವಿರುದ್ಧ ಬಲ).'),
  whatIf: [
    l3('Double the distance: the force becomes one-fourth.', 'दूरी दोगुनी करें: बल एक-चौथाई हो जाता है।', 'ದೂರ ಎರಡು ಪಟ್ಟು: ಬಲ ಕಾಲುಭಾಗ.'),
    l3('Make q₁ the opposite sign: attraction becomes repulsion.', 'q₁ का चिह्न उलटें: आकर्षण प्रतिकर्षण बन जाता है।', 'q₁ ಚಿಹ್ನೆ ಬದಲಿಸಿ: ಆಕರ್ಷಣೆ ವಿಕರ್ಷಣೆಯಾಗುತ್ತದೆ.'),
  ],
  params: [
    { key: 'q1', label: l3('Charge q₁', 'आवेश q₁', 'ಆವೇಶ q₁'), min: -5, max: 5, step: 0.5, unit: 'μC', def: 3, live: true },
    { key: 'q2', label: l3('Charge q₂', 'आवेश q₂', 'ಆವೇಶ q₂'), min: -5, max: 5, step: 0.5, unit: 'μC', def: -3, live: true },
    { key: 'r', label: l3('Distance r', 'दूरी r', 'ದೂರ r'), min: 0.1, max: 1, step: 0.05, unit: 'm', def: 0.4, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const F = (9e9 * Math.abs(p.q1 * p.q2) * 1e-12) / (p.r * p.r), cy = h / 2, gap = p.r * (w - 160), x1 = (w - gap) / 2, x2 = x1 + gap;
    const col = (q: number) => (q > 0 ? RED : q < 0 ? '#2563EB' : '#9AA5AB');
    const dir = p.q1 * p.q2 < 0 ? 1 : -1; // + = towards each other
    const len = clamp(Math.log10(F + 1) * 55, 6, 110);
    if (F > 0) { arrow(c, x1, cy - 40, x1 + dir * len, cy - 40, INK, 3); arrow(c, x2, cy - 40, x2 - dir * len, cy - 40, INK, 3); }
    for (const [x, q] of [[x1, p.q1], [x2, p.q2]] as const) {
      c.fillStyle = col(q); c.beginPath(); c.arc(x, cy, 18 + Math.abs(q) * 2, 0, 7); c.fill();
      label(c, q > 0 ? '+' : q < 0 ? '−' : '0', x, cy + 6, '#fff', 20, 'center'); label(c, `${q} μC`, x, cy + 48, INK, 12, 'center');
    }
    c.strokeStyle = '#D8D0B8'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x1, cy + 70); c.lineTo(x2, cy + 70); c.stroke(); c.setLineDash([]);
    label(c, `r = ${p.r} m`, w / 2, cy + 88, INK, 13, 'center');
  },
  readings: (s, p) => {
    const F = (9e9 * p.q1 * p.q2 * 1e-12) / (p.r * p.r);
    return [
      { label: l3('Force F', 'बल F', 'ಬಲ F'), value: `${fmt(Math.abs(F), 3)} N` },
      { label: l3('Type', 'प्रकार', 'ವಿಧ'), value: F === 0 ? '—' : F < 0 ? 'attraction' : 'repulsion' },
      { label: l3('Field of q₁ at q₂', 'q₂ पर q₁ का क्षेत्र', 'q₂ ನಲ್ಲಿ q₁ ಕ್ಷೇತ್ರ'), value: `${fmt(Math.abs(9e9 * p.q1 * 1e-6) / (p.r * p.r), 0)} N/C` },
    ];
  },
};

/* ================= RC circuit ================= */
interface RcState { t: number; hist: number[][] }
export const rc: SimDef<RcState> = {
  id: 'rc',
  title: l3('Capacitor charging and discharging', 'संधारित्र का आवेशन और विसर्जन', 'ಕೆಪಾಸಿಟರ್ ಚಾರ್ಜ್ ಮತ್ತು ಡಿಸ್ಚಾರ್ಜ್'),
  formula: 'τ = RC   |   charging: V = V₀(1 − e^(−t/τ))   |   discharging: V = V₀ e^(−t/τ)   |   U = ½CV²',
  what: l3('A capacitor charges through a resistor. The graph shows the voltage across it.', 'संधारित्र प्रतिरोधक से आवेशित होता है। ग्राफ़ उसके सिरों की वोल्टता दिखाता है।', 'ಕೆಪಾಸಿಟರ್ ರೋಧಕದ ಮೂಲಕ ಚಾರ್ಜ್ ಆಗುತ್ತದೆ. ನಕ್ಷೆ ಅದರ ಮೇಲಿನ ವೋಲ್ಟೇಜ್ ತೋರಿಸುತ್ತದೆ.'),
  why: l3('At first the current is large and charge piles up quickly; as the capacitor fills, its voltage opposes the battery and the current falls, so charging slows down.', 'आरंभ में धारा अधिक होती है और आवेश तेज़ी से जमा होता है; भरने पर उसकी वोल्टता बैटरी का विरोध करती है और धारा घटती है, इसलिए आवेशन धीमा होता है।', 'ಆರಂಭದಲ್ಲಿ ವಿದ್ಯುತ್ ಹೆಚ್ಚು, ಆವೇಶ ವೇಗವಾಗಿ ಸೇರುತ್ತದೆ; ತುಂಬಿದಂತೆ ಅದರ ವೋಲ್ಟೇಜ್ ಬ್ಯಾಟರಿಯನ್ನು ವಿರೋಧಿಸಿ ವಿದ್ಯುತ್ ಕಡಿಮೆ, ಚಾರ್ಜಿಂಗ್ ನಿಧಾನ.'),
  principle: l3('Time constant τ = RC: after one τ the capacitor reaches 63 % of the full voltage.', 'समय-नियतांक τ = RC: एक τ के बाद संधारित्र पूर्ण वोल्टता का 63 % पा लेता है।', 'ಕಾಲ ಸ್ಥಿರಾಂಕ τ = RC: ಒಂದು τ ನಂತರ ಕೆಪಾಸಿಟರ್ ಪೂರ್ಣ ವೋಲ್ಟೇಜ್‌ನ 63 % ತಲುಪುತ್ತದೆ.'),
  whatIf: [
    l3('A bigger R or C makes τ longer: slower charging.', 'बड़ा R या C τ को लंबा करता है: धीमा आवेशन।', 'ದೊಡ್ಡ R ಅಥವಾ C τ ಉದ್ದ ಮಾಡುತ್ತದೆ: ನಿಧಾನ ಚಾರ್ಜಿಂಗ್.'),
    l3('Switch to discharging: the voltage falls to 37 % after one τ.', 'विसर्जन चुनें: एक τ बाद वोल्टता 37 % रह जाती है।', 'ಡಿಸ್ಚಾರ್ಜ್ ಆರಿಸಿ: ಒಂದು τ ನಂತರ ವೋಲ್ಟೇಜ್ 37 %.'),
  ],
  params: [
    { key: 'mode', label: l3('Mode', 'स्थिति', 'ಸ್ಥಿತಿ'), min: 0, max: 1, step: 1, unit: '', def: 0, choices: [{ value: 0, label: l3('Charging', 'आवेशन', 'ಚಾರ್ಜ್') }, { value: 1, label: l3('Discharging', 'विसर्जन', 'ಡಿಸ್ಚಾರ್ಜ್') }] },
    { key: 'V0', label: l3('Battery voltage V₀', 'बैटरी वोल्टता V₀', 'ಬ್ಯಾಟರಿ ವೋಲ್ಟೇಜ್ V₀'), min: 1, max: 12, step: 1, unit: 'V', def: 6 },
    { key: 'R', label: l3('Resistance R', 'प्रतिरोध R', 'ರೋಧ R'), min: 1, max: 100, step: 1, unit: 'kΩ', def: 10 },
    { key: 'C', label: l3('Capacitance C', 'धारिता C', 'ಧಾರಣೆ C'), min: 10, max: 1000, step: 10, unit: 'μF', def: 100 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'V (V)', series: [{ label: 'V across C', color: TEAL, idx: 1 }], xMax: (s, p) => 5 * ((p.R * p.C) / 1000) },
  init: () => ({ t: 0, hist: [[0, 0, 0]] }),
  step(s, p, dt) {
    const tau = (p.R * p.C) / 1000;
    if (s.t > 5 * tau) return;
    s.t += dt * Math.max(1, tau / 2);
    const V = p.mode === 0 ? p.V0 * (1 - Math.exp(-s.t / tau)) : p.V0 * Math.exp(-s.t / tau);
    s.hist.push([s.t, V, 0]);
  },
  draw(c, s, p, w, h) {
    const tau = (p.R * p.C) / 1000, V = p.mode === 0 ? p.V0 * (1 - Math.exp(-s.t / tau)) : p.V0 * Math.exp(-s.t / tau), cx = w / 2;
    c.strokeStyle = INK; c.lineWidth = 3;
    c.strokeRect(w * 0.18, h * 0.22, w * 0.64, h * 0.56);
    c.fillStyle = PAPER; c.fillRect(w * 0.18 - 14, h * 0.4, 28, h * 0.2); c.fillRect(cx - 30, h * 0.22 - 8, 60, 16); c.fillRect(w * 0.82 - 14, h * 0.4, 28, h * 0.2);
    c.beginPath(); c.moveTo(w * 0.18 - 10, h * 0.44); c.lineTo(w * 0.18 + 10, h * 0.44); c.moveTo(w * 0.18 - 5, h * 0.54); c.lineTo(w * 0.18 + 5, h * 0.54); c.stroke(); label(c, 'V₀', w * 0.18 - 36, h * 0.5, INK, 12);
    c.beginPath(); c.moveTo(cx - 24, h * 0.22 + 0); for (let i = 0; i < 6; i++) c.lineTo(cx - 24 + i * 9.6 + 4.8, h * 0.22 + (i % 2 ? 8 : -8)); c.lineTo(cx + 24, h * 0.22); c.stroke(); label(c, 'R', cx, h * 0.22 - 14, INK, 12, 'center');
    const pw = 38;
    c.fillStyle = INK; c.fillRect(w * 0.82 - pw / 2, h * 0.42, pw, 4); c.fillRect(w * 0.82 - pw / 2, h * 0.56, pw, 4);
    c.fillStyle = `rgba(15,118,110,${0.15 + 0.7 * (V / p.V0)})`; c.fillRect(w * 0.82 - pw / 2 + 2, h * 0.46, pw - 4, h * 0.1 - 2);
    label(c, `C = ${p.C} μF`, w * 0.82, h * 0.72, INK, 12, 'center'); label(c, `${fmt(V, 2)} V`, w * 0.82, h * 0.36, TEAL, 14, 'center');
    label(c, `τ = RC = ${fmt(tau, 2)} s`, 12, 22);
  },
  readings: (s, p) => {
    const tau = (p.R * p.C) / 1000, V = p.mode === 0 ? p.V0 * (1 - Math.exp(-s.t / tau)) : p.V0 * Math.exp(-s.t / tau);
    const I = (p.mode === 0 ? p.V0 - V : V) / (p.R * 1000);
    return [
      { label: l3('Voltage on C', 'C पर वोल्टता', 'C ಮೇಲಿನ ವೋಲ್ಟೇಜ್'), value: `${fmt(V, 2)} V` },
      { label: l3('Current', 'धारा', 'ವಿದ್ಯುತ್'), value: `${fmt(I * 1000, 3)} mA` },
      { label: l3('Time constant τ', 'समय-नियतांक τ', 'ಕಾಲ ಸ್ಥಿರಾಂಕ τ'), value: `${fmt(tau, 2)} s` },
      { label: l3('Energy ½CV²', 'ऊर्जा ½CV²', 'ಶಕ್ತಿ ½CV²'), value: `${fmt(0.5 * p.C * 1e-6 * V * V * 1e6, 1)} μJ` },
    ];
  },
};

/* ================= Transformer ================= */
interface TrState { t: number }
export const transformer: SimDef<TrState> = {
  id: 'transformer',
  title: l3('Transformer', 'ट्रांसफ़ॉर्मर', 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್'),
  formula: 'Vs / Vp = Ns / Np   |   Vp Ip = Vs Is (ideal)',
  what: l3('AC in the primary coil makes AC in the secondary coil through a shared iron core.', 'प्राथमिक कुंडली में AC साझा लोहे की क्रोड से द्वितीयक कुंडली में AC बनाती है।', 'ಪ್ರಾಥಮಿಕ ಸುರುಳಿಯ AC ಹಂಚಿಕೆಯ ಕಬ್ಬಿಣದ ಕೋರ್ ಮೂಲಕ ದ್ವಿತೀಯ ಸುರುಳಿಯಲ್ಲಿ AC ಉಂಟುಮಾಡುತ್ತದೆ.'),
  why: l3('The changing current makes a changing magnetic field in the core; this induces a voltage in the secondary. More turns on the secondary give a higher voltage.', 'बदलती धारा क्रोड में बदलता चुंबकीय क्षेत्र बनाती है; यह द्वितीयक में वोल्टता प्रेरित करता है। द्वितीयक में अधिक फेरे अधिक वोल्टता देते हैं।', 'ಬದಲಾಗುವ ವಿದ್ಯುತ್ ಕೋರ್‌ನಲ್ಲಿ ಬದಲಾಗುವ ಕಾಂತ ಕ್ಷೇತ್ರ ಮಾಡುತ್ತದೆ; ಇದು ದ್ವಿತೀಯದಲ್ಲಿ ವೋಲ್ಟೇಜ್ ಪ್ರೇರಿಸುತ್ತದೆ. ದ್ವಿತೀಯದಲ್ಲಿ ಹೆಚ್ಚು ಸುತ್ತು ಹೆಚ್ಚು ವೋಲ್ಟೇಜ್.'),
  principle: l3('Electromagnetic induction (Faraday). Power in = power out for an ideal transformer.', 'विद्युत चुंबकीय प्रेरण (फैराडे)। आदर्श ट्रांसफ़ॉर्मर में निवेश शक्ति = निर्गत शक्ति।', 'ವಿದ್ಯುತ್ಕಾಂತೀಯ ಪ್ರೇರಣೆ (ಫ್ಯಾರಡೆ). ಆದರ್ಶ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ನಲ್ಲಿ ಒಳಹರಿವು ಶಕ್ತಿ = ಹೊರಹರಿವು ಶಕ್ತಿ.'),
  whatIf: [
    l3('Ns > Np: step-up (voltage rises, current falls).', 'Ns > Np: उच्चायी (वोल्टता बढ़ती, धारा घटती)।', 'Ns > Np: ಸ್ಟೆಪ್-ಅಪ್ (ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚು, ವಿದ್ಯುತ್ ಕಡಿಮೆ).'),
    l3('Ns < Np: step-down, like a phone charger.', 'Ns < Np: अपचायी, जैसे फ़ोन चार्जर।', 'Ns < Np: ಸ್ಟೆಪ್-ಡೌನ್, ಫೋನ್ ಚಾರ್ಜರ್‌ನಂತೆ.'),
  ],
  params: [
    { key: 'Vp', label: l3('Input voltage Vp (peak)', 'निवेश वोल्टता Vp (शिखर)', 'ಇನ್‌ಪುಟ್ ವೋಲ್ಟೇಜ್ Vp (ಗರಿಷ್ಠ)'), min: 10, max: 325, step: 5, unit: 'V', def: 325, live: true },
    { key: 'Np', label: l3('Primary turns Np', 'प्राथमिक फेरे Np', 'ಪ್ರಾಥಮಿಕ ಸುತ್ತು Np'), min: 50, max: 1000, step: 50, unit: '', def: 1000, live: true },
    { key: 'Ns', label: l3('Secondary turns Ns', 'द्वितीयक फेरे Ns', 'ದ್ವಿತೀಯ ಸುತ್ತು Ns'), min: 10, max: 2000, step: 10, unit: '', def: 100, live: true },
    { key: 'RL', label: l3('Load resistance', 'भार प्रतिरोध', 'ಲೋಡ್ ರೋಧ'), min: 5, max: 500, step: 5, unit: 'Ω', def: 50, live: true },
  ],
  animated: true,
  init: () => ({ t: 0 }),
  step(s, p, dt) { s.t += dt; },
  draw(c, s, p, w, h) {
    const cx = w / 2, cy = h * 0.42, cw = Math.min(260, w * 0.5), ch = 120;
    c.fillStyle = '#9AA5AB'; c.fillRect(cx - cw / 2, cy - ch / 2, cw, 18); c.fillRect(cx - cw / 2, cy + ch / 2 - 18, cw, 18); c.fillRect(cx - cw / 2, cy - ch / 2, 18, ch); c.fillRect(cx + cw / 2 - 18, cy - ch / 2, 18, ch);
    const coil = (x: number, n: number, col: string) => { const k = clamp(Math.round(n / 70), 2, 18); c.strokeStyle = col; c.lineWidth = 4; for (let i = 0; i < k; i++) { const y = cy - 44 + (i * 88) / Math.max(1, k - 1); c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 14, y + 4); c.stroke(); } };
    coil(cx - cw / 2 + 9, p.Np, TEAL); coil(cx + cw / 2 - 9, p.Ns, AMBER);
    label(c, `Np = ${p.Np}`, cx - cw / 2 + 9, cy - ch / 2 - 10, TEAL, 12, 'center'); label(c, `Ns = ${p.Ns}`, cx + cw / 2 - 9, cy - ch / 2 - 10, AMBER, 12, 'center');
    const wave = (x0: number, amp: number, col: string, name: string) => {
      const y0 = h * 0.82, aw = Math.min(120, w * 0.25); c.strokeStyle = '#D8D0B8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + aw, y0); c.stroke();
      c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath();
      for (let i = 0; i <= 80; i++) { const x = x0 + (i / 80) * aw, y = y0 - amp * Math.sin((i / 80) * 4 * Math.PI - s.t * 8); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      label(c, name, x0 + aw / 2, y0 + 42, col, 12, 'center');
    };
    const Vs = (p.Vp * p.Ns) / p.Np;
    wave(cx - cw / 2 - 20 - Math.min(120, w * 0.25) + 0, clamp((p.Vp / 325) * 40, 4, 40), TEAL, `Vp = ${p.Vp} V`);
    wave(cx + cw / 2 + 20, clamp((Vs / 325) * 40, 3, 52), AMBER, `Vs = ${fmt(Vs, 1)} V`);
  },
  readings: (s, p) => {
    const Vs = (p.Vp * p.Ns) / p.Np, Is = Vs / p.RL, Ip = (Vs * Is) / p.Vp;
    return [
      { label: l3('Secondary voltage', 'द्वितीयक वोल्टता', 'ದ್ವಿತೀಯ ವೋಲ್ಟೇಜ್'), value: `${fmt(Vs, 1)} V` },
      { label: l3('Type', 'प्रकार', 'ವಿಧ'), value: p.Ns > p.Np ? 'step-up' : p.Ns < p.Np ? 'step-down' : 'isolating' },
      { label: l3('Secondary current', 'द्वितीयक धारा', 'ದ್ವಿತೀಯ ವಿದ್ಯುತ್'), value: `${fmt(Is, 2)} A` },
      { label: l3('Primary current (ideal)', 'प्राथमिक धारा (आदर्श)', 'ಪ್ರಾಥಮಿಕ ವಿದ್ಯುತ್ (ಆದರ್ಶ)'), value: `${fmt(Ip, 2)} A` },
    ];
  },
};

/* ================= Radioactive decay ================= */
interface DecayState { alive: boolean[]; t: number; hist: number[][] }
export const decay: SimDef<DecayState> = {
  id: 'decay',
  title: l3('Radioactive decay and half-life', 'रेडियोधर्मी क्षय और अर्धायु', 'ವಿಕಿರಣಶೀಲ ಕ್ಷಯ ಮತ್ತು ಅರ್ಧಾಯುಷ್ಯ'),
  formula: 'N = N₀ (½)^(t / T½)   |   N = N₀ e^(−λt)   |   T½ = 0.693 / λ',
  what: l3('400 unstable atoms decay at random. Green atoms are still there, grey ones have decayed.', '400 अस्थिर परमाणु यादृच्छिक रूप से क्षय होते हैं। हरे परमाणु बचे हैं, धूसर क्षय हो चुके हैं।', '400 ಅಸ್ಥಿರ ಪರಮಾಣುಗಳು ಯಾದೃಚ್ಛಿಕವಾಗಿ ಕ್ಷಯಿಸುತ್ತವೆ. ಹಸಿರು ಉಳಿದಿವೆ, ಬೂದು ಕ್ಷಯಿಸಿವೆ.'),
  why: l3('Each atom has the same chance of decaying every second, but you cannot tell which one goes next. Over many atoms the count falls in a smooth pattern: half are left after every half-life.', 'प्रत्येक परमाणु के हर सेकंड क्षय की संभावना समान है, पर अगला कौन-सा होगा यह नहीं बता सकते। बहुत परमाणुओं में संख्या एक नियमित पैटर्न में घटती है: हर अर्धायु के बाद आधे बचते हैं।', 'ಪ್ರತಿ ಪರಮಾಣುವಿಗೂ ಪ್ರತಿ ಸೆಕೆಂಡ್ ಕ್ಷಯಿಸುವ ಅದೇ ಸಂಭವ, ಆದರೆ ಮುಂದೆ ಯಾವುದು ಎಂದು ಹೇಳಲಾಗದು. ಅನೇಕ ಪರಮಾಣುಗಳಲ್ಲಿ ಎಣಿಕೆ ನಿಯಮಿತ ಮಾದರಿಯಲ್ಲಿ ಇಳಿಯುತ್ತದೆ: ಪ್ರತಿ ಅರ್ಧಾಯುಷ್ಯಕ್ಕೆ ಅರ್ಧ ಉಳಿಯುತ್ತದೆ.'),
  principle: l3('Radioactive decay is random but statistically predictable; half-life.', 'रेडियोधर्मी क्षय यादृच्छिक पर सांख्यिकीय रूप से पूर्वानुमेय है; अर्धायु।', 'ವಿಕಿರಣಶೀಲ ಕ್ಷಯ ಯಾದೃಚ್ಛಿಕ ಆದರೆ ಸಾಂಖ್ಯಿಕವಾಗಿ ಊಹಿಸಬಹುದು; ಅರ್ಧಾಯುಷ್ಯ.'),
  whatIf: [
    l3('Press Reset several times: every run is a little different, but all follow the same curve.', 'कई बार रीसेट दबाएँ: हर बार थोड़ा अलग, पर सब एक ही वक्र पर।', 'ಹಲವು ಬಾರಿ ರೀಸೆಟ್ ಒತ್ತಿ: ಪ್ರತಿ ಬಾರಿ ಸ್ವಲ್ಪ ಬೇರೆ, ಆದರೆ ಎಲ್ಲವೂ ಒಂದೇ ವಕ್ರ.'),
    l3('A shorter half-life means the atoms decay faster.', 'कम अर्धायु का अर्थ है परमाणु तेज़ क्षय होते हैं।', 'ಕಡಿಮೆ ಅರ್ಧಾಯುಷ್ಯ ಎಂದರೆ ಪರಮಾಣು ವೇಗವಾಗಿ ಕ್ಷಯಿಸುತ್ತವೆ.'),
  ],
  params: [{ key: 'T', label: l3('Half-life T½', 'अर्धायु T½', 'ಅರ್ಧಾಯುಷ್ಯ T½'), min: 1, max: 10, step: 0.5, unit: 's', def: 3 }],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'atoms left', series: [{ label: 'simulation', color: TEAL, idx: 1 }, { label: 'N₀(½)^(t/T)', color: RED, idx: 2 }], xMax: (s, p) => 5 * p.T },
  init: (p) => ({ alive: Array(400).fill(true), t: 0, hist: [[0, 400, 400]] }),
  step(s, p, dt) {
    if (s.t > 5 * p.T) return;
    const pr = 1 - Math.pow(0.5, dt / p.T);
    for (let i = 0; i < s.alive.length; i++) if (s.alive[i] && Math.random() < pr) s.alive[i] = false;
    s.t += dt;
    const last = s.hist[s.hist.length - 1];
    if (s.t - last[0] > 0.1) s.hist.push([s.t, s.alive.filter(Boolean).length, 400 * Math.pow(0.5, s.t / p.T)]);
  },
  draw(c, s, p, w, h) {
    const cols = 20, cell = Math.min((w - 30) / cols, (h - 40) / 20), x0 = (w - cols * cell) / 2, y0 = 30;
    s.alive.forEach((a, i) => { c.fillStyle = a ? TEAL : '#C9CFD3'; c.beginPath(); c.arc(x0 + (i % cols) * cell + cell / 2, y0 + Math.floor(i / cols) * cell + cell / 2, cell * 0.36, 0, 7); c.fill(); });
    label(c, `t = ${fmt(s.t, 1)} s  (${fmt(s.t / p.T, 1)} half-lives)`, 12, 20);
  },
  readings: (s, p) => {
    const N = s.alive.filter(Boolean).length;
    return [
      { label: l3('Atoms left', 'बचे परमाणु', 'ಉಳಿದ ಪರಮಾಣು'), value: `${N}` },
      { label: l3('Expected N₀(½)^(t/T)', 'अपेक्षित N₀(½)^(t/T)', 'ನಿರೀಕ್ಷಿತ N₀(½)^(t/T)'), value: fmt(400 * Math.pow(0.5, s.t / p.T), 0) },
      { label: l3('Fraction left', 'बचा अंश', 'ಉಳಿದ ಭಾಗ'), value: `${fmt((N / 400) * 100, 0)} %` },
      { label: l3('λ = 0.693/T½', 'λ = 0.693/T½', 'λ = 0.693/T½'), value: `${fmt(0.693 / p.T, 3)} /s` },
    ];
  },
};

/* ================= Diode I–V ================= */
export const diode: SimDef<Record<string, never>> = {
  id: 'diode',
  title: l3('p–n junction diode I–V curve', 'p–n संधि डायोड का I–V वक्र', 'p–n ಸಂಧಿ ಡಯೋಡ್ I–V ವಕ್ರ'),
  formula: 'I = I_s (e^(V / nV_T) − 1)  (model)   |   silicon knee ≈ 0.7 V',
  what: l3('Change the voltage across a silicon diode and see the current. The dot moves along the curve.', 'सिलिकन डायोड पर वोल्टता बदलें और धारा देखें। बिंदु वक्र पर चलता है।', 'ಸಿಲಿಕಾನ್ ಡಯೋಡ್ ಮೇಲಿನ ವೋಲ್ಟೇಜ್ ಬದಲಿಸಿ ವಿದ್ಯುತ್ ನೋಡಿ. ಚುಕ್ಕೆ ವಕ್ರದ ಮೇಲೆ ಚಲಿಸುತ್ತದೆ.'),
  why: l3('In forward bias the depletion region shrinks and, above the knee voltage, current rises very steeply. In reverse bias the region widens and only a tiny leakage current flows.', 'अग्र अभिनति में अवक्षय क्षेत्र घटता है और नी-वोल्टता से ऊपर धारा बहुत तेज़ी से बढ़ती है। पश्च अभिनति में क्षेत्र चौड़ा होता है और केवल बहुत छोटी क्षरण धारा बहती है।', 'ಮುಂಚೂಣಿ ಬಯಾಸ್‌ನಲ್ಲಿ ಕ್ಷೀಣ ಪ್ರದೇಶ ಕುಗ್ಗಿ, ಮಂಡಿ ವೋಲ್ಟೇಜ್ ಮೇಲೆ ವಿದ್ಯುತ್ ಕಡಿದಾಗಿ ಏರುತ್ತದೆ. ಹಿಮ್ಮುಖದಲ್ಲಿ ಪ್ರದೇಶ ಅಗಲವಾಗಿ ಬಹಳ ಸಣ್ಣ ಸೋರಿಕೆ ವಿದ್ಯುತ್ ಮಾತ್ರ.'),
  principle: l3('A diode conducts in one direction only, so it does not obey Ohm’s law. (The curve is an illustrative model, not a measurement.)', 'डायोड केवल एक दिशा में चालन करता है, इसलिए वह ओम के नियम का पालन नहीं करता। (वक्र एक उदाहरण मॉडल है, मापन नहीं।)', 'ಡಯೋಡ್ ಒಂದೇ ದಿಕ್ಕಿನಲ್ಲಿ ವಾಹಕ, ಆದ್ದರಿಂದ ಓಮ್ ನಿಯಮ ಪಾಲಿಸುವುದಿಲ್ಲ. (ವಕ್ರ ಒಂದು ಮಾದರಿ, ಅಳತೆಯಲ್ಲ.)'),
  whatIf: [
    l3('Below about 0.5 V the current is almost zero even in forward bias.', 'लगभग 0.5 V से नीचे अग्र अभिनति में भी धारा लगभग शून्य।', 'ಸುಮಾರು 0.5 V ಕೆಳಗೆ ಮುಂಚೂಣಿಯಲ್ಲೂ ವಿದ್ಯುತ್ ಬಹುತೇಕ ಸೊನ್ನೆ.'),
    l3('Make the voltage negative: the current stays near zero (reverse bias).', 'वोल्टता ऋणात्मक करें: धारा शून्य के पास रहती है (पश्च अभिनति)।', 'ವೋಲ್ಟೇಜ್ ಋಣ ಮಾಡಿ: ವಿದ್ಯುತ್ ಸೊನ್ನೆ ಬಳಿ (ಹಿಮ್ಮುಖ ಬಯಾಸ್).'),
  ],
  params: [{ key: 'V', label: l3('Voltage across diode V', 'डायोड पर वोल्टता V', 'ಡಯೋಡ್ ಮೇಲಿನ ವೋಲ್ಟೇಜ್ V'), min: -1, max: 0.85, step: 0.01, unit: 'V', def: 0.5, live: true }],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const Is = 1e-9, nVt = 1.8 * 0.02585, I = (v: number) => Is * (Math.exp(v / nVt) - 1) * 1000; // mA
    const L = 50, R = w - 20, T = 20, B = h - 36, X = (v: number) => L + ((v + 1) / 1.85) * (R - L), Imax = 30, Y = (i: number) => B - (clamp(i, -2, Imax) + 2) / (Imax + 2) * (B - T);
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
    c.strokeStyle = '#9AA5AB'; c.beginPath(); c.moveTo(X(0), T); c.lineTo(X(0), B); c.moveTo(L, Y(0)); c.lineTo(R, Y(0)); c.stroke();
    c.strokeStyle = TEAL; c.lineWidth = 3; c.beginPath();
    for (let v = -1; v <= 0.85; v += 0.01) { const x = X(v), y = Y(I(v)); v === -1 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
    const cur = I(p.V); c.fillStyle = RED; c.beginPath(); c.arc(X(p.V), Y(cur), 7, 0, 7); c.fill();
    label(c, 'V (V)', R - 4, B + 24, INK, 12, 'right'); label(c, 'I (mA)', L + 6, T + 10, INK, 12);
    label(c, '−1', X(-1), B + 16, '#4A3F66', 11, 'center'); label(c, '0', X(0), B + 16, '#4A3F66', 11, 'center'); label(c, '0.7', X(0.7), B + 16, '#4A3F66', 11, 'center');
    label(c, p.V > 0.5 ? 'forward bias: conducting' : p.V >= 0 ? 'forward bias: below knee' : 'reverse bias: blocking', w - 12, 22, p.V > 0.6 ? TEAL : INK, 13, 'right');
  },
  readings: (s, p) => {
    const i = 1e-9 * (Math.exp(p.V / (1.8 * 0.02585)) - 1) * 1000;
    return [
      { label: l3('Voltage V', 'वोल्टता V', 'ವೋಲ್ಟೇಜ್ V'), value: `${fmt(p.V, 2)} V` },
      { label: l3('Current I', 'धारा I', 'ವಿದ್ಯುತ್ I'), value: `${Math.abs(i) < 0.001 ? '≈ 0' : fmt(i, 2)} mA` },
      { label: l3('Bias', 'अभिनति', 'ಬಯಾಸ್'), value: p.V >= 0 ? 'forward' : 'reverse' },
    ];
  },
};

/* ================= Stress–strain (Hooke's law) ================= */
const MATS = [{ n: 'Steel', Y: 200e9, yield: 250e6 }, { n: 'Copper', Y: 120e9, yield: 70e6 }, { n: 'Aluminium', Y: 70e9, yield: 95e6 }];
export const hooke: SimDef<Record<string, never>> = {
  id: 'hooke',
  title: l3("Stretching a wire (Young's modulus)", 'तार खींचना (यंग गुणांक)', 'ತಂತಿ ಹಿಗ್ಗಿಸುವುದು (ಯಂಗ್ ಗುಣಾಂಕ)'),
  formula: 'stress = F / A   |   strain = ΔL / L   |   Y = stress / strain   |   ΔL = F L / (A Y)',
  what: l3('A 2 m wire of diameter 1 mm carries a load. The stretch is exaggerated 100× so you can see it.', '1 mm व्यास का 2 m तार भार उठाता है। खिंचाव को 100× बढ़ाकर दिखाया गया है।', '1 mm ವ್ಯಾಸದ 2 m ತಂತಿ ಭಾರ ಹೊರುತ್ತದೆ. ಹಿಗ್ಗುವಿಕೆಯನ್ನು 100× ಹೆಚ್ಚಿಸಿ ತೋರಿಸಲಾಗಿದೆ.'),
  why: l3('The wire’s atoms are pulled slightly apart. Within the elastic limit stress is proportional to strain; beyond it the wire stretches much more and does not fully return.', 'तार के परमाणु थोड़े दूर खिंचते हैं। प्रत्यास्थता सीमा के भीतर प्रतिबल, विकृति के समानुपाती है; उसके बाद तार बहुत अधिक खिंचता है और पूरी तरह लौटता नहीं।', 'ತಂತಿಯ ಪರಮಾಣುಗಳು ಸ್ವಲ್ಪ ದೂರ ಎಳೆಯಲ್ಪಡುತ್ತವೆ. ಸ್ಥಿತಿಸ್ಥಾಪಕ ಮಿತಿಯೊಳಗೆ ಒತ್ತಡ ವಿಕೃತಿಗೆ ಅನುಪಾತ; ಅದರ ನಂತರ ಬಹಳ ಹಿಗ್ಗಿ ಪೂರ್ತಿ ಮರಳುವುದಿಲ್ಲ.'),
  principle: l3("Hooke's law and Young's modulus. (Typical textbook values are used; real materials vary.)", 'हुक का नियम और यंग गुणांक। (पाठ्यपुस्तक के सामान्य मान प्रयुक्त हैं; वास्तविक पदार्थ भिन्न हो सकते हैं।)', 'ಹುಕ್ ನಿಯಮ ಮತ್ತು ಯಂಗ್ ಗುಣಾಂಕ. (ಸಾಮಾನ್ಯ ಪಠ್ಯಪುಸ್ತಕ ಮೌಲ್ಯ ಬಳಕೆ; ನಿಜ ವಸ್ತು ಬೇರೆ ಇರಬಹುದು.)'),
  whatIf: [
    l3('Steel stretches less than copper or aluminium for the same load: it has a larger Y.', 'समान भार पर स्टील तांबे या ऐल्युमिनियम से कम खिंचता है: उसका Y अधिक है।', 'ಅದೇ ಭಾರಕ್ಕೆ ಉಕ್ಕು ತಾಮ್ರ ಅಥವಾ ಅಲ್ಯೂಮಿನಿಯಂಗಿಂತ ಕಡಿಮೆ ಹಿಗ್ಗುತ್ತದೆ: ಅದರ Y ಹೆಚ್ಚು.'),
    l3('Increase the load past the elastic limit and the stretch grows much faster.', 'भार प्रत्यास्थता सीमा के पार बढ़ाएँ तो खिंचाव बहुत तेज़ी से बढ़ता है।', 'ಭಾರ ಸ್ಥಿತಿಸ್ಥಾಪಕ ಮಿತಿ ಮೀರಿ ಹೆಚ್ಚಿಸಿದರೆ ಹಿಗ್ಗುವಿಕೆ ಬಹಳ ವೇಗ.'),
  ],
  params: [
    { key: 'mat', label: l3('Material', 'पदार्थ', 'ವಸ್ತು'), min: 0, max: 2, step: 1, unit: '', def: 0, live: true, choices: [{ value: 0, label: l3('Steel', 'स्टील', 'ಉಕ್ಕು') }, { value: 1, label: l3('Copper', 'तांबा', 'ತಾಮ್ರ') }, { value: 2, label: l3('Aluminium', 'ऐल्युमिनियम', 'ಅಲ್ಯೂಮಿನಿಯಂ') }] },
    { key: 'F', label: l3('Load F', 'भार F', 'ಭಾರ F'), min: 0, max: 300, step: 5, unit: 'N', def: 100, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const m = MATS[p.mat], A = Math.PI * 0.5e-3 ** 2, stress = p.F / A, el = stress <= m.yield;
    const strain = el ? stress / m.Y : m.yield / m.Y + (stress - m.yield) / (m.Y / 40), dL = strain * 2;
    const x0 = 40, top = 20, len = 110 + dL * 100 * 90;
    c.fillStyle = INK; c.fillRect(x0 - 24, top - 8, 70, 8);
    c.strokeStyle = el ? TEAL : RED; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, top + Math.min(len, h - 90)); c.stroke();
    c.fillStyle = AMBER; c.fillRect(x0 - 16, top + Math.min(len, h - 90), 32, 24 + p.F / 15);
    label(c, `${p.F} N`, x0 + 24, top + Math.min(len, h - 90) + 18, INK, 12);
    // stress-strain plot
    const L = w * 0.42, R = w - 20, T = 24, B = h - 34, smax = 400e6, emax = 0.004;
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(L, T); c.lineTo(L, B); c.lineTo(R, B); c.stroke();
    c.strokeStyle = TEAL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(L, B);
    const ye = m.yield / m.Y, X = (e: number) => L + (clamp(e, 0, emax) / emax) * (R - L), Yp = (st: number) => B - (clamp(st, 0, smax) / smax) * (B - T);
    c.lineTo(X(ye), Yp(m.yield)); for (let st = m.yield; st <= smax; st += 5e6) c.lineTo(X(ye + (st - m.yield) / (m.Y / 40)), Yp(st)); c.stroke();
    c.fillStyle = RED; c.beginPath(); c.arc(X(strain), Yp(stress), 7, 0, 7); c.fill();
    label(c, 'strain →', R, B + 20, INK, 11, 'right'); label(c, 'stress', L + 6, T + 8, INK, 11);
    label(c, el ? 'elastic region' : 'beyond elastic limit', R, T + 4, el ? TEAL : RED, 13, 'right');
  },
  readings: (s, p) => {
    const m = MATS[p.mat], A = Math.PI * 0.5e-3 ** 2, stress = p.F / A, el = stress <= m.yield;
    const strain = el ? stress / m.Y : m.yield / m.Y + (stress - m.yield) / (m.Y / 40);
    return [
      { label: l3('Stress F/A', 'प्रतिबल F/A', 'ಒತ್ತಡ F/A'), value: `${fmt(stress / 1e6, 1)} MPa` },
      { label: l3('Strain', 'विकृति', 'ವಿಕೃತಿ'), value: fmt(strain, 5) },
      { label: l3('Extension ΔL', 'बढ़ाव ΔL', 'ಹಿಗ್ಗುವಿಕೆ ΔL'), value: `${fmt(strain * 2000, 3)} mm` },
      { label: l3("Young's modulus Y", 'यंग गुणांक Y', 'ಯಂಗ್ ಗುಣಾಂಕ Y'), value: `${fmt(m.Y / 1e9, 0)} GPa` },
    ];
  },
};

/* ================= Charged particle in a magnetic field ================= */
interface MagState { th: number }
const QM = [1.76e11, 9.58e7];
export const magforce: SimDef<MagState> = {
  id: 'magforce',
  title: l3('Charged particle in a magnetic field', 'चुंबकीय क्षेत्र में आवेशित कण', 'ಕಾಂತ ಕ್ಷೇತ್ರದಲ್ಲಿ ಆವೇಶಿತ ಕಣ'),
  formula: 'F = qvB   |   r = mv / (qB)   |   T = 2πm / (qB)',
  what: l3('A particle enters a magnetic field (pointing into the page, shown as ×). It moves in a circle. The motion is shown in slow motion.', 'एक कण चुंबकीय क्षेत्र (पृष्ठ के भीतर, × से दर्शित) में प्रवेश करता है। वह वृत्त में चलता है। गति धीमी करके दिखाई गई है।', 'ಕಣ ಕಾಂತ ಕ್ಷೇತ್ರಕ್ಕೆ (ಪುಟದ ಒಳಗೆ, × ಚಿಹ್ನೆ) ಪ್ರವೇಶಿಸುತ್ತದೆ. ವೃತ್ತದಲ್ಲಿ ಚಲಿಸುತ್ತದೆ. ಚಲನೆ ನಿಧಾನವಾಗಿ ತೋರಿಸಲಾಗಿದೆ.'),
  why: l3('The magnetic force is always at right angles to the velocity, so it changes the direction but not the speed. That keeps the particle moving in a circle.', 'चुंबकीय बल सदैव वेग के लंबवत होता है, इसलिए वह दिशा बदलता है, चाल नहीं। इससे कण वृत्त में चलता रहता है।', 'ಕಾಂತ ಬಲ ಯಾವಾಗಲೂ ವೇಗಕ್ಕೆ ಲಂಬ, ಆದ್ದರಿಂದ ದಿಕ್ಕು ಬದಲಿಸುತ್ತದೆ, ವೇಗವಲ್ಲ. ಇದರಿಂದ ಕಣ ವೃತ್ತದಲ್ಲಿ ಚಲಿಸುತ್ತದೆ.'),
  principle: l3('Lorentz force on a moving charge; the magnetic force does no work.', 'गतिमान आवेश पर लॉरेंज़ बल; चुंबकीय बल कार्य नहीं करता।', 'ಚಲಿಸುವ ಆವೇಶದ ಮೇಲೆ ಲಾರೆನ್ಜ್ ಬಲ; ಕಾಂತ ಬಲ ಕೆಲಸ ಮಾಡುವುದಿಲ್ಲ.'),
  whatIf: [
    l3('A stronger field B makes the circle smaller.', 'प्रबल क्षेत्र B वृत्त को छोटा करता है।', 'ಬಲವಾದ ಕ್ಷೇತ್ರ B ವೃತ್ತವನ್ನು ಚಿಕ್ಕದಾಗಿಸುತ್ತದೆ.'),
    l3('A faster particle makes a bigger circle but takes the same time for one turn.', 'तेज़ कण बड़ा वृत्त बनाता है पर एक चक्कर में उतना ही समय लेता है।', 'ವೇಗದ ಕಣ ದೊಡ್ಡ ವೃತ್ತ ಮಾಡುತ್ತದೆ ಆದರೆ ಒಂದು ಸುತ್ತಿಗೆ ಅದೇ ಸಮಯ.'),
    l3('A proton (heavier) circles in a much larger path than an electron.', 'प्रोटॉन (भारी) इलेक्ट्रॉन से बहुत बड़े पथ में घूमता है।', 'ಪ್ರೋಟಾನ್ (ಭಾರ) ಎಲೆಕ್ಟ್ರಾನ್‌ಗಿಂತ ಬಹಳ ದೊಡ್ಡ ಪಥದಲ್ಲಿ ಸುತ್ತುತ್ತದೆ.'),
  ],
  params: [
    { key: 'pt', label: l3('Particle', 'कण', 'ಕಣ'), min: 0, max: 1, step: 1, unit: '', def: 0, choices: [{ value: 0, label: l3('Electron', 'इलेक्ट्रॉन', 'ಎಲೆಕ್ಟ್ರಾನ್') }, { value: 1, label: l3('Proton', 'प्रोटॉन', 'ಪ್ರೋಟಾನ್') }] , live: true },
    { key: 'v', label: l3('Speed v', 'चाल v', 'ವೇಗ v'), min: 1, max: 10, step: 0.5, unit: '×10⁶ m/s', def: 4, live: true },
    { key: 'B', label: l3('Magnetic field B', 'चुंबकीय क्षेत्र B', 'ಕಾಂತ ಕ್ಷೇತ್ರ B'), min: 1, max: 50, step: 1, unit: 'mT', def: 10, live: true },
  ],
  animated: true,
  init: () => ({ th: 0 }),
  step(s, p, dt) {
    const T = (2 * Math.PI) / (QM[p.pt] * p.B * 1e-3), vis = clamp(2.5 * (T / 3.57e-9) ** 0.3, 1, 9);
    s.th += ((2 * Math.PI) / vis) * dt;
  },
  draw(c, s, p, w, h) {
    const cx = w / 2, cy = h / 2, r = (p.v * 1e6) / (QM[p.pt] * p.B * 1e-3), rr = clamp(Math.log10(r * 1000 + 1) * 40 + 14, 16, Math.min(w, h) * 0.42);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) label(c, '×', 30 + i * ((w - 60) / 8), 38 + j * ((h - 70) / 4), '#C9CFD3', 14, 'center');
    c.strokeStyle = 'rgba(15,118,110,0.5)'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.arc(cx, cy, rr, 0, 7); c.stroke(); c.setLineDash([]);
    const x = cx + rr * Math.cos(s.th), y = cy - rr * Math.sin(s.th);
    c.fillStyle = p.pt === 0 ? '#2563EB' : RED; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill();
    arrow(c, x, y, x - 36 * Math.cos(s.th), y + 36 * Math.sin(s.th), INK, 3);
    label(c, 'F →centre   (slow motion)', 12, 20);
  },
  readings: (s, p) => {
    const r = (p.v * 1e6) / (QM[p.pt] * p.B * 1e-3), T = (2 * Math.PI) / (QM[p.pt] * p.B * 1e-3);
    return [
      { label: l3('Radius r = mv/qB', 'त्रिज्या r = mv/qB', 'ತ್ರಿಜ್ಯ r = mv/qB'), value: r < 1 ? `${fmt(r * 1000, 2)} mm` : `${fmt(r, 2)} m` },
      { label: l3('Period T', 'आवर्तकाल T', 'ಆವರ್ತ ಕಾಲ T'), value: `${fmt(T * 1e9, 2)} ns` },
      { label: l3('Frequency', 'आवृत्ति', 'ಆವೃತ್ತಿ'), value: `${fmt(1 / T / 1e6, 1)} MHz` },
    ];
  },
};

/* ================= Electromagnetic spectrum ================= */
interface SpecState { t: number }
const BANDS: { n: string; hi: string; kn: string; max: number }[] = [
  { n: 'Gamma rays', hi: 'गामा किरणें', kn: 'ಗಾಮಾ ಕಿರಣ', max: 1e-11 },
  { n: 'X-rays', hi: 'X-किरणें', kn: 'X-ಕಿರಣ', max: 1e-8 },
  { n: 'Ultraviolet', hi: 'पराबैंगनी', kn: 'ನೇರಳಾತೀತ', max: 4e-7 },
  { n: 'Visible light', hi: 'दृश्य प्रकाश', kn: 'ಗೋಚರ ಬೆಳಕು', max: 7e-7 },
  { n: 'Infrared', hi: 'अवरक्त', kn: 'ಅತಿಗೆಂಪು', max: 1e-3 },
  { n: 'Microwaves', hi: 'सूक्ष्म तरंगें', kn: 'ಮೈಕ್ರೋವೇವ್', max: 0.1 },
  { n: 'Radio waves', hi: 'रेडियो तरंगें', kn: 'ರೇಡಿಯೋ ತರಂಗ', max: Infinity },
];
export const spectrum: SimDef<SpecState> = {
  id: 'spectrum',
  title: l3('Electromagnetic spectrum', 'विद्युत चुंबकीय स्पेक्ट्रम', 'ವಿದ್ಯುತ್ಕಾಂತೀಯ ವರ್ಣಪಟಲ'),
  formula: 'c = f λ   (c = 3 × 10⁸ m/s)   |   E = hc / λ = 1.24 µeV·m ÷ λ',
  what: l3('Slide the wavelength to move along the spectrum from gamma rays to radio waves. The wave on screen changes with it.', 'तरंगदैर्ध्य खिसकाकर गामा किरणों से रेडियो तरंगों तक स्पेक्ट्रम में चलें। स्क्रीन की तरंग भी बदलती है।', 'ತರಂಗಾಂತರ ಸರಿಸಿ ಗಾಮಾ ಕಿರಣದಿಂದ ರೇಡಿಯೋ ತರಂಗದವರೆಗೆ ವರ್ಣಪಟಲದಲ್ಲಿ ಚಲಿಸಿ. ಪರದೆಯ ತರಂಗ ಬದಲಾಗುತ್ತದೆ.'),
  why: l3('All these waves travel at the speed of light, so a longer wavelength means a lower frequency and a smaller photon energy.', 'ये सभी तरंगें प्रकाश की चाल से चलती हैं, इसलिए अधिक तरंगदैर्ध्य का अर्थ कम आवृत्ति और कम फोटॉन ऊर्जा है।', 'ಈ ಎಲ್ಲ ತರಂಗಗಳು ಬೆಳಕಿನ ವೇಗದಲ್ಲಿ ಚಲಿಸುತ್ತವೆ, ಆದ್ದರಿಂದ ಹೆಚ್ಚು ತರಂಗಾಂತರ ಎಂದರೆ ಕಡಿಮೆ ಆವೃತ್ತಿ ಮತ್ತು ಕಡಿಮೆ ಫೋಟಾನ್ ಶಕ್ತಿ.'),
  principle: l3('Electromagnetic waves: c = fλ. (Band limits shown are the usual approximate ones.)', 'विद्युत चुंबकीय तरंगें: c = fλ। (दिखाई गई सीमाएँ सामान्य सन्निकट हैं।)', 'ವಿದ್ಯುತ್ಕಾಂತೀಯ ತರಂಗ: c = fλ. (ತೋರಿಸಿದ ಮಿತಿಗಳು ಸಾಮಾನ್ಯ ಅಂದಾಜು.)'),
  whatIf: [
    l3('Set about 5 × 10⁻⁷ m: green visible light, frequency near 6 × 10¹⁴ Hz.', 'लगभग 5 × 10⁻⁷ m रखें: हरा दृश्य प्रकाश, आवृत्ति लगभग 6 × 10¹⁴ Hz।', 'ಸುಮಾರು 5 × 10⁻⁷ m ಇಡಿ: ಹಸಿರು ಗೋಚರ ಬೆಳಕು, ಆವೃತ್ತಿ ಸುಮಾರು 6 × 10¹⁴ Hz.'),
    l3('Set about 3 m: an FM radio wave at 100 MHz.', 'लगभग 3 m रखें: 100 MHz की FM रेडियो तरंग।', 'ಸುಮಾರು 3 m ಇಡಿ: 100 MHz FM ರೇಡಿಯೋ ತರಂಗ.'),
  ],
  params: [{ key: 'lg', label: l3('log₁₀(wavelength in metres)', 'log₁₀(तरंगदैर्ध्य मीटर में)', 'log₁₀(ತರಂಗಾಂತರ ಮೀಟರ್‌ನಲ್ಲಿ)'), min: -13, max: 3, step: 0.1, unit: '', def: -6.3, live: true }],
  animated: true,
  init: () => ({ t: 0 }),
  step(s, p, dt) { s.t += dt; },
  draw(c, s, p, w, h) {
    const lam = 10 ** p.lg, band = BANDS.find((b) => lam < b.max)!;
    const cols = ['#7C3AED', '#6366F1', '#8B5CF6', '#22C55E', '#DC2626', '#F97316', '#6D28D9'];
    const bw = (w - 40) / 7, bi = BANDS.indexOf(band);
    BANDS.forEach((b, i) => { c.fillStyle = cols[i]; c.globalAlpha = i === bi ? 1 : 0.35; c.fillRect(20 + i * bw, 20, bw - 3, 28); c.globalAlpha = 1; label(c, b.n.split(' ')[0], 20 + i * bw + bw / 2 - 1.5, 38, '#fff', 10, 'center'); });
    const mx = 20 + ((p.lg + 13) / 16) * (w - 40);
    c.fillStyle = INK; c.beginPath(); c.moveTo(mx, 56); c.lineTo(mx - 6, 66); c.lineTo(mx + 6, 66); c.fill();
    const cy = h * 0.65, visWl = clamp(8 + ((p.lg + 13) / 16) * 90, 8, 100), amp = 44;
    c.strokeStyle = cols[bi]; c.lineWidth = 3; c.beginPath();
    for (let x = 0; x <= w - 40; x += 2) { const y = cy - amp * Math.sin((x / visWl) * 2 * Math.PI - s.t * 6); x ? c.lineTo(20 + x, y) : c.moveTo(20, y); } c.stroke();
    label(c, band.n, w / 2, h - 12, cols[bi], 16, 'center');
  },
  readings: (s, p) => {
    const lam = 10 ** p.lg, f = 3e8 / lam, E = (6.626e-34 * f) / 1.602e-19;
    return [
      { label: l3('Wavelength', 'तरंगदैर्ध्य', 'ತರಂಗಾಂತರ'), value: `${lam.toExponential(2)} m` },
      { label: l3('Frequency', 'आवृत्ति', 'ಆವೃತ್ತಿ'), value: `${f.toExponential(2)} Hz` },
      { label: l3('Photon energy', 'फोटॉन ऊर्जा', 'ಫೋಟಾನ್ ಶಕ್ತಿ'), value: `${E.toExponential(2)} eV` },
      { label: l3('Band', 'बैंड', 'ಬ್ಯಾಂಡ್'), value: BANDS.find((b) => lam < b.max)!.n },
    ];
  },
};

export const MORE_SIMS = [calorimetry, lens, mirror, twomirrors, echo, coulomb, rc, transformer, decay, diode, hooke, magforce, spectrum];

/* ================= Magnet (dipole) in a magnetic field ================= */
interface DipState { th: number; w: number }
export const dipole: SimDef<DipState> = {
  id: 'dipole',
  title: l3('Bar magnet in a magnetic field', 'चुंबकीय क्षेत्र में छड़ चुंबक', 'ಕಾಂತ ಕ್ಷೇತ್ರದಲ್ಲಿ ಕಂಬಿ ಆಯಸ್ಕಾಂತ'),
  formula: 'τ = m B sin θ   |   U = − m B cos θ   |   oscillation: T = 2π √(I / mB)',
  what: l3('A small bar magnet is released at an angle to a uniform magnetic field. It turns and swings about the field direction, like a compass needle.', 'एक छोटा छड़ चुंबक एकसमान चुंबकीय क्षेत्र से कोण पर छोड़ा जाता है। वह कंपास की सुई की तरह घूमकर क्षेत्र की दिशा के आसपास झूलता है।', 'ಸಣ್ಣ ಕಂಬಿ ಆಯಸ್ಕಾಂತವನ್ನು ಏಕರೂಪ ಕಾಂತ ಕ್ಷೇತ್ರಕ್ಕೆ ಕೋನದಲ್ಲಿ ಬಿಡಲಾಗುತ್ತದೆ. ಅದು ದಿಕ್ಸೂಚಿ ಮುಳ್ಳಿನಂತೆ ತಿರುಗಿ ಕ್ಷೇತ್ರದ ದಿಕ್ಕಿನ ಸುತ್ತ ಓಲಾಡುತ್ತದೆ.'),
  why: l3('The field exerts a torque τ = mB sin θ that turns the magnet towards the field. It is largest at 90° and zero when aligned, so the magnet overshoots and swings, then settles because of friction.', 'क्षेत्र बलाघूर्ण τ = mB sin θ लगाता है जो चुंबक को क्षेत्र की ओर घुमाता है। यह 90° पर अधिकतम और संरेखित होने पर शून्य होता है, इसलिए चुंबक आगे निकलकर झूलता है और घर्षण से स्थिर हो जाता है।', 'ಕ್ಷೇತ್ರ τ = mB sin θ ಟಾರ್ಕ್ ಹಾಕಿ ಆಯಸ್ಕಾಂತವನ್ನು ಕ್ಷೇತ್ರದ ಕಡೆ ತಿರುಗಿಸುತ್ತದೆ. 90° ನಲ್ಲಿ ಗರಿಷ್ಠ, ಸಾಲುಗೊಂಡಾಗ ಸೊನ್ನೆ; ಆದ್ದರಿಂದ ಆಯಸ್ಕಾಂತ ಮೀರಿ ಓಲಾಡಿ ಘರ್ಷಣೆಯಿಂದ ನಿಲ್ಲುತ್ತದೆ.'),
  principle: l3('Torque on a magnetic dipole; the potential energy is lowest when the magnet points along the field.', 'चुंबकीय द्विध्रुव पर बलाघूर्ण; चुंबक क्षेत्र के अनुदिश होने पर स्थितिज ऊर्जा न्यूनतम।', 'ಕಾಂತ ದ್ವಿಧ್ರುವದ ಮೇಲೆ ಟಾರ್ಕ್; ಆಯಸ್ಕಾಂತ ಕ್ಷೇತ್ರದ ದಿಕ್ಕಿನಲ್ಲಿದ್ದಾಗ ಸ್ಥಿತಿಶಕ್ತಿ ಕನಿಷ್ಠ.'),
  whatIf: [
    l3('A stronger field makes the magnet swing faster.', 'प्रबल क्षेत्र चुंबक को तेज़ झुलाता है।', 'ಬಲವಾದ ಕ್ಷೇತ್ರ ಆಯಸ್ಕಾಂತವನ್ನು ವೇಗವಾಗಿ ಓಲಾಡಿಸುತ್ತದೆ.'),
    l3('Start at 180° (opposite the field): the torque is zero but unstable — a tiny push sends it round.', '180° (क्षेत्र के विपरीत) से शुरू करें: बलाघूर्ण शून्य पर अस्थायी साम्य — हल्का धक्का इसे घुमा देता है।', '180° (ಕ್ಷೇತ್ರಕ್ಕೆ ವಿರುದ್ಧ) ನಿಂದ ಆರಂಭಿಸಿ: ಟಾರ್ಕ್ ಸೊನ್ನೆ ಆದರೆ ಅಸ್ಥಿರ — ಸಣ್ಣ ತಳ್ಳುವಿಕೆ ಅದನ್ನು ತಿರುಗಿಸುತ್ತದೆ.'),
  ],
  params: [
    { key: 'm', label: l3('Magnetic moment m', 'चुंबकीय आघूर्ण m', 'ಕಾಂತ ಆಘೂರ್ಣ m'), min: 0.1, max: 2, step: 0.1, unit: 'A·m²', def: 1 },
    { key: 'B', label: l3('Field B', 'क्षेत्र B', 'ಕ್ಷೇತ್ರ B'), min: 0.1, max: 1, step: 0.05, unit: 'T', def: 0.5 },
    { key: 'a0', label: l3('Starting angle θ', 'आरंभिक कोण θ', 'ಆರಂಭಿಕ ಕೋನ θ'), min: 10, max: 170, step: 5, unit: '°', def: 80 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'θ (°)', series: [{ label: 'θ', color: TEAL, idx: 1 }] },
  init: (p) => ({ th: (p.a0 * Math.PI) / 180, w: 0, t: 0, hist: [] } as any),
  step(s: any, p, dt) {
    const I = 0.05, damp = 0.15;
    const acc = (th: number, w: number) => (-(p.m * p.B * Math.sin(th)) - damp * w) / I;
    const a0 = acc(s.th, s.w); s.th += s.w * dt + 0.5 * a0 * dt * dt; const a1 = acc(s.th, s.w + a0 * dt); s.w += 0.5 * (a0 + a1) * dt; s.t += dt;
    const last = s.hist[s.hist.length - 1];
    if (!last || s.t - last[0] > 0.03) { s.hist.push([s.t, (s.th * 180) / Math.PI]); if (s.hist.length > 400) s.hist.shift(); }
  },
  draw(c, s, p, w, h) {
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 7; i++) arrow(c, 30, 40 + i * ((h - 80) / 6), w - 30, 40 + i * ((h - 80) / 6), '#C9CFD3', 1.5);
    label(c, 'B →', w - 40, 26, '#7A858B', 13);
    c.save(); c.translate(cx, cy); c.rotate(-s.th);
    c.fillStyle = RED; c.fillRect(0, -14, 70, 28); c.fillStyle = '#2563EB'; c.fillRect(-70, -14, 70, 28);
    c.fillStyle = '#fff'; c.font = '700 16px system-ui'; c.textAlign = 'center'; c.fillText('N', 35, 6); c.fillText('S', -35, 6);
    c.restore();
    label(c, `θ = ${fmt((s.th * 180) / Math.PI, 1)}°`, 12, 22);
  },
  readings: (s: any, p) => [
    { label: l3('Torque τ = mB sin θ', 'बलाघूर्ण τ = mB sin θ', 'ಟಾರ್ಕ್ τ = mB sin θ'), value: `${fmt(p.m * p.B * Math.sin(s.th), 3)} N·m` },
    { label: l3('Potential energy', 'स्थितिज ऊर्जा', 'ಸ್ಥಿತಿಶಕ್ತಿ'), value: `${fmt(-p.m * p.B * Math.cos(s.th), 3)} J` },
    { label: l3('Max torque mB', 'अधिकतम बलाघूर्ण mB', 'ಗರಿಷ್ಠ ಟಾರ್ಕ್ mB'), value: `${fmt(p.m * p.B, 3)} N·m` },
  ],
};
MORE_SIMS.push(dipole);
