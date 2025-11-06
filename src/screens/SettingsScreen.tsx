import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  type ReactElement
} from "react"
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from "react-native"
import { useRouter } from "expo-router"
import { useSessionStore } from "../store/session"
import type { Language, Level, PersonalProfile } from "../types"

const languages: Language[] = ["ja-JP", "en-US", "de-DE"]
const levels: Level[] = ["beginner", "intermediate", "advanced"]
const reminderTimes = ["08:00", "12:00", "18:00", "21:00"] as const
const practiceFocusOptions = [
  { key: "conversation", label: "Gespraech" },
  { key: "vocab", label: "Vokabeln" },
  { key: "grammar", label: "Grammatik" }
] as const
const goalIntensityOptions = [
  { key: "casual", label: "Locker" },
  { key: "balanced", label: "Ausgewogen" },
  { key: "intense", label: "Intensiv" }
] as const

type BooleanPreferenceKey = "pushNotifications" | "dailyReminder" | "weeklySummary" | "soundEffects"

export default function SettingsScreen(): ReactElement {
  const router = useRouter()
  const {
    language,
    level,
    setLanguage,
    setLevel,
    profile,
    updateProfile,
    preferences,
    setPreference
  } = useSessionStore()
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const usernameCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestUsernameRef = useRef<string>(profile.username)

  const sanitizeUsername = useCallback((value: string): string => {
    const trimmed = value.replace(/\s+/g, "")
    const withoutAt = trimmed.replace(/^@+/, "")
    const normalized = withoutAt.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
    if (normalized.length === 0) return "@"
    return `@${normalized}`
  }, [])

  const checkUsernameAvailability = useCallback(async (handle: string) => {
    latestUsernameRef.current = handle
    await new Promise((resolve) => setTimeout(resolve, 450))
    const base = handle.slice(1)
    const blocked = ["alex", "admin", "sprachtrainer", "support", "hilfe"]
    const isValid = base.length >= 3 && !blocked.includes(base)
    if (latestUsernameRef.current !== handle) return
    setUsernameAvailable(isValid)
    setIsCheckingUsername(false)
  }, [])

  const scheduleUsernameCheck = useCallback(
    (handle: string) => {
      if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current)
      const base = handle.slice(1)
      if (base.length < 3) {
        setIsCheckingUsername(false)
        setUsernameAvailable(null)
        return
      }
      setIsCheckingUsername(true)
      usernameCheckTimerRef.current = setTimeout(() => {
        void checkUsernameAvailability(handle)
      }, 600)
    },
    [checkUsernameAvailability]
  )

  const handleProfileChange = useCallback(
    (field: keyof PersonalProfile) => (value: string) => {
      if (field === "username") {
        const sanitized = sanitizeUsername(value)
        updateProfile({ username: sanitized })
        setUsernameAvailable(null)
        scheduleUsernameCheck(sanitized)
        return
      }
      updateProfile({ [field]: value })
    },
    [sanitizeUsername, scheduleUsernameCheck, updateProfile]
  )

  const boolSettings = useMemo<
    Array<{ key: BooleanPreferenceKey; label: string; hint: string }>
  >(
    () => [
      {
        key: "pushNotifications",
        label: "Push-Benachrichtigungen",
        hint: "Updates zu neuen Lektionen und Streak-Erinnerungen"
      },
      {
        key: "dailyReminder",
        label: "Taegliche Erinnerung",
        hint: "Erhalte einen Ping zur ausgewaehlten Zeit"
      },
      {
        key: "weeklySummary",
        label: "Woechentliche Zusammenfassung",
        hint: "Fortschritt und Highlights per E-Mail"
      },
      {
        key: "soundEffects",
        label: "Soundeffekte",
        hint: "Akustisches Feedback in Lektionen aktivieren"
      }
    ],
    []
  )

  useEffect(() => {
    latestUsernameRef.current = profile.username
  }, [profile.username])

  useEffect(() => {
    return () => {
      if (usernameCheckTimerRef.current) clearTimeout(usernameCheckTimerRef.current)
    }
  }, [])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Account loeschen?",
      "Dadurch gehen alle Lernfortschritte, XP und gespeicherten Unterhaltungen dauerhaft verloren. Dieser Schritt kann nicht rueckgaengig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Account endgueltig loeschen",
          style: "destructive",
          onPress: () => {
            // TODO: Account-Loesch-Flow an API anbinden
          }
        }
      ]
    )
  }, [])

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vorname</Text>
              <TextInput
                value={profile.firstName}
                onChangeText={handleProfileChange("firstName")}
                placeholder="Vorname eingeben"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nachname</Text>
              <TextInput
                value={profile.lastName}
                onChangeText={handleProfileChange("lastName")}
                placeholder="Nachname eingeben"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nutzername</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={profile.username}
                  onChangeText={handleProfileChange("username")}
                  placeholder="@deinname"
                  autoCapitalize="none"
                  style={[styles.input, styles.inputWithAccessory]}
                />
                <View style={styles.inputAccessory}>
                  {isCheckingUsername ? (
                    <ActivityIndicator size="small" color="#E16632" />
                  ) : usernameAvailable === true ? (
                    <View style={styles.statusDotSuccess} />
                  ) : usernameAvailable === false ? (
                    <View style={styles.statusDotError} />
                  ) : null}
                </View>
              </View>
              {usernameAvailable === true ? (
                <Text style={styles.fieldStatusSuccess}>Benutzername verfuegbar!</Text>
              ) : usernameAvailable === false ? (
                <Text style={styles.fieldStatusError}>Name bereits vergeben.</Text>
              ) : null}
              <Text style={styles.fieldHint}>
                Beispiel: @deinname. Wird in Ranglisten und beim Teilen deines Profils angezeigt.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontakt & Sicherheit</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-Mail</Text>
              <TextInput
                value={profile.email}
                onChangeText={handleProfileChange("email")}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefonnummer</Text>
              <Pressable
                onPress={() => router.push("/phone-number")}
                style={({ pressed }) => [
                  styles.inputPressable,
                  pressed ? styles.inputPressablePressed : undefined
                ]}
              >
                <Text
                  style={
                    profile.phone && profile.phone.trim().length > 0
                      ? styles.inputPressableValue
                      : styles.inputPressablePlaceholder
                  }
                >
                  {profile.phone && profile.phone.trim().length > 0
                    ? profile.phone
                    : "Nummer hinzufuegen"}
                </Text>
              </Pressable>
              <Text style={styles.fieldHint}>
                Tippe, um deine Nummer mit Laendervorwahl zu hinterlegen.
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Passwort</Text>
              <TextInput
                value={profile.password}
                onChangeText={handleProfileChange("password")}
                placeholder="Neues Passwort"
                secureTextEntry
                style={styles.input}
              />
              <Text style={styles.fieldHint}>Mindestens 8 Zeichen, idealerweise mit Sonderzeichen.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sprache & Niveau</Text>
          <View style={styles.card}>
            <Text style={styles.groupLabel}>Lernsprache</Text>
            <View style={styles.chipRow}>
              {languages.map((l) => {
                const active = language === l
                return (
                  <Pressable
                    key={l}
                    onPress={() => setLanguage(l)}
                    style={({ pressed }) => [
                      styles.chip,
                      active ? styles.chipActive : undefined,
                      pressed ? styles.chipPressed : undefined
                    ]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>
                      {l}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text style={styles.groupLabel}>Level</Text>
            <View style={styles.chipRow}>
              {levels.map((lv) => {
                const active = level === lv
                return (
                  <Pressable
                    key={lv}
                    onPress={() => setLevel(lv)}
                    style={({ pressed }) => [
                      styles.chip,
                      active ? styles.chipActive : undefined,
                      pressed ? styles.chipPressed : undefined
                    ]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>
                      {lv}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training & Erinnerungen</Text>
          <View style={styles.card}>
            {boolSettings.map((setting) => (
              <View key={setting.key} style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleLabel}>{setting.label}</Text>
                  <Text style={styles.toggleHint}>{setting.hint}</Text>
                </View>
                <Switch
                  value={preferences[setting.key]}
                  onValueChange={(value) => setPreference(setting.key, value)}
                  trackColor={{ false: "#D9D9D4", true: "#F3CFA5" }}
                  thumbColor={preferences[setting.key] ? "#E16632" : "#F4F4F1"}
                />
              </View>
            ))}

            <Text style={[styles.groupLabel, styles.subGroupSpacing]}>Erinnerungszeit</Text>
            <View style={styles.chipRow}>
              {reminderTimes.map((time) => {
                const active = preferences.reminderTime === time
                return (
                  <Pressable
                    key={time}
                    onPress={() => setPreference("reminderTime", time)}
                    style={({ pressed }) => [
                      styles.chip,
                      active ? styles.chipActive : undefined,
                      pressed ? styles.chipPressed : undefined
                    ]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>
                      {time}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainingsstil</Text>
          <View style={styles.card}>
            <Text style={styles.groupLabel}>Fokus</Text>
            <View style={styles.chipRow}>
              {practiceFocusOptions.map((option) => {
                const active = preferences.practiceFocus === option.key
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setPreference("practiceFocus", option.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      active ? styles.chipActive : undefined,
                      pressed ? styles.chipPressed : undefined
                    ]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <Text style={[styles.groupLabel, styles.subGroupSpacing]}>Intensitaet</Text>
            <View style={styles.chipRow}>
              {goalIntensityOptions.map((option) => {
                const active = preferences.goalIntensity === option.key
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setPreference("goalIntensity", option.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      active ? styles.chipActive : undefined,
                      pressed ? styles.chipPressed : undefined
                    ]}
                  >
                    <Text style={[styles.chipLabel, active ? styles.chipLabelActive : undefined]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Account loeschen</Text>
          <Text style={styles.dangerHint}>
            Dieser Vorgang entfernt alle Lernstaende, Belohnungen sowie gespeicherte Verlaeufe. Stelle
            sicher, dass du eventuelle Zertifikate oder Statistiken vorher exportiert hast.
          </Text>
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed ? styles.dangerButtonPressed : undefined
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.dangerButtonText}>Account dauerhaft loeschen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 160,
    paddingTop: 32
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A23",
    marginBottom: 14
  },
  card: {
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  field: {
    marginBottom: 18
  },
  fieldLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    color: "#6B6B61",
    marginBottom: 6
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E1DA"
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center"
  },
  inputWithAccessory: {
    paddingRight: 48
  },
  inputAccessory: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  statusDotSuccess: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E"
  },
  statusDotError: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DC2626"
  },
  fieldStatusSuccess: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D"
  },
  fieldStatusError: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C"
  },
  fieldHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#8F8F87"
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A23",
    marginBottom: 12
  },
  inputPressable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E1DA"
  },
  inputPressablePressed: {
    opacity: 0.85
  },
  inputPressableValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2A23"
  },
  inputPressablePlaceholder: {
    fontSize: 16,
    color: "#8F8F87"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 8
  },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#EFEFE9",
    marginHorizontal: 6,
    marginBottom: 10
  },
  chipActive: {
    backgroundColor: "#E16632"
  },
  chipPressed: {
    opacity: 0.85
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B6B61",
    textTransform: "capitalize"
  },
  chipLabelActive: {
    color: "#F9F8F8"
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  toggleCopy: {
    flex: 1,
    paddingRight: 12
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2A2A23"
  },
  toggleHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#8F8F87"
  },
  subGroupSpacing: {
    marginTop: 16
  },
  dangerSection: {
    marginTop: 12,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B91C1C"
  },
  dangerHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#B91C1C"
  },
  dangerButton: {
    marginTop: 18,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#DC2626"
  },
  dangerButtonPressed: {
    opacity: 0.85
  },
  dangerButtonText: {
    color: "#FDF2F2",
    fontSize: 14,
    fontWeight: "700"
  }
})
