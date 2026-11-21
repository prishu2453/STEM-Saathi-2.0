import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Atom, Pause, Play, RotateCcw } from 'lucide-react';
import {
  computeExperiment,
  DEFAULT_EXPERIMENT_PARAMS,
  EXPERIMENT_DEFINITIONS,
  type ExperimentId,
  type ExperimentParamValues,
} from '../data/physicsExperiments';
import { SIM_EXPLANATIONS } from '../data/simExplanations';
import type { Language } from '../types/stem';

const PhysicsExperiment3DScene = lazy(() =>
  import('./PhysicsExperiment3DScene').then((m) => ({ default: m.PhysicsExperiment3DScene }))
);
const Magnetism3DScene = lazy(() =>
  import('./Magnetism3DScene').then((m) => ({ default: m.Magnetism3DScene }))
);

const T = {
  load: { en: 'Load 3D simulation (uses data)', hi: '3D सिमुलेशन खोलें (डेटा लगेगा)', kn: '3D ಸಿಮ್ಯುಲೇಶನ್ ತೆರೆಯಿರಿ (ಡೇಟಾ ಬಳಕೆ)' },
  loading: { en: 'Loading…', hi: 'लोड हो रहा है…', kn: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…' },
  play: { en: 'Play', hi: 'चलाएँ', kn: 'ಪ್ಲೇ' },
  pause: { en: 'Pause', hi: 'रोकें', kn: 'ನಿಲ್ಲಿಸಿ' },
  reset: { en: 'Reset', hi: 'रीसेट', kn: 'ರೀಸೆಟ್' },
  speed: { en: 'Speed', hi: 'गति', kn: 'ವೇಗ' },
  tryIt: { en: 'Change the sliders and watch the numbers', hi: 'स्लाइडर बदलें और संख्याएँ देखें', kn: 'ಸ್ಲೈಡರ್ ಬದಲಿಸಿ ಸಂಖ್ಯೆಗಳನ್ನು ನೋಡಿ' },
  live: { en: 'Live measurements', hi: 'लाइव माप', kn: 'ಲೈವ್ ಅಳತೆಗಳು' },
  what: { en: 'What is happening?', hi: 'क्या हो रहा है?', kn: 'ಏನು ನಡೆಯುತ್ತಿದೆ?' },
  why: { en: 'Why is it happening?', hi: 'ऐसा क्यों हो रहा है?', kn: 'ಇದು ಏಕೆ ನಡೆಯುತ್ತಿದೆ?' },
  principle: { en: 'Physics principle', hi: 'भौतिकी का सिद्धांत', kn: 'ಭೌತಶಾಸ್ತ್ರ ತತ್ವ' },
  formula: { en: 'Formula used', hi: 'प्रयुक्त सूत्र', kn: 'ಬಳಸಿದ ಸೂತ್ರ' },
  whatIf: { en: 'What if you change something?', hi: 'कुछ बदलने पर क्या होगा?', kn: 'ಏನಾದರೂ ಬದಲಿಸಿದರೆ ಏನಾಗುತ್ತದೆ?' },
};

interface Props {
  experimentId: ExperimentId;
  language: Language;
  lowPowerMode?: boolean;
}

/** Simulation + explanation shown inside the chapter itself (no page change). Loads only after a tap. */
export const InlineSimulation: React.FC<Props> = ({ experimentId, language, lowPowerMode = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [params, setParams] = useState<ExperimentParamValues>(DEFAULT_EXPERIMENT_PARAMS);
  const [liveEmf, setLiveEmf] = useState<{ emf: number; flux: number } | undefined>();

  const def = EXPERIMENT_DEFINITIONS.find((d) => d.id === experimentId);
  const info = SIM_EXPLANATIONS[experimentId];
  const computed = useMemo(
    () => computeExperiment(experimentId, params, experimentId === 'magnetism' ? liveEmf : undefined),
    [experimentId, params, liveEmf]
  );
  if (!def || !info) return null;

  const set = (key: keyof ExperimentParamValues, value: number | string) =>
    setParams((p) => ({ ...p, [key]: value }));
  const btn =
    'min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] cursor-pointer hover:border-[#6D28D9]';

  return (
    <section
      aria-label={def.title[language]}
      className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Atom className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
        <h4 className="text-base font-semibold text-[#2E1A6E] dark:text-white">{def.title[language]}</h4>
      </div>

      {!loaded ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-3 text-sm font-semibold text-white cursor-pointer"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          {T.load[language]}
        </button>
      ) : (
        <>
          <Suspense
            fallback={<div className="h-[310px] rounded-xl bg-[#120A28] text-white grid place-items-center">{T.loading[language]}</div>}
          >
            {experimentId === 'magnetism' ? (
              <Magnetism3DScene
                key={`m-${resetKey}`}
                turns={params.magTurns}
                magnetSpeed={params.magSpeed * speed}
                fieldStrength={params.magField}
                running={running}
                lowPowerMode={lowPowerMode}
                onEmfSample={(emf, flux) => setLiveEmf({ emf, flux })}
              />
            ) : (
              <PhysicsExperiment3DScene
                key={`${experimentId}-${resetKey}`}
                experimentId={experimentId}
                params={params}
                running={running}
                speed={speed}
                lowPowerMode={lowPowerMode}
              />
            )}
          </Suspense>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {running ? T.pause[language] : T.play[language]}
            </button>
            <button type="button" className={btn} onClick={() => setResetKey((k) => k + 1)}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {T.reset[language]}
            </button>
            <label className={btn}>
              {T.speed[language]}
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-transparent cursor-pointer">
                {[0.25, 0.5, 1, 2].map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{T.tryIt[language]}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {info.sliders.map((s) => (
              <label key={s.key} className="block text-sm text-[#22163F] dark:text-[#F3EFFF]">
                <span className="font-semibold">
                  {s.label[language]}
                  {!s.choices && `: ${params[s.key] as number} ${s.unit}`}
                </span>
                {s.choices ? (
                  <select
                    value={params[s.key] as string}
                    onChange={(e) => set(s.key, e.target.value)}
                    className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#B6A6E0] bg-white dark:bg-[#2A1D5C] px-2"
                  >
                    {s.choices.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label[language]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={params[s.key] as number}
                    onChange={(e) => set(s.key, Number(e.target.value))}
                    className="mt-1 block w-full h-8 accent-[#6D28D9]"
                  />
                )}
              </label>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white mb-2">{T.live[language]}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {computed.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                  <div className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{m.label}</div>
                  <div className="text-lg font-semibold tabular-nums text-[#2E1A6E] dark:text-white">{m.value}</div>
                </div>
              ))}
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-[#22163F] dark:text-[#E4DDFA] space-y-1">
              {computed.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="grid gap-3 text-sm text-[#22163F] dark:text-[#E4DDFA]">
        <p><strong>{T.what[language]}</strong> {info.what[language]}</p>
        <p><strong>{T.why[language]}</strong> {info.why[language]}</p>
        <p><strong>{T.principle[language]}:</strong> {info.principle[language]}</p>
        <p><strong>{T.formula[language]}:</strong> <span className="font-mono">{def.formula}</span></p>
        <div>
          <strong>{T.whatIf[language]}</strong>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            {info.whatIf.map((w, i) => (
              <li key={i}>{w[language]}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
