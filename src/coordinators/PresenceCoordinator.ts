import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { audioEngine } from '../core/AudioEngine';
import { EventBus } from '../core/EventBus';

interface DailyPresence {
  lastCheckIn: string;
  messagesSinceLastCheckIn: number;
  suggestedGreeting: string;
}

export class PresenceCoordinator {
  private lastCheckInTime: string = new Date().toISOString();
  private messageCount: number = 0;

  // ════════════════════════════════════════════
  // الحضور اليومي (موجود سابقاً)
  // ════════════════════════════════════════════

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

  // ════════════════════════════════════════════
  // طقس الولادة وإدارة الصوت (جديد)
  // ════════════════════════════════════════════

  /** بداية تسلسل الولادة – يُصدر حدثاً ويُشغّل الصوت الأول */
  startBirthSequence(): void {
    EventBus.emit('PRESENCE_BIRTH', { phase: 'startup' });
    audioEngine.play('startup_birth');
  }

  /** النفس الأول */
  triggerFirstBreath(): void {
    EventBus.emit('PRESENCE_BREATH_STARTED', { phase: 'first_breath' });
    audioEngine.play('first_breath');
  }

  /** الاستيقاظ – فتح العينين والهالة */
  triggerAwakening(): void {
    audioEngine.play('ambience_space');
    audioEngine.play('awakening_glow');
    audioEngine.play('eyes_open');
    EventBus.emit('PRESENCE_AWAKENING', { phase: 'awareness' });
  }

  /** نبض القلب أثناء الولادة */
  triggerHeartbeat(): void {
    audioEngine.play('heartbeat_energy');
  }

  /** طنين الطاقة */
  triggerEnergyHum(): void {
    audioEngine.play('energy_hum');
  }

  /** حدث عام للحضور (يمكن تخصيصه) */
  emit(event: string, payload?: any): void {
    EventBus.emit(event, payload);
  }
}

export const presenceCoordinator = new PresenceCoordinator();
