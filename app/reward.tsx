import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useSessionStore, type SessionReward } from "@/src/store/session"
import GlassCard from "@/src/lib/components/GlassCard"
import Background from "@/src/lib/components/background"

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
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <Background />
      </View>
      <GlassCard style={styles.surfaceGlass} tint="light" intensity={25}>
        <LinearGradient
          colors={["rgba(152,205,255,0.35)", "rgba(152,205,255,0)"]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.15 }}
          style={styles.surfaceGlow}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
          style={styles.surfaceHighlight}
          pointerEvents="none"
        />
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
              <GlassCard style={styles.progressTrackCard} intensity={28}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={["rgba(225,102,50,0.95)", "rgba(224,79,40,0.9)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.progressIndicator, { width: `${progress.fraction * 100}%` }]}
                  />
                </View>
              </GlassCard>
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
                styles.actionPressable,
                pressed ? styles.actionPressablePressed : undefined
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              onPress={handleRetry}
            >
              <GlassCard
                style={[styles.actionGlass, styles.primaryAction]}
                intensity={38}
                tint="light"
              >
                <LinearGradient
                  colors={["rgba(225,102,50,0.9)", "rgba(224,79,40,0.8)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.actionGradient}
                  pointerEvents="none"
                />
                <Text style={styles.actionText}>Neue Session starten</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionPressable,
                pressed ? styles.actionPressablePressed : undefined
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              onPress={handleHome}
            >
              <GlassCard style={styles.actionGlass} intensity={34} tint="light">
                <Text style={[styles.actionText, styles.actionTextSecondary]}>Zur Uebersicht</Text>
              </GlassCard>
            </Pressable>
          </View>
        </View>
      </GlassCard>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject
  },
  surfaceGlass: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    padding: 0,
    backgroundColor: "rgba(252, 249, 251, 0.08)",
    overflow: "hidden",
    shadowColor: "rgba(200, 189, 205, 0.6)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 34,
    elevation: 14
  },
  surfaceGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1
  },
  surfaceHighlight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "space-between"
  },
  header: {
    marginTop: 0,
    width: "100%",
    alignItems: "center"
  },
  title: {
    paddingTop: 50,
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
  progressTrackCard: {
    borderRadius: 26,
    padding: 4,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    shadowColor: "rgba(226, 102, 50, 0.25)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6
  },
  progressTrack: {
    width: "100%",
    height: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden"
  },
  progressIndicator: {
    height: "100%",
    borderRadius: 999
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
    width: "100%",
    gap: 16,
    marginTop: 32
  },
  actionPressable: {
    borderRadius: 28,
    overflow: "hidden"
  },
  actionPressablePressed: {
    transform: [{ scale: 0.98 }]
  },
  actionGlass: {
    width: "100%",
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryAction: {
    overflow: "hidden"
  },
  actionGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    opacity: 0.8
  },
  actionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1A1A"
  },
  actionTextSecondary: {
    color: "#E04F28"
  }
})
