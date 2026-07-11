import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withDelay, Easing } from 'react-native-reanimated';
import { withSequence, withTiming } from 'react-native-reanimated';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';

const { width, height } = Dimensions.get('window');

interface ParticleData {
  id: number;
  x: number;
  y: number;
  opacity: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}

export default function ConnectionField({ visible = true }: { visible?: boolean }) {
  const [particles] = useState<ParticleData[]>(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: width / 2 + (Math.random() - 0.5) * width * 0.6,
      y: height * 0.3 + Math.random() * height * 0.2,
      opacity: useSharedValue(0),
      scale: useSharedValue(0.5),
    }))
  );

  useEffect(() => {
    if (!visible) return;

    const bondLevel = relationshipEngine.getBondLevel();
    const maxParticles = Math.floor(bondLevel / 20);

    particles.forEach((p, i) => {
      if (i >= maxParticles) return;

      p.opacity.value = withDelay(
        i * 500,
        withRepeat(
          withSequence(
            withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        ),
      );

      p.scale.value = withDelay(
        i * 500,
        withRepeat(
          withSequence(
            withTiming(1.2, { duration: 2500 }),
            withTiming(0.8, { duration: 2500 }),
          ),
          -1,
          true,
        ),
      );
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x,
              top: p.y,
              opacity: p.opacity,
              transform: [{ scale: p.scale }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A855F7',
  },
});
