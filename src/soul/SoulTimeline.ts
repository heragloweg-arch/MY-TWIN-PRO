import { timelineCoordinator } from '../coordinators/TimelineCoordinator';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { identityEngine } from '../coordinators/IdentityEngine';

export interface SoulTimelineEntry {
  period: string;
  summary: string;
  bondLevel: number;
}

export interface SoulTimelineState {
  entries: SoulTimelineEntry[];
  totalSpan: string;
  mostVisitedWorld: string;
  activeHours: number[];
}

export class SoulTimeline {
  read(): SoulTimelineState {
    const timelineEntries = timelineCoordinator.buildTimeline ? [] : [];
    const heatmap = identityEngine.getPresenceHeatmap();
    const mostVisited = identityEngine.getMostVisitedWorld();

    const entries: SoulTimelineEntry[] = timelineEntries.map((entry: any) => ({
      period: new Date(entry.date).toLocaleDateString('ar'),
      summary: entry.title,
      bondLevel: entry.importance || 50,
    }));

    return {
      entries,
      totalSpan: entries.length > 0 ? `${entries[0].period} → ${entries[entries.length - 1].period}` : 'لم تبدأ الرحلة بعد',
      mostVisitedWorld: mostVisited,
      activeHours: [],
    };
  }
}

export const soulTimeline = new SoulTimeline();
