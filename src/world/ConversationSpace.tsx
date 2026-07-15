import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEmotionalState } from '../hooks/useEmotionalState';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { stateBus } from '../core/StateBus';
import { SPACE, RADIUS } from '../../src/design/tokens/spacing';

interface ConversationSpaceProps {
  children: React.ReactNode;
  isThinking?: boolean;
  isWriting?: boolean;
}

export default function ConversationSpace({
  children,
  isThinking = false,
  isWriting = false,
}: ConversationSpaceProps) {
  const emotion = useEmotionalState();
  const spaceOpacity = useRef(new Animated.Value(1)).current;
  const memoryGlow = useRef(new Animated.Value(0)).current;
  const behaviorBg = useRef(new Animated.Value(0)).current;

  // 🆕 الاستماع إلى قرارات السلوك وتغيير الجو
  useEffect(() => {
    const unsubscribe = stateBus.on('behavior:decision', (event: string, data: any) => {
      if (data.behavior === 'empathetic_comfort') {
        // إضاءة دافئة جدًا
        Animated.timing(behaviorBg, { toValue: 0.8, duration: 500, useNativeDriver: true }).start();
      } else if (data.behavior === 'reflective_silence') {
        // إضاءة هادئة جدًا
        Animated.timing(behaviorBg, { toValue: 0.2, duration: 1000, useNativeDriver: true }).start();
      } else {
        Animated.timing(behaviorBg, { toValue: 0, duration: 500, useNativeDriver: true }).start();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = stateBus.on('MEMORY_SURFACED', () => {
      memoryGlow.setValue(1);
      Animated.timing(memoryGlow, { toValue: 0, duration: 2000, useNativeDriver: true }).start();
    });
    return unsubscribe;
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: spaceOpacity }]}>
      {/* خلفية ديناميكية تتغير مع السلوك */}
      <Animated.View style={[styles.behaviorOverlay, { opacity: behaviorBg }]} />

      {/* المساحة الشخصية */}
      <View style={styles.personalSpace}>
        <View style={styles.personalItem}>
          <Text style={styles.personalLabel}>اليوم</Text>
          <Text style={styles.personalValue}>{emotion.valence === 'positive' ? 'مشرق' : emotion.valence === 'negative' ? 'متقلب' : 'عادي'}</Text>
        </View>
        <View style={styles.personalItem}>
          <Text style={styles.personalLabel}>الطاقة</Text>
          <Text style={styles.personalValue}>{Math.round(emotion.intensity * 100)}%</Text>
        </View>
        <View style={styles.personalItem}>
          <Text style={styles.personalLabel}>المزاج</Text>
          <Text style={styles.personalValue}>{emotion.primaryEmotion}</Text>
        </View>
      </View>

      {/* شريط الذاكرة */}
      <Animated.View style={[styles.memoryRibbon, { opacity: memoryGlow }]}>
        <Text style={styles.memoryText}>📖 من ذكرياتنا...</Text>
      </Animated.View>

      {/* مساحة المحادثة */}
      <View style={styles.conversationContent}>
        {children}
      </View>

      {/* مؤشرات السياق الثلاثة */}
      <View style={styles.contextIndicators}>
        <View style={[styles.contextDot, { opacity: 0.8 }]} />
        <View style={[styles.contextDot, { opacity: 0.5 }]} />
        <View style={[styles.contextDot, { opacity: 0.3 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACE.md,
  },
  behaviorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#A78BFA',
    opacity: 0,
    zIndex: 0,
  },
  personalSpace: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACE.xs,
    marginBottom: SPACE.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2D1B4D',
    zIndex: 1,
  },
  personalItem: {
    alignItems: 'center',
  },
  personalLabel: {
    color: '#6B5B8A',
    fontSize: 10,
  },
  personalValue: {
    color: '#A78BFA',
    fontSize: 12,
  },
  memoryRibbon: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: RADIUS.sm,
    padding: SPACE.sm,
    marginBottom: SPACE.sm,
    zIndex: 1,
  },
  memoryText: {
    color: '#A78BFA',
    fontSize: 12,
    fontStyle: 'italic',
  },
  conversationContent: {
    flex: 1,
    zIndex: 1,
  },
  contextIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACE.sm,
  },
  contextDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A78BFA',
  },
});
