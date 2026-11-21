/**
 * Class-wide view for teachers: which concepts the class has not understood,
 * which wrong ideas are common, the root causes in the concept graph and which
 * students need help. Used by the server for a real class and by the browser for
 * the simulated demo class.
 */
import { CONCEPTS, CONCEPT_BY_ID, MISCONCEPTION_BY_ID } from './conceptGraph';
import { QUESTION_BANK } from './questionBank';
import {
  applyAnswer,
  effectiveMastery,
  emptyLearner,
  finishDiagnostic,
  GAP,
  markDiagnosticAsked,
  MASTERED,
  nextDiagnosticConcept,
  overallMastery,
  pickConcept,
  pickQuestion,
  rootCause,
  startDiagnostic,
  type LearnerState,
} from './learnerModel';

export interface ClassStudentInput {
  id: string;
  name: string;
  updatedAt: string | null;
  state: LearnerState;
}

export interface ConceptRow {
  conceptId: string;
  avgMastery: number;
  /** Students who have answered at least one question on this concept. */
  assessed: number;
  gapCount: number;
  masteredCount: number;
  attempts: number;
  accuracy: number | null;
  /** Most common prerequisite that the struggling students are also weak in. */
  rootCause: { conceptId: string; students: number } | null;
}

export interface MisconceptionRow {
  id: string;
  students: number;
  occurrences: number;
  conceptIds: string[];
}

export interface StudentRow {
  id: string;
  name: string;
  updatedAt: string | null;
  overall: number;
  answered: number;
  gaps: string[];
  topMisconception: string | null;
  mastery: Record<string, number | null>;
}

export interface ClassReport {
  generatedAt: string;
  studentCount: number;
  activeStudents: number;
  concepts: ConceptRow[];
  misconceptions: MisconceptionRow[];
  students: StudentRow[];
  /** Concrete suggestions: what to re-teach first and why. */
  actions: { conceptId: string; text: string }[];
}

export function aggregateClass(input: ClassStudentInput[], now = Date.now()): ClassReport {
  const students = input.filter((s) => s.state);
  const active = students.filter((s) => s.state.history.length > 0);

  const concepts: ConceptRow[] = CONCEPTS.map((c) => {
    let sum = 0;
    let assessed = 0;
    let gapCount = 0;
    let masteredCount = 0;
    let attempts = 0;
    let correct = 0;
    const causes: Record<string, number> = {};
    for (const st of active) {
      const s = st.state.concepts[c.id];
      if (!s || s.attempts === 0) continue; // direct evidence only: inferred values are one-sided
      const m = effectiveMastery(s, now);
      assessed += 1;
      sum += m;
      attempts += s.attempts;
      correct += s.correct;
      if (m >= MASTERED) masteredCount += 1;
      if (m < GAP) {
        gapCount += 1;
        const cause = rootCause(st.state, c.id, now);
        if (cause) causes[cause] = (causes[cause] ?? 0) + 1;
      }
    }
    const topCause = Object.entries(causes).sort((a, b) => b[1] - a[1])[0];
    return {
      conceptId: c.id,
      avgMastery: assessed ? sum / assessed : 0,
      assessed,
      gapCount,
      masteredCount,
      attempts,
      accuracy: attempts ? correct / attempts : null,
      rootCause: topCause ? { conceptId: topCause[0], students: topCause[1] } : null,
    };
  });

  const mis: Record<string, { students: Set<string>; occurrences: number; concepts: Set<string> }> = {};
  for (const st of active) {
    for (const [cid, s] of Object.entries(st.state.concepts)) {
      for (const [mid, n] of Object.entries(s.misconceptions ?? {})) {
        if (!n) continue;
        const row = (mis[mid] ??= { students: new Set(), occurrences: 0, concepts: new Set() });
        row.students.add(st.id);
        row.occurrences += n;
        row.concepts.add(cid);
      }
    }
  }
  const misconceptions: MisconceptionRow[] = Object.entries(mis)
    .map(([id, r]) => ({ id, students: r.students.size, occurrences: r.occurrences, conceptIds: [...r.concepts] }))
    .sort((a, b) => b.students - a.students || b.occurrences - a.occurrences);

  const studentRows: StudentRow[] = students
    .map((st) => {
      const mastery: Record<string, number | null> = {};
      const gaps: string[] = [];
      for (const c of CONCEPTS) {
        const s = st.state.concepts[c.id];
        if (!s || s.attempts === 0) {
          mastery[c.id] = null;
          continue;
        }
        const m = effectiveMastery(s, now);
        mastery[c.id] = m;
        if (m < GAP) gaps.push(c.id);
      }
      const totals: Record<string, number> = {};
      Object.values(st.state.concepts).forEach((s) => Object.entries(s.misconceptions ?? {}).forEach(([k, n]) => (totals[k] = (totals[k] ?? 0) + n)));
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
      return {
        id: st.id,
        name: st.name,
        updatedAt: st.updatedAt,
        overall: overallMastery(st.state, now),
        answered: st.state.history.length,
        gaps,
        topMisconception: top ? top[0] : null,
        mastery,
      };
    })
    .sort((a, b) => a.overall - b.overall);

  // Re-teach suggestions: biggest gaps first, pointing at the root cause when it is shared.
  const actions = concepts
    .filter((r) => r.assessed >= 3 && r.gapCount / r.assessed >= 0.3)
    .sort((a, b) => b.gapCount / b.assessed - a.gapCount / a.assessed)
    .slice(0, 4)
    .map((r) => {
      const name = CONCEPT_BY_ID[r.conceptId].name.en;
      const pct = Math.round((100 * r.gapCount) / r.assessed);
      const relatedMis = misconceptions.find((m) => m.conceptIds.includes(r.conceptId));
      let text = `${pct}% of assessed students (${r.gapCount}/${r.assessed}) have a gap in “${name}”.`;
      if (r.rootCause && r.rootCause.students >= Math.max(2, r.gapCount / 2)) {
        text += ` For ${r.rootCause.students} of them the root cause is the prerequisite “${CONCEPT_BY_ID[r.rootCause.conceptId].name.en}”, so start there.`;
      }
      if (relatedMis) text += ` Common wrong idea: “${MISCONCEPTION_BY_ID[relatedMis.id]?.label ?? relatedMis.id}” (${relatedMis.students} students).`;
      return { conceptId: r.conceptId, text };
    });

  return {
    generatedAt: new Date(now).toISOString(),
    studentCount: students.length,
    activeStudents: active.length,
    concepts,
    misconceptions,
    students: studentRows,
    actions,
  };
}

/* ---------- simulated class for demos (clearly labelled as simulated in the UI) ---------- */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const DEMO_NAMES = [
  'Aarav', 'Ananya', 'Bhavya', 'Chirag', 'Deepa', 'Farhan', 'Gauri', 'Harsh', 'Ishita', 'Jaya',
  'Kiran', 'Lakshmi', 'Manoj', 'Nandini', 'Omkar', 'Pooja', 'Rahul', 'Sana', 'Tejas', 'Uma',
  'Varun', 'Yamini', 'Zoya', 'Arjun', 'Divya', 'Ravi', 'Meera', 'Sameer',
];

/**
 * Simulate students answering with the real engine. Each simulated student has a
 * hidden true knowledge per concept and a few planted wrong ideas; the engine only
 * sees their answers, exactly as with a real student.
 */
export function simulateClass(seed = 7, now = Date.now()): ClassStudentInput[] {
  const rand = rng(seed);
  // Class-wide pattern: electricity combinations and lens power are weak, as is common.
  const classBias: Record<string, number> = {
    'parallel-resistors': -0.35, 'lens-formula': -0.3, 'refractive-index': -0.2, 'ohms-law': -0.15,
    'eye-defects': -0.2, 'force-on-conductor': -0.15, 'field-lines': 0.15, 'reflection-laws': 0.25, 'charge-current': 0.1,
  };
  const plantable = ['parallel-adds', 'current-used-up', 'power-in-cm', 'higher-n-faster', 'sign-convention', 'heat-linear-in-i', 'hand-rule-mixup'];
  return DEMO_NAMES.map((name, i) => {
    const ability = rand() * 0.55 + 0.4;
    const truth: Record<string, boolean> = {};
    for (const c of CONCEPTS) {
      const prereqsKnown = c.prereqs.every((p) => truth[p]);
      const p = ability + (classBias[c.id] ?? 0) + (prereqsKnown ? 0.1 : -0.2);
      truth[c.id] = rand() < p;
    }
    const beliefs = new Set(plantable.filter(() => rand() < 0.3));
    let t = now - (26 + rand() * 8) * 86_400_000; // sessions below add at most ~25 days
    const answer = (state: LearnerState, conceptId: string, mode: 'diagnostic' | 'practice') => {
      const q = pickQuestion(state, conceptId, QUESTION_BANK, { now: t });
      if (!q) return state;
      const known = truth[conceptId];
      const wrongs = Object.entries(q.distractorMisconceptions);
      const planted = wrongs.find(([, mid]) => beliefs.has(mid));
      let chosen: number;
      if (planted && rand() < 0.75) chosen = Number(planted[0]);
      else if (known) chosen = rand() < 0.9 ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
      else chosen = Math.floor(rand() * q.options.length);
      const correct = chosen === q.correctIndex;
      const { state: next } = applyAnswer(state, {
        question: q,
        correct,
        mode,
        optionMisconception: correct ? undefined : q.distractorMisconceptions[chosen],
        now: t,
      });
      // Practice with feedback sometimes fixes a gap.
      if (mode === 'practice' && !known && rand() < 0.18) truth[conceptId] = true;
      t += (2 + rand() * 30) * 60_000;
      return next;
    };
    let state = startDiagnostic(emptyLearner(), t);
    for (let k = 0; k < 12; k++) {
      const cid = nextDiagnosticConcept(state);
      if (!cid) break;
      state = markDiagnosticAsked(state, cid);
      state = answer(state, cid, 'diagnostic');
    }
    state = finishDiagnostic(state, t);
    const sessions = 2 + Math.floor(rand() * 5);
    for (let s = 0; s < sessions; s++) {
      t += (1 + rand() * 3) * 86_400_000;
      for (let k = 0; k < 6; k++) state = answer(state, pickConcept(state, { now: t }).conceptId, 'practice');
    }
    return { id: `demo-${i}`, name: `${name} (simulated)`, updatedAt: new Date(t).toISOString(), state };
  });
}
