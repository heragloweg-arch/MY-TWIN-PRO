import React, { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';

export default function Splash() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const screens: [string, () => any][] = [
      ['login',         () => require('./login')],
      ['twin-mind',     () => require('./twin-mind')],
      ['chat/index',    () => require('./chat/index')],
      ['onboarding',    () => require('./onboarding')],
      ['museum',        () => require('./museum')],
      ['memories',      () => require('./memories')],
      ['relationship',  () => require('./relationship')],
      ['profile',       () => require('./profile')],
      ['settings',      () => require('./settings')],
      ['subscription',  () => require('./subscription')],
      ['features/index',() => require('./features/index')],
    ];

    const logs: string[] = [];
    for (const [name, fn] of screens) {
      try {
        fn();
        logs.push('✅ ' + name);
      } catch (e: any) {
        logs.push('❌ ' + name + ': ' + String(e?.message || e).slice(0, 120));
      }
    }
    setResults(logs);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0014' }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
    >
      <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
        🔍 Screens Diagnostic
      </Text>
      {results.length === 0 && (
        <Text style={{ color: '#F59E0B', fontSize: 13 }}>جاري الفحص...</Text>
      )}
      {results.map((r, i) => (
        <Text key={i} style={{
          color:        r.startsWith('✅') ? '#10B981' : '#EF4444',
          fontSize:     12,
          marginBottom: 8,
          lineHeight:   18,
        }}>
          {r}
        </Text>
      ))}
    </ScrollView>
  );
}
