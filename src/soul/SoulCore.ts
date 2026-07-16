import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';

export interface SoulCoreState {
  role: string;
  purpose: string;
  energy: number;
}

export class SoulCore {
  private state: SoulCoreState = {
    role: 'companion',
    purpose: 'أن أكون بجانبك وأفهمك',
    energy: 0.8,
  };

  read(): SoulCoreState {
    return { ...this.state };
  }

  updateRole(phase: string, bond: number): void {
    const dna = personalityCoordinator.getCurrentDNA();
    
    if (phase === 'soulmate') {
      this.state.role = bond > 90 ? 'soul_partner' : 'soulmate';
    } else if (phase === 'close_friend') {
      this.state.role = dna.empathy > 0.8 ? 'protector' : 'friend';
    } else if (phase === 'friend') {
      this.state.role = dna.curiosity > 0.7 ? 'explorer' : 'companion';
    } else if (phase === 'stranger' || phase === 'acquaintance') {
      this.state.role = 'observer';
    } else {
      this.state.role = 'companion';
    }
  }
}

export const soulCore = new SoulCore();
