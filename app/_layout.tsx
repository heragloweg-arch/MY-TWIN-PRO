import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';

// نؤخر استيراد useTwinStore لحين الحاجة
let useTwinStore: any = null;
try { useTwinStore = require('../store/useTwinStore').useTwinStore; } catch {}

function safeStore() {
  try { return useTwinStore?.getState?.() ?? {}; } catch { return {}; }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('ar');

  // قراءة القيم الابتدائية من الـ store بأمان
  useEffect(() => {
    const s = safeStore();
    if (s.theme) setTheme(s.theme);
    if (s.lang) setLang(s.lang);
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  // الاشتراك في تغييرات القائمة
  useEffect(() => {
    if (!useTwinStore) return;
    const unsub = useTwinStore.subscribe((state: any) => {
      setMenuVisible(state.menuVisible ?? false);
      if (state.theme) setTheme(state.theme);
      if (state.lang) setLang(state.lang);
    });
    return () => unsub?.();
  }, [ready]);

  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const { width: SCREEN_W } = useWindowDimensions();
  const safeW = SCREEN_W > 0 ? SCREEN_W : 400;

  const mainX = useRef(new Animated.Value(0)).current;
  const mainS = useRef(new Animated.Value(1)).current;
  const mainB = useRef(new Animated.Value(0)).current;
  const menuX = useRef(new Animated.Value(isRTL ? safeW : -safeW)).current;
  const menuO = useRef(new Animated.Value(0)).current;

  const [SideMenuComp, setSideMenuComp] = useState<any>(null);
  const [menuMounted, setMenuMounted] = useState(false);

  // تحميل SideMenu بعد الجاهزية
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        const mod = require('../components/SideMenu');
        if (mod?.default) setSideMenuComp(() => mod.default);
      } catch (e) { console.warn('[Layout] SideMenu load failed:', e); }
    }, 400);
    return () => clearTimeout(t);
  }, [ready]);

  // إعادة ضبط القيم عند تغيير اللغة
  useEffect(() => {
    if (!menuVisible) {
      menuX.setValue(isRTL ? safeW : -safeW);
      mainX.setValue(0);
    }
  }, [isRTL, safeW]);

  // أنيميشن القائمة
  useEffect(() => {
    if (!ready) return;
    if (menuVisible) setMenuMounted(true);

    const mainTarget  = menuVisible ? (isRTL ? -safeW * 0.72 : safeW * 0.72) : 0;
    const menuTarget  = menuVisible ? 0 : (isRTL ? safeW : -safeW);
    const scaleTarget = menuVisible ? 0.88 : 1;
    const opacTarget  = menuVisible ? 1 : 0;

    Animated.parallel([
      Animated.spring(mainX, { toValue: mainTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(mainS, { toValue: scaleTarget, damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(menuX, { toValue: menuTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.timing(menuO, { toValue: opacTarget, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && !menuVisible) setMenuMounted(false);
    });

    Animated.spring(mainB, {
      toValue: menuVisible ? 20 : 0,
      damping: 22, stiffness: 160, useNativeDriver: false,
    }).start();
  }, [menuVisible, isRTL, safeW, ready]);

  const handleCloseMenu = useCallback(() => {
    try { useTwinStore?.getState?.()?.closeMenu?.(); } catch {}
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {menuMounted && (
          <Animated.View style={[st.menu, {
            width: safeW,
            right: isRTL ? 0 : undefined,
            left: isRTL ? undefined : 0,
            opacity: menuO,
            transform: [{ translateX: menuX }],
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          }]} pointerEvents={menuVisible ? 'auto' : 'none'}>
            {SideMenuComp ? <SideMenuComp onClose={handleCloseMenu} /> : (
              <View style={st.loading}><ActivityIndicator color="#7C3AED" size="large" /></View>
            )}
          </Animated.View>
        )}

        <Animated.View style={[st.main, {
          transform: [{ translateX: mainX }, { scale: mainS }],
          borderRadius: mainB,
          overflow: 'hidden',
        }]}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Screen name="twin-mind" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="features/study-mode" />
          </Stack>
        </Animated.View>

        {menuVisible && (
          <Pressable style={[st.overlay, isRTL ? { right: safeW * 0.72, left: 0 } : { left: safeW * 0.72, right: 0 }]} onPress={handleCloseMenu} />
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  main:    { flex: 1, backgroundColor: '#000' },
  menu:    { position: 'absolute', top: 0, bottom: 0, zIndex: 50, elevation: 10 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, bottom: 0, zIndex: 200, elevation: 25 },
});
