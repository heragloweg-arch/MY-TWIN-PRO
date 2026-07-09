/**
 * SPACING TOKENS v1.0 — مرجع المسافات الموحد
 * ==============================================
 * يعيد تصدير SPACING من engine/colors.ts
 * ويضيف spacing tokens مسماة للاستخدام المباشر.
 *
 * الاستخدام:
 *   import { SPACE } from 'src/design/tokens/spacing';
 *   <View style={{ padding: SPACE.lg }} />
 */

import { SPACING } from '../../../engine/colors';

export { SPACING };

export const SPACE = {
  xs: SPACING.xs,   // 4
  sm: SPACING.sm,   // 8
  md: SPACING.md,   // 16
  lg: SPACING.lg,   // 24
  xl: SPACING.xl,   // 32
  section: 48,
  screen: 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  bubble: 28,
  avatar: 999,
  card: 20,
  input: 16,
} as const;

export const HIT_SLOP = {
  sm: { top: 4, bottom: 4, left: 4, right: 4 },
  md: { top: 8, bottom: 8, left: 8, right: 8 },
  lg: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;
