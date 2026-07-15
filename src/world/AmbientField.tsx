import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, vec, Group } from "@shopify/react-native-skia";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { presenceEngine } from '../../../engine/presence/PresenceEngine';
import { stateBus } from '../core/StateBus';

export default function AmbientField() {
  const initialState = presenceEngine.getLiveState();
  const energyLevel = useSharedValue(initialState.energyLevel);
  const haloIntensity = useSharedValue(initialState.haloIntensity);
  const warmth = useSharedValue(initialState.warmth);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (event: string, data: any) => {
      if (data?.energyLevel !== undefined) {
        energyLevel.value = withTiming(data.energyLevel, { duration: 3000 });
      }
      if (data?.haloIntensity !== undefined) {
        haloIntensity.value = withTiming(data.haloIntensity, { duration: 3000 });
      }
      if (data?.warmth !== undefined) {
        warmth.value = withTiming(data.warmth, { duration: 3000 });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Circle cx={150} cy={200} r={150} opacity={energyLevel}>
            <Paint>
              <BlurMask blur={80} style="normal" />
            </Paint>
            <RadialGradient
              c={vec(150, 200)}
              r={150}
              colors={['#A78BFA20', '#0A001400']}
            />
          </Circle>
          
          <Circle cx={150} cy={100} r={100} opacity={warmth}>
            <Paint>
              <BlurMask blur={60} style="normal" />
            </Paint>
            <RadialGradient
              c={vec(150, 100)}
              r={100}
              colors={['#8A2BE210', '#0A001400']}
            />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}
