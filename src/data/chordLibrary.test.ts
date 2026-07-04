import { describe, it, expect } from 'vitest';
import { getVoicingsForChord, chordIdFor, parseChordId, pickTransposedVoicing } from './chordLibrary';
import { CHORD_TYPES, chordTones } from '../theory/chords';
import { fretToMidi, REGULAR_TUNING } from '../theory/pitch';

describe('getVoicingsForChord', () => {
  it('every (root, type) across the full 12x30 matrix has at least 3 voicings (SPEC §5.2 "各3〜6ボイシング")', () => {
    const shortfalls: string[] = [];
    for (let root = 0; root < 12; root++) {
      for (const type of CHORD_TYPES) {
        const voicings = getVoicingsForChord(root, type.id);
        if (voicings.length < 3) shortfalls.push(`root=${root} type=${type.id}: only ${voicings.length}`);
      }
    }
    expect(shortfalls).toEqual([]);
  });

  it('sorts voicings low position to high position', () => {
    const voicings = getVoicingsForChord(0, 'maj');
    for (let i = 1; i < voicings.length; i++) {
      expect(voicings[i].baseFret).toBeGreaterThanOrEqual(voicings[i - 1].baseFret);
    }
  });

  it('includes the hand-written open voicing first when one exists', () => {
    const voicings = getVoicingsForChord(0, 'maj'); // C major has a hand-written open chord
    expect(voicings[0].label).toBe('オープン');
  });

  it('SPEC §5.2 exhaustive validation: every played note across the full matrix is a member of the chord tone set', () => {
    const failures: string[] = [];
    for (let root = 0; root < 12; root++) {
      for (const type of CHORD_TYPES) {
        const tones = chordTones(root, type.id);
        for (const voicing of getVoicingsForChord(root, type.id)) {
          voicing.frets.forEach((fret, stringIndex) => {
            if (fret === 'x') return;
            const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
            const pc = ((midi % 12) + 12) % 12;
            if (!tones.has(pc)) {
              failures.push(`root=${root} type=${type.id} label=${voicing.label}: string ${stringIndex} fret ${fret} pc ${pc} not in {${[...tones]}}`);
            }
          });
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('chordIdFor / parseChordId', () => {
  it('round-trips every (root, type) in the matrix', () => {
    for (let root = 0; root < 12; root++) {
      for (const type of CHORD_TYPES) {
        const id = chordIdFor(root, type.id);
        expect(parseChordId(id)).toEqual({ root, typeId: type.id });
      }
    }
  });

  it('returns null for malformed or unknown-type ids', () => {
    expect(parseChordId('not-a-chord-id')).toBeNull();
    expect(parseChordId('0-notARealType')).toBeNull();
    expect(parseChordId('12-maj')).toBeNull(); // root out of range
  });
});

describe('pickTransposedVoicing', () => {
  it('always returns a valid index into the new root/type voicing list', () => {
    for (let root = 0; root < 12; root++) {
      for (const type of CHORD_TYPES) {
        const voicings = getVoicingsForChord(root, type.id);
        for (let vi = 0; vi < voicings.length; vi++) {
          for (const semitones of [-5, -1, 1, 5, 7]) {
            const result = pickTransposedVoicing(root, type.id, vi, semitones);
            const newVoicings = getVoicingsForChord(result.root, type.id);
            expect(result.voicingIndex).toBeGreaterThanOrEqual(0);
            expect(result.voicingIndex).toBeLessThan(newVoicings.length);
          }
        }
      }
    }
  });

  it('wraps the root modulo 12', () => {
    expect(pickTransposedVoicing(0, 'maj', 0, -1).root).toBe(11);
    expect(pickTransposedVoicing(11, 'maj', 0, 1).root).toBe(0);
  });

  it('preserves the movable-form label when a same-label voicing exists at the new root', () => {
    const voicings = getVoicingsForChord(0, 'maj');
    const movableIndex = voicings.findIndex((v) => v.label !== 'オープン');
    expect(movableIndex).toBeGreaterThanOrEqual(0);
    const movable = voicings[movableIndex];

    const result = pickTransposedVoicing(0, 'maj', movableIndex, 3);
    const newVoicing = getVoicingsForChord(result.root, 'maj')[result.voicingIndex];
    expect(newVoicing.label).toBe(movable.label);
  });

  it('a no-op transpose (0 semitones) keeps the same voicing', () => {
    const result = pickTransposedVoicing(4, '7', 1, 0);
    expect(result.root).toBe(4);
    expect(result.voicingIndex).toBe(1);
  });
});
