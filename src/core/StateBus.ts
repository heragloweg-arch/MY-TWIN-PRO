/**
 * StateBus — Central Observable State
 * Single source of truth for all Twin state.
 * Renderers read from StateBus. Engines write to StateBus.
 * No renderer ever writes state directly.
 */

import { EventBus } from './EventBus';

// ── Core State Types ─────────────────────────────────
export type PresenceLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CognitivePhase = 'idle' | 'observe' | 'understand' | 'recall' | 'reason' | 'respond';

export type InterfaceState =
  | 'dormant'
  | 'aware'
  | 'attentive'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'remembering'
  | 'learning'
  | 'reflecting'
  | 'proactive'
  | 'twin';

export type SpaceEnergy = 'tranquil' | 'warm' | 'focused' | 'energetic' | 'mysterious' | 'protective' | 'tense' | 'serene';

export type SilenceLevel = 0 | 1 | 2 | 3 | 4 | 5;

// ── Emotional State ──────────────────────────────────
export interface EmotionalState {
  primaryEmotion: string;
  intensity: number; // 0.0 to 1.0
  valence: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  duration: number; // ms
  trend: 'improving' | 'worsening' | 'stable';
}

// ── Breath State ─────────────────────────────────────
export interface BreathState {
  phase: number; // 0 → 1 → 0 (sine wave)
  duration: number; // ms for full cycle
  intensity: number; // 0.0 to 1.0
  isHolding: boolean;
}

// ── Avatar State ─────────────────────────────────────
export interface AvatarState {
  eyesOpen: boolean;
  gazeTarget: 'user' | 'input' | 'memory' | 'internal' | 'none';
  expression: 'neutral' | 'warm' | 'focused' | 'surprised' | 'concerned' | 'joyful';
  posture: 'centered' | 'forward' | 'reflective' | 'attentive';
  blinkProgress: number; // 0 → 1 → 0 for blink animation
  nextBlinkIn: number; // ms until next blink
}

// ── Conversation State ───────────────────────────────
export interface ConversationState {
  messages: Message[];
  isProcessing: boolean;
  currentCognitivePhase: CognitivePhase;
  phaseProgress: number; // 0.0 to 1.0 within current phase
}

export interface Message {
  id: string;
  sender: 'user' | 'twin';
  text: string;
  timestamp: number;
  confidence?: number;
  source?: 'memory' | 'inference' | 'knowledge' | 'unknown';
}

// ── Memory State ─────────────────────────────────────
export interface MemoryState {
  lastSurfacedId: string | null;
  pendingSurfacing: boolean;
  recentContext: string | null;
}

// ── Workspace State ──────────────────────────────────
export interface WorkspaceState {
  active: string | null;
  previous: string | null;
  isTransforming: boolean;
  transformProgress: number; // 0.0 to 1.0
  spatialMemory: Record<string, any>;
}

// ── Relationship State ───────────────────────────────
export interface RelationshipState {
  bondLevel: number; // 0-5
  attachmentStyle: 'secure' | 'anxious' | 'avoidant' | 'disorganized' | 'unknown';
  trustScore: number; // 0.0 to 1.0
  firstContactTimestamp: number | null;
}

// ── Complete Twin State ──────────────────────────────
export interface TwinState {
  // Core
  presenceLevel: PresenceLevel;
  interfaceState: InterfaceState;
  isAwakening: boolean;
  awakeningPhase: 'presence' | 'awareness' | 'mutual_silence' | 'first_contact' | 'complete';

  // Breath
  breath: BreathState;

  // Avatar
  avatar: AvatarState;

  // Emotion
  emotion: EmotionalState;

  // Space
  spaceEnergy: SpaceEnergy;
  silenceLevel: SilenceLevel;

  // Conversation
  conversation: ConversationState;

  // Memory
  memory: MemoryState;

  // Workspace
  workspace: WorkspaceState;

  // Relationship
  relationship: RelationshipState;

  // System
  isOnline: boolean;
  isDegraded: boolean;
  uptime: number; // ms since runtime started
}

// ── Default State ────────────────────────────────────
const DEFAULT_STATE: TwinState = {
  presenceLevel: 0,
  interfaceState: 'dormant',
  isAwakening: false,
  awakeningPhase: 'presence',

  breath: {
    phase: 0,
    duration: 8000,
    intensity: 0.15,
    isHolding: false,
  },

  avatar: {
    eyesOpen: false,
    gazeTarget: 'none',
    expression: 'neutral',
    posture: 'centered',
    blinkProgress: 0,
    nextBlinkIn: 5000,
  },

  emotion: {
    primaryEmotion: 'neutral',
    intensity: 0,
    valence: 'neutral',
    confidence: 1.0,
    duration: 0,
    trend: 'stable',
  },

  spaceEnergy: 'tranquil',
  silenceLevel: 0,

  conversation: {
    messages: [],
    isProcessing: false,
    currentCognitivePhase: 'idle',
    phaseProgress: 0,
  },

  memory: {
    lastSurfacedId: null,
    pendingSurfacing: false,
    recentContext: null,
  },

  workspace: {
    active: null,
    previous: null,
    isTransforming: false,
    transformProgress: 0,
    spatialMemory: {},
  },

  relationship: {
    bondLevel: 0,
    attachmentStyle: 'unknown',
    trustScore: 0.5,
    firstContactTimestamp: null,
  },

  isOnline: true,
  isDegraded: false,
  uptime: 0,
};

// ── Subscriber Type ──────────────────────────────────
type StateSubscriber = (state: TwinState, prevState: TwinState) => void;
type StateSelector<T> = (state: TwinState) => T;
type SelectorSubscriber<T> = (value: T, prevValue: T) => void;

// ── StateBus Implementation ──────────────────────────
class StateBusClass {
  private state: TwinState;
  private prevState: TwinState;
  private subscribers: Set<StateSubscriber> = new Set();
  private selectorSubscribers: Map<StateSelector<any>, Set<SelectorSubscriber<any>>> = new Map();
  private updateQueue: Partial<TwinState>[] = [];
  private isBatching = false;
  private debugMode = __DEV__;

  constructor() {
    this.state = { ...DEFAULT_STATE };
    this.prevState = { ...DEFAULT_STATE };
  }

  /**
   * Get current state (readonly).
   */
  getState(): Readonly<TwinState> {
    return this.state;
  }

  /**
   * Get a slice of state using a selector.
   */
  select<T>(selector: StateSelector<T>): T {
    return selector(this.state);
  }

  /**
   * Update state partially. Changes are batched and emitted together.
   */
  update(partial: Partial<TwinState>): void {
    this.updateQueue.push(partial);

    if (!this.isBatching) {
      this.flushUpdates();
    }
  }

  /**
   * Batch multiple updates together. Only one emission.
   */
  batch(updater: () => void): void {
    this.isBatching = true;
    try {
      updater();
    } finally {
      this.isBatching = false;
      this.flushUpdates();
    }
  }

  /**
   * Subscribe to all state changes.
   */
  subscribe(subscriber: StateSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Subscribe to a specific slice of state.
   */
  subscribeTo<T>(selector: StateSelector<T>, subscriber: SelectorSubscriber<T>): () => void {
    if (!this.selectorSubscribers.has(selector)) {
      this.selectorSubscribers.set(selector, new Set());
    }
    this.selectorSubscribers.get(selector)!.add(subscriber);

    return () => {
      const subs = this.selectorSubscribers.get(selector);
      if (subs) {
        subs.delete(subscriber);
        if (subs.size === 0) {
          this.selectorSubscribers.delete(selector);
        }
      }
    };
  }

  /**
   * Reset state to defaults.
   */
  reset(): void {
    this.prevState = { ...this.state };
    this.state = { ...DEFAULT_STATE };
    this.emitChanges();
  }

  /**
   * Set debug mode.
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // ── Private ──────────────────────────────────────

  private flushUpdates(): void {
    if (this.updateQueue.length === 0) return;

    this.prevState = { ...this.state };

    // Apply all queued updates
    for (const partial of this.updateQueue) {
      this.state = { ...this.state, ...partial };
    }
    this.updateQueue = [];

    this.emitChanges();
  }

  private emitChanges(): void {
    if (this.debugMode) {
      const changes = this.detectChanges();
      if (changes.length > 0) {
        console.log(`[StateBus] State changed: ${changes.join(', ')}`);
      }
    }

    // Notify full subscribers
    this.subscribers.forEach((sub) => {
      try {
        sub(this.state, this.prevState);
      } catch (error) {
        console.error('[StateBus] Error in subscriber:', error);
      }
    });

    // Notify selector subscribers
    this.selectorSubscribers.forEach((subs, selector) => {
      const currentValue = selector(this.state);
      const prevValue = selector(this.prevState);
      if (!Object.is(currentValue, prevValue)) {
        subs.forEach((sub) => {
          try {
            sub(currentValue, prevValue);
          } catch (error) {
            console.error('[StateBus] Error in selector subscriber:', error);
          }
        });
      }
    });
  }

  private detectChanges(): string[] {
    const changes: string[] = [];
    const s = this.state as any;
    const p = this.prevState as any;
    for (const key of Object.keys(s)) {
      if (!Object.is(s[key], p[key])) {
        changes.push(key);
      }
    }
    return changes;
  }
}

// ── Singleton Export ─────────────────────────────────
export const StateBus = new StateBusClass();
export { StateBusClass };
