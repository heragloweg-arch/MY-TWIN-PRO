import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { stateBus } from '../../../src/core/StateBus';

export default function SilencePresence() {
  const [isSilent, setIsSilent] = useState(false);
  const driftX = useSharedValue(0);
  const driftY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const unsub = stateBus.on('SILENCE_START', () => {
      setIsSilent(true);
      opacity.value = withTiming(0.6, { duration: 500 });
      driftX.value = withRepeat(withTiming(15, { duration: 3000, easing: Easing.inOut(Easing.sin) }), -1, true);
      driftY.value = withRepeat(withTiming(10, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    });

    const unsub2 = stateBus.on('SILENCE_END', () => {
      setIsSilent(false);
      opacity.value = withTiming(0, { duration: 300 });
      driftX.value = withTiming(0, { duration: 300 });
      driftY.value = withTiming(0, { duration: 300 });
    });

    return () => { unsub(); unsub2(); };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: driftX.value },
      { translateY: driftY.value },
    ],
  }));

  if (!isSilent) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.dot} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
    opacity: 0.5,
  },
});
