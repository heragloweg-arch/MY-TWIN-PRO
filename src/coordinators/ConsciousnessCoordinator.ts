import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from './PersonalityCoordinator';
import { identityEngine } from './IdentityEngine';
import { digitalSoul } from '../soul/DigitalSoul';
import { EventBus } from '../core/EventBus';

export type DecisionAction =
  | 'respond_normally'
  | 'respond_with_memory'
  | 'suggest_workspace'
  | 'stay_silent'
  | 'check_in'
  | 'celebrate';

export interface Decision {
  action: DecisionAction;
  reason: string;
  memoryContent?: string;
  workspaceType?: string;
}

export class ConsciousnessCoordinator {
  private intentStack: Array<{ intent: string; timestamp: number }> = [];

  async decide(message: string, userEmotion: string): Promise<Decision> {
    const decision: Decision = { action: 'respond_normally', reason: 'default' };

    const soul = digitalSoul.read();
    const currentEmotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();

    // 1. ذكريات "في مثل هذا اليوم"
    try {
      const todayMemories = await memoryEngine.onThisDay();
      if (todayMemories.length > 0 && todayMemories[0].importance >= 70) {
        return {
          action: 'respond_with_memory',
          reason: 'on_this_day',
          memoryContent: todayMemories[0].content,
        };
      }
    } catch (e) {}

    // 2. ذكريات ذات صلة
    try {
      const relevant = await memoryEngine.smartRetrieve(
        { currentEmotion, currentTopic: message.substring(0, 40), timeOfDay: new Date().getHours() > 12 ? 'مساء' : 'صباح', recentTopics: [] },
        2,
      );
      if (relevant.length > 0 && relevant[0].importance >= 75) {
        return { action: 'respond_with_memory', reason: 'relevant_memory', memoryContent: relevant[0].content };
      }
    } catch (e) {}

    // 3. تأثير الهوية على القرار
    const identity = identityEngine.buildIdentity();
    if (identity.role === 'listener' && message.length < 10) {
      return { action: 'stay_silent', reason: 'identity_listener' };
    }
    if (identity.role === 'mentor' && currentEmotion === 'curious') {
      return { action: 'respond_with_memory', reason: 'identity_mentor' };
    }

    // 4. تأثير الروح على القرار
    if (soul.resonance.harmony > 0.8 && intensity > 0.7) {
      return { action: 'stay_silent', reason: 'deep_harmony_silence' };
    }
    if (soul.core.role === 'protector' && (currentEmotion === 'fear' || currentEmotion === 'sadness')) {
      return { action: 'check_in', reason: 'soul_protector' };
    }

    // 5. المستخدم في حالة ضيق
    if ((currentEmotion === 'sadness' || currentEmotion === 'anger' || currentEmotion === 'fear') && intensity > 0.8) {
      return { action: 'stay_silent', reason: 'user_distressed' };
    }

    // 6. نية المستخدم
    const workspaceKeywords: Record<string, string[]> = {
      study: ['ادرس', 'ذاكر', 'امتحان', 'مذاكرة', 'study', 'exam', 'learn', 'درس'],
      business: ['مشروع', 'فكرة', 'business', 'project', 'startup', 'عمل'],
      dream: ['حلمت', 'حلم', 'dream', 'nightmare'],
      creative: ['اكتب', 'أبدع', 'create', 'write', 'رسم'],
      life: ['حياتي', 'صحتي', 'نومي', 'life', 'health', 'sleep'],
      code: ['كود', 'برمجة', 'code', 'program', 'برمج'],
    };

    for (const [type, keywords] of Object.entries(workspaceKeywords)) {
      if (keywords.some(kw => message.toLowerCase().includes(kw))) {
        return { action: 'suggest_workspace', workspaceType: type, reason: 'user_intent_detected' };
      }
    }

    // 7. رابطة قوية + مبادرة
    const bond = relationshipEngine.getBondLevel();
    const dna = personalityCoordinator.getCurrentDNA();
    if (bond > 60 && dna.initiative > 0.6) {
      return { action: 'check_in', reason: 'high_bond_initiative' };
    }

    // تتبع النية
    this.intentStack.push({ intent: decision.action, timestamp: Date.now() });
    if (this.intentStack.length > 50) this.intentStack = this.intentStack.slice(-50);

    return decision;
  }

  getIntentStack(): Array<{ intent: string; timestamp: number }> { return [...this.intentStack]; }
  getIntentEvolution(): string { return this.intentStack.map(i => i.intent).join(" → "); }
}

export const consciousnessCoordinator = new ConsciousnessCoordinator();
