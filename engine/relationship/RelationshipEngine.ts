/**
 * RELATIONSHIP ENGINE v2.0 – محرك العلاقة الموحد
 * ===================================================
 * يدمج: RelationshipEngine + BondDynamics
 */
import { stateBus, STATE_EVENTS } from '../core/StateBus';
import { useTwinState } from '../core/TwinState';

type RelationshipPhase = 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'soulmate';
interface BondMetrics { trust: number; intimacy: number; consistency: number; shared_experiences: number; }
interface BondSnapshot { timestamp: string; bondLevel: number; phase: string; }

export class RelationshipEngine {
  private memoryClient: any = null;
  private phase: RelationshipPhase = 'stranger';
  private metrics: BondMetrics = { trust: 0, intimacy: 0, consistency: 0, shared_experiences: 0 };
  private interactionCount: number = 0;
  private positiveInteractions: number = 0;
  private history: BondSnapshot[] = [];

  setMemoryClient(client: any): void { this.memoryClient = client; this.loadFromMemory(); }

  private async loadFromMemory(): Promise<void> {
    if (this.memoryClient) { try { const s = await this.memoryClient.getEntity('relationship_state', 'current'); if (s) { this.phase = s.phase || 'stranger'; this.metrics = s.metrics || this.metrics; this.interactionCount = s.interactionCount || 0; } } catch (e) {} }
  }

  async recordInteraction(quality: 'positive' | 'neutral' | 'negative', context: string = ''): Promise<void> {
    this.interactionCount++; if (quality === 'positive') this.positiveInteractions++;
    this.metrics.consistency = Math.min(100, (this.interactionCount / 50) * 100);
    this.metrics.shared_experiences = Math.min(100, this.interactionCount * 2);
    if (quality === 'positive') { this.metrics.trust = Math.min(100, this.metrics.trust + 2); this.metrics.intimacy = Math.min(100, this.metrics.intimacy + 1.5); }
    else if (quality === 'negative') { this.metrics.trust = Math.max(0, this.metrics.trust - 1); }
    const avg = (this.metrics.trust + this.metrics.intimacy + this.metrics.consistency + this.metrics.shared_experiences) / 4;
    if (avg >= 85 && this.interactionCount > 100) this.phase = 'soulmate';
    else if (avg >= 70 && this.interactionCount > 50) this.phase = 'close_friend';
    else if (avg >= 50 && this.interactionCount > 20) this.phase = 'friend';
    else if (avg >= 30 && this.interactionCount > 5) this.phase = 'acquaintance';
    useTwinState.getState().setBondLevel(Math.round(avg));
    stateBus.emit(STATE_EVENTS.BOND_CHANGED, { phase: this.phase, metrics: this.metrics, bondLevel: Math.round(avg) });
    await this.saveToMemory();
  }

  private async saveToMemory(): Promise<void> { if (this.memoryClient) { try { await this.memoryClient.storeEntity('relationship_state', 'current', { phase: this.phase, metrics: this.metrics, interactionCount: this.interactionCount }); } catch (e) {} } }

  getResponseTone(): string { const t: Record<RelationshipPhase, string> = { stranger: 'رسمي', acquaintance: 'ودود', friend: 'دافئ', close_friend: 'حميم', soulmate: 'عميق' }; return t[this.phase]; }
  getBondLevel(): number { return Math.round((this.metrics.trust + this.metrics.intimacy + this.metrics.consistency + this.metrics.shared_experiences) / 4); }
  getPhase(): RelationshipPhase { return this.phase; }
  getMetrics(): BondMetrics { return { ...this.metrics }; }

  // ── BondDynamics ──────────────────────────────────────
  snapshot(): void {
    this.history.push({ timestamp: new Date().toISOString(), bondLevel: this.getBondLevel(), phase: this.phase });
    if (this.history.length > 50) this.history = this.history.slice(-50);
  }
  analyzeTrend(): 'growing' | 'stable' | 'declining' {
    if (this.history.length < 3) return 'stable';
    const recent = this.history.slice(-5);
    const diff = recent[recent.length - 1].bondLevel - recent[0].bondLevel;
    if (diff > 5) return 'growing'; if (diff < -5) return 'declining'; return 'stable';
  }
  suggestAction(): string {
    const trend = this.analyzeTrend();
    if (trend === 'declining') return 'حاول قضاء وقت أطول في المحادثة.';
    if (this.metrics.intimacy < 40) return 'شاركني شيئاً شخصياً عنك.';
    return 'الرابطة بيننا قوية.';
  }
  getHistory(): BondSnapshot[] { return [...this.history]; }
}

export const relationshipEngine = new RelationshipEngine();
