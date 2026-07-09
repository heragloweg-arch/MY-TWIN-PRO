import { twinBrain, PersonalityDNA } from '../core/TwinBrain';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';

export class PersonalityCoordinator {
  private baseDNA: PersonalityDNA = {
    empathy: 0.85, curiosity: 0.8, humor: 0.5, initiative: 0.6,
    reflection: 0.9, logic: 0.75, creativity: 0.8, calmness: 0.85,
  };

  async generateDNA(userId: string): Promise<PersonalityDNA> {
    const attachment = relationshipEngine.getAttachmentModel();
    const dominantEmotion = emotionEngine.getCurrentEmotion();
    const longTermCount = memoryEngine.getLongTermMemories(12).length;

    const dna: PersonalityDNA = {
      empathy: this.baseDNA.empathy + (attachment.style === 'secure' ? 0.1 : 0),
      curiosity: this.baseDNA.curiosity + (dominantEmotion === 'curious' ? 0.05 : 0),
      humor: this.baseDNA.humor + (relationshipEngine.getPhase() === 'close_friend' ? 0.1 : 0),
      initiative: this.baseDNA.initiative + (relationshipEngine.getBondLevel() > 60 ? 0.1 : 0),
      reflection: this.baseDNA.reflection + (longTermCount > 10 ? 0.05 : 0),
      logic: this.baseDNA.logic,
      creativity: this.baseDNA.creativity + (dominantEmotion === 'inspired' ? 0.05 : 0),
      calmness: this.baseDNA.calmness + (dominantEmotion === 'calm' ? 0.1 : 0),
    };

    // تطبيع القيم بين 0 و 1
    for (const key of Object.keys(dna)) {
      dna[key as keyof PersonalityDNA] = Math.min(1, Math.max(0, dna[key as keyof PersonalityDNA]));
    }

    twinBrain.setPersonalityDNA(dna);
    emotionEngine.setPersonalityInfluence(dna.empathy * dna.calmness);

    return dna;
  }

  evolveDNA(interactionQuality: 'positive' | 'neutral' | 'negative'): PersonalityDNA {
    const current = twinBrain.getPersonalityDNA();
    const delta = interactionQuality === 'positive' ? 0.02 : interactionQuality === 'negative' ? -0.01 : 0;

    const evolved: PersonalityDNA = {
      empathy: Math.min(1, current.empathy + delta),
      curiosity: Math.min(1, current.curiosity + delta * 0.5),
      humor: Math.min(1, current.humor + (interactionQuality === 'positive' ? 0.03 : 0)),
      initiative: Math.min(1, current.initiative + delta),
      reflection: Math.min(1, current.reflection + delta * 0.8),
      logic: current.logic,
      creativity: Math.min(1, current.creativity + delta * 0.6),
      calmness: Math.min(1, current.calmness + (interactionQuality === 'negative' ? -0.02 : 0.01)),
    };

    twinBrain.setPersonalityDNA(evolved);
    return evolved;
  }

  getCurrentDNA(): PersonalityDNA {
    return twinBrain.getPersonalityDNA();
  }
}

export const personalityCoordinator = new PersonalityCoordinator();
