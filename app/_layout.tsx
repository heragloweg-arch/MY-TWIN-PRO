import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Animated } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { ErrorBoundary } from '../components/ErrorBoundary';

// مكون مساعد لعرض الأخطاء الفادحة
function FatalError({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red', padding: 20 }}>
      <Animated.Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
        {message}
      </Animated.Text>
    </View>
  );
}

function AppContent() {
  // قراءة من الـ store للتأكد من أنه يعمل
  const theme = useTwinStore(s => s.theme);
  const menuVisible = useTwinStore(s => s.menuVisible);
  const closeMenu = useTwinStore(s => s.closeMenu);
  const lang = useTwinStore(s => s.lang);

  const [SideMenuComp, setSideMenuComp] = useState<any>(null);
  const [menuLoadError, setMenuLoadError] = useState<string | null>(null);

  useEffect(() => {
    // محاولة تحميل SideMenu
    try {
      const mod = require('../components/SideMenu');
      if (mod?.default) {
        setSideMenuComp(() => mod.default);
      } else {
        setMenuLoadError('SideMenu does not have a default export');
      }
    } catch (e: any) {
      console.error('Failed to load SideMenu:', e);
      setMenuLoadError('Failed to load SideMenu: ' + (e.message || 'Unknown error'));
    }
  }, []);

  // إذا فشل تحميل SideMenu، اعرض الخطأ
  if (menuLoadError) {
    return <FatalError message={menuLoadError} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
          </Stack>
          {/* القائمة الجانبية ستظهر عند الضرورة (يمكنك فتحها لاحقاً) */}
          {menuVisible && SideMenuComp ? (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#111' }}>
              <SideMenuComp onClose={closeMenu} />
            </View>
          ) : null}
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// المكون الجذري
export default function RootLayout() {
  return <AppContent />;
}
