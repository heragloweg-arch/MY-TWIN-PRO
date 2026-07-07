import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';
import { useTwinState } from '../../engine/core/TwinState';
import { useLivingTheme } from '../../engine/living-theme';
import { Sparkles } from 'lucide-react-native';

export const LivingAvatar = ({ imageUrl, size = 120 }: { imageUrl?: string; size?: number }) => {
  const theme = useLivingTheme();
  const mode = useTwinState(s => s.consciousnessMode);
  const emotion = useTwinState(s => s.emotion);
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const speed = theme.motion.pulseDuration;
    Animated.parallel([
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 0.7, duration: speed, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: speed, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.timing(rotate, { toValue: 1, duration: speed * 4, easing: Easing.linear, useNativeDriver: true })),
    ]).start();
  }, [theme.motion.pulseDuration]);

  const color = theme.living.emotion;
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[st.container, { width: size + 20, height: size + 20 }]}>
      <Animated.View style={[st.orbit, { borderColor: color + '40', width: size + 20, height: size + 20, borderRadius: (size + 20) / 2, transform: [{ rotate: spin }] }]}>
        <View style={[st.orbitDot, { backgroundColor: color }]} />
      </Animated.View>
      <Animated.View style={[st.glow, { backgroundColor: color, opacity: glow, width: size + 30, height: size + 30, borderRadius: (size + 30) / 2 }]} />
      <Animated.View style={[st.avatarWrap, { width: size, height: size, borderRadius: size / 2, borderColor: color, transform: [{ scale: pulse }] }]}>
        {imageUrl
          ? <Image source={{ uri: imageUrl }} style={{ width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 }} />
          : <Sparkles size={size * 0.4} stroke={color} />
        }
      </Animated.View>
    </View>
  );
};

const st = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  orbit: { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed' },
  orbitDot: { position: 'absolute', top: -4, left: '50%', width: 8, height: 8, borderRadius: 4, marginLeft: -4 },
  glow: { position: 'absolute' },
  avatarWrap: { borderWidth: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
});
