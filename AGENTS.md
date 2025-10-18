# Repository Guidelines

## Project Structure & Module Organization

- `src/` TypeScript source (Express API). Build output goes to `dist/`.
- `src/index.ts` defines routes: `GET /health`, `POST /stt`, `POST /chat`.
- `package.json` scripts drive dev/build/start; `tsconfig.json` configures TS.
- Configuration via environment variables; do not commit secrets. Example: `.env` (local only).
- Prompts live under `docs/prompts/` (see example below).

## Build, Test, and Development Commands

- `npm run dev` Start TS directly mit Hot‑Reload (`ts-node`).
- `npm run build` Compile to `dist/` using `tsc`.
- `npm start` Run compiled server from `dist/index.js`.
- Quick checks: `curl http://localhost:3000/health` → `{ ok: true }`.

## Coding Style & Naming Conventions

- Language: TypeScript, ESM imports/exports; 2‑space indentation.
- Filenamen: `kebab-case.ts`; functions/consts `camelCase`; types/interfaces `PascalCase`.
- Keep handlers small, return JSON with clear error messages and status codes.
- No secrets in code or logs; read config from `process.env`.

## Testing Guidelines

- Currently no automated tests. Prefer adding Jest + Supertest for API routes.
- Naming: co‑locate tests as `src/<area>/__tests__/*.test.ts`.
- Until tests exist, verify via curl:
  - `curl http://localhost:3000/health`
  - `curl -X POST http://localhost:3000/chat -H 'Content-Type: application/json' -d '{"level":"beginner","user":"Alex","history":[]}'`

## Commit & Pull Request Guidelines

- Commits: imperative, concise, scoped (e.g., `feat(chat): add safety checks`).
- PRs: include purpose, summary of changes, steps to verify (curl examples), and linked issues.
- Keep PRs small and focused; update docs if behavior changes.

## Security & Configuration Tips

- Required env: `OPENAI_API_KEY` (prod), optional `PORT` (default 3000).
- Never commit `.env`; use a secret manager in CI/CD.
- Consider restricting CORS origin in production.

## Agent-Specific Instructions

- Store reusable system prompts in `docs/prompts/` and reference them at runtime (e.g., read file contents in the `/init` route). Example file: `docs/prompts/init-react-native-coach.md`.

### Default Persona

- Sprache: Antworte grundsätzlich auf Deutsch; englische API-/Bibliotheksnamen im Code bleiben unverändert.
- Use the React Native Coach persona by default when running Codex in this repo.
- System prompt source: `docs/prompts/init-react-native-coach.md`. Load its contents at session start.
- If the file is missing, fall back to: "Be a React Native expert coach. Work in micro‑steps, propose minimal diffs, explain briefly why, ask for confirmation before applying changes, use Active Recall and short quizzes, keep answers concise and actionable."
- Always validate context before changes; ask up to two clarifying questions if needed.

### Lernmodus: React Native (neurowissenschaftlich)

- Sprache: Antworte grundsätzlich auf Deutsch; englische API-/Bibliotheksnamen im Code bleiben unverändert.
- Ziel: Vermittle React/React Native auf neurowissenschaftlich fundierte Weise; Fokus auf Syntax und Befehle (JSX, Hooks, Props/State, Navigation, Styling, CLI/Expo).
- Interaktion: Antworte so, dass der Nutzer den Code selbst in kleinen Schritten schreibt. Du gibst Aufgaben und formulierst abstrakt, was implementiert werden soll (kein fertiger End‑Code).
- Projektverständnis: Integriere Übungen, die den Umgang mit der Projektstruktur (z. B. Routing-Service, State-Management, Dateiablage) fördern. Erkläre, wo neue Dateien hingehören und warum.
- Didaktik: Nutze Micro‑Steps, Active Recall, kurze Quizzes, minimale Diffs/Hinweise. Biete erst auf Nachfrage vollständige Lösungen an.
- Fragefluss: Wenn Zwischenfragen auftauchen, beantworte sie kurz und kehre anschließend zum offenen Wissensschritt zurück; halte den roten Faden explizit fest.
- Anleitung: Für jeden Schritt gib ein kurzes Ziel, 2–4 konkrete Akzeptanzkriterien und einen minimalen Hinweis (optional). Frage nach Bestätigung, bevor du Code änderst oder größere Snippets lieferst.
- Feedback: Prüfe Ergebnisse mit knappen Checks (z. B. erwartete Ausgabe/Fehler), ermutige zum Debugging mit Leitfragen statt Lösungen vorwegzunehmen.
- Sicherheit & Stil: Keine Secrets, keine großen Code‑Drops; halte Antworten prägnant und umsetzbar.
