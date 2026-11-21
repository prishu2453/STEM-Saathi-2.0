/**
 * 3D stage for the story lessons. Three scene kits (optics bench, circuit board,
 * magnetism & house wiring) draw what physics.ts computes from a flat scene state.
 * Numeric state values glide between story beats, so a beat that changes the object
 * distance or the current visibly animates the change, like a video.
 */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as P from './physics';

export type KitName = 'optics' | 'circuit' | 'magnet';
export type SceneState = Record<string, number | string>;
/** Camera: position x, y, z then look-at x, y, z. */
export type Cam = [number, number, number, number, number, number];

export const DEFAULT_CAM: Record<KitName, Cam> = {
  optics: [0, 0.6, 11, 0, 0, 0],
  circuit: [0, 7, 7.5, 0, 0, 0],
  magnet: [0, 5.5, 7, 0, 0.5, 0],
};

const num = (s: SceneState, k: string, d = 0) => (typeof s[k] === 'number' ? (s[k] as number) : d);
const str = (s: SceneState, k: string, d: string): string => (typeof s[k] === "string" ? (s[k] as string) : d);
const r2 = (x: number) => Math.round(x * 100) / 100;

/* ---------------- drawing helpers ---------------- */

interface Ctx {
  res: THREE.Vector2;
  scene: THREE.Scene;
  bg: THREE.Color;
}

function ln(ctx: Ctx, pts: number[][], color: string, width = 3, dashed = false, opacity = 1): Line2 {
  const g = new LineGeometry();
  g.setPositions(pts.flat());
  const m = new LineMaterial({
    color: new THREE.Color(color).getHex(),
    linewidth: width,
    dashed,
    dashSize: 0.18,
    gapSize: 0.13,
    transparent: opacity < 1,
    opacity,
  });
  m.resolution.copy(ctx.res);
  const l = new Line2(g, m);
  l.computeLineDistances();
  return l;
}
const p3 = (p: P.P2, z = 0) => [p[0], p[1], z];

function label(text: string, color = '#2E1A6E', size = 12, bg = 'rgba(255,255,255,0.92)'): CSS2DObject {
  const d = document.createElement('div');
  d.textContent = text;
  d.style.cssText = `font:800 ${size}px Nunito,system-ui,sans-serif;color:${color};background:${bg};padding:1px 7px;border-radius:8px;white-space:nowrap;pointer-events:none;border:1.5px solid ${color}55;`;
  return new CSS2DObject(d);
}
function setLabel(o: CSS2DObject | undefined, text: string) {
  if (o && o.element.textContent !== text) o.element.textContent = text;
}

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });

function arrowMesh(a: THREE.Vector3, b: THREE.Vector3, color: string, r = 0.05): THREE.Group {
  const g = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 1e-4) return g;
  const head = Math.min(0.35, len * 0.4);
  const m = std(color, { emissive: color, emissiveIntensity: 0.25 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len - head, 12), m);
  shaft.position.y = (len - head) / 2;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 2.6, head, 16), m);
  cone.position.y = len - head / 2;
  g.add(shaft, cone);
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return g;
}

function clearGroup(g: THREE.Object3D) {
  g.traverse((o) => {
    const css = o as CSS2DObject;
    if ((css as unknown as { isCSS2DObject?: boolean }).isCSS2DObject) css.element.remove();
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
  while (g.children.length) g.remove(g.children[0]);
}

function sigOf(s: SceneState, keys: string[]) {
  return keys.map((k) => (typeof s[k] === 'number' ? r2(s[k] as number) : s[k] ?? '')).join('|');
}

/** Point at distance d along a polyline, plus the segment index. */
function along(path: THREE.Vector3[], lens: number[], d: number): THREE.Vector3 {
  let rem = d;
  for (let i = 0; i < lens.length; i++) {
    if (rem <= lens[i]) return new THREE.Vector3().lerpVectors(path[i], path[i + 1], rem / lens[i]);
    rem -= lens[i];
  }
  return path[path.length - 1].clone();
}
const segLens = (path: THREE.Vector3[]) => path.slice(1).map((p, i) => p.distanceTo(path[i]));

interface Kit {
  root: THREE.Group;
  update(s: SceneState): void;
  tick(t: number, dt: number, s: SceneState): void;
}

/* ======================= OPTICS ======================= */

function lensMesh(convex: boolean, ap = 1.7): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  const thick = (r: number) => (convex ? 0.55 - 0.49 * (r / ap) ** 2 : 0.12 + 0.42 * (r / ap) ** 2);
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * ap;
    pts.push(new THREE.Vector2(r, thick(r) / 2));
  }
  for (let i = N; i >= 0; i--) {
    const r = (i / N) * ap;
    pts.push(new THREE.Vector2(r, -thick(r) / 2));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateZ(-Math.PI / 2);
  return new THREE.Mesh(g, std('#9FD8FF', { transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.1 }));
}

function mirrorMesh(f: number, ap = 1.8): THREE.Mesh {
  const R = Math.abs(2 * f);
  const concave = f < 0;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i++) {
    const r = (i / 20) * ap;
    const sag = (r * r) / (2 * R);
    pts.push(new THREE.Vector2(r, concave ? -sag : sag));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateZ(-Math.PI / 2);
  return new THREE.Mesh(g, std('#E6ECF5', { metalness: 0.9, roughness: 0.15, side: THREE.DoubleSide }));
}

function objectArrow(x: number, h: number, color: string, faded = false): THREE.Group {
  const g = arrowMesh(new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, h, 0), color, 0.06);
  if (faded)
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m) {
        m.transparent = true;
        m.opacity = 0.45;
      }
    });
  return g;
}

function opticsKit(ctx: Ctx): Kit {
  const root = new THREE.Group();
  const dyn = new THREE.Group();
  const bench = new THREE.Mesh(new THREE.BoxGeometry(15, 0.25, 2.6), std('#E9DEFF'));
  bench.position.set(0, -2.3, 0);
  root.add(bench, dyn);
  let sig = '';
  let pulses: { mesh: THREE.Mesh; path: THREE.Vector3[]; lens: number[]; speed: number[]; offset: number }[] = [];
  let star: THREE.Mesh | null = null;
  let airLayers: THREE.Mesh[] = [];

  const RAY = '#FF7A00';
  const VIRT = '#B78BFF';

  function build(s: SceneState) {
    clearGroup(dyn);
    pulses = [];
    star = null;
    airLayers = [];
    const mode = str(s, 'mode', 'convex-lens');
    const labels = num(s, 'labels', 1) > 0.5;
    const showRays = num(s, 'rays', 1) > 0.5;
    const axisLen = mode === 'atmosphere' ? 0 : 7.2;
    ctx.scene.background = ctx.bg;
    bench.visible = mode !== 'atmosphere';
    if (axisLen) dyn.add(ln(ctx, [[-axisLen, 0, 0], [axisLen, 0, 0]], '#9A8FBF', 1.5, true, 0.8));
    const put = (o: CSS2DObject, x: number, y: number, z = 0) => {
      o.position.set(x, y, z);
      dyn.add(o);
    };

    if (mode === 'reflection') {
      const i = num(s, 'incidence', 35);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 2.2), std('#E6ECF5', { metalness: 0.9, roughness: 0.12 }));
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.05, 2.25), std('#3B2C78'));
      back.position.x = 0.1;
      dyn.add(mirror, back);
      const rad = (i * Math.PI) / 180;
      const start: P.P2 = [-4.2 * Math.cos(rad), 4.2 * Math.sin(rad)];
      const end: P.P2 = [-4.2 * Math.cos(rad), -4.2 * Math.sin(rad)];
      dyn.add(ln(ctx, [[-4, 0, 0], [0, 0, 0]], '#2E1A6E', 2, true));
      if (showRays) {
        dyn.add(ln(ctx, [p3(start), [0, 0, 0]], RAY, 5));
        dyn.add(ln(ctx, [[0, 0, 0], p3(end)], RAY, 5));
        dyn.add(arrowMesh(new THREE.Vector3(...(p3([start[0] * 0.55, start[1] * 0.55]) as [number, number, number])), new THREE.Vector3(...(p3([start[0] * 0.45, start[1] * 0.45]) as [number, number, number])), RAY, 0.05));
        dyn.add(arrowMesh(new THREE.Vector3(end[0] * 0.45, end[1] * 0.45, 0), new THREE.Vector3(end[0] * 0.55, end[1] * 0.55, 0), RAY, 0.05));
        const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 20), std('#2E1A6E'));
        torch.position.set(start[0] * 1.08, start[1] * 1.08, 0);
        torch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(rad), -Math.sin(rad), 0));
        dyn.add(torch);
        const arc = (a0: number, a1: number, rr: number) => {
          const pts: number[][] = [];
          for (let k = 0; k <= 20; k++) {
            const a = a0 + ((a1 - a0) * k) / 20;
            pts.push([rr * Math.cos(a), rr * Math.sin(a), 0]);
          }
          return pts;
        };
        dyn.add(ln(ctx, arc(Math.PI - rad, Math.PI, 1.1), '#12A150', 3));
        dyn.add(ln(ctx, arc(Math.PI, Math.PI + rad, 1.3), '#FF5DA2', 3));
        if (labels) {
          put(label(`i = ${Math.round(i)}°`, '#0E8A43'), 1.6 * Math.cos(Math.PI - rad / 2), 1.6 * Math.sin(Math.PI - rad / 2));
          put(label(`r = ${Math.round(i)}°`, '#C2185B'), 1.8 * Math.cos(Math.PI + rad / 2), 1.8 * Math.sin(Math.PI + rad / 2));
          put(label('normal', '#2E1A6E', 11), -3.6, 0.3);
          put(label('mirror', '#2E1A6E', 11), 0.5, 2.2);
        }
      }
      return;
    }

    if (mode === 'plane-mirror') {
      const u = num(s, 'u', -3);
      const h = num(s, 'h', 1);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 2.2), std('#E6ECF5', { metalness: 0.9, roughness: 0.12 }));
      dyn.add(mirror);
      dyn.add(objectArrow(u, h, '#12A150'));
      dyn.add(objectArrow(-u, h, '#7C3AED', true));
      if (showRays) {
        for (const y of [h, h * 0.4]) {
          // ray from tip reflects; reflected ray appears to come from the image tip
          dyn.add(ln(ctx, [[u, h, 0], [0, y, 0]], RAY, 4));
          const sx = 0 - -u;
          const sy = y - h;
          const k = 4 / sx;
          dyn.add(ln(ctx, [[0, y, 0], [-sx * k, y - sy * k, 0]], RAY, 4));
          dyn.add(ln(ctx, [[0, y, 0], [-u, h, 0]], VIRT, 2.5, true));
        }
      }
      if (labels) {
        put(label(`${Math.round(-u * 10)} cm`, '#0E8A43'), u / 2, -0.4);
        put(label(`${Math.round(-u * 10)} cm`, '#6D28D9'), -u / 2, -0.4);
        put(label('image (virtual)', '#6D28D9', 11), -u, h + 0.45);
      }
      return;
    }

    if (mode === 'concave-mirror' || mode === 'convex-mirror' || mode === 'convex-lens' || mode === 'concave-lens') {
      const kind = mode.endsWith('mirror') ? 'mirror' : 'lens';
      const fmag = num(s, 'f', 1.5);
      const f = mode === 'concave-mirror' ? -fmag : mode === 'convex-mirror' ? fmag : mode === 'convex-lens' ? fmag : -fmag;
      dyn.add(kind === 'mirror' ? mirrorMesh(f) : lensMesh(f > 0));
      const beam = num(s, 'beam', 0) > 0.5;
      const u = num(s, 'u', -3);
      const h = num(s, 'h', 1);
      const marks: [string, number][] =
        kind === 'mirror'
          ? [['P', 0], ['F', f], ['C', 2 * f]]
          : [['O', 0], ['F₁', -Math.abs(f)], ['F₂', Math.abs(f)], ['2F₁', -2 * Math.abs(f)], ['2F₂', 2 * Math.abs(f)]];
      for (const [name, x] of marks) {
        if (Math.abs(x) > 7.1) continue;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), std('#2E1A6E'));
        dot.position.set(x, 0, 0);
        dyn.add(dot);
        if (labels) put(label(name, '#2E1A6E', 11), x, -0.35);
      }
      if (beam) {
        if (showRays) for (const seg of P.parallelBeam(kind, f, [1.2, 0.6, -0.6, -1.2])) dyn.add(ln(ctx, seg.pts.map((p) => p3(p)), seg.dashed ? VIRT : RAY, seg.dashed ? 2.5 : 4, !!seg.dashed));
        return;
      }
      dyn.add(objectArrow(u, h, '#12A150'));
      const img = kind === 'mirror' ? P.mirrorImage(u, f) : P.lensImage(u, f);
      if (showRays) for (const seg of P.principalRays(kind, u, h, f, 1.75)) dyn.add(ln(ctx, seg.pts.map((p) => p3(p)), seg.dashed ? VIRT : RAY, seg.dashed ? 2.5 : 4, !!seg.dashed));
      if (num(s, 'image', 1) > 0.5 && !img.atInfinity && Math.abs(img.v) < 7.2 && Math.abs(img.m * h) < 4) {
        dyn.add(objectArrow(img.v, img.m * h, '#7C3AED', !img.real));
        if (labels) put(label(img.real ? 'real image' : 'virtual image', '#6D28D9', 11), img.v, img.m * h + (img.m > 0 ? 0.4 : -0.4));
      } else if (num(s, 'image', 1) > 0.5 && labels) {
        put(label(img.atInfinity ? 'image at infinity' : 'image very far away', '#6D28D9', 11), kind === 'mirror' ? -5.5 : 5.5, 2.2);
      }
      return;
    }

    if (mode === 'slab') {
      const i = num(s, 'incidence', 40);
      const n = num(s, 'n', 1.5);
      const t = 3;
      const block = new THREE.Mesh(new THREE.BoxGeometry(t, 3.4, 2.2), std(n > 2 ? '#C7F0FF' : n > 1.4 ? '#9FD8FF' : '#BEE3FF', { transparent: true, opacity: 0.35, roughness: 0.05 }));
      block.position.y = -0.4;
      dyn.add(block);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(block.geometry), new THREE.LineBasicMaterial({ color: '#6D28D9' }));
      edges.position.copy(block.position);
      dyn.add(edges);
      const path = P.slabPath(i, n, t, 0.9, 3.2);
      if (showRays) {
        dyn.add(ln(ctx, [p3(path.start), p3(path.a)], RAY, 5));
        dyn.add(ln(ctx, [p3(path.a), p3(path.b)], RAY, 5));
        dyn.add(ln(ctx, [p3(path.b), p3(path.end)], RAY, 5));
        // where the ray would have gone without the glass
        if (num(s, 'ghost', 0) > 0.5) dyn.add(ln(ctx, [p3(path.a), [path.a[0] + 5 * Math.cos((i * Math.PI) / 180), path.a[1] - 5 * Math.sin((i * Math.PI) / 180), 0]], VIRT, 2.5, true));
        for (const q of [path.a, path.b]) dyn.add(ln(ctx, [[q[0] - 1.4, q[1], 0], [q[0] + 1.4, q[1], 0]], '#2E1A6E', 2, true));
        if (labels) {
          put(label(`i = ${Math.round(i)}°`, '#0E8A43'), path.a[0] - 1.2, path.a[1] + 0.45);
          put(label(`r = ${Math.round(path.r)}°`, '#C2185B'), path.a[0] + 1.0, path.a[1] - 0.15);
          put(label(`e = ${Math.round(i)}°`, '#0E8A43'), path.b[0] + 1.3, path.b[1] - 0.55);
          put(label(`n = ${n.toFixed(2)}`, '#2E1A6E'), 0, 1.75);
        }
      }
      if (num(s, 'speed', 0) > 0.5) {
        const pathV = [path.start, path.a, path.b, path.end].map((q) => new THREE.Vector3(q[0], q[1], 0));
        for (let k = 0; k < 7; k++) {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), std('#FFE14D', { emissive: '#FFB800', emissiveIntensity: 0.9 }));
          dyn.add(mesh);
          pulses.push({ mesh, path: pathV, lens: segLens(pathV), speed: [1, 1 / n, 1], offset: k / 7 });
        }
      }
      return;
    }

    if (mode === 'prism') {
      const i = num(s, 'incidence', 45);
      const spread = num(s, 'spread', 6);
      const pr = P.prismPaths(i, spread);
      const shape = new THREE.Shape(pr.tri.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
      geo.translate(0, 0, -1);
      dyn.add(new THREE.Mesh(geo, std('#C9E9FF', { transparent: true, opacity: 0.4, roughness: 0.05 })));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#6D28D9' }));
      dyn.add(edges);
      if (showRays) {
        dyn.add(ln(ctx, [p3(pr.start), p3(pr.hit)], '#FFFFFF', 7));
        dyn.add(ln(ctx, [p3(pr.start), p3(pr.hit)], '#FFD54D', 3));
        const screenX = 5.4;
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5, 2.4), std('#FFFFFF'));
        screen.position.set(screenX, -1, 0);
        dyn.add(screen);
        const spotY: number[] = [];
        for (const ray of pr.rays) {
          dyn.add(ln(ctx, ray.inside.map((p) => p3(p)), ray.color, 2.5, false, 0.9));
          const [q, e] = ray.out;
          const tt = (screenX - 0.05 - q[0]) / (e[0] - q[0]);
          const hitPt: P.P2 = [screenX - 0.05, q[1] + (e[1] - q[1]) * tt];
          dyn.add(ln(ctx, [p3(q), p3(hitPt)], ray.color, 3.5));
          const spot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.6), std(ray.color, { emissive: ray.color, emissiveIntensity: 0.8 }));
          spot.position.set(screenX - 0.07, hitPt[1], 0);
          dyn.add(spot);
          spotY.push(hitPt[1]);
        }
        if (labels) {
          put(label('white light', '#2E1A6E', 11), pr.start[0] + 0.6, pr.start[1] + 0.4);
          if (spotY.length) {
            put(label('red bends least', '#DC2626', 11), screenX + 1.1, spotY[spotY.length - 1] + 0.25);
            put(label('violet bends most', '#7C3AED', 11), screenX + 1.1, spotY[0] - 0.25);
          }
        }
      }
      return;
    }

    if (mode === 'eye') {
      const defect = str(s, 'defect', 'none') as P.EyeDefect;
      const far = str(s, 'object', 'far') === 'far';
      const corrected = num(s, 'correction', 0) > 0.5 && defect !== 'none';
      const m = P.eyeModel(defect);
      const objX = far ? null : P.EYE.near;
      const fc = corrected ? P.correctiveLens(defect, objX) : null;
      // where the eye lens sees the object
      let uEye: number;
      if (fc !== null) {
        const u1 = (objX ?? -1e6) - P.EYE.spectacleX;
        const v1 = 1 / (1 / fc + 1 / u1);
        uEye = P.EYE.spectacleX + v1 - P.EYE.lensX;
      } else uEye = (objX ?? -1e6) - P.EYE.lensX;
      const fNeed = 1 / (1 / m.retinaX - 1 / uEye);
      const fEye = Math.min(m.fRelaxed, Math.max(m.fMin, fNeed));
      // eyeball
      const len = m.retinaX + 0.35;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), std('#FFF5F7', { transparent: true, opacity: 0.28, roughness: 0.3 }));
      ball.scale.set(len / 2, 1.45, 1.45);
      ball.position.x = len / 2 - 0.3;
      dyn.add(ball);
      const retina = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.06, 40), std('#FF5DA2', { emissive: '#FF5DA2', emissiveIntensity: 0.25 }));
      retina.rotation.z = Math.PI / 2;
      retina.position.x = m.retinaX;
      dyn.add(retina);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 20), std('#BFE6FF', { transparent: true, opacity: 0.6 }));
      lens.scale.set((0.12 * 2.4) / fEye + 0.06, 1, 1);
      dyn.add(lens);
      const iris = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.12, 12, 40), std('#6D4C2F'));
      iris.rotation.y = Math.PI / 2;
      iris.position.x = -0.25;
      dyn.add(iris);
      if (fc !== null) {
        const spec = lensMesh(fc > 0, 1.2);
        spec.position.x = P.EYE.spectacleX;
        dyn.add(spec);
        if (labels) put(label(fc > 0 ? 'convex lens' : 'concave lens', '#2E1A6E', 11), P.EYE.spectacleX, 1.6);
      }
      const lenses: P.ThinLens[] = [{ x: P.EYE.lensX, f: fEye }];
      if (fc !== null) lenses.push({ x: P.EYE.spectacleX, f: fc });
      const startX = far ? -6.5 : P.EYE.near;
      const heights = [-0.55, -0.28, 0.28, 0.55];
      const ends: number[] = [];
      if (showRays) {
        for (const y of heights) {
          const firstX = fc !== null ? P.EYE.spectacleX : P.EYE.lensX;
          const pts = far ? P.traceParaxial(startX, y, 0, lenses, m.retinaX) : P.traceParaxial(startX, 0, y / (firstX - startX), lenses, m.retinaX);
          dyn.add(ln(ctx, pts.map((p) => p3(p)), RAY, 3.5));
          ends.push(pts[pts.length - 1][1]);
        }
        if (!far) {
          const obj = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), std('#12A150', { emissive: '#12A150', emissiveIntensity: 0.6 }));
          obj.position.set(P.EYE.near, 0, 0);
          dyn.add(obj);
          if (labels) put(label('book at 25 cm', '#0E8A43', 11), P.EYE.near, 0.45);
        } else if (labels) put(label('far-away tree', '#0E8A43', 11), -6, 0.95);
        const blur = Math.max(...ends.map(Math.abs));
        if (blur > 0.04) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(blur, 0.03, 8, 40), std('#E5484D', { emissive: '#E5484D', emissiveIntensity: 0.8 }));
          ring.rotation.y = Math.PI / 2;
          ring.position.x = m.retinaX - 0.04;
          dyn.add(ring);
        }
        if (labels) {
          // where the rays actually meet
          const yA = ends[0];
          const pts0 = far ? P.traceParaxial(startX, heights[0], 0, lenses, m.retinaX) : P.traceParaxial(startX, 0, heights[0] / ((fc !== null ? P.EYE.spectacleX : 0) - startX), lenses, m.retinaX);
          const [xa, ya] = pts0[pts0.length - 2];
          const slope = (yA - ya) / (m.retinaX - xa);
          const focusX = xa - ya / slope;
          const msg = blur <= 0.04 ? 'sharp image on the retina' : focusX < m.retinaX ? 'image forms in front of the retina: blurry' : 'image would form behind the retina: blurry';
          put(label(msg, blur <= 0.04 ? '#0E8A43' : '#D13438', 12), m.retinaX - 0.4, -1.9);
          put(label('retina', '#C2185B', 11), m.retinaX + 0.2, 1.4);
          put(label('eye lens', '#2E1A6E', 11), 0, 1.25);
        }
      }
      return;
    }

    if (mode === 'atmosphere') {
      const e = num(s, 'sun', 60);
      const tt = Math.min(1, Math.max(0, (e - 2) / 50));
      const sky = new THREE.Color('#FF7A3D').lerp(new THREE.Color('#5AA9FF'), tt);
      ctx.scene.background = sky;
      const earth = new THREE.Mesh(new THREE.SphereGeometry(40, 64, 32), std('#3F9B52'));
      earth.position.set(0, -41.2, 0);
      dyn.add(earth);
      const person = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.35, 6, 12), std('#2E1A6E'));
      body.position.y = 0.05;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), std('#C68B59'));
      head.position.y = 0.4;
      person.add(body, head);
      person.position.set(0, -1.0, 1);
      dyn.add(person);
      const rad = (e * Math.PI) / 180;
      const sunPos = new THREE.Vector3(-8 * Math.cos(rad), -1 + 8 * Math.sin(rad), -2);
      const sunCol = new THREE.Color('#FF4D1A').lerp(new THREE.Color('#FFF6C9'), tt);
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshBasicMaterial({ color: sunCol }));
      sun.position.copy(sunPos);
      dyn.add(sun);
      if (showRays) {
        const target = new THREE.Vector3(0, -0.6, 1);
        dyn.add(ln(ctx, [sunPos.toArray(), target.toArray()], '#' + sunCol.getHexString(), 5));
        if (num(s, 'scatter', 0) > 0.5) {
          for (let k = 1; k <= 6; k++) {
            const pnt = new THREE.Vector3().lerpVectors(sunPos, target, k / 7);
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), std('#FFFFFF'));
            dot.position.copy(pnt);
            dyn.add(dot);
            for (let j = 0; j < 4; j++) {
              const a = (j / 4) * Math.PI * 2 + k;
              const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.8, Math.sin(a * 1.7) * 0.6).normalize();
              dyn.add(ln(ctx, [pnt.toArray(), pnt.clone().addScaledVector(dir, 0.75).toArray()], '#1E5BFF', 3));
            }
          }
        }
        if (labels) {
          put(label(e < 15 ? 'long path through air: blue is scattered away, red reaches you' : 'short path: sky looks blue all around', '#2E1A6E', 12), 0, 3.2);
        }
      }
      if (num(s, 'twinkle', 0) > 0.5) {
        star = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }));
        star.position.set(3.5, 4.2, -3);
        dyn.add(star);
        for (let k = 0; k < 3; k++) {
          const layer = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5, 30, 1), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
          layer.position.set(1.8, 1 + k * 1.1, -1);
          airLayers.push(layer);
          dyn.add(layer);
        }
        if (labels) put(label('moving air layers bend starlight', '#2E1A6E', 11), 3.5, 4.8);
      }
    }
  }

  return {
    root,
    update(s) {
      const key = sigOf(s, ['mode', 'u', 'h', 'f', 'incidence', 'n', 'rays', 'image', 'labels', 'beam', 'spread', 'defect', 'object', 'correction', 'sun', 'scatter', 'twinkle', 'speed', 'ghost']);
      if (key !== sig) {
        sig = key;
        build(s);
      }
    },
    tick(t, dt) {
      for (const p of pulses) {
        const total = p.lens.reduce((a, b) => a + b, 0);
        // travel time per unit length is 1/speed on each segment
        const times = p.lens.map((l, i) => l / p.speed[i]);
        const T = times.reduce((a, b) => a + b, 0);
        let tau = ((t * 1.6) / T + p.offset) % 1;
        tau *= T;
        let d = 0;
        for (let i = 0; i < times.length; i++) {
          if (tau <= times[i]) {
            d += tau * p.speed[i];
            break;
          }
          tau -= times[i];
          d += p.lens[i];
        }
        p.mesh.position.copy(along(p.path, p.lens, Math.min(d, total)));
      }
      if (star) star.scale.setScalar(0.7 + 0.6 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1)));
      airLayers.forEach((l, i) => {
        l.position.x = 1.8 + Math.sin(t * (0.8 + i * 0.3)) * 0.5;
      });
      void dt;
    },
  };
}

/* ======================= CIRCUIT ======================= */

function circuitKit(ctx: Ctx): Kit {
  const root = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.2, 6), std('#EFE6FF'));
  board.position.y = -0.12;
  root.add(board);
  const dyn = new THREE.Group();
  root.add(dyn);
  let sig = '';
  interface Comp {
    kind: string;
    glow?: THREE.MeshStandardMaterial;
    light?: THREE.PointLight;
    tag?: CSS2DObject;
  }
  let comps: Comp[] = [];
  let meters: { needle: THREE.Object3D; tag: CSS2DObject; kind: 'A' | 'V'; which: 'main' | 'branch0' }[] = [];
  let paths: { path: THREE.Vector3[]; lens: number[]; total: number; dots: THREE.Mesh[]; branch: number }[] = [];
  let sol: P.CircuitSolution = P.solveCircuit(6, [6], 'series');
  let batteryTag: CSS2DObject | undefined;
  let switchLever: THREE.Object3D | null = null;
  let phase = 0;

  const COPPER = '#C9783F';
  const wire = (pts: THREE.Vector3[], color = COPPER, r = 0.045) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = a.distanceTo(b);
      if (len < 1e-3) continue;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), std(color, { metalness: 0.5, roughness: 0.35 }));
      m.position.copy(a).lerp(b, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
      dyn.add(m);
    }
  };

  function meter(pos: THREE.Vector3, kind: 'A' | 'V', which: 'main' | 'branch0', rotY = 0) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.6), std(kind === 'A' ? '#2E1A6E' : '#B4430C'));
    box.position.y = 0.16;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), std('#FFFFFF'));
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.33;
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.2), std('#E5484D'));
    needle.position.set(0, 0.34, 0);
    needle.geometry.translate(0, 0, -0.1);
    g.add(box, face, needle);
    g.position.copy(pos);
    g.rotation.y = rotY;
    dyn.add(g);
    const tag = label(kind, kind === 'A' ? '#2E1A6E' : '#B4430C', 12);
    tag.position.set(pos.x, 0.85, pos.z);
    dyn.add(tag);
    meters.push({ needle, tag, kind, which });
  }

  function component(kind: string, pos: THREE.Vector3, alongX: boolean, idx: number, s: SceneState) {
    const g = new THREE.Group();
    g.position.copy(pos);
    if (!alongX) g.rotation.y = Math.PI / 2;
    const blown = Math.round(num(s, 'blown', 0)) === idx + 1;
    const c: Comp = { kind };
    if (kind === 'bulb') {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 16), std('#9A8FBF', { metalness: 0.6 }));
      base.position.y = 0.14;
      const glowMat = new THREE.MeshStandardMaterial({ color: blown ? '#7A7390' : '#FFF6D8', emissive: '#FFC93D', emissiveIntensity: 0, transparent: true, opacity: 0.85, roughness: 0.15 });
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 18), glowMat);
      glass.position.y = 0.55;
      const fil = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 20, Math.PI), std('#5A4B2B'));
      fil.position.y = 0.55;
      g.add(base, glass, fil);
      const light = new THREE.PointLight('#FFC93D', 0, 4);
      light.position.y = 0.6;
      g.add(light);
      c.glow = glowMat;
      c.light = light;
    } else if (kind === 'heater') {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2 * 9;
        pts.push(new THREE.Vector3(-0.65 + (1.3 * k) / 160, 0.25 + 0.16 * Math.sin(a), 0.16 * Math.cos(a)));
      }
      const glowMat = new THREE.MeshStandardMaterial({ color: '#8A4B2A', emissive: '#FF3B1F', emissiveIntensity: 0, roughness: 0.4 });
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, 0.025, 6), glowMat));
      c.glow = glowMat;
    } else if (kind === 'wire') {
      const L = num(s, 'wireL', 1);
      const A = num(s, 'wireA', 1);
      const len = 0.5 + 1.0 * L;
      const glowMat = new THREE.MeshStandardMaterial({ color: '#8C8C9A', emissive: '#FF3B1F', emissiveIntensity: 0, metalness: 0.6, roughness: 0.3 });
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * Math.sqrt(A), 0.035 * Math.sqrt(A), len, 12), glowMat);
      m.rotation.z = Math.PI / 2;
      m.position.y = 0.12;
      g.add(m);
      c.glow = glowMat;
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.26), std('#F2D7A6'));
      body.position.y = 0.15;
      g.add(body);
      ['#8B4513', '#111111', '#DC2626'].forEach((col, k) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.28), std(col));
        band.position.set(-0.2 + k * 0.14, 0.15, 0);
        g.add(band);
      });
    }
    dyn.add(g);
    c.tag = label('', '#2E1A6E', 11);
    c.tag.position.set(pos.x, kind === 'bulb' ? 1.15 : 0.7, pos.z);
    dyn.add(c.tag);
    comps.push(c);
  }

  function build(s: SceneState) {
    clearGroup(dyn);
    comps = [];
    meters = [];
    paths = [];
    switchLever = null;
    const layout = str(s, 'layout', 'series');
    const count = Math.max(1, Math.min(3, Math.round(num(s, 'count', 1))));
    const load = str(s, 'load', 'bulb');
    const vm = str(s, 'voltmeter', 'none');
    const two = num(s, 'ammeters', 1) > 1.5;
    const showCharges = num(s, 'charges', 1) > 0.5;
    const X0 = -3.6;
    const ZT = -1.7;
    const ZB = 1.7;
    // battery on the left side
    const batt = new THREE.Group();
    for (const dz of [-0.28, 0.28]) {
      const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 24), std('#2E1A6E'));
      cell.rotation.x = Math.PI / 2;
      cell.position.set(0, 0.25, dz);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), std('#FF9F1C', { metalness: 0.6 }));
      cap.rotation.x = Math.PI / 2;
      cap.position.set(0, 0.25, dz - 0.32);
      batt.add(cell, cap);
    }
    batt.position.set(X0, 0, 0);
    dyn.add(batt);
    batteryTag = label('', '#2E1A6E', 12);
    batteryTag.position.set(X0 - 0.2, 0.95, 0);
    dyn.add(batteryTag);
    const plus = label('+', '#B4430C', 13);
    plus.position.set(X0 + 0.35, 0.5, -0.6);
    dyn.add(plus);

    const v = (x: number, z: number) => new THREE.Vector3(x, 0.08, z);
    if (layout === 'series') {
      const xs = count === 1 ? [0.6] : count === 2 ? [-0.4, 1.8] : [-1.1, 0.7, 2.4];
      const loop = [v(X0, -0.6), v(X0, ZT), v(3.6, ZT), v(3.6, ZB), v(X0, ZB), v(X0, 0.6)];
      wire(loop);
      xs.forEach((x, i) => component(load, v(x, ZT), true, i, s));
      if (vm === 'series') meter(v(-2.5, ZT), 'V', 'main');
      else if (two) meter(v(-2.5, ZT), 'A', 'main');
      meter(v(3.6, 0), 'A', 'main', Math.PI / 2);
      // switch on the bottom rail
      const sw = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12), std('#2E1A6E'));
      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.08), std('#FF9F1C'));
      lever.geometry.translate(0.3, 0, 0);
      lever.position.y = 0.12;
      sw.add(post, lever);
      sw.position.set(-1.5, 0.05, ZB);
      dyn.add(sw);
      switchLever = lever;
      paths.push({ path: [...loop, v(X0, -0.6)], lens: [], total: 0, dots: [], branch: -1 });
      if (vm === 'parallel') {
        const x = xs[0];
        meter(new THREE.Vector3(x, 0.05, ZT - 1.1), 'V', 'branch0');
        wire([v(x - 0.55, ZT), new THREE.Vector3(x - 0.55, 0.4, ZT - 0.6), new THREE.Vector3(x - 0.3, 0.3, ZT - 1.0)], '#E5484D', 0.025);
        wire([v(x + 0.55, ZT), new THREE.Vector3(x + 0.55, 0.4, ZT - 0.6), new THREE.Vector3(x + 0.3, 0.3, ZT - 1.0)], '#222222', 0.025);
      }
    } else {
      const xs = count === 1 ? [1.4] : count === 2 ? [0.4, 2.4] : [-0.6, 1.1, 2.8];
      const xMax = xs[xs.length - 1];
      wire([v(X0, -0.6), v(X0, ZT), v(xMax, ZT)]);
      wire([v(X0, 0.6), v(X0, ZB), v(xMax, ZB)]);
      xs.forEach((x, i) => {
        wire([v(x, ZT), v(x, ZB)]);
        component(load, v(x, 0), false, i, s);
        paths.push({ path: [v(X0, -0.6), v(X0, ZT), v(x, ZT), v(x, ZB), v(X0, ZB), v(X0, 0.6), v(X0, -0.6)], lens: [], total: 0, dots: [], branch: i });
      });
      meter(v(-2.5, ZT), 'A', 'main');
      if (vm === 'parallel') {
        const x = xs[0];
        meter(new THREE.Vector3(x - 1.1, 0.05, 0), 'V', 'branch0', Math.PI / 2);
        wire([v(x, -0.55), new THREE.Vector3(x - 0.55, 0.35, -0.55), new THREE.Vector3(x - 0.9, 0.3, -0.25)], '#E5484D', 0.025);
        wire([v(x, 0.55), new THREE.Vector3(x - 0.55, 0.35, 0.55), new THREE.Vector3(x - 0.9, 0.3, 0.25)], '#222222', 0.025);
      }
    }
    for (const p of paths) {
      p.lens = segLens(p.path);
      p.total = p.lens.reduce((a, b) => a + b, 0);
      const n = showCharges ? Math.round(p.total * 2.2) : 0;
      for (let k = 0; k < n; k++) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), std('#FF9F1C', { emissive: '#FF7A00', emissiveIntensity: 0.6 }));
        dyn.add(d);
        p.dots.push(d);
      }
    }
  }

  function solve(s: SceneState) {
    const layout = str(s, 'layout', 'series');
    const count = Math.max(1, Math.min(3, Math.round(num(s, 'count', 1))));
    const load = str(s, 'load', 'bulb');
    const V = num(s, 'V', 6);
    const base = load === 'wire' ? P.wireResistance(num(s, 'wireL', 1), num(s, 'wireA', 1) * 0.5) : num(s, 'R', 6);
    const rs = [base, num(s, 'R2', base), num(s, 'R3', base)].slice(0, count);
    const blown = Math.round(num(s, 'blown', 0));
    const open = rs.map((_, i) => blown === i + 1);
    const switchOff = num(s, 'switch', 1) < 0.5;
    const extra = str(s, 'voltmeter', 'none') === 'series' && layout === 'series' ? P.VOLTMETER_R : 0;
    if (switchOff) return P.solveCircuit(V, rs, 'series', rs.map(() => true));
    return P.solveCircuit(V, rs, layout as 'series' | 'parallel', open, extra);
  }

  return {
    root,
    update(s) {
      const key = sigOf(s, ['layout', 'count', 'load', 'voltmeter', 'ammeters', 'charges', 'blown', 'wireL', 'wireA']);
      if (key !== sig) {
        sig = key;
        build(s);
      }
      sol = solve(s);
      const V = num(s, 'V', 6);
      setLabel(batteryTag, `${V.toFixed(1)} V`);
      const pMax = num(s, 'pMax', 6);
      comps.forEach((c, i) => {
        const pw = sol.power[i] ?? 0;
        const b = Math.min(1.6, pw / pMax);
        if (c.glow) c.glow.emissiveIntensity = c.kind === 'bulb' ? b * 1.6 : b * 1.4;
        if (c.light) c.light.intensity = b * 4;
        const R = sol.branchVoltage[i] / Math.max(sol.branchCurrent[i], 1e-9);
        const blownNow = Math.round(num(s, 'blown', 0)) === i + 1;
        const rTxt = c.kind === 'wire' ? `R = ${(sol.branchCurrent[i] > 1e-9 ? R : 0).toFixed(1)} Ω` : '';
        setLabel(c.tag, blownNow ? 'fused ✕' : c.kind === 'wire' ? `${rTxt} · ${sol.branchCurrent[i].toFixed(2)} A` : `${sol.branchCurrent[i].toFixed(2)} A · ${pw.toFixed(1)} W`);
      });
      for (const m of meters) {
        const value = m.kind === 'A' ? sol.current : m.which === 'branch0' ? sol.branchVoltage[0] : V - sol.branchVoltage.reduce((a, b) => a + b, 0);
        const full = m.kind === 'A' ? 3 : 12;
        m.needle.rotation.y = Math.PI / 2 - Math.min(1, Math.abs(value) / full) * Math.PI;
        setLabel(m.tag, m.kind === 'A' ? `A: ${sol.current.toFixed(2)} A` : `V: ${Math.max(0, value).toFixed(1)} V`);
      }
      if (switchLever) switchLever.rotation.z = num(s, 'switch', 1) < 0.5 ? 0.6 : 0;
    },
    tick(t, dt) {
      phase += dt;
      for (const p of paths) {
        const I = p.branch < 0 ? sol.current : sol.branchCurrent[p.branch] ?? 0;
        const speed = Math.min(2.2, I * 0.9);
        p.dots.forEach((d, k) => {
          const base = (k / p.dots.length) * p.total;
          const off = ((((d.userData.o as number | undefined) ?? 0) + speed * dt) % p.total + p.total) % p.total;
          d.userData.o = off;
          d.position.copy(along(p.path, p.lens, (base + off) % p.total));
          d.position.y = 0.12;
        });
      }
      void t;
    },
  };
}

/* ======================= MAGNETISM & HOUSE ======================= */

function compass(dirAngle: number): THREE.Group {
  const g = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), std('#FFFFFF'));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 24), std('#2E1A6E'));
  rim.rotation.x = Math.PI / 2;
  const needle = new THREE.Group();
  const n = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 8), std('#E5484D'));
  n.rotation.z = -Math.PI / 2;
  n.position.x = 0.09;
  const sNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 8), std('#2563EB'));
  sNeedle.rotation.z = Math.PI / 2;
  sNeedle.position.x = -0.09;
  needle.add(n, sNeedle);
  needle.position.y = 0.05;
  needle.rotation.y = -dirAngle;
  needle.name = 'needle';
  g.add(disk, rim, needle);
  return g;
}

function magnetKit(ctx: Ctx): Kit {
  const root = new THREE.Group();
  const dyn = new THREE.Group();
  root.add(dyn);
  let sig = '';
  let movers: { dots: THREE.Mesh[]; path: THREE.Vector3[]; lens: number[]; total: number; speed: () => number }[] = [];
  let fanBlades: THREE.Object3D | null = null;
  let swing: THREE.Group | null = null;
  let compasses: { obj: THREE.Object3D; pos: THREE.Vector3 }[] = [];
  let shock: THREE.Mesh | null = null;
  let current = 0;

  function bar(xN: number, xS: number, y: number) {
    const L = Math.abs(xN - xS);
    const n = new THREE.Mesh(new THREE.BoxGeometry(L / 2, 0.45, 0.6), std('#E5484D'));
    n.position.set((xN + (xN + xS) / 2) / 2, y, 0);
    const sm = new THREE.Mesh(new THREE.BoxGeometry(L / 2, 0.45, 0.6), std('#2563EB'));
    sm.position.set((xS + (xN + xS) / 2) / 2, y, 0);
    dyn.add(n, sm);
    const ln1 = label('N', '#E5484D', 14);
    ln1.position.set(xN, y + 0.55, 0);
    const ls = label('S', '#2563EB', 14);
    ls.position.set(xS, y + 0.55, 0);
    dyn.add(ln1, ls);
  }

  function drawFieldLines(xN: number, xS: number, y: number, count: number, opacity = 1) {
    for (const pts of P.fieldLines(xN, xS, count, 4.6)) {
      const line = pts.map(([x, z]) => [x, y, z]);
      dyn.add(ln(ctx, line, '#6D28D9', 2.5, false, opacity));
      const mid = Math.floor(pts.length / 2);
      if (pts.length > 8) {
        const a = new THREE.Vector3(pts[mid][0], y, pts[mid][1]);
        const b = new THREE.Vector3(pts[mid + 2][0], y, pts[mid + 2][1]);
        const dir = b.clone().sub(a).normalize();
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), std('#6D28D9'));
        cone.position.copy(a);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        dyn.add(cone);
      }
    }
  }

  function build(s: SceneState) {
    clearGroup(dyn);
    movers = [];
    fanBlades = null;
    swing = null;
    compasses = [];
    shock = null;
    const mode = str(s, 'mode', 'bar');
    const labels = num(s, 'labels', 1) > 0.5;
    const showLines = num(s, 'lines', 1) > 0.5;
    const I = num(s, 'current', 2);
    const table = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 7), std('#EFE6FF'));
    table.position.y = -0.1;

    if (mode === 'bar') {
      dyn.add(table);
      bar(1.2, -1.2, 0.25);
      if (showLines) drawFieldLines(1.2, -1.2, 0.08, 16);
      if (num(s, 'filings', 0) > 0.5) {
        const geo = new THREE.BoxGeometry(0.12, 0.015, 0.02);
        const mat = std('#3B3B4A');
        const rnd = (k: number) => {
          const x = Math.sin(k * 12.9898) * 43758.5453;
          return x - Math.floor(x);
        };
        for (let k = 0; k < 420; k++) {
          const x = -4.4 + 8.8 * rnd(k);
          const z = -3.1 + 6.2 * rnd(k + 999);
          if (Math.abs(x) < 1.4 && Math.abs(z) < 0.45) continue;
          const [bx, bz] = P.dipoleField(x, z, 1.2, -1.2);
          const f = new THREE.Mesh(geo, mat);
          f.position.set(x, 0.02, z);
          f.rotation.y = -Math.atan2(bz, bx);
          dyn.add(f);
        }
      }
      if (num(s, 'compass', 0) > 0.5) {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const pos = new THREE.Vector3(2.6 * Math.cos(a), 0.05, 1.9 * Math.sin(a));
          const [bx, bz] = P.dipoleField(pos.x, pos.z, 1.2, -1.2);
          const c = compass(Math.atan2(bz, bx));
          c.position.copy(pos);
          dyn.add(c);
        }
      }
      return;
    }

    if (mode === 'wire' || mode === 'solenoid') {
      const dir = Math.sign(I) || 1;
      if (mode === 'wire') {
        const card = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.04, 6.4), std('#FFFFFF'));
        dyn.add(card);
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 16), std('#C9783F', { metalness: 0.6, roughness: 0.3 }));
        w.position.y = 0.7;
        dyn.add(w);
        const strength = Math.min(1, Math.abs(I) / 3);
        if (showLines && Math.abs(I) > 0.05) {
          [0.55, 1.05, 1.7, 2.4].forEach((r, ri) => {
            const pts: number[][] = [];
            for (let k = 0; k <= 64; k++) {
              const a = (k / 64) * Math.PI * 2;
              pts.push([r * Math.cos(a), 0.04, r * Math.sin(a)]);
            }
            dyn.add(ln(ctx, pts, '#6D28D9', 2.6, false, Math.max(0.15, strength - ri * 0.18)));
            for (let q = 0; q < 4; q++) {
              const a = (q / 4) * Math.PI * 2 + ri * 0.4;
              const pos = new THREE.Vector3(r * Math.cos(a), 0.05, r * Math.sin(a));
              const rhat = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
              const tangent = new THREE.Vector3(0, dir, 0).cross(rhat).normalize();
              const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), std('#6D28D9'));
              cone.position.copy(pos);
              cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
              dyn.add(cone);
            }
          });
        }
        if (num(s, 'compass', 1) > 0.5) {
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const pos = new THREE.Vector3(1.4 * Math.cos(a), 0.07, 1.4 * Math.sin(a));
            const c = compass(0);
            c.position.copy(pos);
            dyn.add(c);
            compasses.push({ obj: c, pos });
          }
        }
        const pathUp = [new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 2.9, 0)];
        const path = dir > 0 ? pathUp : [...pathUp].reverse();
        const dots: THREE.Mesh[] = [];
        for (let k = 0; k < 12; k++) {
          const d = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), std('#FF9F1C', { emissive: '#FF7A00', emissiveIntensity: 0.6 }));
          dyn.add(d);
          dots.push(d);
        }
        const lens = segLens(path);
        movers.push({ dots, path, lens, total: lens[0], speed: () => Math.abs(current) * 0.6 });
        if (labels) {
          const li = label(Math.abs(I) < 0.05 ? 'no current' : `I = ${Math.abs(I).toFixed(1)} A ${dir > 0 ? '↑ up' : '↓ down'}`, '#B4430C', 12);
          li.position.set(0.5, 3.1, 0);
          dyn.add(li);
          const ln2 = label(dir > 0 ? 'field: anticlockwise (seen from above)' : 'field: clockwise (seen from above)', '#6D28D9', 11);
          ln2.position.set(0, 0.2, 3.0);
          if (Math.abs(I) > 0.05) dyn.add(ln2);
        }
        return;
      }
      // solenoid
      dyn.add(table);
      const turns = 10;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= turns * 40; k++) {
        const tt = k / (turns * 40);
        const a = tt * Math.PI * 2 * turns;
        pts.push(new THREE.Vector3(-2 + 4 * tt, 0.9 + 0.8 * Math.cos(a), 0.8 * Math.sin(a)));
      }
      dyn.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 800, 0.05, 8), std('#C9783F', { metalness: 0.6, roughness: 0.3 })));
      const xN = dir > 0 ? 2 : -2;
      if (showLines && Math.abs(I) > 0.05) {
        for (const pl of P.fieldLines(xN, -xN, 12, 4.6)) dyn.add(ln(ctx, pl.map(([x, z]) => [x, 0.9, z]), '#6D28D9', 2.2, false, 0.85));
        for (const zz of [-0.45, 0, 0.45]) {
          dyn.add(ln(ctx, [[-xN, 0.9, zz], [xN, 0.9, zz]], '#6D28D9', 2.6));
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 10), std('#6D28D9'));
          cone.position.set(0, 0.9, zz);
          cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sign(xN), 0, 0));
          dyn.add(cone);
        }
      }
      if (labels && Math.abs(I) > 0.05) {
        const lN = label('N', '#E5484D', 15);
        lN.position.set(xN * 1.15, 1.9, 0);
        const lS = label('S', '#2563EB', 15);
        lS.position.set(-xN * 1.15, 1.9, 0);
        const li = label(`I = ${Math.abs(I).toFixed(1)} A`, '#B4430C', 12);
        li.position.set(0, 2.2, 0);
        dyn.add(lN, lS, li);
      }
      return;
    }

    if (mode === 'force') {
      dyn.add(table);
      const tilt = (num(s, 'tilt', 0) * Math.PI) / 180;
      const fieldDir = num(s, 'fieldDir', 1) >= 0 ? 1 : -1;
      const magnet = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), std(fieldDir > 0 ? '#E5484D' : '#2563EB'));
      top.position.y = 1.0;
      const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), std(fieldDir > 0 ? '#2563EB' : '#E5484D'));
      bottom.position.y = -1.0;
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.5, 1.4), std('#7C7099'));
      yoke.position.set(-0.9, 0, 0);
      magnet.add(top, bottom, yoke);
      const lt = label(fieldDir > 0 ? 'N' : 'S', fieldDir > 0 ? '#E5484D' : '#2563EB', 14);
      lt.position.set(0.95, 1.0, 0);
      const lb = label(fieldDir > 0 ? 'S' : 'N', fieldDir > 0 ? '#2563EB' : '#E5484D', 14);
      lb.position.set(0.95, -1.0, 0);
      magnet.add(lt, lb);
      if (showLines) magnet.add(arrowMesh(new THREE.Vector3(0.35, 0.7 * fieldDir, 0), new THREE.Vector3(0.35, -0.7 * fieldDir, 0), '#2563EB', 0.04));
      const lB = label('B', '#2563EB', 13);
      lB.position.set(0.62, 0.15, 0);
      if (labels) magnet.add(lB);
      magnet.rotation.x = tilt;
      magnet.position.y = 1.4;
      dyn.add(magnet);
      // hanging rod
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3.6), std('#2E1A6E'));
      support.position.set(0, 3.4, 0);
      dyn.add(support);
      swing = new THREE.Group();
      swing.position.set(0, 3.4, 0);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 14), std('#C9783F', { metalness: 0.6, roughness: 0.3 }));
      rod.rotation.x = Math.PI / 2;
      rod.position.y = -2.0;
      const wireA = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.0, 6), std('#333333'));
      wireA.position.set(0, -1.0, 1.55);
      const wireB = wireA.clone();
      wireB.position.z = -1.55;
      swing.add(rod, wireA, wireB);
      const iDir = Math.sign(I) || 1;
      if (Math.abs(I) > 0.05) {
        swing.add(arrowMesh(new THREE.Vector3(0, -2.0, -1.0 * iDir), new THREE.Vector3(0, -2.0, 1.0 * iDir), '#FF7A00', 0.035));
        const B: [number, number, number] = [0, -fieldDir * Math.cos(tilt), -fieldDir * Math.sin(tilt)];
        const F = P.forceOnWire(I, [0, 0, 1], B);
        const fx = F[0];
        if (Math.abs(fx) > 0.02) swing.add(arrowMesh(new THREE.Vector3(0, -2.0, 0), new THREE.Vector3(Math.sign(fx) * (0.5 + Math.min(1.2, Math.abs(fx) * 0.3)), -2.0, 0), '#12A150', 0.05));
        if (labels) {
          const li = label('I', '#FF7A00', 13);
          li.position.set(0, -1.7, 1.25 * iDir);
          swing.add(li);
          const lf = label(Math.abs(fx) > 0.02 ? 'F' : 'F = 0 (current along the field)', '#0E8A43', 13);
          lf.position.set(Math.sign(fx) * 1.6, -2.3, 0);
          swing.add(lf);
        }
        swing.userData.target = Math.atan(fx * 0.12);
      } else swing.userData.target = 0;
      dyn.add(swing);
      return;
    }

    if (mode === 'house') {
      const on: Record<string, number> = { bulb: num(s, 'bulb', 1), fan: num(s, 'fan', 0), heater: num(s, 'heater', 0), iron: num(s, 'iron', 0) };
      const fuseA = num(s, 'fuse', 5);
      const fault = str(s, 'fault', 'none') as 'none' | 'short' | 'earth';
      const earthing = num(s, 'earthing', 1) > 0.5;
      const load = P.houseLoad(on, fuseA, fault, earthing);
      const powered = !load.blown;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 4.4), std('#F5E6C8'));
      floor.position.y = -0.08;
      const back = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 0.15), std('#FFF1DE'));
      back.position.set(0, 1.7, -2.2);
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.4, 4.4), std('#FFE4F0'));
      side.position.set(-4, 1.7, 0);
      dyn.add(floor, back, side);
      const grass = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 10), std('#7BC86C'));
      grass.position.y = -0.2;
      dyn.add(grass);
      const rail = (y: number, color: string) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 7.4, 8), std(color));
        m.rotation.z = Math.PI / 2;
        m.position.set(-0.1, y, -2.05);
        dyn.add(m);
      };
      rail(3.0, '#E5484D');
      rail(2.8, '#222222');
      rail(2.6, '#12A150');
      // fuse box on the side wall
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.9), std('#2E1A6E'));
      box.position.set(-3.85, 2.4, -1.2);
      dyn.add(box);
      const heat = Math.min(1, load.current / Math.max(fuseA, 0.1));
      const fuseMat = new THREE.MeshStandardMaterial({ color: powered ? '#C0C0C8' : '#555555', emissive: '#FF5A1F', emissiveIntensity: powered ? heat * heat * 1.2 : 0 });
      if (powered) {
        const fw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), fuseMat);
        fw.position.set(-3.72, 2.4, -1.2);
        dyn.add(fw);
      } else {
        for (const dy of [0.22, -0.22]) {
          const half = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), fuseMat);
          half.position.set(-3.72, 2.4 + dy, -1.2);
          dyn.add(half);
        }
      }
      if (labels) {
        const lf = label(powered ? `fuse ${fuseA} A · in series with live wire` : 'FUSE BLOWN: supply cut off', powered ? '#2E1A6E' : '#D13438', 12);
        lf.position.set(-3.5, 3.15, -1.2);
        dyn.add(lf);
        const lw = label('live', '#E5484D', 10);
        lw.position.set(3.4, 3.15, -2.0);
        const nw = label('neutral', '#222222', 10);
        nw.position.set(3.4, 2.82, -2.0);
        const ew = label('earth', '#0E8A43', 10);
        ew.position.set(3.4, 2.5, -2.0);
        dyn.add(lw, nw, ew);
      }
      // earth rod outside
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), std('#12A150'));
      rod.position.set(-4.6, -0.6, -1.8);
      dyn.add(rod);
      // appliances (all in parallel between live and neutral)
      const drop = (x: number, yTo: number, earth = false) => {
        const g = (yFrom: number, color: string, dz: number) => {
          const len = yFrom - yTo;
          const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 6), std(color));
          m.position.set(x + dz, yTo + len / 2, -2.0);
          dyn.add(m);
        };
        g(3.0, '#E5484D', -0.06);
        g(2.8, '#222222', 0.06);
        if (earth) g(2.6, '#12A150', 0.18);
      };
      // bulb
      drop(-2.6, 2.1);
      const bulbMat = new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFC93D', emissiveIntensity: on.bulb && powered ? 1.5 : 0, transparent: true, opacity: 0.9 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), bulbMat);
      bulb.position.set(-2.6, 1.95, -1.9);
      dyn.add(bulb);
      if (on.bulb && powered) {
        const pl = new THREE.PointLight('#FFC93D', 4, 5);
        pl.position.copy(bulb.position);
        dyn.add(pl);
      }
      // fan
      drop(-0.8, 2.6);
      const fan = new THREE.Group();
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.15, 16), std('#7C7099'));
      fan.add(hub);
      for (let k = 0; k < 3; k++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.18), std('#FFFFFF'));
        blade.position.x = 0.5;
        const holder = new THREE.Group();
        holder.rotation.y = (k / 3) * Math.PI * 2;
        holder.add(blade);
        fan.add(holder);
      }
      fan.position.set(-0.8, 2.5, -1.0);
      fan.userData.on = on.fan && powered ? 1 : 0;
      fanBlades = fan;
      dyn.add(fan);
      // heater with metal body (needs earth)
      drop(1.4, 0.9, true);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.5), std(fault === 'earth' ? '#B0B0BC' : '#D9D9E3', { metalness: 0.7, roughness: 0.3 }));
      body.position.set(1.4, 0.45, -1.7);
      dyn.add(body);
      const coil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: '#552211', emissive: '#FF3B1F', emissiveIntensity: on.heater && powered ? 1.4 : 0 }));
      coil.position.set(1.4, 0.5, -1.43);
      dyn.add(coil);
      // iron
      drop(3.1, 0.75, true);
      const iron = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.32), std('#6D28D9', { emissive: '#FF3B1F', emissiveIntensity: on.iron && powered ? 0.35 : 0 }));
      iron.position.set(3.1, 0.6, -1.7);
      dyn.add(iron);
      const table2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.7), std('#B07A4A'));
      table2.position.set(3.1, 0.25, -1.7);
      dyn.add(table2);
      if (labels) {
        const tags: [string, number, number, string][] = [
          ['bulb 100 W', -2.6, 1.45, 'bulb'],
          ['fan 75 W', -0.8, 2.1, 'fan'],
          ['heater 2000 W', 1.4, 1.25, 'heater'],
          ['iron 1000 W', 3.1, 1.1, 'iron'],
        ];
        for (const [t, x, y, key] of tags) {
          const l = label(`${t} ${on[key] ? '· ON' : '· off'}`, on[key] && powered ? '#0E8A43' : '#7C7099', 10);
          l.position.set(x, y, -1.5);
          dyn.add(l);
        }
        const tot = label(load.current > 900 ? 'fault: a very large current flows' : `total I = ${load.watts} W ÷ 220 V = ${load.current.toFixed(1)} A`, load.blown ? '#D13438' : '#2E1A6E', 12);
        tot.position.set(0.4, 3.75, -2.0);
        dyn.add(tot);
      }
      if (fault === 'short') {
        const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: '#FFD000' }));
        spark.position.set(2.2, 2.9, -2.0);
        dyn.add(spark);
        shock = spark;
        if (labels) {
          const l = label('short circuit: live touches neutral', '#D13438', 11);
          l.position.set(2.2, 3.35, -1.8);
          dyn.add(l);
        }
      }
      if (fault === 'earth') {
        if (earthing) {
          const path = [new THREE.Vector3(1.58, 0.9, -2.0), new THREE.Vector3(1.58, 2.6, -2.0), new THREE.Vector3(-3.7, 2.6, -2.0), new THREE.Vector3(-4.6, 2.6, -1.8), new THREE.Vector3(-4.6, -0.6, -1.8)];
          const lens = segLens(path);
          const dots: THREE.Mesh[] = [];
          for (let k = 0; k < 18; k++) {
            const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), std('#12C26B', { emissive: '#12C26B', emissiveIntensity: 0.8 }));
            dyn.add(d);
            dots.push(d);
          }
          movers.push({ dots, path, lens, total: lens.reduce((a, b) => a + b, 0), speed: () => (load.blown ? 0 : 1.4) });
          if (labels) {
            const l = label(load.blown ? 'earth wire carried the fault current, fuse blew: safe' : 'fault current flows safely to earth', '#0E8A43', 11);
            l.position.set(1.4, 1.6, -1.2);
            dyn.add(l);
          }
        } else {
          const person = new THREE.Group();
          const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.6, 6, 12), std('#2E1A6E'));
          b.position.y = 0.55;
          const h = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), std('#C68B59'));
          h.position.y = 1.1;
          person.add(b, h);
          person.position.set(2.25, 0, -1.1);
          dyn.add(person);
          const glow = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 16), new THREE.MeshBasicMaterial({ color: '#FF2D2D', transparent: true, opacity: 0.25 }));
          glow.position.set(2.25, 0.7, -1.1);
          dyn.add(glow);
          shock = glow;
          if (labels) {
            const l = label('no earth wire: current flows through the person!', '#D13438', 11);
            l.position.set(2.25, 1.75, -1.1);
            dyn.add(l);
          }
        }
      }
    }
  }

  return {
    root,
    update(s) {
      current = num(s, 'current', 2);
      const mode = str(s, 'mode', 'bar');
      // the wire scene shows current smoothly via compasses; only rebuild on bigger steps
      const key = sigOf(s, ['mode', 'labels', 'lines', 'filings', 'compass', 'tilt', 'fieldDir', 'bulb', 'fan', 'heater', 'iron', 'fuse', 'fault', 'earthing']) + '|' + (mode === 'wire' || mode === 'solenoid' || mode === 'force' ? Math.round(current * 4) / 4 : '');
      if (key !== sig) {
        sig = key;
        build(s);
      }
    },
    tick(t, dt) {
      for (const m of movers) {
        const sp = m.speed();
        m.dots.forEach((d, k) => {
          const off = (((d.userData.o as number | undefined) ?? (k / m.dots.length) * m.total) + sp * dt) % m.total;
          d.userData.o = off;
          d.position.copy(along(m.path, m.lens, off));
        });
      }
      if (fanBlades && fanBlades.userData.on) fanBlades.rotation.y += dt * 9;
      // the rod hangs from a support along z, so it swings about z (positive angle moves it towards +x)
      if (swing) swing.rotation.z += (((swing.userData.target as number) ?? 0) - swing.rotation.z) * Math.min(1, dt * 3);
      for (const c of compasses) {
        // needle follows (wire field + Earth's field)
        const rhat = c.pos.clone().setY(0).normalize();
        const tangent = new THREE.Vector3(0, Math.sign(current) || 1, 0).cross(rhat).normalize();
        const Bw = tangent.multiplyScalar((Math.abs(current) * 0.9) / Math.max(0.3, c.pos.length()));
        const Be = new THREE.Vector3(0.35, 0, 0);
        const B = Bw.add(Be);
        const target = Math.atan2(B.z, B.x);
        const needle = c.obj.getObjectByName('needle');
        if (needle) {
          const cur = -needle.rotation.y;
          let diff = target - cur;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          needle.rotation.y = -(cur + diff * Math.min(1, dt * 4));
        }
      }
      if (shock) shock.scale.setScalar(0.85 + 0.25 * Math.abs(Math.sin(t * 9)));
    },
  };
}

/* ======================= STAGE ======================= */

interface Props {
  kit: KitName;
  state: SceneState;
  camera?: Cam;
  /** Let the student orbit and zoom. */
  interactive?: boolean;
  lowPower?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Story3D: React.FC<Props> = ({ kit, state, camera, interactive = true, lowPower = false, className, ariaLabel }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<SceneState>(state);
  const camRef = useRef<Cam>(camera ?? DEFAULT_CAM[kit]);
  const camAnimRef = useRef(true);
  const interactiveRef = useRef(interactive);
  targetRef.current = state;
  interactiveRef.current = interactive;

  useEffect(() => {
    const next = camera ?? DEFAULT_CAM[kit];
    if (next.join() !== camRef.current.join()) {
      camRef.current = next;
      camAnimRef.current = true;
    }
  }, [camera, kit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    const css = new CSS2DRenderer();
    css.domElement.style.position = 'absolute';
    css.domElement.style.inset = '0';
    css.domElement.style.pointerEvents = 'none';
    host.appendChild(css.domElement);

    const scene = new THREE.Scene();
    const bg = new THREE.Color('#F7F2FF');
    scene.background = bg;
    scene.add(new THREE.HemisphereLight('#FFFFFF', '#CBB8F5', 1.6));
    const sun = new THREE.DirectionalLight('#FFFFFF', 1.6);
    sun.position.set(4, 8, 6);
    scene.add(sun);

    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    const [px, py, pz, tx, ty, tz] = camRef.current;
    cam.position.set(px, py, pz);
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.target.set(tx, ty, tz);
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 22;
    controls.addEventListener('start', () => {
      camAnimRef.current = false;
    });

    const ctx: Ctx = { res: new THREE.Vector2(1, 1), scene, bg };
    const k: Kit = kit === 'optics' ? opticsKit(ctx) : kit === 'circuit' ? circuitKit(ctx) : magnetKit(ctx);
    scene.add(k.root);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      css.setSize(w, h);
      cam.aspect = w / h;
      // keep the whole bench visible on narrow screens
      cam.fov = w / h < 1 ? 60 : 45;
      cam.updateProjectionMatrix();
      ctx.res.set(w, h);
      scene.traverse((o) => {
        const m = (o as Line2).material as LineMaterial | undefined;
        if (m && (m as LineMaterial).isLineMaterial) m.resolution.set(w, h);
      });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const cur: SceneState = { ...targetRef.current };
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let visible = true;
    const io = new IntersectionObserver((e) => (visible = e[0]?.isIntersecting ?? true));
    io.observe(host);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      elapsed += dt;
      const tgt = targetRef.current;
      const a = Math.min(1, dt * 3.2);
      for (const key of Object.keys(tgt)) {
        const tv = tgt[key];
        const cv = cur[key];
        if (typeof tv === 'number' && typeof cv === 'number') {
          const nv = cv + (tv - cv) * a;
          cur[key] = Math.abs(tv - nv) < 1e-3 ? tv : nv;
        } else cur[key] = tv;
      }
      for (const key of Object.keys(cur)) if (!(key in tgt)) delete cur[key];
      // whole-number structural values (counts, which bulb is blown) switch at once
      for (const key of ['count', 'blown', 'ammeters']) if (typeof tgt[key] === 'number') cur[key] = tgt[key];
      k.update(cur);
      k.tick(elapsed, dt, cur);
      if (camAnimRef.current) {
        const [cx, cy, cz, lx, ly, lz] = camRef.current;
        const b = Math.min(1, dt * 2.2);
        cam.position.lerp(new THREE.Vector3(cx, cy, cz), b);
        controls.target.lerp(new THREE.Vector3(lx, ly, lz), b);
      }
      controls.enabled = interactiveRef.current;
      controls.update();
      renderer.render(scene, cam);
      css.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      clearGroup(k.root);
      renderer.dispose();
      host.removeChild(renderer.domElement);
      host.removeChild(css.domElement);
    };
  }, [kit, lowPower]);

  return <div ref={hostRef} role="img" aria-label={ariaLabel} className={`relative overflow-hidden ${className ?? ''}`} />;
};
