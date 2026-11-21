/**
 * Browser storage and API calls for the adaptive tutor. State lives under
 * "stem-saathi-" keys, so it syncs to the student's account automatically
 * (see account.ts) and the teacher's class report can read it.
 */
import { useCallback, useEffect, useState } from 'react';
import { emptyLearner, normalizeLearner, type LearnerState } from '../../shared/tutor/learnerModel';
import { QUESTION_BANK, type TutorQuestion } from '../../shared/tutor/questionBank';
import { getToken } from './account';
import { apiUrl } from './apiBase';

export const LEARNER_KEY = 'stem-saathi-learner-v1';
export const GENERATED_KEY = 'stem-saathi-genq-v1';
export const CLASS_CODE_KEY = 'stem-saathi-class-code-v1';
const EVENT = 'stem-saathi-learner';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    // storage blocked: state lasts for this session only
  }
}

export const loadLearner = (): LearnerState => normalizeLearner(read<unknown>(LEARNER_KEY, null));
export function saveLearner(s: LearnerState) {
  write(LEARNER_KEY, s);
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // non-browser
  }
}

/** Shared learner state across components; updates persist immediately. */
export function useLearner(): [LearnerState, (next: LearnerState | ((prev: LearnerState) => LearnerState)) => void] {
  const [state, setState] = useState<LearnerState>(() => loadLearner());
  useEffect(() => {
    const sync = () => setState(loadLearner());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const update = useCallback((next: LearnerState | ((prev: LearnerState) => LearnerState)) => {
    const value = typeof next === 'function' ? next(loadLearner()) : next;
    saveLearner(value);
    setState(value);
  }, []);
  return [state, update];
}

export const resetLearner = () => saveLearner(emptyLearner());

/* ---------- AI-generated questions, kept so they can be re-asked and calibrated ---------- */
export function loadGenerated(): TutorQuestion[] {
  const map = read<Record<string, TutorQuestion>>(GENERATED_KEY, {});
  return Object.values(map).filter((q) => q && typeof q.stem === 'string' && Array.isArray(q.options));
}
export function saveGenerated(q: TutorQuestion) {
  const map = read<Record<string, TutorQuestion>>(GENERATED_KEY, {});
  map[q.id] = q;
  // keep the newest 150
  const entries = Object.entries(map).slice(-150);
  write(GENERATED_KEY, Object.fromEntries(entries));
}
export const questionPool = (): TutorQuestion[] => [...QUESTION_BANK, ...loadGenerated()];

/* ---------- class code ---------- */
export const getClassCode = () => {
  try {
    return localStorage.getItem(CLASS_CODE_KEY) ?? '';
  } catch {
    return '';
  }
};
export function setClassCode(code: string) {
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  try {
    if (clean) localStorage.setItem(CLASS_CODE_KEY, clean);
    else localStorage.removeItem(CLASS_CODE_KEY);
  } catch {
    // ignore
  }
  return clean;
}

/* ---------- API ---------- */
async function post<T>(path: string, body: unknown, timeoutMs = 45_000): Promise<T> {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export interface ReasoningDiagnosis {
  misconceptionId: string | null;
  other: string | null;
  sound: boolean;
  confidence: number;
  evidence: string;
  feedback: string;
  label: string | null;
  source: 'ai' | 'offline';
}

export const diagnoseReasoning = (body: {
  conceptId: string;
  question: { stem: string; options: string[]; correctIndex: number };
  chosenIndex: number;
  reasoning: string;
  language: string;
}) => post<ReasoningDiagnosis>('/api/tutor/diagnose', body);

export const generateQuestion = (body: { conceptId: string; difficulty: number; language: string; avoid: string[] }) =>
  post<{ question: TutorQuestion }>('/api/tutor/generate', body, 60_000).then((r) => r.question);

export async function tutorAiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/tutor/status'), { signal: AbortSignal.timeout(6000) });
    return Boolean(((await res.json()) as { ai?: boolean }).ai);
  } catch {
    return false;
  }
}

export async function fetchClassReport() {
  const token = getToken();
  if (!token) throw Object.assign(new Error('Please log in to see your class.'), { status: 401 });
  const res = await fetch(apiUrl('/api/teacher/class'), { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data as { classCode: string; teacher: string; report: import('../../shared/tutor/classAnalytics').ClassReport };
}
