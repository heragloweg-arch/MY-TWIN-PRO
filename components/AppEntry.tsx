import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Animated, View, Pressable,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuBridgeProvider, useMenuBridge } from '../lib/MenuBridge';
import { useTwinStore } from '../store/useTwinStore';
import { ErrorBoundary } from './ErrorBoundary';

let SideMenuComp: any = null;
try {
  SideMenuComp = require('./SideMenu').default;
} catch (e) {}

function MainApp() {
  const { menuVisible, closeMenu } = useMenuBridge();
  const theme = useTwinStore(s => s.theme);
  const lang = useTwinStore(s => s.lang);

  const isDark = theme === 'dark';
  const isRTL = lang === 'ar';

  const { width: SCREEN_W } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  useEffect(() => {
    if (SCREEN_W > 0) setReady(true);
  }, [SCREEN_W]);

  const safeW = SCREEN_W > 0 ? SCREEN_W : 400;

  // قيم متحركة منفصلة
  const mainX = useRef(new Animated.Value(0)).current;
  const mainS = useRef(new Animated.Value(1)).current;
  const mainBorder = useRef(new Animated.Value(0)).current;
  const menuX = useRef(new Animated.Value(isRTL ? safeW : -safeW)).current;
  const menuO = useRef(new Animated.Value(0)).current;

  // مراجع للأنيميشن لإيقافها قبل بدء جديدة
  const parallelAnim = useRef<Animated.CompositeAnimation | null>(null);
  const borderAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!menuVisible) {
      menuX.setValue(isRTL ? safeW : -safeW);
      mainX.setValue(0);
    }
  }, [isRTL, safeW]);

  useEffect(() => {
    if (!ready) return;
    if (menuVisible) setMenuMounted(true);

    // إيقاف أي أنيميشن سابقة
    parallelAnim.current?.stop();
    borderAnim.current?.stop();

    const mainTarget  = menuVisible ? (isRTL ? -safeW * 0.72 : safeW * 0.72) : 0;
    const menuTarget  = menuVisible ? 0 : (isRTL ? safeW : -safeW);
    const scaleTarget = menuVisible ? 0.88 : 1;
    const opacityTarget = menuVisible ? 1 : 0;

    // تجميع الحركات التي تدعم native driver
    const parallel = Animated.parallel([
      Animated.spring(mainX, {
        toValue: mainTarget,
        damping: 22,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.spring(mainS, {
        toValue: scaleTarget,
        damping: 22,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.spring(menuX, {
        toValue: menuTarget,
        damping: 22,
        stiffness: 160,
        useNativeDriver: true,
      }),
      Animated.timing(menuO, {
        toValue: opacityTarget,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    // حركة borderRadius (لا تدعم native) – منفصلة تماماً
    const border = Animated.timing(mainBorder, {
      toValue: menuVisible ? 20 : 0,
      duration: 300,
      useNativeDriver: false,
    });

    parallel.start(({ finished }) => {
      if (finished && !menuVisible) setMenuMounted(false);
    });
    border.start();

    parallelAnim.current = parallel;
    borderAnim.current = border;

    return () => {
      parallel.stop();
      border.stop();
    };
  }, [menuVisible, isRTL, safeW, ready]);

  const handleCloseMenu = useCallback(() => closeMenu(), [closeMenu]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {menuMounted && (
        <Animated.View
          style={[
            st.menu,
            {
              width: safeW,
              right: isRTL ? 0 : undefined,
              left: isRTL ? undefined : 0,
              opacity: menuO,
              transform: [{ translateX: menuX }],
              backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            },
          ]}
          pointerEvents={menuVisible ? 'auto' : 'none'}
        >
          {SideMenuComp ? (
            <SideMenuComp onClose={handleCloseMenu} />
          ) : (
            <View style={st.loading}>
              <ActivityIndicator color="#7C3AED" size="large" />
            </View>
          )}
        </Animated.View>
      )}

      <Animated.View
        style={[
          st.main,
          {
            transform: [{ translateX: mainX }, { scale: mainS }],
            borderRadius: mainBorder,
            overflow: 'hidden',
          },
        ]}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="splash" />
          <Stack.Screen name="twin-mind" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          {/* أضف باقي الشاشات حسب الحاجة */}
        </Stack>
      </Animated.View>

      {menuVisible && (
        <Pressable
          style={[
            st.overlay,
            isRTL
              ? { right: safeW * 0.72, left: 0 }
              : { left: safeW * 0.72, right: 0 },
          ]}
          onPress={handleCloseMenu}
        />
      )}
    </>
  );
}

export default function AppEntry() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <MenuBridgeProvider>
          <MainApp />
        </MenuBridgeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#000' },
  menu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 10,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 200,
    elevation: 25,
  },
});
