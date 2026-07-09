import { TwinRuntime } from '../TwinRuntime';
import { StateBus } from '../StateBus';
import { EventBus } from '../EventBus';

describe('TwinRuntime', () => {
  let runtime: TwinRuntime;

  beforeEach(() => {
    StateBus.reset();
    EventBus.clear();
    runtime = new TwinRuntime({ autoStart: false, enableDebugLogging: false });
  });

  afterEach(() => {
    runtime.stop();
  });

  test('should start and transition to Aware', async () => {
    await runtime.start();
    expect(runtime.isRunning()).toBe(true);
    expect(StateBus.select(s => s.presenceLevel)).toBe(1);
    expect(StateBus.select(s => s.interfaceState)).toBe('aware');
  });

  test('should pause and resume', async () => {
    await runtime.start();
    runtime.pause();
    expect(runtime.getStatus()).toBe('paused');
    expect(StateBus.select(s => s.presenceLevel)).toBe(0);
    expect(StateBus.select(s => s.interfaceState)).toBe('dormant');

    runtime.resume();
    expect(runtime.isRunning()).toBe(true);
    expect(StateBus.select(s => s.presenceLevel)).toBe(1);
    expect(StateBus.select(s => s.interfaceState)).toBe('aware');
  });

  test('should set presence level correctly', async () => {
    await runtime.start();
    runtime.setPresence(5, 'test');
    expect(StateBus.select(s => s.presenceLevel)).toBe(5);
  });

  test('should register and start engines', async () => {
    const mockEngine = {
      name: 'TestEngine',
      initialize: jest.fn().mockResolvedValue(undefined),
      start: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      getStatus: jest.fn().mockReturnValue('idle'),
    };

    await runtime.registerEngine(mockEngine);
    await runtime.start();

    expect(mockEngine.initialize).toHaveBeenCalledTimes(1);
    expect(mockEngine.start).toHaveBeenCalledTimes(1);
  });

  test('should emit APP_FOREGROUND on start', async () => {
    const listener = jest.fn();
    EventBus.on('APP_FOREGROUND', listener);

    await runtime.start();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should emit APP_BACKGROUND on pause', async () => {
    const listener = jest.fn();
    EventBus.on('APP_BACKGROUND', listener);

    await runtime.start();
    runtime.pause();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should track uptime', async () => {
    await runtime.start();
    // Wait a tick
    await new Promise(resolve => setTimeout(resolve, 100));
    const uptime = runtime.getUptime();
    expect(uptime).toBeGreaterThan(0);
  });
});
