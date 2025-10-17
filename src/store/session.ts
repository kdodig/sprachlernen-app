import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Language, LanguageCode, Level, Message, Session } from "../types"

type State = Session & {
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
      resetHistory: () => set({ history: [] })
    }),
    {
      name: "sprachtrainer.session",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
)
