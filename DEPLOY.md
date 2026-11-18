# Running STEM Saathi with the AI Tutor

The Gemini key lives only on the server (`server.ts`); the browser never sees it.

1. Get a key at https://aistudio.google.com/apikey
2. `cp .env.example .env` and set ONE key (never commit `.env`). The tutor works with:
   - `GEMINI_API_KEY` (Google), `ANTHROPIC_API_KEY` (Claude), `GROQ_API_KEY` (free tier),
     `OPENROUTER_API_KEY` (has free models), or `OPENAI_API_KEY`.
   - Free & offline: install Ollama, then `OPENAI_API_KEY=ollama`,
     `OPENAI_BASE_URL=http://localhost:11434/v1`, `OPENAI_MODEL=llama3.2`.
   - Check which one is active: http://localhost:3000/api/mentor/status
3. `npm install --legacy-peer-deps`
4. Dev: `npm run dev` → http://localhost:3000
5. Production: `npm run build && npm start`. On any host (Cloud Run, Render, Railway)
   set `GEMINI_API_KEY` as a secret/environment variable and run `npm start`.
   Note: `PORT` is fixed at 3000 in server.ts; change it if your host assigns a port.

If the tutor shows "GEMINI_API_KEY is not configured", the key is missing from the
server's environment. "API key not valid" means the key itself is wrong.

## Hosting everything (GitHub Pages website + Render server)

GitHub Pages only serves static files, so the features that need the server — AI tutor, numerical
solver, login and the natural AI voice — run on a small Node server hosted on Render (free).
API keys stay on that server; the website only calls it.

1. **Render** → sign in with GitHub → **New → Blueprint** → pick this repository.
   `render.yaml` creates the `stem-saathi-api` web service and a free PostgreSQL database
   (student accounts are stored there, so logins survive restarts).
2. When asked, paste your **GROQ_API_KEY**. (Optional later: `GEMINI_API_KEY` for Hindi/Kannada AI voice.)
3. Copy the service address, e.g. `https://stem-saathi-api.onrender.com`.
4. **GitHub** → repository → Settings → Secrets and variables → Actions → **Variables** →
   add `API_BASE_URL` = that address. Re-run the "Deploy STEM-Saathi" workflow.
5. If the website lives on a different domain, add it to `ALLOWED_ORIGINS` on Render.

Notes
- Render's free web service sleeps after ~15 minutes idle; the first request then takes ~1 minute.
- Render's free PostgreSQL expires after 30 days; for longer use a paid plan or a free Neon
  database (set its connection string as `DATABASE_URL`).
- The English natural voice (Groq Orpheus) needs its terms accepted once in the Groq console.
- The Render address also serves the complete website by itself.
