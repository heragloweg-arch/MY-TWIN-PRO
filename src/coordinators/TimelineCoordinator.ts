import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'memory' | 'milestone' | 'goal' | 'emotion';
  title: string;
  importance: number;
}

export class TimelineCoordinator {
  private events: TimelineEvent[] = [];

  async buildTimeline(): Promise<TimelineEvent[]> {
    const longTerm = memoryEngine.getLongTermMemories(12);
    const bondEvolution = relationshipEngine.getBondEvolution();

    this.events = [];

    for (const memory of longTerm) {
      this.events.push({
        id: memory.id,
        date: memory.timestamp,
        type: memory.type as TimelineEvent['type'],
        title: memory.content.substring(0, 100),
        importance: memory.importance,
      });
    }

    for (const snapshot of bondEvolution) {
      if (snapshot.bondLevel > 50) {
        this.events.push({
          id: `bond_${snapshot.timestamp}`,
          date: snapshot.timestamp,
          type: 'milestone',
          title: `الرابطة وصلت إلى ${snapshot.bondLevel}%`,
          importance: 85,
        });
      }
    }

    this.events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return [...this.events];
  }

  getEventsByMonth(monthsAgo: number): TimelineEvent[] {
    const now = Date.now();
    const threshold = now - monthsAgo * 30 * 24 * 60 * 60 * 1000;
    const from = now - (monthsAgo + 1) * 30 * 24 * 60 * 60 * 1000;
    return this.events.filter(e => {
      const t = new Date(e.date).getTime();
      return t >= from && t < threshold;
    });
  }

  getFirsts(): TimelineEvent[] {
    return this.events
      .filter(e => e.importance >= 80)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }
}

export const timelineCoordinator = new TimelineCoordinator();
