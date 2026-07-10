import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { EventBus } from './EventBus';

/**
 * إعدادات الصوت النهائية
 */
export interface VoiceProfile {
  baseVoice: string;
  pitch: number;
  rate: number;
  volume: number;
  pause: number;
  emotion: string;
  personality: string;
  gender: string;
}

/**
 * VOICE PERSONALITY CONTROLLER
 * =============================
 * يربط شخصية الصوت بالعاطفة والعلاقة والشخصية.
 * يحدد كيف يتكلم التوأم بناءً على:
 *   - العاطفة الحالية (EmotionEngine)
 *   - مرحلة العلاقة (RelationshipEngine)
 *   - شخصية التوأم (PersonalityCoordinator)
 */
export class VoicePersonalityController {
  private gender: 'male' | 'female' = 'female';
  private baseProfiles: Record<string, VoiceProfile> = {
    friend:    { baseVoice: 'ar-EG-SalmaNeural', pitch: 1.05, rate: 1.0, volume: 0.85, pause: 0.5, emotion: 'neutral', personality: 'friend', gender: 'female' },
    mentor:    { baseVoice: 'ar-EG-SalmaNeural', pitch: 0.95, rate: 0.9,  volume: 0.8,  pause: 0.8, emotion: 'calm', personality: 'mentor', gender: 'female' },
    romantic:  { baseVoice: 'ar-EG-SalmaNeural', pitch: 1.1,  rate: 0.85, volume: 0.75, pause: 0.7, emotion: 'loving', personality: 'romantic', gender: 'female' },
    energetic: { baseVoice: 'ar-EG-SalmaNeural', pitch: 1.2,  rate: 1.3,  volume: 0.9,  pause: 0.2, emotion: 'excited', personality: 'energetic', gender: 'female' },
    calm:      { baseVoice: 'ar-EG-SalmaNeural', pitch: 0.9,  rate: 0.8,  volume: 0.7,  pause: 0.9, emotion: 'calm', personality: 'calm', gender: 'female' },
  };

  setGender(gender: 'male' | 'female'): void {
    this.gender = gender;
    // تحديث الأصوات حسب الجنس
    const voiceMap: Record<string, string> = {
      female: 'ar-EG-SalmaNeural',
      male: 'ar-SA-HamedNeural',
    };
    const baseVoice = voiceMap[gender] || 'ar-EG-SalmaNeural';
    for (const key of Object.keys(this.baseProfiles)) {
      this.baseProfiles[key].baseVoice = baseVoice;
      this.baseProfiles[key].gender = gender;
    }
  }

  /**
   * الحصول على إعدادات الصوت الحالية
   */
  getProfile(): VoiceProfile {
    const emotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    const phase = relationshipEngine.getPhase();
    const dna = personalityCoordinator.getCurrentDNA();

    // تحديد الشخصية الأساسية
    let baseProfile = this.baseProfiles.friend;

    // اختيار الشخصية حسب العاطفة والعلاقة
    if (emotion === 'sadness' || emotion === 'fear' || emotion === 'anger') {
      baseProfile = this.baseProfiles.calm;
    } else if (phase === 'close_friend' || phase === 'soulmate') {
      baseProfile = this.baseProfiles.friend;
    } else if (emotion === 'joy' || emotion === 'happy') {
      baseProfile = this.baseProfiles.energetic;
    } else if (dna.empathy > 0.9) {
      baseProfile = this.baseProfiles.romantic;
    } else if (dna.logic > 0.8) {
      baseProfile = this.baseProfiles.mentor;
    }

    // تعديل حسب شدة العاطفة
    const adjustedProfile: VoiceProfile = {
      ...baseProfile,
      rate: baseProfile.rate * (1 - intensity * 0.2),  // عاطفة أعلى = أبطأ
      pitch: baseProfile.pitch * (1 + intensity * 0.1), // عاطفة أعلى = حدة أعلى
      volume: baseProfile.volume * (1 - intensity * 0.1), // عاطفة أعلى = أخفض
      pause: baseProfile.pause * (1 + intensity * 0.3),   // عاطفة أعلى = توقف أطول
    };

    return adjustedProfile;
  }

  /**
   * الحصول على نص منطوق بسيط (لـ expo-speech)
   */
  getExpoSpeechConfig(): { rate: number; pitch: number; language: string } {
    const profile = this.getProfile();
    return { rate: profile.rate, pitch: profile.pitch, language: 'ar' };
  }
}

export const voicePersonalityController = new VoicePersonalityController();
