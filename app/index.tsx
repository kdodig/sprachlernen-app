import React from "react"
import { Redirect } from "expo-router"
import { useSessionStore } from "@/src/store/session"

export default function Index() {
  const targetLang = useSessionStore((s) => s.targetLang)
  const persistApi = (useSessionStore as any).persist
  const initialHydrated = persistApi?.hasHydrated?.() ?? false
  const [hydrated, setHydrated] = React.useState<boolean>(initialHydrated)

  React.useEffect(() => {
    if (!persistApi) {
      setHydrated(true)
      return
    }
    let unsub: (() => void) | undefined
    let cancelled = false

    const hydrate = async (): Promise<void> => {
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

  if (!hydrated) return null

  return <Redirect href={targetLang ? "/homepage" : "/onboarding"} />
}
