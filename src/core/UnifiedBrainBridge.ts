import { apiPost, apiGet } from '../../lib/httpClient';

export interface PerceptionData {
  typingSpeed: number;
  messageLength: number;
  absenceDurationMinutes: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userState: 'hesitant' | 'excited' | 'tired' | 'focused' | 'distant' | 'normal';
}

export interface UnifiedResponse {
  reply: string;
  presence_state: any;
  twin_emotional_state: any;
  behavior: any;
  memory_surfaced: any;
  twin_state_update: any;
  timing: any;
  latency_ms: number;
  consciousness_trace?: any[];
  trust_model?: any;
  soul_state?: any;
  evolution_updates?: any;
}

class UnifiedBrainBridge {
  private userId: string = '';
  private lang: string = 'ar';
  private history: Array<{ role: string; content: string }> = [];

  setUserId(id: string): void { this.userId = id; }
  setLang(lang: string): void { this.lang = lang; }

  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.history.push({ role, content });
    if (this.history.length > 50) this.history = this.history.slice(-50);
  }

  clearHistory(): void { this.history = []; }

  async process(message: string, perception: PerceptionData): Promise<UnifiedResponse> {
    const response = await apiPost('/api/v2/chat', {
      user_id: this.userId, message, lang: this.lang, perception, history: this.history.slice(-10),
    });
    const data: UnifiedResponse = response;
    this.addToHistory('user', message);
    if (data.reply) this.addToHistory('assistant', data.reply);
    return data;
  }

  async getCoreMemories(limit: number = 12): Promise<any[]> {
    try {
      const response = await apiGet(`/api/memories/core?user_id=${this.userId}&limit=${limit}`);
      return response?.memories || [];
    } catch (e) { return []; }
  }

  async getCapabilityMemory(capabilityType: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await apiGet(`/api/memories/capability?user_id=${this.userId}&capability=${capabilityType}&limit=${limit}`);
      return response?.memories || [];
    } catch (e) { return []; }
  }

  async getOnThisDay(limit: number = 5): Promise<any[]> {
    try {
      const response = await apiGet(`/api/memories/on_this_day?user_id=${this.userId}&limit=${limit}`);
      return response?.memories || [];
    } catch (e) { return []; }
  }

  async storeMemory(type: string, content: string, importance: number = 50, emotion: string = 'neutral', relatedTo: string[] = []): Promise<void> {
    try {
      await apiPost('/api/memories/store', { user_id: this.userId, type, content, importance, emotion, related_to: relatedTo });
    } catch (e) {}
  }

  async getMemoryCount(): Promise<number> {
    try {
      const response = await apiGet(`/api/memories/count?user_id=${this.userId}`);
      return response?.count || 0;
    } catch (e) { return 0; }
  }

  async getMostUsedCapability(): Promise<string> {
    try {
      const response = await apiGet(`/api/memories/most_used_capability?user_id=${this.userId}`);
      return response?.capability || '';
    } catch (e) { return ''; }
  }

  async getMostVisitedWorld(): Promise<string> {
    try {
      const worlds = await this.getCapabilityMemory('world', 1);
      return worlds.length > 0 ? (worlds[0].content || worlds[0].expressed_text || '') : '';
    } catch (e) { return ''; }
  }

  async getTwinState(): Promise<any> {
    try {
      const response = await apiGet(`/api/twin/state/${this.userId}`);
      return response || {};
    } catch (e) { return {}; }
  }

  async getRecentEmotions(limit: number = 5): Promise<string[]> {
    try {
      const response = await apiGet(`/api/memories/recent_emotions?user_id=${this.userId}&limit=${limit}`);
      return response?.emotions || [];
    } catch (e) { return []; }
  }
}

export const unifiedBrainBridge = new UnifiedBrainBridge();
