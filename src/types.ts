export type Level = "beginner" | "intermediate" | "advanced"
export type Role = "user" | "assistant"

export type Message = {
  role: Role
  content: string
}

export type LanguageCode = "de" | "en" | "es" | "fr" | "it" | "pt" | "ja" | "ko" | "zh"
export type Language = "ja-JP" | "en-US" | "de-DE"

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
  level: Level
  history: Message[]
  user: string
}
