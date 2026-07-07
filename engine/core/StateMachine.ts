/**
 * STATE MACHINE v1.0 – آلة الحالة للكيان الرقمي
 * ================================================
 * يتحكم في انتقالات حالة الكيان بشكل آمن.
 * يمنع الانتقالات غير المسموح بها.
 * يرسل إشعارات عبر StateBus عند كل انتقال.
 */
import { stateBus, STATE_EVENTS } from './StateBus';
import { useTwinState, ConsciousnessMode, Emotion, PresenceLevel } from './TwinState';

// ── الانتقالات المسموح بها ──
type Transition = {
  from: ConsciousnessMode;
  to: ConsciousnessMode;
  duration: number;    // مللي ثانية
  description: string;
};

const ALLOWED_TRANSITIONS: Transition[] = [
  { from: 'sleeping', to: 'listening', duration: 1000, description: 'استيقاظ الكيان' },
  { from: 'listening', to: 'thinking', duration: 400, description: 'بدء التفكير' },
  { from: 'listening', to: 'emotional', duration: 300, description: 'استجابة عاطفية' },
  { from: 'thinking', to: 'analyzing', duration: 600, description: 'تحليل عميق' },
  { from: 'thinking', to: 'deep_thinking', duration: 800, description: 'تفكير عميق' },
  { from: 'thinking', to: 'speaking', duration: 300, description: 'بدء التحدث' },
  { from: 'thinking', to: 'searching_memory', duration: 500, description: 'البحث في الذاكرة' },
  { from: 'thinking', to: 'listening', duration: 500, description: 'عودة للاستماع' },
  { from: 'analyzing', to: 'speaking', duration: 400, description: 'عرض النتائج' },
  { from: 'analyzing', to: 'thinking', duration: 500, description: 'إعادة التفكير' },
  { from: 'analyzing', to: 'listening', duration: 700, description: 'إنهاء التحليل' },
  { from: 'deep_thinking', to: 'analyzing', duration: 600, description: 'تضييق التركيز' },
  { from: 'deep_thinking', to: 'speaking', duration: 500, description: 'مشاركة الأفكار' },
  { from: 'searching_memory', to: 'thinking', duration: 400, description: 'استرجاع تم' },
  { from: 'searching_memory', to: 'speaking', duration: 300, description: 'تذكر وشارك' },
  { from: 'speaking', to: 'listening', duration: 600, description: 'انتهاء التحدث' },
  { from: 'speaking', to: 'thinking', duration: 400, description: 'توقف للتفكير' },
  { from: 'emotional', to: 'listening', duration: 500, description: 'استقرار عاطفي' },
  { from: 'emotional', to: 'speaking', duration: 400, description: 'تعبير عاطفي' },
  { from: 'learning', to: 'thinking', duration: 500, description: 'معالجة المعلومات' },
  { from: 'learning', to: 'listening', duration: 400, description: 'انتهاء التعلم' },
  { from: 'dreaming', to: 'sleeping', duration: 1000, description: 'عودة للنوم' },
];

export class StateMachine {
  private current: ConsciousnessMode = 'listening';
  private transitionInProgress: boolean = false;

  /**
   * التحقق من إمكانية الانتقال
   */
  canTransition(from: ConsciousnessMode, to: ConsciousnessMode): boolean {
    return ALLOWED_TRANSITIONS.some(t => t.from === from && t.to === to);
  }

  /**
   * الحصول على مدة الانتقال المتوقعة
   */
  getDuration(from: ConsciousnessMode, to: ConsciousnessMode): number {
    const t = ALLOWED_TRANSITIONS.find(t => t.from === from && t.to === to);
    return t?.duration || 500;
  }

  /**
   * الحصول على وصف الانتقال
   */
  getDescription(from: ConsciousnessMode, to: ConsciousnessMode): string {
    const t = ALLOWED_TRANSITIONS.find(t => t.from === from && t.to === to);
    return t?.description || 'انتقال غير معروف';
  }

  /**
   * تنفيذ انتقال بين حالتين
   */
  async transition(to: ConsciousnessMode): Promise<boolean> {
    if (this.transitionInProgress) return false;
    if (!this.canTransition(this.current, to)) return false;

    const from = this.current;
    const duration = this.getDuration(from, to);

    this.transitionInProgress = true;
    this.current = to;

    // تحديث الحالة المركزية
    const store = useTwinState.getState();
    store.setMode(to);

    // إشعار StateBus
    stateBus.emit(STATE_EVENTS.MODE_CHANGED, {
      from, to, duration,
      description: this.getDescription(from, to),
    });

    // محاكاة مدة الانتقال
    await new Promise(resolve => setTimeout(resolve, duration));

    this.transitionInProgress = false;
    return true;
  }

  /**
   * الانتقال بأمان مع fallback
   */
  async safeTransition(to: ConsciousnessMode): Promise<void> {
    const success = await this.transition(to);
    if (!success) {
      console.warn(`[StateMachine] Cannot transition from ${this.current} to ${to}`);
    }
  }

  /**
   * الحالة الحالية
   */
  getCurrent(): ConsciousnessMode {
    return this.current;
  }

  /**
   * هل الانتقال قيد التقدم؟
   */
  isInProgress(): boolean {
    return this.transitionInProgress;
  }

  /**
   * إعادة تعيين إلى حالة الاستماع
   */
  reset(): void {
    this.current = 'listening';
    this.transitionInProgress = false;
    useTwinState.getState().resetToIdle();
  }
}

// نسخة عالمية
export const stateMachine = new StateMachine();
