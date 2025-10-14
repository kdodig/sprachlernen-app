import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Language, Level, Message, Session } from "../types"

type State = Session & {
  setLevel: (level: Level) => void
  setLanguage: (lang: Language) => void
  setUser: (user: string) => void
  appendMessage: (msg: Message) => void
  resetHistory: () => void
}

export const useSessionStore = create<State>()(
  persist(
    (set) => ({
      language: "ja-JP",
      level: "beginner",
      history: [],
      user: "You",
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

