import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

interface BreathingGlowProps {
  color?: string;
  speed?: number;
}

export default function BreathingGlow({ color = '#A855F7', speed = 1.0 }: BreathingGlowProps) {
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 2000 / speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.1, { duration: 2000 / speed, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          backgroundColor: color,
          width: 120,
          height: 120,
          borderRadius: 60,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
});
