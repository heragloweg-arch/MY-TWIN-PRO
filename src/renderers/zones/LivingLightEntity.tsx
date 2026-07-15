import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Circle, Paint, BlurMask, RadialGradient, SweepGradient, Group, Turbulence, ColorMatrix } from "@shopify/react-native-skia";
import { useSharedValue, withTiming, withRepeat, withSequence, Easing, useDerivedValue } from "react-native-reanimated";
import { emotionEngine } from '../../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';
import { audioEngine } from '../../core/AudioEngine';

// طيف المشاعر المتكامل
const EMOTION_SPECTRUM = {
  joy: { primary: '#FFD700', secondary: '#FFA500', speed: 1200, intensity: 1.0 },
  sadness: { primary: '#4169E1', secondary: '#191970', speed: 3500, intensity: 0.6 },
  calm: { primary: '#6A5ACD', secondary: '#483D8B', speed: 2500, intensity: 0.8 },
  anger: { primary: '#FF4500', secondary: '#DC143C', speed: 800, intensity: 1.2 },
  focused: { primary: '#00CED1', secondary: '#008B8B', speed: 1800, intensity: 1.0 },
  love: { primary: '#FF69B4', secondary: '#C71585', speed: 1500, intensity: 1.1 },
  curious: { primary: '#FFD700', secondary: '#FFA500', speed: 1500, intensity: 0.9 },
  inspired: { primary: '#00FA9A', secondary: '#00CED1', speed: 1400, intensity: 1.1 },
  concerned: { primary: '#FF8C00', secondary: '#FF4500', speed: 2000, intensity: 0.9 },
  happy: { primary: '#FFD700', secondary: '#FFA500', speed: 1100, intensity: 1.2 },
  fear: { primary: '#800080', secondary: '#4B0082', speed: 2500, intensity: 0.7 },
  neutral: { primary: '#A78BFA', secondary: '#8A2BE2', speed: 2000, intensity: 0.7 },
};

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
  const currentEmotion = emotionEngine.getCurrentEmotion();
  const intensity = emotionEngine.getIntensity();
  const bondLevel = relationshipEngine.getBondLevel();
  const spectrum = EMOTION_SPECTRUM[currentEmotion] || EMOTION_SPECTRUM.neutral;

  // القيم الديناميكية للرسوميات
  const breathe = useSharedValue(0.5);
  const energyFlow = useSharedValue(0);
  const membraneDistortion = useSharedValue(0);
  const innerSpark = useSharedValue(0.3);
  const turbulenceFreq = useSharedValue(0.01);
  const auraOpacity = useSharedValue(0.15);

  useEffect(() => {
    // التنفس الأساسي
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: spectrum.speed, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: spectrum.speed, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );

    // تيارات الطاقة الداخلية
    energyFlow.value = withRepeat(
      withTiming(1, { duration: spectrum.speed * 0.7, easing: Easing.linear }),
      -1, false
    );

    // تشوه الغشاء حسب الحالة
    if (isSpeaking) {
      membraneDistortion.value = withRepeat(
        withSequence(
          withTiming(0.2 + intensity * 0.1, { duration: 100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 100, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
    } else if (isThinking || isRemembering) {
      membraneDistortion.value = withRepeat(
        withTiming(0.3, { duration: spectrum.speed * 1.5, easing: Easing.inOut(Easing.sin) }),
        -1, true
      );
    } else {
      membraneDistortion.value = withTiming(0, { duration: 500 });
    }

    // شرارة الوعي
    innerSpark.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: spectrum.speed * 0.3 }),
        withTiming(0.2, { duration: spectrum.speed * 0.7 })
      ),
      -1, true
    );

    // تردد التشويش العضوي
    turbulenceFreq.value = withRepeat(
      withSequence(
        withTiming(0.03, { duration: spectrum.speed * 2 }),
        withTiming(0.005, { duration: spectrum.speed * 2 })
      ),
      -1, true
    );

    // شدة الهالة
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2 * intensity, { duration: spectrum.speed }),
        withTiming(0.1 * intensity, { duration: spectrum.speed })
      ),
      -1, true
    );
  }, [spectrum, intensity, isSpeaking, isThinking, isRemembering]);

  const SIZE = 220;
  const CENTER = SIZE / 2;
  const BASE_RADIUS = 45;
  const BOND_MULTIPLIER = 1 + bondLevel / 100;

  const currentRadius = useDerivedValue(() => BASE_RADIUS + breathe.value * 25 * BOND_MULTIPLIER, [breathe]);
  const distort = useDerivedValue(() => membraneDistortion.value * 15, [membraneDistortion]);
  const sparkOpacity = useDerivedValue(() => innerSpark.value, [innerSpark]);
  const auraGlow = useDerivedValue(() => auraOpacity.value, [auraOpacity]);

  const outerWaveRadius = useDerivedValue(() => currentRadius.value + 20 + distort.value * 0.5, [currentRadius, distort]);
  const membraneRadius = useDerivedValue(() => currentRadius.value + 5 + distort.value, [currentRadius, distort]);
  const energyStreamRadius = useDerivedValue(() => currentRadius.value * 0.7 + distort.value * 8, [currentRadius, distort]);
  const coreRadius = useDerivedValue(() => currentRadius.value * 0.35, [currentRadius]);
  const sparkX = useDerivedValue(() => CENTER + 3 * Math.sin(Date.now() / 500 + energyFlow.value), [energyFlow]);
  const sparkY = useDerivedValue(() => CENTER + 3 * Math.cos(Date.now() / 500 + energyFlow.value), [energyFlow]);

  return (
    <View style={styles.container} onTouchEnd={onLongPress ? () => onLongPress() : undefined}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Group>
          {/* ═══ الطبقة 1: Volumetric Aura (الهالة الحجمية) ═══ */}
          <Circle cx={CENTER} cy={CENTER} r={BASE_RADIUS + 70} opacity={auraGlow}>
            <Paint>
              <BlurMask blur={50} style="normal" />
            </Paint>
            <RadialGradient
              c={vec(CENTER, CENTER)}
              r={BASE_RADIUS + 70}
              colors={[spectrum.primary + '40', `${spectrum.primary}00`]}
            />
          </Circle>

          {/* ═══ الطبقة 2: Organic Waves (التموجات العضوية) ═══ */}
          <Circle cx={CENTER} cy={CENTER} r={outerWaveRadius} opacity={0.2 * intensity}>
            <Paint>
              <BlurMask blur={25} style="normal" />
            </Paint>
            <RadialGradient
              c={vec(CENTER, CENTER)}
              r={outerWaveRadius}
              colors={[spectrum.secondary + '60', `${spectrum.primary}00`]}
            />
          </Circle>

          {/* ═══ الطبقة 3: Fluid Membrane (الغشاء السائل) ═══ */}
          <Circle cx={CENTER} cy={CENTER} r={membraneRadius} color={`${spectrum.primary}50`}>
            <Paint style="stroke" strokeWidth={2} />
            <BlurMask blur={5} style="inner" />
          </Circle>

          {/* ═══ الطبقة 4: Energy Streams (تيارات الطاقة الداخلية) ═══ */}
          <Circle cx={CENTER} cy={CENTER} r={energyStreamRadius} opacity={0.7}>
            <Paint>
              <BlurMask blur={12} style="inner" />
            </Paint>
            <SweepGradient
              c={vec(CENTER, CENTER)}
              colors={[spectrum.primary, spectrum.secondary, spectrum.primary, `${spectrum.primary}80`]}
            />
          </Circle>

          {/* ═══ الطبقة 5: Soul Core (النواة المركزية) ═══ */}
          <Circle cx={CENTER} cy={CENTER} r={coreRadius} color={spectrum.primary} opacity={0.6 + breathe.value * 0.3}>
            <Paint>
              <BlurMask blur={8} style="solid" />
            </Paint>
          </Circle>

          {/* ═══ الطبقة 6: Consciousness Spark (شرارة الوعي) ═══ */}
          <Circle cx={sparkX} cy={sparkY} r={2.5 + innerSpark.value * 2} color="#FFFFFF" opacity={sparkOpacity} />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
