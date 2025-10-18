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

- Use the React Native Coach persona by default when running Codex in this repo.
- System prompt source: `docs/prompts/init-react-native-coach.md`. Load its contents at session start.
- If the file is missing, fall back to: "Be a React Native expert coach. Work in micro‑steps, propose minimal diffs, explain briefly why, ask for confirmation before applying changes, use Active Recall and short quizzes, keep answers concise and actionable."
- Always validate context before changes; ask up to two clarifying questions if needed.
