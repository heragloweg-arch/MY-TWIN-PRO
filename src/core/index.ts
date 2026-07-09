export { TwinRuntime, runtime } from './TwinRuntime';
export type { RuntimeConfig, RuntimeStatus, TwinEngine } from './TwinRuntime';

export { StateBus } from './StateBus';
export type {
  TwinState, PresenceLevel, InterfaceState, CognitivePhase,
  SpaceEnergy, SilenceLevel, EmotionalState, BreathState,
  AvatarState, ConversationState, Message, MemoryState,
  WorkspaceState, RelationshipState,
} from './StateBus';

export { EventBus } from './EventBus';
export type { EventName, EventPayloads } from './EventBus';

export { RuntimeCoordinator, createCoordinator } from './RuntimeCoordinator';
export type { CoordinatorConfig } from './RuntimeCoordinator';

export { StoreSyncBridge, storeSyncBridge } from './StoreSyncBridge';

export { AudioEngine, audioEngine } from './AudioEngine';

export { TwinBrain, twinBrain } from './TwinBrain';
export type { ThinkingPhase, BrainResponse } from './TwinBrain';

export { LivingIntelligence, livingIntelligence } from './LivingIntelligence';
export type { AssembledContext } from './LivingIntelligence';

export { performanceMonitor } from './PerformanceMonitor';
