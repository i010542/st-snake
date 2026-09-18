export type SoundName = 'eat' | 'die' | 'confirm';

export interface AudioPlayOptions {
  soundEnabled: boolean;
  volume: number;
}

interface OscillatorCue {
  frequency: number;
  durationMs: number;
  type: OscillatorType;
}

const CUES: Record<SoundName, OscillatorCue> = {
  eat: { frequency: 880, durationMs: 90, type: 'square' },
  die: { frequency: 180, durationMs: 180, type: 'sawtooth' },
  confirm: { frequency: 520, durationMs: 70, type: 'triangle' },
};

export interface AudioManager {
  play(name: SoundName, options: AudioPlayOptions): void;
  dispose(): void;
}

function gainFromVolume(volume: number): number {
  const clamped = Math.min(100, Math.max(0, volume));
  return (clamped / 100) * 0.18;
}

export function createAudioManager(
  contextFactory?: () => AudioContext,
): AudioManager {
  let context: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (context) {
      return context;
    }

    try {
      if (contextFactory) {
        context = contextFactory();
        return context;
      }
      const Ctor = window.AudioContext;
      if (!Ctor) {
        return null;
      }
      context = new Ctor();
      return context;
    } catch {
      return null;
    }
  };

  return {
    play(name, options) {
      if (!options.soundEnabled || options.volume <= 0) {
        return;
      }

      const audio = getContext();
      if (!audio) {
        return;
      }

      try {
        if (audio.state === 'suspended') {
          void audio.resume();
        }

        const cue = CUES[name];
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const now = audio.currentTime;
        const duration = cue.durationMs / 1000;
        const peak = gainFromVolume(options.volume);

        oscillator.type = cue.type;
        oscillator.frequency.setValueAtTime(cue.frequency, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(now);
        oscillator.stop(now + duration + 0.02);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      } catch {
        // Audio is cosmetic; never interrupt the game loop.
      }
    },
    dispose() {
      if (!context) {
        return;
      }
      const current = context;
      context = null;
      void current.close();
    },
  };
}
