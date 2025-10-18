import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { useSessionStore } from "@/src/store/session"
import type { LanguageCode } from "@/src/types"

export default function Onboarding() {
  const languageCodes: LanguageCode[] = ["de", "en", "es", "fr", "it", "pt", "ja", "ko", "zh"]
  const labels: Record<LanguageCode, string> = {
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    it: "Italiano",
    pt: "Português",
    ja: "日本語",
    ko: "한국어",
    zh: "中文"
  }
  const [selectedLanguage, setSelectedLanguage] = React.useState<LanguageCode | null>(null)
  const setTargetLang = useSessionStore((s) => s.setTargetLang)
  const router = useRouter()
  const hapticTimer = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const stopHaptics = React.useCallback(() => {
    if (!hapticTimer.current) return
    clearInterval(hapticTimer.current)
    hapticTimer.current = null
  }, [])

  React.useEffect(() => stopHaptics, [stopHaptics])

  const handlePressIn = (code: LanguageCode) => {
    setSelectedLanguage(code)
    stopHaptics()
    void Haptics.selectionAsync()
    hapticTimer.current = setInterval(() => {
      void Haptics.selectionAsync()
    }, 500)
  }

  const handleLongPress = () => {
    if (!selectedLanguage) return
    stopHaptics()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTargetLang(selectedLanguage)
    router.replace("/trainer")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick a language to learn</Text>
      <Text style={styles.hint}>Tippe und halte 2 Sekunden, um deine Wahl zu bestätigen.</Text>
      <View style={styles.list}>
        {languageCodes.map((code) => (
          <Pressable
            key={code}
            style={[styles.btn, selectedLanguage === code && styles.btnSelected]}
            onPressIn={() => handlePressIn(code)}
            onPressOut={stopHaptics}
            onLongPress={handleLongPress}
            delayLongPress={2000}
          >
            <Text style={styles.btnText}>{labels[code]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 60,
    paddingTop: 100
  },
  title: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8
  },
  hint: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    textAlign: "center"
  },
  list: { width: "100%", maxWidth: 420, alignItems: "center", gap: 10 },
  btn: {
    width: "80%",
    maxWidth: 340,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center"
  },
  btnSelected: { backgroundColor: "#dbeafe", borderColor: "#93c5fd" },
  btnText: { color: "#111827", fontSize: 16 }
})
