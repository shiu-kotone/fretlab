import { describe, it, expect } from 'vitest';
import { initialSmoothedPitchState, updateSmoothedPitch, SMOOTHING_WINDOW } from './tunerSmoothing';

describe('updateSmoothedPitch', () => {
  it('starts with no displayed frequency', () => {
    expect(initialSmoothedPitchState().displayedFrequency).toBeNull();
  });

  it('leaves the displayed frequency unchanged (no flicker) on a null (low-confidence) frame', () => {
    let state = updateSmoothedPitch(initialSmoothedPitchState(), 440);
    const before = state.displayedFrequency;
    state = updateSmoothedPitch(state, null);
    expect(state.displayedFrequency).toBe(before);
  });

  it('displays the median of the last 5 confident readings', () => {
    let state = initialSmoothedPitchState();
    for (const f of [440, 441, 439, 442, 438]) {
      state = updateSmoothedPitch(state, f);
    }
    // sorted: 438,439,440,441,442 -> median 440
    expect(state.displayedFrequency).toBe(440);
  });

  it('keeps only the most recent SMOOTHING_WINDOW readings', () => {
    let state = initialSmoothedPitchState();
    for (let i = 0; i < 10; i++) {
      state = updateSmoothedPitch(state, 400 + i);
    }
    expect(state.history).toHaveLength(SMOOTHING_WINDOW);
    expect(state.history).toEqual([405, 406, 407, 408, 409]);
  });

  it('averages the two middle values for an even-length window', () => {
    let state = initialSmoothedPitchState();
    state = updateSmoothedPitch(state, 100);
    state = updateSmoothedPitch(state, 200);
    expect(state.displayedFrequency).toBe(150);
  });

  it('is resilient to a single outlier reading within the window', () => {
    let state = initialSmoothedPitchState();
    for (const f of [440, 440, 440, 440, 900]) {
      state = updateSmoothedPitch(state, f);
    }
    expect(state.displayedFrequency).toBe(440);
  });
});
