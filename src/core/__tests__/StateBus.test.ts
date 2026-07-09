import { StateBus, StateBusClass, TwinState } from '../StateBus';

describe('StateBus', () => {
  beforeEach(() => {
    StateBus.reset();
  });

  test('should start with default state', () => {
    const state = StateBus.getState();
    expect(state.presenceLevel).toBe(0);
    expect(state.interfaceState).toBe('dormant');
    expect(state.isAwakening).toBe(false);
  });

  test('should update state partially', () => {
    StateBus.update({ presenceLevel: 5 });
    expect(StateBus.getState().presenceLevel).toBe(5);
    // Other state should remain
    expect(StateBus.getState().interfaceState).toBe('dormant');
  });

  test('should notify subscribers on change', () => {
    const subscriber = jest.fn();
    StateBus.subscribe(subscriber);
    StateBus.update({ presenceLevel: 3 });
    
    expect(subscriber).toHaveBeenCalledTimes(1);
    const newState: TwinState = subscriber.mock.calls[0][0];
    const prevState: TwinState = subscriber.mock.calls[0][1];
    expect(newState.presenceLevel).toBe(3);
    expect(prevState.presenceLevel).toBe(0);
  });

  test('should batch updates', () => {
    const subscriber = jest.fn();
    StateBus.subscribe(subscriber);
    
    StateBus.batch(() => {
      StateBus.update({ presenceLevel: 4 });
      StateBus.update({ interfaceState: 'speaking' });
    });
    
    // Should only emit once for the batch
    expect(subscriber).toHaveBeenCalledTimes(1);
    const state: TwinState = subscriber.mock.calls[0][0];
    expect(state.presenceLevel).toBe(4);
    expect(state.interfaceState).toBe('speaking');
  });

  test('selector subscription should only fire on relevant change', () => {
    const selector = (s: TwinState) => s.presenceLevel;
    const subscriber = jest.fn();
    
    StateBus.subscribeTo(selector, subscriber);
    
    // This changes presenceLevel — should fire
    StateBus.update({ presenceLevel: 2 });
    expect(subscriber).toHaveBeenCalledTimes(1);
    
    // This does NOT change presenceLevel — should NOT fire
    StateBus.update({ interfaceState: 'attentive' });
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  test('reset should restore defaults', () => {
    StateBus.update({ presenceLevel: 9 });
    StateBus.reset();
    expect(StateBus.getState().presenceLevel).toBe(0);
  });

  test('select should return slice', () => {
    const level = StateBus.select(s => s.presenceLevel);
    expect(level).toBe(0);
  });
});
