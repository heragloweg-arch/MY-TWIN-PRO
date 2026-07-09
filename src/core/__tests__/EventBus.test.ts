import { EventBus, EventBusClass } from '../EventBus';

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.clear();
    EventBus.setDebugMode(false);
  });

  test('should subscribe and receive events', () => {
    const listener = jest.fn();
    EventBus.on('PRESENCE_CHANGED', listener);
    EventBus.emit('PRESENCE_CHANGED', { from: 0, to: 1, trigger: 'test' });
    
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ from: 0, to: 1, trigger: 'test' });
  });

  test('should unsubscribe correctly', () => {
    const listener = jest.fn();
    const unsubscribe = EventBus.on('USER_SEND_MESSAGE', listener);
    unsubscribe();
    EventBus.emit('USER_SEND_MESSAGE', { message: 'test', timestamp: Date.now() });
    
    expect(listener).not.toHaveBeenCalled();
  });

  test('once() should auto-unsubscribe', () => {
    const listener = jest.fn();
    EventBus.once('AI_FINISH_THINKING', listener);
    
    EventBus.emit('AI_FINISH_THINKING', { response: 'test', confidence: 1.0 });
    EventBus.emit('AI_FINISH_THINKING', { response: 'test2', confidence: 0.9 });
    
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    
    EventBus.on('APP_FOREGROUND', listener1);
    EventBus.on('APP_FOREGROUND', listener2);
    EventBus.emit('APP_FOREGROUND', { timestamp: Date.now() });
    
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  test('should isolate events', () => {
    const listener = jest.fn();
    EventBus.on('USER_SILENT', listener);
    EventBus.emit('SYSTEM_FAILURE', { type: 'test', severity: 'low', fallbackAvailable: true });
    
    expect(listener).not.toHaveBeenCalled();
  });
});
