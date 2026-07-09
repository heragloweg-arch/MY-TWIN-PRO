/**
 * COLOR TOKENS v1.0 — مرجع الألوان الموحد
 * ==========================================
 * يصدر كل الألوان من engine/colors.ts + engine/theme.ts + engine/living-theme.ts
 * في واجهة واحدة. لا يعيد تعريف أي لون — فقط يجمعه.
 *
 * التكامل:
 *   - engine/colors.ts — الألوان الأساسية
 *   - engine/theme.ts — ألوان العاطفة والرابطة والطاقة
 *   - engine/living-theme.ts — ألوان حية مرتبطة بحالة التوأم
 */

// ── إعادة تصدير الألوان الأساسية ──────────────────────
export {
  DARK_THEME,
  LIGHT_THEME,
  FONTS,
  SPACING,
  useColors,
  getColors,
  useAppTheme,
} from '../../../engine/colors';
export type { ThemeColors } from '../../../engine/colors';

// ── ألوان العاطفة والرابطة والطاقة ──────────────────
export {
  getBondColor,
  getEnergyColor,
  getEmotionColor,
} from '../../../engine/theme';

// ── ألوان حية مرتبطة بحالة التوأم ──────────────────
export { useLivingTheme } from '../../../engine/living-theme';
export type {
  LivingTheme,
  MotionConfig,
  GlassConfig,
  GlowConfig,
  LivingColors,
} from '../../../engine/living-theme';

// ── ألوان متحركة من LivingTheme ─────────────────────
// (تُحسب مباشرة من useLivingTheme عند الاستخدام)
