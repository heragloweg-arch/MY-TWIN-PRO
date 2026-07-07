/**
 * EMOTION ENGINE v1.0 – محرك المشاعر
 * ======================================
 * يدير المشاعر الـ 12 للكيان الرقمي.
 * يدعم انتقالات تدريجية بين المشاعر (Emotion Transition).
 * يتأثر بـ: حالة المستخدم، الذاكرة العاطفية، مستوى الرابطة.
 */
import { stateBus, STATE_EVENTS } from '../core/StateBus';
import { useTwinState, Emotion } from '../core/TwinState';

// مصفوفة توافق المشاعر – أي المشاعر يمكن الانتقال منها وإليها
const EMOTION_COMPATIBILITY: Record<Emotion, Emotion[]> = {
  joy: ['calm', 'love', 'inspired', 'happy', 'neutral'],
  sadness: ['neutral', 'calm', 'concerned', 'fear', 'curious'],
  calm: ['joy', 'neutral', 'focused', 'love', 'inspired'],
  love: ['joy', 'calm', 'happy', 'inspired', 'neutral'],
  anger: ['neutral', 'fear', 'concerned', 'focused'],
  fear: ['neutral', 'sadness', 'concerned', 'anger'],
  neutral: ['joy', 'sadness', 'calm', 'curious', 'focused', 'concerned', 'love', 'anger', 'fear', 'inspired', 'happy'],
  curious: ['focused', 'inspired', 'neutral', 'joy'],
  focused: ['neutral', 'calm', 'curious', 'inspired'],
  inspired: ['joy', 'focused', 'love', 'happy', 'curious'],
  concerned: ['neutral', 'sadness', 'fear', 'focused'],
  happy: ['joy', 'love', 'inspired', 'neutral', 'calm'],
};

export class EmotionEngine {
  private memoryClient: any = null;
  private currentEmotion: Emotion = 'neutral';
  private emotionIntensity: number = 0.5; // 0-1
  private transitionInProgress: boolean = false;

  setMemoryClient(client: any): void {
    this.memoryClient = client;
  }

  /**
   * تغيير المشاعر مع انتقال تدريجي
   */
  async setEmotion(target: Emotion, intensity: number = 0.7): Promise<void> {
    if (this.transitionInProgress) return;
    if (!this.canTransition(this.currentEmotion, target)) return;

    const from = this.currentEmotion;
    this.transitionInProgress = true;

    // انتقال تدريجي (عدة خطوات صغيرة)
    const steps = 5;
    const stepDelay = 150;
    const intensityStep = (intensity - this.emotionIntensity) / steps;

    for (let i = 1; i <= steps; i++) {
      this.emotionIntensity += intensityStep;
      await new Promise(resolve => setTimeout(resolve, stepDelay));
    }

    this.currentEmotion = target;
    this.emotionIntensity = intensity;
    this.transitionInProgress = false;

    const store = useTwinState.getState();
    store.setEmotion(target);

    stateBus.emit(STATE_EVENTS.EMOTION_CHANGED, {
      from, to: target, intensity,
      transitionDuration: steps * stepDelay,
    });
  }

  /**
   * التحقق من إمكانية الانتقال بين مشاعرين
   */
  canTransition(from: Emotion, to: Emotion): boolean {
    const compatible = EMOTION_COMPATIBILITY[from];
    return compatible ? compatible.includes(to) : false;
  }

  /**
   * تحديث المشاعر بناءً على سياق المستخدم
   */
  reactToUserEmotion(userEmotion: string): void {
    const mapping: Record<string, Emotion> = {
      joy: 'joy', happiness: 'joy', excited: 'inspired',
      sadness: 'sadness', grief: 'sadness', depressed: 'concerned',
      anger: 'concerned', frustration: 'concerned',
      fear: 'fear', anxiety: 'concerned',
      love: 'love', gratitude: 'love',
      curious: 'curious', interested: 'curious',
      calm: 'calm', peaceful: 'calm',
      focused: 'focused', determined: 'focused',
    };

    const targetEmotion = mapping[userEmotion.toLowerCase()] || 'neutral';
    if (targetEmotion !== this.currentEmotion) {
      this.setEmotion(targetEmotion, 0.6);
    }
  }

  /**
   * المشاعر الحالية
   */
  getCurrentEmotion(): Emotion {
    return this.currentEmotion;
  }

  getIntensity(): number {
    return this.emotionIntensity;
  }
}

export const emotionEngine = new EmotionEngine();
