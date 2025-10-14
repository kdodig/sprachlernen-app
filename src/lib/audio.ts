import { Audio } from "expo-av"

export async function requestMicPerms(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync()
  if (status !== "granted") return false
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    staysActiveInBackground: false
  })
  return true
}

export async function startRecording(): Promise<Audio.Recording> {
  const ok = await requestMicPerms()
  if (!ok) throw new Error("Microphone permission denied")
  const rec = new Audio.Recording()
  await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
  await rec.startAsync()
  return rec
}

export async function stopRecording(rec: Audio.Recording): Promise<string> {
  await rec.stopAndUnloadAsync()
  const uri = rec.getURI()
  if (!uri) throw new Error("No recording URI")
  return uri
}

