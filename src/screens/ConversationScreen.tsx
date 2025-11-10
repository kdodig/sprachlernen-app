import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native"
import type { PressableStateCallbackType } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import GlassCard from "../lib/GlassCard"
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

const SENTENCE_TARGET = 8

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

  const userTurnCount = useMemo(
    () => activeHistory.filter((msg) => msg.role === "user").length,
    [activeHistory]
  )

  const latestBotMessage = useMemo(
    () => [...activeHistory].reverse().find((msg) => msg.role === "assistant") ?? null,
    [activeHistory]
  )

  const progressRatio = Math.min(1, userTurnCount / SENTENCE_TARGET)
  const progressPercent = `${progressRatio * 100}%`

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

  const btnLabel = hasPressed ? "" : ""
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
    <View style={styles.screen}>
      <LinearGradient
        colors={["#FFFEFF", "#FBEFF8", "#F3E6F6", "#EADFD7", "#E1D4C8"]}
        locations={[0, 0.25, 0.55, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientBackground}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={styles.gradientHighlight}
      />
      <GlassCard style={styles.conversationGlass} tint="light" intensity={45}>
        <LinearGradient
          colors={["rgba(152,205,255,0.35)", "rgba(152,205,255,0)"]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.15 }}
          style={styles.conversationGlow}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
          style={styles.conversationHighlightCard}
          pointerEvents="none"
        />
        <View style={styles.container}>
          <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Session</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressIndicator, { width: progressPercent }]} />
          </View>
        </View>
        <View style={styles.stage}>
          <View style={styles.pttWrapper}>
            <GlassCard style={styles.messageCard}>
              <Text style={styles.messageLabel}>Coach</Text>
              <Text style={styles.messageBody}>
                {latestBotMessage
                  ? latestBotMessage.content
                  : "Noch keine Antwort - starte die Session mit deiner Stimme."}
              </Text>
            </GlassCard>
            <View style={styles.micContainer}>
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
          </View>
        </View>
      </View>
    </GlassCard>
      <View style={styles.bottomBar}>
        <GlassCard style={styles.bottomBarCard} intensity={40}>
          <LinearGradient
            colors={["rgba(160,206,255,0.25)", "rgba(160,206,255,0)"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.bottomBarGlow}
            pointerEvents="none"
          />
          <View style={styles.bottomBarContent}>
            <Pressable
              style={restartButtonStyle}
              onPress={handleRestart}
              accessibilityLabel="Session neu starten"
            >
              <GlassCard style={styles.restartCard} intensity={35}>
                <Text style={styles.restartIcon}>{"\u21BA"}</Text>
              </GlassCard>
            </Pressable>
            <Pressable style={finishButtonStyle} onPress={handleFinishConversation}>
              <GlassCard style={styles.finishCard} intensity={42} tint="light">
                <Text style={styles.finishButtonText}>Session beenden</Text>
              </GlassCard>
            </Pressable>
          </View>
        </GlassCard>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F1F4" },
  gradientBackground: { ...StyleSheet.absoluteFillObject },
  gradientHighlight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8
  },
  conversationGlass: {
    position: "absolute",
    top: 18,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    padding: 0,
    backgroundColor: "rgba(252, 249, 251, 0.78)",
    overflow: "hidden",
    shadowColor: "rgba(200, 189, 205, 0.6)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 34,
    elevation: 14
  },
  conversationGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1
  },
  conversationHighlightCard: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5
  },
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "transparent"
  },
  progressContainer: {
    paddingBottom: 18
  },
  progressHeader: {
    paddingTop: 10,
    marginBottom: 8
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B6B61",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    overflow: "hidden"
  },
  progressIndicator: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#E16632"
  },
  stage: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 150
  },
  pttWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    position: "relative",
    paddingTop: 110
  },
  messageCard: {
    position: "absolute",
    top: 0,
    width: "90%",
    alignSelf: "center",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    zIndex: 2
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#111111",
    marginBottom: 12
  },
  messageBody: {
    fontSize: 20,
    lineHeight: 28,
    color: "#111111",
    fontWeight: "500"
  },
  micContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%"
  },
  ptt: {
    backgroundColor: "rgba(224, 79, 40, 0.9)",
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    shadowColor: "#E04F28",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 9
  },
  pttActive: {
    backgroundColor: "#B03618"
  },
  pttText: { color: "#fff", fontSize: 18, fontWeight: "600", textAlign: "center" },
  bottomBar: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 50
  },
  bottomBarCard: {
    width: "100%",
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 252, 254, 0.78)",
    overflow: "hidden",
    shadowColor: "rgba(200, 189, 205, 0.45)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 26,
    elevation: 12
  },
  bottomBarGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16
  },
  restartButton: {
    width: 72,
    borderRadius: 24
  },
  restartButtonPressed: {
    transform: [{ translateY: 2 }]
  },
  restartCard: {
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.4)"
  },
  restartIcon: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "700"
  },
  finishButton: {
    flex: 1,
    borderRadius: 28
  },
  finishButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  finishCard: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)"
  },
  finishButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4
  }
})
