import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';

interface LivingAvatarProps {
  breathPhase: number;
  eyesOpen: boolean;
  expression: string;
  presenceLevel: number;
  emotionalValence: string;
  bondLevel: number;
}

const EMOTION_COLORS: Record<string, string> = {
  positive: '#C8A0D0',
  negative: '#8090B0',
  neutral: '#A090C0',
};

export default function LivingAvatar({
  breathPhase,
  eyesOpen,
  expression,
  presenceLevel,
  emotionalValence,
  bondLevel,
}: LivingAvatarProps) {
  const coreScale = 0.88 + breathPhase * 0.12;
  const coreOpacity = 0.35 + breathPhase * 0.35 + presenceLevel * 0.03;
  const haloScale = 0.7 + breathPhase * 0.45;
  const haloOpacity = 0.15 + breathPhase * 0.2 + presenceLevel * 0.04;
  const outerScale = 0.8 + breathPhase * 0.28;
  const outerOpacity = 0.08 + breathPhase * 0.1;
  const eyeScale = bondLevel < 2 ? 0.5 + bondLevel * 0.25 : 1.0;
  const haloColor = EMOTION_COLORS[emotionalValence] || EMOTION_COLORS.neutral;
  const eyeHeight = expression === 'joyful' ? 10 : expression === 'concerned' ? 6 : 8;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.outerRing, { borderColor: haloColor, opacity: outerOpacity, transform: [{ scale: outerScale }] }]} />
      <Animated.View style={[styles.halo, { backgroundColor: haloColor, opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
      <Animated.View style={[styles.core, { opacity: coreOpacity, transform: [{ scale: coreScale }] }]}>
        {eyesOpen && (
          <View style={styles.eyesContainer}>
            <View style={[styles.eye, { height: eyeHeight, opacity: eyeScale, width: 10 + bondLevel }]} />
            <View style={[styles.eye, { height: eyeHeight, opacity: eyeScale, width: 10 + bondLevel }]} />
          </View>
        )}
        {!eyesOpen && (
          <View style={styles.eyesContainer}>
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
          </View>
        )}
      </Animated.View>
      {bondLevel >= 3 && (
        <View style={styles.particles}>
          <View style={[styles.particle, { top: -20, left: 10 }]} />
          <View style={[styles.particle, { top: -10, right: 15 }]} />
          <View style={[styles.particle, { bottom: -15, left: -5 }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  outerRing: { width: 180, height: 180, borderRadius: RADIUS.avatar, borderWidth: 1, position: 'absolute' },
  halo: { width: 120, height: 120, borderRadius: RADIUS.avatar, position: 'absolute' },
  core: { width: 60, height: 60, borderRadius: RADIUS.avatar, backgroundColor: '#F0E8FF', justifyContent: 'center', alignItems: 'center', position: 'absolute' },
  eyesContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  eye: { width: 10, borderRadius: 2, backgroundColor: '#1A1030', marginHorizontal: SPACE.sm },
  eyeClosed: { width: 12, height: 2, borderRadius: 1, backgroundColor: '#1A1030', marginHorizontal: SPACE.sm },
  particles: { ...StyleSheet.absoluteFillObject },
  particle: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D0C0E8', position: 'absolute', opacity: 0.6 },
});
