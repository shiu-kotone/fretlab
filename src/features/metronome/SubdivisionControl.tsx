import { useMetronomeStore } from '../../stores/metronomeStore';
import type { Subdivision } from '../../audio/beatPlan';
import { Chip } from '../../components/ui/Chip';

const OPTIONS: { id: Subdivision; label: string }[] = [
  { id: 'quarter', label: '4分' },
  { id: 'eighth', label: '8分' },
  { id: 'triplet', label: '3連' },
  { id: 'sixteenth', label: '16分' },
  { id: 'shuffle', label: 'シャッフル' },
];

export function SubdivisionControl() {
  const subdivision = useMetronomeStore((s) => s.subdivision);
  const setSubdivision = useMetronomeStore((s) => s.setSubdivision);
  const subVolume = useMetronomeStore((s) => s.subVolume);
  const setSubVolume = useMetronomeStore((s) => s.setSubVolume);

  return (
    <section style={{ padding: '8px 16px' }}>
      <h3 style={{ fontSize: 13, color: 'var(--string)', margin: '0 0 8px' }}>音価(サブディビジョン)</h3>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {OPTIONS.map((opt) => (
          <Chip key={opt.id} active={subdivision === opt.id} onClick={() => setSubdivision(opt.id)}>
            {opt.label}
          </Chip>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 13, minWidth: 80 }}>サブ音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={subVolume}
          onChange={(e) => setSubVolume(Number(e.target.value))}
          className="slider"
          disabled={subdivision === 'quarter'}
        />
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'right' }}>
          {subVolume}%
        </span>
      </label>
    </section>
  );
}
