import { describe, it, expect } from 'vitest';
import { STRUM_PATTERNS, findStrumPattern, evenlySpacedOffsets, DEFAULT_STRUM_PATTERN_ID } from './strumPatterns';

describe('STRUM_PATTERNS', () => {
  it('has unique ids', () => {
    const ids = STRUM_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 10 presets per SPEC §5.3', () => {
    expect(STRUM_PATTERNS.length).toBe(10);
  });

  it('every rate pattern step falls within [0, cycleBeats)', () => {
    for (const p of STRUM_PATTERNS) {
      if (p.kind !== 'rate') continue;
      for (const step of p.steps) {
        expect(step.offsetBeats).toBeGreaterThanOrEqual(0);
        expect(step.offsetBeats).toBeLessThan(p.cycleBeats);
      }
    }
  });

  it('pluck actions reference a valid string index (0-5)', () => {
    for (const p of STRUM_PATTERNS) {
      if (p.kind !== 'rate') continue;
      for (const step of p.steps) {
        if (step.action.kind === 'pluck') {
          expect(step.action.stringIndex).toBeGreaterThanOrEqual(0);
          expect(step.action.stringIndex).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('only the shuffle preset is marked shuffle', () => {
    const shuffled = STRUM_PATTERNS.filter((p) => p.kind === 'rate' && p.shuffle);
    expect(shuffled.map((p) => p.id)).toEqual(['shuffle']);
  });

  it('DEFAULT_STRUM_PATTERN_ID resolves to a real pattern', () => {
    expect(() => findStrumPattern(DEFAULT_STRUM_PATTERN_ID)).not.toThrow();
  });

  it('findStrumPattern throws for an unknown id', () => {
    expect(() => findStrumPattern('nope')).toThrow();
  });
});

describe('evenlySpacedOffsets', () => {
  it('spaces N hits evenly across the segment', () => {
    expect(evenlySpacedOffsets(2, 4)).toEqual([0, 2]);
    expect(evenlySpacedOffsets(4, 4)).toEqual([0, 1, 2, 3]);
  });

  it('a single hit always falls at the segment start', () => {
    expect(evenlySpacedOffsets(1, 4)).toEqual([0]);
    expect(evenlySpacedOffsets(1, 3)).toEqual([0]);
  });

  it('returns an empty array for zero hits', () => {
    expect(evenlySpacedOffsets(0, 4)).toEqual([]);
  });
});
