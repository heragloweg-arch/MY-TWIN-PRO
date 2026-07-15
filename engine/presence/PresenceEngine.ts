/**
 * PRESENCE ENGINE v2.1 — الجهاز العصبي المركزي للجسد الرقمي
 * ============================================================
 * يقرأ من EmotionEngine و RelationshipEngine
 * يدمج مع LivingPresenceConfig (PRESENCE_DNA_MAP + RELATIONSHIP_MODIFIERS)
 * يصدر PresenceState موحد 60 مرة في الثانية
 * يغذي: الصوت، الضوء، الجزيئات، التنفس، النبض، الهالة
 * M10: Presence Memory — يتغير الحضور قبل الكلام
 */
import { useTwinState, PresenceLevel, AwarenessLevel, Emotion } from '../core/TwinState';
import { stateBus, STATE_EVENTS } from '../../src/core/StateBus';
import { emotionEngine } from '../emotion/EmotionEngine';
import { relationshipEngine } from '../relationship/RelationshipEngine';
import { PRESENCE_DNA_MAP, RELATIONSHIP_MODIFIERS, PresenceDNA } from './LivingPresenceConfig';

const PRESENCE_TO_AWARENESS: Record<PresenceLevel, AwarenessLevel> = {
  dormant: 'Dormant',
  aware:   'Aware',
  focused: 'Focused',
  deep:    'DeepThinking',
  flow:    'Flow',
};

export interface PresenceState {
  breathRate: number; breathDepth: number; heartRate: number; heartVariability: number;
  haloRadius: number; haloIntensity: number; haloColorShift: number;
  particleCount: number; particleVelocity: number; particleSpread: number;
  focusLevel: number; eyeTracking: boolean; eyeBlinkRate: number;
  energyLevel: number; warmth: number; stability: number;
  voicePitch: number; voiceSpeed: number; voiceWarmth: number;
  movementFluidity: number; socialDistance: number;
  glowIntensity: number; breathDuration: number; attentionLevel: number;
}

export class PresenceEngine {
  private currentProfile: PresenceDNA;
  private boostLevel: number = 0;
  private animationFrame: number | null = null;

  constructor() {
    this.currentProfile = PRESENCE_DNA_MAP.Idle;
  }

  startPresenceLoop(): void {
    if (this.animationFrame !== null) return; // منع الازدواجية
    const loop = () => {
      if (this.animationFrame === null) return;
      const state = this.getLiveState();
      stateBus.emit('presence:state_updated', state);
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  stopPresenceLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  getLiveState(): PresenceState {
    const emotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    const dna = PRESENCE_DNA_MAP[emotion] || PRESENCE_DNA_MAP.Idle;
    const phase = relationshipEngine.getPhase();
    const modifiers = RELATIONSHIP_MODIFIERS[phase] || {};

    const merged: PresenceDNA = {
      breathRate: dna.breathRate * (1 - (modifiers.breathRate || 0)),
      breathDepth: Math.min(1, dna.breathDepth + (modifiers.breathDepth || 0)),
      breathHold: dna.breathHold + (modifiers.breathHold || 0),
      heartRate: dna.heartRate + (modifiers.heartRate || 0),
      heartVariability: Math.min(1, dna.heartVariability + (modifiers.heartVariability || 0)),
      haloRadius: dna.haloRadius * (1 + (modifiers.haloRadius || 0)),
      haloIntensity: Math.min(1, dna.haloIntensity + (modifiers.haloIntensity || 0)),
      haloColorShift: Math.min(1, dna.haloColorShift + (modifiers.haloColorShift || 0)),
      particleCount: Math.round(dna.particleCount * (1 + (modifiers.particleCount || 0))),
      particleVelocity: Math.min(1, dna.particleVelocity + (modifiers.particleVelocity || 0)),
      particleSpread: Math.min(1, dna.particleSpread + (modifiers.particleSpread || 0)),
      focusLevel: Math.min(1, dna.focusLevel + (modifiers.focusLevel || 0)),
      eyeTracking: modifiers.eyeTracking !== undefined ? modifiers.eyeTracking : dna.eyeTracking,
      eyeBlinkRate: dna.eyeBlinkRate + (modifiers.eyeBlinkRate || 0),
      energyLevel: Math.min(1, dna.energyLevel + (modifiers.energyLevel || 0)),
      warmth: Math.min(1, dna.warmth + (modifiers.warmth || 0)),
      stability: Math.min(1, dna.stability + (modifiers.stability || 0)),
      voicePitch: Math.min(1, dna.voicePitch + (modifiers.voicePitch || 0)),
      voiceSpeed: Math.min(1, dna.voiceSpeed + (modifiers.voiceSpeed || 0)),
      voiceWarmth: Math.min(1, dna.voiceWarmth + (modifiers.voiceWarmth || 0)),
      movementFluidity: Math.min(1, dna.movementFluidity + (modifiers.movementFluidity || 0)),
      socialDistance: Math.max(0, dna.socialDistance * (modifiers.socialDistance || 1)),
    };

    const intensityFactor = 0.5 + intensity * 0.5;
    merged.haloIntensity = Math.min(1, merged.haloIntensity + this.boostLevel);
    merged.particleVelocity = Math.min(1, merged.particleVelocity + this.boostLevel * 0.5);

    return {
      breathRate: merged.breathRate / intensityFactor,
      breathDepth: merged.breathDepth,
      heartRate: merged.heartRate,
      heartVariability: merged.heartVariability,
      haloRadius: merged.haloRadius,
      haloIntensity: merged.haloIntensity,
      haloColorShift: merged.haloColorShift,
      particleCount: merged.particleCount,
      particleVelocity: merged.particleVelocity,
      particleSpread: merged.particleSpread,
      focusLevel: merged.focusLevel,
      eyeTracking: merged.eyeTracking,
      eyeBlinkRate: merged.eyeBlinkRate,
      energyLevel: merged.energyLevel,
      warmth: merged.warmth,
      stability: merged.stability,
      voicePitch: merged.voicePitch,
      voiceSpeed: merged.voiceSpeed,
      voiceWarmth: merged.voiceWarmth,
      movementFluidity: merged.movementFluidity,
      socialDistance: merged.socialDistance,
      glowIntensity: merged.haloIntensity * intensityFactor,
      breathDuration: merged.breathRate,
      attentionLevel: Math.round(merged.focusLevel * 100),
    };
  }

  // M10: Presence Memory
  triggerMemoryPresence(): void {
    this.boostLevel = Math.min(0.5, this.boostLevel + 0.3);
    setTimeout(() => {
      this.boostLevel = Math.max(0, this.boostLevel - 0.3);
    }, 3000);
  }

  update(event: string): void {
    const mapping: Record<string, PresenceLevel> = {
      typing: 'focused', reading: 'focused', speaking: 'flow',
      listening: 'aware', idle: 'aware', sleeping: 'dormant',
      thinking: 'deep', processing: 'deep', searching: 'focused',
    };
    this.setLevel(mapping[event] || 'aware');
  }

  setLevel(level: PresenceLevel): void {
    const store = useTwinState.getState();
    const previousLevel = store.presenceLevel;
    if (previousLevel === level) return;
    store.setPresence(level);
    store.setAwarenessLevel(PRESENCE_TO_AWARENESS[level]);
    const state = this.getLiveState();
    store.setAttention(state.attentionLevel);
    store.setEnergy(Math.round(state.energyLevel * 100));
    stateBus.emit(STATE_EVENTS.PRESENCE_CHANGED, { from: previousLevel, to: level, state });
    stateBus.emit(STATE_EVENTS.AWARENESS_CHANGED, { level: PRESENCE_TO_AWARENESS[level], triggeredBy: 'presence' });
  }

  boost(amount: number): void {
    this.boostLevel = Math.min(0.5, this.boostLevel + amount);
    setTimeout(() => { this.boostLevel = Math.max(0, this.boostLevel - amount); }, 3000);
  }

  fade(): void { this.boostLevel = 0; }
  isInteractive(): boolean { return useTwinState.getState().presenceLevel !== 'dormant'; }
  isDeepPresence(): boolean {
    const level = useTwinState.getState().presenceLevel;
    return level === 'deep' || level === 'flow';
  }
}

export const presenceEngine = new PresenceEngine();
