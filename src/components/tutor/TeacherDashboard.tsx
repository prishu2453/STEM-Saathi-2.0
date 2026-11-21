/**
 * Teacher dashboard: class-wide concept gaps, common misconceptions, root causes
 * in the concept graph, and the students who need help — from real students who
 * joined with the teacher's class code, or a clearly labelled simulated class.
 */
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Copy, FlaskConical, Loader2, RefreshCw, Users } from 'lucide-react';
import { CHAPTERS, CONCEPTS, CONCEPT_BY_ID, MISCONCEPTION_BY_ID, SYLLABUS_LABEL } from '../../../shared/tutor/conceptGraph';
import { aggregateClass, simulateClass, type ClassReport } from '../../../shared/tutor/classAnalytics';
import { GAP, MASTERED } from '../../../shared/tutor/learnerModel';
import { getCachedAccount } from '../../lib/account';
import { fetchClassReport } from '../../lib/learnerStore';
import type { Language } from '../../types/stem';
import { ConceptMap, type NodeView } from './ConceptMap';
import { pct, STATUS_COLOR } from './tutorText';

interface Props {
  language: Language;
  onOpenAccount?: () => void;
}

type Source = { kind: 'real'; classCode: string } | { kind: 'demo' };

const cellColor = (m: number | null) => (m === null ? 'transparent' : m >= MASTERED ? STATUS_COLOR.mastered : m < GAP ? STATUS_COLOR.gap : STATUS_COLOR.learning);

export const TeacherDashboard: React.FC<Props> = ({ language, onOpenAccount }) => {
  const [report, setReport] = useState<ClassReport | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const account = getCachedAccount();
  const name = (id: string) => CONCEPT_BY_ID[id].name[language] || CONCEPT_BY_ID[id].name.en;

  const loadReal = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetchClassReport();
      setReport(r.report);
      setSource({ kind: 'real', classCode: r.classCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };
  const loadDemo = () => {
    setReport(aggregateClass(simulateClass(7)));
    setSource({ kind: 'demo' });
    setError('');
  };

  const nodes = useMemo(() => {
    const out: Record<string, NodeView> = {};
    if (!report) return out;
    for (const r of report.concepts) {
      out[r.conceptId] = r.assessed
        ? { status: r.avgMastery >= MASTERED ? 'mastered' : r.gapCount / r.assessed >= 0.4 ? 'gap' : 'learning', value: r.avgMastery }
        : { status: 'unseen', value: null };
    }
    return out;
  }, [report]);
  const rowById = useMemo(() => Object.fromEntries((report?.concepts ?? []).map((r) => [r.conceptId, r])), [report]);

  const card = 'rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5';
  const btn = 'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold min-h-[44px]';

  const assessedRows = report?.concepts.filter((r) => r.assessed > 0) ?? [];
  const avg = assessedRows.length ? assessedRows.reduce((a, r) => a + r.avgMastery, 0) / assessedRows.length : 0;
  const sortedGaps = [...assessedRows].sort((a, b) => b.gapCount / b.assessed - a.gapCount / a.assessed);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-5" aria-labelledby="teacher-title">
      <header className="space-y-1">
        <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">{SYLLABUS_LABEL}</p>
        <h2 id="teacher-title" className="flex items-center gap-2 text-2xl sm:text-3xl font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
          <Users className="w-7 h-7 text-[#6D28D9]" aria-hidden="true" /> Teacher dashboard: class-wide gaps
        </h2>
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-3xl">
          See which concepts your class has not understood, the wrong ideas behind their answers, where the gap really starts in the concept map, and who needs help first.
        </p>
      </header>

      <div className={`${card} flex flex-col lg:flex-row gap-4 lg:items-center justify-between`}>
        <div className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-2xl space-y-1">
          {account ? (
            <p>
              Logged in as <span className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{account.profile.fullName || account.username}</span>. Load your class to get your class code, then ask students to enter it under{' '}
              <span className="font-medium">Smart Practice → Join class</span> while logged in to their own accounts.
            </p>
          ) : (
            <p>
              Log in with a teacher account to see your real class.{' '}
              {onOpenAccount && (
                <button type="button" onClick={onOpenAccount} className="underline font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">
                  Log in or create an account
                </button>
              )}
            </p>
          )}
          <p className="text-xs">Or explore with a simulated class of 28 students whose answers are produced by the same engine.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {account && (
            <button type="button" onClick={() => void loadReal()} disabled={loading} className={`${btn} bg-[#6D28D9] text-white disabled:opacity-50`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
              {source?.kind === 'real' ? 'Refresh my class' : 'Load my class'}
            </button>
          )}
          <button type="button" onClick={loadDemo} className={`${btn} border border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F5F0FF]`}>
            <FlaskConical className="w-4 h-4" aria-hidden="true" /> Simulated demo class
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-[#B45309] bg-[#FDF0E1] dark:bg-[#3A2A14] px-3.5 py-2.5 text-sm text-[#7A2E0E] dark:text-[#F5B38A]">
          {error}
        </p>
      )}

      {source?.kind === 'real' && (
        <div className={`${card} flex flex-wrap items-center gap-3`}>
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">Your class code</p>
          <p className="font-mono text-2xl font-semibold tracking-[0.3em] text-[#2E1A6E] dark:text-[#F5F0FF]">{source.classCode}</p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(source.classCode).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-2 text-sm min-h-[40px] text-[#2E1A6E] dark:text-[#F5F0FF]"
          >
            <Copy className="w-4 h-4" aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
          </button>
          <p className="text-xs text-[#4A3F66] dark:text-[#B3A6DE] w-full">Student progress reaches you after their app syncs (about every 15 seconds while they are online).</p>
        </div>
      )}

      {source?.kind === 'demo' && (
        <p className="rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3.5 py-2.5 text-sm text-[#5B21B6] dark:text-[#C4B5FD]">
          Simulated class: 28 made-up students with hidden knowledge levels and planted misconceptions answered real bank questions. The dashboard only sees their answers, as with real students.
        </p>
      )}

      {report && report.activeStudents === 0 && (
        <div className={card}>
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
            {report.studentCount === 0 ? 'No students have joined with your class code yet.' : 'Students have joined, but none has answered a question yet.'}
          </p>
        </div>
      )}

      {report && report.activeStudents > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Active students', value: `${report.activeStudents}/${report.studentCount}` },
              { label: 'Average mastery', value: pct(avg) },
              { label: 'Concepts with ≥30% gaps', value: String(assessedRows.filter((r) => r.gapCount / r.assessed >= 0.3).length) },
              { label: 'Common misconceptions', value: String(report.misconceptions.filter((m) => m.students >= 3).length) },
            ].map((k) => (
              <div key={k.label} className={card}>
                <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{k.label}</p>
                <p className="mt-1 text-2xl font-mono font-semibold tabular-nums text-[#2E1A6E] dark:text-[#F5F0FF]">{k.value}</p>
              </div>
            ))}
          </div>

          {report.actions.length > 0 && (
            <div className={`${card} border-l-4 border-l-[#C2410C]`}>
              <h3 className="flex items-center gap-2 font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                <AlertTriangle className="w-5 h-5 text-[#C2410C]" aria-hidden="true" /> What to re-teach first
              </h3>
              <ol className="mt-2 space-y-2 list-decimal pl-5 text-sm text-[#4A3F66] dark:text-[#D6E2EC]">
                {report.actions.map((a) => (
                  <li key={a.conceptId}>{a.text}</li>
                ))}
              </ol>
            </div>
          )}

          <div className={card}>
            <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">Class concept map</h3>
            <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] mb-2">Average mastery per concept; the red caption counts students with a gap. Select a concept for details.</p>
            <ConceptMap
              language={language}
              nodes={nodes}
              selected={selected}
              onSelect={setSelected}
              caption={(id) => {
                const r = rowById[id];
                return r && r.gapCount ? `${r.gapCount} of ${r.assessed} with a gap` : null;
              }}
            />
            {selected && rowById[selected] && (
              <div className="mt-3 rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 text-sm text-[#2E1A6E] dark:text-[#F5F0FF] space-y-1" aria-live="polite">
                <p className="font-semibold">{name(selected)}</p>
                <p>
                  {rowById[selected].assessed} students answered · average {pct(rowById[selected].avgMastery)} · {rowById[selected].gapCount} gaps · {rowById[selected].masteredCount} mastered
                  {rowById[selected].accuracy !== null && ` · ${pct(rowById[selected].accuracy!)} of answers correct`}
                </p>
                {rowById[selected].rootCause && (
                  <p>
                    Root cause for {rowById[selected].rootCause!.students} struggling students: <span className="font-medium">{name(rowById[selected].rootCause!.conceptId)}</span>
                  </p>
                )}
                <p className="text-xs">
                  Students with a gap:{' '}
                  {report.students.filter((s) => (s.mastery[selected] ?? 1) < GAP).map((s) => s.name).join(', ') || 'none'}
                </p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">Biggest gaps</h3>
              <ul className="mt-3 space-y-2.5">
                {sortedGaps.slice(0, 10).map((r) => {
                  const learning = r.assessed - r.gapCount - r.masteredCount;
                  return (
                    <li key={r.conceptId}>
                      <div className="flex justify-between gap-2 text-xs text-[#2E1A6E] dark:text-[#F5F0FF]">
                        <span>{name(r.conceptId)}</span>
                        <span className="font-mono">
                          {r.gapCount}/{r.assessed} gap
                        </span>
                      </div>
                      <div className="mt-1 flex h-2.5 rounded-full overflow-hidden bg-[#E7DDFB] dark:bg-[#3B2C78]" role="img" aria-label={`${r.gapCount} gap, ${learning} learning, ${r.masteredCount} mastered`}>
                        <div style={{ width: `${(100 * r.gapCount) / r.assessed}%`, background: STATUS_COLOR.gap }} />
                        <div style={{ width: `${(100 * learning) / r.assessed}%`, background: STATUS_COLOR.learning }} />
                        <div style={{ width: `${(100 * r.masteredCount) / r.assessed}%`, background: STATUS_COLOR.mastered }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={card}>
              <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">Common misconceptions</h3>
              <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Found from the wrong options students chose and from the reasoning they wrote.</p>
              <ul className="mt-3 space-y-3">
                {report.misconceptions.slice(0, 7).map((m) => (
                  <li key={m.id} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-[#2E1A6E] dark:text-[#F5F0FF]">{MISCONCEPTION_BY_ID[m.id]?.label ?? m.id}</span>
                      <span className="shrink-0 font-mono text-xs text-[#C2410C] dark:text-[#F5B38A]">{m.students} students</span>
                    </div>
                    <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                      In: {m.conceptIds.map(name).join(', ')}. Teach: {MISCONCEPTION_BY_ID[m.id]?.fix}
                    </p>
                  </li>
                ))}
                {report.misconceptions.length === 0 && <li className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">None detected yet.</li>}
              </ul>
            </div>
          </div>

          <div className={card}>
            <h3 className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">Student × concept heatmap</h3>
            <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Weakest students first. Empty cells: not answered yet.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="border-separate border-spacing-0.5 text-xs">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 bg-white dark:bg-[#1F1545] text-left font-medium pr-2 text-[#4A3F66] dark:text-[#C9BFEA]">
                      Student
                    </th>
                    <th scope="col" className="px-1 font-medium text-[#4A3F66] dark:text-[#C9BFEA]">All</th>
                    {CHAPTERS.flatMap((ch) =>
                      CONCEPTS.filter((c) => c.chapter === ch.key).map((c) => (
                        <th key={c.id} scope="col" title={name(c.id)} className="h-24 w-5 align-bottom font-normal text-[#4A3F66] dark:text-[#C9BFEA]">
                          <span className="block w-5 whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate max-h-24">{name(c.id)}</span>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" className="sticky left-0 bg-white dark:bg-[#1F1545] text-left font-normal pr-2 whitespace-nowrap text-[#2E1A6E] dark:text-[#F5F0FF]">
                        {s.name}
                        {s.topMisconception && <span className="block text-[10px] text-[#C2410C] dark:text-[#F5B38A]">{MISCONCEPTION_BY_ID[s.topMisconception]?.label}</span>}
                      </th>
                      <td className="px-1 font-mono text-[#2E1A6E] dark:text-[#F5F0FF]">{pct(s.overall)}</td>
                      {CHAPTERS.flatMap((ch) =>
                        CONCEPTS.filter((c) => c.chapter === ch.key).map((c) => {
                          const m = s.mastery[c.id];
                          return (
                            <td
                              key={c.id}
                              title={`${s.name} · ${name(c.id)}: ${m === null ? 'not answered' : pct(m)}`}
                              className={`h-5 w-5 rounded-sm ${m === null ? 'border border-[#E7DDFB] dark:border-[#3B2C78]' : ''}`}
                              style={{ background: cellColor(m), opacity: m === null ? 1 : 0.35 + 0.65 * (m >= MASTERED || m < GAP ? 1 : 0.8) }}
                            >
                              <span className="sr-only">{m === null ? '—' : pct(m)}</span>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
