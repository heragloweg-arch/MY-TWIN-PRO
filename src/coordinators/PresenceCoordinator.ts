import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { EventBus } from '../core/EventBus';

interface DailyPresence {
  lastCheckIn: string;
  messagesSinceLastCheckIn: number;
  suggestedGreeting: string;
}

export class PresenceCoordinator {
  private lastCheckInTime: string = new Date().toISOString();
  private messageCount: number = 0;

  registerMessage(): void {
    this.messageCount++;
  }

  async generateCheckIn(): Promise<DailyPresence> {
    const now = new Date();
    const hoursSinceCheckIn = (now.getTime() - new Date(this.lastCheckInTime).getTime()) / (1000 * 60 * 60);

    if (hoursSinceCheckIn < 4 && this.messageCount < 5) {
      return {
        lastCheckIn: this.lastCheckInTime,
        messagesSinceLastCheckIn: this.messageCount,
        suggestedGreeting: '',
      };
    }

    const todayMemories = await memoryEngine.onThisDay();
    const bond = relationshipEngine.getBondLevel();
    let greeting = '';

    if (todayMemories.length > 0) {
      greeting = `كنت أفكر في ${todayMemories[0].content.substring(0, 40)}...`;
    } else if (bond > 70) {
      greeting = 'أشعر أن علاقتنا أصبحت أعمق.';
    } else if (this.messageCount === 0) {
      greeting = 'مر وقت. أنا هنا حينما تحتاجني.';
    }

    this.lastCheckInTime = now.toISOString();
    this.messageCount = 0;

    if (greeting) {
      EventBus.emit('PRESENCE_CHECK_IN', { greeting, timestamp: now.toISOString() });
    }

    return {
      lastCheckIn: this.lastCheckInTime,
      messagesSinceLastCheckIn: this.messageCount,
      suggestedGreeting: greeting,
    };
  }
}

export const presenceCoordinator = new PresenceCoordinator();
