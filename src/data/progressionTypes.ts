import { parseChordId, getVoicingsForChord } from './chordLibrary';
import { findStrumPattern } from './strumPatterns';

export interface ChordSlot {
  chordId: string;
  voicingIndex: number;
  /** Beats within the bar this slot occupies; a bar's slots must sum to its time signature's beat count. */
  beats: number;
}

export interface Bar {
  /** 1-2 chord slots per SPEC §5.3 ("小節内1–2個"). */
  chords: ChordSlot[];
}

export interface ProgressionTimeSig {
  beats: number; // numerator, e.g. 4 for 4/4 or 3/4, 6 for 6/8, 12 for 12/8
  unit: 4 | 8;
}

export interface Progression {
  id: string;
  name: string;
  bpm: number; // 40-240
  timeSig: ProgressionTimeSig;
  strumPatternId: string;
  /** 1-64 bars. */
  bars: Bar[];
  loop: boolean;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_TIME_SIG: ProgressionTimeSig = { beats: 4, unit: 4 };

export function createEmptyBar(beats: number, chordId: string, voicingIndex = 0): Bar {
  return { chords: [{ chordId, voicingIndex, beats }] };
}

export function createEmptyProgression(name: string): Omit<Progression, 'id'> {
  const now = Date.now();
  return {
    name,
    bpm: 100,
    timeSig: DEFAULT_TIME_SIG,
    strumPatternId: 'quarterDown',
    bars: [createEmptyBar(4, '0-maj')],
    loop: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function barBeatsTotal(bar: Bar): number {
  return bar.chords.reduce((sum, c) => sum + c.beats, 0);
}

export interface BarSegment {
  /** Beat offset (0-based) within the bar where this chord starts. */
  startBeat: number;
  beats: number;
  chordId: string;
  voicingIndex: number;
}

/** Flattens a bar's 1-2 chord slots into segments with absolute start-beat offsets. */
export function computeBarSegments(bar: Bar): BarSegment[] {
  let cursor = 0;
  return bar.chords.map((c) => {
    const segment: BarSegment = { startBeat: cursor, beats: c.beats, chordId: c.chordId, voicingIndex: c.voicingIndex };
    cursor += c.beats;
    return segment;
  });
}

const SEGMENT_EPSILON = 1e-6;

/** The segment active at a given beat position (0-based, can be fractional); falls back to the last segment past the bar's end. */
export function findActiveSegment(segments: BarSegment[], beatPosition: number): BarSegment | null {
  for (const segment of segments) {
    if (beatPosition >= segment.startBeat - SEGMENT_EPSILON && beatPosition < segment.startBeat + segment.beats - SEGMENT_EPSILON) {
      return segment;
    }
  }
  return segments[segments.length - 1] ?? null;
}

/** Returns a list of human-readable validation errors; empty means the progression is playable/savable. */
export function validateProgression(p: Progression): string[] {
  const errors: string[] = [];

  if (p.bars.length < 1 || p.bars.length > 64) {
    errors.push(`小節数は1〜64である必要があります(現在${p.bars.length})`);
  }
  if (p.bpm < 40 || p.bpm > 240) {
    errors.push(`BPMは40〜240である必要があります(現在${p.bpm})`);
  }
  try {
    findStrumPattern(p.strumPatternId);
  } catch {
    errors.push(`不明なストラムパターン: ${p.strumPatternId}`);
  }

  p.bars.forEach((bar, barIndex) => {
    if (bar.chords.length < 1 || bar.chords.length > 2) {
      errors.push(`小節${barIndex + 1}: コード数は1〜2である必要があります`);
      return;
    }
    const total = barBeatsTotal(bar);
    if (total !== p.timeSig.beats) {
      errors.push(`小節${barIndex + 1}: 拍数の合計(${total})が拍子(${p.timeSig.beats})と一致しません`);
    }
    bar.chords.forEach((slot) => {
      const parsed = parseChordId(slot.chordId);
      if (!parsed) {
        errors.push(`小節${barIndex + 1}: 不明なコードID "${slot.chordId}"`);
        return;
      }
      const voicings = getVoicingsForChord(parsed.root, parsed.typeId);
      if (slot.voicingIndex < 0 || slot.voicingIndex >= voicings.length) {
        errors.push(`小節${barIndex + 1}: ボイシング番号(${slot.voicingIndex})が範囲外です`);
      }
    });
  });

  return errors;
}
