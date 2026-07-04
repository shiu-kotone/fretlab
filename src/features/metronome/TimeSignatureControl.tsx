import { useMetronomeStore, type TimeSignature, type TimeSigUnit } from '../../stores/metronomeStore';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';

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
          <Chip key={`${sig.beats}/${sig.unit}`} active={isActive(sig)} onClick={() => setTimeSig(sig)}>
            {sig.beats}/{sig.unit}
          </Chip>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="small" aria-label="分子を減らす" onClick={() => setTimeSig({ ...timeSig, beats: timeSig.beats - 1 })}>
            −
          </Button>
          <span className="tabular-nums" style={{ minWidth: 24, textAlign: 'center' }}>
            {timeSig.beats}
          </span>
          <Button size="small" aria-label="分子を増やす" onClick={() => setTimeSig({ ...timeSig, beats: timeSig.beats + 1 })}>
            +
          </Button>
        </div>
        <span>/</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {UNITS.map((unit) => (
            <Chip key={unit} active={timeSig.unit === unit} onClick={() => setTimeSig({ ...timeSig, unit })}>
              {unit}
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}

const heading = { fontSize: 13, color: 'var(--string)', margin: '0 0 8px' };
