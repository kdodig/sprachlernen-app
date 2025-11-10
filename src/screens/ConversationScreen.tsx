import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native"
import type { ListRenderItem, PressableStateCallbackType } from "react-native"
import { useRouter } from "expo-router"
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio"
import { chatReply, sttUpload } from "../lib/api"
import { startRecording, stopRecording, type RecorderHandle } from "../lib/audio"
import { useSessionStore } from "../store/session"
import type { Language, LanguageCode, Message } from "../types"

const localeToLanguageCode: Record<Language, LanguageCode> = {
  "ja-JP": "ja",
  "en-US": "en",
  "de-DE": "de",
  "es-ES": "es",
  "fr-FR": "fr",
  "it-IT": "it",
  "pt-PT": "pt",
  "ko-KR": "ko",
  "zh-CN": "zh"
}

export default function ConversationScreen(): ReactElement {
  const {
    language,
    level,
    history,
    historyByLang,
    appendMessage,
    appendMessageForLang,
    targetLang,
    profilesByLang,
    user,
    resetHistory,
    resetHistoryForLang,
    initLangProfile,
    completeSessionForLang
  } = useSessionStore()
  const router = useRouter()
  const effectiveTargetLang = useMemo<LanguageCode>(
    () => targetLang ?? localeToLanguageCode[language] ?? "en",
    [targetLang, language]
  )
  const [recording, setRecording] = useState<RecorderHandle | null>(null)
  const [busy, setBusy] = useState(false)
  const [hasPressed, setHasPressed] = useState(false)
  const isHeldRef = useRef(false)
  const recordingRef = useRef<RecorderHandle | null>(null)
  const playingSoundRef = useRef<AudioPlayer | null>(null)
  const playingSubscriptionRef = useRef<{ remove: () => void } | null>(null)
  const sessionStartedAtRef = useRef<number>(Date.now())

  const cleanupPlayingSound = useCallback(() => {
    playingSubscriptionRef.current?.remove?.()
    playingSubscriptionRef.current = null
    const current = playingSoundRef.current
    if (!current) return
    try {
      current.pause()
    } catch {
      // ignore stop errors
    }
    try {
      current.remove()
    } catch {
      // ignore removal errors
    }
    playingSoundRef.current = null
  }, [])

  const resetInteractionState = useCallback((nextSessionStart: number = Date.now()) => {
    cleanupPlayingSound()
    recordingRef.current = null
    isHeldRef.current = false
    setRecording(null)
    setHasPressed(false)
    sessionStartedAtRef.current = nextSessionStart
  }, [cleanupPlayingSound])

  const playReplyAudio = useCallback(
    (audioData: string, mimeType: string) => {
      try {
        const dataUri = `data:${mimeType};base64,${audioData}`
        cleanupPlayingSound()
        const player = createAudioPlayer({ uri: dataUri })
        playingSoundRef.current = player
        const subscription = player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            cleanupPlayingSound()
          }
        })
        playingSubscriptionRef.current = subscription
        const playback = player.play() as Promise<void> | void
        if (playback && typeof (playback as Promise<void>).catch === "function") {
          void (playback as Promise<void>).catch((err) => {
            cleanupPlayingSound()
            console.warn("[tts/playback]", err)
          })
        }
      } catch (err) {
        cleanupPlayingSound()
        console.warn("[tts/playback]", err)
      }
    },
    [cleanupPlayingSound]
  )

  const stopActiveRecording = useCallback(async () => {
    const rec = recordingRef.current
    if (!rec) return
    recordingRef.current = null
    try {
      await stopRecording(rec)
    } catch (err) {
      console.warn("[recording/stop]", err)
    }
    const maybeRemove = (rec as unknown as { remove?: () => void }).remove
    if (typeof maybeRemove === "function") {
      try {
        maybeRemove.call(rec)
      } catch {
        // ignore removal errors
      }
    }
  }, [])

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "duckOthers",
      interruptionModeAndroid: "duckOthers"
    }).catch(() => undefined)

    return () => {
      void stopActiveRecording()
      cleanupPlayingSound()
    }
  }, [cleanupPlayingSound, stopActiveRecording])

  const activeHistory = useMemo(() => {
    if (targetLang) return historyByLang[targetLang] ?? []
    return history
  }, [history, historyByLang, targetLang])

  useEffect(() => {
    if (activeHistory.length === 0) {
      sessionStartedAtRef.current = Date.now()
    }
  }, [activeHistory.length])

  const activeLevel = useMemo(() => {
    if (targetLang) {
      return profilesByLang?.[targetLang]?.level ?? level
    }
    return level
  }, [level, profilesByLang, targetLang])

  const appendScopedMessage = useCallback(
    (msg: Message) => {
      if (targetLang) {
        appendMessageForLang(targetLang, msg)
      } else {
        appendMessage(msg)
      }
    },
    [appendMessage, appendMessageForLang, targetLang]
  )

  const handleStart = useCallback(async () => {
    if (busy || recording) return
    try {
      if (!hasPressed) {
        setHasPressed(true)
      }
      const rec = await startRecording()
      setRecording(rec)
      recordingRef.current = rec
      isHeldRef.current = true
    } catch (e) {
      Alert.alert("Mic Error", e instanceof Error ? e.message : "Failed to start recording")
    }
  }, [busy, recording, hasPressed])

  const handleStop = useCallback(async () => {
    if (!recording || !isHeldRef.current) return
    setBusy(true)
    try {
      const uri = await stopRecording(recording)
      setRecording(null)
      recordingRef.current = null
      isHeldRef.current = false

      const sttResult = await sttUpload(uri)
      const userMsg: Message = { role: "user", content: sttResult.text }
      const nextHistory = [...activeHistory, userMsg]
      appendScopedMessage(userMsg)

      const { reply, audio, audioMimeType, debug: chatDebugInfo } = await chatReply(
        activeLevel,
        nextHistory,
        user,
        effectiveTargetLang
      )
      const playableAudio = audio && audioMimeType ? { data: audio, mime: audioMimeType } : null
      console.log("[chatReply]", {
        audioBytes: audio ? Math.ceil(audio.length * 0.75) : 0,
        audioMimeType,
        hasAudio: Boolean(playableAudio),
        traceId: chatDebugInfo?.traceId
      })
      const botMsg: Message = { role: "assistant", content: reply }
      appendScopedMessage(botMsg)
      if (playableAudio) {
        playReplyAudio(playableAudio.data, playableAudio.mime)
      } else if (audio || audioMimeType) {
        console.warn("[tts] Audio vorhanden, aber Daten fehlen", {
          hasData: Boolean(audio),
          audioMimeType
        })
      } else {
        console.warn("[tts] Kein Audio verfuegbar", { audioMimeType })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      Alert.alert("Conversation Error", message)
    } finally {
      setBusy(false)
    }
  }, [
    activeHistory,
    activeLevel,
    appendScopedMessage,
    effectiveTargetLang,
    playReplyAudio,
    recording,
    setBusy,
    user
  ])

  const finalizeConversation = useCallback(async () => {
    const sessionStart = sessionStartedAtRef.current
    try {
      await stopActiveRecording()
    } catch (err) {
      console.warn("[session/finishRecording]", err)
    }
    const now = Date.now()
    const sessionLengthSec = Math.max(10, Math.round((now - sessionStart) / 1000))
    const userTurns = activeHistory.filter((msg) => msg.role === "user").length
    const assistantTurns = activeHistory.filter((msg) => msg.role === "assistant").length
    const baseScore = userTurns * 14 + assistantTurns * 6
    const paceBonus = Math.floor(sessionLengthSec / 60) * 8
    const xpEarned = Math.max(20, baseScore + paceBonus)
    const rewardLang = targetLang ?? effectiveTargetLang

    initLangProfile(rewardLang)
    completeSessionForLang(rewardLang, {
      xpEarned,
      sessionLengthSec,
      userTurns,
      assistantTurns
    })

    if (targetLang) resetHistoryForLang(targetLang)
    else resetHistory()

    resetInteractionState(now)
    router.replace("/reward")
  }, [
    activeHistory,
    completeSessionForLang,
    effectiveTargetLang,
    initLangProfile,
    resetHistory,
    resetHistoryForLang,
    router,
    resetInteractionState,
    stopActiveRecording,
    targetLang
  ])

  const handleFinishConversation = useCallback(() => {
    if (activeHistory.length === 0) {
      void finalizeConversation()
      return
    }
    Alert.alert("Session beenden?", "Moechtest du die Session wirklich abschliessen?", [
      { text: "Weiter ueben", style: "cancel" },
      {
        text: "Belohnung anzeigen",
        style: "destructive",
        onPress: () => {
          void finalizeConversation()
        }
      }
    ])
  }, [activeHistory.length, finalizeConversation])

  const handleRestart = useCallback(() => {
    void (async () => {
      await stopActiveRecording()
      if (targetLang) resetHistoryForLang(targetLang)
      else resetHistory()
      resetInteractionState()
    })()
  }, [resetHistoryForLang, resetHistory, resetInteractionState, stopActiveRecording, targetLang])

  const btnLabel = hasPressed ? "" : "Gedrueckt halten, um zu sprechen"
  const renderMessage: ListRenderItem<Message> = useCallback(
    ({ item }) => (
      <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.botBubble]}>
        <Text style={styles.bubbleText}>{item.content}</Text>
      </View>
    ),
    []
  )
  const messageKeyExtractor = useCallback((_: Message, index: number) => `msg-${index}`, [])
  const restartButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.restartButton,
      pressed ? styles.restartButtonPressed : undefined
    ],
    []
  )
  const finishButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.finishButton,
      pressed ? styles.finishButtonPressed : undefined
    ],
    []
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={activeHistory}
        keyExtractor={messageKeyExtractor}
        contentContainerStyle={styles.list}
        renderItem={renderMessage}
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
      </View>
      <View style={styles.bottomBar}>
        <Pressable
          style={restartButtonStyle}
          onPress={handleRestart}
          accessibilityLabel="Session neu starten"
        >
          <Text style={styles.restartIcon}>{"\u21BA"}</Text>
          <Text style={styles.restartLabel}>Reset</Text>
        </Pressable>
        <Pressable style={finishButtonStyle} onPress={handleFinishConversation}>
          <Text style={styles.finishButtonText}>Session beenden</Text>
        </Pressable>
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
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  restartButton: {
    width: 72,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center"
  },
  restartButtonPressed: {
    opacity: 0.85
  },
  restartIcon: {
    color: "#2563eb",
    fontSize: 20,
    fontWeight: "700"
  },
  restartLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  finishButton: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6
  },
  finishButtonPressed: {
    opacity: 0.9
  },
  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  }
})
