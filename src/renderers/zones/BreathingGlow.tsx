import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { RADIUS } from '../../../src/design/tokens/spacing';

export default function BreathingGlow({ breathPhase, intensity }: { breathPhase: number; intensity: number }) {
  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathPhase, [0, 0.5, 1], [0.9, 1.05, 0.9]);
    const opacity = interpolate(breathPhase, [0, 0.5, 1], [0.3, intensity, 0.3]);
    return { transform: [{ scale }], opacity };
  });

  return <Animated.View style={[styles.glow, glowStyle]} />;
}

const styles = StyleSheet.create({
  glow: {
    width: 240, height: 240, borderRadius: RADIUS.avatar,
    backgroundColor: '#6B5B8A', position: 'absolute', alignSelf: 'center',
  },
});
