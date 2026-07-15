import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { bootstrapCoordinator, BootstrapPhase } from '../src/core/BootstrapCoordinator';
import LivingLightEntity from '../src/renderers/zones/LivingLightEntity';
import BreathingGlow from '../src/renderers/zones/BreathingGlow';
import AmbientField from '../src/world/AmbientField';

export default function Index() {
  const [phase, setPhase] = useState<BootstrapPhase>('void');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bootSteps, setBootSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startBootstrap = async () => {
      // 1. ظهور AmbientField
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // 2. بدء عملية الإقلاع
      const result = await bootstrapCoordinator.bootstrap();
      setPhase(result.phase);
      setWelcomeMessage(result.welcomeMessage);
      setBootSteps(result.bootSteps);

      // 3. عرض رسالة الترحيب
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // 4. عرض خطوات الإقلاع بالتدريج
      for (let i = 0; i < result.bootSteps.length; i++) {
        await delay(800);
        setCurrentStep(i + 1);
        Animated.timing(stepOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }

      // 5. الانتقال النهائي
      await delay(1000);
      if (result.isReturning) {
        router.replace('/living-world');
      } else {
        router.replace('/genesis');
      }
    };

    startBootstrap();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ambientContainer, { opacity }]}>
        <AmbientField />
      </Animated.View>
      
      <View style={styles.pulseContainer}>
        <LivingLightEntity />
      </View>

      <View style={styles.breathContainer}>
        <BreathingGlow
          color={phase === 'found' ? '#A78BFA' : '#7C3AED'}
          speed={phase === 'searching' ? 1.4 : 0.8}
        />
      </View>

      <Animated.View style={[styles.messageContainer, { opacity: messageOpacity }]}>
        <Text style={styles.message}>{welcomeMessage}</Text>
        {bootSteps.slice(0, currentStep).map((step, index) => (
          <Animated.Text key={index} style={[styles.stepText, { opacity: stepOpacity }]}>
            {step}
          </Animated.Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
  },
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  pulseContainer: {
    position: 'absolute',
    top: '35%',
  },
  breathContainer: {
    position: 'absolute',
    top: '45%',
  },
  messageContainer: {
    position: 'absolute',
    bottom: '25%',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    color: '#E8E0F0',
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepText: {
    color: '#A78BFA',
    fontSize: 14,
    marginTop: 8,
  },
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
