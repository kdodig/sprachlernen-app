import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Animated
} from "react-native"
import type { PressableStateCallbackType } from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons, Feather } from "@expo/vector-icons"
import GlassCard from "../lib/components/GlassCard"
import GooeyOrb from "../lib/components/GooeyOrb"
import Background from "../lib/components/background"
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
  const insets = useSafeAreaInsets()
  const bottomBarAnim = useRef(new Animated.Value(0)).current
  const effectiveTargetLang = useMemo<LanguageCode>(
    () => targetLang ?? localeToLanguageCode[language] ?? "en",
    [targetLang, language]
  )
  const [recording, setRecording] = useState<RecorderHandle | null>(null)
  const [busy, setBusy] = useState(false)
  const [hasPressed, setHasPressed] = useState(false)
  const [historyVisible, setHistoryVisible] = useState(false)
  const [finishConfirmVisible, setFinishConfirmVisible] = useState(false)
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

  useEffect(() => {
    bottomBarAnim.setValue(0)
    Animated.parallel([
      Animated.timing(bottomBarAnim, {
        toValue: 1,
        duration: 420,
        delay: 140,
        useNativeDriver: true
      })
    ]).start()
  }, [bottomBarAnim])

  const activeHistory = useMemo(() => {
    if (targetLang) return historyByLang[targetLang] ?? []
    return history
  }, [history, historyByLang, targetLang])

  useEffect(() => {
    if (activeHistory.length === 0) {
      sessionStartedAtRef.current = Date.now()
      setHistoryVisible(false)
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
  const floatingBarAnimatedStyle = useMemo(
    () => ({
      opacity: bottomBarAnim,
      transform: [
        {
          translateY: bottomBarAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0]
          })
        }
      ]
    }),
    [bottomBarAnim]
  )
  const floatingBarBottomInset = Math.max(insets.bottom, 18)

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

  const handleShowHistory = useCallback(() => {
    if (activeHistory.length === 0) return
    setHistoryVisible(true)
  }, [activeHistory.length])

  const handleCloseHistory = useCallback(() => {
    setHistoryVisible(false)
  }, [])

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

  const handleSlowSpeech = useCallback(() => {
    console.log("slow speech")
  }, [])

  const handleDictionaryPress = useCallback(() => {
    router.push("/dictionary")
  }, [router])

  const handleFinishConversation = useCallback(() => {
    setFinishConfirmVisible(true)
  }, [])

  const handleCloseFinishConfirm = useCallback(() => {
    setFinishConfirmVisible(false)
  }, [])

  const handleConfirmFinish = useCallback(() => {
    setFinishConfirmVisible(false)
    void finalizeConversation()
  }, [finalizeConversation])

  const btnLabel = hasPressed ? "" : ""
  const iconButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.roundButton,
      pressed ? styles.roundButtonPressed : undefined
    ],
    []
  )
  const dictionaryButtonStyle = useCallback(
    ({ pressed }: PressableStateCallbackType) => [
      styles.dictionaryPressable,
      styles.dictionaryRaised,
      pressed ? styles.dictionaryPressablePressed : undefined
    ],
    []
  )

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <Background />
      </View>
      <GlassCard style={styles.conversationGlass} tint="light" intensity={25}>
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
            <GlassCard style={styles.progressTrackCard} intensity={25}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#FBD5E3", "#D9C7F8", "#AEE4FF"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.progressIndicator, { width: progressPercent }]}
                />
              </View>
            </GlassCard>
          </View>
        <View style={styles.stage}>
          <View style={styles.pttWrapper}>
            <Pressable
              onPress={handleShowHistory}
              disabled={activeHistory.length === 0}
              style={({ pressed }) => [
                styles.messageCardPressable,
                pressed ? styles.messageCardPressableActive : undefined
              ]}
            >
              <GlassCard
                style={[
                  styles.messageCard,
                  activeHistory.length === 0 ? styles.messageCardDisabled : undefined
                ]}
              >
                <Text style={styles.messageLabel}>Coach</Text>
                <Text style={styles.messageBody}>
                  {latestBotMessage
                    ? latestBotMessage.content
                    : "Noch keine Antwort."}
                </Text>
                <Text style={styles.messageHint}>
                  {activeHistory.length === 0 ? "Noch keine Verlaeufe" : "Tippen für Chat-Historie"}
                </Text>
              </GlassCard>
            </Pressable>
            <View style={styles.micContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.pttPressable,
                  pressed || recording ? styles.pttPressableActive : undefined
                ]}
                onPressIn={handleStart}
                onPressOut={handleStop}
                disabled={busy}
              >
                <View style={styles.gooeyWrapper}>
                  <GooeyOrb size={200} colorA="#E16632" colorB="#E04F28" speed={1.05} />
                  <View style={styles.pttOverlay}>
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.pttText}>{btnLabel}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </GlassCard>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.floatingBarContainer,
          floatingBarAnimatedStyle,
          { paddingBottom: floatingBarBottomInset }
        ]}
      >
        <View style={styles.floatingBarContent}>
          <Pressable
            style={iconButtonStyle}
            onPress={handleSlowSpeech}
            accessibilityRole="button"
            accessibilityLabel="audio langsamer abspielen"
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            hitSlop={8}
          >
            <GlassCard style={styles.roundButtonCard} intensity={20}>
              <Ionicons name="turtle" size={22} color="#1F1F1F" />
            </GlassCard>
          </Pressable>
          <Pressable
            style={dictionaryButtonStyle}
            onPress={handleDictionaryPress}
            accessibilityRole="button"
            accessibilityLabel="W\u00F6rterbuch \u00F6ffnen"
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          hitSlop={6}
        >
          <GlassCard style={styles.dictionaryGlass} tint="light" intensity={22}>
            <Text style={styles.dictionaryLabel}>{"Wörterbuch"}</Text>
          </GlassCard>
        </Pressable>
          <Pressable
            style={iconButtonStyle}
            onPress={handleFinishConversation}
            accessibilityRole="button"
            accessibilityLabel="Session beenden"
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            hitSlop={8}
          >
            <GlassCard style={styles.roundButtonCard} intensity={20}>
              <Feather name="x" size={22} color="#1F1F1F" />
            </GlassCard>
          </Pressable>
        </View>
      </Animated.View>
      <Modal
        transparent
        visible={historyVisible}
        animationType="fade"
        onRequestClose={handleCloseHistory}
      >
        <View style={styles.historyOverlay}>
          <Pressable style={styles.historyBackdrop} onPress={handleCloseHistory} />
          <GlassCard style={styles.historySheet} intensity={42}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>Chat-Verlauf</Text>
                <Text style={styles.historySubtitle}>Coach &amp; {user ?? "Du"}</Text>
              </View>
              <Pressable onPress={handleCloseHistory} accessibilityLabel="Verlauf schließen">
                <Text style={styles.historyClose}>Schliessen</Text>
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.historyScroll}
              showsVerticalScrollIndicator={false}
            >
              {activeHistory.length === 0 ? (
                <Text style={styles.historyEmpty}>Noch keine Nachrichten vorhanden.</Text>
              ) : (
                activeHistory.map((msg, index) => {
                  const isUser = msg.role === "user"
                  return (
                    <View
                      key={`${msg.role}-${index}-${msg.content.slice(0, 6)}`}
                      style={[
                        styles.historyBubble,
                        isUser ? styles.historyBubbleUser : styles.historyBubbleAssistant
                      ]}
                    >
                      <Text style={styles.historyMeta}>{isUser ? user ?? "Du" : "Coach"}</Text>
                      <Text style={styles.historyText}>{msg.content}</Text>
                    </View>
                  )
                })
              )}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
      <Modal
        transparent
        visible={finishConfirmVisible}
        animationType="fade"
        onRequestClose={handleCloseFinishConfirm}
      >
        <View style={styles.finishConfirmOverlay}>
          <Pressable style={styles.finishConfirmBackdrop} onPress={handleCloseFinishConfirm} />
          <GlassCard style={styles.finishConfirmCard} intensity={48}>
            <Text style={styles.finishConfirmTitle}>Session beenden?</Text>
            <Text style={styles.finishConfirmText}>
              Moechtest du deine aktuelle Session abschliessen und zur Belohnung wechseln?
            </Text>
            <View style={styles.finishConfirmActions}>
              <Pressable style={styles.finishConfirmButton} onPress={handleCloseFinishConfirm}>
                <GlassCard style={styles.finishConfirmSecondary} intensity={35}>
                  <Text style={styles.finishConfirmSecondaryText}>Weiter</Text>
                </GlassCard>
              </Pressable>
              <Pressable style={styles.finishConfirmButton} onPress={handleConfirmFinish}>
                <GlassCard style={styles.finishConfirmPrimary} intensity={45} tint="light">
                  <Text style={styles.finishConfirmPrimaryText}>Beenden</Text>
                </GlassCard>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backgroundLayer: { ...StyleSheet.absoluteFillObject },
  conversationGlass: {
    position: "absolute",
    top: 0,
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
    marginBottom: 24
  },
  progressHeader: {
    paddingBottom: 8
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B6B61",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  progressTrackCard: {
    borderRadius: 999,
    padding: 4,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "rgba(178, 138, 247, 0.35)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden"
  },
  progressIndicator: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
    overflow: "hidden"
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
    paddingTop: 50
  },
  messageCardPressable: {
    width: "100%"
  },
  messageCardPressableActive: {
    transform: [{ scale: 0.99 }]
  },
  messageCard: {
    position: "absolute",
    top: -40,
    width: "90%",
    alignSelf: "center",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    zIndex: 20,
    elevation: 20
  },
  messageCardDisabled: {
    opacity: 0.65
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
  messageHint: {
    marginTop: 16,
    fontSize: 12,
    letterSpacing: 0.4,
    color: "#6B6B61"
  },
  micContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 120,
    zIndex: 1
  },
  pttPressable: {
    alignItems: "center",
    justifyContent: "center"
  },
  pttPressableActive: {
    transform: [{ scale: 0.97 }]
  },
  gooeyWrapper: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E16632",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 38,
    elevation: 14
  },
  pttOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  pttText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  floatingBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 30,
    paddingHorizontal: 16,
    alignItems: "center",
    pointerEvents: "box-none"
  },
  floatingBarContent: {
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18
  },
  roundButton: {
    borderRadius: 999,
    overflow: "hidden"
  },
  roundButtonPressed: {
    opacity: 0.85
  },
  roundButtonCard: {
    width: 48,
    height: 48,
    borderRadius: 999,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    shadowColor: "rgba(166, 139, 210, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8
  },
  dictionaryPressable: {
    flex: 1,
    minWidth: "52%",
    borderRadius: 999,
    overflow: "hidden"
  },
  dictionaryRaised: {
    transform: [{ translateY: -6 }]
  },
  dictionaryPressablePressed: {
    opacity: 0.92
  },
  dictionaryGlass: {
    width: "100%",
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    shadowColor: "rgba(148, 152, 205, 0.4)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 14
  },
  dictionaryLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "lowercase",
    color: "#1F1324"
  },
  historyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  historyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 12, 18, 0.55)"
  },
  historySheet: {
    width: "92%",
    maxHeight: "78%",
    borderRadius: 32,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)"
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2A23"
  },
  historySubtitle: {
    fontSize: 12,
    color: "#6B6B61",
    letterSpacing: 0.4,
    marginTop: 4
  },
  historyClose: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E16632"
  },
  historyScroll: {
    paddingVertical: 8,
    paddingBottom: 16
  },
  historyEmpty: {
    textAlign: "center",
    color: "#6B6B61",
    fontSize: 14,
    paddingVertical: 32
  },
  historyBubble: {
    padding: 14,
    borderRadius: 22,
    marginBottom: 12,
    maxWidth: "88%"
  },
  historyBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255, 222, 210, 0.92)"
  },
  historyBubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.85)"
  },
  historyMeta: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#96748E",
    marginBottom: 6
  },
  historyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2A2A23"
  },
  finishConfirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  finishConfirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 12, 18, 0.55)"
  },
  finishConfirmCard: {
    width: "86%",
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  },
  finishConfirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2A23",
    marginBottom: 8,
    textAlign: "center"
  },
  finishConfirmText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5C5C54",
    textAlign: "center",
    marginBottom: 24
  },
  finishConfirmActions: {
    flexDirection: "row",
    gap: 12
  },
  finishConfirmButton: {
    flex: 1
  },
  finishConfirmSecondary: {
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)"
  },
  finishConfirmSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    letterSpacing: 0.3
  },
  finishConfirmPrimary: {
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(224, 79, 40, 0.9)"
  },
  finishConfirmPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: 0.3
  }
})
