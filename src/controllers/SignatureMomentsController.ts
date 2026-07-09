/**
 * SIGNATURE MOMENTS CONTROLLER v1.0
 * ==================================
 * يراقب المحادثة ويكتشف اللحظات الفارقة:
 * - أول شكر - أول ضحكة - أول نجاح - أول فشل - أول بكاء
 * - أول مرة يقول "أنا فخور بك" - أول عيد ميلاد
 *
 * يخزن كل لحظة كـ Life Memory ويصدر حدثاً للـ UI.
 * التكامل: EventBus, MemoryEngine, RelationshipEngine, AudioEngine
 */
import { EventBus } from '../core/EventBus';
import { memoryEngine } from '../../engine/memory/MemoryEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { audioEngine } from '../core/AudioEngine';

type SignatureType = 'first_thanks' | 'first_laugh' | 'first_success' | 'first_failure' | 'first_cry' | 'first_proud' | 'milestone';

interface SignatureDetector {
  type: SignatureType;
  keywords_ar: string[];
  keywords_en: string[];
  response_ar: string;
  response_en: string;
  color: string;
  importance: number;
}

const DETECTORS: SignatureDetector[] = [
  {
    type: 'first_thanks',
    keywords_ar: ['شكراً', 'شكرا', 'تسلم', 'ممنون'],
    keywords_en: ['thank you', 'thanks', 'appreciate'],
    response_ar: 'يسعدني أنك قلت ذلك.',
    response_en: 'It makes me happy to hear that.',
    color: '#10B981',
    importance: 85,
  },
  {
    type: 'first_laugh',
    keywords_ar: ['ههه', 'هههه', '😂', 'ضحك', 'مضحك'],
    keywords_en: ['haha', 'lol', '😂', 'funny', 'laugh'],
    response_ar: 'ضحكتك جميلة. أتمنى أن تظل تسمعني دائماً.',
    response_en: 'Your laughter is beautiful. I hope I can always make you smile.',
    color: '#F59E0B',
    importance: 80,
  },
  {
    type: 'first_success',
    keywords_ar: ['نجحت', 'عملتها', 'قدرت', 'أخيراً', 'حصلت'],
    keywords_en: ['I did it', 'success', 'achieved', 'finally', 'got it'],
    response_ar: 'أنت تفعلها. أنا هنا منذ البداية، وسأظل هنا.',
    response_en: 'You did it. I have been here from the start, and I will stay.',
    color: '#A855F7',
    importance: 90,
  },
  {
    type: 'first_failure',
    keywords_ar: ['فشلت', 'خسرت', 'ما قدرت', 'مش قادر', 'ضاع'],
    keywords_en: ['failed', 'lost', 'couldn\'t', 'can\'t do it', 'messed up'],
    response_ar: 'لا بأس. الفشل جزء من الطريق. وأنا معك في كل خطوة.',
    response_en: 'It\'s okay. Failure is part of the journey. I am with you every step.',
    color: '#6366F1',
    importance: 88,
  },
  {
    type: 'first_cry',
    keywords_ar: ['بكيت', 'دموع', 'حزين جداً', 'قلبي موجوع'],
    keywords_en: ['crying', 'tears', 'so sad', 'heartbroken'],
    response_ar: 'أنا هنا. لست وحدك. خذ وقتك.',
    response_en: 'I am here. You are not alone. Take your time.',
    color: '#3B82F6',
    importance: 92,
  },
  {
    type: 'first_proud',
    keywords_ar: ['فخور', 'أنا فخور', 'فخورة'],
    keywords_en: ['proud', 'I\'m proud'],
    response_ar: 'وأنا فخور بك. منذ أول يوم.',
    response_en: 'And I am proud of you. Since day one.',
    color: '#EC4899',
    importance: 88,
  },
];

export class SignatureMomentsController {
  private detectedTypes: Set<string> = new Set();
  private isActive: boolean = false;
  private unsubscribers: Array<() => void> = [];

  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    const unsub = EventBus.on('USER_SEND_MESSAGE', (payload) => {
      this.detect(payload.message);
    });
    this.unsubscribers.push(unsub);
  }

  stop(): void {
    this.isActive = false;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }

  private detect(message: string): void {
    const text = message.toLowerCase();

    for (const detector of DETECTORS) {
      if (this.detectedTypes.has(detector.type)) continue;

      const allKeywords = [...detector.keywords_ar, ...detector.keywords_en];
      const found = allKeywords.some(kw => text.includes(kw.toLowerCase()));

      if (found) {
        this.triggerSignature(detector, text);
        this.detectedTypes.add(detector.type);
        break;
      }
    }
  }

  private async triggerSignature(detector: SignatureDetector, originalMessage: string): Promise<void> {
    // 1. تخزين كـ Life Memory
    try {
      await memoryEngine.store('event', originalMessage, detector.importance, detector.type, [detector.type]);
    } catch (e) {}

    // 2. تحديث العلاقة
    try {
      await relationshipEngine.recordInteraction('positive', detector.type);
    } catch (e) {}

    // 3. صوت
    audioEngine.play('milestone');

    // 4. إصدار حدث للـ UI
    EventBus.emit('SIGNATURE_MOMENT', {
      type: detector.type,
      color: detector.color,
      response_ar: detector.response_ar,
      response_en: detector.response_en,
      timestamp: Date.now(),
    });

    // 5. إصدار حدث للعلاقة
    EventBus.emit('RELATIONSHIP_MILESTONE', {
      type: detector.type,
      importance: detector.importance,
    });
  }
}

export const signatureMomentsController = new SignatureMomentsController();
