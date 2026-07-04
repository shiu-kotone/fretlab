import { describe, it, expect } from 'vitest';
import { OPEN_CHORDS } from './openChords';
import { chordTones, findChordType } from '../theory/chords';
import { fretToMidi, REGULAR_TUNING, noteName } from '../theory/pitch';

describe('OPEN_CHORDS', () => {
  it('has a reasonable-sized curated set for the C/A/G/E/D root families', () => {
    expect(OPEN_CHORDS.length).toBeGreaterThanOrEqual(30);
  });

  it('every entry has exactly 6 fret positions', () => {
    for (const entry of OPEN_CHORDS) {
      expect(entry.voicing.frets).toHaveLength(6);
    }
  });

  it('every entry is rooted in the C/A/G/E/D families', () => {
    const allowedRoots = new Set([0, 2, 4, 7, 9]); // C D E G A
    for (const entry of OPEN_CHORDS) {
      expect(allowedRoots.has(entry.root)).toBe(true);
    }
  });

  it('every entry is baseFret 1 (a genuine open-position voicing)', () => {
    for (const entry of OPEN_CHORDS) {
      expect(entry.voicing.baseFret).toBe(1);
    }
  });

  it('SPEC §5.2 validation requirement: every played note is a member of the chord\'s tone set', () => {
    const failures: string[] = [];
    for (const entry of OPEN_CHORDS) {
      const tones = chordTones(entry.root, entry.type);
      const def = findChordType(entry.type);
      const rootName = noteName(60 + entry.root, { flat: false, solfege: false }).replace(/\d+$/, '');
      entry.voicing.frets.forEach((fret, stringIndex) => {
        if (fret === 'x') return;
        const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
        const pc = ((midi % 12) + 12) % 12;
        if (!tones.has(pc)) {
          const playedName = noteName(midi, { flat: false, solfege: false });
          failures.push(
            `${rootName}${def.symbol}: string ${stringIndex} fret ${fret} plays ${playedName} (pc ${pc}), not in chord tones {${[...tones].join(',')}}`,
          );
        }
      });
    }
    expect(failures).toEqual([]);
  });

  it('every voicing sounds at least the root somewhere', () => {
    for (const entry of OPEN_CHORDS) {
      const rootPc = entry.root;
      const sounds = entry.voicing.frets.some((fret, stringIndex) => {
        if (fret === 'x') return false;
        const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
        return ((midi % 12) + 12) % 12 === rootPc;
      });
      expect(sounds).toBe(true);
    }
  });

  it('no (root, type) pair is duplicated', () => {
    const seen = new Set<string>();
    for (const entry of OPEN_CHORDS) {
      const key = `${entry.root}-${entry.type}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
