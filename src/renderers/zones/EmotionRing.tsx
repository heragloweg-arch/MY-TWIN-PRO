import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTwinState } from '../../../engine/core/TwinState';
import { useLivingTheme } from '../../../engine/living-theme';

export const EmotionRing = ({ size = 60 }: { size?: number }) => {
  const theme = useLivingTheme();
  const emotion = useTwinState(s => s.emotion);
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const speed = theme.motion.pulseDuration;
    Animated.parallel([
      Animated.loop(Animated.timing(rotate, { toValue: 1, duration: speed, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: speed / 2, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.85, duration: speed / 2, useNativeDriver: true }),
      ])),
    ]).start();
  }, [theme.motion.pulseDuration]);

  const color = theme.living.emotion;
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        width: size - 8, height: size - 8, borderRadius: (size - 8) / 2,
        borderWidth: 2.5, borderColor: color + '60', borderStyle: 'dashed',
        transform: [{ rotate: spin }], position: 'absolute',
      }} />
      <Animated.View style={{
        width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25,
        backgroundColor: color + '20', transform: [{ scale }],
      }} />
      <View style={{
        width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125,
        backgroundColor: color, position: 'absolute',
      }} />
    </View>
  );
};
