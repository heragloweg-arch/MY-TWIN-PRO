import { create } from 'zustand';
import { apiPost } from '../lib/httpClient';
import { useCreditsStore } from './useCreditsStore';
import { useTwinCoreStore } from './useTwinCoreStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'twin' | 'system';
  content: string;
  timestamp: number;
  emotion?: string;
  provider?: string;
  failed?: boolean;
  image?: string;
  thinkingStage?: string;
}

interface ConversationState {
  chatHistory: ChatMessage[];
  totalMessages: number;
  isThinking: boolean;
  thinkingStage: string;
  streamingText: string;
  activeProjectContext: any | null;
  suggestedCapability: { type: string; route: string; label_ar: string; label_en: string } | null;
  menuVisible: boolean;

  addMessage: (msg: Partial<ChatMessage>) => void;
  sendMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  setThinking: (thinking: boolean) => void;
  setThinkingStage: (stage: string) => void;
  setStreamingText: (text: string) => void;
  clearHistory: () => void;
  loadProjectContext: (project: any) => void;
  clearProjectContext: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

const generateId = () => 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);

export const useConversationStore = create<ConversationState>((set, get) => ({
  chatHistory: [],
  totalMessages: 0,
  isThinking: false,
  thinkingStage: 'idle',
  streamingText: '',
  activeProjectContext: null,
  suggestedCapability: null,
  menuVisible: false,

  addMessage: (msg) =>
    set((s) => ({
      chatHistory: [...s.chatHistory, {
        id: msg.id || generateId(),
        role: msg.role || 'user',
        content: msg.content || '',
        timestamp: msg.timestamp || Date.now(),
        emotion: msg.emotion,
        provider: msg.provider,
        failed: msg.failed,
        image: msg.image,
        thinkingStage: msg.thinkingStage,
      }].slice(-200),
      totalMessages: s.totalMessages + 1,
    })),

  sendMessage: async (message: string) => {
    const state = get();
    const core = useTwinCoreStore.getState();

    if (!useCreditsStore.getState().consumeCredits(1)) {
      return { success: false, error: 'out_of_credits' };
    }

    set({ isThinking: true, thinkingStage: 'thinking' });
    state.addMessage({ role: 'user', content: message });
    const twinMsgId = generateId();
    state.addMessage({ id: twinMsgId, role: 'twin', content: '', thinkingStage: 'thinking' });

    try {
      const response = await apiPost('/api/chat', {
        message,
        history: state.chatHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        lang: core.lang,
      });

      set((s) => ({
        chatHistory: s.chatHistory.map((m) =>
          m.id === twinMsgId ? { ...m, content: response.reply, provider: response.provider || 'orchestrator', thinkingStage: 'complete' } : m
        ),
        isThinking: false,
        thinkingStage: 'complete',
        suggestedCapability: response.suggested_capability || null,
      }));
      return { success: true };
    } catch (error) {
      set((s) => ({
        chatHistory: s.chatHistory.map((m) =>
          m.id === twinMsgId ? { ...m, content: 'عذراً، حدث خطأ في الاتصال 💜', failed: true } : m
        ),
        isThinking: false,
        thinkingStage: 'complete',
      }));
      return { success: false, error: 'network_error' };
    }
  },

  setThinking: (thinking) => set({ isThinking: thinking }),
  setThinkingStage: (stage) => set({ thinkingStage: stage }),
  setStreamingText: (text) => set({ streamingText: text }),
  clearHistory: () => set({ chatHistory: [], totalMessages: 0 }),
  loadProjectContext: (project) => set({ activeProjectContext: project }),
  clearProjectContext: () => set({ activeProjectContext: null }),
  openMenu: () => set({ menuVisible: true }),
  closeMenu: () => set({ menuVisible: false }),
}));
