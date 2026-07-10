import { TwinBrain } from '../TwinBrain';

describe('TwinBrain', () => {
  let brain: TwinBrain;

  beforeEach(() => {
    brain = new TwinBrain('test_user', 'ar');
  });

  test('يجب إنشاء TwinBrain', () => {
    expect(brain).toBeDefined();
  });

  test('يجب ضبط معرف المستخدم', () => {
    brain.setUserId('user_123');
    const dna = brain.getPersonalityDNA();
    expect(dna).toBeDefined();
    expect(dna.empathy).toBeGreaterThan(0);
  });

  test('يجب ضبط اللغة', () => {
    brain.setLang('en');
    const dna = brain.getPersonalityDNA();
    expect(dna).toBeDefined();
  });

  test('يجب تسجيل مستمع التفكير', () => {
    const callback = jest.fn();
    brain.onThinking(callback);
    // لم يتم التفكير بعد، لا يجب استدعاء الـ callback
    expect(callback).not.toHaveBeenCalled();
  });

  test('يجب ضبط شخصية DNA', () => {
    brain.setPersonalityDNA({ empathy: 0.9, curiosity: 0.8 });
    const dna = brain.getPersonalityDNA();
    expect(dna.empathy).toBe(0.9);
    expect(dna.curiosity).toBe(0.8);
  });
});
