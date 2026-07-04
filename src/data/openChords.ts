import type { ChordTypeId } from '../theory/chords';
import type { Voicing } from './voicingTypes';

export interface OpenChordEntry {
  root: number;
  type: ChordTypeId;
  voicing: Voicing;
}

function open(frets: (number | 'x')[]): Voicing {
  return { frets, baseFret: 1, label: 'オープン' };
}

/**
 * Hand-written open-position voicings for the C/A/G/E/D root families
 * (SPEC §5.2) — the idiomatic shapes guitarists actually use, not a
 * mechanical sweep of every chord type. Extended/altered tensions and
 * diminished/augmented chords don't have well-known open shapes in
 * standard tuning and are covered instead by the movable-form generator.
 */
export const OPEN_CHORDS: OpenChordEntry[] = [
  // C family (root 0)
  { root: 0, type: 'maj', voicing: open(['x', 3, 2, 0, 1, 0]) },
  { root: 0, type: '7', voicing: open(['x', 3, 2, 3, 1, 0]) },
  { root: 0, type: 'maj7', voicing: open(['x', 3, 2, 0, 0, 0]) },
  { root: 0, type: '6', voicing: open(['x', 3, 2, 2, 1, 0]) },
  { root: 0, type: 'add9', voicing: open(['x', 3, 2, 0, 3, 0]) },
  { root: 0, type: 'sus4', voicing: open(['x', 3, 3, 0, 1, 1]) },

  // A family (root 9)
  { root: 9, type: 'maj', voicing: open(['x', 0, 2, 2, 2, 0]) },
  { root: 9, type: 'm', voicing: open(['x', 0, 2, 2, 1, 0]) },
  { root: 9, type: '7', voicing: open(['x', 0, 2, 0, 2, 0]) },
  { root: 9, type: 'm7', voicing: open(['x', 0, 2, 0, 1, 0]) },
  { root: 9, type: 'maj7', voicing: open(['x', 0, 2, 1, 2, 0]) },
  { root: 9, type: 'sus2', voicing: open(['x', 0, 2, 2, 0, 0]) },
  { root: 9, type: 'sus4', voicing: open(['x', 0, 2, 2, 3, 0]) },
  { root: 9, type: '6', voicing: open(['x', 0, 2, 2, 2, 2]) },
  { root: 9, type: 'm6', voicing: open(['x', 0, 2, 2, 1, 2]) },
  { root: 9, type: 'add9', voicing: open(['x', 0, 2, 4, 2, 0]) },
  { root: 9, type: '7sus4', voicing: open(['x', 0, 2, 0, 3, 0]) },
  { root: 9, type: '5', voicing: open(['x', 0, 2, 2, 'x', 'x']) },

  // G family (root 7)
  { root: 7, type: 'maj', voicing: open([3, 2, 0, 0, 0, 3]) },
  { root: 7, type: '7', voicing: open([3, 2, 0, 0, 0, 1]) },
  { root: 7, type: 'maj7', voicing: open([3, 2, 0, 0, 0, 2]) },
  { root: 7, type: '6', voicing: open([3, 2, 0, 0, 0, 0]) },
  { root: 7, type: 'sus4', voicing: open([3, 'x', 0, 0, 1, 3]) },

  // E family (root 4)
  { root: 4, type: 'maj', voicing: open([0, 2, 2, 1, 0, 0]) },
  { root: 4, type: 'm', voicing: open([0, 2, 2, 0, 0, 0]) },
  { root: 4, type: '7', voicing: open([0, 2, 0, 1, 0, 0]) },
  { root: 4, type: 'm7', voicing: open([0, 2, 0, 0, 0, 0]) },
  { root: 4, type: 'maj7', voicing: open([0, 2, 1, 1, 0, 0]) },
  { root: 4, type: '6', voicing: open([0, 2, 2, 1, 2, 0]) },
  { root: 4, type: 'm6', voicing: open([0, 2, 2, 0, 2, 0]) },
  { root: 4, type: 'sus4', voicing: open([0, 2, 2, 2, 0, 0]) },
  { root: 4, type: '5', voicing: open([0, 2, 2, 'x', 'x', 'x']) },

  // D family (root 2)
  { root: 2, type: 'maj', voicing: open(['x', 'x', 0, 2, 3, 2]) },
  { root: 2, type: 'm', voicing: open(['x', 'x', 0, 2, 3, 1]) },
  { root: 2, type: '7', voicing: open(['x', 'x', 0, 2, 1, 2]) },
  { root: 2, type: 'm7', voicing: open(['x', 'x', 0, 2, 1, 1]) },
  { root: 2, type: 'maj7', voicing: open(['x', 'x', 0, 2, 2, 2]) },
  { root: 2, type: 'sus4', voicing: open(['x', 'x', 0, 2, 3, 3]) },
  { root: 2, type: 'sus2', voicing: open(['x', 'x', 0, 2, 3, 0]) },
  { root: 2, type: '6', voicing: open(['x', 'x', 0, 2, 0, 2]) },
  { root: 2, type: 'm6', voicing: open(['x', 'x', 0, 2, 0, 1]) },
  { root: 2, type: '5', voicing: open(['x', 'x', 0, 2, 3, 'x']) },
];
