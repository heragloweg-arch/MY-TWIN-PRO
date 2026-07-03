import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  Animated, Platform, UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { router } from 'expo-router';
import { removeToken } from '../lib/auth';
import { apiGet } from '../lib/httpClient';

// ── استيراد الأيقونات مع حماية ─────────────────────────────
let Icons: any = {};
try {
  Icons = require('lucide-react-native');
} catch(e) {
  console.warn('[SideMenu] lucide-react-native not found, using text fallback');
}

const {
  Home, MessageCircle, Heart, Brain, User, Palette, Diamond,
  Settings, LogOut, Gift, Sparkles, BatteryFull, BatteryMedium,
  BatteryLow, ChevronRight, Zap, Crown, Star, X,
  GraduationCap, Code2, TrendingUp, Image, Moon,
  PenLine, CheckSquare, FolderOpen, Eye, Bell, BookOpen,
} = Icons;

// أيقونة بديلة في حال فشل التحميل
const FallbackIcon = ({ label }: { label: string }) => (
  <View style={{ width: 19, height: 19, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 10, color: '#888' }}>{label}</Text>
  </View>
);

const Icon = (icon: any, fallback: string) => icon || (() => <FallbackIcon label={fallback} />);

// ── Haptics آمن ──────────────────────────────────────────────
let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}
const hapticLight   = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);   } catch {} };
const hapticMedium  = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium);  } catch {} };
const hapticWarning = () => { try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch {} };

// ── LayoutAnimation آمن على Android ─────────────────────────
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  try { UIManager.setLayoutAnimationEnabledExperimental(true); } catch {}
}

const TIER_CONFIG: Record<string, { ar: string; en: string; color: string; bg: string; icon: any }> = {
  free:           { ar: 'مجاني',        en: 'Free',          color: '#6B7280', bg: '#F3F4F6', icon: Icon(Star, '⭐') },
  free_trial_14d: { ar: 'تجربة مجانية', en: 'Free Trial',    color: '#F59E0B', bg: '#FEF3C7', icon: Icon(Star, '⭐') },
  premium_trial:  { ar: 'تجربة مميزة',  en: 'Premium Trial', color: '#8B5CF6', bg: '#EDE9FE', icon: Icon(Crown, '👑') },
  plus:           { ar: 'Plus ✨',       en: 'Plus ✨',        color: '#6366F1', bg: '#EEF2FF', icon: Icon(Crown, '👑') },
  premium:        { ar: 'Premium 💜',    en: 'Premium 💜',    color: '#A855F7', bg: '#F5F3FF', icon: Icon(Crown, '👑') },
  pro:            { ar: 'Pro 🔥',        en: 'Pro 🔥',         color: '#EF4444', bg: '#FEF2F2', icon: Icon(Crown, '👑') },
  yearly:         { ar: 'سنوي ⚡',       en: 'Yearly ⚡',      color: '#F59E0B', bg: '#FFFBEB', icon: Icon(Crown, '👑') },
};
const FREE_TIERS = ['free', 'free_trial_14d'];

// ── Avatar Ring ───────────────────────────────────────────────
const AvatarRing = memo(({ accent, accentSoft }: { accent: string; accentSoft: string }) => {
  const ringAnim  = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ring = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim,  { toValue: 1,    duration: 1400, useNativeDriver: true }),
      Animated.timing(ringAnim,  { toValue: 0.6,  duration: 1400, useNativeDriver: true }),
    ]));
    const scale = Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
    ]));
    ring.start(); scale.start();
    return () => { ring.stop(); scale.stop(); };
  }, []);

  const IconSparkles = Icon(Sparkles, '✨');

  return (
    <View style={av.outer}>
      <Animated.View style={[av.pulseRing, { borderColor: accent, opacity: ringAnim, transform: [{ scale: scaleAnim }] }]} />
      <View style={[av.innerRing, { borderColor: accent + '60' }]}>
        <View style={[av.avatar, { backgroundColor: accentSoft }]}>
          <IconSparkles size={30} stroke={accent} />
        </View>
      </View>
    </View>
  );
});

const av = StyleSheet.create({
  outer:     { width: 76, height: 76, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  pulseRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2 },
  innerRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  avatar:    { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
});

// ── Animated Bar ──────────────────────────────────────────────
const AnimBar = memo(({ value, color, trackColor }: { value: number; color: string; trackColor: string }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(barAnim, {
      toValue:  Math.max(0, Math.min(1, value / 100)),
      tension:  60, friction: 10, useNativeDriver: false,
    }).start();
  }, [value]);
  return (
    <View style={[bs.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[bs.fill, {
        backgroundColor: color,
        width: barAnim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
      }]} />
    </View>
  );
});
const bs = StyleSheet.create({
  track: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
});

// ── Section Header ────────────────────────────────────────────
const SectionHeader = memo(({ label, expanded, onPress, c }: any) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: expanded ? 1 : 0, tension: 60, friction: 10, useNativeDriver: true,
    }).start();
  }, [expanded]);
  const IconChevron = Icon(ChevronRight, '>');
  return (
    <TouchableOpacity style={[sh.header]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[sh.headerText, { color: c.sectionHdr }]}>{label}</Text>
      <Animated.View style={{
        transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0,1], outputRange: ['0deg','90deg'] }) }],
      }}>
        <IconChevron size={16} stroke={c.subtext} />
      </Animated.View>
    </TouchableOpacity>
  );
});
const sh = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginTop: 4 },
  headerText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});

// ── Menu Item ─────────────────────────────────────────────────
const MenuItem = memo(({ icon: IconComponent, label, route, c, navigate, badge }: any) => {
  const IconComp = IconComponent || (() => <FallbackIcon label={label.substring(0,1)} />);
  const IconChevron = Icon(ChevronRight, '>');
  return (
    <TouchableOpacity style={mi.item} onPress={() => navigate(route)} activeOpacity={0.7}>
      <View style={[mi.iconWrap, { backgroundColor: c.accentSoft + '60' }]}>
        <IconComp size={19} stroke={c.subtext} />
      </View>
      <Text style={[mi.label, { color: c.text }]}>{label}</Text>
      {badge ? (
        <View style={[mi.badge, { backgroundColor: c.accent }]}>
          <Text style={mi.badgeText}>{badge}</Text>
        </View>
      ) : (
        <IconChevron size={14} stroke={c.subtext + '60'} />
      )}
    </TouchableOpacity>
  );
});
const mi = StyleSheet.create({
  item:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, marginBottom: 2 },
  iconWrap:  { width: 36, height: 36, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  label:     { fontSize: 15, fontWeight: '500', flex: 1 },
  badge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});

export default function SideMenu({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const {
    lang, twinName, bondLevel, tier, journeyPhase,
    clearHistory, getEnergyPercent, logout: storeLogout, userId,
  } = useTwinStore();

  const isAr = lang === 'ar';
  const t    = useCallback((ar: string, en: string) => isAr ? ar : en, [isAr]);

  const energy  = Math.max(0, Math.min(100, getEnergyPercent()));
  const bond    = Math.max(0, Math.min(100, bondLevel));
  const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const isFree  = FREE_TIERS.includes(tier);

  const [awarenessScore, setAwarenessScore] = useState<any>(null);
  const [notifFreq,      setNotifFreq]      = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    essentials: true,
    powers:     false,
    account:    false,
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      apiGet(`/api/awareness-score/${userId}`).catch(() => null),
      apiGet(`/api/awareness-score/frequency?user_id=${userId}&tier=${tier}`).catch(() => null),
    ]).then(([score, freq]) => {
      if (cancelled) return;
      if (score) setAwarenessScore(score);
      if (freq)  setNotifFreq(freq);
    });
    return () => { cancelled = true; };
  }, [userId, tier]);

  const energyColor = energy > 60 ? '#10B981' : energy > 25 ? '#F59E0B' : '#EF4444';
  const c = useMemo(() => ({
    bg:          isDark ? '#141416' : '#FFFFFF',
    headerBg:    isDark ? '#1C1C1E' : '#F9F6FF',
    border:      isDark ? '#2C2C2E' : '#EDE9F6',
    text:        isDark ? '#F5F5F5' : '#1A1A1A',
    subtext:     isDark ? '#8E8E93' : '#6B7280',
    accent:      isDark ? '#A78BFA' : '#7C3AED',
    accentSoft:  isDark ? '#2D1B69' : '#EDE9FE',
    bond:        '#EC4899',
    bondTrack:   isDark ? '#3B1F2B' : '#FCE7F3',
    energyColor,
    energyTrack: isDark ? '#1F2937' : '#F3F4F6',
    danger:      '#EF4444',
    sectionHdr:  isDark ? '#48484A' : '#9CA3AF',
    divider:     isDark ? '#2C2C2E' : '#F3F4F6',
    upgradeBg:   isDark ? '#2D1B69' : '#F5F3FF',
    upgradeBorder:isDark ? '#5B21B6' : '#C4B5FD',
  }), [isDark, energyColor]);

  const phaseLabels: Record<string, string> = {
    introduction:  t('تعارف',    'Introduction'),
    trust_building:t('بناء ثقة', 'Building Trust'),
    deepening:     t('تعمق',     'Deepening'),
    growth:        t('نمو',      'Growth'),
    mature:        t('نضج',      'Mature'),
  };

  const IconBatteryFull = Icon(BatteryFull, 'F');
  const IconBatteryMedium = Icon(BatteryMedium, 'M');
  const IconBatteryLow = Icon(BatteryLow, 'L');

  const EnergyIcon = useMemo(() => {
    if (energy >= 70) return <IconBatteryFull size={14} stroke={c.energyColor} />;
    if (energy >= 30) return <IconBatteryMedium size={14} stroke={c.energyColor} />;
    return <IconBatteryLow size={14} stroke={c.energyColor} />;
  }, [energy, c.energyColor]);

  const toggleSection = useCallback((key: keyof typeof expandedSections) => {
    hapticLight();
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const navigate = useCallback((route: string) => {
    hapticLight();
    router.push(route as any);
    onClose();
  }, [onClose]);

  const startNewMind = useCallback(() => {
    hapticMedium();
    clearHistory();
    onClose();
    router.push('/chat' as any);
  }, [clearHistory, onClose]);

  const handleLogout = useCallback(() => {
    hapticWarning();
    Alert.alert(
      t('تسجيل الخروج', 'Log Out'),
      t('هل تريد تسجيل الخروج؟', 'Are you sure you want to log out?'),
      [
        { text: t('إلغاء', 'Cancel'), style: 'cancel' },
        {
          text: t('خروج', 'Log Out'),
          style: 'destructive',
          onPress: async () => {
            try { await removeToken(); } catch {}
            storeLogout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  }, [t, storeLogout]);

  const IconHome = Icon(Home, 'H');
  const IconMessageCircle = Icon(MessageCircle, 'M');
  const IconBookOpen = Icon(BookOpen, 'B');
  const IconFolderOpen = Icon(FolderOpen, 'F');
  const IconBrain = Icon(Brain, 'B');
  const IconHeart = Icon(Heart, 'H');
  const IconZap = Icon(Zap, 'Z');
  const IconGraduationCap = Icon(GraduationCap, 'G');
  const IconCode2 = Icon(Code2, 'C');
  const IconTrendingUp = Icon(TrendingUp, 'T');
  const IconImage = Icon(Image, 'I');
  const IconMoon = Icon(Moon, 'M');
  const IconPenLine = Icon(PenLine, 'P');
  const IconCheckSquare = Icon(CheckSquare, 'C');
  const IconUser = Icon(User, 'U');
  const IconPalette = Icon(Palette, 'P');
  const IconDiamond = Icon(Diamond, 'D');
  const IconGift = Icon(Gift, 'G');
  const IconSettings = Icon(Settings, 'S');
  const IconCrown = Icon(Crown, 'C');
  const IconX = Icon(X, 'X');
const IconLogOut = Icon(LogOut, 'L');
  const IconEye = Icon(Eye, 'E');
  const IconBell = Icon(Bell, 'B');
  const IconSparkles = Icon(Sparkles, 'S');
  const IconChevronRight = Icon(ChevronRight, '>');

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={[styles.topRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => { hapticLight(); onClose(); }}
            style={[styles.closeBtn, { backgroundColor: c.accentSoft }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconX size={20} stroke={c.accent} />
          </TouchableOpacity>
          <Text style={[styles.appName, { color: c.accent }]}>My Twin</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: c.headerBg, borderColor: c.border }]}>
          <AvatarRing accent={c.accent} accentSoft={c.accentSoft} />
          <Text style={[styles.twinName, { color: c.text }]}>
            {twinName || t('توأمك', 'Your Twin')}
          </Text>

          <View style={[styles.tierBadge, { backgroundColor: tierCfg.bg, borderColor: tierCfg.color + '40' }]}>
            <tierCfg.icon size={12} stroke={tierCfg.color} />
            <Text style={[styles.tierText, { color: tierCfg.color }]}>
              {isAr ? tierCfg.ar : tierCfg.en}
            </Text>
          </View>

          {awarenessScore?.score != null && (
            <View style={[styles.awarenessMini, { backgroundColor: c.accentSoft, borderColor: c.accent + '30' }]}>
              <IconEye size={13} stroke={c.accent} />
              <Text style={[styles.awarenessMiniText, { color: c.accent }]}>
                {t('فهم التوأم', 'Twin Understanding')}: {awarenessScore.score}%
              </Text>
            </View>
          )}

          {notifFreq?.remaining != null && (
            <View style={[styles.notifMini, { borderColor: c.border }]}>
              <IconBell size={12} stroke={c.subtext} />
              <Text style={[styles.notifMiniText, { color: c.subtext }]}>
                {t('إشعارات متبقية', 'Notifs left')}: {notifFreq.remaining}/{notifFreq.daily_limit}
              </Text>
            </View>
          )}

          <View style={[styles.statsRow, { borderColor: c.border }]}>
            <View style={styles.statItem}>
              <View style={[styles.statLabelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <IconHeart size={12} stroke={c.bond} />
                <Text style={[styles.statLabel, { color: c.subtext }]}>{t('رابطة', 'Bond')}</Text>
                <Text style={[styles.statValue, { color: c.bond }]}>{Math.round(bond)}%</Text>
              </View>
              <AnimBar value={bond} color={c.bond} trackColor={c.bondTrack} />
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.border }]} />
            <View style={styles.statItem}>
              <View style={[styles.statLabelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                {EnergyIcon}
                <Text style={[styles.statLabel, { color: c.subtext }]}>{t('طاقة', 'Energy')}</Text>
                <Text style={[styles.statValue, { color: c.energyColor }]}>{Math.round(energy)}%</Text>
              </View>
              <AnimBar value={energy} color={c.energyColor} trackColor={c.energyTrack} />
            </View>
          </View>

          {journeyPhase && (
            <View style={[styles.journeyMini, { borderColor: c.border }]}>
              <IconTrendingUp size={12} stroke={c.subtext} />
              <Text style={[styles.journeyMiniText, { color: c.subtext }]}>
                {t('المرحلة', 'Phase')}: {phaseLabels[journeyPhase] || journeyPhase}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.chatBtn, { backgroundColor: c.accentSoft, borderColor: c.accent + '40' }]}
          onPress={() => navigate('/chat')}
          activeOpacity={0.8}
        >
          <IconZap size={16} stroke={c.accent} />
          <Text style={[styles.chatBtnText, { color: c.accent }]}>{t('العودة للوعي', 'Back to Mind')}</Text>
          <IconChevronRight size={16} stroke={c.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.newChatBtn, { borderColor: c.accent + '40' }]}
          onPress={startNewMind}
          activeOpacity={0.8}
        >
          <IconSparkles size={16} stroke={c.accent} />
          <Text style={[styles.newChatBtnText, { color: c.accent }]}>{t('وعي جديد', 'New Mind')}</Text>
        </TouchableOpacity>

        <SectionHeader
          label={t('🧠 الوعي', '🧠 Mind')}
          expanded={expandedSections.essentials}
          onPress={() => toggleSection('essentials')}
          c={c}
        />
        {expandedSections.essentials && (
          <View style={styles.sectionContent}>
            <MenuItem icon={IconHome}          label={t('مركز الوعي',    'Mind Center')}    route="/twin-mind"    c={c} navigate={navigate} />
            <MenuItem icon={IconMessageCircle} label={t('وعي التوأم',    'Twin Mind')}       route="/chat"         c={c} navigate={navigate} />
            <MenuItem icon={IconBookOpen}      label={t('قصصنا معاً',    'Our Stories')}     route="/stories"      c={c} navigate={navigate} />
            <MenuItem icon={IconFolderOpen}    label={t('مشاريع الوعي',  'Mind Projects')}   route="/history"      c={c} navigate={navigate} />
            <MenuItem icon={IconBrain}         label={t('معرض الذكريات', 'Memory Gallery')}  route="/memories"     c={c} navigate={navigate} />
            <MenuItem icon={IconHeart}         label={t('حديقة الرابطة', 'Bond Garden')}     route="/relationship" c={c} navigate={navigate} />
          </View>
        )}

        <SectionHeader
          label={t('🚀 قدرات التوأم', '🚀 Twin Powers')}
          expanded={expandedSections.powers}
          onPress={() => toggleSection('powers')}
          c={c}
        />
        {expandedSections.powers && (
          <View style={styles.sectionContent}>
            <MenuItem icon={IconZap}          label={t('عالم القدرات',    'Power Universe')}      route="/features/index"              c={c} navigate={navigate} />
            <MenuItem icon={IconGraduationCap}label={t('المذاكرة الذكية', 'Smart Study')}          route="/features/study-mode"         c={c} navigate={navigate} />
            <MenuItem icon={IconCode2}        label={t('مختبر البرمجة',   'Code Lab')}             route="/features/code-lab"           c={c} navigate={navigate} />
            <MenuItem icon={IconTrendingUp}   label={t('تحليل الأعمال',   'Business Analyzer')}    route="/features/business-analyzer"  c={c} navigate={navigate} />
            <MenuItem icon={IconHeart}        label={t('مدرب الحياة',     'Life Coach')}           route="/features/life-coach"         c={c} navigate={navigate} />
            <MenuItem icon={IconImage}        label={t('إنشاء الصور',     'Image Creator')}        route="/features/image-creator"      c={c} navigate={navigate} />
            <MenuItem icon={IconMoon}         label={t('تفسير الأحلام',   'Dream Journal')}        route="/features/dreams"             c={c} navigate={navigate} />
            <MenuItem icon={IconPenLine}      label={t('كتابة المحتوى',   'Content Creator')}      route="/features/content-creator"    c={c} navigate={navigate} />
            <MenuItem icon={IconCheckSquare}  label={t('المساعد الشخصي',  'P.A.S.S.')}            route="/features/task-manager"       c={c} navigate={navigate} />
          </View>
        )}

        <SectionHeader
          label={t('👤 الحساب', '👤 Account')}
          expanded={expandedSections.account}
          onPress={() => toggleSection('account')}
          c={c}
        />
        {expandedSections.account && (
          <View style={styles.sectionContent}>
            <MenuItem icon={IconUser}    label={t('حسابي',        'My Profile')}          route="/profile"      c={c} navigate={navigate} />
            <MenuItem icon={IconPalette} label={t('متحف توأمك',   'Twin Museum')}         route="/museum"       c={c} navigate={navigate} />
            <MenuItem icon={IconDiamond} label={t('باقات الوعي',  'Consciousness Plans')} route="/subscription" c={c} navigate={navigate} />
            <MenuItem icon={IconGift}    label={t('دعوة الأصدقاء','Refer Friends')}       route="/referral"     c={c} navigate={navigate} />
          </View>
        )}

        <MenuItem
          icon={IconSettings}
          label={t('الإعدادات', 'Settings')}
          route="/settings"
          c={c}
          navigate={navigate}
        />

        {isFree && (
          <TouchableOpacity
            style={[styles.upgradeBanner, { backgroundColor: c.upgradeBg, borderColor: c.upgradeBorder }]}
            onPress={() => navigate('/subscription')}
            activeOpacity={0.85}
          >
            <View style={[styles.upgradeIconWrap, { backgroundColor: c.accent + '20' }]}>
              <IconCrown size={22} stroke={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: c.accent }]}>
                {t('ارتقِ لـ Premium', 'Upgrade to Premium')}
              </Text>
              <Text style={[styles.upgradeSub, { color: c.subtext }]}>
                {t('وعي أعمق، ذاكرة أطول', 'Deeper mind, longer memory')}
              </Text>
            </View>
            <IconChevronRight size={18} stroke={c.accent} />
          </TouchableOpacity>
        )}

        <View style={[styles.divider, { backgroundColor: c.divider }]} />

        <TouchableOpacity
          style={[styles.logoutBtn, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.logoutIconWrap, { backgroundColor: c.danger + '12' }]}>
            <IconLogOut size={18} stroke={c.danger} />
          </View>
          <Text style={[styles.logoutText, { color: c.danger, textAlign: isAr ? 'right' : 'left' }]}>
            {t('تسجيل الخروج', 'Log Out')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1 },
  scroll:           { paddingHorizontal: 16 },
  topRow:           { alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  closeBtn:         { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  appName:          { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  profileCard:      { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 14, alignItems: 'center' },
  twinName:         { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  tierBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  tierText:         { fontSize: 12, fontWeight: '700' },
  awarenessMini:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  awarenessMiniText:{ fontSize: 12, fontWeight: '600' },
  notifMini:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  notifMiniText:    { fontSize: 11, fontWeight: '500' },
  journeyMini:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginBottom: 8, marginTop: 4 },
  journeyMiniText:  { fontSize: 11, fontWeight: '500' },
  statsRow:         { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 12, width: '100%' },
  statItem:         { flex: 1, gap: 6 },
  statDivider:      { width: 1, borderRadius: 1 },
  statLabelRow:     { alignItems: 'center', gap: 4 },
  statLabel:        { fontSize: 11, fontWeight: '600', flex: 1 },
  statValue:        { fontSize: 12, fontWeight: '800' },
  chatBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  chatBtnText:      { fontSize: 14, fontWeight: '700', flex: 1 },
  newChatBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 16 },
  newChatBtnText:   { fontSize: 14, fontWeight: '600' },
  sectionContent:   { marginBottom: 4, paddingLeft: 4 },
  divider:          { height: 1, marginVertical: 16 },
  upgradeBanner:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, marginTop: 8 },
  upgradeIconWrap:  { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  upgradeTitle:     { fontSize: 14, fontWeight: '700' },
  upgradeSub:       { fontSize: 11, marginTop: 2 },
  logoutBtn:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  logoutIconWrap:   { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoutText:       { fontSize: 15, fontWeight: '500' },
});
