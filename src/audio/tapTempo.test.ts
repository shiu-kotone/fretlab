import { describe, it, expect } from 'vitest';
import { registerTap, initialTapTempoState, TAP_RESET_TIMEOUT_MS } from './tapTempo';

describe('registerTap', () => {
  it('returns null bpm after a single tap (no interval yet)', () => {
    const { bpm } = registerTap(initialTapTempoState(), 0);
    expect(bpm).toBeNull();
  });

  it('derives 120 BPM from two taps 500ms apart', () => {
    let state = initialTapTempoState();
    ({ state } = registerTap(state, 0));
    const { bpm } = registerTap(state, 500);
    expect(bpm).toBe(120);
  });

  it('averages the most recent 4 taps', () => {
    let state = initialTapTempoState();
    const times = [0, 500, 1000, 1500, 2000]; // steady 500ms -> 120bpm, 5th tap still averages last 4 intervals
    let bpm: number | null = null;
    for (const t of times) {
      ({ state, bpm } = registerTap(state, t));
    }
    expect(bpm).toBe(120);
    expect(state.taps).toEqual([500, 1000, 1500, 2000]); // only last 4 taps retained
  });

  it('resets the tap sequence after 2.5s of inactivity', () => {
    let state = initialTapTempoState();
    ({ state } = registerTap(state, 0));
    ({ state } = registerTap(state, 500)); // 120bpm established
    const { state: resetState, bpm } = registerTap(state, 500 + TAP_RESET_TIMEOUT_MS + 1);
    expect(bpm).toBeNull(); // treated as a fresh first tap
    expect(resetState.taps).toHaveLength(1);
  });

  it('does not reset when the gap is exactly at the timeout boundary', () => {
    let state = initialTapTempoState();
    ({ state } = registerTap(state, 0));
    const { bpm } = registerTap(state, TAP_RESET_TIMEOUT_MS);
    expect(bpm).not.toBeNull();
  });

  it('clamps a fast derived BPM to the SPEC upper bound of 300', () => {
    let state = initialTapTempoState();
    ({ state } = registerTap(state, 0));
    const { bpm } = registerTap(state, 50); // 1200bpm raw -> clamp to 300
    expect(bpm).toBe(300);
  });

  // Note: the 20 BPM lower bound is unreachable through normal tapping, since any
  // gap over TAP_RESET_TIMEOUT_MS (2.5s, i.e. below 24 BPM) resets the sequence
  // instead of producing a slow interval. The clamp exists defensively only.
});
