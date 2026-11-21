import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Pause, Play, RotateCcw, Shield, Trophy, Volume2, VolumeX, X } from 'lucide-react';

type GamePhase = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

interface PhysicsOrbitGameProps {
  open: boolean;
  highScore: number;
  onClose: () => void;
  onSaveScore: (score: number, xpEarned: number) => void;
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

export const PhysicsOrbitGame: React.FC<PhysicsOrbitGameProps> = ({
  open,
  highScore,
  onClose,
  onSaveScore,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<GamePhase>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [shield, setShield] = useState(100);
  const [muted, setMuted] = useState(false);

  const phaseRef = useRef<GamePhase>('TITLE_MENU');
  const mutedRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scoreSavedRef = useRef(false);

  const simApiRef = useRef<{
    resetGame: () => void;
    firePulse: () => void;
    setAimFromClient: (clientX: number, clientY: number) => void;
  } | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playTone = useCallback((freq: number, dur: number, type: OscillatorType, vol = 0.08) => {
    if (mutedRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // ignore audio context errors
    }
  }, []);

  const commitFinalScore = useCallback(
    (finalScore: number, victory: boolean) => {
      if (scoreSavedRef.current) return;
      scoreSavedRef.current = true;
      const xpEarned = Math.max(20, Math.round(finalScore / 15) + (victory ? 75 : 0));
      onSaveScore(finalScore, xpEarned);
    },
    [onSaveScore]
  );

  useEffect(() => {
    if (!open) return;
    setPhase('TITLE_MENU');
    phaseRef.current = 'TITLE_MENU';
    setScore(0);
    setWave(1);
    setShield(100);
    scoreSavedRef.current = false;

    const container = mountRef.current;
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

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(softwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050812);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 120);
    const baseCamPos = new THREE.Vector3(0, 12.5, 11.5);
    camera.position.copy(baseCamPos);
    camera.lookAt(0, 0, 0);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(8, 12, 8);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    rimLight.position.set(-8, 6, -6);
    scene.add(new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.8), keyLight, rimLight);

    // Subtle orbital grid plane
    const gridHelper = new THREE.GridHelper(26, 26, 0x1e3a5f, 0x0f172a);
    gridHelper.position.y = -0.35;
    scene.add(gridHelper);

    // 1. Composite Central Gravity Core (6 parts)
    const coreGroup = new THREE.Group();
    const coreSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95, 2),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.45,
        metalness: 0.5,
        roughness: 0.25,
      })
    );
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.22 });
    const coreRingA = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 12, 48), ringMat);
    coreRingA.rotation.x = Math.PI / 2;
    const coreRingB = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.045, 12, 48), ringMat);
    coreRingB.rotation.y = Math.PI / 4;
    const beaconTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.24, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
    );
    beaconTop.position.y = 1.05;
    const shieldRing = new THREE.Mesh(
      new THREE.RingGeometry(2.05, 2.16, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    shieldRing.rotation.x = -Math.PI / 2;
    coreGroup.add(coreSphere, coreRingA, coreRingB, beaconTop, shieldRing);
    scene.add(coreGroup);

    // 2. Composite Orbital Kinetic Launcher Platform (5 parts)
    const launcherPivot = new THREE.Group();
    const turretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.28, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 })
    );
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.2 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.95), barrelMat);
    leftRail.position.set(-0.14, 0.12, 0.42);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.95), barrelMat);
    rightRail.position.set(0.14, 0.12, 0.42);
    const emitterTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    emitterTip.position.set(0, 0.12, 0.88);
    launcherPivot.add(turretBase, leftRail, rightRail, emitterTip);
    launcherPivot.position.set(0, 0.1, 2.55);
    scene.add(launcherPivot);

    // Starfield background dots
    const starGeo = new THREE.BufferGeometry();
    const starCount = 160;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 44;
      starPos[i * 3 + 1] = -4 - Math.random() * 8;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 44;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.12 })
    );
    scene.add(stars);

    interface Projectile {
      mesh: THREE.Mesh;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      life: number;
    }
    interface Asteroid {
      group: THREE.Group;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      radius: number;
      hp: number;
    }
    interface Burst {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      life: number;
    }

    const projectiles: Projectile[] = [];
    const asteroids: Asteroid[] = [];
    const bursts: Burst[] = [];

    const projGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const projMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.78, metalness: 0.15 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.75 });
    const burstGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);

    let aimAngle = 0;
    let liveScore = 0;
    let liveWave = 1;
    let liveShield = 100;
    let defeatedInWave = 0;
    let spawnTimer = 0.6;
    let fireCooldown = 0;
    let hitstopTimer = 0;
    let trauma = 0;

    const clearEntities = () => {
      projectiles.forEach((p) => scene.remove(p.mesh));
      asteroids.forEach((a) => scene.remove(a.group));
      bursts.forEach((b) => scene.remove(b.mesh));
      projectiles.length = 0;
      asteroids.length = 0;
      bursts.length = 0;
    };

    const spawnBurst = (origin: THREE.Vector3, colorHex: number) => {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      for (let i = 0; i < 8; i++) {
        const m = new THREE.Mesh(burstGeo, mat);
        m.position.copy(origin);
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 3 + Math.random() * 4;
        scene.add(m);
        bursts.push({
          mesh: m,
          vel: new THREE.Vector3(Math.cos(angle) * speed, 1 + Math.random() * 2, Math.sin(angle) * speed),
          life: 0.45,
        });
      }
    };

    const spawnAsteroid = () => {
      const spawnAngle = Math.random() * Math.PI * 2;
      const dist = 12.5;
      const pos = new THREE.Vector3(Math.cos(spawnAngle) * dist, 0, Math.sin(spawnAngle) * dist);
      const tangent = new THREE.Vector3(-pos.z, 0, pos.x).normalize();
      const inward = pos.clone().negate().normalize();
      const speed = 1.85 + liveWave * 0.45;
      const vel = inward.multiplyScalar(speed).add(tangent.multiplyScalar(1.1 + liveWave * 0.2));

      const group = new THREE.Group();
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.08, 8, 16), collarMat);
      collar.rotation.x = Math.PI / 2;
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.y = 0.45;
      group.add(rock, collar, beacon);
      group.position.copy(pos);
      scene.add(group);

      asteroids.push({ group, pos, vel, radius: 0.6, hp: liveWave >= 3 ? 2 : 1 });
    };

    const firePulse = () => {
      if (phaseRef.current !== 'PLAYING' || fireCooldown > 0) return;
      fireCooldown = 0.18;
      const dir = new THREE.Vector3(Math.sin(aimAngle), 0, Math.cos(aimAngle)).normalize();
      const startPos = launcherPivot.position.clone().addScaledVector(dir, 0.95);
      const mesh = new THREE.Mesh(projGeo, projMat);
      mesh.position.copy(startPos);
      scene.add(mesh);
      projectiles.push({
        mesh,
        pos: startPos,
        vel: dir.multiplyScalar(11.5),
        life: 2.2,
      });
      playTone(540, 0.11, 'triangle', 0.06);
    };

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPt = new THREE.Vector3();

    const setAimFromClient = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      if (raycaster.ray.intersectPlane(groundPlane, intersectPt)) {
        aimAngle = Math.atan2(intersectPt.x, intersectPt.z);
      }
    };

    simApiRef.current = {
      resetGame: () => {
        clearEntities();
        liveScore = 0;
        liveWave = 1;
        liveShield = 100;
        defeatedInWave = 0;
        spawnTimer = 0.4;
        hitstopTimer = 0;
        trauma = 0;
        scoreSavedRef.current = false;
        setScore(0);
        setWave(1);
        setShield(100);
        setPhase('PLAYING');
        phaseRef.current = 'PLAYING';
      },
      firePulse,
      setAimFromClient,
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

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
          frameId = window.setTimeout(cb, 50);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      coreRingA.rotation.z += dt * 0.7;
      coreRingB.rotation.x += dt * 0.9;
      coreSphere.rotation.y += dt * 0.45;

      // Orbit turret around core based on aimAngle
      const orbitR = 2.55;
      launcherPivot.position.set(Math.sin(aimAngle) * orbitR, 0.1, Math.cos(aimAngle) * orbitR);
      launcherPivot.rotation.y = aimAngle;

      if (phaseRef.current === 'PLAYING') {
        if (hitstopTimer > 0) {
          hitstopTimer -= dt;
        } else {
          fireCooldown = Math.max(0, fireCooldown - dt);
          spawnTimer -= dt;
          if (spawnTimer <= 0 && asteroids.length < 4 + liveWave * 2) {
            spawnAsteroid();
            spawnTimer = Math.max(0.75, 1.85 - liveWave * 0.25);
          }

          const gravityMu = 14.0;

          // Update kinetic pulses under subtle central gravitational curvature
          for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.life -= dt;
            const rSq = Math.max(2.2, p.pos.lengthSq());
            const gravAccel = p.pos.clone().negate().normalize().multiplyScalar((gravityMu * 0.35) / rSq);
            p.vel.addScaledVector(gravAccel, dt);
            p.pos.addScaledVector(p.vel, dt);
            p.mesh.position.copy(p.pos);

            if (p.life <= 0 || p.pos.length() > 16) {
              scene.remove(p.mesh);
              projectiles.splice(i, 1);
            }
          }

          // Update incoming orbital debris + collisions
          for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            const rSq = Math.max(3.5, a.pos.lengthSq());
            const gravAccel = a.pos.clone().negate().normalize().multiplyScalar((gravityMu * 0.45) / rSq);
            a.vel.addScaledVector(gravAccel, dt);
            a.pos.addScaledVector(a.vel, dt);
            a.group.position.copy(a.pos);
            a.group.rotation.x += dt * 1.4;
            a.group.rotation.y += dt * 1.1;

            // Check collision with core shield
            if (a.pos.length() < 1.85) {
              spawnBurst(a.pos, 0xef4444);
              scene.remove(a.group);
              asteroids.splice(i, 1);
              liveShield = Math.max(0, liveShield - 20);
              setShield(liveShield);
              trauma = 0.6;
              hitstopTimer = 0.05;
              playTone(130, 0.28, 'sawtooth', 0.12);

              if (liveShield <= 0) {
                setPhase('GAME_OVER');
                phaseRef.current = 'GAME_OVER';
                commitFinalScore(liveScore, false);
              }
              continue;
            }

            // Check collision with projectiles
            let destroyed = false;
            for (let j = projectiles.length - 1; j >= 0; j--) {
              const p = projectiles[j];
              if (p.pos.distanceTo(a.pos) < a.radius + 0.32) {
                scene.remove(p.mesh);
                projectiles.splice(j, 1);
                a.hp -= 1;
                if (a.hp <= 0) {
                  spawnBurst(a.pos, 0xf59e0b);
                  scene.remove(a.group);
                  asteroids.splice(i, 1);
                  liveScore += 100 * liveWave;
                  defeatedInWave += 1;
                  setScore(liveScore);
                  trauma = 0.25;
                  hitstopTimer = 0.035;
                  playTone(720, 0.14, 'sine', 0.09);

                  if (defeatedInWave >= 6 + liveWave * 2) {
                    if (liveWave >= 3) {
                      setPhase('VICTORY');
                      phaseRef.current = 'VICTORY';
                      commitFinalScore(liveScore + liveShield * 5, true);
                    } else {
                      liveWave += 1;
                      defeatedInWave = 0;
                      setWave(liveWave);
                      playTone(880, 0.22, 'triangle', 0.1);
                    }
                  }
                  destroyed = true;
                } else {
                  playTone(380, 0.09, 'square', 0.05);
                }
                break;
              }
            }
            if (destroyed) continue;
          }

          // Update bursts
          for (let i = bursts.length - 1; i >= 0; i--) {
            const b = bursts[i];
            b.life -= dt;
            b.mesh.position.addScaledVector(b.vel, dt);
            b.mesh.scale.setScalar(Math.max(0.01, b.life * 2));
            if (b.life <= 0) {
              scene.remove(b.mesh);
              bursts.splice(i, 1);
            }
          }
        }
      }

      // Apply camera trauma decay
      if (trauma > 0) {
        trauma = Math.max(0, trauma - dt * 2.2);
        const shake = trauma * trauma * 0.4;
        camera.position.set(
          baseCamPos.x + (Math.random() - 0.5) * shake,
          baseCamPos.y + (Math.random() - 0.5) * shake,
          baseCamPos.z
        );
      } else {
        camera.position.copy(baseCamPos);
      }

      renderer.render(scene, camera);
      if (softwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      clearEntities();
      envRT.dispose();
      renderer.dispose();
    };
  }, [open, commitFinalScore, playTone]);

  // Keyboard controls (Space to fire, P / Escape to pause)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phaseRef.current === 'PLAYING') {
        e.preventDefault();
        simApiRef.current?.firePulse();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (phaseRef.current === 'PLAYING') setPhase('PAUSED');
        else if (phaseRef.current === 'PAUSED') setPhase('PLAYING');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Orbital Trajectory Defender Physics Game"
      className="fixed inset-0 z-50 bg-[#050812] text-white select-none overflow-hidden"
    >
      {/* Full-Viewport Interactive 3D Canvas */}
      <div
        ref={mountRef}
        onPointerMove={(e) => simApiRef.current?.setAimFromClient(e.clientX, e.clientY)}
        onPointerDown={(e) => {
          simApiRef.current?.setAimFromClient(e.clientX, e.clientY);
          simApiRef.current?.firePulse();
        }}
        className="w-full h-full cursor-crosshair"
      />

      {/* Minimal Playing HUD (pointer-events-none except buttons) */}
      <div className="pointer-events-none fixed inset-x-0 top-0 p-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-700 bg-[#0B1120]/90 px-3.5 py-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Score</span>
            <span className="text-lg font-mono font-bold text-sky-400 tabular-nums">{score}</span>
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0B1120]/90 px-3.5 py-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Wave</span>
            <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">{wave} / 3</span>
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0B1120]/90 px-3.5 py-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Core Shield</span>
              <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">{shield}%</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
            className="rounded-lg border border-slate-700 bg-[#0B1120] p-2.5 text-slate-200 hover:border-sky-500 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {phase === 'PLAYING' && (
            <button
              type="button"
              onClick={() => setPhase('PAUSED')}
              aria-label="Pause game"
              className="rounded-lg border border-slate-700 bg-[#0B1120] p-2.5 text-slate-200 hover:border-sky-500 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit game"
            className="rounded-lg border border-slate-700 bg-[#0B1120] p-2.5 text-slate-200 hover:border-red-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TITLE / PAUSE / VICTORY / GAME OVER MODAL OVERLAYS */}
      {phase !== 'PLAYING' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-700 bg-[#0B1120] p-6 text-center space-y-4 shadow-2xl">
            {phase === 'TITLE_MENU' && (
              <>
                <p className="text-xs font-medium text-sky-400">3D Physics Action Lab</p>
                <h2 className="text-2xl font-bold text-white">Orbital Trajectory Defender</h2>
                <p className="text-xs leading-relaxed text-slate-300">
                  Move cursor or finger to orbit the Kinetic Launcher around the central gravity core. Click, tap, or press Space to fire gravity-curved pulses and deflect incoming orbital debris across 3 waves.
                </p>
                <div className="rounded-lg bg-slate-900 border border-slate-800 py-2 px-3 inline-flex items-center gap-2 text-xs text-amber-400">
                  <Trophy className="w-4 h-4" />
                  <span>Best Score: {highScore}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => simApiRef.current?.resetGame()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Launch Mission</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Return to Gyaan Graph
                  </button>
                </div>
              </>
            )}

            {phase === 'PAUSED' && (
              <>
                <h2 className="text-xl font-bold text-white">Mission Paused</h2>
                <p className="text-xs text-slate-300">Score: {score} · Wave {wave} of 3</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPhase('PLAYING')}
                    className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 cursor-pointer"
                  >
                    Resume Mission
                  </button>
                  <button
                    type="button"
                    onClick={() => simApiRef.current?.resetGame()}
                    className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Restart
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 cursor-pointer"
                  >
                    Exit to Platform
                  </button>
                </div>
              </>
            )}

            {(phase === 'VICTORY' || phase === 'GAME_OVER') && (
              <>
                <p className="text-xs font-medium text-amber-400">
                  {phase === 'VICTORY' ? 'Orbit Stabilized!' : 'Core Shield Depleted'}
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {phase === 'VICTORY' ? 'Mission Complete' : 'Mission Ended'}
                </h2>
                <p className="text-sm font-mono text-sky-400">
                  Final Score: {score} · +{Math.max(20, Math.round(score / 15) + (phase === 'VICTORY' ? 75 : 0))} XP Earned
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => simApiRef.current?.resetGame()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-lg border border-slate-700 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Back to Gyaan Graph
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
