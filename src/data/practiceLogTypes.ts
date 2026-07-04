/** SPEC §5.7: features whose active/playback time is measured automatically. */
export type PracticeFeature = 'metronome' | 'progression' | 'fretboard' | 'chords' | 'tuner';

export const PRACTICE_FEATURES: PracticeFeature[] = ['metronome', 'progression', 'fretboard', 'chords', 'tuner'];

export const PRACTICE_FEATURE_LABELS: Record<PracticeFeature, string> = {
  metronome: 'メトロノーム',
  progression: 'コード進行',
  fretboard: '指板',
  chords: 'コードライブラリ',
  tuner: 'チューナー',
};

/** SPEC §5.7 manual-entry tag presets ("基礎練/曲練/理論 等"); users may add their own freely alongside these. */
export const PRESET_TAGS = ['基礎練', '曲練', '理論'];

export interface AutoPracticeRow {
  date: string; // YYYY-MM-DD
  feature: PracticeFeature;
  minutes: number;
}

export interface ManualPracticeRow {
  id?: number;
  date: string; // YYYY-MM-DD
  memo: string;
  minutes: number;
  tags: string[];
  createdAt: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local-time YYYY-MM-DD (never UTC — a day boundary should match the user's own day, not GMT's). */
export function dateStringOf(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayDateString(): string {
  return dateStringOf(new Date());
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return dateStringOf(new Date(y, m - 1, d + delta));
}

/** Parses a "YYYY-MM-DD" string as a local-time Date — never `new Date(str)`, which parses date-only ISO strings as UTC and can shift the displayed weekday near timezone edges. */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const WEEKDAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** `count` consecutive date strings, oldest first, ending at (and including) today. */
export function dateRangeEndingToday(count: number): string[] {
  const today = todayDateString();
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));
}

export interface DailyTotal {
  date: string;
  minutes: number;
}

/** Sums auto + manual minutes per day, restricted to (and always fully covering) `dates`. */
export function computeDailyTotals(auto: AutoPracticeRow[], manual: ManualPracticeRow[], dates: string[]): DailyTotal[] {
  const totals = new Map<string, number>(dates.map((d) => [d, 0]));
  for (const row of auto) {
    if (totals.has(row.date)) totals.set(row.date, totals.get(row.date)! + row.minutes);
  }
  for (const row of manual) {
    if (totals.has(row.date)) totals.set(row.date, totals.get(row.date)! + row.minutes);
  }
  return dates.map((date) => ({ date, minutes: totals.get(date) ?? 0 }));
}

export interface StreakInfo {
  /** Consecutive practiced days counting back from the end of the given (ascending, contiguous) range. */
  current: number;
  longest: number;
}

/** `dailyTotalsAscending` must be date-contiguous, oldest first; a day "counts" when minutes > 0. */
export function computeStreak(dailyTotalsAscending: DailyTotal[]): StreakInfo {
  let longest = 0;
  let running = 0;
  for (const day of dailyTotalsAscending) {
    if (day.minutes > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = dailyTotalsAscending.length - 1; i >= 0; i--) {
    if (dailyTotalsAscending[i].minutes > 0) current += 1;
    else break;
  }

  return { current, longest };
}

export interface FeatureBreakdownEntry {
  feature: string;
  label: string;
  minutes: number;
}

/** Per-feature totals (auto) plus one combined "手動記録" bucket for manual entries; zero-minute buckets are dropped. */
export function computeFeatureBreakdown(auto: AutoPracticeRow[], manual: ManualPracticeRow[]): FeatureBreakdownEntry[] {
  const totals = new Map<PracticeFeature, number>(PRACTICE_FEATURES.map((f) => [f, 0]));
  for (const row of auto) {
    totals.set(row.feature, (totals.get(row.feature) ?? 0) + row.minutes);
  }

  const entries: FeatureBreakdownEntry[] = PRACTICE_FEATURES.map((f) => ({
    feature: f,
    label: PRACTICE_FEATURE_LABELS[f],
    minutes: totals.get(f) ?? 0,
  }));

  const manualTotal = manual.reduce((sum, row) => sum + row.minutes, 0);
  if (manualTotal > 0) entries.push({ feature: 'manual', label: '手動記録', minutes: manualTotal });

  return entries.filter((e) => e.minutes > 0);
}

/** Dates (within `dailyTotals`) whose total met or exceeded the daily goal — SPEC §5.7 heatmap achievement ring. */
export function computeAchievedDates(dailyTotals: DailyTotal[], goalMinutes: number): Set<string> {
  return new Set(dailyTotals.filter((d) => d.minutes >= goalMinutes).map((d) => d.date));
}
