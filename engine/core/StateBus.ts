/**
 * STATE BUS v2.0 – ناقل الحالة (للأحداث المهمة فقط)
 * =====================================================
 * يستخدم فقط للأحداث التي تؤثر على مكونات متعددة:
 * - تغير المشاعر
 * - تغير وضع الوعي
 * - بدء/انتهاء التحدث
 * - استرجاع ذاكرة
 * - تغير الرابطة
 * 
 * لا يستخدم للأنيميشن أو التايبنج أو التوهج.
 */
type Listener = (event: string, data: any) => void;

class StateBus {
  private listeners: Map<string, Listener[]> = new Map();

  on(event: string, callback: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) { const idx = arr.indexOf(callback); if (idx > -1) arr.splice(idx, 1); }
    };
  }

  emit(event: string, data: any = {}): void {
    const arr = this.listeners.get(event);
    if (arr) arr.forEach(cb => { try { cb(event, data); } catch (e) { console.warn(`[StateBus] Error: ${event}`, e); } });
  }

  clear(): void { this.listeners.clear(); }
}

export const stateBus = new StateBus();

// الأحداث المهمة فقط
export const STATE_EVENTS = {
  MODE_CHANGED: 'state:mode_changed',
  EMOTION_CHANGED: 'state:emotion_changed',
  PRESENCE_CHANGED: 'state:presence_changed',
  AWARENESS_CHANGED: 'state:awareness_changed',
  BOND_CHANGED: 'state:bond_changed',
  STARTED_SPEAKING: 'state:started_speaking',
  STOPPED_SPEAKING: 'state:stopped_speaking',
  MEMORY_RETRIEVED: 'state:memory_retrieved',
  PROCESSING_COMPLETE: 'state:processing_complete',
  THOUGHT_COMPLETE: 'cognitive:thought_complete',
} as const;
