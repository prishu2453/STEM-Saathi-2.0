import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { Language } from '../types/stem';
import { defaults, INK, PAPER, type GraphSpec, type Params, type SimDef } from './simTypes';

const T = {
  play: { en: 'Play', hi: 'चलाएँ', kn: 'ಪ್ಲೇ' },
  pause: { en: 'Pause', hi: 'रोकें', kn: 'ನಿಲ್ಲಿಸಿ' },
  reset: { en: 'Reset', hi: 'रीसेट', kn: 'ರೀಸೆಟ್' },
  speed: { en: 'Speed', hi: 'गति', kn: 'ವೇಗ' },
  live: { en: 'Live readings', hi: 'लाइव माप', kn: 'ಲೈವ್ ಅಳತೆಗಳು' },
  tryIt: { en: 'Change the settings and watch', hi: 'सेटिंग बदलें और देखें', kn: 'ಸೆಟ್ಟಿಂಗ್ ಬದಲಿಸಿ ನೋಡಿ' },
  what: { en: 'What is happening?', hi: 'क्या हो रहा है?', kn: 'ಏನು ನಡೆಯುತ್ತಿದೆ?' },
  why: { en: 'Why is it happening?', hi: 'ऐसा क्यों हो रहा है?', kn: 'ಇದು ಏಕೆ ನಡೆಯುತ್ತಿದೆ?' },
  principle: { en: 'Physics principle', hi: 'भौतिकी का सिद्धांत', kn: 'ಭೌತಶಾಸ್ತ್ರ ತತ್ವ' },
  formula: { en: 'Formula used', hi: 'प्रयुक्त सूत्र', kn: 'ಬಳಸಿದ ಸೂತ್ರ' },
  whatIf: { en: 'What if you change something?', hi: 'कुछ बदलने पर क्या होगा?', kn: 'ಏನಾದರೂ ಬದಲಿಸಿದರೆ ಏನಾಗುತ್ತದೆ?' },
};

function drawGraph(c: CanvasRenderingContext2D, g: GraphSpec, hist: number[][], w: number, h: number, xMax?: number) {
  c.fillStyle = PAPER;
  c.fillRect(0, 0, w, h);
  const L = 44, R = 10, Tp = 14, B = 30;
  const pw = w - L - R, ph = h - Tp - B;
  let xm = xMax ?? 0, ymin = Infinity, ymax = -Infinity;
  for (const row of hist) {
    if (xMax == null) xm = Math.max(xm, row[0]);
    for (const s of g.series) {
      ymin = Math.min(ymin, row[s.idx]);
      ymax = Math.max(ymax, row[s.idx]);
    }
  }
  if (!isFinite(ymin)) {
    ymin = 0;
    ymax = 1;
  }
  if (ymax - ymin < 1e-9) {
    ymax += 1;
    ymin -= 1;
  }
  ymin = Math.min(ymin, 0);
  ymax = Math.max(ymax, 0);
  const pad = (ymax - ymin) * 0.08;
  ymin -= pad;
  ymax += pad;
  xm = Math.max(xm, 1e-6);
  const X = (x: number) => L + (x / xm) * pw;
  const Y = (y: number) => Tp + ph - ((y - ymin) / (ymax - ymin)) * ph;
  c.strokeStyle = '#D8D0B8';
  c.lineWidth = 1;
  c.font = '11px system-ui, sans-serif';
  c.fillStyle = '#4A3F66';
  for (let i = 0; i <= 4; i++) {
    const yv = ymin + ((ymax - ymin) * i) / 4;
    c.beginPath();
    c.moveTo(L, Y(yv));
    c.lineTo(L + pw, Y(yv));
    c.stroke();
    c.textAlign = 'right';
    c.fillText(Math.abs(yv) >= 100 ? yv.toFixed(0) : yv.toFixed(1), L - 4, Y(yv) + 4);
  }
  for (let i = 0; i <= 4; i++) {
    const xv = (xm * i) / 4;
    c.textAlign = 'center';
    c.fillText(xv.toFixed(xm < 10 ? 1 : 0), X(xv), h - 16);
  }
  c.strokeStyle = INK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(L, Tp);
  c.lineTo(L, Tp + ph);
  c.lineTo(L + pw, Tp + ph);
  c.stroke();
  if (ymin < 0 && ymax > 0) {
    c.strokeStyle = '#9AA5AB';
    c.beginPath();
    c.moveTo(L, Y(0));
    c.lineTo(L + pw, Y(0));
    c.stroke();
  }
  c.textAlign = 'center';
  c.fillStyle = INK;
  c.fillText(g.xLabel, L + pw / 2, h - 3);
  g.series.forEach((s, k) => {
    c.strokeStyle = s.color;
    c.lineWidth = 2.2;
    c.beginPath();
    hist.forEach((row, i) => (i === 0 ? c.moveTo(X(row[0]), Y(row[s.idx])) : c.lineTo(X(row[0]), Y(row[s.idx]))));
    c.stroke();
    c.fillStyle = s.color;
    c.textAlign = 'left';
    c.fillText(`— ${s.label}`, L + 8 + k * 110, Tp + 12);
  });
  c.save();
  c.translate(11, Tp + ph / 2);
  c.rotate(-Math.PI / 2);
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.fillText(g.yLabel, 0, 0);
  c.restore();
}

interface Props {
  def: SimDef;
  language: Language;
}

export const LabSimulation: React.FC<Props> = ({ def, language }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [params, setParams] = useState<Params>(() => defaults(def.params));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [readings, setReadings] = useState<{ label: string; value: string }[]>([]);
  const paramsRef = useRef(params);
  const runRef = useRef(running);
  const speedRef = useRef(speed);
  const stateRef = useRef<any>(null);
  const sizeRef = useRef({ w: 300, h: def.height ?? 280, gh: 170 });
  paramsRef.current = params;
  runRef.current = running;
  speedRef.current = speed;

  const reset = useCallback(() => {
    stateRef.current = def.init(paramsRef.current);
  }, [def]);

  // (re)start when the simulation changes
  useEffect(() => {
    setParams(defaults(def.params));
    paramsRef.current = defaults(def.params);
    reset();
    setRunning(true);
    setSpeed(1);
  }, [def, reset]);

  // canvas sizing
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () => {
      const w = Math.max(240, wrap.clientWidth);
      const h = def.height ?? 280;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = { w, h, gh: 170 };
      for (const [cv, ch] of [
        [canvasRef.current, h],
        [graphRef.current, 170],
      ] as const) {
        if (!cv) continue;
        cv.width = w * dpr;
        cv.height = ch * dpr;
        cv.style.width = `${w}px`;
        cv.style.height = `${ch}px`;
        cv.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [def]);

  // animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = stateRef.current;
      if (s) {
        if (runRef.current && def.animated) {
          const t = dt * speedRef.current;
          const n = Math.max(1, Math.ceil(t / (1 / 240)));
          for (let i = 0; i < n; i++) def.step(s, paramsRef.current, t / n);
        }
        const c = canvasRef.current?.getContext('2d');
        if (c) {
          c.fillStyle = PAPER;
          c.fillRect(0, 0, sizeRef.current.w, sizeRef.current.h);
          def.draw(c, s, paramsRef.current, sizeRef.current.w, sizeRef.current.h);
        }
        const gc = graphRef.current?.getContext('2d');
        if (gc && def.graph && s.hist) {
          drawGraph(gc, def.graph, s.hist, sizeRef.current.w, sizeRef.current.gh, def.graph.xMax?.(s, paramsRef.current));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const iv = window.setInterval(() => {
      const s = stateRef.current;
      if (s) setReadings(def.readings(s, paramsRef.current).map((r) => ({ label: r.label[language], value: r.value })));
    }, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [def, language]);

  const onParam = (key: string, value: number, live?: boolean) => {
    const next = { ...paramsRef.current, [key]: value };
    paramsRef.current = next;
    setParams(next);
    if (!live) stateRef.current = def.init(next);
  };

  const btn =
    'min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] cursor-pointer hover:border-[#6D28D9]';

  return (
    <div className="space-y-4" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${def.title[language]}. ${def.what[language]}`}
        className="block w-full rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]"
      />
      <div className="flex flex-wrap items-center gap-2">
        {def.animated && (
          <>
            <button type="button" className={btn} onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
              {running ? T.pause[language] : T.play[language]}
            </button>
            <label className={btn}>
              {T.speed[language]}
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-transparent cursor-pointer">
                {[0.25, 0.5, 1, 2].map((v) => (
                  <option key={v} value={v}>
                    {v}×
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="button"
          className={btn}
          onClick={() => {
            reset();
            setRunning(true);
          }}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          {T.reset[language]}
        </button>
      </div>

      {def.graph && <canvas ref={graphRef} role="img" aria-label="Graph" className="block w-full rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]" />}

      <p className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{T.tryIt[language]}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {def.params.map((q) => (
          <label key={q.key} className="block text-sm text-[#22163F] dark:text-[#F3EFFF]">
            <span className="font-semibold">
              {q.label[language]}
              {!q.choices && `: ${params[q.key]} ${q.unit}`}
            </span>
            {q.choices ? (
              <select
                value={params[q.key]}
                onChange={(e) => onParam(q.key, Number(e.target.value), q.live)}
                className="mt-1 block w-full min-h-[44px] rounded-lg border border-[#B6A6E0] bg-white dark:bg-[#2A1D5C] px-2"
              >
                {q.choices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label[language]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="range"
                min={q.min}
                max={q.max}
                step={q.step}
                value={params[q.key]}
                onChange={(e) => onParam(q.key, Number(e.target.value), q.live)}
                className="mt-1 block w-full h-8 accent-[#6D28D9]"
              />
            )}
          </label>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white mb-2">{T.live[language]}</p>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {readings.map((r) => (
            <div key={r.label} className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
              <div className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{r.label}</div>
              <div className="text-base font-semibold tabular-nums text-[#2E1A6E] dark:text-white">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 text-sm text-[#22163F] dark:text-[#E4DDFA]">
        <p><strong>{T.what[language]}</strong> {def.what[language]}</p>
        <p><strong>{T.why[language]}</strong> {def.why[language]}</p>
        <p><strong>{T.principle[language]}:</strong> {def.principle[language]}</p>
        <p><strong>{T.formula[language]}:</strong> <span className="font-mono">{def.formula}</span></p>
        <div>
          <strong>{T.whatIf[language]}</strong>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            {def.whatIf.map((w, i) => (
              <li key={i}>{w[language]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
