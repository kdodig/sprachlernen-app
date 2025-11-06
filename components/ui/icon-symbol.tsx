// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { SymbolWeight, SymbolViewProps } from "expo-symbols"
import { ComponentProps } from "react"
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native"

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>
export type IconSymbolName = keyof typeof MAPPING

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chart.bar.fill": "leaderboard",
  "person.crop.circle.fill": "person",
  "gearshape.fill": "settings",
  "square.and.arrow.up": "share",
  "sparkles": "auto-awesome",
  "scope": "center-focus-strong",
  "flame.fill": "whatshot",
  "trophy.fill": "emoji-events",
  "questionmark.circle.fill": "help-outline",
  "exclamationmark.bubble.fill": "feedback",
  "ladybug.fill": "bug-report",
  "envelope.fill": "mail",
  "person.2.fill": "group",
  "person.badge.plus.fill": "person-add-alt",
  "person.crop.circle.badge.checkmark": "check-circle",
  "person.crop.circle.badge.clock": "schedule",
  "chart.line.uptrend.xyaxis": "show-chart"
} as IconMapping

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style
}: {
  name: IconSymbolName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
  weight?: SymbolWeight
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />
}
