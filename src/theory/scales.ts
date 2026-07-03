export type ScaleId =
  | 'major'
  | 'natural-minor'
  | 'harmonic-minor'
  | 'melodic-minor'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'diminished-hw'
  | 'diminished-wh'
  | 'whole-tone'
  | 'altered'
  | 'lydian-b7'
  | 'mixolydian-b9b13'
  | 'harmonic-minor-p5-below';

export interface ScaleDefinition {
  id: ScaleId;
  name: string;
  /** Semitone offsets from the root, e.g. major = [0,2,4,5,7,9,11]. */
  intervals: number[];
}

/** SPEC §5.1 "収録スケール(最低限)" — every scale listed there, one entry per named scale. */
export const SCALES: ScaleDefinition[] = [
  { id: 'major', name: 'メジャー(イオニアン)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor', name: 'ナチュラルマイナー', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic-minor', name: 'ハーモニックマイナー', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor', name: 'メロディックマイナー', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'major-pentatonic', name: 'メジャーペンタトニック', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'マイナーペンタトニック', intervals: [0, 3, 5, 7, 10] },
  { id: 'blues', name: 'ブルーススケール', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'dorian', name: 'ドリアン', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'フリジアン', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'リディアン', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'ミクソリディアン', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'aeolian', name: 'エオリアン', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'locrian', name: 'ロクリアン', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'diminished-hw', name: 'ディミニッシュ(H-W)', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  { id: 'diminished-wh', name: 'ディミニッシュ(W-H)', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
  { id: 'whole-tone', name: 'ホールトーン', intervals: [0, 2, 4, 6, 8, 10] },
  { id: 'altered', name: 'オルタード', intervals: [0, 1, 3, 4, 6, 8, 10] },
  { id: 'lydian-b7', name: 'リディアン♭7', intervals: [0, 2, 4, 6, 7, 9, 10] },
  { id: 'mixolydian-b9b13', name: 'ミクソリディアン♭9♭13', intervals: [0, 1, 4, 5, 7, 8, 10] },
  {
    id: 'harmonic-minor-p5-below',
    name: 'ハーモニックマイナーP5below(フリジアンドミナント)',
    intervals: [0, 1, 4, 5, 7, 8, 10],
  },
];

const SCALES_BY_ID = new Map(SCALES.map((s) => [s.id, s]));

export function findScale(id: ScaleId): ScaleDefinition {
  const scale = SCALES_BY_ID.get(id);
  if (!scale) throw new Error(`Unknown scale id: ${id}`);
  return scale;
}

/** Expands a scale's intervals into absolute pitch classes (0-11) for a given root. */
export function scaleTones(root: number, scaleId: ScaleId): number[] {
  const scale = findScale(scaleId);
  return scale.intervals.map((interval) => ((root + interval) % 12 + 12) % 12);
}
