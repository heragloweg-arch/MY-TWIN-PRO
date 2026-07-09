/**
 * twinApi.ts — واجهة موحدة للـ API
 * ==================================
 * محدثة: تستخدم apiClient.ts (الذي يستخدم lib/httpClient.ts).
 * هذا هو الملف الوحيد الذي تستدعيه Renderers.
 */

export {
  sendMessage,
  streamMessage,
  getRecentContext,
  saveMemory,
  retrieveMemories,
  getRelationshipInsights,
  getRelationshipHealth,
  getTwinState,
  updateTwinState,
  getAwarenessCheck,
} from './apiClient';
