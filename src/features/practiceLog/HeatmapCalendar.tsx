import type { DailyTotal } from '../../data/practiceLogTypes';
import { computeAchievedDates } from '../../data/practiceLogTypes';

const CELL = 12;
const GAP = 3;

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

  const width = weeks.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <svg viewBox={`-2 -2 ${width + 4} ${height + 4}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
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
