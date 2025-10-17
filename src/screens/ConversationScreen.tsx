import React, { useCallback, useEffect, useRef, useState } from "react"
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native"
import { Audio } from "expo-av"
import * as Speech from "expo-speech"
import { chatReply, sttUpload } from "../lib/api"
import { startRecording, stopRecording } from "../lib/audio"
import { useSessionStore } from "../store/session"
import type { Message } from "../types"

export default function ConversationScreen(): JSX.Element {
  const { language, level, history, appendMessage, user } = useSessionStore()
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const isHeldRef = useRef(false)

  useEffect(() => {
    return () => {
      const rec = recording
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => undefined)
      }
    }
  }, [recording])

  const handleStart = useCallback(async () => {
    if (busy || recording) return
    try {
      const rec = await startRecording()
      setRecording(rec)
      isHeldRef.current = true
    } catch (e) {
      Alert.alert("Mic Error", e instanceof Error ? e.message : "Failed to start recording")
    }
  }, [busy, recording])

  const handleStop = useCallback(async () => {
    if (!recording || !isHeldRef.current) return
    setBusy(true)
    try {
      const uri = await stopRecording(recording)
      setRecording(null)
      isHeldRef.current = false

      const text = await sttUpload(uri)
      setLastTranscript(text)
      const userMsg: Message = { role: "user", content: text }
      appendMessage(userMsg)

      const reply = await chatReply(level, [...history, userMsg], user)
      const botMsg: Message = { role: "assistant", content: reply }
      appendMessage(botMsg)

      Speech.speak(reply, {
        language,
        pitch: 1.0,
        rate: 0.95
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setLastTranscript(`[error] ${message}`)
      Alert.alert("Conversation Error", message)
    } finally {
      setBusy(false)
    }
  }, [appendMessage, history, language, level, recording, setLastTranscript, user])

  const btnLabel = recording ? "Release to Send" : "leck meine klöten"

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(_, i) => `msg-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.botBubble]}
          >
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />
      <View pointerEvents="box-none" style={styles.micContainer}>
        <Pressable
          style={({ pressed }) => [styles.ptt, pressed || recording ? styles.pttActive : undefined]}
          onPressIn={handleStart}
          onPressOut={handleStop}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.pttText}>{btnLabel}</Text>
          )}
        </Pressable>
        {lastTranscript ? (
          <View pointerEvents="none" style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Transcript</Text>
            <Text style={styles.debugText}>{lastTranscript}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list: { padding: 16, paddingBottom: 200, gap: 8 },
  bubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "85%"
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#dbeafe"
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6"
  },
  bubbleText: { fontSize: 16, color: "#111827" },
  micContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  ptt: {
    backgroundColor: "#2563eb",
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6
  },
  pttActive: {
    backgroundColor: "#1d4ed8"
  },
  pttText: { color: "#fff", fontSize: 18, fontWeight: "600", textAlign: "center" },
  debugContainer: {
    marginTop: 200,
    width: "80%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(17, 24, 39, 0.85)"
  },
  debugTitle: {
    color: "#93c5fd",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6
  },
  debugText: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20
  }
})
