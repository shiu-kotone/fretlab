import { advance, createInitialState, type SchedulerState, type TempoParams, type TickEvent } from './beatPlan';

/** Look-ahead window, in seconds, within which events are scheduled ahead of playback (SPEC §4.4). */
export const SCHEDULE_AHEAD_TIME = 0.1;
/** Polling interval, in ms, for the scheduling loop (SPEC §4.4). */
export const TIMER_INTERVAL_MS = 25;

export interface LookaheadSchedulerOptions {
  /** Returns the current AudioContext.currentTime (the authoritative audio clock). */
  getCurrentTime: () => number;
  /** Returns the tempo/subdivision to use for the *next* tick. Read fresh on every tick. */
  getTempoParams: () => TempoParams;
  /** Invoked once per scheduled tick, with its absolute AudioContext time already assigned. */
  onTick: (event: TickEvent) => void;
  scheduleAheadTime?: number;
  timerIntervalMs?: number;
}

/**
 * Polls at a fixed wall-clock interval but schedules events against the audio
 * clock (AudioContext.currentTime), never via setTimeout-per-note. This is the
 * "A Tale of Two Clocks" pattern mandated by SPEC §4.4 to keep inter-beat jitter
 * within the ±3ms budget (SPEC §5.4).
 */
export class LookaheadScheduler {
  private state: SchedulerState | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly opts: LookaheadSchedulerOptions & {
    scheduleAheadTime: number;
    timerIntervalMs: number;
  };

  constructor(opts: LookaheadSchedulerOptions) {
    this.opts = {
      scheduleAheadTime: opts.scheduleAheadTime ?? SCHEDULE_AHEAD_TIME,
      timerIntervalMs: opts.timerIntervalMs ?? TIMER_INTERVAL_MS,
      ...opts,
    };
  }

  get isRunning(): boolean {
    return this.timerId !== null;
  }

  start(startTime: number): void {
    if (this.isRunning) return;
    this.state = createInitialState(startTime);
    this.timerId = setInterval(() => this.tick(), this.opts.timerIntervalMs);
    this.tick();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.state = null;
  }

  private tick(): void {
    if (!this.state) return;
    const horizon = this.opts.getCurrentTime() + this.opts.scheduleAheadTime;
    while (this.state.nextTickTime < horizon) {
      const params = this.opts.getTempoParams();
      const { event, next } = advance(this.state, params);
      this.opts.onTick(event);
      this.state = next;
    }
  }
}
