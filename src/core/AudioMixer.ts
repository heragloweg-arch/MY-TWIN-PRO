import { audioEngine } from './AudioEngine';

interface AudioChannel {
  id: string;
  volume: number;
  targetVolume: number;
  transitionSpeed: number;
}

const DEFAULT_MIX: Record<string, number> = {
  ambience_space: 0.10,
  breathing_loop: 0.06,
  heartbeat_energy: 0.05,
  silence_room: 0.08,
  energy_hum: 0.07,
  neural_hum: 0.05,
};

const CONTEXT_MIX: Record<string, Record<string, number>> = {
  conversation: { ambience_space: 0.20, breathing_loop: 0.08 },
  thinking: { neural_hum: 0.15, ambience_space: 0.10 },
  dream: { ambience_space: 0.15, breathing_loop: 0.04 },
  business: { ambience_space: 0.08, breathing_loop: 0.06 },
  study: { ambience_space: 0.10, breathing_loop: 0.07 },
  silence: { silence_room: 0.12, breathing_loop: 0.03 },
  celebration: { ambience_space: 0.25, heartbeat_energy: 0.10 },
};

export class AudioMixer {
  private channels: Map<string, AudioChannel> = new Map();
  private currentContext: string = 'default';

  setContext(context: string): void {
    this.currentContext = context;
    const mix = CONTEXT_MIX[context] || {};
    
    for (const [id, defaultVol] of Object.entries(DEFAULT_MIX)) {
      const targetVol = mix[id] !== undefined ? mix[id] : defaultVol;
      this.fadeTo(id, targetVol, 2000);
    }
  }

  fadeTo(id: string, targetVolume: number, durationMs: number = 1000): void {
    const channel = this.channels.get(id);
    if (channel) {
      channel.targetVolume = targetVolume;
      channel.transitionSpeed = durationMs;
    } else {
      this.channels.set(id, { id, volume: targetVolume, targetVolume, transitionSpeed: durationMs });
    }
    // تطبيق تدريجي
    this.applyFade(id, targetVolume, durationMs);
  }

  private async applyFade(id: string, target: number, duration: number): Promise<void> {
    const steps = 20;
    const stepDelay = duration / steps;
    const currentChannel = this.channels.get(id);
    if (!currentChannel) return;

    const startVolume = currentChannel.volume;
    const delta = (target - startVolume) / steps;

    for (let i = 1; i <= steps; i++) {
      const newVol = startVolume + delta * i;
      currentChannel.volume = newVol;
      // هنا يمكن استدعاء audioEngine.setVolume(id, newVol) لو كان مدعوماً
      await new Promise(r => setTimeout(r, stepDelay));
    }
    currentChannel.volume = target;
  }

  getChannelVolume(id: string): number {
    return this.channels.get(id)?.volume ?? DEFAULT_MIX[id] ?? 0.05;
  }

  getCurrentContext(): string { return this.currentContext; }
}

export const audioMixer = new AudioMixer();
