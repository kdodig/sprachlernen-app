import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native"
import * as FileSystem from "expo-file-system/legacy"
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio"
import { chatReply, sttUpload, type ApiDebugInfo } from "../lib/api"
import { startRecording, stopRecording, type RecorderHandle } from "../lib/audio"
import { useSessionStore } from "../store/session"
import type { Language, LanguageCode, Message } from "../types"

const ensureDirExists = async (dir: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(dir)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }
}

const normalizeForFilename = (text: string): string => {
  const lowered = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return lowered.slice(0, 48)
}

const hashForText = (text: string): string => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

const buildTtsFilePath = (text: string, extension: string): string => {
  const baseName = normalizeForFilename(text)
  const suffix = hashForText(text)
  const safeName = baseName ? `${baseName}-${suffix}` : `tts-${suffix}`
  return `${FileSystem.documentDirectory ?? ""}tts/${safeName}.${extension}`
}

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

type SttDebugSnapshot = {
  traceId?: string
  engine?: string
  durationMs?: number
  textLength?: number
  bytes?: number
  stage?: string
  savedPath?: string
}

type ChatDebugSnapshot = {
  traceId?: string
  engine?: string
  durationMs?: number
  hasAudio?: boolean
  ttsTraceId?: string
  savedPath?: string
}

type DebugState = {
  stt?: SttDebugSnapshot & { timestamp: number }
  chat?: ChatDebugSnapshot & { timestamp: number }
}

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const toStringClean = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const lowered = value.toLowerCase()
    if (["true", "1", "yes", "on"].includes(lowered)) return true
    if (["false", "0", "no", "off"].includes(lowered)) return false
  }
  return undefined
}

const extractSttDebug = (info?: ApiDebugInfo): SttDebugSnapshot | undefined => {
  if (!info) return undefined
  const meta = info.meta ?? {}
  const headers = info.headers ?? {}
  return {
    traceId: info.traceId ?? toStringClean(meta["traceId"]),
    engine: info.engine,
    durationMs: toNumber(meta["durationMs"]),
    textLength: toNumber(meta["textLength"]),
    bytes: toNumber(headers["x-debug-stt-bytes"]),
    stage: toStringClean(meta["stage"])
  }
}

const extractChatDebug = (info?: ApiDebugInfo): ChatDebugSnapshot | undefined => {
  if (!info) return undefined
  const meta = info.meta ?? {}
  const headers = info.headers ?? {}
  return {
    traceId: info.traceId ?? toStringClean(meta["traceId"]),
    engine: info.engine,
    durationMs: toNumber(meta["durationMs"]),
    hasAudio: toBoolean(meta["hasAudio"]),
    ttsTraceId: toStringClean(meta["ttsTraceId"]) ?? toStringClean(headers["x-tts-trace"])
  }
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
    user
  } = useSessionStore()
  const effectiveTargetLang = useMemo<LanguageCode>(
    () => targetLang ?? localeToLanguageCode[language] ?? "en",
    [targetLang, language]
  )
  const [recording, setRecording] = useState<RecorderHandle | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const [hasPressed, setHasPressed] = useState(false)
  const [debugState, setDebugState] = useState<DebugState>({})
  const isHeldRef = useRef(false)
  const recordingRef = useRef<RecorderHandle | null>(null)
  const playingSoundRef = useRef<AudioPlayer | null>(null)
  const playingSubscriptionRef = useRef<{ remove: () => void } | null>(null)

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

  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

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
      const rec = recordingRef.current
      if (rec) {
        const recorder = rec as RecorderHandle
        if (typeof recorder.stop === "function" && recorder.isRecording) {
          Promise.resolve(recorder.stop()).catch(() => undefined)
        }
        const maybeRemove = (recorder as unknown as { remove?: () => void }).remove
        if (typeof maybeRemove === "function") {
          try {
            maybeRemove.call(recorder)
          } catch {
            // ignore removal errors
          }
        }
        recordingRef.current = null
      }
      cleanupPlayingSound()
    }
  }, [cleanupPlayingSound])

  const activeHistory = useMemo(() => {
    if (targetLang) return historyByLang[targetLang] ?? []
    return history
  }, [history, historyByLang, targetLang])

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
      let savedRecordingPath: string | undefined
      if (FileSystem.documentDirectory) {
        try {
          const recordingsDir = `${FileSystem.documentDirectory}recordings/`
          await ensureDirExists(recordingsDir)
          savedRecordingPath = `${recordingsDir}mic-${Date.now()}.m4a`
          await FileSystem.copyAsync({ from: uri, to: savedRecordingPath })
        } catch (copyErr) {
          console.warn("[stt/saveRecording]", copyErr)
          savedRecordingPath = undefined
        }
      }
      setRecording(null)
      recordingRef.current = null
      isHeldRef.current = false

      const sttResult = await sttUpload(uri)
      const transcript = sttResult.text.trim()
      if (!transcript) {
        throw new Error("Die Transkription war leer")
      }
      setLastTranscript(transcript)
      const sttSnapshot = extractSttDebug(sttResult.debug)
      const sttEntry = sttSnapshot
        ? { ...sttSnapshot, timestamp: Date.now(), savedPath: savedRecordingPath }
        : sttResult.debug
          ? {
              traceId: sttResult.debug.traceId,
              engine: sttResult.debug.engine,
              timestamp: Date.now(),
              savedPath: savedRecordingPath
            }
          : savedRecordingPath
            ? { timestamp: Date.now(), savedPath: savedRecordingPath }
            : undefined
      setDebugState((prev) => ({
        ...prev,
        stt: sttEntry
      }))
      const userMsg: Message = { role: "user", content: transcript }
      const nextHistory = [...activeHistory, userMsg]
      appendScopedMessage(userMsg)

      const { reply, audio, audioMimeType, debug: chatDebugInfo } = await chatReply(
        activeLevel,
        nextHistory,
        user,
        effectiveTargetLang
      )
      const chatSnapshot = extractChatDebug(chatDebugInfo)
      const hasAudio = Boolean(audio && audioMimeType)
      console.log("[chatReply]", {
        audioBytes: audio ? Math.ceil(audio.length * 0.75) : 0,
        audioMimeType,
        hasAudio,
        traceId: chatSnapshot?.traceId ?? chatDebugInfo?.traceId,
        ttsTraceId: chatSnapshot?.ttsTraceId
      })
      const botMsg: Message = { role: "assistant", content: reply }
      appendScopedMessage(botMsg)
      let savedTtsPath: string | undefined
      if (hasAudio && FileSystem.documentDirectory) {
        try {
          const mime = audioMimeType ?? "audio/mpeg"
          const extension = mime.split("/")[1]?.split(";")[0] ?? "mp3"
          const ttsDir = `${FileSystem.documentDirectory}tts/`
          await ensureDirExists(ttsDir)
          savedTtsPath = buildTtsFilePath(reply, extension)
          await FileSystem.writeAsStringAsync(savedTtsPath, audio!, {
            encoding: FileSystem.EncodingType.Base64
          })
          cleanupPlayingSound()
          const player = createAudioPlayer({ uri: savedTtsPath })
          playingSoundRef.current = player
          const subscription = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
              cleanupPlayingSound()
            }
          })
          playingSubscriptionRef.current = subscription
          player.play()
        } catch (playErr) {
          cleanupPlayingSound()
          console.warn("[tts/playback]", playErr)
        }
      } else if (hasAudio && !FileSystem.documentDirectory) {
        console.warn("[tts] Dokumentenverzeichnis fehlt, Audio kann nicht gespeichert werden")
      } else if (!hasAudio) {
        console.warn("[tts] Kein Audio verfuegbar", { audioMimeType })
      }
      setDebugState((prev) => ({
        ...prev,
        chat: {
          traceId: chatSnapshot?.traceId ?? chatDebugInfo?.traceId,
          engine: chatSnapshot?.engine ?? chatDebugInfo?.engine,
          durationMs: chatSnapshot?.durationMs,
          hasAudio,
          ttsTraceId: chatSnapshot?.ttsTraceId,
          timestamp: Date.now(),
          savedPath: savedTtsPath
        }
      }))
      if (savedTtsPath) {
        console.log("[tts] saved to", savedTtsPath)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      setLastTranscript(`[error] ${message}`)
      Alert.alert("Conversation Error", message)
    } finally {
      setBusy(false)
    }
  }, [
    activeHistory,
    activeLevel,
    appendScopedMessage,
    language,
    recording,
    cleanupPlayingSound,
    setBusy,
    setLastTranscript,
    user
  ])

  const btnLabel = hasPressed ? "" : "Gedrueckt halten, um zu sprechen"
  const debugLines = useMemo(() => {
    const lines: string[] = []
    const stt = debugState.stt
    if (stt) {
      lines.push(`[stt] trace: ${stt.traceId ?? "-"}`)
      if (stt.engine) lines.push(`[stt] engine: ${stt.engine}`)
      if (typeof stt.durationMs === "number") lines.push(`[stt] dauer: ${Math.round(stt.durationMs)} ms`)
      if (typeof stt.bytes === "number") lines.push(`[stt] upload: ${stt.bytes} B`)
      if (typeof stt.textLength === "number") lines.push(`[stt] textlaenge: ${stt.textLength}`)
      if (stt.savedPath) lines.push(`[stt] file: ${stt.savedPath}`)
      if (stt.stage) {
        lines.push(
          stt.stage === "mock"
            ? "[stt] hinweis: OpenAI deaktiviert (mock)"
            : `[stt] phase: ${stt.stage}`
        )
      }
    }
    const chat = debugState.chat
    if (chat) {
      lines.push(`[chat] trace: ${chat.traceId ?? "-"}`)
      if (chat.engine) lines.push(`[chat] engine: ${chat.engine}`)
      if (typeof chat.durationMs === "number") lines.push(`[chat] dauer: ${Math.round(chat.durationMs)} ms`)
      if (typeof chat.hasAudio === "boolean") lines.push(`[chat] audio: ${chat.hasAudio ? "ja" : "nein"}`)
      if (chat.ttsTraceId) lines.push(`[chat] tts-trace: ${chat.ttsTraceId}`)
      if (chat.savedPath) lines.push(`[chat] file: ${chat.savedPath}`)
    }
    return lines
  }, [debugState])

  return (
    <View style={styles.container}>
      <FlatList
        data={activeHistory}
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
        {lastTranscript || debugLines.length > 0 ? (
          <View pointerEvents="none" style={styles.debugContainer}>
            {lastTranscript ? (
              <>
                <Text style={styles.debugTitle}>Transcript</Text>
                <Text style={styles.debugText}>{lastTranscript}</Text>
              </>
            ) : null}
            {debugLines.length > 0 ? (
              <>
                <Text
                  style={[
                    styles.debugTitle,
                    lastTranscript ? styles.debugTitleSpacing : undefined
                  ]}
                >
                  Debug
                </Text>
                {debugLines.map((line, index) => (
                  <Text key={`debug-${index}`} style={styles.debugLine}>
                    {line}
                  </Text>
                ))}
              </>
            ) : null}
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
  },
  debugTitleSpacing: {
    marginTop: 12
  },
  debugLine: {
    color: "#bfdbfe",
    fontSize: 12,
    lineHeight: 18
  }
})
