import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type {
  Language,
  LanguageCode,
  Level,
  Message,
  Session,
  PersonalProfile,
  Preferences
} from "../types"

export type SessionReward = {
  lang: LanguageCode
  xpBefore: number
  xpAfter: number
  xpEarned: number
  streakBefore: number
  streakAfter: number
  sessionLengthSec: number
  userTurns: number
  assistantTurns: number
  completedAt: number
  level: Level
  user: string
}

type PreferenceBooleanKey = {
  [K in keyof Preferences]: Preferences[K] extends boolean ? K : never
}[keyof Preferences]

type State = Session & {
  profile: PersonalProfile
  preferences: Preferences
  setTargetLang: (lang: LanguageCode) => void
  initLangProfile: (lang: LanguageCode) => void
  setLevelForLang: (lang: LanguageCode, level: Level) => void
  appendMessageForLang: (lang: LanguageCode, msg: Message) => void
  resetHistoryForLang: (lang: LanguageCode) => void
  setLevel: (level: Level) => void
  setLanguage: (lang: Language) => void
  setUser: (user: string) => void
  appendMessage: (msg: Message) => void
  resetHistory: () => void
  updateProfile: (patch: Partial<PersonalProfile>) => void
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
  togglePreference: (key: PreferenceBooleanKey) => void
  completeSessionForLang: (
    lang: LanguageCode,
    data: { xpEarned: number; sessionLengthSec: number; userTurns: number; assistantTurns: number }
  ) => void
  lastReward: SessionReward | null
}

const defaultProfile: PersonalProfile = {
  firstName: "Alex",
  lastName: "Muster",
  username: "@alex_lernt",
  email: "alex@example.com",
  phone: "",
  password: ""
}

const defaultPreferences: Preferences = {
  pushNotifications: true,
  dailyReminder: true,
  weeklySummary: false,
  soundEffects: true,
  reminderTime: "18:00",
  practiceFocus: "conversation",
  goalIntensity: "balanced"
}

export const useSessionStore = create<State>()(
  persist(
    (set) => ({
      targetLang: null,
      profilesByLang: {},
      historyByLang: {},
      language: "ja-JP",
      level: "beginner",
      history: [],
      user: "You",
      profile: { ...defaultProfile },
      preferences: { ...defaultPreferences },
      lastReward: null,
      setTargetLang: (lang: LanguageCode) => set({ targetLang: lang }),
      initLangProfile: (lang: LanguageCode) =>
        set((s) => {
          if (s.profilesByLang?.[lang]) return s
          return {
            profilesByLang: {
              ...s.profilesByLang,
              [lang]: { level: "beginner", xp: 0, streak: 0 }
            }
          }
        }),
      setLevelForLang: (lang: LanguageCode, level: Level) =>
        set((s) => ({
          profilesByLang: {
            ...s.profilesByLang,
            [lang]: { ...(s.profilesByLang?.[lang] ?? { xp: 0, streak: 0, level }), level }
          }
        })),
      appendMessageForLang: (lang: LanguageCode, msg: Message) =>
        set((s) => ({
          historyByLang: {
            ...s.historyByLang,
            [lang]: [...(s.historyByLang?.[lang] ?? []), msg]
          }
        })),
      resetHistoryForLang: (lang: LanguageCode) =>
        set((s) => ({
          historyByLang: {
            ...s.historyByLang,
            [lang]: []
          }
        })),
      setLevel: (level) => set({ level }),
      setLanguage: (language) => set({ language }),
      setUser: (user) => set({ user }),
      appendMessage: (msg) =>
        set((s) => ({
          history: [...s.history, msg]
        })),
      resetHistory: () => set({ history: [] }),
      updateProfile: (patch) =>
        set((s) => {
          const currentProfile = s.profile ?? { ...defaultProfile }
          const sanitized: Partial<PersonalProfile> = { ...patch }
          if (sanitized.username !== undefined) {
            const trimmed = sanitized.username.trim()
            sanitized.username =
              trimmed.length === 0 ? "" : trimmed.startsWith("@") ? trimmed : `@${trimmed}`
          }
          const nextProfile = { ...currentProfile, ...sanitized }
          let nextUser = s.user
          if (sanitized.firstName !== undefined || sanitized.lastName !== undefined) {
            const maybeFull = `${nextProfile.firstName} ${nextProfile.lastName}`
              .replace(/\s+/g, " ")
              .trim()
            if (maybeFull.length > 0) nextUser = maybeFull
          }
          return {
            profile: nextProfile,
            user: nextUser
          }
        }),
      setPreference: (key, value) =>
        set((s) => ({
          preferences: {
            ...(s.preferences ?? defaultPreferences),
            [key]: value
          }
        })),
      togglePreference: (key) =>
        set((s) => ({
          preferences: {
            ...(s.preferences ?? defaultPreferences),
            [key]: !(s.preferences ?? defaultPreferences)[key]
          }
        })),
      completeSessionForLang: (lang, data) =>
        set((s) => {
          const existingProfile = s.profilesByLang?.[lang]
          const baseLevel = existingProfile?.level ?? s.level
          const fallbackProfile = existingProfile ?? { level: baseLevel, xp: 0, streak: 0 }
          const xpBefore = fallbackProfile.xp ?? 0
          const streakBefore = fallbackProfile.streak ?? 0
          const xpAfter = xpBefore + data.xpEarned
          const streakAfter = Math.max(streakBefore + 1, 1)
          const nextProfile = {
            ...fallbackProfile,
            xp: xpAfter,
            streak: streakAfter
          }

          return {
            profilesByLang: {
              ...s.profilesByLang,
              [lang]: nextProfile
            },
            lastReward: {
              lang,
              xpBefore,
              xpAfter,
              xpEarned: data.xpEarned,
              streakBefore,
              streakAfter,
              sessionLengthSec: data.sessionLengthSec,
              userTurns: data.userTurns,
              assistantTurns: data.assistantTurns,
              completedAt: Date.now(),
              level: nextProfile.level,
              user: s.user
            }
          }
        })
    }),
    {
      name: "sprachtrainer.session",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
