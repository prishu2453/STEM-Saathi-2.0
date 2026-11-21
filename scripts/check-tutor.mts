/**
 * Checks for the adaptive tutor engine (no test framework needed):
 *   npm run check:tutor
 * Exits with code 1 on the first failed check.
 */
import assert from 'node:assert/strict';
import { CONCEPTS, CONCEPT_BY_ID, DEPTH, MISCONCEPTION_BY_ID, misconceptionsFor } from '../shared/tutor/conceptGraph';
import { QUESTION_BANK } from '../shared/tutor/questionBank';
import * as L from '../shared/tutor/learnerModel';
import { aggregateClass, simulateClass } from '../shared/tutor/classAnalytics';

let passed = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    passed += 1;
  } catch (e) {
    console.error(`✗ ${name}\n  ${(e as Error).message}`);
    process.exit(1);
  }
};

check('concept graph is a valid DAG', () => {
  for (const c of CONCEPTS) for (const p of c.prereqs) assert.ok(CONCEPT_BY_ID[p], `${c.id} -> unknown prereq ${p}`);
  for (const c of CONCEPTS) assert.ok(Number.isFinite(DEPTH[c.id]), `cycle at ${c.id}`);
});

check('every concept has ≥3 questions spanning easy and hard', () => {
  for (const c of CONCEPTS) {
    const qs = QUESTION_BANK.filter((q) => q.conceptId === c.id);
    assert.ok(qs.length >= 3, `${c.id} has ${qs.length} questions`);
    assert.ok(Math.min(...qs.map((q) => q.difficulty)) < 0 && Math.max(...qs.map((q) => q.difficulty)) > 0, `${c.id} lacks a difficulty spread`);
  }
});

check('questions are well-formed and distractor tags are known and relevant', () => {
  const ids = new Set<string>();
  for (const q of QUESTION_BANK) {
    assert.ok(!ids.has(q.id), `duplicate id ${q.id}`);
    ids.add(q.id);
    assert.equal(q.options.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, `${q.id} has duplicate options`);
    assert.ok(q.correctIndex >= 0 && q.correctIndex < 4, q.id);
    const relevant = new Set(misconceptionsFor([q.conceptId]).map((m) => m.id));
    for (const [i, m] of Object.entries(q.distractorMisconceptions)) {
      assert.ok(MISCONCEPTION_BY_ID[m], `${q.id}: unknown misconception ${m}`);
      assert.notEqual(Number(i), q.correctIndex, `${q.id}: correct option tagged as misconception`);
      assert.ok(relevant.has(m), `${q.id}: ${m} is not listed for ${q.conceptId}`);
    }
  }
});

check('mastery rises with correct answers and falls with wrong ones', () => {
  const q = QUESTION_BANK.find((x) => x.conceptId === 'ohms-law')!;
  const s0 = L.emptyLearner();
  const up = L.applyAnswer(s0, { question: q, correct: true, mode: 'practice' });
  const down = L.applyAnswer(s0, { question: q, correct: false, mode: 'practice' });
  assert.ok(up.event.pAfter > up.event.pBefore);
  assert.ok(down.event.pAfter < down.event.pBefore);
  assert.equal(s0.history.length, 0, 'input state must not be mutated');
});

check('a hard question answered correctly is stronger evidence than an easy one', () => {
  const easy = QUESTION_BANK.find((x) => x.conceptId === 'ohms-law' && x.difficulty < 0)!;
  const hard = QUESTION_BANK.find((x) => x.conceptId === 'ohms-law' && x.difficulty > 0)!;
  const s0 = L.emptyLearner();
  const a = L.applyAnswer(s0, { question: easy, correct: true, mode: 'diagnostic' }).event.pAfter;
  const b = L.applyAnswer(s0, { question: hard, correct: true, mode: 'diagnostic' }).event.pAfter;
  assert.ok(b > a, `hard ${b} vs easy ${a}`);
});

check('diagnostic places a student who knows optics but not electricity', () => {
  let s = L.startDiagnostic(L.emptyLearner());
  const knows = (id: string) => ['light', 'eye'].includes(CONCEPT_BY_ID[id].chapter);
  for (let i = 0; i < L.DIAGNOSTIC_LENGTH; i++) {
    const cid = L.nextDiagnosticConcept(s);
    if (!cid) break;
    s = L.markDiagnosticAsked(s, cid);
    s = L.applyAnswer(s, { question: L.pickQuestion(s, cid, QUESTION_BANK)!, correct: knows(cid), mode: 'diagnostic' }).state;
  }
  s = L.finishDiagnostic(s);
  const avg = (ch: string) => {
    const v = CONCEPTS.filter((c) => c.chapter === ch).map((c) => s.concepts[c.id]);
    return v.reduce((a, x) => a + x.p, 0) / v.length;
  };
  assert.ok(avg('light') > 0.6, `light ${avg('light')}`);
  assert.ok(avg('electricity') < 0.35, `electricity ${avg('electricity')}`);
  assert.ok(s.diagnostic!.asked.length <= L.DIAGNOSTIC_LENGTH);
});

check('practice targets a weak concept whose prerequisites are ready, and redirects to a weak prerequisite', () => {
  const s = L.emptyLearner();
  for (const c of CONCEPTS) s.concepts[c.id] = { ...s.concepts[c.id], p: 0.95, attempts: 3, lastPracticed: Date.now(), stability: 30, due: Date.now() + 30 * 86_400_000 };
  s.concepts['ohms-law'] = { ...s.concepts['ohms-law'], p: 0.2 };
  assert.equal(L.pickConcept(s).conceptId, 'ohms-law');
  // electric-power ← heating-effect (gap) ← ohms-law (gap): start at the bottom of the chain
  s.concepts['heating-effect'] = { ...s.concepts['heating-effect'], p: 0.3 };
  const r = L.pickConcept(s, { focus: 'electric-power' });
  assert.equal(r.conceptId, 'ohms-law', 'gap chain electric-power → heating-effect → ohms-law');
  assert.equal(r.redirectedFrom, 'electric-power');
});

check('question choice aims at ~70% predicted success', () => {
  const s = L.emptyLearner();
  const q = L.pickQuestion(s, 'parallel-resistors', QUESTION_BANK)!;
  const preds = QUESTION_BANK.filter((x) => x.conceptId === 'parallel-resistors').map((x) => Math.abs(L.predictCorrect(s, x) - L.TARGET_SUCCESS));
  assert.equal(Math.abs(L.predictCorrect(s, q) - L.TARGET_SUCCESS), Math.min(...preds));
});

check('spaced repetition: intervals grow after each correct review, wrong answer brings it back today', () => {
  const q = QUESTION_BANK.find((x) => x.id === 'bank-oh2')!;
  let s = L.emptyLearner();
  let t = Date.now();
  let prev = 0;
  for (let i = 0; i < 5; i++) {
    s = L.applyAnswer(s, { question: q, correct: true, mode: 'practice', now: t }).state;
    const gap = s.concepts['ohms-law'].due - t;
    assert.ok(gap > prev, `interval ${i} did not grow`);
    prev = gap;
    t = s.concepts['ohms-law'].due;
  }
  s = L.applyAnswer(s, { question: q, correct: false, mode: 'practice', now: t }).state;
  assert.ok(s.concepts['ohms-law'].due - t < 86_400_000);
});

check('forgetting lowers effective mastery over time', () => {
  const c = { ...L.emptyConcept(), p: 0.9, lastPracticed: Date.now() - 30 * 86_400_000, stability: 3 };
  assert.ok(L.effectiveMastery(c) < 0.9 && L.effectiveMastery(c) > 0.6);
});

check('offline reasoning detector finds misconceptions in student words', () => {
  assert.equal(L.detectMisconceptionOffline('the bulb uses up current so less flows out', 'charge-current')?.id, 'current-used-up');
  assert.equal(L.detectMisconceptionOffline('I just add them, r1 + r2', 'parallel-resistors')?.id, 'parallel-adds');
  assert.equal(L.detectMisconceptionOffline('ok', 'ohms-law'), null);
});

check('options are shuffled so the answer is not always first', () => {
  const firsts = new Set(QUESTION_BANK.slice(0, 20).map((q) => L.shuffledOrder(q, 123).indexOf(q.correctIndex)));
  assert.ok(firsts.size >= 3);
});

check('merging two devices keeps the newer evidence per concept and all answers', () => {
  const q = QUESTION_BANK[0];
  const a = L.applyAnswer(L.emptyLearner(), { question: q, correct: true, mode: 'practice', now: 1000 }).state;
  const b = L.applyAnswer(L.emptyLearner(), { question: q, correct: false, mode: 'practice', now: 2000 }).state;
  const m = L.mergeLearners(a, b);
  assert.equal(m.history.length, 2);
  assert.equal(m.concepts[q.conceptId].lastPracticed, 2000);
});

check('class report finds gaps, misconceptions and re-teach actions', () => {
  const r = aggregateClass(simulateClass(7));
  assert.equal(r.studentCount, 28);
  assert.ok(r.concepts.some((c) => c.gapCount > 0));
  assert.ok(r.misconceptions.length > 0);
  assert.ok(r.actions.length > 0);
  assert.ok(r.students[0].overall <= r.students[r.students.length - 1].overall, 'weakest first');
});

console.log(`✓ ${passed} tutor checks passed (${CONCEPTS.length} concepts, ${QUESTION_BANK.length} questions)`);
