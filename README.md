# Sprachtrainer – AI Voice Coach for Confident Speaking

Sprachtrainer is a React Native / Expo prototype that turns spontaneous speech practice into a guided experience with an AI coach. Learners record with push-to-talk, send audio to a Node/Express service for speech-to-text and conversation handling, and receive an immediate spoken response together with runtime debug insights.

## For Hiring Managers & Recruiters
- Role: End-to-end concept and build owner across UX, mobile app, API integration, and audio pipeline.
- Focus: Voice-first language coaching, resilient STT/TTS chain, persistent learner profiles, and frictionless onboarding.
- Competencies: React Native (Expo Router), TypeScript, Zustand, Expo Audio/FileSystem, AsyncStorage, Axios, backend integration with `sprachenlernen-api`.
- Outcome: Clickable prototype with production-grade error handling, traceable logs, and a clear learner journey (Onboarding → Dashboard → Trainer).

## Product Highlights
- Guided onboarding with haptics: long-press language selection, automatic profile bootstrap per language.
- Learning-app style dashboard: daily goals, missions, and streak visualization to drive engagement.
- Voice-first trainer: push-to-talk capture, `/stt` upload, `/chat` response, local TTS caching and playback.
- Debug & support tooling: trace IDs, engine metadata, and persisted audio paths for operations teams.
- Learner profiles: username, level, and conversation history stored per language via AsyncStorage.

## Technology Stack
- Mobile: React 19, React Native 0.81, Expo 54 with Expo Router.
- State & persistence: Zustand + AsyncStorage (`zustand/persist`), file caching with `expo-file-system`.
- Audio & sensors: `expo-audio` for capture/playback, haptics via `expo-haptics`.
- API layer: Axios client with smart host resolution (`src/lib/api.ts`) supporting devices, emulators, and LAN setups.
- Tooling: TypeScript 5.9, ESLint, Prettier, Expo CLI. System prompts are stored in `docs/prompts/`.

## Architecture at a Glance
- Onboarding (`app/onboarding.tsx`): language selection, profile initialization, persistence.
- Dashboard (`src/screens/HomepageScreen.tsx`): gamified overview and navigation hub.
- Trainer (`src/screens/ConversationScreen.tsx`): recording lifecycle, `/stt` upload, `/chat` call, TTS caching, debug state.
- State management (`src/store/session.ts`): per-language histories, levels, username, global settings.
- Helpers (`src/lib/*`): audio utilities, language mapping (`toTtsLocale`), API client with debug metadata capture.

## Folder Snapshot
- `app/` – Expo Router screens (Onboarding, Homepage, Trainer, Settings).
- `src/screens/` – UI logic for dashboard and conversation flows.
- `src/lib/` – audio and API helpers.
- `src/store/` – Zustand store with persistence.
- `docs/prompts/` – system prompts for the conversational AI.

## Setup & Local Development
1. Prerequisites: Node 20+, npm, Expo CLI (optional), running backend `sprachenlernen-api` on port 3000 (provides `/health`, `/stt`, `/chat`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo dev server:
   ```bash
   npx expo start
   ```
4. Connect a device (Expo Go, emulator, or development build). The API base URL resolves from the Metro bundler host; Android emulators fall back to `10.0.2.2:3000`.

## Quality & Next Steps
- Manual QA: run through the voice flow (`Onboarding → Trainer`), inspect developer logs, verify saved TTS files in `FileSystem.documentDirectory`.
- Open work: add automated testing (e.g., Jest + Detox), polish responsive layouts, extend backend monitoring around `traceId`.
- Expansion ideas: adaptive learning plans, offline lesson packages, learning analytics dashboards.
