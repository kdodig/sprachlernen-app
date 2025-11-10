import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

type Props = {
  /** optional: zeige den radialen glow hinter einem zentralen orb */
  showGlow?: boolean;
  /** position des glows (0–1 relativ) */
  glowX?: number;
  glowY?: number;
  /** größe des glows in px */
  glowSize?: number;
  children?: React.ReactNode;
};

export default function Background({
                                     showGlow = true,
                                     glowX = 0.5,
                                     glowY = 0.28,
                                     glowSize = 520,
                                     children
                                   }: Props) {
  return (
    <View style={styles.container}>
      {/* linearer, weicher verlauf top (peach) → mid (lavender) → bottom (light blue) */}
      <LinearGradient
        colors={["#FCE7DD", "#E6D4F7", "#D7EBFF"]}
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 1.0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* subtiler “glass” overlay für mehr softness */}
      <LinearGradient
        colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.10)"]}
        start={{ x: 0.2, y: 0.0 }}
        end={{ x: 0.8, y: 1.0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* radialer glow hinter dem orb */}
      {showGlow && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                {/* kern: soft purple */}
                <Stop offset="0%" stopColor="#B28AF7" stopOpacity={0.55} />
                {/* rand: tieferes violet */}
                <Stop offset="65%" stopColor="#A05DE7" stopOpacity={0.25} />
                {/* auslaufen lassen */}
                <Stop offset="100%" stopColor="#A05DE7" stopOpacity={0} />
              </RadialGradient>
            </Defs>

            {/* positioniere den glow als rechteck mit radialGradient fill */}
            <Rect
              x={glowX * -glowSize + " "}
              y={glowY * -glowSize + " "}
              width={glowSize}
              height={glowSize}
              fill="url(#bgGlow)"
              rx={glowSize / 2}
              ry={glowSize / 2}
            />
          </Svg>
        </View>
      )}

      {/* inhalt */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1 }
});
