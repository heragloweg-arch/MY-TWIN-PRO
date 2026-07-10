import { EventBus } from './EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { presenceCoordinator } from '../coordinators/PresenceCoordinator';

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
 * LIVING NOTIFICATIONS
 * =====================
 * ليس Push Notifications. بل حضور.
 *
 * بدلاً من: "لديك مهمة"
 * يقول: "تذكرت شيئاً قد يساعدك."
 *
 * بدلاً من: "Reminder"
 * يقول: "هل يناسبك أن نكمل ما بدأناه أمس؟"
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

  // ═══════════════════════════════════════════════════
  // Private
  // ═══════════════════════════════════════════════════

  private async generateNotifications(): Promise<void> {
    const bond = relationshipEngine.getBondLevel();

    // 1. ذكريات اليوم
    try {
      const todayMemories = await memoryEngine.onThisDay();
      if (todayMemories.length > 0) {
        this.addToQueue({
          type: 'memory',
          message: `في مثل هذا اليوم: ${todayMemories[0].content.substring(0, 60)}...`,
          priority: 'medium',
        });
      }
    } catch (e) {}

    // 2. تحقق من الرابطة
    if (bond > 60) {
      this.addToQueue({
        type: 'check_in',
        message: 'علاقتنا أصبحت أعمق. هل تشعر بذلك أيضاً؟',
        priority: 'low',
      });
    }

    // 3. تذكير بالعودة
    const checkIn = await presenceCoordinator.generateCheckIn();
    if (checkIn.suggestedGreeting) {
      this.addToQueue({
        type: 'check_in',
        message: checkIn.suggestedGreeting,
        priority: 'medium',
      });
    }
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
