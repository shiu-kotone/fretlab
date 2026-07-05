import { useMetronomeStore } from '../../stores/metronomeStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMetronomeEngine } from './useMetronomeEngine';
import { AccentEditor } from './AccentEditor';
import { BpmControl } from './BpmControl';
import { TimeSignatureControl } from './TimeSignatureControl';
import { SubdivisionControl } from './SubdivisionControl';
import { ToneSelector } from './ToneSelector';
import { TrainerSettings } from './TrainerSettings';
import { Toggle } from '../../components/ui/Toggle';

export function MetronomeView() {
  const { isPlaying, flash, toggle } = useMetronomeEngine();
  const fullScreenFlash = useMetronomeStore((s) => s.fullScreenFlash);
  const setFullScreenFlash = useMetronomeStore((s) => s.setFullScreenFlash);
  const wakeLockEnabled = useSettingsStore((s) => s.wakeLockEnabled);
  const setWakeLockEnabled = useSettingsStore((s) => s.setWakeLockEnabled);

  const showFullFlash = fullScreenFlash && flash?.isMainBeat && flash.level !== 'mute';

  return (
    <div style={{ position: 'relative', paddingBottom: 32 }}>
      {showFullFlash && (
        <div
          key={flash?.key}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--accent)',
            opacity: 0.35,
            animation: 'metronome-flash 120ms ease-out',
            pointerEvents: 'none',
          }}
        />
      )}

      <AccentEditor flash={flash} />
      <BpmControl />

      <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={toggle}
          className={`btn ${isPlaying ? '' : 'btn-primary'}`}
          style={{
            minWidth: 120,
            minHeight: 56,
            borderRadius: 28,
            fontSize: 18,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            ...(isPlaying ? { background: 'var(--warn)', borderColor: 'var(--warn)', color: 'var(--bg)' } : {}),
          }}
        >
          {isPlaying ? '停止' : '再生'}
        </button>
      </div>

      <TimeSignatureControl />
      <SubdivisionControl />
      <ToneSelector />

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
          <span>全画面フラッシュ(視覚メトロノーム)</span>
          <Toggle checked={fullScreenFlash} onChange={(e) => setFullScreenFlash(e.target.checked)} aria-label="全画面フラッシュ" />
        </label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
          <span>画面を消灯しない(再生中)</span>
          <Toggle checked={wakeLockEnabled} onChange={(e) => setWakeLockEnabled(e.target.checked)} aria-label="画面を消灯しない" />
        </label>
      </div>

      <TrainerSettings />
    </div>
  );
}
