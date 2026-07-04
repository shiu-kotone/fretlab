import type { Progression, Bar } from './progressionTypes';
import { chordIdFor } from './chordLibrary';
import type { ChordTypeId } from '../theory/chords';

function bar(beats: number, ...chords: { root: number; typeId: ChordTypeId; voicingIndex?: number }[]): Bar {
  const perChordBeats = beats / chords.length;
  return {
    chords: chords.map((c) => ({
      chordId: chordIdFor(c.root, c.typeId),
      voicingIndex: c.voicingIndex ?? 0,
      beats: perChordBeats,
    })),
  };
}

/**
 * SPEC §5.3 "初期同梱" bundled presets. Read-only: editing duplicates into a
 * user progression (persisted to IndexedDB) rather than mutating these.
 */
export const PRESET_PROGRESSIONS: Progression[] = [
  {
    id: 'preset:blues12',
    name: '12小節ブルース(A)',
    bpm: 96,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'eighthAlternate',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 9, typeId: '7' }), // A7
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 2, typeId: '7' }), // D7
      bar(4, { root: 2, typeId: '7' }),
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 4, typeId: '7' }), // E7
      bar(4, { root: 2, typeId: '7' }),
      bar(4, { root: 9, typeId: '7' }),
      bar(4, { root: 4, typeId: '7' }),
    ],
  },
  {
    id: 'preset:canon',
    name: 'カノン進行(C)',
    bpm: 80,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'quarterDown',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 0, typeId: 'maj' }), // C
      bar(4, { root: 7, typeId: 'maj' }), // G
      bar(4, { root: 9, typeId: 'm' }), // Am
      bar(4, { root: 4, typeId: 'm' }), // Em
      bar(4, { root: 5, typeId: 'maj' }), // F
      bar(4, { root: 0, typeId: 'maj' }), // C
      bar(4, { root: 5, typeId: 'maj' }), // F
      bar(4, { root: 7, typeId: 'maj' }), // G
    ],
  },
  {
    id: 'preset:oudou',
    name: '王道進行 IV△7-V7-iii7-vi(C)',
    bpm: 85,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'whole',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 5, typeId: 'maj7' }), // FMaj7
      bar(4, { root: 7, typeId: '7' }), // G7
      bar(4, { root: 4, typeId: 'm7' }), // Em7
      bar(4, { root: 9, typeId: 'm7' }), // Am7
    ],
  },
  {
    id: 'preset:komuro',
    name: '小室進行 vi-IV-V-I(C)',
    bpm: 100,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'eighthAlternate',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 9, typeId: 'm' }), // Am
      bar(4, { root: 5, typeId: 'maj' }), // F
      bar(4, { root: 7, typeId: 'maj' }), // G
      bar(4, { root: 0, typeId: 'maj' }), // C
    ],
  },
  {
    id: 'preset:251',
    name: '2-5-1(C)',
    bpm: 110,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'quarterDown',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 2, typeId: 'm7' }), // Dm7
      bar(4, { root: 7, typeId: '7' }), // G7
      bar(4, { root: 0, typeId: 'maj7' }), // Cmaj7
    ],
  },
  {
    id: 'preset:fifties',
    name: '50s進行 I-vi-IV-V(C)',
    bpm: 120,
    timeSig: { beats: 4, unit: 4 },
    strumPatternId: 'classicDDU',
    loop: true,
    createdAt: 0,
    updatedAt: 0,
    bars: [
      bar(4, { root: 0, typeId: 'maj' }), // C
      bar(4, { root: 9, typeId: 'm' }), // Am
      bar(4, { root: 5, typeId: 'maj' }), // F
      bar(4, { root: 7, typeId: 'maj' }), // G
    ],
  },
];

export function isPresetProgressionId(id: string): boolean {
  return id.startsWith('preset:');
}
