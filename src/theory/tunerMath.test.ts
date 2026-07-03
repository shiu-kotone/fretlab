import { describe, it, expect } from 'vitest';
import {
  centsFromMidi,
  isInTune,
  findNearestStringIndex,
  initialTuneHoldState,
  updateTuneHold,
} from './tunerMath';
import { midiToFreq, REGULAR_TUNING } from './pitch';

describe('centsFromMidi', () => {
  it('is 0 when the frequency exactly matches the target MIDI note', () => {
    expect(centsFromMidi(midiToFreq(69), 69)).toBeCloseTo(0, 6);
  });

  it('is +100 cents for one semitone sharp', () => {
    expect(centsFromMidi(midiToFreq(70), 69)).toBeCloseTo(100, 4);
  });

  it('is unbounded, unlike nearest-note cents (e.g. -700 cents for a fifth flat)', () => {
    expect(centsFromMidi(midiToFreq(62), 69)).toBeCloseTo(-700, 4);
  });

  it('respects a custom A4 reference pitch', () => {
    expect(centsFromMidi(midiToFreq(69, 442), 69, 442)).toBeCloseTo(0, 6);
  });
});

describe('isInTune', () => {
  it('is true within the default ±5 cent tolerance', () => {
    expect(isInTune(4.9)).toBe(true);
    expect(isInTune(-4.9)).toBe(true);
    expect(isInTune(5)).toBe(true);
  });

  it('is false outside the tolerance', () => {
    expect(isInTune(5.1)).toBe(false);
    expect(isInTune(-6)).toBe(false);
  });

  it('respects a custom tolerance', () => {
    expect(isInTune(8, 10)).toBe(true);
    expect(isInTune(8, 3)).toBe(false);
  });
});

describe('findNearestStringIndex', () => {
  it('finds the closest string in regular tuning for each open string', () => {
    REGULAR_TUNING.forEach((midi, i) => {
      expect(findNearestStringIndex(midi, REGULAR_TUNING)).toBe(i);
    });
  });

  it('finds the closest string for a note between two strings', () => {
    // between string6 (E2=40) and string5 (A2=45): 42 is closer to 40
    expect(findNearestStringIndex(42, REGULAR_TUNING)).toBe(0);
    // 44 is closer to 45 (string5)
    expect(findNearestStringIndex(44, REGULAR_TUNING)).toBe(1);
  });
});

describe('tune hold timer', () => {
  it('does not confirm while out of tune', () => {
    const { state, confirmed } = updateTuneHold(initialTuneHoldState(), false, 1000);
    expect(confirmed).toBe(false);
    expect(state.inTuneSinceMs).toBeNull();
  });

  it('does not confirm before the hold duration elapses', () => {
    let { state } = updateTuneHold(initialTuneHoldState(), true, 1000);
    const result = updateTuneHold(state, true, 1300);
    expect(result.confirmed).toBe(false);
  });

  it('confirms once the hold duration (default 500ms) has elapsed', () => {
    let { state } = updateTuneHold(initialTuneHoldState(), true, 1000);
    const result = updateTuneHold(state, true, 1500);
    expect(result.confirmed).toBe(true);
  });

  it('resets the hold timer if tuning drifts out of tolerance mid-hold', () => {
    let { state } = updateTuneHold(initialTuneHoldState(), true, 1000);
    ({ state } = updateTuneHold(state, false, 1200)); // drifted out
    const result = updateTuneHold(state, true, 1250); // back in tune, timer restarts here
    expect(result.confirmed).toBe(false);
    const later = updateTuneHold(result.state, true, 1250 + 500);
    expect(later.confirmed).toBe(true);
  });

  it('respects a custom hold duration', () => {
    let { state } = updateTuneHold(initialTuneHoldState(), true, 0, 1000);
    expect(updateTuneHold(state, true, 900, 1000).confirmed).toBe(false);
    expect(updateTuneHold(state, true, 1000, 1000).confirmed).toBe(true);
  });
});
