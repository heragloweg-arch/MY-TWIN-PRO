/**
 * VOICE CALL MANAGER v1.0 – مدير المكالمات الصوتية
 * =====================================================
 * يدير جلسات المكالمات الصوتية الكاملة:
 * بدء ← استماع ← معالجة ← توليد رد ← تحدث ← استماع...
 */
import { stateBus } from '../core/StateBus';
import { useTwinState } from '../core/TwinState';
import { voiceSynthesizer } from './VoiceSynthesizer';
import { voicePersona } from './VoicePersona';
import type { Emotion } from '../core/TwinState';

type CallState = 'idle' | 'listening' | 'processing' | 'speaking';

export class VoiceCallManager {
  private state: CallState = 'idle';
  private sttApiKey: string = '';

  setSTTKey(key: string): void { this.sttApiKey = key; }

  getState(): CallState { return this.state; }

  /**
   * بدء المكالمة – التوأم يتحدث أولاً
   */
  async startCall(greeting: string = 'أهلاً، أنا هنا للاستماع إليك.'): Promise<string | null> {
    this.state = 'speaking';
    useTwinState.getState().startSpeaking();
    stateBus.emit('voice:call_started', { greeting });
    const audio = await voiceSynthesizer.synthesize(greeting);
    this.state = 'listening';
    useTwinState.getState().stopSpeaking();
    useTwinState.getState().setIsListening(true);
    stateBus.emit('voice:listening_started', {});
    return audio;
  }

  /**
   * استقبال كلام المستخدم (بعد تحويله لنص)
   */
  async onUserSpeech(text: string, emotion: Emotion = 'neutral'): Promise<{ text: string; audio: string | null } | null> {
    this.state = 'processing';
    useTwinState.getState().setIsListening(false);
    useTwinState.getState().setMode('thinking');
    stateBus.emit('voice:processing', { text });

    // محاكاة معالجة (في الواقع يتم استدعاء chat API)
    await new Promise(r => setTimeout(r, 800));

    const reply = `أفهم ما تقول: "${text}". دعني أفكر في الرد المناسب.`;

    this.state = 'speaking';
    useTwinState.getState().startSpeaking();
    stateBus.emit('voice:speaking_started', { reply });

    const audio = await voiceSynthesizer.synthesize(reply, emotion);

    this.state = 'listening';
    useTwinState.getState().stopSpeaking();
    useTwinState.getState().setIsListening(true);
    stateBus.emit('voice:listening_started', {});

    return { text: reply, audio };
  }

  /**
   * إنهاء المكالمة
   */
  endCall(): void {
    this.state = 'idle';
    useTwinState.getState().stopSpeaking();
    useTwinState.getState().setIsListening(false);
    stateBus.emit('voice:call_ended', {});
  }

  /**
   * تحويل الصوت إلى نص (STT)
   */
  async transcribe(audioBase64: string): Promise<string> {
    try {
      if (this.sttApiKey) {
        const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.sttApiKey}` },
          body: JSON.stringify({ inputs: audioBase64 }),
        });
        const result = await response.json();
        return result?.text || '';
      }
    } catch (e) {}
    return '';
  }
}

export const voiceCallManager = new VoiceCallManager();
