/**
 * MEMORY ENGINE v2.0 – محرك الذاكرة الموحد
 * =============================================
 * يدمج: MemoryEngine + MemoryRetrieval
 */
import { stateBus, STATE_EVENTS } from '../core/StateBus';
import { useTwinState } from '../core/TwinState';

interface MemoryEntry {
  id: string; type: 'conversation' | 'event' | 'emotion' | 'decision' | 'learning';
  content: string; timestamp: string; importance: number; emotion: string; relatedTo: string[];
}

export class MemoryEngine {
  private memoryClient: any = null;
  private recentMemories: MemoryEntry[] = [];
  private maxRecent: number = 50;

  setMemoryClient(client: any): void { this.memoryClient = client; }

  async store(type: MemoryEntry['type'], content: string, importance: number = 50, emotion: string = 'neutral', relatedTo: string[] = []): Promise<void> {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type, content, importance, emotion, relatedTo,
      timestamp: new Date().toISOString(),
    };
    this.recentMemories.push(entry);
    if (this.recentMemories.length > this.maxRecent) this.recentMemories = this.recentMemories.slice(-this.maxRecent);
    if (this.memoryClient) { try { await this.memoryClient.storeEntity('twin_memory', entry.id, entry); } catch (e) {} }
    stateBus.emit('memory:stored', { entry });
  }

  async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    const local = this.recentMemories.filter(m => m.content.includes(query) || m.relatedTo.some(r => query.includes(r))).sort((a, b) => b.importance - a.importance).slice(0, limit);
    if (local.length > 0) {
      useTwinState.getState().setIsSearchingMemory(true);
      await new Promise(r => setTimeout(r, 300));
      useTwinState.getState().setIsSearchingMemory(false);
      stateBus.emit(STATE_EVENTS.MEMORY_RETRIEVED, { query, count: local.length });
      return local;
    }
    if (this.memoryClient) {
      try {
        const all = await this.memoryClient.getEntityList('twin_memory', '') || [];
        const results = all.filter((m: any) => m.content && m.content.includes(query)).sort((a: any, b: any) => (b.importance || 0) - (a.importance || 0)).slice(0, limit);
        stateBus.emit(STATE_EVENTS.MEMORY_RETRIEVED, { query, count: results.length });
        return results;
      } catch (e) {}
    }
    return [];
  }

  async retrieveByType(type: MemoryEntry['type'], limit: number = 10): Promise<MemoryEntry[]> {
    return this.recentMemories.filter(m => m.type === type).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
  }

  // ── Smart Retrieval (من MemoryRetrieval سابقاً) ──
  async smartRetrieve(context: { currentEmotion: string; currentTopic: string; timeOfDay: string; recentTopics: string[] }, limit: number = 5): Promise<MemoryEntry[]> {
    useTwinState.getState().setIsSearchingMemory(true);
    const terms = [context.currentTopic, context.currentEmotion, ...context.recentTopics].filter(Boolean);
    const all: MemoryEntry[] = [];
    for (const term of terms) { const r = await this.retrieve(term, 3); all.push(...r); }
    const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
    const sorted = unique.sort((a, b) => (b.importance * 0.6 + new Date(b.timestamp).getTime() * 0.0000000004) - (a.importance * 0.6 + new Date(a.timestamp).getTime() * 0.0000000004));
    useTwinState.getState().setIsSearchingMemory(false);
    stateBus.emit('memory:retrieved', { context, count: sorted.slice(0, limit).length });
    return sorted.slice(0, limit);
  }

  async onThisDay(): Promise<MemoryEntry[]> {
    const today = new Date(); const month = today.getMonth(); const day = today.getDate();
    const all = await this.retrieveByType('event', 100);
    return all.filter(m => { const d = new Date(m.timestamp); return d.getMonth() === month && d.getDate() === day; });
  }

  async byEmotion(emotion: string, limit: number = 5): Promise<MemoryEntry[]> {
    const all = await this.retrieveByType('emotion', 50);
    return all.filter(m => m.emotion === emotion).sort((a, b) => b.importance - a.importance).slice(0, limit);
  }

  getMemoryCount(): number { return this.recentMemories.length; }
}

export const memoryEngine = new MemoryEngine();
