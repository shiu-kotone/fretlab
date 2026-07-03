interface Props {
  /** Cents offset; may exceed ±50 in manual-fixed mode. Display is clamped. */
  cents: number;
  inTune: boolean;
}

const OK_ZONE_CENTS = 5;

export function CentsMeter({ cents, inTune }: Props) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clamped + 50) / 100) * 100;
  const okZoneWidthPercent = (OK_ZONE_CENTS / 50) * 50; // half-width of ±5 cents as % of the 100%-wide track

  return (
    <div style={{ padding: '0 8px' }}>
      <div style={{ position: 'relative', height: 12, borderRadius: 6, background: 'var(--line)' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${50 - okZoneWidthPercent}%`,
            width: `${okZoneWidthPercent * 2}%`,
            top: 0,
            bottom: 0,
            background: 'var(--ok)',
            opacity: 0.35,
            borderRadius: 6,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: -4,
            width: 2,
            height: 20,
            background: 'var(--string)',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          role="meter"
          aria-label="セントメーター"
          aria-valuemin={-50}
          aria-valuemax={50}
          aria-valuenow={Math.round(clamped)}
          style={{
            position: 'absolute',
            left: `${needlePercent}%`,
            top: -10,
            width: 4,
            height: 32,
            borderRadius: 2,
            background: inTune ? 'var(--ok)' : 'var(--accent)',
            transform: 'translateX(-50%)',
            transition: 'left 80ms ease-out, background 150ms ease-out',
            boxShadow: inTune ? '0 0 10px var(--ok)' : 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--line)', marginTop: 4 }}>
        <span>-50</span>
        <span>0</span>
        <span>+50</span>
      </div>
    </div>
  );
}
