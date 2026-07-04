import { useEffect, useMemo, useState } from 'react';
import { usePracticeLogStore } from '../../stores/practiceLogStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { dateRangeEndingToday, computeDailyTotals, computeStreak, computeFeatureBreakdown } from '../../data/practiceLogTypes';
import { WeeklyBarChart } from './WeeklyBarChart';
import { HeatmapCalendar } from './HeatmapCalendar';
import { FeatureBreakdown } from './FeatureBreakdown';
import { ManualEntryForm } from './ManualEntryForm';
import { Button } from '../../components/ui/Button';

const WEEK_DAYS = 7;
const HEATMAP_DAYS = 84; // 12 weeks

/** SPEC §5.7 タブ: ラボ > 「記録」. */
export function PracticeLogView() {
  const autoRows = usePracticeLogStore((s) => s.autoRows);
  const manualRows = usePracticeLogStore((s) => s.manualRows);
  const loaded = usePracticeLogStore((s) => s.loaded);
  const load = usePracticeLogStore((s) => s.load);
  const addManualEntry = usePracticeLogStore((s) => s.addManualEntry);
  const removeManualEntry = usePracticeLogStore((s) => s.removeManualEntry);

  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const setDailyGoalMinutes = useSettingsStore((s) => s.setDailyGoalMinutes);

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const weekDates = useMemo(() => dateRangeEndingToday(WEEK_DAYS), []);
  const heatmapDates = useMemo(() => dateRangeEndingToday(HEATMAP_DAYS), []);
  const weekTotals = useMemo(() => computeDailyTotals(autoRows, manualRows, weekDates), [autoRows, manualRows, weekDates]);
  const heatmapTotals = useMemo(() => computeDailyTotals(autoRows, manualRows, heatmapDates), [autoRows, manualRows, heatmapDates]);
  const streak = useMemo(() => computeStreak(heatmapTotals), [heatmapTotals]);
  const breakdown = useMemo(() => computeFeatureBreakdown(autoRows, manualRows), [autoRows, manualRows]);
  const todayTotal = weekTotals[weekTotals.length - 1]?.minutes ?? 0;

  const sortedManual = [...manualRows].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div style={{ padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--line)' }}>今日の合計</div>
        <div className="tabular-nums" style={{ fontSize: 40, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          {Math.round(todayTotal)}分
        </div>
      </div>

      <section>
        <h3 style={headingStyle}>今週</h3>
        <WeeklyBarChart totals={weekTotals} />
      </section>

      <section>
        <h3 style={headingStyle}>
          過去12週間(ストリーク: 現在{streak.current}日 / 最長{streak.longest}日)
        </h3>
        <HeatmapCalendar totals={heatmapTotals} goalMinutes={dailyGoalMinutes} />
      </section>

      <section style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ ...headingStyle, margin: 0 }}>目標: 1日</h3>
        <Button size="small" onClick={() => setDailyGoalMinutes(dailyGoalMinutes - 5)}>
          −
        </Button>
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'center', color: 'var(--string)' }}>
          {dailyGoalMinutes}
        </span>
        <Button size="small" onClick={() => setDailyGoalMinutes(dailyGoalMinutes + 5)}>
          +
        </Button>
        <span style={{ fontSize: 13, color: 'var(--string)' }}>分</span>
      </section>

      {breakdown.length > 0 && (
        <section>
          <h3 style={headingStyle}>機能別内訳</h3>
          <FeatureBreakdown entries={breakdown} />
        </section>
      )}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ ...headingStyle, margin: 0 }}>手動記録</h3>
          {!showForm && (
            <Button size="small" onClick={() => setShowForm(true)}>
              + 追加
            </Button>
          )}
        </div>

        {showForm && (
          <ManualEntryForm
            onAdd={(entry) => {
              void addManualEntry(entry);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {sortedManual.length === 0 && !showForm && <p style={{ color: 'var(--line)', fontSize: 13 }}>まだ手動記録がありません。</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortedManual.map((entry) => (
            <div key={entry.id} style={rowStyle}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--string)' }}>{entry.memo || '(メモなし)'}</div>
                <div style={{ fontSize: 11, color: 'var(--line)' }}>
                  {entry.date} ・ {entry.minutes}分{entry.tags.length > 0 ? ` ・ ${entry.tags.join(', ')}` : ''}
                </div>
              </div>
              <Button size="small" variant="danger" onClick={() => void removeManualEntry(entry.id!)}>
                削除
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const headingStyle = { fontSize: 13, color: 'var(--line)', margin: '0 0 8px' };

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--surface)',
  borderRadius: 8,
  padding: '8px 12px',
  border: '1px solid var(--line)',
};
