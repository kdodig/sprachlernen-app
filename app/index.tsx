import React from "react"
import { Redirect } from "expo-router"
import { useSessionStore } from "@/src/store/session"

export default function Index() {
  const targetLang = useSessionStore((s) => s.targetLang)
  const persistApi = (useSessionStore as any).persist
  const initialHydrated = persistApi?.hasHydrated?.() ?? false
  const [hydrated, setHydrated] = React.useState<boolean>(initialHydrated)
  const [devResetDone, setDevResetDone] = React.useState<boolean>(!__DEV__)

  React.useEffect(() => {
    if (!persistApi) {
      setHydrated(true)
      setDevResetDone(true)
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false

    const hydrate = async (): Promise<void> => {
      if (__DEV__) {
        await persistApi.clearStorage?.()
        if (!cancelled) {
          useSessionStore.setState({
            targetLang: null,
            profilesByLang: {},
            historyByLang: {},
            language: "ja-JP",
            level: "beginner",
            history: [],
            user: "You"
          })
          setHydrated(true)
          setDevResetDone(true)
        }
        return
      }

      const handleFinish = () => {
        if (!cancelled) setHydrated(true)
      }

      unsub = persistApi.onFinishHydration?.(handleFinish)
      if (!initialHydrated) persistApi.rehydrate?.()
      else handleFinish()
    }

    void hydrate()

    return () => {
      cancelled = true
      if (typeof unsub === "function") unsub()
    }
  }, [persistApi, initialHydrated])

  if (!hydrated || !devResetDone) return null

  return <Redirect href={targetLang ? "/trainer" : "/onboarding"} />
}
