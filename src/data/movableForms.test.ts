import { describe, it, expect } from 'vitest';
import { generateMovableVoicings } from './movableForms';
import { chordTones, CHORD_TYPES } from '../theory/chords';
import { fretToMidi, REGULAR_TUNING, noteName } from '../theory/pitch';

function everyPlayedNoteIsAChordTone(root: number, typeId: (typeof CHORD_TYPES)[number]['id']): string[] {
  const tones = chordTones(root, typeId);
  const failures: string[] = [];
  for (const voicing of generateMovableVoicings(root, typeId)) {
    voicing.frets.forEach((fret, stringIndex) => {
      if (fret === 'x') return;
      const midi = fretToMidi(stringIndex, fret, REGULAR_TUNING);
      const pc = ((midi % 12) + 12) % 12;
      if (!tones.has(pc)) {
        failures.push(
          `root=${root} type=${typeId}: string ${stringIndex} fret ${fret} plays ${noteName(midi, { flat: false, solfege: false })}, not a chord tone`,
        );
      }
    });
  }
  return failures;
}

describe('generateMovableVoicings', () => {
  it('produces at least one voicing for every chord type at a representative root', () => {
    for (const type of CHORD_TYPES) {
      expect(generateMovableVoicings(4, type.id).length).toBeGreaterThan(0);
    }
  });

  it('every voicing has exactly 6 fret entries', () => {
    for (const voicing of generateMovableVoicings(0, 'maj7')) {
      expect(voicing.frets).toHaveLength(6);
    }
  });

  it('voicings are sorted by ascending baseFret (position)', () => {
    const voicings = generateMovableVoicings(0, '9');
    for (let i = 1; i < voicings.length; i++) {
      expect(voicings[i].baseFret).toBeGreaterThanOrEqual(voicings[i - 1].baseFret);
    }
  });

  it('contains no duplicate voicings', () => {
    const voicings = generateMovableVoicings(4, '7');
    const keys = voicings.map((v) => v.frets.join(','));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every played note is a valid chord tone, for a sample of tricky chord types', () => {
    const sample: [number, (typeof CHORD_TYPES)[number]['id']][] = [
      [0, 'maj7s11'],
      [6, '13'],
      [9, 'dim7'],
      [1, 'm7b5'],
      [8, '7s5'],
    ];
    for (const [root, typeId] of sample) {
      expect(everyPlayedNoteIsAChordTone(root, typeId)).toEqual([]);
    }
  });

  it('generates a shell voicing (root-7th-3rd) only for chord types that actually have a 3rd and a 7th', () => {
    const withShell = generateMovableVoicings(0, 'maj7').some((v) => v.label === 'シェル');
    expect(withShell).toBe(true);
    const powerChordHasShell = generateMovableVoicings(0, '5').some((v) => v.label === 'シェル');
    expect(powerChordHasShell).toBe(false);
  });
});

describe('generateMovableVoicings — exhaustive validation (SPEC §5.2 requirement)', () => {
  it('every generated voicing across all 12 roots x all 30 chord types plays only valid chord tones', () => {
    const failures: string[] = [];
    for (let root = 0; root < 12; root++) {
      for (const type of CHORD_TYPES) {
        failures.push(...everyPlayedNoteIsAChordTone(root, type.id));
      }
    }
    expect(failures).toEqual([]);
  });
});
