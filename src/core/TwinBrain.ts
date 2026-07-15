import { sendMessage, streamMessage, ChatResponse } from '../services/twinApi';
import { livingIntelligence, AssembledContext } from './LivingIntelligence';
import { EventBus } from './EventBus';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { presenceEngine } from '../../engine/presence/PresenceEngine';
import { behavioralIntentEngine } from '../../engine/behavior/BehavioralIntentEngine';
import { perceptionEngine } from '../../engine/perception/PerceptionEngine';
import { emotionalTransitionEngine } from '../../engine/emotion/EmotionalTransitionEngine';
import { consciousnessCoordinator, Decision } from '../coordinators/ConsciousnessCoordinator';
import { digitalSoul } from '../soul/DigitalSoul';

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
  decision: Decision;
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

  private buildPersonalityContext(): string {
    const dna = this.personalityDNA;
    const attachment = relationshipEngine.getAttachmentModel();
    const emotion = emotionEngine.getCurrentEmotion();
    const soul = digitalSoul.read();
    const mood = behavioralIntentEngine.getCurrentMood();
    return `[PERSONALITY]
Empathy: ${dna.empathy}, Curiosity: ${dna.curiosity}, Humor: ${dna.humor}
Initiative: ${dna.initiative}, Reflection: ${dna.reflection}
Logic: ${dna.logic}, Creativity: ${dna.creativity}, Calmness: ${dna.calmness}
Attachment Style: ${attachment.style}
Current Emotion: ${emotion}
Current Mood: ${mood}
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
    const emotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    const decision = await consciousnessCoordinator.decide(message, emotion);

    // 🆕 2) Perception: تحليل سلوك المستخدم
    const perception = perceptionEngine.analyze(message);

    // 🆕 3) Emotional Transition: إذا كان الرد يحتاج إلى تغيير عاطفي
    if (decision.action === 'check_in' && emotion === 'neutral') {
      emotionalTransitionEngine.transitionTo('love', 0.6);
    }

    // 🆕 A) Intent قبل الحركة
    const userIntent = behavioralIntentEngine.interpretUserIntent(message);
    const behaviorDecision = await behavioralIntentEngine.decideBehavior(userIntent, message);

    // إعلام بقية النظام بالسلوك المختار
    EventBus.emit('behavior:decision', {
      userIntent,
      ...behaviorDecision,
      perception,
    });

    // M8: Living Timing
    const ps = presenceEngine.getLiveState();
    const timingDelays = this.calculateContextualTiming(emotion, intensity, decision);
    const voiceSpeedFactor = 0.6 + ps.voiceSpeed * 0.8;
    for (const key of Object.keys(timingDelays)) {
      timingDelays[key as keyof typeof timingDelays] = Math.round(timingDelays[key as keyof typeof timingDelays] / voiceSpeedFactor);
    }

    // M7: Silence Intelligence
    if (decision.action === 'stay_silent') {
      EventBus.emit('SILENCE_START', { level: 4, reason: decision.reason });
      await this.delay(1500 + (1 - ps.stability) * 2000);
      return {
        reply: '', provider: 'consciousness', emotion: 'neutral',
        thinkingPhases: [{ phase: 'respond', progress: 1.0, label: 'صامت' }],
        memoryStored: false, relationshipDelta: 0, contextUsed: null, decision,
      };
    }

    this.emitThinking('observe', 0.0, 'يراقب...');
    await this.delay(timingDelays.observe);
    phases.push({ phase: 'observe', progress: 1.0, label: 'يراقب...' });

    this.emitThinking('understand', 0.25, 'يفهم...');
    await this.delay(timingDelays.understand);
    phases.push({ phase: 'understand', progress: 1.0, label: 'يفهم...' });

    this.emitThinking('recall', 0.5, 'يتذكر...');
    await this.delay(timingDelays.recall);

    // M10: Presence Memory
    if (decision.action === 'respond_with_memory' && decision.memoryContent) {
      presenceEngine.triggerMemoryPresence();
      history = [{ role: 'system', content: `Important memory: ${decision.memoryContent}` }, ...history];
    }

    phases.push({ phase: 'recall', progress: 1.0, label: 'يتذكر...' });
    const context = livingIntelligence.getLastContext();
    if (context?.memory?.recentMessages && context.memory.recentMessages.length > 0) {
      EventBus.emit('MEMORY_SURFACED', {
        memoryId: Date.now().toString(), relevance: 0.8, emotionalWeight: 0.7,
        color: EMOTION_COLORS[context.emotion.primaryEmotion] || '#A855F7',
      });
    }

    if (decision.action === 'suggest_workspace' && decision.workspaceType) {
      EventBus.emit('WORKSPACE_CHANGE_REQUESTED', { workspace: decision.workspaceType, confidence: 0.85, trigger: 'consciousness' });
    }
    if (decision.action === 'check_in') {
      history = [{ role: 'system', content: 'Use a warm, caring tone. This is a check-in.' }, ...history];
    }

    this.emitThinking('reason', 0.75, 'يفكر...');
    await this.delay(timingDelays.reason);

    // 🆕 إضافة نية السلوك والإدراك إلى سياق الـ prompt
    const enrichedHistory = [
      history[0],
      { role: 'system', content: this.buildPersonalityContext() },
      { role: 'system', content: `Behavioral intent: ${behaviorDecision.behavior} (confidence: ${behaviorDecision.confidence})` },
      { role: 'system', content: `User perception: ${perception.userState} (suggestion: ${perception.suggestion || 'none'})` },
      ...history.slice(1)
    ];

    let result: { reply: string; provider: string; contextUsed: AssembledContext; relationshipDelta: number };
    try {
      result = await livingIntelligence.processMessage(message, enrichedHistory);
    } catch (error) {
      throw new Error('فشل الاتصال بالعقل المركزي');
    }
    phases.push({ phase: 'reason', progress: 1.0, label: 'يفكر...' });

    this.emitThinking('respond', 1.0, 'يستجيب...');
    phases.push({ phase: 'respond', progress: 1.0, label: 'يستجيب...' });

    return {
      reply: result.reply, provider: result.provider,
      emotion: result.contextUsed.emotion.primaryEmotion,
      thinkingPhases: phases, memoryStored: true,
      relationshipDelta: result.relationshipDelta,
      contextUsed: result.contextUsed, decision,
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

  private calculateContextualTiming(emotion: string, intensity: number, decision: Decision) {
    let base = 250;
    if (emotion === 'sadness' || emotion === 'fear') base = 400;
    if (emotion === 'anger') base = 300;
    if (emotion === 'joy') base = 200;
    base += intensity * 150;
    if (decision.action === 'stay_silent') base += 300;

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
