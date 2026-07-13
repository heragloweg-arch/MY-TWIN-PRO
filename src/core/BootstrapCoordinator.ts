import { authService } from '../services/authService';
import { runtime } from './TwinRuntime';
import { storeSyncBridge } from './StoreSyncBridge';
import { audioEngine } from './AudioEngine';
import { livingIntelligence } from './LivingIntelligence';

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
}

export class BootstrapCoordinator {
  private userId: string = '';
  private phase: BootstrapPhase = 'void';

  async bootstrap(): Promise<BootstrapResult> {
    this.phase = 'void';
    
    // محاكاة لحظة الصمت الأولى
    await this.delay(1200);
    
    this.phase = 'searching';
    const sessionRestore = await authService.checkSessionRestore();
    
    let wasReturning = false;

    if (sessionRestore.canRestore && sessionRestore.user_id) {
      this.userId = sessionRestore.user_id;
      this.phase = 'found';
      wasReturning = true;
      
      if (sessionRestore.lastSessionId) {
        await authService.saveLastSession(sessionRestore.lastSessionId);
      }
    } else {
      const authed = await authService.isAuthenticated();
      if (authed) {
        this.userId = (await authService.getUserId()) || '';
        this.phase = 'found';
        wasReturning = true;
      } else {
        this.phase = 'new_journey';
        wasReturning = false;
      }
    }
    
    if (this.phase === 'found') {
      // تهيئة الأنظمة
      runtime.start();
      storeSyncBridge.activate();
      storeSyncBridge.syncNow();
      
      // اللغة ستأتي من Profile لاحقًا
      livingIntelligence.start(this.userId, 'ar');
      
      await audioEngine.init();
      audioEngine.startAmbience();
      audioEngine.bindEvents();
    }
    
    this.phase = 'complete';
    
    return {
      phase: this.phase,
      userId: this.userId,
      isReturning: wasReturning,
    };
  }

  shutdown(): void {
    livingIntelligence.stop();
    audioEngine.unbindEvents();
    audioEngine.fadeAll();
    storeSyncBridge.deactivate();
    runtime.stop();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const bootstrapCoordinator = new BootstrapCoordinator();
