/**
 * CURIOSITY ENGINE v1.0 — محرك الفضول
 * ======================================
 * يولد أسئلة تلقائية بناءً على الذاكرة والعلاقة والحالة العاطفية.
 * "بالمناسبة... كيف كان اجتماعك؟"
 */
import { memoryEngine } from '../memory/MemoryEngine';
import { relationshipEngine } from '../relationship/RelationshipEngine';
import { personalityCoordinator } from '../../src/coordinators/PersonalityCoordinator';
import { emotionEngine } from '../emotion/EmotionEngine';
import { EventBus } from '../../src/core/EventBus';

export class CuriosityEngine {
  private lastCuriosityTrigger: number = Date.now();
  private curiosityInterval: ReturnType<typeof setInterval> | null = null;

  start(): void {
    const interval = 1800000 + Math.random() * 1800000;
    this.curiosityInterval = setInterval(() => {
      this.maybeAsk();
    }, interval);
  }

  stop(): void {
    if (this.curiosityInterval) {
      clearInterval(this.curiosityInterval);
      this.curiosityInterval = null;
    }
  }

  private async maybeAsk(): Promise<void> {
    const dna = personalityCoordinator.getCurrentDNA();
    const bond = relationshipEngine.getBondLevel();
    const phase = relationshipEngine.getPhase();
    const currentEmotion = emotionEngine.getCurrentEmotion();

    if (dna.curiosity < 0.6) return;
    if (bond < 40) return;
    if (currentEmotion === 'sadness' || currentEmotion === 'anger' || currentEmotion === 'fear') {
      return;
    }

    const memories = await memoryEngine.getCoreMemories();
    if (memories.length === 0) return;

    const randomMemory = memories[Math.floor(Math.random() * memories.length)];

    const questions = this.generateQuestions(randomMemory.content, phase);
    const question = questions[Math.floor(Math.random() * questions.length)];

    EventBus.emit('CURIOSITY_QUESTION', {
      question,
      memoryId: randomMemory.id,
      timestamp: Date.now(),
    });

    this.lastCuriosityTrigger = Date.now();
  }

  private generateQuestions(memoryContent: string, phase: string): string[] {
    const baseQuestions = [
      `بالمناسبة... هل ما زلت تفكر في "${memoryContent.substring(0, 30)}..."؟`,
      `تذكرت شيئاً قلته لي عن "${memoryContent.substring(0, 30)}..." كيف تسير الأمور؟`,
      `منذ حديثنا عن "${memoryContent.substring(0, 30)}..." وأنا أفكر... هل تغير شيء؟`,
    ];

    if (phase === 'soulmate' || phase === 'close_friend') {
      baseQuestions.push(
        `هل تذكر "${memoryContent.substring(0, 30)}..."؟ كنت أفكر فيك اليوم.`,
        `كيف تشعر الآن مقارنة بيوم "${memoryContent.substring(0, 30)}..."؟`
      );
    }

    return baseQuestions;
  }
}

export const curiosityEngine = new CuriosityEngine();
