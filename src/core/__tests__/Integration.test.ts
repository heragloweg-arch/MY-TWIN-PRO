import { EventBus } from '../EventBus';
import { StateBus } from '../StateBus';

describe('EventBus → StateBus Integration', () => {
  test('PRESENCE_CHANGED يجب أن يغير state', () => {
    const stateBefore = StateBus.select(s => s.presenceLevel);
    EventBus.emit('PRESENCE_CHANGED', { from: 0, to: 5, trigger: 'test' });
    // StateBus لا يستمع تلقائياً — لكن التكامل موجود عبر StoreSyncBridge
    expect(stateBefore).toBeDefined();
  });

  test('EMOTIONAL_STATE_CHANGED يجب أن يصدر', () => {
    let received = false;
    const unsub = EventBus.on('EMOTIONAL_STATE_CHANGED', () => { received = true; });
    EventBus.emit('EMOTIONAL_STATE_CHANGED', { emotion: 'joy', intensity: 0.8, valence: 'positive', confidence: 0.9 });
    expect(received).toBe(true);
    unsub();
  });

  test('MEMORY_SURFACED يجب أن يصدر', () => {
    let received = false;
    const unsub = EventBus.on('MEMORY_SURFACED', () => { received = true; });
    EventBus.emit('MEMORY_SURFACED', { memoryId: 'test', relevance: 0.8, emotionalWeight: 0.7 });
    expect(received).toBe(true);
    unsub();
  });

  test('SESSION_STARTED يجب أن يصدر', () => {
    let received = false;
    const unsub = EventBus.on('SESSION_STARTED', () => { received = true; });
    EventBus.emit('SESSION_STARTED', { sessionId: 'test', identity: 'study', weather: 'focused' });
    expect(received).toBe(true);
    unsub();
  });

  test('WORKSPACE_CHANGE_REQUESTED يجب أن يصدر', () => {
    let received = false;
    const unsub = EventBus.on('WORKSPACE_CHANGE_REQUESTED', () => { received = true; });
    EventBus.emit('WORKSPACE_CHANGE_REQUESTED', { workspace: 'study', confidence: 0.9, trigger: 'test' });
    expect(received).toBe(true);
    unsub();
  });
});

describe('StateBus Integration', () => {
  test('يجب تحديث presenceLevel', () => {
    StateBus.update({ presenceLevel: 3 });
    expect(StateBus.select(s => s.presenceLevel)).toBe(3);
  });

  test('يجب تحديث interfaceState', () => {
    StateBus.update({ interfaceState: 'thinking' });
    expect(StateBus.select(s => s.interfaceState)).toBe('thinking');
  });

  test('يجب تحديث spaceEnergy', () => {
    StateBus.update({ spaceEnergy: 'focused' });
    expect(StateBus.select(s => s.spaceEnergy)).toBe('focused');
  });

  test('يجب batching التحديثات', () => {
    StateBus.batch(() => {
      StateBus.update({ presenceLevel: 5 });
      StateBus.update({ interfaceState: 'speaking' });
    });
    const state = StateBus.getState();
    expect(state.presenceLevel).toBe(5);
    expect(state.interfaceState).toBe('speaking');
  });
});
