import { describe, it, expect } from 'vitest';
import { TUNING_PRESETS, findTuningPreset } from './tunings';
import { noteName } from '../theory/pitch';

function names(tuning: number[]): string[] {
  return tuning.map((m) => noteName(m, { flat: false, solfege: false }));
}

describe('TUNING_PRESETS', () => {
  it('defines all 8 SPEC §4.2 presets', () => {
    expect(TUNING_PRESETS.map((p) => p.id)).toEqual([
      'regular',
      'half-down',
      'whole-down',
      'drop-d',
      'drop-c',
      'dadgad',
      'open-g',
      'open-d',
    ]);
  });

  it('every preset has exactly 6 strings', () => {
    for (const preset of TUNING_PRESETS) {
      expect(preset.tuning).toHaveLength(6);
    }
  });

  it('regular tuning is standard E A D G B E', () => {
    expect(names(findTuningPreset('regular')!.tuning)).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
  });

  it('half-down tuning is Eb Ab Db Gb Bb Eb', () => {
    expect(names(findTuningPreset('half-down')!.tuning)).toEqual(['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4']);
  });

  it('drop D only lowers the 6th string by a whole step', () => {
    const regular = findTuningPreset('regular')!.tuning;
    const dropD = findTuningPreset('drop-d')!.tuning;
    expect(dropD[0]).toBe(regular[0] - 2);
    expect(dropD.slice(1)).toEqual(regular.slice(1));
    expect(names(dropD)[0]).toBe('D2');
  });

  it('drop C is drop D tuned down a further whole step on every string', () => {
    const dropD = findTuningPreset('drop-d')!.tuning;
    const dropC = findTuningPreset('drop-c')!.tuning;
    expect(dropC).toEqual(dropD.map((m) => m - 2));
  });

  it('DADGAD matches the well-known D A D G A D open tuning', () => {
    expect(names(findTuningPreset('dadgad')!.tuning)).toEqual(['D2', 'A2', 'D3', 'G3', 'A3', 'D4']);
  });

  it('Open G matches D G D G B D', () => {
    expect(names(findTuningPreset('open-g')!.tuning)).toEqual(['D2', 'G2', 'D3', 'G3', 'B3', 'D4']);
  });

  it('Open D matches D A D F# A D', () => {
    expect(names(findTuningPreset('open-d')!.tuning)).toEqual(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']);
  });

  it('findTuningPreset returns undefined for an unknown id', () => {
    expect(findTuningPreset('nonexistent')).toBeUndefined();
  });
});
