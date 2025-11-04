import React, { useCallback, type ReactElement } from "react"
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native"
import { useRouter } from "expo-router"

const mockStats = {
  userName: "Alex",
  streak: 7,
  xpToday: 85,
  xpGoal: 120,
  focusSkill: "Hoeren & Sprechen",
  nextUnlock: "Story: Marktbesuch",
  quests: [
    { id: "goal", title: "Tagesziel", detail: "Noch 35 XP bis Bonus", color: "#E9AF52" },
    { id: "combo", title: "Combo Aufgabe", detail: "3 fehlerfreie Dialoge", color: "#E04F28" }
  ],
  missions: [
    { id: "mission-1", title: "Mini Mission", detail: "5 Minuten Wiederholung" },
    { id: "mission-2", title: "Bonus Kiste", detail: "Schliesse 2 Lektionen" }
  ]
}

export default function HomepageScreen(): ReactElement {
  const router = useRouter()
  const handleGoToTrainer = useCallback(() => {
    router.push("/trainer")
  }, [router])
  const handleGoToOnboarding = useCallback(() => {
    router.push("/onboarding")
  }, [router])

  const goalProgress = Math.min(1, mockStats.xpToday / mockStats.xpGoal)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroInitial}>{mockStats.userName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.heroGreeting}>Hallo {mockStats.userName}!</Text>
            <Text style={styles.heroMeta}>Streak {mockStats.streak} Tage</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>XP heute</Text>
            <Text style={styles.progressValue}>
              {mockStats.xpToday} / {mockStats.xpGoal}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goalProgress * 100}%` }]} />
          </View>
          <Text style={styles.progressHint}>Halte deinen Streak und sichere dir die Bonus Kiste.</Text>
        </View>

        <View style={styles.focusRow}>
          <View style={styles.focusLine} />
          <View style={styles.focusCopy}>
            <Text style={styles.focusLabel}>Fokus heute</Text>
            <Text style={styles.focusValue}>{mockStats.focusSkill}</Text>
          </View>
          <Text style={styles.focusArrow}>{">"}</Text>
        </View>
      </View>

      <View style={[styles.questRow, styles.section]}>
        {mockStats.quests.map((quest, index) => (
          <View
            key={quest.id}
            style={[
              styles.questCard,
              {
                backgroundColor: quest.color,
                marginRight: index === mockStats.quests.length - 1 ? 0 : 16
              }
            ]}
          >
            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questDetail}>{quest.detail}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.missionList, styles.section]}>
        <Text style={styles.sectionTitle}>Deine Missionen</Text>
        {mockStats.missions.map((mission) => (
          <View key={mission.id} style={styles.missionItem}>
            <View style={styles.missionCircle} />
            <View style={styles.missionCopy}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.missionDetail}>{mission.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.actions, styles.section]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.trainerButton,
            styles.actionButtonLeft,
            pressed ? styles.buttonPressed : undefined
          ]}
          onPress={handleGoToTrainer}
        >
          <Text style={styles.actionButtonTextLight}>Zum Trainer</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.onboardingButton,
            styles.actionButtonRight,
            pressed ? styles.buttonPressed : undefined
          ]}
          onPress={handleGoToOnboarding}
        >
          <Text style={styles.actionButtonTextDark}>Zum Onboarding</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 25
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32
  },
  heroCard: {
    backgroundColor: "#F9F8F8",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E16632",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  heroInitial: {
    color: "#F9F8F8",
    fontSize: 28,
    fontWeight: "700"
  },
  heroGreeting: { fontSize: 22, fontWeight: "700", color: "#2A2A23" },
  heroMeta: { marginTop: 4, fontSize: 15, color: "#6B6B61" },
  progressSection: { marginTop: 24 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  progressLabel: { fontSize: 14, color: "#2A2A23" },
  progressValue: { fontSize: 14, fontWeight: "600", color: "#2A2A23" },
  progressTrack: {
    height: 16,
    borderRadius: 12,
    backgroundColor: "#F1DED0",
    marginTop: 12,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E9AF52",
    borderRadius: 12
  },
  progressHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B6B61"
  },
  focusRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFF"
  },
  focusLine: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: "#2A2A23",
    marginRight: 16
  },
  focusCopy: { flex: 1 },
  focusLabel: { fontSize: 12, color: "#6B6B61", textTransform: "uppercase" },
  focusValue: { marginTop: 4, fontSize: 16, fontWeight: "600", color: "#2A2A23" },
  focusArrow: { fontSize: 20, fontWeight: "600", color: "#2A2A23", marginLeft: 12 },
  questRow: {
    flexDirection: "row"
  },
  questCard: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    justifyContent: "space-between",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5
  },
  questTitle: { fontSize: 16, fontWeight: "700", color: "#2A2A23" },
  questDetail: { marginTop: 12, fontSize: 13, color: "#2A2A23" },
  missionList: {
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#2A2A23" },
  missionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16
  },
  missionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E16632",
    marginRight: 14
  },
  missionCopy: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: "600", color: "#2A2A23" },
  missionDetail: { marginTop: 2, fontSize: 13, color: "#6B6B61" },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 12
  },
  section: { marginTop: 28 },
  actionButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6
  },
  trainerButton: {
    backgroundColor: "#E04F28"
  },
  onboardingButton: {
    backgroundColor: "#F9F8F8"
  },
  actionButtonLeft: { marginRight: 8 },
  actionButtonRight: { marginLeft: 8 },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.18
  },
  actionButtonTextLight: { color: "#F9F8F8", fontSize: 15, fontWeight: "700" },
  actionButtonTextDark: { color: "#2A2A23", fontSize: 15, fontWeight: "700" }
})
