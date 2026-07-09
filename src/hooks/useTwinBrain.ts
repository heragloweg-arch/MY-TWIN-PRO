import { useState, useCallback, useRef } from 'react';
import { twinBrain, ThinkingPhase, BrainResponse } from '../core/TwinBrain';
import { EventBus } from '../core/EventBus';

interface UseTwinBrainReturn {
  isThinking: boolean;
  thinkingPhase: ThinkingPhase | null;
  streamedText: string;
  sendMessage: (message: string) => Promise<BrainResponse>;
  streamMessage: (message: string) => Promise<void>;
  setUserId: (userId: string) => void;
  setLang: (lang: string) => void;
}

export function useTwinBrain(initialUserId: string = '', initialLang: string = 'ar'): UseTwinBrainReturn {
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<ThinkingPhase | null>(null);
  const [streamedText, setStreamedText] = useState('');
  const brainRef = useRef(twinBrain);

  brainRef.current.setUserId(initialUserId);
  brainRef.current.setLang(initialLang);

  brainRef.current.onThinking((phase: ThinkingPhase) => {
    setThinkingPhase(phase);
    EventBus.emit('AI_COGNITIVE_PHASE', { phase: phase.phase, progress: phase.progress });
  });

  const send = useCallback(async (message: string): Promise<BrainResponse> => {
    setIsThinking(true);
    setThinkingPhase({ phase: 'observe', progress: 0, label: 'يراقب...' });
    EventBus.emit('AI_START_THINKING', { intent: message, confidence: 0.8 });

    try {
      const result = await brainRef.current.process(message);
      EventBus.emit('AI_FINISH_THINKING', { response: result.reply, confidence: 0.9 });
      if (result.memoryStored) {
        EventBus.emit('MEMORY_CREATED', { memoryId: Date.now().toString(), layer: 'context' });
      }
      return result;
    } catch (error) {
      EventBus.emit('AI_FINISH_THINKING', { response: '', confidence: 0 });
      throw error;
    } finally {
      setIsThinking(false);
      setThinkingPhase(null);
    }
  }, []);

  const stream = useCallback(async (message: string): Promise<void> => {
    setIsThinking(true);
    setStreamedText('');
    setThinkingPhase({ phase: 'observe', progress: 0, label: 'يراقب...' });
    EventBus.emit('AI_START_THINKING', { intent: message, confidence: 0.8 });

    let fullText = '';

    await brainRef.current.streamProcess(
      message,
      (token: string) => {
        fullText += token;
        setStreamedText(fullText);
      },
      () => {
        EventBus.emit('AI_FINISH_THINKING', { response: fullText, confidence: 0.9 });
        setThinkingPhase(null);
        setIsThinking(false);
      },
      (err: string) => {
        EventBus.emit('AI_FINISH_THINKING', { response: '', confidence: 0 });
        setThinkingPhase(null);
        setIsThinking(false);
      },
    );
  }, []);

  const setUserId = useCallback((userId: string) => { brainRef.current.setUserId(userId); }, []);
  const setLang = useCallback((lang: string) => { brainRef.current.setLang(lang); }, []);

  return { isThinking, thinkingPhase, streamedText, sendMessage: send, streamMessage: stream, setUserId, setLang };
}
