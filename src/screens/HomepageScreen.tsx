import React, { useCallback, useMemo, useState, type ReactElement } from "react"
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { useSessionStore } from "../store/session"

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

type TabKey = "home" | "profile" | "settings"

export default function HomepageScreen(): ReactElement {
  const router = useRouter()
  const sessionUser = useSessionStore((s) => s.user)

  const displayName = useMemo(() => {
    const trimmed = sessionUser?.trim()
    if (trimmed && trimmed.length > 0) return trimmed
    return mockStats.userName
  }, [sessionUser])

  const heroInitial = displayName.charAt(0).toUpperCase()
  const [activeTab, setActiveTab] = useState<TabKey>("home")

  const handleGoToTrainer = useCallback(() => {
    router.push("/trainer")
  }, [router])

  const handleGoToOnboarding = useCallback(() => {
    router.push("/onboarding")
  }, [router])

  const handleOpenSettings = useCallback(() => {
    router.push("/settings")
  }, [router])

  const goalProgress = Math.min(1, mockStats.xpToday / mockStats.xpGoal)

  const tabs = useMemo(
    () => [
      { key: "home" as const, label: "Home" },
      { key: "profile" as const, label: displayName },
      { key: "settings" as const, label: "Settings" }
    ],
    [displayName]
  )

  const handleTabPress = useCallback((key: TabKey) => {
    setActiveTab(key)
  }, [])

  let mainContent: ReactElement
  if (activeTab === "home") {
    mainContent = (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroInitial}>{heroInitial}</Text>
            </View>
            <View>
              <Text style={styles.heroGreeting}>Hallo {displayName}!</Text>
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
            <Text style={styles.progressHint}>
              Halte deinen Streak und sichere dir die Bonus Kiste.
            </Text>
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
  } else if (activeTab === "profile") {
    mainContent = (
      <ScrollView style={styles.container} contentContainerStyle={styles.altContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitial}>{heroInitial}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileTagline}>
            Dein Fokus heute: {mockStats.focusSkill}. Halte den Flow und sammle weitere XP.
          </Text>
        </View>

        <View style={styles.profileStatsRow}>
          <View style={[styles.profileStatsCard, styles.profileStatsCardFirst]}>
            <Text style={styles.profileStatsLabel}>Aktueller Streak</Text>
            <Text style={styles.profileStatsValue}>{mockStats.streak} Tage</Text>
            <Text style={styles.profileStatsHint}>Bleib aktiv, um die Serie zu halten.</Text>
          </View>
          <View style={[styles.profileStatsCard, styles.profileStatsCardLast]}>
            <Text style={styles.profileStatsLabel}>Naechster Unlock</Text>
            <Text style={styles.profileStatsValue}>{mockStats.nextUnlock}</Text>
            <Text style={styles.profileStatsHint}>Erreiche dein Tagesziel fuer neue Inhalte.</Text>
          </View>
        </View>

        <View style={styles.profileActions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryCta,
              pressed ? styles.primaryCtaPressed : undefined
            ]}
            onPress={handleGoToTrainer}
          >
            <Text style={styles.primaryCtaText}>Gespraech starten</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryCta,
              pressed ? styles.secondaryCtaPressed : undefined
            ]}
            onPress={handleGoToOnboarding}
          >
            <Text style={styles.secondaryCtaText}>Profil anpassen</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  } else {
    mainContent = (
      <ScrollView style={styles.container} contentContainerStyle={styles.altContent}>
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Schnelleinstellungen</Text>

          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Tagesziel</Text>
            <Text style={styles.settingsValue}>{mockStats.xpGoal} XP</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Fokusbereich</Text>
            <Text style={styles.settingsValue}>{mockStats.focusSkill}</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Aktuelle Session</Text>
            <Text style={styles.settingsValue}>{mockStats.xpToday} XP gesammelt</Text>
          </View>

          <Text style={styles.settingsHint}>
            Passe deine Ziele, Erinnerung und Spracheinstellungen an, um dein Training zu
            personalisieren.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryCta,
            pressed ? styles.primaryCtaPressed : undefined
          ]}
          onPress={handleOpenSettings}
        >
          <Text style={styles.primaryCtaText}>Einstellungen oeffnen</Text>
        </Pressable>
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <View style={styles.contentWrapper}>{mainContent}</View>
        <View style={styles.tabBarContainer}>
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab
              return (
                <Pressable
                  key={tab.key}
                  style={({ pressed }) => [
                    styles.tabItem,
                    isActive ? styles.tabItemActive : undefined,
                    pressed ? styles.tabItemPressed : undefined
                  ]}
                  onPress={() => handleTabPress(tab.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.tabLabel, isActive ? styles.tabLabelActive : undefined]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff"
  },
  page: {
    flex: 1
  },
  contentWrapper: {
    flex: 1
  },
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 160
  },
  altContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 160,
    flexGrow: 1
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
  actionButtonTextDark: { color: "#2A2A23", fontSize: 15, fontWeight: "700" },
  profileCard: {
    backgroundColor: "#F9F8F8",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6
  },
  profileBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E16632",
    alignItems: "center",
    justifyContent: "center"
  },
  profileInitial: {
    color: "#F9F8F8",
    fontSize: 32,
    fontWeight: "700"
  },
  profileName: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: "#2A2A23"
  },
  profileTagline: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    color: "#6B6B61"
  },
  profileStatsRow: {
    flexDirection: "row",
    marginTop: 28
  },
  profileStatsCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  profileStatsCardFirst: {
    marginRight: 12
  },
  profileStatsCardLast: {
    marginLeft: 12
  },
  profileStatsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6B61",
    textTransform: "uppercase"
  },
  profileStatsValue: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A23"
  },
  profileStatsHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B6B61"
  },
  profileActions: {
    marginTop: 32
  },
  primaryCta: {
    backgroundColor: "#E04F28",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6
  },
  primaryCtaPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.22
  },
  primaryCtaText: {
    color: "#F9F8F8",
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryCta: {
    marginTop: 14,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E16632",
    backgroundColor: "#FFF"
  },
  secondaryCtaPressed: {
    transform: [{ scale: 0.98 }]
  },
  secondaryCtaText: {
    color: "#E16632",
    fontSize: 15,
    fontWeight: "700"
  },
  settingsCard: {
    backgroundColor: "#F9F8F8",
    borderRadius: 28,
    padding: 28,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2A23"
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18
  },
  settingsLabel: {
    fontSize: 14,
    color: "#6B6B61"
  },
  settingsValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2A23"
  },
  settingsHint: {
    marginTop: 24,
    fontSize: 13,
    color: "#6B6B61"
  },
  tabBarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F9F8F8",
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#2A2A23",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5
  },
  tabItem: {
    flex: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10
  },
  tabItemActive: {
    backgroundColor: "#E16632"
  },
  tabItemPressed: {
    opacity: 0.85
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B6B61"
  },
  tabLabelActive: {
    color: "#F9F8F8"
  }
})
