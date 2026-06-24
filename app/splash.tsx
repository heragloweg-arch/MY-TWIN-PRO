import React, { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { Audio } from 'expo-av';

const SPLASH_BG = require('../assets/splash.png');
const LOGO = require('../assets/logo.png');
const RING_OUTER = require('../assets/ring_outer.png');
const RING_INNER = require('../assets/ring_inner.png');
const PARTICLE = require('../assets/particle_glow.png');
const { width, height } = Dimensions.get('window');

const StarField = () => {
  const stars = Array.from({ length: 30 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 1.5 + Math.random() * 4,
    opacity: useRef(new Animated.Value(0.2 + Math.random() * 0.5)).current,
    duration: 1500 + Math.random() * 3500,
  }));

  useEffect(() => {
    stars.forEach(star => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, { toValue: 0.9, duration: star.duration, useNativeDriver: true }),
          Animated.timing(star.opacity, { toValue: 0.2, duration: star.duration, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <>
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute', left: star.x, top: star.y,
            width: star.size, height: star.size, borderRadius: star.size / 2,
            backgroundColor: i % 3 === 0 ? '#FBBF24' : i % 3 === 1 ? '#A855F7' : '#FFFFFF',
            opacity: star.opacity,
            shadowColor: i % 3 === 0 ? '#FBBF24' : '#A855F7',
            shadowRadius: 6, shadowOpacity: 0.8,
          }}
        />
      ))}
    </>
  );
};

const CosmicRing = ({ source, size, duration, initialScale = 0.8, maxScale = 1.1 }: any) => {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: maxScale, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: initialScale, duration, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: duration * 0.8, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: duration * 0.8, useNativeDriver: true }),
        ]),
        Animated.timing(rotation, { toValue: 360, duration: duration * 3, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Image
      source={source}
      style={{
        position: 'absolute', width: size, height: size,
        opacity, transform: [{ scale }, { rotate: rotation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
      }}
    />
  );
};

export default function Splash() {
  const logoScale = useRef(new Animated.Value(0.1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(50)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(30)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const byOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تشغيل الصوت
    try {
      Audio.Sound.createAsync(require('../assets/chime_start.mp3')).then(({ sound }) => {
        sound.playAsync();
      });
    } catch {}

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.spring(lineWidth, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(byOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      try {
        const store = useTwinStore.getState();
        router.replace(store.userId ? '/twin-mind' : '/login');
      } catch {
        router.replace('/login');
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image source={SPLASH_BG} style={styles.bgImage} resizeMode="cover" />
      <StarField />
      <CosmicRing source={RING_OUTER} size={280} duration={3000} initialScale={0.7} maxScale={1.15} />
      <CosmicRing source={RING_INNER} size={220} duration={2500} initialScale={0.65} maxScale={1.1} />
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.appName, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>My Twin</Animated.Text>
        <Animated.View style={[styles.goldLine, { transform: [{ scaleX: lineWidth }] }]} />
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>Your Twin AI .. Always There</Animated.Text>
      </View>
      <Animated.View style={[styles.footer, { opacity: byOpacity }]}>
        <Text style={styles.by}>By SOULSYNC</Text>
        <Text style={styles.copy}>© 2026 Soul Sync Ltd.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0014', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bgImage: { position: 'absolute', width, height },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  logoWrapper: { marginBottom: 30, shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 25 },
  logo: { width: 160, height: 160, borderRadius: 34 },
  appName: { fontSize: 48, fontWeight: '800', letterSpacing: 1.2, color: '#FFFFFF', textShadowColor: 'rgba(168, 85, 247, 0.6)', textShadowRadius: 28, marginBottom: 16 },
  goldLine: { width: 70, height: 3, backgroundColor: '#FBBF24', borderRadius: 2, marginBottom: 18 },
  tagline: { fontSize: 16, fontWeight: '400', letterSpacing: 1.8, textAlign: 'center', paddingHorizontal: 45, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 50 },
  footer: { position: 'absolute', bottom: 70, alignItems: 'center', zIndex: 10 },
  by: { fontSize: 16, fontWeight: '700', letterSpacing: 5, color: '#FBBF24', textTransform: 'uppercase', marginBottom: 12 },
  copy: { fontSize: 12, fontWeight: '400', color: 'rgba(255, 255, 255, 0.65)' },
});
