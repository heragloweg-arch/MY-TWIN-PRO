import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface LivingAvatarProps {
  breathPhase: number;
  eyesOpen: boolean;
  expression: string;        // 'neutral' | 'warm' | 'focused' | 'surprised' | 'concerned' | 'joyful'
  presenceLevel: number;     // 0-9
  emotionalValence: string;  // 'positive' | 'negative' | 'neutral'
  bondLevel: number;         // 0-5 (relationship depth)
}

export default function LivingAvatar({
  breathPhase,
  eyesOpen,
  expression,
  presenceLevel,
  emotionalValence,
  bondLevel,
}: LivingAvatarProps) {
  // ═══════════════════════════════════════
  // CORE: النواة المركزية
  // ═══════════════════════════════════════
  const coreStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathPhase, [0, 0.5, 1], [0.88, 1.0, 0.88], Extrapolation.CLAMP);
    const brightness = 0.35 + breathPhase * 0.35 + presenceLevel * 0.03;
    return {
      transform: [{ scale }],
      opacity: brightness,
    };
  });

  // ═══════════════════════════════════════
  // HALO: الهالة المحيطة
  // ═══════════════════════════════════════
  const haloStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathPhase, [0, 0.5, 1], [0.7, 1.15, 0.7], Extrapolation.CLAMP);
    const opacity = 0.15 + breathPhase * 0.2 + presenceLevel * 0.04;
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // ═══════════════════════════════════════
  // OUTER RING: الحلقة الخارجية
  // ═══════════════════════════════════════
  const outerRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathPhase, [0, 0.5, 1], [0.8, 1.08, 0.8], Extrapolation.CLAMP);
    const opacity = 0.08 + breathPhase * 0.1;
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // ═══════════════════════════════════════
  // EYES: العينان
  // ═══════════════════════════════════════
  const eyeScale = bondLevel < 2 ? 0.5 + bondLevel * 0.25 : 1.0;

  // ═══════════════════════════════════════
  // EMOTIONAL COLOR: لون المشاعر
  // ═══════════════════════════════════════
  const emotionColors: Record<string, string> = {
    positive: '#C8A0D0', // دافئ مائل للأرجواني
    negative: '#8090B0', // أزرق هادئ
    neutral: '#A090C0',  // بنفسجي محايد
  };
  const haloColor = emotionColors[emotionalValence] || emotionColors.neutral;

  // ═══════════════════════════════════════
  // EXPRESSION: تعبير العينين
  // ═══════════════════════════════════════
  const eyeHeight = expression === 'joyful' ? 10 : expression === 'concerned' ? 6 : 8;
  const eyeCurve = expression === 'warm' ? 4 : expression === 'surprised' ? 0 : 2;

  return (
    <View style={styles.container}>
      {/* الحلقة الخارجية */}
      <Animated.View
        style={[
          styles.outerRing,
          { borderColor: haloColor },
          outerRingStyle,
        ]}
      />

      {/* الهالة */}
      <Animated.View
        style={[
          styles.halo,
          { backgroundColor: haloColor },
          haloStyle,
        ]}
      />

      {/* النواة */}
      <Animated.View style={[styles.core, coreStyle]}>
        {/* العينان */}
        {eyesOpen && (
          <View style={styles.eyesContainer}>
            <View
              style={[
                styles.eye,
                {
                  height: eyeHeight,
                  borderRadius: eyeCurve,
                  opacity: eyeScale,
                  width: 10 + bondLevel,
                },
              ]}
            />
            <View
              style={[
                styles.eye,
                {
                  height: eyeHeight,
                  borderRadius: eyeCurve,
                  opacity: eyeScale,
                  width: 10 + bondLevel,
                },
              ]}
            />
          </View>
        )}

        {/* وميض العينين عند الإغلاق */}
        {!eyesOpen && (
          <View style={styles.eyesContainer}>
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
            <View style={[styles.eyeClosed, { opacity: eyeScale }]} />
          </View>
        )}
      </Animated.View>

      {/* نقاط ضوئية صغيرة حول النواة (للحظات العميقة) */}
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
  container: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    position: 'absolute',
  },
  halo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'absolute',
  },
  core: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eye: {
    width: 10,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#1A1030',
    marginHorizontal: 8,
  },
  eyeClosed: {
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#1A1030',
    marginHorizontal: 8,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0C0E8',
    position: 'absolute',
    opacity: 0.6,
  },
});
