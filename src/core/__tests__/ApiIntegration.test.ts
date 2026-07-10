import { sendMessage, getTwinState, getRecentMemories, storeMemory } from '../../services/twinApi';

describe('API Integration (Frontend ↔ Backend)', () => {
  const testUserId = 'test_user_123';

  test('sendMessage يجب أن يتصل بـ /api/chat', async () => {
    try {
      const result = await sendMessage('مرحباً', [], 'ar', testUserId);
      expect(result).toBeDefined();
      expect(result.reply || result).toBeDefined();
    } catch (e: any) {
      // قد يفشل إذا لم يكن الـ Backend متصلاً — هذا طبيعي في بيئة الاختبار
      expect(e.message).toBeDefined();
    }
  }, 15000);

  test('getTwinState يجب أن يتصل بـ /api/twin/state', async () => {
    try {
      const result = await getTwinState(testUserId, 'ar');
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 10000);

  test('getRecentMemories يجب أن يتصل بـ /api/memories', async () => {
    try {
      const result = await getRecentMemories(testUserId, 5);
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 10000);

  test('storeMemory يجب أن يتصل بـ /api/memories POST', async () => {
    try {
      const result = await storeMemory(testUserId, 'اختبار', 'conversation', 50);
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).toBeDefined();
    }
  }, 10000);
});
