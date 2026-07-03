import { describe, it, expect } from 'vitest';
import { computeFeedbackGain, computeLowpassCutoff, computeVelocityGain, clampSustainSeconds } from './karplusStrong';

describe('computeFeedbackGain', () => {
  it('produces a gain of 1 when sustain is effectively infinite relative to the period', () => {
    // as sustainSeconds -> infinity relative to delayTime, gain -> 1 (no decay)
    expect(computeFeedbackGain(0.001, 1_000_000)).toBeCloseTo(1, 6);
  });

  it('decays to -60dB (0.001 amplitude) after exactly `sustainSeconds` of looping', () => {
    const delayTime = 1 / 440; // A4 period
    const sustainSeconds = 2;
    const gain = computeFeedbackGain(delayTime, sustainSeconds);
    const loopsInSustain = sustainSeconds / delayTime;
    const amplitudeAfterSustain = Math.pow(gain, loopsInSustain);
    expect(amplitudeAfterSustain).toBeCloseTo(0.001, 6);
  });

  it('a shorter sustain produces a smaller (faster-decaying) feedback gain', () => {
    const delayTime = 1 / 440;
    const fast = computeFeedbackGain(delayTime, 1.5);
    const slow = computeFeedbackGain(delayTime, 3);
    expect(fast).toBeLessThan(slow);
  });
});

describe('computeLowpassCutoff', () => {
  it('never filters below 1.5x the fundamental, even at brightness 0', () => {
    const freq = 440;
    expect(computeLowpassCutoff(freq, 0)).toBeGreaterThanOrEqual(freq * 1.5);
  });

  it('increases monotonically with brightness', () => {
    const freq = 220;
    const dark = computeLowpassCutoff(freq, 0);
    const mid = computeLowpassCutoff(freq, 0.5);
    const bright = computeLowpassCutoff(freq, 1);
    expect(dark).toBeLessThan(mid);
    expect(mid).toBeLessThan(bright);
  });

  it('clamps out-of-range brightness values', () => {
    const freq = 440;
    expect(computeLowpassCutoff(freq, -1)).toBe(computeLowpassCutoff(freq, 0));
    expect(computeLowpassCutoff(freq, 5)).toBe(computeLowpassCutoff(freq, 1));
  });
});

describe('computeVelocityGain', () => {
  it('clamps to the 0-1 range', () => {
    expect(computeVelocityGain(-0.5)).toBe(0);
    expect(computeVelocityGain(1.5)).toBe(1);
    expect(computeVelocityGain(0.6)).toBe(0.6);
  });
});

describe('clampSustainSeconds', () => {
  it('clamps to the SPEC §4.4 1.5-3 second range', () => {
    expect(clampSustainSeconds(0.5)).toBe(1.5);
    expect(clampSustainSeconds(10)).toBe(3);
    expect(clampSustainSeconds(2.2)).toBe(2.2);
  });
});
