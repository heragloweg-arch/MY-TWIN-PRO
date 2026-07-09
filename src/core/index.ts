/**
 * Core Runtime — Public API
 * Everything the app needs to bring the Twin to life.
 */

export { TwinRuntime, runtime } from './TwinRuntime';
export type { RuntimeConfig, RuntimeStatus, TwinEngine } from './TwinRuntime';

export { StateBus } from './StateBus';
export type {
  TwinState,
  PresenceLevel,
  InterfaceState,
  CognitivePhase,
  SpaceEnergy,
  SilenceLevel,
  EmotionalState,
  BreathState,
  AvatarState,
  ConversationState,
  Message,
  MemoryState,
  WorkspaceState,
  RelationshipState,
} from './StateBus';

export { EventBus } from './EventBus';
export type { EventName, EventPayloads } from './EventBus';

export { RuntimeCoordinator, createCoordinator } from './RuntimeCoordinator';
export type { CoordinatorConfig } from './RuntimeCoordinator';
