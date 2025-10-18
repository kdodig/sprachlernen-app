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
    const unsub = persistApi.onFinishHydration?.(() => setHydrated(true))
    if (!initialHydrated) persistApi.rehydrate?.()
    return () => {
      if (typeof unsub === "function") unsub()
    }
  }, [])

  if (!hydrated) return null

  return <Redirect href={targetLang ? "/trainer" : "/onboarding"} />
}
