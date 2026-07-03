import { useTunerEngine } from './useTunerEngine';
import { CentsMeter } from './CentsMeter';
import { PermissionGuide } from './PermissionGuide';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { useMetronomeStore } from '../../stores/metronomeStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { noteName } from '../../theory/pitch';

export function MicTunerPanel() {
  const a4 = useSettingsStore((s) => s.a4);
  const setA4 = useSettingsStore((s) => s.setA4);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const customItems = useCustomTuningsStore((s) => s.items);
  const tuning = resolveTuning(currentTuningId, customItems);
  const metronomePlaying = useMetronomeStore((s) => s.isPlaying);

  const { permissionState, requestPermission, reading, fixedStringIndex, setFixedStringIndex } = useTunerEngine(
    tuning,
    a4,
  );

  const highlightIndex = fixedStringIndex ?? reading.nearestStringIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      {metronomePlaying && (
        <p style={{ fontSize: 12, color: 'var(--warn)', margin: 0 }}>
          メトロノーム再生中はヘッドホンの使用を推奨します(マイクがクリック音を拾う場合があります)。
        </p>
      )}

      {permissionState === 'idle' && (
        <button
          onClick={() => void requestPermission()}
          style={{
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: 'var(--bg)',
          }}
        >
          マイクを許可してチューナーを開始
        </button>
      )}

      {permissionState === 'requesting' && <p>マイクへのアクセスを確認中…</p>}

      {permissionState === 'error' && (
        <div>
          <p style={{ color: 'var(--warn)' }}>マイクの初期化に失敗しました。</p>
          <button onClick={() => void requestPermission()}>もう一度試す</button>
        </div>
      )}

      {permissionState === 'denied' && <PermissionGuide onRetry={() => void requestPermission()} />}

      {permissionState === 'granted' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div className="tabular-nums" style={{ fontSize: 64, color: reading.inTune ? 'var(--ok)' : 'var(--accent)', lineHeight: 1 }}>
              {reading.midi !== null ? noteName(reading.midi, noteNaming) : '--'}
              {reading.confirmed && <span style={{ marginLeft: 8, fontSize: 32 }}>✓</span>}
            </div>
            <div className="tabular-nums" style={{ fontSize: 14, color: 'var(--string)' }}>
              {reading.displayedFrequency !== null ? `${reading.displayedFrequency.toFixed(1)} Hz` : '—'}
            </div>
          </div>

          <CentsMeter cents={reading.cents} inTune={reading.inTune} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {tuning.map((midi, i) => {
              const isHighlighted = highlightIndex === i;
              const isFixed = fixedStringIndex === i;
              return (
                <button
                  key={i}
                  onClick={() => setFixedStringIndex(isFixed ? null : i)}
                  style={{
                    minWidth: 48,
                    minHeight: 44,
                    borderRadius: 8,
                    border: `1px solid ${isFixed ? 'var(--accent)' : 'var(--line)'}`,
                    background: isHighlighted ? 'var(--accent)' : 'var(--surface)',
                    color: isHighlighted ? 'var(--bg)' : 'var(--string)',
                  }}
                >
                  {6 - i}弦
                  <br />
                  <span style={{ fontSize: 11 }}>{noteName(midi, noteNaming)}</span>
                </button>
              );
            })}
          </div>
          {fixedStringIndex !== null && (
            <p style={{ fontSize: 11, color: 'var(--line)', textAlign: 'center', margin: 0 }}>
              手動固定モード: もう一度タップで解除
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--string)' }}>基準ピッチ</span>
            <button style={a4ButtonStyle} aria-label="基準ピッチを下げる" onClick={() => setA4(a4 - 1)}>
              −
            </button>
            <span className="tabular-nums">A4 = {a4}Hz</span>
            <button style={a4ButtonStyle} aria-label="基準ピッチを上げる" onClick={() => setA4(a4 + 1)}>
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const a4ButtonStyle = {
  minWidth: 32,
  minHeight: 32,
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--string)',
};
