/**
 * Learner model: a mastery estimate for every concept, updated after every answer.
 *
 *  - Bayesian Knowledge Tracing (BKT) per concept. Slip and guess depend on the
 *    question's difficulty, so a hard question answered correctly is stronger
 *    evidence than an easy one.
 *  - Forgetting: learned mastery fades towards a floor between practice sessions;
 *    each successful spaced review makes memory more stable (longer half-life).
 *  - Spaced repetition: a concept becomes due when its predicted retention falls
 *    below a target, so reviews happen just before it would be forgotten.
 *  - Difficulty calibration: the next question is the one whose predicted chance
 *    of a correct answer is closest to ~70% (hard enough to learn from, not
 *    discouraging), and item difficulties are themselves re-estimated (Elo) from
 *    every answer.
 *  - In the diagnostic, evidence flows through the concept graph: getting an
 *    advanced concept right raises its prerequisites; getting a basic one wrong
 *    lowers what depends on it. This is how ~12 questions place a student on all
 *    24 concepts.
 *
 * Pure functions only — used by the browser, the server (teacher dashboard) and
 * the simulated demo class alike.
 */
import { CONCEPTS, CONCEPT_BY_ID, DEPENDENTS, descendantsOf, misconceptionsFor } from './conceptGraph';
import type { TutorQuestion } from './questionBank';

export const MODEL_VERSION = 1;
const DAY = 86_400_000;

export const BKT = {
  /** Prior that a never-seen concept is already known. */
  pInit: 0.35,
  /** Chance of learning the concept from one practice attempt (with feedback). */
  pTransit: 0.12,
};
/** Mastery at or above this is "mastered"; below GAP is a gap the teacher should see. */
export const MASTERED = 0.85;
export const GAP = 0.5;
/** Practice aims for this chance of a correct answer (desirable difficulty). */
export const TARGET_SUCCESS = 0.7;
/** A concept is due for review when predicted mastery falls this far below its learned value. */
const REVIEW_RETENTION = 0.9;
/** Learned mastery never decays below this fraction of itself (you do not forget everything). */
const FORGET_FLOOR = 0.7;

export type AnswerMode = 'diagnostic' | 'practice' | 'review';

export interface ConceptState {
  /** P(known) right after the last update. */
  p: number;
  attempts: number;
  correct: number;
  lastPracticed: number; // epoch ms, 0 = never
  /** Memory half-life in days; grows with successful spaced reviews. */
  stability: number;
  due: number; // epoch ms, 0 = not scheduled
  /** true when the value came only from graph inference in the diagnostic (not answered directly). */
  inferred?: boolean;
  /** misconception id -> times seen (from wrong options and from written reasoning) */
  misconceptions: Record<string, number>;
}

export interface AnswerEvent {
  t: number;
  qid: string;
  conceptId: string;
  correct: boolean;
  mode: AnswerMode;
  difficulty: number;
  pBefore: number;
  pAfter: number;
  /** Misconception implied by the wrong option chosen. */
  optionMisconception?: string;
  /** Misconception found in the student's written reasoning (LLM or offline detector). */
  reasoningMisconception?: string;
  reasoning?: string;
  ms?: number;
}

export interface LearnerState {
  version: number;
  concepts: Record<string, ConceptState>;
  /** Re-calibrated difficulty per question id. */
  itemDifficulty: Record<string, number>;
  history: AnswerEvent[];
  diagnostic?: { startedAt: number; finishedAt?: number; asked: string[] };
}

export const emptyConcept = (): ConceptState => ({
  p: BKT.pInit,
  attempts: 0,
  correct: 0,
  lastPracticed: 0,
  stability: 1,
  due: 0,
  misconceptions: {},
});

export function emptyLearner(): LearnerState {
  return {
    version: MODEL_VERSION,
    concepts: Object.fromEntries(CONCEPTS.map((c) => [c.id, emptyConcept()])),
    itemDifficulty: {},
    history: [],
  };
}

/** Accept whatever was stored (older versions, missing concepts) and return a valid state. */
export function normalizeLearner(raw: unknown): LearnerState {
  const base = emptyLearner();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<LearnerState>;
  for (const c of CONCEPTS) {
    const s = r.concepts?.[c.id];
    if (s && typeof s.p === 'number') base.concepts[c.id] = { ...emptyConcept(), ...s, misconceptions: { ...(s.misconceptions ?? {}) } };
  }
  base.itemDifficulty = { ...(r.itemDifficulty ?? {}) };
  base.history = Array.isArray(r.history) ? r.history.slice(-400) : [];
  if (r.diagnostic) base.diagnostic = r.diagnostic;
  return base;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const logit = (p: number) => Math.log(clamp(p, 0.01, 0.99) / (1 - clamp(p, 0.01, 0.99)));

/** Slip/guess for a 4-option question of this difficulty. */
export function slipGuess(difficulty: number, nOptions = 4) {
  const d = clamp(difficulty, -2, 2);
  return {
    slip: clamp(0.1 + 0.05 * d, 0.03, 0.25), // hard questions: careful students still slip more
    guess: clamp(1 / nOptions + 0.05 - 0.05 * d, 0.1, 0.4), // easy questions are easier to guess
  };
}

/** Fraction of learned mastery still retained after `days` with this half-life. */
export function retention(days: number, stability: number) {
  return Math.pow(2, -Math.max(0, days) / Math.max(0.25, stability));
}

/** Mastery now, after forgetting since the last practice. */
export function effectiveMastery(s: ConceptState, now = Date.now()): number {
  if (!s.lastPracticed) return s.p;
  const days = (now - s.lastPracticed) / DAY;
  const kept = FORGET_FLOOR + (1 - FORGET_FLOOR) * retention(days, s.stability);
  return s.p * kept;
}

export function itemDifficulty(state: LearnerState, q: TutorQuestion) {
  return state.itemDifficulty[q.id] ?? q.difficulty;
}

/** Predicted chance of answering `q` correctly, given current mastery. */
export function predictCorrect(state: LearnerState, q: TutorQuestion, now = Date.now()): number {
  const s = state.concepts[q.conceptId] ?? emptyConcept();
  const m = effectiveMastery(s, now);
  const b = itemDifficulty(state, q);
  const { slip, guess } = slipGuess(b, q.options.length);
  // Mastered students succeed unless they slip; others succeed by partial knowledge or a guess.
  // Ability is logit(mastery); a 1-logit harder item lowers the non-mastery success chance.
  const partial = sigmoid(logit(m) - b);
  return clamp(guess + (1 - guess - slip) * partial, 0.02, 0.98);
}

function bktPosterior(p: number, correct: boolean, slip: number, guess: number) {
  const post = correct
    ? (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess)
    : (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return post;
}

export interface AnswerInput {
  question: TutorQuestion;
  correct: boolean;
  mode: AnswerMode;
  optionMisconception?: string;
  reasoning?: string;
  ms?: number;
  now?: number;
}

/** Apply one answer. Returns a new state (input is not mutated) and the event recorded. */
export function applyAnswer(prev: LearnerState, input: AnswerInput): { state: LearnerState; event: AnswerEvent } {
  const now = input.now ?? Date.now();
  const q = input.question;
  const state: LearnerState = {
    ...prev,
    concepts: { ...prev.concepts },
    itemDifficulty: { ...prev.itemDifficulty },
  };
  const before = { ...(state.concepts[q.conceptId] ?? emptyConcept()) };
  before.misconceptions = { ...before.misconceptions };
  const b = itemDifficulty(prev, q);
  const pNow = effectiveMastery(before, now);
  const predicted = predictCorrect(prev, q, now);

  // 1. BKT: evidence from this answer, then the chance they learned from the feedback.
  const { slip, guess } = slipGuess(b, q.options.length);
  const posterior = bktPosterior(pNow, input.correct, slip, guess);
  const learnRate = input.mode === 'diagnostic' ? 0 : BKT.pTransit; // no teaching during the test
  const pAfter = clamp(posterior + (1 - posterior) * learnRate, 0.01, 0.99);

  // 2. Memory stability and next review (spaced repetition).
  const daysSince = before.lastPracticed ? (now - before.lastPracticed) / DAY : 0;
  let stability = before.stability;
  if (input.correct && input.mode === 'diagnostic') {
    // Knowledge shown in the diagnostic was there before today: treat it as long-term memory.
    stability = Math.max(stability, 21);
  } else if (input.correct) {
    // Recalling after a longer gap strengthens memory more (spacing effect).
    const spacingBonus = clamp(daysSince / Math.max(stability, 0.25), 0.2, 1.5);
    if (pAfter >= 0.6) stability = clamp(stability * (1 + 3 * spacingBonus), 1, 180);
  } else {
    stability = clamp(stability * 0.5, 0.5, 180);
  }
  // Due when retention falls to REVIEW_RETENTION of the learned mastery: solve FLOOR+(1-FLOOR)*2^(-t/s) = R.
  const r = (REVIEW_RETENTION - FORGET_FLOOR) / (1 - FORGET_FLOOR);
  const interval = input.correct ? stability * Math.log2(1 / r) : 10 / (24 * 60); // wrong → back in ~10 min
  const due = now + interval * DAY;

  const misconceptions = before.misconceptions;
  if (!input.correct && input.optionMisconception) {
    misconceptions[input.optionMisconception] = (misconceptions[input.optionMisconception] ?? 0) + 1;
  }

  state.concepts[q.conceptId] = {
    ...before,
    p: pAfter,
    attempts: before.attempts + 1,
    correct: before.correct + (input.correct ? 1 : 0),
    lastPracticed: now,
    stability,
    due,
    inferred: false,
    misconceptions,
  };

  // 3. Calibrate the item: surprisingly wrong → harder, surprisingly right → easier.
  state.itemDifficulty[q.id] = clamp(b + 0.4 * (predicted - (input.correct ? 1 : 0)), -3, 3);

  // 4. Diagnostic only: spread evidence through the graph.
  if (input.mode === 'diagnostic') propagateDiagnostic(state, q.conceptId, input.correct, pAfter);

  const event: AnswerEvent = {
    t: now,
    qid: q.id,
    conceptId: q.conceptId,
    correct: input.correct,
    mode: input.mode,
    difficulty: b,
    pBefore: pNow,
    pAfter,
    optionMisconception: input.correct ? undefined : input.optionMisconception,
    reasoning: input.reasoning?.slice(0, 600) || undefined,
    ms: input.ms,
  };
  state.history = [...prev.history, event].slice(-400);
  return { state, event };
}

function propagateDiagnostic(state: LearnerState, conceptId: string, correct: boolean, pAfter: number) {
  const touch = (id: string, target: number, weight: number) => {
    const s = state.concepts[id];
    if (!s || s.attempts > 0) return; // never override direct evidence
    state.concepts[id] = { ...s, p: clamp(s.p + weight * (target - s.p), 0.01, 0.99), inferred: true };
  };
  if (correct) {
    // Knowing an advanced idea implies its foundations, most strongly the direct prerequisites.
    const direct = CONCEPT_BY_ID[conceptId].prereqs;
    for (const p of direct) touch(p, Math.max(pAfter, 0.8), 0.6);
    for (const p of direct.flatMap((x) => CONCEPT_BY_ID[x].prereqs)) touch(p, Math.max(pAfter, 0.8), 0.4);
  } else {
    // Not knowing a foundation makes what is built on it unlikely to be known.
    for (const d of DEPENDENTS[conceptId]) touch(d, Math.min(pAfter, 0.3), 0.5);
    for (const d of descendantsOf(conceptId)) touch(d, Math.min(pAfter, 0.3), 0.25);
  }
}

/** Record a misconception found in written reasoning against the concept of the last answer. */
export function addReasoningMisconception(prev: LearnerState, eventTime: number, misconceptionId: string): LearnerState {
  const idx = prev.history.findIndex((e) => e.t === eventTime);
  if (idx < 0) return prev;
  const ev = prev.history[idx];
  if (ev.reasoningMisconception === misconceptionId) return prev;
  const history = [...prev.history];
  history[idx] = { ...ev, reasoningMisconception: misconceptionId };
  const s = prev.concepts[ev.conceptId];
  const misconceptions = { ...s.misconceptions };
  // Count once per answer: skip if the chosen option already recorded the same belief.
  if (ev.optionMisconception !== misconceptionId) misconceptions[misconceptionId] = (misconceptions[misconceptionId] ?? 0) + 1;
  return { ...prev, history, concepts: { ...prev.concepts, [ev.conceptId]: { ...s, misconceptions } } };
}

/** Merge two devices' states: for each concept keep the most recently practised; union the answer history. */
export function mergeLearners(aRaw: unknown, bRaw: unknown): LearnerState {
  const a = normalizeLearner(aRaw);
  const b = normalizeLearner(bRaw);
  const out = emptyLearner();
  for (const c of CONCEPTS) {
    const x = a.concepts[c.id];
    const y = b.concepts[c.id];
    out.concepts[c.id] = x.lastPracticed > y.lastPracticed || (x.lastPracticed === y.lastPracticed && x.attempts >= y.attempts) ? x : y;
  }
  const seen = new Set<string>();
  out.history = [...a.history, ...b.history]
    .filter((e) => {
      const k = `${e.t}:${e.qid}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((p, q) => p.t - q.t)
    .slice(-400);
  const newer = (a.history.at(-1)?.t ?? 0) >= (b.history.at(-1)?.t ?? 0) ? a : b;
  out.itemDifficulty = { ...(newer === a ? b : a).itemDifficulty, ...newer.itemDifficulty };
  out.diagnostic = newer.diagnostic ?? a.diagnostic ?? b.diagnostic;
  return out;
}

/* ---------- choosing what to ask ---------- */

export type ConceptStatus = 'unseen' | 'gap' | 'learning' | 'mastered';

export function conceptStatus(s: ConceptState, now = Date.now()): ConceptStatus {
  if (s.attempts === 0 && !s.inferred) return 'unseen';
  const m = effectiveMastery(s, now);
  if (m >= MASTERED) return 'mastered';
  if (m < GAP) return 'gap';
  return 'learning';
}

/** A concept is ready to practise when every prerequisite is reasonably known. */
export function isReady(state: LearnerState, conceptId: string, now = Date.now()) {
  return CONCEPT_BY_ID[conceptId].prereqs.every((p) => effectiveMastery(state.concepts[p], now) >= 0.6);
}

/**
 * Where a gap really starts: follow the chain of prerequisites that are themselves gaps (< GAP) down
 * the graph, always taking the weakest, and return the deepest one. null if every direct
 * prerequisite is fine (the gap is in this concept itself).
 */
export function rootCause(state: LearnerState, conceptId: string, now = Date.now()): string | null {
  let weakest: string | null = null;
  let weakestM = GAP;
  for (const p of CONCEPT_BY_ID[conceptId].prereqs) {
    const m = effectiveMastery(state.concepts[p], now);
    if (m < weakestM) {
      weakestM = m;
      weakest = p;
    }
  }
  if (!weakest) return null;
  return rootCause(state, weakest, now) ?? weakest;
}

export function dueConcepts(state: LearnerState, now = Date.now()): string[] {
  return CONCEPTS.filter((c) => {
    const s = state.concepts[c.id];
    return s.attempts > 0 && s.due > 0 && s.due <= now;
  })
    .sort((a, b) => state.concepts[a.id].due - state.concepts[b.id].due)
    .map((c) => c.id);
}

export interface PracticePick {
  conceptId: string;
  reason: 'review-due' | 'weak' | 'misconception' | 'new' | 'stretch';
  /** If the student asked for a concept that is not ready, the prerequisite we redirected to. */
  redirectedFrom?: string;
}

/** Which concept to practise next: due reviews and weak-but-ready concepts first. */
export function pickConcept(state: LearnerState, opts: { focus?: string; now?: number } = {}): PracticePick {
  const now = opts.now ?? Date.now();
  if (opts.focus) {
    const cause = isReady(state, opts.focus, now) ? null : rootCause(state, opts.focus, now);
    return cause ? { conceptId: cause, reason: 'weak', redirectedFrom: opts.focus } : { conceptId: opts.focus, reason: 'weak' };
  }
  const due = dueConcepts(state, now);
  const recent = new Set(state.history.slice(-2).map((e) => e.conceptId));
  let best: PracticePick | null = null;
  let bestScore = -Infinity;
  for (const c of CONCEPTS) {
    const s = state.concepts[c.id];
    const m = effectiveMastery(s, now);
    if (!isReady(state, c.id, now)) continue;
    const misCount = Object.values(s.misconceptions).reduce((a, b) => a + b, 0);
    let score = 1 - m;
    let reason: PracticePick['reason'] = s.attempts === 0 ? 'new' : 'weak';
    if (due.includes(c.id)) {
      score += 0.6;
      reason = 'review-due';
    }
    if (misCount > 0 && m < MASTERED) {
      score += Math.min(0.4, 0.15 * misCount);
      if (reason !== 'review-due') reason = 'misconception';
    }
    if (m >= MASTERED && !due.includes(c.id)) score -= 1; // leave mastered ones until they are due
    if (recent.has(c.id) && s.attempts > 0) score -= 0.25; // interleave topics
    if (score > bestScore) {
      bestScore = score;
      best = { conceptId: c.id, reason };
    }
  }
  return best ?? { conceptId: CONCEPTS[0].id, reason: 'stretch' };
}

/** Pick the question for a concept whose predicted success is closest to the target. */
export function pickQuestion(
  state: LearnerState,
  conceptId: string,
  pool: TutorQuestion[],
  opts: { exclude?: Set<string>; target?: number; now?: number } = {}
): TutorQuestion | null {
  const now = opts.now ?? Date.now();
  const target = opts.target ?? TARGET_SUCCESS;
  const lastSeen = new Map<string, number>();
  state.history.forEach((e) => lastSeen.set(e.qid, e.t));
  const candidates = pool.filter((q) => q.conceptId === conceptId && !opts.exclude?.has(q.id));
  if (!candidates.length) return null;
  let best: TutorQuestion | null = null;
  let bestScore = Infinity;
  for (const q of candidates) {
    const seen = lastSeen.get(q.id);
    // Seen questions are allowed again only after a day, and still lose to fresh ones.
    const recency = seen === undefined ? 0 : now - seen < DAY ? 5 : 0.3;
    const score = Math.abs(predictCorrect(state, q, now) - target) + recency;
    if (score < bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}

/** Fresh bank questions left for a concept (never answered). */
export function unseenCount(state: LearnerState, conceptId: string, pool: TutorQuestion[]) {
  const seen = new Set(state.history.map((e) => e.qid));
  return pool.filter((q) => q.conceptId === conceptId && !seen.has(q.id)).length;
}

/* ---------- diagnostic test ---------- */

export const DIAGNOSTIC_LENGTH = 12;

/**
 * Next diagnostic concept: the one whose answer tells us most — uncertain mastery,
 * weighted by how many concepts depend on it — never asking a concept twice.
 */
export function nextDiagnosticConcept(state: LearnerState): string | null {
  const asked = new Set(state.diagnostic?.asked ?? []);
  if (asked.size >= DIAGNOSTIC_LENGTH) return null;
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const c of CONCEPTS) {
    if (asked.has(c.id)) continue;
    const s = state.concepts[c.id];
    if (s.attempts > 0) continue;
    const uncertainty = 1 - Math.abs(2 * s.p - 1); // 1 at p = 0.5, 0 at 0 or 1
    const reach = 1 + 0.12 * descendantsOf(c.id).length + 0.08 * c.prereqs.length;
    const score = uncertainty * reach;
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = c.id;
    }
  }
  return bestScore > 0.15 ? best : null;
}

/** Start a diagnostic: unseen concepts reset to "no idea" (0.5) so every answer is informative. */
export function startDiagnostic(prev: LearnerState, now = Date.now()): LearnerState {
  const concepts = { ...prev.concepts };
  for (const c of CONCEPTS) {
    if (concepts[c.id].attempts === 0) concepts[c.id] = { ...concepts[c.id], p: 0.5, inferred: false };
  }
  return { ...prev, concepts, diagnostic: { startedAt: now, asked: [] } };
}

export function markDiagnosticAsked(prev: LearnerState, conceptId: string): LearnerState {
  const d = prev.diagnostic ?? { startedAt: Date.now(), asked: [] };
  return { ...prev, diagnostic: { ...d, asked: [...d.asked, conceptId] } };
}

export function finishDiagnostic(prev: LearnerState, now = Date.now()): LearnerState {
  const concepts = { ...prev.concepts };
  // Anything still untouched goes back to the prior so it is not mistaken for evidence.
  for (const c of CONCEPTS) {
    const s = concepts[c.id];
    if (s.attempts === 0 && !s.inferred) concepts[c.id] = { ...s, p: BKT.pInit };
  }
  return { ...prev, concepts, diagnostic: { ...(prev.diagnostic ?? { startedAt: now, asked: [] }), finishedAt: now } };
}

/* ---------- misconception detection in written reasoning (offline fallback) ---------- */

/** Keyword detector used when the AI is unavailable. Returns the best match or null. */
export function detectMisconceptionOffline(reasoning: string, conceptId: string): { id: string; cue: string } | null {
  const text = ` ${reasoning.toLowerCase().replace(/\s+/g, ' ')} `;
  if (text.trim().length < 6) return null;
  let best: { id: string; cue: string } | null = null;
  for (const m of misconceptionsFor([conceptId])) {
    if (m.concepts.includes('*')) continue; // too generic to detect from keywords
    for (const cue of m.cues) {
      if (text.includes(cue) && (!best || cue.length > best.cue.length)) best = { id: m.id, cue };
    }
  }
  return best;
}

/* ---------- summaries ---------- */

export function overallMastery(state: LearnerState, now = Date.now()): number {
  const vals = CONCEPTS.map((c) => effectiveMastery(state.concepts[c.id], now));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function topMisconceptions(state: LearnerState, limit = 5): { id: string; count: number }[] {
  const totals: Record<string, number> = {};
  for (const s of Object.values(state.concepts)) for (const [id, n] of Object.entries(s.misconceptions)) totals[id] = (totals[id] ?? 0) + n;
  return Object.entries(totals)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* ---------- presenting a question ---------- */

/** Deterministic option shuffle so the right answer is not always in the same place. */
export function shuffledOrder(q: TutorQuestion, seed: number): number[] {
  const order = q.options.map((_, i) => i);
  // mulberry32: good bits everywhere (a plain LCG's low bits repeat, which pinned the answer to one letter)
  let a = (seed ^ [...q.id].reduce((x, ch) => Math.imul(x ^ ch.charCodeAt(0), 2654435761), 7)) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
