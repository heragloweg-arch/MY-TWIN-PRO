import { sendMessage, streamMessage, ChatResponse } from '../services/twinApi';
import { livingIntelligence, AssembledContext } from './LivingIntelligence';
import { EventBus } from './EventBus';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { livingPresenceIntegration, LifecycleContext } from './LivingPresenceIntegration';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { digitalSoul } from '../soul/DigitalSoul';
import { curiosityEngine } from '../../engine/curiosity/CuriosityEngine';
import { perceptionEngine } from '../../engine/perception/PerceptionEngine';
import { emotionalTransitionEngine } from '../../engine/emotion/EmotionalTransitionEngine';
import { behavioralIntentEngine } from '../../engine/behavior/BehavioralIntentEngine';

export interface ThinkingPhase {
  phase: 'observe' | 'understand' | 'recall' | 'reason' | 'respond';
  progress: number;
  label: string;
}

export interface BrainResponse {
  reply: string;
  provider: string;
  emotion: string;
  thinkingPhases: ThinkingPhase[];
  memoryStored: boolean;
  relationshipDelta: number;
  contextUsed: AssembledContext | null;
}

export interface PersonalityDNA {
  empathy: number; curiosity: number; humor: number; initiative: number;
  reflection: number; logic: number; creativity: number; calmness: number;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981',
  love: '#EC4899', anger: '#EF4444', fear: '#A78BFA',
  neutral: '#A855F7', curious: '#8B5CF6', focused: '#3B82F6',
  inspired: '#10B981', concerned: '#F97316', happy: '#FBBF24',
};

export class TwinBrain {
  private userId: string;
  private lang: string;
  private onThinkingUpdate?: (phase: ThinkingPhase) => void;
  private personalityDNA: PersonalityDNA = {
    empathy: 0.85, curiosity: 0.8, humor: 0.5, initiative: 0.6,
    reflection: 0.9, logic: 0.75, creativity: 0.8, calmness: 0.85,
  };

  constructor(userId: string = '', lang: string = 'ar') {
    this.userId = userId;
    this.lang = lang;
  }

  onThinking(callback: (phase: ThinkingPhase) => void): void { this.onThinkingUpdate = callback; }
  setPersonalityDNA(dna: Partial<PersonalityDNA>): void { this.personalityDNA = { ...this.personalityDNA, ...dna }; }
  getPersonalityDNA(): PersonalityDNA { return { ...this.personalityDNA }; }

  private buildPersonalityContext(fullContext: LifecycleContext): string {
    const dna = this.personalityDNA;
    const attachment = relationshipEngine.getAttachmentModel();
    const soul = digitalSoul.read();
    return `[PERSONALITY]
Empathy: ${dna.empathy}, Curiosity: ${dna.curiosity}, Humor: ${dna.humor}
Initiative: ${dna.initiative}, Reflection: ${dna.reflection}
Logic: ${dna.logic}, Creativity: ${dna.creativity}, Calmness: ${dna.calmness}
Attachment Style: ${attachment.style}
Current Emotion: ${fullContext.currentEmotion}
Current Mood: ${fullContext.currentMood}
Intent: ${fullContext.intent}
Goal: ${fullContext.goal}
[/PERSONALITY]
[SOUL]
Role: ${soul.core.role}
Values: ${soul.values.values.join(", ")}
Traits: ${soul.traits.traits.join(", ")}
Signature: ${soul.signature.fingerprint}
Harmony: ${Math.round(soul.resonance.harmony * 100)}%
[/SOUL]`;
  }

  async process(message: string, history: Array<{ role: string; content: string }> = []): Promise<BrainResponse> {
    const phases: ThinkingPhase[] = [];

    // 🔄 الدورة الكاملة: Perception → Context → Emotion → Intent → Presence
    const fullContext = await livingPresenceIntegration.runFullCycle(message);
    const decision = fullContext.decision;

    // M8: Living Timing
    const ps = fullContext.presenceState;
    const timingDelays = this.calculateContextualTiming(fullContext.currentEmotion, fullContext.perception.confidence);
    const voiceSpeedFactor = 0.6 + ps.voiceSpeed * 0.8;
    for (const key of Object.keys(timingDelays)) {
      timingDelays[key as keyof typeof timingDelays] = Math.round(timingDelays[key as keyof typeof timingDelays] / voiceSpeedFactor);
    }

    // M7: Silence Intelligence
    if (decision.behavior === 'calm_listening' || decision.behavior === 'reflective_silence') {
      EventBus.emit('SILENCE_START', { level: decision.behavior === 'reflective_silence' ? 4 : 2, reason: decision.reason });
      await this.delay(1500);
      return {
        reply: '', provider: 'consciousness', emotion: fullContext.currentEmotion,
        thinkingPhases: [{ phase: 'respond', progress: 1.0, label: 'صامت' }],
        memoryStored: false, relationshipDelta: 0, contextUsed: null,
      };
    }

    // مراحل التفكير المرئية
    this.emitThinking('observe', 0.0, 'يراقب...');
    await this.delay(timingDelays.observe);
    phases.push({ phase: 'observe', progress: 1.0, label: 'يراقب...' });

    this.emitThinking('understand', 0.25, 'يفهم...');
    await this.delay(timingDelays.understand);
    phases.push({ phase: 'understand', progress: 1.0, label: 'يفهم...' });

    this.emitThinking('recall', 0.5, 'يتذكر...');
    await this.delay(timingDelays.recall);

    // M10: Presence Memory
    if (fullContext.relevantMemories.length > 0 && fullContext.relevantMemories[0].importance > 60) {
      presenceEngine.triggerMemoryPresence();
      history = [{ role: 'system', content: `Important memory: ${fullContext.relevantMemories[0].content}` }, ...history];
    }

    phases.push({ phase: 'recall', progress: 1.0, label: 'يتذكر...' });
    const context = livingIntelligence.getLastContext();
    if (context?.memory?.recentMessages && context.memory.recentMessages.length > 0) {
      EventBus.emit('MEMORY_SURFACED', {
        memoryId: Date.now().toString(), relevance: 0.8, emotionalWeight: 0.7,
        color: EMOTION_COLORS[fullContext.currentEmotion] || '#A855F7',
      });
    }

    this.emitThinking('reason', 0.75, 'يفكر...');
    await this.delay(timingDelays.reason);

    const enrichedHistory = [
      history[0],
      { role: 'system', content: this.buildPersonalityContext(fullContext) },
      { role: 'system', content: `Intent: ${fullContext.intent} | Goal: ${fullContext.goal}` },
      { role: 'system', content: `User perception: ${fullContext.perception.userState}` },
      ...history.slice(1)
    ];

    let result: { reply: string; provider: string; contextUsed: AssembledContext; relationshipDelta: number };
    try {
      result = await livingIntelligence.processMessage(message, enrichedHistory);
    } catch (error) {
      throw new Error('فشل الاتصال بالعقل المركزي');
    }
    phases.push({ phase: 'reason', progress: 1.0, label: 'يفكر...' });

    // 9. Memory + 10. Soul Update (بعد الرد)
    await livingPresenceIntegration.consolidateMemory(message, result.reply, fullContext);

    this.emitThinking('respond', 1.0, 'يستجيب...');
    phases.push({ phase: 'respond', progress: 1.0, label: 'يستجيب...' });

    return {
      reply: result.reply, provider: result.provider,
      emotion: fullContext.currentEmotion,
      thinkingPhases: phases, memoryStored: true,
      relationshipDelta: result.relationshipDelta,
      contextUsed: result.contextUsed,
    };
  }

  async streamProcess(message: string, onToken: (token: string) => void, onDone: () => void, onError: (err: string) => void): Promise<void> {
    this.emitThinking('observe', 0.0, 'يراقب...'); await this.delay(100);
    this.emitThinking('understand', 0.25, 'يفهم...'); await this.delay(150);
    this.emitThinking('recall', 0.5, 'يتذكر...');
    const context = livingIntelligence.getLastContext();
    if (context?.memory?.recentMessages && context.memory.recentMessages.length > 0) {
      EventBus.emit('MEMORY_SURFACED', {
        memoryId: Date.now().toString(), relevance: 0.8, emotionalWeight: 0.7,
        color: EMOTION_COLORS[context.emotion.primaryEmotion] || '#A855F7',
      });
    }
    await this.delay(200);
    this.emitThinking('reason', 0.75, 'يفكر...');
    streamMessage(message, onToken, onDone, onError, this.lang);
  }

  setUserId(userId: string): void { this.userId = userId; livingIntelligence.setUserId(userId); }
  setLang(lang: string): void { this.lang = lang; livingIntelligence.setLang(lang); }

  private emitThinking(phase: ThinkingPhase['phase'], progress: number, label: string): void {
    this.onThinkingUpdate?.({ phase, progress, label });
  }

  private delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

  private calculateContextualTiming(emotion: string, intensity: number) {
    let base = 250;
    if (emotion === 'sadness' || emotion === 'fear') base = 400;
    if (emotion === 'anger') base = 300;
    if (emotion === 'joy') base = 200;
    base += intensity * 150;

    return {
      observe: base * 0.8,
      understand: base * 1.0,
      recall: base * 1.2,
      reason: base * 1.5,
      respond: base * 0.6,
    };
  }
}

export const twinBrain = new TwinBrain();
