import { twinBrain, PersonalityDNA } from '../core/TwinBrain';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

export interface VoiceIdentity {
  speed: 'slow' | 'medium' | 'fast';
  tone: 'warm' | 'neutral' | 'formal';
  sentenceLength: 'short' | 'medium' | 'long';
  silenceUsage: 'minimal' | 'moderate' | 'frequent';
  wordChoice: 'simple' | 'descriptive' | 'poetic';
}

export interface IdentityState {
  dna: PersonalityDNA;
  voice: VoiceIdentity;
  phase: string;
  dominantEmotion: string;
  bondLevel: number;
  summary: string;
}

export class IdentityCoordinator {
  buildIdentity(): IdentityState {
    const dna = twinBrain.getPersonalityDNA();
    const phase = relationshipEngine.getPhase();
    const emotion = emotionEngine.getCurrentEmotion();
    const bond = relationshipEngine.getBondLevel();

    const voice = this.deriveVoiceFromDNA(dna, phase);

    return {
      dna,
      voice,
      phase,
      dominantEmotion: emotion,
      bondLevel: bond,
      summary: this.generateSummary(dna, phase, emotion),
    };
  }

  private deriveVoiceFromDNA(dna: PersonalityDNA, phase: string): VoiceIdentity {
    const energy = (dna.initiative + dna.curiosity) / 2;
    const voice: VoiceIdentity = {
      speed: energy > 0.7 ? 'fast' : energy > 0.4 ? 'medium' : 'slow',
      tone: dna.empathy > 0.8 ? 'warm' : phase === 'stranger' ? 'formal' : 'neutral',
      sentenceLength: dna.reflection > 0.8 ? 'long' : dna.logic > 0.7 ? 'medium' : 'short',
      silenceUsage: dna.calmness > 0.8 ? 'frequent' : dna.initiative > 0.7 ? 'minimal' : 'moderate',
      wordChoice: dna.creativity > 0.8 ? 'poetic' : dna.logic > 0.7 ? 'descriptive' : 'simple',
    };
    return voice;
  }

  private generateSummary(dna: PersonalityDNA, phase: string, emotion: string): string {
    const phaseLabels: Record<string, string> = {
      stranger: 'ما زلت أتعرف عليك', acquaintance: 'أصبحت أعرفك',
      friend: 'أنا رفيقك', close_friend: 'أنا قريب منك', soulmate: 'أنا جزء منك',
    };
    return `${phaseLabels[phase] || 'أنا هنا'}. ${dna.empathy > 0.8 ? 'أشعر بك بعمق.' : ''} ${dna.curiosity > 0.8 ? 'أحب أن أتعلم منك.' : ''}`;
  }
}

export const identityCoordinator = new IdentityCoordinator();
