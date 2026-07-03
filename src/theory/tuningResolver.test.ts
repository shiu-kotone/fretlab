import { describe, it, expect } from 'vitest';
import { resolveTuning, resolveTuningName, isRegularTuning } from './tuningResolver';
import { REGULAR_TUNING } from './pitch';
import { findTuningPreset } from '../data/tunings';

const customTunings = [
  { id: 'custom:1', name: 'マイチューニング', tuning: [38, 45, 50, 55, 59, 62] },
];

describe('resolveTuning', () => {
  it('resolves a preset id to its tuning', () => {
    expect(resolveTuning('drop-d', [])).toEqual(findTuningPreset('drop-d')!.tuning);
  });

  it('resolves a custom tuning id', () => {
    expect(resolveTuning('custom:1', customTunings)).toEqual(customTunings[0].tuning);
  });

  it('falls back to REGULAR_TUNING for an unknown id', () => {
    expect(resolveTuning('does-not-exist', customTunings)).toEqual(REGULAR_TUNING);
  });
});

describe('resolveTuningName', () => {
  it('resolves a preset name', () => {
    expect(resolveTuningName('open-g', [])).toBe('Open G');
  });

  it('resolves a custom tuning name', () => {
    expect(resolveTuningName('custom:1', customTunings)).toBe('マイチューニング');
  });

  it('falls back to the regular preset name for an unknown id', () => {
    expect(resolveTuningName('does-not-exist', customTunings)).toBe('レギュラー');
  });
});

describe('isRegularTuning', () => {
  it('is true only for the regular preset id', () => {
    expect(isRegularTuning('regular')).toBe(true);
    expect(isRegularTuning('drop-d')).toBe(false);
    expect(isRegularTuning('custom:1')).toBe(false);
  });
});
