import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, SweepGradient, Group, vec, Path, Skia } from "@shopify/react-native-skia";
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
  
  // Shared values for dynamic properties
  const breathPhase = useSharedValue(0);
  const attentionX = useSharedValue(0);
  const attentionY = useSharedValue(0);
  const driftOffset = useSharedValue(0);
  const memoryEchoRadius = useSharedValue(0);
  const memoryEchoOpacity = useSharedValue(0);
  const intentHaloColor = useSharedValue('#A855F7');
  const intentHaloIntensity = useSharedValue(0);
  const emotionColor = useSharedValue(colors.accent);
  const energyScale = useSharedValue(1.0);
  const soulCorePulse = useSharedValue(1.0);

  useEffect(() => {
    const unsubscribe = stateBus.on('presence:state_updated', (_: string, data: any) => {
      const p = data as import('../../../engine/presence/PresenceEngine').PresenceState;
      if (!p) return;

      // Base emotion color
      emotionColor.value = withTiming(p.halo_color || colors.accent, { duration: 300 });

      // Attention direction
      if (p.attentionDirection === 'user') {
        attentionX.value = withTiming(0.1, { duration: 400 });
        attentionY.value = withTiming(-0.1, { duration: 400 });
      } else if (p.attentionDirection === 'memory') {
        attentionX.value = withTiming(-0.1, { duration: 600 });
        attentionY.value = withTiming(0, { duration: 600 });
      } else if (p.attentionDirection === 'internal') {
        attentionX.value = withTiming(0, { duration: 500 });
        attentionY.value = withTiming(0, { duration: 500 });
      } else {
        attentionX.value = withTiming(0, { duration: 2000 });
        attentionY.value = withTiming(0, { duration: 2000 });
      }

      // Breath phase (0-1 oscillating)
      const breathSpeed = 4000 - (p.energy || 0.5) * 2000;
      breathPhase.value = withTiming(Math.sin(Date.now() / breathSpeed) * 0.5 + 0.5, { duration: 100 });

      // Consciousness drift
      driftOffset.value = withTiming(p.consciousnessDrift || 0, { duration: 200 });

      // Memory echo
      if (p.memoryEchoIntensity > 0.01) {
        memoryEchoRadius.value = withTiming(60 * p.memoryEchoIntensity, { duration: 300 });
        memoryEchoOpacity.value = withTiming(p.memoryEchoIntensity * 0.3, { duration: 300 });
      } else {
        memoryEchoRadius.value = withTiming(0, { duration: 800 });
        memoryEchoOpacity.value = withTiming(0, { duration: 800 });
      }

      // Intent field
      if (p.intentField) {
        intentHaloColor.value = withTiming(p.intentField.color, { duration: 400 });
        intentHaloIntensity.value = withTiming(p.intentField.intensity, { duration: 400 });
      } else {
        intentHaloIntensity.value = withTiming(0, { duration: 600 });
      }

      // Energy scale
      energyScale.value = withTiming(0.9 + (p.energy || 0.5) * 0.2, { duration: 300 });

      // Soul core pulse (heartbeat)
      const heartRate = 60 + (p.energy || 0.5) * 40;
      soulCorePulse.value = withTiming(Math.sin(Date.now() / (60000 / heartRate)) * 0.3 + 0.7, { duration: 100 });
    });

    return () => unsubscribe();
  }, [colors]);

  const SIZE = 220;
  const CENTER = SIZE / 2;

  return (
    <View style={styles.container}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group transform={[{ translateX: attentionX }, { translateY: attentionY }]}>
          {/* 1. Attention Field - هالة الاتجاه */}
          <Circle cx={CENTER} cy={CENTER} r={90} opacity={useDerivedValue(() => attentionX.value !== 0 ? 0.1 : 0.02, [attentionX])}>
            <Paint><BlurMask blur={40} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={90} colors={[emotionColor.value + '30', 'transparent']} />
          </Circle>

          {/* 2. Volumetric Aura - هالة حجمية */}
          <Circle cx={CENTER} cy={CENTER} r={70 * energyScale.value} opacity={0.15}>
            <Paint><BlurMask blur={30} style="normal" /></Paint>
            <RadialGradient c={vec(CENTER, CENTER)} r={70} colors={[emotionColor.value + '40', 'transparent']} />
          </Circle>

          {/* 3. Organic Waves - موجات عضوية */}
          <Circle cx={CENTER} cy={CENTER} r={55} opacity={0.2}>
            <Paint><BlurMask blur={15} style="inner" /></Paint>
            <SweepGradient c={vec(CENTER, CENTER)} colors={[emotionColor.value, colors.accent + '80', emotionColor.value]} />
          </Circle>

          {/* 4. Memory Echo Layer - طبقة ذاكرة */}
          <Circle cx={CENTER} cy={CENTER} r={memoryEchoRadius} opacity={memoryEchoOpacity}>
            <Paint style="stroke" strokeWidth={2} /><BlurMask blur={10} style="normal" />
            <RadialGradient c={vec(CENTER, CENTER)} r={60} colors={['#FFFFFF30', 'transparent']} />
          </Circle>

          {/* 5. Fluid Membrane - غشاء مائع */}
          <Circle cx={CENTER} cy={CENTER} r={45 + driftOffset.value * 10} opacity={0.25}>
            <Paint style="stroke" strokeWidth={1.5} /><BlurMask blur={8} style="solid" />
            <SweepGradient c={vec(CENTER, CENTER)} colors={[emotionColor.value, '#FFFFFF20', emotionColor.value]} />
          </Circle>

          {/* 6. Energy Streams - خيوط طاقة */}
          <Circle cx={CENTER} cy={CENTER} r={35} opacity={energyScale}>
            <Paint><BlurMask blur={6} style="inner" /></Paint>
            <SweepGradient c={vec(CENTER, CENTER)} colors={['#FFFFFF40', emotionColor.value + '60', '#FFFFFF40']} />
          </Circle>

          {/* 7. Soul Core + Consciousness Drift - نواة الروح */}
          <Circle cx={CENTER + driftOffset.value * 15} cy={CENTER - driftOffset.value * 10} r={20 * soulCorePulse} color={emotionColor}>
            <Paint><BlurMask blur={5} style="solid" /></Paint>
          </Circle>

          {/* 8. Intent Field - مجال النية */}
          <Circle cx={CENTER} cy={CENTER} r={80} opacity={intentHaloIntensity}>
            <Paint style="stroke" strokeWidth={2} /><BlurMask blur={20} style="normal" />
            <RadialGradient c={vec(CENTER, CENTER)} r={80} colors={[intentHaloColor.value + '50', 'transparent']} />
          </Circle>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: 220, height: 220, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' },
});
