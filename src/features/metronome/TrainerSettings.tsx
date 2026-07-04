import { useMetronomeStore } from '../../stores/metronomeStore';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';

export function TrainerSettings() {
  const speedTrainer = useMetronomeStore((s) => s.speedTrainer);
  const setSpeedTrainer = useMetronomeStore((s) => s.setSpeedTrainer);
  const muteBars = useMetronomeStore((s) => s.muteBars);
  const setMuteBars = useMetronomeStore((s) => s.setMuteBars);

  return (
    <section style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 13, color: 'var(--string)', margin: 0 }}>トレーナー機能</h3>

      <div style={panelStyle}>
        <label style={toggleRow}>
          <span>スピードトレーナー</span>
          <Toggle checked={speedTrainer.enabled} onChange={(e) => setSpeedTrainer({ enabled: e.target.checked })} aria-label="スピードトレーナー" />
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', opacity: speedTrainer.enabled ? 1 : 0.4 }}>
          <NumberField
            label="N小節ごとに"
            value={speedTrainer.everyNBars}
            min={1}
            max={16}
            disabled={!speedTrainer.enabled}
            onChange={(v) => setSpeedTrainer({ everyNBars: v })}
          />
          <NumberField
            label="+M BPM"
            value={speedTrainer.stepBpm}
            min={1}
            max={20}
            disabled={!speedTrainer.enabled}
            onChange={(v) => setSpeedTrainer({ stepBpm: v })}
          />
          <NumberField
            label="上限 X BPM"
            value={speedTrainer.capBpm}
            min={20}
            max={300}
            disabled={!speedTrainer.enabled}
            onChange={(v) => setSpeedTrainer({ capBpm: v })}
          />
        </div>
      </div>

      <div style={panelStyle}>
        <label style={toggleRow}>
          <span>ミュート小節</span>
          <Toggle checked={muteBars.enabled} onChange={(e) => setMuteBars({ enabled: e.target.checked })} aria-label="ミュート小節" />
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', opacity: muteBars.enabled ? 1 : 0.4 }}>
          <NumberField
            label="A小節鳴らす"
            value={muteBars.playBars}
            min={1}
            max={8}
            disabled={!muteBars.enabled}
            onChange={(v) => setMuteBars({ playBars: v })}
          />
          <NumberField
            label="B小節ミュート"
            value={muteBars.muteBars}
            min={1}
            max={8}
            disabled={!muteBars.enabled}
            onChange={(v) => setMuteBars({ muteBars: v })}
          />
        </div>
      </div>
    </section>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}

function NumberField({ label, value, min, max, disabled, onChange }: NumberFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--string)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button size="small" disabled={disabled} aria-label={`${label}を減らす`} onClick={() => onChange(value - 1)}>
          −
        </Button>
        <span className="tabular-nums" style={{ minWidth: 32, textAlign: 'center' }}>
          {value}
        </span>
        <Button size="small" disabled={disabled} aria-label={`${label}を増やす`} onClick={() => onChange(value + 1)}>
          +
        </Button>
      </div>
      <span style={{ fontSize: 10, color: 'var(--line)' }}>
        {min}–{max}
      </span>
    </div>
  );
}

const panelStyle = {
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
};

const toggleRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minHeight: 44,
};
