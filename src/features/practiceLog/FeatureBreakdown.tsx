import type { FeatureBreakdownEntry } from '../../data/practiceLogTypes';

/** SPEC §5.7 "機能別内訳(ドーナツまたは横棒)" — horizontal bars. */
export function FeatureBreakdown({ entries }: { entries: FeatureBreakdownEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.minutes));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map((e) => (
        <div key={e.feature} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--string)', minWidth: 92, flexShrink: 0 }}>{e.label}</span>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: `${(e.minutes / max) * 100}%`, height: '100%', background: 'var(--accent)' }} />
          </div>
          <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--line)', minWidth: 40, textAlign: 'right', flexShrink: 0 }}>
            {Math.round(e.minutes)}分
          </span>
        </div>
      ))}
    </div>
  );
}
