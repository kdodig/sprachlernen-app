import type { Language, LanguageCode } from "@/src/types"

const ttsByCode: Record<LanguageCode, Language> = {
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

export const toTtsLocale = (code: LanguageCode | null, fallback: Language = "en-US") =>
  code ? (ttsByCode[code] ?? fallback) : fallback
