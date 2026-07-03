export type Midi = number;

export const REGULAR_TUNING: Midi[] = [40, 45, 50, 55, 59, 64]; // 6弦E2 → 1弦E4

export function midiToFreq(midi: Midi, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToNearestNote(freq: number, a4 = 440): { midi: Midi; cents: number } {
  const rawMidi = 69 + 12 * Math.log2(freq / a4);
  const midi = Math.round(rawMidi);
  const cents = (rawMidi - midi) * 100;
  return { midi, cents };
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const SOLFEGE_SHARP = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
const SOLFEGE_FLAT = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ソ♭', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'];

export function noteName(midi: Midi, opts: { flat: boolean; solfege: boolean }): string {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const table = opts.solfege
    ? opts.flat
      ? SOLFEGE_FLAT
      : SOLFEGE_SHARP
    : opts.flat
      ? FLAT_NAMES
      : SHARP_NAMES;
  return `${table[pitchClass]}${octave}`;
}

export function fretToMidi(stringIndex: number, fret: number, tuning: Midi[] = REGULAR_TUNING): Midi {
  return tuning[stringIndex] + fret;
}

export function interval(root: Midi, note: Midi): number {
  return ((note - root) % 12 + 12) % 12;
}

const NATURAL_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]); // C D E F G A B

/** True for natural notes (no sharp/flat) — SPEC §5.1 fretboard label mode "ナチュラル音のみ". */
export function isNaturalPitchClass(pitchClass: number): boolean {
  return NATURAL_PITCH_CLASSES.has(((pitchClass % 12) + 12) % 12);
}
