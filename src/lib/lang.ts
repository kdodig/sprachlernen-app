import type { LanguageCode } from "@/src/types"

const ttsByCode: Record<LanguageCode, string> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  it: "it-IT",
  pt: "pt-PT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN"
}

export const toTtsLocale = (code: LanguageCode | null, fallback = "en-US") =>
  code ? (ttsByCode[code] ?? fallback) : fallback
