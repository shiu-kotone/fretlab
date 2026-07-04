import { describe, it, expect } from 'vitest';
import {
  dateStringOf,
  addDays,
  parseDateString,
  dateRangeEndingToday,
  computeDailyTotals,
  computeStreak,
  computeFeatureBreakdown,
  computeAchievedDates,
  type AutoPracticeRow,
  type ManualPracticeRow,
} from './practiceLogTypes';

describe('dateStringOf / addDays', () => {
  it('formats local YYYY-MM-DD', () => {
    expect(dateStringOf(new Date(2026, 6, 4))).toBe('2026-07-04'); // month is 0-based
  });

  it('adds days, crossing month/year boundaries', () => {
    expect(addDays('2026-07-04', 1)).toBe('2026-07-05');
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-07-04', -4)).toBe('2026-06-30');
  });
});

describe('parseDateString', () => {
  it('round-trips through dateStringOf as a local-time date (no UTC shift)', () => {
    const d = parseDateString('2026-07-04');
    expect(dateStringOf(d)).toBe('2026-07-04');
    expect(d.getDate()).toBe(4);
    expect(d.getMonth()).toBe(6);
    expect(d.getFullYear()).toBe(2026);
  });
});

describe('dateRangeEndingToday', () => {
  it('returns N contiguous dates ending today, oldest first', () => {
    const range = dateRangeEndingToday(7);
    expect(range).toHaveLength(7);
    expect(range[6]).toBe(addDays(range[0], 6));
    for (let i = 1; i < range.length; i++) {
      expect(addDays(range[i - 1], 1)).toBe(range[i]);
    }
  });
});

describe('computeDailyTotals', () => {
  const dates = ['2026-07-01', '2026-07-02', '2026-07-03'];

  it('sums auto + manual minutes per day and zero-fills missing days', () => {
    const auto: AutoPracticeRow[] = [
      { date: '2026-07-01', feature: 'metronome', minutes: 10 },
      { date: '2026-07-01', feature: 'fretboard', minutes: 5 },
    ];
    const manual: ManualPracticeRow[] = [{ date: '2026-07-02', memo: '', minutes: 20, tags: [], createdAt: 0 }];
    const totals = computeDailyTotals(auto, manual, dates);
    expect(totals).toEqual([
      { date: '2026-07-01', minutes: 15 },
      { date: '2026-07-02', minutes: 20 },
      { date: '2026-07-03', minutes: 0 },
    ]);
  });

  it('ignores rows outside the given date range', () => {
    const auto: AutoPracticeRow[] = [{ date: '2099-01-01', feature: 'tuner', minutes: 99 }];
    const totals = computeDailyTotals(auto, [], dates);
    expect(totals.every((d) => d.minutes === 0)).toBe(true);
  });
});

describe('computeStreak', () => {
  it('counts the current streak backwards from the end of the range', () => {
    const totals = [0, 5, 10, 0, 20, 15].map((minutes, i) => ({ date: `d${i}`, minutes }));
    expect(computeStreak(totals).current).toBe(2); // last two days (20,15) are non-zero
  });

  it('finds the longest historical streak, not just the current one', () => {
    const totals = [10, 10, 10, 0, 5, 0].map((minutes, i) => ({ date: `d${i}`, minutes }));
    expect(computeStreak(totals).longest).toBe(3);
    expect(computeStreak(totals).current).toBe(0);
  });

  it('an all-zero range has a streak of 0', () => {
    const totals = [0, 0, 0].map((minutes, i) => ({ date: `d${i}`, minutes }));
    expect(computeStreak(totals)).toEqual({ current: 0, longest: 0 });
  });

  it('an all-practiced range streaks the full length', () => {
    const totals = [5, 5, 5].map((minutes, i) => ({ date: `d${i}`, minutes }));
    expect(computeStreak(totals)).toEqual({ current: 3, longest: 3 });
  });
});

describe('computeFeatureBreakdown', () => {
  it('sums per-feature auto minutes and a combined manual bucket', () => {
    const auto: AutoPracticeRow[] = [
      { date: '2026-07-01', feature: 'metronome', minutes: 10 },
      { date: '2026-07-02', feature: 'metronome', minutes: 5 },
      { date: '2026-07-01', feature: 'tuner', minutes: 7 },
    ];
    const manual: ManualPracticeRow[] = [{ date: '2026-07-01', memo: '', minutes: 30, tags: [], createdAt: 0 }];
    const breakdown = computeFeatureBreakdown(auto, manual);
    expect(breakdown).toEqual(
      expect.arrayContaining([
        { feature: 'metronome', label: 'メトロノーム', minutes: 15 },
        { feature: 'tuner', label: 'チューナー', minutes: 7 },
        { feature: 'manual', label: '手動記録', minutes: 30 },
      ]),
    );
  });

  it('drops zero-minute features entirely', () => {
    const breakdown = computeFeatureBreakdown([{ date: '2026-07-01', feature: 'chords', minutes: 5 }], []);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].feature).toBe('chords');
  });
});

describe('computeAchievedDates', () => {
  it('returns dates that met or exceeded the goal', () => {
    const totals = [
      { date: 'a', minutes: 19 },
      { date: 'b', minutes: 20 },
      { date: 'c', minutes: 25 },
    ];
    expect(computeAchievedDates(totals, 20)).toEqual(new Set(['b', 'c']));
  });
});
