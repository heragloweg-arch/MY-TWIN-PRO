/**
 * TWIN STORE v2.0 – الواجهة الموحدة (Facade)
 * ==============================================
 * يجمع كل المتاجر المتخصصة تحت واجهة واحدة للتوافق مع الشاشات القديمة.
 */
import { useTwinCoreStore, TwinCore, Tier, TwinGender, TwinStyle, ReplyStyle, Theme, Lang, VoicePersonality } from './useTwinCoreStore';
import { useCreditsStore } from './useCreditsStore';
import { useCapabilityStore, CapabilityState } from './useCapabilityStore';
import { useConversationStore, ChatMessage } from './useConversationStore';
import { useRelationshipStore } from './useRelationshipStore';
import { useAwarenessStore } from './useAwarenessStore';

export { useTwinCoreStore, useCreditsStore, useCapabilityStore, useConversationStore, useRelationshipStore, useAwarenessStore };
export type { Tier, TwinGender, TwinStyle, ReplyStyle, Theme, Lang, VoicePersonality, ChatMessage };

export function useTwinStore() {
  const core = useTwinCoreStore();
  const credits = useCreditsStore();
  const capability = useCapabilityStore();
  const conversation = useConversationStore();
  const relationship = useRelationshipStore();
  const awareness = useAwarenessStore();

  return {
    ...core,
    getRemainingCredits: credits.getRemainingCredits,
    dailyCreditsLimit: credits.dailyCreditsLimit,
    chatHistory: conversation.chatHistory,
    totalMessages: conversation.totalMessages,
    isThinking: conversation.isThinking,
    thinkingStage: conversation.thinkingStage,
    streamingText: conversation.streamingText,
    activeProjectContext: conversation.activeProjectContext,
    suggestedCapability: conversation.suggestedCapability,
    menuVisible: conversation.menuVisible,
    addMessage: conversation.addMessage,
    sendMessage: conversation.sendMessage,
    setThinking: conversation.setThinking,
    setThinkingStage: conversation.setThinkingStage,
    setStreamingText: conversation.setStreamingText,
    clearHistory: conversation.clearHistory,
    loadProjectContext: conversation.loadProjectContext,
    clearProjectContext: conversation.clearProjectContext,
    openMenu: conversation.openMenu,
    closeMenu: conversation.closeMenu,
    twinEnergy: relationship.twinEnergy,
    bondLevel: relationship.bondLevel,
    relationshipDims: relationship.relationshipDims,
    journeyPhase: relationship.journeyPhase,
    attachmentStyle: relationship.attachmentStyle,
    setTwinEnergy: relationship.setTwinEnergy,
    updateBond: relationship.updateBond,
    getEnergyPercent: relationship.getEnergyPercent,
    getRelationshipInsights: relationship.getRelationshipInsights,
    getRelationshipHealth: relationship.getRelationshipHealth,
    getMemories: relationship.getMemories,
    getWeeklyReport: relationship.getWeeklyReport,
    activeStudySession: capability.activeStudySession,
    activeBusinessProject: capability.activeBusinessProject,
    activeLifePlan: capability.activeLifePlan,
    recentDreams: capability.recentDreams,
    tasks: capability.tasks,
    userStats: capability.userStats,
    recommendations: capability.recommendations,
    proactiveMessage: capability.proactiveMessage,
    ...capability,
    awarenessScore: awareness.awarenessScore,
    dailyNotificationsSent: awareness.dailyNotificationsSent,
    dailyNotificationsLimit: awareness.dailyNotificationsLimit,
    conversationStreak: awareness.conversationStreak,
    usedMemoryCount: awareness.usedMemoryCount,
    isOnline: awareness.isOnline,
    lastSyncTimestamp: awareness.lastSyncTimestamp,
    hasHydrated: awareness.hasHydrated,
    setOnline: awareness.setOnline,
    setConversationStreak: awareness.setConversationStreak,
    incrementUsedMemory: awareness.incrementUsedMemory,
    setAwarenessData: awareness.setAwarenessData,
    setHasHydrated: awareness.setHasHydrated,
    resetToDefaults: () => { core.reset(); relationship.reset(); awareness.reset(); },
    logout: () => { core.reset(); relationship.reset(); awareness.reset(); credits.resetDaily(); },
  };
}
