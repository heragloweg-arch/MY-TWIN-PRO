import { EventBus } from '../core/EventBus';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';

export class RelationshipCoordinator {
  async recordFirstBond(answer: string) {
    // تسجيل أول تفاعل كأول ذكرى في العلاقة
    await relationshipEngine.recordInteraction('positive', 'first_bond');
    // إنشاء فصل جديد
    EventBus.emit('RELATIONSHIP_CHAPTER_STARTED', { chapter: 'Chapter 1: First Meeting' });
    // يمكن تخزين السؤال والإجابة كأول ذكرى
  }
}

export const relationshipCoordinator = new RelationshipCoordinator();
