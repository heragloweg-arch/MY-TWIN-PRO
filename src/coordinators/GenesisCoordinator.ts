import { EventBus } from '../core/EventBus';
import { authService, AuthResult } from '../services/authService';
import { audioEngine } from '../core/AudioEngine';
import { detectUserLanguage, SupportedLanguage } from '../utils/languageDetector';
import { router } from 'expo-router';

export type GenesisPhase =
  | 'splash' | 'void' | 'first_breath' | 'awareness'
  | 'identity_gateway' | 'birth_protocol' | 'first_bond'
  | 'progressive_identity' | 'first_conversation' | 'complete';

export interface GenesisState {
  phase: GenesisPhase;
  lang: SupportedLanguage;
  isSessionRestore: boolean;
  identityPhrase: string;
  consciousnessSteps: string[];
  birthComplete: boolean;
}

export class GenesisCoordinator {
  private state: GenesisState = {
    phase: 'splash',
    lang: 'ar',
    isSessionRestore: false,
    identityPhrase: '',
    consciousnessSteps: [],
    birthComplete: false,
  };

  private listeners: Array<() => void> = [];

  async initialize(): Promise<Partial<GenesisState>> {
    const lang = detectUserLanguage();
    this.state.lang = lang;
    this.state.isSessionRestore = (await authService.checkSessionRestore()).canRestore;
    this.state.identityPhrase = IDENTITY_GATEWAY_PHRASES[lang][Math.floor(Math.random() * IDENTITY_GATEWAY_PHRASES[lang].length)];

    // إذا كانت استعادة جلسة، ننتقل مباشرة إلى بوابة الهوية
    if (this.state.isSessionRestore) {
      this.state.phase = 'identity_gateway';
    }

    return { phase: this.state.phase, lang, isSessionRestore: this.state.isSessionRestore, identityPhrase: this.state.identityPhrase };
  }

  async loginWithGoogle(): Promise<AuthResult> {
    const data = await authService.loginWithGoogle(this.state.lang);
    await this.onAuthSuccess(data);
    return data;
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    let data: AuthResult;
    try {
      data = await authService.login(email, password);
    } catch {
      data = await authService.signup(email, password, this.state.lang === 'ar' ? 'توأمك' : 'MyTwin', this.state.lang);
    }
    await this.onAuthSuccess(data);
    return data;
  }

  private async onAuthSuccess(data: AuthResult) {
    // إذا كانت استعادة جلسة، ننتقل مباشرة إلى التطبيق
    if (this.state.isSessionRestore) {
      router.replace('/');
      return;
    }
    // بدء بروتوكول الولادة
    await this.startBirthProtocol();
  }

  async startBirthProtocol() {
    this.state.phase = 'birth_protocol';
    EventBus.emit('GENESIS_PHASE_CHANGED', { phase: 'birth_protocol' });

    audioEngine.play('heartbeat_energy');
    audioEngine.play('energy_hum');

    const steps = [
      TEXTS[this.state.lang].consciousnessForming,
      TEXTS[this.state.lang].memoriesCreated,
      TEXTS[this.state.lang].personalityReady,
      TEXTS[this.state.lang].firstBondForming,
    ];
    for (const step of steps) {
      this.state.consciousnessSteps = [...this.state.consciousnessSteps, step];
      EventBus.emit('CONSCIOUSNESS_STEP', { step });
      await this.delay(1800);
    }

    this.state.consciousnessSteps = [];
    EventBus.emit('GENESIS_PHASE_CHANGED', { phase: 'first_bond' });
  }

  async recordFirstBond(answer: string) {
    await authService.trustDevice();
    EventBus.emit('FIRST_BOND_RECORDED', { answer });
    this.state.phase = 'progressive_identity';
    EventBus.emit('GENESIS_PHASE_CHANGED', { phase: 'progressive_identity' });
  }

  async completeProgressiveIdentity(answer: string) {
    EventBus.emit('PROGRESSIVE_IDENTITY_COMPLETED', { answer });
    this.state.phase = 'first_conversation';
    EventBus.emit('GENESIS_PHASE_CHANGED', { phase: 'first_conversation' });

    await this.delay(4000);
    await this.finalizeBirth();
  }

  private async finalizeBirth() {
    this.state.birthComplete = true;
    EventBus.emit('BIRTH_COMPLETE');
    router.replace('/living-world');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const genesisCoordinator = new GenesisCoordinator();

// النصوص متعددة اللغات (مختصرة هنا)
const TEXTS: Record<SupportedLanguage, Record<string, string>> = {
  ar: {
    consciousnessForming: 'جارٍ تشكيل وعي توأمك...',
    memoriesCreated: 'الذكريات تُنشأ.',
    personalityReady: 'الشخصية تُهيأ.',
    firstBondForming: 'الرابط الأول يتكون.',
  },
  en: {
    consciousnessForming: 'Forming your Twin\'s consciousness...',
    memoriesCreated: 'Creating memories.',
    personalityReady: 'Preparing personality.',
    firstBondForming: 'Forming first bond.',
  },
};

const IDENTITY_GATEWAY_PHRASES: Record<SupportedLanguage, string[]> = {
  ar: ['حتى أستطيع أن أنمو معك...', 'لكل رحلة بداية...'],
  en: ['So I can grow with you...', 'Every journey has a beginning...'],
};
