import { describe, it, expect, beforeEach } from 'vitest';
import { defaultAccentPattern, resizeAccentPattern, cycleAccent, useMetronomeStore } from './metronomeStore';

describe('defaultAccentPattern', () => {
  it('accents only the first beat by default', () => {
    expect(defaultAccentPattern(4)).toEqual(['accent', 'normal', 'normal', 'normal']);
  });

  it('handles a single-beat bar', () => {
    expect(defaultAccentPattern(1)).toEqual(['accent']);
  });
});

describe('resizeAccentPattern', () => {
  it('truncates when the bar shrinks, preserving existing choices', () => {
    expect(resizeAccentPattern(['accent', 'mute', 'normal', 'accent'], 2)).toEqual(['accent', 'mute']);
  });

  it('extends with normal beats when the bar grows', () => {
    expect(resizeAccentPattern(['accent', 'mute'], 4)).toEqual(['accent', 'mute', 'normal', 'normal']);
  });

  it('is a no-op when the length is unchanged', () => {
    const pattern: ('accent' | 'normal' | 'mute')[] = ['accent', 'normal'];
    expect(resizeAccentPattern(pattern, 2)).toBe(pattern);
  });
});

describe('cycleAccent', () => {
  it('cycles accent -> normal -> mute -> accent', () => {
    expect(cycleAccent('accent')).toBe('normal');
    expect(cycleAccent('normal')).toBe('mute');
    expect(cycleAccent('mute')).toBe('accent');
  });
});

describe('useMetronomeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useMetronomeStore.setState({
      bpm: 100,
      timeSig: { beats: 4, unit: 4 },
      accentPattern: defaultAccentPattern(4),
      subVolume: 60,
      isPlaying: false,
      speedTrainer: { enabled: false, everyNBars: 4, stepBpm: 5, capBpm: 200 },
      muteBars: { enabled: false, playBars: 2, muteBars: 2 },
    });
  });

  it('clamps BPM to the 20-300 SPEC range', () => {
    useMetronomeStore.getState().setBpm(500);
    expect(useMetronomeStore.getState().bpm).toBe(300);
    useMetronomeStore.getState().setBpm(-10);
    expect(useMetronomeStore.getState().bpm).toBe(20);
    useMetronomeStore.getState().setBpm(140);
    expect(useMetronomeStore.getState().bpm).toBe(140);
  });

  it('resizes the accent pattern when the time signature numerator changes', () => {
    useMetronomeStore.getState().cycleAccentAt(1); // beat 2 -> normal->mute
    useMetronomeStore.getState().setTimeSig({ beats: 6, unit: 8 });
    const state = useMetronomeStore.getState();
    expect(state.timeSig).toEqual({ beats: 6, unit: 8 });
    expect(state.accentPattern).toHaveLength(6);
    expect(state.accentPattern[1]).toBe('mute'); // preserved
    expect(state.accentPattern[4]).toBe('normal'); // newly added beat
  });

  it('clamps the time signature numerator to 1-12', () => {
    useMetronomeStore.getState().setTimeSig({ beats: 20, unit: 4 });
    expect(useMetronomeStore.getState().timeSig.beats).toBe(12);
  });

  it('cycles an individual beat accent state via cycleAccentAt', () => {
    useMetronomeStore.getState().cycleAccentAt(0);
    expect(useMetronomeStore.getState().accentPattern[0]).toBe('normal');
  });

  it('clamps speed trainer settings to their SPEC ranges', () => {
    useMetronomeStore.getState().setSpeedTrainer({ everyNBars: 99, stepBpm: 99, capBpm: 9999 });
    const t = useMetronomeStore.getState().speedTrainer;
    expect(t.everyNBars).toBe(16);
    expect(t.stepBpm).toBe(20);
    expect(t.capBpm).toBe(300);
  });

  it('clamps mute-bar settings to 1-8', () => {
    useMetronomeStore.getState().setMuteBars({ playBars: 0, muteBars: 99 });
    const m = useMetronomeStore.getState().muteBars;
    expect(m.playBars).toBe(1);
    expect(m.muteBars).toBe(8);
  });

  it('does not persist the transient isPlaying flag', () => {
    useMetronomeStore.getState().setIsPlaying(true);
    useMetronomeStore.persist.rehydrate();
    // isPlaying is excluded via partialize, so rehydration must not resurrect a stale "playing" state
    expect(JSON.parse(localStorage.getItem('fretlab-metronome') ?? '{}').state.isPlaying).toBeUndefined();
  });
});
