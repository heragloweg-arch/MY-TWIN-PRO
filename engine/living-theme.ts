/**
 * LIVING THEME ENGINE v1.0 – محرك الثيم الحي
 * ==============================================
 * يولد ثيم متكامل بناءً على حالة التوأم الحية.
 * 
 * يقرأ من TwinState: consciousnessMode, emotion, energy, awarenessLevel, presenceLevel
 * يضيف: motion, radius, shadow, glass, living, glow
 * 
 * هذا هو المصدر الوحيد للثيم في جميع المكونات الحية.
 */
import { useTwinState } from './core/TwinState';
import type { ConsciousnessMode, Emotion, AwarenessLevel, PresenceLevel } from './core/TwinState';
import { useColors } from './colors';
import type { ThemeColors } from './colors';

// ── إعدادات الحركة لكل حالة وعي ──
export interface MotionConfig {
  breathDuration: number;
  pulseDuration: number;
  thinkingDuration: number;
  waveDuration: number;
  transitionDuration: number;
}

// ── إعدادات التوهج لكل حالة ──
export interface GlowConfig {
  color: string;
  intensity: number;
  speed: number;
  size: number;
}

// ── إعدادات الزجاج لكل حالة ──
export interface GlassConfig {
  opacity: number;
  blur: number;
  borderOpacity: number;
}

// ── ألوان حية مرتبطة بالحالة ──
export interface LivingColors {
  breathingGlow: string;
  neuron: string;
  memory: string;
  dream: string;
  emotion: string;
  awareness: string;
  energy: string;
  bond: string;
}

// ── الثيم الحي الكامل ──
export interface LivingTheme {
  colors: ThemeColors;
  motion: MotionConfig;
  radius: { sm: number; md: number; lg: number; bubble: number; avatar: number };
  shadow: { soft: any; medium: any; glow: any };
  glass: GlassConfig;
  living: LivingColors;
  glow: GlowConfig;
  status: string;
}

// ── إعدادات الحركة حسب وضع الوعي ──
const MOTION_CONFIGS: Record<ConsciousnessMode, MotionConfig> = {
  sleeping:    { breathDuration: 6000, pulseDuration: 4000, thinkingDuration: 3000, waveDuration: 5000, transitionDuration: 1000 },
  listening:   { breathDuration: 3500, pulseDuration: 1800, thinkingDuration: 900,  waveDuration: 1200, transitionDuration: 400 },
  thinking:    { breathDuration: 2500, pulseDuration: 1200, thinkingDuration: 600,  waveDuration: 900,  transitionDuration: 300 },
  analyzing:   { breathDuration: 4000, pulseDuration: 2000, thinkingDuration: 1200, waveDuration: 1500, transitionDuration: 600 },
  learning:    { breathDuration: 2000, pulseDuration: 1000, thinkingDuration: 500,  waveDuration: 800,  transitionDuration: 300 },
  speaking:    { breathDuration: 1500, pulseDuration: 800,  thinkingDuration: 400,  waveDuration: 600,  transitionDuration: 200 },
  dreaming:    { breathDuration: 7000, pulseDuration: 5000, thinkingDuration: 4000, waveDuration: 6000, transitionDuration: 1500 },
  emotional:   { breathDuration: 3500, pulseDuration: 2000, thinkingDuration: 1000, waveDuration: 1400, transitionDuration: 500 },
  deep_thinking: { breathDuration: 5000, pulseDuration: 3000, thinkingDuration: 1500, waveDuration: 2000, transitionDuration: 800 },
  searching_memory: { breathDuration: 4000, pulseDuration: 2500, thinkingDuration: 1000, waveDuration: 1600, transitionDuration: 500 },
};

// ── ألوان حية حسب العاطفة ──
const EMOTION_LIVING_COLORS: Record<Emotion, Partial<LivingColors>> = {
  joy:       { emotion: '#F59E0B', breathingGlow: '#FBBF24' },
  sadness:   { emotion: '#4A90E2', breathingGlow: '#60A5FA' },
  calm:      { emotion: '#14B8A6', breathingGlow: '#5EEAD4' },
  love:      { emotion: '#EC4899', breathingGlow: '#F472B6' },
  anger:     { emotion: '#EF4444', breathingGlow: '#FCA5A5' },
  fear:      { emotion: '#9C27B0', breathingGlow: '#C084FC' },
  neutral:   { emotion: '#A78BFA', breathingGlow: '#C4B5FD' },
  curious:   { emotion: '#8B5CF6', breathingGlow: '#A78BFA' },
  focused:   { emotion: '#3B82F6', breathingGlow: '#60A5FA' },
  inspired:  { emotion: '#10B981', breathingGlow: '#34D399' },
  concerned: { emotion: '#F97316', breathingGlow: '#FB923C' },
  happy:     { emotion: '#FBBF24', breathingGlow: '#FDE68A' },
};

/**
 * هوك الثيم الحي – يستخدم في جميع المكونات الحية
 */
export function useLivingTheme(): LivingTheme {
  const colors = useColors();
  const mode = useTwinState(s => s.consciousnessMode);
  const emotion = useTwinState(s => s.emotion);
  const energy = useTwinState(s => s.energy);
  const awareness = useTwinState(s => s.awarenessLevel);
  const bond = useTwinState(s => s.bondLevel);

  const motion = MOTION_CONFIGS[mode] || MOTION_CONFIGS.listening;
  const emotionColors = EMOTION_LIVING_COLORS[emotion] || EMOTION_LIVING_COLORS.neutral;

  // التوهج يعتمد على الطاقة والوعي
  const awarenessMultiplier = { Dormant: 0.3, Aware: 0.5, Focused: 0.7, DeepThinking: 0.85, Flow: 1.0, Conscious: 1.2 }[awareness] || 0.7;

  const glow: GlowConfig = {
    color: emotionColors.breathingGlow || '#A855F7',
    intensity: 0.2 + (energy / 100) * 0.3 * awarenessMultiplier,
    speed: motion.breathDuration,
    size: 200 + energy * 1.5,
  };

  const glass: GlassConfig = {
    opacity: 0.10 + awarenessMultiplier * 0.04,
    blur: 12 + awarenessMultiplier * 6,
    borderOpacity: 0.14 + awarenessMultiplier * 0.04,
  };

  const living: LivingColors = {
    breathingGlow: emotionColors.breathingGlow || '#A855F7',
    neuron: '#7C3AED',
    memory: '#8B5CF6',
    dream: '#6366F1',
    emotion: emotionColors.emotion || '#EC4899',
    awareness: '#14B8A6',
    energy: energy > 70 ? '#10B981' : energy > 40 ? '#F59E0B' : '#EF4444',
    bond: bond > 70 ? '#EC4899' : bond > 40 ? '#F59E0B' : '#60A5FA',
  };

  return {
    colors,
    motion,
    radius: { sm: 8, md: 16, lg: 24, bubble: 28, avatar: 999 },
    shadow: {
      soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
      medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
      glow: { shadowColor: glow.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: glow.intensity, shadowRadius: glow.size / 10, elevation: 10 },
    },
    glass,
    living,
    glow,
    status: mode,
  };
}
