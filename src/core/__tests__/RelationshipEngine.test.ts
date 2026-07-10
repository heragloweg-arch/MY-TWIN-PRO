import { relationshipEngine } from '../../../engine/relationship/RelationshipEngine';

describe('RelationshipEngine', () => {
  test('يجب أن تبدأ العلاقة كغريب', () => {
    expect(relationshipEngine.getPhase()).toBe('stranger');
  });

  test('يجب أن يكون مستوى الرابطة 0 في البداية', () => {
    expect(relationshipEngine.getBondLevel()).toBe(0);
  });

  test('يجب تسجيل التفاعلات', async () => {
    await relationshipEngine.recordInteraction('positive', 'محادثة أولى');
    expect(relationshipEngine.getBondLevel()).toBeGreaterThanOrEqual(0);
  });

  test('يجب إرجاع نموذج التعلق', () => {
    const attachment = relationshipEngine.getAttachmentModel();
    expect(attachment).toBeDefined();
    expect(attachment.style).toBeDefined();
    expect(attachment.score).toBeGreaterThanOrEqual(0);
  });

  test('يجب استعادة الثقة', () => {
    const before = relationshipEngine.getBondLevel();
    const after = relationshipEngine.recoverTrust(5);
    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('يجب تحليل الاتجاه', () => {
    const trend = relationshipEngine.analyzeTrend();
    expect(['growing', 'stable', 'declining']).toContain(trend);
  });

  test('يجب إرجاع فصول العلاقة', () => {
    const chapters = relationshipEngine.getChapters();
    expect(Array.isArray(chapters)).toBe(true);
  });

  test('يجب إرجاع تحية مخصصة', () => {
    const greeting = relationshipEngine.getPersonalizedGreeting();
    expect(greeting).toBeDefined();
    expect(typeof greeting).toBe('string');
  });
});
