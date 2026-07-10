import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { timelineCoordinator } from '../coordinators/TimelineCoordinator';

export interface SoulBond {
  event: string;
  timestamp: string;
  significance: number;
}

export interface SoulBondsState {
  milestones: SoulBond[];
  currentChapter: string;
  totalChapters: number;
}

export class SoulBonds {
  read(): SoulBondsState {
    const chapters = relationshipEngine.getChapters();
    const bondEvents = timelineCoordinator.getFirsts();

    const milestones: SoulBond[] = bondEvents
      .filter(e => e.importance >= 80)
      .map(e => ({
        event: e.title,
        timestamp: e.date,
        significance: e.importance / 100,
      }));

    return {
      milestones,
      currentChapter: chapters.length > 0 ? chapters[chapters.length - 1].title : 'Chapter 0: Unknown',
      totalChapters: chapters.length,
    };
  }
}

export const soulBonds = new SoulBonds();
