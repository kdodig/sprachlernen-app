import axios, { AxiosError } from "axios"
import Constants from "expo-constants"
import { NativeModules, Platform } from "react-native"
import type { LanguageCode, Level, Message } from "../types"

export type ApiDebugInfo = {
  traceId?: string
  engine?: string
  meta?: Record<string, unknown>
  headers?: Record<string, string>
}

export type SttResponse = {
  text: string
  debug?: ApiDebugInfo
}

export type ChatResponse = {
  reply: string
  audio: string | null
  audioMimeType: string | null
  debug?: ApiDebugInfo
}

const resolveBaseURL = (): string => {
  const scriptURL =
    typeof NativeModules?.SourceCode?.scriptURL === "string"
      ? NativeModules.SourceCode.scriptURL
      : ""
  const match = scriptURL.match(/^https?:\/\/([^/:]+)/)
  const devHostFromBundle = match?.[1]
  if (devHostFromBundle && devHostFromBundle !== "localhost" && devHostFromBundle !== "127.0.0.1") {
    return `http://${devHostFromBundle}:3000`
  }

  const expoHost = Constants?.expoConfig?.hostUri
  if (expoHost) {
    const host = expoHost.split(":")[0]
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:3000`
    }
  }

  return Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000"
}

export const baseURL = resolveBaseURL()

const client = axios.create({
  baseURL,
  timeout: 60_000
})

const getHeader = (headers: unknown, key: string): string | undefined => {
  if (!headers || typeof headers !== "object") return undefined
  const lowerKey = key.toLowerCase()
  const record = headers as Record<string, unknown>
  const candidate = record[lowerKey] ?? record[key]
  if (candidate == null) return undefined
  if (typeof candidate === "string") return candidate
  if (Array.isArray(candidate)) {
    const first = candidate.find((item) => typeof item === "string")
    return typeof first === "string" ? first : undefined
  }
  try {
    return String(candidate)
  } catch {
    return undefined
  }
}

const pickHeaders = (headers: unknown, keys: string[]): Record<string, string> => {
  const result: Record<string, string> = {}
  if (!headers || typeof headers !== "object") return result
  keys.forEach((key) => {
    const value = getHeader(headers, key)
    if (typeof value === "string" && value.length > 0) {
      result[key] = value
    }
  })
  return result
}

const buildDebugInfo = (
  headers: unknown,
  payloadDebug: unknown,
  engineHeader: string,
  extraHeaderKeys: string[]
): ApiDebugInfo | undefined => {
  const meta =
    typeof payloadDebug === "object" && payloadDebug !== null
      ? (payloadDebug as Record<string, unknown>)
      : undefined
  const headerEntries = pickHeaders(headers, ["x-debug-id", engineHeader, ...extraHeaderKeys])
  const metaTrace =
    meta && typeof meta["traceId"] === "string" ? (meta["traceId"] as string) : undefined
  const traceId = getHeader(headers, "x-debug-id") ?? metaTrace
  const engine = getHeader(headers, engineHeader)
  if (
    !traceId &&
    !engine &&
    (!meta || Object.keys(meta).length === 0) &&
    Object.keys(headerEntries).length === 0
  ) {
    return undefined
  }
  const debugInfo: ApiDebugInfo = {}
  if (traceId) debugInfo.traceId = traceId
  if (engine) debugInfo.engine = engine
  if (meta && Object.keys(meta).length > 0) {
    debugInfo.meta = meta
  }
  if (Object.keys(headerEntries).length > 0) {
    debugInfo.headers = headerEntries
  }
  return debugInfo
}

const errorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ message?: string }>
    if (e.code === "ECONNABORTED") return "Request timed out"
    if (e.response?.data?.message) return e.response.data.message
    if (e.response) return `HTTP ${e.response.status}`
    return "Network error"
  }
  return "Unknown error"
}

export async function sttUpload(fileUri: string): Promise<SttResponse> {
  try {
    const form = new FormData()
    const file = {
      uri: fileUri,
      name: "audio.m4a",
      type: "audio/m4a"
    } as unknown as Blob
    form.append("file", file)
    const response = await client.post<{ text: string; debug?: Record<string, unknown> }>(
      "/stt",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    )
    const rawText = response.data?.text ?? ""
    const text = rawText.trim()
    if (!text) throw new Error("Empty STT response")
    if (text.startsWith("[mock]")) {
      throw new Error("STT ist im Mock-Modus (kein OPENAI_API_KEY auf dem Server)")
    }
    const debug = buildDebugInfo(response.headers, response.data.debug, "x-stt-engine", [
      "x-debug-stt-duration",
      "x-debug-stt-bytes"
    ])
    return {
      text,
      debug
    }
  } catch (err) {
    throw new Error(errorMessage(err))
  }
}

export async function chatReply(
  level: Level,
  history: Message[],
  user: string,
  targetLang: LanguageCode | null
): Promise<ChatResponse> {
  try {
    const response = await client.post<Partial<ChatResponse> & { debug?: Record<string, unknown> }>(
      "/chat",
      {
        level,
        history,
        user,
        targetLang
      }
    )
    const { data } = response
    if (!data?.reply) throw new Error("Empty chat response")
    const ttsHeaders = ["x-tts-trace", "x-mock-tts", "x-debug-tts-bytes"]
    const debug = buildDebugInfo(response.headers, data.debug, "x-chat-engine", ttsHeaders)
    if (debug?.meta) {
      const current = debug.meta["ttsTraceId"]
      if (typeof current !== "string") {
        const ttsTrace = getHeader(response.headers, "x-tts-trace")
        if (ttsTrace) {
          debug.meta["ttsTraceId"] = ttsTrace
        }
      }
    }
    return {
      reply: data.reply,
      audio: data.audio ?? null,
      audioMimeType: data.audioMimeType ?? null,
      debug
    }
  } catch (err) {
    throw new Error(errorMessage(err))
  }
}
