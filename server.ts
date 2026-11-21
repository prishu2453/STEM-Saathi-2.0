import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { askOtherProvider, NO_PROVIDER_MESSAGE, pickProvider } from './aiProviders';
import * as accounts from './accountStore';
import { registerTutorRoutes } from './tutorRoutes';
import { evaluateExpression, formatSig, parseLooseNumber } from './shared/mathEval';
import {
  getChapterById,
  getSyllabusMeta,
  queryExperiments,
  querySyllabus,
} from './shared/syllabus/index';
import type { SyllabusSubject } from './shared/syllabus/types';
import type {
  AcademicSession,
  ActivityModeFilter,
  EducationBoard,
  ExperimentRelationType,
  SchoolClass,
} from './src/types/stem';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

type MentorTier = 'fast' | 'general' | 'complex' | 'deep' | 'search';

const MENTOR_MODEL_MAP: Record<Exclude<MentorTier, 'search'>, { model: string; thinkingLevel: ThinkingLevel }> = {
  fast: { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  general: { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
  complex: { model: 'gemini-4-argon', thinkingLevel: ThinkingLevel.HIGH },
  deep: { model: 'gemini-4-carbon', thinkingLevel: ThinkingLevel.HIGH },
};

function extractReadableError(error: unknown): { status: number; message: string } {
  const raw = error instanceof Error ? error.message : String(error || 'Unable to reach AI service.');
  try {
    const parsed = JSON.parse(raw);
    const code = Number(parsed?.error?.code) || 500;
    const msg = String(parsed?.error?.message || raw);
    if (code === 503) {
      return { status: 503, message: 'The selected Gemini model is briefly busy. Please retry in a moment or switch to Fast (Flash Lite).' };
    }
    if (code === 429) {
      return { status: 429, message: 'Rate limit or quota reached for this tier. Check Settings > Secrets or try Balanced/Fast mode.' };
    }
    return { status: code >= 400 && code < 600 ? code : 500, message: msg };
  } catch {
    return { status: 500, message: raw };
  }
}

async function withTransientRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('ECONNRESET');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  throw lastErr;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getLanguageInstruction(language: string): string {
  if (language === 'hi') {
    return 'Respond in clear, natural Hindi (Devanagari script), keeping standard scientific symbols and SI units (like m/s, N, V, Ω, Hz, J) clear.';
  }
  if (language === 'kn') {
    return 'Respond in clear, natural Kannada (Kannada script), keeping standard scientific symbols and SI units (like m/s, N, V, Ω, Hz, J) clear.';
  }
  return 'Respond in clear, encouraging English suitable for school and undergraduate STEM students.';
}

function buildRoleInstruction(mentorRole: string, subject: string): string {
  if (mentorRole === 'Numerical Problem Coach') {
    return `Act as a rigorous ${subject} Numerical Problem Coach: break calculations into Given Data, Governing Formula, Step-by-Step Substitution, and Final Answer with SI units.`;
  }
  if (mentorRole === 'Virtual Lab Instructor') {
    return `Act as a hands-on ${subject} Virtual Lab Instructor: guide experimental setup, variables to measure, common sources of error, and observation table checks.`;
  }
  if (mentorRole === 'Science Research Assistant') {
    return `Act as an up-to-date ${subject} Science Research Assistant: use grounded current scientific facts, recent discoveries, and real-world applications clearly.`;
  }
  return `Act as Gyaan Graph's AI ${subject} Concept Tutor — a patient, inclusive science mentor using everyday analogies, accurate formulas, and a quick check question.`;
}

async function startServer() {
  const app = express();
  // Hosts like Render put a proxy in front: trust it so rate limits see the real visitor IP.
  app.set('trust proxy', 1);

  // The GitHub Pages website calls this API from another origin. Allow only known sites.
  // ALLOWED_ORIGINS = comma-separated list, e.g. "https://prishu2453.github.io"
  const allowedOrigins = new Set(
    (process.env.ALLOWED_ORIGINS || 'https://prishu2453.github.io')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  );
  const isAllowedOrigin = (origin: string) =>
    allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(origin && isAllowedOrigin(origin) ? 204 : 403);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  // ---------------- Student accounts (username/mobile + password) ----------------
  const bearer = (req: express.Request) => {
    const h = req.headers.authorization || '';
    return h.startsWith('Bearer ') ? h.slice(7).trim() : undefined;
  };
  const noStore = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  };
  app.use('/api/auth', noStore);
  app.use('/api/account', noStore);

  // ---------------- Natural (AI) voice for the tutor ----------------
  // English: Groq Orpheus (needs GROQ_API_KEY + the model's terms accepted once in the Groq console).
  // Hindi / Kannada (and English fallback): Gemini TTS (needs GEMINI_API_KEY).
  // Anything that fails → the app uses the phone's own voice.
  const GROQ_TTS_MODEL = process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english';
  const GROQ_VOICES = ['hannah', 'diana', 'autumn', 'austin', 'daniel', 'troy'];
  const GEMINI_VOICES = ['Sulafat', 'Aoede', 'Achird', 'Kore'];
  const hasGemini = () => Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasGroq = () => Boolean(process.env.GROQ_API_KEY);
  // Learned from real calls: null = not tried yet, otherwise whether Groq TTS works and why not.
  let groqTts: { ok: boolean; reason?: string; checkedAt: number } | null = null;

  async function groqSpeech(text: string, voice: string): Promise<Buffer> {
    const r = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_TTS_MODEL, input: text, voice, response_format: 'wav' }),
    });
    if (!r.ok) {
      const body = await r.text();
      const err = new Error(body.slice(0, 400)) as Error & { status?: number; terms?: boolean };
      err.status = r.status;
      err.terms = /terms/i.test(body);
      throw err;
    }
    return Buffer.from(await r.arrayBuffer());
  }

  function speechEngineFor(language: string): 'groq' | 'gemini' | null {
    if (language === 'en' && hasGroq() && groqTts?.ok !== false) return 'groq';
    if (hasGemini()) return 'gemini';
    if (language === 'en' && hasGroq() && groqTts && Date.now() - groqTts.checkedAt > 10 * 60_000) return 'groq'; // retry later
    return null;
  }

  // One tiny check (cached) so the app knows straight away whether the English AI voice is switched on.
  let groqProbe: Promise<void> | null = null;
  const probeGroq = () => {
    if (!hasGroq() || (groqTts && Date.now() - groqTts.checkedAt < 10 * 60_000)) return Promise.resolve();
    groqProbe ??= groqSpeech('Hi.', 'hannah')
      .then(() => void (groqTts = { ok: true, checkedAt: Date.now() }))
      .catch((e: Error & { status?: number; terms?: boolean }) => {
        const hard = e.terms || e.status === 401 || e.status === 403 || e.status === 404;
        groqTts = { ok: !hard, reason: e.terms ? 'terms' : String(e.status), checkedAt: Date.now() };
      })
      .finally(() => void (groqProbe = null));
    return groqProbe;
  };

  app.get('/api/mentor/speech/status', noStore, async (_req, res) => {
    await Promise.race([probeGroq(), new Promise((r) => setTimeout(r, 6000))]);
    const engine = (lang: string) => speechEngineFor(lang);
    res.json({
      engines: { en: engine('en'), hi: engine('hi'), kn: engine('kn') },
      voices: { groq: GROQ_VOICES, gemini: GEMINI_VOICES },
      groqNeedsTerms: groqTts?.ok === false && groqTts.reason === 'terms',
    });
  });

  const ttsRequestBuckets = new Map<string, { count: number; resetAt: number }>();
  app.post('/api/mentor/speech', noStore, async (req, res) => {
    const now = Date.now();
    const ip = req.ip || 'unknown';
    const bucket = ttsRequestBuckets.get(ip);
    // the app sends one sentence per request, so allow a generous number per minute
    if (bucket && bucket.resetAt > now && bucket.count >= 90) {
      res.status(429).json({ error: 'Natural voice is busy. Using the device voice for now.' });
      return;
    }
    if (!bucket || bucket.resetAt <= now) ttsRequestBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    else bucket.count += 1;

    const { text, language = 'en', voiceName } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required for speech.' });
      return;
    }
    const engine = speechEngineFor(language);
    if (!engine) {
      res.status(503).json({
        error:
          language === 'en'
            ? 'Natural voice is not set up on the server.'
            : 'Natural voice for Hindi and Kannada needs a Gemini key on the server.',
      });
      return;
    }

    try {
      if (engine === 'groq') {
        if (text.length > 200) {
          res.status(413).json({ error: 'Send at most 200 characters per request.' });
          return;
        }
        const voice = GROQ_VOICES.includes(String(voiceName)) ? String(voiceName) : 'hannah';
        const wav = await groqSpeech(text.trim(), voice);
        groqTts = { ok: true, checkedAt: Date.now() };
        res.json({ audioBase64: wav.toString('base64'), mimeType: 'audio/wav', engine });
        return;
      }

      if (text.length > 5000) {
        res.status(413).json({ error: 'This answer is too long for natural voice.' });
        return;
      }
      const languageCode = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
      const selectedVoice = GEMINI_VOICES.includes(String(voiceName)) ? String(voiceName) : 'Sulafat';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, httpOptions: { apiVersion: 'v1beta' } });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [{
          role: 'user',
          parts: [{
            text: text.trim(),
            speechMetadata: {
              style: `Warm, natural, friendly science teacher speaking clearly and unhurriedly to a school student. Use a natural ${languageCode} pronunciation. Read only the supplied words.`,
            },
          }],
        }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { languageCode, voiceConfig: { voice: selectedVoice } },
        },
      } as any);
      const audioPart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
      const audioBase64 = audioPart?.inlineData?.data;
      if (!audioBase64) {
        res.status(502).json({ error: 'Natural voice returned no audio.' });
        return;
      }
      res.json({ audioBase64, mimeType: audioPart?.inlineData?.mimeType || 'audio/wav', engine });
    } catch (error) {
      const e = error as Error & { status?: number; terms?: boolean };
      const raw = e.message || String(error);
      if (engine === 'groq') {
        groqTts = { ok: !(e.terms || e.status === 401 || e.status === 403 || e.status === 404), reason: e.terms ? 'terms' : String(e.status), checkedAt: Date.now() };
      }
      const status = e.status === 429 || /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw) ? 429 : 502;
      console.error('AI Mentor speech error:', engine, status, raw.slice(0, 300));
      res.status(status).json({
        error: e.terms
          ? 'The natural English voice must be switched on once in the Groq console (accept the Orpheus terms).'
          : status === 429
            ? 'Natural voice limit reached for now.'
            : 'Natural voice could not be generated.',
      });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    const ipKey = `signup:${req.ip}`;
    if (accounts.isBlocked(ipKey, 30)) {
      return res.status(429).json({ error: 'Too many new accounts from this network. Try again in 15 minutes.' });
    }
    const username = accounts.normalizeUsername(req.body?.username);
    const uErr = accounts.validateUsername(username);
    if (uErr) return res.status(400).json({ error: uErr });
    const pErr = accounts.validatePassword(req.body?.password);
    if (pErr) return res.status(400).json({ error: pErr });
    const profile = accounts.cleanProfile(req.body?.profile);
    if (!profile.fullName) return res.status(400).json({ error: 'Please enter your name.' });
    const snapshot = req.body?.snapshot ? accounts.cleanSnapshot(req.body.snapshot) : null;
    const result = await accounts.createAccount(username, req.body.password, profile, snapshot);
    if ('error' in result) return res.status(result.status).json({ error: result.error });
    accounts.recordFailure(ipKey); // counts sign-ups per network (max 30 per 15 min)
    res.status(201).json(result);
  });

  app.post('/api/auth/login', async (req, res) => {
    const username = accounts.normalizeUsername(req.body?.username);
    const keys = [`login-ip:${req.ip}`, `login-user:${username}`];
    // A whole school can share one IP, so the network limit is looser than the per-username one.
    if (accounts.isBlocked(keys[0], 60) || accounts.isBlocked(keys[1], 10)) {
      return res.status(429).json({ error: 'Too many wrong tries. Please wait 15 minutes and try again.' });
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const result = username && password ? await accounts.login(username, password) : null;
    if (!result) {
      keys.forEach((k) => accounts.recordFailure(k));
      return res.status(401).json({ error: 'Wrong username or password.' });
    }
    keys.forEach((k) => accounts.clearFailures(k));
    res.json(result);
  });

  app.post('/api/auth/logout', async (req, res) => {
    await accounts.logout(bearer(req));
    res.json({ ok: true });
  });

  app.get('/api/account', (req, res) => {
    const found = accounts.getAccount(bearer(req));
    if (!found) return res.status(401).json({ error: 'Please log in again.' });
    res.json(found);
  });

  app.put('/api/account/profile', async (req, res) => {
    const profile = accounts.cleanProfile(req.body?.profile);
    if (!profile.fullName) return res.status(400).json({ error: 'Please enter your name.' });
    const account = await accounts.updateProfile(bearer(req), profile);
    if (!account) return res.status(401).json({ error: 'Please log in again.' });
    res.json({ account });
  });

  app.put('/api/account/snapshot', async (req, res) => {
    const snapshot = accounts.cleanSnapshot(req.body?.snapshot);
    if (!snapshot) return res.status(413).json({ error: 'Saved data is too large.' });
    const at = await accounts.saveSnapshot(bearer(req), snapshot);
    if (!at) return res.status(401).json({ error: 'Please log in again.' });
    res.json({ snapshotUpdatedAt: at });
  });

  app.post('/api/account/password', async (req, res) => {
    const pErr = accounts.validatePassword(req.body?.newPassword);
    if (pErr) return res.status(400).json({ error: pErr });
    const r = await accounts.changePassword(bearer(req), String(req.body?.oldPassword ?? ''), req.body.newPassword);
    if (r === 'auth') return res.status(401).json({ error: 'Please log in again.' });
    if (r === 'wrong') return res.status(400).json({ error: 'Current password is wrong.' });
    res.json({ ok: true });
  });

  // Forgot password: username + recovery code (no email/SMS needed for rural students)
  app.post('/api/auth/reset', async (req, res) => {
    const username = accounts.normalizeUsername(req.body?.username);
    const keys = [`reset-ip:${req.ip}`, `reset-user:${username}`];
    if (accounts.isBlocked(keys[0], 30) || accounts.isBlocked(keys[1], 5)) {
      return res.status(429).json({ error: 'Too many wrong tries. Please wait 15 minutes and try again.' });
    }
    const pErr = accounts.validatePassword(req.body?.newPassword);
    if (pErr) return res.status(400).json({ error: pErr });
    const result = username ? await accounts.resetWithRecoveryCode(username, String(req.body?.recoveryCode ?? ''), req.body.newPassword) : null;
    if (!result) {
      keys.forEach((k) => accounts.recordFailure(k));
      return res.status(400).json({ error: 'Username or recovery code is wrong.' });
    }
    keys.forEach((k) => accounts.clearFailures(k));
    res.json(result);
  });

  app.post('/api/account/recovery-code', async (req, res) => {
    const r = await accounts.createRecoveryCode(bearer(req), String(req.body?.password ?? ''));
    if ('error' in r) {
      return r.error === 'auth'
        ? res.status(401).json({ error: 'Please log in again.' })
        : res.status(400).json({ error: 'Password is wrong.' });
    }
    res.json(r);
  });

  // Adaptive tutor (diagnostic, misconceptions, question generation) and teacher class reports
  registerTutorRoutes(app, { bearer });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', platform: 'Gyaan Graph', timestamp: new Date().toISOString() });
  });

  app.get('/api/mentor/status', (_req, res) => {
    const provider = pickProvider();
    res.json({ configured: !!provider, provider });
  });

  app.get('/api/syllabus/meta', (_req, res) => {
    res.json(getSyllabusMeta());
  });

  app.get('/api/syllabus', (req, res) => {
    const rawClass = Number(req.query.classLevel || 8);
    const classLevel: SchoolClass =
      rawClass >= 6 && rawClass <= 12 ? (rawClass as SchoolClass) : 8;
    const rawBoard = String(req.query.board || 'cbse');
    const board: EducationBoard =
      rawBoard === 'cbse' || rawBoard === 'cisce' || rawBoard === 'state' ? rawBoard : 'cbse';
    const stateName = typeof req.query.stateName === 'string' ? req.query.stateName : undefined;
    const rawSession = String(req.query.session || '2025-26');
    const session: AcademicSession = rawSession === '2024-25' ? '2024-25' : '2025-26';
    const rawSubject = String(req.query.subject || 'all');
    const subject: SyllabusSubject | 'all' =
      rawSubject === 'physics' || rawSubject === 'chemistry' || rawSubject === 'biology'
        ? rawSubject
        : 'all';

    res.json(querySyllabus({ classLevel, board, stateName, session, subject }));
  });

  app.get('/api/syllabus/chapter/:chapterId', (req, res) => {
    const match = getChapterById(String(req.params.chapterId || ''));
    if (!match) {
      res.status(404).json({ error: 'Chapter not found.' });
      return;
    }
    res.json({
      chapter: match.chapter,
      syllabusMeta: {
        academicYearLabel: match.record.academicYearLabel,
        syllabusVersionLabel: match.record.syllabusVersionLabel,
        textbookName: match.record.textbookName,
        sourceTitle: match.record.sourceTitle,
        sourceUrl: match.record.sourceUrl,
        lastVerified: match.record.lastVerified,
      },
    });
  });

  app.get('/api/experiments', (req, res) => {
    const rawClass = req.query.classLevel ? Number(req.query.classLevel) : null;
    const classLevel: SchoolClass | 'all' =
      rawClass && rawClass >= 6 && rawClass <= 12 ? (rawClass as SchoolClass) : 'all';
    const rawBoard = String(req.query.board || 'all');
    const board: EducationBoard | 'all' =
      rawBoard === 'cbse' || rawBoard === 'cisce' || rawBoard === 'state' ? rawBoard : 'all';
    const stateName = typeof req.query.stateName === 'string' ? req.query.stateName : undefined;
    const rawSubject = String(req.query.subject || 'all');
    const subject: SyllabusSubject | 'all' =
      rawSubject === 'physics' || rawSubject === 'chemistry' || rawSubject === 'biology'
        ? rawSubject
        : 'all';
    const chapterId = typeof req.query.chapterId === 'string' ? req.query.chapterId : undefined;
    const rawRel = String(req.query.relationType || 'all');
    const relationType: ExperimentRelationType | 'all' =
      rawRel === 'official-practical' || rawRel === 'in-chapter' || rawRel === 'related-activity'
        ? rawRel
        : 'all';
    const rawMode = String(req.query.activityMode || 'all');
    const activityMode: Exclude<ActivityModeFilter, 'offline-saved'> =
      rawMode === 'home-safe' || rawMode === 'virtual-sim' || rawMode === 'school-lab'
        ? rawMode
        : 'all';
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;

    const experiments = queryExperiments({
      classLevel,
      board,
      stateName,
      subject,
      chapterId,
      relationType,
      activityMode,
      q,
    });
    res.json({ experiments });
  });

  app.post('/api/mentor/ask', async (req, res) => {
    try {
      const {
        message,
        subject = 'Physics',
        language = 'en',
        level = 'Secondary',
        tier = 'general',
        mentorRole = 'Concept Tutor',
        useSearch = false,
        history = [],
        experimentContext = '',
      } = req.body ?? {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Please enter a STEM question for the mentor.' });
        return;
      }

      const selectedTier: MentorTier =
        tier === 'fast' || tier === 'general' || tier === 'complex' || tier === 'deep' || tier === 'search'
          ? tier
          : 'general';
      const searchEnabled = Boolean(useSearch) || selectedTier === 'search';

      const provider = pickProvider();
      if (!provider) {
        res.status(503).json({ error: NO_PROVIDER_MESSAGE });
        return;
      }
      const ai = provider === 'gemini' ? getGeminiClient() : (null as unknown as GoogleGenAI);
      const langRule = getLanguageInstruction(language);
      const roleRule = buildRoleInstruction(mentorRole, subject);
      const systemInstruction = `${roleRule} ${langRule} Target grade level: ${level}. Keep formatting clean and easy to read. Do not use LaTeX; write formulas in plain text such as R = v² sin(2θ) / g. Do not use tables; answer in short sentences and simple bullet points, because the answer may be read aloud.${
        typeof experimentContext === 'string' && experimentContext.trim()
          ? ` The student is currently using this simulation — ground your answer in it: ${experimentContext.trim().slice(0, 1500)}`
          : ''
      }`;

      // Normalize alternating multi-turn conversation history starting with a user turn
      const normalizedHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-14)) {
          if (typeof item?.text !== 'string' || !item.text.trim()) continue;
          const nextRole: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';
          if (normalizedHistory.length === 0 && nextRole === 'model') continue;
          const prev = normalizedHistory[normalizedHistory.length - 1];
          if (prev && prev.role === nextRole) {
            prev.parts[0].text += `\n${item.text.trim()}`;
          } else {
            normalizedHistory.push({ role: nextRole, parts: [{ text: item.text.trim() }] });
          }
        }
        // chats.create history should end with model if non-empty
        if (normalizedHistory.length > 0 && normalizedHistory[normalizedHistory.length - 1].role === 'user') {
          normalizedHistory.pop();
        }
      }

      if (provider !== 'gemini') {
        const { reply, model } = await askOtherProvider(
          provider,
          systemInstruction,
          normalizedHistory.map((m) => ({ role: m.role, text: m.parts[0].text })),
          message.trim()
        );
        if (!reply) {
          res.status(502).json({ error: 'No response returned from the AI provider.' });
          return;
        }
        res.json({ reply, subject, language, model, tier: selectedTier, sources: [], provider });
        return;
      }

      if (searchEnabled) {
        const contents = [
          ...normalizedHistory,
          { role: 'user' as const, parts: [{ text: message.trim() }] },
        ];

        const response = await withTransientRetry(() =>
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              tools: [{ googleSearch: {} }],
            },
          })
        );

        const reply = response.text?.trim();
        if (!reply) {
          res.status(502).json({ error: 'No response returned from Search-grounded Gemini.' });
          return;
        }

        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const seenUris = new Set<string>();
        const sources: { title: string; uri: string }[] = [];
        for (const chunk of rawChunks) {
          const uri = chunk?.web?.uri;
          if (typeof uri === 'string' && uri.startsWith('http') && !seenUris.has(uri)) {
            seenUris.add(uri);
            sources.push({
              title: (chunk.web?.title || uri).trim(),
              uri,
            });
          }
        }

        res.json({
          reply,
          subject,
          language,
          model: 'gemini-4-hydrogen',
          tier: selectedTier,
          sources: sources.slice(0, 6),
        });
        return;
      }

      const tierKey = selectedTier as Exclude<MentorTier, 'search'>;
      const { model, thinkingLevel } = MENTOR_MODEL_MAP[tierKey];

      const response = await withTransientRetry(async () => {
        const chat = ai.chats.create({
          model,
          history: normalizedHistory,
          config: {
            thinkingConfig: { thinkingLevel },
            systemInstruction,
          },
        });
        return chat.sendMessage({ message: message.trim() });
      }).catch(async (err) => {
        const m = err instanceof Error ? err.message : String(err);
        if (!/404|NOT_FOUND/.test(m) || model === 'gemini-4-hydrogen') throw err;
        const chat = ai.chats.create({
          model: 'gemini-4-hydrogen',
          history: normalizedHistory,
          config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, systemInstruction },
        });
        return chat.sendMessage({ message: message.trim() });
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'No response returned from the AI mentor.' });
        return;
      }

      res.json({ reply, subject, language, model, tier: selectedTier, sources: [] });
    } catch (error) {
      const { status, message: cleanMsg } = extractReadableError(error);
      console.error('AI Mentor error:', cleanMsg);
      res.status(status).json({ error: cleanMsg });
    }
  });

  app.post('/api/physics/solve', async (req, res) => {
    try {
      const { problem, topic = 'Mechanics', language = 'en' } = req.body ?? {};
      if (!problem || typeof problem !== 'string' || !problem.trim()) {
        res.status(400).json({ error: 'Please enter a Physics numerical problem to solve.' });
        return;
      }
      if (problem.length > 2000) {
        res.status(400).json({ error: 'Problem is too long. Please keep it under 2000 characters.' });
        return;
      }
      const provider = pickProvider();
      if (!provider) {
        res.status(503).json({ error: NO_PROVIDER_MESSAGE });
        return;
      }

      const langRule = getLanguageInstruction(language);
      const system = `You are a careful Physics Numerical Solver for school students (Class 6-12). ${langRule}
Solve the problem exactly. Convert every quantity to SI units first. Use g = 9.8 m/s^2 unless the problem gives another value.
Reply with ONLY one JSON object, no markdown, no code fences, with these keys:
{
  "given": [list of strings, each "symbol = value unit" in SI, plus "To find: ..."],
  "formula": "the governing formula in plain text, e.g. v = u + a*t",
  "steps": [ordered strings: rearranging, substituting numbers with units, simplifying; write each intermediate result. Use normal school notation here like sin 35°, √(2gh), 3 × 10^8 — NOT calculator words like sind()],
  "calculation": "ONE plain arithmetic expression using only numbers (SI values) that gives the final answer, e.g. 0.5*2*9.8^2. Allowed: + - * / ^ ( ) sqrt() sin() cos() tan() (radians), sind() cosd() tand() (degrees), ln() log10() exp() pi. No variables, no units, no words.",
  "finalAnswer": "the final numerical value only",
  "unit": "SI unit of the answer",
  "verificationTip": "one short check: units/dimensions or a common-sense estimate"
}
If the problem asks for more than one quantity, put the main asked quantity in calculation/finalAnswer and mention the others in steps.
If the problem is not a physics numerical or is missing data, set "finalAnswer" to "" and explain what is missing in "verificationTip".
Do not use LaTeX.${
        language === 'hi'
          ? ' Write every text value (given, steps, verificationTip, "To find") in Hindi (Devanagari). Keep symbols, numbers and SI units as they are. The JSON keys stay in English.'
          : language === 'kn'
            ? ' Write every text value (given, steps, verificationTip, "To find") in Kannada script. Keep symbols, numbers and SI units as they are. The JSON keys stay in English.'
            : ''
      }`;
      const userMsg = `Topic: ${topic}\nProblem: ${problem.trim()}`;

      let text = '';
      let model = '';
      if (provider === 'gemini') {
        const ai = getGeminiClient();
        model = 'gemini-4-hydrogen';
        const response = await ai.models.generateContent({
          model,
          contents: userMsg,
          config: { systemInstruction: system, responseMimeType: 'application/json' },
        });
        text = response.text ?? '';
      } else {
        // Free AI plans allow only a few requests per minute: wait and retry once if we hit that limit.
        let r: { reply: string; model: string };
        try {
          r = await askOtherProvider(provider, system, [], userMsg);
        } catch (err) {
          const msg = err instanceof Error ? err.message : '';
          if (!/rate limit|429|too many/i.test(msg)) throw err;
          const wait = Math.min(15, parseFloat(/try again in ([\d.]+)s/i.exec(msg)?.[1] ?? '8') + 0.5);
          await new Promise((ok) => setTimeout(ok, wait * 1000));
          try {
            r = await askOtherProvider(provider, system, [], userMsg);
          } catch {
            res.status(429).json({
              error: 'Many students are using the solver right now. Please wait about 30 seconds and try again.',
            });
            return;
          }
        }
        text = r.reply;
        model = r.model;
      }

      // Pull the JSON object out even if the model wrapped it in prose or a code fence.
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first < 0 || last <= first) throw new Error('The solver returned an unreadable answer. Please try again.');
      const parsed = JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
      const asList = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)) : v ? [String(v)] : []);
      const result = {
        given: asList(parsed.given),
        formula: String(parsed.formula ?? ''),
        steps: asList(parsed.steps),
        finalAnswer: String(parsed.finalAnswer ?? ''),
        unit: String(parsed.unit ?? ''),
        verificationTip: String(parsed.verificationTip ?? ''),
        calculation: String(parsed.calculation ?? ''),
        calculatorChecked: false,
        modelAnswer: undefined as string | undefined,
        model,
      };

      // Re-do the final arithmetic with a real calculator instead of trusting the model.
      if (result.calculation && result.finalAnswer) {
        try {
          const value = evaluateExpression(result.calculation);
          if (Number.isFinite(value)) {
            const claimed = parseLooseNumber(result.finalAnswer);
            const formatted = formatSig(value, 4);
            const differs =
              claimed === null || Math.abs(claimed - value) > Math.max(1e-12, Math.abs(value) * 0.01);
            if (differs) result.modelAnswer = result.finalAnswer;
            result.finalAnswer = formatted;
            result.calculatorChecked = true;
          }
        } catch {
          // expression not parseable — keep the model's answer, shown as unchecked
        }
      }
      res.json(result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unable to solve numerical problem.';
      console.error('Physics solver error:', errMsg);
      res.status(500).json({ error: 'The solver could not finish this problem. Please check the numbers and try again.' });
    }
  });

  app.post('/api/audio/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body ?? {};
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        res.status(400).json({ error: 'Audio recording data is required for transcription.' });
        return;
      }

      // No Gemini key? Use Whisper on Groq (free tier) or OpenAI with the key you already set.
      const geminiReady = Boolean(process.env.GEMINI_API_KEY) && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
      const whisperKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
      if (!geminiReady && whisperKey) {
        const useGroq = Boolean(process.env.GROQ_API_KEY);
        const ext = String(mimeType).includes('webm') ? 'webm' : String(mimeType).includes('mp4') ? 'mp4' : String(mimeType).includes('wav') ? 'wav' : String(mimeType).includes('ogg') ? 'ogg' : String(mimeType).includes('mpeg') ? 'mp3' : 'webm';
        const form = new FormData();
        form.append('file', new Blob([Buffer.from(audioBase64, 'base64')], { type: String(mimeType).split(';')[0] }), `audio.${ext}`);
        form.append('model', useGroq ? (language === 'en' ? 'whisper-large-v3-turbo' : 'whisper-large-v3') : 'whisper-1');
        form.append('language', ['hi', 'kn', 'en'].includes(language) ? language : 'en');
        form.append('response_format', 'json');
        const r = await fetch(useGroq ? 'https://api.groq.com/openai/v1/audio/transcriptions' : 'https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${whisperKey}` },
          body: form,
          signal: AbortSignal.timeout(60_000),
        });
        const data: any = await r.json().catch(() => ({}));
        if (!r.ok) {
          res.status(r.status).json({ error: data?.error?.message || 'Audio transcription failed.' });
          return;
        }
        const text = String(data.text ?? '').trim();
        if (!text) {
          res.status(502).json({ error: 'No speech was heard in the recording.' });
          return;
        }
        res.json({ transcript: text, model: useGroq ? 'groq-whisper' : 'openai-whisper' });
        return;
      }

      const ai = getGeminiClient();
      const langName =
        language === 'hi'
          ? 'Hindi (Devanagari or transliterated scientific terms)'
          : language === 'kn'
          ? 'Kannada (Kannada script or scientific terms)'
          : 'English';

      const audioPart = {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            {
              text: `Transcribe this spoken STEM question or lab observation accurately in ${langName}. Preserve physics/math symbols, numbers, and units cleanly. Output only the transcribed text.`,
            },
          ],
        },
      });

      const transcript = response.text?.trim();
      if (!transcript) {
        res.status(502).json({ error: 'No transcript could be extracted from the recording.' });
        return;
      }

      res.json({ transcript, model: 'gemini-3.5-transcribe' });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Audio transcription failed.';
      console.error('Audio transcription error:', errMsg);
      res.status(500).json({ error: errMsg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const store = await accounts.initAccountStore();
  console.log(`Student accounts stored in: ${store}`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gyaan Graph server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
