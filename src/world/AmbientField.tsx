import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, vec } from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { stateBus } from '../core/StateBus';
import { useAppTheme } from '../../engine/colors';

export default function AmbientField() {
  const { colors } = useAppTheme();
  const energy = useSharedValue(0.5);
  const intensity = useSharedValue(0.3);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;
      energy.value = withTiming(data.energy || 0.5, { duration: 800 });
      intensity.value = withTiming(data.intensity || 0.3, { duration: 800 });
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ flex: 1 }}>
        <Circle cx={150} cy={300} r={200} opacity={energy}>
          <Paint><BlurMask blur={60} style="normal" /></Paint>
          <RadialGradient c={vec(150, 300)} r={200} colors={[colors.accent + '20', 'transparent']} />
        </Circle>
        <Circle cx={250} cy={200} r={150} opacity={intensity}>
          <Paint><BlurMask blur={40} style="normal" /></Paint>
          <RadialGradient c={vec(250, 200)} r={150} colors={[colors.primary + '15', 'transparent']} />
        </Circle>
      </Canvas>
    </View>
  );
}
