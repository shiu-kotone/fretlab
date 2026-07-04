import type { ChordTypeId } from './chords';

const NOTE_LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Alias table mapping a *normalized* type suffix (accidentals folded to
 * ascii b/#, case- and whitespace-insensitive) to a canonical ChordTypeId.
 * Covers SPEC §6's required notation variants (b/#/♭/♯, "m7b5"/♭5 spelling,
 * "maj"/"M"/"Δ", "min"/"-", etc).
 */
const TYPE_ALIASES: Record<string, ChordTypeId> = {
  '': 'maj',
  maj: 'maj',
  major: 'maj',

  m: 'm',
  min: 'm',
  minor: 'm',
  '-': 'm',

  '5': '5',

  dim: 'dim',
  o: 'dim',

  aug: 'aug',
  '+': 'aug',

  sus2: 'sus2',

  sus4: 'sus4',
  sus: 'sus4',

  '6': '6',

  m6: 'm6',
  min6: 'm6',
  '-6': 'm6',

  '7sus4': '7sus4',
  '7sus': '7sus4',

  '7#5': '7s5',
  '7+5': '7s5',
  aug7: '7s5',

  '7b5': '7b5',
  '7-5': '7b5',

  maj7: 'maj7',
  ma7: 'maj7',
  delta7: 'maj7',
  delta: 'maj7',

  m7: 'm7',
  min7: 'm7',
  '-7': 'm7',

  '7': '7',
  dom7: '7',

  mmaj7: 'mMaj7',
  minmaj7: 'mMaj7',
  'm(maj7)': 'mMaj7',
  'm/maj7': 'mMaj7',
  mdelta7: 'mMaj7',

  dim7: 'dim7',
  o7: 'dim7',

  m7b5: 'm7b5',
  'm7-5': 'm7b5',
  ø: 'm7b5',
  ø7: 'm7b5',
  halfdim: 'm7b5',
  halfdim7: 'm7b5',
  min7b5: 'm7b5',

  '69': '69',
  '6/9': '69',

  maj9: 'maj9',

  m9: 'm9',
  min9: 'm9',

  '9': '9',

  add9: 'add9',

  madd9: 'madd9',
  minadd9: 'madd9',

  '11': '11',

  m11: 'm11',
  min11: 'm11',

  '13': '13',

  '7b9': '7b9',
  '7-9': '7b9',

  '7#9': '7s9',
  '7+9': '7s9',

  'maj7#11': 'maj7s11',
};

function foldAccidentals(input: string): string {
  return input.replace(/♯/g, '#').replace(/♭/g, 'b');
}

/**
 * Parses a chord symbol like "C#m7b5", "F♯m7♭5", or "Dbmaj7" into a root
 * pitch class and chord type id — SPEC §6 parseChordSymbol(). Returns null
 * for unrecognized input.
 */
export function parseChordSymbol(text: string): { root: number; type: ChordTypeId } | null {
  if (!text) return null;
  const trimmed = foldAccidentals(text.trim());
  if (trimmed.length === 0) return null;

  const letter = trimmed[0]?.toUpperCase();
  if (!letter || !(letter in NOTE_LETTERS)) return null;

  let root = NOTE_LETTERS[letter];
  let rest = trimmed.slice(1);

  if (rest[0] === '#') {
    root += 1;
    rest = rest.slice(1);
  } else if (rest[0] === 'b') {
    root -= 1;
    rest = rest.slice(1);
  }
  root = ((root % 12) + 12) % 12;

  rest = rest.trim();
  const normalized = rest.toLowerCase().replace(/\s+/g, '');

  // "M" (capital) as a standalone major-seventh-family marker (e.g. "CM7")
  // is distinguished from lowercase "m" (minor) before case-folding.
  if (/^M(7|9|11|13)?$/.test(rest)) {
    const withoutM = rest.slice(1);
    const majMap: Record<string, ChordTypeId> = { '': 'maj', '7': 'maj7', '9': 'maj9', '11': 'maj7s11', '13': 'maj9' };
    if (withoutM in majMap) return { root, type: majMap[withoutM] };
  }

  const type = TYPE_ALIASES[normalized];
  if (!type) return null;
  return { root, type };
}
