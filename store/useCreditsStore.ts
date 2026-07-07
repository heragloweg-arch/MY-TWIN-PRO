import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tier } from './useTwinCoreStore';

interface CreditsState {
  dailyCreditsUsed: number;
  dailyAdsWatched: number;
  dailyCreditsLimit: number;
  lastResetDate: string;
  tier: Tier;

  consumeCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  getRemainingCredits: () => number;
  resetDaily: () => void;
  setTier: (tier: Tier) => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const TIER_CREDITS: Record<Tier, number> = {
  free: 50,
  plus: 200,
  premium: 500,
  pro: 2000,
  yearly: 5000,
};

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      dailyCreditsUsed: 0,
      dailyAdsWatched: 0,
      dailyCreditsLimit: 50,
      lastResetDate: getTodayString(),
      tier: 'free' as Tier,

      consumeCredits: (amount: number) => {
        const state = get();
        if (state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
        if (state.dailyCreditsUsed + amount > state.dailyCreditsLimit) {
          return false;
        }
        set({ dailyCreditsUsed: state.dailyCreditsUsed + amount });
        return true;
      },

      addCredits: (amount: number) => {
        set((s) => ({
          dailyCreditsUsed: Math.max(0, s.dailyCreditsUsed - amount),
        }));
      },

      getRemainingCredits: () => {
        const state = get();
        if (state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
        return Math.max(0, state.dailyCreditsLimit - state.dailyCreditsUsed);
      },

      resetDaily: () => {
        const limit = TIER_CREDITS[get().tier] || 50;
        set({
          dailyCreditsUsed: 0,
          dailyAdsWatched: 0,
          dailyCreditsLimit: limit,
          lastResetDate: getTodayString(),
        });
      },

      setTier: (tier: Tier) => {
        const limit = TIER_CREDITS[tier] || 50;
        set({ tier, dailyCreditsLimit: limit });
      },
    }),
    {
      name: 'mytwin-credits-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.lastResetDate !== getTodayString()) {
          state.resetDaily();
        }
      },
    }
  )
);
