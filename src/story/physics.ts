/**
 * Physics used by the 3D story lessons. Everything the 3D scenes draw (rays, images,
 * currents, field lines, forces) is computed here from the scene state, so the story
 * animation and the hands-on experiment are always physically correct.
 *
 * Optics units are scene units (1 unit = 10 cm). Light travels left → right (+x),
 * the mirror or lens sits at x = 0, and the New Cartesian sign convention is used.
 */

export type P2 = [number, number];

/* ---------------- mirrors and lenses ---------------- */

export interface ImageResult {
  v: number; // image distance (Infinity when the object is at the focus)
  m: number; // magnification
  real: boolean;
  atInfinity: boolean;
}

/** Mirror: 1/v + 1/u = 1/f (f < 0 concave, f > 0 convex). */
export function mirrorImage(u: number, f: number): ImageResult {
  const inv = 1 / f - 1 / u;
  if (Math.abs(inv) < 1e-6) return { v: Infinity, m: Infinity, real: false, atInfinity: true };
  const v = 1 / inv;
  return { v, m: -v / u, real: v < 0, atInfinity: false };
}

/** Thin lens: 1/v − 1/u = 1/f (f > 0 convex, f < 0 concave). */
export function lensImage(u: number, f: number): ImageResult {
  const inv = 1 / f + 1 / u;
  if (Math.abs(inv) < 1e-6) return { v: Infinity, m: Infinity, real: false, atInfinity: true };
  const v = 1 / inv;
  return { v, m: v / u, real: v > 0, atInfinity: false };
}

export interface RaySeg {
  pts: P2[];
  dashed?: boolean; // virtual (extended back) part
  color?: string;
}

/**
 * The three standard rays from the object tip (u, h): parallel to the axis, through the
 * pole / optical centre, and through (or towards) the focus. Paraxial: bending happens at x = 0.
 * Outgoing rays pass through the real image, or appear to come from the virtual image.
 */
export function principalRays(kind: 'mirror' | 'lens', u: number, h: number, f: number, aperture: number, reach = 7): RaySeg[] {
  const img = kind === 'mirror' ? mirrorImage(u, f) : lensImage(u, f);
  const hImg = img.atInfinity ? 0 : img.m * h;
  const yF = kind === 'mirror' ? (-h * f) / (u - f) : (h * f) / (u + f);
  const hits = [h, 0, yF].filter((y, i, arr) => Math.abs(y) <= aperture && arr.indexOf(y) === i);
  const out: RaySeg[] = [];
  const dirOut = kind === 'mirror' ? -1 : 1; // which way light leaves the element
  for (const y of hits) {
    out.push({ pts: [[u, h], [0, y]] });
    if (img.atInfinity) {
      // all outgoing rays parallel to the one through the pole / centre
      const slope = kind === 'mirror' ? -h / u : h / u;
      const x2 = dirOut * reach;
      out.push({ pts: [[0, y], [x2, y + slope * x2 * (kind === 'mirror' ? 1 : 1)]] });
      continue;
    }
    const ix = img.v;
    const towardImage = kind === 'mirror' ? ix < 0 : ix > 0;
    // direction of the outgoing ray (unit along dirOut in x)
    let sx: number;
    let sy: number;
    if (towardImage) {
      sx = ix - 0;
      sy = hImg - y;
    } else {
      sx = 0 - ix;
      sy = y - hImg;
    }
    if (Math.sign(sx) !== dirOut) {
      sx = -sx;
      sy = -sy;
    }
    const k = reach / Math.max(Math.abs(sx), 1e-6);
    out.push({ pts: [[0, y], [sx * k, y + sy * k]] });
    if (!towardImage) out.push({ pts: [[0, y], [ix, hImg]], dashed: true });
  }
  return out;
}

/** Parallel beam (object far away) at several heights. */
export function parallelBeam(kind: 'mirror' | 'lens', f: number, heights: number[], reach = 7): RaySeg[] {
  const out: RaySeg[] = [];
  const fx = kind === 'mirror' ? f : f; // mirror focus at x=f; lens second focus at x=f
  const converging = kind === 'mirror' ? f < 0 : f > 0;
  const dirOut = kind === 'mirror' ? -1 : 1;
  for (const y of heights) {
    out.push({ pts: [[-reach, y], [0, y]] });
    // outgoing ray passes through (or appears to come from) the focus at (fx, 0)
    let sx = converging ? fx : -fx;
    let sy = converging ? -y : y;
    if (Math.sign(sx) !== dirOut) {
      sx = -sx;
      sy = -sy;
    }
    const k = reach / Math.abs(sx);
    out.push({ pts: [[0, y], [sx * k, y + sy * k]] });
    if (!converging) out.push({ pts: [[0, y], [fx, 0]], dashed: true });
  }
  return out;
}

/** How a textbook describes an image. */
export function describeImage(kind: 'mirror' | 'lens', img: ImageResult) {
  if (img.atInfinity) return { real: false, erect: false, size: 'at infinity' };
  const mag = Math.abs(img.m);
  return {
    real: img.real,
    erect: img.m > 0,
    size: mag > 1.05 ? 'enlarged' : mag < 0.95 ? 'diminished' : 'same size',
    side: kind === 'mirror' ? (img.v < 0 ? 'in front of the mirror' : 'behind the mirror') : img.v > 0 ? 'other side of the lens' : 'same side as the object',
  };
}

/* ---------------- refraction ---------------- */

const deg = Math.PI / 180;

/** Snell's law: returns the refracted angle in degrees, or null for total internal reflection. */
export function snell(iDeg: number, n1: number, n2: number): number | null {
  const s = (n1 / n2) * Math.sin(iDeg * deg);
  return Math.abs(s) > 1 ? null : Math.asin(s) / deg;
}

/** Vector refraction in 2D. `nrm` is the unit surface normal pointing back towards the incoming ray. */
export function refractVec(d: P2, nrm: P2, n1: number, n2: number): P2 | null {
  const eta = n1 / n2;
  const cosi = -(d[0] * nrm[0] + d[1] * nrm[1]);
  const k = 1 - eta * eta * (1 - cosi * cosi);
  if (k < 0) return null;
  const a = eta * cosi - Math.sqrt(k);
  return [eta * d[0] + a * nrm[0], eta * d[1] + a * nrm[1]];
}

/** Rectangular glass slab between x = −t/2 and x = t/2. Ray hits the left face at height y0. */
export function slabPath(iDeg: number, n: number, t = 3, y0 = 0.9, reach = 6) {
  const r = snell(iDeg, 1, n)!;
  const din: P2 = [Math.cos(iDeg * deg), -Math.sin(iDeg * deg)];
  const start: P2 = [-t / 2 - reach * din[0], y0 + reach * Math.sin(iDeg * deg)];
  const a: P2 = [-t / 2, y0];
  const b: P2 = [t / 2, y0 - t * Math.tan(r * deg)];
  const end: P2 = [b[0] + reach * din[0], b[1] + reach * din[1]];
  const shift = (t * Math.sin((iDeg - r) * deg)) / Math.cos(r * deg);
  return { start, a, b, end, r, shift, inside: [a, b] as P2[] };
}

/** Visible colours with refractive indices of crown glass. */
export const SPECTRUM = [
  { name: 'violet', color: '#8B5CF6', n: 1.532 },
  { name: 'indigo', color: '#4F46E5', n: 1.528 },
  { name: 'blue', color: '#2563EB', n: 1.524 },
  { name: 'green', color: '#16A34A', n: 1.519 },
  { name: 'yellow', color: '#EAB308', n: 1.517 },
  { name: 'orange', color: '#F97316', n: 1.515 },
  { name: 'red', color: '#DC2626', n: 1.513 },
];

/** Equilateral prism (side s, base on y = −h/3·…), white ray entering the left face. */
export function prismPaths(iDeg: number, spread: number, s = 3.2) {
  const h = (s * Math.sqrt(3)) / 2;
  const A: P2 = [0, (2 * h) / 3]; // apex
  const L: P2 = [-s / 2, -h / 3];
  const R: P2 = [s / 2, -h / 3];
  // left face from L to A; outward normal points up-left
  const lf: P2 = [A[0] - L[0], A[1] - L[1]];
  const lfLen = Math.hypot(lf[0], lf[1]);
  const nL: P2 = [-lf[1] / lfLen, lf[0] / lfLen]; // (-dy, dx) → points left/up
  const rf: P2 = [A[0] - R[0], A[1] - R[1]];
  const rfLen = Math.hypot(rf[0], rf[1]);
  const nR: P2 = [rf[1] / rfLen, -rf[0] / rfLen]; // outward to the right/up
  const hit: P2 = [L[0] + lf[0] * 0.45, L[1] + lf[1] * 0.45];
  // incoming direction makes angle i with the inward normal (−nL)
  const inward: P2 = [-nL[0], -nL[1]];
  const ang = Math.atan2(inward[1], inward[0]) + iDeg * deg;
  const d: P2 = [Math.cos(ang), Math.sin(ang)];
  const start: P2 = [hit[0] - d[0] * 5, hit[1] - d[1] * 5];
  const rays = SPECTRUM.map((c) => {
    // exaggerate the spread of n so the colours can be seen
    const n = 1.522 + (c.n - 1.522) * spread;
    const d1 = refractVec(d, nL, 1, n);
    if (!d1) return null;
    // intersect with right face: hit + t*d1 = R + u*rf
    const det = d1[0] * -rf[1] - d1[1] * -rf[0];
    const tt = ((R[0] - hit[0]) * -rf[1] - (R[1] - hit[1]) * -rf[0]) / det;
    const p2: P2 = [hit[0] + tt * d1[0], hit[1] + tt * d1[1]];
    const d2 = refractVec(d1, [-nR[0], -nR[1]], n, 1);
    if (!d2) return null;
    const end: P2 = [p2[0] + d2[0] * 6, p2[1] + d2[1] * 6];
    const deviation = (Math.acos(Math.max(-1, Math.min(1, d[0] * d2[0] + d[1] * d2[1]))) / deg);
    return { ...c, inside: [hit, p2] as P2[], out: [p2, end] as P2[], deviation };
  });
  return { tri: [L, A, R] as P2[], start, hit, rays: rays.filter(Boolean) as NonNullable<(typeof rays)[number]>[] };
}

/* ---------------- the eye (paraxial thin lenses) ---------------- */

export interface ThinLens {
  x: number;
  f: number;
}

/** Trace one paraxial ray through thin lenses until x = endX. */
export function traceParaxial(x0: number, y0: number, slope: number, lenses: ThinLens[], endX: number): P2[] {
  const pts: P2[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  let s = slope;
  for (const l of [...lenses].sort((a, b) => a.x - b.x)) {
    if (l.x <= x || l.x > endX) continue;
    y += s * (l.x - x);
    x = l.x;
    pts.push([x, y]);
    s -= y / l.f;
  }
  y += s * (endX - x);
  pts.push([endX, y]);
  return pts;
}

export const EYE = {
  lensX: 0,
  near: -6, // near point (25 cm on the real eye) in scene units
  spectacleX: -0.9,
};

export type EyeDefect = 'none' | 'myopia' | 'hypermetropia';

/** Eyeball length and the focal-length range the eye lens can reach for each eye type. */
export function eyeModel(defect: EyeDefect) {
  if (defect === 'myopia') return { retinaX: 2.9, fRelaxed: 2.4, fMin: 1.72 };
  if (defect === 'hypermetropia') return { retinaX: 2.0, fRelaxed: 2.0, fMin: 1.62 };
  return { retinaX: 2.4, fRelaxed: 2.4, fMin: 1.7 };
}

/** Focal length of the spectacle lens that puts the image on the retina. */
export function correctiveLens(defect: EyeDefect, objectX: number | null): number | null {
  if (defect === 'none') return null;
  const m = eyeModel(defect);
  const fEye = defect === 'myopia' ? m.fRelaxed : m.fMin;
  // object position (seen by the eye lens) that it can focus on the retina
  const invU = 1 / m.retinaX - 1 / fEye;
  const uEye = 1 / invU; // negative: virtual object in front of the eye
  const imgX = EYE.lensX + uEye; // where the spectacle lens must form its image
  const v1 = imgX - EYE.spectacleX;
  if (objectX === null) return v1; // parallel light: f = v
  const u1 = objectX - EYE.spectacleX;
  return 1 / (1 / v1 - 1 / u1);
}

/* ---------------- circuits ---------------- */

export const VOLTMETER_R = 1e6;

export interface CircuitSolution {
  req: number;
  current: number;
  branchCurrent: number[];
  branchVoltage: number[];
  power: number[];
}

/** Ideal battery (no internal resistance, as in textbook problems). `open[i]` marks a blown bulb / broken branch. */
export function solveCircuit(V: number, rs: number[], layout: 'series' | 'parallel', open: boolean[] = [], extraSeries = 0, rInternal = 0): CircuitSolution {
  if (layout === 'series') {
    if (open.some(Boolean)) return { req: Infinity, current: 0, branchCurrent: rs.map(() => 0), branchVoltage: rs.map((_, i) => (open[i] ? V : 0)), power: rs.map(() => 0) };
    const req = rs.reduce((a, b) => a + b, 0) + extraSeries;
    const I = V / (req + rInternal);
    return { req, current: I, branchCurrent: rs.map(() => I), branchVoltage: rs.map((r) => I * r), power: rs.map((r) => I * I * r) };
  }
  const g = rs.reduce((a, r, i) => a + (open[i] ? 0 : 1 / r), 0);
  const req = (g > 0 ? 1 / g : Infinity) + extraSeries;
  const I = Number.isFinite(req) ? V / (req + rInternal) : 0;
  const vAcross = Number.isFinite(req) ? I * (req - extraSeries) : 0;
  const bi = rs.map((r, i) => (open[i] ? 0 : vAcross / r));
  return { req, current: I, branchCurrent: bi, branchVoltage: rs.map(() => vAcross), power: rs.map((r, i) => (open[i] ? 0 : (vAcross * vAcross) / r)) };
}

/** R = ρL/A for the test wire (nichrome, ρ = 1.1e-6 Ω·m). L in m, A in mm². */
export function wireResistance(Lm: number, Amm2: number, rho = 1.1e-6) {
  return (rho * Lm) / (Amm2 * 1e-6);
}

/* ---------------- magnetism ---------------- */

/** Field of a pair of magnetic poles (+1 at xN, −1 at xS) in the x–z plane. */
export function dipoleField(x: number, z: number, xN: number, xS: number): P2 {
  const f = (px: number, q: number): P2 => {
    const dx = x - px;
    const dz = z;
    const r3 = Math.pow(dx * dx + dz * dz + 0.02, 1.5);
    return [(q * dx) / r3, (q * dz) / r3];
  };
  const a = f(xN, 1);
  const b = f(xS, -1);
  return [a[0] + b[0], a[1] + b[1]];
}

/** Field lines leaving the N pole and ending at the S pole (or the edge). */
export function fieldLines(xN: number, xS: number, count = 12, bound = 5): P2[][] {
  const lines: P2[][] = [];
  for (let k = 0; k < count; k++) {
    const a = ((k + 0.5) / count) * Math.PI * 2;
    let x = xN + Math.cos(a) * 0.12;
    let z = Math.sin(a) * 0.12;
    const pts: P2[] = [[x, z]];
    for (let s = 0; s < 900; s++) {
      const [bx, bz] = dipoleField(x, z, xN, xS);
      const len = Math.hypot(bx, bz) || 1;
      x += (bx / len) * 0.04;
      z += (bz / len) * 0.04;
      pts.push([x, z]);
      if (Math.hypot(x - xS, z) < 0.1 || Math.abs(x) > bound || Math.abs(z) > bound) break;
    }
    lines.push(pts);
  }
  return lines;
}

/** Force on a straight conductor: F = I L × B (all vectors as [x, y, z]). */
export function forceOnWire(I: number, dir: [number, number, number], B: [number, number, number], L = 1): [number, number, number] {
  return [
    I * L * (dir[1] * B[2] - dir[2] * B[1]),
    I * L * (dir[2] * B[0] - dir[0] * B[2]),
    I * L * (dir[0] * B[1] - dir[1] * B[0]),
  ];
}

/* ---------------- household wiring ---------------- */

export const APPLIANCES = [
  { key: 'bulb', watts: 100 },
  { key: 'fan', watts: 75 },
  { key: 'heater', watts: 2000 },
  { key: 'iron', watts: 1000 },
] as const;

/**
 * Current drawn by the house. A short circuit, or a live wire touching an earthed metal body,
 * lets a very large current flow through almost no resistance, so the fuse blows.
 * Without an earth wire the fault current goes through a person instead: small enough not to
 * blow the fuse, large enough to be dangerous.
 */
export function houseLoad(on: Record<string, number>, fuseA: number, fault: 'none' | 'short' | 'earth', earthing = true, mains = 220) {
  const watts = APPLIANCES.reduce((a, ap) => a + (on[ap.key] ? ap.watts : 0), 0);
  const bigFault = fault === 'short' || (fault === 'earth' && earthing);
  const current = bigFault ? 999 : watts / mains;
  return { watts, current, blown: bigFault || current > fuseA };
}
