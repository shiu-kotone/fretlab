import { describe, it, expect } from 'vitest';
import { parseChordSymbol } from './chordParser';

describe('parseChordSymbol', () => {
  const cases: [string, { root: number; type: string } | null][] = [
    ['C', { root: 0, type: 'maj' }],
    ['Cm', { root: 0, type: 'm' }],
    ["C#m7b5", { root: 1, type: 'm7b5' }],
    ['F♯m7♭5', { root: 6, type: 'm7b5' }],
    ['Dbmaj7', { root: 1, type: 'maj7' }],
    ['D♭maj7', { root: 1, type: 'maj7' }],
    ['Fsus4', { root: 5, type: 'sus4' }],
    ['G7', { root: 7, type: '7' }],
    ['Am', { root: 9, type: 'm' }],
    ['Bdim', { root: 11, type: 'dim' }],
    ['Eaug', { root: 4, type: 'aug' }],
    ['E+', { root: 4, type: 'aug' }],
    ['C6', { root: 0, type: '6' }],
    ['Am6', { root: 9, type: 'm6' }],
    ['C69', { root: 0, type: '69' }],
    ['CM7', { root: 0, type: 'maj7' }],
    ['CM', { root: 0, type: 'maj' }],
    ['Cmaj7', { root: 0, type: 'maj7' }],
    ['CDelta7', { root: 0, type: 'maj7' }],
    ['Cm7', { root: 0, type: 'm7' }],
    ['Cmin7', { root: 0, type: 'm7' }],
    ['C-7', { root: 0, type: 'm7' }],
    ['CmMaj7', { root: 0, type: 'mMaj7' }],
    ['Cm(maj7)', { root: 0, type: 'mMaj7' }],
    ['Cdim7', { root: 0, type: 'dim7' }],
    ['Co7', { root: 0, type: 'dim7' }],
    ['Cø', { root: 0, type: 'm7b5' }],
    ['Cø7', { root: 0, type: 'm7b5' }],
    ['Cm7-5', { root: 0, type: 'm7b5' }],
    ['Cmaj9', { root: 0, type: 'maj9' }],
    ['Cm9', { root: 0, type: 'm9' }],
    ['C9', { root: 0, type: '9' }],
    ['Cadd9', { root: 0, type: 'add9' }],
    ['Cmadd9', { root: 0, type: 'madd9' }],
    ['C11', { root: 0, type: '11' }],
    ['Cm11', { root: 0, type: 'm11' }],
    ['C13', { root: 0, type: '13' }],
    ['C7sus4', { root: 0, type: '7sus4' }],
    ['C7b9', { root: 0, type: '7b9' }],
    ['C7#9', { root: 0, type: '7s9' }],
    ['C7#5', { root: 0, type: '7s5' }],
    ['C7b5', { root: 0, type: '7b5' }],
    ['Cmaj7#11', { root: 0, type: 'maj7s11' }],
    ['G#dim', { root: 8, type: 'dim' }],
    ['Bb7', { root: 10, type: '7' }],
    ['Gsus2', { root: 7, type: 'sus2' }],
    ['  C7  ', { root: 0, type: '7' }],
    ['c', { root: 0, type: 'maj' }],
    ['cm7', { root: 0, type: 'm7' }],
  ];

  it.each(cases)('parses %s', (input, expected) => {
    expect(parseChordSymbol(input)).toEqual(expected);
  });

  it('covers at least 30 notation cases (SPEC §6 requirement)', () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
  });

  it('C# and Db both resolve to the same root pitch class (enharmonic)', () => {
    expect(parseChordSymbol('C#')?.root).toBe(parseChordSymbol('Db')?.root);
  });

  it('returns null for an invalid note letter', () => {
    expect(parseChordSymbol('H')).toBeNull();
    expect(parseChordSymbol('Hm7')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseChordSymbol('')).toBeNull();
    expect(parseChordSymbol('   ')).toBeNull();
  });

  it('returns null for an unrecognized type suffix', () => {
    expect(parseChordSymbol('Cxyz')).toBeNull();
  });
});
