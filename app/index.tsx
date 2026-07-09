import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LivingSpace } from '../src/renderers';
import { runtime } from '../src/core/TwinRuntime';
import { storeSyncBridge } from '../src/core/StoreSyncBridge';
import { audioEngine } from '../src/core/AudioEngine';
import { livingIntelligence } from '../src/core/LivingIntelligence';
import { isAuthenticated, getUserId } from '../lib/auth';
import Genesis from './genesis';

export default function Index() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const check = async () => {
      const authed = await isAuthenticated();
      setUserLoggedIn(authed);
      if (authed) {
        const uid = await getUserId();
        setUserId(uid || '');
      }
      setAuthChecked(true);
    };
    check();
  }, []);

  useEffect(() => {
    if (!authChecked || !userLoggedIn) return;

    runtime.start();
    storeSyncBridge.activate();
    storeSyncBridge.syncNow();
    livingIntelligence.start(userId, 'ar');

    audioEngine.init().then(() => {
      audioEngine.startAmbience();
      audioEngine.bindEvents();
    });

    return () => {
      livingIntelligence.stop();
      audioEngine.unbindEvents();
      audioEngine.fadeAll();
      storeSyncBridge.deactivate();
      runtime.stop();
    };
  }, [authChecked, userLoggedIn, userId]);

  if (!authChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.text}>جارٍ التحميل...</Text>
      </View>
    );
  }

  if (!userLoggedIn) {
    return <Genesis />;
  }

  return <LivingSpace userId={userId} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' },
  text: { color: '#A78BFA', fontSize: 18, marginTop: 16 },
});
