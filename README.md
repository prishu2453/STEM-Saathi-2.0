# Gyaan Graph

Gyaan Graph is a multilingual science-learning web app for students. It combines curriculum browsing with experiments, simulations, offline study packs, and an AI mentor.

## Features

- Curriculum browsing by class, education board, subject, and academic session.
- English, Hindi, and Kannada interface and learning content.
- Experiment guides, interactive simulations, quizzes, and progress tracking.
- Installable Progressive Web App with offline study packs.
- Accessibility options, including larger text, high contrast, and read-aloud controls.
- AI Mentor with text and voice input, spoken answers, and optional Gemini natural-voice synthesis.
- Student, teacher, and admin dashboards.

Syllabus coverage varies by board and class. The app distinguishes verified sample coverage from content that is still pending; check the in-app source and coverage notes before relying on a syllabus map.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm install --legacy-peer-deps
cp .env.example .env
```

Add the server-side API key you want to use to `.env`. For Gemini, set `GEMINI_API_KEY`. Keep `.env` private and never commit it. The AI Mentor can also use the providers documented in `.env.example` and `DEPLOY.md`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build and run

```bash
npm run build
npm start
```

The server currently listens on port `3000`. Configure API keys as environment secrets on your deployment host. See [DEPLOY.md](DEPLOY.md) for deployment notes.

## Useful scripts

- `npm run dev` — start the development server.
- `npm run build` — build the production app.
- `npm start` — serve the production build.
- `npm run lint` — run TypeScript type checking.
- `npm run check:videos` — check the registered experiment video links.

## Configuration and local data

- `.env.example` documents supported environment variables; `.env` contains local secrets and is ignored by Git.
- `firebase-applet-config.json` contains the Firebase web-app configuration used by the client. Protect the Firebase project with appropriate Authentication and Firestore security rules.
- Local account data under `data/`, generated build output, and installed dependencies are excluded from Git.

Do not add API keys, service-account files, student records, or other private data to the repository.
