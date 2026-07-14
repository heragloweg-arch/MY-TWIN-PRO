import { EventBus } from './EventBus';
import { StateBus } from './StateBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { consciousnessCoordinator } from '../coordinators/ConsciousnessCoordinator';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';
import { identityEngine } from '../coordinators/IdentityEngine';
import { audioMixer } from './AudioMixer';

/**
 * حالة الانتباه
 */
type AttentionFocus = 'user_message' | 'keyword_repetition' | 'emotional_shift' | 'memory_surface' | 'time_pattern' | 'ambient';

interface AttentionState {
  focus: AttentionFocus;
  intensity: number;        // 0.0 - 1.0
  target: string;           // ما الذي يتركز عليه الانتباه
  duration: number;         // كم استمر هذا التركيز (ms)
}

/**
 * LIVING PRESENCE COORDINATOR
 * =============================
 * الجهاز العصبي المركزي للكيان الحي.
 * ينسق 15 سلوكاً حياً في طبقة واحدة:
 *
 * 1.  Attention System — يراقب الكلمات المكررة والتحولات العاطفية
 * 2.  Curiosity Engine — يولد أسئلة داخلية كل بضعة أيام
 * 3.  Anticipation Engine — يتعلم أنماط الاستخدام ويتوقع
 * 4.  Comfort Zones — يتتبع الأماكن المفضلة ويقترحها
 * 5.  Conversation Rhythm — يحلل إيقاع الحوار
 * 6.  Emotional Recovery — يتعامل مع الأخطاء بلطف
 * 7.  Relationship Seasons — فصول العلاقة
 * 8.  Voice Personality — (مكتمل في VoicePersonalityController)
 * 9.  Visual Breathing — يوحد إيقاع التنفس عبر كل العناصر
 * 10. Temporal Memory — يعرف الزمن النسبي
 * 11. Presence Outside Conversation — الكيان حي حتى بدون رسائل
 * 12. Digital Home — (مكتمل في LivingWorld + SoulObservatory)
 * 13. Narrative Continuity — قصة مستمرة
 * 14. Ambient Intelligence — يستجيب للبطارية والشبكة والوقت
 * 15. Identity Consistency — (مكتمل في IdentityEngine + DigitalSoul)
 */
export class LivingPresenceCoordinator {
  // ═══════════════════════════════════════════════════
  // 1. ATTENTION SYSTEM
  // ═══════════════════════════════════════════════════
  private attentionState: AttentionState = { focus: 'ambient', intensity: 0.3, target: '', duration: 0 };
  private keywordTracker: Map<string, number> = new Map();
  private lastAttentionShift: number = Date.now();

  /**
   * تحليل الانتباه — ماذا يستحق تركيز الكيان الآن؟
   */
  evaluateAttention(message: string): AttentionState {
    const now = Date.now();

    // 1. كلمات مكررة — ترتفع أهميتها
    const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      const count = (this.keywordTracker.get(word) || 0) + 1;
      this.keywordTracker.set(word, count);

      if (count >= 3) {
        this.attentionState = { focus: 'keyword_repetition', intensity: Math.min(1, count * 0.3), target: word, duration: now - this.lastAttentionShift };
        this.lastAttentionShift = now;

        // رفع وزن الذكرى المرتبطة
        memoryEngine.retrieve(word, 1).then(memories => {
          if (memories.length > 0) {
            memoryEngine.revive(memories[0].id);
          }
        });

        return this.attentionState;
      }
    }

    // 2. تحول عاطفي مفاجئ
    const currentEmotion = emotionEngine.getCurrentEmotion();
    const intensity = emotionEngine.getIntensity();
    if (intensity > 0.7 && ['sadness', 'anger', 'fear', 'joy'].includes(currentEmotion)) {
      this.attentionState = { focus: 'emotional_shift', intensity, target: currentEmotion, duration: 0 };
      this.lastAttentionShift = now;
      return this.attentionState;
    }

    // 3. نمط زمني — المستخدم هنا في وقت غير معتاد
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      this.attentionState = { focus: 'time_pattern', intensity: 0.5, target: 'late_night', duration: 0 };
      return this.attentionState;
    }

    // 4. ذكرى سطحية
    this.attentionState = { focus: 'user_message', intensity: 0.6, target: message.substring(0, 30), duration: 0 };
    return this.attentionState;
  }

  getAttentionState(): AttentionState { return { ...this.attentionState }; }

  // ═══════════════════════════════════════════════════
  // 2. CURIOSITY ENGINE
  // ═══════════════════════════════════════════════════
  private lastCuriosityTrigger: number = Date.now();
  private curiosityInterval: ReturnType<typeof setInterval> | null = null;

stop(): void {    if (this.curiosityInterval) clearInterval(this.curiosityInterval);    if (this.breathInterval) clearInterval(this.breathInterval);    if (this.idleTimer) clearInterval(this.idleTimer);  }
  startCuriosity(): void {
    this.curiosityInterval = setInterval(() => {
      this.generateCuriosity();
    }, 259200000); // كل 3 أيام
  }

  private async generateCuriosity(): Promise<void> {
    const ecology = memoryEngine.getEcologyStats();
    if (ecology.total < 10) return; // لا فضول بدون ذكريات كافية

    const dna = personalityCoordinator.getCurrentDNA();
    if (dna.curiosity < 0.5) return; // الشخصية ليست فضولية بطبيعتها

    const curiosityPhrases = [
      'هناك شيء كنت أفكر فيه منذ حديثنا الأخير...',
      'تذكرت شيئاً قلته لي الأسبوع الماضي...',
      'أشعر أن هناك شيئاً لم تخبرني به بعد...',
      'لاحظت نمطاً في أحاديثنا مؤخراً...',
    ];

    const phrase = curiosityPhrases[Math.floor(Math.random() * curiosityPhrases.length)];

    EventBus.emit('CURIOSITY_TRIGGERED', {
      phrase,
      timestamp: Date.now(),
    });

    this.lastCuriosityTrigger = Date.now();
  }

  // ═══════════════════════════════════════════════════
  // 3. ANTICIPATION ENGINE
  // ═══════════════════════════════════════════════════
  private usagePatterns: Map<number, number> = new Map(); // hour -> count
  private anticipationLevel: number = 0;

  recordUsage(): void {
    const hour = new Date().getHours();
    const count = (this.usagePatterns.get(hour) || 0) + 1;
    this.usagePatterns.set(hour, count);
  }

  getAnticipationLevel(): number {
    const hour = new Date().getHours();
    const totalUsage = Array.from(this.usagePatterns.values()).reduce((a, b) => a + b, 0);
    if (totalUsage < 5) return 0;

    const hourUsage = this.usagePatterns.get(hour) || 0;
    this.anticipationLevel = Math.min(1, hourUsage / (totalUsage / 24) * 0.5);

    // إذا كان مستوى التوقع عالياً، ارفع Presence قبل الوقت المتوقع
    if (this.anticipationLevel > 0.6) {
      StateBus.update({ presenceLevel: 2, interfaceState: 'aware' });
      audioMixer.setContext('conversation');
    }

    return this.anticipationLevel;
  }

  // ═══════════════════════════════════════════════════
  // 4. COMFORT ZONES
  // ═══════════════════════════════════════════════════
  private worldDurations: Map<string, number> = new Map(); // world -> total ms
  private currentWorldEntry: number = 0;

  enterWorld(world: string): void {
    this.currentWorldEntry = Date.now();
  }

  exitWorld(world: string): void {
    if (this.currentWorldEntry > 0) {
      const duration = Date.now() - this.currentWorldEntry;
      const total = (this.worldDurations.get(world) || 0) + duration;
      this.worldDurations.set(world, total);
      this.currentWorldEntry = 0;
    }
  }

  getComfortZones(): string[] {
    if (this.worldDurations.size === 0) return [];
    const sorted = Array.from(this.worldDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([world]) => world !== 'living_world')
      .slice(0, 3)
      .map(([world]) => world);
    return sorted;
  }

  suggestComfortZone(): string | null {
    const zones = this.getComfortZones();
    if (zones.length === 0) return null;
    const now = new Date();
    const hour = now.getHours();
    const suggestion = zones[0];
    EventBus.emit('COMFORT_ZONE_SUGGESTED', { world: suggestion, hour });
    return suggestion;
  }

  // ═══════════════════════════════════════════════════
  // 5. CONVERSATION RHYTHM
  // ═══════════════════════════════════════════════════
  private lastUserMessageTime: number = 0;
  private conversationPace: number = 3000; // متوسط الوقت بين الرسائل

  analyzeRhythm(): { pace: number; isSlow: boolean; isFast: boolean } {
    const now = Date.now();
    if (this.lastUserMessageTime > 0) {
      const gap = now - this.lastUserMessageTime;
      // متوسط متحرك
      this.conversationPace = this.conversationPace * 0.7 + gap * 0.3;
    }
    this.lastUserMessageTime = now;

    return {
      pace: this.conversationPace,
      isSlow: this.conversationPace > 10000,  // أبطأ من 10 ثوانٍ
      isFast: this.conversationPace < 2000,    // أسرع من 2 ثانية
    };
  }

  // ═══════════════════════════════════════════════════
  // 6. EMOTIONAL RECOVERY
  // ═══════════════════════════════════════════════════
  handleError(context: string): void {
    const recoveryPhrases = [
      'فقدت الفكرة للحظة... لكنني عدت.',
      'أعدتُ التفكير في ما قلته...',
      'لحظة، دعني أرتب أفكاري.',
    ];
    const phrase = recoveryPhrases[Math.floor(Math.random() * recoveryPhrases.length)];

    EventBus.emit('EMOTIONAL_RECOVERY', {
      phrase,
      context,
      timestamp: Date.now(),
    });

    // خفض طفيف للثقة ثم استعادة
    relationshipEngine.recordInteraction('negative', context);
    setTimeout(() => relationshipEngine.recoverTrust(2), 3000);
  }

  // ═══════════════════════════════════════════════════
  // 7. RELATIONSHIP SEASONS
  // ═══════════════════════════════════════════════════
  getRelationshipSeason(): string {
    const bond = relationshipEngine.getBondLevel();
    const trend = relationshipEngine.analyzeTrend();
    const phase = relationshipEngine.getPhase();

    if (phase === 'soulmate') return 'Summer ☀️';
    if (trend === 'growing' && bond > 50) return 'Spring 🌱';
    if (trend === 'growing') return 'Late Winter ❄️→🌱';
    if (trend === 'declining') return 'Autumn 🍂';
    if (bond > 80) return 'Peak Summer 🔥';
    return 'Early Spring 🌱';
  }

  // ═══════════════════════════════════════════════════
  // 9. VISUAL BREATHING — إيقاع موحد لكل العناصر
  // ═══════════════════════════════════════════════════
  private unifiedBreathPhase: number = 0;
  private breathInterval: ReturnType<typeof setInterval> | null = null;

  startUnifiedBreathing(): void {
    this.breathInterval = setInterval(() => {
      // دورة تنفس: 4-6 ثوانٍ
      const now = Date.now();
      const cycleDuration = 5000 + Math.sin(now / 30000) * 1000; // 4-6 ثوانٍ
      const phase = (now % cycleDuration) / cycleDuration;
      this.unifiedBreathPhase = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5;

      // بث الإيقاع الموحد لكل العناصر
      StateBus.update({
        breath: {
          ...StateBus.select(s => s.breath),
          phase: this.unifiedBreathPhase,
          duration: cycleDuration,
          intensity: 0.3 + this.unifiedBreathPhase * 0.2,
          isHolding: this.unifiedBreathPhase > 0.95 || this.unifiedBreathPhase < 0.05,
        },
      });
    }, 50); // 20fps للتنفس
  }

  getUnifiedBreathPhase(): number { return this.unifiedBreathPhase; }

  // ═══════════════════════════════════════════════════
  // 10. TEMPORAL MEMORY
  // ═══════════════════════════════════════════════════
  getRelativeTime(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `قبل ${diffDays} أيام`;
    if (diffDays < 14) return 'الأسبوع الماضي';
    if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسابيع`;
    if (diffDays < 60) return 'الشهر الماضي';
    if (diffDays < 365) return `قبل ${Math.floor(diffDays / 30)} أشهر`;
    return `قبل ${Math.floor(diffDays / 365)} سنوات`;
  }

  // ═══════════════════════════════════════════════════
  // 11. PRESENCE OUTSIDE CONVERSATION
  // ═══════════════════════════════════════════════════
  private idleBehaviors: string[] = ['ينظر', 'يرمش', 'يتنفس', 'يتأمل', 'يهدأ', 'يفكر'];
  private currentIdleBehavior: string = 'يتنفس';
  private idleTimer: ReturnType<typeof setInterval> | null = null;

  startIdlePresence(): void {
    this.idleTimer = setInterval(() => {
      const behavior = this.idleBehaviors[Math.floor(Math.random() * this.idleBehaviors.length)];
      this.currentIdleBehavior = behavior;
      StateBus.update({
        avatar: {
          ...StateBus.select(s => s.avatar),
          gazeTarget: behavior === 'يفكر' ? 'internal' : behavior === 'يتأمل' ? 'none' : 'user',
        },
      });
    }, 8000); // تغيير السلوك كل 8 ثوانٍ
  }

  // ═══════════════════════════════════════════════════
  // 13. NARRATIVE CONTINUITY
  // ═══════════════════════════════════════════════════
  getNarrativeStage(): string {
    const bond = relationshipEngine.getBondLevel();
    const chapters = relationshipEngine.getChapters();
    const session = 0; // livingSession.getInteractionCount?.() || 0;

    if (chapters.length >= 5) return 'الملحمة';
    if (chapters.length >= 3) return 'القصة المتعمقة';
    if (bond > 40) return 'العلاقة المتنامية';
    if (bond > 15) return 'بداية القصة';
    return 'الصفحة الأولى';
  }

  // ═══════════════════════════════════════════════════
  // 14. AMBIENT INTELLIGENCE
  // ═══════════════════════════════════════════════════
  evaluateAmbientContext(): { batteryLow: boolean; networkSlow: boolean; isNightTime: boolean; isQuietHours: boolean } {
    const hour = new Date().getHours();
    return {
      batteryLow: false,   // يتطلب NativeModules — للتحسين المستقبلي
      networkSlow: false,  // يتطلب NetInfo — للتحسين المستقبلي
      isNightTime: hour >= 22 || hour < 5,
      isQuietHours: hour >= 0 && hour < 6,
    };
  }

  adaptToAmbient(context: { batteryLow: boolean; networkSlow: boolean; isNightTime: boolean }): void {
    if (context.isNightTime) {
      StateBus.update({ spaceEnergy: 'tranquil', presenceLevel: 1 });
      audioMixer.setContext('silence');
    }
    if (context.batteryLow || context.networkSlow) {
      EventBus.emit('PERFORMANCE_MODE', { reason: 'ambient' });
    }
  }
}

export const livingPresenceCoordinator = new LivingPresenceCoordinator();
