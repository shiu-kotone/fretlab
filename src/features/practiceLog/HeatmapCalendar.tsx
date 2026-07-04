import type { DailyTotal } from '../../data/practiceLogTypes';
import { computeAchievedDates, parseDateString, WEEKDAY_LABELS_JA } from '../../data/practiceLogTypes';

const CELL = 12;
const GAP = 3;
const LEFT_LABEL_WIDTH = 16;
const TOP_LABEL_HEIGHT = 12;
/** Thinned to avoid clutter — every row's weekday is fixed across columns since each column is exactly 7 days later than the previous. */
const SHOWN_WEEKDAYS = new Set([1, 4]); // 月, 木

function intensityLevel(minutes: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  const ratio = minutes / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const LEVEL_OPACITY = [0.15, 0.35, 0.55, 0.78, 1];

/** SPEC §5.7 "過去12週のカレンダーヒートマップ" — 12 weeks x 7 days, goal days get an accent ring. */
export function HeatmapCalendar({ totals, goalMinutes }: { totals: DailyTotal[]; goalMinutes: number }) {
  const weeks: DailyTotal[][] = [];
  for (let i = 0; i < totals.length; i += 7) weeks.push(totals.slice(i, i + 7));

  const max = Math.max(1, ...totals.map((t) => t.minutes));
  const achieved = computeAchievedDates(totals, goalMinutes);

  const gridWidth = weeks.length * (CELL + GAP);
  const gridHeight = 7 * (CELL + GAP);
  const firstWeekday = totals.length > 0 ? parseDateString(totals[0].date).getDay() : 0;

  // Each week-column's first day tells us its month; label only the columns where the month changes.
  let lastMonth = -1;
  const monthLabels: { wi: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    const month = parseDateString(week[0].date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ wi, label: `${month + 1}月` });
      lastMonth = month;
    }
  });

  return (
    <svg
      viewBox={`${-LEFT_LABEL_WIDTH - 2} ${-TOP_LABEL_HEIGHT - 2} ${gridWidth + LEFT_LABEL_WIDTH + 4} ${gridHeight + TOP_LABEL_HEIGHT + 4}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {Array.from({ length: 7 }, (_, di) => di)
        .filter((di) => SHOWN_WEEKDAYS.has((firstWeekday + di) % 7))
        .map((di) => (
          <text key={di} x={-4} y={di * (CELL + GAP) + CELL - 2} textAnchor="end" fontSize={9} fill="var(--line)">
            {WEEKDAY_LABELS_JA[(firstWeekday + di) % 7]}
          </text>
        ))}

      {monthLabels.map(({ wi, label }) => (
        <text key={wi} x={wi * (CELL + GAP)} y={-4} fontSize={9} fill="var(--line)">
          {label}
        </text>
      ))}

      {weeks.map((week, wi) =>
        week.map((day, di) => {
          const level = intensityLevel(day.minutes, max);
          const x = wi * (CELL + GAP);
          const y = di * (CELL + GAP);
          return (
            <g key={day.date}>
              <rect x={x} y={y} width={CELL} height={CELL} rx={2} fill="var(--accent)" opacity={LEVEL_OPACITY[level]} />
              {level === 0 && <rect x={x} y={y} width={CELL} height={CELL} rx={2} fill="none" stroke="var(--line)" strokeWidth={1} />}
              {achieved.has(day.date) && (
                <rect x={x - 1.5} y={y - 1.5} width={CELL + 3} height={CELL + 3} rx={3} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
