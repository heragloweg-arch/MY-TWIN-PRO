import { memoryEngine } from '../../../engine/memory/MemoryEngine';

describe('MemoryEngine', () => {
  test('يجب تخزين ذاكرة جديدة', async () => {
    const entry = await memoryEngine.store('conversation', 'اختبار الذاكرة', 70, 'joy', ['test']);
    expect(entry).toBeDefined();
    expect(entry.content).toBe('اختبار الذاكرة');
    expect(entry.importance).toBe(70);
  });

  test('يجب استرجاع الذكريات', async () => {
    await memoryEngine.store('conversation', 'مرحباً بالعالم', 60, 'neutral', ['greeting']);
    const results = await memoryEngine.retrieve('مرحباً', 5);
    expect(Array.isArray(results)).toBe(true);
  });

  test('يجب استرجاع ذكريات القدرات', async () => {
    await memoryEngine.store('learning', 'دراسة فيزياء', 65, 'focused', ['study']);
    const capMemories = memoryEngine.getCapabilityMemory('study', 5);
    expect(Array.isArray(capMemories)).toBe(true);
  });

  test('يجب أن يكون إجمالي الذكريات رقماً', () => {
    const count = memoryEngine.getMemoryCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('يجب تطبيق الشيخوخة بدون أخطاء', () => {
    memoryEngine.applyAging();
    const stats = memoryEngine.getEcologyStats();
    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe('number');
  });
});
