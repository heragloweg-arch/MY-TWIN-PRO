import { emotionEngine } from '../../../engine/emotion/EmotionEngine';

describe('EmotionEngine', () => {
  test('يجب أن تكون العاطفة الافتراضية محايدة', () => {
    expect(emotionEngine.getCurrentEmotion()).toBe('neutral');
  });

  test('يجب تغيير العاطفة', async () => {
    await emotionEngine.setEmotion('joy', 0.8);
    expect(emotionEngine.getCurrentEmotion()).toBe('joy');
  });

  test('يجب أن تكون الشدة بين 0 و 1', () => {
    const intensity = emotionEngine.getIntensity();
    expect(intensity).toBeGreaterThanOrEqual(0);
    expect(intensity).toBeLessThanOrEqual(1);
  });

  test('يجب التحقق من توافق العواطف', () => {
    expect(emotionEngine.canTransition('joy', 'calm')).toBe(true);
    expect(emotionEngine.canTransition('joy', 'anger')).toBe(false);
  });

  test('يجب التفاعل مع عاطفة المستخدم', () => {
    emotionEngine.reactToUserEmotion('excited');
    const emotion = emotionEngine.getCurrentEmotion();
    // يجب أن تتغير العاطفة استجابة للمستخدم
    expect(emotion).toBeDefined();
  });

  test('يجب تطبيق تأثير الشخصية', () => {
    const dna = { empathy: 0.9, curiosity: 0.8, humor: 0.5, calmness: 0.9 };
    const result = emotionEngine.applyPersonalityInfluence(dna);
    expect(result).toBeDefined();
  });
});
