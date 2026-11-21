import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Compass, Pause, Play, RotateCcw } from 'lucide-react';
import { PHYSICS_HERO_IMAGE } from '../data/curriculum';
import type { PhysicsTopicId } from '../types/stem';

interface PhysicsUniverse3DProps {
  lowPowerMode: boolean;
  onSelectPhysicsTopic: (topic: PhysicsTopicId) => void;
}

type FocusPreset = 'overview' | 'mechanics' | 'magnetism' | 'optics';

const PRESET_CAMERAS: Record<FocusPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0, 4.2, 8.6], target: [0, 0.9, 0] },
  mechanics: { pos: [-3.2, 2.9, 5.1], target: [-2.1, 1.3, 0] },
  magnetism: { pos: [0.3, 2.6, 5.2], target: [0.2, 1.0, 0] },
  optics: { pos: [3.6, 2.4, 4.8], target: [2.4, 0.9, 0] },
};

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0B1220';
    ctx.fillRect(0, 0, 512, 512);
    ctx.translate(256, 256);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    for (let r = 80; r <= 230; r += 50) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const r1 = isMajor ? 210 : 224;
      const r2 = 240;
      ctx.strokeStyle = isMajor ? 'rgba(248, 250, 252, 0.7)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = isMajor ? 2.5 : 1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
      ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const PhysicsUniverse3D: React.FC<PhysicsUniverse3DProps> = ({
  lowPowerMode,
  onSelectPhysicsTopic,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<FocusPreset>('overview');
  const [exploded, setExploded] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  const stateRef = useRef({
    preset: 'overview' as FocusPreset,
    transitionActive: false,
    explodedTarget: 0,
    explodedCurrent: 0,
    speed: 1,
    paused: false,
  });

  useEffect(() => {
    stateRef.current.preset = preset;
    stateRef.current.transitionActive = true;
  }, [preset]);

  useEffect(() => {
    stateRef.current.explodedTarget = exploded;
  }, [exploded]);

  useEffect(() => {
    stateRef.current.speed = speed;
  }, [speed]);

  useEffect(() => {
    stateRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          setDockCollapsed((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (lowPowerMode) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 460;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.032);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(...PRESET_CAMERAS.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.5;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.85;
    controls.target.set(...PRESET_CAMERAS.overview.target);

    const stopAutoCamera = () => {
      stateRef.current.transitionActive = false;
    };
    controls.addEventListener('start', stopAutoCamera);

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.1);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Grounded Observatory Bench Plinth
    const dialTexture = createDialTexture();
    dialTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const benchGroup = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.72,
      metalness: 0.25,
    });
    const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.35, 64), baseMat);
    baseDisc.position.y = -0.175;
    baseDisc.receiveShadow = true;
    benchGroup.add(baseDisc);

    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTexture,
      roughness: 0.55,
      metalness: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const dialPlate = new THREE.Mesh(new THREE.CylinderGeometry(4.95, 4.95, 0.04, 64), dialMat);
    dialPlate.position.y = 0.02;
    dialPlate.receiveShadow = true;
    benchGroup.add(dialPlate);

    // Subtle Starfield InstancedMesh (>20 repeated points)
    const starCount = 160;
    const starGeo = new THREE.SphereGeometry(0.035, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const stars = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const radius = 12 + (i % 9) * 1.8;
      const y = 2 + ((i * 7) % 10);
      dummy.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      const s = 0.6 + (i % 4) * 0.25;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
    }
    stars.computeBoundingSphere();
    scene.add(stars);
    scene.add(benchGroup);

    // 1. MECHANICS APPARATUS: Composite Brass Gyroscope + Satellite Orbit (Left)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4a348,
      metalness: 0.9,
      roughness: 0.24,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.48,
    });
    const cobaltMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      metalness: 0.35,
      roughness: 0.25,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
    });

    const gyroGroup = new THREE.Group();
    gyroGroup.position.set(-2.2, 0.04, 0.2);

    const gyroStand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.16, 32), darkSteelMat);
    gyroStand.position.y = 0.08;
    gyroStand.castShadow = true;
    gyroGroup.add(gyroStand);

    const gyroPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.85, 20), brassMat);
    gyroPillar.position.y = 0.55;
    gyroPillar.castShadow = true;
    gyroGroup.add(gyroPillar);

    const outerGimbal = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.045, 16, 48), brassMat);
    outerGimbal.position.y = 1.55;
    outerGimbal.castShadow = true;
    gyroGroup.add(outerGimbal);

    const innerGimbal = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.038, 16, 48), darkSteelMat);
    innerGimbal.position.y = 1.55;
    innerGimbal.rotation.y = Math.PI / 3;
    gyroGroup.add(innerGimbal);

    const rotorDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.14, 32), cobaltMat);
    rotorDisc.position.y = 1.55;
    rotorDisc.rotation.z = Math.PI / 2;
    gyroGroup.add(rotorDisc);

    const satOrbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.015, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
    );
    satOrbitRing.position.y = 1.55;
    satOrbitRing.rotation.x = Math.PI / 2.6;
    gyroGroup.add(satOrbitRing);

    const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), cobaltMat);
    gyroGroup.add(satellite);
    scene.add(gyroGroup);

    // 2. MAGNETISM APPARATUS: Composite Copper Solenoid & Polarized Magnet (Center)
    const solenoidGroup = new THREE.Group();
    solenoidGroup.position.set(0.25, 0.04, -0.4);

    const solenoidBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 1.1), darkSteelMat);
    solenoidBase.position.y = 0.09;
    solenoidBase.castShadow = true;
    solenoidGroup.add(solenoidBase);

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xd97742,
      metalness: 0.92,
      roughness: 0.22,
    });

    const coilWindings = new THREE.Group();
    for (let i = -4; i <= 4; i++) {
      const turn = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.042, 14, 36), copperMat);
      turn.position.set(i * 0.15, 0.85, 0);
      turn.rotation.y = Math.PI / 2;
      turn.castShadow = true;
      coilWindings.add(turn);
    }
    solenoidGroup.add(coilWindings);

    const magnetGroup = new THREE.Group();
    magnetGroup.position.set(0, 0.85, 0);
    const northPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.3 })
    );
    northPole.position.x = 0.275;
    const southPole = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4, metalness: 0.3 })
    );
    southPole.position.x = -0.275;
    magnetGroup.add(northPole, southPole);
    solenoidGroup.add(magnetGroup);
    scene.add(solenoidGroup);

    // 3. OPTICS APPARATUS: Optical Glass Prism & Dispersed Spectrum (Right)
    const opticsGroup = new THREE.Group();
    opticsGroup.position.set(2.45, 0.04, 0.35);

    const prismStand = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.22, 32), darkSteelMat);
    prismStand.position.y = 0.11;
    prismStand.castShadow = true;
    opticsGroup.add(prismStand);

    const prismShape = new THREE.Shape();
    const rPrism = 0.56;
    prismShape.moveTo(0, rPrism);
    prismShape.lineTo(-rPrism * 0.866, -rPrism * 0.5);
    prismShape.lineTo(rPrism * 0.866, -rPrism * 0.5);
    prismShape.closePath();

    const prismGeo = new THREE.ExtrudeGeometry(prismShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
    });
    prismGeo.center();

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0,
      roughness: 0.06,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 1,
      ior: 1.54,
      thickness: 1.1,
      clearcoat: 1,
      depthWrite: !isSoftwareGl,
    });

    const prismMesh = new THREE.Mesh(prismGeo, glassMat);
    prismMesh.position.y = 0.85;
    prismMesh.rotation.x = Math.PI / 2;
    prismMesh.rotation.z = Math.PI / 6;
    prismMesh.renderOrder = 2;
    opticsGroup.add(prismMesh);

    const beamIn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 1.5, 12),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    );
    beamIn.position.set(-0.85, 0.85, 0);
    beamIn.rotation.z = Math.PI / 2.2;
    opticsGroup.add(beamIn);

    const spectrumColors = [0xef4444, 0xf59e0b, 0x10b981, 0x38bdf8, 0x818cf8];
    const spectrumFan = new THREE.Group();
    spectrumColors.forEach((hex, idx) => {
      const ray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.45, 8),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      const offsetAngle = (idx - 2) * 0.07;
      ray.position.set(0.85, 0.82 - idx * 0.045, (idx - 2) * 0.06);
      ray.rotation.z = Math.PI / 2.4 + offsetAngle;
      spectrumFan.add(ray);
    });
    opticsGroup.add(spectrumFan);
    scene.add(opticsGroup);

    // Pre-warm shaders when hardware WebGL is active
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let disposed = false;

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    function afterDraw(cb: () => void) {
      const rawGl = renderer.getContext();
      const gl =
        typeof WebGL2RenderingContext !== 'undefined' && rawGl instanceof WebGL2RenderingContext
          ? rawGl
          : null;
      if (!gl) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      if (!s.paused) {
        elapsed += dt * s.speed;
      }

      controls.autoRotate = !s.paused && !s.transitionActive && s.preset === 'overview';
      controls.autoRotateSpeed = 0.85 * s.speed;

      // Smooth exploded separation damping
      s.explodedCurrent = THREE.MathUtils.damp(s.explodedCurrent, s.explodedTarget, 6, dt);
      const exp = s.explodedCurrent;

      outerGimbal.rotation.y = elapsed * 0.65;
      innerGimbal.rotation.x = elapsed * 1.1;
      rotorDisc.rotation.x = elapsed * 4.2;
      rotorDisc.position.y = 1.55 + exp * 0.45;
      outerGimbal.position.y = 1.55 + exp * 0.2;

      const orbAngle = elapsed * 1.3;
      satellite.position.set(
        Math.cos(orbAngle) * 1.25,
        1.55 + Math.sin(orbAngle) * 0.42,
        Math.sin(orbAngle) * 1.25
      );

      magnetGroup.position.x = Math.sin(elapsed * 2.1) * 0.95;
      coilWindings.position.y = exp * 0.42;

      prismMesh.rotation.z = Math.PI / 6 + Math.sin(elapsed * 0.5) * 0.08;
      prismMesh.position.y = 0.85 + exp * 0.45;

      // Smooth camera preset transition
      if (s.transitionActive) {
        const cfg = PRESET_CAMERAS[s.preset];
        _targetPos.set(...cfg.pos);
        _targetLook.set(...cfg.target);
        camera.position.lerp(_targetPos, 1 - Math.exp(-5 * dt));
        controls.target.lerp(_targetLook, 1 - Math.exp(-5 * dt));
        if (camera.position.distanceTo(_targetPos) < 0.03) {
          s.transitionActive = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', stopAutoCamera);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      dialTexture.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, [lowPowerMode]);

  if (lowPowerMode || webglFailed) {
    return (
      <div className="relative w-full h-[360px] sm:h-[440px] rounded-2xl overflow-hidden border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#120A28]">
        <img
          src={PHYSICS_HERO_IMAGE}
          alt="Gyaan Graph Physics Observatory apparatus showing gyroscope, optical prism, and copper induction coils"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120A28]/92 via-[#120A28]/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#C4B5FD]">
              {lowPowerMode ? 'Low-End / Battery Saver 2D Preview Active' : 'Static Observatory Preview'}
            </p>
            <p className="text-sm text-[#F5F0FF] mt-0.5">
              Gyroscope Mechanics · Optical Prism Dispersion · Faraday Induction Coils
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPhysicsTopic('mechanics')}
            className="rounded-lg bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] transition-colors cursor-pointer"
          >
            Launch 2D Interactive Labs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[380px] sm:h-[470px] rounded-2xl overflow-hidden border border-[#3B2C78] bg-[#120A28]">
      {/* Dedicated isolated WebGL mount */}
      <div ref={mountRef} className="w-full h-full" aria-label="Interactive 3D Physics Observatory" />

      {/* Top-Left Minimal Observatory Label & Optional Focus Lab Action */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#1F1545]/92 border border-[#3B2C78] px-3 py-1.5 text-xs text-[#F5F0FF]">
          <Compass className="w-3.5 h-3.5 text-[#C4B5FD] shrink-0" aria-hidden="true" />
          <span>Drag to orbit · Scroll to zoom · Press H to toggle dock</span>
        </div>
        {preset !== 'overview' && (
          <button
            type="button"
            onClick={() => onSelectPhysicsTopic(preset)}
            className="pointer-events-auto rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Open {preset === 'mechanics' ? 'Mechanics' : preset === 'magnetism' ? 'Magnetism' : 'Optics'} Lab
          </button>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (no backdrop-filter over WebGL) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-10 w-[min(900px,94%)] transition-transform duration-200 ${
          dockCollapsed ? 'bottom-3 translate-y-[calc(100%-34px)]' : 'bottom-4 translate-y-0'
        }`}
      >
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#3B2C78] bg-[#1F1545]/95 px-3 py-1 text-[11px] font-medium text-[#F5F0FF] hover:text-[#C4B5FD] cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show 3D Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl border border-[#3B2C78] bg-[#1F1545]/95 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Camera Focus Presets */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="3D Observatory Focus">
            {(
              [
                { id: 'overview', label: 'Full Bench' },
                { id: 'mechanics', label: 'Gyroscope' },
                { id: 'magnetism', label: 'Solenoid' },
                { id: 'optics', label: 'Prism' },
              ] as { id: FocusPreset; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  preset === item.id
                    ? 'bg-[#6D28D9] text-white'
                    : 'bg-[#2A1D5C] text-[#E4DDFA] hover:bg-[#3B2C78]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Exploded Assembly + Speed + Play/Pause */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[#E4DDFA]">
              <span className="whitespace-nowrap">Explode</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={exploded}
                onChange={(e) => setExploded(parseFloat(e.target.value))}
                className="w-20 accent-[#6D28D9] cursor-pointer"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-[#E4DDFA]">
              <span className="whitespace-nowrap tabular-nums">Speed {speed.toFixed(1)}×</span>
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-20 accent-[#6D28D9] cursor-pointer"
              />
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="inline-flex items-center gap-1 rounded-md bg-[#2A1D5C] px-2.5 py-1 text-xs font-medium text-[#F5F0FF] hover:bg-[#3B2C78] cursor-pointer"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{paused ? 'Play' : 'Pause'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreset('overview');
                  setExploded(0);
                  setSpeed(1);
                  setPaused(false);
                }}
                aria-label="Reset 3D observatory view"
                className="inline-flex items-center rounded-md bg-[#2A1D5C] p-1.5 text-[#E4DDFA] hover:bg-[#3B2C78] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
