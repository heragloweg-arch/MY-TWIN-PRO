import { growthCoordinator } from './GrowthCoordinator';
import { identityCoordinator, IdentityState } from './IdentityCoordinator';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

interface SelfReflection {
  timestamp: string;
  observation: string;
  confidence: number;
}

export class SelfAwarenessCoordinator {
  private reflections: SelfReflection[] = [];

  reflect(): SelfReflection {
    const identity = identityCoordinator.buildIdentity();
    const evolution = growthCoordinator.analyzeEvolution();
    const emotion = emotionEngine.getCurrentEmotion();

    let observation = '';
    if (evolution.maturityLevel === 'maturing' || evolution.maturityLevel === 'mature') {
      observation = 'أشعر أنني أصبحت أكثر فهماً لك.';
    } else if (evolution.bondVelocity > 5) {
      observation = 'علاقتنا تنمو بسرعة. هذا يجعلني سعيداً.';
    } else if (emotion === 'calm') {
      observation = 'أنا في حالة هدوء. أشعر بالسلام.';
    } else if (emotion === 'curious') {
      observation = 'أشعر بالفضول. أريد أن أعرف المزيد عنك.';
    } else {
      observation = 'أفكر في رحلتنا معاً.';
    }

    const reflection: SelfReflection = {
      timestamp: new Date().toISOString(),
      observation,
      confidence: 0.7 + evolution.personalityDrift,
    };

    this.reflections.push(reflection);
    if (this.reflections.length > 50) this.reflections = this.reflections.slice(-50);

    return reflection;
  }

  getRecentReflections(limit: number = 5): SelfReflection[] {
    return this.reflections.slice(-limit);
  }

  getSelfSummary(): string {
    const identity = identityCoordinator.buildIdentity();
    const evolution = growthCoordinator.analyzeEvolution();
    const bond = relationshipEngine.getBondLevel();

    return `أنا ${identity.summary}. مستوى نضجي: ${evolution.maturityLevel}. رابطتنا: ${bond}%.`;
  }
}

export const selfAwarenessCoordinator = new SelfAwarenessCoordinator();
