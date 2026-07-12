import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat,
  Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';

interface LivingAvatarProps {
  breathPhase: number;
  eyesOpen: boolean;
  expression: string;
  presenceLevel: number;
  emotionalValence: string;
  bondLevel: number;
  thinkingPhase?: string;
  isThinking?: boolean;
  isRemembering?: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  positive: '#C8A0D0', negative: '#8090B0', neutral: '#A090C0',
};

export default function LivingAvatar({
  breathPhase, eyesOpen, expression, presenceLevel,
  emotionalValence, bondLevel, thinkingPhase, isThinking, isRemembering,
}: LivingAvatarProps) {
  const eyeScale = bondLevel < 2 ? 0.5 + bondLevel * 0.25 : 1.0;
  const haloColor = EMOTION_COLORS[emotionalValence] || EMOTION_COLORS.neutral;

  const headTilt = useSharedValue(0);
  const blinkProgress = useSharedValue(0);

  useEffect(() => {
    if (isThinking) {
      headTilt.value = withTiming(-3, { duration: 400, easing: Easing.out(Easing.ease) });
    } else {
      headTilt.value = withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) });
    }

    const blinkSequence = () => {
      blinkProgress.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
      const nextBlink = 3000 + Math.random() * 5000;
      setTimeout(blinkSequence, nextBlink);
    };
    const initialDelay = 2000 + Math.random() * 3000;
    const timer = setTimeout(blinkSequence, initialDelay);
    return () => clearTimeout(timer);
  }, [isThinking]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${headTilt.value}deg` }],
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(blinkProgress.value, [0, 0.5, 1], [1, 0.1, 1]) }],
  }));

  const eyeGazeStyle = useAnimatedStyle(() => {
    let translateX = 0;
    let translateY = 0;

    if (isRemembering) { translateX = -4; translateY = -1; }
    else if (thinkingPhase === 'reason' || thinkingPhase === 'understand') { translateX = 0; translateY = 3; }
    else if (expression === 'warm') { translateX = 0; translateY = -1; }
    else { translateX = 0; translateY = 0; }

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <Animated.View style={[styles.container, avatarStyle]}>
      <Animated.View style={[styles.outerRing, { borderColor: haloColor, opacity: 0.08 + breathPhase * 0.1, transform: [{ scale: 0.8 + breathPhase * 0.28 }] }]} />
      <Animated.View style={[styles.halo, { backgroundColor: haloColor, opacity: 0.15 + breathPhase * 0.2 + presenceLevel * 0.04, transform: [{ scale: 0.7 + breathPhase * 0.45 }] }]} />
      <Animated.View style={[styles.core, { opacity: 0.35 + breathPhase * 0.35 + presenceLevel * 0.03, transform: [{ scale: 0.88 + breathPhase * 0.12 }] }]}>
        {eyesOpen && (
          <Animated.View style={[styles.eyesContainer, blinkStyle]}>
            <Animated.View style={[styles.eye, { height: expression === 'joyful' ? 10 : expression === 'concerned' ? 6 : 8, opacity: eyeScale, width: 10 + bondLevel }, eyeGazeStyle]} />
            <Animated.View style={[styles.eye, { height: expression === 'joyful' ? 10 : expression === 'concerned' ? 6 : 8, opacity: eyeScale, width: 10 + bondLevel }, eyeGazeStyle]} />
          </Animated.View>
        )}
        {!eyesOpen && (
          <Animated.View style={[styles.eyesContainer, blinkStyle]}>
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
          </Animated.View>
        )}
      </Animated.View>
      {bondLevel >= 3 && (
        <View style={styles.particles}>
          <View style={[styles.particle, { top: -20, left: 10 }]} />
          <View style={[styles.particle, { top: -10, right: 15 }]} />
          <View style={[styles.particle, { bottom: -15, left: -5 }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' },
  outerRing: { width: 180, height: 180, borderRadius: 90, borderWidth: 1, position: 'absolute' },
  halo: { width: 120, height: 120, borderRadius: 60, position: 'absolute' },
  core: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0E8FF', justifyContent: 'center', alignItems: 'center', position: 'absolute' },
  eyesContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  eye: { width: 10, borderRadius: 2, backgroundColor: '#1A1030', marginHorizontal: 8 },
  eyeClosed: { width: 12, height: 2, borderRadius: 1, backgroundColor: '#1A1030', marginHorizontal: 8 },
  particles: { ...StyleSheet.absoluteFillObject },
  particle: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D0C0E8', position: 'absolute', opacity: 0.6 },
});
