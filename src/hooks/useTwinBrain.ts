import { useState, useCallback, useRef } from 'react';
import { unifiedBrainBridge, UnifiedResponse, PerceptionData } from '../core/UnifiedBrainBridge';
import { EventBus } from '../core/EventBus';

export interface ThinkingPhase {
  phase: string;
  progress: number;
  label: string;
}

export interface BrainResponse {
  reply: string;
  provider: string;
  emotion: string;
  thinkingPhases: ThinkingPhase[];
  memoryStored: boolean;
  relationshipDelta: number;
}

interface UseTwinBrainReturn {
  isThinking: boolean;
  thinkingPhase: ThinkingPhase | null;
  streamedText: string;
  sendMessage: (message: string) => Promise<BrainResponse>;
  streamMessage: (message: string) => Promise<void>;
  setUserId: (userId: string) => void;
  setLang: (lang: string) => void;
}

const PHASE_LABELS: Record<string, { ar: string; en: string }> = {
  observe:     { ar: 'يراقب...',    en: 'Observing...' },
  understand:  { ar: 'يفهم...',     en: 'Understanding...' },
  recall:      { ar: 'يتذكر...',    en: 'Remembering...' },
  reason:      { ar: 'يفكر...',     en: 'Reasoning...' },
  respond:     { ar: 'يستجيب...',   en: 'Responding...' },
};

export function useTwinBrain(initialUserId: string = '', initialLang: string = 'ar'): UseTwinBrainReturn {
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const bridgeRef = useRef(unifiedBrainBridge);

  bridgeRef.current.setUserId(initialUserId);
  bridgeRef.current.setLang(initialLang);

  const emitPhase = (phase: string, progress: number, lang: string) => {
    const labels = PHASE_LABELS[phase] || PHASE_LABELS.observe;
    const label = lang === 'ar' ? labels.ar : labels.en;
    setThinkingPhase({ phase, progress, label });
    EventBus.emit('AI_COGNITIVE_PHASE', { phase, progress });
  };

  const send = useCallback(async (message: string): Promise<BrainResponse> => {
    setIsThinking(true);
    emitPhase('observe', 0, initialLang);
    EventBus.emit('AI_START_THINKING', { intent: message, confidence: 0.8 });

    try {
      const perception: PerceptionData = {
        typingSpeed: 0,
        messageLength: message.length,
        absenceDurationMinutes: 0,
        timeOfDay: 'morning',
        userState: 'normal',
      };

      const response: UnifiedResponse = await bridgeRef.current.process(message, perception);

      // بناء مراحل التفكير من timing في الاستجابة
      const timing = response.timing || {};
      const phases: ThinkingPhase[] = [];
      if (timing.observe_ms) {
        emitPhase('observe', 0.2, initialLang);
        phases.push({ phase: 'observe', progress: 0.2, label: PHASE_LABELS.observe[initialLang === 'ar' ? 'ar' : 'en'] });
      }
      if (timing.understand_ms) {
        emitPhase('understand', 0.4, initialLang);
        phases.push({ phase: 'understand', progress: 0.4, label: PHASE_LABELS.understand[initialLang === 'ar' ? 'ar' : 'en'] });
      }
      if (timing.recall_ms) {
        emitPhase('recall', 0.6, initialLang);
        phases.push({ phase: 'recall', progress: 0.6, label: PHASE_LABELS.recall[initialLang === 'ar' ? 'ar' : 'en'] });
      }
      if (timing.reason_ms) {
        emitPhase('reason', 0.8, initialLang);
        phases.push({ phase: 'reason', progress: 0.8, label: PHASE_LABELS.reason[initialLang === 'ar' ? 'ar' : 'en'] });
      }
      emitPhase('respond', 1.0, initialLang);
      phases.push({ phase: 'respond', progress: 1.0, label: PHASE_LABELS.respond[initialLang === 'ar' ? 'ar' : 'en'] });

      EventBus.emit('AI_FINISH_THINKING', { response: response.reply, confidence: 0.9 });
      if (response.memory_surfaced) {
        EventBus.emit('MEMORY_CREATED', { memoryId: response.memory_surfaced.id, layer: 'context' });
      }

      return {
        reply: response.reply,
        provider: 'unified_brain',
        emotion: response.twin_emotional_state?.current_emotion || 'neutral',
        thinkingPhases: phases,
        memoryStored: !!response.memory_surfaced,
        relationshipDelta: response.twin_state_update?.bond_delta || 0,
      };
    } catch (error) {
      EventBus.emit('AI_FINISH_THINKING', { response: '', confidence: 0 });
      throw error;
    } finally {
      setIsThinking(false);
      setThinkingPhase(null);
    }
  }, [initialLang]);

  const stream = useCallback(async (message: string): Promise<void> => {
    setIsThinking(true);
    setStreamedText('');
    emitPhase('observe', 0, initialLang);
    EventBus.emit('AI_START_THINKING', { intent: message, confidence: 0.8 });

    try {
      const perception: PerceptionData = {
        typingSpeed: 0,
        messageLength: message.length,
        absenceDurationMinutes: 0,
        timeOfDay: 'morning',
        userState: 'normal',
      };

      const response: UnifiedResponse = await bridgeRef.current.process(message, perception);
      const reply = response.reply || '';
      
      // محاكاة التدفق حرفاً بحرف
      for (let i = 0; i < reply.length; i++) {
        setStreamedText(reply.substring(0, i + 1));
        await new Promise(resolve => setTimeout(resolve, 15));
      }

      EventBus.emit('AI_FINISH_THINKING', { response: reply, confidence: 0.9 });
      // ✅ التحقق من وجود سؤال فضولي استباقي من الخلفية
      if (response.curiosity_question) {
        EventBus.emit('TWIN_SPEAK', {
          phrase: response.curiosity_question,
          tone: 'gentle',
          type: 'curiosity'
        });
      }
    
    } catch (error) {
      EventBus.emit('AI_FINISH_THINKING', { response: '', confidence: 0 });
    } finally {
      setThinkingPhase(null);
      setIsThinking(false);
    }
  }, [initialLang]);

  const setUserId = useCallback((userId: string) => { bridgeRef.current.setUserId(userId); }, []);
  const setLang = useCallback((lang: string) => { bridgeRef.current.setLang(lang); }, []);

  return { isThinking, thinkingPhase, streamedText, sendMessage: send, streamMessage: stream, setUserId, setLang };
}
