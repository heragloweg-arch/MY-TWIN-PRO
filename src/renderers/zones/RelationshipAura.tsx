import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { stateBus, STATE_EVENTS } from '../../../engine/core/StateBus';
import { useTwinState } from '../../../engine/core/TwinState';

interface RelationshipAuraProps {
  size?: number;
}

export default function RelationshipAura({ size = 200 }: RelationshipAuraProps) {
  const [bondLevel, setBondLevel] = useState(0);
  const [phase, setPhase] = useState<string>('stranger');

  const opacity = useSharedValue(0.1);
  const ringScale = useSharedValue(0.8);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    const updateRelationship = () => {
      const bond = relationshipEngine.getBondLevel();
      const currentPhase = relationshipEngine.getPhase();
      setBondLevel(bond);
      setPhase(currentPhase);
    };

    updateRelationship();
    const unsub = stateBus.on(STATE_EVENTS.BOND_CHANGED, updateRelationship);
    const interval = setInterval(updateRelationship, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const auraOpacity = 0.08 + (bondLevel / 100) * 0.25;
    const auraScale = 0.75 + (bondLevel / 100) * 0.4;

    opacity.value = withTiming(auraOpacity, { duration: 2000 });
    ringScale.value = withTiming(auraScale, { duration: 2000, easing: Easing.inOut(Easing.ease) });
    colorProgress.value = withTiming(bondLevel / 100, { duration: 2000 });
  }, [bondLevel]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const getAuraColor = () => {
    if (phase === 'soulmate') return '#EC4899';
    if (phase === 'close_friend') return '#A855F7';
    if (phase === 'friend') return '#8B5CF6';
    if (phase === 'acquaintance') return '#6366F1';
    return '#4B5563';
  };

  const auraColor = getAuraColor();

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: auraColor,
          },
          animatedStyle,
        ]}
      />
      {phase === 'soulmate' && (
        <Animated.View
          style={[
            styles.outerRing,
            {
              width: size * 1.3,
              height: size * 1.3,
              borderRadius: (size * 1.3) / 2,
              borderColor: auraColor + '40',
            },
            animatedStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
