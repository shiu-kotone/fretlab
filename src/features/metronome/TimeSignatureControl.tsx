import { useMetronomeStore, type TimeSignature, type TimeSigUnit } from '../../stores/metronomeStore';

const QUICK_SIGS: TimeSignature[] = [
  { beats: 2, unit: 4 },
  { beats: 3, unit: 4 },
  { beats: 4, unit: 4 },
  { beats: 5, unit: 4 },
  { beats: 6, unit: 8 },
  { beats: 7, unit: 8 },
  { beats: 12, unit: 8 },
];

const UNITS: TimeSigUnit[] = [2, 4, 8, 16];

export function TimeSignatureControl() {
  const timeSig = useMetronomeStore((s) => s.timeSig);
  const setTimeSig = useMetronomeStore((s) => s.setTimeSig);

  const isActive = (sig: TimeSignature) => sig.beats === timeSig.beats && sig.unit === timeSig.unit;

  return (
    <section style={{ padding: '8px 16px' }}>
      <h3 style={heading}>拍子</h3>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {QUICK_SIGS.map((sig) => (
          <button
            key={`${sig.beats}/${sig.unit}`}
            onClick={() => setTimeSig(sig)}
            style={chipStyle(isActive(sig))}
          >
            {sig.beats}/{sig.unit}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={smallButtonStyle} aria-label="分子を減らす" onClick={() => setTimeSig({ ...timeSig, beats: timeSig.beats - 1 })}>
            −
          </button>
          <span className="tabular-nums" style={{ minWidth: 24, textAlign: 'center' }}>
            {timeSig.beats}
          </span>
          <button style={smallButtonStyle} aria-label="分子を増やす" onClick={() => setTimeSig({ ...timeSig, beats: timeSig.beats + 1 })}>
            +
          </button>
        </div>
        <span>/</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {UNITS.map((unit) => (
            <button
              key={unit}
              onClick={() => setTimeSig({ ...timeSig, unit })}
              style={chipStyle(timeSig.unit === unit)}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const heading = { fontSize: 13, color: 'var(--string)', margin: '0 0 8px' };

function chipStyle(active: boolean) {
  return {
    minHeight: 44,
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? 'var(--bg)' : 'var(--string)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  };
}

const smallButtonStyle = {
  minWidth: 44,
  minHeight: 44,
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
};
