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

export type PersonalProfile = {
  firstName: string
  lastName: string
  username: string
  email: string
  phone: string
  password: string
}

export type Preferences = {
  pushNotifications: boolean
  dailyReminder: boolean
  weeklySummary: boolean
  soundEffects: boolean
  reminderTime: "08:00" | "12:00" | "18:00" | "21:00"
  practiceFocus: "conversation" | "vocab" | "grammar"
  goalIntensity: "casual" | "balanced" | "intense"
}
