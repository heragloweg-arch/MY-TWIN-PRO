import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 150 }}>
          <Stack.Screen name="index"                       />
          <Stack.Screen name="splash"                      />
          <Stack.Screen name="login"                       />
          <Stack.Screen name="twin-mind"                   />
          <Stack.Screen name="chat"                        />
          <Stack.Screen name="onboarding"                  />
          <Stack.Screen name="museum"                      />
          <Stack.Screen name="memories"                    />
          <Stack.Screen name="relationship"                />
          <Stack.Screen name="stories"                     />
          <Stack.Screen name="profile"                     />
          <Stack.Screen name="settings"                    />
          <Stack.Screen name="subscription"                />
          <Stack.Screen name="referral"                    />
          <Stack.Screen name="features/index"              />
          <Stack.Screen name="features/study-mode"         />
          <Stack.Screen name="features/code-lab"           />
          <Stack.Screen name="features/business-analyzer"  />
          <Stack.Screen name="features/life-coach"         />
          <Stack.Screen name="features/image-creator"      />
          <Stack.Screen name="features/dreams"             />
          <Stack.Screen name="features/content-creator"    />
          <Stack.Screen name="features/smart-home"         />
          <Stack.Screen name="features/task-manager"       />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
