import { describe, it, expect } from 'vitest';
import { degreeLabel, degreeColorRole, degreeColor, DEGREE_PRESETS, DEGREE_LABELS } from './degrees';

describe('degreeLabel', () => {
  it('has 12 unique labels', () => {
    expect(DEGREE_LABELS).toHaveLength(12);
    expect(new Set(DEGREE_LABELS).size).toBe(12);
  });

  it('labels the root as R', () => {
    expect(degreeLabel(0)).toBe('R');
  });

  it('labels a perfect fifth as 5', () => {
    expect(degreeLabel(7)).toBe('5');
  });

  it('labels a minor third as ♭3', () => {
    expect(degreeLabel(3)).toBe('♭3');
  });

  it('wraps negative and >11 semitone values into 0-11', () => {
    expect(degreeLabel(12)).toBe('R');
    expect(degreeLabel(-1)).toBe('7');
  });
});

describe('degreeColorRole / degreeColor', () => {
  it('assigns root to the root color', () => {
    expect(degreeColorRole(0)).toBe('root');
  });

  it('assigns both third-family degrees (♭3, 3) to the third color', () => {
    expect(degreeColorRole(3)).toBe('third');
    expect(degreeColorRole(4)).toBe('third');
  });

  it('assigns the perfect fifth to the fifth color', () => {
    expect(degreeColorRole(7)).toBe('fifth');
  });

  it('assigns both seventh-family degrees (♭7, 7) to the seventh color', () => {
    expect(degreeColorRole(10)).toBe('seventh');
    expect(degreeColorRole(11)).toBe('seventh');
  });

  it('assigns remaining tensions (♭2,2,4,♭5,♯5,6) to the tension color', () => {
    for (const semitone of [1, 2, 5, 6, 8, 9]) {
      expect(degreeColorRole(semitone)).toBe('tension');
    }
  });

  it('degreeColor returns a CSS var reference matching SPEC §4.6 tokens', () => {
    expect(degreeColor(0)).toBe('var(--degree-root)');
    expect(degreeColor(7)).toBe('var(--degree-fifth)');
  });
});

describe('DEGREE_PRESETS', () => {
  it('defines all 6 SPEC §5.1 presets', () => {
    expect(DEGREE_PRESETS.map((p) => p.id)).toEqual([
      'major-triad',
      'minor-triad',
      '7th',
      'maj7',
      'm7',
      'power-chord',
    ]);
  });

  it('every preset includes the root', () => {
    for (const preset of DEGREE_PRESETS) {
      expect(preset.degrees).toContain(0);
    }
  });

  it('major triad is R-3-5', () => {
    expect(DEGREE_PRESETS.find((p) => p.id === 'major-triad')?.degrees).toEqual([0, 4, 7]);
  });

  it('minor triad is R-♭3-5', () => {
    expect(DEGREE_PRESETS.find((p) => p.id === 'minor-triad')?.degrees).toEqual([0, 3, 7]);
  });

  it('power chord is R-5 only', () => {
    expect(DEGREE_PRESETS.find((p) => p.id === 'power-chord')?.degrees).toEqual([0, 7]);
  });
});
