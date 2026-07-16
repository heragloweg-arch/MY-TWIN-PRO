import { SoulCoreState, soulCore } from './SoulCore';
import { SoulValuesState, soulValues } from './SoulValues';
import { SoulTraitsState, soulTraits } from './SoulTraits';
import { SoulBondsState, soulBonds } from './SoulBonds';
import { SoulTimelineState, soulTimeline } from './SoulTimeline';
import { SoulSignatureState, soulSignature } from './SoulSignature';
import { SoulResonanceState, soulResonance } from './SoulResonance';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';

export interface DigitalSoulState {
  core: SoulCoreState;
  values: SoulValuesState;
  traits: SoulTraitsState;
  bonds: SoulBondsState;
  timeline: SoulTimelineState;
  signature: SoulSignatureState;
  resonance: SoulResonanceState;
  lastUpdated: string;
}

export class DigitalSoul {
  read(): DigitalSoulState {
    return {
      core: soulCore.read(),
      values: soulValues.read(),
      traits: soulTraits.read(),
      bonds: soulBonds.read(),
      timeline: soulTimeline.read(),
      signature: soulSignature.read(),
      resonance: soulResonance.read(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * تطور الروح بناءً على الحالة العاطفية والعلاقة والذاكرة.
   * يُستدعى بعد كل 10 رسائل في الجلسة.
   */
  evolve(): void {
    const phase = relationshipEngine.getPhase();
    const bond = relationshipEngine.getBondLevel();
    const emotion = emotionEngine.getCurrentEmotion();
    const memoryCount = memoryEngine.getMemoryCount();

    // تحديث قيم الروح بناءً على الحالة الحالية
    soulCore.updateRole(phase, bond);
    soulValues.updateFromEmotion(emotion);
    soulResonance.updateHarmony(phase, bond, memoryCount);
  }
}

export const digitalSoul = new DigitalSoul();
