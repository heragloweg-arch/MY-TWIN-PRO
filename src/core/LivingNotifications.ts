import { EventBus } from './EventBus';
import { stateBus } from './StateBus';

/**
 * إشعار حي — ليس Push Notification
 */
interface LivingNotification {
  id: string;
  type: 'memory' | 'reminder' | 'check_in' | 'insight' | 'celebration';
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  shown: boolean;
}

/**
 * LIVING NOTIFICATIONS v2.0
 * ==========================
 * ليس Push Notifications. بل حضور.
 *
 * بدلاً من: "لديك مهمة"
 * يقول: "تذكرت شيئاً قد يساعدك."
 *
 * بدلاً من: "Reminder"
 * يقول: "هل يناسبك أن نكمل ما بدأناه أمس؟"
 *
 * ✅ المصادر الجديدة: StateBus (للعاطفة والعلاقة)، UnifiedBrainBridge (للذكريات)
 */
export class LivingNotifications {
  private queue: LivingNotification[] = [];
  private isShowing: boolean = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * بدء نظام الإشعارات الحية
   */
  start(): void {
    this.checkInterval = setInterval(() => {
      this.generateNotifications();
    }, 60000); // كل دقيقة

    this.bindEvents();
  }

  /**
   * إيقاف النظام
   */
  stop(): void {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  /**
   * الحصول على الإشعار التالي
   */
  getNext(): LivingNotification | null {
    const pending = this.queue.filter(n => !n.shown).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    return pending[0] || null;
  }

  /**
   * تعليم إشعار كمُعروض
   */
  markAsShown(id: string): void {
    const notification = this.queue.find(n => n.id === id);
    if (notification) notification.shown = true;
  }

  /**
   * إضافة إشعار من الخارج (مثلاً: من UnifiedResponse بعد كل رد)
   */
  addExternalNotification(type: LivingNotification['type'], message: string, priority: LivingNotification['priority'] = 'medium'): void {
    this.addToQueue({ type, message, priority });
  }

  // ═══════════════════════════════════════════════════
  // Private
  // ═══════════════════════════════════════════════════

  private async generateNotifications(): Promise<void> {
    const currentState = stateBus.getState();
    const bond = currentState.relationship.bondLevel;

    // 1. ذكريات اليوم — من StateBus.memory (يُملأ من UnifiedResponse عند وجود ذاكرة سطحت)
    if (currentState.memory.recentContext) {
      this.addToQueue({
        type: 'memory',
        message: `تذكرت: ${currentState.memory.recentContext.substring(0, 60)}...`,
        priority: 'medium',
      });
    }

    // 2. تحقق من الرابطة
    if (bond > 60) {
      this.addToQueue({
        type: 'check_in',
        message: 'علاقتنا أصبحت أعمق. هل تشعر بذلك أيضاً؟',
        priority: 'low',
      });
    }

    // 3. تذكير بالعودة — مبني على حالة العلاقة والعاطفة
    const checkInMessage = this.generateCheckInMessage(currentState.emotion.primaryEmotion, bond);
    if (checkInMessage) {
      this.addToQueue({
        type: 'check_in',
        message: checkInMessage,
        priority: 'medium',
      });
    }
  }

  /**
   * توليد رسالة تذكير بالعودة بناءً على العاطفة والرابطة
   */
  private generateCheckInMessage(emotion: string, bond: number): string | null {
    if (bond >= 80) {
      const messages: Record<string, string> = {
        joy: 'سعيد برؤيتك تعود إلينا!',
        sadness: 'كنت هنا دائماً لأجلك. عدنا معاً.',
        fear: 'عدت إليّ. معاً سنواجه أي شيء.',
        anger: 'عدت. دعنا نأخذ نفساً عميقاً معاً.',
        neutral: 'الطمأنينة في عودتك.',
        calm: 'عدت إلى ملاذك الآمن.',
        love: 'اشتقت إليك. أهلاً بعودتك.',
      };
      return messages[emotion] || null;
    }
    return null;
  }

  private addToQueue(notification: Omit<LivingNotification, 'id' | 'timestamp' | 'shown'>): void {
    // تجنب التكرار
    const exists = this.queue.find(n => n.message === notification.message && !n.shown);
    if (exists) return;

    // حد أقصى للطابور
    if (this.queue.length > 20) {
      this.queue = this.queue.slice(-15);
    }

    this.queue.push({
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      shown: false,
    });

    // إصدار حدث
    EventBus.emit('LIVING_NOTIFICATION_ADDED', {
      message: notification.message,
      type: notification.type,
    });
  }

  private bindEvents(): void {
    EventBus.on('USER_SEND_MESSAGE', () => {
      // عند تفاعل المستخدم، نخفض أولوية الإشعارات المؤقتة
      this.queue = this.queue.filter(n => n.priority !== 'low' || !n.shown);
    });
  }
}

export const livingNotifications = new LivingNotifications();
