import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, SweepGradient, Group, vec } from "@shopify/react-native-skia";
import { useSharedValue, withTiming, useDerivedValue } from "react-native-reanimated";
import { stateBus } from '../../../src/core/StateBus';
import { useAppTheme } from '../../../engine/colors';

interface LivingLightEntityProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  isRemembering?: boolean;
  onLongPress?: () => void;
}

export default function LivingLightEntity({
  isThinking = false,
  isSpeaking = false,
  isListening = false,
  isRemembering = false,
  onLongPress,
}: LivingLightEntityProps) {
  const { colors } = useAppTheme();
  
  const energy = useSharedValue(0.5);
  const intensity = useSharedValue(0.3);
  const emotionColor = useSharedValue(colors.accent);
  const memoryEchoRadius = useSharedValue(0);
  const memoryEchoOpacity = useSharedValue(0);
  const intentHaloIntensity = useSharedValue(0);
  const driftOffset = useSharedValue(0);
  const soulCorePulse = useSharedValue(1.0);

  // Derived values للحسابات التي تتطلب number
  const coreRadius = useDerivedValue(() => 20 * soulCorePulse.value, [soulCorePulse]);
  const coreX = useDerivedValue(() => 110 + driftOffset.value * 15, [driftOffset]);
  const coreY = useDerivedValue(() => 110 - driftOffset.value * 10, [driftOffset]);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_: string, data: any) => {
      if (!data) return;

      emotionColor.value = withTiming(data.halo_color || colors.accent, { duration: 300 });
      energy.value = withTiming(data.energy || 0.5, { duration: 300 });
      intensity.value = withTiming(data.intensity || 0.3, { duration: 300 });
      driftOffset.value = withTiming(data.consciousnessDrift || 0, { duration: 200 });
      soulCorePulse.value = withTiming(0.7 + (data.intensity || 0.5) * 0.3, { duration: 300 });

      if (data.memoryEchoIntensity > 0.01) {
        memoryEchoRadius.value = withTiming(60 * data.memoryEchoIntensity, { duration: 300 });
        memoryEchoOpacity.value = withTiming(data.memoryEchoIntensity * 0.3, { duration: 300 });
      } else {
        memoryEchoRadius.value = withTiming(0, { duration: 800 });
        memoryEchoOpacity.value = withTiming(0, { duration: 800 });
      }

      intentHaloIntensity.value = data.intentField ? withTiming(data.intentField.intensity, { duration: 400 }) : withTiming(0, { duration: 600 });
    });

    return () => unsubscribe();
  }, [colors]);

  const SIZE = 220;
  const CENTER = SIZE / 2;

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group>
          {/* 1. Attention Field */}
          <Circle cx={CENTER} cy={CENTER} r={90} opacity={0.08}>
            <Paint><BlurMask blur={40} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={90} colors={['#A855F7', 'transparent']} />
          </Circle>

          {/* 2. Volumetric Aura */}
          <Circle cx={CENTER} cy={CENTER} r={70} opacity={intensity}>
            <Paint><BlurMask blur={30} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={70} colors={['#A855F7', 'transparent']} />
          </Circle>

          {/* 3. Organic Waves */}
          <Circle cx={CENTER} cy={CENTER} r={55} opacity={0.2}>
            <Paint><BlurMask blur={15} style="inner" /></Paint>
            <SweepGradient c={vec(CENTER, CENTER)} colors={['#A855F7', '#C084FC', '#A855F7']} />
          </Circle>

          {/* 4. Memory Echo Layer */}
          <Circle cx={CENTER} cy={CENTER} r={memoryEchoRadius} opacity={memoryEchoOpacity}>
            <Paint style="stroke" strokeWidth={2} /><BlurMask blur={10} style="normal" />
            <RadialGradient c={vec(CENTER, CENTER)} r={60} colors={['#FFFFFF30', 'transparent']} />
          </Circle>

          {/* 5. Fluid Membrane */}
          <Circle cx={CENTER} cy={CENTER} r={45} opacity={0.25}>
            <Paint style="stroke" strokeWidth={1.5} /><BlurMask blur={8} style="solid" />
            <SweepGradient c={vec(CENTER, CENTER)} colors={['#A855F7', '#FFFFFF20', '#A855F7']} />
          </Circle>

          {/* 6. Energy Streams */}
          <Circle cx={CENTER} cy={CENTER} r={35} opacity={energy}>
            <Paint><BlurMask blur={6} style="inner" /></Paint>
            <SweepGradient c={vec(CENTER, CENTER)} colors={['#FFFFFF40', '#A855F7', '#FFFFFF40']} />
          </Circle>

          {/* 7. Soul Core + Consciousness Drift */}
          <Circle cx={coreX} cy={coreY} r={coreRadius} color="#A855F7">
            <Paint><BlurMask blur={5} style="solid" /></Paint>
          </Circle>

          {/* 8. Intent Field */}
          <Circle cx={CENTER} cy={CENTER} r={80} opacity={intentHaloIntensity}>
            <Paint style="stroke" strokeWidth={2} /><BlurMask blur={20} style="normal" />
            <RadialGradient c={vec(CENTER, CENTER)} r={80} colors={['#A855F7', 'transparent']} />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
});
