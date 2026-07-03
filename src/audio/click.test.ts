import { describe, it, expect } from 'vitest';
import { getClickParams, TONE_IDS, type ClickLevel } from './click';

const LEVELS: ClickLevel[] = ['accent', 'normal', 'sub'];

describe('getClickParams', () => {
  it('defines all 5 SPEC §5.4 timbres', () => {
    expect(TONE_IDS).toEqual(['woodblock', 'electronicClick', 'beep', 'cowbell', 'rimshot']);
  });

  it('returns finite, positive parameters for every tone/level combination', () => {
    for (const tone of TONE_IDS) {
      for (const level of LEVELS) {
        const params = getClickParams(tone, level);
        expect(params.duration).toBeGreaterThan(0);
        expect(params.gainPeak).toBeGreaterThan(0);
        if (params.kind === 'oscillator') {
          for (const voice of params.voices) {
            expect(voice.frequency).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('woodblock uses the exact SPEC-specified pitches per accent level', () => {
    expect(getClickParams('woodblock', 'accent').kind).toBe('oscillator');
    const accent = getClickParams('woodblock', 'accent');
    const normal = getClickParams('woodblock', 'normal');
    const sub = getClickParams('woodblock', 'sub');
    if (accent.kind !== 'oscillator' || normal.kind !== 'oscillator' || sub.kind !== 'oscillator') {
      throw new Error('expected oscillator params');
    }
    expect(accent.voices[0].frequency).toBe(1600);
    expect(normal.voices[0].frequency).toBe(1100);
    expect(sub.voices[0].frequency).toBe(800);
  });

  it('beep accent sounds a perfect 5th above the normal pitch', () => {
    const normal = getClickParams('beep', 'normal');
    const accent = getClickParams('beep', 'accent');
    if (normal.kind !== 'oscillator' || accent.kind !== 'oscillator') throw new Error('expected oscillator');
    const ratio = accent.voices[0].frequency / normal.voices[0].frequency;
    expect(ratio).toBeCloseTo(Math.pow(2, 7 / 12), 6);
  });

  it('cowbell combines the two SPEC-specified square-wave voices', () => {
    const params = getClickParams('cowbell', 'normal');
    if (params.kind !== 'oscillator') throw new Error('expected oscillator');
    const freqs = params.voices.map((v) => v.frequency).sort((a, b) => a - b);
    expect(freqs).toEqual([545, 800]);
    expect(params.voices.every((v) => v.type === 'square')).toBe(true);
  });

  it('rimshot synthesizes noise through a highpass filter', () => {
    const params = getClickParams('rimshot', 'normal');
    expect(params.kind).toBe('noise');
    if (params.kind !== 'noise') throw new Error('expected noise');
    expect(params.filter.type).toBe('highpass');
  });

  it('electronic click is a very short square pulse', () => {
    const params = getClickParams('electronicClick', 'accent');
    if (params.kind !== 'oscillator') throw new Error('expected oscillator');
    expect(params.voices[0].type).toBe('square');
    expect(params.duration).toBeLessThan(0.02);
  });

  it('gain scales down monotonically from accent to normal to sub for every tone', () => {
    for (const tone of TONE_IDS) {
      const accent = getClickParams(tone, 'accent').gainPeak;
      const normal = getClickParams(tone, 'normal').gainPeak;
      const sub = getClickParams(tone, 'sub').gainPeak;
      expect(accent).toBeGreaterThan(normal);
      expect(normal).toBeGreaterThan(sub);
    }
  });
});
