import React from "react";
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

type Props = {
  width?: number | string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: "light" | "dark" | "default";
  children?: React.ReactNode;
};

const GlassCard: React.FC<Props> = ({
  width,
  height,
  children,
  style,
  intensity = 30,
  tint = "light"
}) => {
  const sizeStyle = [
    width != null ? { width } : null,
    height != null ? { height } : null
  ];
  const baseStyle = [styles.card, ...sizeStyle, style];

  if (Platform.OS === "ios" || Platform.OS === "android") {
    return (
      <BlurView intensity={intensity} tint={tint} style={baseStyle}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={baseStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.5)", // halbtransparent
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    // sanfte schatten wie im beispiel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6, // android shadow
    overflow: "hidden",
  },
});

export default GlassCard;
