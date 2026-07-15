/**
 * BEHAVIORAL INTENT ENGINE v1.0 — محرك النوايا السلوكية
 * ========================================================
 * يترجم الأحداث (حدث المستخدم، تغير العاطفة، استرجاع الذاكرة)
 * إلى نوايا (Intent) وسلوكيات (Behavior) مقصودة.
 *
 * A) Intent قبل الحركة
 * B) المزاج الطويل (Mood) مقابل العاطفة (Emotion)
 * C) الشخصية تؤثر على السلوك
 * D) الذاكرة تؤثر على القرار
 */
import { emotionEngine } from '../emotion/EmotionEngine';
import { relationshipEngine } from '../relationship/RelationshipEngine';
import { memoryEngine } from '../memory/MemoryEngine';
import { personalityCoordinator } from '../../src/coordinators/PersonalityCoordinator';
import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';
import { PersonalityDNA } from '../../src/core/TwinBrain';

export type UserIntent =
  | 'greeting'
  | 'question'
  | 'sharing_emotion'
  | 'request_task'
  | 'casual_talk'
  | 'silence';

export type TwinBehavior =
  | 'warm_greeting'
  | 'thoughtful_reply'
  | 'empathetic_comfort'
  | 'proactive_question'
  | 'calm_listening'
  | 'reflective_silence'
  | 'memory_recall'
  | 'playful_banter'
  | 'gentle_encouragement';

interface BehaviorDecision {
  behavior: TwinBehavior;
  confidence: number;
  reason: string;
  moodInfluence: number; // 0-1
  personalityInfluence: number; // 0-1
}

export class BehavioralIntentEngine {
  private currentMood: string = 'neutral';
  private moodDuration: number = 0; // كم دقيقة استمر المزاج الحالي
  private lastUserActivity: number = Date.now();

  /**
   * تفسير نية المستخدم من الرسالة
   */
  interpretUserIntent(message: string): UserIntent {
    const lower = message.toLowerCase().trim();
    
    if (lower.length < 3) return 'casual_talk';
    if (/^(مرحبا|اهلا|هاي|hello|hi|صباح|مساء)/i.test(lower)) return 'greeting';
    if (/[?؟]/ .test(lower) || /^(ما|متى|كيف|لماذا|هل|من|what|when|how|why|who)/i.test(lower)) return 'question';
    if (/^(أنا|اشعر|حزين|سعيد|قلق|خائف|مشتاق|احب|اكره)/i.test(lower)) return 'sharing_emotion';
    if (/^(اريد|احتاج|ابحث|اطلب|اعمل|انشئ)/i.test(lower)) return 'request_task';
    
    return 'casual_talk';
  }

  /**
   * اتخاذ قرار السلوك بناءً على:
   * - نية المستخدم
   * - العاطفة الحالية
   * - المزاج الطويل
   * - شخصية التوأم (DNA)
   * - مرحلة العلاقة
   * - الذاكرة (هل هناك ذكريات ذات صلة؟)
   */
  async decideBehavior(userIntent: UserIntent, userMessage: string): Promise<BehaviorDecision> {
    const emotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    const dna = personalityCoordinator.getCurrentDNA();
    const phase = relationshipEngine.getPhase();
    const bond = relationshipEngine.getBondLevel();

    // 1. تأثير الشخصية (DNA)
    const personalityInfluence = (dna.empathy + dna.reflection) / 2;

    // 2. تأثير المزاج الطويل
    this.updateMood(emotion);
    const moodInfluence = this.calculateMoodInfluence();

    // 3. البحث عن ذكريات ذات صلة
    const memories = await memoryEngine.retrieve(userMessage, 1);
    const hasRelevantMemory = memories.length > 0 && memories[0].importance > 60;

    // 4. جدول القرار
    let behavior: TwinBehavior = 'thoughtful_reply';
    let confidence = 0.6;
    let reason = 'default_response';

    switch (userIntent) {
      case 'greeting':
        behavior = phase === 'soulmate' ? 'warm_greeting' : 'calm_listening';
        confidence = 0.85;
        reason = 'greeting_detected';
        break;

      case 'sharing_emotion':
        if (dna.empathy > 0.8) {
          behavior = 'empathetic_comfort';
          confidence = 0.9;
          reason = 'high_empathy';
        } else if (intensity > 0.7) {
          behavior = 'gentle_encouragement';
          confidence = 0.75;
          reason = 'high_emotional_intensity';
        } else {
          behavior = 'calm_listening';
          confidence = 0.7;
          reason = 'moderate_emotion';
        }
        break;

      case 'question':
        if (dna.curiosity > 0.8 && hasRelevantMemory) {
          behavior = 'memory_recall';
          confidence = 0.85;
          reason = 'curious_with_memory';
        } else {
          behavior = 'thoughtful_reply';
          confidence = 0.7;
          reason = 'answering_question';
        }
        break;

      case 'casual_talk':
        if (dna.humor > 0.7 && Math.random() > 0.5) {
          behavior = 'playful_banter';
          confidence = 0.65;
          reason = 'humorous_personality';
        } else if (bond > 70 && Math.random() > 0.6) {
          behavior = 'proactive_question';
          confidence = 0.7;
          reason = 'close_bond_initiative';
        } else {
          behavior = 'thoughtful_reply';
          confidence = 0.6;
          reason = 'default_casual';
        }
        break;

      case 'silence':
        behavior = dna.reflection > 0.85 ? 'reflective_silence' : 'calm_listening';
        confidence = 0.8;
        reason = 'silence_detected';
        break;

      default:
        behavior = 'thoughtful_reply';
        confidence = 0.5;
        reason = 'fallback';
    }

    // تعديل الثقة حسب المزاج
    confidence = Math.min(1, confidence + moodInfluence * 0.1);

    return {
      behavior,
      confidence,
      reason,
      moodInfluence,
      personalityInfluence,
    };
  }

  /**
   * تحديث المزاج الطويل (يتغير ببطء على مدى ساعات)
   */
  private updateMood(currentEmotion: string): void {
    const now = Date.now();
    const minutesSinceLastActivity = (now - this.lastUserActivity) / 60000;

    // المزاج يتغير فقط إذا مر وقت كافٍ (5 دقائق على الأقل)
    if (minutesSinceLastActivity < 5) return;

    const moodTransitions: Record<string, string[]> = {
      joy: ['calm', 'hopeful', 'grateful'],
      sadness: ['reflective', 'calm', 'hopeful'],
      calm: ['reflective', 'hopeful', 'joy'],
      anger: ['calm', 'reflective', 'determined'],
      fear: ['cautious', 'calm', 'brave'],
      love: ['grateful', 'joy', 'calm'],
    };

    const possibleNext = moodTransitions[currentEmotion] || ['neutral'];
    this.currentMood = possibleNext[Math.floor(Math.random() * possibleNext.length)];
    this.moodDuration = minutesSinceLastActivity;
    this.lastUserActivity = now;
  }

  private calculateMoodInfluence(): number {
    // المزاج المستقر طويلاً له تأثير أكبر
    return Math.min(1, this.moodDuration / 60); // يصل إلى 1 بعد ساعة
  }

  /**
   * C) الشخصية تؤثر على السلوك (عامل مستقل)
   */
  getPersonalityBehaviorModifier(dna: PersonalityDNA): Partial<Record<TwinBehavior, number>> {
    const modifiers: Partial<Record<TwinBehavior, number>> = {};

    if (dna.curiosity > 0.8) modifiers.proactive_question = 0.3;
    if (dna.reflection > 0.85) modifiers.reflective_silence = 0.25;
    if (dna.empathy > 0.9) modifiers.empathetic_comfort = 0.3;
    if (dna.humor > 0.7) modifiers.playful_banter = 0.2;

    return modifiers;
  }

  getCurrentMood(): string { return this.currentMood; }
}

export const behavioralIntentEngine = new BehavioralIntentEngine();
