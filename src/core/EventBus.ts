/**
 * EventBus — Central Event System
 * Decouples communication between engines, services, and UI.
 * UI never calls engines directly. Engines never call UI directly.
 * Everything flows through events.
 */

// ── Event Types ──────────────────────────────────────
export type EventName =
  // App Lifecycle
  | 'APP_FOREGROUND'
  | 'APP_BACKGROUND'
  // User Interaction
  | 'USER_OPEN_APP'
  | 'USER_CLOSE_APP'
  | 'USER_START_TYPING'
  | 'USER_STOP_TYPING'
  | 'USER_SEND_MESSAGE'
  | 'USER_SILENT'
  | 'USER_FIRST_INTERACTION'
  | 'USER_CORRECT_TWIN'
  | 'USER_ACHIEVEMENT'
  // Presence & Awareness
  | 'PRESENCE_CHANGED'
  | 'AWARENESS_COMPLETE'
  | 'FIRST_CONTACT_TRIGGER'
  | 'SILENCE_START'
  | 'SILENCE_END'
  // AI & Thinking
  | 'AI_START_THINKING'
  | 'AI_COGNITIVE_PHASE'
  | 'AI_FINISH_THINKING'
  | 'AI_RESPONSE_STREAMING'
  // Emotion & Atmosphere
  | 'EMOTIONAL_STATE_CHANGED'
  | 'SPACE_ENERGY_CHANGED'
  // Memory
  | 'MEMORY_SURFACED'
  | 'MEMORY_CREATED'
  // Workspace
  | 'WORKSPACE_CHANGE_REQUESTED'
  | 'WORKSPACE_TRANSFORM_START'
  | 'WORKSPACE_TRANSFORM_COMPLETE'
  // Relationship
  | 'RELATIONSHIP_MILESTONE'
  | 'TRUST_EVENT'
  // Sensory
  | 'SENSORY_TRIGGER'
  // System
  | 'SYSTEM_FAILURE'
  | 'SYSTEM_RECOVERY';

// ── Event Payloads ───────────────────────────────────
export interface EventPayloads {
  APP_FOREGROUND: { timestamp: number };
  APP_BACKGROUND: { timestamp: number; currentState: string };
  USER_OPEN_APP: { timestamp: number };
  USER_CLOSE_APP: { timestamp: number };
  USER_START_TYPING: { timestamp: number };
  USER_STOP_TYPING: { timestamp: number };
  USER_SEND_MESSAGE: { message: string; timestamp: number };
  USER_SILENT: { duration: number };
  USER_FIRST_INTERACTION: { type: 'touch' | 'pointer' | 'focus'; timestamp: number };
  USER_CORRECT_TWIN: { correction: string; context?: string };
  USER_ACHIEVEMENT: { type: string; context?: string };
  PRESENCE_CHANGED: { from: number; to: number; trigger: string };
  AWARENESS_COMPLETE: { timestamp: number };
  FIRST_CONTACT_TRIGGER: { context: 'morning' | 'evening' | 'night' | 'returning_hours' | 'returning_day' | 'returning_week' | 'notification' | 'default'; timestamp: number };
  SILENCE_START: { level: number; reason: string };
  SILENCE_END: { reason: string };
  AI_START_THINKING: { intent?: string; confidence?: number };
  AI_COGNITIVE_PHASE: { phase: 'observe' | 'understand' | 'recall' | 'reason' | 'respond'; progress: number };
  AI_FINISH_THINKING: { response: string; confidence: number; sources?: string[] };
  AI_RESPONSE_STREAMING: { token: string; isComplete: boolean };
  EMOTIONAL_STATE_CHANGED: { emotion: string; intensity: number; valence: 'positive' | 'negative' | 'neutral' | 'mixed'; confidence: number };
  SPACE_ENERGY_CHANGED: { energy: 'tranquil' | 'warm' | 'focused' | 'energetic' | 'mysterious' | 'protective' | 'tense' | 'serene' };
  MEMORY_SURFACED: { memoryId: string; relevance: number; emotionalWeight: number };
  MEMORY_CREATED: { memoryId: string; layer: 'working' | 'context' | 'relationship' | 'life' };
  WORKSPACE_CHANGE_REQUESTED: { workspace: string; confidence: number; trigger: string };
  WORKSPACE_TRANSFORM_START: { from: string; to: string };
  WORKSPACE_TRANSFORM_COMPLETE: { to: string };
  RELATIONSHIP_MILESTONE: { previousLevel: number; newLevel: number };
  TRUST_EVENT: { type: 'earned' | 'broken' | 'recovered'; context?: string };
  SENSORY_TRIGGER: { visual?: object; auditory?: object; haptic?: object; priority: number };
  SYSTEM_FAILURE: { type: string; severity: 'low' | 'medium' | 'high' | 'critical'; fallbackAvailable: boolean };
  SYSTEM_RECOVERY: { type: string; duration: number };
}

// ── Listener Type ────────────────────────────────────
type Listener<T extends EventName> = (payload: EventPayloads[T]) => void;

// ── EventBus Implementation ──────────────────────────
class EventBusClass {
  private listeners: Map<EventName, Set<Listener<any>>> = new Map();
  private eventLog: Array<{ event: EventName; timestamp: number; payload: any }> = [];
  private readonly maxLogSize = 1000;
  private debugMode = __DEV__;

  /**
   * Subscribe to an event. Returns unsubscribe function.
   */
  on<T extends EventName>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to "${event}". Total: ${this.listeners.get(event)!.size}`);
    }

    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event once. Auto-unsubscribes after first emission.
   */
  once<T extends EventName>(event: T, listener: Listener<T>): () => void {
    const wrapper: Listener<T> = (payload) => {
      this.off(event, wrapper);
      listener(payload);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe a specific listener.
   */
  off<T extends EventName>(event: T, listener: Listener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<T extends EventName>(event: T, payload: EventPayloads[T]): void {
    // Log event
    this.logEvent(event, payload);

    // Notify listeners
    const listeners = this.listeners.get(event);
    if (listeners && listeners.size > 0) {
      if (this.debugMode) {
        console.log(`[EventBus] Emitting "${event}" to ${listeners.size} listener(s)`, payload);
      }
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`[EventBus] Error in listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event, or all events.
   */
  clear(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event.
   */
  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Get all registered event names.
   */
  registeredEvents(): EventName[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get recent event log for debugging.
   */
  getEventLog(): ReadonlyArray<{ event: EventName; timestamp: number }> {
    return this.eventLog.map(({ event, timestamp }) => ({ event, timestamp }));
  }

  /**
   * Enable or disable debug logging.
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  private logEvent(event: EventName, payload: any): void {
    this.eventLog.push({ event, timestamp: Date.now(), payload });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }
}

// ── Singleton Export ─────────────────────────────────
export const EventBus = new EventBusClass();

// Also export class for testing/mocking
export { EventBusClass };
