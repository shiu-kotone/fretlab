import { describe, it, expect } from 'vitest';
import { CHORD_TYPES, findChordType, chordTones } from './chords';

describe('CHORD_TYPES', () => {
  it('defines at least the 26 SPEC §5.2 required types (30 listed)', () => {
    expect(CHORD_TYPES.length).toBeGreaterThanOrEqual(26);
  });

  it('has unique ids', () => {
    const ids = new Set(CHORD_TYPES.map((t) => t.id));
    expect(ids.size).toBe(CHORD_TYPES.length);
  });

  it('every type includes the root (interval 0)', () => {
    for (const type of CHORD_TYPES) {
      expect(type.intervals[0]).toBe(0);
    }
  });

  it('every interval is within 0-11, ascending, deduplicated', () => {
    for (const type of CHORD_TYPES) {
      const seen = new Set<number>();
      for (let i = 0; i < type.intervals.length; i++) {
        const iv = type.intervals[i];
        expect(iv).toBeGreaterThanOrEqual(0);
        expect(iv).toBeLessThanOrEqual(11);
        expect(seen.has(iv)).toBe(false);
        seen.add(iv);
        if (i > 0) expect(iv).toBeGreaterThan(type.intervals[i - 1]);
      }
    }
  });

  it('every type is assigned to one of the 4 SPEC §5.2 groups', () => {
    for (const type of CHORD_TYPES) {
      expect(['basic', 'seventh', 'tension', 'other']).toContain(type.group);
    }
  });

  it('maj is a major triad', () => {
    expect(findChordType('maj').intervals).toEqual([0, 4, 7]);
  });

  it('m is a minor triad', () => {
    expect(findChordType('m').intervals).toEqual([0, 3, 7]);
  });

  it('7 is a dominant seventh', () => {
    expect(findChordType('7').intervals).toEqual([0, 4, 7, 10]);
  });

  it('dim7 is a fully symmetric diminished seventh', () => {
    expect(findChordType('dim7').intervals).toEqual([0, 3, 6, 9]);
  });

  it('m7b5 (half-diminished) differs from dim7 only in the 7th', () => {
    expect(findChordType('m7b5').intervals).toEqual([0, 3, 6, 10]);
  });
});

describe('chordTones', () => {
  it('C major triad is {C, E, G}', () => {
    expect(chordTones(0, 'maj')).toEqual(new Set([0, 4, 7]));
  });

  it('A minor triad is {A, C, E}', () => {
    expect(chordTones(9, 'm')).toEqual(new Set([9, 0, 4]));
  });

  it('wraps intervals past 11 back into 0-11 (e.g. B7)', () => {
    // B7 = B D# F# A -> pitch classes 11, 3, 6, 9
    expect(chordTones(11, '7')).toEqual(new Set([11, 3, 6, 9]));
  });

  it('every chord type produces a tone set no larger than its interval count', () => {
    for (const type of CHORD_TYPES) {
      expect(chordTones(5, type.id).size).toBe(type.intervals.length);
    }
  });
});
