import React from "react";
import {View, Text, Pressable, StyleSheet} from "react-native";
import type { LanguageCode } from "@/src/types";

export default function Onboarding() {

  const languageCodes: LanguageCode[] =  ["de","en","es","fr","it","pt","ja","ko","zh"];
  const labels: Record<LanguageCode, string> = {
    de: "Deutsch", en: "English", es: "Español", fr: "Français",
    it: "Italiano", pt: "Português", ja: "日本語", ko: "한국어", zh: "中文",
  };

    return (
        <View style ={styles.container}>
            <Text style={styles.title}>Pick a language to learn</Text>
          <View style ={styles.list}>
            {languageCodes.map((code) => (
              <Pressable key={code} style={styles.btn}>
                <Text style={styles.btnText}>
                  {labels[code]}
                </Text>}
              </Pressable>
            ))}
          </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "flex-start", padding: 20 },
  title: { marginTop: 24, fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  list: { width: "100%", maxWidth: 420, alignItems: "center", gap: 10 },
  btn: { width: "80%", maxWidth: 340, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff", alignItems:
      "center" },
  btnText: { color: "#111827", fontSize: 16 },
});
