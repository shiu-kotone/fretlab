export type ChordTypeId =
  | 'maj'
  | 'm'
  | '5'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | '6'
  | 'm6'
  | '7sus4'
  | '7s5'
  | '7b5'
  | 'maj7'
  | 'm7'
  | '7'
  | 'mMaj7'
  | 'dim7'
  | 'm7b5'
  | '69'
  | 'maj9'
  | 'm9'
  | '9'
  | 'add9'
  | 'madd9'
  | '11'
  | 'm11'
  | '13'
  | '7b9'
  | '7s9'
  | 'maj7s11';

export type ChordGroup = 'basic' | 'seventh' | 'tension' | 'other';

export interface ChordTypeDefinition {
  id: ChordTypeId;
  /** Appended directly after the root note name, e.g. root "C" + symbol "m7♭5" -> "Cm7♭5". */
  symbol: string;
  name: string;
  /** Semitone offsets from the root, ascending, deduplicated. */
  intervals: number[];
  group: ChordGroup;
}

/** SPEC §5.2 "コード網羅範囲" — all 30 listed chord types. */
export const CHORD_TYPES: ChordTypeDefinition[] = [
  // 基本 (basic triads)
  { id: 'maj', symbol: '', name: 'メジャー', intervals: [0, 4, 7], group: 'basic' },
  { id: 'm', symbol: 'm', name: 'マイナー', intervals: [0, 3, 7], group: 'basic' },
  { id: '5', symbol: '5', name: 'パワーコード', intervals: [0, 7], group: 'basic' },
  { id: 'dim', symbol: 'dim', name: 'ディミニッシュ', intervals: [0, 3, 6], group: 'basic' },
  { id: 'aug', symbol: 'aug', name: 'オーギュメント', intervals: [0, 4, 8], group: 'basic' },

  // セブンス
  { id: 'maj7', symbol: 'maj7', name: 'メジャーセブンス', intervals: [0, 4, 7, 11], group: 'seventh' },
  { id: 'm7', symbol: 'm7', name: 'マイナーセブンス', intervals: [0, 3, 7, 10], group: 'seventh' },
  { id: '7', symbol: '7', name: 'ドミナントセブンス', intervals: [0, 4, 7, 10], group: 'seventh' },
  { id: 'mMaj7', symbol: 'mMaj7', name: 'マイナーメジャーセブンス', intervals: [0, 3, 7, 11], group: 'seventh' },
  { id: 'dim7', symbol: 'dim7', name: 'ディミニッシュセブンス', intervals: [0, 3, 6, 9], group: 'seventh' },
  { id: 'm7b5', symbol: 'm7♭5', name: 'マイナーセブンフラットファイブ', intervals: [0, 3, 6, 10], group: 'seventh' },

  // テンション
  { id: '69', symbol: '6/9', name: 'シックスナインス', intervals: [0, 2, 4, 7, 9], group: 'tension' },
  { id: 'maj9', symbol: 'maj9', name: 'メジャーナインス', intervals: [0, 2, 4, 7, 11], group: 'tension' },
  { id: 'm9', symbol: 'm9', name: 'マイナーナインス', intervals: [0, 2, 3, 7, 10], group: 'tension' },
  { id: '9', symbol: '9', name: 'ナインス', intervals: [0, 2, 4, 7, 10], group: 'tension' },
  { id: 'add9', symbol: 'add9', name: 'アドナインス', intervals: [0, 2, 4, 7], group: 'tension' },
  { id: 'madd9', symbol: 'madd9', name: 'マイナーアドナインス', intervals: [0, 2, 3, 7], group: 'tension' },
  { id: '11', symbol: '11', name: 'イレブンス', intervals: [0, 2, 4, 5, 7, 10], group: 'tension' },
  { id: 'm11', symbol: 'm11', name: 'マイナーイレブンス', intervals: [0, 2, 3, 5, 7, 10], group: 'tension' },
  { id: '13', symbol: '13', name: 'サーティーンス', intervals: [0, 2, 4, 7, 9, 10], group: 'tension' },
  { id: '7b9', symbol: '7♭9', name: 'セブンフラットナイン', intervals: [0, 1, 4, 7, 10], group: 'tension' },
  { id: '7s9', symbol: '7♯9', name: 'セブンシャープナイン', intervals: [0, 3, 4, 7, 10], group: 'tension' },
  { id: 'maj7s11', symbol: 'maj7♯11', name: 'メジャーセブンシャープイレブン', intervals: [0, 4, 6, 7, 11], group: 'tension' },

  // その他
  { id: 'sus2', symbol: 'sus2', name: 'サスペンデッドツー', intervals: [0, 2, 7], group: 'other' },
  { id: 'sus4', symbol: 'sus4', name: 'サスペンデッドフォー', intervals: [0, 5, 7], group: 'other' },
  { id: '6', symbol: '6', name: 'シックス', intervals: [0, 4, 7, 9], group: 'other' },
  { id: 'm6', symbol: 'm6', name: 'マイナーシックス', intervals: [0, 3, 7, 9], group: 'other' },
  { id: '7sus4', symbol: '7sus4', name: 'セブンスサスフォー', intervals: [0, 5, 7, 10], group: 'other' },
  { id: '7s5', symbol: '7♯5', name: 'セブンシャープファイブ', intervals: [0, 4, 8, 10], group: 'other' },
  { id: '7b5', symbol: '7♭5', name: 'セブンフラットファイブ', intervals: [0, 4, 6, 10], group: 'other' },
];

const CHORD_TYPES_BY_ID = new Map(CHORD_TYPES.map((t) => [t.id, t]));

export function findChordType(id: ChordTypeId): ChordTypeDefinition {
  const type = CHORD_TYPES_BY_ID.get(id);
  if (!type) throw new Error(`Unknown chord type id: ${id}`);
  return type;
}

/** Constituent pitch classes (0-11) of a chord — SPEC §6 chordTones(). */
export function chordTones(root: number, typeId: ChordTypeId): Set<number> {
  const def = findChordType(typeId);
  return new Set(def.intervals.map((i) => (((root + i) % 12) + 12) % 12));
}
