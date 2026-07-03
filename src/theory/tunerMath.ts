import { midiToFreq, type Midi } from './pitch';

/**
 * Cents difference between a detected frequency and a *fixed* target MIDI
 * note — unlike freqToNearestNote's cents (which is always within ±50 of the
 * nearest chromatic note), this is unbounded. Needed for SPEC §5.5's manual
 * string-fixed mode, where the display should track distance from one
 * specific string's target even if far out of tune.
 */
export function centsFromMidi(freq: number, targetMidi: Midi, a4 = 440): number {
  const targetFreq = midiToFreq(targetMidi, a4);
  return 1200 * Math.log2(freq / targetFreq);
}

export function isInTune(cents: number, toleranceCents = 5): boolean {
  return Math.abs(cents) <= toleranceCents;
}

/** Index of the tuning's string whose target pitch is closest to the detected note. */
export function findNearestStringIndex(detectedMidi: Midi, tuning: Midi[]): number {
  let bestIndex = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < tuning.length; i++) {
    const diff = Math.abs(tuning[i] - detectedMidi);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export interface TuneHoldState {
  inTuneSinceMs: number | null;
}

export function initialTuneHoldState(): TuneHoldState {
  return { inTuneSinceMs: null };
}

/**
 * SPEC §5.5: holding within ±5 cents for 0.5s triggers the "in tune"
 * confirmation (checkmark + flash). Pure reducer so the hold timer is
 * testable without real timers/animation frames.
 */
export function updateTuneHold(
  state: TuneHoldState,
  inTune: boolean,
  nowMs: number,
  holdMs = 500,
): { state: TuneHoldState; confirmed: boolean } {
  if (!inTune) {
    return { state: { inTuneSinceMs: null }, confirmed: false };
  }
  const since = state.inTuneSinceMs ?? nowMs;
  const confirmed = nowMs - since >= holdMs;
  return { state: { inTuneSinceMs: since }, confirmed };
}
