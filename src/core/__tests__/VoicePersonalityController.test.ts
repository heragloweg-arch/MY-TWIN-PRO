import { VoicePersonalityController } from '../VoicePersonalityController';

describe('VoicePersonalityController', () => {
  let controller: VoicePersonalityController;

  beforeEach(() => {
    controller = new VoicePersonalityController();
  });

  test('يجب إنشاء controller', () => {
    expect(controller).toBeDefined();
  });

  test('يجب إرجاع ملف صوتي', () => {
    const profile = controller.getProfile();
    expect(profile).toBeDefined();
    expect(profile.baseVoice).toBeDefined();
    expect(profile.pitch).toBeGreaterThan(0);
    expect(profile.rate).toBeGreaterThan(0);
    expect(profile.volume).toBeGreaterThan(0);
  });

  test('يجب تغيير الجنس', () => {
    controller.setGender('male');
    const profile = controller.getProfile();
    expect(profile.gender).toBe('male');
  });

  test('يجب إرجاع تكوين Expo Speech', () => {
    const config = controller.getExpoSpeechConfig();
    expect(config.rate).toBeGreaterThan(0);
    expect(config.pitch).toBeGreaterThan(0);
    expect(config.language).toBe('ar');
  });
});
