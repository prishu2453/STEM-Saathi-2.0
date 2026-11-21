/**
 * Student accounts.
 * - Hosted (DATABASE_URL set, e.g. Render/Neon PostgreSQL): stored in two tables, so logins survive restarts.
 * - Local (no DATABASE_URL): stored in a JSON file (data/accounts.json, git-ignored).
 * - Passwords are hashed with scrypt + per-user salt; plain passwords are never stored.
 * - Session tokens are random 32-byte values; only their SHA-256 hash is stored.
 * - Login attempts are rate-limited per username and per IP.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

interface AccountRecord {
  id: string;
  username: string;
  passwordHash: string; // scrypt$N$salt$hash
  profile: StudentProfile;
  snapshot: Record<string, string>;
  snapshotUpdatedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  /** scrypt hash of the one-time recovery code (for "Forgot password") */
  recoveryHash?: string;
}

interface SessionRecord {
  tokenHash: string;
  accountId: string;
  expiresAt: number;
}

interface DbShape {
  accounts: AccountRecord[];
  sessions: SessionRecord[];
}

export interface PublicAccount {
  id: string;
  username: string;
  profile: StudentProfile;
  createdAt: string;
  snapshotUpdatedAt: string | null;
  hasRecoveryCode: boolean;
}

const DATA_DIR = process.env.ACCOUNTS_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'accounts.json');
const SESSION_DAYS = 90;
export const MAX_SNAPSHOT_BYTES = 2_000_000;

let db: DbShape | null = null;
let writeChain: Promise<void> = Promise.resolve();

/* ---------- storage driver ---------- */
type SessionOp =
  | { t: 'add'; s: SessionRecord }
  | { t: 'del'; hash: string }
  | { t: 'delAccountExcept'; accountId: string; keep: string }
  | { t: 'prune'; now: number };
const dirtyAccounts = new Set<string>();
let sessionOps: SessionOp[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null; // pg.Pool when DATABASE_URL is set

function loadFile(): DbShape {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as DbShape;
    return { accounts: parsed.accounts ?? [], sessions: parsed.sessions ?? [] };
  } catch {
    return { accounts: [], sessions: [] };
  }
}

/** Call once before the server starts listening. */
export async function initAccountStore(): Promise<'postgres' | 'file'> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    db = loadFile();
    return 'file';
  }
  const { default: pg } = await import('pg');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  pool = new pg.Pool({ connectionString: url, max: 5, ssl: local || /sslmode=disable/.test(url) ? false : { rejectUnauthorized: false } });
  await pool.query(`CREATE TABLE IF NOT EXISTS ss_accounts (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ss_sessions (
    token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at BIGINT NOT NULL)`);
  await pool.query('DELETE FROM ss_sessions WHERE expires_at < $1', [Date.now()]);
  const accs = await pool.query('SELECT data FROM ss_accounts');
  const sess = await pool.query('SELECT token_hash, account_id, expires_at FROM ss_sessions');
  db = {
    accounts: accs.rows.map((r: { data: AccountRecord }) => r.data),
    sessions: sess.rows.map((r: { token_hash: string; account_id: string; expires_at: string }) => ({
      tokenHash: r.token_hash,
      accountId: r.account_id,
      expiresAt: Number(r.expires_at),
    })),
  };
  return 'postgres';
}

function load(): DbShape {
  if (!db) db = loadFile();
  return db;
}
const markAccount = (rec: AccountRecord) => dirtyAccounts.add(rec.id);
const sessionOp = (op: SessionOp) => sessionOps.push(op);

/** Save pending changes. File: atomic rewrite. Postgres: only changed rows, in one transaction. */
function persist(): Promise<void> {
  if (!pool) {
    dirtyAccounts.clear();
    sessionOps = [];
    const snapshot = JSON.stringify(load());
    writeChain = writeChain.then(async () => {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${process.pid}.tmp`;
      await fs.promises.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.promises.rename(tmp, DB_FILE);
    });
    return writeChain;
  }
  const accounts = [...dirtyAccounts].map((id) => load().accounts.find((a) => a.id === id)).filter(Boolean) as AccountRecord[];
  const rows = accounts.map((a) => [a.id, a.username, JSON.stringify(a)]);
  const ops = sessionOps;
  dirtyAccounts.clear();
  sessionOps = [];
  writeChain = writeChain.then(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [id, username, data] of rows) {
        await client.query(
          `INSERT INTO ss_accounts (id, username, data, updated_at) VALUES ($1, $2, $3, now())
           ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, data = EXCLUDED.data, updated_at = now()`,
          [id, username, data]
        );
      }
      for (const op of ops) {
        if (op.t === 'add')
          await client.query('INSERT INTO ss_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
            op.s.tokenHash,
            op.s.accountId,
            op.s.expiresAt,
          ]);
        else if (op.t === 'del') await client.query('DELETE FROM ss_sessions WHERE token_hash = $1', [op.hash]);
        else if (op.t === 'delAccountExcept')
          await client.query('DELETE FROM ss_sessions WHERE account_id = $1 AND token_hash <> $2', [op.accountId, op.keep]);
        else await client.query('DELETE FROM ss_sessions WHERE expires_at < $1', [op.now]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  });
  return writeChain;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384 }).toString('hex');
  return `scrypt$16384$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [, n, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64, { N: Number(n) || 16384 });
  const expected = Buffer.from(hash, 'hex');
  return expected.length === test.length && crypto.timingSafeEqual(expected, test);
}

// A dummy hash so unknown usernames take the same time as wrong passwords.
const DUMMY_HASH = hashPassword(crypto.randomBytes(8).toString('hex'));

export function normalizeUsername(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

/** Username: 3–30 of a–z, 0–9, dot, underscore; or a 10-digit mobile number. */
export function validateUsername(u: string): string | null {
  if (/^[0-9]{10}$/.test(u)) return null;
  if (/^[a-z0-9._]{3,30}$/.test(u)) return null;
  return 'Use 3–30 letters, numbers, dot or underscore — or a 10-digit mobile number.';
}

export function validatePassword(p: unknown): string | null {
  if (typeof p !== 'string' || p.length < 6) return 'Password must be at least 6 characters.';
  if (p.length > 128) return 'Password is too long.';
  return null;
}

const PROFILE_FIELDS: (keyof StudentProfile)[] = [
  'fullName',
  'classLevel',
  'board',
  'stateName',
  'school',
  'district',
  'language',
  'role',
];

export function cleanProfile(input: unknown): StudentProfile {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const k of PROFILE_FIELDS) {
    const v = src[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 120);
  }
  if (out.role && !['student', 'teacher', 'parent'].includes(out.role)) delete out.role;
  return { fullName: out.fullName ?? '', ...out } as StudentProfile;
}

/** Only keep string values under the app's own storage prefix. */
export function cleanSnapshot(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== 'object') return null;
  const out: Record<string, string> = {};
  let size = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!k.startsWith('stem-saathi-') || typeof v !== 'string') continue;
    size += k.length + v.length;
    if (size > MAX_SNAPSHOT_BYTES) return null;
    out[k] = v;
  }
  return out;
}

const toPublic = (a: AccountRecord): PublicAccount => ({
  id: a.id,
  username: a.username,
  profile: a.profile,
  createdAt: a.createdAt,
  snapshotUpdatedAt: a.snapshotUpdatedAt,
  hasRecoveryCode: Boolean(a.recoveryHash),
});

/* ---------- recovery codes ("Forgot password" without email or SMS) ---------- */
// No 0/O, 1/I/L, 5/S to avoid copying mistakes. 12 characters ≈ 58 bits.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789';
function newRecoveryCode(): string {
  const bytes = crypto.randomBytes(12);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}
export const normalizeRecoveryCode = (raw: unknown) =>
  String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .slice(0, 24);
/** Give the account a fresh code (old one stops working). Returns the plain code to show once. */
function rotateRecoveryCode(rec: AccountRecord): string {
  const code = newRecoveryCode();
  rec.recoveryHash = hashPassword(normalizeRecoveryCode(code));
  markAccount(rec);
  return code;
}

function newSession(accountId: string): string {
  const token = crypto.randomBytes(32).toString('base64url');
  const d = load();
  const now = Date.now();
  d.sessions = d.sessions.filter((s) => s.expiresAt > now);
  const rec: SessionRecord = { tokenHash: sha256(token), accountId, expiresAt: now + SESSION_DAYS * 86_400_000 };
  d.sessions.push(rec);
  sessionOp({ t: 'prune', now });
  sessionOp({ t: 'add', s: rec });
  return token;
}

export async function createAccount(
  username: string,
  password: string,
  profile: StudentProfile,
  snapshot: Record<string, string> | null
): Promise<{ token: string; account: PublicAccount; recoveryCode: string } | { error: string; status: number }> {
  const d = load();
  if (d.accounts.some((a) => a.username === username)) {
    return { error: 'This username is already taken. Try another or log in.', status: 409 };
  }
  const now = new Date().toISOString();
  const rec: AccountRecord = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(password),
    profile,
    snapshot: snapshot ?? {},
    snapshotUpdatedAt: snapshot ? now : null,
    createdAt: now,
    lastLoginAt: now,
  };
  d.accounts.push(rec);
  markAccount(rec);
  const recoveryCode = rotateRecoveryCode(rec);
  const token = newSession(rec.id);
  await persist();
  return { token, account: toPublic(rec), recoveryCode };
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; account: PublicAccount; snapshot: Record<string, string> } | null> {
  const rec = load().accounts.find((a) => a.username === username);
  const ok = verifyPassword(password, rec?.passwordHash ?? DUMMY_HASH);
  if (!rec || !ok) return null;
  rec.lastLoginAt = new Date().toISOString();
  markAccount(rec);
  const token = newSession(rec.id);
  await persist();
  return { token, account: toPublic(rec), snapshot: rec.snapshot };
}

function accountForToken(token: string | undefined): AccountRecord | null {
  if (!token) return null;
  const d = load();
  const h = sha256(token);
  const s = d.sessions.find((x) => x.tokenHash === h && x.expiresAt > Date.now());
  return s ? d.accounts.find((a) => a.id === s.accountId) ?? null : null;
}

export function getAccount(token: string | undefined) {
  const rec = accountForToken(token);
  return rec ? { account: toPublic(rec), snapshot: rec.snapshot } : null;
}

/**
 * Accounts whose synced snapshot has `key` set to `value` (used for teacher class reports:
 * a student joins a class by saving the class code on their device). Server-side only.
 */
export function accountsWithSnapshotValue(key: string, value: string) {
  return load()
    .accounts.filter((a) => a.snapshot?.[key] === value)
    .map((a) => ({ id: a.id, profile: a.profile, snapshot: a.snapshot, snapshotUpdatedAt: a.snapshotUpdatedAt }));
}

export async function updateProfile(token: string | undefined, profile: StudentProfile) {
  const rec = accountForToken(token);
  if (!rec) return null;
  rec.profile = profile;
  markAccount(rec);
  await persist();
  return toPublic(rec);
}

export async function saveSnapshot(token: string | undefined, snapshot: Record<string, string>) {
  const rec = accountForToken(token);
  if (!rec) return null;
  rec.snapshot = snapshot;
  rec.snapshotUpdatedAt = new Date().toISOString();
  markAccount(rec);
  await persist();
  return rec.snapshotUpdatedAt;
}

export async function changePassword(token: string | undefined, oldPw: string, newPw: string) {
  const rec = accountForToken(token);
  if (!rec) return 'auth';
  if (!verifyPassword(oldPw, rec.passwordHash)) return 'wrong';
  rec.passwordHash = hashPassword(newPw);
  const keep = sha256(token!);
  // Sign out every other device after a password change.
  load().sessions = load().sessions.filter((s) => s.accountId !== rec.id || s.tokenHash === keep);
  markAccount(rec);
  sessionOp({ t: 'delAccountExcept', accountId: rec.id, keep });
  await persist();
  return 'ok';
}

/** Logged-in student creates a new recovery code (needs their current password). */
export async function createRecoveryCode(token: string | undefined, password: string) {
  const rec = accountForToken(token);
  if (!rec) return { error: 'auth' as const };
  if (!verifyPassword(password, rec.passwordHash)) return { error: 'wrong' as const };
  const recoveryCode = rotateRecoveryCode(rec);
  await persist();
  return { recoveryCode, account: toPublic(rec) };
}

/**
 * "Forgot password": username + recovery code → new password.
 * The used code stops working; a new one is returned. Every other device is logged out.
 */
export async function resetWithRecoveryCode(username: string, code: string, newPassword: string) {
  const rec = load().accounts.find((a) => a.username === username);
  const ok = verifyPassword(normalizeRecoveryCode(code), rec?.recoveryHash ?? DUMMY_HASH);
  if (!rec || !rec.recoveryHash || !ok) return null;
  rec.passwordHash = hashPassword(newPassword);
  const recoveryCode = rotateRecoveryCode(rec);
  load().sessions = load().sessions.filter((s) => s.accountId !== rec.id);
  sessionOp({ t: 'delAccountExcept', accountId: rec.id, keep: '' });
  rec.lastLoginAt = new Date().toISOString();
  const token = newSession(rec.id);
  await persist();
  return { token, account: toPublic(rec), snapshot: rec.snapshot, recoveryCode };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  const d = load();
  const h = sha256(token);
  d.sessions = d.sessions.filter((s) => s.tokenHash !== h);
  sessionOp({ t: 'del', hash: h });
  await persist();
}

// ---- simple in-memory limiter: blocks a key after too many failures ----
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILS = 10;
const WINDOW_MS = 15 * 60_000;
export function isBlocked(key: string, max = MAX_FAILS): boolean {
  const e = attempts.get(key);
  if (!e) return false;
  if (e.resetAt < Date.now()) {
    attempts.delete(key);
    return false;
  }
  return e.count >= max;
}
export function recordFailure(key: string) {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || e.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else e.count += 1;
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
