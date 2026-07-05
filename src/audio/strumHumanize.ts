/**
 * Pure humanization helpers for strummed/arpeggiated chord playback
 * (POLISH.md R3-1): small per-note randomness and a directional velocity tilt
 * so a strum doesn't sound like every string was struck with identical force
 * at a perfectly quantized instant. Randomness is injected via a
 * `rand: () => number` (0-1, defaulting to Math.random) so the jitter math
 * itself stays unit-testable.
 */

export const VELOCITY_JITTER = 0.06;
export const TIMING_JITTER_SECONDS = 0.004;
export const DIRECTION_TILT = 0.05;
export const WOUND_STRING_BRIGHTNESS = 0.45;
export const PLAIN_STRING_BRIGHTNESS = 0.55;

/** Applies +/-VELOCITY_JITTER of uniform noise to a base velocity, clamped to 0-1. */
export function jitteredVelocity(base: number, rand: () => number = Math.random): number {
  const jitter = (rand() * 2 - 1) * VELOCITY_JITTER;
  return Math.min(1, Math.max(0, base + jitter));
}

/** Timing offset in seconds, +/-TIMING_JITTER_SECONDS. */
export function jitteredTimingSeconds(rand: () => number = Math.random): number {
  return (rand() * 2 - 1) * TIMING_JITTER_SECONDS;
}

/**
 * Velocity delta for a string's position within a down/up strum: downstrums
 * favor the low (wound) strings, upstrums favor the high (plain) strings.
 * stringIndex 0 = 6th/low string ... 5 = 1st/high string (Voicing.frets convention).
 */
export function stringDirectionTilt(stringIndex: number, direction: 'D' | 'U'): number {
  const normalized = (stringIndex - 2.5) / 2.5; // -1 at string 0 (low) .. +1 at string 5 (high)
  return direction === 'D' ? -normalized * DIRECTION_TILT : normalized * DIRECTION_TILT;
}

/** Wound strings (6th-4th, index 0-2) are darker than plain strings (3rd-1st, index 3-5). */
export function brightnessForString(stringIndex: number): number {
  return stringIndex <= 2 ? WOUND_STRING_BRIGHTNESS : PLAIN_STRING_BRIGHTNESS;
}
