import { digitalSoul, DigitalSoulState } from './DigitalSoul';

export interface SoulSnapshotData {
  state: DigitalSoulState;
  timestamp: string;
}

export class SoulSnapshot {
  private snapshots: SoulSnapshotData[] = [];

  take(): SoulSnapshotData {
    const snapshot: SoulSnapshotData = {
      state: digitalSoul.read(),
      timestamp: new Date().toISOString(),
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > 100) this.snapshots = this.snapshots.slice(-100);
    return snapshot;
  }

  getHistory(): SoulSnapshotData[] {
    return [...this.snapshots];
  }

  getLatest(): SoulSnapshotData | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }
}

export const soulSnapshot = new SoulSnapshot();
