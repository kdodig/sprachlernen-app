export type Level = "beginner" | "intermediate" | "advanced"
export type Role = "user" | "assistant"

export type Message = {
  role: Role
  content: string
}

export type LanguageCode = "de" | "en" | "es" | "fr" | "it" | "pt" | "ja" | "ko" | "zh"
export type Language =
  | "ja-JP"
  | "en-US"
  | "de-DE"
  | "es-ES"
  | "fr-FR"
  | "it-IT"
  | "pt-PT"
  | "ko-KR"
  | "zh-CN"

export type Profile = {
  level: Level
  xp: number
  streak: number
}
export type Session = {
  targetLang: LanguageCode | null
  profilesByLang: Partial<Record<LanguageCode, Profile>>
  historyByLang: Partial<Record<LanguageCode, Message[]>>
  language: Language
  history: Message[]
  level: Level
  user: string
}
