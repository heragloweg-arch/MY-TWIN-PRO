import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from './components/ErrorBoundary';
import { Stack } from 'expo-router';

// 🎨 Living Atmosphere (ستُستبدل بمنسق حي قريبًا)
const LivingAtmosphere = {
  backgroundColor: 'transparent', // ← LivingWorld هو المسؤول
};

// 🌌 TransitionCoordinator المستقبلي (سيُحدد animation ديناميكيًا)
const transitionCoordinator = {
  getAnimation: () => 'fade' as const, // ← مؤقتًا، لحين بناء المنسق
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* StatusBar سيرتبط مستقبلاً بـ LivingWorld وليس Theme ثابت */}
        <StatusBar style="light" />

        {/* لا يوجد SideMenu. الدخول إلى Soul Observatory يكون عبر LongPress على Avatar */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: transitionCoordinator.getAnimation(),
            animationDuration: 150,
            contentStyle: {
              backgroundColor: LivingAtmosphere.backgroundColor,
            },
          }}
        >
          {/* مراحل الحياة */}
          <Stack.Screen name="genesis" options={{ headerShown: false }} />
          <Stack.Screen name="living-world" options={{ headerShown: false }} />

          {/* عالم القدرات */}
          <Stack.Screen name="study" options={{ headerShown: false }} />
          <Stack.Screen name="code-lab" options={{ headerShown: false }} />
          <Stack.Screen name="business" options={{ headerShown: false }} />
          <Stack.Screen name="creator" options={{ headerShown: false }} />
          <Stack.Screen name="dream" options={{ headerShown: false }} />
          <Stack.Screen name="life-coach" options={{ headerShown: false }} />
          <Stack.Screen name="tasks" options={{ headerShown: false }} />
          <Stack.Screen name="image-lab" options={{ headerShown: false }} />
          <Stack.Screen name="smart-home" options={{ headerShown: false }} />

          {/* المصادقة (تبقى ضرورية) */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
