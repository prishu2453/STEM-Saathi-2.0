import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  computeExperiment,
  wavelengthToHex,
  type ExperimentId,
  type ExperimentParamValues,
} from '../data/physicsExperiments';

interface PhysicsExperiment3DSceneProps {
  experimentId: ExperimentId;
  params: ExperimentParamValues;
  running: boolean;
  speed?: number;
  lowPowerMode: boolean;
}

function isSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createOpticalBenchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1b1829';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle brushed aluminum grain lines
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Optical breadboard M6 tapped hole grid
  for (let x = 24; x < 512; x += 28) {
    for (let y = 22; y < 256; y += 28) {
      ctx.fillStyle = '#0d0b16';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Center rail guide stripe
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 128);
  ctx.lineTo(496, 128);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAnalogDialTexture(options: {
  title: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  accent: string;
}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Clean cream-offwhite meter face
  ctx.fillStyle = '#faf8fe';
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d8cff0';
  ctx.lineWidth = 6;
  ctx.stroke();

  const startAng = Math.PI * 0.75;
  const endAng = Math.PI * 2.25;
  const span = endAng - startAng;

  // Tick marks
  const totalTicks = 20;
  for (let i = 0; i <= totalTicks; i++) {
    const frac = i / totalTicks;
    const ang = startAng + frac * span;
    const isMajor = i % 5 === 0;
    const rOut = 104;
    const rIn = isMajor ? 84 : 93;
    ctx.strokeStyle = isMajor ? '#241c38' : '#7c7099';
    ctx.lineWidth = isMajor ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(ang) * rIn, 128 + Math.sin(ang) * rIn);
    ctx.lineTo(128 + Math.cos(ang) * rOut, 128 + Math.sin(ang) * rOut);
    ctx.stroke();
  }

  // Scale labels
  ctx.fillStyle = '#241c38';
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let v = options.min; v <= options.max + 0.001; v += options.step) {
    const frac = (v - options.min) / (options.max - options.min);
    const ang = startAng + frac * span;
    const rx = 128 + Math.cos(ang) * 66;
    const ry = 128 + Math.sin(ang) * 66;
    ctx.fillText(Number.isInteger(v) ? `${v}` : v.toFixed(1), rx, ry);
  }

  // Colored active arc
  ctx.strokeStyle = options.accent;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 108, startAng, endAng);
  ctx.stroke();

  ctx.fillStyle = '#4c3f6e';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(options.title, 128, 168);
  ctx.fillStyle = options.accent;
  ctx.font = 'bold 18px "IBM Plex Mono", monospace';
  ctx.fillText(options.unit, 128, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVolumeScaleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#181426';
  ctx.fillRect(0, 0, 128, 256);
  ctx.strokeStyle = '#6d28d9';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 120, 248);

  ctx.fillStyle = '#e9e2fb';
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Map 2L..8L bottom-to-top
  const marks = [8, 7, 6, 5, 4, 3, 2];
  marks.forEach((liters, idx) => {
    const y = 26 + (idx / (marks.length - 1)) * 204;
    const isEven = liters % 2 === 0;
    ctx.strokeStyle = isEven ? '#c4b5fd' : '#7c7099';
    ctx.lineWidth = isEven ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(isEven ? 54 : 38, y);
    ctx.stroke();
    if (isEven) {
      ctx.fillText(`${liters}L`, 110, y);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function paintDoubleSlitTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wavelengthNm: number,
  slitSepMm: number,
  screenDistM: number
) {
  ctx.fillStyle = '#090712';
  ctx.fillRect(0, 0, w, h);
  const hex = wavelengthToHex(wavelengthNm);
  const betaPx = Math.max(
    8,
    Math.min(72, ((wavelengthNm / 532) * (screenDistM / 1.5) * 28) / Math.max(0.2, slitSepMm / 0.4))
  );

  for (let x = 0; x < w; x++) {
    const u = (x - w / 2) / betaPx;
    const interference = Math.pow(Math.cos(Math.PI * u), 2);
    const envelope = Math.pow(Math.cos(Math.min(Math.PI * 0.48, u * 0.28)), 2);
    const intensity = interference * envelope;
    ctx.fillStyle = hex;
    ctx.globalAlpha = 0.08 + intensity * 0.92;
    ctx.fillRect(x, 8, 1, h - 16);
  }
  ctx.globalAlpha = 1;
}

function paintBraggTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  voltageV: number,
  spacingNm: number
) {
  ctx.fillStyle = '#090712';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;

  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
  grad.addColorStop(0, '#c4b5fd');
  grad.addColorStop(1, 'rgba(167, 139, 250, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();

  const scale = (11 / Math.sqrt(Math.max(20, voltageV))) * (0.22 / Math.max(0.1, spacingNm));
  [1, 2, 3].forEach((order) => {
    const r = Math.min(w * 0.45, order * 42 * scale);
    ctx.strokeStyle = order === 1 ? '#a78bfa' : order === 2 ? '#34d399' : '#38bdf8';
    ctx.globalAlpha = order === 1 ? 0.95 : order === 2 ? 0.68 : 0.42;
    ctx.lineWidth = order === 1 ? 4.5 : 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

export const PhysicsExperiment3DScene: React.FC<PhysicsExperiment3DSceneProps> = ({
  experimentId,
  params,
  running,
  speed = 1,
  lowPowerMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paramsRef = useRef({ params, running, speed });

  useEffect(() => {
    paramsRef.current = { params, running, speed };
  }, [params, running, speed]);

  const liteComputation = useMemo(() => computeExperiment(experimentId, params), [experimentId, params]);

  useEffect(() => {
    if (lowPowerMode) return;
    const container = containerRef.current;
    if (!container) return;

    const softwareGl = isSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !softwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 340;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(softwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !softwareGl;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x100d1b);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(0.35, 2.35, 5.25);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !softwareGl;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.85, 0);

    const hemi = new THREE.HemisphereLight(0xede9fe, 0x100d1b, 0.9);
    const key = new THREE.DirectionalLight(0xfffcf5, 2.0);
    key.position.set(4, 6.5, 4.5);
    key.castShadow = !softwareGl;
    const rim = new THREE.DirectionalLight(0xc4b5fd, 0.65);
    rim.position.set(-4, 3, -3);
    scene.add(hemi, key, rim);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const dynamicTextures: THREE.CanvasTexture[] = [];

    // Shared precision optical breadboard bench (y = 0..0.18)
    const benchTex = createOpticalBenchTexture();
    benchTex.anisotropy = maxAniso;
    dynamicTextures.push(benchTex);

    const benchTopMat = new THREE.MeshStandardMaterial({
      map: benchTex,
      roughness: 0.42,
      metalness: 0.45,
    });
    const benchEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x2d2642,
      roughness: 0.38,
      metalness: 0.65,
    });
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.18, 2.55),
      [benchEdgeMat, benchEdgeMat, benchTopMat, benchEdgeMat, benchEdgeMat, benchEdgeMat]
    );
    bench.position.y = 0.09;
    bench.receiveShadow = true;
    scene.add(bench);

    // Optical bench rubber corner feet
    const footGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.06, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x12101a, roughness: 0.85 });
    [
      [-2.45, -1.05],
      [2.45, -1.05],
      [-2.45, 1.05],
      [2.45, 1.05],
    ].forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, -0.02, fz);
      scene.add(foot);
    });

    // Shared reusable math objects (zero allocations per frame)
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();

    // Shared precision materials
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x2a253d, metalness: 0.78, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.92, roughness: 0.16 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, metalness: 0.88, roughness: 0.24 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97742, metalness: 0.88, roughness: 0.24 });
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf1edf9, roughness: 0.45, metalness: 0.05 });

    const addRailPost = (x: number, topY: number, z = 0, radius = 0.055) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.34), darkSteelMat);
      base.position.set(x, 0.22, z);
      const height = Math.max(0.1, topY - 0.24);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), chromeMat);
      post.position.set(x, 0.24 + height / 2, z);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.45, radius * 1.45, 0.06, 16), brassMat);
      collar.position.set(x, 0.28, z);
      scene.add(base, post, collar);
    };

    let updateScene: (t: number, dt: number, p: ExperimentParamValues) => void = () => {};

    if (experimentId === 'photoelectric') {
      // 1. Articulated UV / Monochromatic Arc Lamp Assembly (Left optical rail)
      const lampCarriageX = -1.92;
      addRailPost(lampCarriageX, 1.88, 0, 0.065);

      const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.34), darkSteelMat);
      yoke.position.set(lampCarriageX, 1.88, 0);
      scene.add(yoke);

      const lampAimGroup = new THREE.Group();
      lampAimGroup.position.set(lampCarriageX, 1.9, 0);
      lampAimGroup.rotation.z = -Math.PI / 5.2; // Aimed cleanly into the quartz window at (-0.82, 1.05)

      const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.52, 24), darkSteelMat);
      lampBody.rotation.z = Math.PI / 2;
      lampAimGroup.add(lampBody);

      // Cooling heatsink fins
      for (let f = -2; f <= 1; f++) {
        const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.025, 24), brassMat);
        fin.rotation.z = Math.PI / 2;
        fin.position.x = f * 0.09 - 0.05;
        lampAimGroup.add(fin);
      }

      // Collimating lens barrel & wavelength filter disc
      const collimator = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.24, 24), darkSteelMat);
      collimator.rotation.z = Math.PI / 2;
      collimator.position.x = 0.35;
      lampAimGroup.add(collimator);

      const filterMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 1.2,
        roughness: 0.15,
      });
      const filterLens = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 24), filterMat);
      filterLens.rotation.z = Math.PI / 2;
      filterLens.position.x = 0.47;
      lampAimGroup.add(filterLens);
      scene.add(lampAimGroup);

      // Lamp power cord grounded to bench
      const lampCordCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(lampCarriageX - 0.25, 1.96, 0),
        new THREE.Vector3(lampCarriageX - 0.42, 1.2, -0.35),
        new THREE.Vector3(lampCarriageX - 0.35, 0.22, -0.55),
      ]);
      const cordMat = new THREE.MeshStandardMaterial({ color: 0x191624, roughness: 0.7 });
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(lampCordCurve, 18, 0.022, 8, false), cordMat));

      // Optical light beam (filter lens -> cathode surface)
      const beamStart = new THREE.Vector3(-1.52, 1.63, 0);
      const beamEnd = new THREE.Vector3(-0.78, 1.06, 0);
      const beamVec = new THREE.Vector3().subVectors(beamEnd, beamStart);
      const beamLen = beamVec.length();
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      });
      const lightBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, beamLen, 20, 1, true), beamMat);
      lightBeam.position.copy(beamStart).addScaledVector(beamVec, 0.5);
      lightBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), beamVec.clone().normalize());
      scene.add(lightBeam);

      // InstancedMesh photon packets along light beam (18 instances)
      const photonCount = 18;
      const photonMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0xa855f7,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      });
      const photonInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.036, 10, 10), photonMat, photonCount);
      photonInst.frustumCulled = false;
      scene.add(photonInst);

      // 2. Evacuated Quartz Phototube on Dual V-Block Saddle Cradles
      const tubeCenterY = 1.02;
      [-0.78, 0.78].forEach((cx) => {
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.56), darkSteelMat);
        pedestal.position.set(cx, 0.37, 0);
        const cradleLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.14), brassMat);
        cradleLeft.position.set(cx, 0.58, -0.34);
        cradleLeft.rotation.x = 0.48;
        const cradleRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.14), brassMat);
        cradleRight.position.set(cx, 0.58, 0.34);
        cradleRight.rotation.x = -0.48;
        scene.add(pedestal, cradleLeft, cradleRight);
      });

      // Spun brass sealing end-collars + ceramic vacuum feedthroughs
      const leftCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.14, 32), brassMat);
      leftCollar.rotation.z = Math.PI / 2;
      leftCollar.position.set(-1.14, tubeCenterY, 0);
      const rightCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.14, 32), brassMat);
      rightCollar.rotation.z = Math.PI / 2;
      rightCollar.position.set(1.14, tubeCenterY, 0);

      const leftCeramic = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 20), ceramicMat);
      leftCeramic.rotation.z = Math.PI / 2;
      leftCeramic.position.set(-1.26, tubeCenterY, 0);
      const rightCeramic = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 20), ceramicMat);
      rightCeramic.rotation.z = Math.PI / 2;
      rightCeramic.position.set(1.26, tubeCenterY, 0);
      scene.add(leftCollar, rightCollar, leftCeramic, rightCeramic);

      // Quartz light admission window port collar on upper-left tube wall
      const portCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.22, 24, 1, true), brassMat);
      portCollar.position.set(-0.95, 1.38, 0);
      portCollar.rotation.z = Math.PI / 3.4;
      scene.add(portCollar);

      // Curved semi-cylindrical photocathode plate inside left end (mounted to stem)
      const cathodeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.5, 14), copperMat);
      cathodeStem.rotation.z = Math.PI / 2;
      cathodeStem.position.set(-1.02, tubeCenterY, 0);
      const cathodeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.92, roughness: 0.18, side: THREE.DoubleSide });
      const cathode = new THREE.Mesh(
        new THREE.CylinderGeometry(0.36, 0.36, 0.62, 24, 1, true, -Math.PI * 0.42, Math.PI * 0.84),
        cathodeMat
      );
      cathode.rotation.y = Math.PI; // Open concave face looking right toward anode
      cathode.position.set(-0.75, tubeCenterY, 0);
      scene.add(cathodeStem, cathode);

      // Collector anode ring + stem mounted to right end
      const anodeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.56, 14), chromeMat);
      anodeStem.rotation.z = Math.PI / 2;
      anodeStem.position.set(1.06, tubeCenterY, 0);
      const anodeRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.034, 14, 28), chromeMat);
      anodeRing.rotation.y = Math.PI / 2;
      anodeRing.position.set(0.84, tubeCenterY, 0);
      const anodeTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), chromeMat);
      anodeTip.position.set(0.84, tubeCenterY, 0);
      scene.add(anodeStem, anodeRing, anodeTip);

      // Outer evacuated borosilicate glass chamber (rendered after internal parts)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xede9fe,
        transparent: true,
        opacity: 0.18,
        roughness: 0.08,
        metalness: 0.05,
        depthWrite: false,
      });
      const tubeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.22, 32, 1, true), glassMat);
      tubeGlass.rotation.z = Math.PI / 2;
      tubeGlass.position.set(0, tubeCenterY, 0);
      tubeGlass.renderOrder = 3;
      scene.add(tubeGlass);

      // 3. Bench-mounted Analog Microammeter & Braided Circuit Leads
      const meterGroup = new THREE.Group();
      meterGroup.position.set(1.75, 0.52, 0.68);
      meterGroup.rotation.y = -0.35;

      const meterCase = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.68, 0.34), darkSteelMat);
      meterCase.position.y = 0;
      const meterBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.06, 28), brassMat);
      meterBezel.rotation.x = Math.PI / 2;
      meterBezel.position.set(0, 0.06, 0.16);

      const meterTex = createAnalogDialTexture({
        title: 'PHOTOCURRENT',
        unit: 'mA',
        min: 0,
        max: 4,
        step: 1,
        accent: '#6d28d9',
      });
      meterTex.anisotropy = maxAniso;
      dynamicTextures.push(meterTex);

      const meterFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.24, 28),
        new THREE.MeshBasicMaterial({ map: meterTex })
      );
      meterFace.position.set(0, 0.06, 0.195);

      const needlePivot = new THREE.Group();
      needlePivot.position.set(0, 0.06, 0.205);
      const needleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.19, 0.01),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      needleMesh.position.y = 0.075;
      const needleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), darkSteelMat);
      needleCap.rotation.x = Math.PI / 2;
      needlePivot.add(needleMesh, needleCap);

      // Binding posts on meter
      const postRed = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      postRed.rotation.x = Math.PI / 2;
      postRed.position.set(-0.24, -0.24, 0.18);
      const postBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.07, 12), darkSteelMat);
      postBlack.rotation.x = Math.PI / 2;
      postBlack.position.set(0.24, -0.24, 0.18);

      meterGroup.add(meterCase, meterBezel, meterFace, needlePivot, postRed, postBlack);
      scene.add(meterGroup);

      // Copper circuit leads connecting tube terminals cleanly to microammeter
      const leadRight = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.34, tubeCenterY, 0),
        new THREE.Vector3(1.62, 0.72, 0.18),
        new THREE.Vector3(1.75, 0.26, 0.48),
        new THREE.Vector3(1.94, 0.28, 0.78),
      ]);
      const leadLeft = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.34, tubeCenterY, 0),
        new THREE.Vector3(-1.55, 0.3, 0.55),
        new THREE.Vector3(0.2, 0.21, 0.92),
        new THREE.Vector3(1.52, 0.28, 0.92),
      ]);
      scene.add(
        new THREE.Mesh(new THREE.TubeGeometry(leadRight, 24, 0.02, 8, false), copperMat),
        new THREE.Mesh(new THREE.TubeGeometry(leadLeft, 30, 0.02, 8, false), cordMat)
      );

      // 4. InstancedMesh Photoelectrons (24 instances — ONLY active when photon E > phi)
      const electronCount = 24;
      const eMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.15,
        roughness: 0.2,
      });
      const electronInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.042, 12, 12), eMat, electronCount);
      electronInst.frustumCulled = false;
      scene.add(electronInst);

      let needleAngle = Math.PI * 0.75; // 0 mA rest angle

      updateScene = (t, dt, p) => {
        const comp = computeExperiment('photoelectric', p);
        const emitted = Boolean(comp.extra.emittedPhoton);
        const kMax = comp.extra.kMaxEv ?? 0;
        const photocurrentMa = comp.extra.photocurrentMa ?? 0;
        const hexCol = wavelengthToHex(p.peWavelengthNm);

        filterMat.color.set(hexCol);
        filterMat.emissive.set(hexCol);
        beamMat.color.set(hexCol);
        beamMat.opacity = 0.08 + (p.intensityPct / 100) * 0.32;
        photonMat.color.set(hexCol);
        photonMat.emissive.set(hexCol);

        // Metal cathode tint reflects work function phi
        cathodeMat.color.set(p.workFunctionEv < 2.8 ? 0xfbbf24 : p.workFunctionEv < 4.4 ? 0xcbd5e1 : 0xd97742);

        // Photon packets traveling down collimated beam
        const activePhotons = Math.max(3, Math.round((p.intensityPct / 100) * photonCount));
        for (let i = 0; i < photonCount; i++) {
          if (i >= activePhotons) {
            dummy.scale.setScalar(0);
          } else {
            const phase = (t * 1.45 + i / activePhotons) % 1;
            const spread = (Math.sin(i * 4.3) * 0.07) * (0.5 + phase * 0.6);
            const px = THREE.MathUtils.lerp(beamStart.x, beamEnd.x, phase);
            const py = THREE.MathUtils.lerp(beamStart.y, beamEnd.y, phase);
            const pz = spread;
            dummy.position.set(px, py, pz);
            dummy.scale.setScalar(1);
          }
          dummy.updateMatrix();
          photonInst.setMatrixAt(i, dummy.matrix);
        }
        photonInst.instanceMatrix.needsUpdate = true;

        // Photoelectrons cross tube ONLY when E > phi
        const activeElectrons = emitted ? Math.max(2, Math.round((p.intensityPct / 100) * electronCount)) : 0;
        const speedFactor = 0.5 + Math.sqrt(Math.max(kMax, 0.05)) * 0.55;
        for (let i = 0; i < electronCount; i++) {
          if (!emitted || i >= activeElectrons) {
            dummy.scale.setScalar(0);
          } else {
            const phase = (t * speedFactor + i / activeElectrons) % 1;
            const yArch = tubeCenterY + Math.cos(i * 2.1) * 0.16 * (1 - phase * 0.7) + Math.sin(phase * Math.PI) * 0.08;
            const zArch = Math.sin(i * 1.7) * 0.18 * (1 - phase * 0.6);
            dummy.position.set(THREE.MathUtils.lerp(-0.68, 0.82, phase), yArch, zArch);
            dummy.scale.setScalar(1);
          }
          dummy.updateMatrix();
          electronInst.setMatrixAt(i, dummy.matrix);
        }
        electronInst.instanceMatrix.needsUpdate = true;

        // Analog microammeter dial needle rotation (clockwise from 0 to 4 mA)
        // Dial uses canvas 0 at +135° (lower-left) clockwise to +405° (lower-right)
        // In Three.js Z-rotation: +3π/4 is lower-left, rotating clockwise means decreasing Z toward -3π/4
        const frac = THREE.MathUtils.clamp(photocurrentMa / 4.0, 0, 1);
        const targetNeedleRot = Math.PI * 0.75 - frac * Math.PI * 1.5;
        needleAngle = THREE.MathUtils.damp(needleAngle, targetNeedleRot, 8, Math.max(dt, 0.016));
        needlePivot.rotation.z = needleAngle;
      };
    } else if (experimentId === 'thermodynamics') {
      // 1. Grounded Insulated Pedestal + Glowing Nichrome Heating Coils
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.14, 0.18, 36), darkSteelMat);
      pedestal.position.set(0, 0.27, 0);
      scene.add(pedestal);

      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 0.7,
        roughness: 0.35,
      });
      [0.35, 0.56, 0.76].forEach((r) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.032, 12, 32), coilMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 0.37, 0);
        scene.add(ring);
      });

      const diffuserPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.05, 36), copperMat);
      diffuserPlate.position.set(0, 0.41, 0);
      scene.add(diffuserPlate);

      // 2. Heavy Lower & Upper Steel Flanges + 4 Polished Tie Rods
      const lowerFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.08, 36), darkSteelMat);
      lowerFlange.position.set(0, 0.44, 0);
      const upperFlange = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.08, 36), darkSteelMat);
      upperFlange.position.set(0, 2.04, 0);
      const rodBushing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 20), brassMat);
      rodBushing.position.set(0, 2.06, 0);
      scene.add(lowerFlange, upperFlange, rodBushing);

      const tieRodGeo = new THREE.CylinderGeometry(0.034, 0.034, 1.72, 12);
      const nutGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.05, 6);
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
        const rx = Math.cos(ang + Math.PI / 4) * 0.98;
        const rz = Math.sin(ang + Math.PI / 4) * 0.98;
        const rod = new THREE.Mesh(tieRodGeo, chromeMat);
        rod.position.set(rx, 1.24, rz);
        const topNut = new THREE.Mesh(nutGeo, brassMat);
        topNut.position.set(rx, 2.1, rz);
        const botNut = new THREE.Mesh(nutGeo, brassMat);
        botNut.position.set(rx, 0.39, rz);
        scene.add(rod, topNut, botNut);
      });

      // Calibrated Volume Scale Plaque mounted beside glass cylinder
      const scaleTex = createVolumeScaleTexture();
      scaleTex.anisotropy = maxAniso;
      dynamicTextures.push(scaleTex);
      const scalePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 1.44, 0.04),
        new THREE.MeshBasicMaterial({ map: scaleTex })
      );
      scalePlate.position.set(-1.14, 1.24, 0.15);
      scalePlate.rotation.y = 0.24;
      scene.add(scalePlate);

      // 3. Precision Sealed Aluminum Piston Head + Rod + Crossbar + Mass
      const pistonGroup = new THREE.Group();
      const pistonHead = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.14, 32), chromeMat);
      const oRingMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.7 });
      const oRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.022, 10, 32), oRingMat);
      oRing1.rotation.x = Math.PI / 2;
      oRing1.position.y = 0.04;
      const oRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.022, 10, 32), oRingMat);
      oRing2.rotation.x = Math.PI / 2;
      oRing2.position.y = -0.04;
      const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.55, 20), chromeMat);
      pistonRod.position.y = 0.82;
      const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.62, 16), brassMat);
      handleBar.rotation.z = Math.PI / 2;
      handleBar.position.y = 1.6;
      const weightDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 24), brassMat);
      weightDisc.position.y = 1.52;
      pistonGroup.add(pistonHead, oRing1, oRing2, pistonRod, handleBar, weightDisc);
      scene.add(pistonGroup);

      // Borosilicate Glass Cylinder (rendered after piston & molecules)
      const cylinderGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.88, 0.88, 1.54, 36, 1, true),
        new THREE.MeshPhysicalMaterial({
          color: 0xede9fe,
          transparent: true,
          opacity: 0.19,
          roughness: 0.08,
          depthWrite: false,
        })
      );
      cylinderGlass.position.set(0, 1.24, 0);
      cylinderGlass.renderOrder = 3;
      scene.add(cylinderGlass);

      // 4. Side Brass Manifold & Live Bourdon Pressure Gauge
      const pipeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.86, 0.56, 0),
        new THREE.Vector3(1.48, 0.56, 0),
        new THREE.Vector3(1.62, 0.82, 0.12),
      ]);
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 16, 0.048, 12, false), brassMat));
      addRailPost(1.62, 0.88, 0.12, 0.045);

      const gaugeGroup = new THREE.Group();
      gaugeGroup.position.set(1.62, 1.2, 0.12);
      gaugeGroup.rotation.y = -0.25;

      const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 32), brassMat);
      gaugeBody.rotation.x = Math.PI / 2;
      const gaugeTex = createAnalogDialTexture({
        title: 'PRESSURE',
        unit: 'kPa',
        min: 0,
        max: 500,
        step: 100,
        accent: '#7c3aed',
      });
      gaugeTex.anisotropy = maxAniso;
      dynamicTextures.push(gaugeTex);

      const gaugeFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.31, 32),
        new THREE.MeshBasicMaterial({ map: gaugeTex })
      );
      gaugeFace.position.z = 0.075;

      const pNeedlePivot = new THREE.Group();
      pNeedlePivot.position.z = 0.085;
      const pNeedle = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.23, 0.01),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      pNeedle.position.y = 0.09;
      pNeedlePivot.add(pNeedle);
      gaugeGroup.add(gaugeBody, gaugeFace, pNeedlePivot);
      scene.add(gaugeGroup);

      // 5. InstancedMesh Gas Molecules (44 spheres)
      const molCount = 44;
      const molMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.15 });
      const molInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.052, 12, 12), molMat, molCount);
      molInst.frustumCulled = false;
      scene.add(molInst);

      const molecules = Array.from({ length: molCount }, (_, idx) => {
        const ang = (idx * 2.39996) % (Math.PI * 2);
        const rad = 0.18 + ((idx * 0.17) % 0.56);
        return {
          x: Math.cos(ang) * rad,
          y: 0.56 + ((idx * 0.11) % 0.65),
          z: Math.sin(ang) * rad,
          vx: (idx % 2 === 0 ? 1 : -1) * (0.7 + (idx % 5) * 0.22),
          vy: (idx % 3 === 0 ? 1 : -1) * (0.75 + (idx % 4) * 0.24),
          vz: (idx % 5 === 0 ? 1 : -1) * (0.65 + (idx % 4) * 0.2),
        };
      });

      let curPistonY = 1.2;
      let curGaugeRot = Math.PI * 0.75;

      updateScene = (_t, dt, p) => {
        const comp = computeExperiment('thermodynamics', p);
        const pressureKpa = comp.extra.pressureKpa ?? 120;

        // Smoothly damp piston height according to volume (2.0 L .. 8.0 L)
        const targetPistonY = 0.72 + ((p.thermoVol - 2.0) / 6.0) * 1.12;
        curPistonY = THREE.MathUtils.damp(curPistonY, targetPistonY, 8, Math.max(dt, 0.016));
        pistonGroup.position.y = curPistonY;

        // Thermal glow of heating coils
        const hotness = THREE.MathUtils.clamp((p.thermoTemp - 250) / 350, 0, 1);
        coilMat.emissiveIntensity = 0.2 + hotness * 1.4;
        coilMat.emissive.setHSL(0.07 - hotness * 0.05, 0.92, 0.48);

        // Rotate Bourdon pressure gauge needle cleanly
        const pFrac = THREE.MathUtils.clamp(pressureKpa / 500, 0, 1);
        const targetGaugeRot = Math.PI * 0.75 - pFrac * Math.PI * 1.5;
        curGaugeRot = THREE.MathUtils.damp(curGaugeRot, targetGaugeRot, 8, Math.max(dt, 0.016));
        pNeedlePivot.rotation.z = curGaugeRot;

        // Elastic gas molecule simulation inside cylinder
        const speedScale = 0.65 + Math.sqrt(Math.max(0.2, p.thermoTemp / 300)) * 1.25;
        const stepDt = paramsRef.current.running ? Math.min(0.04, Math.max(0.002, dt)) : 0;
        const maxRadius = 0.76;
        const floorY = 0.5;
        const ceilY = Math.max(floorY + 0.14, curPistonY - 0.12);

        for (let i = 0; i < molCount; i++) {
          const mol = molecules[i];
          if (stepDt > 0) {
            mol.x += mol.vx * speedScale * stepDt;
            mol.y += mol.vy * speedScale * stepDt;
            mol.z += mol.vz * speedScale * stepDt;

            const rSq = mol.x * mol.x + mol.z * mol.z;
            if (rSq > maxRadius * maxRadius) {
              const r = Math.sqrt(rSq);
              const nx = mol.x / r;
              const nz = mol.z / r;
              mol.x = nx * maxRadius;
              mol.z = nz * maxRadius;
              const dot = mol.vx * nx + mol.vz * nz;
              if (dot > 0) {
                mol.vx -= 2 * dot * nx;
                mol.vz -= 2 * dot * nz;
              }
            }
            if (mol.y < floorY) {
              mol.y = floorY;
              mol.vy = Math.abs(mol.vy);
            } else if (mol.y > ceilY) {
              mol.y = ceilY;
              mol.vy = -Math.abs(mol.vy);
            }
          }

          dummy.position.set(mol.x, mol.y, mol.z);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          molInst.setMatrixAt(i, dummy.matrix);

          tmpColor.setHSL(0.72 - hotness * 0.62, 0.85, 0.6);
          molInst.setColorAt(i, tmpColor);
        }
        molInst.instanceMatrix.needsUpdate = true;
        if (molInst.instanceColor) molInst.instanceColor.needsUpdate = true;
      };
    } else if (experimentId === 'double-slit') {
      addRailPost(-2.0, 0.86);
      addRailPost(-0.45, 0.25);

      const emitterGroup = new THREE.Group();
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.78, 20), darkSteelMat);
      barrel.rotation.z = Math.PI / 2;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 16), brassMat);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.x = 0.44;
      emitterGroup.add(barrel, nozzle);
      emitterGroup.position.set(-2.0, 0.92, 0);
      scene.add(emitterGroup);

      const beamMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.85 });
      const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.15, 12), beamMat);
      mainBeam.rotation.z = Math.PI / 2;
      mainBeam.position.set(-1.05, 0.92, 0);
      scene.add(mainBeam);

      const plateGroup = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.38, 1.3), darkSteelMat);
      const slitMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const slit1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.045), slitMat);
      const slit2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.045), slitMat);
      plateGroup.add(plate, slit1, slit2);
      plateGroup.position.set(-0.45, 0.92, 0);
      scene.add(plateGroup);

      const fanMat = new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const fan1 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.12), fanMat);
      fan1.position.set(0.85, 0.92, -0.05);
      const fan2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.12), fanMat);
      fan2.position.set(0.85, 0.92, 0.05);
      scene.add(fan1, fan2);

      const waveRings: THREE.Mesh[] = [];
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.45 });
      for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 24), ringMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(-0.4, 0.92, 0);
        waveRings.push(ring);
        scene.add(ring);
      }

      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 128;
      const texCtx = texCanvas.getContext('2d')!;
      paintDoubleSlitTexture(texCtx, 256, 128, params.wavelengthNm, params.slitSepMm, params.screenDistM);
      const fringeTex = new THREE.CanvasTexture(texCanvas);
      fringeTex.colorSpace = THREE.SRGBColorSpace;
      fringeTex.anisotropy = maxAniso;
      dynamicTextures.push(fringeTex);

      const screenGroup = new THREE.Group();
      const screenMount = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.5), brassMat);
      screenMount.position.set(0, -0.7, 0);
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 1.75), darkSteelMat);
      const screenFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.62, 1.24),
        new THREE.MeshBasicMaterial({ map: fringeTex })
      );
      screenFace.rotation.y = -Math.PI / 2;
      screenFace.position.x = -0.06;
      screenGroup.add(screenMount, screenFrame, screenFace);
      screenGroup.position.set(1.6, 0.94, 0);
      scene.add(screenGroup);

      let lastKey = '';
      updateScene = (t, _dt, p) => {
        const hexCol = wavelengthToHex(p.wavelengthNm);
        beamMat.color.set(hexCol);
        slitMat.color.set(hexCol);
        fanMat.color.set(hexCol);
        ringMat.color.set(hexCol);

        const sepOffset = 0.08 + p.slitSepMm * 0.18;
        slit1.position.z = -sepOffset;
        slit2.position.z = sepOffset;

        const screenX = 0.75 + p.screenDistM * 0.45;
        screenGroup.position.x = screenX;

        const span = screenX - -0.45;
        fan1.scale.x = span / 2.4;
        fan2.scale.x = span / 2.4;
        fan1.position.x = -0.45 + span / 2;
        fan2.position.x = -0.45 + span / 2;

        waveRings.forEach((ring, idx) => {
          const phase = (t * 0.85 + idx * 0.25) % 1;
          ring.position.x = -0.4 + phase * (span - 0.05);
          ring.scale.setScalar(0.7 + phase * 3.8);
        });

        const keyStr = `${p.wavelengthNm}-${p.slitSepMm}-${p.screenDistM}`;
        if (keyStr !== lastKey) {
          lastKey = keyStr;
          paintDoubleSlitTexture(texCtx, 256, 128, p.wavelengthNm, p.slitSepMm, p.screenDistM);
          fringeTex.needsUpdate = true;
        }
      };
    } else if (experimentId === 'bohr-atom') {
      // Grounded Magnetic-Trap Spectroscopic Pedestal
      const trapBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.14, 36), darkSteelMat);
      trapBase.position.set(0, 0.25, 0);
      const trapRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 14, 36), brassMat);
      trapRing.rotation.x = Math.PI / 2;
      trapRing.position.set(0, 0.34, 0);
      scene.add(trapBase, trapRing);

      const nucleus = new THREE.Group();
      const pMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.35 });
      const nMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.32, metalness: 0.35 });
      [
        [0, 0, 0],
        [0.09, 0.06, 0.04],
        [-0.08, 0.05, -0.05],
        [0.05, -0.08, -0.04],
        [-0.06, -0.06, 0.07],
        [0.0, 0.09, -0.06],
      ].forEach(([x, y, z], i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), i % 2 === 0 ? pMat : nMat);
        s.position.set(x, y, z);
        nucleus.add(s);
      });
      nucleus.position.set(0, 1.25, 0);
      scene.add(nucleus);

      const rings: { mat: THREE.MeshBasicMaterial }[] = [];
      for (let n = 1; n <= 6; n++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x4c4466, transparent: true, opacity: 0.5 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24 + n * 0.23, 0.015, 10, 48), mat);
        ring.rotation.x = Math.PI / 2 - 0.28;
        ring.position.set(0, 1.25, 0);
        rings.push({ mat });
        scene.add(ring);
      }

      const electron = new THREE.Mesh(
        new THREE.SphereGeometry(0.082, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.1 })
      );
      scene.add(electron);

      const photonMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.9 });
      const photon = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.026, 10, 24), photonMat);
      scene.add(photon);

      updateScene = (t, _dt, p) => {
        const comp = computeExperiment('bohr-atom', p);
        const ni = Math.max(2, p.nInitial);
        const nf = Math.min(ni - 1, Math.max(1, p.nFinal));
        const col = comp.extra.wavelengthHex || '#a78bfa';
        photonMat.color.set(col);

        rings.forEach(({ mat }, idx) => {
          const level = idx + 1;
          if (level === ni) {
            mat.color.set(0xa78bfa);
            mat.opacity = 0.95;
          } else if (level === nf) {
            mat.color.set(0xf59e0b);
            mat.opacity = 0.95;
          } else {
            mat.color.set(0x4c4466);
            mat.opacity = 0.35;
          }
        });

        const cycle = (t * 0.45) % 1;
        const rStart = 0.24 + ni * 0.23;
        const rEnd = 0.24 + nf * 0.23;
        const curR =
          cycle < 0.5 ? rStart : cycle < 0.7 ? THREE.MathUtils.lerp(rStart, rEnd, (cycle - 0.5) / 0.2) : rEnd;
        const theta = t * 2.5;
        const tilt = Math.PI / 2 - 0.28;
        electron.position.set(
          curR * Math.cos(theta),
          1.25 + Math.sin(theta) * curR * Math.cos(tilt),
          Math.sin(theta) * curR * Math.sin(tilt)
        );

        if (cycle >= 0.55) {
          photon.visible = true;
          const pProg = (cycle - 0.55) / 0.45;
          photon.position.set(0.55 + pProg * 2.0, 1.25 + Math.sin(pProg * 14) * 0.12, 0);
          photon.rotation.y = Math.PI / 2;
          photonMat.opacity = 1 - pProg * 0.75;
        } else {
          photon.visible = false;
        }
      };
    } else if (experimentId === 'quantum-tunneling') {
      // Emitter waveguide & collector sensor posts flush on bench
      addRailPost(-2.25, 0.96);
      addRailPost(2.25, 0.96);
      const waveguide = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.35, 20), brassMat);
      waveguide.rotation.z = Math.PI / 2;
      waveguide.position.set(-2.25, 0.96, 0);
      const collector = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.55), darkSteelMat);
      collector.position.set(2.25, 0.96, 0);
      scene.add(waveguide, collector);

      const barrierMat = new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.42,
        roughness: 0.15,
        depthWrite: false,
      });
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 1.3), barrierMat);
      barrier.position.set(0, 0.78, 0);
      barrier.renderOrder = 2;
      scene.add(barrier);

      // Single InstancedMesh for 56 wavefunction nodes with true exponential barrier decay
      const waveCount = 56;
      const wMat = new THREE.MeshStandardMaterial({
        color: 0xa78bfa,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.85,
      });
      const wInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.052, 12, 12), wMat, waveCount);
      wInst.frustumCulled = false;
      scene.add(wInst);

      updateScene = (t, _dt, p) => {
        const comp = computeExperiment('quantum-tunneling', p);
        const T = comp.extra.tunnelProb ?? 0.25;
        const bWidth = 0.25 + p.barrierWidthNm * 0.48;
        const bHeight = 0.45 + p.barrierHeightEv * 0.12;
        barrier.scale.set(bWidth / 0.6, bHeight / 1.2, 1);
        barrier.position.y = 0.18 + bHeight / 2;
        barrierMat.color.set(p.particleEnergyEv >= p.barrierHeightEv ? 0x10b981 : 0xf59e0b);

        const halfW = bWidth / 2;
        const transAmp = Math.sqrt(Math.max(0.015, T));
        const k = 3.2 + p.particleEnergyEv * 0.35;
        const kappaVisual = p.particleEnergyEv < p.barrierHeightEv
          ? -Math.log(Math.max(transAmp, 0.04)) / Math.max(bWidth, 0.1)
          : 0;

        for (let i = 0; i < waveCount; i++) {
          const x = -2.05 + (i / (waveCount - 1)) * 4.1;
          let y = 0.96;
          if (x <= -halfW) {
            const incident = 0.34 * Math.sin(k * x - t * 4.5);
            const reflectScale = Math.sqrt(Math.max(0, 1 - T)) * 0.22;
            const reflected = reflectScale * Math.sin(-k * x - t * 4.5);
            y += incident + reflected;
          } else if (x < halfW) {
            const distIn = x + halfW;
            const env = p.particleEnergyEv < p.barrierHeightEv
              ? Math.exp(-kappaVisual * distIn)
              : THREE.MathUtils.lerp(1, transAmp, distIn / bWidth);
            y += 0.34 * env * Math.sin(k * (-halfW) - t * 4.5);
          } else {
            y += 0.34 * transAmp * Math.sin(k * x - t * 4.5);
          }
          dummy.position.set(x, y, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          wInst.setMatrixAt(i, dummy.matrix);
        }
        wInst.instanceMatrix.needsUpdate = true;
      };
    } else if (experimentId === 'de-broglie') {
      addRailPost(-1.9, 0.92);
      addRailPost(-0.3, 0.65);

      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.72, 20), darkSteelMat);
      gun.rotation.z = Math.PI / 2;
      gun.position.set(-1.9, 0.92, 0);
      const gunNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.18, 16), brassMat);
      gunNozzle.rotation.z = Math.PI / 2;
      gunNozzle.position.set(-1.46, 0.92, 0);
      scene.add(gun, gunNozzle);

      const crystalGroup = new THREE.Group();
      const atomGeo = new THREE.SphereGeometry(0.055, 12, 12);
      for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
          for (let iz = -1; iz <= 1; iz++) {
            const a = new THREE.Mesh(atomGeo, brassMat);
            a.position.set(ix * 0.16, iy * 0.16, iz * 0.16);
            crystalGroup.add(a);
          }
        }
      }
      crystalGroup.position.set(-0.3, 0.94, 0);
      scene.add(crystalGroup);

      const beamMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.75 });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 12), beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(-0.92, 0.92, 0);
      scene.add(beam);

      const texCanvas = document.createElement('canvas');
      texCanvas.width = 256;
      texCanvas.height = 256;
      const texCtx = texCanvas.getContext('2d')!;
      paintBraggTexture(texCtx, 256, 256, params.accelVoltageV, params.crystalSpacingNm);
      const braggTex = new THREE.CanvasTexture(texCanvas);
      braggTex.colorSpace = THREE.SRGBColorSpace;
      braggTex.anisotropy = maxAniso;
      dynamicTextures.push(braggTex);

      const screenGroup = new THREE.Group();
      const screenMount = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.5), brassMat);
      screenMount.position.set(0, -0.74, 0);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.5), darkSteelMat);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 1.38), new THREE.MeshBasicMaterial({ map: braggTex }));
      face.rotation.y = -Math.PI / 2;
      face.position.x = -0.06;
      screenGroup.add(screenMount, plate, face);
      screenGroup.position.set(1.5, 0.94, 0);
      scene.add(screenGroup);

      let lastKey = '';
      updateScene = (t, _dt, p) => {
        crystalGroup.rotation.y = Math.sin(t * 0.4) * 0.15;
        crystalGroup.scale.setScalar(0.75 + p.crystalSpacingNm * 1.4);
        beamMat.opacity = 0.45 + (p.accelVoltageV / 500) * 0.5;
        const k = `${p.accelVoltageV}-${p.crystalSpacingNm}`;
        if (k !== lastKey) {
          lastKey = k;
          paintBraggTexture(texCtx, 256, 256, p.accelVoltageV, p.crystalSpacingNm);
          braggTex.needsUpdate = true;
        }
      };
    } else if (experimentId === 'mechanics') {
      // Grounded brass carriage + trunnion stand
      const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.36), darkSteelMat);
      carriage.position.set(-2.0, 0.25, 0);
      scene.add(carriage);

      const barrelPivot = new THREE.Group();
      barrelPivot.position.set(-2.0, 0.36, 0);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.65, 16), brassMat);
      barrel.rotation.z = -Math.PI / 2;
      barrel.position.x = 0.28;
      barrelPivot.add(barrel);
      scene.add(barrelPivot);

      const dotCount = 30;
      const dotInst = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.034, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xa78bfa }),
        dotCount
      );
      dotInst.frustumCulled = false;
      scene.add(dotInst);

      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 18, 18),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.28, metalness: 0.25 })
      );
      scene.add(ball);

      const targetPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.3, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.55 })
      );
      targetPad.position.set(1.2, 0.205, 0);
      scene.add(targetPad);

      updateScene = (t, _dt, p) => {
        const rad = (p.mechAngle * Math.PI) / 180;
        barrelPivot.rotation.z = rad;
        const v = p.mechVelocity;
        const g = p.mechGravity;
        const tFlight = (2 * v * Math.sin(rad)) / g;
        const range = (v * v * Math.sin(2 * rad)) / g;
        const scaleX = 3.8 / 95;
        const scaleY = 0.055;

        for (let i = 0; i < dotCount; i++) {
          const frac = i / (dotCount - 1);
          const tt = frac * tFlight;
          const xm = v * Math.cos(rad) * tt;
          const ym = Math.max(0, v * Math.sin(rad) * tt - 0.5 * g * tt * tt);
          dummy.position.set(-2.0 + Math.min(4.2, xm * scaleX), 0.36 + ym * scaleY, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          dotInst.setMatrixAt(i, dummy.matrix);
        }
        dotInst.instanceMatrix.needsUpdate = true;

        const phase = (t * 0.55) % 1;
        const tt = phase * tFlight;
        const bx = v * Math.cos(rad) * tt;
        const by = Math.max(0, v * Math.sin(rad) * tt - 0.5 * g * tt * tt);
        ball.position.set(-2.0 + Math.min(4.2, bx * scaleX), 0.36 + by * scaleY, 0);
        targetPad.position.x = Math.min(2.2, -2.0 + range * scaleX);
      };
    } else if (experimentId === 'electricity') {
      const battery = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.68, 22),
        new THREE.MeshStandardMaterial({ color: 0x6d28d9, metalness: 0.45, roughness: 0.3 })
      );
      battery.position.set(-1.75, 0.52, 0);
      const posCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), brassMat);
      posCap.position.set(-1.75, 0.9, 0);
      scene.add(battery, posCap);

      const makeResistor = (colorHex: number) => {
        const grp = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.54, 16),
          new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4, metalness: 0.1 })
        );
        body.rotation.z = Math.PI / 2;
        const band = new THREE.Mesh(
          new THREE.CylinderGeometry(0.116, 0.116, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 })
        );
        band.rotation.z = Math.PI / 2;
        grp.add(body, band);
        return grp;
      };
      const r1 = makeResistor(0xdc2626);
      const r2 = makeResistor(0x2563eb);
      scene.add(r1, r2);

      // Busbars flush on standoffs
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.045, 0.045), copperMat);
      topBar.position.set(0, 0.54, -0.58);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.045, 0.045), copperMat);
      botBar.position.set(0, 0.54, 0.58);
      const leftLead = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.18), copperMat);
      leftLead.position.set(-1.7, 0.54, 0);
      const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.18), copperMat);
      rightBar.position.set(1.7, 0.54, 0);
      const midBar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.18), copperMat);
      midBar.position.set(0.1, 0.54, 0);
      scene.add(topBar, botBar, leftLead, rightBar, midBar);

      const chargeCount = 18;
      const cInst = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.052, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
        chargeCount
      );
      cInst.frustumCulled = false;
      scene.add(cInst);

      updateScene = (t, _dt, p) => {
        const comp = computeExperiment('electricity', p);
        const current = parseFloat(comp.metrics[1]?.value ?? '1') || 1;
        if (p.elecTopology === 'series') {
          r1.position.set(-0.45, 0.54, -0.58);
          r2.position.set(0.65, 0.54, -0.58);
          midBar.visible = false;
        } else {
          r1.position.set(-0.2, 0.54, -0.58);
          r2.position.set(0.1, 0.54, 0);
          midBar.visible = true;
        }

        const speed = Math.min(2.2, 0.22 + current * 0.25);
        for (let i = 0; i < chargeCount; i++) {
          const u = (t * speed + i / chargeCount) % 1;
          const useInnerBranch = p.elecTopology === 'parallel' && i % 3 === 0 && u >= 0.2 && u < 0.65;
          if (useInnerBranch) {
            const f = (u - 0.2) / 0.45;
            dummy.position.set(0.1, 0.54, THREE.MathUtils.lerp(-0.58, 0.58, f));
          } else if (u < 0.35) {
            const f = u / 0.35;
            dummy.position.set(THREE.MathUtils.lerp(-1.7, 1.7, f), 0.54, -0.58);
          } else if (u < 0.5) {
            const f = (u - 0.35) / 0.15;
            dummy.position.set(1.7, 0.54, THREE.MathUtils.lerp(-0.58, 0.58, f));
          } else if (u < 0.85) {
            const f = (u - 0.5) / 0.35;
            dummy.position.set(THREE.MathUtils.lerp(1.7, -1.7, f), 0.54, 0.58);
          } else {
            const f = (u - 0.85) / 0.15;
            dummy.position.set(-1.7, 0.54, THREE.MathUtils.lerp(0.58, -0.58, f));
          }
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          cInst.setMatrixAt(i, dummy.matrix);
        }
        cInst.instanceMatrix.needsUpdate = true;
      };
    } else if (experimentId === 'optics') {
      // Rotary Goniometer Turntable Pedestal
      const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.02, 0.14, 36), darkSteelMat);
      turntable.position.set(0, 0.25, 0);
      const dialRim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.78, 0.08, 36), brassMat);
      dialRim.position.set(0, 0.35, 0);
      scene.add(turntable, dialRim);

      const shape = new THREE.Shape();
      shape.moveTo(0, 0.82);
      shape.lineTo(-0.72, -0.45);
      shape.lineTo(0.72, -0.45);
      shape.closePath();
      const prismGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.72,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.02,
      });
      prismGeo.center();
      const prism = new THREE.Mesh(
        prismGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0xddd6fe,
          transparent: true,
          opacity: 0.52,
          roughness: 0.08,
          metalness: 0.05,
          depthWrite: false,
        })
      );
      prism.position.set(0, 0.88, 0);
      prism.renderOrder = 2;
      scene.add(prism);

      // Mounted laser pointer carriage on left
      addRailPost(-2.05, 0.88);
      const laserHead = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.45, 16), darkSteelMat);
      laserHead.rotation.z = Math.PI / 2;
      laserHead.position.set(-2.05, 0.9, 0);
      scene.add(laserHead);

      const inRay = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 1.75, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      inRay.rotation.z = Math.PI / 2;
      scene.add(inRay);

      const specColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6, 0xa855f7];
      const outRays = specColors.map((col) => {
        const ray = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 1.85, 10),
          new THREE.MeshBasicMaterial({ color: col })
        );
        scene.add(ray);
        return ray;
      });

      updateScene = (_t, _dt, p) => {
        const tilt = ((p.optAngle - 32) * Math.PI) / 180 * 0.45;
        laserHead.rotation.z = Math.PI / 2 + tilt;
        laserHead.position.y = 0.88 - Math.sin(tilt) * 0.65;
        inRay.position.set(-1.15, 0.88 - Math.sin(tilt) * 0.35, 0);
        inRay.rotation.z = Math.PI / 2 + tilt;

        const sinTheta2 = (p.optN1 / Math.max(1, p.optN2)) * Math.sin((p.optAngle * Math.PI) / 180);
        const tir = Math.abs(sinTheta2) > 1;
        const spreadFactor = tir ? 0.008 : 0.048 + (p.optN1 / Math.max(1, p.optN2)) * 0.038;

        outRays.forEach((ray, idx) => {
          const dev = tir ? -tilt - 0.65 : (idx - 2.5) * spreadFactor - tilt * 0.6;
          ray.rotation.z = Math.PI / 2 + dev;
          if (tir) {
            ray.position.set(-0.85, 0.55 - idx * 0.01, 0);
          } else {
            ray.position.set(1.25, 0.82 + Math.sin(dev) * 0.6, 0);
          }
        });
      };
    } else if (experimentId === 'waves') {
      addRailPost(-2.15, 0.9, -0.55);
      addRailPost(-2.15, 0.9, 0.55);
      addRailPost(2.15, 0.9, 0);

      const perRow = 40;
      const totalNodes = perRow * 3;
      const wInst = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.048, 10, 10),
        new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.1 }),
        totalNodes
      );
      wInst.frustumCulled = false;
      scene.add(wInst);

      const col1 = new THREE.Color(0xa78bfa);
      const col2 = new THREE.Color(0xf59e0b);
      const colBeat = new THREE.Color(0x34d399);

      for (let i = 0; i < totalNodes; i++) {
        wInst.setColorAt(i, i < perRow ? col1 : i < perRow * 2 ? col2 : colBeat);
      }
      if (wInst.instanceColor) wInst.instanceColor.needsUpdate = true;

      updateScene = (t, _dt, p) => {
        const k1 = 2.0 + (p.waveF1 - 180) / 140;
        const k2 = 2.0 + (p.waveF2 - 180) / 140;
        for (let i = 0; i < perRow; i++) {
          const x = -2.05 + (i / (perRow - 1)) * 4.1;
          const y1 = 0.22 * p.waveAmp * Math.sin(k1 * x * 1.4 - t * 4.2);
          const y2 = 0.22 * p.waveAmp * Math.sin(k2 * x * 1.4 - t * 4.2);

          dummy.scale.setScalar(1);
          dummy.position.set(x, 0.9 + y1, -0.55);
          dummy.updateMatrix();
          wInst.setMatrixAt(i, dummy.matrix);

          dummy.position.set(x, 0.9 + y2, 0.55);
          dummy.updateMatrix();
          wInst.setMatrixAt(perRow + i, dummy.matrix);

          dummy.position.set(x, 0.95 + (y1 + y2) * 0.75, 0);
          dummy.updateMatrix();
          wInst.setMatrixAt(perRow * 2 + i, dummy.matrix);
        }
        wInst.instanceMatrix.needsUpdate = true;
      };
    }

    // Pre-compile shaders cleanly on hardware GPUs before starting animation loop
    if (!softwareGl) {
      renderer.compile(scene, camera);
    }

    // Software WebGL safe loop using afterDraw fenceSync
    let disposed = false;
    let t = 0;
    let lastNow = performance.now();
    let timerId: number | null = null;

    const afterDraw = (callback: () => void) => {
      if (disposed) return;
      let fired = false;
      let deadline = 0;
      const done = () => {
        if (fired || disposed) return;
        fired = true;
        window.clearTimeout(deadline);
        callback();
      };

      const rawGl = renderer.getContext();
      const gl =
        typeof WebGL2RenderingContext !== 'undefined' && rawGl instanceof WebGL2RenderingContext
          ? rawGl
          : null;
      const sync = gl ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!gl || !sync) {
        timerId = window.setTimeout(done, 45);
        return;
      }
      gl.flush();
      const check = () => {
        if (disposed || fired) {
          gl.deleteSync(sync);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.WAIT_FAILED || status !== gl.TIMEOUT_EXPIRED) {
          gl.deleteSync(sync);
          done();
        } else {
          timerId = window.setTimeout(check, 20);
        }
      };
      deadline = window.setTimeout(() => {
        gl.deleteSync(sync);
        done();
      }, 90);
      timerId = window.setTimeout(check, 20);
    };

    const tick = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;
      if (paramsRef.current.running) {
        t += dt * paramsRef.current.speed;
      }
      updateScene(t, dt, paramsRef.current.params);
      controls.update();
      renderer.render(scene, camera);
      if (softwareGl) {
        afterDraw(tick);
      }
    };

    if (softwareGl) {
      tick();
    } else {
      renderer.setAnimationLoop(tick);
    }

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    // Follow the panel's own size too (bigger layout, collapsed side panel, fullscreen).
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
    ro?.observe(container);

    return () => {
      disposed = true;
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      if (timerId !== null) window.clearTimeout(timerId);
      renderer.setAnimationLoop(null);
      controls.dispose();
      dynamicTextures.forEach((tex) => tex.dispose());
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.InstancedMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
      envRT.dispose();
      renderer.dispose();
    };
  }, [experimentId, lowPowerMode]);

  if (lowPowerMode) {
    return (
      <div className="min-h-[340px] h-[56vh] max-h-[820px] lg:h-[calc(100vh-190px)] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#1F1545] p-5 flex flex-col justify-between text-[#2E1A6E] dark:text-[#F5F0FF]">
        <div className="flex items-center justify-between text-xs text-[#5B21B6] dark:text-[#C4B5FD] font-medium">
          <span>2D Lite Simulation Mode Active</span>
          <span className="font-mono uppercase">{experimentId}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-auto">
          {liteComputation.metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#2A1D5C] p-3.5">
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">{m.label}</p>
              <p className="text-lg font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] mt-1 tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
          Disable Lite 2D Mode in Accessibility settings to enable the interactive Three.js 3D apparatus.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-full h-[56vh] min-h-[340px] max-h-[820px] lg:h-[calc(100vh-190px)] group-data-[fs=true]/stage:h-[calc(100vh-40px)] group-data-[fs=true]/stage:max-h-none rounded-xl border border-[#3B2C78] bg-[#120A28] overflow-hidden cursor-grab active:cursor-grabbing"
        aria-label={`${experimentId} interactive 3D simulation`}
      />
      <p className="mt-1.5 text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
        Drag to rotate 3D camera · Scroll or pinch to zoom
      </p>
    </div>
  );
};
