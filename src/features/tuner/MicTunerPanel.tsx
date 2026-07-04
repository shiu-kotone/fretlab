import { useTunerEngine } from './useTunerEngine';
import { CentsMeter } from './CentsMeter';
import { PermissionGuide } from './PermissionGuide';
import { useSettingsStore } from '../../stores/settingsStore';
import { useCustomTuningsStore } from '../../stores/customTuningsStore';
import { useMetronomeStore } from '../../stores/metronomeStore';
import { resolveTuning } from '../../theory/tuningResolver';
import { noteName } from '../../theory/pitch';
import { Button } from '../../components/ui/Button';

export function MicTunerPanel() {
  const a4 = useSettingsStore((s) => s.a4);
  const setA4 = useSettingsStore((s) => s.setA4);
  const noteNaming = useSettingsStore((s) => s.noteNaming);
  const currentTuningId = useSettingsStore((s) => s.currentTuningId);
  const customItems = useCustomTuningsStore((s) => s.items);
  const tuning = resolveTuning(currentTuningId, customItems);
  const metronomePlaying = useMetronomeStore((s) => s.isPlaying);

  const { permissionState, requestPermission, reading, fixedStringIndex, setFixedStringIndex, lastError } =
    useTunerEngine(tuning, a4);

  const granted = permissionState === 'granted';
  const highlightIndex = fixedStringIndex ?? reading.nearestStringIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      {metronomePlaying && (
        <p style={{ fontSize: 12, color: 'var(--warn)', margin: 0 }}>
          メトロノーム再生中はヘッドホンの使用を推奨します(マイクがクリック音を拾う場合があります)。
        </p>
      )}

      {permissionState === 'idle' && (
        <Button variant="primary" onClick={() => void requestPermission()}>
          マイクを許可してチューナーを開始
        </Button>
      )}

      {permissionState === 'requesting' && <p>マイクへのアクセスを確認中…</p>}

      {permissionState === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: 'var(--warn)', margin: 0 }}>マイクの初期化に失敗しました。</p>
          {lastError && (
            <p className="tabular-nums" style={{ fontSize: 11, color: 'var(--line)', margin: 0, wordBreak: 'break-all' }}>
              {lastError}
            </p>
          )}
          <Button style={{ alignSelf: 'flex-start' }} onClick={() => void requestPermission()}>
            もう一度試す
          </Button>
        </div>
      )}

      {permissionState === 'denied' && <PermissionGuide onRetry={() => void requestPermission()} />}

      {/*
       * SPEC §5.5 layout is shown as soon as the screen opens — dimmed and
       * non-interactive before permission is granted — so it's obvious what
       * this screen does instead of showing just a single button over blank
       * space (POLISH.md R2-6).
       */}
      <div style={{ opacity: granted ? 1 : 0.35, pointerEvents: granted ? 'auto' : 'none', display: 'flex', flexDirection: 'column', gap: 16 }} aria-hidden={!granted}>
        <div style={{ textAlign: 'center' }}>
          <div className="tabular-nums" style={{ fontSize: 64, color: granted && reading.inTune ? 'var(--ok)' : 'var(--accent)', lineHeight: 1 }}>
            {granted && reading.midi !== null ? noteName(reading.midi, noteNaming) : '--'}
            {granted && reading.confirmed && <span style={{ marginLeft: 8, fontSize: 32 }}>✓</span>}
          </div>
          <div className="tabular-nums" style={{ fontSize: 14, color: 'var(--string)' }}>
            {granted && reading.displayedFrequency !== null ? `${reading.displayedFrequency.toFixed(1)} Hz` : '—'}
          </div>
        </div>

        <CentsMeter cents={granted ? reading.cents : 0} inTune={granted && reading.inTune} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {tuning.map((midi, i) => {
            const isHighlighted = granted && highlightIndex === i;
            const isFixed = granted && fixedStringIndex === i;
            return (
              <button
                key={i}
                onClick={() => setFixedStringIndex(isFixed ? null : i)}
                style={{
                  minHeight: 64,
                  borderRadius: 10,
                  border: `1px solid ${isFixed ? 'var(--accent)' : 'var(--line)'}`,
                  background: isHighlighted ? 'var(--accent)' : 'var(--surface)',
                  color: isHighlighted ? 'var(--bg)' : 'var(--string)',
                  fontSize: 18,
                }}
              >
                {6 - i}弦
                <br />
                <span style={{ fontSize: 13 }}>{noteName(midi, noteNaming)}</span>
              </button>
            );
          })}
        </div>
        {granted && fixedStringIndex !== null && (
          <p style={{ fontSize: 11, color: 'var(--line)', textAlign: 'center', margin: 0 }}>手動固定モード: もう一度タップで解除</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--string)' }}>基準ピッチ</span>
        <Button aria-label="基準ピッチを下げる" onClick={() => setA4(a4 - 1)}>
          −
        </Button>
        <span className="tabular-nums">A4 = {a4}Hz</span>
        <Button aria-label="基準ピッチを上げる" onClick={() => setA4(a4 + 1)}>
          +
        </Button>
      </div>
    </div>
  );
}
