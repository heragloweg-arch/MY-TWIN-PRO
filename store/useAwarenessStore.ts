import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AwarenessState {
  awarenessScore: number;
  dailyNotificationsSent: number;
  dailyNotificationsLimit: number;
  conversationStreak: number;
  usedMemoryCount: number;
  isOnline: boolean;
  lastSyncTimestamp: string | null;
  hasHydrated: boolean;

  setOnline: (online: boolean) => void;
  setConversationStreak: (streak: number) => void;
  incrementUsedMemory: () => void;
  setAwarenessData: (score: number, sent: number, limit: number) => void;
  setHasHydrated: (val: boolean) => void;
  reset: () => void;
}

const initialState = {
  awarenessScore: 0,
  dailyNotificationsSent: 0,
  dailyNotificationsLimit: 2,
  conversationStreak: 0,
  usedMemoryCount: 0,
  isOnline: true,
  lastSyncTimestamp: null as string | null,
  hasHydrated: false,
};

export const useAwarenessStore = create<AwarenessState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnline: (online) => set({ isOnline: online }),
      setConversationStreak: (streak) => set({ conversationStreak: streak }),
      incrementUsedMemory: () => set((s) => ({ usedMemoryCount: s.usedMemoryCount + 1 })),
      setAwarenessData: (score, sent, limit) => set({ awarenessScore: score, dailyNotificationsSent: sent, dailyNotificationsLimit: limit }),
      setHasHydrated: (val) => set({ hasHydrated: val }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'mytwin-awareness-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
