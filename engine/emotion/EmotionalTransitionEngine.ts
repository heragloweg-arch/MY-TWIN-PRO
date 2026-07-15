/**
 * EMOTIONAL TRANSITION ENGINE v1.0 — الانتقال العاطفي السلس
 * ==============================================================
 * يدير قائمة انتظار للتحولات العاطفية.
 * لا ينتقل من الحزن إلى الفرح مباشرة، بل يمر بمراحل:
 * Sadness → Reflection → Relief → Hope → Calm → Joy
 */
import { emotionEngine } from './EmotionEngine';
import { stateBus } from '../../src/core/StateBus';

interface TransitionStep {
  emotion: string;
  duration: number; // مللي ثانية
}

const TRANSITION_PATHS: Record<string, string[]> = {
  sadness: ['sadness', 'reflection', 'calm', 'hope', 'joy'],
  joy: ['joy', 'calm', 'neutral'],
  anger: ['anger', 'reflection', 'calm', 'neutral'],
  fear: ['fear', 'caution', 'calm', 'neutral'],
  love: ['love', 'gratitude', 'calm', 'joy'],
  neutral: ['neutral'],
};

export class EmotionalTransitionEngine {
  private isTransitioning: boolean = false;
  private queue: Array<{ target: string; intensity: number }> = [];

  /**
   * انتقال سلس إلى عاطفة جديدة
   */
  async transitionTo(target: string, intensity: number = 0.7): Promise<void> {
    if (this.isTransitioning) {
      this.queue.push({ target, intensity });
      return;
    }

    this.isTransitioning = true;
    const current = emotionEngine.getCurrentEmotion();
    const path = TRANSITION_PATHS[current] || [current, target];

    for (let i = 0; i < path.length; i++) {
      const stepEmotion = path[i];
      const stepIntensity = intensity * (0.3 + (i / path.length) * 0.7);
      const duration = 600 + (i * 200); // كل خطوة تستغرق 600-1400ms

      await this.applyStep(stepEmotion, stepIntensity, duration);

      // إعلام النظام بكل خطوة
      stateBus.emit('emotion:transition_step', {
        from: i > 0 ? path[i - 1] : current,
        to: stepEmotion,
        progress: (i + 1) / path.length,
      });
    }

    this.isTransitioning = false;

    // معالجة العنصر التالي في الطابور
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.transitionTo(next.target, next.intensity);
    }
  }

  private async applyStep(emotion: string, intensity: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      emotionEngine.setEmotion(emotion as any, intensity);
      setTimeout(resolve, duration);
    });
  }
}

export const emotionalTransitionEngine = new EmotionalTransitionEngine();
