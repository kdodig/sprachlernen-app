export type Level = "beginner" | "intermediate" | "advanced"
export type Role = "user" | "assistant"

export type Message = {
  role: Role
  content: string
}

export type Language = "ja-JP" | "en-US" | "de-DE"

export type Session = {
  language: Language
  level: Level
  history: Message[]
  user: string
}

