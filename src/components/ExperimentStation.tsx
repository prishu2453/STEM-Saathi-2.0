import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Repeat,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import type { Language } from '../types/stem';
import { defaults, type Params } from '../sims/simTypes';
import { STATIONS, type StationId } from '../sims/stations';
import { useStageFullscreen } from '../hooks/useStageFullscreen';

interface Props {
  id: StationId;
  language: Language;
  onSelect?: (id: StationId) => void;
}

const T = {
  start: { en: 'Start', hi: 'शुरू', kn: 'ಪ್ರಾರಂಭ' },
  pause: { en: 'Pause', hi: 'रोकें', kn: 'ವಿರಾಮ' },
  reset: { en: 'Reset', hi: 'रीसेट', kn: 'ಮರುಹೊಂದಿಸಿ' },
  replay: { en: 'Replay', hi: 'दोबारा चलाएँ', kn: 'ಮರುಪ್ರದರ್ಶನ' },
  speed: { en: 'Speed', hi: 'गति', kn: 'ವೇಗ' },
  full: { en: 'Fullscreen', hi: 'पूर्ण स्क्रीन', kn: 'ಪೂರ್ಣ ಪರದೆ' },
  exitFull: { en: 'Exit fullscreen', hi: 'पूर्ण स्क्रीन बंद', kn: 'ಪೂರ್ಣ ಪರದೆ ನಿರ್ಗಮಿಸಿ' },
  values: { en: 'Experimental values', hi: 'प्रयोग के मान', kn: 'ಪ್ರಯೋಗದ ಮೌಲ್ಯಗಳು' },
  controls: { en: 'Controls', hi: 'नियंत्रण', kn: 'ನಿಯಂತ್ರಣಗಳು' },
  live: { en: 'Live measurements', hi: 'लाइव माप', kn: 'ಲೈವ್ ಅಳತೆಗಳು' },
  hide: { en: 'Hide panel', hi: 'पैनल छिपाएँ', kn: 'ಫಲಕ ಮರೆಮಾಡಿ' },
  show: { en: 'Show values & controls', hi: 'मान और नियंत्रण दिखाएँ', kn: 'ಮೌಲ್ಯ ಮತ್ತು ನಿಯಂತ್ರಣ ತೋರಿಸಿ' },
  formulas: { en: 'Formulas', hi: 'सूत्र', kn: 'ಸೂತ್ರಗಳು' },
  withValues: { en: 'With your values', hi: 'आपके मानों से', kn: 'ನಿಮ್ಮ ಮೌಲ್ಯಗಳೊಂದಿಗೆ' },
  principle: { en: 'The science behind it', hi: 'इसके पीछे का विज्ञान', kn: 'ಇದರ ಹಿಂದಿನ ವಿಜ್ಞಾನ' },
  observe: { en: 'Observations — try this', hi: 'अवलोकन — यह करके देखें', kn: 'ವೀಕ್ಷಣೆಗಳು — ಇದನ್ನು ಪ್ರಯತ್ನಿಸಿ' },
  assume: { en: 'Assumptions & limitations', hi: 'मान्यताएँ और सीमाएँ', kn: 'ಊಹೆಗಳು ಮತ್ತು ಮಿತಿಗಳು' },
  quiz: { en: 'Quick quiz', hi: 'छोटी क्विज़', kn: 'ಸಣ್ಣ ರಸಪ್ರಶ್ನೆ' },
  score: { en: 'Score', hi: 'अंक', kn: 'ಅಂಕ' },
  tryAgain: { en: 'Try again', hi: 'फिर से करें', kn: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' },
};

const SHORT: Record<StationId, { en: string; hi: string; kn: string }> = {
  pendulum: { en: 'Simple Pendulum', hi: 'सरल लोलक', kn: 'ಸರಳ ಲೋಲಕ' },
  torricelli: { en: 'Torricelli', hi: 'टॉरिसेली', kn: 'ಟೊರಿಸೆಲ್ಲಿ' },
  bernoulli: { en: 'Bernoulli', hi: 'बर्नौली', kn: 'ಬರ್ನೌಲಿ' },
  'concave-mirror': { en: 'Concave Mirror', hi: 'अवतल दर्पण', kn: 'ನಿಮ್ನ ದರ್ಪಣ' },
  'convex-mirror': { en: 'Convex Mirror', hi: 'उत्तल दर्पण', kn: 'ಪೀನ ದರ್ಪಣ' },
};
export const stationShortName = (id: StationId, lang: Language) => SHORT[id][lang];

const btn =
  'min-h-[44px] min-w-[44px] justify-center inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2.5 py-2 text-xs sm:text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer';

export const ExperimentStation: React.FC<Props> = ({ id, language, onSelect }) => {
  const def = STATIONS[id];
  const { ref: stageRef, isFullscreen: isFs, toggle: toggleFullscreen, stageClass } = useStageFullscreen<HTMLDivElement>();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  // bring the experiment itself into view (the lab header stays reachable by scrolling up)
  useEffect(() => {
    sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [id]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const constrain = useCallback((p: Params) => (def.constrain ? def.constrain(p) : p), [def]);
  const [params, setParams] = useState<Params>(() => constrain(defaults(def.params)));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [panelOpen, setPanelOpen] = useState(true);
  const [readings, setReadings] = useState<ReturnType<typeof def.readings>>([]);
  const [live, setLive] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const paramsRef = useRef(params);
  const runRef = useRef(running);
  const speedRef = useRef(speed);
  const stateRef = useRef<any>(null);
  const sizeRef = useRef({ w: 600, h: 400 });
  const visibleRef = useRef(true);
  paramsRef.current = params;
  runRef.current = running;
  speedRef.current = speed;

  // new experiment → fresh state
  useEffect(() => {
    const p = constrain(defaults(def.params));
    paramsRef.current = p;
    setParams(p);
    stateRef.current = def.init(p);
    setRunning(true);
    setSpeed(1);
    setAnswers({});
  }, [def, constrain]);

  // canvas follows its box (window resize, side panel collapse, fullscreen)
  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const apply = () => {
      const w = Math.max(260, wrap.clientWidth);
      const h = Math.max(260, wrap.clientHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w, h };
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // pause drawing when the canvas is scrolled out of view
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
    });
    io.observe(cv);
    return () => io.disconnect();
  }, []);

  // one animation loop for the whole station; cleaned up on unmount / experiment change
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s && visibleRef.current) {
        if (runRef.current) {
          const t = dt * speedRef.current;
          const n = Math.max(1, Math.ceil(t / (1 / 240)));
          for (let i = 0; i < n; i++) def.step(s, paramsRef.current, t / n);
        }
        const c = canvasRef.current?.getContext('2d');
        if (c) {
          const dark = document.documentElement.classList.contains('dark');
          const { w, h } = sizeRef.current;
          c.fillStyle = dark ? '#120A28' : '#FFFDF7';
          c.fillRect(0, 0, w, h);
          def.draw(c, s, paramsRef.current, w, h, dark, language);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const iv = window.setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      setReadings(def.readings(s, paramsRef.current));
      setLive(def.liveFormula(s, paramsRef.current));
    }, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [def, language]);

  const onParam = (key: string, value: number, liveParam?: boolean) => {
    const next = constrain({ ...paramsRef.current, [key]: value });
    paramsRef.current = next;
    setParams(next);
    if (!liveParam) stateRef.current = def.init(next);
  };
  const replay = () => {
    stateRef.current = def.init(paramsRef.current);
    setRunning(true);
  };
  const reset = () => {
    const p = constrain(defaults(def.params));
    paramsRef.current = p;
    setParams(p);
    stateRef.current = def.init(p);
    setRunning(true);
    setSpeed(1);
  };

  const score = useMemo(() => def.quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0), [answers, def]);
  const L = language;

  return (
    <section ref={sectionRef} aria-labelledby={`station-${id}-title`} className="space-y-3 scroll-mt-[68px]">
      {/* 1. title + intro + run controls */}

      {/* 2 + 3. large simulation (≈75%) with values/controls on the RIGHT (≈25%) */}
      <div
        ref={stageRef}
        data-fs={isFs}
        className={`group/stage ${stageClass}`}
      >
        <div
          className={`grid gap-3 ${
            panelOpen ? 'md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]' : 'grid-cols-1'
          }`}
        >
          <div className="min-w-0 space-y-2">
            {/* run bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 id={`station-${id}-title`} className="mr-1 text-base lg:text-lg font-bold text-[#2E1A6E] dark:text-white">
                {def.title[L]}
              </h3>
              <button type="button" className={btn} onClick={() => setRunning((r) => !r)} aria-pressed={!running}>
                {running ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                {running ? T.pause[L] : T.start[L]}
              </button>
              <button type="button" className={btn} onClick={replay} title={T.replay[L]} aria-label={T.replay[L]}>
                <Repeat className="w-4 h-4" aria-hidden="true" />
                <span className="hidden xl:inline">{T.replay[L]}</span>
              </button>
              <button type="button" className={btn} onClick={reset} title={T.reset[L]} aria-label={T.reset[L]}>
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span className="hidden xl:inline">{T.reset[L]}</span>
              </button>
              <label className={btn}>
                <span className="hidden xl:inline">{T.speed[L]}</span>
                <select aria-label={T.speed[L]} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-transparent cursor-pointer">
                  {def.speeds.map((v) => (
                    <option key={v} value={v}>
                      {v}×
                    </option>
                  ))}
                </select>
              </label>
              <span className="flex-1" />
              <button type="button" className={btn} onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen} title={panelOpen ? T.hide[L] : T.show[L]} aria-label={panelOpen ? T.hide[L] : T.show[L]}>
                <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                <span className="hidden xl:inline">{panelOpen ? T.hide[L] : T.show[L]}</span>
                {panelOpen ? <ChevronRight className="w-4 h-4 hidden md:block" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4 hidden md:block" aria-hidden="true" />}
              </button>
              <button type="button" className={btn} onClick={() => void toggleFullscreen()} title={isFs ? T.exitFull[L] : T.full[L]} aria-label={isFs ? T.exitFull[L] : T.full[L]}>
                {isFs ? <Minimize2 className="w-4 h-4" aria-hidden="true" /> : <Maximize2 className="w-4 h-4" aria-hidden="true" />}
                <span className="hidden xl:inline">{isFs ? T.exitFull[L] : T.full[L]}</span>
              </button>
            </div>
            <div
              ref={wrapRef}
              className="w-full h-[58vh] min-h-[320px] lg:h-[calc(100vh-200px)] lg:min-h-[440px] max-h-[920px] group-data-[fs=true]/stage:h-[calc(100vh-90px)] group-data-[fs=true]/stage:max-h-none rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] overflow-hidden"
            >
              <canvas ref={canvasRef} role="img" aria-label={`${def.title[L]}. ${def.intro[L]}`} className="block" />
            </div>
          </div>

          {panelOpen && (
            <aside
              aria-label={T.values[L]}
              className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-3 space-y-4 md:max-h-[calc(100vh-150px)] md:sticky md:top-20 md:overflow-y-auto group-data-[fs=true]/stage:max-h-[calc(100vh-40px)]"
            >
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">{T.controls[L]}</h4>
                {def.params.map((q) => (
                  <div key={q.key} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor={`st-${id}-${q.key}`} className="text-xs sm:text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                        {q.label[L]}
                      </label>
                      {!q.choices && (
                        <span className="text-sm font-mono font-bold tabular-nums text-[#5B21B6] dark:text-[#C4B5FD] whitespace-nowrap">
                          {params[q.key]} {q.unit}
                        </span>
                      )}
                    </div>
                    {q.choices ? (
                      <div id={`st-${id}-${q.key}`} role="group" className="grid grid-cols-2 gap-1">
                        {q.choices.map((ch) => (
                          <button
                            key={ch.value}
                            type="button"
                            aria-pressed={params[q.key] === ch.value}
                            onClick={() => onParam(q.key, ch.value, q.live)}
                            className={`min-h-[40px] rounded-lg border px-2 py-1 text-xs font-semibold ${
                              params[q.key] === ch.value
                                ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                                : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F3EFFF]'
                            }`}
                          >
                            {ch.label[L]}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        id={`st-${id}-${q.key}`}
                        type="range"
                        min={q.min}
                        max={q.max}
                        step={q.step}
                        value={params[q.key]}
                        aria-valuetext={`${params[q.key]} ${q.unit}`}
                        onChange={(e) => onParam(q.key, Number(e.target.value), q.live)}
                        className="block w-full h-8 accent-[#6D28D9] cursor-pointer"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">{T.live[L]}</h4>
                <dl className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                  {readings.map((r) => (
                    <div
                      key={r.label.en}
                      className={`rounded-lg px-2.5 py-1.5 ${
                        r.accent ? 'bg-[#EFE7FF] dark:bg-[#2D1B5A]' : 'bg-[#F5F0FF] dark:bg-[#2A1D5C]'
                      }`}
                    >
                      <dt className="text-[11px] leading-tight text-[#4A3F66] dark:text-[#C9BFEA]">{r.label[L]}</dt>
                      <dd className="text-sm font-mono font-bold tabular-nums text-[#2E1A6E] dark:text-white">
                        {r.nature ? r.nature[L] : `${r.value} ${r.unit ?? ''}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="rounded-lg border border-[#6D28D9]/40 bg-[#6D28D9]/10 px-2.5 py-2 text-xs font-mono text-[#5B21B6] dark:text-[#9FE3DA] break-words">
                {live}
              </p>
            </aside>
          )}
        </div>
      </div>

      {/* 6–9. formulas, principle, observations, assumptions, quiz */}
      <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] max-w-5xl">{def.intro[L]}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-2">
          <h4 className="text-sm font-bold text-[#2E1A6E] dark:text-white">{T.formulas[L]}</h4>
          <ul className="space-y-2">
            {def.formulas.map((f) => (
              <li key={f.expr}>
                <p className="font-mono text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{f.expr}</p>
                <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{f.note[L]}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] pt-1 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
            <span className="font-semibold">{T.withValues[L]}:</span> <span className="font-mono">{live}</span>
          </p>
        </section>
        <section className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-2">
          <h4 className="text-sm font-bold text-[#2E1A6E] dark:text-white">{T.principle[L]}</h4>
          <p className="text-sm leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">{def.principle[L]}</p>
        </section>
        <section className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-2">
          <h4 className="text-sm font-bold text-[#2E1A6E] dark:text-white">{T.observe[L]}</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[#22163F] dark:text-[#E4DDFA]">
            {def.observations.map((o, i) => (
              <li key={i}>{o[L]}</li>
            ))}
          </ul>
          <h4 className="text-sm font-bold text-[#2E1A6E] dark:text-white pt-2">{T.assume[L]}</h4>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
            {def.assumptions.map((o, i) => (
              <li key={i}>{o[L]}</li>
            ))}
          </ul>
        </section>
        <section className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#2E1A6E] dark:text-white">{T.quiz[L]}</h4>
            {Object.keys(answers).length > 0 && (
              <span className="text-xs font-semibold tabular-nums text-[#5B21B6] dark:text-[#C4B5FD]">
                {T.score[L]}: {score}/{def.quiz.length}
              </span>
            )}
          </div>
          {def.quiz.map((q, qi) => {
            const chosen = answers[qi];
            return (
              <fieldset key={qi} className="space-y-1.5">
                <legend className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF]">
                  {qi + 1}. {q.q[L]}
                </legend>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const done = chosen !== undefined;
                    const right = oi === q.correct;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={done}
                        onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className={`min-h-[40px] rounded-lg border px-2.5 py-1.5 text-left text-sm ${
                          !done
                            ? 'border-[#E7DDFB] dark:border-[#3B2C78] hover:border-[#6D28D9] text-[#2E1A6E] dark:text-[#F3EFFF]'
                            : right
                              ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A] text-[#5B21B6] dark:text-[#9FE3DA]'
                              : chosen === oi
                                ? 'border-[#B45309] bg-[#FDF0E1] dark:bg-[#3A2A14] text-[#7A2E0E] dark:text-[#F5B38A]'
                                : 'border-[#E7DDFB] dark:border-[#3B2C78] opacity-60 text-[#2E1A6E] dark:text-[#F3EFFF]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {done && right && <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />}
                          {done && chosen === oi && !right && <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                          {o[L]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <p role="status" className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                    {q.explain[L]}
                  </p>
                )}
              </fieldset>
            );
          })}
          {Object.keys(answers).length === def.quiz.length && (
            <button type="button" className={btn} onClick={() => setAnswers({})}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              {T.tryAgain[L]}
            </button>
          )}
        </section>
      </div>
    </section>
  );
};

export default ExperimentStation;
