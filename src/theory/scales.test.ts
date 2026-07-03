import { describe, it, expect } from 'vitest';
import { SCALES, findScale, scaleTones } from './scales';

describe('SCALES', () => {
  it('defines all 20 SPEC §5.1 scales with unique ids', () => {
    expect(SCALES).toHaveLength(20);
    const ids = new Set(SCALES.map((s) => s.id));
    expect(ids.size).toBe(20);
  });

  it('every scale starts on the root (interval 0)', () => {
    for (const scale of SCALES) {
      expect(scale.intervals[0]).toBe(0);
    }
  });

  it('every interval is within 0-11 and strictly ascending', () => {
    for (const scale of SCALES) {
      for (let i = 1; i < scale.intervals.length; i++) {
        expect(scale.intervals[i]).toBeGreaterThan(scale.intervals[i - 1]);
        expect(scale.intervals[i]).toBeLessThanOrEqual(11);
      }
    }
  });

  it('major matches the well-known Ionian formula', () => {
    expect(findScale('major').intervals).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('mixolydian-b9b13 and harmonic-minor-p5-below are the same scale (declared synonyms)', () => {
    expect(findScale('mixolydian-b9b13').intervals).toEqual(findScale('harmonic-minor-p5-below').intervals);
  });

  it('natural-minor and aeolian are the same scale (both listed per SPEC)', () => {
    expect(findScale('natural-minor').intervals).toEqual(findScale('aeolian').intervals);
  });

  it('the two diminished scales are 8-note symmetric scales', () => {
    expect(findScale('diminished-hw').intervals).toHaveLength(8);
    expect(findScale('diminished-wh').intervals).toHaveLength(8);
  });

  it('whole-tone has exactly 6 notes each 2 semitones apart', () => {
    const scale = findScale('whole-tone');
    expect(scale.intervals).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('the two pentatonic scales have exactly 5 notes', () => {
    expect(findScale('major-pentatonic').intervals).toHaveLength(5);
    expect(findScale('minor-pentatonic').intervals).toHaveLength(5);
  });
});

describe('findScale', () => {
  it('throws for an unknown id', () => {
    // @ts-expect-error intentionally invalid id for the runtime-guard test
    expect(() => findScale('not-a-scale')).toThrow();
  });
});

describe('scaleTones', () => {
  it('expands major from C (root 0) to the C major scale pitch classes', () => {
    expect(scaleTones(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('expands major from D (root 2), wrapping past 11', () => {
    // D major: D E F# G A B C#
    expect(scaleTones(2, 'major')).toEqual([2, 4, 6, 7, 9, 11, 1]);
  });

  it('always includes the root pitch class itself', () => {
    for (const scale of SCALES) {
      const root = 7; // arbitrary
      expect(scaleTones(root, scale.id)[0]).toBe(root);
    }
  });

  it('every returned pitch class is within 0-11', () => {
    for (const scale of SCALES) {
      for (const root of [0, 5, 11]) {
        for (const pc of scaleTones(root, scale.id)) {
          expect(pc).toBeGreaterThanOrEqual(0);
          expect(pc).toBeLessThanOrEqual(11);
        }
      }
    }
  });
});
