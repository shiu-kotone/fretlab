import type { DailyTotal } from '../../data/practiceLogTypes';
import { parseDateString, todayDateString, WEEKDAY_LABELS_JA } from '../../data/practiceLogTypes';

const WIDTH = 320;
const CHART_HEIGHT = 100;
const BAR_GAP = 8;
const LABEL_HEIGHT = 20;

/** SPEC §5.7 "今週の日別棒グラフ" — hand-rolled SVG, no chart library. */
export function WeeklyBarChart({ totals }: { totals: DailyTotal[] }) {
  const max = Math.max(1, ...totals.map((t) => t.minutes));
  const barWidth = (WIDTH - BAR_GAP * (totals.length - 1)) / totals.length;
  const today = todayDateString();

  return (
    <svg viewBox={`0 0 ${WIDTH} ${CHART_HEIGHT + LABEL_HEIGHT}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {totals.map((t, i) => {
        const barHeight = Math.max(2, (t.minutes / max) * CHART_HEIGHT);
        const x = i * (barWidth + BAR_GAP);
        const y = CHART_HEIGHT - barHeight;
        const isToday = t.date === today;
        const weekday = WEEKDAY_LABELS_JA[parseDateString(t.date).getDay()];
        return (
          <g key={t.date}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill={isToday ? 'var(--accent)' : 'var(--string)'} opacity={t.minutes > 0 ? (isToday ? 1 : 0.7) : 0.2} />
            <text x={x + barWidth / 2} y={CHART_HEIGHT + 14} textAnchor="middle" fontSize={11} fill={isToday ? 'var(--accent)' : 'var(--line)'}>
              {weekday}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
