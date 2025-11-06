import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  TextInput
} from "react-native"
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol"
import { useRouter } from "expo-router"
import { useSessionStore } from "../store/session"

type CommunityMember = {
  id: string
  handle: string
  name: string
  streak: number
}

type CommunityState = {
  followers: CommunityMember[]
  following: CommunityMember[]
  incoming: CommunityMember[]
  outgoing: CommunityMember[]
}

const supportShortcuts = [
  {
    key: "faq",
    title: "FAQ & Guides",
    description: "Antworten auf haeufige Fragen",
    icon: "questionmark.circle.fill" as const
  },
  {
    key: "feedback",
    title: "Feedback senden",
    description: "Sag uns, was besser laufen kann",
    icon: "exclamationmark.bubble.fill" as const
  },
  {
    key: "bug",
    title: "Bug melden",
    description: "Fehler screenshotten und melden",
    icon: "ladybug.fill" as const
  },
  {
    key: "support",
    title: "Support kontaktieren",
    description: "Direkt mit dem Team sprechen",
    icon: "envelope.fill" as const
  }
]

const mockProgressHeatmap = [
  [0, 18, 35, 0, 12, 24, 40],
  [10, 0, 28, 32, 18, 26, 50],
  [42, 16, 0, 14, 38, 60, 48],
  [64, 72, 40, 22, 0, 18, 35]
]

const mockProgressTrend = [
  { day: "Mo", xp: 42 },
  { day: "Di", xp: 55 },
  { day: "Mi", xp: 38 },
  { day: "Do", xp: 62 },
  { day: "Fr", xp: 70 },
  { day: "Sa", xp: 95 },
  { day: "So", xp: 48 }
]

const mockProgressHighlights = [
  { id: "focus", label: "Fokus: Gespraech", value: "+14%", detail: "Im Vergleich zur Vorwoche" },
  { id: "streak", label: "Laengster Streak", value: "16 Tage", detail: "Dein Rekord im Oktober" },
  { id: "speed", label: "XP pro Session", value: "78", detail: "Durchschnitt letzte 7 Tage" }
]

const mockRecentLessons = [
  { id: "lesson-1", title: "Marktgespraech", skill: "Hoeren", xp: 45 },
  { id: "lesson-2", title: "Hintergrundinfos", skill: "Kultur", xp: 36 },
  { id: "lesson-3", title: "Dialekte entdecken", skill: "Sprechen", xp: 52 }
]

const initialCommunity: CommunityState = {
  followers: [
    { id: "fl-1", handle: "@sprachbuddy", name: "Lisa M.", streak: 21 },
    { id: "fl-2", handle: "@travel_timo", name: "Timo R.", streak: 9 }
  ],
  following: [
    { id: "fo-1", handle: "@hiro_talk", name: "Hiro", streak: 31 },
    { id: "fo-2", handle: "@marta_vocab", name: "Marta", streak: 5 }
  ],
  incoming: [{ id: "in-1", handle: "@speak_easy", name: "Clara", streak: 4 }],
  outgoing: [{ id: "out-1", handle: "@polyglot_pete", name: "Pete", streak: 17 }]
}

const getHeatmapColor = (xp: number): string => {
  if (xp >= 70) return "#E16632"
  if (xp >= 45) return "#E9AF52"
  if (xp >= 20) return "#F3D8B0"
  if (xp > 0) return "#F7EEDF"
  return "#ECEDE8"
}

const mockStats = {
  userName: "Alex",
  username: "@alex_lernt",
  streak: 7,
  level: 8,
  xpTotal: 4820,
  xpToday: 85,
  xpGoal: 120,
  xpLevelCurrent: 220,
  xpLevelGoal: 400,
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

type TabKey = "home" | "progress" | "account"

export default function HomepageScreen(): ReactElement {
  const router = useRouter()
  const sessionUser = useSessionStore((s) => s.user)
  const profile = useSessionStore((s) => s.profile)

  const displayName = useMemo(() => {
    const nameParts = [profile.firstName, profile.lastName].map((part) => part.trim()).filter(Boolean)
    if (nameParts.length > 0) return nameParts.join(" ")
    const trimmed = sessionUser?.trim()
    if (trimmed && trimmed.length > 0) return trimmed
    return mockStats.userName
  }, [profile.firstName, profile.lastName, sessionUser])

  const heroInitial = displayName.charAt(0).toUpperCase()
  const accountUsername = useMemo(() => {
    const handle = profile.username.trim()
    if (handle.length > 1) return handle.startsWith("@") ? handle : `@${handle}`
    const base = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    if (!base) return mockStats.username
    const suffix = (base.charCodeAt(0) + base.length * 7) % 97
    const padded = suffix.toString().padStart(2, "0")
    return `@${base}${padded}`
  }, [profile.username, displayName])

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

  const handleShareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `Lern mit mir bei Sprachtrainer! Profil ${accountUsername} - mein Ziel: Level ${mockStats.level}.`
      })
    } catch {
      // bewusst stumm, da Share auf manchen Plattformen abgebrochen werden kann
    }
  }, [accountUsername])

  const goalProgress = Math.min(1, mockStats.xpToday / mockStats.xpGoal)
  const accountLevelProgress = Math.min(1, mockStats.xpLevelCurrent / mockStats.xpLevelGoal)
  const [community, setCommunity] = useState<CommunityState>(() => initialCommunity)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [friendHandle, setFriendHandle] = useState("@")
  const [friendStatus, setFriendStatus] = useState<"idle" | "checking" | "success" | "error">(
    "idle"
  )
  const friendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tabs = useMemo<Array<{ key: TabKey; label: string; icon: IconSymbolName }>>(
    () => [
      { key: "home" as const, label: "Home", icon: "house.fill" as const },
      { key: "progress" as const, label: "Progress", icon: "chart.bar.fill" as const },
      { key: "account" as const, label: "Account", icon: "person.crop.circle.fill" as const }
    ],
    []
  )

  const handleTabPress = useCallback((key: TabKey) => {
    setActiveTab(key)
  }, [])

  const maxTrendValue = useMemo(
    () => Math.max(...mockProgressTrend.map((point) => point.xp), 1),
    []
  )
  const weeklyXpTotal = useMemo(
    () => mockProgressTrend.reduce((sum, point) => sum + point.xp, 0),
    []
  )
  const heatmapData = useMemo(() => {
    const fillerColumns = 4
    const days = mockProgressHeatmap[0]?.length ?? 0
    const filler = Array.from({ length: fillerColumns }, () =>
      Array.from({ length: days }, () => 0)
    )
    return [...mockProgressHeatmap, ...filler]
  }, [])
  const xpToDailyGoal = Math.max(mockStats.xpGoal - mockStats.xpToday, 0)
  const xpToLevelUp = Math.max(mockStats.xpLevelGoal - mockStats.xpLevelCurrent, 0)

  useEffect(() => {
    return () => {
      if (friendTimerRef.current) clearTimeout(friendTimerRef.current)
    }
  }, [])

  const handleSeeAllLessons = useCallback(() => {
    Alert.alert("Demnaechst", "Die komplette Verlaufsliste folgt in einem spaeteren Update.")
  }, [])

  const handleSupportShortcutPress = useCallback((key: string) => {
    const titles: Record<string, string> = {
      faq: "FAQ & Guides",
      feedback: "Feedback senden",
      bug: "Bug melden",
      support: "Support kontaktieren"
    }
    Alert.alert(titles[key] ?? "Support", "Dieser Bereich wird demnaechst freigeschaltet.")
  }, [])

  const handleToggleAddFriend = useCallback(() => {
    setShowAddFriend((prev) => !prev)
    setFriendStatus("idle")
    if (friendTimerRef.current) {
      clearTimeout(friendTimerRef.current)
      friendTimerRef.current = null
    }
  }, [])

  const handleFriendHandleChange = useCallback((value: string) => {
    const trimmed = value.replace(/\s+/g, "")
    const normalized = trimmed.replace(/^@+/, "")
    const cleaned = normalized.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
    setFriendHandle(cleaned.length === 0 ? "@" : `@${cleaned}`)
    setFriendStatus("idle")
  }, [])

  const handleSendFriendRequest = useCallback(() => {
    const cleaned = friendHandle.slice(1)
    if (cleaned.length < 3) {
      setFriendStatus("error")
      return
    }
    const lowerHandle = friendHandle.toLowerCase()
    const existingHandles = [
      ...community.followers,
      ...community.following,
      ...community.incoming,
      ...community.outgoing
    ].map((member) => member.handle.toLowerCase())
    if (existingHandles.includes(lowerHandle) || accountUsername.toLowerCase() === lowerHandle) {
      setFriendStatus("error")
      return
    }
    setFriendStatus("checking")
    if (friendTimerRef.current) clearTimeout(friendTimerRef.current)
    friendTimerRef.current = setTimeout(() => {
      setCommunity((prev) => ({
        ...prev,
        outgoing: [
          ...prev.outgoing,
          {
            id: `out-${Date.now()}`,
            handle: friendHandle,
            name: cleaned.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
            streak: 0
          }
        ]
      }))
      setFriendStatus("success")
      setFriendHandle("@")
      friendTimerRef.current = null
    }, 650)
  }, [friendHandle, community, accountUsername])

  const handleAcceptRequest = useCallback((id: string) => {
    setCommunity((prev) => {
      const request = prev.incoming.find((entry) => entry.id === id)
      if (!request) return prev
      return {
        ...prev,
        incoming: prev.incoming.filter((entry) => entry.id !== id),
        followers: [...prev.followers, request]
      }
    })
  }, [])

  const handleDeclineRequest = useCallback((id: string) => {
    setCommunity((prev) => ({
      ...prev,
      incoming: prev.incoming.filter((entry) => entry.id !== id)
    }))
  }, [])

  const handleRemoveFollower = useCallback((id: string) => {
    setCommunity((prev) => ({
      ...prev,
      followers: prev.followers.filter((entry) => entry.id !== id)
    }))
  }, [])

  const handleUnfollow = useCallback((id: string) => {
    setCommunity((prev) => ({
      ...prev,
      following: prev.following.filter((entry) => entry.id !== id)
    }))
  }, [])

  const handleCancelOutgoing = useCallback((id: string) => {
    setCommunity((prev) => ({
      ...prev,
      outgoing: prev.outgoing.filter((entry) => entry.id !== id)
    }))
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

          <View style={styles.sessionLaunchCard}>
            <View style={styles.sessionLaunchHeader}>
              <Text style={styles.sessionLaunchTitle}>Dein Tagesziel</Text>
              <Text style={styles.sessionLaunchProgress}>
                {mockStats.xpToday} / {mockStats.xpGoal} XP
              </Text>
            </View>
            <Text style={styles.sessionLaunchHint}>
              Noch {xpToDailyGoal} XP bis Bonus Kiste. Level {mockStats.level} wartet.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.sessionLaunchButton,
                pressed ? styles.sessionLaunchButtonPressed : undefined
              ]}
              onPress={handleGoToTrainer}
            >
              <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#2A2A23" />
              <Text style={styles.sessionLaunchButtonText}>Session starten</Text>
            </Pressable>
            <View style={styles.sessionLaunchMeta}>
              <View style={[styles.sessionLaunchMetaBlock, styles.sessionLaunchMetaBlockSpacer]}>
                <Text style={styles.sessionLaunchMetaLabel}>Streak</Text>
                <Text style={styles.sessionLaunchMetaValue}>{mockStats.streak} Tage</Text>
              </View>
              <View style={[styles.sessionLaunchMetaBlock, styles.sessionLaunchMetaBlockSpacer]}>
                <Text style={styles.sessionLaunchMetaLabel}>Fokus</Text>
                <Text style={styles.sessionLaunchMetaValue}>{mockStats.focusSkill}</Text>
              </View>
              <View style={styles.sessionLaunchMetaBlock}>
                <Text style={styles.sessionLaunchMetaLabel}>XP verbleibend</Text>
                <Text style={styles.sessionLaunchMetaValue}>{xpToLevelUp} XP</Text>
              </View>
            </View>
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

      </ScrollView>
    )
  } else if (activeTab === "progress") {
    mainContent = (
      <ScrollView style={styles.container} contentContainerStyle={styles.progressContent}>
        <View style={styles.progressSummaryCard}>
          <View style={styles.progressSummaryHeader}>
            <Text style={styles.progressSummaryTitle}>Wochenstatistik</Text>
            <Text style={styles.progressSummaryMeta}>{weeklyXpTotal} XP gesammelt</Text>
          </View>
          <View style={styles.progressSummaryRow}>
            <View style={styles.progressSummaryItem}>
              <Text style={styles.progressSummaryLabel}>Level</Text>
              <Text style={styles.progressSummaryValue}>{mockStats.level}</Text>
              <Text style={styles.progressSummaryHint}>
                Noch {xpToLevelUp} XP bis Level-Up
              </Text>
            </View>
            <View style={styles.progressSummaryItem}>
              <Text style={styles.progressSummaryLabel}>Streak</Text>
              <Text style={styles.progressSummaryValue}>{mockStats.streak}</Text>
              <Text style={styles.progressSummaryHint}>
                Tagesziel in {xpToDailyGoal} XP erreicht
              </Text>
            </View>
            <View style={styles.progressSummaryItem}>
              <Text style={styles.progressSummaryLabel}>Naechster Unlock</Text>
              <Text style={styles.progressSummaryValueSmall}>{mockStats.nextUnlock}</Text>
              <Text style={styles.progressSummaryHint}>Neue Inhalte warten auf dich</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressHeatmapCard}>
          <Text style={styles.progressSectionTitle}>XP Heatmap</Text>
          <Text style={styles.progressSectionHint}>Deine Aktivitaet der letzten 4 Wochen</Text>
          <View style={styles.heatmapGrid}>
            {heatmapData.map((week, weekIndex) => (
              <View key={`heatmap-week-${weekIndex}`} style={styles.heatmapColumn}>
                {week.map((value, dayIndex) => (
                  <View
                    key={`heatmap-day-${weekIndex}-${dayIndex}`}
                    style={[styles.heatmapCell, { backgroundColor: getHeatmapColor(value) }]}
                  />
                ))}
              </View>
            ))}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendLabel}>Weniger</Text>
            <View style={styles.heatmapLegendScale}>
              {[0, 20, 45, 70].map((threshold) => (
                <View
                  key={`legend-${threshold}`}
                  style={[
                    styles.heatmapLegendCell,
                    { backgroundColor: getHeatmapColor(threshold + 1) }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.heatmapLegendLabel}>Mehr</Text>
          </View>
        </View>

        <View style={styles.progressTrendCard}>
          <View style={styles.progressTrendHeader}>
            <Text style={styles.progressSectionTitle}>Trend</Text>
            <Text style={styles.progressSectionHint}>XP pro Tag</Text>
          </View>
          <View style={styles.trendChart}>
            {mockProgressTrend.map((point) => (
              <View key={point.day} style={styles.trendBarWrapper}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: `${Math.max((point.xp / maxTrendValue) * 100, 8)}%`
                    }
                  ]}
                />
                <Text style={styles.trendLabel}>{point.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.progressHighlightsCard}>
          {mockProgressHighlights.map((highlight) => (
            <View key={highlight.id} style={styles.highlightItem}>
              <Text style={styles.highlightLabel}>{highlight.label}</Text>
              <Text style={styles.highlightValue}>{highlight.value}</Text>
              <Text style={styles.highlightHint}>{highlight.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.progressLessonsCard}>
          <View style={styles.progressLessonsHeader}>
            <Text style={styles.progressSectionTitle}>Zuletzt bearbeitet</Text>
            <Pressable
              onPress={handleSeeAllLessons}
              style={({ pressed }) => [
                styles.seeAllButton,
                pressed ? styles.seeAllButtonPressed : undefined
              ]}
            >
              <Text style={styles.seeAllButtonText}>Alle anzeigen</Text>
            </Pressable>
          </View>
          {mockRecentLessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonRow}>
              <View style={styles.lessonAvatar}>
                <IconSymbol name="paperplane.fill" size={18} color="#F9F8F8" />
              </View>
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {lesson.skill} - {lesson.xp} XP
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    )
  } else {
    mainContent = (
      <ScrollView style={styles.container} contentContainerStyle={styles.accountContent}>
        <View style={styles.accountHeader}>
          <View style={styles.accountHeaderInfo}>
            <Text style={styles.accountName}>{displayName}</Text>
            <Text style={styles.accountUsername}>{accountUsername}</Text>
          </View>
          <View style={styles.accountHeaderActions}>
            <Pressable
              onPress={handleShareProfile}
              accessibilityRole="button"
              accessibilityLabel="Profil teilen"
              style={({ pressed }) => [
                styles.accountActionButton,
                pressed ? styles.accountActionButtonPressed : undefined
              ]}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color="#2A2A23" />
            </Pressable>
            <Pressable
              onPress={handleOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Einstellungen oeffnen"
              style={({ pressed }) => [
                styles.accountActionButton,
                pressed ? styles.accountActionButtonPressed : undefined
              ]}
            >
              <IconSymbol name="gearshape.fill" size={20} color="#2A2A23" />
            </Pressable>
          </View>
        </View>

        <View style={styles.accountStatsRow}>
          <View style={styles.accountStatCard}>
            <Text style={styles.accountStatLabel}>Level</Text>
            <Text style={styles.accountStatValue}>{mockStats.level}</Text>
            <Text style={styles.accountStatHint}>Bleib dran, um Level {mockStats.level + 1} zu knacken.</Text>
          </View>
          <View style={styles.accountStatCard}>
            <Text style={styles.accountStatLabel}>Gesamt XP</Text>
            <Text style={styles.accountStatValue}>{mockStats.xpTotal}</Text>
            <Text style={styles.accountStatHint}>Alle gesammelten Erfahrungspunkte.</Text>
          </View>
          <View style={styles.accountStatCard}>
            <Text style={styles.accountStatLabel}>Streak</Text>
            <Text style={styles.accountStatValue}>{mockStats.streak}</Text>
            <Text style={styles.accountStatHint}>Tage in Serie - keine Pause!</Text>
          </View>
        </View>

        <View style={styles.accountLevelCard}>
          <View style={styles.accountLevelHeader}>
            <Text style={styles.accountLevelTitle}>XP bis Level-Up</Text>
            <Text style={styles.accountLevelMeta}>{Math.round(accountLevelProgress * 100)}%</Text>
          </View>
          <View style={styles.accountProgressTrack}>
            <View
              style={[
                styles.accountProgressFill,
                { width: `${Math.max(accountLevelProgress * 100, 6)}%` }
              ]}
            />
          </View>
          <Text style={styles.accountProgressHint}>
            {mockStats.xpLevelCurrent} / {mockStats.xpLevelGoal} XP | Gesamt {mockStats.xpTotal} XP
          </Text>
        </View>

        <View style={styles.accountHighlightCard}>
          <Text style={styles.accountHighlightTitle}>Streak Fokus</Text>
          <Text style={styles.accountHighlightValue}>{mockStats.streak} Tage</Text>
          <Text style={styles.accountHighlightHint}>
            Halte deinen Streak, um Bonus XP und Belohnungen freizuschalten.
          </Text>
        </View>

        <Pressable
          onPress={handleGoToOnboarding}
          style={({ pressed }) => [
            styles.accountOnboardingButton,
            pressed ? styles.accountOnboardingButtonPressed : undefined
          ]}
        >
          <Text style={styles.accountOnboardingButtonText}>Profil & Ziele konfigurieren</Text>
        </Pressable>

        <View style={styles.accountCommunityCard}>
          <View style={styles.communityHeader}>
            <View style={styles.communityHeaderText}>
              <Text style={styles.communityTitle}>Community</Text>
              <Text style={styles.communityHint}>Verbinde dich mit Lernpartnern!.</Text>
            </View>
            <Pressable
              onPress={handleToggleAddFriend}
              style={({ pressed }) => [
                styles.addFriendToggle,
                pressed ? styles.addFriendTogglePressed : undefined
              ]}
            >
              <IconSymbol name="person.badge.plus.fill" size={18} color="#F9F8F8" />
              <Text style={styles.addFriendToggleText}>
                {showAddFriend ? "Schliessen" : "Freund hinzufuegen"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.communityCounters}>
            <View style={styles.communityCounter}>
              <Text style={styles.communityCount}>{community.followers.length}</Text>
              <Text style={styles.communityCountLabel}>Follower</Text>
            </View>
            <View style={styles.communityCounter}>
              <Text style={styles.communityCount}>{community.following.length}</Text>
              <Text style={styles.communityCountLabel}>Following</Text>
            </View>
            <View style={styles.communityCounter}>
              <Text style={styles.communityCount}>{community.incoming.length}</Text>
              <Text style={styles.communityCountLabel}>Anfragen</Text>
            </View>
          </View>

          {showAddFriend ? (
            <View style={styles.addFriendCard}>
              <Text style={styles.addFriendLabel}>Freund per Nutzername</Text>
              <View style={styles.addFriendRow}>
                <TextInput
                  value={friendHandle}
                  onChangeText={handleFriendHandleChange}
                  placeholder="@username"
                  autoCapitalize="none"
                  style={styles.addFriendInput}
                />
                <Pressable
                  onPress={handleSendFriendRequest}
                  style={({ pressed }) => [
                    styles.addFriendButton,
                    pressed ? styles.addFriendButtonPressed : undefined
                  ]}
                >
                  {friendStatus === "checking" ? (
                    <ActivityIndicator size="small" color="#F9F8F8" />
                  ) : (
                    <Text style={styles.addFriendButtonText}>Senden</Text>
                  )}
                </Pressable>
              </View>
              {friendStatus === "success" ? (
                <Text style={styles.addFriendStatusSuccess}>Anfrage gesendet!</Text>
              ) : friendStatus === "error" ? (
                <Text style={styles.addFriendStatusError}>
                  Handle pruefen - vielleicht existiert der Account bereits.
                </Text>
              ) : null}

              <View style={styles.addFriendDivider} />
              <View style={styles.addFriendQr}>
                <IconSymbol
                  name="person.2.fill"
                  size={28}
                  color="#2A2A23"
                  style={styles.addFriendQrIcon}
                />
                <View style={styles.qrPlaceholderBox}>
                  <Text style={styles.qrPlaceholderText}>QR-Share (bald verfuegbar)</Text>
                </View>
              </View>
            </View>
          ) : null}

          {community.incoming.length > 0 ? (
            <View style={styles.communitySection}>
              <Text style={styles.communitySectionTitle}>Ausstehende Anfragen</Text>
              {community.incoming.map((member) => (
                <View key={member.id} style={styles.communityRow}>
                  <View style={styles.communityAvatar}>
                    <Text style={styles.communityAvatarText}>{member.handle.charAt(1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.communityCopy}>
                    <Text style={styles.communityHandle}>{member.handle}</Text>
                <Text style={styles.communityMeta}>{member.name} - Streak {member.streak}</Text>
              </View>
              <View style={styles.communityActions}>
                <Pressable
                  onPress={() => handleAcceptRequest(member.id)}
                      style={({ pressed }) => [
                        styles.communityActionButton,
                        styles.communityActionPrimary,
                        pressed ? styles.communityActionPressed : undefined
                      ]}
                    >
                      <IconSymbol name="person.crop.circle.badge.checkmark" size={18} color="#F9F8F8" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeclineRequest(member.id)}
                      style={({ pressed }) => [
                        styles.communityActionButton,
                        styles.communityActionButtonSecondary,
                        pressed ? styles.communityActionPressed : undefined
                      ]}
                    >
                      <IconSymbol name="chevron.right" size={16} color="#2A2A23" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {community.outgoing.length > 0 ? (
            <View style={styles.communitySection}>
              <Text style={styles.communitySectionTitle}>Wartende Anfragen</Text>
              {community.outgoing.map((member) => (
                <View key={member.id} style={styles.communityRow}>
                  <View style={styles.communityAvatarPending}>
                    <IconSymbol name="person.crop.circle.badge.clock" size={18} color="#2A2A23" />
                  </View>
                  <View style={styles.communityCopy}>
                    <Text style={styles.communityHandle}>{member.handle}</Text>
                    <Text style={styles.communityMeta}>Ausstehend - Streak {member.streak}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleCancelOutgoing(member.id)}
                    style={({ pressed }) => [
                      styles.communityActionGhost,
                      pressed ? styles.communityActionPressed : undefined
                    ]}
                  >
                    <Text style={styles.communityActionGhostText}>Zurueckziehen</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.communitySection}>
            <Text style={styles.communitySectionTitle}>Follower</Text>
            {community.followers.length === 0 ? (
              <Text style={styles.communityEmpty}>Noch keine Follower - teile dein Profil!</Text>
            ) : (
              community.followers.map((member) => (
                <View key={member.id} style={styles.communityRow}>
                  <View style={styles.communityAvatar}>
                    <Text style={styles.communityAvatarText}>{member.handle.charAt(1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.communityCopy}>
                    <Text style={styles.communityHandle}>{member.handle}</Text>
                    <Text style={styles.communityMeta}>{member.name} - Streak {member.streak}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveFollower(member.id)}
                    style={({ pressed }) => [
                      styles.communityActionGhost,
                      pressed ? styles.communityActionPressed : undefined
                    ]}
                  >
                    <Text style={styles.communityActionGhostText}>Entfernen</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.communitySection}>
            <Text style={styles.communitySectionTitle}>Following</Text>
            {community.following.length === 0 ? (
              <Text style={styles.communityEmpty}>Folge Lernenden, um ihre Fortschritte zu sehen.</Text>
            ) : (
              community.following.map((member) => (
                <View key={member.id} style={styles.communityRow}>
                  <View style={styles.communityAvatar}>
                    <Text style={styles.communityAvatarText}>{member.handle.charAt(1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.communityCopy}>
                    <Text style={styles.communityHandle}>{member.handle}</Text>
                    <Text style={styles.communityMeta}>{member.name} - Streak {member.streak}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleUnfollow(member.id)}
                    style={({ pressed }) => [
                      styles.communityActionGhost,
                      pressed ? styles.communityActionPressed : undefined
                    ]}
                  >
                    <Text style={styles.communityActionGhostText}>Entfolgen</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.accountSupportCard}>
          <Text style={styles.accountSupportTitle}>Support & Feedback</Text>
          <Text style={styles.accountSupportHint}>
            Hol dir Hilfe oder teile deine Ideen mit dem Team.
          </Text>
          <View style={styles.supportGrid}>
            {supportShortcuts.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handleSupportShortcutPress(item.key)}
                style={({ pressed }) => [
                  styles.supportCardItem,
                  pressed ? styles.supportCardItemPressed : undefined
                ]}
              >
                <View style={styles.supportIconWrap}>
                  <IconSymbol name={item.icon} size={20} color="#2A2A23" />
                </View>
                <Text style={styles.supportItemTitle}>{item.title}</Text>
                <Text style={styles.supportItemHint}>{item.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
                    pressed ? styles.tabItemPressed : undefined
                  ]}
                  onPress={() => handleTabPress(tab.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <IconSymbol
                    name={tab.icon}
                    size={22}
                    color={isActive ? "#1F1F1F" : "#8E8E8E"}
                    style={styles.tabIcon}
                  />
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
  progressContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 160,
    flexGrow: 1
  },
  progressSummaryCard: {
    backgroundColor: "#2A2A23",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6
  },
  progressSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  progressSummaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9F8F8"
  },
  progressSummaryMeta: {
    fontSize: 14,
    color: "#F3D8B0"
  },
  progressSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8
  },
  progressSummaryItem: {
    flex: 1,
    backgroundColor: "#35352F",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    minWidth: 120
  },
  progressSummaryLabel: {
    fontSize: 12,
    color: "#C9C8BE",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  progressSummaryValue: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "700",
    color: "#F9F8F8"
  },
  progressSummaryValueSmall: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#F9F8F8"
  },
  progressSummaryHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#B3B3AA"
  },
  progressHeatmapCard: {
    marginTop: 24,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  progressSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2A23"
  },
  progressSectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B6B61"
  },
  heatmapGrid: {
    flexDirection: "row",
    marginTop: 18,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  heatmapColumn: {
    width: 20
  },
  heatmapCell: {
    width: 20,
    height: 20,
    borderRadius: 4
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18
  },
  heatmapLegendLabel: {
    fontSize: 11,
    color: "#6B6B61"
  },
  heatmapLegendScale: {
    flexDirection: "row",
    marginHorizontal: 12
  },
  heatmapLegendCell: {
    width: 20,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4
  },
  progressTrendCard: {
    marginTop: 24,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  progressTrendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  trendChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 12,
    height: 120
  },
  trendBarWrapper: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4
  },
  trendBar: {
    width: 20,
    borderRadius: 12,
    backgroundColor: "#E16632",
    marginBottom: 8
  },
  trendLabel: {
    fontSize: 12,
    color: "#6B6B61"
  },
  progressHighlightsCard: {
    marginTop: 24,
    backgroundColor: "#2A2A23",
    borderRadius: 24,
    padding: 22,
    flexDirection: "column"
  },
  highlightItem: {
    backgroundColor: "#35352F",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16
  },
  highlightLabel: {
    fontSize: 12,
    color: "#B3B3AA",
    textTransform: "uppercase"
  },
  highlightValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "700",
    color: "#F9F8F8"
  },
  highlightHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#D4D3CA"
  },
  progressLessonsCard: {
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  progressLessonsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#EFEDE8"
  },
  seeAllButtonPressed: {
    opacity: 0.85
  },
  seeAllButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A2A23"
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12
  },
  lessonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E16632",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  lessonCopy: {
    flex: 1
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2A23"
  },
  lessonMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B6B61"
  },
  heroCard: {
    backgroundColor: "#2A2A23",
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
    backgroundColor: "#F2CF7A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16
  },
  heroInitial: {
    color: "#2A2A23",
    fontSize: 28,
    fontWeight: "700"
  },
  heroGreeting: { fontSize: 22, fontWeight: "700", color: "#F9F8F8" },
  heroMeta: { marginTop: 4, fontSize: 15, color: "#F2CF7A" },
  progressSection: { marginTop: 24 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  progressLabel: { fontSize: 14, color: "#F9F8F8" },
  progressValue: { fontSize: 14, fontWeight: "600", color: "#F2CF7A" },
  progressTrack: {
    height: 16,
    borderRadius: 12,
    backgroundColor: "#3B3B34",
    marginTop: 12,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F2CF7A",
    borderRadius: 12
  },
  progressHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#D4D3CA"
  },
  sessionLaunchCard: {
    marginTop: 24,
    backgroundColor: "#1F1F1A",
    borderRadius: 28,
    padding: 24
  },
  sessionLaunchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sessionLaunchTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F9F8F8"
  },
  sessionLaunchProgress: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F2CF7A"
  },
  sessionLaunchHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#D4D3CA"
  },
  sessionLaunchButton: {
    marginTop: 18,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#F2CF7A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  sessionLaunchButtonPressed: {
    opacity: 0.92
  },
  sessionLaunchButtonText: {
    marginLeft: 10,
    color: "#2A2A23",
    fontSize: 16,
    fontWeight: "700"
  },
  sessionLaunchMeta: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sessionLaunchMetaBlock: {
    flex: 1
  },
  sessionLaunchMetaBlockSpacer: {
    marginRight: 12
  },
  sessionLaunchMetaLabel: {
    fontSize: 11,
    color: "#B3B3AA",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  sessionLaunchMetaValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#F2CF7A"
  },
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
  section: { marginTop: 28 },
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
  accountContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 160
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  accountHeaderInfo: {
    flex: 1
  },
  accountName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2A2A23"
  },
  accountUsername: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B6B61"
  },
  accountHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16
  },
  accountActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  accountActionButtonPressed: {
    transform: [{ scale: 0.95 }]
  },
  accountStatsRow: {
    flexDirection: "row",
    marginTop: 32,
    marginHorizontal: -8
  },
  accountStatCard: {
    flex: 1,
    backgroundColor: "#F9F8F8",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  accountStatLabel: {
    fontSize: 12,
    color: "#6B6B61",
    textTransform: "uppercase"
  },
  accountStatValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "700",
    color: "#2A2A23"
  },
  accountStatHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B6B61"
  },
  accountLevelCard: {
    marginTop: 28,
    backgroundColor: "#2A2A23",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6
  },
  accountLevelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  accountLevelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F9F8F8"
  },
  accountLevelMeta: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F2CF7A"
  },
  accountProgressTrack: {
    height: 12,
    borderRadius: 8,
    backgroundColor: "#494941",
    marginTop: 18,
    overflow: "hidden"
  },
  accountProgressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#F2CF7A"
  },
  accountProgressHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#F9F8F8"
  },
  accountHighlightCard: {
    marginTop: 28,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5
  },
  accountHighlightTitle: {
    fontSize: 12,
    color: "#6B6B61",
    textTransform: "uppercase"
  },
  accountHighlightValue: {
    marginTop: 12,
    fontSize: 32,
    fontWeight: "700",
    color: "#2A2A23"
  },
  accountHighlightHint: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B6B61"
  },
  accountOnboardingButton: {
    marginTop: 20,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#2A2A23",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5
  },
  accountOnboardingButtonPressed: {
    opacity: 0.9
  },
  accountOnboardingButtonText: {
    color: "#F9F8F8",
    fontSize: 15,
    fontWeight: "700"
  },
  accountSupportCard: {
    marginTop: 28,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  accountSupportTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2A23"
  },
  accountSupportHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B6B61"
  },
  supportGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8
  },
  supportCardItem: {
    width: "50%",
    padding: 12
  },
  supportCardItemPressed: {
    opacity: 0.88
  },
  supportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFEDE8",
    alignItems: "center",
    justifyContent: "center"
  },
  supportItemTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A23"
  },
  supportItemHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B6B61"
  },
  accountCommunityCard: {
    marginTop: 28,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  communityHeader: {
    flexDirection: "column",
    alignItems: "flex-start"
  },
  communityHeaderText: {
    width: "100%"
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A23"
  },
  communityHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B6B61",
    maxWidth: 220
  },
  addFriendToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A23",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignSelf: "flex-start",
    marginTop: 16
  },
  addFriendTogglePressed: {
    opacity: 0.9
  },
  addFriendToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F8F8",
    marginLeft: 8
  },
  communityCounters: {
    flexDirection: "row",
    marginTop: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3
  },
  communityCounter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 6
  },
  communityCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2A23"
  },
  communityCountLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B6B61"
  },
  addFriendCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3
  },
  addFriendLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2A2A23"
  },
  addFriendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#F3F2F2",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15
  },
  addFriendButton: {
    backgroundColor: "#E16632",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginLeft: 12
  },
  addFriendButtonPressed: {
    opacity: 0.9
  },
  addFriendButtonText: {
    color: "#F9F8F8",
    fontSize: 14,
    fontWeight: "700"
  },
  addFriendStatusSuccess: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D"
  },
  addFriendStatusError: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C"
  },
  addFriendDivider: {
    marginVertical: 18,
    height: 1,
    backgroundColor: "#ECEDE8"
  },
  addFriendQr: {
    alignItems: "center"
  },
  addFriendQrIcon: {
    marginBottom: 12
  },
  qrPlaceholderBox: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9C8BE",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: "#6B6B61"
  },
  communitySection: {
    marginTop: 24
  },
  communitySectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2A2A23",
    marginBottom: 12
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10
  },
  communityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFEDE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  communityAvatarPending: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3D8B0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  communityAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A23"
  },
  communityCopy: {
    flex: 1
  },
  communityHandle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A23"
  },
  communityMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B6B61"
  },
  communityActions: {
    flexDirection: "row"
  },
  communityActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFEDE8",
    alignItems: "center",
    justifyContent: "center"
  },
  communityActionButtonSpacing: {
    marginLeft: 8
  },
  communityActionPrimary: {
    backgroundColor: "#2A2A23"
  },
  communityActionPressed: {
    opacity: 0.85
  },
  communityActionButtonSecondary: {
    marginLeft: 8
  },
  communityActionGhost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#EFEDE8",
    marginLeft: 12
  },
  communityActionGhostText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2A2A23"
  },
  communityEmpty: {
    fontSize: 12,
    color: "#6B6B61"
  },
  tabBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 12
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  tabItemPressed: {
    opacity: 0.8
  },
  tabIcon: {
    marginBottom: 4
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E8E"
  },
  tabLabelActive: {
    color: "#1F1F1F"
  }
})
