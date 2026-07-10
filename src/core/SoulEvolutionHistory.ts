import { EventBus } from './EventBus';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { identityEngine } from '../coordinators/IdentityEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';

interface EvolutionSnapshot {
  timestamp: string;
  role: string;
  empathy: number;
  curiosity: number;
  bondLevel: number;
  dominantEmotion: string;
  memoryCount: number;
  maturityLevel: string;
}

export class SoulEvolutionHistory {
  private history: EvolutionSnapshot[] = [];

  /**
   * تسجيل لقطة من تطور الروح
   */
  recordSnapshot(): EvolutionSnapshot {
    const dna = personalityCoordinator.getCurrentDNA();
    const identity = identityEngine.buildIdentity();
    const bond = relationshipEngine.getBondLevel();
    const emotion = emotionEngine.getCurrentEmotion();
    const ecology = memoryEngine.getEcologyStats();

    const snapshot: EvolutionSnapshot = {
      timestamp: new Date().toISOString(),
      role: identity.role,
      empathy: dna.empathy,
      curiosity: dna.curiosity,
      bondLevel: bond,
      dominantEmotion: emotion,
      memoryCount: ecology.total,
      maturityLevel: bond > 80 ? 'wise' : bond > 60 ? 'mature' : bond > 30 ? 'growing' : 'newborn',
    };

    this.history.push(snapshot);
    if (this.history.length > 200) this.history = this.history.slice(-200);

    EventBus.emit('SOUL_SNAPSHOT_RECORDED', snapshot);
    return snapshot;
  }

  getHistory(): EvolutionSnapshot[] {
    return [...this.history];
  }

  getSummary(): string {
    if (this.history.length < 2) return 'الروح لم تتطور بعد.';

    const first = this.history[0];
    const last = this.history[this.history.length - 1];

    const bondDiff = last.bondLevel - first.bondLevel;
    const empathyDiff = last.empathy - first.empathy;
    const memoryGrowth = last.memoryCount - first.memoryCount;

    return `بدأت كـ ${first.role} (تعاطف: ${first.empathy.toFixed(2)}). ` +
      `الآن أنا ${last.role} (تعاطف: ${last.empathy.toFixed(2)}). ` +
      `الرابطة: ${bondDiff > 0 ? '+' : ''}${bondDiff}. الذكريات: +${memoryGrowth}.`;
  }
}

export const soulEvolutionHistory = new SoulEvolutionHistory();
