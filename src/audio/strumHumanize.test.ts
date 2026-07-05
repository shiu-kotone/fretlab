import { describe, it, expect } from 'vitest';
import {
  jitteredVelocity,
  jitteredTimingSeconds,
  stringDirectionTilt,
  brightnessForString,
  VELOCITY_JITTER,
  TIMING_JITTER_SECONDS,
  DIRECTION_TILT,
} from './strumHumanize';

describe('jitteredVelocity', () => {
  it('returns the base value unchanged when rand is at its midpoint', () => {
    expect(jitteredVelocity(0.7, () => 0.5)).toBeCloseTo(0.7, 6);
  });

  it('applies at most +/-VELOCITY_JITTER at the extremes', () => {
    expect(jitteredVelocity(0.7, () => 1)).toBeCloseTo(0.7 + VELOCITY_JITTER, 6);
    expect(jitteredVelocity(0.7, () => 0)).toBeCloseTo(0.7 - VELOCITY_JITTER, 6);
  });

  it('clamps to the 0-1 range', () => {
    expect(jitteredVelocity(0.99, () => 1)).toBe(1);
    expect(jitteredVelocity(0.02, () => 0)).toBe(0);
  });
});

describe('jitteredTimingSeconds', () => {
  it('is zero at rand midpoint and bounded by +/-TIMING_JITTER_SECONDS', () => {
    expect(jitteredTimingSeconds(() => 0.5)).toBeCloseTo(0, 6);
    expect(jitteredTimingSeconds(() => 1)).toBeCloseTo(TIMING_JITTER_SECONDS, 6);
    expect(jitteredTimingSeconds(() => 0)).toBeCloseTo(-TIMING_JITTER_SECONDS, 6);
  });
});

describe('stringDirectionTilt', () => {
  it('boosts the lowest string and cuts the highest on a downstrum', () => {
    expect(stringDirectionTilt(0, 'D')).toBeCloseTo(DIRECTION_TILT, 6);
    expect(stringDirectionTilt(5, 'D')).toBeCloseTo(-DIRECTION_TILT, 6);
  });

  it('boosts the highest string and cuts the lowest on an upstrum', () => {
    expect(stringDirectionTilt(5, 'U')).toBeCloseTo(DIRECTION_TILT, 6);
    expect(stringDirectionTilt(0, 'U')).toBeCloseTo(-DIRECTION_TILT, 6);
  });
});

describe('brightnessForString', () => {
  it('darkens wound strings (6th-4th, index 0-2)', () => {
    expect(brightnessForString(0)).toBe(0.45);
    expect(brightnessForString(1)).toBe(0.45);
    expect(brightnessForString(2)).toBe(0.45);
  });

  it('brightens plain strings (3rd-1st, index 3-5)', () => {
    expect(brightnessForString(3)).toBe(0.55);
    expect(brightnessForString(4)).toBe(0.55);
    expect(brightnessForString(5)).toBe(0.55);
  });
});
