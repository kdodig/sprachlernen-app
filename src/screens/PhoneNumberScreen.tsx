import React, { useMemo, useState, useCallback } from "react"
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput
} from "react-native"
import { useRouter } from "expo-router"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { useSessionStore } from "../store/session"

const COUNTRY_OPTIONS = [
  { code: "+49", country: "Deutschland" },
  { code: "+43", country: "Oesterreich" },
  { code: "+41", country: "Schweiz" },
  { code: "+34", country: "Spanien" },
  { code: "+39", country: "Italien" },
  { code: "+33", country: "Frankreich" },
  { code: "+44", country: "Vereinigtes Koenigreich" },
  { code: "+1", country: "USA" }
]

export default function PhoneNumberScreen(): React.ReactElement {
  const router = useRouter()
  const { profile, updateProfile } = useSessionStore()
  const initialMatch = useMemo(() => {
    if (!profile.phone) return null
    const match = profile.phone.match(/^(\+\d+)\s*(.*)$/)
    if (!match) return null
    return { code: match[1], number: match[2] ?? "" }
  }, [profile.phone])
  const initialCode =
    COUNTRY_OPTIONS.find((option) => option.code === initialMatch?.code) ?? COUNTRY_OPTIONS[0]
  const [selectedCode, setSelectedCode] = useState(initialCode)
  const [phoneNumber, setPhoneNumber] = useState(
    (initialMatch?.number ?? "").replace(/[^\d]/g, "")
  )
  const [showCodes, setShowCodes] = useState(false)

  const isValid = phoneNumber.length >= 6

  const handleToggleCodes = useCallback(() => {
    setShowCodes((prev) => !prev)
  }, [])

  const handleSelectCode = useCallback((code: string) => {
    const next = COUNTRY_OPTIONS.find((option) => option.code === code)
    if (next) setSelectedCode(next)
    setShowCodes(false)
  }, [])

  const handleNumberChange = useCallback((value: string) => {
    setPhoneNumber(value.replace(/[^\d]/g, ""))
  }, [])

  const handleContinue = useCallback(() => {
    if (!isValid) return
    const nextValue = phoneNumber.length > 0 ? `${selectedCode.code} ${phoneNumber}` : ""
    updateProfile({ phone: nextValue })
    router.back()
  }, [isValid, phoneNumber, selectedCode, updateProfile, router])

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Telefonnummer</Text>
        <Text style={styles.subtitle}>
          Wir verwenden deine Nummer fuer Sicherheitsmeldungen und Login-Bestaetigungen.
        </Text>

        <View style={styles.card}>
          <Text style={styles.groupLabel}>Laendervorwahl</Text>
          <Pressable
            onPress={handleToggleCodes}
            style={({ pressed }) => [
              styles.codeSelector,
              pressed ? styles.codeSelectorPressed : undefined
            ]}
          >
            <View>
              <Text style={styles.codeLabel}>{selectedCode.code}</Text>
              <Text style={styles.codeCountry}>{selectedCode.country}</Text>
            </View>
            <IconSymbol
              name="chevron.right"
              size={18}
              color="#2A2A23"
              style={showCodes ? styles.chevronOpen : styles.chevronClosed}
            />
          </Pressable>

          {showCodes ? (
            <View style={styles.codeList}>
              <ScrollView>
                {COUNTRY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.code}
                    onPress={() => handleSelectCode(option.code)}
                    style={({ pressed }) => [
                      styles.codeOption,
                      option.code === selectedCode.code ? styles.codeOptionActive : undefined,
                      pressed ? styles.codeOptionPressed : undefined
                    ]}
                  >
                    <Text
                      style={[
                        styles.codeOptionLabel,
                        option.code === selectedCode.code ? styles.codeOptionLabelActive : undefined
                      ]}
                    >
                      {option.code} - {option.country}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={[styles.groupLabel, styles.numberLabel]}>Telefonnummer</Text>
          <View style={styles.numberRow}>
            <View style={styles.numberPrefix}>
              <Text style={styles.numberPrefixText}>{selectedCode.code}</Text>
            </View>
            <TextInput
              value={phoneNumber}
              onChangeText={handleNumberChange}
              placeholder="15123456789"
              keyboardType="phone-pad"
              style={styles.numberInput}
            />
          </View>
          <Text style={styles.note}>
            Du erhaeltst eine SMS zur Verifizierung. Es koennen Gebuehren durch deinen Anbieter
            entstehen.
          </Text>
        </View>

        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            !isValid ? styles.primaryButtonDisabled : undefined,
            pressed && isValid ? styles.primaryButtonPressed : undefined
          ]}
          disabled={!isValid}
        >
          <Text style={styles.primaryButtonText}>Weiter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff"
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 32
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2A2A23"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B6B61"
  },
  card: {
    marginTop: 28,
    backgroundColor: "#F9F8F8",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2A23",
    marginBottom: 12
  },
  codeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E1DA"
  },
  codeSelectorPressed: {
    opacity: 0.85
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2A2A23"
  },
  codeCountry: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B6B61"
  },
  chevronClosed: {
    transform: [{ rotate: "90deg" }]
  },
  chevronOpen: {
    transform: [{ rotate: "-90deg" }]
  },
  codeList: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E1DA",
    backgroundColor: "#FFFFFF",
    maxHeight: 220
  },
  codeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  codeOptionPressed: {
    backgroundColor: "#F3E7DF"
  },
  codeOptionActive: {
    backgroundColor: "#E16632"
  },
  codeOptionLabel: {
    fontSize: 14,
    color: "#2A2A23"
  },
  codeOptionLabelActive: {
    color: "#F9F8F8",
    fontWeight: "700"
  },
  numberLabel: {
    marginTop: 24
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E1DA",
    borderRadius: 18,
    backgroundColor: "#FFFFFF"
  },
  numberPrefix: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: "#E5E1DA"
  },
  numberPrefixText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2A23"
  },
  numberInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2A2A23"
  },
  note: {
    marginTop: 18,
    fontSize: 12,
    color: "#8F8F87"
  },
  primaryButton: {
    marginTop: 32,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E16632",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5
  },
  primaryButtonPressed: {
    opacity: 0.9
  },
  primaryButtonDisabled: {
    backgroundColor: "#E5C7B4",
    shadowOpacity: 0
  },
  primaryButtonText: {
    color: "#F9F8F8",
    fontSize: 16,
    fontWeight: "700"
  }
})
