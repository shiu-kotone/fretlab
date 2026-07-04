import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Subdivision, AccentState } from '../audio/beatPlan';
import type { ToneId } from '../audio/click';

export type TimeSigUnit = 2 | 4 | 8 | 16;

export interface TimeSignature {
  beats: number; // numerator, 1-12
  unit: TimeSigUnit;
}

export interface SpeedTrainerSettings {
  enabled: boolean;
  everyNBars: number; // 1-16
  stepBpm: number; // 1-20
  capBpm: number; // <=300
}

export interface MuteBarsSettings {
  enabled: boolean;
  playBars: number; // 1-8
  muteBars: number; // 1-8
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

export function defaultAccentPattern(beats: number): AccentState[] {
  return Array.from({ length: beats }, (_, i) => (i === 0 ? 'accent' : 'normal'));
}

/** Preserves existing accent choices when the bar length changes; new beats default to 'normal'. */
export function resizeAccentPattern(pattern: AccentState[], beats: number): AccentState[] {
  if (pattern.length === beats) return pattern;
  if (pattern.length > beats) return pattern.slice(0, beats);
  return [...pattern, ...Array.from({ length: beats - pattern.length }, () => 'normal' as AccentState)];
}

export function cycleAccent(state: AccentState): AccentState {
  switch (state) {
    case 'accent':
      return 'normal';
    case 'normal':
      return 'mute';
    case 'mute':
      return 'accent';
  }
}

interface MetronomeSettings {
  bpm: number;
  timeSig: TimeSignature;
  subdivision: Subdivision;
  subVolume: number;
  tone: ToneId;
  accentPattern: AccentState[];
  fullScreenFlash: boolean;
  speedTrainer: SpeedTrainerSettings;
  muteBars: MuteBarsSettings;
}

const DEFAULT_TIME_SIG: TimeSignature = { beats: 4, unit: 4 };

const DEFAULT_SETTINGS: MetronomeSettings = {
  bpm: 100,
  timeSig: DEFAULT_TIME_SIG,
  subdivision: 'quarter',
  subVolume: 60,
  tone: 'woodblock',
  accentPattern: defaultAccentPattern(DEFAULT_TIME_SIG.beats),
  fullScreenFlash: false,
  speedTrainer: { enabled: false, everyNBars: 4, stepBpm: 5, capBpm: 200 },
  muteBars: { enabled: false, playBars: 2, muteBars: 2 },
};

interface MetronomeStore extends MetronomeSettings {
  isPlaying: boolean;

  setBpm: (bpm: number) => void;
  setTimeSig: (timeSig: TimeSignature) => void;
  setSubdivision: (subdivision: Subdivision) => void;
  setSubVolume: (v: number) => void;
  setTone: (tone: ToneId) => void;
  cycleAccentAt: (index: number) => void;
  setFullScreenFlash: (v: boolean) => void;
  setSpeedTrainer: (s: Partial<SpeedTrainerSettings>) => void;
  setMuteBars: (s: Partial<MuteBarsSettings>) => void;
  setIsPlaying: (v: boolean) => void;
}

export const useMetronomeStore = create<MetronomeStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      isPlaying: false,

      setBpm: (bpm) => set({ bpm: clamp(bpm, 20, 300) }),

      setTimeSig: (timeSig) =>
        set((s) => {
          const beats = clamp(timeSig.beats, 1, 12);
          return {
            timeSig: { beats, unit: timeSig.unit },
            accentPattern: resizeAccentPattern(s.accentPattern, beats),
          };
        }),

      setSubdivision: (subdivision) => set({ subdivision }),

      setSubVolume: (v) => set({ subVolume: clamp(v, 0, 100) }),

      setTone: (tone) => set({ tone }),

      cycleAccentAt: (index) =>
        set((s) => {
          if (index < 0 || index >= s.accentPattern.length) return s;
          const next = [...s.accentPattern];
          next[index] = cycleAccent(next[index]);
          return { accentPattern: next };
        }),

      setFullScreenFlash: (v) => set({ fullScreenFlash: v }),

      setSpeedTrainer: (partial) =>
        set((s) => {
          const merged = { ...s.speedTrainer, ...partial };
          return {
            speedTrainer: {
              enabled: merged.enabled,
              everyNBars: clamp(merged.everyNBars, 1, 16),
              stepBpm: clamp(merged.stepBpm, 1, 20),
              capBpm: clamp(merged.capBpm, 20, 300),
            },
          };
        }),

      setMuteBars: (partial) =>
        set((s) => {
          const merged = { ...s.muteBars, ...partial };
          return {
            muteBars: {
              enabled: merged.enabled,
              playBars: clamp(merged.playBars, 1, 8),
              muteBars: clamp(merged.muteBars, 1, 8),
            },
          };
        }),

      setIsPlaying: (v) => set({ isPlaying: v }),
    }),
    {
      name: 'fretlab-metronome',
      partialize: (s) => {
        const { isPlaying: _isPlaying, ...persisted } = s;
        return persisted;
      },
    },
  ),
);
