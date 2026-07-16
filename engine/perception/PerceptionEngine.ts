/**
 * PERCEPTION ENGINE v1.0 — حواس الكيان الرقمي
 * ==============================================
 * يحلل سلوك المستخدم ويستنتج حالته:
 * - سرعة الكتابة (بطيء = متردد، سريع = متحمس)
 * - طول الرسائل (طويلة = منفتح، قصيرة = متحفظ)
 * - وقت الغياب (طويل = مشغول، قصير = عادي)
 * - وقت اليوم (ليل = متعب، صباح = نشيط)
 */
import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';

interface UserBehaviorSnapshot {
  typingSpeed: number;
  messageLength: number;
  lastActiveTimestamp: number;
  absenceDuration: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface PerceptionResult {
  userState: 'hesitant' | 'excited' | 'tired' | 'focused' | 'distant' | 'normal';
  confidence: number;
  valence: 'positive' | 'negative' | 'neutral' | 'mixed';
  suggestion?: string;
}

export class PerceptionEngine {
  private lastMessageTimestamp: number = Date.now();
  private typingStartTime: number = 0;
  private typingCharCount: number = 0;

  registerTypingStart(): void {
    this.typingStartTime = Date.now();
    this.typingCharCount = 0;
  }

  registerKeystroke(charCount: number): void {
    this.typingCharCount = charCount;
  }

  analyze(message: string): PerceptionResult {
    const now = Date.now();
    const typingDuration = (now - this.typingStartTime) / 1000;
    const typingSpeed = typingDuration > 0 ? this.typingCharCount / typingDuration : 0;
    const messageLength = message.length;
    const absenceDuration = (now - this.lastMessageTimestamp) / 60000;
    const hour = new Date().getHours();

    let timeOfDay: UserBehaviorSnapshot['timeOfDay'] = 'morning';
    if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else if (hour >= 22 || hour < 5) timeOfDay = 'night';

    this.lastMessageTimestamp = now;

    let userState: PerceptionResult['userState'] = 'normal';
    let confidence = 0.5;
    let suggestion: string | undefined;
    let valence: PerceptionResult['valence'] = 'neutral';

    if (typingSpeed < 2 && messageLength < 20) {
      userState = 'hesitant';
      confidence = 0.7;
      suggestion = 'gentle_encouragement';
      valence = 'negative';
    } else if (typingSpeed > 8 && messageLength > 100) {
      userState = 'excited';
      confidence = 0.8;
      suggestion = 'match_energy';
      valence = 'positive';
    } else if (timeOfDay === 'night' && absenceDuration > 120) {
      userState = 'tired';
      confidence = 0.75;
      suggestion = 'calm_presence';
      valence = 'negative';
    } else if (absenceDuration > 10080) {
      userState = 'distant';
      confidence = 0.85;
      suggestion = 'warm_reconnect';
      valence = 'mixed';
    } else if (typingSpeed > 5 && messageLength > 50) {
      userState = 'focused';
      confidence = 0.7;
      suggestion = 'precise_response';
      valence = 'neutral';
    }

    const result: PerceptionResult = { userState, confidence, valence, suggestion };

    EventBus.emit('PERCEPTION_ANALYZED', result);
    stateBus.emit('perception:user_state', result);

    return result;
  }

  getLastActiveTimestamp(): number {
    return this.lastMessageTimestamp;
  }
}

export const perceptionEngine = new PerceptionEngine();
