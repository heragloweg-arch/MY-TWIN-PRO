import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';

export interface SoulTraitsState {
  traits: string[];
  dominantTrait: string;
  stability: number;
}

export class SoulTraits {
  read(): SoulTraitsState {
    const dna = personalityCoordinator.getCurrentDNA();
    const ecology = memoryEngine.getEcologyStats();
    const emotion = emotionEngine.getCurrentEmotion();

    const traits: string[] = [];
    if (dna.empathy > 0.8) traits.push('Patient');
    if (dna.curiosity > 0.8) traits.push('Curious');
    if (dna.calmness > 0.8) traits.push('Protective');
    if (dna.reflection > 0.8) traits.push('Reflective');
    if (dna.humor > 0.6) traits.push('Playful');
    if (traits.length === 0) traits.push('Balanced');

    return {
      traits,
      dominantTrait: traits[0],
      stability: ecology.avgWeight,
    };
  }
}

export const soulTraits = new SoulTraits();
