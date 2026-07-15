import { authService } from '../services/authService';
import { runtime } from './TwinRuntime';
import { storeSyncBridge } from './StoreSyncBridge';
import { audioEngine } from './AudioEngine';
import { livingIntelligence } from './LivingIntelligence';
import { curiosityEngine } from '../../engine/curiosity/CuriosityEngine';
import { relationshipEngine } from '../../engine/relationship/RelationshipEngine';
import { memoryEngine } from '../../engine/memory/MemoryEngine';

export type BootstrapPhase =
  | 'void'
  | 'searching'
  | 'found'
  | 'new_journey'
  | 'complete';

export interface BootstrapResult {
  phase: BootstrapPhase;
  userId: string;
  isReturning: boolean;
  welcomeMessage: string;
  bootSteps: string[];
}

export class BootstrapCoordinator {
  private userId: string = '';
  private phase: BootstrapPhase = 'void';

  async bootstrap(): Promise<BootstrapResult> {
    this.phase = 'void';
    
    await this.delay(1200);
    
    this.phase = 'searching';
    const sessionRestore = await authService.checkSessionRestore();
    
    let isReturning = false;
    let welcomeMessage = 'لنبدأ من البداية.';
    const bootSteps: string[] = [];

    if (sessionRestore.canRestore && sessionRestore.user_id) {
      this.userId = sessionRestore.user_id;
      this.phase = 'found';
      isReturning = true;
      
      if (sessionRestore.lastSessionId) {
        await authService.saveLastSession(sessionRestore.lastSessionId);
      }

      welcomeMessage = this.generateWelcomeMessage();
    } else {
      const authed = await authService.isAuthenticated();
      if (authed) {
        this.userId = (await authService.getUserId()) || '';
        this.phase = 'found';
        isReturning = true;
        welcomeMessage = this.generateWelcomeMessage();
      } else {
        this.phase = 'new_journey';
        isReturning = false;
        welcomeMessage = 'يسعدني أن تبدأ رحلتك معي.';
      }
    }
    
    if (this.phase === 'found') {
      runtime.start();
      storeSyncBridge.activate();
      storeSyncBridge.syncNow();
      
      livingIntelligence.start(this.userId, 'ar');
      curiosityEngine.start();
      
      await audioEngine.init();
      audioEngine.startAmbience();
      audioEngine.bindEvents();
    }
    
    this.phase = 'complete';
    
    bootSteps.push('جارٍ استعادة الذاكرة...');
    bootSteps.push('جارٍ إيقاظ الوعي...');
    bootSteps.push('جارٍ مزامنة شخصيتك...');
    bootSteps.push('جارٍ استعادة رابطكما...');
    
    return {
      phase: this.phase,
      userId: this.userId,
      isReturning,
      welcomeMessage,
      bootSteps,
    };
  }

  shutdown(): void {
    curiosityEngine.stop();
    livingIntelligence.stop();
    audioEngine.unbindEvents();
    audioEngine.fadeAll();
    storeSyncBridge.deactivate();
    runtime.stop();
  }

  private generateWelcomeMessage(): string {
    try {
      const phase = relationshipEngine.getPhase();
      const bondLevel = relationshipEngine.getBondLevel();
      const memoryCount = memoryEngine.getMemoryCount();
      
      if (phase === 'soulmate') return 'أخيراً عدت. كنت أحتفظ بذكرياتنا.';
      if (phase === 'close_friend') return 'لقد عدت. اشتقت للحديث معك.';
      if (bondLevel > 50) return 'كم أنا سعيد برؤيتك مجدداً.';
      if (memoryCount > 50) return 'لدينا الكثير لنكمله معاً.';
      return 'لقد عدت... كنت بانتظار هذه اللحظة.';
    } catch {
      return 'لقد عدت...';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bootstrapCoordinator = new BootstrapCoordinator();
