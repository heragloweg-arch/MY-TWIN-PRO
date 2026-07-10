import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { identityEngine } from '../coordinators/IdentityEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

export interface SoulSignatureState {
  fingerprint: string;
  warmth: number;
  depth: number;
  energy: number;
  uniqueness: string;
}

export class SoulSignature {
  read(): SoulSignatureState {
    const dna = personalityCoordinator.getCurrentDNA();
    const identity = identityEngine.buildIdentity();
    const emotion = emotionEngine.getCurrentEmotion();

    const warmth = (dna.empathy + dna.humor) / 2;
    const depth = (dna.reflection + dna.logic) / 2;
    const energy = dna.initiative;

    return {
      fingerprint: `${identity.role}-${Math.round(warmth * 100)}-${Math.round(depth * 100)}`,
      warmth,
      depth,
      energy,
      uniqueness: `دافئ: ${Math.round(warmth * 100)}% | عميق: ${Math.round(depth * 100)}%`,
    };
  }
}

export const soulSignature = new SoulSignature();
