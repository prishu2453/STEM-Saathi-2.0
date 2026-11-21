import { AMBER, arrow, clamp, fmt, INK, l3, label, PURPLE, RED, TEAL, type SimDef } from './simTypes';

const G = 9.8;

/* ================= 1. Collision of two boxes ================= */
interface CollisionState { x1: number; x2: number; v1: number; v2: number; collided: boolean; t: number; p0: number; k0: number; hist: number[][] }
const boxW = (m: number) => 0.9 + 0.35 * Math.cbrt(m);
export const collision: SimDef<CollisionState> = {
  id: 'collision',
  title: l3('Collision of two boxes', 'दो डिब्बों की टक्कर', 'ಎರಡು ಪೆಟ್ಟಿಗೆಗಳ ಡಿಕ್ಕಿ'),
  formula: "m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′   |   e = (v₂′ − v₁′) / (v₁ − v₂)",
  what: l3('Two boxes slide on a smooth track and collide. Watch their speeds before and after.', 'दो डिब्बे चिकनी पटरी पर फिसलकर टकराते हैं। टक्कर से पहले और बाद की चाल देखें।', 'ಎರಡು ಪೆಟ್ಟಿಗೆಗಳು ನಯವಾದ ಹಳಿಯಲ್ಲಿ ಜಾರಿ ಡಿಕ್ಕಿ ಹೊಡೆಯುತ್ತವೆ. ಡಿಕ್ಕಿಯ ಮೊದಲು ಮತ್ತು ನಂತರದ ವೇಗ ನೋಡಿ.'),
  why: l3('No outside horizontal force acts, so the total momentum stays the same. Kinetic energy is conserved only if the collision is perfectly elastic (e = 1).', 'कोई बाह्य क्षैतिज बल नहीं लगता, इसलिए कुल संवेग वही रहता है। गतिज ऊर्जा तभी संरक्षित रहती है जब टक्कर पूर्ण प्रत्यास्थ (e = 1) हो।', 'ಯಾವುದೇ ಬಾಹ್ಯ ಅಡ್ಡ ಬಲ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಒಟ್ಟು ಸಂವೇಗ ಸ್ಥಿರ. ಡಿಕ್ಕಿ ಪೂರ್ಣ ಸ್ಥಿತಿಸ್ಥಾಪಕ (e = 1) ಆದರೆ ಮಾತ್ರ ಚಲನಶಕ್ತಿ ಸ್ಥಿರ.'),
  principle: l3('Conservation of linear momentum; coefficient of restitution.', 'रेखीय संवेग संरक्षण; प्रत्यानयन गुणांक।', 'ರೇಖೀಯ ಸಂವೇಗ ಸಂರಕ್ಷಣೆ; ಪುನಃಸ್ಥಾಪನೆ ಗುಣಾಂಕ.'),
  whatIf: [
    l3('Set e = 0: the boxes stick together and move with one speed; kinetic energy is lost.', 'e = 0 करें: डिब्बे चिपककर एक ही चाल से चलते हैं; गतिज ऊर्जा घटती है।', 'e = 0 ಮಾಡಿ: ಪೆಟ್ಟಿಗೆಗಳು ಅಂಟಿ ಒಂದೇ ವೇಗದಲ್ಲಿ ಚಲಿಸುತ್ತವೆ; ಚಲನಶಕ್ತಿ ನಷ್ಟ.'),
    l3('Equal masses with e = 1: they exchange velocities.', 'समान द्रव्यमान और e = 1: वे वेगों का आदान-प्रदान करते हैं।', 'ಸಮ ದ್ರವ್ಯರಾಶಿ ಮತ್ತು e = 1: ಅವು ವೇಗ ವಿನಿಮಯ ಮಾಡಿಕೊಳ್ಳುತ್ತವೆ.'),
    l3('A very heavy box hardly changes speed when it hits a light one.', 'बहुत भारी डिब्बे की चाल हल्के से टकराने पर लगभग नहीं बदलती।', 'ಬಹಳ ಭಾರದ ಪೆಟ್ಟಿಗೆ ಹಗುರದೊಂದಿಗೆ ಡಿಕ್ಕಿಯಾದರೂ ವೇಗ ಬಹುತೇಕ ಬದಲಾಗದು.'),
  ],
  params: [
    { key: 'm1', label: l3('Mass of box 1', 'डिब्बा 1 का द्रव्यमान', 'ಪೆಟ್ಟಿಗೆ 1 ದ್ರವ್ಯರಾಶಿ'), min: 1, max: 10, step: 0.5, unit: 'kg', def: 4 },
    { key: 'm2', label: l3('Mass of box 2', 'डिब्बा 2 का द्रव्यमान', 'ಪೆಟ್ಟಿಗೆ 2 ದ್ರವ್ಯರಾಶಿ'), min: 1, max: 10, step: 0.5, unit: 'kg', def: 2 },
    { key: 'v1', label: l3('Speed of box 1', 'डिब्बा 1 की चाल', 'ಪೆಟ್ಟಿಗೆ 1 ವೇಗ'), min: 0, max: 8, step: 0.5, unit: 'm/s', def: 5 },
    { key: 'v2', label: l3('Velocity of box 2 (− = towards box 1)', 'डिब्बा 2 का वेग (− = डिब्बा 1 की ओर)', 'ಪೆಟ್ಟಿಗೆ 2 ವೇಗ (− = ಪೆಟ್ಟಿಗೆ 1 ಕಡೆ)'), min: -6, max: 4, step: 0.5, unit: 'm/s', def: -1 },
    { key: 'e', label: l3('Restitution e (1 = elastic, 0 = sticks)', 'प्रत्यानयन e (1 = प्रत्यास्थ, 0 = चिपकना)', 'ಪುನಃಸ್ಥಾಪನೆ e (1 = ಸ್ಥಿತಿಸ್ಥಾಪಕ, 0 = ಅಂಟು)'), min: 0, max: 1, step: 0.05, unit: '', def: 1 },
  ],
  animated: true,
  init: (p) => ({ x1: 4, x2: 14, v1: p.v1, v2: p.v2, collided: false, t: 0, p0: p.m1 * p.v1 + p.m2 * p.v2, k0: 0.5 * p.m1 * p.v1 ** 2 + 0.5 * p.m2 * p.v2 ** 2, hist: [] }),
  step(s, p, dt) {
    if (s.t > 12) return;
    s.t += dt;
    s.x1 += s.v1 * dt;
    s.x2 += s.v2 * dt;
    const gap = s.x2 - boxW(p.m2) / 2 - (s.x1 + boxW(p.m1) / 2);
    if (!s.collided && gap <= 0 && s.v1 > s.v2) {
      const { m1, m2, e } = p;
      const u1 = s.v1, u2 = s.v2;
      s.v1 = ((m1 - e * m2) * u1 + (1 + e) * m2 * u2) / (m1 + m2);
      s.v2 = ((m2 - e * m1) * u2 + (1 + e) * m1 * u1) / (m1 + m2);
      s.collided = true;
      const overlap = -gap / 2;
      s.x1 -= overlap;
      s.x2 += overlap;
    }
  },
  draw(c, s, p, w, h) {
    const sc = w / 22, y0 = h * 0.6;
    c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, y0); c.lineTo(w, y0); c.stroke();
    for (const [x, m, v, col, name] of [[s.x1, p.m1, s.v1, TEAL, '1'], [s.x2, p.m2, s.v2, AMBER, '2']] as const) {
      const bw = boxW(m) * sc, bh = bw * 0.85;
      c.fillStyle = col; c.fillRect(x * sc - bw / 2, y0 - bh, bw, bh);
      label(c, `m${name}=${m} kg`, x * sc, y0 - bh - 8, INK, 12, 'center');
      if (Math.abs(v) > 0.05) arrow(c, x * sc, y0 - bh / 2, x * sc + v * 12, y0 - bh / 2, INK, 3);
    }
    label(c, `p = ${fmt(p.m1 * s.v1 + p.m2 * s.v2, 1)} kg·m/s`, 12, 22);
    label(c, s.collided ? 'after collision' : 'before collision', w - 12, 22, s.collided ? RED : TEAL, 13, 'right');
    if (s.t > 12) label(c, 'finished — press Reset to replay', w / 2, h - 14, INK, 12, 'center');
  },
  readings: (s, p) => {
    const pn = p.m1 * s.v1 + p.m2 * s.v2, kn = 0.5 * p.m1 * s.v1 ** 2 + 0.5 * p.m2 * s.v2 ** 2;
    return [
      { label: l3('Total momentum', 'कुल संवेग', 'ಒಟ್ಟು ಸಂವೇಗ'), value: `${fmt(pn, 2)} kg·m/s` },
      { label: l3('Momentum at start', 'आरंभिक संवेग', 'ಆರಂಭಿಕ ಸಂವೇಗ'), value: `${fmt(s.p0, 2)} kg·m/s` },
      { label: l3('Kinetic energy', 'गतिज ऊर्जा', 'ಚಲನಶಕ್ತಿ'), value: `${fmt(kn, 2)} J` },
      { label: l3('Energy lost', 'ऊर्जा हानि', 'ಶಕ್ತಿ ನಷ್ಟ'), value: `${fmt(s.k0 - kn, 2)} J` },
    ];
  },
};

/* ================= 2. Motion in a straight line ================= */
interface KinState { t: number; x: number; v: number; hist: number[][]; lo: number; hi: number }
export const kinematics: SimDef<KinState> = {
  id: 'kinematics',
  title: l3('Motion in a straight line', 'सरल रेखा में गति', 'ನೇರ ರೇಖೆಯಲ್ಲಿ ಚಲನೆ'),
  formula: 'v = u + at   |   s = ut + ½at²   |   v² = u² + 2as',
  what: l3('A car moves along a road. The graphs draw its position and velocity as time passes.', 'एक कार सड़क पर चलती है। ग्राफ़ समय के साथ उसकी स्थिति और वेग बनाते हैं।', 'ಕಾರು ರಸ್ತೆಯಲ್ಲಿ ಚಲಿಸುತ್ತದೆ. ನಕ್ಷೆಗಳು ಸಮಯದೊಂದಿಗೆ ಅದರ ಸ್ಥಾನ ಮತ್ತು ವೇಗ ಬರೆಯುತ್ತವೆ.'),
  why: l3('Acceleration changes the velocity steadily, and the changing velocity bends the position–time curve.', 'त्वरण वेग को लगातार बदलता है, और बदलता वेग स्थिति–समय वक्र को मोड़ता है।', 'ವೇಗೋತ್ಕರ್ಷ ವೇಗವನ್ನು ನಿರಂತರ ಬದಲಿಸುತ್ತದೆ, ಬದಲಾಗುವ ವೇಗ ಸ್ಥಾನ–ಸಮಯ ವಕ್ರವನ್ನು ಬಾಗಿಸುತ್ತದೆ.'),
  principle: l3('Equations of uniformly accelerated motion. Slope of x–t is velocity; slope of v–t is acceleration.', 'एकसमान त्वरित गति के समीकरण। x–t की ढाल वेग; v–t की ढाल त्वरण।', 'ಸಮ ವೇಗೋತ್ಕರ್ಷ ಚಲನೆಯ ಸಮೀಕರಣ. x–t ಇಳಿಜಾರು ವೇಗ; v–t ಇಳಿಜಾರು ವೇಗೋತ್ಕರ್ಷ.'),
  whatIf: [
    l3('a = 0 gives a straight x–t line (constant velocity).', 'a = 0 पर x–t सीधी रेखा (नियत वेग)।', 'a = 0 ಆದರೆ x–t ನೇರ ರೇಖೆ (ಸ್ಥಿರ ವೇಗ).'),
    l3('Negative a with positive u: the car slows, stops, then reverses.', 'धनात्मक u के साथ ऋणात्मक a: कार धीमी होती, रुकती और फिर उलटी चलती है।', 'ಧನ u ಜೊತೆ ಋಣ a: ಕಾರು ನಿಧಾನವಾಗಿ ನಿಂತು ಹಿಮ್ಮುಖ ಚಲಿಸುತ್ತದೆ.'),
  ],
  params: [
    { key: 'u', label: l3('Initial velocity u', 'प्रारंभिक वेग u', 'ಆರಂಭಿಕ ವೇಗ u'), min: -10, max: 20, step: 1, unit: 'm/s', def: 4 },
    { key: 'a', label: l3('Acceleration a', 'त्वरण a', 'ವೇಗೋತ್ಕರ್ಷ a'), min: -4, max: 4, step: 0.5, unit: 'm/s²', def: 2 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'x (m), v (m/s)', series: [{ label: 'x', color: TEAL, idx: 1 }, { label: 'v', color: AMBER, idx: 2 }], xMax: () => 10 },
  init(p) {
    let lo = 0, hi = 0;
    for (let t = 0; t <= 10; t += 0.1) { const x = p.u * t + 0.5 * p.a * t * t; lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return { t: 0, x: 0, v: p.u, hist: [[0, 0, p.u]], lo, hi };
  },
  step(s, p, dt) {
    if (s.t >= 10) return;
    s.t = Math.min(10, s.t + dt);
    s.x = p.u * s.t + 0.5 * p.a * s.t * s.t;
    s.v = p.u + p.a * s.t;
    const last = s.hist[s.hist.length - 1];
    if (s.t - last[0] >= 0.05) s.hist.push([s.t, s.x, s.v]);
  },
  draw(c, s, p, w, h) {
    const span = Math.max(10, s.hi - s.lo) * 1.15, lo = s.lo - (span - (s.hi - s.lo)) / 2;
    const X = (x: number) => 30 + ((x - lo) / span) * (w - 60), y0 = h * 0.62;
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(20, y0); c.lineTo(w - 20, y0); c.stroke();
    const step = span > 80 ? 20 : span > 40 ? 10 : 5;
    for (let m = Math.ceil(lo / step) * step; m <= lo + span; m += step) { c.beginPath(); c.moveTo(X(m), y0); c.lineTo(X(m), y0 + 8); c.stroke(); label(c, `${m}`, X(m), y0 + 22, '#4A3F66', 11, 'center'); }
    const cx = X(s.x);
    c.fillStyle = TEAL; c.fillRect(cx - 26, y0 - 26, 52, 18); c.fillStyle = AMBER; c.fillRect(cx - 14, y0 - 38, 28, 12);
    c.fillStyle = INK; c.beginPath(); c.arc(cx - 15, y0 - 6, 6, 0, 7); c.arc(cx + 15, y0 - 6, 6, 0, 7); c.fill();
    if (Math.abs(s.v) > 0.2) arrow(c, cx, y0 - 52, cx + clamp(s.v * 4, -80, 80), y0 - 52, RED, 3);
    label(c, `t = ${fmt(s.t, 1)} s`, 12, 22);
    if (s.t >= 10) label(c, 'finished — press Reset to replay', w - 12, 22, INK, 12, 'right');
  },
  readings: (s, p) => [
    { label: l3('Time', 'समय', 'ಸಮಯ'), value: `${fmt(s.t, 1)} s` },
    { label: l3('Position x', 'स्थिति x', 'ಸ್ಥಾನ x'), value: `${fmt(s.x, 1)} m` },
    { label: l3('Velocity v', 'वेग v', 'ವೇಗ v'), value: `${fmt(s.v, 1)} m/s` },
    { label: l3('Check v²−u²', 'जाँच v²−u²', 'ಪರೀಕ್ಷೆ v²−u²'), value: `${fmt(s.v * s.v - p.u * p.u, 1)} = 2as ${fmt(2 * p.a * s.x, 1)}` },
  ],
};

/* ================= 3. Block on a rough incline (friction) ================= */
interface InclineState { s: number; v: number }
export const incline: SimDef<InclineState> = {
  id: 'incline',
  title: l3('Friction on an incline', 'आनत तल पर घर्षण', 'ಇಳಿಜಾರಿನಲ್ಲಿ ಘರ್ಷಣೆ'),
  formula: 'f ≤ μₛN   |   N = mg cos θ   |   slides when tan θ > μₛ   |   a = g(sin θ − μₖ cos θ)',
  what: l3('A block rests on a tilted board. Raise the angle and see when it starts to slide.', 'एक ब्लॉक झुके तख्ते पर रखा है। कोण बढ़ाएँ और देखें कब फिसलना शुरू होता है।', 'ಬ್ಲಾಕ್ ವಾಲಿದ ಹಲಗೆಯ ಮೇಲಿದೆ. ಕೋನ ಹೆಚ್ಚಿಸಿ ಯಾವಾಗ ಜಾರಲು ಆರಂಭಿಸುತ್ತದೆ ನೋಡಿ.'),
  why: l3('Gravity pulls the block down the slope with mg sin θ; friction (up to μₛN) holds it back. When mg sin θ exceeds the maximum friction, it slides.', 'गुरुत्व ब्लॉक को ढलान पर mg sin θ से खींचता है; घर्षण (अधिकतम μₛN) उसे रोकता है। mg sin θ अधिकतम घर्षण से अधिक होने पर वह फिसलता है।', 'ಗುರುತ್ವ ಇಳಿಜಾರಿನ ಉದ್ದಕ್ಕೆ mg sin θ ಎಳೆಯುತ್ತದೆ; ಘರ್ಷಣೆ (ಗರಿಷ್ಠ μₛN) ತಡೆಯುತ್ತದೆ. mg sin θ ಗರಿಷ್ಠ ಘರ್ಷಣೆ ಮೀರಿದಾಗ ಜಾರುತ್ತದೆ.'),
  principle: l3("Newton's laws and the laws of friction; angle of repose tan θ = μₛ.", 'न्यूटन के नियम और घर्षण के नियम; विराम कोण tan θ = μₛ।', 'ನ್ಯೂಟನ್ ನಿಯಮ ಮತ್ತು ಘರ್ಷಣೆ ನಿಯಮ; ವಿರಾಮ ಕೋನ tan θ = μₛ.'),
  whatIf: [
    l3('The block starts sliding exactly when tan θ passes μₛ — the mass does not matter.', 'ब्लॉक ठीक तब फिसलता है जब tan θ, μₛ से अधिक हो — द्रव्यमान से फ़र्क नहीं पड़ता।', 'tan θ, μₛ ಮೀರಿದಾಗಲೇ ಬ್ಲಾಕ್ ಜಾರುತ್ತದೆ — ದ್ರವ್ಯರಾಶಿ ಮುಖ್ಯವಲ್ಲ.'),
    l3('A rougher surface (larger μₛ) needs a steeper slope.', 'अधिक खुरदरी सतह (अधिक μₛ) पर अधिक तीखी ढलान चाहिए।', 'ಹೆಚ್ಚು ಒರಟು ಮೇಲ್ಮೈಗೆ (ಹೆಚ್ಚು μₛ) ಹೆಚ್ಚು ಕಡಿದಾದ ಇಳಿಜಾರು ಬೇಕು.'),
  ],
  params: [
    { key: 'theta', label: l3('Angle θ', 'कोण θ', 'ಕೋನ θ'), min: 0, max: 60, step: 1, unit: '°', def: 15, live: true },
    { key: 'mu', label: l3('Friction coefficient μₛ', 'घर्षण गुणांक μₛ', 'ಘರ್ಷಣೆ ಗುಣಾಂಕ μₛ'), min: 0.05, max: 1, step: 0.05, unit: '', def: 0.5, live: true },
    { key: 'm', label: l3('Mass', 'द्रव्यमान', 'ದ್ರವ್ಯರಾಶಿ'), min: 1, max: 10, step: 1, unit: 'kg', def: 2, live: true },
  ],
  animated: true,
  init: () => ({ s: 0, v: 0 }),
  step(s, p, dt) {
    const th = (p.theta * Math.PI) / 180, muk = 0.8 * p.mu;
    if (s.v === 0 && Math.tan(th) <= p.mu) return;
    const a = G * (Math.sin(th) - muk * Math.cos(th));
    s.v += a * dt;
    if (s.v < 0) s.v = 0;
    s.s = Math.min(3, s.s + s.v * dt);
    if (s.s >= 3) s.v = 0;
  },
  draw(c, s, p, w, h) {
    const th = (p.theta * Math.PI) / 180, L = Math.min(w * 0.7, 360), bx = 40, by = h - 40;
    const tx = bx + L * Math.cos(th), ty = by - L * Math.sin(th);
    c.fillStyle = '#E7DDFB'; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.lineTo(tx, by); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.stroke();
    c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, by); c.stroke();
    const d = L * 0.15 + (s.s / 3) * L * 0.7, px = bx + d * Math.cos(th), py = by - d * Math.sin(th);
    c.save(); c.translate(px, py); c.rotate(-th);
    c.fillStyle = TEAL; c.fillRect(-22, -36, 44, 36);
    c.restore();
    const cx = px - 18 * Math.sin(th), cy = py - 18 * Math.cos(th);
    const W = p.m * G, sc = 1.4;
    arrow(c, cx, cy, cx, cy + W * sc * 0.5, INK, 3);
    const stat = s.v === 0 && Math.tan(th) <= p.mu;
    const f = stat ? W * Math.sin(th) : 0.8 * p.mu * W * Math.cos(th);
    arrow(c, cx, cy, cx - f * sc * 0.5 * Math.cos(th), cy + f * sc * 0.5 * Math.sin(th), RED, 3);
    label(c, 'mg', cx + 6, cy + W * sc * 0.5, INK, 12);
    label(c, 'f', cx - f * sc * 0.5 * Math.cos(th) - 12, cy + f * sc * 0.5 * Math.sin(th), RED, 12);
    label(c, `θ = ${p.theta}°   tan θ = ${fmt(Math.tan(th), 2)}   μₛ = ${p.mu}`, 12, 22);
    label(c, stat ? 'at rest' : 'sliding', w - 12, 22, stat ? TEAL : RED, 14, 'right');
  },
  readings: (s, p) => {
    const th = (p.theta * Math.PI) / 180, stat = s.v === 0 && Math.tan(th) <= p.mu;
    const N = p.m * G * Math.cos(th), f = stat ? p.m * G * Math.sin(th) : 0.8 * p.mu * N;
    return [
      { label: l3('Normal force N', 'अभिलंब बल N', 'ಲಂಬ ಬಲ N'), value: `${fmt(N, 1)} N` },
      { label: l3('Friction f', 'घर्षण f', 'ಘರ್ಷಣೆ f'), value: `${fmt(f, 1)} N` },
      { label: l3('Max static friction', 'अधिकतम स्थैतिक घर्षण', 'ಗರಿಷ್ಠ ಸ್ಥಿರ ಘರ್ಷಣೆ'), value: `${fmt(p.mu * N, 1)} N` },
      { label: l3('Speed', 'चाल', 'ವೇಗ'), value: `${fmt(s.v, 2)} m/s` },
    ];
  },
};

/* ================= 4. Simple pendulum ================= */
interface PendState { th: number; w: number; t: number; hist: number[][]; lastCross: number; Tm: number; th0: number }
export const pendulum: SimDef<PendState> = {
  id: 'pendulum',
  title: l3('Simple pendulum', 'सरल लोलक', 'ಸರಳ ಲೋಲಕ'),
  formula: 'T = 2π √(L / g)   |   KE + PE = constant',
  what: l3('A bob swings back and forth. The graph shows its angle against time.', 'एक गोलक आगे-पीछे झूलता है। ग्राफ़ समय के साथ उसका कोण दिखाता है।', 'ಗೋಳ ಹಿಂದೆ-ಮುಂದೆ ಓಲಾಡುತ್ತದೆ. ನಕ್ಷೆ ಸಮಯದೊಂದಿಗೆ ಅದರ ಕೋನ ತೋರಿಸುತ್ತದೆ.'),
  why: l3('Gravity pulls the bob back towards the middle. A longer string or weaker gravity makes the swing slower.', 'गुरुत्व गोलक को बीच की ओर खींचता है। लंबा धागा या कम गुरुत्व झूले को धीमा करता है।', 'ಗುರುತ್ವ ಗೋಳವನ್ನು ಮಧ್ಯದ ಕಡೆ ಎಳೆಯುತ್ತದೆ. ಉದ್ದ ದಾರ ಅಥವಾ ಕಡಿಮೆ ಗುರುತ್ವ ಓಲಾಟ ನಿಧಾನಿಸುತ್ತದೆ.'),
  principle: l3('Simple harmonic motion for small angles; the period does not depend on mass.', 'छोटे कोणों पर सरल आवर्त गति; आवर्तकाल द्रव्यमान पर निर्भर नहीं।', 'ಸಣ್ಣ ಕೋನಗಳಲ್ಲಿ ಸರಳ ಹಾರ್ಮೋನಿಕ್ ಚಲನೆ; ಆವರ್ತ ಕಾಲ ದ್ರವ್ಯರಾಶಿಯ ಮೇಲೆ ಅವಲಂಬಿತವಲ್ಲ.'),
  whatIf: [
    l3('Make L four times longer: T doubles.', 'L चार गुना करें: T दोगुना।', 'L ನಾಲ್ಕು ಪಟ್ಟು ಮಾಡಿ: T ಎರಡು ಪಟ್ಟು.'),
    l3('Try g = 1.6 (Moon): the pendulum swings much slower.', 'g = 1.6 (चंद्रमा) लें: लोलक बहुत धीमा झूलता है।', 'g = 1.6 (ಚಂದ್ರ) ಇಡಿ: ಲೋಲಕ ಬಹಳ ನಿಧಾನ.'),
    l3('A very large starting angle makes T a little longer than 2π√(L/g).', 'बहुत बड़ा आरंभिक कोण T को 2π√(L/g) से थोड़ा अधिक कर देता है।', 'ಬಹಳ ದೊಡ್ಡ ಆರಂಭಿಕ ಕೋನ T ಅನ್ನು 2π√(L/g) ಗಿಂತ ಸ್ವಲ್ಪ ಹೆಚ್ಚಿಸುತ್ತದೆ.'),
  ],
  params: [
    { key: 'L', label: l3('Length L', 'लंबाई L', 'ಉದ್ದ L'), min: 0.2, max: 2, step: 0.1, unit: 'm', def: 1 },
    { key: 'g', label: l3('Gravity g', 'गुरुत्व g', 'ಗುರುತ್ವ g'), min: 1.6, max: 24.8, step: 0.1, unit: 'm/s²', def: 9.8 },
    { key: 'amp', label: l3('Starting angle', 'आरंभिक कोण', 'ಆರಂಭಿಕ ಕೋನ'), min: 5, max: 60, step: 1, unit: '°', def: 15 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'angle (°)', series: [{ label: 'θ', color: TEAL, idx: 1 }] },
  init: (p) => ({ th: (p.amp * Math.PI) / 180, w: 0, t: 0, hist: [], lastCross: -1, Tm: 0, th0: (p.amp * Math.PI) / 180 }),
  step(s, p, dt) {
    const acc = (x: number) => -(p.g / p.L) * Math.sin(x);
    const prev = s.th;
    // velocity Verlet
    const a0 = acc(s.th);
    s.th += s.w * dt + 0.5 * a0 * dt * dt;
    s.w += 0.5 * (a0 + acc(s.th)) * dt;
    s.t += dt;
    if (prev < 0 && s.th >= 0) {
      if (s.lastCross >= 0) s.Tm = s.t - s.lastCross;
      s.lastCross = s.t;
    }
    const last = s.hist[s.hist.length - 1];
    if (!last || s.t - last[0] > 0.03) { s.hist.push([s.t, (s.th * 180) / Math.PI]); if (s.hist.length > 400) s.hist.shift(); }
  },
  draw(c, s, p, w, h) {
    const px = w / 2, py = 26, len = Math.min(h - 70, 190);
    const bx = px + len * Math.sin(s.th), by = py + len * Math.cos(s.th);
    c.strokeStyle = '#9AA5AB'; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + len + 10); c.stroke(); c.setLineDash([]);
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(px, py); c.lineTo(bx, by); c.stroke();
    c.fillStyle = TEAL; c.beginPath(); c.arc(bx, by, 14, 0, 7); c.fill();
    c.fillStyle = INK; c.fillRect(px - 40, py - 6, 80, 6);
    label(c, `θ = ${fmt((s.th * 180) / Math.PI, 1)}°`, 12, 22);
  },
  readings: (s, p) => {
    const KE = 0.5 * p.L * p.L * s.w * s.w, PE = p.g * p.L * (1 - Math.cos(s.th));
    return [
      { label: l3('T = 2π√(L/g)', 'T = 2π√(L/g)', 'T = 2π√(L/g)'), value: `${fmt(2 * Math.PI * Math.sqrt(p.L / p.g), 3)} s` },
      { label: l3('Measured T', 'मापा गया T', 'ಅಳೆದ T'), value: s.Tm ? `${fmt(s.Tm, 3)} s` : '…' },
      { label: l3('KE (m = 1 kg)', 'गतिज ऊर्जा (m = 1 kg)', 'ಚಲನಶಕ್ತಿ (m = 1 kg)'), value: `${fmt(KE, 2)} J` },
      { label: l3('PE (m = 1 kg)', 'स्थितिज ऊर्जा (m = 1 kg)', 'ಸ್ಥಿತಿಶಕ್ತಿ (m = 1 kg)'), value: `${fmt(PE, 2)} J` },
    ];
  },
};

/* ================= 5. Spring–mass SHM ================= */
interface SpringState { t: number; hist: number[][] }
export const springmass: SimDef<SpringState> = {
  id: 'springmass',
  title: l3('Mass on a spring', 'स्प्रिंग पर द्रव्यमान', 'ಸ್ಪ್ರಿಂಗ್ ಮೇಲಿನ ದ್ರವ್ಯರಾಶಿ'),
  formula: 'T = 2π √(m / k)   |   x = A cos ωt   |   E = ½kA²',
  what: l3('A mass moves to and fro on a spring. Kinetic and potential energy keep trading places.', 'स्प्रिंग पर द्रव्यमान आगे-पीछे चलता है। गतिज और स्थितिज ऊर्जा बारी-बारी बदलती रहती हैं।', 'ದ್ರವ್ಯರಾಶಿ ಸ್ಪ್ರಿಂಗ್ ಮೇಲೆ ಹಿಂದೆ-ಮುಂದೆ ಚಲಿಸುತ್ತದೆ. ಚಲನ ಮತ್ತು ಸ್ಥಿತಿಶಕ್ತಿ ಬದಲಾಗುತ್ತಲೇ ಇರುತ್ತವೆ.'),
  why: l3('The spring pulls back with a force proportional to the stretch (Hooke’s law), so the mass keeps oscillating.', 'स्प्रिंग खिंचाव के समानुपाती बल से पीछे खींचती है (हुक का नियम), इसलिए द्रव्यमान दोलन करता रहता है।', 'ಸ್ಪ್ರಿಂಗ್ ಹಿಗ್ಗುವಿಕೆಗೆ ಅನುಪಾತದ ಬಲದಿಂದ ಹಿಂದಕ್ಕೆ ಎಳೆಯುತ್ತದೆ (ಹುಕ್ ನಿಯಮ), ಆದ್ದರಿಂದ ದ್ರವ್ಯರಾಶಿ ದೋಲನ ಮಾಡುತ್ತದೆ.'),
  principle: l3("Hooke's law and simple harmonic motion; total energy stays constant.", 'हुक का नियम और सरल आवर्त गति; कुल ऊर्जा स्थिर रहती है।', 'ಹುಕ್ ನಿಯಮ ಮತ್ತು ಸರಳ ಹಾರ್ಮೋನಿಕ್ ಚಲನೆ; ಒಟ್ಟು ಶಕ್ತಿ ಸ್ಥಿರ.'),
  whatIf: [
    l3('A stiffer spring (larger k) oscillates faster.', 'कड़ी स्प्रिंग (अधिक k) तेज़ दोलन करती है।', 'ಗಟ್ಟಿ ಸ್ಪ್ರಿಂಗ್ (ಹೆಚ್ಚು k) ವೇಗವಾಗಿ ದೋಲಿಸುತ್ತದೆ.'),
    l3('A heavier mass oscillates slower.', 'भारी द्रव्यमान धीमे दोलन करता है।', 'ಭಾರದ ದ್ರವ್ಯರಾಶಿ ನಿಧಾನವಾಗಿ ದೋಲಿಸುತ್ತದೆ.'),
    l3('Changing the amplitude does not change the period.', 'आयाम बदलने से आवर्तकाल नहीं बदलता।', 'ವಿಸ್ತಾರ ಬದಲಿಸಿದರೂ ಆವರ್ತ ಕಾಲ ಬದಲಾಗದು.'),
  ],
  params: [
    { key: 'm', label: l3('Mass m', 'द्रव्यमान m', 'ದ್ರವ್ಯರಾಶಿ m'), min: 0.1, max: 5, step: 0.1, unit: 'kg', def: 1 },
    { key: 'k', label: l3('Spring constant k', 'स्प्रिंग नियतांक k', 'ಸ್ಪ್ರಿಂಗ್ ಸ್ಥಿರಾಂಕ k'), min: 5, max: 100, step: 5, unit: 'N/m', def: 20 },
    { key: 'A', label: l3('Amplitude A', 'आयाम A', 'ವಿಸ್ತಾರ A'), min: 0.05, max: 0.4, step: 0.01, unit: 'm', def: 0.2 },
  ],
  animated: true,
  graph: { xLabel: 't (s)', yLabel: 'x (m)', series: [{ label: 'x', color: TEAL, idx: 1 }] },
  init: () => ({ t: 0, hist: [] }),
  step(s, p, dt) {
    s.t += dt;
    const w = Math.sqrt(p.k / p.m);
    const last = s.hist[s.hist.length - 1];
    if (!last || s.t - last[0] > 0.03) { s.hist.push([s.t, p.A * Math.cos(w * s.t)]); if (s.hist.length > 400) s.hist.shift(); }
  },
  draw(c, s, p, w, h) {
    const om = Math.sqrt(p.k / p.m), x = p.A * Math.cos(om * s.t), sc = (w * 0.3) / 0.4, cx = w * 0.55, y0 = h * 0.55;
    c.fillStyle = INK; c.fillRect(8, y0 - 40, 10, 80);
    const mx = cx + x * sc;
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(18, y0);
    const n = 14, x0 = 18, x1 = mx - 24;
    for (let i = 1; i <= n; i++) c.lineTo(x0 + ((x1 - x0) * i) / n, y0 + (i % 2 ? -12 : 12));
    c.lineTo(x1, y0); c.stroke();
    c.fillStyle = TEAL; c.fillRect(mx - 24, y0 - 24, 48, 48);
    c.strokeStyle = '#9AA5AB'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(cx, y0 - 50); c.lineTo(cx, y0 + 50); c.stroke(); c.setLineDash([]);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(10, y0 + 40); c.lineTo(w - 10, y0 + 40); c.stroke();
    label(c, `x = ${fmt(x, 3)} m`, 12, 22);
  },
  readings: (s, p) => {
    const om = Math.sqrt(p.k / p.m), x = p.A * Math.cos(om * s.t), v = -p.A * om * Math.sin(om * s.t);
    return [
      { label: l3('Period T', 'आवर्तकाल T', 'ಆವರ್ತ ಕಾಲ T'), value: `${fmt((2 * Math.PI) / om, 3)} s` },
      { label: l3('Frequency f', 'आवृत्ति f', 'ಆವೃತ್ತಿ f'), value: `${fmt(om / (2 * Math.PI), 2)} Hz` },
      { label: l3('KE', 'गतिज ऊर्जा', 'ಚಲನಶಕ್ತಿ'), value: `${fmt(0.5 * p.m * v * v, 3)} J` },
      { label: l3('PE (spring)', 'स्थितिज (स्प्रिंग)', 'ಸ್ಥಿತಿಶಕ್ತಿ (ಸ್ಪ್ರಿಂಗ್)'), value: `${fmt(0.5 * p.k * x * x, 3)} J` },
    ];
  },
};

/* ================= 6. Lever / principle of moments ================= */
interface LeverState { ang: number }
export const lever: SimDef<LeverState> = {
  id: 'lever',
  title: l3('Lever and principle of moments', 'उत्तोलक और आघूर्ण का सिद्धांत', 'ಸನ್ನೆ ಮತ್ತು ಆಘೂರ್ಣ ತತ್ವ'),
  formula: 'Moment = F × d   |   balanced when F₁d₁ = F₂d₂   |   MA = L / E',
  what: l3('Two loads hang on a beam balanced on a pivot. The beam tilts towards the larger moment.', 'धुरी पर संतुलित छड़ पर दो भार लटके हैं। छड़ बड़े आघूर्ण की ओर झुकती है।', 'ಆಧಾರದ ಮೇಲೆ ಸಮತೋಲನದಲ್ಲಿರುವ ಕಂಬಿಯ ಮೇಲೆ ಎರಡು ಭಾರ ತೂಗುತ್ತವೆ. ಕಂಬಿ ದೊಡ್ಡ ಆಘೂರ್ಣದ ಕಡೆ ವಾಲುತ್ತದೆ.'),
  why: l3('Each force turns the beam by F × distance from the pivot. Equal turning effects in opposite directions give balance.', 'प्रत्येक बल छड़ को F × धुरी से दूरी से घुमाता है। विपरीत दिशाओं में समान घूर्णन प्रभाव से संतुलन मिलता है।', 'ಪ್ರತಿ ಬಲ ಕಂಬಿಯನ್ನು F × ಆಧಾರದಿಂದ ದೂರ ತಿರುಗಿಸುತ್ತದೆ. ವಿರುದ್ಧ ದಿಕ್ಕಿನ ಸಮ ಪರಿಣಾಮ ಸಮತೋಲನ.'),
  principle: l3('Principle of moments: clockwise moment = anticlockwise moment in equilibrium.', 'आघूर्ण का सिद्धांत: संतुलन में दक्षिणावर्त आघूर्ण = वामावर्त आघूर्ण।', 'ಆಘೂರ್ಣ ತತ್ವ: ಸಮತೋಲನದಲ್ಲಿ ಪ್ರದಕ್ಷಿಣ ಆಘೂರ್ಣ = ಅಪ್ರದಕ್ಷಿಣ ಆಘೂರ್ಣ.'),
  whatIf: [
    l3('Move the heavy load closer to the pivot to balance a light load far away.', 'भारी भार को धुरी के पास और हल्के को दूर रखकर संतुलन पाएँ।', 'ಭಾರದ ಭಾರವನ್ನು ಆಧಾರದ ಹತ್ತಿರ, ಹಗುರವನ್ನು ದೂರ ಇಟ್ಟು ಸಮತೋಲನ ಪಡೆಯಿರಿ.'),
    l3('A long effort arm gives a large mechanical advantage.', 'लंबी प्रयास भुजा से अधिक यांत्रिक लाभ मिलता है।', 'ಉದ್ದ ಪ್ರಯತ್ನ ತೋಳು ಹೆಚ್ಚು ಯಾಂತ್ರಿಕ ಲಾಭ ನೀಡುತ್ತದೆ.'),
  ],
  params: [
    { key: 'F1', label: l3('Left load F₁', 'बायाँ भार F₁', 'ಎಡ ಭಾರ F₁'), min: 1, max: 20, step: 1, unit: 'N', def: 6, live: true },
    { key: 'd1', label: l3('Left distance d₁', 'बायाँ दूरी d₁', 'ಎಡ ದೂರ d₁'), min: 0.1, max: 1, step: 0.05, unit: 'm', def: 0.5, live: true },
    { key: 'F2', label: l3('Right load F₂', 'दायाँ भार F₂', 'ಬಲ ಭಾರ F₂'), min: 1, max: 20, step: 1, unit: 'N', def: 3, live: true },
    { key: 'd2', label: l3('Right distance d₂', 'दायाँ दूरी d₂', 'ಬಲ ದೂರ d₂'), min: 0.1, max: 1, step: 0.05, unit: 'm', def: 1, live: true },
  ],
  animated: true,
  init: () => ({ ang: 0 }),
  step(s, p, dt) {
    const target = clamp((p.F1 * p.d1 - p.F2 * p.d2) * 0.08, -0.35, 0.35); // + = left side down
    s.ang += (target - s.ang) * Math.min(1, dt * 3);
  },
  draw(c, s, p, w, h) {
    const px = w / 2, py = h * 0.6, half = Math.min(w * 0.42, 260);
    c.fillStyle = INK; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 18, py + 50); c.lineTo(px + 18, py + 50); c.closePath(); c.fill();
    c.save(); c.translate(px, py); c.rotate(-s.ang);
    c.fillStyle = AMBER; c.fillRect(-half, -6, half * 2, 12);
    for (let i = -10; i <= 10; i++) { c.fillStyle = INK; c.fillRect((i * half) / 10 - 0.7, -6, 1.4, i % 5 === 0 ? 10 : 6); }
    const hang = (side: number, d: number, F: number, col: string, name: string) => {
      const x = side * d * half;
      c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 6); c.lineTo(x, 36); c.stroke();
      const s2 = 14 + F * 1.3; c.fillStyle = col; c.fillRect(x - s2 / 2, 36, s2, s2);
      c.fillStyle = '#fff'; c.font = '600 11px system-ui'; c.textAlign = 'center'; c.fillText(`${F}N`, x, 36 + s2 / 2 + 4);
      label(c, `${name}=${d} m`, x, 36 + s2 + 14, INK, 11, 'center');
    };
    hang(-1, p.d1, p.F1, TEAL, 'd₁'); hang(1, p.d2, p.F2, PURPLE, 'd₂');
    c.restore();
    const m1 = p.F1 * p.d1, m2 = p.F2 * p.d2;
    label(c, `F₁d₁ = ${fmt(m1, 2)}   F₂d₂ = ${fmt(m2, 2)} N·m`, 12, 22);
    const bal = Math.abs(m1 - m2) < 0.02;
    label(c, bal ? 'balanced' : m1 > m2 ? 'left side goes down' : 'right side goes down', w - 12, 22, bal ? TEAL : RED, 13, 'right');
  },
  readings: (s, p) => {
    const m1 = p.F1 * p.d1, m2 = p.F2 * p.d2;
    return [
      { label: l3('Left moment', 'बायाँ आघूर्ण', 'ಎಡ ಆಘೂರ್ಣ'), value: `${fmt(m1, 2)} N·m` },
      { label: l3('Right moment', 'दायाँ आघूर्ण', 'ಬಲ ಆಘೂರ್ಣ'), value: `${fmt(m2, 2)} N·m` },
      { label: l3('Net moment', 'परिणामी आघूर्ण', 'ನಿವ್ವಳ ಆಘೂರ್ಣ'), value: `${fmt(m1 - m2, 2)} N·m` },
      { label: l3('F₂ needed to balance', 'संतुलन के लिए F₂', 'ಸಮತೋಲನಕ್ಕೆ F₂'), value: `${fmt(m1 / p.d2, 1)} N` },
    ];
  },
};

/* ================= 7. Buoyancy ================= */
interface BuoyState { d: number; v: number }
export const buoyancy: SimDef<BuoyState> = {
  id: 'buoyancy',
  title: l3('Floating and sinking', 'तैरना और डूबना', 'ತೇಲುವುದು ಮತ್ತು ಮುಳುಗುವುದು'),
  formula: 'Upthrust = ρ_liquid × V_submerged × g   |   floats if ρ_body < ρ_liquid',
  what: l3('A 10 cm cube is released in a tank. It sinks or floats depending on its density and the liquid’s.', '10 cm का घन टंकी में छोड़ा जाता है। उसका और द्रव का घनत्व तय करता है कि वह डूबेगा या तैरेगा।', '10 cm ಘನವನ್ನು ತೊಟ್ಟಿಗೆ ಬಿಡಲಾಗುತ್ತದೆ. ಅದರ ಮತ್ತು ದ್ರವದ ಸಾಂದ್ರತೆ ಮುಳುಗುವುದೇ ತೇಲುವುದೇ ನಿರ್ಧರಿಸುತ್ತದೆ.'),
  why: l3('The liquid pushes up with a force equal to the weight of liquid displaced. If the maximum upthrust is less than the weight, the cube sinks.', 'द्रव विस्थापित द्रव के भार के बराबर बल से ऊपर धकेलता है। अधिकतम उत्प्लावन भार से कम हो तो घन डूबता है।', 'ದ್ರವ ಸ್ಥಳಾಂತರಿತ ದ್ರವದ ತೂಕಕ್ಕೆ ಸಮ ಬಲದಿಂದ ಮೇಲಕ್ಕೆ ತಳ್ಳುತ್ತದೆ. ಗರಿಷ್ಠ ಮೇಲ್ನೂಕು ತೂಕಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಘನ ಮುಳುಗುತ್ತದೆ.'),
  principle: l3("Archimedes' principle and the principle of floatation.", 'आर्किमिडीज़ का सिद्धांत और प्लवन का सिद्धांत।', 'ಆರ್ಕಿಮಿಡೀಸ್ ತತ್ವ ಮತ್ತು ತೇಲುವ ತತ್ವ.'),
  whatIf: [
    l3('Body density 600 in water (1000): about 60 % of the cube stays under water.', 'जल (1000) में घनत्व 600 की वस्तु का लगभग 60 % भाग जल में रहता है।', 'ನೀರಿನಲ್ಲಿ (1000) ಸಾಂದ್ರತೆ 600 ಆದರೆ ಘನದ ಸುಮಾರು 60 % ನೀರಿನಡಿ.'),
    l3('Raise the liquid density (salt water): the cube floats higher.', 'द्रव का घनत्व बढ़ाएँ (खारा पानी): घन अधिक ऊपर तैरता है।', 'ದ್ರವದ ಸಾಂದ್ರತೆ ಹೆಚ್ಚಿಸಿ (ಉಪ್ಪು ನೀರು): ಘನ ಹೆಚ್ಚು ಮೇಲೆ ತೇಲುತ್ತದೆ.'),
  ],
  params: [
    { key: 'rb', label: l3('Body density', 'वस्तु का घनत्व', 'ವಸ್ತುವಿನ ಸಾಂದ್ರತೆ'), min: 200, max: 3000, step: 50, unit: 'kg/m³', def: 600 },
    { key: 'rl', label: l3('Liquid density', 'द्रव का घनत्व', 'ದ್ರವದ ಸಾಂದ್ರತೆ'), min: 700, max: 1300, step: 50, unit: 'kg/m³', def: 1000 },
  ],
  animated: true,
  init: () => ({ d: -0.02, v: 0 }),
  step(s, p, dt) {
    const a = 0.1, m = p.rb * a ** 3;
    const sub = clamp(s.d, 0, a);
    const acc = G - (p.rl * G * a * a * sub) / m - (6 * s.v) / m * 1.0;
    s.v += acc * dt;
    s.d += s.v * dt;
    if (s.d > 0.4) { s.d = 0.4; s.v = 0; }
  },
  draw(c, s, p, w, h) {
    const tx = w * 0.3, tw = w * 0.4, top = 40, ppm = (h - 60) / 0.6, water = top + 0.15 * ppm;
    c.fillStyle = 'rgba(56,160,220,0.35)'; c.fillRect(tx, water, tw, h - 20 - water);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, top); c.lineTo(tx, h - 20); c.lineTo(tx + tw, h - 20); c.lineTo(tx + tw, top); c.stroke();
    const side = 0.1 * ppm, by = water + s.d * ppm - side;
    c.fillStyle = TEAL; c.fillRect(tx + tw / 2 - side / 2, by, side, side);
    const sub = clamp(s.d, 0, 0.1);
    label(c, `${fmt((sub / 0.1) * 100, 0)} % submerged`, tx + tw + 10, water + 4, INK, 12);
    const W = p.rb * 0.001 * G, B = p.rl * 0.001 * G * (sub / 0.1);
    arrow(c, tx + tw / 2, by + side / 2, tx + tw / 2, by + side / 2 + W * 3, INK, 3);
    arrow(c, tx + tw / 2 + 14, by + side / 2, tx + tw / 2 + 14, by + side / 2 - B * 3, RED, 3);
    label(c, 'W', tx + tw / 2 - 18, by + side / 2 + W * 3, INK, 12); label(c, 'U', tx + tw / 2 + 22, by + side / 2 - B * 3, RED, 12);
  },
  readings: (s, p) => {
    const W = p.rb * 0.001 * G, U = p.rl * 0.001 * G, sub = clamp(s.d, 0, 0.1) / 0.1;
    return [
      { label: l3('Weight', 'भार', 'ತೂಕ'), value: `${fmt(W, 2)} N` },
      { label: l3('Max upthrust', 'अधिकतम उत्प्लावन', 'ಗರಿಷ್ಠ ಮೇಲ್ನೂಕು'), value: `${fmt(U, 2)} N` },
      { label: l3('Submerged', 'डूबा भाग', 'ಮುಳುಗಿದ ಭಾಗ'), value: `${fmt(sub * 100, 0)} %` },
      { label: l3('Result', 'परिणाम', 'ಫಲಿತಾಂಶ'), value: p.rb < p.rl ? 'floats ↑' : p.rb === p.rl ? 'hovers' : 'sinks ↓' },
    ];
  },
};

/* ================= 8. Work–energy: pushing a box ================= */
interface WorkState { s: number; v: number }
export const workenergy: SimDef<WorkState> = {
  id: 'workenergy',
  title: l3('Work and kinetic energy', 'कार्य और गतिज ऊर्जा', 'ಕೆಲಸ ಮತ್ತು ಚಲನಶಕ್ತಿ'),
  formula: 'W = F s cos θ   |   W_net = ΔKE = ½mv²   |   P = W / t',
  what: l3('A rope pulls a box along a rough floor for 10 m. Compare the work done with the kinetic energy gained.', 'रस्सी एक बक्से को खुरदरे फर्श पर 10 m खींचती है। किए गए कार्य की तुलना प्राप्त गतिज ऊर्जा से करें।', 'ಹಗ್ಗ ಪೆಟ್ಟಿಗೆಯನ್ನು ಒರಟು ನೆಲದಲ್ಲಿ 10 m ಎಳೆಯುತ್ತದೆ. ಮಾಡಿದ ಕೆಲಸ ಮತ್ತು ಗಳಿಸಿದ ಚಲನಶಕ್ತಿ ಹೋಲಿಸಿ.'),
  why: l3('Only the part of the force along the motion does work (F cos θ). Friction does negative work. The net work becomes kinetic energy.', 'केवल गति की दिशा वाला बल कार्य करता है (F cos θ)। घर्षण ऋणात्मक कार्य करता है। परिणामी कार्य गतिज ऊर्जा बन जाता है।', 'ಚಲನೆಯ ದಿಕ್ಕಿನ ಬಲದ ಭಾಗ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ (F cos θ). ಘರ್ಷಣೆ ಋಣ ಕೆಲಸ ಮಾಡುತ್ತದೆ. ನಿವ್ವಳ ಕೆಲಸ ಚಲನಶಕ್ತಿಯಾಗುತ್ತದೆ.'),
  principle: l3('Work–energy theorem.', 'कार्य–ऊर्जा प्रमेय।', 'ಕೆಲಸ–ಶಕ್ತಿ ಪ್ರಮೇಯ.'),
  whatIf: [
    l3('At θ = 0° all of F does work; at larger θ less does, and the box also gets lighter on the floor.', 'θ = 0° पर पूरा F कार्य करता है; अधिक θ पर कम, और बक्सा फर्श पर हल्का भी होता है।', 'θ = 0° ನಲ್ಲಿ ಪೂರ್ಣ F ಕೆಲಸ ಮಾಡುತ್ತದೆ; ಹೆಚ್ಚು θ ನಲ್ಲಿ ಕಡಿಮೆ, ಪೆಟ್ಟಿಗೆ ನೆಲದ ಮೇಲೆ ಹಗುರವೂ ಆಗುತ್ತದೆ.'),
    l3('If F cos θ is less than friction, the box does not move: work is zero.', 'F cos θ घर्षण से कम हो तो बक्सा नहीं हिलता: कार्य शून्य।', 'F cos θ ಘರ್ಷಣೆಗಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ ಪೆಟ್ಟಿಗೆ ಚಲಿಸದು: ಕೆಲಸ ಸೊನ್ನೆ.'),
  ],
  params: [
    { key: 'F', label: l3('Pull force F', 'खींचने का बल F', 'ಎಳೆಯುವ ಬಲ F'), min: 0, max: 80, step: 5, unit: 'N', def: 40 },
    { key: 'th', label: l3('Rope angle θ', 'रस्सी का कोण θ', 'ಹಗ್ಗದ ಕೋನ θ'), min: 0, max: 60, step: 5, unit: '°', def: 30 },
    { key: 'mu', label: l3('Friction μ', 'घर्षण μ', 'ಘರ್ಷಣೆ μ'), min: 0, max: 0.6, step: 0.05, unit: '', def: 0.2 },
    { key: 'm', label: l3('Mass m', 'द्रव्यमान m', 'ದ್ರವ್ಯರಾಶಿ m'), min: 1, max: 20, step: 1, unit: 'kg', def: 5 },
  ],
  animated: true,
  init: () => ({ s: 0, v: 0 }),
  step(s, p, dt) {
    if (s.s >= 10) return;
    const th = (p.th * Math.PI) / 180, N = Math.max(0, p.m * G - p.F * Math.sin(th)), net = p.F * Math.cos(th) - p.mu * N;
    if (net <= 0 && s.v === 0) return;
    const a = net / p.m;
    let ns = s.s + s.v * dt + 0.5 * a * dt * dt;
    let nv = Math.max(0, s.v + a * dt);
    if (ns >= 10) { nv = Math.sqrt(Math.max(0, s.v * s.v + 2 * a * (10 - s.s))); ns = 10; } // v² = u² + 2as exactly
    s.s = ns;
    s.v = nv;
  },
  draw(c, s, p, w, h) {
    const th = (p.th * Math.PI) / 180, y0 = h * 0.65, sc = (w - 80) / 11;
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(20, y0); c.lineTo(w - 20, y0); c.stroke();
    for (let m = 0; m <= 10; m += 2) { c.beginPath(); c.moveTo(40 + m * sc, y0); c.lineTo(40 + m * sc, y0 + 7); c.stroke(); label(c, `${m}`, 40 + m * sc, y0 + 21, '#4A3F66', 11, 'center'); }
    const bx = 40 + s.s * sc, bw = 30 + p.m * 1.4;
    c.fillStyle = TEAL; c.fillRect(bx - bw / 2, y0 - bw, bw, bw);
    arrow(c, bx + bw / 2, y0 - bw / 2, bx + bw / 2 + p.F * 1.6 * Math.cos(th), y0 - bw / 2 - p.F * 1.6 * Math.sin(th), RED, 3);
    const N = Math.max(0, p.m * G - p.F * Math.sin(th));
    if (p.mu > 0) arrow(c, bx - bw / 2, y0 - 6, bx - bw / 2 - p.mu * N * 1.6, y0 - 6, PURPLE, 3);
    label(c, `s = ${fmt(s.s, 1)} m`, 12, 22);
    if (s.s >= 10) label(c, 'finished — press Reset to replay', w - 12, 22, INK, 12, 'right');
  },
  readings: (s, p) => {
    const th = (p.th * Math.PI) / 180, N = Math.max(0, p.m * G - p.F * Math.sin(th));
    const WF = p.F * Math.cos(th) * s.s, Wf = -p.mu * N * s.s, KE = 0.5 * p.m * s.v * s.v;
    return [
      { label: l3('Work by F', 'F द्वारा कार्य', 'F ಮಾಡಿದ ಕೆಲಸ'), value: `${fmt(WF, 1)} J` },
      { label: l3('Work by friction', 'घर्षण द्वारा कार्य', 'ಘರ್ಷಣೆಯ ಕೆಲಸ'), value: `${fmt(Wf, 1)} J` },
      { label: l3('Net work', 'परिणामी कार्य', 'ನಿವ್ವಳ ಕೆಲಸ'), value: `${fmt(WF + Wf, 1)} J` },
      { label: l3('Kinetic energy', 'गतिज ऊर्जा', 'ಚಲನಶಕ್ತಿ'), value: `${fmt(KE, 1)} J` },
    ];
  },
};

/* ================= 9. Orbit (gravitation) ================= */
interface OrbitState { x: number; y: number; vx: number; vy: number; trail: number[][]; t: number }
export const orbit: SimDef<OrbitState> = {
  id: 'orbit',
  title: l3('Orbit under gravity', 'गुरुत्व के अधीन कक्षा', 'ಗುರುತ್ವದಡಿ ಕಕ್ಷೆ'),
  formula: 'F = GMm / r²   |   v_circular = √(GM/r)   |   v_escape = √2 · v_circular   |   T² ∝ a³',
  what: l3('A planet is launched sideways near a star. Its path depends on the launch speed.', 'तारे के पास एक ग्रह को बगल की दिशा में छोड़ा जाता है। उसका पथ प्रक्षेप चाल पर निर्भर करता है।', 'ನಕ್ಷತ್ರದ ಬಳಿ ಗ್ರಹವನ್ನು ಪಕ್ಕಕ್ಕೆ ಎಸೆಯಲಾಗುತ್ತದೆ. ಅದರ ಪಥ ಎಸೆಯುವ ವೇಗದ ಮೇಲೆ ಅವಲಂಬಿತ.'),
  why: l3('Gravity pulls the planet towards the star all the time. At exactly the circular speed the pull just bends the path into a circle; faster gives an ellipse; beyond √2 times it escapes.', 'गुरुत्व ग्रह को हर समय तारे की ओर खींचता है। ठीक वृत्तीय चाल पर पथ वृत्त बनता है; अधिक चाल पर दीर्घवृत्त; √2 गुना से अधिक पर वह निकल जाता है।', 'ಗುರುತ್ವ ಗ್ರಹವನ್ನು ಸದಾ ನಕ್ಷತ್ರದ ಕಡೆ ಎಳೆಯುತ್ತದೆ. ಸರಿಯಾಗಿ ವೃತ್ತೀಯ ವೇಗದಲ್ಲಿ ವೃತ್ತ; ಹೆಚ್ಚು ವೇಗ ದೀರ್ಘವೃತ್ತ; √2 ಪಟ್ಟು ಮೀರಿದರೆ ತಪ್ಪಿಸಿಕೊಳ್ಳುತ್ತದೆ.'),
  principle: l3("Newton's law of gravitation and Kepler's laws (the planet moves faster when closer).", 'न्यूटन का गुरुत्वाकर्षण नियम और केप्लर के नियम (निकट होने पर ग्रह तेज़ चलता है)।', 'ನ್ಯೂಟನ್ ಗುರುತ್ವ ನಿಯಮ ಮತ್ತು ಕೆಪ್ಲರ್ ನಿಯಮ (ಹತ್ತಿರ ಇದ್ದಾಗ ಗ್ರಹ ವೇಗ).'),
  whatIf: [
    l3('Speed factor 1.0: a circle. Below 1: the planet falls inward; between 1 and 1.41: an ellipse.', 'चाल गुणक 1.0: वृत्त। 1 से कम: ग्रह भीतर गिरता है; 1 और 1.41 के बीच: दीर्घवृत्त।', 'ವೇಗ ಅಂಶ 1.0: ವೃತ್ತ. 1 ಕ್ಕಿಂತ ಕಡಿಮೆ: ಒಳಗೆ ಬೀಳುತ್ತದೆ; 1 ರಿಂದ 1.41: ದೀರ್ಘವೃತ್ತ.'),
    l3('Above 1.41 the planet escapes and never returns.', '1.41 से अधिक पर ग्रह निकल जाता है और कभी नहीं लौटता।', '1.41 ಕ್ಕಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ ಗ್ರಹ ತಪ್ಪಿಸಿಕೊಂಡು ಮರಳುವುದಿಲ್ಲ.'),
  ],
  params: [{ key: 'f', label: l3('Launch speed ÷ circular speed', 'प्रक्षेप चाल ÷ वृत्तीय चाल', 'ಎಸೆಯುವ ವೇಗ ÷ ವೃತ್ತೀಯ ವೇಗ'), min: 0.5, max: 1.5, step: 0.01, unit: '', def: 0.8 }],
  animated: true,
  init: (p) => ({ x: 1, y: 0, vx: 0, vy: p.f, trail: [[1, 0]], t: 0 }),
  step(s, p, dt) {
    const k = dt * 1.5; // 1 sim unit = 1.5 s of animation time
    const acc = (x: number, y: number) => { const r3 = Math.hypot(x, y) ** 3; return [-x / r3, -y / r3]; };
    const [ax, ay] = acc(s.x, s.y);
    s.x += s.vx * k + 0.5 * ax * k * k; s.y += s.vy * k + 0.5 * ay * k * k;
    const [bx, by] = acc(s.x, s.y);
    s.vx += 0.5 * (ax + bx) * k; s.vy += 0.5 * (ay + by) * k;
    s.t += k;
    const last = s.trail[s.trail.length - 1];
    if (Math.hypot(s.x - last[0], s.y - last[1]) > 0.02) { s.trail.push([s.x, s.y]); if (s.trail.length > 700) s.trail.shift(); }
    if (Math.hypot(s.x, s.y) < 0.04) { s.vx = 0; s.vy = 0; }
  },
  draw(c, s, p, w, h) {
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 5;
    c.fillStyle = AMBER; c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fill();
    c.strokeStyle = 'rgba(15,118,110,0.6)'; c.lineWidth = 2; c.beginPath();
    s.trail.forEach((q, i) => (i ? c.lineTo(cx + q[0] * sc, cy - q[1] * sc) : c.moveTo(cx + q[0] * sc, cy - q[1] * sc))); c.stroke();
    c.fillStyle = TEAL; c.beginPath(); c.arc(cx + s.x * sc, cy - s.y * sc, 7, 0, 7); c.fill();
    arrow(c, cx + s.x * sc, cy - s.y * sc, cx + (s.x - 0.25 * s.x / Math.hypot(s.x, s.y)) * sc, cy - (s.y - 0.25 * s.y / Math.hypot(s.x, s.y)) * sc, RED, 2.5);
    label(c, `speed factor ${p.f}`, 12, 22);
  },
  readings: (s, p) => {
    const r = Math.hypot(s.x, s.y), v2 = s.vx ** 2 + s.vy ** 2, E = 0.5 * v2 - 1 / r;
    const Lm = s.x * s.vy - s.y * s.vx, e = Math.sqrt(Math.max(0, 1 + 2 * E * Lm * Lm));
    const a = E < 0 ? -1 / (2 * E) : Infinity;
    return [
      { label: l3('Distance r', 'दूरी r', 'ದೂರ r'), value: fmt(r, 2) },
      { label: l3('Speed', 'चाल', 'ವೇಗ'), value: fmt(Math.sqrt(v2), 2) },
      { label: l3('Total energy', 'कुल ऊर्जा', 'ಒಟ್ಟು ಶಕ್ತಿ'), value: fmt(E, 3) },
      { label: l3('Path', 'पथ', 'ಪಥ'), value: E >= 0 ? 'escapes' : e < 0.02 ? 'circle' : `ellipse (T²/a³ = ${fmt(((2 * Math.PI * a ** 1.5) ** 2) / a ** 3, 1)})` },
    ];
  },
};

/* ================= 10. Uniform circular motion ================= */
interface CircState { th: number }
export const circular: SimDef<CircState> = {
  id: 'circular',
  title: l3('Circular motion', 'वृत्तीय गति', 'ವೃತ್ತೀಯ ಚಲನೆ'),
  formula: 'a = v² / r   |   F = mv² / r   |   T = 2πr / v',
  what: l3('A ball on a string moves in a circle at steady speed. The pull of the string points to the centre.', 'डोरी से बँधी गेंद स्थिर चाल से वृत्त में घूमती है। डोरी का खिंचाव केंद्र की ओर है।', 'ದಾರಕ್ಕೆ ಕಟ್ಟಿದ ಚೆಂಡು ಸ್ಥಿರ ವೇಗದಲ್ಲಿ ವೃತ್ತದಲ್ಲಿ ಚಲಿಸುತ್ತದೆ. ದಾರದ ಎಳೆತ ಕೇಂದ್ರದ ಕಡೆ.'),
  why: l3('The speed stays the same but the direction keeps changing, so the ball accelerates. This needs a force towards the centre — the centripetal force.', 'चाल वही रहती है पर दिशा बदलती रहती है, इसलिए गेंद त्वरित होती है। इसके लिए केंद्र की ओर बल चाहिए — अभिकेंद्र बल।', 'ವೇಗ ಅದೇ ಆದರೆ ದಿಕ್ಕು ಬದಲಾಗುತ್ತಿರುತ್ತದೆ, ಆದ್ದರಿಂದ ಚೆಂಡಿಗೆ ವೇಗೋತ್ಕರ್ಷ. ಇದಕ್ಕೆ ಕೇಂದ್ರದ ಕಡೆ ಬಲ ಬೇಕು — ಕೇಂದ್ರಾಭಿಮುಖ ಬಲ.'),
  principle: l3("Centripetal force and Newton's second law.", 'अभिकेंद्र बल और न्यूटन का दूसरा नियम।', 'ಕೇಂದ್ರಾಭಿಮುಖ ಬಲ ಮತ್ತು ನ್ಯೂಟನ್ ಎರಡನೇ ನಿಯಮ.'),
  whatIf: [
    l3('Doubling the speed makes the needed force four times larger.', 'चाल दोगुनी करने पर आवश्यक बल चार गुना हो जाता है।', 'ವೇಗ ಎರಡು ಪಟ್ಟಾದರೆ ಬೇಕಾದ ಬಲ ನಾಲ್ಕು ಪಟ್ಟು.'),
    l3('If the string breaks, the ball flies off along the tangent, not outward.', 'डोरी टूटे तो गेंद स्पर्श रेखा के अनुदिश उड़ती है, बाहर की ओर नहीं।', 'ದಾರ ಹರಿದರೆ ಚೆಂಡು ಸ್ಪರ್ಶಕದ ಉದ್ದಕ್ಕೆ ಹಾರುತ್ತದೆ, ಹೊರಕ್ಕೆ ಅಲ್ಲ.'),
  ],
  params: [
    { key: 'v', label: l3('Speed v', 'चाल v', 'ವೇಗ v'), min: 1, max: 15, step: 0.5, unit: 'm/s', def: 6, live: true },
    { key: 'r', label: l3('Radius r', 'त्रिज्या r', 'ತ್ರಿಜ್ಯ r'), min: 1, max: 8, step: 0.5, unit: 'm', def: 3, live: true },
    { key: 'm', label: l3('Mass m', 'द्रव्यमान m', 'ದ್ರವ್ಯರಾಶಿ m'), min: 0.1, max: 5, step: 0.1, unit: 'kg', def: 1, live: true },
  ],
  animated: true,
  init: () => ({ th: 0 }),
  step(s, p, dt) { s.th += (p.v / p.r) * dt; },
  draw(c, s, p, w, h) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38 * (0.4 + (p.r / 8) * 0.6);
    c.strokeStyle = '#D8D0B8'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    const x = cx + R * Math.cos(s.th), y = cy - R * Math.sin(s.th);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(cx, cy, 5, 0, 7); c.fill();
    c.fillStyle = TEAL; c.beginPath(); c.arc(x, y, 10 + p.m * 2, 0, 7); c.fill();
    const Fc = (p.m * p.v ** 2) / p.r, fl = clamp(Fc * 1.5, 14, 90);
    arrow(c, x, y, x - (fl * (x - cx)) / R, y - (fl * (y - cy)) / R, RED, 3);
    arrow(c, x, y, x + 0.6 * p.v * 6 * -Math.sin(s.th), y - 0.6 * p.v * 6 * Math.cos(s.th), TEAL, 3);
    label(c, 'F (red) → centre,  v (green) → tangent', 12, 22);
  },
  readings: (s, p) => [
    { label: l3('a = v²/r', 'a = v²/r', 'a = v²/r'), value: `${fmt(p.v ** 2 / p.r, 2)} m/s²` },
    { label: l3('Force F', 'बल F', 'ಬಲ F'), value: `${fmt((p.m * p.v ** 2) / p.r, 2)} N` },
    { label: l3('Period T', 'आवर्तकाल T', 'ಆವರ್ತ ಕಾಲ T'), value: `${fmt((2 * Math.PI * p.r) / p.v, 2)} s` },
    { label: l3('ω = v/r', 'ω = v/r', 'ω = v/r'), value: `${fmt(p.v / p.r, 2)} rad/s` },
  ],
};

/* ================= 11. Pressure in a liquid ================= */
export const pressure: SimDef<Record<string, never>> = {
  id: 'pressure',
  title: l3('Pressure in a liquid', 'द्रव में दाब', 'ದ್ರವದಲ್ಲಿ ಒತ್ತಡ'),
  formula: 'p = h ρ g   |   absolute pressure = p₀ + hρg   |   p = F / A',
  what: l3('A diver goes deeper in a tank. The gauge shows how pressure grows with depth.', 'गोताखोर टंकी में और गहरे जाता है। गेज दिखाता है कि गहराई के साथ दाब कैसे बढ़ता है।', 'ಮುಳುಗುಗಾರ ತೊಟ್ಟಿಯಲ್ಲಿ ಆಳಕ್ಕೆ ಹೋಗುತ್ತಾನೆ. ಗೇಜ್ ಆಳದೊಂದಿಗೆ ಒತ್ತಡ ಹೇಗೆ ಹೆಚ್ಚುತ್ತದೆ ತೋರಿಸುತ್ತದೆ.'),
  why: l3('A taller column of liquid above you weighs more, so it presses harder. A denser liquid weighs more for the same height.', 'आपके ऊपर द्रव का स्तंभ जितना ऊँचा, उतना भारी और उतना अधिक दाब। सघन द्रव समान ऊँचाई पर अधिक भारी होता है।', 'ನಿಮ್ಮ ಮೇಲಿನ ದ್ರವ ಸ್ತಂಭ ಎತ್ತರವಾದಷ್ಟು ಭಾರ ಮತ್ತು ಒತ್ತಡ ಹೆಚ್ಚು. ಸಾಂದ್ರ ದ್ರವ ಅದೇ ಎತ್ತರಕ್ಕೆ ಹೆಚ್ಚು ಭಾರ.'),
  principle: l3('Liquid pressure depends only on depth and density, not on the shape of the container.', 'द्रव दाब केवल गहराई और घनत्व पर निर्भर है, बर्तन के आकार पर नहीं।', 'ದ್ರವ ಒತ್ತಡ ಆಳ ಮತ್ತು ಸಾಂದ್ರತೆಯ ಮೇಲೆ ಮಾತ್ರ, ಪಾತ್ರೆಯ ಆಕಾರದ ಮೇಲಲ್ಲ.'),
  whatIf: [
    l3('Every 10 m of water adds about 1 atmosphere.', 'जल के हर 10 m पर लगभग 1 वायुमंडलीय दाब बढ़ता है।', 'ನೀರಿನ ಪ್ರತಿ 10 m ಗೆ ಸುಮಾರು 1 ವಾತಾವರಣ ಒತ್ತಡ ಹೆಚ್ಚುತ್ತದೆ.'),
    l3('Salt water (1030) gives slightly more pressure than fresh water at the same depth.', 'खारा पानी (1030) समान गहराई पर मीठे पानी से थोड़ा अधिक दाब देता है।', 'ಉಪ್ಪು ನೀರು (1030) ಅದೇ ಆಳದಲ್ಲಿ ಸಿಹಿ ನೀರಿಗಿಂತ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಒತ್ತಡ ನೀಡುತ್ತದೆ.'),
  ],
  params: [
    { key: 'h', label: l3('Depth h', 'गहराई h', 'ಆಳ h'), min: 0, max: 10, step: 0.5, unit: 'm', def: 3, live: true },
    { key: 'rho', label: l3('Liquid density ρ', 'द्रव का घनत्व ρ', 'ದ್ರವ ಸಾಂದ್ರತೆ ρ'), min: 800, max: 1300, step: 10, unit: 'kg/m³', def: 1000, live: true },
  ],
  animated: false,
  init: () => ({}),
  step() {},
  draw(c, s, p, w, h) {
    const tx = 20, tw = w * 0.5, top = 30, ppm = (h - 60) / 10;
    c.fillStyle = `rgba(56,160,220,${0.25 + (p.rho - 800) / 1500})`; c.fillRect(tx, top, tw, h - 30 - top);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, top - 8); c.lineTo(tx, h - 30); c.lineTo(tx + tw, h - 30); c.lineTo(tx + tw, top - 8); c.stroke();
    const dy = top + p.h * ppm;
    c.fillStyle = AMBER; c.beginPath(); c.arc(tx + tw / 2, dy, 12, 0, 7); c.fill();
    c.strokeStyle = INK; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(tx, dy); c.lineTo(tx + tw, dy); c.stroke(); c.setLineDash([]);
    arrow(c, tx + tw / 2 - 40, top, tx + tw / 2 - 40, dy, TEAL, 2.5); label(c, `h=${p.h} m`, tx + tw / 2 - 36, (top + dy) / 2, TEAL, 12);
    const gx = w * 0.78, gy = h / 2, gr = 62, pg = p.rho * G * p.h, tot = 101325 + pg, frac = clamp(tot / (101325 * 2.2), 0, 1);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(gx, gy, gr, 0, 7); c.stroke();
    const a = Math.PI * 0.8 + frac * Math.PI * 1.4;
    arrow(c, gx, gy, gx + gr * 0.8 * Math.cos(a), gy + gr * 0.8 * Math.sin(a), RED, 3);
    label(c, `${fmt(tot / 101325, 2)} atm`, gx, gy + gr + 20, INK, 14, 'center');
  },
  readings: (s, p) => [
    { label: l3('Liquid pressure hρg', 'द्रव दाब hρg', 'ದ್ರವ ಒತ್ತಡ hρg'), value: `${fmt(p.h * p.rho * G, 0)} Pa` },
    { label: l3('Absolute (with air)', 'कुल (वायु सहित)', 'ಒಟ್ಟು (ಗಾಳಿ ಸೇರಿ)'), value: `${fmt(101325 + p.h * p.rho * G, 0)} Pa` },
    { label: l3('In atmospheres', 'वायुमंडल में', 'ವಾತಾವರಣಗಳಲ್ಲಿ'), value: `${fmt((101325 + p.h * p.rho * G) / 101325, 2)} atm` },
  ],
};

export const MECHANICS_SIMS = [collision, kinematics, incline, pendulum, springmass, lever, buoyancy, workenergy, orbit, circular, pressure];
