import axios, { AxiosError } from "axios"
import { Platform } from "react-native"
import type { Level, Message } from "../types"

const baseURL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000"

const client = axios.create({
  baseURL,
  timeout: 60_000
})

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

export async function sttUpload(fileUri: string): Promise<string> {
  try {
    const form = new FormData()
    const file = {
      uri: fileUri,
      name: "audio.m4a",
      type: "audio/m4a"
    } as unknown as Blob
    form.append("file", file)
    const { data } = await client.post<{ text: string }>("/stt", form, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    if (!data?.text) throw new Error("Empty STT response")
    return data.text
  } catch (err) {
    throw new Error(errorMessage(err))
  }
}

export async function chatReply(
  level: Level,
  history: Message[],
  user: string
): Promise<string> {
  try {
    const { data } = await client.post<{ reply: string }>("/chat", {
      level,
      history,
      user
    })
    if (!data?.reply) throw new Error("Empty chat response")
    return data.reply
  } catch (err) {
    throw new Error(errorMessage(err))
  }
}

