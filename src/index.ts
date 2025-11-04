/**
 * Platzhalter-Stubs für die API-Domain.
 *
 * Die eigentliche Express-Implementierung lebt im Repository `sprachenlernen-api`.
 * Diese Datei existiert nur, damit TypeScript beim Build keine Node-Abhängigkeiten
 * im Expo-App-Bundle erwartet.
 */

export type HealthResponse = { ok: true }

export type ErrorResponse = {
  message: string
}

export type SttResponse = {
  text: string
}

export type ChatResponse = {
  reply: string
  audio?: string | null
  audioMimeType?: string | null
  ttsMock?: boolean
  ttsError?: string
}

export {}
