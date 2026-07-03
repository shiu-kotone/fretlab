import { REGULAR_TUNING, type Midi } from '../theory/pitch';

export interface TuningPreset {
  id: string;
  name: string;
  /** 6 values, string6 (low E equivalent) → string1 (high E equivalent). */
  tuning: Midi[];
}

function offsetTuning(offsets: number[]): Midi[] {
  return REGULAR_TUNING.map((m, i) => m + offsets[i]);
}

/** SPEC §4.2 preset tunings, expressed as semitone offsets from REGULAR_TUNING. */
export const TUNING_PRESETS: TuningPreset[] = [
  { id: 'regular', name: 'レギュラー', tuning: offsetTuning([0, 0, 0, 0, 0, 0]) },
  { id: 'half-down', name: '半音下げ', tuning: offsetTuning([-1, -1, -1, -1, -1, -1]) },
  { id: 'whole-down', name: '全音下げ', tuning: offsetTuning([-2, -2, -2, -2, -2, -2]) },
  { id: 'drop-d', name: 'Drop D', tuning: offsetTuning([-2, 0, 0, 0, 0, 0]) },
  { id: 'drop-c', name: 'Drop C', tuning: offsetTuning([-4, -2, -2, -2, -2, -2]) },
  { id: 'dadgad', name: 'DADGAD', tuning: offsetTuning([-2, 0, 0, 0, -2, -2]) },
  { id: 'open-g', name: 'Open G', tuning: offsetTuning([-2, -2, 0, 0, 0, -2]) },
  { id: 'open-d', name: 'Open D', tuning: offsetTuning([-2, 0, 0, -1, -2, -2]) },
];

export const CUSTOM_TUNING_MAX_OFFSET = 5;

export function findTuningPreset(id: string): TuningPreset | undefined {
  return TUNING_PRESETS.find((p) => p.id === id);
}
