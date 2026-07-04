import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuBridgeProvider, useMenuBridge } from '../lib/MenuBridge';

function AppContent() {
  const { menuVisible, closeMenu } = useMenuBridge();
  const { width: SCREEN_W } = useWindowDimensions();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (SCREEN_W > 0) setReady(true);
  }, [SCREEN_W]);

  const safeW = SCREEN_W > 0 ? SCREEN_W : 400;

  const mainX = useRef(new Animated.Value(0)).current;
  const mainS = useRef(new Animated.Value(1)).current;
  const mainB = useRef(new Animated.Value(0)).current;
  const menuX = useRef(new Animated.Value(-safeW)).current;
  const menuO = useRef(new Animated.Value(0)).current;

  const [SideMenuComp, setSideMenuComp] = useState<any>(null);
  const [menuMounted, setMenuMounted] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        const mod = require('../components/SideMenu');
        if (mod?.default) setSideMenuComp(() => mod.default);
      } catch (e) {}
    }, 400);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (!menuVisible) {
      menuX.setValue(-safeW);
      mainX.setValue(0);
    }
  }, [safeW]);

  useEffect(() => {
    if (!ready) return;
    if (menuVisible) setMenuMounted(true);

    const mainTarget  = menuVisible ? -safeW * 0.72 : 0;
    const menuTarget  = menuVisible ? 0 : -safeW;
    const scaleTarget = menuVisible ? 0.88 : 1;
    const opacTarget  = menuVisible ? 1 : 0;

    Animated.parallel([
      Animated.spring(mainX, { toValue: mainTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(mainS, { toValue: scaleTarget, damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.spring(menuX, { toValue: menuTarget,  damping: 22, stiffness: 160, useNativeDriver: true }),
      Animated.timing(menuO, { toValue: opacTarget,  duration: 200,               useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && !menuVisible) setMenuMounted(false);
    });

    Animated.spring(mainB, {
      toValue: menuVisible ? 20 : 0,
      damping: 22, stiffness: 160, useNativeDriver: false,
    }).start();
  }, [menuVisible, safeW, ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      {menuMounted && (
        <Animated.View style={[st.menu, {
          width: safeW, left: 0, opacity: menuO,
          transform: [{ translateX: menuX }],
          backgroundColor: '#1A1A1A',
        }]} pointerEvents={menuVisible ? 'auto' : 'none'}>
          {SideMenuComp ? <SideMenuComp onClose={closeMenu} /> : (
            <View style={st.loading}><ActivityIndicator color="#7C3AED" size="large" /></View>
          )}
        </Animated.View>
      )}

      <Animated.View style={[st.main, {
        transform: [{ translateX: mainX }, { scale: mainS }],
        borderRadius: mainB, overflow: 'hidden',
      }]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="login" />
          <Stack.Screen name="twin-mind" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </Animated.View>

      {menuVisible && (
        <Pressable style={[st.overlay, { left: safeW * 0.72 }]} onPress={closeMenu} />
      )}
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <MenuBridgeProvider>
      <AppContent />
    </MenuBridgeProvider>
  );
}

const st = StyleSheet.create({
  main:    { flex: 1, backgroundColor: '#000' },
  menu:    { position: 'absolute', top: 0, bottom: 0, zIndex: 50, elevation: 10 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, bottom: 0, zIndex: 200, elevation: 25 },
});
