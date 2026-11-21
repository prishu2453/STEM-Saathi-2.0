import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CloudOff,
  Compass,
  Download,
  HardDriveDownload,
  HelpCircle,
  Info,
  Lightbulb,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  PROJECTILE_EXPERIMENT_NOTES,
  PROJECTILE_MISSIONS,
  PROJECTILE_QUIZ,
  PROJECTILE_SCIENCE_NOTES,
  buildOfflineProjectileHints,
} from '../data/projectileMission';
import { UI_TEXT } from '../data/i18n';
import { useSpeech } from '../hooks/useSpeech';
import {
  PROJECTILE_MEDIA_SIZE_BYTES,
  PROJECTILE_MEDIA_URL,
  PROJECTILE_PACK_ID,
  downloadProjectileLessonPack,
  formatBytes,
  getOfflineCapabilities,
  getOfflinePackMeta,
  getProjectileAttempts,
  recordProjectileAttempt,
  removeOfflinePack,
  type ServiceWorkerEnvironmentStatus,
} from '../lib/offlineStore';
import type {
  Language,
  OfflineDownloadStatus,
  OfflinePackMeta,
  ProjectileAttemptRecord,
  SyncStatus,
} from '../types/stem';
import { ProjectileTutorial } from './ProjectileTutorial';

interface ProjectileMissionLabProps {
  language: Language;
  lowPowerMode: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  isCompleted: boolean;
  isTutorialCompleted?: boolean;
  onTutorialCompleted?: () => void;
  onAttemptRecorded: (hit: boolean) => void;
  onLogReading: () => void;
  onCompleteModule: () => void;
  onSaveProjectileQuiz: (scorePct: number) => void;
  onOfflinePacksChanged: () => void;
  onOpenPracticalTab: () => void;
  focusSection?: 'mission' | 'download' | null;
}

const LABELS = {
  en: {
    chooseMission: 'Select Mission',
    stepPredict: '1. Predict Before Launch',
    stepLaunch: '2. Adjust & Launch',
    stepResults: '3. Results & Offline Hints',
    stepQuiz: '4. Quick Quiz & Experiment Notes',
    angleLabel: 'Launch Angle (θ)',
    speedLabel: 'Initial Speed (v₀)',
    gravityLabel: 'Gravity (g)',
    massLabel: 'Ball Mass (m)',
    launchBtn: 'Launch Ball',
    relaunchBtn: 'Relaunch',
    rangeLabel: 'Range (R)',
    heightLabel: 'Max Height (H)',
    timeLabel: 'Flight Time (T)',
    keLabel: 'Initial Energy (KE₀)',
    targetLabel: 'Target Zone',
    missLabel: 'Offset from Target',
    hitStatus: 'Target Reached!',
    missStatus: 'Missed Target — Investigate Why',
    noLaunchYet: 'Make a prediction and press Launch Ball to test your trajectory.',
    revealHint: 'Reveal Next Hint',
    allHintsShown: 'All 3 offline hints shown',
    reflectTitle: 'Try Again & Explain What Changed',
    reflectPlaceholder: 'e.g., Moving angle closer to 45° or raising speed increased the range...',
    reflectSave: 'Save Explanation',
    reflectSaved: 'Reflection saved to device history',
    graphTitle: 'Range vs Launch Angle Comparison (at current speed & gravity)',
    ghostLegend: 'Dashed gray = previous launch',
    currentLegend: 'Blue = current launch',
    downloadTitle: 'Download Projectile Lesson for Offline Use',
    downloadBtn: 'Download for Offline',
    removeBtn: 'Remove Offline Copy',
    includeMediaLabel: 'Include optional Physics illustration image',
    corePackLabel: 'Core lesson, 2D lab, offline hints & quiz',
    attemptHistoryTitle: 'Recent Launch Attempts (Saved on Device)',
    checkPrediction: 'Lock Prediction',
    hintBtn: 'Show Hint',
    verifyQuiz: 'Check Quiz Answers',
    textSummaryLabel: 'Accessible Text Summary of Current Trajectory',
  },
  hi: {
    chooseMission: 'मिशन चुनें',
    stepPredict: '1. प्रक्षेपण से पहले अनुमान',
    stepLaunch: '2. मान बदलें और प्रक्षेपण करें',
    stepResults: '3. परिणाम और ऑफ़लाइन संकेत',
    stepQuiz: '4. त्वरित क्विज़ और प्रयोग नोट्स',
    angleLabel: 'प्रक्षेपण कोण (θ)',
    speedLabel: 'प्रारंभिक चाल (v₀)',
    gravityLabel: 'गुरुत्व (g)',
    massLabel: 'गेंद का द्रव्यमान (m)',
    launchBtn: 'गेंद फेंकें',
    relaunchBtn: 'फिर से फेंकें',
    rangeLabel: 'क्षैतिज परास (R)',
    heightLabel: 'अधिकतम ऊँचाई (H)',
    timeLabel: 'उड्डयन समय (T)',
    keLabel: 'प्रारंभिक ऊर्जा (KE₀)',
    targetLabel: 'लक्ष्य क्षेत्र',
    missLabel: 'लक्ष्य से अंतर',
    hitStatus: 'लक्ष्य पूरा हुआ!',
    missStatus: 'लक्ष्य से चूक — कारण समझें',
    noLaunchYet: 'पहले अनुमान चुनें और पथ देखने के लिए गेंद फेंकें।',
    revealHint: 'अगला संकेत देखें',
    allHintsShown: 'सभी 3 ऑफ़लाइन संकेत दिखाए गए',
    reflectTitle: 'दोबारा प्रयास करें और बताएँ क्या बदला',
    reflectPlaceholder: 'उदा., कोण को 45° के पास लाने या चाल बढ़ाने से परास बढ़ गया...',
    reflectSave: 'व्याख्या सहेजें',
    reflectSaved: 'व्याख्या डिवाइस इतिहास में सहेजी गई',
    graphTitle: 'कोण बनाम परास तुलना ग्राफ़ (वर्तमान चाल व गुरुत्व पर)',
    ghostLegend: 'डैश ग्रे = पिछला प्रयास',
    currentLegend: 'नीला = वर्तमान पथ',
    downloadTitle: 'ऑफ़लाइन उपयोग के लिए प्रक्षेप्य पाठ डाउनलोड करें',
    downloadBtn: 'ऑफ़लाइन के लिए डाउनलोड करें',
    removeBtn: 'ऑफ़लाइन कॉपी हटाएँ',
    includeMediaLabel: 'वैकल्पिक भौतिकी चित्र शामिल करें',
    corePackLabel: 'मुख्य पाठ, 2D लैब, ऑफ़लाइन संकेत और क्विज़',
    attemptHistoryTitle: 'हाल के प्रयास (डिवाइस में सहेजे गए)',
    checkPrediction: 'अनुमान पक्का करें',
    hintBtn: 'संकेत देखें',
    verifyQuiz: 'क्विज़ उत्तर जाँचें',
    textSummaryLabel: 'वर्तमान पथ का सुलभ पाठ विवरण',
  },
  kn: {
    chooseMission: 'ಮಿಷನ್ ಆಯ್ಕೆಮಾಡಿ',
    stepPredict: '1. ಉಡಾವಣೆಗೆ ಮೊದಲು ಊಹಿಸಿ',
    stepLaunch: '2. ಹೊಂದಿಸಿ ಮತ್ತು ಉಡಾವಣೆ ಮಾಡಿ',
    stepResults: '3. ಫಲಿತಾಂಶ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಸುಳಿವುಗಳು',
    stepQuiz: '4. ಕ್ವಿಜ್ ಮತ್ತು ಪ್ರಯೋಗ ಟಿಪ್ಪಣಿಗಳು',
    angleLabel: 'ಉಡಾವಣಾ ಕೋನ (θ)',
    speedLabel: 'ಆರಂಭಿಕ ವೇಗ (v₀)',
    gravityLabel: 'ಗುರುತ್ವ (g)',
    massLabel: 'ಚೆಂಡಿನ ದ್ರವ್ಯರಾಶಿ (m)',
    launchBtn: 'ಚೆಂಡನ್ನು ಎಸೆಯಿರಿ',
    relaunchBtn: 'ಮತ್ತೆ ಎಸೆಯಿರಿ',
    rangeLabel: 'ಸಮತಲ ದೂರ (R)',
    heightLabel: 'ಗರಿಷ್ಠ ಎತ್ತರ (H)',
    timeLabel: 'ಹಾರಾಟದ ಸಮಯ (T)',
    keLabel: 'ಆರಂಭಿಕ ಶಕ್ತಿ (KE₀)',
    targetLabel: 'ಗುರಿ ವಲಯ',
    missLabel: 'ಗುರಿಗಿಂತ ವ್ಯತ್ಯಾಸ',
    hitStatus: 'ಗುರಿ ತಲುಪಿತು!',
    missStatus: 'ಗುರಿ ತಪ್ಪಿದೆ — ಕಾರಣ ತಿಳಿಯಿರಿ',
    noLaunchYet: 'ಮೊದಲು ಊಹೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ಚೆಂಡನ್ನು ಎಸೆಯಿರಿ.',
    revealHint: 'ಮುಂದಿನ ಸುಳಿವು ನೋಡಿ',
    allHintsShown: 'ಎಲ್ಲಾ 3 ಆಫ್‌ಲೈನ್ ಸುಳಿವುಗಳನ್ನು ತೋರಿಸಲಾಗಿದೆ',
    reflectTitle: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಮತ್ತು ಏನು ಬದಲಾಯಿತು ಎಂದು ವಿವರಿಸಿ',
    reflectPlaceholder: 'ಉದಾ., ಕೋನವನ್ನು 45° ಹತ್ತಿರ ತಂದಾಗ ಅಥವಾ ವೇಗ ಹೆಚ್ಚಿಸಿದಾಗ ದೂರ ಹೆಚ್ಚಾಯಿತು...',
    reflectSave: 'ವಿವರಣೆ ಉಳಿಸಿ',
    reflectSaved: 'ವಿವರಣೆ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    graphTitle: 'ಕೋನ ಮತ್ತು ದೂರ ಹೋಲಿಕೆ ಗ್ರಾಫ್ (ಪ್ರಸ್ತುತ ವೇಗ ಮತ್ತು ಗುರುತ್ವದಲ್ಲಿ)',
    ghostLegend: 'ಚುಕ್ಕೆ ಬೂದು = ಹಿಂದಿನ ಎಸೆತ',
    currentLegend: 'ನೀಲಿ = ಪ್ರಸ್ತುತ ಪಥ',
    downloadTitle: 'ಆಫ್‌ಲೈನ್ ಬಳಕೆಗಾಗಿ ಪ್ರಕ್ಷೇಪಕ ಪಾಠ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    downloadBtn: 'ಆಫ್‌ಲೈನ್‌ಗಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    removeBtn: 'ಆಫ್‌ಲೈನ್ ಪ್ರತಿ ತೆಗೆಯಿರಿ',
    includeMediaLabel: 'ಐಚ್ಛಿಕ ಭೌತಶಾಸ್ತ್ರ ಚಿತ್ರ ಸೇರಿಸಿ',
    corePackLabel: 'ಮುಖ್ಯ ಪಾಠ, 2D ಲ್ಯಾಬ್, ಆಫ್‌ಲೈನ್ ಸುಳಿವುಗಳು ಮತ್ತು ಕ್ವಿಜ್',
    attemptHistoryTitle: 'ಇತ್ತೀಚಿನ ಪ್ರಯತ್ನಗಳು (ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ)',
    checkPrediction: 'ಊಹೆ ದೃಢಪಡಿಸಿ',
    hintBtn: 'ಸುಳಿವು ತೋರಿಸಿ',
    verifyQuiz: 'ಕ್ವಿಜ್ ಉತ್ತರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
    textSummaryLabel: 'ಪ್ರಸ್ತುತ ಪಥದ ಪಠ್ಯ ವಿವರಣೆ',
  },
};

export const ProjectileMissionLab: React.FC<ProjectileMissionLabProps> = ({
  language,
  lowPowerMode,
  isOnline,
  syncStatus,
  pendingSyncCount,
  isCompleted,
  isTutorialCompleted = false,
  onTutorialCompleted,
  onAttemptRecorded,
  onLogReading,
  onCompleteModule,
  onSaveProjectileQuiz,
  onOfflinePacksChanged,
  onOpenPracticalTab,
  focusSection,
}) => {
  const t = UI_TEXT[language];
  const l = LABELS[language];
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const [missionIndex, setMissionIndex] = useState(0);
  const mission = PROJECTILE_MISSIONS[missionIndex] ?? PROJECTILE_MISSIONS[0];

  const [angle, setAngle] = useState(mission.starterAngle);
  const [velocity, setVelocity] = useState(mission.starterVelocity);
  const [gravity, setGravity] = useState(mission.defaultGravity);
  const [mass, setMass] = useState(2.0);

  // Prediction state
  const [predictionIndex, setPredictionIndex] = useState<number | null>(null);
  const [predictionChecked, setPredictionChecked] = useState(false);

  // Launch animation & previous ghost trajectory
  const [hasLaunched, setHasLaunched] = useState(false);
  const [animRunning, setAnimRunning] = useState(false);
  const [flightProgress, setFlightProgress] = useState(1); // 0..1
  const [prevLaunch, setPrevLaunch] = useState<{
    angle: number;
    velocity: number;
    gravity: number;
  } | null>(null);
  const [lastLaunch, setLastLaunch] = useState<{
    angle: number;
    velocity: number;
    gravity: number;
    mass: number;
    range: number;
    maxHeight: number;
    tFlight: number;
    hit: boolean;
  } | null>(null);

  // Progressive offline hints + reflection
  const [hintsShown, setHintsShown] = useState(0);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Captions for TTS accessibility
  const [captionText, setCaptionText] = useState<string | null>(null);

  // Offline Download & IndexedDB Attempt History state
  const [downloadStatus, setDownloadStatus] = useState<OfflineDownloadStatus>('not-downloaded');
  const [downloadStep, setDownloadStep] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [offlineMeta, setOfflineMeta] = useState<OfflinePackMeta | null>(null);
  const [includeMedia, setIncludeMedia] = useState(false);
  const [swCapabilities, setSwCapabilities] = useState<ServiceWorkerEnvironmentStatus | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<ProjectileAttemptRecord[]>([]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizHintVisible, setQuizHintVisible] = useState<Record<string, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadCardRef = useRef<HTMLDivElement | null>(null);

  const speakWithCaption = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setCaptionText(null);
      return;
    }
    setCaptionText(text);
    speak(text);
  };

  useEffect(() => {
    if (!isSpeaking) {
      // keep caption visible briefly or let user close it
    }
  }, [isSpeaking]);

  // Verify real offline pack status & attempt history from IndexedDB on mount
  const refreshOfflineStatus = useCallback(async () => {
    const [meta, caps, attempts] = await Promise.all([
      getOfflinePackMeta(PROJECTILE_PACK_ID),
      getOfflineCapabilities(),
      getProjectileAttempts(),
    ]);
    setOfflineMeta(meta);
    setDownloadStatus(meta ? 'available-offline' : 'not-downloaded');
    setSwCapabilities(caps);
    setAttemptHistory(attempts);
  }, []);

  useEffect(() => {
    void refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  useEffect(() => {
    if (focusSection === 'download') {
      downloadCardRef.current?.scrollIntoView({ behavior: lowPowerMode ? 'auto' : 'smooth', block: 'center' });
    }
  }, [focusSection, lowPowerMode]);

  const handleSelectMission = (idx: number) => {
    const next = PROJECTILE_MISSIONS[idx];
    setMissionIndex(idx);
    setAngle(next.starterAngle);
    setVelocity(next.starterVelocity);
    setGravity(next.defaultGravity);
    setPredictionIndex(null);
    setPredictionChecked(false);
    setHasLaunched(false);
    setAnimRunning(false);
    setHintsShown(0);
    setReflectionSaved(false);
    setReflectionText('');
    setLastLaunch(null);
  };

  // Exact physics calculations (ideal projectile motion on flat ground, y0 = 0, no air resistance)
  const metrics = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(rad);
    const vy = velocity * Math.sin(rad);
    const tFlight = (2 * vy) / gravity;
    const maxHeight = (vy * vy) / (2 * gravity);
    const range = (velocity * velocity * Math.sin(2 * rad)) / gravity;
    const ke0 = 0.5 * mass * velocity * velocity;
    const missDelta = range - mission.targetDistance;
    const isHit = Math.abs(missDelta) <= mission.tolerance;
    return { rad, vx, vy, tFlight, maxHeight, range, ke0, missDelta, isHit };
  }, [angle, velocity, gravity, mass, mission.targetDistance, mission.tolerance]);

  const dynamicHints = useMemo(() => {
    const targetMetrics = lastLaunch ?? {
      angle,
      velocity,
      gravity,
      range: metrics.range,
    };
    return buildOfflineProjectileHints({
      language,
      angle: targetMetrics.angle,
      velocity: targetMetrics.velocity,
      gravity: targetMetrics.gravity,
      range: targetMetrics.range,
      targetDistance: mission.targetDistance,
      tolerance: mission.tolerance,
    });
  }, [language, lastLaunch, angle, velocity, gravity, metrics.range, mission.targetDistance, mission.tolerance]);

  // Animate projectile flight when launched (unless lowPowerMode / reduced-motion)
  useEffect(() => {
    if (!animRunning) return;
    if (lowPowerMode) {
      setFlightProgress(1);
      setAnimRunning(false);
      return;
    }

    let rafId = 0;
    const durationMs = Math.min(2600, Math.max(900, metrics.tFlight * 420));
    const startTs = performance.now();

    const step = (now: number) => {
      const p = Math.min(1, (now - startTs) / durationMs);
      setFlightProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setAnimRunning(false);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [animRunning, lowPowerMode, metrics.tFlight]);

  // Draw crisp 2D canvas with ground ruler, target ring, ghost previous launch, and current parabola
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background + subtle meter grid
    ctx.fillStyle = '#090F1B';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const originX = 48;
    const groundY = h - 38;
    const prevRange = prevLaunch
      ? (prevLaunch.velocity * prevLaunch.velocity * Math.sin((2 * prevLaunch.angle * Math.PI) / 180)) /
        prevLaunch.gravity
      : 0;
    const prevHeight = prevLaunch
      ? Math.pow(prevLaunch.velocity * Math.sin((prevLaunch.angle * Math.PI) / 180), 2) /
        (2 * prevLaunch.gravity)
      : 0;

    const worldMaxX = Math.max(mission.targetDistance + 20, metrics.range + 12, prevRange + 10, 80);
    const worldMaxY = Math.max(metrics.maxHeight + 8, prevHeight + 6, 30);
    const scaleX = (w - 86) / worldMaxX;
    const scaleY = (h - 76) / worldMaxY;
    const scale = Math.min(scaleX, scaleY);

    // Ground baseline + distance ticks
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(w - 20, groundY);
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    const stepMeters = worldMaxX > 120 ? 30 : 15;
    for (let m = 0; m <= worldMaxX; m += stepMeters) {
      const tx = originX + m * scale;
      if (tx > w - 24) break;
      ctx.beginPath();
      ctx.moveTo(tx, groundY);
      ctx.lineTo(tx, groundY + 6);
      ctx.stroke();
      ctx.fillText(`${m}m`, tx, groundY + 20);
    }

    // Target zone on ground
    const targetCenterX = originX + mission.targetDistance * scale;
    const tolPx = Math.max(6, mission.tolerance * scale);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(targetCenterX - tolPx, groundY - 6, tolPx * 2, 12);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(targetCenterX, groundY - 34);
    ctx.lineTo(targetCenterX, groundY + 4);
    ctx.stroke();
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(targetCenterX, groundY - 34);
    ctx.lineTo(targetCenterX + 18, groundY - 26);
    ctx.lineTo(targetCenterX, groundY - 18);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    ctx.fillText(`${mission.targetDistance}m`, targetCenterX, groundY - 40);

    // Previous attempt ghost trajectory (for visual comparison)
    if (prevLaunch) {
      const pRad = (prevLaunch.angle * Math.PI) / 180;
      const pVx = prevLaunch.velocity * Math.cos(pRad);
      const pVy0 = prevLaunch.velocity * Math.sin(pRad);
      const pT = (2 * pVy0) / prevLaunch.gravity;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const ts = (i / 50) * pT;
        const px = originX + pVx * ts * scale;
        const py = groundY - (pVy0 * ts - 0.5 * prevLaunch.gravity * ts * ts) * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Preview guide arc before first launch, or solid current trajectory
    ctx.strokeStyle = hasLaunched ? '#38BDF8' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = hasLaunched ? 3 : 2;
    if (!hasLaunched) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const maxStep = hasLaunched ? Math.max(1, Math.round(60 * flightProgress)) : 24;
    const totalSteps = 60;
    for (let i = 0; i <= (hasLaunched ? maxStep : 24); i++) {
      const ts = hasLaunched
        ? (i / totalSteps) * metrics.tFlight
        : (i / totalSteps) * metrics.tFlight * 0.45;
      const px = originX + metrics.vx * ts * scale;
      const py = groundY - Math.max(0, metrics.vy * ts - 0.5 * gravity * ts * ts) * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Launcher barrel angle indicator
    const barrelLen = 30;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(originX, groundY);
    ctx.lineTo(originX + Math.cos(metrics.rad) * barrelLen, groundY - Math.sin(metrics.rad) * barrelLen);
    ctx.stroke();

    // Moving or resting projectile ball
    const currentT = hasLaunched ? flightProgress * metrics.tFlight : 0;
    const bx = originX + metrics.vx * currentT * scale;
    const by = groundY - Math.max(0, metrics.vy * currentT - 0.5 * gravity * currentT * currentT) * scale;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Velocity vector on active ball
    if (hasLaunched && flightProgress < 1) {
      const vyNow = metrics.vy - gravity * currentT;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + metrics.vx * 1.1, by - vyNow * 1.1);
      ctx.stroke();
    }

    // Apex height marker once flight finishes
    if (hasLaunched && flightProgress >= 0.5) {
      const apexX = originX + (metrics.range / 2) * scale;
      const apexY = groundY - metrics.maxHeight * scale;
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.beginPath();
      ctx.moveTo(apexX, apexY);
      ctx.lineTo(apexX, groundY);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#FCD34D';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText(`H=${metrics.maxHeight.toFixed(1)}m`, apexX, Math.max(14, apexY - 6));
    }
  }, [
    angle,
    velocity,
    gravity,
    metrics,
    mission.targetDistance,
    mission.tolerance,
    hasLaunched,
    flightProgress,
    prevLaunch,
  ]);

  const handleLaunch = async () => {
    if (lastLaunch) {
      setPrevLaunch({
        angle: lastLaunch.angle,
        velocity: lastLaunch.velocity,
        gravity: lastLaunch.gravity,
      });
    }
    setHasLaunched(true);
    setFlightProgress(lowPowerMode ? 1 : 0);
    setAnimRunning(!lowPowerMode);
    setHintsShown(metrics.isHit ? 0 : 1);
    setReflectionSaved(false);

    const snapshot = {
      angle,
      velocity,
      gravity,
      mass,
      range: metrics.range,
      maxHeight: metrics.maxHeight,
      tFlight: metrics.tFlight,
      hit: metrics.isHit,
    };
    setLastLaunch(snapshot);

    const attempt: ProjectileAttemptRecord = {
      id: `att-${Date.now()}`,
      missionId: mission.id,
      timestamp: new Date().toISOString(),
      angle,
      velocity,
      gravity,
      mass,
      range: Number(metrics.range.toFixed(2)),
      maxHeight: Number(metrics.maxHeight.toFixed(2)),
      tFlight: Number(metrics.tFlight.toFixed(2)),
      targetDistance: mission.targetDistance,
      hit: metrics.isHit,
      predictionIndex,
      synced: false,
    };

    const updatedHistory = await recordProjectileAttempt(attempt);
    setAttemptHistory(updatedHistory);
    onAttemptRecorded(metrics.isHit);
  };

  const handleSaveReflection = async () => {
    if (!reflectionText.trim() || reflectionSaved) return;
    setReflectionSaved(true);
    const attempt: ProjectileAttemptRecord = {
      id: `ref-${Date.now()}`,
      missionId: mission.id,
      timestamp: new Date().toISOString(),
      angle,
      velocity,
      gravity,
      mass,
      range: Number(metrics.range.toFixed(2)),
      maxHeight: Number(metrics.maxHeight.toFixed(2)),
      tFlight: Number(metrics.tFlight.toFixed(2)),
      targetDistance: mission.targetDistance,
      hit: metrics.isHit,
      predictionIndex,
      reflectionNote: reflectionText.trim(),
      synced: false,
    };
    const updatedHistory = await recordProjectileAttempt(attempt);
    setAttemptHistory(updatedHistory);
    onLogReading();
  };

  const handleDownloadLesson = async () => {
    setDownloadStatus('downloading');
    setDownloadError(null);
    setDownloadStep('Preparing lesson pack...');
    try {
      const meta = await downloadProjectileLessonPack({
        includeMedia,
        onStep: (msg) => setDownloadStep(msg),
      });
      setOfflineMeta(meta);
      setDownloadStatus('available-offline');
      setDownloadStep(null);
      onOfflinePacksChanged();
    } catch (err) {
      setDownloadStatus('not-downloaded');
      setDownloadStep(null);
      setDownloadError(err instanceof Error ? err.message : 'Unable to save offline pack.');
    }
  };

  const handleRemoveOffline = async () => {
    await removeOfflinePack(PROJECTILE_PACK_ID);
    setOfflineMeta(null);
    setDownloadStatus('not-downloaded');
    onOfflinePacksChanged();
  };

  // Angle vs Range curve points for visual comparison chart
  const curveChart = useMemo(() => {
    const pts: { theta: number; r: number }[] = [];
    let maxR = (velocity * velocity) / gravity;
    maxR = Math.max(maxR, mission.targetDistance + 10, 20);
    for (let th = 10; th <= 85; th += 3) {
      const r = (velocity * velocity * Math.sin((2 * th * Math.PI) / 180)) / gravity;
      pts.push({ theta: th, r });
    }
    const compAngle = 90 - angle;
    return { pts, maxR, compAngle };
  }, [velocity, gravity, angle, mission.targetDistance]);

  const handleSubmitQuiz = () => {
    let correct = 0;
    PROJECTILE_QUIZ.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct += 1;
    });
    const pct = Math.round((correct / PROJECTILE_QUIZ.length) * 100);
    setQuizSubmitted(true);
    onSaveProjectileQuiz(pct);
  };

  return (
    <div className="space-y-6">
      {/* MISSION & REAL OFFLINE DOWNLOAD PANEL */}
      <div
        ref={downloadCardRef}
        className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                {mission.title[language]}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-medium ${
                  downloadStatus === 'available-offline'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : downloadStatus === 'downloading'
                    ? 'text-[#5B21B6] dark:text-[#C4B5FD]'
                    : 'text-[#B27B16] dark:text-[#FF9F1C]'
                }`}
              >
                {downloadStatus === 'available-offline'
                  ? t.statusAvailableOffline
                  : downloadStatus === 'downloading'
                  ? t.statusDownloading
                  : t.statusNotDownloaded}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#4A3F66] dark:text-[#A496D4]">
                {syncStatus === 'waiting-to-sync' || pendingSyncCount > 0
                  ? `${t.statusWaitingSync} (${pendingSyncCount})`
                  : syncStatus === 'synced'
                  ? t.statusSyncedCloud
                  : t.statusSavedLocally}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#C9BFEA] max-w-3xl leading-relaxed">
              {mission.scenario[language]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PROJECTILE_MISSIONS.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMission(idx)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  missionIndex === idx
                    ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9]'
                }`}
              >
                {idx + 1}. {m.targetDistance}m ({m.defaultGravity === 1.62 ? 'Moon' : 'Earth'})
              </button>
            ))}
          </div>
        </div>

        {/* Honest Offline Pack Download Controls */}
        <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] flex items-center gap-1.5">
              <HardDriveDownload className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
              <span>{l.downloadTitle}</span>
            </p>
            <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
              {l.corePackLabel} (~18 KB)
              {offlineMeta && (
                <span>
                  {' '}
                  · Saved {formatBytes(offlineMeta.coreSizeBytes + offlineMeta.mediaSizeBytes)}
                  {offlineMeta.includesMedia ? ' (with image)' : ' (text & simulator only)'}
                </span>
              )}
            </p>
            <label className="inline-flex items-center gap-2 text-xs text-[#22163F] dark:text-[#C9BFEA] pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
                className="h-4 w-4 accent-[#6D28D9] rounded cursor-pointer"
              />
              <span>
                {l.includeMediaLabel} (+{formatBytes(PROJECTILE_MEDIA_SIZE_BYTES)})
              </span>
            </label>
            {swCapabilities && !swCapabilities.controlling && (
              <p className="text-[11px] text-[#B27B16] dark:text-[#FF9F1C]">
                {swCapabilities.registered
                  ? 'Service worker registered for app shell. Reload once while online if needed for offline browser refresh; lesson data & progress are saved in IndexedDB.'
                  : 'Browser preview iframe may restrict Service Worker reload offline; lesson data & attempts are saved locally in IndexedDB.'}
              </p>
            )}
            {downloadStep && <p className="text-[11px] text-[#5B21B6] dark:text-[#C4B5FD]">{downloadStep}</p>}
            {downloadError && <p className="text-[11px] text-red-600 dark:text-red-400">{downloadError}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={downloadStatus === 'downloading'}
              onClick={() => void handleDownloadLesson()}
              className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                downloadStatus === 'available-offline'
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-[#6D28D9] text-white hover:bg-[#5B21B6]'
              }`}
            >
              {downloadStatus === 'available-offline' ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {downloadStatus === 'downloading'
                  ? t.statusDownloading
                  : downloadStatus === 'available-offline'
                  ? `${t.statusAvailableOffline} (Update)`
                  : l.downloadBtn}
              </span>
            </button>

            {downloadStatus === 'available-offline' && (
              <button
                type="button"
                onClick={() => void handleRemoveOffline()}
                aria-label={l.removeBtn}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3 py-2 text-xs text-[#22163F] dark:text-[#C9BFEA] hover:border-[#6D28D9] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{l.removeBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Downloaded Media Preview (only if user opted in) */}
        {offlineMeta?.includesMedia && (
          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#0D1B2A] p-3 flex flex-col sm:flex-row items-center gap-3">
            <img
              src={PROJECTILE_MEDIA_URL}
              alt="Physics mechanics apparatus diagram"
              referrerPolicy="no-referrer"
              className="w-full sm:w-36 h-24 object-cover rounded-lg border border-[#3B2C78]"
            />
            <div className="text-xs text-[#C9BFEA] space-y-1">
              <p className="font-semibold text-[#F3EFFF]">Offline Media Cached ({formatBytes(offlineMeta.mediaSizeBytes)})</p>
              <p className="text-[#A496D4]">
                Visual reference for projectile &amp; rotational mechanics stored in Cache Storage.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SCIENTIFIC ASSUMPTIONS & MASS INVARIANCE EXPLANATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="a11y-surface rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-1.5">
          <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>R = (v₀² · sin 2θ) / g</span>
          </p>
          <p className="text-xs leading-relaxed text-[#22163F] dark:text-[#C9BFEA]">
            {PROJECTILE_SCIENCE_NOTES.idealAssumption[language]}
          </p>
        </div>

        <div className="a11y-surface rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-1.5">
          <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#FF9F1C] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#F07C00] dark:text-[#FF9F1C] shrink-0" aria-hidden="true" />
            <span>KE₀ = ½ m v₀²</span>
          </p>
          <p className="text-xs leading-relaxed text-[#22163F] dark:text-[#C9BFEA]">
            {PROJECTILE_SCIENCE_NOTES.massNote[language]}
          </p>
        </div>
      </div>

      {/* GUIDED INTERACTIVE TUTORIAL (Angle, Speed & Range before starting mission) */}
      <ProjectileTutorial
        language={language}
        isCompleted={isTutorialCompleted}
        isSpeaking={isSpeaking}
        onSpeak={speakWithCaption}
        onCompleteTutorial={() => onTutorialCompleted?.()}
      />

      {/* STEP 1: PREDICTION BEFORE LAUNCH */}
      <div
        id="projectile-step-predict"
        className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
            {l.stepPredict}
          </h3>
          <button
            type="button"
            onClick={() =>
              speakWithCaption(`${mission.predictionPrompt[language]} ${mission.predictionExplanation[language]}`)
            }
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
            <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#C9BFEA]">
          {mission.predictionPrompt[language]}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {mission.predictionOptions.map((opt, idx) => {
            const chosen = predictionIndex === idx;
            const isCorrect = idx === mission.predictionCorrectIndex;
            let cls =
              'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9]';
            if (predictionChecked) {
              if (isCorrect) {
                cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
              } else if (chosen) {
                cls = 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 text-[#2E1A6E] dark:text-[#FFD9A8]';
              }
            } else if (chosen) {
              cls = 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#5B21B6] dark:text-[#C4B5FD]';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPredictionIndex(idx);
                  setPredictionChecked(true);
                }}
                className={`min-h-[44px] rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${cls}`}
              >
                {opt[language]}
              </button>
            );
          })}
        </div>

        {predictionChecked && (
          <div className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/10 p-3 text-xs text-[#22163F] dark:text-[#F3EFFF] flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{mission.predictionExplanation[language]}</span>
          </div>
        )}
      </div>

      {/* STEP 2 & 3: MAIN INTERACTIVE STAGE + LARGE TOUCH CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Stage: Canvas, Results & Comparison Graph (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs text-[#4A3F66] dark:text-[#A496D4]">
                <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{l.currentLegend}</span>
                {prevLaunch && <span>· {l.ghostLegend}</span>}
              </div>

              <div className="flex items-center gap-2">
                {animRunning && (
                  <button
                    type="button"
                    onClick={() => setAnimRunning(false)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t.pauseLabel}</span>
                  </button>
                )}
                {!animRunning && hasLaunched && flightProgress < 1 && (
                  <button
                    type="button"
                    onClick={() => setAnimRunning(true)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t.playLabel}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onLogReading();
                  }}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.logReadingLabel}</span>
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={660}
              height={310}
              className="w-full h-[260px] sm:h-[310px] rounded-xl border border-[#2E1A6E]/40 dark:border-[#3B2C78] bg-[#0D1B2A]"
              aria-label={`${mission.title.en}: range ${metrics.range.toFixed(1)} meters, max height ${metrics.maxHeight.toFixed(1)} meters, target ${mission.targetDistance} meters`}
            />

            {/* Clear Computed Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
              <div>
                <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{l.rangeLabel}</p>
                <p className="text-base font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
                  {metrics.range.toFixed(2)} m
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{l.heightLabel}</p>
                <p className="text-base font-mono font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] tabular-nums">
                  {metrics.maxHeight.toFixed(2)} m
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{l.timeLabel}</p>
                <p className="text-base font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {metrics.tFlight.toFixed(2)} s
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{l.keLabel}</p>
                <p className="text-base font-mono font-semibold text-[#B27B16] dark:text-[#FF9F1C] tabular-nums">
                  {metrics.ke0.toFixed(0)} J
                </p>
              </div>
            </div>

            {/* Accessible Text Summary for Screen Readers / Non-Visual Learners */}
            <p className="text-xs text-[#22163F] dark:text-[#C9BFEA] bg-[#F5F0FF] dark:bg-[#2A1D5C] rounded-lg px-3 py-2 border border-[#E7DDFB] dark:border-[#3B2C78]">
              <strong className="text-[#2E1A6E] dark:text-[#F3EFFF]">{l.textSummaryLabel}:</strong>{' '}
              θ = {angle}°, v₀ = {velocity} m/s, g = {gravity.toFixed(2)} m/s², m = {mass.toFixed(1)} kg →{' '}
              {l.rangeLabel} {metrics.range.toFixed(1)} m ({l.targetLabel} {mission.targetDistance} ± {mission.tolerance} m,{' '}
              {metrics.missDelta >= 0 ? `+${metrics.missDelta.toFixed(1)}` : metrics.missDelta.toFixed(1)} m).
            </p>
          </div>

          {/* Angle vs Range Visual Comparison Graph */}
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <p className="font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">{l.graphTitle}</p>
              <span className="font-mono text-[#4A3F66] dark:text-[#A496D4] tabular-nums">
                90° − {angle}° = {curveChart.compAngle}°
              </span>
            </div>

            <svg
              viewBox="0 0 420 140"
              className="w-full h-36 rounded-xl bg-[#0D1B2A] border border-[#2E1A6E]/40 dark:border-[#3B2C78]"
              role="img"
              aria-label="Graph comparing launch angle from 10 to 85 degrees against horizontal range"
            >
              {/* Target distance dashed horizontal line */}
              {mission.targetDistance <= curveChart.maxR && (
                <>
                  <line
                    x1="36"
                    x2="404"
                    y1={116 - (mission.targetDistance / curveChart.maxR) * 94}
                    y2={116 - (mission.targetDistance / curveChart.maxR) * 94}
                    stroke="#10B981"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                  <text
                    x="40"
                    y={Math.max(14, 112 - (mission.targetDistance / curveChart.maxR) * 94)}
                    fill="#34D399"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    Target {mission.targetDistance}m
                  </text>
                </>
              )}

              {/* Axes */}
              <line x1="36" y1="116" x2="404" y2="116" stroke="#334E68" strokeWidth="1" />
              <line x1="36" y1="14" x2="36" y2="116" stroke="#334E68" strokeWidth="1" />

              {/* Curve path */}
              <path
                d={curveChart.pts
                  .map((p, idx) => {
                    const x = 36 + ((p.theta - 10) / 75) * 368;
                    const y = 116 - (p.r / curveChart.maxR) * 94;
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#C4B5FD"
                strokeWidth="2.2"
              />

              {/* Complementary angle dot */}
              {curveChart.compAngle >= 10 && curveChart.compAngle <= 85 && (
                <circle
                  cx={36 + ((curveChart.compAngle - 10) / 75) * 368}
                  cy={116 - (metrics.range / curveChart.maxR) * 94}
                  r="4"
                  fill="#94A3B8"
                />
              )}

              {/* Current angle dot */}
              <circle
                cx={36 + ((angle - 10) / 75) * 368}
                cy={116 - (metrics.range / curveChart.maxR) * 94}
                r="5.5"
                fill="#FF9F1C"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              <text x="36" y="131" fill="#A496D4" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                10°
              </text>
              <text x="200" y="131" fill="#C4B5FD" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                45° (Max R)
              </text>
              <text x="386" y="131" fill="#A496D4" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                85°
              </text>
            </svg>
          </div>
        </div>

        {/* Right Deck: Accessible Touch Controls + Encouraging Hints & Reflection (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
              {l.stepLaunch}
            </h3>

            <StepperSliderControl
              label={l.angleLabel}
              valueText={`${angle}°`}
              value={angle}
              min={10}
              max={85}
              step={1}
              onChange={setAngle}
            />

            <StepperSliderControl
              label={l.speedLabel}
              valueText={`${velocity} m/s`}
              value={velocity}
              min={8}
              max={45}
              step={1}
              onChange={setVelocity}
            />

            <div className="space-y-2">
              <StepperSliderControl
                label={l.gravityLabel}
                valueText={`${gravity.toFixed(2)} m/s²`}
                value={gravity}
                min={1.62}
                max={24.8}
                step={0.1}
                onChange={(v) => setGravity(Number(v.toFixed(2)))}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Moon (1.62)', g: 1.62 },
                  { label: 'Mars (3.71)', g: 3.71 },
                  { label: 'Earth (9.81)', g: 9.81 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGravity(preset.g)}
                    className={`min-h-[42px] rounded-xl border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                      Math.abs(gravity - preset.g) < 0.08
                        ? 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#5B21B6] dark:text-[#C4B5FD]'
                        : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#22163F] dark:text-[#C9BFEA] hover:border-[#6D28D9]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <StepperSliderControl
              label={l.massLabel}
              valueText={`${mass.toFixed(1)} kg`}
              value={mass}
              min={0.5}
              max={10}
              step={0.5}
              onChange={setMass}
            />

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => void handleLaunch()}
                className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5B21B6] transition-colors cursor-pointer"
              >
                <Target className="w-4 h-4" aria-hidden="true" />
                <span>{hasLaunched ? l.relaunchBtn : l.launchBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectMission(missionIndex)}
                aria-label="Reset mission parameters"
                className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* STEP 3: ENCOURAGING RESULTS, PROGRESSIVE HINTS & REFLECTION */}
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                {l.stepResults}
              </h3>
              <button
                type="button"
                onClick={() =>
                  speakWithCaption(
                    `${dynamicHints.summary} ${dynamicHints.hints.slice(0, Math.max(1, hintsShown)).join(' ')}`
                  )
                }
                className="min-h-[40px] inline-flex items-center gap-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
                <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
              </button>
            </div>

            {!hasLaunched ? (
              <p className="text-xs text-[#4A3F66] dark:text-[#A496D4]">{l.noLaunchYet}</p>
            ) : (
              <div className="space-y-3">
                <div
                  className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                    lastLaunch?.hit
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                      : 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 text-[#2E1A6E] dark:text-[#FFD9A8]'
                  }`}
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    {lastLaunch?.hit ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#F07C00] dark:text-[#FF9F1C] shrink-0" aria-hidden="true" />
                    )}
                    <span>{lastLaunch?.hit ? l.hitStatus : l.missStatus}</span>
                  </p>
                  <p className="leading-relaxed">{dynamicHints.summary}</p>
                </div>

                {/* Progressive Offline Hints (1 -> 2 -> 3) */}
                {hintsShown > 0 && (
                  <div className="space-y-2">
                    {dynamicHints.hints.slice(0, hintsShown).map((hintText, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 text-xs text-[#22163F] dark:text-[#C9BFEA] flex items-start gap-2"
                      >
                        <Lightbulb className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{hintText}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {hintsShown < 3 ? (
                    <button
                      type="button"
                      onClick={() => setHintsShown((c) => Math.min(3, c + 1))}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#6D28D9]/40 bg-[#6D28D9]/10 px-3.5 py-2 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:bg-[#6D28D9]/20 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {l.revealHint} ({hintsShown}/3)
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">
                      {l.allHintsShown} (offline)
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={onCompleteModule}
                    disabled={isCompleted}
                    className={`min-h-[44px] ml-auto inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#2E1A6E] text-white hover:bg-[#1F4060]'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isCompleted ? t.completedXpLabel : t.completeLabLabel}</span>
                  </button>
                </div>

                {/* Try Again & Explain What Changed */}
                <div className="pt-3 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-2">
                  <label className="block text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                    {l.reflectTitle}
                  </label>
                  <textarea
                    rows={2}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder={l.reflectPlaceholder}
                    className="w-full rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs text-[#22163F] dark:text-[#F3EFFF] placeholder:text-[#4A3F66] dark:placeholder:text-[#A496D4]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={!reflectionText.trim() || reflectionSaved}
                      onClick={() => void handleSaveReflection()}
                      className="min-h-[44px] rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] disabled:opacity-50 cursor-pointer"
                    >
                      {reflectionSaved ? l.reflectSaved : l.reflectSave}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenPracticalTab}
                      className="min-h-[44px] px-2 text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD] hover:underline cursor-pointer"
                    >
                      {t.practicalLab} →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VISIBLE AUDIO CAPTION BAR (when TTS is spoken) */}
      {captionText && (
        <div
          role="region"
          aria-live="polite"
          className="rounded-xl border border-[#6D28D9]/40 bg-[#6D28D9]/10 p-3.5 text-xs text-[#22163F] dark:text-[#F3EFFF] flex items-start justify-between gap-3"
        >
          <div>
            <p className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{t.captionPrefix}</p>
            <p className="mt-0.5 leading-relaxed">{captionText}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              setCaptionText(null);
            }}
            className="text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] underline shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* STEP 4: OFFLINE EXPERIMENT NOTES + QUIZ + RECENT ATTEMPT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Quiz (7 cols) */}
        <div className="lg:col-span-7 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
              {l.stepQuiz}
            </h3>
            <span className="text-xs text-[#4A3F66] dark:text-[#A496D4]">
              {isOnline ? t.onlineStatus : `${t.offlineStatus} · Works locally`}
            </span>
          </div>

          <div className="space-y-4">
            {PROJECTILE_QUIZ.map((q, qIdx) => {
              const selected = quizAnswers[q.id];
              const isWrong = quizSubmitted && selected !== undefined && selected !== q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-2.5"
                >
                  <p className="text-xs sm:text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                    {qIdx + 1}. {q.question[language]}
                  </p>

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const chosen = selected === oIdx;
                      const isCorrect = oIdx === q.correctIndex;
                      let btnStyle =
                        'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#22163F] dark:text-[#F3EFFF] hover:border-[#6D28D9]';
                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle =
                            'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
                        } else if (chosen) {
                          btnStyle = 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 text-[#2E1A6E] dark:text-[#FFD9A8]';
                        }
                      } else if (chosen) {
                        btnStyle = 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#5B21B6] dark:text-[#C4B5FD]';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`min-h-[44px] w-full text-left rounded-xl border px-3.5 py-2 text-xs transition-colors cursor-pointer ${btnStyle}`}
                        >
                          {opt[language]}
                        </button>
                      );
                    })}
                  </div>

                  {q.hint && (
                    <div className="pt-1">
                      {!quizHintVisible[q.id] && !quizSubmitted && (
                        <button
                          type="button"
                          onClick={() => setQuizHintVisible((prev) => ({ ...prev, [q.id]: true }))}
                          className="text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD] hover:underline cursor-pointer"
                        >
                          {l.hintBtn}
                        </button>
                      )}
                      {(quizHintVisible[q.id] || isWrong) && (
                        <p className="text-xs text-[#2E1A6E] dark:text-[#FFD9A8] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 border border-[#FF9F1C]/50 rounded-lg px-3 py-2 mt-1">
                          {q.hint[language]}
                        </p>
                      )}
                    </div>
                  )}

                  {quizSubmitted && (
                    <p className="text-xs text-[#22163F] dark:text-[#C9BFEA] flex items-start gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{q.explanation[language]}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="min-h-[46px] w-full rounded-xl bg-[#6D28D9] py-2.5 text-xs font-semibold text-white hover:bg-[#5B21B6] transition-colors cursor-pointer"
          >
            {l.verifyQuiz}
          </button>
        </div>

        {/* Experiment Notes & Local IndexedDB Attempt History (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
            <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
              <span>Experiment Notes</span>
            </h3>
            <ol className="space-y-2.5 text-xs leading-relaxed text-[#22163F] dark:text-[#C9BFEA] list-decimal pl-4">
              {PROJECTILE_EXPERIMENT_NOTES.map((note, idx) => (
                <li key={idx}>{note[language]}</li>
              ))}
            </ol>
          </div>

          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                {l.attemptHistoryTitle}
              </h3>
              <span className="text-[11px] text-[#4A3F66] dark:text-[#A496D4] flex items-center gap-1">
                {!isOnline && <CloudOff className="w-3 h-3 text-[#FF9F1C]" />}
                <span>{attemptHistory.length} saved</span>
              </span>
            </div>

            {attemptHistory.length === 0 ? (
              <p className="text-xs text-[#4A3F66] dark:text-[#A496D4]">
                No launches recorded on this device yet. Launch the ball to store real attempts in IndexedDB.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {attemptHistory.slice(0, 8).map((att) => (
                  <li
                    key={att.id}
                    className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono tabular-nums">
                      <span className={att.hit ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-[#5B21B6] dark:text-[#C4B5FD]'}>
                        θ={att.angle}° · v₀={att.velocity}m/s → R={att.range}m
                      </span>
                      <span className="text-[10px] text-[#4A3F66] dark:text-[#A496D4]">
                        {att.synced ? 'Synced' : t.statusWaitingSync}
                      </span>
                    </div>
                    {att.reflectionNote && (
                      <p className="text-[11px] text-[#22163F] dark:text-[#C9BFEA] italic">
                        “{att.reflectionNote}”
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepperSliderControlProps {
  label: string;
  valueText: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const StepperSliderControl: React.FC<StepperSliderControlProps> = ({
  label,
  valueText,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, Number(v.toFixed(2))));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[#22163F] dark:text-[#C9BFEA]">{label}</span>
        <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
          {valueText}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          aria-label={`Decrease ${label}`}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer shrink-0"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 accent-[#6D28D9] cursor-pointer"
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          aria-label={`Increase ${label}`}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
