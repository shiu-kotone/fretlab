import { describe, it, expect } from 'vitest';
import {
  createEmptyProgression,
  barBeatsTotal,
  validateProgression,
  createEmptyBar,
  computeBarSegments,
  findActiveSegment,
} from './progressionTypes';
import { PRESET_PROGRESSIONS } from './presetProgressions';

describe('createEmptyProgression', () => {
  it('produces a valid, playable progression', () => {
    const p = { ...createEmptyProgression('テスト'), id: 'test' };
    expect(validateProgression(p)).toEqual([]);
  });
});

describe('barBeatsTotal', () => {
  it('sums beats across a bar\'s chord slots', () => {
    const b = createEmptyBar(4, '0-maj');
    expect(barBeatsTotal(b)).toBe(4);
    const split = { chords: [{ chordId: '0-maj', voicingIndex: 0, beats: 2 }, { chordId: '7-7', voicingIndex: 0, beats: 2 }] };
    expect(barBeatsTotal(split)).toBe(4);
  });
});

describe('validateProgression', () => {
  it('flags a bar whose beats do not sum to the time signature', () => {
    const p = { ...createEmptyProgression('bad'), id: 'test', bars: [{ chords: [{ chordId: '0-maj', voicingIndex: 0, beats: 3 }] }] };
    expect(validateProgression(p).length).toBeGreaterThan(0);
  });

  it('flags an unparseable chordId', () => {
    const p = { ...createEmptyProgression('bad'), id: 'test', bars: [{ chords: [{ chordId: 'nope', voicingIndex: 0, beats: 4 }] }] };
    expect(validateProgression(p).length).toBeGreaterThan(0);
  });

  it('flags an out-of-range voicingIndex', () => {
    const p = { ...createEmptyProgression('bad'), id: 'test', bars: [{ chords: [{ chordId: '0-maj', voicingIndex: 99, beats: 4 }] }] };
    expect(validateProgression(p).length).toBeGreaterThan(0);
  });

  it('flags bar counts outside 1-64', () => {
    const p = { ...createEmptyProgression('bad'), id: 'test', bars: [] };
    expect(validateProgression(p).length).toBeGreaterThan(0);
  });

  it('flags bpm outside 40-240', () => {
    const p = { ...createEmptyProgression('bad'), id: 'test', bpm: 300 };
    expect(validateProgression(p).length).toBeGreaterThan(0);
  });
});

describe('computeBarSegments / findActiveSegment', () => {
  it('a single-chord bar produces one segment starting at beat 0', () => {
    const segments = computeBarSegments(createEmptyBar(4, '0-maj'));
    expect(segments).toEqual([{ startBeat: 0, beats: 4, chordId: '0-maj', voicingIndex: 0 }]);
  });

  it('a split bar produces sequential segments', () => {
    const bar = { chords: [{ chordId: '0-maj', voicingIndex: 0, beats: 2 }, { chordId: '7-7', voicingIndex: 1, beats: 2 }] };
    const segments = computeBarSegments(bar);
    expect(segments).toEqual([
      { startBeat: 0, beats: 2, chordId: '0-maj', voicingIndex: 0 },
      { startBeat: 2, beats: 2, chordId: '7-7', voicingIndex: 1 },
    ]);
  });

  it('findActiveSegment picks the segment covering a given beat position', () => {
    const bar = { chords: [{ chordId: '0-maj', voicingIndex: 0, beats: 2 }, { chordId: '7-7', voicingIndex: 0, beats: 2 }] };
    const segments = computeBarSegments(bar);
    expect(findActiveSegment(segments, 0)?.chordId).toBe('0-maj');
    expect(findActiveSegment(segments, 1.75)?.chordId).toBe('0-maj');
    expect(findActiveSegment(segments, 2)?.chordId).toBe('7-7');
    expect(findActiveSegment(segments, 3.99)?.chordId).toBe('7-7');
  });

  it('findActiveSegment falls back to the last segment past the bar end', () => {
    const segments = computeBarSegments(createEmptyBar(4, '0-maj'));
    expect(findActiveSegment(segments, 4.5)?.chordId).toBe('0-maj');
  });
});

describe('PRESET_PROGRESSIONS', () => {
  it('has the 6 bundled presets from SPEC §5.3', () => {
    expect(PRESET_PROGRESSIONS.length).toBe(6);
  });

  it('every preset is internally valid (chordIds parse, voicing indices in range, bar beats match time signature)', () => {
    for (const p of PRESET_PROGRESSIONS) {
      expect(validateProgression(p)).toEqual([]);
    }
  });

  it('every preset has a unique id prefixed "preset:"', () => {
    const ids = PRESET_PROGRESSIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('preset:')).toBe(true);
  });

  it('the 12-bar blues preset actually has 12 bars', () => {
    const blues = PRESET_PROGRESSIONS.find((p) => p.id === 'preset:blues12')!;
    expect(blues.bars.length).toBe(12);
  });
});
