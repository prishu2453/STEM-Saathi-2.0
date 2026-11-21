import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface Magnetism3DSceneProps {
  turns: number;
  magnetSpeed: number;
  fieldStrength: number;
  running: boolean;
  lowPowerMode: boolean;
  onEmfSample?: (emfVolts: number, fluxWb: number) => void;
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

function createGalvanometerDial(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#faf8fe';
  ctx.beginPath();
  ctx.arc(128, 128, 122, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cff0';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Top semicircle scale: -15 .. 0 .. +15 V
  const startAng = Math.PI * 1.12;
  const endAng = Math.PI * 1.88;
  const span = endAng - startAng;

  for (let i = 0; i <= 12; i++) {
    const frac = i / 12;
    const ang = startAng + frac * span;
    const isMajor = i % 3 === 0;
    const rOut = 104;
    const rIn = isMajor ? 82 : 92;
    ctx.strokeStyle = i === 6 ? '#6d28d9' : isMajor ? '#241c38' : '#7c7099';
    ctx.lineWidth = isMajor ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(ang) * rIn, 128 + Math.sin(ang) * rIn);
    ctx.lineTo(128 + Math.cos(ang) * rOut, 128 + Math.sin(ang) * rOut);
    ctx.stroke();
  }

  ctx.fillStyle = '#241c38';
  ctx.font = 'bold 15px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [
    { label: '-15', frac: 0 },
    { label: '0', frac: 0.5 },
    { label: '+15', frac: 1 },
  ].forEach(({ label, frac }) => {
    const ang = startAng + frac * span;
    ctx.fillText(label, 128 + Math.cos(ang) * 64, 128 + Math.sin(ang) * 64);
  });

  ctx.fillStyle = '#4c3f6e';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('GALVANOMETER', 128, 166);
  ctx.fillStyle = '#6d28d9';
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillText('VOLTS (ε)', 128, 190);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Magnetism3DScene: React.FC<Magnetism3DSceneProps> = ({
  turns,
  magnetSpeed,
  fieldStrength,
  running,
  lowPowerMode,
  onEmfSample,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paramsRef = useRef({ turns, magnetSpeed, fieldStrength, running, onEmfSample });

  useEffect(() => {
    paramsRef.current = { turns, magnetSpeed, fieldStrength, running, onEmfSample };
  }, [turns, magnetSpeed, fieldStrength, running, onEmfSample]);

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
    const height = container.clientHeight || 300;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0.25, 2.3, 4.9);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !softwareGl;
    controls.target.set(0, 0.8, 0);

    const hemi = new THREE.HemisphereLight(0xede9fe, 0x100d1b, 0.85);
    const key = new THREE.DirectionalLight(0xfff7ed, 2.0);
    key.position.set(4, 6, 4);
    key.castShadow = !softwareGl;
    scene.add(hemi, key);

    // Base plinth
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x221d33, roughness: 0.55, metalness: 0.35 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 2.0), baseMat);
    base.position.y = 0.09;
    base.receiveShadow = true;
    scene.add(base);

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, metalness: 0.88, roughness: 0.24 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x2a253d, metalness: 0.78, roughness: 0.3 });
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xd97742, metalness: 0.92, roughness: 0.22 });

    // Grounded Coil Cradle Stanchions & End Flanges
    [-1.25, 0.55].forEach((fx) => {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.92), darkSteelMat);
      stand.position.set(fx, 0.38, 0);
      const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 32), brassMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.set(fx, 0.95, 0);
      scene.add(stand, flange);
    });

    // Copper Solenoid Coil Group
    const bobbinMat = new THREE.MeshPhysicalMaterial({
      color: 0xede9fe,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      depthWrite: false,
    });
    const bobbin = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 1.8, 28, 1, true), bobbinMat);
    bobbin.rotation.z = Math.PI / 2;
    bobbin.position.set(-0.35, 0.95, 0);
    bobbin.renderOrder = 3;
    scene.add(bobbin);

    const coilGroup = new THREE.Group();
    coilGroup.position.set(-0.35, 0.95, 0);
    for (let i = -6; i <= 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.036, 12, 32), coilMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = i * 0.13;
      coilGroup.add(ring);
    }
    scene.add(coilGroup);

    // Bench-mounted Center-Zero Galvanometer (right side)
    const meterGroup = new THREE.Group();
    meterGroup.position.set(1.58, 0.68, -0.2);
    meterGroup.rotation.y = -0.25;

    const meterStand = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.96, 0.34), darkSteelMat);
    const meterBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 32), brassMat);
    meterBezel.rotation.x = Math.PI / 2;
    meterBezel.position.set(0, 0.1, 0.16);

    const dialTex = createGalvanometerDial();
    dialTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const dialFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 32),
      new THREE.MeshBasicMaterial({ map: dialTex })
    );
    dialFace.position.set(0, 0.1, 0.205);

    const needlePivot = new THREE.Group();
    needlePivot.position.set(0, 0.04, 0.215);
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.36, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    needle.position.y = 0.16;
    needlePivot.add(needle);

    meterGroup.add(meterStand, meterBezel, dialFace, needlePivot);
    scene.add(meterGroup);

    // Copper leads connecting solenoid coil terminals to galvanometer
    const leadA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 0.56, -0.26),
      new THREE.Vector3(0.95, 0.22, -0.26),
      new THREE.Vector3(1.36, 0.28, -0.1),
    ]);
    const leadB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 0.56, 0.26),
      new THREE.Vector3(0.95, 0.22, 0.26),
      new THREE.Vector3(1.58, 0.28, 0.0),
    ]);
    scene.add(
      new THREE.Mesh(new THREE.TubeGeometry(leadA, 16, 0.02, 8, false), coilMat),
      new THREE.Mesh(new THREE.TubeGeometry(leadB, 16, 0.02, 8, false), coilMat)
    );

    // Moving Bar Magnet (North Red + South Blue) on low-friction guide rod
    const guideRail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.3, 12), darkSteelMat);
    guideRail.rotation.z = Math.PI / 2;
    guideRail.position.set(-0.35, 0.78, 0);
    scene.add(guideRail);

    const magnetGroup = new THREE.Group();
    magnetGroup.position.set(-0.35, 0.95, 0);
    const north = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.28, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.3 })
    );
    north.position.x = 0.325;
    const south = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.28, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35, metalness: 0.3 })
    );
    south.position.x = -0.325;
    magnetGroup.add(north, south);
    scene.add(magnetGroup);

    if (!softwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let t = 0;
    let frameId = 0;
    let disposed = false;
    let lastEmit = 0;
    let curNeedleRot = 0;

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
    if (container) ro?.observe(container);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
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
      const p = paramsRef.current;
      if (p.running) {
        t += dt * p.magnetSpeed;
      }

      const xPos = -0.35 + Math.sin(t * 2.2) * 1.15;
      magnetGroup.position.x = xPos;

      // Faraday's law: ε = −N dΦ/dt, with Φ = B·A·g(x), g(x) = exp(−((x−x₀)/w)²), A = 0.008 m².
      // Scene units are treated as metres on a slowed-down time scale (illustrative model).
      const COIL_AREA = 0.008;
      const xRel = xPos + 0.35;
      const distFactor = Math.exp(-Math.pow(xRel / 0.85, 2));
      const flux = p.fieldStrength * COIL_AREA * distFactor;
      const vx = p.running ? 1.15 * 2.2 * Math.cos(t * 2.2) * p.magnetSpeed : 0;
      const dFluxDt = p.fieldStrength * COIL_AREA * distFactor * ((-2 * xRel) / (0.85 * 0.85)) * vx;
      const emf = -p.turns * dFluxDt;

      const targetNeedle = THREE.MathUtils.clamp(-emf * 0.12, -0.78, 0.78);
      curNeedleRot = THREE.MathUtils.damp(curNeedleRot, targetNeedle, 10, Math.max(dt, 0.016));
      needlePivot.rotation.z = curNeedleRot;

      const now = performance.now();
      if (p.onEmfSample && now - lastEmit > 120) {
        lastEmit = now;
        p.onEmfSample(emf, flux);
      }

      controls.update();
      renderer.render(scene, camera);
      if (softwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      controls.dispose();
      dialTex.dispose();
      scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
          else m.material?.dispose();
        }
      });
      envRT.dispose();
      renderer.dispose();
    };
  }, [lowPowerMode]);

  if (lowPowerMode) {
    return (
      <div className="h-[260px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#1F1545] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">Lite Mode: Faraday Induction Formula View</p>
        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] mt-1 max-w-md">
          3D WebGL solenoid paused for low-power Android efficiency. Adjust Turns (N), Speed, and Field Strength (B) to compute peak EMF live below.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-[56vh] min-h-[340px] max-h-[820px] lg:h-[calc(100vh-190px)] group-data-[fs=true]/stage:h-[calc(100vh-40px)] group-data-[fs=true]/stage:max-h-none rounded-xl overflow-hidden border border-[#3B2C78] bg-[#120A28]"
      aria-label="3D Faraday Electromagnetic Induction Lab"
    />
  );
};
