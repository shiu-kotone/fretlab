import { describe, it, expect } from 'vitest';
import {
  advance,
  createInitialState,
  ticksPerBeat,
  tickTimings,
  secondsPerBeatFromBpm,
  type TempoParams,
  type SchedulerState,
} from './beatPlan';

describe('ticksPerBeat', () => {
  it('maps each subdivision to its expected click count', () => {
    expect(ticksPerBeat('quarter')).toBe(1);
    expect(ticksPerBeat('eighth')).toBe(2);
    expect(ticksPerBeat('triplet')).toBe(3);
    expect(ticksPerBeat('sixteenth')).toBe(4);
    expect(ticksPerBeat('shuffle')).toBe(2);
  });
});

describe('tickTimings', () => {
  it('evenly spaces plain subdivisions', () => {
    expect(tickTimings('sixteenth').map((t) => t.offsetInBeat)).toEqual([0, 0.25, 0.5, 0.75]);
  });

  it('swings the shuffle subdivision to a triplet-feel second tick', () => {
    const timings = tickTimings('shuffle');
    expect(timings[0].offsetInBeat).toBe(0);
    expect(timings[1].offsetInBeat).toBeCloseTo(2 / 3, 10);
  });

  it('marks only the first tick of each beat as the main beat', () => {
    for (const sub of ['eighth', 'triplet', 'sixteenth', 'shuffle'] as const) {
      const timings = tickTimings(sub);
      expect(timings[0].isMainBeat).toBe(true);
      expect(timings.slice(1).every((t) => !t.isMainBeat)).toBe(true);
    }
  });
});

describe('secondsPerBeatFromBpm', () => {
  it('converts BPM to seconds per beat', () => {
    expect(secondsPerBeatFromBpm(120)).toBeCloseTo(0.5, 10);
    expect(secondsPerBeatFromBpm(60)).toBeCloseTo(1, 10);
  });
});

function runTicks(state: SchedulerState, params: TempoParams, count: number) {
  const events = [];
  let s = state;
  for (let i = 0; i < count; i++) {
    const { event, next } = advance(s, params);
    events.push(event);
    s = next;
  }
  return { events, finalState: s };
}

describe('advance (quarter-note, no subdivision)', () => {
  const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.5, subdivision: 'quarter' };

  it('produces a click exactly every secondsPerBeat with zero drift over a long run', () => {
    const { events } = runTicks(createInitialState(0), params, 400); // 100 bars
    for (let i = 0; i < events.length; i++) {
      expect(events[i].time).toBeCloseTo(i * 0.5, 10);
      expect(events[i].isMainBeat).toBe(true);
    }
  });

  it('wraps beatIndex and increments barIndex every 4 beats', () => {
    const { events } = runTicks(createInitialState(0), params, 9);
    expect(events.map((e) => e.beatIndex)).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
    expect(events.map((e) => e.barIndex)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2]);
  });
});

describe('advance (subdivision timing within a beat)', () => {
  it('places eighth-note subdivision ticks halfway through each beat', () => {
    const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 1, subdivision: 'eighth' };
    const { events } = runTicks(createInitialState(0), params, 4);
    expect(events.map((e) => e.time)).toEqual([0, 0.5, 1, 1.5]);
    expect(events.map((e) => e.isMainBeat)).toEqual([true, false, true, false]);
    expect(events.map((e) => e.tickIndexInBeat)).toEqual([0, 1, 0, 1]);
  });

  it('places triplet subdivision ticks at thirds of the beat', () => {
    const params: TempoParams = { beatsPerBar: 1, secondsPerBeat: 3, subdivision: 'triplet' };
    const { events } = runTicks(createInitialState(0), params, 3);
    expect(events.map((e) => e.time)).toEqual([0, 1, 2]);
  });

  it('places 16th-note subdivision ticks at quarters of the beat', () => {
    const params: TempoParams = { beatsPerBar: 1, secondsPerBeat: 4, subdivision: 'sixteenth' };
    const { events } = runTicks(createInitialState(0), params, 4);
    expect(events.map((e) => e.time)).toEqual([0, 1, 2, 3]);
  });

  it('swings the shuffle subdivision second tick to 2/3 through the beat', () => {
    const params: TempoParams = { beatsPerBar: 1, secondsPerBeat: 3, subdivision: 'shuffle' };
    const { events } = runTicks(createInitialState(0), params, 2);
    expect(events[0].time).toBeCloseTo(0, 10);
    expect(events[1].time).toBeCloseTo(2, 10);
  });
});

describe('advance (tempo change takes effect from the next tick only)', () => {
  it('applies a new secondsPerBeat starting at the very next scheduled tick', () => {
    let state = createInitialState(0);
    const slow: TempoParams = { beatsPerBar: 4, secondsPerBeat: 1, subdivision: 'quarter' };
    const fast: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.25, subdivision: 'quarter' };

    let result = advance(state, slow);
    expect(result.event.time).toBe(0);
    state = result.next;

    result = advance(state, slow);
    expect(result.event.time).toBe(1);
    state = result.next;

    // tempo change: already-scheduled next tick time is untouched, new delta applies going forward
    result = advance(state, fast);
    expect(result.event.time).toBe(2);
    state = result.next;

    result = advance(state, fast);
    expect(result.event.time).toBeCloseTo(2.25, 10);
  });
});
