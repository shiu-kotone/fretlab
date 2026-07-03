export type Subdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth' | 'shuffle';
export type AccentState = 'accent' | 'normal' | 'mute';

interface TickTiming {
  /** Fraction of the beat (0..1) at which this tick falls. */
  offsetInBeat: number;
  /** True for the tick that coincides with the main beat pulse (tickIndexInBeat === 0). */
  isMainBeat: boolean;
}

/**
 * Number of clicks generated per beat pulse for a given subdivision setting.
 * The "beat" is always the tempo pulse counted by BPM (SPEC §5.4 interpretation:
 * BPM counts pulses of the time signature's denominator note value directly,
 * compound-meter dotted-note conversion is out of scope).
 */
export function ticksPerBeat(subdivision: Subdivision): number {
  switch (subdivision) {
    case 'quarter':
      return 1;
    case 'eighth':
      return 2;
    case 'triplet':
      return 3;
    case 'sixteenth':
      return 4;
    case 'shuffle':
      return 2;
  }
}

/** Swing ratio used for the "shuffle" subdivision: second eighth falls 2/3 into the beat (triplet feel). */
const SHUFFLE_SECOND_TICK_OFFSET = 2 / 3;

export function tickTimings(subdivision: Subdivision): TickTiming[] {
  if (subdivision === 'shuffle') {
    return [
      { offsetInBeat: 0, isMainBeat: true },
      { offsetInBeat: SHUFFLE_SECOND_TICK_OFFSET, isMainBeat: false },
    ];
  }
  const n = ticksPerBeat(subdivision);
  return Array.from({ length: n }, (_, i) => ({
    offsetInBeat: i / n,
    isMainBeat: i === 0,
  }));
}

export interface SchedulerState {
  nextTickTime: number;
  barIndex: number;
  beatIndex: number;
  tickIndexInBeat: number;
}

export function createInitialState(startTime: number): SchedulerState {
  return { nextTickTime: startTime, barIndex: 0, beatIndex: 0, tickIndexInBeat: 0 };
}

export interface TempoParams {
  beatsPerBar: number;
  secondsPerBeat: number;
  subdivision: Subdivision;
}

export interface TickEvent {
  time: number;
  barIndex: number;
  beatIndex: number;
  tickIndexInBeat: number;
  isMainBeat: boolean;
  ticksPerBeat: number;
}

/**
 * Advances the scheduler by exactly one tick, computing the next tick's absolute
 * AudioContext time by adding a delta to the previous tick's time (never re-deriving
 * from wall-clock "now"). This is what keeps inter-beat jitter bound to floating point
 * error only, per the "A Tale of Two Clocks" scheduling approach required by SPEC §4.4.
 */
export function advance(
  state: SchedulerState,
  params: TempoParams,
): { event: TickEvent; next: SchedulerState } {
  const timings = tickTimings(params.subdivision);
  const n = timings.length;
  const timing = timings[state.tickIndexInBeat];

  const event: TickEvent = {
    time: state.nextTickTime,
    barIndex: state.barIndex,
    beatIndex: state.beatIndex,
    tickIndexInBeat: state.tickIndexInBeat,
    isMainBeat: timing.isMainBeat,
    ticksPerBeat: n,
  };

  let tickIndexInBeat = state.tickIndexInBeat + 1;
  let beatIndex = state.beatIndex;
  let barIndex = state.barIndex;
  let deltaFractionOfBeat: number;

  if (tickIndexInBeat >= n) {
    deltaFractionOfBeat = 1 - timing.offsetInBeat;
    tickIndexInBeat = 0;
    beatIndex++;
    if (beatIndex >= params.beatsPerBar) {
      beatIndex = 0;
      barIndex++;
    }
  } else {
    deltaFractionOfBeat = timings[tickIndexInBeat].offsetInBeat - timing.offsetInBeat;
  }

  const nextTickTime = state.nextTickTime + deltaFractionOfBeat * params.secondsPerBeat;

  return {
    event,
    next: { nextTickTime, barIndex, beatIndex, tickIndexInBeat },
  };
}

export function secondsPerBeatFromBpm(bpm: number): number {
  return 60 / bpm;
}
