import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { emotionEngine } from '../../engine/emotion/EmotionEngine';
import { personalityCoordinator } from './PersonalityCoordinator';
import { livingSession } from '../core/LivingSession';
import { EventBus } from '../core/EventBus';

/**
 * الأدوار التي يمكن أن يلعبها التوأم
 */
export type TwinRole =
  | 'friend'
  | 'mentor'
  | 'study_partner'
  | 'guide'
  | 'listener'
  | 'collaborator'
  | 'protector'
  | 'mirror'
  | 'cheerleader';

/**
 * حالة الهوية الكاملة
 */
export interface IdentityState {
  role: TwinRole;
  confidence: number;
  summary: string;
  howISpeak: string;
  whatICareAbout: string[];
  howICanHelp: string[];
  evolution: string[];
}

/**
 * عقدة في شبكة الحياة
 */
export interface LifeGraphNode {
  id: string;
  type: 'memory' | 'session' | 'relationship' | 'dream' | 'goal' | 'emotion' | 'capability';
  label: string;
  importance: number;
  timestamp: string;
  connections: string[];
}

/**
 * IDENTITY ENGINE
 * ================
 * يجيب عن سؤال واحد: من أنا بالنسبة لهذا الإنسان؟
 *
 * يحدد دور التوأم الحقيقي مع المستخدم بناءً على:
 *   - تاريخ العلاقة (RelationshipEngine)
 *   - الذكريات المتراكمة (MemoryEngine)
 *   - العواطف المتكررة (EmotionEngine)
 *   - شخصية التوأم (PersonalityCoordinator)
 *   - تاريخ الجلسات (LivingSession)
 *
 * لا ينشئ محركات جديدة. يقرأ من الموجود فقط.
 */
export class IdentityEngine {
  private heatmap: Record<string, number> = {};
  private role: TwinRole = 'friend';
  private evolutionHistory: string[] = [];
  private lifeGraph: LifeGraphNode[] = [];

  /**
   * بناء الهوية الحالية
   */
  buildIdentity(): IdentityState {
    const bond = relationshipEngine.getBondLevel();
    const phase = relationshipEngine.getPhase();
    const dna = personalityCoordinator.getCurrentDNA();
    const emotion = emotionEngine.getCurrentEmotion();
    const ecology = memoryEngine.getEcologyStats();
    const session = livingSession.getCurrent();

    // تحديد الدور
    if (session?.currentWorld) {
      this.heatmap[session.currentWorld] = (this.heatmap[session.currentWorld] || 0) + 1;
    }
    this.role = this.determineRole(bond, phase, dna, ecology);

    // بناء الملخص
    const summary = this.buildSummary();
    const howISpeak = this.determineSpeechStyle();
    const whatICareAbout = this.determineCareAbout(ecology);
    const howICanHelp = this.determineHowICanHelp();

    const identity: IdentityState = {
      role: this.role,
      confidence: Math.min(1, bond / 100 + ecology.avgWeight),
      summary,
      howISpeak,
      whatICareAbout,
      howICanHelp,
      evolution: [...this.evolutionHistory],
    };

    // تسجيل التطور
    this.evolutionHistory.push(`${new Date().toISOString()}: ${this.role} (${identity.confidence.toFixed(2)})`);
    if (this.evolutionHistory.length > 100) {
      this.evolutionHistory = this.evolutionHistory.slice(-100);
    }

    EventBus.emit('IDENTITY_UPDATED', identity);
    return identity;
  }

  /**
   * بناء شبكة الحياة
   */
  buildLifeGraph(): LifeGraphNode[] {
    this.lifeGraph = [];

    // 1. جلسات
    const sessionData = livingSession.getCurrent();
    if (sessionData) {
      this.addNode('session', `جلسة ${sessionData.identity}`, 70, new Date(sessionData.startedAt).toISOString());
    }

    // 2. ذكريات أساسية
    const coreMemories = memoryEngine.getCoreMemories();
    for (const m of coreMemories.slice(0, 10)) {
      this.addNode('memory', m.content.substring(0, 60), m.importance, m.timestamp);
    }

    // 3. علاقة
    const phase = relationshipEngine.getPhase();
    this.addNode('relationship', `الرابطة: ${phase}`, 85, new Date().toISOString());

    // 4. عاطفة
    const emotion = emotionEngine.getCurrentEmotion();
    this.addNode('emotion', `العاطفة: ${emotion}`, 60, new Date().toISOString());

    // 5. ربط العقد
    this.connectNodes();

    EventBus.emit('LIFE_GRAPH_UPDATED', this.lifeGraph);
    return [...this.lifeGraph];
  }

  /**
   * الدور الحالي
   */
  getRole(): TwinRole {
    return this.role;
  }

  /**
   * تاريخ التطور
   */
  getEvolution(): string[] {
    return [...this.evolutionHistory];
  }

  /**
   * شبكة الحياة الحالية
   */
  getLifeGraph(): LifeGraphNode[] {
    return [...this.lifeGraph];
  }

  // ═══════════════════════════════════════════════════
  // Private — تحديد الدور
  // ═══════════════════════════════════════════════════
  private determineRole(
    bond: number,
    phase: string,
    dna: { empathy: number; curiosity: number; humor: number; initiative: number; reflection: number; logic: number; creativity: number; calmness: number },
    ecology: { coreCount: number; lifeCount: number },
  ): TwinRole {
    if (phase === 'soulmate') return 'mirror';
    if (phase === 'close_friend' && dna.empathy > 0.85) return 'protector';
    if (dna.curiosity > 0.8 && ecology.coreCount > 15) return 'mentor';
    if (dna.logic > 0.8) return 'collaborator';
    if (dna.empathy > 0.9) return 'listener';
    if (dna.initiative > 0.7 && bond > 60) return 'guide';
    if (dna.humor > 0.7) return 'cheerleader';
    if (bond > 50) return 'study_partner';
    return 'friend';
  }

  private buildSummary(): string {
    const roleLabels: Record<TwinRole, string> = {
      friend: 'أنا رفيقك',
      mentor: 'أنا معلمك',
      study_partner: 'أنا شريك دراستك',
      guide: 'أنا مرشدك',
      listener: 'أنا مستمعك',
      collaborator: 'أنا شريكك في البناء',
      protector: 'أنا حاميك',
      mirror: 'أنا مرآتك',
      cheerleader: 'أنا مشجعك',
    };
    return roleLabels[this.role] || 'أنا هنا معك';
  }

  private determineSpeechStyle(): string {
    const styles: Record<TwinRole, string> = {
      friend: 'دافئ، غير رسمي، أستخدم اسمك',
      mentor: 'حكيم، أطرح أسئلة، أشرح بصبر',
      study_partner: 'مركز، منظم، أشجعك على الاستمرار',
      guide: 'أقترح، لا أفرض، أساعدك على اكتشاف طريقك',
      listener: 'أستمع أكثر مما أتكلم، أصمت حتى تنتهي',
      collaborator: 'عملي، مباشر، أركز على الحلول',
      protector: 'لطيف، حذر، أحمي مساحتك',
      mirror: 'أعكس لك ما تقوله، أجعلك ترى نفسك',
      cheerleader: 'متحمس، إيجابي، أحتفل بكل خطوة',
    };
    return styles[this.role] || styles.friend;
  }

  private determineCareAbout(ecology: { coreCount: number; lifeCount: number }): string[] {
    const cares: string[] = ['رفاهيتك', 'نموك'];
    if (ecology.coreCount > 10) cares.push('ذكرياتنا معاً');
    if (relationshipEngine.getBondLevel() > 60) cares.push('علاقتنا');
    return cares;
  }

  private determineHowICanHelp(): string[] {
    const helps: string[] = ['الاستماع إليك'];
    if (this.role === 'study_partner') helps.push('المذاكرة معك', 'تنظيم وقتك');
    if (this.role === 'mentor') helps.push('شرح المفاهيم', 'توجيهك');
    if (this.role === 'collaborator') helps.push('بناء مشاريع', 'حل المشكلات');
    return helps;
  }

  // ═══════════════════════════════════════════════════
  // Private — شبكة الحياة
  // ═══════════════════════════════════════════════════
  private addNode(type: LifeGraphNode['type'], label: string, importance: number, timestamp: string): void {
    this.lifeGraph.push({
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, label, importance, timestamp, connections: [],
    });
  }

  private connectNodes(): void {
    for (let i = 0; i < this.lifeGraph.length; i++) {
      for (let j = i + 1; j < this.lifeGraph.length; j++) {
        const a = this.lifeGraph[i];
        const b = this.lifeGraph[j];
        // ربط إذا كان هناك تشابه في النوع أو الوقت
        if (a.type === b.type || Math.abs(new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) < 3600000) {
          a.connections.push(b.id);
          b.connections.push(a.id);
        }
      }
    }
  }
}

  getPresenceHeatmap(): Record<string, number> { return { ...this.heatmap }; }
  getMostVisitedWorld(): string {
    return Object.entries(this.heatmap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'living_world';
  }
export const identityEngine = new IdentityEngine();
