import { EventBus } from './EventBus';
import { StateBus } from './StateBus';
import { audioEngine } from './AudioEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { personalityCoordinator } from '../coordinators/PersonalityCoordinator';

/**
 * بذرة الجلسة — لماذا بدأت
 */
export type SessionSeed =
  | 'manual_conversation'
  | 'morning_check_in'
  | 'study_request'
  | 'business_planning'
  | 'dream_reflection'
  | 'notification_resume'
  | 'voice_conversation'
  | 'image_creation'
  | 'task_management'
  | 'life_coaching'
  | 'creative_work'
  | 'general';

/**
 * هدف الجلسة
 */
export type SessionGoal =
  | 'learn'
  | 'create'
  | 'relax'
  | 'talk'
  | 'heal'
  | 'organize'
  | 'solve_problem'
  | 'reflect'
  | 'build'
  | 'general';

/**
 * نتيجة الجلسة
 */
export type SessionOutcome =
  | 'completed'
  | 'interrupted'
  | 'abandoned'
  | 'successful'
  | 'unresolved'
  | 'continues_later';

/**
 * هوية الجلسة
 */
export type SessionIdentity =
  | 'study'
  | 'creative'
  | 'business'
  | 'reflection'
  | 'silent'
  | 'general';

/**
 * طقس الجلسة
 */
export type SessionWeather =
  | 'calm'
  | 'warm'
  | 'focused'
  | 'dreamy'
  | 'deep'
  | 'fast'
  | 'bright';

/**
 * انتقال داخل الجلسة
 */
interface JourneyStep {
  from: string | null;
  to: string;
  trigger: string;
  reason: string;
  timestamp: number;
}

/**
 * نقطة على القوس العاطفي
 */
interface EmotionalArcPoint {
  emotion: string;
  intensity: number;
  valence: string;
  timestamp: number;
}

/**
 * لحظة مقدسة
 */
interface SacredMoment {
  type: string;
  title: string;
  description: string;
  importance: number;
  timestamp: number;
}

/**
 * لقطة تأملية — تلتقط عند نهاية الجلسة
 */
interface ReflectionSnapshot {
  emotion: string;
  intensity: number;
  energy: number;
  bondLevel: number;
  currentWorld: string;
  currentTopic: string;
  lastThought: string;
  timestamp: number;
}

/**
 * حالة الجلسة الكاملة
 */
interface SessionState {
  id: string;
  seed: SessionSeed;
  identity: SessionIdentity;
  weather: SessionWeather;
  goal: SessionGoal;
  outcome: SessionOutcome | null;
  startedAt: number;
  pausedAt: number | null;
  totalPausedMs: number;
  journey: JourneyStep[];
  emotionalArc: EmotionalArcPoint[];
  sacredMoments: SacredMoment[];
  primarySacredMoment: SacredMoment | null;
  secondarySacredMoment: SacredMoment | null;
  currentWorld: string;
  bondAtStart: number;
  energyLevel: number;
  depthScore: number;
  continuationToken: string | null;
  previousSessionId: string | null;
  reflectionSnapshot: ReflectionSnapshot | null;
  isActive: boolean;
}

/**
 * LIVING SESSION MANAGER v2.0
 * ============================
 * يدير الجلسة كفصل من حياة التوأم مع المستخدم.
 *
 * الإضافات الست:
 *   1. Session Seed — لماذا بدأت هذه الجلسة؟
 *   2. Session Goal — ما هدفها؟
 *   3. Session Outcome — كيف انتهت؟
 *   4. Sacred Moments Index — لحظة أساسية + ثانوية
 *   5. Continuation Token — Resume أم New Session؟
 *   6. Reflection Snapshot — آخر لقطة قبل الإغلاق
 *
 * 0 محركات جديدة. طبقة زمن فقط.
 */
export class LivingSession {
  private session: SessionState | null = null;
  private lastSessionId: string | null = null;
  private journeyUnsubscribers: Array<() => void> = [];
  private emotionalInterval: ReturnType<typeof setInterval> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private goalDetectionTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * بدء جلسة جديدة
   */
  start(seed: SessionSeed = 'general'): SessionState {
    const now = Date.now();

    // هل هذه استئناف لجلسة سابقة؟
    const continuationToken = this.lastSessionId || null;
    const isResume = !!continuationToken;

    if (isResume && this.session?.isActive) {
      this.resume();
      return this.session!;
    }

    const identity = this.detectSessionIdentity();
    const weather = this.detectSessionWeather();
    const bond = relationshipEngine.getBondLevel();

    this.session = {
      id: `session_${now}_${Math.random().toString(36).substr(2, 6)}`,
      seed,
      identity,
      weather,
      goal: this.detectInitialGoal(seed),
      outcome: null,
      startedAt: now,
      pausedAt: null,
      totalPausedMs: 0,
      journey: [{ from: null, to: 'living_world', trigger: 'system', reason: 'session_start', timestamp: now }],
      emotionalArc: [{ emotion: emotionEngine.getCurrentEmotion(), intensity: emotionEngine.getIntensity(), valence: 'neutral', timestamp: now }],
      sacredMoments: [],
      primarySacredMoment: null,
      secondarySacredMoment: null,
      currentWorld: 'living_world',
      bondAtStart: bond,
      energyLevel: 0.85,
      depthScore: 0.5,
      continuationToken,
      previousSessionId: this.lastSessionId,
      reflectionSnapshot: null,
      isActive: true,
    };

    this.bindJourneyEvents();
    this.startEmotionalTracking();
    this.startInactivityTimer();
    this.startGoalDetection();

    audioEngine.play('startup_birth');
    StateBus.update({ presenceLevel: 2, interfaceState: 'aware' });
    EventBus.emit('SESSION_STARTED', {
      sessionId: this.session.id,
      seed,
      identity,
      weather,
      goal: this.session.goal,
      isResume,
    });

    console.log(`[LivingSession] ✨ بدأت: ${identity} | بذرة: ${seed} | هدف: ${this.session.goal} | ${isResume ? 'استئناف' : 'جديدة'}`);
    return this.session;
  }

  /**
   * إيقاف مؤقت (خروج للتطبيقات الأخرى)
   */
  pause(): void {
    if (!this.session?.isActive) return;
    this.session.pausedAt = Date.now();
    this.session.isActive = false;

    if (this.emotionalInterval) { clearInterval(this.emotionalInterval); this.emotionalInterval = null; }
    if (this.inactivityTimer) { clearTimeout(this.inactivityTimer); this.inactivityTimer = null; }
    if (this.goalDetectionTimer) { clearTimeout(this.goalDetectionTimer); this.goalDetectionTimer = null; }

    StateBus.update({ presenceLevel: 0, interfaceState: 'dormant' });
    EventBus.emit('SESSION_PAUSED', { sessionId: this.session.id });
    console.log('[LivingSession] ⏸️ متوقفة مؤقتاً');
  }

  /**
   * استئناف الجلسة
   */
  resume(): void {
    if (!this.session || this.session.isActive) return;
    if (this.session.pausedAt) {
      this.session.totalPausedMs += Date.now() - this.session.pausedAt;
      this.session.pausedAt = null;
    }
    this.session.isActive = true;
    this.startEmotionalTracking();
    this.startInactivityTimer();
    StateBus.update({ presenceLevel: 2, interfaceState: 'aware' });
    EventBus.emit('SESSION_RESUMED', { sessionId: this.session.id });
    console.log('[LivingSession] ▶️ استؤنفت');
  }

  /**
   * إنهاء الجلسة
   */
  end(exitReason: string = 'user_closed', outcome?: SessionOutcome): SessionState | null {
    if (!this.session) return null;

    this.session.isActive = false;
    const endedAt = Date.now();
    const durationMs = endedAt - this.session.startedAt - this.session.totalPausedMs;
    const durationMin = Math.round(durationMs / 60000);

    // آخر نقطة عاطفية
    this.session.emotionalArc.push({
      emotion: emotionEngine.getCurrentEmotion(),
      intensity: emotionEngine.getIntensity(),
      valence: 'neutral',
      timestamp: endedAt,
    });

    // نتيجة الجلسة
    this.session.outcome = outcome || this.detectOutcome(exitReason, durationMin);

    // لقطة تأملية
    this.session.reflectionSnapshot = {
      emotion: emotionEngine.getCurrentEmotion(),
      intensity: emotionEngine.getIntensity(),
      energy: this.session.energyLevel,
      bondLevel: relationshipEngine.getBondLevel(),
      currentWorld: this.session.currentWorld,
      currentTopic: '',
      lastThought: '',
      timestamp: endedAt,
    };

    // فهرسة اللحظات المقدسة
    this.indexSacredMoments();

    // حساب العمق
    const avgIntensity = this.session.emotionalArc.reduce((sum, p) => sum + p.intensity, 0) / this.session.emotionalArc.length;
    this.session.depthScore = avgIntensity;

    const bondDelta = relationshipEngine.getBondLevel() - this.session.bondAtStart;

    // حفظ للجلسة القادمة
    this.lastSessionId = this.session.id;

    this.saveToMemory(durationMin, bondDelta);
    this.unbindJourneyEvents();
    if (this.emotionalInterval) clearInterval(this.emotionalInterval);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.goalDetectionTimer) clearTimeout(this.goalDetectionTimer);

    audioEngine.play('workspace_exit');
    StateBus.update({ presenceLevel: 0, interfaceState: 'dormant' });

    EventBus.emit('SESSION_ENDED', {
      sessionId: this.session.id,
      duration: durationMin,
      seed: this.session.seed,
      identity: this.session.identity,
      weather: this.session.weather,
      goal: this.session.goal,
      outcome: this.session.outcome,
      worldsVisited: [...new Set(this.session.journey.map(j => j.to))],
      emotionalArc: this.session.emotionalArc,
      sacredMoments: this.session.sacredMoments.length,
      primarySacredMoment: this.session.primarySacredMoment,
      bondDelta,
      depthScore: this.session.depthScore,
      continuationToken: this.session.continuationToken,
      reflectionSnapshot: this.session.reflectionSnapshot,
    });

    console.log(`[LivingSession] 🌙 انتهت: ${durationMin}د | ${this.session.sacredMoments.length} لحظات | نتيجة: ${this.session.outcome}`);

    const finalSession = { ...this.session };
    this.session = null;
    return finalSession;
  }

  /**
   * هل هناك جلسة نشطة؟
   */
  isActive(): boolean { return this.session?.isActive ?? false; }

  /**
   * الجلسة الحالية
   */
  getCurrent(): SessionState | null { return this.session; }

  /**
   * آخر جلسة
   */
  getLastSessionId(): string | null { return this.lastSessionId; }

  /**
   * إضافة لحظة مقدسة
   */
  addSacredMoment(type: string, title: string, description: string): void {
    if (!this.session) return;
    const moment: SacredMoment = { type, title, description, importance: 90, timestamp: Date.now() };
    this.session.sacredMoments.push(moment);

    // فهرسة فورية
    this.indexSacredMoments();

    EventBus.emit('SACRED_MOMENT', moment);
  }

  /**
   * تحديث هدف الجلسة
   */
  updateGoal(goal: SessionGoal): void {
    if (!this.session) return;
    this.session.goal = goal;
    EventBus.emit('SESSION_GOAL_CHANGED', { sessionId: this.session.id, goal });
  }

  // ═══════════════════════════════════════════════════
  // Private — الكشف عن بذرة الجلسة وهدفها
  // ═══════════════════════════════════════════════════

  private detectSessionIdentity(): SessionIdentity {
    const emotion = emotionEngine.getCurrentEmotion();
    if (emotion === 'focused' || emotion === 'curious') return 'study';
    if (emotion === 'inspired' || emotion === 'joy') return 'creative';
    if (emotion === 'calm' && new Date().getHours() >= 22) return 'reflection';
    return 'general';
  }

  private detectSessionWeather(): SessionWeather {
    const emotion = emotionEngine.getCurrentEmotion();
    if (emotion === 'calm') return 'calm';
    if (emotion === 'focused') return 'focused';
    if (emotion === 'joy') return 'bright';
    if (new Date().getHours() >= 22) return 'dreamy';
    return 'warm';
  }

  private detectInitialGoal(seed: SessionSeed): SessionGoal {
    const mapping: Record<SessionSeed, SessionGoal> = {
      study_request: 'learn',
      creative_work: 'create',
      morning_check_in: 'talk',
      life_coaching: 'heal',
      task_management: 'organize',
      business_planning: 'solve_problem',
      dream_reflection: 'reflect',
      manual_conversation: 'general',
      notification_resume: 'general',
      voice_conversation: 'talk',
      image_creation: 'create',
      general: 'general',
    };
    return mapping[seed] || 'general';
  }

  private detectOutcome(exitReason: string, durationMin: number): SessionOutcome {
    if (exitReason === 'inactivity' && durationMin > 5) return 'interrupted';
    if (exitReason === 'inactivity' && durationMin < 5) return 'abandoned';
    if (exitReason === 'user_closed' && durationMin < 2) return 'abandoned';
    if (exitReason === 'crash') return 'interrupted';
    return 'completed';
  }

  private indexSacredMoments(): void {
    if (!this.session || this.session.sacredMoments.length === 0) return;
    const sorted = [...this.session.sacredMoments].sort((a, b) => b.importance - a.importance);
    this.session.primarySacredMoment = sorted[0];
    this.session.secondarySacredMoment = sorted.length > 1 ? sorted[1] : null;
  }

  // ═══════════════════════════════════════════════════
  // Private — اكتشاف الهدف بعد دقيقة
  // ═══════════════════════════════════════════════════
  private startGoalDetection(): void {
    this.goalDetectionTimer = setTimeout(() => {
      if (!this.session?.isActive) return;
      const journey = this.session.journey;
      const worlds = journey.map(j => j.to);
      if (worlds.includes('study')) this.updateGoal('learn');
      else if (worlds.includes('code_lab')) this.updateGoal('build');
      else if (worlds.includes('business')) this.updateGoal('solve_problem');
      else if (worlds.includes('content_creator')) this.updateGoal('create');
    }, 60000);
  }

  // ═══════════════════════════════════════════════════
  // Private — بقية الدوال (لم تتغير)
  // ═══════════════════════════════════════════════════

  private bindJourneyEvents(): void {
    this.journeyUnsubscribers.push(
      EventBus.on('WORKSPACE_TRANSFORM_START', (payload: any) => {
        if (!this.session) return;
        const step: JourneyStep = {
          from: this.session.currentWorld,
          to: payload?.to || 'living_world',
          trigger: 'consciousness',
          reason: payload?.reason || 'navigation',
          timestamp: Date.now(),
        };
        this.session.journey.push(step);
        this.session.currentWorld = step.to;
      }),
    );
  }

  private unbindJourneyEvents(): void {
    this.journeyUnsubscribers.forEach(unsub => unsub());
    this.journeyUnsubscribers = [];
  }

  private startEmotionalTracking(): void {
    if (this.emotionalInterval) return;
    this.emotionalInterval = setInterval(() => {
      if (!this.session?.isActive) return;
      this.session.emotionalArc.push({
        emotion: emotionEngine.getCurrentEmotion(),
        intensity: emotionEngine.getIntensity(),
        valence: 'neutral',
        timestamp: Date.now(),
      });
      if (this.session.emotionalArc.length > 200) {
        this.session.emotionalArc = this.session.emotionalArc.slice(-100);
      }
    }, 30000);
  }

  private startInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      if (this.session?.isActive) this.end('inactivity');
    }, 1800000);
  }

  private async saveToMemory(durationMin: number, bondDelta: number): Promise<void> {
    if (!this.session) return;
    try {
      const worlds = [...new Set(this.session.journey.map(j => j.to))];
      const summary = `${this.session.seed} → ${this.session.goal} | ${durationMin}د | ${worlds.length} عوالم | ${this.session.sacredMoments.length} لحظات | نتيجة: ${this.session.outcome}`;
      await memoryEngine.store('event', summary, 70, this.session.weather, ['session', this.session.seed]);
    memoryEngine.applyAging();
    } catch (e) {}
  }
}

export const livingSession = new LivingSession();
