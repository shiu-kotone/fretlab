import { REGULAR_TUNING, type Midi } from './pitch';
import { TUNING_PRESETS, findTuningPreset } from '../data/tunings';

export interface CustomTuningLike {
  id: string;
  name: string;
  tuning: Midi[];
}

/**
 * Resolves a tuning id (a SPEC §4.2 preset id, or a "custom:<n>" id) to its
 * absolute MIDI tuning. Falls back to REGULAR_TUNING for an unknown id,
 * since the rest of the app always needs *some* valid 6-string tuning.
 */
export function resolveTuning(tuningId: string, customTunings: CustomTuningLike[]): Midi[] {
  const preset = findTuningPreset(tuningId);
  if (preset) return preset.tuning;
  const custom = customTunings.find((t) => t.id === tuningId);
  if (custom) return custom.tuning;
  return REGULAR_TUNING;
}

export function resolveTuningName(tuningId: string, customTunings: CustomTuningLike[]): string {
  const preset = findTuningPreset(tuningId);
  if (preset) return preset.name;
  const custom = customTunings.find((t) => t.id === tuningId);
  if (custom) return custom.name;
  return TUNING_PRESETS[0].name;
}

export function isRegularTuning(tuningId: string): boolean {
  return tuningId === 'regular';
}
