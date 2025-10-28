import { AudioModule, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio"
import type { AudioMode, AudioRecorder } from "expo-audio"

const recordingMode: Partial<AudioMode> = {
  allowsRecording: true,
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
  interruptionMode: "doNotMix",
  interruptionModeAndroid: "doNotMix"
}

const playbackMode: Partial<AudioMode> = {
  allowsRecording: false,
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
  interruptionMode: "duckOthers",
  interruptionModeAndroid: "duckOthers"
}

export type RecorderHandle = AudioRecorder

export async function requestMicPerms(): Promise<boolean> {
  const { status, granted } = await requestRecordingPermissionsAsync()
  if (status !== "granted" && !granted) return false
  await setAudioModeAsync(recordingMode).catch(() => undefined)
  return true
}

export async function startRecording(): Promise<AudioRecorder> {
  const ok = await requestMicPerms()
  if (!ok) throw new Error("Microphone permission denied")
  const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY)
  await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY)
  recorder.record()
  return recorder
}

export async function stopRecording(recorder: AudioRecorder): Promise<string> {
  let uri: string | null = null
  try {
    await recorder.stop()
    const status = recorder.getStatus()
    uri = status.url ?? recorder.uri ?? null
    if (uri && !uri.startsWith("file://")) {
      uri = `file://${uri}`
    }
    if (!uri) throw new Error("No recording URI")
    return uri
  } finally {
    await setAudioModeAsync(playbackMode).catch(() => undefined)
    const maybeRemove = (recorder as unknown as { remove?: () => void }).remove
    if (typeof maybeRemove === "function") {
      try {
        maybeRemove.call(recorder)
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
