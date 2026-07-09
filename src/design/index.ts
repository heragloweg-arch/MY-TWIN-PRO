/**
 * DESIGN SYSTEM v1.0 — المرجع الموحد للتصميم
 * =============================================
 * هذا هو الملف الوحيد الذي يستورد منه التطبيق.
 *
 * الاستخدام:
 *   import { COLORS, MOTION, SPACE, TYPO, GLASS, AUDIO } from 'src/design';
 */

// ── Colors ──────────────────────────────────────────
export {
  DARK_THEME,
  LIGHT_THEME,
  FONTS,
  SPACING,
  useColors,
  getColors,
  useAppTheme,
  getBondColor,
  getEnergyColor,
  getEmotionColor,
  useLivingTheme,
} from './tokens/colors';
export type {
  ThemeColors,
  LivingTheme,
  MotionConfig,
  GlassConfig,
  GlowConfig,
  LivingColors,
} from './tokens/colors';

// ── Motion ──────────────────────────────────────────
export { MOTION, SPRING, DURATION } from './tokens/motion';

// ── Spacing ─────────────────────────────────────────
export { SPACE, RADIUS, HIT_SLOP } from './tokens/spacing';

// ── Typography ──────────────────────────────────────
export { TYPO } from './tokens/typography';

// ── Glass ───────────────────────────────────────────
export { GLASS } from './tokens/glass';

// ── Audio ───────────────────────────────────────────
export {
  AUDIO_CATEGORY,
  AUDIO_GROUPS,
  AUDIO_VOLUMES,
  AUDIO_FILES,
} from './tokens/audio';
