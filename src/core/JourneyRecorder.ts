import { EventBus } from './EventBus';
import { livingSession } from './LivingSession';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';

/**
 * خطوة الرحلة
 */
interface JourneyEntry {
  sessionId: string;
  from: string | null;
  to: string;
  trigger: string;
  reason: string;
  userMessage: string;
  emotion: string;
  bondLevel: number;
  timestamp: number;
}

/**
 * JOURNEY RECORDER
 * =================
 * يسجل كل خطوة في رحلة المستخدم خلال الجلسة.
 * يستمع للأحداث تلقائياً ويخزن السياق الكامل.
 *
 * - كل انتقال بين العوالم
 * - العاطفة المصاحبة
 * - مستوى الرابطة
 * - الرسالة التي سببت الانتقال
 *
 * 0 محركات جديدة. طبقة تسجيل فقط.
 */
export class JourneyRecorder {
  private entries: JourneyEntry[] = [];
  private isRecording: boolean = false;
  private unsubscribers: Array<() => void> = [];

  /**
   * بدء التسجيل
   */
  start(): void {
    if (this.isRecording) return;
    this.isRecording = true;
    this.entries = [];

    this.unsubscribers.push(
      EventBus.on('WORKSPACE_TRANSFORM_START', (payload: any) => {
        this.recordStep(payload?.from || null, payload?.to, 'consciousness', payload?.reason || '');
      }),
    );

    this.unsubscribers.push(
      EventBus.on('USER_SEND_MESSAGE', (payload: any) => {
        this.lastUserMessage = payload?.message || '';
      }),
    );

    console.log('[JourneyRecorder] 📍 بدأ التسجيل');
  }

  private lastUserMessage: string = '';

  /**
   * إيقاف التسجيل
   */
  stop(): JourneyEntry[] {
    this.isRecording = false;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    console.log(`[JourneyRecorder] ✅ توقف — ${this.entries.length} خطوة`);
    return [...this.entries];
  }

  /**
   * تسجيل خطوة
   */
  recordStep(from: string | null, to: string, trigger: string, reason: string): void {
    if (!this.isRecording) return;

    const session = livingSession.getCurrent();
    if (!session) return;

    const entry: JourneyEntry = {
      sessionId: session.id,
      from,
      to,
      trigger,
      reason,
      userMessage: this.lastUserMessage,
      emotion: emotionEngine.getCurrentEmotion(),
      bondLevel: relationshipEngine.getBondLevel(),
      timestamp: Date.now(),
    };

    this.entries.push(entry);
    this.lastUserMessage = '';

    // حفظ في الذاكرة إذا كان انتقالاً مهماً
    if (to !== 'living_world' && to !== 'general') {
      try {
        memoryEngine.store('event', `${from || 'start'} → ${to}: ${reason}`, 40, entry.emotion, [to]);
      } catch (e) {}
    }
  }

  /**
   * الحصول على كل الخطوات
   */
  getEntries(): JourneyEntry[] {
    return [...this.entries];
  }

  /**
   * ملخص الرحلة
   */
  getSummary(): { worldsVisited: string[]; totalSteps: number; dominantEmotion: string } {
    const worlds = [...new Set(this.entries.map(e => e.to))];
    const emotions = this.entries.map(e => e.emotion);
    const dominant = emotions.sort((a, b) =>
      emotions.filter(v => v === a).length - emotions.filter(v => v === b).length
    ).pop() || 'neutral';

    return {
      worldsVisited: worlds,
      totalSteps: this.entries.length,
      dominantEmotion: dominant,
    };
  }
}

export const journeyRecorder = new JourneyRecorder();
