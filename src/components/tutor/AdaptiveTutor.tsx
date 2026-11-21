/**
 * Smart Practice: diagnostic test → concept map → adaptive practice → spaced review,
 * with misconception detection on every answer. CBSE Class 10 Physics.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CalendarClock, ClipboardCheck, GraduationCap, Map as MapIcon, Target, Users } from 'lucide-react';
import { CHAPTERS, CONCEPTS, CONCEPT_BY_ID, MISCONCEPTION_BY_ID, SYLLABUS_LABEL } from '../../../shared/tutor/conceptGraph';
import {
  conceptStatus,
  dueConcepts,
  effectiveMastery,
  overallMastery,
  startDiagnostic,
  topMisconceptions,
  type AnswerMode,
} from '../../../shared/tutor/learnerModel';
import { getCachedAccount } from '../../lib/account';
import { getClassCode, resetLearner, setClassCode, tutorAiAvailable, useLearner } from '../../lib/learnerStore';
import type { Language } from '../../types/stem';
import { ConceptMap, type NodeView } from './ConceptMap';
import { TutorSession } from './TutorSession';
import { pct, relTime, STATUS_COLOR, tt, type TKey } from './tutorText';

type Tab = 'map' | 'diagnostic' | 'practice' | 'review' | 'class';

interface Props {
  language: Language;
  initialTab?: Tab;
  onOpenAccount?: () => void;
  onOpenTeacher?: () => void;
}

export const AdaptiveTutor: React.FC<Props> = ({ language, initialTab, onOpenAccount, onOpenTeacher }) => {
  const t = (k: TKey) => tt(k, language);
  const [learner, setLearner] = useLearner();
  const [tab, setTab] = useState<Tab>(initialTab ?? 'map');
  const [session, setSession] = useState<{ mode: AnswerMode; focus?: string; key: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ai, setAi] = useState(false);
  const [code, setCode] = useState(() => getClassCode());
  const [codeInput, setCodeInput] = useState('');
  const loggedIn = Boolean(getCachedAccount());

  useEffect(() => {
    void tutorAiAvailable().then(setAi);
  }, []);

  const now = Date.now();
  const diagnosticDone = Boolean(learner.diagnostic?.finishedAt);
  const due = useMemo(() => dueConcepts(learner, now), [learner]); // eslint-disable-line react-hooks/exhaustive-deps
  const nodes = useMemo(() => {
    const out: Record<string, NodeView> = {};
    for (const c of CONCEPTS) {
      const s = learner.concepts[c.id];
      const status = conceptStatus(s, now);
      out[c.id] = { status, value: status === 'unseen' ? null : effectiveMastery(s, now), inferred: s.attempts === 0 && s.inferred, due: due.includes(c.id) };
    }
    return out;
  }, [learner, due]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => {
    const vals = Object.values(nodes);
    return { mastered: vals.filter((n) => n.status === 'mastered').length, gaps: vals.filter((n) => n.status === 'gap').length };
  }, [nodes]);
  const answered = learner.history.length;
  const misTop = topMisconceptions(learner, 3);

  const begin = (mode: AnswerMode, focus?: string) => {
    if (mode === 'diagnostic') setLearner((prev) => startDiagnostic(prev));
    setSession({ mode, focus, key: Date.now() });
    setTab(mode === 'diagnostic' ? 'diagnostic' : mode === 'review' ? 'review' : 'practice');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'map', label: t('tabMap'), icon: <MapIcon className="w-4 h-4" aria-hidden="true" /> },
    { id: 'diagnostic', label: t('tabDiagnostic'), icon: <ClipboardCheck className="w-4 h-4" aria-hidden="true" /> },
    { id: 'practice', label: t('tabPractice'), icon: <Target className="w-4 h-4" aria-hidden="true" /> },
    { id: 'review', label: t('tabReview'), icon: <CalendarClock className="w-4 h-4" aria-hidden="true" />, badge: due.length },
    { id: 'class', label: t('tabClass'), icon: <Users className="w-4 h-4" aria-hidden="true" /> },
  ];

  const card = 'rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5';
  const name = (id: string) => CONCEPT_BY_ID[id].name[language] || CONCEPT_BY_ID[id].name.en;

  const sessionView = session && (
    <TutorSession
      key={session.key}
      mode={session.mode}
      focus={session.focus}
      language={language}
      learner={learner}
      setLearner={setLearner}
      aiAvailable={ai}
      onExit={() => {
        setSession(null);
        setTab('map');
      }}
    />
  );

  const sel = selected ? learner.concepts[selected] : null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-5" aria-labelledby="tutor-title">
      <header className="space-y-1">
        <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">{SYLLABUS_LABEL}</p>
        <h2 id="tutor-title" className="flex items-center gap-2 text-2xl sm:text-3xl font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
          <Brain className="w-7 h-7 text-[#6D28D9]" aria-hidden="true" /> {t('title')}
        </h2>
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-3xl">{t('subtitle')}</p>
        {language !== 'en' && <p className="text-xs text-[#B4430C] dark:text-[#FF9F1C]">{t('englishOnly')}</p>}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('overall'), value: answered ? pct(overallMastery(learner, now)) : '—', color: '#2E1A6E' },
          { label: t('mastered'), value: `${counts.mastered}/${CONCEPTS.length}`, color: STATUS_COLOR.mastered },
          { label: t('gaps'), value: String(counts.gaps), color: STATUS_COLOR.gap },
          { label: t('due'), value: String(due.length), color: '#7C3AED' },
        ].map((k) => (
          <div key={k.label} className={card}>
            <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{k.label}</p>
            <p className="mt-1 text-2xl font-mono font-semibold tabular-nums" style={{ color: k.color }}>
              <span className="dark:brightness-150">{k.value}</span>
            </p>
          </div>
        ))}
      </div>

      <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label={t('title')}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => {
              setTab(x.id);
              if (session && x.id !== tab) setSession(null);
            }}
            aria-current={tab === x.id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium min-h-[44px] border ${
              tab === x.id
                ? 'bg-[#2E1A6E] text-white border-[#2E1A6E] dark:bg-[#F5F0FF] dark:text-[#2E1A6E]'
                : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F5F0FF] bg-white dark:bg-[#1F1545]'
            }`}
          >
            {x.icon}
            {x.label}
            {!!x.badge && <span className="ml-0.5 rounded-full bg-[#7C3AED] text-white text-[11px] px-1.5">{x.badge}</span>}
          </button>
        ))}
      </nav>

      {tab === 'map' && (
        <div className="space-y-4">
          {!diagnosticDone && (
            <div className="rounded-2xl border-2 border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <p className="text-sm text-[#2E1A6E] dark:text-[#F5F0FF] max-w-2xl">{t('diagIntro')}</p>
              <button type="button" onClick={() => begin('diagnostic')} className="shrink-0 rounded-lg bg-[#6D28D9] text-white px-4 py-2.5 text-sm font-semibold min-h-[44px]">
                {t('startDiag')}
              </button>
            </div>
          )}

          <div className={card}>
            <div className="flex flex-wrap gap-3 text-xs mb-3 text-[#4A3F66] dark:text-[#C9BFEA]">
              {(['mastered', 'learning', 'gap', 'unseen'] as const).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm" style={{ background: STATUS_COLOR[s] }} /> {t(s)}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-5 rounded-sm border-2 border-dashed border-[#94A3B8]" /> {t('inferred')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7C3AED]" /> {t('due')}
              </span>
            </div>
            <ConceptMap language={language} nodes={nodes} selected={selected} onSelect={setSelected} />
          </div>

          {selected && sel && (
            <div className={`${card} space-y-2`} aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{name(selected)}</h3>
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{CONCEPT_BY_ID[selected].summary}</p>
                </div>
                <button type="button" onClick={() => begin('practice', selected)} className="rounded-lg bg-[#6D28D9] text-white px-4 py-2 text-sm font-semibold min-h-[44px]">
                  {t('practiseThis')}
                </button>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div><dt className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('masteryChange')}</dt><dd className="font-mono font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{nodes[selected].value === null ? '—' : pct(nodes[selected].value!)}</dd></div>
                <div><dt className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('attempts')}</dt><dd className="font-mono font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{sel.attempts}</dd></div>
                <div><dt className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('accuracy')}</dt><dd className="font-mono font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{sel.attempts ? `${sel.correct}/${sel.attempts}` : '—'}</dd></div>
                <div><dt className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('nextReview')}</dt><dd className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{sel.due ? relTime(sel.due, language) : '—'}</dd></div>
              </dl>
              {CONCEPT_BY_ID[selected].prereqs.length > 0 && (
                <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                  <span className="font-medium">{t('prereqs')}: </span>
                  {CONCEPT_BY_ID[selected].prereqs.map((p) => `${name(p)} (${nodes[p].value === null ? '—' : pct(nodes[p].value!)})`).join(', ')}
                </p>
              )}
              {Object.keys(sel.misconceptions).length > 0 && (
                <ul className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] list-disc pl-5">
                  {Object.entries(sel.misconceptions).map(([id, n]) => (
                    <li key={id}>
                      <span className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{MISCONCEPTION_BY_ID[id]?.label ?? id}</span> ×{n} — {MISCONCEPTION_BY_ID[id]?.fix}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {misTop.length > 0 && (
            <div className={card}>
              <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{t('topMis')}</h3>
              <ul className="mt-2 space-y-2">
                {misTop.map((m) => (
                  <li key={m.id} className="text-sm">
                    <span className="font-medium text-[#C2410C] dark:text-[#F5B38A]">{MISCONCEPTION_BY_ID[m.id]?.label}</span>
                    <span className="text-[#4A3F66] dark:text-[#C9BFEA]"> ×{m.count} — {MISCONCEPTION_BY_ID[m.id]?.fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accessible list view of the same data, grouped by chapter */}
          <details className={card}>
            <summary className="cursor-pointer font-semibold text-sm text-[#2E1A6E] dark:text-[#F5F0FF]">{t('tabMap')} — list</summary>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              {CHAPTERS.map((ch) => (
                <div key={ch.key}>
                  <p className="text-xs font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">{ch.ncert} · {ch.name[language] || ch.name.en}</p>
                  <ul className="mt-1 space-y-1">
                    {CONCEPTS.filter((c) => c.chapter === ch.key).map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <button type="button" onClick={() => setSelected(c.id)} className="text-left underline-offset-2 hover:underline text-[#2E1A6E] dark:text-[#F5F0FF]">{name(c.id)}</button>
                        <span className="font-mono text-xs" style={{ color: STATUS_COLOR[nodes[c.id].status] }}>
                          {nodes[c.id].value === null ? '—' : pct(nodes[c.id].value!)} · {t(nodes[c.id].status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>

          {answered > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t('resetConfirm'))) resetLearner();
              }}
              className="text-xs text-[#4A3F66] dark:text-[#B3A6DE] underline"
            >
              {t('reset')}
            </button>
          )}
        </div>
      )}

      {tab === 'diagnostic' &&
        (session?.mode === 'diagnostic' ? (
          sessionView
        ) : (
          <div className={`${card} space-y-3`}>
            <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('diagIntro')}</p>
            <button type="button" onClick={() => begin('diagnostic')} className="rounded-lg bg-[#6D28D9] text-white px-4 py-2.5 text-sm font-semibold min-h-[44px]">
              {diagnosticDone ? t('retakeDiag') : t('startDiag')}
            </button>
          </div>
        ))}

      {tab === 'practice' &&
        (session?.mode === 'practice' ? (
          sessionView
        ) : (
          <div className={`${card} space-y-3`}>
            <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('practiceIntro')}</p>
            <button type="button" onClick={() => begin('practice')} className="rounded-lg bg-[#6D28D9] text-white px-4 py-2.5 text-sm font-semibold min-h-[44px]">
              {t('tabPractice')} →
            </button>
          </div>
        ))}

      {tab === 'review' &&
        (session?.mode === 'review' ? (
          sessionView
        ) : (
          <div className={`${card} space-y-3`}>
            <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{t('schedule')}</h3>
            <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('srExplain')}</p>
            {answered === 0 ? (
              <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('nothingYet')}</p>
            ) : (
              <>
                {due.length > 0 ? (
                  <button type="button" onClick={() => begin('review')} className="rounded-lg bg-[#7C3AED] text-white px-4 py-2.5 text-sm font-semibold min-h-[44px]">
                    {t('startReview')} ({due.length})
                  </button>
                ) : (
                  <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                    {t('nothingDue')}{' '}
                    {relTime(Math.min(...CONCEPTS.map((c) => learner.concepts[c.id].due).filter((d) => d > 0)), language)}.
                  </p>
                )}
                <ul className="divide-y divide-[#E7DDFB] dark:divide-[#3B2C78]">
                  {CONCEPTS.filter((c) => learner.concepts[c.id].due > 0)
                    .sort((a, b) => learner.concepts[a.id].due - learner.concepts[b.id].due)
                    .map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-[#2E1A6E] dark:text-[#F5F0FF]">{name(c.id)}</span>
                        <span className={`text-xs font-medium ${due.includes(c.id) ? 'text-[#7C3AED]' : 'text-[#4A3F66] dark:text-[#C9BFEA]'}`}>
                          {relTime(learner.concepts[c.id].due, language)} · {pct(effectiveMastery(learner.concepts[c.id], now))}
                        </span>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        ))}

      {tab === 'class' && (
        <div className={`${card} space-y-3 max-w-xl`}>
          <h3 className="flex items-center gap-2 font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
            <GraduationCap className="w-5 h-5" aria-hidden="true" /> {t('joinTitle')}
          </h3>
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('joinBody')}</p>
          {code ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[#2E1A6E] dark:text-[#F5F0FF]">
                {t('joined')} <span className="font-mono font-semibold tracking-widest">{code}</span>
              </p>
              <button type="button" onClick={() => setCode(setClassCode(''))} className="rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-2 text-sm min-h-[44px] text-[#2E1A6E] dark:text-[#F5F0FF]">
                {t('leave')}
              </button>
            </div>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setCode(setClassCode(codeInput));
              }}
            >
              <label className="sr-only" htmlFor="class-code">{t('classCode')}</label>
              <input
                id="class-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder={t('classCode')}
                maxLength={12}
                autoComplete="off"
                className="flex-1 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFFDF8] dark:bg-[#170F36] px-3 py-2 font-mono tracking-widest text-[#2E1A6E] dark:text-[#F5F0FF] min-h-[44px]"
              />
              <button type="submit" disabled={codeInput.replace(/[^A-Z0-9]/gi, '').length < 4} className="rounded-lg bg-[#6D28D9] disabled:opacity-40 text-white px-4 text-sm font-semibold min-h-[44px]">
                {t('join')}
              </button>
            </form>
          )}
          {!loggedIn && (
            <p className="text-sm text-[#7A2E0E] dark:text-[#F5B38A]">
              {t('needLogin')}{' '}
              {onOpenAccount && (
                <button type="button" onClick={onOpenAccount} className="underline font-medium">
                  {t('logIn')}
                </button>
              )}
            </p>
          )}
          {onOpenTeacher && (
            <button type="button" onClick={onOpenTeacher} className="text-sm underline text-[#3B2C78] dark:text-[#B3A6DE]">
              {t('teacherLink')}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
