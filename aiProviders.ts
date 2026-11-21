/**
 * Provider-agnostic AI tutor backend. Keys are read from server environment
 * variables only — never sent to the browser.
 *
 * Pick one (first match wins, or force with AI_PROVIDER):
 *   GEMINI_API_KEY      -> Google Gemini (default models in server.ts)
 *   ANTHROPIC_API_KEY   -> Claude          (ANTHROPIC_MODEL, ANTHROPIC_BASE_URL)
 *   GROQ_API_KEY        -> Groq, free tier (GROQ_MODEL)
 *   OPENROUTER_API_KEY  -> OpenRouter, many models incl. free ones (OPENROUTER_MODEL)
 *   OPENAI_API_KEY      -> OpenAI or ANY OpenAI-compatible server (OPENAI_BASE_URL, OPENAI_MODEL)
 *                          e.g. local Ollama: OPENAI_BASE_URL=http://localhost:11434/v1 OPENAI_API_KEY=ollama OPENAI_MODEL=llama3.2
 */
export type ProviderName = 'gemini' | 'anthropic' | 'groq' | 'openrouter' | 'openai';

const has = (k: string) => {
  const v = process.env[k];
  return !!v && !v.startsWith('MY_');
};

export function pickProvider(): ProviderName | null {
  const forced = (process.env.AI_PROVIDER || '').toLowerCase() as ProviderName;
  const keyFor: Record<ProviderName, string> = {
    gemini: 'GEMINI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    groq: 'GROQ_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
  };
  if (forced && keyFor[forced] && has(keyFor[forced])) return forced;
  for (const p of ['gemini', 'anthropic', 'groq', 'openrouter', 'openai'] as ProviderName[]) {
    if (has(keyFor[p])) return p;
  }
  return null;
}

export const NO_PROVIDER_MESSAGE =
  'AI Tutor is not configured. Add one key to the server .env file: GEMINI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY or OPENAI_API_KEY (see DEPLOY.md), then restart the server.';

export interface TurnMsg {
  role: 'user' | 'model';
  text: string;
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || data?.message || text.slice(0, 300);
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function askOtherProvider(
  provider: Exclude<ProviderName, 'gemini'>,
  system: string,
  history: TurnMsg[],
  message: string,
  /** Short structured calls (the adaptive tutor) can ask reasoning models to think less, using far fewer tokens. */
  opts: { reasoningEffort?: 'low' | 'medium' | 'high' } = {}
): Promise<{ reply: string; model: string }> {
  if (provider === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
    const base = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
    const data = await post(
      `${base}/v1/messages`,
      { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      {
        model,
        max_tokens: 1500,
        system,
        messages: [
          ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          { role: 'user', content: message },
        ],
      }
    );
    const reply = (data.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
    return { reply, model };
  }

  const cfg = {
    groq: { base: 'https://api.groq.com/openai/v1', key: 'GROQ_API_KEY', model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b' },
    openrouter: { base: 'https://openrouter.ai/api/v1', key: 'OPENROUTER_API_KEY', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free' },
    openai: { base: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', key: 'OPENAI_API_KEY', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' },
  }[provider];
  const data = await post(
    `${cfg.base.replace(/\/$/, '')}/chat/completions`,
    { Authorization: `Bearer ${process.env[cfg.key]}` },
    {
      model: cfg.model,
      ...(opts.reasoningEffort && /gpt-oss/i.test(cfg.model) ? { reasoning_effort: opts.reasoningEffort } : {}),
      messages: [
        { role: 'system', content: system },
        ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: 'user', content: message },
      ],
    }
  );
  return { reply: String(data.choices?.[0]?.message?.content ?? '').trim(), model: cfg.model };
}
