import { apiUrl } from '../lib/apiBase';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Box,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Flame,
  Magnet,
  Mic,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Sun,
  Volume2,
  VolumeX,
  Waves,
  Zap,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from 'lucide-react';
import { PHYSICS_MODULES } from '../data/curriculum';
import { UI_TEXT } from '../data/i18n';
import {
  computeExperiment,
  DEFAULT_EXPERIMENT_PARAMS,
  EXPERIMENT_DEFINITIONS,
  type ExperimentId,
  type ExperimentParamValues,
} from '../data/physicsExperiments';
import { useAudioTranscriber } from '../hooks/useAudioTranscriber';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSpeech } from '../hooks/useSpeech';
import type { Language, PhysicsTopicId, SyncStatus } from '../types/stem';
import { Magnetism3DScene } from './Magnetism3DScene';
import { PhysicsExperiment3DScene } from './PhysicsExperiment3DScene';
import { ExperimentStation, stationShortName } from './ExperimentStation';
import { Sim3DGuide } from './Sim3DGuide';
import { STATION_ORDER, type StationId } from '../sims/stations';
import { useStageFullscreen } from '../hooks/useStageFullscreen';
import { ProjectileMissionLab } from './ProjectileMissionLab';

interface PhysicsLabSuiteProps {
  language: Language;
  activeTopic: PhysicsTopicId;
  onSelectTopic: (topic: PhysicsTopicId) => void;
  selectedExperiment: ExperimentId;
  onSelectExperiment: (experiment: ExperimentId) => void;
  activeLabTab: 'simulations' | 'practicals' | 'solver';
  onSelectLabTab: (tab: 'simulations' | 'practicals' | 'solver') => void;
  lowPowerMode: boolean;
  completedModules: string[];
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  projectileFocusSection?: 'mission' | 'download' | null;
  onAttemptRecorded: (hit: boolean) => void;
  onSaveProjectileQuiz: (scorePct: number) => void;
  onOfflinePacksChanged: () => void;
  onCompleteModule: (moduleId: string) => void;
  onLogReading: () => void;
  onOpenMentorWithPrompt: (subject: string, prompt: string) => void;
  onContextChange?: (context: string) => void;
  /** one of the five full experiment stations, or null for the 3D lab */
  station?: StationId | null;
  onSelectStation?: (id: StationId | null) => void;
}

interface PracticalReading {
  id: number;
  topic: string;
  parameter: string;
  measured: string;
  calculated: string;
}

interface SolverResult {
  given: string[];
  formula: string;
  steps: string[];
  finalAnswer: string;
  unit: string;
  verificationTip: string;
  calculation?: string;
  calculatorChecked?: boolean;
  modelAnswer?: string;
  model?: string;
}

type SideWindowTab = '3d' | 'calculation' | 'readings';

const EXPERIMENT_ICONS: Record<ExperimentId, React.ReactNode> = {
  'double-slit': <Waves className="w-4 h-4" aria-hidden="true" />,
  photoelectric: <Sun className="w-4 h-4" aria-hidden="true" />,
  'bohr-atom': <Atom className="w-4 h-4" aria-hidden="true" />,
  'quantum-tunneling': <ShieldAlert className="w-4 h-4" aria-hidden="true" />,
  'de-broglie': <Eye className="w-4 h-4" aria-hidden="true" />,
  mechanics: <Box className="w-4 h-4" aria-hidden="true" />,
  electricity: <Zap className="w-4 h-4" aria-hidden="true" />,
  magnetism: <Magnet className="w-4 h-4" aria-hidden="true" />,
  optics: <Sparkles className="w-4 h-4" aria-hidden="true" />,
  waves: <Waves className="w-4 h-4" aria-hidden="true" />,
  thermodynamics: <Flame className="w-4 h-4" aria-hidden="true" />,
};

const BASIC_TOPICS: PhysicsTopicId[] = [
  'mechanics',
  'electricity',
  'magnetism',
  'optics',
  'waves',
  'thermodynamics',
];

function isBasicTopic(id: ExperimentId): id is PhysicsTopicId {
  return (BASIC_TOPICS as string[]).includes(id);
}

export const PhysicsLabSuite: React.FC<PhysicsLabSuiteProps> = ({
  language,
  activeTopic,
  onSelectTopic,
  selectedExperiment,
  onSelectExperiment,
  activeLabTab,
  onSelectLabTab,
  lowPowerMode,
  completedModules,
  syncStatus,
  pendingSyncCount,
  projectileFocusSection,
  onAttemptRecorded,
  onSaveProjectileQuiz,
  onOfflinePacksChanged,
  onCompleteModule,
  onLogReading,
  onOpenMentorWithPrompt,
  onContextChange,
  station = null,
  onSelectStation,
}) => {
  const stage = useStageFullscreen<HTMLDivElement>();
  const [controlsOpen, setControlsOpen] = useState(true);
  const t = UI_TEXT[language];
  const isOnline = useOnlineStatus();
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);
  const [captionText, setCaptionText] = useState<string | null>(null);
  const {
    isRecording,
    isTranscribing,
    transcribeError,
    startRecording,
    stopRecording,
  } = useAudioTranscriber(language);

  const labTab = activeLabTab;
  const setLabTab = onSelectLabTab;
  const [sideTab, setSideTab] = useState<SideWindowTab>('3d');
  const [showProjectileMissionDrawer, setShowProjectileMissionDrawer] = useState(
    projectileFocusSection === 'download'
  );
  const [simRunning, setSimRunning] = useState(!lowPowerMode);
  const [simSpeed, setSimSpeed] = useState(1);
  const [sceneResetKey, setSceneResetKey] = useState(0);
  const [params, setParams] = useState<ExperimentParamValues>(DEFAULT_EXPERIMENT_PARAMS);

  useEffect(() => {
    if (projectileFocusSection === 'download' && selectedExperiment === 'mechanics') {
      setShowProjectileMissionDrawer(true);
    } else if (selectedExperiment !== 'mechanics') {
      setShowProjectileMissionDrawer(false);
    }
  }, [selectedExperiment, projectileFocusSection]);

  // Share the current experiment + live values with the AI tutor
  useEffect(() => {
    if (!onContextChange) return;
    try {
      const def = EXPERIMENT_DEFINITIONS.find((d) => d.id === selectedExperiment);
      const comp = computeExperiment(selectedExperiment, params);
      const live = comp.metrics.map((m) => `${m.label}: ${m.value}${m.unit ? ' ' + m.unit : ''}`).join('; ');
      onContextChange(
        `Experiment: ${def?.title.en ?? selectedExperiment}. Formulas: ${def?.formula ?? ''}. Student's current settings: ${comp.readingParameterSummary}. Live measurements: ${live}.`
      );
    } catch {
      onContextChange('');
    }
  }, [selectedExperiment, params, onContextChange]);

  // Live Magnetism EMF state
  const [liveEmf, setLiveEmf] = useState(0);
  const [liveFlux, setLiveFlux] = useState(0);

  // Waves Web Audio Tone Synthesizer
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (selectedExperiment !== 'waves' || !soundEnabled) {
      osc1Ref.current?.stop();
      osc2Ref.current?.stop();
      osc1Ref.current = null;
      osc2Ref.current = null;
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const gain = ctx.createGain();
      gain.gain.value = 0.04 * params.waveAmp;
      gain.connect(ctx.destination);

      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.value = params.waveF1;
      o1.connect(gain);
      o1.start();

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = params.waveF2;
      o2.connect(gain);
      o2.start();

      osc1Ref.current = o1;
      osc2Ref.current = o2;

      return () => {
        try {
          o1.stop();
          o2.stop();
          gain.disconnect();
        } catch {
          // ignore cleanup stop errors
        }
      };
    } catch {
      setSoundEnabled(false);
    }
  }, [selectedExperiment, soundEnabled, params.waveF1, params.waveF2, params.waveAmp]);

  const updateParam = <K extends keyof ExperimentParamValues>(key: K, value: ExperimentParamValues[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Current Experiment Metadata + Live Calculation
  const experimentMeta = useMemo(
    () =>
      EXPERIMENT_DEFINITIONS.find((e) => e.id === selectedExperiment) ?? EXPERIMENT_DEFINITIONS[0],
    [selectedExperiment]
  );

  const computed = useMemo(
    () => computeExperiment(selectedExperiment, params, { emf: liveEmf, flux: liveFlux }),
    [selectedExperiment, params, liveEmf, liveFlux]
  );

  // Practical readings log
  const [readings, setReadings] = useState<PracticalReading[]>([]);

  const handleLogCurrentReading = () => {
    setReadings((prev) => [
      {
        id: Date.now(),
        topic: experimentMeta.title[language],
        parameter: computed.readingParameterSummary,
        measured: computed.readingMeasuredSummary,
        calculated: computed.readingCalculatedSummary,
      },
      ...prev.slice(0, 14),
    ]);
    onLogReading();
  };

  const handleExportReadingsCsv = () => {
    if (readings.length === 0) return;
    const header = 'Experiment,Parameters,Measured,Calculated';
    const rows = readings.map(
      (r) =>
        `"${r.topic.replace(/"/g, '""')}","${r.parameter.replace(/"/g, '""')}","${r.measured.replace(/"/g, '""')}","${r.calculated.replace(/"/g, '""')}"`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stem-saathi-physics-readings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Numerical Solver state (keeps full compatibility with curriculum modules)
  const currentModule = useMemo(
    () => PHYSICS_MODULES.find((m) => m.id === activeTopic) ?? PHYSICS_MODULES[0],
    [activeTopic]
  );
  const [solverInput, setSolverInput] = useState(currentModule.sampleNumerical);
  const [solverLoading, setSolverLoading] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);

  useEffect(() => {
    setSolverInput(currentModule.sampleNumerical);
    setSolverResult(null);
    setSolverError(null);
  }, [currentModule]);

  const handleSolveNumerical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solverInput.trim()) return;
    setSolverLoading(true);
    setSolverError(null);
    try {
      const res = await fetch(apiUrl('/api/physics/solve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: experimentMeta.title.en,
          problem: solverInput.trim(),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to solve physics numerical.');
      }
      setSolverResult(data as SolverResult);
    } catch (err) {
      setSolverError(err instanceof Error ? err.message : 'Unable to reach solver.');
    } finally {
      setSolverLoading(false);
    }
  };

  const handleEmfSample = useCallback((emf: number, flux: number) => {
    setLiveEmf(emf);
    setLiveFlux(flux);
  }, []);

  const handleChooseExperiment = (id: ExperimentId) => {
    onSelectStation?.(null);
    onSelectExperiment(id);
    setLabTab('simulations');
    if (isBasicTopic(id)) {
      onSelectTopic(id);
    }
    if (id !== 'mechanics') {
      setShowProjectileMissionDrawer(false);
    }
  };

  const isCompleted = completedModules.includes(`physics-${selectedExperiment}`);
  const quantumExperiments = EXPERIMENT_DEFINITIONS.filter((e) => e.category === 'quantum');
  const basicExperiments = EXPERIMENT_DEFINITIONS.filter((e) => e.category === 'basic');

  return (
    <section aria-labelledby="physics-lab-heading" className="mx-auto max-w-[1720px] px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      {/* Section Header + Top Mode Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-2 pb-3 border-b border-[#E6DEC8] dark:border-[#284766]">
        <div>
          <p className="text-xs font-semibold text-[#0B5F58] dark:text-[#4AD1C6]">
            {t.primaryDomainLabel}
          </p>
          <h2
            id="physics-lab-heading"
            className="text-xl sm:text-2xl font-semibold text-[#17324D] dark:text-[#EEF3F7] mt-0.5 text-balance"
          >
            {t.physicsWorldTitle}
          </h2>
          <p className="hidden xl:block text-sm text-[#1A262C] dark:text-[#B4C5D4] mt-0.5 max-w-3xl">
            {t.physicsWorldDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <div
            role="tablist"
            aria-label="Physics workspace views"
            className="inline-flex items-center rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={labTab === 'simulations'}
              onClick={() => setLabTab('simulations')}
              className={`px-3 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                labTab === 'simulations'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#17324D] dark:text-[#B4C5D4] hover:text-[#0B5F58] dark:hover:text-white'
              }`}
            >
              {t.simulationsTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={labTab === 'practicals'}
              onClick={() => setLabTab('practicals')}
              className={`px-3 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                labTab === 'practicals'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#17324D] dark:text-[#B4C5D4] hover:text-[#0B5F58] dark:hover:text-white'
              }`}
            >
              {t.practicalLab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={labTab === 'solver'}
              onClick={() => setLabTab('solver')}
              className={`px-3 py-2 min-h-[44px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                labTab === 'solver'
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#17324D] dark:text-[#B4C5D4] hover:text-[#0B5F58] dark:hover:text-white'
              }`}
            >
              {t.solverTab}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LEFT EXPERIMENTS PANEL + RIGHT SIDE WINDOW (3D SIMULATION / CALCULATION / READINGS) */}
      {labTab === 'simulations' && (
        <div key="tab-simulations" className="animate-panel-reveal space-y-3 mt-3">
          {/* LEFT EXPERIMENT CHOOSER PANEL */}
          <aside
            aria-label="Physics experiments list"
            className="a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-2 flex gap-3 overflow-x-auto shadow-xs"
          >
            <div className="shrink-0 pr-3 border-r border-[#E6DEC8] dark:border-[#284766]">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#7C3AED] dark:text-[#C4B5FD]">
                {language === 'hi' ? 'नए प्रयोग' : language === 'kn' ? 'ಹೊಸ ಪ್ರಯೋಗಗಳು' : 'New experiments'}
              </p>
              <div className="mt-1 flex gap-1.5">
                {STATION_ORDER.map((sid) => (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => onSelectStation?.(sid)}
                    aria-current={station === sid ? 'page' : undefined}
                    className={`shrink-0 rounded-xl border px-3 py-2 min-h-[44px] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      station === sid
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                        : 'border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] text-[#17324D] dark:text-[#EEF3F7] hover:border-[#7C3AED]'
                    }`}
                  >
                    {stationShortName(sid, language)}
                  </button>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#0B5F58] dark:text-[#4AD1C6]">
                Quantum Physics Experiments
              </p>
              <div className="mt-1 flex gap-1.5">
                {quantumExperiments.map((exp) => {
                  const active = !station && selectedExperiment === exp.id;
                  const done = completedModules.includes(`physics-${exp.id}`);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => handleChooseExperiment(exp.id)}
                      className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 min-h-[44px] text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#0F766E] bg-[#0F766E] text-white shadow-xs'
                          : 'border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={active ? 'text-white' : 'text-[#0B5F58] dark:text-[#4AD1C6]'}>
                          {EXPERIMENT_ICONS[exp.id]}
                        </span>
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {exp.shortName[language]}
                        </span>
                      </span>
                      {done && (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${active ? 'text-[#F2B544]' : 'text-[#0F766E]'}`}
                          aria-label="Completed"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 pl-3 border-l border-[#E6DEC8] dark:border-[#284766]">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#17324D] dark:text-[#F2B544] flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#F2B544]" aria-hidden="true" />
                <span>Basic &amp; Classical Physics</span>
              </p>
              <div className="mt-1 flex gap-1.5">
                {basicExperiments.map((exp) => {
                  const active = !station && selectedExperiment === exp.id;
                  const done = completedModules.includes(`physics-${exp.id}`);
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => handleChooseExperiment(exp.id)}
                      className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 min-h-[44px] text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#0F766E] bg-[#0F766E] text-white shadow-xs'
                          : 'border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className={active ? 'text-white' : 'text-[#D99B26] dark:text-[#F2B544]'}>
                          {EXPERIMENT_ICONS[exp.id]}
                        </span>
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {exp.shortName[language]}
                        </span>
                      </span>
                      {done && (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${active ? 'text-[#F2B544]' : 'text-[#0F766E]'}`}
                          aria-label="Completed"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {station ? (
            <ExperimentStation id={station} language={language} onSelect={(sid) => onSelectStation?.(sid)} />
          ) : (
          /* EXPERIMENT WINDOW */
          <div key={selectedExperiment} className="animate-panel-reveal space-y-3">
            <div className="a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-3 sm:p-4 shadow-sm space-y-3">
              {/* Side Window Header */}
              <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-2 pb-3 border-b border-[#E6DEC8] dark:border-[#284766]">
                <div>
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-[#0B5F58] dark:text-[#4AD1C6]">
                    {experimentMeta.category === 'quantum'
                      ? 'Quantum Physics Lab'
                      : 'Basic Physics Lab'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#17324D] dark:text-[#EEF3F7] mt-0.5">
                    {experimentMeta.title[language]}{' '}
                    <span className="text-xs font-normal text-[#3D4A50] dark:text-[#8FA4B8]">— {experimentMeta.subtitle[language]}</span>
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSimRunning((r) => !r)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                  >
                    {simRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{simRunning ? t.pauseLabel : t.playLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSceneResetKey((k) => k + 1)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                  >
                    <span>Reset</span>
                  </button>

                  {sideTab === '3d' && (
                    <button
                      type="button"
                      onClick={() => setControlsOpen((o) => !o)}
                      aria-expanded={controlsOpen}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{controlsOpen ? 'Hide controls' : 'Show controls'}</span>
                    </button>
                  )}
                  {sideTab === '3d' && (
                    <button
                      type="button"
                      onClick={() => void stage.toggle()}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                    >
                      {stage.isFullscreen ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
                      <span>{stage.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
                    </button>
                  )}

                  <label className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                    Speed
                    <select
                      value={simSpeed}
                      onChange={(e) => setSimSpeed(Number(e.target.value))}
                      className="bg-transparent font-semibold cursor-pointer"
                    >
                      <option value={0.25}>0.25×</option>
                      <option value={0.5}>0.5×</option>
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                        setCaptionText(null);
                      } else {
                        const spoken = `${experimentMeta.title[language]}. ${experimentMeta.concept[language]}`;
                        setCaptionText(spoken);
                        speak(spoken);
                      }
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#0B5F58] dark:text-[#4AD1C6]" aria-hidden="true" />
                    <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCompleteModule(`physics-${selectedExperiment}`)}
                    disabled={isCompleted}
                    className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-[#0F766E]/15 text-[#0B5F58] dark:text-[#4AD1C6] border border-[#0F766E]/45'
                        : 'bg-[#0F766E] text-white hover:bg-[#0B5F58]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isCompleted ? t.completedXpLabel : t.completeLabLabel}</span>
                  </button>
                </div>
              </div>

              {captionText && (
                <div className="rounded-xl border border-[#0F766E]/35 bg-[#0F766E]/10 p-3 text-xs text-[#17324D] dark:text-[#EEF3F7]">
                  <span className="font-semibold text-[#0B5F58] dark:text-[#4AD1C6]">{t.captionPrefix}: </span>
                  <span>{captionText}</span>
                </div>
              )}

              {/* Side Window 3 Tabs: 3D Simulation | Calculation | Readings */}
              <div
                role="tablist"
                aria-label="Experiment views"
                className="grid grid-cols-3 gap-1.5 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-1"
              >
                {(
                  [
                    { id: '3d', label: '3D Simulation', icon: <Box className="w-4 h-4 shrink-0" aria-hidden="true" /> },
                    { id: 'calculation', label: 'Calculation', icon: <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" /> },
                    { id: 'readings', label: 'Readings', icon: <ClipboardList className="w-4 h-4 shrink-0" aria-hidden="true" /> },
                  ] as { id: SideWindowTab; label: string; icon: React.ReactNode }[]
                ).map((tab) => {
                  const active = sideTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSideTab(tab.id)}
                      className={`inline-flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'text-[#17324D] dark:text-[#B4C5D4] hover:text-[#0B5F58] dark:hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.id === 'readings' && readings.length > 0 && (
                        <span className="text-[11px] font-mono opacity-85 tabular-nums">
                          ({readings.length})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SIDE WINDOW TAB 1: 3D SIMULATION + CONTROLS */}
              {sideTab === '3d' && (
                <div key={`side-${selectedExperiment}-3d`} className="animate-panel-reveal space-y-3">
                  <div ref={stage.ref} data-fs={stage.isFullscreen} className={`group/stage ${stage.stageClass}`}>
                  <div
                    className={`grid gap-3 items-start ${
                      controlsOpen
                        ? 'md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]'
                        : 'grid-cols-1'
                    }`}
                  >
                  <div className="min-w-0 relative">
                  {stage.isFullscreen && (
                    <button
                      type="button"
                      onClick={() => void stage.toggle()}
                      className="absolute top-2 right-2 z-10 min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#17324D]/85 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Exit fullscreen
                    </button>
                  )}
                  {selectedExperiment === 'magnetism' ? (
                    <Magnetism3DScene
                      key={`mag-${sceneResetKey}`}
                      turns={params.magTurns}
                      magnetSpeed={params.magSpeed * simSpeed}
                      fieldStrength={params.magField}
                      running={simRunning}
                      lowPowerMode={lowPowerMode}
                      onEmfSample={handleEmfSample}
                    />
                  ) : (
                    <PhysicsExperiment3DScene
                      key={`${selectedExperiment}-${sceneResetKey}`}
                      speed={simSpeed}
                      experimentId={selectedExperiment}
                      params={params}
                      running={simRunning}
                      lowPowerMode={lowPowerMode}
                    />
                  )}
                  </div>

                  {controlsOpen && (
                  <aside
                    aria-label="Experimental values and controls"
                    className="space-y-3 md:max-h-[calc(100vh-190px)] md:overflow-y-auto group-data-[fs=true]/stage:max-h-[calc(100vh-40px)]"
                  >
                  {/* Live experimental values */}
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {computed.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3 py-2"
                      >
                        <p className="text-[11px] font-medium text-[#3D4A50] dark:text-[#8FA4B8]">
                          {m.label}
                        </p>
                        <p
                          className={`text-base font-mono font-semibold tabular-nums ${
                            m.accent === 'amber'
                              ? 'text-[#D99B26] dark:text-[#F2B544]'
                              : m.accent === 'emerald'
                                ? 'text-[#0B5F58] dark:text-[#4AD1C6]'
                                : 'text-[#17324D] dark:text-[#EEF3F7]'
                          }`}
                        >
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Parameter Sliders for Selected Experiment */}
                  <div className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#17324D] dark:text-[#B4C5D4]">
                        Experiment Controls
                      </h4>
                      <button
                        type="button"
                        onClick={handleLogCurrentReading}
                        className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] px-3.5 py-2 text-xs font-semibold text-white cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Record Reading</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
                      {selectedExperiment === 'double-slit' && (
                        <>
                          <SliderControl
                            label="Laser Wavelength (λ)"
                            value={`${params.wavelengthNm} nm`}
                            min={380}
                            max={700}
                            step={5}
                            num={params.wavelengthNm}
                            onChange={(v) => updateParam('wavelengthNm', v)}
                          />
                          <SliderControl
                            label="Slit Separation (d)"
                            value={`${params.slitSepMm.toFixed(2)} mm`}
                            min={0.2}
                            max={1.2}
                            step={0.05}
                            num={params.slitSepMm}
                            onChange={(v) => updateParam('slitSepMm', v)}
                          />
                          <SliderControl
                            label="Screen Distance (L)"
                            value={`${params.screenDistM.toFixed(1)} m`}
                            min={0.5}
                            max={3.0}
                            step={0.1}
                            num={params.screenDistM}
                            onChange={(v) => updateParam('screenDistM', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'photoelectric' && (
                        <>
                          <SliderControl
                            label="Incident Wavelength (λ)"
                            value={`${params.peWavelengthNm} nm`}
                            min={180}
                            max={620}
                            step={10}
                            num={params.peWavelengthNm}
                            onChange={(v) => updateParam('peWavelengthNm', v)}
                          />
                          <SliderControl
                            label="Work Function (φ)"
                            value={`${params.workFunctionEv.toFixed(2)} eV`}
                            min={2.1}
                            max={5.0}
                            step={0.1}
                            num={params.workFunctionEv}
                            onChange={(v) => updateParam('workFunctionEv', v)}
                          />
                          <SliderControl
                            label="Beam Intensity"
                            value={`${params.intensityPct}%`}
                            min={10}
                            max={100}
                            step={5}
                            num={params.intensityPct}
                            onChange={(v) => updateParam('intensityPct', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'bohr-atom' && (
                        <>
                          <SliderControl
                            label="Initial Orbit (nᵢ)"
                            value={`n = ${params.nInitial}`}
                            min={2}
                            max={6}
                            step={1}
                            num={params.nInitial}
                            onChange={(v) => {
                              updateParam('nInitial', v);
                              if (params.nFinal >= v) updateParam('nFinal', v - 1);
                            }}
                          />
                          <SliderControl
                            label="Final Orbit (n_f)"
                            value={`n = ${params.nFinal}`}
                            min={1}
                            max={Math.max(1, params.nInitial - 1)}
                            step={1}
                            num={Math.min(params.nFinal, params.nInitial - 1)}
                            onChange={(v) => updateParam('nFinal', v)}
                          />
                          <SliderControl
                            label="Atomic Number (Z)"
                            value={`Z = ${params.atomicZ}`}
                            min={1}
                            max={3}
                            step={1}
                            num={params.atomicZ}
                            onChange={(v) => updateParam('atomicZ', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'quantum-tunneling' && (
                        <>
                          <SliderControl
                            label="Particle Energy (E)"
                            value={`${params.particleEnergyEv.toFixed(1)} eV`}
                            min={1.0}
                            max={9.0}
                            step={0.2}
                            num={params.particleEnergyEv}
                            onChange={(v) => updateParam('particleEnergyEv', v)}
                          />
                          <SliderControl
                            label="Barrier Height (V₀)"
                            value={`${params.barrierHeightEv.toFixed(1)} eV`}
                            min={2.0}
                            max={10.0}
                            step={0.2}
                            num={params.barrierHeightEv}
                            onChange={(v) => updateParam('barrierHeightEv', v)}
                          />
                          <SliderControl
                            label="Barrier Width (a)"
                            value={`${params.barrierWidthNm.toFixed(2)} nm`}
                            min={0.2}
                            max={1.6}
                            step={0.05}
                            num={params.barrierWidthNm}
                            onChange={(v) => updateParam('barrierWidthNm', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'de-broglie' && (
                        <>
                          <SliderControl
                            label="Accelerating Voltage (V)"
                            value={`${params.accelVoltageV} V`}
                            min={20}
                            max={500}
                            step={10}
                            num={params.accelVoltageV}
                            onChange={(v) => updateParam('accelVoltageV', v)}
                          />
                          <SliderControl
                            label="Crystal Spacing (d)"
                            value={`${params.crystalSpacingNm.toFixed(2)} nm`}
                            min={0.1}
                            max={0.4}
                            step={0.01}
                            num={params.crystalSpacingNm}
                            onChange={(v) => updateParam('crystalSpacingNm', v)}
                          />
                          <div className="flex items-center gap-2 sm:col-span-2">
                            {(['electron', 'proton'] as const).map((pt) => (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => updateParam('particleType', pt)}
                                className={`flex-1 min-h-[44px] rounded-xl border py-2 text-xs font-semibold capitalize cursor-pointer ${
                                  params.particleType === pt
                                    ? 'border-[#0F766E] bg-[#0F766E] text-white'
                                    : 'border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] text-[#17324D] dark:text-[#B4C5D4]'
                                }`}
                              >
                                {pt} Beam
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {selectedExperiment === 'mechanics' && (
                        <>
                          <SliderControl
                            label="Launch Angle (θ)"
                            value={`${params.mechAngle}°`}
                            min={15}
                            max={75}
                            step={1}
                            num={params.mechAngle}
                            onChange={(v) => updateParam('mechAngle', v)}
                          />
                          <SliderControl
                            label="Launch Speed (v₀)"
                            value={`${params.mechVelocity} m/s`}
                            min={10}
                            max={35}
                            step={1}
                            num={params.mechVelocity}
                            onChange={(v) => updateParam('mechVelocity', v)}
                          />
                          <SliderControl
                            label="Gravity (g)"
                            value={`${params.mechGravity.toFixed(2)} m/s²`}
                            min={1.62}
                            max={15.0}
                            step={0.2}
                            num={params.mechGravity}
                            onChange={(v) => updateParam('mechGravity', v)}
                          />
                          <SliderControl
                            label="Ball Mass (m)"
                            value={`${params.mechMass.toFixed(1)} kg`}
                            min={0.5}
                            max={10.0}
                            step={0.5}
                            num={params.mechMass}
                            onChange={(v) => updateParam('mechMass', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'electricity' && (
                        <>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            {(['series', 'parallel'] as const).map((topo) => (
                              <button
                                key={topo}
                                type="button"
                                onClick={() => updateParam('elecTopology', topo)}
                                className={`flex-1 min-h-[44px] rounded-xl border py-2 text-xs font-semibold capitalize cursor-pointer ${
                                  params.elecTopology === topo
                                    ? 'border-[#0F766E] bg-[#0F766E] text-white'
                                    : 'border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] text-[#17324D] dark:text-[#B4C5D4]'
                                }`}
                              >
                                {topo} Circuit
                              </button>
                            ))}
                          </div>
                          <SliderControl
                            label="Source Voltage (V)"
                            value={`${params.elecVoltage} V`}
                            min={1}
                            max={24}
                            step={1}
                            num={params.elecVoltage}
                            onChange={(v) => updateParam('elecVoltage', v)}
                          />
                          <SliderControl
                            label="Resistor R₁"
                            value={`${params.elecR1} Ω`}
                            min={2}
                            max={50}
                            step={1}
                            num={params.elecR1}
                            onChange={(v) => updateParam('elecR1', v)}
                          />
                          <SliderControl
                            label="Resistor R₂"
                            value={`${params.elecR2} Ω`}
                            min={2}
                            max={50}
                            step={1}
                            num={params.elecR2}
                            onChange={(v) => updateParam('elecR2', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'magnetism' && (
                        <>
                          <SliderControl
                            label="Coil Turns (N)"
                            value={`${params.magTurns} turns`}
                            min={20}
                            max={200}
                            step={10}
                            num={params.magTurns}
                            onChange={(v) => updateParam('magTurns', v)}
                          />
                          <SliderControl
                            label="Magnet Speed"
                            value={`${params.magSpeed.toFixed(1)}×`}
                            min={0.3}
                            max={3.0}
                            step={0.1}
                            num={params.magSpeed}
                            onChange={(v) => updateParam('magSpeed', v)}
                          />
                          <SliderControl
                            label="Magnetic Field (B)"
                            value={`${params.magField.toFixed(1)} T`}
                            min={0.5}
                            max={3.0}
                            step={0.1}
                            num={params.magField}
                            onChange={(v) => updateParam('magField', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'optics' && (
                        <>
                          <SliderControl
                            label="Incidence Angle (θ₁)"
                            value={`${params.optAngle}°`}
                            min={5}
                            max={80}
                            step={1}
                            num={params.optAngle}
                            onChange={(v) => updateParam('optAngle', v)}
                          />
                          <SliderControl
                            label="Medium 1 Index (n₁)"
                            value={params.optN1.toFixed(2)}
                            min={1.0}
                            max={2.42}
                            step={0.02}
                            num={params.optN1}
                            onChange={(v) => updateParam('optN1', v)}
                          />
                          <SliderControl
                            label="Medium 2 Index (n₂)"
                            value={params.optN2.toFixed(2)}
                            min={1.0}
                            max={2.0}
                            step={0.02}
                            num={params.optN2}
                            onChange={(v) => updateParam('optN2', v)}
                          />
                        </>
                      )}

                      {selectedExperiment === 'waves' && (
                        <>
                          <SliderControl
                            label="Wave 1 Frequency (f₁)"
                            value={`${params.waveF1} Hz`}
                            min={180}
                            max={520}
                            step={2}
                            num={params.waveF1}
                            onChange={(v) => updateParam('waveF1', v)}
                          />
                          <SliderControl
                            label="Wave 2 Frequency (f₂)"
                            value={`${params.waveF2} Hz`}
                            min={180}
                            max={520}
                            step={2}
                            num={params.waveF2}
                            onChange={(v) => updateParam('waveF2', v)}
                          />
                          <SliderControl
                            label="Amplitude"
                            value={`${params.waveAmp.toFixed(1)}×`}
                            min={0.3}
                            max={1.5}
                            step={0.1}
                            num={params.waveAmp}
                            onChange={(v) => updateParam('waveAmp', v)}
                          />
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => setSoundEnabled((s) => !s)}
                              className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                soundEnabled
                                  ? 'border-[#F2B544] bg-[#FFF4DC] dark:bg-[#F2B544]/20 text-[#17324D] dark:text-[#F8DFA8]'
                                  : 'border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] text-[#17324D] dark:text-[#B4C5D4] hover:border-[#0F766E]'
                              }`}
                            >
                              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                              <span>{soundEnabled ? 'Mute Tone Output' : 'Play Acoustic Tone'}</span>
                            </button>
                          </div>
                        </>
                      )}

                      {selectedExperiment === 'thermodynamics' && (
                        <>
                          <SliderControl
                            label="Hot Chamber Temp (T_h)"
                            value={`${params.thermoTemp} K`}
                            min={250}
                            max={600}
                            step={5}
                            num={params.thermoTemp}
                            onChange={(v) => updateParam('thermoTemp', v)}
                          />
                          <SliderControl
                            label="Chamber Volume (V)"
                            value={`${params.thermoVol.toFixed(1)} L`}
                            min={2.0}
                            max={8.0}
                            step={0.2}
                            num={params.thermoVol}
                            onChange={(v) => updateParam('thermoVol', v)}
                          />
                          <SliderControl
                            label="Cold Sink Temp (T_c)"
                            value={`${params.thermoColdTemp} K`}
                            min={150}
                            max={320}
                            step={5}
                            num={params.thermoColdTemp}
                            onChange={(v) => updateParam('thermoColdTemp', v)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  </aside>
                  )}
                  </div>
                  </div>

                  {/* Plain-language guide in six languages */}
                  <Sim3DGuide experimentId={selectedExperiment} appLanguage={language} />

                  {/* Guided 2D Projectile Mission & Offline Download Pack toggle when Projectile Motion is active */}
                  {selectedExperiment === 'mechanics' && (
                    <div className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                            Guided Target Mission, Tutorial &amp; Offline Lesson Pack
                          </p>
                          <p className="text-xs text-[#3D4A50] dark:text-[#8FA4B8]">
                            Includes prediction quiz, step-by-step hints, comparison graph, and offline save.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProjectileMissionDrawer((v) => !v)}
                          className="min-h-[44px] rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                        >
                          {showProjectileMissionDrawer ? 'Hide Guided 2D Mission' : 'Open Guided 2D Mission & Offline Pack'}
                        </button>
                      </div>

                      {showProjectileMissionDrawer && (
                        <ProjectileMissionLab
                          language={language}
                          lowPowerMode={lowPowerMode}
                          isOnline={isOnline}
                          syncStatus={syncStatus}
                          pendingSyncCount={pendingSyncCount}
                          isCompleted={isCompleted}
                          isTutorialCompleted={completedModules.includes('physics-mechanics-tutorial')}
                          onTutorialCompleted={() => onCompleteModule('physics-mechanics-tutorial')}
                          focusSection={projectileFocusSection}
                          onAttemptRecorded={onAttemptRecorded}
                          onLogReading={onLogReading}
                          onCompleteModule={() => onCompleteModule('physics-mechanics')}
                          onSaveProjectileQuiz={onSaveProjectileQuiz}
                          onOfflinePacksChanged={onOfflinePacksChanged}
                          onOpenPracticalTab={() => setLabTab('practicals')}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SIDE WINDOW TAB 2: LIVE FORMULA & STEP-BY-STEP CALCULATION */}
              {sideTab === 'calculation' && (
                <div key={`side-${selectedExperiment}-calc`} className="animate-panel-reveal space-y-5">
                  <div className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#3D4A50] dark:text-[#8FA4B8]">
                      Governing Equations
                    </p>
                    <p className="text-sm sm:text-base font-mono font-semibold text-[#0B5F58] dark:text-[#4AD1C6] mt-1.5">
                      {experimentMeta.formula}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {computed.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-3.5"
                      >
                        <p className="text-[11px] font-medium text-[#3D4A50] dark:text-[#8FA4B8]">
                          {m.label}
                        </p>
                        <p className="text-lg font-mono font-semibold text-[#17324D] dark:text-[#EEF3F7] mt-1 tabular-nums">
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                      Live Step-by-Step Working
                    </h4>
                    <ol className="space-y-2 text-xs sm:text-sm text-[#1A262C] dark:text-[#B4C5D4] list-decimal pl-5 font-mono leading-relaxed">
                      {computed.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-xl border border-[#0F766E]/35 bg-[#0F766E]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs leading-relaxed text-[#17324D] dark:text-[#B4C5D4]">
                      {experimentMeta.concept[language]}
                    </p>
                    <button
                      type="button"
                      disabled={!isOnline}
                      onClick={() =>
                        onOpenMentorWithPrompt(
                          'Physics',
                          `Explain ${experimentMeta.title.en} (${experimentMeta.formula}) and how changing parameters affects the result.`
                        )
                      }
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5F58] shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isOnline ? t.askMentor : t.requiresInternetNotice}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SIDE WINDOW TAB 3: READINGS & OBSERVATION LOG */}
              {sideTab === 'readings' && (
                <div key={`side-${selectedExperiment}-readings`} className="animate-panel-reveal space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] p-4">
                    <div>
                      <p className="text-xs font-medium text-[#3D4A50] dark:text-[#8FA4B8]">
                        Current Live Instrument Snapshot
                      </p>
                      <p className="text-xs sm:text-sm font-mono font-semibold text-[#17324D] dark:text-[#EEF3F7] mt-1 tabular-nums">
                        {computed.readingParameterSummary} → {computed.readingMeasuredSummary} ({computed.readingCalculatedSummary})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogCurrentReading}
                      className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4" aria-hidden="true" />
                      <span>Record Reading</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                      Recorded Readings Table
                    </h4>
                    <div className="flex items-center gap-2">
                      {readings.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleExportReadingsCsv}
                            className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-[#E6DEC8] dark:border-[#284766] px-3 py-1.5 text-xs font-medium text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setReadings([])}
                            className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-[#E6DEC8] dark:border-[#284766] px-3 py-1.5 text-xs text-[#3D4A50] dark:text-[#8FA4B8] hover:text-[#17324D] dark:hover:text-white cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Clear</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {readings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E6DEC8] dark:border-[#284766] p-8 text-center">
                      <p className="text-sm text-[#3D4A50] dark:text-[#8FA4B8]">
                        No readings recorded yet. Adjust sliders in the 3D Simulation tab and click Record Reading.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#E6DEC8] dark:border-[#284766]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F7EFE0] dark:bg-[#1C3652]">
                          <tr className="border-b border-[#E6DEC8] dark:border-[#284766] text-[#17324D] dark:text-[#EEF3F7]">
                            <th className="py-2.5 px-3 font-semibold">Experiment</th>
                            <th className="py-2.5 px-3 font-semibold">Parameters</th>
                            <th className="py-2.5 px-3 font-semibold">Measured</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Derived</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DEC8] dark:divide-[#284766] tabular-nums font-mono">
                          {readings.map((row) => (
                            <tr key={row.id} className="text-[#1A262C] dark:text-[#EEF3F7]">
                              <td className="py-2.5 px-3 font-sans font-medium text-[#17324D] dark:text-[#EEF3F7]">{row.topic}</td>
                              <td className="py-2.5 px-3">{row.parameter}</td>
                              <td className="py-2.5 px-3 text-[#0B5F58] dark:text-[#4AD1C6]">{row.measured}</td>
                              <td className="py-2.5 px-3 text-right text-[#0B5F58] dark:text-[#4AD1C6]">
                                {row.calculated}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: VIRTUAL PRACTICAL EXPERIMENTS & DATA LOG */}
      {labTab === 'practicals' && (
        <div key="tab-practicals" className="animate-panel-reveal grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-5 a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#17324D] dark:text-[#EEF3F7]">
              {currentModule.experimentTitle[language]}
            </h3>
            <ol className="space-y-2.5 text-sm text-[#1A262C] dark:text-[#B4C5D4] list-decimal pl-5">
              {currentModule.experimentSteps.map((step, i) => (
                <li key={i}>{step[language]}</li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLabTab('simulations')}
                className="min-h-[44px] rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2 text-xs font-semibold text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer"
              >
                Open 3D Workbench
              </button>
              <button
                type="button"
                onClick={handleLogCurrentReading}
                className="min-h-[44px] rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5F58] cursor-pointer"
              >
                Record Current Reading
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                Virtual Lab Observation Table
              </h3>
              {readings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReadings([])}
                  className="min-h-[40px] inline-flex items-center gap-1 text-xs text-[#3D4A50] hover:text-[#17324D] dark:hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Log</span>
                </button>
              )}
            </div>

            {readings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E6DEC8] dark:border-[#284766] p-8 text-center">
                <p className="text-sm text-[#3D4A50] dark:text-[#8FA4B8]">
                  No practical readings logged yet. Adjust sliders in any experiment and click Record Reading.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6DEC8] dark:border-[#284766] text-[#17324D] dark:text-[#8FA4B8]">
                      <th className="py-2 pr-3 font-semibold">Module</th>
                      <th className="py-2 pr-3 font-semibold">Input Parameters</th>
                      <th className="py-2 pr-3 font-semibold">Measured</th>
                      <th className="py-2 font-semibold text-right">Derived Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DEC8] dark:divide-[#284766] tabular-nums font-mono">
                    {readings.map((row) => (
                      <tr key={row.id} className="text-[#1A262C] dark:text-[#EEF3F7]">
                        <td className="py-2.5 pr-3 font-sans font-medium text-[#17324D] dark:text-[#EEF3F7]">{row.topic}</td>
                        <td className="py-2.5 pr-3">{row.parameter}</td>
                        <td className="py-2.5 pr-3 text-[#0B5F58] dark:text-[#4AD1C6]">{row.measured}</td>
                        <td className="py-2.5 text-right text-[#0B5F58] dark:text-[#4AD1C6]">
                          {row.calculated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICS NUMERICAL PROBLEM SOLVER */}
      {labTab === 'solver' && (
        <div key="tab-solver" className="animate-panel-reveal grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <form
            onSubmit={handleSolveNumerical}
            className="lg:col-span-6 a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#17324D] dark:text-[#EEF3F7] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#0B5F58] dark:text-[#4AD1C6]" aria-hidden="true" />
                <span>{t.solverTab}</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#D99B26] dark:text-[#F2B544]">
                {t.requiresInternetNotice}
              </span>
            </div>

            {!isOnline && (
              <div className="rounded-xl border border-[#F2B544] bg-[#FFF4DC] dark:bg-[#F2B544]/15 p-3 text-xs text-[#17324D] dark:text-[#F8DFA8]">
                You are currently offline. Cloud AI numerical solving requires an internet connection, while all interactive simulations and calculations tabs work offline.
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isTranscribing || !isOnline}
                onClick={() =>
                  isRecording
                    ? stopRecording()
                    : void startRecording((text) => setSolverInput(text))
                }
                className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                  isRecording
                    ? 'border-red-500 bg-red-500/15 text-red-600'
                    : 'border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] text-[#17324D] dark:text-[#EEF3F7]'
                }`}
              >
                {isRecording ? <Square className="w-3.5 h-3.5" aria-hidden="true" /> : <Mic className="w-3.5 h-3.5" aria-hidden="true" />}
                <span>
                  {isRecording
                    ? 'Stop & Transcribe'
                    : isTranscribing
                      ? 'Transcribing...'
                      : t.voiceInput}
                </span>
              </button>
            </div>

            <textarea
              rows={4}
              value={solverInput}
              onChange={(e) => setSolverInput(e.target.value)}
              placeholder="Enter any Physics numerical (e.g., double slit fringe width, photoelectric threshold, kinematics, circuits)..."
              className="w-full rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-[#F6F1E3] dark:bg-[#1C3652] px-3.5 py-2.5 text-sm text-[#17324D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />

            {transcribeError && <p className="text-xs text-[#D99B26] dark:text-[#F2B544]">{transcribeError}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSolverInput(currentModule.sampleNumerical)}
                className="min-h-[40px] text-xs font-semibold text-[#0B5F58] dark:text-[#4AD1C6] hover:underline cursor-pointer"
              >
                Load {currentModule.title[language]} Preset
              </button>
              <button
                type="submit"
                disabled={solverLoading || !isOnline}
                className="min-h-[44px] rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5F58] disabled:opacity-50 cursor-pointer"
              >
                {solverLoading ? 'Solving...' : t.solveNumerical}
              </button>
            </div>

            {solverError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                {solverError}
              </div>
            )}
          </form>

          <div className="lg:col-span-6 a11y-surface rounded-2xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] p-5">
            {!solverResult ? (
              <div className="h-full flex flex-col justify-center items-center text-center py-8">
                <Calculator className="w-8 h-8 text-[#3D4A50] mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#17324D] dark:text-[#EEF3F7]">
                  Structured Step-by-Step Physics Solution
                </p>
                <p className="text-xs text-[#3D4A50] dark:text-[#8FA4B8] mt-1 max-w-sm">
                  Submit a numerical problem on the left to extract given SI quantities, governing equations, calculations, and dimensional checks.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0B5F58] dark:text-[#4AD1C6]">
                    {solverResult.finalAnswer
                      ? `Final Answer: ${solverResult.finalAnswer} ${solverResult.unit}`
                      : 'No answer — this does not look like a complete physics numerical. See the note below.'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      isSpeaking
                        ? stopSpeaking()
                        : speak(
                            `Formula: ${solverResult.formula}. Answer: ${solverResult.finalAnswer} ${solverResult.unit}. ${solverResult.verificationTip}`
                          )
                    }
                    className="min-h-[40px] inline-flex items-center gap-1 rounded-lg border border-[#E6DEC8] dark:border-[#284766] px-3 py-1.5 text-xs text-[#17324D] dark:text-[#EEF3F7] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#3D4A50] dark:text-[#8FA4B8]">Given Data</p>
                  <ul className="mt-1 space-y-1 text-xs font-mono text-[#17324D] dark:text-white">
                    {solverResult.given.map((g, idx) => (
                      <li key={idx}>• {g}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-[#F6F1E3] dark:bg-[#1C3652] border border-[#E6DEC8] dark:border-[#284766] p-3">
                  <p className="text-[11px] text-[#3D4A50] dark:text-[#8FA4B8]">Governing Formula</p>
                  <p className="text-sm font-mono font-semibold text-[#0B5F58] dark:text-[#4AD1C6] mt-0.5">
                    {solverResult.formula}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#3D4A50] dark:text-[#8FA4B8]">Step-by-Step Working</p>
                  <ol className="mt-1 space-y-1.5 text-xs text-[#1A262C] dark:text-[#B4C5D4] list-decimal pl-4">
                    {solverResult.steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>

                {solverResult.finalAnswer && (
                  <div
                    className={`rounded-lg border p-3 text-xs ${
                      solverResult.calculatorChecked
                        ? 'border-[#0F766E] bg-[#E3F4F1] dark:bg-[#0F3B38] text-[#0B5F58] dark:text-[#9FE3DA]'
                        : 'border-[#B45309] bg-[#FDF0E1] dark:bg-[#3A2A14] text-[#7A2E0E] dark:text-[#F5B38A]'
                    }`}
                  >
                    {solverResult.calculatorChecked ? (
                      <>
                        <p className="font-semibold">✓ Final number re-calculated by the app's calculator</p>
                        <p className="font-mono mt-1 break-all">
                          {solverResult.calculation} = {solverResult.finalAnswer} {solverResult.unit}
                        </p>
                        {solverResult.modelAnswer && (
                          <p className="mt-1">
                            The AI first wrote “{solverResult.modelAnswer}”, which was an arithmetic slip, so it has been corrected above. Check the steps with this number.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="font-semibold">
                        The final number could not be re-checked by the calculator. Please verify the arithmetic yourself.
                      </p>
                    )}
                    <p className="mt-1 opacity-80">
                      The formula and steps come from AI{solverResult.model ? ` (${solverResult.model})` : ''} and can still be wrong. Compare with your textbook or teacher.
                    </p>
                  </div>
                )}

                <p className="text-xs text-[#3D4A50] dark:text-[#8FA4B8] border-t border-[#E6DEC8] dark:border-[#284766] pt-3">
                  Verification: {solverResult.verificationTip}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

interface SliderControlProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  num: number;
  onChange: (val: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  num,
  onChange,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-[#17324D] dark:text-[#B4C5D4]">{label}</span>
      <span className="font-mono font-semibold text-[#0B5F58] dark:text-[#4AD1C6] tabular-nums">{value}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Number((num - step).toFixed(4))))}
        aria-label={`Decrease ${label}`}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer shrink-0"
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={num}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#0F766E] cursor-pointer"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, Number((num + step).toFixed(4))))}
        aria-label={`Increase ${label}`}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E6DEC8] dark:border-[#284766] bg-white dark:bg-[#152A40] text-[#17324D] dark:text-[#EEF3F7] hover:border-[#0F766E] cursor-pointer shrink-0"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
);
