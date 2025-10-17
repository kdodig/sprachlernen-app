import React, { useMemo } from "react"
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native"
import { useSessionStore } from "../store/session"
import type { Language, Level } from "../types"

const languages: Language[] = ["ja-JP", "en-US", "de-DE"]
const levels: Level[] = ["beginner", "intermediate", "advanced"]

export default function SettingsScreen(): JSX.Element {
  const { language, level, setLanguage, setLevel, user, setUser } = useSessionStore()

  const LangButtons = useMemo(
    () =>
      languages.map((l) => (
        <Pressable
          key={l}
          style={[styles.choice, language === l && styles.choiceActive]}
          onPress={() => setLanguage(l)}
        >
          <Text style={[styles.choiceText, language === l && styles.choiceTextActive]}>{l}</Text>
        </Pressable>
      )),
    [language, setLanguage]
  )

  const LevelButtons = useMemo(
    () =>
      levels.map((lv) => (
        <Pressable
          key={lv}
          style={[styles.choice, level === lv && styles.choiceActive]}
          onPress={() => setLevel(lv)}
        >
          <Text style={[styles.choiceText, level === lv && styles.choiceTextActive]}>{lv}</Text>
        </Pressable>
      )),
    [level, setLevel]
  )

  return (
    <View style={styles.container}>
      <Text style={styles.label}>User</Text>
      <TextInput
        value={user}
        onChangeText={setUser}
        placeholder="Your name"
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Language</Text>
      <View style={styles.row}>{LangButtons}</View>

      <Text style={styles.label}>Level</Text>
      <View style={styles.row}>{LevelButtons}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16, gap: 12 },
  label: { fontSize: 14, color: "#374151", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  choiceActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd"
  },
  choiceText: { color: "#111827" },
  choiceTextActive: { color: "#1d4ed8", fontWeight: "600" }
})
