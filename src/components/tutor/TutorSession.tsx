/**
 * One question at a time for the diagnostic, practice and review modes.
 * Flow: choose → (optional reasoning) → check → if wrong and no reasoning, ask "why?"
 * → feedback (option misconception, reasoning diagnosis, mastery change) → next.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Brain, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { CONCEPT_BY_ID, MISCONCEPTION_BY_ID } from '../../../shared/tutor/conceptGraph';
import type { TutorQuestion } from '../../../shared/tutor/questionBank';
import {
  addReasoningMisconception,
  applyAnswer,
  detectMisconceptionOffline,
  DIAGNOSTIC_LENGTH,
  dueConcepts,
  effectiveMastery,
  finishDiagnostic,
  markDiagnosticAsked,
  nextDiagnosticConcept,
  pickConcept,
  pickQuestion,
  shuffledOrder,
  slipGuess,
  unseenCount,
  type AnswerMode,
  type LearnerState,
  type PracticePick,
} from '../../../shared/tutor/learnerModel';
import { markActiveToday } from '../../lib/engagement';
import { diagnoseReasoning, generateQuestion, questionPool, saveGenerated, type ReasoningDiagnosis } from '../../lib/learnerStore';
import type { Language } from '../../types/stem';
import { pct, tt, type TKey } from './tutorText';

interface Props {
  mode: AnswerMode;
  language: Language;
  learner: LearnerState;
  setLearner: (next: LearnerState | ((prev: LearnerState) => LearnerState)) => void;
  aiAvailable: boolean;
  /** Practice: concept the student asked for (may be redirected to a weak prerequisite). */
  focus?: string;
  onExit: () => void;
}

interface Current {
  q: TutorQuestion;
  order: number[];
  shownAt: number;
  pick?: PracticePick;
}

interface Result {
  correct: boolean;
  chosenOriginal: number;
  eventT: number;
  pBefore: number;
  pAfter: number;
  optionMisconception?: string;
}

type Diagnosis = { status: 'idle' } | { status: 'loading' } | { status: 'done'; data: ReasoningDiagnosis } | { status: 'error'; message: string };

const SESSION_LENGTH = 10;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Difficulty for an AI question so the predicted success is about 70% at this mastery. */
function targetDifficulty(mastery: number) {
  const { slip, guess } = slipGuess(0);
  const partial = clamp((0.7 - guess) / (1 - guess - slip), 0.05, 0.95);
  const ability = Math.log(clamp(mastery, 0.02, 0.98) / (1 - clamp(mastery, 0.02, 0.98)));
  return clamp(ability - Math.log(partial / (1 - partial)), -1.5, 1.5);
}

export const TutorSession: React.FC<Props> = ({ mode, language, learner, setLearner, aiAvailable, focus, onExit }) => {
  const t = (k: TKey) => tt(k, language);
  const [current, setCurrent] = useState<Current | null>(null);
  const [phase, setPhase] = useState<'answer' | 'why' | 'feedback' | 'done' | 'empty'>('answer');
  const [chosen, setChosen] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({ status: 'idle' });
  const [count, setCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const askedThisSession = useRef(new Set<string>());
  const learnerRef = useRef(learner);
  learnerRef.current = learner;
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const limit = mode === 'diagnostic' ? DIAGNOSTIC_LENGTH : SESSION_LENGTH;

  const show = useCallback((q: TutorQuestion, pick?: PracticePick) => {
    askedThisSession.current.add(q.id);
    setCurrent({ q, order: shuffledOrder(q, Date.now() & 0xffff), shownAt: Date.now(), pick });
    setPhase('answer');
    setChosen(null);
    setReasoning('');
    setResult(null);
    setDiagnosis({ status: 'idle' });
    setGenError('');
    setTimeout(() => headingRef.current?.focus(), 0);
  }, []);

  const loadAi = useCallback(
    async (conceptId: string, pick?: PracticePick) => {
      setGenerating(true);
      setGenError('');
      try {
        const s = learnerRef.current;
        const pool = questionPool().filter((q) => q.conceptId === conceptId);
        const q = await generateQuestion({
          conceptId,
          difficulty: targetDifficulty(effectiveMastery(s.concepts[conceptId])),
          language,
          avoid: pool.map((p) => p.stem).slice(-12),
        });
        saveGenerated(q);
        show(q, pick);
        return true;
      } catch (e) {
        setGenError(e instanceof Error ? e.message : String(e));
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [language, show]
  );

  const loadNext = useCallback(async () => {
    const s = learnerRef.current;
    const pool = questionPool();
    if (mode === 'diagnostic') {
      const cid = count < limit ? nextDiagnosticConcept(s) : null;
      if (!cid) {
        setLearner((prev) => finishDiagnostic(prev));
        setPhase('done');
        return;
      }
      // Medium-difficulty item: most informative when we know nothing yet.
      const q = pickQuestion(s, cid, pool, { target: 0.6, exclude: askedThisSession.current });
      if (!q) return;
      setLearner((prev) => markDiagnosticAsked(prev, cid));
      show(q);
      return;
    }
    if (count >= limit) {
      setPhase('done');
      return;
    }
    let pick: PracticePick;
    if (mode === 'review') {
      const due = dueConcepts(s);
      if (!due.length) {
        setPhase(count ? 'done' : 'empty');
        return;
      }
      pick = { conceptId: due[0], reason: 'review-due' };
    } else {
      pick = pickConcept(s, { focus: count === 0 ? focus : undefined });
    }
    const fresh = unseenCount(s, pick.conceptId, pool);
    if (fresh === 0 && aiAvailable && mode === 'practice') {
      const ok = await loadAi(pick.conceptId, pick);
      if (ok) return;
    }
    const q = pickQuestion(s, pick.conceptId, pool, { exclude: askedThisSession.current }) ?? pickQuestion(s, pick.conceptId, pool);
    if (q) show(q, pick);
  }, [aiAvailable, count, focus, limit, loadAi, mode, setLearner, show]);

  // first question
  useEffect(() => {
    void loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runDiagnosis = useCallback(
    async (text: string, res: Result, q: TutorQuestion) => {
      const trimmed = text.trim();
      if (trimmed.length < 3) return;
      const offline = () => {
        const hit = detectMisconceptionOffline(trimmed, q.conceptId);
        const data: ReasoningDiagnosis = hit
          ? { misconceptionId: hit.id, other: null, sound: false, confidence: 0.5, evidence: hit.cue, feedback: MISCONCEPTION_BY_ID[hit.id].fix, label: MISCONCEPTION_BY_ID[hit.id].label, source: 'offline' }
          : { misconceptionId: null, other: null, sound: false, confidence: 0, evidence: '', feedback: '', label: null, source: 'offline' };
        return data;
      };
      setDiagnosis({ status: 'loading' });
      let data: ReasoningDiagnosis;
      if (aiAvailable && navigator.onLine) {
        try {
          data = await diagnoseReasoning({
            conceptId: q.conceptId,
            question: { stem: q.stem, options: q.options, correctIndex: q.correctIndex },
            chosenIndex: res.chosenOriginal,
            reasoning: trimmed,
            language,
          });
        } catch {
          data = offline();
        }
      } else data = offline();
      if (data.misconceptionId && (data.source === 'offline' || data.confidence >= 0.5)) {
        setLearner((prev) => addReasoningMisconception(prev, res.eventT, data.misconceptionId!));
      }
      setDiagnosis({ status: 'done', data });
    },
    [aiAvailable, language, setLearner]
  );

  const submit = () => {
    if (!current || chosen === null) return;
    const q = current.q;
    const chosenOriginal = current.order[chosen];
    const correct = chosenOriginal === q.correctIndex;
    const optionMisconception = correct ? undefined : q.distractorMisconceptions[chosenOriginal];
    const { state, event } = applyAnswer(learnerRef.current, {
      question: q,
      correct,
      mode,
      optionMisconception,
      reasoning,
      ms: Date.now() - current.shownAt,
    });
    setLearner(state);
    learnerRef.current = state;
    markActiveToday();
    const res: Result = { correct, chosenOriginal, eventT: event.t, pBefore: event.pBefore, pAfter: event.pAfter, optionMisconception };
    setResult(res);
    setCount((c) => c + 1);
    if (mode === 'diagnostic') {
      // No feedback during the test (it would teach and bias later answers); still read the reasoning.
      if (reasoning.trim()) void runDiagnosis(reasoning, res, q);
      setPhase('feedback');
      return;
    }
    if (!correct && !reasoning.trim()) {
      setPhase('why');
      return;
    }
    setPhase('feedback');
    void runDiagnosis(reasoning, res, q);
  };

  const submitWhy = (skip: boolean) => {
    if (!current || !result) return;
    setPhase('feedback');
    if (!skip) void runDiagnosis(reasoning, result, current.q);
  };

  // In the diagnostic, move on automatically after a short pause.
  useEffect(() => {
    if (mode !== 'diagnostic' || phase !== 'feedback') return;
    const id = window.setTimeout(() => void loadNext(), 450);
    return () => window.clearTimeout(id);
  }, [loadNext, mode, phase]);

  const concept = current ? CONCEPT_BY_ID[current.q.conceptId] : null;
  const conceptName = (id: string) => CONCEPT_BY_ID[id]?.name[language] || CONCEPT_BY_ID[id]?.name.en || id;
  const progressLabel = useMemo(() => `${t('question')} ${Math.min(count + (phase === 'answer' || phase === 'why' ? 1 : 0), limit)} ${t('of')} ${limit}`, [count, phase, limit, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = 'rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-6';

  if (phase === 'empty') {
    return (
      <div className={card}>
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('nothingYet')}</p>
        <button type="button" onClick={onExit} className="mt-4 rounded-lg bg-[#2E1A6E] text-white px-4 py-2 text-sm font-medium min-h-[44px]">
          {t('finish')}
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className={card}>
        <h3 className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{mode === 'diagnostic' ? t('diagDone') : '✓'}</h3>
        {mode === 'diagnostic' && <p className="mt-2 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('diagDoneBody')}</p>}
        <button type="button" onClick={onExit} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] text-white px-4 py-2 text-sm font-medium min-h-[44px]">
          {t('finish')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (generating || (!current && genError)) {
    return (
      <div className={card} role="status" aria-live="polite">
        {generating ? (
          <p className="flex items-start gap-3 text-sm text-[#2E1A6E] dark:text-[#F5F0FF]">
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#6D28D9]" aria-hidden="true" />
            {t('generating')}
          </p>
        ) : (
          <p className="text-sm text-[#7A2E0E] dark:text-[#F5B38A]">{genError}</p>
        )}
      </div>
    );
  }

  if (!current || !concept) {
    return (
      <div className={card}>
        <Loader2 className="w-5 h-5 animate-spin text-[#6D28D9]" aria-label="Loading" />
      </div>
    );
  }

  const q = current.q;
  const letter = (displayIdx: number) => String.fromCharCode(65 + displayIdx);
  const displayOf = (original: number) => current.order.indexOf(original);
  const reasonText = current.pick
    ? current.pick.reason === 'review-due'
      ? t('why_review')
      : current.pick.reason === 'misconception'
        ? t('why_misconception')
        : current.pick.reason === 'new'
          ? t('why_new')
          : current.pick.reason === 'stretch'
            ? t('why_stretch')
            : t('why_weak')
    : null;
  const showFeedback = phase === 'feedback' && mode !== 'diagnostic' && result;
  const optionMis = result?.optionMisconception ? MISCONCEPTION_BY_ID[result.optionMisconception] : null;

  return (
    <div className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium text-[#4A3F66] dark:text-[#C9BFEA]">{progressLabel}</span>
        <button type="button" onClick={onExit} className="rounded-md border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 min-h-[36px] text-[#2E1A6E] dark:text-[#F5F0FF]">
          {t('stop')}
        </button>
      </div>
      <div className="h-1.5 rounded-full bg-[#F5F0FF] dark:bg-[#2A1D5C] overflow-hidden" aria-hidden="true">
        <div className="h-full bg-[#6D28D9] transition-all" style={{ width: `${(100 * count) / limit}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-[#2E1A6E] text-white px-2 py-1 font-medium">{conceptName(q.conceptId)}</span>
        {q.source === 'ai' && (
          <span className="inline-flex items-center gap-1 rounded-md border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-2 py-1 text-[#5B21B6] dark:text-[#C4B5FD]">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> {t('aiQuestion')}
          </span>
        )}
        {mode !== 'diagnostic' && reasonText && (
          <span className="text-[#4A3F66] dark:text-[#C9BFEA]">
            {current.pick?.redirectedFrom ? `${conceptName(q.conceptId)} ${t('redirected')} ${conceptName(current.pick.redirectedFrom)}` : reasonText}
          </span>
        )}
      </div>

      <h3 ref={headingRef} tabIndex={-1} className="text-base sm:text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] leading-snug outline-none">
        {q.stem}
      </h3>

      <div role="radiogroup" aria-label={q.stem} className="grid gap-2">
        {current.order.map((original, displayIdx) => {
          const active = chosen === displayIdx;
          const locked = phase !== 'answer';
          const isCorrect = original === q.correctIndex;
          let tone = 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545]';
          if (active && !locked) tone = 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A]';
          if (showFeedback && isCorrect) tone = 'border-[#12A150] bg-[#E7F8EE] dark:bg-[#123B27]';
          if (showFeedback && active && !isCorrect) tone = 'border-[#E5484D] bg-[#FDECEC] dark:bg-[#3D1A22]';
          if (locked && active && !showFeedback) tone = 'border-[#2E1A6E] dark:border-[#F5F0FF] bg-[#F5F0FF] dark:bg-[#2A1D5C]';
          return (
            <button
              key={original}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={locked}
              onClick={() => setChosen(displayIdx)}
              className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm min-h-[48px] transition-colors ${tone} text-[#2E1A6E] dark:text-[#F5F0FF]`}
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">{letter(displayIdx)}</span>
              <span>{q.options[original]}</span>
            </button>
          );
        })}
      </div>

      {phase === 'answer' && (
        <>
          <label className="block text-sm">
            <span className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{t('reasoningLabel')}</span>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={2}
              maxLength={600}
              placeholder={t('reasoningPh')}
              className="mt-1.5 w-full rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFFDF8] dark:bg-[#170F36] px-3 py-2 text-sm text-[#2E1A6E] dark:text-[#F5F0FF]"
            />
          </label>
          <button
            type="button"
            disabled={chosen === null}
            onClick={submit}
            className="w-full sm:w-auto rounded-lg bg-[#6D28D9] disabled:opacity-40 text-white px-5 py-2.5 text-sm font-semibold min-h-[44px]"
          >
            {t('submit')}
          </button>
        </>
      )}

      {phase === 'why' && (
        <div className="rounded-xl border border-[#D69E2E] bg-[#FFF7E6] dark:bg-[#3A2F14] p-4 space-y-2">
          <p className="font-semibold text-sm text-[#7A4A00] dark:text-[#FF9F1C]">{t('whyTitle')}</p>
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('whyBody')}</p>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={2}
            maxLength={600}
            autoFocus
            placeholder={t('reasoningPh')}
            aria-label={t('whyTitle')}
            className="w-full rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#170F36] px-3 py-2 text-sm text-[#2E1A6E] dark:text-[#F5F0FF]"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={reasoning.trim().length < 3} onClick={() => submitWhy(false)} className="rounded-lg bg-[#2E1A6E] disabled:opacity-40 text-white px-4 py-2 text-sm font-medium min-h-[44px]">
              {t('checkReasoning')}
            </button>
            <button type="button" onClick={() => submitWhy(true)} className="rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-sm min-h-[44px] text-[#2E1A6E] dark:text-[#F5F0FF]">
              {t('skip')}
            </button>
          </div>
        </div>
      )}

      {showFeedback && result && (
        <div className="space-y-3" aria-live="polite">
          <div className={`rounded-xl p-4 ${result.correct ? 'bg-[#E7F8EE] dark:bg-[#123B27]' : 'bg-[#FDECEC] dark:bg-[#3D1A22]'}`}>
            <p className="flex items-center gap-2 font-semibold text-sm text-[#2E1A6E] dark:text-[#F5F0FF]">
              {result.correct ? <CheckCircle2 className="w-5 h-5 text-[#12A150]" aria-hidden="true" /> : <XCircle className="w-5 h-5 text-[#E5484D]" aria-hidden="true" />}
              {result.correct ? t('correct') : `${t('wrong')} · ${t('answerIs')}: ${letter(displayOf(q.correctIndex))}`}
            </p>
            <p className="mt-1.5 text-sm text-[#4A3F66] dark:text-[#D6E2EC]">{q.explanation}</p>
          </div>

          {optionMis && (
            <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#B4430C] dark:text-[#FF9F1C]">{t('fromOption')}</p>
              <p className="mt-1 text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{optionMis.label}</p>
              <p className="mt-1 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{optionMis.fix}</p>
            </div>
          )}

          {diagnosis.status !== 'idle' && (
            <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#3B2C78] dark:text-[#B3A6DE]">
                <Brain className="w-4 h-4" aria-hidden="true" /> {t('fromReasoning')}
              </p>
              {diagnosis.status === 'loading' && (
                <p className="mt-2 flex items-center gap-2 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('checking')}
                </p>
              )}
              {diagnosis.status === 'done' && <DiagnosisView d={diagnosis.data} language={language} />}
            </div>
          )}

          <MasteryChange name={conceptName(q.conceptId)} before={result.pBefore} after={result.pAfter} label={t('masteryChange')} />

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadNext()} className="inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] text-white px-5 py-2.5 text-sm font-semibold min-h-[44px]">
              {t('next')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            {aiAvailable && mode === 'practice' && (
              <button
                type="button"
                onClick={() => void loadAi(q.conceptId, { conceptId: q.conceptId, reason: 'weak' })}
                className="inline-flex items-center gap-2 rounded-lg border border-[#7C3AED]/40 px-4 py-2.5 text-sm min-h-[44px] text-[#5B21B6] dark:text-[#C4B5FD]"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" /> {t('newAi')}
              </button>
            )}
          </div>
          {genError && <p className="text-xs text-[#7A2E0E] dark:text-[#F5B38A]">{genError}</p>}
        </div>
      )}
    </div>
  );
};

const DiagnosisView: React.FC<{ d: ReasoningDiagnosis; language: Language }> = ({ d, language }) => {
  const t = (k: TKey) => tt(k, language);
  const mis = d.misconceptionId ? MISCONCEPTION_BY_ID[d.misconceptionId] : null;
  if (d.source === 'offline' && !mis) return <p className="mt-2 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('noMatch')}</p>;
  return (
    <div className="mt-2 space-y-1.5 text-sm">
      {d.sound && <p className="font-medium text-[#6D28D9] dark:text-[#C4B5FD]">{t('soundReasoning')}</p>}
      {mis && <p className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{mis.label}</p>}
      {d.other && <p className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{d.other}</p>}
      {d.evidence && <p className="text-[#4A3F66] dark:text-[#C9BFEA] italic">“{d.evidence}”</p>}
      {d.feedback && <p className="text-[#4A3F66] dark:text-[#D6E2EC]">{d.feedback}</p>}
      {d.source === 'offline' && <p className="text-xs text-[#4A3F66] dark:text-[#B3A6DE]">{t('offlineMatch')}</p>}
    </div>
  );
};

export const MasteryChange: React.FC<{ name: string; before: number; after: number; label: string }> = ({ name, before, after, label }) => {
  const up = after >= before;
  return (
    <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
      <div className="flex items-center justify-between text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
        <span>
          {label}: {name}
        </span>
        <span className={`font-mono font-semibold ${up ? 'text-[#0E8A43] dark:text-[#6EE7A0]' : 'text-[#D13438] dark:text-[#FDA4A6]'}`}>
          {pct(before)} → {pct(after)}
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-white dark:bg-[#170F36] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 bg-[#94A3B8]/50" style={{ width: pct(Math.max(before, after)) }} />
        <div className={`absolute inset-y-0 left-0 transition-all duration-700 ${up ? 'bg-[#12A150]' : 'bg-[#E5484D]'}`} style={{ width: pct(after) }} />
      </div>
    </div>
  );
};
