import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

export interface SoulResonanceState {
  harmony: number;
  understanding: number;
  syncLevel: 'low' | 'moderate' | 'high' | 'complete';
}

export class SoulResonance {
  private state: SoulResonanceState = {
    harmony: 0.5,
    understanding: 0.5,
    syncLevel: 'moderate',
  };

  read(): SoulResonanceState {
    return { ...this.state };
  }

  updateHarmony(phase: string, bond: number, memoryCount: number): void {
    const ecology = memoryEngine.getEcologyStats();
    const emotion = emotionEngine.getCurrentEmotion();
    
    this.state.harmony = (bond / 100 + ecology.avgWeight) / 2;
    this.state.understanding = ecology.coreCount > 10 ? 0.8 : 0.5;

    if (this.state.harmony > 0.8) this.state.syncLevel = 'complete';
    else if (this.state.harmony > 0.6) this.state.syncLevel = 'high';
    else if (this.state.harmony > 0.3) this.state.syncLevel = 'moderate';
    else this.state.syncLevel = 'low';
  }
}

export const soulResonance = new SoulResonance();
