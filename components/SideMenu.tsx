import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Animated, LayoutAnimation, Platform, UIManager, Dimensions, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { removeToken } from '../lib/auth';
import { apiGet } from '../lib/httpClient';
import {
  Home, MessageCircle, Heart, Brain, User, Palette, Diamond,
  Settings, LogOut, Gift, Sparkles, BatteryFull, BatteryMedium,
  BatteryLow, ChevronRight, Zap, Crown, Star,
  GraduationCap, Code2, TrendingUp, Image as ImageIcon, Moon,
  PenLine, Home as HomeIcon, CheckSquare, FolderOpen,
  Eye, Bell, TrendingUp as TrendingUpIcon, BookOpen,
  LayoutGrid,
} from 'lucide-react-native';

const LOGO = require('../assets/logo.png');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_W * 0.82;

const TIER_CONFIG: Record<string, { ar: string; en: string; color: string; bg: string; icon: any }> = {
  free:            { ar: 'مجاني',         en: 'Free',           color: '#6B7280', bg: '#F3F4F6', icon: Star     },
  free_trial_14d:  { ar: 'تجربة مجانية',  en: 'Free Trial',     color: '#F59E0B', bg: '#FEF3C7', icon: Star     },
  premium_trial:   { ar: 'تجربة مميزة',   en: 'Premium Trial',  color: '#8B5CF6', bg: '#EDE9FE', icon: Crown    },
  plus:            { ar: 'Plus ✨',         en: 'Plus ✨',        color: '#6366F1', bg: '#EEF2FF', icon: Crown    },
  premium:         { ar: 'Premium 💜',      en: 'Premium 💜',     color: '#A855F7', bg: '#F5F3FF', icon: Crown    },
  pro:             { ar: 'Pro 🔥',         en: 'Pro 🔥',         color: '#EF4444', bg: '#FEF2F2', icon: Crown    },
  yearly:          { ar: 'سنوي ⚡',        en: 'Yearly ⚡',       color: '#F59E0B', bg: '#FFFBEB', icon: Crown    },
};

const FREE_TIERS = ['free', 'free_trial_14d'];

const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };
const hapticWarning = () => { try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch(e) {} };

function usePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

/* ============================================================
   مكونات بصرية مساعدة
   ============================================================ */

const AvatarRing = memo(({ accent, accentSoft, source }: { accent: string; accentSoft: string; source: any }) => {
  const ringAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ring = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
    ]));
    const scale = Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ]));
    ring.start(); scale.start();
    return () => { ring.stop(); scale.stop(); };
  }, []);
  return (
    <View style={av.outer}>
      <Animated.View style={[av.pulseRing, { borderColor: accent, opacity: ringAnim, transform: [{ scale: scaleAnim }] }]} />
      <View style={[av.innerRing, { borderColor: accent + '50' }]}>
        <View style={[av.avatar, { backgroundColor: accentSoft, overflow: 'hidden' }]}>
          <Image source={source} style={av.avatarImg} resizeMode="cover" />
        </View>
      </View>
    </View>
  );
});

const av = StyleSheet.create({
  outer: { width: 96, height: 96, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  pulseRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2 },
  innerRing: { width: 86, height: 86, borderRadius: 43, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', padding: 2 },
  avatar: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
});

const AnimBar = memo(({ value, color, trackColor }: { value: number; color: string; trackColor: string }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(barAnim, { toValue: Math.max(0, Math.min(1, value / 100)), tension: 60, friction: 10, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={[bs.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[bs.fill, { backgroundColor: color, width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
});

const bs = StyleSheet.create({ track: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 } });

const SectionHeader = memo(({ label, expanded, onPress, c }: any) => (
  <TouchableOpacity style={[sh.header, { borderColor: c.border }]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[sh.headerText, { color: c.sectionHdr }]}>{label}</Text>
    <Animated.View style={{ transform: [{ rotate: expanded ? (c.isAr ? '-90deg' : '90deg') : '0deg' }] }}>
      <ChevronRight size={16} stroke={c.subtext} />
    </Animated.View>
  </TouchableOpacity>
));

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 2 },
  headerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
});

const MenuItem = memo(({ icon: Icon, label, route, c, navigate, isNew }: any) => (
  <TouchableOpacity style={[mi.item, { backgroundColor: c.cardBg }]} onPress={() => navigate(route)} activeOpacity={0.7}>
    <View style={[mi.iconWrap, { backgroundColor: c.iconBg }]}>
      <Icon size={20} stroke={c.accent} />
    </View>
    <Text style={[mi.label, { color: c.text }]}>{label}</Text>
    {isNew && (
      <View style={[mi.badge, { backgroundColor: c.accent }]}>
        <Text style={mi.badgeText}>NEW</Text>
      </View>
    )}
    <ChevronRight size={16} stroke={c.subtext} style={{ transform: [{ scaleX: c.isAr ? -1 : 1 }] }} />
  </TouchableOpacity>
));

const mi = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, marginBottom: 3 },
  iconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '500', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 4 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});
