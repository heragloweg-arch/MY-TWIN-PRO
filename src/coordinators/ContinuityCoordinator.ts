import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from './PersonalityCoordinator';
import { timelineCoordinator } from './TimelineCoordinator';
import { goalCoordinator } from './GoalCoordinator';
import { EventBus } from '../core/EventBus';

interface LifeBookEntry {
  timestamp: string;
  event: string;
  bondSnapshot: number;
  memoryCount: number;
  phase: string;
}

export class ContinuityCoordinator {
  private lifeBook: LifeBookEntry[] = [];
  private isInitialized: boolean = false;

  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    // استعادة الذكريات طويلة المدى
    const longTerm = memoryEngine.getLongTermMemories(12);

    // توليد DNA أولي
    await personalityCoordinator.generateDNA(userId);

    // بناء الخط الزمني
    await timelineCoordinator.buildTimeline();

    // اكتشاف الأهداف
    await goalCoordinator.detectGoalsFromMemories();

    // تسجيل لقطة حياة
    this.recordLifeBookEntry('تهيئة الكيان');

    this.isInitialized = true;
    EventBus.emit('CONTINUITY_INITIALIZED', { userId, memoryCount: longTerm.length });
  }

  recordLifeBookEntry(event: string): LifeBookEntry {
    const entry: LifeBookEntry = {
      timestamp: new Date().toISOString(),
      event,
      bondSnapshot: relationshipEngine.getBondLevel(),
      memoryCount: memoryEngine.getMemoryCount(),
      phase: relationshipEngine.getPhase(),
    };
    this.lifeBook.push(entry);
    if (this.lifeBook.length > 500) this.lifeBook = this.lifeBook.slice(-500);
    return entry;
  }

  getLifeBook(limit: number = 20): LifeBookEntry[] {
    return this.lifeBook.slice(-limit).reverse();
  }

  async ensureContinuity(): Promise<{
    memoriesRestored: number;
    bondRestored: number;
    goalsActive: number;
  }> {
    memoryEngine.applyForgettingRules();
    const longTerm = memoryEngine.getLongTermMemories(12);
    const bond = relationshipEngine.getBondLevel();

    return {
      memoriesRestored: longTerm.length,
      bondRestored: bond,
      goalsActive: goalCoordinator.getActiveGoals().length,
    };
  }

  getLifeBookSummary(): string {
    if (this.lifeBook.length === 0) return 'الرحلة لم تبدأ بعد.';
    const first = this.lifeBook[0];
    const last = this.lifeBook[this.lifeBook.length - 1];
    return `بدأت الرحلة في ${new Date(first.timestamp).toLocaleDateString('ar')}. الآن: ${last.phase}، ${last.memoryCount} ذكرى.`;
  }
}

export const continuityCoordinator = new ContinuityCoordinator();
