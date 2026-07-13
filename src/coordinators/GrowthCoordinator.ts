import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from './PersonalityCoordinator';
import { PersonalityDNA } from '../core/TwinBrain';

interface GrowthSnapshot {
  timestamp: string;
  dna: PersonalityDNA;
  bondLevel: number;
  phase: string;
  interactionCount: number;
}

export class GrowthCoordinator {
  private history: GrowthSnapshot[] = [];

  recordGrowth(): GrowthSnapshot {
    const dna = personalityCoordinator.getCurrentDNA();
    const snapshot: GrowthSnapshot = {
      timestamp: new Date().toISOString(),
      dna,
      bondLevel: relationshipEngine.getBondLevel(),
      phase: relationshipEngine.getPhase(),
      interactionCount: 0,
    };
    this.history.push(snapshot);
    if (this.history.length > 100) this.history = this.history.slice(-100);
    return snapshot;
  }

  getGrowthTimeline(): GrowthSnapshot[] {
    return [...this.history];
  }

  analyzeEvolution(): {
    bondVelocity: number;
    personalityDrift: number;
    maturityLevel: string;
  } {
    if (this.history.length < 2) {
      return { bondVelocity: 0, personalityDrift: 0, maturityLevel: 'newborn' };
    }

    const recent = this.history.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const bondVelocity = last.bondLevel - first.bondLevel;

    let driftSum = 0;
    const keys: (keyof PersonalityDNA)[] = ['empathy', 'curiosity', 'humor', 'initiative', 'reflection', 'logic', 'creativity', 'calmness'];
    for (const key of keys) {
      driftSum += Math.abs(last.dna[key] - first.dna[key]);
    }
    const personalityDrift = driftSum / keys.length;

    const bond = relationshipEngine.getBondLevel();
    const phase = relationshipEngine.getPhase();
    let maturityLevel = 'newborn';
    if (phase === 'soulmate') maturityLevel = 'wise';
    else if (phase === 'close_friend') maturityLevel = 'mature';
    else if (bond > 40) maturityLevel = 'maturing';
    else if (bond > 15) maturityLevel = 'growing';

    return { bondVelocity, personalityDrift, maturityLevel };
  }
}

export const growthCoordinator = new GrowthCoordinator();
