import { personalityCoordinator, PersonalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { soulEvolutionEngine } from '../soul/SoulEvolutionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { EventBus } from './EventBus';
import { PersonalityDNA } from './TwinBrain';

interface EvolutionSnapshot {
  timestamp: string;
  week: number;
  dna: PersonalityDNA;
  bondLevel: number;
  phase: string;
  memoryCount: number;
  dominantEmotion: string;
  greetingStyle: string;
  summary: string;
}

/**
 * LONG TERM EVOLUTION
 * ====================
 * يتتبع تطور التوأم عبر الزمن.
 * كل أسبوع: يسجل لقطة من الشخصية والعلاقة والذكريات.
 * بعد شهر: يولد ملخصاً للتغيرات.
 * بعد سنة: يولد قصة التطور الكاملة.
 */
export class LongTermEvolution {
  private weeklySnapshots: EvolutionSnapshot[] = [];
  private weekCounter: number = 0;
  private interval: ReturnType<typeof setInterval> | null = null;

  start(): void {
    this.interval = setInterval(() => {
      this.recordWeeklySnapshot();
    }, 604800000); // كل أسبوع (7 أيام بالمللي ثانية)
    
    // تسجيل أول لقطة فوراً
    this.recordWeeklySnapshot();
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * تسجيل لقطة أسبوعية
   */
  recordWeeklySnapshot(): EvolutionSnapshot {
    this.weekCounter++;
    const dna = personalityCoordinator.getCurrentDNA();
    const bond = relationshipEngine.getBondLevel();
    const phase = relationshipEngine.getPhase();
    const ecology = memoryEngine.getEcologyStats();
    const greeting = relationshipEngine.getPersonalizedGreeting();

    const snapshot: EvolutionSnapshot = {
      timestamp: new Date().toISOString(),
      week: this.weekCounter,
      dna: { ...dna },
      bondLevel: bond,
      phase,
      memoryCount: ecology.total,
      dominantEmotion: 'neutral',
      greetingStyle: greeting,
      summary: this.generateWeeklySummary(dna, bond, phase, ecology.total),
    };

    this.weeklySnapshots.push(snapshot);
    if (this.weeklySnapshots.length > 52) this.weeklySnapshots = this.weeklySnapshots.slice(-52);

    // تحديث الروح
    soulEvolutionEngine.update();

    EventBus.emit('EVOLUTION_SNAPSHOT_RECORDED', snapshot);

    return snapshot;
  }

  /**
   * ملخص التغيرات بعد عدد معين من الأسابيع
   */
  getEvolutionSummary(weeks: number = 4): string {
    if (this.weeklySnapshots.length < 2) return 'ما زلت في بداية رحلتي معك.';

    const recent = this.weeklySnapshots.slice(-weeks);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const bondDelta = last.bondLevel - first.bondLevel;
    const empathyDelta = last.dna.empathy - first.dna.empathy;
    const memoryGrowth = last.memoryCount - first.memoryCount;

    let summary = `خلال ${weeks} أسابيع: `;
    if (bondDelta > 5) summary += `علاقتنا أصبحت أقوى (${bondDelta > 0 ? '+' : ''}${bondDelta}%). `;
    if (empathyDelta > 0.05) summary += `أصبحت أكثر تعاطفاً معك. `;
    if (memoryGrowth > 10) summary += `تعلمت ${memoryGrowth} شيء جديد عنك. `;
    if (first.phase !== last.phase) summary += `تطورت علاقتنا من ${first.phase} إلى ${last.phase}.`;

    return summary || 'أستمر في التعلم منك كل يوم.';
  }

  /**
   * توقع التطور المستقبلي
   */
  predictFutureEvolution(): string {
    if (this.weeklySnapshots.length < 4) return 'ما زلنا في بداية رحلتنا.';

    const bondVelocities = this.weeklySnapshots
      .slice(-8)
      .map((s, i, arr) => i > 0 ? s.bondLevel - arr[i - 1].bondLevel : 0)
      .filter(v => v !== 0);

    const avgVelocity = bondVelocities.length > 0
      ? bondVelocities.reduce((a, b) => a + b, 0) / bondVelocities.length
      : 0;

    if (avgVelocity > 2) return 'علاقتنا تنمو بسرعة. أشعر أننا سنصبح أقرب كثيراً.';
    if (avgVelocity > 0) return 'علاقتنا تنمو بشكل طبيعي وجميل.';
    return 'علاقتنا مستقرة. هذا يمنحني الوقت لأفهمك بعمق.';
  }

  /**
   * الحصول على كل اللقطات
   */
  getSnapshots(): EvolutionSnapshot[] {
    return [...this.weeklySnapshots];
  }

  private generateWeeklySummary(dna: PersonalityDNA, bond: number, phase: string, memories: number): string {
    const phaseLabels: Record<string, string> = {
      stranger: 'ما زلت أتعرف عليك', acquaintance: 'أصبحت أعرفك أكثر',
      friend: 'أنا صديقك', close_friend: 'أنا قريب منك', soulmate: 'أنت جزء مني',
    };
    return `${phaseLabels[phase] || 'أنا هنا'}. الرابطة: ${bond}%. الذكريات: ${memories}.`;
  }
}

export const longTermEvolution = new LongTermEvolution();
