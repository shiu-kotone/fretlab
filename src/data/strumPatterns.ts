export type StrumDirection = 'D' | 'U';

export type StrumAction =
  | { kind: 'strum'; direction: StrumDirection }
  /** stringIndex: 0 = 6th/low E ... 5 = 1st/high e, matching the Voicing.frets convention. */
  | { kind: 'pluck'; stringIndex: number };

export interface StrumStep {
  /** Offset within one pattern cycle, in beats (0-based, can be fractional). */
  offsetBeats: number;
  action: StrumAction;
  accent?: boolean;
}

interface RateStrumPattern {
  kind: 'rate';
  id: string;
  label: string;
  /** The pattern repeats every `cycleBeats` beats from the start of each chord segment. */
  cycleBeats: number;
  /** Only the shuffle preset needs the scheduler's swung 'shuffle' subdivision (2/3-beat triplet feel) instead of straight sixteenths. */
  shuffle?: boolean;
  steps: StrumStep[];
}

interface CountStrumPattern {
  kind: 'count';
  id: string;
  label: string;
  /** Evenly spaced downstrokes across the chord segment's duration, regardless of its length (e.g. whole-note = 1 hit, half-note = 2 hits). */
  hitsPerSegment: number;
}

export type StrumPattern = RateStrumPattern | CountStrumPattern;

const D: StrumDirection = 'D';
const U: StrumDirection = 'U';

/**
 * SPEC §5.3 names 10 presets: 全音符/2分/4分ダウン/8分オルタネート(DUDU)/
 * 定番「D–DU–UDU」/16ビート/シャッフル/アルペジオ3種(6弦から順・パターンA/B).
 * The exact note orders for "アルペジオA/B" aren't specified — declared here as
 * a roll (ascend-descend) and a bass-pinch pattern respectively.
 */
export const STRUM_PATTERNS: StrumPattern[] = [
  { kind: 'count', id: 'whole', label: '全音符', hitsPerSegment: 1 },
  { kind: 'count', id: 'half', label: '2分', hitsPerSegment: 2 },
  {
    kind: 'rate',
    id: 'quarterDown',
    label: '4分ダウン',
    cycleBeats: 1,
    steps: [{ offsetBeats: 0, action: { kind: 'strum', direction: D }, accent: true }],
  },
  {
    kind: 'rate',
    id: 'eighthAlternate',
    label: '8分オルタネート',
    cycleBeats: 1,
    steps: [
      { offsetBeats: 0, action: { kind: 'strum', direction: D }, accent: true },
      { offsetBeats: 0.5, action: { kind: 'strum', direction: U } },
    ],
  },
  {
    kind: 'rate',
    id: 'classicDDU',
    label: '定番 D-DU-UDU',
    cycleBeats: 4,
    steps: [
      { offsetBeats: 0, action: { kind: 'strum', direction: D }, accent: true },
      { offsetBeats: 1, action: { kind: 'strum', direction: D } },
      { offsetBeats: 1.5, action: { kind: 'strum', direction: U } },
      { offsetBeats: 2.5, action: { kind: 'strum', direction: U } },
      { offsetBeats: 3, action: { kind: 'strum', direction: D } },
      { offsetBeats: 3.5, action: { kind: 'strum', direction: U } },
    ],
  },
  {
    kind: 'rate',
    id: 'sixteenth',
    label: '16ビート',
    cycleBeats: 1,
    steps: [
      { offsetBeats: 0, action: { kind: 'strum', direction: D }, accent: true },
      { offsetBeats: 0.25, action: { kind: 'strum', direction: U } },
      { offsetBeats: 0.5, action: { kind: 'strum', direction: D } },
      { offsetBeats: 0.75, action: { kind: 'strum', direction: U } },
    ],
  },
  {
    kind: 'rate',
    id: 'shuffle',
    label: 'シャッフル',
    cycleBeats: 1,
    shuffle: true,
    steps: [
      { offsetBeats: 0, action: { kind: 'strum', direction: D }, accent: true },
      { offsetBeats: 2 / 3, action: { kind: 'strum', direction: U } },
    ],
  },
  {
    kind: 'rate',
    id: 'arpeggioSequential',
    label: 'アルペジオ(順次)',
    cycleBeats: 3,
    steps: [0, 1, 2, 3, 4, 5].map((stringIndex, i) => ({
      offsetBeats: i * 0.5,
      action: { kind: 'pluck', stringIndex },
      accent: i === 0,
    })),
  },
  {
    kind: 'rate',
    id: 'arpeggioRollA',
    label: 'アルペジオA(ロール)',
    cycleBeats: 3,
    steps: [0, 1, 2, 3, 2, 1].map((stringIndex, i) => ({
      offsetBeats: i * 0.5,
      action: { kind: 'pluck', stringIndex },
      accent: i === 0,
    })),
  },
  {
    kind: 'rate',
    id: 'arpeggioPinchB',
    label: 'アルペジオB(ピンチ)',
    cycleBeats: 3,
    steps: [0, 3, 0, 4, 0, 5].map((stringIndex, i) => ({
      offsetBeats: i * 0.5,
      action: { kind: 'pluck', stringIndex },
      accent: i === 0,
    })),
  },
];

const STRUM_PATTERNS_BY_ID = new Map(STRUM_PATTERNS.map((p) => [p.id, p]));

export function findStrumPattern(id: string): StrumPattern {
  const pattern = STRUM_PATTERNS_BY_ID.get(id);
  if (!pattern) throw new Error(`Unknown strum pattern id: ${id}`);
  return pattern;
}

export const DEFAULT_STRUM_PATTERN_ID = 'quarterDown';

/** Evenly spaced hit offsets (in beats from the segment start) for a 'count' pattern. */
export function evenlySpacedOffsets(hits: number, totalBeats: number): number[] {
  if (hits <= 0) return [];
  return Array.from({ length: hits }, (_, i) => (i * totalBeats) / hits);
}
