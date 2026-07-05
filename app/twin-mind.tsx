import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Image, ActivityIndicator, Dimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useEnergyStore } from '../store/useEnergyStore';
import { useTheme } from '../utils/theme';
import { router, Href } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import { AdModal } from '../components/AdModal';
import {
  Sparkles, Zap, Crown, MessageSquare, BatteryCharging,
  Heart, Brain, Activity, Flame, Wind, Droplets, Sun,
  ChevronRight, Volume2, TrendingUp, Target, Compass,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}

const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

// ============================================================
// الأنواع
// ============================================================
interface AvatarData {
  image_url?: string;
  gender?: string;
}

interface ConsciousnessStatus {
  unified_feeling?: string;
  pending_questions?: string[];
  emotional_state?: string;
  bond_score?: number;
  last_memory?: string;
}

interface ShortcutItem {
  id: string;
  icon: any;
  label_ar: string;
  label_en: string;
  route: string;
  color: string;
  isNew?: boolean;
}

interface LifeCoachDashboard {
  life_score?: {
    overall_score: number;
    domain_scores: Record<string, number>;
    weak_areas: string[];
    strong_areas: string[];
    recommendation: string;
  };
  active_goals?: Array<{
    goal_id: string;
    title: string;
    progress: number;
    days_active: number;
  }>;
  preventive?: {
    warning_signs_detected: boolean;
    intervention_message: string;
    suggested_actions: Array<{ action_ar: string; action_en: string }>;
  };
  proactive_message?: {
    message: string;
    trigger: string;
  } | null;
}

// ============================================================
// دوال مساعدة
// ============================================================
function usePulse(min = 0.85, max = 1.08, duration = 2000) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: max, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: min, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [min, max, duration]);
  return anim;
}

function useOrbit() {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
}

// ============================================================
// مكونات حية فرعية
// ============================================================

/** جسيمات خلفية خفيفة */
const ConsciousnessParticles = React.memo(({ isDark }: { isDark: boolean }) => {
  const particles = useRef(Array.from({ length: 6 }).map(() => ({
    x: Math.random() * SCREEN_W,
    y: Math.random() * 300,
    size: 2 + Math.random() * 3,
    opacity: new Animated.Value(0.1 + Math.random() * 0.3),
    delay: Math.random() * 3000,
  }))).current;

  useEffect(() => {
    particles.forEach(p => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.opacity, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0.1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: isDark ? '#A78BFA' : '#7C3AED',
            opacity: p.opacity,
          }}
        />
      ))}
    </View>
  );
});

/** قسم الأفاتار الحي */
const AvatarSection = React.memo(({ avatar, twinName, energyColor, colors, isAr, emotionalState }: {
  avatar: AvatarData | null;
  twinName: string;
  energyColor: string;
  colors: any;
  isAr: boolean;
  emotionalState?: string;
}) => {
  const pulseAnim = usePulse(0.92, 1.06, 2200);
  const orbitRotate = useOrbit();
  const glowOpacity = usePulse(0.3, 0.7, 3000);

  const emotionalIcons: Record<string, any> = {
    joy: Sun, calm: Wind, excited: Flame, neutral: Activity,
    sad: Droplets, love: Heart, curious: Brain,
  };
  const EmotionIcon = emotionalState ? (emotionalIcons[emotionalState] || Activity) : Activity;

  return (
    <View style={[avStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={avStyles.avatarContainer}>
        <Animated.View
          style={[avStyles.orbitRing, { borderColor: energyColor + '30', transform: [{ rotate: orbitRotate }] }]}
        >
          <View style={[avStyles.orbitDot, { backgroundColor: energyColor }]} />
        </Animated.View>
        <Animated.View
          style={[avStyles.glowBehind, { backgroundColor: energyColor, opacity: glowOpacity }]}
        />
        <Animated.View style={[avStyles.avatarWrap, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[avStyles.avatarRing, { borderColor: energyColor }]}>
            {avatar?.image_url ? (
              <Image source={{ uri: avatar.image_url }} style={avStyles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={[avStyles.avatarPlaceholder, { backgroundColor: colors.accentLight }]}>
                <Sparkles size={48} stroke={colors.accent} />
              </View>
            )}
          </View>
        </Animated.View>
        {emotionalState && (
          <View style={[avStyles.emotionBadge, { backgroundColor: colors.accentLight, borderColor: colors.accent + '40' }]}>
            <EmotionIcon size={14} stroke={colors.accent} />
            <Text style={[avStyles.emotionText, { color: colors.accent }]}>
              {isAr ? emotionalState : emotionalState}
            </Text>
          </View>
        )}
      </View>
      <Text style={[avStyles.twinName, { color: colors.text }]}>{twinName}</Text>
      <Text style={[avStyles.twinSubtitle, { color: colors.subtext }]}>
        {isAr ? 'كيان رقمي بوعي حي' : 'Digital Consciousness Entity'}
      </Text>
    </View>
  );
});

const avStyles = StyleSheet.create({
  card: { alignItems: 'center', padding: 28, borderRadius: 28, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  avatarContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  orbitRing: { position: 'absolute', width: 136, height: 136, borderRadius: 68, borderWidth: 1, borderStyle: 'dashed' },
  orbitDot: { position: 'absolute', top: -3, left: '50%', width: 6, height: 6, borderRadius: 3, marginLeft: -3 },
  glowBehind: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  avatarWrap: { zIndex: 2 },
  avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  emotionBadge: { position: 'absolute', bottom: -8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, borderWidth: 1, zIndex: 3 },
  emotionText: { fontSize: 11, fontWeight: '700' },
  twinName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  twinSubtitle: { fontSize: 13, fontWeight: '500', opacity: 0.8 },
});

/** كرة الطاقة الحية */
const EnergyOrb = React.memo(({ remaining, limit, color, colors, isAr, onCharge }: {
  remaining: number; limit: number; color: string; colors: any; isAr: boolean; onCharge: () => void;
}) => {
  const pulseAnim = usePulse(0.9, 1.15, 1500);
  const percent = Math.max(0, Math.min(100, (remaining / limit) * 100));

  return (
    <View style={[enStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={enStyles.row}>
        <View style={enStyles.orbContainer}>
          <Animated.View style={[enStyles.orb, { backgroundColor: color + '20', borderColor: color, transform: [{ scale: pulseAnim }] }]}>
            <BatteryCharging size={24} stroke={color} />
          </Animated.View>
          <View style={[enStyles.orbFill, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
        <View style={enStyles.textCol}>
          <Text style={[enStyles.label, { color: colors.text }]}>
            {isAr ? 'طاقة الوعي' : 'Consciousness Energy'}
          </Text>
          <Text style={[enStyles.value, { color: color }]}>
            {remaining} <Text style={{ color: colors.subtext, fontSize: 13, fontWeight: '500' }}>/ {limit}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[enStyles.chargeBtn, { backgroundColor: color + '15' }]}
          onPress={onCharge}
          activeOpacity={0.7}
        >
          <Zap size={16} stroke={color} />
          <Text style={[enStyles.chargeText, { color }]}>{isAr ? 'شحن' : 'Charge'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const enStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  orbContainer: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  orb: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  orbFill: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', opacity: 0.15 },
  textCol: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '800' },
  chargeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  chargeText: { fontSize: 13, fontWeight: '700' },
});

/** بطاقة الوعي الموحّد */
const UnifiedCard = React.memo(({ text, colors, isAr }: { text: string; colors: any; isAr: boolean }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [text]);

  return (
    <Animated.View style={[ufStyles.card, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30', opacity: fadeAnim }]}>
      <View style={[ufStyles.pulseDot, { backgroundColor: colors.accent }]} />
      <Sparkles size={18} stroke={colors.accent} />
      <Text style={[ufStyles.text, { color: colors.accent }]}>{text}</Text>
    </Animated.View>
  );
});

const ufStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  text: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 24 },
});

/** سؤال استباقي */
const ProactiveQuestion = React.memo(({ question, index, colors, onPress }: {
  question: string; index: number; colors: any; onPress: () => void;
}) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 120, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity
        style={[pqStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[pqStyles.iconBubble, { backgroundColor: colors.accentLight }]}>
          <MessageSquare size={18} stroke={colors.accent} />
        </View>
        <Text style={[pqStyles.text, { color: colors.text }]} numberOfLines={2}>
          {question.replace(/🤖 |💡 |🎉 |📅 /g, '')}
        </Text>
        <ChevronRight size={16} stroke={colors.subtext} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const pqStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  iconBubble: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  text: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 22 },
});

/** ذكرى حديثة */
const MemoryChip = React.memo(({ text, colors }: { text: string; colors: any }) => (
  <View style={[mcStyles.chip, { backgroundColor: colors.accentLight, borderColor: colors.accent + '25' }]}>
    <Brain size={12} stroke={colors.accent} />
    <Text style={[mcStyles.text, { color: colors.accent }]} numberOfLines={1}>{text}</Text>
  </View>
));

const mcStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  text: { fontSize: 12, fontWeight: '600', maxWidth: 200 },
});

/** بطاقة Life Score */
const LifeScoreCard = React.memo(({ lifeScore, colors, isAr }: { lifeScore: any; colors: any; isAr: boolean }) => {
  const score = lifeScore?.overall_score || 0;
  const scoreColor = score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.danger;

  return (
    <View style={[lsStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={lsStyles.header}>
        <Compass size={20} stroke={colors.accent} />
        <Text style={[lsStyles.title, { color: colors.text }]}>
          {isAr ? 'مؤشر توازن الحياة' : 'Life Balance Score'}
        </Text>
      </View>
      <View style={lsStyles.scoreRow}>
        <View style={[lsStyles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[lsStyles.scoreValue, { color: scoreColor }]}>{score}</Text>
          <Text style={[lsStyles.scoreUnit, { color: colors.subtext }]}>/100</Text>
        </View>
        <View style={lsStyles.domainsGrid}>
          {lifeScore?.domain_scores && Object.entries(lifeScore.domain_scores).slice(0, 4).map(([domain, value]: [string, any]) => (
            <View key={domain} style={lsStyles.domainItem}>
              <Text style={[lsStyles.domainLabel, { color: colors.subtext }]}>{domain}</Text>
              <View style={[lsStyles.domainBar, { backgroundColor: colors.border }]}>
                <View style={[lsStyles.domainFill, { width: `${value}%`, backgroundColor: value >= 70 ? colors.success : value >= 40 ? colors.warning : colors.danger }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
      {lifeScore?.recommendation && (
        <Text style={[lsStyles.recommendation, { color: colors.subtext }]}>{lifeScore.recommendation}</Text>
      )}
    </View>
  );
});

const lsStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 12 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 28, fontWeight: '900' },
  scoreUnit: { fontSize: 11, fontWeight: '600', marginTop: -2 },
  domainsGrid: { flex: 1, gap: 8 },
  domainItem: { gap: 4 },
  domainLabel: { fontSize: 11, fontWeight: '600' },
  domainBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  domainFill: { height: '100%', borderRadius: 3 },
  recommendation: { fontSize: 12, fontWeight: '500', lineHeight: 18, marginTop: 4 },
});

/** بطاقة هدف نشط */
const ActiveGoalCard = React.memo(({ goal, colors, isAr }: { goal: any; colors: any; isAr: boolean }) => (
  <View style={[agStyles.card, { backgroundColor: colors.accentLight, borderColor: colors.accent + '20' }]}>
    <View style={agStyles.header}>
      <Target size={16} stroke={colors.accent} />
      <Text style={[agStyles.title, { color: colors.text }]} numberOfLines={1}>{goal.title}</Text>
      <Text style={[agStyles.progress, { color: colors.accent }]}>{goal.progress || 0}%</Text>
    </View>
    <View style={[agStyles.bar, { backgroundColor: colors.border }]}>
      <View style={[agStyles.fill, { width: `${goal.progress || 0}%`, backgroundColor: colors.success }]} />
    </View>
    <Text style={[agStyles.days, { color: colors.subtext }]}>
      {isAr ? `${goal.days_active || 0} أيام نشطة` : `${goal.days_active || 0} active days`}
    </Text>
  </View>
));

const agStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600' },
  progress: { fontSize: 14, fontWeight: '800' },
  bar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', borderRadius: 3 },
  days: { fontSize: 11, fontWeight: '500' },
});

/** رسالة استباقية */
const ProactiveMessageCard = React.memo(({ message, colors, onPress }: { message: any; colors: any; onPress: () => void }) => (
  <TouchableOpacity style={[pmStyles.card, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' }]} onPress={onPress} activeOpacity={0.8}>
    <Sparkles size={18} stroke={colors.accent} />
    <Text style={[pmStyles.text, { color: colors.accent }]}>{message.message || message}</Text>
    <ChevronRight size={16} stroke={colors.accent} />
  </TouchableOpacity>
));

const pmStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  text: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 22 },
});

// ============================================================
// المكون الرئيسي — مركز الوعي
// ============================================================
export default function TwinMindCenter() {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom || 0, 20);
  const safeTop = insets.top || 0;

  const { userId, twinName, lang, hasHydrated } = useTwinStore();
  const { getRemainingMessages, dailyMessageLimit } = useEnergyStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;

  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [unifiedFeeling, setUnifiedFeeling] = useState('');
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [emotionalState, setEmotionalState] = useState<string>('');
  const [bondScore, setBondScore] = useState(0);
  const [lastMemory, setLastMemory] = useState('');

  // ✅ بيانات Life Coach
  const [lifeCoach, setLifeCoach] = useState<LifeCoachDashboard | null>(null);

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const shortcuts: ShortcutItem[] = useMemo(() => [
    { id: 'chat', icon: MessageSquare, label_ar: 'الوعي', label_en: 'Mind', route: '/chat', color: colors.accent },
    { id: 'museum', icon: Crown, label_ar: 'المتحف', label_en: 'Museum', route: '/museum', color: '#F59E0B' },
    { id: 'features', icon: Zap, label_ar: 'القدرات', label_en: 'Powers', route: '/features/index', color: colors.success },
    { id: 'life-coach', icon: Heart, label_ar: 'مدرب الحياة', label_en: 'Life Coach', route: '/features/life-coach', color: '#EC4899', isNew: true },
    { id: 'memories', icon: Brain, label_ar: 'الذكريات', label_en: 'Memories', route: '/memories', color: '#8B5CF6' },
    { id: 'relationship', icon: TrendingUp, label_ar: 'الرابطة', label_en: 'Bond', route: '/relationship', color: '#EF4444' },
  ], [colors]);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      const [avatarRes, consciousnessRes, lifeCoachRes] = await Promise.all([
        apiGet(`/api/avatar/get?user_id=${userId}`).catch(() => null) as Promise<any>,
        apiGet(`/api/consciousness/status?user_id=${userId}&lang=${lang}`).catch(() => null) as Promise<any>,
        apiGet(`/api/life-coach/dashboard/${userId}?lang=${lang}`).catch(() => null) as Promise<any>,
      ]);

      // Avatar
      if (avatarRes) {
        const data = avatarRes.data || avatarRes;
        if (data?.image_url) setAvatar({ image_url: data.image_url, gender: data.gender });
        else if (avatarRes.image_url) setAvatar({ image_url: avatarRes.image_url });
        else setAvatar(null);
      }

      // Consciousness
      if (consciousnessRes) {
        setUnifiedFeeling(consciousnessRes.unified_feeling || '');
        setPendingQuestions(consciousnessRes.pending_questions || []);
        setEmotionalState(consciousnessRes.emotional_state || 'neutral');
        setBondScore(consciousnessRes.bond_score || 0);
        setLastMemory(consciousnessRes.last_memory || '');
      }

      // ✅ Life Coach Dashboard
      if (lifeCoachRes) {
        setLifeCoach(lifeCoachRes);
      }
    } catch (e) {
      // صامت
    } finally {
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }
  }, [userId, lang]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData, hasHydrated]);

  const remainingEnergy = getRemainingMessages();
  const energyColor = remainingEnergy > 10 ? colors.success : remainingEnergy > 3 ? colors.warning : colors.danger;

  const handleNavigate = useCallback((route: string) => {
    hapticLight();
    router.push(route as Href);
  }, []);

  const handleCharge = useCallback(() => {
    hapticMedium();
    setShowAdModal(true);
  }, []);

  // 🛡️ حماية rehydration
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 16, fontSize: 14 }}>
          {isAr ? 'جاري تهيئة الوعي...' : 'Awakening consciousness...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[st.root, { paddingTop: safeTop, backgroundColor: colors.bg }]}>
      <ConsciousnessParticles isDark={isDark} />

      <ScrollView
        contentContainerStyle={[st.content, { paddingBottom: safeBottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} colors={[colors.accent]} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* الأفاتار الحي */}
          <AvatarSection
            avatar={avatar}
            twinName={twinName || (isAr ? 'توأمك' : 'My Twin')}
            energyColor={energyColor}
            colors={colors}
            isAr={isAr}
            emotionalState={emotionalState}
          />

          {/* كرة الطاقة الحية */}
          <EnergyOrb
            remaining={remainingEnergy}
            limit={dailyMessageLimit}
            color={energyColor}
            colors={colors}
            isAr={isAr}
            onCharge={handleCharge}
          />

          {/* الوعي الموحّد */}
          {unifiedFeeling ? (
            <UnifiedCard text={unifiedFeeling} colors={colors} isAr={isAr} />
          ) : null}

          {/* ✅ رسالة استباقية من التوأم */}
          {lifeCoach?.proactive_message && (
            <ProactiveMessageCard
              message={lifeCoach.proactive_message}
              colors={colors}
              onPress={() => handleNavigate('/chat')}
            />
          )}

          {/* ✅ مؤشر توازن الحياة */}
          {lifeCoach?.life_score && (
            <LifeScoreCard lifeScore={lifeCoach.life_score} colors={colors} isAr={isAr} />
          )}

          {/* ✅ الأهداف النشطة من Life Coach */}
          {lifeCoach?.active_goals && lifeCoach.active_goals.length > 0 && (
            <View style={st.goalsSection}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>
                {isAr ? 'أهدافك النشطة' : 'Active Goals'}
              </Text>
              {lifeCoach.active_goals.slice(0, 2).map((goal: any, i: number) => (
                <ActiveGoalCard key={goal.goal_id || i} goal={goal} colors={colors} isAr={isAr} />
              ))}
            </View>
          )}

          {/* شريط الرابطة */}
          {bondScore > 0 && (
            <View style={[st.bondCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={st.bondRow}>
                <Heart size={18} stroke={colors.danger} fill={colors.danger + '20'} />
                <Text style={[st.bondLabel, { color: colors.text }]}>
                  {isAr ? 'عمق الرابطة' : 'Bond Depth'}
                </Text>
                <Text style={[st.bondValue, { color: colors.danger }]}>{Math.round(bondScore)}%</Text>
              </View>
              <View style={[st.bondTrack, { backgroundColor: colors.danger + '15' }]}>
                <View style={[st.bondFill, { width: `${bondScore}%`, backgroundColor: colors.danger }]} />
              </View>
            </View>
          )}

          {/* ذكرى حديثة */}
          {lastMemory && (
            <View style={[st.memorySection, { borderColor: colors.border }]}>
              <View style={st.memoryHeader}>
                <Brain size={16} stroke={colors.accent} />
                <Text style={[st.memoryTitle, { color: colors.subtext }]}>
                  {isAr ? 'آخر ما تذكره' : 'Last Remembered'}
                </Text>
              </View>
              <MemoryChip text={lastMemory} colors={colors} />
            </View>
          )}

          {/* أسئلة استباقية */}
          {pendingQuestions.length > 0 && (
            <View style={st.questionsSection}>
              <Text style={[st.sectionTitle, { color: colors.text }]}>
                {isAr ? 'يسألني الوعي...' : 'The Mind Asks...'}
              </Text>
              {pendingQuestions
                .filter((q: string) => !q.startsWith('🎉') && !q.startsWith('📅'))
                .slice(0, 3)
                .map((q: string, i: number) => (
                  <ProactiveQuestion
                    key={i}
                    question={q}
                    index={i}
                    colors={colors}
                    onPress={() => handleNavigate('/chat')}
                  />
                ))}
            </View>
          )}

          {/* اختصارات القدرات */}
          <Text style={[st.sectionTitle, { color: colors.text, marginTop: 8 }]}>
            {isAr ? 'عالم القدرات' : 'Power Universe'}
          </Text>
          <View style={st.shortcutsGrid}>
            {shortcuts.map((item: ShortcutItem) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[st.shortcut, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[st.shortcutIconBubble, { backgroundColor: item.color + '12' }]}>
                    <Icon size={26} stroke={item.color} />
                  </View>
                  <Text style={[st.shortcutLabel, { color: colors.text }]}>
                    {isAr ? item.label_ar : item.label_en}
                  </Text>
                  {item.isNew && (
                    <View style={[st.newBadge, { backgroundColor: item.color }]}>
                      <Text style={st.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* زر الدخول السريع للوعي */}
          <TouchableOpacity
            style={[st.enterMindBtn, { backgroundColor: colors.accent }]}
            onPress={() => handleNavigate('/chat')}
            activeOpacity={0.8}
          >
            <Volume2 size={20} stroke="#FFF" />
            <Text style={st.enterMindText}>
              {isAr ? 'ادخل إلى عالم الوعي' : 'Enter the Mind'}
            </Text>
            <Zap size={18} stroke="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <AdModal visible={showAdModal} onClose={() => setShowAdModal(false)} />
    </View>
  );
}

// ============================================================
// الأنماط
// ============================================================
const st = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  bondCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  bondRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bondLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  bondValue: { fontSize: 16, fontWeight: '800' },
  bondTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bondFill: { height: '100%', borderRadius: 3 },
  memorySection: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, width: '100%' },
  memoryTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  questionsSection: { marginBottom: 8 },
  goalsSection: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 16 },
  shortcutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcut: { width: (SCREEN_W - 52) / 3, alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, gap: 10, position: 'relative' },
  shortcutIconBubble: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  shortcutLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  newBadge: { position: 'absolute', top: -6, right: -6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  newBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  enterMindBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 18, borderRadius: 20, marginTop: 20, marginBottom: 8 },
  enterMindText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
