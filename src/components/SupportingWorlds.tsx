import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Leaf,
  Sigma,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { SUPPORTING_WORLDS } from '../data/curriculum';
import { UI_TEXT } from '../data/i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSpeech } from '../hooks/useSpeech';
import type { Language, SupportingWorldId } from '../types/stem';

interface SupportingWorldsProps {
  language: Language;
  activeWorld: SupportingWorldId;
  onSelectWorld: (world: SupportingWorldId) => void;
  completedModules: string[];
  quizScores: Record<string, number>;
  onCompleteModule: (moduleId: string) => void;
  onSaveQuizScore: (worldId: SupportingWorldId, scorePct: number) => void;
  onOpenMentorWithPrompt: (subject: string, prompt: string) => void;
  onReturnToPhysics: () => void;
}

const WORLD_ICONS: Record<SupportingWorldId, React.ReactNode> = {
  chemistry: <FlaskConical className="w-4 h-4 text-amber-500" aria-hidden="true" />,
  biology: <Leaf className="w-4 h-4 text-emerald-500" aria-hidden="true" />,
  mathematics: <Sigma className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
};

export const SupportingWorlds: React.FC<SupportingWorldsProps> = ({
  language,
  activeWorld,
  onSelectWorld,
  completedModules,
  quizScores,
  onCompleteModule,
  onSaveQuizScore,
  onOpenMentorWithPrompt,
  onReturnToPhysics,
}) => {
  const t = UI_TEXT[language];
  const isOnline = useOnlineStatus();
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);
  const [captionText, setCaptionText] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Chemistry titration interactive state
  const [acidVol, setAcidVol] = useState(25); // 0.1 M HCl mL
  const [baseVol, setBaseVol] = useState(20); // 0.1 M NaOH mL

  // Biology vascular interactive state
  const [sunlight, setSunlight] = useState(75);
  const [soilMoisture, setSoilMoisture] = useState(65);
  const [stomataOpen, setStomataOpen] = useState(true);

  // Mathematics unit circle + quadratic state
  const [trigAngle, setTrigAngle] = useState(45);
  const [quadA, setQuadA] = useState(1);
  const [quadB, setQuadB] = useState(-2);
  const [quadC, setQuadC] = useState(-3);

  // Quiz state per world
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedWorlds, setSubmittedWorlds] = useState<Record<string, boolean>>({});

  const worldMeta = useMemo(
    () => SUPPORTING_WORLDS.find((w) => w.id === activeWorld) ?? SUPPORTING_WORLDS[0],
    [activeWorld]
  );

  // Chemistry pH calculation
  const chemResult = useMemo(() => {
    const totalVol = Math.max(acidVol + baseVol, 1);
    const netMoles = (acidVol - baseVol) * 0.0001; // 0.1 M -> 0.0001 mol/mL
    let pH = 7.0;
    if (Math.abs(netMoles) < 1e-6) {
      pH = 7.0;
    } else if (netMoles > 0) {
      const hConc = (netMoles / totalVol) * 1000;
      pH = Math.max(0.5, -Math.log10(hConc));
    } else {
      const ohConc = (-netMoles / totalVol) * 1000;
      pH = Math.min(13.5, 14 + Math.log10(ohConc));
    }
    const status =
      pH < 6.5 ? 'Acidic' : pH > 7.5 ? 'Basic / Alkaline' : 'Neutral Equivalence';
    return { pH, status };
  }, [acidVol, baseVol]);

  // Biology vascular transport calculation
  const bioResult = useMemo(() => {
    const stomatalFactor = stomataOpen ? 1.0 : 0.15;
    const xylemFlow = (soilMoisture * 0.65 + sunlight * 0.35) * stomatalFactor;
    const phloemSugar = (sunlight * 0.75 + soilMoisture * 0.25) * (stomataOpen ? 1.0 : 0.3);
    const turgor = soilMoisture > 40 ? 'Turgid (Nominal)' : 'Wilting Risk (Low Water)';
    return { xylemFlow, phloemSugar, turgor };
  }, [sunlight, soilMoisture, stomataOpen]);

  // Mathematics trig & quadratic calculation
  const mathResult = useMemo(() => {
    const rad = (trigAngle * Math.PI) / 180;
    const sinV = Math.sin(rad);
    const cosV = Math.cos(rad);
    const discriminant = quadB * quadB - 4 * quadA * quadC;
    return { sinV, cosV, discriminant };
  }, [trigAngle, quadA, quadB, quadC]);

  const handleSubmitQuiz = () => {
    let correct = 0;
    worldMeta.quiz.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    const pct = Math.round((correct / worldMeta.quiz.length) * 100);
    setSubmittedWorlds((prev) => ({ ...prev, [worldMeta.id]: true }));
    onSaveQuizScore(worldMeta.id, pct);
  };

  return (
    <section aria-labelledby="supporting-worlds-heading" className="mx-auto max-w-7xl px-4 sm:px-6 py-10 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
            Supporting STEM Subjects · Alongside Primary Physics
          </p>
          <h2
            id="supporting-worlds-heading"
            className="text-2xl sm:text-3xl font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-1 text-balance"
          >
            {t.supportingDomainsTitle}
          </h2>
          <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] mt-1 max-w-2xl">
            {t.supportingDomainsDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToPhysics}
          className="min-h-[44px] self-start inline-flex items-center gap-2 rounded-xl border border-[#6D28D9]/45 bg-[#6D28D9]/10 px-4 py-2 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:bg-[#6D28D9]/20 cursor-pointer shrink-0 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.backToPhysics}</span>
        </button>
      </div>

      {/* 3 World Selector Cards with Generated Artwork */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {SUPPORTING_WORLDS.map((world) => {
          const isSelected = world.id === activeWorld;
          const score = quizScores[world.id];
          return (
            <button
              key={world.id}
              type="button"
              onClick={() => onSelectWorld(world.id)}
              className={`a11y-surface group text-left rounded-2xl border overflow-hidden transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#6D28D9] bg-[#6D28D9]/5 dark:bg-[#2A1D5C] shadow-sm'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] hover:border-[#6D28D9]'
              }`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-[#120A28]">
                {!imgErrors[world.id] ? (
                  <img
                    src={world.imagePath}
                    alt={`${world.title.en} scientific illustration`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgErrors((prev) => ({ ...prev, [world.id]: true }))}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1F1545] to-[#120A28] p-4">
                    {WORLD_ICONS[world.id]}
                    <span className="text-xs font-medium text-[#E4DDFA] mt-2">
                      {world.title[language]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120A28]/90 via-[#120A28]/25 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-[#F5F0FF]">
                  <span className="font-medium flex items-center gap-1.5">
                    {WORLD_ICONS[world.id]}
                    <span>{world.lessons.length} Lessons · {world.quiz.length} Quiz Qs</span>
                  </span>
                  {typeof score === 'number' && (
                    <span className="font-mono text-emerald-300 tabular-nums">Best {score}%</span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                  {world.title[language]}
                </h3>
                <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] mt-1 line-clamp-2">
                  {world.subtitle[language]}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Supporting World Interactive Sandbox + Lessons + Quiz */}
      <div key={activeWorld} className="animate-panel-reveal grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Activity Sandbox (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E7DDFB] dark:border-[#3B2C78]">
              <div>
                <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
                  Interactive Activity · {worldMeta.title[language]}
                </p>
                <h3 className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5">
                  {activeWorld === 'chemistry' && 'Acid–Base pH Titration Sandbox'}
                  {activeWorld === 'biology' && 'Xylem & Phloem Vascular Transport Simulator'}
                  {activeWorld === 'mathematics' && 'Unit Circle & Quadratic Curve Explorer'}
                </h3>
              </div>
              <button
                type="button"
                disabled={!isOnline}
                onClick={() =>
                  onOpenMentorWithPrompt(
                    worldMeta.title.en,
                    `Give me an intuitive overview of ${worldMeta.title.en}: ${worldMeta.subtitle.en}.`
                  )
                }
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#E4DDFA] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C] cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
                <span>{isOnline ? t.askMentor : t.requiresInternetNotice}</span>
              </button>
            </div>

            {/* CHEMISTRY SANDBOX */}
            {activeWorld === 'chemistry' && (
              <div className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">0.1 M HCl (Acid)</span>
                      <span className="font-mono font-semibold text-[#B4430C] dark:text-[#FF9F1C] tabular-nums">{acidVol} mL</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={acidVol}
                      onChange={(e) => setAcidVol(Number(e.target.value))}
                      className="w-full accent-[#FF9F1C] cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">0.1 M NaOH (Base)</span>
                      <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">{baseVol} mL</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={baseVol}
                      onChange={(e) => setBaseVol(Number(e.target.value))}
                      className="w-full accent-[#6D28D9] cursor-pointer"
                    />
                  </label>
                </div>

                {/* pH Scale Bar */}
                <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">
                      Solution State: {chemResult.status}
                    </span>
                    <span className="font-mono text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] tabular-nums">
                      pH {chemResult.pH.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-gradient-to-r from-red-500 via-emerald-500 to-sky-600">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-5 rounded border-2 border-white bg-[#2E1A6E] shadow"
                      style={{ left: `calc(${(chemResult.pH / 14) * 100}% - 7px)` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#4A3F66] dark:text-[#C9BFEA] mt-1.5">
                    <span>0 (Strong Acid)</span>
                    <span>7.0 (Neutral)</span>
                    <span>14 (Strong Base)</span>
                  </div>
                </div>
              </div>
            )}

            {/* BIOLOGY SANDBOX */}
            {activeWorld === 'biology' && (
              <div className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">Sunlight Intensity</span>
                      <span className="font-mono font-semibold text-[#B4430C] dark:text-[#FF9F1C] tabular-nums">{sunlight}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={sunlight}
                      onChange={(e) => setSunlight(Number(e.target.value))}
                      className="w-full accent-[#FF9F1C] cursor-pointer"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">Soil Moisture</span>
                      <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">{soilMoisture}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={soilMoisture}
                      onChange={(e) => setSoilMoisture(Number(e.target.value))}
                      className="w-full accent-[#6D28D9] cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#22163F] dark:text-[#E4DDFA]">
                      Guard Cell Status: {bioResult.turgor}
                    </p>
                    <p className="text-xs font-mono text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
                      Xylem Water Flow: {bioResult.xylemFlow.toFixed(0)} units · Phloem Sugar: {bioResult.phloemSugar.toFixed(0)} units
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStomataOpen((s) => !s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      stomataOpen
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    Stomata: {stomataOpen ? 'Open' : 'Closed'}
                  </button>
                </div>
              </div>
            )}

            {/* MATHEMATICS SANDBOX */}
            {activeWorld === 'mathematics' && (
              <div className="pt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-3">
                    <label className="block space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#22163F] dark:text-[#E4DDFA]">Unit Circle Angle (θ)</span>
                        <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">{trigAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={trigAngle}
                        onChange={(e) => setTrigAngle(Number(e.target.value))}
                        className="w-full accent-[#6D28D9] cursor-pointer"
                      />
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]">
                      <div>
                        <span className="text-[#4A3F66] dark:text-[#C9BFEA] block">cos θ</span>
                        <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{mathResult.cosV.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-[#4A3F66] dark:text-[#C9BFEA] block">sin θ</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{mathResult.sinV.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-[#4A3F66] dark:text-[#C9BFEA] block">Δ = b²-4ac</span>
                        <span className="font-semibold text-[#B4430C] dark:text-[#FF9F1C]">{mathResult.discriminant}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Unit Circle Visualizer */}
                  <div className="flex justify-center">
                    <svg viewBox="-120 -120 240 240" className="w-44 h-44 rounded-xl bg-[#120A28] border border-[#3B2C78]">
                      <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeWidth="1" />
                      <line x1="0" y1="-110" x2="0" y2="110" stroke="#334155" strokeWidth="1" />
                      <circle cx="0" cy="0" r="85" fill="none" stroke="#6D28D9" strokeWidth="1.5" />
                      <line
                        x1="0"
                        y1="0"
                        x2={mathResult.cosV * 85}
                        y2={-mathResult.sinV * 85}
                        stroke="#FF9F1C"
                        strokeWidth="2.5"
                      />
                      <line
                        x1={mathResult.cosV * 85}
                        y1="0"
                        x2={mathResult.cosV * 85}
                        y2={-mathResult.sinV * 85}
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <circle cx={mathResult.cosV * 85} cy={-mathResult.sinV * 85} r="5" fill="#C4B5FD" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="text-xs space-y-1">
                    <span className="text-[#4A3F66] dark:text-[#C9BFEA]">a = {quadA}</span>
                    <input type="range" min={-3} max={3} step={1} value={quadA} onChange={(e) => setQuadA(Number(e.target.value) || 1)} className="w-full accent-[#6D28D9]" />
                  </label>
                  <label className="text-xs space-y-1">
                    <span className="text-[#4A3F66] dark:text-[#C9BFEA]">b = {quadB}</span>
                    <input type="range" min={-6} max={6} step={1} value={quadB} onChange={(e) => setQuadB(Number(e.target.value))} className="w-full accent-[#6D28D9]" />
                  </label>
                  <label className="text-xs space-y-1">
                    <span className="text-[#4A3F66] dark:text-[#C9BFEA]">c = {quadC}</span>
                    <input type="range" min={-6} max={6} step={1} value={quadC} onChange={(e) => setQuadC(Number(e.target.value))} className="w-full accent-[#6D28D9]" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Curated Educational Lessons */}
          <div className="space-y-3">
            {worldMeta.lessons.map((lesson) => {
              const done = completedModules.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
                      <h4 className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                        {lesson.title[language]}
                      </h4>
                    </div>
                    <span className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
                      {lesson.durationMin} min
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">
                    {lesson.summary[language]}
                  </p>
                  <p className="text-xs font-mono text-[#5B21B6] dark:text-[#C4B5FD] bg-[#F5F0FF] dark:bg-[#2A1D5C] rounded-lg px-3 py-2">
                    {lesson.formulaOrFact}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                          setCaptionText(null);
                        } else {
                          const spoken = `${lesson.title[language]}. ${lesson.summary[language]}`;
                          setCaptionText(spoken);
                          speak(spoken);
                        }
                      }}
                      className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-medium text-[#22163F] dark:text-[#E4DDFA] hover:text-[#6D28D9] cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onCompleteModule(lesson.id)}
                      disabled={done}
                      className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                        done
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#6D28D9] text-white hover:bg-[#5B21B6]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{done ? 'Completed' : 'Mark Read'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {captionText && (
              <div className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/10 p-3 text-xs text-[#2E1A6E] dark:text-[#F5F0FF]">
                <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{t.captionPrefix}: </span>
                <span>{captionText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Deck (5 cols) */}
        <div className="lg:col-span-5 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
              {worldMeta.title[language]} Quick Quiz
            </h3>
            {typeof quizScores[worldMeta.id] === 'number' && (
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                Score: {quizScores[worldMeta.id]}%
              </span>
            )}
          </div>

          <div className="space-y-4">
            {worldMeta.quiz.map((q, qIdx) => {
              const selected = answers[q.id];
              const isSubmitted = !!submittedWorlds[worldMeta.id];
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 space-y-2.5"
                >
                  <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                    {qIdx + 1}. {q.question[language]}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const chosen = selected === oIdx;
                      const isCorrect = oIdx === q.correctIndex;
                      let btnStyle =
                        'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#22163F] dark:text-[#E4DDFA]';
                      if (isSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
                        } else if (chosen) {
                          btnStyle = 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300';
                        }
                      } else if (chosen) {
                        btnStyle = 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#5B21B6] dark:text-[#C4B5FD]';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                          }
                          className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer ${btnStyle}`}
                        >
                          {opt[language]}
                        </button>
                      );
                    })}
                  </div>
                  {isSubmitted && (
                    <p className="text-[11px] text-[#22163F] dark:text-[#C9BFEA] flex items-start gap-1.5 pt-1">
                      {selected === q.correctIndex ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F1C] shrink-0 mt-0.5" />
                      )}
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
            className="min-h-[44px] w-full rounded-lg bg-[#6D28D9] py-2.5 text-xs font-semibold text-white hover:bg-[#5B21B6] transition-colors cursor-pointer"
          >
            {t.submitQuizLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
