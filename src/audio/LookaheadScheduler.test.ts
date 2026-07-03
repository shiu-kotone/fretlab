import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LookaheadScheduler, TIMER_INTERVAL_MS } from './LookaheadScheduler';
import type { TempoParams, TickEvent } from './beatPlan';

describe('LookaheadScheduler', () => {
  let audioClock = 0;
  const advanceAudioClockAndTimers = (ms: number) => {
    audioClock += ms / 1000;
    vi.advanceTimersByTime(ms);
  };

  beforeEach(() => {
    vi.useFakeTimers();
    audioClock = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules the first tick synchronously on start()', () => {
    const events: TickEvent[] = [];
    const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.5, subdivision: 'quarter' };
    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => audioClock,
      getTempoParams: () => params,
      onTick: (e) => events.push(e),
    });

    scheduler.start(0);
    expect(events).toHaveLength(1);
    expect(events[0].time).toBe(0);
    scheduler.stop();
  });

  it('schedules subsequent ticks as the audio clock advances, at exact beat-interval times', () => {
    const events: TickEvent[] = [];
    const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.5, subdivision: 'quarter' };
    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => audioClock,
      getTempoParams: () => params,
      onTick: (e) => events.push(e),
    });

    scheduler.start(0);
    // advance simulated audio clock/timers by 2 seconds; the 100ms lookahead window
    // means the tick at t=2.0 is also scheduled just before the clock reaches it.
    for (let i = 0; i < 2000 / TIMER_INTERVAL_MS; i++) {
      advanceAudioClockAndTimers(TIMER_INTERVAL_MS);
    }
    scheduler.stop();

    const times = events.map((e) => Math.round(e.time * 1000) / 1000);
    expect(times).toEqual([0, 0.5, 1, 1.5, 2]);
  });

  it('never lets the gap between consecutive scheduled beat times drift from the target interval', () => {
    const events: TickEvent[] = [];
    const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.25, subdivision: 'quarter' };
    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => audioClock,
      getTempoParams: () => params,
      onTick: (e) => events.push(e),
    });

    scheduler.start(0);
    for (let i = 0; i < 5000 / TIMER_INTERVAL_MS; i++) {
      advanceAudioClockAndTimers(TIMER_INTERVAL_MS);
    }
    scheduler.stop();

    for (let i = 1; i < events.length; i++) {
      const gap = events[i].time - events[i - 1].time;
      expect(Math.abs(gap - 0.25)).toBeLessThan(0.0005); // well within the ±3ms SPEC budget
    }
  });

  it('stop() halts scheduling and start() begins a fresh sequence', () => {
    const events: TickEvent[] = [];
    const params: TempoParams = { beatsPerBar: 4, secondsPerBeat: 0.5, subdivision: 'quarter' };
    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => audioClock,
      getTempoParams: () => params,
      onTick: (e) => events.push(e),
    });

    scheduler.start(0);
    advanceAudioClockAndTimers(600);
    scheduler.stop();
    const countAfterStop = events.length;
    advanceAudioClockAndTimers(1000);
    expect(events.length).toBe(countAfterStop); // no further ticks while stopped

    scheduler.start(audioClock);
    advanceAudioClockAndTimers(25);
    expect(events[events.length - 1].time).toBeCloseTo(audioClock - 0.025, 5);
    scheduler.stop();
  });

  it('a tempo change read via getTempoParams affects only ticks scheduled after the change', () => {
    const events: TickEvent[] = [];
    let bpmParams: TempoParams = { beatsPerBar: 4, secondsPerBeat: 1, subdivision: 'quarter' };
    const scheduler = new LookaheadScheduler({
      getCurrentTime: () => audioClock,
      getTempoParams: () => bpmParams,
      onTick: (e) => events.push(e),
    });

    scheduler.start(0);
    advanceAudioClockAndTimers(1000); // ticks at 0, 1 scheduled
    bpmParams = { beatsPerBar: 4, secondsPerBeat: 0.1, subdivision: 'quarter' };
    advanceAudioClockAndTimers(500);
    scheduler.stop();

    expect(events[0].time).toBe(0);
    expect(events[1].time).toBe(1);
    // after the tempo change, gaps should shrink to the new 0.1s interval
    const laterGaps = [];
    for (let i = 2; i < events.length; i++) {
      laterGaps.push(events[i].time - events[i - 1].time);
    }
    for (const gap of laterGaps) {
      expect(gap).toBeCloseTo(0.1, 5);
    }
  });
});
