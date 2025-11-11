import React, { type ReactElement } from "react"
import { SafeAreaView, View, Text, StyleSheet } from "react-native"

export default function DictionaryScreen(): ReactElement {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          {"hier penis sp\u00E4ter deine gelernten w\u00F6rter"}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5FA"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    textAlign: "center",
    color: "#2A2035"
  }
})
