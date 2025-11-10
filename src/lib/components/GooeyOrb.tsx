import React, { useEffect, useMemo, useRef } from "react"
import { Animated, Easing, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"

type Props = {
  size?: number
  colorA?: string
  colorB?: string
  speed?: number
}

const MIN_DURATION = 3800

export default function GooeyOrb({
  size = 220,
  colorA = "#FF7CC7",
  colorB = "#9DDCFF",
  speed = 1
}: Props) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    rotation.setValue(0)
    const duration = Math.max(MIN_DURATION, MIN_DURATION * (1 / Math.max(speed, 0.2)))
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true
      })
    )
    animation.start()
    return () => animation.stop()
  }, [rotation, speed])

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  })
  const pulse = rotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.94, 1.03, 0.94]
  })

  const borderRadius = useMemo(() => size / 2, [size])

  return (
    <Animated.View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius,
          transform: [{ scale: pulse }]
        }
      ]}
    >
      <Animated.View style={[styles.layer, { borderRadius, transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={[colorA, colorB]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.gradient, { borderRadius }]}
        />
      </Animated.View>
      <Animated.View style={[styles.layer, styles.blob, { borderRadius, transform: [{ rotate: spin }] }]} />
      <LinearGradient
        colors={["rgba(255,255,255,0.65)", "rgba(255,255,255,0)"]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 0.6 }}
        style={[styles.highlight, { borderRadius }]}
      />
      <Animated.View style={[styles.layer, styles.noise, { borderRadius, opacity: rotation }]} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    shadowColor: "rgba(255, 124, 199, 0.45)",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 18
  },
  layer: {
    ...StyleSheet.absoluteFillObject
  },
  gradient: {
    ...StyleSheet.absoluteFillObject
  },
  blob: {
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ scale: 0.9 }]
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7
  },
  noise: {
    backgroundColor: "rgba(255,255,255,0.04)"
  }
})

