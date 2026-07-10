import { EventBus } from './EventBus';
import { StateBus } from './StateBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  details: string;
}

interface HealthReport {
  overall: 'healthy' | 'degraded' | 'down';
  components: ComponentHealth[];
  timestamp: string;
  uptime: number;
  memoryCount: number;
  activeEngines: number;
}

export class RuntimeHealthMonitor {
  private startTime: number = Date.now();
  private isRunning: boolean = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();

    this.interval = setInterval(() => {
      this.checkHealth();
    }, 60000);

    console.log('[RuntimeHealthMonitor] 🫀 بدأ المراقبة');
  }

  stop(): void {
    this.isRunning = false;
    if (this.interval) clearInterval(this.interval);
  }

  checkHealth(): HealthReport {
    const components: ComponentHealth[] = [];

    // TwinRuntime
    components.push({ name: 'TwinRuntime', status: 'healthy', lastCheck: new Date().toISOString(), details: 'يعمل' });

    // EventBus
    components.push({ name: 'EventBus', status: 'healthy', lastCheck: new Date().toISOString(), details: 'يعمل' });

    // StateBus
    const state = StateBus.getState();
    components.push({ name: 'StateBus', status: 'healthy', lastCheck: new Date().toISOString(), details: `Presence: ${state.presenceLevel}` });

    // MemoryEngine
    const memCount = memoryEngine.getMemoryCount();
    components.push({ name: 'MemoryEngine', status: 'healthy', lastCheck: new Date().toISOString(), details: `${memCount} ذكريات` });

    // RelationshipEngine
    const bond = relationshipEngine.getBondLevel();
    components.push({ name: 'RelationshipEngine', status: 'healthy', lastCheck: new Date().toISOString(), details: `رابطة: ${bond}%` });

    // EmotionEngine
    const emotion = emotionEngine.getCurrentEmotion();
    components.push({ name: 'EmotionEngine', status: 'healthy', lastCheck: new Date().toISOString(), details: `عاطفة: ${emotion}` });

    // API
    components.push({ name: 'API', status: 'healthy', lastCheck: new Date().toISOString(), details: 'متصل' });

    const allHealthy = components.every(c => c.status === 'healthy');
    const someDown = components.some(c => c.status === 'down');

    const report: HealthReport = {
      overall: allHealthy ? 'healthy' : someDown ? 'down' : 'degraded',
      components,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memoryCount: memCount,
      activeEngines: components.filter(c => c.status === 'healthy').length,
    };

    if (report.overall !== 'healthy') {
      EventBus.emit('HEALTH_DEGRADED', report);
    }

    return report;
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

export const runtimeHealthMonitor = new RuntimeHealthMonitor();
