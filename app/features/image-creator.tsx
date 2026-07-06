import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated, RefreshControl,
  Image, Dimensions, Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost, apiGet } from '../../lib/httpClient';
import {
  ArrowLeft, Sparkles, ImageIcon, Download, RefreshCw,
  Wand2, Layers, X, Check, Save, MessageSquare, Zap,
  Maximize, Monitor, Smartphone, Square, RectangleVertical,
  Camera, Palette, Cloud, Moon, Sun, Flower, Building,
  Heart, Copy, Lightbulb, Eye, TrendingUp, Star,
  ChevronRight, Play, Plus, Target, Compass, Activity,
} from 'lucide-react-native';
import * as ClipboardModule from 'expo-clipboard';

const { width: SCREEN_W } = Dimensions.get('window');

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch(e) {}
const hapticLight = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch(e) {} };
const hapticMedium = () => { try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch(e) {} };

// ── النصوص ───────────────────────────────────────────
const T = {
  ar: {
    title: 'استوديو الصور',
    greeting: 'ماذا تريد أن تصنع اليوم؟',
    dashboard: 'لوحة الإبداع',
    recentImages: 'آخر إبداعاتك',
    quickCreate: 'إنشاء سريع',
    promptPlaceholder: 'اكتب وصفاً تفصيلياً للصورة...',
    enhancePrompt: '🪄 حسّن الوصف',
    generate: '⚡ توليد الصورة',
    result: 'النتيجة',
    save: 'حفظ',
    copy: 'نسخ',
    copied: 'تم النسخ',
    discuss: '💬 ناقش مع توأمك',
    retry: 'إعادة',
    loading: 'جاري رسم الصورة...',
    suggestions: 'اقتراحات التوأم',
    criticScore: 'تقييم الجودة',
    history: 'سجل الإبداع',
    noHistory: 'لا توجد صور سابقة',
    startCreating: 'ابدأ بكتابة وصف لصورتك',
  },
  en: {
    title: 'Image Studio',
    greeting: 'What do you want to create today?',
    dashboard: 'Creative Dashboard',
    recentImages: 'Your Recent Creations',
    quickCreate: 'Quick Create',
    promptPlaceholder: 'Write a detailed description...',
    enhancePrompt: '🪄 Enhance Prompt',
    generate: '⚡ Generate Image',
    result: 'Result',
    save: 'Save',
    copy: 'Copy',
    copied: 'Copied',
    discuss: '💬 Discuss with Twin',
    retry: 'Retry',
    loading: 'Creating your image...',
    suggestions: 'Twin Suggestions',
    criticScore: 'Quality Score',
    history: 'Creative History',
    noHistory: 'No images yet',
    startCreating: 'Start by describing your image',
  },
};

// ── أنماط فنية موسعة ─────────────────────────────────
const STYLES = [
  { id: 'realistic', label_ar: 'واقعي', label_en: 'Realistic', icon: Camera, color: '#10B981' },
  { id: 'anime', label_ar: 'أنمي', label_en: 'Anime', icon: Heart, color: '#EC4899' },
  { id: 'digital_art', label_ar: 'فن رقمي', label_en: 'Digital Art', icon: Monitor, color: '#3B82F6' },
  { id: 'oil_painting', label_ar: 'لوحة زيتية', label_en: 'Oil Painting', icon: Palette, color: '#F59E0B' },
  { id: 'cinematic', label_ar: 'سينمائي', label_en: 'Cinematic', icon: Play, color: '#8B5CF6' },
  { id: 'cyberpunk', label_ar: 'سايبربانك', label_en: 'Cyberpunk', icon: Zap, color: '#06B6D4' },
  { id: 'fantasy', label_ar: 'فانتازيا', label_en: 'Fantasy', icon: Cloud, color: '#6366F1' },
  { id: 'noir', label_ar: 'نوار', label_en: 'Noir', icon: Moon, color: '#6B7280' },
  { id: 'watercolor', label_ar: 'ألوان مائية', label_en: 'Watercolor', icon: Flower, color: '#14B8A6' },
  { id: 'pixel_art', label_ar: 'بكسل آرت', label_en: 'Pixel Art', icon: Layers, color: '#EF4444' },
  { id: 'portrait', label_ar: 'بورتريه', label_en: 'Portrait', icon: Camera, color: '#D946EF' },
  { id: 'logo', label_ar: 'شعار', label_en: 'Logo', icon: Star, color: '#F97316' },
  { id: 'product', label_ar: 'منتج', label_en: 'Product', icon: Target, color: '#0EA5E9' },
];

export default function CreativeImageStudio() {
  const insets = useSafeAreaInsets();
  const { lang, userId, twinName, hasHydrated } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [screen, setScreen] = useState<'dashboard' | 'create'>('dashboard');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [recentImages, setRecentImages] = useState<any[]>([]);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const colors = useMemo(() => ({
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#8B5CF6',
    accentLight: '#8B5CF620',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }), [isDark]);

  const currentStyle = STYLES.find(s => s.id === selectedStyle) || STYLES[0];

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiGet(`/api/image-lab/dashboard/${userId}?lang=${lang}`);
      setRecentImages(res?.recent_generations || []);
    } catch (e) {}
  }, [userId, lang]);

  useEffect(() => {
    if (!hasHydrated) return;
    fetchDashboard();
  }, [hasHydrated]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await apiPost('/api/image-lab/enhance-prompt', { user_id: userId, prompt: prompt.trim(), language: lang });
      if (res?.enhanced) setPrompt(res.enhanced);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setCurrentImage(null);
    setCurrentResult(null);
    try {
      const result = await apiPost('/api/image-lab/generate', {
        user_id: userId, prompt: prompt.trim(), style: selectedStyle, language: lang,
      });
      if (result?.image_url) {
        setCurrentImage(result.image_url);
        setCurrentResult(result);
        if (result.suggestions) setSuggestions(result.suggestions);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
        fetchDashboard();
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCopy = async () => {
    if (!currentImage) return;
    await ClipboardModule.setStringAsync(currentImage);
  };

  const handleDiscuss = useCallback(() => {
    const store = useTwinStore.getState();
    store.loadProjectContext({
      type: 'content',
      title: prompt.trim().substring(0, 50),
      preview: `[صورة] ${prompt.trim().substring(0, 100)}`,
      data: { prompt: prompt.trim(), style: selectedStyle, image_url: currentImage },
    });
    router.push('/chat');
  }, [prompt, selectedStyle, currentImage]);

  if (!hasHydrated) {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.subtext, marginTop: 12 }}>جاري تحميل استوديو الصور...</Text>
      </View>
    );
  }

  // شاشة Dashboard الرئيسية
  if (screen === 'dashboard') {
    return (
      <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <View style={[st.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
          <TouchableOpacity onPress={fetchDashboard}><RefreshCw size={20} stroke={colors.subtext} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={[st.greeting, { color: colors.text }]}>{t.greeting}</Text>
          
          {/* بطاقة الإنشاء السريع */}
          <TouchableOpacity style={[st.quickCreateCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]} onPress={() => { setScreen('create'); hapticMedium(); }}>
            <Sparkles size={32} stroke={colors.accent} />
            <Text style={[st.quickCreateText, { color: colors.accent }]}>{t.quickCreate}</Text>
            <ChevronRight size={20} stroke={colors.accent} />
          </TouchableOpacity>

          {/* آخر الإبداعات */}
          <Text style={[st.sectionTitle, { color: colors.text }]}>{t.recentImages}</Text>
          {recentImages.length > 0 ? (
            <View style={st.recentGrid}>
              {recentImages.slice(0, 6).map((item: any, i: number) => (
                <View key={i} style={[st.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[st.recentPlaceholder, { backgroundColor: colors.accentLight }]}>
                    <ImageIcon size={24} stroke={colors.accent} />
                  </View>
                  <Text style={[st.recentPrompt, { color: colors.subtext }]} numberOfLines={1}>{item.prompt || item.title || ''}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[st.emptyText, { color: colors.subtext }]}>{t.noHistory}</Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // شاشة الإنشاء
  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { setScreen('dashboard'); setCurrentImage(null); }}><ArrowLeft size={24} stroke={colors.text} /></TouchableOpacity>
        <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* بطاقة الإدخال */}
        <View style={[st.createCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[st.createIconWrap, { backgroundColor: colors.accentLight }]}>
            <Sparkles size={40} stroke={colors.accent} />
          </View>

          {/* حقل الوصف */}
          <TextInput
            style={[st.promptInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.promptPlaceholder}
            placeholderTextColor={colors.subtext}
            value={prompt}
            onChangeText={setPrompt}
            multiline numberOfLines={5}
            textAlignVertical="top"
          />

          {/* زر تحسين الوصف */}
          {prompt.trim().length > 10 && (
            <TouchableOpacity style={[st.enhanceBtn, { backgroundColor: colors.accentLight }]} onPress={handleEnhance} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color={colors.accent} /> : (
                <><Wand2 size={16} stroke={colors.accent} /><Text style={[st.enhanceBtnText, { color: colors.accent }]}>{t.enhancePrompt}</Text></>
              )}
            </TouchableOpacity>
          )}

          {/* اختيار النمط */}
          <Text style={[st.label, { color: colors.subtext, marginTop: 12, marginBottom: 8 }]}>النمط الفني</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.styleScroll}>
            {STYLES.map(style => {
              const Icon = style.icon;
              const selected = selectedStyle === style.id;
              return (
                <TouchableOpacity
                  key={style.id}
                  style={[st.styleChip, { borderColor: selected ? style.color : colors.border, backgroundColor: selected ? style.color + '15' : 'transparent' }]}
                  onPress={() => { setSelectedStyle(style.id); hapticLight(); }}
                >
                  <Icon size={16} stroke={style.color} />
                  <Text style={[st.styleChipText, { color: selected ? style.color : colors.subtext }]}>{isAr ? style.label_ar : style.label_en}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* زر التوليد */}
          <TouchableOpacity
            style={[st.submitBtn, { backgroundColor: colors.accent, opacity: prompt.trim() && !loading ? 1 : 0.6 }]}
            onPress={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Sparkles size={20} stroke="#FFF" /><Text style={st.submitBtnText}>{t.generate}</Text></>
            )}
          </TouchableOpacity>
        </View>

        {/* النتيجة */}
        {currentImage && (
          <Animated.View style={[st.resultCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Image source={{ uri: currentImage }} style={st.resultImage} resizeMode="cover" />

            {/* تقييم الجودة */}
            {currentResult?.evaluation?.score && (
              <View style={[st.criticBar, { backgroundColor: colors.accentLight }]}>
                <Star size={16} stroke={colors.warning} />
                <Text style={[st.criticText, { color: colors.warning }]}>{t.criticScore}: {currentResult.evaluation.score}/100</Text>
              </View>
            )}

            {/* شريط الأدوات */}
            <View style={st.toolbar}>
              <TouchableOpacity onPress={handleCopy} style={st.toolbarBtn}><Copy size={18} stroke={colors.subtext} /><Text style={[st.toolbarBtnText, { color: colors.subtext }]}>{t.copy}</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleGenerate} style={st.toolbarBtn}><RefreshCw size={18} stroke={colors.subtext} /><Text style={[st.toolbarBtnText, { color: colors.subtext }]}>{t.retry}</Text></TouchableOpacity>
            </View>

            {/* اقتراحات التوأم */}
            {suggestions.length > 0 && (
              <View style={[st.suggestionsCard, { backgroundColor: colors.accentLight }]}>
                <Lightbulb size={16} stroke={colors.accent} />
                <Text style={[st.suggestionsTitle, { color: colors.accent }]}>{t.suggestions}</Text>
                {suggestions.map((s, i) => (
                  <Text key={i} style={[st.suggestionItem, { color: colors.accent }]}>• {s}</Text>
                ))}
              </View>
            )}

            {/* زر المناقشة */}
            <TouchableOpacity style={st.discussBtn} onPress={handleDiscuss}>
              <MessageSquare size={16} stroke="#7C3AED" />
              <Text style={st.discussBtnText}>{t.discuss}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  greeting: { fontSize: 22, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 16 },

  // Dashboard
  quickCreateCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', marginBottom: 24 },
  quickCreateText: { flex: 1, fontSize: 18, fontWeight: '800' },
  recentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  recentCard: { width: (SCREEN_W - 48) / 3, borderRadius: 14, borderWidth: 1, padding: 8, alignItems: 'center', gap: 6 },
  recentPlaceholder: { width: '100%', aspectRatio: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recentPrompt: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },

  // Create
  createCard: { borderRadius: 24, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  createIconWrap: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', alignSelf: 'flex-start' },
  promptInput: { width: '100%', borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, minHeight: 120, marginBottom: 12, textAlignVertical: 'top' },
  enhanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, alignSelf: 'flex-end', marginBottom: 8 },
  enhanceBtnText: { fontSize: 13, fontWeight: '600' },
  styleScroll: { maxHeight: 50, marginBottom: 20 },
  styleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  styleChipText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, width: '100%', gap: 8 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  // Result
  resultCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  resultImage: { width: '100%', height: SCREEN_W - 32, borderRadius: 0 },
  criticBar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginHorizontal: 12, marginTop: 10, borderRadius: 12 },
  criticText: { fontSize: 14, fontWeight: '700' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(128,128,128,0.15)' },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  toolbarBtnText: { fontSize: 12, fontWeight: '600' },

  // Suggestions
  suggestionsCard: { padding: 14, marginHorizontal: 12, marginBottom: 12, borderRadius: 14 },
  suggestionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  suggestionItem: { fontSize: 12, marginBottom: 3, lineHeight: 18 },

  // Discuss
  discussBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginHorizontal: 12, marginBottom: 12, backgroundColor: '#7C3AED15' },
  discussBtnText: { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
});
