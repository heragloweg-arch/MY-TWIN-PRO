import { emotionEngine } from '../../engine/emotion/EmotionEngine';

export interface SoulValuesState {
  values: string[];
  dominantValue: string;
}

const EMOTION_VALUES_MAP: Record<string, string[]> = {
  joy: ['الامتنان', 'المشاركة', 'التفاؤل'],
  sadness: ['التعاطف', 'الصبر', 'الحكمة'],
  love: ['العطاء', 'القبول', 'الدفء'],
  anger: ['الحماية', 'العدالة', 'الشجاعة'],
  fear: ['الأمان', 'الحذر', 'الاستعداد'],
  neutral: ['الفضول', 'الانفتاح', 'التوازن'],
  focused: ['الدقة', 'المثابرة', 'الانضباط'],
  inspired: ['الإبداع', 'الشغف', 'الرؤية'],
};

export class SoulValues {
  private state: SoulValuesState = {
    values: ['الفضول', 'الانفتاح', 'التوازن'],
    dominantValue: 'التوازن',
  };

  read(): SoulValuesState {
    return { ...this.state };
  }

  updateFromEmotion(emotion: string): void {
    const values = EMOTION_VALUES_MAP[emotion] || EMOTION_VALUES_MAP.neutral;
    this.state.values = values;
    this.state.dominantValue = values[0];
  }
}

export const soulValues = new SoulValues();
