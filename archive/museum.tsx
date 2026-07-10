import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Image, TextInput, Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore, TwinStyle, TwinGender, ReplyStyle } from '../store/useTwinStore';
import { useAppTheme } from '../engine/colors';
import { router } from 'expo-router';
import { apiGet } from '../lib/httpClient';
import { voiceEngine.getConfig } from '../../engine/voice/VoiceEngine';
import {
  ArrowLeft, Heart, Brain, Zap, Sparkles, TrendingUp,
  Fingerprint, User, Activity, Star, Crown,
  Palette, Save, Smile, RotateCcw, Volume2, Mic,
  Wand2, CheckCircle2, Edit3, MessageCircle,
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');

const T = {
  ar: {
    museumTitle: 'متحف توأمك', customizeTitle: 'تخصيص توأمك',
    loading: 'جاري تحميل متحفك...', fingerprint: 'البصمة الرقمية',
    notGenerated: 'لم تُولّد بعد', journeyStats: 'إحصائيات الرحلة',
    bond: 'الرابطة', energy: 'الطاقة', phase: 'المرحلة', traits: 'سمات',
    consciousness: 'رحلة وعيك', consciousnessMsg: 'كل محادثة مع توأمك تكشف طبقة جديدة من شخصيتك...',
    twinName: 'اسم التوأم', enterName: 'أدخل الاسم',
    genderVoice: 'الجنس والصوت', female: 'أنثى', male: 'ذكر',
    voicePersonality: 'شخصية الصوت', replyLength: 'طول الرد',
    short: 'مختصر', medium: 'متوسط', long: 'مفصل',
    personality: 'نمط الشخصية', maxTraits: '5 صفات كحد أقصى',
    saveChanges: 'حفظ التغييرات', saved: 'تم حفظ التغييرات',
    reset: 'استعادة الافتراضي', resetTitle: 'إعادة التعيين',
    resetMsg: 'هل تريد استعادة الإعدادات الافتراضية؟',
    cancel: 'إلغاء', confirmReset: 'تعيين',
    enterNameError: 'الرجاء إدخال اسم', mood: 'مزاج التوأم',
    relationship: 'العلاقة', voiceEngine.getConfig: 'جرب الصوت',
    voicePreviewText: 'مرحباً، أنا توأمك الرقمي. سأكون معك في كل خطوة.',
    twinAvatar: 'صورة التوأم',
    phaseLabels: { introduction: 'تعارف', trust_building: 'بناء ثقة', deepening: 'تعمق', growth: 'نمو', mature: 'نضج' } as Record<string, string>,
    emotionLabels: { joy: 'فرح', sadness: 'حزن', anger: 'غضب', fear: 'قلق', love: 'حب', neutral: 'حياد' } as Record<string, string>,
    voiceLabels: { friend: 'صديق', mentor: 'مرشد', romantic: 'رومانسي', energetic: 'حيوي', calm: 'هادئ', genz: 'عصري' } as Record<string, string>,
    styleLabels: { supportive: 'داعم', coach: 'مدرب', wise: 'حكيم', fun: 'مرح', calm: 'هادئ' } as Record<string, string>,
    traitNames: { 'حنون': 'حنون', 'متفائل': 'متفائل', 'ذكي': 'ذكي', 'مخلص': 'مخلص', 'صبور': 'صبور', 'قوي': 'قوي', 'حساس': 'حساس', 'مغامر': 'مغامر', 'عملي': 'عملي', 'خجول': 'خجول' } as Record<string, string>,
  },
  en: {
    museumTitle: 'Twin Museum', customizeTitle: 'Customize Twin',
    loading: 'Loading your museum...', fingerprint: 'Digital Fingerprint',
    notGenerated: 'Not generated yet', journeyStats: 'Journey Stats',
    bond: 'Bond', energy: 'Energy', phase: 'Phase', traits: 'Traits',
    consciousness: 'Your Consciousness Journey', consciousnessMsg: 'Every conversation with your Twin reveals a new layer...',
    twinName: 'Twin Name', enterName: 'Enter name',
    genderVoice: 'Gender & Voice', female: 'Female', male: 'Male',
    voicePersonality: 'Voice Personality', replyLength: 'Reply Length',
    short: 'Short', medium: 'Medium', long: 'Long',
    personality: 'Personality Style', maxTraits: 'Max 5 traits',
    saveChanges: 'Save Changes', saved: 'Changes saved',
    reset: 'Reset', resetTitle: 'Reset',
    resetMsg: 'Reset to default settings?', cancel: 'Cancel',
    confirmReset: 'Reset', enterNameError: 'Please enter a name',
    mood: 'Twin Mood', relationship: 'Relationship',
    voiceEngine.getConfig: 'Preview Voice',
    voicePreviewText: 'Hello, I am your digital twin. I will be with you every step.',
    twinAvatar: 'Twin Avatar',
    phaseLabels: { introduction: 'Intro', trust_building: 'Trust', deepening: 'Deepening', growth: 'Growth', mature: 'Mature' } as Record<string, string>,
    emotionLabels: { joy: 'Joy', sadness: 'Sadness', anger: 'Anger', fear: 'Fear', love: 'Love', neutral: 'Neutral' } as Record<string, string>,
    voiceLabels: { friend: 'Friend', mentor: 'Mentor', romantic: 'Romantic', energetic: 'Energetic', calm: 'Calm', genz: 'Gen Z' } as Record<string, string>,
    styleLabels: { supportive: 'Supportive', coach: 'Coach', wise: 'Wise', fun: 'Fun', calm: 'Calm' } as Record<string, string>,
    traitNames: { 'حنون': 'Affectionate', 'متفائل': 'Optimistic', 'ذكي': 'Intelligent', 'مخلص': 'Loyal', 'صبور': 'Patient', 'قوي': 'Strong', 'حساس': 'Sensitive', 'مغامر': 'Adventurous', 'عملي': 'Practical', 'خجول': 'Shy' } as Record<string, string>,
  },
};

const VOICE_PERSONALITIES = ['friend', 'mentor', 'romantic', 'energetic', 'calm', 'genz'];
const STYLES_LIST: TwinStyle[] = ['supportive', 'coach', 'wise', 'fun', 'calm'];
const REPLY_LENGTHS: ReplyStyle[] = ['short', 'medium', 'long'];
const GENDERS: TwinGender[] = ['female', 'male'];

const TRAITS_OPTIONS = [
  { ar: 'حنون', en: 'Affectionate', icon: Heart, color: '#EC4899' },
  { ar: 'متفائل', en: 'Optimistic', icon: Sparkles, color: '#F59E0B' },
  { ar: 'ذكي', en: 'Intelligent', icon: Wand2, color: '#3B82F6' },
  { ar: 'مخلص', en: 'Loyal', icon: Star, color: '#8B5CF6' },
  { ar: 'صبور', en: 'Patient', icon: Smile, color: '#10B981' },
  { ar: 'قوي', en: 'Strong', icon: User, color: '#EF4444' },
  { ar: 'حساس', en: 'Sensitive', icon: Heart, color: '#6366F1' },
  { ar: 'مغامر', en: 'Adventurous', icon: Star, color: '#F97316' },
  { ar: 'عملي', en: 'Practical', icon: CheckCircle2, color: '#14B8A6' },
  { ar: 'خجول', en: 'Shy', icon: Smile, color: '#A855F7' },
];

export default function TwinMuseum() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, bondLevel, twinEnergy, journeyPhase,
    twinGender, twinStyle, replyStyle, twinTraits,
    setTwinName, setTwinGender, setTwinStyle, setReplyStyle, setTwinTraits,
    voiceEnabled, setVoiceEnabled, voicePersonality, lang,
    setVoicePersonality,
  } = useTwinStore();
  const theme = useAppTheme();
  const isAr = lang === 'ar';
  const isDark = theme.isDark;
  const t = T[lang] || T['ar'];

  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState<any>(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [twinState, setTwinState] = useState<any>(null);
  const [economy, setEconomy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'museum' | 'customize'>('museum');
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const [name, setName] = useState(twinName || '');
  const [gender, setGender] = useState<TwinGender>(twinGender || 'female');
  const [style, setStyle] = useState<TwinStyle>(twinStyle || 'supportive');
  const [reply, setReply] = useState<ReplyStyle>(replyStyle || 'medium');
  const [selectedTraits, setSelectedTraits] = useState<string[]>(twinTraits || []);
  const [saved, setSaved] = useState(false);
  const [voicePersonalityState, setVoicePersonalityState] = useState(voicePersonality || 'friend');

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#7C6B99',
    accent: '#7C3AED',
    accentLight: '#7C3AED20',
    accentGlow: '#7C3AED30',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    gold: '#F59E0B',
    pink: '#EC4899',
    blue: '#3B82F6',
    green: '#10B981',
    success: '#10B981',
  }), [isDark]);

  useEffect(() => {
    setName(twinName || '');
    setGender(twinGender || 'female');
    setStyle(twinStyle || 'supportive');
    setReply(replyStyle || 'medium');
    setSelectedTraits(twinTraits || []);
    setVoicePersonalityState(voicePersonality || 'friend');
  }, []);

  const loadMuseumData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fp, av, ts, re] = await Promise.all([
        apiGet(`/api/fingerprint/get?user_id=${userId}`).catch(() => null),
        apiGet(`/api/avatar/get?user_id=${userId}`).catch(() => null),
        apiGet(`/api/twin/state?user_id=${userId}&lang=${lang}`).catch(() => null),
        apiGet(`/api/relationship/economy?user_id=${userId}`).catch(() => null),
      ]);
      if (!isMounted.current) return;
      setFingerprint(fp);
      setAvatar(av);
      if (ts) setTwinState(ts);
      if (re) setEconomy(re);
    } catch (e) {}
    finally {
      if (isMounted.current) {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      }
    }
  }, [userId, lang]);

  useEffect(() => {
    isMounted.current = true;
    loadMuseumData();
    return () => { isMounted.current = false; };
  }, [loadMuseumData]);

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert(isAr ? 'خطأ' : 'Error', t.enterNameError); return; }
    setTwinName(name.trim());
    setTwinGender(gender);
    setTwinStyle(style);
    setReplyStyle(reply);
    setTwinTraits(selectedTraits);
    setVoiceEnabled(true);
    setVoicePersonality(voicePersonalityState);
    setSaved(true);
    Alert.alert('✅', t.saved);
    setTimeout(() => setSaved(false), 3000);
  }, [name, gender, style, reply, selectedTraits, voicePersonalityState, isAr, t, setTwinName, setTwinGender, setTwinStyle, setReplyStyle, setTwinTraits, setVoiceEnabled, setVoicePersonality]);

  const handleReset = useCallback(() => {
    Alert.alert(t.resetTitle, t.resetMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirmReset, style: 'destructive',
        onPress: () => {
          setName(isAr ? 'توأمك' : 'My Twin');
          setGender('female');
          setStyle('supportive');
          setReply('medium');
          setSelectedTraits([]);
          setVoicePersonalityState('friend');
          setTwinName(isAr ? 'توأمك' : 'My Twin');
          setTwinGender('female');
          setTwinStyle('supportive');
          setReplyStyle('medium');
          setTwinTraits([]);
          setVoicePersonality('friend');
          setVoiceEnabled(true);
        }
      }
    ]);
  }, [isAr, t, setTwinName, setTwinGender, setTwinStyle, setReplyStyle, setTwinTraits, setVoicePersonality, setVoiceEnabled]);

  const handlePreviewVoice = useCallback(async () => {
    if (previewingVoice) return;
    setPreviewingVoice(true);
    try {
      await voiceEngine.getConfig(t.voicePreviewText, {
        gender: gender,
        lang: lang,
      });
    } catch (e) {
      Alert.alert(isAr ? 'تنبيه' : 'Notice', isAr ? 'تعذر تشغيل الصوت' : 'Could not play voice');
    } finally {
      setTimeout(() => setPreviewingVoice(false), 2000);
    }
  }, [previewingVoice, t, isAr, gender, lang]);

  const toggleTrait = useCallback((trait: string) => {
    setSelectedTraits(prev => {
      if (prev.includes(trait)) return prev.filter(t => t !== trait);
      if (prev.length >= 5) return prev;
      return [...prev, trait];
    });
  }, []);

  const phaseLabel = t.phaseLabels[journeyPhase] || journeyPhase;
  const emotionLabel = twinState?.emotion ? (t.emotionLabels[twinState.emotion] || twinState.emotion) : t.emotionLabels.neutral;

  if (loading) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[st.loadingText, { color: colors.subtext, marginTop: 12 }]}>{t.loading}</Text>
      </View>
    );
  }

  const renderMuseumTab = () => (
    <View>
      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={st.avatarRow}>
          <View style={[st.avatarRing, { borderColor: colors.accent }]}>
            {avatar?.image_url ? (
              <Image source={{ uri: avatar.image_url }} style={st.avatarImg} resizeMode="cover" />
            ) : (
              <View style={[st.avatarPlaceholder, { backgroundColor: colors.accentLight }]}>
                <Sparkles size={40} stroke={colors.accent} />
              </View>
            )}
          </View>
          <View style={st.avatarInfo}>
            <Text style={[st.twinNameDisplay, { color: colors.text }]}>{twinName || (isAr ? 'توأمك' : 'My Twin')}</Text>
            <View style={st.badgeRow}>
              <View style={[st.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[st.badgeText, { color: colors.accent }]}>{phaseLabel}</Text>
              </View>
              <View style={[st.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[st.badgeText, { color: colors.accent }]}>{gender === 'female' ? t.female : t.male}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={st.statsGrid}>
          <View style={[st.statBox, { backgroundColor: colors.inputBg }]}>
            <Heart size={18} stroke={colors.pink} />
            <Text style={[st.statValue, { color: colors.text }]}>{bondLevel}</Text>
            <Text style={[st.statLabel, { color: colors.subtext }]}>{t.bond}</Text>
          </View>
          <View style={[st.statBox, { backgroundColor: colors.inputBg }]}>
            <Zap size={18} stroke={colors.gold} />
            <Text style={[st.statValue, { color: colors.text }]}>{twinEnergy}</Text>
            <Text style={[st.statLabel, { color: colors.subtext }]}>{t.energy}</Text>
          </View>
          <View style={[st.statBox, { backgroundColor: colors.inputBg }]}>
            <Brain size={18} stroke={colors.blue} />
            <Text style={[st.statValue, { color: colors.text }]}>{emotionLabel}</Text>
            <Text style={[st.statLabel, { color: colors.subtext }]}>{t.mood}</Text>
          </View>
        </View>
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <Fingerprint size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.fingerprint}</Text>
        </View>
        {fingerprint?.traits?.length > 0 ? (
          <View style={st.traitsWrap}>
            {fingerprint.traits.map((trait: string, i: number) => (
              <View key={i} style={[st.traitChip, { backgroundColor: colors.accentLight, borderColor: colors.accent + '30' }]}>
                <Text style={[st.traitText, { color: colors.accent }]}>{trait}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[st.emptyText, { color: colors.subtext }]}>{t.notGenerated}</Text>
        )}
      </View>

      {economy && (
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
          <View style={st.sectionHeader}>
            <TrendingUp size={20} stroke={colors.accent} />
            <Text style={[st.sectionTitle, { color: colors.text }]}>{t.relationship}</Text>
          </View>
          <View style={st.economyRow}>
            <View style={st.economyItem}>
              <Text style={[st.economyValue, { color: colors.text }]}>{economy.trust_score ?? '--'}</Text>
              <Text style={[st.economyLabel, { color: colors.subtext }]}>Trust</Text>
            </View>
            <View style={st.economyItem}>
              <Text style={[st.economyValue, { color: colors.text }]}>{economy.intimacy_score ?? '--'}</Text>
              <Text style={[st.economyLabel, { color: colors.subtext }]}>Intimacy</Text>
            </View>
            <View style={st.economyItem}>
              <Text style={[st.economyValue, { color: colors.text }]}>{economy.respect_score ?? '--'}</Text>
              <Text style={[st.economyLabel, { color: colors.subtext }]}>Respect</Text>
            </View>
          </View>
        </View>
      )}

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12, marginBottom: 20 }]}>
        <View style={st.sectionHeader}>
          <Sparkles size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.consciousness}</Text>
        </View>
        <Text style={[st.consciousnessText, { color: colors.subtext }]}>{t.consciousnessMsg}</Text>
        <View style={st.journeyBar}>
          <View style={[st.journeyFill, { width: `${Math.min((bondLevel / 100) * 100, 100)}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={[st.journeyPercent, { color: colors.accent }]}>{Math.min(Math.round((bondLevel / 100) * 100), 100)}% {isAr ? 'اكتمال' : 'Complete'}</Text>
      </View>
    </View>
  );

  const renderCustomizeTab = () => (
    <View style={{ paddingBottom: 30 }}>
      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={st.sectionHeader}>
          <User size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.twinName}</Text>
        </View>
        <TextInput
          style={[st.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]}
          placeholder={t.enterName}
          placeholderTextColor={colors.subtext}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <Palette size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.genderVoice}</Text>
        </View>
        <View style={st.genderRow}>
          {GENDERS.map(g => (
            <TouchableOpacity
              key={g}
              activeOpacity={0.8}
              onPress={() => setGender(g)}
              style={[
                st.genderBtn,
                {
                  borderColor: gender === g ? colors.accent : colors.border,
                  backgroundColor: gender === g ? colors.accentLight : 'transparent',
                },
              ]}
            >
              <Text style={st.genderEmoji}>{g === 'female' ? '♀️' : '♂️'}</Text>
              <Text style={[st.genderText, { color: gender === g ? colors.accent : colors.subtext }]}>
                {g === 'female' ? t.female : t.male}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <Mic size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.voicePersonality}</Text>
        </View>
        <View style={st.voiceGrid}>
          {VOICE_PERSONALITIES.map(vp => (
            <TouchableOpacity
              key={vp}
              activeOpacity={0.8}
              onPress={() => setVoicePersonalityState(vp)}
              style={[
                st.voiceBtn,
                {
                  borderColor: voicePersonalityState === vp ? colors.accent : colors.border,
                  backgroundColor: voicePersonalityState === vp ? colors.accentLight : 'transparent',
                },
              ]}
            >
              <Text style={[st.voiceText, { color: voicePersonalityState === vp ? colors.accent : colors.subtext }]}>
                {(t.voiceLabels as any)[vp] || vp}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePreviewVoice}
          disabled={previewingVoice}
          style={[st.previewBtn, { backgroundColor: colors.accent, opacity: previewingVoice ? 0.6 : 1 }]}
        >
          {previewingVoice ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Volume2 size={18} stroke="#FFF" />
              <Text style={st.previewText}>{t.voiceEngine.getConfig}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <MessageCircle size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.replyLength}</Text>
        </View>
        <View style={st.lengthRow}>
          {REPLY_LENGTHS.map(len => (
            <TouchableOpacity
              key={len}
              activeOpacity={0.8}
              onPress={() => setReply(len)}
              style={[
                st.lengthBtn,
                {
                  borderColor: reply === len ? colors.accent : colors.border,
                  backgroundColor: reply === len ? colors.accentLight : 'transparent',
                },
              ]}
            >
              <Text style={[st.lengthText, { color: reply === len ? colors.accent : colors.subtext }]}>
                {(t as any)[len] || len}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <Crown size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.personality}</Text>
        </View>
        <View style={st.styleGrid}>
          {STYLES_LIST.map(s => (
            <TouchableOpacity
              key={s}
              activeOpacity={0.8}
              onPress={() => setStyle(s)}
              style={[
                st.styleBtn,
                {
                  borderColor: style === s ? colors.accent : colors.border,
                  backgroundColor: style === s ? colors.accentLight : 'transparent',
                },
              ]}
            >
              <Text style={[st.styleText, { color: style === s ? colors.accent : colors.subtext }]}>
                {(t.styleLabels as any)[s] || s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
        <View style={st.sectionHeader}>
          <Sparkles size={20} stroke={colors.accent} />
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.traits}</Text>
          <Text style={[st.maxTraits, { color: colors.subtext }]}>{selectedTraits.length}/5</Text>
        </View>
        <View style={st.traitsGrid}>
          {TRAITS_OPTIONS.map((trait, i) => {
            const Icon = trait.icon;
            const selected = selectedTraits.includes(trait.ar);
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => toggleTrait(trait.ar)}
                disabled={!selected && selectedTraits.length >= 5}
                style={[
                  st.traitBtn,
                  {
                    borderColor: selected ? trait.color : colors.border,
                    backgroundColor: selected ? trait.color + '15' : 'transparent',
                    opacity: !selected && selectedTraits.length >= 5 ? 0.4 : 1,
                  },
                ]}
              >
                <Icon size={16} stroke={selected ? trait.color : colors.subtext} />
                <Text style={[st.traitBtnText, { color: selected ? trait.color : colors.subtext }]}>
                  {isAr ? trait.ar : trait.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={st.actionRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleReset}
          style={[st.resetBtn, { borderColor: colors.border }]}
        >
          <RotateCcw size={18} stroke={colors.subtext} />
          <Text style={[st.resetText, { color: colors.subtext }]}>{t.reset}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          style={[st.saveBtn, { backgroundColor: colors.accent }]}
        >
          <Save size={18} stroke="#FFF" />
          <Text style={st.saveText}>{saved ? '✅ ' + t.saved : t.saveChanges}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>
          {activeTab === 'museum' ? t.museumTitle : t.customizeTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[st.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('museum')}
          style={[st.tab, activeTab === 'museum' && { borderBottomColor: colors.accent }]}
        >
          <Sparkles size={16} stroke={activeTab === 'museum' ? colors.accent : colors.subtext} />
          <Text style={[st.tabText, { color: activeTab === 'museum' ? colors.accent : colors.subtext }]}>{t.museumTitle}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('customize')}
          style={[st.tab, activeTab === 'customize' && { borderBottomColor: colors.accent }]}
        >
          <Palette size={16} stroke={activeTab === 'customize' ? colors.accent : colors.subtext} />
          <Text style={[st.tabText, { color: activeTab === 'customize' ? colors.accent : colors.subtext }]}>{t.customizeTitle}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'museum' ? renderMuseumTab() : renderCustomizeTab()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  loadingText: { fontSize: 15, fontWeight: '500' },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, padding: 3, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 70, height: 70, borderRadius: 35 },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  avatarInfo: { flex: 1 },
  twinNameDisplay: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  traitsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  traitChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  traitText: { fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 10 },
  economyRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 },
  economyItem: { alignItems: 'center', gap: 4 },
  economyValue: { fontSize: 20, fontWeight: '800' },
  economyLabel: { fontSize: 12, fontWeight: '600' },
  consciousnessText: { fontSize: 14, lineHeight: 22, marginBottom: 14 },
  journeyBar: { height: 8, borderRadius: 4, backgroundColor: '#7C3AED20', overflow: 'hidden', marginBottom: 8 },
  journeyFill: { height: '100%', borderRadius: 4 },
  journeyPercent: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  input: { borderRadius: 16, padding: 14, fontSize: 16, borderWidth: 1, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, padding: 16, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', gap: 8 },
  genderEmoji: { fontSize: 28 },
  genderText: { fontSize: 15, fontWeight: '700' },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  voiceBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  voiceText: { fontSize: 13, fontWeight: '600' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16 },
  previewText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  lengthRow: { flexDirection: 'row', gap: 10 },
  lengthBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  lengthText: { fontSize: 14, fontWeight: '600' },
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  styleText: { fontSize: 13, fontWeight: '600' },
  maxTraits: { fontSize: 13, fontWeight: '600' },
  traitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  traitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5 },
  traitBtnText: { fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  resetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18, borderWidth: 1.5 },
  resetText: { fontSize: 15, fontWeight: '700' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 18 },
  saveText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
