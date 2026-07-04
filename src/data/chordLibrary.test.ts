import { describe, it, expect } from 'vitest';
import { getVoicingsForChord } from './chordLibrary';
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
