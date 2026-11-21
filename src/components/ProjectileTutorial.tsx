import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Minus,
  Plus,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import type { Language, LocalizedText } from '../types/stem';

interface ProjectileTutorialProps {
  language: Language;
  isCompleted: boolean;
  onSpeak: (text: string) => void;
  isSpeaking: boolean;
  onCompleteTutorial: () => void;
}

type TutorialStage = 1 | 2 | 3;

interface StageMeta {
  title: LocalizedText;
  takeaway: LocalizedText;
  prompt: LocalizedText;
}

const TUTORIAL_TEXT = {
  en: {
    headerTitle: 'Guided Interactive Tutorial: Angle, Speed & Range',
    headerSubtitle: 'Explore how launch angle and speed work together before starting the mission.',
    openBtn: 'Open Tutorial',
    replayBtn: 'Replay Tutorial',
    skipBtn: 'Skip to Mission',
    completedTag: 'Completed',
    stageLabel: 'Step',
    prevStep: 'Back',
    nextStep: 'Next Step',
    startMission: 'Start Mission Simulation',
    angleLabel: 'Try Launch Angle (θ)',
    speedLabel: 'Try Initial Speed (v₀)',
    fixedSpeedNote: 'Speed fixed at 20 m/s · Earth gravity (9.81 m/s²)',
    fixedAngleNote: 'Angle fixed at 45° · Compare against 10 m/s baseline',
    sandboxNote: 'Practice flag at 35.0 m (±2.5 m) · Combine angle and speed',
    vxLabel: 'Forward speed (vₓ = v₀ cos θ)',
    vyLabel: 'Upward speed (v_y = v₀ sin θ)',
    timeLabel: 'Air time (T)',
    rangeLabel: 'Horizontal range (R)',
    heightLabel: 'Peak height (H)',
    speedBoostLabel: 'Speed multiplier',
    rangeBoostLabel: 'Range multiplier',
    baselineLegend: 'Dashed = 45° optimal (Stage 1) / 10 m/s baseline (Stage 2)',
    currentLegend: 'Blue = your current launch',
    tryComplementary: 'Compare 30° vs 60°',
    reset45: 'Try 45° Peak',
    preset10: '10 m/s (1×)',
    preset20: '20 m/s (2×)',
    preset25: '25 m/s (2.5×)',
    stage1GoalMet: 'Nice discovery! At 45°, upward and forward speeds balance for maximum range (40.8 m). Notice 30° and 60° both land at 35.3 m!',
    stage2GoalMet: 'Look at that 4× jump! Doubling speed from 10 to 20 m/s doubles BOTH forward speed and air time, so range quadruples (10.2 m → 40.8 m).',
    stage3GoalMet: 'Practice flag reached! You are ready for the main Projectile Mission.',
    practiceFlag: 'Practice Flag: 35 m',
    readAloud: 'Listen (TTS)',
    stopAudio: 'Stop Audio',
  },
  hi: {
    headerTitle: 'गाइडेड इंटरैक्टिव ट्यूटोरियल: कोण, चाल और परास',
    headerSubtitle: 'मिशन शुरू करने से पहले समझें कि प्रक्षेपण कोण और चाल मिलकर दूरी कैसे तय करते हैं।',
    openBtn: 'ट्यूटोरियल खोलें',
    replayBtn: 'दोबारा देखें',
    skipBtn: 'सीधे मिशन पर जाएँ',
    completedTag: 'पूर्ण',
    stageLabel: 'चरण',
    prevStep: 'पीछे',
    nextStep: 'अगला चरण',
    startMission: 'मिशन सिमुलेशन शुरू करें',
    angleLabel: 'प्रक्षेपण कोण आज़माएँ (θ)',
    speedLabel: 'प्रारंभिक चाल आज़माएँ (v₀)',
    fixedSpeedNote: 'चाल 20 m/s पर स्थिर · पृथ्वी गुरुत्व (9.81 m/s²)',
    fixedAngleNote: 'कोण 45° पर स्थिर · 10 m/s आधार रेखा से तुलना करें',
    sandboxNote: 'अभ्यास झंडा 35.0 m (±2.5 m) पर · कोण और चाल दोनों मिलाएँ',
    vxLabel: 'आगे की चाल (vₓ = v₀ cos θ)',
    vyLabel: 'ऊपर की चाल (v_y = v₀ sin θ)',
    timeLabel: 'हवा में समय (T)',
    rangeLabel: 'क्षैतिज परास (R)',
    heightLabel: 'अधिकतम ऊँचाई (H)',
    speedBoostLabel: 'चाल गुणक',
    rangeBoostLabel: 'परास गुणक',
    baselineLegend: 'डैश = 45° अधिकतम पथ / 10 m/s आधार रेखा',
    currentLegend: 'नीला = आपका वर्तमान पथ',
    tryComplementary: '30° बनाम 60° देखें',
    reset45: '45° शिखर आज़माएँ',
    preset10: '10 m/s (1×)',
    preset20: '20 m/s (2×)',
    preset25: '25 m/s (2.5×)',
    stage1GoalMet: 'बढ़िया खोज! 45° पर ऊपर व आगे की चाल संतुलित होती है और अधिकतम परास (40.8 m) मिलता है। 30° और 60° दोनों 35.3 m पर गिरते हैं!',
    stage2GoalMet: '4 गुना उछाल देखें! चाल 10 से 20 m/s दोगुनी करने पर आगे की चाल और हवा में समय दोनों दोगुने हो जाते हैं, इसलिए परास 4× (10.2 m → 40.8 m) हो जाता है।',
    stage3GoalMet: 'अभ्यास झंडा छू लिया! अब आप मुख्य प्रक्षेप्य मिशन के लिए तैयार हैं।',
    practiceFlag: 'अभ्यास झंडा: 35 m',
    readAloud: 'सुनें (TTS)',
    stopAudio: 'रोकें',
  },
  kn: {
    headerTitle: 'ಮಾರ್ಗದರ್ಶಿ ಸಂವಾದಾತ್ಮಕ ಟ್ಯುಟೋರಿಯಲ್: ಕೋನ, ವೇಗ ಮತ್ತು ದೂರ',
    headerSubtitle: 'ಮಿಷನ್ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ಕೋನ ಮತ್ತು ವೇಗವು ದೂರವನ್ನು ಹೇಗೆ ನಿರ್ಧರಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ಕಲಿಯಿರಿ.',
    openBtn: 'ಟ್ಯುಟೋರಿಯಲ್ ತೆರೆಯಿರಿ',
    replayBtn: 'ಮತ್ತೆ ನೋಡಿ',
    skipBtn: 'ಮಿಷನ್‌ಗೆ ತೆರಳಿ',
    completedTag: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    stageLabel: 'ಹಂತ',
    prevStep: 'ಹಿಂದೆ',
    nextStep: 'ಮುಂದಿನ ಹಂತ',
    startMission: 'ಮಿಷನ್ ಸಿಮ್ಯುಲೇಶನ್ ಪ್ರಾರಂಭಿಸಿ',
    angleLabel: 'ಉಡಾವಣಾ ಕೋನ ಪರೀಕ್ಷಿಸಿ (θ)',
    speedLabel: 'ಆರಂಭಿಕ ವೇಗ ಪರೀಕ್ಷಿಸಿ (v₀)',
    fixedSpeedNote: 'ವೇಗ 20 m/s ನಲ್ಲಿ ಸ್ಥಿರ · ಭೂಮಿಯ ಗುರುತ್ವ (9.81 m/s²)',
    fixedAngleNote: 'ಕೋನ 45° ನಲ್ಲಿ ಸ್ಥಿರ · 10 m/s ಮೂಲ ರೇಖೆಯೊಂದಿಗೆ ಹೋಲಿಸಿ',
    sandboxNote: 'ಅಭ್ಯಾಸ ಧ್ವಜ 35.0 m (±2.5 m) · ಕೋನ ಮತ್ತು ವೇಗ ಸಂಯೋಜಿಸಿ',
    vxLabel: 'ಮುಂದಿನ ವೇಗ (vₓ = v₀ cos θ)',
    vyLabel: 'ಮೇಲ್ಮುಖ ವೇಗ (v_y = v₀ sin θ)',
    timeLabel: 'ಹಾರಾಟದ ಸಮಯ (T)',
    rangeLabel: 'ಸಮತಲ ದೂರ (R)',
    heightLabel: 'ಗರಿಷ್ಠ ಎತ್ತರ (H)',
    speedBoostLabel: 'ವೇಗ ಗುಣಕ',
    rangeBoostLabel: 'ದೂರ ಗುಣಕ',
    baselineLegend: 'ಚುಕ್ಕೆ = 45° ಗರಿಷ್ಠ / 10 m/s ಮೂಲ ರೇಖೆ',
    currentLegend: 'ನೀಲಿ = ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಪಥ',
    tryComplementary: '30° ಮತ್ತು 60° ಹೋಲಿಸಿ',
    reset45: '45° ಗರಿಷ್ಠ ಪರೀಕ್ಷಿಸಿ',
    preset10: '10 m/s (1×)',
    preset20: '20 m/s (2×)',
    preset25: '25 m/s (2.5×)',
    stage1GoalMet: 'ಉತ್ತಮ ಅನ್ವೇಷಣೆ! 45° ನಲ್ಲಿ ಮೇಲ್ಮುಖ ಮತ್ತು ಮುಂದಿನ ವೇಗ ಸಮತೋಲನಗೊಂಡು ಗರಿಷ್ಠ ದೂರ (40.8 m) ನೀಡುತ್ತದೆ. 30° ಮತ್ತು 60° ಎರಡೂ 35.3 m ತಲುಪುತ್ತವೆ!',
    stage2GoalMet: '4 ಪಟ್ಟು ಜಿಗಿತ ನೋಡಿ! ವೇಗವನ್ನು 10 ರಿಂದ 20 m/s ಗೆ ದ್ವಿಗುಣಗೊಳಿಸಿದಾಗ ಮುಂದಿನ ವೇಗ ಮತ್ತು ಹಾರಾಟದ ಸಮಯ ಎರಡೂ ದ್ವಿಗುಣಗೊಳ್ಳುವುದರಿಂದ ದೂರ 4× (10.2 m → 40.8 m) ಆಗುತ್ತದೆ.',
    stage3GoalMet: 'ಅಭ್ಯಾಸ ಗುರಿ ತಲುಪಿದೆ! ಈಗ ನೀವು ಮುಖ್ಯ ಪ್ರಕ್ಷೇಪಕ ಮಿಷನ್‌ಗೆ ಸಿದ್ಧರಾಗಿದ್ದೀರಿ.',
    practiceFlag: 'ಅಭ್ಯಾಸ ಧ್ವಜ: 35 m',
    readAloud: 'ಕೇಳಿ (TTS)',
    stopAudio: 'ನಿಲ್ಲಿಸಿ',
  },
};

const STAGES: Record<TutorialStage, StageMeta> = {
  1: {
    title: {
      en: '1. Why Launch Angle Splits Motion (Up vs Forward)',
      hi: '1. प्रक्षेपण कोण गति को दो भागों में कैसे बाँटता है',
      kn: '1. ಉಡಾವಣಾ ಕೋನವು ಚಲನೆಯನ್ನು ಹೇಗೆ ವಿಭಜಿಸುತ್ತದೆ',
    },
    takeaway: {
      en: 'Every launch splits into forward speed (vₓ = v₀ cos θ) and upward speed (v_y = v₀ sin θ). Low angles fly fast forward but fall early; steep angles stay up longer but creep forward slowly. 45° balances both for maximum range!',
      hi: 'हर प्रक्षेपण दो भागों में बँटता है: आगे की चाल (vₓ = v₀ cos θ) और ऊपर की चाल (v_y = v₀ sin θ)। कम कोण पर गेंद जल्दी गिरती है; अधिक कोण पर हवा में देर तक रहती है पर आगे कम बढ़ती है। 45° दोनों का संतुलन है!',
      kn: 'ಪ್ರತಿ ಉಡಾವಣೆಯು ಮುಂದಿನ ವೇಗ (vₓ = v₀ cos θ) ಮತ್ತು ಮೇಲ್ಮುಖ ವೇಗ (v_y = v₀ sin θ) ಆಗಿ ವಿಭಜಿಸುತ್ತದೆ. ಕಡಿಮೆ ಕೋನ ಬೇಗ ಬೀಳುತ್ತದೆ; ಹೆಚ್ಚು ಕೋನ ಎತ್ತರ ಹಾರಿದರೂ ಮುಂದೆ ಕಡಿಮೆ ಸಾಗುತ್ತದೆ. 45° ಎರಡನ್ನೂ ಸಮತೋಲನಗೊಳಿಸುತ್ತದೆ!',
    },
    prompt: {
      en: 'Move the angle slider to 45°, or click "Compare 30° vs 60°" to see how symmetric angles land at the exact same range.',
      hi: 'कोण को 45° पर ले जाएँ, या "30° बनाम 60° देखें" दबाकर देखें कि पूरक कोण एक ही दूरी पर कैसे गिरते हैं।',
      kn: 'ಕೋನವನ್ನು 45° ಗೆ ಸರಿಸಿ, ಅಥವಾ "30° ಮತ್ತು 60° ಹೋಲಿಸಿ" ಒತ್ತಿ ಒಂದೇ ದೂರ ಬರುವುದನ್ನು ನೋಡಿ.',
    },
  },
  2: {
    title: {
      en: '2. Why Doubling Speed Quadruples Range (R ∝ v₀²)',
      hi: '2. चाल दोगुनी करने पर परास 4 गुना क्यों होता है (R ∝ v₀²)',
      kn: '2. ವೇಗ ದ್ವಿಗುಣಗೊಂಡರೆ ದೂರ ಏಕೆ 4 ಪಟ್ಟು ಆಗುತ್ತದೆ (R ∝ v₀²)',
    },
    takeaway: {
      en: 'Raising initial speed boosts BOTH how fast the ball moves forward AND how long gravity takes to pull it back down. Twice the speed × twice the air time = 4× horizontal range!',
      hi: 'प्रारंभिक चाल बढ़ाने से आगे जाने की गति और हवा में रहने का समय — दोनों बढ़ जाते हैं। इसलिए 2× चाल × 2× समय = 4× क्षैतिज परास!',
      kn: 'ವೇಗವನ್ನು ಹೆಚ್ಚಿಸಿದರೆ ಮುಂದೆ ಸಾಗುವ ವೇಗ ಮತ್ತು ಗಾಳಿಯಲ್ಲಿ ಇರುವ ಸಮಯ ಎರಡೂ ಹೆಚ್ಚಾಗುತ್ತವೆ. ಆದ್ದರಿಂದ 2× ವೇಗ × 2× ಸಮಯ = 4× ದೂರ!',
    },
    prompt: {
      en: 'Tap "20 m/s (2×)" or slide speed up from 10 m/s to 20 m/s and compare the live curve to the dashed 10 m/s baseline.',
      hi: '"20 m/s (2×)" चुनें या चाल को 10 m/s से बढ़ाकर 20 m/s करें और आधार रेखा से तुलना करें।',
      kn: '"20 m/s (2×)" ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ವೇಗವನ್ನು 10 ರಿಂದ 20 m/s ಗೆ ಏರಿಸಿ ವ್ಯತ್ಯಾಸ ನೋಡಿ.',
    },
  },
  3: {
    title: {
      en: '3. Practice Combining Angle & Speed Before the Mission',
      hi: '3. मिशन से पहले कोण और चाल को मिलाकर अभ्यास करें',
      kn: '3. ಮಿಷನ್‌ಗೆ ಮೊದಲು ಕೋನ ಮತ್ತು ವೇಗವನ್ನು ಸಂಯೋಜಿಸಿ ಅಭ್ಯಾಸ ಮಾಡಿ',
    },
    takeaway: {
      en: 'Now adjust both Angle (θ) and Speed (v₀) together to land your blue curve on the 35 m practice flag — then launch into the full Projectile Mission!',
      hi: 'अब कोण (θ) और चाल (v₀) दोनों को समायोजित करके नीले वक्र को 35 m अभ्यास झंडे तक पहुँचाएँ — फिर मुख्य मिशन शुरू करें!',
      kn: 'ಈಗ ಕೋನ (θ) ಮತ್ತು ವೇಗ (v₀) ಎರಡನ್ನೂ ಹೊಂದಿಸಿ 35 m ಅಭ್ಯಾಸ ಧ್ವಜವನ್ನು ತಲುಪಿ — ನಂತರ ಮುಖ್ಯ ಮಿಷನ್ ಪ್ರಾರಂಭಿಸಿ!',
    },
    prompt: {
      en: 'Land inside 32.5 m – 37.5 m by tuning Angle & Speed (for example: v₀ = 20 m/s at θ = 30° or 60°, or v₀ = 19 m/s at θ = 45°).',
      hi: 'कोण व चाल बदलकर 32.5 m – 37.5 m के भीतर पहुँचें (जैसे v₀ = 20 m/s व θ = 30°/60°, या v₀ = 19 m/s व θ = 45°)।',
      kn: 'ಕೋನ ಮತ್ತು ವೇಗ ಹೊಂದಿಸಿ 32.5 m – 37.5 m ಒಳಗೆ ತಲುಪಿ (ಉದಾ: v₀ = 20 m/s, θ = 30°/60° ಅಥವಾ v₀ = 19 m/s, θ = 45°).',
    },
  },
};

const G_EARTH = 9.81;

function calcTrajectoryPoints(
  angleDeg: number,
  speed: number,
  maxWorldX: number,
  maxWorldY: number,
  svgW: number,
  svgH: number
) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = speed * Math.cos(rad);
  const vy = speed * Math.sin(rad);
  const tFlight = (2 * vy) / G_EARTH;
  const range = (speed * speed * Math.sin(2 * rad)) / G_EARTH;
  const maxHeight = (vy * vy) / (2 * G_EARTH);

  const originX = 36;
  const groundY = svgH - 28;
  const usableW = svgW - 60;
  const usableH = svgH - 46;

  const pts: string[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * tFlight;
    const wx = vx * t;
    const wy = Math.max(0, vy * t - 0.5 * G_EARTH * t * t);
    const sx = originX + (wx / maxWorldX) * usableW;
    const sy = groundY - (wy / maxWorldY) * usableH;
    pts.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
  }

  return {
    pathD: pts.join(' '),
    vx,
    vy,
    tFlight,
    range,
    maxHeight,
    landX: originX + (range / maxWorldX) * usableW,
    apexX: originX + (range / 2 / maxWorldX) * usableW,
    apexY: groundY - (maxHeight / maxWorldY) * usableH,
    originX,
    groundY,
    usableW,
    usableH,
  };
}

export const ProjectileTutorial: React.FC<ProjectileTutorialProps> = ({
  language,
  isCompleted,
  onSpeak,
  isSpeaking,
  onCompleteTutorial,
}) => {
  const txt = TUTORIAL_TEXT[language];
  const [expanded, setExpanded] = useState(!isCompleted);
  const [stage, setStage] = useState<TutorialStage>(1);

  // Interactive tutorial parameters
  const [tutAngle, setTutAngle] = useState(25);
  const [tutSpeed, setTutSpeed] = useState(10);
  const [stage1TestedPair, setStage1TestedPair] = useState(false);
  const [tutorialCaption, setTutorialCaption] = useState<string | null>(null);

  // Effective angle/speed per stage so each concept isolates or combines variables cleanly
  const activeAngle = stage === 2 ? 45 : tutAngle;
  const activeSpeed = stage === 1 ? 20 : tutSpeed;

  const svgW = 480;
  const svgH = 220;
  const maxWorldX = stage === 2 ? 96 : 52;
  const maxWorldY = stage === 2 ? 28 : 24;

  const activeSim = useMemo(
    () => calcTrajectoryPoints(activeAngle, activeSpeed, maxWorldX, maxWorldY, svgW, svgH),
    [activeAngle, activeSpeed, maxWorldX, maxWorldY]
  );

  const baselineSim = useMemo(() => {
    if (stage === 1) {
      return calcTrajectoryPoints(45, 20, maxWorldX, maxWorldY, svgW, svgH);
    }
    if (stage === 2) {
      return calcTrajectoryPoints(45, 10, maxWorldX, maxWorldY, svgW, svgH);
    }
    return null;
  }, [stage, maxWorldX, maxWorldY]);

  const stageGoalMet = useMemo(() => {
    if (stage === 1) return Math.abs(tutAngle - 45) <= 2 || stage1TestedPair;
    if (stage === 2) return tutSpeed >= 20;
    return Math.abs(activeSim.range - 35) <= 2.5;
  }, [stage, tutAngle, stage1TestedPair, tutSpeed, activeSim.range]);

  const stageMeta = STAGES[stage];

  const handleFinishTutorial = () => {
    onCompleteTutorial();
    setExpanded(false);
    const predictEl = document.getElementById('projectile-step-predict');
    predictEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <span className="font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">{txt.headerTitle}</span>
            {isCompleted && (
              <span className="text-[#5B21B6] dark:text-[#C4B5FD] font-semibold">
                {' '}· {txt.completedTag}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setStage(1);
          }}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#6D28D9]/45 bg-[#6D28D9]/10 px-3.5 py-2 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:bg-[#6D28D9]/20 cursor-pointer"
        >
          <span>{isCompleted ? txt.replayBtn : txt.openBtn}</span>
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // Vector arrow coordinates for Stage 1 visual breakdown
  const vectorScale = 2.6;
  const vxEndX = activeSim.originX + activeSim.vx * vectorScale;
  const vyEndY = activeSim.groundY - activeSim.vy * vectorScale;

  // Practice target in Stage 3 (35m +/- 2.5m)
  const flagX = activeSim.originX + (35 / maxWorldX) * activeSim.usableW;
  const flagTolPx = (2.5 / maxWorldX) * activeSim.usableW;

  const speedFactor = activeSpeed / 10;
  const rangeFactor = speedFactor * speedFactor;

  return (
    <div className="a11y-surface animate-panel-reveal rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7DDFB] dark:border-[#3B2C78]">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
            <span>{txt.headerTitle}</span>
          </h3>
          <p className="text-xs text-[#4A3F66] dark:text-[#A496D4] mt-0.5">{txt.headerSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const spoken = `${stageMeta.title[language]}. ${stageMeta.takeaway[language]}`;
              if (isSpeaking) {
                setTutorialCaption(null);
              } else {
                setTutorialCaption(spoken);
              }
              onSpeak(spoken);
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
            <span>{isSpeaking ? txt.stopAudio : txt.readAloud}</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 text-xs font-medium text-[#22163F] dark:text-[#C9BFEA] hover:border-[#6D28D9] cursor-pointer"
          >
            <span>{txt.skipBtn}</span>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {tutorialCaption && (
        <div
          role="region"
          aria-live="polite"
          className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/10 px-3 py-2 text-xs text-[#2E1A6E] dark:text-[#F3EFFF] flex items-start justify-between gap-2"
        >
          <p className="leading-relaxed">{tutorialCaption}</p>
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) onSpeak('');
              setTutorialCaption(null);
            }}
            className="underline font-semibold shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Stage Selector Pills (Functional Interactive Step Tabs) */}
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Tutorial steps">
        {([1, 2, 3] as TutorialStage[]).map((num) => {
          const active = stage === num;
          return (
            <button
              key={num}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setStage(num);
                if (num === 3) {
                  setTutAngle(35);
                  setTutSpeed(18);
                }
              }}
              className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                active
                  ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#C9BFEA] hover:border-[#6D28D9]'
              }`}
            >
              <span className="block truncate">
                {txt.stageLabel} {num}
              </span>
            </button>
          );
        })}
      </div>

      {/* Two-Zone Sandbox Layout (Left Interactive Stage / Right Guided Controls & Annotations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Zone: Live Interactive SVG Trajectory & Vector Stage */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          <div className="rounded-xl border border-[#2E1A6E]/40 dark:border-[#3B2C78] bg-[#0D1B2A] p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C9BFEA]">
              <span className="font-medium text-[#C4B5FD]">{txt.currentLegend}</span>
              {baselineSim && <span>· {txt.baselineLegend}</span>}
              {stage === 3 && (
                <span className="font-medium text-emerald-400">· {txt.practiceFlag}</span>
              )}
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              role="img"
              aria-label={`Interactive projectile tutorial diagram: angle ${activeAngle} degrees, speed ${activeSpeed} meters per second, range ${activeSim.range.toFixed(1)} meters`}
              className="w-full h-52 sm:h-56"
            >
              {/* Subtle coordinate grid */}
              {[1, 2, 3, 4].map((row) => (
                <line
                  key={`gy-${row}`}
                  x1="20"
                  x2={svgW - 16}
                  y1={row * 44}
                  y2={row * 44}
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="1"
                />
              ))}

              {/* Ground axis */}
              <line
                x1="20"
                y1={activeSim.groundY}
                x2={svgW - 16}
                y2={activeSim.groundY}
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Meter tick marks */}
              {(stage === 2 ? [0, 20, 40, 60, 80] : [0, 10, 20, 30, 40, 50]).map((m) => {
                const tx = activeSim.originX + (m / maxWorldX) * activeSim.usableW;
                if (tx > svgW - 18) return null;
                return (
                  <g key={m}>
                    <line
                      x1={tx}
                      y1={activeSim.groundY}
                      x2={tx}
                      y2={activeSim.groundY + 5}
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                    <text
                      x={tx}
                      y={activeSim.groundY + 17}
                      fill="#94A3B8"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      {m}m
                    </text>
                  </g>
                );
              })}

              {/* Stage 3 practice flag */}
              {stage === 3 && (
                <g>
                  <rect
                    x={flagX - flagTolPx}
                    y={activeSim.groundY - 5}
                    width={flagTolPx * 2}
                    height="10"
                    fill="rgba(16, 185, 129, 0.28)"
                  />
                  <line
                    x1={flagX}
                    y1={activeSim.groundY - 30}
                    x2={flagX}
                    y2={activeSim.groundY + 2}
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  <polygon
                    points={`${flagX},${activeSim.groundY - 30} ${flagX + 14},${activeSim.groundY - 23} ${flagX},${activeSim.groundY - 16}`}
                    fill="#10B981"
                  />
                </g>
              )}

              {/* Baseline comparison curve (45° in Stage 1, 10 m/s in Stage 2) */}
              {baselineSim && (
                <g>
                  <path
                    d={baselineSim.pathD}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.55)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                  <circle cx={baselineSim.landX} cy={activeSim.groundY} r="4" fill="#94A3B8" />
                  <text
                    x={baselineSim.landX}
                    y={activeSim.groundY - 10}
                    fill="#CBD5E1"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {baselineSim.range.toFixed(1)}m
                  </text>
                </g>
              )}

              {/* Current active parabola */}
              <path d={activeSim.pathD} fill="none" stroke="#38BDF8" strokeWidth="3" />

              {/* Velocity vector decomposition arrows at launch origin */}
              <line
                x1={activeSim.originX}
                y1={activeSim.groundY}
                x2={vxEndX}
                y2={activeSim.groundY}
                stroke="#38BDF8"
                strokeWidth="3"
              />
              <line
                x1={activeSim.originX}
                y1={activeSim.groundY}
                x2={activeSim.originX}
                y2={vyEndY}
                stroke="#F59E0B"
                strokeWidth="3"
              />
              <line
                x1={activeSim.originX}
                y1={activeSim.groundY}
                x2={vxEndX}
                y2={vyEndY}
                stroke="#F8FAFC"
                strokeWidth="2"
              />
              <text
                x={vxEndX + 4}
                y={activeSim.groundY - 6}
                fill="#7DD3FC"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
              >
                vₓ={activeSim.vx.toFixed(1)}
              </text>
              <text
                x={activeSim.originX + 6}
                y={Math.max(14, vyEndY - 4)}
                fill="#FCD34D"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
              >
                v_y={activeSim.vy.toFixed(1)}
              </text>

              {/* Landing marker */}
              <circle
                cx={activeSim.landX}
                cy={activeSim.groundY}
                r="6"
                fill={stage === 3 && stageGoalMet ? '#10B981' : '#F59E0B'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={Math.min(svgW - 26, activeSim.landX)}
                y={activeSim.apexY > 28 ? activeSim.groundY - 12 : 18}
                fill="#38BDF8"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="IBM Plex Mono, monospace"
              >
                R = {activeSim.range.toFixed(1)}m
              </text>
            </svg>
          </div>

          {/* Tabular Live Physics Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
            <div>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{txt.vxLabel}</p>
              <p className="text-sm font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
                {activeSim.vx.toFixed(1)} m/s
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{txt.vyLabel}</p>
              <p className="text-sm font-mono font-semibold text-[#F07C00] dark:text-[#FF9F1C] tabular-nums">
                {activeSim.vy.toFixed(1)} m/s
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{txt.timeLabel}</p>
              <p className="text-sm font-mono font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] tabular-nums">
                {activeSim.tFlight.toFixed(2)} s
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">{txt.rangeLabel}</p>
              <p className="text-sm font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
                {activeSim.range.toFixed(1)} m
              </p>
            </div>
          </div>
        </div>

        {/* Right Zone: Guided Concept & Interactive Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
              {stageMeta.title[language]}
            </h4>
            <p className="text-xs leading-relaxed text-[#22163F] dark:text-[#C9BFEA]">
              {stageMeta.takeaway[language]}
            </p>
            <p className="text-[11px] text-[#4A3F66] dark:text-[#A496D4]">
              {stage === 1
                ? txt.fixedSpeedNote
                : stage === 2
                ? txt.fixedAngleNote
                : txt.sandboxNote}
            </p>

            {/* Stage 1 & Stage 3 Angle Control */}
            {(stage === 1 || stage === 3) && (
              <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#2E1A6E] dark:text-[#F3EFFF]">{txt.angleLabel}</span>
                  <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
                    {tutAngle}°
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease tutorial angle"
                    onClick={() => setTutAngle((a) => Math.max(15, a - 5))}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <input
                    type="range"
                    min={15}
                    max={75}
                    step={1}
                    value={tutAngle}
                    aria-label={txt.angleLabel}
                    onChange={(e) => setTutAngle(Number(e.target.value))}
                    className="flex-1 h-2 accent-[#6D28D9] cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Increase tutorial angle"
                    onClick={() => setTutAngle((a) => Math.min(75, a + 5))}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {stage === 1 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTutAngle((prev) => (prev === 30 ? 60 : 30));
                        setStage1TestedPair(true);
                      }}
                      className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                    >
                      {txt.tryComplementary} ({tutAngle === 30 ? '60°' : '30°'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTutAngle(45)}
                      className="min-h-[44px] rounded-xl border border-[#6D28D9]/45 bg-[#6D28D9]/10 px-3 py-1.5 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer"
                    >
                      {txt.reset45}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stage 2 & Stage 3 Speed Control */}
            {(stage === 2 || stage === 3) && (
              <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#2E1A6E] dark:text-[#F3EFFF]">{txt.speedLabel}</span>
                  <span className="font-mono font-semibold text-[#F07C00] dark:text-[#FF9F1C] tabular-nums">
                    {tutSpeed} m/s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease tutorial speed"
                    onClick={() => setTutSpeed((v) => Math.max(10, v - 2))}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <input
                    type="range"
                    min={10}
                    max={30}
                    step={1}
                    value={tutSpeed}
                    aria-label={txt.speedLabel}
                    onChange={(e) => setTutSpeed(Number(e.target.value))}
                    className="flex-1 h-2 accent-[#FF9F1C] cursor-pointer"
                  />
                  <button
                    type="button"
                    aria-label="Increase tutorial speed"
                    onClick={() => setTutSpeed((v) => Math.min(30, v + 2))}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {stage === 2 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { val: 10, label: txt.preset10 },
                        { val: 20, label: txt.preset20 },
                        { val: 25, label: txt.preset25 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setTutSpeed(p.val)}
                          className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                            tutSpeed === p.val
                              ? 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/20 text-[#2E1A6E] dark:text-[#FFD9A8]'
                              : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#22163F] dark:text-[#C9BFEA]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#22163F] dark:text-[#C9BFEA] pt-1 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
                      <span>
                        {txt.speedBoostLabel}: {speedFactor.toFixed(1)}×
                      </span>
                      <span className="text-[#5B21B6] dark:text-[#C4B5FD] font-semibold">
                        {txt.rangeBoostLabel}: {rangeFactor.toFixed(2)}×
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guided Prompt / Discovery Confirmation */}
            <div
              className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
                stageGoalMet
                  ? 'border-[#6D28D9]/45 bg-[#6D28D9]/10 text-[#2E1A6E] dark:text-[#9BECE4]'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#22163F] dark:text-[#C9BFEA]'
              }`}
            >
              {stageGoalMet && (
                <CheckCircle2 className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD] shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <span className="leading-relaxed">
                {stageGoalMet
                  ? stage === 1
                    ? txt.stage1GoalMet
                    : stage === 2
                    ? txt.stage2GoalMet
                    : txt.stage3GoalMet
                  : stageMeta.prompt[language]}
              </span>
            </div>
          </div>

          {/* Step Navigation Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
            <div className="flex items-center gap-2">
              {stage > 1 && (
                <button
                  type="button"
                  onClick={() => setStage((s) => (s === 3 ? 2 : 1))}
                  className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                >
                  {txt.prevStep}
                </button>
              )}
              <button
                type="button"
                aria-label="Reset tutorial values"
                onClick={() => {
                  setTutAngle(25);
                  setTutSpeed(10);
                  setStage1TestedPair(false);
                }}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 text-[#2E1A6E] dark:text-[#C9BFEA] hover:border-[#6D28D9] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {stage < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (stage === 1) {
                    setStage(2);
                    setTutSpeed(10);
                  } else {
                    setStage(3);
                    setTutAngle(35);
                    setTutSpeed(18);
                  }
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] cursor-pointer"
              >
                <span>{txt.nextStep}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishTutorial}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5B21B6] cursor-pointer"
              >
                <span>{txt.startMission}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
