import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

export interface SoulResonanceState {
  harmony: number;
  understanding: number;
  syncLevel: 'low' | 'moderate' | 'high' | 'complete';
}

export class SoulResonance {
  read(): SoulResonanceState {
    const bond = relationshipEngine.getBondLevel();
    const ecology = memoryEngine.getEcologyStats();
    const emotion = emotionEngine.getCurrentEmotion();
    const harmony = (bond / 100 + ecology.avgWeight) / 2;
    const understanding = ecology.coreCount > 10 ? 0.8 : 0.5;

    let syncLevel: SoulResonanceState['syncLevel'] = 'low';
    if (harmony > 0.8) syncLevel = 'complete';
    else if (harmony > 0.6) syncLevel = 'high';
    else if (harmony > 0.3) syncLevel = 'moderate';

    return { harmony, understanding, syncLevel };
  }
}

export const soulResonance = new SoulResonance();
