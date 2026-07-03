/**
 * SPEC §5.5: "信頼度が低いフレームは表示を更新しない(ちらつき防止)。
 * 直近5フレームの中央値でスムージング". A null frequency (YIN found no
 * period past its threshold) counts as low-confidence and leaves the
 * display state untouched rather than resetting it.
 */

export const SMOOTHING_WINDOW = 5;

export interface SmoothedPitchState {
  history: number[];
  displayedFrequency: number | null;
}

export function initialSmoothedPitchState(): SmoothedPitchState {
  return { history: [], displayedFrequency: null };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function updateSmoothedPitch(state: SmoothedPitchState, frequency: number | null): SmoothedPitchState {
  if (frequency === null) {
    return state;
  }
  const history = [...state.history, frequency].slice(-SMOOTHING_WINDOW);
  return { history, displayedFrequency: median(history) };
}
