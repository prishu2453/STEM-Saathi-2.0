import { apiUrl } from './apiBase';
/**
 * Client side of student accounts. Everything the app saves on the phone under the
 * "stem-saathi-" prefix (progress, class/board, flashcards, streak, settings…) is copied
 * to the account, so logging in on another phone brings it all back.
 * The session token is kept under a different key so it is never part of that copy.
 */
const TOKEN_KEY = 'ss-auth-token';
const ACCOUNT_KEY = 'ss-auth-account';
const PREFIX = 'stem-saathi-';
const SKIP_PREFIXES = ['stem-saathi-syllabus-cache-v1:']; // re-downloadable, large
export const ACCOUNT_EVENT = 'stem-saathi-account';

export interface StudentProfile {
  fullName: string;
  classLevel?: string;
  board?: string;
  stateName?: string;
  school?: string;
  district?: string;
  language?: string;
  role?: 'student' | 'teacher' | 'parent';
}

export interface PublicAccount {
  id: string;
  username: string;
  profile: StudentProfile;
  createdAt: string;
  snapshotUpdatedAt: string | null;
}

export type SyncState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

let syncState: SyncState = 'idle';
let lastSavedAt: string | null = null;
let lastPushed = '';
let timer: number | null = null;

const emit = () => {
  try {
    window.dispatchEvent(new Event(ACCOUNT_EVENT));
  } catch {
    // ignore
  }
};

const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    // storage full / blocked
  }
};
const safeRemove = (k: string) => {
  try {
    localStorage.removeItem(k);
  } catch {
    // ignore
  }
};

export const getToken = () => safeGet(TOKEN_KEY);
export function getCachedAccount(): PublicAccount | null {
  try {
    const raw = safeGet(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as PublicAccount) : null;
  } catch {
    return null;
  }
}
export const getSyncInfo = () => ({ state: syncState, lastSavedAt });

function setSession(token: string, account: PublicAccount) {
  safeSet(TOKEN_KEY, token);
  safeSet(ACCOUNT_KEY, JSON.stringify(account));
  lastSavedAt = account.snapshotUpdatedAt;
  emit();
}

function clearSession() {
  safeRemove(TOKEN_KEY);
  safeRemove(ACCOUNT_KEY);
  lastPushed = '';
  syncState = 'idle';
  emit();
}

export function collectSnapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX) || SKIP_PREFIXES.some((p) => k.startsWith(p))) continue;
      const v = localStorage.getItem(k);
      if (v != null) out[k] = v;
    }
  } catch {
    // storage blocked
  }
  return out;
}

// ---------- merge rules: never lose work from either side ----------
type Json = Record<string, unknown>;
const parse = (s: string | undefined | null): Json | null => {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? (v as Json) : null;
  } catch {
    return null;
  }
};

function mergeProgress(local: Json, remote: Json): Json {
  const out: Json = { ...local, ...remote };
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const a = local[k];
    const b = remote[k];
    if (Array.isArray(a) && Array.isArray(b)) out[k] = Array.from(new Set([...b, ...a]));
    else if (typeof a === 'number' && typeof b === 'number') out[k] = Math.max(a, b);
    else if (a && b && typeof a === 'object' && typeof b === 'object') {
      const m: Record<string, unknown> = { ...(b as Json) };
      for (const [kk, vv] of Object.entries(a as Json)) {
        const rv = m[kk];
        m[kk] = typeof vv === 'number' && typeof rv === 'number' ? Math.max(vv, rv) : rv ?? vv;
      }
      out[k] = m;
    } else if (b === undefined) out[k] = a;
  }
  return out;
}

function mergeFlashcards(local: Json, remote: Json): Json {
  const lc = (local.cards ?? {}) as Record<string, { reps?: number }>;
  const rc = (remote.cards ?? {}) as Record<string, { reps?: number }>;
  const cards: Record<string, unknown> = { ...rc };
  for (const [id, c] of Object.entries(lc)) {
    if (!rc[id] || (c.reps ?? 0) > (rc[id].reps ?? 0)) cards[id] = c;
  }
  const newer = String(local.lastDay ?? '') > String(remote.lastDay ?? '') ? local : remote;
  return {
    ...newer,
    xp: Math.max(Number(local.xp) || 0, Number(remote.xp) || 0),
    streak: Number(newer.streak) || 0,
    cards,
  };
}

export function mergeSnapshots(local: Record<string, string>, remote: Record<string, string>) {
  const out: Record<string, string> = { ...local, ...remote }; // account wins for settings
  for (const k of Object.keys(local)) {
    if (!(k in remote)) continue;
    const l = parse(local[k]);
    const r = parse(remote[k]);
    if (k.startsWith('stem-saathi-progress') && l && r) out[k] = JSON.stringify(mergeProgress(l, r));
    else if (k.startsWith('stem-saathi-flashcards') && l && r) out[k] = JSON.stringify(mergeFlashcards(l, r));
    else if (k.startsWith('stem-saathi-activity-days')) {
      try {
        const days = Array.from(new Set([...(JSON.parse(remote[k]) as string[]), ...(JSON.parse(local[k]) as string[])]));
        out[k] = JSON.stringify(days.sort());
      } catch {
        // keep remote
      }
    } else if (k.startsWith('stem-saathi-prefs')) out[k] = local[k]; // keep this phone's language/accessibility
  }
  return out;
}

function applySnapshot(snap: Record<string, string>) {
  for (const [k, v] of Object.entries(snap)) safeSet(k, v);
}

// ---------- API ----------
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function signUp(username: string, password: string, profile: StudentProfile) {
  const snapshot = collectSnapshot();
  const r = await api<{ token: string; account: PublicAccount }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, profile, snapshot }),
  });
  setSession(r.token, r.account);
  lastPushed = JSON.stringify(snapshot);
  syncState = 'saved';
  lastSavedAt = r.account.snapshotUpdatedAt;
  startAutoSync();
  return r.account;
}

/** Logs in, merges the account's saved data with this phone's, and saves the result back. */
export async function logIn(username: string, password: string) {
  const r = await api<{ token: string; account: PublicAccount; snapshot: Record<string, string> }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  );
  setSession(r.token, r.account);
  const merged = mergeSnapshots(collectSnapshot(), r.snapshot ?? {});
  applySnapshot(merged);
  lastPushed = '';
  await pushNow();
  return r.account;
}

export async function refreshAccount(): Promise<PublicAccount | null> {
  if (!getToken()) return null;
  try {
    const r = await api<{ account: PublicAccount }>('/api/account');
    safeSet(ACCOUNT_KEY, JSON.stringify(r.account));
    lastSavedAt = r.account.snapshotUpdatedAt;
    emit();
    return r.account;
  } catch (e) {
    if ((e as { status?: number }).status === 401) clearSession();
    return getCachedAccount();
  }
}

export async function updateProfile(profile: StudentProfile) {
  const r = await api<{ account: PublicAccount }>('/api/account/profile', {
    method: 'PUT',
    body: JSON.stringify({ profile }),
  });
  safeSet(ACCOUNT_KEY, JSON.stringify(r.account));
  emit();
  return r.account;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  await api('/api/account/password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) });
}

export async function pushNow(): Promise<void> {
  if (!getToken()) return;
  const snapshot = collectSnapshot();
  const json = JSON.stringify(snapshot);
  if (json === lastPushed) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    syncState = 'offline';
    emit();
    return;
  }
  syncState = 'saving';
  emit();
  try {
    const r = await api<{ snapshotUpdatedAt: string }>('/api/account/snapshot', {
      method: 'PUT',
      body: JSON.stringify({ snapshot }),
    });
    lastPushed = json;
    lastSavedAt = r.snapshotUpdatedAt;
    syncState = 'saved';
  } catch (e) {
    if ((e as { status?: number }).status === 401) clearSession();
    syncState = navigator.onLine === false ? 'offline' : 'error';
  }
  emit();
}

/** Save changes every 15 s while logged in, plus when the app is hidden or the network returns. */
export function startAutoSync() {
  if (timer != null || typeof window === 'undefined') return;
  const tick = () => void pushNow();
  timer = window.setInterval(tick, 15_000);
  window.addEventListener('online', tick);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') tick();
  });
  tick();
}

export async function logOut(clearPhone: boolean) {
  await pushNow().catch(() => undefined);
  try {
    await api('/api/auth/logout', { method: 'POST' });
  } catch {
    // offline: the token is still removed from this phone
  }
  clearSession();
  if (clearPhone) {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
}
