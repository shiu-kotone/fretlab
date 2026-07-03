/** SPEC §5.4: 2.5s of inactivity resets the tap sequence. */
export const TAP_RESET_TIMEOUT_MS = 2500;
/** SPEC §5.4: tempo is the average of the most recent 4 taps. */
export const TAP_HISTORY_SIZE = 4;

export interface TapTempoState {
  taps: number[];
}

export function initialTapTempoState(): TapTempoState {
  return { taps: [] };
}

function clampBpm(bpm: number): number {
  return Math.min(300, Math.max(20, bpm));
}

/**
 * Registers a tap at `nowMs` and returns the updated state plus the derived BPM
 * (null until at least 2 taps are available to form an interval).
 */
export function registerTap(state: TapTempoState, nowMs: number): { state: TapTempoState; bpm: number | null } {
  const lastTap = state.taps[state.taps.length - 1];
  const isStale = lastTap !== undefined && nowMs - lastTap > TAP_RESET_TIMEOUT_MS;
  const taps = (isStale ? [nowMs] : [...state.taps, nowMs]).slice(-TAP_HISTORY_SIZE);

  if (taps.length < 2) {
    return { state: { taps }, bpm: null };
  }

  const intervals: number[] = [];
  for (let i = 1; i < taps.length; i++) {
    intervals.push(taps[i] - taps[i - 1]);
  }
  const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = clampBpm(Math.round(60000 / avgIntervalMs));

  return { state: { taps }, bpm };
}
