import { stateBus } from '../../src/core/StateBus';
import { EventBus } from '../../src/core/EventBus';

export interface PresenceState {
  emotion: string;
  intensity: number;
  energy: number;
  warmth: number;
  halo_color: string;
  breath_rate: number;
  voice_tone: string;
  silence_before_speaking_ms: number;
  focus_level: number;
  is_speaking: boolean;
  is_thinking: boolean;
  // Advanced fields
  attentionDirection: 'user' | 'memory' | 'internal' | 'none';
  consciousnessDrift: number;
  memoryEchoIntensity: number;
  intentField: { intent: string; color: string; intensity: number } | null;
  transitionPath: string[];
}

export class PresenceEngine {
  private animationFrame: number | null = null;
  private lastBaseState: PresenceState | null = null;
  private transitionQueue: string[] = [];
  private transitionStep = 0;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private isUserTyping = false;
  private memoryEchoDecay = 0;

  constructor() {
    // الاستماع لأحداث الكتابة
    EventBus.on('USER_START_TYPING', () => { this.isUserTyping = true; });
    EventBus.on('USER_STOP_TYPING', () => { this.isUserTyping = false; });
    EventBus.on('MEMORY_SURFACED', () => { this.memoryEchoDecay = 1.0;
    // ✅ استرجاع الذاكرة العاطفية: يصدر حدثًا خاصًا مع لون العاطفة القديمة
    EventBus.on('EMOTIONAL_MEMORY_SURFACED', (payload: any) => {
      this.memoryEchoDecay = 1.0;
      if (this.lastBaseState) {
        this.lastBaseState.memoryEchoIntensity = 1.0;
        // استخدام لون العاطفة القديمة للحظة
        if (payload?.emotion) {
          this.lastBaseState.halo_color = this.getEmotionColor(payload.emotion);
        }
      }
    }); });
  }

  startPresenceLoop(): void {
    if (this.animationFrame !== null) return;
    const loop = () => {
      if (this.animationFrame === null) return;
      this.updateDynamicFields();
      const state = this.getLiveState();
      if (state) stateBus.emit('presence:state_updated', state);
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

  private updateDynamicFields(): void {
    if (!this.lastBaseState) return;

    // Attention Direction
    if (this.isUserTyping) {
      this.lastBaseState.attentionDirection = 'user';
    } else if (this.memoryEchoDecay > 0.01) {
      this.lastBaseState.attentionDirection = 'memory';
    } else if (this.lastBaseState.is_thinking) {
      this.lastBaseState.attentionDirection = 'internal';
    } else {
      this.lastBaseState.attentionDirection = 'none';
    }

    // Consciousness Drift (slow sine wave)
    this.lastBaseState.consciousnessDrift = Math.sin(Date.now() / 5000) * 0.5 + 0.5;

    // Memory Echo Decay
    this.memoryEchoDecay *= 0.98;
    this.lastBaseState.memoryEchoIntensity = this.memoryEchoDecay;

    // Intent Field (من transitionPath)
    if (this.transitionQueue.length > 0) {
      const currentEmotion = this.transitionQueue[this.transitionStep] || this.lastBaseState.emotion;
      this.lastBaseState.intentField = {
        intent: currentEmotion,
        color: this.getEmotionColor(currentEmotion),
        intensity: 0.5,
      };
    } else {
      this.lastBaseState.intentField = null;
    }
  }

  private getEmotionColor(emotion: string): string {
    const colors: Record<string, string> = {
      joy: '#F59E0B', sadness: '#3B82F6', calm: '#10B981', love: '#EC4899',
      anger: '#EF4444', fear: '#A78BFA', neutral: '#A855F7',
      reflection: '#6366F1', hope: '#14B8A6', comfort: '#EC4899',
    };
    return colors[emotion] || '#A855F7';
  }

  getLiveState(): PresenceState | null {
    return this.lastBaseState;
  }

  applyPresenceState(state: PresenceState): void {
    this.lastBaseState = { ...state };
  }

  // تفعيل مسار انتقال عاطفي يعتمد على DNA
  startEmotionalTransition(from: string, to: string, dna: Record<string, number>): void {
    const path = this.buildTransitionPath(from, to, dna);
    this.transitionQueue = path;
    this.transitionStep = 0;
    this.advanceTransition();
  }

  private buildTransitionPath(from: string, to: string, dna: Record<string, number>): string[] {
    // المسارات حسب الشخصية
    if (from === 'sadness' && to === 'joy') {
      if (dna.calmness > 0.7) return ['sadness', 'reflection', 'calm', 'acceptance', 'peace'];
      if (dna.humor > 0.6) return ['sadness', 'thought', 'smile', 'optimism', 'joy'];
      if (dna.empathy > 0.9) return ['sadness', 'understanding', 'warmth', 'comfort', 'love'];
      return ['sadness', 'reflection', 'comfort', 'hope', 'joy'];
    }
    if (from === 'anger' && to === 'calm') {
      return ['anger', 'listening', 'calming', 'neutral'];
    }
    return [from, to];
  }

  private advanceTransition(): void {
    if (this.transitionQueue.length === 0) return;
    if (this.transitionStep < this.transitionQueue.length - 1) {
      this.transitionTimer = setTimeout(() => {
        this.transitionStep++;
        if (this.lastBaseState) {
          this.lastBaseState.emotion = this.transitionQueue[this.transitionStep];
        }
        this.advanceTransition();
      }, 800 + Math.random() * 600);
    } else {
      this.transitionQueue = [];
      this.transitionStep = 0;
    }
  }

  setLevel(level: number): void {}
  boost(amount: number): void {}
  fade(): void {}
}

export const presenceEngine = new PresenceEngine();
