import { digitalSoul, DigitalSoulState } from './DigitalSoul';
import { livingSession } from '../core/LivingSession';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { identityEngine } from '../coordinators/IdentityEngine';
import { soulEvolutionHistory } from '../core/SoulEvolutionHistory';
import { EventBus } from '../core/EventBus';

export class SoulEvolutionEngine {
  private lastUpdate: string = '';

  update(): DigitalSoulState {
    const state = digitalSoul.read();
    const session = livingSession.getCurrent();

    if (session) {
      // تطور القيم بناءً على الجلسات
      if (session.identity === 'study') {
        state.values.values = [...new Set([...state.values.values, 'Knowledge'])];
      }
    }

    // تسجيل التاريخ
    this.lastUpdate = new Date().toISOString();
    soulEvolutionHistory.recordSnapshot();

    EventBus.emit('SOUL_UPDATED', state);
    return state;
  }

  getLastUpdate(): string {
    return this.lastUpdate;
  }
}

export const soulEvolutionEngine = new SoulEvolutionEngine();
