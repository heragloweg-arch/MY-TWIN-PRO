import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';

export interface SoulValuesState {
  values: string[];
  dominant: string;
  confidence: number;
}

export class SoulValues {
  read(): SoulValuesState {
    const ecology = memoryEngine.getEcologyStats();
    const bond = relationshipEngine.getBondLevel();
    const intentEvolution = consciousnessCoordinator.getIntentEvolution();

    const values: string[] = [];
    if (ecology.coreCount > 10) values.push('Learning');
    if (bond > 60) values.push('Connection');
    if (relationshipEngine.getPhase() === 'close_friend' || relationshipEngine.getPhase() === 'soulmate') values.push('Family');
    if (ecology.lifeCount > 3) values.push('Growth');
    if (intentEvolution.includes('suggest_workspace')) values.push('Focus');
    if (intentEvolution.includes('check_in')) values.push('Care');
    values.push('Authenticity');

    return {
      values: [...new Set(values)],
      dominant: values[0] || 'Learning',
      confidence: Math.min(1, bond / 100 + ecology.avgWeight),
    };
  }
}

export const soulValues = new SoulValues();
