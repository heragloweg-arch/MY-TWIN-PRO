import { SoulCoreState, soulCore } from './SoulCore';
import { SoulValuesState, soulValues } from './SoulValues';
import { SoulTraitsState, soulTraits } from './SoulTraits';
import { SoulBondsState, soulBonds } from './SoulBonds';
import { SoulTimelineState, soulTimeline } from './SoulTimeline';
import { SoulSignatureState, soulSignature } from './SoulSignature';
import { SoulResonanceState, soulResonance } from './SoulResonance';

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
}

export const digitalSoul = new DigitalSoul();
