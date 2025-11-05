import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useSessionStore, type SessionReward } from "@/src/store/session"

const XP_PER_LEVEL = 240

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes <= 0) return `${rest} Sek`
  if (rest === 0) return `${minutes} Min`
  return `${minutes} Min ${rest} Sek`
}

const languageLabel: Record<string, string> = {
  de: "Deutsch",
  en: "Englisch",
  es: "Spanisch",
  fr: "Franzoesisch",
  it: "Italienisch",
  pt: "Portugiesisch",
  ja: "Japanisch",
  ko: "Koreanisch",
  zh: "Chinesisch"
}

const getProgress = (reward: SessionReward | null) => {
  if (!reward) return { fraction: 0, xpIntoCurrent: 0, xpToNext: XP_PER_LEVEL }
  const xpIntoCurrent = reward.xpAfter % XP_PER_LEVEL
  const fraction = xpIntoCurrent / XP_PER_LEVEL
  const xpToNext = xpIntoCurrent === 0 ? XP_PER_LEVEL : XP_PER_LEVEL - xpIntoCurrent
  return { fraction: Math.min(1, fraction), xpIntoCurrent, xpToNext }
}

export default function RewardScreen(): React.ReactElement | null {
  const router = useRouter()
  const reward = useSessionStore((s) => s.lastReward)
  const targetLang = useSessionStore((s) => s.targetLang)
  const [displayXp, setDisplayXp] = useState(() => reward?.xpBefore ?? 0)

  useEffect(() => {
    if (!reward) {
      router.replace(targetLang ? "/homepage" : "/trainer")
    }
  }, [reward, router, targetLang])

  useEffect(() => {
    if (!reward) return
    setDisplayXp(reward.xpBefore)
    const target = reward.xpAfter
    if (target <= reward.xpBefore) {
      setDisplayXp(target)
      return
    }
    const diff = target - reward.xpBefore
    const step = Math.max(1, Math.round(diff / 40))
    const interval = setInterval(() => {
      setDisplayXp((prev) => {
        const next = prev + step
        if (next >= target) {
          clearInterval(interval)
          return target
        }
        return next
      })
    }, 28)
    return () => clearInterval(interval)
  }, [reward])

  const progress = useMemo(() => getProgress(reward), [reward])

  const handleRetry = () => {
    router.replace("/trainer")
  }

  const handleHome = () => {
    router.replace("/homepage")
  }

  if (!reward) return null

  const totalTurns = reward.userTurns + reward.assistantTurns
  const userShare = totalTurns > 0 ? Math.round((reward.userTurns / totalTurns) * 100) : 0
  const streakDelta =
    reward.streakAfter > reward.streakBefore
      ? `Streak ${reward.streakAfter} (+1)`
      : `Streak ${reward.streakAfter}`
  const languageName = languageLabel[reward.lang] ?? reward.lang.toUpperCase()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session abgeschlossen!</Text>
        <Text style={styles.subtitle}>
          {languageName} - {formatDuration(reward.sessionLengthSec)} - {streakDelta}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Verdiente XP</Text>
        <Text style={styles.xpValue}>{displayXp}</Text>
        <Text style={styles.xpDelta}>+{reward.xpEarned} XP</Text>

        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.fraction * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Noch {progress.xpToNext} XP bis zum naechsten Badge (Ziel {XP_PER_LEVEL} XP)
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{reward.userTurns}</Text>
            <Text style={styles.statLabel}>Deine Beitraege</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{userShare}%</Text>
            <Text style={styles.statLabel}>Sprechanteil</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{formatDuration(reward.sessionLengthSec)}</Text>
            <Text style={styles.statLabel}>Fokuszeit</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.primaryButtonPressed : undefined
          ]}
          onPress={handleRetry}
        >
          <Text style={styles.primaryButtonText}>Neue Session starten</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.secondaryButtonPressed : undefined
          ]}
          onPress={handleHome}
        >
          <Text style={styles.secondaryButtonText}>Zur Uebersicht</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "space-between"
  },
  header: {
    width: "100%",
    alignItems: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E16632"
  },
  subtitle: {
    color: "#6B6B61",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center"
  },
  card: {
    width: "100%",
    backgroundColor: "#F9F8F8",
    borderRadius: 32,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#6B6B61"
  },
  xpValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#2A2A23",
    marginTop: 12
  },
  xpDelta: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#E16632"
  },
  progressSection: {
    marginTop: 28
  },
  progressTrack: {
    width: "100%",
    height: 12,
    borderRadius: 10,
    backgroundColor: "#E6E4DD",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E16632"
  },
  progressLabel: {
    marginTop: 8,
    color: "#6B6B61",
    fontSize: 13,
    fontWeight: "500"
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28
  },
  statPill: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    marginHorizontal: 6
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2A23"
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#6B6B61",
    textAlign: "center"
  },
  actions: {
    width: "100%"
  },
  primaryButton: {
    backgroundColor: "#E04F28",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.22
  },
  primaryButtonText: {
    color: "#F9F8F8",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryButton: {
    marginTop: 16,
    backgroundColor: "#F9F8F8",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.18
  },
  secondaryButtonText: {
    color: "#E04F28",
    fontSize: 15,
    fontWeight: "700"
  }
})
