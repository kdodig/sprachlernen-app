import React, { type ReactElement } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import ConversationScreen from "./screens/ConversationScreen"
import SettingsScreen from "./screens/SettingsScreen"
import { Pressable, Text } from "react-native"

export type RootStackParamList = {
  Conversation: undefined
  Settings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#fff" }
}

export default function AppNavigator(): ReactElement {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="Conversation"
          component={ConversationScreen}
          options={({ navigation }) => ({
            title: "Sprachtrainer",
            headerRight: () => (
              <Pressable onPress={() => navigation.navigate("Settings")}>
                <Text style={{ color: "#2563eb", fontWeight: "600" }}>Settings</Text>
              </Pressable>
            )
          })}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
