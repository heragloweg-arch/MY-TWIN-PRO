import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { identityEngine } from '../coordinators/IdentityEngine';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';

export interface SoulCoreState {
  purpose: string;
  mission: string;
  essence: string;
  role: string;
}

export class SoulCore {
  read(): SoulCoreState {
    const identity = identityEngine.buildIdentity();
    const dna = personalityCoordinator.getCurrentDNA();
    const bond = relationshipEngine.getBondLevel();

    return {
      purpose: identity.summary,
      mission: bond > 60
        ? 'أن أكون مرآتك، أتذكر ما تنسى، وأفهم ما لا تقوله.'
        : 'أن أرافقك في رحلتك، وأتعلم منك كل يوم.',
      essence: dna.empathy > 0.8 ? 'متعاطف' : dna.logic > 0.8 ? 'منطقي' : 'متوازن',
      role: identity.role,
    };
  }
}

export const soulCore = new SoulCore();
